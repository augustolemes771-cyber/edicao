import type {Edit} from '../../motor/plano';
import type {Trecho} from '../../motor/palavras';
import transcricao from './transcricao.json';
import silencios from './silencios.json';

// 04/11 AD 01 — Rejuvex (Vanessa Aranha). Ref: ssstik.io_1793733227341 (tela dividida na abertura, foto em cima).
// Tomada única e limpa: só saem as pausas entre frases (> 0,35 s) e o fim depois da última palavra.
export const vanessa0411Ad01: Edit = {
	pasta: 'projetos/vanessa-0411-ad01',
	video: 'video.mp4',
	formato: 'vertical',
	escalaFinal: 1,
	verificarCurva: false,
	regraCamera: false,
	transcricao,
	silencios: silencios as Trecho[],
	cortes: (o) => {
		const p = o.palavras;
		const c: Trecho[] = (silencios as Trecho[])
			.filter(([i, f]) => f - i > 0.3 && i > 0.2 && f < p[p.length - 1].fim)
			.map(([i, f]) => [i + 0.08, f - 0.08] as Trecho);
		c.push([p[p.length - 1].fim + 0.5, 9999]);
		return c;
	},
	legenda: {
		estilo: 'palavra',
		enfase: [
			{palavra: 'mexerica', estilo: 'cor', cor: '#ff6a00'},
			{palavra: 'profundo', estilo: 'grande', cor: '#ffd21f'},
			{palavra: 'secretos', estilo: 'cor', cor: '#ffd21f'},
			{palavra: 'células', estilo: 'serif'},
			{palavra: 'flacidez', estilo: 'caixa', cor: '#0a0a0a', ocorrencia: 2},
			{palavra: '200', estilo: 'grande', cor: '#ff3b3b'},
			{palavra: 'Ultra', estilo: 'cor', cor: '#ffd21f'},
			{palavra: 'corpo', estilo: 'serif'},
			{palavra: 'oferta', estilo: 'grande', cor: '#ff6a00'},
			{palavra: 'laranja', estilo: 'cor', cor: '#ff6a00'},
		],
	},
	camera: (b) => [
		{tipo: 'foco', em: 0},
		{tipo: 'zoom', em: 0, escala: 1.05, y: 0.4},
		{tipo: 'zoom', em: b.at('Bom'), escala: 1.2, y: 0.4},
		{tipo: 'zoom', em: b.at('Isso'), escala: 1.05, y: 0.4},
		{tipo: 'zoom', em: b.say('Porque eu também').inicio, escala: 1.22, y: 0.4},
		{tipo: 'zoom', em: b.at('Vivia'), escala: 1.08, y: 0.4},
		{tipo: 'zoom', em: b.say('parecendo mais velha').inicio, escala: 1.2, y: 0.4},
		{tipo: 'flash', em: b.say('E foi só depois').inicio},
		{tipo: 'zoom', em: b.say('E foi só depois').inicio, escala: 1.05, y: 0.4},
		{tipo: 'zoom', em: b.at('maioria'), escala: 1.18, y: 0.4},
		{tipo: 'zoom', em: b.say('Com o passar').inicio, escala: 1.05, y: 0.4},
		{tipo: 'zoom', em: b.at('rugas'), escala: 1.22, y: 0.4},
		{tipo: 'zoom', em: b.say('Só que o problema').inicio, escala: 1.05, y: 0.4},
		{tipo: 'zoom', em: b.at('200'), escala: 1.25, y: 0.4},
		{tipo: 'chicote', em: b.say('Foi só depois de uns dias').inicio},
		{tipo: 'zoom', em: b.say('Foi só depois de uns dias').inicio, escala: 1.08, y: 0.4},
		{tipo: 'zoom', em: b.at('colágeno', 3), escala: 1.18, y: 0.4},
		{tipo: 'zoom', em: b.at('resveratrol', 2), escala: 1.05, y: 0.4},
		{tipo: 'zoom', em: b.say('E o melhor').inicio, escala: 1.2, y: 0.4},
		{tipo: 'zoom', em: b.at('suplemento'), escala: 1.05, y: 0.4},
		{tipo: 'zoom', em: b.at('plataforma'), escala: 1.15, y: 0.4},
		{tipo: 'flash', em: b.at('Caso')},
		{tipo: 'zoom', em: b.at('Caso'), escala: 1.08, y: 0.4},
		{tipo: 'zoom', em: b.at('botão'), escala: 1.2, y: 0.4},
	],
	cenas: (b) => {
		const fim = b.palavras[b.palavras.length - 1].fim + 0.45;
		return [
			// Abertura em tela dividida: a foto de cada sinal em cima, ela embaixo.
			{
				tipo: 'peca',
				nome: 'TelaDivididaAd01',
				de: b.at('Cabelo'),
				ate: b.at('Bom') - 0.05,
				dados: {
					itens: [
						{src: 'cabelo.jpg', em: b.at('Cabelo')},
						{src: 'maos.jpg', em: b.at('mãos')},
						{src: 'braco.jpg', em: b.at('tchauzinho')},
						{src: 'pescoco.jpg', em: b.at('colo')},
						{src: 'rugas.jpg', em: b.at('pele')},
					],
				},
			},
			// "É aí que aparecem as rugas, o bigode chinês": a foto do bigode chinês.
			{tipo: 'peca', nome: 'TelaDivididaAd01', de: b.at('rugas'), ate: b.say('Só que o problema').inicio - 0.05, dados: {itens: [{src: 'rugas.jpg', em: b.at('rugas')}, {src: 'bigode.jpg', em: b.at('bigode')}]}},
			// B-roll do produto (ela não mostra o frasco): quando fala o nome e na marca.
			{tipo: 'peca', nome: 'ProdutoAd01', de: b.say('Rejuvex Ultra').inicio, ate: b.say('O colágeno e o').inicio, dados: {src: 'produto.jpg'}},
			{tipo: 'peca', nome: 'ProdutoAd01', de: b.at('suplemento'), ate: b.at('plataforma'), dados: {src: 'produto2.jpg'}},
			// Seta para o botão laranja até o fim.
			{tipo: 'peca', nome: 'SetaLaranjaAd01', de: b.at('Caso'), ate: fim},
		];
	},
};
