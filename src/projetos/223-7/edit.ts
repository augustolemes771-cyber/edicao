import type {Cena, Edit} from '../../motor/plano';
import type {Trecho} from '../../motor/palavras';
import {punches, semPausas} from '../223/comum';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// 223-7 (tema Entrevista): corte do IMG_0335 (266–321 s da gravação; video.mp4 recortado com scripts/recortar.mjs).
// O empresário (camisa xadrez, à esquerda) resume o que aprendeu; Danilow (camisa preta, à direita) responde.
// História: gancho "um vídeo cê faz em 3 minutos" → "não preciso falar bem nem ter 1 milhão de seguidores: crio a conta,
// escolho o produto e o nicho, faço o vídeo e acredito" → "Constância: postar todo dia" → "TikTok não tem perfeição, é orgânico
// caseiro" → "na era da IA, quanto mais orgânico, mais conecta: é o que vende" → cartão final.

const TRECHOS: Trecho[] = [
	[24.45, 27.1], // gancho: "Um vídeo cê faz em três minutos."
	[2.95, 6.3], // "Então eu não preciso falar bem, eu não preciso ter ali um milhão de seguidores."
	[9.6, 17.6], // "é que eu posso criar uma conta... escolher um produto, escolher um nicho... fazer o meu vídeo e acreditar que realmente vai acontecer."
	[17.85, 24.2], // "Constância. Constância. Só seguir uma coisa... é postar todo dia, nem que for um vídeo."
	[36.2, 38.98], // "TikTok não tem perfeição, não tem aquele vídeo editado, que foi pro editor, não."
	[40.45, 42.12], // "É orgânico caseiro."
	[47.65, 53.92], // "Hoje em dia nós tamo muito na IA, tecnologia, então quanto mais orgânico, quanto mais cês conectam pessoas, cara, é o que vende."
];

export const p2237: Edit = {
	pasta: 'projetos/223-7',
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
		enfase: [{palavra: 'conectam', estilo: 'serif'}],
		falantes: (b) => [
			{de: b.at('Então') - 0.05, ate: b.at('Constância') - 0.05, nome: 'EMPRESÁRIO'},
			{de: b.at('Constância') - 0.05, ate: b.at('vende') + 0.5, nome: 'DANILOW'},
		],
	},
	camera: (b) => {
		const cheias: Trecho[] = [[b.at('Constância') - 0.05, b.at('Só') - 0.05]];
		const empresario = (t: number) => t >= b.at('Então') - 0.05 && t < b.at('Constância') - 0.05;
		return [
			...punches(b, cheias, (t) => (empresario(t) ? {x: 0.36, y: 0.36} : {x: 0.62, y: 0.35})),
			{tipo: 'flash', em: b.at('três') - 0.04},
			{tipo: 'chicote', em: b.at('Então') - 0.05},
			{tipo: 'chicote', em: b.at('Constância') - 0.05},
			{tipo: 'flash', em: b.at('vende') - 0.04},
		];
	},
	cenas: (b) => {
		const fimFala = b.at('vende') + 0.45;
		const cenas: Cena[] = [
			{
				tipo: 'numero3d',
				de: 0,
				ate: b.at('Então') - 0.05,
				texto: '3 MIN',
				rotulo: 'UM VÍDEO EM',
				abaixo: 'SEM DESCULPA',
				em: b.at('três'),
				y: 400,
				esconderLegenda: true,
				som: 'pro_whoosh',
				sons: [{em: b.at('três'), som: 'pro_pop', ganho: 0.7}],
			},
			{
				tipo: 'alertas',
				de: b.at('Então') - 0.05,
				ate: b.at('posso') - 0.4,
				itens: [
					{texto: 'FALAR BEM', em: b.say('falar bem').inicio, icone: 'x'},
					{texto: '1 MILHÃO DE SEGUIDORES', em: b.at('milhão'), icone: 'x'},
				],
				variante: 'escura',
				esconderLegenda: true,
				som: 'pro_tick',
			},
			{
				tipo: 'chips',
				de: b.at('posso') - 0.4,
				ate: b.at('Constância') - 0.05,
				itens: [
					{texto: 'CRIAR A CONTA', em: b.at('criar')},
					{texto: 'ESCOLHER O PRODUTO', em: b.at('escolher')},
					{texto: 'O NICHO', em: b.at('nicho')},
					{texto: 'FAZER O VÍDEO', em: b.at('fazer')},
					{texto: 'ACREDITAR', em: b.at('acreditar')},
				],
				numerado: true,
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
				sons: [{em: b.at('acreditar'), som: 'pro_tick', ganho: 0.5}],
			},
			{
				tipo: 'frase',
				de: b.at('Constância') - 0.05,
				ate: b.at('Só') - 0.05,
				palavras: [{texto: 'CONSTÂNCIA.', em: b.at('Constância'), destaque: true}],
				som: 'pro_pop',
			},
			{
				tipo: 'selo',
				de: b.at('Só') - 0.05,
				ate: b.at('TikTok', 2) - 0.05,
				texto: 'POSTAR TODO DIA',
				chip: 'NEM QUE SEJA 1 VÍDEO',
				emChip: b.at('nem'),
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			{
				tipo: 'celular3d',
				de: b.at('TikTok', 2) - 0.05,
				ate: b.at('orgânico') - 0.4,
				linhas: [
					{texto: 'SEM PERFEIÇÃO', em: b.at('perfeição')},
					{texto: 'SEM EDITOR', em: b.at('editado')},
				],
				som: 'pro_whoosh',
			},
			{
				tipo: 'textoLife',
				de: b.at('orgânico') - 0.4,
				ate: b.at('Hoje') - 0.05,
				kicker: 'O QUE FUNCIONA',
				principal: 'orgânico e caseiro',
				y: 330,
				brilho: true,
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
			},
			{
				tipo: 'motion3d',
				modelo: 'robos',
				de: b.at('Hoje') - 0.05,
				ate: fimFala + 0.25,
				linhas: [
					{texto: 'TUDO É IA', em: b.at('IA'), metal: 'branco'},
					{texto: 'CONEXÃO VENDE', em: b.at('conectam'), metal: 'ouro'},
				],
				troca: true,
				chip: 'O QUE VENDE',
				som: 'pro_whoosh',
				sons: [{em: b.at('conectam'), som: 'pro_swipe', ganho: 0.6}],
			},
			{tipo: 'final', de: fimFala + 0.3, ate: fimFala + 3.0, marca: 'MÉTODO', linha2: 'M4', tres: true, som: 'pro_logo'},
		];
		return cenas;
	},
};
