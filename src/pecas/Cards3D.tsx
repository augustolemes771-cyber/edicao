// Cards 3D empilhados (pedido do usuário, 28/10/2026, depoimento-2): o mesmo vidro roxo com borda dourada dos cartões da
// gradeAntesDepois. Cada card sobe girando em 3D na hora da sua palavra e fica na pilha, abaixo do anterior (y do primeiro
// card em px; a pilha cresce para baixo, abaixo do rosto). Número dourado à esquerda (a partir de `inicio`). Esconde a legenda.
import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {CenaNoPlano} from '../motor/plano';
import {playfair, poppins} from '../motor/tema';

type Cena = Extract<CenaNoPlano, {tipo: 'cards3d'}>;
const lim = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const OURO = '#E8C27A';
const OURO_TEXTO = 'linear-gradient(180deg,#FFF1C9 0%,#F2D08A 40%,#E8C27A 65%,#C9974A 100%)';
const ALTURA = 128;
const VAO = 22;

const Card: React.FC<{texto: string; numero: number; entra: number; y: number; ultimo: boolean}> = ({texto, numero, entra, y, ultimo}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const l = frame - entra;
	if (l < 0) return null;
	const p = spring({frame: l, fps, config: {damping: 12, stiffness: 130, mass: 0.85}});
	const brilho = interpolate(l, [0, 5, 20], [0, 1, ultimo ? 0.35 : 0], lim);
	return (
		<div
			style={{
				position: 'absolute',
				left: 540 - 380,
				top: y,
				width: 760,
				height: ALTURA,
				opacity: interpolate(l, [0, 4], [0, 1], lim),
				transform: `translateY(${(1 - p) * 160}px) rotateX(${(1 - p) * -85 + 8}deg) rotateY(${(1 - p) * 18}deg) scale(${0.85 + 0.15 * p})`,
				transformOrigin: '50% 100%',
			}}
		>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					borderRadius: 30,
					background: ultimo
						? 'linear-gradient(160deg, rgba(92,52,160,0.94) 0%, rgba(40,20,78,0.94) 100%)'
						: 'linear-gradient(160deg, rgba(58,34,100,0.9) 0%, rgba(26,13,52,0.92) 100%)',
					boxShadow: `inset 0 0 0 2.5px rgba(232,194,122,${0.45 + brilho * 0.55}), 0 26px 44px rgba(6,2,16,0.6), 0 0 ${50 * brilho}px rgba(232,194,122,${0.5 * brilho})`,
					overflow: 'hidden',
				}}
			>
				<div
					style={{
						position: 'absolute',
						inset: 0,
						backgroundImage: 'linear-gradient(rgba(232,194,122,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(232,194,122,0.1) 1px, transparent 1px)',
						backgroundSize: '32px 32px',
					}}
				/>
				<div
					style={{
						position: 'absolute',
						top: -60,
						bottom: -60,
						width: 110,
						left: interpolate(l, [2, 18], [-160, 900], lim),
						transform: 'rotate(20deg)',
						background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,245,220,0.32) 50%, rgba(255,255,255,0) 100%)',
					}}
				/>
				{/* Espessura do vidro (borda de baixo mais escura) para o card ter volume. */}
				<div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 10, background: 'linear-gradient(180deg, rgba(0,0,0,0), rgba(8,2,20,0.45))'}} />
			</div>
			<div
				style={{
					position: 'absolute',
					left: 26,
					top: (ALTURA - 84) / 2,
					width: 84,
					height: 84,
					borderRadius: 42,
					background: 'radial-gradient(circle at 35% 30%, #FFF1C9 0%, #E8C27A 45%, #A9762A 100%)',
					boxShadow: '0 8px 16px rgba(8,2,20,0.5), inset 0 -4px 8px rgba(80,40,0,0.35)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<span style={{fontFamily: playfair, fontStyle: 'italic', fontWeight: 800, fontSize: 56, color: '#2a1608', lineHeight: 1}}>{numero}</span>
			</div>
			<div style={{position: 'absolute', left: 136, right: 30, top: 0, bottom: 0, display: 'flex', alignItems: 'center'}}>
				<span style={{fontFamily: poppins, fontWeight: 900, fontSize: texto.length > 14 ? 52 : 60, letterSpacing: '0.04em', color: '#fff', textShadow: '0 4px 12px rgba(8,2,20,0.6)'}}>
					{texto}
				</span>
			</div>
			{ultimo ? <div style={{position: 'absolute', left: 136, right: 60, bottom: 20, height: 3, background: `linear-gradient(90deg, ${OURO}, transparent)`, opacity: brilho}} /> : null}
		</div>
	);
};

export const Cards3D: React.FC<{cena: Cena}> = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const fim = Math.round((cena.ate - cena.de) * fps);
	const y0 = cena.y ?? 1000;
	const entradas = cena.itens.map((it) => Math.round(Math.max(0, it.em - cena.de) * fps));
	const ultimo = entradas.filter((e) => frame >= e).length - 1;
	const fundo = interpolate(frame, [0, 6, fim - 6, fim], [0, 1, 1, 0], lim);
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			{/* Escurece só a parte de baixo para os cards lerem bem; o rosto fica livre. */}
			<AbsoluteFill style={{opacity: fundo, background: `linear-gradient(180deg, rgba(30,15,58,0) ${((y0 - 260) / 1920) * 100}%, rgba(30,15,58,0.78) ${((y0 + 40) / 1920) * 100}%, rgba(20,9,40,0.9) 100%)`}} />
			<AbsoluteFill style={{perspective: 1300, perspectiveOrigin: `50% ${((y0 - 200) / 1920) * 100}%`, opacity: interpolate(frame, [fim - 6, fim], [1, 0], lim)}}>
				{cena.itens.map((it, i) => (
					<Card key={i} texto={it.texto} numero={(cena.inicio ?? 1) + i} entra={entradas[i]} y={y0 + i * (ALTURA + VAO)} ultimo={i === ultimo} />
				))}
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
