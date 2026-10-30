// Peças (efeitos) exclusivas do entrevista-3-v12, usadas no edit.ts com {tipo: 'peca', nome: '<chave>', dados: {...}}.
// Prefixe as chaves com v12 (ex.: v12Gancho): o registro junta as peças de todos os projetos.
// v12Calendario: gancho; calendário 3D (folhas em perspectiva) que despenca de 30 para 1 e solta "1 DIA" em ouro 3D.
// v12VideoLive: meia tela; claquete 3D que bate no "vídeo" e celular 3D com a live no "live".
// v12OndaAzul: tela inteira; onda azul 3D andando, uma prancha surfando a crista e depois várias ("todo mundo").
// v12Salario: tela inteira; "O MESMO SALÁRIO" em 3D, cartões 30 DIAS × POUCAS HORAS e relógio 3D disparado.
import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type {Pecas, CenaPeca} from '../../pecas/peca';
import {FundoMotion, GradeReta} from '../../pecas/FundoMotion';
import {Linha3D, Luzes} from '../../pecas/tres/Texto3D';
import {Celular, Relogio} from '../../pecas/tres/Objetos3D';
import {playfair, poppins} from '../../motor/tema';

const lim = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const GL = {alpha: true, antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05};
const CAMERA = {fov: 35, position: [0, 0, 14.5] as [number, number, number], near: 0.1, far: 60};
const OURO_TEXTO = 'linear-gradient(180deg,#FFF1C9 0%,#F2D08A 40%,#E8C27A 65%,#C9974A 100%)';
const ROXO = '#1E0F3A';
// px (quadro 1080x1920) → mundo da câmera padrão (fov 35 a 14,5: meia altura ~4,57).
const MEIA = 14.5 * Math.tan((35 / 2) * (Math.PI / 180));
const yMundo = (px: number) => ((960 - px) / 960) * MEIA;
const xMundo = (px: number) => ((px - 540) / 960) * MEIA;

const num = (cena: CenaPeca, k: string) => Number((cena.dados ?? {})[k] ?? cena.de);
// Quadro (da cena) de um tempo do vídeo editado.
const q = (cena: CenaPeca, t: number, fps: number) => Math.round((t - cena.de) * fps);

const Rotulo: React.FC<{texto: string; y: number; k: number; tamanho?: number; ouro?: boolean}> = ({texto, y, k, tamanho = 40, ouro}) => (
	<div style={{position: 'absolute', top: y, width: '100%', textAlign: 'center', opacity: k, transform: `translateY(${(1 - k) * 18}px)`}}>
		<span
			style={{
				fontFamily: poppins,
				fontWeight: 800,
				fontSize: tamanho,
				letterSpacing: '0.18em',
				marginRight: '-0.18em',
				...(ouro ? {background: OURO_TEXTO, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'} : {color: '#fff', textShadow: '0 4px 16px rgba(8,2,20,0.7)'}),
			}}
		>
			{texto}
		</span>
	</div>
);

// ─── Gancho: calendário que despenca de 30 para 1 ────────────────────────────────────────────────────────────────
// Folhas em CSS 3D (perspectiva real, viram pela borda de cima e voam); a contagem desacelera (ease-out) até travar no 1,
// e então "1 DIA" salta em ouro 3D (three.js) na frente da folha.
const Folha: React.FC<{n: number; giro: number; ouro?: boolean; z?: number}> = ({n, giro, ouro, z = 0}) => (
	<div
		style={{
			position: 'absolute',
			inset: 0,
			transformOrigin: '50% 0%',
			transform: `translateZ(${z}px) rotateX(${giro}deg)`,
			opacity: giro < -100 ? 0 : 1,
			background: ouro ? 'linear-gradient(180deg,#fff6dc 0%,#f2d59a 100%)' : 'linear-gradient(180deg,#ffffff 0%,#ece6f6 100%)',
			borderRadius: 26,
			boxShadow: `0 ${10 + giro * -0.2}px 30px rgba(8,2,20,${0.35 + giro * -0.002})`,
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			backfaceVisibility: 'hidden',
		}}
	>
		<span style={{fontFamily: playfair, fontStyle: 'italic', fontWeight: 800, fontSize: 210, lineHeight: 1, marginTop: 70, color: ouro ? '#9b6a22' : ROXO}}>{n}</span>
	</div>
);

const Calendario: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const fim = Math.round((cena.ate - cena.de) * fps);
	const fSal = q(cena, num(cena, 'salario'), fps);
	const f30 = q(cena, num(cena, 'trinta'), fps);
	const fUm = q(cena, num(cena, 'um'), fps);
	const entra = spring({frame, fps, config: {damping: 13, stiffness: 120}});
	const saida = interpolate(frame, [fim - 7, fim], [1, 0], lim);
	// Contagem 30 → 1 com ease-out entre o "30" e o "um dia".
	const p = interpolate(frame, [f30, fUm], [0, 1], lim);
	const valor = 30 - 29 * (1 - (1 - p) ** 2.4);
	const n = Math.max(1, Math.ceil(valor - 1e-6));
	const resto = valor - Math.floor(valor);
	const travou = frame >= fUm;
	const voando = [1, 2, 3].map((k) => ({n: n + k, giro: -40 - (k - (p < 1 ? resto : 0)) * 45})).filter((f) => f.n <= 30 && !travou);
	const flash = interpolate(frame, [fUm, fUm + 2, fUm + 9], [0, 0.9, 0], lim);
	const ouro = interpolate(frame, [fUm, fUm + 4], [0, 1], lim);
	const balanca = Math.sin(frame / 9) * 4;
	const rot = interpolate(frame, [fSal, fSal + 8], [0, 1], lim);
	const tremor = travou ? Math.sin((frame - fUm) * 2.2) * 7 * Math.exp(-(frame - fUm) / 5) : 0;
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: saida}}>
			<AbsoluteFill style={{background: `linear-gradient(180deg, rgba(30,15,58,0.86) 0%, rgba(30,15,58,0.6) 34%, rgba(30,15,58,0) 52%)`, opacity: entra}} />
			<Rotulo texto="O SALÁRIO DE" y={150} k={rot} tamanho={38} ouro />
			<div
				style={{
					position: 'absolute',
					left: 540 - 175,
					top: 225,
					width: 350,
					height: 380,
					perspective: 1100,
					transform: `translateY(${(1 - entra) * -420}px) rotate(${(1 - entra) * -14 + tremor * 0.3}deg) translateX(${tremor}px)`,
				}}
			>
				<div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `rotateX(14deg) rotateY(${-16 + balanca}deg)`}}>
					{/* Bloco de folhas (espessura) e a base. */}
					{[5, 4, 3, 2, 1].map((k) => (
						<div key={k} style={{position: 'absolute', inset: 0, transform: `translateZ(${-k * 7}px)`, background: k % 2 ? '#d9d1e8' : '#efe9f7', borderRadius: 26}} />
					))}
					<Folha n={travou ? 1 : n} giro={0} ouro={ouro > 0.5} />
					{voando.map((f) => (
						<Folha key={f.n} n={f.n} giro={f.giro} z={4} />
					))}
					{/* Cabeçalho roxo com argolas. */}
					<div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 92, borderRadius: '26px 26px 0 0', background: 'linear-gradient(180deg,#4a2a86,#2a1556)', transform: 'translateZ(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
						<span style={{fontFamily: poppins, fontWeight: 800, fontSize: 34, letterSpacing: '0.3em', marginRight: '-0.3em', background: OURO_TEXTO, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}}>
							{travou ? 'DIA' : 'DIAS'}
						</span>
					</div>
					{[0.22, 0.5, 0.78].map((x) => (
						<div key={x} style={{position: 'absolute', left: 350 * x - 13, top: -24, width: 26, height: 52, borderRadius: 13, border: '6px solid #E8C27A', transform: 'translateZ(10px)'}} />
					))}
				</div>
			</div>
			<AbsoluteFill style={{background: '#fff', opacity: flash * 0.5}} />
			{travou ? (
				<AbsoluteFill style={{filter: 'drop-shadow(0 22px 30px rgba(12,4,28,0.65))'}}>
					<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
						<Luzes quadro={frame} batidas={[fUm]} />
						<pointLight position={[0, yMundo(660), 4]} intensity={40} distance={10} color="#fff1cf" />
						<group position={[0, yMundo(675), 0]} rotation={[0, Math.sin((frame - fUm) / 10) * 0.18, 0]}>
							<Linha3D texto="EM 1 DIA" metal="ouro" largura={4.2} y={0} quadro={frame} batida={fUm} profundidade={0.55} />
						</group>
					</ThreeCanvas>
				</AbsoluteFill>
			) : null}
		</AbsoluteFill>
	);
};

// ─── "faz vídeo, faz live": claquete e celular 3D na metade de baixo ─────────────────────────────────────────────
const Claquete: React.FC<{abre: number}> = ({abre}) => {
	const listras = useMemo(() => {
		const c = document.createElement('canvas');
		c.width = 512;
		c.height = 64;
		const g = c.getContext('2d')!;
		g.fillStyle = '#111';
		g.fillRect(0, 0, 512, 64);
		g.fillStyle = '#f4f1ea';
		for (let x = -64; x < 576; x += 96) {
			g.beginPath();
			g.moveTo(x, 64);
			g.lineTo(x + 48, 0);
			g.lineTo(x + 96, 0);
			g.lineTo(x + 48, 64);
			g.fill();
		}
		const t = new THREE.CanvasTexture(c);
		t.colorSpace = THREE.SRGBColorSpace;
		return t;
	}, []);
	const lousa = useMemo(() => {
		const c = document.createElement('canvas');
		c.width = 512;
		c.height = 320;
		const g = c.getContext('2d')!;
		g.fillStyle = '#1b1b22';
		g.fillRect(0, 0, 512, 320);
		g.strokeStyle = 'rgba(255,255,255,0.75)';
		g.lineWidth = 4;
		g.strokeRect(24, 24, 464, 272);
		g.beginPath();
		g.moveTo(24, 160);
		g.lineTo(488, 160);
		g.moveTo(256, 160);
		g.lineTo(256, 296);
		g.stroke();
		g.fillStyle = '#E8C27A';
		g.font = 'bold 64px Poppins, sans-serif';
		g.textAlign = 'center';
		g.fillText('TAKE 1', 256, 116);
		g.fillStyle = '#fff';
		g.font = 'bold 44px Poppins, sans-serif';
		g.fillText('CENA', 140, 244);
		g.fillText('VÍDEO', 372, 244);
		const t = new THREE.CanvasTexture(c);
		t.colorSpace = THREE.SRGBColorSpace;
		return t;
	}, []);
	const corpo = useMemo(() => new RoundedBoxGeometry(2.4, 1.5, 0.14, 4, 0.05), []);
	const barra = useMemo(() => new RoundedBoxGeometry(2.4, 0.34, 0.12, 4, 0.04), []);
	const preto = useMemo(() => new THREE.MeshStandardMaterial({color: '#18181d', roughness: 0.45, metalness: 0.3}), []);
	const matL = useMemo(() => new THREE.MeshStandardMaterial({map: lousa, roughness: 0.6}), [lousa]);
	const matR = useMemo(() => new THREE.MeshStandardMaterial({map: listras, roughness: 0.45}), [listras]);
	return (
		<group>
			<mesh geometry={corpo} material={preto} position={[0, -0.75, 0]} />
			<mesh position={[0, -0.75, 0.072]} material={matL}>
				<planeGeometry args={[2.3, 1.42]} />
			</mesh>
			<mesh geometry={barra} material={preto} position={[0, 0.17, 0]} />
			<mesh position={[0, 0.17, 0.062]} material={matR}>
				<planeGeometry args={[2.34, 0.3]} />
			</mesh>
			{/* Barra de cima: articulada na ponta esquerda, abre e fecha. */}
			<group position={[-1.2, 0.36, 0]} rotation={[0, 0, abre * 0.55]}>
				<mesh geometry={barra} material={preto} position={[1.2, 0.17, 0]} />
				<mesh position={[1.2, 0.17, 0.062]} material={matR}>
					<planeGeometry args={[2.34, 0.3]} />
				</mesh>
			</group>
		</group>
	);
};

const VideoLive: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const t = frame / fps;
	const fim = Math.round((cena.ate - cena.de) * fps);
	const fV = q(cena, num(cena, 'video'), fps);
	const fL = q(cena, num(cena, 'live'), fps);
	const entrada = interpolate(frame, [0, 6], [0, 1], lim);
	const saida = interpolate(frame, [fim - 6, fim], [1, 0], lim);
	const cl = spring({frame, fps, config: {damping: 12, stiffness: 130}});
	// Claquete: abre logo que entra e bate no "vídeo".
	const abre = frame < fV ? interpolate(frame, [0, 6], [0, 1], lim) : interpolate(frame, [fV, fV + 3], [1, 0], lim);
	const bate = frame >= fV ? Math.exp(-(frame - fV) / 4) : 0;
	const ce = spring({frame: frame - fL + 6, fps, config: {damping: 12, stiffness: 120}});
	const kV = interpolate(frame, [fV, fV + 6], [0, 1], lim);
	const kL = interpolate(frame, [fL, fL + 6], [0, 1], lim);
	const yObj = yMundo(1330);
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: saida}}>
			<AbsoluteFill style={{opacity: entrada, background: 'linear-gradient(180deg, rgba(30,15,58,0) 44%, rgba(30,15,58,0.5) 54%, rgba(24,11,48,0.72) 100%)'}} />
			<AbsoluteFill style={{opacity: entrada}}>
				<GradeReta topo={0.5} />
			</AbsoluteFill>
			<AbsoluteFill style={{filter: 'drop-shadow(0 24px 30px rgba(8,2,20,0.6))'}}>
				<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
					<Luzes quadro={frame} batidas={[fV, fL]} />
					<group position={[xMundo(300) + (1 - cl) * -4, yObj + 0.35 - bate * 0.12, 0]} rotation={[0.12, 0.38 + Math.sin(t * 1.6) * 0.06, -0.06 + bate * 0.08]} scale={0.78}>
						<Claquete abre={abre} />
					</group>
					{frame >= fL - 6 ? (
						<group position={[xMundo(790) + (1 - ce) * 4, yObj + 0.1, 0]} rotation={[0.08, -0.42 + Math.sin(t * 1.4) * 0.07, 0.05]} scale={0.78}>
							<Celular segundos={t} />
						</group>
					) : null}
				</ThreeCanvas>
			</AbsoluteFill>
			<div style={{position: 'absolute', top: 1640, left: 300 - 220, width: 440, textAlign: 'center', opacity: kV, transform: `translateY(${(1 - kV) * 16}px)`}}>
				<span style={{fontFamily: poppins, fontWeight: 900, fontSize: 54, color: '#fff', letterSpacing: '0.04em', textShadow: '0 6px 18px rgba(8,2,20,0.7)'}}>FAZ VÍDEO</span>
			</div>
			<div style={{position: 'absolute', top: 1640, left: 790 - 220, width: 440, textAlign: 'center', opacity: kL, transform: `translateY(${(1 - kL) * 16}px)`}}>
				<span style={{fontFamily: playfair, fontStyle: 'italic', fontWeight: 800, fontSize: 66, padding: '0 0.06em', background: OURO_TEXTO, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}}>faz live</span>
			</div>
		</AbsoluteFill>
	);
};

// ─── Onda azul 3D com surfistas ────────────────────────────────────────────────────────────────────────────────
const altura = (x: number, z: number, t: number) => Math.sin(x * 0.75 - t * 2.4) * 0.55 + Math.sin(x * 0.31 + z * 0.6 - t * 1.3) * 0.3 + Math.cos(z * 0.9 + t) * 0.12;

const Mar: React.FC<{t: number}> = ({t}) => {
	const geo = useMemo(() => new THREE.PlaneGeometry(16, 7, 140, 50), []);
	const mat = useMemo(() => new THREE.MeshStandardMaterial({color: '#1d6bff', emissive: '#0b2b8a', emissiveIntensity: 0.55, roughness: 0.22, metalness: 0.15, flatShading: true}), []);
	const espuma = useMemo(() => new THREE.MeshBasicMaterial({color: '#bfe3ff', wireframe: true, transparent: true, opacity: 0.16}), []);
	const pos = geo.attributes.position as THREE.BufferAttribute;
	for (let i = 0; i < pos.count; i++) pos.setZ(i, altura(pos.getX(i), pos.getY(i), t));
	pos.needsUpdate = true;
	geo.computeVertexNormals();
	return (
		<group rotation={[-1.08, 0, 0]}>
			<mesh geometry={geo} material={mat} />
			<mesh geometry={geo} material={espuma} position={[0, 0, 0.01]} />
		</group>
	);
};

// Prancha sobre a onda: segue a altura e a inclinação da água no ponto (x, z) do plano do mar.
const Prancha: React.FC<{x: number; z: number; t: number; cor: string; escala?: number}> = ({x, z, t, cor, escala = 1}) => {
	const h = altura(x, z, t);
	const dh = (altura(x + 0.05, z, t) - h) / 0.05;
	// Ponto do plano do mar girado em -1,08 no eixo X.
	const a = -1.08;
	const py = z * Math.cos(a) - h * Math.sin(a);
	const pz = z * Math.sin(a) + h * Math.cos(a);
	return (
		<group position={[x, py + 0.12, pz]} rotation={[0, 0, Math.atan(dh) * 0.6]} scale={escala}>
			<mesh rotation={[0, 0, Math.PI / 2]} scale={[0.26, 1, 0.08]}>
				<capsuleGeometry args={[0.5, 1.4, 6, 16]} />
				<meshStandardMaterial color={cor} roughness={0.3} metalness={0.4} />
			</mesh>
			{/* Surfista estilizado: corpo e cabeça. */}
			<mesh position={[0.05, 0.46, 0]}>
				<capsuleGeometry args={[0.12, 0.5, 4, 10]} />
				<meshStandardMaterial color="#f4f1ea" roughness={0.5} />
			</mesh>
			<mesh position={[0.05, 0.92, 0]}>
				<sphereGeometry args={[0.14, 16, 12]} />
				<meshStandardMaterial color="#f4f1ea" roughness={0.5} />
			</mesh>
		</group>
	);
};

const OndaAzul: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const t = frame / fps;
	const fim = Math.round((cena.ate - cena.de) * fps);
	const fG = q(cena, num(cena, 'grande'), fps);
	const fO = q(cena, num(cena, 'onda'), fps);
	const fT = q(cena, num(cena, 'todo'), fps);
	const fS = q(cena, num(cena, 'surfando'), fps);
	const entrada = interpolate(frame, [0, 7], [0, 1], lim);
	const saida = interpolate(frame, [fim - 7, fim], [1, 0], lim);
	const sobe = spring({frame, fps, config: {damping: 16, stiffness: 90}});
	const kG = interpolate(frame, [fG, fG + 6], [0, 1], lim);
	const kS = interpolate(frame, [fS, fS + 7], [0, 1], lim);
	const varios = [
		{x: -3.2, z: -0.6, cor: '#ff7ab6', d: 0},
		{x: 3.4, z: -1.2, cor: '#7affd1', d: 3},
		{x: -0.8, z: -2.2, cor: '#ffd27a', d: 6},
		{x: 1.6, z: 0.9, cor: '#c9a7ff', d: 9},
	];
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: entrada * saida}}>
			<FundoMotion fundo="radial-gradient(ellipse at 50% 40%, #2a2f8f 0%, #1E0F3A 58%, #0b051c 100%)" />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse 70% 22% at 50% 63%, rgba(60,150,255,0.35) 0%, rgba(60,150,255,0) 100%)'}} />
			<Rotulo texto="UMA GRANDE" y={300} k={kG} tamanho={46} />
			<AbsoluteFill style={{filter: 'drop-shadow(0 20px 28px rgba(4,2,20,0.55))'}}>
				<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
					<Luzes quadro={frame} batidas={[fO]} />
					<directionalLight position={[0, 5, 6]} intensity={1.4} color="#bfe0ff" />
					<group position={[0, yMundo(1260) - (1 - sobe) * 3, 0]}>
						<Mar t={t} />
						<Prancha x={-4 + ((t * 1.6) % 8)} z={0.2} t={t} cor="#E8C27A" escala={0.9} />
						{varios.map((v, i) =>
							frame >= fT + v.d ? (
								<group key={i} scale={spring({frame: frame - fT - v.d, fps, config: {damping: 12}})}>
									<Prancha x={v.x + Math.sin(t * 1.2 + i) * 0.4} z={v.z} t={t} cor={v.cor} escala={0.6} />
								</group>
							) : null,
						)}
					</group>
					<Linha3D texto="ONDA AZUL" metal="branco" largura={4.4} y={yMundo(470)} quadro={frame} batida={fO} profundidade={0.5} />
				</ThreeCanvas>
			</AbsoluteFill>
			<Rotulo texto="TODO MUNDO SURFANDO" y={1660} k={kS} tamanho={44} ouro />
		</AbsoluteFill>
	);
};

// ─── O mesmo salário: 30 dias × poucas horas ─────────────────────────────────────────────────────────────────────
const Cartao: React.FC<{x: number; k: number; rotulo: string; valor: string; ouro?: boolean; carimbo?: number}> = ({x, k, rotulo, valor, ouro, carimbo = 0}) => (
	<div
		style={{
			position: 'absolute',
			left: x,
			top: 1010,
			width: 420,
			height: 300,
			borderRadius: 34,
			opacity: k,
			transform: `translateY(${(1 - k) * 80}px) scale(${0.9 + 0.1 * k})`,
			background: ouro ? 'linear-gradient(160deg, rgba(90,58,20,0.92), rgba(46,24,86,0.92))' : 'linear-gradient(160deg, rgba(60,52,86,0.92), rgba(30,15,58,0.92))',
			boxShadow: `inset 0 0 0 2px ${ouro ? 'rgba(232,194,122,0.85)' : 'rgba(220,220,240,0.45)'}, 0 24px 40px rgba(6,2,18,0.55)`,
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			justifyContent: 'center',
			gap: 18,
		}}
	>
		<span style={{fontFamily: poppins, fontWeight: 800, fontSize: 34, letterSpacing: '0.12em', marginRight: '-0.12em', color: ouro ? '#F2D08A' : '#dcdcef'}}>{rotulo}</span>
		<span
			style={{
				fontFamily: playfair,
				fontStyle: 'italic',
				fontWeight: 800,
				fontSize: valor.length > 8 ? 62 : 84,
				lineHeight: 1.05,
				padding: '0 0.06em',
				textAlign: 'center',
				...(ouro ? {background: OURO_TEXTO, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'} : {color: '#fff'}),
			}}
		>
			{valor}
		</span>
		{carimbo > 0 ? (
			<div
				style={{
					position: 'absolute',
					right: -26,
					bottom: -34,
					padding: '10px 22px',
					borderRadius: 14,
					border: '4px solid #E8C27A',
					background: 'rgba(30,15,58,0.92)',
					transform: `rotate(-10deg) scale(${1.6 - 0.6 * carimbo})`,
					opacity: carimbo,
				}}
			>
				<span style={{fontFamily: poppins, fontWeight: 900, fontSize: 32, color: '#F2D08A', letterSpacing: '0.06em'}}>NEM 1 DIA</span>
			</div>
		) : null}
	</div>
);

const Salario: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const t = frame / fps;
	const fim = Math.round((cena.ate - cena.de) * fps);
	const fSal = Math.max(2, q(cena, num(cena, 'salario'), fps));
	const fF = q(cena, num(cena, 'farmaceutica'), fps);
	const fP = q(cena, num(cena, 'poucas'), fps);
	const fN = q(cena, num(cena, 'nem'), fps);
	const entrada = interpolate(frame, [0, 7], [0, 1], lim);
	const saida = interpolate(frame, [fim - 6, fim], [1, 0], lim);
	const kA = spring({frame: frame - fF, fps, config: {damping: 14, stiffness: 120}});
	const kB = spring({frame: frame - fP, fps, config: {damping: 13, stiffness: 120}});
	const seta = interpolate(frame, [fP - 4, fP + 4], [0, 1], lim);
	const carimbo = frame >= fN ? spring({frame: frame - fN, fps, config: {damping: 11, stiffness: 170}}) : 0;
	// Relógio: anda normal e dispara nas "poucas horas".
	const giro = frame < fP ? t * 60 : fP / fps * 60 + (frame - fP) * 260;
	const rel = spring({frame: frame - fP + 4, fps, config: {damping: 12}});
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: entrada * saida}}>
			<FundoMotion />
			<AbsoluteFill style={{filter: 'drop-shadow(0 22px 30px rgba(8,2,20,0.6))'}}>
				<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
					<Luzes quadro={frame} batidas={[2, fSal, fP]} />
					<Linha3D texto="O MESMO" metal="branco" largura={2.9} y={yMundo(360)} quadro={frame} batida={2} profundidade={0.45} />
					<Linha3D texto="SALÁRIO" metal="ouro" largura={4.0} y={yMundo(560)} quadro={frame} batida={fSal} profundidade={0.55} />
					{frame >= fP - 4 ? (
						<group position={[xMundo(780), yMundo(1560), 0]} scale={0.62 * rel} rotation={[0.15, -0.3, 0]}>
							<Relogio segundos={giro} />
						</group>
					) : null}
				</ThreeCanvas>
			</AbsoluteFill>
			<Cartao x={70} k={kA} rotulo="FARMACÊUTICA" valor="30 DIAS" />
			<Cartao x={590} k={kB} rotulo="TIKTOK SHOP" valor="POUCAS HORAS" ouro carimbo={carimbo} />
			<div style={{position: 'absolute', left: 500, top: 1130, width: 80, textAlign: 'center', opacity: seta, transform: `translateX(${(1 - seta) * -20}px)`}}>
				<span style={{fontFamily: poppins, fontWeight: 900, fontSize: 64, color: '#E8C27A'}}>→</span>
			</div>
		</AbsoluteFill>
	);
};

export const pecas: Pecas = {
	v12Calendario: Calendario,
	v12VideoLive: VideoLive,
	v12OndaAzul: OndaAzul,
	v12Salario: Salario,
};
