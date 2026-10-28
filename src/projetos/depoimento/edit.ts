import type {Edit} from '../../motor/plano';
import type {Trecho} from '../../motor/palavras';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// Depoimento de aluna da mentoria (tema Depoimentos), gravado no celular, uma fala só (576x1024, 60 s).
// Roteiro (falas reordenadas): gancho "arrisca, vai ser a melhor decisão" → gratidão (Felipe, Danilow e Matheus fizeram
// diferença; o usuário pediu esse trecho logo depois do gancho) → dúvida (mais uma mentoria?) → dor (batendo cabeça com
// produto) → o que aprendeu (escolher, analisar, testar) → resultado (escolha bem feita, diferença até hoje na operação) → agradecimento → cartão final.
// Rosto em x .55 y .45; céu livre no topo. Blusa azul: ouro tem contraste. A fonte era 576 de largura: o video.mp4 agora
// é 1080x1920 (Real-ESRGAN animevideov3 2x misturado 60/40 com o original; o original fica em video-576.mp4). Zoom curto (≤ 1,15).
const P = {x: 0.55, y: 0.45};

export const depoimento: Edit = {
	pasta: 'projetos/depoimento',
	video: 'video.mp4',
	formato: 'vertical',
	verificarCurva: false,
	regraCamera: false,
	barraProgresso: true,
	extraFim: 2.6,
	silencios: silencios as Trecho[],
	transcricao,
	// Bordas numéricas, cada uma no ponto mais baixo de energia perto da palavra, conferidas com o Whisper palavra por palavra
	// num recorte do áudio: o vento deixa poucas pausas no silencios.json e o Whisper do projeto erra até 0,4 s aqui
	// ("tomar" acaba em 36,22, não em 36,0). Lição, resultado e agradecimento são contínuos na gravação (36,31–54,8):
	// o gancho termina exatamente onde a lição começa.
	trechos: () => [
		[32.06, 36.31], // arrisca, arrisca porque vai ser a melhor decisão que vocês vão tomar
		[4.25, 16.86], // muito grata... Felipe, Danilo, o Matheus... na mentoria deles (pedido: logo depois do gancho)
		[17.32, 22.75], // às vezes a gente fica pensando... mais uma mentoria, gente
		[23.53, 29.6], // pra você que não entende sobre live... qualquer produto
		[36.31, 54.8], // vocês vão entender mais sobre escolha de produto... muito obrigada pela ajuda
	],
	legenda: {
		estilo: 'mare',
		altura: 0.656,
		palavrasPorTela: 4,
		enfase: [
			{palavra: 'pensando', estilo: 'serif'},
			{palavra: 'cabeça', estilo: 'serif'},
			{palavra: 'grata', estilo: 'serif'},
			{palavra: 'entender', estilo: 'serif'},
			{palavra: 'feita', estilo: 'serif'},
		],
	},
	camera: (b) => {
		// Modo frenético: um punch a cada ~0,4 s, alternando três níveis curtos (a fonte é 576 de largura).
		// Nas emendas o zoom troca de nível no quadro exato do corte.
		const niveis = [1.0, 1.08, 1.15];
		const marcos: number[] = [];
		for (const p of b.palavras) {
			if (!marcos.length || p.inicio - marcos[marcos.length - 1] >= 0.4) marcos.push(p.inicio);
		}
		const ritmo = marcos
			.filter((t) => b.emendas.every((e) => Math.abs(t - e) > 0.2))
			.map((t, i) => ({tipo: 'zoom' as const, em: t, escala: niveis[i % niveis.length], suave: 0.12, ...P}));
		const emendas = b.emendas.map((e, i) => ({tipo: 'zoom' as const, em: e, escala: niveis[(i + 1) % niveis.length], ...P}));
		const duvida = b.say('Às vezes a gente').inicio;
		const virada = b.say('muito grata').inicio;
		const licao = b.say('vocês vão entender mais').inicio;
		return [
			{tipo: 'zoom', em: 0, escala: 1.12, ...P},
			...ritmo,
			...emendas,
			// Trocas de assunto: chicote na dúvida e na lição; clarão só na decisão e na virada.
			{tipo: 'flash', em: b.at('melhor') - 0.04},
			{tipo: 'chicote', em: duvida},
			{tipo: 'flash', em: virada},
			{tipo: 'chicote', em: licao},
			{tipo: 'foco', em: b.say('Então meninos').inicio},
		];
	},
	cenas: (b) => {
		const fimFala = b.say('pela ajuda').fim;
		const nomes = b.say('como Felipe');
		const passos = [b.at('escolha'), b.at('analisar'), b.at('testar')];
		return [
			// 1. Gancho: ARRISCA → A MELHOR DECISÃO
			{tipo: 'selo', de: 0, ate: b.at('porque') - 0.05, texto: 'ARRISCA', y: 420, esconderLegenda: true, som: 'swish'},
			{
				tipo: 'frase',
				de: b.at('melhor') - 0.12,
				ate: b.say('vocês vão tomar').fim + 0.1,
				palavras: [
					{texto: 'A MELHOR', em: b.at('melhor') - 0.1},
					{texto: 'DECISÃO', em: b.at('decisão'), destaque: true},
				],
				som: 'whoosh',
			},
			// 2. A dúvida: o pensamento digitado numa caixa de comentário
			{tipo: 'comentario', de: b.at('pensando'), ate: b.say('mais uma mentoria gente').fim + 0.05, texto: 'mais uma mentoria? 🤔', y: 470, esconderLegenda: true},
			// 3. Dor: batendo cabeça com produto
			{
				tipo: 'frase',
				dor: true,
				de: b.at('batendo') - 0.08,
				// Duração ajustada pelo usuário no painel: termina em "com produto", antes de "qualquer produto".
				ate: b.at('qualquer') - 0.12,
				palavras: [
					{texto: 'BATENDO', em: b.at('batendo')},
					{texto: 'CABEÇA', em: b.at('cabeça'), destaque: true},
					{texto: 'COM PRODUTO', em: b.say('aí com produto').inicio + 0.2},
				],
				som: 'grave',
			},
			// 4. Virada: quem ajudou, um nome por vez
			{
				tipo: 'chips',
				de: nomes.inicio - 0.05,
				ate: b.at('foram') - 0.05,
				itens: [
					{texto: 'FELIPE', em: b.at('Felipe')},
					{texto: 'DANILOW', em: b.at('Danilo')},
					{texto: 'MATHEUS', em: b.at('Matheus')},
				],
				y: 420,
				esconderLegenda: true,
				som: 'tick',
			},
			{
				tipo: 'frase',
				de: b.at('muita') - 0.1,
				ate: b.at('diferença') + 0.9,
				palavras: [
					{texto: 'MUITA', em: b.at('muita')},
					{texto: 'DIFERENÇA', em: b.at('diferença'), destaque: true},
				],
				som: 'whoosh',
			},
			{tipo: 'selo', de: b.say('entrei na mentoria').inicio, ate: b.say('na mentoria deles').fim + 0.1, texto: 'MENTORIA', y: 420, esconderLegenda: true, som: 'swish'},
			// 5. O que aprendeu: um passo por vez, numerado
			{
				tipo: 'chips',
				de: passos[0] - 0.05,
				ate: b.say('aquele produto').fim + 0.1,
				itens: [
					{texto: 'ESCOLHER O PRODUTO', em: passos[0]},
					{texto: 'ANALISAR O PRODUTO', em: passos[1]},
					{texto: 'QUANDO TESTAR', em: passos[2]},
				],
				numerado: true,
				y: 420,
				esconderLegenda: true,
				som: 'tick',
			},
			// 6. Resultado: a operação de live dela hoje
			{tipo: 'selo', de: b.at('bem') - 0.05, ate: b.at('feita') + 0.6, texto: 'BEM FEITA', y: 420, esconderLegenda: true, som: 'swish'},
			{
				tipo: 'live',
				de: b.say('total diferença').inicio - 0.05,
				ate: b.say('hoje na minha operação').fim + 0.1,
				curtidas: '8,4 mil curtidas',
				espectadores: '1,2 mil',
				comentarios: [
					{nome: 'Ana', texto: 'quero esse!'},
					{nome: 'Lu', texto: 'comprei 🔥'},
				],
				som: 'whoosh',
			},
			// 7. Agradecimento e cartão final
			{
				tipo: 'frase',
				de: b.at('obrigada') - 0.1,
				ate: fimFala + 0.1,
				palavras: [
					{texto: 'MUITO', em: b.at('obrigada') - 0.08},
					{texto: 'OBRIGADA', em: b.at('obrigada'), destaque: true},
				],
				som: 'whoosh',
			},
			{tipo: 'final', de: fimFala + 0.1, ate: fimFala + 2.6, marca: 'Danilow', sub: 'LIVE SHOP', som: 'whoosh'},
		];
	},
};
