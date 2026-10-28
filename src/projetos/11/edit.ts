import type {Edit} from '../../motor/plano';
import transcricao from './transcricao.json';

// Entrevista com a Paola. Clímax: "nunca mais tentei abrir uma live" (push lento, luz, listras, NUNCA MAIS em neon).
export const p11: Edit = {
	pasta: 'projetos/11',
	video: 'video.mp4',
	formato: 'vertical',
	verificarCurva: false,
	regraCamera: false,
	legenda: {estilo: 'palavra', enfase: []},
	camera: (b) => [
		{tipo: 'foco', em: 0},
		// Respiro e tensão: aproxima devagar até a frase pesada.
		{tipo: 'zoom', em: b.at('depois'), escala: 1.12, suave: 1.6},
		{tipo: 'listras', em: b.at('nunca')},
		{tipo: 'flash', em: b.at('nunca')},
		{tipo: 'zoom', em: b.at('nunca'), escala: 1.35},
		{tipo: 'zoom', em: b.at('mais'), escala: 1.5, suave: 1.2},
		// Solta a tensão depois da frase.
		{tipo: 'vazamento', em: b.say('abrir uma live').fim},
		{tipo: 'zoom', em: b.say('abrir uma live').fim, escala: 1},
	],
	transcricao,
	// Retomada de gravação ("peraí, vamos fazer de novo").
	cortes: (o) => [[o.say('Não, peraí').inicio - 0.1, o.say('de novo').fim + 0.2]],
	cenas: (b) => [
		// Luz: anel que se fecha no rosto enquanto a frase se constrói.
		{tipo: 'anel', som: null, x: 0.5, y: 0.36, raio: 0.55, de: b.at('depois'), ate: b.at('nunca')},
		{
			tipo: 'gigante',
			texto: '',
			paleta: 'dourado',
			modo: 'sobre',
			linhas: [{texto: 'eu'}, {texto: 'NUNCA MAIS', grande: true}],
			y: 0.17,
			de: b.at('nunca'),
			ate: b.say('abrir uma live').fim,
			som: 'boom',
		},
	],
};
