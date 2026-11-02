import type {EfeitoCamera, Edit} from '../../motor/plano';
import type {Busca, Trecho} from '../../motor/palavras';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// Depoimento 4-1 (tema Depoimentos): mentorada "50+", tímida a vida toda, agradece a mentoria Lucrando com Lives (Danilow,
// Matheus e Felipe). O usuário já fez os cortes ("grata"): todo o conteúdo fica, na ordem; só saem as pausas internas.
// Pausas medidas pela energia (20 ms; banda 250–3500 Hz < −36 dB e banda cheia < −34 dB) em silencios.json.
// Roupa: camisa listrada preta e branca → destaque em ouro/roxo (contraste).
const P = {x: 0.5, y: 0.45};

// Fala inteira (0,04 s: o áudio começa mudo; 117,08 s: fim do "caminhada" baixinho).
const FALA: Trecho = [0.03, 117.08];
// Depois disto o fim do "caminhada" é baixo e picotado: nenhuma pausa sai dali (podia ser sílaba).
const SEM_CORTE_DEPOIS = 116.0;

// Ritmo frenético: punch-in a cada ~0,45 s nas palavras, zoom em cada emenda. Fonte 1080: zoom ≤ 1,35.
const ESCALAS = [1.1, 1.2, 1.3, 1.12, 1.25, 1.04, 1.18, 1.32];

export const depoimento41: Edit = {
	pasta: 'projetos/depoimento-4-1',
	video: 'video.mp4',
	formato: 'vertical',
	verificarCurva: false,
	regraCamera: false,
	barraProgresso: true,
	extraFim: 2.4,
	silencios: silencios as Trecho[],
	transcricao,
	trechos: () => {
		// Tira as pausas medidas de 0,19 s ou mais (as menores podem ser a oclusão de uma consoante), com 0,04 s de ar de cada lado.
		const cortado: Trecho[] = [];
		const [a, z] = FALA;
		let ini = a;
		for (const [s0, s1] of silencios as Trecho[]) {
			if (s0 <= ini + 0.1 || s1 >= z - 0.1 || s0 > SEM_CORTE_DEPOIS || s1 - s0 < 0.19) continue;
			cortado.push([ini, s0 + 0.04]);
			ini = s1 - 0.04;
		}
		cortado.push([ini, z]);
		return cortado;
	},
	legenda: {
		estilo: 'mare',
		altura: 0.656,
		palavrasPorTela: 4,
		enfase: [
			{palavra: 'progresso', estilo: 'serif'},
			{palavra: 'desistir.', estilo: 'serif'},
			{palavra: 'aprender.', estilo: 'serif'},
			{palavra: 'paciência', estilo: 'serif'},
			{palavra: 'mão.', estilo: 'serif'},
			{palavra: 'diferença,', estilo: 'serif'},
			{palavra: 'possibilidades', estilo: 'serif'},
			{palavra: 'evolução.', estilo: 'serif'},
			{palavra: 'coração', estilo: 'serif'},
		],
	},
	camera: (b) => {
		const z = (em: number, escala: number): EfeitoCamera => ({tipo: 'zoom', em, escala, ...P});
		// Perguntas em plano aberto e a dor sem zoom (frase estática): sem punch dentro destes intervalos.
		const calmos: [number, number][] = [
			[b.say('E sabe o que eu percebo').inicio, b.say('percebo hoje?').fim],
			[b.say('Mas sabe o que mais').inicio, b.say('tem me encantado?').fim],
			[b.say('Eu já estava desanimada').inicio, b.say('querendo desistir').fim],
		];
		const calmo = (t: number) => calmos.some(([x, y]) => t >= x - 0.05 && t < y + 0.05);
		const lista: EfeitoCamera[] = [z(0, 1.14), {tipo: 'foco', em: 0}];
		// Zoom seco em cada emenda (quadro exato do corte), alternando a escala.
		const emendas = b.emendas.filter((e) => !calmo(e));
		emendas.forEach((e, i) => lista.push(z(e, ESCALAS[(i * 3 + 1) % ESCALAS.length])));
		// Punch-ins nas palavras, longe das emendas.
		let ultimo = 0;
		let k = 0;
		for (const p of b.palavras) {
			const t = p.inicio;
			if (t - ultimo < 0.45 || calmo(t) || emendas.some((e) => Math.abs(e - t) < 0.25)) continue;
			lista.push(z(t, ESCALAS[k++ % ESCALAS.length]));
			ultimo = t;
		}
		// Planos abertos das perguntas e da dor.
		for (const [x] of calmos) lista.push(z(x, 1.0));
		// Clarão só nas duas viradas.
		lista.push({tipo: 'flash', em: b.at('acolheu.') - 0.04});
		lista.push({tipo: 'flash', em: b.at('superação.') - 0.04});
		lista.push({tipo: 'mergulho', em: b.say('Até que essa').inicio});
		return lista.sort((x, y) => x.em - y.em);
	},
	cenas: (b) => cenas(b),
};

const cenas = (b: Busca): ReturnType<Edit['cenas']> => {
	const fimFala = b.say('dessa minha caminhada.').fim;
	// Sai depois da última palavra da frase, mas antes da primeira da frase seguinte.
	const sai = (fim: number, proxima: number, folga = 0.2) => Math.min(fim + folga, proxima - 0.03);
	return [
		// 1. Gancho: "contar sobre o meu progresso"
		{
			tipo: 'textoLife',
			de: 0,
			ate: sai(b.say('meu progresso').fim, b.say('depois que eu comecei').inicio),
			kicker: 'PASSANDO PARA CONTAR',
			principal: 'meu progresso',
			palavras: b.tempos('meu progresso'),
			y: 300,
			brilho: true,
			esconderLegenda: true,
			som: 'pro_whoosh_curto',
		},
		// 2. A mentoria
		{
			tipo: 'selo',
			de: b.say('na mentoria lucrando').inicio - 0.05,
			ate: b.say('lucrando com lives').fim + 0.05,
			texto: 'LUCRANDO COM LIVES',
			chip: 'MENTORIA',
			emChip: b.say('mentoria lucrando').inicio,
			y: 360,
			esconderLegenda: true,
			som: 'swish',
		},
		// 3. Com o Danilow
		{
			tipo: 'pilula',
			de: b.say('com o Danilow.').inicio,
			ate: b.at('vinha') - 0.03,
			rotulo: 'COM O',
			nome: 'Danilow',
			y: 360,
			esconderLegenda: true,
			som: 'pro_tick',
		},
		// 4. Lives há algum tempo, tentando vender: a live dela com pouca gente
		{
			tipo: 'live',
			de: b.at('vinha'),
			ate: sai(b.say('tentando vender.').fim, b.say('Mas a verdade', 1).inicio, 0.1),
			espectadores: '4',
			curtidas: '12 curtidas',
			comentarios: [
				{nome: 'Rosa', texto: 'boa noite!'},
				{nome: 'Lu', texto: 'qual o valor?'},
			],
			som: 'whoosh',
		},
		// 5. Resultados × o que ela esperava: gráfico com a linha ESPERADO subindo e a REAL travada (peça nova)
		{
			tipo: 'peca',
			nome: 'd41Expectativa',
			modo: 'cheia',
			de: b.say('Mas a verdade', 1).inicio,
			ate: sai(b.say('como eu esperava.').fim, b.say('Eu já estava').inicio, 0.15),
			dados: {
				emEsperado: b.say('os resultados').inicio,
				emReal: b.say('não estavam acontecendo').inicio,
				emGap: b.say('como eu esperava.').inicio,
			},
			esconderLegenda: true,
			som: 'pro_whoosh',
			sons: [
				{em: b.say('não estavam acontecendo').inicio, som: 'pro_tick', ganho: 0.7},
				{em: b.say('como eu esperava.').inicio, som: 'pro_pouso', ganho: 0.7},
			],
		},
		// 6. Dor: desanimada, querendo desistir
		{
			tipo: 'frase',
			dor: true,
			de: b.say('Eu já estava').inicio,
			ate: sai(b.say('querendo desistir.').fim, b.say('Até que essa').inicio, 0.25),
			palavras: [
				{texto: 'DESANIMADA', em: b.at('desanimada,')},
				{texto: 'QUERENDO DESISTIR', em: b.at('querendo'), destaque: true},
			],
			som: 'pro_pulso',
		},
		// 7. Virada: a equipe a acolhe; dois arcos de luz dourada se fecham em volta dela como um abraço (peça nova)
		{
			tipo: 'peca',
			nome: 'd41Acolhe',
			de: b.say('Até que essa').inicio,
			ate: sai(b.say('me acolheu.').fim, b.say('E sabe o que eu').inicio, 0.3),
			dados: {emEquipe: b.say('essa equipe maravilhosa').inicio, emAcolheu: b.say('me acolheu.').inicio},
			esconderLegenda: true,
			som: 'pro_whoosh',
			sons: [{em: b.at('acolheu.'), som: 'pro_pouso', ganho: 0.7}],
		},
		// 8. "acha que está fazendo tudo certo"
		{
			tipo: 'chips',
			de: b.say('a gente acha').inicio,
			ate: sai(b.say('tudo certo.').fim, b.say('Mas a verdade', 2).inicio),
			itens: [
				{texto: 'A GENTE ACHA', em: b.say('a gente acha').inicio},
				{texto: 'TUDO CERTO', em: b.say('tudo certo.').inicio},
			],
			y: 1300,
			esconderLegenda: true,
			som: 'tick',
			sons: [{em: b.say('tudo certo.').inicio, som: 'pro_tick'}],
		},
		// 9. A verdade: muito a aprender
		{
			tipo: 'textoLife',
			de: b.say('Mas a verdade', 2).inicio,
			ate: sai(b.say('muito a aprender.').fim, b.say('E é exatamente').inicio),
			kicker: 'A VERDADE',
			principal: 'ainda temos muito a aprender',
			palavras: b.tempos('ainda temos muito a aprender.'),
			y: 300,
			brilho: true,
			esconderLegenda: true,
			som: 'pro_whoosh_curto',
		},
		// 10. Os três mentores, um chip por nome
		{
			tipo: 'chips',
			de: b.say('o Danilow, Matheus').inicio,
			ate: sai(b.say('me mostrando.').fim, b.say('Estou aprendendo').inicio),
			itens: [
				{texto: 'DANILOW', em: b.at('Danilow', 2)},
				{texto: 'MATHEUS', em: b.at('Matheus')},
				{texto: 'FELIPE', em: b.at('Felipe')},
			],
			y: 1300,
			esconderLegenda: true,
			som: 'tick',
			sons: [
				{em: b.at('Matheus'), som: 'pro_tick'},
				{em: b.at('Felipe'), som: 'pro_tick'},
			],
		},
		// 11. Enxergar as lives de outro jeito: antes × agora
		{
			tipo: 'gradeAntesDepois',
			de: b.say('Estou aprendendo').inicio,
			ate: sai(b.say('completamente diferente.').fim, b.say('Entendendo que').inicio),
			titulo: [
				{texto: 'ENXERGAR', em: b.say('a enxergar as lives').inicio},
				{texto: 'AS LIVES', em: b.say('as lives de uma').inicio},
			],
			antes: {texto: 'ANTES', em: b.say('de uma maneira').inicio},
			depois: {texto: 'AGORA', em: b.at('completamente')},
			som: 'whoosh',
			sons: [{em: b.at('completamente'), som: 'swish'}],
		},
		// 12. Produto + vitrine não basta; + técnica correta (peça nova: a conta montando)
		{
			tipo: 'peca',
			nome: 'd41Formula',
			modo: 'cheia',
			de: b.say('Entendendo que').inicio,
			ate: sai(b.say('técnica correta.').fim, b.say('Mas sabe o que mais').inicio, 0.25),
			dados: {
				emNaoBasta: b.say('não basta').inicio,
				emProduto: b.say('escolher o produto,').inicio,
				emVitrine: b.say('colocar na vitrine.').inicio,
				emTecnica: b.say('técnica correta.').inicio,
			},
			esconderLegenda: true,
			som: 'pro_whoosh',
			sons: [
				{em: b.say('escolher o produto,').inicio, som: 'pro_pop', ganho: 0.7},
				{em: b.say('colocar na vitrine.').inicio, som: 'pro_pop', ganho: 0.7},
				{em: b.say('técnica correta.').inicio, som: 'pro_pouso', ganho: 0.8},
			],
		},
		// 13. O cuidado da equipe
		{
			tipo: 'selo',
			de: b.say('O cuidado dessa').inicio,
			ate: sai(b.say('equipe maravilhosa.', 2).fim, b.say('A paciência comigo').inicio),
			texto: 'O CUIDADO',
			chip: 'DESSA EQUIPE',
			emChip: b.say('dessa equipe').inicio,
			y: 360,
			esconderLegenda: true,
			som: 'swish',
		},
		// 14. "uma mulher 50 a mais": 50+ em ouro 3D
		{
			tipo: 'numero3d',
			de: b.say('uma mulher 50').inicio,
			ate: sai(b.say('50 a mais').fim, b.say('e ainda que passou').inicio, 0.3),
			texto: '50+',
			rotulo: 'MULHER',
			em: b.at('50'),
			y: 330,
			esconderLegenda: true,
			som: 'pop',
		},
		// 15. Timidez a vida toda → superação: muro TIMIDEZ que a luz dourada quebra (peça nova)
		{
			tipo: 'peca',
			nome: 'd41Barreira',
			modo: 'cheia',
			de: b.say('e ainda que passou').inicio,
			ate: sai(b.say('é superação.').fim, b.say('E eles não simplesmente').inicio, 0.35),
			dados: {emVida: b.say('a vida toda').inicio, emTimidez: b.at('timidez.'), emQuebra: b.at('superação.')},
			esconderLegenda: true,
			som: 'pro_whoosh_curto',
			sons: [
				{em: b.at('timidez.'), som: 'pro_tick', ganho: 0.7},
				{em: b.at('superação.'), som: 'pro_quebra', ganho: 0.6},
			],
		},
		// 16. Não só explicam e deixam a gente se virar
		{
			tipo: 'frase',
			de: b.say('E eles não simplesmente').inicio,
			ate: b.at('praticamente') + 0.04,
			palavras: [
				{texto: 'EXPLICAR', em: b.at('explicam')},
				{texto: 'E DEIXAR SE VIRAR?', em: b.say('deixam a gente').inicio},
				{texto: 'NÃO', em: b.tempos('se virar, não.')[2], destaque: true},
			],
			som: 'pro_frase',
		},
		// 17. Pegam na nossa mão, passo a passo: os dois pontos de mãos dadas subindo a escada (peça nova)
		{
			tipo: 'peca',
			nome: 'd41Passos',
			modo: 'cheia',
			de: b.at('praticamente') + 0.06,
			ate: sai(b.say('passo a passo,').fim, b.say('oferecendo atendimento').inicio, 0.15),
			dados: {
				emMao: b.say('pegam na nossa mão.').inicio,
				emPassoTexto: b.at('Ensina'),
				passos: [b.tempos('passo a passo,')[0], b.tempos('passo a passo,')[2], b.say('passo a passo,').fim],
			},
			esconderLegenda: true,
			som: 'pro_whoosh',
			sons: [
				{em: b.say('pegam na nossa mão.').inicio, som: 'pro_pop', ganho: 0.6},
				{em: b.tempos('passo a passo,')[0], som: 'pro_tick'},
				{em: b.tempos('passo a passo,')[2], som: 'pro_tick'},
			],
		},
		// 18. Atendimento individual
		{
			tipo: 'selo',
			de: b.say('oferecendo atendimento').inicio,
			ate: sai(b.say('atendimento individual.').fim, b.say('Tiram nossas').inicio, 0.25),
			texto: 'ATENDIMENTO INDIVIDUAL',
			chip: '1 : 1',
			emChip: b.at('individual.'),
			y: 360,
			esconderLegenda: true,
			som: 'swish',
		},
		// 19. Tiram dúvidas e sugerem produtos: mensagens dos mentores chegando
		{
			tipo: 'notificacoes',
			de: b.say('Tiram nossas').inicio,
			ate: sai(b.say('nas nossas lives.').fim, b.say('E isso faz').inicio, 0.2),
			icone: 'mensagem',
			itens: [
				{titulo: 'Danilow', texto: 'Manda sua dúvida!', em: b.say('Tiram nossas').inicio + 0.05},
				{titulo: 'Matheus', texto: 'Testa esse produto na live', em: b.say('sugerem produtos').inicio},
				{titulo: 'Felipe', texto: 'Bora testar hoje?', em: b.say('nas nossas lives.').inicio},
			],
			esconderLegenda: true,
			somItem: 'pro_msg',
			ganhoItem: 0.6,
		},
		// 20. Toda a diferença
		{
			tipo: 'selo',
			de: b.say('E isso faz').inicio,
			ate: sai(b.say('toda a diferença,').fim, b.say('porque não é só').inicio, 0.25),
			texto: 'TODA A DIFERENÇA',
			y: 360,
			esconderLegenda: true,
			som: 'swish',
		},
		// 21. Orientação e confiança
		{
			tipo: 'chips',
			de: b.say('receber a orientação,').inicio,
			ate: sai(b.say('ganhar confiança,').fim, b.say('sentir que nós').inicio, 0.15),
			itens: [
				{texto: 'ORIENTAÇÃO', em: b.at('orientação,')},
				{texto: 'CONFIANÇA', em: b.at('confiança,')},
			],
			y: 1300,
			esconderLegenda: true,
			som: 'tick',
			sons: [{em: b.at('confiança,'), som: 'pro_tick'}],
		},
		// 22. Não estamos sozinhas: a turma acende em volta dela, ligada em rede (peça nova)
		{
			tipo: 'peca',
			nome: 'd41Juntas',
			modo: 'cheia',
			de: b.say('sentir que nós').inicio,
			ate: sai(b.say('estamos sozinhas.').fim, b.say('Eu sei que eu').inicio, 0.35),
			dados: {emNos: b.at('nós'), emNao: b.say('não estamos sozinhas.').inicio, emSozinhas: b.at('sozinhas.')},
			esconderLegenda: true,
			som: 'pro_whoosh',
			sons: [{em: b.at('sozinhas.'), som: 'pro_pouso', ganho: 0.7}],
		},
		// 23. Enxergar possibilidades: a tela embaçada abre como uma lente e caminhos dourados se abrem (peça nova)
		{
			tipo: 'peca',
			nome: 'd41Enxergar',
			de: b.say('consigo enxergar').inicio,
			ate: sai(b.say('não enxergava.').fim, b.say('E é por isso').inicio, 0.3),
			dados: {emEnxergar: b.at('enxergar', 2), emPossib: b.at('possibilidades')},
			esconderLegenda: true,
			som: 'pro_whoosh_curto',
			sons: [{em: b.at('possibilidades'), som: 'pro_pop', ganho: 0.6}],
		},
		// 24. Agradecimento muito especial
		{
			tipo: 'selo',
			de: b.say('um agradecimento').inicio,
			ate: sai(b.say('muito especial').fim, b.say('ao Danilow, Matheus').inicio),
			texto: 'AGRADECIMENTO',
			chip: 'MUITO ESPECIAL',
			emChip: b.say('muito especial').inicio,
			y: 360,
			esconderLegenda: true,
			som: 'swish',
		},
		// 25. Os três nomes em cartas 3D
		{
			tipo: 'cards3d',
			de: b.say('ao Danilow, Matheus').inicio,
			ate: b.at('obrigada'),
			itens: [
				{texto: 'DANILOW', em: b.at('Danilow', 3)},
				{texto: 'MATHEUS', em: b.at('Matheus', 2)},
				{texto: 'FELIPE', em: b.at('Felipe', 2)},
			],
			y: 1180,
			som: 'swish',
			sons: [
				{em: b.at('Matheus', 2), som: 'pro_tick'},
				{em: b.at('Felipe', 2), som: 'pro_tick'},
			],
		},
		// 26. Obrigada pela paciência, dedicação e conhecimento
		{
			tipo: 'checklist',
			de: b.say('pela paciência,').inicio,
			ate: sai(b.say('com a gente.').fim, b.say('É muito bom').inicio, 0.25),
			titulo: 'Obrigada',
			itens: [
				{texto: 'PACIÊNCIA', em: b.at('paciência', 2)},
				{texto: 'DEDICAÇÃO', em: b.at('dedicação')},
				{texto: 'CONHECIMENTO', em: b.at('conhecimento')},
			],
			esconderLegenda: true,
			som: 'tick',
			sons: [
				{em: b.at('dedicação'), som: 'pro_tick'},
				{em: b.at('conhecimento'), som: 'pro_tick'},
			],
		},
		// 27. Aprendizado e evolução
		{
			tipo: 'textoLife',
			de: b.say('com o nosso aprendizado').inicio,
			ate: sai(b.say('nossa evolução.').fim, b.say('Ainda tem uma').inicio, 0.25),
			kicker: 'COM O NOSSO',
			principal: 'aprendizado e evolução',
			palavras: [b.at('aprendizado'), b.say('e com a nossa').inicio, b.at('evolução.')],
			y: 300,
			brilho: true,
			esconderLegenda: true,
			som: 'pro_whoosh_curto',
		},
		// 28. Caminhada imensa pela frente: estrada em perspectiva até o horizonte (peça nova)
		{
			tipo: 'peca',
			nome: 'd41Estrada',
			modo: 'cheia',
			de: b.say('Ainda tem uma').inicio,
			ate: sai(b.say('pela frente,').fim, b.say('mas hoje, com').inicio, 0.2),
			dados: {emCaminhada: b.at('caminhada'), emImensa: b.at('imensa'), emFrente: b.say('pela frente,').inicio},
			esconderLegenda: true,
			som: 'pro_whoosh',
			sons: [{em: b.at('imensa'), som: 'pro_pouso', ganho: 0.6}],
		},
		// 29. Mais confiante, mais motivada: dois medidores enchendo (peça nova)
		{
			tipo: 'peca',
			nome: 'd41Medidor',
			de: b.say('muito mais confiante,').inicio,
			ate: sai(b.say('para continuar.').fim, b.say('Muito obrigada mesmo de').inicio, 0.25),
			dados: {emConfiante: b.at('confiante,'), emMotivada: b.at('motivada'), emContinuar: b.at('continuar.')},
			esconderLegenda: true,
			som: 'pro_whoosh_curto',
			sons: [
				{em: b.at('confiante,'), som: 'pro_tick'},
				{em: b.at('motivada'), som: 'pro_tick'},
			],
		},
		// 30. Obrigada de coração
		{
			tipo: 'frase',
			de: b.say('Muito obrigada mesmo de').inicio,
			ate: fimFala + 0.05,
			palavras: [
				{texto: 'OBRIGADA', em: b.say('obrigada mesmo de').inicio},
				{texto: 'DE CORAÇÃO', em: b.at('coração'), destaque: true},
			],
			som: 'pro_frase',
		},
		// 31. Cartão final
		{tipo: 'final', de: fimFala + 0.1, ate: fimFala + 2.4, marca: 'Danilow', sub: 'LUCRANDO COM LIVES', som: 'pro_logo'},
	];
};
