import type {Cena, Edit} from '../../motor/plano';
import type {Trecho} from '../../motor/palavras';
import {punches, semPausas} from '../223/comum';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// 223-32 (tema Entrevista): corte do IMG_5778 (162–208 s). Creator (macacão vermelho, esquerda) e Danilow (direita).
// Transcrição corrigida: "pop" → "copy". História: gancho "só pega, grava e posta" → "recado pro iniciante" → "procure a M4:
// suporte pra começar do jeito certo" → "sozinho dá, com equipe é melhor" → "copy, edição" → "sem tráfego, sem produto, sem
// contrato" → "só pega, grava e posta" → cartão final.

const TRECHOS: Trecho[] = [
	[40.44, 41.9], // gancho: "Só pega, grava e posta."
	[2.48, 7.28], // Danilow: "E pra quem quer começar o TikTok Shop, então, pro iniciante, dá um recado pra quem quer fazer TikTok, então."
	[7.28, 17.48], // "Pra você que quer começar no TikTok, procure aqui a M4... pra você iniciar na operação da forma correta."
	[17.48, 23.1], // "Tem como, sim, você começar isso, é, sozinho, mas é muito melhor quando você tem uma equipe especializada"
	[23.4, 26.5], // "que vai te ajudar nisso, que sabe sobre copy, que sabe sobre edição,"
	[32.74, 40.3], // Danilow: "Cara, sem investir em tráfego, sem ter o produto em mãos, sem ser dono do produto, sem ter contrato com o cliente."
	[40.44, 41.9], // "Só pega, grava e posta."
];

export const p22332: Edit = {
	pasta: 'projetos/223-32',
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
		enfase: [{palavra: 'correta', estilo: 'serif'}],
		falantes: (b) => [
			{de: b.at('começar') - 0.6, ate: b.at('você') - 0.3, nome: 'PERGUNTA'},
			{de: b.at('você') - 0.3, ate: b.at('edição') + 0.5, nome: 'CREATOR'},
		],
	},
	camera: (b) => {
		const creator = (t: number) => t >= b.at('você') - 0.3 && t < b.at('Cara') - 0.1;
		const cheias: Trecho[] = [
			[0, b.at('começar') - 0.6],
			[b.at('sozinho') - 1.4, b.at('especializada') + 0.4],
		];
		return [
			...punches(b, cheias, (t) => (creator(t) ? {x: 0.34, y: 0.36} : {x: 0.68, y: 0.33})),
			{tipo: 'flash', em: b.at('M4') - 0.04},
			{tipo: 'chicote', em: b.at('você') - 0.3},
			{tipo: 'chicote', em: b.at('Cara') - 0.1},
			{tipo: 'flash', em: b.at('posta', 2) - 0.04},
		];
	},
	cenas: (b) => {
		const fimFala = b.at('posta', 2) + 0.5;
		const cenas: Cena[] = [
			{
				tipo: 'frase',
				de: 0,
				ate: b.at('começar') - 0.6,
				palavras: [
					{texto: 'PEGA,', em: b.at('pega')},
					{texto: 'GRAVA', em: b.at('grava')},
					{texto: 'e posta.', em: b.at('posta'), destaque: true},
				],
				som: 'pro_whoosh',
			},
			{
				tipo: 'textoLife',
				de: b.at('começar') - 0.6,
				ate: b.at('você') - 0.3,
				kicker: 'PRO INICIANTE',
				principal: 'um recado',
				y: 330,
				brilho: true,
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
			},
			{
				tipo: 'selo',
				de: b.at('você') - 0.3,
				ate: b.at('sozinho') - 1.4,
				texto: 'PROCURE A M4',
				chip: 'SUPORTE COMPLETO',
				emChip: b.at('suporte'),
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [{em: b.at('M4'), som: 'pro_pop', ganho: 0.6}],
			},
			{
				tipo: 'gradeAntesDepois',
				de: b.at('sozinho') - 1.4,
				ate: b.at('especializada') + 0.4,
				titulo: [{texto: 'COMEÇAR', em: b.at('sozinho') - 1.2}],
				antes: {texto: 'SOZINHO', em: b.at('sozinho'), valor: 'DÁ'},
				depois: {texto: 'COM EQUIPE', em: b.at('equipe'), valor: 'MELHOR'},
				som: 'pro_whoosh',
			},
			{
				tipo: 'cards3d',
				de: b.at('especializada') + 0.4,
				ate: b.at('Cara') - 0.1,
				itens: [
					{texto: 'COPY', em: b.at('copy')},
					{texto: 'EDIÇÃO', em: b.at('edição')},
				],
				som: 'pro_swipe',
			},
			{
				tipo: 'alertas',
				de: b.at('Cara') - 0.1,
				ate: b.at('pega', 2) - 0.1,
				itens: [
					{texto: 'SEM TRÁFEGO', em: b.at('tráfego'), icone: 'x'},
					{texto: 'SEM PRODUTO EM MÃOS', em: b.at('mãos'), icone: 'x'},
					{texto: 'SEM CONTRATO', em: b.at('contrato'), icone: 'x'},
				],
				variante: 'escura',
				esconderLegenda: true,
				som: 'pro_tick',
			},
			{
				tipo: 'chips',
				de: b.at('pega', 2) - 0.1,
				ate: fimFala + 0.25,
				itens: [
					{texto: 'PEGA', em: b.at('pega', 2)},
					{texto: 'GRAVA', em: b.at('grava', 2)},
					{texto: 'POSTA', em: b.at('posta', 2)},
				],
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
			},
			{tipo: 'final', de: fimFala + 0.3, ate: fimFala + 3.0, marca: 'MÉTODO', linha2: 'M4', tres: true, som: 'pro_logo'},
		];
		return cenas;
	},
};
