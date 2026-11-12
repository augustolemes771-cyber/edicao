import type {Cena, Edit} from '../../motor/plano';
import type {Trecho} from '../../motor/palavras';
import {punches, semPausas} from '../223/comum';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// 223-9 (tema Entrevista): corte do IMG_0335 (80–128 s da gravação; video.mp4 recortado com scripts/recortar.mjs).
// O empresário (camisa xadrez, à esquerda) pergunta; Danilow (camisa preta, à direita) responde.
// História: gancho "o TikTok é o algoritmo mais inteligente do mundo" → "a dúvida: o algoritmo vai entregar? eu pago
// patrocinado?" → "todo vídeo com link, o TikTok sabe quem é o público daquele produto" → "porque o público já engajou: curtida,
// 5, 10 segundos assistindo" → "mesa, computador, televisão, roupa: entrega pro público certo" → cartão final.

const TRECHOS: Trecho[] = [
	[13.6, 17.26], // gancho: "TikTok Shop, TikTok é a plataforma algoritmo mais inteligente do mundo."
	[2.62, 6.2], // "A dúvida que não quer calar: o algoritmo vai entregar,"
	[11.8, 13.14], // "Eu pago patrocinado, como é que é isso?"
	[17.65, 24.2], // "Então todo vídeo que você posta, que você coloca o link do produto, o TikTok sabe quem é o público daquele produto."
	[24.2, 29.0], // "Por quê? Porque em algum momento o público alvo já engajou com esse produto."
	[29.65, 31.4], // "Ou você engajou, ou você deu uma curtida,"
	[33.72, 38.7], // "você ficou cinco, dez segundos ali, então ele já entrega pro público certo."
	[38.95, 44.7], // "Então cê pode, cara, vender uma mesa, como vender um computador, uma televisão e pra roupa."
	[44.98, 46.38], // "Ele vai entregar pro público certo."
];

export const p2239: Edit = {
	pasta: 'projetos/223-9',
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
		enfase: [{palavra: 'link', estilo: 'serif'}],
		falantes: (b) => [
			{de: b.at('dúvida') - 0.3, ate: b.at('Então') - 0.05, nome: 'PERGUNTA'},
			{de: b.at('Então') - 0.05, ate: b.at('certo', 2) + 0.5, nome: 'DANILOW'},
		],
	},
	camera: (b) => {
		const pergunta = (t: number) => t >= b.at('dúvida') - 0.3 && t < b.at('Então') - 0.05;
		const cheias: Trecho[] = [
			[0, b.at('dúvida') - 0.3],
			[b.say('Ele vai entregar').inicio - 0.05, b.at('certo', 2) + 1],
		];
		return [
			...punches(b, cheias, (t) => (pergunta(t) ? {x: 0.36, y: 0.36} : {x: 0.62, y: 0.35})),
			{tipo: 'chicote', em: b.at('dúvida') - 0.3},
			{tipo: 'chicote', em: b.at('Então') - 0.05},
			{tipo: 'flash', em: b.at('sabe') - 0.04},
			{tipo: 'flash', em: b.at('certo', 2) - 0.04},
		];
	},
	cenas: (b) => {
		const fimFala = b.at('certo', 2) + 0.45;
		const cenas: Cena[] = [
			// Gancho: o algoritmo mais inteligente do mundo
			{
				tipo: 'motion3d',
				modelo: 'positivoIa',
				cheia: true,
				de: 0,
				ate: b.at('dúvida') - 0.3,
				linhas: [
					{texto: 'O ALGORITMO', em: b.at('algoritmo'), metal: 'branco'},
					{texto: 'MAIS INTELIGENTE', em: b.at('inteligente'), metal: 'ouro'},
				],
				troca: true,
				marcos: [b.at('inteligente')],
				chip: 'DO MUNDO',
				som: 'pro_whoosh',
				sons: [{em: b.at('inteligente'), som: 'pro_pop', ganho: 0.6}],
			},
			{
				tipo: 'textoLife',
				de: b.at('dúvida') - 0.3,
				ate: b.at('pago') - 0.3,
				kicker: 'A DÚVIDA',
				principal: 'o algoritmo entrega?',
				y: 330,
				brilho: true,
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
			},
			{
				tipo: 'alertas',
				de: b.at('pago') - 0.3,
				ate: b.at('Então') - 0.05,
				itens: [{texto: 'PAGAR PATROCINADO?', em: b.at('pago'), icone: 'alerta'}],
				variante: 'escura',
				esconderLegenda: true,
				som: 'pro_tick',
			},
			// O link acha o público do produto
			{
				tipo: 'peca',
				nome: 'p223Algoritmo',
				de: b.at('Então') - 0.05,
				ate: b.say('Por quê').inicio - 0.05,
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
				dados: {marcos: [b.at('sabe'), b.say('público daquele').inicio], texto: 'O PÚBLICO DO PRODUTO'},
				sons: [{em: b.at('sabe'), som: 'pro_swipe', ganho: 0.6}],
			},
			{
				tipo: 'selo',
				de: b.say('Por quê').inicio - 0.05,
				ate: b.at('Ou') - 0.05,
				texto: 'JÁ ENGAJOU',
				chip: 'PÚBLICO-ALVO',
				emChip: b.at('alvo'),
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			{
				tipo: 'chips',
				de: b.at('Ou') - 0.05,
				ate: b.say('cê pode').inicio - 0.35,
				itens: [
					{texto: 'UMA CURTIDA', em: b.at('curtida')},
					{texto: '5, 10 SEGUNDOS ASSISTINDO', em: b.at('cinco')},
					{texto: 'PÚBLICO CERTO', em: b.at('certo')},
				],
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
				sons: [{em: b.at('certo'), som: 'pro_tick', ganho: 0.5}],
			},
			{
				tipo: 'cards3d',
				de: b.say('cê pode').inicio - 0.3,
				ate: b.say('Ele vai entregar').inicio - 0.05,
				itens: [
					{texto: 'MESA', em: b.at('mesa')},
					{texto: 'COMPUTADOR', em: b.at('computador')},
					{texto: 'TELEVISÃO', em: b.at('televisão')},
					{texto: 'ROUPA', em: b.at('roupa')},
				],
				som: 'pro_swipe',
			},
			{
				tipo: 'frase',
				de: b.say('Ele vai entregar').inicio - 0.05,
				ate: fimFala + 0.25,
				palavras: [
					{texto: 'PRO PÚBLICO', em: b.say('Ele vai entregar').inicio + 0.4},
					{texto: 'certo.', em: b.at('certo', 2), destaque: true},
				],
				som: 'pro_pop',
			},
			{tipo: 'final', de: fimFala + 0.3, ate: fimFala + 3.0, marca: 'MÉTODO', linha2: 'M4', tres: true, som: 'pro_logo'},
		];
		return cenas;
	},
};
