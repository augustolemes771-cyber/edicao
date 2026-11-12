import type {Cena, Edit} from '../../motor/plano';
import type {Trecho} from '../../motor/palavras';
import {punches, semPausas} from '../223/comum';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// 223-10 (tema Entrevista): corte do IMG_0338 (175–246 s da gravação; video.mp4 recortado com scripts/recortar.mjs).
// Danilow (camisa preta, à direita) explica a estratégia para uma creator da agência (à esquerda).
// História: gancho "em 60 dias vamos dobrar só com o vídeo" → "TikTok é bom, mas as views caíram" → "a gente fica refém do
// algoritmo, como prestar serviço pra uma empresa só" → "não consegue expandir" → a estratégia: o mesmo vídeo com o link da
// Shopee e em outras plataformas → "vai dar bom" → "Fechou, tô play" → cartão final.

const TRECHOS: Trecho[] = [
	[65.9, 69.2], // gancho: "60 dias nós vamo dobrar só com o vídeo, fora as lives."
	[37.7, 41.36], // "TikTok, cara, é muito bom. Mas cê viu que as views diminuiu um pouco?"
	[44.15, 46.2], // "a gente fica refém do algoritmo do TikTok."
	[49.38, 53.9], // "É a mesma coisa de você prestar serviço pra uma empresa em Caldas Novas e não poder prestar pras outras."
	[54.68, 57.3], // "Você fica muito refém dessa e não consegue expandir, ganhar mais dinheiro."
	[4.42, 8.62], // "Ó, nós vamos aplicar uma estratégia agora na operação, que vai ser muito bom pra vocês,"
	[9.0, 15.05], // "que é vender com o link da Shopee, usando o mesmo vídeo que vocês fazem pro TikTok."
	[16.0, 18.2], // "Nós vamos espalhar pra outras plataformas."
	[61.75, 65.45], // "vamos pegar o mesmo vídeo, jogar em outras plataformas, vai dar bom."
	[69.2, 70.6], // creator: "Fechou, tô play."
];

export const p22310: Edit = {
	pasta: 'projetos/223-10',
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
		enfase: [{palavra: 'estratégia', estilo: 'serif'}],
		falantes: (b) => [
			{de: b.at('TikTok') - 0.05, ate: b.at('Fechou') - 0.05, nome: 'DANILOW'},
			{de: b.at('Fechou') - 0.05, ate: b.at('play') + 0.5, nome: 'CREATOR'},
		],
	},
	camera: (b) => {
		const creator = (t: number) => t >= b.at('Fechou') - 0.05;
		return [
			...punches(b, [], (t) => (creator(t) ? {x: 0.32, y: 0.4} : {x: 0.68, y: 0.38})),
			{tipo: 'flash', em: b.at('dobrar') - 0.04},
			{tipo: 'chicote', em: b.at('Ó') - 0.05},
			{tipo: 'chicote', em: b.at('Fechou') - 0.05},
			{tipo: 'flash', em: b.say('dar bom').inicio - 0.04},
		];
	},
	cenas: (b) => {
		const fimFala = b.at('play') + 0.45;
		const cenas: Cena[] = [
			{
				tipo: 'numero3d',
				de: 0,
				ate: b.at('TikTok') - 0.05,
				texto: '2X',
				rotulo: 'EM 60 DIAS',
				abaixo: 'SÓ COM VÍDEO',
				em: b.at('dobrar'),
				y: 400,
				esconderLegenda: true,
				som: 'pro_whoosh',
				sons: [{em: b.at('dobrar'), som: 'pro_pop', ganho: 0.7}],
			},
			{
				tipo: 'alertas',
				de: b.at('TikTok') - 0.05,
				ate: b.at('refém') - 0.4,
				itens: [{texto: 'AS VIEWS CAÍRAM', em: b.at('views'), icone: 'alerta'}],
				variante: 'escura',
				esconderLegenda: true,
				som: 'pro_tick',
			},
			{
				tipo: 'medo3d',
				de: b.at('refém') - 0.4,
				ate: b.at('mesma') - 0.4,
				linhas: [
					{texto: 'REFÉM DO', em: b.at('refém'), metal: 'cinza'},
					{texto: 'ALGORITMO', em: b.at('algoritmo'), metal: 'sangue'},
				],
				pessoa: true,
				som: 'pro_whoosh',
			},
			{
				tipo: 'chips',
				de: b.at('mesma') - 0.4,
				ate: b.at('Você') - 0.05,
				itens: [
					{texto: 'UMA EMPRESA SÓ', em: b.at('empresa')},
					{texto: 'NENHUMA OUTRA', em: b.at('outras')},
				],
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
			},
			{
				tipo: 'selo',
				de: b.at('Você') - 0.05,
				ate: b.at('Ó') - 0.05,
				texto: 'NÃO EXPANDE',
				chip: 'NEM GANHA MAIS',
				emChip: b.at('ganhar'),
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			// A estratégia: o mesmo vídeo em várias plataformas
			{
				tipo: 'textoLife',
				de: b.at('Ó') - 0.05,
				ate: b.say('usando o mesmo').inicio - 0.05,
				kicker: 'A ESTRATÉGIA',
				principal: 'link da Shopee',
				y: 330,
				brilho: true,
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
			},
			{
				tipo: 'peca',
				nome: 'p223Espalha',
				de: b.say('usando o mesmo').inicio - 0.05,
				ate: b.say('vamos pegar').inicio - 0.05,
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
				dados: {
					marcos: [b.say('mesmo vídeo').inicio],
					itens: [
						{texto: 'TIKTOK', em: b.at('TikTok', 3)},
						{texto: 'SHOPEE', em: b.say('mesmo vídeo').inicio + 0.2},
						{texto: '+ CANAIS', em: b.at('espalhar')},
					],
					texto: 'MESMO VÍDEO',
				},
				sons: [{em: b.at('espalhar'), som: 'pro_swipe', ganho: 0.6}],
			},
			{
				tipo: 'motion3d',
				modelo: 'positivoLive',
				de: b.say('vamos pegar').inicio - 0.05,
				ate: b.at('Fechou') - 0.05,
				linhas: [
					{texto: 'MESMO VÍDEO', em: b.say('mesmo vídeo', 2).inicio, metal: 'branco'},
					{texto: 'VAI DAR BOM', em: b.say('dar bom').inicio, metal: 'ouro'},
				],
				troca: true,
				som: 'pro_whoosh',
			},
			{
				tipo: 'selo',
				de: b.at('Fechou') - 0.05,
				ate: fimFala + 0.25,
				texto: 'FECHOU!',
				chip: 'TÔ PLAY',
				emChip: b.at('play'),
				esconderLegenda: true,
				som: 'pro_pop',
			},
			{tipo: 'final', de: fimFala + 0.3, ate: fimFala + 3.0, marca: 'MÉTODO', linha2: 'M4', tres: true, som: 'pro_logo'},
		];
		return cenas;
	},
};
