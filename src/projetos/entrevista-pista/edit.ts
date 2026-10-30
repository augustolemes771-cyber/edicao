import type {EfeitoCamera, Edit} from '../../motor/plano';
import type {Busca, Trecho} from '../../motor/palavras';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// Entrevista na pista (tema Entrevista): Danilow (live) × Ferreto (IA), os dois com 10 milhões no TikTok Shop.
// Fontes IMG_5316, IMG_5317, IMG_5319 e IMG_5320 (4K HDR do iPhone, juntados na ordem e convertidos para SDR).
// Roteiro (só a tomada boa de cada fala): gancho 10 MILHÕES × 2 → ponto positivo da live → ponto positivo da IA →
// ponto negativo da live (a família pede dinheiro) → ponto negativo da IA ("a vantagem negativa") → agradecimentos,
// siga cada um → CTA do MVM Creators → cartão final.
// Duração: o usuário liberou passar de 59 s neste vídeo (30/10/2026); corta só pausas e tomadas repetidas.
// Pausas medidas pela energia da voz (gravação ao ar livre, ver aprendizado do tema).
// Pontos de zoom = rosto de quem fala (fração do quadro), medidos numa folha de quadros: câmera na mão, cada trecho tem o seu.
// Danilow de camiseta branca, Ferreto de preto com boné, entrevistador de bege.
const POS = {
	ganchoDanilow: {x: 0.25, y: 0.29}, // 0–4 s do original
	ganchoFerreto: {x: 0.66, y: 0.28}, // 4–8 s
	pergunta1: {x: 0.85, y: 0.22}, // 10–15 s
	resposta1: {x: 0.33, y: 0.27}, // 16–23 s
	pergunta2: {x: 0.2, y: 0.3}, // 39–44 s
	resposta2: {x: 0.55, y: 0.23}, // 44–48 s
	pergunta3: {x: 0.66, y: 0.31}, // 49–54 s
	resposta3: {x: 0.42, y: 0.29}, // 94–101 s
	pergunta4: {x: 0.4, y: 0.3}, // 102–108 s: o entrevistador fica na borda, plano entre os dois
	resposta4: {x: 0.6, y: 0.23}, // 110–113 s
	resposta4b: {x: 0.52, y: 0.33}, // 113–124 s: a câmera abre
	todos: {x: 0.48, y: 0.32}, // 126–134 s, os três lado a lado
	sigaDanilow: {x: 0.32, y: 0.32},
	sigaFerreto: {x: 0.66, y: 0.31},
	cta: {x: 0.46, y: 0.26}, // 167–176 s
};
// Câmera alta: o rosto desce e abre espaço para o 3D no topo.
const baixo = (p: {x: number; y: number}) => ({x: p.x, y: Math.max(0.18, p.y - 0.18)});

// Frases de cada trecho, no tempo original (as âncoras dos trechos e da câmera usam as mesmas).
const F = {
	gancho1: ['Eu estou aqui com o Danilow', 'só com live'],
	gancho2: ['E aqui, Ferreto, mais de 10 milhões', 'faturados só com IA'],
	pergunta1: ['Danilow, qual você considera', 'de fazer live shopping no TikTok Shop'],
	resposta1: ['Tudo que você precisa', 'Zero barreira de entrada'],
	pergunta2: ['E você, Ferreto, qual você considera', 'qual você considera os pontos positivos de trabalhar com IA no TikTok Shop'],
	resposta2: ['Você não precisa aparecer, você', 'também não precisa ter estoque'],
	pergunta3: ['Agora, para o Danilow', 'negativos de fazer live shopping no TikTok Shop'],
	resposta3: ['Um ponto negativo', 'pedir dinheiro emprestado'],
	pergunta4: ['Agora você, Ferreto', 'negativos de trabalhar com IA no TikTok Shop'],
	resposta4: ['Você vai querer ficar só viajando', 'Essa é a vantagem negativa'],
	obrigado: ['Obrigado, TikTok Shop', 'Siga o Ferreto para aprender com IA'],
	// O CTA foi gravado várias vezes: só a tomada boa segue com "Ganhar dinheiro".
	cta: ['Se você quer aprender como funciona todo esse ecossistema Ganhar', 'Segue o MVM Creators'],
} as const;
const ini = (b: Busca, k: keyof typeof F) => b.say(F[k][0]).inicio;
const fim = (b: Busca, k: keyof typeof F) => b.say(F[k][1]).fim;

// Ritmo frenético (preferência do painel: evento a cada 0,3–0,6 s): punch-in nas palavras do trecho, uma a cada ≥ 0,45 s,
// em ciclo médio → close → aberto, sem passar de 1,45 (a fonte é 4K: folga de sobra).
const ESCALAS = [1.12, 1.26, 1.36, 1.18, 1.3, 1.42, 1.08];
const punches = (b: Busca, frase: string, p: {x: number; y: number}, n = 1, passo = 0.45): EfeitoCamera[] => {
	const lista: EfeitoCamera[] = [];
	let ultimo = -9;
	for (const t of b.tempos(frase, n)) {
		if (t - ultimo < passo) continue;
		lista.push({tipo: 'zoom', em: t, escala: ESCALAS[lista.length % ESCALAS.length], ...p});
		ultimo = t;
	}
	return lista;
};

export const entrevistaPista: Edit = {
	pasta: 'projetos/entrevista-pista',
	video: 'video.mp4',
	formato: 'vertical',
	verificarCurva: false,
	regraCamera: false,
	extraFim: 2.4,
	silencios: silencios as Trecho[],
	transcricao,
	trechos: (o) => {
		// Ar antes da 1ª palavra; a resposta 4 vem logo depois de uma tomada falsa ("Você não vai querer..."), sem pausa.
		const ANTES: Partial<Record<keyof typeof F, number>> = {resposta4: 0.01};
		const fala = (k: keyof typeof F, folga = 0.08): Trecho => [o.say(F[k][0]).inicio - (ANTES[k] ?? 0.06), o.say(F[k][1]).fim + folga];
		const lista: Trecho[] = (Object.keys(F) as (keyof typeof F)[]).map((k) => fala(k));
		// Trechos colados ou quase colados no original (< 1 s) viram um só: as pausas de dentro saem logo abaixo.
		for (let i = lista.length - 1; i > 0; i--) {
			const vao = lista[i][0] - lista[i - 1][1];
			if (vao < 1 && lista[i][1] > lista[i - 1][1]) lista.splice(i - 1, 2, [lista[i - 1][0], lista[i][1]]);
		}
		// Trechos vizinhos que se sobrepõem no original repetem quadros e palavras: divide a sobreposição ao meio.
		for (let i = 1; i < lista.length; i++) {
			if (lista[i][0] < lista[i - 1][1] && lista[i][0] > lista[i - 1][0]) {
				const meio = (lista[i][0] + lista[i - 1][1]) / 2;
				lista[i - 1] = [lista[i - 1][0], meio];
				lista[i] = [meio, lista[i][1]];
			}
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
			{palavra: 'positivos', estilo: 'serif'},
			{palavra: 'IA', estilo: 'serif', ocorrencia: 2},
			{palavra: 'negativos', estilo: 'serif'},
			{palavra: 'viajando.', estilo: 'serif'},
			{palavra: 'ecossistema...', estilo: 'serif'},
		],
		falantes: (b) => [
			{de: ini(b, 'pergunta1') - 0.1, ate: fim(b, 'pergunta1') + 0.1, nome: 'PERGUNTA'},
			{de: fim(b, 'pergunta1') + 0.1, ate: ini(b, 'pergunta2') - 0.1, nome: 'DANILOW'},
			{de: ini(b, 'pergunta2') - 0.1, ate: fim(b, 'pergunta2') + 0.1, nome: 'PERGUNTA'},
			{de: fim(b, 'pergunta2') + 0.1, ate: ini(b, 'pergunta3') - 0.1, nome: 'FERRETO'},
			{de: ini(b, 'pergunta3') - 0.1, ate: fim(b, 'pergunta3') + 0.1, nome: 'PERGUNTA'},
			{de: fim(b, 'pergunta3') + 0.1, ate: ini(b, 'pergunta4') - 0.1, nome: 'DANILOW'},
			{de: ini(b, 'pergunta4') - 0.1, ate: fim(b, 'pergunta4') + 0.1, nome: 'PERGUNTA'},
			{de: fim(b, 'pergunta4') + 0.1, ate: ini(b, 'obrigado') - 0.1, nome: 'FERRETO'},
		],
	},
	camera: (b) => {
		const z = (em: number, escala: number, p: {x: number; y: number}): EfeitoCamera => ({tipo: 'zoom', em, escala, ...p});
		return [
			// Gancho: câmera alta para o 10 MILHÕES, clarão na batida do primeiro número
			z(0, 1.2, baixo(POS.ganchoDanilow)),
			{tipo: 'flash', em: b.at('10') - 0.04},
			z(b.at('milhões'), 1.34, baixo(POS.ganchoDanilow)),
			z(b.at('live.'), 1.12, baixo(POS.ganchoDanilow)),
			{tipo: 'chicote', em: ini(b, 'gancho2')},
			z(ini(b, 'gancho2'), 1.14, baixo(POS.ganchoFerreto)),
			z(b.at('milhões', 2), 1.36, baixo(POS.ganchoFerreto)),
			z(b.at('IA.'), 1.2, baixo(POS.ganchoFerreto)),
			// Pergunta 1 em plano aberto; resposta do Danilow em punches (os motions de tela cheia cobrem parte dela)
			{tipo: 'chicote', em: ini(b, 'pergunta1')},
			z(ini(b, 'pergunta1'), 1, POS.pergunta1),
			z(b.at('considera'), 1.08, POS.pergunta1),
			z(b.at('positivos'), 1.15, POS.pergunta1),
			{tipo: 'chicote', em: ini(b, 'resposta1')},
			...punches(b, 'Duas horas por dia vai te render 10 mil reais de lucro no seu bolso Zero barreira de entrada', baixo(POS.resposta1)),
			// Pergunta 2 e resposta do Ferreto
			{tipo: 'chicote', em: ini(b, 'pergunta2')},
			z(ini(b, 'pergunta2'), 1, POS.pergunta2),
			z(b.at('positivos', 2), 1.15, POS.pergunta2),
			{tipo: 'chicote', em: ini(b, 'resposta2')},
			z(ini(b, 'resposta2'), 1.1, POS.resposta2),
			// Pergunta 3 e a família do Danilow
			{tipo: 'chicote', em: ini(b, 'pergunta3')},
			z(ini(b, 'pergunta3'), 1, POS.pergunta3),
			z(b.at('negativos'), 1.18, POS.pergunta3),
			{tipo: 'chicote', em: ini(b, 'resposta3')},
			...punches(b, 'Um ponto negativo a partir do momento que você começar em live shopping no TikTok os seus familiares vão começar a te pedir dinheiro emprestado', POS.resposta3),
			// Pergunta 4 e a "vantagem negativa" do Ferreto
			{tipo: 'chicote', em: ini(b, 'pergunta4')},
			z(ini(b, 'pergunta4'), 1, POS.pergunta4),
			z(b.say('principais pontos negativos de trabalhar com IA').inicio, 1.12, POS.pergunta4),
			{tipo: 'chicote', em: ini(b, 'resposta4')},
			...punches(b, 'Você vai querer ficar só viajando', POS.resposta4),
			// "Olha isso aqui que a gente está vivendo": abre o plano para mostrar o lugar
			{tipo: 'foco', em: b.at('Olha')},
			z(b.at('Olha'), 1, POS.resposta4b),
			z(b.at('vivendo.'), 1.1, POS.resposta4b),
			...punches(b, 'Eu estou aqui curtindo e as minhas IAs estão trabalhando para mim', POS.resposta4b, 1, 0.5),
			...punches(b, 'Eu tenho uma funcionária que eu não pago salário, ela trabalha 24 horas por dia para mim e não reclama', POS.resposta4b, 1, 0.55),
			{tipo: 'flash', em: b.at('vantagem') - 0.04},
			// Fecho: aberto com todos, punch no nome de cada um
			{tipo: 'chicote', em: ini(b, 'obrigado')},
			z(ini(b, 'obrigado'), 1, POS.todos),
			z(b.at('MVM.'), 1.12, POS.todos),
			z(b.at('Siga'), 1.2, POS.sigaDanilow),
			z(b.at('Siga', 2), 1.2, POS.sigaFerreto),
			{tipo: 'chicote', em: ini(b, 'cta')},
			...punches(b, 'Se você quer aprender como funciona todo esse ecossistema Ganhar dinheiro sem aparecer Sem investir no tráfego De qualquer lugar do mundo', POS.cta, 1, 0.55),
			z(b.at('Segue'), 1.3, POS.cta),
		];
	},
	cenas: (b) => {
		const fimFala = fim(b, 'cta');
		const zero = b.at('Zero');
		return [
			// 1. Gancho: o resultado dos dois, um de cada vez (ouro para a live, prata para a IA: o duelo)
			{
				tipo: 'numero3d',
				de: 0,
				ate: ini(b, 'gancho2') - 0.05,
				texto: '10 MILHÕES',
				rotulo: 'DANILOW',
				abaixo: 'SÓ COM LIVE',
				nomeOuro: true,
				em: b.at('10') - 0.2,
				esconderLegenda: true,
				som: 'pro_pop',
			},
			{
				tipo: 'numero3d',
				de: ini(b, 'gancho2'),
				ate: fim(b, 'gancho2') + 0.1,
				texto: '10 MILHÕES',
				rotulo: 'FERRETO',
				abaixo: 'SÓ COM IA',
				nomeOuro: true,
				metal: 'branco',
				em: b.at('10', 2) - 0.2,
				esconderLegenda: true,
				som: 'pro_pop',
			},
			// 2. Pergunta 1 (positivo da live): medalha de "+" que salta da grade girando como moeda e assenta
			{
				tipo: 'motion3d',
				modelo: 'positivoLive',
				de: b.at('pontos') - 0.15,
				ate: fim(b, 'pergunta1') + 0.05,
				linhas: [{texto: 'PONTOS POSITIVOS', em: b.at('pontos')}],
				chip: 'LIVE',
				som: 'pro_swipe',
				sons: [{em: b.at('pontos') + 0.45, som: 'pro_pouso', ganho: 0.8}],
			},
			// 3. "um celular e internet": celular realista entra girando, o sinal sai dele e o globo da internet acende as conexões
			{
				tipo: 'motion3d',
				modelo: 'celularInternet',
				de: ini(b, 'resposta1') - 0.05,
				ate: b.at('Duas') - 0.08,
				linhas: [
					{texto: 'UM CELULAR', em: b.at('celular')},
					{texto: '+ INTERNET', em: b.at('internet.'), metal: 'ouro'},
				],
				marcos: [b.at('internet.') - 0.1],
				som: 'pro_whoosh',
				sons: [{em: b.at('internet.'), som: 'pro_pulso', ganho: 0.6}],
			},
			// 4. 2 HORAS por dia → R$ 10 MIL de lucro
			{
				tipo: 'numero3d',
				de: b.at('Duas') - 0.05,
				ate: b.at('render') + 0.2,
				texto: '2 HORAS',
				rotulo: 'POR DIA',
				metal: 'branco',
				em: b.at('Duas'),
				esconderLegenda: true,
				som: 'pro_tick',
			},
			{
				tipo: 'numero3d',
				de: b.at('10', 3) - 0.15,
				ate: zero - 0.45,
				texto: 'R$ 10 MIL',
				rotulo: 'DE LUCRO',
				abaixo: 'NO SEU BOLSO',
				em: b.at('10', 3) - 0.1,
				esconderLegenda: true,
				som: 'pro_pop',
			},
			// 5. Zero barreira: a parede de tijolos se monta, o ZERO bate e ela explode no "barreira"
			{
				tipo: 'motion3d',
				modelo: 'barreira',
				de: zero - 0.45,
				ate: fim(b, 'resposta1') + 0.3,
				linhas: [
					{texto: 'ZERO', em: zero, metal: 'ouro'},
					{texto: 'BARREIRA', em: b.at('barreira'), metal: 'branco'},
				],
				marcos: [b.at('barreira')],
				som: 'pro_whoosh_curto',
				sons: [{em: b.at('barreira'), som: 'pro_quebra', ganho: 0.75}],
			},
			// 6. Pergunta 2 (positivo da IA): chip de IA sobe da grade e as trilhas de ouro acendem
			{
				tipo: 'motion3d',
				modelo: 'positivoIa',
				de: b.at('pontos', 2) - 0.15,
				ate: fim(b, 'pergunta2') + 0.05,
				linhas: [{texto: 'PONTOS POSITIVOS', em: b.at('pontos', 2)}],
				chip: 'IA',
				som: 'pro_swipe',
				sons: [{em: b.at('pontos', 2) + 0.4, som: 'pro_pulso', ganho: 0.6}],
			},
			// 7. Os três "não precisa" em cartas 3D que viram e ficam em leque
			{
				tipo: 'cards3d',
				de: ini(b, 'resposta2') + 0.1,
				ate: fim(b, 'resposta2') + 0.25,
				itens: [
					{texto: 'SEM APARECER', em: b.at('aparecer,')},
					{texto: 'SEM ANÚNCIO', em: b.at('anúncio,')},
					{texto: 'SEM ESTOQUE', em: b.at('estoque.')},
				],
				y: 1010,
				som: 'pro_pouso',
				sons: [
					{em: b.at('anúncio,'), som: 'pro_pouso', ganho: 0.8},
					{em: b.at('estoque.'), som: 'pro_pouso', ganho: 0.8},
				],
			},
			// 8. Pergunta 3 (negativo da live): placa de alerta desce pendurada e balança
			{
				tipo: 'motion3d',
				modelo: 'negativoLive',
				de: b.at('pontos', 3) - 0.15,
				ate: fim(b, 'pergunta3') + 0.05,
				linhas: [{texto: 'PONTOS NEGATIVOS', em: b.at('pontos', 3)}],
				chip: 'LIVE',
				som: 'pro_swipe',
				sons: [{em: b.at('pontos', 3) + 0.35, som: 'pro_pouso', ganho: 0.8}],
			},
			// 9. "os familiares vão te pedir dinheiro emprestado": mensagens da família chegando, com som baixo de mensagem em cada uma
			{
				tipo: 'notificacoes',
				de: b.at('familiares') - 0.1,
				ate: ini(b, 'pergunta4') + 0.5,
				itens: [
					{titulo: 'Tia Cida', texto: 'me empresta 500?', em: b.at('familiares')},
					{titulo: 'Primo Léo', texto: 'faz um pix aí', em: b.at('pedir')},
					{titulo: 'Mãe', texto: 'e aquele empréstimo?', em: b.at('emprestado.')},
				],
				y: 300,
				icone: 'mensagem',
				somItem: 'pro_msg',
				ganhoItem: 0.45,
				esconderLegenda: true,
				som: null,
			},
			// 10. Pergunta 4 (negativo da IA): balança de ouro, o prato do "−" pesa no "negativos"
			{
				tipo: 'motion3d',
				modelo: 'negativoIa',
				de: b.at('pontos', 4) - 0.15,
				ate: fim(b, 'pergunta4') + 0.3,
				linhas: [{texto: 'PONTOS NEGATIVOS', em: b.at('pontos', 4)}],
				chip: 'IA',
				marcos: [b.at('negativos', 2)],
				som: 'pro_swipe',
				sons: [{em: b.at('negativos', 2), som: 'pro_tick', ganho: 0.8}],
			},
			// 11. "ficar só viajando": avião cruza o céu acima dele
			{
				tipo: 'aviao',
				de: ini(b, 'resposta4') + 0.05,
				ate: b.at('viajando.') + 0.9,
				y: 210,
				som: 'pro_aviao',
			},
			// 12. Liberdade financeira (pilha de moedas) e geográfica (globo com pino)
			{
				tipo: 'motion3d',
				modelo: 'liberdade',
				de: b.at('liberdade') - 0.1,
				ate: b.at('Olha') - 0.05,
				linhas: [
					{texto: 'FINANCEIRA', em: b.at('financeira,')},
					{texto: 'GEOGRÁFICA', em: b.at('geográfica.')},
				],
				troca: true,
				chip: 'LIBERDADE',
				marcos: [b.at('liberdade'), b.at('liberdade', 2)],
				som: 'pro_swipe',
				sons: [{em: b.at('liberdade', 2), som: 'pro_pouso', ganho: 0.8}],
			},
			// 13. "as minhas IAs estão trabalhando para mim" até "não reclama": robôs filmando para ele; o relógio voa no "24"
			{
				tipo: 'motion3d',
				modelo: 'robos',
				de: b.at('IAs') - 0.1,
				ate: b.at('Essa') - 0.08,
				linhas: [
					{texto: 'MINHAS IAs', em: b.at('IAs'), metal: 'branco'},
					{texto: 'FUNCIONÁRIA', em: b.at('funcionária')},
					{texto: 'SEM SALÁRIO', em: b.at('salário,'), metal: 'branco'},
					{texto: '24 HORAS', em: b.at('24')},
					{texto: 'NÃO RECLAMA', em: b.at('reclama.'), metal: 'branco'},
				],
				troca: true,
				marcos: [b.at('24')],
				som: 'pro_robo',
				sons: [
					{em: b.at('24'), som: 'pro_tick', ganho: 0.8},
					{em: b.at('reclama.'), som: 'pro_pop', ganho: 0.6},
				],
			},
			// 14. A síntese: clarão + frase
			{
				tipo: 'frase',
				de: b.at('Essa') - 0.05,
				ate: fim(b, 'resposta4') + 0.15,
				palavras: [
					{texto: 'A VANTAGEM', em: b.at('Essa')},
					{texto: 'NEGATIVA', em: b.at('negativa.'), destaque: true},
				],
				som: 'pro_frase',
			},
			// 15. Siga cada um, no nome
			{
				tipo: 'siga',
				de: b.at('Siga') - 0.05,
				ate: fim(b, 'obrigado') + 0.1,
				itens: [
					{texto: 'DANILOW', em: b.at('Siga')},
					{texto: 'FERRETO', em: b.at('Siga', 2)},
				],
				y: 1040,
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [{em: b.at('Siga', 2), som: 'pro_swipe', ganho: 0.7}],
			},
			// 16. CTA: o que se aprende no ecossistema, um chip por vez, e o MVM Creators
			{
				tipo: 'chips',
				de: b.at('Ganhar') - 0.05,
				ate: b.at('Segue') - 0.08,
				itens: [
					{texto: 'SEM APARECER', em: b.at('Ganhar')},
					{texto: 'SEM TRÁFEGO', em: b.at('Sem', 2)},
					{texto: 'DE QUALQUER LUGAR', em: b.at('qualquer')},
				],
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
				sons: [
					{em: b.at('Sem', 2), som: 'pro_tick', ganho: 0.8},
					{em: b.at('qualquer'), som: 'pro_tick', ganho: 0.8},
				],
			},
			{
				tipo: 'siga',
				de: b.at('Segue') - 0.05,
				ate: fimFala + 0.1,
				itens: [{texto: 'MVM CREATORS', em: b.at('Segue')}],
				y: 1040,
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			// 17. Cartão final: MVM em ouro e CREATORS em branco, texto 3D sobre a grade (sem anel)
			{tipo: 'final', de: fimFala + 0.1, ate: fimFala + 2.4, marca: 'MVM', linha2: 'CREATORS', sub: 'LIVE × IA NO TIKTOK SHOP', tres: true, som: 'pro_logo'},
		];
	},
};
