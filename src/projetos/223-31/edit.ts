import type {Cena, Edit} from '../../motor/plano';
import type {Trecho} from '../../motor/palavras';
import {punches, semPausas} from '../223/comum';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// 223-31 (tema Entrevista): corte do IMG_5778 (61–91 s). Creator (macacão vermelho, esquerda) e Danilow (direita).
// História: gancho "não entendem que é um trabalho sério" → "muita gente não acredita no TikTok" → "'tá doida? É dancinha?'" →
// "tem uma equipe por trás e tá dando certo" → "é uma profissão" → "tá mudando a vida de muita gente" → cartão final.

const TRECHOS: Trecho[] = [
	[10.9, 13.02], // "não entende que é um trabalho sério,"
	[2.05, 4.95], // "E muita gente não acredita no TikTok, véi, cê pira."
	[6.05, 10.55], // "A gente fala, às vezes a pessoa: 'Nõ, tá doida, que que é isso?' Acha que é fazer dancinha, né?"
	[13.4, 19.55], // "é uma equipe que tá por trás, igual a sua operação... pra fazer aquilo dar certo, e tá dando certo, graças a Deus."
	[19.9, 23.4], // "Então as pessoas têm que entender que isso é uma profissão, e é uma profissão,"
	[23.44, 27.9], // "cara, que tem que ser muito respeitado, porque tá mudando a vida de muita gente, né, hoje."
];

export const p22331: Edit = {
	pasta: 'projetos/223-31',
	video: 'video.mp4',
	formato: 'vertical',
	verificarCurva: false,
	regraCamera: false,
	extraFim: 3.5,
	silencios: silencios as Trecho[],
	transcricao,
	trechos: () => semPausas(TRECHOS, silencios as Trecho[]),
	legenda: {
		estilo: 'mare',
		altura: 0.656,
		palavrasPorTela: 4,
		enfase: [{palavra: 'respeitado', estilo: 'serif'}],
		falantes: (b) => [{de: b.at('gente') - 0.3, ate: b.at('hoje') + 0.5, nome: 'CREATOR'}],
	},
	camera: (b) => [
		...punches(b, [[b.at('doida') - 1.0, b.at('dancinha') + 0.5]], () => ({x: 0.36, y: 0.36})),
		{tipo: 'flash', em: b.at('sério') - 0.04},
		{tipo: 'flash', em: b.at('profissão') - 0.04},
	],
	cenas: (b) => {
		const fimFala = b.at('hoje') + 0.4;
		const cenas: Cena[] = [
			{
				tipo: 'medo3d',
				de: 0,
				ate: b.at('muita') - 0.15,
				linhas: [
					{texto: 'É UM TRABALHO', em: b.at('trabalho'), metal: 'branco'},
					{texto: 'SÉRIO', em: b.at('sério'), metal: 'ouro'},
				],
				som: 'pro_whoosh',
			},
			{
				tipo: 'alertas',
				de: b.at('muita') - 0.15,
				ate: b.at('doida') - 1.0,
				itens: [{texto: 'NÃO ACREDITAM NO TIKTOK', em: b.at('acredita'), icone: 'alerta'}],
				variante: 'escura',
				esconderLegenda: true,
				som: 'pro_tick',
			},
			{
				tipo: 'frase',
				de: b.at('doida') - 1.0,
				ate: b.at('dancinha') + 0.5,
				palavras: [
					{texto: '"TÁ DOIDA?"', em: b.at('doida') - 0.2},
					{texto: 'dancinha?', em: b.at('dancinha'), destaque: true},
				],
				som: 'pro_tick',
			},
			{
				tipo: 'cards3d',
				de: b.at('dancinha') + 0.5,
				ate: b.at('Então') - 0.1,
				itens: [
					{texto: 'UMA EQUIPE', em: b.at('equipe')},
					{texto: 'UMA OPERAÇÃO', em: b.at('operação')},
					{texto: 'DANDO CERTO', em: b.at('dando')},
				],
				som: 'pro_swipe',
			},
			{
				tipo: 'selo',
				de: b.at('Então') - 0.1,
				ate: b.at('respeitado') - 0.8,
				texto: 'É UMA PROFISSÃO',
				chip: 'RESPEITE',
				emChip: b.at('profissão', 2),
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			{
				tipo: 'textoLife',
				de: b.at('respeitado') - 0.8,
				ate: fimFala + 0.25,
				kicker: 'TÁ MUDANDO',
				principal: 'a vida de muita gente',
				y: 330,
				brilho: true,
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
			},
			{tipo: 'final', de: fimFala + 0.3, ate: fimFala + 3.5, marca: 'MÉTODO', linha2: 'M4', tres: true, som: 'pro_logo'},
		];
		return cenas;
	},
};
