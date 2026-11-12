// Auxiliares dos cortes do vídeo 223 (223-1 a 223-5: cada um é um trecho de um .MOV, recortado com scripts/recortar.mjs).
import type {EfeitoCamera} from '../../motor/plano';
import type {Busca, Trecho} from '../../motor/palavras';

// Tira de dentro de cada trecho as pausas medidas (≥ 0,3 s), deixando 0,04 s de ar de cada lado (ritmo sem respiro morto).
export const semPausas = (lista: Trecho[], silencios: Trecho[], minimo = 0.3): Trecho[] => {
	const saida: Trecho[] = [];
	for (const [a, z] of lista) {
		let comeco = a;
		for (const [s0, s1] of silencios) {
			if (s0 <= comeco + 0.25 || s1 >= z - 0.25 || s1 - s0 < minimo) continue;
			saida.push([comeco, s0 + 0.04]);
			comeco = s1 - 0.04;
		}
		saida.push([comeco, z]);
	}
	return saida;
};

// Ritmo frenético (preferência do painel: evento a cada 0,3–0,6 s): punch-in em começo de palavra a cada ~passo s fora das
// telas inteiras, em ciclo médio → close → aberto, até 1,26 (fonte 1080: zoom ≤ 1,35).
const ESCALAS = [1.1, 1.2, 1.26, 1.06, 1.16, 1.22, 1.03, 1.14];
export const punches = (b: Busca, fora: Trecho[], centro: (t: number) => {x: number; y: number}, passo = 0.55): EfeitoCamera[] => {
	const lista: EfeitoCamera[] = [];
	let ultimo = -9;
	for (const p of b.palavras) {
		if (p.inicio - ultimo < passo || fora.some(([a, z]) => p.inicio > a - 0.1 && p.inicio < z + 0.1)) continue;
		lista.push({tipo: 'zoom', em: p.inicio, escala: ESCALAS[lista.length % ESCALAS.length], ...centro(p.inicio)});
		ultimo = p.inicio;
	}
	return lista;
};
