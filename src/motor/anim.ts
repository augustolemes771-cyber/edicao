import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {CenaNoPlano} from './plano';

export const SAIDA_QUADROS = 9;

// Progresso de entrada (0→1) e de saída (1→0) dentro da Sequence da cena.
export const useCiclo = (cena: Pick<CenaNoPlano, 'de' | 'ate' | 'entra' | 'sai'>) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const duracao = Math.round((cena.ate - cena.de) * fps);
	const entrada = spring({frame, fps, config: {damping: 16, stiffness: 170, mass: 0.7}});
	const saida =
		cena.sai === 'corte'
			? 1
			: interpolate(frame, [duracao - SAIDA_QUADROS, duracao], [1, 0], {
					extrapolateLeft: 'clamp',
					extrapolateRight: 'clamp',
					easing: Easing.in(Easing.cubic),
				});
	return {frame, fps, duracao, entrada, saida, t: frame / fps};
};

// Entrada de um elemento num tempo absoluto do vídeo editado.
export const useEntradaEm = (tempoAbs: number, inicioCena: number, atraso = 0) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const local = Math.round((tempoAbs - inicioCena) * fps) + atraso;
	return spring({frame: frame - local, fps, config: {damping: 15, stiffness: 190, mass: 0.6}});
};

export const dbParaGanho = (db: number) => Math.pow(10, db / 20);
