import type {Cena, Edit} from '../../motor/plano';
import type {Trecho} from '../../motor/palavras';
import {punches, semPausas} from '../223/comum';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// 223-3 (tema Entrevista): corte do IMG_0355 (22–223 s da gravação; video.mp4 recortado com scripts/recortar.mjs).
// Danilow (camisa preta, à esquerda) entrevista uma empresária de Caldas Novas (colete branco, à direita). Rostos em y ≈ 0,28–0,34.
// História: gancho "1.500 lives ligadas simultaneamente" (mosaico de lives) → "a cidade das Águas Quentes vai ter uma hub de
// live shopping com quantas lojas?" → "pelo menos 1.500 baias" → shopping 100% de live → toda a estrutura (cenário,
// iluminação, tudo) → "se a pessoa ainda não tá vendendo lá dentro, tá dando burrada" → cartão final.

const TRECHOS: Trecho[] = [
	[188.3, 191.88], // gancho: "Baias, ou seja, mil e quinhentas lives ligadas simultaneamente."
	[175.08, 181.72], // "Então a cidade das Águas Quentes vai ter uma hub de live shopping com quantas mil lojas?"
	[182.0, 184.6], // "Bom, a ideia é a gente colocar pelo menos"
	[186.66, 188.3], // "umas mil e quinhentas baias lá dentro."
	[6.25, 13.2], // "Esse shopping, ele é cem por cento focado em live shopping... lojas que desejam fazer live."
	[13.6, 19.02], // "Então lá a gente vai fornecer toda a estrutura pra essa pessoa, cenário, iluminação, tudo que ela precisa"
	[193.15, 199.55], // "eu acredito muito que se a pessoa ainda não tá vendendo lá dentro, ela tá dando burrada, não, Danilo."
];

export const p2233: Edit = {
	pasta: 'projetos/223-3',
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
			{palavra: 'acredito', estilo: 'serif'},
			{palavra: 'vendendo', estilo: 'serif'},
		],
		falantes: (b) => [
			{de: b.at('cidade') - 0.4, ate: b.at('Bom') - 0.05, nome: 'PERGUNTA'},
			{de: b.at('Bom') - 0.05, ate: b.at('dando') - 0.1, nome: 'EMPRESÁRIA'},
		],
	},
	camera: (b) => {
		const cheias: Trecho[] = [
			[0, b.at('cidade') - 0.4],
			[b.at('dando') - 0.1, b.at('Danilo') + 1],
		];
		return [
			...punches(b, cheias, (t) => (t < b.at('Bom') - 0.05 ? {x: 0.32, y: 0.33} : {x: 0.66, y: 0.33})),
			{tipo: 'flash', em: b.at('simultaneamente') + 0.3},
			{tipo: 'chicote', em: b.at('Bom') - 0.04},
			{tipo: 'chicote', em: b.at('Esse') - 0.04},
			{tipo: 'flash', em: b.at('burrada') - 0.04},
		];
	},
	cenas: (b) => {
		const fimFala = b.at('Danilo') + 0.45;
		const cenas: Cena[] = [
			// Gancho: 1.500 lives acendem ao mesmo tempo
			{
				tipo: 'peca',
				nome: 'p223Mosaico',
				modo: 'cheia',
				de: 0,
				ate: b.at('cidade') - 0.4,
				esconderLegenda: true,
				som: 'pro_whoosh',
				dados: {marcos: [b.at('mil'), b.at('ligadas')], texto: 'lives ao mesmo tempo'},
				sons: [{em: b.at('ligadas'), som: 'pro_pop', ganho: 0.7}],
			},
			// A pergunta: Caldas Novas, a cidade das Águas Quentes
			{
				tipo: 'textoLife',
				de: b.at('cidade') - 0.4,
				ate: b.at('hub') - 0.1,
				kicker: 'CALDAS NOVAS · GO',
				principal: 'a cidade das Águas Quentes',
				y: 330,
				brilho: true,
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
			},
			{
				tipo: 'selo',
				de: b.at('hub') - 0.1,
				ate: b.at('Bom') - 0.05,
				texto: 'HUB DE LIVE SHOPPING',
				chip: 'QUANTAS LOJAS?',
				emChip: b.at('quantas'),
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			// 1.500 baias
			{
				tipo: 'contador',
				de: b.at('Bom') - 0.05,
				ate: b.at('Esse') - 0.05,
				rotulo: 'BAIAS DE LIVE',
				valor: 1500,
				em: b.at('quinhentas', 2) - 0.6,
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [{em: b.at('baias', 2), som: 'pro_pop', ganho: 0.6}],
			},
			// Shopping 100% de live
			{
				tipo: 'selo',
				de: b.at('Esse') - 0.05,
				ate: b.at('lojas', 2) - 0.12,
				texto: '100% LIVE SHOPPING',
				chip: 'O SHOPPING',
				emChip: b.at('Esse'),
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			{
				tipo: 'live',
				de: b.at('lojas', 2) - 0.12,
				ate: b.say('fazer live').fim + 0.15,
				host: 'loja.caldasnovas',
				espectadores: '1,5 mil',
				coracoes: true,
				comentarios: [
					{nome: 'turista.go', texto: 'manda o link!'},
					{nome: 'bia_moda', texto: 'quero esse'},
				],
				som: 'pro_msg',
			},
			// Toda a estrutura: um item por vez
			{
				tipo: 'chips',
				de: b.at('estrutura') - 0.25,
				ate: b.say('ela precisa').fim + 0.12,
				itens: [
					{texto: 'ESTRUTURA PRONTA', em: b.at('estrutura')},
					{texto: 'CENÁRIO', em: b.at('cenário')},
					{texto: 'ILUMINAÇÃO', em: b.at('iluminação')},
					{texto: 'TUDO QUE PRECISA', em: b.at('tudo')},
				],
				numerado: true,
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
				sons: [
					{em: b.at('cenário'), som: 'pro_tick', ganho: 0.5},
					{em: b.at('tudo'), som: 'pro_tick', ganho: 0.5},
				],
			},
			// Fecho: tá dando burrada
			{
				tipo: 'frase',
				de: b.at('dando') - 0.1,
				ate: fimFala + 0.25,
				palavras: [
					{texto: 'TÁ DANDO', em: b.at('dando')},
					{texto: 'burrada.', em: b.at('burrada'), destaque: true},
				],
				som: 'pro_tick',
				sons: [{em: b.at('burrada'), som: 'pro_pop', ganho: 0.6}],
			},
			{tipo: 'final', de: fimFala + 0.3, ate: fimFala + 3.0, marca: 'MÉTODO', linha2: 'M4', tres: true, som: 'pro_logo'},
		];
		return cenas;
	},
};
