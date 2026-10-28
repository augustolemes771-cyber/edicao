import type {Edit} from '../../motor/plano';
import transcricao from './transcricao.json';

export const teste1: Edit = {
	pasta: 'projetos/teste-1',
	video: 'IMG_5212 (1).MOV',
	formato: 'vertical',
	verificarCurva: false,
	regraCamera: false,
	legenda: {estilo: 'ouro', enfase: [{palavra: 'nunca', tipo: 'grande'}] as never},
	camera: (b) => [
		{tipo: 'foco', em: 0},
		{tipo: 'zoom', em: b.at('chorando'), escala: 1.2},
		{tipo: 'mergulho', em: b.at('nunca')},
		{tipo: 'zoom', em: b.at('nunca'), escala: 1.45},
		{tipo: 'flash', em: b.at('live', 4)},
		{tipo: 'foco', em: b.at('E', 6)},
	],
	transcricao,
	cortes: [],
	cenas: (b) => {
		const f = b.say('nunca mais tentei abrir uma live');
		return [
			{tipo: 'preto', de: f.inicio - 0.05, ate: f.inicio + 0.25, modo: 'sobre'},
			{tipo: 'kicker', de: f.inicio, ate: f.fim, modo: 'sobre', pequeno: 'depois desse dia', grande: 'NUNCA MAIS', emGrande: f.inicio + 0.1, estilo: 'ouro', impacto: true},
		] as never;
	},
};
