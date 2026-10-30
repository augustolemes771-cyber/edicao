// Imprime a transcrição em linhas com o tempo de início (sem precisar do vídeo). Uso: node scripts/linhas.mjs <projeto>
import {readFileSync} from 'node:fs';
const t = JSON.parse(readFileSync(`src/projetos/${process.argv[2]}/transcricao.json`, 'utf8'));
let linha = [], ini = 0, ant = 0;
const sai = () => linha.length && console.log(`${ini.toFixed(2).padStart(6)}  ${linha.join('').trim()}`);
for (const p of t) {
	const s = p.startMs / 1000;
	if (linha.length && (s - ant > 0.45 || /[.?!]$/.test(linha.at(-1)) )) { sai(); linha = []; }
	if (!linha.length) ini = s;
	linha.push(p.text); ant = p.endMs / 1000;
}
sai();
