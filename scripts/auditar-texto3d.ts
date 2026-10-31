// Confere se a entrada de cada texto 3D (Linha3D: letras que caem com mola, uma a cada 2 quadros) termina antes de a
// linha sair da tela. Roda o vídeo sem gravar imagem (imageFormat 'none'), lê o registro que o Linha3D faz com
// inputProps {auditarTexto3d: true} e, para cada linha, compara o quadro em que a última letra assenta com o último
// quadro em que ela aparece. Folga < 0 = entrada cortada; < 8 quadros = assenta durante o esmaecer da saída.
// Uso: npx tsx scripts/auditar-texto3d.ts <projeto> [--de SEG --ate SEG]
import {execFileSync} from 'node:child_process';
import {readdirSync, rmSync as apagar} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {openBrowser, renderFrames, selectComposition} from '@remotion/renderer';
import {spring} from 'remotion';
import {montar} from '../src/motor/plano';
import {projetos} from '../src/projetos';

const args = process.argv.slice(2);
const nome = args[0];
const arg = (n: string) => (args.includes(`--${n}`) ? Number(args[args.indexOf(`--${n}`) + 1]) : undefined);
const edit = projetos[nome];
const arq = path.join('public', edit.pasta, edit.video ?? 'video.mp4');
const dur = Number(JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', arq]).toString()).format.duration);
const m = montar(edit, dur);
const FPS = 30;

// Quadros até a mola da letra assentar (|1 − p| < 0,03 dali em diante).
const molaAssenta = (() => {
	const p = (f: number) => spring({frame: f, fps: FPS, config: {damping: 9, stiffness: 150, mass: 0.75}});
	for (let f = 0; f < 90; f++) if (Array.from({length: 40}, (_, g) => Math.abs(1 - p(f + g))).every((d) => d < 0.03)) return f;
	return 30;
})();

const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const inputProps = {auditarTexto3d: true};
const composition = await selectComposition({serveUrl, id: nome, inputProps});
const de = arg('de'), ate = arg('ate');
const ultimo = composition.durationInFrames - 1;
// Sem --de/--ate: só os trechos das cenas que podem ter texto 3D (as de sobreposição em HTML ficam de fora).
const SEM_3D = new Set(['chips', 'selo', 'pilula', 'live', 'comentario', 'siga', 'notificacoes', 'legenda']);
const trechos: [number, number][] =
	de !== undefined || ate !== undefined
		? [[Math.round((de ?? 0) * FPS), Math.min(ultimo, Math.round((ate ?? 1e9) * FPS))]]
		: m.cenas.filter((c) => !SEM_3D.has(c.tipo)).map((c) => [Math.max(0, Math.floor(c.de * FPS) - 1), Math.min(ultimo, Math.ceil(c.ate * FPS) + 1)] as [number, number]);
// Pastas de áudio que cada renderFrames cria no temporário (uma por trecho, centenas de MB): apagadas no fim.
const assetsAntes = new Set(readdirSync(os.tmpdir()).filter((n) => n.startsWith('remotion-v')));
const browser = await openBrowser('chrome', {chromiumOptions: {gl: 'angle'}});

type Reg = {inicioCena: number; batida: number; letras: number; assenta: number; texto: string; ultimoLocal: number; primeiroAbs: number; ultimoAbs: number};
const regs = new Map<string, Reg>();
for (const frameRange of trechos) await renderFrames({
	puppeteerInstance: browser,
	serveUrl,
	composition,
	inputProps,
	imageFormat: 'none',
	frameRange,
	scale: 0.25,
	concurrency: 3,
	timeoutInMilliseconds: 120000,
	outputDir: null,
	onStart: () => {},
	onFrameUpdate: () => {},
	onBrowserLog: (log) => {
		if (!log.text.startsWith('T3D|')) return;
		const [, a, q, b, n, iv, ...t] = log.text.split('|');
		const abs = Number(a), local = Number(q), batida = Number(b);
		const texto = t.join('|');
		const inicioCena = abs - local;
		const chave = `${inicioCena}|${batida}|${texto}`;
		const r = regs.get(chave) ?? {inicioCena, batida, letras: Number(n), assenta: Number(iv), texto, ultimoLocal: -1, primeiroAbs: abs, ultimoAbs: abs};
		r.ultimoLocal = Math.max(r.ultimoLocal, local);
		r.primeiroAbs = Math.min(r.primeiroAbs, abs);
		r.ultimoAbs = Math.max(r.ultimoAbs, abs);
		regs.set(chave, r);
	},
});
await browser.close({silent: true});

const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
const cenaEm = (abs: number) => m.cenas.find((c) => abs / FPS >= c.de - 0.02 && abs / FPS < c.ate + 0.02);
let ruins = 0;
console.log(`Texto 3D de ${nome} (mola assenta em ${molaAssenta} quadros)`);
for (const r of [...regs.values()].sort((x, y) => x.primeiroAbs - y.primeiroAbs)) {
	// número que conta (contador do gancho): cada valor fica 1–2 quadros e é trocado pelo seguinte de propósito.
	if (r.ultimoAbs - r.primeiroAbs <= 2 && /\d/.test(r.texto)) continue;
	// batida negativa = linha que já entra pronta (ex.: valor do contador): a entrada não conta.
	const assenta = r.batida < 0 ? -Infinity : r.assenta;
	const folga = r.ultimoLocal - assenta;
	const c = cenaEm(r.primeiroAbs);
	const rotulo = c ? (c.tipo === 'peca' ? c.nome : c.tipo) : '?';
	const sinal = folga < 0 ? '✗' : folga < 8 ? '⚠' : '✓';
	if (folga < 8) ruins++;
	if (sinal !== '✓' || args.includes('--todas'))
		console.log(`${sinal} ${fmt(r.primeiroAbs / FPS)}–${fmt(r.ultimoAbs / FPS)} ${rotulo} "${r.texto}": assenta no quadro ${assenta} da cena, some no ${r.ultimoLocal} (folga ${Number.isFinite(folga) ? folga : '∞'})`);
}
console.log(`Resumo: ${regs.size} linha(s) 3D, ${ruins} com entrada cortada ou no limite`);
// O pacote copia a public inteira (GBs): apagar no fim para não encher o disco.
apagar(serveUrl, {recursive: true, force: true});
for (const n of readdirSync(os.tmpdir())) if (n.startsWith('remotion-v') && !assetsAntes.has(n)) apagar(path.join(os.tmpdir(), n), {recursive: true, force: true});
