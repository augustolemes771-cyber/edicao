// Curva de intensidade (pedido do Mateus em 06/10/2026):
// 0 a t1 frenético, t1 a t2 descida suave, depois de t2 de 20% a 35% animado.
export type Curva = {t1: number; t2: number};

export const CURVA_PADRAO: Curva = {t1: 30, t2: 150};

// Faixa de cobertura esperada (fração do tempo com animação na tela).
export const faixaAlvo = (t: number, {t1, t2}: Curva): [number, number] => {
	if (t < t1) return [0.85, 0.95];
	if (t < t2) {
		const centro = 0.85 + ((t - t1) / (t2 - t1)) * (0.4 - 0.85);
		return [Math.max(0.3, centro - 0.1), Math.min(0.95, centro + 0.1)];
	}
	return [0.2, 0.35];
};

// Antes de t1 a skill pede evento novo a cada 0,3 a 0,6 s.
export const intervaloEventos = (t: number, {t1}: Curva): [number, number] | null =>
	t < t1 ? [0.3, 0.6] : null;
