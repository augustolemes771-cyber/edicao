// Importa o "pack" de mídia (transições, SFX, overlays, fontes, LUTs...) para biblioteca/pack/arquivos/ e atualiza
// biblioteca/pack/catalogo.json (no git). Usado pelo painel (tarefa 'pack') e pelo terminal.
// Uso: node scripts/importar-pack.mjs <link de pasta pública do Google Drive | arquivo .zip | pasta> [--so-faltando]
//      node scripts/importar-pack.mjs --so-faltando   (baixa só o que está no catálogo e falta neste PC)
//      node scripts/importar-pack.mjs "C:\caminho\do\Pack" --no-lugar   (cataloga a pasta onde está, sem copiar:
//      grava a raiz em .painel/pack.json {"raiz": "..."} e o catálogo com caminhos relativos a ela)
//      node scripts/importar-pack.mjs <link do Drive> --pasta "D:\Pack"   (lista o Drive, usa a pasta como raiz no
//      lugar, reconhece o que já está lá e baixa só o que falta, direto nela)
// Uma linha JSON por evento em stdout, como o render-job.mjs:
//   {"fase":"listando..."|"baixando N de M"|"extraindo", "pct":0..100, "arquivo":"..."}
//   {"fim":true, "saida":"biblioteca/pack/catalogo.json", "total":n, "aviso"?:"..."}  ou  {"erro":"mensagem"}
import {spawnSync} from 'node:child_process';
import {copyFileSync, createWriteStream, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';

const raiz = path.resolve(import.meta.dirname, '..');
const PASTA_PACK = path.join(raiz, 'biblioteca/pack');
const ARQUIVOS = path.join(PASTA_PACK, 'arquivos');
const CATALOGO = path.join(PASTA_PACK, 'catalogo.json');
// Pasta do pack já existente neste PC (modo --no-lugar), fora do git.
const PACK_LOCAL = path.join(raiz, '.painel/pack.json');
const lerRaizLocal = () => {
	try {
		const r = JSON.parse(readFileSync(PACK_LOCAL, 'utf8')).raiz;
		return r && statSync(r).isDirectory() ? r : null;
	} catch {
		return null;
	}
};
let RAIZ_LOCAL = lerRaizLocal();
const ehWin = process.platform === 'win32';
const args = process.argv.slice(2);
const soFaltando = args.includes('--so-faltando');
const noLugar = args.includes('--no-lugar');
// --pasta <dir>: junto com o link do Drive, usa essa pasta (que pode já ter parte do pack) como raiz no lugar.
const iPasta = args.indexOf('--pasta');
const pastaLocal = iPasta >= 0 ? args[iPasta + 1] : null;
const fonte = args.find((a, i) => !a.startsWith('--') && (iPasta < 0 || i !== iPasta + 1));

// Uma linha por mudança de 1%, para o painel e para quem lê o terminal.
let ultimo = {fase: '', pct: -1};
const emitir = (o) => {
	if (o.fase) {
		o.pct = Math.max(0, Math.min(100, Math.floor(o.pct ?? 0)));
		if (o.fase === ultimo.fase && o.pct === ultimo.pct) return;
		ultimo = {fase: o.fase, pct: o.pct};
	}
	process.stdout.write(JSON.stringify(o) + '\n');
};
const falhar = (msg) => {
	emitir({erro: String(msg?.message ?? msg).slice(-700)});
	process.exit(1);
};

// Tipo pela extensão.
const TIPOS = {
	video: ['mp4', 'mov', 'webm', 'mkv', 'avi', 'm4v', 'mxf', 'prores'],
	audio: ['wav', 'mp3', 'aac', 'm4a', 'ogg', 'flac', 'aif', 'aiff', 'opus'],
	imagem: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'tif', 'tiff', 'bmp', 'psd', 'exr', 'avif', 'heic'],
	fonte: ['ttf', 'otf', 'woff', 'woff2'],
	lut: ['cube', '3dl'],
	modelo3d: ['glb', 'gltf', 'fbx', 'obj', 'blend', 'usdz', 'stl'],
};
const tipoDe = (nome) => {
	const ext = path.extname(nome).slice(1).toLowerCase();
	return Object.keys(TIPOS).find((t) => TIPOS[t].includes(ext)) ?? 'outro';
};
// Lixo de sistema que não entra no pack.
const ignorar = (nome) => /^(\.DS_Store|Thumbs\.db|desktop\.ini|__MACOSX|\._.*|\.extraindo-\d+|.*\.parcial)$/i.test(nome);
// Nome seguro em Windows, Mac e Linux (sem ../ nem caracteres proibidos).
const limpar = (nome) =>
	String(nome)
		.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
		.replace(/^\.+$/, '_')
		.replace(/[. ]+$/, '')
		.trim() || 'sem-nome';
const rel = (abs, base = ARQUIVOS) => path.relative(base, abs).split(path.sep).join('/');
// Onde está um item do catálogo neste PC: primeiro na pasta do --no-lugar, depois em biblioteca/pack/arquivos.
const localizar = (arquivo) => {
	for (const base of [RAIZ_LOCAL, ARQUIVOS]) {
		const abs = base && path.join(base, ...arquivo.split('/'));
		if (abs && existsSync(abs)) return {abs, base};
	}
	return null;
};

// Catálogo: [{nome, categoria, tipo, arquivo, tamanho, origem}], uma entrada por arquivo (chave = arquivo).
const lerCatalogo = () => {
	try {
		const c = JSON.parse(readFileSync(CATALOGO, 'utf8'));
		return Array.isArray(c) ? c : [];
	} catch {
		return [];
	}
};
const catalogo = new Map(lerCatalogo().map((e) => [e.arquivo, e]));
const registrar = (abs, origem, base = ARQUIVOS) => {
	const arquivo = rel(abs, base);
	const partes = arquivo.split('/');
	catalogo.set(arquivo, {
		nome: path.basename(arquivo, path.extname(arquivo)),
		categoria: partes.length > 1 ? partes[0] : 'Geral',
		tipo: tipoDe(arquivo),
		arquivo,
		tamanho: statSync(abs).size,
		origem,
	});
};
const salvarCatalogo = () => {
	mkdirSync(PASTA_PACK, {recursive: true});
	const lista = [...catalogo.values()].sort((a, b) => a.arquivo.localeCompare(b.arquivo, 'pt-BR'));
	writeFileSync(CATALOGO, JSON.stringify(lista, null, '\t') + '\n');
	return lista.length;
};

// ---------- Google Drive (pasta pública, sem chave de API) ----------
const UA = {'user-agent': 'Mozilla/5.0 (importar-pack)'};
const idDaPasta = (url) => url.match(/\/folders\/([\w-]{10,})/)?.[1] ?? url.match(/[?&]id=([\w-]{10,})/)?.[1];
const ACENTOS = {acute: '\u0301', grave: '\u0300', circ: '\u0302', tilde: '\u0303', uml: '\u0308', cedil: '\u0327'};
const entidades = (s) =>
	s
		.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
		.replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
		// Acentos nomeados (&ccedil; &atilde; ...): letra + acento combinado.
		.replace(/&([a-z])(acute|grave|circ|tilde|uml|cedil);/gi, (_, l, a) => (l + ACENTOS[a.toLowerCase()]).normalize('NFC'))
		.replace(/&nbsp;/g, ' ')
		.replace(/&quot;/g, '"')
		.replace(/&#39;|&apos;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&amp;/g, '&');

// Sem limite, uma resposta do Drive que nunca chega trava a importação para sempre (aconteceu na listagem).
// `limite` vale até chegar o cabeçalho; o corpo do download tem o próprio vigia em baixarArquivo.
const buscar = async (url, tentativas = 3, limite = 45000) => {
	for (let i = 1; ; i++) {
		const ctl = new AbortController();
		const relogio = setTimeout(() => ctl.abort(), limite);
		try {
			const r = await fetch(url, {headers: UA, redirect: 'follow', signal: ctl.signal});
			clearTimeout(relogio);
			if (r.ok) return r;
			if (i >= tentativas || r.status === 404 || r.status === 403) throw new Error(`HTTP ${r.status} em ${url}`);
		} catch (e) {
			clearTimeout(relogio);
			if (ctl.signal.aborted) e = new Error(`O Drive não respondeu em ${limite / 1000} s (${new URL(url).host})`);
			// "fetch failed" sozinho não ajuda: mostra o host e a causa (sem internet, DNS, bloqueio).
			if (i >= tentativas) throw e.cause ? new Error(`Sem acesso a ${new URL(url).host} (${e.cause.code ?? e.cause.message})`) : e;
		}
		await new Promise((ok) => setTimeout(ok, 1500 * i));
	}
};

// Lista uma pasta pela página embeddedfolderview: [{id, nome, pasta}].
const lerPagina = async (url) => {
	for (let i = 1; ; i++) {
		const r = await buscar(url);
		let relogio;
		const limite = new Promise((_, falha) => (relogio = setTimeout(() => falha(new Error('O Drive parou de mandar a lista da pasta')), 45000)));
		try {
			return await Promise.race([r.text(), limite]);
		} catch (e) {
			r.body?.cancel().catch(() => {});
			if (i >= 3) throw e;
		} finally {
			clearTimeout(relogio);
		}
	}
};
const listarPasta = async (id) => {
	const html = await lerPagina(`https://drive.google.com/embeddedfolderview?id=${id}`);
	const itens = [];
	for (const bloco of html.split(/<div class="flip-entry"/).slice(1)) {
		const idItem = bloco.match(/id="entry-([\w-]+)"/)?.[1];
		const href = bloco.match(/<a href="([^"]+)"/)?.[1] ?? '';
		const nome = bloco.match(/class="flip-entry-title">([\s\S]*?)<\/div>/)?.[1];
		if (!idItem || nome == null) continue;
		const pasta = href.includes('/folders/');
		// Documentos nativos (Docs, Planilhas) não têm arquivo para baixar.
		if (!pasta && !href.includes('/file/d/')) continue;
		itens.push({id: idItem, nome: entidades(nome).trim(), pasta});
	}
	if (!itens.length && !/flip-entries|flip-list-view|flip-entry/.test(html)) {
		throw new Error('Não consegui ler a pasta do Drive. Ela está compartilhada como "Qualquer pessoa com o link"?');
	}
	return itens;
};

// Percorre a pasta e subpastas: [{id, caminho: [subpastas..., nome]}].
const listarTudo = async (idRaiz) => {
	const arquivos = [];
	const fila = [{id: idRaiz, caminho: []}];
	const vistas = new Set();
	let pct = 0;
	while (fila.length) {
		const {id, caminho} = fila.shift();
		if (vistas.has(id)) continue;
		vistas.add(id);
		// Não se sabe quantas subpastas há: estimativa que só avança, e 100 só no fim.
		pct = Math.max(pct, Math.min(99, ((vistas.size - 1) / (vistas.size + fila.length)) * 100));
		emitir({fase: 'listando as pastas do Drive', pct, arquivo: caminho.join('/') || '(raiz)'});
		const usados = new Set();
		for (const it of await listarPasta(id)) {
			let nome = limpar(it.nome);
			// Nomes repetidos na mesma pasta ganham sufixo.
			for (let n = 2; usados.has(nome.toLowerCase()); n++) {
				const ext = path.extname(limpar(it.nome));
				nome = `${path.basename(limpar(it.nome), ext)} (${n})${ext}`;
			}
			usados.add(nome.toLowerCase());
			if (it.pasta) fila.push({id: it.id, caminho: [...caminho, nome]});
			else if (!ignorar(nome)) arquivos.push({id: it.id, caminho: [...caminho, nome]});
		}
	}
	emitir({fase: 'listando as pastas do Drive', pct: 100, arquivo: `${arquivos.length} arquivos`});
	return arquivos;
};

// Baixa um arquivo em stream para o disco. Trata a página de aviso (vírus / arquivo grande) do Drive.
const baixarArquivo = async (id, destino, aoProgredir) => {
	let r = await buscar(`https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`);
	if ((r.headers.get('content-type') ?? '').includes('text/html')) {
		const html = await r.text();
		const form = html.match(/<form[^>]*id="download-form"[^>]*action="([^"]+)"[\s\S]*?<\/form>/);
		if (!form) {
			const titulo = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
			if (/quota|cota|too many/i.test(html)) throw new Error('O Drive bloqueou por excesso de downloads (cota). Tente de novo mais tarde.');
			throw new Error(`O Drive devolveu uma página em vez do arquivo${titulo ? ` (${entidades(titulo)})` : ''}`);
		}
		const url = new URL(entidades(form[1]));
		for (const m of form[0].matchAll(/<input[^>]*name="([^"]+)"[^>]*value="([^"]*)"/g)) url.searchParams.set(m[1], entidades(m[2]));
		r = await buscar(url.toString());
		if ((r.headers.get('content-type') ?? '').includes('text/html')) throw new Error('O Drive não liberou o download (aviso de vírus/cota)');
	}
	const total = Number(r.headers.get('content-length')) || 0;
	let feito = 0;
	const corpo = Readable.fromWeb(r.body);
	// Vigia: 90 s sem chegar nada = download parado; cai na nova tentativa de baixarLista.
	let chegou = Date.now();
	const vigia = setInterval(() => {
		if (Date.now() - chegou > 90000) corpo.destroy(new Error('O download parou de receber dados'));
	}, 5000);
	corpo.on('data', (b) => {
		chegou = Date.now();
		feito += b.length;
		if (total) aoProgredir(feito / total);
	});
	mkdirSync(path.dirname(destino), {recursive: true});
	const parcial = destino + '.parcial';
	try {
		await pipeline(corpo, createWriteStream(parcial));
	} finally {
		clearInterval(vigia);
	}
	renameSync(parcial, destino);
};

// Baixa uma lista [{id, destino}] com progresso e tentativas; devolve quantos falharam.
const baixarLista = async (lista) => {
	const falhas = [];
	for (const [i, it] of lista.entries()) {
		const nome = rel(it.destino, it.base);
		const pct = (frac) => emitir({fase: `baixando ${i + 1} de ${lista.length}`, pct: ((i + frac) / lista.length) * 100, arquivo: nome});
		pct(0);
		for (let t = 1; ; t++) {
			try {
				await baixarArquivo(it.id, it.destino, pct);
				registrar(it.destino, it.id, it.base);
				break;
			} catch (e) {
				rmSync(it.destino + '.parcial', {force: true});
				if (t >= 3) {
					falhas.push(`${nome}: ${e.message}`);
					break;
				}
				await new Promise((ok) => setTimeout(ok, 2000 * t));
			}
		}
		// Salva a cada arquivo: se cair no meio, o que já veio fica no catálogo.
		salvarCatalogo();
	}
	emitir({fase: `baixando ${lista.length} de ${lista.length}`, pct: 100, arquivo: ''});
	return falhas;
};

// Grava a raiz no lugar deste PC em .painel/pack.json (fora do git).
const definirRaizLocal = (dir) => {
	mkdirSync(path.dirname(PACK_LOCAL), {recursive: true});
	writeFileSync(PACK_LOCAL, JSON.stringify({raiz: dir}, null, '\t') + '\n');
	RAIZ_LOCAL = dir;
};

const importarDrive = async (url, pasta) => {
	const id = idDaPasta(url);
	if (!id) throw new Error('Link do Google Drive sem id de pasta (esperado .../drive/folders/<ID>)');
	const arquivos = await listarTudo(id);
	if (!arquivos.length) throw new Error('A pasta do Drive está vazia ou não é pública');
	if (pasta) {
		let dir = path.resolve(pasta);
		mkdirSync(dir, {recursive: true});
		// A pasta pode conter o pack dentro de uma pasta com o nome dele (ex.: G:\Meu Drive\Pack\Pack Mateus\SFX).
		const topo = new Set(arquivos.map((a) => a.caminho[0]));
		const temTopo = (d) => readdirSync(d).some((n) => topo.has(n));
		for (let d = dir; !temTopo(dir); ) {
			const subs = readdirSync(d, {withFileTypes: true}).filter((x) => !ignorar(x.name));
			if (subs.length !== 1 || !subs[0].isDirectory()) break;
			d = path.join(d, subs[0].name);
			if (temTopo(d)) dir = d;
		}
		definirRaizLocal(dir);
	}
	// Já está neste PC (mesmo caminho e, se o catálogo souber, mesmo tamanho): não baixa de novo.
	const porOrigem = new Map([...catalogo.values()].map((e) => [e.origem, e]));
	const destinoBase = RAIZ_LOCAL ?? ARQUIVOS;
	const lista = [];
	for (const a of arquivos) {
		const arquivo = a.caminho.join('/');
		const achado = localizar(arquivo);
		const antigo = porOrigem.get(a.id) ?? catalogo.get(arquivo);
		const mesmoTamanho = !antigo?.tamanho || antigo.arquivo !== arquivo || statSync(achado?.abs ?? '.').size === antigo.tamanho;
		if (achado && mesmoTamanho && (!porOrigem.get(a.id) || porOrigem.get(a.id).arquivo === arquivo)) registrar(achado.abs, a.id, achado.base);
		else lista.push({id: a.id, destino: path.join(destinoBase, ...a.caminho), base: destinoBase});
	}
	return baixarLista(lista);
};

// ---------- .zip e pasta local ----------
// Lista os arquivos de uma pasta, recursivo.
const varrer = (dir) =>
	readdirSync(dir, {withFileTypes: true}).flatMap((d) => {
		if (ignorar(d.name)) return [];
		const abs = path.join(dir, d.name);
		return d.isDirectory() ? varrer(abs) : d.isFile() ? [abs] : [];
	});
// Se tudo está dentro de uma única pasta (o nome do pack), as categorias são as subpastas dela.
const base = (dir) => {
	const itens = readdirSync(dir, {withFileTypes: true}).filter((d) => !ignorar(d.name));
	return itens.length === 1 && itens[0].isDirectory() ? base(path.join(dir, itens[0].name)) : dir;
};
// Copia (ou move) os arquivos de uma pasta para arquivos/, mantendo as subpastas.
const trazer = (origemDir, origem, mover) => {
	const dir = base(origemDir);
	const lista = varrer(dir);
	for (const [i, abs] of lista.entries()) {
		const partes = path.relative(dir, abs).split(path.sep).map(limpar);
		const destino = path.join(ARQUIVOS, ...partes);
		emitir({fase: 'extraindo', pct: 50 + (i / lista.length) * 50, arquivo: partes.join('/')});
		mkdirSync(path.dirname(destino), {recursive: true});
		if (mover) {
			try {
				renameSync(abs, destino);
			} catch {
				copyFileSync(abs, destino);
			}
		} else copyFileSync(abs, destino);
		registrar(destino, origem);
	}
	emitir({fase: 'extraindo', pct: 100, arquivo: ''});
	return lista.length;
};

// Descompacta com o que o sistema tiver: tar (Windows 10+ e Mac abrem zip), unzip, python ou PowerShell.
const descompactar = (zip, dir) => {
	const tarWin = path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'tar.exe');
	const tentativas = [
		[ehWin && existsSync(tarWin) ? tarWin : 'tar', ['-xf', zip, '-C', dir]],
		['unzip', ['-q', '-o', zip, '-d', dir]],
		['python3', ['-m', 'zipfile', '-e', zip, dir]],
		['python', ['-m', 'zipfile', '-e', zip, dir]],
	];
	if (ehWin) tentativas.push(['powershell', ['-NoProfile', '-Command', `Expand-Archive -LiteralPath '${zip.replace(/'/g, "''")}' -DestinationPath '${dir.replace(/'/g, "''")}' -Force`]]);
	const erros = [];
	for (const [cmd, a] of tentativas) {
		const r = spawnSync(cmd, a, {encoding: 'utf8'});
		if (r.status === 0 && readdirSync(dir).length) return;
		erros.push(`${path.basename(cmd)}: ${(r.error?.message ?? r.stderr ?? '').trim().split('\n').pop()}`);
		rmSync(dir, {recursive: true, force: true});
		mkdirSync(dir, {recursive: true});
	}
	throw new Error('Não consegui descompactar o .zip (' + erros.join(' | ') + ')');
};

const importarZip = (zip) => {
	// A pasta temporária fica dentro de arquivos/ (fora do git e no mesmo disco, para mover sem copiar).
	const tmp = path.join(ARQUIVOS, `.extraindo-${process.pid}`);
	rmSync(tmp, {recursive: true, force: true});
	mkdirSync(tmp, {recursive: true});
	try {
		emitir({fase: 'extraindo', pct: 0, arquivo: path.basename(zip)});
		descompactar(zip, tmp);
		emitir({fase: 'extraindo', pct: 50, arquivo: path.basename(zip)});
		return trazer(tmp, path.basename(zip), true);
	} finally {
		rmSync(tmp, {recursive: true, force: true});
	}
};

// ---------- --no-lugar: cataloga uma pasta local sem copiar ----------
const catalogarNoLugar = (pasta) => {
	const dir = base(pasta);
	emitir({fase: 'listando', pct: 0, arquivo: path.basename(dir)});
	const lista = varrer(dir);
	// Itens de zip/pasta que não estão na pasta nova saem do catálogo; os do Drive ficam (dá para baixar).
	const nomes = new Set(lista.map((abs) => rel(abs, dir)));
	for (const [k, e] of catalogo) if (!nomes.has(k) && !ehDoDrive(e) && !existsSync(path.join(ARQUIVOS, ...k.split('/')))) catalogo.delete(k);
	for (const [i, abs] of lista.entries()) {
		const arquivo = rel(abs, dir);
		emitir({fase: 'listando', pct: (i / lista.length) * 100, arquivo});
		// Mesmo arquivo já catalogado (ex.: veio do Drive): mantém a origem, que permite baixar em outro PC.
		registrar(abs, catalogo.get(arquivo)?.origem ?? path.basename(dir), dir);
	}
	emitir({fase: 'listando', pct: 100, arquivo: `${lista.length} arquivos`});
	definirRaizLocal(dir);
	return dir;
};

// ---------- --so-faltando ----------
const ehDoDrive = (e) => /^[\w-]{20,}$/.test(e.origem ?? '') && !/\.zip$/i.test(e.origem);
const sincronizar = async () => {
	const faltam = [...catalogo.values()].filter((e) => !localizar(e.arquivo));
	const doDrive = faltam.filter(ehDoDrive);
	const outros = faltam.filter((e) => !doDrive.includes(e));
	// Com a raiz no lugar configurada, o que falta é baixado direto nela.
	const destinoBase = RAIZ_LOCAL ?? ARQUIVOS;
	const falhas = await baixarLista(doDrive.map((e) => ({id: e.origem, destino: path.join(destinoBase, ...e.arquivo.split('/')), base: destinoBase})));
	const avisos = [...falhas];
	if (outros.length) {
		const zips = [...new Set(outros.map((e) => e.origem))].join(', ');
		avisos.push(`${outros.length} arquivos vieram de zip/pasta local e não dá para baixar sozinho: importe de novo (${zips})`);
	}
	return avisos;
};

// ---------- principal ----------
try {
	mkdirSync(ARQUIVOS, {recursive: true});
	let avisos = [];
	let raizLocal = null;
	if (soFaltando && !fonte) {
		avisos = await sincronizar();
	} else if (!fonte) {
		falhar('Uso: node scripts/importar-pack.mjs <link de pasta do Google Drive | arquivo .zip | pasta> [--so-faltando]');
	} else if (/^https?:\/\//i.test(fonte)) {
		if (!/drive\.google\.com/i.test(fonte)) falhar('Só links de pasta do Google Drive são aceitos');
		if (iPasta >= 0 && !pastaLocal) falhar('Faltou o caminho depois de --pasta');
		avisos = await importarDrive(fonte, pastaLocal);
		if (pastaLocal) raizLocal = RAIZ_LOCAL;
		if (soFaltando) avisos.push(...(await sincronizar()));
	} else {
		const abs = path.resolve(fonte);
		if (!existsSync(abs)) falhar(`Não achei ${fonte}`);
		if (noLugar) {
			if (!statSync(abs).isDirectory()) falhar('--no-lugar precisa de uma pasta (não de um .zip)');
			raizLocal = catalogarNoLugar(abs);
		} else if (statSync(abs).isDirectory()) {
			emitir({fase: 'extraindo', pct: 0, arquivo: path.basename(abs)});
			trazer(abs, path.basename(abs), false);
		} else if (/\.zip$/i.test(abs)) importarZip(abs);
		else falhar('Esperado um link do Google Drive, um .zip ou uma pasta');
	}
	const total = salvarCatalogo();
	const fim = {fim: true, saida: 'biblioteca/pack/catalogo.json', total};
	if (raizLocal) fim.raiz = raizLocal;
	if (avisos.length) fim.aviso = `${avisos.length} problema(s): ` + avisos.slice(0, 5).join(' · ').slice(0, 600);
	emitir(fim);
} catch (e) {
	try {
		salvarCatalogo();
	} catch {}
	falhar(e);
}
