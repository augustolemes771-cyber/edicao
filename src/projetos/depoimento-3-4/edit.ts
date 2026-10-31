import type {EfeitoCamera, Edit} from '../../motor/plano';
import type {Trecho} from '../../motor/palavras';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// Depoimento 3-4 (tema Depoimentos): mentorada iniciante da mentoria do Danilow. Fonte = 4.mp4 (53,43 s) + 4.1.mp4 emendados;
// a emenda (53,43 s) cai dentro da pausa medida 51,90–54,36 s e sai no corte entre "é muito bom." e "Eu aprendi na prática".
// Roteiro: gancho "não existe perfil flopado, é 100% produto" (tirado da fala de 56,3 s; depois a fala segue
// "Eu aprendi na prática, e eu estou escalando..." sem repetir palavra) → mentoria e equipe → perfil zerado (dor) →
// pega pela mão, suporte individual (virada) → escalar → indicação → minerar/escalar/campeão → sem segredo nem milagre →
// constância, dedicação, produto certo → especialistas em live TikTok Shop → "só façam" → cartão final.
// Bordas no tempo original, em vales da energia da voz (banda 250–3500 Hz, janelas de 20 ms; ver silencios.json).
const P = {x: 0.6, y: 0.42};
const ALTA = {x: 0.6, y: 0.3};

const BLOCOS: Trecho[] = [
	[56.32, 60.62], // gancho: não existe um perfil flopado, que é 100% produto
	[0.36, 51.96], // É, realmente essa mentoria ... é muito bom.
	[54.3, 55.42], // Eu aprendi na prática
	[60.62, 93.7], // e eu estou escalando ... só façam.
];

// Tira as pausas medidas (≥ 0,25 s) dentro de cada bloco, com 0,06 s de ar no fim e 0,1 s antes de a fala voltar.
const TRECHOS: Trecho[] = (() => {
	const out: Trecho[] = [];
	for (const [a, z] of BLOCOS) {
		let ini = a;
		for (const [s0, s1] of silencios as Trecho[]) {
			if (s0 <= ini + 0.1 || s1 >= z - 0.1 || s1 - s0 < 0.25) continue;
			out.push([ini, s0 + 0.06]);
			ini = s1 - 0.1;
		}
		out.push([ini, z]);
	}
	return out;
})();

// Ritmo frenético: punch-in a cada ~0,5 s em ciclo médio → close → aberto, zoom ≤ 1,25 (fonte de 478x850).
const ESCALAS = [1.08, 1.16, 1.24, 1.12, 1.2, 1.04];

export const depoimento34: Edit = {
	pasta: 'projetos/depoimento-3-4',
	video: 'video.mp4',
	formato: 'vertical',
	// Fonte do celular em ~470x840: final em 540x960 (render na qualidade do vídeo).
	escalaFinal: 0.5,
	verificarCurva: false,
	regraCamera: false,
	barraProgresso: true,
	extraFim: 2.6,
	transcricao,
	silencios: silencios as Trecho[],
	trechos: () => TRECHOS,
	legenda: {
		estilo: 'mare',
		altura: 0.656,
		palavrasPorTela: 4,
		enfase: [
			{palavra: 'iniciante', estilo: 'serif'},
			{palavra: 'individual,', estilo: 'serif'},
			{palavra: 'incríveis,', estilo: 'serif'},
			{palavra: 'especialidade', estilo: 'serif'},
		],
	},
	camera: (b) => {
		const z = (em: number, escala: number, p = P): EfeitoCamera => ({tipo: 'zoom', em, escala, ...p});
		const lista: EfeitoCamera[] = [z(0, 1.12, ALTA)];
		let ultimo = 0;
		let i = 0;
		for (const p of b.palavras) {
			if (p.inicio - ultimo < 0.5) continue;
			lista.push(z(p.inicio, ESCALAS[i++ % ESCALAS.length]));
			ultimo = p.inicio;
		}
		// Chicote na saída do gancho (motion de tela cheia → rosto).
		lista.push({tipo: 'chicote', em: b.say('é realmente essa').inicio});
		return lista;
	},
	cenas: (b) => {
		const fimFala = b.at('façam.') + 0.65;
		const fimGancho = b.say('é realmente essa').inicio - 0.03;
		const aprendi = b.say('Eu aprendi').inicio - 0.03;
		const g = {flopado: b.at('flopado,') - 0.05, risco: b.at('que') + 0.05, cem: b.at('100%') - 0.08, produto: b.at('produto')};
		const mi = {golpes: [b.at('formato,'), b.at('mineração,')], acha: b.at('tudo')};
		const pf = {zerado: b.at('zerado,'), iniciante: b.at('iniciante,'), sobe: b.at('iniciante', 2), pulsos: [b.at('caso,'), b.at('peguei')]};
		const mao = {pega: b.at('pega'), mao: b.at('pega') + 0.1};
		const su = {individual: b.at('individual,'), grupo: b.at('grupo'), individual2: b.at('individual,', 2), tirar: b.at('tirar'), duvidas: b.at('dúvidas')};
		const ss = {segredo: b.at('segredo,'), milagre: b.at('milagre,'), constancia: b.at('constância,'), dedicacao: b.at('dedicação'), certo: b.say('produto certo').inicio};
		return [
			// 1. Gancho (tela cheia): perfil com 0 e o carimbo FLOPADO, riscado em ouro no "que"; depois 100% PRODUTO em ouro 3D
			{
				tipo: 'peca',
				nome: 'd34Flopado',
				modo: 'cheia',
				de: 0,
				ate: fimGancho,
				dados: {...g, marcos: [g.flopado, g.risco, g.cem, g.produto]},
				esconderLegenda: true,
				som: 'pro_whoosh',
				sons: [
					{em: g.flopado, som: 'pro_pop', ganho: 0.7},
					{em: g.cem, som: 'pro_pop', ganho: 0.8},
				],
			},
			// 2. Mentor e equipe
			{tipo: 'pilula', de: b.at('Danilow') - 0.08, ate: b.at('Felipe,') - 0.1, rotulo: 'MENTORIA', nome: 'Danilow', y: 0.56, esconderLegenda: true, som: 'pro_swipe'},
			{
				tipo: 'chips',
				de: b.at('Felipe,') - 0.08,
				ate: b.at('caras') - 0.02,
				itens: [
					{texto: 'FELIPE', em: b.at('Felipe,') - 0.05},
					{texto: 'MATHEUS', em: b.at('Matheus,') - 0.05},
				],
				y: 1040,
				esconderLegenda: true,
				som: 'pro_tick',
			},
			{
				tipo: 'frase',
				de: b.at('são') - 0.05,
				ate: b.at('ela') - 0.05,
				palavras: [
					{texto: 'SÃO', em: b.at('são')},
					{texto: 'GIGANTES', em: b.at('gigantes,'), destaque: true},
				],
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
			},
			{tipo: 'selo', de: b.at('prática') - 0.25, ate: b.at('formato,') - 0.12, texto: 'NA PRÁTICA', y: 380, esconderLegenda: true, som: 'pro_tick'},
			// 3. Mineração (tela cheia): a picareta bate no formato e na mineração, a pedra racha e o produto sobe brilhando
			{
				tipo: 'peca',
				nome: 'd34Mineracao',
				modo: 'cheia',
				de: b.at('formato,') - 0.1,
				ate: b.at('sair') - 0.08,
				dados: {...mi, marcos: [...mi.golpes, mi.acha]},
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
				sons: [{em: mi.acha, som: 'pro_quebra', ganho: 0.55}],
			},
			// 4. Perfil zerado (tela cheia): 0 seguidores, selo INICIANTE, e o número começa a subir
			{
				tipo: 'peca',
				nome: 'd34Perfil',
				modo: 'cheia',
				de: b.at('sair') - 0.08,
				ate: b.at('deixei') - 0.04,
				dados: {...pf, marcos: [pf.zerado, pf.iniciante, pf.sobe, ...pf.pulsos]},
				esconderLegenda: true,
				som: 'pro_whoosh',
				sons: [
					{em: pf.iniciante, som: 'pro_pop', ganho: 0.6},
					{em: pf.sobe, som: 'pro_tick', ganho: 0.7},
				],
			},
			// Outros nichos de lado (tela cheia): cartões de outros nichos varridos para o lado e o alvo do propósito no centro
			{
				tipo: 'peca',
				nome: 'd34Nichos',
				de: b.at('deixei') - 0.04,
				ate: b.say('os caras ensinam').inicio - 0.05,
				dados: {nichos: b.at('outros') - 0.05, lado: b.at('lado'), vim: b.at('lado') + 0.35, proposito: b.at('propósito.') - 0.05, marcos: [b.at('outros'), b.at('lado'), b.at('vim'), b.at('propósito.')]},
				esconderLegenda: true,
				sons: [
					{em: b.at('outros') - 0.05, som: 'pro_pop', ganho: 0.6},
					{em: b.at('lado'), som: 'pro_whoosh', ganho: 0.7},
					{em: b.at('propósito.') - 0.05, som: 'pro_tick', ganho: 0.7},
				],
			},
			// 5. Pega pela mão (tela cheia): a mão de ouro pega a mão dela e guia pelo caminho até a estrela
			{
				tipo: 'peca',
				nome: 'd34Mao',
				modo: 'cheia',
				de: b.at('literalmente,') - 0.04,
				ate: b.at('suporte') - 0.04,
				dados: {...mao, marcos: [mao.pega, mao.mao]},
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			// 6. Suporte individual × grupo (tela cheia): conversa só dela, o grupo cheio, e a dúvida respondida
			{
				tipo: 'peca',
				nome: 'd34Suporte',
				modo: 'cheia',
				de: b.at('suporte') - 0.04,
				ate: b.say('é escalar').inicio - 0.04,
				dados: {...su, marcos: Object.values(su)},
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
				sons: [
					{em: su.grupo, som: 'pro_msg', ganho: 0.6},
					{em: su.tirar, som: 'pro_msg', ganho: 0.6},
				],
			},
			// 7. Escalar e gigantes
			{
				tipo: 'frase',
				de: b.say('é escalar').inicio - 0.04,
				ate: b.at('porque') - 0.05,
				palavras: [
					{texto: 'AGORA É', em: b.say('é escalar').inicio},
					{texto: 'ESCALAR', em: b.at('escalar'), destaque: true},
				],
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
			},
			{
				tipo: 'numero3d',
				de: b.at('caras', 3) - 0.05,
				ate: b.say('Eu deixo aqui uma').inicio - 0.05,
				texto: 'GIGANTES',
				rotulo: 'OS CARAS SÃO',
				em: b.at('gigantes.') - 0.1,
				y: 400,
				esconderLegenda: true,
				som: 'pro_pop',
			},
			// 8. Indicação
			{tipo: 'selo', de: b.at('indicação') - 0.05, ate: b.at('Danilow', 2) - 0.08, texto: 'EU INDICO', y: 380, esconderLegenda: true, som: 'pro_swipe'},
			{tipo: 'pilula', de: b.at('Danilow', 2) - 0.05, ate: b.at('muito') - 0.08, rotulo: 'MENTORIA', nome: 'Danilow', y: 0.56, esconderLegenda: true},
			{
				tipo: 'frase',
				de: b.at('muito') - 0.08,
				ate: aprendi,
				palavras: [
					{texto: 'MUITO BOM', em: b.at('muito'), destaque: true},
				],
				esconderLegenda: true,
				som: 'pro_pop',
			},
			// 9. Escalando: a live dela cheia
			{
				tipo: 'live',
				de: b.at('escalando') - 0.05,
				ate: b.at('aprendendo') - 0.05,
				espectadores: '1,8 mil',
				curtidas: '12,4 mil curtidas',
				comentarios: [
					{nome: 'Carla', texto: 'quero 1!'},
					{nome: 'Rô', texto: 'chegou hoje ✅'},
				],
				esconderLegenda: true,
				som: 'pro_whoosh',
			},
			// 10. Minerar → escalar em cartas 3D
			{
				tipo: 'cards3d',
				de: b.at('minerar,') - 0.1,
				ate: b.at('escolher') - 0.05,
				itens: [
					{texto: 'MINERAR', em: b.at('minerar,') - 0.05},
					{texto: 'ESCALAR', em: b.at('escalar', 2) - 0.05},
				],
				y: 1010,
				som: 'pro_tick',
			},
			// 11. Produto campeão (tela cheia): pódio 3D e troféu de ouro que pousa no 1º lugar
			{
				tipo: 'peca',
				nome: 'd34Campeao',
				modo: 'cheia',
				de: b.at('escolher') - 0.05,
				ate: b.say('Não existe segredo').inicio - 0.05,
				dados: {pousa: b.at('campeão.'), campeao: b.at('campeão.') + 0.03, marcos: [b.at('campeão.')]},
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
				sons: [{em: b.at('campeão.') + 0.1, som: 'pro_pop', ganho: 0.75}],
			},
			// 12. Sem segredo (cofre riscado), sem milagre (varinha riscada) → constância, dedicação e produto certo empilhados
			{
				tipo: 'peca',
				nome: 'd34SemSegredo',
				modo: 'cheia',
				de: b.say('Não existe segredo').inicio - 0.05,
				ate: b.say('O Danilow deixou').inicio - 0.05,
				dados: {...ss, marcos: Object.values(ss)},
				esconderLegenda: true,
				som: null,
				sons: [
					{em: ss.segredo + 0.15, som: 'pro_swipe', ganho: 0.6},
					{em: ss.constancia, som: 'pro_pop', ganho: 0.6},
					{em: ss.certo, som: 'pro_pop', ganho: 0.8},
				],
			},
			// 13. Danilow deixou claro desde o início; especialistas
			{tipo: 'pilula', de: b.say('O Danilow deixou').inicio - 0.03, ate: b.at('claro') + 0.3, rotulo: 'MENTOR', nome: 'Danilow', y: 0.56, esconderLegenda: true, som: 'pro_swipe'},
			{tipo: 'selo', de: b.at('desde') - 0.05, ate: b.at('com', 2) - 0.05, texto: 'DESDE O INÍCIO', y: 380, esconderLegenda: true, som: 'pro_tick'},
			{tipo: 'frase', de: b.at('são', 3) - 0.05, ate: b.at('cada') - 0.05, palavras: [{texto: 'SÃO', em: b.at('são', 3)}, {texto: 'INCRÍVEIS', em: b.at('incríveis,'), destaque: true}], esconderLegenda: true, som: 'pro_whoosh_curto'},
			{tipo: 'selo', de: b.at('excelência') - 0.05, ate: b.at('sobre') - 0.05, texto: 'ESPECIALISTAS', y: 380, esconderLegenda: true, som: 'pro_tick'},
			// 14. Equipe de especialistas em live TikTok Shop
			{
				tipo: 'live',
				de: b.at('sobre') - 0.03,
				ate: b.at('Shop.') + 0.45,
				host: 'TikTok Shop',
				espectadores: '3,2 mil',
				curtidas: '28,7 mil curtidas',
				comentarios: [
					{nome: 'Ju', texto: 'manda o link!'},
					{nome: 'Léo', texto: 'quero 2'},
				],
				esconderLegenda: true,
				som: 'pro_whoosh',
			},
			// 15. Fecho
			{tipo: 'selo', de: b.at('indicação', 2) - 0.05, ate: b.at('só') - 0.05, texto: 'MINHA INDICAÇÃO', y: 380, esconderLegenda: true, som: 'pro_swipe'},
			{
				tipo: 'frase',
				de: b.at('só') - 0.05,
				ate: fimFala,
				palavras: [
					{texto: 'SÓ', em: b.at('só')},
					{texto: 'FAÇAM', em: b.at('façam.'), destaque: true},
				],
				esconderLegenda: true,
				som: 'pro_frase',
			},
			{tipo: 'final', de: fimFala, ate: fimFala + 2.4, marca: 'Danilow', sub: 'MENTORIA', som: 'pro_logo'},
		];
	},
};
