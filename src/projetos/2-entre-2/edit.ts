import type {Cena, EfeitoCamera, Edit} from '../../motor/plano';
import type {Busca, Trecho} from '../../motor/palavras';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// 2-entre-2, vídeo 2 de 2 (tema Entrevista): Danilow com o Marcos e o Erick no kartódromo (MVM). Mesma mídia do 2-entre
// (video.mp4 com hard link; este vídeo usa só a parte do IMG_3539, 66,5–229 s).
// Gancho já no primeiro quadro: "8 MILHÕES faturados" (dígito em ouro com louros) → R$ 10 MIL em 1 dia em ouro 3D → a live
// cheia → clarão no "surreal". Depois: a dica do Marcos (barreira de entrada mínima) → zero barreira → mentoria de live
// (antes × depois, minerar produto, R$ 20 mil numa live, encurta o tempo) → comunidade MVM → a mente que expande → CTA do
// próprio clipe (curte, compartilha, dúvida nos comentários, siga Danilow e MVM) movido para o fim → cartão final.
// Saíram "Então, segue a gente aí, vamos pra cima" (repete o CTA) e "Valeu, Erick".
// Rostos: Marcos à esquerda, Erick à direita, y ≈ 0,44.

const F = {
	marcos: ['8 milhões faturados', 'muito, muito bom'],
	zero: ['Não precisa de estoque', 'zero barreira de entrada'],
	mentoria: ['Nós temos a mentoria', 'poder evoluir'],
	erick1: ['Cara, acho que uma das maiores', 'é isso aí'],
	comunidade: ['Se você quiser aprender', 'formato original'],
	cta: ['já curte', 'segue o MVM'],
} as const;
const ini = (b: Busca, k: keyof typeof F) => b.say(F[k][0]).inicio;
const fim = (b: Busca, k: keyof typeof F) => b.say(F[k][1]).fim;

// Telas inteiras (o rosto não aparece): sem zoom de câmera dentro delas.
const cheias = (b: Busca): Trecho[] => [
	[b.at('medo') - 0.1, b.at('Cara') - 0.1],
	[b.at('absurda') - 0.3, b.say('pra você fazer').fim + 0.3],
	[b.say('como foi antes').inicio - 0.1, b.say('é depois').fim + 0.4],
	[b.say('quem tiver disposto').inicio - 0.05, b.say('teu tempo').fim + 0.35],
	[b.say('todo mundo quer se ajudar').inicio - 0.1, b.say('passa pro outro').fim + 0.4],
	[b.at('Resumindo') - 0.1, b.say('formato original').fim + 0.3],
];

// Centro do zoom (posição do rosto de quem fala).
const centro = (b: Busca, t: number) => (t < ini(b, 'mentoria') ? {x: 0.4, y: 0.44} : t < ini(b, 'cta') ? {x: 0.6, y: 0.44} : {x: 0.55, y: 0.45});

// Ritmo frenético: punch a cada ~0,55 s fora das telas inteiras, ciclo médio → close → aberto, até 1,28.
const ESCALAS = [1.08, 1.18, 1.26, 1.12, 1.22, 1.04];
const punches = (b: Busca): EfeitoCamera[] => {
	const fora = cheias(b);
	const lista: EfeitoCamera[] = [];
	let ultimo = -9;
	for (const p of b.palavras) {
		if (p.inicio - ultimo < 0.55 || fora.some(([a, z]) => p.inicio > a - 0.1 && p.inicio < z + 0.1)) continue;
		lista.push({tipo: 'zoom', em: p.inicio, escala: ESCALAS[lista.length % ESCALAS.length], ...centro(b, p.inicio)});
		ultimo = p.inicio;
	}
	return lista;
};

export const p2Entre2: Edit = {
	pasta: 'projetos/2-entre-2',
	video: 'video.mp4',
	formato: 'vertical',
	verificarCurva: false,
	regraCamera: false,
	extraFim: 2.8,
	silencios: silencios as Trecho[],
	transcricao,
	trechos: () => {
		// Bordas fixas nos vales de energia da voz (o Whisper errava de 0,45 a 1,5 s nestes pontos; 08/11/2026).
		const lista: Trecho[] = [
			[67.1, 170.48], // Marcos (8 milhões → barreira) + Danilow (zero barreira) + mentoria + Erick
			[177.2, 225.45], // comunidade MVM → "não volta mais no formato original"
			[170.48, 177.2], // CTA do clipe ("Ó, já curte, compartilha... segue o MVM"), movido para o fim
		];
		// Tira as pausas medidas (≥ 0,3 s) que caem dentro de um trecho, com 0,04 s de ar de cada lado.
		const cortado: Trecho[] = [];
		for (const [a, z] of lista) {
			let comeco = a;
			for (const [s0, s1] of silencios as Trecho[]) {
				if (s0 <= comeco + 0.25 || s1 >= z - 0.25 || s1 - s0 < 0.3) continue;
				cortado.push([comeco, s0 + 0.04]);
				comeco = s1 - 0.04;
			}
			cortado.push([comeco, z]);
		}
		return cortado;
	},
	legenda: {
		estilo: 'mare',
		altura: 0.656,
		palavrasPorTela: 4,
		enfase: [
			{palavra: 'baixíssima', estilo: 'serif'},
			{palavra: 'acertar', estilo: 'serif'},
			{palavra: 'pena', estilo: 'serif'},
			{palavra: 'frente', estilo: 'serif'},
			{palavra: 'ambiência', estilo: 'serif'},
		],
		falantes: (b) => [
			{de: b.at('Marcos', 2) - 0.05, ate: b.at('Cara') - 0.05, nome: 'PERGUNTA'},
			{de: b.at('Cara') - 0.05, ate: fim(b, 'marcos') + 0.1, nome: 'MARCOS'},
			{de: b.say('Marcos, Erick').inicio - 0.05, ate: fim(b, 'mentoria') + 0.1, nome: 'PERGUNTA'},
			{de: ini(b, 'erick1') - 0.05, ate: fim(b, 'erick1') + 0.1, nome: 'ERICK'},
			{de: b.say('Agora, pra finalizar').inicio - 0.05, ate: b.say('pra sua casa').fim + 0.1, nome: 'PERGUNTA'},
			{de: b.say('Cara, o insight').inicio - 0.05, ate: b.say('vale muito a pena', 2).fim + 0.1, nome: 'ERICK'},
		],
	},
	camera: (b) => [
		...punches(b),
		{tipo: 'flash', em: b.at('surreal') - 0.04},
		{tipo: 'chicote', em: ini(b, 'erick1')},
		{tipo: 'chicote', em: ini(b, 'comunidade')},
		{tipo: 'flash', em: b.at('expande') - 0.04},
		{tipo: 'chicote', em: ini(b, 'cta')},
	],
	cenas: (b) => {
		const fimFala = fim(b, 'cta');
		const cenas: Cena[] = [
			// ── MARCOS ─────────────────────────────────────────────────────────────
			// 11. Re-gancho: 8 milhões faturados
			{
				tipo: 'vitoria',
				de: 0,
				ate: b.at('eles') - 0.05,
				numero: '8',
				palavra: 'MILHÕES',
				kicker: 'FATURADOS',
				sub: 'NO TIKTOK SHOP',
				pousa: b.at('faturados'),
				y: 420,
				esconderLegenda: true,
				som: 'pro_whoosh',
				sons: [{em: b.at('faturados'), som: 'pro_pop', ganho: 0.7}],
			},
			// 12. R$ 10 mil de comissão em um dia
			{
				tipo: 'numero3d',
				de: b.at('eles') - 0.05,
				ate: b.say('através de live').inicio - 0.05,
				texto: 'R$ 10 MIL',
				rotulo: 'DE COMISSÃO',
				abaixo: 'EM 1 DIA',
				em: b.at('10'),
				y: 400,
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [{em: b.at('10'), som: 'pro_pop', ganho: 0.7}],
			},
			// 13. "através de live": a live cheia sobre o vídeo
			{
				tipo: 'live',
				de: b.say('através de live').inicio - 0.05,
				ate: b.at('Isso') - 0.03,
				host: 'marcos',
				espectadores: '2,4 mil',
				coracoes: true,
				comentarios: [
					{nome: 'ana.paula', texto: 'quero esse!'},
					{nome: 'julio_r', texto: 'comprei 2!'},
				],
				som: 'pro_msg',
			},
			{tipo: 'pilula', de: b.say('com o Marcos').inicio - 0.3, ate: b.at('Marcos', 2) - 0.05, rotulo: 'CONVIDADO', nome: 'MARCOS', esconderLegenda: true, som: 'pro_tick'},
			// 14. Medo de sair da CLT: pessoa presa no medo + texto 3D
			{
				tipo: 'medo3d',
				de: b.at('medo') - 0.1,
				ate: b.at('Cara') - 0.1,
				linhas: [
					{texto: 'MEDO', em: b.at('medo'), metal: 'cinza'},
					{texto: 'DE SAIR DA CLT', em: b.at('sair'), metal: 'ouro', largura: 4.2},
				],
				pessoa: true,
				som: 'pro_whoosh',
			},
			// 15. Barreira de entrada mínima: a parede quebra
			{
				tipo: 'motion3d',
				modelo: 'barreira',
				de: b.say('mercado digital').inicio - 0.1,
				ate: Math.min(b.say('entrada possível').fim + 0.3, b.say('Você pode ter').inicio - 0.1),
				linhas: [
					{texto: 'MÍNIMA', em: b.at('mínima'), metal: 'ouro'},
					{texto: 'BARREIRA', em: b.at('barreira'), metal: 'branco'},
				],
				marcos: [b.at('entrada')],
				chip: 'TIKTOK SHOP',
				som: 'pro_whoosh',
				sons: [{em: b.at('entrada'), som: 'pro_quebra', ganho: 0.6}],
			},
			// 16. Produto em casa, começa a fazer
			{
				tipo: 'chips',
				de: b.say('Você pode ter').inicio - 0.05,
				ate: b.say('Às vezes tem').inicio - 0.05,
				itens: [
					{texto: 'PRODUTO EM CASA', em: b.say('produto na tua casa').inicio},
					{texto: 'COMEÇA A FAZER', em: b.at('começa')},
				],
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
			},
			// 17. A panela da cozinha que vira venda
			{
				tipo: 'peca',
				nome: 'e2Panela',
				de: b.say('Às vezes tem').inicio,
				ate: b.at('vender') + 0.75,
				esconderLegenda: true,
				som: 'pro_pouso',
				dados: {marcos: [b.at('panela'), b.at('vender')]},
				sons: [{em: b.at('vender'), som: 'pro_msg', ganho: 0.6}],
			},
			// 18. Só um celular
			{
				tipo: 'celular3d',
				de: b.at('absurda') - 0.3,
				ate: Math.min(b.say('pra você fazer').fim + 0.3, b.say('E o produto ali').inicio - 0.08),
				linhas: [
					{texto: 'SÓ UM', em: b.at('precisa')},
					{texto: 'CELULAR', em: b.at('celular')},
				],
				som: 'pro_whoosh',
			},
			// 19. Nem produto: um banner
			{
				tipo: 'peca',
				nome: 'e2Banner',
				de: b.say('E o produto ali').inicio - 0.05,
				ate: b.say('banner ali').fim + 0.3,
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
				dados: {marcos: [b.at('nem'), b.at('banner')]},
				sons: [{em: b.at('banner'), som: 'pro_swipe', ganho: 0.6}],
			},
			// 20. Sem estoque, sem tráfego, zero barreira
			{
				tipo: 'alertas',
				de: ini(b, 'zero') - 0.05,
				ate: Math.min(fim(b, 'zero') + 0.3, ini(b, 'mentoria') - 0.05),
				variante: 'escura',
				itens: [
					{texto: 'SEM ESTOQUE', em: b.at('estoque'), icone: 'x'},
					{texto: 'SEM TRÁFEGO', em: b.at('tráfego'), icone: 'x'},
					{texto: 'ZERO BARREIRA', em: b.at('zero')},
				],
				esconderLegenda: true,
				som: 'pro_tick',
				sons: [{em: b.at('zero'), som: 'pro_pop', ganho: 0.6}],
			},
			// ── MENTORIA (ERICK) ───────────────────────────────────────────────────
			{
				tipo: 'selo',
				de: ini(b, 'mentoria'),
				ate: b.say('Marcos, Erick').inicio - 0.05,
				texto: 'LUCRANDO COM LIVES',
				chip: 'MÉTODO',
				emChip: b.at('Método'),
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			// 21. Antes × depois da mentoria
			{
				tipo: 'gradeAntesDepois',
				de: b.say('como foi antes').inicio - 0.1,
				ate: Math.min(b.say('é depois').fim + 0.4, b.say('O que você aprendeu').inicio - 0.1),
				titulo: [{texto: 'A MENTORIA', em: b.at('mentoria', 2)}],
				antes: {texto: 'ANTES', em: b.at('antes')},
				depois: {texto: 'DEPOIS', em: b.at('depois')},
				som: 'pro_whoosh',
			},
			// 22. Compensa investir? A balança pesa para o evoluir
			{
				tipo: 'peca',
				nome: 'e2Balanca',
				de: b.say('O que você aprendeu').inicio - 0.05,
				ate: fim(b, 'mentoria') + 0.45,
				esconderLegenda: true,
				som: 'pro_tick',
				dados: {marcos: [b.at('compensa'), b.at('evoluir')]},
				sons: [{em: b.at('evoluir'), som: 'pro_pouso', ganho: 0.6}],
			},
			{tipo: 'pilula', de: ini(b, 'erick1') - 0.05, ate: b.at('minerar') - 0.15, rotulo: 'CONVIDADO', nome: 'ERICK', esconderLegenda: true, som: 'pro_tick'},
			// 23. Minerar o produto certo: a picareta racha a rocha
			{
				tipo: 'peca',
				nome: 'e2Minerar',
				de: b.at('minerar') - 0.1,
				ate: b.say('certo pra live').fim + 0.35,
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
				dados: {marcos: [b.at('minerar'), b.say('produto certo').inicio + 0.35]},
				sons: [{em: b.say('produto certo').inicio + 0.35, som: 'pro_quebra', ganho: 0.5}],
			},
			{
				tipo: 'selo',
				de: b.at('acertar') - 0.15,
				ate: b.say('Claro que').inicio - 0.05,
				texto: 'ACERTAR NO PRODUTO',
				esconderLegenda: true,
				som: 'pro_pop',
			},
			// 24. Pessoa, copy e produto: o produto pesa mais
			{
				tipo: 'peca',
				nome: 'e2Pesos',
				de: b.say('Claro que').inicio - 0.05,
				ate: b.say('vender bem').fim + 0.3,
				esconderLegenda: true,
				som: 'pro_tick',
				dados: {
					itens: [
						{texto: 'PESSOA', em: b.at('pessoa')},
						{texto: 'COPY', em: b.at('copy')},
						{texto: 'PRODUTO', em: b.say('Mas o produto').inicio + 0.15},
					],
				},
				sons: [{em: b.say('Mas o produto').inicio + 0.15, som: 'pro_pouso', ganho: 0.6}],
			},
			// 25. "pra trazer pra nossa live": a live deles com o produto
			{
				tipo: 'live',
				de: b.say('nossa live').inicio - 0.1,
				ate: b.say('Acho que foi').inicio - 0.05,
				host: 'erick',
				espectadores: '1,8 mil',
				coracoes: true,
				som: 'pro_msg',
			},
			{
				tipo: 'selo',
				de: b.at('maior') - 0.1,
				ate: b.say('Hoje já teve').inicio - 0.05,
				texto: 'MAIOR DIFERENCIAL',
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			// 26. R$ 20 mil de GMV numa live
			{
				tipo: 'numero3d',
				de: b.say('faturou mais de').inicio - 0.1,
				ate: b.say('Então isso aí').inicio - 0.05,
				texto: 'R$ 20 MIL',
				rotulo: 'GMV',
				abaixo: 'EM 1 LIVE',
				em: b.at('20'),
				y: 400,
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [{em: b.at('20'), som: 'pro_pop', ganho: 0.7}],
			},
			// 27. Investir encurta o tempo: o atalho dourado
			{
				tipo: 'peca',
				nome: 'e2Atalho',
				de: b.say('quem tiver disposto').inicio - 0.05,
				ate: b.say('teu tempo').fim + 0.35,
				modo: 'cheia',
				esconderLegenda: true,
				som: 'pro_whoosh',
				dados: {
					marcos: [b.say('disposto a investir').fim - 0.3, b.at('encurtar')],
					linhas: [
						{texto: 'ENCURTA', em: b.at('encurtar'), metal: 'ouro'},
						{texto: 'O TEMPO', em: b.say('teu tempo').inicio, metal: 'branco'},
					],
				},
				sons: [{em: b.at('encurtar'), som: 'pro_swipe', ganho: 0.7}],
			},
			// ── COMUNIDADE ─────────────────────────────────────────────────────────
			{
				tipo: 'selo',
				de: b.at('melhor') - 0.1,
				ate: b.say('Agora, pra finalizar').inicio - 0.05,
				texto: 'COMUNIDADE MVM',
				chip: 'MELHOR CAMINHO',
				emChip: b.at('melhor'),
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			// 28. A viagem e o insight: a mala abre e sai a lâmpada
			{
				tipo: 'peca',
				nome: 'e2Mala',
				de: b.say('O que você enxerga').inicio - 0.05,
				ate: b.say('pra sua casa').fim + 0.3,
				esconderLegenda: true,
				som: 'pro_pouso',
				dados: {marcos: [b.at('viagem'), b.at('insight')]},
				sons: [{em: b.at('insight'), som: 'pro_pop', ganho: 0.6}],
			},
			// 29. Todo mundo se ajuda: a rede se liga e o conhecimento passa de um para outro
			{
				tipo: 'peca',
				nome: 'e2Rede',
				de: b.say('todo mundo quer se ajudar').inicio - 0.1,
				ate: b.say('passa pro outro').fim + 0.4,
				modo: 'cheia',
				esconderLegenda: true,
				som: 'pro_whoosh',
				dados: {
					itens: [
						{texto: 'SE AJUDAM', em: b.at('ajudar')},
						{texto: 'SE APOIAM', em: b.at('apoia')},
						{texto: 'CONHECIMENTO', em: b.at('Conhecimento', 2)},
					],
				},
				sons: [
					{em: b.at('apoia'), som: 'pro_swipe', ganho: 0.5},
					{em: b.at('Conhecimento', 2), som: 'pro_pulso', ganho: 0.6},
				],
			},
			// 30. Mercado pra todo mundo
			{
				tipo: 'peca',
				nome: 'e2Mercado',
				de: b.say('todo mundo vai ganhar').inicio - 0.3,
				ate: b.say('pra todo mundo').fim + 0.4,
				esconderLegenda: true,
				som: 'pro_swipe',
				dados: {marcos: [b.at('ganhar'), b.at('mercado', 2)]},
				sons: [{em: b.at('mercado', 2), som: 'pro_pop', ganho: 0.6}],
			},
			// 31. Síntese: a mente expande e não volta ao formato original
			{
				tipo: 'peca',
				nome: 'v14Mente',
				de: b.at('Resumindo') - 0.1,
				ate: Math.min(b.say('formato original').fim + 0.3, ini(b, 'cta') - 0.05),
				modo: 'cheia',
				esconderLegenda: true,
				som: 'pro_whoosh',
				dados: {
					marcos: [b.at('expande'), b.say('não volta').inicio],
					linhas: [
						{texto: 'NÃO VOLTA', em: b.say('não volta').inicio, metal: 'ouro'},
						{texto: 'AO ORIGINAL', em: b.at('original'), metal: 'branco'},
					],
				},
				sons: [
					{em: b.at('expande'), som: 'pro_quebra', ganho: 0.6},
					{em: b.at('original'), som: 'pro_pop', ganho: 0.6},
				],
			},
			// ── CTA ───────────────────────────────────────────────────────────────
			{
				tipo: 'chips',
				de: ini(b, 'cta') - 0.02,
				ate: b.say('Se tiver alguma dúvida').inicio - 0.05,
				itens: [
					{texto: 'CURTE', em: b.at('curte')},
					{texto: 'COMPARTILHA', em: b.at('compartilha')},
				],
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
				sons: [{em: b.at('compartilha'), som: 'pro_tick', ganho: 0.6}],
			},
			{
				tipo: 'comentario',
				de: b.say('Se tiver alguma dúvida').inicio - 0.05,
				ate: b.say('Já me segue').inicio - 0.05,
				texto: 'Tenho uma dúvida...',
				y: 1060,
				som: 'pro_digita',
			},
			{
				tipo: 'siga',
				de: b.say('Já me segue').inicio - 0.05,
				ate: fimFala + 0.3,
				itens: [
					{texto: 'DANILOW', em: b.at('Danilow')},
					{texto: 'MVM', em: b.say('segue o MVM').inicio + 0.3},
				],
				y: 1040,
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [{em: b.say('segue o MVM').inicio + 0.3, som: 'pro_swipe', ganho: 0.6}],
			},
			{tipo: 'final', de: fimFala + 0.35, ate: fimFala + 2.8, marca: 'MVM', linha2: 'CREATORS', sub: 'TIKTOK SHOP', tres: true, som: 'pro_logo'},
		];
		return cenas;
	},
};
