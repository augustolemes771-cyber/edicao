// Texto 3D de verdade (three.js): letras extrudadas com chanfro, metal ouro e branco com reflexo de estúdio,
// queda letra por letra com mola, onda de choque, faíscas, clarão e tremor de câmera. Usado pelo drama do tema Entrevista.
// Fonte: Montserrat Black convertida por scripts/fonte-typeface.mjs (public/fontes/montserrat-black.typeface.json).
import React, {useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import {interpolate, random, spring, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {FontLoader} from 'three/examples/jsm/loaders/FontLoader.js';
import {TextGeometry} from 'three/examples/jsm/geometries/TextGeometry.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import fonteJson from '../../../public/fontes/montserrat-black.typeface.json';

const fonte = new FontLoader().parse(fonteJson as never);
const lim = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// sangue e cinza: metais sombrios para medo (aço escuro com reflexo vermelho apagado / grafite roxo), depoimento-2.
export type Metal = 'ouro' | 'branco' | 'sangue' | 'cinza';

const materiais = (metal: Metal) => {
	if (metal === 'sangue') {
		return [
			new THREE.MeshPhysicalMaterial({color: '#5a0f14', metalness: 0.85, roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.3, envMapIntensity: 0.7}),
			new THREE.MeshPhysicalMaterial({color: '#140306', metalness: 1, roughness: 0.45, envMapIntensity: 0.6}),
		];
	}
	if (metal === 'cinza') {
		return [
			new THREE.MeshPhysicalMaterial({color: '#3a3446', metalness: 0.9, roughness: 0.42, clearcoat: 0.4, clearcoatRoughness: 0.35, envMapIntensity: 0.7}),
			new THREE.MeshPhysicalMaterial({color: '#0d0a14', metalness: 1, roughness: 0.5, envMapIntensity: 0.5}),
		];
	}
	if (metal === 'ouro') {
		return [
			new THREE.MeshPhysicalMaterial({color: '#e9b44c', metalness: 1, roughness: 0.22, clearcoat: 0.6, clearcoatRoughness: 0.15, envMapIntensity: 1.5}),
			new THREE.MeshPhysicalMaterial({color: '#9a6a1c', metalness: 1, roughness: 0.3, envMapIntensity: 1.2}),
		];
	}
	return [
		new THREE.MeshPhysicalMaterial({color: '#fffdf8', metalness: 0.05, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 0.9}),
		new THREE.MeshPhysicalMaterial({color: '#d9a441', metalness: 1, roughness: 0.25, envMapIntensity: 1.4}),
	];
};

type Letra = {geo: THREE.BufferGeometry; x: number; larg: number};

// Letras já medidas e centradas (cada uma gira em torno do próprio centro). Largura total em unidades de 'size'.
const montar = (texto: string, profundidade: number): {letras: Letra[]; total: number} => {
	const dados = fonte.data as unknown as {glyphs: Record<string, {ha: number}>; resolution: number};
	const letras: Letra[] = [];
	let x = 0;
	for (const ch of texto) {
		const ha = (dados.glyphs[ch]?.ha ?? 500) / dados.resolution;
		if (ch !== ' ') {
			const geo = new TextGeometry(ch, {
				font: fonte,
				size: 1,
				depth: profundidade,
				curveSegments: 14,
				bevelEnabled: true,
				bevelThickness: 0.035,
				bevelSize: 0.03,
				bevelSegments: 6,
			});
			geo.computeBoundingBox();
			const b = geo.boundingBox!;
			const cx = (b.min.x + b.max.x) / 2;
			const cy = (b.min.y + b.max.y) / 2;
			geo.translate(-cx, -cy, -profundidade / 2);
			letras.push({geo, x: x + cx, larg: b.max.x - b.min.x});
		}
		x += ha * 1.02;
	}
	return {letras, total: x};
};

// Uma linha de texto: cada letra cai de perto da câmera, bate, passa um pouco e assenta (mola). Depois balança de leve.
export const Linha3D: React.FC<{
	texto: string;
	metal: Metal;
	// largura total da linha em unidades do mundo
	largura: number;
	y: number;
	quadro: number;
	// quadro (da cena) em que a primeira letra bate
	batida: number;
	// quadro em que as letras caem do jeito de quebrar (opcional)
	queda?: number;
	profundidade?: number;
	distancia?: number;
}> = ({texto, metal, largura, y, quadro, batida, queda, profundidade = 0.28, distancia = 11}) => {
	const {fps} = useVideoConfig();
	const {letras, total} = useMemo(() => montar(texto, profundidade), [texto, profundidade]);
	const mats = useMemo(() => materiais(metal), [metal]);
	const k = largura / total;
	return (
		<group position={[0, y, 0]} scale={k}>
			{letras.map((l, i) => {
				const local = quadro - batida - i * 2;
				if (local < 0) return null;
				const p = spring({frame: local, fps, config: {damping: 9, stiffness: 150, mass: 0.75}});
				const lado = i % 2 ? 1 : -1;
				let px = l.x - total / 2;
				let py = 0;
				let pz = (1 - p) * distancia;
				let rx = (1 - p) * 0.9 * lado;
				let ry = (1 - p) * 0.5 * lado;
				let rz = (1 - p) * 0.35 * lado;
				let esc = 1;
				// balanço lento depois de assentar
				const t = local / fps;
				ry += Math.sin(t * 2.1 + i * 0.7) * 0.045 * Math.min(1, local / 20);
				rx += Math.sin(t * 1.7 + i) * 0.025 * Math.min(1, local / 20);
				if (queda !== undefined) {
					const q = (quadro - queda - i * 3) / fps;
					if (q > 0) {
						py -= 0.5 * 18 * q * q;
						px += Math.sin(i * 2.3) * q * 1.2;
						rz += q * (i % 2 ? 4 : -4);
						rx += q * 2.5;
						pz += q * 3;
					}
				}
				if (local < 4) esc = 1 + (4 - local) * 0.05;
				return (
					<mesh key={i} geometry={l.geo} material={mats} position={[px, py, pz]} rotation={[rx, ry, rz]} scale={esc} />
				);
			})}
		</group>
	);
};

// Onda de choque: anel que abre e some, em aditivo. DESLIGADA (com as Faíscas): o usuário não quer o círculo com
// partículas em nenhum vídeo (30/10/2026, entrevista-3). Os componentes ficam para não quebrar as peças que os usam.
const SEM_ANEL = true;
export const Onda: React.FC<{quadro: number; inicio: number; y: number; cor: string; tamanho?: number}> = ({quadro, inicio, y, cor, tamanho = 9}) => {
	const l = quadro - inicio;
	if (SEM_ANEL || l < 0 || l > 24) return null;
	const p = interpolate(l, [0, 24], [0, 1], lim);
	const r = 0.3 + (1 - (1 - p) ** 3) * tamanho;
	return (
		<mesh position={[0, y, 0.2]}>
			<ringGeometry args={[r * 0.97, r, 96]} />
			<meshBasicMaterial color={cor} transparent opacity={0.85 * (1 - p) ** 2} blending={THREE.AdditiveBlending} depthWrite={false} />
		</mesh>
	);
};

// Faíscas: partículas com gravidade e brilho que some (sementes fixas, sem aleatório por quadro).
export const Faiscas: React.FC<{quadro: number; inicio: number; y: number; cor: string; n?: number; largura?: number}> = ({
	quadro,
	inicio,
	y,
	cor,
	n = 46,
	largura = 7,
}) => {
	const {fps} = useVideoConfig();
	const l = (quadro - inicio) / fps;
	const dados = useMemo(
		() =>
			Array.from({length: n}, (_, i) => ({
				x0: (random(`fx${i}${inicio}`) - 0.5) * largura,
				vx: (random(`fvx${i}`) - 0.5) * 5,
				vy: random(`fvy${i}`) * 4 + 0.6,
				vz: random(`fvz${i}`) * 5,
				vida: 0.5 + random(`fv${i}`) * 0.7,
				tam: 0.02 + random(`ft${i}`) * 0.035,
			})),
		[n, inicio, largura],
	);
	if (SEM_ANEL || l < 0 || l > 1.3) return null;
	return (
		<group>
			{dados.map((d, i) => {
				if (l > d.vida) return null;
				const f = 1 - l / d.vida;
				return (
					<mesh key={i} position={[d.x0 + d.vx * l, y + d.vy * l - 0.5 * 8 * l * l, 0.4 + d.vz * l]} scale={d.tam * (0.4 + f)}>
						<octahedronGeometry args={[1, 0]} />
						<meshBasicMaterial color={cor} transparent opacity={f} blending={THREE.AdditiveBlending} depthWrite={false} />
					</mesh>
				);
			})}
		</group>
	);
};

const Ambiente: React.FC = () => {
	const {gl, scene} = useThree();
	useMemo(() => {
		const pmrem = new THREE.PMREMGenerator(gl);
		scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
	}, [gl, scene]);
	return null;
};

// Câmera com travelling lento e tremor que decai a cada batida.
export const CameraTremor: React.FC<{quadro: number; batidas: number[]; z0?: number; z1?: number; duracao: number}> = ({
	quadro,
	batidas,
	z0 = 14.5,
	z1 = 13,
	duracao,
}) => {
	const {camera} = useThree();
	let sx = 0;
	let sy = 0;
	let sr = 0;
	for (const b of batidas) {
		const l = quadro - b;
		if (l < 0 || l > 22) continue;
		const f = Math.exp(-l / 4.5);
		sx += Math.sin(l * 2.9) * 0.2 * f;
		sy += Math.cos(l * 3.7) * 0.15 * f;
		sr += Math.sin(l * 2.2) * 0.012 * f;
	}
	const z = interpolate(quadro, [0, duracao], [z0, z1], lim);
	camera.position.set(sx, sy, z);
	camera.rotation.set(0, 0, sr);
	return null;
};

// Luzes: chave quente, contraluz azulada fria e um brilho que varre o metal depois de cada batida.
export const Luzes: React.FC<{quadro: number; batidas: number[]}> = ({quadro, batidas}) => {
	let clarao = 0;
	let varre = -9;
	for (const b of batidas) {
		const l = quadro - b;
		if (l >= 0 && l < 10) clarao = Math.max(clarao, 14 * Math.exp(-l / 2.5));
		if (l >= 4 && l < 30) varre = interpolate(l, [4, 30], [-7, 7], lim);
	}
	return (
		<>
			<Ambiente />
			<ambientLight intensity={0.35} />
			<directionalLight position={[-4, 6, 10]} intensity={2.6} color="#fff1d6" />
			<directionalLight position={[6, 2, -4]} intensity={1.6} color="#8fb0ff" />
			<pointLight position={[varre, 1.2, 4]} intensity={varre > -9 ? 55 : 0} distance={12} color="#ffffff" />
			<pointLight position={[0, 0, 7]} intensity={clarao * 6} distance={18} color="#ffe2a0" />
		</>
	);
};

export {Ambiente};
