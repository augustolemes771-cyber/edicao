import type {Cena, Edit} from '../../motor/plano';
import type {Trecho} from '../../motor/palavras';
import {punches, semPausas} from '../223/comum';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// 223-17 (tema Entrevista): corte do IMG_0335 (214–268 s da gravação; video.mp4 recortado com scripts/recortar.mjs).
// O empresário, especialista em vendas (camisa xadrez, à esquerda), e o Danilow (camisa preta, à direita).
// História: gancho "se a pessoa gostou de você e do produto, ela vai comprar" → vestuário: mostrar que é confortável, não
// amarrota, não dá bolinha → "venda é conexão" → "sem conexão, sem feeling, ela não compra" → "venda é emocional" → "às vezes
// nem falar do produto: criar identificação, ser você mesmo" → cartão final.

const TRECHOS: Trecho[] = [
	[41.75, 44.9], // gancho: "Mas hoje, se a pessoa gostou de você, gostou do produto, ela vai comprar."
	[4.08, 5.46], // "Tipo, por exemplo, vestuário."
	[5.88, 7.92], // "Não tem muita coisa pra falar da roupa."
	[8.0, 16.8], // "É mais mostrar ali que ela fica confortável no corpo... malha que não amarrota... não dá bolinha, uma malha de qualidade."
	[17.52, 19.9], // "Eu costumo dizer que venda ela é muito conexão, né?"
	[23.4, 28.95], // "se a pessoa não ter essa conexão com o produto, não ter esse feeling, ela não compra."
	[29.35, 31.6], // "Então assim, a venda, ela é muito emocional."
	[46.26, 49.9], // "Às vezes nem você falar sobre o produto, é só você criar identificação com a pessoa."
	[50.82, 52.81], // "É só você ser você mesmo, ter a sua personalidade no vídeo."
];

export const p22317: Edit = {
	pasta: 'projetos/223-17',
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
		enfase: [{palavra: 'feeling', estilo: 'serif'}],
		falantes: (b) => [
			{de: b.at('Tipo') - 0.05, ate: b.at('costumo') - 0.1, nome: 'DANILOW'},
			{de: b.at('costumo') - 0.1, ate: b.at('Às') - 0.05, nome: 'EMPRESÁRIO'},
			{de: b.at('Às') - 0.05, ate: b.at('personalidade') + 0.9, nome: 'DANILOW'},
		],
	},
	camera: (b) => {
		const empresario = (t: number) => t < b.at('Tipo') - 0.05 || (t >= b.at('costumo') - 0.1 && t < b.at('Às') - 0.05);
		const cheias: Trecho[] = [[b.at('Então') - 0.05, b.at('Às') - 0.05]];
		return [
			...punches(b, cheias, (t) => (empresario(t) ? {x: 0.36, y: 0.36} : {x: 0.62, y: 0.35})),
			{tipo: 'flash', em: b.at('comprar') - 0.04},
			{tipo: 'chicote', em: b.at('Tipo') - 0.05},
			{tipo: 'chicote', em: b.at('costumo') - 0.1},
			{tipo: 'chicote', em: b.at('Às') - 0.05},
			{tipo: 'flash', em: b.at('mesmo') - 0.04},
		];
	},
	cenas: (b) => {
		const fimFala = b.at('personalidade') + 0.75;
		const cenas: Cena[] = [
			{
				tipo: 'chips',
				de: 0,
				ate: b.at('Tipo') - 0.05,
				itens: [
					{texto: 'GOSTOU DE VOCÊ', em: b.at('gostou')},
					{texto: 'GOSTOU DO PRODUTO', em: b.at('gostou', 2)},
					{texto: 'VAI COMPRAR', em: b.at('comprar')},
				],
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
				sons: [{em: b.at('comprar'), som: 'pro_pop', ganho: 0.6}],
			},
			{
				tipo: 'selo',
				de: b.at('Tipo') - 0.05,
				ate: b.at('mostrar') - 0.3,
				texto: 'VESTUÁRIO',
				chip: 'POUCO PRA FALAR',
				emChip: b.at('roupa'),
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			{
				tipo: 'cards3d',
				de: b.at('mostrar') - 0.3,
				ate: b.at('costumo') - 0.1,
				itens: [
					{texto: 'CONFORTÁVEL', em: b.at('confortável')},
					{texto: 'NÃO AMARROTA', em: b.at('amarrota')},
					{texto: 'NÃO DÁ BOLINHA', em: b.at('bolinha')},
					{texto: 'QUALIDADE', em: b.at('qualidade')},
				],
				som: 'pro_swipe',
			},
			{
				tipo: 'textoLife',
				de: b.at('costumo') - 0.1,
				ate: b.at('pessoa', 2) - 0.4,
				kicker: 'VENDA É',
				principal: 'conexão',
				y: 330,
				brilho: true,
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
			},
			{
				tipo: 'alertas',
				de: b.at('pessoa', 2) - 0.4,
				ate: b.at('Então') - 0.05,
				itens: [
					{texto: 'SEM CONEXÃO', em: b.at('conexão', 2), icone: 'x'},
					{texto: 'SEM FEELING', em: b.at('feeling'), icone: 'x'},
					{texto: 'NÃO COMPRA', em: b.at('compra')},
				],
				variante: 'escura',
				esconderLegenda: true,
				som: 'pro_tick',
			},
			{
				tipo: 'frase',
				de: b.at('Então') - 0.05,
				ate: b.at('Às') - 0.05,
				palavras: [
					{texto: 'A VENDA É', em: b.at('venda', 2)},
					{texto: 'emocional.', em: b.at('emocional'), destaque: true},
				],
				som: 'pro_tick',
			},
			{
				tipo: 'pilula',
				de: b.at('Às') - 0.05,
				ate: b.at('ser') - 0.3,
				rotulo: 'O SEGREDO',
				nome: 'identificação',
				esconderLegenda: true,
				som: 'pro_tick',
			},
			{
				tipo: 'motion3d',
				modelo: 'positivoLive',
				de: b.at('ser') - 0.3,
				ate: fimFala + 0.25,
				linhas: [
					{texto: 'SEJA VOCÊ', em: b.at('ser'), metal: 'branco'},
					{texto: 'MESMO', em: b.at('mesmo'), metal: 'ouro'},
				],
				som: 'pro_whoosh',
			},
			{tipo: 'final', de: fimFala + 0.3, ate: fimFala + 3.0, marca: 'MÉTODO', linha2: 'M4', tres: true, som: 'pro_logo'},
		];
		return cenas;
	},
};
