import type {EfeitoCamera, Edit} from '../../motor/plano';
import type {Busca, Trecho} from '../../motor/palavras';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// Entrevista 3, vídeo 7 (tema Entrevista): Danilow entrevista o NewTex, ex-profissional de educação física que fatura
// R$ 8 milhões com live. Fonte 7.MOV convertida para 1440x2560 SDR 30 qps (scripts/converter-entrevista-3.sh).
// Roteiro: gancho R$ 8 MILHÕES → zero barreira (celular + internet) → NewTex, brabo das lives → pergunta (preso na CLT) →
// procure o TikTok Shop → produto em casa, fitness, suplemento → pessoas perguntando → recorde 1,4 MI → 140 MIL de lucro →
// 8 h de live? passo até 24 HORAS → "não é fácil, mas é muito simples" → siga → cartão final.
// O Whisper escreveu "Danilo" e "Newtags": na tela vão DANILOW e NEWTEX.
// Posição do rosto sem medir: zoom no centro e no máximo 1,3; conferir no Studio.
const P = {x: 0.5, y: 0.3};

const F = {
	gancho: ['Ex-profissional de educação física', 'só fazendo live'],
	celular: ['Rapaziada, zero barreira de entrada', 'é um celular e internet'],
	apresenta: ['Estou aqui com o NewTex', 'brabo demais das lives'],
	pergunta: ['Qual é o insight', 'presa no CLT'],
	resposta1: ['hoje eu indico para você', 'procurar o TikTok Shopping'],
	resposta2: ['Todo mundo tem produtos em casa', 'foi assim que eu comecei'],
	resposta3: ['E aí várias pessoas foram perguntando', 'comecei a ter resultado no começo'],
	recorde: ['E qual foi o seu recorde', '1 milhão e 400'],
	lucro: ['1 milhão de faturamento', 'deu 140 mil de lucro'],
	compensa: ['Será que compensa', 'passo até 24 horas'],
	sintese: ['Não é fácil', 'muito simples'],
	siga: ['Segue o Danilo', 'vamos para cima'],
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

export const entrevista3V7: Edit = {
	pasta: 'projetos/entrevista-3-v7',
	video: 'video.mp4',
	formato: 'vertical',
	verificarCurva: false,
	regraCamera: false,
	extraFim: 2.4,
	silencios: silencios as Trecho[],
	transcricao,
	trechos: (o) => {
		const lista: Trecho[] = (Object.keys(F) as (keyof typeof F)[]).map((k) => [o.say(F[k][0]).inicio - 0.06, o.say(F[k][1]).fim + 0.08]);
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
			{palavra: 'fitness,', estilo: 'serif'},
			{palavra: 'fácil', estilo: 'serif'},
			{palavra: 'resultado', estilo: 'serif'},
		],
		falantes: (b) => [
			{de: ini(b, 'pergunta') - 0.1, ate: fim(b, 'pergunta') + 0.1, nome: 'PERGUNTA'},
			{de: ini(b, 'resposta1') - 0.1, ate: fim(b, 'resposta3') + 0.1, nome: 'NEWTEX'},
			{de: ini(b, 'recorde') - 0.1, ate: b.say('De um mês').inicio - 0.1, nome: 'PERGUNTA'},
		],
	},
	camera: (b) => {
		const z = (em: number, escala: number): EfeitoCamera => ({tipo: 'zoom', em, escala, ...P});
		return [
			// Gancho: clarão na batida do número
			z(0, 1.12),
			z(b.at('educação'), 1.22),
			{tipo: 'flash', em: b.at('8') - 0.04},
			z(b.at('8'), 1.28),
			z(b.at('fazendo'), 1.14),
			z(b.at('Rapaziada,'), 1.24),
			{tipo: 'chicote', em: ini(b, 'apresenta')},
			...punches(b, 'Estou aqui com o NewTex, brabo demais das lives'),
			{tipo: 'chicote', em: ini(b, 'pergunta')},
			z(ini(b, 'pergunta'), 1),
			z(b.at('pessoa'), 1.12),
			{tipo: 'chicote', em: ini(b, 'resposta1')},
			...punches(b, 'hoje eu indico para você procurar o TikTok Shopping', 0.55),
			...punches(b, 'Todo mundo tem produtos em casa que vendem no TikTok Shopping, às vezes você tem um suplemento', 0.55),
			...punches(b, 'Eu que sou da área fitness, sempre tive suplemento em casa e foi assim que eu comecei', 0.55),
			...punches(b, 'E aí várias pessoas foram perguntando e eu entrei muito fácil no TikTok Shopping e comecei a ter resultado no começo', 0.55),
			{tipo: 'chicote', em: ini(b, 'recorde')},
			z(ini(b, 'recorde'), 1),
			z(b.at('recorde'), 1.12),
			{tipo: 'chicote', em: b.say('De um mês').inicio},
			z(b.say('De um mês').inicio, 1.2),
			z(ini(b, 'lucro'), 1.06),
			z(b.at('140'), 1.26),
			{tipo: 'chicote', em: ini(b, 'compensa')},
			z(ini(b, 'compensa'), 1),
			z(b.at('compensa'), 1.12),
			{tipo: 'chicote', em: b.at('Amigo,')},
			z(b.at('Amigo,'), 1.18),
			z(b.at('24'), 1.28),
			z(ini(b, 'sintese'), 1),
			{tipo: 'flash', em: b.at('simples,') - 0.04},
			z(b.at('simples,'), 1.25),
			z(ini(b, 'siga'), 1.06),
			z(b.at('Newtags,'), 1.16),
			z(b.at('MVM'), 1.22),
			z(b.at('vamos'), 1.28),
		];
	},
	cenas: (b) => {
		const fimFala = fim(b, 'siga');
		return [
			// 1. Gancho: quem ele é, depois o resultado em ouro 3D
			{
				tipo: 'chips',
				de: 0,
				ate: b.at('8') - 0.12,
				itens: [{texto: 'EX-EDUCADOR FÍSICO', em: 0.05}],
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
			},
			{
				tipo: 'numero3d',
				de: b.at('8') - 0.12,
				ate: fim(b, 'gancho') + 0.05,
				texto: 'R$ 8 MILHÕES',
				rotulo: 'NEWTEX',
				abaixo: 'SÓ FAZENDO LIVE',
				nomeOuro: true,
				em: b.at('8') - 0.1,
				esconderLegenda: true,
				som: 'pro_pop',
			},
			// 2. Zero barreira de entrada: celular 3D com o texto caindo na fala
			{
				tipo: 'celular3d',
				modelo: '3D models/Phones/iphone.obj',
				de: b.at('zero') - 0.1,
				ate: fim(b, 'celular') + 0.1,
				linhas: [
					{texto: 'ZERO BARREIRA', em: b.at('zero')},
					{texto: 'UM CELULAR', em: b.at('celular')},
					{texto: '+ INTERNET', em: b.at('internet.')},
				],
				som: 'pro_whoosh',
			},
			// 3. Apresentação: o nome na pílula e a live dele no "lives"
			{
				tipo: 'pilula',
				de: b.at('NewTex,') - 0.05,
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
				ate: fim(b, 'apresenta') + 0.05,
				host: 'NewTex',
				curtidas: '48,2 mil curtidas',
				espectadores: '2,3 mil',
				comentarios: [
					{nome: 'Gabi', texto: 'quero o whey!'},
					{nome: 'Leo', texto: 'chegou hoje ✅'},
				],
				som: 'pro_whoosh_curto',
			},
			// 4. Pergunta: preso na corrida dos ratos, na CLT
			{
				tipo: 'presoClt',
				de: b.at('presa') - 0.05,
				ate: fim(b, 'pergunta') + 0.15,
				em: b.at('presa'),
				emCadeado: b.at('CLT?'),
				som: 'pro_swipe',
				sons: [{em: b.at('CLT?'), som: 'pro_tick', ganho: 0.8}],
			},
			// 5. A dica: TikTok Shop
			{
				tipo: 'selo',
				de: b.at('procurar') - 0.1,
				ate: fim(b, 'resposta1') + 0.1,
				texto: 'TIKTOK SHOP',
				chip: 'A DICA',
				emChip: b.at('procurar'),
				y: 330,
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			// 6. Como ele começou: cartas em leque, uma por ideia
			{
				tipo: 'cards3d',
				de: b.at('produtos') - 0.1,
				ate: fim(b, 'resposta2') + 0.1,
				itens: [
					{texto: 'PRODUTO EM CASA', em: b.at('produtos')},
					{texto: 'SUPLEMENTO', em: b.at('suplemento.')},
					{texto: 'SUA ÁREA', em: b.at('fitness,')},
				],
				y: 1010,
				som: 'pro_pouso',
				sons: [
					{em: b.at('suplemento.'), som: 'pro_pouso', ganho: 0.8},
					{em: b.at('fitness,'), som: 'pro_pouso', ganho: 0.8},
				],
			},
			// 7. Várias pessoas perguntando: mensagens chegando
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
			// 8. Recorde: faturamento em prata, lucro em ouro
			{
				tipo: 'numero3d',
				de: b.say('De um mês').inicio - 0.05,
				ate: fim(b, 'recorde') + 0.1,
				texto: 'R$ 1,4 MI',
				rotulo: 'RECORDE EM 1 MÊS',
				abaixo: 'FATURAMENTO',
				metal: 'branco',
				em: b.at('1'),
				esconderLegenda: true,
				som: 'pro_pop',
			},
			{
				tipo: 'numero3d',
				de: b.at('140') - 0.1,
				ate: fim(b, 'lucro') + 0.2,
				texto: 'R$ 140 MIL',
				rotulo: 'NO BOLSO',
				abaixo: 'DE LUCRO',
				em: b.at('140'),
				esconderLegenda: true,
				som: 'pro_pop',
			},
			// 9. "Compensa ficar 8 horas em live?": a live na tela; resposta em ouro 3D
			{
				tipo: 'live',
				de: b.at('live', 2) - 0.05,
				ate: b.at('lucrar') + 0.25,
				host: 'NewTex',
				curtidas: '96,5 mil curtidas',
				espectadores: '4,8 mil',
				comentarios: [{nome: 'Dani', texto: 'quero 2!'}],
				som: 'pro_whoosh_curto',
			},
			{
				tipo: 'numero3d',
				de: b.at('passo') - 0.1,
				ate: fim(b, 'compensa') + 0.15,
				texto: '24 HORAS',
				rotulo: 'EU PASSO ATÉ',
				abaixo: 'DE LIVE',
				em: b.at('24'),
				esconderLegenda: true,
				som: 'pro_pop',
			},
			// 10. Síntese
			{
				tipo: 'frase',
				de: ini(b, 'sintese') - 0.05,
				ate: ini(b, 'siga') - 0.1,
				palavras: [
					{texto: 'NÃO É FÁCIL', em: ini(b, 'sintese')},
					{texto: 'É MUITO SIMPLES', em: b.say('muito simples').inicio, destaque: true},
				],
				som: 'pro_frase',
			},
			// 11. CTA: siga cada um
			{
				tipo: 'siga',
				de: ini(b, 'siga') - 0.05,
				ate: fimFala + 0.05,
				itens: [
					{texto: 'DANILOW', em: ini(b, 'siga')},
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
			// 12. Cartão final
			{tipo: 'final', de: fimFala + 0.1, ate: fimFala + 2.4, marca: 'MVM', linha2: 'CREATORS', sub: 'LIVE NO TIKTOK SHOP', tres: true, som: 'pro_logo'},
		];
	},
};
