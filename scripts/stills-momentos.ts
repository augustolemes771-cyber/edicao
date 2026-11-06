// Folha de conferência por segundos: um still leve de cada instante pedido, empacotando uma vez só.
// Uso: npx tsx scripts/stills-momentos.ts <projeto> <seg,seg,...> [--escala 0.3]
// Salva out/conferir/<projeto>-momentos/<nn>.jpg e a folha out/conferir/<projeto>-momentos.jpg (6 por linha).
import {execFileSync} from 'node:child_process';
import {mkdirSync, rmSync} from 'node:fs';
import path from 'node:path';
// @ts-expect-error módulo .mjs sem tipos
import {empacotarLeve} from './publico.mjs';
import {renderStill, selectComposition} from '@remotion/renderer';

const args = process.argv.slice(2);
const nome = args[0];
const segundos = (args[1] ?? '').split(',').map(Number).filter((n) => Number.isFinite(n));
const escala = Number(args[args.indexOf('--escala') + 1]) || 0.3;
const pasta = path.join('out', 'conferir', `${nome}-momentos`);
rmSync(pasta, {recursive: true, force: true});
mkdirSync(pasta, {recursive: true});
const {serveUrl} = await empacotarLeve(path.resolve('.'), nome);
const composition = await selectComposition({serveUrl, id: nome});
for (const [i, s] of segundos.entries()) {
	const frame = Math.min(composition.durationInFrames - 1, Math.round(s * composition.fps));
	await renderStill({serveUrl, composition, frame, output: path.join(pasta, `${String(i).padStart(2, '0')}.jpg`), scale: escala, imageFormat: 'jpeg'});
	console.log(`${String(i).padStart(2, '0')}  ${s.toFixed(1)} s`);
}
const colunas = 6;
execFileSync('ffmpeg', ['-v', 'error', '-y', '-start_number', '0', '-i', path.join(pasta, '%02d.jpg'), '-vf', `tile=${colunas}x${Math.ceil(segundos.length / colunas)}:padding=6:color=black`, '-frames:v', '1', path.join('out', 'conferir', `${nome}-momentos.jpg`)]);
rmSync(serveUrl, {recursive: true, force: true});
