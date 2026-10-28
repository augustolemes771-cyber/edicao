// Funções auxiliares do kit do modelo de entrevista aprovado (IMG_5157 v4b), refeitas para este projeto: as peças em
// motion5157*.tsx foram copiadas sem mudança de comportamento e importam daqui. Tempos em segundos.
import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, spring} from 'remotion';

export const FPS = 30;
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const easeOut = Easing.out(Easing.cubic);
export const easeIn = Easing.in(Easing.cubic);

// 0 → 1 entre a e b (suave na chegada).
export const ramp = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], {...clamp, easing: easeOut});
// 1 → 0 nos últimos `dur` segundos antes de `end`.
export const exitK = (t: number, end: number, dur: number) => interpolate(t, [end - dur, end], [1, 0], {...clamp, easing: easeIn});
// Mola que começa em t0.
export const sp = (t: number, t0: number, config: {damping?: number; stiffness?: number; mass?: number} = {}) =>
	t < t0 ? 0 : spring({frame: (t - t0) * FPS, fps: FPS, config});
// Tremor que decai em `dur` segundos a partir de t0.
export const shake = (t: number, t0: number, amp: number, dur: number) => {
	if (t < t0 || t > t0 + dur) return {x: 0, y: 0};
	const k = 1 - (t - t0) / dur;
	const f = Math.floor((t - t0) * FPS);
	return {x: (random(`sx${t0}-${f}`) - 0.5) * 2 * amp * k, y: (random(`sy${t0}-${f}`) - 0.5) * 2 * amp * k};
};

// Escurece o vídeo com tinta roxa, mais forte em cima (para texto branco ler sobre fundo claro).
export const Dim: React.FC<{k: number}> = ({k}) =>
	k <= 0
		? null
		: React.createElement(AbsoluteFill, {
				style: {opacity: k, background: 'linear-gradient(180deg, rgba(30,15,58,0.92) 0%, rgba(30,15,58,0.7) 45%, rgba(30,15,58,0.55) 100%)'},
			});

// Faíscas douradas que saem de (cx, cy) em t0.
export const Sparks: React.FC<{t: number; t0: number; x: number; y: number; n?: number; spread?: number; dur?: number; color?: string}> = ({
	t,
	t0,
	x: cx,
	y: cy,
	n = 18,
	spread = 420,
	dur = 0.9,
	color = '#E8C27A',
}) => {
	const dt = t - t0;
	if (dt < 0 || dt > dur) return null;
	return React.createElement(
		AbsoluteFill,
		null,
		Array.from({length: n}, (_, i) => {
			const a = random(`a${i}${t0}`) * Math.PI * 2;
			const v = spread * (0.4 + 0.6 * random(`v${i}${t0}`));
			const x = cx + Math.cos(a) * v * dt;
			const y = cy + Math.sin(a) * v * dt + 600 * dt * dt;
			const o = 1 - dt / dur;
			return React.createElement('div', {
				key: i,
				style: {position: 'absolute', left: x, top: y, width: 6, height: 6, borderRadius: 3, background: color, opacity: o, boxShadow: `0 0 10px ${color}`},
			});
		}),
	);
};
