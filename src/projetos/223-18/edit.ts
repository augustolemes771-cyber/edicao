import type {Cena, Edit} from '../../motor/plano';
import type {Trecho} from '../../motor/palavras';
import {punches, semPausas} from '../223/comum';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// 223-18 (tema Entrevista): corte do IMG_0338 (44–107 s da gravação; video.mp4 recortado com scripts/recortar.mjs).
// Danilow (camisa preta, à direita) e uma creator da agência (à esquerda).
// História: gancho "a meta de novembro e dezembro: triplicar" → "tá ótimo, mas sempre pode melhorar" → "só foi aumentando" →
// "supriu as expectativas?" → "supriu, e ainda tem muito caminho" → "o objetivo da agência: contrato com mais marcas, mais
// oportunidade" → "fazer vocês ganharem dinheiro, voarem. Não tem plano B" → cartão final.

const TRECHOS: Trecho[] = [
	[3.1, 8.16], // gancho: "nós vamo botar a meta esse mês, novembro, dezembro, nós temos que triplicar esse resultado, né? Não, triplicar."
	[9.6, 11.95], // "Não, tá ótimo, mas sempre pode melhorar."
	[13.66, 16.8], // "É, porque só foi aumentando. E foi aumentando muito."
	[20.1, 23.1], // "você supriu as suas expectativas"
	[24.2, 26.05], // "ou foi a mais ou foi a menos?"
	[26.15, 27.9], // "Não, supriu. Supriu."
	[28.55, 32.85], // "me fez ter conhecimento, entender que ainda tem muito caminho pra percorrer"
	[43.38, 48.3], // "nosso objetivo é fazer pra vocês contrato com mais marcas"
	[48.72, 50.25], // "Abrir mais oportunidade pra vocês."
	[54.3, 61.55], // "é fazer vocês ganharem dinheiro, é fazer vocês voarem. Tem que ganhar dinheiro, tem que prosperar. Não tem outro jeito, não tem plano B."
];

export const p22318: Edit = {
	pasta: 'projetos/223-18',
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
		enfase: [{palavra: 'prosperar', estilo: 'serif'}],
		falantes: (b) => [{de: b.at('você') - 0.1, ate: b.at('supriu', 2) - 0.3, nome: 'PERGUNTA'}],
	},
	camera: (b) => {
		const cheias: Trecho[] = [
			[b.at('você') - 0.1, b.at('supriu', 2) - 0.3],
			[b.at('conhecimento') - 0.4, b.at('objetivo') - 0.4],
		];
		return [
			...punches(b, cheias, () => ({x: 0.5, y: 0.39})),
			{tipo: 'flash', em: b.at('triplicar') - 0.04},
			{tipo: 'chicote', em: b.at('objetivo') - 0.4},
			{tipo: 'flash', em: b.at('B') - 0.04},
		];
	},
	cenas: (b) => {
		const fimFala = b.at('B') + 0.5;
		const cenas: Cena[] = [
			{
				tipo: 'numero3d',
				de: 0,
				ate: b.at('ótimo') - 0.6,
				texto: '3X',
				rotulo: 'A META',
				abaixo: 'NOVEMBRO E DEZEMBRO',
				em: b.at('triplicar'),
				y: 400,
				esconderLegenda: true,
				som: 'pro_whoosh',
				sons: [{em: b.at('triplicar'), som: 'pro_pop', ganho: 0.7}],
			},
			{
				tipo: 'textoLife',
				de: b.at('ótimo') - 0.6,
				ate: b.at('aumentando') - 0.5,
				kicker: 'TÁ ÓTIMO, MAS',
				principal: 'sempre pode melhorar',
				y: 330,
				brilho: true,
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
			},
			{
				tipo: 'motion3d',
				modelo: 'positivoLive',
				de: b.at('aumentando') - 0.5,
				ate: b.at('você') - 0.1,
				linhas: [
					{texto: 'SÓ AUMENTANDO', em: b.at('aumentando'), metal: 'branco'},
					{texto: 'E MUITO', em: b.at('muito'), metal: 'ouro'},
				],
				troca: true,
				som: 'pro_whoosh',
			},
			{
				tipo: 'frase',
				de: b.at('você') - 0.1,
				ate: b.at('supriu', 2) - 0.3,
				palavras: [
					{texto: 'SUPRIU AS', em: b.at('supriu')},
					{texto: 'expectativas?', em: b.at('expectativas'), destaque: true},
				],
				som: 'pro_tick',
			},
			{
				tipo: 'selo',
				de: b.at('supriu', 2) - 0.3,
				ate: b.at('conhecimento') - 0.4,
				texto: 'SUPRIU',
				chip: 'E VAI MAIS',
				emChip: b.at('supriu', 3),
				esconderLegenda: true,
				som: 'pro_pop',
			},
			{
				tipo: 'peca',
				nome: 'e2Atalho',
				modo: 'cheia',
				de: b.at('conhecimento') - 0.4,
				ate: b.at('objetivo') - 0.4,
				esconderLegenda: true,
				som: 'pro_whoosh',
				dados: {
					marcos: [b.at('caminho') - 0.4, b.at('percorrer')],
					linhas: [
						{texto: 'MUITO', em: b.at('muito', 2), metal: 'branco'},
						{texto: 'CAMINHO', em: b.at('caminho'), metal: 'ouro'},
					],
				},
			},
			{
				tipo: 'cards3d',
				de: b.at('objetivo') - 0.4,
				ate: b.at('ganharem') - 0.6,
				itens: [
					{texto: 'CONTRATO COM MARCAS', em: b.at('marcas')},
					{texto: 'MAIS OPORTUNIDADE', em: b.at('oportunidade')},
				],
				som: 'pro_swipe',
			},
			{tipo: 'aviao', de: b.at('voarem') - 0.6, ate: b.at('prosperar') + 0.3, y: 300, som: 'pro_whoosh'},
			{
				tipo: 'medo3d',
				de: b.say('Não tem outro').inicio - 0.05,
				ate: fimFala + 0.25,
				linhas: [
					{texto: 'NÃO TEM', em: b.say('Não tem outro').inicio, metal: 'branco'},
					{texto: 'PLANO B', em: b.at('plano'), metal: 'ouro'},
				],
				som: 'pro_whoosh',
				sons: [{em: b.at('plano'), som: 'pro_pop', ganho: 0.6}],
			},
			{tipo: 'final', de: fimFala + 0.3, ate: fimFala + 3.0, marca: 'MÉTODO', linha2: 'M4', tres: true, som: 'pro_logo'},
		];
		return cenas;
	},
};
