import type {Edit} from '../../motor/plano';
import transcricao from './transcricao.json';

// Depoimento de aluna da Mentoria do Danilow: 1:41 de fala reduzidos a ~56 s, mais 2,5 s de cartela final.
// Roteiro: gancho com resultado → dor (antes) → virada (conheceu o Danilow) → transformação
// → o que aprendeu → resultado → suporte → agradecimento → fechamento com o próximo nível.
export const depoimentoDanilow: Edit = {
	pasta: 'projetos/depoimento-danilow',
	video: 'video.mp4',
	formato: 'vertical',
	verificarCurva: false,
	regraCamera: false,
	barraProgresso: {cor: '#ffd21f'},
	// Cartela final com a marca depois da fala (o vídeo fica com ~58 s, abaixo do limite de 59).
	extraFim: 2.5,
	transcricao,
	// Pessoa recortada (scripts/recortar.py): texto e cenário atrás dela.
	recorte: 'pessoa.webm',
	// Trechos que saem, no tempo original. Cada borda cai num silêncio medido no áudio
	// (energia abaixo de -38 dB), porque o tempo de palavra do Whisper erra ~0,3 s.
	cortes: [
		[2.05, 3.72], // "e de toda a equipe dele?"
		[7.85, 15.6], // "com certeza, porque a gente já vinha trabalhando com vídeo…"
		[46.05, 50.55], // "É um mercado, gente, muito além daquilo que a gente imagina"
		[58.5, 61.23], // "então é uma segurança que a equipe traz para a gente fora"
		[64.45, 67.9], // "eles estão com a gente aí no dia a dia, então olha,"
		[70.3, 75.85], // "obrigado aos meninos… foi muito bom participar… com certeza"
		[81.45, 101.24], // "que é isso que eu tenho certeza…" até o fim
	],
	legenda: {
		estilo: 'palavra',
		altura: 0.66,
		enfase: [
			{palavra: 'travada', estilo: 'caixa', cor: '#0a0a0a'},
			{palavra: 'decisão', estilo: 'grande', cor: '#ffd21f'},
			{palavra: 'medo', estilo: 'serif'},
			{palavra: 'certo', estilo: 'circulo', cor: '#22c55e'},
			{palavra: 'surreal', estilo: 'cor', cor: '#ffd21f'},
			{palavra: 'diário', estilo: 'serif'},
			{palavra: 'Danilow', estilo: 'serif', ocorrencia: 3},
			{palavra: 'transformou', estilo: 'serif'},
			{palavra: 'nível', estilo: 'grande', cor: '#ffd21f'},
		],
	},
	camera: (b) => [
		// Abre desfocado e entra em foco, já um pouco fechado no rosto.
		{tipo: 'foco', em: 0},
		{tipo: 'zoom', em: 0, escala: 1.12, y: 0.3},
		// Zoom diferente em cada emenda (b.emendas = quadro exato do corte): o pulo some.
		{tipo: 'zoom', em: b.emendas[0], escala: 1.35, y: 0.3},
		// Plano aberto enquanto há palavra gigante atrás dela: a cabeça cobre só o meio da palavra.
		{tipo: 'zoom', em: b.at('foi'), escala: 1, y: 0.3},
		{tipo: 'zoom', em: b.emendas[1], escala: 1, y: 0.3},
		{tipo: 'zoom', em: b.at('travada'), escala: 1.25, y: 0.3},
		// Virada da história: clarão.
		{tipo: 'flash', em: b.say('e aí foi quando').inicio},
		{tipo: 'zoom', em: b.say('e aí foi quando').inicio, escala: 1.05, y: 0.3},
		{tipo: 'zoom', em: b.say('e foi a melhor').inicio, escala: 1, y: 0.3},
		{tipo: 'zoom', em: b.say('porque olha').inicio, escala: 1, y: 0.3},
		{tipo: 'zoom', em: b.at('entendendo'), escala: 1.15, y: 0.3, suave: 6},
		{tipo: 'zoom', em: b.emendas[2], escala: 1.35, y: 0.3},
		{tipo: 'zoom', em: b.at('medo'), escala: 1, y: 0.3},
		{tipo: 'zoom', em: b.say('a gente sabe que').inicio, escala: 1.15, y: 0.3},
		{tipo: 'zoom', em: b.emendas[3], escala: 1, y: 0.3},
		{tipo: 'zoom', em: b.emendas[4], escala: 1.3, y: 0.3},
		// Aprendizados em cenários 3D: mergulha do rosto para o cenário, troca com glitch e luz, volta com íris.
		{tipo: 'mergulho', em: b.say('como funciona o algoritmo').inicio},
		{tipo: 'listras', em: b.say('como escolher').inicio},
		{tipo: 'vazamento', em: b.say('como funciona a live').inicio},
		{tipo: 'iris', em: b.at('Hoje')},
		{tipo: 'foco', em: b.at('Hoje'), duracao: 0.35},
		// Tópicos do resultado: entra com luz dourada e volta para ela com foco.
		{tipo: 'vazamento', em: b.at('medo'), cores: ['#ffd27a', '#e0a33a', '#3a2a10']},
		{tipo: 'foco', em: b.at('surreal'), duracao: 0.35},
		// Cartela final.
		{tipo: 'vazamento', em: b.say('próximo nível').fim + 0.3, cores: ['#ffd27a', '#e0a33a', '#3a2a10']},
		// Ato final: chicote e aproximação lenta até o fim.
		{tipo: 'chicote', em: b.emendas[5]},
		{tipo: 'zoom', em: b.emendas[5], escala: 1.05, y: 0.3},
		{tipo: 'zoom', em: b.say('transformou a nossa mente').inicio, escala: 1.15, y: 0.3, suave: 2},
		{tipo: 'zoom', em: b.say('próximo nível').inicio, escala: 1, y: 0.3},
	],
	cenas: (b) => [
		// Visor de câmera no gancho: cara de depoimento real, gravado.
		{tipo: 'rec', de: 0, ate: b.emendas[1]},
		// Quem é o Danilow: a foto dele sai de um aro dourado quando ela fala o nome.
		{
			tipo: 'retrato',
			src: 'danilow.png',
			nome: 'Danilow',
			paleta: 'dourado',
			pequeno: 'mentoria do',
			de: b.at('mentoria'),
			ate: b.at('foi'),
		},
		// Gancho: o resultado em primeiro lugar, gigante atrás da cabeça dela.
		{
			tipo: 'gigante',
			texto: 'divisor de águas',
			linhas: [{texto: 'foi um divisor'}, {texto: 'de águas', grande: true}],
			tamanho: 0.21,
			y: 0,
			de: b.at('foi'),
			ate: b.emendas[1],
		},
		// Dor: alertas na hora da fala.
		{
			tipo: 'alertas',
			variante: 'escura',
			de: b.at('sentia'),
			ate: b.say('e aí foi quando').inicio,
			itens: [
				{texto: 'travada nas lives', em: b.at('travada')},
				{texto: 'sem entender o processo', em: b.say('não entendia').inicio, icone: 'x'},
			],
		},
		// Virada: a foto dele volta, menor, no canto, quando ela conta que conheceu o Danilow.
		{
			tipo: 'retrato',
			src: 'danilow.png',
			nome: 'Danilow',
			paleta: 'dourado',
			variante: 'lado',
			de: b.at('conheceu'),
			ate: b.say('para poder entender').inicio,
		},
		// "A melhor decisão" em dourado atrás dela.
		{
			tipo: 'gigante',
			texto: 'a melhor decisão',
			linhas: [{texto: 'a melhor'}, {texto: 'decisão', grande: true}],
			tamanho: 0.21,
			y: 0,
			de: b.say('e foi a melhor').inicio,
			ate: b.say('porque olha').inicio,
		},
		// Transformação.
		{
			tipo: 'kicker',
			pequeno: 'mente totalmente',
			grande: 'transformada',
			emGrande: b.at('transformada'),
			de: b.at('mente'),
			ate: b.say('Porque a gente').inicio,
		},
		// O que aprendeu: um cenário 3D por item, entrando na palavra falada. A voz dela continua por baixo.
		{
			tipo: 'xadrez',
			pasta: 'projetos/depoimento-danilow/xadrez-veo',
			video: true,
			de: b.say('como funciona o algoritmo').inicio,
			ate: b.say('como escolher').inicio,
			pequeno: 'como funciona o',
			grande: 'algoritmo',
			emGrande: b.at('algoritmo') - b.say('como funciona o algoritmo').inicio,
		},
		{
			tipo: 'cenario',
			de: b.say('como escolher').inicio,
			ate: b.say('como funciona a live').inicio,
			luz: 'folhas',
			fantasma: 'PRODUTO',
			pequeno: 'como escolher o',
			grande: 'produto certo',
			posTexto: 0.28,
			objetos: [
				{tipo: 'caixa', x: -0.05, y: -0.5, escala: 1.25, giro: [0.35, 0.65, 0], girar: 0.25, entra: 'nenhum'},
				{tipo: 'moeda', x: 0.58, y: -0.08, z: 0.5, escala: 0.55, girar: 1, simbolo: 'R$', atraso: 4},
				{tipo: 'moeda', x: -0.72, y: -0.82, z: 0.6, escala: 0.45, girar: -0.8, simbolo: 'R$', atraso: 8},
			],
		},
		{
			tipo: 'cenario',
			de: b.say('como funciona a live').inicio,
			ate: b.at('Hoje'),
			superficie: 'escuro',
			luz: 'nenhuma',
			fantasma: 'AO VIVO',
			pequeno: 'live shop dentro do',
			grande: 'TikTok Shop',
			posTexto: 0.17,
			objetos: [{tipo: 'celular', x: 0, y: -0.38, escala: 1.15, giro: [-0.05, -0.32, 0.04], entra: 'nenhum'}],
		},
		// Resultado: "SEM MEDO" atrás dela.
		// Resultado: tópicos cinematográficos sobre o vídeo dela desfocado (refeito em 23/10/2026).
		{
			tipo: 'topicos',
			de: b.at('medo'),
			ate: b.at('surreal'),
			titulo: 'Hoje a gente',
			itens: [
				{texto: 'Não tem mais *medo*', em: b.at('medo')},
				{texto: 'Sabe como *testar*', em: b.say('sabe como').inicio},
				{texto: 'Sabe que vai dar *certo*', em: b.say('sabe que').inicio},
				{texto: '*Acompanhamento* diário', em: b.at('acompanhamento')},
			],
		},
		// Suporte: "SURREAL" neon atrás dela.
		{
			tipo: 'gigante',
			texto: 'surreal',
			linhas: [{texto: 'é'}, {texto: 'surreal', grande: true}],
			tamanho: 0.21,
			y: 0,
			de: b.at('surreal'),
			ate: b.emendas[4],
		},
		// Ato final no quarto real dela: só "PRÓXIMO NÍVEL" atrás (a troca de fundo ficou artificial, 23/10).
		{
			tipo: 'gigante',
			texto: 'o próximo nível',
			linhas: [{texto: 'o próximo'}, {texto: 'nível', grande: true}],
			// Fechamento na frente dela, grande, na altura do peito: atrás, a cabeça tapava a palavra.
			modo: 'sobre',
			tamanho: 0.32,
			y: 0.6,
			de: b.at('alcance'),
			ate: b.say('próximo nível').fim + 0.3,
		},
		// Agradecimento.
		{
			tipo: 'kicker',
			pequeno: 'valeu muito',
			grande: 'a pena',
			emGrande: b.at('pena'),
			de: b.at('valeu'),
			ate: b.at('obrigado'),
		},
		// Cartela final 3D com a marca, depois da última palavra.
		{
			tipo: 'cenario',
			de: b.say('próximo nível').fim + 0.3,
			ate: b.say('próximo nível').fim + 2.8,
			superficie: 'escuro',
			luz: 'nenhuma',
			pequeno: 'Mentoria',
			grande: 'Danilow',
			estiloTexto: 'ouro',
			posTexto: 0.42,
			objetos: [
				{tipo: 'moeda', x: 0.68, y: 0.72, z: -0.4, escala: 0.7, girar: 0.6, simbolo: 'R$'},
				{tipo: 'moeda', x: -0.7, y: -0.66, z: 0.4, escala: 1, girar: -0.5, simbolo: 'R$'},
				{tipo: 'notas', x: 0.45, y: -0.58, z: -0.6, escala: 0.7, giro: [0.3, 0.6, 0.4]},
			],
		},
	],
};
