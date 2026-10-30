import type {EfeitoCamera, Edit} from '../../motor/plano';
import transcricao from './transcricao.json';

// Lifestyle "antes × depois" do @danilowtts (tema Lifestyle). Vídeo base montado por scripts/montar.py (montagem.json).
// A transcrição só tem a punchline ("Tá muito ruim aqui, hein, velho"), já no tempo do vídeo final; o resto são cenas em tempo fixo
// (segundos do vídeo final, que não tem cortes): batida do remix 0,4876 s (123,05 BPM), golpe do Mist/drop em 11,703 s.
const B = 60 / 123.05; // batida do remix v6 (Congratulations + Mist)
const DROP = 24 * B; // 11,703 s: o Mist entra em 16 batidas (1ª notificação), o okay em 10,40 s e o golpe cai aqui
const OKAY = 10.4; // o "okay" sussurrado do Mist
// Batida logo depois de cada "okay" do Mist depois do drop (14,14 / 17,07 / 19,13 / 21,94 s): só nelas há corte com deslize e whoosh;
// a montagem foi ajustada para ter troca de plano em cada uma. Na virada o deslize vai no corte do golpe (24), junto do clarão (pedido do usuário).
// O de 19,13 s fica fora da grade: o usuário ouve a batida ali, não em 19,02 s (39 batidas).
const B19 = 19.13 / B;
const DESLIZES: [number, 'cima' | 'baixo' | 'esquerda' | 'direita'][] = [
	[24, 'cima'],
	[29, 'direita'],
	[35, 'cima'], // ele anda para a frente entre os carros: o quadro segue o passo
	[B19, 'direita'],
	[45, 'esquerda'],
];

// Cortes da montagem depois do drop (em batidas): lancha, carros, jet ski, festa e punchline. Os que não estão em DESLIZES são secos.
const CORTES = [29, 31, 35, B19, 43, 45, 48, 52, 55];

// Dentro de cada plano a câmera só avança devagar (sem soco na batida): o ritmo vem dos cortes na batida.
const deriva = (de: number, ate: number, escala = 1.06): EfeitoCamera[] => [
	{tipo: 'zoom', em: de * B, escala: 1},
	{tipo: 'zoom', em: de * B + 1 / 30, escala, suave: (ate - de) * B - 1 / 30},
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
		{tipo: 'foco', em: 10 * B, duracao: 0.5},
		// Virada: a câmera fecha devagar enquanto as vendas chegam e o Mist cresce.
		{tipo: 'zoom', em: 16 * B, escala: 1.12, suave: 8 * B - 0.1},
		// Drop: o único impacto seco do vídeo.
		{tipo: 'flash', em: DROP},
		{tipo: 'zoom', em: DROP, escala: 1.14},
		{tipo: 'zoom', em: DROP + 1 / 30, escala: 1.02, suave: 4 * B},
		...DESLIZES.map(([n, direcao]): EfeitoCamera => ({tipo: 'deslize', em: n * B, direcao})),
		...CORTES.flatMap((n, i) => deriva(n, CORTES[i + 1] ?? 57)),
		// Punchline: entra em foco; fecho em corte seco.
		{tipo: 'foco', em: 57 * B, duracao: 0.35},
		...deriva(64, 69, 1.08),
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
			sons: [
				...[16, 18, 20, 22].map((n) => n * B).map((em) => ({em, som: 'tick' as const})),
				...DESLIZES.map(([n]) => ({em: n * B - 0.12, som: 'whoosh' as const, ganho: 0.45})),
			],
		},
		// Valor minimalista: o 2 chega por desfoque no drop e o brilho estoura 2 batidas depois (sons da montagem vão aqui também).
		{
			tipo: 'valorLife',
			de: DROP,
			ate: 29 * B - 0.12,
			kicker: 'MAIS DE',
			prefixo: 'R$',
			numero: '10',
			palavra: 'milhões',
			sub: 'faturados com o TikTok Shop',
			pousa: 26 * B,
			y: 470,
			sons: [
				{em: 26 * B, som: 'shimmer', ganho: 0.8},
				{em: 52 * B - 0.25, som: 'subida' as const, ganho: 0.6},
			],
		},
		{tipo: 'textoLife', de: 31 * B + 0.05, ate: 35 * B - 0.05, principal: 'o escritório mudou', y: 620},
		// Punchline falada: o texto do início no lugar da legenda, com brilho para ler.
		// Pergunta do Danilo pra Paloma, inserida antes da resposta (2,17 s a mais no vídeo: os dois textos abaixo
		// deslocam +2,17 s e o drift final da câmera também, pra não sair do ponto).
		{tipo: 'textoLife', de: 27.8, ate: 29.9, principal: 'fala, Paloma, tá curtindo aqui o evento?', y: 960, brilho: true},
		{tipo: 'textoLife', de: 29.97, ate: 30.97, principal: 'ô, como que tá?', y: 960, brilho: true},
		{tipo: 'textoLife', de: 30.95, ate: 33.27, principal: 'tá muito ruim aqui, hein, velho', y: 960, brilho: true},
		{tipo: 'textoLife', de: 64 * B + 0.1, ate: 69 * B - 0.1, kicker: 'TUDO COMEÇOU COM O', principal: 'TikTok Shop', sub: '@danilowtts', y: 540},
	],
};
