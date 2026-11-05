import type {Edit} from '../../motor/plano';
import transcricao from './transcricao.json';
import silencios from './silencios.json';

// Vanessa Aranha, 04/11 AD 02 (Rejuvex). Formato caixinha de pergunta do TikTok (ref. ssstik.io_1793666195524):
// a pergunta-headline fica no topo o vídeo todo. Fotos das dores na hora da fala, card do produto e seta para o
// botão laranja até o fim.
type T = [number, number];
// Junta pausas vizinhas e corta as maiores que 0,28 s, deixando 0,08 s de respiro em cada lado.
const pausas: T[] = [];
for (const [a, b] of silencios as T[]) {
	const u = pausas[pausas.length - 1];
	if (u && a - u[1] < 0.06) u[1] = b;
	else pausas.push([a, b]);
}
const cortesPausa: T[] = pausas.filter(([a, b]) => b - a > 0.28 && a > 0.5).map(([a, b]) => [a + 0.08, b - 0.08]);

export const vanessa0411Ad02: Edit = {
	pasta: 'projetos/vanessa-0411-ad02',
	video: 'video.mp4',
	formato: 'vertical',
	verificarCurva: false,
	regraCamera: false,
	transcricao,
	silencios: silencios as T[],
	barraProgresso: {cor: '#FE5000'},
	cortes: (o) => [[0, Math.max(0, o.at('Mãos') - 0.05)], ...cortesPausa, [o.say('antes que ele acabe').fim + 0.35, 9999]],
	legenda: {
		estilo: 'palavra',
		altura: 0.7,
		enfase: [
			{palavra: 'mexerica', estilo: 'cor', cor: '#FE5000'},
			{palavra: 'profundo', estilo: 'caixa', cor: '#0a0a0a'},
			{palavra: 'flacidez', estilo: 'cor', cor: '#FE5000'},
			{palavra: 'secretos', estilo: 'grande', cor: '#ffd21f'},
			{palavra: 'células', estilo: 'serif'},
			{palavra: 'sustentação', estilo: 'cor', cor: '#FE5000'},
			{palavra: 'erro', estilo: 'caixa', cor: '#0a0a0a'},
			{palavra: 'fórmula', estilo: 'grande', cor: '#ffd21f'},
			{palavra: 'todo,', estilo: 'serif'},
			{palavra: 'confiável.', estilo: 'circulo', cor: '#22c55e'},
			{palavra: 'oferta', estilo: 'grande', cor: '#FE5000'},
		],
	},
	camera: (b) => [
		{tipo: 'foco', em: 0},
		{tipo: 'zoom', em: 0, escala: 1.08, y: 0.35},
		{tipo: 'zoom', em: b.atsW(2), escala: 1.18, y: 0.35},
		{tipo: 'zoom', em: b.at('cabelo'), escala: 1.06, y: 0.35},
		{tipo: 'zoom', em: b.at('colo'), escala: 1.2, y: 0.35},
		{tipo: 'zoom', em: b.at('mexerica'), escala: 1.3, y: 0.35},
		{tipo: 'flash', em: b.at('Bom,')},
		{tipo: 'zoom', em: b.at('Bom,'), escala: 1, y: 0.35},
		{tipo: 'zoom', em: b.at('Isso'), escala: 1.15, y: 0.35},
		{tipo: 'zoom', em: b.at('profundo.'), escala: 1.25, y: 0.35},
		{tipo: 'zoom', em: b.say('E eu nem posso').inicio, escala: 1.05, y: 0.35},
		{tipo: 'zoom', em: b.at('Vivia'), escala: 1.15, y: 0.35},
		{tipo: 'zoom', em: b.at('flacidez'), escala: 1.25, y: 0.35},
		{tipo: 'zoom', em: b.say('parecendo mais velha').inicio, escala: 1.05, y: 0.35},
		{tipo: 'zoom', em: b.say('parecia que nada').inicio, escala: 1.2, y: 0.35},
		{tipo: 'chicote', em: b.say('E foi só depois').inicio},
		{tipo: 'zoom', em: b.say('E foi só depois').inicio, escala: 1, y: 0.35},
		{tipo: 'zoom', em: b.at('secretos'), escala: 1.2, y: 0.35},
		{tipo: 'zoom', em: b.say('Esses 5 ativos').inicio, escala: 1.05, y: 0.35},
		{tipo: 'zoom', em: b.at('maioria'), escala: 1.15, y: 0.35},
		{tipo: 'zoom', em: b.at('células.'), escala: 1.28, y: 0.35},
		{tipo: 'zoom', em: b.say('Com o passar').inicio, escala: 1.05, y: 0.35},
		{tipo: 'zoom', em: b.say('o ácido hialurônico vai').inicio, escala: 1.15, y: 0.35},
		{tipo: 'zoom', em: b.at('rugas,'), escala: 1.25, y: 0.35},
		{tipo: 'flash', em: b.say('Só que o problema').inicio},
		{tipo: 'zoom', em: b.say('Só que o problema').inicio, escala: 1, y: 0.35},
		{tipo: 'zoom', em: b.at('erro'), escala: 1.2, y: 0.35},
		{tipo: 'zoom', em: b.at('200'), escala: 1.3, y: 0.35},
		{tipo: 'zoom', em: b.say('e ainda tomar').inicio, escala: 1.08, y: 0.35},
		{tipo: 'zoom', em: b.say('Foi só depois de uns').inicio, escala: 1, y: 0.35},
		{tipo: 'zoom', em: b.at('nutricionista,'), escala: 1.18, y: 0.35},
		{tipo: 'zoom', em: b.say('Porque ele já').inicio, escala: 1.05, y: 0.35},
		{tipo: 'zoom', em: b.say('O colágeno e o').inicio, escala: 1.15, y: 0.35},
		{tipo: 'zoom', em: b.say('O resveratrol e').inicio, escala: 1.05, y: 0.35},
		{tipo: 'zoom', em: b.say('E a biotina').inicio, escala: 1.2, y: 0.35},
		{tipo: 'zoom', em: b.say('E o melhor').inicio, escala: 1, y: 0.35},
		{tipo: 'zoom', em: b.at('rosto.'), escala: 1.2, y: 0.35},
		{tipo: 'zoom', em: b.say('E ele é um').inicio, escala: 1.05, y: 0.35},
		{tipo: 'zoom', em: b.say('E aqui na').inicio, escala: 1.15, y: 0.35},
		{tipo: 'chicote', em: b.say('Caso você queira').inicio},
		{tipo: 'zoom', em: b.say('Caso você queira').inicio, escala: 1, y: 0.35},
		{tipo: 'zoom', em: b.at('oferta'), escala: 1.22, y: 0.35},
		{tipo: 'zoom', em: b.say('Se tiver aparecendo').inicio, escala: 1.05, y: 0.35},
		{tipo: 'zoom', em: b.say('É só clicar').inicio, escala: 1.18, y: 0.35},
	],
	cenas: (b) => {
		const fim = b.palavras[b.palavras.length - 1].fim + 0.3;
		return [
			// Headline em caixinha de resposta a comentário, no topo o vídeo todo (como na ref.).
			{
				tipo: 'peca',
				nome: 'caixinhaAd02',
				de: 0,
				ate: fim,
				som: null,
				dados: {pergunta: 'Por que minha pele tá ficando flácida?', autor: 'Camila'},
			},
			// Dores do gancho: uma foto por "assim".
			{tipo: 'foto', src: 'maos.jpg', de: b.at('Mãos'), ate: b.atsW(2), tamanho: 0.5},
			{tipo: 'foto', src: 'braco.jpg', de: b.atsW(2), ate: b.at('cabelo'), tamanho: 0.55},
			{tipo: 'foto', src: 'cabelo.jpg', de: b.at('cabelo'), ate: b.at('colo'), tamanho: 0.5},
			{tipo: 'foto', src: 'pescoco.jpg', de: b.at('colo'), ate: b.at('mexerica') - 0.4, tamanho: 0.7},
			{tipo: 'foto', src: 'mexerica.jpg', de: b.at('mexerica') - 0.4, ate: b.at('Bom,'), tamanho: 0.75},
			// Produto (sem foto do produto: card).
			{
				tipo: 'peca',
				nome: 'produtoAd02',
				de: b.at('Ultra.'),
				ate: b.say('em uma fórmula só').fim + 0.2,
				esconderLegenda: true,
				dados: {nome: 'Rejuvex Ultra', sub: '5 ativos em 1 fórmula', itens: ['Colágeno', 'Ác. hialurônico', 'Resveratrol', 'Retinol', 'Biotina']},
			},
			{
				tipo: 'peca',
				nome: 'produtoAd02',
				de: b.say('E ele é um').inicio,
				ate: b.say('de quem já comprou').fim + 0.2,
				esconderLegenda: true,
				dados: {nome: 'Rejuvex Ultra', sub: 'Life In • suplemento alimentar', itens: ['Marca confiável', 'Vários depoimentos']},
			},
			// Seta para o botão laranja até o fim.
			{tipo: 'peca', nome: 'setaAd02', de: b.say('Caso você queira').inicio, ate: fim, dados: {texto: 'EM OFERTA'}},
			// Os 5 ativos entrando um por um, na hora da fala.
			{
				tipo: 'checklist',
				titulo: '5 ativos secretos',
				de: b.atsW(117),
				ate: b.atsW(127) + 1.2,
				itens: [
					{texto: 'Colágeno hidrolisado', em: b.atsW(120)},
					{texto: 'Ácido hialurônico', em: b.atsW(123)},
					{texto: 'Resveratrol', em: b.atsW(124)},
					{texto: 'Biotina', em: b.atsW(125)},
					{texto: 'Retinol', em: b.atsW(127)},
				],
			},
			// Sinais que aparecem.
			{
				tipo: 'alertas',
				variante: 'escura',
				de: b.atsW(177),
				ate: b.atsW(182) + 1,
				itens: [
					{texto: 'rugas', em: b.atsW(177)},
					{texto: 'bigode chinês', em: b.atsW(179)},
					{texto: 'flacidez', em: b.atsW(182), icone: 'x'},
				],
			},
			// O erro caro.
			{tipo: 'kicker', pequeno: 'gastando mais de', grande: 'R$200/mês', emGrande: b.atsW(211), de: b.atsW(208), ate: b.atsW(219) + 0.8},
			// Ativos da fórmula, na explicação.
			{
				tipo: 'checklist',
				titulo: 'tudo em 1 fórmula',
				de: b.atsW(264),
				ate: b.atsW(292) + 1.5,
				itens: [
					{texto: 'Colágeno + ácido hialurônico: firmeza e hidratação', em: b.atsW(264)},
					{texto: 'Resveratrol + retinol: antioxidantes', em: b.atsW(279)},
					{texto: 'Biotina: cabelo e unhas', em: b.atsW(292)},
				],
			},
		];
	},
};
