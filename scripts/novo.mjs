// Cria um projeto novo: src/projetos/<nome>/edit.ts, a pasta de mídia e o registro em index.ts.
// Uso: npm run novo -- <nome> [--vertical]
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const nome = args.find((a) => !a.startsWith('--'));
const vertical = args.includes('--vertical');
if (!nome || !/^[a-z0-9-]+$/.test(nome)) {
	console.error('Uso: npm run novo -- <nome-em-minusculas-com-hifen> [--vertical]');
	process.exit(1);
}
const raiz = path.resolve(import.meta.dirname, '..');
const pasta = path.join(raiz, 'src', 'projetos', nome);
if (existsSync(pasta)) {
	console.error(`Já existe: ${pasta}`);
	process.exit(1);
}
mkdirSync(pasta, {recursive: true});
mkdirSync(path.join(raiz, 'public', 'projetos', nome), {recursive: true});
writeFileSync(path.join(pasta, 'transcricao.json'), '[]\n');

const variavel = nome.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase()).replace(/^[0-9]/, (c) => `p${c}`);
const modelo = `import type {Edit} from '../../motor/plano';
import transcricao from './transcricao.json';

export const ${variavel}: Edit = {
	pasta: 'projetos/${nome}',
	video: 'video.mp4',
${
	vertical
		? `	formato: 'vertical',
	verificarCurva: false,
	regraCamera: false,
	legenda: {estilo: 'palavra', enfase: []},
	camera: (b) => [{tipo: 'foco', em: 0}],
`
		: `	// Trilha em public/projetos/${nome}/ (npm run musica -- ${nome} <arquivo>).
	// musica: {arquivo: 'musica.m4a'},
`
}	transcricao,
	// Notas faladas para a IA, no tempo original. Ex.: (o) => [[o.say('abre nota').inicio, o.say('fecha nota').fim]]
	cortes: [],
	cenas: (b) => [],
};
`;
writeFileSync(path.join(pasta, 'edit.ts'), modelo);

const indice = path.join(raiz, 'src', 'projetos', 'index.ts');
let s = readFileSync(indice, 'utf8');
s = s.replace(
	/(import type \{Edit\} from '..\/motor\/plano';\n(?:import .*\n)*)/,
	`$1import {${variavel}} from './${nome}/edit';\n`,
);
s = s.replace(/(export const projetos: Record<string, Edit> = \{\n(?:.*\n)*?)(\};)/, `$1\t'${nome}': ${variavel},\n$2`);
writeFileSync(indice, s);

console.log(`Projeto ${nome} criado${vertical ? ' (vertical)' : ''}.
1. Coloque o vídeo decupado em public/projetos/${nome}/video.mp4
2. npm run transcrever -- ${nome}
3. npm run roteiro -- ${nome}
4. Escreva as cenas em src/projetos/${nome}/edit.ts e confira com npm run conferir -- ${nome}`);
