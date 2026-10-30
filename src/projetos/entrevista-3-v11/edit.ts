import type {EfeitoCamera, Edit} from '../../motor/plano';
import type {Busca, Trecho} from '../../motor/palavras';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// Entrevista 3, vídeo 11 (tema Entrevista): Danilow entrevista o Raposão, que perdeu R$ 160 mil no trade e hoje faz live.
// Fonte 11.MOV + 11.1.MOV (4K HDR do iPhone) juntados e convertidos para 1440x2560 SDR 30 qps (scripts/converter-entrevista-3.sh).
// O vídeo juntado tem 1,1 s de silêncio na emenda (76,1–77,2 s): as palavras do 11.1 foram adiantadas 1,1 s na transcrição.
// Revisão de 30/10: sem limite de tempo; a resposta inteira (escalar, ver o que dá errado, corrigir), a pergunta inteira
// (corrida dos ratos, vale a pena?), o plano da CLT inteiro e o "só precisa de um celular" voltaram. CTA com a tomada do 11.1,
// que cita Danilow, Raposão e MVM.
// Roteiro: gancho (gráfico do trade despencando → -R$ 160 MIL → vira ouro: hoje live no TikTok Shop) → zero barreira (v7) →
// celular e internet (v7) → Raposão → o código pro iniciante (teclado de cofre) → R$ 100: luz e tripé → marca parceira,
// escalar, corrigir, volume ×4 → pergunta CLT / corrida dos ratos / celular 3D / live → medo de perder a segurança → sair do
// trabalho e rodar live → sempre deu certo → "não é fácil, é muito simples" → só precisa de celular (vendas chegando) → CTA.
const P = {x: 0.5, y: 0.4};

const F = {
	gancho: ['Ele perdeu 160 mil reais', 'um celular e internet'],
	apresenta: ['Tô aqui com o Raposão', 'Tô aqui com o Raposão'],
	pergunta: ['Raposão, fala pra gente', 'dá pro iniciante começar'],
	// "Cara, pro iniciante começar," repete a pergunta: a resposta entra em "eu comecei".
	resposta1: ['eu comecei, eu só tinha', 'e comecei a gravar'],
	resposta2: ['Foi só isso, eu peguei', 'Foi assim que funcionou pra mim'],
	pergunta2: ['E hoje você acha que compensa', 'você acha que vale a pena'],
	clt: ['Cara, se eu fosse CLT', 'ia pegar firme'],
	certo: ['Porque todas as vezes que eu fiz isso', 'sempre deu certo, muito certo'],
	sintese: ['não é fácil, mas é muito simples', 'não é fácil, mas é muito simples'],
	precisa: ['Só precisa de um celular', 'e começar a vender'],
	duvida: ['Tá com alguma dúvida', 'Deixa nos comentários'],
	siga: ['Me siga Danilow', 'tem mudado vidas'],
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
			{palavra: 'ratos', estilo: 'serif'},
			{palavra: 'segurança', estilo: 'serif'},
			{palavra: 'vender', estilo: 'serif'},
		],
		falantes: (b) => [
			{de: ini(b, 'pergunta') - 0.1, ate: fim(b, 'pergunta') + 0.1, nome: 'PERGUNTA'},
			{de: fim(b, 'pergunta') + 0.1, ate: fim(b, 'resposta2') + 0.1, nome: 'RAPOSÃO'},
			{de: ini(b, 'pergunta2') - 0.1, ate: fim(b, 'pergunta2') + 0.1, nome: 'PERGUNTA'},
			{de: fim(b, 'pergunta2') + 0.1, ate: fim(b, 'certo') + 0.1, nome: 'RAPOSÃO'},
		],
	},
	camera: (b) => {
		const z = (em: number, escala: number): EfeitoCamera => ({tipo: 'zoom', em, escala, ...P});
		return [
			// Gancho: tremor no "160", clarão na virada para o TikTok Shop
			z(0, 1.15),
			z(b.at('160'), 1.28),
			z(b.at('trade,'), 1.12),
			{tipo: 'flash', em: b.at('hoje') - 0.04},
			z(b.at('hoje'), 1.2),
			z(b.at('live,'), 1.26),
			{tipo: 'chicote', em: ini(b, 'apresenta')},
			z(ini(b, 'apresenta'), 1.08),
			z(b.at('código'), 1.18),
			z(b.at('iniciante'), 1.24),
			{tipo: 'chicote', em: ini(b, 'resposta1')},
			...punches(b, 'eu comecei, eu só tinha 100 reais, eu comprei uma luz de 30 e comprei um tripé de 30 e comecei a gravar', 0.55),
			...punches(b, 'Foi só isso, eu peguei uma marca parceira do MVM, que me dava uma posição boa, e comecei a escalar, e eu aumentei o volume', 0.55),
			...punches(b, 'Então quando você começa a escalar, começa a ver que algumas coisas estão dando errado', 0.55),
			...punches(b, 'você já corrige seu erro rápido, e vai no que tá dando certo e começa a jogar volume, volume, volume, volume', 0.45),
			z(b.say('Foi assim que funcionou pra mim').inicio, 1.1),
			{tipo: 'chicote', em: ini(b, 'pergunta2')},
			z(ini(b, 'pergunta2'), 1),
			z(b.at('compensa'), 1.12),
			z(b.at('ratos,'), 1.06),
			z(b.at('abrir'), 1.18),
			z(b.say('vale a pena').inicio, 1.08),
			{tipo: 'chicote', em: ini(b, 'clt')},
			...punches(b, 'se eu fosse CLT hoje e não tivesse tempo e tivesse medo de perder a minha segurança', 0.55),
			...punches(b, 'A primeira coisa que eu faria é pegar, sair do trabalho, ia rodar o dia inteiro até o dia seguinte, até o próximo turno do trabalho, ia pegar firme', 0.55),
			...punches(b, 'Porque todas as vezes que eu fiz isso já, rodando live', 0.6),
			z(b.say('sempre deu certo').inicio, 1.14),
			z(b.say('muito certo').inicio, 1.26),
			{tipo: 'chicote', em: ini(b, 'sintese')},
			z(ini(b, 'sintese'), 1),
			{tipo: 'flash', em: b.at('simples,') - 0.04},
			z(b.at('simples,'), 1.25),
			z(ini(b, 'precisa'), 1.06),
			z(b.say('ligar a live').inicio, 1.16),
			z(b.at('vender.'), 1.24),
			z(ini(b, 'duvida'), 1.06),
			z(b.at('comentários.'), 1.16),
			z(ini(b, 'siga'), 1.08),
			z(b.say('siga o Raposão').inicio, 1.18),
			z(b.say('siga o MVM').inicio, 1.26),
			z(b.say('mudado vidas').inicio, 1.12),
		];
	},
	cenas: (b) => {
		const fimFala = fim(b, 'siga');
		return [
			// 1. Gancho: gráfico do trade despencando, contador até -R$ 160 MIL, notas caindo; vira ouro em "hoje" (LIVE)
			{
				tipo: 'peca',
				nome: 'v11Gancho',
				de: 0,
				ate: b.at('zero') - 0.06,
				dados: {numero: b.at('160'), virada: b.at('hoje'), live: b.at('live,')},
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
				sons: [
					{em: b.at('160') + 0.35, som: 'pro_quebra', ganho: 0.7},
					{em: b.at('hoje'), som: 'pro_swipe', ganho: 0.8},
					{em: b.at('live,'), som: 'pro_pop', ganho: 0.7},
				],
			},
			// 2. Zero barreira de entrada: a parede quebra (motion do v7)
			{
				tipo: 'peca',
				nome: 'v7ZeroBarreira',
				modo: 'cheia',
				de: b.at('zero') - 0.06,
				ate: b.at('precisa') - 0.06,
				dados: {quebra: b.at('barreira')},
				esconderLegenda: true,
			},
			// 3. Um celular e internet (motion do v7)
			{
				tipo: 'peca',
				nome: 'v7CelularInternet',
				modo: 'cheia',
				de: b.at('precisa') - 0.06,
				ate: fim(b, 'gancho') + 0.7,
				dados: {celular: b.at('celular'), internet: b.at('internet.')},
				esconderLegenda: true,
			},
			// 4. Apresentação: nome na pílula
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
			// 5. Pergunta: o código pro iniciante (teclado de cofre que destrava)
			{
				tipo: 'peca',
				nome: 'v11Codigo',
				de: b.at('código') - 0.1,
				ate: fim(b, 'pergunta') + 0.6,
				dados: {codigo: b.at('código'), iniciante: b.at('iniciante')},
				esconderLegenda: true,
				som: 'pro_digita',
				sons: [{em: b.at('iniciante'), som: 'pro_pop', ganho: 0.7}],
			},
			// 6. Começou com R$ 100
			{
				tipo: 'numero3d',
				de: b.at('só') - 0.05,
				ate: b.at('luz') - 0.12,
				texto: 'R$ 100',
				rotulo: 'SÓ TINHA',
				metal: 'branco',
				em: b.at('100'),
				esconderLegenda: true,
				som: 'pro_pop',
			},
			// 7. O kit: cartas 3D em leque, uma por item
			{
				tipo: 'cards3d',
				de: b.at('luz') - 0.1,
				ate: b.say('e comecei a gravar').fim + 0.75,
				itens: [
					{texto: 'LUZ R$ 30', em: b.at('luz')},
					{texto: 'TRIPÉ R$ 30', em: b.at('tripé')},
					{texto: 'GRAVAR', em: b.at('gravar.')},
				],
				y: 1010,
				som: 'pro_pouso',
				sons: [{em: b.at('tripé'), som: 'pro_pouso', ganho: 0.8}],
			},
			// 8. Marca parceira do MVM
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
			// 9. Escalar e aumentar o volume
			{
				tipo: 'chips',
				de: b.at('escalar,') - 0.05,
				ate: b.say('eu aumentei o volume').fim + 0.6,
				itens: [
					{texto: 'ESCALAR', em: b.at('escalar,')},
					{texto: '+ VOLUME', em: b.at('aumentei')},
				],
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
				sons: [{em: b.at('aumentei'), som: 'pro_tick', ganho: 0.7}],
			},
			// 10. Vê o que dá errado, corrige rápido, vai no que dá certo
			{
				tipo: 'chips',
				de: b.at('errado,') - 0.3,
				ate: b.at('jogar') - 0.08,
				itens: [
					{texto: 'VÊ O QUE DÁ ERRADO', em: b.at('errado,') - 0.2},
					{texto: 'CORRIGE RÁPIDO', em: b.at('corrige')},
					{texto: 'VAI NO QUE DÁ CERTO', em: b.say('vai no que tá dando certo').inicio},
				],
				numerado: true,
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
			},
			// 11. "volume, volume, volume, volume": a palavra empilha no ritmo da fala
			{
				tipo: 'frase',
				de: b.at('jogar') - 0.05,
				ate: b.say('volume, volume, volume, volume').fim + 0.65,
				palavras: b.tempos('volume, volume, volume, volume').map((em, i) => ({texto: 'VOLUME', em, destaque: i === 3})),
				som: 'pro_frase',
			},
			// 12. Pergunta: travado no CLT, preso na corrida dos ratos (grades e cadeado)
			{
				tipo: 'presoClt',
				de: b.at('pessoa') - 0.1,
				ate: b.say('pegar um celular').inicio - 0.08,
				em: b.at('travada'),
				emCadeado: b.at('CLT,'),
				texto: 'TRAVADO NA',
				som: 'pro_pouso',
			},
			// 13. "pegar um celular": celular 3D sobe ao lado dele
			{
				tipo: 'peca',
				nome: 'v11Celular',
				de: b.say('pegar um celular').inicio - 0.08,
				ate: b.at('abrir') - 0.05,
				dados: {x: 800},
				som: 'pro_whoosh',
			},
			// 14. "abrir a live": a interface da live entra e sai antes de "vale a pena"
			{
				tipo: 'live',
				de: b.at('abrir') - 0.05,
				ate: b.say('vale a pena').inicio - 0.05,
				host: 'raposao',
				espectadores: '1,2 mil',
				coracoes: true,
				som: 'pro_swipe',
			},
			// 15. Medo de perder a segurança: pessoa presa no medo, texto 3D acima dela
			{
				tipo: 'medo3d',
				de: b.at('medo') - 0.1,
				ate: b.at('primeira') - 0.1,
				linhas: [
					{texto: 'MEDO DE PERDER', em: b.at('medo'), metal: 'cinza'},
					{texto: 'A SEGURANÇA', em: b.at('segurança,'), metal: 'ouro'},
				],
				y: 300,
				pessoa: true,
				som: 'pro_frase',
			},
			// 16. O plano dele: passos numerados
			{
				tipo: 'chips',
				de: b.at('sair') - 0.05,
				ate: b.at('firme.') + 0.4,
				itens: [
					{texto: 'SAI DO TRABALHO', em: b.at('sair')},
					{texto: 'LIVE ATÉ O DIA SEGUINTE', em: b.at('rodar')},
					{texto: 'ATÉ O PRÓXIMO TURNO', em: b.at('turno')},
				],
				numerado: true,
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
				sons: [{em: b.at('turno'), som: 'pro_tick', ganho: 0.7}],
			},
			// 17. "sempre deu certo": título 3D em ouro acima da cabeça
			{
				tipo: 'peca',
				nome: 'v11Titulo',
				de: b.say('sempre deu certo').inicio - 0.05,
				ate: fim(b, 'certo') + 0.08,
				dados: {texto: 'SEMPRE DEU CERTO'},
				som: 'pro_pop',
			},
			// 18. Síntese
			{
				tipo: 'frase',
				de: ini(b, 'sintese') - 0.05,
				ate: b.say('muito simples').fim + 0.6,
				palavras: [
					{texto: 'NÃO É FÁCIL', em: ini(b, 'sintese')},
					{texto: 'É MUITO SIMPLES', em: b.at('simples,'), destaque: true},
				],
				som: 'pro_frase',
			},
			// 19. "ligar a live e começar a vender": as vendas chegando
			{
				tipo: 'notificacoes',
				de: b.say('ligar a live').inicio - 0.1,
				ate: fim(b, 'precisa') + 0.7,
				itens: [
					{titulo: 'TikTok Shop', texto: 'Live iniciada · 1,2 mil assistindo', em: b.say('ligar a live').inicio},
					{titulo: 'Nova venda', texto: 'Pedido confirmado · R$ 89,90', em: b.at('vender.') - 0.25},
				],
				y: 300,
				icone: 'sacola',
				som: 'pro_msg',
				somItem: 'pro_msg',
				ganhoItem: 0.5,
			},
			// 20. CTA: caixa de comentário e siga cada um (tomada do 11.1, que cita os três)
			{
				tipo: 'comentario',
				de: ini(b, 'duvida') - 0.05,
				ate: fim(b, 'duvida') + 0.6,
				texto: 'Tenho uma dúvida...',
				y: 1060,
				som: 'pro_digita',
			},
			{
				tipo: 'siga',
				de: ini(b, 'siga') - 0.05,
				ate: fimFala + 0.05,
				itens: [
					{texto: 'DANILOW', em: b.at('Danilow,')},
					{texto: 'RAPOSÃO', em: b.say('siga o Raposão').inicio},
					{texto: 'MVM', em: b.say('siga o MVM').inicio},
				],
				y: 1040,
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [{em: b.say('siga o MVM').inicio, som: 'pro_swipe', ganho: 0.7}],
			},
			// 21. Cartão final
			{tipo: 'final', de: fimFala + 0.1, ate: fimFala + 2.4, marca: 'MVM', linha2: 'CREATORS', sub: 'O TIKTOK SHOP MUDA VIDAS', tres: true, som: 'pro_logo'},
		];
	},
};
