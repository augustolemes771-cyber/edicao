// Texto 3D de impacto pronto (ouro ou branco metálico): letras que caem com mola, onda de choque, faíscas e tremor.
// Uso: <Texto3DImpacto texto="NUNCA MAIS" dur={2} /> dentro de uma cena. Wrapper fino sobre tres/Texto3D.
import React from 'react';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CameraTremor, Faiscas, Linha3D, Luzes, Onda, type Metal} from '../tres/Texto3D';

export const Texto3DImpacto: React.FC<{texto: string; dur: number; inicio?: number; metal?: Metal; y?: number; largura?: number; cor?: string}> = ({
	texto,
	dur,
	inicio = 0,
	metal = 'ouro',
	y = 0,
	largura = 7,
	cor = '#E8C27A',
}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const ini = Math.round(inicio * fps);
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<ThreeCanvas width={width} height={height} gl={{alpha: true, antialias: true, preserveDrawingBuffer: true}} camera={{fov: 35, position: [0, 0, 14.5], near: 0.1, far: 60}} style={{position: 'absolute', inset: 0}}>
				<CameraTremor quadro={frame} batidas={[ini + 10]} duracao={Math.round(dur * fps)} />
				<Luzes quadro={frame} batidas={[ini]} />
				<Linha3D texto={texto} metal={metal} largura={largura} y={y} quadro={frame} batida={ini} profundidade={0.3} />
				<Onda quadro={frame} inicio={ini + 10} y={y} cor={cor} />
				<Faiscas quadro={frame} inicio={ini + 10} y={y} cor={cor} />
			</ThreeCanvas>
		</AbsoluteFill>
	);
};
