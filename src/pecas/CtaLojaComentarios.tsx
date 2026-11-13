// CTA de fim para os vídeos de UGC da loja: "O LINK DA LOJA OFICIAL ESTÁ NOS COMENTÁRIOS".
// 3,3 s, 1080x1920, fundo próprio (violeta com raios e brilhos), texto 3D de verdade (Linha3D de tres/Texto3D),
// sacola 3D girando no alto, balão de comentário 3D e seta 3D quicando para baixo. Whoosh na entrada e pop no balão.
// Composição isolada: registrada só em src/indexCta.ts (não entra no Root dos projetos).
import React, {useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {Audio} from '@remotion/media';
import {AbsoluteFill, interpolate, random, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {CameraTremor, Linha3D, Luzes} from './tres/Texto3D';
import {comRugosidade} from './tres/Realismo';

export const CTA_DURACAO = 99; // 3,3 s a 30 fps
const lim = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// ── Formas extrudadas ─────────────────────────────────────────────────────────────────────────────────────────────
const extrudar = (forma: THREE.Shape, prof: number, chanfro = 0.06) => {
	const g = new THREE.ExtrudeGeometry(forma, {
		depth: prof,
		bevelEnabled: true,
		bevelThickness: chanfro,
		bevelSize: chanfro,
		bevelSegments: 6,
		curveSegments: 24,
	});
	g.center();
	return g;
};

// Balão de comentário: retângulo arredondado com rabinho embaixo à esquerda.
const formaBalao = () => {
	const w = 2.5;
	const h = 1.45;
	const r = 0.5;
	const s = new THREE.Shape();
	const x0 = -w / 2;
	const y0 = -h / 2;
	s.moveTo(x0 + r, y0);
	s.lineTo(x0 + 0.95, y0);
	s.lineTo(x0 + 0.45, y0 - 0.55); // rabinho
	s.lineTo(x0 + 1.45, y0);
	s.lineTo(x0 + w - r, y0);
	s.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r);
	s.lineTo(x0 + w, y0 + h - r);
	s.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h);
	s.lineTo(x0 + r, y0 + h);
	s.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r);
	s.lineTo(x0, y0 + r);
	s.quadraticCurveTo(x0, y0, x0 + r, y0);
	return s;
};

// Seta apontando para baixo.
const formaSeta = () => {
	const s = new THREE.Shape();
	s.moveTo(-0.2, 0.6);
	s.lineTo(0.2, 0.6);
	s.lineTo(0.2, 0);
	s.lineTo(0.55, 0);
	s.lineTo(0, -0.6);
	s.lineTo(-0.55, 0);
	s.lineTo(-0.2, 0);
	s.closePath();
	return s;
};

// Corpo da sacola: trapézio levemente mais largo embaixo.
const formaSacola = () => {
	const s = new THREE.Shape();
	s.moveTo(-0.62, -0.7);
	s.lineTo(0.62, -0.7);
	s.lineTo(0.52, 0.62);
	s.lineTo(-0.52, 0.62);
	s.closePath();
	return s;
};

const brilhante = (cor: string, metal = 0.15, rug = 0.22) =>
	comRugosidade(new THREE.MeshPhysicalMaterial({color: cor, metalness: metal, roughness: rug, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.2}), 0.15);

// ── Objetos 3D ────────────────────────────────────────────────────────────────────────────────────────────────────
const Sacola: React.FC<{quadro: number}> = ({quadro}) => {
	const {fps} = useVideoConfig();
	const corpo = useMemo(() => extrudar(formaSacola(), 0.55, 0.07), []);
	const mCorpo = useMemo(() => brilhante('#ffc81a', 0.35, 0.2), []);
	const mAlca = useMemo(() => brilhante('#ff2d78', 0.2, 0.25), []);
	const mFaixa = useMemo(() => brilhante('#ffffff', 0.05, 0.2), []);
	const p = spring({frame: quadro, fps, config: {damping: 11, stiffness: 120, mass: 0.8}});
	const t = quadro / fps;
	const giro = (1 - p) * -4 + t * 1.6;
	return (
		<group position={[0, 2.95 + Math.sin(t * 2.4) * 0.06, (1 - p) * 9]} rotation={[0.12, giro, (1 - p) * 0.8 + Math.sin(t * 1.8) * 0.06]} scale={0.92 * (0.3 + 0.7 * p)}>
			<mesh geometry={corpo} material={mCorpo} />
			{/* faixa branca no corpo */}
			<mesh position={[0, -0.05, 0]} material={mFaixa}>
				<boxGeometry args={[1.18, 0.16, 0.72]} />
			</mesh>
			{/* alça */}
			<mesh position={[0, 0.66, 0]} material={mAlca}>
				<torusGeometry args={[0.3, 0.065, 20, 48, Math.PI]} />
			</mesh>
		</group>
	);
};

const Balao: React.FC<{quadro: number; inicio: number}> = ({quadro, inicio}) => {
	const {fps} = useVideoConfig();
	const geo = useMemo(() => extrudar(formaBalao(), 0.42, 0.09), []);
	const mBalao = useMemo(() => brilhante('#ff2d78', 0.1, 0.18), []);
	const mPonto = useMemo(() => brilhante('#ffffff', 0, 0.2), []);
	const l = quadro - inicio;
	if (l < 0) return null;
	const p = spring({frame: l, fps, config: {damping: 8, stiffness: 160, mass: 0.7}});
	const t = l / fps;
	return (
		<group position={[0.15, -2.72, 0]} rotation={[0.1 + Math.sin(t * 1.9) * 0.05, -0.25 + Math.sin(t * 1.4) * 0.12 + (1 - p) * 2.2, (1 - p) * -0.6]} scale={0.95 * p}>
			<mesh geometry={geo} material={mBalao} />
			{[-0.62, 0, 0.62].map((x, i) => {
				const pulo = Math.max(0, Math.sin(t * 7 - i * 0.9)) * 0.1;
				return (
					<mesh key={x} position={[x, 0.02 + pulo, 0.32]} material={mPonto}>
						<sphereGeometry args={[0.2, 32, 24]} />
					</mesh>
				);
			})}
		</group>
	);
};

const Seta: React.FC<{quadro: number; inicio: number}> = ({quadro, inicio}) => {
	const {fps} = useVideoConfig();
	const geo = useMemo(() => extrudar(formaSeta(), 0.3, 0.06), []);
	const mat = useMemo(() => brilhante('#ffd21a', 0.4, 0.2), []);
	const l = quadro - inicio;
	if (l < 0) return null;
	const p = spring({frame: l, fps, config: {damping: 10, stiffness: 170, mass: 0.6}});
	const t = l / fps;
	const quica = Math.abs(Math.sin(t * 6.5)) * 0.22 * Math.min(1, l / 10);
	return (
		<group position={[0, -4.0 - quica + (1 - p) * 1.4, 0.2]} rotation={[0, Math.sin(t * 2.2) * 0.5, 0]} scale={0.62 * p}>
			<mesh geometry={geo} material={mat} />
		</group>
	);
};

// Brilhos 3D que estouram quando o balão aparece.
const Estouro: React.FC<{quadro: number; inicio: number}> = ({quadro, inicio}) => {
	const {fps} = useVideoConfig();
	const dados = useMemo(
		() =>
			Array.from({length: 26}, (_, i) => {
				const a = (i / 26) * Math.PI * 2 + random(`ea${i}`) * 0.3;
				const v = 2.2 + random(`ev${i}`) * 2.2;
				return {vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.8, vida: 0.45 + random(`ed${i}`) * 0.4, tam: 0.04 + random(`et${i}`) * 0.05, cor: i % 3 === 0 ? '#ffffff' : i % 3 === 1 ? '#ffd21a' : '#ff6fb0'};
			}),
		[],
	);
	const l = (quadro - inicio) / fps;
	if (l < 0 || l > 0.9) return null;
	return (
		<group position={[0.15, -2.72, 0.6]}>
			{dados.map((d, i) => {
				if (l > d.vida) return null;
				const f = 1 - l / d.vida;
				return (
					<mesh key={i} position={[d.vx * l, d.vy * l, 0]} scale={d.tam * (0.5 + f)} rotation={[l * 6, l * 4, 0]}>
						<octahedronGeometry args={[1, 0]} />
						<meshBasicMaterial color={d.cor} transparent opacity={f} blending={THREE.AdditiveBlending} depthWrite={false} />
					</mesh>
				);
			})}
		</group>
	);
};

// ── Fundo (HTML): violeta profundo, raios girando, brilhos subindo ─────────────────────────────────────────────────
const Fundo: React.FC<{quadro: number}> = ({quadro}) => {
	const {fps} = useVideoConfig();
	const t = quadro / fps;
	const entra = interpolate(quadro, [0, 8], [1.25, 1], lim);
	const bolhas = useMemo(
		() =>
			Array.from({length: 34}, (_, i) => ({
				x: random(`bx${i}`) * 100,
				y: random(`by${i}`) * 100,
				v: 6 + random(`bv${i}`) * 14,
				r: 4 + random(`br${i}`) * 14,
				a: 0.25 + random(`ba${i}`) * 0.5,
				cor: i % 3 === 0 ? '#ffd21a' : i % 3 === 1 ? '#ff6fb0' : '#ffffff',
			})),
		[],
	);
	return (
		<AbsoluteFill style={{background: '#12002e', overflow: 'hidden'}}>
			<AbsoluteFill style={{background: 'radial-gradient(circle at 50% 46%, #8a2cff 0%, #4b0fb8 32%, #1f0563 62%, #0b0124 100%)', transform: `scale(${entra})`}} />
			{/* raios */}
			<AbsoluteFill
				style={{
					background: 'repeating-conic-gradient(from 0deg at 50% 46%, rgba(255,255,255,0.07) 0deg 7deg, rgba(255,255,255,0) 7deg 20deg)',
					transform: `rotate(${t * 14 + (1 - Math.min(1, quadro / 10)) * -40}deg) scale(1.9)`,
					maskImage: 'radial-gradient(circle at 50% 46%, black 0%, black 35%, transparent 75%)',
					WebkitMaskImage: 'radial-gradient(circle at 50% 46%, black 0%, black 35%, transparent 75%)',
				}}
			/>
			{/* halos coloridos */}
			<div style={{position: 'absolute', left: -200, top: 1250, width: 900, height: 900, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,45,120,0.55), rgba(255,45,120,0) 70%)', transform: `translateY(${Math.sin(t * 1.3) * 30}px)`}} />
			<div style={{position: 'absolute', right: -260, top: -200, width: 1000, height: 1000, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,210,26,0.33), rgba(255,210,26,0) 70%)', transform: `translateY(${Math.cos(t * 1.1) * 30}px)`}} />
			{bolhas.map((b, i) => {
				const y = (((b.y - t * b.v) % 110) + 110) % 110 - 5;
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: `${b.x}%`,
							top: `${y}%`,
							width: b.r,
							height: b.r,
							borderRadius: '50%',
							background: b.cor,
							opacity: b.a * (0.6 + 0.4 * Math.sin(t * 5 + i)),
							boxShadow: `0 0 ${b.r * 2}px ${b.cor}`,
						}}
					/>
				);
			})}
			{/* placa escura atrás do texto, para contraste */}
			<AbsoluteFill style={{background: 'radial-gradient(ellipse 62% 22% at 50% 47%, rgba(10,0,30,0.55), rgba(10,0,30,0) 100%)'}} />
			{/* vinheta */}
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)'}} />
		</AbsoluteFill>
	);
};

// ── Composição ────────────────────────────────────────────────────────────────────────────────────────────────────
const LINHAS = [
	{texto: 'O LINK DA', metal: 'branco', y: 1.5, batida: 0, ate: 24, largura: 3.7},
	{texto: 'LOJA OFICIAL', metal: 'branco', y: 0.62, batida: 4, ate: 32, largura: 4.6},
	{texto: 'ESTÁ NOS', metal: 'ouro', y: -0.42, batida: 11, ate: 40, largura: 3.5},
	{texto: 'COMENTÁRIOS', metal: 'ouro', y: -1.3, batida: 16, ate: 48, largura: 4.7},
] as const;

const BALAO = 20;
const SETA = 27;

export const CtaLojaComentarios: React.FC = () => {
	const frame = useCurrentFrame();
	const {width, height} = useVideoConfig();
	return (
		<AbsoluteFill style={{background: '#12002e'}}>
			<Fundo quadro={frame} />
			<ThreeCanvas
				width={width}
				height={height}
				gl={{alpha: true, antialias: true, preserveDrawingBuffer: true}}
				camera={{fov: 35, position: [0, 0, 14.5], near: 0.1, far: 60}}
				style={{position: 'absolute', inset: 0}}
			>
				<CameraTremor quadro={frame} batidas={[BALAO]} z0={15.2} z1={14.4} duracao={CTA_DURACAO} />
				<Luzes quadro={frame} batidas={[0, 11]} />
				<pointLight position={[0, -2.5, 4]} intensity={18} distance={10} color="#ff8fc0" />
				<Sacola quadro={frame} />
				{LINHAS.map((l) => (
					<Linha3D
						key={l.texto}
						texto={l.texto}
						metal={l.metal}
						largura={l.largura}
						y={l.y}
						quadro={frame}
						batida={l.batida}
						ate={l.ate}
						intervalo={1.5}
						profundidade={0.32}
						distancia={9}
					/>
				))}
				<Balao quadro={frame} inicio={BALAO} />
				<Estouro quadro={frame} inicio={BALAO + 2} />
				<Seta quadro={frame} inicio={SETA} />
			</ThreeCanvas>
			<Audio src={staticFile('sfx/pro_whoosh.wav')} volume={0.9} />
			<Sequence from={BALAO}>
				<Audio src={staticFile('sfx/pro_pop.wav')} volume={0.9} />
			</Sequence>
		</AbsoluteFill>
	);
};
