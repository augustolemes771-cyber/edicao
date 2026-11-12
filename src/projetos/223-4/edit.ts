import type {Cena, Edit} from '../../motor/plano';
import type {Trecho} from '../../motor/palavras';
import {punches, semPausas} from '../223/comum';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// 223-4 (tema Entrevista): corte do IMG_0364 (413–601 s da gravação; video.mp4 recortado com scripts/recortar.mjs).
// Danilow (camisa preta, à esquerda) e a Nara, dona de agência de creators (colete branco, à direita). Rostos em y ≈ 0,30–0,36.
// História: gancho "tem um cara vendendo bosta em lata no TikTok Shop" (lata com preço e VENDIDO) → "1 ano e meio no TikTok
// Shop e não sabia" → "a Nara trouxe" (live vendendo a lata) → "pô, meu produto não vende" → Nara: "a gente vende TV,
// computador, gerador; ontem vendemos 22 geradores de R$ 2.500 com banner, sem produto" → "tem um cara vendendo bosta.
// Não tem desculpa." → cartão final.

const TRECHOS: Trecho[] = [
	[161.13, 165.98], // gancho: "Cara, tem um cara vendendo bosta em lata no TikTok, cara. Bosta em lata no TikTok Shop."
	[166.03, 172.3], // "Galera, rapaziada, isso aqui eu fiquei sabendo hoje, tá? Eu tô há um ano e meio no TikTok Shop, não sabia dessa parada."
	[173.2, 176.4], // "A Nara trouxe pra gente, tem gente vendendo bosta em lata."
	[180.56, 183.08], // "mas às vezes o cara tá assim: pô, meu produto não vende."
	[1.69, 5.3], // Nara: "A gente vende TV, computador, nós vendemos gerador."
	[5.55, 10.87], // Nara: "Ontem, ontem a gente vendeu vinte e dois gerador de dois mil e quinhentos reais, com banner, sem produto."
	[183.08, 186.85], // "Galera, tem um cara vendendo bosta, tá? Não tem desculpa."
];

export const p2234: Edit = {
	pasta: 'projetos/223-4',
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
			{palavra: 'hoje', estilo: 'serif'},
			{palavra: 'Ontem', estilo: 'serif'},
		],
		falantes: (b) => [
			{de: b.at('Galera') - 0.05, ate: b.say('A gente vende').inicio - 0.05, nome: 'DANILOW'},
			{de: b.say('A gente vende').inicio - 0.05, ate: b.say('Galera, tem um').inicio - 0.05, nome: 'NARA'},
		],
	},
	camera: (b) => {
		const nara = b.say('A gente vende').inicio - 0.05;
		const volta = b.say('Galera, tem um').inicio - 0.05;
		const cheias: Trecho[] = [[b.say('meu produto não').inicio - 0.35, nara]];
		return [
			...punches(b, cheias, (t) => (t >= nara && t < volta ? {x: 0.68, y: 0.36} : {x: 0.34, y: 0.34})),
			{tipo: 'flash', em: b.at('lata') - 0.04},
			{tipo: 'chicote', em: nara},
			{tipo: 'chicote', em: volta},
			{tipo: 'flash', em: b.at('desculpa') - 0.04},
		];
	},
	cenas: (b) => {
		const fimFala = b.at('desculpa') + 0.62;
		const cenas: Cena[] = [
			// Gancho: a lata cai, ganha preço e o carimbo VENDIDO
			{
				tipo: 'peca',
				nome: 'p223Lata',
				de: 0,
				ate: b.at('Galera') - 0.05,
				esconderLegenda: true,
				som: 'pro_whoosh',
				dados: {marcos: [b.at('lata') + 0.15, b.at('Bosta', 2)], texto: 'BOSTA'},
				sons: [
					{em: b.at('lata') + 0.15, som: 'pro_tick', ganho: 0.6},
					{em: b.at('Bosta', 2), som: 'pro_pop', ganho: 0.7},
				],
			},
			// 1 ano e meio de TikTok Shop e não sabia
			{
				tipo: 'selo',
				de: b.at('ano') - 0.1,
				ate: b.at('Nara') - 0.12,
				texto: '1 ANO E MEIO NO TIKTOK SHOP',
				chip: 'E NÃO SABIA',
				emChip: b.at('sabia'),
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			{tipo: 'pilula', de: b.at('Nara') - 0.1, ate: b.say('tem gente vendendo').inicio - 0.05, rotulo: 'QUEM TROUXE', nome: 'Nara', esconderLegenda: true, som: 'pro_tick'},
			// A live vendendo a lata
			{
				tipo: 'live',
				de: b.say('tem gente vendendo').inicio - 0.05,
				ate: b.say('mas às vezes').inicio - 0.05,
				host: 'bosta.em.lata',
				espectadores: '3,2 mil',
				coracoes: true,
				comentarios: [
					{nome: 'joao.vendas', texto: 'comprei 2 kkkk'},
					{nome: 'ana_paula', texto: 'é sério isso?'},
				],
				som: 'pro_msg',
			},
			// A desculpa: "meu produto não vende"
			{
				tipo: 'frase',
				dor: true,
				de: b.say('meu produto não').inicio - 0.35,
				ate: b.say('A gente vende').inicio - 0.05,
				palavras: [
					{texto: 'MEU PRODUTO', em: b.at('meu')},
					{texto: 'NÃO VENDE', em: b.say('não vende').inicio, destaque: true},
				],
				som: 'pro_tick',
			},
			// Nara: TV, computador, gerador
			{
				tipo: 'chips',
				de: b.say('A gente vende').inicio - 0.05,
				ate: b.at('Ontem') - 0.08,
				itens: [
					{texto: 'TV', em: b.at('TV')},
					{texto: 'COMPUTADOR', em: b.at('computador')},
					{texto: 'GERADOR', em: b.at('gerador')},
				],
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
				sons: [{em: b.at('gerador'), som: 'pro_tick', ganho: 0.5}],
			},
			// 22 geradores de R$ 2.500 num dia
			{
				tipo: 'numero3d',
				de: b.at('Ontem') - 0.08,
				ate: b.at('com', 1) - 0.08,
				texto: '22 GERADORES',
				rotulo: 'ONTEM',
				abaixo: 'DE R$ 2.500',
				em: b.at('vinte'),
				y: 400,
				largura: 4.4,
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [{em: b.at('vinte'), som: 'pro_pop', ganho: 0.7}],
			},
			// Com banner, sem produto: a caixa some e o banner se desenrola
			{
				tipo: 'peca',
				nome: 'e2Banner',
				de: b.at('com', 1) - 0.08,
				ate: b.say('Galera, tem um').inicio - 0.05,
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
				dados: {marcos: [b.at('sem') - 0.05, b.at('banner')]},
				sons: [{em: b.at('banner'), som: 'pro_swipe', ganho: 0.6}],
			},
			// Fecho: não tem desculpa
			{
				tipo: 'medo3d',
				de: b.say('Não tem desculpa').inicio - 0.1,
				ate: fimFala + 0.3,
				linhas: [
					{texto: 'NÃO TEM', em: b.say('Não tem desculpa').inicio, metal: 'branco'},
					{texto: 'DESCULPA', em: b.at('desculpa'), metal: 'ouro'},
				],
				som: 'pro_whoosh',
				sons: [{em: b.at('desculpa'), som: 'pro_pop', ganho: 0.6}],
			},
			{tipo: 'final', de: fimFala + 0.35, ate: fimFala + 3.0, marca: 'MVM', linha2: 'CREATORS', sub: 'TIKTOK SHOP', tres: true, som: 'pro_logo'},
		];
		return cenas;
	},
};
