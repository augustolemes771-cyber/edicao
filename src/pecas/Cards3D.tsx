// Cartas de baralho 3D do tema (pedido do usuário, 28/10/2026, depoimento-2): cada passo é uma carta que vem do baralho
// virada de costas (verso roxo com treliça dourada e o monograma do método), gira em 3D mostrando a frente na hora da sua
// palavra e cai na pilha em leque, um pouco por cima da anterior. Frente roxa com moldura dourada dupla, índice nos cantos
// (número + naipe de sacola de compras, do TikTok Shop) e o passo no meio. As cartas ficam na tela conforme aparecem.
// y = topo das cartas em px; numeração a partir de `inicio`. Esconde a legenda.
import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {CenaNoPlano} from '../motor/plano';
import {playfair, poppins} from '../motor/tema';

type Cena = Extract<CenaNoPlano, {tipo: 'cards3d'}>;
const lim = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const OURO = '#E8C27A';
const OURO_TEXTO = 'linear-gradient(180deg,#FFF1C9 0%,#F2D08A 40%,#E8C27A 65%,#C9974A 100%)';
const L = 300;
const A = 420;

// Naipe do tema: sacolinha de compras.
const Naipe: React.FC<{tam: number}> = ({tam}) => (
	<svg width={tam} height={tam} viewBox="0 0 40 40">
		<path d="M 13 15 L 13 11 A 7 7 0 0 1 27 11 L 27 15" fill="none" stroke={OURO} strokeWidth={3.2} strokeLinecap="round" />
		<path d="M 6 14 L 34 14 L 31 36 L 9 36 Z" fill={OURO} />
	</svg>
);

const Indice: React.FC<{n: number; invertido?: boolean}> = ({n, invertido}) => (
	<div
		style={{
			position: 'absolute',
			...(invertido ? {right: 16, bottom: 14, transform: 'rotate(180deg)'} : {left: 16, top: 14}),
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			width: 48,
		}}
	>
		<span style={{fontFamily: playfair, fontStyle: 'italic', fontWeight: 800, fontSize: 50, lineHeight: 1, background: OURO_TEXTO, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', padding: '0 0.06em'}}>
			{n}
		</span>
		<Naipe tam={30} />
	</div>
);

const Frente: React.FC<{texto: string; n: number; brilho: number; reflexo: number}> = ({texto, n, brilho, reflexo}) => {
	const palavras = texto.split(' ');
	return (
		<div
			style={{
				position: 'absolute',
				inset: 0,
				borderRadius: 26,
				backfaceVisibility: 'hidden',
				background: 'linear-gradient(160deg, #4a2a86 0%, #2a1552 55%, #170a33 100%)',
				boxShadow: `inset 0 0 0 3px rgba(232,194,122,${0.6 + 0.4 * brilho}), 0 0 ${46 * brilho}px rgba(232,194,122,${0.55 * brilho})`,
				overflow: 'hidden',
			}}
		>
			<div style={{position: 'absolute', inset: 14, borderRadius: 18, border: '1.5px solid rgba(232,194,122,0.55)'}} />
			<Indice n={n} />
			<Indice n={n} invertido />
			{/* Medalhão central com o naipe grande. */}
			<div style={{position: 'absolute', left: L / 2 - 62, top: 92, width: 124, height: 124, borderRadius: 62, border: `2.5px solid ${OURO}`, boxShadow: 'inset 0 0 22px rgba(232,194,122,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
				<Naipe tam={70} />
			</div>
			<div style={{position: 'absolute', top: 240, left: 20, right: 20, textAlign: 'center', fontFamily: poppins, fontWeight: 900, color: '#fff', lineHeight: 1.05, textShadow: '0 4px 12px rgba(8,2,20,0.6)'}}>
				{palavras.map((p, i) => (
					<div key={i} style={{fontSize: palavras.length > 1 ? 44 : 50, letterSpacing: '0.03em'}}>
						{p}
					</div>
				))}
			</div>
			<div
				style={{
					position: 'absolute',
					top: -100,
					bottom: -100,
					width: 90,
					left: interpolate(reflexo, [0, 1], [-140, 420]),
					transform: 'rotate(20deg)',
					background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,245,220,0.3) 50%, rgba(255,255,255,0) 100%)',
				}}
			/>
		</div>
	);
};

const Verso: React.FC = () => (
	<div
		style={{
			position: 'absolute',
			inset: 0,
			borderRadius: 26,
			backfaceVisibility: 'hidden',
			transform: 'rotateY(180deg)',
			background: '#21104a',
			boxShadow: 'inset 0 0 0 3px #E8C27A',
			overflow: 'hidden',
		}}
	>
		<div
			style={{
				position: 'absolute',
				inset: 16,
				borderRadius: 16,
				backgroundImage:
					'repeating-linear-gradient(45deg, rgba(232,194,122,0.35) 0 2px, transparent 2px 22px), repeating-linear-gradient(-45deg, rgba(232,194,122,0.35) 0 2px, transparent 2px 22px)',
				border: '1.5px solid rgba(232,194,122,0.6)',
			}}
		/>
		<div style={{position: 'absolute', left: L / 2 - 70, top: A / 2 - 70, width: 140, height: 140, borderRadius: 70, background: '#21104a', border: `3px solid ${OURO}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
			<span style={{fontFamily: playfair, fontStyle: 'italic', fontWeight: 800, fontSize: 52, background: OURO_TEXTO, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', padding: '0 0.06em'}}>LCL</span>
		</div>
	</div>
);

export const Cards3D: React.FC<{cena: Cena}> = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const fim = Math.round((cena.ate - cena.de) * fps);
	const y0 = cena.y ?? 1010;
	const n = cena.itens.length;
	// Leque: cartas espaçadas 250 px (sobrepõem ~50 px), giradas e num arco leve; cada nova fica por cima.
	const passo = 250;
	const x0 = 540 - ((n - 1) * passo) / 2 - L / 2;
	const fundo = interpolate(frame, [0, 6, fim - 6, fim], [0, 1, 1, 0], lim);
	const saida = interpolate(frame, [fim - 6, fim], [1, 0], lim);
	const entradas = cena.itens.map((it) => Math.round(Math.max(0, it.em - cena.de) * fps));
	const ultimo = entradas.filter((e) => frame >= e).length - 1;
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			{/* Escurece só a parte de baixo para as cartas lerem bem; o rosto fica livre. */}
			<AbsoluteFill style={{opacity: fundo, background: `linear-gradient(180deg, rgba(30,15,58,0) ${((y0 - 240) / 1920) * 100}%, rgba(30,15,58,0.8) ${((y0 + 60) / 1920) * 100}%, rgba(20,9,40,0.92) 100%)`}} />
			<AbsoluteFill style={{perspective: 1600, perspectiveOrigin: `50% ${((y0 + A / 2) / 1920) * 100}%`, opacity: saida}}>
				{cena.itens.map((it, i) => {
					const l = frame - entradas[i];
					if (l < 0) return null;
					const voo = spring({frame: l, fps, config: {damping: 15, stiffness: 120, mass: 0.9}});
					const vira = spring({frame: l - 2, fps, config: {damping: 13, stiffness: 140}});
					const centro = i - (n - 1) / 2;
					const giroFinal = centro * 7;
					const brilho = i === ultimo ? interpolate(l, [4, 9, 24], [0, 1, 0.3], lim) : 0;
					return (
						<div
							key={i}
							style={{
								position: 'absolute',
								left: x0 + i * passo,
								top: y0 + Math.abs(centro) * 22,
								width: L,
								height: A,
								transformStyle: 'preserve-3d',
								// Sai do baralho (fora da tela, embaixo à direita), voa girando e assenta no leque.
								transform: `translate(${(1 - voo) * 520}px, ${(1 - voo) * 700}px) rotateZ(${giroFinal + (1 - voo) * 40}deg) rotateY(${(1 - vira) * 180}deg) rotateX(${(1 - voo) * 30}deg)`,
								filter: 'drop-shadow(0 26px 30px rgba(6,2,16,0.6))',
							}}
						>
							<Frente texto={it.texto} n={(cena.inicio ?? 1) + i} brilho={brilho} reflexo={interpolate(l, [6, 22], [0, 1], lim)} />
							<Verso />
						</div>
					);
				})}
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
