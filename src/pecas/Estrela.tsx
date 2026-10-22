import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig, spring} from 'remotion';
import {cor} from '../motor/tema';

// Estrela de 4 pontas com glow e aberração cromática (assinatura do canal).
export const caminhoEstrela = (r: number, cintura = 0.14) => {
	const c = r * cintura;
	return `M0,${-r} Q${c},${-c} ${r},0 Q${c},${c} 0,${r} Q${-c},${c} ${-r},0 Q${-c},${-c} 0,${-r} Z`;
};

export const Estrela: React.FC<{
	tamanho?: number;
	atraso?: number;
	girar?: boolean;
	corNucleo?: string;
}> = ({tamanho = 160, atraso = 0, girar = true, corNucleo = cor.branco}) => {
	const frame = useCurrentFrame() - atraso;
	const {fps} = useVideoConfig();
	const entrada = spring({frame, fps, config: {damping: 12, stiffness: 140, mass: 0.6}});
	const r = tamanho / 2;
	const giro = girar ? interpolate(entrada, [0, 1], [-90, 0]) + frame * 0.35 : 0;
	const pulso = 1 + Math.sin(frame / 9) * 0.04;
	// A franja abre na entrada e assenta em 2 px.
	const franja = interpolate(entrada, [0, 1], [10, 2.2]);
	const lado = tamanho * 1.6;

	const camada = (fill: string, dx: number, opacidade: number, blend?: 'screen') => (
		<path
			d={caminhoEstrela(r)}
			fill={fill}
			opacity={opacidade}
			transform={`translate(${dx},0)`}
			style={blend ? {mixBlendMode: blend} : undefined}
		/>
	);

	return (
		<div
			style={{
				width: lado,
				height: lado,
				transform: `scale(${entrada * pulso}) rotate(${giro}deg)`,
				filter: `drop-shadow(0 0 ${r * 0.18}px ${cor.halo}) drop-shadow(0 0 ${r * 0.45}px ${cor.halo}aa)`,
			}}
		>
			<svg width={lado} height={lado} viewBox={`${-lado / 2} ${-lado / 2} ${lado} ${lado}`} overflow="visible">
				{/* Raio de lente fino, só no elemento. */}
				<rect x={-lado / 2} y={-0.8} width={lado} height={1.6} fill={cor.destaque} opacity={0.55 * entrada} />
				{camada(cor.franjaVermelha, -franja, 0.85, 'screen')}
				{camada(cor.franjaAzul, franja, 0.85, 'screen')}
				{camada(corNucleo, 0, 1)}
			</svg>
		</div>
	);
};
