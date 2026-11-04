// historia-2 · "O Apagão de Corvo Branco" (Ilha do Boto Branco), parte 1. Mistério 100% em motion 2D (SVG), uma peça só:
// o cenário (ilha, farol, névoa) é contínuo e cada plano é uma camada ligada às palavras da narração (tempos exatos).
// Sem WebGL. Tela vertical 1080x1920; o que fica abaixo de y≈1330 é da legenda (menos no CTA final, onde ela some).
import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import type {Busca} from '../../motor/palavras';
import type {Cena, Som} from '../../motor/plano';
import type {CenaPeca} from '../../pecas/peca';
import {anton, poppins, spaceMono} from '../../motor/tema';

const W = 1080;
const H = 1920;
const AMBAR = '#ffc34a';
const ROSA = '#ff4fa3';
const VERM = '#ff3b30';
const BRANCO = '#f3efe4';
const AZUL = '#0b1d2e';

// ---------------------------------------------------------------- utilidades
const L = (v: number) => Math.max(0, Math.min(1, v));
const eo = (x: number) => 1 - Math.pow(1 - L(x), 3);
const eb = (x: number) => {
	const t = L(x);
	const c1 = 1.70158;
	const c3 = c1 + 1;
	return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const pop = (s: number, t0: number, d = 0.35) => eb((s - t0) / d);
const entra = (s: number, t0: number, d = 0.25) => eo((s - t0) / d);
// Visível entre a e b, com entrada e saída suaves.
const vis = (s: number, a: number, b: number, f = 0.18) => L((s - a) / f) * L((b - s) / f);
const rnd = (i: number, sd = 0) => {
	const x = Math.sin(i * 127.1 + sd * 311.7) * 43758.5453;
	return x - Math.floor(x);
};
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
type D = Record<string, number>;
type Palavra = {t: number; txt: string};

// ---------------------------------------------------------------- texto
const Txt: React.FC<{x: number; y: number; children: React.ReactNode; size?: number; fill?: string; font?: string; weight?: number; ls?: number; anchor?: 'start' | 'middle' | 'end'; op?: number; rot?: number; sc?: number; glow?: string}> = ({
	x,
	y,
	children,
	size = 60,
	fill = BRANCO,
	font = anton,
	weight = 400,
	ls = 2,
	anchor = 'middle',
	op = 1,
	rot = 0,
	sc = 1,
	glow,
}) => (
	<g transform={`translate(${x} ${y}) rotate(${rot}) scale(${sc})`} opacity={op}>
		<text
			textAnchor={anchor}
			fontFamily={font}
			fontWeight={weight}
			fontSize={size}
			letterSpacing={ls}
			fill={fill}
			style={glow ? {filter: `drop-shadow(0 0 18px ${glow})`} : undefined}
		>
			{children}
		</text>
	</g>
);

// Palavras que entram uma a uma no tempo da fala (quebra em linhas por contagem de palavras).
const Frase: React.FC<{s: number; palavras: Palavra[]; y: number; porLinha: number; size: number; cores?: Record<string, string>; fim: number; lh?: number; fill?: string}> = ({s, palavras, y, porLinha, size, cores = {}, fim, lh = 1.12, fill = BRANCO}) => {
	const linhas: Palavra[][] = [];
	palavras.forEach((p, i) => {
		if (i % porLinha === 0) linhas.push([]);
		linhas[linhas.length - 1].push(p);
	});
	const sai = L((fim - s) / 0.2);
	return (
		<g opacity={sai}>
			{linhas.map((ln, li) => {
				const larg = ln.map((p) => p.txt.length * size * 0.5 + size * 0.3);
				const total = larg.reduce((a, b) => a + b, 0);
				let x = W / 2 - total / 2;
				return (
					<g key={li}>
						{ln.map((p, wi) => {
							const w = larg[wi];
							const cx = x + w / 2;
							x += w;
							const k = pop(s, p.t, 0.3);
							const chave = p.txt.replace(/[^\p{L}]/gu, '').toLowerCase();
							return (
								<Txt key={wi} x={cx} y={y + li * size * lh + (1 - k) * 26} size={size} fill={cores[chave] ?? fill} op={s >= p.t ? L(k * 1.6) : 0} sc={0.7 + 0.3 * k} glow={cores[chave]}>
									{p.txt}
								</Txt>
							);
						})}
					</g>
				);
			})}
		</g>
	);
};

// ---------------------------------------------------------------- relógio
const Relogio: React.FC<{cx: number; cy: number; r: number; hora: number; minuto: number; cor?: string; aro?: string}> = ({cx, cy, r, hora, minuto, cor = BRANCO, aro = AMBAR}) => {
	const ah = ((hora % 12) + minuto / 60) * 30;
	const am = minuto * 6;
	const ponta = (ang: number, len: number) => [cx + Math.sin((ang * Math.PI) / 180) * len, cy - Math.cos((ang * Math.PI) / 180) * len];
	const [hx, hy] = ponta(ah, r * 0.5);
	const [mx, my] = ponta(am, r * 0.78);
	return (
		<g>
			<circle cx={cx} cy={cy} r={r} fill="#0d1620" stroke={aro} strokeWidth={r * 0.06} />
			{Array.from({length: 12}).map((_, i) => {
				const [x1, y1] = ponta(i * 30, r * 0.86);
				const [x2, y2] = ponta(i * 30, r * 0.95);
				return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={cor} strokeWidth={r * 0.035} strokeLinecap="round" />;
			})}
			<line x1={cx} y1={cy} x2={hx} y2={hy} stroke={cor} strokeWidth={r * 0.08} strokeLinecap="round" />
			<line x1={cx} y1={cy} x2={mx} y2={my} stroke={cor} strokeWidth={r * 0.05} strokeLinecap="round" />
			<circle cx={cx} cy={cy} r={r * 0.06} fill={aro} />
		</g>
	);
};

// ---------------------------------------------------------------- cenário: céu, mar, ilha, farol
const Fundo: React.FC<{s: number; luz: number}> = ({s, luz}) => (
	<g>
		<defs>
			<linearGradient id="ceu" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stopColor="#040910" />
				<stop offset="0.55" stopColor={AZUL} />
				<stop offset="1" stopColor="#12384a" />
			</linearGradient>
			<radialGradient id="lua" cx="0.5" cy="0.5" r="0.5">
				<stop offset="0" stopColor="#dfeaf2" stopOpacity="0.9" />
				<stop offset="1" stopColor="#dfeaf2" stopOpacity="0" />
			</radialGradient>
			<filter id="borrao" x="-20%" y="-20%" width="140%" height="140%">
				<feGaussianBlur stdDeviation="26" />
			</filter>
		</defs>
		<rect width={W} height={H} fill="url(#ceu)" />
		{Array.from({length: 46}).map((_, i) => (
			<circle key={i} cx={rnd(i, 1) * W} cy={rnd(i, 2) * 900} r={0.8 + rnd(i, 3) * 1.8} fill="#cfe3f0" opacity={0.25 + 0.55 * Math.abs(Math.sin(s * (0.8 + rnd(i, 4) * 2) + i))} />
		))}
		<circle cx={850} cy={250} r={190} fill="url(#lua)" opacity={0.55} />
		<circle cx={850} cy={250} r={64} fill="#e8f0f5" opacity={0.85} />
		<circle cx={832} cy={236} r={14} fill="#c9d6de" opacity={0.7} />
		<circle cx={872} cy={270} r={9} fill="#c9d6de" opacity={0.7} />
		{/* mar */}
		<rect y={1030} width={W} height={H - 1030} fill="#0a2230" />
		{[0, 1, 2, 3, 4].map((k) => {
			const y0 = 1050 + k * 70;
			const amp = 10 + k * 3;
			const pts = Array.from({length: 19}).map((_, i) => `${i * 60},${y0 + Math.sin(i * 0.9 + s * (1.2 + k * 0.25) + k) * amp}`);
			return <polyline key={k} points={pts.join(' ')} fill="none" stroke="#7fb4c8" strokeOpacity={0.12 + k * 0.03} strokeWidth={4} />;
		})}
		{/* reflexo da luz no mar */}
		<ellipse cx={540} cy={1140} rx={220 * luz} ry={26} fill={AMBAR} opacity={0.2 * luz} />
		{/* névoa */}
		{[0, 1, 2].map((k) => (
			<ellipse key={k} cx={((s * (14 + k * 8) + k * 420) % (W + 700)) - 350} cy={820 + k * 170} rx={420} ry={52} fill="#9fc1d1" opacity={0.1 + 0.03 * k} filter="url(#borrao)" />
		))}
	</g>
);

const Casa: React.FC<{x: number; y: number; k: number; acesa: number; i: number; s: number}> = ({x, y, k, acesa, i, s}) => (
	<g transform={`translate(${x} ${y}) scale(${k})`}>
		<rect x={-34} y={-44} width={68} height={44} fill="#06101a" />
		<polygon points="-42,-44 0,-82 42,-44" fill="#050c14" />
		<rect x={-10} y={-34} width={20} height={20} fill={AMBAR} opacity={acesa * (0.75 + 0.25 * Math.sin(s * 3 + i * 2))} />
	</g>
);

const Ilha: React.FC<{s: number; luz: number; T: D}> = ({s, luz, T}) => {
	const ang = s * 2.1;
	const dir = Math.cos(ang);
	const comp = Math.abs(dir) * 980;
	const lampX = 540;
	const lampY = 597;
	const sentido = dir >= 0 ? 1 : -1;
	return (
		<g>
			{/* raio do farol (some no apagão) */}
			{luz > 0 && (
				<polygon
					points={`${lampX},${lampY} ${lampX + sentido * comp},${lampY - 120 - comp * 0.05} ${lampX + sentido * comp},${lampY + 120 + comp * 0.05}`}
					fill={AMBAR}
					opacity={0.38 * luz * (0.4 + 0.6 * Math.abs(dir))}
				/>
			)}
			<circle cx={lampX} cy={lampY} r={90 * luz + 6} fill={AMBAR} opacity={0.3 * luz} filter="url(#borrao)" />
			{/* ilha */}
			<path d="M60,1032 Q180,930 330,960 Q430,900 540,925 Q680,890 790,950 Q930,940 1020,1032 Z" fill="#050d16" />
			<ellipse cx={540} cy={1034} rx={500} ry={22} fill="#030910" />
			{/* vila */}
			<Casa x={250} y={968} k={1} acesa={luz} i={1} s={s} />
			<Casa x={340} y={958} k={0.8} acesa={luz} i={2} s={s} />
			<Casa x={760} y={950} k={0.9} acesa={luz} i={3} s={s} />
			<Casa x={860} y={968} k={1.1} acesa={luz} i={4} s={s} />
			<Casa x={930} y={992} k={0.8} acesa={luz} i={5} s={s} />
			{/* torre */}
			<polygon points="500,1000 580,1000 566,650 514,650" fill="#e9e3d3" />
			<polygon points="504,940 576,940 572,880 508,880" fill="#b9322c" />
			<polygon points="512,800 568,800 565,740 515,740" fill="#b9322c" />
			<polygon points="500,1000 580,1000 576,960 504,960" fill="#c9c2af" />
			<rect x={498} y={640} width={84} height={16} fill="#2a3440" />
			<rect x={522} y={566} width={36} height={56} fill="#1b2430" />
			<rect x={526} y={572} width={28} height={44} fill={AMBAR} opacity={0.15 + 0.85 * luz} />
			<polygon points="514,566 566,566 540,526" fill="#b9322c" />
			<rect x={537} y={500} width={6} height={28} fill="#2a3440" />
		</g>
	);
};

// ---------------------------------------------------------------- planos
const Titulo: React.FC<{s: number; T: D}> = ({s, T}) => {
	const a = T.ilha;
	const fim = T.dataIni;
	const bal = vis(s, T.balsa - 0.05, T.farol - 0.1, 0.2);
	const nun = vis(s, T.farol, fim - 0.1, 0.2);
	return (
		<g>
			<Txt x={540} y={205} size={44} fill="#9fc1d1" ls={16} op={vis(s, a, fim, 0.2)}>
				ILHA DO
			</Txt>
			<Txt x={540} y={350} size={140} ls={4} op={vis(s, a, fim, 0.2)} sc={0.82 + 0.18 * pop(s, a, 0.45)} glow="#0b3a55">
				BOTO BRANCO
			</Txt>
			{/* 1 balsa por dia */}
			<g opacity={bal} transform={`translate(0 ${(1 - pop(s, T.balsa, 0.3)) * -30})`}>
				<rect x={330} y={395} width={420} height={78} rx={39} fill="none" stroke={AMBAR} strokeWidth={5} />
				<Txt x={540} y={449} size={46} fill={AMBAR} font={poppins} weight={800} ls={4}>
					1 BALSA POR DIA
				</Txt>
			</g>
			<g opacity={nun} transform={`translate(0 ${(1 - pop(s, T.farol, 0.3)) * -30})`}>
				<rect x={290} y={395} width={500} height={78} rx={39} fill={AMBAR} />
				<Txt x={540} y={449} size={46} fill="#201400" font={poppins} weight={800} ls={4}>
					NUNCA APAGOU
				</Txt>
			</g>
		</g>
	);
};

const Balsa: React.FC<{s: number; T: D}> = ({s, T}) => {
	const k = L((s - (T.balsa - 0.3)) / 2.6);
	const x = lerp(-160, W + 160, k);
	return (
		<g transform={`translate(${x} ${1088 + Math.sin(s * 5) * 4}) rotate(${Math.sin(s * 3) * 2})`} opacity={vis(s, T.balsa - 0.3, T.balsa + 2.3, 0.1)}>
			<polygon points="-60,0 60,0 44,26 -44,26" fill="#d8d2c2" />
			<rect x={-26} y={-30} width={52} height={30} fill="#b9322c" />
			<rect x={-8} y={-52} width={16} height={22} fill="#d8d2c2" />
			<rect x={-14} y={-22} width={12} height={12} fill={AMBAR} />
			<rect x={4} y={-22} width={12} height={12} fill={AMBAR} />
		</g>
	);
};

const Calendario: React.FC<{s: number; T: D}> = ({s, T}) => {
	const a = T.dataIni;
	const b = T.relogio - 0.05;
	const k = pop(s, a, 0.5);
	const op = vis(s, a, b, 0.15);
	const flip = Math.abs(Math.cos(Math.min(1, (s - a) / 0.5) * Math.PI * 0.5));
	return (
		<g opacity={op} transform={`translate(540 430) scale(${0.6 + 0.4 * k} ${(0.6 + 0.4 * k) * (s - a < 0.5 ? 0.35 + 0.65 * (1 - flip) : 1)})`}>
			<rect x={-250} y={-220} width={500} height={440} rx={34} fill={BRANCO} />
			<path d="M-250,-220 h500 v110 h-500 Z" fill={VERM} />
			<Txt x={0} y={-140} size={50} fill="#fff" font={poppins} weight={800} ls={8}>
				MARÇO 1987
			</Txt>
			<Txt x={0} y={120} size={290} fill="#14181e" ls={0}>
				14
			</Txt>
			<circle cx={-150} cy={-220} r={14} fill="#14181e" />
			<circle cx={150} cy={-220} r={14} fill="#14181e" />
		</g>
	);
};

const RelogioGrande: React.FC<{s: number; T: D}> = ({s, T}) => {
	const a = T.relogio;
	const b = T.luzApaga;
	const op = vis(s, a, b + 0.02, 0.12);
	const k = pop(s, a, 0.4);
	const alarme = L((s - (b - 1.0)) / 1.0);
	return (
		<g opacity={op}>
			<g transform={`translate(540 410) scale(${0.5 + 0.5 * k}) translate(-540 -410)`}>
				<circle cx={540} cy={410} r={175 + alarme * 14 * Math.abs(Math.sin(s * 12))} fill="none" stroke={VERM} strokeWidth={6} opacity={alarme * 0.8} />
				<Relogio cx={540} cy={410} r={160} hora={s < T.relogio + 1.1 ? 11 : 11} minuto={s < T.relogio + 1.1 ? 40 + (s - T.relogio) * 8 : 47} />
			</g>
			<Txt x={540} y={690} size={120} font={spaceMono} fill={AMBAR} ls={4} glow={AMBAR} sc={0.9 + 0.1 * Math.abs(Math.sin(s * 8)) * alarme + 0.1}>
				{`23:${s < T.relogio + 1.1 ? String(Math.min(47, Math.floor(40 + (s - T.relogio) * 8))).padStart(2, '0') : '47'}`}
			</Txt>
		</g>
	);
};

const Apagao: React.FC<{s: number; T: D}> = ({s, T}) => {
	const a = T.luzApaga;
	const b = T.volta;
	// contagem regressiva de 11:00 até 00:00 no ritmo da fala "Onze minutos de escuridão"
	const k = L((s - T.minutos) / (b - T.minutos - 0.1));
	const resto = Math.max(0, 11 * 60 * (1 - k));
	const mm = String(Math.floor(resto / 60)).padStart(2, '0');
	const ss = String(Math.floor(resto % 60)).padStart(2, '0');
	const treme = Math.sin(s * 70) * 4 * (1 - k * 0.5);
	return (
		<g>
			<rect width={W} height={H} fill="#000" opacity={0.86 * vis(s, a, b + 0.02, 0.05)} />
			<g opacity={vis(s, T.minutos - 0.05, b, 0.1)}>
				<Txt x={540 + treme} y={760} size={230} font={spaceMono} fill={VERM} ls={6} glow={VERM} op={0.75 + 0.25 * Math.abs(Math.sin(s * 11))}>
					{`${mm}:${ss}`}
				</Txt>
				<Txt x={540} y={840} size={44} fill="#ff8a80" font={poppins} weight={800} ls={12}>
					SEM LUZ
				</Txt>
			</g>
		</g>
	);
};

const Faroleiro: React.FC<{s: number; T: D}> = ({s, T}) => {
	const a = T.volta + 0.15;
	const b = T.sumido + 0.4;
	const some = L((s - (T.sumido - 0.1)) / 0.3);
	const op = vis(s, a, b, 0.15) * (1 - some);
	return (
		<g>
			{/* silhueta de Anselmo na sala da lente (já dentro do zoom do cenário) */}
			<g opacity={op}>
				<circle cx={540} cy={586} r={5.5} fill="#0a0f16" />
				<path d="M533,592 h14 l2,22 h-18 Z" fill="#0a0f16" />
			</g>
			{some > 0 && some < 1 &&
				Array.from({length: 14}).map((_, i) => (
					<circle key={i} cx={540 + (rnd(i, 5) - 0.5) * 50 * some} cy={600 - rnd(i, 6) * 60 * some} r={2.2} fill={AMBAR} opacity={1 - some} />
				))}
		</g>
	);
};

const Carimbo: React.FC<{s: number; t0: number; fim: number; x: number; y: number; rot: number; texto: string; sub?: string; cor?: string; size?: number}> = ({s, t0, fim, x, y, rot, texto, sub, cor = VERM, size = 100}) => {
	const k = L((s - t0) / 0.22);
	const sc = lerp(2.4, 1, eo(k));
	const largura = texto.length * size * 0.5 + 70;
	return (
		<g opacity={vis(s, t0, fim, 0.1) * Math.min(1, k * 3)} transform={`translate(${x} ${y}) rotate(${rot}) scale(${sc})`}>
			<rect x={-largura / 2} y={-size * 0.95} width={largura} height={size * 1.4 + (sub ? size * 0.5 : 0)} rx={10} fill="none" stroke={cor} strokeWidth={9} />
			<rect x={-largura / 2 + 12} y={-size * 0.95 + 12} width={largura - 24} height={size * 1.4 + (sub ? size * 0.5 : 0) - 24} rx={6} fill="none" stroke={cor} strokeWidth={3} />
			<Txt x={0} y={0} size={size} fill={cor} ls={5}>
				{texto}
			</Txt>
			{sub && (
				<Txt x={0} y={size * 0.55} size={size * 0.38} fill={cor} font={poppins} weight={800} ls={8}>
					{sub}
				</Txt>
			)}
		</g>
	);
};

const Fugiu: React.FC<{s: number; T: D}> = ({s, T}) => {
	const a = T.sumido;
	const b = T.trancada - 0.1;
	return (
		<g>
			<Txt x={540} y={236} size={44} fill="#9fc1d1" ls={14} op={vis(s, T.faroleiro, b, 0.15)}>
				O FAROLEIRO
			</Txt>
			<Txt x={540} y={336} size={118} op={vis(s, T.faroleiro, b, 0.15)} sc={0.8 + 0.2 * pop(s, T.faroleiro, 0.4)}>
				ANSELMO
			</Txt>
			<Carimbo s={s} t0={a} fim={b} x={540} y={470} rot={-6} texto="SUMIDO" size={92} />
		</g>
	);
};

const Porta: React.FC<{s: number; T: D}> = ({s, T}) => {
	const a = T.sala - 0.1;
	const b = T.relogios - 0.1;
	const op = vis(s, a, b, 0.15);
	const tranca = pop(s, T.trancada, 0.3);
	const treme = Math.max(0, 1 - (s - T.trancada) * 5) * Math.sin(s * 60) * 6;
	return (
		<g opacity={op}>
			<rect width={W} height={H} fill="#03070c" opacity={0.82} />
			<Txt x={540} y={230} size={44} fill="#9fc1d1" ls={12} op={entra(s, a + 0.1)}>
				A SALA DA LENTE
			</Txt>
			<g transform={`translate(${540 + treme} 700) scale(${0.85 + 0.15 * pop(s, a, 0.4)})`}>
				<rect x={-190} y={-360} width={380} height={640} rx={14} fill="#4b2f1c" stroke="#2b1a0f" strokeWidth={10} />
				<rect x={-150} y={-320} width={140} height={250} fill="#5d3b24" />
				<rect x={10} y={-320} width={140} height={250} fill="#5d3b24" />
				<rect x={-150} y={-40} width={140} height={270} fill="#5d3b24" />
				<rect x={10} y={-40} width={140} height={270} fill="#5d3b24" />
				<circle cx={120} cy={-20} r={16} fill="#d8b04a" />
				{/* cadeado */}
				<g transform={`translate(0 30)`}>
					<path d={`M-48,${-46 - (1 - tranca) * 36} v-44 a48,48 0 0 1 96,0 v${44 + (1 - tranca) * 0}`} fill="none" stroke="#c9ced4" strokeWidth={22} strokeLinecap="round" />
					<rect x={-80} y={-48} width={160} height={120} rx={20} fill="#d8b04a" />
					<circle cx={0} cy={4} r={16} fill="#2a2208" />
					<rect x={-6} y={8} width={12} height={34} fill="#2a2208" />
				</g>
			</g>
			{/* "por dentro" */}
			<g opacity={entra(s, T.dentro, 0.2)} transform={`translate(540 1130) scale(${0.7 + 0.3 * pop(s, T.dentro, 0.35)})`}>
				<rect x={-290} y={-70} width={580} height={110} rx={55} fill={VERM} />
				<Txt x={0} y={14} size={68} font={poppins} weight={900} ls={5} fill="#fff">
					POR DENTRO
				</Txt>
			</g>
		</g>
	);
};

const Relogios: React.FC<{s: number; T: D}> = ({s, T}) => {
	const a = T.relogios;
	const b = T.ninguem - 0.1;
	const op = vis(s, a, b, 0.12);
	const cols = [240, 540, 840];
	const lin = [560, 830, 1100];
	return (
		<g opacity={op}>
			<rect width={W} height={H} fill="#03070c" opacity={0.86} />
			<Txt x={540} y={250} size={52} fill="#9fc1d1" ls={12} op={entra(s, a)}>
				TODOS OS RELÓGIOS
			</Txt>
			{lin.flatMap((y, li) =>
				cols.map((x, ci) => {
					const i = li * 3 + ci;
					const entrada = pop(s, a + 0.06 * i, 0.3);
					const para = T.pararam + 0.07 * i;
					const parou = s >= para;
					const giro = parou ? 0 : (s - a) * (260 + i * 30);
					const hora = parou ? 11 : 11;
					const minuto = parou ? 47 : (47 + giro / 6) % 60;
					const tremor = parou ? Math.max(0, 1 - (s - para) * 6) * Math.sin(s * 70) * 4 : 0;
					return (
						<g key={i} transform={`translate(${x + tremor} ${y}) scale(${0.3 + 0.7 * entrada}) translate(${-x} ${-y})`} opacity={L(entrada * 2)}>
							<Relogio cx={x} cy={y} r={112} hora={hora} minuto={minuto} aro={parou ? VERM : AMBAR} />
						</g>
					);
				}),
			)}
			<Txt x={540} y={1290} size={110} font={spaceMono} fill={VERM} glow={VERM} ls={4} op={entra(s, T.pararam + 0.7, 0.15) * (0.6 + 0.4 * Math.abs(Math.sin(s * 9)))}>
				23:47
			</Txt>
		</g>
	);
};

const Moradores: React.FC<{s: number; T: D}> = ({s, T}) => {
	const a = T.ninguem;
	const b = T.delegado - 0.05;
	const op = vis(s, a, b, 0.14);
	const cores = ['#3a4a5a', '#44566a', '#34444f', '#4a5b6b', '#2f3d4a', '#3f5060', '#35465a'];
	return (
		<g opacity={op}>
			<rect width={W} height={H} fill="#03070c" opacity={0.82} />
			<Txt x={540} y={300} size={150} ls={4} sc={0.8 + 0.2 * pop(s, a, 0.4)} glow="#1e5b7a">
				NINGUÉM
			</Txt>
			<Txt x={540} y={410} size={96} fill="#9fc1d1" ls={8} op={entra(s, a + 0.35)}>
				LEMBRA
			</Txt>
			{cores.map((c, i) => {
				const x = 120 + i * 140;
				const y = 870 + Math.sin(i * 2) * 34;
				const k = pop(s, a + 0.18 + i * 0.09, 0.35);
				return (
					<g key={i} transform={`translate(${x} ${y}) scale(${0.4 + 0.6 * k})`} opacity={L(k * 2)}>
						<path d="M-56,120 Q-56,50 0,48 Q56,50 56,120 Z" fill={c} />
						<circle cx={0} cy={0} r={46} fill={c} />
						<Txt x={0} y={22} size={74} fill="#9fc1d1" font={poppins} weight={800} op={0.5 + 0.5 * Math.abs(Math.sin(s * 4 + i))} ls={0}>
							?
						</Txt>
					</g>
				);
			})}
		</g>
	);
};

const Delegado: React.FC<{s: number; T: D}> = ({s, T}) => {
	const a = T.delegado;
	const b = T.quase - 0.1;
	const op = vis(s, a, b, 0.14);
	const k = pop(s, a, 0.4);
	return (
		<g opacity={op}>
			<rect width={W} height={H} fill="#03070c" opacity={0.86} />
			<Txt x={540} y={230} size={44} fill="#9fc1d1" ls={14} op={entra(s, a)}>
				O DELEGADO
			</Txt>
			<Txt x={540} y={340} size={112} sc={0.8 + 0.2 * k} op={entra(s, a)}>
				CÁSSIO
			</Txt>
			{/* boné de policial */}
			<g transform={`translate(540 640) scale(${0.6 + 0.4 * k})`} opacity={L(k * 2)}>
				<ellipse cx={0} cy={130} rx={170} ry={36} fill="#0a121b" />
				<path d="M-150,130 Q-150,-30 0,-40 Q150,-30 150,130 Z" fill="#17283a" />
				<rect x={-170} y={112} width={340} height={34} rx={10} fill="#0a121b" />
				<path d="M-40,40 l40,-44 l40,44 l-40,36 Z" fill="#d8b04a" />
				<path d="M-120,147 Q0,210 120,147 L90,190 Q0,230 -90,190 Z" fill="#0a121b" />
			</g>
			<Carimbo s={s} t0={T.afog} fim={T.quase - 0.1} x={540} y={1010} rot={-8} texto="CASO FECHADO" sub="AFOGAMENTO" size={104} />
			{/* contorno de giz sem corpo */}
			<g opacity={entra(s, T.corpo, 0.2)} transform={`translate(540 1180)`}>
				<path
					d="M0,-60 a26,26 0 1 1 0.1,0 M0,-30 L0,60 M0,-10 L-52,22 M0,-10 L52,22 M0,60 L-34,128 M0,60 L34,128"
					fill="none"
					stroke={BRANCO}
					strokeWidth={7}
					strokeLinecap="round"
					strokeDasharray="14 12"
					transform="rotate(90) scale(0.8)"
				/>
			</g>
			<Txt x={540} y={1330} size={74} fill={BRANCO} ls={8} op={entra(s, T.corpo, 0.2)} sc={0.8 + 0.2 * pop(s, T.corpo, 0.3)}>
				SEM CORPO
			</Txt>
		</g>
	);
};

const Lia: React.FC<{s: number; T: D}> = ({s, T}) => {
	const a = T.quase;
	const b = T.cassete - 0.12;
	const op = vis(s, a, b, 0.15);
	// ano: 1987 → 2026
	const kAno = eo((s - T.quase - 0.1) / 1.0);
	const ano = Math.round(lerp(1987, 2026, kAno));
	const casaK = pop(s, T.neta - 0.4, 0.5);
	return (
		<g opacity={op}>
			<rect width={W} height={H} fill="#03070c" opacity={0.84} />
			<Txt x={540} y={300} size={190} font={spaceMono} fill={AMBAR} glow={AMBAR} ls={4}>
				{String(ano)}
			</Txt>
			<Txt x={540} y={390} size={50} fill="#9fc1d1" ls={12} op={entra(s, T.quase + 0.4)}>
				QUASE 40 ANOS DEPOIS
			</Txt>
			{/* casa da família */}
			<g transform={`translate(540 1000) scale(${0.5 + 0.5 * casaK})`} opacity={L(casaK * 2)}>
				<rect x={-230} y={-250} width={460} height={250} fill="#1a2c3d" />
				<polygon points="-270,-250 0,-420 270,-250" fill="#122131" />
				<rect x={-40} y={-150} width={80} height={150} fill="#0c1621" />
				<rect x={-180} y={-190} width={90} height={80} fill={AMBAR} opacity={0.65 + 0.15 * Math.sin(s * 3)} />
				<rect x={90} y={-190} width={90} height={80} fill="#2a4157" />
				{/* placa */}
				<g opacity={entra(s, T.vender, 0.2)} transform={`translate(230 0) scale(${0.6 + 0.4 * pop(s, T.vender, 0.3)})`}>
					<rect x={-6} y={-150} width={12} height={150} fill="#6b5a3d" />
					<rect x={-150} y={-230} width={300} height={100} rx={10} fill={BRANCO} />
					<Txt x={0} y={-160} size={62} fill="#14181e" ls={4}>
						VENDE-SE
					</Txt>
				</g>
			</g>
			{/* Lia com lanterna */}
			<g transform="translate(250 1020)" opacity={entra(s, T.neta, 0.3)}>
				<polygon points="30,-70 330,-190 330,-10" fill={AMBAR} opacity={0.3} />
				<circle cx={0} cy={-120} r={22} fill="#3b556b" />
				<path d="M-34,-12 Q-34,-92 0,-96 Q34,-92 34,-12 Z" fill="#3b556b" />
			</g>
			<g opacity={entra(s, T.neta, 0.2)}>
				<rect x={380} y={430} width={320} height={64} rx={32} fill={BRANCO} />
				<Txt x={540} y={476} size={40} fill="#14181e" font={poppins} weight={800} ls={4}>
					LIA · A NETA
				</Txt>
			</g>
		</g>
	);
};

const Cassete: React.FC<{s: number; T: D; mulher: number}> = ({s, T, mulher}) => {
	const a = T.cassete;
	const b = T.fimVoz;
	const op = vis(s, a - 0.1, b, 0.14);
	const k = pop(s, a, 0.45);
	const toca = s >= T.play;
	const giro = toca ? (s - T.play) * 260 * (1 - 0.7 * mulher * Math.abs(Math.sin(s * 9))) : 0;
	const shake = mulher > 0 ? Math.sin(s * 80) * 7 * mulher : 0;
	return (
		<g opacity={op}>
			<rect width={W} height={H} fill="#03070c" opacity={0.86} />
			<g transform={`translate(${540 + shake} 780) scale(${0.5 + 0.5 * k}) rotate(${(1 - k) * -14})`}>
				{mulher > 0 && <g transform="translate(10 0)" opacity={0.5}><rect x={-320} y={-200} width={640} height={400} rx={30} fill={ROSA} /></g>}
				<rect x={-320} y={-200} width={640} height={400} rx={30} fill="#222a33" stroke="#0a0f14" strokeWidth={8} />
				<rect x={-270} y={-160} width={540} height={230} rx={14} fill="#e8dcc0" />
				<rect x={-270} y={-160} width={540} height={52} rx={14} fill="#b9322c" />
				<Txt x={0} y={-186 + 52} size={34} fill="#fff" font={poppins} weight={800} ls={6} anchor="middle">
					ANSELMO · 14/03/87
				</Txt>
				{[-1, 1].map((d) => (
					<g key={d} transform={`translate(${d * 120} -20) rotate(${giro * d})`}>
						<circle r={64} fill="#14181e" />
						<circle r={44} fill="#e8dcc0" />
						{[0, 60, 120, 180, 240, 300].map((r) => (
							<line key={r} x1={0} y1={0} x2={Math.cos((r * Math.PI) / 180) * 40} y2={Math.sin((r * Math.PI) / 180) * 40} stroke="#14181e" strokeWidth={6} />
						))}
					</g>
				))}
				<polygon points="-220,200 220,200 170,100 -170,100" fill="#14181e" />
				<circle cx={-90} cy={150} r={14} fill="#3a4450" />
				<circle cx={90} cy={150} r={14} fill="#3a4450" />
			</g>
			{/* botão play */}
			<g transform={`translate(540 1130)`} opacity={entra(s, T.fita + 0.1, 0.2)}>
				<circle r={78 + (toca ? Math.max(0, 1 - (s - T.play) * 3) * 40 : 0)} fill="none" stroke={AMBAR} strokeWidth={5} opacity={toca ? Math.max(0, 1 - (s - T.play) * 3) : 0.35} />
				<circle r={66 * (toca && s - T.play < 0.15 ? 0.88 : 1)} fill={toca ? AMBAR : '#1b2530'} stroke={AMBAR} strokeWidth={6} />
				<polygon points="-18,-30 -18,30 32,0" fill={toca ? '#201400' : AMBAR} />
			</g>
		</g>
	);
};

// Barras de áudio (onda da fita).
const Onda: React.FC<{s: number; T: D; mulher: number}> = ({s, T, mulher}) => {
	if (s < T.play) return null;
	const op = vis(s, T.play, T.fimVoz, 0.14);
	const n = 36;
	return (
		<g opacity={op} transform="translate(0 1290)">
			{Array.from({length: n}).map((_, i) => {
				const x = 90 + i * 25.5;
				const v = 0.25 + 0.75 * Math.abs(Math.sin(s * 9 + i * 0.8) * Math.cos(s * 5.3 + i * 0.37)) * (0.5 + 0.5 * rnd(i, Math.floor(s * 12)));
				const h = 12 + v * 120;
				const rosa = mulher > 0 && i % 3 === 1;
				return <rect key={i} x={x} y={-h / 2} width={14} height={h} rx={7} fill={rosa ? ROSA : AMBAR} opacity={rosa ? 0.95 : 0.9} />;
			})}
		</g>
	);
};

const Falas: React.FC<{s: number; T: D; q1: Palavra[]; q2: Palavra[]; q3: Palavra[]}> = ({s, T, q1, q2, q3}) => (
	<g>
		<rect x={0} y={150} width={W} height={430} fill="#03070c" opacity={0.0} />
		<Txt x={540} y={186} size={34} fill="#9fc1d1" font={poppins} weight={800} ls={12} op={vis(s, T.voz, T.mulher - 0.1, 0.2)}>
			NA FITA
		</Txt>
		<Frase s={s} palavras={q1} y={300} porLinha={3} size={92} cores={{lembra: AMBAR, confie: VERM}} fim={T.quem - 0.08} />
		<Frase s={s} palavras={q2} y={300} porLinha={3} size={92} cores={{inocente: '#5be0a0', lembra: AMBAR}} fim={T.mulher - 0.35} />
		<Frase s={s} palavras={q3} y={400} porLinha={2} size={108} fill={ROSA} cores={{chega: ROSA, anselmo: ROSA}} fim={T.fimVoz} />
		<g opacity={vis(s, T.mulher, T.fimVoz, 0.1)} transform={`translate(540 200) scale(${0.7 + 0.3 * pop(s, T.mulher, 0.3)})`}>
			<rect x={-250} y={-44} width={500} height={70} rx={35} fill={ROSA} />
			<Txt x={0} y={4} size={40} fill="#fff" font={poppins} weight={800} ls={5}>
				VOZ DE MULHER
			</Txt>
		</g>
	</g>
);

const Cta: React.FC<{s: number; T: D}> = ({s, T}) => {
	const a = T.deQuem;
	const op = L((s - a) / 0.15);
	const q1 = vis(s, a, T.porQue - 0.05, 0.12);
	const q2 = vis(s, T.porQue, T.comenta - 0.05, 0.12);
	const bolhas = [
		{t: T.porQue + 0.2, y: 640, nome: '@mari.teorias', txt: 'foi a dona da pousada!', cor: '#e45b87', likes: 218},
		{t: T.comenta, y: 810, nome: '@joao_suspeito', txt: 'o delegado sabe de tudo', cor: '#4aa3df', likes: 342},
		{t: T.comenta + 0.55, y: 980, nome: '@lu.detetive', txt: 'a voz é da avó da Lia?!', cor: '#7bd389', likes: 97},
	];
	const parte2 = pop(s, T.mais, 0.45);
	return (
		<g opacity={op}>
			<rect width={W} height={H} fill="#03070c" opacity={0.9} />
			<Txt x={540} y={270} size={118} ls={3} op={q1} sc={0.8 + 0.2 * pop(s, a, 0.35)} glow={ROSA}>
				DE QUEM É
			</Txt>
			<Txt x={540} y={400} size={150} fill={ROSA} op={q1} sc={0.8 + 0.2 * pop(s, a + 0.2, 0.35)} glow={ROSA}>
				ESSA VOZ?
			</Txt>
			<Txt x={540} y={270} size={80} ls={3} op={q2} sc={0.8 + 0.2 * pop(s, T.porQue, 0.35)}>
				POR QUE QUEM LEMBRA
			</Txt>
			<Txt x={540} y={400} size={150} fill={AMBAR} op={q2} sc={0.8 + 0.2 * pop(s, T.porQue + 0.2, 0.35)} glow={AMBAR}>
				É SUSPEITO?
			</Txt>
			{/* comentários */}
			{bolhas.map((b, i) => {
				const k = pop(s, b.t, 0.4);
				const likes = Math.round(b.likes * eo((s - b.t) / 1.6));
				return (
					<g key={i} transform={`translate(0 ${b.y + (1 - k) * 90})`} opacity={L(k * 2) * (s < T.comenta - 1.6 && i > 0 ? 0 : 1)}>
						<rect x={70} y={-70} width={940} height={150} rx={40} fill="#16222e" stroke="#2a3d50" strokeWidth={3} />
						<circle cx={150} cy={5} r={44} fill={b.cor} />
						<Txt x={150} y={22} size={46} fill="#fff" font={poppins} weight={800} ls={0}>
							{b.nome.charAt(1).toUpperCase()}
						</Txt>
						<Txt x={220} y={-14} size={32} fill="#9fc1d1" font={poppins} weight={700} anchor="start" ls={0}>
							{b.nome}
						</Txt>
						<Txt x={220} y={40} size={36} fill={BRANCO} font={poppins} weight={600} anchor="start" ls={0}>
							{b.txt}
						</Txt>
						<g transform="translate(920 5)">
							<path d="M0,10 C-30,-14 -22,-34 -8,-34 C-2,-34 0,-28 0,-26 C0,-28 2,-34 8,-34 C22,-34 30,-14 0,10 Z" fill={VERM} transform={`scale(${1 + 0.15 * Math.sin(s * 8 + i)})`} />
							<Txt x={0} y={52} size={26} fill={BRANCO} font={poppins} weight={700} ls={0}>
								{likes}
							</Txt>
						</g>
					</g>
				);
			})}
			{/* chamada final */}
			<g opacity={entra(s, T.comenta, 0.2)}>
				<rect x={110} y={1130} width={860} height={104} rx={52} fill={BRANCO} />
				<Txt x={540} y={1202} size={58} fill="#14181e" font={poppins} weight={900} ls={3}>
					COMENTE SUA TEORIA ↓
				</Txt>
			</g>
			<g transform={`translate(540 1500) scale(${0.6 + 0.4 * parte2})`} opacity={L(parte2 * 2)}>
				<rect x={-440} y={-150} width={880} height={330} rx={46} fill="#101c28" stroke={AMBAR} strokeWidth={6} />
				<Txt x={0} y={-60} size={52} fill="#9fc1d1" font={poppins} weight={800} ls={4}>
					AS MAIS VOTADAS VIRAM A
				</Txt>
				<Txt x={0} y={90} size={170} fill={AMBAR} glow={AMBAR} sc={1 + 0.04 * Math.sin(s * 7)}>
					PARTE 2
				</Txt>
			</g>
		</g>
	);
};

// ---------------------------------------------------------------- peça
const Mundo: React.FC<{s: number; frame: number; cena: CenaPeca}> = ({s, frame, cena}) => {
	const d = (cena.dados ?? {}) as Record<string, unknown>;
	const T = d.T as D;
	const beats = (d.beats as number[]) ?? [];
	const q1 = d.q1 as Palavra[];
	const q2 = d.q2 as Palavra[];
	const q3 = d.q3 as Palavra[];

	// "luz": 1 acesa, 0 apagada (apagão entre luzApaga e volta, com piscadas na volta)
	let luz = 1;
	if (s >= T.luzApaga && s < T.volta) luz = 0;
	if (s >= T.volta && s < T.volta + 0.5) luz = Math.sin((s - T.volta) * 60) > 0 ? 1 : 0.15;
	if (s >= T.luzApaga - 0.35 && s < T.luzApaga) luz = Math.sin(s * 90) > 0 ? 1 : 0.2;

	// soco de câmera em cada batida da fala
	let punch = 0;
	for (const b of beats) if (s >= b && s - b < 0.5) punch += Math.exp(-(s - b) * 9);
	punch = Math.min(1.3, punch);
	const sinal = rnd(Math.floor(s * 10), 3) > 0.5 ? 1 : -1;

	// zoom do cenário: dolly lento, mergulho na sala da lente quando Anselmo aparece, volta antes dos relógios
	let z = 0.86 + 0.14 * eo(s / 5.2);
	if (s > 5.2) z = 1 + 0.06 * eo((s - 5.2) / 6);
	const mergulho = eo((s - (T.volta - 0.1)) / 1.1) * (1 - eo((s - (T.trancada - 0.4)) / 1.0));
	z = lerp(z, 3.4, mergulho);
	const cx = 540;
	const cy = lerp(820, 760, mergulho);
	const ilhaOp = 1 - L((s - (T.ninguem - 0.4)) / 0.5) + L((s - (T.deQuem - 0.1)) / 0.4) * 0.25;
	const ilhaVis = Math.min(1, ilhaOp) * 1;

	// câmera geral
	const sc = 1.025 + 0.035 * Math.min(1, punch) + 0.01 * Math.sin(s * 0.8);
	const rot = Math.sin(s * 2.1) * 0.25 + punch * sinal * 0.5;
	const tx = Math.sin(s * 41) * 3 * punch;
	const ty = Math.cos(s * 37) * 3 * punch;
	// piscar de luz do ambiente
	const flick = 1 - (luz < 1 ? 0.15 : 0.04) * rnd(frame, 9);
	// clarão branco na hora do apagão e na volta
	const claro = Math.max(L(1 - Math.abs(s - T.luzApaga) / 0.09), L(1 - Math.abs(s - T.volta) / 0.14) * 0.7, L(1 - Math.abs(s - T.fitaPlay) / 0.1) * 0.35);

	const mulher = L((s - T.mulher) / 0.2) * (1 - L((s - T.fimVoz) / 0.2));

	return (
		<svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{display: 'block'}}>
			<g transform={`translate(540 960) rotate(${rot}) scale(${sc}) translate(${-540 + tx} ${-960 + ty})`} opacity={flick}>
				<Fundo s={s} luz={luz} />
				<g opacity={ilhaVis} transform={`translate(${cx} ${cy}) scale(${z}) translate(-540 -${lerp(850, 597, mergulho)})`}>
					<Ilha s={s} luz={luz} T={T} />
					<Faroleiro s={s} T={T} />
				</g>
				<Balsa s={s} T={T} />
				<Titulo s={s} T={T} />
				<Calendario s={s} T={T} />
				<RelogioGrande s={s} T={T} />
				<Apagao s={s} T={T} />
				<Fugiu s={s} T={T} />
				<Porta s={s} T={T} />
				<Relogios s={s} T={T} />
				<Moradores s={s} T={T} />
				<Delegado s={s} T={T} />
				<Lia s={s} T={T} />
				<Cassete s={s} T={T} mulher={mulher} />
				<Onda s={s} T={T} mulher={mulher} />
				<Falas s={s} T={T} q1={q1} q2={q2} q3={q3} />
				<Cta s={s} T={T} />
			</g>
			{/* vinheta + clarão + grão */}
			<defs>
				<radialGradient id="vig" cx="0.5" cy="0.5" r="0.75">
					<stop offset="0.55" stopColor="#000" stopOpacity="0" />
					<stop offset="1" stopColor="#000" stopOpacity={0.55 + 0.2 * punch} />
				</radialGradient>
			</defs>
			<rect width={W} height={H} fill="url(#vig)" />
			{Array.from({length: 7}).map((_, i) => (
				<rect key={i} x={0} y={rnd(frame + i, 11) * H} width={W} height={2} fill="#fff" opacity={0.03 + 0.04 * rnd(frame, i)} />
			))}
			<rect width={W} height={H} fill="#fff" opacity={claro} />
		</svg>
	);
};

export const misterioCorvo: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps, width} = useVideoConfig();
	const s = cena.de + frame / fps;
	const k = width / W;
	return (
		<div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: '#000'}}>
			<div style={{width: W, height: H, transform: `scale(${k})`, transformOrigin: '0 0'}}>
				<Mundo s={s} frame={Math.round(s * fps)} cena={cena} />
			</div>
		</div>
	);
};


// ---------------------------------------------------------------- cenas (âncoras na narração)
export const cenasMisterio = (b: Busca, duracao: number): Cena[] => {
	const T: D = {
		ilha: b.at('Ilha'),
		balsa: b.at('balsa'),
		farol: b.at('farol'),
		dataIni: b.at('Até'),
		relogio: b.at('onze'),
		luzApaga: b.at('apagou', 2),
		minutos: b.at('minutos'),
		volta: b.at('Quando'),
		faroleiro: b.at('faroleiro'),
		sumido: b.at('sumido'),
		sala: b.at('sala'),
		trancada: b.at('trancada'),
		dentro: b.at('dentro'),
		relogios: b.at('relógios'),
		pararam: b.at('pararam'),
		ninguem: b.at('Ninguém'),
		delegado: b.at('delegado'),
		afog: b.at('afogamento'),
		corpo: b.at('corpo'),
		quase: b.at('Quase'),
		neta: b.at('neta'),
		vender: b.at('vender'),
		cassete: b.at('fita'),
		fita: b.at('fita'),
		play: b.at('play'),
		voz: b.at('voz', 1),
		quem: b.say('Quem não lembra').inicio,
		mulher: b.at('mulher'),
		fimVoz: b.say('já chega').fim + 0.25,
		fitaPlay: b.at('play'),
		deQuem: b.say('De quem').inicio,
		porQue: b.say('Por que quem lembra').inicio,
		comenta: b.at('Comenta'),
		mais: b.at('mais'),
	};
	const tempos = (f: string) => b.tempos(f);
	const pal = (f: string): Palavra[] => f.split(/\s+/).map((txt, i) => ({txt: txt.toUpperCase(), t: tempos(f)[i]}));
	// batidas: início de palavras de conteúdo, no mínimo 0,42 s uma da outra (evento novo a cada ~0,4 a 0,6 s)
	const beats: number[] = [];
	let ultimo = -1;
	for (const p of b.palavras) {
		const len = p.texto.replace(/[^\p{L}\d]/gu, '').length;
		if (len >= 4 && p.inicio - ultimo >= 0.42) {
			beats.push(p.inicio);
			ultimo = p.inicio;
		}
	}
	const dados = {
		T,
		beats,
		q1: pal('não confie em quem lembra daquela noite'),
		q2: pal('Quem não lembra, ao menos, é inocente'),
		q3: pal('Anselmo, já chega'),
	};
	const sons: [number, Som, number][] = [
		[0.12, 'shimmer', 0.5],
		[T.balsa, 'pro_whoosh_curto', 0.5],
		[T.farol, 'pro_pop', 0.6],
		[T.dataIni, 'pro_pop', 0.6],
		[T.relogio, 'pro_tick', 0.55],
		[T.luzApaga, 'pro_pouso', 0.8],
		[T.minutos, 'pro_pulso', 0.5],
		[T.volta, 'subida', 0.6],
		[T.sumido, 'swish', 0.55],
		[T.trancada, 'pro_pop', 0.7],
		[T.relogios, 'pro_tick', 0.5],
		[T.pararam, 'pro_pop', 0.6],
		[T.ninguem, 'pro_whoosh_curto', 0.5],
		[T.delegado, 'pro_pop', 0.5],
		[T.afog, 'pro_pouso', 0.75],
		[T.corpo, 'pro_pop', 0.6],
		[T.quase, 'subida', 0.5],
		[T.neta, 'pro_pop', 0.5],
		[T.cassete, 'pro_pop', 0.65],
		[T.play, 'pro_tick', 0.7],
		[b.at('confie'), 'shimmer', 0.5],
		[T.quem, 'pro_pop', 0.5],
		[T.mulher, 'swish', 0.6],
		[b.at('Anselmo', 2), 'pro_pulso', 0.65],
		[T.deQuem, 'pro_whoosh', 0.55],
		[T.porQue, 'pro_pop', 0.55],
		[T.comenta, 'pro_pop', 0.6],
		[T.comenta + 0.55, 'pro_pop', 0.5],
		[T.mais, 'subida', 0.55],
		[b.say('parte dois').fim - 0.2, 'pro_logo', 0.6],
	];
	const sonsOk = sons.map(([em, som, ganho]) => ({em, som, ganho}));
	// duas cenas da mesma peça (contínua): a 2ª esconde a legenda no CTA final
	return [
		{tipo: 'peca', nome: 'misterioCorvo', modo: 'cheia', de: 0, ate: T.deQuem - 0.01, dados, sons: sonsOk.filter((x) => x.em < T.deQuem)} as Cena,
		{tipo: 'peca', nome: 'misterioCorvo', modo: 'cheia', de: T.deQuem - 0.01, ate: duracao, dados, esconderLegenda: true, sons: sonsOk.filter((x) => x.em >= T.deQuem)} as Cena,
	];
};
