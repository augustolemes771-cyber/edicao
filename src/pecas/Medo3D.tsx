// "Medo" sem glitch (pedido do usuário, 28/10/2026, depoimento-2: gostou do tempo e do texto, não do glitch): o vídeo escurece
// em roxo e uma vinheta vai fechando devagar em volta do texto (o medo aperta); cada linha bate em texto 3D de verdade no seu
// tempo (primeira em branco metálico, a última em ouro), com onda e faíscas, e o bloco recua um pouco enquanto a vinheta fecha,
// como quem dá um passo para trás. Esconde a legenda.
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import type {CenaNoPlano} from '../motor/plano';
import {Faiscas, Linha3D, Luzes, Onda} from './tres/Texto3D';

type Cena = Extract<CenaNoPlano, {tipo: 'medo3d'}>;
const lim = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const Medo3D: React.FC<{cena: Cena}> = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const fim = Math.round((cena.ate - cena.de) * fps);
	const fundo = interpolate(frame, [0, 5, fim - 5, fim], [0, 1, 1, 0], lim);
	// Vinheta: abre larga e fecha até ~55% ao longo da cena.
	const fecha = interpolate(frame, [0, fim], [0, 1], {...lim, easing: (x) => 1 - (1 - x) * (1 - x)});
	const raio = 95 - 40 * fecha;
	const recua = 1 - 0.07 * fecha;
	const meia = 14.5 * Math.tan((35 / 2) * (Math.PI / 180));
	const yMundo = (px: number) => ((height / 2 - px) / (height / 2)) * meia;
	const batidas = cena.linhas.map((l) => Math.round(Math.max(0, l.em - cena.de) * fps));
	const topo = cena.y ?? 860 - ((cena.linhas.length - 1) * 190) / 2;
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: fundo}}>
			<AbsoluteFill style={{background: 'rgba(24,11,48,0.78)'}} />
			<AbsoluteFill style={{background: `radial-gradient(ellipse ${raio}% ${raio * 0.7}% at 50% ${(topo / height) * 100 + 4}%, rgba(10,4,24,0) 35%, rgba(6,2,16,0.97) 100%)`}} />
			<AbsoluteFill style={{transform: `scale(${recua})`, filter: 'drop-shadow(0 20px 26px rgba(4,1,12,0.75))'}}>
				<ThreeCanvas
					width={width}
					height={height}
					gl={{alpha: true, antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05}}
					camera={{fov: 35, position: [0, 0, 14.5], near: 0.1, far: 60}}
					style={{position: 'absolute', inset: 0}}
				>
					<Luzes quadro={frame} batidas={batidas} />
					{cena.linhas.map((l, i) => {
						const y = yMundo(topo + i * 190);
						const ultima = i === cena.linhas.length - 1;
						return (
							<React.Fragment key={i}>
								<Linha3D texto={l.texto} metal={l.metal ?? (ultima ? 'ouro' : 'branco')} largura={l.largura ?? (l.texto.length <= 5 ? 3.4 : 4.6)} y={y} quadro={frame} batida={batidas[i]} profundidade={0.32} />
								<Onda quadro={frame} inicio={batidas[i]} y={y} cor={ultima ? '#ffd27a' : '#d9d2ff'} tamanho={2.4} />
								<Faiscas quadro={frame} inicio={batidas[i]} y={y} cor={ultima ? '#ffd27a' : '#e6e0ff'} largura={4} />
							</React.Fragment>
						);
					})}
				</ThreeCanvas>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
