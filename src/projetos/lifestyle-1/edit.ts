import type {Edit} from '../../motor/plano';
import transcricao from './transcricao.json';

// Lifestyle "antes × depois" do @danilowtts (tema Lifestyle). Vídeo base montado por scripts/montar.py (montagem.json).
// A transcrição só tem a punchline ("Tá muito ruim aqui, hein, velho"), já no tempo do vídeo final; o resto são cenas em tempo fixo
// (segundos do vídeo final, que não tem cortes): batida da música 0,46875 s, drop em 9,375 s.
const DROP = 9.375;

export const lifestyle1: Edit = {
	pasta: 'projetos/lifestyle-1',
	video: 'video.mp4',
	formato: 'vertical',
	verificarCurva: false,
	regraCamera: false,
	extraFim: 0,
	legenda: {
		estilo: 'mare',
		altura: 0.656,
		palavrasPorTela: 4,
		enfase: [{palavra: 'ruim', estilo: 'serif'}],
	},
	transcricao,
	cortes: [],
	camera: () => [
		{tipo: 'chicote', em: 1.875},
		{tipo: 'flash', em: DROP},
		{tipo: 'zoom', em: DROP, escala: 1.15},
		{tipo: 'zoom', em: DROP + 0.7, escala: 1, suave: 0.6},
	],
	cenas: () => [
		{tipo: 'textoLife', de: 0.15, ate: 1.8, principal: 'isso é hoje.', y: 620, som: 'pop'},
		{tipo: 'textoLife', de: 1.95, ate: 4.6, kicker: '2 ANOS ATRÁS', principal: 'noites no quintal com notebook', y: 640},
		{tipo: 'textoLife', de: 4.75, ate: 7.4, principal: 'um escritório improvisado', y: 640},
		{
			tipo: 'notificacoes',
			de: 7.5,
			ate: 9.3,
			itens: [7.5, 7.969, 8.438, 8.906].map((em) => ({titulo: 'TikTok Shop', texto: 'Nova venda realizada 🛍️', em})),
			sons: [7.5, 7.969, 8.438, 8.906].map((em) => ({em, som: 'tick' as const})),
		},
		{tipo: 'numero3d', de: DROP, ate: 11.4, texto: 'R$ 2 MILHÕES', rotulo: '+ de', abaixo: 'faturados com TikTok Shop', y: 420, em: DROP + 0.05, som: 'pop'},
		{tipo: 'textoLife', de: 15.95, ate: 17.7, principal: 'o escritório mudou', y: 620},
		{tipo: 'textoLife', de: 28.6, ate: 31.2, kicker: 'TUDO COMEÇOU COM O', principal: 'TikTok Shop', sub: '@danilowtts', y: 760},
	],
};
