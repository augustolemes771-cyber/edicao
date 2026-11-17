import type {Edit} from '../../motor/plano';
import transcricao from './transcricao.json';

export const metadados17111644: Edit = {
	pasta: 'projetos/metadados-1711-1644',
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
