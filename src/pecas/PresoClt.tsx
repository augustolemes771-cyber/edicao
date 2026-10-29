// Motion "preso na CLT" (pedido do usuário, 28/10/2026, depoimento-2): o vídeo escurece em roxo com a grade andando atrás, a carteira de trabalho azul
// entra girando em 3D e assenta no centro; grades de metal caem na frente dela com quique (em: segundo da batida), o cadeado
// dourado fecha com tremida (emCadeado) e o texto "PRESO NA / CLT" sobe embaixo. Faz o papel da legenda.
import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {CenaNoPlano} from '../motor/plano';
import {playfair, poppins} from '../motor/tema';
import {Plano} from './GradeAntesDepois';

type Cena = Extract<CenaNoPlano, {tipo: 'presoClt'}>;
const lim = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const OURO_TEXTO = 'linear-gradient(180deg,#FFF1C9 0%,#F2D08A 40%,#E8C27A 65%,#C9974A 100%)';

const Carteira: React.FC<{p: number}> = ({p}) => (
	<div
		style={{
			position: 'absolute',
			left: 540 - 210,
			top: 520,
			width: 420,
			height: 580,
			transform: `perspective(1400px) rotateY(${(1 - p) * -70 - 10}deg) rotateZ(${(1 - p) * -12 + 4}deg) scale(${0.6 + 0.4 * p})`,
			opacity: Math.min(1, p * 2),
		}}
	>
		{/* Lombada e capa azul da carteira de trabalho, com brasão e letras em relevo dourado. */}
		<div
			style={{
				position: 'absolute',
				inset: 0,
				borderRadius: '10px 26px 26px 10px',
				background: 'linear-gradient(135deg, #2b4f8e 0%, #1a356b 55%, #10224a 100%)',
				boxShadow: 'inset 14px 0 0 rgba(0,0,0,0.25), inset 0 0 0 3px rgba(255,255,255,0.06), 0 40px 70px rgba(6,2,16,0.7)',
			}}
		/>
		<div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 26, borderRadius: '10px 0 0 10px', background: 'linear-gradient(90deg, rgba(0,0,0,0.35), rgba(255,255,255,0.08))'}} />
		<svg width={420} height={580} style={{position: 'absolute', inset: 0}}>
			<circle cx={210} cy={210} r={92} fill="none" stroke="#E8C27A" strokeWidth={5} opacity={0.9} />
			<circle cx={210} cy={210} r={72} fill="none" stroke="#E8C27A" strokeWidth={2} opacity={0.6} />
			<path d="M 210 150 L 228 196 L 276 196 L 237 224 L 252 270 L 210 242 L 168 270 L 183 224 L 144 196 L 192 196 Z" fill="#E8C27A" opacity={0.85} />
		</svg>
		<div style={{position: 'absolute', top: 340, width: '100%', textAlign: 'center', fontFamily: poppins, fontWeight: 800, color: '#E8C27A', lineHeight: 1.25}}>
			<div style={{fontSize: 34, letterSpacing: '0.08em'}}>CARTEIRA DE</div>
			<div style={{fontSize: 46, letterSpacing: '0.06em'}}>TRABALHO</div>
			<div style={{fontSize: 18, letterSpacing: '0.16em', opacity: 0.75, marginTop: 10}}>E PREVIDÊNCIA SOCIAL</div>
		</div>
		{/* Brilho que passa na capa. */}
		<div
			style={{
				position: 'absolute',
				inset: 0,
				borderRadius: '10px 26px 26px 10px',
				background: `linear-gradient(115deg, rgba(255,255,255,0) ${p * 120 - 30}%, rgba(255,255,255,0.18) ${p * 120 - 15}%, rgba(255,255,255,0) ${p * 120}%)`,
			}}
		/>
	</div>
);

// Grade: barras cilíndricas de aço (gradiente) presas por duas travessas, cai de cima e quica.
const Grade: React.FC<{y: number}> = ({y}) => {
	const barras = 7;
	const esq = 140;
	const larg = 800;
	return (
		<div style={{position: 'absolute', left: esq, top: 420 + y, width: larg, height: 820}}>
			{Array.from({length: barras}, (_, i) => (
				<div
					key={i}
					style={{
						position: 'absolute',
						left: (i * (larg - 34)) / (barras - 1),
						top: 0,
						width: 34,
						height: 820,
						borderRadius: 17,
						background: 'linear-gradient(90deg, #3a3f4a 0%, #c9ced8 28%, #ffffff 40%, #9aa1ad 62%, #2c3038 100%)',
						boxShadow: '8px 0 18px rgba(0,0,0,0.45)',
					}}
				/>
			))}
			{[90, 690].map((t) => (
				<div
					key={t}
					style={{
						position: 'absolute',
						left: -20,
						right: -20,
						top: t,
						height: 40,
						borderRadius: 12,
						background: 'linear-gradient(180deg, #4a505c 0%, #d9dde4 35%, #ffffff 48%, #8d94a0 70%, #2a2e36 100%)',
						boxShadow: '0 12px 22px rgba(0,0,0,0.5)',
					}}
				/>
			))}
		</div>
	);
};

const Cadeado: React.FC<{fecha: number; brilho: number}> = ({fecha, brilho}) => (
	<svg width={200} height={240} style={{position: 'absolute', left: 540 - 100, top: 1040, filter: `drop-shadow(0 14px 20px rgba(0,0,0,0.6)) drop-shadow(0 0 ${30 * brilho}px rgba(232,194,122,${0.8 * brilho}))`}}>
		<defs>
			<linearGradient id="cadOuro" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stopColor="#FFF1C9" />
				<stop offset="0.45" stopColor="#E8C27A" />
				<stop offset="1" stopColor="#A9762A" />
			</linearGradient>
			<linearGradient id="cadAco" x1="0" y1="0" x2="1" y2="0">
				<stop offset="0" stopColor="#5a606c" />
				<stop offset="0.4" stopColor="#ffffff" />
				<stop offset="1" stopColor="#6b717d" />
			</linearGradient>
		</defs>
		{/* Haste: aberta (alta) e desce ao fechar. */}
		<path d={`M 58 ${120 - (1 - fecha) * 34} L 58 ${70 - (1 - fecha) * 34} A 42 42 0 0 1 142 ${70 - (1 - fecha) * 34} L 142 ${120 - (1 - fecha) * 34}`} fill="none" stroke="url(#cadAco)" strokeWidth={20} strokeLinecap="round" />
		<rect x={24} y={108} width={152} height={122} rx={24} fill="url(#cadOuro)" />
		<circle cx={100} cy={158} r={14} fill="#3a2410" />
		<rect x={94} y={162} width={12} height={34} rx={5} fill="#3a2410" />
	</svg>
);

export const PresoClt: React.FC<{cena: Cena}> = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const fim = Math.round((cena.ate - cena.de) * fps);
	const batida = Math.round(Math.max(0, (cena.em ?? cena.de + 0.25) - cena.de) * fps);
	const tranca = Math.round(Math.max(batida + 4, ((cena.emCadeado ?? cena.de + 0.6) - cena.de) * fps));
	const fundo = interpolate(frame, [0, 5, fim - 6, fim], [0, 1, 1, 0], lim);
	const pCarteira = spring({frame, fps, config: {damping: 13, stiffness: 110}});
	const queda = spring({frame: frame - batida, fps, config: {damping: 9, stiffness: 190, mass: 0.9}});
	const yGrade = frame < batida ? -1500 : (1 - queda) * -1300;
	const fecha = spring({frame: frame - tranca, fps, config: {damping: 12, stiffness: 260}});
	const brilho = interpolate(frame - tranca, [0, 3, 16], [0, 1, 0.2], lim);
	// Tremida curta na batida da grade e no clique do cadeado.
	const treme = (q: number) => {
		const l = frame - q;
		return l >= 0 && l < 8 ? Math.sin(l * 2.6) * (8 - l) * 2.2 : 0;
	};
	const dx = treme(batida + 3) + treme(tranca) * 0.6;
	const texto = spring({frame: frame - tranca, fps, config: {damping: 14, stiffness: 140}});
	const saida = interpolate(frame, [fim - 6, fim], [1, 0], lim);
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<AbsoluteFill style={{opacity: fundo, background: 'radial-gradient(ellipse at 50% 45%, rgba(46,24,90,0.9) 0%, rgba(20,9,40,0.95) 70%)'}} />
			{/* Grade em perspectiva andando atrás, só para dar vida ao fundo. */}
			<AbsoluteFill style={{opacity: fundo * 0.75, perspective: 900, perspectiveOrigin: '50% 50%'}}>
				<Plano desloca={(frame / fps) * 260} abre={1} />
				<Plano teto desloca={(frame / fps) * 260} abre={1} />
			</AbsoluteFill>
			<AbsoluteFill style={{opacity: saida, transform: `translateX(${dx}px)`}}>
				<Carteira p={pCarteira} />
				{frame >= batida ? <Grade y={yGrade} /> : null}
				{frame >= tranca - 2 ? (
					<div style={{opacity: interpolate(frame - tranca, [-2, 2], [0, 1], lim), transform: `scale(${0.7 + 0.3 * fecha})`, transformOrigin: '540px 1160px', position: 'absolute', inset: 0}}>
						<Cadeado fecha={fecha} brilho={brilho} />
					</div>
				) : null}
				<div style={{position: 'absolute', top: 1300, width: '100%', textAlign: 'center', opacity: interpolate(frame - tranca, [0, 4], [0, 1], lim), transform: `translateY(${(1 - texto) * 40}px)`}}>
					<span style={{fontFamily: poppins, fontWeight: 900, fontSize: 70, letterSpacing: '0.06em', color: '#fff', textShadow: '0 6px 18px rgba(8,2,20,0.7)', verticalAlign: 'middle'}}>{cena.texto ?? 'PRESO NA'} </span>
					<span style={{fontFamily: playfair, fontStyle: 'italic', fontWeight: 800, fontSize: 116, lineHeight: 1.1, padding: '0 0.08em', verticalAlign: 'middle', background: OURO_TEXTO, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}}>
						{cena.destaque ?? 'CLT'}
					</span>
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
