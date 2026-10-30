import type {EfeitoCamera, Edit} from '../../motor/plano';
import type {Busca, Trecho} from '../../motor/palavras';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// Entrevista 3, vídeo 11 (tema Entrevista): Danilow entrevista o Raposão, que perdeu R$ 160 mil no trade e hoje faz live.
// Fonte 11.MOV + 11.1.MOV (4K HDR do iPhone) juntados e convertidos para 1440x2560 SDR 30 qps (scripts/converter-entrevista-3.sh).
// Roteiro: gancho -R$ 160 MIL → hoje live no TikTok Shop, zero barreira, celular e internet → Raposão → pergunta (o código
// pro iniciante) → R$ 100: luz de 30 + tripé de 30 → marca parceira MVM, escalar, volume → corrigir rápido, volume ×4 →
// pergunta CLT → medo de perder a segurança → sair do trabalho e rodar live até o próximo turno → sempre deu certo →
// "não é fácil, mas é muito simples" → CTA (dúvida, siga) → cartão final. Corta a 2ª tomada do CTA e o "só precisa de um celular".
// Posição do rosto sem medir: zoom no centro e no máximo 1,3; conferir no Studio.
const P = {x: 0.5, y: 0.3};

const F = {
	gancho: ['Ele perdeu 160 mil reais', 'um celular e internet'],
	apresenta: ['Tô aqui com o Raposão', 'Tô aqui com o Raposão'],
	pergunta: ['Raposão, fala pra gente', 'dá pro iniciante começar'],
	resposta1: ['eu só tinha 100 reais', 'e comecei a gravar'],
	resposta2: ['Foi só isso, eu peguei', 'eu aumentei o volume'],
	resposta3: ['você já corrige seu erro rápido', 'jogar volume, volume, volume, volume'],
	pergunta2: ['E hoje você acha que compensa', 'tá travada no CLT'],
	pergunta2b: ['pegar um celular, abrir a live', 'abrir a live ali no TikTok Shop'],
	clt: ['se eu fosse CLT hoje', 'ia rodar o dia inteiro'],
	clt2: ['até o próximo turno do trabalho', 'até o próximo turno do trabalho'],
	certo: ['sempre deu certo, muito certo', 'sempre deu certo, muito certo'],
	sintese: ['não é fácil, mas é muito simples', 'não é fácil, mas é muito simples'],
	duvida: ['Tá com alguma dúvida', 'Deixa nos comentários'],
	siga: ['Me siga Danilo', 'e vamos que vamos'],
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

export const entrevista3V11: Edit = {
	pasta: 'projetos/entrevista-3-v11',
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
			{palavra: 'trade', estilo: 'serif'},
			{palavra: 'escalar', estilo: 'serif'},
			{palavra: 'segurança', estilo: 'serif'},
			{palavra: 'certo', estilo: 'serif'},
		],
		falantes: (b) => [
			{de: ini(b, 'pergunta') - 0.1, ate: fim(b, 'pergunta') + 0.1, nome: 'PERGUNTA'},
			{de: fim(b, 'pergunta') + 0.1, ate: fim(b, 'resposta3') + 0.1, nome: 'RAPOSÃO'},
			{de: ini(b, 'pergunta2') - 0.1, ate: fim(b, 'pergunta2b') + 0.1, nome: 'PERGUNTA'},
			{de: fim(b, 'pergunta2b') + 0.1, ate: fim(b, 'certo') + 0.1, nome: 'RAPOSÃO'},
		],
	},
	camera: (b) => {
		const z = (em: number, escala: number): EfeitoCamera => ({tipo: 'zoom', em, escala, ...P});
		return [
			// Gancho: clarão na batida do número
			z(0, 1.15),
			{tipo: 'flash', em: b.at('160') - 0.04},
			z(b.at('160'), 1.28),
			z(b.at('trade,'), 1.1),
			z(b.at('hoje'), 1.2),
			z(b.at('live,'), 1.26),
			z(b.at('zero'), 1.12),
			z(b.at('celular'), 1.22),
			{tipo: 'chicote', em: ini(b, 'apresenta')},
			z(ini(b, 'apresenta'), 1.08),
			z(b.at('código'), 1.18),
			z(b.at('iniciante'), 1.26),
			{tipo: 'chicote', em: ini(b, 'resposta1')},
			...punches(b, 'eu só tinha 100 reais, eu comprei uma luz de 30 e comprei um tripé de 30 e comecei a gravar', 0.55),
			...punches(b, 'Foi só isso, eu peguei uma marca parceira do MVM, que me dava uma posição boa, e comecei a escalar, e eu aumentei o volume', 0.55),
			...punches(b, 'você já corrige seu erro rápido, e vai no que tá dando certo e começa a jogar volume, volume, volume, volume', 0.45),
			{tipo: 'chicote', em: ini(b, 'pergunta2')},
			z(ini(b, 'pergunta2'), 1),
			z(b.at('compensa'), 1.12),
			z(ini(b, 'pergunta2b'), 1.06),
			z(b.at('abrir'), 1.18),
			{tipo: 'chicote', em: ini(b, 'clt')},
			...punches(b, 'se eu fosse CLT hoje e não tivesse tempo e tivesse medo de perder a minha segurança', 0.55),
			...punches(b, 'A primeira coisa que eu faria é pegar, sair do trabalho, ia rodar o dia inteiro até o próximo turno do trabalho', 0.55),
			z(ini(b, 'certo'), 1.14),
			z(b.say('muito certo').inicio, 1.26),
			{tipo: 'chicote', em: ini(b, 'sintese')},
			z(ini(b, 'sintese'), 1),
			{tipo: 'flash', em: b.at('simples,') - 0.04},
			z(b.at('simples,'), 1.25),
			z(ini(b, 'duvida'), 1.06),
			z(b.at('comentários.'), 1.16),
			z(ini(b, 'siga'), 1.08),
			z(b.say('siga o Raposão').inicio, 1.18),
			z(b.say('siga o MVM').inicio, 1.26),
			z(b.say('vamos que vamos').inicio, 1.12),
		];
	},
	cenas: (b) => {
		const fimFala = fim(b, 'siga');
		return [
			// 1. Gancho: a perda em prata 3D (o "antes")
			{
				tipo: 'numero3d',
				de: 0,
				ate: b.at('hoje') - 0.06,
				texto: '-R$ 160 MIL',
				rotulo: 'RAPOSÃO',
				abaixo: 'PERDEU NO TRADE',
				metal: 'branco',
				em: b.at('160') - 0.2,
				esconderLegenda: true,
				som: 'pro_pop',
			},
			// 2. A virada: hoje live no TikTok Shop, selo que acende o chip LIVE
			{
				tipo: 'selo',
				de: b.at('hoje') - 0.04,
				ate: b.at('zero') - 0.08,
				texto: 'TIKTOK SHOP',
				chip: 'LIVE',
				emChip: b.at('live,'),
				y: 330,
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			// 3. Zero barreira de entrada
			{
				tipo: 'chips',
				de: b.at('zero') - 0.05,
				ate: b.at('precisa') - 0.1,
				itens: [{texto: 'ZERO BARREIRA DE ENTRADA', em: b.at('zero')}],
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
			},
			// 4. Um celular e internet: celular 3D em tela cheia
			{
				tipo: 'celular3d',
				de: b.at('precisa') - 0.1,
				ate: fim(b, 'gancho') + 0.12,
				linhas: [
					{texto: 'UM CELULAR', em: b.at('celular')},
					{texto: '+ INTERNET', em: b.at('internet.')},
				],
				som: 'pro_whoosh',
			},
			// 5. Apresentação: nome na pílula
			{
				tipo: 'pilula',
				de: ini(b, 'apresenta') + 0.05,
				ate: ini(b, 'pergunta') - 0.05,
				rotulo: 'CONVIDADO',
				nome: 'Raposão',
				y: 1060,
				esconderLegenda: true,
				som: 'pro_tick',
			},
			// 6. Pergunta: o código pro iniciante
			{
				tipo: 'frase',
				de: b.at('código') - 0.05,
				ate: fim(b, 'pergunta') + 0.12,
				palavras: [
					{texto: 'O CÓDIGO', em: b.at('código')},
					{texto: 'PRO INICIANTE', em: b.at('iniciante'), destaque: true},
				],
				som: 'pro_frase',
			},
			// 7. Começou com R$ 100
			{
				tipo: 'numero3d',
				de: ini(b, 'resposta1') - 0.05,
				ate: b.at('luz') - 0.12,
				texto: 'R$ 100',
				rotulo: 'SÓ TINHA',
				metal: 'branco',
				em: b.at('100'),
				esconderLegenda: true,
				som: 'pro_pop',
			},
			// 8. O kit: cartas 3D em leque, uma por item
			{
				tipo: 'cards3d',
				de: b.at('luz') - 0.1,
				ate: fim(b, 'resposta1') + 0.1,
				itens: [
					{texto: 'LUZ R$ 30', em: b.at('luz')},
					{texto: 'TRIPÉ R$ 30', em: b.at('tripé')},
					{texto: 'GRAVAR', em: b.at('gravar.')},
				],
				y: 1010,
				som: 'pro_pouso',
				sons: [{em: b.at('tripé'), som: 'pro_pouso', ganho: 0.8}],
			},
			// 9. Marca parceira do MVM
			{
				tipo: 'selo',
				de: b.at('marca') - 0.1,
				ate: b.at('escalar,') - 0.1,
				texto: 'MARCA PARCEIRA',
				chip: 'MVM',
				emChip: b.at('MVM,'),
				y: 330,
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			// 10. Escalar e aumentar o volume
			{
				tipo: 'chips',
				de: b.at('escalar,') - 0.05,
				ate: fim(b, 'resposta2') + 0.1,
				itens: [
					{texto: 'ESCALAR', em: b.at('escalar,')},
					{texto: '+ VOLUME', em: b.at('aumentei')},
				],
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
				sons: [{em: b.at('aumentei'), som: 'pro_tick', ganho: 0.7}],
			},
			// 11. Corrige rápido e vai no que dá certo
			{
				tipo: 'chips',
				de: ini(b, 'resposta3') - 0.05,
				ate: b.at('jogar') - 0.08,
				itens: [
					{texto: 'CORRIGE O ERRO RÁPIDO', em: b.at('corrige')},
					{texto: 'VAI NO QUE DÁ CERTO', em: b.say('vai no que tá dando certo').inicio},
				],
				numerado: true,
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
			},
			// 12. "volume, volume, volume, volume": a palavra empilha no ritmo da fala
			{
				tipo: 'frase',
				de: b.at('jogar') - 0.05,
				ate: fim(b, 'resposta3') + 0.25,
				palavras: b.tempos('volume, volume, volume, volume').map((em, i) => ({texto: 'VOLUME', em, destaque: i === 3})),
				som: 'pro_frase',
			},
			// 13. Pergunta: travado no CLT (grades e cadeado)
			{
				tipo: 'presoClt',
				de: b.at('pessoa') - 0.1,
				ate: fim(b, 'pergunta2') + 0.1,
				em: b.at('travada'),
				emCadeado: b.at('CLT,'),
				texto: 'TRAVADO NA',
				som: 'pro_pouso',
			},
			// 14. "pegar um celular, abrir a live": a interface da live entra e sai antes da resposta
			{
				tipo: 'live',
				de: ini(b, 'pergunta2b') - 0.05,
				ate: fim(b, 'pergunta2b') + 0.08,
				host: 'raposao',
				espectadores: '1,2 mil',
				coracoes: true,
				som: 'pro_swipe',
			},
			// 15. Medo de perder a segurança: pessoa presa no medo + texto 3D
			{
				tipo: 'medo3d',
				de: b.at('medo') - 0.1,
				ate: b.at('primeira') - 0.1,
				linhas: [
					{texto: 'MEDO DE PERDER', em: b.at('medo'), metal: 'cinza'},
					{texto: 'A SEGURANÇA', em: b.at('segurança,'), metal: 'ouro'},
				],
				pessoa: true,
				som: 'pro_frase',
			},
			// 16. O plano dele: passos numerados
			{
				tipo: 'chips',
				de: b.at('sair') - 0.05,
				ate: fim(b, 'clt2') + 0.1,
				itens: [
					{texto: 'SAI DO TRABALHO', em: b.at('sair')},
					{texto: 'LIVE O DIA INTEIRO', em: b.at('rodar')},
					{texto: 'ATÉ O PRÓXIMO TURNO', em: b.at('turno')},
				],
				numerado: true,
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
				sons: [{em: b.at('turno'), som: 'pro_tick', ganho: 0.7}],
			},
			// 17. "sempre deu certo": a pílula da live acende
			{
				tipo: 'aovivo',
				de: ini(b, 'certo') - 0.05,
				ate: fim(b, 'certo') + 0.1,
				texto: 'SEMPRE DEU CERTO',
				som: 'pro_pulso',
			},
			// 18. Síntese
			{
				tipo: 'frase',
				de: ini(b, 'sintese') - 0.05,
				ate: fim(b, 'sintese') + 0.15,
				palavras: [
					{texto: 'NÃO É FÁCIL', em: ini(b, 'sintese')},
					{texto: 'É MUITO SIMPLES', em: b.at('simples,'), destaque: true},
				],
				som: 'pro_frase',
			},
			// 19. CTA: caixa de comentário e siga cada um
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
				ate: fimFala + 0.05,
				itens: [
					{texto: 'DANILOW', em: b.at('Danilo,')},
					{texto: 'RAPOSÃO', em: b.say('siga o Raposão').inicio},
					{texto: 'MVM', em: b.say('siga o MVM').inicio},
				],
				y: 1040,
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [{em: b.say('siga o MVM').inicio, som: 'pro_swipe', ganho: 0.7}],
			},
			// 20. Cartão final
			{tipo: 'final', de: fimFala + 0.1, ate: fimFala + 2.4, marca: 'MVM', linha2: 'CREATORS', sub: 'LIVE NO TIKTOK SHOP', tres: true, som: 'pro_logo'},
		];
	},
};
