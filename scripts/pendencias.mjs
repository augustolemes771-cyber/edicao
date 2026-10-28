// Pendências do vídeo (pedidos do usuário que o editor aplica antes do próximo render).
// Uso: node scripts/pendencias.mjs <projeto>                 lista as abertas
//      node scripts/pendencias.mjs <projeto> feito <id> ...  marca como aplicadas (depois de mudar o edit.ts)
//      node scripts/pendencias.mjs <projeto> add "texto" [--t 12.5]   anota uma pendência (usado pelo assistente)
import path from 'node:path';
import {criarPendencias, textoPendencias} from '../painel/pendencias.mjs';

const raiz = path.resolve(import.meta.dirname, '..');
const pend = criarPendencias(path.join(raiz, '.painel'));
const [projeto, acao, ...resto] = process.argv.slice(2);
if (!projeto || !/^[a-z0-9-]+$/.test(projeto)) {
	console.error('Uso: node scripts/pendencias.mjs <projeto> [feito <id>... | add "texto" [--t segundos]]');
	process.exit(1);
}
if (acao === 'feito') {
	const n = pend.marcar(projeto, resto);
	console.log(`${n} pendência(s) marcada(s) como aplicada(s). Abertas: ${pend.abertas(projeto).length}.`);
} else if (acao === 'add') {
	const i = resto.indexOf('--t');
	const t = i >= 0 ? Number(resto[i + 1]) : undefined;
	const texto = resto.filter((_, k) => k !== i && k !== i + 1).join(' ');
	const item = pend.adicionar(projeto, {texto, t, origem: 'assistente'});
	console.log(`Pendência ${item.id} anotada. O editor aplica antes do próximo render.`);
} else {
	const abertas = pend.abertas(projeto);
	console.log(abertas.length ? `Pendências abertas (aplique todas no edit.ts e marque: node scripts/pendencias.mjs ${projeto} feito <id> ...):\n${textoPendencias(abertas)}` : 'Nenhuma pendência aberta.');
}
