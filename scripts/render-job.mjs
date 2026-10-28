// Render com progresso, usado pelo painel (local ou dentro do pod). Escreve uma linha JSON por evento em stdout:
//   {"fase":"empacotando"|"renderizando"|"mixando", "pct":0..100, "quadros":n, "total":n, "eta":segundos}
//   {"fim":true, "saida":"out/..."}  ou  {"erro":"mensagem"}
// Uso: node scripts/render-job.mjs --projeto P --tipo previa|final [--res 540|720|1080] [--de SEG] [--ate SEG]
// Variável BROWSER: caminho de um Chrome/headless_shell (na nuvem, onde o Remotion não baixa o dele).
// Variável GL: renderizador WebGL do Chrome (padrão 'angle'; no pod Linux com placa NVIDIA, 'angle-egl' ou 'egl').
// Variável HW=0: não tenta o codificador da placa de vídeo.
import {spawn, spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {copyFileSync, existsSync, linkSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {RenderInternals, renderMedia, selectComposition} from '@remotion/renderer';

const raiz = path.resolve(import.meta.dirname, '..');
process.chdir(raiz);
const arg = (n, padrao) => {
	const i = process.argv.indexOf(`--${n}`);
	return i >= 0 ? process.argv[i + 1] : padrao;
};
// Aceita o projeto solto, como nos scripts antigos: npm run preview -- <projeto> --de 5 --ate 9
const solto = process.argv.slice(2).find((a, i, v) => !a.startsWith('--') && !(v[i - 1] ?? '').startsWith('--'));
const projeto = arg('projeto', solto);
const tipo = arg('tipo', 'previa');
const res = Number(arg('res', '720'));
const de = arg('de');
const ate = arg('ate');
const FPS = 30;
// Quadro JPEG preto 256x256 para testar o codificador da placa.
const QUADRO_TESTE = '/9j/4AAQSkZJRgABAgAAAQABAAD//gAQTGF2YzYwLjMxLjEwMgD/2wBDAAg+Pkk+SVVVVVVVVWRdZGhoaGRkZGRoaGhwcHCDg4NwcHBoaHBwfHyDg4+Tj4eHg4eTk5ubm7q6srLZ2eD/////xABLAAEBAAAAAAAAAAAAAAAAAAAACAEBAAAAAAAAAAAAAAAAAAAAABABAAAAAAAAAAAAAAAAAAAAABEBAAAAAAAAAAAAAAAAAAAAAP/AABEIAQABAAMBIgACEQADEQD/2gAMAwEAAhEDEQA/AJ/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB//9k=';
const ehWin = process.platform === 'win32';
// Uma linha por mudança de 1%, para o painel e para quem lê o terminal.
let ultimo = {fase: '', pct: -1};
const emitir = (o) => {
	if (o.fase) {
		const p = Math.floor(o.pct ?? 0);
		if (o.fase === ultimo.fase && p === ultimo.pct) return;
		ultimo = {fase: o.fase, pct: p};
	}
	process.stdout.write(JSON.stringify(o) + '\n');
};
// Pasta temporária do empacotamento: apagada no fim, com sucesso, erro ou cancelamento (cada uma tinha GB de vídeo).
let pastaBundle = null;
const limparBundle = () => {
	if (pastaBundle) rmSync(pastaBundle, {recursive: true, force: true});
	pastaBundle = null;
};
const falhar = (msg) => {
	emitir({erro: String(msg).slice(-700)});
	limparBundle();
	process.exit(1);
};
process.on('SIGTERM', () => falhar('Cancelado'));
process.on('SIGINT', () => falhar('Cancelado'));

// Sobras de renders antigos que caíram ou foram cancelados à força (pastas do Remotion no temporário do sistema).
const limparTemporarios = (horas) => {
	const limite = Date.now() - horas * 3600_000;
	for (const nome of readdirSync(os.tmpdir())) {
		if (!/^(remotion-|react-motion-render)/.test(nome)) continue;
		const f = path.join(os.tmpdir(), nome);
		try {
			if (statSync(f).mtimeMs < limite) rmSync(f, {recursive: true, force: true});
		} catch {}
	}
};

// A pasta public do empacotamento: em vez de o Remotion copiar a public inteira (vídeos de todos os projetos, vários GB a
// cada render), entram só sons, fontes e as mídias deste projeto, como links diretos (hard links: não ocupam espaço).
// Disco diferente (link impossível): copia. PUBLICO_INTEIRO=1 volta a usar a public toda.
const ligarPublico = (destino) => {
	const origem = path.join(raiz, 'public');
	const ligar = (rel) => {
		const de = path.join(origem, rel);
		if (!existsSync(de)) return;
		if (statSync(de).isDirectory()) {
			for (const nome of readdirSync(de)) {
				if (nome === 'referencias' || nome.endsWith('.parte')) continue;
				if (rel === 'projetos' && !process.env.PUBLICO_INTEIRO && nome !== projeto) continue;
				ligar(path.join(rel, nome));
			}
			return;
		}
		const para = path.join(destino, rel);
		mkdirSync(path.dirname(para), {recursive: true});
		try {
			linkSync(de, para);
		} catch {
			copyFileSync(de, para);
		}
	};
	for (const nome of readdirSync(origem)) ligar(nome);
};
// Erro solto (ex.: EPIPE do ffmpeg interno) também vira a linha {"erro"} que o painel entende.
process.on('uncaughtException', (e) => falhar(e?.message ?? e));
process.on('unhandledRejection', (e) => falhar(e?.message ?? e));
if (!projeto || !/^[a-z0-9-]+$/.test(projeto)) falhar('Projeto inválido');
if (![540, 720, 1080].includes(res)) falhar('Resolução da prévia: 540, 720 ou 1080');
mkdirSync('out', {recursive: true});

const temFfmpeg = spawnSync('ffmpeg', ['-version'], {shell: ehWin}).status === 0;
const inicio = Date.now();
// Tempo de cada etapa, para a linha de resumo no fim ({"tempos": {...}} e um aviso legível).
const tempos = {};
let etapaAtual = null, inicioEtapa = Date.now();
const etapa = (nome) => {
	if (etapaAtual) tempos[etapaAtual] = (tempos[etapaAtual] ?? 0) + (Date.now() - inicioEtapa) / 1000;
	etapaAtual = nome;
	inicioEtapa = Date.now();
};
const resumoTempos = () => {
	etapa(null);
	const t = Object.fromEntries(Object.entries(tempos).map(([k, v]) => [k, Number(v.toFixed(1))]));
	emitir({tempos: t, aviso: `Tempos: ${Object.entries(t).map(([k, v]) => `${k} ${v}s`).join(', ')}, total ${((Date.now() - inicio) / 1000).toFixed(1)}s.`});
};

// Cache do empacotamento: o webpack só roda de novo quando o código (src, dependências, tsconfig) muda. Cada render usa
// uma cópia por hard links do bundle guardado (instantânea; renders ao mesmo tempo não se atrapalham). SEM_CACHE=1 desliga.
const pastaCache = path.join(raiz, '.painel', 'bundle-cache');
const hashCodigo = () => {
	const h = createHash('sha1');
	const add = (rel) => {
		const f = path.join(raiz, rel);
		if (!existsSync(f)) return;
		if (statSync(f).isDirectory()) {
			for (const nome of readdirSync(f).sort()) add(path.join(rel, nome));
			return;
		}
		h.update(rel.replace(/\\/g, '/') + '\0').update(readFileSync(f)).update('\0');
	};
	['src', 'package-lock.json', 'tsconfig.json', 'scripts/render-job.mjs'].forEach(add);
	return h.digest('hex').slice(0, 16);
};
const clonarPorLinks = (de, para) => {
	mkdirSync(para, {recursive: true});
	for (const nome of readdirSync(de)) {
		const a = path.join(de, nome), b = path.join(para, nome);
		if (statSync(a).isDirectory()) clonarPorLinks(a, b);
		else {
			try {
				linkSync(a, b);
			} catch {
				copyFileSync(a, b);
			}
		}
	}
};
const limparCache = () => {
	try {
		// Bundles guardados: fica só o mais novo de cada um dos 3 últimos códigos. Cópias de uso de renders que caíram: 6 h.
		const guardados = readdirSync(pastaCache).filter((n) => /^[0-9a-f]{16}$/.test(n)).map((n) => ({n, t: statSync(path.join(pastaCache, n)).mtimeMs})).sort((a, b) => b.t - a.t);
		for (const {n} of guardados.slice(3)) rmSync(path.join(pastaCache, n), {recursive: true, force: true});
		for (const n of readdirSync(pastaCache).filter((x) => x.startsWith('uso-') || x.startsWith('novo-'))) {
			const f = path.join(pastaCache, n);
			if (statSync(f).mtimeMs < Date.now() - 6 * 3600_000) rmSync(f, {recursive: true, force: true});
		}
	} catch {}
};
const eta = (pct) => (pct > 3 ? Math.round(((Date.now() - inicio) / 1000) * ((100 - pct) / pct)) : null);

try {
	// 1. Conferir o plano (só no final: erros de âncora e curva barram o render).
	if (tipo === 'final') {
		etapa('conferir');
		emitir({fase: 'conferindo', pct: 0});
		const r = spawnSync('npx', ['tsx', 'scripts/conferir.ts', projeto], {shell: ehWin, encoding: 'utf8'});
		if (r.status !== 0) falhar('O conferir achou erros. Corrija antes do render final:\n' + (r.stdout || r.stderr || '').slice(-400));
	}

	// Projeto que usa silencios.json: mede as pausas do áudio se o arquivo está vazio ou é mais velho que o vídeo.
	const arqSil = path.join(raiz, 'src/projetos', projeto, 'silencios.json');
	const arqVideo = path.join(raiz, 'public/projetos', projeto, 'video.mp4');
	if (temFfmpeg && existsSync(arqSil) && existsSync(arqVideo) && (readFileSync(arqSil, 'utf8').trim().length < 5 || statSync(arqSil).mtimeMs < statSync(arqVideo).mtimeMs)) {
		etapa('pausas');
		emitir({fase: 'medindo as pausas do áudio', pct: 0});
		const r = spawnSync(process.execPath, [path.join(raiz, 'scripts/silencios.mjs'), projeto], {encoding: 'utf8'});
		if (r.status !== 0) emitir({aviso: 'Não consegui medir as pausas do áudio: os cortes ficam pelo tempo das palavras.'});
	}

	// 2. Empacotar o projeto (webpack), ou reaproveitar o bundle guardado do mesmo código.
	etapa('empacotar');
	emitir({fase: 'empacotando', pct: 1});
	const base = tipo === 'final' ? 8 : 12;
	limparTemporarios(6);
	const vazia = path.join(raiz, '.painel', 'publico-vazio');
	mkdirSync(vazia, {recursive: true});
	mkdirSync(pastaCache, {recursive: true});
	limparCache();
	const hash = process.env.SEM_CACHE ? null : hashCodigo();
	const guardado = hash && path.join(pastaCache, hash);
	if (!guardado || !existsSync(path.join(guardado, 'index.html'))) {
		const novo = path.join(pastaCache, `novo-${process.pid}-${Date.now()}`);
		pastaBundle = novo;
		await bundle({
			entryPoint: path.join(raiz, 'src/index.ts'),
			publicDir: vazia,
			outDir: novo,
			onProgress: (p) => emitir({fase: 'empacotando', pct: 1 + (p / 100) * (base - 1)}),
		});
		if (guardado) {
			// Outro render pode ter guardado o mesmo código enquanto este empacotava: fica o que chegou primeiro.
			try {
				renameSync(novo, guardado);
			} catch {
				rmSync(novo, {recursive: true, force: true});
			}
		}
	} else emitir({aviso: 'Empacotamento reaproveitado (código igual ao do último render).'});
	if (guardado) {
		pastaBundle = path.join(pastaCache, `uso-${process.pid}-${Date.now()}`);
		rmSync(path.join(guardado, 'public'), {recursive: true, force: true});
		clonarPorLinks(guardado, pastaBundle);
	}
	const serveUrl = pastaBundle;
	emitir({fase: 'empacotando', pct: base});
	ligarPublico(path.join(serveUrl, 'public'));

	// 3. Renderizar. Mesmas opções do remotion.config.ts e dos scripts preview.sh e finalizar.sh.
	const browserExecutable = process.env.BROWSER || null;
	const gl = ['angle', 'angle-egl', 'egl', 'swangle', 'swiftshader', 'vulkan'].includes(process.env.GL) ? process.env.GL : 'angle';
	const chromiumOptions = {gl};
	const inputProps = {projeto, duracaoFonte: 0};
	etapa('abrir');
	const composition = await selectComposition({serveUrl, id: projeto, inputProps, browserExecutable, chromiumOptions});
	let frameRange = null;
	let sufixo = '';
	if (tipo !== 'final' && (de || ate)) {
		const ini = Math.max(0, Math.floor(Number(de ?? 0) * FPS));
		const fim = ate ? Math.min(composition.durationInFrames - 1, Math.floor(Number(ate) * FPS) - 1) : composition.durationInFrames - 1;
		if (!(fim >= ini)) falhar('Trecho inválido (--de / --ate)');
		frameRange = [ini, fim];
		sufixo = `-${de ?? 0}s-${ate ?? 'fim'}s`;
	}
	const nQuadros = frameRange ? frameRange[1] - frameRange[0] + 1 : composition.durationInFrames;
	const brutoRel = tipo === 'final' ? `out/${projeto}-bruto.mp4` : `out/${projeto}-preview${sufixo}.mp4`;
	const opcoes = {
		serveUrl,
		composition,
		inputProps,
		codec: 'h264',
		outputLocation: path.join(raiz, brutoRel),
		overwrite: true,
		scale: tipo === 'final' ? 2 : res / 1080,
		videoBitrate: tipo === 'final' ? '50M' : '6M',
		...(tipo === 'final' ? {audioCodec: 'aac', audioBitrate: '320k'} : {}),
		imageFormat: 'jpeg',
		jpegQuality: 95,
		// CONC (o pod passa o nº de núcleos): usa todos, não só metade como o padrão do Remotion.
		concurrency: Number(process.env.CONC) > 0 ? Number(process.env.CONC) : null,
		...(Number(process.env.CONC) > 0 ? {offthreadVideoCacheSizeInBytes: Math.floor(os.totalmem() * 0.4), offthreadVideoThreads: Number(process.env.CONC)} : {}),
		frameRange,
		browserExecutable,
		chromiumOptions,
		onProgress: ({progress, renderedFrames, encodedFrames}) => {
			const pct = base + progress * ((tipo === 'final' ? 90 : 100) - base);
			emitir({fase: 'renderizando', pct, quadros: renderedFrames, codificados: encodedFrames, total: nQuadros, eta: eta(pct)});
		},
	};
	// Tenta o codificador da placa (NVENC, VideoToolbox...). O Remotion não volta sozinho para a CPU se ele listar o codificador
	// mas não conseguir abri-lo, então repetimos com a CPU. HW=0 desliga a tentativa.
	// O ffmpeg do Remotion lista o NVENC mesmo sem placa e só falha DEPOIS de renderizar todos os quadros (o render inteiro era
	// refeito na CPU: 2x o tempo). Antes, codifica 1 quadro com o NVENC no ffmpeg do Remotion (meio segundo): falhou, vai direto na CPU.
	const nvencAbre = () => {
		if (process.platform === 'darwin') return true;
		try {
			const exe = RenderInternals.getExecutablePath({type: 'ffmpeg', indent: false, logLevel: 'error', binariesDirectory: null});
			RenderInternals.makeFileExecutableIfItIsNot(exe);
			const pasta = path.dirname(exe);
			const r = spawnSync(exe, ['-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-i', '-', '-frames:v', '1', '-pix_fmt', 'yuv420p', '-c:v', 'h264_nvenc', '-f', 'null', '-'], {
				input: Buffer.from(QUADRO_TESTE, 'base64'),
				cwd: pasta,
				env: {...process.env, LD_LIBRARY_PATH: [pasta, process.env.LD_LIBRARY_PATH].filter(Boolean).join(':')},
				timeout: 20000,
			});
			return r.status === 0;
		} catch {
			return true;
		}
	};
	const hwDesligado = process.env.HW === '0' || !nvencAbre();
	if (process.env.HW !== '0' && hwDesligado) emitir({aviso: 'Codificador da placa (NVENC) não abre neste computador: codificando na CPU.'});
	const renderizar = async (o) => {
		if (hwDesligado) return renderMedia({...o, hardwareAcceleration: 'disable'});
		try {
			await renderMedia({...o, hardwareAcceleration: 'if-possible'});
		} catch (e) {
			if (!/nvenc|videotoolbox|vaapi|qsv|amf|encoder|Conversion failed/i.test(String(e?.message))) throw e;
			emitir({aviso: 'Codificador da placa indisponível neste computador: usando a CPU.'});
			await renderMedia({...o, hardwareAcceleration: 'disable'});
		}
	};
	// WebGL (cenas 3D): se o modo escolhido não abre neste computador (comum em pod com a placa liberada só para cálculo),
	// tenta os outros e por último o swangle (sem placa: sempre funciona, só o 3D fica mais lento). Avisa qual funcionou.
	etapa('render');
	const t0 = Date.now();
	const modosGl = [...new Set([gl, 'egl', 'angle-egl', 'angle', 'swangle'])];
	for (const [i, modo] of modosGl.entries()) {
		try {
			await renderizar({...opcoes, chromiumOptions: {...chromiumOptions, gl: modo}});
			emitir({aviso: `Render: WebGL "${modo}", ${opcoes.concurrency ?? 'padrão'} threads, ${nQuadros} quadros em ${((Date.now() - t0) / 1000).toFixed(0)}s (${(nQuadros / Math.max(1, (Date.now() - t0) / 1000)).toFixed(1)} q/s).`});
			if (modo !== gl) emitir({aviso: `WebGL "${gl}" não abriu aqui: renderizou com "${modo}".`, gl: modo});
			break;
		} catch (e) {
			if (!/webgl|gl context|egl|angle|gpu process|GLES/i.test(String(e?.message)) || i === modosGl.length - 1) throw e;
			emitir({fase: `WebGL "${modo}" falhou, tentando "${modosGl[i + 1]}"`, pct: base});
		}
	}

	// 4. Final: loudness em duas passadas (-14 LUFS, -1,5 dBTP) sem mexer no vídeo.
	if (tipo === 'final') {
		const finalRel = `out/${projeto}-final.mp4`;
		if (!temFfmpeg) {
			renameSync(brutoRel, finalRel);
			emitir({aviso: 'ffmpeg não encontrado: o áudio ficou sem a normalização de -14 LUFS.'});
		} else {
			etapa('mixar');
			emitir({fase: 'mixando', pct: 91});
			const medir = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', brutoRel, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], {shell: false, encoding: 'utf8'});
			const json = /\{[\s\S]*\}/.exec(medir.stderr ?? '')?.[0];
			const m = json ? JSON.parse(json) : null;
			emitir({fase: 'mixando', pct: 95});
			const filtro = m
				? `loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=48000`
				: 'loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000';
			await new Promise((ok, erro) => {
				const f = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', brutoRel, '-c:v', 'copy', '-af', filtro, '-c:a', 'aac', '-b:a', '320k', '-movflags', '+faststart', finalRel]);
				f.on('close', (c) => (c === 0 ? ok() : erro(new Error('ffmpeg falhou na mixagem'))));
				f.on('error', erro);
			});
			rmSync(brutoRel, {force: true});
		}
		// Com o Drive vinculado (scripts/drive.mjs config), o vídeo final também vai para a pasta do Drive.
		if (existsSync(path.join(raiz, '.painel/drive.json'))) {
			etapa('drive');
			const d = spawnSync('node', ['scripts/drive.mjs', 'salvar', finalRel], {cwd: raiz, shell: false, encoding: 'utf8'});
			if (d.status !== 0) emitir({aviso: 'Não consegui copiar o vídeo para o Drive (o Drive para computador está aberto?).'});
		}
		resumoTempos();
		emitir({fim: true, saida: finalRel});
	} else {
		resumoTempos();
		emitir({fim: true, saida: brutoRel});
	}
	limparBundle();
	process.exit(0);
} catch (e) {
	falhar(e?.message ?? e);
}
