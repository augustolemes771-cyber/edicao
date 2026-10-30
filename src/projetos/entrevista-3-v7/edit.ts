import type {EfeitoCamera, Edit} from '../../motor/plano';
import type {Busca, Trecho} from '../../motor/palavras';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// Entrevista 3, vídeo 7 (tema Entrevista): Danilow entrevista o NewTex, ex-profissional de educação física que fatura
// R$ 8 milhões com live. Fonte 7.MOV convertida para 1440x2560 SDR 30 qps (scripts/converter-entrevista-3.sh).
// Roteiro: gancho (halter 3D → conta até R$ 8 MILHÕES) → zero barreira (muro quebra) → celular + internet → NewTex, brabo das
// lives → dica pro iniciante → pergunta (corrida dos ratos → preso na CLT) → procure o TikTok Shop, zero barreira → produto em
// casa, suplemento, área fitness → na mesa mesmo, dicas → pessoas perguntando → recorde R$ 1,4 MI (barras) → R$ 140 MIL de
// lucro → 8 h de live? passo até 24 HORAS (relógio) → "não é fácil, mas é muito simples" → quer começar? → siga → cartão final.
// Revisão de 30/10/2026: sem limite de tempo (voltaram as falas tiradas só para caber em 59 s), bordas dos trechos medidas pela
// energia da voz e transcrição com os tempos refeitos pelo DTW do whisper (estava até 0,9 s adiantada: legenda fora de
// sincronia e o fim de "começar" vazava como um "tá" no começo da pergunta). Peças novas em ./pecas.tsx.
// O Whisper escreveu "Danilo" e "Newtags": na tela vão DANILOW e NEWTEX.
const P = {x: 0.5, y: 0.35};

// Trechos mantidos, no tempo original, com as bordas no silêncio medido (energia da voz, banda 250–3500 Hz). Ficam de fora:
// a pausa antes de "Rapaziada", a pergunta repetida ("Qual é a dica... destravar no digital?"), "É isso, rapaziada", o
// "tá?" depois de "muito simples" e o "Valeu. E aí, gente, vai." do fim.
const TRECHOS: Trecho[] = [
	[0.36, 5.48], // Ex-profissional de educação física, mais de 8 milhões faturados, só fazendo live.
	[5.86, 11.8], // Rapaziada, zero barreira de entrada, é um celular e internet. Estou aqui com o NewTex, brabo demais das lives.
	[12.12, 15.42], // NewTex, vamos passar aqui uma dica para os iniciantes, para quem quer começar.
	[16.0, 20.14], // Qual é o insight que você passa para a pessoa ali que está presa na corrida dos ratos, presa no CLT?
	[24.52, 31.38], // Então, galera, hoje eu indico... TikTok Shopping, né? Porque zero barreira de entrada aí, porque eu tiro por mim.
	[31.88, 36.42], // Tipo, todo mundo tem produtos em casa que vendem no TikTok Shopping, às vezes você tem um suplemento.
	[36.7, 44.72], // Eu que sou da área fitness... foi assim que eu comecei. Peguei meus suplementos... como sou da área.
	[45.38, 50.14], // E aí várias pessoas foram perguntando... comecei a ter resultado no começo.
	[50.54, 53.06], // E qual foi o seu recorde de faturamento em um mês de lucro no bolso?
	[53.32, 55.06], // De um mês, 1 milhão e 400.
	[55.72, 60.04], // 1 milhão de faturamento deu 140 mil de lucro? Isso, eu vou aproximar de um mês.
	[60.32, 63.84], // Será que compensa ficar 8 horas em live para lucrar 140 mil no mês?
	[64.16, 66.0], // Amigo, desse jeito eu passo até 24 horas.
	[67.32, 69.44], // Não é fácil, mas é muito simples,
	[69.82, 71.0], // Quer começar no TikTok Shopping?
	[71.32, 72.14], // Segue o Danilo,
	[72.34, 75.08], // segue o Newtags, siga o MVM e vamos para cima.
];

// Ritmo frenético (evento a cada 0,3–0,6 s): punch-in nas palavras, ciclo médio → close → aberto, até 1,28.
const ESCALAS = [1.1, 1.2, 1.28, 1.14, 1.24, 1.06];
const punches = (b: Busca, frase: string, passo = 0.5, ocorrencia = 1): EfeitoCamera[] => {
	const lista: EfeitoCamera[] = [];
	let ultimo = -9;
	for (const t of b.tempos(frase, ocorrencia)) {
		if (t - ultimo < passo) continue;
		lista.push({tipo: 'zoom', em: t, escala: ESCALAS[lista.length % ESCALAS.length], ...P});
		ultimo = t;
	}
	return lista;
};

export const entrevista3V7: Edit = {
	pasta: 'projetos/entrevista-3-v7',
	video: 'video.mp4',
	formato: 'vertical',
	verificarCurva: false,
	regraCamera: false,
	extraFim: 2.4,
	silencios: silencios as Trecho[],
	transcricao,
	trechos: () => {
		// Tira as pausas medidas (≥ 0,25 s) que caem dentro de um trecho, com 0,04 s de ar de cada lado.
		const cortado: Trecho[] = [];
		for (const [a, z] of TRECHOS) {
			let ini = a;
			for (const [s0, s1] of silencios as Trecho[]) {
				if (s0 <= ini + 0.25 || s1 >= z - 0.25 || s1 - s0 < 0.25) continue;
				cortado.push([ini, s0 + 0.04]);
				ini = s1 - 0.04;
			}
			cortado.push([ini, z]);
		}
		return cortado;
	},
	legenda: {
		estilo: 'mare',
		altura: 0.656,
		palavrasPorTela: 4,
		enfase: [
			{palavra: 'fitness,', estilo: 'serif'},
			{palavra: 'fácil', estilo: 'serif'},
			{palavra: 'resultado', estilo: 'serif'},
		],
		falantes: (b) => [
			{de: b.at('Qual') - 0.1, ate: b.at('CLT?') + 0.4, nome: 'PERGUNTA'},
			{de: b.at('Então,') - 0.05, ate: b.say('começo.').fim + 0.1, nome: 'NEWTEX'},
			{de: b.say('E qual foi').inicio - 0.05, ate: b.at('bolso?') + 0.4, nome: 'PERGUNTA'},
			{de: b.say('De um mês').inicio - 0.05, ate: b.at('400.') + 0.3, nome: 'NEWTEX'},
			{de: b.at('Será') - 0.05, ate: b.at('mês?') + 0.3, nome: 'PERGUNTA'},
			{de: b.at('Amigo,') - 0.05, ate: b.at('horas.') + 0.3, nome: 'NEWTEX'},
		],
	},
	camera: (b) => {
		const z = (em: number, escala: number): EfeitoCamera => ({tipo: 'zoom', em, escala, ...P});
		return [
			// Gancho: o clarão fica dentro da peça, na trava do número
			z(0, 1.12),
			z(b.at('educação'), 1.2),
			z(b.at('8'), 1.28),
			z(b.at('live.'), 1.14),
			z(b.at('Estou'), 1.06),
			...punches(b, 'Estou aqui com o NewTex, brabo demais das lives'),
			...punches(b, 'vamos passar aqui uma dica para os iniciantes, para quem quer começar', 0.55),
			{tipo: 'chicote', em: b.at('Qual')},
			z(b.at('Qual'), 1),
			z(b.at('insight'), 1.12),
			{tipo: 'chicote', em: b.at('Então,')},
			...punches(b, 'Então, galera, hoje eu indico para você procurar o TikTok Shopping', 0.55),
			...punches(b, 'Porque zero barreira de entrada aí, porque eu tiro por mim', 0.5),
			...punches(b, 'Todo mundo tem produtos em casa', 0.55),
			...punches(b, 'Peguei meus suplementos com o suplemento na mesa mesmo, comecei a falar, tirar dicas do pessoal como sou da área', 0.55),
			...punches(b, 'E aí várias pessoas foram perguntando e eu entrei muito fácil no TikTok Shopping e comecei a ter resultado no começo', 0.55),
			{tipo: 'chicote', em: b.say('E qual foi').inicio},
			z(b.say('E qual foi').inicio, 1),
			z(b.at('recorde'), 1.12),
			z(b.at('lucro'), 1.2),
			{tipo: 'chicote', em: b.say('De um mês').inicio},
			z(b.say('De um mês').inicio, 1.08),
			{tipo: 'chicote', em: b.at('1', 2)},
			z(b.at('1', 2), 1.02),
			z(b.at('faturamento', 2), 1.14),
			z(b.at('140'), 1.26),
			z(b.at('Isso,'), 1.1),
			{tipo: 'chicote', em: b.at('Será')},
			z(b.at('Será'), 1),
			z(b.at('compensa'), 1.12),
			z(b.at('lucrar'), 1.2),
			{tipo: 'chicote', em: b.at('Amigo,')},
			z(b.at('Amigo,'), 1.16),
			z(b.at('jeito'), 1.08),
			z(b.at('24'), 1.28),
			z(b.at('Não'), 1),
			{tipo: 'flash', em: b.at('simples,') - 0.04},
			z(b.at('simples,'), 1.25),
			z(b.at('Quer', 2), 1.08),
			z(b.at('TikTok', 4), 1.18),
			z(b.at('Segue'), 1.04),
			z(b.at('Newtags,'), 1.16),
			z(b.at('MVM'), 1.22),
			z(b.at('vamos', 2), 1.28),
		];
	},
	cenas: (b) => {
		const fimFala = b.say('vamos para cima').fim;
		const zero = b.at('zero');
		const relogioAte = b.at('24') + 0.65;
		return [
			// 1. Gancho: halter 3D acima da cabeça, depois o faturamento contando até R$ 8 MILHÕES e "SÓ FAZENDO LIVE"
			{
				tipo: 'peca',
				nome: 'v7Gancho',
				de: 0,
				ate: zero - 0.5,
				dados: {conta: b.at('8') - 0.05, trava: b.at('faturados,') + 0.3, live: b.at('live.')},
				esconderLegenda: true,
				som: 'pro_pop',
				sons: [{em: b.at('faturados,') + 0.3, som: 'pro_pop', ganho: 0.8}],
			},
			// 2. Zero barreira: o muro se monta e quebra; depois o celular e a internet (tela inteira)
			{
				tipo: 'peca',
				nome: 'v7ZeroBarreira',
				modo: 'cheia',
				de: zero - 0.5,
				ate: b.say('é um celular').inicio - 0.02,
				dados: {quebra: b.at('barreira')},
				esconderLegenda: true,
				som: 'pro_whoosh',
				sons: [{em: b.at('barreira') + 0.02, som: 'pro_quebra', ganho: 0.7}],
			},
			{
				tipo: 'peca',
				nome: 'v7CelularInternet',
				modo: 'cheia',
				de: b.say('é um celular').inicio - 0.02,
				ate: b.at('internet.') + 0.75,
				dados: {celular: b.at('celular'), internet: b.at('internet.')},
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
				sons: [{em: b.at('internet.'), som: 'pro_tick', ganho: 0.7}],
			},
			// 3. Apresentação: o nome na pílula e a live dele no "lives"
			{
				tipo: 'pilula',
				de: b.at('internet.') + 0.75,
				ate: b.at('lives.') - 0.05,
				rotulo: 'BRABO DAS LIVES',
				nome: 'NewTex',
				y: 1080,
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			{
				tipo: 'live',
				de: b.at('lives.') - 0.05,
				ate: b.at('NewTex,', 2) + 0.5,
				host: 'NewTex',
				curtidas: '48,2 mil curtidas',
				espectadores: '2,3 mil',
				comentarios: [
					{nome: 'Gabi', texto: 'quero o whey!'},
					{nome: 'Leo', texto: 'chegou hoje ✅'},
				],
				som: 'pro_whoosh_curto',
			},
			// 4. A dica para quem está começando
			{
				tipo: 'chips',
				de: b.at('dica') - 0.05,
				ate: b.at('Qual') - 0.05,
				itens: [{texto: 'DICA PRO INICIANTE', em: b.at('dica')}],
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
			},
			// 5. Pergunta: a corrida dos ratos (rato na roda, tela inteira) e logo a prisão da CLT
			{
				tipo: 'peca',
				nome: 'v7CorridaRatos',
				modo: 'cheia',
				de: b.at('pessoa') - 0.05,
				ate: b.at('presa', 2) - 0.02,
				dados: {corrida: b.at('presa'), ratos: b.at('corrida')},
				esconderLegenda: true,
				som: 'pro_whoosh',
				sons: [{em: b.at('corrida'), som: 'pro_tick', ganho: 0.6}],
			},
			{
				tipo: 'presoClt',
				de: b.at('presa', 2) - 0.02,
				ate: b.at('Então,') + 0.6,
				em: b.at('presa', 2),
				emCadeado: b.at('CLT?'),
				som: 'pro_swipe',
				sons: [{em: b.at('CLT?'), som: 'pro_tick', ganho: 0.8}],
			},
			// 6. A dica: TikTok Shop
			{
				tipo: 'selo',
				de: b.at('procurar') - 0.1,
				ate: b.at('Porque') + 0.2,
				texto: 'TIKTOK SHOP',
				chip: 'A DICA',
				emChip: b.at('procurar'),
				y: 330,
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			// 7. Como ele começou: o pote de suplemento pula a cada ideia (meia tela)
			{
				tipo: 'peca',
				nome: 'v7Suplemento',
				de: b.at('produtos') - 0.1,
				ate: b.at('comecei.') + 0.75,
				dados: {
					linhas: [
						{texto: 'PRODUTO EM CASA', em: b.at('produtos')},
						{texto: 'SUPLEMENTO', em: b.at('suplemento.')},
						{texto: 'ÁREA FITNESS', em: b.at('fitness,')},
						{texto: 'ASSIM COMECEI', em: b.at('comecei.')},
					],
				},
				esconderLegenda: true,
				som: 'pro_pouso',
				sons: [
					{em: b.at('suplemento.'), som: 'pro_pouso', ganho: 0.7},
					{em: b.at('fitness,'), som: 'pro_pouso', ganho: 0.7},
					{em: b.at('comecei.'), som: 'pro_pouso', ganho: 0.7},
				],
			},
			{
				tipo: 'chips',
				de: b.at('mesa') - 0.1,
				ate: b.at('área.', 2) + 0.25,
				itens: [
					{texto: 'NA MESA MESMO', em: b.at('mesa')},
					{texto: 'DICAS DO PESSOAL', em: b.at('dicas')},
				],
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
				sons: [{em: b.at('dicas'), som: 'pro_tick', ganho: 0.7}],
			},
			// 8. Várias pessoas perguntando: mensagens chegando
			{
				tipo: 'notificacoes',
				de: b.at('várias') - 0.1,
				ate: b.at('resultado') + 0.2,
				itens: [
					{titulo: 'Rafa', texto: 'qual whey você usa?', em: b.at('várias')},
					{titulo: 'Bruna', texto: 'onde compro esse?', em: b.at('perguntando')},
					{titulo: 'Caio', texto: 'manda o link!', em: b.at('entrei')},
				],
				y: 300,
				icone: 'mensagem',
				somItem: 'pro_msg',
				ganhoItem: 0.5,
			},
			// 9. Recorde: barras 3D sobem e o valor conta até R$ 1,4 MI; o lucro em ouro 3D
			{
				tipo: 'peca',
				nome: 'v7Recorde',
				de: b.say('De um mês').inicio - 0.05,
				ate: b.at('400.') + 0.85,
				dados: {sobe: b.at('1'), trava: b.at('400.') + 0.1},
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [{em: b.at('400.') + 0.1, som: 'pro_pop', ganho: 0.7}],
			},
			{
				tipo: 'numero3d',
				de: b.at('140') - 0.1,
				ate: b.at('Isso,') + 0.3,
				texto: 'R$ 140 MIL',
				rotulo: 'NO BOLSO',
				abaixo: 'DE LUCRO',
				em: b.at('140'),
				esconderLegenda: true,
				som: 'pro_pop',
			},
			// 10. "Compensa ficar 8 horas em live?" → "passo até 24 horas": relógio de ouro com os ponteiros voando
			{
				tipo: 'peca',
				nome: 'v7Relogio',
				de: b.at('8', 2) - 0.15,
				ate: relogioAte,
				dados: {oito: b.at('8', 2), vinte4: b.at('24')},
				esconderLegenda: true,
				som: 'pro_tick',
				sons: [{em: b.at('24'), som: 'pro_pop', ganho: 0.7}],
			},
			// 11. Síntese
			{
				tipo: 'frase',
				de: relogioAte,
				ate: b.at('Quer', 2) + 0.15,
				palavras: [
					{texto: 'NÃO É FÁCIL', em: b.at('Não')},
					{texto: 'É MUITO SIMPLES', em: b.say('muito simples').inicio, destaque: true},
				],
				som: 'pro_frase',
			},
			// 12. CTA: siga cada um
			{
				tipo: 'siga',
				de: b.at('Segue') - 0.05,
				ate: fimFala + 0.05,
				itens: [
					{texto: 'DANILOW', em: b.at('Segue')},
					{texto: 'NEWTEX', em: b.at('Newtags,')},
					{texto: 'MVM', em: b.at('MVM')},
				],
				y: 1040,
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [
					{em: b.at('Newtags,'), som: 'pro_swipe', ganho: 0.7},
					{em: b.at('MVM'), som: 'pro_swipe', ganho: 0.7},
				],
			},
			// 13. Cartão final
			{tipo: 'final', de: fimFala + 0.1, ate: fimFala + 2.4, marca: 'MVM', linha2: 'CREATORS', sub: 'LIVE NO TIKTOK SHOP', tres: true, som: 'pro_logo'},
		];
	},
};
