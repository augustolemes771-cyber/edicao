import type {Cena, Edit} from '../../motor/plano';
import type {Trecho} from '../../motor/palavras';
import {punches, semPausas} from '../223/comum';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// 223-1 (tema Entrevista): corte do IMG_0335 (40–78 s da gravação; video.mp4 recortado com scripts/recortar.mjs).
// Danilow (camisa preta, à direita) responde a um empresário (camisa xadrez, à esquerda). Rostos em y ≈ 0,30–0,36.
// História: gancho "faz R$ 30 mil por mês sem aparecer" → "a plataforma mais democrática. Por quê?" → celular + internet →
// sem estoque, sem contrato, sem tráfego, 2 mil seguidores → aparecendo ou não, só gravar → amigo meu faz 20, 30 mil →
// "pega o produto, filma, não aparece" (visor de câmera) → R$ 30 MIL → "loucura!" → cartão final.

const TRECHOS: Trecho[] = [
	[32.1, 35.55], // gancho: "Pega o produto, filma o produto, não aparece, não nada, faz trinta mil reais por mês."
	[13.62, 17.85], // "eu costumo falar que a TikTok Shop é a plataforma mais democrática. Por quê?"
	[18.15, 21.24], // "Cara, qualquer pessoa que tem um celular com internet. Consegue fazer."
	[3.0, 7.4], // "TikTok Shop não precisa nada disso... não precisa investir em tráfego." (vale de energia antes do "TikTok")
	// "É só criar uma conta, ter dois mil seguidores" saiu: está colado na fala do outro, sem vale para cortar limpo.
	[22.25, 24.92], // "Aparecendo, sem aparecer, é só pegar um celular e gravar o vídeo."
	[25.92, 31.2], // "Tem amigo meu, faz vinte, trinta mil, sem aparecer... pega o produto aqui ó."
	[32.1, 36.04], // "Pega o produto, filma o produto, não aparece... faz trinta mil reais por mês. Loucura!" (o 2º "loucura" encosta no "Tá")
];

export const p2231: Edit = {
	pasta: 'projetos/223-1',
	video: 'video.mp4',
	formato: 'vertical',
	verificarCurva: false,
	regraCamera: false,
	extraFim: 2.6,
	silencios: silencios as Trecho[],
	transcricao,
	trechos: () => semPausas(TRECHOS, silencios as Trecho[]),
	legenda: {
		estilo: 'mare',
		altura: 0.656,
		palavrasPorTela: 4,
		enfase: [
			{palavra: 'amigo', estilo: 'serif'},
			{palavra: 'gravar', estilo: 'serif'},
		],
		falantes: (b) => [
			{de: b.at('costumo') - 0.1, ate: b.say('Por quê').inicio - 0.05, nome: 'DANILOW'},
			{de: b.say('Por quê').inicio - 0.05, ate: b.at('Cara') - 0.05, nome: 'PERGUNTA'},
			{de: b.at('Cara') - 0.05, ate: b.at('Loucura') - 0.05, nome: 'DANILOW'},
		],
	},
	camera: (b) => [
		...punches(b, [[b.at('Loucura') - 0.05, b.at('Loucura') + 3]], () => ({x: 0.52, y: 0.36})),
		{tipo: 'flash', em: b.at('trinta') - 0.04},
		{tipo: 'chicote', em: b.say('Por quê').inicio - 0.04},
		{tipo: 'chicote', em: b.at('Cara') - 0.04},
		{tipo: 'flash', em: b.at('democrática') - 0.04},
	],
	cenas: (b) => {
		const fimFala = b.say('Loucura').fim;
		const cenas: Cena[] = [
			// Gancho: o dígito gira e pousa no "trinta"
			{
				tipo: 'vitoria',
				de: 0,
				ate: b.at('costumo') - 0.05,
				numero: '30',
				prefixo: 'R$',
				palavra: 'MIL',
				kicker: 'POR MÊS',
				sub: 'SEM APARECER',
				pousa: b.at('trinta'),
				y: 380,
				esconderLegenda: true,
				som: 'pro_whoosh',
				sons: [{em: b.at('trinta'), som: 'pro_pop', ganho: 0.7}],
			},
			// A mais democrática
			{
				tipo: 'selo',
				de: b.at('costumo') - 0.02,
				ate: b.say('Por quê').inicio - 0.05,
				texto: 'A MAIS DEMOCRÁTICA',
				chip: 'TIKTOK SHOP',
				emChip: b.at('TikTok'),
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [{em: b.at('democrática'), som: 'pro_pop', ganho: 0.6}],
			},
			// Qualquer pessoa: um celular + internet
			{
				tipo: 'motion3d',
				modelo: 'celularInternet',
				de: b.at('Cara') - 0.05,
				ate: b.say('Consegue fazer').fim + 0.12,
				linhas: [
					{texto: 'UM CELULAR', em: b.at('celular'), metal: 'branco'},
					{texto: '+ INTERNET', em: b.at('internet'), metal: 'ouro'},
				],
				troca: true,
				chip: 'QUALQUER PESSOA',
				som: 'pro_whoosh_curto',
				sons: [{em: b.at('internet'), som: 'pro_tick', ganho: 0.6}],
			},
			// Não precisa nada disso
			{
				tipo: 'chips',
				de: b.say('não precisa nada').inicio - 0.3,
				ate: b.say('investir em tráfego').fim + 0.12,
				itens: [
					{texto: 'PRODUTO PRONTO', em: b.at('Já')},
					{texto: 'SEM CONTRATO', em: b.at('contrato')},
					{texto: 'SEM TRÁFEGO PAGO', em: b.at('investir')},
				],
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
				sons: [{em: b.at('investir'), som: 'pro_tick', ganho: 0.6}],
			},
			// Aparecendo ou sem aparecer: silhueta atrás do celular e a câmera riscada
			{
				tipo: 'peca',
				nome: 'e2SemRosto',
				de: b.at('Aparecendo') - 0.05,
				ate: b.say('gravar o vídeo').fim + 0.08,
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
				dados: {marcos: [b.say('sem aparecer').inicio]},
			},
			// Amigo meu faz 20, 30 mil: as comissões chegando
			{
				tipo: 'notificacoes',
				de: b.say('Tem amigo').inicio - 0.05,
				ate: b.say('pega o produto aqui').inicio - 0.08,
				itens: [
					{titulo: 'TikTok Shop', texto: 'R$ 20 mil no mês', em: b.at('vinte')},
					{titulo: 'TikTok Shop', texto: 'R$ 30 mil no mês', em: b.at('trinta', 2)},
					{titulo: 'TikTok Shop', texto: 'Venda sem aparecer', em: b.say('sem aparecer', 2).inicio},
				],
				y: 1000,
				somItem: 'pro_msg',
				ganhoItem: 0.5,
			},
			// Pega, filma, não aparece: visor de câmera sobre o vídeo
			{
				tipo: 'peca',
				nome: 'p223Visor',
				de: b.say('pega o produto aqui').inicio - 0.05,
				ate: b.at('trinta', 3) - 0.1,
				esconderLegenda: true,
				som: 'pro_tick',
				dados: {
					itens: [
						{texto: 'PEGA O PRODUTO', em: b.say('pega o produto aqui').inicio},
						{texto: 'FILMA', em: b.at('filma', 2)},
						{texto: 'NÃO APARECE', em: b.at('aparece', 2)},
					],
				},
				sons: [{em: b.at('filma', 2), som: 'pro_tick', ganho: 0.5}],
			},
			// R$ 30 mil por mês (payoff do gancho)
			{
				tipo: 'numero3d',
				de: b.at('trinta', 3) - 0.1,
				ate: b.at('Loucura') - 0.03,
				texto: 'R$ 30 MIL',
				rotulo: 'POR MÊS',
				abaixo: 'SEM APARECER',
				em: b.at('trinta', 3),
				y: 400,
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [{em: b.at('trinta', 3), som: 'pro_pop', ganho: 0.7}],
			},
			{
				tipo: 'frase',
				de: b.at('Loucura') - 0.03,
				ate: fimFala + 0.3,
				palavras: [{texto: 'LOUCURA!', em: b.at('Loucura'), destaque: true}],
				som: 'pro_tick',
			},
			{tipo: 'final', de: fimFala + 0.35, ate: fimFala + 2.6, marca: 'MVM', linha2: 'CREATORS', sub: 'TIKTOK SHOP', tres: true, som: 'pro_logo'},
		];
		return cenas;
	},
};
