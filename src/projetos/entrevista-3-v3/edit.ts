import type {EfeitoCamera, Edit} from '../../motor/plano';
import type {Busca, Trecho} from '../../motor/palavras';
import {alinhar} from './alinhar';
import pausas from './pausas.json';
import transcricaoWhisper from './transcricao.json';

// Entrevista 3, vídeo 3 (tema Entrevista): Danilow entrevista a Ludi, ex-atleta de karatê que faz R$ 100 mil com live.
// Fonte 3.MOV (4K HDR do iPhone) convertida para 1440x2560 SDR 30 qps (scripts/converter-entrevista-3.sh).
// Roteiro: gancho R$ 100 MIL (conta e trava, celular da live, moedas) → apresentação (5º no Mundial) → pergunta inteira
// (MVM, Floripa, 200 pessoas, rota Florianópolis → Goiânia) → resposta inteira (modo caverna em tela cheia, visão ampla,
// carro-chefe, novos braços) → "não é fácil, mas é simples" → CTA inteiro (dúvida, siga Danilow/Ludi/MVM, direct, bora).
// Revisão de 30/10: sem limite de tempo; os cortes só tiram as pausas reais (pausas.json: abaixo de -36 dB por ≥ 0,22 s,
// medidas no áudio) e as bordas são as medidas na energia da voz (o Whisper adianta ~0,25 s e espalha palavras nas pausas;
// alinhar.ts realinha as palavras com as pausas para a legenda e as âncoras acompanharem a voz).
const P = {x: 0.5, y: 0.38};
const transcricao = alinhar(transcricaoWhisper, pausas as [number, number][]);

// Trechos no tempo original, na ordem do vídeo (bordas medidas na energia da voz, 30/10).
const TRECHOS: Trecho[] = [
	[4.1, 9.04], // gancho: "Hoje ela coloca mais de 100 mil reais ... fazendo live no TikTok Shop."
	[0.04, 4.02], // apresentação: "Estou aqui com a Ludi ... quinto no Mundial."
	[9.52, 20.82], // pergunta: "Ludi, como é essa experiência ... de Floripa para a Goiânia?"
	[24.2, 57.18], // resposta: "O que eu acho que eu levo ... que é o que a gente está buscando."
	[58.72, 73.76], // síntese + CTA: "Não é fácil, mas é simples ... Bora para cima! Bora!"
];

// Ritmo frenético (evento a cada 0,3–0,6 s): punch-in nas palavras, ciclo médio → close → aberto, até 1,3.
const ESCALAS = [1.1, 1.2, 1.28, 1.14, 1.24, 1.06];
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

export const entrevista3V3: Edit = {
	pasta: 'projetos/entrevista-3-v3',
	video: 'video.mp4',
	formato: 'vertical',
	verificarCurva: false,
	regraCamera: false,
	extraFim: 2.4,
	silencios: pausas as Trecho[],
	transcricao,
	trechos: () => {
		// Tira as pausas reais de dentro dos trechos, com 0,05 s de ar de cada lado.
		const cortado: Trecho[] = [];
		for (const [a, z] of TRECHOS) {
			let ini = a;
			for (const [s0, s1] of pausas as Trecho[]) {
				if (s0 <= ini + 0.1 || s1 >= z - 0.1 || s1 - s0 < 0.22) continue;
				cortado.push([ini, s0 + 0.05]);
				ini = s1 - 0.05;
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
			{palavra: 'mentalidade', estilo: 'serif'},
			{palavra: 'possibilidades', estilo: 'serif'},
			{palavra: 'consegue', estilo: 'serif'},
		],
		falantes: (b) => [
			{de: b.say('Ludi, como é essa').inicio - 0.1, ate: b.say('de Floripa para a Goiânia').fim + 0.1, nome: 'PERGUNTA'},
			{de: b.say('de Floripa para a Goiânia').fim + 0.1, ate: b.say('que é o que a gente está buscando').fim + 0.1, nome: 'LUDI'},
		],
	},
	camera: (b) => {
		const z = (em: number, escala: number): EfeitoCamera => ({tipo: 'zoom', em, escala, ...P});
		return [
			// Gancho: o clarão está na própria peça (trava do número)
			z(0, 1.12),
			z(b.at('reais'), 1.26),
			z(b.at('casa'), 1.1),
			z(b.at('celular'), 1.18),
			z(b.at('live'), 1.24),
			{tipo: 'chicote', em: b.at('Estou')},
			...punches(b, 'Estou aqui com a Ludi, ex-atleta de Karate, chegou a ficar em quinto no Mundial'),
			{tipo: 'chicote', em: b.say('Ludi, como é essa').inicio},
			z(b.say('Ludi, como é essa').inicio, 1),
			...punches(b, 'como é essa experiência de estar aqui com o MVM, de estar aqui em Floripa, de estar aqui com 200 pessoas que vivem do digital', 0.7),
			z(b.at('bagagem'), 1.06),
			{tipo: 'chicote', em: b.say('O que eu acho').inicio},
			...punches(b, 'O que eu acho que eu levo de mais importante é eu sempre fico lá', 0.55),
			{tipo: 'foco', em: b.at('poder')},
			...punches(b, 'olhar para a minha operação hoje, para a nossa operação, minha e da Karol, de uma maneira ampla', 0.55),
			...punches(b, 'A gente saiu daqui com várias possibilidades, não só de live shop, claro que esse ainda é o nosso carro-chefe', 0.55),
			...punches(b, 'a gente trabalha muito com isso, mas a gente tem uma mentalidade para crescer o nosso negócio, para outras áreas', 0.55),
			...punches(b, 'trazer novos braços e ir atrás de novas mentorias, né, que é o que a gente está buscando', 0.55),
			{tipo: 'chicote', em: b.say('Não é fácil').inicio},
			z(b.say('Não é fácil').inicio, 1),
			{tipo: 'flash', em: b.at('simples') - 0.04},
			z(b.at('simples'), 1.25),
			z(b.at('conseguiu'), 1.1),
			z(b.at('consegue'), 1.26),
			z(b.say('Tem alguma dúvida').inicio, 1),
			z(b.at('comentários'), 1.15),
			z(b.at('Danilow'), 1.08),
			z(b.say('siga a Ludi').inicio, 1.18),
			z(b.at('MVM', 2), 1.26),
			z(b.at('dúvida', 2), 1.1),
			z(b.at('direct'), 1.2),
			z(b.at('Bora'), 1.28),
		];
	},
	cenas: (b) => {
		const fimFala = b.say('Bora para cima! Bora').fim;
		const liveCasa = b.at('live', 2);
		const fimCaverna = liveCasa + 1.05;
		return [
			// 1. Gancho próprio: R$ 100 MIL conta e trava com clarão, celular da live sobe, moedas caem
			{
				tipo: 'peca',
				nome: 'v3Gancho',
				de: 0,
				ate: b.say('fazendo live no TikTok Shop').fim + 0.05,
				dados: {trava: b.at('reais'), casa: b.at('casa'), celular: b.at('celular'), live: b.at('live')},
				esconderLegenda: true,
				som: 'pro_whoosh_curto',
				sons: [
					{em: b.at('reais'), som: 'pro_pop', ganho: 0.9},
					{em: b.at('celular'), som: 'pro_swipe', ganho: 0.6},
					{em: b.at('live') + 0.05, som: 'pro_msg', ganho: 0.6},
				],
			},
			// 2. Apresentação: ex-atleta, chip; 5º no Mundial em prata 3D
			{
				tipo: 'chips',
				de: b.at('ex-atleta') - 0.05,
				ate: b.at('quinto') - 0.1,
				itens: [{texto: 'EX-ATLETA DE KARATÊ', em: b.at('ex-atleta')}],
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
			},
			{
				tipo: 'numero3d',
				de: b.at('quinto') - 0.1,
				ate: b.say('quinto no Mundial').fim + 0.35,
				texto: '5º LUGAR',
				rotulo: 'NO MUNDIAL',
				metal: 'branco',
				em: b.at('quinto'),
				esconderLegenda: true,
				som: 'pro_pop',
			},
			// 3. Pergunta: evento da MVM em Floripa com 200 pessoas do digital
			{
				tipo: 'chips',
				de: b.at('Floripa') - 0.05,
				ate: b.at('vivem') + 0.7,
				itens: [
					{texto: 'MVM · FLORIPA', em: b.at('Floripa')},
					{texto: '200 PESSOAS DO DIGITAL', em: b.at('200')},
				],
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
				sons: [{em: b.at('200'), som: 'pro_tick', ganho: 0.7}],
			},
			// 4. A bagagem: rota 3D Florianópolis → Goiânia acima da cabeça
			{
				tipo: 'peca',
				nome: 'v3Rota',
				de: b.at('bagagem') - 0.25,
				ate: b.say('de Floripa para a Goiânia').fim + 0.85,
				dados: {voa: b.at('bagagem'), chega: b.say('de Floripa para a Goiânia').fim},
				som: 'pro_aviao',
			},
			// 5. Sair do modo caverna: tela inteira com a caverna, a casa e a live; a caverna abre e entra a luz
			{
				tipo: 'peca',
				nome: 'v3Caverna',
				modo: 'cheia',
				de: b.at('sair') - 0.12,
				ate: fimCaverna,
				dados: {sair: b.at('sair'), caverna: b.at('caverna'), casa: b.at('casa', 2), live: liveCasa, abre: fimCaverna - 0.68},
				esconderLegenda: true,
				som: 'pro_whoosh',
				sons: [{em: fimCaverna - 0.66, som: 'pro_quebra', ganho: 0.55}],
			},
			// 6. Olhar a operação de forma ampla
			{
				tipo: 'chips',
				de: b.at('operação') - 0.05,
				ate: b.at('ampla') + 0.75,
				itens: [
					{texto: 'A OPERAÇÃO', em: b.at('operação')},
					{texto: 'VISÃO AMPLA', em: b.at('ampla')},
				],
				y: 1080,
				esconderLegenda: true,
				som: 'pro_tick',
				sons: [{em: b.at('ampla'), som: 'pro_tick', ganho: 0.8}],
			},
			// 7. Live continua o carro-chefe
			{
				tipo: 'selo',
				de: b.at('carro-chefe') - 0.1,
				ate: b.say('trabalha muito com isso').fim + 0.2,
				texto: 'CARRO-CHEFE',
				chip: 'LIVE',
				emChip: b.at('carro-chefe'),
				y: 330,
				esconderLegenda: true,
				som: 'pro_swipe',
			},
			// 8. Crescer para outras áreas: cartas 3D em leque
			{
				tipo: 'cards3d',
				de: b.at('outras') - 0.1,
				ate: b.say('que é o que a gente está buscando').fim + 0.1,
				itens: [
					{texto: 'OUTRAS ÁREAS', em: b.at('outras')},
					{texto: 'NOVOS BRAÇOS', em: b.at('braços')},
					{texto: 'MENTORIAS', em: b.at('mentorias')},
				],
				y: 1010,
				som: 'pro_pouso',
				sons: [
					{em: b.at('braços'), som: 'pro_pouso', ganho: 0.8},
					{em: b.at('mentorias'), som: 'pro_pouso', ganho: 0.8},
				],
			},
			// 9. Síntese
			{
				tipo: 'frase',
				de: b.say('Não é fácil').inicio - 0.05,
				ate: b.say('Se ela conseguiu').inicio - 0.05,
				palavras: [
					{texto: 'NÃO É FÁCIL', em: b.say('Não é fácil').inicio},
					{texto: 'É SIMPLES', em: b.at('simples'), destaque: true},
				],
				som: 'pro_frase',
			},
			// 10. CTA: caixa de comentário, siga os três, direct
			{
				tipo: 'comentario',
				de: b.say('Tem alguma dúvida').inicio - 0.05,
				ate: b.at('Já') - 0.05,
				texto: 'Tenho uma dúvida...',
				y: 1060,
				som: 'pro_digita',
			},
			{
				tipo: 'siga',
				de: b.at('Já') - 0.05,
				ate: b.at('MVM', 2) + 0.7,
				itens: [
					{texto: 'DANILOW', em: b.at('Danilow')},
					{texto: 'LUDI', em: b.say('siga a Ludi').inicio + 0.2},
					{texto: 'MVM', em: b.at('MVM', 2)},
				],
				y: 1040,
				esconderLegenda: true,
				som: 'pro_swipe',
				sons: [{em: b.at('MVM', 2), som: 'pro_swipe', ganho: 0.7}],
			},
			{
				tipo: 'notificacoes',
				de: b.at('MVM', 2) + 0.7,
				ate: b.at('Bora') - 0.02,
				itens: [{titulo: 'Direct', texto: 'Manda sua dúvida pro Danilow', em: b.at('direct')}],
				icone: 'mensagem',
				y: 1040,
				esconderLegenda: true,
				som: 'pro_msg',
			},
			// 11. Cartão final
			{tipo: 'final', de: fimFala + 0.1, ate: fimFala + 2.4, marca: 'MVM', linha2: 'CREATORS', sub: 'LIVE NO TIKTOK SHOP', tres: true, som: 'pro_logo'},
		];
	},
};
