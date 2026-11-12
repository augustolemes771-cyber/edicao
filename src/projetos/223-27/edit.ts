import type {Cena, Edit} from '../../motor/plano';
import type {Trecho} from '../../motor/palavras';
import {punches, semPausas} from '../223/comum';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// 223-27 (tema Entrevista): corte do IMG_0364 (393–438 s). Danilow (esquerda) e Nara (direita).
// História: gancho "era uma dor, mas virou uma habilidade" → "seu ticket é R$ 200?" → "o mais caro é R$ 280: um kit de creatina,
// limpeza de pele e colágeno" → "fora isso, tickets menores: TV, computador, gerador" → "todo dia a gente acerta um produto".

const TRECHOS: Trecho[] = [
	[36.05, 39.12], // "acaba que é uma dor, mas acabou que virou uma habilidade."
	[0.2, 2.2], // Danilow: "Seu ticket é duzentos reais no TikTok?"
	[2.3, 3.9], // "O mais caro é duzentos e oitenta."
	[8.5, 16.55], // "Ele é um kit de creatina, é, limpeza de pele e fortalecimento, é, colágeno."
	[17.4, 19.07], // "Ele é o mais caro que a gente tem."
	[19.55, 21.7], // "Fora isso, a gente trabalha com tickets menores."
	[21.7, 25.25], // "A gente vende TV, computador, nós vendemos gerador."
	[39.3, 43.3], // "É, todo dia ter que acertar um produto. Todo dia a gente acerta um produto."
];

export const p22327: Edit = {
	pasta: 'projetos/223-27',
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
		enfase: [{palavra: 'habilidade', estilo: 'serif'}],
		falantes: (b) => [
			{de: b.at('ticket') - 0.3, ate: b.at('caro') - 0.4, nome: 'PERGUNTA'},
			{de: b.at('caro') - 0.4, ate: b.at('produto', 2) + 0.6, nome: 'NARA'},
		],
	},
	camera: (b) => {
		const danilow = (t: number) => t >= b.at('ticket') - 0.3 && t < b.at('caro') - 0.4;
		return [
			...punches(b, [], (t) => (danilow(t) ? {x: 0.32, y: 0.34} : {x: 0.68, y: 0.36})),
			{tipo: 'flash', em: b.at('habilidade') - 0.04},
			{tipo: 'chicote', em: b.at('ticket') - 0.3},
			{tipo: 'chicote', em: b.at('caro') - 0.4},
			{tipo: 'flash', em: b.at('acerta') - 0.04},
		];
	},
	cenas: (b) => {
		const fimFala = b.at('produto', 2) + 0.55;
		const cenas: Cena[] = [
			{
				tipo: 'medo3d',
				de: 0,
				ate: b.at('ticket') - 0.3,
				linhas: [
					{texto: 'ERA UMA DOR', em: b.at('dor'), metal: 'cinza'},
					{texto: 'VIROU HABILIDADE', em: b.at('virou'), metal: 'ouro', largura: 4.4},
				],
				som: 'pro_whoosh',
			},
			{
				tipo: 'numero3d',
				de: b.at('ticket') - 0.3,
				ate: b.at('kit') - 0.6,
				texto: 'R$ 280',
				rotulo: 'O MAIS CARO',
				abaixo: 'TICKET NO TIKTOK',
				em: b.at('oitenta'),
				y: 400,
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [{em: b.at('oitenta'), som: 'pro_pop', ganho: 0.7}],
			},
			{
				tipo: 'cards3d',
				de: b.at('kit') - 0.6,
				ate: b.at('Fora') - 0.05,
				itens: [
					{texto: 'CREATINA', em: b.at('creatina')},
					{texto: 'LIMPEZA DE PELE', em: b.at('limpeza')},
					{texto: 'COLÁGENO', em: b.at('colágeno')},
				],
				som: 'pro_swipe',
			},
			{
				tipo: 'chips',
				de: b.at('Fora') - 0.05,
				ate: b.say('todo dia').inicio - 0.3,
				itens: [
					{texto: 'TV', em: b.at('TV')},
					{texto: 'COMPUTADOR', em: b.at('computador')},
					{texto: 'GERADOR', em: b.at('gerador')},
				],
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
			},
			{
				tipo: 'frase',
				de: b.say('todo dia').inicio - 0.3,
				ate: fimFala + 0.25,
				palavras: [
					{texto: 'TODO DIA', em: b.say('todo dia').inicio},
					{texto: 'acertar um produto', em: b.at('acertar'), destaque: true},
				],
				som: 'pro_tick',
			},
			{tipo: 'final', de: fimFala + 0.3, ate: fimFala + 3.5, marca: 'MÉTODO', linha2: 'M4', tres: true, som: 'pro_logo'},
		];
		return cenas;
	},
};
