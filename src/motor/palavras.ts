import type {Caption} from '@remotion/captions';

// Palavra no tempo do vídeo editado (depois dos cortes), em segundos.
export type Palavra = {
	texto: string;
	inicio: number;
	fim: number;
	indice: number;
};

export type Trecho = [inicio: number, fim: number];

export type ErroAncora = {tipo: 'ancora'; busca: string; motivo: string};

const normalizar = (s: string) =>
	s
		.toLowerCase()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^a-z0-9%]+/g, '');

// Partes do vídeo original que ficam, dados os trechos cortados.
export const trechosMantidos = (cortes: Trecho[], duracao: number): Trecho[] => {
	const ordenados = [...cortes].sort((a, b) => a[0] - b[0]);
	const mantidos: Trecho[] = [];
	let cursor = 0;
	for (const [ini, fim] of ordenados) {
		if (ini > cursor) mantidos.push([cursor, Math.min(ini, duracao)]);
		cursor = Math.max(cursor, fim);
	}
	if (cursor < duracao) mantidos.push([cursor, duracao]);
	return mantidos.filter(([a, b]) => b - a > 0.01);
};

// Converte um tempo do vídeo original para o tempo do vídeo editado.
// Tempo dentro de um corte devolve null.
export const paraTempoEditado = (t: number, mantidos: Trecho[]): number | null => {
	let acumulado = 0;
	for (const [ini, fim] of mantidos) {
		if (t >= ini && t <= fim) return acumulado + (t - ini);
		acumulado += fim - ini;
	}
	return null;
};

export const palavrasEditadas = (legendas: Caption[], mantidos: Trecho[]): Palavra[] => {
	const saida: Palavra[] = [];
	for (const c of legendas) {
		const texto = c.text.trim();
		if (!texto) continue;
		const ini = c.startMs / 1000;
		const fimOriginal = c.endMs / 1000;
		// A palavra fica no trecho mantido que cobre a maior parte dela (o tempo do Whisper erra ~0,3 s
		// e a borda de um corte pode pegar o fim da palavra). Menos da metade dentro: a palavra saiu no corte.
		const dur = Math.max(0.01, fimOriginal - ini);
		let trecho: Trecho | null = null;
		let melhor = 0;
		for (const t of mantidos) {
			const sobra = Math.min(fimOriginal, t[1]) - Math.max(ini, t[0]);
			if (sobra > melhor) {
				melhor = sobra;
				trecho = t;
			}
		}
		if (!trecho || melhor / dur < 0.5) continue;
		const inicio = paraTempoEditado(Math.max(ini, trecho[0]), mantidos);
		const fim = paraTempoEditado(Math.min(fimOriginal, trecho[1]), mantidos);
		if (inicio === null || fim === null) continue;
		saida.push({texto, inicio, fim, indice: saida.length});
	}
	return saida;
};

export type Busca = {
	// Início da n-ésima ocorrência da palavra (1 = primeira).
	at: (palavra: string, ocorrencia?: number) => number;
	// Frase falada: início da primeira palavra e fim da última.
	say: (frase: string, ocorrencia?: number) => {inicio: number; fim: number};
	// Palavra pelo índice de docs/transcript-words.txt.
	atsW: (indice: number) => number;
	// Tempo de cada palavra da frase, para entradas palavra por palavra.
	tempos: (frase: string, ocorrencia?: number) => number[];
	erros: ErroAncora[];
	palavras: Palavra[];
	// Instantes do vídeo editado em que dois trechos mantidos se encontram (cortes).
	emendas: number[];
};

export const criarBusca = (palavras: Palavra[]): Busca => {
	const erros: ErroAncora[] = [];
	const chaves = palavras.map((p) => normalizar(p.texto));

	const acharFrase = (frase: string, ocorrencia: number): Palavra[] | null => {
		const alvo = frase.split(/\s+/).map(normalizar).filter(Boolean);
		if (alvo.length === 0) return null;
		let vistas = 0;
		for (let i = 0; i + alvo.length <= chaves.length; i++) {
			if (alvo.every((a, j) => chaves[i + j] === a)) {
				vistas++;
				if (vistas === ocorrencia) return palavras.slice(i, i + alvo.length);
			}
		}
		erros.push({
			tipo: 'ancora',
			busca: `"${frase}" #${ocorrencia}`,
			motivo: vistas === 0 ? 'não aparece na fala' : `só aparece ${vistas} vez(es)`,
		});
		return null;
	};

	return {
		at: (palavra, ocorrencia = 1) => acharFrase(palavra, ocorrencia)?.[0].inicio ?? NaN,
		say: (frase, ocorrencia = 1) => {
			const achou = acharFrase(frase, ocorrencia);
			return achou ? {inicio: achou[0].inicio, fim: achou[achou.length - 1].fim} : {inicio: NaN, fim: NaN};
		},
		atsW: (indice) => {
			const p = palavras[indice];
			if (!p) {
				erros.push({tipo: 'ancora', busca: `palavra ${indice}`, motivo: 'índice fora da fala'});
				return NaN;
			}
			return p.inicio;
		},
		tempos: (frase, ocorrencia = 1) => acharFrase(frase, ocorrencia)?.map((p) => p.inicio) ?? [],
		erros,
		palavras,
		emendas: [],
	};
};
