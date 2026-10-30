import type {EfeitoCamera, Edit} from '../../motor/plano';
import type {Busca, Trecho} from '../../motor/palavras';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// Entrevista 3, vídeo 12 (tema Entrevista): Danilow entrevista a Marci, ex-farmacêutica que hoje vive do TikTok Shop.
// Fonte 12.MOV (4K HDR do iPhone) convertida para 1440x2560 SDR 30 qps (scripts/converter-entrevista-3.sh).
// Roteiro: gancho "salário de 30 dias em 1 dia" → apresentação (ex-farmacêutica, faz vídeo e live) → pergunta (travada no
// CLT, compensa?) → melhor época, TikTok Shop recente, onda azul → método certo, pessoas confiáveis, produto e timing →
// salário de farmacêutica em poucas horas → "começa hoje" → CTA (dúvida, siga) → cartão final.
// Fica de fora: "Olha só", "Método M4... Método Canto com Live" (Whisper confuso) e "Obrigado, Adi".
// Posição do rosto sem medir: zoom no centro e no máximo 1,3; conferir no Studio.
const P = {x: 0.5, y: 0.3};

const F = {
	gancho: ['se você quer ganhar o seu salário', 'apenas um dia'],
	apresenta: ['Ex-farmacêutica', 'faz vídeo, faz live'],
	pergunta: ['qual que é a dica', 'travada no CLT'],
	pergunta2: ['se compensa começar hoje', 'no TikTok Shop'],
	resposta1: ['compensa demais', 'começar no digital'],
	resposta2: ['porque o TikTok Shop aqui no Brasil', 'surfando essa onda'],
	resposta3: ['você precisa investir em um método certo', 'pra você começar se'],
	resposta4: ['escolhendo o produto certo', 'escolhendo o timing'],
	resposta5: ['eu consigo tirar o meu salário', 'nem um dia'],
	sintese: ['não demora muito tempo', 'começa hoje'],
	duvida: ['Tá com alguma dúvida', 'Deixa nos comentários'],
	siga: ['já segue aqui o Danilo', 'tem mudado vidas'],
} as const;
const ini = (b: Busca, k: keyof typeof F) => b.say(F[k][0]).inicio;
const fim = (b: Busca, k: keyof typeof F) => b.say(F[k][1]).fim;

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
	trechos: (o) => {
		const lista: Trecho[] = (Object.keys(F) as (keyof typeof F)[]).map((k) => [o.say(F[k][0]).inicio - 0.06, o.say(F[k][1]).fim + 0.08]);
		// Trecho que começa dentro de outro já usado (a síntese logo depois do gancho, fora de ordem) começa no fim dele.
		for (let i = 0; i < lista.length; i++) {
			for (let j = 0; j < lista.length; j++) if (j !== i && lista[i][0] > lista[j][0] && lista[i][0] < lista[j][1]) lista[i][0] = lista[j][1];
		}
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
			{palavra: 'época', estilo: 'serif'},
			{palavra: 'recente,', estilo: 'serif'},
			{palavra: 'horas,', estilo: 'serif'},
		],
		falantes: (b) => [
			{de: ini(b, 'pergunta') - 0.1, ate: fim(b, 'pergunta2') + 0.1, nome: 'PERGUNTA'},
			{de: fim(b, 'pergunta2') + 0.1, ate: fim(b, 'resposta5') + 0.1, nome: 'MARCI'},
		],
	},
	camera: (b) => {
		const z = (em: number, escala: number): EfeitoCamera => ({tipo: 'zoom', em, escala, ...P});
		return [
			// Gancho: clarão na batida do 30
			z(0, 1.15),
			z(b.at('salário'), 1.22),
			{tipo: 'flash', em: b.at('30') - 0.04},
			z(b.at('30'), 1.28),
			z(b.at('apenas'), 1.1),
			z(b.at('dia,'), 1.26),
			{tipo: 'chicote', em: ini(b, 'apresenta')},
			...punches(b, 'Ex-farmacêutica, hoje vivo do TikTok Shop, tô aqui com a Marci, faz vídeo, faz live'),
			{tipo: 'chicote', em: ini(b, 'pergunta')},
			z(ini(b, 'pergunta'), 1),
			z(b.at('pessoa'), 1.12),
			z(b.at('compensa'), 1.06),
			z(b.at('hoje', 2), 1.16),
			{tipo: 'chicote', em: ini(b, 'resposta1')},
			...punches(b, 'compensa demais, a gente tá vivendo a melhor época pra você começar no digital', 0.55),
			...punches(b, 'porque o TikTok Shop aqui no Brasil é recente, então é uma', 0.55),
			...punches(b, 'você precisa investir em um método certo, pessoas confiáveis e o método Danilo é o melhor método pra você começar', 0.55),
			...punches(b, 'escolhendo o produto certo, escolhendo o timing', 0.55),
			...punches(b, 'eu consigo tirar o meu salário de farmacêutica que eu ganhava antigamente em poucas horas, nem um dia', 0.6),
			{tipo: 'chicote', em: ini(b, 'sintese')},
			z(ini(b, 'sintese'), 1),
			{tipo: 'flash', em: b.at('começa') - 0.04},
			z(b.at('começa'), 1.25),
			{tipo: 'chicote', em: ini(b, 'duvida')},
			z(ini(b, 'duvida'), 1),
			z(b.at('comentários,'), 1.15),
			z(ini(b, 'siga'), 1.08),
			z(b.at('MVM,'), 1.2),
			z(b.at('mudado'), 1.28),
		];
	},
	cenas: (b) => {
		const fimFala = fim(b, 'siga');
		return [
			// 1. Gancho: o salário do mês inteiro em um dia, em ouro 3D
			{
				tipo: 'numero3d',
				de: 0,
				ate: fim(b, 'gancho') + 0.05,
				texto: '30 DIAS',
				rotulo: 'O SALÁRIO DE',
				abaixo: 'EM 1 DIA',
				em: b.at('30') - 0.2,
				esconderLegenda: true,
				som: 'pro_pop',
			},
			// 2. Apresentação: ex-farmacêutica, a Marci, vídeo e live
			{
				tipo: 'chips',
				de: ini(b, 'apresenta') - 0.05,
				ate: b.at('tô') - 0.1,
				itens: [
					{texto: 'EX-FARMACÊUTICA', em: ini(b, 'apresenta')},
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
				ate: b.at('faz') - 0.1,
				rotulo: 'COM A',
				nome: 'Marci',
				y: 1080,
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			{
				tipo: 'chips',
				de: b.at('faz') - 0.05,
				ate: fim(b, 'apresenta') + 0.1,
				itens: [
					{texto: 'FAZ VÍDEO', em: b.at('faz')},
					{texto: 'FAZ LIVE', em: b.at('faz', 2)},
				],
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
				sons: [{em: b.at('faz', 2), som: 'pro_tick', ganho: 0.8}],
			},
			// 3. Pergunta: travada no CLT (carteira, grades e cadeado)
			{
				tipo: 'presoClt',
				de: b.at('travada') - 0.1,
				ate: fim(b, 'pergunta') + 0.1,
				em: b.at('travada'),
				emCadeado: b.at('CLT,'),
				texto: 'TRAVADA NA',
				destaque: 'CLT',
				som: 'pro_pouso',
			},
			// 4. Resposta: compensa demais, a melhor época
			{
				tipo: 'chips',
				de: ini(b, 'resposta1') - 0.05,
				ate: fim(b, 'resposta1') + 0.1,
				itens: [
					{texto: 'COMPENSA DEMAIS', em: ini(b, 'resposta1')},
					{texto: 'A MELHOR ÉPOCA', em: b.at('melhor')},
				],
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
				sons: [{em: b.at('melhor'), som: 'pro_tick', ganho: 0.8}],
			},
			// 5. TikTok Shop recente no Brasil: selo acima da cabeça
			{
				tipo: 'selo',
				de: b.at('Brasil') - 0.1,
				ate: b.at('grande') - 0.15,
				texto: 'RECENTE NO BRASIL',
				chip: 'TIKTOK SHOP',
				emChip: b.at('recente,'),
				y: 330,
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			// 6. A grande onda azul: frase estática, palavra por palavra
			{
				tipo: 'frase',
				de: b.at('grande') - 0.05,
				ate: fim(b, 'resposta2') + 0.1,
				palavras: [
					{texto: 'UMA GRANDE', em: b.at('grande')},
					{texto: 'ONDA AZUL', em: b.at('onda'), destaque: true},
					{texto: 'E TODO MUNDO SURFANDO', em: b.at('todo')},
				],
				som: 'pro_whoosh',
			},
			// 7. O caminho: cartas 3D em leque
			{
				tipo: 'cards3d',
				de: b.at('método') - 0.1,
				ate: fim(b, 'resposta4') + 0.1,
				itens: [
					{texto: 'MÉTODO CERTO', em: b.at('método')},
					{texto: 'PESSOAS CONFIÁVEIS', em: b.at('pessoas')},
					{texto: 'PRODUTO CERTO', em: b.at('produto')},
					{texto: 'TIMING', em: b.at('timing.')},
				],
				y: 1010,
				som: 'pro_pouso',
				sons: [
					{em: b.at('pessoas'), som: 'pro_pouso', ganho: 0.8},
					{em: b.at('produto'), som: 'pro_pouso', ganho: 0.8},
					{em: b.at('timing.'), som: 'pro_pouso', ganho: 0.8},
				],
			},
			// 8. Salário de farmacêutica em poucas horas: antes × agora
			{
				tipo: 'gradeAntesDepois',
				de: ini(b, 'resposta5') - 0.05,
				ate: fim(b, 'resposta5') + 0.15,
				titulo: [
					{texto: 'O MESMO', em: ini(b, 'resposta5')},
					{texto: 'SALÁRIO', em: b.at('salário', 2)},
				],
				antes: {texto: 'FARMACÊUTICA', em: b.at('farmacêutica'), valor: '30 DIAS'},
				depois: {texto: 'TIKTOK SHOP', em: b.at('poucas'), valor: 'POUCAS HORAS'},
				som: 'pro_whoosh',
				sons: [{em: b.at('poucas'), som: 'pro_pop', ganho: 0.7}],
			},
			// 9. Síntese: começa hoje
			{
				tipo: 'frase',
				de: ini(b, 'sintese') - 0.05,
				ate: fim(b, 'sintese') + 0.1,
				palavras: [
					{texto: 'NÃO DEMORA', em: ini(b, 'sintese')},
					{texto: 'COMEÇA HOJE', em: b.at('começa'), destaque: true},
				],
				som: 'pro_frase',
			},
			// 10. CTA: caixa de comentário e siga cada um
			{
				tipo: 'comentario',
				de: ini(b, 'duvida') - 0.05,
				ate: ini(b, 'siga') - 0.1,
				texto: 'Tenho uma dúvida...',
				y: 1060,
				som: 'pro_digita',
			},
			{
				tipo: 'siga',
				de: ini(b, 'siga') - 0.05,
				ate: b.at('vamos') - 0.05,
				itens: [
					{texto: 'DANILOW', em: ini(b, 'siga')},
					{texto: 'MARCI', em: b.at('Marci,', 2)},
					{texto: 'MVM', em: b.at('MVM,')},
				],
				y: 1040,
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [
					{em: b.at('Marci,', 2), som: 'pro_swipe', ganho: 0.7},
					{em: b.at('MVM,'), som: 'pro_swipe', ganho: 0.7},
				],
			},
			// 11. Cartão final
			{tipo: 'final', de: fimFala + 0.1, ate: fimFala + 2.4, marca: 'MVM', linha2: 'CREATORS', sub: 'O TIKTOK SHOP MUDA VIDAS', tres: true, som: 'pro_logo'},
		];
	},
};
