import type {EfeitoCamera, Edit} from '../../motor/plano';
import type {Busca, Trecho} from '../../motor/palavras';
import transcricao from './transcricao.json';

// Depoimento de mentorada (celular, 464x832, WhatsApp). Sem número: o gancho é a frase de recomendação mais forte
// ("vocês são resposta de oração na minha vida"), que sai do meio da fala e não se repete depois.
// Roteiro: gancho → falar dos mentores é fácil, de longe a melhor → chegou agora, leiga → aprendeu rápido → outras
// mentorias não entregam nem 1/3 → conteúdo + pessoas → de coração, a melhor → prosperidade dos mentorados → pessoas de
// verdade → gratidão → fora da curva, parabéns → cartão final.
// Rosto em x≈0,55, y≈0,33–0,72 do quadro: legenda abaixo do queixo (0,76), textos acima da cabeça.
const P = {x: 0.54, y: 0.48};

// Trechos no tempo original, bordas nos vales de energia da voz (banda 250–3500 Hz, janelas de 10–20 ms). Fora: o
// silêncio do começo, as pausas e, no corpo, "eu falo pra eles, é vocês são resposta de oração na minha vida" (vai para o gancho).
const TRECHOS: Trecho[] = [
	[40.49, 43.94], // GANCHO: (é) vocês são resposta de oração na minha vida
	[2.22, 4.65], // Falar dos mentores
	[4.95, 11.32], // é muito fácil, gente, assim, de longe foi a melhor mentoria que eu participei, que eu estou participando, tá?
	[11.55, 14.43], // Eu cheguei no TikTok Shop agora,
	[14.78, 18.03], // eu sou totalmente leiga ainda,
	[18.2, 19.98], // mas tudo que eles me ensinaram,
	[20.7, 24.03], // eu tenho certeza que eu demoraria muito tempo pra aprender.
	[24.25, 31.32], // Por quê? Porque eu já comprei outras mentorias... nem um terço do que esses meninos entregam.
	[31.55, 35.12], // E além da entrega de conteúdo deles, é pelas
	[35.45, 35.8], // pessoas
	[35.96, 37.88], // que eles são, tá? Assim,
	[38.11, 39.58], // é de coração,
	[43.94, 44.58], // porque de longe,
	[45.72, 50.6], // gente, é a melhor mentoria que eu já participei. Eles não estão preocupados
	[50.75, 53.22], // só em prosperar, eles preocupam
	[53.48, 62.02], // mais com a prosperidade dos mentorados... gostam de pessoas de verdade.
	[62.32, 69.5], // Então, assim, é só gratidão... vocês são fora da curva, parabéns!
];

// Ritmo frenético (evento a cada 0,3–0,6 s): punch-in nas palavras, ciclo médio → close → aberto, zoom ≤ 1,25 (fonte baixa).
const ESCALAS = [1.08, 1.16, 1.24, 1.12, 1.2, 1.04];
const punches = (b: Busca, frase: string, passo = 0.5, ocorrencia = 1): EfeitoCamera[] => {
	const lista: EfeitoCamera[] = [];
	let ultimo = -9;
	for (const t of b.tempos(frase, ocorrencia)) {
		if (t - ultimo < passo) continue;
		lista.push({tipo: 'zoom', em: t, escala: ESCALAS[lista.length % ESCALAS.length], ...P});
		ultimo = t;
	}
	return lista;
};

export const depoimento32: Edit = {
	pasta: 'projetos/depoimento-3-2',
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
		altura: 0.76,
		palavrasPorTela: 4,
		enfase: [
			{palavra: 'fácil,', estilo: 'serif'},
			{palavra: 'participando,', estilo: 'serif'},
			{palavra: 'aprender.', estilo: 'serif'},
			{palavra: 'coração,', estilo: 'serif'},
			{palavra: 'sucesso,', estilo: 'serif'},
		],
	},
	camera: (b) => {
		const z = (em: number, escala: number): EfeitoCamera => ({tipo: 'zoom', em, escala, ...P});
		return [
			// Gancho: close que respira, clarão na palavra "oração"
			z(0, 1.18),
			z(b.at('resposta'), 1.1),
			{tipo: 'flash', em: b.at('oração,') - 0.04},
			z(b.at('oração,'), 1.25),
			z(b.at('vida,'), 1.14),
			// Corpo: punch nas palavras, zoom em cada emenda
			...punches(b, 'Falar dos mentores é muito fácil, gente, assim', 0.5),
			...punches(b, 'de longe foi a melhor mentoria que eu participei, que eu estou participando', 0.5),
			...punches(b, 'Eu cheguei no TikTok Shop agora', 0.45),
			...punches(b, 'mas tudo que eles me ensinaram', 0.5),
			...punches(b, 'eu tenho certeza que eu demoraria muito tempo pra aprender', 0.5),
			...punches(b, 'Porque eu já comprei outras mentorias também do TikTok', 0.5),
			...punches(b, 'do que esses meninos entregam', 0.45),
			...punches(b, 'E além da entrega de conteúdo deles', 0.5),
			...punches(b, 'Assim, é de coração', 0.4),
			...punches(b, 'Eles não estão preocupados só em prosperar', 0.5),
			...punches(b, 'Eu acho que é por isso que vocês têm tanto sucesso', 0.5),
			...punches(b, 'eu tô querendo até chorar de verdade', 0.5),
			{tipo: 'flash', em: b.at('parabéns!') - 0.04},
			z(b.at('parabéns!'), 1.22),
		];
	},
	cenas: (b) => {
		const fimFala = b.say('fora da curva, parabéns!').fim;
		return [
			// 1. Gancho: ORAÇÃO em ouro 3D acima da cabeça
			{
				tipo: 'numero3d',
				de: 0,
				ate: b.at('vida,') + 0.35,
				texto: 'ORAÇÃO',
				rotulo: 'RESPOSTA DE',
				abaixo: 'NA MINHA VIDA',
				em: b.at('resposta') - 0.1,
				esconderLegenda: true,
				som: 'pro_pop',
			},
			// 2. "Falar dos mentores é muito fácil"
			{
				tipo: 'selo',
				de: b.at('Falar') - 0.05,
				ate: b.at('gente,') + 0.1,
				texto: 'É MUITO FÁCIL',
				chip: 'FALAR DOS MENTORES',
				emChip: b.at('Falar'),
				y: 380,
				esconderLegenda: true,
				som: 'pro_tick',
			},
			// 3. De longe a melhor mentoria
			{
				tipo: 'frase',
				de: b.say('de longe foi').inicio - 0.05,
				ate: b.say('melhor mentoria que eu participei').fim + 0.1,
				palavras: [
					{texto: 'DE LONGE', em: b.say('de longe foi').inicio},
					{texto: 'A MELHOR', em: b.at('melhor'), destaque: true},
					{texto: 'MENTORIA', em: b.at('mentoria')},
				],
				som: 'pro_frase',
			},
			// 4. Chegou agora no TikTok Shop: live vazia de quem está começando
			{
				tipo: 'live',
				de: b.say('Eu cheguei no').inicio - 0.05,
				ate: b.at('agora,') + 0.4,
				host: 'Iniciante',
				espectadores: '3',
				curtidas: '12 curtidas',
				comentarios: [{nome: 'Ana', texto: 'primeira live? 👏'}],
				som: 'pro_whoosh',
			},
			// 5. Totalmente leiga → aprendeu rápido com eles: grade antes/agora
			{
				tipo: 'gradeAntesDepois',
				de: b.at('totalmente') - 0.1,
				ate: b.at('aprender.') + 0.55,
				titulo: [
					{texto: 'TOTALMENTE', em: b.at('totalmente')},
					{texto: 'LEIGA', em: b.at('leiga')},
				],
				antes: {texto: 'SOZINHA', valor: 'MUITO TEMPO', em: b.at('demoraria')},
				depois: {texto: 'COM ELES', valor: 'APRENDENDO', em: b.at('aprender.') - 0.1},
				som: 'pro_whoosh',
				sons: [{em: b.at('aprender.') - 0.1, som: 'pro_swipe', ganho: 0.7}],
			},
			// 6. Outras mentorias...
			{
				tipo: 'chips',
				de: b.at('outras') - 0.05,
				ate: b.at('não', 1) - 0.05,
				itens: [{texto: 'OUTRAS MENTORIAS DE TIKTOK', em: b.at('outras')}],
				y: 1060,
				esconderLegenda: true,
				som: 'pro_tick',
			},
			// 7. ...não entregam nem 1/3 (prata: o lado fraco da comparação)
			{
				tipo: 'numero3d',
				de: b.at('nem') - 0.2,
				ate: b.at('meninos') - 0.05,
				texto: '1/3',
				rotulo: 'NEM UM TERÇO',
				metal: 'branco',
				em: b.at('nem') - 0.15,
				esconderLegenda: true,
				som: 'pro_pop',
			},
			// 8. ...do que esses meninos entregam (ouro: o lado forte)
			{
				tipo: 'selo',
				de: b.at('meninos') - 0.05,
				ate: b.at('entregam.') + 0.45,
				texto: 'ENTREGAM',
				chip: 'ESSES MENINOS',
				emChip: b.at('meninos'),
				y: 380,
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			// 9. Conteúdo + pessoas: cartas 3D
			{
				tipo: 'cards3d',
				de: b.at('conteúdo') - 0.1,
				ate: b.at('Assim,', 2) - 0.05,
				itens: [
					{texto: 'CONTEÚDO', em: b.at('conteúdo')},
					{texto: 'PESSOAS', em: b.at('pessoas')},
				],
				y: 1010,
				som: 'pro_tick',
				sons: [{em: b.at('pessoas'), som: 'pro_tick', ganho: 0.7}],
			},
			// 10. De coração, de longe a melhor: Nº 1 em ouro 3D
			{
				tipo: 'numero3d',
				de: b.at('porque') - 0.1,
				ate: b.at('participei.') + 0.4,
				texto: 'Nº 1',
				rotulo: 'DE LONGE',
				abaixo: 'A MELHOR MENTORIA',
				em: b.at('porque'),
				esconderLegenda: true,
				som: 'pro_pop',
			},
			// 11. Prosperidade dos mentorados antes da deles
			{
				tipo: 'frase',
				de: b.at('prosperidade') - 0.1,
				ate: b.at('deles.') + 0.4,
				palavras: [
					{texto: 'A PROSPERIDADE', em: b.at('prosperidade')},
					{texto: 'DOS MENTORADOS', em: b.at('mentorados'), destaque: true},
				],
				som: 'pro_frase',
			},
			// 12. Tanto sucesso
			{
				tipo: 'selo',
				de: b.at('tanto') - 0.05,
				ate: b.at('porque', 2) - 0.05,
				texto: 'TANTO SUCESSO',
				chip: 'POR ISSO',
				emChip: b.at('isso'),
				y: 380,
				esconderLegenda: true,
				som: 'pro_tick',
			},
			// 13. Pessoas de verdade
			{
				tipo: 'frase',
				de: b.at('gostam') - 0.05,
				ate: b.at('verdade.') + 0.45,
				palavras: [
					{texto: 'GOSTAM DE PESSOAS', em: b.at('gostam')},
					{texto: 'DE VERDADE', em: b.at('verdade.') - 0.1, destaque: true},
				],
				som: 'pro_frase',
			},
			// 14. Gratidão em ouro 3D
			{
				tipo: 'numero3d',
				de: b.at('gratidão,') - 0.15,
				ate: b.at('chorar') - 0.05,
				texto: 'GRATIDÃO',
				rotulo: 'É SÓ',
				em: b.at('gratidão,') - 0.1,
				esconderLegenda: true,
				som: 'pro_pop',
			},
			// 15. Fora da curva
			{
				tipo: 'selo',
				de: b.at('fora') - 0.05,
				ate: fimFala + 0.05,
				texto: 'FORA DA CURVA',
				chip: 'PARABÉNS!',
				emChip: b.at('parabéns!'),
				y: 380,
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			// 16. Cartão final
			{tipo: 'final', de: fimFala + 0.1, ate: fimFala + 2.4, marca: 'Danilow', sub: 'TIKTOK SHOP', som: 'pro_logo'},
		];
	},
};
