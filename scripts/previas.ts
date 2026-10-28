// Gera imagens de como o vídeo está ficando: um quadro por cena (já com a animação de entrada visível) mais alguns de apoio.
// Não gasta limite do Claude: só o Remotion. Saída: out/previas/<projeto>/NN.jpg e manifest.json.
// Uso: npm run previas -- <projeto> [--res 540] [--max 30]
import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, rmSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';
import {formatar, montar} from '../src/motor/plano';
import {projetos} from '../src/projetos';

const FPS = 30;
const raiz = path.resolve(import.meta.dirname, '..');
process.chdir(raiz);
const arg = (n: string, padrao: string) => {
	const i = process.argv.indexOf(`--${n}`);
	return i >= 0 ? process.argv[i + 1] : padrao;
};
const nome = process.argv[2];
const res = Number(arg('res', '540'));
const maximo = Number(arg('max', '30'));
const edit = nome ? projetos[nome] : undefined;
if (!nome || !edit) {
	console.error(`Uso: npm run previas -- <projeto>. Existentes: ${Object.keys(projetos).join(', ')}`);
	process.exit(1);
}

let duracaoFonte = edit.duracao ?? 0;
if (edit.video) {
	const arquivo = path.join('public', edit.pasta, edit.video);
	if (!existsSync(arquivo)) {
		console.error(`Vídeo não encontrado: ${arquivo}`);
		process.exit(1);
	}
	duracaoFonte = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', arquivo]).toString());
}
const m = montar(edit, duracaoFonte);

// Rótulo legível da cena: o tipo e o texto principal que ela mostra.
const textoDe = (c: Record<string, unknown>) => {
	for (const k of ['texto', 'titulo', 'grande', 'linha1', 'valor', 'rotulo']) if (typeof c[k] === 'string') return String(c[k]).replace(/\*/g, '');
	if (Array.isArray(c.palavras)) return c.palavras.join(' ');
	if (Array.isArray(c.itens)) return c.itens.map((i: unknown) => (typeof i === 'string' ? i : (i as {texto?: string}).texto ?? '')).join(' · ');
	return '';
};

type Alvo = {t: number; tipo: string; texto: string; de?: number; ate?: number};
const alvos: Alvo[] = m.cenas.map((c) => {
	const dur = c.ate - c.de;
	return {t: c.de + Math.min(0.6, dur / 2), tipo: String(c.tipo), texto: textoDe(c as unknown as Record<string, unknown>), de: c.de, ate: c.ate};
});
// Quadros de apoio: abertura, meio e fim, e um a cada ~8 s onde não há cena (só vídeo + legenda).
const livre = (t: number) => !alvos.some((a) => a.de !== undefined && a.ate !== undefined && t >= a.de && t <= a.ate);
for (let t = 0.5; t < m.duracaoEditada - 0.3; t += 8) if (livre(t)) alvos.push({t, tipo: 'video', texto: 'sem cena: só vídeo e legenda'});
alvos.sort((a, b) => a.t - b.t);
// Corta o excesso de forma uniforme.
const passo = alvos.length > maximo ? alvos.length / maximo : 1;
const escolhidos = Array.from({length: Math.min(alvos.length, maximo)}, (_, i) => alvos[Math.floor(i * passo)]);

const saida = path.join(raiz, 'out/previas', nome);
rmSync(saida, {recursive: true, force: true});
mkdirSync(saida, {recursive: true});

console.log(`Prévias de ${nome}: ${escolhidos.length} imagens (${m.cenas.length} cenas, ${formatar(m.duracaoEditada)})`);
const serveUrl = await bundle({entryPoint: path.join(raiz, 'src/index.ts')});
const browserExecutable = process.env.BROWSER || null;
const gl = ['angle', 'angle-egl', 'egl', 'swangle', 'swiftshader', 'vulkan'].includes(process.env.GL ?? '') ? (process.env.GL as 'angle') : 'angle';
const chromiumOptions = {gl};
const inputProps = {projeto: nome, duracaoFonte: 0};
const composition = await selectComposition({serveUrl, id: nome, inputProps, browserExecutable, chromiumOptions});
const browser = await openBrowser('chrome', {browserExecutable, chromiumOptions});

const itens: {arquivo: string; t: number; tipo: string; texto: string}[] = [];
try {
	for (const [i, a] of escolhidos.entries()) {
		const frame = Math.min(composition.durationInFrames - 1, Math.max(0, Math.round(a.t * FPS)));
		const arquivo = `${String(i + 1).padStart(2, '0')}.jpg`;
		await renderStill({
			composition,
			serveUrl,
			output: path.join(saida, arquivo),
			frame,
			inputProps,
			scale: res / 1080,
			imageFormat: 'jpeg',
			jpegQuality: 80,
			puppeteerInstance: browser,
			browserExecutable,
			chromiumOptions,
			overwrite: true,
		});
		itens.push({arquivo, t: Number(a.t.toFixed(2)), tipo: a.tipo, texto: a.texto.slice(0, 120)});
		console.log(`${i + 1}/${escolhidos.length}`);
	}
} finally {
	await browser.close({silent: true}).catch(() => {});
}
writeFileSync(path.join(saida, 'manifest.json'), JSON.stringify({projeto: nome, geradoEm: Date.now(), duracao: Number(m.duracaoEditada.toFixed(1)), itens}, null, 1));
console.log(`Prévias salvas em out/previas/${nome}/ (${itens.length} imagens).`);
