// Painel de Edição (página). Fala com painel/servidor.mjs pelo contrato de painel/API.md.
// Rotas novas que ainda não existirem no servidor (404) aparecem como "em breve" e nunca quebram a página.
'use strict';

// ---------- Base ----------
const T = location.hash.slice(1);
const H = {'content-type': 'application/json', 'x-painel-token': T};
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const enc = encodeURIComponent;
const semAcento = (t) => String(t ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const slug = (n) => semAcento(n).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const lerLocal = (k, padrao) => { try { const v = localStorage.getItem(k); return v === null ? padrao : JSON.parse(v); } catch { return padrao; } };
const gravarLocal = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

async function api(p, corpo) {
	const post = corpo !== undefined;
	let r;
	try {
		r = await fetch(p, {method: post ? 'POST' : 'GET', headers: H, body: post ? JSON.stringify(corpo) : undefined});
	} catch {
		const e = new Error('O painel não respondeu. Ele ainda está aberto no computador?');
		e.rede = true;
		throw e;
	}
	const tx = await r.text();
	let j = null;
	try { j = tx ? JSON.parse(tx) : null; } catch {}
	if (!r.ok) {
		const e = new Error(j?.erro || (r.status === 404 ? 'Esta função chega na próxima atualização do painel.' : `Erro ${r.status}`));
		e.status = r.status;
		e.emBreve = r.status === 404;
		throw e;
	}
	return j;
}

// ---------- Ícones (SVG inline) ----------
const P = {
	plus: '<path d="M12 5v14M5 12h14"/>',
	monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
	'cloud-up': '<path d="M7 18a5 5 0 1 1 .9-9.9A6 6 0 0 1 19 10a4 4 0 0 1-1 7.9"/><path d="M12 12v8M9 15l3-3 3 3"/>',
	refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4L21 8"/><path d="M21 3v5h-5"/>',
	gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
	search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
	'chat-plus': '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12z"/><path d="M12 9v6M9 12h6"/>',
	chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12z"/>',
	edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
	stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
	send: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>',
	play: '<path d="M7 4.5v15l12.5-7.5z"/>',
	list: '<path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
	film: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 3v18M17 3v18M3 8h4M3 16h4M17 8h4M17 16h4M3 12h18"/>',
	star: '<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
	book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
	sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
	x: '<path d="M18 6L6 18M6 6l12 12"/>',
	check: '<path d="M20 6L9 17l-5-5"/>',
	folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
	link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
	trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
	eye: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
	music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
	image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
	type: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
	box: '<path d="M21 16V8l-9-5-9 5v8l9 5z"/><path d="M3.3 7L12 12l8.7-5M12 22V12"/>',
	code: '<path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/>',
	sparkles: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
	clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
	server: '<rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 6.5h.01M7 17.5h.01"/>',
	cpu: '<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
	alert: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
	info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
	download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
	upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
	chevron: '<path d="M9 6l6 6-6 6"/>',
	layers: '<path d="M12 2l10 5-10 5L2 7z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>',
	wand: '<path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8l1.4 1.4M17.8 6.2l1.4-1.4M12.2 6.2l-1.4-1.4"/><path d="M3 21l9-9"/>',
	copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
	bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>',
	zap: '<path d="M13 2L3 14h9l-1 8 10-12h-9z"/>',
	file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
	key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="M10.7 12.3L21 2M16 7l3 3M18 5l2 2"/>',
	video: '<rect x="2" y="6" width="14" height="12" rx="2"/><path d="M22 8l-6 4 6 4z"/>',
	bookmark: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
	grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
	claude: '<path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/>',
	horizontal: '<rect x="2" y="6" width="20" height="12" rx="2"/>',
	vertical: '<rect x="7" y="2" width="10" height="20" rx="2"/>',
};
const ic = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[n] ?? P.info}</svg>`;
const decorar = (raiz = document) => {
	for (const el of $$('[data-ic]', raiz)) {
		if (el.dataset.icOk) continue;
		el.dataset.icOk = 1;
		const txt = el.textContent.trim();
		el.innerHTML = ic(el.dataset.ic) + (txt ? `<span class="rot">${esc(txt)}</span>` : '');
	}
};

// ---------- Formatação ----------
const tam = (n) => (n > 1e9 ? (n / 1e9).toFixed(1) + ' GB' : n > 1e6 ? (n / 1e6).toFixed(1) + ' MB' : Math.max(1, Math.round((n || 0) / 1e3)) + ' KB');
const duracao = (s) => {
	s = Math.max(0, Math.round(s));
	if (s < 60) return `${s} s`;
	const m = Math.floor(s / 60), h = Math.floor(m / 60);
	return h ? `${h} h ${String(m % 60).padStart(2, '0')} min` : `${m} min ${String(s % 60).padStart(2, '0')} s`;
};
const quando = (t) => {
	if (!t) return '';
	const d = new Date(t);
	if (isNaN(d)) return '';
	const hoje = new Date().toDateString() === d.toDateString();
	return hoje ? d.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : d.toLocaleString('pt-BR', {day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'});
};
const custoTxt = (c) => (typeof c === 'number' && c > 0 ? 'US$ ' + c.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 4}) : '');
const eImg = (n) => /\.(png|jpe?g|webp|gif|svg)$/i.test(n);
const eVideo = (n) => /\.(mp4|mov|m4v|webm|mkv)$/i.test(n);
const eAudio = (n) => /\.(mp3|wav|m4a|aac|ogg)$/i.test(n);
const icArquivo = (n) => (eVideo(n) ? 'video' : eAudio(n) ? 'music' : eImg(n) ? 'image' : 'file');
const lerTempo = (v) => {
	v = String(v ?? '').trim().replace(',', '.');
	if (!v) return null;
	const partes = v.split(':').map(Number);
	if (partes.some((x) => isNaN(x) || x < 0)) return NaN;
	return partes.reduce((acc, x) => acc * 60 + x, 0);
};

// ---------- Estado ----------
const S = {
	analisarAoBaixar: new Map(),
	temaAberto: null,
	temas: {temas: [], semTema: []},
	projetos: [],
	bib: null,
	prefs: null,
	config: null,
	configOk: null,
	usarPod: null,
	tarefas: [],
	tarefasOk: null,
	prompts: null,
	midias: null,
	fluxo: null,
	claude: null,
	aba: lerLocal('aba', 'render'),
	videoSel: 0,
	chatAtivo: false,
};
const proj = () => $('#projeto').value;
const temaAtual = () => $('#tema').value;
const formatoDe = (nome) => [...S.temas.temas.flatMap((t) => t.projetos), ...S.temas.semTema].find((p) => p.nome === nome)?.formato;

// ---------- Avisos (toasts e notificações) ----------
function aviso(texto, tipo = 'info', {titulo, ms} = {}) {
	const icone = {ok: 'check', erro: 'alert', alerta: 'alert', info: 'info'}[tipo] ?? 'info';
	const d = document.createElement('div');
	d.className = 'toast ' + tipo;
	d.innerHTML = `${ic(icone)}<div class="tx">${titulo ? `<b>${esc(titulo)}</b>` : ''}${esc(texto)}</div><button aria-label="Fechar">${ic('x')}</button>`;
	const sair = () => { d.classList.add('sair'); setTimeout(() => d.remove(), 200); };
	d.querySelector('button').onclick = sair;
	$('#toasts').append(d);
	while ($('#toasts').children.length > 5) $('#toasts').firstChild.remove();
	setTimeout(sair, ms ?? (tipo === 'erro' ? 9000 : 5000));
}
const avisoErro = (e, prefixo = '') => aviso((prefixo ? prefixo + ': ' : '') + e.message, e.emBreve ? 'alerta' : 'erro');
function notificar(titulo, corpo) {
	if (S.config?.notificar === false) return;
	if (!('Notification' in window) || Notification.permission !== 'granted') return;
	if (!document.hidden && document.hasFocus()) return;
	try { new Notification(titulo, {body: corpo, tag: 'painel-' + titulo}); } catch {}
}
function pedirPermissaoAvisos() {
	if ('Notification' in window && Notification.permission === 'default' && S.config?.notificar !== false) Notification.requestPermission().catch(() => {});
}

// ---------- Janela (modal) ----------
let aoFecharModal = null;
function abrirModal({titulo, corpo, rodape, larga = false, aoFechar}) {
	$('#mtitulo').textContent = titulo;
	const c = $('#mcorpo');
	c.innerHTML = '';
	if (typeof corpo === 'string') c.innerHTML = corpo; else if (corpo) c.append(corpo);
	$('#mrodape').innerHTML = rodape ?? '';
	$('#mrodape').hidden = !rodape;
	$('.janela').classList.toggle('larga', larga);
	aoFecharModal = aoFechar ?? null;
	decorar($('#modal'));
	$('#modal').hidden = false;
	setTimeout(() => $('#mcorpo [autofocus]')?.focus(), 30);
}
function fecharModal() {
	if ($('#modal').hidden) return;
	$('#modal').hidden = true;
	$('#mcorpo').innerHTML = '';
	const f = aoFecharModal;
	aoFecharModal = null;
	f?.();
}
$('#modal').addEventListener('mousedown', (e) => { if (e.target.id === 'modal') fecharModal(); });
$('#mfechar').onclick = fecharModal;
document.addEventListener('keydown', (e) => {
	if (e.key !== 'Escape') return;
	if (!$('#modal').hidden) fecharModal();
	else if (!$('#tv').hidden) $('#tv').hidden = true;
});
function confirmar(titulo, texto, {ok = 'Continuar', perigo = false} = {}) {
	return new Promise((fim) => {
		let resp = false;
		abrirModal({
			titulo,
			corpo: `<p class="texto">${esc(texto)}</p>`,
			rodape: `<button class="btn fantasma" id="cNao">Cancelar</button><button class="btn ${perigo ? 'perigo' : 'primario'}" id="cSim">${esc(ok)}</button>`,
			aoFechar: () => fim(resp),
		});
		$('#cNao').onclick = fecharModal;
		$('#cSim').onclick = () => { resp = true; fecharModal(); };
		$('#cSim').focus();
	});
}
async function verArquivo(arq, titulo) {
	try {
		const r = await api('/api/codigo?f=' + enc(arq));
		abrirModal({titulo: titulo || arq, corpo: `<pre>${esc(r.texto)}</pre>`, larga: true});
	} catch (e) { avisoErro(e, 'Não abri o arquivo'); }
}
function verMidia(url, nome) {
	const corpo = eVideo(nome) ? `<video controls autoplay src="${esc(url)}"></video>` : eAudio(nome) ? `<audio controls autoplay src="${esc(url)}" style="width:100%"></audio>` : eImg(nome) ? `<img src="${esc(url)}" alt="">` : `<p class="texto">Sem prévia para este tipo de arquivo.</p>`;
	abrirModal({titulo: nome, corpo, larga: true});
}

// ---------- Visual no celular ----------
function verSecao(v) {
	document.body.classList.remove('ver-biblioteca', 'ver-conversa', 'ver-lado');
	document.body.classList.add('ver-' + v);
	$$('#navCel button').forEach((b) => b.classList.toggle('on', b.dataset.ver === v));
}
$('#navCel').onclick = (e) => { const b = e.target.closest('[data-ver]'); if (b) verSecao(b.dataset.ver); };
new ResizeObserver(() => document.documentElement.style.setProperty('--topo-cel', $('#topo').offsetHeight + 'px')).observe($('#topo'));
const celular = () => matchMedia('(max-width:900px)').matches;

// ---------- Fonte do canal ----------
function carregarFontes() {
	const st = document.createElement('style');
	st.textContent = [400, 600, 700].map((w) => `@font-face{font-family:"Poppins";font-weight:${w};font-display:swap;src:url(/fontes/poppins-latin-${w}-normal.woff2?t=${T}) format("woff2")}`).join('') +
		`@font-face{font-family:"Poppins";font-weight:500;font-display:swap;src:url(/fontes/poppins-latin-400-normal.woff2?t=${T}) format("woff2")}`;
	document.head.append(st);
}

// ---------- Temas e projetos ----------
async function carregarTemas() {
	S.temas = await api('/api/temas');
	const atual = temaAtual() || lerLocal('tema', '');
	$('#tema').innerHTML = S.temas.temas.map((t) => `<option value="${esc(t.id)}">${esc(t.nome)}</option>`).join('');
	$('#tema').value = S.temas.temas.some((t) => t.id === atual) ? atual : S.temas.temas[0]?.id || '';
}
async function carregarProjetos() {
	S.projetos = await api('/api/projetos');
	const atual = proj() || lerLocal('projeto', '');
	const grupos = S.temas.temas.filter((t) => t.projetos.length).map((t) => `<optgroup label="${esc(t.nome)}">${t.projetos.map((p) => `<option value="${esc(p.nome)}">${esc(p.nome)}</option>`).join('')}</optgroup>`).join('');
	const sem = S.temas.semTema.map((p) => `<option value="${esc(p.nome)}">${esc(p.nome)}</option>`).join('');
	$('#projeto').innerHTML = '<option value="">(nenhum vídeo)</option>' + grupos + (sem ? `<optgroup label="Sem tema">${sem}</optgroup>` : '');
	$('#projeto').value = S.projetos.some((p) => p.nome === atual) ? atual : '';
}
async function atualizarTudo() {
	try {
		await carregarTemas();
		await carregarProjetos();
	} catch (e) { avisoErro(e, 'Não carreguei os vídeos'); }
	carregarBiblioteca();
	renderRender();
}
function aoTrocarProjeto({historico = true} = {}) {
	const p = proj();
	gravarLocal('projeto', p);
	const t = S.temas.temas.find((t) => t.projetos.some((x) => x.nome === p));
	if (t) $('#tema').value = t.id;
	gravarLocal('tema', temaAtual());
	S.videoSel = 0;
	S.midias = null;
	S.fluxo = null;
	$('#convTitulo').textContent = p ? p : 'Conversa geral';
	$('#convSub').textContent = p ? `${formatoDe(p) === 'vertical' ? 'Vertical (Reels/Shorts)' : 'Horizontal (YouTube)'} · tema ${$('#tema').selectedOptions[0]?.textContent ?? ''}` : 'Sem vídeo escolhido: bom para criar um vídeo novo ou tirar dúvidas.';
	if (historico) carregarHistorico();
	renderRender();
	carregarMidias();
	if (S.aba === 'previas') carregarPrevias();
	carregarFluxo();
}
$('#projeto').onchange = () => aoTrocarProjeto();
$('#tema').onchange = () => { gravarLocal('tema', temaAtual()); if (proj()) $('#convSub').textContent = $('#convSub').textContent.replace(/tema .*$/, 'tema ' + ($('#tema').selectedOptions[0]?.textContent ?? '')); };

// ---------- Biblioteca ----------
async function carregarBiblioteca() {
	try {
		S.bib = await api('/api/biblioteca');
	} catch (e) {
		$('#bibLista').innerHTML = `<div class="vazio">${ic('alert')}<b>Não carreguei a biblioteca</b>${esc(e.message)}</div>`;
		return;
	}
	const st = $('#fontcss') ?? Object.assign(document.createElement('style'), {id: 'fontcss'});
	st.textContent = Object.entries(S.bib.fontes ?? {}).flatMap(([n, v]) => v.map((f) => `@font-face{font-family:"p-${n}";font-weight:${f.peso};font-style:${f.estilo};src:url(/fontes/${enc(f.arquivo)}?t=${T})}`)).join('');
	document.head.append(st);
	renderBiblioteca();
}
const abertas = lerLocal('abertas', {});
function secao(id, titulo, icone, n, corpo, padrao = false, sempre = false) {
	if (!n && !sempre) return '';
	return `<details class="secao" data-id="${esc(id)}" ${abertas[id] ?? padrao ? 'open' : ''}><summary>${ic('chevron', 'seta')}${ic(icone)}<span>${esc(titulo)}</span><span class="cont">${n}</span></summary><div class="secao-corpo">${corpo}</div></details>`;
}
function item({nome, sub, pedido, arq, icone = 'box', mini = '', botoes = '', busca = '', classe = '', attrs = ''}) {
	return `<div class="item ${classe}" ${pedido ? `data-p="${esc(pedido)}"` : ''} data-busca="${esc(semAcento(nome + ' ' + (sub ?? '') + ' ' + busca))}" ${attrs} title="${pedido ? 'Clique para usar no pedido' : ''}">` +
		`<span class="ico">${mini || ic(icone)}</span><span class="info"><b>${esc(nome)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span>` +
		`<span class="botoes">${botoes}${arq ? `<button class="btn icone mini fantasma" data-arq="${esc(arq)}" title="Ver o conteúdo" aria-label="Ver o conteúdo">${ic('eye')}</button>` : ''}</span></div>`;
}
const fam = (n) => n.replace(/(^|-)(\w)/g, (_, x, c) => (x ? ' ' : '') + c.toUpperCase());
const icPack = {video: 'video', audio: 'music', imagem: 'image', fonte: 'type', lut: 'sliders', modelo3d: 'box', outro: 'file'};
const urlPack = (arq) => '/pack/' + String(arq).split('/').map(enc).join('/') + '?t=' + T;
function renderBiblioteca() {
	const b = S.bib;
	if (!b) return;
	const {temas, semTema} = S.temas;
	const plural = (n, s, p) => `${n} ${n === 1 ? s : p}`;
	const temasHtml = temas.map((t) =>
		`<details class="sub" data-id="tema-${esc(t.id)}" data-busca="${esc(semAcento(t.nome + ' ' + t.descricao))}" ${abertas['tema-' + t.id] ? 'open' : ''}><summary>${ic('chevron', 'seta')}<span>${esc(t.nome)}</span><span class="cont">${t.projetos.length}</span></summary><div class="sub-corpo">` +
		`<p class="desc">${esc(t.descricao)}${t.descricao ? ' · ' : ''}${plural(t.regras, 'regra aprendida', 'regras aprendidas')}</p>` +
		item({nome: 'Ver vídeos e opções', sub: 'assistir, criar novo ou copiar um estilo', icone: 'grid', classe: 'destaque', attrs: `data-tema="${esc(t.id)}"`}) +
		item({nome: 'Aprendizado deste tema', sub: plural(t.regras, 'regra: cresce a cada vídeo', 'regras: cresce a cada vídeo'), icone: 'sparkles', pedido: `Mostre o aprendizado do tema ${t.nome}`, arq: `biblioteca/temas/${t.id}/aprendizado.md`}) +
		t.projetos.map((p) => item({nome: p.nome, sub: p.formato, icone: p.formato === 'vertical' ? 'vertical' : 'horizontal', pedido: `Cria um vídeo novo no tema "${t.id}" usando o projeto "${p.nome}" como base`, arq: `src/projetos/${p.nome}/edit.ts`, botoes: `<button class="btn icone mini fantasma" data-studio="${esc(p.nome)}" title="Abrir no Studio" aria-label="Abrir no Studio">${ic('play')}</button>`})).join('') +
		'</div></details>').join('') +
		(semTema.length ? `<details class="sub" data-id="tema-sem" data-busca="sem tema" ${abertas['tema-sem'] ? 'open' : ''}><summary>${ic('chevron', 'seta')}<span>Sem tema</span><span class="cont">${semTema.length}</span></summary><div class="sub-corpo">` +
			semTema.map((p) => item({nome: p.nome, sub: p.formato, icone: p.formato === 'vertical' ? 'vertical' : 'horizontal', pedido: `Coloca o projeto "${p.nome}" em um tema`, arq: `src/projetos/${p.nome}/edit.ts`})).join('') + '</div></details>' : '');

	// Pack: agrupado por categoria, com prévia.
	const pack = Array.isArray(b.pack) ? b.pack : [];
	const cats = {};
	for (const x of pack) (cats[x.categoria || 'Outros'] ??= []).push(x);
	const packHtml = `<button class="btn mini bloco" data-importar-pack style="margin-bottom:8px">${ic('download')}<span>Importar pack (link do Drive ou .zip)</span></button>` +
		(pack.length ? Object.entries(cats).sort(([a], [z]) => a.localeCompare(z)).map(([cat, itens]) => `<div class="pack-cat" data-cat>${esc(cat)} · ${itens.length}</div>` + itens.map((x) => {
			const url = x.baixado ? urlPack(x.arquivo) : '';
			const mini = x.baixado && x.tipo === 'imagem' ? `<img loading="lazy" src="${esc(url)}" alt="">` : '';
			const ver = x.baixado && ['video', 'imagem', 'audio'].includes(x.tipo) ? `<button class="btn icone mini fantasma" data-pack-ver="${esc(url)}" data-nome="${esc(x.arquivo)}" title="Prévia" aria-label="Prévia">${ic(x.tipo === 'audio' ? 'play' : 'eye')}</button>` : '';
			const selo = x.baixado ? '' : '<span class="selo alerta" title="O arquivo não está neste computador. Importe o pack.">falta</span>';
			return item({nome: x.nome, sub: `${x.tipo}${x.tamanho ? ' · ' + tam(x.tamanho) : ''}`, icone: icPack[x.tipo] ?? 'file', mini, botoes: selo + ver, pedido: `Usa o arquivo do pack "${x.nome}" (${x.arquivo})`, busca: cat + ' ' + x.tipo});
		}).join('')).join('') : `<div class="vazio" style="padding:14px">${ic('layers')}<b>Nenhum pack ainda</b>${'pack' in b ? 'Importe um pack de efeitos, sons, LUTs e vídeos para usar nas edições.' : 'O pack chega na próxima atualização do painel.'}</div>`);

	$('#bibLista').innerHTML =
		secao('temas', 'Templates por tema', 'grid', temas.length, temasHtml, true) +
		secao('salvos', 'Salvos por você', 'bookmark', (b.salvos ?? []).length, (b.salvos ?? []).map((s) => item({nome: s.nome, sub: s.descricao, icone: 'bookmark', pedido: `Usa "${s.nome}" da biblioteca`, arq: s.arquivo})).join(''), true) +
		secao('pack', 'Pack', 'layers', pack.length, packHtml, false, true) +
		secao('pecas', 'Peças e efeitos', 'sparkles', (b.pecas ?? []).length, (b.pecas ?? []).map((p) => item({nome: p.nome, sub: String(p.descricao ?? '').slice(0, 90), icone: 'sparkles', pedido: `Usa a peça ${p.nome}`, arq: p.arquivo, busca: p.descricao})).join('')) +
		secao('3d', 'Modelos 3D', 'box', (b.modelos3d ?? []).length, (b.modelos3d ?? []).map((m) => item({nome: m.nome, sub: 'objeto 3D', icone: 'box', pedido: `Coloca o objeto 3D ${m.nome}`, arq: m.arquivo})).join('')) +
		secao('blender', 'Modelos Blender', 'cpu', (b.blender ?? []).length, (b.blender ?? []).map((m) => item({nome: m.nome, sub: 'script Blender', icone: 'cpu', pedido: `Gera o modelo ${m.nome} com Blender`, arq: m.arquivo})).join('')) +
		secao('sons', 'Sons', 'music', (b.sfx ?? []).length, (b.sfx ?? []).map((s) => `<div class="item som" data-busca="${esc(semAcento(s + ' som'))}" data-p="${esc(`Usa o som ${s}`)}"><span class="ico">${ic('music')}</span><span class="info"><b>${esc(s)}</b></span><audio controls preload="none" src="/sfx/${enc(s)}.wav?t=${T}"></audio></div>`).join('')) +
		secao('fontes', 'Fontes', 'type', Object.keys(b.fontes ?? {}).length, Object.entries(b.fontes ?? {}).map(([n, v]) => {
			const w = v.map((f) => f.peso).sort((x, y) => y - x)[0];
			return `<div class="item fonte" data-busca="${esc(semAcento(n + ' fonte'))}" data-p="${esc(`Usa a fonte ${fam(n)}`)}"><span class="info"><small>${esc(fam(n))} · ${esc(v.map((f) => f.peso + (f.estilo === 'italic' ? 'i' : '')).join(', '))}</small><div class="amostra" style="font-family:'p-${esc(n)}';font-weight:${Number(w) || 400}">Mateus Dias 0123</div></span></div>`;
		}).join(''));
	$$('#bibLista details').forEach((d) => d.addEventListener('toggle', () => {
		if ($('#busca').value.trim()) return;
		abertas[d.dataset.id] = d.open;
		gravarLocal('abertas', abertas);
	}));
	if ($('#busca').value.trim()) filtrarBiblioteca();
}
function filtrarBiblioteca() {
	const q = semAcento($('#busca').value.trim());
	if (!q) return renderBiblioteca();
	const termos = q.split(/\s+/);
	const bate = (t) => termos.every((x) => t.includes(x));
	let total = 0;
	for (const s of $$('#bibLista .secao')) {
		let n = 0;
		for (const sub of $$('.sub', s)) {
			const tituloBate = bate(sub.dataset.busca ?? '');
			let k = 0;
			for (const it of $$('[data-busca]', sub)) { const ok = tituloBate || bate(it.dataset.busca); it.hidden = !ok; if (ok) k++; }
			sub.hidden = !k;
			sub.open = !!k;
			n += k;
		}
		for (const it of $$(':scope>.secao-corpo>[data-busca]', s)) { const ok = bate(it.dataset.busca); it.hidden = !ok; if (ok) n++; }
		for (const c of $$('[data-cat]', s)) {
			let el = c.nextElementSibling, vis = false;
			while (el && !el.hasAttribute('data-cat')) { if (!el.hidden && el.matches('[data-busca]')) vis = true; el = el.nextElementSibling; }
			c.hidden = !vis;
		}
		s.hidden = !n;
		s.open = !!n;
		total += n;
	}
	$('#bibLista .nada-busca')?.remove();
	if (!total) $('#bibLista').insertAdjacentHTML('beforeend', `<div class="nada-busca">Nada encontrado para “${esc($('#busca').value.trim())}”.</div>`);
}
let tBusca = null;
$('#busca').oninput = () => { clearTimeout(tBusca); tBusca = setTimeout(filtrarBiblioteca, 120); };
$('#bibLista').onclick = async (e) => {
	if (e.target.closest('audio')) return;
	const b = e.target.closest('button');
	if (b?.dataset.studio) return studio(b.dataset.studio);
	if (b?.dataset.arq) return verArquivo(b.dataset.arq);
	if (b?.dataset.packVer !== undefined) return verMidia(b.dataset.packVer, b.dataset.nome);
	if (b?.hasAttribute('data-importar-pack')) return importarPack();
	const ti = e.target.closest('[data-tema]');
	if (ti) return abrirTema(ti.dataset.tema);
	const i = e.target.closest('[data-p]');
	if (i) usarPedido(i.dataset.p + ' ');
};
function usarPedido(texto, {enviar = false} = {}) {
	if (celular()) verSecao('conversa');
	$('#pedido').value = texto;
	ajustarCaixa();
	if (enviar) return $('#f').requestSubmit();
	$('#pedido').focus();
	$('#pedido').setSelectionRange(texto.length, texto.length);
}
function importarPack() {
	abrirModal({
		titulo: 'Importar pack',
		corpo: `<div class="campo"><label class="rotulo" for="packUrl">Link do Google Drive ou caminho do arquivo .zip</label><input id="packUrl" type="text" autofocus placeholder="https://drive.google.com/... ou C:\\Downloads\\pack.zip"><span class="ajuda">O painel baixa, descompacta e organiza os arquivos no catálogo do pack. Pode levar alguns minutos: acompanhe na aba Render.</span></div>`,
		rodape: `<button class="btn fantasma" id="pkNao">Cancelar</button><button class="btn primario" id="pkSim">${ic('download')}<span>Importar</span></button>`,
	});
	$('#pkNao').onclick = fecharModal;
	$('#pkSim').onclick = async () => {
		const url = $('#packUrl').value.trim();
		if (!url) return $('#packUrl').focus();
		$('#pkSim').disabled = true;
		const ok = await criarTarefa('pack', {url}, {projeto: proj()});
		if (ok) fecharModal(); else $('#pkSim').disabled = false;
	};
	$('#packUrl').onkeydown = (e) => { if (e.key === 'Enter') $('#pkSim').click(); };
}

// ---------- Studio, nuvem, atualização ----------
async function studio(rota = '') {
	aviso('Abrindo o Studio com a placa de vídeo (GPU)... pode levar alguns segundos.', 'info');
	const r = await api('/api/studio', {rota}).catch(() => ({ok: false}));
	if (!r?.ok) aviso('O Studio não abriu. Tente de novo.', 'erro');
}
$('#studio').onclick = () => studio();
$('#salvar').onclick = async () => {
	const b = $('#salvar');
	b.disabled = true;
	try { aviso((await api('/api/sync/salvar', {mensagem: 'Edição pelo painel'}))?.saida || 'Salvo na nuvem.', 'ok', {titulo: 'Salvar na nuvem'}); }
	catch (e) { avisoErro(e, 'Não salvei'); }
	b.disabled = false;
};
$('#atualizar').onclick = async () => {
	if (!(await confirmar('Atualizar e reabrir', 'Vou baixar a versão mais recente e reabrir o painel. Uma janela nova vai abrir e esta aba para de funcionar. Continuar?', {ok: 'Atualizar e reabrir'}))) return;
	try { await api('/api/reiniciar', {}); } catch {}
	document.body.innerHTML = '<div style="padding:48px;max-width:560px;margin:auto;font:16px/1.6 var(--fonte);color:#eef3f3"><h2 style="color:#12d4cd;margin-bottom:8px">Reabrindo o painel...</h2><p>Uma janela preta vai aparecer e, em alguns segundos, o painel abre numa aba nova. Pode fechar esta aba.</p></div>';
	setTimeout(() => window.close(), 4000);
};

// ---------- Temas: criar e tela do tema ----------
$('#novoTema').onclick = () => {
	abrirModal({
		titulo: 'Novo tema',
		corpo: `<div class="campo"><label class="rotulo" for="ntNome">Nome do tema</label><input id="ntNome" type="text" autofocus placeholder="Ex.: Aulas, Lançamento, Podcast"></div>` +
			`<div class="campo"><label class="rotulo" for="ntDesc">Como são os vídeos desse tema <small>(opcional)</small></label><textarea id="ntDesc" rows="3" placeholder="Uma frase: formato, ritmo, o que não pode faltar..."></textarea>` +
			`<span class="ajuda">Os vídeos feitos neste tema ensinam o Claude: ele anota o que você aprova ou corrige e segue nas próximas edições.</span></div>`,
		rodape: `<button class="btn fantasma" id="ntNao">Cancelar</button><button class="btn primario" id="ntSim">Criar tema</button>`,
	});
	$('#ntNao').onclick = fecharModal;
	$('#ntSim').onclick = async () => {
		const nome = $('#ntNome').value.trim();
		if (!nome) return $('#ntNome').focus();
		try {
			const r = await api('/api/temas', {nome, descricao: $('#ntDesc').value.trim()});
			fecharModal();
			await carregarTemas();
			$('#tema').value = r.id;
			gravarLocal('tema', r.id);
			await carregarProjetos();
			renderBiblioteca();
			aviso(`Tema "${nome}" criado. Os vídeos feitos nele vão ensinar o Claude.`, 'ok');
		} catch (e) { avisoErro(e, 'Não criei o tema'); }
	};
};
async function abrirTema(id) {
	let ts, ps;
	try { [{temas: ts}, ps] = await Promise.all([api('/api/temas'), api('/api/projetos')]); }
	catch (e) { return avisoErro(e); }
	const t = ts.find((x) => x.id === id);
	if (!t) return;
	const cards = t.projetos.map((pr) => {
		const v = (ps.find((x) => x.nome === pr.nome)?.videos || [])[0];
		const vert = pr.formato === 'vertical';
		return `<div class="card"><div class="c-cab">${ic(vert ? 'vertical' : 'horizontal')}<b>${esc(pr.nome)}</b><span class="selo">${esc(pr.formato)}</span></div>` +
			(v ? `<video class="${vert ? 'v' : ''}" controls preload="metadata" src="/out/${enc(v.arquivo)}?t=${T}"></video><small class="arqv">${esc(v.arquivo)}</small>`
				: `<div class="sem-video">${ic('film')}Ainda sem vídeo pronto neste computador.<br>Gere a prévia para assistir aqui.</div>`) +
			`<div class="acoes"><button class="btn primario mini" data-copiar="${esc(pr.nome)}">${ic('copy')}<span>Copiar este estilo</span></button>` +
			`<button class="btn mini" data-previa="${esc(pr.nome)}">${ic('play')}<span>${v ? 'Prévia de novo' : 'Gerar prévia'}</span></button>` +
			`<button class="btn mini" data-editar="${esc(pr.nome)}">${ic('edit')}<span>Editar</span></button>` +
			`<button class="btn mini fantasma" data-studio2="${esc(pr.nome)}">${ic('monitor')}<span>Studio</span></button></div></div>`;
	}).join('');
	$('#tvc').innerHTML = `<div class="t-cab"><h1><small>Tema</small>${esc(t.nome)}</h1><button class="btn" id="tvnovo">${ic('plus')}<span>Criar vídeo com este tema</span></button><button class="btn" id="tvap">${ic('sparkles')}<span>Ver aprendizado</span></button><button class="btn icone fantasma" id="tvx" aria-label="Fechar">${ic('x')}</button></div>` +
		`<p class="t-desc">${esc(t.descricao)}${t.descricao ? ' · ' : ''}${t.regras} regra${t.regras === 1 ? '' : 's'} aprendida${t.regras === 1 ? '' : 's'}. Um vídeo novo segue essas regras e usa os vídeos abaixo como referência.</p>` +
		`<div class="t-secao"><h3>${ic('wand')}Vídeos modelo<small>Envie qualquer vídeo com a edição que você quer: o Claude analisa a edição e o roteiro e usa como base deste tema.</small></h3>` +
		zona(`tema:${id}`, 'Solte aqui um vídeo modelo', 'ou clique para escolher (mp4, mov, webm...)') +
		colarLink(`tema:${id}`, 'ou cole o link do vídeo (YouTube, Instagram, TikTok...)') +
		`<div class="modelos" id="tvModelos"></div></div>` +
		`<div class="t-secao"><h3>${ic('film')}Vídeos feitos neste tema</h3></div>` +
		`<div class="grade">${cards || `<div class="vazio" style="grid-column:1/-1">${ic('film')}<b>Nenhum vídeo neste tema ainda</b>Crie o primeiro: ele vai ensinar o Claude.</div>`}</div>`;
	S.temaAberto = id;
	carregarModelos(id);
	$('#tv').hidden = false;
	const escolher = (nome) => { $('#tv').hidden = true; $('#projeto').value = nome; aoTrocarProjeto(); };
	$('#tvx').onclick = () => ($('#tv').hidden = true);
	$('#tvap').onclick = () => verArquivo(`biblioteca/temas/${id}/aprendizado.md`, 'Aprendizado: ' + t.nome);
	$('#tvnovo').onclick = () => { $('#tv').hidden = true; abrirNovoVideo({tema: id}); };
	$('#tvc').onclick = async (e) => {
		const an = e.target.closest('[data-analisar]'), va = e.target.closest('[data-ver-analise]'), am = e.target.closest('[data-apagar-modelo]');
		if (an) return analisarModelo(id, an.dataset.analisar);
		if (va) return verArquivo(va.dataset.verAnalise, 'Análise: ' + va.dataset.nome);
		if (am) {
			if (!(await confirmar('Apagar vídeo modelo', `Apagar "${am.dataset.apagarModelo}" e a análise dele deste tema?`, {ok: 'Apagar', perigo: true}))) return;
			try { await api('/api/tema-modelo/apagar', {tema: id, nome: am.dataset.apagarModelo}); aviso('Vídeo modelo apagado.', 'ok', {ms: 2500}); } catch (er) { avisoErro(er, 'Não apaguei'); }
			return carregarModelos(id);
		}
		const c = e.target.closest('[data-copiar]'), pv = e.target.closest('[data-previa]'), st = e.target.closest('[data-studio2]'), ed = e.target.closest('[data-editar]');
		if (c) { $('#tv').hidden = true; abrirNovoVideo({tema: id, base: c.dataset.copiar}); }
		if (pv) { escolher(pv.dataset.previa); gerarPrevia(); }
		if (ed) escolher(ed.dataset.editar);
		if (st) studio(st.dataset.studio2);
	};
}

// ---------- Vídeos modelo do tema ----------
async function carregarModelos(id) {
	const el = $('#tvModelos');
	if (!el) return;
	let lista;
	try { lista = await api('/api/tema-modelos?tema=' + enc(id)); }
	catch (e) { el.innerHTML = `<p class="t-desc">${e.emBreve ? 'Chega na próxima atualização do painel.' : esc(e.message)}</p>`; return; }
	el.innerHTML = lista.length ? lista.map((m) =>
		`<div class="modelo">` +
		(m.video ? `<video controls preload="metadata" src="/tema-modelo/${enc(id)}/${enc(m.nome)}?t=${T}"></video>` : `<div class="sem-video">${ic('film')}O vídeo está em outro computador; a análise vale aqui também.</div>`) +
		`<div class="modelo-info"><b title="${esc(m.nome)}">${esc(m.nome)}</b>` +
		`<span class="selo ${m.analise ? 'ok' : 'alerta'}">${m.analise ? 'analisado: é base do tema' : 'ainda sem análise'}</span>` +
		`<div class="acoes">` +
		(m.analise ? `<button class="btn mini" data-ver-analise="${esc(m.analise)}" data-nome="${esc(m.nome)}">${ic('eye')}<span>Ver análise</span></button>` : '') +
		(m.video ? `<button class="btn mini ${m.analise ? '' : 'primario'}" data-analisar="${esc(m.nome)}">${ic('search')}<span>${m.analise ? 'Analisar de novo' : 'Analisar agora'}</span></button>` : '') +
		`<button class="btn mini fantasma" data-apagar-modelo="${esc(m.nome)}" title="Apagar">${ic('x')}</button></div></div></div>`).join('')
		: `<p class="t-desc">Nenhum vídeo modelo ainda. Envie um vídeo de alguém cuja edição você admira: ele vira a base de estilo e roteiro deste tema.</p>`;
}
function analisarModelo(tema, nomes) {
	nomes = [].concat(nomes);
	const t = S.temas.temas.find((x) => x.id === tema);
	const pasta = `biblioteca/temas/${tema}/modelos`;
	$('#tv').hidden = true;
	if ($('#tema').value !== tema) { $('#tema').value = tema; gravarLocal('tema', tema); }
	if (proj()) { $('#projeto').value = ''; aoTrocarProjeto(); }
	aviso('O Claude está analisando o vídeo modelo. Acompanhe na conversa.', 'info');
	usarPedido(`Analise ${nomes.length > 1 ? 'os vídeos modelo' : 'o vídeo modelo'} ${nomes.map((n) => `"${n}"`).join(', ')} do tema "${t?.nome ?? tema}" (em ${pasta}/) para ser a base de estilo de edição e de roteiro deste tema.
1. Com ffprobe e ffmpeg: duração, formato, fps; cortes por detecção de cena (select='gt(scene,0.3)'); quadros a cada 1 s numa folha de contato. Olhe os quadros.
2. Transcreva o áudio com o mesmo motor de scripts/transcrever.mjs (palavras com tempo).
3. Para cada vídeo, escreva ${pasta}/<nome sem extensão>.md com:
   - Edição: ritmo (cortes por minuto e duração média dos planos), enquadramento e zoom, tipos de tela e cartelas, tipografia, cores, legenda, efeitos e transições, sons e trilha, abertura e fechamento, com os tempos.
   - Roteiro: gancho dos primeiros segundos, estrutura com tempos, chamadas para ação, tom e vocabulário.
   - Como recriar aqui: cada elemento ligado às peças da biblioteca (src/pecas, pack) ou ao que precisaria ser criado.
4. Acrescente em biblioteca/temas/${tema}/aprendizado.md as regras gerais que valem para os próximos vídeos do tema, em linhas "- AAAA-MM-DD (modelo <nome>): regra".
Não edite nenhum projeto e não copie o conteúdo, só o estilo. No fim, resuma em tópicos o estilo do tema.`, {enviar: true});
}

// ---------- Novo vídeo ----------
$('#novoProj').onclick = () => abrirNovoVideo({tema: temaAtual()});
function abrirNovoVideo({tema = temaAtual(), base = ''} = {}) {
	const formato = (base && formatoDe(base)) || S.prefs?.formatoPadrao || 'vertical';
	const todos = [...S.temas.temas.flatMap((t) => t.projetos), ...S.temas.semTema];
	abrirModal({
		titulo: base ? `Novo vídeo no estilo de "${base}"` : 'Novo vídeo',
		corpo: `<div class="campo"><label class="rotulo" for="nvNome">Nome do vídeo</label><input id="nvNome" type="text" autofocus placeholder="Ex.: depoimento-joana ou Aula 3 de investimentos"><span class="ajuda" id="nvSlug">Use um nome curto. Vira a pasta do projeto.</span></div>` +
			`<div class="grade-2"><div class="campo"><label class="rotulo" for="nvTema">Tema</label><select id="nvTema">${S.temas.temas.map((t) => `<option value="${esc(t.id)}" ${t.id === tema ? 'selected' : ''}>${esc(t.nome)}</option>`).join('')}</select></div>` +
			`<div class="campo"><span class="rotulo">Formato</span><div class="segmentos"><label><input type="radio" name="nvFormato" value="vertical" ${formato === 'vertical' ? 'checked' : ''}><span>${ic('vertical')}Vertical</span></label><label><input type="radio" name="nvFormato" value="horizontal" ${formato === 'horizontal' ? 'checked' : ''}><span>${ic('horizontal')}Horizontal</span></label></div></div></div>` +
			`<div class="campo"><label class="rotulo" for="nvBase">Copiar o estilo de <small>(opcional)</small></label><select id="nvBase"><option value="">Começar do zero (segue o aprendizado do tema)</option>${todos.map((p) => `<option value="${esc(p.nome)}" ${p.nome === base ? 'selected' : ''}>${esc(p.nome)} · ${esc(p.formato)}</option>`).join('')}</select><span class="ajuda">Mesma estrutura de cenas, câmera, legenda, ritmo e sons; só o conteúdo muda.</span></div>` +
			`<div class="campo"><label class="rotulo" for="nvDesc">Sobre o que é o vídeo <small>(opcional)</small></label><textarea id="nvDesc" rows="3" placeholder="Ex.: Reels de 40 s explicando juros compostos, com gancho forte e legenda grande."></textarea></div>`,
		rodape: `<button class="btn fantasma" id="nvNao">Cancelar</button><button class="btn primario" id="nvSim">${ic('plus')}<span>Criar vídeo</span></button>`,
	});
	$('#nvNome').oninput = () => { const s = slug($('#nvNome').value); $('#nvSlug').textContent = s ? `Pasta do projeto: ${s}` : 'Use um nome curto. Vira a pasta do projeto.'; };
	$('#nvBase').onchange = () => { const f = formatoDe($('#nvBase').value); if (f) $(`[name=nvFormato][value=${f}]`).checked = true; };
	$('#nvNao').onclick = fecharModal;
	$('#nvSim').onclick = async () => {
		const nome = slug($('#nvNome').value);
		if (!nome) return $('#nvNome').focus();
		const temaN = $('#nvTema').value, formatoN = $('[name=nvFormato]:checked').value, baseN = $('#nvBase').value, desc = $('#nvDesc').value.trim();
		const copiar = baseN ? ` copiando o estilo de edição do projeto "${baseN}": mesma estrutura de cenas, tipos de cena, efeitos de câmera, legenda, ritmo e sons de src/projetos/${baseN}/edit.ts, mais as regras do aprendizado do tema. Troque só o conteúdo (textos e tempos pela fala do vídeo novo). Não copie a transcrição nem a mídia do original.` : '';
		const sobre = desc ? ` Sobre o vídeo: ${desc}` : '';
		$('#nvSim').disabled = true;
		try {
			const r = await api('/api/projetos', {nome, tema: temaN, formato: formatoN});
			if (Array.isArray(r) || !r) { const e = new Error('rota antiga'); e.emBreve = true; throw e; }
			fecharModal();
			await carregarTemas();
			await carregarProjetos();
			$('#projeto').value = nome;
			$('#tema').value = temaN;
			aoTrocarProjeto();
			renderBiblioteca();
			aviso(`Vídeo "${nome}" criado. Agora envie o vídeo bruto na aba Mídias.`, 'ok');
			mostrarAba('midias');
			if (celular()) verSecao('lado');
			if (copiar || sobre) usarPedido(`Prepara a edição do projeto "${nome}"${copiar || ' seguindo as regras do aprendizado do tema.'}${sobre}`, {enviar: true});
		} catch (e) {
			if (!e.emBreve) { $('#nvSim').disabled = false; return avisoErro(e, 'Não criei o vídeo'); }
			// Servidor sem a rota nova: pede ao Claude, como antes.
			fecharModal();
			$('#projeto').value = '';
			$('#tema').value = temaN;
			aoTrocarProjeto({historico: false});
			usarPedido(`Cria o projeto novo "${nome}" (formato ${formatoN}) no tema "${temaN}"${copiar || ' seguindo as regras do aprendizado do tema e usando os vídeos do tema como referência.'}${sobre} Depois prepara para editar.`, {enviar: true});
		}
	};
	$('#nvNome').onkeydown = (e) => { if (e.key === 'Enter') $('#nvSim').click(); };
}

// ---------- Claude (instalar / entrar) ----------
let lendoClaude = null;
async function verificarClaude() {
	const c = $('#claude');
	let st;
	try { st = await api('/api/claude'); } catch { return; }
	S.claude = st;
	atualizarPilulas();
	if (st.instalado && st.logado) { c.hidden = true; clearInterval(lendoClaude); return; }
	c.hidden = false;
	c.innerHTML = !st.instalado
		? `${ic('alert')}<span><b>O Claude Code ainda não está instalado neste computador.</b><br><small>É ele que faz as edições. A instalação é automática.</small></span><button class="btn primario" id="cb">Instalar automaticamente</button>`
		: `${ic('key')}<span><b>Falta entrar na sua conta do Claude neste computador.</b><br><small>Uma janela do navegador vai abrir para você entrar.</small></span><button class="btn primario" id="cb">Entrar na conta</button>`;
	$('#cb').onclick = async (e) => {
		const b = e.currentTarget;
		b.disabled = true;
		if (!st.instalado) {
			b.textContent = 'Instalando... (1 a 3 minutos)';
			const r = await api('/api/claude/instalar', {}).catch(() => ({ok: false}));
			if (!r?.instalado) { b.disabled = false; b.textContent = 'Não consegui. Tentar de novo'; return; }
			return verificarClaude();
		}
		await api('/api/claude/entrar', {}).catch(() => {});
		b.textContent = 'Conclua o login na janela do navegador...';
		clearInterval(lendoClaude);
		lendoClaude = setInterval(verificarClaude, 3000);
	};
}

// ---------- Indicadores do topo ----------
function atualizarPilulas() {
	const c = S.claude;
	const pc = $('#stClaude');
	pc.title = c?.logado ? `Conta: ${c.email || 'conectada'} (clique para trocar)` : 'Claude Code neste computador';
	pc.querySelector('.ponto').className = 'ponto ' + (!c ? '' : c.instalado && c.logado ? (S.chatAtivo ? 'ativo' : 'ok') : 'erro');
	pc.querySelector('span').textContent = !c ? 'Claude' : !c.instalado ? 'Claude não instalado' : !c.logado ? 'Claude sem login' : S.chatAtivo ? 'Claude trabalhando' : `Claude${S.config?.modelo ? ' · ' + (S.config.modelo === 'auto' ? 'automático' : S.config.modelo) : ''}`;
	const pod = S.config?.pod;
	const pp = $('#stPod');
	const usando = usarPodAgora();
	pp.querySelector('.ponto').className = 'ponto ' + (!pod ? '' : usando ? (pod.host ? 'ok' : 'alerta') : '');
	pp.querySelector('span').textContent = !pod ? 'Pod' : usando ? (pod.host ? 'Pod ligado' : 'Pod sem endereço') : 'Render no PC';
	pp.title = !pod ? 'Pod: configure em Preferências' : usando ? `Renders vão para o pod ${pod.host || '(sem endereço)'}` : 'Renders rodam neste computador';
	const ativas = S.tarefas.filter((t) => t.estado === 'rodando' || t.estado === 'fila');
	const pt = $('#stTarefas');
	const rod = S.tarefas.find((t) => t.estado === 'rodando');
	const falhou = S.tarefas[0]?.estado === 'erro' && Date.now() - (S.tarefas[0].fim || 0) < 6e5;
	pt.querySelector('.ponto').className = 'ponto ' + (rod ? 'ativo' : ativas.length ? 'alerta' : falhou ? 'erro' : '');
	pt.querySelector('span').textContent = rod ? `${NOMES_TAREFA[rod.tipo] ?? rod.tipo}${typeof rod.pct === 'number' ? ' ' + Math.round(rod.pct) + '%' : ''}${ativas.length > 1 ? ` (+${ativas.length - 1})` : ''}` : ativas.length ? `${ativas.length} na fila` : falhou ? 'Última tarefa falhou' : S.tarefasOk === false ? 'Tarefas (em breve)' : 'Sem tarefas';
	const mb = pt.querySelector('.mini-barra');
	mb.hidden = !(rod && typeof rod.pct === 'number');
	if (rod) mb.firstChild.style.width = (rod.pct ?? 0) + '%';
	const cont = $('[data-aba=render] .contador');
	if (ativas.length) {
		if (cont) cont.textContent = ativas.length; else $('[data-aba=render]').insertAdjacentHTML('beforeend', `<span class="contador">${ativas.length}</span>`);
	} else cont?.remove();
}
$('#stClaude').onclick = () => { if (S.claude && !(S.claude.instalado && S.claude.logado)) { verSecao('conversa'); $('#claude').scrollIntoView(); } else abrirPreferencias('claude'); };
$('#stPod').onclick = () => abrirPreferencias('pod');
$('#stTarefas').onclick = () => { mostrarAba('render'); if (celular()) verSecao('lado'); };

// ---------- Preferências ----------
async function carregarConfig() {
	try {
		const r = await api('/api/config');
		S.prefs = r.prefs ?? {};
		S.config = r.config ?? {};
		S.configOk = true;
	} catch (e) {
		S.configOk = e.emBreve ? false : null;
	}
	atualizarPilulas();
}
const usarPodAgora = () => (S.usarPod ?? !!S.config?.pod?.ativo);
const SECOES_PREFS = [
	['edicao', 'Edição', 'sliders'],
	['claude', 'Claude', 'claude'],
	['pc', 'Este computador', 'monitor'],
	['pod', 'Pod (nuvem)', 'server'],
	['drive', 'Google Drive', 'download'],
	['avisos', 'Avisos', 'bell'],
];
async function abrirPreferencias(inicial = 'edicao') {
	await carregarConfig();
	const p = S.prefs ?? {}, c = S.config ?? {}, pod = c.pod ?? {};
	const sel = (nome, valor, opcoes) => `<select name="${nome}">${opcoes.map(([v, t]) => `<option value="${esc(v)}" ${String(valor) === String(v) ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>`;
	const chave = (nome, valor, titulo, sub) => `<label class="interruptor"><input type="checkbox" name="${nome}" ${valor ? 'checked' : ''}><span class="trilho"></span><span class="txt">${esc(titulo)}${sub ? `<small>${esc(sub)}</small>` : ''}</span></label>`;
	const txt = (nome, valor, titulo, ph = '', tipo = 'text', ajuda = '') => `<div class="campo"><label class="rotulo">${esc(titulo)}</label><input type="${tipo}" name="${nome}" value="${esc(valor ?? '')}" placeholder="${esc(ph)}">${ajuda ? `<span class="ajuda">${esc(ajuda)}</span>` : ''}</div>`;
	const campo = (titulo, html, ajuda = '') => `<div class="campo"><label class="rotulo">${esc(titulo)}</label>${html}${ajuda ? `<span class="ajuda">${esc(ajuda)}</span>` : ''}</div>`;
	const breve = S.configOk === false ? `<div class="em-breve">${ic('info')}As preferências chegam na próxima atualização do painel. Use "Atualizar e reabrir".</div>` : '';
	const blocos = {
		edicao: `<h4>Preferências de edição</h4><p class="pref-desc">Valem em todo computador (vão para a nuvem junto com a biblioteca). O Claude segue isso em toda edição.</p>` +
			`<div class="grade-2">${campo('Formato padrão de vídeo novo', sel('prefs.formatoPadrao', p.formatoPadrao ?? 'vertical', [['auto', 'Deixar a IA decidir'], ['vertical', 'Vertical (Reels/Shorts)'], ['horizontal', 'Horizontal (YouTube)']]))}` +
			campo('Resolução da prévia', sel('prefs.resPrevia', p.resPrevia ?? 720, [[540, '540p (mais rápida)'], [720, '720p'], [1080, '1080p (igual ao final)']])) +
			campo('Intensidade da edição', sel('prefs.intensidade', p.intensidade ?? 'normal', [['auto', 'Deixar a IA decidir'], ['calma', 'Calma'], ['normal', 'Normal'], ['frenetica', 'Frenética']])) +
			campo('Legenda padrão', sel('prefs.legendaPadrao', p.legendaPadrao ?? 'palavra', [['auto', 'Deixar a IA decidir'], ['palavra', 'Palavra por palavra'], ['ouro', 'Ouro'], ['impacto', 'Impacto'], ['neon', 'Neon']])) + '</div>' +
			chave('prefs.amostras', p.amostras ?? false, 'Receber amostras durante a edição para eu decidir', 'Ligado: nas escolhas de estilo, o Claude mostra 2 ou 3 opções em imagem e espera você escolher. Desligado: ele decide sozinho e segue até a prévia.') +
			chave('prefs.confirmarFinal', p.confirmarFinal ?? true, 'Pedir confirmação antes do vídeo final', 'Evita gastar tempo renderizando sem querer.') +
			chave('prefs.salvarSozinho', p.salvarSozinho ?? false, 'Salvar na nuvem sozinho', 'Envia para o GitHub ao terminar cada edição.') +
			chave('prefs.salvarAoFechar', p.salvarAoFechar ?? true, 'Salvar na nuvem ao fechar o painel', 'Envia tudo para o GitHub quando você fecha a aba do painel ou a janela preta.') +
			campo('Sempre faça', `<textarea name="prefs.sempre" rows="4" placeholder="Ex.: sempre coloque meu @ no final; nunca use a cor vermelha; legenda sempre em caixa alta.">${esc(p.sempre ?? '')}</textarea>`, 'Instruções que o Claude segue em todos os vídeos.'),
		claude: `<h4>Claude</h4><p class="pref-desc">O modelo que faz as edições neste computador.</p>` +
			campo('Modelo', sel('config.modelo', c.modelo ?? '', [['auto', 'Automático: escolhe modelo e esforço a cada etapa'], ['', 'Padrão da conta'], ['opus', 'Opus (mais capaz)'], ['sonnet', 'Sonnet (equilíbrio)'], ['haiku', 'Haiku (mais rápido e barato)']]), 'No automático (padrão, o que menos gasta): análise de referências e roteiro vão para o Opus com esforço médio; criação de peças, para o Sonnet; ajustes, para o Sonnet com esforço baixo; perguntas e comandos simples, para o Haiku.') +
			campo('Esforço (quando o modelo não é automático)', sel('config.esforco', c.esforco ?? '', [['', 'Padrão'], ['low', 'Baixo (mais rápido)'], ['medium', 'Médio'], ['high', 'Alto (pensa mais)']])) +
			`<p class="pref-desc">Status: ${S.claude ? (S.claude.instalado ? (S.claude.logado ? '<span class="selo ok">instalado e conectado</span>' : '<span class="selo alerta">falta entrar na conta</span>') : '<span class="selo erro">não instalado</span>') : '—'}</p>` +
			(S.claude?.instalado ? `<p class="pref-desc">Conta: <b>${S.claude.logado ? esc(S.claude.email || 'conectada') : 'nenhuma'}</b></p><div class="linha"><button type="button" class="btn" id="pfTrocarConta">${ic('key')}<span>${S.claude.logado ? 'Trocar de conta' : 'Entrar na conta'}</span></button></div>` : ''),
		pc: `<h4>Este computador</h4><p class="pref-desc">Só valem aqui. Ajuste se o Studio ou o render estiverem lentos ou falhando.</p>` +
			chave('config.gpuStudio', c.gpuStudio ?? true, 'Usar a placa de vídeo (GPU) no Studio', 'Abre o Studio num navegador com aceleração forçada.') +
			chave('config.gpuCodificador', c.gpuCodificador ?? true, 'Usar o codificador da placa de vídeo no render', 'NVENC/QuickSync/AMF: exporta mais rápido. Desligue se o vídeo sair com defeito.') +
			txt('config.navegadorRender', c.navegadorRender, 'Navegador usado no render', 'deixe vazio para automático', 'text', 'Caminho de um Chrome/Chromium específico, se precisar.'),
		pod: `<h4>Pod (computador na nuvem)</h4><p class="pref-desc">Um computador com placa de vídeo forte (ex.: RunPod) que renderiza por você. Ligue aqui para ser o padrão; na aba Render dá para escolher a cada vez.</p>` +
			chave('config.pod.ativo', pod.ativo ?? false, 'Renderizar no pod por padrão', 'Desligado: tudo roda neste computador.') +
			`<div class="campo"><label class="rotulo">Comando SSH do RunPod</label><input type="text" id="pfSshCola" placeholder="Cole aqui: ssh root@194.68.245.12 -p 13456 -i ~/.ssh/id_ed25519"><span class="ajuda">Só isso: o painel preenche endereço, porta e usuário. A chave padrão do seu PC é usada se você não informar outra. Fica salvo ao clicar em Salvar ou Testar.</span></div>` +
			`<details><summary class="rotulo">Avançado (preenchido sozinho)</summary>` +
			`<div class="grade-2">${txt('config.pod.host', pod.host, 'Endereço (host)', 'ex.: 194.68.245.12')}${txt('config.pod.porta', pod.porta ?? 22, 'Porta SSH', '22', 'number')}` +
			`${txt('config.pod.usuario', pod.usuario ?? 'root', 'Usuário', 'root')}${txt('config.pod.pasta', pod.pasta ?? '/workspace/edicao', 'Pasta no pod', '/workspace/edicao')}</div>` +
			txt('config.pod.chave', pod.chave, 'Chave SSH (caminho do arquivo)', 'ex.: C:\\Users\\voce\\.ssh\\id_ed25519', 'text', 'O arquivo da chave privada que dá acesso ao pod.') +
			campo('Modo de desenho (gl)', sel('config.pod.gl', pod.gl ?? 'angle-egl', [['angle-egl', 'angle-egl (recomendado em GPU NVIDIA)'], ['egl', 'egl'], ['angle', 'angle'], ['vulkan', 'vulkan'], ['swangle', 'swangle (sem GPU)'], ['swiftshader', 'swiftshader (sem GPU)']])) +
			`</details>` +
			`<div class="linha"><button class="btn" id="pfTestar">${ic('zap')}<span>Testar conexão</span></button><button class="btn" id="pfPreparar">${ic('download')}<span>Preparar pod</span></button></div>` +
			`<div id="pfResultado" class="resultado-teste" hidden></div>`,
		drive: `<h4>Google Drive</h4><p class="pref-desc">Vincula as pastas <b>edição</b> (onde o painel guarda vídeos finais, mídias e modelos, e que tem um pack) e <b>InfynityPack</b> (pack extra) pelo Drive para computador. Nada é importado: o painel lê direto da unidade do Drive. Vale só neste computador.</p>` +
			`<div id="pfDrive" class="resultado-teste">Verificando o Drive...</div>` +
			`<div class="linha"><button type="button" class="btn primario" id="pfDriveVincular">${ic('link')}<span>Vincular e puxar as 2 pastas</span></button><button type="button" class="btn" id="pfDrivePuxar">${ic('download')}<span>Puxar de novo</span></button></div>`,
		avisos: `<h4>Avisos</h4><p class="pref-desc">Receba um aviso do navegador quando uma prévia ou o vídeo final terminar, mesmo com o painel em segundo plano.</p>` +
			chave('config.notificar', c.notificar ?? true, 'Avisar quando um render terminar') +
			`<div class="linha"><button class="btn" id="pfPermitir">${ic('bell')}<span>Permitir avisos do navegador</span></button><span id="pfPerm" class="selo"></span></div>`,
	};
	abrirModal({
		titulo: 'Preferências',
		larga: true,
		corpo: `<form id="formPrefs" class="prefs" onsubmit="return false"><nav>${SECOES_PREFS.map(([id, t, i]) => `<button type="button" data-sec="${id}">${ic(i)}<span>${t}</span></button>`).join('')}</nav>` +
			`<div class="pref-corpo">${breve}${SECOES_PREFS.map(([id]) => `<section data-bloco="${id}" hidden>${blocos[id]}</section>`).join('')}</div></form>`,
		rodape: `<button class="btn fantasma" id="pfNao">Fechar</button><button class="btn primario" id="pfSalvar" ${S.configOk === false ? 'disabled' : ''}>${ic('check')}<span>Salvar preferências</span></button>`,
	});
	const mostrar = (id) => {
		$$('#formPrefs [data-sec]').forEach((b) => b.classList.toggle('on', b.dataset.sec === id));
		$$('#formPrefs [data-bloco]').forEach((s) => (s.hidden = s.dataset.bloco !== id));
	};
	mostrar(SECOES_PREFS.some(([id]) => id === inicial) ? inicial : 'edicao');
	$('#formPrefs nav').onclick = (e) => { const b = e.target.closest('[data-sec]'); if (b) mostrar(b.dataset.sec); };
	if (S.configOk === false) $$('#formPrefs input,#formPrefs select,#formPrefs textarea').forEach((el) => (el.disabled = true));
	const perm = () => { const el = $('#pfPerm'); if (!el) return; const v = 'Notification' in window ? Notification.permission : 'indisponível'; el.textContent = {granted: 'permitido', denied: 'bloqueado no navegador', default: 'ainda não permitido'}[v] ?? v; el.className = 'selo ' + (v === 'granted' ? 'ok' : v === 'denied' ? 'erro' : ''); };
	perm();
	$('#pfPermitir').onclick = async () => { if ('Notification' in window) await Notification.requestPermission().catch(() => {}); perm(); };
	$('#pfNao').onclick = fecharModal;
	const trocar = $('#pfTrocarConta');
	if (trocar) trocar.onclick = async () => {
		if (S.chatAtivo) return aviso('Espere o Claude terminar o pedido atual antes de trocar de conta.', 'erro');
		if (S.claude?.logado && !confirm('Sair da conta atual e entrar com outra?')) return;
		trocar.disabled = true;
		trocar.querySelector('span').textContent = 'Conclua o login na janela do navegador...';
		try { await api('/api/claude/trocar', {}); } catch (e) { trocar.disabled = false; return avisoErro(e, 'Não consegui trocar'); }
		fecharModal();
		aviso('Entre com a outra conta na janela do navegador que abriu.', 'info');
		await new Promise((r) => setTimeout(r, 1500));
		clearInterval(lendoClaude);
		lendoClaude = setInterval(verificarClaude, 3000);
		verificarClaude();
	};
	const coletar = () => {
		const out = {prefs: {}, config: {pod: {}}};
		for (const el of $$('#formPrefs [name]')) {
			const [raiz, ...k] = el.name.split('.');
			let alvo = out[raiz];
			while (k.length > 1) alvo = alvo[k.shift()];
			alvo[k[0]] = el.type === 'checkbox' ? el.checked : el.type === 'number' || /^(resPrevia)$/.test(k[0]) ? Number(el.value) : el.value;
		}
		return out;
	};
	const salvar = async (silencioso = false) => {
		if (S.configOk === false) return false;
		try {
			await api('/api/config', coletar());
			await carregarConfig();
			S.usarPod = null;
			renderRender();
			if (!silencioso) aviso('Preferências salvas.', 'ok');
			return true;
		} catch (e) { avisoErro(e, 'Não salvei'); return false; }
	};
	$('#pfSalvar').onclick = async () => { if (await salvar()) fecharModal(); };
	const resultado = (texto, ok) => { const r = $('#pfResultado'); r.hidden = false; r.textContent = texto; r.className = 'resultado-teste ' + (ok === true ? 'ok' : ok === false ? 'erro' : ''); };
	$('#pfTestar').onclick = async (e) => {
		const b = e.currentTarget;
		b.disabled = true;
		resultado('Salvando e testando a conexão com o pod...', null);
		try {
			if (S.configOk !== false) await salvar(true);
			const r = await api('/api/pod/testar', {});
			resultado(r?.texto || (r?.ok ? 'Conexão OK.' : 'Falhou.'), !!r?.ok);
		} catch (er) { resultado(er.emBreve ? 'O teste do pod chega na próxima atualização do painel.' : er.message, false); }
		b.disabled = false;
	};
	// Google Drive: status, vincular as 2 pastas e puxar (copia só o que mudou, em segundo plano).
	const driveTxt = (d) => {
		if (!d || d.erro) return [`Não consegui verificar: ${d?.erro ?? 'sem resposta'}`, false];
		if (!d.raizes?.length) return ['Drive para computador não encontrado. Instale, entre na conta e abra o Drive.', false];
		const v = d.vinculo, linhas = [];
		linhas.push(`edição: ${d.edicao ? 'encontrada' : 'NÃO encontrada em Meu Drive'}${v?.salvar ? ' · vinculada' : ''}`);
		linhas.push(`InfynityPack: ${d.infynity ? 'encontrada' : 'NÃO encontrada (abra o link e use Organizar > Adicionar atalho)'}${v?.packs?.length > 1 ? ' · vinculada' : ''}`);
		if (d.job?.rodando) linhas.push('Puxando: ' + d.job.fase + '...');
		else if (d.job?.erro) linhas.push('Erro ao puxar: ' + d.job.erro);
		else if (d.job?.resultado) linhas.push(`Pronto. ${d.job.resultado.novos ?? 0} arquivos novos no catálogo do pack.`);
		return [linhas.join('\n'), !!d.edicao && !!d.infynity && !d.job?.erro];
	};
	const driveAtualizar = async () => {
		const alvo = $('#pfDrive');
		if (!alvo) return;
		try { const d = await api('/api/drive'); const [t, ok] = driveTxt(d); alvo.textContent = t; alvo.className = 'resultado-teste ' + (ok ? 'ok' : 'erro'); alvo.style.whiteSpace = 'pre-line'; if (d.job?.rodando) setTimeout(driveAtualizar, 3000); }
		catch (er) { alvo.textContent = er.emBreve ? 'O Drive chega na próxima atualização do painel.' : er.message; alvo.className = 'resultado-teste erro'; }
	};
	driveAtualizar();
	$('#pfDriveVincular').onclick = async (e) => {
		const b = e.currentTarget; b.disabled = true;
		try { await api('/api/drive/vincular', {}); await api('/api/drive/puxar', {}); aviso('Drive vinculado. Puxando as pastas...', 'info'); } catch (er) { avisoErro(er, 'Drive'); }
		b.disabled = false; driveAtualizar();
	};
	$('#pfDrivePuxar').onclick = async () => { try { await api('/api/drive/puxar', {}); } catch (er) { avisoErro(er, 'Drive'); } driveAtualizar(); };
	// Colar o comando inteiro do RunPod ("ssh root@IP -p PORTA -i chave") no campo Endereço preenche host, porta, usuário e chave.
	const campoPod = (n) => document.querySelector(`[name="config.pod.${n}"]`);
	const lerSsh = (texto) => {
		const m = /ssh\s+(?:-\S+\s+\S+\s+)*(?:([A-Za-z_][\w.-]*)@)?([A-Za-z0-9][A-Za-z0-9.-]*)/.exec(texto);
		if (!m) return false;
		const porta = /-p\s*(\d{1,5})/.exec(texto)?.[1];
		const chave = /-i\s+("[^"]+"|\S+)/.exec(texto)?.[1]?.replace(/^"|"$/g, '');
		campoPod('host').value = m[2];
		if (m[1]) campoPod('usuario').value = m[1];
		if (porta) campoPod('porta').value = porta;
		if (chave && !chave.startsWith('~')) campoPod('chave').value = chave;
		return true;
	};
	$('#pfSshCola')?.addEventListener('input', (e) => { if (lerSsh(e.target.value)) aviso('Comando SSH lido: endereço, porta e usuário preenchidos.', 'ok'); });
	campoPod('host')?.addEventListener('input', (e) => { if (/\s/.test(e.target.value) && lerSsh(e.target.value)) aviso('Comando SSH lido: preenchi endereço, porta e usuário.', 'ok'); });
	$('#pfPreparar').onclick = async () => {
		if (S.configOk !== false) await salvar(true);
		if (await criarTarefa('preparar-pod', {}, {projeto: proj()})) resultado('Preparando o pod (instala Node, ffmpeg e o projeto). Acompanhe na aba Render.', null);
	};
}
$('#abrirPrefs').onclick = () => abrirPreferencias();
// Avisa o painel quando a aba fecha, para ele salvar na nuvem (ele espera alguns segundos e desiste se a página voltar).
addEventListener('pagehide', () => { if (T) navigator.sendBeacon('/api/fechou?t=' + encodeURIComponent(T)); });

// ---------- Tarefas (render, link, pack...) ----------
const NOMES_TAREFA = {previa: 'Prévia', final: 'Vídeo final', transcrever: 'Transcrição', roteiro: 'Roteiro', conferir: 'Conferência', link: 'Baixar link', pack: 'Importar pack', 'preparar-pod': 'Preparar pod', previas: 'Prévias'};
const ESTADOS = {fila: ['Na fila', ''], rodando: ['Rodando', 'cor'], ok: ['Pronto', 'ok'], erro: ['Erro', 'erro'], cancelado: ['Cancelado', 'alerta']};
async function criarTarefa(tipo, opcoes = {}, {projeto = proj(), silencioso = false} = {}) {
	try {
		const r = await api('/api/tarefas', {tipo, projeto, opcoes});
		if (!silencioso) aviso(`${NOMES_TAREFA[tipo] ?? tipo}: ${S.tarefas.some((t) => t.estado === 'rodando' && ['previa', 'final'].includes(t.tipo)) && ['previa', 'final'].includes(tipo) ? 'entrou na fila.' : 'começou.'} Acompanhe na aba Render.`, 'info');
		S.tarefasOk = true;
		await pollTarefas();
		return r?.id ?? true;
	} catch (e) {
		if (e.emBreve) S.tarefasOk = false;
		avisoErro(e, NOMES_TAREFA[tipo] ?? tipo);
		return false;
	}
}
let tPoll = null, emPoll = false;
const conhecidas = new Map();
async function pollTarefas() {
	clearTimeout(tPoll);
	if (emPoll) return;
	emPoll = true;
	let lista = null;
	try {
		lista = await api('/api/tarefas');
		S.tarefasOk = true;
	} catch (e) {
		if (e.emBreve) S.tarefasOk = false;
	}
	emPoll = false;
	if (Array.isArray(lista)) {
		const primeira = !conhecidas.size;
		for (const t of lista) {
			const antes = conhecidas.get(t.id);
			conhecidas.set(t.id, t.estado);
			if (primeira || !antes || antes === t.estado) continue;
			if (['ok', 'erro', 'cancelado'].includes(t.estado) && ['fila', 'rodando'].includes(antes)) aoTerminarTarefa(t);
		}
		S.tarefas = lista;
	}
	renderTarefas();
	atualizarPilulas();
	const ativo = S.tarefas.some((t) => t.estado === 'fila' || t.estado === 'rodando');
	tPoll = setTimeout(pollTarefas, ativo ? 1000 : S.tarefasOk === false ? 30000 : 6000);
}
function aoTerminarTarefa(t) {
	const nome = NOMES_TAREFA[t.tipo] ?? t.tipo;
	const de = t.projeto ? ` (${t.projeto})` : '';
	if (t.estado === 'ok') {
		aviso(`${nome}${de} terminou.`, 'ok', {titulo: 'Pronto!'});
		if (['previa', 'final'].includes(t.tipo)) notificar(`${nome} pronta${de}`, 'Clique para assistir no painel.');
	} else if (t.estado === 'erro') {
		aviso(t.erro || 'Algo deu errado.', 'erro', {titulo: `${nome}${de} falhou`});
		if (['previa', 'final'].includes(t.tipo)) notificar(`${nome} falhou${de}`, String(t.erro || '').slice(0, 120));
	}
	if (['previa', 'final'].includes(t.tipo)) carregarProjetos().then(renderProntos).catch(() => {});
	if (t.tipo === 'link') {
		const tema = S.analisarAoBaixar.get(t.id);
		if (tema) {
			S.analisarAoBaixar.delete(t.id);
			if (S.temaAberto === tema && !$('#tv').hidden) carregarModelos(tema);
			if (t.estado === 'ok' && t.saida) analisarModelo(tema, [String(t.saida).split('/').pop()]);
		} else carregarMidias();
	}
	if (t.tipo === 'pack') carregarBiblioteca();
	if (t.tipo === 'previas') carregarPrevias();
	carregarFluxo();
}
const urlSaida = (s) => (s && /\.(mp4|mov|webm)$/i.test(s) ? `/out/${enc(String(s).split(/[\\/]/).pop())}?t=${T}` : '');
const logsAbertos = new Set();
function cartaoTarefa(t) {
	const [rot, cls] = ESTADOS[t.estado] ?? [t.estado, ''];
	const pct = typeof t.pct === 'number' ? Math.max(0, Math.min(100, t.pct)) : null;
	const ativa = t.estado === 'rodando' || t.estado === 'fila';
	const barra = t.estado === 'rodando' ? `<div class="barra ${pct === null ? 'indef' : ''}"><i style="width:${pct ?? 0}%"></i></div>` : t.estado === 'ok' ? '<div class="barra ok"><i style="width:100%"></i></div>' : t.estado === 'fila' ? '<div class="barra"><i style="width:0"></i></div>' : '';
	const decorrido = t.inicio ? ((t.fim || Date.now()) - t.inicio) / 1000 : null;
	const url = t.estado === 'ok' && ['previa', 'final'].includes(t.tipo) ? urlSaida(t.saida) : '';
	return `<div class="tarefa ${t.estado}" data-id="${esc(t.id)}">` +
		`<div class="t-topo"><b>${esc(NOMES_TAREFA[t.tipo] ?? t.tipo)}</b><span class="proj">${esc(t.projeto || '')}</span><span class="selo ${cls}">${esc(rot)}</span></div>` +
		(ativa ? `<div class="t-fase"><span>${esc(t.fase || (t.estado === 'fila' ? 'Esperando a vez' : 'Começando...'))}</span>${t.estado === 'rodando' && pct !== null ? `<span class="pct">${Math.round(pct)}%</span>` : ''}</div>` : '') +
		barra +
		`<div class="t-meta"><span>${ic(t.onde === 'pod' ? 'server' : 'monitor')}${t.onde === 'pod' ? 'No pod' : 'Neste PC'}</span>` +
		(t.estado === 'rodando' && typeof t.eta === 'number' ? `<span>${ic('clock')}faltam ${duracao(t.eta)}</span>` : '') +
		(decorrido !== null && t.estado !== 'fila' ? `<span>${t.estado === 'rodando' ? 'há' : 'levou'} ${duracao(decorrido)}</span>` : '') +
		(t.fim && !ativa ? `<span>${quando(t.fim)}</span>` : '') + '</div>' +
		(t.aviso ? `<div class="t-aviso">${esc(t.aviso)}</div>` : '') +
		(t.estado === 'erro' && t.erro ? `<div class="t-erro">${esc(t.erro)}</div>` : '') +
		(url ? `<video controls preload="metadata" src="${esc(url)}"></video>` : '') +
		`<div class="t-acoes">` +
		(ativa ? `<button class="btn mini perigo" data-cancelar="${esc(t.id)}">${ic('x')}<span>Cancelar</span></button>` : '') +
		(t.estado === 'ok' && ['previa', 'final'].includes(t.tipo) ? `<button class="btn mini" data-pasta="saida" data-proj="${esc(t.projeto || '')}">${ic('folder')}<span>Abrir pasta</span></button>` : '') +
		(t.estado === 'ok' && t.tipo === 'link' ? `<button class="btn mini" data-pasta="${esc(t.opcoes?.destino || 'referencias')}" data-proj="${esc(t.projeto || '')}">${ic('folder')}<span>Abrir pasta</span></button>` : '') +
		(['erro', 'cancelado'].includes(t.estado) && ['previa', 'final', 'transcrever', 'roteiro', 'conferir'].includes(t.tipo) ? `<button class="btn mini" data-repetir="${esc(t.tipo)}" data-proj="${esc(t.projeto || '')}">${ic('refresh')}<span>Tentar de novo</span></button>` : '') +
		`</div>` +
		(t.log?.length ? `<details data-log="${esc(t.id)}" ${logsAbertos.has(t.id) ? 'open' : ''}><summary>Ver detalhes técnicos</summary><pre>${esc(t.log.join('\n'))}</pre></details>` : '') +
		'</div>';
}
const assinaturas = new Map();
function renderTarefas() {
	const el = $('#filaTarefas');
	if (!el) return;
	if (S.tarefasOk === false) {
		el.innerHTML = `<div class="em-breve">${ic('info')}A fila de render com % chega na próxima atualização do painel. Por enquanto, os botões pedem a prévia ao Claude.</div>`;
		assinaturas.clear();
		return;
	}
	const lista = S.tarefas.slice(0, 15);
	if (!lista.length) {
		el.innerHTML = `<div class="vazio">${ic('layers')}<b>Nenhuma tarefa ainda</b>Prévias, vídeos finais, downloads e importações aparecem aqui com a porcentagem e o tempo que falta.</div>`;
		assinaturas.clear();
		return;
	}
	el.querySelector('.vazio,.em-breve')?.remove();
	const ids = new Set(lista.map((t) => t.id));
	for (const c of $$('.tarefa', el)) if (!ids.has(c.dataset.id)) { c.remove(); assinaturas.delete(c.dataset.id); }
	let anterior = null;
	for (const t of lista) {
		const ass = JSON.stringify([t.estado, t.fase, t.pct, t.eta, t.onde, t.saida, t.aviso, t.erro, t.log?.length, t.log?.at?.(-1), t.estado === 'rodando' ? Math.floor(Date.now() / 5000) : 0]);
		let c = el.querySelector(`.tarefa[data-id="${CSS.escape(String(t.id))}"]`);
		if (!c || assinaturas.get(t.id) !== ass) {
			const novo = document.createElement('div');
			novo.innerHTML = cartaoTarefa(t);
			const n = novo.firstChild;
			if (c) {
				// Mantém o vídeo que já está tocando.
				const vAntigo = c.querySelector('video'), vNovo = n.querySelector('video');
				if (vAntigo && vNovo && vAntigo.getAttribute('src') === vNovo.getAttribute('src')) vNovo.replaceWith(vAntigo);
				c.replaceWith(n);
			} else if (anterior) anterior.after(n); else el.prepend(n);
			c = n;
			assinaturas.set(t.id, ass);
		}
		if (anterior && c.previousElementSibling !== anterior) anterior.after(c);
		anterior = c;
	}
}
document.addEventListener('toggle', (e) => { const d = e.target; if (d.dataset?.log) d.open ? logsAbertos.add(d.dataset.log) : logsAbertos.delete(d.dataset.log); }, true);
async function abrirPasta(onde, projeto = proj()) {
	try { await api('/api/abrir-pasta', {projeto, onde}); aviso('Pasta aberta no explorador de arquivos.', 'ok', {ms: 2500}); }
	catch (e) { avisoErro(e, 'Não abri a pasta'); }
}

// ---------- Aba Prévias: imagens de como a edição está ficando (geradas sem gastar limite do Claude) ----------
async function carregarPrevias() {
	const el = $('#aba-previas');
	const p = proj();
	if (!el) return;
	if (!p) { el.innerHTML = '<div class="vazio">Escolha um vídeo para ver as imagens da edição.</div>'; return; }
	let d;
	try { d = await api('/api/previas?projeto=' + enc(p)); } catch (e) { el.innerHTML = `<div class="vazio">${ic('alert')}<b>Não carreguei as prévias</b>${esc(e.message)}</div>`; return; }
	const gerando = (S.tarefas ?? []).some((t) => t.tipo === 'previas' && t.projeto === p && ['fila', 'rodando'].includes(t.estado));
	const quando = d.geradoEm ? new Date(d.geradoEm).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : '';
	const topo = `<div class="previas-topo"><button class="btn primario" id="prGerar" ${gerando ? 'disabled' : ''}>${ic('refresh')}<span>${gerando ? 'Gerando...' : 'Gerar imagens agora'}</span></button>` +
		`<small>${d.itens?.length ? `${d.itens.length} imagens, geradas às ${quando}${d.desatualizada ? ' · <b>a edição mudou depois: gere de novo</b>' : ''}` : 'Ainda não há imagens deste vídeo.'}</small></div>`;
	const grade = (d.itens ?? []).map((i) => {
		const url = `/previas/${enc(p)}/${enc(i.arquivo)}?t=${T}&v=${d.geradoEm}`;
		const min = Math.floor(i.t / 60), seg = String(Math.floor(i.t % 60)).padStart(2, '0');
		return `<figure class="previa"><img loading="lazy" src="${esc(url)}" alt="${esc(i.tipo)}" data-ver-midia="${esc(url)}" data-nome="${esc(i.tipo)} ${min}:${seg}"><figcaption><b>${min}:${seg} · ${esc(i.tipo)}</b>${i.texto ? `<small>${esc(i.texto)}</small>` : ''}<button class="btn mini fantasma" data-mudar="${min}:${seg}|${esc(i.tipo)}|${esc(i.texto)}">${ic('edit')}<span>Mudar isto</span></button></figcaption></figure>`;
	}).join('');
	el.innerHTML = topo + (grade ? `<div class="previas-grade">${grade}</div>` : '');
	el.querySelectorAll('[data-mudar]').forEach((bt) => (bt.onclick = () => {
		const [tempo, tipo, texto] = bt.dataset.mudar.split('|');
		const c = $('#pedido');
		c.value = `Na prévia em ${tempo} (cena "${tipo}"${texto ? `, texto "${texto}"` : ''}): `;
		c.focus();
		ajustarCaixa();
	}));
	const b = $('#prGerar');
	if (b) b.onclick = async () => { b.disabled = true; if (await criarTarefa('previas', {}, {projeto: p, silencioso: true})) aviso('Gerando as imagens da edição...', 'info', {ms: 2500}); carregarPrevias(); };
}

// ---------- Aba Render ----------
function mostrarAba(a) {
	S.aba = a;
	gravarLocal('aba', a);
	$$('.abas [data-aba]').forEach((b) => { b.classList.toggle('on', b.dataset.aba === a); b.setAttribute('aria-selected', b.dataset.aba === a); });
	$$('.painel-aba').forEach((p) => (p.hidden = p.id !== 'aba-' + a));
	if (a === 'previas') carregarPrevias();
}
$('.abas').onclick = (e) => { const b = e.target.closest('[data-aba]'); if (b) mostrarAba(b.dataset.aba); };
function renderRender() {
	const el = $('#aba-render');
	const p = proj();
	const res = Number(lerLocal('resPrevia', null) ?? S.prefs?.resPrevia ?? 720);
	const pod = S.config?.pod;
	const usando = usarPodAgora();
	const podSub = !S.config ? 'Configure o pod em Preferências' : usando ? (pod?.host ? `Vai para ${pod.host}` : 'Pod sem endereço: abra Preferências › Pod') : 'Desligado: roda neste computador';
	el.innerHTML =
		`<div class="pod-linha"><label class="interruptor"><input type="checkbox" id="usarPod" ${usando ? 'checked' : ''} ${!S.config ? 'disabled' : ''}><span class="trilho"></span><span class="txt">Renderizar no pod<small>${esc(podSub)}</small></span></label><button class="btn icone mini fantasma" id="cfgPod" title="Configurar o pod" aria-label="Configurar o pod">${ic('gear')}</button></div>` +
		(!p ? `<div class="vazio" style="margin-bottom:12px">${ic('film')}<b>Escolha um vídeo</b>Selecione um vídeo no topo (ou crie em “Novo vídeo”, no topo) para gerar a prévia ou o resultado final.</div>` :
			`<div class="cartao"><div class="cartao-topo"><h4>${ic('play')}Prévia</h4><span class="selo">rápida</span></div><p class="legenda">Para conferir a edição antes do final.</p>` +
			`<div class="campo"><span class="rotulo">Resolução</span><div class="segmentos">${[540, 720, 1080].map((r) => `<label><input type="radio" name="res" value="${r}" ${r === res ? 'checked' : ''}><span>${r}p</span></label>`).join('')}</div></div>` +
			`<div class="campo"><span class="rotulo">Trecho <small>(opcional, em segundos ou min:seg)</small></span><div class="trecho"><input type="text" id="trDe" placeholder="de 0:00" inputmode="decimal" aria-label="Início do trecho"><input type="text" id="trAte" placeholder="até o fim" inputmode="decimal" aria-label="Fim do trecho"></div></div>` +
			`<button class="btn primario bloco grande" id="btPrevia">${ic('play')}<span>Gerar prévia</span></button></div>` +
			`<div class="cartao"><div class="cartao-topo"><h4>${ic('star')}Resultado final</h4><span class="selo cor">1080p</span></div><p class="legenda">Qualidade máxima, pronto para publicar. Faça depois de aprovar a prévia.</p>` +
			`<button class="btn bloco grande" id="btFinal">${ic('download')}<span>Renderizar final</span></button></div>`) +
		`<div class="titulo-secao">${ic('layers')}Fila de tarefas</div><div id="filaTarefas"></div>` +
		(p ? `<div class="titulo-secao">${ic('film')}Vídeos prontos<button class="btn mini fantasma" data-pasta="saida">${ic('folder')}<span>Abrir pasta</span></button></div><div id="prontos" class="prontos"></div>` +
			`<div class="linha" style="margin-top:12px"><button class="btn bloco" id="btStudioProj">${ic('monitor')}<span>Abrir este vídeo no Studio</span></button></div>` : '');
	assinaturas.clear();
	renderTarefas();
	renderProntos();
	$('#usarPod').onchange = (e) => {
		S.usarPod = e.target.checked;
		if (S.usarPod && !S.config?.pod?.host) aviso('O pod ainda não tem endereço. Configure em Preferências › Pod.', 'alerta');
		renderRender();
		atualizarPilulas();
	};
	$('#cfgPod').onclick = () => abrirPreferencias('pod');
	if (!p) return;
	$$('[name=res]', el).forEach((r) => (r.onchange = () => gravarLocal('resPrevia', Number(r.value))));
	$('#btPrevia').onclick = () => gerarPrevia();
	$('#btFinal').onclick = () => gerarFinal();
	$('#btStudioProj').onclick = () => studio(p);
}
function lerTrecho() {
	const de = lerTempo($('#trDe')?.value), ate = lerTempo($('#trAte')?.value);
	if (Number.isNaN(de) || Number.isNaN(ate)) { aviso('Trecho inválido. Use segundos (ex.: 12) ou min:seg (ex.: 1:05).', 'erro'); return null; }
	if (de !== null && ate !== null && ate <= de) { aviso('O fim do trecho precisa ser depois do início.', 'erro'); return null; }
	return {de, ate};
}
async function gerarPrevia() {
	const p = proj();
	if (!p) return aviso('Escolha um vídeo primeiro.', 'alerta');
	const tr = lerTrecho();
	if (!tr) return;
	const res = Number($('[name=res]:checked')?.value ?? S.prefs?.resPrevia ?? 720);
	const opcoes = {res, pod: usarPodAgora()};
	if (tr.de !== null) opcoes.de = tr.de;
	if (tr.ate !== null) opcoes.ate = tr.ate;
	pedirPermissaoAvisos();
	mostrarAba('render');
	if (S.tarefasOk === false) return usarPedido(`Gera a prévia do projeto "${p}" em ${res}p${tr.de !== null || tr.ate !== null ? ` só do trecho de ${tr.de ?? 0}s até ${tr.ate ?? 'o fim'}${tr.ate !== null ? 's' : ''}` : ''}.`, {enviar: true});
	const ok = await criarTarefa('previa', opcoes);
	if (!ok && S.tarefasOk === false) usarPedido(`Gera a prévia do projeto "${p}" em ${res}p.`, {enviar: true});
}
async function gerarFinal() {
	const p = proj();
	if (!p) return aviso('Escolha um vídeo primeiro.', 'alerta');
	if (S.prefs?.confirmarFinal !== false && !(await confirmar('Renderizar o vídeo final?', `Vou gerar "${p}" em qualidade máxima${usarPodAgora() ? ' no pod' : ' neste computador'}. Pode levar vários minutos. Faça isso depois de aprovar a prévia.`, {ok: 'Renderizar final'}))) return;
	pedirPermissaoAvisos();
	mostrarAba('render');
	if (S.tarefasOk === false) return usarPedido(`O vídeo "${p}" está aprovado. Renderiza o vídeo final.`, {enviar: true});
	const ok = await criarTarefa('final', {pod: usarPodAgora()});
	if (!ok && S.tarefasOk === false) usarPedido(`O vídeo "${p}" está aprovado. Renderiza o vídeo final.`, {enviar: true});
}
function renderProntos() {
	const el = $('#prontos');
	if (!el) return;
	const p = proj();
	const vids = S.projetos.find((x) => x.nome === p)?.videos ?? [];
	if (!vids.length) { el.innerHTML = `<div class="vazio">${ic('video')}<b>Nenhum vídeo pronto ainda</b>Gere a prévia acima para assistir aqui.</div>`; return; }
	const i = Math.min(S.videoSel, vids.length - 1);
	const v = vids[i];
	const atual = el.querySelector('video');
	const src = `/out/${enc(v.arquivo)}?t=${T}`;
	const lista = vids.map((x, k) => `<div class="pronto-item ${k === i ? 'on' : ''}" data-vid="${k}">${ic(k === i ? 'play' : 'film')}<span title="${esc(x.arquivo)}">${esc(x.arquivo)}</span><small>${quando(x.data)}</small></div>`).join('');
	if (atual && atual.getAttribute('src') === src) { el.querySelector('.lista-prontos').innerHTML = lista; return; }
	el.innerHTML = `<video controls preload="metadata" src="${esc(src)}"></video><div class="lista-prontos">${lista}</div>`;
}
$('#lado').addEventListener('click', async (e) => {
	const vi = e.target.closest('[data-vid]');
	if (vi) { S.videoSel = Number(vi.dataset.vid); return renderProntos(); }
	const ca = e.target.closest('[data-cancelar]');
	if (ca) { ca.disabled = true; try { await api('/api/tarefas/cancelar', {id: ca.dataset.cancelar}); aviso('Tarefa cancelada.', 'info'); } catch (er) { avisoErro(er, 'Não cancelei'); } return pollTarefas(); }
	const pa = e.target.closest('[data-pasta]');
	if (pa) return abrirPasta(pa.dataset.pasta, pa.dataset.proj || proj());
	const rp = e.target.closest('[data-repetir]');
	if (rp) {
		if (rp.dataset.proj && rp.dataset.proj !== proj()) { $('#projeto').value = rp.dataset.proj; aoTrocarProjeto(); }
		if (rp.dataset.repetir === 'previa') return gerarPrevia();
		if (rp.dataset.repetir === 'final') return gerarFinal();
		return criarTarefa(rp.dataset.repetir);
	}
});

// ---------- Aba Fluxo ----------
const ROTULOS_ACAO = {previa: 'Gerar prévia', final: 'Renderizar final', transcrever: 'Transcrever', roteiro: 'Gerar roteiro', conferir: 'Conferir'};
async function carregarFluxo() {
	const el = $('#aba-fluxo');
	const p = proj();
	if (!p) { el.innerHTML = `<div class="vazio">${ic('list')}<b>Escolha um vídeo</b>O passo a passo mostra o que já foi feito e o próximo passo de cada vídeo: mídia, transcrição, roteiro, cenas, conferência, prévia e final.</div>`; return; }
	if (!S.fluxo) el.innerHTML = '<div class="carregando">Carregando o passo a passo...</div>';
	try {
		S.fluxo = await api('/api/fluxo?projeto=' + enc(p));
	} catch (e) {
		el.innerHTML = e.emBreve ? `<div class="em-breve">${ic('info')}O passo a passo do vídeo chega na próxima atualização do painel.</div>` + fluxoPadrao() : `<div class="vazio">${ic('alert')}<b>Não carreguei o passo a passo</b>${esc(e.message)}</div>`;
		return;
	}
	if (p !== proj()) return;
	renderFluxo();
}
function fluxoPadrao() {
	const etapas = ['Projeto criado', 'Mídia enviada', 'Transcrição', 'Roteiro', 'Cenas', 'Conferência', 'Prévia', 'Vídeo final'];
	return `<ol class="passos">${etapas.map((n, i) => `<li class="passo"><span class="bola">${i + 1}</span><div class="corpo"><div class="cab"><b>${n}</b></div></div></li>`).join('')}</ol>`;
}
function renderFluxo() {
	const el = $('#aba-fluxo');
	const etapas = S.fluxo?.etapas ?? [];
	if (!etapas.length) { el.innerHTML = `<div class="vazio">${ic('list')}<b>Sem etapas</b>Nada para mostrar neste vídeo.</div>`; return; }
	const feitas = etapas.filter((x) => x.feito).length;
	const atual = etapas.findIndex((x) => !x.feito);
	const rodando = (tipo) => S.tarefas.find((t) => t.tipo === tipo && t.projeto === proj() && ['fila', 'rodando'].includes(t.estado));
	el.innerHTML = `<div class="progresso-geral"><div class="barra"><i style="width:${(feitas / etapas.length) * 100}%"></i></div><b>${feitas}/${etapas.length}</b></div>` +
		`<ol class="passos">${etapas.map((x, i) => {
			const a = x.acao;
			const t = a?.tipo === 'tarefa' ? rodando(a.valor) : null;
			let botao = '';
			if (t) botao = `<div class="barra ${typeof t.pct === 'number' ? '' : 'indef'}"><i style="width:${t.pct ?? 0}%"></i></div><small style="color:var(--mudo)">${esc(t.fase || 'Na fila')}${typeof t.pct === 'number' ? ' · ' + Math.round(t.pct) + '%' : ''}</small>`;
			else if (a?.tipo === 'tarefa') botao = `<button class="btn mini ${i === atual ? 'primario' : ''}" data-fl-tarefa="${esc(a.valor)}">${ic(a.valor === 'final' ? 'download' : 'play')}<span>${esc(ROTULOS_ACAO[a.valor] ?? (x.feito ? 'Refazer' : 'Fazer'))}</span></button>`;
			else if (a?.tipo === 'chat') botao = `<button class="btn mini ${i === atual ? 'primario' : ''}" data-fl-chat="${esc(a.valor)}">${ic('chat')}<span>${x.feito ? 'Pedir de novo ao Claude' : 'Pedir ao Claude'}</span></button>`;
			return `<li class="passo ${x.feito ? 'feito' : ''} ${i === atual ? 'atual' : ''}"><span class="bola">${x.feito ? ic('check') : i + 1}</span><div class="corpo"><div class="cab"><b>${esc(x.nome)}</b>${x.feito ? '<span class="selo ok">feito</span>' : i === atual ? '<span class="selo cor">próximo</span>' : ''}</div>${x.detalhe ? `<p>${esc(x.detalhe)}</p>` : ''}${botao}</div></li>`;
		}).join('')}</ol>`;
}
$('#aba-fluxo').onclick = async (e) => {
	const t = e.target.closest('[data-fl-tarefa]'), c = e.target.closest('[data-fl-chat]');
	if (t) {
		const v = t.dataset.flTarefa;
		if (v === 'previa') return gerarPrevia();
		if (v === 'final') return gerarFinal();
		if (v === 'midia') { mostrarAba('midias'); return; }
		return criarTarefa(v);
	}
	if (c) usarPedido(c.dataset.flChat, {enviar: true});
};

// ---------- Abas Mídias e Referências ----------
async function carregarMidias() {
	const p = proj();
	const vazio = (txt) => `<div class="vazio">${ic('folder')}<b>Escolha um vídeo</b>${txt}</div>`;
	if (!p) {
		$('#aba-midias').innerHTML = vazio('As mídias (vídeo bruto, imagens, áudios) ficam guardadas por vídeo.');
		$('#aba-refs').innerHTML = vazio('Referências são vídeos, prints e links do estilo que você quer copiar.');
		return;
	}
	try {
		S.midias = await api('/api/midias?projeto=' + enc(p));
	} catch (e) {
		$('#aba-midias').innerHTML = $('#aba-refs').innerHTML = `<div class="vazio">${ic('alert')}<b>Não carreguei os arquivos</b>${esc(e.message)}</div>`;
		return;
	}
	if (p !== proj()) return;
	renderMidias();
}
function listaArquivos(tipo, itens) {
	const p = proj();
	if (!itens.length) return '';
	return itens.map((m) => {
		const url = `/midia/${enc(p)}/${tipo}/${enc(m.nome)}?t=${T}`;
		const ck = tipo === 'midias' ? `<input type="checkbox" class="sel-midia" data-sel="${esc(m.nome)}" ${(S.selMidias ?? []).includes(m.nome) ? 'checked' : ''} title="Selecionar para juntar em um vídeo só" aria-label="Selecionar ${esc(m.nome)}">` : '';
		const noGrupo = tipo === 'midias' ? (S.midias?.grupos ?? []).findIndex((g) => g.arquivos.includes(m.nome)) : -1;
		return `<div class="arq">${ck}<span class="mini">${eImg(m.nome) ? `<img loading="lazy" src="${esc(url)}" alt="">` : ic(icArquivo(m.nome))}</span><span class="n"><span title="${esc(m.nome)}">${esc(m.nome)}</span><small>${tam(m.tamanho)}${noGrupo >= 0 ? ` · <b>vídeo ${noGrupo + 1}</b>` : ''}</small></span>` +
			(eImg(m.nome) || eVideo(m.nome) || eAudio(m.nome) ? `<button class="btn icone mini fantasma" data-ver-midia="${esc(url)}" data-nome="${esc(m.nome)}" title="Ver" aria-label="Ver">${ic('eye')}</button>` : '') +
			`<button class="btn icone mini fantasma" data-ap="${tipo}" data-nome="${esc(m.nome)}" title="Apagar" aria-label="Apagar">${ic('trash')}</button></div>`;
	}).join('');
}
const zona = (tipo, titulo, txt) => `<div class="zona" data-z="${tipo}">${ic('upload')}<b>${esc(titulo)}</b>${esc(txt)}<input type="file" multiple hidden></div><div class="envio" hidden><small></small><div class="barra"><i></i></div></div>`;
const colarLink = (destino, ph) => `<div class="colar"><input type="url" data-link="${destino}" placeholder="${esc(ph)}"><button class="btn primario" data-baixar="${destino}">${ic('download')}<span>Baixar</span></button></div>`;
// Grupos de mídia: seleciona vários arquivos e define que viram UM vídeo; "todos" ou "a IA escolhe".
const salvarGrupos = async (grupos) => {
	try { const r = await api('/api/midias/grupos', {projeto: proj(), grupos}); S.midias.grupos = r.grupos; S.selMidias = []; renderMidias(); aviso('Grupos salvos. O Claude lê isso no próximo pedido.', 'ok', {ms: 2500}); }
	catch (e) { avisoErro(e, 'Não salvei os grupos'); }
};
function htmlGrupos() {
	const d = S.midias ?? {midias: [], grupos: []};
	if (d.midias.length < 2) return '';
	const sel = (S.selMidias ?? []).filter((n) => d.midias.some((m) => m.nome === n));
	const barra = `<div class="grupo-barra"><b>${sel.length ? `${sel.length} selecionado${sel.length > 1 ? 's' : ''}` : 'Marque 2 ou mais arquivos acima para juntar em um vídeo só'}</b>` +
		(sel.length >= 2 ? `<input type="text" id="grNome" placeholder="Nome do vídeo (opcional)" maxlength="60">` +
		`<label class="gr-op"><input type="radio" name="grModo" value="todos" checked> Usar todos os arquivos</label>` +
		`<label class="gr-op"><input type="radio" name="grModo" value="ia"> A IA escolhe só os que precisar</label>` +
		`<label class="gr-op"><input type="radio" name="grOrdem" value="minha" checked> Ordem: a que eu marquei</label>` +
		`<label class="gr-op"><input type="radio" name="grOrdem" value="ia"> Ordem: a IA define</label>` +
		`<button class="btn primario" id="grCriar">${ic('check')}<span>Juntar em um vídeo só</span></button>` : '') + `</div>`;
	const cards = (d.grupos ?? []).map((g, i) => `<div class="grupo-card" data-g="${i}"><div class="grupo-topo"><b>Vídeo ${i + 1}${g.nome ? ` · ${esc(g.nome)}` : ''}</b>` +
		`<select data-gmodo="${i}"><option value="todos" ${g.modo === 'todos' ? 'selected' : ''}>Usar todos</option><option value="ia" ${g.modo === 'ia' ? 'selected' : ''}>A IA escolhe</option></select>` +
		`<select data-gordem="${i}"><option value="minha" ${g.ordem !== 'ia' ? 'selected' : ''}>Minha ordem</option><option value="ia" ${g.ordem === 'ia' ? 'selected' : ''}>A IA ordena</option></select>` +
		`<button class="btn icone mini fantasma" data-gdesfazer="${i}" title="Desfazer grupo" aria-label="Desfazer grupo">${ic('trash')}</button></div>` +
		`<ol>${g.arquivos.map((n) => `<li>${esc(n)}</li>`).join('')}</ol></div>`).join('');
	const nu = d.naoUsadas ?? [];
	const alerta = nu.length ? `<div class="grupo-alerta">${ic('alert')}<span>A edição ainda <b>não usa</b>: ${nu.map(esc).join(', ')}.</span><button class="btn mini primario" id="grRefazer">Pedir para refazer usando todos</button></div>` : '';
	return `<div class="titulo-secao">${ic('film')}Juntar em um vídeo só</div>${barra}${cards}${alerta}`;
}
function ligarGrupos() {
	const el = $('#aba-midias');
	el.querySelectorAll('[data-sel]').forEach((c) => (c.onchange = () => {
		const n = c.dataset.sel;
		S.selMidias = (S.selMidias ?? []).filter((x) => x !== n);
		if (c.checked) S.selMidias.push(n);
		renderMidias();
	}));
	const refazer = $('#grRefazer');
	if (refazer) refazer.onclick = () => usarPedido(`Conferência: o edit.ts não usa estes arquivos que eu defini como "usar todos": ${(S.midias.naoUsadas ?? []).join(', ')}. Refaça a edição usando TODOS os arquivos do grupo (respeitando a ordem definida). Se algum realmente não couber, explique o motivo.`, {enviar: true});
	const criar = $('#grCriar');
	if (criar) criar.onclick = () => {
		const modo = el.querySelector('[name=grModo]:checked')?.value ?? 'todos';
		const ordem = el.querySelector('[name=grOrdem]:checked')?.value ?? 'minha';
		const nome = ($('#grNome')?.value ?? '').trim();
		const livres = (S.midias.grupos ?? []).map((g) => ({...g, arquivos: g.arquivos.filter((a) => !S.selMidias.includes(a))})).filter((g) => g.arquivos.length >= 2);
		salvarGrupos([...livres, {nome, modo, ordem, arquivos: [...S.selMidias]}]);
	};
	el.querySelectorAll('[data-gmodo]').forEach((s) => (s.onchange = () => {
		const g = (S.midias.grupos ?? []).map((x, i) => (i === Number(s.dataset.gmodo) ? {...x, modo: s.value} : x));
		salvarGrupos(g);
	}));
	el.querySelectorAll('[data-gordem]').forEach((s) => (s.onchange = () => {
		salvarGrupos((S.midias.grupos ?? []).map((x, i) => (i === Number(s.dataset.gordem) ? {...x, ordem: s.value} : x)));
	}));
	el.querySelectorAll('[data-gdesfazer]').forEach((b) => (b.onclick = () => salvarGrupos((S.midias.grupos ?? []).filter((_, i) => i !== Number(b.dataset.gdesfazer)))));
}
function renderMidias() {
	const d = S.midias ?? {midias: [], referencias: [], notas: ''};
	$('#aba-midias').innerHTML =
		`<div class="titulo-secao">${ic('film')}Arquivos do vídeo<button class="btn mini fantasma" data-pasta="midias">${ic('folder')}<span>Abrir pasta</span></button></div>` +
		zona('midias', 'Solte aqui o vídeo bruto', 'imagens, áudios... ou clique para escolher') +
		(d.midias.length ? listaArquivos('midias', d.midias) : `<p style="color:var(--mudo);font-size:12px;margin:10px 2px 0">Nenhuma mídia ainda. Comece pelo vídeo gravado.</p>`) +
		htmlGrupos() +
		`<div class="titulo-secao">${ic('link')}Baixar de um link</div>` +
		colarLink('midias', 'Cole o link do vídeo (YouTube, Drive, Instagram...)') +
		`<p style="color:var(--mudo);font-size:12px;margin:8px 2px 0">O arquivo baixado entra nas mídias deste vídeo.</p>`;
	$('#aba-refs').innerHTML =
		`<div class="cartao"><div class="cartao-topo"><h4>${ic('copy')}Copiar a edição de um vídeo da internet</h4></div><p class="legenda">Cole o link de um vídeo do YouTube, Instagram, TikTok... O painel baixa e guarda como referência.</p>` +
		colarLink('referencias', 'https://www.instagram.com/reel/...') + '</div>' +
		`<div class="titulo-secao">${ic('star')}Arquivos de referência<button class="btn mini fantasma" data-pasta="referencias">${ic('folder')}<span>Abrir pasta</span></button></div>` +
		zona('referencias', 'Solte aqui vídeos, prints e imagens', 'do estilo que você quer seguir') +
		listaArquivos('referencias', d.referencias) +
		`<div class="titulo-secao">${ic('edit')}Notas e links</div>` +
		`<textarea id="notas" placeholder="Links e observações sobre as referências (ex.: youtube.com/..., 'quero o ritmo do segundo 10 a 20')">${esc(d.notas)}</textarea>` +
		`<span class="ajuda" style="display:block;color:var(--mudo);font-size:12px;margin-top:5px">Salva sozinho ao sair da caixa. O Claude lê isso a cada pedido.</span>` +
		`<div class="titulo-secao">${ic('wand')}Usar como estilo</div>` +
		`<div class="estilo-botoes"><button class="btn" id="btAnalisar">${ic('search')}<span>Analisar estilo</span></button><button class="btn primario" id="btRecriar">${ic('wand')}<span>Recriar com este estilo</span></button></div>`;
	ligarGrupos();
	$('#notas').onchange = () => api('/api/notas', {projeto: proj(), texto: $('#notas').value}).then(() => { if (S.midias) S.midias.notas = $('#notas').value; aviso('Referências salvas. O Claude lê isso no próximo pedido.', 'ok', {ms: 3000}); }).catch((e) => avisoErro(e, 'Não salvei as notas'));
	const temRef = () => (S.midias?.referencias?.length || ($('#notas')?.value ?? '').trim());
	$('#btAnalisar').onclick = () => {
		if (!temRef()) return aviso('Adicione um arquivo ou link de referência primeiro.', 'alerta');
		const p = proj();
		usarPedido(`Analise as referências do projeto "${p}" (arquivos em public/projetos/${p}/referencias/ e as notas): extraia quadros dos vídeos com ffmpeg e descreva o estilo de edição: ritmo dos cortes, enquadramento e movimentos de câmera, tipografia e legendas, cores, efeitos, transições, sons e música. Não edite nada ainda; termine com um resumo do estilo em tópicos.`, {enviar: true});
	};
	$('#btRecriar').onclick = () => {
		if (!temRef()) return aviso('Adicione um arquivo ou link de referência primeiro.', 'alerta');
		const p = proj();
		usarPedido(`Recrie a edição do projeto "${p}" usando as referências (public/projetos/${p}/referencias/ e as notas) como estilo: copie o jeito de editar (ritmo, cortes, câmera, tipografia, legenda, efeitos, transições e sons) aplicado às mídias e à fala deste vídeo, sem copiar o conteúdo das referências. Se faltar algo na biblioteca, crie e salve para reutilizar. Depois gere a prévia.`, {enviar: true});
	};
}
function enviarArquivo(p, tipo, arq, barra) {
	return new Promise((ok, erro) => {
		const x = new XMLHttpRequest();
		x.open('POST', tipo.startsWith('tema:') ? `/api/tema-modelo?tema=${enc(tipo.slice(5))}&nome=${enc(arq.name)}` : `/api/midia?projeto=${enc(p)}&tipo=${tipo}&nome=${enc(arq.name)}`);
		x.setRequestHeader('x-painel-token', T);
		x.upload.onprogress = (e) => { if (e.lengthComputable) barra.style.width = (e.loaded / e.total) * 100 + '%'; };
		x.onload = () => { if (x.status === 200) return ok(); let m = x.status; try { m = JSON.parse(x.responseText || '{}').erro || m; } catch {} erro(new Error(m)); };
		x.onerror = () => erro(new Error('Falha no envio'));
		x.send(arq);
	});
}
async function enviarTodos(tipo, arqs, z) {
	const p = proj();
	const tema = tipo.startsWith('tema:') ? tipo.slice(5) : null;
	if ((!p && !tema) || !arqs.length) return;
	const caixa = z.nextElementSibling, barra = caixa.querySelector('i'), rot = caixa.querySelector('small');
	caixa.hidden = false;
	let ok = 0;
	for (const [i, a] of arqs.entries()) {
		barra.style.width = '0';
		rot.textContent = `Enviando ${a.name} (${i + 1} de ${arqs.length}, ${tam(a.size)})...`;
		try { await enviarArquivo(p, tipo, a, barra); ok++; } catch (e) { aviso(`Não enviei "${a.name}": ${e.message}`, 'erro'); }
	}
	if (tema) {
		caixa.hidden = true;
		await carregarModelos(tema);
		// Vídeo modelo enviado: já pede a análise de edição e roteiro.
		const enviados = arqs.filter((a) => /\.(mp4|mov|m4v|webm|mkv)$/i.test(a.name));
		if (enviados.length) analisarModelo(tema, enviados.map((a) => a.name.replace(/[^\w.\- ()]/g, '_')));
		return;
	}
	if (ok) aviso(`${ok} arquivo${ok > 1 ? 's enviados' : ' enviado'} para ${tipo === 'referencias' ? 'as referências' : 'as mídias'}.`, 'ok', {ms: 3000});
	await carregarMidias();
	carregarFluxo();
}
document.addEventListener('click', async (e) => {
	if (e.target.matches('.zona input')) return;
	const z = e.target.closest('.zona');
	if (z) return z.querySelector('input').click();
	const vm = e.target.closest('[data-ver-midia]');
	if (vm) return verMidia(vm.dataset.verMidia, vm.dataset.nome);
	const ap = e.target.closest('[data-ap]');
	if (ap) {
		const nome = ap.dataset.nome, tipo = ap.dataset.ap;
		if (!(await confirmar('Apagar arquivo', `Apagar "${nome}" deste vídeo? Não dá para desfazer.`, {ok: 'Apagar', perigo: true}))) return;
		try { await api('/api/midia/apagar', {projeto: proj(), tipo, nome}); aviso('Arquivo apagado.', 'ok', {ms: 2500}); } catch (er) { avisoErro(er, 'Não apaguei'); }
		return carregarMidias();
	}
	const bx = e.target.closest('[data-baixar]');
	if (bx) return baixarLink(bx.dataset.baixar);
});
document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches?.('[data-link]')) { e.preventDefault(); baixarLink(e.target.dataset.link); } });
async function baixarLink(destino) {
	const inp = $(`[data-link="${destino}"]`);
	const url = inp.value.trim();
	if (!/^https?:\/\/\S+$/i.test(url)) { aviso('Cole um link completo, começando com https://', 'alerta'); return inp.focus(); }
	if (destino.startsWith('tema:')) {
		const tema = destino.slice(5);
		const id = await criarTarefa('link', {url, destino: 'tema', tema}, {projeto: null});
		if (id) { inp.value = ''; S.analisarAoBaixar.set(id, tema); aviso('Baixando o vídeo modelo. Quando terminar, o Claude analisa sozinho.', 'info'); }
		return;
	}
	const id = await criarTarefa('link', {url, destino});
	if (id) { inp.value = ''; return; }
	if (S.tarefasOk === false && destino === 'referencias') {
		// Servidor sem a rota nova: guarda o link nas notas para o Claude ver.
		const notas = ((S.midias?.notas ?? '').trim() + '\n' + url).trim();
		try {
			await api('/api/notas', {projeto: proj(), texto: notas});
			inp.value = '';
			aviso('Por enquanto o link foi guardado nas notas das referências.', 'info');
			carregarMidias();
		} catch {}
	}
}
document.addEventListener('change', (e) => { const z = e.target.closest('.zona'); if (z && e.target.files?.length) { enviarTodos(z.dataset.z, [...e.target.files], z); e.target.value = ''; } });
document.addEventListener('dragover', (e) => { const z = e.target.closest?.('.zona'); if (z) { e.preventDefault(); z.classList.add('on'); } else if (e.dataTransfer?.types?.includes('Files')) e.preventDefault(); });
document.addEventListener('dragleave', (e) => e.target.closest?.('.zona')?.classList.remove('on'));
document.addEventListener('drop', (e) => { e.preventDefault(); const z = e.target.closest?.('.zona'); if (z) { z.classList.remove('on'); enviarTodos(z.dataset.z, [...e.dataTransfer.files], z); } });

// ---------- Atalhos de pedido ----------
const SUGESTOES = [
	{titulo: 'Gerar prévia', texto: 'Gera a prévia do vídeo.'},
	{titulo: 'Cortar pausas', texto: 'Corta as pausas e os erros de gravação, deixando a fala corrida.'},
	{titulo: 'Legenda', texto: 'Coloca legenda palavra por palavra no vídeo todo.'},
	{titulo: 'Gancho forte', texto: 'Cria um gancho forte nos 3 primeiros segundos.'},
	{titulo: 'Mais dinâmico', texto: 'Deixa o ritmo mais dinâmico: mais cortes, zooms e sons nas viradas.'},
	{titulo: 'Revisar tudo', texto: 'Revisa o vídeo inteiro e me diz o que dá para melhorar antes do final.'},
];
let promptsOk = null;
async function carregarAtalhos() {
	try {
		const r = await api('/api/prompts');
		S.prompts = Array.isArray(r) ? r : [];
		promptsOk = true;
	} catch (e) {
		S.prompts = null;
		promptsOk = e.emBreve ? false : null;
	}
	renderAtalhos();
}
function renderAtalhos() {
	const meus = S.prompts?.length ? S.prompts : null;
	const lista = meus ?? SUGESTOES;
	$('#chips').innerHTML = lista.map((p, i) => `<button type="button" class="chip ${meus ? '' : 'sugestao'}" data-chip="${i}" title="${esc(p.texto)}">${ic(meus ? 'zap' : 'sparkles')}${esc(p.titulo)}</button>`).join('');
	$('#chips').onclick = (e) => { const c = e.target.closest('[data-chip]'); if (c) usarPedido(lista[Number(c.dataset.chip)].texto); };
}
$('#gerAtalhos').onclick = () => gerenciarAtalhos();
function gerenciarAtalhos() {
	let lista = [...(S.prompts ?? [])];
	const desenhar = () => {
		$('#listaAt').innerHTML = lista.length ? lista.map((p, i) => `<div class="at"><div><b>${esc(p.titulo)}</b><small>${esc(p.texto)}</small></div><button class="btn icone mini fantasma" data-rm="${i}" aria-label="Remover" title="Remover">${ic('trash')}</button></div>`).join('')
			: `<div class="vazio" style="padding:16px">${ic('zap')}<b>Nenhum atalho seu ainda</b>Crie atalhos para os pedidos que você faz sempre. Eles aparecem acima da caixa de texto.<br><button class="btn mini" id="atSug">${ic('sparkles')}<span>Começar com as sugestões</span></button></div>`;
		$('#atSug') && ($('#atSug').onclick = () => { lista = [...SUGESTOES]; salvar(); });
	};
	const salvar = async () => {
		try {
			await api('/api/prompts', lista);
			S.prompts = [...lista];
			renderAtalhos();
			desenhar();
		} catch (e) { avisoErro(e, 'Não salvei os atalhos'); }
	};
	abrirModal({
		titulo: 'Atalhos de pedido',
		corpo: (promptsOk === false ? `<div class="em-breve">${ic('info')}Salvar atalhos chega na próxima atualização do painel. Por enquanto aparecem as sugestões prontas.</div>` : '') +
			`<div id="listaAt" class="lista-atalhos"></div>` +
			`<div class="titulo-secao">${ic('plus')}Novo atalho</div>` +
			`<div class="campo"><label class="rotulo" for="atTitulo">Nome do botão</label><input id="atTitulo" type="text" maxlength="40" placeholder="Ex.: Legenda amarela"></div>` +
			`<div class="campo"><label class="rotulo" for="atTexto">Pedido completo</label><textarea id="atTexto" rows="3" placeholder="Ex.: Troca a legenda para o estilo impacto, amarela, com a palavra-chave maior."></textarea></div>` +
			`<button class="btn primario" id="atAdd" ${promptsOk === false ? 'disabled' : ''}>${ic('plus')}<span>Adicionar atalho</span></button>`,
	});
	desenhar();
	$('#listaAt').onclick = (e) => { const r = e.target.closest('[data-rm]'); if (r) { lista.splice(Number(r.dataset.rm), 1); salvar(); } };
	$('#atAdd').onclick = () => {
		const titulo = $('#atTitulo').value.trim(), texto = $('#atTexto').value.trim();
		if (!titulo || !texto) return aviso('Preencha o nome e o pedido.', 'alerta');
		lista.push({titulo, texto});
		$('#atTitulo').value = $('#atTexto').value = '';
		salvar();
	};
}

// ---------- Conversa ----------
const msgs = $('#msgs');
const rolar = () => { msgs.scrollTop = msgs.scrollHeight; };
function msg(texto, quem = 'ia', {custo, t} = {}) {
	msgs.querySelector('.boas-vindas')?.remove();
	if (quem === 'acao') {
		const d = document.createElement('div');
		d.className = 'acao';
		d.innerHTML = ic('code') + `<span>${esc(texto)}</span>`;
		d.title = texto;
		msgs.append(d);
		rolar();
		return d;
	}
	const d = document.createElement('div');
	d.className = 'm ' + (quem === 'erro' ? 'erro' : quem);
	// Amostras do Claude: [[amostra:A|out/arquivo.jpg|descrição]] viram imagens com o botão de escolha.
	const RE_AMOSTRA = /\[\[amostra:([^|\]]{1,12})\|([^|\]]+)\|([^\]]*)\]\]/g;
	if (quem === 'ia' && texto.includes('[[amostra:')) {
		const v = Date.now();
		let html = '', ultimo = 0, cards = '';
		const fechar = () => { if (cards) { html += `<div class="amostras">${cards}</div>`; cards = ''; } };
		for (const m of texto.matchAll(RE_AMOSTRA)) {
			const antes = texto.slice(ultimo, m.index);
			if (antes.trim()) { fechar(); html += esc(antes.trim()) + '\n'; }
			const arq = m[2].trim().split(/[\\/]/).pop();
			cards += `<figure class="amostra-ia"><img src="/out/${enc(arq)}?t=${T}&v=${v}" alt="Opção ${esc(m[1])}" data-ver-midia="/out/${enc(arq)}?t=${T}&v=${v}" data-nome="${esc(arq)}"><figcaption><b>${esc(m[1])}</b> ${esc(m[3])}</figcaption><button class="btn mini primario" data-escolher="${esc(m[1])}">${ic('check')}<span>Quero esta</span></button></figure>`;
			ultimo = m.index + m[0].length;
		}
		fechar();
		if (texto.slice(ultimo).trim()) html += esc(texto.slice(ultimo).trim());
		d.innerHTML = html;
	} else d.textContent = texto;
	const extra = [quando(t), custoTxt(custo)].filter(Boolean).join(' · ');
	if (extra) d.insertAdjacentHTML('beforeend', `<span class="custo">${esc(extra)}</span>`);
	msgs.append(d);
	rolar();
	return d;
}
function boasVindas() {
	const p = proj();
	msgs.innerHTML = `<div class="boas-vindas"><div class="logo-g"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z"/></svg></div>` +
		`<h3>${p ? `Vamos editar “${esc(p)}”` : 'O que vamos criar hoje?'}</h3>` +
		`<p>${p ? 'Diga o que quer mudar. Posso usar a biblioteca ou criar elementos novos (eles ficam salvos para os próximos vídeos).' : 'Escolha um vídeo no topo ou crie um em “Novo vídeo”. Posso fazer qualquer tipo de vídeo, copiar a edição de um vídeo da internet ou recriar um estilo.'}</p>` +
		`<div class="ideias">` +
		(p ? `<button data-ideia="previa">${ic('play')}<span><b>Gerar a prévia</b><br><small>Ver como está agora</small></span></button>` +
			`<button data-ideia="refs">${ic('copy')}<span><b>Copiar um estilo</b><br><small>Cole o link de um vídeo de referência</small></span></button>` +
			`<button data-ideia="midias">${ic('upload')}<span><b>Enviar o vídeo bruto</b><br><small>Arraste o arquivo para a aba Mídias</small></span></button>` +
			`<button data-ideia="fluxo">${ic('list')}<span><b>Ver o passo a passo</b><br><small>O que falta até o vídeo final</small></span></button>`
			: `<button data-ideia="modelo">${ic('wand')}<span><b>Ensinar um estilo</b><br><small>Envie um vídeo modelo para um tema</small></span></button>` +
			`<button data-ideia="tema">${ic('grid')}<span><b>Ver vídeos do tema</b><br><small>Assistir e copiar um estilo</small></span></button>` +
			`<button data-ideia="pack">${ic('layers')}<span><b>Explorar a biblioteca</b><br><small>Peças, sons, fontes e pack</small></span></button>` +
			`<button data-ideia="prefs">${ic('gear')}<span><b>Preferências</b><br><small>Pod, modelo e jeito de editar</small></span></button>`) +
		`</div></div>`;
}
msgs.addEventListener('click', (e) => {
	const esc_ = e.target.closest('[data-escolher]');
	if (esc_) return usarPedido(`Escolho a opção ${esc_.dataset.escolher}. Aplique e siga.`, {enviar: true});
	const b = e.target.closest('[data-ideia]');
	if (!b) return;
	const v = b.dataset.ideia;
	if (v === 'previa') gerarPrevia();
	else if (['refs', 'midias', 'fluxo'].includes(v)) { mostrarAba(v); if (celular()) verSecao('lado'); if (v === 'refs') setTimeout(() => $('[data-link=referencias]')?.focus(), 50); }
	else if (v === 'modelo') { if (temaAtual()) abrirTema(temaAtual()); }
	else if (v === 'tema') { if (temaAtual()) abrirTema(temaAtual()); }
	else if (v === 'pack') { if (celular()) verSecao('biblioteca'); $('#busca').focus(); }
	else if (v === 'prefs') abrirPreferencias();
});
let versaoHist = 0;
async function carregarHistorico() {
	const v = ++versaoHist;
	const p = proj();
	let h = null;
	try { h = await api('/api/historico?projeto=' + enc(p)); } catch {}
	if (v !== versaoHist || S.chatAtivo) return;
	msgs.innerHTML = '';
	if (!Array.isArray(h) || !h.length) return boasVindas();
	msgs.insertAdjacentHTML('beforeend', `<div class="separador">Conversa salva neste computador</div>`);
	for (const m of h.slice(-200)) msg(m.texto, ['eu', 'ia', 'acao', 'erro'].includes(m.quem) ? m.quem : 'ia', {custo: m.custo, t: m.quem === 'eu' ? m.t : undefined});
}
$('#zerar').onclick = async () => {
	if (!(await confirmar('Conversa nova', 'Começar uma conversa nova neste vídeo? O Claude esquece o que foi conversado (as edições feitas continuam).', {ok: 'Começar conversa nova'}))) return;
	try { await api('/api/novo-chat', {projeto: proj()}); } catch (e) { return avisoErro(e); }
	boasVindas();
	aviso('Conversa nova começada.', 'ok', {ms: 2500});
};
let ctrl = null;
// Intervir: para o Claude agora e deixa a caixa pronta para o ajuste; a próxima mensagem continua a mesma conversa de onde parou.
$('#parar').onclick = () => {
	ctrl?.abort();
	api('/api/parar', {projeto: proj()}).catch(() => {});
	S.intervencao = true;
	const c = $('#pedido');
	c.placeholder = 'Parei o Claude. Diga o que mudar (ex.: "tira esse efeito", "mais lento aqui") e envie: ele continua de onde parou.';
	c.focus();
	aviso('Claude parado. Escreva o ajuste e envie.', 'info', {ms: 3500});
};
const ajustarCaixa = () => { const t = $('#pedido'); t.style.height = 'auto'; t.style.height = Math.min(220, Math.max(56, t.scrollHeight)) + 'px'; };
$('#pedido').addEventListener('input', ajustarCaixa);
$('#pedido').onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('#f').requestSubmit(); } };
$('#f').onsubmit = async (e) => {
	e.preventDefault();
	let pedido = $('#pedido').value.trim();
	if (!pedido || S.chatAtivo) return;
	if (S.intervencao) {
		S.intervencao = false;
		$('#pedido').placeholder = 'Ex.: usa o template do depoimento e coloca a moeda 3D girando quando eu falar "investimento"';
		pedido = 'Interrompi seu trabalho para pedir um ajuste. Aplique o ajuste abaixo e CONTINUE o que estava fazendo (sem recomeçar do zero): ' + pedido;
	}
	if (!T) return aviso('Abra o endereço completo que apareceu no terminal (termina com #código).', 'erro');
	const projetoChat = proj();
	$('#pedido').value = '';
	ajustarCaixa();
	msg(pedido, 'eu', {t: Date.now()});
	S.chatAtivo = true;
	atualizarPilulas();
	$('#enviar').disabled = true;
	$('#parar').hidden = false;
	const pensando = document.createElement('div');
	pensando.className = 'digitando';
	pensando.innerHTML = '<i></i><i></i><i></i>';
	msgs.append(pensando);
	rolar();
	const mesmo = () => proj() === projetoChat;
	const add = (...a) => { if (!mesmo()) return null; const d = msg(...a); msgs.append(pensando); rolar(); return d; };
	let ultimaIa = null, faltam = null;
	ctrl = new AbortController();
	try {
		const r = await fetch('/api/chat', {method: 'POST', headers: H, signal: ctrl.signal, body: JSON.stringify({projeto: projetoChat, pedido, tema: temaAtual()})});
		if (!r.ok) { let m = `Erro ${r.status}`; try { m = (await r.json()).erro || m; } catch {} throw new Error(m); }
		const rd = r.body.getReader(), dec = new TextDecoder();
		let buf = '';
		for (;;) {
			const {done, value} = await rd.read();
			if (done) break;
			buf += dec.decode(value, {stream: true});
			const partes = buf.split('\n\n');
			buf = partes.pop();
			for (const parte of partes) {
				let ev;
				try { ev = JSON.parse(parte.replace(/^data: /, '')); } catch { continue; }
				if (ev.tipo === 'texto') ultimaIa = add(ev.texto, 'ia');
				else if (ev.tipo === 'acao') add(ev.acao, 'acao');
				else if (ev.tipo === 'erro') add(ev.texto, 'erro');
				else if (ev.tipo === 'faltam') faltam = ev.arquivos;
				else if (ev.tipo === 'fim' && ultimaIa && custoTxt(ev.custo)) ultimaIa.insertAdjacentHTML('beforeend', `<span class="custo">${esc(custoTxt(ev.custo))}</span>`);
			}
		}
	} catch (err) {
		if (err.name !== 'AbortError') add(err.message, 'erro');
		else add('Parado.', 'acao');
	}
	pensando.remove();
	ctrl = null;
	S.chatAtivo = false;
	$('#enviar').disabled = false;
	$('#parar').hidden = true;
	atualizarPilulas();
	if (!mesmo()) aviso(`O Claude terminou o pedido em "${projetoChat || 'conversa geral'}".`, 'ok');
	// O Claude pode ter criado projetos, peças, temas e tarefas.
	const antes = proj();
	await atualizarTudo();
	if (antes !== proj()) aoTrocarProjeto({historico: false});
	carregarMidias();
	carregarFluxo();
	pollTarefas();
	verificarClaude();
	// Conferência: material que o usuário mandou usar e a edição não usou. Pede uma vez para refazer; na segunda, só avisa.
	if (faltam?.length && mesmo()) {
		const tent = (S.autoMidias ??= {});
		if ((tent[projetoChat] ?? 0) < 1) {
			tent[projetoChat] = (tent[projetoChat] ?? 0) + 1;
			aviso(`Faltou usar: ${faltam.join(', ')}. Pedindo para refazer usando todos.`, 'alerta');
			$('#pedido').value = `Conferência automática: o edit.ts não usa estes arquivos que eu defini como "usar todos": ${faltam.join(', ')}. Refaça a edição usando TODOS os arquivos do grupo (respeitando a ordem definida). Se algum realmente não couber, explique o motivo.`;
			$('#f').requestSubmit();
		} else aviso(`Ainda não usou: ${faltam.join(', ')}. Peça na conversa ou use o botão na aba Mídias.`, 'erro');
	} else if (projetoChat && !faltam) delete (S.autoMidias ?? {})[projetoChat];
};

// Pedido que estava em andamento quando o painel fechou: oferece continuar de onde parou (não gasta limite sem você pedir).
async function verificarPendente() {
	try {
		const p = await api('/api/chat/pendente');
		if (!p || (p.projeto || '') !== (proj() || '')) return;
		document.querySelector('.pendente')?.remove();
		const d = document.createElement('div');
		d.className = 'pendente';
		d.innerHTML = `${ic('alert')}<span>O painel fechou no meio deste pedido: <b>${esc(String(p.pedido).slice(0, 140))}</b></span><button class="btn mini primario" id="pdContinuar">Continuar de onde parou</button><button class="btn mini fantasma" id="pdDescartar">Descartar</button>`;
		$('#f').before(d);
		$('#pdDescartar').onclick = () => { api('/api/chat/pendente', {}).catch(() => {}); d.remove(); };
		$('#pdContinuar').onclick = () => {
			api('/api/chat/pendente', {}).catch(() => {});
			d.remove();
			$('#pedido').value = 'O painel foi reiniciado no meio do seu trabalho. CONTINUE de onde parou (confira o que já está feito nos arquivos, sem recomeçar) o pedido: ' + p.pedido;
			$('#f').requestSubmit();
		};
	} catch {}
}

// ---------- Início ----------
async function iniciar() {
	decorar();
	carregarFontes();
	mostrarAba(['render', 'fluxo', 'midias', 'refs'].includes(S.aba) ? S.aba : 'render');
	if (!T) {
		msgs.innerHTML = `<div class="boas-vindas"><h3>Endereço incompleto</h3><p>Abra o endereço completo que apareceu no terminal (termina com #código).</p></div>`;
		return;
	}
	boasVindas();
	verificarPendente();
	await carregarConfig();
	await atualizarTudo();
	aoTrocarProjeto();
	renderAtalhos();
	carregarAtalhos();
	verificarClaude();
	pollTarefas();
}
iniciar();
