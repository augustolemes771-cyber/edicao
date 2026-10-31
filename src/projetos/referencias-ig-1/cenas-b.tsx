// Cenas do bloco B do referencias-ig-1 (peças + a lista de cenas que entram no edit.ts).
// Flaps, decolagem, ailerons e profundor. Avião local (AviaoB) com o sentido das superfícies conferido: flap desce,
// aileron de um lado sobe e o do outro desce, profundor positivo sobe o bordo de fuga (nariz sobe).
import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import type {Busca} from '../../motor/palavras';
import type {Cena} from '../../motor/plano';
import type {CenaPeca, Pecas} from '../../pecas/peca';
import {Chao, COR, lim, Nuvem, Rotulo, trilha, Turbina, useMateriais, useQ, type Materiais, type PoseAviao} from './aviao';

type V3 = [number, number, number];

// ---------------------------------------------------------------- utilidades
const useCena = (cena: CenaPeca) => {
	// origem: começo da cena original quando ela foi dividida em partes contínuas (ver dividir).
	const d = (cena.dados ?? {}) as Record<string, number>;
	const origem = d.origem ?? cena.de;
	const {frame, fps, q} = useQ(origem);
	const fim = Math.round((cena.ate - origem) * fps);
	// q de um tempo dos dados
	const k = (nome: string) => q(d[nome]);
	const mola = (em: number, rigidez = 170, amort = 14) => spring({frame: frame - em, fps, config: {damping: amort, stiffness: rigidez}});
	const ease = (a: number, b: number) => interpolate(frame, [a, b], [0, 1], {...lim, easing: Easing.inOut(Easing.cubic)});
	return {frame, fps, q, k, d, fim, mola, ease, t: frame / fps};
};

// Céu em gradiente + canvas com câmera que anda (posição, alvo e fov aplicados a cada quadro).
const PalcoB: React.FC<{children: React.ReactNode; camera: V3; alvo: V3; fov?: number; ceu?: [string, string]}> = ({children, camera, alvo, fov = 40, ceu = [COR.ceu1, COR.ceu2]}) => {
	const {width, height} = useVideoConfig();
	return (
		<AbsoluteFill style={{background: `linear-gradient(180deg, ${ceu[0]} 0%, ${ceu[1]} 75%)`}}>
			<ThreeCanvas width={width} height={height} gl={{alpha: true, antialias: true, preserveDrawingBuffer: true}} camera={{fov, position: camera, near: 0.1, far: 900}} style={{position: 'absolute', inset: 0}}>
				<Cam pos={camera} alvo={alvo} fov={fov} />
				<ambientLight intensity={0.75} />
				<directionalLight position={[8, 14, 6]} intensity={1.6} />
				<directionalLight position={[-6, 4, -8]} intensity={0.45} />
				{children}
			</ThreeCanvas>
		</AbsoluteFill>
	);
};

const Cam: React.FC<{pos: V3; alvo: V3; fov: number}> = ({pos, alvo, fov}) => {
	const {camera} = useThree();
	camera.position.set(pos[0], pos[1], pos[2]);
	(camera as THREE.PerspectiveCamera).fov = fov;
	camera.lookAt(alvo[0], alvo[1], alvo[2]);
	camera.updateProjectionMatrix();
	return null;
};

// Seta 3D reta (aponta para +Y; gire o grupo). comp = comprimento total.
const Seta: React.FC<{mat: THREE.Material; comp?: number; raio?: number; position?: V3; rotation?: V3; escala?: number}> = ({mat, comp = 2, raio = 0.12, position = [0, 0, 0], rotation = [0, 0, 0], escala = 1}) => {
	const cabeca = raio * 3.4;
	const haste = Math.max(0.01, comp - cabeca);
	if (escala <= 0.001) return null;
	return (
		<group position={position} rotation={rotation} scale={escala}>
			<mesh material={mat} position={[0, haste / 2, 0]}>
				<cylinderGeometry args={[raio, raio, haste, 8]} />
			</mesh>
			<mesh material={mat} position={[0, haste + cabeca / 2, 0]}>
				<coneGeometry args={[raio * 2.4, cabeca, 8]} />
			</mesh>
		</group>
	);
};

// Seta curva: tubo ao longo de pontos f(u) (u de 0 a 1), desenhado até p, com cabeça no fim.
const SetaCurva: React.FC<{mat: THREE.Material; f: (u: number) => THREE.Vector3; p: number; raio?: number}> = ({mat, f, p, raio = 0.16}) => {
	const pp = Math.round(Math.max(0, Math.min(1, p)) * 60) / 60;
	const geo = useMemo(() => {
		if (pp < 0.03) return null;
		const pts = Array.from({length: 24}, (_, i) => f((i / 23) * pp));
		return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, raio, 8, false);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pp, raio]);
	if (!geo) return null;
	const fimP = f(pp);
	const tan = f(pp).sub(f(Math.max(0, pp - 0.02))).normalize();
	const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan);
	return (
		<group>
			<mesh geometry={geo} material={mat} />
			<mesh material={mat} position={fimP} quaternion={quat}>
				<coneGeometry args={[raio * 2.6, raio * 4.5, 8]} />
			</mesh>
		</group>
	);
};

// Campos vistos do alto: chão verde com retalhos de plantação que passam (desloc em unidades).
const Campos: React.FC<{y: number; desloc: number}> = ({y, desloc}) => {
	const mats = useMemo(() => ['#8fd16a', '#6fb24c', '#d8c66a', '#a8db74', '#5fa046'].map((c) => new THREE.MeshStandardMaterial({color: c, flatShading: true, roughness: 1})), []);
	const base = useMemo(() => new THREE.MeshStandardMaterial({color: COR.grama, flatShading: true, roughness: 1}), []);
	const ret = useMemo(
		() =>
			Array.from({length: 140}, (_, i) => ({
				x0: (i % 14) * 46,
				z: Math.floor(i / 14) * 46 - 230 + ((i * 17) % 13),
				w: 26 + ((i * 7) % 15),
				h: 24 + ((i * 11) % 17),
				m: (i * 3 + Math.floor(i / 14)) % 5,
			})),
		[],
	);
	return (
		<group position={[0, y, 0]}>
			<mesh material={base} rotation={[-Math.PI / 2, 0, 0]}>
				<planeGeometry args={[2400, 2400]} />
			</mesh>
			{ret.map((r, i) => {
				const x = ((((r.x0 - desloc) % 644) + 644) % 644) - 322;
				return (
					<mesh key={i} material={mats[r.m]} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.05, r.z]}>
						<planeGeometry args={[r.w, r.h]} />
					</mesh>
				);
			})}
		</group>
	);
};

// Nuvens que passam no sentido -X (o avião voa para +X). lista: [x0, y, z, escala]
const NuvensPassando: React.FC<{m: Materiais; desloc: number; lista: [number, number, number, number][]; faixa?: number}> = ({m, desloc, lista, faixa = 120}) => (
	<group>
		{lista.map(([x0, y, z, e], i) => {
			const x = ((((x0 - desloc) % faixa) + faixa) % faixa) - faixa / 2;
			return <Nuvem key={i} m={m} position={[x, y, z]} escala={e} />;
		})}
	</group>
);

// ---------------------------------------------------------------- avião local (sentidos conferidos)
type PoseB = PoseAviao & {
	flapGira?: number; // 0..1 giro para baixo (padrão = flaps)
	destaqueAileron?: boolean; // ailerons em amarelo mesmo parados
	destaqueProfundor?: boolean;
	brilho?: number; // 0..1 brilho das peças amarelas
};

const AsaB: React.FC<{lado: 1 | -1; m: Materiais; pose: PoseB}> = ({lado, m, pose}) => {
	const flap = pose.flaps ?? 0;
	const gira = pose.flapGira ?? flap;
	const ail = pose.aileron ?? 0;
	const geo = useMemo(() => {
		const sh = new THREE.Shape();
		sh.moveTo(1.2, 0);
		sh.lineTo(-0.9, 5.6);
		sh.lineTo(-2.0, 5.6);
		sh.lineTo(-1.2, 0);
		sh.closePath();
		const g = new THREE.ExtrudeGeometry(sh, {depth: 0.16, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 1});
		g.rotateX(Math.PI / 2);
		return g;
	}, []);
	const fuga = (z: number) => -1.2 - 0.8 * (z / 5.6);
	const painel = (z0: number, z1: number) => ({z: (z0 + z1) / 2, x: (fuga(z0) + fuga(z1)) / 2, larg: z1 - z0});
	const F = painel(0.9, 3.4);
	const A = painel(3.7, 5.3);
	const ang = Math.atan2(0.8, 5.6);
	const flapAmarelo = pose.flaps !== undefined && (flap > 0.01 || gira > 0.01);
	const ailAmarelo = Math.abs(ail) > 0.02 || pose.destaqueAileron;
	// lado direito (z+): aileron positivo sobe; esquerdo desce. Rotação em Z negativa levanta o bordo de fuga.
	const giroAil = -ail * lado * 0.6;
	return (
		<group scale={[1, 1, lado]} position={[0, -0.25, 0]}>
			<mesh geometry={geo} material={m.cinza} position={[0, 0.08, 0]} />
			{/* flap: desliza para trás (flaps) e gira para baixo (flapGira) */}
			<group position={[F.x - flap * 0.6, -0.02 - gira * 0.05, F.z]} rotation={[0, -ang, 0]}>
				<group rotation={[0, 0, gira * 0.6]}>
					<mesh material={flapAmarelo ? m.amarelo : m.cinzaEscuro} position={[-0.32, -0.02, 0]}>
						<boxGeometry args={[0.65, 0.1, F.larg]} />
					</mesh>
				</group>
			</group>
			<group position={[A.x, 0.0, A.z]} rotation={[0, -ang, 0]}>
				<group rotation={[0, 0, giroAil]}>
					<mesh material={ailAmarelo ? m.amarelo : m.cinzaEscuro} position={[-0.27, -0.02, 0]}>
						<boxGeometry args={[0.55, 0.09, A.larg]} />
					</mesh>
				</group>
			</group>
			<Turbina m={m} pose={pose} position={[0.9, -0.62, 2.3]} />
		</group>
	);
};

const TremB: React.FC<{m: Materiais; t: number; position: V3}> = ({m, t, position}) => {
	if (t <= 0.01) return null;
	const alt = 0.9 * t;
	return (
		<group position={position}>
			<mesh material={m.cinzaEscuro} position={[0, -alt / 2, 0]}>
				<cylinderGeometry args={[0.07, 0.07, alt, 6]} />
			</mesh>
			{[0, 1].map((i) => (
				<mesh key={i} material={m.preto} rotation={[Math.PI / 2, 0, 0]} position={[0, -alt, (i - 0.5) * 0.32]} scale={t}>
					<cylinderGeometry args={[0.22, 0.22, 0.16, 10]} />
				</mesh>
			))}
		</group>
	);
};

const AviaoB: React.FC<{pose?: PoseB; m: Materiais}> = ({pose = {}, m}) => {
	const prof = pose.profundor ?? 0;
	const trem = pose.trem ?? 1;
	const profAmarelo = Math.abs(prof) > 0.02 || pose.destaqueProfundor;
	return (
		<group>
			<mesh material={m.branco} rotation={[0, 0, Math.PI / 2]}>
				<cylinderGeometry args={[0.62, 0.62, 8.4, 14]} />
			</mesh>
			<mesh material={m.branco} rotation={[0, 0, -Math.PI / 2]} position={[4.75, 0, 0]}>
				<coneGeometry args={[0.62, 1.1, 14]} />
			</mesh>
			<mesh material={m.branco} rotation={[0, 0, Math.PI / 2]} position={[-5.1, 0.18, 0]} scale={[1, 1, 0.75]}>
				<coneGeometry args={[0.62, 1.6, 14]} />
			</mesh>
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
			<mesh material={m.vidro} position={[4.6, 0.3, 0]} rotation={[0, 0, -0.5]}>
				<boxGeometry args={[0.5, 0.18, 0.9]} />
			</mesh>
			<AsaB lado={1} m={m} pose={pose} />
			<AsaB lado={-1} m={m} pose={pose} />
			<mesh material={m.azul} position={[-4.9, 1.25, 0]} rotation={[0, 0, 0.45]}>
				<boxGeometry args={[1.3, 1.9, 0.12]} />
			</mesh>
			{[1, -1].map((l) => (
				<group key={l} position={[-5.0, 0.3, l * 1.15]}>
					<mesh material={m.cinza}>
						<boxGeometry args={[1.0, 0.08, 1.9]} />
					</mesh>
					{/* profundor positivo: bordo de fuga sobe (empurra a cauda para baixo, nariz sobe) */}
					<group position={[-0.5, 0, 0]} rotation={[0, 0, -prof * 0.55]}>
						<mesh material={profAmarelo ? m.amarelo : m.cinzaEscuro} position={[-0.27, 0, 0]}>
							<boxGeometry args={[0.55, 0.08, 1.8]} />
						</mesh>
					</group>
				</group>
			))}
			<TremB m={m} t={trem} position={[3.4, -0.55, 0]} />
			<TremB m={m} t={trem} position={[-0.6, -0.55, 0.9]} />
			<TremB m={m} t={trem} position={[-0.6, -0.55, -0.9]} />
		</group>
	);
};

// Materiais do bloco com o amarelo que pode brilhar (pulso no rótulo).
const useMatsB = (brilho: number) => {
	const m = useMateriais();
	const extra = useMemo(
		() => ({
			seta: new THREE.MeshStandardMaterial({color: COR.vermelho, flatShading: true, roughness: 0.6}),
			setaBranca: new THREE.MeshStandardMaterial({color: '#ffffff', flatShading: true, roughness: 0.6}),
			sustenta: new THREE.MeshStandardMaterial({color: '#38b6ff', flatShading: true, roughness: 0.6}),
		}),
		[],
	);
	m.amarelo.emissive.set(COR.amarelo);
	m.amarelo.emissiveIntensity = 0.12 + 0.55 * brilho;
	return {...m, ...extra};
};

const pulso = (frame: number, em: number, dur = 24) => (frame >= em && frame < em + dur ? Math.sin(((frame - em) / dur) * Math.PI) : 0);

// ---------------------------------------------------------------- HTML: velocímetro e perfil da asa
const Velocimetro: React.FC<{p: number; agulha: number; sai: number}> = ({p, agulha, sai}) => {
	const a = (-90 + agulha * 180) * (Math.PI / 180);
	const cx = 160;
	const cy = 160;
	const arco = (de: number, ate: number) => {
		const r = 120;
		const p0 = [cx + r * Math.cos(Math.PI + de * Math.PI), cy + r * Math.sin(Math.PI + de * Math.PI)];
		const p1 = [cx + r * Math.cos(Math.PI + ate * Math.PI), cy + r * Math.sin(Math.PI + ate * Math.PI)];
		return `M${p0[0]},${p0[1]} A${r},${r} 0 0 1 ${p1[0]},${p1[1]}`;
	};
	return (
		<div style={{position: 'absolute', top: 250, width: '100%', display: 'flex', justifyContent: 'center', opacity: Math.min(1, p * 1.4) * (1 - sai), transform: `translateY(${(1 - p) * -40 - sai * 40}px) scale(${0.7 + 0.3 * p})`}}>
			<div style={{background: '#ffffff', borderRadius: 36, padding: '22px 30px 8px', boxShadow: '0 14px 34px rgba(0,0,0,0.22)'}}>
				<svg width={320} height={190} viewBox="0 0 320 190">
					<path d={arco(0, 0.33)} stroke="#e5484d" strokeWidth={26} fill="none" />
					<path d={arco(0.34, 0.66)} stroke={COR.amarelo} strokeWidth={26} fill="none" />
					<path d={arco(0.67, 1)} stroke={COR.grama} strokeWidth={26} fill="none" />
					<line x1={cx} y1={cy} x2={cx + 100 * Math.sin(a)} y2={cy - 100 * Math.cos(a)} stroke="#23262b" strokeWidth={12} strokeLinecap="round" />
					<circle cx={cx} cy={cy} r={18} fill="#23262b" />
				</svg>
			</div>
		</div>
	);
};

// Perfil (corte) da asa: o flap desliza para trás (maior) e gira para baixo (curvada).
const PerfilAsa: React.FC<{p: number; desliza: number; gira: number; sai: number}> = ({p, desliza, gira, sai}) => {
	const fx = 392 + desliza * 70;
	const fy = 116 + desliza * 6;
	return (
		<div style={{position: 'absolute', top: 250, width: '100%', display: 'flex', justifyContent: 'center', opacity: Math.min(1, p * 1.4) * (1 - sai), transform: `translateY(${(1 - p) * -40 - sai * 40}px) scale(${0.7 + 0.3 * p})`}}>
			<div style={{background: '#ffffff', borderRadius: 36, padding: '18px 22px', boxShadow: '0 14px 34px rgba(0,0,0,0.22)'}}>
				<svg width={680} height={250} viewBox="0 0 680 250">
					{/* ar passando */}
					{[0, 1, 2].map((i) => (
						<path
							key={i}
							d={`M20,${48 + i * 22} C200,${30 + i * 22} 380,${40 + i * 22} ${520 + desliza * 40},${70 + i * 22 + gira * 70}`}
							stroke="#9fd9ff"
							strokeWidth={6}
							strokeLinecap="round"
							fill="none"
							strokeDasharray="30 18"
						/>
					))}
					<path d="M40,124 C40,78 140,62 250,70 C330,76 380,96 404,112 L404,120 C320,128 190,140 40,124 Z" fill="#b9c0ca" stroke="#6c7480" strokeWidth={5} />
					<g transform={`translate(${fx},${fy}) rotate(${gira * 30})`}>
						<path d="M-6,-9 C30,-11 90,-5 140,0 L140,4 C90,8 30,12 -6,10 Z" fill={desliza > 0.02 || gira > 0.02 ? COR.amarelo : '#6c7480'} stroke="#b88e10" strokeWidth={4} />
					</g>
				</svg>
			</div>
		</div>
	);
};

// ---------------------------------------------------------------- 1. decolagem devagar: a asa sozinha não segura o peso
// dados: {decolagem, devagar, asa, sozinha, segura, peso}
const igBDevagar: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, k, mola, ease, t} = useCena(cena);
	const m = useMatsB(0);
	const [decolagem, devagar, asa, sozinha, segura, peso] = ['decolagem', 'devagar', 'asa', 'sozinha', 'segura', 'peso'].map(k);
	const cam = trilha(frame, [
		[0, [11, 1.2, 12.5]],
		[decolagem, [11, 1.2, 12.5]],
		[asa - 4, [9, 2.2, 13]],
		[asa + 16, [3.2, 6.8, 11.5]],
		[asa + 90, [1.6, 7.6, 10.2]],
	]);
	const alvo = trilha(frame, [
		[0, [1.5, 0.1, 0]],
		[asa - 4, [1, 0.2, 0.5]],
		[asa + 16, [-0.6, 0.6, 2.8]],
	]);
	// velocidade baixa: pista anda devagar (acelera um pouco depois de "decolagem")
	const vel = interpolate(frame, [0, decolagem, decolagem + 30], [1.2, 1.2, 2.4], lim);
	const desl = vel * t + interpolate(frame, [decolagem, decolagem + 30], [0, 0.6], lim);
	const pVel = mola(devagar, 160);
	const saiVel = ease(segura - 4, segura + 6);
	const agulha = 0.12 + 0.03 * Math.sin(frame / 3);
	const pSob = mola(sozinha, 170);
	const pPeso = mola(segura, 150);
	const pPeso2 = mola(peso, 200);
	const forca = 1 + 0.25 * pPeso2;
	const tremor = frame >= peso ? Math.sin(frame * 2.3) * 0.022 * Math.min(1, (frame - peso) / 6) : 0;
	const bal = Math.sin(frame / 7) * 0.006;
	return (
		<AbsoluteFill>
			<PalcoB camera={cam} alvo={alvo} fov={42}>
				<Chao m={m} deslocamento={desl} />
				<group rotation={[tremor, 0, bal]} position={[0, Math.abs(tremor) * -0.6, 0]}>
					<AviaoB m={m} pose={{giroTurbina: frame * 0.35, trem: 1}} />
					{/* sustentação pequena (azul, para cima) */}
					<Seta mat={m.sustenta} comp={1.2} raio={0.1} position={[-0.75, 0.0, 3.3]} escala={pSob} />
					{/* peso grande (vermelho, para baixo) */}
					{[1.9, 4.5].map((z, i) => (
						<Seta key={z} mat={m.seta} comp={2.6} raio={0.15} position={[-0.5 - z * 0.2, 2.75 * forca, z]} rotation={[0, 0, Math.PI]} escala={mola(segura + i * 4, 150) * forca} />
					))}
					<Seta mat={m.seta} comp={2.0} raio={0.13} position={[-0.3, 2.2 * forca, -2.6]} rotation={[0, 0, Math.PI]} escala={pPeso * forca} />
				</group>
			</PalcoB>
			{frame >= devagar && saiVel < 1 ? <Velocimetro p={pVel} agulha={agulha} sai={saiVel} /> : null}
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 2. flaps: a asa estica para trás e para baixo
// dados: {estica, tras, baixo, ficando, maior, curvada, rotulo}
const igBFlaps: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, k, mola, ease, t} = useCena(cena);
	const [estica, tras, baixo, ficando, maior, curvada, rotulo] = ['estica', 'tras', 'baixo', 'ficando', 'maior', 'curvada', 'rotulo'].map(k);
	const brilho = pulso(frame, rotulo, 26);
	const m = useMatsB(brilho);
	const desliza = ease(estica, tras + 4);
	const gira = ease(baixo - 4, baixo + 10);
	const cam = trilha(frame, [
		[0, [-9.5, 6.2, 9.5]],
		[estica, [-8.2, 5.2, 8.6]],
		[baixo + 10, [-6.4, 3.0, 8.4]],
		[rotulo, [-7.2, 3.6, 9.8]],
		[rotulo + 45, [-7.8, 4.0, 10.6]],
	]);
	const alvo = trilha(frame, [
		[0, [-0.8, -0.2, 2.4]],
		[baixo + 10, [-1.4, -0.6, 2.4]],
		[rotulo + 45, [-1.0, -0.4, 2.2]],
	]);
	// perfil (HTML) em "ficando maior e mais curvada"
	const pPerfil = mola(ficando, 170);
	const perfDesl = ease(maior, maior + 9);
	const perfGira = ease(curvada, curvada + 10);
	const saiPerfil = ease(rotulo - 9, rotulo - 1);
	const pRot = mola(rotulo, 190, 12);
	return (
		<AbsoluteFill>
			<PalcoB camera={cam} alvo={alvo} fov={42}>
				<Chao m={m} deslocamento={14 + 2.4 * t} />
				<group rotation={[0, 0, Math.sin(frame / 8) * 0.005]}>
					<AviaoB m={m} pose={{flaps: desliza, flapGira: gira, giroTurbina: frame * 0.4, trem: 1}} />
				</group>
			</PalcoB>
			{frame >= ficando && saiPerfil < 1 ? <PerfilAsa p={pPerfil} desliza={perfDesl} gira={perfGira} sai={saiPerfil} /> : null}
			{frame >= rotulo ? <Rotulo texto="FLAPS" y={330} p={pRot} tam={72} /> : null}
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 3. agora ele sobe: decolagem vista da pista
// dados: {ele, sobe}
const igBSobe: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, k, ease, fim} = useCena(cena);
	const m = useMatsB(0);
	const [ele, sobe] = ['ele', 'sobe'].map(k);
	const tt = frame / fps;
	// corre rápido na pista
	const desl = 20 + 22 * tt + 6 * tt * tt;
	const arfagem = ease(ele - 2, sobe + 8) * 0.2;
	const sub = interpolate(frame, [sobe, fim], [0, 1], {...lim, easing: Easing.in(Easing.quad)});
	const y = sub * 7.5;
	const trem = 1 - ease(sobe + 14, sobe + 30);
	const pos: V3 = [0, y, 0];
	const cam: V3 = [14.5, -0.9 + y * 0.25, 7.5];
	const alvo: V3 = [0, 0.4 + y * 0.85, 0.5];
	return (
		<AbsoluteFill>
			<PalcoB camera={cam} alvo={alvo} fov={46}>
				<Chao m={m} deslocamento={desl} />
				<Nuvem m={m} position={[-30, 22 - sub * 4, -40]} escala={4} />
				<Nuvem m={m} position={[-10, 26 - sub * 4, 20]} escala={3} />
				<group position={pos} rotation={[0, 0, arfagem]}>
					<AviaoB m={m} pose={{flaps: 0.5, flapGira: 0.4, giroTurbina: frame * 0.9, trem}} />
				</group>
			</PalcoB>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 4. como faz um bicho desse tamanho virar?
// dados: {bicho, virar}
const NUVENS_A: [number, number, number, number][] = [
	[0, 6, -14, 3],
	[30, -4, 12, 3.5],
	[60, 9, 18, 2.5],
	[90, -7, -20, 4],
	[45, 3, 26, 3],
	[105, 12, -6, 2.5],
];
const igBVirar: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, k, mola, ease, t} = useCena(cena);
	const m = useMatsB(0);
	const [bicho, virar] = ['bicho', 'virar'].map(k);
	const cam = trilha(frame, [
		[0, [11, 2.5, 13]],
		[bicho - 4, [9, 0.5, 11]],
		[bicho + 12, [6.5, -3.4, 7.5]],
		[virar - 2, [5.5, -3.6, 7.8]],
		[virar + 16, [-6, 15, 15]],
		[virar + 40, [-7, 17, 16]],
	]);
	const alvo = trilha(frame, [
		[0, [0, 0, 0]],
		[virar - 2, [0, 0.5, 0]],
		[virar + 16, [3, 0, 3]],
	]);
	const pSeta = ease(virar + 2, virar + 20);
	const inclina = ease(virar + 4, virar + 26) * 0.35;
	const guinada = ease(virar + 10, virar + 40) * -0.18;
	const R = 8;
	const f = (u: number) => {
		const a = u * 1.9;
		return new THREE.Vector3(5.8 + R * Math.sin(a), 0.4, R - R * Math.cos(a));
	};
	return (
		<AbsoluteFill>
			<PalcoB camera={cam} alvo={alvo} fov={44}>
				<Campos y={-70} desloc={t * 30} />
				<NuvensPassando m={m} desloc={t * 26} lista={NUVENS_A} />
				<group rotation={[inclina, guinada, 0]}>
					<AviaoB m={m} pose={{trem: 0, giroTurbina: frame * 0.9}} />
				</group>
				<SetaCurva mat={m.amarelo} f={f} p={pSeta} raio={0.28} />
			</PalcoB>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 5. ailerons: um sobe, o outro desce, o avião inclina
// dados: {ponta, sobe, desce, inclina, rotulo}
const igBAilerons: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, k, mola, ease, t} = useCena(cena);
	const [ponta, sobe, desce, inclina, rotulo] = ['ponta', 'sobe', 'desce', 'inclina', 'rotulo'].map(k);
	const brilho = Math.max(pulso(frame, ponta, 20), pulso(frame, rotulo, 26));
	const m = useMatsB(brilho);
	const ail = ease(sobe, sobe + 10);
	const roll = ease(inclina, inclina + 26) * 0.55;
	const cam = trilha(frame, [
		[0, [-24, 7, 3]],
		[ponta, [-22, 6.5, 3]],
		[ponta + 26, [-7.5, 2.6, 8.8]],
		[desce - 2, [-7.2, 2.4, 9.0]],
		[desce + 20, [-25, 5, 0.5]],
		[inclina + 30, [-25, 3.6, -2.5]],
		[rotulo + 45, [-26, 3.8, -3.5]],
	]);
	const alvo = trilha(frame, [
		[ponta, [0, 0, 0]],
		[ponta + 26, [-2.0, -0.2, 4.4]],
		[desce - 2, [-2.0, -0.2, 4.4]],
		[desce + 20, [0, 0.2, 0]],
	]);
	const pCima = mola(sobe + 2, 170);
	const pBaixo = mola(desce, 170);
	const pRot = mola(rotulo, 190, 12);
	// nuvens: vêm na direção da câmera e, depois de inclinar, escorregam de lado (curva)
	const lateral = ease(inclina + 10, inclina + 60) * t * 4;
	return (
		<AbsoluteFill>
			<PalcoB camera={cam} alvo={alvo} fov={46}>
				<Campos y={-70} desloc={t * 30} />
				<group position={[0, 0, -lateral]}>
					<NuvensPassando m={m} desloc={t * 22} lista={NUVENS_A} faixa={140} />
				</group>
				<group rotation={[roll, 0, 0]}>
					<AviaoB m={m} pose={{trem: 0, aileron: ail, destaqueAileron: frame >= ponta, giroTurbina: frame * 0.9}} />
					{/* direita (z+) sobe, esquerda desce */}
					<Seta mat={m.setaBranca} comp={2.2} raio={0.14} position={[-2.1, 0.35, 4.5]} escala={pCima} />
					<Seta mat={m.setaBranca} comp={2.2} raio={0.14} position={[-2.1, -0.75, -4.5]} rotation={[0, 0, Math.PI]} escala={pBaixo} />
				</group>
			</PalcoB>
			{frame >= rotulo ? <Rotulo texto="AILERONS" y={330} p={pRot} tam={72} /> : null}
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 6. profundor: na cauda, aponta o nariz para cima ou para baixo
// dados: {cauda, aponta, cima, baixo, rotulo}
const igBProfundor: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, k, mola, ease, t} = useCena(cena);
	const [cauda, aponta, cima, baixo, rotulo] = ['cauda', 'aponta', 'cima', 'baixo', 'rotulo'].map(k);
	const brilho = Math.max(pulso(frame, cauda, 20), pulso(frame, rotulo, 26));
	const m = useMatsB(brilho);
	const prof = ease(cima - 2, cima + 6) - 2 * ease(baixo - 2, baixo + 8) + ease(baixo + 18, baixo + 30);
	const pitch = ease(cima, cima + 14) * 0.26 - ease(baixo, baixo + 16) * 0.46 + ease(baixo + 22, baixo + 38) * 0.2;
	const cam = trilha(frame, [
		[0, [-15, 5.5, 10]],
		[cauda + 14, [-10.2, 2.6, 5.4]],
		[aponta - 2, [-9.8, 2.5, 5.2]],
		[aponta + 20, [-13.5, 3.6, 13.5]],
		[rotulo + 45, [-14.5, 4.2, 15]],
	]);
	const alvo = trilha(frame, [
		[0, [-3, 0.5, 0]],
		[cauda + 14, [-5.0, 0.6, 0.6]],
		[aponta - 2, [-5.0, 0.6, 0.6]],
		[aponta + 20, [-0.5, 0.4, 0]],
	]);
	const pCima = mola(cima, 170) * (1 - ease(baixo - 4, baixo + 2));
	const pBaixo = mola(baixo, 170) * (1 - ease(baixo + 26, baixo + 34));
	const pRot = mola(rotulo, 190, 12);
	return (
		<AbsoluteFill>
			<PalcoB camera={cam} alvo={alvo} fov={44}>
				<Campos y={-70} desloc={t * 30} />
				<NuvensPassando m={m} desloc={t * 24} lista={NUVENS_A} />
				<group rotation={[0, 0, pitch]}>
					<AviaoB m={m} pose={{trem: 0, profundor: prof, destaqueProfundor: frame >= cauda, giroTurbina: frame * 0.9}} />
					<Seta mat={m.setaBranca} comp={2.0} raio={0.14} position={[4.8, 0.9, 0]} escala={pCima} />
					<Seta mat={m.setaBranca} comp={2.0} raio={0.14} position={[4.8, -0.9, 0]} rotation={[0, 0, Math.PI]} escala={pBaixo} />
				</group>
			</PalcoB>
			{frame >= rotulo ? <Rotulo texto="PROFUNDOR" y={330} p={pRot} tam={72} /> : null}
		</AbsoluteFill>
	);
};

// Partes com outro nome (mesmo componente) para o momento do rótulo.
const igBFlapsNome = igBFlaps;
const igBAileronsNome = igBAilerons;
const igBProfundorNome = igBProfundor;

export const pecasB: Pecas = {igBDevagar, igBFlaps, igBFlapsNome, igBSobe, igBVirar, igBAilerons, igBAileronsNome, igBProfundor, igBProfundorNome};

// ---------------------------------------------------------------- cenas do bloco B
type Som = NonNullable<Cena['som']>;
type Base = {nome: string; de: number; ate: number; dados: Record<string, number>; marcos: number[]; som: Som | null; sons: {em: number; som: Som; ganho?: number}[]};
// Divide uma cena em partes contínuas (a animação segue sem corte: cada parte recebe a origem da cena inteira); cada
// parte leva só os marcos e os sons que caem dentro dela.
const dividir = (c: Base, cortes: {em: number; nome?: string}[] = []): Cena[] => {
	const lim = [c.de, ...cortes.map((x) => x.em), c.ate];
	return lim.slice(0, -1).map((de, i) => {
		const ate = lim[i + 1];
		return {
			tipo: 'peca',
			nome: i === 0 ? c.nome : (cortes[i - 1].nome ?? c.nome),
			modo: 'cheia',
			de,
			ate,
			dados: {...c.dados, origem: c.de, marcos: c.marcos.filter((t) => t > de && t < ate)},
			som: i === 0 ? c.som : null,
			sons: c.sons.filter((x) => x.em >= de && x.em < ate),
		};
	});
};

export const cenasB = (b: Busca): Cena[] => {
	const inicio = b.say('Só que na decolagem').inicio;
	const fimBloco = b.say('Lá em cima').inicio;
	const [, , , decolagem, , , , , devagar] = b.tempos('Só que na decolagem o avião ainda está devagar');
	const [eAsa, , asa, sozinha, , segura, , peso] = b.tempos('e a asa sozinha não segura tanto peso');
	const c1 = {decolagem, devagar, asa, sozinha, segura, peso};

	const iniFlaps = b.say('Então ela estica').inicio;
	const [, , estica, , tras, , , baixo] = b.tempos('Então ela estica pra trás e pra baixo');
	const [ficando, maior, , , curvada] = b.tempos('ficando maior e mais curvada');
	const c2 = {estica, tras, baixo, ficando, maior, curvada, rotulo: b.say('são os flaps').inicio};

	const iniSobe = b.say('Agora ele sobe').inicio;
	const [, ele, sobe] = b.tempos('Agora ele sobe');
	const c3 = {ele, sobe};

	const iniVirar = b.say('Mas como você faz').inicio;
	const c4 = {bicho: b.at('bicho'), virar: b.at('virar')};

	const iniAil = b.say('Perto da ponta').inicio;
	const c5 = {
		ponta: b.at('ponta'),
		sobe: b.tempos('uma peça sobe')[2],
		desce: b.at('desce'),
		inclina: b.say('o avião inclina').inicio,
		rotulo: b.say('são os ailerons').inicio,
	};

	const iniProf = b.say('E na cauda').inicio;
	const [, , cauda] = b.tempos('E na cauda');
	const [aponta, , , , cima, , , baixo2] = b.tempos('aponta o nariz pra cima ou pra baixo');
	const c6 = {cauda, aponta, cima, baixo: baixo2, rotulo: b.say('é o profundor').inicio};

	return [
		// 1. Pista, devagar (velocímetro baixo); câmera vai para a asa: seta azul pequena × setas vermelhas de peso
		...dividir({nome: 'igBDevagar', de: inicio, ate: iniFlaps, dados: c1, marcos: Object.values(c1), som: 'pro_whoosh', sons: [{em: segura, som: 'pro_pop', ganho: 0.6}]}, [{em: eAsa}]),
		// 2. Close na asa por trás: flaps saem para trás e para baixo; corte da asa ficando maior e curvada; rótulo FLAPS
		...dividir(
			{
				nome: 'igBFlaps',
				de: iniFlaps,
				ate: iniSobe,
				dados: c2,
				marcos: Object.values(c2),
				som: 'pro_whoosh_curto',
				sons: [
					{em: ficando, som: 'pro_tick', ganho: 0.6},
					{em: c2.rotulo, som: 'pro_pop', ganho: 0.8},
				],
			},
			[{em: ficando}, {em: b.say('Esses são os flaps').inicio, nome: 'igBFlapsNome'}],
		),
		// 3. Decolagem vista da pista: nariz sobe, sai do chão, recolhe o trem
		...dividir({nome: 'igBSobe', de: iniSobe, ate: iniVirar, dados: c3, marcos: Object.values(c3), som: null, sons: [{em: iniSobe, som: 'pro_aviao', ganho: 0.7}]}),
		// 4. No céu: câmera embaixo (bicho enorme) e depois do alto, com a seta curva da curva
		...dividir({nome: 'igBVirar', de: iniVirar, ate: iniAil, dados: c4, marcos: Object.values(c4), som: 'pro_whoosh', sons: [{em: c4.virar, som: 'pro_swipe', ganho: 0.6}]}),
		// 5. Por trás: aileron direito sobe, esquerdo desce, o avião inclina; rótulo AILERONS
		...dividir(
			{
				nome: 'igBAilerons',
				de: iniAil,
				ate: iniProf,
				dados: c5,
				marcos: Object.values(c5),
				som: 'pro_whoosh_curto',
				sons: [
					{em: c5.sobe, som: 'pro_tick', ganho: 0.6},
					{em: c5.inclina, som: 'pro_whoosh', ganho: 0.6},
					{em: c5.rotulo, som: 'pro_pop', ganho: 0.8},
				],
			},
			[{em: c5.desce}, {em: b.say('Esses são os ailerons').inicio, nome: 'igBAileronsNome'}],
		),
		// 6. Cauda: profundor sobe/desce e o nariz aponta para cima/baixo; rótulo PROFUNDOR
		...dividir(
			{
				nome: 'igBProfundor',
				de: iniProf,
				ate: fimBloco,
				dados: c6,
				marcos: Object.values(c6),
				som: 'pro_whoosh_curto',
				sons: [
					{em: cima, som: 'pro_swipe', ganho: 0.6},
					{em: c6.rotulo, som: 'pro_pop', ganho: 0.8},
				],
			},
			[{em: aponta}, {em: b.say('Esse é o profundor').inicio, nome: 'igBProfundorNome'}],
		),
	];
};
