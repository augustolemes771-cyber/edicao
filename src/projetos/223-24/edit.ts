import type {Cena, Edit} from '../../motor/plano';
import type {Trecho} from '../../motor/palavras';
import {punches, semPausas} from '../223/comum';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// 223-24 (tema Entrevista): corte do IMG_0364 (224–291 s). Nara (direita) e Danilow (esquerda).
// História: gancho "restrição = dor de cabeça gigante" → banimento → 6 creators viraram 3 → quando cai, cai a venda →
// "ele faz o que eu não sei" → suporte se tomar restrição? → "já tem outra conta preparada" → "top creator, não posso perder".

const TRECHOS: Trecho[] = [
	[41.34, 45.58], // "Quando esse cara ele toma uma restrição, pra mim, é uma dor de cabeça gigante."
	[17.86, 20.6], // "Mas eu tô tendo muito trabalho com banimento."
	[27.5, 29.3], // "antes eu tinha ali seis creators."
	[29.58, 33.02], // "Hoje eu vou, consigo trabalhar só com três, porque três eu consigo controlar."
	[36.05, 40.85], // "Então assim, quando cai, porque cai a nossa saída de produto, cai a nossa venda."
	[46.5, 48.5], // "Ele é muito bom, ele faz o que eu não sei fazer."
	[49.0, 52.92], // Danilow: "Porque cê promete esse suporte também, de se ele tomar restrição." "Com certeza."
	[53.26, 57.38], // "Então se a conta dele cair, a gente já tem outra conta pra ele preparado, entende?"
	[58.36, 62.42], // "Porque assim, o cara ele é top, top creator Brasil, então eu não posso perder."
];

export const p22324: Edit = {
	pasta: 'projetos/223-24',
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
		enfase: [{palavra: 'controlar', estilo: 'serif'}],
		falantes: (b) => [{de: b.say('promete').inicio - 0.3, ate: b.at('certeza') + 0.5, nome: 'PERGUNTA'}],
	},
	camera: (b) => {
		const danilow = (t: number) => t >= b.say('promete').inicio - 0.3 && t < b.at('certeza') + 0.5;
		const cheias: Trecho[] = [[b.at('antes') - 0.3, b.at('Então') - 0.05]];
		return [
			...punches(b, cheias, (t) => (danilow(t) ? {x: 0.32, y: 0.34} : {x: 0.68, y: 0.36})),
			{tipo: 'flash', em: b.at('gigante') - 0.04},
			{tipo: 'chicote', em: b.say('promete').inicio - 0.3},
			{tipo: 'flash', em: b.at('perder') - 0.04},
		];
	},
	cenas: (b) => {
		const fimFala = b.at('perder') + 0.6;
		const cenas: Cena[] = [
			{
				tipo: 'medo3d',
				de: 0,
				ate: b.at('banimento') - 1.2,
				linhas: [
					{texto: 'RESTRIÇÃO', em: b.at('restrição'), metal: 'sangue'},
					{texto: 'DOR DE CABEÇA', em: b.at('dor'), metal: 'cinza', largura: 4.4},
				],
				pessoa: true,
				som: 'pro_whoosh',
			},
			{
				tipo: 'alertas',
				de: b.at('banimento') - 1.2,
				ate: b.at('antes') - 0.3,
				itens: [{texto: 'BANIMENTO', em: b.at('banimento'), icone: 'alerta'}],
				variante: 'vermelha',
				esconderLegenda: true,
				som: 'pro_tick',
			},
			{
				tipo: 'gradeAntesDepois',
				de: b.at('antes') - 0.3,
				ate: b.at('Então') - 0.05,
				titulo: [{texto: 'CREATORS', em: b.at('creators')}],
				antes: {texto: 'ANTES', em: b.at('seis'), valor: '6'},
				depois: {texto: 'HOJE', em: b.at('três'), valor: '3'},
				som: 'pro_whoosh',
			},
			{
				tipo: 'alertas',
				de: b.at('Então') - 0.05,
				ate: b.say('Ele é muito bom').inicio - 0.05,
				itens: [
					{texto: 'CAI A SAÍDA DE PRODUTO', em: b.at('saída'), icone: 'x'},
					{texto: 'CAI A VENDA', em: b.at('venda'), icone: 'x'},
				],
				variante: 'escura',
				esconderLegenda: true,
				som: 'pro_tick',
			},
			{tipo: 'pilula', de: b.say('Ele é muito bom').inicio - 0.05, ate: b.say('promete').inicio - 0.3, rotulo: 'O CREATOR', nome: 'faz o que eu não sei', esconderLegenda: true, som: 'pro_tick'},
			{
				tipo: 'textoLife',
				de: b.say('promete').inicio - 0.3,
				ate: b.at('conta') - 0.5,
				kicker: 'E SE TOMAR RESTRIÇÃO?',
				principal: 'tem suporte',
				y: 330,
				brilho: true,
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
			},
			{
				tipo: 'selo',
				de: b.at('conta') - 0.5,
				ate: b.at('top') - 0.6,
				texto: 'OUTRA CONTA PRONTA',
				chip: 'SE A CONTA CAIR',
				emChip: b.at('cair'),
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			{
				tipo: 'frase',
				de: b.at('top') - 0.6,
				ate: fimFala + 0.25,
				palavras: [
					{texto: 'TOP CREATOR,', em: b.at('top')},
					{texto: 'não posso perder', em: b.at('posso'), destaque: true},
				],
				som: 'pro_tick',
			},
			{tipo: 'final', de: fimFala + 0.3, ate: fimFala + 3.0, marca: 'MÉTODO', linha2: 'M4', tres: true, som: 'pro_logo'},
		];
		return cenas;
	},
};
