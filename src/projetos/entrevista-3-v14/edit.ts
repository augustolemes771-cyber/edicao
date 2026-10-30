import type {EfeitoCamera, Edit} from '../../motor/plano';
import type {Busca, Trecho} from '../../motor/palavras';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// Entrevista 3, vídeo 14 (tema Entrevista): Danilow com o Rogério no evento da MVM em Floripa, sobre investir em conhecimento.
// Fonte 14.MOV (4K HDR do iPhone) convertida para 1440x2560 SDR 30 qps (scripts/converter-entrevista-3.sh).
// Roteiro: gancho R$ 50 MIL em mentores → Floripa, 2 anos, R$ 500 mi → Rogério, 1 ano de TikTok Shop → pergunta (20, 30,
// 40 mil: por quê?) → próximo nível = investir em você → ponto A → B → conhecimento, pessoas, mentoria → o mentor já errou →
// síntese "uma vez expandida, não volta ao normal" → CTA (siga, dúvida) → cartão final.
// O v5 tem o mesmo gancho dos 500 milhões: aqui os 500 mi viram chip e o 3D fica com o investimento do Rogério.
// Posição do rosto sem medir: zoom no centro e no máximo 1,3; conferir no Studio.
const P = {x: 0.5, y: 0.3};

const F = {
	gancho: ['já investiu em conhecimento', 'Mais de 50 mil'],
	floripa: ['Estamos aqui em Floripa', '500 milhões faturado'],
	apresenta: ['Estou aqui com o Rogério', 'Estou aqui com o Rogério'],
	ano: ['Há quanto tempo você', 'Faz um ano'],
	pergunta: ['para as pessoas estarem aqui hoje', '40 mil reais'],
	porque: ['Por que você faria', 'tipo de investimento'],
	resposta1: ['para você chegar no próximo nível', 'investir em conhecimento'],
	resposta2: ['quer sair do ponto A', 'outras pessoas, mentoria'],
	mentor: ['porque o mentor', 'já errou antes'],
	sintese: ['Dessa forma', 'volta ao normal novamente'],
	siga: ['Já me siga', 'vamos para cima'],
	duvida: ['Se tiver alguma dúvida', 'deixe nos comentários'],
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

export const entrevista3V14: Edit = {
	pasta: 'projetos/entrevista-3-v14',
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
			{palavra: 'faria', estilo: 'serif'},
			{palavra: 'passo', estilo: 'serif'},
			{palavra: 'mentalidade', estilo: 'serif'},
		],
		falantes: (b) => [
			{de: ini(b, 'pergunta') - 0.1, ate: fim(b, 'porque') + 0.1, nome: 'PERGUNTA'},
			{de: fim(b, 'porque') + 0.1, ate: fim(b, 'mentor') + 0.1, nome: 'ROGÉRIO'},
		],
	},
	camera: (b) => {
		const z = (em: number, escala: number): EfeitoCamera => ({tipo: 'zoom', em, escala, ...P});
		return [
			// Gancho: a pergunta em close e o clarão quando o número trava
			z(0, 1.18),
			z(b.at('mentores'), 1.08),
			{tipo: 'flash', em: b.at('50') - 0.04},
			z(b.at('50'), 1.28),
			{tipo: 'chicote', em: ini(b, 'floripa')},
			z(ini(b, 'floripa'), 1),
			...punches(b, 'dois anos de MVM, mais de 500 milhões faturado'),
			{tipo: 'chicote', em: ini(b, 'apresenta')},
			z(b.at('Rogério'), 1.15),
			z(ini(b, 'ano'), 1.04),
			z(b.at('ano'), 1.24),
			{tipo: 'chicote', em: ini(b, 'pergunta')},
			z(ini(b, 'pergunta'), 1),
			...punches(b, 'para as pessoas estarem aqui hoje, elas tiveram que'),
			z(b.at('investir'), 1.1),
			z(b.at('20'), 1.16),
			z(b.at('30'), 1.22),
			z(b.at('40'), 1.28),
			z(ini(b, 'porque'), 1.06),
			z(b.at('faria'), 1.18),
			{tipo: 'chicote', em: ini(b, 'resposta1')},
			...punches(b, 'para você chegar no próximo nível, você precisa dar um passo', 0.55),
			...punches(b, 'E esse passo é você investir em você, investir em conhecimento', 0.55),
			// Por baixo da grade em tela cheia: a volta ao rosto já vem num plano novo
			...punches(b, 'quer sair do ponto A e ir para o ponto B', 0.6),
			z(b.at('Investe'), 1.28),
			...punches(b, 'Investe em conhecimento, investe em outras pessoas, mentoria', 0.55),
			{tipo: 'foco', em: ini(b, 'mentor')},
			{tipo: 'chicote', em: ini(b, 'sintese')},
			z(ini(b, 'sintese'), 1),
			z(b.at('expandir'), 1.14),
			z(b.at('mentalidade'), 1.24),
			{tipo: 'flash', em: b.at('normal') - 0.04},
			{tipo: 'chicote', em: ini(b, 'siga')},
			...punches(b, 'Já me siga, Dani Lowe, já siga o Rogério, siga o MVM, vamos para cima'),
			z(ini(b, 'duvida'), 1.06),
			z(b.at('comentários'), 1.2),
		];
	},
	cenas: (b) => {
		const fimFala = fim(b, 'duvida');
		return [
			// 1. Gancho: a pergunta no topo e o investimento do Rogério em ouro 3D
			{
				tipo: 'selo',
				de: 0,
				ate: b.at('Mais') - 0.1,
				texto: 'QUANTO VOCÊ JÁ INVESTIU?',
				chip: 'MENTORES',
				emChip: b.at('mentores'),
				y: 330,
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			{
				tipo: 'numero3d',
				de: b.at('Mais') - 0.1,
				ate: fim(b, 'gancho') + 0.1,
				texto: 'R$ 50 MIL',
				rotulo: 'ROGÉRIO',
				abaixo: 'EM MENTORES',
				nomeOuro: true,
				em: b.at('50') - 0.2,
				esconderLegenda: true,
				som: 'pro_pop',
			},
			// 2. O evento: Floripa, 2 anos, R$ 500 mi (no v5 é 3D; aqui chips um por vez)
			{
				tipo: 'chips',
				de: ini(b, 'floripa') + 0.1,
				ate: fim(b, 'floripa') + 0.15,
				itens: [
					{texto: 'FLORIPA', em: b.at('Floripa')},
					{texto: '2 ANOS DE MVM', em: b.at('dois')},
					{texto: 'R$ 500 MI FATURADOS', em: b.at('500')},
				],
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
				sons: [
					{em: b.at('dois'), som: 'pro_tick', ganho: 0.8},
					{em: b.at('500'), som: 'pro_tick', ganho: 0.8},
				],
			},
			// 3. Rogério: 1 ano de TikTok Shop em prata 3D (o ouro é do gancho)
			{
				tipo: 'numero3d',
				de: b.at('Faz') - 0.1,
				ate: fim(b, 'ano') + 0.2,
				texto: '1 ANO',
				rotulo: 'NO TIKTOK SHOP',
				metal: 'branco',
				em: b.at('ano') - 0.1,
				esconderLegenda: true,
				som: 'pro_pop',
			},
			// 4. Pergunta: 20, 30, 40 mil caem como cartas, uma por número
			{
				tipo: 'cards3d',
				de: b.at('20') - 0.1,
				ate: b.at('20') + 2.75,
				itens: [
					{texto: 'R$ 20 MIL', em: b.at('20')},
					{texto: 'R$ 30 MIL', em: b.at('30')},
					{texto: 'R$ 40 MIL', em: b.at('40')},
				],
				y: 1010,
				som: 'pro_pouso',
				sons: [
					{em: b.at('30'), som: 'pro_pouso', ganho: 0.8},
					{em: b.at('40'), som: 'pro_pouso', ganho: 0.8},
				],
			},
			// 5. Próximo nível: dar um passo
			{
				tipo: 'frase',
				de: b.at('próximo') - 0.05,
				ate: b.say('dar um passo').fim + 0.1,
				palavras: [
					{texto: 'PRÓXIMO NÍVEL', em: b.at('próximo')},
					{texto: 'UM PASSO', em: b.at('passo'), destaque: true},
				],
				som: 'pro_frase',
			},
			// 6. O passo: investir em você e em conhecimento
			{
				tipo: 'chips',
				de: b.at('investir', 2) - 0.05,
				ate: fim(b, 'resposta1') + 0.15,
				itens: [
					{texto: 'EM VOCÊ', em: b.at('investir', 2)},
					{texto: 'EM CONHECIMENTO', em: b.at('investir', 3)},
				],
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
				sons: [{em: b.at('investir', 3), som: 'pro_tick', ganho: 0.8}],
			},
			// 7. Ponto A → ponto B: grade em tela cheia com o título 3D e os dois cartões
			{
				tipo: 'gradeAntesDepois',
				de: ini(b, 'resposta2') - 0.05,
				ate: b.at('Investe') + 0.45,
				titulo: [
					{texto: 'QUER SAIR', em: ini(b, 'resposta2')},
					{texto: 'DO A PRO B?', em: b.at('ponto')},
				],
				antes: {texto: 'PONTO A', em: b.at('ponto') + 0.1},
				depois: {texto: 'PONTO B', em: b.at('ponto', 2) + 0.1},
				som: 'pro_swipe',
				sons: [{em: b.at('ponto', 2) + 0.1, som: 'pro_swipe', ganho: 0.7}],
			},
			// 8. Investe em: chips ✓ um por vez
			{
				tipo: 'chips',
				de: b.at('Investe', 2) - 0.05,
				ate: fim(b, 'resposta2') + 0.2,
				itens: [
					{texto: '✓ CONHECIMENTO', em: b.at('conhecimento', 3)},
					{texto: '✓ OUTRAS PESSOAS', em: b.at('outras')},
					{texto: '✓ MENTORIA', em: b.at('mentoria')},
				],
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
				sons: [
					{em: b.at('outras'), som: 'pro_tick', ganho: 0.8},
					{em: b.at('mentoria'), som: 'pro_pop', ganho: 0.7},
				],
			},
			// 9. O mentor já errou antes: frase estática
			{
				tipo: 'frase',
				de: ini(b, 'mentor') - 0.05,
				ate: fim(b, 'mentor') + 0.15,
				palavras: [
					{texto: 'O MENTOR', em: b.at('mentor')},
					{texto: 'JÁ ERROU', em: b.at('errou'), destaque: true},
					{texto: 'ANTES', em: b.at('antes')},
				],
				som: 'pro_frase',
			},
			// 10. Síntese: mentalidade expandida não volta ao normal (clarão no "normal")
			{
				tipo: 'frase',
				de: b.at('Uma') - 0.05,
				ate: fim(b, 'sintese') + 0.2,
				palavras: [
					{texto: 'UMA VEZ EXPANDIDA', em: b.at('Uma')},
					{texto: 'NÃO VOLTA', em: b.at('não')},
					{texto: 'AO NORMAL', em: b.at('normal'), destaque: true},
				],
				som: 'pro_frase',
			},
			// 11. CTA: siga cada um e a caixa de comentário
			{
				tipo: 'siga',
				de: ini(b, 'siga') - 0.05,
				ate: fim(b, 'siga') + 0.1,
				itens: [
					{texto: 'DANILOW', em: b.at('Dani')},
					{texto: 'ROGÉRIO', em: b.at('Rogério', 2)},
					{texto: 'MVM', em: b.at('MVM', 2)},
				],
				y: 1040,
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [
					{em: b.at('Rogério', 2), som: 'pro_swipe', ganho: 0.7},
					{em: b.at('MVM', 2), som: 'pro_swipe', ganho: 0.7},
				],
			},
			{
				tipo: 'comentario',
				de: ini(b, 'duvida') - 0.05,
				ate: fimFala + 0.2,
				texto: 'Tenho uma dúvida...',
				y: 1060,
				som: 'pro_digita',
			},
			// 12. Cartão final
			{tipo: 'final', de: fimFala + 0.1, ate: fimFala + 2.4, marca: 'MVM', linha2: 'CREATORS', sub: 'EVENTO EM FLORIPA', tres: true, som: 'pro_logo'},
		];
	},
};
