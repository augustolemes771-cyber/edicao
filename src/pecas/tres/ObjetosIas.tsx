// Elementos da cena das IAs em tela cheia (entrevista-pista, 30/10/2026): cartões de vídeo que saem dos celulares dos robôs
// e sobem para o feed, crachá de "funcionária", holerite com carimbo "R$ 0", sol e lua girando (24 horas) e placa
// "RECLAMAÇÕES 0". Paleta do tema; texturas desenhadas em canvas.
import React, {useMemo} from 'react';
import {interpolate, spring, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const lim = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const OURO = '#E8C27A';
const FONTE = 'Montserrat, Poppins, sans-serif';

const texturaCanvas = (l: number, a: number, desenhar: (c: CanvasRenderingContext2D) => void) => {
	const canvas = document.createElement('canvas');
	canvas.width = l;
	canvas.height = a;
	desenhar(canvas.getContext('2d')!);
	const t = new THREE.CanvasTexture(canvas);
	t.colorSpace = THREE.SRGBColorSpace;
	t.anisotropy = 8;
	return t;
};

const useOuro = () => useMemo(() => new THREE.MeshStandardMaterial({color: OURO, metalness: 1, roughness: 0.22}), []);

// Cartão de vídeo pronto (miniatura roxa com play de ouro) que sai do celular de um robô e voa em arco até o seu lugar no feed.
export const CartaoVideo: React.FC<{q: number; nasce: number; de: [number, number]; para: [number, number]; giro: number; indice: number}> = ({q, nasce, de, para, giro, indice}) => {
	const {fps} = useVideoConfig();
	const ouro = useOuro();
	const corpo = useMemo(() => new RoundedBoxGeometry(0.62, 1.0, 0.05, 3, 0.07), []);
	const capa = useMemo(
		() =>
			new THREE.MeshBasicMaterial({
				toneMapped: false,
				map: texturaCanvas(248, 400, (c) => {
					const g = c.createLinearGradient(0, 0, 0, 400);
					g.addColorStop(0, ['#5b2fa0', '#3d1f74', '#6a3aa8'][indice % 3]);
					g.addColorStop(1, '#170a33');
					c.fillStyle = g;
					c.fillRect(0, 0, 248, 400);
					c.fillStyle = 'rgba(255,214,190,0.55)';
					c.beginPath();
					c.ellipse(124, 150, 46, 56, 0, 0, Math.PI * 2);
					c.fill();
					c.fillStyle = OURO;
					c.beginPath();
					c.moveTo(104, 250);
					c.lineTo(104, 310);
					c.lineTo(154, 280);
					c.closePath();
					c.fill();
					c.fillStyle = 'rgba(255,255,255,0.85)';
					c.fillRect(24, 350, 120, 10);
					c.fillStyle = 'rgba(255,255,255,0.45)';
					c.fillRect(24, 370, 80, 8);
				}),
			}),
		[indice],
	);
	const l = q - nasce;
	if (l < 0) return null;
	const p = spring({frame: l, fps, config: {damping: 15, stiffness: 90, mass: 0.9}});
	const x = de[0] + (para[0] - de[0]) * p;
	const y = de[1] + (para[1] - de[1]) * p + Math.sin(p * Math.PI) * 0.8;
	return (
		<group position={[x, y, (1 - p) * 0.8]} rotation={[0, (1 - p) * 2.5, giro * p]} scale={0.3 + 0.7 * p}>
			<mesh geometry={corpo} material={ouro} />
			<mesh position={[0, 0, 0.027]} material={capa}>
				<planeGeometry args={[0.56, 0.94]} />
			</mesh>
		</group>
	);
};

// Crachá pendurado na fita de ouro: "FUNCIONÁRIA", rosto de robô e "TURNO: 24H".
export const Cracha: React.FC<{q: number; entra: number}> = ({q, entra}) => {
	const {fps} = useVideoConfig();
	const ouro = useOuro();
	const corpo = useMemo(() => new RoundedBoxGeometry(0.9, 1.2, 0.04, 3, 0.08), []);
	const frente = useMemo(
		() =>
			new THREE.MeshBasicMaterial({
				toneMapped: false,
				map: texturaCanvas(360, 480, (c) => {
					c.fillStyle = '#f6f2fb';
					c.fillRect(0, 0, 360, 480);
					c.fillStyle = '#2a1552';
					c.fillRect(0, 0, 360, 120);
					c.fillStyle = OURO;
					c.font = `900 54px ${FONTE}`;
					c.textAlign = 'center';
					c.fillText('IA', 180, 82);
					c.fillStyle = '#2a1552';
					c.beginPath();
					c.arc(180, 230, 70, 0, Math.PI * 2);
					c.fill();
					c.fillStyle = '#ffd98a';
					c.fillRect(150, 215, 18, 26);
					c.fillRect(192, 215, 18, 26);
					c.fillStyle = '#2a1552';
					c.font = `900 40px ${FONTE}`;
					c.fillText('FUNCIONÁRIA', 180, 365);
					c.fillStyle = '#B9852F';
					c.font = `700 26px ${FONTE}`;
					c.fillText('TURNO: 24H', 180, 420);
				}),
			}),
		[],
	);
	const l = q - entra;
	if (l < 0) return null;
	const t = l / fps;
	const p = spring({frame: l, fps, config: {damping: 10, stiffness: 120}});
	return (
		<group position={[0, (1 - p) * 3, 0]} rotation={[0, Math.sin(t * 2) * 0.15, Math.sin(t * 5) * 0.2 * Math.exp(-t * 1.5)]}>
			<mesh position={[-0.25, 0.85, -0.02]} rotation={[0, 0, -0.35]} material={ouro}>
				<boxGeometry args={[0.06, 0.7, 0.01]} />
			</mesh>
			<mesh position={[0.25, 0.85, -0.02]} rotation={[0, 0, 0.35]} material={ouro}>
				<boxGeometry args={[0.06, 0.7, 0.01]} />
			</mesh>
			<mesh geometry={corpo} material={ouro} />
			<mesh position={[0, 0, 0.022]} material={frente}>
				<planeGeometry args={[0.84, 1.12]} />
			</mesh>
		</group>
	);
};

// Holerite: folha de pagamento que entra girando e recebe o carimbo de ouro "R$ 0" no `carimba`.
export const Holerite: React.FC<{q: number; entra: number; carimba: number}> = ({q, entra, carimba}) => {
	const {fps} = useVideoConfig();
	const folha = useMemo(
		() =>
			new THREE.MeshStandardMaterial({
				roughness: 0.8,
				map: texturaCanvas(420, 560, (c) => {
					c.fillStyle = '#fbf8f2';
					c.fillRect(0, 0, 420, 560);
					c.fillStyle = '#2a1552';
					c.font = `900 40px ${FONTE}`;
					c.textAlign = 'center';
					c.fillText('HOLERITE', 210, 70);
					c.fillStyle = 'rgba(42,21,82,0.25)';
					for (let i = 0; i < 6; i++) c.fillRect(40, 120 + i * 48, 220 - (i % 3) * 40, 14);
					for (let i = 0; i < 6; i++) c.fillRect(300, 120 + i * 48, 80, 14);
					c.fillStyle = '#2a1552';
					c.font = `800 34px ${FONTE}`;
					c.textAlign = 'left';
					c.fillText('SALÁRIO', 40, 460);
					c.textAlign = 'right';
					c.fillText('R$ 0,00', 380, 460);
				}),
			}),
		[],
	);
	const selo = useMemo(
		() =>
			new THREE.MeshBasicMaterial({
				transparent: true,
				toneMapped: false,
				map: texturaCanvas(300, 300, (c) => {
					c.strokeStyle = '#C9974A';
					c.lineWidth = 14;
					c.beginPath();
					c.arc(150, 150, 128, 0, Math.PI * 2);
					c.stroke();
					c.lineWidth = 5;
					c.beginPath();
					c.arc(150, 150, 104, 0, Math.PI * 2);
					c.stroke();
					c.fillStyle = '#C9974A';
					c.font = `900 92px ${FONTE}`;
					c.textAlign = 'center';
					c.fillText('R$ 0', 150, 182);
				}),
			}),
		[],
	);
	const l = q - entra;
	if (l < 0) return null;
	const p = spring({frame: l, fps, config: {damping: 13, stiffness: 110}});
	const c = q - carimba;
	const bate = c < 0 ? 0 : spring({frame: c, fps, config: {damping: 9, stiffness: 260}});
	return (
		<group position={[(1 - p) * 3, 0, 0]} rotation={[0, (1 - p) * -2, -0.08 + (1 - p) * 0.5]}>
			<mesh material={folha}>
				<boxGeometry args={[1.26, 1.68, 0.02]} />
			</mesh>
			{c >= 0 ? (
				<mesh position={[0.2, -0.2, 0.02 + (1 - bate) * 0.8]} rotation={[0, 0, -0.35]} scale={1.6 - 0.6 * bate} material={selo}>
					<planeGeometry args={[0.95, 0.95]} />
				</mesh>
			) : null}
		</group>
	);
};

// Sol e lua girando numa órbita de ouro atrás da cena: o dia passa rápido (24 horas por dia).
export const SolLua: React.FC<{q: number; entra: number}> = ({q, entra}) => {
	const {fps} = useVideoConfig();
	const prata = useMemo(() => new THREE.MeshStandardMaterial({color: '#cfd2dc', metalness: 1, roughness: 0.25}), []);
	const l = q - entra;
	if (l < 0) return null;
	const t = l / fps;
	const aparece = interpolate(l, [0, 10], [0, 1], lim);
	const ang = 1.2 + t * 3.2;
	return (
		<group position={[0, 0.4, -3]} scale={aparece}>
			<mesh position={[Math.cos(ang) * 3.2, Math.sin(ang) * 3.2, 0]}>
				<sphereGeometry args={[0.5, 32, 20]} />
				<meshBasicMaterial color="#ffd98a" toneMapped={false} />
			</mesh>
			<mesh position={[Math.cos(ang + Math.PI) * 3.2, Math.sin(ang + Math.PI) * 3.2, 0]} material={prata}>
				<sphereGeometry args={[0.38, 32, 20]} />
			</mesh>
			<mesh>
				<torusGeometry args={[3.2, 0.012, 6, 96]} />
				<meshBasicMaterial color={OURO} transparent opacity={0.35} />
			</mesh>
		</group>
	);
};

// Placa "RECLAMAÇÕES 0": cai, bate e fica balançando.
export const PlacaZero: React.FC<{q: number; entra: number}> = ({q, entra}) => {
	const {fps} = useVideoConfig();
	const ouro = useOuro();
	const corpo = useMemo(() => new RoundedBoxGeometry(2.3, 0.9, 0.12, 4, 0.12), []);
	const frente = useMemo(
		() =>
			new THREE.MeshBasicMaterial({
				toneMapped: false,
				map: texturaCanvas(640, 250, (c) => {
					c.fillStyle = '#1E0F3A';
					c.fillRect(0, 0, 640, 250);
					c.fillStyle = '#ffffff';
					c.font = `800 46px ${FONTE}`;
					c.textAlign = 'left';
					c.fillText('RECLAMAÇÕES', 40, 145);
					c.fillStyle = OURO;
					c.font = `900 120px ${FONTE}`;
					c.textAlign = 'right';
					c.fillText('0', 600, 170);
				}),
			}),
		[],
	);
	const l = q - entra;
	if (l < 0) return null;
	const t = l / fps;
	const p = spring({frame: l, fps, config: {damping: 9, stiffness: 150}});
	return (
		<group position={[0, (1 - p) * 4, 0]} rotation={[0, Math.sin(t * 1.5) * 0.12, Math.sin(t * 7) * 0.12 * Math.exp(-t * 2.5)]}>
			<mesh geometry={corpo} material={ouro} />
			<mesh position={[0, 0, 0.065]} material={frente}>
				<planeGeometry args={[2.16, 0.78]} />
			</mesh>
		</group>
	);
};
