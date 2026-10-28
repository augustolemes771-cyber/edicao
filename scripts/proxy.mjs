// Cópias leves (720p) dos vídeos de um projeto, só para assistir no Studio sem travar: public/projetos/<projeto>/_leve/<nome>.mp4.
// O render (prévia e final) continua usando o original. Pula as que já estão em dia. NVENC quando houver, senão x264 rápido.
// Uso: node scripts/proxy.mjs <projeto>
import {spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, readdirSync, renameSync, statSync} from 'node:fs';
import path from 'node:path';

const raiz = path.resolve(import.meta.dirname, '..');
const projeto = process.argv[2];
if (!projeto || !/^[a-z0-9-]+$/.test(projeto)) {
	console.error('Uso: node scripts/proxy.mjs <projeto>');
	process.exit(1);
}
const pasta = path.join(raiz, 'public', 'projetos', projeto);
if (!existsSync(pasta)) {
	console.log('Projeto sem mídia em public/projetos: nada a fazer.');
	process.exit(0);
}
const leve = path.join(pasta, '_leve');
mkdirSync(leve, {recursive: true});
const nvenc = !process.env.SEM_GPU && spawnSync('nvidia-smi', ['-L'], {windowsHide: true}).status === 0 && (spawnSync('ffmpeg', ['-hide_banner', '-encoders'], {encoding: 'utf8'}).stdout ?? '').includes('h264_nvenc');
const videos = readdirSync(pasta).filter((f) => /\.(mp4|mov|m4v|webm)$/i.test(f) && !f.startsWith('.'));
let feitos = 0;
for (const v of videos) {
	const orig = path.join(pasta, v);
	const destino = path.join(leve, v.replace(/\.[^.]+$/, '.mp4'));
	if (existsSync(destino) && statSync(destino).mtimeMs >= statSync(orig).mtimeMs) continue;
	const temp = destino.replace(/\.mp4$/, '.parte.mp4');
	// Lado menor em 720, quadro-chave a cada 0,5 s (avançar e voltar no Studio fica instantâneo).
	const filtro = "scale='if(gt(iw,ih),-2,720)':'if(gt(iw,ih),720,-2)'";
	const comum = ['-hide_banner', '-loglevel', 'error', '-stats', '-y', '-i', orig, '-vf', filtro, '-g', '15', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart'];
	console.log(`Cópia leve: ${v}${nvenc ? ' (placa NVIDIA)' : ''}...`);
	let r = nvenc ? spawnSync('ffmpeg', [...comum, '-c:v', 'h264_nvenc', '-preset', 'p4', '-cq', '26', temp], {stdio: 'inherit'}) : {status: 1};
	if (r.status !== 0) r = spawnSync('ffmpeg', [...comum, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '26', temp], {stdio: 'inherit'});
	if (r.status !== 0) {
		console.log(`Não consegui fazer a cópia leve de ${v} (o Studio usa o original).`);
		continue;
	}
	renameSync(temp, destino);
	feitos++;
}
console.log(feitos ? `${feitos} cópia(s) leve(s) pronta(s) para o Studio.` : 'Cópias leves já estavam em dia.');
