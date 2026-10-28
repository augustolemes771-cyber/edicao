// Objeto 3D que sai de um ponto da tela (ex.: o contador de espectadores) e voa ao centro, com legenda 3D opcional.
// Qualquer objeto three.js entra como children (ex.: <OlhoDourado/>). Coordenadas de origem em fração da tela (0-1).
import React from 'react';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Linha3D, Luzes} from '../tres/Texto3D';

const lim = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const CAM_Z = 14.5;
const FOV = 35;

export const OlhoDourado: React.FC<{giro?: number}> = ({giro = 0}) => (
	<group rotation={[0, giro, 0]}>
		<mesh scale={[1.5, 1.5, 1.5]}>
			<sphereGeometry args={[1, 48, 48]} />
			<meshStandardMaterial color="#f7f3ea" roughness={0.25} metalness={0.05} />
		</mesh>
		<mesh position={[0, 0, 1.38]} scale={[1, 1, 0.45]}>
			<sphereGeometry args={[0.72, 40, 40]} />
			<meshStandardMaterial color="#E8C27A" roughness={0.2} metalness={0.9} />
		</mesh>
		<mesh position={[0, 0, 1.62]} scale={[1, 1, 0.4]}>
			<sphereGeometry args={[0.33, 32, 32]} />
			<meshStandardMaterial color="#120826" roughness={0.1} />
		</mesh>
	</group>
);

export const ObjetoVoaAoCentro: React.FC<{
	inicio?: number; // segundos desde o começo da cena
	dur: number; // duração da cena em segundos
	origem?: {x: number; y: number}; // fração da tela; padrão = contador de espectadores (canto superior direito)
	destinoY?: number; // altura final em unidades 3D (0 = meio, 1 = alto)
	escalaFinal?: number;
	legenda?: string;
	children: React.ReactNode;
}> = ({inicio = 0, dur, origem = {x: 0.855, y: 0.057}, destinoY = 0.9, escalaFinal = 1.32, legenda, children}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const ini = Math.round(inicio * fps);
	const local = frame - ini;
	if (local < 0) return null;
	const meia = CAM_Z * Math.tan((FOV / 2) * (Math.PI / 180));
	const meiaL = meia * (width / height);
	const p = spring({frame: local, fps, config: {damping: 13, stiffness: 90, mass: 0.9}});
	const x0 = (origem.x - 0.5) * 2 * meiaL;
	const y0 = (0.5 - origem.y) * 2 * meia;
	const fim = Math.round(dur * fps);
	const saida = interpolate(frame, [fim - 7, fim], [1, 0], lim);
	const giro = (1 - p) * 1.2 + Math.sin((local / fps) * 2.2) * 0.25 * (1 - p * 0.6);
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: saida, filter: 'drop-shadow(0 22px 30px rgba(12,4,28,0.6))'}}>
			<ThreeCanvas width={width} height={height} gl={{alpha: true, antialias: true, preserveDrawingBuffer: true}} camera={{fov: FOV, position: [0, 0, CAM_Z], near: 0.1, far: 60}} style={{position: 'absolute', inset: 0}}>
				<Luzes quadro={frame} batidas={[ini]} />
				<group position={[x0 * (1 - p), y0 + (destinoY - y0) * p, 0]} scale={0.22 + (escalaFinal - 0.22) * p} rotation={[0, giro, 0]}>
					{children}
				</group>
				{legenda ? <Linha3D texto={legenda} metal="branco" largura={4.6} y={-2.1} quadro={frame} batida={ini + 14} profundidade={0.22} /> : null}
			</ThreeCanvas>
		</AbsoluteFill>
	);
};
