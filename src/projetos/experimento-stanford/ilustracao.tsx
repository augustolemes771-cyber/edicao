// Sistema de ilustração 2D plana do experimento-stanford, no estilo da referência "Ponto Cego" (lenda
// ilustrada, personagens simples de cabeça redonda e corpo chapado, mapa com pino, lanterna revelando no
// escuro, cartela de título limpa). Tudo em SVG/CSS via React — sem WebGL, mais leve de renderizar.
import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {CenaPeca, Pecas} from '../../pecas/peca';

export const lim = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const fonte = 'Poppins, Montserrat, sans-serif';

export const COR = {
	noite1: '#0d1424',
	noite2: '#1c2740',
	dia1: '#cfe0e8',
	dia2: '#e8e2d0',
	predio: '#aab0b8',
	predioEscuro: '#6b7078',
	pele: '#c89a72',
	peleClara: '#e8c9a8',
	prisioneiro: '#d8c9a8',
	guarda: '#2b3a52',
	vermelho: '#e8545c',
	rosa: '#ff7a8a',
	branco: '#f5f3ee',
	dourado: '#f2c14e',
	// Ambientes (cenários completos) — mesmas cores chapadas, sem degradê de luz.
	concreto: '#474c54',
	concretoEscuro: '#2c3036',
	concretoClaro: '#5a6069',
	ferro: '#1a1d22',
	ferroClaro: '#6b717a',
	luz: '#ffd98a',
	arenito: '#d9bf91',
	arenitoEscuro: '#9c7f55',
	telha: '#b35a3e',
	grama: '#2e4a3a',
	madeira: '#7a5236',
	madeiraEscura: '#5a3b26',
	madeiraClara: '#a77a52',
	papel: '#efe6d2',
	sepia1: '#e9d8b4',
	sepia2: '#d2b98c',
	verdeAbajur: '#2f5a46',
	lousa: '#34473b',
};

export const usePeca = (cena: CenaPeca) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const q = (s: unknown) => Math.round(Math.max(0, Number(s) - cena.de) * fps);
	const mola = (em: number, rigidez = 140, amort = 16) => spring({frame: frame - em, fps, config: {damping: amort, stiffness: rigidez}});
	const sobe = (a: number, b: number) => interpolate(frame, [a, b], [0, 1], {...lim});
	return {frame, fps, t, q, mola, sobe};
};

// Fundo com degradê (noite ou dia).
export const Fundo: React.FC<{noite?: boolean; children?: React.ReactNode}> = ({noite = true, children}) => (
	<div
		style={{
			position: 'absolute',
			inset: 0,
			background: noite ? `linear-gradient(180deg, ${COR.noite1} 0%, ${COR.noite2} 100%)` : `linear-gradient(180deg, ${COR.dia1} 0%, ${COR.dia2} 100%)`,
			overflow: 'hidden',
		}}
	>
		{children}
	</div>
);

// Lua com crateras simples (usada como "selo" de tensão, como na referência).
export const Lua: React.FC<{x: number; y: number; r?: number; p?: number}> = ({x, y, r = 70, p = 1}) => (
	<svg style={{position: 'absolute', left: x - r, top: y - r, opacity: p}} width={r * 2} height={r * 2} viewBox="0 0 140 140">
		<circle cx={70} cy={70} r={66} fill={COR.branco} opacity={0.95} />
		<circle cx={46} cy={50} r={10} fill="#00000010" />
		<circle cx={90} cy={40} r={6} fill="#00000010" />
		<circle cx={85} cy={85} r={14} fill="#00000010" />
	</svg>
);

// Prédio simples (fachada com janelas) usado na abertura — "Universidade Stanford".
export const Predio: React.FC<{p: number; y?: number}> = ({p, y = 420}) => (
	<svg
		style={{position: 'absolute', left: '50%', top: y, transform: `translate(-50%, ${(1 - p) * 60}px)`, opacity: p}}
		width={300}
		height={260}
		viewBox="0 0 300 260"
	>
		<rect x={30} y={40} width={240} height={220} fill={COR.predio} />
		<polygon points="20,40 150,0 280,40" fill={COR.predioEscuro} />
		{Array.from({length: 4}).map((_, row) =>
			Array.from({length: 5}).map((__, col) => <rect key={`${row}-${col}`} x={55 + col * 44} y={65 + row * 42} width={26} height={28} fill={COR.noite2} opacity={0.85} />),
		)}
		<rect x={135} y={200} width={30} height={60} fill={COR.noite1} />
	</svg>
);

// Corte transversal do porão: corredor com portas de grade dos dois lados (perspectiva simples, chapada).
export const Porao: React.FC<{p: number}> = ({p}) => (
	<svg style={{position: 'absolute', left: 0, top: 1200, opacity: p}} width={1080} height={720} viewBox="0 0 432 480" preserveAspectRatio="none">
		<polygon points="0,480 432,480 300,60 132,60" fill="#3a3f47" />
		<polygon points="0,480 132,60 132,480" fill="#2a2e34" />
		<polygon points="432,480 300,60 300,480" fill="#2a2e34" />
		{[0, 1, 2].map((i) => (
			<g key={`l${i}`} transform={`translate(${6 + i * 34},${300 - i * 60})`}>
				<rect width={18} height={120 - i * 14} fill="#15171b" opacity={0.9} />
				{[0, 1, 2, 3].map((b) => (
					<rect key={b} x={3 + b * 4} y={6} width={2} height={110 - i * 14} fill="#000" />
				))}
			</g>
		))}
		{[0, 1, 2].map((i) => (
			<g key={`r${i}`} transform={`translate(${408 - i * 34 - 18},${300 - i * 60})`}>
				<rect width={18} height={120 - i * 14} fill="#15171b" opacity={0.9} />
				{[0, 1, 2, 3].map((b) => (
					<rect key={b} x={3 + b * 4} y={6} width={2} height={110 - i * 14} fill="#000" />
				))}
			</g>
		))}
	</svg>
);

// Personagem chapado: cabeça redonda, corpo simples. braco: 0 (baixo) a 1 (levantado/estendido).
export const Personagem: React.FC<{x: number; y: number; escala?: number; tom: 'guarda' | 'prisioneiro'; braco?: number; vira?: boolean; p?: number}> = ({
	x,
	y,
	escala = 1,
	tom,
	braco = 0,
	vira = false,
	p = 1,
}) => {
	const cor = tom === 'guarda' ? COR.guarda : COR.prisioneiro;
	return (
		<svg
			style={{position: 'absolute', left: x - 55 * escala, top: y - 130 * escala, opacity: p, transform: `scale(${escala * (vira ? -1 : 1)}, ${escala})`}}
			width={110}
			height={160}
			viewBox="0 0 110 160"
		>
			<ellipse cx={55} cy={154} rx={30} ry={6} fill="#000" opacity={0.25} />
			<rect x={20} y={62} width={70} height={82} rx={14} fill={cor} />
			<circle cx={55} cy={40} r={30} fill={COR.pele} />
			<circle cx={45} cy={38} r={3.4} fill="#1a1a1a" />
			<circle cx={65} cy={38} r={3.4} fill="#1a1a1a" />
			<rect
				x={82}
				y={66 - braco * 46}
				width={16}
				height={60}
				rx={8}
				fill={cor}
				transform={`rotate(${braco * -70} 90 70)`}
			/>
			<rect x={12} y={66}
				width={16}
				height={60}
				rx={8}
				fill={cor}
			/>
			<rect x={34} y={140} width={18} height={20} rx={6} fill={cor} />
			<rect x={58} y={140} width={18} height={20} rx={6} fill={cor} />
		</svg>
	);
};

// Lanterna/foco no escuro (vinheta circular que revela uma área — técnica forte da referência).
export const Foco: React.FC<{x: number; y: number; r: number; p: number}> = ({x, y, r, p}) => (
	<div
		style={{
			position: 'absolute',
			inset: 0,
			opacity: p,
			background: `radial-gradient(circle ${r}px at ${x}px ${y}px, transparent 0%, transparent 55%, rgba(5,7,12,0.94) 100%)`,
		}}
	/>
);

// Mapa simples (contorno dos EUA) com pino de localização.
export const Mapa: React.FC<{p: number; rotulo: string}> = ({p, rotulo}) => (
	<div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: p, transform: `scale(${0.85 + p * 0.15})`}}>
		<svg width={340} height={340} viewBox="0 0 340 340">
			<path
				d="M40 150 L80 110 L140 100 L170 60 L230 70 L260 110 L300 120 L290 170 L250 210 L200 250 L140 260 L90 230 L50 200 Z"
				fill={COR.predio}
				opacity={0.9}
			/>
			<circle cx={120} cy={150} r={10} fill={COR.vermelho} />
			<circle cx={120} cy={150} r={4} fill={COR.branco} />
		</svg>
		<div style={{position: 'absolute', bottom: 60, background: 'rgba(0,0,0,0.55)', padding: '8px 20px', borderRadius: 6, color: COR.branco, fontFamily: fonte, fontWeight: 700, fontSize: 26, letterSpacing: '0.04em'}}>
			{rotulo}
		</div>
	</div>
);

// Número grande + rótulo, no mesmo espírito limpo da referência.
export const Numero: React.FC<{valor: string; rotulo: string; p: number; cor?: string; top?: number}> = ({valor, rotulo, p, cor = COR.dourado, top = 260}) => {
	if (p <= 0.001) return null;
	return (
		<div style={{position: 'absolute', top, width: '100%', textAlign: 'center', opacity: Math.min(1, p * 1.6), transform: `translateY(${(1 - p) * 30}px) scale(${0.75 + 0.25 * p})`}}>
			<div style={{fontFamily: fonte, fontWeight: 800, fontSize: 130, lineHeight: 1, color: COR.branco, textShadow: '0 8px 24px rgba(0,0,0,0.5)'}}>{valor}</div>
			<div style={{marginTop: 10, fontFamily: fonte, fontWeight: 700, fontSize: 30, letterSpacing: '0.08em', color: cor}}>{rotulo}</div>
		</div>
	);
};

// Cartela de título (como "PONTO CEGO / LENDAS DO INTERIOR / KANAIMÉ / RORAIMA · 1978").
export const Cartela: React.FC<{p: number; titulo: string; subtitulo: string; destaque: string; rodape: string}> = ({p, titulo, subtitulo, destaque, rodape}) => (
	<div style={{position: 'absolute', inset: 0, background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: p, gap: 10}}>
		<div style={{fontFamily: fonte, fontWeight: 800, fontSize: 48, color: COR.branco, letterSpacing: '0.02em'}}>{titulo}</div>
		<div style={{fontFamily: fonte, fontWeight: 600, fontSize: 22, color: '#9aa0ab', letterSpacing: '0.1em'}}>{subtitulo}</div>
		<div style={{fontFamily: fonte, fontWeight: 800, fontSize: 36, color: COR.vermelho, marginTop: 18}}>{destaque}</div>
		<div style={{fontFamily: fonte, fontWeight: 500, fontSize: 18, color: '#7a8088', marginTop: 6, letterSpacing: '0.06em'}}>{rodape}</div>
	</div>
);

// Pílula com texto curto (rótulo isolado, sem número grande).
export const Pilula: React.FC<{texto: string; p: number; y: number; cor?: string}> = ({texto, p, y, cor = COR.vermelho}) => {
	if (p <= 0.001) return null;
	return (
		<div style={{position: 'absolute', top: y, width: '100%', textAlign: 'center', opacity: Math.min(1, p * 1.5), transform: `scale(${0.7 + 0.3 * p})`}}>
			<span style={{display: 'inline-block', padding: '10px 28px', borderRadius: 40, background: cor, color: COR.branco, fontFamily: fonte, fontWeight: 800, fontSize: 32, letterSpacing: '0.03em', boxShadow: '0 8px 20px rgba(0,0,0,0.4)'}}>
				{texto}
			</span>
		</div>
	);
};

// Texto grande central (sem número), pro fechamento.
export const TextoGrande: React.FC<{texto: string; p: number; cor?: string}> = ({texto, p, cor = COR.branco}) => (
	<div
		style={{
			position: 'absolute',
			inset: 0,
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			opacity: Math.min(1, p * 1.6),
			transform: `scale(${0.8 + 0.2 * p})`,
			textAlign: 'center',
			padding: '0 40px',
		}}
	>
		<div style={{fontFamily: fonte, fontWeight: 800, fontSize: 76, color: cor, lineHeight: 1.1, textShadow: '0 8px 24px rgba(0,0,0,0.5)'}}>{texto}</div>
	</div>
);

// Relógio de parede simples (ponteiros parados numa hora/posição fixa, chapado).
export const Relogio: React.FC<{p: number; y?: number; girar?: number}> = ({p, y = 420, girar = 0}) => (
	<svg style={{position: 'absolute', left: '50%', top: y, transform: `translate(-50%, ${(1 - p) * 40}px)`, opacity: p}} width={220} height={220} viewBox="0 0 220 220">
		<circle cx={110} cy={110} r={100} fill={COR.branco} />
		<circle cx={110} cy={110} r={100} fill="none" stroke={COR.predioEscuro} strokeWidth={6} />
		{Array.from({length: 12}).map((_, i) => (
			<rect key={i} x={108} y={16} width={4} height={14} fill={COR.predioEscuro} transform={`rotate(${(i * 360) / 12} 110 110)`} />
		))}
		<rect x={107} y={50} width={6} height={64} rx={3} fill="#1a1a1a" transform={`rotate(${girar} 110 110)`} />
		<rect x={108} y={30} width={4} height={84} rx={2} fill={COR.vermelho} transform={`rotate(${girar * 2.2} 110 110)`} />
		<circle cx={110} cy={110} r={7} fill="#1a1a1a" />
	</svg>
);

// Livro aberto simples (prova clássica de livro-texto).
export const Livro: React.FC<{p: number; y?: number}> = ({p, y = 440}) => (
	<svg style={{position: 'absolute', left: '50%', top: y, transform: `translate(-50%, ${(1 - p) * 40}px) scale(${0.85 + p * 0.15})`, opacity: p}} width={260} height={160} viewBox="0 0 260 160">
		<path d="M10 20 L128 8 L128 140 L10 150 Z" fill={COR.branco} />
		<path d="M250 20 L132 8 L132 140 L250 150 Z" fill="#e4ded0" />
		<line x1="128" y1="8" x2="128" y2="140" stroke="#c9c2ae" strokeWidth={3} />
		{[30, 50, 70, 90].map((yy) => (
			<line key={yy} x1={26} y1={yy} x2={112} y2={yy - 2} stroke="#b9b2a0" strokeWidth={3} />
		))}
		{[30, 50, 70, 90].map((yy) => (
			<line key={`r${yy}`} x1={148} y1={yy - 2} x2={234} y2={yy} stroke="#b9b2a0" strokeWidth={3} />
		))}
	</svg>
);

// Câmera cinematográfica: zoom/pan lento e contínuo por cima do conteúdo, pra parecer que a câmera está
// dentro da cena se movendo, não um cartão parado. Use em toda peça — mesmo um leve zoom já tira o ar de slide.
export const Camera: React.FC<{cena: CenaPeca; zoom?: [number, number]; x?: [number, number]; y?: [number, number]; children: React.ReactNode}> = ({
	cena,
	zoom = [1, 1.13],
	x = [0, 0],
	y = [0, 0],
	children,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const dur = Math.max(1, Math.round((cena.ate - cena.de) * fps));
	const p = interpolate(frame, [0, dur], [0, 1], lim);
	const s = zoom[0] + (zoom[1] - zoom[0]) * p;
	const tx = x[0] + (x[1] - x[0]) * p;
	const ty = y[0] + (y[1] - y[0]) * p;
	return <div style={{position: 'absolute', inset: 0, transform: `scale(${s}) translate(${tx}px, ${ty}px)`, transformOrigin: '50% 50%'}}>{children}</div>;
};

// Vinheta de cantos escuros (olhar de câmera/lente, não de cartaz).
export const Vinheta: React.FC<{forca?: number}> = ({forca = 0.55}) => (
	<div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 45%, transparent 35%, rgba(0,0,0,${forca}) 100%)`, pointerEvents: 'none'}} />
);

// Grade em primeiro plano, bem perto da câmera e desfocada — como se o espectador olhasse de dentro de
// uma cela pra fora, ou de trás de um objeto. Dá profundidade e a sensação de estar DENTRO da cena.
export const GradePrimeiroPlano: React.FC<{lado?: 'baixo' | 'esquerda' | 'direita'; p?: number}> = ({lado = 'baixo', p = 1}) => {
	const vertical = lado === 'baixo';
	const barras = Array.from({length: vertical ? 9 : 6});
	return (
		<div
			style={{
				position: 'absolute',
				inset: 0,
				opacity: p,
				filter: 'blur(3px)',
				display: 'flex',
				flexDirection: vertical ? 'row' : 'column',
				justifyContent: lado === 'direita' ? 'flex-end' : 'flex-start',
				alignItems: vertical ? 'flex-end' : undefined,
				gap: vertical ? 26 : 34,
				padding: vertical ? '0 10px' : '10px 0',
				pointerEvents: 'none',
			}}
		>
			{barras.map((_, i) => (
				<div
					key={i}
					style={{
						background: 'linear-gradient(180deg, #000 0%, #000 100%)',
						opacity: 0.92,
						width: vertical ? 18 : lado === 'direita' ? 140 - i * 6 : 140 - i * 6,
						height: vertical ? 260 - i * 4 : 18,
						borderRadius: 4,
					}}
				/>
			))}
		</div>
	);
};

// Silhueta de ombro/cabeça em primeiro plano (câmera "por cima do ombro" de alguém olhando a cena).
export const OmbroPrimeiroPlano: React.FC<{lado?: 'esquerda' | 'direita'; p?: number}> = ({lado = 'esquerda', p = 1}) => (
	<svg
		style={{position: 'absolute', bottom: -40, [lado === 'esquerda' ? 'left' : 'right']: -60, opacity: p, filter: 'blur(1px)'} as React.CSSProperties}
		width={320}
		height={420}
		viewBox="0 0 320 420"
	>
		<ellipse cx={lado === 'esquerda' ? 60 : 260} cy={430} rx={220} ry={190} fill="#05070a" opacity={0.96} />
		<circle cx={lado === 'esquerda' ? 150 : 170} cy={160} r={70} fill="#05070a" opacity={0.96} />
	</svg>
);

// =====================================================================================================
// AMBIENTES COMPLETOS — cenários em perspectiva de um ponto, com a câmera DENTRO do lugar.
// Cada ambiente é um SVG do tamanho do vídeo (com sobra nas bordas pra Camera poder deslizar) desenhado
// com projeção real: um ponto do mundo (X lateral, Y vertical — positivo pra baixo —, Z profundidade) vira
// tela em x = fugaX + X·f/Z, y = horizonte + Y·f/Z. Assim, portas/janelas/livros mais distantes ficam
// menores de verdade e o chão converge pro ponto de fuga. Coloque o ambiente DENTRO da <Camera>, antes dos
// personagens. Pés de Personagem entre y≈1100 e y≈1500 caem no chão de todos os ambientes.
// =====================================================================================================

type V3 = [number, number, number];
type Proj = {f: number; vx: number; vy: number};
const FOCO = 560;
const BORDA = 160;

const rnd = (i: number) => {
	const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
	return s - Math.floor(s);
};
const pr = (P: Proj, v: V3): [number, number] => [P.vx + (v[0] * P.f) / v[2], P.vy + (v[1] * P.f) / v[2]];
const pts = (P: Proj, vs: V3[]) =>
	vs
		.map((v) => {
			const [x, y] = pr(P, v);
			return `${x.toFixed(1)},${y.toFixed(1)}`;
		})
		.join(' ');
const k = (P: Proj, Z: number) => P.f / Z;
// Quadriláteros em cada plano: parede lateral (X fixo), chão/teto (Y fixo), plano frontal (Z fixo).
const pX = (X: number, z0: number, z1: number, y0: number, y1: number): V3[] => [
	[X, y0, z0],
	[X, y0, z1],
	[X, y1, z1],
	[X, y1, z0],
];
const pY = (Y: number, x0: number, x1: number, z0: number, z1: number): V3[] => [
	[x0, Y, z0],
	[x1, Y, z0],
	[x1, Y, z1],
	[x0, Y, z1],
];
const pZ = (Z: number, x0: number, x1: number, y0: number, y1: number): V3[] => [
	[x0, y0, Z],
	[x1, y0, Z],
	[x1, y1, Z],
	[x0, y1, Z],
];
const elChao = (X: number, Y: number, Z: number, rx: number, rz: number, n = 20): V3[] =>
	Array.from({length: n}, (_, i) => {
		const a = (i / n) * Math.PI * 2;
		return [X + rx * Math.cos(a), Y, Z + rz * Math.sin(a)] as V3;
	});
const elParede = (X: number, Y: number, Z: number, ry: number, rz: number, n = 20, irreg = 0): V3[] =>
	Array.from({length: n}, (_, i) => {
		const a = (i / n) * Math.PI * 2;
		const m = 1 + irreg * (rnd(i + X * 7 + Z * 13) - 0.5);
		return [X, Y + ry * m * Math.sin(a), Z + rz * m * Math.cos(a)] as V3;
	});
// Arco (porta/arcada) desenhado numa parede lateral: retângulo com meia-volta no topo.
const arcoParede = (X: number, zc: number, meia: number, base: number, nascente: number, n = 10): V3[] => [
	[X, base, zc - meia],
	...Array.from({length: n + 1}, (_, i) => {
		const a = (i / n) * Math.PI;
		return [X, nascente - meia * Math.sin(a), zc - meia * Math.cos(a)] as V3;
	}),
	[X, base, zc + meia],
];

const Q: React.FC<{P: Proj; v: V3[]; c: string; o?: number}> = ({P, v, c, o}) => <polygon points={pts(P, v)} fill={c} opacity={o} />;
const Ln: React.FC<{P: Proj; a: V3; b: V3; c: string; w: number; o?: number}> = ({P, a, b, c, w, o}) => {
	const [x1, y1] = pr(P, a);
	const [x2, y2] = pr(P, b);
	return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={(w * P.f) / ((a[2] + b[2]) / 2)} strokeLinecap="round" opacity={o} />;
};
const Pl: React.FC<{P: Proj; v: V3[]; c: string; w: number; o?: number}> = ({P, v, c, w, o}) => {
	const zm = v.reduce((s, q) => s + q[2], 0) / v.length;
	return <polyline points={pts(P, v)} fill="none" stroke={c} strokeWidth={(w * P.f) / zm} strokeLinejoin="round" strokeLinecap="round" opacity={o} />;
};
// Linha longa em profundidade (junta de piso, cano, friso) como faixa que afina com a distância.
const fioChao = (x: number, Y: number, z0: number, z1: number, w: number): V3[] => pY(Y, x - w / 2, x + w / 2, z0, z1);
const fioParede = (X: number, y: number, z0: number, z1: number, w: number): V3[] => pX(X, z0, z1, y - w / 2, y + w / 2);

// Moldura comum: SVG do tamanho do vídeo + sobra, entrada com p (opacidade + leve subida).
const Cenario: React.FC<{p: number; children: React.ReactNode}> = ({p, children}) => {
	const {width, height} = useVideoConfig();
	const pp = Math.min(1, Math.max(0, p));
	return (
		<svg
			style={{position: 'absolute', left: -BORDA, top: -BORDA, opacity: Math.min(1, pp * 1.5), transform: `translateY(${(1 - pp) * 24}px)`}}
			width={width + 2 * BORDA}
			height={height + 2 * BORDA}
			viewBox={`${-BORDA} ${-BORDA} ${width + 2 * BORDA} ${height + 2 * BORDA}`}
		>
			{children}
		</svg>
	);
};
const useProj = (horizonte: number, fugaX?: number): Proj => {
	const {width} = useVideoConfig();
	return {f: FOCO, vx: fugaX ?? width / 2, vy: horizonte};
};
const Tela: React.FC<{c: string; o?: number}> = ({c, o}) => {
	const {width, height} = useVideoConfig();
	return <rect x={-BORDA} y={-BORDA} width={width + 2 * BORDA} height={height + 2 * BORDA} fill={c} opacity={o} />;
};

const CORES_LIVRO = ['#7a3329', '#2f4a5e', '#7a6a3e', '#3d5a3e', '#8a5a3a', '#4a3a5a', '#a08a5a', '#5a2f3a', '#b5733f', '#3f5468'];

// Fileira de livros (lombadas) numa prateleira de parede lateral (plano X), entre z0 e z1, apoiados em yBase.
const LivrosParede: React.FC<{P: Proj; X: number; z0: number; z1: number; yBase: number; alt: number; semente: number; cores?: string[]}> = ({P, X, z0, z1, yBase, alt, semente, cores = CORES_LIVRO}) => {
	const out: React.ReactNode[] = [];
	let z = z0 + 0.01;
	let i = 0;
	while (z < z1 - 0.03) {
		const r = rnd(semente + i * 3.1);
		const larg = 0.035 + r * 0.04;
		const h = alt * (0.7 + rnd(semente + i * 5.7) * 0.3);
		const z2 = Math.min(z1 - 0.01, z + larg);
		if (rnd(semente + i * 9.3) > 0.93) {
			// livro tombado/inclinado: deixa um vão
			z = z2 + 0.03;
			i++;
			continue;
		}
		const cor = cores[Math.floor(rnd(semente + i * 1.7) * cores.length)];
		out.push(<Q key={i} P={P} v={pX(X, z, z2, yBase - h, yBase)} c={cor} />);
		out.push(<Q key={`f${i}`} P={P} v={pX(X, z, z2, yBase - h * 0.78, yBase - h * 0.72)} c="#000" o={0.18} />);
		z = z2 + 0.004;
		i++;
	}
	return <>{out}</>;
};
// Livros numa estante frontal (plano Z), entre x0 e x1, apoiados em yBase.
const LivrosFrente: React.FC<{P: Proj; Z: number; x0: number; x1: number; yBase: number; alt: number; semente: number; cores?: string[]}> = ({P, Z, x0, x1, yBase, alt, semente, cores = CORES_LIVRO}) => {
	const out: React.ReactNode[] = [];
	let x = x0 + 0.01;
	let i = 0;
	while (x < x1 - 0.03) {
		const larg = 0.035 + rnd(semente + i * 3.1) * 0.04;
		const h = alt * (0.7 + rnd(semente + i * 5.7) * 0.3);
		const x2 = Math.min(x1 - 0.01, x + larg);
		if (rnd(semente + i * 9.3) > 0.94) {
			x = x2 + 0.04;
			i++;
			continue;
		}
		const cor = cores[Math.floor(rnd(semente + i * 1.7) * cores.length)];
		out.push(<Q key={i} P={P} v={pZ(Z, x, x2, yBase - h, yBase)} c={cor} />);
		out.push(<Q key={`f${i}`} P={P} v={pZ(Z, x, x2, yBase - h * 0.8, yBase - h * 0.74)} c="#000" o={0.18} />);
		x = x2 + 0.004;
		i++;
	}
	return <>{out}</>;
};

// -----------------------------------------------------------------------------------------------------
// 1. PORÃO / CORREDOR DA PRISÃO — concreto, celas com grade dos dois lados em profundidade, teto baixo com
// vigas e canos, lâmpada pendurada balançando, placa suspensa e porta de saída ao fundo com luz vazando.
// -----------------------------------------------------------------------------------------------------
export type PoraoCompletoProps = {
	p?: number; // entrada 0..1
	horizonte?: number; // y do ponto de fuga (altura do olho). Padrão 860.
	fugaX?: number; // x do ponto de fuga. Padrão: centro do vídeo.
	luzFundo?: boolean; // porta de saída entreaberta com luz vazando no chão. Padrão true.
	lampadas?: boolean; // lâmpadas penduradas acesas. Padrão true.
	balanco?: number; // amplitude do balanço das lâmpadas (0 = parada). Padrão 1.
	piscar?: boolean; // lâmpada falhando. Padrão false.
	escuro?: number; // 0..1 escurece o ambiente (as luzes continuam acesas por cima). Padrão 0.
	placa?: string | null; // texto da placa suspensa no corredor. Padrão 'STANFORD COUNTY JAIL'; null esconde.
};
export const PoraoCompleto: React.FC<PoraoCompletoProps> = ({
	p = 1,
	horizonte = 860,
	fugaX,
	luzFundo = true,
	lampadas = true,
	balanco = 1,
	piscar = false,
	escuro = 0,
	placa = 'STANFORD COUNTY JAIL',
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const P = useProj(horizonte, fugaX);
	const W = 1.15;
	const YF = 1.4;
	const YC = -1.15;
	const ZN = 0.3;
	const ZF = 7.5;
	const luzK = piscar ? (rnd(Math.floor(t * 11)) > 0.2 ? 1 : 0.25) : 1;
	const portas = [6.6, 5.5, 4.4, 3.3, 2.2, 1.1];
	const LARG = 0.62;
	const TOPO = -0.45;

	const cela = (X: number, z: number, key: string) => {
		const kk = k(P, z + LARG / 2);
		const barras = Array.from({length: 7}, (_, i) => z + (LARG * (i + 0.5)) / 7);
		return (
			<g key={key}>
				<Q P={P} v={pX(X, z - 0.07, z + LARG + 0.07, TOPO - 0.09, YF)} c={COR.ferro} />
				<Q P={P} v={pX(X, z, z + LARG, TOPO, YF)} c="#0b0d10" />
				{/* catre lá dentro, sugerido */}
				<Q P={P} v={pX(X, z + 0.05, z + LARG - 0.05, 0.75, 0.88)} c="#1a1d22" />
				{barras.map((zb, i) => (
					<Ln key={i} P={P} a={[X, TOPO, zb]} b={[X, YF, zb]} c={COR.ferroClaro} w={0.026} />
				))}
				<Ln P={P} a={[X, TOPO + 0.18, z]} b={[X, TOPO + 0.18, z + LARG]} c={COR.ferroClaro} w={0.035} />
				<Ln P={P} a={[X, 0.55, z]} b={[X, 0.55, z + LARG]} c={COR.ferroClaro} w={0.035} />
				{/* fechadura */}
				<Q P={P} v={pX(X, z + LARG - 0.1, z + LARG - 0.02, 0.35, 0.5)} c="#2a2e34" />
				{/* plaqueta com número */}
				<Q P={P} v={pX(X, z + 0.16, z + LARG - 0.16, TOPO - 0.33, TOPO - 0.16)} c="#c9b98f" />
				<circle cx={pr(P, [X, TOPO - 0.245, z + LARG / 2])[0]} cy={pr(P, [X, TOPO - 0.245, z + LARG / 2])[1]} r={0.03 * kk} fill="#3a3528" />
			</g>
		);
	};

	const manchas: Array<[number, number, number, number]> = [
		[-W, -0.2, 1.6, 0.28],
		[-W, 0.85, 3.9, 0.32],
		[-W, -0.6, 5.0, 0.22],
		[W, -0.5, 2.7, 0.24],
		[W, 0.2, 4.95, 0.36],
		[W, 0.9, 1.6, 0.2],
	];
	const rachaduras: V3[][] = [
		[
			[-W, -1.1, 0.95],
			[-W, -0.82, 1.08],
			[-W, -0.7, 1.0],
			[-W, -0.38, 1.2],
			[-W, -0.2, 1.15],
		],
		[
			[W, -1.1, 3.05],
			[W, -0.85, 2.98],
			[W, -0.7, 3.1],
			[W, -0.45, 3.02],
		],
		[
			[-W, 1.4, 2.9],
			[-W, 1.15, 2.95],
			[-W, 1.0, 2.85],
		],
	];
	const lamps = lampadas ? [4.6, 1.4] : [];

	return (
		<Cenario p={p}>
			<Tela c={COR.noite1} />
			{/* teto, chão, paredes, fundo */}
			<Q P={P} v={pY(YC, -W, W, ZN, ZF)} c="#1d2026" />
			<Q P={P} v={pY(YF, -W, W, ZN, ZF)} c={COR.concreto} />
			<Q P={P} v={pX(-W, ZN, ZF, YC, YF)} c="#3b4049" />
			<Q P={P} v={pX(W, ZN, ZF, YC, YF)} c="#343940" />
			<Q P={P} v={pZ(ZF, -W, W, YC, YF)} c="#2a2e35" />
			{/* barra pintada na parte de baixo das paredes + friso */}
			<Q P={P} v={pX(-W, ZN, ZF, 0.45, YF)} c="#30353d" />
			<Q P={P} v={pX(W, ZN, ZF, 0.45, YF)} c="#2b2f36" />
			<Q P={P} v={pZ(ZF, -W, W, 0.45, YF)} c="#24282e" />
			<Q P={P} v={fioParede(-W, 0.45, ZN, ZF, 0.04)} c="#7a3b35" />
			<Q P={P} v={fioParede(W, 0.45, ZN, ZF, 0.04)} c="#6a332e" />
			<Q P={P} v={pZ(ZF, -W, W, 0.43, 0.47)} c="#5e2e2a" />
			{/* rodapé escuro */}
			<Q P={P} v={pX(-W, ZN, ZF, YF - 0.07, YF)} c="#1b1e23" />
			<Q P={P} v={pX(W, ZN, ZF, YF - 0.07, YF)} c="#1b1e23" />
			{/* juntas do piso de concreto */}
			{Array.from({length: 12}, (_, i) => 0.6 + i * 0.6).map((z) => (
				<Ln key={`j${z}`} P={P} a={[-W, YF, z]} b={[W, YF, z]} c={COR.concretoEscuro} w={0.014} />
			))}
			<Q P={P} v={fioChao(-0.45, YF, ZN, ZF, 0.02)} c={COR.concretoEscuro} />
			<Q P={P} v={fioChao(0.45, YF, ZN, ZF, 0.02)} c={COR.concretoEscuro} />
			{/* manchas de umidade no chão, poça e ralo */}
			<Q P={P} v={elChao(0.3, YF, 3.6, 0.38, 0.28)} c="#383c43" />
			<Q P={P} v={elChao(0.26, YF, 3.58, 0.18, 0.12)} c="#5c636c" o={0.6} />
			<Q P={P} v={elChao(-0.55, YF, 1.6, 0.3, 0.22)} c="#3d4148" o={0.8} />
			<Q P={P} v={pY(YF, -0.13, 0.13, 2.7, 2.92)} c={COR.ferro} />
			{[0, 1, 2, 3].map((i) => (
				<Ln key={`r${i}`} P={P} a={[-0.1 + i * 0.066, YF, 2.72]} b={[-0.1 + i * 0.066, YF, 2.9]} c="#3a3f47" w={0.012} />
			))}
			{/* manchas e rachaduras nas paredes */}
			{manchas.map(([X, Y, Z, r], i) => (
				<Q key={`m${i}`} P={P} v={elParede(X, Y, Z, r, r * 1.3, 22, 0.5)} c="#000" o={0.13} />
			))}
			<Q P={P} v={pX(-W, 2.88, 2.94, YC, -0.2)} c="#000" o={0.16} />
			<Q P={P} v={pX(W, 4.1, 4.15, YC, 0.1)} c="#000" o={0.14} />
			{rachaduras.map((v, i) => (
				<Pl key={`c${i}`} P={P} v={v} c="#16181c" w={0.014} />
			))}
			{/* porta de saída ao fundo */}
			<Q P={P} v={pZ(ZF, -0.42, 0.42, -0.5, YF)} c={COR.ferro} />
			{luzFundo ? (
				<>
					<Q P={P} v={pZ(ZF, -0.6, 0.6, -0.7, YF)} c={COR.luz} o={0.08} />
					<Q P={P} v={pZ(ZF, -0.34, 0.34, -0.42, YF)} c="#ffe7b0" />
					<Q P={P} v={pZ(ZF, -0.34, 0.08, -0.42, YF)} c="#3a3f47" />
					<Q P={P} v={pZ(ZF, 0.0, 0.05, 0.4, 0.5)} c={COR.ferro} />
				</>
			) : (
				<Q P={P} v={pZ(ZF, -0.34, 0.34, -0.42, YF)} c="#3a3f47" />
			)}
			{/* celas dos dois lados, do fundo pra frente */}
			{portas.map((z, i) => (
				<React.Fragment key={`p${i}`}>
					{cela(-W, z, `l${i}`)}
					{cela(W, z, `d${i}`)}
				</React.Fragment>
			))}
			{/* vigas do teto (fundo → frente) */}
			{[7, 6, 5, 4, 3, 2, 1].map((z) => (
				<React.Fragment key={`v${z}`}>
					<Q P={P} v={pY(YC + 0.1, -W, W, z, z + 0.12)} c="#15181d" />
					<Q P={P} v={pZ(z, -W, W, YC, YC + 0.1)} c="#262a31" />
				</React.Fragment>
			))}
			{/* canos correndo pelo teto, com braçadeiras */}
			<Q P={P} v={pX(0.72, ZN, ZF, YC + 0.12, YC + 0.26)} c="#4a5058" />
			<Q P={P} v={pX(0.72, ZN, ZF, YC + 0.14, YC + 0.17)} c="#6e757e" />
			<Q P={P} v={pX(0.48, ZN, ZF, YC + 0.12, YC + 0.2)} c="#5a4a3e" />
			{[1, 2, 3, 4, 5, 6, 7].map((z) => (
				<Ln key={`b${z}`} P={P} a={[0.72, YC + 0.1, z]} b={[0.72, YC + 0.27, z]} c={COR.ferro} w={0.03} />
			))}
			{/* placa suspensa */}
			{placa ? (
				<g>
					<Ln P={P} a={[-0.42, YC, 3.0]} b={[-0.42, -0.9, 3.0]} c={COR.ferro} w={0.012} />
					<Ln P={P} a={[0.42, YC, 3.0]} b={[0.42, -0.9, 3.0]} c={COR.ferro} w={0.012} />
					<Q P={P} v={pZ(3.0, -0.62, 0.62, -0.93, -0.64)} c="#2a1f16" />
					<Q P={P} v={pZ(3.0, -0.59, 0.59, -0.905, -0.665)} c="#d9cfb4" />
					<text
						x={pr(P, [0, -0.785, 3.0])[0]}
						y={pr(P, [0, -0.785, 3.0])[1]}
						fill="#1b1e23"
						fontFamily={fonte}
						fontWeight={800}
						fontSize={Math.min(0.13 * k(P, 3), (1.08 * k(P, 3)) / (placa.length * 0.64))}
						textAnchor="middle"
						dominantBaseline="central"
					>
						{placa}
					</text>
				</g>
			) : null}
			{escuro > 0 ? <Tela c={COR.noite1} o={Math.min(1, escuro)} /> : null}
			{/* luz vazando da porta do fundo */}
			{luzFundo ? (
				<Q
					P={P}
					v={[
						[-0.34, YF, ZF],
						[0.34, YF, ZF],
						[0.95, YF, ZF - 3.2],
						[-0.2, YF, ZF - 3.2],
					]}
					c={COR.luz}
					o={0.13}
				/>
			) : null}
			{luzFundo ? <Q P={P} v={pZ(ZF, -0.34, 0.34, -0.42, YF)} c="#ffe7b0" o={escuro * 0.9} /> : null}
			{luzFundo ? <Q P={P} v={pZ(ZF, -0.34, 0.08, -0.42, YF)} c="#3a3f47" o={escuro * 0.9} /> : null}
			{/* lâmpadas penduradas (balançam) */}
			{lamps.map((z, i) => {
				const ang = balanco * 0.13 * Math.sin(t * 1.3 + i * 1.7);
				const L = 0.45;
				const bx = L * Math.sin(ang);
				const by = YC + L * Math.cos(ang);
				const kk = k(P, z);
				const [sx, sy] = pr(P, [bx, by, z]);
				const sl = pr(P, [bx - 0.17, by + 0.12, z]);
				const sr = pr(P, [bx + 0.17, by + 0.12, z]);
				return (
					<g key={`l${i}`}>
						<Q P={P} v={elParede(-W, 0.25, z, 0.9, 0.95)} c={COR.luz} o={0.05 * luzK} />
						<Q P={P} v={elParede(W, 0.25, z, 0.9, 0.95)} c={COR.luz} o={0.05 * luzK} />
						<polygon
							points={`${sl[0]},${sl[1]} ${sr[0]},${sr[1]} ${pr(P, [bx + 0.85, YF, z])[0]},${pr(P, [bx + 0.85, YF, z])[1]} ${pr(P, [bx - 0.85, YF, z])[0]},${pr(P, [bx - 0.85, YF, z])[1]}`}
							fill={COR.luz}
							opacity={0.06 * luzK}
						/>
						<Q P={P} v={elChao(bx, YF, z, 0.85, 0.55)} c={COR.luz} o={0.14 * luzK} />
						<Ln P={P} a={[0, YC, z]} b={[bx, by, z]} c="#0a0b0d" w={0.012} />
						<polygon
							points={`${sx - 0.06 * kk},${sy} ${sx + 0.06 * kk},${sy} ${sr[0]},${sr[1]} ${sl[0]},${sl[1]}`}
							fill="#2f343b"
						/>
						<circle cx={sx} cy={sy + 0.15 * kk} r={0.065 * kk} fill={COR.luz} opacity={0.35 + 0.65 * luzK} />
						<circle cx={sx} cy={sy + 0.15 * kk} r={0.16 * kk} fill={COR.luz} opacity={0.12 * luzK} />
					</g>
				);
			})}
		</Cenario>
	);
};

// -----------------------------------------------------------------------------------------------------
// 2. CAMPUS UNIVERSITÁRIO EXTERNO — pátio com arcadas de arenito e telhado de telha (prédio em "U" com alas
// que vêm na direção da câmera), torre ao longe, céu com estrelas e lua, morros, gramado, caminho calçado,
// palmeiras e postes de luz em perspectiva.
// -----------------------------------------------------------------------------------------------------
export type CampusCompletoProps = {
	p?: number;
	horizonte?: number; // padrão 940
	fugaX?: number;
	noite?: boolean; // padrão true (dia: céu claro, sem estrelas, postes apagados)
	janelasAcesas?: number; // fração 0..1 de janelas acesas. Padrão 0.35
	lua?: boolean; // padrão true (só aparece à noite)
	torre?: boolean; // torre ao fundo. Padrão true
	placa?: string | null; // texto no friso do prédio central. Padrão null
};
export const CampusCompleto: React.FC<CampusCompletoProps> = ({p = 1, horizonte = 940, fugaX, noite = true, janelasAcesas = 0.35, lua = true, torre = true, placa = null}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const P = useProj(horizonte, fugaX);
	const N = noite;
	const C = {
		ceu: N ? ['#0b1220', '#0f182b', '#142037', '#1a2842'] : ['#b7cfdc', '#c5d9e1', '#d3e1e3', '#e2e6dc'],
		morro: N ? '#151d30' : '#a7b8a4',
		arvoreLonge: N ? '#111828' : '#8aa088',
		torre: N ? '#4e4a48' : '#c6b18a',
		arenito: N ? '#7d6e5c' : COR.arenito,
		arenitoSombra: N ? '#62564a' : '#bfa274',
		arenitoEscuro: N ? '#4a4036' : COR.arenitoEscuro,
		telha: N ? '#6b3528' : COR.telha,
		telhaEscura: N ? '#4e271e' : '#8a4330',
		janela: N ? '#182033' : '#4a5a6a',
		acesa: '#f2c66e',
		arco: N ? '#10141c' : '#4a443c',
		piso: N ? '#363941' : '#bdb3a0',
		pisoLinha: N ? '#2c2f36' : '#a89e8a',
		caminho: N ? '#43464f' : '#d0c6b2',
		grama: N ? '#1f3328' : '#6f9a5e',
		gramaEscura: N ? '#172820' : '#5c8450',
		arbusto: N ? '#1a2c22' : '#4f7a46',
		tronco: N ? '#3a2e24' : '#7a5a3e',
		folha: N ? '#1d3a2a' : '#4d8a4a',
		poste: '#15181d',
	};
	const YG = 1.6;
	const ZM = 5.2; // fachada principal
	const ZA = 2.6; // frente das alas
	const XA = 2.7; // alas
	const {width} = useVideoConfig();
	const ceuH = horizonte + BORDA;
	const acesa = (s: number) => rnd(s) < janelasAcesas;

	const janelaFrente = (x: number, y0: number, y1: number, s: number, key: string) => (
		<g key={key}>
			<Q P={P} v={pZ(ZM, x - 0.2, x + 0.2, y0 - 0.04, y1 + 0.04)} c={C.arenitoEscuro} />
			<Q P={P} v={pZ(ZM, x - 0.16, x + 0.16, y0, y1)} c={acesa(s) ? C.acesa : C.janela} />
			<Ln P={P} a={[x, y0, ZM]} b={[x, y1, ZM]} c={C.arenitoEscuro} w={0.025} />
			<Ln P={P} a={[x - 0.16, (y0 + y1) / 2, ZM]} b={[x + 0.16, (y0 + y1) / 2, ZM]} c={C.arenitoEscuro} w={0.025} />
		</g>
	);
	const arcoFrente = (x: number, meia: number, key: string) => {
		const kk = k(P, ZM);
		const [lx, ly] = pr(P, [x - meia, YG, ZM]);
		const [, sy] = pr(P, [x - meia, 0.75, ZM]);
		const [rx] = pr(P, [x + meia, 0.75, ZM]);
		return <path key={key} d={`M${lx},${ly} L${lx},${sy} A${meia * kk},${meia * kk} 0 0 1 ${rx},${sy} L${rx},${ly} Z`} fill={C.arco} />;
	};
	const ala = (s: -1 | 1) => {
		const X = s * XA;
		const face = s < 0 ? C.arenito : C.arenitoSombra;
		const zs = [4.9, 4.25, 3.6, 2.95];
		return (
			<g>
				<Q P={P} v={pX(X, ZA, ZM, -2.2, YG)} c={face} />
				<Q P={P} v={pX(X, ZA, ZM, -2.2, -2.05)} c={C.arenitoEscuro} />
				<Q P={P} v={pX(X, ZA, ZM, 0.15, 0.42)} c={C.arenitoEscuro} o={0.55} />
				{zs.map((zc, i) => (
					<React.Fragment key={i}>
						<Q P={P} v={arcoParede(X, zc, 0.24, YG, 0.75)} c={C.arco} />
						{[
							[-0.75, -0.15],
							[-1.8, -1.2],
						].map(([y0, y1], r) => (
							<React.Fragment key={r}>
								<Q P={P} v={pX(X, zc - 0.2, zc + 0.2, y0 - 0.04, y1 + 0.04)} c={C.arenitoEscuro} />
								<Q P={P} v={pX(X, zc - 0.16, zc + 0.16, y0, y1)} c={acesa(s * 31 + i * 7 + r * 3) ? C.acesa : C.janela} />
								<Ln P={P} a={[X, y0, zc]} b={[X, y1, zc]} c={C.arenitoEscuro} w={0.025} />
							</React.Fragment>
						))}
					</React.Fragment>
				))}
				{/* telhado da ala */}
				<Q
					P={P}
					v={[
						[X, -2.2, ZA - 0.1],
						[X, -2.2, ZM],
						[X + s * 0.9, -2.95, ZM],
						[X + s * 0.9, -2.95, ZA - 0.1],
					]}
					c={C.telha}
				/>
				{[0.25, 0.5, 0.75].map((f) => (
					<Ln key={f} P={P} a={[X + s * 0.9 * f, -2.2 - 0.75 * f, ZA - 0.1]} b={[X + s * 0.9 * f, -2.2 - 0.75 * f, ZM]} c={C.telhaEscura} w={0.03} />
				))}
				{/* cabeceira da ala (face voltada pra câmera) */}
				<Q P={P} v={pZ(ZA, X, X + s * 1.8, -2.2, YG)} c={C.arenito} />
				<Q P={P} v={pZ(ZA, X, X + s * 1.8, -2.2, -2.05)} c={C.arenitoEscuro} />
				<Q P={P} v={pZ(ZA, X + s * 0.45, X + s * 1.15, 0.0, YG)} c={C.arco} />
				{/* arbustos ao pé da ala */}
				{Array.from({length: 9}, (_, i) => ZA + 0.2 + i * 0.29).map((z, i) => {
					const [bx, by] = pr(P, [X - s * 0.18, YG - 0.12, z]);
					return <circle key={`a${i}`} cx={bx} cy={by} r={0.2 * k(P, z)} fill={C.arbusto} />;
				})}
			</g>
		);
	};
	const palmeira = (x: number, z: number, key: string) => {
		const kk = k(P, z);
		const [bx, by] = pr(P, [x, YG, z]);
		const [tx, ty] = pr(P, [x + 0.2, YG - 2.7, z]);
		const folhas = Array.from({length: 9}, (_, j) => (j / 9) * Math.PI * 2 + 0.3);
		return (
			<g key={key}>
				<ellipse cx={bx} cy={by} rx={0.3 * kk} ry={0.06 * kk} fill="#000" opacity={0.25} />
				<polygon points={`${bx - 0.06 * kk},${by} ${bx + 0.06 * kk},${by} ${tx + 0.04 * kk},${ty} ${tx - 0.04 * kk},${ty}`} fill={C.tronco} />
				{[0.2, 0.4, 0.6, 0.8].map((f) => (
					<line key={f} x1={bx + (tx - bx) * f - 0.05 * kk} y1={by + (ty - by) * f} x2={bx + (tx - bx) * f + 0.05 * kk} y2={by + (ty - by) * f} stroke="#000" strokeOpacity={0.25} strokeWidth={0.015 * kk} />
				))}
				{folhas.map((a, j) => {
					const ex = tx + Math.cos(a) * 0.95 * kk;
					const ey = ty + Math.sin(a) * 0.4 * kk + 0.35 * kk;
					const cx = tx + Math.cos(a) * 0.5 * kk;
					const cy = ty + Math.sin(a) * 0.2 * kk - 0.22 * kk;
					return <path key={j} d={`M${tx},${ty} Q${cx},${cy - 0.08 * kk} ${ex},${ey} Q${cx},${cy + 0.1 * kk} ${tx},${ty} Z`} fill={j % 2 ? C.folha : C.gramaEscura} />;
				})}
			</g>
		);
	};
	const poste = (x: number, z: number, key: string) => {
		const kk = k(P, z);
		const [bx, by] = pr(P, [x, YG, z]);
		const [, ty] = pr(P, [x, YG - 1.9, z]);
		return (
			<g key={key}>
				{N ? <Q P={P} v={elChao(x, YG, z, 0.7, 0.5)} c={C.acesa} o={0.16} /> : null}
				<rect x={bx - 0.025 * kk} y={ty} width={0.05 * kk} height={by - ty} fill={C.poste} />
				<rect x={bx - 0.06 * kk} y={by - 0.12 * kk} width={0.12 * kk} height={0.12 * kk} fill={C.poste} />
				{N ? <circle cx={bx} cy={ty - 0.1 * kk} r={0.32 * kk} fill={C.acesa} opacity={0.18} /> : null}
				<rect x={bx - 0.08 * kk} y={ty - 0.22 * kk} width={0.16 * kk} height={0.22 * kk} rx={0.02 * kk} fill={N ? C.acesa : '#d9dcd6'} />
				<polygon points={`${bx - 0.11 * kk},${ty - 0.22 * kk} ${bx + 0.11 * kk},${ty - 0.22 * kk} ${bx},${ty - 0.32 * kk}`} fill={C.poste} />
				<rect x={bx - 0.09 * kk} y={ty - 0.01 * kk} width={0.18 * kk} height={0.03 * kk} fill={C.poste} />
			</g>
		);
	};
	const objetosChao: Array<{z: number; el: (key: string) => React.ReactNode}> = [
		...[4.5, 3.4].flatMap((z) => [
			{z, el: (key: string) => palmeira(-1.5, z, key)},
			{z, el: (key: string) => palmeira(1.5, z, key + 'd')},
		]),
		...[4.4, 2.9, 1.6].flatMap((z) => [
			{z, el: (key: string) => poste(-0.78, z, key)},
			{z, el: (key: string) => poste(0.78, z, key + 'd')},
		]),
	].sort((a, b) => b.z - a.z);

	return (
		<Cenario p={p}>
			{/* céu em faixas chapadas */}
			{C.ceu.map((c, i) => {
				const fr = [0, 0.38, 0.62, 0.82][i];
				return <rect key={i} x={-BORDA} y={-BORDA + ceuH * fr} width={width + 2 * BORDA} height={ceuH * (1 - fr) + 2} fill={c} />;
			})}
			{N
				? Array.from({length: 90}, (_, i) => {
						const sx = -BORDA + rnd(i) * (width + 2 * BORDA);
						const sy = -BORDA + rnd(i + 200) * (horizonte - 300 + BORDA);
						const o = 0.35 + 0.65 * Math.abs(Math.sin(t * (0.8 + rnd(i + 400)) + i));
						return <circle key={`e${i}`} cx={sx} cy={sy} r={1.2 + rnd(i + 600) * 2.4} fill={COR.branco} opacity={o} />;
					})
				: [
						[220, 260, 1],
						[760, 180, 0.8],
						[980, 380, 0.6],
					].map(([x, y, s], i) => (
						<g key={`n${i}`} fill="#f4f1e8" opacity={0.85}>
							<ellipse cx={x} cy={y} rx={110 * s} ry={34 * s} />
							<ellipse cx={x - 40 * s} cy={y - 22 * s} rx={60 * s} ry={34 * s} />
							<ellipse cx={x + 45 * s} cy={y - 16 * s} rx={50 * s} ry={28 * s} />
						</g>
					))}
			{N && lua ? (
				<g>
					<circle cx={width * 0.77} cy={230} r={110} fill={COR.branco} opacity={0.06} />
					<circle cx={width * 0.77} cy={230} r={58} fill={COR.branco} opacity={0.95} />
					<circle cx={width * 0.77 - 18} cy={215} r={9} fill="#000" opacity={0.07} />
					<circle cx={width * 0.77 + 20} cy={245} r={13} fill="#000" opacity={0.07} />
					<circle cx={width * 0.77 + 12} cy={205} r={5} fill="#000" opacity={0.07} />
				</g>
			) : null}
			{/* morros e árvores ao longe */}
			<polygon
				points={`${-BORDA},${horizonte} ${Array.from({length: 13}, (_, i) => {
					const x = -BORDA + (i / 12) * (width + 2 * BORDA);
					return `${x},${horizonte - 70 - Math.sin(i * 1.3) * 35 - rnd(i + 50) * 30}`;
				}).join(' ')} ${width + BORDA},${horizonte}`}
				fill={C.morro}
			/>
			{Array.from({length: 26}, (_, i) => (
				<circle key={`t${i}`} cx={-BORDA + i * ((width + 2 * BORDA) / 25)} cy={horizonte - 18} r={26 + rnd(i + 90) * 26} fill={C.arvoreLonge} />
			))}
			<rect x={-BORDA} y={horizonte - 20} width={width + 2 * BORDA} height={40} fill={C.arvoreLonge} />
			{/* torre ao fundo */}
			{torre ? (
				<g>
					<Q P={P} v={pZ(16, 1.25, 2.25, -9.2, YG)} c={C.torre} />
					<Q P={P} v={pZ(16, 1.15, 2.35, -9.4, -9.1)} c={C.arenitoEscuro} />
					{[-8.7, -8.1].map((y) => (
						<Q key={y} P={P} v={pZ(16, 1.45, 2.05, y, y + 0.35)} c={N ? C.acesa : C.janela} o={N ? 0.85 : 1} />
					))}
					<path
						d={(() => {
							const [l, y] = pr(P, [1.3, -9.4, 16]);
							const [r] = pr(P, [2.2, -9.4, 16]);
							const kk = k(P, 16);
							return `M${l},${y} A${0.45 * kk},${0.6 * kk} 0 0 1 ${r},${y} Z`;
						})()}
						fill={C.telha}
					/>
				</g>
			) : null}
			{/* chão do pátio */}
			<Q P={P} v={pY(YG, -9, 9, 0.3, ZM)} c={C.piso} />
			{/* telhado e fachada do prédio central */}
			<Q
				P={P}
				v={[
					[-XA - 0.2, -2.2, ZM],
					[XA + 0.2, -2.2, ZM],
					[XA + 0.2, -2.95, ZM + 0.8],
					[-XA - 0.2, -2.95, ZM + 0.8],
				]}
				c={C.telha}
			/>
			{[0.33, 0.66].map((f) => (
				<Ln key={f} P={P} a={[-XA - 0.2, -2.2 - 0.75 * f, ZM + 0.8 * f]} b={[XA + 0.2, -2.2 - 0.75 * f, ZM + 0.8 * f]} c={C.telhaEscura} w={0.03} />
			))}
			<Q P={P} v={pZ(ZM, -XA, XA, -2.2, YG)} c={C.arenito} />
			<Q P={P} v={pZ(ZM, -XA, XA, -2.2, -2.05)} c={C.arenitoEscuro} />
			<Q P={P} v={pZ(ZM, -XA, XA, 0.15, 0.42)} c={C.arenitoSombra} />
			{Array.from({length: 7}, (_, i) => -2.1 + i * 0.7).map((x, i) => (
				<React.Fragment key={`f${i}`}>
					{arcoFrente(x, i === 3 ? 0.3 : 0.24, `a${i}`)}
					{janelaFrente(x, -0.75, -0.15, i * 13 + 1, `j1${i}`)}
					{janelaFrente(x, -1.8, -1.2, i * 17 + 5, `j2${i}`)}
				</React.Fragment>
			))}
			{/* frontão central com óculo */}
			<Q
				P={P}
				v={[
					[-0.85, -2.2, ZM - 0.02],
					[0.85, -2.2, ZM - 0.02],
					[0, -3.1, ZM - 0.02],
				]}
				c={C.telhaEscura}
			/>
			<Q
				P={P}
				v={[
					[-0.72, -2.2, ZM - 0.02],
					[0.72, -2.2, ZM - 0.02],
					[0, -2.98, ZM - 0.02],
				]}
				c={C.arenito}
			/>
			<circle cx={pr(P, [0, -2.52, ZM])[0]} cy={pr(P, [0, -2.52, ZM])[1]} r={0.16 * k(P, ZM)} fill={N ? C.acesa : C.janela} />
			{placa ? (
				<text
					x={pr(P, [0, 0.285, ZM])[0]}
					y={pr(P, [0, 0.285, ZM])[1]}
					fill={N ? '#e9dcc0' : '#4a3a28'}
					fontFamily={fonte}
					fontWeight={800}
					fontSize={Math.min(0.2 * k(P, ZM), (4.6 * k(P, ZM)) / (placa.length * 0.66))}
					letterSpacing="0.12em"
					textAnchor="middle"
					dominantBaseline="central"
				>
					{placa}
				</text>
			) : null}
			{Array.from({length: 15}, (_, i) => -2.5 + i * 0.36)
				.filter((x) => Math.abs(x) > 0.5)
				.map((x, i) => {
					const [bx, by] = pr(P, [x, YG - 0.12, ZM - 0.15]);
					return <circle key={`b${i}`} cx={bx} cy={by} r={0.2 * k(P, ZM - 0.15)} fill={C.arbusto} />;
				})}
			{/* gramados, caminho e juntas do calçamento */}
			<Q P={P} v={pY(YG, -2.5, -0.6, 2.85, 4.95)} c={C.gramaEscura} />
			<Q P={P} v={pY(YG, -2.45, -0.65, 2.9, 4.9)} c={C.grama} />
			<Q P={P} v={pY(YG, 0.6, 2.5, 2.85, 4.95)} c={C.gramaEscura} />
			<Q P={P} v={pY(YG, 0.65, 2.45, 2.9, 4.9)} c={C.grama} />
			<Q P={P} v={pY(YG, -0.55, 0.55, 0.3, ZM - 0.05)} c={C.caminho} />
			{Array.from({length: 12}, (_, i) => 0.6 + i * 0.4).map((z) => (
				<Ln key={`z${z}`} P={P} a={[z < 2.85 ? -XA : -0.55, YG, z]} b={[z < 2.85 ? XA : 0.55, YG, z]} c={C.pisoLinha} w={0.012} />
			))}
			{[-2.2, -1.65, -1.1, 1.1, 1.65, 2.2].map((x) => (
				<Q key={`x${x}`} P={P} v={fioChao(x, YG, 0.3, 2.85, 0.012)} c={C.pisoLinha} />
			))}
			{[-0.55, 0, 0.55].map((x) => (
				<Q key={`c${x}`} P={P} v={fioChao(x, YG, 0.3, ZM - 0.05, 0.012)} c={C.pisoLinha} />
			))}
			{/* alas (por cima do pátio, frente das paredes) */}
			{ala(-1)}
			{ala(1)}
			{/* palmeiras e postes, do fundo pra frente */}
			{objetosChao.map((o, i) => o.el(`o${i}`))}
		</Cenario>
	);
};

// -----------------------------------------------------------------------------------------------------
// 3. ESCRITÓRIO / DIRETORIA — sala dos anos 70: janela com persiana (noite lá fora), diploma e gráfico na
// parede, relógio, lambri de madeira, quadro de cortiça com papéis e fios (investigação), porta com vidro
// fosco, estante de livros/fichários, arquivo de aço, luminária fluorescente no teto, tapete, cadeira.
// A mesa (MesaEscritorio) vem junto por padrão; pra pôr um Personagem ATRÁS da mesa, use mesa={false} e
// desenhe <MesaEscritorio/> depois do Personagem (pés do personagem em y≈1100–1150).
// -----------------------------------------------------------------------------------------------------
export type EscritorioCompletoProps = {
	p?: number;
	horizonte?: number; // padrão 860
	fugaX?: number;
	noite?: boolean; // céu da janela. Padrão true
	persiana?: number; // 0..1 quanto a persiana está baixada. Padrão 0.45
	mesa?: boolean; // desenha a MesaEscritorio junto. Padrão true
	cadeira?: boolean; // cadeira atrás da mesa. Padrão true
	documentos?: number; // pilhas de papel sobre a mesa (repassado à MesaEscritorio). Padrão 2
	quadroCortica?: boolean; // quadro de cortiça com papéis e fios na parede esquerda. Padrão true
	luz?: boolean; // luminária do teto acesa. Padrão true
};
export const EscritorioCompleto: React.FC<EscritorioCompletoProps> = ({
	p = 1,
	horizonte = 860,
	fugaX,
	noite = true,
	persiana = 0.45,
	mesa = true,
	cadeira = true,
	documentos = 2,
	quadroCortica = true,
	luz = true,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const P = useProj(horizonte, fugaX);
	const W = 1.6;
	const YF = 1.3;
	const YC = -1.35;
	const ZN = 0.3;
	const ZF = 3.4;
	const kF = k(P, ZF);
	const C = {
		fundo: '#5c6354',
		esq: '#535a4b',
		dir: '#4b5144',
		teto: '#3a3d38',
		tetoLinha: '#30332e',
		chao: '#5e4632',
		chaoLinha: '#4b3826',
		lambri: '#4a3323',
		friso: COR.madeira,
		moldura: '#2a1f16',
		ceuJanela: noite ? '#0f1829' : '#bcd3df',
	};
	const [rcx, rcy] = pr(P, [1.18, -0.78, ZF]);
	const ang = (t * 6) % 360;
	const papeis: Array<[number, number, number, number]> = [
		[1.2, -0.75, 0.22, 0.28],
		[1.5, -0.45, 0.2, 0.24],
		[1.75, -0.72, 0.22, 0.2],
		[1.3, -0.3, 0.18, 0.15],
		[1.68, -0.35, 0.16, 0.2],
	];
	const pinos: V3[] = papeis.map(([z, y]) => [-W, y + 0.02, z]);

	return (
		<Cenario p={p}>
			<Tela c="#1b1d1a" />
			<Q P={P} v={pY(YC, -W, W, ZN, ZF)} c={C.teto} />
			<Q P={P} v={pY(YF, -W, W, ZN, ZF)} c={C.chao} />
			<Q P={P} v={pX(-W, ZN, ZF, YC, YF)} c={C.esq} />
			<Q P={P} v={pX(W, ZN, ZF, YC, YF)} c={C.dir} />
			<Q P={P} v={pZ(ZF, -W, W, YC, YF)} c={C.fundo} />
			{/* forro em placas */}
			{[-1.0, -0.4, 0.2, 0.8].map((x) => (
				<Q key={`fx${x}`} P={P} v={fioChao(x + 0.1, YC, ZN, ZF, 0.015)} c={C.tetoLinha} />
			))}
			{[0.9, 1.5, 2.1, 2.7].map((z) => (
				<Ln key={`fz${z}`} P={P} a={[-W, YC, z]} b={[W, YC, z]} c={C.tetoLinha} w={0.015} />
			))}
			{/* luminária fluorescente */}
			<Q P={P} v={pY(YC, -0.5, 0.5, 1.9, 2.7)} c="#8d918c" />
			<Q P={P} v={pY(YC + 0.001, -0.44, 0.44, 1.96, 2.64)} c={luz ? '#eef2ee' : '#9aa09a'} />
			{/* tacos do piso */}
			{Array.from({length: 17}, (_, i) => -W + i * 0.2).map((x) => (
				<Q key={`px${x}`} P={P} v={fioChao(x, YF, ZN, ZF, 0.012)} c={C.chaoLinha} />
			))}
			{Array.from({length: 16}, (_, i) => i).map((i) => {
				const x = -W + i * 0.2;
				const z = 0.7 + (i % 3) * 0.45;
				return (
					<React.Fragment key={`pz${i}`}>
						<Ln P={P} a={[x, YF, z]} b={[x + 0.2, YF, z]} c={C.chaoLinha} w={0.012} />
						<Ln P={P} a={[x, YF, z + 1.35]} b={[x + 0.2, YF, z + 1.35]} c={C.chaoLinha} w={0.012} />
					</React.Fragment>
				);
			})}
			{/* tapete */}
			<Q P={P} v={pY(YF, -1.15, 1.15, 1.0, 3.05)} c="#8a4a3e" />
			<Q P={P} v={pY(YF, -1.05, 1.05, 1.08, 2.97)} c="#6e2f33" />
			<Q P={P} v={pY(YF, -0.75, 0.75, 1.35, 2.7)} c="#8a4a3e" o={0.35} />
			{/* lambri de madeira nas três paredes */}
			<Q P={P} v={pX(-W, ZN, ZF, 0.35, YF)} c={C.lambri} />
			<Q P={P} v={pX(W, ZN, ZF, 0.35, YF)} c="#432e20" />
			<Q P={P} v={pZ(ZF, -W, W, 0.35, YF)} c="#4f3726" />
			<Q P={P} v={fioParede(-W, 0.35, ZN, ZF, 0.05)} c={C.friso} />
			<Q P={P} v={fioParede(W, 0.35, ZN, ZF, 0.05)} c={C.friso} />
			<Q P={P} v={pZ(ZF, -W, W, 0.325, 0.375)} c={C.friso} />
			{Array.from({length: 7}, (_, i) => -1.35 + i * 0.45).map((x) => (
				<Q key={`lb${x}`} P={P} v={pZ(ZF, x, x + 0.36, 0.48, YF - 0.12)} c="#000" o={0.12} />
			))}
			{/* janela com persiana na parede do fundo */}
			<Q P={P} v={pZ(ZF, -1.18, -0.12, -0.98, 0.22)} c={C.moldura} />
			<Q P={P} v={pZ(ZF, -1.12, -0.18, -0.92, 0.16)} c={C.ceuJanela} />
			{noite ? (
				<>
					<circle cx={pr(P, [-0.4, -0.7, ZF])[0]} cy={pr(P, [-0.4, -0.7, ZF])[1]} r={0.08 * kF} fill={COR.branco} opacity={0.9} />
					{Array.from({length: 8}, (_, i) => (
						<circle key={i} cx={pr(P, [-1.1 + rnd(i + 30) * 0.9, 0, ZF])[0]} cy={pr(P, [0, -0.9 + rnd(i + 60) * 0.5, ZF])[1]} r={1.6} fill={COR.branco} opacity={0.7} />
					))}
				</>
			) : null}
			<Q
				P={P}
				v={[
					[-1.12, 0.16, ZF],
					[-1.12, -0.12, ZF],
					[-0.9, -0.12, ZF],
					[-0.9, -0.3, ZF],
					[-0.62, -0.3, ZF],
					[-0.62, -0.05, ZF],
					[-0.4, -0.05, ZF],
					[-0.4, -0.2, ZF],
					[-0.18, -0.2, ZF],
					[-0.18, 0.16, ZF],
				]}
				c={noite ? '#0a0f1a' : '#7d8a92'}
			/>
			{[-0.95, -0.7, -0.5].map((x, i) => (
				<Q key={`jw${i}`} P={P} v={pZ(ZF, x, x + 0.06, i === 1 ? -0.25 : -0.05, i === 1 ? -0.18 : 0.02)} c="#f2c66e" />
			))}
			<Q P={P} v={pZ(ZF, -0.67, -0.63, -0.92, 0.16)} c={C.moldura} />
			<Q P={P} v={pZ(ZF, -1.12, -0.18, -0.4, -0.37)} c={C.moldura} />
			{Array.from({length: Math.round(persiana * 17)}, (_, i) => -0.92 + i * 0.064).map((y) => (
				<React.Fragment key={`ps${y}`}>
					<Q P={P} v={pZ(ZF, -1.13, -0.17, y, y + 0.045)} c="#cfc6ad" />
					<Q P={P} v={pZ(ZF, -1.13, -0.17, y + 0.035, y + 0.045)} c="#000" o={0.2} />
				</React.Fragment>
			))}
			<Q P={P} v={pZ(ZF, -1.16, -0.14, -0.99, -0.92)} c="#b8ae94" />
			<Ln P={P} a={[-0.24, -0.92, ZF - 0.01]} b={[-0.24, -0.92 + persiana * 1.1 + 0.15, ZF - 0.01]} c="#e8e0c8" w={0.008} />
			{/* aquecedor sob a janela */}
			<Q P={P} v={pZ(ZF, -1.05, -0.25, 0.7, 1.12)} c="#8a8f94" />
			{Array.from({length: 9}, (_, i) => -1.0 + i * 0.09).map((x) => (
				<Q key={`ra${x}`} P={P} v={pZ(ZF, x, x + 0.03, 0.73, 1.09)} c="#5f6469" />
			))}
			{/* diploma e gráfico emoldurados */}
			<Q P={P} v={pZ(ZF, 0.22, 0.78, -0.9, -0.48)} c={C.moldura} />
			<Q P={P} v={pZ(ZF, 0.26, 0.74, -0.86, -0.52)} c={COR.papel} />
			{[-0.78, -0.72, -0.66].map((y) => (
				<Q key={`d${y}`} P={P} v={pZ(ZF, 0.33, 0.67, y, y + 0.018)} c="#9a917c" />
			))}
			<circle cx={pr(P, [0.62, -0.58, ZF])[0]} cy={pr(P, [0.62, -0.58, ZF])[1]} r={0.04 * kF} fill={COR.vermelho} />
			<Q P={P} v={pZ(ZF, 0.22, 0.78, -0.38, 0.06)} c={C.moldura} />
			<Q P={P} v={pZ(ZF, 0.26, 0.74, -0.34, 0.02)} c="#e6dfcc" />
			<Pl
				P={P}
				v={[
					[0.3, -0.26, ZF],
					[0.4, -0.2, ZF],
					[0.5, -0.24, ZF],
					[0.6, -0.08, ZF],
					[0.7, -0.02, ZF],
				]}
				c={COR.vermelho}
				w={0.018}
			/>
			{/* relógio de parede */}
			<circle cx={rcx} cy={rcy} r={0.17 * kF} fill={C.moldura} />
			<circle cx={rcx} cy={rcy} r={0.145 * kF} fill={COR.branco} />
			<line x1={rcx} y1={rcy} x2={rcx + Math.sin((ang * Math.PI) / 180) * 0.12 * kF} y2={rcy - Math.cos((ang * Math.PI) / 180) * 0.12 * kF} stroke={COR.vermelho} strokeWidth={0.012 * kF} />
			<line x1={rcx} y1={rcy} x2={rcx + 0.06 * kF} y2={rcy + 0.04 * kF} stroke="#1a1a1a" strokeWidth={0.02 * kF} strokeLinecap="round" />
			<line x1={rcx} y1={rcy} x2={rcx - 0.02 * kF} y2={rcy - 0.1 * kF} stroke="#1a1a1a" strokeWidth={0.015 * kF} strokeLinecap="round" />
			{/* planta no canto */}
			<Q P={P} v={pZ(ZF - 0.15, -1.48, -1.22, 0.95, YF)} c="#7a4a32" />
			{[
				[-1.35, 0.75, 0.16],
				[-1.25, 0.6, 0.13],
				[-1.45, 0.62, 0.12],
				[-1.36, 0.48, 0.1],
			].map(([x, y, r], i) => (
				<circle key={`pl${i}`} cx={pr(P, [x, y, ZF - 0.15])[0]} cy={pr(P, [x, y, ZF - 0.15])[1]} r={r * k(P, ZF - 0.15)} fill={i % 2 ? '#2f4a32' : '#3d5a3e'} />
			))}
			{/* parede esquerda: porta com vidro fosco e quadro de cortiça */}
			<Q P={P} v={pX(-W, 2.22, 3.0, -0.66, YF)} c="#3a2a1e" />
			<Q P={P} v={pX(-W, 2.27, 2.95, -0.6, YF)} c="#6b4a32" />
			<Q P={P} v={pX(-W, 2.36, 2.86, -0.48, 0.05)} c="#b9c4c8" />
			<Q P={P} v={pX(-W, 2.36, 2.86, -0.48, -0.36)} c="#fff" o={0.25} />
			<circle cx={pr(P, [-W, 0.45, 2.87])[0]} cy={pr(P, [-W, 0.45, 2.87])[1]} r={0.03 * k(P, 2.87)} fill={COR.dourado} />
			{quadroCortica ? (
				<g>
					<Q P={P} v={pX(-W, 1.0, 1.95, -0.95, -0.08)} c={C.moldura} />
					<Q P={P} v={pX(-W, 1.04, 1.91, -0.91, -0.12)} c="#a07a4e" />
					{papeis.map(([z, y, dz, dy], i) => (
						<React.Fragment key={`pp${i}`}>
							<Q P={P} v={pX(-W, z - dz / 2, z + dz / 2, y, y + dy)} c={i === 2 ? '#e8d8a0' : COR.papel} />
							{[0.3, 0.5, 0.7].map((f) => (
								<Ln key={f} P={P} a={[-W, y + dy * f, z - dz / 3]} b={[-W, y + dy * f, z + dz / 3]} c="#9a917c" w={0.008} />
							))}
						</React.Fragment>
					))}
					<Pl P={P} v={[pinos[0], pinos[1], pinos[2], pinos[4], pinos[3], pinos[0]]} c={COR.vermelho} w={0.008} />
					{pinos.map((v, i) => (
						<circle key={`pn${i}`} cx={pr(P, v)[0]} cy={pr(P, v)[1]} r={0.018 * k(P, v[2])} fill={COR.vermelho} />
					))}
				</g>
			) : null}
			{/* parede direita: estante (livros + fichários) e arquivo de aço */}
			<Q P={P} v={pX(W - 0.38, 1.15, 2.5, -1.05, YF)} c="#3a2618" />
			{[-1.05, -0.62, -0.19, 0.24, 0.67, 1.1].map((y, i, arr) => (
				<React.Fragment key={`es${i}`}>
					<Q P={P} v={pY(y, W - 0.38, W, 1.15, 2.5)} c={COR.madeiraEscura} />
					<Q P={P} v={pX(W - 0.38, 1.15, 2.5, y - 0.03, y + 0.03)} c={COR.madeira} />
					{i < arr.length - 1 ? (
						i === 2 ? (
							<LivrosParede P={P} X={W - 0.37} z0={1.18} z1={2.47} yBase={arr[i + 1] - 0.03} alt={0.36} semente={i * 41 + 3} cores={['#2b3a52', '#2b3a52', '#6b2f2a', '#3d5a3e', '#d9b26a']} />
						) : (
							<LivrosParede P={P} X={W - 0.37} z0={1.18} z1={2.47} yBase={arr[i + 1] - 0.03} alt={0.33} semente={i * 41 + 3} />
						)
					) : null}
				</React.Fragment>
			))}
			<Q P={P} v={pX(W - 0.38, 1.15, 1.2, -1.05, YF)} c={COR.madeira} />
			<Q P={P} v={pX(W - 0.38, 2.45, 2.5, -1.05, YF)} c={COR.madeira} />
			<Q P={P} v={pZ(1.15, W - 0.38, W, -1.05, YF)} c={COR.madeira} />
			{/* arquivo de aço */}
			<Q P={P} v={pX(W - 0.5, 2.65, 3.25, 0.0, YF)} c="#6d737a" />
			<Q P={P} v={pY(0.0, W - 0.5, W, 2.65, 3.25)} c="#8d939a" />
			<Q P={P} v={pZ(2.65, W - 0.5, W, 0.0, YF)} c="#7d838a" />
			{[0.05, 0.36, 0.67, 0.98].map((y) => (
				<React.Fragment key={`ar${y}`}>
					<Q P={P} v={pX(W - 0.5, 2.7, 3.2, y + 0.03, y + 0.28)} c="#5f656c" />
					<Q P={P} v={pX(W - 0.5, 2.9, 3.0, y + 0.1, y + 0.14)} c="#b8bec4" />
				</React.Fragment>
			))}
			<Q P={P} v={pY(0.0, W - 0.42, W - 0.12, 2.75, 3.1)} c="#d9b26a" />
			<Q P={P} v={pX(W - 0.42, 2.75, 3.1, -0.08, 0.0)} c="#c49e58" />
			<Q P={P} v={pY(-0.08, W - 0.42, W - 0.12, 2.75, 3.1)} c="#e2c07a" />
			{/* cadeira do diretor */}
			{cadeira ? (
				<g>
					<Q P={P} v={pY(0.38, -0.36, 0.36, 2.8, 3.15)} c="#1f1c1b" />
					<ellipse cx={pr(P, [0, -0.3, 3.05])[0]} cy={pr(P, [0, -0.3, 3.05])[1]} rx={0.33 * k(P, 3.05)} ry={0.12 * k(P, 3.05)} fill="#4a2a22" />
					<Q P={P} v={pZ(3.05, -0.33, 0.33, -0.3, 0.4)} c="#4a2a22" />
					{[-0.16, 0, 0.16].map((x) => (
						<Q key={x} P={P} v={pZ(3.04, x - 0.012, x + 0.012, -0.3, 0.3)} c="#361d17" />
					))}
					<Q P={P} v={pZ(3.0, -0.42, -0.34, 0.05, 0.42)} c="#361d17" />
					<Q P={P} v={pZ(3.0, 0.34, 0.42, 0.05, 0.42)} c="#361d17" />
				</g>
			) : null}
			{/* luz da luminária no ambiente (por cima, chapada) */}
			{luz ? (
				<>
					<Q P={P} v={elChao(0, YF, 2.3, 1.3, 0.9)} c="#fff6dc" o={0.07} />
					<Q P={P} v={pZ(ZF, -W, W, YC, -0.2)} c="#fff6dc" o={0.04} />
				</>
			) : (
				<Tela c="#05070c" o={0.35} />
			)}
			{mesa ? <MesaEscritorioCorpo P={P} documentos={documentos} t={t} /> : null}
		</Cenario>
	);
};

// Mesa do escritório (corpo, desenhado no mesmo sistema de projeção).
const MesaEscritorioCorpo: React.FC<{P: Proj; documentos: number; t: number; abajur?: boolean}> = ({P, documentos, abajur = true}) => {
	const YT = 0.42;
	const YF = 1.3;
	const Z0 = 2.05;
	const Z1 = 2.7;
	const folha = (cx: number, cz: number, a: number, w: number, d: number): V3[] => {
		const c = Math.cos(a);
		const s = Math.sin(a);
		return [
			[-w / 2, -d / 2],
			[w / 2, -d / 2],
			[w / 2, d / 2],
			[-w / 2, d / 2],
		].map(([x, z]) => [cx + x * c - z * s, YT - 0.002, cz + x * s + z * c] as V3);
	};
	const pilhas = Array.from({length: Math.max(0, Math.min(4, documentos))}, (_, i) => ({x: -0.35 + i * 0.28, h: 0.05 + rnd(i + 70) * 0.09}));
	const [lx, ly] = pr(P, [0.72, YT, 2.5]);
	const kl = k(P, 2.5);
	const [fx, fy] = pr(P, [-0.72, YT, 2.4]);
	const kf = k(P, 2.4);
	return (
		<g>
			{/* tampo */}
			<Q P={P} v={pY(YT, -1.05, 1.05, Z0, Z1)} c={COR.madeira} />
			{abajur ? <Q P={P} v={elChao(0.62, YT, 2.42, 0.38, 0.22)} c={COR.luz} o={0.22} /> : null}
			{/* papéis soltos e pasta aberta */}
			<Q P={P} v={folha(-0.25, 2.25, 0.15, 0.3, 0.22)} c={COR.papel} />
			<Q P={P} v={folha(-0.05, 2.28, -0.1, 0.3, 0.22)} c="#f6f0e2" />
			{[0.3, 0.45, 0.6].map((f) => (
				<Ln key={f} P={P} a={[-0.17, YT, 2.2 + f * 0.15]} b={[0.07, YT, 2.2 + f * 0.15]} c="#9a917c" w={0.006} />
			))}
			<Q P={P} v={folha(0.25, 2.3, 0.05, 0.36, 0.26)} c="#d9b26a" />
			<Q P={P} v={folha(0.27, 2.3, 0.05, 0.3, 0.22)} c={COR.papel} />
			{/* pilhas de documentos */}
			{pilhas.map(({x, h}, i) => (
				<React.Fragment key={i}>
					<Q P={P} v={pZ(2.5, x, x + 0.22, YT - h, YT)} c="#d8d0bc" />
					{Array.from({length: 4}, (_, j) => (
						<Ln key={j} P={P} a={[x, YT - h * (j / 4), 2.5]} b={[x + 0.22, YT - h * (j / 4), 2.5]} c="#a89f8a" w={0.004} />
					))}
					<Q P={P} v={pY(YT - h, x, x + 0.22, 2.5, 2.66)} c={COR.papel} />
				</React.Fragment>
			))}
			{/* telefone de disco */}
			<ellipse cx={fx} cy={fy} rx={0.16 * kf} ry={0.04 * kf} fill="#000" opacity={0.25} />
			<path d={`M${fx - 0.14 * kf},${fy} L${fx - 0.1 * kf},${fy - 0.1 * kf} L${fx + 0.1 * kf},${fy - 0.1 * kf} L${fx + 0.14 * kf},${fy} Z`} fill="#1b1b1d" />
			<circle cx={fx} cy={fy - 0.06 * kf} r={0.045 * kf} fill="#d9d4c8" />
			<rect x={fx - 0.16 * kf} y={fy - 0.16 * kf} width={0.32 * kf} height={0.06 * kf} rx={0.03 * kf} fill="#1b1b1d" />
			{/* abajur de banqueiro */}
			{abajur ? (
				<g>
					<ellipse cx={lx} cy={ly} rx={0.09 * kl} ry={0.025 * kl} fill="#b48a3a" />
					<rect x={lx - 0.01 * kl} y={ly - 0.3 * kl} width={0.02 * kl} height={0.3 * kl} fill="#b48a3a" />
					<path d={`M${lx - 0.2 * kl},${ly - 0.26 * kl} Q${lx},${ly - 0.42 * kl} ${lx + 0.2 * kl},${ly - 0.26 * kl} Z`} fill={COR.verdeAbajur} />
					<rect x={lx - 0.2 * kl} y={ly - 0.27 * kl} width={0.4 * kl} height={0.02 * kl} fill={COR.luz} />
				</g>
			) : null}
			{/* borda do tampo e painel frontal com gavetas */}
			<Q P={P} v={pZ(Z0, -1.05, 1.05, YT, YT + 0.07)} c={COR.madeiraClara} />
			<Q P={P} v={pZ(Z0 + 0.03, -1.0, 1.0, YT + 0.07, YF)} c={COR.madeiraEscura} />
			<Q P={P} v={pZ(Z0 + 0.02, -1.0, -0.5, YT + 0.07, YF)} c="#634230" />
			<Q P={P} v={pZ(Z0 + 0.02, 0.5, 1.0, YT + 0.07, YF)} c="#634230" />
			{[0.55, 0.85].map((y) => (
				<React.Fragment key={y}>
					<Ln P={P} a={[-1.0, y, Z0 + 0.02]} b={[-0.5, y, Z0 + 0.02]} c="#3e2a1c" w={0.012} />
					<Ln P={P} a={[0.5, y, Z0 + 0.02]} b={[1.0, y, Z0 + 0.02]} c="#3e2a1c" w={0.012} />
					<Q P={P} v={pZ(Z0 + 0.015, -0.8, -0.7, y - 0.12, y - 0.09)} c={COR.dourado} />
					<Q P={P} v={pZ(Z0 + 0.015, 0.7, 0.8, y - 0.12, y - 0.09)} c={COR.dourado} />
				</React.Fragment>
			))}
			<Q P={P} v={pZ(Z0 + 0.015, -0.8, -0.7, 1.03, 1.06)} c={COR.dourado} />
			<Q P={P} v={pZ(Z0 + 0.015, 0.7, 0.8, 1.03, 1.06)} c={COR.dourado} />
		</g>
	);
};

// Mesa do escritório isolada, pra desenhar NA FRENTE de um Personagem (use com EscritorioCompleto mesa={false},
// mesmos horizonte/fugaX).
export const MesaEscritorio: React.FC<{p?: number; horizonte?: number; fugaX?: number; documentos?: number; abajur?: boolean}> = ({p = 1, horizonte = 860, fugaX, documentos = 2, abajur = true}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const P = useProj(horizonte, fugaX);
	return (
		<Cenario p={p}>
			<MesaEscritorioCorpo P={P} documentos={documentos} t={frame / fps} abajur={abajur} />
		</Cenario>
	);
};

// -----------------------------------------------------------------------------------------------------
// 4. BIBLIOTECA / SALA DE AULA (diurno, sépia) — estantes enormes no fundo e na parede direita (com escada),
// janelas altas na esquerda com feixes de sol e poeira, piso de tábuas, tapete, vigas no teto com pendentes,
// mesa de leitura com abajures e livros. quadro={true} troca a janela do fundo por uma lousa (sala de aula).
// -----------------------------------------------------------------------------------------------------
export type BibliotecaCompletaProps = {
	p?: number;
	horizonte?: number; // padrão 900
	fugaX?: number;
	quadro?: boolean; // lousa no centro da parede do fundo (sala de aula). Padrão false (janela em arco)
	quadroTexto?: string; // texto a giz na lousa. Padrão '' (rabiscos)
	mesa?: boolean; // desenha a MesaBiblioteca junto. Padrão true
	cadeiras?: boolean; // cadeiras atrás da mesa. Padrão true
	sol?: boolean; // feixes de sol pelas janelas. Padrão true
};
export const BibliotecaCompleta: React.FC<BibliotecaCompletaProps> = ({p = 1, horizonte = 900, fugaX, quadro = false, quadroTexto = '', mesa = true, cadeiras = true, sol = true}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const P = useProj(horizonte, fugaX);
	const W = 1.9;
	const YF = 1.35;
	const YC = -2.3;
	const ZN = 0.3;
	const ZF = 4.4;
	const kF = k(P, ZF);
	const C = {
		fundo: '#d8c29a',
		esq: '#ccb48b',
		dir: '#c2a97f',
		teto: '#b29669',
		viga: '#8a6a44',
		vigaBaixo: '#76583a',
		chao: '#a97c52',
		chaoLinha: '#8f6541',
		estante: '#6e4a2e',
		estanteEscura: '#4f3420',
		ceu: '#f4ead0',
		sol: '#fff3d0',
	};
	const CORES_SEPIA = ['#8c3b2e', '#a5683a', '#5d6b4a', '#3f5468', '#c29a5a', '#7a4a3a', '#9a8460', '#4e3b2c', '#b5733f', '#6a5a3a'];
	const prateleiras = Array.from({length: 9}, (_, i) => -2.0 + i * 0.42).filter((y) => y <= YF);
	const janelasEsq: Array<[number, number]> = [
		[1.15, 1.85],
		[2.55, 3.25],
	];
	const JY0 = -1.9;
	const JY1 = 0.1;
	const d: V3 = [1.1, 0.9, 0.35];
	const noChao = (v: V3): V3 => {
		const tt = (YF - v[1]) / d[1];
		return [v[0] + d[0] * tt, YF, v[2] + d[2] * tt];
	};
	const estanteFrente = (x0: number, x1: number, s: number) => (
		<g>
			<Q P={P} v={pZ(ZF, x0, x1, -2.05, YF)} c={C.estanteEscura} />
			{prateleiras.slice(0, -1).map((y, i) => (
				<LivrosFrente key={i} P={P} Z={ZF} x0={x0 + 0.04} x1={x1 - 0.04} yBase={prateleiras[i + 1] - 0.03} alt={0.34} semente={s + i * 19} cores={CORES_SEPIA} />
			))}
			{prateleiras.map((y) => (
				<Q key={y} P={P} v={pZ(ZF - 0.01, x0, x1, y - 0.03, y + 0.03)} c={C.estante} />
			))}
			<Q P={P} v={pZ(ZF - 0.01, x0, x0 + 0.05, -2.1, YF)} c={C.estante} />
			<Q P={P} v={pZ(ZF - 0.01, x1 - 0.05, x1, -2.1, YF)} c={C.estante} />
			<Q P={P} v={pZ(ZF - 0.01, x0 - 0.03, x1 + 0.03, -2.15, -2.03)} c={C.vigaBaixo} />
		</g>
	);
	const XE = W - 0.32; // frente da estante da direita
	return (
		<Cenario p={p}>
			<Tela c="#6e5638" />
			<Q P={P} v={pY(YC, -W, W, ZN, ZF)} c={C.teto} />
			<Q P={P} v={pY(YF, -W, W, ZN, ZF)} c={C.chao} />
			<Q P={P} v={pX(-W, ZN, ZF, YC, YF)} c={C.esq} />
			<Q P={P} v={pX(W, ZN, ZF, YC, YF)} c={C.dir} />
			<Q P={P} v={pZ(ZF, -W, W, YC, YF)} c={C.fundo} />
			{/* tábuas do piso */}
			{Array.from({length: 20}, (_, i) => -W + i * 0.2).map((x) => (
				<Q key={`tx${x}`} P={P} v={fioChao(x, YF, ZN, ZF, 0.012)} c={C.chaoLinha} />
			))}
			{Array.from({length: 19}, (_, i) => i).flatMap((i) =>
				[0, 1, 2].map((n) => {
					const x = -W + i * 0.2;
					const z = 0.55 + (i % 3) * 0.4 + n * 1.2;
					return <Ln key={`tz${i}-${n}`} P={P} a={[x, YF, z]} b={[x + 0.2, YF, z]} c={C.chaoLinha} w={0.012} />;
				}),
			)}
			{/* tapete */}
			<Q P={P} v={pY(YF, -1.05, 1.05, 1.1, 3.8)} c="#a5683a" />
			<Q P={P} v={pY(YF, -0.95, 0.95, 1.18, 3.72)} c="#7a3b2c" />
			<Q P={P} v={pY(YF, -0.7, 0.7, 1.45, 3.45)} c="#a5683a" o={0.35} />
			{/* parede do fundo: estantes + janela em arco OU lousa */}
			{estanteFrente(-W, -0.78, 11)}
			{estanteFrente(0.78, W, 77)}
			{quadro ? (
				<g>
					<Q P={P} v={pZ(ZF, -0.72, 0.72, -1.3, 0.12)} c={C.estante} />
					<Q P={P} v={pZ(ZF, -0.66, 0.66, -1.24, 0.06)} c={COR.lousa} />
					{quadroTexto ? (
						<text
							x={pr(P, [0, -0.6, ZF])[0]}
							y={pr(P, [0, -0.6, ZF])[1]}
							fill="#e8e4d8"
							fontFamily={fonte}
							fontWeight={700}
							fontSize={Math.min(0.2 * kF, (1.2 * kF) / (quadroTexto.length * 0.6))}
							textAnchor="middle"
							dominantBaseline="central"
							opacity={0.9}
						>
							{quadroTexto}
						</text>
					) : (
						[-1.0, -0.82, -0.64, -0.46, -0.28].map((y, i) => (
							<Pl
								key={y}
								P={P}
								v={Array.from({length: 8}, (_, j) => [-0.55 + j * (0.9 - i * 0.08) / 7, y + Math.sin(j * 2.1 + i) * 0.025, ZF] as V3)}
								c="#e8e4d8"
								w={0.012}
								o={0.8}
							/>
						))
					)}
					<Q P={P} v={pZ(ZF - 0.02, -0.72, 0.72, 0.12, 0.16)} c={C.estante} />
					<Q P={P} v={pZ(ZF - 0.03, -0.4, -0.3, 0.09, 0.12)} c="#f4f1e8" />
					{/* relógio acima da lousa */}
					<circle cx={pr(P, [0, -1.65, ZF])[0]} cy={pr(P, [0, -1.65, ZF])[1]} r={0.18 * kF} fill={C.estante} />
					<circle cx={pr(P, [0, -1.65, ZF])[0]} cy={pr(P, [0, -1.65, ZF])[1]} r={0.15 * kF} fill="#f4ead0" />
					<Ln P={P} a={[0, -1.65, ZF]} b={[0.07, -1.68, ZF]} c="#2a1f16" w={0.02} />
					<Ln P={P} a={[0, -1.65, ZF]} b={[0, -1.77, ZF]} c="#2a1f16" w={0.015} />
					{/* armário baixo sob a lousa */}
					<Q P={P} v={pZ(ZF, -0.72, 0.72, 0.6, YF)} c={C.estante} />
					<Q P={P} v={pZ(ZF, -0.68, -0.02, 0.65, YF - 0.05)} c={C.estanteEscura} o={0.6} />
					<Q P={P} v={pZ(ZF, 0.02, 0.68, 0.65, YF - 0.05)} c={C.estanteEscura} o={0.6} />
				</g>
			) : (
				<g>
					{(() => {
						const [lx, ly] = pr(P, [-0.62, 0.45, ZF]);
						const [, sy] = pr(P, [-0.62, -1.4, ZF]);
						const [rx] = pr(P, [0.62, -1.4, ZF]);
						const [ilx, ily] = pr(P, [-0.54, 0.4, ZF]);
						const [, isy] = pr(P, [-0.54, -1.4, ZF]);
						const [irx] = pr(P, [0.54, -1.4, ZF]);
						return (
							<>
								<path d={`M${lx},${ly} L${lx},${sy} A${0.62 * kF},${0.62 * kF} 0 0 1 ${rx},${sy} L${rx},${ly} Z`} fill={C.estante} />
								<path d={`M${ilx},${ily} L${ilx},${isy} A${0.54 * kF},${0.54 * kF} 0 0 1 ${irx},${isy} L${irx},${ily} Z`} fill={C.ceu} />
							</>
						);
					})()}
					{[
						[-0.35, -0.6, 0.32],
						[0.05, -0.8, 0.4],
						[0.4, -0.5, 0.28],
					].map(([x, y, r], i) => (
						<circle key={`ar${i}`} cx={pr(P, [x, y, ZF])[0]} cy={pr(P, [x, y, ZF])[1]} r={r * kF} fill={i % 2 ? '#a9a774' : '#b9b583'} />
					))}
					<Q P={P} v={pZ(ZF, -0.54, 0.54, -0.35, 0.4)} c="#d7cfa8" />
					<Q P={P} v={pZ(ZF, -0.025, 0.025, -1.94, 0.4)} c={C.estante} />
					{[-1.2, -0.75, -0.3, 0.15].map((y) => (
						<Q key={`mj${y}`} P={P} v={pZ(ZF, -0.54, 0.54, y - 0.02, y + 0.02)} c={C.estante} />
					))}
					<Q P={P} v={pZ(ZF, -0.27, -0.25, -1.86, 0.4)} c={C.estante} />
					<Q P={P} v={pZ(ZF, 0.25, 0.27, -1.86, 0.4)} c={C.estante} />
					<Q P={P} v={pZ(ZF - 0.02, -0.7, 0.7, 0.45, 0.52)} c={C.vigaBaixo} />
				</g>
			)}
			{/* parede esquerda: janelas altas + estante baixa contínua */}
			{janelasEsq.map(([z0, z1], i) => (
				<React.Fragment key={`je${i}`}>
					<Q P={P} v={pX(-W, z0 - 0.06, z1 + 0.06, JY0 - 0.08, JY1 + 0.08)} c={C.estante} />
					<Q P={P} v={pX(-W, z0, z1, JY0, JY1)} c={C.ceu} />
					<Q P={P} v={elParede(-W, -0.6, z0 + 0.4, 0.5, 0.3)} c="#c9c494" o={0.8} />
					<Q P={P} v={pX(-W, (z0 + z1) / 2 - 0.02, (z0 + z1) / 2 + 0.02, JY0, JY1)} c={C.estante} />
					{[-1.4, -0.9, -0.4].map((y) => (
						<Q key={y} P={P} v={pX(-W, z0, z1, y - 0.02, y + 0.02)} c={C.estante} />
					))}
				</React.Fragment>
			))}
			<Q P={P} v={pX(-W + 0.3, ZN, ZF, 0.45, YF)} c={C.estanteEscura} />
			<LivrosParede P={P} X={-W + 0.29} z0={ZN + 0.4} z1={ZF - 0.05} yBase={0.86} alt={0.34} semente={300} cores={CORES_SEPIA} />
			<LivrosParede P={P} X={-W + 0.29} z0={ZN + 0.4} z1={ZF - 0.05} yBase={YF - 0.06} alt={0.36} semente={500} cores={CORES_SEPIA} />
			<Q P={P} v={pX(-W + 0.3, ZN, ZF, 0.86, 0.91)} c={C.estante} />
			<Q P={P} v={pY(0.45, -W, -W + 0.3, ZN, ZF)} c="#8a6040" />
			<Q P={P} v={pX(-W + 0.3, ZN, ZF, 0.43, 0.49)} c={C.estante} />
			{/* parede direita: estante do chão ao teto, com escada */}
			<Q P={P} v={pX(XE, ZN + 0.3, ZF, -2.05, YF)} c={C.estanteEscura} />
			{prateleiras.slice(0, -1).map((y, i) => (
				<LivrosParede key={`ld${i}`} P={P} X={XE + 0.01} z0={ZN + 0.32} z1={ZF - 0.02} yBase={prateleiras[i + 1] - 0.03} alt={0.35} semente={900 + i * 37} cores={CORES_SEPIA} />
			))}
			{prateleiras.map((y) => (
				<Q key={`pd${y}`} P={P} v={pX(XE, ZN + 0.3, ZF, y - 0.03, y + 0.03)} c={C.estante} />
			))}
			{[0.6, 1.35, 2.1, 2.85, 3.6, 4.35].map((z) => (
				<Q key={`mo${z}`} P={P} v={pX(XE, z, z + 0.05, -2.1, YF)} c={C.estante} />
			))}
			<Q P={P} v={pX(XE, ZN + 0.3, ZF, -2.18, -2.05)} c={C.vigaBaixo} />
			{(() => {
				const r1: [V3, V3] = [
					[XE - 0.55, YF, 2.05],
					[XE - 0.02, -1.75, 2.05],
				];
				const r2: [V3, V3] = [
					[XE - 0.55, YF, 2.4],
					[XE - 0.02, -1.75, 2.4],
				];
				const lerp = (a: V3, b: V3, f: number): V3 => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
				return (
					<g>
						{Array.from({length: 9}, (_, i) => (i + 0.5) / 9).map((f) => (
							<Ln key={f} P={P} a={lerp(r1[0], r1[1], f)} b={lerp(r2[0], r2[1], f)} c="#5a3b26" w={0.025} />
						))}
						<Ln P={P} a={r1[0]} b={r1[1]} c="#5a3b26" w={0.045} />
						<Ln P={P} a={r2[0]} b={r2[1]} c="#5a3b26" w={0.045} />
					</g>
				);
			})()}
			{/* vigas do teto e pendentes */}
			{[3.8, 3.0, 2.2, 1.4, 0.7].map((z) => (
				<React.Fragment key={`vg${z}`}>
					<Q P={P} v={pY(YC + 0.16, -W, W, z, z + 0.16)} c={C.vigaBaixo} />
					<Q P={P} v={pZ(z, -W, W, YC, YC + 0.16)} c={C.viga} />
				</React.Fragment>
			))}
			{[
				[-0.75, 3.0],
				[0.75, 3.0],
				[0, 1.9],
			].map(([x, z], i) => {
				const [gx, gy] = pr(P, [x, -1.15, z]);
				return (
					<g key={`pe${i}`}>
						<Ln P={P} a={[x, YC + 0.16, z]} b={[x, -1.2, z]} c="#3e2a1c" w={0.012} />
						<circle cx={gx} cy={gy} r={0.2 * k(P, z)} fill="#fff1c9" opacity={0.25} />
						<circle cx={gx} cy={gy} r={0.11 * k(P, z)} fill="#fff1c9" />
						<rect x={gx - 0.05 * k(P, z)} y={gy - 0.14 * k(P, z)} width={0.1 * k(P, z)} height={0.05 * k(P, z)} fill="#8a6a44" />
					</g>
				);
			})}
			{/* manchas de sol no chão */}
			{sol
				? janelasEsq.map(([z0, z1], i) => {
						const w1: V3 = [-W, JY0, z0];
						const w2: V3 = [-W, JY0, z1];
						const w3: V3 = [-W, JY1, z1];
						const w4: V3 = [-W, JY1, z0];
						return <Q key={`sc${i}`} P={P} v={[noChao(w1), noChao(w2), noChao(w3), noChao(w4)]} c={C.sol} o={0.28} />;
					})
				: null}
			{/* cadeiras atrás da mesa */}
			{cadeiras
				? [-0.5, 0.5].map((x) => (
						<g key={`cd${x}`}>
							<Q P={P} v={pZ(3.35, x - 0.24, x + 0.24, -0.2, 0.62)} c="#5a3b26" />
							<Q P={P} v={pZ(3.34, x - 0.2, x + 0.2, -0.14, 0.5)} c="#7a5236" />
							{[-0.1, 0, 0.1].map((dx) => (
								<Q key={dx} P={P} v={pZ(3.33, x + dx - 0.02, x + dx + 0.02, -0.1, 0.5)} c="#5a3b26" />
							))}
							<Q P={P} v={pZ(3.35, x - 0.24, x - 0.19, 0.62, YF)} c="#4a3020" />
							<Q P={P} v={pZ(3.35, x + 0.19, x + 0.24, 0.62, YF)} c="#4a3020" />
						</g>
					))
				: null}
			{mesa ? <MesaBibliotecaCorpo P={P} /> : null}
			{/* feixes de sol com poeira (por cima de tudo, bem sutis) */}
			{sol
				? janelasEsq.map(([z0, z1], i) => {
						const w1: V3 = [-W, JY0, z0];
						const w2: V3 = [-W, JY0, z1];
						return <Q key={`fx${i}`} P={P} v={[w1, w2, noChao([-W, JY1, z1]), noChao([-W, JY1, z0])]} c={C.sol} o={0.12} />;
					})
				: null}
			{sol
				? Array.from({length: 30}, (_, i) => {
						const [z0, z1] = janelasEsq[i % 2];
						const ini: V3 = [-W, JY0 + rnd(i + 11) * (JY1 - JY0), z0 + rnd(i + 23) * (z1 - z0)];
						const tt = rnd(i + 37) * 1.6;
						const v: V3 = [ini[0] + d[0] * tt, ini[1] + d[1] * tt + Math.sin(t * 0.6 + i) * 0.04, ini[2] + d[2] * tt];
						const [x, y] = pr(P, v);
						return <circle key={`po${i}`} cx={x} cy={y} r={0.01 * k(P, v[2])} fill={C.sol} opacity={0.4 + 0.4 * Math.sin(t + i)} />;
					})
				: null}
			<Tela c="#b08850" o={0.06} />
		</Cenario>
	);
};

const MesaBibliotecaCorpo: React.FC<{P: Proj}> = ({P}) => {
	const YT = 0.6;
	const YF = 1.35;
	const Z0 = 2.3;
	const Z1 = 3.1;
	const pilha = (x: number, z: number, n: number, s: number) => {
		let y = YT;
		return Array.from({length: n}, (_, i) => {
			const h = 0.05 + rnd(s + i) * 0.03;
			const w = 0.26 + rnd(s + i * 3) * 0.08;
			const y0 = y - h;
			const cor = ['#8c3b2e', '#3f5468', '#5d6b4a', '#a5683a', '#7a4a3a'][Math.floor(rnd(s + i * 7) * 5)];
			const el = (
				<React.Fragment key={i}>
					<Q P={P} v={pY(y0, x - w / 2, x + w / 2, z, z + 0.2)} c="#efe3c8" />
					<Q P={P} v={pZ(z, x - w / 2, x + w / 2, y0, y)} c={cor} />
					<Q P={P} v={pZ(z - 0.001, x - w / 2 + 0.02, x + w / 2 - 0.02, y0 + h * 0.4, y0 + h * 0.6)} c="#e8d8a8" o={0.6} />
				</React.Fragment>
			);
			y = y0;
			return el;
		});
	};
	const abajur = (x: number, z: number, key: string) => {
		const [lx, ly] = pr(P, [x, YT, z]);
		const kl = k(P, z);
		return (
			<g key={key}>
				<Q P={P} v={elChao(x, YT, z - 0.12, 0.35, 0.2)} c="#fff1c9" o={0.3} />
				<ellipse cx={lx} cy={ly} rx={0.08 * kl} ry={0.022 * kl} fill="#b48a3a" />
				<rect x={lx - 0.01 * kl} y={ly - 0.3 * kl} width={0.02 * kl} height={0.3 * kl} fill="#b48a3a" />
				<path d={`M${lx - 0.19 * kl},${ly - 0.26 * kl} Q${lx},${ly - 0.42 * kl} ${lx + 0.19 * kl},${ly - 0.26 * kl} Z`} fill={COR.verdeAbajur} />
				<rect x={lx - 0.19 * kl} y={ly - 0.27 * kl} width={0.38 * kl} height={0.02 * kl} fill="#fff1c9" />
			</g>
		);
	};
	return (
		<g>
			{/* pernas de trás */}
			<Q P={P} v={pZ(Z1 - 0.05, -0.97, -0.9, YT, YF)} c="#4a3020" />
			<Q P={P} v={pZ(Z1 - 0.05, 0.9, 0.97, YT, YF)} c="#4a3020" />
			<Q P={P} v={pY(YT, -1.0, 1.0, Z0, Z1)} c="#8a5e3c" />
			{abajur(-0.6, 2.85, 'a1')}
			{abajur(0.6, 2.85, 'a2')}
			{/* livro aberto */}
			<Q
				P={P}
				v={[
					[-0.32, YT - 0.002, 2.45],
					[0, YT - 0.01, 2.43],
					[0, YT - 0.01, 2.7],
					[-0.3, YT - 0.002, 2.72],
				]}
				c={COR.sepia1}
			/>
			<Q
				P={P}
				v={[
					[0, YT - 0.01, 2.43],
					[0.32, YT - 0.002, 2.45],
					[0.3, YT - 0.002, 2.72],
					[0, YT - 0.01, 2.7],
				]}
				c={COR.sepia2}
			/>
			{[0.25, 0.45, 0.65].map((f) => (
				<React.Fragment key={f}>
					<Ln P={P} a={[-0.26, YT, 2.45 + f * 0.27]} b={[-0.04, YT, 2.44 + f * 0.27]} c="#a08a60" w={0.006} />
					<Ln P={P} a={[0.04, YT, 2.44 + f * 0.27]} b={[0.26, YT, 2.45 + f * 0.27]} c="#a08a60" w={0.006} />
				</React.Fragment>
			))}
			{pilha(-0.62, 2.4, 4, 13)}
			{pilha(0.66, 2.45, 3, 29)}
			{/* borda do tampo e pernas da frente */}
			<Q P={P} v={pZ(Z0, -1.0, 1.0, YT, YT + 0.07)} c="#6e4a2e" />
			<Q P={P} v={pZ(Z0 + 0.02, -0.95, 0.95, YT + 0.07, YT + 0.16)} c="#5a3b26" />
			<Q P={P} v={pZ(Z0 + 0.03, -0.97, -0.88, YT + 0.07, YF)} c="#5a3b26" />
			<Q P={P} v={pZ(Z0 + 0.03, 0.88, 0.97, YT + 0.07, YF)} c="#5a3b26" />
		</g>
	);
};

// Mesa de leitura da biblioteca isolada, pra desenhar NA FRENTE de um Personagem (use com BibliotecaCompleta
// mesa={false}, mesmos horizonte/fugaX).
export const MesaBiblioteca: React.FC<{p?: number; horizonte?: number; fugaX?: number}> = ({p = 1, horizonte = 900, fugaX}) => {
	const P = useProj(horizonte, fugaX);
	return (
		<Cenario p={p}>
			<MesaBibliotecaCorpo P={P} />
		</Cenario>
	);
};

export const pecasBase: Partial<Pecas> = {};
