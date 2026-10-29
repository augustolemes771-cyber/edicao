import type {Edit} from '../../motor/plano';
import transcricao from './transcricao.json';

// Lifestyle "antes × depois" do @danilowtts (tema Lifestyle). Vídeo base montado por scripts/montar.py (montagem.json).
// A transcrição só tem a punchline ("Tá muito ruim aqui, hein, velho"), já no tempo do vídeo final; o resto são cenas em tempo fixo
// (segundos do vídeo final, que não tem cortes): batida do remix 0,4876 s (123,05 BPM), golpe do Mist/drop em 11,703 s.
const B = 60 / 123.05; // batida do remix v5 (Congratulations + Mist)
const DROP = 24 * B; // 11,703 s: o okay entra em 10,40 s e o golpe do Mist cai aqui

export const lifestyle1: Edit = {
	pasta: 'projetos/lifestyle-1',
	video: 'video.mp4',
	formato: 'vertical',
	verificarCurva: false,
	regraCamera: false,
	extraFim: 0,
	legenda: {
		estilo: 'mare',
		altura: 0.5,
		palavrasPorTela: 4,
		enfase: [{palavra: 'ruim', estilo: 'serif'}],
	},
	transcricao,
	cortes: [],
	camera: () => [
		{tipo: 'chicote', em: 4 * B},
		{tipo: 'flash', em: DROP},
		{tipo: 'zoom', em: DROP, escala: 1.15},
		{tipo: 'zoom', em: DROP + 0.7, escala: 1, suave: 0.6},
	],
	cenas: () => [
		{tipo: 'textoLife', de: 0.15, ate: 1.85, principal: 'isso é hoje.', y: 620, som: 'pop'},
		{tipo: 'textoLife', de: 4 * B + 0.1, ate: 10 * B - 0.1, kicker: '2 ANOS ATRÁS', principal: 'noites no quintal com notebook', y: 640},
		{tipo: 'textoLife', de: 10 * B + 0.1, ate: 16 * B - 0.1, principal: 'um escritório improvisado', y: 640},
		{
			tipo: 'notificacoes',
			de: 16 * B,
			ate: DROP - 0.1,
			itens: [16, 18, 20, 22].map((n) => n * B).map((em) => ({titulo: 'TikTok Shop', texto: 'Nova venda realizada 🛍️', em})),
			sons: [16, 18, 20, 22].map((n) => n * B).map((em) => ({em, som: 'tick' as const})),
		},
		{tipo: 'numero3d', de: DROP, ate: DROP + 2.4, texto: 'R$ 2 MILHÕES', rotulo: '+ de', abaixo: 'faturados com TikTok Shop', y: 420, em: DROP + 0.05, som: 'pop'},
		{tipo: 'textoLife', de: 30 * B + 0.05, ate: 34 * B - 0.05, principal: 'o escritório mudou', y: 620},
		{tipo: 'textoLife', de: 64 * B + 0.1, ate: 69 * B - 0.1, kicker: 'TUDO COMEÇOU COM O', principal: 'TikTok Shop', sub: '@danilowtts', y: 540},
	],
};
