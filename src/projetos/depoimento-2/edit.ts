import type {EfeitoCamera, Edit} from '../../motor/plano';
import type {Trecho} from '../../motor/palavras';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// Depoimento do Wesley (tema Entrevista), fonte IMG_5321.MOV (4K HDR do iPhone, convertido por npm run preparar-video).
// Roteiro (falas reordenadas): gancho R$ 500 MIL → método Lucrando com Live → apresenta o Wesley → pergunta antes/agora →
// 120 mil antes → 500 mil depois (4x) → destravou a mentalidade → medo de investir / preso na CLT → dica: 1 hora por dia,
// testar, aplicar, 1º resultado, mais live, escalar, delegar → CTA (dúvida, siga Danilow e MVM) → "o Wesley foi mais um" → final.
// Câmera na mão: o rosto anda. Pontos de zoom = posição do rosto medida (MediaPipe, 1 por segundo) em cada trecho.
const HOST_A = {x: 0.5, y: 0.4}; // 0–10 s do original
const HOST_B = {x: 0.7, y: 0.42}; // 36–48 s
const HOST_C = {x: 0.52, y: 0.4}; // 73–83 s
const WES_A = {x: 0.39, y: 0.45}; // 13–34 s
const WES_B = {x: 0.43, y: 0.42}; // 54–70 s
// Câmera alta: origem acima do rosto, o rosto desce e abre espaço para o 3D no topo.
const WES_BAIXO = {x: 0.39, y: 0.22};

export const depoimento2: Edit = {
	pasta: 'projetos/depoimento-2',
	video: 'video.mp4',
	formato: 'vertical',
	verificarCurva: false,
	regraCamera: false,
	extraFim: 2.4,
	silencios: silencios as Trecho[],
	transcricao,
	trechos: (o) => {
		// [início, fim] no tempo original; as bordas se encaixam nas pausas medidas (silencios.json).
		const fala = (de: string, ate: string, n = 1, folga = 0.08): Trecho => [o.say(de, n).inicio - 0.06, o.say(ate, n).fim + folga];
		const lista: Trecho[] = [
			fala('eu passei pra mais de 500 mil de GMV', 'eu passei pra mais de 500 mil de GMV'),
			fala('O método Lucrando com Live', 'fazendo TikTok Shop'),
			fala('Tô aqui com o Wesley', 'Tô aqui com o Wesley'),
			fala('Como é que você estava antes', 'você está agora'),
			fala('antes da mentoria eu tava faturando', '120 mil de GMV'),
			fala('E após a mentoria', 'até agora somado'),
			fala('E isso que destravou', 'a minha mentalidade foi a mentoria', 1, 0.02),
			fala('muita gente tem essa objeção', 'medo de investir em pessoas'),
			fala('qual é a dica que você dá pro iniciante', 'qual é a dica que você dá pro iniciante', 1, 0.02),
			fala('tá preso CLT', 'tá preso CLT'),
			fala('uma horinha por dia', 'tempo ali de live'),
			fala('logo depois você começa a escalar', 'delegar ali pra outras pessoas'),
			fala('Tem alguma dúvida', 'Segue a MVM'),
			fala('O Wesley foi mais um', 'O Wesley foi mais um'),
		];
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
			{palavra: 'ricas', estilo: 'serif'},
			{palavra: 'agora?', estilo: 'serif'},
			{palavra: 'iniciante', estilo: 'serif'},
			{palavra: 'escalar,', estilo: 'serif'},
			{palavra: 'dúvida?', estilo: 'serif'},
		],
		falantes: (b) => [
			{de: b.say('Como é que você estava antes').inicio - 0.1, ate: b.say('você está agora').fim + 0.15, nome: 'PERGUNTA'},
			{de: b.say('você está agora').fim + 0.15, ate: b.say('muita gente tem essa objeção').inicio - 0.1, nome: 'WESLEY'},
			{de: b.say('muita gente tem essa objeção').inicio - 0.1, ate: b.say('uma horinha por dia').inicio - 0.1, nome: 'PERGUNTA'},
			{de: b.say('uma horinha por dia').inicio - 0.1, ate: b.say('Tem alguma dúvida').inicio - 0.1, nome: 'WESLEY'},
		],
	},
	camera: (b) => {
		const z = (em: number, escala: number, p: {x: number; y: number}, suave?: number): EfeitoCamera => ({tipo: 'zoom', em, escala, ...p, ...(suave ? {suave} : {})});
		const metodo = b.say('O método Lucrando').inicio;
		const pergunta1 = b.say('Como é que você estava antes').inicio;
		const resposta1 = b.say('antes da mentoria eu tava').inicio;
		const pergunta2 = b.say('muita gente tem essa objeção').inicio;
		const resposta2 = b.say('uma horinha por dia').inicio;
		const cta = b.say('Tem alguma dúvida').inicio;
		return [
			// Gancho: já em close, câmera alta para o R$ 500 MIL, clarão na batida do número
			z(0, 1.3, WES_BAIXO),
			{tipo: 'flash', em: b.at('500') - 0.04},
			z(b.at('GMV'), 1.42, WES_BAIXO),
			// Método: troca de falante, ciclo médio → close nas palavras fortes
			{tipo: 'chicote', em: metodo},
			z(metodo, 1.12, HOST_A),
			z(b.at('Lucrando'), 1.3, HOST_A),
			z(b.at('Live'), 1.18, HOST_A),
			z(b.at('pessoas'), 1.38, HOST_A),
			z(b.at('TikTok'), 1.08, HOST_A),
			z(b.at('Wesley'), 1.22, HOST_A),
			// Pergunta antes/agora: tela cheia de grade (cena gradeAntesDepois); a câmera só se prepara para a volta
			z(pergunta1, 1.1, WES_A),
			// Resposta: 120 mil (câmera alta para o contador), 500 mil (clarão e close)
			{tipo: 'chicote', em: resposta1},
			z(resposta1, 1.15, WES_BAIXO),
			z(b.at('faturando'), 1.25, WES_BAIXO),
			z(b.at('120'), 1.35, WES_BAIXO),
			z(b.say('E após a mentoria').inicio, 1.12, WES_BAIXO),
			{tipo: 'flash', em: b.at('500', 2) - 0.04},
			z(b.at('500', 2), 1.42, WES_BAIXO),
			z(b.at('somado.'), 1.2, WES_A),
			// Mentalidade: mergulho para dentro da cabeça dele
			{tipo: 'mergulho', em: b.at('destravou')},
			z(b.at('destravou'), 1.3, WES_A),
			z(b.at('mentalidade'), 1.45, WES_A, 0.9),
			z(b.say('foi a mentoria').inicio, 1.15, WES_A),
			// Pergunta 2: troca para o host; a frase do medo fica estática (sem zoom), depois close no "preso CLT"
			{tipo: 'chicote', em: pergunta2},
			z(pergunta2, 1, HOST_B),
			z(b.at('qual'), 1.12, HOST_B),
			z(b.at('iniciante'), 1.28, HOST_B),
			z(b.at('preso'), 1.38, HOST_B),
			// Dica: cada passo um punch, sobe a cada degrau
			{tipo: 'chicote', em: resposta2},
			z(resposta2, 1.1, WES_B),
			z(b.at('testando'), 1.2, WES_B),
			z(b.at('aplicou'), 1.3, WES_B),
			z(b.at('primeiro'), 1.4, WES_B),
			z(b.at('aumentar'), 1.12, WES_B),
			z(b.at('escalar,'), 1.3, WES_B),
			z(b.at('delegar'), 1.42, WES_B),
			// CTA: aberto no host
			{tipo: 'chicote', em: cta},
			z(cta, 1, HOST_C),
			z(b.at('Deixa'), 1.12, HOST_C),
			z(b.at('segue'), 1.22, HOST_C),
			z(b.at('Segue'), 1.32, HOST_C),
			{tipo: 'foco', em: b.say('O Wesley foi mais um').inicio},
			z(b.say('O Wesley foi mais um').inicio, 1.1, HOST_C),
			z(b.at('mais', 2), 1.3, HOST_C),
		];
	},
	cenas: (b) => {
		const fimFala = b.say('O Wesley foi mais um').fim;
		const quinhentos = b.at('500', 2);
		return [
			// 1. Gancho: R$ 500 MIL em ouro 3D acima da cabeça, com GMV em cima
			{
				tipo: 'numero3d',
				de: 0,
				ate: b.say('eu passei pra mais de 500 mil de GMV').fim + 0.12,
				texto: 'R$ 500 MIL',
				rotulo: 'GMV',
				abaixo: 'DEPOIS DA MENTORIA',
				em: 0,
				esconderLegenda: true,
				som: 'pop',
			},
			// 2. Nome do método
			{
				tipo: 'selo',
				de: b.at('Lucrando') - 0.08,
				ate: b.at('pessoas') - 0.05,
				texto: 'LUCRANDO COM LIVE',
				chip: 'MÉTODO',
				emChip: b.at('método'),
				y: 380,
				esconderLegenda: true,
				som: 'tick',
			},
			// 3. "fazendo TikTok Shop": a live cheia passa pela tela
			{
				tipo: 'live',
				de: b.at('fazendo') - 0.05,
				ate: b.at('fazendo') + 1.25,
				host: 'Wesley',
				curtidas: '8,4 mil curtidas',
				espectadores: '1,2 mil',
				comentarios: [
					{nome: 'Rafa', texto: 'quero 1!'},
					{nome: 'Lu', texto: 'comprei 🔥'},
				],
				som: 'whoosh',
			},
			// 4. O convidado
			{tipo: 'pilula', de: b.at('Tô') - 0.05, ate: b.at('Wesley') + 0.9, rotulo: 'CONVIDADO', nome: 'Wesley', y: 0.56, esconderLegenda: true, som: 'swish'},
			// 5. A pergunta antes × agora: motion de grade com os dois cartões (pedido do usuário); mergulha no AGORA e volta ao rosto
			{
				tipo: 'gradeAntesDepois',
				de: b.say('Como é que você estava antes').inicio - 0.05,
				ate: b.say('você está agora').fim + 0.12,
				titulo: [
					{texto: 'COMO ERA', em: b.say('Como é que você estava antes').inicio},
					{texto: 'SUA VIDA?', em: b.at('estava')},
				],
				antes: {texto: 'ANTES', em: b.at('antes') - 0.05},
				depois: {texto: 'AGORA', em: b.at('agora?') - 0.15},
				som: 'whoosh',
				sons: [{em: b.at('agora?') - 0.15, som: 'swish'}],
			},
			// 6. Antes: R$ 120 MIL em prata 3D (o ouro fica para o depois)
			{
				tipo: 'numero3d',
				de: b.at('120') - 0.3,
				ate: b.say('120 mil de GMV').fim + 0.15,
				texto: 'R$ 120 MIL',
				rotulo: 'ANTES · GMV',
				metal: 'branco',
				em: b.at('120') - 0.25,
				esconderLegenda: true,
				som: 'tick',
			},
			// 7. Depois: R$ 500 MIL, 4x mais
			{
				tipo: 'numero3d',
				de: quinhentos - 0.3,
				ate: b.say('até agora somado').fim + 0.1,
				texto: 'R$ 500 MIL',
				rotulo: 'DEPOIS · GMV',
				abaixo: '4X MAIS',
				em: quinhentos - 0.3,
				esconderLegenda: true,
				som: 'pop',
			},
			// 8. A virada interna
			{
				tipo: 'frase',
				de: b.at('destravou') - 0.08,
				ate: b.at('mentalidade') + 0.9,
				palavras: [
					{texto: 'DESTRAVOU', em: b.at('destravou')},
					{texto: 'A MINHA', em: b.at('minha')},
					{texto: 'MENTALIDADE', em: b.at('mentalidade'), destaque: true},
				],
				som: 'whoosh',
			},
			// 9. A objeção: pessoa presa no medo (tentáculos de sombra, sombra gigante) + MEDO / DE INVESTIR em texto 3D (o glitch foi reprovado)
			{
				tipo: 'medo3d',
				de: b.at('objeção') - 0.1,
				pessoa: true,
				y: 330,
				ate: b.say('investir em pessoas').fim + 0.12,
				linhas: [
					{texto: 'MEDO', em: b.at('medo')},
					{texto: 'DE INVESTIR', em: b.say('medo de investir').inicio + 0.2},
				],
				som: 'swish',
			},
			// 10. Preso na CLT: carteira de trabalho atrás das grades, cadeado fecha no "CLT" (pedido do usuário)
			{
				tipo: 'presoClt',
				de: b.say('tá preso CLT').inicio - 0.05,
				ate: b.at('horinha') - 0.2,
				em: b.at('preso'),
				emCadeado: b.at('CLT?'),
				som: 'swish',
				sons: [{em: b.at('CLT?'), som: 'tick'}],
			},
			// 11. 1 HORA por dia em ouro 3D
			{
				tipo: 'numero3d',
				de: b.at('horinha') - 0.15,
				ate: b.at('dia') + 0.45,
				texto: '1 HORA',
				rotulo: 'A DICA',
				abaixo: 'POR DIA',
				em: b.at('horinha') - 0.1,
				esconderLegenda: true,
				som: 'pop',
			},
			// 12. Os passos em cards 3D, empilhados conforme aparecem (pedido do usuário)
			{
				tipo: 'cards3d',
				de: b.at('testando') - 0.05,
				ate: b.at('aumentar') - 0.08,
				itens: [
					{texto: 'TESTAR PRODUTOS', em: b.at('testando')},
					{texto: 'APLICAR', em: b.at('aplicou')},
					{texto: '1º RESULTADO', em: b.at('primeiro')},
				],
				y: 1010,
				som: 'tick',
				sons: [
					{em: b.at('aplicou'), som: 'tick'},
					{em: b.at('primeiro'), som: 'tick'},
				],
			},
			// 13. "aumentar o seu tempo de live": a live dele, agora cheia
			{
				tipo: 'live',
				de: b.at('aumentar') - 0.05,
				ate: b.say('tempo ali de live').fim + 0.15,
				host: 'Wesley',
				curtidas: '21,3 mil curtidas',
				espectadores: '3,7 mil',
				comentarios: [
					{nome: 'Bia', texto: 'manda o link!'},
					{nome: 'Caio', texto: 'chegou hoje ✅'},
					{nome: 'Dani', texto: 'quero 2'},
				],
				som: 'whoosh',
			},
			// 14. Escalar e delegar
			{
				tipo: 'cards3d',
				de: b.at('escalar,') - 0.05,
				ate: b.say('outras pessoas').fim + 0.15,
				itens: [
					{texto: 'ESCALAR', em: b.at('escalar,')},
					{texto: 'DELEGAR', em: b.at('delegar')},
				],
				inicio: 4,
				y: 1010,
				som: 'tick',
				sons: [{em: b.at('delegar'), som: 'tick'}],
			},
			// 15. CTA: dúvida digitada, siga um por vez
			{tipo: 'comentario', de: b.say('Tem alguma dúvida').inicio - 0.05, ate: b.at('segue') - 0.1, texto: 'Como eu começo do zero?', y: 1060, som: 'swish'},
			{
				tipo: 'siga',
				de: b.at('segue') - 0.05,
				ate: b.at('MVM.') + 0.6,
				itens: [
					{texto: 'DANILOW', em: b.at('segue')},
					{texto: 'MVM', em: b.at('Segue')},
				],
				y: 1040,
				esconderLegenda: true,
				som: 'swish',
			},
			// 16. Fecho
			{
				tipo: 'frase',
				de: b.say('O Wesley foi mais um').inicio - 0.05,
				ate: fimFala + 0.1,
				palavras: [
					{texto: 'O WESLEY', em: b.say('O Wesley foi mais um').inicio},
					{texto: 'FOI', em: b.at('foi', 2)},
					{texto: 'MAIS UM', em: b.at('mais', 2), destaque: true},
				],
				som: 'whoosh',
			},
			// 17. Cartão final
			{tipo: 'final', de: fimFala + 0.1, ate: fimFala + 2.4, marca: 'Danilow', sub: 'LUCRANDO COM LIVE', som: 'whoosh'},
		];
	},
};
