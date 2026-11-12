import type {Cena, Edit} from '../../motor/plano';
import type {Trecho} from '../../motor/palavras';
import {punches, semPausas} from '../223/comum';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// 223-22 (tema Entrevista): corte do IMG_0355 (171–273 s da gravação; video.mp4 recortado com scripts/recortar.mjs).
// Danilow (camisa preta, à esquerda) e a empresária de Caldas Novas (colete branco, à direita).
// História: gancho "esse primeiro evento foi um quebra-gelo" → "já tem data, um plano?" → "segunda fase: o segundo evento, mais
// mídia, mais parcerias" → "creators qualificados no palco ensinando" → "o segundo vai ser pra 400 pessoas" → "depois o terceiro,
// pra educar o público" → "a próxima eu quero estar" / "vou te convidar" → cartão final.

const TRECHOS: Trecho[] = [
	[58.1, 60.15], // gancho: "Esse primeiro evento foi um quebra-gelo."
	[51.62, 55.2], // Danilow: "E já tem data, tem um plano, uma data pra poder executar isso?"
	[56.3, 58.06], // "Agora a gente vai pra segunda fase."
	[60.62, 67.1], // "A segunda fase é o segundo evento, aonde a gente vai aplicar em mais mídia, fechar mais parcerias"
	[76.6, 85.2], // "mais pessoas qualificadas, principalmente creators... pra tá à frente ali do palco, pra tá instruindo e ensinando essas pessoas."
	[85.5, 91.66], // "Então, esse foi o primeiro da esteira, aí vai vim o segundo, que vai ser mais ou menos pra quatrocentas pessoas."
	[92.26, 95.77], // "Consequentemente, vai ter o terceiro, porque a gente precisa educar esse público."
	[95.78, 99.22], // Danilow: "A próxima eu quero estar, hein?" Empresária: "Vou te convidar, pode ter certeza."
];

export const p22322: Edit = {
	pasta: 'projetos/223-22',
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
		enfase: [{palavra: 'educar', estilo: 'serif'}],
		falantes: (b) => [
			{de: b.at('data') - 0.6, ate: b.at('Agora') - 0.05, nome: 'PERGUNTA'},
			{de: b.at('Agora') - 0.05, ate: b.at('próxima') - 0.3, nome: 'EMPRESÁRIA'},
		],
	},
	camera: (b) => {
		const danilow = (t: number) => (t >= b.at('data') - 0.6 && t < b.at('Agora') - 0.05) || (t >= b.at('próxima') - 0.3 && t < b.at('convidar') - 0.3);
		return [
			...punches(b, [], (t) => (danilow(t) ? {x: 0.32, y: 0.32} : {x: 0.66, y: 0.33})),
			{tipo: 'flash', em: b.at('primeiro') - 0.04},
			{tipo: 'chicote', em: b.at('data') - 0.6},
			{tipo: 'chicote', em: b.at('Agora') - 0.05},
			{tipo: 'flash', em: b.at('quatrocentas') - 0.04},
		];
	},
	cenas: (b) => {
		const fimFala = b.at('certeza') + 0.5;
		const cenas: Cena[] = [
			{
				tipo: 'medo3d',
				de: 0,
				ate: b.at('data') - 0.6,
				linhas: [
					{texto: 'O 1º EVENTO', em: b.at('primeiro'), metal: 'branco'},
					{texto: 'QUEBRA-GELO', em: b.at('foi') + 0.1, metal: 'ouro'},
				],
				som: 'pro_whoosh',
			},
			{
				tipo: 'textoLife',
				de: b.at('data') - 0.6,
				ate: b.at('Agora') - 0.05,
				kicker: 'E AGORA?',
				principal: 'tem data, tem plano?',
				y: 330,
				brilho: true,
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
			},
			{
				tipo: 'selo',
				de: b.at('Agora') - 0.05,
				ate: b.at('aplicar') - 0.4,
				texto: 'SEGUNDA FASE',
				chip: 'O SEGUNDO EVENTO',
				emChip: b.at('evento', 2),
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			{
				tipo: 'chips',
				de: b.at('aplicar') - 0.4,
				ate: b.at('qualificadas') - 0.8,
				itens: [
					{texto: 'MAIS MÍDIA', em: b.at('mídia')},
					{texto: 'MAIS PARCERIAS', em: b.at('parcerias')},
				],
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
			},
			{
				tipo: 'cards3d',
				de: b.at('qualificadas') - 0.8,
				ate: b.at('esteira') - 1.2,
				itens: [
					{texto: 'GENTE QUALIFICADA', em: b.at('qualificadas')},
					{texto: 'CREATORS NO PALCO', em: b.at('palco')},
					{texto: 'ENSINANDO', em: b.at('ensinando')},
				],
				som: 'pro_swipe',
			},
			{
				tipo: 'numero3d',
				de: b.at('esteira') - 1.2,
				ate: b.at('Consequentemente') - 0.05,
				texto: '400',
				rotulo: 'O PRÓXIMO EVENTO',
				abaixo: 'PESSOAS',
				em: b.at('quatrocentas'),
				y: 400,
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [{em: b.at('quatrocentas'), som: 'pro_pop', ganho: 0.7}],
			},
			{
				tipo: 'textoLife',
				de: b.at('Consequentemente') - 0.05,
				ate: b.at('próxima') - 0.3,
				kicker: 'DEPOIS O TERCEIRO',
				principal: 'educar o público',
				y: 330,
				brilho: true,
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
			},
			{
				tipo: 'selo',
				de: b.at('próxima') - 0.3,
				ate: fimFala + 0.25,
				texto: 'VOU TE CONVIDAR',
				chip: 'PODE TER CERTEZA',
				emChip: b.at('certeza'),
				esconderLegenda: true,
				som: 'pro_pop',
			},
			{tipo: 'final', de: fimFala + 0.3, ate: fimFala + 3.0, marca: 'MÉTODO', linha2: 'M4', tres: true, som: 'pro_logo'},
		];
		return cenas;
	},
};
