// Prepara o vídeo de um projeto a partir dos arquivos do celular, sem perder qualidade: junta os clipes na ordem dada,
// mantém a resolução original (4K do iPhone continua 4K: o zoom da edição precisa dessa margem), converte HDR (HLG/PQ
// do iPhone) para SDR com mapeamento de tons de verdade (zscale + tonemap; sem isso a cor sai lavada e acinzentada),
// fixa 30 qps e grava H.264 quase sem perda. Saída: public/projetos/<projeto>/video.mp4.
// Uso: npm run preparar-video -- <projeto> <arquivo1> [arquivo2 ...]   (arquivos dentro de public/projetos/<projeto>/)
import {spawnSync} from 'node:child_process';
import {existsSync, renameSync} from 'node:fs';
import path from 'node:path';

const raiz = path.resolve(import.meta.dirname, '..');
const [projeto, ...arquivos] = process.argv.slice(2);
if (!projeto || !/^[a-z0-9-]+$/.test(projeto) || !arquivos.length) {
	console.error('Uso: npm run preparar-video -- <projeto> <arquivo1> [arquivo2 ...]');
	process.exit(1);
}
const pasta = path.join(raiz, 'public/projetos', projeto);
const entradas = arquivos.map((a) => path.join(pasta, path.basename(a)));
for (const e of entradas) {
	if (!existsSync(e)) {
		console.error(`Não achei ${path.relative(raiz, e)}`);
		process.exit(1);
	}
}
const sonda = (arq) => {
	const r = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,color_transfer:stream_side_data=rotation', '-of', 'json', arq], {encoding: 'utf8'});
	const s = JSON.parse(r.stdout || '{}').streams?.[0] ?? {};
	const girado = Math.abs(Number(s.side_data_list?.[0]?.rotation ?? 0)) % 180 === 90;
	return {largura: girado ? s.height : s.width, altura: girado ? s.width : s.height, hdr: ['arib-std-b67', 'smpte2084'].includes(s.color_transfer)};
};
const infos = entradas.map(sonda);
// Todos no tamanho do maior clipe (o normal é serem iguais), em números pares.
const L = Math.max(...infos.map((i) => i.largura)) & ~1;
const A = Math.max(...infos.map((i) => i.altura)) & ~1;
const temZscale = (spawnSync('ffmpeg', ['-hide_banner', '-filters'], {encoding: 'utf8'}).stdout ?? '').includes(' zscale ');
const hdrParaSdr = temZscale
	? 'zscale=t=linear:npl=203,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,'
	: 'colorspace=all=bt709:iall=bt2020:fast=1,';
if (infos.some((i) => i.hdr) && !temZscale) console.warn('Aviso: este ffmpeg não tem zscale; a conversão de HDR fica aproximada (cor pode sair menos fiel).');

const filtros = infos
	.map((info, i) => `[${i}:v]${info.hdr ? hdrParaSdr : ''}scale=${L}:${A}:force_original_aspect_ratio=decrease:flags=lanczos,pad=${L}:${A}:(ow-iw)/2:(oh-ih)/2,fps=30,format=yuv420p,setsar=1[v${i}];[${i}:a]aresample=48000,aformat=channel_layouts=stereo[a${i}]`)
	.join(';');
const juntar = infos.map((_, i) => `[v${i}][a${i}]`).join('') + `concat=n=${infos.length}:v=1:a=1[v][a]`;
const saida = path.join(pasta, 'video.mp4');
const temp = path.join(pasta, '.video-preparando.mp4');
console.log(`Preparando ${infos.length} clipe(s) em ${L}x${A}, 30 qps${infos.some((i) => i.hdr) ? ', HDR → SDR' : ''}...`);
const r = spawnSync(
	'ffmpeg',
	[
		'-hide_banner', '-loglevel', 'error', '-stats', '-y',
		...entradas.flatMap((e) => ['-i', e]),
		'-filter_complex', `${filtros};${juntar}`,
		'-map', '[v]', '-map', '[a]',
		'-c:v', 'libx264', '-preset', 'slow', '-crf', '14',
		'-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
		'-c:a', 'aac', '-b:a', '320k', '-movflags', '+faststart', temp,
	],
	{stdio: 'inherit'},
);
if (r.status !== 0) {
	console.error('O ffmpeg falhou ao preparar o vídeo.');
	process.exit(1);
}
renameSync(temp, saida);
console.log(`Pronto: public/projetos/${projeto}/video.mp4 (${L}x${A}). Depois rode: npm run transcrever -- ${projeto}`);
