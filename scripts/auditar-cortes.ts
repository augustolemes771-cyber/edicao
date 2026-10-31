// Confere cada borda de corte contra as palavras da transcrição: palavra cortada ao meio, sobra de palavra no começo ou
// fim de um trecho, e as palavras dos dois lados de cada emenda (para ler se a frase continua com sentido).
// Uso: npx tsx scripts/auditar-cortes.ts <projeto>
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {montar} from '../src/motor/plano';
import {projetos} from '../src/projetos';

const nome = process.argv[2];
const edit = projetos[nome];
const arq = path.join('public', edit.pasta, edit.video ?? 'video.mp4');
const dur = Number(JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', arq]).toString()).format.duration);
const m = montar(edit, dur);
type P = {text: string; startMs: number; endMs: number};
const pal = ((edit as {transcricao?: P[]}).transcricao ?? []).map((p) => ({t: p.text.trim(), a: p.startMs / 1000, b: p.endMs / 1000}));
const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
let acum = 0;
let problemas = 0;
const linhas: string[] = [];
for (const [i, [a, b]] of m.mantidos.entries()) {
	const dentro = pal.filter((p) => p.b > a + 0.02 && p.a < b - 0.02);
	const cortadas = dentro.filter((p) => (p.a < a - 0.03 && p.b > a + 0.06) || (p.a < b - 0.06 && p.b > b + 0.03));
	const ini = acum;
	acum += b - a;
	const marca = cortadas.length ? '✗' : '·';
	if (cortadas.length) problemas++;
	const comeco = dentro.slice(0, 4).map((p) => p.t).join(' ');
	const fim = dentro.slice(-4).map((p) => p.t).join(' ');
	linhas.push(`${marca} #${i} ${fmt(ini)} [${a.toFixed(2)}–${b.toFixed(2)}] «${comeco} … ${fim}»${cortadas.length ? `  CORTA: ${cortadas.map((p) => `${p.t}(${p.a.toFixed(2)}–${p.b.toFixed(2)})`).join(', ')}` : ''}`);
}
// --detalhe: em cada borda com palavra cortada, as palavras vizinhas com tempos e as pausas medidas (silencios.json) perto.
if (process.argv.includes('--detalhe')) {
	const sil = (edit as {silencios?: [number, number][]}).silencios ?? [];
	for (const [i, [a, b]] of m.mantidos.entries()) {
		for (const [lado, t] of [['início', a], ['fim', b]] as const) {
			const cortada = pal.find((p) => p.a < t - 0.03 && p.b > t + 0.03 && (lado === 'início' ? p.b > t + 0.06 : p.a < t - 0.06));
			if (!cortada) continue;
			const viz = pal.filter((p) => p.b > t - 1.2 && p.a < t + 1.2).map((p) => `${p.t}[${p.a.toFixed(2)}–${p.b.toFixed(2)}]`).join(' ');
			const ps = sil.filter(([x, y]) => y > t - 1.2 && x < t + 1.2).map(([x, y]) => `${x.toFixed(2)}–${y.toFixed(2)}`).join(', ');
			linhas.push(`   #${i} ${lado} em ${t.toFixed(2)}: ${viz}
      pausas: ${ps || 'nenhuma'}`);
		}
	}
}
// --energia: nível da voz (0 = chão de ruído, 1 = fala) nos 60 ms colados em cada borda, do lado que fica no vídeo, mais um
// perfil de ±0,2 s (a cada 40 ms). Voz alta colada na borda = o corte pega som de palavra (o Whisper estica o fim das palavras,
// então a transcrição sozinha não basta).
if (process.argv.includes('--energia')) {
	const TAXA = 16000, J = 0.02;
	const pcmBuf = execFileSync('ffmpeg', ['-hide_banner', '-v', 'error', '-i', arq, '-vn', '-af', 'highpass=f=250,lowpass=f=3500', '-ac', '1', '-ar', String(TAXA), '-f', 's16le', '-'], {maxBuffer: 1 << 30});
	const pcm = new Int16Array(pcmBuf.buffer, pcmBuf.byteOffset, pcmBuf.length >> 1);
	const n = Math.round(TAXA * J);
	const db: number[] = [];
	for (let i = 0; i + n <= pcm.length; i += n) {
		let q = 0;
		for (let j = i; j < i + n; j++) q += pcm[j] * pcm[j];
		db.push(10 * Math.log10(q / n / 32768 ** 2 + 1e-12));
	}
	const ord = [...db].sort((x, y) => x - y);
	const chao = ord[Math.floor(ord.length * 0.1)], fala = ord[Math.floor(ord.length * 0.9)];
	const nivel = (a: number, b: number) => {
		const v = db.slice(Math.max(0, Math.floor(a / J)), Math.max(Math.floor(a / J) + 1, Math.ceil(b / J)));
		return Math.max(0, (Math.max(...v) - chao) / (fala - chao));
	};
	const perfil = (t: number) => Array.from({length: 11}, (_, k) => nivel(t - 0.2 + k * 0.04, t - 0.16 + k * 0.04)).map((v) => (v > 0.6 ? '█' : v > 0.4 ? '▓' : v > 0.25 ? '▒' : '·')).join('');
	// --zoom: nas bordas com voz, perfil fino (10 ms, ±0,3 s) com o nível em décimos e o vale mais fundo de cada lado.
	if (process.argv.includes('--zoom')) {
		for (const [i, [a, b]] of m.mantidos.entries()) {
			for (const [lado, t] of [['início', a], ['fim', b]] as const) {
				const v = lado === 'início' ? nivel(a, a + 0.06) : nivel(b - 0.06, b);
				if (v <= 0.3) continue;
				const pts = Array.from({length: 60}, (_, k) => t - 0.3 + k * 0.01).map((x) => [x, nivel(x, x + 0.01)] as const);
				const txt = pts.map(([x, l], k) => (k === 30 ? '|' : '') + Math.min(9, Math.round(l * 9))).join('');
				const antes = pts.slice(0, 30).reduce((p, c) => (c[1] < p[1] ? c : p));
				const depois = pts.slice(30).reduce((p, c) => (c[1] < p[1] ? c : p));
				linhas.push(`   #${i} ${lado} ${t.toFixed(2)}: ${txt}  vale antes ${antes[0].toFixed(2)} (${antes[1].toFixed(2)}), depois ${depois[0].toFixed(2)} (${depois[1].toFixed(2)})`);
			}
		}
	}
	// --perfil=A,B: nível a cada 10 ms entre A e B (segundos da origem), em décimos, com marca a cada 0,1 s.
	const pf = process.argv.find((x) => x.startsWith('--perfil='));
	if (pf) {
		const [pa, pb] = pf.slice(9).split(',').map(Number);
		let txt = '';
		for (let x = pa; x < pb - 1e-6; x += 0.01) txt += (Math.round((x - pa) * 100) % 10 === 0 ? ` ${x.toFixed(1)}:` : '') + Math.min(9, Math.round(nivel(x, x + 0.01) * 9));
		linhas.push(`Perfil ${pa}–${pb}:${txt}`);
	}
	linhas.push(`Energia nas bordas (chão ${chao.toFixed(1)} dB, fala ${fala.toFixed(1)} dB); perfil de −0,2 a +0,2 s, a borda no meio:`);
	for (const [i, [a, b]] of m.mantidos.entries()) {
		const ini = nivel(a, a + 0.06), fim = nivel(b - 0.06, b);
		const s = (v: number) => (v > 0.45 ? '✗' : v > 0.3 ? '⚠' : '·');
		linhas.push(`${s(ini)}${s(fim)} #${i} início ${a.toFixed(2)} ${ini.toFixed(2)} ${perfil(a)}   fim ${b.toFixed(2)} ${fim.toFixed(2)} ${perfil(b)}`);
	}
}
console.log(`Cortes de ${nome}: ${m.mantidos.length} trechos, ${problemas} com palavra cortada`);
console.log(linhas.join('\n'));
