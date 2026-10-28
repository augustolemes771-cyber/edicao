import type {Edit} from '../../motor/plano';
import transcricao from './transcricao.json';

export const primeiro: Edit = {
	pasta: 'projetos/primeiro',
	video: 'video.mp4',
	formato: 'vertical',
	verificarCurva: false,
	regraCamera: false,
	legenda: {estilo: 'palavra', enfase: []},
	camera: (b) => [{tipo: 'foco', em: 0}],
	transcricao,
	// Notas faladas para a IA, no tempo original. Ex.: (o) => [[o.say('abre nota').inicio, o.say('fecha nota').fim]]
	cortes: [],
	cenas: (b) => [],
};
