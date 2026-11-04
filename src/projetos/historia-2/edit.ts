import type {Edit} from '../../motor/plano';
import transcricao from './transcricao.json';
import {cenasMisterio} from './misterio';

// "O Apagão de Corvo Branco" (Ilha do Boto Branco), parte 1. Mistério 100% em motion, narração neural com tempo exato
// por palavra (scripts/narrar.py, pt-BR-AntonioNeural +12%). Os comentários do CTA viram a parte 2.
const DURACAO = 58.8;

export const historia2: Edit = {
	pasta: 'projetos/historia-2',
	video: 'video.mp4',
	formato: 'vertical',
	verificarCurva: false,
	regraCamera: false,
	escalaFinal: 1,
	legenda: {
		estilo: 'palavra',
		palavrasPorTela: 1,
		altura: 0.74,
		enfase: ['apagou.', 'sumido.', 'lembra', 'cassete.', 'inocente.', 'chega.', 'teoria.'].map((palavra) => ({palavra, estilo: 'cor' as const, cor: '#ffc34a'})),
	},
	camera: () => [{tipo: 'foco', em: 0}],
	transcricao,
	cortes: [],
	cenas: (b) => cenasMisterio(b, DURACAO),
};
