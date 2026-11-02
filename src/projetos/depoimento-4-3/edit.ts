import type {EfeitoCamera, Edit} from '../../motor/plano';
import type {Busca, Trecho} from '../../motor/palavras';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// Depoimento 4-3 (tema Depoimentos): mentorado do TikTok Shop, gravado no carro (fonte do WhatsApp, 480x848).
// Roteiro: gancho 9 mil → mais de 30 mil de GMV num dia → começou em março com live gravada → o TikTok muda e quem não
// acompanha fica defasado → mentorias vagas, perdido, sem base → setembro: mentoria com Danilow, Matheus e Felipe (Método
// Lucrando com Lives) → mais que o prometido, qualquer nível, abraçada → suporte (grupo só seu, privado) → destravei →
// 1º de outubro, melhor dia → grupo leve, sem gente querendo ser mais que o outro → agradecer e indicar → cartão final.
// Pausas medidas pela energia da voz (blocos de 20 ms, banda 250–3500 Hz, < −34 dB) em silencios.json. Bordas conferidas
// transcrevendo cada recorte (whisper.cpp -dtw) e o áudio juntado; os "é...", "mas..." de hesitação ficaram de fora.
// A transcrição dentro dos trechos foi refeita pelo áudio (faster-whisper + DTW); a original está em transcricao.json.antes-realinhar.
const P = {x: 0.56, y: 0.42};

// Trechos no tempo original, na ordem da história.
const TRECHOS: Trecho[] = [
	[174.36, 177.8], // o meu melhor resultado em um único dia tinha sido 9 mil de GMV,
	[178.84, 181.04], // e eu já consegui alcançar aí,
	[182.16, 184.18], // mais de 30 mil de GMV.
	[16.8, 20.44], // Eu comecei no TikTok Shop em março,
	[24.68, 27.4], // fazendo somente trabalho com live gravada.
	[43.4, 44.12], // O TikTok
	[44.5, 45.75], // sempre vai mudando,
	[54.1, 56.5], // porque senão você vai ficar defasado.
	[96.98, 98.9], // Já participei de algumas mentorias,
	[109.5, 111.7], // então muita coisa você fica perdido,
	[117.65, 119.4], // você ainda não aprendeu nem a base.
	[60.96, 70.04], // comecinho de setembro, eu vi a possibilidade dessa mentoria com o Danilow, com o Matheus, com o Felipe, Método Lucrando com Lives,
	[129.3, 131.46], // foi entregue muito mais do que o prometido,
	[132.8, 134.3], // pessoas para qualquer nível,
	[142.46, 144.8], // ela se sentiu abraçada ali na mentoria,
	[146.76, 148.38], // fora o suporte offline,
	[151.5, 154.92], // um grupo específico para cada um, ou chamar qualquer um no privado.
	[157.18, 159.24], // Destravei um monte de coisa,
	[184.86, 188.32], // agora no dia 1º de outubro, foi o melhor dia dentro do TikTok.
	[214.86, 219.2], // Uma conversa muito sadia, leve dentro do grupo, não é aquele negócio pesado, um querendo ser mais que o outro.
	[190.9, 193.4], // Eu só tenho a agradecer e indicar.
];

// Ritmo frenético (evento a cada 0,3–0,6 s): punch-in nas palavras em ciclo. Fonte baixa: zoom ≤ 1,24.
const ESCALAS = [1.08, 1.16, 1.24, 1.1, 1.2, 1.03];
const punches = (b: Busca, frase: string, passo = 0.45, ocorrencia = 1): EfeitoCamera[] => {
	const lista: EfeitoCamera[] = [];
	let ultimo = -9;
	for (const t of b.tempos(frase, ocorrencia)) {
		if (t - ultimo < passo) continue;
		lista.push({tipo: 'zoom', em: t, escala: ESCALAS[lista.length % ESCALAS.length], ...P});
		ultimo = t;
	}
	return lista;
};

export const depoimento43: Edit = {
	pasta: 'projetos/depoimento-4-3',
	video: 'video.mp4',
	formato: 'vertical',
	// Fonte do celular em 480x848: final em 540x960 (render na qualidade do vídeo).
	escalaFinal: 0.5,
	verificarCurva: false,
	regraCamera: false,
	barraProgresso: true,
	extraFim: 2.4,
	silencios: silencios as Trecho[],
	transcricao,
	trechos: () => {
		// Tira as pausas medidas (≥ 0,19 s; as menores podem ser a oclusão de uma consoante) dentro de cada trecho, com 0,04 s de ar.
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
	// Placa clara com tinta roxa (contrasta com a camiseta vermelha); ênfase em chip roxo com serifa.
	legenda: {
		estilo: 'mare',
		altura: 0.66,
		palavrasPorTela: 4,
		enfase: [
			{palavra: 'defasado', estilo: 'serif'},
			{palavra: 'perdido', estilo: 'serif'},
			{palavra: 'prometido', estilo: 'serif'},
			{palavra: 'privado', estilo: 'serif'},
			{palavra: 'indicar', estilo: 'serif'},
		],
	},
	camera: (b) => {
		const z = (em: number, escala: number): EfeitoCamera => ({tipo: 'zoom', em, escala, ...P});
		// Zoom seco em cada emenda (quadro exato do corte), alternando close e aberto.
		const emendas = b.emendas.map((t, i) => z(t, i % 2 ? 1.04 : 1.18));
		const frases = [
			'o meu melhor resultado em um único dia tinha sido 9 mil de GMV',
			'e eu já consegui alcançar aí',
			'Eu comecei no TikTok Shop em março',
			'fazendo somente trabalho com live gravada',
			'porque senão você vai ficar defasado',
			'Já participei de algumas mentorias',
			'então muita coisa você fica perdido',
			'você ainda não aprendeu nem a base',
			'comecinho de setembro, eu vi a possibilidade dessa mentoria',
			'com o Danilow, com o Matheus, com o Felipe, Método Lucrando com Lives',
			'foi entregue muito mais do que o prometido',
			'ela se sentiu abraçada ali na mentoria',
			'um grupo específico para cada um, ou chamar qualquer um no privado',
			'agora no dia 1º de outubro, foi o melhor dia dentro do TikTok',
			'Uma conversa muito sadia, leve dentro do grupo, não é aquele negócio pesado, um querendo ser mais que o outro',
			'Eu só tenho a agradecer e indicar',
		];
		return [
			z(0, 1.16),
			{tipo: 'flash', em: 0.02},
			...frases.flatMap((f) => punches(b, f)),
			...emendas,
			// Virada (setembro) e resultado (30 mil): flash; troca para a dor: deslize.
			{tipo: 'flash', em: b.say('30 mil').inicio - 0.04},
			{tipo: 'deslize', em: b.say('Eu comecei').inicio, direcao: 'esquerda'},
			{tipo: 'mergulho', em: b.say('comecinho de setembro').inicio},
			{tipo: 'flash', em: b.say('Destravei').inicio - 0.04},
		];
	},
	cenas: (b) => {
		const fimFala = b.say('agradecer e indicar').fim;
		const gmv2 = b.say('30 mil de GMV');
		return [
			// 1. Gancho: barras ANTES 9 MIL × AGORA +30 MIL em ouro 3D (peça nova)
			{
				tipo: 'peca',
				nome: 'd43Gmv',
				de: 0,
				ate: gmv2.fim + 0.15,
				dados: {
					emMelhor: b.say('meu melhor resultado').inicio,
					em9: b.say('9 mil').inicio,
					emAgora: b.say('já consegui').inicio,
					em30: b.say('30 mil').inicio,
				},
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
				sons: [
					{em: b.say('9 mil').inicio, som: 'pro_tick', ganho: 0.6},
					{em: b.say('já consegui').inicio, som: 'pro_swipe', ganho: 0.5},
					{em: b.say('30 mil').inicio, som: 'pro_pouso', ganho: 0.7},
				],
			},
			// 2. Março: linha do tempo da jornada, pino em MAR (peça nova)
			{
				tipo: 'peca',
				nome: 'd43Linha',
				de: b.say('Eu comecei no TikTok').inicio - 0.05,
				ate: b.say('em março').fim + 0.25,
				dados: {mes: 'MAR', em: b.say('março').inicio, emRotulo: b.say('março').inicio + 0.1, rotulo: 'COMEÇO NO TIKTOK SHOP'},
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
				sons: [{em: b.say('março').inicio, som: 'pro_pop', ganho: 0.6}],
			},
			// 3. Só live gravada: AO VIVO vira GRAVADA e a barra repete (peça nova)
			{
				tipo: 'peca',
				nome: 'd43LiveGravada',
				de: b.say('fazendo somente').inicio - 0.05,
				ate: b.say('live gravada').fim + 0.15,
				dados: {emLive: b.say('trabalho com live').inicio, emGravada: b.say('gravada').inicio},
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [{em: b.say('gravada').inicio, som: 'pro_tick', ganho: 0.6}],
			},
			// 4. O TikTok muda sempre; quem fica parado é DEFASADO (peça nova)
			{
				tipo: 'peca',
				nome: 'd43Mudando',
				de: b.say('O TikTok sempre').inicio - 0.05,
				ate: b.say('ficar defasado').fim + 0.2,
				dados: {emMuda: b.say('vai mudando').inicio, emDefasado: b.say('defasado').inicio},
				esconderLegenda: true,
				som: 'pro_whoosh',
				sons: [{em: b.say('defasado').inicio + 0.1, som: 'glitch', ganho: 0.45}],
			},
			// 5. Mentorias vagas: escada sem os degraus de baixo, você perdido no chão, SEM BASE (peça nova)
			{
				tipo: 'peca',
				nome: 'd43Escada',
				de: b.say('Já participei').inicio - 0.05,
				ate: b.say('nem a base').fim + 0.2,
				dados: {
					emEscada: b.say('algumas mentorias').inicio,
					emPerdido: b.say('fica perdido').inicio,
					emBase: b.say('a base').inicio,
				},
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
				sons: [
					{em: b.say('fica perdido').inicio, som: 'pro_pop', ganho: 0.5},
					{em: b.say('a base').inicio, som: 'pro_pouso', ganho: 0.6},
				],
			},
			// 6. Setembro: a linha do tempo volta, enche de MAR a SET e finca MENTORIA
			{
				tipo: 'peca',
				nome: 'd43Linha',
				de: b.say('comecinho de setembro').inicio - 0.05,
				ate: b.say('dessa mentoria').fim + 0.1,
				dados: {mes: 'SET', em: b.say('setembro').inicio, emRotulo: b.say('dessa mentoria').inicio, rotulo: 'MENTORIA', rotuloMar: 'COMEÇO'},
				esconderLegenda: true,
				som: 'pro_whoosh',
				sons: [
					{em: b.say('setembro').inicio, som: 'pro_pop', ganho: 0.6},
					{em: b.say('dessa mentoria').inicio, som: 'pro_tick', ganho: 0.6},
				],
			},
			// 7. Os três mentores, um chip por nome
			{
				tipo: 'chips',
				de: b.say('com o Danilow').inicio - 0.05,
				ate: b.say('o Felipe').fim + 0.1,
				itens: [
					{texto: 'DANILOW', em: b.say('Danilow').inicio},
					{texto: 'MATHEUS', em: b.say('Matheus').inicio},
					{texto: 'FELIPE', em: b.say('Felipe').inicio},
				],
				y: 380,
				esconderLegenda: true,
				som: 'tick',
				sons: [
					{em: b.say('Matheus').inicio, som: 'pro_tick'},
					{em: b.say('Felipe').inicio, som: 'pro_tick'},
				],
			},
			// 8. Método Lucrando com Lives em ouro 3D
			{
				tipo: 'numero3d',
				de: b.say('Método Lucrando').inicio - 0.05,
				ate: b.say('com Lives').fim + 0.15,
				texto: 'LUCRANDO',
				rotulo: 'MÉTODO',
				abaixo: 'COM LIVES',
				em: b.say('Lucrando').inicio,
				largura: 4.2,
				esconderLegenda: true,
				som: 'pop',
			},
			// 9. Muito mais do que o prometido: ponteiro passa da marca PROMETIDO (peça nova)
			{
				tipo: 'peca',
				nome: 'd43Velocimetro',
				de: b.say('foi entregue').inicio - 0.05,
				ate: b.say('o prometido').fim + 0.15,
				dados: {emEntregue: b.say('entregue').inicio, emMais: b.say('muito mais').inicio},
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
				sons: [{em: b.say('muito mais').inicio, som: 'pro_pouso', ganho: 0.6}],
			},
			// 10. Qualquer nível: a escada agora completa, com gente em cada degrau
			{
				tipo: 'peca',
				nome: 'd43Escada',
				de: b.say('pessoas para').inicio - 0.05,
				ate: b.say('qualquer nível').fim + 0.15,
				dados: {completa: true, emEscada: b.say('pessoas para').inicio, emNivel: b.say('qualquer nível').inicio},
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [{em: b.say('qualquer nível').inicio, som: 'pro_pop', ganho: 0.6}],
			},
			// 11. Abraçada: braços de luz fecham em volta da turma (peça nova)
			{
				tipo: 'peca',
				nome: 'd43Abraco',
				de: b.say('ela se sentiu').inicio - 0.05,
				ate: b.say('na mentoria').fim + 0.15,
				dados: {emPessoas: b.say('ela se sentiu').inicio, emAbraco: b.say('abraçada').inicio},
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
				sons: [{em: b.say('abraçada').inicio, som: 'pro_pulso', ganho: 0.5}],
			},
			// 12–13. Suporte: grupo só seu e conversa privada (peça nova)
			{
				tipo: 'peca',
				nome: 'd43Chat',
				de: b.say('fora o suporte').inicio - 0.05,
				ate: b.say('no privado').fim + 0.2,
				dados: {
					emSuporte: b.say('suporte').inicio,
					emGrupo: b.say('um grupo').inicio,
					emMsg: b.say('para cada um').inicio,
					emPrivado: b.say('no privado').inicio,
					emResposta: b.say('privado').fim - 0.05,
				},
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [
					{em: b.say('um grupo').inicio + 0.13, som: 'pro_msg', ganho: 0.5},
					{em: b.say('para cada um').inicio, som: 'pro_msg', ganho: 0.5},
					{em: b.say('privado').fim - 0.05, som: 'pro_msg', ganho: 0.5},
				],
			},
			// 14. Destravei: cadeado abre e as coisas saem voando (peça nova)
			{
				tipo: 'peca',
				nome: 'd43Cadeado',
				de: b.say('Destravei').inicio - 0.05,
				ate: b.say('monte de coisa').fim + 0.12,
				dados: {emAbre: b.say('Destravei').inicio + 0.12, emCoisas: b.say('monte de coisa').inicio},
				esconderLegenda: true,
				som: 'pro_quebra',
				sons: [{em: b.say('monte de coisa').inicio, som: 'pro_pop', ganho: 0.5}],
			},
			// 15. 1º de outubro: calendário, dia 1 circulado, selo MELHOR DIA (peça nova)
			{
				tipo: 'peca',
				nome: 'd43Calendario',
				de: b.say('agora no dia').inicio - 0.05,
				ate: b.say('dentro do TikTok').fim + 0.12,
				dados: {emDia: b.say('dia 1º').inicio + 0.15, emMelhor: b.say('o melhor dia').inicio},
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [
					{em: b.say('dia 1º').inicio + 0.15, som: 'pro_tick', ganho: 0.6},
					{em: b.say('o melhor dia').inicio, som: 'pro_pouso', ganho: 0.6},
				],
			},
			// 16. Grupo leve × gente querendo ser mais que o outro (peça nova)
			{
				tipo: 'peca',
				nome: 'd43Leve',
				de: b.say('Uma conversa').inicio - 0.05,
				ate: b.say('que o outro').fim + 0.12,
				dados: {
					emLeve: b.say('leve dentro').inicio,
					emPesado: b.say('negócio pesado').inicio,
					emDisputa: b.say('um querendo').inicio,
					emX: b.say('que o outro').inicio,
				},
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
				sons: [
					{em: b.say('leve dentro').inicio, som: 'pro_pop', ganho: 0.5},
					{em: b.say('negócio pesado').inicio + 0.25, som: 'pro_pouso', ganho: 0.6},
					{em: b.say('que o outro').inicio, som: 'pro_tick', ganho: 0.6},
				],
			},
			// 17. Agradecer e indicar
			{
				tipo: 'frase',
				de: b.say('Eu só tenho').inicio - 0.05,
				ate: fimFala + 0.12,
				palavras: [
					{texto: 'AGRADECER', em: b.say('agradecer').inicio},
					{texto: 'E INDICAR', em: b.say('e indicar').inicio, destaque: true},
				],
				som: 'pro_whoosh_curto',
			},
			// 18. Cartão final
			{tipo: 'final', de: fimFala + 0.15, ate: fimFala + 2.4, marca: 'Danilow', sub: 'MÉTODO LUCRANDO COM LIVES', som: 'pro_logo'},
		];
	},
};
