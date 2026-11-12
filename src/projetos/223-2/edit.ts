import type {Cena, Edit} from '../../motor/plano';
import type {Trecho} from '../../motor/palavras';
import {punches, semPausas} from '../223/comum';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// 223-2 (tema Entrevista): corte do IMG_0338 (123–171 s da gravação; video.mp4 recortado com scripts/recortar.mjs).
// Danilow (camisa preta, à direita) conversa com uma creator da agência (à esquerda). Rostos em y ≈ 0,36–0,42.
// História: gancho "o TikTok tá investindo 100 milhões em cupons pra comprar em live" → Black Friday → "por que eles fazem
// isso?" → Shopee 7 anos × TikTok 1 ano e meio → pouca confiança no TikTok, muita na Shopee → pagam a 1ª compra pra
// confiar que o produto chega e ganhar na 2ª → "ao longo da vida dele: cliente recorrente" → cartão final.

const TRECHOS: Trecho[] = [
	[5.0, 10.72], // gancho: "O TikTok tá investindo cem milhões em cupons pros clientes comprarem em live."
	[10.85, 13.85], // "E agora é Black Friday, né, que é final de novembro. Por que que eles fazem isso?"
	[14.1, 18.3], // "Presta atenção, a Shopee tem sete anos no mercado. TikTok tem um ano e meio."
	[42.4, 46.18], // "Então tem muita gente que não tem confiança no TikTok. Na Shopee tem muito mais confiança."
	[21.5, 30.25], // "Eles precisam pagar pras pessoas fazerem a primeira compra... numa segunda compra."
	[38.18, 42.4], // "pra ele comprar ao longo da vida dele. Virar cliente recorrente. Exatamente."
];

export const p2232: Edit = {
	pasta: 'projetos/223-2',
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
			{palavra: 'pagar', estilo: 'serif'},
			{palavra: 'segunda', estilo: 'serif'},
		],
		falantes: (b) => [{de: 0, ate: b.at('Virar') - 0.05, nome: 'DANILOW'}],
	},
	camera: (b) => {
		const cheias: Trecho[] = [
			[b.say('Por que').inicio - 0.05, b.at('Presta') - 0.05],
			[b.at('Então') - 0.05, b.at('Eles') - 0.05],
		];
		return [
			...punches(b, cheias, () => ({x: 0.56, y: 0.4})),
			{tipo: 'flash', em: b.at('milhões') - 0.04},
			{tipo: 'chicote', em: b.at('Presta') - 0.04},
			{tipo: 'chicote', em: b.at('Eles') - 0.04},
			{tipo: 'flash', em: b.at('recorrente') - 0.04},
		];
	},
	cenas: (b) => {
		const fimFala = b.at('Exatamente') + 0.65;
		const cenas: Cena[] = [
			// Gancho: R$ 100 milhões
			{
				tipo: 'numero3d',
				de: 0,
				ate: b.at('cupons') - 0.05,
				texto: 'R$ 100 MI',
				rotulo: 'O TIKTOK INVESTE',
				abaixo: 'EM CUPONS',
				em: b.at('cem'),
				y: 400,
				esconderLegenda: true,
				som: 'pro_whoosh',
				sons: [{em: b.at('milhões'), som: 'pro_pop', ganho: 0.7}],
			},
			// ... em cupons: chuva de cupons dourados
			{
				tipo: 'peca',
				nome: 'p223Cupons',
				de: b.at('cupons') - 0.05,
				ate: b.at('Black') - 0.3,
				esconderLegenda: true,
				som: 'pro_swipe',
				dados: {marcos: [b.at('cupons'), b.at('comprarem')], texto: 'PRA COMPRAR EM LIVE'},
				sons: [{em: b.at('comprarem'), som: 'pro_tick', ganho: 0.5}],
			},
			{
				tipo: 'selo',
				de: b.at('Black') - 0.3,
				ate: b.say('Por que').inicio - 0.05,
				texto: 'BLACK FRIDAY',
				chip: 'FIM DE NOVEMBRO',
				emChip: b.at('final'),
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			// A pergunta da virada, palavra por palavra
			{
				tipo: 'frase',
				de: b.say('Por que').inicio - 0.05,
				ate: b.at('Presta') - 0.05,
				palavras: [
					{texto: 'POR QUE', em: b.say('Por que').inicio},
					{texto: 'ELES FAZEM', em: b.at('eles')},
					{texto: 'isso?', em: b.at('isso'), destaque: true},
				],
				som: 'pro_tick',
			},
			// Shopee 7 anos × TikTok 1 ano e meio
			{
				tipo: 'peca',
				nome: 'p223Tempo',
				de: b.at('Presta') - 0.05,
				ate: b.say('ano e meio').fim + 0.12,
				som: 'pro_whoosh_curto',
				dados: {
					itens: [
						{texto: 'SHOPEE', em: b.at('Shopee')},
						{texto: 'TIKTOK SHOP', em: b.at('TikTok', 2)},
					],
				},
				sons: [{em: b.at('TikTok', 2), som: 'pro_swipe', ganho: 0.5}],
			},
			// Confiança: pouca no TikTok, muita na Shopee
			{
				tipo: 'gradeAntesDepois',
				de: b.at('Então') - 0.05,
				ate: b.at('Eles') - 0.05,
				titulo: [{texto: 'CONFIANÇA', em: b.at('confiança')}],
				antes: {texto: 'TIKTOK', em: b.at('TikTok', 3), valor: 'POUCA'},
				depois: {texto: 'SHOPEE', em: b.at('Shopee', 2), valor: 'MUITA'},
				som: 'pro_whoosh',
			},
			// O TikTok paga a 1ª compra: cartas que viram
			{
				tipo: 'cards3d',
				de: b.at('Eles') - 0.05,
				ate: b.at('pra', 3) - 0.1,
				itens: [
					{texto: '1ª COMPRA PAGA', em: b.at('primeira')},
					{texto: 'O PRODUTO CHEGA', em: b.at('chega')},
					{texto: '2ª COMPRA', em: b.at('segunda')},
				],
				som: 'pro_swipe',
				sons: [
					{em: b.at('chega'), som: 'pro_tick', ganho: 0.5},
					{em: b.at('segunda'), som: 'pro_tick', ganho: 0.5},
				],
			},
			// Cliente recorrente
			{
				tipo: 'selo',
				de: b.at('Virar') - 0.05,
				ate: fimFala + 0.25,
				texto: 'CLIENTE RECORRENTE',
				chip: 'PRA VIDA TODA',
				emChip: b.at('vida'),
				esconderLegenda: true,
				som: 'pro_pop',
			},
			{tipo: 'final', de: fimFala + 0.3, ate: fimFala + 3.0, marca: 'MVM', linha2: 'CREATORS', sub: 'TIKTOK SHOP', tres: true, som: 'pro_logo'},
		];
		return cenas;
	},
};
