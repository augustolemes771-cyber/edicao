// Folha de conferência: um still leve do meio de cada cena (ou só das peças próprias) de um projeto, empacotando uma vez só
// e renderizando em sequência (rápido e sem travar a máquina, ao contrário de vários `remotion still` ao mesmo tempo).
// Salva out/conferir/<projeto>/<nn>-<tipo>.jpg e junta tudo em out/conferir/<projeto>.jpg (4 por linha).
// Uso: npx tsx scripts/stills-cenas.ts <projeto> [--todas] [--escala 0.3]
import {execFileSync} from 'node:child_process';
import {mkdirSync, rmSync} from 'node:fs';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {montar} from '../src/motor/plano';
import {projetos} from '../src/projetos';

const args = process.argv.slice(2);
const nome = args[0];
const todas = args.includes('--todas');
const escala = Number(args[args.indexOf('--escala') + 1]) || 0.3;
// --fim: último quadro de cada cena (confere se a animação concluiu antes de a cena sair).
const fim = args.includes('--fim');
const edit = projetos[nome];
const arq = path.join('public', edit.pasta, edit.video ?? 'video.mp4');
const dur = Number(JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', arq]).toString()).format.duration);
const m = montar(edit, dur);
const alvo = m.cenas.filter((c) => todas || c.tipo === 'peca' || ['numero3d', 'frase', 'aviao', 'cards3d', 'medo3d', 'celular3d', 'presoClt', 'gradeAntesDepois'].includes(c.tipo));

const pasta = path.join('out', 'conferir', fim ? `${nome}-fim` : nome);
rmSync(pasta, {recursive: true, force: true});
mkdirSync(pasta, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id: nome});
const fotos: string[] = [];
for (const [i, c] of alvo.entries()) {
	// 70% da cena: a animação já entrou e ainda não saiu.
	const frame = Math.min(composition.durationInFrames - 1, fim ? Math.floor(c.ate * composition.fps) - 2 : Math.round((c.de + (c.ate - c.de) * 0.7) * composition.fps));
	const rotulo = c.tipo === 'peca' ? c.nome : c.tipo;
	const saida = path.join(pasta, `${String(i).padStart(2, '0')}.jpg`);
	await renderStill({serveUrl, composition, frame, output: saida, scale: escala, imageFormat: 'jpeg'});
	fotos.push(saida);
	console.log(`${String(i).padStart(2, '0')} ${rotulo}  (${c.de.toFixed(1)} s, quadro ${frame})`);
}
// Folha: 4 por linha, na ordem do console (o número no nome de cada still).
if (fotos.length) {
	const linhas = Math.ceil(fotos.length / 4);
	execFileSync('ffmpeg', ['-v', 'error', '-y', '-start_number', '0', '-i', path.join(pasta, '%02d.jpg'), '-vf', `tile=4x${linhas}:padding=6:color=black`, '-frames:v', '1', path.join('out', 'conferir', `${fim ? `${nome}-fim` : nome}.jpg`)]);
	console.log(`folha: out/conferir/${nome}.jpg`);
}
// O pacote copia a public inteira (GBs): apagar no fim para não encher o disco.
rmSync(serveUrl, {recursive: true, force: true});
