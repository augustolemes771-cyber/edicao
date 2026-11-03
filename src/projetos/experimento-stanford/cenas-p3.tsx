// Bloco P3 do experimento-stanford: "sexto dia" até "todo livro de psicologia do mundo".
// Cenas curtas, cada uma já em movimento desde o primeiro quadro — nada de tela parada.
import React from 'react';
import type {CenaPeca, Pecas} from '../../pecas/peca';
import {
	BibliotecaCompleta,
	Camera,
	COR,
	EscritorioCompleto,
	Fundo,
	GradePrimeiroPlano,
	Livro,
	OmbroPrimeiroPlano,
	Personagem,
	PoraoCompleto,
	TextoGrande,
	Vinheta,
	fonte,
	usePeca,
} from './ilustracao';

// Cartão de calendário com um número grande que pode ficar fixo ou contar rápido até um valor.
const CartaoCalendario: React.FC<{dia: number; p: number; y?: number; girar?: number}> = ({dia, p, y = 760, girar = 0}) => (
	<svg style={{position: 'absolute', left: '50%', top: y, transform: `translate(-50%, ${(1 - p) * 40}px) rotate(${girar}deg)`, opacity: p}} width={220} height={240} viewBox="0 0 220 240">
		<rect x={10} y={10} width={200} height={220} rx={16} fill={COR.branco} />
		<rect x={10} y={10} width={200} height={46} rx={16} fill={COR.vermelho} />
		<rect x={10} y={40} width={200} height={16} fill={COR.vermelho} />
		<text x={110} y={42} textAnchor="middle" fontFamily={fonte} fontWeight={800} fontSize={20} fill={COR.branco} letterSpacing={2}>
			DIA
		</text>
		<text x={110} y={170} textAnchor="middle" fontFamily={fonte} fontWeight={800} fontSize={110} fill="#1a1a1a">
			{dia}
		</text>
	</svg>
);

// P3a — "No sexto dia": os números dos dias passam rápido até parar no 6.
export const stanfordP3a: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, mola} = usePeca(cena);
	const p = mola(0, 160, 16);
	const contagem = Math.min(6, 1 + Math.floor(frame / 4));
	const girar = Math.max(0, (6 - contagem) * 2.5);
	return (
		<Fundo noite>
			<Camera cena={cena} zoom={[1.5, 1.9]} y={[40, -20]}>
				<PoraoCompleto escuro={0.5} />
				<CartaoCalendario dia={contagem} p={p} girar={contagem < 6 ? girar : 0} y={900} />
			</Camera>
			<Vinheta forca={0.45} />
		</Fundo>
	);
};

// Figura dividida ao meio: um lado jaleco de cientista, outro lado farda de diretor de prisão.
const FiguraDupla: React.FC<{x: number; y: number; escala?: number; p: number; maos?: number}> = ({x, y, escala = 1, p, maos = 0}) => (
	<svg
		style={{position: 'absolute', left: x - 70 * escala, top: y - 150 * escala, opacity: p, transform: `scale(${escala}) translateY(${(1 - p) * 30}px)`}}
		width={140}
		height={190}
		viewBox="0 0 140 190"
	>
		<ellipse cx={70} cy={182} rx={38} ry={7} fill="#000" opacity={0.25} />
		{/* metade esquerda: jaleco branco de cientista */}
		<path d="M70 80 L25 80 L18 170 L70 170 Z" fill={COR.branco} stroke="#c9c2ae" strokeWidth={2} />
		{/* metade direita: farda escura de diretor */}
		<path d="M70 80 L115 80 L122 170 L70 170 Z" fill={COR.guarda} />
		<circle cx={70} cy={48} r={34} fill={COR.pele} />
		<circle cx={60} cy={46} r={3.6} fill="#1a1a1a" />
		<circle cx={80} cy={46} r={3.6} fill="#1a1a1a" />
		{/* crachá de diretor no lado direito */}
		<rect x={88} y={96} width={18} height={14} rx={2} fill={COR.dourado} />
		{/* prancheta de cientista no lado esquerdo */}
		<rect x={30} y={96} width={16} height={22} rx={2} fill="#dcd6c6" stroke="#aaa294" strokeWidth={1.5} />
		{/* braços, podem subir até a cabeça (maos) */}
		<rect x={6} y={90 - maos * 50} width={14} height={52} rx={7} fill={COR.branco} stroke="#c9c2ae" strokeWidth={2} transform={`rotate(${-maos * 110} 13 90)`} />
		<rect x={120} y={90 - maos * 50} width={14} height={52} rx={7} fill={COR.guarda} transform={`rotate(${maos * 110} 127 90)`} />
	</svg>
);

// P3b — "o próprio cientista... também diretor da prisão": figura dividida nas duas funções.
export const stanfordP3b: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {t, mola} = usePeca(cena);
	const p = mola(0, 150, 16);
	return (
		<Fundo noite>
			<Camera cena={cena} zoom={[1.15, 1.4]} x={[-20, 20]}>
				<EscritorioCompleto />
				<FiguraDupla x={540} y={1050} escala={2.3} p={p} maos={0} />
			</Camera>
			<div
				style={{
					position: 'absolute',
					top: 260,
					width: '100%',
					textAlign: 'center',
					opacity: Math.min(1, mola(8, 110, 14) * 1.5),
					fontFamily: fonte,
					fontWeight: 800,
					fontSize: 40,
					color: COR.dourado,
					transform: `scale(${1 + Math.sin(t * 4) * 0.015})`,
				}}
			>
				CIENTISTA E DIRETOR
			</div>
			<OmbroPrimeiroPlano lado="esquerda" />
			<Vinheta forca={0.5} />
		</Fundo>
	);
};

// P3c — "perdeu o controle": a mesma figura leva as mãos à cabeça.
export const stanfordP3c: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	const maos = Math.min(1, mola(0, 110, 12));
	return (
		<Fundo noite>
			<Camera cena={cena} zoom={[1.6, 2.1]} y={[20, -40]}>
				<PoraoCompleto escuro={0.5} />
				<FiguraDupla x={540} y={1050} escala={2.8} p={1} maos={maos} />
			</Camera>
			<OmbroPrimeiroPlano lado="direita" />
			<Vinheta forca={0.6} />
		</Fundo>
	);
};

// P3d — "interrompeu tudo": carimbo vermelho de PARE cobre a tela e tudo apaga.
export const stanfordP3d: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	const carimbo = mola(0, 220, 10);
	const apaga = mola(14, 90, 20);
	return (
		<Fundo noite>
			<Camera cena={cena} zoom={[1, 1.5]}>
				<PoraoCompleto escuro={0.6} />
				<div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: Math.min(1, carimbo * 1.6)}}>
					<svg width={320} height={320} viewBox="0 0 200 200" style={{transform: `scale(${0.5 + 0.5 * carimbo}) rotate(${(1 - carimbo) * -25}deg)`}}>
						<circle cx={100} cy={100} r={92} fill={COR.vermelho} stroke={COR.branco} strokeWidth={10} />
						<text x={100} y={88} textAnchor="middle" fontFamily={fonte} fontWeight={800} fontSize={46} fill={COR.branco}>
							PARE
						</text>
						<path d="M46 118 L154 118" stroke={COR.branco} strokeWidth={10} strokeLinecap="round" />
					</svg>
				</div>
			</Camera>
			<GradePrimeiroPlano lado="baixo" />
			<Vinheta forca={0.65} />
			<div style={{position: 'absolute', inset: 0, background: '#000', opacity: Math.min(1, apaga)}} />
		</Fundo>
	);
};

// P3e — "por cinquenta anos": calendários voam rápido, "50 ANOS" fica.
export const stanfordP3e: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, mola} = usePeca(cena);
	const n = mola(14, 110, 14);
	const voo = (seed: number) => {
		const x = ((frame * (7 + seed * 3) + seed * 230) % 1300) - 150;
		return x;
	};
	return (
		<Fundo noite={false}>
			<Camera cena={cena} zoom={[1, 1.18]} y={[-10, 10]}>
				<BibliotecaCompleta />
				{[0, 1, 2, 3].map((i) => (
					<div key={i} style={{position: 'absolute', left: voo(i), top: 260 + i * 240, opacity: 0.55, transform: `rotate(${(i - 1.5) * 12}deg) scale(0.55)`}}>
						<CartaoCalendario dia={1971 % 10} p={1} y={0} />
					</div>
				))}
				<div style={{position: 'absolute', top: 760, width: '100%', textAlign: 'center', opacity: Math.min(1, n * 1.5), transform: `scale(${0.8 + 0.2 * n})`}}>
					<div style={{fontFamily: fonte, fontWeight: 800, fontSize: 150, color: '#1a1a1a'}}>50</div>
					<div style={{fontFamily: fonte, fontWeight: 700, fontSize: 32, color: '#8a5a2b', letterSpacing: '0.06em'}}>ANOS</div>
				</div>
			</Camera>
		</Fundo>
	);
};

// P3f — "pessoa comum pode virar um monstro": silhueta metade clara, metade escura/monstro.
export const stanfordP3f: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	const vira = mola(6, 90, 14);
	return (
		<Fundo noite={false}>
			<Camera cena={cena} zoom={[1.1, 1.55]} y={[10, -30]}>
				<BibliotecaCompleta />
				<svg style={{position: 'absolute', left: '50%', top: 620, transform: 'translateX(-50%)'}} width={260} height={420} viewBox="0 0 260 420">
					<defs>
						<clipPath id="metade">
							<rect x={130} y={0} width={130} height={420} />
						</clipPath>
					</defs>
					{/* corpo normal */}
					<g>
						<ellipse cx={130} cy={400} rx={70} ry={14} fill="#000" opacity={0.2} />
						<rect x={75} y={160} width={110} height={190} rx={22} fill={COR.peleClara} opacity={0.001} />
						<rect x={75} y={160} width={110} height={190} rx={22} fill="#e8c9a8" />
						<circle cx={130} cy={100} r={62} fill={COR.pele} />
						<circle cx={112} cy={96} r={7} fill="#1a1a1a" />
						<circle cx={148} cy={96} r={7} fill="#1a1a1a" />
					</g>
					{/* metade monstro por cima, recortada */}
					<g clipPath="url(#metade)" opacity={vira}>
						<ellipse cx={130} cy={400} rx={70} ry={14} fill="#000" opacity={0.3} />
						<rect x={75} y={160} width={110} height={190} rx={22} fill="#1c2027" />
						<circle cx={130} cy={100} r={62} fill="#2a2e36" />
						<circle cx={112} cy={94} r={9} fill={COR.vermelho} />
						<circle cx={148} cy={94} r={9} fill={COR.vermelho} />
						<path d="M100 130 Q130 150 160 130" stroke={COR.vermelho} strokeWidth={4} fill="none" />
					</g>
				</svg>
			</Camera>
			<Vinheta forca={0.4} />
		</Fundo>
	);
};

// P3g — "todo livro de psicologia do mundo": fileira de livros idênticos.
export const stanfordP3g: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	return (
		<Fundo noite={false}>
			<Camera cena={cena} zoom={[1, 1.22]} x={[-10, 10]}>
				<BibliotecaCompleta mesa={false} />
				{[-1, 0, 1].map((i) => {
					const atraso = (i + 1) * 6;
					const p = Math.min(1, mola(atraso, 120, 14));
					return (
						<div key={i} style={{position: 'absolute', left: `${50 + i * 26}%`, top: 0, transform: 'translateX(-50%)'}}>
							<Livro p={p} y={520 - Math.abs(i) * 40} />
						</div>
					);
				})}
			</Camera>
			<TextoGrande texto="ENSINADO ATÉ HOJE" p={mola(26, 100, 14)} cor="#6b4a24" />
		</Fundo>
	);
};

export const pecasP3: Partial<Pecas> = {stanfordP3a, stanfordP3b, stanfordP3c, stanfordP3d, stanfordP3e, stanfordP3f, stanfordP3g};
