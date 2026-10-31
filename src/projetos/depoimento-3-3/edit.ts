import type {EfeitoCamera, Edit} from '../../motor/plano';
import type {Busca, Trecho} from '../../motor/palavras';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// Depoimento do Felipe (tema Depoimentos), celular via WhatsApp (478x850). Roteiro em ordem de história:
// gancho "em 2 dias quase 2K" (contador de ouro) → Felipe → dor (1 mês só vídeo, 3/4/5 por dia, nunca vendeu, desanimado) →
// virada (conheceu o Danilow, parcelou no cartão) → R$ 500 em 3 dias → a mentoria (não escondem o ouro, entram na operação,
// dicas na live) → "é caro?" vale muito a pena → ensinam tudo, aula/acompanha/incentiva, mensagens do Filipão → fecho.
// Rosto em x≈0,3, y≈0,36 do quadro (câmera de selfie parada).
const P = {x: 0.32, y: 0.36};

// Trechos no tempo original, bordas em vale de energia da voz. Fica de fora só "Então assim, pessoal, vale muito a pena"
// (77,3–79,2), que repetiria colado o "realmente vale muito a pena" do fim do bloco anterior; o 2K vai para o gancho.
const TRECHOS: Trecho[] = [
	[74.3, 77.22], // Semana passada, em 2 dias, eu fiz quase 2K.
	[0.0, 3.3], // Fala, pessoal, Felipe aqui na área.
	[34.58, 52.72], // Eu vou falar uma coisa pra vocês... Tava super desanimado mesmo.
	[52.72, 65.36], // Foi onde eu conheci o Danilow... paguei a mentoria dele.
	[65.36, 73.95], // E assim, na outra semana, questão de 3 dias... 500 reais... Foi muito top, entendeu?
	[3.3, 34.58], // Cara, falar da mentoria... não escondem o ouro... Porque realmente vale muito a pena.
	[79.45, 110.25], // Ah, é caro e não sei o quê... não ficava de fora dessa mentoria, não.
];

// Frenético: punch-in a cada ~0,45 s, ciclo aberto → médio → close, zoom ≤ 1,25 (fonte baixa).
const ESCALAS = [1.06, 1.14, 1.22, 1.1, 1.18, 1.0, 1.25, 1.12];
const punches = (b: Busca, de: number, ate: number, livres: [number, number][], passo = 0.45): EfeitoCamera[] => {
	const lista: EfeitoCamera[] = [];
	let ultimo = -9;
	const marcas = [...b.palavras.map((p) => p.inicio), ...b.emendas].sort((x, y) => x - y);
	for (const t of marcas) {
		if (t < de || t > ate || t - ultimo < passo) continue;
		if (livres.some(([a, z]) => t >= a - 0.05 && t <= z)) continue;
		lista.push({tipo: 'zoom', em: t, escala: ESCALAS[lista.length % ESCALAS.length], ...P});
		ultimo = t;
	}
	return lista;
};

export const depoimento33: Edit = {
	pasta: 'projetos/depoimento-3-3',
	video: 'video.mp4',
	formato: 'vertical',
	// Fonte do celular em ~470x840: final em 540x960 (render na qualidade do vídeo).
	escalaFinal: 0.5,
	verificarCurva: false,
	regraCamera: false,
	barraProgresso: true,
	extraFim: 2.4,
	silencios: silencios as Trecho[],
	transcricao,
	trechos: () => {
		// Tira as pausas medidas (≥ 0,15 s) que caem dentro de um trecho, com 0,04 s de ar de cada lado.
		const cortado: Trecho[] = [];
		for (const [a, z] of TRECHOS) {
			let ini = a;
			for (const [s0, s1] of silencios as Trecho[]) {
				if (s0 <= ini + 0.25 || s1 >= z - 0.25 || s1 - s0 < 0.15) continue;
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
			{palavra: 'desanimado', estilo: 'serif'},
			{palavra: 'loucura.', estilo: 'serif'},
			{palavra: 'operação', estilo: 'serif'},
			{palavra: 'incentiva,', estilo: 'serif'},
			{palavra: 'fora', estilo: 'serif'},
		],
	},
	camera: (b) => {
		const z = (em: number, escala: number): EfeitoCamera => ({tipo: 'zoom', em, escala, ...P});
		const dor = b.say('nunca tinha vendido nada');
		const dorFim = b.say('Sabe o que é nada').fim + 0.1;
		const fimFala = b.say('dessa mentoria, não').fim;
		return [
			z(0, 1.12),
			...punches(b, 0.4, fimFala, [[dor.inicio - 0.1, dorFim]]),
			// Frase de dor: estática, sem zoom
			z(dor.inicio - 0.1, 1.0),
			{tipo: 'flash', em: b.at('500') - 0.04},
			{tipo: 'flash', em: b.say('não escondem o ouro').inicio - 0.04},
		];
	},
	cenas: (b) => {
		const fimFala = b.say('dessa mentoria, não').fim;
		const dor = b.say('nunca tinha vendido nada');
		const caro = b.say('é caro');
		return [
			// 1. Gancho: contador em ouro 3D corre com ease-out até R$ 2000 e trava com clarão no "2K"
			{
				tipo: 'peca',
				nome: 'v14Contador',
				de: 0,
				ate: b.say('eu fiz quase 2K').fim + 0.3,
				esconderLegenda: true,
				som: 'pro_swipe',
				dados: {marcos: [b.at('Semana'), b.at('2K'), b.at('2K') + 0.1], valor: 2000, prefixo: 'R$ ', sufixo: '', rotulo: 'QUASE · EM 2 DIAS'},
				sons: [{em: b.at('2K'), som: 'pro_pop', ganho: 0.8}],
			},
			// 2. Quem fala
			{tipo: 'pilula', de: b.at('Felipe') - 0.1, ate: b.say('aqui na área').fim + 0.25, rotulo: 'MENTORADO', nome: 'Felipe', y: 0.56, esconderLegenda: true, som: 'pro_swipe'},
			// 3. Antes: 1 MÊS no TikTok Shop só fazendo vídeo (prata = antes)
			{
				tipo: 'numero3d',
				de: b.at('mês') - 0.2,
				ate: b.say('fazendo somente vídeo').fim + 0.1,
				texto: '1 MÊS',
				rotulo: 'NO TIKTOK SHOP',
				abaixo: 'SÓ FAZENDO VÍDEO',
				metal: 'branco',
				em: b.at('mês') - 0.15,
				esconderLegenda: true,
				som: 'pro_pop',
			},
			// 4. Dor: estática, palavra por palavra
			{
				tipo: 'frase',
				dor: true,
				de: dor.inicio - 0.08,
				ate: b.say('Sabe o que é nada').fim + 0.1,
				palavras: [
					{texto: 'NUNCA TINHA', em: dor.inicio},
					{texto: 'VENDIDO', em: b.at('vendido')},
					{texto: 'NADA', em: b.at('nada'), destaque: true},
				],
				som: 'pro_frase',
			},
			// 5. 3, 4, 5 vídeos por dia: cartas numeradas a partir do 3, uma por número falado
			{
				tipo: 'cards3d',
				de: b.at('3') - 0.08,
				ate: b.say('por dia e postava').fim + 0.15,
				itens: [
					{texto: 'VÍDEOS', em: b.at('3')},
					{texto: 'VÍDEOS', em: b.at('4')},
					{texto: 'VÍDEOS POR DIA', em: b.at('5')},
				],
				inicio: 3,
				y: 1010,
				som: 'pro_tick',
				sons: [
					{em: b.at('4'), som: 'pro_tick', ganho: 0.7},
					{em: b.at('5'), som: 'pro_tick', ganho: 0.7},
				],
			},
			// 6. Zero vendas, desanimado: pessoa presa na sombra + texto 3D sombrio
			{
				tipo: 'medo3d',
				de: b.say('E não tinha vendido nada ainda').inicio - 0.08,
				ate: b.say('super desanimado mesmo').fim + 0.1,
				pessoa: true,
				y: 330,
				linhas: [
					{texto: 'ZERO VENDAS', em: b.say('E não tinha vendido nada ainda').inicio + 0.1, metal: 'cinza'},
					{texto: 'DESANIMADO', em: b.at('super'), metal: 'sangue'},
				],
				som: 'pro_whoosh',
			},
			// 7. Virada: o mentor
			{
				tipo: 'selo',
				de: b.at('Danilow') - 0.1,
				ate: b.at('extraordinário') + 0.7,
				texto: 'DANILOW',
				chip: 'O MENTOR',
				emChip: b.at('conheci'),
				y: 380,
				esconderLegenda: true,
				som: 'pro_tick',
			},
			// 8. Sem dinheiro → parcelou no cartão → fiz loucura
			{
				tipo: 'chips',
				de: b.say('não tinha o dinheiro').inicio - 0.08,
				ate: b.at('loucura') + 0.6,
				itens: [
					{texto: 'SEM DINHEIRO', em: b.say('não tinha o dinheiro').inicio},
					{texto: 'PARCELEI NO CARTÃO', em: b.at('parcelei')},
					{texto: 'FIZ LOUCURA', em: b.at('fiz', 2)},
				],
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
				sons: [
					{em: b.at('parcelei'), som: 'pro_tick', ganho: 0.7},
					{em: b.at('fiz', 2), som: 'pro_tick', ganho: 0.7},
				],
			},
			// 9. Resultado: R$ 500 em 3 dias de comissão (ouro)
			{
				tipo: 'numero3d',
				de: b.at('500') - 0.25,
				ate: b.at('comissão') + 0.6,
				texto: 'R$ 500',
				rotulo: 'EM 3 DIAS',
				abaixo: 'DE COMISSÃO',
				em: b.at('500') - 0.2,
				esconderLegenda: true,
				som: 'pro_pop',
			},
			// 10. A mentoria
			{
				tipo: 'selo',
				de: b.at('bons') - 0.1,
				ate: b.at('bons') + 0.9,
				texto: 'MUITO BONS',
				chip: 'A MENTORIA',
				emChip: b.at('bons') - 0.05,
				y: 380,
				esconderLegenda: true,
				som: 'pro_tick',
			},
			// 11. Entram na operação junto
			{
				tipo: 'chips',
				de: b.say('entram na operação').inicio - 0.05,
				ate: b.at('comigo') + 0.4,
				itens: [
					{texto: 'ENTRAM NA OPERAÇÃO', em: b.say('entram na operação').inicio},
					{texto: 'JUNTO COMIGO', em: b.at('comigo') - 0.3},
				],
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
			},
			// 12. Ao vivo, eles dando dicas na live
			{
				tipo: 'live',
				de: b.at('vivo') - 0.1,
				ate: b.say('aquilo outro e tal').fim + 0.1,
				host: 'Felipe',
				curtidas: '3,2 mil curtidas',
				espectadores: '418',
				comentarios: [
					{nome: 'Danilow', texto: 'fala do frete grátis!'},
					{nome: 'Filipão', texto: 'mostra o produto de perto'},
				],
				som: 'pro_whoosh',
			},
			// 13. Não escondem o ouro: O OURO em 3D
			{
				tipo: 'numero3d',
				de: b.say('não escondem o ouro').inicio - 0.1,
				ate: b.say('Eles não escondem o ouro').fim + 0.15,
				texto: 'O OURO',
				rotulo: 'NÃO ESCONDEM',
				em: b.at('ouro') - 0.1,
				esconderLegenda: true,
				som: 'pro_pop',
			},
			// 14. Objeção: é caro? → vale muito a pena
			{
				tipo: 'frase',
				de: caro.inicio - 0.1,
				ate: b.say('Mas galera, vale muito a pena').fim + 0.15,
				palavras: [
					{texto: 'É CARO?', em: caro.inicio},
					{texto: 'VALE MUITO A PENA', em: b.tempos('Mas galera, vale muito a pena')[2], destaque: true},
				],
				som: 'pro_frase',
			},
			// 15. Ensinam tudo / nunca tinha feito live
			{
				tipo: 'selo',
				de: b.at('ensinam') - 0.1,
				ate: b.at('jogo') + 0.5,
				texto: 'ENSINAM TUDO',
				chip: 'SEM ESCONDER O JOGO',
				emChip: b.at('esconde'),
				y: 380,
				esconderLegenda: true,
				som: 'pro_tick',
			},
			{
				tipo: 'numero3d',
				de: b.say('Nunca tinha feito uma live').inicio - 0.1,
				ate: b.at('vida') + 0.55,
				texto: '0 LIVES',
				rotulo: 'ANTES',
				abaixo: 'NUNCA TINHA FEITO',
				metal: 'branco',
				em: b.at('live', 1) - 0.05,
				esconderLegenda: true,
				som: 'pro_pop',
			},
			// 16. Aula, acompanha, incentiva
			{
				tipo: 'cards3d',
				de: b.at('aula') - 0.08,
				ate: b.say('te incentiva, tá bom').fim + 0.1,
				itens: [
					{texto: 'AULA', em: b.at('aula')},
					{texto: 'ACOMPANHAMENTO', em: b.at('acompanha', 2)},
					{texto: 'INCENTIVO', em: b.at('incentiva')},
				],
				y: 1010,
				som: 'pro_tick',
				sons: [
					{em: b.at('acompanha', 2), som: 'pro_tick', ganho: 0.7},
					{em: b.at('incentiva'), som: 'pro_tick', ganho: 0.7},
				],
			},
			// 17. Mensagens do Filipão
			{
				tipo: 'notificacoes',
				de: b.at('Filipão') - 0.1,
				ate: b.say('E tudo mais').fim + 0.1,
				itens: [
					{titulo: 'Filipão', texto: 'E aí, cara, já rodou hoje?', em: b.say('já rodou hoje').inicio - 0.3},
					{titulo: 'Filipão', texto: 'Hoje quantas?', em: b.at('quantas') - 0.1},
				],
				y: 300,
				icone: 'mensagem',
				somItem: 'pro_msg',
				ganhoItem: 0.5,
			},
			// 18. Fecho
			{
				tipo: 'frase',
				de: b.say('não ficava de fora').inicio - 0.1,
				ate: fimFala + 0.1,
				palavras: [
					{texto: 'NÃO FICA', em: b.say('não ficava').inicio},
					{texto: 'DE FORA', em: b.at('fora'), destaque: true},
				],
				som: 'pro_frase',
			},
			// 19. Cartão final
			{tipo: 'final', de: fimFala + 0.1, ate: fimFala + 2.4, marca: 'Danilow', sub: 'MENTORIA TIKTOK SHOP', tres: true, som: 'pro_logo'},
		];
	},
};
