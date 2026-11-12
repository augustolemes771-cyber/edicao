import type {Cena, Edit} from '../../motor/plano';
import type {Trecho} from '../../motor/palavras';
import {punches, semPausas} from '../223/comum';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// 223-15 (tema Entrevista): corte do IMG_0355 (132–175 s da gravação; video.mp4 recortado com scripts/recortar.mjs).
// A empresária de Caldas Novas (colete branco, à direita) e o Danilow (camisa preta, à esquerda).
// História: gancho "nos shoppings, o que a gente vê é vendedor escorado no balcão" → "8 vendedores conversando, olhando
// WhatsApp" → "pega um celular, liga uma live e põe a galera pra trabalhar" → "loja física é limitada" → "Caldas Novas: 100 mil
// habitantes; TikTok Shop: 100 milhões de usuários" → "escala absurda" → "5 bi em vendas" → cartão final.

const TRECHOS: Trecho[] = [
	[2.88, 6.98], // gancho: "é o que a gente vê hoje dentro dos shoppings é vendedor escorado no balcão, né, Danilo."
	[7.68, 14.12], // "cê vai numa loja hoje, tem oito vendedores, às vezes sete ali, tão conversando, trocando ideia, olhando WhatsApp."
	[14.33, 19.82], // "Cê pode, tipo, pegar um celular, colocar internet, ligar uma live e colocar a galera pra trabalhar, né."
	[20.25, 23.15], // "Até porque loja física é muito limitado."
	[23.25, 27.32], // "Caldas Novas tá sendo cem mil habitantes, às vezes recebe mais outros cem mil turistas."
	[27.97, 30.8], // "TikTok Shop, nós temos cem milhões de usuários"
	[31.3, 36.36], // "cadastrados no TikTok, então é uma capacidade de escala absurda, né."
	[37.0, 41.26], // "E mais de cinco bi aí de vendas já geradas dentro do TikTok."
];

export const p22315: Edit = {
	pasta: 'projetos/223-15',
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
		enfase: [{palavra: 'galera', estilo: 'serif'}],
		falantes: (b) => [
			{de: 0, ate: b.at('loja') - 0.6, nome: 'EMPRESÁRIA'},
			{de: b.at('loja') - 0.6, ate: b.say('dentro do TikTok').fim + 0.1, nome: 'DANILOW'},
		],
	},
	camera: (b) => {
		const cheias: Trecho[] = [[b.at('Caldas') - 0.05, b.at('cadastrados') - 0.05]];
		return [
			...punches(b, cheias, (t) => (t < b.at('loja') - 0.6 ? {x: 0.68, y: 0.33} : {x: 0.32, y: 0.32})),
			{tipo: 'chicote', em: b.at('loja') - 0.6},
			{tipo: 'flash', em: b.at('live') - 0.04},
			{tipo: 'flash', em: b.at('cinco') - 0.04},
		];
	},
	cenas: (b) => {
		const fimFala = b.say('dentro do TikTok').fim + 0.1;
		const cenas: Cena[] = [
			{
				tipo: 'textoLife',
				de: 0,
				ate: b.at('loja') - 0.6,
				kicker: 'NOS SHOPPINGS',
				principal: 'vendedor escorado no balcão',
				y: 330,
				brilho: true,
				palavras: [b.at('vendedor'), b.at('escorado'), b.at('no'), b.at('balcão')],
				esconderLegenda: true,
				som: 'pro_whoosh',
			},
			{
				tipo: 'contador',
				de: b.at('loja') - 0.6,
				ate: b.at('conversando') - 0.3,
				rotulo: 'VENDEDORES',
				valor: 8,
				em: b.at('oito') - 0.3,
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			{
				tipo: 'notificacoes',
				de: b.at('conversando') - 0.3,
				ate: b.at('pegar') - 0.5,
				icone: 'mensagem',
				itens: [
					{titulo: 'Grupo da família', texto: 'kkkkkk', em: b.at('trocando')},
					{titulo: 'Amigo', texto: 'Bora no churrasco?', em: b.at('WhatsApp')},
				],
				y: 1000,
				esconderLegenda: true,
				somItem: 'pro_msg',
				ganhoItem: 0.45,
			},
			{
				tipo: 'motion3d',
				modelo: 'celularInternet',
				de: b.at('pegar') - 0.5,
				ate: b.at('Até') - 0.05,
				linhas: [
					{texto: 'UM CELULAR', em: b.at('celular'), metal: 'branco'},
					{texto: 'UMA LIVE', em: b.at('live'), metal: 'ouro'},
				],
				troca: true,
				chip: 'A GALERA VENDENDO',
				som: 'pro_whoosh_curto',
			},
			{
				tipo: 'alertas',
				de: b.at('Até') - 0.05,
				ate: b.at('Caldas') - 0.05,
				itens: [{texto: 'LOJA FÍSICA É LIMITADA', em: b.at('física'), icone: 'alerta'}],
				variante: 'escura',
				esconderLegenda: true,
				som: 'pro_tick',
			},
			// 100 mil habitantes × 100 milhões de usuários
			{
				tipo: 'peca',
				nome: 'p223Escala',
				modo: 'cheia',
				de: b.at('Caldas') - 0.05,
				ate: b.at('cadastrados') - 0.05,
				esconderLegenda: true,
				som: 'pro_whoosh',
				dados: {
					marcos: [b.at('cem'), b.at('milhões')],
					itens: [
						{texto: '100 MIL', sub: 'habitantes', em: b.at('cem')},
						{texto: '100 MILHÕES', sub: 'de usuários', em: b.at('milhões')},
					],
				},
				sons: [{em: b.at('milhões'), som: 'pro_pop', ganho: 0.7}],
			},
			{
				tipo: 'selo',
				de: b.at('cadastrados') - 0.05,
				ate: b.at('cinco') - 0.5,
				texto: 'ESCALA ABSURDA',
				chip: 'TIKTOK SHOP',
				emChip: b.at('absurda'),
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			{
				tipo: 'numero3d',
				de: b.at('cinco') - 0.5,
				ate: fimFala + 0.25,
				texto: 'R$ 5 BI',
				rotulo: 'MAIS DE',
				abaixo: 'EM VENDAS NO TIKTOK',
				em: b.at('cinco'),
				y: 400,
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [{em: b.at('bi'), som: 'pro_pop', ganho: 0.7}],
			},
			{tipo: 'final', de: fimFala + 0.3, ate: fimFala + 3.0, marca: 'MÉTODO', linha2: 'M4', tres: true, som: 'pro_logo'},
		];
		return cenas;
	},
};
