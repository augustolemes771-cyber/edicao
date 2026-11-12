import type {Cena, Edit} from '../../motor/plano';
import type {Trecho} from '../../motor/palavras';
import {punches, semPausas} from '../223/comum';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// 223-25 (tema Entrevista): corte do IMG_0364 (285–318 s). Danilow (esquerda) e Nara (direita).
// História: gancho "10, 12 horas de live, o dia todo: casamento perfeito" → "link exclusivo e coloca horas, quer mais o quê?"
// → "de casa, trabalhando e vendendo" → "o estoque não vai faltar: fornecedor forte" → "só suplemento" → cartão final.

const TRECHOS: Trecho[] = [
	[11.22, 16.14], // "O cara fazer dez, doze horas de live pra você, o dia todo dele, né? Casamento perfeito."
	[5.1, 11.22], // "Quando tem aquele link exclusivo, cara, se a pessoa tem link exclusivo e coloca horas, cê quer mais o quê?"
	[16.82, 19.5], // "E o cara vai tá dentro da casa dele trabalhando, vendendo,"
	[20.42, 22.05], // Nara: "O estoque não vai faltar, Danilo."
	[22.54, 25.0], // "Não vai faltar. A gente já tem um fornecedor muito forte."
	[25.05, 27.46], // "Então assim, o estoque não falta pra esse creator."
	[28.45, 31.28], // Danilow: "além de suplemento, cês trabalham com outro tipo de produto?"
	[31.3, 32.44], // Nara: "Somente suplemento."
];

export const p22325: Edit = {
	pasta: 'projetos/223-25',
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
		enfase: [{palavra: 'casa', estilo: 'serif'}],
		falantes: (b) => [
			{de: 0, ate: b.at('estoque') - 0.2, nome: 'DANILOW'},
			{de: b.at('estoque') - 0.2, ate: b.at('além') - 0.3, nome: 'NARA'},
		],
	},
	camera: (b) => {
		const nara = (t: number) => (t >= b.at('estoque') - 0.2 && t < b.at('além') - 0.3) || t >= b.at('Somente') - 0.1;
		return [
			...punches(b, [], (t) => (nara(t) ? {x: 0.68, y: 0.36} : {x: 0.32, y: 0.34})),
			{tipo: 'flash', em: b.at('Casamento') - 0.04},
			{tipo: 'chicote', em: b.at('estoque') - 0.2},
			{tipo: 'chicote', em: b.at('além') - 0.3},
			{tipo: 'flash', em: b.at('Somente') - 0.04},
		];
	},
	cenas: (b) => {
		const fimFala = b.at('suplemento', 2) + 0.55;
		const cenas: Cena[] = [
			{
				tipo: 'numero3d',
				de: 0,
				ate: b.at('Quando') - 0.05,
				texto: '12 HORAS',
				rotulo: 'DE LIVE POR DIA',
				abaixo: 'CASAMENTO PERFEITO',
				em: b.at('doze'),
				y: 400,
				esconderLegenda: true,
				som: 'pro_whoosh',
				sons: [{em: b.at('Casamento'), som: 'pro_pop', ganho: 0.7}],
			},
			{
				tipo: 'selo',
				de: b.at('Quando') - 0.05,
				ate: b.at('casa') - 1.0,
				texto: 'LINK EXCLUSIVO',
				chip: 'QUER MAIS O QUÊ?',
				emChip: b.at('quer'),
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			{
				tipo: 'textoLife',
				de: b.at('casa') - 1.0,
				ate: b.at('estoque') - 0.2,
				kicker: 'DE CASA',
				principal: 'trabalhando e vendendo',
				y: 330,
				brilho: true,
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
			},
			{
				tipo: 'chips',
				de: b.at('estoque') - 0.2,
				ate: b.at('além') - 0.3,
				itens: [
					{texto: 'ESTOQUE NÃO FALTA', em: b.at('faltar')},
					{texto: 'FORNECEDOR FORTE', em: b.at('fornecedor')},
				],
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
			},
			{
				tipo: 'selo',
				de: b.at('além') - 0.3,
				ate: fimFala + 0.25,
				texto: 'SÓ SUPLEMENTO',
				chip: 'UM NICHO SÓ',
				emChip: b.at('Somente'),
				esconderLegenda: true,
				som: 'pro_pop',
			},
			{tipo: 'final', de: fimFala + 0.3, ate: fimFala + 3.5, marca: 'MÉTODO', linha2: 'M4', tres: true, som: 'pro_logo'},
		];
		return cenas;
	},
};
