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
// Pontos de zoom = posição do rosto de quem fala (fração do quadro).
const HOST = {x: 0.5, y: 0.4};
const DANILOW = {x: 0.5, y: 0.4};
const FERRETO = {x: 0.5, y: 0.4};
// Câmera alta: o rosto desce e abre espaço para o 3D no topo.
const baixo = (p: {x: number; y: number}) => ({x: p.x, y: Math.max(0.18, p.y - 0.18)});

// Frases de cada trecho, no tempo original (as âncoras dos trechos e da câmera usam as mesmas).
const F = {
	gancho1: ['Eu estou aqui com o Danilow', 'só com live'],
	gancho2: ['E aqui, Ferreto, mais de 10 milhões', 'faturados só com IA'],
	pergunta1: ['Danilow, qual você considera', 'de fazer live shopping no TikTok Shop'],
	resposta1: ['Tudo que você precisa', 'Zero barreira de entrada'],
	pergunta2: ['E você, Ferreto, qual você considera', 'pontos positivos de trabalhar com IA no TikTok Shop'],
	resposta2: ['Você não precisa aparecer, você', 'também não precisa ter estoque'],
	pergunta3: ['Agora, para o Danilow', 'negativos de fazer live shopping no TikTok Shop'],
	resposta3: ['Um ponto negativo', 'pedir dinheiro emprestado'],
	pergunta4: ['Agora você, Ferreto', 'principais pontos negativos de trabalhar com IA'],
	resposta4: ['Você vai querer ficar só viajando', 'Essa é a vantagem negativa'],
	obrigado: ['Obrigado, TikTok Shop', 'Siga o Ferreto para aprender com IA'],
	cta: ['Se você quer aprender como funciona todo esse ecossistema', 'Segue o MVM Creators'],
} as const;
// No original, a tomada boa do CTA é a 2ª vez que ele fala "Se você quer aprender como funciona todo esse ecossistema";
// no vídeo editado ela é a única (b usa a 1ª).
const OCORRENCIA: Partial<Record<keyof typeof F, number>> = {cta: 2};
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
		const fala = (k: keyof typeof F, folga = 0.08): Trecho => [o.say(F[k][0], OCORRENCIA[k] ?? 1).inicio - 0.06, o.say(F[k][1]).fim + folga];
		const lista: Trecho[] = (Object.keys(F) as (keyof typeof F)[]).map((k) => fala(k));
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
			{palavra: 'IA', estilo: 'serif', ocorrencia: 3},
			{palavra: 'negativos', estilo: 'serif'},
			{palavra: 'viajando.', estilo: 'serif'},
			{palavra: 'ecossistema...', estilo: 'serif', ocorrencia: 4},
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
			z(0, 1.2, baixo(HOST)),
			{tipo: 'flash', em: b.at('10') - 0.04},
			z(b.at('milhões'), 1.34, baixo(HOST)),
			z(b.at('live.'), 1.12, baixo(HOST)),
			{tipo: 'chicote', em: ini(b, 'gancho2')},
			z(ini(b, 'gancho2'), 1.14, baixo(FERRETO)),
			z(b.at('milhões', 2), 1.36, baixo(FERRETO)),
			z(b.at('IA.'), 1.2, baixo(FERRETO)),
			// Pergunta 1 em plano aberto; resposta do Danilow em punches (os motions de tela cheia cobrem parte dela)
			{tipo: 'chicote', em: ini(b, 'pergunta1')},
			z(ini(b, 'pergunta1'), 1, HOST),
			z(b.at('positivos'), 1.15, HOST),
			{tipo: 'chicote', em: ini(b, 'resposta1')},
			...punches(b, 'Duas horas por dia vai te render 10 mil reais de lucro no seu bolso Zero barreira de entrada', baixo(DANILOW)),
			// Pergunta 2 e resposta do Ferreto
			{tipo: 'chicote', em: ini(b, 'pergunta2')},
			z(ini(b, 'pergunta2'), 1, HOST),
			z(b.at('positivos', 3), 1.15, HOST),
			{tipo: 'chicote', em: ini(b, 'resposta2')},
			z(ini(b, 'resposta2'), 1.1, FERRETO),
			// Pergunta 3 e a família do Danilow
			{tipo: 'chicote', em: ini(b, 'pergunta3')},
			z(ini(b, 'pergunta3'), 1, HOST),
			z(b.at('negativos'), 1.18, HOST),
			{tipo: 'chicote', em: ini(b, 'resposta3')},
			...punches(b, 'Um ponto negativo a partir do momento que você começar em live shopping no TikTok', DANILOW),
			// Pergunta 4 e a "vantagem negativa" do Ferreto
			{tipo: 'chicote', em: ini(b, 'pergunta4')},
			z(ini(b, 'pergunta4'), 1, HOST),
			z(b.say('principais pontos negativos de trabalhar com IA').inicio, 1.18, HOST),
			{tipo: 'chicote', em: ini(b, 'resposta4')},
			...punches(b, 'Você vai querer ficar só viajando', FERRETO),
			// "Olha isso aqui que a gente está vivendo": abre o plano para mostrar o lugar
			{tipo: 'foco', em: b.at('Olha')},
			z(b.at('Olha'), 1, FERRETO),
			z(b.at('vivendo.'), 1.1, FERRETO),
			...punches(b, 'Eu estou aqui curtindo e as minhas IAs estão trabalhando para mim', FERRETO, 1, 0.5),
			{tipo: 'flash', em: b.at('vantagem') - 0.04},
			// Fecho: aberto com todos, punch no nome de cada um
			{tipo: 'chicote', em: ini(b, 'obrigado')},
			z(ini(b, 'obrigado'), 1, HOST),
			z(b.at('MVM.'), 1.12, HOST),
			z(b.at('Siga'), 1.2, DANILOW),
			z(b.at('Siga', 2), 1.2, FERRETO),
			{tipo: 'chicote', em: ini(b, 'cta')},
			...punches(b, 'Se você quer aprender como funciona todo esse ecossistema', HOST, 1, 0.55),
			z(b.at('Segue'), 1.3, HOST),
		];
	},
	cenas: (b) => {
		const fimFala = fim(b, 'cta');
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
				som: 'pop',
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
				som: 'pop',
			},
			// 2. Pergunta 1: o tema sobe ao topo (LIVE)
			{
				tipo: 'selo',
				de: b.at('positivos') - 0.1,
				ate: fim(b, 'pergunta1') + 0.05,
				texto: 'PONTOS POSITIVOS',
				chip: 'LIVE',
				emChip: b.at('live', 1),
				y: 380,
				som: 'tick',
			},
			// 3. "um celular e internet": celular 3D voa ao centro com o texto 3D
			{
				tipo: 'celular3d',
				de: ini(b, 'resposta1') - 0.05,
				ate: b.at('Duas') - 0.08,
				linhas: [
					{texto: 'UM CELULAR', em: b.at('celular')},
					{texto: '+ INTERNET', em: b.at('internet.')},
				],
				som: 'whoosh',
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
				som: 'tick',
			},
			{
				tipo: 'numero3d',
				de: b.at('10', 3) - 0.15,
				ate: b.at('Zero') - 0.08,
				texto: 'R$ 10 MIL',
				rotulo: 'DE LUCRO',
				abaixo: 'NO SEU BOLSO',
				em: b.at('10', 3) - 0.1,
				esconderLegenda: true,
				som: 'pop',
			},
			// 5. Zero barreira
			{
				tipo: 'frase',
				de: b.at('Zero') - 0.05,
				ate: fim(b, 'resposta1') + 0.12,
				palavras: [
					{texto: 'ZERO', em: b.at('Zero'), destaque: true},
					{texto: 'BARREIRA', em: b.at('barreira')},
				],
				som: 'whoosh',
			},
			// 6. Pergunta 2: o tema troca para IA
			{
				tipo: 'selo',
				de: b.at('positivos', 3) - 0.1,
				ate: fim(b, 'pergunta2') + 0.05,
				texto: 'PONTOS POSITIVOS',
				chip: 'IA',
				emChip: b.at('IA', 3),
				y: 380,
				som: 'tick',
			},
			// 7. Os três "não precisa" em cartas 3D que viram e ficam em leque
			{
				tipo: 'cards3d',
				de: ini(b, 'resposta2') + 0.1,
				ate: fim(b, 'resposta2') + 0.25,
				itens: [
					{texto: 'SEM APARECER', em: b.at('aparecer,', 2)},
					{texto: 'SEM ANÚNCIO', em: b.at('anúncio,')},
					{texto: 'SEM ESTOQUE', em: b.at('estoque.')},
				],
				y: 1010,
				som: 'tick',
				sons: [
					{em: b.at('anúncio,'), som: 'tick'},
					{em: b.at('estoque.'), som: 'tick'},
				],
			},
			// 8. Pergunta 3: o lado negativo da live
			{
				tipo: 'selo',
				de: b.at('negativos') - 0.1,
				ate: fim(b, 'pergunta3') + 0.05,
				texto: 'PONTOS NEGATIVOS',
				chip: 'LIVE',
				emChip: b.say('fazer live shopping', 2).inicio,
				y: 380,
				som: 'tick',
			},
			// 9. "os familiares vão te pedir dinheiro emprestado": as mensagens da família chegando no celular
			{
				tipo: 'notificacoes',
				de: b.at('familiares') - 0.1,
				ate: fim(b, 'resposta3') + 0.6,
				itens: [
					{titulo: 'Tia Cida', texto: 'oi sumido, me empresta 500?', em: b.at('familiares')},
					{titulo: 'Primo Léo', texto: 'tá rico né, faz um pix aí', em: b.at('pedir')},
					{titulo: 'Mãe', texto: 'filho, e aquele empréstimo?', em: b.at('emprestado.')},
				],
				y: 300,
				esconderLegenda: true,
				som: 'tick',
				sons: [
					{em: b.at('pedir'), som: 'tick'},
					{em: b.at('emprestado.'), som: 'tick'},
				],
			},
			// 10. Pergunta 4: o lado negativo da IA
			{
				tipo: 'selo',
				de: b.say('principais pontos negativos de trabalhar com IA').inicio + 0.3,
				ate: fim(b, 'pergunta4') + 0.3,
				texto: 'PONTOS NEGATIVOS',
				chip: 'IA',
				emChip: b.say('trabalhar com IA no TikTok', 2).inicio + 0.4,
				y: 380,
				som: 'tick',
			},
			// 11. As duas liberdades, uma por vez
			{
				tipo: 'chips',
				de: b.at('liberdade') - 0.05,
				ate: b.at('Olha') - 0.05,
				itens: [
					{texto: 'LIBERDADE FINANCEIRA', em: b.at('liberdade')},
					{texto: 'LIBERDADE GEOGRÁFICA', em: b.at('liberdade', 2)},
				],
				y: 1080,
				esconderLegenda: true,
				som: 'swish',
				sons: [{em: b.at('liberdade', 2), som: 'tick'}],
			},
			// 12. "as minhas IAs estão trabalhando para mim": a live da IA rodando sozinha, cheia
			{
				tipo: 'live',
				de: b.at('IAs') - 0.05,
				ate: b.at('funcionária') - 0.1,
				host: 'IA do Ferreto',
				curtidas: '12,7 mil curtidas',
				espectadores: '2,3 mil',
				comentarios: [
					{nome: 'Ana', texto: 'quero 2!'},
					{nome: 'Rui', texto: 'comprei 🔥'},
				],
				som: 'whoosh',
			},
			// 13. A funcionária que trabalha 24 horas
			{
				tipo: 'numero3d',
				de: b.at('24') - 0.25,
				ate: b.at('Essa') - 0.08,
				texto: '24 HORAS',
				rotulo: 'SEM SALÁRIO',
				abaixo: 'E NÃO RECLAMA',
				em: b.at('24') - 0.2,
				esconderLegenda: true,
				som: 'pop',
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
				som: 'whoosh',
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
				som: 'swish',
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
				som: 'tick',
			},
			{
				tipo: 'siga',
				de: b.at('Segue') - 0.05,
				ate: fimFala + 0.1,
				itens: [{texto: 'MVM CREATORS', em: b.at('Segue')}],
				y: 1040,
				esconderLegenda: true,
				som: 'swish',
			},
			// 17. Cartão final
			{tipo: 'final', de: fimFala + 0.1, ate: fimFala + 2.4, marca: 'MVM Creators', sub: 'LIVE × IA NO TIKTOK SHOP', som: 'whoosh'},
		];
	},
};
