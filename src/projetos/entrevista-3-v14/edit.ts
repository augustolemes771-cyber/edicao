import type {Cena, EfeitoCamera, Edit} from '../../motor/plano';
import type {Busca, Trecho} from '../../motor/palavras';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// Entrevista 3, vídeo 14 (tema Entrevista): Danilow com o Rogério no evento da MVM em Floripa, sobre investir em conhecimento.
// Fonte 14.MOV (4K HDR do iPhone) convertida para 1440x2560 SDR 30 qps (scripts/converter-entrevista-3.sh).
// Revisão de 30/10 ("nada de novo, texto saindo da tela, cortes mal feitos"): sem limite de tempo, a fala do Rogério vai
// inteira, e quase tudo é peça própria (pecas.tsx): pergunta com interrogação 3D → contador R$ 50 MIL com moedas → pino em
// Floripa → escada 20/30/40 mil até o próximo nível → interrogação → pegadas "um passo" → rota A → B → três placas →
// estrada com buracos e linha-guia → "o mentor já errou antes" → termômetro → rede de pessoas → bateria da ambição →
// calendário de 1 ano → escada MVM/mentores → mente que sai da caixa e não volta → CTA → cartão final.
// Pausas: medidas pela energia com limiar fixo de −44 dB (o Rogério fala mais baixo que o Danilow, que está de lapela: um
// limiar relativo cortava fala dele); as palavras que o Whisper pôs dentro dessas pausas foram empurradas para a borda.
// Posição dos rostos pelos quadros: convidado à esquerda/centro, y ≈ 0,4.
const P = {x: 0.45, y: 0.4};

const F = {
	gancho: ['quanto você já investiu em conhecimento', 'Mais de 50 mil'],
	abertura: ['Estamos aqui em Floripa', 'vivem do TikTok Shop'],
	porque: ['Por que você faria', 'tipo de investimento'],
	resposta: ['Cara, primeiramente', 'Faz um ano'],
	fecho: ['É isso, pessoal', 'deixe nos comentários'],
} as const;
const ini = (b: Busca, k: keyof typeof F) => b.say(F[k][0]).inicio;
const fim = (b: Busca, k: keyof typeof F) => b.say(F[k][1]).fim;

// Janelas de tela inteira (o rosto não aparece): sem zoom de câmera dentro delas.
const cheias = (b: Busca): Trecho[] => [
	[0, b.at('Mais') - 0.05],
	[b.at('próximo', 2) - 0.1, b.say('dar um passo').fim + 0.45],
	[b.at('quer') - 0.1, b.at('Investe') + 0.85],
	[b.say('você ter um direcionamento').inicio - 0.05, b.at('maior') + 0.75],
	[b.at('expandir') - 0.35, b.say('volta ao normal novamente').fim + 0.2],
];

// Ritmo: punch-in a cada ~0,6 s fora das telas inteiras, ciclo médio → close → aberto, até 1,28.
const ESCALAS = [1.08, 1.18, 1.26, 1.12, 1.22, 1.04];
const punches = (b: Busca): EfeitoCamera[] => {
	const fora = cheias(b);
	const lista: EfeitoCamera[] = [];
	let ultimo = -9;
	for (const p of b.palavras) {
		if (p.inicio - ultimo < 0.6 || fora.some(([a, z]) => p.inicio > a - 0.1 && p.inicio < z + 0.1)) continue;
		lista.push({tipo: 'zoom', em: p.inicio, escala: ESCALAS[lista.length % ESCALAS.length], ...P});
		ultimo = p.inicio;
	}
	return lista;
};

export const entrevista3V14: Edit = {
	pasta: 'projetos/entrevista-3-v14',
	video: 'video.mp4',
	formato: 'vertical',
	verificarCurva: false,
	regraCamera: false,
	extraFim: 2.8,
	silencios: silencios as Trecho[],
	transcricao,
	trechos: (o) => {
		const lista: Trecho[] = (Object.keys(F) as (keyof typeof F)[]).map((k) => [o.say(F[k][0]).inicio - 0.06, o.say(F[k][1]).fim + 0.08]);
		// O gancho começa no meio da frase ("assim, quanto..."): a voz tem um vale em ~81,26 s, logo antes do "quanto".
		lista[0][0] = o.say(F.gancho[0]).inicio + 0.02;
		// Trechos colados ou sobrepostos no original (na ordem) viram um só: não repete palavra.
		for (let i = lista.length - 1; i > 0; i--) {
			const vao = lista[i][0] - lista[i - 1][1];
			if (vao < 0.4 && lista[i][0] > lista[i - 1][0]) lista.splice(i - 1, 2, [lista[i - 1][0], Math.max(lista[i][1], lista[i - 1][1])]);
		}
		// Tira as pausas medidas que caem dentro de um trecho, com 0,04 s de ar de cada lado.
		const cortado: Trecho[] = [];
		for (const [a, z] of lista) {
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
			{palavra: 'passo', estilo: 'serif'},
			{palavra: 'comprando', estilo: 'serif'},
			{palavra: 'evento', estilo: 'serif'},
		],
		falantes: (b) => [
			{de: b.at('Rogério', 2) - 0.05, ate: fim(b, 'abertura') + 0.1, nome: 'PERGUNTA'},
			{de: ini(b, 'porque') - 0.05, ate: fim(b, 'porque') + 0.1, nome: 'PERGUNTA'},
			{de: ini(b, 'resposta') - 0.05, ate: b.say('ambição renovada').fim + 0.1, nome: 'ROGÉRIO'},
			{de: b.say('Há quanto tempo').inicio - 0.05, ate: b.at('Faz') - 0.05, nome: 'PERGUNTA'},
		],
	},
	camera: (b) => [
		...punches(b),
		{tipo: 'chicote', em: b.at('Mais')},
		{tipo: 'flash', em: b.at('mentores') - 0.04},
		{tipo: 'chicote', em: ini(b, 'abertura')},
		{tipo: 'chicote', em: ini(b, 'porque')},
		{tipo: 'chicote', em: ini(b, 'resposta')},
		{tipo: 'chicote', em: ini(b, 'fecho')},
		{tipo: 'flash', em: b.say('não volta').inicio - 0.04},
	],
	cenas: (b) => {
		const fimFala = fim(b, 'fecho');
		const cenas: Cena[] = [
			// 1. Gancho: a pergunta numa tela inteira com interrogação de ouro girando
			{
				tipo: 'peca',
				nome: 'v14Pergunta',
				de: 0,
				ate: b.at('Mais') - 0.05,
				modo: 'cheia',
				esconderLegenda: true,
				som: 'pro_whoosh',
				dados: {
					linhas: [
						{texto: 'QUANTO VOCÊ', em: b.at('quanto') + 0.05, metal: 'branco'},
						{texto: 'JÁ INVESTIU', em: b.at('investiu'), metal: 'branco'},
						{texto: 'EM MENTORES?', em: b.at('mentores'), metal: 'ouro'},
					],
				},
				sons: [{em: b.at('mentores'), som: 'pro_pop', ganho: 0.7}],
			},
			// 2. A resposta: contador em ouro 3D com moedas caindo, trava com clarão no "mil"
			{
				tipo: 'peca',
				nome: 'v14Contador',
				de: b.at('Mais') - 0.05,
				ate: ini(b, 'abertura') + 0.75,
				esconderLegenda: true,
				som: 'pro_swipe',
				dados: {marcos: [b.at('Mais'), b.at('mil'), b.at('mil') + 0.1], valor: 50, prefixo: 'R$ ', sufixo: ' MIL', rotulo: 'EM CONHECIMENTO'},
				sons: [{em: b.at('mil'), som: 'pro_pop', ganho: 0.8}],
			},
			// 3. Floripa: pino de mapa 3D, a etiqueta troca com cada informação
			{
				tipo: 'peca',
				nome: 'v14Pino',
				de: b.at('Floripa') - 0.12,
				ate: b.say('Isso aqui é surreal').fim + 0.1,
				esconderLegenda: true,
				som: 'pro_pouso',
				dados: {
					itens: [
						{texto: 'FLORIPA', em: b.at('Floripa')},
						{texto: '2 ANOS DE MVM', em: b.at('dois')},
						{texto: 'R$ 500 MILHÕES', em: b.at('500')},
					],
				},
				sons: [{em: b.at('500'), som: 'pro_tick', ganho: 0.7}],
			},
			{tipo: 'pilula', de: b.at('Rogério') - 0.1, ate: b.at('para') - 0.1, rotulo: 'CONVIDADO', nome: 'ROGÉRIO', esconderLegenda: true, som: 'pro_tick'},
			// 4. Pergunta: escada 3D de 20, 30 e 40 mil até o próximo nível
			{
				tipo: 'peca',
				nome: 'v14Degraus',
				de: b.at('20') - 0.25,
				ate: fim(b, 'abertura') + 0.1,
				esconderLegenda: true,
				som: 'pro_pouso',
				dados: {
					passos: [
						{texto: 'R$ 20 MIL', em: b.at('20')},
						{texto: 'R$ 30 MIL', em: b.at('30')},
						{texto: 'R$ 40 MIL', em: b.at('40')},
					],
					topo: {texto: 'próximo nível', em: b.at('próximo')},
				},
				sons: [
					{em: b.at('30'), som: 'pro_pouso', ganho: 0.6},
					{em: b.at('40'), som: 'pro_pouso', ganho: 0.6},
					{em: b.at('próximo'), som: 'pro_pulso', ganho: 0.7},
				],
			},
			// 5. "Por que você faria esse tipo de investimento?": interrogação girando acima da cabeça
			{tipo: 'peca', nome: 'v14Interroga', de: ini(b, 'porque') - 0.05, ate: fim(b, 'porque') + 0.1, som: 'pro_whoosh_curto'},
			// 6. "Dar um passo, investir em você, em conhecimento": pegadas na grade e as frases em 3D
			{
				tipo: 'peca',
				nome: 'v14Pegadas',
				de: b.at('próximo', 2) - 0.1,
				ate: b.say('dar um passo').fim + 0.45,
				modo: 'cheia',
				esconderLegenda: true,
				som: 'pro_whoosh',
				dados: {
					marcos: [b.at('passo')],
					linhas: [
						{texto: 'PRÓXIMO NÍVEL', em: b.at('próximo', 2), metal: 'branco'},
						{texto: 'UM PASSO', em: b.at('passo'), metal: 'ouro'},
					],
				},
				sons: [{em: b.at('passo'), som: 'pro_pouso', ganho: 0.8}],
			},
			// 6b. "Investir em você, investir em conhecimento": seta de ouro apontando para o Rogério
			{
				tipo: 'peca',
				nome: 'v14Seta',
				de: b.say('dar um passo').fim + 0.45,
				ate: b.say('em conhecimento', 2).fim + 0.15,
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
				dados: {
					itens: [
						{texto: 'INVISTA EM VOCÊ', em: b.say('investir em você').inicio},
						{texto: 'EM CONHECIMENTO', em: b.at('conhecimento', 2)},
					],
				},
				sons: [{em: b.at('conhecimento', 2), som: 'pro_pop', ganho: 0.6}],
			},
			// 7. Ponto A → ponto B: rota no mapa e "INVESTE." em 3D
			{
				tipo: 'peca',
				nome: 'v14Rota',
				de: b.at('quer') - 0.1,
				ate: b.at('Investe') + 0.85,
				modo: 'cheia',
				esconderLegenda: true,
				som: 'pro_whoosh',
				dados: {marcos: [b.tempos('ponto A')[1], b.tempos('ponto B')[1], b.at('Investe')]},
				sons: [
					{em: b.tempos('ponto B')[1], som: 'pro_pouso', ganho: 0.7},
					{em: b.at('Investe'), som: 'pro_pop', ganho: 0.8},
				],
			},
			// 8. Conhecimento, pessoas, mentoria: três placas acima da cabeça
			{
				tipo: 'peca',
				nome: 'v14Tres',
				de: b.at('conhecimento', 3) - 0.15,
				ate: b.at('mentoria') + 0.9,
				esconderLegenda: true,
				som: 'pro_swipe',
				dados: {
					itens: [
						{texto: 'CONHECIMENTO', em: b.at('conhecimento', 3), icone: 'livro'},
						{texto: 'PESSOAS', em: b.say('outras pessoas').inicio + 0.1, icone: 'pessoas'},
						{texto: 'MENTORIA', em: b.at('mentoria'), icone: 'capelo'},
					],
				},
				sons: [
					{em: b.say('outras pessoas').inicio + 0.1, som: 'pro_swipe', ganho: 0.6},
					{em: b.at('mentoria'), som: 'pro_swipe', ganho: 0.6},
				],
			},
			// 9. "Para você não errar, ter um direcionamento maior": estrada com buracos e a linha-guia dourada
			{
				tipo: 'peca',
				nome: 'v14Caminho',
				de: b.say('você ter um direcionamento').inicio - 0.05,
				ate: b.at('maior') + 0.75,
				modo: 'cheia',
				esconderLegenda: true,
				som: 'pro_whoosh',
				dados: {marcos: [b.say('você ter um direcionamento').inicio, b.at('direcionamento')]},
				sons: [{em: b.at('direcionamento'), som: 'pro_pulso', ganho: 0.6}],
			},
			// 10. "O mentor já errou antes": os erros riscados um a um
			{
				tipo: 'peca',
				nome: 'v14Mentor',
				de: b.at('mentor') - 0.1,
				ate: b.say('já errou antes').fim + 0.45,
				esconderLegenda: true,
				som: 'pro_tick',
				dados: {marcos: [b.at('errou')]},
				sons: [{em: b.at('errou') + 0.2, som: 'pro_swipe', ganho: 0.5}],
			},
			// 11. Cabeça fervendo: termômetro que sobe e ferve
			{
				tipo: 'peca',
				nome: 'v14Termometro',
				de: b.say('a gente sai daqui com a cabeça').inicio - 0.05,
				ate: b.at('fervendo') + 0.95,
				esconderLegenda: true,
				som: 'pro_pulso',
				dados: {marcos: [b.at('fervendo')]},
			},
			// 12. Contato com pessoas: rede de avatares que se liga; "muda vidas" em ouro
			{
				tipo: 'peca',
				nome: 'v14Rede',
				de: b.at('contato') - 0.2,
				ate: Math.min(b.say('muda vidas').fim + 0.5, b.at('costumo') - 0.12),
				esconderLegenda: true,
				som: 'pro_swipe',
				dados: {marcos: [b.at('contato'), b.at('muda')]},
				sons: [{em: b.at('muda'), som: 'pro_pop', ganho: 0.7}],
			},
			// 13. Ambição renovada: bateria que recarrega
			{
				tipo: 'peca',
				nome: 'v14Bateria',
				de: b.at('costumo') - 0.1,
				ate: b.say('Há quanto tempo').inicio - 0.02,
				esconderLegenda: true,
				som: 'pro_tick',
				dados: {marcos: [b.at('ambição'), b.at('renovada')]},
				sons: [{em: b.at('renovada'), som: 'pro_pulso', ganho: 0.7}],
			},
			// 14. Um ano: calendário que vira os 12 meses
			{
				tipo: 'peca',
				nome: 'v14Calendario',
				de: b.say('Há quanto tempo').inicio,
				ate: b.say('Faz um ano').fim + 0.7,
				esconderLegenda: true,
				som: 'pro_swipe',
				dados: {marcos: [b.at('tempo'), b.tempos('Faz um ano')[2]]},
				sons: [{em: b.tempos('Faz um ano')[2], som: 'pro_pop', ganho: 0.7}],
			},
			// 15. Próximo nível de novo: a escada agora com o MVM e os mentores
			{
				tipo: 'peca',
				nome: 'v14Degraus',
				de: b.say('Se você quiser').inicio - 0.05,
				ate: b.at('expandir') - 0.37,
				esconderLegenda: true,
				som: 'pro_pouso',
				dados: {
					passos: [
						{texto: 'O MVM', em: b.at('MVM', 2)},
						{texto: 'MENTORES', em: b.at('mentores', 2)},
					],
					topo: {texto: 'próximo nível', em: b.at('próximo', 3)},
				},
				sons: [
					{em: b.at('MVM', 2), som: 'pro_pouso', ganho: 0.6},
					{em: b.at('mentores', 2), som: 'pro_pouso', ganho: 0.6},
				],
			},
			// 16. Mentalidade expandida: a esfera estoura a caixa e não volta ao normal
			{
				tipo: 'peca',
				nome: 'v14Mente',
				de: b.at('expandir') - 0.35,
				ate: b.say('volta ao normal novamente').fim + 0.2,
				modo: 'cheia',
				esconderLegenda: true,
				som: 'pro_whoosh',
				dados: {
					marcos: [b.at('expandir'), b.say('não volta').inicio],
					linhas: [
						{texto: 'NÃO VOLTA', em: b.say('não volta').inicio, metal: 'ouro'},
						{texto: 'AO NORMAL', em: b.at('normal'), metal: 'branco'},
					],
				},
				sons: [
					{em: b.at('expandir'), som: 'pro_quebra', ganho: 0.6},
					{em: b.at('normal'), som: 'pro_pop', ganho: 0.6},
				],
			},
			// 17. CTA: siga cada um e a caixa de comentário
			{
				tipo: 'siga',
				de: b.say('Já me siga').inicio - 0.05,
				ate: b.say('vamos para cima').fim + 0.1,
				itens: [
					{texto: 'DANILOW', em: b.at('Danilow')},
					{texto: 'ROGÉRIO', em: b.at('Rogério', 3)},
					{texto: 'MVM', em: b.at('MVM', 3)},
				],
				y: 1040,
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [
					{em: b.at('Rogério', 3), som: 'pro_swipe', ganho: 0.6},
					{em: b.at('MVM', 3), som: 'pro_swipe', ganho: 0.6},
				],
			},
			{
				tipo: 'comentario',
				de: b.say('Se tiver alguma dúvida').inicio - 0.05,
				ate: fimFala + 0.45,
				texto: 'Tenho uma dúvida...',
				y: 1060,
				som: 'pro_digita',
			},
			// 18. Cartão final
			{tipo: 'final', de: fimFala + 0.5, ate: fimFala + 2.8, marca: 'MVM', linha2: 'CREATORS', sub: 'EVENTO EM FLORIPA', tres: true, som: 'pro_logo'},
		];
		return cenas;
	},
};
