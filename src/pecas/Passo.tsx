import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {brilho, cor, poppins} from '../motor/tema';

// Moldura tracejada luminosa tipo "Passo 1" (assinatura do canal).
export const Passo: React.FC<{rotulo: string; texto: string; escala?: number}> = ({
	rotulo,
	texto,
	escala = 1,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const p = spring({frame, fps, config: {damping: 15, stiffness: 160, mass: 0.6}});
	const pTexto = spring({frame: frame - 6, fps, config: {damping: 16, stiffness: 180}});
	const raio = 22 * escala;

	return (
		<div
			style={{
				position: 'relative',
				padding: `${34 * escala}px ${46 * escala}px ${30 * escala}px`,
				opacity: interpolate(p, [0, 0.4], [0, 1], {extrapolateRight: 'clamp'}),
				transform: `scale(${0.88 + 0.12 * p})`,
				fontFamily: poppins,
				maxWidth: 1100 * escala,
			}}
		>
			<svg
				style={{position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible'}}
			>
				<rect
					x={0}
					y={0}
					width="100%"
					height="100%"
					rx={raio}
					fill="rgba(3,4,5,0.55)"
					stroke={cor.verde}
					strokeWidth={2.6 * escala}
					strokeDasharray={`${14 * escala} ${9 * escala}`}
					strokeDashoffset={-frame * 0.7}
					style={{filter: `drop-shadow(0 0 6px ${cor.halo}) drop-shadow(0 0 16px ${cor.halo}99)`}}
				/>
			</svg>
			<div
				style={{
					position: 'absolute',
					top: -20 * escala,
					left: 34 * escala,
					padding: `${4 * escala}px ${16 * escala}px`,
					borderRadius: 999,
					background: cor.verde,
					color: cor.branco,
					fontWeight: 700,
					fontSize: 24 * escala,
					letterSpacing: 1.5,
					textTransform: 'uppercase',
					boxShadow: brilho(cor.halo, 0.6),
					transform: `translateY(${(1 - p) * 12}px)`,
				}}
			>
				{rotulo}
			</div>
			<div
				style={{
					position: 'relative',
					color: cor.branco,
					fontWeight: 600,
					fontSize: 46 * escala,
					lineHeight: 1.2,
					opacity: pTexto,
					transform: `translateY(${(1 - pTexto) * 16}px)`,
					textShadow: '0 0 14px rgba(255,255,255,0.3)',
				}}
			>
				{texto}
			</div>
		</div>
	);
};
