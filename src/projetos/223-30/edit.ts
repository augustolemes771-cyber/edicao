import type {Cena, Edit} from '../../motor/plano';
import type {Trecho} from '../../motor/palavras';
import {punches, semPausas} from '../223/comum';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// 223-30 (tema Entrevista): corte do IMG_5778 (13–63 s). Creator (macacão vermelho, esquerda) e Danilow (direita).
// História: gancho "brilhou meus olhos: liberdade com meu filho e minha família" → "onde foi o primeiro contato?" → "comprei um
// curso de tráfego, adicionaram o TikTok" → "até que vi você" → "trabalhar e fazer live de casa" → "o céu é o limite" → "por que
// não eu?" → cartão final.

const TRECHOS: Trecho[] = [
	[35.0, 38.96], // "Então brilhou meus olhos a possibilidade de ter mais liberdade ainda com meu filho, com a minha família,"
	[20.0, 24.86], // Danilow: "onde e quando que você teve esse primeiro contato com o TikTok e por que que brilhou seus olhos assim?"
	[25.8, 29.6], // "eu comprei um curso, e aí lá ensinava tráfego pago, e depois eles adicionaram o TikTok,"
	[30.0, 34.7], // "e lá vendo as aulas me interessei bastante, até que eu vi você e chamei você lá, que a gente se encontrou e tudo mais."
	[39.08, 42.1], // "eu poder trabalhar de dentro da minha casa, fazer as lives dentro da minha casa,"
	[43.0, 46.9], // "e conseguir ter resultados que às vezes a gente nem imagina, mas que o céu é o limite, entendeu?"
	[46.9, 49.35], // "Então eu vejo muita gente, e por que não eu, né?"
];

export const p22330: Edit = {
	pasta: 'projetos/223-30',
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
		enfase: [{palavra: 'liberdade', estilo: 'serif'}],
		falantes: (b) => [
			{de: b.at('onde') - 0.1, ate: b.at('comprei') - 0.4, nome: 'PERGUNTA'},
			{de: b.at('comprei') - 0.4, ate: b.at('eu', 6) + 1, nome: 'CREATOR'},
		],
	},
	camera: (b) => {
		const danilow = (t: number) => t >= b.at('onde') - 0.1 && t < b.at('comprei') - 0.4;
		return [
			...punches(b, [], (t) => (danilow(t) ? {x: 0.68, y: 0.33} : {x: 0.34, y: 0.36})),
			{tipo: 'flash', em: b.at('liberdade') - 0.04},
			{tipo: 'chicote', em: b.at('onde') - 0.1},
			{tipo: 'chicote', em: b.at('comprei') - 0.4},
			{tipo: 'flash', em: b.at('céu') - 0.04},
		];
	},
	cenas: (b) => {
		const fimFala = b.say('por que não').fim + 0.6;
		const cenas: Cena[] = [
			{
				tipo: 'motion3d',
				modelo: 'liberdade',
				de: 0,
				ate: b.at('onde') - 0.1,
				linhas: [
					{texto: 'LIBERDADE', em: b.at('liberdade'), metal: 'ouro'},
					{texto: 'COM MEU FILHO', em: b.at('filho'), metal: 'branco'},
				],
				troca: true,
				marcos: [b.at('liberdade')],
				som: 'pro_whoosh',
			},
			{
				tipo: 'textoLife',
				de: b.at('onde') - 0.1,
				ate: b.at('comprei') - 0.4,
				kicker: 'O PRIMEIRO CONTATO',
				principal: 'por que brilhou o olho?',
				y: 330,
				brilho: true,
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
			},
			{
				tipo: 'cards3d',
				de: b.at('comprei') - 0.4,
				ate: b.at('vi') - 0.6,
				itens: [
					{texto: 'UM CURSO', em: b.at('curso')},
					{texto: 'TRÁFEGO PAGO', em: b.at('tráfego')},
					{texto: 'O TIKTOK', em: b.at('adicionaram')},
				],
				som: 'pro_swipe',
			},
			{tipo: 'pilula', de: b.at('vi') - 0.6, ate: b.at('trabalhar') - 0.5, rotulo: 'ATÉ QUE', nome: 'conheceu o Danilow', esconderLegenda: true, som: 'pro_tick'},
			{
				tipo: 'selo',
				de: b.at('trabalhar') - 0.5,
				ate: b.at('conseguir') - 0.3,
				texto: 'LIVE DE CASA',
				chip: 'TRABALHAR DE CASA',
				emChip: b.at('trabalhar'),
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			{
				tipo: 'frase',
				de: b.at('conseguir') - 0.3,
				ate: b.at('vejo') - 0.1,
				palavras: [
					{texto: 'O CÉU', em: b.at('céu')},
					{texto: 'é o limite', em: b.at('limite'), destaque: true},
				],
				som: 'pro_tick',
			},
			{
				tipo: 'selo',
				de: b.at('vejo') - 0.1,
				ate: fimFala + 0.25,
				texto: 'POR QUE NÃO EU?',
				chip: 'MUITA GENTE CONSEGUE',
				emChip: b.at('vejo'),
				esconderLegenda: true,
				som: 'pro_pop',
			},
			{tipo: 'final', de: fimFala + 0.3, ate: fimFala + 3.0, marca: 'MÉTODO', linha2: 'M4', tres: true, som: 'pro_logo'},
		];
		return cenas;
	},
};
