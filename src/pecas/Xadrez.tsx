import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import type {CenaNoPlano} from '../motor/plano';
import {gloock, unbounded} from '../motor/tema';

// Xadrez em impacto (referência do usuário, 23/10/2026): a rainha vermelha desce no centro do tabuleiro, o impacto
// derruba os peões em volta, e o texto surge com a fala atrás da rainha, iluminado pela mesma luz vermelha.
type Cena = Extract<CenaNoPlano, {tipo: 'xadrez'}>;

const QUEDA = 10; // quadro do impacto
const CASA = 0.62;

// Perfis torneados (raio, altura) suavizados por spline, como uma peça de verdade.
const tornear = (pontos: [number, number][], segmentos = 96) => {
	const curva = new THREE.SplineCurve(pontos.map(([x, y]) => new THREE.Vector2(x, y)));
	return new THREE.LatheGeometry(curva.getPoints(120), segmentos);
};

const PERFIL_PEAO: [number, number][] = [
	[0.001, 0],
	[0.33, 0],
	[0.34, 0.05],
	[0.3, 0.1],
	[0.31, 0.15],
	[0.24, 0.2],
	[0.17, 0.3],
	[0.12, 0.45],
	[0.11, 0.52],
	[0.21, 0.56],
	[0.21, 0.6],
	[0.12, 0.63],
	[0.001, 0.64],
];
const PERFIL_RAINHA: [number, number][] = [
	[0.001, 0],
	[0.56, 0],
	[0.57, 0.07],
	[0.5, 0.13],
	[0.52, 0.2],
	[0.42, 0.27],
	[0.33, 0.33],
	[0.27, 0.5],
	[0.2, 0.9],
	[0.17, 1.3],
	[0.3, 1.36],
	[0.3, 1.42],
	[0.19, 1.47],
	[0.2, 1.54],
	[0.32, 1.8],
	[0.4, 1.98],
	[0.36, 2.0],
	[0.3, 1.95],
	[0.001, 1.9],
];

const Ambiente: React.FC = () => {
	const {gl, scene} = useThree();
	useMemo(() => {
		const pmrem = new THREE.PMREMGenerator(gl);
		scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
		scene.environmentIntensity = 0.9;
	}, [gl, scene]);
	return null;
};

const Camera: React.FC<{f: number; tremor: number}> = ({f, tremor}) => {
	const {camera} = useThree();
	const z = interpolate(f, [0, 60], [8.2, 7.4], {extrapolateRight: 'clamp'});
	camera.position.set(Math.sin(f * 2.1) * tremor * 0.06, 1.25 + Math.cos(f * 2.7) * tremor * 0.06, z);
	camera.lookAt(0, 1.15, 0);
	return null;
};

// Peões nas casas em volta do centro; caem para fora com atraso pela distância (a onda do impacto).
const peoes = (() => {
	const lista: {x: number; z: number; d: number; i: number}[] = [];
	for (let i = -5; i <= 5; i++) {
		for (let j = -4; j <= 6; j++) {
			const d = Math.hypot(i, j);
			if (d < 1.2 || d > 5.5 || j > 6 || (j > 0 && Math.abs(i) < 2) || (j > 2 && Math.abs(i) < 3)) continue;
			if (random(`peao-${i}-${j}`) < 0.42) continue;
			lista.push({x: i * CASA, z: j * CASA, d, i: lista.length});
		}
	}
	return lista;
})();

const Peao: React.FC<{
	x: number;
	z: number;
	d: number;
	i: number;
	f: number;
	geo: THREE.BufferGeometry;
	mat: THREE.Material;
}> = ({x, z, d, i, f, geo, mat}) => {
	const dir = new THREE.Vector3(x, 0, z).normalize();
	const atraso = QUEDA + d * 1.6;
	const p = spring({frame: f - atraso, fps: 30, config: {damping: 11, stiffness: 140, mass: 0.6}});
	const angulo = p * (THREE.MathUtils.degToRad(76) + random(`a${i}`) * 0.12);
	const eixo = new THREE.Vector3(dir.z, 0, -dir.x);
	const q = new THREE.Quaternion().setFromAxisAngle(eixo, angulo);
	const desliza = Math.min(1, Math.max(0, (f - atraso) / 14)) * (0.25 + random(`s${i}`) * 0.4);
	// Gira em torno da borda externa da base, como uma peça tombando de verdade.
	const borda = dir.clone().multiplyScalar(0.33);
	const giro = random(`g${i}`) * Math.PI * 2;
	return (
		<group position={[x + borda.x + dir.x * desliza, 0, z + borda.z + dir.z * desliza]} quaternion={q}>
			<mesh
				geometry={geo}
				material={mat}
				position={[-borda.x, 0, -borda.z]}
				rotation={[0, giro, 0]}
				castShadow
				receiveShadow
			/>
			<mesh material={mat} position={[-borda.x, 0.76, -borda.z]} castShadow>
				<sphereGeometry args={[0.17, 48, 32]} />
			</mesh>
		</group>
	);
};

const Rainha: React.FC<{f: number; geo: THREE.BufferGeometry; mat: THREE.Material}> = ({f, geo, mat}) => {
	const t = Math.min(1, f / QUEDA);
	const cai = 5 * (1 - t * t);
	const recuo = f > QUEDA ? Math.max(0, Math.sin((f - QUEDA) * 0.6) * Math.exp(-(f - QUEDA) * 0.35)) * 0.06 : 0;
	const pontas = Array.from({length: 9}, (_, k) => (k / 9) * Math.PI * 2);
	return (
		<group position={[0, cai + recuo, 0]}>
			<mesh geometry={geo} material={mat} castShadow receiveShadow />
			{pontas.map((a, k) => (
				<mesh key={k} material={mat} position={[Math.cos(a) * 0.37, 2.06, Math.sin(a) * 0.37]} castShadow>
					<coneGeometry args={[0.055, 0.16, 24]} />
				</mesh>
			))}
			<mesh material={mat} position={[0, 2.1, 0]} castShadow>
				<sphereGeometry args={[0.1, 48, 32]} />
			</mesh>
		</group>
	);
};

const Tabuleiro: React.FC<{claro: THREE.Material; escuro: THREE.Material}> = ({claro, escuro}) => {
	const casas = [];
	for (let i = -6; i <= 6; i++) {
		for (let j = -6; j <= 14; j++) {
			casas.push(
				<mesh
					key={`${i},${j}`}
					position={[i * CASA, -0.04, j * CASA]}
					material={(i + j) % 2 === 0 ? escuro : claro}
					receiveShadow
				>
					<boxGeometry args={[CASA, 0.08, CASA]} />
				</mesh>,
			);
		}
	}
	return <group rotation={[0, 0.18, 0]}>{casas}</group>;
};

export const Xadrez: React.FC<{cena: Cena}> = ({cena}) => {
	const f = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const geos = useMemo(() => ({peao: tornear(PERFIL_PEAO), rainha: tornear(PERFIL_RAINHA)}), []);
	const mats = useMemo(
		() => ({
			rainha: new THREE.MeshPhysicalMaterial({
				color: '#b3121b',
				roughness: 0.18,
				metalness: 0.1,
				clearcoat: 1,
				clearcoatRoughness: 0.05,
			}),
			peao: new THREE.MeshPhysicalMaterial({
				color: '#a7a7ab',
				roughness: 0.2,
				metalness: 0.65,
				clearcoat: 1,
				clearcoatRoughness: 0.08,
			}),
			claro: new THREE.MeshPhysicalMaterial({color: '#7d7974', roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05}),
			escuro: new THREE.MeshPhysicalMaterial({
				color: '#050505',
				roughness: 0.1,
				clearcoat: 1,
				clearcoatRoughness: 0.04,
			}),
		}),
		[],
	);
	const tremor = f >= QUEDA ? Math.exp(-(f - QUEDA) * 0.25) : 0;
	const clarao = f >= QUEDA ? Math.exp(-(f - QUEDA) * 0.3) : 0;
	const onda = f >= QUEDA ? (f - QUEDA) / 14 : 0;

	// Texto com a fala: a frase pequena entra no começo, a palavra grande quando ela é dita.
	const emGrande = Math.round((cena.emGrande ?? 0.6) * fps);
	const pq = spring({frame: f - 2, fps, config: {damping: 200}, durationInFrames: 14});
	const tam = Math.min(width * 0.24, (width * 0.86) / (cena.grande.length * 0.52));
	return (
		<AbsoluteFill style={{backgroundColor: '#050202', overflow: 'hidden'}}>
			{/* Fundo: escuro em cima, brasa vermelha no horizonte atrás da rainha. */}
			<AbsoluteFill
				style={{
					background: `radial-gradient(ellipse 85% 38% at 50% 57%, rgba(190,40,20,${0.75 + clarao * 0.25}) 0%, rgba(90,14,8,0.85) 35%, rgba(20,4,3,1) 70%, #050202 100%)`,
				}}
			/>
			<AbsoluteFill
				style={{
					background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0 2px, transparent 2px 9px)',
					WebkitMaskImage: 'linear-gradient(180deg, #000 0%, transparent 60%)',
					maskImage: 'linear-gradient(180deg, #000 0%, transparent 60%)',
				}}
			/>
			{/* Texto atrás da rainha, na luz vermelha da cena. */}
			<div
				style={{
					position: 'absolute',
					top: height * 0.2,
					left: 0,
					right: 0,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
				}}
			>
				<div
					style={{
						fontFamily: unbounded,
						fontWeight: 300,
						fontSize: width * 0.042,
						letterSpacing: width * 0.042 * 0.35,
						textTransform: 'uppercase',
						color: 'rgba(255,235,230,0.85)',
						textShadow: '0 0 18px rgba(255,60,40,0.45)',
						opacity: pq,
						transform: `translateY(${(1 - pq) * 20}px)`,
					}}
				>
					{cena.pequeno}
				</div>
				<div style={{fontFamily: gloock, fontSize: tam, lineHeight: 1, whiteSpace: 'nowrap', marginTop: width * 0.01}}>
					{[...cena.grande].map((ch, i) => {
						const e = spring({frame: f - emGrande - i * 1.1, fps, config: {damping: 200}, durationInFrames: 14});
						return (
							<span
								key={i}
								style={{
									display: 'inline-block',
									opacity: e,
									transform: `translateY(${(1 - e) * tam * 0.2}px) scale(${1 + (1 - e) * 0.15})`,
									// Cromado com o reflexo vermelho embaixo, igual às peças.
									background:
										'linear-gradient(180deg, #ffffff 0%, #ece6e2 38%, #b9aaa6 58%, #a3221c 82%, #5a0b08 100%)',
									WebkitBackgroundClip: 'text',
									backgroundClip: 'text',
									color: 'transparent',
									filter: `blur(${(1 - e) * 10}px) drop-shadow(0 0 ${tam * 0.1}px rgba(255,50,30,0.45))`,
									padding: '0 0.02em',
								}}
							>
								{ch === ' ' ? ' ' : ch}
							</span>
						);
					})}
				</div>
			</div>
			<ThreeCanvas
				width={width}
				height={height}
				shadows
				gl={{alpha: true, antialias: true, preserveDrawingBuffer: true}}
				camera={{fov: 40, position: [0, 1.25, 8.2], near: 0.1, far: 60}}
				style={{position: 'absolute', inset: 0}}
			>
				<Ambiente />
				<Camera f={f} tremor={tremor} />
				<ambientLight intensity={0.15} />
				<spotLight
					position={[1.5, 7, 4]}
					angle={0.42}
					penumbra={0.7}
					intensity={110 + clarao * 120}
					color="#fff1e6"
					castShadow
					shadow-mapSize={[2048, 2048]}
					shadow-bias={-0.0004}
				/>
				{/* Contraluz vermelha atrás, que desenha o contorno das peças. */}
				<pointLight position={[0, 2.2, -3.2]} intensity={60 + clarao * 140} color="#ff2a14" distance={14} />
				<pointLight position={[-3, 1.2, 1.5]} intensity={8} color="#ff6040" distance={10} />
				<Tabuleiro claro={mats.claro} escuro={mats.escuro} />
				{/* Onda de choque: anel vermelho que se espalha no tabuleiro. */}
				{onda > 0 && onda < 1 && (
					<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
						<ringGeometry args={[onda * 3.2, onda * 3.2 + 0.12, 96]} />
						<meshBasicMaterial color="#ff5a3c" transparent opacity={(1 - onda) * 0.7} />
					</mesh>
				)}
				<Rainha f={f} geo={geos.rainha} mat={mats.rainha} />
				{peoes.map((p) => (
					<Peao key={p.i} {...p} f={f} geo={geos.peao} mat={mats.peao} />
				))}
			</ThreeCanvas>
			{/* Clarão do impacto e vinheta. */}
			<AbsoluteFill style={{background: `rgba(255,90,60,${clarao * 0.25})`, mixBlendMode: 'screen'}} />
			<AbsoluteFill
				style={{background: 'radial-gradient(ellipse 75% 60% at 50% 48%, transparent 40%, rgba(0,0,0,0.85) 100%)'}}
			/>
		</AbsoluteFill>
	);
};
