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
	// Início de cada trecho no vídeo editado.
	const inicios: number[] = [];
	mantidos.reduce((acc, [a, b]) => (inicios.push(acc), acc + (b - a)), 0);
	for (const c of legendas) {
		const texto = c.text.trim();
		if (!texto) continue;
		const ini = c.startMs / 1000;
		const fimOriginal = c.endMs / 1000;
		// A palavra entra em cada trecho mantido que cobre a maior parte dela (o tempo do Whisper erra ~0,3 s e a borda de
		// um corte pode pegar o fim da palavra). Menos da metade dentro: a palavra saiu no corte. Um trecho reaproveitado
		// (ex.: o resultado usado como gancho e de novo no meio) repete as palavras dele.
		const dur = Math.max(0.01, fimOriginal - ini);
		mantidos.forEach((t, i) => {
			const sobra = Math.min(fimOriginal, t[1]) - Math.max(ini, t[0]);
			if (sobra / dur < 0.5) return;
			const inicio = inicios[i] + (Math.max(ini, t[0]) - t[0]);
			const fim = inicios[i] + (Math.min(fimOriginal, t[1]) - t[0]);
			saida.push({texto, inicio, fim, indice: saida.length});
		});
	}
	// Com trechos fora da ordem original, a ordem da fala editada é a do tempo editado.
	saida.sort((a, b) => a.inicio - b.inicio);
	saida.forEach((p, i) => (p.indice = i));
	return saida;
};

// Encaixa as bordas dos trechos nas pausas medidas no áudio (silencios.json). O tempo de palavra do Whisper erra
// ~0,3 s: cortar pela palavra come sílaba ou deixa respiração. Começo: logo antes de a fala voltar; fim: logo depois
// de ela parar. Sem pausa perto (fala emendada), a borda fica onde está.
export const encaixarNoSilencio = (trechos: Trecho[], silencios: Trecho[], janela = 0.3): Trecho[] => {
	if (!silencios.length) return trechos;
	// Começo só encaixa em pausa que termina até ~0,1 s depois dele, e fim em pausa que começa até ~0,1 s antes:
	// senão uma pausa curta logo depois do começo (ou um "f"/"s" fraco medido como pausa) engolia a primeira palavra.
	const perto = (t: number, lado: 'inicio' | 'fim') => {
		let melhor: Trecho | null = null;
		let dist = Infinity;
		for (const s of silencios) {
			if (lado === 'inicio' ? s[1] > t + 0.1 : s[0] < t - 0.1) continue;
			const d = t < s[0] ? s[0] - t : t > s[1] ? t - s[1] : 0;
			if (d <= janela && d < dist) {
				dist = d;
				melhor = s;
			}
		}
		return melhor;
	};
	return trechos.map(([a, b]) => {
		const sa = perto(a, 'inicio');
		const sb = perto(b, 'fim');
		const na = sa ? Math.max(sa[0], sa[1] - 0.06) : a;
		const nb = sb ? Math.min(sb[1], sb[0] + 0.1) : b;
		return nb - na > 0.2 ? [na, nb] : [a, b];
	});
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
