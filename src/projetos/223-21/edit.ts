import type {Cena, Edit} from '../../motor/plano';
import type {Trecho} from '../../motor/palavras';
import {punches, semPausas} from '../223/comum';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// 223-21 (tema Entrevista): corte do IMG_0355 (97–135 s da gravação; video.mp4 recortado com scripts/recortar.mjs).
// Danilow (camisa preta, à esquerda) e a empresária de Caldas Novas (colete branco, à direita).
// Transcrição corrigida: "adestraram" → "adaptaram".
// História: gancho "eu vejo lives em fábrica, vendendo dentro da fábrica" → "no Brasil já existe esse modelo?" → "tem, no Brás"
// → "os fabricantes vendem dentro do galpão" → "no Brás e agora em Goiânia, na 44" → "os shoppings adaptaram: metade físico,
// metade live, com as baias" → cartão final.

const TRECHOS: Trecho[] = [
	[12.45, 15.6], // gancho: "Eu vejo umas lives em fábrica, a pessoa vendendo dentro da fábrica."
	[2.6, 7.05], // "No Brasil, tem alguma já que funciona desse, nesse modelo de negócio ou vocês se baseiam em outros países?"
	[7.2, 9.65], // "Não, tem sim, tem. Tem? No Brás tem."
	[15.74, 19.14], // "Os próprios fabricantes ali, né. A galera, ela vende dentro de galpão."
	[19.66, 22.16], // "Isso aí a gente vê muito na, no Brás."
	[22.7, 28.0], // "E também começou agora lá em Goiânia, lá na quarenta e quatro também. Os shoppings adaptaram, né?" (contínuos)
	[28.35, 36.6], // "Compraram essa visão de live shopping, só que é metade shopping físico e metade shopping de live mesmo, onde tem as baias."
];

export const p22321: Edit = {
	pasta: 'projetos/223-21',
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
		enfase: [{palavra: 'galpão', estilo: 'serif'}],
		falantes: (b) => [
			{de: b.say('No Brasil').inicio - 0.05, ate: b.at('sim') - 0.4, nome: 'PERGUNTA'},
			{de: b.at('sim') - 0.4, ate: b.at('baias') + 0.6, nome: 'EMPRESÁRIA'},
		],
	},
	camera: (b) => {
		const danilow = (t: number) => t < b.at('sim') - 0.4;
		const cheias: Trecho[] = [[b.at('metade') - 0.3, b.at('baias') + 1]];
		return [
			...punches(b, cheias, (t) => (danilow(t) ? {x: 0.32, y: 0.32} : {x: 0.66, y: 0.33})),
			{tipo: 'flash', em: b.at('fábrica') - 0.04},
			{tipo: 'chicote', em: b.at('sim') - 0.4},
			{tipo: 'flash', em: b.at('Goiânia') - 0.04},
		];
	},
	cenas: (b) => {
		const fimFala = b.at('baias') + 0.6;
		const cenas: Cena[] = [
			{
				tipo: 'live',
				de: 0,
				ate: b.say('No Brasil').inicio - 0.05,
				host: 'fabrica.oficial',
				espectadores: '4,7 mil',
				coracoes: true,
				comentarios: [
					{nome: 'loja.da.ju', texto: 'preço de fábrica?'},
					{nome: 'rafa_store', texto: 'quero 10!'},
				],
				som: 'pro_msg',
			},
			{
				tipo: 'textoLife',
				de: b.say('No Brasil').inicio - 0.05,
				ate: b.at('sim') - 0.4,
				kicker: 'NO BRASIL',
				principal: 'já existe esse modelo?',
				y: 330,
				brilho: true,
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
			},
			{tipo: 'pilula', de: b.at('sim') - 0.4, ate: b.at('próprios') - 0.4, rotulo: 'JÁ EXISTE', nome: 'no Brás', esconderLegenda: true, som: 'pro_tick'},
			{
				tipo: 'chips',
				de: b.at('próprios') - 0.4,
				ate: b.at('Isso') - 0.05,
				itens: [
					{texto: 'OS FABRICANTES', em: b.at('fabricantes')},
					{texto: 'DENTRO DO GALPÃO', em: b.at('galpão')},
				],
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
			},
			{
				tipo: 'cards3d',
				de: b.at('Isso') - 0.05,
				ate: b.at('shoppings') - 0.3,
				itens: [
					{texto: 'BRÁS · SÃO PAULO', em: b.at('Brás', 2)},
					{texto: 'GOIÂNIA · 44', em: b.at('Goiânia')},
				],
				som: 'pro_swipe',
			},
			{
				tipo: 'selo',
				de: b.at('shoppings') - 0.3,
				ate: b.at('metade') - 0.3,
				texto: 'OS SHOPPINGS ADAPTARAM',
				chip: 'LIVE SHOPPING',
				emChip: b.say('de live shopping').inicio + 0.2,
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			{
				tipo: 'gradeAntesDepois',
				de: b.at('metade') - 0.3,
				ate: fimFala + 0.25,
				titulo: [{texto: 'O SHOPPING', em: b.at('shoppings')}],
				antes: {texto: 'METADE', em: b.at('físico'), valor: 'FÍSICO'},
				depois: {texto: 'METADE', em: b.say('shopping de live').inicio + 0.3, valor: 'LIVE'},
				som: 'pro_whoosh',
			},
			{tipo: 'final', de: fimFala + 0.3, ate: fimFala + 3.0, marca: 'MÉTODO', linha2: 'M4', tres: true, som: 'pro_logo'},
		];
		return cenas;
	},
};
