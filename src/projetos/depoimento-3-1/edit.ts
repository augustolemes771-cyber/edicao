import type {EfeitoCamera, Edit} from '../../motor/plano';
import type {Busca, Trecho} from '../../motor/palavras';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// Depoimento 3-1 (tema Depoimentos): mentorada terminando uma live no TikTok agradece aos meninos da M4.
// Roteiro: gancho "3 anos tentando no digital, nunca tinha tido resultado" → abre a live e o agradecimento → mentorias caras que
// não entregavam a metade → divisor de água → pediu demissão da CLT há 1 mês → Matheus, Felipe e Danilow → humanos, ligam, mandam
// mensagem → era iniciante → teste de hoje → só o início → fora da curva → cartão final.
// Pausas medidas pela energia da voz (banda 250–3500 Hz, 20 ms) em silencios.json; a transcrição foi encaixada nelas (o Whisper
// adiantava até 0,5 s o começo das frases depois de pausa).
const P = {x: 0.5, y: 0.36};

// Trechos no tempo original. O gancho ("três anos ... resultado") termina onde a fala recomeça depois ("já tive várias"), e o
// "porque já fazia" entre "M4" e "três" sai (sem palavra repetida).
const TRECHOS: Trecho[] = [
	[11.62, 16.6], // três anos que eu tentava no digital, né, e eu nunca tinha tido resultado,
	[0.6, 10.72], // Oi, tava aqui finalizando mais uma live ... aos meninos da M4,
	[16.94, 59.78], // já tive várias mentorias ... os meninos são fora da curva, com certeza.
];

// Ritmo frenético (evento a cada 0,3–0,6 s): punch-in nas palavras em ciclo médio → close → aberto. Fonte baixa: zoom ≤ 1,24.
const ESCALAS = [1.08, 1.16, 1.24, 1.1, 1.2, 1.02];
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

export const depoimento31: Edit = {
	pasta: 'projetos/depoimento-3-1',
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
		// Tira todas as pausas medidas (≥ 0,19 s; as de 0,15 s podem ser a oclusão de uma consoante) que caem dentro de um trecho, com 0,04 s de ar de cada lado.
		const cortado: Trecho[] = [];
		for (const [a, z] of TRECHOS) {
			let ini = a;
			for (const [s0, s1] of silencios as Trecho[]) {
				if (s0 <= ini + 0.1 || s1 >= z - 0.1 || s1 - s0 < 0.19) continue;
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
			{palavra: 'mentorias', estilo: 'serif'},
			{palavra: 'entrega', estilo: 'serif'},
			{palavra: 'grata', estilo: 'serif'},
		],
	},
	camera: (b) => {
		const z = (em: number, escala: number): EfeitoCamera => ({tipo: 'zoom', em, escala, ...P});
		const intro = b.say('Oi, tava aqui').inicio;
		return [
			// Gancho: close desde o início, clarão na batida do número
			z(0, 1.16),
			{tipo: 'flash', em: 0.02},
			...punches(b, 'tentava no digital, né, e eu nunca tinha tido resultado', 0.45),
			// Volta para o começo da gravação: deslize e plano aberto
			{tipo: 'deslize', em: intro, direcao: 'esquerda'},
			z(intro, 1.0),
			...punches(b, 'finalizando mais uma live no TikTok', 0.5),
			...punches(b, 'tentando escalar um produto', 0.5),
			...punches(b, 'então resolvi deixar esse relato de agradecimento aqui aos meninos da M4', 0.5),
			...punches(b, 'já tive várias mentorias de valores bem agregados até, que não entregavam a metade do que os meninos estão entregando', 0.5),
			...punches(b, 'e realmente foi um divisor de água no digital pra mim', 0.5),
			...punches(b, 'Eu resolvi pedir demissão do CLT há pouco mais de um mês, e foi quando eu conheci eles', 0.5),
			...punches(b, 'então o Matheus, o Felipe e o Danilow fizeram, assim, uma entrega muito grande', 0.5),
			...punches(b, 'eles são muito humanos, ligam, mandam mensagem pra saber o que é que tá acontecendo', 0.5),
			...punches(b, 'o que é que não tá dando certo, até a gente conseguir', 0.5),
			{tipo: 'mergulho', em: b.say('Eu era completamente').inicio},
			...punches(b, 'Eu era completamente iniciante, na minha turma tem gente avançadíssima', 0.5),
			...punches(b, 'esse aqui foi um dos testes de hoje, nada muito expressivo', 0.5),
			...punches(b, 'mas eu tenho certeza que isso é só o início', 0.5),
			{tipo: 'flash', em: b.say('só o início').inicio - 0.04},
			...punches(b, 'e eu tô muito grata por isso, porque os meninos são fora da curva, com certeza', 0.5),
		];
	},
	cenas: (b) => {
		const fimFala = b.say('com certeza').fim;
		const nunca = b.say('nunca tinha tido').inicio;
		return [
			// 1. Gancho: 3 ANOS em prata 3D (o "antes") acima da cabeça
			{
				tipo: 'numero3d',
				de: 0,
				ate: nunca - 0.05,
				texto: '3 ANOS',
				rotulo: 'TENTANDO NO DIGITAL',
				metal: 'branco',
				em: 0,
				esconderLegenda: true,
				som: 'pop',
			},
			// 2. "nunca tinha tido resultado": gráfico de 3 anos reto no zero, R$ 0 em prata 3D (peça nova)
			{
				tipo: 'peca',
				nome: 'd31Zero',
				modo: 'cheia',
				de: nunca - 0.03,
				ate: b.say('tido resultado').fim + 0.02,
				dados: {emZero: b.say('resultado').inicio},
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
				sons: [{em: b.say('resultado').inicio, som: 'pro_pouso', ganho: 0.7}],
			},
			// 3. "mais uma live no TikTok": a live dela passa pela tela
			{
				tipo: 'live',
				de: b.say('mais uma live').inicio - 0.05,
				ate: b.say('escalar um produto').fim + 0.05,
				espectadores: '48',
				curtidas: '1,2 mil curtidas',
				comentarios: [
					{nome: 'Ana', texto: 'quero 1!'},
					{nome: 'Carla', texto: 'qual o valor?'},
				],
				som: 'whoosh',
			},
			// 4. O relato
			{
				tipo: 'selo',
				de: b.say('relato de agradecimento').inicio - 0.08,
				ate: b.say('aqui aos meninos').inicio - 0.05,
				texto: 'AGRADECIMENTO',
				chip: 'RELATO',
				emChip: b.say('relato').inicio,
				y: 380,
				esconderLegenda: true,
				som: 'tick',
			},
			// 5. Os meninos da M4
			{
				tipo: 'selo',
				de: b.say('aos meninos da M4').inicio - 0.05,
				ate: b.say('aos meninos da M4').fim + 0.02,
				texto: 'MENINOS DA M4',
				chip: 'OBRIGADA',
				emChip: b.say('meninos da M4').inicio,
				y: 380,
				esconderLegenda: true,
				som: 'swish',
			},
			// 6–7. Mentorias caras que não entregavam a metade: cartões $$$ + barra de entrega que trava em 50% (peça nova)
			{
				tipo: 'peca',
				nome: 'd31Metade',
				modo: 'cheia',
				de: b.say('várias mentorias').inicio - 0.05,
				ate: b.say('a metade').fim + 0.5,
				dados: {
					emCartas: b.say('várias mentorias').inicio,
					emValores: b.say('valores bem agregados').inicio,
					emEntrega: b.say('não entregavam').inicio,
					emMetade: b.say('a metade').inicio,
				},
				esconderLegenda: true,
				som: 'pro_whoosh',
				sons: [
					{em: b.say('valores bem agregados').inicio, som: 'pro_pop', ganho: 0.7},
					{em: b.say('a metade').inicio, som: 'pro_pouso', ganho: 0.7},
				],
			},
			// 8. Divisor de água: antes × depois em grade, com título 3D
			{
				tipo: 'gradeAntesDepois',
				de: b.say('um divisor de água').inicio - 0.05,
				ate: b.say('pra mim').fim + 0.08,
				titulo: [
					{texto: 'DIVISOR', em: b.say('divisor').inicio},
					{texto: 'DE ÁGUA', em: b.say('de água').inicio},
				],
				antes: {texto: 'ANTES', em: b.say('de água').inicio + 0.1},
				depois: {texto: 'DEPOIS', em: b.say('no digital pra mim').inicio},
				som: 'whoosh',
				sons: [{em: b.say('no digital pra mim').inicio, som: 'swish'}],
			},
			// 9. Pediu demissão da CLT: carteira de trabalho carimbada DEMISSÃO e jogada fora (peça nova)
			{
				tipo: 'peca',
				nome: 'd31Demissao',
				modo: 'cheia',
				de: b.say('Eu resolvi pedir').inicio - 0.03,
				ate: b.say('do CLT').fim + 0.05,
				dados: {emCarimbo: b.say('demissão').inicio, emSai: b.say('do CLT').inicio},
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [{em: b.say('demissão').inicio, som: 'pro_pouso', ganho: 0.8}],
			},
			// 10. Há pouco mais de 1 mês: ouro 3D (o "depois")
			{
				tipo: 'numero3d',
				de: b.say('há pouco mais').inicio - 0.05,
				ate: b.say('um mês').fim + 0.25,
				texto: '1 MÊS',
				rotulo: 'FORA DA CLT HÁ',
				abaixo: 'POUCO MAIS DE',
				em: b.say('há pouco mais').inicio,
				esconderLegenda: true,
				som: 'pop',
			},
			// 11. Os três mentores, um chip por nome (começo de cada nome medido na energia da voz)
			{
				tipo: 'chips',
				de: b.say('o Matheus').inicio - 0.05,
				ate: b.say('o Danilow').fim + 0.45,
				itens: [
					{texto: 'MATHEUS', em: b.say('Matheus').inicio},
					{texto: 'FELIPE', em: b.say('Felipe').inicio},
					{texto: 'DANILOW', em: b.say('Danilow').inicio},
				],
				y: 1060,
				esconderLegenda: true,
				som: 'tick',
				sons: [
					{em: b.say('Felipe').inicio, som: 'pro_tick'},
					{em: b.say('Danilow').inicio, som: 'pro_tick'},
				],
			},
			// 12. Muito humanos
			{
				tipo: 'frase',
				de: b.say('são muito humanos').inicio - 0.05,
				ate: b.say('ligam').inicio - 0.06,
				palavras: [
					{texto: 'MUITO', em: b.say('muito humanos').inicio},
					{texto: 'HUMANOS', em: b.say('humanos').inicio, destaque: true},
				],
				som: 'pro_whoosh_curto',
			},
			// 13. Ligam e mandam mensagem: notificações dos mentores chegando no celular
			{
				tipo: 'notificacoes',
				de: b.say('ligam').inicio - 0.05,
				ate: b.say('a gente conseguir').fim + 0.1,
				icone: 'mensagem',
				itens: [
					{titulo: 'Matheus', texto: 'Ligação de voz', em: b.say('ligam').inicio},
					{titulo: 'Felipe', texto: 'Como foi a live hoje?', em: b.say('mandam mensagem').inicio},
					{titulo: 'Danilow', texto: 'O que não deu certo? Bora ajustar', em: b.say('não tá dando certo').inicio},
				],
				esconderLegenda: true,
				somItem: 'pro_msg',
				ganhoItem: 0.6,
			},
			// 14. Iniciante × turma avançadíssima
			{
				tipo: 'chips',
				de: b.say('completamente iniciante').inicio - 0.05,
				ate: b.say('gente avançadíssima').fim + 0.1,
				itens: [
					{texto: 'EU: INICIANTE', em: b.say('iniciante').inicio},
					{texto: 'TURMA AVANÇADÍSSIMA', em: b.say('avançadíssima').inicio},
				],
				y: 1060,
				esconderLegenda: true,
				som: 'tick',
				sons: [{em: b.say('avançadíssima').inicio, som: 'pro_tick'}],
			},
			// 15. O teste de hoje
			{
				tipo: 'selo',
				de: b.say('um dos testes').inicio - 0.08,
				ate: b.say('muito expressivo').fim + 0.02,
				texto: 'TESTE DE HOJE',
				chip: 'LIVE',
				emChip: b.say('testes').inicio,
				y: 380,
				esconderLegenda: true,
				som: 'swish',
			},
			// 16. Só o início
			{
				tipo: 'frase',
				de: b.say('só o início').inicio - 0.06,
				ate: b.say('só o início').fim + 0.15,
				palavras: [
					{texto: 'SÓ O', em: b.say('só o início').inicio},
					{texto: 'INÍCIO', em: b.say('início').inicio, destaque: true},
				],
				som: 'pro_whoosh_curto',
			},
			// 17. Fora da curva: curva normal da turma e um ponto de luz que salta para fora dela + texto 3D (peça nova)
			{
				tipo: 'peca',
				nome: 'd31Curva',
				modo: 'cheia',
				de: b.say('os meninos são fora').inicio - 0.05,
				ate: fimFala + 0.05,
				dados: {emFora: b.say('fora').inicio, emCurva: b.say('da curva').inicio},
				esconderLegenda: true,
				som: 'pro_whoosh',
				sons: [{em: b.say('fora').inicio, som: 'pro_pop', ganho: 0.7}],
			},
			// 18. Cartão final
			{tipo: 'final', de: fimFala + 0.1, ate: fimFala + 2.4, marca: 'Danilow', sub: 'MENTORIA M4', som: 'pro_logo'},
		];
	},
};
