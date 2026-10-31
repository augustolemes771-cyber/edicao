// Avião e cenário 3D low-poly (estilo das referências: cores chapadas, flatShading, formas simples) compartilhados pelas cenas do
// referencias-ig-1. O avião aponta para +X (nariz), asas em ±Z, cima em +Y. Peças móveis controladas por props (0 a 1 ou -1 a 1).
import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';

export const lim = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const COR = {
	ceu1: '#7ec8f2',
	ceu2: '#d8f0ff',
	grama: '#7cc457',
	pista: '#5b6068',
	faixa: '#f4f4f4',
	branco: '#f5f7fa',
	azul: '#2f6fd6',
	cinza: '#b9c0ca',
	cinzaEscuro: '#6c7480',
	preto: '#23262b',
	amarelo: '#ffcf3a',
	vermelho: '#e5484d',
	laranja: '#ff8a3d',
	ar: '#9fe3ff',
};

const mat = (cor: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
	new THREE.MeshStandardMaterial({color: cor, flatShading: true, roughness: 0.75, metalness: 0.05, ...extra});

export const useMateriais = () =>
	useMemo(
		() => ({
			branco: mat(COR.branco),
			azul: mat(COR.azul),
			cinza: mat(COR.cinza),
			cinzaEscuro: mat(COR.cinzaEscuro),
			preto: mat(COR.preto),
			amarelo: mat(COR.amarelo),
			vermelho: mat(COR.vermelho),
			laranja: mat(COR.laranja, {emissive: COR.laranja, emissiveIntensity: 0.4}),
			vidro: mat('#25313f', {roughness: 0.3, metalness: 0.3}),
			grama: mat(COR.grama),
			pista: mat(COR.pista),
			faixa: mat(COR.faixa),
			nuvem: mat('#ffffff', {roughness: 1}),
			ar: new THREE.MeshBasicMaterial({color: COR.ar, transparent: true, opacity: 0.85}),
			arQuente: new THREE.MeshBasicMaterial({color: COR.laranja, transparent: true, opacity: 0.85}),
		}),
		[],
	);
export type Materiais = ReturnType<typeof useMateriais>;

// ---------------------------------------------------------------- avião
export type PoseAviao = {
	flaps?: number; // 0 recolhido, 1 todo estendido (para trás e para baixo)
	aileron?: number; // -1..1: positivo = aileron direito (z+) sobe, esquerdo desce
	profundor?: number; // -1..1: positivo = profundor sobe (nariz sobe)
	spoiler?: number; // 0..1: placas em cima da asa levantam
	trem?: number; // 0 recolhido, 1 baixado
	compressao?: number; // 0..1: amortecedor do trem comprimido no toque
	giroTurbina?: number; // ângulo do fan (radianos)
	semAsas?: boolean; // cena 1: só a fuselagem
	asas?: number; // 0..1: asas crescendo do corpo (cena 2)
};

// Asa de um lado (lado = 1 para z+, -1 para z−). Corda ~2,4 na raiz, 1,1 na ponta, enflechamento para trás.
const Asa: React.FC<{lado: 1 | -1; m: Materiais; pose: PoseAviao}> = ({lado, m, pose}) => {
	const env = pose.asas ?? 1;
	const s = Math.max(0.001, env);
	const flap = pose.flaps ?? 0;
	const ail = (pose.aileron ?? 0) * lado;
	const spo = pose.spoiler ?? 0;
	// planta da asa (no plano XZ, extrudada em Y = espessura)
	const geo = useMemo(() => {
		const sh = new THREE.Shape();
		sh.moveTo(1.2, 0); // bordo de ataque na raiz
		sh.lineTo(-0.9, 5.6); // bordo de ataque na ponta (enflechado)
		sh.lineTo(-2.0, 5.6); // bordo de fuga na ponta
		sh.lineTo(-1.2, 0); // bordo de fuga na raiz
		sh.closePath();
		const g = new THREE.ExtrudeGeometry(sh, {depth: 0.16, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 1});
		g.rotateX(Math.PI / 2); // shape XY → XZ (z do shape vira -y): espessura para baixo
		return g;
	}, []);
	// bordo de fuga em z: x = -1.2 + (-0.8)*(z/5.6)
	const fuga = (z: number) => -1.2 - 0.8 * (z / 5.6);
	const painel = (z0: number, z1: number) => ({z: (z0 + z1) / 2, x: (fuga(z0) + fuga(z1)) / 2, larg: z1 - z0});
	const F = painel(0.9, 3.4);
	const A = painel(3.7, 5.3);
	const ang = Math.atan2(0.8, 5.6); // enflechamento do bordo de fuga
	return (
		<group scale={[1, 1, s * lado]} position={[0, -0.25, 0]}>
			<mesh geometry={geo} material={m.cinza} position={[0, 0.08, 0]} />
			{/* flap: sai para trás e gira para baixo */}
			<group position={[F.x - flap * 0.55, 0.0, F.z]} rotation={[0, ang * -1, 0]}>
				<group rotation={[0, 0, -flap * 0.55]}>
					<mesh material={pose.flaps !== undefined && flap > 0 ? m.amarelo : m.cinzaEscuro} position={[-0.32, -0.02, 0]}>
						<boxGeometry args={[0.65, 0.09, F.larg]} />
					</mesh>
				</group>
			</group>
			{/* aileron: gira em torno da dobradiça no bordo de fuga */}
			<group position={[A.x, 0.0, A.z]} rotation={[0, -ang, 0]}>
				<group rotation={[0, 0, ail * 0.45 * lado]}>
					<mesh material={Math.abs(ail) > 0.02 ? m.amarelo : m.cinzaEscuro} position={[-0.25, -0.02, 0]}>
						<boxGeometry args={[0.5, 0.08, A.larg]} />
					</mesh>
				</group>
			</group>
			{/* spoilers: placas no dorso da asa que levantam */}
			{[1.6, 2.5].map((z) => (
				<group key={z} position={[fuga(z) + 0.75, 0.1, z]} rotation={[0, -ang, 0]}>
					<group rotation={[0, 0, spo * 0.8]}>
						<mesh material={spo > 0.02 ? m.amarelo : m.cinza} position={[-0.3, 0.02, 0]}>
							<boxGeometry args={[0.6, 0.05, 0.8]} />
						</mesh>
					</group>
				</group>
			))}
			{/* turbina embaixo da asa */}
			<Turbina m={m} pose={pose} position={[0.9, -0.62, 2.3]} />
		</group>
	);
};

export const Turbina: React.FC<{m: Materiais; pose: PoseAviao; position: [number, number, number]; escala?: number}> = ({m, pose, position, escala = 1}) => (
	<group position={position} scale={escala}>
		<mesh material={m.branco} rotation={[0, 0, Math.PI / 2]}>
			<cylinderGeometry args={[0.42, 0.36, 1.5, 12, 1, true]} />
		</mesh>
		<mesh material={m.cinzaEscuro} rotation={[0, 0, Math.PI / 2]} position={[0.74, 0, 0]}>
			<torusGeometry args={[0.42, 0.06, 6, 12]} />
		</mesh>
		{/* fan */}
		<group position={[0.6, 0, 0]} rotation={[pose.giroTurbina ?? 0, 0, 0]}>
			{Array.from({length: 8}).map((_, i) => (
				<mesh key={i} material={m.preto} rotation={[(i / 8) * Math.PI * 2, 0, 0]} position={[0, 0, 0]}>
					<boxGeometry args={[0.04, 0.72, 0.14]} />
				</mesh>
			))}
			<mesh material={m.cinza} rotation={[0, 0, -Math.PI / 2]} position={[0.05, 0, 0]}>
				<coneGeometry args={[0.13, 0.25, 8]} />
			</mesh>
		</group>
		{/* pilone */}
		<mesh material={m.cinza} position={[-0.1, 0.45, 0]}>
			<boxGeometry args={[0.9, 0.4, 0.1]} />
		</mesh>
	</group>
);

const Trem: React.FC<{m: Materiais; pose: PoseAviao; position: [number, number, number]; rodas?: number}> = ({m, pose, position, rodas = 2}) => {
	const t = pose.trem ?? 1;
	const c = pose.compressao ?? 0;
	if (t <= 0.01) return null;
	const alt = 0.9 * t - 0.25 * c;
	return (
		<group position={position}>
			<mesh material={m.cinzaEscuro} position={[0, -alt / 2, 0]}>
				<cylinderGeometry args={[0.07, 0.07, alt, 6]} />
			</mesh>
			{/* amortecedor (parte brilhante que encolhe) */}
			<mesh material={m.amarelo} position={[0, -alt + 0.25, 0]}>
				<cylinderGeometry args={[0.1, 0.1, 0.3 - 0.15 * c, 6]} />
			</mesh>
			{Array.from({length: rodas}).map((_, i) => (
				<mesh key={i} material={m.preto} rotation={[Math.PI / 2, 0, 0]} position={[0, -alt, (i - (rodas - 1) / 2) * 0.32]}>
					<cylinderGeometry args={[0.22, 0.22, 0.16, 10]} />
				</mesh>
			))}
		</group>
	);
};

export const Aviao: React.FC<{pose?: PoseAviao; m: Materiais}> = ({pose = {}, m}) => {
	const prof = pose.profundor ?? 0;
	return (
		<group>
			{/* fuselagem */}
			<mesh material={m.branco} rotation={[0, 0, Math.PI / 2]}>
				<cylinderGeometry args={[0.62, 0.62, 8.4, 14]} />
			</mesh>
			<mesh material={m.branco} rotation={[0, 0, -Math.PI / 2]} position={[4.75, 0, 0]}>
				<coneGeometry args={[0.62, 1.1, 14]} />
			</mesh>
			<mesh material={m.branco} rotation={[0, 0, Math.PI / 2]} position={[-5.1, 0.18, 0]} scale={[1, 1, 0.75]}>
				<coneGeometry args={[0.62, 1.6, 14]} />
			</mesh>
			{/* faixa azul e janelas */}
			<mesh material={m.azul} rotation={[0, 0, Math.PI / 2]} position={[0, -0.18, 0]} scale={[1.006, 1, 1.006]}>
				<cylinderGeometry args={[0.62, 0.62, 8.4, 14, 1, true, Math.PI * 0.62, Math.PI * 0.76]} />
			</mesh>
			{Array.from({length: 12}).map((_, i) => (
				<group key={i}>
					<mesh material={m.vidro} position={[3 - i * 0.55, 0.18, 0.6]}>
						<boxGeometry args={[0.2, 0.18, 0.05]} />
					</mesh>
					<mesh material={m.vidro} position={[3 - i * 0.55, 0.18, -0.6]}>
						<boxGeometry args={[0.2, 0.18, 0.05]} />
					</mesh>
				</group>
			))}
			{/* cabine do piloto */}
			<mesh material={m.vidro} position={[4.6, 0.3, 0]} rotation={[0, 0, -0.5]}>
				<boxGeometry args={[0.5, 0.18, 0.9]} />
			</mesh>
			{/* asas */}
			{!pose.semAsas ? (
				<>
					<Asa lado={1} m={m} pose={pose} />
					<Asa lado={-1} m={m} pose={pose} />
				</>
			) : null}
			{/* deriva (cauda vertical) */}
			<mesh material={m.azul} position={[-4.9, 1.25, 0]} rotation={[0, 0, 0.45]}>
				<boxGeometry args={[1.3, 1.9, 0.12]} />
			</mesh>
			{/* estabilizador horizontal + profundor */}
			{[1, -1].map((l) => (
				<group key={l} position={[-5.0, 0.3, l * 1.15]}>
					<mesh material={m.cinza}>
						<boxGeometry args={[1.0, 0.08, 1.9]} />
					</mesh>
					<group position={[-0.5, 0, 0]} rotation={[0, 0, prof * 0.5]}>
						<mesh material={Math.abs(prof) > 0.02 ? m.amarelo : m.cinzaEscuro} position={[-0.25, 0, 0]}>
							<boxGeometry args={[0.5, 0.07, 1.8]} />
						</mesh>
					</group>
				</group>
			))}
			{/* trem de pouso: nariz + dois principais */}
			<Trem m={m} pose={pose} position={[3.4, -0.55, 0]} />
			<Trem m={m} pose={pose} position={[-0.6, -0.55, 0.9]} rodas={2} />
			<Trem m={m} pose={pose} position={[-0.6, -0.55, -0.9]} rodas={2} />
		</group>
	);
};

// ---------------------------------------------------------------- cenário
export const Nuvem: React.FC<{m: Materiais; position: [number, number, number]; escala?: number}> = ({m, position, escala = 1}) => (
	<group position={position} scale={escala}>
		{[
			[0, 0, 0, 1],
			[0.9, 0.2, 0.1, 0.8],
			[-0.9, 0.1, 0, 0.75],
			[0.3, 0.6, 0, 0.7],
		].map(([x, y, z, r], i) => (
			<mesh key={i} material={m.nuvem} position={[x, y, z]}>
				<icosahedronGeometry args={[r, 0]} />
			</mesh>
		))}
	</group>
);

export const Chao: React.FC<{m: Materiais; pista?: boolean; deslocamento?: number}> = ({m, pista = true, deslocamento = 0}) => (
	<group>
		<mesh material={m.grama} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.6, 0]}>
			<planeGeometry args={[400, 400]} />
		</mesh>
		{pista ? (
			<group position={[0, -1.58, 0]}>
				<mesh material={m.pista} rotation={[-Math.PI / 2, 0, 0]}>
					<planeGeometry args={[400, 6]} />
				</mesh>
				{Array.from({length: 40}).map((_, i) => (
					<mesh key={i} material={m.faixa} rotation={[-Math.PI / 2, 0, 0]} position={[((i * 6 - deslocamento) % 240) - 120, 0.01, 0]}>
						<planeGeometry args={[3, 0.25]} />
					</mesh>
				))}
			</group>
		) : null}
		{/* arvorezinhas low-poly ao lado */}
		{Array.from({length: 24}).map((_, i) => {
			const x = ((i * 13 - deslocamento * 0.98) % 260) - 130;
			const z = (i % 2 ? 1 : -1) * (7 + (i % 5) * 2.2);
			return (
				<group key={i} position={[x, -1.6, z]}>
					<mesh material={m.cinzaEscuro} position={[0, 0.4, 0]}>
						<cylinderGeometry args={[0.12, 0.15, 0.8, 5]} />
					</mesh>
					<mesh material={m.grama} position={[0, 1.2, 0]}>
						<coneGeometry args={[0.7, 1.6, 6]} />
					</mesh>
				</group>
			);
		})}
	</group>
);

// Céu em gradiente (CSS atrás do canvas transparente) + canvas com luzes padrão.
export const Palco: React.FC<{children: React.ReactNode; camera: [number, number, number]; alvo?: [number, number, number]; fov?: number; ceu?: [string, string]}> = ({
	children,
	camera,
	alvo = [0, 0, 0],
	fov = 40,
	ceu = [COR.ceu1, COR.ceu2],
}) => {
	const {width, height} = useVideoConfig();
	return (
		<AbsoluteFill style={{background: `linear-gradient(180deg, ${ceu[0]} 0%, ${ceu[1]} 70%)`}}>
			<ThreeCanvas width={width} height={height} gl={{alpha: true, antialias: true, preserveDrawingBuffer: true}} camera={{fov, position: camera, near: 0.1, far: 500}} style={{position: 'absolute', inset: 0}}>
				<OlharPara alvo={alvo} />
				<ambientLight intensity={0.75} />
				<directionalLight position={[8, 14, 6]} intensity={1.6} />
				<directionalLight position={[-6, 4, -8]} intensity={0.45} />
				{children}
			</ThreeCanvas>
		</AbsoluteFill>
	);
};

// Aponta a câmera para o alvo a cada quadro (a câmera do ThreeCanvas é a padrão do r3f).
import {useThree} from '@react-three/fiber';
const OlharPara: React.FC<{alvo: [number, number, number]}> = ({alvo}) => {
	const {camera} = useThree();
	camera.lookAt(alvo[0], alvo[1], alvo[2]);
	camera.updateProjectionMatrix();
	return null;
};

// Interpolação de câmera entre pontos-chave [quadro, [x,y,z]].
export const trilha = (frame: number, chaves: [number, [number, number, number]][]): [number, number, number] => {
	const qs = chaves.map((c) => c[0]);
	return [0, 1, 2].map((i) =>
		interpolate(
			frame,
			qs,
			chaves.map((c) => c[1][i]),
			{...lim, easing: (x) => x * x * (3 - 2 * x)},
		),
	) as [number, number, number];
};

// Rótulo amarelo (pílula) como nas referências: "SUSTENTAÇÃO", "FLAPS"...
export const Rotulo: React.FC<{texto: string; x?: number; y: number; p: number; tam?: number}> = ({texto, x, y, p, tam = 56}) => (
	<div
		style={{
			position: 'absolute',
			top: y,
			left: x === undefined ? 0 : x,
			width: x === undefined ? '100%' : undefined,
			textAlign: 'center',
			opacity: Math.min(1, p * 1.5),
			transform: `scale(${0.6 + 0.4 * p})`,
		}}
	>
		<span
			style={{
				display: 'inline-block',
				padding: '10px 30px',
				borderRadius: 40,
				background: COR.amarelo,
				color: '#1d1d1d',
				fontFamily: 'Montserrat, Poppins, sans-serif',
				fontWeight: 900,
				fontSize: tam,
				letterSpacing: '0.04em',
				boxShadow: '0 10px 26px rgba(0,0,0,0.25)',
			}}
		>
			{texto}
		</span>
	</div>
);

export const useQ = (de: number) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return {frame, fps, q: (s: unknown) => Math.round(Math.max(0, Number(s) - de) * fps)};
};
