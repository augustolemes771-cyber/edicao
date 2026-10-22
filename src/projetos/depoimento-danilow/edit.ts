import type {Edit} from '../../motor/plano';
import transcricao from './transcricao.json';

// Depoimento de aluna da Mentoria do Danilow: 1:41 de fala reduzidos a ~55 s.
// Roteiro: gancho com resultado → dor (antes) → virada (conheceu o Danilow) → transformação
// → o que aprendeu → resultado → suporte → agradecimento → fechamento com o próximo nível.
export const depoimentoDanilow: Edit = {
	pasta: 'projetos/depoimento-danilow',
	video: 'video.mp4',
	formato: 'vertical',
	verificarCurva: false,
	regraCamera: false,
	barraProgresso: {cor: '#ffd21f'},
	transcricao,
	// Trechos que saem, no tempo original. Cada borda cai num silêncio medido no áudio
	// (energia abaixo de -38 dB), porque o tempo de palavra do Whisper erra ~0,3 s.
	cortes: [
		[2.05, 3.72], // "e de toda a equipe dele?"
		[7.85, 15.6], // "com certeza, porque a gente já vinha trabalhando com vídeo…"
		[46.05, 50.55], // "É um mercado, gente, muito além daquilo que a gente imagina"
		[58.5, 61.23], // "então é uma segurança que a equipe traz para a gente fora"
		[64.45, 67.9], // "eles estão com a gente aí no dia a dia, então olha,"
		[70.3, 75.85], // "obrigado aos meninos… foi muito bom participar… com certeza"
		[81.45, 101.24], // "que é isso que eu tenho certeza…" até o fim
	],
	legenda: {
		estilo: 'palavra',
		altura: 0.66,
		enfase: [
			{palavra: 'travada', estilo: 'caixa', cor: '#0a0a0a'},
			{palavra: 'decisão', estilo: 'grande', cor: '#ffd21f'},
			{palavra: 'medo', estilo: 'serif'},
			{palavra: 'certo', estilo: 'circulo', cor: '#22c55e'},
			{palavra: 'surreal', estilo: 'cor', cor: '#ffd21f'},
			{palavra: 'diário', estilo: 'serif'},
			{palavra: 'Danilow', estilo: 'cor', cor: '#ffd21f', ocorrencia: 3},
			{palavra: 'transformou', estilo: 'cor', cor: '#ffd21f'},
			{palavra: 'nível', estilo: 'grande', cor: '#ffd21f'},
		],
	},
	camera: (b) => [
		// Abre desfocado e entra em foco, já um pouco fechado no rosto.
		{tipo: 'foco', em: 0},
		{tipo: 'zoom', em: 0, escala: 1.12, y: 0.3},
		// Zoom diferente em cada emenda (b.emendas = quadro exato do corte): o pulo some.
		{tipo: 'zoom', em: b.emendas[0], escala: 1.35, y: 0.3},
		{tipo: 'zoom', em: b.emendas[1], escala: 1, y: 0.3},
		{tipo: 'zoom', em: b.at('travada'), escala: 1.25, y: 0.3},
		// Virada da história: clarão.
		{tipo: 'flash', em: b.say('e aí foi quando').inicio},
		{tipo: 'zoom', em: b.say('e aí foi quando').inicio, escala: 1.05, y: 0.3},
		{tipo: 'zoom', em: b.say('e foi a melhor').inicio, escala: 1.3, y: 0.3},
		{tipo: 'zoom', em: b.say('porque olha').inicio, escala: 1, y: 0.3},
		{tipo: 'zoom', em: b.at('entendendo'), escala: 1.15, y: 0.3, suave: 6},
		{tipo: 'zoom', em: b.emendas[2], escala: 1.35, y: 0.3},
		{tipo: 'zoom', em: b.say('a gente sabe que').inicio, escala: 1.15, y: 0.3},
		{tipo: 'zoom', em: b.emendas[3], escala: 1, y: 0.3},
		{tipo: 'zoom', em: b.emendas[4], escala: 1.3, y: 0.3},
		// Ato final: chicote e aproximação lenta até o fim.
		{tipo: 'chicote', em: b.emendas[5]},
		{tipo: 'zoom', em: b.emendas[5], escala: 1.05, y: 0.3},
		{tipo: 'zoom', em: b.say('transformou a nossa mente').inicio, escala: 1.3, y: 0.3, suave: 3},
	],
	cenas: (b) => [
		// Gancho: o resultado em primeiro lugar.
		{
			tipo: 'kicker',
			pequeno: 'foi um',
			grande: 'divisor de águas',
			emGrande: b.at('divisor'),
			de: b.at('foi'),
			ate: b.at('dentro'),
		},
		// Transformação.
		{
			tipo: 'kicker',
			pequeno: 'mente totalmente',
			grande: 'transformada',
			emGrande: b.at('transformada'),
			de: b.at('mente'),
			ate: b.say('Porque a gente').inicio,
		},
		// O que aprendeu, item por item na hora da fala.
		{
			tipo: 'checklist',
			titulo: 'Na mentoria:',
			de: b.at('entendendo'),
			ate: b.at('Hoje'),
			itens: [
				{texto: 'Como funciona o algoritmo', em: b.at('algoritmo')},
				{texto: 'Como escolher o produto certo', em: b.at('produto')},
				{texto: 'Live shop no TikTok Shop', em: b.at('TikTok')},
			],
		},
		// Agradecimento.
		{
			tipo: 'kicker',
			pequeno: 'valeu muito',
			grande: 'a pena',
			emGrande: b.at('pena'),
			de: b.at('valeu'),
			ate: b.at('obrigado'),
		},
	],
};
