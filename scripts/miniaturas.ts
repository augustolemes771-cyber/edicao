// Gera as miniaturas da biblioteca do painel: acha um projeto que usa cada peça ou modelo 3D e tira um print desse momento.
// Uso: npm run miniaturas   (renderiza stills; na nuvem passe BROWSER=/caminho/do/headless_shell)
// As imagens ficam em biblioteca/miniaturas/ (vão para o git, então todo PC já as tem).
import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {montar} from '../src/motor/plano';
import {FPS} from '../src/motor/tema';
import {projetos} from '../src/projetos';

// Qual tipo de cena exercita cada peça (a primeira que existir em algum projeto vence).
const PECAS: Record<string, string[]> = {
	Titulo: ['titulo'],
	Passo: ['passo'],
	Estrela: ['estrela'],
	Logo3D: ['logo3d'],
	Cenario: ['cenario'],
	Xadrez: ['xadrez'],
	Vitrine: ['vitrine'],
	TopicosPapel: ['topicos'],
	NeonProfundo: ['gigante', 'retrato'],
	Luxo: ['kicker', 'letras', 'retrato'],
	Referencias: ['cartao', 'kicker', 'letras', 'comentarios', 'checklist'],
	Cenas: ['numero', 'lista', 'painel'],
	Grade: ['numero', 'lista', 'titulo'],
	FundoGrid: ['numero', 'lista', 'titulo'],
};
const MODELOS: Record<string, string> = {rei: 'Rei', moeda: 'Moeda', notas: 'Notas', relogio: 'Relogio', lampiao: 'Lampiao', celular: 'Celular', caixa: 'Caixa'};

type Achado = {projeto: string; frame: number; peso: number};
const achados: Record<string, Achado> = {};
const guardar = (nome: string, a: Achado) => {
	if (!achados[nome] || a.peso < achados[nome].peso) achados[nome] = a;
};

for (const [nome, edit] of Object.entries(projetos)) {
	if (edit.video && !existsSync(path.join('public', edit.pasta, edit.video))) {
		console.log(`pulando ${nome}: vídeo não está neste computador`);
		continue;
	}
	let duracao = edit.duracao ?? 10;
	const m = montar(edit, duracao);
	for (const c of m.cenas) {
		const t = c.de + Math.min(1.6, (c.ate - c.de) * 0.75);
		const frame = Math.round(t * FPS);
		for (const [peca, tipos] of Object.entries(PECAS)) {
			const i = tipos.indexOf(c.tipo);
			if (i >= 0) guardar(peca, {projeto: nome, frame, peso: i});
		}
		if (c.tipo === 'cenario') {
			for (const o of c.objetos ?? []) {
				// Prefere a cena com menos objetos: o modelo aparece sozinho e maior.
				guardar(MODELOS[o.tipo], {projeto: nome, frame, peso: (c.objetos ?? []).length});
			}
		}
	}
	if (m.legenda.length) {
		const p = m.legenda[Math.min(2, m.legenda.length - 1)];
		guardar('Legenda', {projeto: nome, frame: Math.round(((p.de + p.ate) / 2) * FPS), peso: 0});
	}
}

const saida = path.resolve('biblioteca/miniaturas');
mkdirSync(saida, {recursive: true});
const feitos: Record<string, string> = {};
for (const [nome, a] of Object.entries(achados)) {
	const arq = `${nome}.jpg`;
	console.log(`${nome}: ${a.projeto} quadro ${a.frame}`);
	const args = ['remotion', 'still', a.projeto, path.join(saida, arq), `--frame=${a.frame}`, '--scale=0.3', '--jpeg-quality=70'];
	if (process.env.BROWSER) args.push(`--browser-executable=${process.env.BROWSER}`);
	try {
		execFileSync('npx', args, {stdio: 'inherit'});
		feitos[nome] = arq;
	} catch {
		console.log(`  falhou: ${nome}`);
	}
}
writeFileSync(path.join(saida, 'indice.json'), JSON.stringify(feitos, null, 1));
console.log(`\n${Object.keys(feitos).length} miniaturas em biblioteca/miniaturas/`);
