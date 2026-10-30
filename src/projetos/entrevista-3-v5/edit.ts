import type {EfeitoCamera, Edit} from '../../motor/plano';
import type {Busca, Trecho} from '../../motor/palavras';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// Entrevista 3, vídeo 5 (tema Entrevista): Danilow com o Ricardo (top creator) e a Isabela no evento da MVM em Floripa.
// Fonte 5.MOV (4K HDR do iPhone) convertida para 1440x2560 SDR 30 qps (scripts/converter-entrevista-3.sh).
// Roteiro: gancho R$ 500 MILHÕES da comunidade → Ricardo, top creator → pergunta (Floripa → Rio) → energia renovada →
// não é gasto, é investimento → "obeso intelectual" → pergunta à Isabela (R$ 20 mil?) → resposta → siga → cartão final.
// Posição do rosto sem medir (feito sem o vídeo): zoom no centro e no máximo 1,3; conferir no Studio.
const P = {x: 0.5, y: 0.3};

const F = {
	gancho: ['Dois anos de MVM', 'faturados na comunidade'],
	apresenta: ['estou aqui com o Ricardo', 'do TikTok Shop'],
	pergunta: ['O que você leva de Floripa', 'para o Rio de Janeiro'],
	energia: ['a cada evento que a gente volta para casa', 'com energia renovada'],
	investimento: ['então a gente nunca enxerga isso daqui como um gasto', 'isso aqui é um investimento'],
	obeso: ['vir para cá, se tornar um obeso intelectual', 'não vai adiantar nada na sua operação'],
	pergunta2: ['Isabela, você investiria', 'para estar num ambiente desse'],
	resposta2: ['Com certeza, porque como o Ricardo falou', 'os melhores criadores do mercado'],
	siga: ['siga o Ricardo', 'vamos para cima'],
} as const;
const ini = (b: Busca, k: keyof typeof F) => b.say(F[k][0]).inicio;
const fim = (b: Busca, k: keyof typeof F) => b.say(F[k][1]).fim;

// Ritmo frenético (evento a cada 0,3–0,6 s): punch-in nas palavras, ciclo médio → close → aberto, até 1,3.
const ESCALAS = [1.1, 1.2, 1.28, 1.14, 1.24, 1.06];
const punches = (b: Busca, frase: string, passo = 0.55): EfeitoCamera[] => {
	const lista: EfeitoCamera[] = [];
	let ultimo = -9;
	for (const t of b.tempos(frase)) {
		if (t - ultimo < passo) continue;
		lista.push({tipo: 'zoom', em: t, escala: ESCALAS[lista.length % ESCALAS.length], ...P});
		ultimo = t;
	}
	return lista;
};

export const entrevista3V5: Edit = {
	pasta: 'projetos/entrevista-3-v5',
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
				if (s0 <= ini + 0.25 || s1 >= z - 0.25 || s1 - s0 < 0.12) continue;
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
			{palavra: 'renovada', estilo: 'serif'},
			{palavra: 'intelectual', estilo: 'serif'},
			{palavra: 'melhores', estilo: 'serif'},
		],
		falantes: (b) => [
			{de: ini(b, 'pergunta') - 0.1, ate: fim(b, 'pergunta') + 0.1, nome: 'PERGUNTA'},
			{de: fim(b, 'pergunta') + 0.1, ate: ini(b, 'pergunta2') - 0.1, nome: 'RICARDO'},
			{de: ini(b, 'pergunta2') - 0.1, ate: fim(b, 'pergunta2') + 0.1, nome: 'PERGUNTA'},
			{de: fim(b, 'pergunta2') + 0.1, ate: fim(b, 'resposta2') + 0.1, nome: 'ISABELA'},
		],
	},
	camera: (b) => {
		const z = (em: number, escala: number): EfeitoCamera => ({tipo: 'zoom', em, escala, ...P});
		return [
			// Gancho: clarão na batida do número
			z(0, 1.15),
			z(b.at('anos'), 1.22),
			{tipo: 'flash', em: b.at('500') - 0.04},
			z(b.at('500'), 1.28),
			z(b.at('comunidade'), 1.12),
			{tipo: 'chicote', em: ini(b, 'apresenta')},
			...punches(b, 'estou aqui com o Ricardo, é um top creator aqui do TikTok Shop'),
			{tipo: 'chicote', em: ini(b, 'pergunta')},
			z(ini(b, 'pergunta'), 1),
			z(b.at('Rio'), 1.12),
			{tipo: 'chicote', em: ini(b, 'energia')},
			...punches(b, 'a cada evento que a gente volta para casa, a gente volta com energia renovada'),
			...punches(b, 'então a gente nunca enxerga isso daqui como um gasto, nunca é supérfluo, isso aqui é um investimento'),
			{tipo: 'foco', em: ini(b, 'obeso')},
			...punches(b, 'vir para cá, se tornar um obeso intelectual e não praticar'),
			z(b.at('adiantar'), 1.26),
			{tipo: 'chicote', em: ini(b, 'pergunta2')},
			z(ini(b, 'pergunta2'), 1),
			z(b.at('20'), 1.2),
			{tipo: 'chicote', em: ini(b, 'resposta2')},
			...punches(b, 'Com certeza, porque como o Ricardo falou, a gente não está, não é gasto, é investimento, você pega insight, você está com os melhores criadores do mercado'),
			{tipo: 'chicote', em: ini(b, 'siga')},
			...punches(b, 'siga o Ricardo, siga a Isabela, siga o MVM, vamos para cima'),
		];
	},
	cenas: (b) => {
		const fimFala = fim(b, 'siga');
		return [
			// 1. Gancho: o faturamento da comunidade em ouro 3D
			{
				tipo: 'numero3d',
				de: 0,
				ate: fim(b, 'gancho') + 0.05,
				texto: 'R$ 500 MILHÕES',
				rotulo: '2 ANOS DE MVM',
				abaixo: 'NA COMUNIDADE',
				nomeOuro: true,
				em: b.at('500') - 0.2,
				esconderLegenda: true,
				som: 'pro_pop',
			},
			// 2. Ricardo, top creator
			{
				tipo: 'selo',
				de: b.at('top') - 0.1,
				ate: fim(b, 'apresenta') + 0.2,
				texto: 'TOP CREATOR',
				chip: 'RICARDO',
				emChip: b.at('top'),
				y: 330,
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			// 3. Pergunta: de Floripa para o Rio, avião cruzando acima da cabeça
			{
				tipo: 'aviao',
				de: ini(b, 'pergunta') - 0.05,
				ate: fim(b, 'pergunta') + 0.6,
				y: 230,
				som: 'pro_aviao',
			},
			// 4. Energia renovada
			{
				tipo: 'frase',
				de: b.at('energia') - 0.05,
				ate: fim(b, 'energia') + 0.25,
				palavras: [
					{texto: 'ENERGIA', em: b.at('energia')},
					{texto: 'RENOVADA', em: b.at('renovada'), destaque: true},
				],
				som: 'pro_frase',
			},
			// 5. Não é gasto, é investimento (1ª vez: chips; a Isabela repete e leva outro efeito)
			{
				tipo: 'chips',
				de: b.at('gasto') - 0.05,
				ate: fim(b, 'investimento') + 0.2,
				itens: [
					{texto: '✗ GASTO', em: b.at('gasto')},
					{texto: '✗ SUPÉRFLUO', em: b.at('supérfluo')},
					{texto: '✓ INVESTIMENTO', em: b.at('investimento')},
				],
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
				sons: [
					{em: b.at('supérfluo'), som: 'pro_tick', ganho: 0.8},
					{em: b.at('investimento'), som: 'pro_pop', ganho: 0.7},
				],
			},
			// 6. "obeso intelectual": frase estática, sem zoom
			{
				tipo: 'frase',
				de: b.at('obeso') - 0.05,
				ate: fim(b, 'obeso') + 0.2,
				palavras: [
					{texto: 'OBESO', em: b.at('obeso')},
					{texto: 'INTELECTUAL', em: b.at('intelectual'), destaque: true},
					{texto: 'SEM PRATICAR', em: b.at('praticar')},
				],
				som: 'pro_frase',
			},
			// 7. Pergunta à Isabela: R$ 20 mil em prata
			{
				tipo: 'numero3d',
				de: b.at('20') - 0.15,
				ate: fim(b, 'pergunta2') + 0.1,
				texto: 'R$ 20 MIL',
				rotulo: 'VOCÊ INVESTIRIA?',
				metal: 'branco',
				em: b.at('20') - 0.1,
				esconderLegenda: true,
				som: 'pro_pop',
			},
			// 8. Resposta da Isabela: o que se ganha, em cartas 3D
			{
				tipo: 'cards3d',
				de: b.at('investimento', 2) - 0.1,
				ate: fim(b, 'resposta2') + 0.3,
				itens: [
					{texto: 'INVESTIMENTO', em: b.at('investimento', 2)},
					{texto: 'INSIGHTS', em: b.at('insight')},
					{texto: 'OS MELHORES', em: b.at('melhores')},
				],
				y: 1010,
				som: 'pro_pouso',
				sons: [
					{em: b.at('insight'), som: 'pro_pouso', ganho: 0.8},
					{em: b.at('melhores'), som: 'pro_pouso', ganho: 0.8},
				],
			},
			// 9. Siga cada um
			{
				tipo: 'siga',
				de: ini(b, 'siga') - 0.05,
				ate: fimFala + 0.1,
				itens: [
					{texto: 'RICARDO', em: ini(b, 'siga')},
					{texto: 'ISABELA', em: b.at('Isabela', 2)},
					{texto: 'MVM', em: b.at('MVM', 2)},
				],
				y: 1040,
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [
					{em: b.at('Isabela', 2), som: 'pro_swipe', ganho: 0.7},
					{em: b.at('MVM', 2), som: 'pro_swipe', ganho: 0.7},
				],
			},
			// 10. Cartão final
			{tipo: 'final', de: fimFala + 0.1, ate: fimFala + 2.4, marca: 'MVM', linha2: 'CREATORS', sub: 'EVENTO EM FLORIPA', tres: true, som: 'pro_logo'},
		];
	},
};
