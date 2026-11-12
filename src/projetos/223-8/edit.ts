import type {Cena, Edit} from '../../motor/plano';
import type {Trecho} from '../../motor/palavras';
import {punches, semPausas} from '../223/comum';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// 223-8 (tema Entrevista): corte do IMG_0335 (319–366 s da gravação; video.mp4 recortado com scripts/recortar.mjs).
// O empresário (camisa xadrez, à esquerda) pergunta; Danilow (camisa preta, à direita) responde.
// História: gancho "TikTok Shop é difamado como 'ganhar dinheiro com dancinha'" → "a gente vê muita mulher fazendo: como é
// sendo homem?" → "quem faz dancinha? Mulher" → "no top 30 que mais vende é 50/50: 15 homens, 15 mulheres" → "homem vende
// ferramenta, vestuário, live" → "é um mito, tá quebrado" → cartão final.

const TRECHOS: Trecho[] = [
	[16.4, 20.6], // gancho: "Cara, é porque TikTok Shop, ele é meio difamado como 'vou ganhar dinheiro com dancinha', né?"
	[1.5, 4.85], // "Danlow, quando fala de TikTok Shop, a gente vê muita mulher fazendo, né?"
	[5.85, 8.15], // "Como é que é pra você hoje, sendo, sendo homem,"
	[10.1, 11.7], // "como é que cê, cê encara isso?"
	[21.29, 23.07], // "E dancinha, quem faz dancinha? Mulher."
	[25.2, 30.75], // "só que se a gente abrir hoje, a gente consegue ter acesso... uns top trinta que mais vende."
	[31.05, 33.62], // "Se a gente olhar lá, provavelmente é cinquenta, cinquenta."
	[33.72, 34.74], // "Quinze homem, quinze mulher."
	[35.42, 40.15], // "Porque homem vende muitas outras coisas, né? Ferramenta, vestuário, vende muito em live também."
	[42.42, 43.26], // "É um mito isso."
	[44.18, 45.45], // "Tá quebrado. Tá quebrado."
];

export const p2238: Edit = {
	pasta: 'projetos/223-8',
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
		enfase: [{palavra: 'homem', estilo: 'serif'}],
		falantes: (b) => [
			{de: b.at('Danlow') - 0.05, ate: b.say('E dancinha').inicio - 0.05, nome: 'PERGUNTA'},
			{de: b.say('E dancinha').inicio - 0.05, ate: b.at('quebrado', 2) + 0.6, nome: 'DANILOW'},
		],
	},
	camera: (b) => {
		const pergunta = (t: number) => t >= b.at('Danlow') - 0.05 && t < b.say('E dancinha').inicio - 0.05;
		const cheias: Trecho[] = [
			[b.say('E dancinha').inicio - 0.05, b.at('só') - 0.1],
		];
		return [
			...punches(b, cheias, (t) => (pergunta(t) ? {x: 0.36, y: 0.36} : {x: 0.62, y: 0.35})),
			{tipo: 'flash', em: b.at('dancinha') - 0.04},
			{tipo: 'chicote', em: b.at('Danlow') - 0.05},
			{tipo: 'chicote', em: b.say('E dancinha').inicio - 0.05},
			{tipo: 'flash', em: b.at('quebrado') - 0.04},
		];
	},
	cenas: (b) => {
		const fimFala = b.at('quebrado', 2) + 0.6;
		const cenas: Cena[] = [
			// Gancho: difamado como "dinheiro com dancinha"
			{
				tipo: 'medo3d',
				de: 0,
				ate: b.at('Danlow') - 0.05,
				linhas: [
					{texto: 'TIKTOK SHOP', em: b.at('TikTok'), metal: 'branco'},
					{texto: 'DIFAMADO', em: b.at('difamado'), metal: 'cinza'},
					{texto: 'DANCINHA?', em: b.at('dancinha'), metal: 'ouro'},
				],
				som: 'pro_whoosh',
				sons: [{em: b.at('dancinha'), som: 'pro_pop', ganho: 0.6}],
			},
			{
				tipo: 'live',
				de: b.at('mulher') - 0.2,
				ate: b.say('Como é que é').inicio - 0.05,
				host: 'bia.dancinha',
				espectadores: '980',
				coracoes: true,
				som: 'pro_msg',
			},
			{
				tipo: 'textoLife',
				de: b.say('Como é que é').inicio - 0.05,
				ate: b.say('E dancinha').inicio - 0.05,
				kicker: 'E SENDO',
				principal: 'homem?',
				y: 330,
				brilho: true,
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
			},
			{
				tipo: 'frase',
				de: b.say('E dancinha').inicio - 0.05,
				ate: b.at('só') - 0.1,
				palavras: [
					{texto: 'QUEM FAZ', em: b.say('quem faz').inicio},
					{texto: 'dancinha?', em: b.at('dancinha', 3), destaque: true},
				],
				som: 'pro_tick',
			},
			{
				tipo: 'numero3d',
				de: b.at('só') - 0.1,
				ate: b.say('Se a gente olhar').inicio - 0.05,
				texto: 'TOP 30',
				rotulo: 'QUEM MAIS VENDE',
				abaixo: 'NO TIKTOK SHOP',
				em: b.at('trinta'),
				y: 400,
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [{em: b.at('trinta'), som: 'pro_pop', ganho: 0.6}],
			},
			// 50/50: 15 homens, 15 mulheres
			{
				tipo: 'peca',
				nome: 'p223MeioAMeio',
				de: b.say('Se a gente olhar').inicio - 0.05,
				ate: b.say('Porque homem').inicio - 0.05,
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
				dados: {
					itens: [
						{texto: '15 HOMENS', em: b.at('cinquenta')},
						{texto: '15 MULHERES', em: b.at('cinquenta', 2)},
					],
					marcos: [b.say('quinze mulher').inicio],
					texto: '50 / 50',
				},
				sons: [{em: b.say('quinze mulher').inicio, som: 'pro_pop', ganho: 0.6}],
			},
			{
				tipo: 'cards3d',
				de: b.say('Porque homem').inicio - 0.05,
				ate: b.at('mito') - 0.35,
				itens: [
					{texto: 'FERRAMENTA', em: b.at('Ferramenta')},
					{texto: 'VESTUÁRIO', em: b.at('vestuário')},
					{texto: 'LIVE', em: b.at('live')},
				],
				som: 'pro_swipe',
			},
			{
				tipo: 'selo',
				de: b.at('mito') - 0.35,
				ate: fimFala + 0.25,
				texto: 'É UM MITO',
				chip: 'TÁ QUEBRADO',
				emChip: b.at('quebrado'),
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [{em: b.at('quebrado'), som: 'pro_quebra', ganho: 0.5}],
			},
			{tipo: 'final', de: fimFala + 0.3, ate: fimFala + 3.0, marca: 'MÉTODO', linha2: 'M4', tres: true, som: 'pro_logo'},
		];
		return cenas;
	},
};
