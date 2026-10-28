import type {Edit} from '../../motor/plano';
import type {Trecho} from '../../motor/palavras';
import transcricao from './transcricao.json';
import silencios from './silencios.json';

// Mídias unidas em video.mp4 na ordem: IMG_5317 (0–140 s), IMG_5319 (140–150 s), IMG_5320 (150–167 s).
export const segundoo: Edit = {
	pasta: 'projetos/segundoo',
	video: 'video.mp4',
	formato: 'vertical',
	verificarCurva: false,
	regraCamera: false,
	legenda: {estilo: 'mare', enfase: []},
	silencios: silencios as Trecho[],
	transcricao,
	trechos: (o) => [
		[o.say('duas horas por dia').inicio - 0.1, o.say('no seu bolso').fim + 0.1],
		[o.say('Danilo, qual você considera').inicio - 0.1, o.say('no TikTok Shop?', 1).fim + 0.1],
		[o.say('Tudo que você precisa').inicio - 0.1, o.say('internet').fim + 0.1],
		[o.say('Zero barreira de entrada').inicio - 0.1, o.say('Zero barreira de entrada').fim + 0.1],
		[o.say('Você não precisa aparecer').inicio - 0.1, o.say('ter estoque').fim + 0.1],
		[o.say('quais são os pontos negativos de fazer live shopping no TikTok Shop', 2).inicio - 0.1, o.say('quais são os pontos negativos de fazer live shopping no TikTok Shop', 2).fim + 0.1],
		[o.say('Um ponto negativo').inicio - 0.1, o.say('dinheiro emprestado').fim + 0.1],
		[o.say('Agora você, Pirreto').inicio - 0.1, o.say('trabalhar com IA no TikTok Shop', 1).fim + 0.1],
		[o.say('Você vai querer ficar só viajando').inicio - 0.1, o.say('liberdade financeira').fim + 0.1],
		[o.say('Eu tenho uma funcionária').inicio - 0.1, o.say('não reclama').fim + 0.1],
		[o.say('Siga o Danilo').inicio - 0.1, o.say('aprender com IA').fim + 0.1],
		[o.say('quer saber como funciona todo o ecossistema').inicio - 0.3, o.say('quer saber como funciona todo o ecossistema').fim + 0.1],
		[o.say('ganhar dinheiro sem aparecer').inicio - 0.1, o.say('segue o MVM Creators').fim + 0.2],
	],
	camera: (b) => [
		{tipo: 'zoom', em: b.at('duas'), escala: 1.2},
		{tipo: 'foco', em: b.at('Danilo,')},
		{tipo: 'zoom', em: b.at('celular'), escala: 1.25},
	],
	// Bloco 1 (~10 s): gancho do número, pergunta e início da resposta do Danilo.
	cenas: (b) => [
		{tipo: 'numero3d', texto: 'R$ 10 MIL', abaixo: '2 HORAS POR DIA', de: b.at('duas'), ate: b.say('no seu bolso').fim + 0.3},
		{
			tipo: 'chips',
			itens: [
				{texto: 'UM CELULAR', em: b.at('celular')},
				{texto: 'INTERNET', em: b.at('internet')},
			],
			de: b.at('celular'),
			ate: b.say('internet').fim + 0.8,
		},
	],
};
