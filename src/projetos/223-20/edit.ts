import type {Cena, Edit} from '../../motor/plano';
import type {Trecho} from '../../motor/palavras';
import {punches, semPausas} from '../223/comum';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// 223-20 (tema Entrevista): corte do IMG_0355 (57–100 s da gravação; video.mp4 recortado com scripts/recortar.mjs).
// Danilow (camisa preta, à esquerda) e a empresária de Caldas Novas (colete branco, à direita).
// História: gancho "a gente chega em Caldas Novas e não entende como esses lojistas sobrevivem" → "é literalmente isso" →
// "o turismo fica num canto só e o porta a porta já não funciona" → "a hub junta especialistas do TikTok pra ensinar, conduzir e
// fazer a empresa vender" → "o pontapé inicial dentro do shopping" → cartão final.

const TRECHOS: Trecho[] = [
	[2.6, 5.26], // gancho: "a gente chega em Caldas Novas e pensa que..."
	[7.0, 9.54], // "Não entende como que esses lojistas sobrevivem."
	[9.55, 10.28], // empresária: "É literalmente isso."
	[11.45, 17.54], // "É, a maioria do turismo aqui é estocado num canto só da cidade, né, o que a gente observou, pelo menos."
	[18.1, 21.12], // "E o porta-a-porta já não tá tão funcional desse jeito."
	[21.65, 27.9], // "Então aqui a forma que a gente tá trazendo é, literalmente trazendo essa hub pra cá, onde que a gente vai juntar especialistas,"
	[28.8, 32.8], // "do TikTok mesmo, pessoas que são plausíveis pra ensinar"
	[33.2, 35.5], // "e conduzir aquela empresa"
	[35.9, 38.15], // "a tá vendendo dentro do TikTok"
	[40.5, 42.46], // "o pontapé inicial pra eles dentro do shopping."
];

export const p22320: Edit = {
	pasta: 'projetos/223-20',
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
		enfase: [{palavra: 'especialistas', estilo: 'serif'}],
		falantes: (b) => [
			{de: 0, ate: b.at('literalmente') - 0.1, nome: 'DANILOW'},
			{de: b.at('literalmente') - 0.1, ate: b.at('shopping') + 0.45, nome: 'EMPRESÁRIA'},
		],
	},
	camera: (b) => {
		const danilow = (t: number) => t < b.at('literalmente') - 0.1;
		return [
			...punches(b, [], (t) => (danilow(t) ? {x: 0.32, y: 0.32} : {x: 0.66, y: 0.33})),
			{tipo: 'flash', em: b.at('sobrevivem') - 0.04},
			{tipo: 'chicote', em: b.at('literalmente') - 0.15},
			{tipo: 'flash', em: b.at('pontapé') - 0.04},
		];
	},
	cenas: (b) => {
		const fimFala = b.at('shopping') + 0.45;
		const cenas: Cena[] = [
			{
				tipo: 'medo3d',
				de: 0,
				ate: b.at('literalmente') - 0.1,
				linhas: [
					{texto: 'CALDAS NOVAS', em: b.at('Caldas'), metal: 'branco'},
					{texto: 'COMO SOBREVIVEM?', em: b.at('sobrevivem') - 0.3, metal: 'sangue', largura: 4.4},
				],
				som: 'pro_whoosh',
			},
			{
				tipo: 'alertas',
				de: b.at('maioria') - 0.4,
				ate: b.at('Então') - 0.05,
				itens: [
					{texto: 'TURISMO NUM CANTO SÓ', em: b.at('estocado'), icone: 'alerta'},
					{texto: 'PORTA A PORTA NÃO FUNCIONA', em: b.at('funcional'), icone: 'x'},
				],
				variante: 'escura',
				esconderLegenda: true,
				som: 'pro_tick',
			},
			{
				tipo: 'selo',
				de: b.at('Então') - 0.05,
				ate: b.at('pessoas') - 0.3,
				texto: 'A HUB',
				chip: 'ESPECIALISTAS DO TIKTOK',
				emChip: b.at('especialistas'),
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			{
				tipo: 'chips',
				de: b.at('pessoas') - 0.3,
				ate: b.at('pontapé') - 0.4,
				itens: [
					{texto: 'ENSINAR', em: b.at('ensinar')},
					{texto: 'CONDUZIR', em: b.at('conduzir')},
					{texto: 'VENDER NO TIKTOK', em: b.at('vendendo')},
				],
				numerado: true,
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
			},
			{
				tipo: 'motion3d',
				modelo: 'barreira',
				de: b.at('pontapé') - 0.4,
				ate: fimFala + 0.25,
				linhas: [
					{texto: 'O PONTAPÉ', em: b.at('pontapé'), metal: 'branco'},
					{texto: 'INICIAL', em: b.at('inicial'), metal: 'ouro'},
				],
				marcos: [b.at('pontapé') + 0.2],
				chip: 'DENTRO DO SHOPPING',
				som: 'pro_whoosh',
				sons: [{em: b.at('pontapé') + 0.2, som: 'pro_quebra', ganho: 0.5}],
			},
			{tipo: 'final', de: fimFala + 0.3, ate: fimFala + 3.0, marca: 'MÉTODO', linha2: 'M4', tres: true, som: 'pro_logo'},
		];
		return cenas;
	},
};
