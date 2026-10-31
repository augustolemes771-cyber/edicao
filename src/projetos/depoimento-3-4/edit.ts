import type {Edit} from '../../motor/plano';
import transcricao from './transcricao.json';

export const depoimento34: Edit = {
	pasta: 'projetos/depoimento-3-4',
	video: 'video.mp4',
	formato: 'vertical',
	// Fonte do celular em ~470x840: final em 540x960 (render na qualidade do vídeo).
	escalaFinal: 0.5,
	verificarCurva: false,
	regraCamera: false,
	legenda: {estilo: 'palavra', enfase: []},
	camera: (b) => [{tipo: 'foco', em: 0}],
	transcricao,
	// Notas faladas para a IA, no tempo original. Ex.: (o) => [[o.say('abre nota').inicio, o.say('fecha nota').fim]]
	cortes: [],
	cenas: (b) => [],
};
