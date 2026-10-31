// Mede as pausas pela energia da voz (banda 250–3500 Hz, janelas de 50 ms, limiar a 35% entre o chão e a fala) e grava
// src/projetos/<projeto>/silencios.json. Serve para áudio com vento/ruído ou fala baixa, onde o silencedetect engole palavras
// ou não acha pausa (aprendizado de entrevista, 28/10 e 30/10). Queda que cobre parte de uma palavra não conta como pausa.
// Uso: [FRACAO=0.2] node scripts/pausas-energia.mjs <projeto> [arquivo]   (arquivo padrão: public/projetos/<projeto>/video.mp4)
import {spawnSync} from 'node:child_process';
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';

const [projeto, arquivoArg] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!projeto) {
	console.error('Uso: node scripts/pausas-energia.mjs <projeto> [arquivo]');
	process.exit(1);
}
const raiz = path.resolve(import.meta.dirname, '..');
const arquivo = arquivoArg ?? path.join(raiz, 'public', 'projetos', projeto, 'video.mp4');
const pasta = path.join(raiz, 'src', 'projetos', projeto);
if (!existsSync(arquivo)) {
	console.error(`Não achei ${arquivo}`);
	process.exit(1);
}

const TAXA = 16000, JANELA = 0.05, MINIMO = 0.12;
const r = spawnSync('ffmpeg', ['-hide_banner', '-v', 'error', '-i', arquivo, '-vn', '-af', 'highpass=f=250,lowpass=f=3500', '-ac', '1', '-ar', String(TAXA), '-f', 's16le', '-'], {maxBuffer: 1 << 30});
if (r.status !== 0) {
	console.error(r.stderr.toString());
	process.exit(1);
}
const pcm = new Int16Array(r.stdout.buffer, r.stdout.byteOffset, r.stdout.length >> 1);
const n = Math.round(TAXA * JANELA);
const db = [];
for (let i = 0; i + n <= pcm.length; i += n) {
	let s = 0;
	for (let j = i; j < i + n; j++) s += pcm[j] * pcm[j];
	db.push(10 * Math.log10(s / n / 32768 ** 2 + 1e-12));
}
const ordenado = [...db].sort((a, b) => a - b);
const chao = ordenado[Math.floor(ordenado.length * 0.1)];
const fala = ordenado[Math.floor(ordenado.length * 0.9)];
// FRACAO=0.2 para áudio de evento com ruído de fundo alto (0,35 marcava como pausa a queda de volume dentro das palavras).
const FRACAO = Number(process.env.FRACAO ?? 0.35);
const limiar = chao + FRACAO * (fala - chao);

const arqTranscricao = path.join(pasta, 'transcricao.json');
const palavras = existsSync(arqTranscricao) ? JSON.parse(readFileSync(arqTranscricao, 'utf8')) : [];
const quedas = [];
let ini = -1;
for (let k = 0; k <= db.length; k++) {
	const baixo = k < db.length && db[k] < limiar;
	if (baixo && ini < 0) ini = k;
	if (!baixo && ini >= 0) {
		if ((k - ini) * JANELA >= MINIMO) quedas.push([ini * JANELA, k * JANELA]);
		ini = -1;
	}
}

// Queda que se sobrepõe a uma palavra (mais de 0,15 s ou de metade dela) é volume baixo dentro da fala, não pausa: sai,
// mesmo longa, porque a edição corta as pausas de dentro dos trechos e engoliria a palavra dita baixo.
const pausas = quedas
	.filter(([a, z]) => !palavras.some((w) => Math.min(z, w.endMs / 1000) - Math.max(a, w.startMs / 1000) > Math.min(0.15, 0.5 * (w.endMs - w.startMs) / 1000)))
	.map(([a, z]) => [+a.toFixed(3), +z.toFixed(3)]);
writeFileSync(path.join(pasta, 'silencios.json'), JSON.stringify(pausas));
console.log(`${projeto}: ${pausas.length} pausas (chão ${chao.toFixed(1)} dB, fala ${fala.toFixed(1)} dB, limiar ${limiar.toFixed(1)} dB)`);
