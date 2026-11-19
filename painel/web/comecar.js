'use strict';
// Tela única do painel: Tema → Mídias → Pedir a edição (Claude Code embutido).
const T = location.hash.slice(1);
const H = {'content-type': 'application/json', 'x-painel-token': T};
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const enc = encodeURIComponent;
const guardar = (k, v) => { try { v == null ? localStorage.removeItem(`painel:${k}`) : localStorage.setItem(`painel:${k}`, v); } catch {} };
const lembrar = (k) => { try { return localStorage.getItem(`painel:${k}`); } catch { return null; } };

const api = async (url, corpo) => {
	const r = await fetch(url, corpo === undefined ? {headers: H} : {method: 'POST', headers: H, body: JSON.stringify(corpo)});
	const j = await r.json().catch(() => ({}));
	if (!r.ok || j.erro) throw new Error(j.erro || `Erro ${r.status}`);
	return j;
};
let toastT;
const toast = (msg) => {
	const el = $('#toast');
	el.textContent = msg;
	el.classList.add('on');
	clearTimeout(toastT);
	toastT = setTimeout(() => el.classList.remove('on'), 4200);
};
const tamanho = (b) => (b >= 1e9 ? `${(b / 1e9).toFixed(1)} GB` : b >= 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`);

const S = {tema: null, formato: 'vertical', projeto: null, temas: []};

// ---------- Etapas ----------
let passoAtual = 1;
const irPara = (n) => {
	passoAtual = n;
	for (const i of [1, 2, 3]) $(`#p${i}`).hidden = i !== n;
	for (const li of $$('#passos li')) {
		const i = Number(li.dataset.passo);
		li.classList.toggle('atual', i === n);
		li.classList.toggle('feito', i < n);
	}
	scrollTo(0, 0);
	if (n === 2) abrirMidias();
	if (n === 3) abrirPedido();
};

// ---------- 1 · Tema ----------
const desenharTemas = () => {
	const el = $('#temas');
	if (!S.temas.length) { el.innerHTML = '<div class="carregando">Nenhum tema encontrado.</div>'; return; }
	el.innerHTML = S.temas
		.map((t) => `<button type="button" class="tema" role="radio" data-id="${esc(t.id)}" aria-checked="${S.tema === t.id}">
			<b>${esc(t.nome)}</b><span>${esc(t.descricao || 'Sem descrição.')}</span>
			<small>${t.regras ? `${t.regras} regra${t.regras > 1 ? 's' : ''} aprendida${t.regras > 1 ? 's' : ''}` : 'Ainda sem regras aprendidas'}</small></button>`)
		.join('');
	$('#seguir1').disabled = !S.tema;
};
$('#temas').addEventListener('click', (e) => {
	const b = e.target.closest('.tema');
	if (!b) return;
	S.tema = b.dataset.id;
	guardar('tema', S.tema);
	$('#erro1').textContent = '';
	desenharTemas();
});
$('#formato').addEventListener('click', (e) => {
	const b = e.target.closest('button');
	if (!b) return;
	S.formato = b.dataset.v;
	guardar('formato', S.formato);
	for (const x of $$('#formato button')) x.setAttribute('aria-checked', String(x === b));
});
const dataCurta = () => {
	const d = new Date();
	const z = (n) => String(n).padStart(2, '0');
	return `${z(d.getDate())}${z(d.getMonth() + 1)}-${z(d.getHours())}${z(d.getMinutes())}`;
};
$('#seguir1').onclick = async () => {
	const bt = $('#seguir1');
	bt.disabled = true;
	$('#erro1').textContent = '';
	try {
		const nome = $('#nome').value.trim() || `${S.tema}-${dataCurta()}`;
		const r = await api('/api/projetos', {nome, tema: S.tema, formato: S.formato});
		S.projeto = r.nome;
		S.formato = r.formato;
		guardar('projeto', S.projeto);
		irPara(2);
	} catch (e) {
		$('#erro1').textContent = e.message;
	} finally {
		bt.disabled = !S.tema;
	}
};

// ---------- 2 · Mídias ----------
let envios = []; // {nome, tamanho, pct, estado: 'enviando'|'ok'|'falha', msg}
let jaNoProjeto = [];
const desenharArquivos = () => {
	const lista = [
		...envios.map((e) => ({...e})),
		...jaNoProjeto.filter((m) => !envios.some((e) => e.nome === m.nome)).map((m) => ({nome: m.nome, tamanho: m.tamanho, estado: 'no-projeto'})),
	];
	$('#listaArquivos').innerHTML = lista
		.map((f) => {
			const info = f.estado === 'enviando' ? `${f.pct}%` : f.estado === 'falha' ? esc(f.msg || 'Falhou') : f.estado === 'ok' ? `${tamanho(f.tamanho)} · enviado` : `${tamanho(f.tamanho)} · no vídeo`;
			const cls = f.estado === 'ok' || f.estado === 'no-projeto' ? 'ok' : f.estado === 'falha' ? 'falha' : '';
			return `<li><span class="nome" title="${esc(f.nome)}">${esc(f.nome)}</span><span class="info ${cls}">${info}</span>${f.estado === 'enviando' ? `<div class="barra"><i style="width:${f.pct}%"></i></div>` : ''}</li>`;
		})
		.join('');
	$('#avisoSem').hidden = lista.length > 0 || listaDrive.length > 0;
};
const atualizarMidias = async () => {
	try {
		jaNoProjeto = (await api(`/api/midias?projeto=${enc(S.projeto)}`)).midias ?? [];
	} catch {}
	desenharArquivos();
};
const abrirMidias = () => {
	$('#rotuloVideo').textContent = `Vídeo: ${S.projeto}`;
	envios = [];
	listaDrive = [];
	$('#escolha').hidden = true;
	$('#statusDrive').hidden = true;
	atualizarMidias();
	carregarDriveSalvo();
};
const carregarDriveSalvo = async () => {
	try {
		const s = await api(`/api/drive-link/estado?projeto=${enc(S.projeto)}`);
		if (s.estado === 'nenhum' || !s.lista?.length) return;
		listaDrive = s.lista;
		linkDrive = s.url;
		if (['listado', 'ok'].includes(s.estado)) { mostrarDrive({estado: 'listado', total: s.lista.length}); desenharEscolha(); desenharArquivos(); }
	} catch {}
};
let fila = Promise.resolve();
const enviar = (file) => {
	const e = {nome: file.name, tamanho: file.size, pct: 0, estado: 'enviando'};
	envios = [e, ...envios.filter((x) => x.nome !== file.name)];
	desenharArquivos();
	fila = fila.then(
		() =>
			new Promise((ok) => {
				const x = new XMLHttpRequest();
				x.open('POST', `/api/midia?projeto=${enc(S.projeto)}&tipo=midias&nome=${enc(file.name)}`);
				x.setRequestHeader('x-painel-token', T);
				x.upload.onprogress = (ev) => {
					if (ev.lengthComputable) { e.pct = Math.min(99, Math.round((ev.loaded / ev.total) * 100)); desenharArquivos(); }
				};
				x.onload = () => {
					let j = {};
					try { j = JSON.parse(x.responseText); } catch {}
					if (x.status === 200 && !j.erro) { e.estado = 'ok'; e.pct = 100; }
					else { e.estado = 'falha'; e.msg = j.erro || `Erro ${x.status}`; }
					desenharArquivos();
					ok();
				};
				x.onerror = () => { e.estado = 'falha'; e.msg = 'Falha de conexão'; desenharArquivos(); ok(); };
				x.send(file);
			}),
	);
	return fila;
};
const receber = async (arquivos) => {
	const lista = [...arquivos];
	if (!lista.length) return;
	await Promise.all(lista.map(enviar));
	atualizarMidias();
};
const soltar = $('#soltar');
soltar.onclick = () => $('#arquivos').click();
soltar.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('#arquivos').click(); } };
$('#arquivos').onchange = (e) => { receber(e.target.files); e.target.value = ''; };
for (const ev of ['dragenter', 'dragover']) soltar.addEventListener(ev, (e) => { e.preventDefault(); soltar.classList.add('sobre'); });
for (const ev of ['dragleave', 'drop']) soltar.addEventListener(ev, (e) => { e.preventDefault(); soltar.classList.remove('sobre'); });
soltar.addEventListener('drop', (e) => receber(e.dataTransfer.files));
// Soltar arquivo em qualquer lugar da página não pode abrir o vídeo no navegador.
for (const ev of ['dragover', 'drop']) addEventListener(ev, (e) => { if (!e.target.closest?.('#soltar')) e.preventDefault(); });

// Link do Drive: primeiro LISTA a pasta (sem baixar nada); você marca o que quer e só então baixa.
let sondaDrive, listaDrive = [], linkDrive = '';
const mostrarDrive = (s) => {
	const box = $('#statusDrive');
	box.hidden = false;
	box.classList.toggle('erro', s.estado === 'erro');
	$('.barra i', box).style.width = `${s.estado === 'erro' ? 0 : s.pct ?? 0}%`;
	const texto =
		s.estado === 'erro' ? s.erro
		: s.estado === 'ok' ? `Pronto: ${s.total} arquivo${s.total === 1 ? '' : 's'} baixado${s.total === 1 ? '' : 's'}.${s.falhas?.length ? ` ${s.falhas.length} falharam.` : ''}`
		: s.estado === 'listado' ? `Link anexado: ${s.total} arquivo${s.total === 1 ? '' : 's'}. Nada foi baixado; a IA puxa só o que precisar quando você pedir.`
		: `${s.fase ?? 'Trabalhando'}${s.arquivo ? ` · ${s.arquivo}` : ''}`;
	$('small', box).textContent = texto;
};
const marcados = () => $$('#escolhaLista input:checked').map((i) => i.value);
const atualizarContagem = () => {
	const n = marcados().length;
	$('#baixarSel').textContent = n ? `Baixar ${n} selecionado${n > 1 ? 's' : ''}` : 'Baixar selecionados';
	$('#baixarSel').disabled = !n;
};
const desenharEscolha = () => {
	const ja = new Set(jaNoProjeto.map((m) => m.nome));
	$('#escolha').hidden = !listaDrive.length;
	$('#escolhaTitulo').textContent = `${listaDrive.length} arquivo${listaDrive.length === 1 ? '' : 's'} no link`;
	$('#escolhaLista').innerHTML = listaDrive
		.map((a) => {
			const baixado = ja.has(a.nome.split('/').pop());
			return `<li><label><input type="checkbox" value="${esc(a.id)}" ${baixado ? 'disabled' : ''}><span title="${esc(a.nome)}">${esc(a.nome)}</span>${baixado ? '<em>já baixado</em>' : ''}</label></li>`;
		})
		.join('');
	atualizarContagem();
};
const acompanharDrive = () => {
	clearInterval(sondaDrive);
	sondaDrive = setInterval(async () => {
		try {
			const s = await api(`/api/drive-link/estado?projeto=${enc(S.projeto)}`);
			if (s.estado === 'nenhum') return;
			mostrarDrive(s);
			if (s.lista?.length) { listaDrive = s.lista; if (s.estado === 'listado') linkDrive = s.url; }
			if (!['rodando', 'listando'].includes(s.estado)) {
				clearInterval(sondaDrive);
				$('#anexar').disabled = false;
				for (const b of ['#baixarSel', '#baixarTodos']) $(b).disabled = false;
				if (s.estado === 'ok') { toast('Mídias do Drive baixadas.'); await atualizarMidias(); }
				if (s.estado !== 'erro') desenharEscolha();
			}
		} catch {}
	}, 900);
};
const baixarDrive = async (ids) => {
	if (!ids.length) return;
	for (const b of ['#baixarSel', '#baixarTodos']) $(b).disabled = true;
	try {
		await api('/api/drive-link', {projeto: S.projeto, url: linkDrive, modo: 'baixar', ids});
		mostrarDrive({estado: 'rodando', fase: 'Começando', pct: 0});
		acompanharDrive();
	} catch (e) {
		for (const b of ['#baixarSel', '#baixarTodos']) $(b).disabled = false;
		mostrarDrive({estado: 'erro', erro: e.message});
	}
};
$('#anexar').onclick = async () => {
	const link = $('#linkDrive').value.trim();
	if (!link) { $('#linkDrive').focus(); return; }
	$('#anexar').disabled = true;
	$('#escolha').hidden = true;
	listaDrive = [];
	try {
		await api('/api/drive-link', {projeto: S.projeto, url: link, modo: 'listar', ia: true});
		mostrarDrive({estado: 'listando', fase: 'Lendo a pasta do Drive', pct: 0});
		acompanharDrive();
	} catch (e) {
		$('#anexar').disabled = false;
		mostrarDrive({estado: 'erro', erro: e.message});
	}
};
$('#linkDrive').onkeydown = (e) => { if (e.key === 'Enter') $('#anexar').click(); };
$('#escolhaLista').addEventListener('change', atualizarContagem);
$('#selTodos').onclick = () => { for (const i of $$('#escolhaLista input:not(:disabled)')) i.checked = true; atualizarContagem(); };
$('#selNenhum').onclick = () => { for (const i of $$('#escolhaLista input')) i.checked = false; atualizarContagem(); };
$('#baixarSel').onclick = () => baixarDrive(marcados());
$('#baixarTodos').onclick = () => baixarDrive(listaDrive.map((a) => a.id));
$('#voltar2').onclick = () => irPara(1);
$('#seguir2').onclick = () => irPara(3);

// ---------- 3 · Pedir a edição ----------
let versaoPlayer = null, sondaPlayer;
const carregarPlayer = (versao) => {
	versaoPlayer = versao;
	$('#player').src = `/player.html?projeto=${enc(S.projeto)}&v=${enc(versao ?? '')}`;
};
const vigiarPlayer = () => {
	clearInterval(sondaPlayer);
	sondaPlayer = setInterval(async () => {
		if (passoAtual !== 3) return;
		try {
			const p = await api('/api/player');
			if (p.versao !== versaoPlayer) carregarPlayer(p.versao);
		} catch {}
	}, 5000);
};

let term, fit, ws, tentativas = 0, encerrado = false, tempoReconexao;
const estado = (cls, texto, botao) => {
	const f = $('#estadoTerm');
	f.className = `faixa-estado ${cls}`;
	$('span', f).textContent = texto;
	const b = $('#reconectar');
	b.hidden = !botao;
	if (botao) b.textContent = botao;
};
const ajustar = () => {
	if (!term || passoAtual !== 3) return;
	try { fit.fit(); } catch {}
};
const iniciarTerminal = () => {
	term = new Terminal({
		fontFamily: 'ui-monospace,"Cascadia Code",Menlo,Consolas,monospace',
		fontSize: 14,
		lineHeight: 1.15,
		cursorBlink: true,
		scrollback: 8000,
		allowProposedApi: true,
		theme: {background: '#030405', foreground: '#eef3f3', cursor: '#12d4cd', selectionBackground: '#12d4cd55'},
	});
	fit = new FitAddon.FitAddon();
	term.loadAddon(fit);
	term.open($('#term'));
	term.onData((d) => { if (ws?.readyState === 1) ws.send(JSON.stringify({t: 'i', d})); });
	term.onResize(({cols, rows}) => { if (ws?.readyState === 1) ws.send(JSON.stringify({t: 'r', cols, rows})); });
	// Ctrl+C com texto selecionado copia (como no Windows Terminal); sem seleção, interrompe o Claude como no cmd.
	term.attachCustomKeyEventHandler((e) => {
		if (e.type === 'keydown' && e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'c' && term.hasSelection()) {
			navigator.clipboard?.writeText(term.getSelection()).catch(() => {});
			term.clearSelection();
			return false;
		}
		return true;
	});
	new ResizeObserver(ajustar).observe($('#term'));
};
const conectar = () => {
	clearTimeout(tempoReconexao);
	encerrado = false;
	try { ws?.close(); } catch {}
	ajustar();
	estado('', 'Conectando ao Claude Code…');
	ws = new WebSocket(`ws://${location.host}/api/terminal?projeto=${enc(S.projeto)}&cols=${term.cols}&rows=${term.rows}&t=${enc(T)}`);
	const meu = ws;
	meu.onopen = () => { tentativas = 0; term.reset(); estado('on', 'Claude Code conectado'); term.focus(); };
	meu.onmessage = (ev) => {
		let m;
		try { m = JSON.parse(ev.data); } catch { return; }
		if (m.t === 'o') term.write(m.d);
		else if (m.t === 'x') { encerrado = true; estado('off', 'O Claude Code foi encerrado.', 'Abrir de novo'); }
		else if (m.t === 'e') { encerrado = true; estado('off', m.msg, 'Tentar de novo'); }
	};
	meu.onclose = () => {
		if (meu !== ws || encerrado) return;
		if (tentativas < 5) {
			tentativas++;
			estado('off', 'Conexão perdida. Reconectando…');
			tempoReconexao = setTimeout(conectar, 1500 * tentativas);
		} else estado('off', 'Não consegui reconectar.', 'Reconectar');
	};
};
const abrirPedido = () => {
	$('#tituloVideo').textContent = S.projeto;
	const t = S.temas.find((x) => x.id === S.tema);
	$('#subVideo').textContent = `${t ? t.nome : 'Tema'} · ${S.formato === 'vertical' ? 'vertical 9:16' : 'horizontal 16:9'}`;
	$('#palco').classList.toggle('horizontal', S.formato !== 'vertical');
	$('#subDrive').textContent = '';
	api(`/api/drive-link/estado?projeto=${enc(S.projeto)}`).then((s) => { if (s.lista?.length) $('#subDrive').textContent = `Drive anexado · ${s.lista.length} arquivo${s.lista.length === 1 ? '' : 's'} · a IA puxa o que precisar`; }).catch(() => {});
	api('/api/player').then((p) => carregarPlayer(p.versao)).catch(() => carregarPlayer(''));
	vigiarPlayer();
	if (!term) iniciarTerminal();
	// Espera o painel aparecer para medir o tamanho certo do terminal antes de conectar.
	setTimeout(() => { ajustar(); if (!ws || ws.readyState > 1) conectar(); else term.focus(); }, 80);
};
$('#reconectar').onclick = () => { tentativas = 0; if (encerrado) term.reset(); conectar(); };
$('#maisMidias').onclick = () => irPara(2);
$('#reiniciar').onclick = async () => {
	if (!confirm('Encerrar esta conversa e começar uma nova com o Claude Code?')) return;
	try {
		encerrado = true;
		await api('/api/terminal/reiniciar', {projeto: S.projeto});
		term.reset();
		tentativas = 0;
		setTimeout(conectar, 400);
	} catch (e) { toast(e.message); }
};
$('#janela').onclick = async () => {
	try { await api('/api/abrir-code', {projeto: S.projeto}); toast('Abri o Claude Code numa janela separada.'); } catch (e) { toast(e.message); }
};
$('#trocar').onclick = () => {
	try { ws?.close(); } catch {}
	ws = null;
	encerrado = true;
	guardar('projeto', null);
	S.projeto = null;
	iniciar();
};

// ---------- Começo ----------
const iniciar = async () => {
	irPara(1);
	const lembrado = lembrar('projeto');
	const box = $('#continuar');
	box.hidden = true;
	if (lembrado) {
		try {
			const lista = await api('/api/projetos');
			if (lista.some((p) => p.nome === lembrado)) {
				box.innerHTML = `<span>Você estava editando <b>${esc(lembrado)}</b>.</span><button class="btn" id="retomar">Continuar esse vídeo</button>`;
				box.hidden = false;
				$('#retomar').onclick = () => { S.projeto = lembrado; irPara(3); };
			}
		} catch {}
	}
};
(async () => {
	if (!T) {
		$('#p1').innerHTML = '<div class="cabeca"><h1>Abra pelo atalho do painel</h1><p>Este endereço precisa do código de acesso. Feche esta aba e abra o painel pelo atalho “Painel de Edição”.</p></div>';
		return;
	}
	S.formato = lembrar('formato') || 'vertical';
	for (const x of $$('#formato button')) x.setAttribute('aria-checked', String(x.dataset.v === S.formato));
	try {
		S.temas = (await api('/api/temas')).temas ?? [];
		const ult = lembrar('tema');
		S.tema = S.temas.some((t) => t.id === ult) ? ult : null;
	} catch (e) {
		$('#temas').innerHTML = `<div class="carregando">Não consegui carregar os temas: ${esc(e.message)}</div>`;
		return;
	}
	desenharTemas();
	iniciar();
})();
