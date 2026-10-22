import type {Edit} from '../../motor/plano';
import scribe from './scribe.json';

// Demonstração vertical com os efeitos aprendidos nas três referências
// (docs/referencias/desmontagem.md). Fala sintética, sem vídeo: a câmera é um quadro de espera.
export const reelsExemplo: Edit = {
	pasta: 'projetos/reels-exemplo',
	formato: 'vertical',
	duracao: 33,
	transcricao: scribe,
	// Num Reel de 30 s o vídeo todo é gancho: curva curta.
	curva: {t1: 12, t2: 26},
	// A curva de cobertura é a do YouTube longo; num Reel a legenda já cobre o vídeo todo.
	verificarCurva: false,
	regraCamera: false,
	legenda: {
		estilo: 'palavra',
		enfase: [
			{palavra: 'Não', estilo: 'serif', ocorrencia: 1},
			{palavra: 'tempo', estilo: 'circulo'},
			{palavra: 'desculpa', estilo: 'cor'},
			{palavra: 'não', estilo: 'caixa', ocorrencia: 3},
			{palavra: 'pertence', estilo: 'grande'},
		],
	},
	camera: (b) => [
		// Abre desfocado e entra em foco (ref. 2).
		{tipo: 'foco', em: 0},
		// Zoom em corte seco no começo de frase (ref. 1 e 3).
		{tipo: 'zoom', em: b.at('Eu'), escala: 1.35},
		{tipo: 'zoom', em: b.at('Essa'), escala: 1},
		// Clarão na troca de assunto (ref. 3).
		{tipo: 'flash', em: b.at('Mas')},
		{tipo: 'zoom', em: b.at('Mas'), escala: 1.25},
		{tipo: 'foco', em: b.at('Eu', 2), duracao: 0.35},
		{tipo: 'zoom', em: b.say('Uma das').inicio, escala: 1},
		// Zoom lento enquanto conta a história (ref. 1).
		{tipo: 'zoom', em: b.at('mesmo'), escala: 1.2, suave: 2.5},
		// Chicote na volta do cartão branco (ref. 1).
		{tipo: 'chicote', em: b.at('Talvez')},
		{tipo: 'zoom', em: b.at('Talvez'), escala: 1},
	],
	cenas: (b) => [
		// Tela escura, uma palavra por vez na hora da fala (ref. 2).
		{
			tipo: 'cartao',
			palavras: ['se', 'pergunte'],
			tempos: [b.at('se'), b.at('pergunte')],
			de: b.at('se'),
			ate: b.at('uma'),
		},
		// Dois andares com a palavra grande acendendo (ref. 2).
		{
			tipo: 'kicker',
			pequeno: 'eu',
			grande: 'Controlo isso?',
			emGrande: b.at('controlo'),
			de: b.at('Eu', 2),
			ate: b.at('Não', 2),
		},
		// Letra por letra (ref. 2).
		{tipo: 'letras', linha1: 'SÓ RAZÃO', linha2: 'ZERO EMOÇÃO', de: b.at('Só'), ate: b.say('Uma das').inicio},
		// Imagem que salta com a câmera desfocada atrás (ref. 1).
		{tipo: 'foto', src: 'foto.svg', de: b.at('Brasil'), ate: b.say('E mesmo').inicio},
		// Comentários subindo (ref. 1).
		{
			tipo: 'comentarios',
			de: b.at('ataques'),
			ate: b.say('E não é').inicio,
			itens: [
				{autor: 'instagram', texto: 'Largar no último ano? Que loucura…', em: b.at('ataques')},
				{autor: 'instagram', texto: 'Ela vai se arrepender', em: b.at('críticas')},
			],
		},
		// Cartão branco com ícone (ref. 1).
		{tipo: 'icone', src: 'icone.svg', legenda: 'E não é medicina,', de: b.say('E não é').inicio, ate: b.at('Talvez')},
		// B-roll com zoom lento; a legenda continua por cima (ref. 1).
		{tipo: 'broll', src: 'broll.jpg', de: b.at('vivendo'), ate: b.at('pertence')},
		// Respiro em preto antes da chamada final (ref. 2).
		{tipo: 'preto', de: b.at('pertence') + 0.55, ate: b.at('Me') + 0.1},
	],
};
