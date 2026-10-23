import type {Caption} from '@remotion/captions';
import type {TipoObjeto3D} from '../pecas/tres/Objetos3D';
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

// atras: entre o vídeo e a pessoa recortada (precisa de recorte no Edit; ver scripts/recortar.py).
export type Modo = 'cheia' | 'sobre' | 'atras';
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
	| (Base & {tipo: 'despedida'; texto: string})
	// --- Peças aprendidas nas referências (docs/referencias/desmontagem.md) ---
	// Tela escura com uma palavra por vez, em amarelo com glow (ref. 2, "SE / PERGUNTE").
	| (Base & {tipo: 'cartao'; palavras: string[]; tempos: number[]; cor?: string})
	// Letra por letra com desfoque, segunda linha menor em dourado (ref. 2, "SÓ RAZÃO / ZERO EMOÇÃO").
	| (Base & {tipo: 'letras'; linha1: string; linha2?: string; em2?: number})
	// Dois andares: linha pequena e palavra grande em serifa itálica com glow (ref. 1 e 2).
	| (Base & {tipo: 'kicker'; pequeno?: string; grande: string; emGrande?: number; estilo?: 'ouro' | 'amarelo'})
	// Imagem que salta por cima com a câmera desfocada atrás (ref. 1, mapa do Brasil).
	| (Base & {tipo: 'foto'; src: string; legenda?: string; tamanho?: number})
	// Prints de comentários subindo um por um (ref. 1).
	| (Base & {tipo: 'comentarios'; itens: {autor: string; texto: string; em: number}[]})
	// Cartão branco com ícone e legenda pequena (ref. 1, "E não é medicina").
	| (Base & {tipo: 'icone'; src: string; legenda?: string})
	// B-roll em tela cheia com zoom lento (ref. 1).
	| (Base & {tipo: 'broll'; src: string; video?: boolean; zoom?: number})
	// Respiro em preto (ref. 2).
	| (Base & {tipo: 'preto'})
	// Itens com ✓ entrando na hora da fala, em cartões de vidro no terço de baixo (depoimentos, aprendizados).
	| (Base & {tipo: 'checklist'; titulo?: string; itens: {texto: string; em: number}[]})
	// Cenário 3D cinematográfico (desmontagem-2): papel ou escuro, objetos 3D com sombra, palavra fantasma,
	// tipografia revelada, luz de janela ou de folhas, faíscas e poeira.
	| (Base & {
			tipo: 'cenario';
			superficie?: 'papel' | 'escuro';
			luz?: 'janela' | 'folhas' | 'nenhuma';
			objetos?: Objeto3DCena[];
			// Travelling da câmera em unidades 3D (padrão: aproximação lenta). Ex.: {de: [0, 0, 8.3], ate: [0, 0, 7.5]}
			camera?: {de?: [number, number, number]; ate?: [number, number, number]};
			// Palavra gigante e clara atrás dos objetos.
			fantasma?: string;
			pequeno?: string;
			grande?: string;
			abaixo?: string;
			estiloTexto?: 'editorial' | 'ouro' | 'neutro';
			revelar?: 'letras' | 'embaralhado' | 'palavras';
			emGrande?: number;
			// Altura do bloco de texto, de 0 (topo) a 1 (base).
			posTexto?: number;
			// Lado do texto: ao lado de um objeto grande, como o lampião da ref. 3.
			ladoTexto?: 'centro' | 'direita' | 'esquerda';
			detalhes?: boolean;
			// Banho de cor no fim da cena (ref. 1, laranja antes da troca).
			tinta?: string;
	  })
	// Anel de luz fino em volta de um ponto (o rosto), que encolhe até o lugar (desmontagem-2, ref. 2).
	// x e y de 0 a 1 na tela; raio em fração da largura.
	| (Base & {tipo: 'anel'; x?: number; y?: number; raio?: number})
	// Palavra gigante atrás da pessoa (desmontagem-2, ref. 1 e 2). Use \n para quebrar linha.
	// y de 0 (topo) a 1 (base) é o centro do texto; tamanho em fração da largura.
	| (Base & {
			tipo: 'gigante';
			texto: string;
			estilo?: 'amarelo' | 'ouro' | 'branco' | 'neon' | EstiloNome;
			y?: number;
			tamanho?: number;
	  })
	// Foto recortada de uma pessoa (PNG com alfa) saindo de um aro dourado, com nome embaixo.
	// centro: grande no meio, câmera desfocada atrás; lado: menor, no canto de baixo à direita.
	| (Base & {
			tipo: 'retrato';
			src: string;
			nome: string;
			pequeno?: string;
			variante?: 'centro' | 'lado';
			estiloNome?: EstiloNome;
	  })
	// Visor de câmera: cantos, "● REC" piscando (desmontagem-2, ref. 2).
	| (Base & {tipo: 'rec'})
	// Pílulas vermelhas de vidro com ícone, texto palavra por palavra (desmontagem-2, ref. 2, "what to say?").
	| (Base & {tipo: 'alertas'; itens: {texto: string; em: number; icone?: 'alerta' | 'x'}[]});

export type Objeto3DCena = {
	tipo: TipoObjeto3D;
	// Posição na tela: x de -1 (esquerda) a 1 (direita), y de -1 (base) a 1 (topo); z positivo vem para a câmera.
	x: number;
	y: number;
	z?: number;
	escala?: number;
	giro?: [number, number, number];
	// Giro contínuo em radianos por segundo.
	girar?: number;
	flutuar?: boolean;
	entra?: 'cai' | 'desliza' | 'nenhum';
	atraso?: number;
	simbolo?: string;
	cor?: string;
};

// Efeitos de câmera (ref. 1, 2 e 3).
// Letra de nomes e frases de destaque: serif (itálica elegante com fio dourado), limpo (sans grossa branca
// com sublinhado amarelo, como a legenda) e editorial (serifa clássica entre dois fios dourados).
export type EstiloNome = 'serif' | 'limpo' | 'editorial';

export type EfeitoCamera =
	// Zoom em corte seco (ou suave, em segundos) a partir de "em". escala 1 = enquadramento original.
	| {tipo: 'zoom'; em: number; escala: number; suave?: number; x?: number; y?: number}
	// Desfocado para nítido, como puxada de foco.
	| {tipo: 'foco'; em: number; duracao?: number}
	// Clarão de luz estourada, 3 a 4 quadros.
	| {tipo: 'flash'; em: number}
	// Chicote: borrão de movimento horizontal na troca de plano.
	| {tipo: 'chicote'; em: number}
	// Mergulho no texto: o quadro cresce e desfoca até o corte; o próximo entra desfocado e assenta (desmontagem-2).
	| {tipo: 'mergulho'; em: number}
	// Anel de luz desfocado que se abre do centro (desmontagem-2, ref. 1).
	| {tipo: 'iris'; em: number}
	// Vazamento de luz laranja, magenta e roxo com clarão, na troca de cena (desmontagem-2, ref. 1).
	| {tipo: 'vazamento'; em: number; cores?: [string, string, string]}
	// Listras verticais de glitch com estouro de luz, 3 a 4 quadros (desmontagem-2, ref. 2).
	| {tipo: 'listras'; em: number};

export type EstiloLegenda = 'palavra' | 'ouro' | 'impacto' | 'neon';
export type EstiloEnfase = 'serif' | 'cor' | 'caixa' | 'circulo' | 'grande' | 'riscar';

export type Legenda = {
	// palavra: branca e grossa, ênfase em serifa e vermelho (ref. 3)
	// ouro: serifa branca com ênfase dourada (ref. 1)
	// impacto: sans pequena com ênfase amarela gigante com glow (ref. 2)
	// neon: sans pequena branca com a palavra-chave grande em verde-limão brilhante (desmontagem-2, ref. 2)
	estilo: EstiloLegenda;
	palavrasPorTela?: number;
	// Altura do centro da legenda, de 0 (topo) a 1 (base).
	altura?: number;
	enfase?: {palavra: string; estilo: EstiloEnfase; ocorrencia?: number; cor?: string}[];
	// Tipos de cena que escondem a legenda (padrão: as que têm texto próprio).
	esconderEm?: TipoCena[];
};

export type TipoCena = Cena['tipo'];

export type Edit = {
	// Pasta em public/ com a mídia do projeto, ex. "projetos/meu-video".
	pasta: string;
	// horizontal = YouTube 1920x1080; vertical = Reels/Shorts/TikTok 1080x1920.
	formato?: 'horizontal' | 'vertical';
	// Legenda queimada palavra por palavra (ref. 1, 2 e 3). Sem isso, não há legenda.
	legenda?: Legenda;
	camera?: (b: Busca) => EfeitoCamera[];
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
	// false desliga a checagem de cobertura do npm run conferir (Reels, Shorts).
	verificarCurva?: boolean;
	// Vídeo da pessoa recortada com alfa (scripts/recortar.py), para cenas com modo 'atras'.
	recorte?: string;
	// Segundos depois do fim da fala, para uma cartela final sem filmagem (ex.: cenário com a marca).
	extraFim?: number;
	// Barra fina no topo mostrando quanto falta: segura a pessoa até o fim (Reels, depoimentos).
	barraProgresso?: boolean | {cor: string};
	// Regra do canal: câmera crua entre cenas cheias só com 3 s ou mais (vãos menores são emendados).
	// false mantém só a emenda abaixo de 0,6 s, como nas referências de Reels.
	regraCamera?: boolean;
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

export type PaginaLegenda = {
	de: number;
	ate: number;
	palavras: (Palavra & {enfase?: EstiloEnfase; cor?: string})[];
};

export type Montagem = {
	legenda: PaginaLegenda[];
	camera: EfeitoCamera[];
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
	cartao: 'cheia',
	letras: 'cheia',
	icone: 'cheia',
	broll: 'cheia',
	preto: 'cheia',
	checklist: 'sobre',
	cenario: 'cheia',
	gigante: 'atras',
	retrato: 'sobre',
	anel: 'sobre',
	rec: 'sobre',
	alertas: 'sobre',
	kicker: 'sobre',
	foto: 'sobre',
	comentarios: 'sobre',
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
	cartao: 'tick',
	letras: 'shimmer',
	icone: 'pop',
	broll: 'whoosh',
	preto: null,
	checklist: null,
	cenario: 'whoosh',
	gigante: 'whoosh',
	retrato: 'shimmer',
	anel: 'shimmer',
	rec: 'tick',
	alertas: null,
	kicker: 'whoosh',
	foto: 'pop',
	comentarios: 'swish',
	passo: 'pop',
	estrela: 'shimmer',
	painel: 'swish',
	despedida: null,
};

// Mesmo fps da composição: as emendas caem em quadro inteiro.
const FPS_PLANO = 30;

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
		original.erros.forEach((e) => problemas.push({gravidade: 'erro', texto: `corte ${e.busca}: ${e.motivo}`}));
		cortes = cortes.filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b) && b > a);
	} else if (edit.cortes) {
		cortes = edit.cortes;
	}
	const mantidos = trechosMantidos(cortes, duracaoFonte);
	const duracaoEditada = mantidos.reduce((s, [a, b]) => s + (b - a), 0) + (edit.extraFim ?? 0);
	const palavras = palavrasEditadas(legendas, mantidos);
	const busca = criarBusca(palavras);
	let acumulado = 0;
	for (const [a, b] of mantidos.slice(0, -1)) {
		acumulado += b - a;
		busca.emendas.push(Math.round(acumulado * FPS_PLANO) / FPS_PLANO);
	}

	const brutas = edit.cenas(busca);
	const telaFinal = edit.telaFinal ? edit.telaFinal(busca) : null;
	const erroAncora = (e: ErroAncora) => problemas.push({gravidade: 'erro', texto: `âncora ${e.busca}: ${e.motivo}`});
	busca.erros.forEach(erroAncora);
	const errosAntes = busca.erros.length;

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

	if (!edit.recorte && validas.some((c) => c.modo === 'atras')) {
		problemas.push({
			gravidade: 'erro',
			texto: "cena com modo 'atras' sem recorte: rode scripts/recortar.py e ponha recorte no edit.ts",
		});
	}
	validas.sort((a, b) => a.de - b.de);

	// Plano de fronteiras: entre duas cenas cheias, a câmera nunca pisca.
	const cheias = validas.filter((c) => c.modo === 'cheia');
	for (let i = 0; i + 1 < cheias.length; i++) {
		const atual = cheias[i];
		const prox = cheias[i + 1];
		const vao = prox.de - atual.ate;
		if (vao < (edit.regraCamera === false ? EMENDA_MAX : CAMERA_MIN)) {
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

	const camera = (edit.camera?.(busca) ?? []).filter((e) => {
		if (Number.isFinite(e.em)) return true;
		problemas.push({gravidade: 'erro', texto: `efeito de câmera ${e.tipo} sem tempo válido`});
		return false;
	});
	camera.sort((a, b) => a.em - b.em);
	busca.erros.slice(errosAntes).forEach(erroAncora);

	const legenda = edit.legenda ? paginar(palavras, edit.legenda, validas, telaFinal, busca.emendas) : [];

	return {legenda, camera, cortes, mantidos, duracaoEditada, palavras, cenas: validas, problemas, curva, telaFinal};
};

const TEXTO_PROPRIO: TipoCena[] = [
	'titulo',
	'numero',
	'lista',
	'cartao',
	'letras',
	'kicker',
	'icone',
	'preto',
	'logo3d',
	'checklist',
	'cenario',
	'alertas',
	'gigante',
	'retrato',
];
const normalizar = (s: string) =>
	s
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9%]+/g, '');

// Agrupa a fala em telas de legenda: quebra no limite de palavras, na pontuação e nas pausas.
const paginar = (
	palavras: Palavra[],
	cfg: Legenda,
	cenas: CenaNoPlano[],
	telaFinal: number | null,
	emendas: number[],
): PaginaLegenda[] => {
	const limite = cfg.palavrasPorTela ?? (cfg.estilo === 'palavra' ? 4 : 5);
	const esconder = new Set(cfg.esconderEm ?? TEXTO_PROPRIO);
	// Cena atrás da pessoa só esconde a legenda quando é a palavra gigante (o cenário de fundo não).
	const esconde = (c: CenaNoPlano) =>
		esconder.has(c.tipo) &&
		(c.modo !== 'atras' || c.tipo === 'gigante') &&
		!(c.tipo === 'retrato' && c.variante === 'lado');
	const escondida = (t: number) => cenas.some((c) => esconde(c) && t >= c.de && t < c.ate);
	const contagem = new Map<string, number>();
	const marcadas: PaginaLegenda['palavras'] = palavras.map((p) => {
		const chave = normalizar(p.texto);
		const n = (contagem.get(chave) ?? 0) + 1;
		contagem.set(chave, n);
		const e = cfg.enfase?.find(
			(x) => normalizar(x.palavra) === chave && (x.ocorrencia === undefined || x.ocorrencia === n),
		);
		return e ? {...p, enfase: e.estilo, cor: e.cor} : {...p};
	});

	const paginas: PaginaLegenda[] = [];
	let atual: PaginaLegenda['palavras'] = [];
	const fechar = (proximoInicio: number | null) => {
		if (atual.length === 0) return;
		const ultimo = atual[atual.length - 1];
		let ate = proximoInicio === null ? ultimo.fim + 0.4 : Math.min(proximoInicio, ultimo.fim + 0.6);
		// A tela de legenda nunca invade uma cena que esconde a legenda.
		for (const c of cenas) {
			if (esconde(c) && c.de > atual[0].inicio && c.de < ate) ate = c.de;
		}
		paginas.push({de: atual[0].inicio, ate, palavras: atual});
		atual = [];
	};
	for (let i = 0; i < marcadas.length; i++) {
		const p = marcadas[i];
		if (telaFinal !== null && p.inicio >= telaFinal) break;
		if (escondida(p.inicio)) {
			fechar(p.inicio);
			continue;
		}
		// Palavra "grande" ocupa a tela sozinha com o que veio antes dela na frase.
		atual.push(p);
		const prox = marcadas[i + 1];
		const pausa = prox ? prox.inicio - p.fim : Infinity;
		const pontuacao = /[.!?…,;:]$/.test(p.texto);
		// Corte entre esta palavra e a próxima: a frase mudou, a tela de legenda também.
		const emenda = prox ? emendas.some((e) => e > p.inicio && e <= prox.inicio + 0.01) : false;
		if (atual.length >= limite || pontuacao || emenda || pausa > 0.45 || p.enfase === 'grande') {
			fechar(prox ? prox.inicio : null);
		}
	}
	fechar(null);
	return paginas;
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
