import type {Edit} from '../../motor/plano';
import transcricao from './transcricao.json';

export const referenciasIg1: Edit = {
	pasta: 'projetos/referencias-ig-1',
	video: 'video.mp4',
	formato: 'vertical',
	// Vídeo novo criado com base em referências do Instagram (em public/projetos/referencias-ig-1/referencias/).
	verificarCurva: false,
	regraCamera: false,
	legenda: {estilo: 'palavra', enfase: []},
	camera: (b) => [{tipo: 'foco', em: 0}],
	transcricao,
	// Notas faladas para a IA, no tempo original. Ex.: (o) => [[o.say('abre nota').inicio, o.say('fecha nota').fim]]
	cortes: [],
	cenas: (b) => [{tipo: 'peca', nome: 'igTeste', de: 0, ate: 3, dados: {}}],
};
