// Gera o roteiro do projeto para escrever as cenas:
//   docs/<projeto>/transcript-lines.txt  frases com tempo original e tempo editado
//   docs/<projeto>/transcript-words.txt  índice, tempo editado e palavra (para b.atsW)
// e aponta notas faladas e pedidos para a IA ("abre nota", "fecha nota", "IA, ...").
// Uso: npm run roteiro -- <projeto>
import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {criarBusca, palavrasEditadas, paraTempoEditado} from '../src/motor/palavras';
import {formatar, montar, paraLegendas} from '../src/motor/plano';
import {projetos} from '../src/projetos';

const nome = process.argv[2];
const edit = nome ? projetos[nome] : undefined;
if (!nome || !edit) {
	console.error(`Uso: npm run roteiro -- <projeto>. Existentes: ${Object.keys(projetos).join(', ')}`);
	process.exit(1);
}
let duracao = edit.duracao ?? 0;
if (edit.video) {
	const arquivo = path.join('public', edit.pasta, edit.video);
	if (existsSync(arquivo)) {
		duracao = Number(
			execFileSync('ffprobe', [
				'-v',
				'error',
				'-show_entries',
				'format=duration',
				'-of',
				'csv=p=0',
				arquivo,
			]).toString(),
		);
	}
}
const original = palavrasEditadas(paraLegendas(edit.transcricao), [[0, Infinity]]);
if (original.length === 0) {
	console.error('Transcrição vazia. Rode antes: npm run transcrever -- ' + nome);
	process.exit(1);
}
const m = montar(edit, duracao || original[original.length - 1].fim + 1);
const editadas = criarBusca(m.palavras).palavras;

// Frases: quebra na pontuação final ou em pausa maior que 0,7 s.
const linhas: string[] = [];
let atual: typeof original = [];
const fechar = () => {
	if (!atual.length) return;
	const ini = atual[0].inicio;
	const ed = paraTempoEditado(ini, m.mantidos);
	linhas.push(
		`${formatar(ini).padStart(8)}  ${ed === null ? '[CORTADO]' : formatar(ed).padStart(9)}  ${atual.map((p) => p.texto).join(' ')}`,
	);
	atual = [];
};
original.forEach((p, i) => {
	atual.push(p);
	const prox = original[i + 1];
	if (/[.!?…]$/.test(p.texto) || !prox || prox.inicio - p.fim > 0.7) fechar();
});

const pasta = path.join('docs', nome);
mkdirSync(pasta, {recursive: true});
writeFileSync(path.join(pasta, 'transcript-lines.txt'), `# original   editado   fala\n${linhas.join('\n')}\n`);
writeFileSync(
	path.join(pasta, 'transcript-words.txt'),
	`# índice  tempo editado  palavra  (use b.atsW(índice))\n${editadas.map((p) => `${String(p.indice).padStart(5)}  ${formatar(p.inicio).padStart(8)}  ${p.texto}`).join('\n')}\n`,
);

// Notas faladas e pedidos para a IA.
const texto = original.map((p) =>
	p.texto
		.toLowerCase()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^a-z0-9]/g, ''),
);
const achados: string[] = [];
texto.forEach((t, i) => {
	if (t === 'abre' && texto[i + 1] === 'nota') {
		const fim = texto.findIndex((x, j) => j > i && x === 'fecha' && texto[j + 1] === 'nota');
		const trecho = original
			.slice(i, fim === -1 ? i + 12 : fim + 2)
			.map((p) => p.texto)
			.join(' ');
		achados.push(`nota em ${formatar(original[i].inicio)}: "${trecho}"${fim === -1 ? ' (sem "fecha nota")' : ''}`);
	}
	if ((t === 'ia' || t === 'claude') && /,$/.test(original[i].texto)) {
		achados.push(
			`pedido para a IA em ${formatar(original[i].inicio)}: "${original
				.slice(i, i + 14)
				.map((p) => p.texto)
				.join(' ')}…"`,
		);
	}
});

console.log(`Roteiro em ${pasta}/ (${linhas.length} frases, ${editadas.length} palavras depois dos cortes).`);
if (achados.length) {
	console.log('\nNotas faladas e pedidos encontrados (cada pedido vira tarefa; a nota sai do vídeo):');
	achados.forEach((a) => console.log('  ' + a));
	console.log(
		"\nPara cortar uma nota: cortes: (o) => [[o.say('abre nota').inicio - 0.15, o.say('fecha nota').fim + 0.2]]",
	);
}
