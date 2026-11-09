import type {Cena, EfeitoCamera, Edit} from '../../motor/plano';
import type {Busca, Trecho} from '../../motor/palavras';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// 2-entre, vídeo 1 de 2 (tema Entrevista): Danilow com a Laura no kartódromo (MVM). Mídia: IMG_3538 + IMG_3539 convertidas
// para 1440x2560 SDR 30 qps e emendadas em video.mp4 (este vídeo usa só a parte da Laura, 0–66,5 s; o 2-entre-2 usa o resto).
// Ordem: gancho (viral, 7 mi, R$ 15 mil) → a dica para quem está presa na CLT e não quer aparecer → rotina com IA → liberdade
// → CTA (Danilow, Laura e MVM) → cartão final. Saiu "Esse é o TikTok Shop... celular, internet".
// Rosto: y ≈ 0,40–0,50; Laura à direita.

const F = {
	laura1: ['Na primeira semana', 'deu super certo'],
	laura2: ['E hoje, quanto tempo', 'bom demais'],
	cta: ['Tem alguma dúvida', 'vamos pra cima'],
} as const;
const ini = (b: Busca, k: keyof typeof F) => b.say(F[k][0]).inicio;
const fim = (b: Busca, k: keyof typeof F) => b.say(F[k][1]).fim;

// Telas inteiras (o rosto não aparece): sem zoom de câmera dentro delas.
const cheias = (b: Busca): Trecho[] => [
	[0, b.say('que colocou').inicio - 0.05],
	[b.at('Fazendo') - 0.05, b.at('demais') + 0.6],
];

// Centro do zoom (posição do rosto de quem fala).
const centro = (b: Busca, t: number) => (t < b.say('Laura, qual').inicio ? {x: 0.5, y: 0.42} : t < ini(b, 'cta') ? {x: 0.62, y: 0.44} : {x: 0.55, y: 0.45});

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

export const p2Entre: Edit = {
	pasta: 'projetos/2-entre',
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
			[0.3, 54.86], // gancho, pergunta, resposta, rotina, liberdade (até "bom demais")
			[59.06, 65.84], // CTA (cita Danilow, Laura e MVM)
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
			{palavra: 'aparecer', estilo: 'serif'},
			{palavra: 'delegado', estilo: 'serif'},
		],
		falantes: (b) => [
			{de: b.say('Laura, qual').inicio - 0.05, ate: b.at('pessoas') + 0.4, nome: 'PERGUNTA'},
			{de: b.say('Eu também').inicio - 0.05, ate: fim(b, 'laura1') + 0.1, nome: 'LAURA'},
			{de: ini(b, 'laura2') - 0.05, ate: b.say('Eu trabalho').inicio - 0.05, nome: 'PERGUNTA'},
			{de: b.say('Eu trabalho').inicio - 0.05, ate: b.at('Boa') - 0.05, nome: 'LAURA'},
			{de: b.at('Boa') - 0.05, ate: b.at('Fazendo') - 0.05, nome: 'PERGUNTA'},
		],
	},
	camera: (b) => [
		...punches(b),
		{tipo: 'chicote', em: b.say('que colocou').inicio},
		{tipo: 'flash', em: b.at('praia') - 0.04},
		{tipo: 'chicote', em: ini(b, 'cta')},
	],
	cenas: (b) => {
		const fimFala = fim(b, 'cta');
		const cenas: Cena[] = [
			// ── LAURA ──────────────────────────────────────────────────────────────
			// 1. Gancho: card de vídeo viral com o contador de visualizações correndo até 7 milhões
			{
				tipo: 'peca',
				nome: 'e2Viral',
				de: 0,
				ate: b.say('que colocou').inicio - 0.05,
				modo: 'cheia',
				esconderLegenda: true,
				som: 'pro_whoosh',
				dados: {marcos: [b.at('primeira'), b.at('viral'), b.at('visualizações')]},
				sons: [{em: b.at('visualizações'), som: 'pro_pop', ganho: 0.8}],
			},
			// 2. R$ 15 mil no bolso dela, em ouro 3D acima das cabeças
			{
				tipo: 'numero3d',
				de: b.say('que colocou').inicio - 0.05,
				ate: b.at('tô') - 0.05,
				texto: 'R$ 15 MIL',
				rotulo: 'NO BOLSO DELA',
				em: b.at('15'),
				y: 400,
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [{em: b.at('15'), som: 'pro_pop', ganho: 0.7}],
			},
			{tipo: 'pilula', de: b.at('tô') - 0.05, ate: b.at('Laura', 2) - 0.05, rotulo: 'CONVIDADA', nome: 'LAURA', esconderLegenda: true, som: 'pro_tick'},
			// 3. "presa no CLT": carteira de trabalho com grades e cadeado
			{
				tipo: 'presoClt',
				de: b.at('mulher') - 0.1,
				ate: b.at('aparecer') - 0.05,
				em: b.at('presa'),
				emCadeado: b.at('CLT'),
				som: 'pro_pouso',
			},
			// 4. "não quer aparecer": silhueta escondida atrás do celular, câmera riscada
			{
				tipo: 'peca',
				nome: 'e2SemRosto',
				de: b.at('aparecer') - 0.05,
				ate: b.say('O que você tem a dizer').inicio - 0.05,
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
				dados: {marcos: [b.at('aparecer') + 0.15]},
			},
			{tipo: 'peca', nome: 'v14Interroga', de: b.say('O que você tem a dizer').inicio - 0.05, ate: b.at('pessoas') + 0.45, som: 'pro_whoosh_curto'},
			// 5. "coisas do nicho do meu dia a dia"
			{
				tipo: 'chips',
				de: b.at('nicho') - 0.1,
				ate: b.at('então') - 0.05,
				itens: [{texto: 'NICHO DO DIA A DIA', em: b.at('nicho')}],
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
			},
			// 6. Beleza → skincare → produtos em casa: um objeto 3D por ideia
			{
				tipo: 'peca',
				nome: 'e2Nicho',
				de: b.at('beleza') - 0.1,
				ate: b.say('E um dos produtos').inicio - 0.05,
				esconderLegenda: true,
				som: 'pro_swipe',
				dados: {
					itens: [
						{texto: 'BELEZA', em: b.at('beleza')},
						{texto: 'SKINCARE', em: b.at('skincare')},
						{texto: 'PRODUTOS EM CASA', em: b.say('monte de produto').inicio},
					],
				},
				sons: [
					{em: b.at('skincare'), som: 'pro_pop', ganho: 0.5},
					{em: b.say('monte de produto').inicio, som: 'pro_pouso', ganho: 0.5},
				],
			},
			// 7. O produto do TikTok que ela tinha em casa: os cards se encaixam e "deu super certo"
			{
				tipo: 'peca',
				nome: 'e2Match',
				de: b.say('E um dos produtos').inicio,
				ate: fim(b, 'laura1') + 0.3,
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
				dados: {marcos: [b.at('TikTok', 2), b.say('em casa', 2).inicio, b.at('super')]},
				sons: [
					{em: b.say('em casa', 2).inicio, som: 'pro_pouso', ganho: 0.6},
					{em: b.at('super'), som: 'pro_pop', ganho: 0.7},
				],
			},
			// 8. Rotina: relógio e a barra do dia (grava de manhã, edita à tarde, metade com IA)
			{
				tipo: 'peca',
				nome: 'e2Dia',
				de: b.say('quanto tempo por dia').inicio - 0.1,
				ate: b.at('Boa') - 0.1,
				esconderLegenda: true,
				som: 'pro_tick',
				dados: {
					marcos: [b.at('quanto')],
					itens: [
						{texto: 'GRAVA DE MANHÃ', em: b.at('gravo')},
						{texto: 'EDITA À TARDE', em: b.at('edito')},
						{texto: 'METADE COM IA', em: b.at('metade')},
					],
				},
				sons: [
					{em: b.at('gravo'), som: 'pro_swipe', ganho: 0.5},
					{em: b.at('edito'), som: 'pro_swipe', ganho: 0.5},
					{em: b.at('metade'), som: 'pro_robo', ganho: 0.5},
				],
			},
			// 9. Sem busão, sem chefe chato: riscados; da sua casa em ouro
			{
				tipo: 'peca',
				nome: 'e2Riscos',
				de: b.at('Boa'),
				ate: Math.min(b.say('própria casa').fim + 0.3, b.at('Fazendo') - 0.1),
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
				dados: {
					itens: [
						{texto: 'BUSÃO', em: b.at('busão')},
						{texto: 'CHEFE CHATO', em: b.at('chefe')},
						{texto: 'DA SUA CASA', em: b.at('própria')},
					],
				},
				sons: [
					{em: b.at('chefe'), som: 'pro_swipe', ganho: 0.5},
					{em: b.at('própria'), som: 'pro_pouso', ganho: 0.6},
				],
			},
			// 10. Meu horário e a praia: sol nascendo atrás das ondas
			{
				tipo: 'peca',
				nome: 'e2Praia',
				de: b.at('Fazendo') - 0.05,
				ate: b.at('demais') + 0.6,
				modo: 'cheia',
				esconderLegenda: true,
				som: 'pro_whoosh',
				dados: {itens: [{texto: 'MEU HORÁRIO', em: b.at('horário')}, {texto: 'PRAIA', em: b.at('praia')}]},
				sons: [{em: b.at('praia'), som: 'pro_pop', ganho: 0.6}],
			},
			// ── CTA ───────────────────────────────────────────────────────────────
			{
				tipo: 'comentario',
				de: ini(b, 'cta') - 0.05,
				ate: b.say('Já segue o Danilow').inicio - 0.05,
				texto: 'Tenho uma dúvida...',
				y: 1060,
				som: 'pro_digita',
			},
			{
				tipo: 'siga',
				de: b.say('Já segue o Danilow').inicio - 0.05,
				ate: fimFala + 0.3,
				itens: [
					{texto: 'DANILOW', em: b.at('Danilow')},
					{texto: 'LAURA', em: b.at('Laura', 3)},
					{texto: 'MVM', em: b.say('perfil do MVM').inicio + 0.3},
				],
				y: 1040,
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [
					{em: b.at('Laura', 3), som: 'pro_swipe', ganho: 0.6},
					{em: b.say('perfil do MVM').inicio + 0.3, som: 'pro_swipe', ganho: 0.6},
				],
			},
			{tipo: 'final', de: fimFala + 0.35, ate: fimFala + 2.8, marca: 'MVM', linha2: 'CREATORS', sub: 'TIKTOK SHOP', tres: true, som: 'pro_logo'},
		];
		return cenas;
	},
};
