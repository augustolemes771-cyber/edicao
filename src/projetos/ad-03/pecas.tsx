// Peças do ad-03. Seta apontando para o botão laranja (carrinho do TikTok Shop, canto de baixo à esquerda), do CTA até o fim
// (pedido do docx "Roteiros - Letícia", AD 03).
import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Pecas} from '../../pecas/peca';

const Seta: Pecas[string] = () => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const ent = spring({frame, fps, config: {damping: 12, stiffness: 160}});
	const pulo = Math.sin((frame / fps) * Math.PI * 2.2) * height * 0.012;
	const w = width * 0.2;
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<svg
				viewBox="0 0 100 120"
				style={{
					position: 'absolute',
					left: width * 0.07,
					top: height * 0.66 + pulo,
					width: w,
					height: w * 1.2,
					opacity: interpolate(ent, [0, 0.4], [0, 1], {extrapolateRight: 'clamp'}),
					transform: `scale(${0.5 + 0.5 * ent})`,
					filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.55))',
				}}
			>
				<path d="M35 0 H65 V62 H92 L50 118 L8 62 H35 Z" fill="#ff6a00" stroke="#fff" strokeWidth="5" strokeLinejoin="round" />
			</svg>
		</AbsoluteFill>
	);
};

// B-roll do produto (docx: "Coloca um B-rol aqui do produto"): o pote na metade de cima, no lugar do melão, com zoom lento.
const Produto: Pecas[string] = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const dur = (cena.ate - cena.de) * fps;
	const ent = spring({frame, fps, config: {damping: 14, stiffness: 150}});
	const zoom = interpolate(frame, [0, dur], [1, 1.12]);
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<div
				style={{
					position: 'absolute',
					top: 0,
					left: 0,
					width,
					height: height / 2,
					overflow: 'hidden',
					background: '#ffffff',
					opacity: interpolate(ent, [0, 0.5], [0, 1], {extrapolateRight: 'clamp'}),
				}}
			>
				<Img
					src={staticFile('projetos/ad-03/produto.jpg')}
					style={{position: 'absolute', left: (width - height / 2) / 2, top: 0, width: height / 2, height: height / 2, transform: `scale(${zoom * (0.85 + 0.15 * ent)})`}}
				/>
			</div>
		</AbsoluteFill>
	);
};

export const pecas: Pecas = {ad03Seta: Seta, ad03Produto: Produto};
