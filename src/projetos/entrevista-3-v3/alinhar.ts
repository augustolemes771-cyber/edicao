// Realinha a transcrição com as pausas reais medidas no áudio (pausas.json: abaixo de -36 dB por ≥ 0,22 s, banda de voz).
// O Whisper espalha as palavras por cima das pausas: palavra que começa dentro de uma pausa (ou quase toda dentro) passa a
// começar no fim dela; palavra que só termina dentro dela termina no começo. As seguintes são empurradas o necessário para
// não sobrepor, encolhendo (o atraso não se acumula). Assim a pausa pode ser cortada sem perder palavra.
type Palavra = {text: string; startMs: number; endMs: number; timestampMs: number | null; confidence: number};

export const alinhar = (palavras: Palavra[], pausas: [number, number][]): Palavra[] => {
	const w = palavras.map((p) => ({...p}));
	for (const [a0, z0] of pausas) {
		const a = a0 * 1000, z = z0 * 1000;
		for (const p of w) {
			if (p.endMs <= a + 20 || p.startMs >= z - 20) continue;
			const dentro = Math.min(z, p.endMs) - Math.max(a, p.startMs);
			const dur = Math.max(10, p.endMs - p.startMs);
			if (p.startMs >= a - 120 || dentro / dur > 0.5) {
				const resto = Math.max(110, p.endMs - Math.max(p.startMs, z));
				p.startMs = z;
				p.endMs = z + resto;
			} else {
				p.endMs = a;
			}
		}
	}
	for (let i = 1; i < w.length; i++) {
		if (w[i].startMs < w[i - 1].endMs) {
			// Encolhe em vez de deslocar: o atraso some na palavra seguinte em vez de se acumular.
			w[i].startMs = w[i - 1].endMs;
			w[i].endMs = Math.max(w[i].endMs, w[i].startMs + 60);
		}
	}
	return w;
};
