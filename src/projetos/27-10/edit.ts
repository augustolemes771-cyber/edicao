import type {Edit} from '../../motor/plano';
import transcricao from './transcricao.json';

// Tema "entrevista": segue a ref. 2 da desmontagem (legenda pequena com ênfase gigante amarela,
// cartelas escuras, puxada de foco na abertura e na volta das cartelas).
export const p2710: Edit = {
	pasta: 'projetos/27-10',
	video: 'video.mp4',
	formato: 'vertical',
	verificarCurva: false,
	regraCamera: false,
	legenda: {estilo: 'impacto', enfase: []},
	camera: (b) => [{tipo: 'foco', em: 0}],
	transcricao,
	// Notas faladas para a IA, no tempo original. Ex.: (o) => [[o.say('abre nota').inicio, o.say('fecha nota').fim]]
	cortes: [],
	cenas: (b) => [],
};
