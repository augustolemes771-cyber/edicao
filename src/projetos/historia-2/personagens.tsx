// historia-2 · kit de personagens em camadas (SVG flat com sombreamento suave e rim light).
// Coordenadas locais: pés em (0,0), adulto com ~420 px de altura (escale de fora). Cabeça em (0,-372).
// Mesmo desenho de cabeça serve para os planos gerais e para os closes (Busto), então o rosto é igual em todo o vídeo.
import React from 'react';
import {L, lerp, rnd} from './util';

export type Quem = 'lia' | 'anselmo' | 'cassio' | 'pescador' | 'senhora' | 'crianca' | 'padre';
export type Expr = 'neutro' | 'medo' | 'confuso' | 'cansado' | 'congelado' | 'serio' | 'tensa' | 'foco';
export type Pose = 'parado' | 'andar' | 'apontar' | 'assustado' | 'segurar' | 'bracos';

type Visual = {pele: string; peleS: string; cabelo: string; roupa: string; roupa2: string; calca: string; sapato: string; olho: string; esc: number; largura: number};
export const VISUAL: Record<Quem, Visual> = {
	lia: {pele: '#b8805c', peleS: '#8e5c3f', cabelo: '#24150f', roupa: '#b85c3c', roupa2: '#e9e2d4', calca: '#34465e', sapato: '#e6e1d6', olho: '#3a2414', esc: 0.96, largura: 1},
	anselmo: {pele: '#c99271', peleS: '#9c6a4e', cabelo: '#bdb8ae', roupa: '#e2ac1e', roupa2: '#b98612', calca: '#2b3037', sapato: '#1a1c1f', olho: '#3c4a52', esc: 1.02, largura: 1.06},
	cassio: {pele: '#8d5d3e', peleS: '#6a4129', cabelo: '#141010', roupa: '#cdbb8e', roupa2: '#a8966a', calca: '#1f2a3a', sapato: '#121418', olho: '#2a1a10', esc: 1.0, largura: 1.12},
	pescador: {pele: '#6b4630', peleS: '#4d301f', cabelo: '#141010', roupa: '#e8e4da', roupa2: '#2f5d86', calca: '#3d5a6b', sapato: '#2c2c2c', olho: '#22140c', esc: 0.98, largura: 1.02},
	senhora: {pele: '#d9a882', peleS: '#b0805f', cabelo: '#cfc8bd', roupa: '#7a4a6a', roupa2: '#e6dccb', calca: '#7a4a6a', sapato: '#5a3a2a', olho: '#3a2a1e', esc: 0.9, largura: 1.04},
	crianca: {pele: '#a06844', peleS: '#7a4a2e', cabelo: '#1a0f0a', roupa: '#6fa35a', roupa2: '#4c7d3d', calca: '#2f3f5a', sapato: '#c94a3a', olho: '#24140c', esc: 0.6, largura: 1},
	padre: {pele: '#e0b89a', peleS: '#b98f72', cabelo: '#9a958e', roupa: '#17181d', roupa2: '#f2f0ea', calca: '#17181d', sapato: '#0e0e10', olho: '#3a4a58', esc: 1.0, largura: 1},
};

const piscando = (t: number, sd: number) => ((t * 0.31 + rnd(sd, 7)) % 1) < 0.035;

// ---------------------------------------------------------------- rosto
const Olho: React.FC<{x: number; y: number; ab: number; ox: number; oy: number; iris: string; fecha: number; lado: number}> = ({x, y, ab, ox, oy, iris, fecha, lado}) => {
	const rx = 6.4;
	const ry = 4.8 * ab * (1 - fecha);
	if (ry < 0.9)
		return <path d={`M${x - rx},${y} Q${x},${y + 2.6} ${x + rx},${y}`} fill="none" stroke="#1a100a" strokeWidth={1.8} strokeLinecap="round" />;
	const ri = Math.min(3.5, ry * 0.92);
	return (
		<g>
			<ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#f4efe6" />
			<circle cx={x + ox * 2.4} cy={y + oy * 1.6} r={ri} fill={iris} />
			<circle cx={x + ox * 2.4} cy={y + oy * 1.6} r={ri * 0.5} fill="#0b0705" />
			<circle cx={x + ox * 2.4 - 1.1} cy={y + oy * 1.6 - 1.2} r={0.9} fill="#fff" />
			{/* pálpebra superior e cílio */}
			<path d={`M${x - rx - 0.6},${y + 0.6} Q${x - rx * 0.4},${y - ry - 1.6} ${x + rx * 0.2},${y - ry - 1.2} Q${x + rx * 0.8},${y - ry - 0.4} ${x + rx + 0.8 * lado},${y - 0.4}`} fill="none" stroke="#1a100a" strokeWidth={2.1} strokeLinecap="round" />
		</g>
	);
};

type ExprCfg = {ab: number; sob: number; inner: number; boca: 'sorriso' | 'reto' | 'aberto' | 'triste' | 'o' | 'torto' | 'tenso'; assim?: number};
const EXPR: Record<Expr, ExprCfg> = {
	neutro: {ab: 1, sob: 0, inner: 0, boca: 'reto'},
	foco: {ab: 0.85, sob: 1, inner: 2, boca: 'reto'},
	medo: {ab: 1.35, sob: -4, inner: -4, boca: 'o'},
	confuso: {ab: 1.05, sob: -1, inner: -1, boca: 'torto', assim: 5},
	cansado: {ab: 0.55, sob: 2, inner: -1, boca: 'triste'},
	congelado: {ab: 1.55, sob: -6, inner: -3, boca: 'aberto'},
	serio: {ab: 0.9, sob: 1.5, inner: 3, boca: 'reto'},
	tensa: {ab: 1.15, sob: -2, inner: -3.5, boca: 'tenso'},
};

const Boca: React.FC<{x: number; y: number; tipo: ExprCfg['boca']; fala: number}> = ({x, y, tipo, fala}) => {
	const c = '#5a2a22';
	if (tipo === 'aberto' || fala > 0.05) {
		const a = tipo === 'aberto' ? 5.5 : 1.5 + fala * 4;
		return (
			<g>
				<ellipse cx={x} cy={y + a * 0.3} rx={6.5} ry={a} fill="#3a1410" />
				<rect x={x - 4.5} y={y + a * 0.3 - a} width={9} height={Math.min(2.4, a * 0.5)} fill="#efe9e0" opacity={0.85} />
			</g>
		);
	}
	if (tipo === 'o') return <ellipse cx={x} cy={y + 1} rx={3.6} ry={4.4} fill="#3a1410" />;
	if (tipo === 'sorriso') return <path d={`M${x - 8},${y} Q${x},${y + 6} ${x + 8},${y}`} fill="none" stroke={c} strokeWidth={2.4} strokeLinecap="round" />;
	if (tipo === 'triste') return <path d={`M${x - 7},${y + 2.5} Q${x},${y - 2} ${x + 7},${y + 2.5}`} fill="none" stroke={c} strokeWidth={2.4} strokeLinecap="round" />;
	if (tipo === 'torto') return <path d={`M${x - 7},${y + 1.5} Q${x - 2},${y - 1} ${x + 2},${y + 1} T${x + 8},${y - 2}`} fill="none" stroke={c} strokeWidth={2.4} strokeLinecap="round" />;
	if (tipo === 'tenso')
		return (
			<g>
				<path d={`M${x - 7},${y + 1} Q${x},${y - 1.5} ${x + 7},${y + 1}`} fill="#3a1410" stroke={c} strokeWidth={1.8} />
				<path d={`M${x - 6},${y + 0.6} L${x + 6},${y + 0.6}`} stroke="#efe9e0" strokeWidth={1.3} opacity={0.8} />
			</g>
		);
	return <path d={`M${x - 7},${y} Q${x},${y + 1.8} ${x + 7},${y}`} fill="none" stroke={c} strokeWidth={2.4} strokeLinecap="round" />;
};

const ROSTO = 'M-31,-6 C-31,-34 -17,-44 0,-44 C17,-44 31,-34 31,-6 C31,16 21,36 0,42 C-21,36 -31,16 -31,-6 Z';

// Cabeça completa. vira: -1..1 (vira o rosto para a direita da tela quando >0). olhar: -1..1.
export const Cabeca: React.FC<{quem: Quem; vira?: number; ox?: number; oy?: number; expr?: Expr; t?: number; fala?: number; mono?: string; costas?: boolean; sd?: number}> = ({
	quem,
	vira = 0,
	ox = 0,
	oy = 0,
	expr = 'neutro',
	t = 0,
	fala = 0,
	mono,
	costas = false,
	sd = 1,
}) => {
	const v = VISUAL[quem];
	const e = EXPR[expr];
	const c = (x: string) => mono ?? x;
	const fx = vira * 9; // deslocamento dos traços do rosto
	const larg = quem === 'cassio' ? 1.07 : quem === 'crianca' ? 1.04 : 1;
	const fecha = piscando(t, sd) && expr !== 'congelado' ? 1 : 0;
	const ox2 = L((ox + vira * 0.6 + 1) / 2) * 2 - 1;

	// cabelo de trás
	const tras =
		quem === 'lia' ? (
			<path
				d="M-40,-18 C-46,-50 -24,-62 2,-60 C28,-60 46,-46 42,-14 C46,0 44,12 38,20 C34,28 26,24 24,16 L-24,16 C-28,26 -36,28 -40,20 C-46,10 -44,-2 -40,-18 Z"
				fill={c(v.cabelo)}
			/>
		) : quem === 'senhora' ? (
			<path d="M-38,-10 C-44,-52 44,-52 38,-10 L40,26 C30,40 -30,40 -40,26 Z" fill={c('#2f6e6a')} />
		) : null;

	if (costas) {
		return (
			<g transform={`scale(${larg} 1)`}>
				{tras}
				<path d={ROSTO} fill={c(v.pele)} />
				<path d={ROSTO} fill={c(v.cabelo)} opacity={quem === 'padre' ? 0.6 : 0.95} />
				<Topo quem={quem} c={c} v={v} vira={0} costas />
			</g>
		);
	}

	return (
		<g transform={`scale(${larg} 1)`}>
			{tras}
			{/* orelhas */}
			{vira < 0.6 && <ellipse cx={-31 + fx * 0.3} cy={-2} rx={5.5} ry={9} fill={c(v.peleS)} />}
			{vira > -0.6 && <ellipse cx={31 + fx * 0.3} cy={-2} rx={5.5} ry={9} fill={c(v.peleS)} />}
			<path d={ROSTO} fill={c(v.pele)} />
			{!mono && (
				<g>
					<path d={ROSTO} fill={vira >= 0 ? 'url(#somE)' : 'url(#somD)'} />
					<path d={ROSTO} fill="url(#somB)" opacity={0.6} />
					{/* bochechas */}
					<ellipse cx={-17 + fx} cy={12} rx={7} ry={4.5} fill="#d0645a" opacity={0.18} />
					<ellipse cx={17 + fx} cy={12} rx={7} ry={4.5} fill="#d0645a" opacity={0.18} />
					{/* sobrancelhas */}
					{[-1, 1].map((lado) => {
						const xi = lado * 5 + fx;
						const xo = lado * 21 + fx;
						const yb = -17 + e.sob + (lado === 1 ? -(e.assim ?? 0) : 0);
						const grossa = quem === 'cassio' || quem === 'anselmo' ? 3.8 : quem === 'lia' ? 2.8 : 3.2;
						const corB = quem === 'anselmo' ? '#8f8a82' : quem === 'senhora' || quem === 'padre' ? '#7c766e' : '#1c120c';
						return <path key={lado} d={`M${xi},${yb + e.inner} Q${(xi + xo) / 2},${yb - 3} ${xo},${yb + 1}`} fill="none" stroke={corB} strokeWidth={grossa} strokeLinecap="round" />;
					})}
					<Olho x={-12 + fx} y={-5} ab={e.ab} ox={ox2} oy={oy} iris={v.olho} fecha={fecha} lado={-1} />
					<Olho x={12 + fx} y={-5} ab={e.ab} ox={ox2} oy={oy} iris={v.olho} fecha={fecha} lado={1} />
					{expr === 'cansado' && (
						<g stroke={v.peleS} strokeWidth={1.5} fill="none" opacity={0.8}>
							<path d={`M${-18 + fx},2 Q${-12 + fx},5 ${-6 + fx},2`} />
							<path d={`M${6 + fx},2 Q${12 + fx},5 ${18 + fx},2`} />
						</g>
					)}
					{/* nariz */}
					<path d={`M${fx * 1.25 - 1},-2 Q${fx * 1.25 + 4 + vira * 4},10 ${fx * 1.25 + 3 + vira * 3},12 Q${fx * 1.25},14 ${fx * 1.25 - 4},12`} fill="none" stroke={v.peleS} strokeWidth={2.2} strokeLinecap="round" />
					{(quem === 'senhora' || quem === 'anselmo' || quem === 'padre') && (
						<g stroke={v.peleS} strokeWidth={1.3} fill="none" opacity={0.7}>
							<path d={`M${-24 + fx},-1 l-4,-2 M${24 + fx},-1 l4,-2`} />
							<path d={`M${-9 + fx},16 q-3,6 -1,11 M${9 + fx},16 q3,6 1,11`} />
						</g>
					)}
					<Boca x={fx * 1.1} y={24} tipo={e.boca} fala={fala} />
					{quem === 'lia' && <path d={`M${-4 + fx},31 Q${fx},33 ${4 + fx},31`} stroke={v.peleS} strokeWidth={1.2} fill="none" opacity={0.6} />}
				</g>
			)}
			<Topo quem={quem} c={c} v={v} vira={vira} mono={mono} />
		</g>
	);
};

// Cabelo da frente, chapéus, barba, bigode, óculos.
const Topo: React.FC<{quem: Quem; c: (x: string) => string; v: Visual; vira: number; mono?: string; costas?: boolean}> = ({quem, c, v, vira, mono, costas}) => {
	const fx = vira * 9;
	if (quem === 'lia')
		return (
			<g>
				<path d={`M-33,-12 C-38,-44 -14,-54 4,-52 C26,-50 38,-38 34,-12 C30,-26 22,-34 12,-36 C${8 + fx},-26 ${-8 + fx},-24 -22,-22 C-26,-18 -30,-14 -33,-12 Z`} fill={c(v.cabelo)} />
				{!mono && (
					<g fill="none" stroke="#5a3626" strokeWidth={1.6} opacity={0.7} strokeLinecap="round">
						<path d="M-26,-36 Q-14,-48 4,-46" />
						<path d="M-30,-20 Q-24,-34 -10,-38" />
						<path d="M14,-44 Q28,-40 32,-24" />
						<path d="M-40,0 q-4,8 0,14 M38,-4 q4,8 0,16" />
					</g>
				)}
				{costas && <path d="M-40,-10 C-46,10 -36,26 -24,22 L24,22 C36,26 46,10 40,-10 Z" fill={c(v.cabelo)} />}
			</g>
		);
	if (quem === 'anselmo')
		return (
			<g>
				{/* cabelo grisalho do lado */}
				<path d="M-32,-14 q-4,10 2,20 l5,-2 q-3,-8 -1,-16 Z M32,-14 q4,10 -2,20 l-5,-2 q3,-8 1,-16 Z" fill={c(v.cabelo)} />
				{/* gorro de lã */}
				<path d="M-34,-18 C-36,-56 36,-56 34,-18 Z" fill={c('#7d2620')} />
				<rect x={-36} y={-26} width={72} height={14} rx={6} fill={c('#5e1b16')} />
				{!mono && (
					<g stroke="#4a1410" strokeWidth={1.4} opacity={0.6}>
						{[-28, -19, -10, -1, 8, 17, 26].map((x) => (
							<line key={x} x1={x} y1={-25} x2={x} y2={-14} />
						))}
					</g>
				)}
				{/* barba cheia grisalha com bigode */}
				{!costas && (
					<g>
						<path d={`M-31,0 C-30,26 -16,46 ${fx},48 C16,46 30,26 31,0 C26,8 20,14 ${12 + fx},16 C${6 + fx},14 ${-6 + fx},14 ${-12 + fx},16 C-20,14 -26,8 -31,0 Z`} fill={c(v.cabelo)} />
						<path d={`M${-12 + fx},19 Q${fx},14 ${12 + fx},19 Q${fx},23 ${-12 + fx},19 Z`} fill={c('#a7a297')} />
						{!mono && <path d={`M${-5 + fx},27 Q${fx},29 ${5 + fx},27`} stroke="#5a2a22" strokeWidth={2} fill="none" />}
						{!mono && (
							<g stroke="#9a958b" strokeWidth={1.2} opacity={0.8} fill="none">
								<path d={`M-20,22 q2,8 6,12 M20,22 q-2,8 -6,12 M${fx - 4},36 q1,5 0,9 M${fx + 5},36 q0,5 -1,8`} />
							</g>
						)}
					</g>
				)}
			</g>
		);
	if (quem === 'cassio')
		return (
			<g>
				<path d="M-32,-10 q-2,-8 2,-14 l4,0 q-2,8 0,16 Z M32,-10 q2,-8 -2,-14 l-4,0 q2,8 0,16 Z" fill={c(v.cabelo)} />
				{/* quepe */}
				<path d="M-36,-24 C-40,-50 -20,-62 4,-62 C30,-62 44,-50 38,-24 Z" fill={c('#1d2b44')} />
				<rect x={-36} y={-30} width={74} height={10} fill={c('#141e30')} />
				<path d={`M-34,-21 Q${fx},-12 38,-21 L36,-16 Q${fx},-6 -32,-16 Z`} fill={c('#0b0f18')} />
				{!mono && <path d="M-6,-48 l6,-6 l6,6 l-6,6 Z" fill="#d8b04a" />}
				{/* bigode */}
				{!costas && <path d={`M${-14 + fx},19 Q${-4 + fx},12 ${fx},16 Q${4 + fx},12 ${14 + fx},19 Q${8 + fx},24 ${fx},20 Q${-8 + fx},24 ${-14 + fx},19 Z`} fill={c(v.cabelo)} />}
				{!mono && !costas && <path d="M-26,22 q4,10 12,14 M26,22 q-4,10 -12,14" stroke="#5a3824" strokeWidth={1.4} fill="none" opacity={0.6} />}
			</g>
		);
	if (quem === 'pescador')
		return (
			<g>
				<path d="M-33,-18 C-34,-52 34,-52 33,-18 Z" fill={c('#b5523a')} />
				<path d={`M${-6 + fx * 2},-22 Q${20 + fx * 3},-26 ${44 + fx * 3},-16 L${40 + fx * 3},-12 Q${18 + fx * 2},-18 ${-4 + fx * 2},-16 Z`} fill={c('#8d3c2a')} />
				{!mono && <circle cx={0} cy={-46} r={2.6} fill="#8d3c2a" />}
				{!mono && !costas && (
					<g fill="#2a1a12" opacity={0.35}>
						{Array.from({length: 22}).map((_, i) => (
							<circle key={i} cx={(rnd(i, 21) - 0.5) * 44 + fx} cy={18 + rnd(i, 22) * 20} r={0.9} />
						))}
					</g>
				)}
			</g>
		);
	if (quem === 'senhora')
		return (
			<g>
				<path d="M-24,-26 q-6,8 -6,18 l6,-4 Z M24,-26 q6,8 6,18 l-6,-4 Z" fill={c(v.cabelo)} />
				<path d="M-36,-14 C-40,-58 40,-58 36,-14 C30,-30 16,-36 0,-36 C-16,-36 -30,-30 -36,-14 Z" fill={c('#3f8a85')} />
				{!mono && (
					<g fill="#f0d27a" opacity={0.85}>
						{[
							[-20, -38],
							[0, -46],
							[18, -38],
							[-28, -24],
							[28, -24],
						].map(([x, y], i) => (
							<circle key={i} cx={x} cy={y} r={2.6} />
						))}
					</g>
				)}
			</g>
		);
	if (quem === 'crianca')
		return (
			<g>
				<path d="M-33,-10 C-38,-50 38,-50 33,-10 C30,-26 20,-32 8,-30 C0,-34 -14,-32 -20,-26 C-26,-22 -30,-16 -33,-10 Z" fill={c(v.cabelo)} />
				{!mono && (
					<g fill={v.cabelo}>
						{[-28, -18, -6, 6, 18, 28].map((x, i) => (
							<circle key={i} cx={x} cy={-40 + Math.abs(x) * 0.35} r={7} />
						))}
					</g>
				)}
			</g>
		);
	// padre: careca no topo, lados grisalhos, óculos redondos
	return (
		<g>
			<path d="M-32,-20 q-4,10 0,22 l6,-2 q-2,-10 0,-18 Z M32,-20 q4,10 0,22 l-6,-2 q2,-10 0,-18 Z" fill={c(v.cabelo)} />
			{!mono && !costas && (
				<g fill="none" stroke="#3a3328" strokeWidth={1.8}>
					<circle cx={-12 + fx} cy={-5} r={9} />
					<circle cx={12 + fx} cy={-5} r={9} />
					<path d={`M${-3 + fx},-6 q3,-3 6,0`} />
				</g>
			)}
			{!mono && <ellipse cx={-6} cy={-34} rx={10} ry={4} fill="#fff" opacity={0.18} />}
		</g>
	);
};

// ---------------------------------------------------------------- corpo
type Ang = {bE: [number, number]; bD: [number, number]; pE: [number, number]; pD: [number, number]; bob: number; incl: number};
const poseAng = (pose: Pose, t: number, ritmo: number): Ang => {
	if (pose === 'andar') {
		const f = t * ritmo * Math.PI * 2;
		const sw = Math.sin(f);
		return {bE: [sw * 20, -14], bD: [-sw * 20, -14], pE: [-sw * 24, Math.max(0, sw) * 30], pD: [sw * 24, Math.max(0, -sw) * 30], bob: Math.abs(Math.cos(f)) * -7, incl: 2};
	}
	const resp = Math.sin(t * 1.6) * 1.5;
	if (pose === 'apontar') return {bE: [-6, -4], bD: [105, 6], pE: [-4, 0], pD: [6, 0], bob: resp, incl: -2};
	if (pose === 'assustado') return {bE: [-30, 128], bD: [30, -128], pE: [-9, 0], pD: [9, 0], bob: resp - 4, incl: -3};
	if (pose === 'segurar') return {bE: [-14 + Math.sin(t * 2.1) * 3, 82], bD: [14 + Math.sin(t * 7) * 6, -82 + Math.sin(t * 9) * 12], pE: [-4, 0], pD: [4, 0], bob: resp, incl: 1};
	if (pose === 'bracos') return {bE: [-22, 118], bD: [22, -118], pE: [-6, 0], pD: [6, 0], bob: resp, incl: 0};
	return {bE: [-7 + resp * 0.6, 6], bD: [7 - resp * 0.6, -6], pE: [-4, 0], pD: [4, 0], bob: resp, incl: 0};
};
const ponta = (x: number, y: number, ang: number, len: number): [number, number] => [x + Math.sin((ang * Math.PI) / 180) * len, y + Math.cos((ang * Math.PI) / 180) * len];

const Membro: React.FC<{x: number; y: number; a1: number; a2: number; l1: number; l2: number; w1: number; w2: number; cor: string; cor2?: string; fim?: React.ReactNode; fimCor?: string; fimR?: number}> = ({
	x,
	y,
	a1,
	a2,
	l1,
	l2,
	w1,
	w2,
	cor,
	cor2,
	fimCor,
	fimR = 0,
}) => {
	const [jx, jy] = ponta(x, y, a1, l1);
	const [ex, ey] = ponta(jx, jy, a1 + a2, l2);
	return (
		<g>
			<line x1={x} y1={y} x2={jx} y2={jy} stroke={cor} strokeWidth={w1} strokeLinecap="round" />
			<line x1={jx} y1={jy} x2={ex} y2={ey} stroke={cor2 ?? cor} strokeWidth={w2} strokeLinecap="round" />
			{fimCor && <circle cx={ex} cy={ey} r={fimR} fill={fimCor} />}
		</g>
	);
};

const Corpo: React.FC<{quem: Quem; pose: Pose; t: number; ritmo: number; vira: number; ox: number; oy: number; expr: Expr; fala: number; mono?: string; costas: boolean; sd: number}> = ({
	quem,
	pose,
	t,
	ritmo,
	vira,
	ox,
	oy,
	expr,
	fala,
	mono,
	costas,
	sd,
}) => {
	const v = VISUAL[quem];
	const c = (x: string) => mono ?? x;
	const a = poseAng(pose, t + sd * 0.37, ritmo);
	const lw = v.largura;
	const ombro = 46 * lw;
	const quadril = 15 * lw;
	const yQ = -192;
	const yO = -312;
	const longo = quem === 'padre' ? 'batina' : quem === 'senhora' ? 'vestido' : quem === 'anselmo' ? 'capa' : null;
	const corPerna = longo === 'batina' ? v.roupa : v.calca;
	const pernas = (
		<g>
			{[
				[-quadril, a.pE],
				[quadril, a.pD],
			].map(([hx, ang], i) => {
				const [a1, a2] = ang as [number, number];
				const [kx, ky] = ponta(hx as number, yQ, a1, 96);
				const [fx, fy] = ponta(kx, ky, a1 - a2, 92);
				const curta = quem === 'pescador' || quem === 'crianca';
				return (
					<g key={i}>
						<line x1={hx as number} y1={yQ} x2={kx} y2={ky} stroke={c(corPerna)} strokeWidth={30 * lw} strokeLinecap="round" />
						<line x1={kx} y1={ky} x2={fx} y2={fy} stroke={c(curta ? v.pele : quem === 'senhora' ? v.pele : corPerna)} strokeWidth={24 * lw} strokeLinecap="round" />
						{curta && <line x1={kx} y1={ky - 22} x2={kx} y2={ky + 6} stroke={c(corPerna)} strokeWidth={31 * lw} strokeLinecap="round" />}
						<ellipse cx={fx + (i === 0 ? -6 : 6) * (Math.abs(vira) > 0.5 ? Math.sign(vira) * (i === 0 ? -1 : 1) : 1)} cy={fy + 4} rx={19} ry={9} fill={c(v.sapato)} />
					</g>
				);
			})}
		</g>
	);
	const torso =
		quem === 'cassio'
			? `M${-ombro},${yO - 4} Q${-ombro - 18},-250 ${-36},${yQ + 4} L36,${yQ + 4} Q${ombro + 22},-250 ${ombro},${yO - 4} Q0,${yO - 20} ${-ombro},${yO - 4} Z`
			: `M${-ombro},${yO - 4} Q${-ombro - 4},-250 ${-36 * lw},${yQ + 4} L${36 * lw},${yQ + 4} Q${ombro + 4},-250 ${ombro},${yO - 4} Q0,${yO - 20} ${-ombro},${yO - 4} Z`;
	const braco = (lado: -1 | 1) => {
		const [a1, a2] = lado === -1 ? a.bE : a.bD;
		const manga = quem === 'pescador' ? v.pele : quem === 'senhora' ? v.roupa : v.roupa;
		return <Membro x={lado * (ombro - 8)} y={yO + 8} a1={a1} a2={a2} l1={64} l2={60} w1={22 * lw} w2={19 * lw} cor={c(manga)} cor2={c(quem === 'pescador' ? v.pele : manga)} fimCor={c(v.pele)} fimR={11} />;
	};
	return (
		<g>
			{/* mochila de Lia por trás */}
			{quem === 'lia' && <rect x={-40} y={-318} width={80} height={110} rx={18} fill={c('#2d3a3f')} transform={costas ? '' : 'translate(0 -6) scale(1.05 1)'} />}
			{costas && quem === 'lia' && pernas}
			{!costas && pernas}
			{costas && quem !== 'lia' && pernas}
			<path d={torso} fill={c(quem === 'pescador' ? v.roupa : v.roupa)} />
			{!mono && (
				<g>
					{quem === 'pescador' &&
						[-280, -258, -236, -214].map((y) => <rect key={y} x={-40} y={y} width={80} height={8} fill={v.roupa2} opacity={0.85} />)}
					{quem === 'lia' && !costas && (
						<g>
							<path d={`M-16,${yO - 10} L0,-238 L16,${yO - 10} Z`} fill={v.roupa2} />
							<path d={`M-18,${yO - 12} L-4,-238 L-10,-200 M18,${yO - 12} L4,-238 L10,-200`} stroke="#8a3f27" strokeWidth={3} fill="none" />
							<path d={`M-34,${yO - 2} L-26,-210 M34,${yO - 2} L26,-210`} stroke="#1c2629" strokeWidth={9} strokeLinecap="round" />
						</g>
					)}
					{quem === 'lia' && costas && <rect x={-40} y={-300} width={80} height={104} rx={18} fill="#2d3a3f" />}
					{quem === 'lia' && costas && <rect x={-28} y={-270} width={56} height={30} rx={8} fill="#3d4d53" />}
					{quem === 'cassio' && (
						<g>
							<line x1={0} y1={yO - 10} x2={0} y2={yQ} stroke={v.roupa2} strokeWidth={2.5} />
							{[-280, -255, -230].map((y) => (
								<circle key={y} cx={0} cy={y} r={2.6} fill="#7a6a48" />
							))}
							<path d="M-30,-292 l12,-4 l2,12 l-12,4 Z" fill="#d8b04a" />
							<rect x={-ombro} y={yO - 4} width={20} height={7} fill="#1d2b44" />
							<rect x={ombro - 20} y={yO - 4} width={20} height={7} fill="#1d2b44" />
							<rect x={-38} y={yQ - 6} width={76} height={12} fill="#4a3220" />
							<rect x={-7} y={yQ - 7} width={14} height={14} fill="#c9a548" />
						</g>
					)}
					{quem === 'padre' && <rect x={-9} y={yO - 12} width={18} height={9} rx={2} fill={v.roupa2} />}
					{quem === 'crianca' && <circle cx={0} cy={-262} r={14} fill="#f3e3a0" opacity={0.85} />}
				</g>
			)}
			{/* peças longas: capa de chuva, batina, vestido */}
			{longo === 'capa' && (
				<g>
					<path d={`M${-40},${yQ - 20} L${-54},-92 L54,-92 L40,${yQ - 20} Z`} fill={c(v.roupa)} />
					{!mono && <path d={`M0,${yO - 10} L0,-92`} stroke={v.roupa2} strokeWidth={4} />}
					{!mono && [-262, -222, -182, -142].map((y) => <circle key={y} cx={7} cy={y} r={3} fill="#5a4210" />)}
					{!mono && <path d={`M-22,${yO - 14} L0,${yO + 18} L22,${yO - 14}`} fill="none" stroke={v.roupa2} strokeWidth={6} />}
				</g>
			)}
			{longo === 'batina' && <path d={`M${-38},${yQ - 10} L${-50},-14 L50,-14 L38,${yQ - 10} Z`} fill={c(v.roupa)} />}
			{longo === 'vestido' && (
				<g>
					<path d={`M${-40},${yQ - 10} L${-56},-96 L56,-96 L40,${yQ - 10} Z`} fill={c(v.roupa)} />
					{!mono && <path d={`M-30,-268 L30,-268 L40,-110 L-40,-110 Z`} fill={v.roupa2} opacity={0.92} />}
					{!mono &&
						Array.from({length: 10}).map((_, i) => <circle key={i} cx={-44 + (i % 5) * 22} cy={-170 + Math.floor(i / 5) * 46} r={3} fill="#e0a0c0" opacity={0.5} />)}
				</g>
			)}
			{!mono && <path d={torso} fill={vira >= 0 ? 'url(#somE)' : 'url(#somD)'} />}
			{!costas && braco(-1)}
			{!costas && braco(1)}
			{costas && (
				<g>
					{braco(-1)}
					{braco(1)}
				</g>
			)}
			{/* pescoço + cabeça */}
			<rect x={-11} y={-344} width={22} height={36} fill={c(v.peleS)} />
			<g transform={`translate(${vira * 3} ${-376})`}>
				<Cabeca quem={quem} vira={vira} ox={ox} oy={oy} expr={expr} t={t} fala={fala} mono={mono} costas={costas} sd={sd} />
			</g>
		</g>
	);
};

export type PessoaProps = {
	quem: Quem;
	x: number;
	y: number;
	esc?: number;
	t: number;
	pose?: Pose;
	ritmo?: number;
	vira?: number;
	ox?: number;
	oy?: number;
	expr?: Expr;
	fala?: number;
	rim?: string;
	rimDx?: number;
	dir?: 1 | -1;
	costas?: boolean;
	op?: number;
	sombra?: number;
	sd?: number;
	silhueta?: string;
};

// Personagem de corpo inteiro com sombra no chão e rim light (cópia em cor única deslocada por trás).
export const Pessoa: React.FC<PessoaProps> = ({quem, x, y, esc = 1, t, pose = 'parado', ritmo = 1.6, vira = 0, ox = 0, oy = 0, expr = 'neutro', fala = 0, rim, rimDx = 4, dir = 1, costas = false, op = 1, sombra = 0.5, sd = 1, silhueta}) => {
	const v = VISUAL[quem];
	const k = esc * v.esc;
	const a = poseAng(pose, t + sd * 0.37, ritmo);
	const props = {quem, pose, t, ritmo, vira, ox, oy, expr, fala, costas, sd};
	return (
		<g transform={`translate(${x} ${y}) scale(${k * dir} ${k})`} opacity={op}>
			{sombra > 0 && <ellipse cx={8} cy={4} rx={70} ry={14} fill="#000" opacity={sombra} />}
			<g transform={`translate(0 ${a.bob}) rotate(${a.incl})`}>
				{rim && (
					<g transform={`translate(${rimDx} -3)`} opacity={0.9}>
						<Corpo {...props} mono={rim} />
					</g>
				)}
				{silhueta ? <Corpo {...props} mono={silhueta} /> : <Corpo {...props} />}
			</g>
		</g>
	);
};

// Close (cabeça + ombros). Usado nos planos fechados de Lia e no CTA.
export const Busto: React.FC<{quem: Quem; x: number; y: number; esc: number; t: number; vira?: number; ox?: number; oy?: number; expr?: Expr; fala?: number; rim?: string; resp?: number; inclina?: number}> = ({
	quem,
	x,
	y,
	esc,
	t,
	vira = 0,
	ox = 0,
	oy = 0,
	expr = 'neutro',
	fala = 0,
	rim,
	resp = 1,
	inclina = 0,
}) => {
	const v = VISUAL[quem];
	const r = Math.sin(t * 1.5) * 1.2 * resp;
	const ombros = (cor?: string) => (
		<g>
			<path d="M-118,150 C-110,86 -70,62 -22,56 L22,56 C70,62 110,86 118,150 L118,190 L-118,190 Z" fill={cor ?? v.roupa} />
			{!cor && quem === 'lia' && (
				<g>
					<path d="M-22,56 L0,104 L22,56 Z" fill={v.roupa2} />
					<path d="M-26,54 L-6,106 L-20,150 M26,54 L6,106 L20,150" stroke="#8a3f27" strokeWidth={4} fill="none" />
					<path d="M-74,74 L-62,190 M74,74 L62,190" stroke="#1c2629" strokeWidth={14} strokeLinecap="round" />
				</g>
			)}
			{!cor && <path d="M-118,150 C-110,86 -70,62 -22,56 L22,56 C70,62 110,86 118,150 L118,190 L-118,190 Z" fill={vira >= 0 ? 'url(#somE)' : 'url(#somD)'} />}
			<rect x={-12} y={24} width={24} height={40} fill={cor ?? v.peleS} />
		</g>
	);
	return (
		<g transform={`translate(${x} ${y + r}) scale(${esc}) rotate(${inclina})`}>
			{rim && (
				<g transform="translate(3 -2)">
					{ombros(rim)}
					<Cabeca quem={quem} vira={vira} mono={rim} t={t} />
				</g>
			)}
			{ombros()}
			<Cabeca quem={quem} vira={vira} ox={ox} oy={oy} expr={expr} t={t} fala={fala} />
		</g>
	);
};

// Mão em close (segurando algo / apertando botão). Ponta do dedo indicador em (0,0) quando aponta.
export const Mao: React.FC<{x: number; y: number; esc: number; rot?: number; pele?: string; aponta?: boolean; manga?: string}> = ({x, y, esc, rot = 0, pele = VISUAL.lia.pele, aponta = false, manga = VISUAL.lia.roupa}) => (
	<g transform={`translate(${x} ${y}) rotate(${rot}) scale(${esc})`}>
		<rect x={-34} y={86} width={68} height={140} rx={18} fill={manga} />
		<rect x={-34} y={86} width={68} height={140} rx={18} fill="url(#somE)" />
		<path d="M-30,96 C-34,60 -30,40 -22,30 L22,30 C30,40 34,60 30,96 Z" fill={pele} />
		{aponta ? (
			<g>
				{/* indicador esticado com unha e dobras */}
				<path d="M-9,4 C-9,-4 9,-4 9,4 L11,40 L-11,40 Z" fill={pele} />
				<ellipse cx={0} cy={4} rx={6} ry={5} fill="#ecc9b2" />
				<path d="M-7,18 q7,3 14,0 M-8,30 q8,3 16,0" stroke={VISUAL.lia.peleS} strokeWidth={1.6} fill="none" />
				{/* três dedos dobrados (nós dos dedos) */}
				{[0, 1, 2].map((i) => (
					<g key={i}>
						<ellipse cx={18 + i * 4} cy={44 + i * 13} rx={15} ry={9} fill={pele} />
						<path d={`M${8 + i * 4},${42 + i * 13} q10,-6 20,0`} stroke={VISUAL.lia.peleS} strokeWidth={1.6} fill="none" />
					</g>
				))}
				{/* polegar encostado de lado */}
				<path d="M-22,62 C-34,52 -34,38 -26,34 C-18,32 -12,42 -10,54 Z" fill={pele} />
				<path d="M-28,40 q4,-2 7,1" stroke="#ecc9b2" strokeWidth={3} fill="none" />
			</g>
		) : (
			[-21, -7, 7, 21].map((fx, i) => <rect key={i} x={fx - 6.5} y={2 + Math.abs(i - 1.5) * 5} width={13} height={42} rx={6.5} fill={pele} />)
		)}
		{!aponta && <path d="M-30,70 C-46,60 -50,44 -44,36 C-38,32 -30,40 -26,52 Z" fill={pele} />}
		<path d="M-30,96 C-34,60 -30,40 -22,30 L22,30 C30,40 34,60 30,96 Z" fill="url(#somE)" />
	</g>
);

export const fala = (s: number, a: number, b: number) => (s > a && s < b ? L(Math.abs(Math.sin(s * 17)) * 1.2) * 0.8 : 0);
export const passo = (s: number, a: number, b: number, x0: number, x1: number) => lerp(x0, x1, L((s - a) / (b - a)));
