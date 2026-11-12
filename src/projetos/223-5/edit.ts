import type {Cena, Edit} from '../../motor/plano';
import type {Trecho} from '../../motor/palavras';
import {punches, semPausas} from '../223/comum';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// 223-5 (tema Entrevista): corte do IMG_5778 (88–166 s da gravação; video.mp4 recortado com scripts/recortar.mjs).
// Uma creator da M4 (macacão vermelho, à esquerda) e o Danilow (camisa preta, à direita). Rostos em y ≈ 0,30–0,36.
// História: gancho "ninguém quer ser CLT pro resto da vida, ficar preso" → Danilow: "as pessoas são um pouco vitimistas:
// trabalham das 8 às 18, chegam em casa e falam que não têm tempo. É desculpa?" → ela: "1 ou 2 horas no seu dia, rolando a
// tela fazendo nada... numa live dá pra fazer 500, mil reais por dia" → prioridade, todo mundo quer ser livre → "isso pode te
// tirar da CLT e virar sua renda principal" → cartão final.

const TRECHOS: Trecho[] = [
	[33.82, 36.2], // gancho: "Ninguém quer ser CLT pro resto da vida, ficar preso,"
	[4.72, 6.72], // "as pessoas, elas são um pouco vitimista,"
	[7.28, 8.5], // "ela vai ter que trabalhar em um lugar,"
	[8.9, 9.8], // "normalmente das oito"
	[10.54, 11.3], // "às dezoito,"
	[12.14, 15.02], // "daí chega em casa e fala que não tem tempo e tudo mais."
	[15.3, 18.56], // "Cê acha que essas pessoas que não têm tempo, é porque é desculpa"
	[43.84, 50.0], // "eu acho que se você tem ali uma ou duas horas disponível no seu dia, e às vezes cê tá rolando a tela do seu celular fazendo absolutamente nada,"
	[52.6, 58.12], // "cê pode estar investindo às vezes numa live que cê pode fazer ali quinhentos reais, mil reais por dia ou muito mais, entendeu?"
	[58.75, 61.9], // "É só definir uma prioridade, né? Prioridade, todo mundo quer ser livre."
	[72.62, 76.2], // "Com certeza, que isso pode te tirar do CLT e se tornar sua renda principal"
];

export const p2235: Edit = {
	pasta: 'projetos/223-5',
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
			{palavra: 'casa', estilo: 'serif'},
			{palavra: 'celular', estilo: 'serif'},
		],
		falantes: (b) => [
			{de: b.at('pessoas') - 0.05, ate: b.at('acho') - 0.05, nome: 'DANILOW'},
			{de: b.at('acho') - 0.05, ate: b.at('investindo') - 0.3, nome: 'CREATOR'},
		],
	},
	camera: (b) => {
		const cheias: Trecho[] = [[b.at('desculpa') - 0.35, b.at('acho') - 0.05]];
		const danilow = (t: number) => t >= b.at('pessoas') - 0.05 && t < b.at('acho') - 0.05;
		return [
			...punches(b, cheias, (t) => (danilow(t) ? {x: 0.66, y: 0.33} : {x: 0.36, y: 0.35})),
			{tipo: 'flash', em: b.at('CLT') - 0.04},
			{tipo: 'chicote', em: b.at('pessoas') - 0.05},
			{tipo: 'chicote', em: b.at('acho') - 0.05},
			{tipo: 'chicote', em: b.at('Com') - 0.05},
			{tipo: 'flash', em: b.at('renda') - 0.04},
		];
	},
	cenas: (b) => {
		const fimFala = b.at('principal') + 0.5;
		const cenas: Cena[] = [
			// Gancho: preso na CLT (carteira, grades, cadeado)
			{
				tipo: 'presoClt',
				de: 0,
				ate: b.at('pessoas') - 0.05,
				em: b.at('CLT'),
				emCadeado: b.at('preso'),
				texto: 'PRESO NA',
				destaque: 'CLT',
				som: 'pro_whoosh',
				sons: [{em: b.at('preso'), som: 'pro_quebra', ganho: 0.5}],
			},
			{
				tipo: 'textoLife',
				de: b.at('pessoas') - 0.05,
				ate: b.at('ela') - 0.08,
				kicker: 'AS PESSOAS SÃO',
				principal: 'um pouco vitimistas',
				y: 330,
				brilho: true,
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
			},
			{
				tipo: 'selo',
				de: b.at('ela') - 0.08,
				ate: b.at('daí') - 0.05,
				texto: 'DAS 8H ÀS 18H',
				chip: 'TRABALHANDO',
				emChip: b.at('trabalhar'),
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			{
				tipo: 'alertas',
				de: b.at('daí') - 0.05,
				ate: b.at('Cê') - 0.05,
				itens: [{texto: 'NÃO TENHO TEMPO', em: b.say('não tem tempo').inicio, icone: 'alerta'}],
				variante: 'escura',
				esconderLegenda: true,
				som: 'pro_tick',
			},
			// A pergunta: é desculpa?
			{
				tipo: 'frase',
				de: b.at('desculpa') - 0.35,
				ate: b.at('acho') - 0.05,
				palavras: [
					{texto: 'É', em: b.at('desculpa') - 0.3},
					{texto: 'DESCULPA?', em: b.at('desculpa'), destaque: true},
				],
				som: 'pro_tick',
			},
			// 1 ou 2 horas do seu dia
			{
				tipo: 'peca',
				nome: 'p223Relogio',
				de: b.at('uma') - 0.3,
				ate: b.at('rolando') - 0.35,
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
				dados: {marcos: [b.at('duas')]},
				sons: [{em: b.at('duas'), som: 'pro_tick', ganho: 0.6}],
			},
			// ... rolando a tela, fazendo nada
			{
				tipo: 'alertas',
				de: b.at('rolando') - 0.3,
				ate: b.at('investindo') - 0.3,
				itens: [
					{texto: 'ROLANDO A TELA', em: b.at('rolando'), icone: 'x'},
					{texto: 'ABSOLUTAMENTE NADA', em: b.at('absolutamente'), icone: 'x'},
				],
				variante: 'escura',
				esconderLegenda: true,
				som: 'pro_tick',
			},
			// Numa live: 500, mil reais por dia
			{
				tipo: 'numero3d',
				de: b.at('investindo') - 0.3,
				ate: b.say('É só definir').inicio - 0.08,
				texto: 'R$ 1 MIL',
				rotulo: 'NUMA LIVE',
				abaixo: 'POR DIA',
				em: b.at('quinhentos'),
				y: 400,
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [{em: b.at('mil'), som: 'pro_pop', ganho: 0.7}],
			},
			// Prioridade: todo mundo quer ser livre
			{
				tipo: 'motion3d',
				modelo: 'liberdade',
				de: b.say('É só definir').inicio - 0.08,
				ate: b.at('Com') - 0.08,
				linhas: [
					{texto: 'PRIORIDADE', em: b.at('prioridade'), metal: 'branco'},
					{texto: 'SER LIVRE', em: b.at('livre'), metal: 'ouro'},
				],
				troca: true,
				marcos: [b.at('livre')],
				som: 'pro_whoosh',
				sons: [{em: b.at('livre'), som: 'pro_swipe', ganho: 0.6}],
			},
			// Fecho: tirar da CLT e virar renda principal
			{
				tipo: 'selo',
				de: b.at('tirar') - 0.1,
				ate: fimFala + 0.25,
				texto: 'RENDA PRINCIPAL',
				chip: 'ADEUS, CLT',
				emChip: b.at('CLT', 2),
				esconderLegenda: true,
				som: 'pro_pop',
			},
			{tipo: 'final', de: fimFala + 0.3, ate: fimFala + 3.0, marca: 'MVM', linha2: 'CREATORS', sub: 'TIKTOK SHOP', tres: true, som: 'pro_logo'},
		];
		return cenas;
	},
};
