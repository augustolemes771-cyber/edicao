// historia-2 · utilidades comuns (tempo, easing, ruído com semente, câmera 2.5D, texto e filtros reaproveitados).
// Tudo determinístico por "s" (segundos absolutos do vídeo): nada de estado nem Math.random.
import React from 'react';
import {anton} from '../../motor/tema';

export const W = 1080;
export const H = 1920;
export const AMBAR = '#ffc34a';
export const ROSA = '#ff4fa3';
export const VERM = '#ff3b30';
export const BRANCO = '#f3efe4';
export const TEAL = '#0f3a44';
export const NOITE = '#06121a';

export type D = Record<string, number>;
export type Palavra = {t: number; txt: string};
export type PlanoProps = {s: number; T: D; frame: number; dados: Record<string, unknown>};

// ---------------------------------------------------------------- tempo
export const L = (v: number) => Math.max(0, Math.min(1, v));
export const eo = (x: number) => 1 - Math.pow(1 - L(x), 3);
export const eio = (x: number) => {
	const t = L(x);
	return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
export const eb = (x: number) => {
	const t = L(x);
	const c1 = 1.70158;
	const c3 = c1 + 1;
	return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
export const pop = (s: number, t0: number, d = 0.35) => eb((s - t0) / d);
export const entra = (s: number, t0: number, d = 0.25) => eo((s - t0) / d);
export const vis = (s: number, a: number, b: number, f = 0.18) => L((s - a) / f) * L((b - s) / f);
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const rnd = (i: number, sd = 0) => {
	const x = Math.sin(i * 127.1 + sd * 311.7) * 43758.5453;
	return x - Math.floor(x);
};
// Ruído suave 1D (para tremida de câmera, chama, vento).
export const ruido = (t: number, sd = 0) => {
	const i = Math.floor(t);
	const f = t - i;
	const u = f * f * (3 - 2 * f);
	return lerp(rnd(i, sd), rnd(i + 1, sd), u) * 2 - 1;
};

// ---------------------------------------------------------------- câmera 2.5D
// cam.x/cam.y: deslocamento da câmera (px no plano focal); cam.z: zoom (dolly). Camada com profundidade p:
// p=0 fica parada (infinito), p=1 é o plano focal, p>1 é primeiro plano (anda mais rápido que o fundo).
export type Cam = {x: number; y: number; z: number; r?: number};
export const Camada: React.FC<{cam: Cam; p: number; children: React.ReactNode; op?: number; filtro?: string}> = ({cam, p, children, op = 1, filtro}) => {
	const k = 1 + (cam.z - 1) * p;
	return (
		<g transform={`translate(${W / 2} ${H / 2}) scale(${k}) translate(${-W / 2 - cam.x * p} ${-H / 2 - cam.y * p})`} opacity={op} filter={filtro ? `url(#${filtro})` : undefined}>
			{children}
		</g>
	);
};
// Respiração de câmera na mão (somar ao cam de cada plano).
export const mao = (s: number, f = 1): Cam => ({x: ruido(s * 0.7, 1) * 6 * f, y: ruido(s * 0.6, 2) * 5 * f, z: 0, r: ruido(s * 0.5, 3) * 0.35 * f});
export const somaCam = (a: Cam, b: Cam): Cam => ({x: a.x + b.x, y: a.y + b.y, z: a.z + b.z, r: (a.r ?? 0) + (b.r ?? 0)});

// ---------------------------------------------------------------- texto
export const Txt: React.FC<{
	x: number;
	y: number;
	children: React.ReactNode;
	size?: number;
	fill?: string;
	font?: string;
	weight?: number;
	ls?: number;
	anchor?: 'start' | 'middle' | 'end';
	op?: number;
	rot?: number;
	sc?: number;
	glow?: string;
	stroke?: string;
	sw?: number;
	italic?: boolean;
}> = ({x, y, children, size = 60, fill = BRANCO, font = anton, weight = 400, ls = 2, anchor = 'middle', op = 1, rot = 0, sc = 1, glow, stroke, sw = 0, italic}) => (
	<g transform={`translate(${x} ${y}) rotate(${rot}) scale(${sc})`} opacity={op}>
		<text
			textAnchor={anchor}
			fontFamily={font}
			fontWeight={weight}
			fontSize={size}
			letterSpacing={ls}
			fill={fill}
			fontStyle={italic ? 'italic' : undefined}
			stroke={stroke}
			strokeWidth={sw}
			paintOrder="stroke"
			style={glow ? {filter: `drop-shadow(0 0 14px ${glow})`} : undefined}
		>
			{children}
		</text>
	</g>
);

// ---------------------------------------------------------------- filtros e gradientes (um <defs> por quadro, ids fixos)
// Poucos filtros e com stdDeviation fixo para o render ficar rápido.
export const Defs: React.FC = () => (
	<defs>
		<filter id="bl1" x="-10%" y="-10%" width="120%" height="120%">
			<feGaussianBlur stdDeviation="2.5" />
		</filter>
		<filter id="bl2" x="-20%" y="-20%" width="140%" height="140%">
			<feGaussianBlur stdDeviation="7" />
		</filter>
		<filter id="bl3" x="-40%" y="-40%" width="180%" height="180%">
			<feGaussianBlur stdDeviation="22" />
		</filter>
		<filter id="bl4" x="-60%" y="-60%" width="220%" height="220%">
			<feGaussianBlur stdDeviation="48" />
		</filter>
		<filter id="whip" x="-10%" y="-2%" width="120%" height="104%">
			<feGaussianBlur stdDeviation="38 0" />
		</filter>
		{/* sombreamento lateral reaproveitado nos personagens e objetos (objectBoundingBox) */}
		<linearGradient id="somD" x1="0" y1="0" x2="1" y2="0">
			<stop offset="0.45" stopColor="#000" stopOpacity="0" />
			<stop offset="1" stopColor="#000" stopOpacity="0.38" />
		</linearGradient>
		<linearGradient id="somE" x1="1" y1="0" x2="0" y2="0">
			<stop offset="0.45" stopColor="#000" stopOpacity="0" />
			<stop offset="1" stopColor="#000" stopOpacity="0.38" />
		</linearGradient>
		<linearGradient id="somB" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0.4" stopColor="#000" stopOpacity="0" />
			<stop offset="1" stopColor="#000" stopOpacity="0.35" />
		</linearGradient>
		<linearGradient id="brilhoT" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stopColor="#fff" stopOpacity="0.22" />
			<stop offset="0.5" stopColor="#fff" stopOpacity="0" />
		</linearGradient>
		<radialGradient id="glowAmbar" cx="0.5" cy="0.5" r="0.5">
			<stop offset="0" stopColor="#ffd98a" stopOpacity="0.95" />
			<stop offset="0.35" stopColor={AMBAR} stopOpacity="0.45" />
			<stop offset="1" stopColor={AMBAR} stopOpacity="0" />
		</radialGradient>
		<radialGradient id="glowBranco" cx="0.5" cy="0.5" r="0.5">
			<stop offset="0" stopColor="#fff" stopOpacity="0.9" />
			<stop offset="0.4" stopColor="#dff3ff" stopOpacity="0.35" />
			<stop offset="1" stopColor="#dff3ff" stopOpacity="0" />
		</radialGradient>
		<radialGradient id="glowRosa" cx="0.5" cy="0.5" r="0.5">
			<stop offset="0" stopColor="#ff9ccc" stopOpacity="0.9" />
			<stop offset="0.4" stopColor={ROSA} stopOpacity="0.4" />
			<stop offset="1" stopColor={ROSA} stopOpacity="0" />
		</radialGradient>
		<radialGradient id="glowVerm" cx="0.5" cy="0.5" r="0.5">
			<stop offset="0" stopColor="#ff8a80" stopOpacity="0.9" />
			<stop offset="0.4" stopColor={VERM} stopOpacity="0.35" />
			<stop offset="1" stopColor={VERM} stopOpacity="0" />
		</radialGradient>
		{/* feixe do farol: forte na origem, some na ponta */}
		<linearGradient id="feixe" x1="0" y1="0" x2="1" y2="0">
			<stop offset="0" stopColor="#fff2c8" stopOpacity="0.85" />
			<stop offset="0.25" stopColor="#ffe3a0" stopOpacity="0.38" />
			<stop offset="1" stopColor="#ffe3a0" stopOpacity="0" />
		</linearGradient>
		<radialGradient id="vinheta" cx="0.5" cy="0.48" r="0.72">
			<stop offset="0.5" stopColor="#000" stopOpacity="0" />
			<stop offset="1" stopColor="#000" stopOpacity="0.72" />
		</radialGradient>
	</defs>
);
