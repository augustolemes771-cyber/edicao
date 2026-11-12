import type {Cena, Edit} from '../../motor/plano';
import type {Trecho} from '../../motor/palavras';
import {punches, semPausas} from '../223/comum';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// 223-11 (tema Entrevista): corte do IMG_0338 (1–46 s da gravação; video.mp4 recortado com scripts/recortar.mjs).
// Danilow (camisa preta, à direita) pergunta; uma creator da agência (à esquerda) conta o antes e o agora.
// História: gancho "faz tudo: eu gravo, eles fazem tudo, e o dinheiro chega" → "antes do TikTok Shop cê fazia o quê?" →
// produtos físicos, lead, WhatsApp → logística, gestor, grana, anúncio → mais risco, mais dificuldade → "superou todas as
// expectativas" → "leva menos tempo, tem mais tempo pra você" → "gostando de trabalhar com a M4? Pra mim é melhor" → cartão final.

const TRECHOS: Trecho[] = [
	[39.25, 44.1], // gancho: "Faz tudo, eu gravo, eles fazem tudo. Eu gravo. E o dinheiro chega. E o dinheiro chega."
	[1.9, 4.05], // "Antes do, do TikTok Shop cê fazia o que?"
	[6.19, 11.58], // "eu te-tinha produtos físicos, trabalhava no digital, só que outra plataforma, lead diferente, contato WhatsApp totalmente diferente."
	[14.3, 20.25], // "levava mais tempo, porque tinha logística, tinha gestor, grana, porque tinha que subir anúncio."
	[20.3, 23.85], // "Corria mais risco. É, corria risco, mais dificuldade."
	[24.2, 31.26], // "Então, assim, esse mercado agora pra mim tá sendo novo, mas superou todas as expectativas."
	[31.26, 33.62], // "Leva menos tempo, tem mais tempo pra você."
	[36.04, 38.98], // "Cê tá gostando então de trabalhar com a M4? Eu tô, pra mim é melhor."
];

export const p22311: Edit = {
	pasta: 'projetos/223-11',
	video: 'video.mp4',
	formato: 'vertical',
	verificarCurva: false,
	regraCamera: false,
	extraFim: 3.0,
	silencios: silencios as Trecho[],
	transcricao,
	trechos: () => semPausas(TRECHOS, silencios as Trecho[]),
	legenda: {
		estilo: 'mare',
		altura: 0.656,
		palavrasPorTela: 4,
		enfase: [
			{palavra: 'expectativas', estilo: 'serif'},
			{palavra: 'físicos', estilo: 'serif'},
		],
		falantes: (b) => [
			{de: b.at('Antes') - 0.05, ate: b.at('produtos') - 0.3, nome: 'PERGUNTA'},
			{de: b.at('produtos') - 0.3, ate: b.at('Leva') - 0.05, nome: 'CREATOR'},
		],
	},
	camera: (b) => {
		const pergunta = (t: number) => (t >= b.at('Antes') - 0.05 && t < b.at('produtos') - 0.3) || t >= b.at('Cê') - 0.05;
		const cheias: Trecho[] = [[b.at('Corria') - 0.05, b.at('Então') - 0.05]];
		return [
			...punches(b, cheias, (t) => (pergunta(t) ? {x: 0.68, y: 0.38} : {x: 0.32, y: 0.4})),
			{tipo: 'flash', em: b.at('dinheiro') - 0.04},
			{tipo: 'chicote', em: b.at('Antes') - 0.05},
			{tipo: 'chicote', em: b.at('produtos') - 0.3},
			{tipo: 'flash', em: b.at('superou') - 0.04},
			{tipo: 'chicote', em: b.at('Cê') - 0.05},
		];
	},
	cenas: (b) => {
		const fimFala = b.at('melhor') + 0.45;
		const cenas: Cena[] = [
			// Gancho: eu gravo, eles fazem tudo, e o dinheiro chega
			{
				tipo: 'chips',
				de: 0,
				ate: b.at('dinheiro') - 0.1,
				itens: [
					{texto: 'EU GRAVO', em: b.at('gravo')},
					{texto: 'ELES FAZEM TUDO', em: b.at('eles')},
				],
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
			},
			{
				tipo: 'notificacoes',
				de: b.at('dinheiro') - 0.1,
				ate: b.at('Antes') - 0.05,
				itens: [
					{titulo: 'TikTok Shop', texto: 'Comissão recebida', em: b.at('dinheiro')},
					{titulo: 'TikTok Shop', texto: 'Comissão recebida', em: b.at('dinheiro', 2)},
				],
				y: 1000,
				esconderLegenda: true,
				somItem: 'pro_msg',
				ganhoItem: 0.5,
			},
			{
				tipo: 'textoLife',
				de: b.at('Antes') - 0.05,
				ate: b.at('produtos') - 0.3,
				kicker: 'ANTES DO',
				principal: 'TikTok Shop?',
				y: 330,
				brilho: true,
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
			},
			{
				tipo: 'notificacoes',
				de: b.at('produtos') - 0.3,
				ate: b.at('levava') - 0.05,
				icone: 'mensagem',
				itens: [
					{titulo: 'Lead', texto: 'Oi, ainda tem?', em: b.at('lead')},
					{titulo: 'Cliente', texto: 'Me manda o PIX?', em: b.at('WhatsApp')},
				],
				y: 1000,
				esconderLegenda: true,
				somItem: 'pro_msg',
				ganhoItem: 0.45,
			},
			{
				tipo: 'alertas',
				de: b.at('levava') - 0.05,
				ate: b.at('Corria') - 0.05,
				itens: [
					{texto: 'LOGÍSTICA', em: b.at('logística'), icone: 'alerta'},
					{texto: 'GESTOR', em: b.at('gestor'), icone: 'alerta'},
					{texto: 'GRANA', em: b.at('grana'), icone: 'alerta'},
					{texto: 'ANÚNCIO', em: b.at('anúncio'), icone: 'alerta'},
				],
				variante: 'vermelha',
				esconderLegenda: true,
				som: 'pro_tick',
			},
			{
				tipo: 'frase',
				dor: true,
				de: b.at('Corria') - 0.05,
				ate: b.at('Então') - 0.05,
				palavras: [
					{texto: 'MAIS RISCO,', em: b.at('risco')},
					{texto: 'mais dificuldade', em: b.at('dificuldade'), destaque: true},
				],
				som: 'pro_tick',
			},
			{
				tipo: 'gradeAntesDepois',
				de: b.at('Então') - 0.05,
				ate: b.at('Leva') - 0.05,
				titulo: [{texto: 'O MERCADO NOVO', em: b.at('mercado')}],
				antes: {texto: 'ANTES', em: b.at('novo'), valor: 'RISCO'},
				depois: {texto: 'AGORA', em: b.at('superou'), valor: 'SUPEROU'},
				som: 'pro_whoosh',
			},
			{
				tipo: 'peca',
				nome: 'e2Praia',
				de: b.at('Leva') - 0.05,
				ate: b.at('Cê') - 0.05,
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
				dados: {marcos: [b.at('menos'), b.say('pra você').inicio]},
			},
			{
				tipo: 'selo',
				de: b.at('Cê') - 0.05,
				ate: fimFala + 0.25,
				texto: 'COM A M4',
				chip: 'PRA MIM É MELHOR',
				emChip: b.at('melhor'),
				esconderLegenda: true,
				som: 'pro_pop',
			},
			{tipo: 'final', de: fimFala + 0.3, ate: fimFala + 3.0, marca: 'MÉTODO', linha2: 'M4', tres: true, som: 'pro_logo'},
		];
		return cenas;
	},
};
