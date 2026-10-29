// Mede as pausas do áudio do vídeo de um projeto e grava src/projetos/<projeto>/silencios.json, usado pelo motor para
// encaixar as bordas dos cortes no silêncio (o tempo de palavra do Whisper erra ~0,3 s).
// Uso: npm run silencios -- <projeto>   (precisa do ffmpeg)
import {spawnSync} from 'node:child_process';
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';

const raiz = path.resolve(import.meta.dirname, '..');
const projeto = process.argv[2];
if (!projeto || !/^[a-z0-9-]+$/.test(projeto)) {
	console.error('Uso: npm run silencios -- <projeto>');
	process.exit(1);
}
const edit = path.join(raiz, 'src/projetos', projeto, 'edit.ts');
const video = /video:\s*'([^']+)'/.exec(existsSync(edit) ? readFileSync(edit, 'utf8') : '')?.[1] ?? 'video.mp4';
const arq = path.join(raiz, 'public/projetos', projeto, video);
if (!existsSync(arq)) {
	console.error(`Vídeo não encontrado: public/projetos/${projeto}/${video}`);
	process.exit(1);
}

// Abaixo de -38 dB por 0,12 s (regra de 22/10 da skill: bordas em silêncio medido). Em áudio com ruído de fundo ou fala
// rápida (vídeo acelerado) isso acha pouquíssimas pausas e as bordas caem no meio da fala: aí afrouxa o limiar aos poucos
// até ter ~1 pausa a cada 3,5 s.
const medir = (noise, d) => {
	const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', arq, '-vn', '-af', `silencedetect=noise=${noise}dB:d=${d}`, '-f', 'null', '-'], {encoding: 'utf8'});
	if (r.error || r.status !== 0) {
		console.error('O ffmpeg falhou: ' + (r.error?.message ?? r.stderr?.slice(-300)));
		process.exit(1);
	}
	const lista = [];
	let inicio = null;
	for (const l of r.stderr.split('\n')) {
		const a = /silence_start: (-?[\d.]+)/.exec(l);
		if (a) inicio = Math.max(0, Number(a[1]));
		const b = /silence_end: ([\d.]+)/.exec(l);
		if (b && inicio !== null) {
			lista.push([Number(inicio.toFixed(3)), Number(Number(b[1]).toFixed(3))]);
			inicio = null;
		}
	}
	const h = /Duration: (\d+):(\d+):([\d.]+)/.exec(r.stderr);
	const dur = h ? Number(h[1]) * 3600 + Number(h[2]) * 60 + Number(h[3]) : 0;
	return {lista, dur};
};

let silencios = [];
let usado = '';
for (const [noise, d] of [[-38, 0.12], [-36, 0.08], [-34, 0.06], [-32, 0.05], [-30, 0.05]]) {
	const {lista, dur} = medir(noise, d);
	silencios = lista;
	usado = `${noise} dB / ${d} s`;
	if (!dur || lista.length >= dur / 3.5) break;
}
writeFileSync(path.join(raiz, 'src/projetos', projeto, 'silencios.json'), JSON.stringify(silencios) + '\n');
console.log(`${silencios.length} pausas (limiar ${usado}) gravadas em src/projetos/${projeto}/silencios.json`);
