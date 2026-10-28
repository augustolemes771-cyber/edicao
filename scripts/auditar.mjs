// Auditoria repetível de desempenho: mede o que dá para medir aqui e imprime um resumo (e grava out/auditoria.json).
//   npm run auditar                       tudo (bundle + render curto + painel + ffmpeg + estáticos)
//   npm run auditar -- --rapido           só estáticos, painel e ffmpeg (sem bundle nem render)
//   npm run auditar -- --projeto P --de 2 --ate 6 --res 720   escolhe o trecho do render de teste
//   npm run auditar -- --varrer-conc 4,8,12,16   (no pod) q/s por nº de abas do Chrome
// Variáveis: BROWSER (chrome headless da nuvem), GL (padrão swangle fora do pod), CONC.
// Números daqui valem para COMPARAR antes/depois no mesmo computador; não são os do pod.
import {spawn, spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {gzipSync} from 'node:zlib';

const raiz = path.resolve(import.meta.dirname, '..');
process.chdir(raiz);
const args = process.argv.slice(2);
const arg = (n, p) => (args.includes(`--${n}`) ? args[args.indexOf(`--${n}`) + 1] : p);
const rapido = args.includes('--rapido');
const projeto = arg('projeto', 'cenarios-exemplo');
const de = arg('de', '2');
const ate = arg('ate', '6');
const res = arg('res', '720');
const R = {data: new Date().toISOString(), cpus: os.cpus().length, memGB: +(os.totalmem() / 2 ** 30).toFixed(1), commit: spawnSync('git', ['rev-parse', '--short', 'HEAD'], {encoding: 'utf8'}).stdout.trim()};
const titulo = (t) => console.log(`\n== ${t}`);
const linha = (k, v, nota = '') => console.log(`  ${k.padEnd(34)} ${String(v).padEnd(14)} ${nota}`);
const seg = (ms) => +(ms / 1000).toFixed(2);
const ler = (f) => (existsSync(f) ? readFileSync(f, 'utf8') : '');
const tamanhoDir = (dir, filtro = () => true) => {
	let t = 0, n = 0;
	const andar = (d) => {
		if (!existsSync(d)) return;
		for (const e of readdirSync(d, {withFileTypes: true})) {
			const f = path.join(d, e.name);
			if (e.isDirectory()) andar(f);
			else if (filtro(f)) { t += statSync(f).size; n++; }
		}
	};
	andar(dir);
	return {bytes: t, arquivos: n};
};
const mb = (b) => `${(b / 2 ** 20).toFixed(1)} MB`;

// 1. Configuração do render ------------------------------------------------------------------------------------------------
titulo('1. Configuração do render (remotion.config.ts + render-job.mjs)');
const cfg = ler('remotion.config.ts'), job = ler('scripts/render-job.mjs');
const pega = (re, t) => re.exec(t)?.[1] ?? '?';
R.config = {
	jpegQuality: pega(/setJpegQuality\((\d+)\)/, cfg),
	jobJpegQuality: pega(/jpegQuality: (\d+)/, job),
	scaleFinal: pega(/scale: tipo === 'final' \? (\d+)/, job),
	concurrencia: /CONC/.test(job) ? 'CONC (pod: nproc)' : 'padrão (metade)',
	offthreadCache: /offthreadVideoCacheSizeInBytes/.test(job),
	bundleCache: /cacheBundle|reusarBundle|\.painel\/bundle/.test(job),
};
linha('jpegQuality (config/job)', `${R.config.jpegQuality}/${R.config.jobJpegQuality}`, 'prévia a 80-85 rende ~15-25% mais rápido');
linha('concorrência', R.config.concurrencia);
linha('offthreadVideo cache/threads', R.config.offthreadCache ? 'sim (só no pod)' : 'não');
const ffLoud = /loudnorm[^\n]*print_format=json/.test(job) && !/-vn[^\n]*loudnorm/.test(job.split('mixando')[1] ?? '');
R.loudnormSemVn = ffLoud;
linha('loudnorm 1ª passada com -vn', ffLoud ? 'NÃO (decodifica o vídeo 4K)' : 'sim');

// 2. O que vai para o pod a cada bloco ---------------------------------------------------------------------------------------
titulo('2. Envio ao pod a cada bloco (painel/pod.mjs: CODIGO, FORA)');
const pod = ler('painel/pod.mjs');
const itens = (/const CODIGO = \[([^\]]+)\]/.exec(pod)?.[1] ?? '').split(',').map((s) => s.trim().replace(/'/g, '')).filter(Boolean);
let tCod = 0, nCod = 0;
for (const i of itens) {
	if (!existsSync(i)) continue;
	const s = statSync(i);
	const t = s.isDirectory() ? tamanhoDir(i, (f) => !f.includes('biblioteca/pack/arquivos')) : {bytes: s.size, arquivos: 1};
	tCod += t.bytes; nCod += t.arquivos;
}
R.codigoPod = {bytes: tCod, arquivos: nCod};
linha('código enviado (sem tar/gzip)', mb(tCod), `${nCod} arquivos; reenvia tudo em todo bloco`);
const maiores = [];
for (const d of ['biblioteca', 'public/sfx', 'public/fontes', 'src']) tamanhoDir(d, (f) => { maiores.push([statSync(f).size, f]); return true; });
maiores.sort((a, b) => b[0] - a[0]);
R.maioresArquivos = maiores.slice(0, 5).map(([b, f]) => ({f, mb: +(b / 2 ** 20).toFixed(2)}));
for (const [b, f] of maiores.slice(0, 3)) linha('  maior', mb(b), f);
const ssh = (pod.match(/sshRodar\(/g) ?? []).length;
linha('chamadas ssh no fluxo do pod', ssh, 'cada uma abre conexão nova (sem ControlMaster)');
linha('ControlMaster/ControlPersist', /ControlMaster|ControlPersist/.test(pod) ? 'sim' : 'NÃO', 'não existe no Windows; ver nota do documento');

// 3. Composições: o que pesa por quadro --------------------------------------------------------------------------------------
titulo('3. Custo estático das composições (src/)');
const arquivosSrc = [];
const andarSrc = (d) => { for (const e of readdirSync(d, {withFileTypes: true})) { const f = path.join(d, e.name); e.isDirectory() ? andarSrc(f) : /\.(tsx|ts)$/.test(e.name) && arquivosSrc.push(f); } };
andarSrc('src');
const conta = (re) => arquivosSrc.reduce((s, f) => s + (ler(f).match(re)?.length ?? 0), 0);
R.src = {
	canvas3d: conta(/<Canvas\b/g),
	antialias: conta(/antialias:\s*(true|!)/g),
	preserveDrawingBuffer: conta(/preserveDrawingBuffer/g),
	offthreadVideo: conta(/<OffthreadVideo\b/g),
	img: conta(/<Img\b/g),
	useMemo: conta(/useMemo\(/g),
	filtrosCss: conta(/filter:\s*[`'"][^`'"]*(blur|drop-shadow)/g),
	boxShadowGrande: conta(/(boxShadow|textShadow)/g),
	mixBlend: conta(/mixBlendMode/g),
	sombraTresCriaMateriais: conta(/new THREE\.\w*Material\(/g),
};
for (const [k, v] of Object.entries(R.src)) linha(k, v);
const grandes = arquivosSrc.map((f) => [ler(f).length, f]).sort((a, b) => b[0] - a[0]).slice(0, 3);
for (const [n, f] of grandes) linha('  maior arquivo', `${(n / 1024).toFixed(0)} KB`, f);

// 4. Painel (servidor.mjs) ---------------------------------------------------------------------------------------------------
titulo('4. Painel: servidor e página');
const web = ler('painel/web/app.js'), html = ler('painel/web/index.html'), css = ler('painel/web/app.css');
R.web = {appJs: web.length, appJsGzip: gzipSync(web).length, css: css.length, cssGzip: gzipSync(css).length, html: html.length};
linha('app.js', `${(web.length / 1024).toFixed(0)} KB`, `gzip ${(R.web.appJsGzip / 1024).toFixed(0)} KB`);
linha('app.css', `${(css.length / 1024).toFixed(0)} KB`, `gzip ${(R.web.cssGzip / 1024).toFixed(0)} KB`);
const srvTxt = ler('painel/servidor.mjs');
linha('servidor usa gzip/compress', /createGzip|zlib|gzip/.test(srvTxt) ? 'sim' : 'NÃO', 'o painel é local; só importa pelo túnel/celular');
linha('Cache-Control nos estáticos', /cache-control/i.test(srvTxt) ? 'sim' : 'não');
linha('setInterval no servidor', (srvTxt.match(/setInterval\(/g) ?? []).length);
const pollings = [...web.matchAll(/(setInterval|setTimeout)\(([^;\n]*?),\s*([^;\n)]*\d{3,}[^;\n)]*)\)/g)].filter((m) => /poll|verificar|atualizar/i.test(m[2])).length;
linha('pollings no cliente', pollings, '(pollTarefas 1s/6s/30s, pollBloco 1,5s/10s, verificarClaude 3s)');

if (!rapido || args.includes('--painel')) {
	const porta = '4998';
	const srv = spawn(process.execPath, ['painel/servidor.mjs'], {env: {...process.env, PORTA: porta, SEM_NAVEGADOR: '1'}});
	let saida = '';
	srv.stdout.on('data', (d) => (saida += d));
	srv.stderr.on('data', (d) => (saida += d));
	const t0 = Date.now();
	for (let i = 0; i < 60 && !/#\w+/.test(saida); i++) await new Promise((r) => setTimeout(r, 200));
	const token = /#(\w+)/.exec(saida)?.[1];
	if (token) {
		R.painel = {subida_ms: Date.now() - t0, rotas: {}};
		linha('painel sobe em', `${seg(Date.now() - t0)} s`);
		const rotas = ['/', '/app.js', '/app.css', '/api/tarefas', '/api/claude', '/api/biblioteca', '/api/projetos', '/api/config', '/api/fluxo', '/api/historico', '/api/prompts', '/api/temas', '/api/andamento', '/api/pendencias', '/api/previas', '/api/midias?projeto=primeiro'];
		for (const rota of rotas) {
			const medidas = [];
			let bytes = 0, status = 0;
			for (let i = 0; i < 5; i++) {
				const a = performance.now();
				const r = await fetch(`http://127.0.0.1:${porta}${rota}`, {headers: {'x-painel-token': token}}).catch(() => null);
				if (!r) break;
				status = r.status;
				bytes = (await r.arrayBuffer()).byteLength;
				medidas.push(performance.now() - a);
			}
			if (!medidas.length) continue;
			medidas.sort((a, b) => a - b);
			R.painel.rotas[rota] = {status, bytes, ms: +medidas[Math.floor(medidas.length / 2)].toFixed(1)};
			linha(rota, `${R.painel.rotas[rota].ms} ms`, `${status} · ${(bytes / 1024).toFixed(1)} KB`);
		}
	} else linha('painel', 'não subiu', saida.slice(-120));
	srv.kill();
}

// 5. ffmpeg: loudnorm e conferência de áudio, com e sem decodificar o vídeo -----------------------------------------------
titulo('5. ffmpeg (clipe sintético 1080p, 30 s, h264)');
if (spawnSync('ffmpeg', ['-version']).status === 0) {
	const dir = path.join(raiz, '.painel');
	mkdirSync(dir, {recursive: true});
	const clipe = path.join(dir, 'auditoria-clipe.mp4');
	spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=1920x1080:rate=30:duration=30', '-f', 'lavfi', '-i', 'sine=frequency=300:duration=30', '-c:v', 'libx264', '-preset', 'ultrafast', '-b:v', '20M', '-c:a', 'aac', '-shortest', clipe]);
	const tempo = (extra) => { const a = performance.now(); spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', clipe, ...extra, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], {encoding: 'utf8'}); return performance.now() - a; };
	const com = tempo([]), sem = tempo(['-vn']);
	R.ffmpeg = {loudnorm_com_video_ms: Math.round(com), loudnorm_vn_ms: Math.round(sem)};
	linha('loudnorm (como está hoje)', `${seg(com)} s`);
	linha('loudnorm com -vn', `${seg(sem)} s`, `${(com / sem).toFixed(1)}x mais rápido`);
	spawnSync('rm', ['-f', clipe]);
} else linha('ffmpeg', 'não instalado');

// 6. Texto que o assistente lê a cada pedido -------------------------------------------------------------------------------
titulo('6. Tokens do assistente (≈ caracteres/4)');
const tok = (f) => Math.round(ler(f).length / 4);
const fixos = ['CLAUDE.md', '.claude/skills/editar-video/SKILL.md'];
R.tokens = {};
for (const f of fixos) { R.tokens[f] = tok(f); linha(f, `~${tok(f)} tok`); }
const skillDir = '.claude/skills/editar-video';
if (existsSync(skillDir)) for (const f of readdirSync(skillDir, {recursive: true}).filter((x) => /\.md$/.test(String(x)) && !/SKILL\.md$/.test(String(x)))) { R.tokens[`skill/${f}`] = tok(path.join(skillDir, String(f))); }
const refs = Object.entries(R.tokens).filter(([k]) => k.startsWith('skill/'));
linha('arquivos extras da skill', refs.length, `~${refs.reduce((s, [, v]) => s + v, 0)} tok se lidos todos`);
const cfgPainel = ler('painel/config.mjs');
linha('painel/config.mjs (prompts)', `~${Math.round(cfgPainel.length / 4)} tok`, 'vai no system prompt se for injetado');

// 7. Bundle e render curto (o que mais pesa) ------------------------------------------------------------------------------
if (!rapido) {
	titulo(`7. Bundle e render de teste (${projeto}, ${de}-${ate} s, ${res}p, GL=${process.env.GL ?? 'swangle'})`);
	const env = {...process.env, GL: process.env.GL ?? 'swangle', HW: '0'};
	if (!env.BROWSER) {
		const achado = ['/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell', '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell'].find(existsSync);
		if (achado) env.BROWSER = achado;
	}
	const rodada = (ambiente = env) => new Promise((ok) => {
		const t0 = Date.now(), marcos = {}, avisos = [];
		const p = spawn(process.execPath, ['scripts/render-job.mjs', '--projeto', projeto, '--tipo', 'previa', '--res', res, '--de', de, '--ate', ate], {env: ambiente});
		let resto = '';
		p.stdout.on('data', (d) => {
			resto += d;
			const ls = resto.split('\n');
			resto = ls.pop();
			for (const l of ls) {
				try {
					const e = JSON.parse(l);
					if (e.fase && !(e.fase in marcos)) marcos[e.fase] = Date.now() - t0;
					if (e.aviso) avisos.push(e.aviso);
					if (e.erro) avisos.push(`ERRO: ${e.erro}`);
					if (e.fim) marcos.fim = Date.now() - t0;
				} catch {}
			}
		});
		p.on('close', (c) => ok({codigo: c, marcos, total: Date.now() - t0, avisos}));
	});
	const rs = [];
	for (let i = 0; i < 2; i++) {
		const r = await rodada();
		rs.push(r);
		const m = r.marcos;
		linha(`rodada ${i + 1} (${i ? 'quente' : 'fria'})`, `${seg(r.total)} s`, `empacotar ${seg((m.renderizando ?? m.fim ?? r.total) - (m.empacotando ?? 0))} s · render+resto ${seg(r.total - (m.renderizando ?? 0))} s${r.codigo ? ' · FALHOU' : ''}`);
		for (const a of r.avisos.slice(0, 2)) linha('  aviso', '', a.slice(0, 110));
	}
	R.render = {projeto, trecho: `${de}-${ate}`, res, rodadas: rs.map((r) => ({total_s: seg(r.total), marcos_s: Object.fromEntries(Object.entries(r.marcos).map(([k, v]) => [k, seg(v)])), codigo: r.codigo, avisos: r.avisos}))};
	const quadrosReais = Math.round((Number(ate) - Number(de)) * 30);
	const renderS = (r) => (r.total - (r.marcos.renderizando ?? 0)) / 1000;
	linha('q/s reais (rodada quente)', (quadrosReais / renderS(rs[1])).toFixed(2), `${quadrosReais} quadros; o aviso do render-job divide pela composição inteira`);
	R.render.qps_reais = +(quadrosReais / renderS(rs[1])).toFixed(2);
	R.render.bundle_fria_s = seg(rs[0].marcos.renderizando ?? 0);
	R.render.bundle_quente_s = seg(rs[1].marcos.renderizando ?? 0);
	linha('webpack: fria → quente', `${R.render.bundle_fria_s} → ${R.render.bundle_quente_s} s`, 'cache em node_modules/.cache (no pod persiste entre blocos)');
	const varrer = (arg('varrer-conc', '') || '').split(',').filter(Boolean);
	for (const c of varrer) {
		const r = await rodada({...env, CONC: c});
		linha(`CONC=${c}`, `${(quadrosReais / renderS(r)).toFixed(2)} q/s`, `${seg(r.total)} s no total`);
		(R.render.conc ??= {})[c] = +(quadrosReais / renderS(r)).toFixed(2);
	}
	const fria = rs[0].marcos;
	linha('fração em empacotar+seleção', `${Math.round((((fria.renderizando ?? 0) - 0) / rs[0].total) * 100)}%`, 'tempo ANTES do primeiro quadro; se alto, vale cache de bundle');
}

mkdirSync('out', {recursive: true});
writeFileSync('out/auditoria.json', JSON.stringify(R, null, 1));
console.log('\nResumo gravado em out/auditoria.json');
