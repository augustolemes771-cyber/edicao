import type {Cena, Edit} from '../../motor/plano';
import type {Trecho} from '../../motor/palavras';
import {punches, semPausas} from '../223/comum';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// 223-19 (tema Entrevista): corte do IMG_0355 (0–60 s da gravação; video.mp4 recortado com scripts/recortar.mjs).
// Danilow (camisa preta, à esquerda) e a empresária de Caldas Novas (colete branco, à direita).
// História: gancho "o TikTok mudou o jogo da minha empresa" → "Caldas Novas, 100 mil habitantes: muita gente nem imagina o
// quão grande é" → "sou empresária, demorei 6 meses batendo cabeça" → "não tentem sozinhos" → "o lojista fica receoso, quer o
// cenário perfeito" → "a hub vem com o cenário perfeito" → cartão final.

const TRECHOS: Trecho[] = [
	[10.75, 12.7], // gancho: "o TikTok, ele mudou o jogo da minha empresa, né."
	[0.0, 2.2], // Danilow: "Aqui em Caldas Novas, né, uma cidade com cem mil habitantes."
	[4.3, 8.42], // "muita gente ouve falar do TikTok Shop, mas não imagina nem o que é e o, e quão grande, né?"
	[13.14, 19.0], // "Eu sou empresária e eu demorei ali seis meses batendo cabeça, literalmente."
	[19.05, 22.85], // "O que eu falo é: não tentem sozinho, empresários, não façam isso."
	[45.45, 52.6], // "Porque às vezes o lojista em si, ele fica muito receoso em vender dentro da loja dele. Às vezes ele quer o cenário perfeito, né?"
	[53.45, 58.7], // "Então a hub, ela vai vir com esse cenário perfeito pra nutrir essa carência nos lojistas."
];

export const p22319: Edit = {
	pasta: 'projetos/223-19',
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
		enfase: [{palavra: 'receoso', estilo: 'serif'}],
		falantes: (b) => [
			{de: b.at('Aqui') - 0.05, ate: b.at('empresária') - 0.6, nome: 'DANILOW'},
			{de: b.at('empresária') - 0.6, ate: b.at('lojistas') + 0.7, nome: 'EMPRESÁRIA'},
		],
	},
	camera: (b) => {
		const danilow = (t: number) => t >= b.at('Aqui') - 0.05 && t < b.at('empresária') - 0.6;
		return [
			...punches(b, [], (t) => (danilow(t) ? {x: 0.32, y: 0.32} : {x: 0.66, y: 0.33})),
			{tipo: 'flash', em: b.at('mudou') - 0.04},
			{tipo: 'chicote', em: b.at('Aqui') - 0.05},
			{tipo: 'chicote', em: b.at('empresária') - 0.6},
			{tipo: 'flash', em: b.at('perfeito', 2) - 0.04},
		];
	},
	cenas: (b) => {
		const fimFala = b.at('lojistas') + 0.7;
		const cenas: Cena[] = [
			{
				tipo: 'medo3d',
				de: 0,
				ate: b.at('Aqui') - 0.05,
				linhas: [
					{texto: 'O TIKTOK', em: b.at('TikTok'), metal: 'branco'},
					{texto: 'MUDOU O JOGO', em: b.at('mudou'), metal: 'ouro'},
				],
				som: 'pro_whoosh',
				sons: [{em: b.at('mudou'), som: 'pro_pop', ganho: 0.6}],
			},
			{tipo: 'pilula', de: b.at('Aqui') - 0.05, ate: b.at('muita') - 0.3, rotulo: 'CALDAS NOVAS', nome: '100 mil habitantes', esconderLegenda: true, som: 'pro_tick'},
			{
				tipo: 'textoLife',
				de: b.at('muita') - 0.3,
				ate: b.at('empresária') - 0.6,
				kicker: 'NEM IMAGINAM',
				principal: 'o quão grande é',
				y: 330,
				brilho: true,
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
			},
			{
				tipo: 'numero3d',
				de: b.at('empresária') - 0.6,
				ate: b.at('falo') - 0.6,
				texto: '6 MESES',
				rotulo: 'SOZINHA',
				abaixo: 'BATENDO CABEÇA',
				em: b.at('seis'),
				y: 400,
				metal: 'branco',
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			{
				tipo: 'alertas',
				de: b.at('falo') - 0.6,
				ate: b.at('Porque') - 0.05,
				itens: [{texto: 'NÃO TENTEM SOZINHOS', em: b.at('tentem'), icone: 'alerta'}],
				variante: 'vermelha',
				esconderLegenda: true,
				som: 'pro_tick',
			},
			{
				tipo: 'chips',
				de: b.at('Porque') - 0.05,
				ate: b.at('Então') - 0.05,
				itens: [
					{texto: 'LOJISTA RECEOSO', em: b.at('receoso')},
					{texto: 'QUER O CENÁRIO PERFEITO', em: b.at('perfeito')},
				],
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
			},
			{
				tipo: 'selo',
				de: b.at('Então') - 0.05,
				ate: fimFala + 0.25,
				texto: 'CENÁRIO PERFEITO',
				chip: 'A HUB ENTREGA',
				emChip: b.at('hub'),
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [{em: b.at('perfeito', 2), som: 'pro_pop', ganho: 0.6}],
			},
			{tipo: 'final', de: fimFala + 0.3, ate: fimFala + 3.0, marca: 'MÉTODO', linha2: 'M4', tres: true, som: 'pro_logo'},
		];
		return cenas;
	},
};
