// Peças exclusivas do depoimento-3-2 (cena tipo 'peca'; chaves com prefixo d32). Tempos em segundos do vídeo editado.
// Câmera 3D de referência: fov 35 a 14,5 de distância (meia altura ~4,57, meia largura ~2,57 unidades; y 0 = meio do quadro).
import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import type {CenaPeca, Pecas} from '../../pecas/peca';
import {FundoMotion} from '../../pecas/FundoMotion';
import {Linha3D, Luzes} from '../../pecas/tres/Texto3D';
import {poppins} from '../../motor/tema';

const lim = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const OURO = '#E8C27A';
const GL = {alpha: true, antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05};
const CAMERA = {fov: 35, position: [0, 0, 14.5] as [number, number, number], near: 0.1, far: 60};
const yMundo = (px: number) => ((960 - px) / 960) * 14.5 * Math.tan((35 / 2) * (Math.PI / 180));

const useCena = (cena: CenaPeca) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const fim = Math.round((cena.ate - cena.de) * fps);
	const q = (s: unknown) => Math.round(Math.max(0, Number(s) - cena.de) * fps);
	const entrada = interpolate(frame, [0, 7], [0, 1], lim);
	const saida = interpolate(frame, [fim - 7, fim], [1, 0], lim);
	return {frame, fps, width, height, fim, q, entrada, saida, t: frame / fps};
};

const useMats = () =>
	useMemo(
		() => ({
			ouro: new THREE.MeshStandardMaterial({color: OURO, metalness: 1, roughness: 0.22}),
			ouroBrilho: new THREE.MeshStandardMaterial({color: '#ffe3a3', metalness: 0.9, roughness: 0.18, emissive: '#c99a3e', emissiveIntensity: 0.5}),
			roxo: new THREE.MeshPhysicalMaterial({color: '#2a1552', metalness: 0.3, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.15}),
			roxoClaro: new THREE.MeshPhysicalMaterial({color: '#5b34a8', metalness: 0.35, roughness: 0.3, clearcoat: 1}),
			prata: new THREE.MeshStandardMaterial({color: '#d6d8e2', metalness: 1, roughness: 0.22}),
			vidro: new THREE.MeshPhysicalMaterial({color: '#ffffff', metalness: 0, roughness: 0.05, transmission: 0.9, transparent: true, opacity: 0.25, clearcoat: 1}),
		}),
		[],
	);

const Kicker: React.FC<{texto: string; y: number; p: number; cor?: string}> = ({texto, y, p, cor = OURO}) => (
	<div style={{position: 'absolute', top: y, width: '100%', textAlign: 'center', opacity: p, transform: `translateY(${(1 - p) * 16}px)`}}>
		<span style={{fontFamily: poppins, fontWeight: 800, fontSize: 40, letterSpacing: '0.3em', marginRight: '-0.3em', color: cor, textShadow: '0 4px 18px rgba(10,4,24,0.8)'}}>{texto}</span>
	</div>
);

// ---------------------------------------------------------------- gancho: resposta de oração
// Feixes de luz dourada descem do alto sobre a cabeça dela, poeira de luz subindo; "RESPOSTA DE" e, no "oração", ORAÇÃO em ouro 3D.
// dados: {resposta: segundo do "resposta"; oracao: segundo do "oração"}.
const d32Luz: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {fim, frame, width, height, q, entrada, saida, t} = useCena(cena);
	const resp = q(cena.dados?.resposta);
	const ora = Math.max(resp + 6, q(cena.dados?.oracao));
	const desce = interpolate(frame, [0, 16], [0, 1], {...lim, easing: (x) => 1 - Math.pow(1 - x, 3)});
	const kick = interpolate(frame, [resp - 3, resp + 5], [0, 1], lim);
	const clarao = frame >= ora ? Math.exp(-(frame - ora) / 4) : 0;
	const feixes = [-0.32, -0.16, 0, 0.15, 0.3];
	const graos = useMemo(() => Array.from({length: 26}, (_, i) => ({x: ((i * 37) % 100) / 100, v: 0.4 + ((i * 53) % 10) / 14, f: (i * 17) % 60, s: 4 + (i % 4) * 2})), []);
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: saida}}>
			<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(30,15,58,0.85) 0%, rgba(30,15,58,0.45) 22%, rgba(30,15,58,0) 40%)', opacity: entrada}} />
			{/* feixes descendo do alto */}
			<AbsoluteFill style={{mixBlendMode: 'screen', clipPath: `inset(0 0 ${(1 - desce) * 100}% 0)`}}>
				{feixes.map((d, i) => (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: width / 2 - 70 + d * width,
							top: -200,
							width: 140 + (i % 2) * 60,
							height: height * 0.85,
							transformOrigin: '50% 0%',
							transform: `rotate(${-d * 22 + Math.sin(t * 1.3 + i) * 1.5}deg)`,
							background: 'linear-gradient(180deg, rgba(255,226,150,0.75) 0%, rgba(232,194,122,0.32) 45%, rgba(232,194,122,0) 100%)',
							filter: 'blur(18px)',
							opacity: (0.55 + 0.25 * Math.sin(t * 2.2 + i * 1.7)) * (1 + clarao),
						}}
					/>
				))}
			</AbsoluteFill>
			{/* poeira de luz */}
			{graos.map((g, i) => {
				const y = height * (0.75 - (((frame + g.f) * g.v * 6) % (height * 0.7)) / height);
				return <div key={i} style={{position: 'absolute', left: width * (0.18 + g.x * 0.64), top: y, width: g.s, height: g.s, borderRadius: g.s, background: '#ffe9b8', boxShadow: '0 0 12px #ffd27a', opacity: 0.8 * entrada}} />;
			})}
			<Kicker texto="VOCÊS SÃO RESPOSTA DE" y={215} p={kick} />
			<AbsoluteFill style={{filter: 'drop-shadow(0 18px 26px rgba(12,4,28,0.6))'}}>
				<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
					<Luzes quadro={frame} batidas={[ora]} />
					{frame >= ora ? (
						<group scale={1 + 0.1 * clarao}>
							<Linha3D ate={fim - 8} texto="ORAÇÃO" metal="ouro" largura={4.1} y={yMundo(390)} quadro={frame} batida={ora} profundidade={0.5} />
						</group>
					) : null}
				</ThreeCanvas>
			</AbsoluteFill>
			<AbsoluteFill style={{background: '#fff3d6', opacity: 0.35 * clarao}} />
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- nem um terço
// Tela cheia: dois tubos de vidro 3D. OUTRAS enche de prata só até 1/3; no "meninos", ESSES MENINOS enche de ouro até a boca.
// dados: {outras, terco, meninos, entregam} (segundos).
const d32Terco: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {fim, frame, fps, width, height, q, entrada, saida, t} = useCena(cena);
	const m = useMats();
	const outras = q(cena.dados?.outras);
	const terco = Math.max(outras + 6, q(cena.dados?.terco));
	const meninos = Math.max(terco + 6, q(cena.dados?.meninos));
	const entregam = Math.max(meninos + 8, q(cena.dados?.entregam));
	const H = 4.2;
	const nivelA = (1 / 3) * spring({frame: frame - terco + 4, fps, config: {damping: 16, stiffness: 110}}) + 0.08 * interpolate(frame, [outras, terco - 4], [0, 1], lim);
	const nivelB = interpolate(frame, [meninos, entregam], [0, 1], {...lim, easing: (x) => 1 - Math.pow(1 - x, 2.4)});
	const cheio = frame >= entregam ? Math.exp(-(frame - entregam) / 4) : 0;
	const tubo = (x: number, nivel: number, mat: THREE.Material, entra: number) => {
		const p = spring({frame: frame - entra, fps, config: {damping: 14, stiffness: 140}});
		const a = Math.max(0.02, H * Math.min(1, nivel));
		if (frame < entra) return null;
		return (
			<group position={[x, -1.2 - (1 - p) * 6, 0]} scale={0.85}>
				<mesh position={[0, H / 2, 0]} material={m.vidro}>
					<cylinderGeometry args={[0.72, 0.72, H, 40, 1, true]} />
				</mesh>
				<mesh position={[0, a / 2, 0]} material={mat}>
					<cylinderGeometry args={[0.66, 0.66, a, 40]} />
				</mesh>
				<mesh position={[0, -0.08, 0]} material={m.roxoClaro}>
					<cylinderGeometry args={[0.9, 0.9, 0.16, 40]} />
				</mesh>
				{[1 / 3, 2 / 3].map((f) => (
					<mesh key={f} position={[0, H * f, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.roxoClaro}>
						<torusGeometry args={[0.74, 0.025, 8, 40]} />
					</mesh>
				))}
			</group>
		);
	};
	const rot = (lado: number, texto: string, cor: string, entra: number) => (
		<div style={{position: 'absolute', top: 1580, left: lado < 0 ? 130 : 590, width: 360, textAlign: 'center', opacity: interpolate(frame, [entra, entra + 6], [0, 1], lim), fontFamily: poppins, fontWeight: 800, fontSize: 34, letterSpacing: '0.12em', color: cor}}>
			{texto}
		</div>
	);
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: Math.min(entrada, saida)}}>
			<FundoMotion />
			{rot(-1, 'OUTRAS MENTORIAS', '#d6d8e2', outras)}
			{rot(1, 'ESSES MENINOS', OURO, meninos)}
			<AbsoluteFill style={{filter: 'drop-shadow(0 22px 30px rgba(8,2,20,0.65))'}}>
				<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
					<Luzes quadro={frame} batidas={[terco, entregam]} />
					<group rotation={[0.12, Math.sin(t * 0.7) * 0.08, 0]} position={[0, -1.4, 0]}>
						{tubo(-1.25, nivelA, m.prata, outras)}
						<group scale={1 + 0.06 * cheio}>{tubo(1.25, nivelB, m.ouroBrilho, meninos)}</group>
					</group>
					{frame >= terco && frame < meninos ? <Linha3D ate={meninos - 9} texto="NEM 1/3" metal="branco" largura={3.8} y={yMundo(420)} quadro={frame} batida={terco} profundidade={0.4} /> : null}
					{frame >= meninos ? <Linha3D ate={fim - 8} texto="ENTREGAM" metal="ouro" largura={4} y={yMundo(420)} quadro={frame} batida={meninos} profundidade={0.45} /> : null}
				</ThreeCanvas>
			</AbsoluteFill>
			<AbsoluteFill style={{background: '#fff', opacity: 0.25 * cheio}} />
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- prosperidade dos mentorados
// Tela cheia: escada de ouro 3D e cinco mentorados (bonecos roxos) subindo degrau por degrau; PROSPERIDADE em ouro 3D
// e "DOS MENTORADOS" quando ela diz a palavra.
// dados: {prosperidade, mentorados} (segundos).
const Boneco: React.FC<{mat: THREE.Material; cabeca: THREE.Material}> = ({mat, cabeca}) => (
	<group>
		<mesh position={[0, 0.32, 0]} material={mat}>
			<capsuleGeometry args={[0.17, 0.32, 6, 16]} />
		</mesh>
		<mesh position={[0, 0.78, 0]} material={cabeca}>
			<sphereGeometry args={[0.16, 24, 16]} />
		</mesh>
	</group>
);
const d32Sobem: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {fim, frame, fps, width, height, q, entrada, saida, t} = useCena(cena);
	const m = useMats();
	const pros = q(cena.dados?.prosperidade);
	const ment = Math.max(pros + 6, q(cena.dados?.mentorados));
	const degraus = 5;
	const kick = interpolate(frame, [ment - 3, ment + 5], [0, 1], lim);
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: Math.min(entrada, saida)}}>
			<FundoMotion />
			<Kicker texto="DOS MENTORADOS" y={560} p={kick} />
			<AbsoluteFill style={{filter: 'drop-shadow(0 22px 30px rgba(8,2,20,0.65))'}}>
				<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
					<Luzes quadro={frame} batidas={[pros, ment]} />
					<group position={[0, -2.6, 0]} rotation={[0.25, -0.5 + Math.sin(t * 0.6) * 0.05, 0]}>
						{Array.from({length: degraus}, (_, i) => {
							const p = spring({frame: frame - i * 2, fps, config: {damping: 15, stiffness: 140}});
							return (
								<mesh key={i} position={[(i - 2) * 0.8, (i * 0.5) / 2 + 0.12, 0]} scale={[1, Math.max(0.01, p), 1]} material={i === degraus - 1 ? m.ouroBrilho : i % 2 ? m.ouro : m.roxoClaro}>
									<boxGeometry args={[0.8, i * 0.5 + 0.24, 1.2]} />
								</mesh>
							);
						})}
						{Array.from({length: 5}, (_, k) => {
							// cada boneco sobe, um atrás do outro, até o degrau k (o primeiro vai ao topo)
							const alvo = degraus - 1 - k;
							const sobe = interpolate(frame, [6 + k * 4, ment + 10 + k * 3], [0, alvo], lim);
							const d = Math.floor(sobe);
							const f = sobe - d;
							const salto = Math.sin(f * Math.PI) * 0.35;
							const pos = d + f;
							return (
								<group key={k} position={[(pos - 2) * 0.8, pos * 0.5 + 0.24 + salto, 0.1 + (k % 2) * 0.25]}>
									<Boneco mat={k === 0 && frame > ment ? m.ouro : m.roxo} cabeca={m.prata} />
								</group>
							);
						})}
					</group>
					{frame >= pros ? <Linha3D ate={fim - 8} texto="PROSPERIDADE" metal="ouro" largura={4.6} y={yMundo(400)} quadro={frame} batida={pros} profundidade={0.4} intervalo={1} /> : null}
				</ThreeCanvas>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

export const pecas: Pecas = {d32Luz, d32Terco, d32Sobem};
