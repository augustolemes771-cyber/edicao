import React from 'react';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {cor} from '../motor/tema';
import {caminhoEstrela} from './Estrela';

// Estrela 3D: camadas extrudadas girando em perspectiva (substitui o three.js).
const CAMADAS = 18;

export const Logo3D: React.FC<{tamanho?: number}> = ({tamanho = 360}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const p = spring({frame, fps, config: {damping: 14, stiffness: 120}});
	const r = tamanho / 2;
	const lado = tamanho * 1.2;

	return (
		<div style={{perspective: 1400, width: lado, height: lado}}>
			<div
				style={{
					width: lado,
					height: lado,
					position: 'relative',
					transformStyle: 'preserve-3d',
					transform: `scale(${p}) rotateX(${12 + Math.sin(frame / 40) * 6}deg) rotateY(${(1 - p) * -180 + frame * 2.2}deg)`,
				}}
			>
				{Array.from({length: CAMADAS}, (_, i) => {
					const frente = i === CAMADAS - 1;
					const z = (i - CAMADAS / 2) * 2.4;
					const tom = frente ? cor.branco : i === 0 ? cor.destaque : cor.verde;
					return (
						<svg
							key={i}
							width={lado}
							height={lado}
							viewBox={`${-lado / 2} ${-lado / 2} ${lado} ${lado}`}
							style={{
								position: 'absolute',
								inset: 0,
								transform: `translateZ(${z}px)`,
								opacity: frente ? 1 : 0.55 + (i / CAMADAS) * 0.4,
								filter: frente ? `drop-shadow(0 0 14px ${cor.halo}) drop-shadow(0 0 40px ${cor.halo}aa)` : undefined,
							}}
						>
							<path d={caminhoEstrela(r, 0.16)} fill={tom} />
						</svg>
					);
				})}
			</div>
		</div>
	);
};
