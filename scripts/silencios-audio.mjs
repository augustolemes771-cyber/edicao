// Mede as pausas direto de um áudio (sem precisar do video.mp4) e grava src/projetos/<projeto>/silencios.json.
// Uso: node scripts/silencios-audio.mjs <projeto> <audio> [limiar em dB, ex.: -40]
import {spawnSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
const [projeto, audio] = process.argv.slice(2);
for (const noise of (process.argv[4] ? [+process.argv[4]] : [-38, -35, -32, -30])) {
	const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', audio, '-af', `silencedetect=noise=${noise}dB:d=0.12`, '-f', 'null', '-'], {encoding: 'utf8'});
	const ini = [...r.stderr.matchAll(/silence_start: ([\d.]+)/g)].map((m) => +m[1]);
	const fim = [...r.stderr.matchAll(/silence_end: ([\d.]+)/g)].map((m) => +m[1]);
	const pares = ini.map((s, i) => [+s.toFixed(3), +(fim[i] ?? s).toFixed(3)]).filter(([a, b]) => b > a);
	const dur = +(/Duration: (\d+):(\d+):([\d.]+)/.exec(r.stderr) ?? []).slice(1).reduce((a, x) => a * 60 + +x, 0);
	if (pares.length >= dur / 3.5 || noise === -30 || process.argv[4]) {
		writeFileSync(`src/projetos/${projeto}/silencios.json`, JSON.stringify(pares));
		console.log(`${projeto}: ${pares.length} pausas (${noise} dB)`);
		break;
	}
}
