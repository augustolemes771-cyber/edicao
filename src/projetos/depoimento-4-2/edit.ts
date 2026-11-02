import type {EfeitoCamera, Edit} from '../../motor/plano';
import type {Busca, Trecho} from '../../motor/palavras';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// Depoimento 4-2 (tema Depoimentos): mentorada agradece ao Danilow, Matheus e Felipe.
// Roteiro (ordem de história, crescente): gancho "um mês, em 30 dias, quase meio milhão de GMV" → quando entrou, eles tinham
// feito 240 mil em um dia → primeira live acompanhada: 5 mil em 1 hora e mais de 900 pessoas → com 15 dias de mentoria, o
// mesmo resultado em 2 dias → só parou porque acabou o estoque → operação de live aberta, ensinam a analisar (produto,
// produtor, live, funil de compra) → não sabia analisar as métricas → suporte e comunidade → agradecimento → cartão final.
// O "meio milhão" só aparece no gancho (a primeira vez que ela diz sai) e o "240 mil de GMV em um dia" repetido sai.
// Áudio baixo (fala a ~−40 dB): o silencios.json foi refeito pela energia em janelas de 10 ms (pausa = abaixo de −55 dB);
// o silencedetect a −38 dB marcava fala baixa como pausa. A transcrição foi realinhada pelo whisper com DTW + essas pausas
// (o Whisper do arquivo adiantava até 1 s), "DMV" → GMV e "fone de compra" → funil de compra.
const P = {x: 0.42, y: 0.42};

// Trechos no tempo original (bordas em pausas medidas).
const TRECHOS: Trecho[] = [
	[41.86, 43.95], // Um mês, em 30 dias, quase meio milhão de GMV.
	[0.0, 3.24], // Quando eu entrei, eu me lembro que eles tinham feito 240 mil em um dia,
	[17.19, 24.82], // na minha primeira live ... 5 mil de GMV em uma hora. E coloquei mais de 900 ... nunca tinha colocado 900 pessoas numa live.
	[8.38, 15.1], // Depois de 15 dias de mentoria ... eu fiz em dois dias, mas fiz quase o mesmo resultado que eles.
	[29.99, 37.1], // Era pra ter sido muito mais ... acabou, não tem mais ... tem que obedecer.
	[46.34, 58.27], // A operação de live deles é toda aberta ali ... funil de compra do cliente?
	[60.2, 67.08], // E isso é muito importante ... eu não sabia analisar tudo aquilo, as métricas.
	[71.8, 80.56], // O suporte dos meninos é incrível ... e você conseguir fazer.
	[88.3, 91.4], // Então, eu agradeço muito aos meninos ... Obrigada, pessoal.
];

// Ritmo frenético (evento a cada 0,3–0,6 s): punch-in nas palavras em ciclo médio → close → aberto. Fonte 1080: zoom ≤ 1,3.
const ESCALAS = [1.08, 1.17, 1.28, 1.1, 1.22, 1.03];
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

export const depoimento42: Edit = {
	pasta: 'projetos/depoimento-4-2',
	video: 'video.mp4',
	formato: 'vertical',
	verificarCurva: false,
	regraCamera: false,
	barraProgresso: true,
	extraFim: 2.4,
	silencios: silencios as Trecho[],
	transcricao,
	trechos: () => {
		// Tira todas as pausas medidas (≥ 0,15 s abaixo de −55 dB; as menores podem ser a oclusão de uma consoante) que caem
		// dentro de um trecho, com 0,04 s de ar de cada lado (o encaixe no silêncio ajusta a borda).
		const cortado: Trecho[] = [];
		for (const [a, z] of TRECHOS) {
			let ini = a;
			for (const [s0, s1] of silencios as Trecho[]) {
				if (s0 <= ini + 0.1 || s1 >= z - 0.1 || s1 - s0 < 0.15) continue;
				cortado.push([ini, s0 + 0.04]);
				ini = s1 - 0.04;
			}
			cortado.push([ini, z]);
		}
		return cortado;
	},
	// Legenda "maré" (placa de vidro clara com tinta roxa, palavra falada acende): lê sobre a camiseta branca.
	legenda: {
		estilo: 'mare',
		altura: 0.656,
		palavrasPorTela: 4,
		enfase: [
			{palavra: 'acompanhamento', estilo: 'serif'},
			{palavra: 'obedecer', estilo: 'serif'},
			{palavra: 'importante', estilo: 'serif'},
		],
	},
	camera: (b) => {
		const z = (em: number, escala: number): EfeitoCamera => ({tipo: 'zoom', em, escala, ...P});
		// Zoom seco em cada emenda (quadro exato do corte), alternando close e aberto.
		const emendas = b.emendas.map((t, i) => z(t, i % 2 ? 1.04 : 1.2));
		const perto = (t: number) => b.emendas.some((e) => Math.abs(e - t) < 0.25);
		const falas = [
			punches(b, 'Um mês, em 30 dias, quase meio milhão de GMV', 0.4),
			punches(b, 'Quando eu entrei, eu me lembro que eles tinham feito 240 mil em um dia', 0.45),
			punches(b, 'na minha primeira live, que eu fiz o acompanhamento deles, eu fiz 5 mil de GMV em uma hora', 0.5),
			punches(b, 'E coloquei mais de 900 pessoas numa live, eu nunca tinha colocado 900 pessoas numa live', 0.5),
			punches(b, 'Depois de 15 dias de mentoria, tive esse resultado aqui', 0.5),
			punches(b, 'Eles fizeram em um dia, eu fiz em dois dias, mas fiz quase o mesmo resultado que eles', 0.5),
			punches(b, 'Era pra ter sido muito mais, a gente só parou porque o produtor disse', 0.45),
			punches(b, 'Acabou, não tem mais, para de vender, que a gente não tem', 0.45),
			punches(b, 'E aí a gente obedeceu, né, tem que obedecer', 0.4),
			punches(b, 'A operação de live deles é toda aberta ali', 0.5),
			punches(b, 'Eles não escondem nada, eles falam que realmente eles estão fazendo', 0.5),
			punches(b, 'Por que que tá dando resultado? Por que que não tá dando resultado?', 0.5),
			punches(b, 'Como analisar o produto, o produtor, uma live, funil de compra do cliente', 0.5),
			punches(b, 'E isso é muito importante, é o que eu não sabia fazer quando eu fazia live', 0.45),
			punches(b, 'Quando eu tinha meus resultados, eu não sabia analisar tudo aquilo, As métricas', 0.5),
			punches(b, 'O suporte dos meninos é incrível A comunidade lá é incrível', 0.5),
			punches(b, 'Qualquer dúvida que você tiver, você joga lá Os meninos não desistem', 0.5),
			punches(b, 'Até você testar na sua dúvida e você conseguir fazer', 0.5),
			punches(b, 'Então eu agradeço muito aos meninos E agradeço a comunidade também', 0.45),
		]
			.flat()
			.filter((e) => !perto(e.em));
		return [
			// Gancho: close desde o início, clarão na primeira batida
			z(0, 1.16),
			{tipo: 'flash', em: 0.02},
			...emendas,
			...falas,
			// Virada para o aprendizado: mergulho; agradecimento: aberto e calmo no "Obrigada"
			{tipo: 'mergulho', em: b.say('A operação').inicio},
			z(b.at('Obrigada'), 1.0),
		];
	},
	cenas: (b) => {
		const fimFala = b.say('Obrigada, pessoal').fim;
		return [
			// 1. Gancho: o gráfico do mês sobe até quase a meta de R$ 500 mil; 30 DIAS (prata) → MEIO MILHÃO (ouro 3D)
			{
				tipo: 'peca',
				nome: 'd42Mes',
				modo: 'cheia',
				de: 0,
				ate: b.emendas[0],
				dados: {em30: b.at('30'), emQuase: b.at('quase'), emMeio: b.say('meio milhão').inicio, emGmv: b.say('de GMV').inicio},
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
				sons: [
					{em: b.at('30'), som: 'pro_pop', ganho: 0.7},
					{em: b.say('meio milhão').inicio, som: 'pro_pouso', ganho: 0.8},
					{em: b.say('de GMV').inicio, som: 'pro_tick', ganho: 0.6},
				],
			},
			// 2. O resultado deles: 240 MIL em prata 3D (o "antes" que ela vai alcançar)
			{
				tipo: 'numero3d',
				de: b.say('eles tinham feito').inicio - 0.03,
				ate: b.emendas[1] - 0.02,
				texto: '240 MIL',
				rotulo: 'ELES FIZERAM',
				abaixo: 'EM 1 DIA',
				metal: 'branco',
				em: b.at('240'),
				esconderLegenda: true,
				som: 'pop',
			},
			// 3. A primeira live dela, com os mentores comentando (o acompanhamento deles)
			{
				tipo: 'live',
				de: b.say('na minha primeira live').inicio - 0.03,
				ate: b.say('eu fiz 5').inicio - 0.05,
				host: 'Minha 1ª live',
				espectadores: '286',
				curtidas: '2,4 mil curtidas',
				comentarios: [
					{nome: 'Danilow', texto: 'Isso! Mostra o produto de perto'},
					{nome: 'Felipe', texto: 'Agora fala da oferta'},
				],
				som: 'whoosh',
			},
			// 4. 5 mil em 1 hora: relógio de 60 min fechando enquanto o GMV conta (peça nova)
			{
				tipo: 'peca',
				nome: 'd42Hora',
				de: b.say('eu fiz 5').inicio - 0.03,
				ate: b.say('uma hora').fim + 0.03,
				dados: {emConta: b.at('5'), emHora: b.at('hora')},
				esconderLegenda: true,
				som: 'swish',
				sons: [
					{em: b.at('5'), som: 'pro_tick', ganho: 0.7},
					{em: b.at('hora'), som: 'pro_pouso', ganho: 0.7},
				],
			},
			// 5. Mais de 900 pessoas: contador de espectadores subindo, rostinhos entrando, +900 em ouro 3D (peça nova)
			{
				tipo: 'peca',
				nome: 'd42Espectadores',
				de: b.say('E coloquei').inicio - 0.03,
				ate: b.say('900 pessoas numa live', 2).fim + 0.02,
				dados: {emSobe: b.at('coloquei'), em900: b.at('900'), emNunca: b.at('nunca'), em900b: b.at('900', 2)},
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
				sons: [
					{em: b.at('900'), som: 'pro_pop', ganho: 0.8},
					{em: b.at('nunca'), som: 'pro_tick', ganho: 0.6},
					{em: b.at('900', 2), som: 'pro_pop', ganho: 0.6},
				],
			},
			// 6. 15 dias de mentoria: folhinha virando do 1 ao 15 (peça nova)
			{
				tipo: 'peca',
				nome: 'd42Dias',
				de: b.say('Depois de 15').inicio - 0.03,
				ate: b.say('esse resultado aqui').fim + 0.02,
				dados: {em15: b.at('15'), emMentoria: b.at('mentoria')},
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [{em: b.at('15'), som: 'pro_tick', ganho: 0.7}],
			},
			// 7. Eles em 1 dia × ela em 2 dias, quase o mesmo resultado: barras + ≈ em ouro 3D (peça nova)
			{
				tipo: 'peca',
				nome: 'd42Comparacao',
				modo: 'cheia',
				de: b.say('Eles fizeram').inicio - 0.03,
				ate: b.say('resultado que eles').fim + 0.05,
				dados: {
					emEles: b.say('Eles fizeram').inicio,
					emEu: b.say('eu fiz em').inicio,
					emDois: b.say('dois dias').inicio,
					emQuase: b.say('quase o mesmo').inicio,
				},
				esconderLegenda: true,
				som: 'pro_whoosh',
				sons: [
					{em: b.say('eu fiz em').inicio, som: 'pro_pop', ganho: 0.6},
					{em: b.say('dois dias').inicio, som: 'pro_pop', ganho: 0.6},
					{em: b.say('quase o mesmo').inicio, som: 'pro_pouso', ganho: 0.8},
				],
			},
			// 8. Era pra ter sido muito mais
			{
				tipo: 'frase',
				de: b.say('Era pra ter').inicio - 0.03,
				ate: b.say('muito mais').fim + 0.04,
				palavras: [
					{texto: 'ERA PRA SER', em: b.say('Era pra ter').inicio},
					{texto: 'MUITO MAIS', em: b.say('muito mais').inicio, destaque: true},
				],
				som: 'pro_whoosh_curto',
			},
			// 9. Acabou o estoque: barra esvaziando, mensagem do produtor e carimbo ESGOTADO (peça nova)
			{
				tipo: 'peca',
				nome: 'd42Estoque',
				de: b.say('a gente só parou').inicio - 0.03,
				ate: b.say('a gente não tem').fim + 0.04,
				dados: {emProdutor: b.say('produtor disse').inicio, emAcabou: b.at('Acabou'), emPara: b.say('para de vender').inicio},
				esconderLegenda: true,
				som: 'swish',
				sons: [
					{em: b.say('produtor disse').inicio, som: 'pro_msg', ganho: 0.6},
					{em: b.at('Acabou'), som: 'pro_pouso', ganho: 0.8},
					{em: b.say('para de vender').inicio, som: 'pro_msg', ganho: 0.6},
				],
			},
			// 10. Operação de live aberta: painel de bastidores destrancado (peça nova)
			{
				tipo: 'peca',
				nome: 'd42Aberta',
				de: b.say('A operação').inicio - 0.03,
				ate: b.say('estão fazendo').fim + 0.03,
				dados: {emAberta: b.at('aberta'), emNada: b.at('nada'), emFazendo: b.at('fazendo')},
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [
					{em: b.at('aberta'), som: 'pro_pop', ganho: 0.7},
					{em: b.at('nada'), som: 'pro_tick', ganho: 0.6},
					{em: b.at('fazendo'), som: 'pro_tick', ganho: 0.5},
				],
			},
			// 11. Por que deu certo / por que não deu: gráfico sobe com ✓ e cai com ✗ (peça nova)
			{
				tipo: 'peca',
				nome: 'd42CertoErrado',
				modo: 'cheia',
				de: b.say('Por que que tá dando').inicio - 0.03,
				ate: b.say('não tá dando resultado').fim + 0.03,
				dados: {emCerto: b.say('Por que que tá dando').inicio, emErrado: b.say('não tá dando resultado').inicio},
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
				sons: [
					{em: b.say('Por que que tá dando').inicio + 0.33, som: 'pro_pop', ganho: 0.6},
					{em: b.say('não tá dando resultado').inicio + 0.33, som: 'pro_pop', ganho: 0.6},
				],
			},
			// 12. Como analisar: funil que acende camada por camada (produto, produtor, live, funil de compra) (peça nova)
			{
				tipo: 'peca',
				nome: 'd42Funil',
				modo: 'cheia',
				de: b.at('Como') - 0.03,
				ate: b.say('do cliente').fim + 0.03,
				dados: {
					emComo: b.at('Como'),
					emProduto: b.at('produto'),
					emProdutor: b.at('produtor', 2),
					emLive: b.say('uma live').inicio,
					emFunil: b.at('funil'),
					emCliente: b.at('cliente'),
				},
				esconderLegenda: true,
				som: 'pro_whoosh',
				sons: [
					{em: b.at('produto'), som: 'pro_tick', ganho: 0.6},
					{em: b.at('produtor', 2), som: 'pro_tick', ganho: 0.6},
					{em: b.say('uma live').inicio, som: 'pro_tick', ganho: 0.6},
					{em: b.at('funil'), som: 'pro_pop', ganho: 0.7},
				],
			},
			// 13. Muito importante
			{
				tipo: 'frase',
				de: b.say('E isso é muito').inicio - 0.03,
				ate: b.say('muito importante').fim + 0.04,
				palavras: [
					{texto: 'MUITO', em: b.say('muito importante').inicio},
					{texto: 'IMPORTANTE', em: b.at('importante'), destaque: true},
				],
				som: 'pro_whoosh_curto',
			},
			// 14. Não sabia analisar as métricas: etiquetas soltas com "?" que se alinham com ✓ na hora do "analisar" (peça nova)
			{
				tipo: 'peca',
				nome: 'd42Analise',
				de: b.say('é o que eu não sabia').inicio - 0.03,
				ate: b.emendas[b.emendas.findIndex((e) => e > b.at('métricas'))] - 0.02,
				dados: {emAnalisar: b.at('analisar', 2), emMetricas: b.say('As métricas').inicio},
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [
					{em: b.at('analisar', 2), som: 'pro_whoosh_curto', ganho: 0.6},
					{em: b.say('As métricas').inicio, som: 'pro_pop', ganho: 0.7},
				],
			},
			// 15. Suporte e comunidade incríveis, um chip por vez
			{
				tipo: 'chips',
				de: b.say('O suporte dos').inicio - 0.03,
				ate: b.say('lá é incrível').fim + 0.04,
				itens: [
					{texto: 'SUPORTE INCRÍVEL', em: b.say('O suporte dos').inicio},
					{texto: 'COMUNIDADE INCRÍVEL', em: b.say('A comunidade').inicio},
				],
				y: 420,
				esconderLegenda: true,
				som: 'tick',
				sons: [{em: b.say('A comunidade').inicio, som: 'pro_tick'}],
			},
			// 16. A dúvida jogada na comunidade e respondida até dar certo (peça nova)
			{
				tipo: 'peca',
				nome: 'd42Comunidade',
				de: b.at('Qualquer') - 0.03,
				ate: b.say('conseguir fazer').fim + 0.03,
				dados: {
					itens: [
						{de: 'Você', texto: 'Minha live não converte. O que eu ajusto?', em: b.at('dúvida'), eu: true},
						{de: 'Danilow', texto: 'Muda o gancho dos 3 primeiros segundos', em: b.say('Os meninos não').inicio},
						{de: 'Matheus', texto: 'Testa e manda o print das métricas', em: b.at('desistem')},
						{de: 'Ana · comunidade', texto: 'Fiz isso ontem e funcionou!', em: b.at('testar')},
						{de: 'Você', texto: 'Testei. Deu certo!!', em: b.at('conseguir'), eu: true},
					],
					emOk: b.say('conseguir fazer').fim - 0.25,
				},
				esconderLegenda: true,
				som: 'pro_msg',
				sons: [
					{em: b.say('Os meninos não').inicio, som: 'pro_msg', ganho: 0.5},
					{em: b.at('desistem'), som: 'pro_msg', ganho: 0.5},
					{em: b.at('testar'), som: 'pro_msg', ganho: 0.5},
					{em: b.at('conseguir'), som: 'pro_msg', ganho: 0.5},
					{em: b.say('conseguir fazer').fim - 0.25, som: 'pro_pop', ganho: 0.7},
				],
			},
			// 17. Agradecimento aos meninos (com os nomes) e à comunidade, um selo por vez
			{
				tipo: 'selo',
				de: b.say('Então eu agradeço').inicio - 0.03,
				ate: b.say('E agradeço').inicio - 0.04,
				texto: 'OBRIGADA, MENINOS',
				chip: 'DANILOW · MATHEUS · FELIPE',
				emChip: b.say('aos meninos').inicio,
				y: 380,
				esconderLegenda: true,
				som: 'swish',
				sons: [{em: b.say('aos meninos').inicio, som: 'pro_tick', ganho: 0.6}],
			},
			{
				tipo: 'selo',
				de: b.say('E agradeço').inicio,
				ate: fimFala + 0.04,
				texto: 'E À COMUNIDADE',
				chip: 'OBRIGADA, PESSOAL',
				emChip: b.at('Obrigada'),
				y: 380,
				esconderLegenda: true,
				som: 'tick',
				sons: [{em: b.at('Obrigada'), som: 'pro_tick', ganho: 0.6}],
			},
			// 18. Cartão final
			{tipo: 'final', de: fimFala + 0.1, ate: fimFala + 2.4, marca: 'Danilow', sub: 'MENTORIA', som: 'pro_logo'},
		];
	},
};
