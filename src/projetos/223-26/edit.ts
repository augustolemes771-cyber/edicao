import type {Cena, Edit} from '../../motor/plano';
import type {Trecho} from '../../motor/palavras';
import {punches, semPausas} from '../223/comum';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// 223-26 (tema Entrevista): corte do IMG_0364 (331–369 s). Nara (direita) e Danilow (esquerda).
// História: gancho "você não vai ter cabeça pra fazer live 8, 9, 10, 11, 12 horas por dia" → "tentei ficar à frente: duas
// personalidades diferentes" → "duas estratégias" → "você tem cabeça pra tocar o negócio" → "empresário na cadeira, gerindo" →
// "creator focado em vender: é quem gira a engrenagem; se ele não vai pra câmera, eu não vendo" → cartão final.

const TRECHOS: Trecho[] = [
	[15.68, 21.76], // "você não vai ter cabeça pra ficar na frente da câmera, fazendo live oito, nove, dez, onze, doze horas por dia."
	[4.9, 10.22], // "eu tentei ficar à frente, vender, só que é duas personalidades diferentes."
	[11.54, 12.7], // Danilow: "Duas estratégias diferentes, né?"
	[13.26, 15.64], // "você tem a cabeça pra tocar o seu negócio,"
	[23.2, 27.4], // "Então assim, o empresário ele tem que sentar na cadeira dele e focar em ser só empresário e gerir."
	[28.36, 30.86], // "E o creator, ele tem que focar em vender."
	[31.15, 37.15], // "É rotatividade, porque é o cara que gira a engrenagem. Se ele não for pra frente da câmera, eu não consigo vender meus produtos."
];

export const p22326: Edit = {
	pasta: 'projetos/223-26',
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
		enfase: [{palavra: 'engrenagem', estilo: 'serif'}],
		falantes: (b) => [{de: b.at('tentei') - 0.3, ate: b.at('produtos') + 0.6, nome: 'NARA'}],
	},
	camera: (b) => [
		...punches(b, [[b.at('empresário') - 0.9, b.at('creator') - 0.3]], () => ({x: 0.68, y: 0.36})),
		{tipo: 'flash', em: b.at('doze') - 0.04},
		{tipo: 'flash', em: b.at('engrenagem') - 0.04},
	],
	cenas: (b) => {
		const fimFala = b.at('produtos') + 0.55;
		const cenas: Cena[] = [
			{
				tipo: 'numero3d',
				de: 0,
				ate: b.at('tentei') - 0.3,
				texto: '12 HORAS',
				rotulo: 'NA FRENTE DA CÂMERA',
				abaixo: 'POR DIA',
				em: b.at('oito'),
				y: 400,
				esconderLegenda: true,
				som: 'pro_whoosh',
				sons: [{em: b.at('doze'), som: 'pro_pop', ganho: 0.7}],
			},
			{
				tipo: 'cards3d',
				de: b.at('tentei') - 0.3,
				ate: b.at('cabeça', 2) - 0.6,
				itens: [
					{texto: 'EMPRESÁRIO', em: b.at('personalidades')},
					{texto: 'CREATOR', em: b.at('estratégias')},
				],
				som: 'pro_swipe',
			},
			{
				tipo: 'selo',
				de: b.at('cabeça', 2) - 0.6,
				ate: b.at('empresário') - 0.9,
				texto: 'TOCAR O NEGÓCIO',
				chip: 'A CABEÇA DO DONO',
				emChip: b.at('negócio'),
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			{
				tipo: 'frase',
				de: b.at('empresário') - 0.9,
				ate: b.at('creator') - 0.3,
				palavras: [
					{texto: 'EMPRESÁRIO', em: b.at('empresário')},
					{texto: 'na cadeira, gerindo', em: b.at('cadeira'), destaque: true},
				],
				som: 'pro_tick',
			},
			{
				tipo: 'motion3d',
				modelo: 'positivoLive',
				de: b.at('creator') - 0.3,
				ate: b.at('Se') - 0.1,
				linhas: [
					{texto: 'CREATOR', em: b.at('creator'), metal: 'branco'},
					{texto: 'GIRA A ENGRENAGEM', em: b.at('gira'), metal: 'ouro'},
				],
				troca: true,
				chip: 'FOCO EM VENDER',
				som: 'pro_whoosh',
			},
			{
				tipo: 'alertas',
				de: b.at('Se') - 0.1,
				ate: fimFala + 0.25,
				itens: [
					{texto: 'SEM CREATOR NA CÂMERA', em: b.at('câmera', 2), icone: 'alerta'},
					{texto: 'SEM VENDA', em: b.at('vender', 3), icone: 'x'},
				],
				variante: 'escura',
				esconderLegenda: true,
				som: 'pro_tick',
			},
			{tipo: 'final', de: fimFala + 0.3, ate: fimFala + 3.0, marca: 'MÉTODO', linha2: 'M4', tres: true, som: 'pro_logo'},
		];
		return cenas;
	},
};
