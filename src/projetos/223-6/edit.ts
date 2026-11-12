import type {Cena, Edit} from '../../motor/plano';
import type {Trecho} from '../../motor/palavras';
import {punches, semPausas} from '../223/comum';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// 223-6 (tema Entrevista): corte do IMG_0335 (128–178 s da gravação; video.mp4 recortado com scripts/recortar.mjs).
// Danilow (camisa preta, à direita) responde a um empresário (camisa xadrez, à esquerda).
// História: gancho "de 60 a 100 mil todo mês com live, sem ser famoso, sem produto, sem falar com cliente. Só abre a live e faz"
// → "tá falando que eu não preciso ser famoso?" → "não precisa" → plataforma democrática → "zero famoso, ninguém me conhece"
// → a empresa profissionalizou: operação de live e de vídeo → cartão final.

const TRECHOS: Trecho[] = [
	[39.6, 48.3], // gancho: "Então de sessenta a cem mil todo mês, com a live, é, sem ser famoso, sem ter produto, sem falar com cliente. Só abre a live e faz."
	[4.0, 7.3], // "Tá falando pra mim que eu não preciso ser famoso então, pra vender muito TikTok."
	[7.95, 9.8], // "Não, cara, não precisa ser famoso. Sério? Sério."
	[13.15, 18.9], // "Por isso que eu falo que é uma plataforma democrática. Sim. Porque qualquer pessoa que não é famosa consegue fazer muita grana."
	[20.3, 21.9], // "Zero famoso, ninguém me conhece."
	[21.95, 28.85], // "Hoje, a minha empresa, a gente tá mais no TikTok Shop, a gente profissionalizou, né. Nós tamo operação de live, temos operação de vídeo,"
];

export const p2236: Edit = {
	pasta: 'projetos/223-6',
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
		enfase: [{palavra: 'profissionalizou', estilo: 'serif'}],
		falantes: (b) => [
			{de: b.at('Tá') - 0.05, ate: b.say('Não, cara').inicio - 0.05, nome: 'PERGUNTA'},
			{de: b.say('Não, cara').inicio - 0.05, ate: b.say('de vídeo').fim + 0.2, nome: 'DANILOW'},
		],
	},
	camera: (b) => {
		const cheias: Trecho[] = [[b.at('Zero') - 0.05, b.at('Hoje') - 0.05]];
		return [
			...punches(b, cheias, () => ({x: 0.55, y: 0.36})),
			{tipo: 'flash', em: b.at('cem') - 0.04},
			{tipo: 'chicote', em: b.at('Tá') - 0.05},
			{tipo: 'chicote', em: b.say('Não, cara').inicio - 0.05},
			{tipo: 'flash', em: b.at('Zero') - 0.04},
		];
	},
	cenas: (b) => {
		const fimFala = b.say('de vídeo').fim + 0.1;
		const cenas: Cena[] = [
			// Gancho: R$ 100 mil todo mês com live
			{
				tipo: 'valorLife',
				de: 0,
				ate: b.at('sem') - 0.1,
				numero: '100',
				prefixo: 'R$ 60 a',
				palavra: 'mil',
				kicker: 'TODO MÊS · COM LIVE',
				pousa: b.at('cem'),
				y: 1050,
				esconderLegenda: true,
				som: 'pro_whoosh',
				sons: [{em: b.at('cem'), som: 'pro_pop', ganho: 0.7}],
			},
			{
				tipo: 'alertas',
				de: b.at('sem') - 0.1,
				ate: b.at('Só') - 0.05,
				itens: [
					{texto: 'SEM SER FAMOSO', em: b.say('sem ser famoso').inicio, icone: 'x'},
					{texto: 'SEM TER PRODUTO', em: b.say('sem ter produto').inicio, icone: 'x'},
					{texto: 'SEM FALAR COM CLIENTE', em: b.say('sem falar').inicio, icone: 'x'},
				],
				variante: 'escura',
				esconderLegenda: true,
				som: 'pro_tick',
			},
			{
				tipo: 'live',
				de: b.at('Só') - 0.05,
				ate: b.at('Tá') - 0.05,
				host: 'danilow',
				espectadores: '2,1 mil',
				coracoes: true,
				comentarios: [{nome: 'carla.vende', texto: 'quero o link!'}],
				som: 'pro_msg',
			},
			// A pergunta
			{
				tipo: 'textoLife',
				de: b.at('Tá') - 0.05,
				ate: b.say('Não, cara').inicio - 0.05,
				kicker: 'PRECISA SER',
				principal: 'famoso?',
				y: 330,
				brilho: true,
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
			},
			{
				tipo: 'medo3d',
				de: b.say('Não, cara').inicio - 0.05,
				ate: b.say('Por isso').inicio - 0.05,
				linhas: [
					{texto: 'NÃO PRECISA', em: b.say('não precisa').inicio, metal: 'branco'},
					{texto: 'SER FAMOSO', em: b.at('famoso', 2), metal: 'ouro'},
				],
				som: 'pro_whoosh',
			},
			{
				tipo: 'selo',
				de: b.say('Por isso').inicio - 0.05,
				ate: b.at('Zero') - 0.05,
				texto: 'PLATAFORMA DEMOCRÁTICA',
				chip: 'QUALQUER PESSOA',
				emChip: b.at('qualquer'),
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [{em: b.at('grana'), som: 'pro_pop', ganho: 0.5}],
			},
			{
				tipo: 'frase',
				de: b.at('Zero') - 0.05,
				ate: b.at('Hoje') - 0.05,
				palavras: [
					{texto: 'ZERO FAMOSO,', em: b.at('Zero')},
					{texto: 'ninguém me conhece', em: b.at('ninguém'), destaque: true},
				],
				som: 'pro_tick',
			},
			// A empresa profissionalizou
			{
				tipo: 'cards3d',
				de: b.at('Hoje') - 0.05,
				ate: fimFala + 0.25,
				itens: [
					{texto: 'EMPRESA NO TIKTOK SHOP', em: b.at('empresa')},
					{texto: 'OPERAÇÃO DE LIVE', em: b.say('de live').inicio + 0.1},
					{texto: 'OPERAÇÃO DE VÍDEO', em: b.say('de vídeo').inicio},
				],
				som: 'pro_swipe',
				sons: [{em: b.say('de vídeo').inicio, som: 'pro_tick', ganho: 0.5}],
			},
			{tipo: 'final', de: fimFala + 0.3, ate: fimFala + 3.0, marca: 'MÉTODO', linha2: 'M4', tres: true, som: 'pro_logo'},
		];
		return cenas;
	},
};
