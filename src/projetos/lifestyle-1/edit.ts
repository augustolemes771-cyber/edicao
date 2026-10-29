import type {EfeitoCamera, Edit} from '../../motor/plano';
import transcricao from './transcricao.json';

// Lifestyle "antes × depois" do @danilowtts (tema Lifestyle). Vídeo base montado por scripts/montar.py (montagem.json).
// A transcrição só tem a punchline ("Tá muito ruim aqui, hein, velho"), já no tempo do vídeo final; o resto são cenas em tempo fixo
// (segundos do vídeo final, que não tem cortes): batida do remix 0,4876 s (123,05 BPM), golpe do Mist/drop em 11,703 s.
const B = 60 / 123.05; // batida do remix v6 (Congratulations + Mist)
const DROP = 24 * B; // 11,703 s: o Mist entra em 16 batidas (1ª notificação), o okay em 10,40 s e o golpe cai aqui
const OURO: [string, string, string] = ['#fff1c4', '#f2b544', '#6b3f0c'];

// Cortes da montagem (em batidas): lancha, carros, jet ski, festa, punchline e fecho.
const CORTES = [28, 30, 34, 38, 42, 44, 48, 52, 55, 57];

// Soco de zoom na batida: fecha seco e assenta em 0,35 s.
const soco = (batida: number, escala = 1.05): EfeitoCamera[] => [
	{tipo: 'zoom', em: batida * B, escala},
	{tipo: 'zoom', em: batida * B + 1 / 30, escala: 1, suave: 0.35},
];

export const lifestyle1: Edit = {
	pasta: 'projetos/lifestyle-1',
	video: 'video.mp4',
	formato: 'vertical',
	verificarCurva: false,
	regraCamera: false,
	extraFim: 0,
	// Sem legenda: a fala da punchline vira texto no estilo do início (textoLife com brilho).
	transcricao,
	cortes: [],
	camera: () => [
		{tipo: 'chicote', em: 4 * B},
		{tipo: 'foco', em: 10 * B, duracao: 0.5},
		// Virada: a câmera fecha devagar enquanto as vendas chegam e o Mist cresce.
		{tipo: 'zoom', em: 16 * B, escala: 1.12, suave: 8 * B - 0.1},
		{tipo: 'flash', em: DROP},
		{tipo: 'zoom', em: DROP, escala: 1.18},
		{tipo: 'zoom', em: DROP + 1 / 30, escala: 1, suave: 0.9},
		// O 2 pousa (2 batidas depois do drop).
		...soco(26, 1.1),
		// Montagem: um efeito em cada corte e um soco na batida no meio de cada plano (forte nos tempos pares).
		{tipo: 'chicote', em: 28 * B},
		{tipo: 'vazamento', em: 30 * B, cores: OURO},
		{tipo: 'chicote', em: 34 * B},
		{tipo: 'flash', em: 38 * B},
		{tipo: 'chicote', em: 42 * B},
		{tipo: 'vazamento', em: 44 * B, cores: OURO},
		{tipo: 'chicote', em: 48 * B},
		{tipo: 'mergulho', em: 52 * B},
		{tipo: 'flash', em: 55 * B},
		...Array.from({length: 55 - 28}, (_, i) => 28 + i)
			.filter((n) => !CORTES.includes(n) && n !== 52 - 1 && n !== 53)
			.flatMap((n) => soco(n, n % 2 ? 1.035 : 1.07)),
		...[38, 44, 55].flatMap((n) => soco(n, 1.1)),
		// Punchline: entra em foco; fecho com luz dourada e anel.
		{tipo: 'foco', em: 57 * B, duracao: 0.35},
		{tipo: 'vazamento', em: 64 * B, cores: OURO},
		{tipo: 'iris', em: 64 * B},
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
		// Vitória: louros dourados e o 2 girando como caça-níquel até pousar na batida (sons da montagem vão aqui também).
		{
			tipo: 'vitoria',
			de: DROP,
			ate: 30 * B - 0.08,
			kicker: 'MAIS DE',
			prefixo: 'R$',
			numero: '2',
			palavra: 'MILHÕES',
			sub: 'faturados com o TikTok Shop',
			pousa: 26 * B,
			y: 600,
			sons: [
				{em: 26 * B, som: 'shimmer'},
				...[28, 34, 42, 48].map((n) => ({em: n * B - 0.08, som: 'whoosh' as const, ganho: 0.6})),
				...[30, 44, 64].map((n) => ({em: n * B, som: 'shimmer' as const, ganho: 0.7})),
				{em: 52 * B - 0.25, som: 'subida' as const, ganho: 0.6},
			],
		},
		{tipo: 'textoLife', de: 30 * B + 0.05, ate: 34 * B - 0.05, principal: 'o escritório mudou', y: 620},
		// Punchline falada: o texto do início no lugar da legenda, com brilho para ler.
		{tipo: 'textoLife', de: 27.8, ate: 28.8, principal: 'ô, como que tá?', y: 960, brilho: true},
		{tipo: 'textoLife', de: 28.78, ate: 31.1, principal: 'tá muito ruim aqui, hein, velho', y: 960, brilho: true},
		{tipo: 'textoLife', de: 64 * B + 0.1, ate: 69 * B - 0.1, kicker: 'TUDO COMEÇOU COM O', principal: 'TikTok Shop', sub: '@danilowtts', y: 540},
	],
};
