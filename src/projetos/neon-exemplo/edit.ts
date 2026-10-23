import type {Edit} from '../../motor/plano';
import transcricao from './transcricao.json';

// Demonstração do estilo neon (desmontagem-2, ref. 2): legenda branca pequena com a palavra-chave
// grande em verde-limão, risco vermelho, anel no rosto, visor REC, alertas e glitch de listras.
// Fala sintética, sem vídeo: a câmera é um quadro de espera.
export const neonExemplo: Edit = {
	pasta: 'projetos/neon-exemplo',
	formato: 'vertical',
	duracao: 33,
	verificarCurva: false,
	regraCamera: false,
	transcricao,
	legenda: {
		estilo: 'neon',
		altura: 0.42,
		enfase: [
			{palavra: 'conteúdo', estilo: 'grande'},
			{palavra: 'tempo', estilo: 'riscar'},
			{palavra: 'desculpa', estilo: 'grande'},
			{palavra: 'controlo', estilo: 'grande'},
			{palavra: 'emoção', estilo: 'riscar'},
			{palavra: 'razão', estilo: 'grande'},
			{palavra: 'Brasil', estilo: 'grande'},
			{palavra: 'pertence', estilo: 'grande'},
		],
	},
	camera: (b) => [
		{tipo: 'zoom', em: b.at('Eu'), escala: 1.2},
		{tipo: 'listras', em: b.at('Essa')},
		{tipo: 'zoom', em: b.at('Essa'), escala: 1},
		{tipo: 'zoom', em: b.at('Mas'), escala: 1.3},
		{tipo: 'zoom', em: b.say('Uma das').inicio, escala: 1},
	],
	cenas: (b) => [
		{tipo: 'anel', x: 0.5, y: 0.3, raio: 0.28, de: b.at('Mas'), ate: b.at('Eu', 2)},
		{tipo: 'rec', de: b.at('Eu', 2), ate: b.say('Uma das').inicio},
		{
			tipo: 'alertas',
			de: b.at('E'),
			ate: b.at('Talvez'),
			itens: [
				{texto: 'sofreu ataques', em: b.at('ataques')},
				{texto: 'sofreu críticas', em: b.at('críticas'), icone: 'x'},
			],
		},
	],
};
