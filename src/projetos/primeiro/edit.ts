import type {Edit} from '../../motor/plano';
import type {Trecho} from '../../motor/palavras';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// Depoimento da Paola (entrevista, tema Entrevista). Refeito em 28/10/2026 depois de o usuário reprovar a primeira versão
// (efeitos ruins, 3D e motion fracos, roteiro sem sentido, fora de tempo, legenda mal feita).
// Roteiro (falas reordenadas): gancho com o resultado → apresentação → dor (primeira live chorando, só a irmã, nunca mais)
// → pergunta → virada (menos de 1 mês, 20 mil na primeira live) → lição (tentar, tentar, tentar / é outra coisa) →
// crédito (Danilow e o time) → CTA → cartão final. Visual do modelo aprovado: roxo + ouro + vidro, legenda maré no centro.
// Rosto da Paola em x .72 y .33; o entrevistador fica à esquerda (x .3) e fala nas partes "PERGUNTA".
const P = {x: 0.72, y: 0.33};
const ABERTO = {x: 0.5, y: 0.33};
// Câmera alta: o rosto desce para abrir espaço para o número no topo.
const BAIXO = {x: 0.72, y: 0.12};

// Fontes (grupo "usar todos"): IMG_5212 (1).MOV (0–73,1 s: gancho, apresentação, dor, pergunta, resposta, CTA) e
// IMG_5213 (1).MOV (73,1–106,8 s: crédito ao Danilow e CTA final). Juntos formam video.mp4 (npm run preparar-video).
export const FONTES = ['IMG_5212 (1).MOV', 'IMG_5213 (1).MOV'] as const;

export const primeiro: Edit = {
	pasta: 'projetos/primeiro',
	video: 'video.mp4',
	formato: 'vertical',
	verificarCurva: false,
	regraCamera: false,
	extraFim: 2.4,
	silencios: silencios as Trecho[],
	transcricao,
	trechos: (o) => {
		// [início, fim] no tempo original, com folga; as bordas se encaixam nas pausas medidas (silencios.json).
		const fala = (de: string, ate: string, folga = 0.07): Trecho => [o.say(de).inicio - 0.06, o.say(ate).fim + folga];
		const lista: Trecho[] = [
			fala('eu fiz 20 mil em GMV', 'eu fiz 20 mil em GMV'),
			fala('Tô aqui com a Paola', 'há quanto tempo que você faz live shop'),
			fala('Faz mais de um ano', 'comecei a fazer'),
			fala('primeira vez que eu fiz live shop', 'tinha sido a minha irmã'),
			fala('E eu tinha muito na minha cabeça', 'entrar muita gente'),
			fala('E que eu tinha que perder', 'poder vender'),
			fala('Então isso me frustrava', 'nunca mais tentei abrir uma live'),
			[o.say('E depois que você entrou').inicio - 0.06, o.at('método') + 1.0],
			fala('como é foi a sua evolução', 'como é foi a sua evolução'),
			fala('Faz menos de um mês que eu entrei', 'Faz menos de um mês que eu entrei'),
			fala('aí na primeira live que eu fiz', 'ajuda do meu namorado', 0.02),
			fala('é muito frustrante', 'você consegue vender'),
			fala('E se não fosse o Danilow', 'não seria possível'),
			fala('segue o Danilow ele é o cara', 'segue o Danilow ele é o cara'),
			fala('Se você tá travado', 'vamos pra cima'),
		];
		// Trechos vizinhos que se sobrepõem no original repetem quadros e palavras: divide a sobreposição ao meio.
		for (let i = 1; i < lista.length; i++) {
			if (lista[i][0] < lista[i - 1][1] && lista[i][0] > lista[i - 1][0]) {
				const meio = (lista[i][0] + lista[i - 1][1]) / 2;
				lista[i - 1] = [lista[i - 1][0], meio];
				lista[i] = [meio, lista[i][1]];
			}
		}
		// Cortes entre as pausas: tira os respiros entre palavras (vão > 0,12 s) sem remover fala; sobra ~0,07 s de ar.
		// Bordas externas do trecho ficam; sub-trecho com menos de 0,25 s é juntado ao vizinho.
		const cortado: Trecho[] = [];
		for (const [a, z] of lista) {
			const ps = o.palavras.filter((p) => p.inicio >= a && p.fim <= z);
			let ini = a;
			for (let i = 0; i < ps.length - 1; i++) {
				if (ps[i + 1].inicio - ps[i].fim <= 0.09) continue;
				const fimSub = ps[i].fim + 0.04;
				const proxIni = ps[i + 1].inicio - 0.03;
				if (fimSub - ini < 0.25 || z - proxIni < 0.25) continue;
				cortado.push([ini, fimSub]);
				ini = proxIni;
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
			{palavra: 'chorando', estilo: 'serif'},
			{palavra: 'irmã', estilo: 'serif'},
			{palavra: 'frustrava', estilo: 'serif'},
			{palavra: 'evolução', estilo: 'serif'},
			{palavra: 'frustrante', estilo: 'serif'},
			{palavra: 'erro', estilo: 'riscar'},
			{palavra: 'vender', estilo: 'serif'},
			{palavra: 'Danilow', estilo: 'serif'},
			{palavra: 'chance', estilo: 'serif'},
		],
		falantes: (b) => [
			{de: b.say('Tô aqui com a Paola').inicio - 0.2, ate: b.say('você faz live shop').fim + 0.2, nome: 'DANILOW'},
			{de: b.say('você faz live shop').fim + 0.2, ate: b.say('E depois que você entrou').inicio - 0.1, nome: 'PAOLA'},
			{de: b.say('E depois que você entrou').inicio - 0.1, ate: b.say('a sua evolução').fim + 0.2, nome: 'PERGUNTA'},
			{de: b.say('a sua evolução').fim + 0.2, ate: b.say('Se você tá travado').inicio - 0.1, nome: 'PAOLA'},
			{de: b.say('Se você tá travado').inicio - 0.1, ate: 999, nome: 'DANILOW'},
		],
	},
	camera: (b) => {
		const tentar = b.tempos('tentar tentar tentar');
		const pergunta = b.say('E depois que você entrou').inicio;
		const resposta = b.say('Faz menos de um mês').inicio;
		const cta = b.say('Se você tá travado').inicio;
		const apresenta = b.say('Tô aqui com a Paola').inicio;
		// Troca de falante: chicote. Nas emendas do mesmo falante, o zoom muda de nível (aberto ↔ médio ↔ close) para o
		// corte virar ritmo em vez de pulo. Zoom máximo 1,35: o vídeo é 1080 e mais que isso borra.
		const trocas = [apresenta, b.say('Faz mais de um ano').inicio, pergunta, resposta, cta];
		const niveis = [1.12, 1.26, 1.35];
		const emendas = b.emendas
			.filter((e) => trocas.every((t) => Math.abs(t - e) > 0.25))
				.filter((e, i, l) => i === 0 || e - l.slice(0, i).filter((x) => e - x >= 0).pop()! >= 1.6)
			.map((e, i) => ({tipo: 'zoom' as const, em: e, escala: niveis[i % niveis.length], ...P}));
		return [
			// Gancho: abre já em close, câmera alta para o número 3D, clarão na batida
			{tipo: 'zoom', em: 0, escala: 1.22, ...BAIXO},
			{tipo: 'flash', em: b.at('20') - 0.04},
			// Apresentação: plano aberto com os dois
			{tipo: 'chicote', em: apresenta},
			{tipo: 'zoom', em: apresenta, escala: 1, ...ABERTO},
			{tipo: 'zoom', em: b.at('TikTok') - 0.1, escala: 1.2, x: 0.3, y: -0.04},
			{tipo: 'zoom', em: b.at('responde'), escala: 1.08, ...ABERTO},
			// Dor
			{tipo: 'chicote', em: trocas[1]},
			{tipo: 'zoom', em: trocas[1], escala: 1.18, ...P},
			{tipo: 'zoom', em: b.at('chorando'), escala: 1.35, ...P},
			{tipo: 'zoom', em: b.at('única') - 0.1, escala: 1.32, suave: 1.3, ...P},
			{tipo: 'zoom', em: b.at('irmã'), escala: 1.3, ...P},
			{tipo: 'zoom', em: b.at('frustrava'), escala: 1.15, ...P},
			// Pergunta: aberto
			{tipo: 'chicote', em: pergunta},
			{tipo: 'zoom', em: pergunta, escala: 1, ...ABERTO},
			{tipo: 'zoom', em: b.at('método'), escala: 1.08, ...ABERTO},
			{tipo: 'zoom', em: b.at('evolução'), escala: 1.18, x: 0.32, y: 0.3},
			// Virada e resultado
			{tipo: 'chicote', em: resposta},
			{tipo: 'zoom', em: resposta, escala: 1.25, ...P},
			{tipo: 'zoom', em: b.at('mês'), escala: 1.35, ...P},
			{tipo: 'zoom', em: b.say('primeira live').inicio, escala: 1.12, ...P},
			{tipo: 'zoom', em: b.at('consegui'), escala: 1.22, ...P},
			{tipo: 'zoom', em: b.say('aprender o método').fim, escala: 1.32, ...P},
			{tipo: 'zoom', em: b.at('20', 2), escala: 1.2, ...BAIXO},
			{tipo: 'zoom', em: b.at('namorado'), escala: 1.25, ...P},
			// Lição: um punch por "tentar", clarão na virada
			...emendas,
			{tipo: 'zoom', em: tentar[0], escala: 1.12, ...P},
			{tipo: 'zoom', em: tentar[1], escala: 1.24, ...P},
			{tipo: 'zoom', em: tentar[2], escala: 1.35, ...P},
			{tipo: 'zoom', em: b.at('erro'), escala: 1.15, ...P},
			{tipo: 'flash', em: b.say('Mas quando você entra').inicio},
			{tipo: 'zoom', em: b.say('Mas quando você entra').inicio, escala: 1.1, ...P},
			{tipo: 'zoom', em: b.at('outra'), escala: 1.28, ...P},
			{tipo: 'zoom', em: b.at('vender'), escala: 1.35, ...P},
			// Crédito
			{tipo: 'zoom', em: b.at('Danilow'), escala: 1.2, ...P},
			{tipo: 'zoom', em: b.at('Felipe'), escala: 1.3, ...P},
			{tipo: 'zoom', em: b.at('Danilow', 2), escala: 1.15, ...P},
			// CTA em plano aberto
			{tipo: 'chicote', em: cta},
			{tipo: 'zoom', em: cta, escala: 1, ...ABERTO},
			{tipo: 'zoom', em: b.at('chance'), escala: 1.12, ...ABERTO},
		];
	},
	cenas: (b) => {
		const fimFala = b.say('vamos pra cima').fim;
		const vinte2 = b.at('20', 2);
		return [
			// 1. Gancho: R$ 20 MIL em ouro 3D acima da cabeça, com GMV em cima
			{
				tipo: 'numero3d',
				de: 0,
				ate: b.say('eu fiz 20 mil em GMV').fim + 0.15,
				texto: 'R$ 20 MIL',
				rotulo: 'GMV',
				abaixo: 'NA PRIMEIRA LIVE',
				// Bate já no primeiro quadro: o gancho tem 1,7 s e as letras precisam assentar antes do "GMV".
				em: 0,
				som: 'pop',
			},
			// 2. Nome na tela
			// 1 ANO em ouro 3D com o nome dela na mesma cor
			{tipo: 'numero3d', de: b.at('TikTok') - 0.15, ate: b.say('há mais de um ano').fim + 0.3, texto: '1 ANO', rotulo: 'TIKTOK SHOP', y: 330, em: b.at('Há') - 0.05, esconderLegenda: true, som: 'pop'},
			// 3. A live vazia: 1 espectador, só a irmã comentando
			{
				tipo: 'live',
				de: b.at('única') - 0.05,
				ate: b.at('única') + 2.1,
				drama: true,
				olho3d: b.at('única'),
				host: 'Paola',
				curtidas: '3 curtidas',
				espectadores: '1',
				comentarios: [{nome: 'Irmã', texto: 'tô aqui 💜'}],
				coracoes: false,
				som: 'whoosh',
			},
			// 4. NUNCA MAIS
			{
				tipo: 'frase',
				dor: true,
				de: b.at('nunca') - 0.08,
				ate: b.say('tentei abrir uma live').fim + 0.15,
				palavras: [
					{texto: 'NUNCA', em: b.at('nunca')},
					{texto: 'MAIS', em: b.at('mais'), destaque: true},
					{texto: 'TENTEI', em: b.at('tentei')},
					{texto: 'ABRIR', em: b.at('abrir')},
					{texto: 'UMA', em: b.at('uma', 2)},
					{texto: 'LIVE', em: b.at('live', 4), destaque: true},
				],
				som: 'pop',
			},
			// 5. Menos de 1 mês
			{
				tipo: 'selo',
				de: b.say('Faz menos').inicio - 0.02,
				ate: b.say('aí na primeira live').inicio - 0.1,
				texto: 'MENOS DE 1 MÊS',
				esconderLegenda: true,
				som: 'tick',
			},
			// 6. A primeira live com o método: a live cheia
			{
				tipo: 'live',
				de: b.say('aí na primeira live').inicio - 0.05,
				ate: b.say('primeira live').inicio + 1.4,
				host: 'Paola',
				curtidas: '12,6 mil curtidas',
				espectadores: '1,4 mil',
				comentarios: [
					{nome: 'Carla', texto: 'quero 2!'},
					{nome: 'Bruno', texto: 'comprei 🔥'},
					{nome: 'Ju', texto: 'que live boa'},
				],
				som: 'whoosh',
			},
			// 7. Resultado: R$ 20 MIL de novo, agora com a virada
			{
				tipo: 'numero3d',
				de: vinte2 - 0.3,
				ate: b.at('namorado') + 0.3,
				texto: 'R$ 20 MIL',
				rotulo: 'GMV',
				abaixo: 'COM O MÉTODO',
				em: vinte2 - 0.3,
				som: 'pop',
			},
			// 8. Tentar, tentar, tentar: um chip por vez no mesmo lugar, numerado
			{
				tipo: 'chips',
				de: b.tempos('tentar tentar tentar')[0] - 0.05,
				ate: b.at('erro') - 0.1,
				itens: b.tempos('tentar tentar tentar').map((t) => ({texto: 'TENTAR', em: t})),
				numerado: true,
				y: 1020,
				esconderLegenda: true,
			},
			// 9. A virada da lição
			{
				tipo: 'frase',
				de: b.at('outra') - 0.08,
				ate: b.at('coisa') + 0.75,
				palavras: [
					{texto: 'É', em: b.at('outra') - 0.12},
					{texto: 'OUTRA', em: b.at('outra')},
					{texto: 'COISA', em: b.at('coisa'), destaque: true},
				],
				som: 'whoosh',
			},
			// 10. O time: um nome por vez
			{
				tipo: 'chips',
				de: b.say('o Danilow').inicio - 0.05,
				ate: b.say('não seria possível').fim + 0.1,
				itens: [
					{texto: 'DANILOW', em: b.at('Danilow')},
					{texto: 'FELIPE', em: b.at('Felipe')},
					{texto: 'MATHEUS', em: b.at('Matheus')},
				],
				y: 1020,
				esconderLegenda: true,
				som: 'tick',
			},
			// 11. Siga
			{tipo: 'siga', de: b.at('segue'), ate: b.say('ele é o cara').fim + 0.15, itens: [{texto: 'DANILOW', em: b.at('segue')}], y: 1040, esconderLegenda: true, som: 'swish'},
			// 12. CTA
			{
				tipo: 'frase',
				de: b.at('essa') - 0.08,
				ate: b.at('chance') + 0.7,
				palavras: [
					{texto: 'ESSA É A SUA', em: b.at('essa')},
					{texto: 'CHANCE', em: b.at('chance'), destaque: true},
				],
				som: 'whoosh',
			},
			{tipo: 'siga', de: b.say('já siga a Paola').inicio, ate: fimFala + 0.1, itens: [{texto: 'PAOLA', em: b.say('siga a Paola').inicio}], y: 1040, esconderLegenda: true, som: 'swish'},
			// 13. Cartão final
			{tipo: 'final', de: fimFala + 0.1, ate: fimFala + 2.6, marca: 'Danilow', sub: 'LIVE SHOP', som: 'whoosh'},
		];
	},
};
