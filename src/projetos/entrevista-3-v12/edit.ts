import type {EfeitoCamera, Edit} from '../../motor/plano';
import type {Busca, Trecho} from '../../motor/palavras';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// Entrevista 3, vídeo 12 (tema Entrevista): Danilow entrevista a Marci, ex-farmacêutica que hoje vive do TikTok Shop.
// Fonte 12.MOV (4K HDR do iPhone) convertida para 1440x2560 SDR 30 qps (scripts/converter-entrevista-3.sh).
// Roteiro (sem limite de tempo; revisão do usuário de 30/10): gancho "salário de 30 dias em 1 dia" (calendário 3D que
// despenca de 30 para 1) → apresentação (ex-farmacêutica, faz vídeo e live) → pergunta inteira (CLT, corrida dos ratos,
// compensa?) → resposta inteira (melhor época, recente no Brasil, onda azul, método certo, pessoas, método Danilow,
// produto, timing, mesmo salário em poucas horas) → "começa hoje" → CTA (dúvida, siga Danilow, Marci, MVM) → cartão final.
// Fica de fora só o que não é informação: "Olha só" (quase sem voz), "Método M4... Método Canto com Live" (Whisper
// confuso), o "tá?" depois de "começa hoje" e "Obrigado, Adi".
// Bordas conferidas pela energia do áudio (banda de voz, janelas de 50 ms): cada uma cai numa queda entre palavras.
const P = {x: 0.5, y: 0.38};

const TRECHOS: Trecho[] = [
	[47.77, 50.92], // gancho: "se você quer ganhar o seu salário de 30 dias e apenas um dia"
	[0, 15.68], // apresentação + pergunta inteira
	[16.38, 43.97], // resposta inteira, até "nem um dia."
	[51.1, 52.88], // "não demora muito tempo não, começa hoje"
	[53.36, 60.85], // CTA até "tem mudado vidas."
];

// Ritmo frenético (evento a cada 0,3–0,6 s): punch-in nas palavras, ciclo médio → close → aberto, até 1,3.
const ESCALAS = [1.1, 1.2, 1.28, 1.14, 1.24, 1.06];
const punches = (b: Busca, frase: string, passo = 0.5): EfeitoCamera[] => {
	const lista: EfeitoCamera[] = [];
	let ultimo = -9;
	for (const t of b.tempos(frase)) {
		if (t - ultimo < passo) continue;
		lista.push({tipo: 'zoom', em: t, escala: ESCALAS[lista.length % ESCALAS.length], ...P});
		ultimo = t;
	}
	return lista;
};

export const entrevista3V12: Edit = {
	pasta: 'projetos/entrevista-3-v12',
	video: 'video.mp4',
	formato: 'vertical',
	verificarCurva: false,
	regraCamera: false,
	extraFim: 2.4,
	silencios: silencios as Trecho[],
	transcricao,
	trechos: () => {
		// Tira as pausas medidas que caem dentro de um trecho, com 0,04 s de ar de cada lado.
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
			{palavra: 'época', estilo: 'serif'},
			{palavra: 'recente,', estilo: 'serif'},
			{palavra: 'lives,', estilo: 'serif'},
			{palavra: 'vidas.', estilo: 'serif'},
		],
		falantes: (b) => [
			{de: b.say('Marci, qual que é a dica').inicio - 0.1, ate: b.say('compensa começar hoje no TikTok Shop').fim + 0.1, nome: 'PERGUNTA'},
			{de: b.say('compensa demais').inicio - 0.1, ate: b.say('em poucas horas, nem um dia').fim + 0.1, nome: 'MARCI'},
		],
	},
	camera: (b) => {
		const z = (em: number, escala: number): EfeitoCamera => ({tipo: 'zoom', em, escala, ...P});
		const umDia = b.say('apenas um dia').fim;
		return [
			// Gancho: o calendário despenca e trava no 1 com clarão
			z(0, 1.12),
			z(b.at('salário'), 1.2),
			z(b.at('30'), 1.28),
			{tipo: 'flash', em: umDia - 0.19},
			z(umDia - 0.15, 1.08),
			{tipo: 'chicote', em: b.say('Ex-farmacêutica').inicio},
			...punches(b, 'Ex-farmacêutica, hoje vivo do TikTok Shop, tô aqui com a Marci, faz vídeo, faz live'),
			{tipo: 'chicote', em: b.say('Marci, qual que é a dica').inicio},
			z(b.say('Marci, qual que é a dica').inicio, 1),
			z(b.at('pessoa'), 1.12),
			z(b.at('Corrida'), 1.2),
			z(b.at('Ratos'), 1.06),
			z(b.say('Como que essa pessoa').inicio, 1.14),
			z(b.at('compensa'), 1.24),
			z(b.at('hoje', 2), 1.1),
			{tipo: 'chicote', em: b.say('compensa demais').inicio},
			...punches(b, 'compensa demais, a gente tá vivendo a melhor época pra você começar no digital e começar no TikTok', 0.55),
			...punches(b, 'porque o TikTok Shop aqui no Brasil é recente', 0.55),
			...punches(b, 'E o que eu falo é, você precisa investir em um método certo, pessoas confiáveis e o método Danilo é o melhor método pra você começar', 0.55),
			...punches(b, 'se você quer fazer de cara lives, escolhendo o produto certo, escolhendo o timing', 0.55),
			{tipo: 'chicote', em: b.say('não demora muito tempo').inicio},
			z(b.say('não demora muito tempo').inicio, 1),
			{tipo: 'flash', em: b.at('começa') - 0.04},
			z(b.at('começa'), 1.25),
			{tipo: 'chicote', em: b.say('Tá com alguma dúvida').inicio},
			z(b.say('Tá com alguma dúvida').inicio, 1),
			z(b.at('comentários,'), 1.15),
			z(b.say('já segue aqui o Danilo').inicio, 1.08),
			z(b.at('MVM,'), 1.2),
			z(b.at('mudado'), 1.28),
		];
	},
	cenas: (b) => {
		const fimFala = b.say('tem mudado vidas').fim;
		const umDia = b.say('apenas um dia').fim;
		const marci = b.tempos('já segue a Marci')[3];
		return [
			// 1. Gancho: calendário 3D com 30 folhas que despencam até o 1, e "1 DIA" em ouro 3D saltando dele
			{
				tipo: 'peca',
				nome: 'v12Calendario',
				de: 0,
				ate: umDia + 0.75,
				dados: {salario: b.at('salário'), trinta: b.at('30'), um: umDia - 0.15, texto: 'O SALÁRIO DE 30 DIAS EM 1 DIA'},
				esconderLegenda: true,
				som: 'pro_whoosh',
				sons: [
					{em: b.at('30'), som: 'pro_tick', ganho: 0.8},
					{em: b.at('30') + 0.35, som: 'pro_tick', ganho: 0.6},
					{em: umDia - 0.15, som: 'pro_pop', ganho: 0.9},
				],
			},
			// 2. Apresentação: ex-farmacêutica, a Marci
			{
				tipo: 'chips',
				de: umDia + 0.8,
				ate: b.at('tô') - 0.1,
				itens: [
					{texto: 'EX-FARMACÊUTICA', em: umDia + 0.85},
					{texto: 'VIVE DO TIKTOK SHOP', em: b.at('vivo')},
				],
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
				sons: [{em: b.at('vivo'), som: 'pro_tick', ganho: 0.8}],
			},
			{
				tipo: 'pilula',
				de: b.at('tô') - 0.05,
				ate: b.at('faz') - 0.12,
				rotulo: 'COM A',
				nome: 'Marci',
				y: 1080,
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			// 3. "faz vídeo, faz live": claquete 3D que bate no "vídeo" e celular 3D com a live no "live"
			{
				tipo: 'peca',
				nome: 'v12VideoLive',
				de: b.at('faz') - 0.1,
				ate: b.at('live') + 0.75,
				dados: {video: b.at('vídeo'), live: b.at('live')},
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
				sons: [
					{em: b.at('vídeo'), som: 'pro_tick', ganho: 0.9},
					{em: b.at('live'), som: 'pro_pop', ganho: 0.7},
				],
			},
			// 4. Pergunta: travada no CLT (carteira, grades e cadeado); a corrida dos ratos fica na legenda
			{
				tipo: 'presoClt',
				de: b.at('travada') - 0.1,
				ate: b.say('aqui na Corrida').inicio - 0.05,
				em: b.at('travada'),
				emCadeado: b.at('CLT,'),
				texto: 'TRAVADA NA',
				destaque: 'CLT',
				som: 'pro_pouso',
			},
			{
				tipo: 'selo',
				de: b.at('compensa') - 0.1,
				ate: b.say('compensa começar hoje no TikTok Shop').fim + 0.6,
				texto: 'COMPENSA COMEÇAR?',
				chip: 'HOJE',
				emChip: b.at('hoje', 2),
				y: 330,
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			// 5. Resposta: compensa demais, a melhor época
			{
				tipo: 'chips',
				de: b.say('compensa demais').inicio - 0.05,
				ate: b.at('época') + 0.8,
				itens: [
					{texto: 'COMPENSA DEMAIS', em: b.say('compensa demais').inicio},
					{texto: 'A MELHOR ÉPOCA', em: b.at('melhor')},
				],
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
				sons: [{em: b.at('melhor'), som: 'pro_tick', ganho: 0.8}],
			},
			// 6. TikTok Shop recente no Brasil: selo acima da cabeça
			{
				tipo: 'selo',
				de: b.at('Brasil') - 0.1,
				ate: b.at('grande') - 0.35,
				texto: 'RECENTE NO BRASIL',
				chip: 'TIKTOK SHOP',
				emChip: b.at('recente,'),
				y: 330,
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			// 7. A grande onda azul: onda 3D em tela inteira, uma prancha surfando e depois várias ("todo mundo")
			{
				tipo: 'peca',
				nome: 'v12OndaAzul',
				modo: 'cheia',
				de: b.at('grande') - 0.3,
				ate: b.say('você precisa investir').inicio - 0.05,
				dados: {grande: b.at('grande'), onda: b.at('onda'), todo: b.at('todo'), surfando: b.at('surfando')},
				esconderLegenda: true,
				som: 'pro_whoosh',
				sons: [{em: b.at('todo'), som: 'pro_swipe', ganho: 0.6}],
			},
			// 8. O caminho: cartas 3D em leque (3 + 2, para caber na tela), com a carta do método Danilow
			{
				tipo: 'cards3d',
				de: b.at('método') - 0.1,
				ate: b.at('produto') - 0.1,
				itens: [
					{texto: 'MÉTODO CERTO', em: b.at('método')},
					{texto: 'PESSOAS CONFIÁVEIS', em: b.at('pessoas')},
					{texto: 'MÉTODO DANILOW', em: b.tempos('o método Danilo')[1]},
				],
				y: 1010,
				som: 'pro_pouso',
				sons: [
					{em: b.at('pessoas'), som: 'pro_pouso', ganho: 0.8},
					{em: b.tempos('o método Danilo')[1], som: 'pro_pouso', ganho: 0.8},
				],
			},
			{
				tipo: 'cards3d',
				de: b.at('produto') - 0.05,
				ate: b.at('timing.') + 0.65,
				itens: [
					{texto: 'PRODUTO CERTO', em: b.at('produto')},
					{texto: 'TIMING', em: b.at('timing.')},
				],
				inicio: 4,
				y: 1010,
				som: 'pro_pouso',
				sons: [{em: b.at('timing.'), som: 'pro_pouso', ganho: 0.8}],
			},
			// 9. O mesmo salário: farmacêutica (30 dias) × TikTok Shop (poucas horas), com relógio 3D disparado
			{
				tipo: 'peca',
				nome: 'v12Salario',
				modo: 'cheia',
				de: b.at('timing.') + 0.65,
				ate: b.at('nem') + 0.65,
				dados: {salario: b.tempos('o meu salário de farmacêutica')[2], farmaceutica: b.tempos('o meu salário de farmacêutica')[4], poucas: b.at('poucas'), nem: b.at('nem')},
				esconderLegenda: true,
				som: 'pro_whoosh',
				sons: [
					{em: b.at('poucas'), som: 'pro_pop', ganho: 0.7},
					{em: b.at('nem'), som: 'pro_pouso', ganho: 0.7},
				],
			},
			// 10. Síntese: começa hoje
			{
				tipo: 'frase',
				de: b.at('nem') + 0.67,
				ate: b.at('começa') + 0.65,
				palavras: [
					{texto: 'NÃO DEMORA', em: b.say('não demora muito tempo').inicio},
					{texto: 'COMEÇA HOJE', em: b.at('começa'), destaque: true},
				],
				som: 'pro_frase',
			},
			// 11. CTA: caixa de comentário e siga cada um
			{
				tipo: 'comentario',
				de: b.at('começa') + 0.67,
				ate: b.say('já segue aqui o Danilo').inicio - 0.08,
				texto: 'Tenho uma dúvida...',
				y: 1060,
				som: 'pro_digita',
			},
			{
				tipo: 'siga',
				de: b.say('já segue aqui o Danilo').inicio - 0.05,
				ate: b.at('MVM,') + 0.75,
				itens: [
					{texto: 'DANILOW', em: b.tempos('já segue aqui o Danilo')[4]},
					{texto: 'MARCI', em: marci},
					{texto: 'MVM', em: b.at('MVM,')},
				],
				y: 1040,
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [
					{em: marci, som: 'pro_swipe', ganho: 0.7},
					{em: b.at('MVM,'), som: 'pro_swipe', ganho: 0.7},
				],
			},
			// 12. Cartão final
			{tipo: 'final', de: fimFala + 0.1, ate: fimFala + 2.4, marca: 'MVM', linha2: 'CREATORS', sub: 'O TIKTOK SHOP MUDA VIDAS', tres: true, som: 'pro_logo'},
		];
	},
};
