import type {EfeitoCamera, Edit} from '../../motor/plano';
import type {Busca, Trecho} from '../../motor/palavras';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// Entrevista 3, vídeo 5 (tema Entrevista): Danilow com o Ricardo (top creator) e a Isabela no evento da MVM em Floripa.
// Fonte 5.MOV (4K HDR do iPhone) convertida para 1440x2560 SDR 30 qps (scripts/converter-entrevista-3.sh).
// Revisão de 30/10 (sem limite de tempo): a fala vai quase inteira, cortando só pausas, o "Boa!" do meio e o "Vai, boa!".
// Roteiro: gancho (gráfico de ouro e contador → R$ 500 MILHÕES) → Floripa, Ricardo top creator (pódio) → pergunta e rota
// Floripa → Rio → 3º evento → energia renovada (bateria) → ambiente, insight → nunca é gasto, é INVESTIMENTO (tela cheia)
// → bagagem → obeso intelectual / sem prática (tela cheia) → Isabela: R$ 20 mil? → ciclo insight, melhores, aprende,
// aplica → siga Danilow, Ricardo, Isabela, MVM → "sempre um investimento" → cartão final.
// Peças próprias em ./pecas.tsx. Rostos medidos nos quadros: Danilow no centro (abertura) e à direita (perguntas), Ricardo
// à esquerda (x ≈ 0,2), Isabela em x ≈ 0,55; o zoom usa o rosto de quem fala como origem.
const DANILOW = {x: 0.5, y: 0.4};
const PERGUNTA = {x: 0.72, y: 0.4};
const RICARDO = {x: 0.24, y: 0.42};
const ISABELA = {x: 0.55, y: 0.43};

// Bordas medidas pela energia da voz (s da origem): "operação." termina em 59,45 e o "Boa!" vai de 59,85 a 60,05;
// "Isabela" começa em 60,35; "certeza." termina em 75,95; "Ó, já me siga" começa em 76,75; "investimento." termina
// em 89,15 (depois vem "Vai, boa!").
const TRECHOS: Trecho[] = [
	[0.9, 59.48],
	[60.3, 76.0],
	[76.7, 89.18],
];

const ESCALAS = [1.1, 1.2, 1.28, 1.14, 1.24, 1.06];
const punches = (b: Busca, frase: string, P: {x: number; y: number}, passo = 0.55, ocorrencia?: number): EfeitoCamera[] => {
	const lista: EfeitoCamera[] = [];
	let ultimo = -9;
	for (const t of b.tempos(frase, ocorrencia)) {
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
	extraFim: 2.6,
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
			{palavra: 'experiência', estilo: 'serif'},
			{palavra: 'mudança', estilo: 'serif'},
			{palavra: 'informação', estilo: 'serif'},
			{palavra: 'certeza', estilo: 'serif'},
		],
		falantes: (b) => [
			{de: b.at('Ricardo', 2) - 0.1, ate: b.say('para o Rio de Janeiro').fim + 0.1, nome: 'PERGUNTA'},
			{de: b.at('Cara') - 0.1, ate: b.say('na sua operação').fim + 0.1, nome: 'RICARDO'},
			{de: b.at('Isabela') - 0.1, ate: b.say('para estar num ambiente desse').fim + 0.1, nome: 'PERGUNTA'},
			{de: b.at('Com') - 0.1, ate: b.say('então com certeza').fim + 0.1, nome: 'ISABELA'},
		],
	},
	camera: (b) => {
		const z = (em: number, escala: number, P: {x: number; y: number}): EfeitoCamera => ({tipo: 'zoom', em, escala, ...P});
		return [
			// Gancho: o zoom acompanha o contador e bate no 500
			z(0, 1.12, DANILOW),
			z(b.at('anos'), 1.2, DANILOW),
			{tipo: 'flash', em: b.at('500') - 0.04},
			z(b.at('500'), 1.28, DANILOW),
			z(b.at('comunidade'), 1.1, DANILOW),
			...punches(b, 'Estamos aqui em Floripa, estou aqui com o Ricardo', DANILOW),
			// Pergunta: Danilow à direita, sem chicote (o plano é o mesmo e o pódio acabou de sair)
			z(b.at('Ricardo', 2), 1, PERGUNTA),
			...punches(b, 'como é a experiência, cara, de estar num evento com tanta gente vivendo do digital, vivendo o TikTok Shop', PERGUNTA, 0.7),
			z(b.at('bagagem'), 1.16, PERGUNTA),
			z(b.say('O que você leva de Floripa').inicio, 1.04, PERGUNTA),
			// Resposta do Ricardo: troca de falante = chicote
			{tipo: 'chicote', em: b.at('Cara')},
			z(b.at('Cara'), 1.06, RICARDO),
			...punches(b, 'a experiência de estar nesses eventos da MVM, já o nosso terceiro evento da MVM', RICARDO),
			...punches(b, 'e a cada evento que a gente volta para casa, a gente volta com energia renovada', RICARDO, 0.6),
			...punches(b, 'a mudança de ambiente, o que isso traz para a gente, agrega na nossa operação, toda vez é um insight novo', RICARDO),
			...punches(b, 'Então sempre que a gente volta, na semana que a gente volta para casa, a gente volta realmente com a bagagem com muita informação e pronto para aplicar', RICARDO),
			z(b.at('porque'), 1.08, RICARDO),
			// Pergunta à Isabela e resposta dela
			{tipo: 'chicote', em: b.at('Isabela')},
			z(b.at('Isabela'), 1, ISABELA),
			z(b.at('20'), 1.2, ISABELA),
			{tipo: 'chicote', em: b.at('Com')},
			...punches(b, 'Com certeza, porque como o Ricardo falou, a gente não está, não é gasto, é investimento', ISABELA),
			z(b.at('insight', 2), 1.06, ISABELA),
			// CTA
			{tipo: 'chicote', em: b.at('Ó')},
			...punches(b, 'Ó, já me siga aqui, Danilo, siga o Ricardo, siga a Isabela, siga o MVM, vamos para cima', DANILOW),
			...punches(b, 'e quem puder, sempre estar num ambiente desse, num evento, com pessoas que vivem no digital, faça esse investimento', DANILOW, 0.6),
		];
	},
	cenas: (b) => {
		const sempre = b.tempos('sempre um investimento');
		const fimFala = b.say('sempre um investimento').fim;
		return [
			// 1. Gancho: contador e gráfico de ouro crescendo → R$ 500 MILHÕES em 3D
			{
				tipo: 'peca',
				nome: 'v5Gancho',
				de: 0,
				ate: b.say('faturados na comunidade').fim + 0.2,
				dados: {anos: b.at('anos'), quinhentos: b.at('500') - 0.1, comunidade: b.at('comunidade')},
				esconderLegenda: true,
				som: 'pro_pop',
				sons: [{em: b.at('anos'), som: 'pro_tick', ganho: 0.6}],
			},
			// 2. Floripa, evento da MVM
			{
				tipo: 'chips',
				de: b.at('Floripa') - 0.05,
				ate: b.at('top') - 0.45,
				itens: [
					{texto: 'EVENTO MVM · FLORIPA', em: b.at('Floripa')},
					{texto: 'COM O RICARDO', em: b.at('Ricardo')},
				],
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
			},
			// 3. Top creator: pódio 3D de meia tela
			{
				tipo: 'peca',
				nome: 'v5TopCreator',
				de: b.at('top') - 0.35,
				ate: b.say('do TikTok Shop').fim + 0.55,
				dados: {top: b.at('top'), tiktok: b.at('TikTok')},
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [{em: b.at('top'), som: 'pro_pop', ganho: 0.6}],
			},
			// 4. A pergunta: viver do digital e a bagagem
			{
				tipo: 'chips',
				de: b.at('tanta') - 0.05,
				ate: b.say('O que você leva de Floripa').inicio - 0.15,
				itens: [
					{texto: 'TANTA GENTE VIVENDO DO DIGITAL', em: b.at('tanta')},
					{texto: 'O QUE VAI NA BAGAGEM?', em: b.at('bagagem')},
				],
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
			},
			// 5. Rota Floripa → Rio de Janeiro com o avião
			{
				tipo: 'peca',
				nome: 'v5Rota',
				de: b.say('O que você leva de Floripa').inicio - 0.1,
				ate: b.say('para o Rio de Janeiro').fim + 0.9,
				som: 'pro_aviao',
			},
			// 6. Terceiro evento da MVM
			{
				tipo: 'selo',
				de: b.at('terceiro') - 0.1,
				ate: b.say('terceiro evento da MVM').fim + 0.45,
				texto: '3º EVENTO',
				chip: 'MVM',
				emChip: b.at('terceiro'),
				y: 330,
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			// 7. Energia renovada: bateria enchendo
			{
				tipo: 'peca',
				nome: 'v5Bateria',
				de: b.at('cada') - 0.15,
				ate: b.say('com energia renovada').fim + 0.7,
				dados: {enche: b.at('cada'), renovada: b.at('renovada')},
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [{em: b.at('renovada'), som: 'pro_pop', ganho: 0.6}],
			},
			// 8. O que o ambiente traz
			{
				tipo: 'chips',
				de: b.at('mudança') - 0.05,
				ate: b.at('enxerga') - 0.35,
				itens: [
					{texto: 'MUDANÇA DE AMBIENTE', em: b.at('mudança')},
					{texto: 'AGREGA NA OPERAÇÃO', em: b.at('agrega')},
					{texto: 'UM INSIGHT NOVO', em: b.at('insight')},
				],
				y: 1080,
				numerado: true,
				esconderLegenda: true,
				som: 'pro_tick',
				sons: [
					{em: b.at('agrega'), som: 'pro_tick', ganho: 0.7},
					{em: b.at('insight'), som: 'pro_tick', ganho: 0.7},
				],
			},
			// 9. Frase-chave: GASTO e SUPÉRFLUO caem, INVESTIMENTO bate em ouro; os ganhos entram embaixo
			{
				tipo: 'peca',
				nome: 'v5Investimento',
				modo: 'cheia',
				de: b.at('enxerga') - 0.25,
				ate: b.say('um ambiente, entendeu').fim + 0.35,
				dados: {
					gasto: b.at('gasto'),
					superfluo: b.at('supérfluo'),
					investimento: b.at('investimento'),
					networking: b.at('networking'),
					amizade: b.at('amizade'),
					ambiente: b.at('ambiente', 2),
				},
				esconderLegenda: true,
				som: 'pro_whoosh',
				sons: [
					{em: b.at('gasto'), som: 'pro_tick', ganho: 0.6},
					{em: b.at('supérfluo'), som: 'pro_tick', ganho: 0.6},
					{em: b.at('investimento'), som: 'pro_pop', ganho: 0.8},
				],
			},
			// 10. A bagagem de volta para casa: cartas
			{
				tipo: 'cards3d',
				de: b.at('bagagem', 2) - 0.15,
				ate: b.at('tornar') - 0.3,
				itens: [
					{texto: 'BAGAGEM', em: b.at('bagagem', 2)},
					{texto: 'INFORMAÇÃO', em: b.at('informação')},
					{texto: 'APLICAR', em: b.at('aplicar')},
				],
				y: 1010,
				som: 'pro_pouso',
				sons: [
					{em: b.at('informação'), som: 'pro_pouso', ganho: 0.8},
					{em: b.at('aplicar'), som: 'pro_pouso', ganho: 0.8},
				],
			},
			// 11. Obeso intelectual: cérebro pesado e lento → sem prática (tela cheia)
			{
				tipo: 'peca',
				nome: 'v5Obeso',
				modo: 'cheia',
				de: b.at('tornar') - 0.15,
				ate: b.say('na sua operação').fim + 0.3,
				dados: {obeso: b.at('obeso'), intelectual: b.at('intelectual'), praticar: b.at('praticar'), adiantar: b.at('adiantar')},
				esconderLegenda: true,
				som: 'pro_whoosh',
				sons: [
					{em: b.at('obeso'), som: 'pro_pouso', ganho: 0.7},
					{em: b.at('praticar'), som: 'pro_tick', ganho: 0.6},
				],
			},
			// 12. Pergunta à Isabela: R$ 20 mil em prata
			{
				tipo: 'numero3d',
				de: b.at('20') - 0.2,
				ate: b.say('para estar num ambiente desse').fim + 0.2,
				texto: 'R$ 20 MIL',
				rotulo: 'VOCÊ INVESTIRIA?',
				metal: 'branco',
				em: b.at('20') - 0.1,
				esconderLegenda: true,
				som: 'pro_pop',
			},
			// 13. Resposta da Isabela: o ciclo do evento
			{
				tipo: 'peca',
				nome: 'v5Ciclo',
				de: b.at('insight', 2) - 0.2,
				ate: b.say('então com certeza').fim + 0.3,
				dados: {
					itens: [
						{texto: 'INSIGHT', em: b.at('insight', 2)},
						{texto: 'OS MELHORES', em: b.at('melhores')},
						{texto: 'APRENDE', em: b.at('aprende')},
						{texto: 'APLICA', em: b.at('aplica')},
					],
				},
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [
					{em: b.at('melhores'), som: 'pro_tick', ganho: 0.6},
					{em: b.at('aprende'), som: 'pro_tick', ganho: 0.6},
					{em: b.at('aplica'), som: 'pro_tick', ganho: 0.6},
				],
			},
			// 14. CTA: siga cada um
			{
				tipo: 'siga',
				de: b.at('siga') - 0.05,
				ate: b.say('vamos para cima').fim + 0.25,
				itens: [
					{texto: 'DANILOW', em: b.at('Danilo')},
					{texto: 'RICARDO', em: b.say('siga o Ricardo').inicio},
					{texto: 'ISABELA', em: b.say('siga a Isabela').inicio},
					{texto: 'MVM', em: b.say('siga o MVM').inicio},
				],
				y: 1040,
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [
					{em: b.say('siga o Ricardo').inicio, som: 'pro_swipe', ganho: 0.6},
					{em: b.say('siga a Isabela').inicio, som: 'pro_swipe', ganho: 0.6},
					{em: b.say('siga o MVM').inicio, som: 'pro_swipe', ganho: 0.6},
				],
			},
			// 15. Esteja nesse ambiente
			{
				tipo: 'chips',
				de: b.at('puder') - 0.1,
				ate: b.at('faça') - 0.3,
				itens: [
					{texto: 'NUM EVENTO', em: b.say('num evento', 2).inicio},
					{texto: 'COM QUEM VIVE DO DIGITAL', em: b.at('pessoas')},
				],
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
			},
			// 16. Fecho: nunca é gasto, sempre investimento
			{
				tipo: 'frase',
				de: b.at('faça') - 0.05,
				ate: fimFala + 0.6,
				palavras: [
					{texto: 'NUNCA É GASTO', em: b.say('nunca vai ser gasto').inicio},
					{texto: 'SEMPRE', em: sempre[0]},
					{texto: 'INVESTIMENTO', em: sempre[2], destaque: true},
				],
				som: 'pro_frase',
			},
			// 17. Cartão final
			{tipo: 'final', de: fimFala + 0.65, ate: fimFala + 2.95, marca: 'MVM', linha2: 'CREATORS', sub: 'EVENTO EM FLORIPA', tres: true, som: 'pro_logo'},
		];
	},
};
