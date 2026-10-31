import type {Edit} from '../../motor/plano';
import transcricao from './transcricao.json';
import {cenasA} from './cenas-a';
import {cenasB} from './cenas-b';
import {cenasC} from './cenas-c';
import {cenasD} from './cenas-d';

// Vídeo 100% motion: "Você é uma gota de água" (narração neural com tempo exato por palavra, scripts/narrar.py).
export const gota1: Edit = {
	pasta: 'projetos/gota-1',
	video: 'video.mp4',
	formato: 'vertical',
	escalaFinal: 1,
	verificarCurva: false,
	regraCamera: false,
	legenda: {
		estilo: 'palavra',
		palavrasPorTela: 1,
		altura: 0.7,
		enfase: ['esgoto.', 'gradeamento.', 'biológico.', 'decantação.', 'captação.', 'tratamento.'].map((palavra) => ({palavra, estilo: 'cor' as const, cor: '#ffcf3a'})),
	},
	camera: () => [{tipo: 'foco', em: 0}],
	transcricao,
	cortes: [],
	cenas: (b) => [...cenasA(b), ...cenasB(b), ...cenasC(b), ...cenasD(b)],
};
