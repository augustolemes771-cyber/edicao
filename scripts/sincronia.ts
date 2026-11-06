// Confere (e corrige) a sincronia entre a fala e os efeitos/legenda, medindo o áudio do render final.
// O tempo de palavra do Whisper comum erra até ~1 s em áudio comprimido (WhatsApp, celular); aqui o render é transcrito com
// alinhamento DTW (tempo por token, bem mais fiel no relativo; o atraso fixo dele é medido pela mediana e descontado) e cada
// palavra do motor é comparada.
// Com --aplicar, move as palavras da transcricao.json pelo desvio medido (mediana dos vizinhos), sem tirá-las do trecho em que
// estavam: com cortes em números fixos o áudio não muda, só os efeitos e a legenda. Depois: qualidade.ts e render de novo.
// Uso: npx tsx scripts/sincronia.ts <projeto> [--aplicar] [--limite 0.6] [--video out/x.mp4]
import {execFileSync} from 'node:child_process';
import {copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {montar} from '../src/motor/plano';
import {projetos} from '../src/projetos';

const args = process.argv.slice(2);
const opc = (n: string) => (args.includes(n) ? args[args.indexOf(n) + 1] : null);
const p = args.find((a, i) => !a.startsWith('--') && !['--limite', '--video'].includes(args[i - 1]));
if (!p || !projetos[p]) {
	console.error('Uso: npx tsx scripts/sincronia.ts <projeto> [--aplicar] [--limite 0.6] [--video out/x.mp4]');
	process.exit(1);
}
const aplicar = args.includes('--aplicar');
const limite = Number(opc('--limite') ?? 0.6);
const e = projetos[p];
const fonte = `public/${e.pasta}/${e.video ?? 'video.mp4'}`;
const dur = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', fonte]).toString());
const m: any = montar(e, dur);
const norm = (s: string) => s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');

// 1. Transcreve o render com DTW.
const render = opc('--video') ?? `out/${p}-final.mp4`;
if (!existsSync(render)) throw new Error(`falta ${render} (renderize antes ou passe --video)`);
const tmp = mkdtempSync(path.join(os.tmpdir(), 'sincronia-'));
const home = os.homedir();
const cuda = path.join(home, '.cache/edicao/whisper-cuda-1.7.6/build/bin/whisper-cli.exe');
const cpu = path.join(home, '.cache/edicao/whisper.cpp-1.7/Release/whisper-cli.exe');
const exe = existsSync(cuda) ? cuda : existsSync(cpu) ? cpu : 'whisper-cli';
const modelo = path.join(home, '.cache/edicao/whisper.cpp/ggml-large-v3-turbo.bin');
const wav = path.join(tmp, 'a.wav');
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', render, '-vn', '-ac', '1', '-ar', '16000', wav]);
execFileSync(exe, ['-m', modelo, '-l', 'pt', '-dtw', 'large.v3.turbo', '-oj', '-ojf', '-of', path.join(tmp, 'a'), '-f', wav, '-np'], {stdio: 'ignore'});
const bruto = JSON.parse(readFileSync(path.join(tmp, 'a.json'), 'utf8'));
rmSync(tmp, {recursive: true, force: true});
// Tokens → palavras (token que começa com espaço abre palavra nova); tempo da palavra = DTW do 1º token.
const W: {t: number; w: string}[] = [];
for (const s of bruto.transcription)
	for (const tk of s.tokens ?? []) {
		const txt: string = tk.text;
		if (!txt.trim() || txt.startsWith('[')) continue;
		const t = tk.t_dtw > 0 ? tk.t_dtw / 100 : tk.offsets.from / 1000;
		if (txt.startsWith(' ') || !W.length) W.push({t, w: norm(txt)});
		else W[W.length - 1].w += norm(txt);
	}
const falado = W.filter((x) => x.w);

// 2. Cada palavra da transcrição no tempo editado (mesma regra do motor: entra no trecho que cobre a maior parte dela).
const arq = `src/projetos/${p}/transcricao.json`;
const T = JSON.parse(readFileSync(arq, 'utf8'));
const inicios: number[] = [];
m.mantidos.reduce((acc: number, [a, b]: number[]) => (inicios.push(acc), acc + (b - a)), 0);
const lista: {k: number; t: number}[] = [];
const vezes = new Map<number, number>();
T.forEach((c: any, k: number) => {
	if (!c.text.trim()) return;
	const ini = c.startMs / 1000;
	const fo = c.endMs / 1000;
	const du = fo - ini;
	m.mantidos.forEach((tr: number[], i: number) => {
		const sobra = Math.min(fo, tr[1]) - Math.max(ini, tr[0]);
		if (du < 0.01 ? ini < tr[0] || ini > tr[1] : sobra / du < 0.5) return;
		lista.push({k, t: inicios[i] + Math.max(ini, tr[0]) - tr[0]});
		vezes.set(k, (vezes.get(k) ?? 0) + 1);
	});
});
lista.sort((a, b) => a.t - b.t);

// 3. Casa em sequência e mede o desvio.
let j = 0;
const desvio = new Map<number, number>();
for (const x of lista) {
	if (vezes.get(x.k)! > 1) continue; // trecho reaproveitado (gancho repetido): não mexe
	const w = norm(T[x.k].text);
	if (w.length < 3) continue;
	for (let k = j; k < Math.min(j + 6, falado.length); k++)
		if (falado[k].w === w) {
			desvio.set(x.k, falado[k].t - x.t);
			j = k + 1;
			break;
		}
}
// O DTW tem um atraso fixo (~0,1 a 0,5 s, varia com o áudio): desconta a mediana do vídeo inteiro e só aponta o que foge dela.
const ordenados = [...desvio.values()].sort((a, b) => a - b);
const atraso = ordenados.length ? ordenados[Math.floor(ordenados.length / 2)] : 0;
for (const [k, v] of desvio) desvio.set(k, v - atraso);
const ruins = lista.filter((x) => desvio.has(x.k) && Math.abs(desvio.get(x.k)!) > limite);
console.log(`${p}: ${desvio.size} palavras comparadas com o áudio do render (atraso fixo do DTW descontado: ${atraso.toFixed(2)} s); ${ruins.length} fora mais de ${limite} s.`);
for (const x of ruins.slice(0, 50))
	console.log(`  ${x.t.toFixed(2)} s  ${T[x.k].text.trim()}: a fala está ${desvio.get(x.k)! > 0 ? 'depois' : 'antes'} (${desvio.get(x.k)!.toFixed(2)} s)`);

// 4. Corrige.
if (aplicar && ruins.length) {
	const idx = [...desvio.keys()].sort((a, b) => a - b);
	const suave = new Map<number, number>();
	idx.forEach((k, i) => {
		const v = [idx[i - 1], k, idx[i + 1]].filter((z) => z !== undefined).map((z) => desvio.get(z)!).sort((a, b) => a - b);
		suave.set(k, v[Math.floor(v.length / 2)]);
	});
	const trechoDe = (t: number) => m.mantidos.find(([a, b]: number[]) => t >= a - 0.01 && t <= b + 0.01);
	copyFileSync(arq, arq + '.antes-sincronia');
	let d = 0;
	let mov = 0;
	for (const x of lista) {
		if (vezes.get(x.k) !== 1) continue;
		if (suave.has(x.k)) d = suave.get(x.k)!;
		if (Math.abs(d) < 0.12) continue;
		const c = T[x.k];
		const tr = trechoDe(c.startMs / 1000);
		if (!tr) continue;
		const len = c.endMs - c.startMs;
		const ns = Math.min(Math.max(c.startMs / 1000 + d, tr[0] + 0.02), tr[1] - 0.06);
		c.startMs = Math.round(ns * 1000);
		c.endMs = Math.min(Math.round(tr[1] * 1000), c.startMs + Math.max(len, 60));
		mov++;
	}
	for (let i = 1; i < T.length; i++) {
		const a = T[i - 1];
		const b = T[i];
		if (trechoDe(a.startMs / 1000) === trechoDe(b.startMs / 1000) && b.startMs < a.startMs + 10) b.startMs = a.startMs + 10;
		if (a.endMs > b.startMs && b.startMs > a.startMs) a.endMs = b.startMs;
		if (b.endMs <= b.startMs) b.endMs = b.startMs + 40;
	}
	writeFileSync(arq, JSON.stringify(T, null, 1) + '\n');
	console.log(`${mov} palavras movidas (cópia em ${arq}.antes-sincronia). Rode a qualidade.ts e renderize de novo.`);
}
