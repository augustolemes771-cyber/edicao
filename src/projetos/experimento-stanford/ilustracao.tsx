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
	<svg style={{position: 'absolute', left: 0, top: 480, opacity: p}} width={432} height={480} viewBox="0 0 432 480" preserveAspectRatio="none">
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

export const pecasBase: Partial<Pecas> = {};
