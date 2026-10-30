import type {EfeitoCamera, Edit} from '../../motor/plano';
import type {Busca, Trecho} from '../../motor/palavras';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// Entrevista 3, vídeo 3 (tema Entrevista): Danilow entrevista a Ludi, ex-atleta de karatê que faz R$ 100 mil com live.
// Fonte 3.MOV (4K HDR do iPhone) convertida para 1440x2560 SDR 30 qps (scripts/converter-entrevista-3.sh).
// Roteiro: gancho R$ 100 MIL → apresentação (5º no Mundial) → pergunta (Floripa → Goiânia) → sair do modo caverna →
// visão ampla → live é o carro-chefe → novos braços → "não é fácil, mas é simples" → CTA (dúvida, siga) → cartão final.
// Posição do rosto sem medir (feito sem o vídeo): zoom no centro e no máximo 1,3; conferir no Studio.
const P = {x: 0.5, y: 0.3};

const F = {
	gancho: ['Hoje ela coloca mais de 100 mil reais', 'fazendo live no TikTok Shop'],
	apresenta: ['Estou aqui com a Ludi', 'quinto no Mundial'],
	pergunta: ['o que você leva de bagagem', 'de Floripa para a Goiânia'],
	resposta1: ['O que eu acho que eu levo', 'de uma maneira ampla'],
	resposta2: ['A gente saiu daqui com várias possibilidades', 'claro que esse ainda é o nosso carro-chefe'],
	resposta3: ['mas a gente tem uma mentalidade', 'ir atrás de novas mentorias'],
	sintese: ['Não é fácil, mas é simples', 'você também consegue'],
	duvida: ['Tem alguma dúvida', 'Deixa nos comentários'],
	siga: ['siga a Ludi', 'siga o MVM'],
	bora: ['Bora para cima', 'Bora para cima'],
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

export const entrevista3V3: Edit = {
	pasta: 'projetos/entrevista-3-v3',
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
			{palavra: 'caverna', estilo: 'serif'},
			{palavra: 'mentalidade', estilo: 'serif'},
			{palavra: 'consegue', estilo: 'serif'},
		],
		falantes: (b) => [
			{de: ini(b, 'pergunta') - 0.1, ate: fim(b, 'pergunta') + 0.1, nome: 'PERGUNTA'},
			{de: fim(b, 'pergunta') + 0.1, ate: fim(b, 'resposta3') + 0.1, nome: 'LUDI'},
		],
	},
	camera: (b) => {
		const z = (em: number, escala: number): EfeitoCamera => ({tipo: 'zoom', em, escala, ...P});
		return [
			// Gancho: clarão na batida do número
			z(0, 1.15),
			{tipo: 'flash', em: b.at('100') - 0.04},
			z(b.at('100'), 1.28),
			z(b.at('celular'), 1.12),
			z(b.at('live'), 1.22),
			{tipo: 'chicote', em: ini(b, 'apresenta')},
			...punches(b, 'Estou aqui com a Ludi, ex-atleta de Karate, chegou a ficar em quinto no Mundial'),
			{tipo: 'chicote', em: ini(b, 'pergunta')},
			z(ini(b, 'pergunta'), 1),
			z(b.at('Floripa'), 1.12),
			{tipo: 'chicote', em: ini(b, 'resposta1')},
			...punches(b, 'O que eu acho que eu levo de mais importante', 0.55),
			z(b.at('fico'), 1.18),
			...punches(b, 'sair do modo caverna', 0.55),
			...punches(b, 'dentro de casa, fazendo live', 0.55),
			{tipo: 'foco', em: b.at('poder')},
			...punches(b, 'olhar para a minha operação hoje, para a nossa operação, minha e da Karol, de uma maneira ampla', 0.55),
			...punches(b, 'A gente saiu daqui com várias possibilidades, não só de live shop, claro que esse ainda é o nosso carro-chefe', 0.55),
			...punches(b, 'mas a gente tem uma mentalidade para crescer o nosso negócio, para outras áreas, trazer novos braços e ir atrás de novas mentorias', 0.55),
			{tipo: 'chicote', em: ini(b, 'sintese')},
			z(ini(b, 'sintese'), 1),
			{tipo: 'flash', em: b.at('simples') - 0.04},
			z(b.at('simples'), 1.25),
			z(b.at('conseguiu'), 1.1),
			z(b.at('consegue'), 1.26),
			{tipo: 'chicote', em: ini(b, 'duvida')},
			z(ini(b, 'duvida'), 1),
			z(b.at('comentários'), 1.15),
			z(ini(b, 'siga'), 1.08),
			z(b.at('MVM'), 1.2),
			z(ini(b, 'bora'), 1.28),
		];
	},
	cenas: (b) => {
		const fimFala = fim(b, 'bora');
		return [
			// 1. Gancho: o resultado em ouro 3D
			{
				tipo: 'numero3d',
				de: 0,
				ate: fim(b, 'gancho') + 0.05,
				texto: 'R$ 100 MIL',
				rotulo: 'LUDI',
				abaixo: 'FAZENDO LIVE',
				nomeOuro: true,
				em: b.at('100') - 0.2,
				esconderLegenda: true,
				som: 'pro_pop',
			},
			// 2. Apresentação: ex-atleta, chip; 5º no Mundial em prata 3D
			{
				tipo: 'chips',
				de: b.at('ex-atleta') - 0.05,
				ate: b.at('quinto') - 0.1,
				itens: [{texto: 'EX-ATLETA DE KARATÊ', em: b.at('ex-atleta')}],
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
			},
			{
				tipo: 'numero3d',
				de: b.at('quinto') - 0.1,
				ate: fim(b, 'apresenta') + 0.15,
				texto: '5º LUGAR',
				rotulo: 'NO MUNDIAL',
				metal: 'branco',
				em: b.at('quinto'),
				esconderLegenda: true,
				som: 'pro_pop',
			},
			// 3. Pergunta: a "bagagem" de Floripa para Goiânia, avião cruzando acima da cabeça
			{
				tipo: 'aviao',
				de: b.at('bagagem') - 0.1,
				ate: fim(b, 'pergunta') + 0.6,
				y: 230,
				som: 'pro_aviao',
			},
			// 4. "sair do modo caverna": frase estática, palavra por palavra
			{
				tipo: 'frase',
				de: b.at('sair') - 0.05,
				ate: b.say('dentro de casa').fim + 0.1,
				palavras: [
					{texto: 'SAIR DO', em: b.at('sair')},
					{texto: 'MODO CAVERNA', em: b.at('caverna'), destaque: true},
				],
				som: 'pro_frase',
			},
			// 5. Olhar a operação de forma ampla
			{
				tipo: 'chips',
				de: b.at('operação') - 0.05,
				ate: fim(b, 'resposta1') + 0.1,
				itens: [
					{texto: 'A OPERAÇÃO', em: b.at('operação')},
					{texto: 'VISÃO AMPLA', em: b.at('ampla')},
				],
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
				sons: [{em: b.at('ampla'), som: 'pro_tick', ganho: 0.8}],
			},
			// 6. Live continua o carro-chefe
			{
				tipo: 'selo',
				de: b.at('carro-chefe') - 0.1,
				ate: fim(b, 'resposta2') + 0.5,
				texto: 'CARRO-CHEFE',
				chip: 'LIVE',
				emChip: b.at('carro-chefe'),
				y: 330,
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			// 7. Crescer para outras áreas: cartas 3D em leque
			{
				tipo: 'cards3d',
				de: b.at('outras') - 0.1,
				ate: ini(b, 'sintese') - 0.12,
				itens: [
					{texto: 'OUTRAS ÁREAS', em: b.at('outras')},
					{texto: 'NOVOS BRAÇOS', em: b.at('braços')},
					{texto: 'MENTORIAS', em: b.at('mentorias')},
				],
				y: 1010,
				som: 'pro_pouso',
				sons: [
					{em: b.at('braços'), som: 'pro_pouso', ganho: 0.8},
					{em: b.at('mentorias'), som: 'pro_pouso', ganho: 0.8},
				],
			},
			// 8. Síntese
			{
				tipo: 'frase',
				de: ini(b, 'sintese') - 0.05,
				ate: b.at('Se') - 0.05,
				palavras: [
					{texto: 'NÃO É FÁCIL', em: ini(b, 'sintese')},
					{texto: 'É SIMPLES', em: b.at('simples'), destaque: true},
				],
				som: 'pro_frase',
			},
			// 9. CTA: caixa de comentário e siga cada um
			{
				tipo: 'comentario',
				de: ini(b, 'duvida') - 0.05,
				ate: fim(b, 'duvida') + 0.2,
				texto: 'Tenho uma dúvida...',
				y: 1060,
				som: 'pro_digita',
			},
			{
				tipo: 'siga',
				de: ini(b, 'siga') - 0.05,
				ate: fim(b, 'siga') + 0.3,
				itens: [
					{texto: 'LUDI', em: ini(b, 'siga')},
					{texto: 'MVM', em: b.at('MVM')},
				],
				y: 1040,
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [{em: b.at('MVM'), som: 'pro_swipe', ganho: 0.7}],
			},
			// 10. Cartão final
			{tipo: 'final', de: fimFala + 0.1, ate: fimFala + 2.4, marca: 'MVM', linha2: 'CREATORS', sub: 'LIVE NO TIKTOK SHOP', tres: true, som: 'pro_logo'},
		];
	},
};
