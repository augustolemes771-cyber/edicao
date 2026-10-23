import type {Edit} from '../../motor/plano';
import transcricao from './transcricao.json';

// Demonstração dos cenários 3D aprendidos na segunda leva de referências (docs/referencias/desmontagem-2.md).
// Sem fala: os tempos são fixos. Num vídeo com narração, use b.at('palavra') como nos outros projetos.
export const cenariosExemplo: Edit = {
	pasta: 'projetos/cenarios-exemplo',
	formato: 'vertical',
	duracao: 16.5,
	verificarCurva: false,
	regraCamera: false,
	transcricao,
	camera: () => [
		{tipo: 'foco', em: 0},
		{tipo: 'foco', em: 2.6, duracao: 0.35},
		{tipo: 'vazamento', em: 5.2},
		{tipo: 'iris', em: 6.4},
		{tipo: 'mergulho', em: 8.0},
		{tipo: 'flash', em: 10.6},
		{tipo: 'chicote', em: 13.2},
	],
	cenas: () => [
		// Ref. 1: papel, luz de janela, relógios nos cantos, palavra fantasma, letra a letra.
		{
			tipo: 'cenario',
			de: 0,
			ate: 2.6,
			fantasma: 'DISCIPLINA',
			pequeno: 'Você não precisa de',
			grande: 'motivação',
			posTexto: 0.42,
			objetos: [
				{tipo: 'relogio', x: -0.72, y: 0.78, z: 0.3, escala: 0.85},
				{tipo: 'relogio', x: 0.62, y: -0.84, escala: 1.25, atraso: 6},
			],
		},
		// Ref. 1: moedas girando, frase em três andares e banho de cor laranja no fim.
		{
			tipo: 'cenario',
			de: 2.6,
			ate: 5.2,
			fantasma: 'MOTIVAÇÃO',
			pequeno: 'A motivação',
			grande: 'passa',
			abaixo: 'quando a vida aperta',
			posTexto: 0.36,
			tinta: '#ff9a3c',
			objetos: [
				{tipo: 'moeda', x: -0.6, y: -0.55, escala: 1.4, girar: 0.8},
				{tipo: 'moeda', x: 0.75, y: 0.72, z: -0.4, escala: 0.8, girar: -0.6, atraso: 5},
			],
		},
		// Ref. 4: fundo escuro, moedas flutuando, palavra gótica dourada revelada fora de ordem.
		{
			tipo: 'cenario',
			de: 5.2,
			ate: 8.0,
			superficie: 'escuro',
			luz: 'nenhuma',
			pequeno: 'é o sexto sentido',
			grande: 'Dinheiro',
			estiloTexto: 'ouro',
			posTexto: 0.45,
			objetos: [
				{tipo: 'moeda', x: 0.66, y: 0.74, z: -0.5, escala: 0.75, girar: 0.5, simbolo: 'R$'},
				{tipo: 'moeda', x: -0.7, y: -0.62, z: 0.4, escala: 1.1, girar: -0.4, simbolo: 'R$'},
				{tipo: 'notas', x: 0.42, y: -0.5, z: -0.8, escala: 0.75, giro: [0.3, 0.6, 0.4]},
			],
		},
		// Ref. 3: papel com sombra de folhas, lampião aceso, texto neutro palavra a palavra.
		{
			tipo: 'cenario',
			de: 8.0,
			ate: 10.6,
			luz: 'folhas',
			pequeno: 'Valor de verdade sempre',
			grande: 'BRILHA',
			estiloTexto: 'neutro',
			posTexto: 0.46,
			ladoTexto: 'direita',
			camera: {de: [0, 0, 8.4], ate: [0.2, 0, 7.6]},
			objetos: [{tipo: 'lampiao', x: -0.74, y: -0.08, escala: 0.95, giro: [0.1, 0.3, 0]}],
		},
		// Ref. 3: maços de notas deslizando na diagonal, número grande.
		{
			tipo: 'cenario',
			de: 10.6,
			ate: 13.2,
			luz: 'nenhuma',
			pequeno: 'Você está fazendo',
			grande: '1 MILHÃO',
			abaixo: 'de reais',
			estiloTexto: 'neutro',
			posTexto: 0.45,
			objetos: [
				{tipo: 'notas', x: 0.55, y: 0.7, escala: 1, entra: 'desliza', giro: [Math.PI / 2.3, 0, -0.5]},
				{
					tipo: 'notas',
					x: -0.35,
					y: -0.6,
					z: 0.4,
					escala: 1.3,
					entra: 'desliza',
					atraso: 8,
					giro: [Math.PI / 2.3, 0, -0.5],
				},
			],
		},
		// Ref. 1: rei de xadrez na frente da palavra fantasma, luz de janela.
		{
			tipo: 'cenario',
			de: 13.2,
			ate: 16.5,
			fantasma: 'LEVANTA',
			pequeno: 'Seu tempo',
			grande: 'está correndo',
			posTexto: 0.24,
			objetos: [{tipo: 'rei', x: 0, y: -0.82, escala: 1.25, girar: 0.15}],
		},
	],
};
