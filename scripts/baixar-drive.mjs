// Baixa um link PÚBLICO do Google Drive (pasta ou arquivo) para uma pasta, sem chave de API.
// Uso: node scripts/baixar-drive.mjs <link do Drive> <pasta de destino> [--listar] [--ids id1,id2] [--so nome1,nome2]
//   --listar        só lista os arquivos (não baixa nada) e imprime {"lista":[{"id","nome"}]}
//   --ids a,b       baixa só esses arquivos (ids da lista)
//   --so x,y        baixa só os arquivos cujo nome (ou caminho) contém algum desses textos, sem diferenciar maiúsculas
//   sem opções      baixa tudo
// Uma linha JSON por evento em stdout, como o importar-pack.mjs:
//   {"fase":"baixando N de M", "pct":0..100, "arquivo":"..."}   {"fim":true, "total":n, "falhas":[...]}   {"erro":"mensagem"}
// A pasta precisa estar compartilhada como "Qualquer pessoa com o link".
import {createWriteStream, existsSync, mkdirSync, renameSync, rmSync} from 'node:fs';
import path from 'node:path';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';

const argv = process.argv.slice(2);
const flag = (nome) => {
	const i = argv.indexOf(nome);
	return i >= 0 ? argv[i + 1] ?? '' : null;
};
const soListar = argv.includes('--listar');
const idsPedidos = flag('--ids')?.split(',').filter(Boolean) ?? null;
const termos = flag('--so')?.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean) ?? null;
const posicionais = argv.filter((a, i) => !a.startsWith('--') && !['--ids', '--so'].includes(argv[i - 1]));
const [url, destinoArg] = posicionais;
const UA = {'user-agent': 'Mozilla/5.0 (painel-de-edicao)'};

let ultimo = '';
const emitir = (o) => {
	if (o.fase) {
		o.pct = Math.max(0, Math.min(100, Math.floor(o.pct ?? 0)));
		const chave = `${o.fase}|${o.pct}`;
		if (chave === ultimo) return;
		ultimo = chave;
	}
	process.stdout.write(JSON.stringify(o) + '\n');
};
const falhar = (m) => {
	emitir({erro: String(m?.message ?? m).slice(-700)});
	process.exit(1);
};

if (!url || !destinoArg) falhar('Uso: node scripts/baixar-drive.mjs <link do Drive> <pasta de destino>');
const destino = path.resolve(destinoArg);

const idDaPasta = (u) => u.match(/\/folders\/([\w-]{10,})/)?.[1];
const idDoArquivo = (u) => u.match(/\/file\/d\/([\w-]{10,})/)?.[1] ?? u.match(/[?&]id=([\w-]{10,})/)?.[1];
// Lixo de sistema e nome seguro em Windows, Mac e Linux.
const ignorar = (n) => /^(\.DS_Store|Thumbs\.db|desktop\.ini|__MACOSX|\._.*|.*\.parcial)$/i.test(n);
const limpar = (n) =>
	String(n).replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').replace(/^\.+$/, '_').replace(/[. ]+$/, '').trim() || 'sem-nome';
const ENT = {amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' '};
const entidades = (s) =>
	s
		.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
		.replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
		.replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m);

const buscar = async (u, tentativas = 3, limite = 45000) => {
	for (let i = 1; ; i++) {
		const ctl = new AbortController();
		const relogio = setTimeout(() => ctl.abort(), limite);
		try {
			const r = await fetch(u, {headers: UA, redirect: 'follow', signal: ctl.signal});
			clearTimeout(relogio);
			if (r.ok) return r;
			if (i >= tentativas || r.status === 404 || r.status === 403) throw new Error(`HTTP ${r.status}`);
		} catch (e) {
			clearTimeout(relogio);
			if (ctl.signal.aborted) e = new Error(`O Drive não respondeu em ${limite / 1000} s`);
			if (i >= tentativas) throw e.cause ? new Error(`Sem acesso ao Drive (${e.cause.code ?? e.cause.message})`) : e;
		}
		await new Promise((ok) => setTimeout(ok, 1500 * i));
	}
};

// Lista uma pasta pela página embeddedfolderview: [{id, nome, pasta}].
const listarPasta = async (id) => {
	const html = await (await buscar(`https://drive.google.com/embeddedfolderview?id=${id}`)).text();
	const itens = [];
	for (const bloco of html.split(/<div class="flip-entry"/).slice(1)) {
		const idItem = bloco.match(/id="entry-([\w-]+)"/)?.[1];
		const href = bloco.match(/<a href="([^"]+)"/)?.[1] ?? '';
		const nome = bloco.match(/class="flip-entry-title">([\s\S]*?)<\/div>/)?.[1];
		if (!idItem || nome == null) continue;
		const pasta = href.includes('/folders/');
		if (!pasta && !href.includes('/file/d/')) continue; // Docs/Planilhas nativos não têm arquivo
		itens.push({id: idItem, nome: entidades(nome).trim(), pasta});
	}
	if (!itens.length && !/flip-entr/.test(html)) {
		throw new Error('Não consegui ler a pasta. Ela está compartilhada como "Qualquer pessoa com o link"?');
	}
	return itens;
};
const listarTudo = async (idRaiz) => {
	const arquivos = [];
	const fila = [{id: idRaiz, caminho: []}];
	const vistas = new Set();
	while (fila.length) {
		const {id, caminho} = fila.shift();
		if (vistas.has(id)) continue;
		vistas.add(id);
		emitir({fase: 'lendo a pasta do Drive', pct: 0, arquivo: caminho.join('/')});
		const usados = new Set();
		for (const it of await listarPasta(id)) {
			let nome = limpar(it.nome);
			for (let n = 2; usados.has(nome.toLowerCase()); n++) {
				const ext = path.extname(limpar(it.nome));
				nome = `${path.basename(limpar(it.nome), ext)} (${n})${ext}`;
			}
			usados.add(nome.toLowerCase());
			if (it.pasta) fila.push({id: it.id, caminho: [...caminho, nome]});
			else if (!ignorar(nome)) arquivos.push({id: it.id, caminho: [...caminho, nome]});
		}
	}
	return arquivos;
};

// Nome de um arquivo único pelo cabeçalho da resposta de download.
const nomeDoCabecalho = (r, id) => {
	const cd = r.headers.get('content-disposition') ?? '';
	const utf = cd.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
	const simples = cd.match(/filename="([^"]+)"/i)?.[1];
	try {
		return limpar(utf ? decodeURIComponent(utf) : simples ?? `drive-${id}`);
	} catch {
		return limpar(simples ?? `drive-${id}`);
	}
};

// Baixa em stream. Trata a página de aviso (vírus / arquivo grande) do Drive. `destinoOuNull`: sem nome, usa o do cabeçalho.
const baixar = async (id, alvo, nomeFixo, aoProgredir) => {
	let r = await buscar(`https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`);
	if ((r.headers.get('content-type') ?? '').includes('text/html')) {
		const html = await r.text();
		const form = html.match(/<form[^>]*id="download-form"[^>]*action="([^"]+)"[\s\S]*?<\/form>/);
		if (!form) {
			if (/quota|cota|too many/i.test(html)) throw new Error('O Drive bloqueou por excesso de downloads. Tente de novo mais tarde.');
			throw new Error('O Drive não liberou o arquivo. Ele está compartilhado como "Qualquer pessoa com o link"?');
		}
		const u = new URL(entidades(form[1]));
		for (const m of form[0].matchAll(/<input[^>]*name="([^"]+)"[^>]*value="([^"]*)"/g)) u.searchParams.set(m[1], entidades(m[2]));
		r = await buscar(u.toString());
		if ((r.headers.get('content-type') ?? '').includes('text/html')) throw new Error('O Drive não liberou o download (aviso de vírus ou cota)');
	}
	const final = nomeFixo ? path.join(alvo, ...nomeFixo) : path.join(alvo, nomeDoCabecalho(r, id));
	const total = Number(r.headers.get('content-length')) || 0;
	let feito = 0;
	const corpo = Readable.fromWeb(r.body);
	let chegou = Date.now();
	const vigia = setInterval(() => {
		if (Date.now() - chegou > 90000) corpo.destroy(new Error('O download parou de receber dados'));
	}, 5000);
	corpo.on('data', (b) => {
		chegou = Date.now();
		feito += b.length;
		if (total) aoProgredir(feito / total);
	});
	mkdirSync(path.dirname(final), {recursive: true});
	const parcial = final + '.parcial';
	try {
		await pipeline(corpo, createWriteStream(parcial));
	} finally {
		clearInterval(vigia);
	}
	renameSync(parcial, final);
	return final;
};

try {
	const idPasta = idDaPasta(url);
	const idArq = !idPasta && idDoArquivo(url);
	if (!idPasta && !idArq) throw new Error('Link inválido: use o link de uma pasta ou de um arquivo do Google Drive.');
	mkdirSync(destino, {recursive: true});
	const tudo = idPasta ? await listarTudo(idPasta) : [{id: idArq, caminho: null}];
	if (!tudo.length) throw new Error('A pasta do Drive está vazia.');
	if (soListar) {
		emitir({lista: tudo.map((a) => ({id: a.id, nome: a.caminho ? a.caminho.join('/') : 'Arquivo do Drive'}))});
		emitir({fim: true, listado: true, total: tudo.length});
		process.exit(0);
	}
	let lista = tudo;
	if (idsPedidos) lista = lista.filter((a) => idsPedidos.includes(a.id));
	if (termos) lista = lista.filter((a) => a.caminho && termos.some((t) => a.caminho.join('/').toLowerCase().includes(t)));
	if (!lista.length) throw new Error('Nenhum arquivo da pasta bate com o que foi pedido.');
	const falhas = [];
	for (const [i, it] of lista.entries()) {
		const nome = it.caminho ? it.caminho.join('/') : 'arquivo do Drive';
		const pct = (f) => emitir({fase: `baixando ${i + 1} de ${lista.length}`, pct: ((i + f) / lista.length) * 100, arquivo: nome});
		// Já baixado numa tentativa anterior: pula (continua de onde parou).
		if (it.caminho && existsSync(path.join(destino, ...it.caminho))) {
			pct(1);
			continue;
		}
		pct(0);
		for (let t = 1; ; t++) {
			try {
				await baixar(it.id, destino, it.caminho, pct);
				break;
			} catch (e) {
				if (it.caminho) rmSync(path.join(destino, ...it.caminho) + '.parcial', {force: true});
				if (t >= 3) {
					falhas.push(`${nome}: ${e.message}`);
					break;
				}
				await new Promise((ok) => setTimeout(ok, 2000 * t));
			}
		}
	}
	emitir({fase: `baixando ${lista.length} de ${lista.length}`, pct: 100, arquivo: ''});
	if (falhas.length === lista.length) throw new Error(falhas[0]);
	emitir({fim: true, total: lista.length - falhas.length, falhas});
} catch (e) {
	// 401/403 = o link não é público: diz o que fazer em vez do código HTTP.
	falhar(/HTTP (401|403)/.test(e?.message) ? 'O Drive recusou o acesso. No Drive, clique em Compartilhar e deixe "Qualquer pessoa com o link" como Leitor; depois cole o link de novo.' : e);
}
