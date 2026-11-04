// Peças do ad-03. Seta apontando para o botão laranja (carrinho do TikTok Shop, canto de baixo à esquerda), do CTA até o fim
// (pedido do docx "Roteiros - Letícia", AD 03).
import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
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

export const pecas: Pecas = {ad03Seta: Seta};
