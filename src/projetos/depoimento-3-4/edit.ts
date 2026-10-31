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

// Tira as pausas medidas (≥ 0,25 s) dentro de cada bloco, com 0,06 s de ar de cada lado.
const TRECHOS: Trecho[] = (() => {
	const out: Trecho[] = [];
	for (const [a, z] of BLOCOS) {
		let ini = a;
		for (const [s0, s1] of silencios as Trecho[]) {
			if (s0 <= ini + 0.1 || s1 >= z - 0.1 || s1 - s0 < 0.25) continue;
			out.push([ini, s0 + 0.06]);
			ini = s1 - 0.06;
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
	extraFim: 2.4,
	transcricao,
	trechos: () => TRECHOS,
	legenda: {
		estilo: 'mare',
		altura: 0.656,
		palavrasPorTela: 4,
		enfase: [
			{palavra: 'iniciante', estilo: 'serif'},
			{palavra: 'individual,', estilo: 'serif'},
			{palavra: 'campeão.', estilo: 'serif'},
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
		lista.push(
			{tipo: 'flash', em: b.at('100%') - 0.04},
			{tipo: 'chicote', em: b.at('É,')},
			{tipo: 'mergulho', em: b.at('pega')},
			{tipo: 'flash', em: b.at('certo.') - 0.04},
		);
		return lista;
	},
	cenas: (b) => {
		const fimFala = b.at('façam.') + 0.5;
		return [
			// 1. Gancho: NÃO EXISTE / PERFIL FLOPADO e o 100% PRODUTO em ouro 3D
			{
				tipo: 'frase',
				de: 0,
				ate: b.at('que', 1) - 0.02,
				palavras: [
					{texto: 'NÃO EXISTE', em: b.at('não')},
					{texto: 'PERFIL', em: b.at('perfil')},
					{texto: 'FLOPADO', em: b.at('flopado,'), destaque: true},
				],
				som: 'pro_whoosh',
			},
			{
				tipo: 'numero3d',
				de: b.at('que', 1) - 0.02,
				ate: b.at('É,') - 0.04,
				texto: '100%',
				rotulo: 'É',
				abaixo: 'PRODUTO',
				em: b.at('que', 1),
				y: 400,
				esconderLegenda: true,
				som: 'pro_pop',
			},
			// 2. Mentor e equipe
			{tipo: 'pilula', de: b.at('Danilow') - 0.08, ate: b.at('do', 2) - 0.05, rotulo: 'MENTORIA', nome: 'Danilow', y: 0.56, esconderLegenda: true, som: 'pro_swipe'},
			{
				tipo: 'chips',
				de: b.at('Felipe,') - 0.08,
				ate: b.at('os') - 0.05,
				itens: [
					{texto: 'FELIPE', em: b.at('Felipe,') - 0.05},
					{texto: 'MATHEUS', em: b.at('Matheus,') - 0.05},
				],
				y: 1040,
				esconderLegenda: true,
				som: 'pro_tick',
				sons: [{em: b.at('Matheus,') - 0.05, som: 'pro_tick'}],
			},
			{
				tipo: 'frase',
				de: b.at('são') - 0.05,
				ate: b.at('essa', 2) - 0.05,
				palavras: [
					{texto: 'SÃO', em: b.at('são')},
					{texto: 'GIGANTES', em: b.at('gigantes,'), destaque: true},
				],
				som: 'pro_whoosh_curto',
			},
			// 3. O que a mentoria ensina na prática
			{
				tipo: 'chips',
				de: b.at('formato,') - 0.1,
				ate: b.at('tudo') - 0.05,
				itens: [
					{texto: 'FORMATO', em: b.at('formato,') - 0.05},
					{texto: 'MINERAÇÃO', em: b.at('mineração,') - 0.05},
				],
				y: 1040,
				numerado: true,
				esconderLegenda: true,
				som: 'pro_tick',
				sons: [{em: b.at('mineração,') - 0.05, som: 'pro_tick'}],
			},
			// 4. Dor: perfil zerado (0 seguidores em prata)
			{
				tipo: 'numero3d',
				de: b.at('perfil', 2) - 0.1,
				ate: b.at('né,', 2) - 0.05,
				texto: '0',
				rotulo: 'SEGUIDORES',
				abaixo: 'PERFIL ZERADO',
				metal: 'branco',
				em: b.at('perfil', 2) - 0.05,
				y: 400,
				esconderLegenda: true,
				som: 'pro_pop',
			},
			{tipo: 'selo', de: b.at('iniciante,') - 0.05, ate: b.at('deixei') - 0.05, texto: 'INICIANTE', chip: 'DO ZERO', emChip: b.at('zerado,', 2) - 0.1, y: 380, som: 'pro_tick'},
			{
				tipo: 'frase',
				dor: true,
				de: b.at('deixei') - 0.05,
				ate: b.at('realmente', 2) - 0.05,
				palavras: [
					{texto: 'OUTROS NICHOS', em: b.at('nicho')},
					{texto: 'DE LADO', em: b.at('lado'), destaque: true},
				],
				som: 'pro_whoosh',
			},
			// 5. Virada: pega pela mão, suporte individual
			{
				tipo: 'frase',
				de: b.at('pega') - 0.05,
				ate: b.at('o', 3) - 0.02,
				palavras: [
					{texto: 'PEGA', em: b.at('pega')},
					{texto: 'PELA MÃO', em: b.at('pela'), destaque: true},
				],
				som: 'pro_frase',
			},
			{
				tipo: 'selo',
				de: b.at('suporte', 2) - 0.05,
				ate: b.at('então', 2) - 0.05,
				texto: 'SUPORTE INDIVIDUAL',
				chip: '1 A 1',
				emChip: b.at('individual,') - 0.05,
				y: 380,
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			{tipo: 'comentario', de: b.at('tirar') - 0.1, ate: b.at('daqui') - 0.05, texto: 'Como eu escolho o produto?', y: 1040, som: 'pro_digita'},
			// 6. Escalar
			{
				tipo: 'frase',
				de: b.at('escalar') - 0.05,
				ate: b.at('aí,') + 0.1,
				palavras: [
					{texto: 'AGORA É', em: b.at('é', 3)},
					{texto: 'ESCALAR', em: b.at('escalar'), destaque: true},
				],
				som: 'pro_whoosh_curto',
			},
			{
				tipo: 'numero3d',
				de: b.at('gigantes.') - 0.25,
				ate: b.at('Eu') - 0.05,
				texto: 'GIGANTES',
				rotulo: 'OS CARAS SÃO',
				em: b.at('gigantes.') - 0.2,
				y: 400,
				esconderLegenda: true,
				som: 'pro_pop',
			},
			// 7. Indicação
			{tipo: 'selo', de: b.at('indicação') - 0.05, ate: b.at('Eu', 2) - 0.05, texto: 'EU INDICO', chip: 'MENTORIA', emChip: b.at('mentoria', 3), y: 380, som: 'pro_swipe'},
			// 8. Escalando: a live dela cheia
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
				som: 'pro_whoosh',
			},
			// 9. Os passos em cartas 3D: minerar → escalar → produto campeão
			{
				tipo: 'cards3d',
				de: b.at('minerar,') - 0.1,
				ate: b.at('Não') - 0.05,
				itens: [
					{texto: 'MINERAR', em: b.at('minerar,') - 0.05},
					{texto: 'ESCALAR', em: b.at('escalar', 2) - 0.05},
					{texto: 'PRODUTO CAMPEÃO', em: b.at('escolher') - 0.05},
				],
				y: 1010,
				som: 'pro_tick',
				sons: [
					{em: b.at('escalar', 2) - 0.05, som: 'pro_tick'},
					{em: b.at('escolher') - 0.05, som: 'pro_tick'},
				],
			},
			// 10. Sem segredo, sem milagre
			{
				tipo: 'frase',
				dor: true,
				de: b.at('Não') - 0.05,
				ate: b.at('existe', 5) - 0.04,
				palavras: [
					{texto: 'SEM SEGREDO', em: b.at('segredo,')},
					{texto: 'SEM MILAGRE', em: b.at('milagre,'), destaque: true},
				],
				som: 'pro_frase',
			},
			// 11. O que existe: constância, dedicação e o produto certo (um por vez, o último em ouro)
			{
				tipo: 'medo3d',
				de: b.at('existe', 5) - 0.04,
				ate: b.at('O', 1) - 0.05,
				y: 330,
				linhas: [
					{texto: 'CONSTÂNCIA', em: b.at('constância,'), metal: 'branco'},
					{texto: 'DEDICAÇÃO', em: b.at('dedicação'), metal: 'branco'},
					{texto: 'PRODUTO CERTO', em: b.at('produto', 4), metal: 'ouro'},
				],
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [
					{em: b.at('dedicação'), som: 'pro_tick'},
					{em: b.at('produto', 4), som: 'pro_pop'},
				],
			},
			// 12. Danilow deixou claro desde o início
			{tipo: 'pilula', de: b.at('Danilow', 3) - 0.08, ate: b.at('claro') + 0.3, rotulo: 'MENTOR', nome: 'Danilow', y: 0.56, esconderLegenda: true, som: 'pro_swipe'},
			// 13. Equipe de especialistas em live TikTok Shop
			{
				tipo: 'live',
				de: b.at('live') - 0.3,
				ate: b.at('Shop.') + 0.45,
				host: 'TikTok Shop',
				espectadores: '3,2 mil',
				curtidas: '28,7 mil curtidas',
				comentarios: [
					{nome: 'Ju', texto: 'manda o link!'},
					{nome: 'Léo', texto: 'quero 2'},
				],
				som: 'pro_whoosh',
			},
			// 14. Fecho
			{
				tipo: 'frase',
				de: b.at('só') - 0.05,
				ate: fimFala,
				palavras: [
					{texto: 'SÓ', em: b.at('só')},
					{texto: 'FAÇAM', em: b.at('façam.'), destaque: true},
				],
				som: 'pro_frase',
			},
			{tipo: 'final', de: fimFala, ate: fimFala + 2.4, marca: 'Danilow', sub: 'MENTORIA', som: 'pro_logo'},
		];
	},
};
