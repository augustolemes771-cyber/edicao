import type {Cena, Edit} from '../../motor/plano';
import type {Trecho} from '../../motor/palavras';
import {punches, semPausas} from '../223/comum';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// 223-12 (tema Entrevista): corte do IMG_0364 (123–193 s da gravação; video.mp4 recortado com scripts/recortar.mjs).
// A Nara, dona de agência de creators (colete branco, à direita), fala com o Danilow (camisa preta, à esquerda).
// História: gancho "não flopa e vende 500, 600, 700, 800 mil: um afiliado, uma conta" → "o modelo de negócio pro longo prazo"
// → "pode soar estranho, mas é exclusividade de link" → "sem concorrente no link: 16 horas de live e anos vendendo" → "um amigo
// tem exclusividade com produtores gigantes" → "cem afiliados que não vendem ou um que vende 800 mil?" → cartão final.

const TRECHOS: Trecho[] = [
	[41.82, 46.36], // gancho: "Não flopa, e vende quinhentos, seiscentos mil, setecentos mil, oitocentos mil, um afiliado, uma conta."
	[5.28, 11.0], // "o modelo de negócio que a gente vê vantagem pra afiliados, pra gente no longo prazo?"
	[13.36, 19.22], // "no primeiro momento pode soar estranho, mas é exclusividade, tá? Exclusividade de link de produtos."
	[19.55, 22.32], // "Porque se a gente não tiver concorrente naquele link, a gente consegue"
	[22.67, 25.9], // "Colocar dezesseis horas na live e ficar anos vendendo aquele produto."
	[26.45, 32.8], // "Porque ó, tem um amigo meu que tem exclusividade com produtores grandes, gigante, que vende milhões."
	[46.82, 54.9], // "Então cê quer ter cem afiliados que não vendem... ou cê quer um afiliado que vende setecentos mil, oitocentos mil?"
];

export const p22312: Edit = {
	pasta: 'projetos/223-12',
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
		enfase: [{palavra: 'estranho', estilo: 'serif'}],
		falantes: (b) => [{de: b.at('modelo') - 0.1, ate: b.at('oitocentos', 2) + 0.7, nome: 'NARA'}],
	},
	camera: (b) => {
		const cheias: Trecho[] = [[b.at('primeiro') - 0.3, b.say('Exclusividade de link').inicio - 0.05]];
		return [
			...punches(b, cheias, () => ({x: 0.68, y: 0.36})),
			{tipo: 'flash', em: b.at('oitocentos') - 0.04},
			{tipo: 'flash', em: b.at('exclusividade') - 0.04},
		];
	},
	cenas: (b) => {
		const fimFala = b.at('oitocentos', 2) + 0.7;
		const cenas: Cena[] = [
			// Gancho: R$ 800 mil, um afiliado, uma conta
			{
				tipo: 'vitoria',
				de: 0,
				ate: b.at('modelo') - 0.1,
				numero: '800',
				prefixo: 'R$',
				palavra: 'MIL',
				kicker: 'UM AFILIADO',
				sub: 'UMA CONTA',
				pousa: b.at('oitocentos'),
				y: 1060,
				esconderLegenda: true,
				som: 'pro_whoosh',
				sons: [{em: b.at('oitocentos'), som: 'pro_pop', ganho: 0.7}],
			},
			{
				tipo: 'textoLife',
				de: b.at('modelo') - 0.1,
				ate: b.at('primeiro') - 0.3,
				kicker: 'O MODELO DE NEGÓCIO',
				principal: 'pro longo prazo',
				y: 330,
				brilho: true,
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
			},
			{
				tipo: 'frase',
				de: b.at('primeiro') - 0.3,
				ate: b.say('Exclusividade de link').inicio - 0.05,
				palavras: [
					{texto: 'PODE SOAR ESTRANHO,', em: b.at('soar')},
					{texto: 'exclusividade', em: b.at('exclusividade'), destaque: true},
				],
				som: 'pro_tick',
			},
			{
				tipo: 'selo',
				de: b.say('Exclusividade de link').inicio - 0.05,
				ate: b.say('Porque se').inicio - 0.05,
				texto: 'LINK EXCLUSIVO',
				chip: 'DE PRODUTO',
				emChip: b.at('produtos'),
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			// Sem concorrente: 16 horas de live, anos vendendo
			{
				tipo: 'numero3d',
				de: b.say('Porque se').inicio - 0.05,
				ate: b.at('amigo') - 0.55,
				texto: '16 HORAS',
				rotulo: 'SEM CONCORRENTE',
				abaixo: 'DE LIVE',
				em: b.at('dezesseis'),
				y: 400,
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [{em: b.at('dezesseis'), som: 'pro_pop', ganho: 0.6}],
			},
			{
				tipo: 'chips',
				de: b.at('amigo') - 0.55,
				ate: b.at('Então') - 0.05,
				itens: [
					{texto: 'EXCLUSIVIDADE', em: b.say('tem exclusividade').inicio + 0.1},
					{texto: 'PRODUTORES GIGANTES', em: b.at('produtores')},
					{texto: 'VENDE MILHÕES', em: b.at('milhões')},
				],
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
			},
			// 100 afiliados que não vendem × 1 que vende 800 mil
			{
				tipo: 'gradeAntesDepois',
				de: b.at('Então') - 0.05,
				ate: fimFala + 0.25,
				titulo: [{texto: 'O QUE VOCÊ QUER?', em: b.at('quer')}],
				antes: {texto: '100 AFILIADOS', em: b.at('cem'), valor: 'NÃO VENDEM'},
				depois: {texto: '1 AFILIADO', em: b.at('oitocentos', 2), valor: 'R$ 800 MIL'},
				som: 'pro_whoosh',
			},
			{tipo: 'final', de: fimFala + 0.3, ate: fimFala + 3.0, marca: 'MÉTODO', linha2: 'M4', tres: true, som: 'pro_logo'},
		];
		return cenas;
	},
};
