// Corte de uma gravação longa para um projeto próprio: converte só o trecho [inicio, fim] do arquivo de origem (HDR do iPhone →
// SDR com o mesmo tratamento do preparar-video, 30 qps, quadro-chave a cada 0,5 s) e copia a transcrição do trecho com os
// tempos deslocados. Evita converter a gravação inteira quando só uns segundos viram vídeo.
// Uso: node scripts/recortar.mjs <projeto> <origem.MOV> <transcricao-origem.json> <inicio> <fim>
//   Saídas: public/projetos/<projeto>/video.mp4 e src/projetos/<projeto>/transcricao.json (tempo 0 = <inicio> da origem).
import {spawnSync} from 'node:child_process';
import {existsSync, readFileSync, renameSync, writeFileSync} from 'node:fs';
import path from 'node:path';

const raiz = path.resolve(import.meta.dirname, '..');
const [projeto, origem, transOrigem, iniArg, fimArg] = process.argv.slice(2);
const ini = Number(iniArg);
const fim = Number(fimArg);
if (!projeto || !origem || !transOrigem || !(fim > ini)) {
	console.error('Uso: node scripts/recortar.mjs <projeto> <origem.MOV> <transcricao-origem.json> <inicio> <fim>');
	process.exit(1);
}
const pastaMidia = path.join(raiz, 'public/projetos', projeto);
const pastaProjeto = path.join(raiz, 'src/projetos', projeto);
for (const p of [origem, transOrigem, pastaMidia, pastaProjeto]) {
	if (!existsSync(p)) {
		console.error(`Não achei ${p}`);
		process.exit(1);
	}
}

// Transcrição do trecho no formato de lista ({text, startMs, endMs}), o mesmo do Whisper: o motor e os scripts de auditoria
// (pausas-energia, auditar-cortes, sincronia) leem este. A origem pode ser do Scribe ({words}) ou já uma lista.
const t = JSON.parse(readFileSync(transOrigem, 'utf8'));
const lista = Array.isArray(t)
	? t
	: (t.words ?? []).filter((w) => w.type === 'word').map((w) => ({text: ` ${w.text}`, startMs: w.start * 1000, endMs: w.end * 1000, timestampMs: null, confidence: Math.exp(w.logprob ?? 0)}));
const palavras = lista
	.filter((w) => w.startMs >= ini * 1000 - 10 && w.endMs <= fim * 1000 + 10)
	.map((w) => ({...w, startMs: Math.round(Math.max(0, w.startMs - ini * 1000)), endMs: Math.round(Math.max(0, w.endMs - ini * 1000))}));
writeFileSync(path.join(pastaProjeto, 'transcricao.json'), JSON.stringify(palavras, null, 1));
console.log(`Transcrição: ${palavras.length} palavras.`);
if (process.env.SO_TRANSCRICAO) process.exit(0);

const sonda = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=color_transfer', '-of', 'csv=p=0', origem], {encoding: 'utf8'});
const hdr = /arib-std-b67|smpte2084/.test(sonda.stdout ?? '');
const filtrosV = (gpu) =>
	`${hdr ? (gpu ? 'libplacebo=tonemapping=bt.2390:colorspace=bt709:color_primaries=bt709:color_trc=bt709:range=tv:format=yuv420p,' : 'zscale=t=linear:npl=203,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,') : ''}fps=30,format=yuv420p,setsar=1`;
const temp = path.join(pastaMidia, '.video-preparando.mp4');
const args = (gpu, codec) => [
	'-hide_banner', '-loglevel', 'error', '-stats', '-y',
	'-ss', String(ini), '-to', String(fim), '-i', origem,
	'-vf', filtrosV(gpu), '-af', 'aresample=48000,aformat=channel_layouts=stereo',
	...codec,
	'-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
	'-c:a', 'aac', '-b:a', '320k', '-movflags', '+faststart', temp,
];
const nvenc = !process.env.SEM_GPU && (spawnSync('ffmpeg', ['-hide_banner', '-encoders'], {encoding: 'utf8'}).stdout ?? '').includes('h264_nvenc');
let r = {status: 1};
if (nvenc) r = spawnSync('ffmpeg', args(true, ['-c:v', 'h264_nvenc', '-preset', 'p6', '-tune', 'hq', '-rc', 'vbr', '-cq', '16', '-b:v', '0', '-profile:v', 'high', '-g', '15', '-bf', '0']), {stdio: 'inherit'});
if (r.status !== 0) r = spawnSync('ffmpeg', args(false, ['-c:v', 'libx264', '-preset', 'medium', '-crf', '15', '-g', '15', '-bf', '0']), {stdio: 'inherit'});
if (r.status !== 0) {
	console.error('O ffmpeg falhou.');
	process.exit(1);
}
renameSync(temp, path.join(pastaMidia, 'video.mp4'));
console.log(`Pronto: public/projetos/${projeto}/video.mp4 (${(fim - ini).toFixed(1)} s, de ${ini} a ${fim} da origem).`);
