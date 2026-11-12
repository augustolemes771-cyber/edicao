import type {Cena, Edit} from '../../motor/plano';
import type {Trecho} from '../../motor/palavras';
import {punches, semPausas} from '../223/comum';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// 223-13 (tema Entrevista): corte do IMG_0364 (463–511 s da gravação; video.mp4 recortado com scripts/recortar.mjs).
// A Nara (colete branco, à direita) explica a rerotulação; Danilow (camisa preta, à esquerda) pergunta.
// História: gancho "o TikTok odeia monotonia" → "a gente faz a rerotulação do produto" → "como assim?" → "o produto A vira o B
// com outro rótulo, a mesma coisa" → "pra mudar a oferta e a copy" → "ele não gosta do que já é conhecido" → "marca repetitiva:
// a galera passa na live e nem para. 'De novo isso?' Que coisa chata" → cartão final.

const TRECHOS: Trecho[] = [
	[23.03, 26.75], // gancho: "o TikTok, gente, pra quem não sabe, odeia monotonia."
	[2.78, 6.25], // "aí a gente faz a, é, rerotulação do produto."
	[6.85, 8.3], // Danilow: "Como assim rerotulação?"
	[8.82, 17.08], // "Se o cara ele tava apresentando o produto A, ele vai apresentar o produto B com outro rótulo, só que é a mesma coisa do produto A, entendeu?"
	[17.28, 19.97], // "Pra modificar a oferta, pra modificar a copy."
	[27.13, 30.1], // "Ele não gosta de nada no-- de nada que já é conhecido."
	[30.55, 39.3], // "Então se uma marca... for muito repetitiva, cara, a galera vai passar na live do cara, não vai nem parar. 'Pô, de novo cê tá vendendo isso aí'."
	[40.15, 41.25], // "Nossa, que coisa chata."
];

export const p22313: Edit = {
	pasta: 'projetos/223-13',
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
		enfase: [{palavra: 'repetitiva', estilo: 'serif'}],
		falantes: (b) => [
			{de: b.at('aí') - 0.05, ate: b.say('Como assim').inicio - 0.05, nome: 'NARA'},
			{de: b.say('Como assim').inicio - 0.05, ate: b.at('Se') - 0.05, nome: 'PERGUNTA'},
			{de: b.at('Se') - 0.05, ate: b.at('chata') + 0.5, nome: 'NARA'},
		],
	},
	camera: (b) => {
		const danilow = (t: number) => t >= b.say('Como assim').inicio - 0.05 && t < b.at('Se') - 0.05;
		const cheias: Trecho[] = [[b.at('Nossa') - 0.05, b.at('chata') + 1]];
		return [
			...punches(b, cheias, (t) => (danilow(t) ? {x: 0.32, y: 0.34} : {x: 0.68, y: 0.36})),
			{tipo: 'flash', em: b.at('odeia') - 0.04},
			{tipo: 'chicote', em: b.say('Como assim').inicio - 0.05},
			{tipo: 'chicote', em: b.at('Se') - 0.05},
			{tipo: 'flash', em: b.at('chata') - 0.04},
		];
	},
	cenas: (b) => {
		const fimFala = b.at('chata') + 0.5;
		const cenas: Cena[] = [
			// Gancho: o TikTok odeia monotonia
			{
				tipo: 'medo3d',
				de: 0,
				ate: b.at('aí') - 0.05,
				linhas: [
					{texto: 'O TIKTOK', em: b.at('TikTok'), metal: 'branco'},
					{texto: 'ODEIA MONOTONIA', em: b.at('odeia'), metal: 'sangue', largura: 4.4},
				],
				som: 'pro_whoosh',
				sons: [{em: b.at('odeia'), som: 'pro_pop', ganho: 0.6}],
			},
			{
				tipo: 'textoLife',
				de: b.at('aí') - 0.05,
				ate: b.at('Se') - 0.05,
				kicker: 'O SEGREDO',
				principal: 'rerotulação',
				y: 330,
				brilho: true,
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
			},
			// Produto A vira produto B com outro rótulo
			{
				tipo: 'peca',
				nome: 'p223Rotulo',
				de: b.at('Se') - 0.05,
				ate: b.say('Pra modificar').inicio - 0.05,
				som: 'pro_whoosh_curto',
				dados: {marcos: [b.at('B'), b.say('mesma coisa').inicio], texto: 'MESMO PRODUTO'},
				sons: [
					{em: b.at('B'), som: 'pro_swipe', ganho: 0.6},
					{em: b.say('mesma coisa').inicio, som: 'pro_pop', ganho: 0.5},
				],
			},
			{
				tipo: 'chips',
				de: b.say('Pra modificar').inicio - 0.05,
				ate: b.say('Ele não gosta').inicio - 0.05,
				itens: [
					{texto: 'NOVA OFERTA', em: b.at('oferta')},
					{texto: 'NOVA COPY', em: b.at('copy')},
				],
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
			},
			{
				tipo: 'alertas',
				de: b.say('Ele não gosta').inicio - 0.05,
				ate: b.at('Então') - 0.05,
				itens: [{texto: 'O QUE JÁ É CONHECIDO', em: b.at('conhecido'), icone: 'x'}],
				variante: 'escura',
				esconderLegenda: true,
				som: 'pro_tick',
			},
			{
				tipo: 'selo',
				de: b.at('Então') - 0.05,
				ate: b.at('galera') - 0.1,
				texto: 'MARCA REPETITIVA',
				chip: 'NINGUÉM PARA',
				emChip: b.at('repetitiva'),
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			// A live que ninguém para pra ver
			{
				tipo: 'live',
				drama: true,
				de: b.at('galera') - 0.1,
				ate: b.at('Nossa') - 0.05,
				host: 'marca.nova',
				espectadores: '3',
				comentarios: [{nome: 'cliente', texto: 'de novo isso aí?'}],
				som: 'pro_msg',
			},
			{
				tipo: 'frase',
				de: b.at('Nossa') - 0.05,
				ate: fimFala + 0.25,
				palavras: [
					{texto: 'QUE COISA', em: b.at('coisa', 2)},
					{texto: 'chata.', em: b.at('chata'), destaque: true},
				],
				som: 'pro_tick',
			},
			{tipo: 'final', de: fimFala + 0.3, ate: fimFala + 3.0, marca: 'MÉTODO', linha2: 'M4', tres: true, som: 'pro_logo'},
		];
		return cenas;
	},
};
