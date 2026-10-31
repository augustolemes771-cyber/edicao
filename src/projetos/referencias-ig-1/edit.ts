import type {Edit} from '../../motor/plano';
import transcricao from './transcricao.json';
import {cenasA} from './cenas-a';
import {cenasB} from './cenas-b';
import {cenasC} from './cenas-c';

export const referenciasIg1: Edit = {
	pasta: 'projetos/referencias-ig-1',
	video: 'video.mp4',
	formato: 'vertical',
	// Vídeo novo criado com base em referências do Instagram (em public/projetos/referencias-ig-1/referencias/).
	verificarCurva: false,
	regraCamera: false,
	escalaFinal: 1,
	legenda: {
		estilo: 'palavra',
		altura: 0.66,
		// Nome de cada peça em destaque (como os rótulos amarelos das referências).
		enfase: ['sustentação.', 'tração.', 'flaps.', 'ailerons.', 'profundor.', 'pressurização.', 'spoilers.', 'pouso.'].map((palavra) => ({palavra, estilo: 'cor' as const, cor: '#ffcf3a'})),
	},
	camera: (b) => [{tipo: 'foco', em: 0}],
	transcricao,
	// Notas faladas para a IA, no tempo original. Ex.: (o) => [[o.say('abre nota').inicio, o.say('fecha nota').fim]]
	cortes: [],
	// Vídeo todo em motion (narração com voz neural, scripts/narrar.py): cada bloco de cenas está no seu arquivo.
	cenas: (b) => [...cenasA(b), ...cenasB(b), ...cenasC(b)],
};
