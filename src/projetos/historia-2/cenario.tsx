// historia-2 · cenário da Ilha do Boto Branco: céu, mar, farol, vila, píer, barcos, chuva, névoa, relâmpago, poeira.
// Um mundo só: o mesmo farol (torre branca com faixas vermelhas na ponta rochosa), a mesma vila de casas coloridas
// desbotadas e o mesmo píer com a placa reaparecem em todos os planos.
import React from 'react';
import {AMBAR, BRANCO, H, L, W, lerp, rnd, ruido, Txt} from './util';
import {anton, poppins, spaceMono} from '../../motor/tema';

// ---------------------------------------------------------------- céu
export type TipoCeu = 'noite' | 'tempestade' | 'manha' | 'amanhecer';
const CEUS: Record<TipoCeu, [string, string, string]> = {
	noite: ['#03080f', '#0a2230', '#1a4652'],
	tempestade: ['#020509', '#0a1a24', '#183844'],
	manha: ['#5d6b74', '#8c9aa0', '#b8c0bf'],
	amanhecer: ['#1d2a44', '#b0607a', '#f2a66a'],
};
export const Ceu: React.FC<{tipo: TipoCeu; h?: number; clarao?: number}> = ({tipo, h = H, clarao = 0}) => {
	const [a, b, c] = CEUS[tipo];
	const id = `ceu-${tipo}`;
	return (
		<g>
			<defs>
				<linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor={a} />
					<stop offset="0.6" stopColor={b} />
					<stop offset="1" stopColor={c} />
				</linearGradient>
			</defs>
			<rect x={-400} y={-400} width={W + 800} height={h + 400} fill={`url(#${id})`} />
			{clarao > 0 && <rect x={-400} y={-400} width={W + 800} height={h + 400} fill="#cfe6ff" opacity={clarao * 0.55} />}
		</g>
	);
};

export const Estrelas: React.FC<{s: number; n?: number; h?: number; op?: number}> = ({s, n = 60, h = 800, op = 1}) => (
	<g opacity={op}>
		{Array.from({length: n}).map((_, i) => (
			<circle key={i} cx={rnd(i, 1) * (W + 400) - 200} cy={rnd(i, 2) * h - 200} r={0.8 + rnd(i, 3) * 1.6} fill="#cfe3f0" opacity={0.2 + 0.6 * Math.abs(Math.sin(s * (0.6 + rnd(i, 4) * 1.8) + i))} />
		))}
	</g>
);

export const Lua: React.FC<{x: number; y: number; r?: number; op?: number}> = ({x, y, r = 56, op = 1}) => (
	<g opacity={op}>
		<circle cx={x} cy={y} r={r * 4} fill="url(#glowBranco)" opacity={0.35} />
		<circle cx={x} cy={y} r={r} fill="#e6eef2" opacity={0.9} />
		<circle cx={x - r * 0.3} cy={y - r * 0.2} r={r * 0.2} fill="#c6d3da" opacity={0.7} />
		<circle cx={x + r * 0.3} cy={y + r * 0.3} r={r * 0.14} fill="#c6d3da" opacity={0.7} />
	</g>
);

// Nuvens em massa: elipses agrupadas com um blur só (o grupo inteiro), deriva lenta.
export const Nuvens: React.FC<{s: number; y: number; cor: string; n?: number; sd?: number; vel?: number; esc?: number; op?: number; luz?: string; luzOp?: number}> = ({s, y, cor, n = 7, sd = 0, vel = 6, esc = 1, op = 1, luz, luzOp = 0}) => {
	const larg = W + 1200;
	return (
		<g opacity={op} filter="url(#bl3)">
			{Array.from({length: n}).map((_, i) => {
				const x = ((rnd(i, sd + 1) * larg + s * vel * (0.6 + rnd(i, sd + 2) * 0.8)) % larg) - 600;
				const yy = y + (rnd(i, sd + 3) - 0.5) * 160 * esc;
				const rx = (160 + rnd(i, sd + 4) * 220) * esc;
				const ry = (50 + rnd(i, sd + 5) * 50) * esc;
				return (
					<g key={i}>
						<ellipse cx={x} cy={yy} rx={rx} ry={ry} fill={cor} />
						<ellipse cx={x - rx * 0.4} cy={yy - ry * 0.5} rx={rx * 0.5} ry={ry * 0.8} fill={cor} />
						<ellipse cx={x + rx * 0.35} cy={yy - ry * 0.3} rx={rx * 0.45} ry={ry * 0.9} fill={cor} />
						{luz && <ellipse cx={x} cy={yy - ry * 0.4} rx={rx * 0.7} ry={ry * 0.5} fill={luz} opacity={luzOp} />}
					</g>
				);
			})}
		</g>
	);
};

// ---------------------------------------------------------------- relâmpago
// Intensidade de relâmpagos em instantes fixos (lista de segundos). Dupla piscada, decaimento rápido.
export const relampago = (s: number, ts: number[]) => {
	let v = 0;
	for (const t of ts) {
		const d = s - t;
		if (d >= 0 && d < 0.5) v = Math.max(v, Math.exp(-d * 14) + (d > 0.09 ? Math.exp(-(d - 0.09) * 18) * 0.7 : 0));
	}
	return Math.min(1, v);
};
export const Raio: React.FC<{x: number; y: number; h: number; sd: number; op: number}> = ({x, y, h, sd, op}) => {
	if (op < 0.02) return null;
	const pts: string[] = [];
	let cx = x;
	for (let i = 0; i <= 9; i++) {
		pts.push(`${cx},${y + (h * i) / 9}`);
		cx += (rnd(i, sd) - 0.5) * 70;
	}
	return (
		<g opacity={op}>
			<polyline points={pts.join(' ')} fill="none" stroke="#bfe3ff" strokeWidth={14} opacity={0.35} filter="url(#bl2)" />
			<polyline points={pts.join(' ')} fill="none" stroke="#f4fbff" strokeWidth={3.5} />
		</g>
	);
};

// ---------------------------------------------------------------- mar
export const Mar: React.FC<{s: number; y0: number; h?: number; cor1?: string; cor2?: string; brilho?: string; refX?: number; refOp?: number; linhas?: number}> = ({
	s,
	y0,
	h = H,
	cor1 = '#0b2733',
	cor2 = '#04121a',
	brilho = '#7fb4c8',
	refX,
	refOp = 0,
	linhas = 14,
}) => (
	<g>
		<defs>
			<linearGradient id={`mar-${cor1}`} x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stopColor={cor1} />
				<stop offset="1" stopColor={cor2} />
			</linearGradient>
		</defs>
		<rect x={-400} y={y0} width={W + 800} height={h - y0 + 400} fill={`url(#mar-${cor1})`} />
		{/* coluna de reflexo (lua/farol) */}
		{refX !== undefined && refOp > 0 && (
			<g opacity={refOp}>
				{Array.from({length: 16}).map((_, i) => {
					const yy = y0 + 6 + i * i * 3.2;
					const w = 30 + i * 9 + Math.sin(s * 3 + i) * 12;
					return <rect key={i} x={refX - w / 2 + Math.sin(s * 2.2 + i * 1.7) * 10} y={yy} width={w} height={3 + i * 0.4} rx={2} fill={brilho} opacity={0.55 - i * 0.025} />;
				})}
			</g>
		)}
		{/* ondas em perspectiva: linhas mais próximas e lentas no horizonte, mais largas e rápidas perto */}
		{Array.from({length: linhas}).map((_, k) => {
			const f = k / linhas;
			const y = y0 + Math.pow(f, 1.7) * (h - y0 + 200) + 6;
			const amp = 2 + f * 16;
			const n = 24;
			const pts = Array.from({length: n + 1}).map((_, i) => `${-400 + (i * (W + 800)) / n},${y + Math.sin(i * (1.6 - f) + s * (0.8 + f * 1.6) + k * 1.3) * amp}`);
			return <polyline key={k} points={pts.join(' ')} fill="none" stroke={brilho} strokeOpacity={0.07 + f * 0.12} strokeWidth={1.5 + f * 4} />;
		})}
	</g>
);

// ---------------------------------------------------------------- farol
// Base do farol em (x,y); altura ~620*esc. luz 0..1. O feixe é desenhado à parte (Feixe) para ficar por cima da névoa.
export const Farol: React.FC<{x: number; y: number; esc?: number; luz: number; clarao?: number}> = ({x, y, esc = 1, luz, clarao = 0}) => (
	<g transform={`translate(${x} ${y}) scale(${esc})`}>
		{/* casa do faroleiro junto à base */}
		<rect x={-150} y={-90} width={110} height={90} fill="#c9c1ad" />
		<polygon points="-160,-90 -95,-138 -30,-90" fill="#8a3a2a" />
		<rect x={-128} y={-62} width={26} height={30} fill={AMBAR} opacity={0.25 + 0.6 * luz} />
		<rect x={-80} y={-62} width={26} height={30} fill="#1b2430" />
		{/* torre */}
		<polygon points="-60,0 60,0 40,-520 -40,-520" fill="#e7e1d2" />
		<polygon points="-60,0 60,0 40,-520 -40,-520" fill="url(#somD)" />
		<polygon points="-55.4,-120 55.4,-120 51.5,-190 -51.5,-190" fill="#b5332b" />
		<polygon points="-48.5,-280 48.5,-280 44.6,-350 -44.6,-350" fill="#b5332b" />
		<polygon points="-42,-440 42,-440 41,-470 -41,-470" fill="#b5332b" />
		{/* janelinhas da escada */}
		{[-80, -230, -390].map((yy, i) => (
			<rect key={i} x={-7} y={yy} width={14} height={24} rx={7} fill={i === 1 ? '#1b2430' : AMBAR} opacity={i === 1 ? 1 : 0.2 + 0.6 * luz} />
		))}
		{/* galeria */}
		<rect x={-62} y={-532} width={124} height={14} fill="#28323d" />
		{Array.from({length: 9}).map((_, i) => (
			<line key={i} x1={-58 + i * 14.5} y1={-532} x2={-58 + i * 14.5} y2={-556} stroke="#28323d" strokeWidth={3} />
		))}
		<rect x={-62} y={-560} width={124} height={5} fill="#28323d" />
		{/* sala da lente */}
		<rect x={-32} y={-618} width={64} height={86} fill="#18212b" />
		<rect x={-26} y={-610} width={52} height={70} fill={AMBAR} opacity={0.12 + 0.88 * luz} />
		<rect x={-26} y={-610} width={52} height={70} fill="#fff" opacity={clarao * 0.6} />
		{[-9, 9].map((xx) => (
			<line key={xx} x1={xx} y1={-610} x2={xx} y2={-540} stroke="#18212b" strokeWidth={3} />
		))}
		<polygon points="-40,-618 40,-618 0,-664" fill="#9e2c25" />
		<rect x={-3} y={-690} width={6} height={28} fill="#28323d" />
		<circle cx={0} cy={-575} r={130} fill="url(#glowAmbar)" opacity={0.85 * luz} />
	</g>
);

// Feixe giratório visto de longe. origem (x,y), ang em radianos (gira com o tempo). comp = alcance.
export const Feixe: React.FC<{x: number; y: number; ang: number; comp?: number; larg?: number; op?: number}> = ({x, y, ang, comp = 1300, larg = 120, op = 1}) => {
	const dir = Math.cos(ang);
	const c = Math.abs(dir) * comp + 60;
	const sentido = dir >= 0 ? 1 : -1;
	const ab = larg * (0.5 + 0.5 * (1 - Math.abs(dir)));
	const intens = op * (0.35 + 0.65 * Math.pow(Math.abs(Math.sin(ang * 0.5 + 0.8)), 0.3));
	if (op < 0.01) return null;
	return (
		<g transform={`translate(${x} ${y}) scale(${sentido} 1)`} opacity={intens}>
			<polygon points={`0,-6 ${c},${-ab - c * 0.04} ${c},${ab + c * 0.04} 0,6`} fill="url(#feixe)" filter="url(#bl2)" />
			<polygon points={`0,-3 ${c * 0.7},${-ab * 0.35} ${c * 0.7},${ab * 0.35} 0,3`} fill="url(#feixe)" opacity={0.8} />
		</g>
	);
};

// ---------------------------------------------------------------- vila
export const CORES_CASA = ['#6f93a8', '#c48a84', '#d6b866', '#7fae9c', '#d9d2c2', '#9c7fb0', '#d08a5a'];
export const Casa: React.FC<{x: number; y: number; esc?: number; cor: string; acesa?: number; s: number; i: number; larg?: number; alt?: number; fumaca?: boolean; noite?: boolean; porta?: string}> = ({
	x,
	y,
	esc = 1,
	cor,
	acesa = 1,
	s,
	i,
	larg = 150,
	alt = 120,
	fumaca = false,
	noite = true,
	porta = '#3d5a4a',
}) => {
	const pisca = 0.82 + 0.18 * Math.sin(s * (2 + rnd(i, 9)) + i * 2) * rnd(i, 8);
	const luz = acesa * pisca;
	const w = larg / 2;
	return (
		<g transform={`translate(${x} ${y}) scale(${esc})`}>
			{fumaca && <Fumaca x={w * 0.5} y={-alt - 70} s={s} sd={i} />}
			<rect x={w * 0.35} y={-alt - 60} width={18} height={40} fill="#6b5a4c" />
			<rect x={-w} y={-alt} width={larg} height={alt} fill={cor} />
			{noite && <rect x={-w} y={-alt} width={larg} height={alt} fill="#08141e" opacity={0.55} />}
			<rect x={-w} y={-alt} width={larg} height={alt} fill="url(#somD)" />
			{/* manchas de umidade */}
			<rect x={-w} y={-18} width={larg} height={18} fill="#000" opacity={0.18} />
			<polygon points={`${-w - 14},${-alt} 0,${-alt - 58} ${w + 14},${-alt}`} fill="#8a3e2c" />
			<polygon points={`${-w - 14},${-alt} 0,${-alt - 58} ${w + 14},${-alt}`} fill="#000" opacity={noite ? 0.45 : 0.1} />
			{Array.from({length: 4}).map((_, k) => (
				<line key={k} x1={-w + 10} y1={-alt - 10 - k * 12} x2={w - 10} y2={-alt - 10 - k * 12} stroke="#5a2a1e" strokeWidth={2} opacity={0.5 * (1 - k * 0.2)} transform={`scale(${1 - k * 0.22} 1)`} />
			))}
			{/* porta e janelas com venezianas */}
			<rect x={-14} y={-62} width={28} height={62} fill={porta} />
			{[-1, 1].map((lado) => (
				<g key={lado}>
					<rect x={lado * w * 0.55 - 15} y={-alt + 26} width={30} height={34} fill={AMBAR} opacity={0.15 + 0.85 * luz * (rnd(i * 3 + lado, 5) > 0.25 ? 1 : 0.15)} />
					<rect x={lado * w * 0.55 - 26} y={-alt + 24} width={10} height={38} fill={porta} />
					<rect x={lado * w * 0.55 + 16} y={-alt + 24} width={10} height={38} fill={porta} />
				</g>
			))}
			{noite && luz > 0.1 && <circle cx={0} cy={-alt + 40} r={larg * 0.8} fill="url(#glowAmbar)" opacity={0.18 * luz} />}
		</g>
	);
};

export const Fumaca: React.FC<{x: number; y: number; s: number; sd?: number; cor?: string; op?: number}> = ({x, y, s, sd = 0, cor = '#8fa6b0', op = 0.35}) => (
	<g filter="url(#bl2)" opacity={op}>
		{Array.from({length: 7}).map((_, k) => {
			const f = ((s * 0.35 + k / 7 + rnd(sd, 3)) % 1 + 1) % 1;
			return <circle key={k} cx={x + Math.sin(f * 5 + sd) * 16 + f * 40} cy={y - f * 180} r={10 + f * 34} fill={cor} opacity={(1 - f) * 0.9} />;
		})}
	</g>
);

export const Igreja: React.FC<{x: number; y: number; esc?: number; s: number; noite?: boolean; relogio?: React.ReactNode}> = ({x, y, esc = 1, noite = true, relogio}) => (
	<g transform={`translate(${x} ${y}) scale(${esc})`}>
		<rect x={-130} y={-220} width={260} height={220} fill="#e4ddcc" />
		<polygon points="-146,-220 0,-300 146,-220" fill="#d8d0bd" />
		<rect x={-50} y={-470} width={100} height={260} fill="#ece6d6" />
		<polygon points="-62,-470 0,-560 62,-470" fill="#8a3e2c" />
		<line x1={0} y1={-560} x2={0} y2={-610} stroke="#3a3a3a" strokeWidth={5} />
		<line x1={-16} y1={-594} x2={16} y2={-594} stroke="#3a3a3a" strokeWidth={5} />
		<rect x={-26} y={-300} width={52} height={70} rx={26} fill="#2a3440" />
		<rect x={-34} y={-110} width={68} height={110} rx={34} fill="#4a3424" />
		{[-90, 90].map((xx) => (
			<rect key={xx} x={xx - 14} y={-170} width={28} height={60} rx={14} fill="#2a3440" />
		))}
		{noite && <rect x={-130} y={-560} width={260} height={560} fill="#08141e" opacity={0.5} />}
		<rect x={-130} y={-220} width={260} height={220} fill="url(#somD)" />
		<g transform="translate(0 -390)">{relogio}</g>
	</g>
);

// ---------------------------------------------------------------- píer, barcos, placa
export const Pier: React.FC<{x0: number; x1: number; y: number; esc?: number; tabuas?: number; cor?: string}> = ({x0, x1, y, esc = 1, tabuas = 18, cor = '#5a4232'}) => (
	<g>
		{Array.from({length: Math.ceil((x1 - x0) / (90 * esc)) + 1}).map((_, i) => (
			<rect key={i} x={x0 + i * 90 * esc - 6 * esc} y={y} width={12 * esc} height={120 * esc} fill="#2e221a" />
		))}
		<rect x={x0} y={y - 14 * esc} width={x1 - x0} height={18 * esc} fill={cor} />
		<rect x={x0} y={y - 14 * esc} width={x1 - x0} height={5 * esc} fill="#8a6a50" opacity={0.6} />
		{Array.from({length: tabuas}).map((_, i) => (
			<line key={i} x1={x0 + ((i + 0.5) * (x1 - x0)) / tabuas} y1={y - 14 * esc} x2={x0 + ((i + 0.5) * (x1 - x0)) / tabuas} y2={y + 4 * esc} stroke="#2e221a" strokeWidth={2} />
		))}
	</g>
);

export const Barco: React.FC<{x: number; y: number; esc?: number; cor: string; cor2?: string; s: number; i: number; nome?: string; luz?: number}> = ({x, y, esc = 1, cor, cor2 = '#e8e2d2', s, i, nome, luz = 0}) => {
	const bal = Math.sin(s * 1.4 + i * 2) * 3;
	const y2 = y + Math.sin(s * 1.1 + i) * 4;
	return (
		<g transform={`translate(${x} ${y2}) rotate(${bal}) scale(${esc})`}>
			<path d="M-120,-30 L120,-30 Q110,10 70,22 L-80,22 Q-112,8 -120,-30 Z" fill={cor} />
			<path d="M-120,-30 L120,-30 L116,-20 L-117,-20 Z" fill={cor2} />
			<path d="M-120,-30 L120,-30 Q110,10 70,22 L-80,22 Q-112,8 -120,-30 Z" fill="url(#somB)" />
			<rect x={-30} y={-78} width={60} height={48} fill={cor2} />
			<rect x={-22} y={-70} width={18} height={16} fill={luz > 0 ? AMBAR : '#26323c'} opacity={luz > 0 ? 0.5 + 0.5 * luz : 1} />
			<rect x={4} y={-70} width={18} height={16} fill="#26323c" />
			<polygon points="-36,-78 36,-78 30,-90 -30,-90" fill="#8a3e2c" />
			<line x1={60} y1={-30} x2={60} y2={-170} stroke="#3a2c22" strokeWidth={5} />
			<line x1={60} y1={-170} x2={-100} y2={-32} stroke="#3a2c22" strokeWidth={1.5} opacity={0.7} />
			<line x1={60} y1={-160} x2={118} y2={-32} stroke="#3a2c22" strokeWidth={1.5} opacity={0.7} />
			{nome && (
				<text x={-60} y={2} fontFamily={poppins} fontWeight={800} fontSize={17} fill={cor2} letterSpacing={1}>
					{nome}
				</text>
			)}
			<ellipse cx={0} cy={26} rx={130} ry={8} fill="#000" opacity={0.35} />
		</g>
	);
};

export const Balsa: React.FC<{x: number; y: number; esc?: number; s: number; luz?: number}> = ({x, y, esc = 1, s, luz = 1}) => (
	<g transform={`translate(${x} ${y + Math.sin(s * 1.3) * 4}) rotate(${Math.sin(s * 0.9) * 1.2}) scale(${esc})`}>
		<path d="M-260,-20 L260,-20 L230,30 L-230,30 Z" fill="#d8d2c2" />
		<rect x={-260} y={-20} width={520} height={12} fill="#b5332b" />
		<path d="M-260,-20 L260,-20 L230,30 L-230,30 Z" fill="url(#somB)" />
		<rect x={-80} y={-110} width={190} height={90} fill="#e9e3d3" />
		<rect x={-60} y={-160} width={120} height={50} fill="#e9e3d3" />
		{Array.from({length: 5}).map((_, k) => (
			<rect key={k} x={-70 + k * 36} y={-90} width={24} height={26} fill={AMBAR} opacity={0.25 + 0.7 * luz * (k === 2 ? 0.4 : 1)} />
		))}
		<rect x={-44} y={-150} width={88} height={22} fill="#26323c" />
		<rect x={30} y={-210} width={22} height={52} fill="#b5332b" />
		<circle cx={41} cy={-214} r={7} fill={AMBAR} opacity={0.5 + 0.5 * Math.abs(Math.sin(s * 3))} />
		<text x={-210} y={18} fontFamily={poppins} fontWeight={800} fontSize={24} fill="#5a2a22" letterSpacing={3}>
			BALSA BOTO BRANCO
		</text>
		<ellipse cx={0} cy={36} rx={280} ry={12} fill="#000" opacity={0.35} />
		{/* esteira */}
		{Array.from({length: 5}).map((_, k) => (
			<path key={k} d={`M${-250 - k * 60},${30 + k * 3} q-30,${4 + k} -60,0`} stroke="#cfe3ea" strokeWidth={3} fill="none" opacity={0.4 - k * 0.07} />
		))}
	</g>
);

// Placa de madeira pregada em dois postes (texto integrado ao cenário).
export const Placa: React.FC<{x: number; y: number; esc?: number; linhas: string[]; rot?: number; luz?: number; velha?: number; size?: number}> = ({x, y, esc = 1, linhas, rot = 0, luz = 1, velha = 0, size = 64}) => (
	<g transform={`translate(${x} ${y}) rotate(${rot}) scale(${esc})`}>
		<rect x={-250} y={-30} width={22} height={260} fill="#3a2a1e" />
		<rect x={228} y={-30} width={22} height={260} fill="#3a2a1e" />
		<rect x={-300} y={-170} width={600} height={190} rx={8} fill="#6e4f36" />
		{[0, 1, 2].map((k) => (
			<line key={k} x1={-300} y1={-170 + 63 * (k + 1)} x2={300} y2={-170 + 63 * (k + 1)} stroke="#4a3424" strokeWidth={3} />
		))}
		{Array.from({length: 14}).map((_, k) => (
			<path key={k} d={`M${-290 + rnd(k, 31) * 560},${-165 + rnd(k, 32) * 180} q${20 + rnd(k, 33) * 40},${rnd(k, 34) * 6 - 3} ${60 + rnd(k, 35) * 60},0`} stroke="#4a3424" strokeWidth={1.5} fill="none" opacity={0.7} />
		))}
		<rect x={-300} y={-170} width={600} height={190} rx={8} fill="url(#somB)" />
		{[-280, 280].map((xx) => [-150, 0].map((yy) => <circle key={`${xx}${yy}`} cx={xx} cy={yy} r={5} fill="#2a1e14" />))}
		{linhas.map((t, i) => (
			<text key={i} x={0} y={-170 + (190 / (linhas.length + 1)) * (i + 1) + size * 0.35} textAnchor="middle" fontFamily={anton} fontSize={i === 0 && linhas.length > 1 ? size * 0.6 : size} letterSpacing={4} fill="#efe2c4" opacity={0.92 - velha * 0.35}>
				{t}
			</text>
		))}
		<rect x={-300} y={-170} width={600} height={190} rx={8} fill={AMBAR} opacity={0.12 * luz} />
	</g>
);

// ---------------------------------------------------------------- clima e partículas
export const Chuva: React.FC<{s: number; n?: number; ang?: number; comp?: number; vel?: number; op?: number; sd?: number; cor?: string; esp?: number; area?: [number, number, number, number]}> = ({
	s,
	n = 140,
	ang = 0.18,
	comp = 46,
	vel = 1900,
	op = 0.5,
	sd = 0,
	cor = '#bcd6e2',
	esp = 2,
	area = [-200, -200, W + 400, H + 400],
}) => {
	const [ax, ay, aw, ah] = area;
	return (
		<g opacity={op} stroke={cor} strokeWidth={esp} strokeLinecap="round">
			{Array.from({length: n}).map((_, i) => {
				const v = vel * (0.75 + rnd(i, sd + 2) * 0.5);
				const y = ay + (((rnd(i, sd + 1) * ah + s * v) % ah) + ah) % ah;
				const x = ax + rnd(i, sd + 3) * aw - (y - ay) * ang;
				return <line key={i} x1={x} y1={y} x2={x - comp * ang} y2={y - comp} opacity={0.4 + rnd(i, sd + 4) * 0.6} />;
			})}
		</g>
	);
};

export const Nevoa: React.FC<{s: number; y: number; op?: number; cor?: string; n?: number; sd?: number; vel?: number; alt?: number}> = ({s, y, op = 0.25, cor = '#9fc1d1', n = 5, sd = 0, vel = 14, alt = 90}) => {
	const larg = W + 1400;
	return (
		<g filter="url(#bl4)" opacity={op}>
			{Array.from({length: n}).map((_, k) => (
				<ellipse key={k} cx={((rnd(k, sd + 1) * larg + s * vel * (0.7 + rnd(k, sd + 2) * 0.6)) % larg) - 700} cy={y + (rnd(k, sd + 3) - 0.5) * alt} rx={360 + rnd(k, sd + 4) * 240} ry={alt * 0.7} fill={cor} />
			))}
		</g>
	);
};

export const Poeira: React.FC<{s: number; area: [number, number, number, number]; n?: number; cor?: string; op?: number; sd?: number}> = ({s, area, n = 40, cor = '#ffe6b0', op = 0.7, sd = 0}) => {
	const [ax, ay, aw, ah] = area;
	return (
		<g opacity={op}>
			{Array.from({length: n}).map((_, i) => {
				const x = ax + ((rnd(i, sd + 1) * aw + Math.sin(s * 0.4 + i) * 30 + s * 8) % aw);
				const y = ay + ((rnd(i, sd + 2) * ah - s * (6 + rnd(i, sd + 3) * 10)) % ah + ah) % ah;
				return <circle key={i} cx={x} cy={y} r={1 + rnd(i, sd + 4) * 2.2} fill={cor} opacity={0.3 + 0.7 * Math.abs(Math.sin(s * 1.3 + i))} />;
			})}
		</g>
	);
};

export const Rochas: React.FC<{x: number; y: number; esc?: number; cor?: string; sd?: number; n?: number}> = ({x, y, esc = 1, cor = '#0a141b', sd = 0, n = 5}) => (
	<g transform={`translate(${x} ${y}) scale(${esc})`}>
		{Array.from({length: n}).map((_, i) => {
			const cx = (i - n / 2) * 140 + rnd(i, sd) * 60;
			const r = 90 + rnd(i, sd + 1) * 90;
			return <path key={i} d={`M${cx - r},40 Q${cx - r * 0.8},${-r * 0.7} ${cx - r * 0.1},${-r * 0.9} Q${cx + r * 0.7},${-r * 0.6} ${cx + r},40 Z`} fill={cor} />;
		})}
	</g>
);

// Capim de restinga balançando ao vento (primeiro plano).
export const Capim: React.FC<{x: number; y: number; s: number; n?: number; larg?: number; alt?: number; cor?: string; sd?: number}> = ({x, y, s, n = 40, larg = 500, alt = 220, cor = '#0b1a16', sd = 0}) => (
	<g>
		{Array.from({length: n}).map((_, i) => {
			const bx = x + rnd(i, sd) * larg;
			const h = alt * (0.5 + rnd(i, sd + 1) * 0.6);
			const vento = Math.sin(s * 1.8 + i * 0.6) * 18 + ruido(s * 0.8 + i, 5) * 10;
			return <path key={i} d={`M${bx - 5},${y} Q${bx + vento * 0.4},${y - h * 0.6} ${bx + vento},${y - h} Q${bx + vento * 0.3 + 2},${y - h * 0.55} ${bx + 5},${y} Z`} fill={cor} />;
		})}
	</g>
);

// ---------------------------------------------------------------- relógios
export const Relogio: React.FC<{cx: number; cy: number; r: number; hora: number; minuto: number; cor?: string; aro?: string; fundo?: string; numeros?: boolean; parado?: number}> = ({
	cx,
	cy,
	r,
	hora,
	minuto,
	cor = '#1a1a1a',
	aro = '#6b4a2e',
	fundo = '#efe6cf',
	numeros = false,
	parado = 0,
}) => {
	const ah = ((hora % 12) + minuto / 60) * 30;
	const am = minuto * 6;
	const pt = (ang: number, len: number) => [cx + Math.sin((ang * Math.PI) / 180) * len, cy - Math.cos((ang * Math.PI) / 180) * len];
	const [hx, hy] = pt(ah, r * 0.5);
	const [mx, my] = pt(am, r * 0.78);
	return (
		<g>
			<circle cx={cx + r * 0.06} cy={cy + r * 0.08} r={r * 1.08} fill="#000" opacity={0.35} />
			<circle cx={cx} cy={cy} r={r * 1.08} fill={aro} />
			<circle cx={cx} cy={cy} r={r} fill={fundo} />
			<circle cx={cx} cy={cy} r={r} fill="url(#somB)" opacity={0.6} />
			{Array.from({length: 12}).map((_, i) => {
				const [x1, y1] = pt(i * 30, r * 0.82);
				const [x2, y2] = pt(i * 30, r * 0.93);
				return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={cor} strokeWidth={r * (i % 3 === 0 ? 0.05 : 0.025)} strokeLinecap="round" />;
			})}
			{numeros &&
				[12, 3, 6, 9].map((n, i) => {
					const [x, y] = pt(i * 90, r * 0.66);
					return (
						<text key={n} x={x} y={y + r * 0.08} textAnchor="middle" fontFamily={anton} fontSize={r * 0.24} fill={cor}>
							{n}
						</text>
					);
				})}
			<line x1={cx} y1={cy} x2={hx} y2={hy} stroke={cor} strokeWidth={r * 0.08} strokeLinecap="round" />
			<line x1={cx} y1={cy} x2={mx} y2={my} stroke={parado > 0 ? lerpCor(parado) : cor} strokeWidth={r * 0.05} strokeLinecap="round" />
			<circle cx={cx} cy={cy} r={r * 0.07} fill={aro} />
			<ellipse cx={cx - r * 0.3} cy={cy - r * 0.45} rx={r * 0.45} ry={r * 0.18} fill="#fff" opacity={0.18} transform={`rotate(-25 ${cx} ${cy})`} />
		</g>
	);
};
const lerpCor = (k: number) => (k > 0.5 ? '#c0221a' : '#1a1a1a');

// Mostrador digital (rádio-relógio): dígitos de LED vermelho.
export const Digital: React.FC<{x: number; y: number; texto: string; size?: number; cor?: string; op?: number}> = ({x, y, texto, size = 120, cor = '#ff3b30', op = 1}) => (
	<g opacity={op}>
		<text x={x} y={y} textAnchor="middle" fontFamily={spaceMono} fontWeight={700} fontSize={size} fill={cor} opacity={0.12} letterSpacing={4}>
			88:88
		</text>
		<text x={x} y={y} textAnchor="middle" fontFamily={spaceMono} fontWeight={700} fontSize={size} fill={cor} letterSpacing={4} style={{filter: `drop-shadow(0 0 12px ${cor})`}}>
			{texto}
		</text>
	</g>
);

// ---------------------------------------------------------------- acabamento de filme
export const Grao: React.FC<{frame: number; op?: number}> = ({frame, op = 1}) => (
	<g opacity={op}>
		{Array.from({length: 90}).map((_, i) => (
			<rect key={i} x={rnd(i, frame) * W} y={rnd(i, frame + 0.5) * H} width={2 + rnd(i, frame + 0.7) * 3} height={2} fill={rnd(i, frame + 0.9) > 0.5 ? '#fff' : '#000'} opacity={0.06 + 0.08 * rnd(i, frame + 0.3)} />
		))}
		{rnd(frame, 77) > 0.7 && <rect x={rnd(frame, 78) * W} y={0} width={1.5} height={H} fill="#fff" opacity={0.05} />}
	</g>
);

export const Vinheta: React.FC<{op?: number}> = ({op = 1}) => <rect width={W} height={H} fill="url(#vinheta)" opacity={op} />;

// Barras de cinema (letterbox) sutis no topo e na base.
export const Faixas: React.FC<{k?: number}> = ({k = 1}) => (
	<g>
		<rect x={0} y={0} width={W} height={60 * k} fill="#000" />
		<rect x={0} y={H - 60 * k} width={W} height={60 * k} fill="#000" />
	</g>
);

export {BRANCO, Txt, L};
