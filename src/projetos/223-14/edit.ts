import type {Cena, Edit} from '../../motor/plano';
import type {Trecho} from '../../motor/palavras';
import {punches, semPausas} from '../223/comum';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// 223-14 (tema Entrevista): corte do IMG_0364 (42–100 s da gravação; video.mp4 recortado com scripts/recortar.mjs).
// A Nara (colete branco, à direita) conta como montou a agência; Danilow (camisa preta, à esquerda) ouve.
// História: gancho "hoje a gente lucra R$ 100 mil por mês com TikTok Shop" → "muito dinheiro na mesa" → "comecei gravando eu
// mesma" → "as primas queriam entrar e não sabiam como" → "sou boa em copy, escrevi as copys" → "3 primas há um ano → uma agência
// com 12 creators" → "num apartamento de 40 m², 4 lives ao mesmo tempo" → cartão final.

const TRECHOS: Trecho[] = [
	[52.1, 56.35], // gancho: "Hoje a gente consegue lucrar cem mil reais por mês com TikTok Shop."
	[4.3, 8.3], // "é muito dinheiro na mesa pra gente poder deixar essa oportunidade passar."
	[8.66, 11.32], // "Então eu comecei gravando vídeo, eu mesmo gravando vídeos."
	[11.7, 15.55], // "Aí tinha algumas primas minhas querendo entrar no mercado, elas não sabiam como entrava."
	[15.9, 18.02], // "Eu, eu era copy, eu sou bom em copy."
	[20.22, 21.68], // "comecei a escrever as copys pra ela."
	[21.93, 24.18], // "Então eu coloquei três primas minhas há um ano atrás,"
	[24.72, 29.9], // "Isso tá virando uma agência, porque hoje já são doze meninas que gravam conteúdo pra gente."
	[39.5, 46.22], // "Operação que, cara, simples, num apartamento de quarenta metros quadrados, só que a gente consegue rodar quatro lives simultâneas."
];

export const p22314: Edit = {
	pasta: 'projetos/223-14',
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
			{palavra: 'oportunidade', estilo: 'serif'},
			{palavra: 'primas', estilo: 'serif'},
		],
		falantes: (b) => [{de: b.at('dinheiro') - 0.4, ate: b.at('simultâneas') + 0.65, nome: 'NARA'}],
	},
	camera: (b) => [
		...punches(b, [], () => ({x: 0.68, y: 0.36})),
		{tipo: 'flash', em: b.at('cem') - 0.04},
		{tipo: 'flash', em: b.at('doze') - 0.04},
	],
	cenas: (b) => {
		const fimFala = b.at('simultâneas') + 0.65;
		const cenas: Cena[] = [
			{
				tipo: 'numero3d',
				de: 0,
				ate: b.at('dinheiro') - 0.4,
				texto: 'R$ 100 MIL',
				rotulo: 'DE LUCRO',
				abaixo: 'POR MÊS',
				em: b.at('cem'),
				y: 400,
				esconderLegenda: true,
				som: 'pro_whoosh',
				sons: [{em: b.at('cem'), som: 'pro_pop', ganho: 0.7}],
			},
			{
				tipo: 'textoLife',
				de: b.at('dinheiro') - 0.4,
				ate: b.at('comecei') - 0.4,
				kicker: 'TEM MUITO',
				principal: 'dinheiro na mesa',
				y: 330,
				brilho: true,
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
			},
			{
				tipo: 'celular3d',
				de: b.at('comecei') - 0.4,
				ate: b.at('primas') - 0.5,
				linhas: [
					{texto: 'EU MESMA', em: b.at('mesmo')},
					{texto: 'GRAVANDO', em: b.at('gravando', 2)},
				],
				som: 'pro_whoosh',
			},
			{
				tipo: 'alertas',
				de: b.at('primas') - 0.5,
				ate: b.at('era') - 0.1,
				itens: [{texto: 'NÃO SABIAM COMO ENTRAR', em: b.at('sabiam'), icone: 'alerta'}],
				variante: 'escura',
				esconderLegenda: true,
				som: 'pro_tick',
			},
			{
				tipo: 'comentario',
				de: b.at('era') - 0.1,
				ate: b.at('coloquei') - 0.35,
				texto: 'Copy: esse produto vai mudar sua rotina...',
				y: 1060,
				esconderLegenda: true,
				som: 'pro_digita',
			},
			// 3 primas → uma agência com 12 creators
			{
				tipo: 'cards3d',
				de: b.at('coloquei') - 0.35,
				ate: b.at('Operação') - 0.05,
				itens: [
					{texto: '3 PRIMAS', em: b.at('três')},
					{texto: 'UMA AGÊNCIA', em: b.at('agência')},
					{texto: '12 CREATORS', em: b.at('doze')},
				],
				som: 'pro_swipe',
				sons: [{em: b.at('doze'), som: 'pro_pop', ganho: 0.6}],
			},
			// 40 m², 4 lives ao mesmo tempo
			{
				tipo: 'peca',
				nome: 'p223Apto',
				de: b.at('Operação') - 0.05,
				ate: fimFala + 0.25,
				som: 'pro_whoosh_curto',
				dados: {marcos: [b.at('quarenta'), b.at('quatro')], texto: '4 lives ao mesmo tempo'},
				sons: [{em: b.at('quatro'), som: 'pro_tick', ganho: 0.6}],
			},
			{tipo: 'final', de: fimFala + 0.3, ate: fimFala + 3.0, marca: 'MÉTODO', linha2: 'M4', tres: true, som: 'pro_logo'},
		];
		return cenas;
	},
};
