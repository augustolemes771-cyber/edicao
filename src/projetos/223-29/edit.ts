import type {Cena, Edit} from '../../motor/plano';
import type {Trecho} from '../../motor/palavras';
import {punches, semPausas} from '../223/comum';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// 223-29 (tema Entrevista): corte do IMG_0364 (509–576 s). Danilow (esquerda) e Nara (direita).
// História: gancho "eles tão vendendo café em live dentro do TikTok Shop?" → "tem alguma marca que você espelha?" → "Bacio Café"
// → "jogadas inteligentes na live: cupom na hora certa, festa no lançamento, cenário muda de cor" → "uma das maiores de café do
// Brasil" → cartão final.

const TRECHOS: Trecho[] = [
	[61.6, 64.0], // "eles tão vendendo café em live dentro do TikTok Shop?"
	[2.9, 8.8], // Danilow: "Tem alguma marca assim no TikTok que você fala assim: 'não, essa marca é foda, eu gosto de espelhar ela, o modelo é essa marca'."
	[18.5, 21.6], // "Cara, por incrível que pareça, é da Bacio Café."
	[22.6, 24.85], // "Os cara da Bacio é muito pancada, assim."
	[25.5, 33.05], // "Eles fazem umas jogadas muito inteligentes ali com quem é usuário da live deles."
	[33.6, 42.92], // "Eles liberam cupom no momento certo... quando tem lançamento de cupom, eles fazem festa, eles mudam o cenário de cor."
	[52.62, 55.9], // "ela tá sendo uma das maiores empresas de café do Brasil."
];

export const p22329: Edit = {
	pasta: 'projetos/223-29',
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
		enfase: [{palavra: 'inteligentes', estilo: 'serif'}],
		falantes: (b) => [
			{de: b.at('marca') - 0.6, ate: b.at('incrível') - 0.6, nome: 'PERGUNTA'},
			{de: b.at('incrível') - 0.6, ate: b.at('Brasil') + 0.6, nome: 'NARA'},
		],
	},
	camera: (b) => {
		const danilow = (t: number) => t < b.at('incrível') - 0.6;
		return [
			...punches(b, [], (t) => (danilow(t) ? {x: 0.32, y: 0.34} : {x: 0.68, y: 0.36})),
			{tipo: 'flash', em: b.at('café') - 0.04},
			{tipo: 'chicote', em: b.at('incrível') - 0.6},
			{tipo: 'flash', em: b.at('maiores') - 0.04},
		];
	},
	cenas: (b) => {
		const fimFala = b.at('Brasil') + 0.55;
		const cenas: Cena[] = [
			{
				tipo: 'live',
				de: 0,
				ate: b.at('marca') - 0.6,
				host: 'cafe.da.marca',
				espectadores: '8,3 mil',
				coracoes: true,
				comentarios: [
					{nome: 'ana.cafe', texto: 'cadê o cupom?'},
					{nome: 'joao_r', texto: 'comprei 3!'},
				],
				som: 'pro_msg',
			},
			{
				tipo: 'textoLife',
				de: b.at('marca') - 0.6,
				ate: b.at('incrível') - 0.6,
				kicker: 'UMA MARCA',
				principal: 'pra espelhar',
				y: 330,
				brilho: true,
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
			},
			{tipo: 'pilula', de: b.at('incrível') - 0.6, ate: b.at('pancada') - 0.8, rotulo: 'A RESPOSTA', nome: 'Bacio Café', esconderLegenda: true, som: 'pro_tick'},
			{
				tipo: 'selo',
				de: b.at('pancada') - 0.8,
				ate: b.at('cupom') - 0.8,
				texto: 'JOGADAS INTELIGENTES',
				chip: 'NA LIVE',
				emChip: b.at('jogadas'),
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			{
				tipo: 'chips',
				de: b.at('cupom') - 0.8,
				ate: b.at('maiores') - 0.8,
				itens: [
					{texto: 'CUPOM NA HORA CERTA', em: b.at('cupom')},
					{texto: 'FESTA NO LANÇAMENTO', em: b.at('festa')},
					{texto: 'CENÁRIO MUDA DE COR', em: b.at('cor')},
				],
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
			},
			{
				tipo: 'numero3d',
				de: b.at('maiores') - 0.8,
				ate: fimFala + 0.25,
				texto: 'TOP CAFÉ',
				rotulo: 'DAS MAIORES',
				abaixo: 'DO BRASIL',
				em: b.at('maiores'),
				y: 400,
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [{em: b.at('maiores'), som: 'pro_pop', ganho: 0.6}],
			},
			{tipo: 'final', de: fimFala + 0.3, ate: fimFala + 3.0, marca: 'MÉTODO', linha2: 'M4', tres: true, som: 'pro_logo'},
		];
		return cenas;
	},
};
