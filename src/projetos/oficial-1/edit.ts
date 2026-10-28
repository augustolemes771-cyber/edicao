import type {Edit} from '../../motor/plano';
import transcricao from './transcricao.json';

// Entrevista Paola (2 clipes unidos em video.mp4, 107 s → ~50 s). Rosto da Paola em x .72 y .33; entrevistador à esquerda.
const P = {x: 0.72, y: 0.33};
// Câmera alta: o rosto desce para abrir espaço ao contador no topo.
const BAIXO = {x: 0.72, y: 0.05};

// Grupo "usar todos" (ordem decidida pela IA, pela sequência da fala): IMG_5212 (1).MOV (0:00–1:13) e depois
// IMG_5213 (1).MOV (1:13–1:47, continuação: "E se não fosse o Danilo…" e o CTA). Os dois estão unidos, em HDR→SDR 1080x1920,
// em video.mp4; os cortes abaixo usam o tempo dessa união e mantêm trechos dos dois clipes.
export const FONTES = ['IMG_5212 (1).MOV', 'IMG_5213 (1).MOV'] as const;

export const oficial1: Edit = {
	pasta: 'projetos/oficial-1',
	video: 'video.mp4',
	formato: 'vertical',
	verificarCurva: false,
	regraCamera: false,
	extraFim: 3,
	legenda: {
		estilo: 'mare',
		altura: 0.656,
		palavrasPorTela: 4,
		enfase: [
			{palavra: 'TikTok', estilo: 'serif'},
			{palavra: 'chorando', estilo: 'serif'},
			{palavra: 'irmã', estilo: 'serif'},
			{palavra: 'frustrava', estilo: 'serif'},
			{palavra: 'evolução', estilo: 'serif'},
			{palavra: 'mês', estilo: 'serif'},
			{palavra: 'Danilo', estilo: 'serif'},
			{palavra: 'erro', estilo: 'riscar'},
			{palavra: 'vender', estilo: 'serif'},
		],
	},
	transcricao,
	// Tempo original. Fica: apresentação, primeira live chorando, "nunca mais", pergunta, menos de 1 mês,
	// 20 mil em GMV, "segue o Danilo", síntese e CTA. Sai: repetições, agradecimentos e o erro de gravação.
	cortes: (o) => [
		[o.say('há mais de um ano').fim + 0.12, o.at('primeira') - 0.1],
		[o.say('a minha irmã').fim + 0.15, o.say('então isso me frustrava').inicio - 0.1],
		[o.say('entrou no método').fim + 0.08, o.say('como é foi').inicio - 0.08],
		[o.say('sua evolução').fim + 0.12, o.say('faz menos de um mês').inicio - 0.1],
		[o.say('um mês que eu entrei').fim + 0.1, o.say('e aí na primeira live').inicio - 0.1],
		[o.say('do meu namorado').fim + 0.12, o.at('segue') - 0.1],
		[o.say('ele é o cara').fim + 0.1, o.say('porque de verdade').inicio - 0.1],
		[o.say('consegue vender').fim + 0.15, o.say('se você tá travado').inicio - 0.1],
	],
	camera: (b) => {
		const tentar = b.tempos('tentar tentar tentar');
		return [
			{tipo: 'foco', em: 0},
			{tipo: 'zoom', em: 0, escala: 1},
			{tipo: 'flash', em: b.at('Paola') - 0.05},
			{tipo: 'zoom', em: b.at('Paola'), escala: 1.2, x: 0.5, y: 0.33},
			{tipo: 'zoom', em: b.at('TikTok'), escala: 1.32, ...P},
			// Paola: a primeira live
			{tipo: 'chicote', em: b.at('primeira')},
			{tipo: 'zoom', em: b.at('primeira'), escala: 1.35, ...P},
			{tipo: 'zoom', em: b.at('chorando'), escala: 1.62, ...P},
			{tipo: 'zoom', em: b.at('única'), escala: 1.3, ...P},
			{tipo: 'zoom', em: b.at('irmã'), escala: 1.5, ...P},
			// Drama: empurra devagar até o close enquanto a luz cai
			{tipo: 'zoom', em: b.say('então isso me frustrava').inicio, escala: 1.2, ...P},
			{tipo: 'zoom', em: b.at('depois'), escala: 1.6, suave: 1.1, ...P},
			// Pergunta do entrevistador
			{tipo: 'chicote', em: b.say('depois que você entrou').inicio},
			{tipo: 'zoom', em: b.say('depois que você entrou').inicio, escala: 1, x: 0.5, y: 0.33},
			{tipo: 'zoom', em: b.at('evolução'), escala: 1.25, x: 0.3, y: 0.3},
			// Paola: a virada
			{tipo: 'chicote', em: b.say('faz menos de um mês').inicio},
			{tipo: 'zoom', em: b.say('faz menos de um mês').inicio, escala: 1.35, ...P},
			{tipo: 'zoom', em: b.at('mês'), escala: 1.52, ...P},
			{tipo: 'zoom', em: b.say('e aí na primeira live').inicio, escala: 1.15, ...BAIXO},
			{tipo: 'zoom', em: b.at('20'), escala: 1.3, ...BAIXO},
			{tipo: 'zoom', em: b.at('namorado'), escala: 1.45, ...BAIXO},
			{tipo: 'zoom', em: b.at('segue'), escala: 1.3, ...P},
			{tipo: 'zoom', em: b.at('Danilo'), escala: 1.48, ...P},
			// Síntese: um punch por "tentar", clarão na virada
			{tipo: 'zoom', em: b.at('frustrante'), escala: 1.22, ...P},
			{tipo: 'zoom', em: tentar[0], escala: 1.34, ...P},
			{tipo: 'zoom', em: tentar[1], escala: 1.48, ...P},
			{tipo: 'zoom', em: tentar[2], escala: 1.64, ...P},
			{tipo: 'zoom', em: b.at('achar'), escala: 1.3, ...P},
			{tipo: 'flash', em: b.say('mas quando você entra').inicio},
			{tipo: 'zoom', em: b.say('mas quando você entra').inicio, escala: 1.15, ...P},
			{tipo: 'zoom', em: b.at('outra'), escala: 1.35, ...P},
			{tipo: 'zoom', em: b.at('vender'), escala: 1.55, ...P},
			// CTA em plano aberto
			{tipo: 'chicote', em: b.say('se você tá travado').inicio},
			{tipo: 'zoom', em: b.say('se você tá travado').inicio, escala: 1, x: 0.5, y: 0.33},
		];
	},
	cenas: (b) => {
		const nunca = b.at('nunca');
		const live = b.tempos('abrir uma live')[2];
		const fimFala = b.say('vamos pra cima').fim;
		return [
			{
				tipo: 'pilula',
				de: b.at('Paola') + 0.1,
				ate: b.at('primeira') - 0.15,
				rotulo: '+1 ano de TikTok Shop',
				nome: 'Paola',
				y: 0.55,
				som: 'whoosh',
				sons: [],
			},
			{
				tipo: 'pilula',
				de: b.at('única'),
				ate: b.say('a minha irmã').fim + 0.1,
				rotulo: 'Pessoas na live:',
				nome: 'só 1',
				y: 0.55,
				som: 'tick',
			},
			{
				tipo: 'drama', tom: 'pb',
				de: b.at('depois') - 0.05,
				ate: b.say('abrir uma live').fim + 0.4,
				pequeno: 'depois desse dia',
				grande: 'NUNCA MAIS',
				em: nunca,
				apaga: live,
				...P,
				som: 'rise',
				sons: [
					{em: nunca, som: 'boom', ganho: 1},
					{em: live, som: 'glitch', ganho: 0.5},
					{em: live + 0.45, som: 'whoosh', ganho: 0.35},
				],
			},
			{
				tipo: 'aovivo',
				de: b.tempos('primeira live')[1] - 0.05,
				ate: b.at('consegui'),
				y: 0.55,
				som: 'whoosh',
			},
			{
				tipo: 'contador',
				de: b.at('20') - 0.45,
				ate: b.say('do meu namorado').fim + 0.15,
				rotulo: 'GMV',
				prefixo: 'R$',
				valor: 20,
				sufixo: 'MIL',
				em: b.at('20'),
				yTexto: 0.15,
				som: 'rise',
				sons: [{em: b.at('20') + 0.8, som: 'boom', ganho: 0.55}],
			},
			{
				tipo: 'pilula',
				de: b.at('segue'),
				ate: b.at('Danilo') + 0.6,
				rotulo: 'Siga',
				nome: 'Danilo',
				y: 0.55,
				som: 'whoosh',
				esconderLegenda: true,
			},
			{
				tipo: 'kicker',
				de: b.say('se você tá travado').inicio,
				ate: b.say('já me siga').inicio - 0.05,
				pequeno: 'travado com live?',
				grande: 'essa é a sua chance',
				emGrande: b.at('essa') - b.say('se você tá travado').inicio,
				estilo: 'ouro',
				som: 'whoosh',
			},
			{
				tipo: 'pilula',
				de: b.say('já siga a Paola').inicio,
				ate: fimFala + 0.1,
				rotulo: 'Siga',
				nome: 'Paola',
				y: 0.55,
				som: 'whoosh',
				esconderLegenda: true,
			},
			{
				tipo: 'cenario',
				de: fimFala + 0.1,
				ate: fimFala + 3,
				superficie: 'escuro',
				luz: 'janela',
				estiloTexto: 'ouro',
				pequeno: 'da live chorando a',
				grande: 'R$ 20 mil',
				abaixo: 'na primeira live com método',
				revelar: 'palavras',
				objetos: [{tipo: 'celular', x: 0, y: -0.35, escala: 1}],
				som: 'whoosh',
			},
		];
	},
};
