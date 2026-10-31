// Lista as cenas e o tempo (vídeo editado) de cada uma, com o quadro do meio para um still de conferência.
// Uso: npx tsx scripts/cenas.ts <projeto>
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {montar} from '../src/motor/plano';
import {projetos} from '../src/projetos';

const nome = process.argv[2];
const edit = projetos[nome];
const arq = path.join('public', edit.pasta, edit.video ?? 'video.mp4');
const dur = Number(JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', arq]).toString()).format.duration);
const m = montar(edit, dur);
for (const c of m.cenas) {
	const meio = Math.round(((c.de + c.ate) / 2) * 30);
	console.log(`${c.de.toFixed(2).padStart(6)}–${c.ate.toFixed(2).padStart(6)}  quadro ${String(meio).padStart(5)}  ${c.tipo === 'peca' ? `peca:${c.nome}` : c.tipo}`);
}
console.log(`duração editada ${m.duracaoEditada.toFixed(1)} s`);
