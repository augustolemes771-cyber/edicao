import type {Cena, Edit} from '../../motor/plano';
import type {Trecho} from '../../motor/palavras';
import {punches, semPausas} from '../223/comum';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// 223-28 (tema Entrevista): corte do IMG_0364 (435–466 s). Nara (direita) e Danilow (esquerda).
// História: gancho "a gente faz lançamentos semanais" → "estratégias bem clichê" → "essa semana o foco é colágeno" → "mais dois
// creators livres: um no cabelo, outro no emagrecimento" → "cada um num link" → cartão final.

const TRECHOS: Trecho[] = [
	[8.3, 12.1], // "Por exemplo, meu creator, e, a gente faz lançamentos semanais."
	[3.7, 7.75], // "É, eu tenho umas estratégias minhas, assim, bem clichê, só."
	[12.8, 18.0], // "Então eu tenho, por exemplo, essa semana a gente vai focar nesse produto aqui, colágeno, só."
	[19.1, 20.72], // "Ele vai focar só no colágeno."
	[20.95, 28.4], // "Só que eu tenho mais dois creator livre, onde eu posso colocar ele no cabelo, um exemplo, e o outro no emagrecimento."
	[28.85, 30.4], // "Entende? Cada um fica num link ali."
];

export const p22328: Edit = {
	pasta: 'projetos/223-28',
	video: 'video.mp4',
	formato: 'vertical',
	verificarCurva: false,
	regraCamera: false,
	extraFim: 3.5,
	silencios: silencios as Trecho[],
	transcricao,
	trechos: () => semPausas(TRECHOS, silencios as Trecho[]),
	legenda: {
		estilo: 'mare',
		altura: 0.656,
		palavrasPorTela: 4,
		enfase: [{palavra: 'clichê', estilo: 'serif'}],
		falantes: (b) => [{de: 0, ate: b.at('ali') + 0.6, nome: 'NARA'}],
	},
	camera: (b) => [
		...punches(b, [[b.at('Cada') - 0.6, b.at('ali') + 1]], () => ({x: 0.68, y: 0.36})),
		{tipo: 'flash', em: b.at('lançamentos') - 0.04},
		{tipo: 'flash', em: b.at('emagrecimento') - 0.04},
	],
	cenas: (b) => {
		const fimFala = b.at('ali') + 0.5;
		const cenas: Cena[] = [
			{
				tipo: 'motion3d',
				modelo: 'positivoLive',
				de: 0,
				ate: b.at('estratégias') - 0.6,
				linhas: [
					{texto: 'LANÇAMENTO', em: b.at('lançamentos'), metal: 'branco'},
					{texto: 'TODA SEMANA', em: b.at('semanais'), metal: 'ouro'},
				],
				troca: true,
				chip: 'MEU CREATOR',
				som: 'pro_whoosh',
			},
			{
				tipo: 'textoLife',
				de: b.at('estratégias') - 0.6,
				ate: b.at('semana') - 1.2,
				kicker: 'AS ESTRATÉGIAS',
				principal: 'bem clichê',
				y: 330,
				brilho: true,
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
			},
			{
				tipo: 'selo',
				de: b.at('semana') - 1.2,
				ate: b.at('dois') - 1.0,
				texto: 'ESTA SEMANA: COLÁGENO',
				chip: 'FOCO TOTAL',
				emChip: b.say('Ele vai focar').inicio,
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			{
				tipo: 'cards3d',
				de: b.at('dois') - 1.0,
				ate: b.at('Cada') - 0.6,
				itens: [
					{texto: 'CREATOR 1 · COLÁGENO', em: b.at('dois')},
					{texto: 'CREATOR 2 · CABELO', em: b.at('cabelo')},
					{texto: 'CREATOR 3 · EMAGRECER', em: b.at('emagrecimento')},
				],
				som: 'pro_swipe',
			},
			{
				tipo: 'frase',
				de: b.at('Cada') - 0.6,
				ate: fimFala + 0.25,
				palavras: [
					{texto: 'CADA UM', em: b.at('Cada')},
					{texto: 'num link', em: b.at('link'), destaque: true},
				],
				som: 'pro_tick',
			},
			{tipo: 'final', de: fimFala + 0.3, ate: fimFala + 3.5, marca: 'MÉTODO', linha2: 'M4', tres: true, som: 'pro_logo'},
		];
		return cenas;
	},
};
