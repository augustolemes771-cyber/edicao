import type {Cena, Edit} from '../../motor/plano';
import type {Trecho} from '../../motor/palavras';
import {punches, semPausas} from '../223/comum';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// 223-23 (tema Entrevista): corte do IMG_0364 (0–46 s da gravação; video.mp4 recortado com scripts/recortar.mjs).
// A Nara (colete branco, à direita) conta a vinda dos EUA para o Brasil; Danilow (camisa preta, à esquerda) ouve.
// História: gancho "ganho em dólar? Vou ganhar em real?" → "eu já fazia TikTok Shop dos EUA daqui do Brasil, vendia conhaque" →
// "em julho de 2025 os EUA bloquearam" → "todo mundo veio pro Brasil em agosto" → "desde então, TikTok Shop Brasil" → "todo
// mundo com o pé atrás" → cartão final.

const TRECHOS: Trecho[] = [
	[37.72, 40.98], // gancho: "com eu ganho em dólar? Vou ganhar em real?"
	[1.9, 5.9], // "É, veio pra cá em maio e eu fazia já Estados Unidos aqui do Brasil."
	[6.18, 10.52], // "Então eu fui fazer TikTok Shop Estados Unidos, aqui do Brasil, vendia conhaque."
	[16.84, 17.98], // "Julho de 2025,"
	[20.36, 25.37], // "os Estados Unidos bloqueou essa parada de rodar IA lá de outro país, a galera tirando dólar do país deles"
	[25.4, 28.12], // "Não tava curtindo muito e aí bloquearam isso."
	[28.1, 33.68], // "E a gente, todo mundo, é, aqui pro Brasil em agosto de 2025, do ano passado."
	[34.5, 37.72], // "É, desde, desde então a gente tá aqui no TikTok Shop Brasil."
	[41.38, 42.42], // "Todo mundo assim, com o pé atrás,"
];

export const p22323: Edit = {
	pasta: 'projetos/223-23',
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
		enfase: [{palavra: 'conhaque', estilo: 'serif'}],
		falantes: (b) => [{de: b.at('veio') - 0.3, ate: b.at('atrás') + 0.5, nome: 'NARA'}],
	},
	camera: (b) => {
		const cheias: Trecho[] = [[0, b.at('veio') - 0.3]];
		return [
			...punches(b, cheias, () => ({x: 0.68, y: 0.36})),
			{tipo: 'flash', em: b.at('Julho') - 0.04},
			{tipo: 'flash', em: b.at('agosto') - 0.04},
		];
	},
	cenas: (b) => {
		const fimFala = b.at('atrás') + 0.5;
		const cenas: Cena[] = [
			{
				tipo: 'frase',
				de: 0,
				ate: b.at('veio') - 0.3,
				palavras: [
					{texto: 'GANHO EM DÓLAR?', em: b.at('dólar') - 0.4},
					{texto: 'ou em real?', em: b.at('real'), destaque: true},
				],
				som: 'pro_whoosh',
			},
			{
				tipo: 'cards3d',
				de: b.at('veio') - 0.3,
				ate: b.at('fui') - 0.3,
				itens: [
					{texto: 'TIKTOK SHOP EUA', em: b.at('Estados')},
					{texto: 'DAQUI DO BRASIL', em: b.at('Brasil')},
				],
				som: 'pro_swipe',
			},
			{
				tipo: 'selo',
				de: b.at('fui') - 0.3,
				ate: b.at('Julho') - 0.05,
				texto: 'VENDIA CONHAQUE',
				chip: 'NOS EUA',
				emChip: b.at('conhaque'),
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			{
				tipo: 'medo3d',
				de: b.at('Julho') - 0.05,
				ate: b.at('Não') - 0.05,
				linhas: [
					{texto: 'JULHO DE 2025', em: b.at('Julho'), metal: 'branco'},
					{texto: 'BLOQUEADO', em: b.at('bloqueou'), metal: 'sangue'},
				],
				som: 'pro_whoosh',
			},
			{
				tipo: 'alertas',
				de: b.at('Não') - 0.05,
				ate: b.say('E a gente').inicio - 0.05,
				itens: [{texto: 'OS EUA BLOQUEARAM', em: b.at('bloquearam'), icone: 'x'}],
				variante: 'vermelha',
				esconderLegenda: true,
				som: 'pro_tick',
			},
			{tipo: 'aviao', de: b.say('E a gente').inicio - 0.05, ate: b.at('desde') - 0.3, y: 300, som: 'pro_whoosh'},
			{
				tipo: 'selo',
				de: b.at('desde') - 0.3,
				ate: b.at('pé') - 0.9,
				texto: 'TIKTOK SHOP BRASIL',
				chip: 'DESDE AGOSTO',
				emChip: b.at('desde') + 0.3,
				esconderLegenda: true,
				som: 'pro_pop',
			},
			{
				tipo: 'textoLife',
				de: b.at('pé') - 0.9,
				ate: fimFala + 0.25,
				kicker: 'TODO MUNDO',
				principal: 'com o pé atrás',
				y: 330,
				brilho: true,
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
			},
			{tipo: 'final', de: fimFala + 0.3, ate: fimFala + 3.0, marca: 'MÉTODO', linha2: 'M4', tres: true, som: 'pro_logo'},
		];
		return cenas;
	},
};
