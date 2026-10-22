import type {Caption} from '@remotion/captions';
import {elevenLabsTranscriptToCaptions} from '@remotion/elevenlabs';
import {CURVA_PADRAO, type Curva} from './curva';
import {
	criarBusca,
	palavrasEditadas,
	trechosMantidos,
	type Busca,
	type ErroAncora,
	type Palavra,
	type Trecho,
} from './palavras';

export type Som =
	| 'swish'
	| 'whoosh'
	| 'pop'
	| 'tick'
	| 'shimmer'
	| 'rise'
	| 'boom'
	| 'glitch'
	// "punch" nunca toca: antes de t2 vira swish, depois some.
	| 'punch';

export type Modo = 'cheia' | 'sobre';
export type Fundo = 'grade' | 'verde' | 'branco';
export type Posicao = 'esquerda' | 'direita' | 'topo' | 'baixo' | 'centro';

type Base = {
	de: number;
	ate: number;
	modo?: Modo;
	// Punch, tremor e clarão na entrada. Só vale antes de t2.
	impacto?: boolean;
	som?: Som | null;
	// Ele pediu efeito em voz alta: pode passar da faixa da curva.
	pedidoFalado?: boolean;
};

export type Cena =
	| (Base & {
			tipo: 'titulo';
			// Use *asteriscos* para a palavra em destaque.
			texto: string;
			sobretitulo?: string;
			// Tempo de entrada de cada palavra (de b.tempos("frase")).
			tempos?: number[];
			fundo?: Fundo;
			tamanho?: number;
			posicao?: Posicao;
	  })
	| (Base & {tipo: 'numero'; valor: string; legenda?: string; fundo?: Fundo; posicao?: Posicao})
	| (Base & {
			tipo: 'lista';
			titulo?: string;
			itens: {texto: string; em: number}[];
			fundo?: Fundo;
	  })
	| (Base & {tipo: 'passo'; rotulo: string; texto: string; posicao?: Posicao; fundo?: Fundo})
	| (Base & {tipo: 'estrela'; texto?: string; posicao?: Posicao; fundo?: Fundo})
	| (Base & {tipo: 'logo3d'; texto?: string; fundo?: Fundo})
	| (Base & {tipo: 'painel'; titulo: string; itens?: string[]; lado?: 'esquerda' | 'direita'})
	// Gravação de tela em tela cheia, com o Mateus no balão do canto.
	| (Base & {tipo: 'tela'; src: string; inicioNaFonte?: number})
	| (Base & {tipo: 'imagem'; src: string; legenda?: string; fundo?: Fundo})
	// Única coisa permitida na tela final: despedida pequena no canto.
	| (Base & {tipo: 'despedida'; texto: string});

export type TipoCena = Cena['tipo'];

export type Edit = {
	// Pasta em public/ com a mídia do projeto, ex. "projetos/meu-video".
	pasta: string;
	// Vídeo decupado dentro da pasta. Sem vídeo, a câmera vira um quadro de espera.
	video?: string;
	// Duração quando não há vídeo (exemplo, testes).
	duracao?: number;
	// JSON do ElevenLabs Scribe ou lista de legendas (whisper.cpp).
	transcricao: unknown;
	// Notas faladas e pedidos para a IA, no tempo do vídeo ORIGINAL.
	// Pode ser uma função: a busca aqui procura na fala original, antes dos cortes.
	cortes?: Trecho[] | ((original: Busca) => Trecho[]);
	musica?: {arquivo: string; volumeDb?: number};
	curva?: Curva;
	// Início da tela final: nada animado dali em diante, salvo a despedida.
	telaFinal?: (b: Busca) => number;
	cenas: (b: Busca) => Cena[];
};

export type CenaNoPlano = Cena & {
	modo: Modo;
	entra: 'corte' | 'anima';
	sai: 'corte' | 'anima';
	impactoAtivo: boolean;
	somFinal: Som | null;
};

export type Problema = {
	gravidade: 'erro' | 'aviso';
	tempo?: number;
	texto: string;
};

export type Montagem = {
	cortes: Trecho[];
	mantidos: Trecho[];
	duracaoEditada: number;
	palavras: Palavra[];
	cenas: CenaNoPlano[];
	problemas: Problema[];
	curva: Curva;
	telaFinal: number | null;
};

const MODO_PADRAO: Record<TipoCena, Modo> = {
	titulo: 'cheia',
	numero: 'cheia',
	lista: 'cheia',
	logo3d: 'cheia',
	imagem: 'cheia',
	tela: 'cheia',
	passo: 'sobre',
	estrela: 'sobre',
	painel: 'sobre',
	despedida: 'sobre',
};

const SOM_PADRAO: Record<TipoCena, Som | null> = {
	titulo: 'whoosh',
	numero: 'pop',
	lista: 'swish',
	logo3d: 'rise',
	imagem: 'swish',
	tela: 'swish',
	passo: 'pop',
	estrela: 'shimmer',
	painel: 'swish',
	despedida: null,
};

// Emenda abaixo disso; câmera crua só a partir de 3 s.
export const EMENDA_MAX = 0.6;
export const CAMERA_MIN = 3;

type PalavraScribe = {text: string; start: number; end: number; type: string};

export const paraLegendas = (transcricao: unknown): Caption[] => {
	if (Array.isArray(transcricao)) return transcricao as Caption[];
	// Scribe palavra por palavra: usa o início real da palavra. O conversor do
	// @remotion/elevenlabs puxa o início para o espaço anterior, o que adianta a entrada.
	const words = (transcricao as {words?: PalavraScribe[]}).words;
	if (Array.isArray(words)) {
		return words
			.filter((w) => w.type === 'word')
			.map((w) => ({
				text: w.text,
				startMs: w.start * 1000,
				endMs: w.end * 1000,
				timestampMs: ((w.start + w.end) / 2) * 1000,
				confidence: null,
			}));
	}
	return elevenLabsTranscriptToCaptions({transcript: transcricao}).captions;
};

const formatar = (t: number) => {
	const m = Math.floor(t / 60);
	const s = (t % 60).toFixed(2).padStart(5, '0');
	return `${m}:${s}`;
};

export const montar = (edit: Edit, duracaoFonte: number): Montagem => {
	const curva = edit.curva ?? CURVA_PADRAO;
	const legendas = paraLegendas(edit.transcricao);
	const problemas: Problema[] = [];
	let cortes: Trecho[] = [];
	if (typeof edit.cortes === 'function') {
		const original = criarBusca(palavrasEditadas(legendas, [[0, Infinity]]));
		cortes = edit.cortes(original);
		original.erros.forEach((e) =>
			problemas.push({gravidade: 'erro', texto: `corte ${e.busca}: ${e.motivo}`}),
		);
		cortes = cortes.filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b) && b > a);
	} else if (edit.cortes) {
		cortes = edit.cortes;
	}
	const mantidos = trechosMantidos(cortes, duracaoFonte);
	const duracaoEditada = mantidos.reduce((s, [a, b]) => s + (b - a), 0);
	const palavras = palavrasEditadas(legendas, mantidos);
	const busca = criarBusca(palavras);

	const brutas = edit.cenas(busca);
	const telaFinal = edit.telaFinal ? edit.telaFinal(busca) : null;
	const erroAncora = (e: ErroAncora) =>
		problemas.push({gravidade: 'erro', texto: `âncora ${e.busca}: ${e.motivo}`});
	busca.erros.forEach(erroAncora);

	const validas: CenaNoPlano[] = [];
	for (const c of brutas) {
		if (!Number.isFinite(c.de) || !Number.isFinite(c.ate)) {
			problemas.push({gravidade: 'erro', texto: `cena ${c.tipo} sem tempo válido, ficou de fora`});
			continue;
		}
		if (c.ate - c.de < 0.2) {
			problemas.push({gravidade: 'erro', tempo: c.de, texto: `cena ${c.tipo} com menos de 0,2 s`});
			continue;
		}
		if (telaFinal !== null && c.tipo !== 'despedida' && c.ate > telaFinal) {
			if (c.de >= telaFinal) {
				problemas.push({
					gravidade: 'erro',
					tempo: c.de,
					texto: `cena ${c.tipo} dentro da tela final, ficou de fora`,
				});
				continue;
			}
			problemas.push({gravidade: 'aviso', tempo: c.de, texto: `cena ${c.tipo} encurtada até a tela final`});
		}
		const ate = telaFinal !== null && c.tipo !== 'despedida' ? Math.min(c.ate, telaFinal) : c.ate;
		const antesDeT2 = c.de < curva.t2;
		const modo = c.modo ?? MODO_PADRAO[c.tipo];
		const impactoPadrao = antesDeT2 && modo === 'cheia' && (c.tipo === 'titulo' || c.tipo === 'numero');
		if (c.impacto && !antesDeT2) {
			problemas.push({gravidade: 'aviso', tempo: c.de, texto: 'impacto pedido depois de t2: desligado'});
		}
		let som = c.som === undefined ? SOM_PADRAO[c.tipo] : c.som;
		if (som === 'punch') som = antesDeT2 ? 'swish' : null;
		if (som === 'boom' && !antesDeT2) som = null;
		validas.push({
			...c,
			ate: Math.min(ate, duracaoEditada),
			modo,
			entra: 'anima',
			sai: 'anima',
			impactoAtivo: antesDeT2 && (c.impacto ?? impactoPadrao),
			somFinal: som,
		} as CenaNoPlano);
	}

	validas.sort((a, b) => a.de - b.de);

	// Plano de fronteiras: entre duas cenas cheias, a câmera nunca pisca.
	const cheias = validas.filter((c) => c.modo === 'cheia');
	for (let i = 0; i + 1 < cheias.length; i++) {
		const atual = cheias[i];
		const prox = cheias[i + 1];
		const vao = prox.de - atual.ate;
		if (vao < CAMERA_MIN) {
			if (vao >= EMENDA_MAX) {
				problemas.push({
					gravidade: 'aviso',
					tempo: atual.ate,
					texto: `vão de câmera de ${vao.toFixed(2)} s em ${formatar(atual.ate)}: emendei as cenas`,
				});
			}
			atual.ate = Math.max(atual.ate, prox.de);
			atual.sai = 'corte';
			prox.entra = 'corte';
		}
	}

	return {cortes, mantidos, duracaoEditada, palavras, cenas: validas, problemas, curva, telaFinal};
};

// União dos intervalos com animação, para medir cobertura.
export const cobertura = (cenas: CenaNoPlano[], de: number, ate: number) => {
	const partes = cenas
		.map((c) => [Math.max(c.de, de), Math.min(c.ate, ate)] as const)
		.filter(([a, b]) => b > a)
		.sort((x, y) => x[0] - y[0]);
	let total = 0;
	let fimAtual = -Infinity;
	let iniAtual = -Infinity;
	for (const [a, b] of partes) {
		if (a > fimAtual) {
			if (fimAtual > iniAtual) total += fimAtual - iniAtual;
			iniAtual = a;
			fimAtual = b;
		} else {
			fimAtual = Math.max(fimAtual, b);
		}
	}
	if (fimAtual > iniAtual) total += fimAtual - iniAtual;
	return total / (ate - de);
};

export {formatar};
