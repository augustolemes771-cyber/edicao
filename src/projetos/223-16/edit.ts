import type {Cena, Edit} from '../../motor/plano';
import type {Trecho} from '../../motor/palavras';
import {punches, semPausas} from '../223/comum';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// 223-16 (tema Entrevista): corte do IMG_0335 (175–218 s da gravação; video.mp4 recortado com scripts/recortar.mjs).
// O empresário (camisa xadrez, à esquerda) pergunta; Danilow (camisa preta, à direita) responde.
// História: gancho "80/20 do TikTok Shop é produto: é escolher o produto" → "me identifico ou pesquiso o que mais vende?" →
// "duas formas: produto com identificação ou link que já vende" → "link validado" → "não é só chegar e gravar" → "precisa
// entender" → cartão final.

const TRECHOS: Trecho[] = [
	[6.38, 10.8], // gancho: "Oitenta vinte do TikTok Shop é produto, tanto vídeo quanto live, sabe? É escolher o produto."
	[10.76, 14.1], // "Eu preciso me identificar com o produto ou eu pesquiso o produto que mais tá vendendo?"
	[18.1, 24.2], // "Duas formas: você pode vender um produto que você tem identificação... cê vai gostar de fazer aquilo."
	[24.52, 29.85], // "Como você pode escolher qualquer tipo de produto, estuda seu produto e escolhe um link que já vende."
	[30.3, 32.3], // "Então é uma forma, um link validado, que a gente fala."
	[33.42, 36.8], // "Não é só chegar, falar 'quero vender', pegar o meu celular e começar a gravar, não."
	[40.38, 41.84], // "É, cê precisa entender, cara." (o "é coisa simples" passa do fim do trecho convertido)
];

export const p22316: Edit = {
	pasta: 'projetos/223-16',
	video: 'video.mp4',
	formato: 'vertical',
	verificarCurva: false,
	regraCamera: false,
	extraFim: 3.6,
	silencios: silencios as Trecho[],
	transcricao,
	trechos: () => semPausas(TRECHOS, silencios as Trecho[]),
	legenda: {
		estilo: 'mare',
		altura: 0.656,
		palavrasPorTela: 4,
		enfase: [{palavra: 'identificação', estilo: 'serif'}],
		falantes: (b) => [
			{de: b.at('identificar') - 0.6, ate: b.at('Duas') - 0.05, nome: 'PERGUNTA'},
			{de: b.at('Duas') - 0.05, ate: b.say('Não é só chegar').inicio - 0.05, nome: 'DANILOW'},
			{de: b.say('Não é só chegar').inicio - 0.05, ate: b.say('cê precisa').inicio - 0.05, nome: 'EMPRESÁRIO'},
			{de: b.say('cê precisa').inicio - 0.05, ate: b.at('entender') + 0.95, nome: 'DANILOW'},
		],
	},
	camera: (b) => {
		const empresario = (t: number) =>
			(t >= b.at('identificar') - 0.6 && t < b.at('Duas') - 0.05) || (t >= b.say('Não é só chegar').inicio - 0.05 && t < b.say('cê precisa').inicio - 0.05);
		const cheias: Trecho[] = [[b.say('cê precisa').inicio - 0.05, b.at('entender') + 2]];
		return [
			...punches(b, cheias, (t) => (empresario(t) ? {x: 0.36, y: 0.36} : {x: 0.62, y: 0.35})),
			{tipo: 'flash', em: b.at('Oitenta') - 0.04},
			{tipo: 'chicote', em: b.at('identificar') - 0.6},
			{tipo: 'chicote', em: b.at('Duas') - 0.05},
			{tipo: 'chicote', em: b.say('Não é só chegar').inicio - 0.05},
			{tipo: 'flash', em: b.at('entender') - 0.04},
		];
	},
	cenas: (b) => {
		const fimFala = b.at('entender') + 0.9;
		const cenas: Cena[] = [
			{
				tipo: 'numero3d',
				de: 0,
				ate: b.at('identificar') - 0.6,
				texto: '80/20',
				rotulo: 'DO TIKTOK SHOP',
				abaixo: 'É O PRODUTO',
				em: b.at('Oitenta'),
				y: 400,
				esconderLegenda: true,
				som: 'pro_whoosh',
				sons: [{em: b.at('vinte'), som: 'pro_pop', ganho: 0.7}],
			},
			{
				tipo: 'textoLife',
				de: b.at('identificar') - 0.6,
				ate: b.at('Duas') - 0.05,
				kicker: 'A DÚVIDA',
				principal: 'gostar ou o que vende?',
				y: 330,
				brilho: true,
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
			},
			{
				tipo: 'cards3d',
				de: b.at('Duas') - 0.05,
				ate: b.at('validado') - 0.5,
				itens: [
					{texto: 'IDENTIFICAÇÃO', em: b.at('identificação')},
					{texto: 'LINK QUE JÁ VENDE', em: b.at('link')},
				],
				som: 'pro_swipe',
				sons: [{em: b.at('link'), som: 'pro_tick', ganho: 0.5}],
			},
			{
				tipo: 'selo',
				de: b.at('validado') - 0.5,
				ate: b.say('Não é só chegar').inicio - 0.05,
				texto: 'LINK VALIDADO',
				chip: 'JÁ VENDE',
				emChip: b.at('validado'),
				esconderLegenda: true,
				som: 'pro_pop',
			},
			{
				tipo: 'alertas',
				de: b.say('Não é só chegar').inicio - 0.05,
				ate: b.say('cê precisa').inicio - 0.05,
				itens: [{texto: 'SÓ CHEGAR E GRAVAR', em: b.at('gravar'), icone: 'x'}],
				variante: 'escura',
				esconderLegenda: true,
				som: 'pro_tick',
			},
			{
				tipo: 'frase',
				de: b.say('cê precisa').inicio - 0.05,
				ate: fimFala + 0.25,
				palavras: [
					{texto: 'PRECISA', em: b.at('precisa')},
					{texto: 'entender.', em: b.at('entender'), destaque: true},
				],
				som: 'pro_tick',
			},
			{tipo: 'final', de: fimFala + 0.3, ate: fimFala + 3.6, marca: 'MÉTODO', linha2: 'M4', tres: true, som: 'pro_logo'},
		];
		return cenas;
	},
};
