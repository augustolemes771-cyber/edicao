// Prepara um projeto de uma vez: resume a mídia, transcreve (se ainda não tem) e gera o roteiro.
// Uso: npm run preparar -- <projeto>
// Troca ~10 comandos soltos (ls, ffprobe, transcrever, roteiro) por um só, com saída curta.
import {execFileSync, spawnSync} from 'node:child_process';
import {existsSync, readdirSync, readFileSync} from 'node:fs';
import path from 'node:path';

const nome = process.argv[2];
const raiz = path.resolve(import.meta.dirname, '..');
if (!nome || !existsSync(path.join(raiz, 'src/projetos', nome))) {
	console.error('Uso: npm run preparar -- <projeto> (crie antes com npm run novo -- <nome> --vertical)');
	process.exit(1);
}
const midia = path.join(raiz, 'public/projetos', nome);
const videos = existsSync(midia) ? readdirSync(midia).filter((f) => /\.(mp4|mov|m4v|mkv|webm)$/i.test(f)) : [];
console.log(`Projeto ${nome}: ${videos.length} vídeo(s) em public/projetos/${nome}/`);
for (const f of videos) {
	try {
		const j = JSON.parse(
			execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate:stream_side_data=rotation:format=duration', '-of', 'json', path.join(midia, f)], {encoding: 'utf8'}),
		);
		const s = j.streams?.[0] ?? {};
		console.log(`- ${f}: ${s.width}x${s.height}, ${s.r_frame_rate}, ${Number(j.format?.duration ?? 0).toFixed(1)} s${s.side_data_list?.[0]?.rotation ? `, rotação ${s.side_data_list[0].rotation}` : ''}`);
	} catch {
		console.log(`- ${f}: não consegui ler (ffprobe)`);
	}
}
if (!videos.includes('video.mp4') && videos.length) console.log(`Aviso: o vídeo principal se chama video.mp4 no edit.ts; ajuste "video" para um destes nomes ou renomeie.`);

const arqTranscricao = path.join(raiz, 'src/projetos', nome, 'transcricao.json');
const vazia = !existsSync(arqTranscricao) || readFileSync(arqTranscricao, 'utf8').trim().length < 5;
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const rodar = (script) => {
	const r = spawnSync(npm, ['run', script, '--', nome], {cwd: raiz, encoding: 'utf8', shell: process.platform === 'win32'});
	const fim = `${r.stdout ?? ''}${r.stderr ?? ''}`.trim().split('\n').slice(-3).join('\n');
	console.log(`[${script}] ${r.status === 0 ? 'ok' : 'FALHOU'}\n${fim}`);
	return r.status === 0;
};
if (vazia) {
	if (!rodar('transcrever')) process.exit(1);
} else console.log('[transcrever] já existe, pulei');
if (!rodar('roteiro')) process.exit(1);
// Pausas do áudio para os cortes caírem no silêncio (só para projetos que usam silencios.json).
if (existsSync(path.join(raiz, 'src/projetos', nome, 'silencios.json'))) rodar('silencios');
console.log(`\nPronto. Leia docs/${nome}/transcript-lines.txt e o guia docs/referencias/edit-ts-guia.md; depois escreva src/projetos/${nome}/edit.ts.`);
