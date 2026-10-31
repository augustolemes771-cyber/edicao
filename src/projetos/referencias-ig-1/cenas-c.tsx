// Cenas do bloco C do referencias-ig-1 (peças + a lista de cenas que entram no edit.ts).
// Do "Lá em cima" até o fim: altitude e frio, ar fino, cabine pressurizada, descida (turbinas, flaps, spoilers), pouso
// (toque, amortecedor de óleo e gás, trem de pouso), o lanche pequeno e o cartão final "SEGUE O PERFIL".
// Estilo das referências: 3D low-poly com cores chapadas, câmera sempre andando, rótulo amarelo no nome da peça.
import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring} from 'remotion';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import type {Busca} from '../../motor/palavras';
import type {Cena} from '../../motor/plano';
import type {CenaPeca, Peca, Pecas} from '../../pecas/peca';
import {poppins} from '../../motor/tema';
import {Aviao, Chao, COR, lim, Nuvem, Palco, Rotulo, trilha, useMateriais, useQ, type Materiais, type PoseAviao} from './aviao';

type V3 = [number, number, number];
const CEU_ALTO: [string, string] = ['#1d4b98', '#8cc0ec'];
const CEU_MUITO_ALTO: [string, string] = ['#142f6b', '#6fa6dd'];
const FONTE = poppins;
// Altura do avião parado na pista (rodas do trem no chão da pista, y = -1,58).
const Y_PISTA = -1.58 + 0.55 + 0.9 + 0.22;

// Número pseudoaleatório fixo (o mesmo em todo quadro).
const rnd = (i: number, s = 0) => {
	const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
	return x - Math.floor(x);
};
const milhar = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const misturar = (base: string, alvo: string, k: number) =>
	'#' + new THREE.Color(base).lerp(new THREE.Color(alvo), Math.max(0, Math.min(1, k))).getHexString();

const useCena = (cena: CenaPeca) => {
	const {frame, fps, q} = useQ(cena.de);
	const fim = Math.round((cena.ate - cena.de) * fps);
	const d = (cena.dados ?? {}) as Record<string, number>;
	const mola = (de: number, rigidez = 170, amortece = 14) => spring({frame: frame - de, fps, config: {damping: amortece, stiffness: rigidez}});
	const vai = (a: number, b: number, easing = Easing.inOut(Easing.cubic)) => interpolate(frame, [a, b], [0, 1], {...lim, easing});
	return {frame, fps, q, fim, d, mola, vai};
};

// Câmera posta a cada quadro (posição, fov e para onde olha).
const Cam: React.FC<{pos: V3; alvo: V3; fov?: number}> = ({pos, alvo, fov = 40}) => {
	const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
	camera.position.set(pos[0], pos[1], pos[2]);
	camera.fov = fov;
	camera.updateProjectionMatrix();
	camera.lookAt(alvo[0], alvo[1], alvo[2]);
	return null;
};

const Cena3D: React.FC<{pos: V3; alvo: V3; fov?: number; ceu?: [string, string]; children: React.ReactNode}> = ({pos, alvo, fov = 40, ceu, children}) => (
	<Palco camera={pos} alvo={alvo} fov={fov} ceu={ceu}>
		<Cam pos={pos} alvo={alvo} fov={fov} />
		{children}
	</Palco>
);

// Tremor de câmera que some em `dur` quadros a partir de `de`.
const tremor = (frame: number, de: number, forca = 0.25, dur = 12): V3 => {
	const k = frame < de ? 0 : Math.max(0, 1 - (frame - de) / dur);
	return [Math.sin(frame * 2.7) * forca * k, Math.cos(frame * 3.3) * forca * k, Math.sin(frame * 1.9) * forca * 0.5 * k];
};
const somar = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

// Camada de nuvens que anda para trás (−x) com `desloc`.
const Nuvens: React.FC<{m: Materiais; y: number; desloc: number; n?: number; semente?: number; z?: [number, number]}> = ({m, y, desloc, n = 16, semente = 0, z = [-30, 12]}) => {
	const vao = 90;
	return (
		<group>
			{Array.from({length: n}).map((_, i) => {
				const x0 = rnd(i, 1 + semente) * vao;
				const x = ((((x0 - desloc) % vao) + vao) % vao) - vao / 2;
				const zz = z[0] + rnd(i, 2 + semente) * (z[1] - z[0]);
				return <Nuvem key={i} m={m} position={[x, y + rnd(i, 3 + semente) * 1.6, zz]} escala={1.4 + rnd(i, 4 + semente) * 2.2} />;
			})}
		</group>
	);
};

// Cartão branco de informação (altímetro, termômetro, força...).
const Painel: React.FC<{y: number; p: number; children: React.ReactNode}> = ({y, p, children}) => (
	<div style={{position: 'absolute', top: y, left: 0, width: '100%', display: 'flex', justifyContent: 'center', opacity: Math.min(1, p * 1.6), transform: `scale(${0.6 + 0.4 * p})`}}>
		<div
			style={{
				background: '#ffffff',
				borderRadius: 38,
				padding: '18px 42px',
				boxShadow: '0 14px 34px rgba(0,0,0,0.28)',
				fontFamily: FONTE,
				color: '#1d2430',
				display: 'flex',
				alignItems: 'center',
				gap: 26,
			}}
		>
			{children}
		</div>
	</div>
);
const Rotinho: React.FC<{texto: string}> = ({texto}) => <div style={{fontWeight: 800, fontSize: 30, letterSpacing: '0.12em', color: '#6c7480'}}>{texto}</div>;
const Barra: React.FC<{v: number; cor: string; largura?: number}> = ({v, cor, largura = 360}) => (
	<div style={{width: largura, height: 30, borderRadius: 15, background: '#e3e7ee', overflow: 'hidden'}}>
		<div style={{width: `${Math.max(0, Math.min(1, v)) * 100}%`, height: '100%', background: cor, borderRadius: 15}} />
	</div>
);

// Chip pequeno com texto (ÓLEO, GÁS) em posição de tela.
const Chip: React.FC<{texto: string; x: number; y: number; p: number; cor: string; corTexto?: string}> = ({texto, x, y, p, cor, corTexto = '#1d1d1d'}) => (
	<div
		style={{
			position: 'absolute',
			left: x,
			top: y,
			opacity: Math.min(1, p * 1.6),
			transform: `scale(${0.5 + 0.5 * p})`,
			transformOrigin: 'left center',
			padding: '8px 26px',
			borderRadius: 30,
			background: cor,
			color: corTexto,
			fontFamily: FONTE,
			fontWeight: 900,
			fontSize: 44,
			letterSpacing: '0.05em',
			boxShadow: '0 10px 24px rgba(0,0,0,0.25)',
		}}
	>
		{texto}
	</div>
);

// ---------------------------------------------------------------- gente low-poly
type Expr = {boca?: number; bravo?: number; azul?: number; vermelho?: number; olho?: number};
const PELE = '#f1c09a';
const corPele = (e: Expr) => misturar(misturar(PELE, '#9cc3ea', (e.azul ?? 0) * 0.85), '#e8735c', (e.vermelho ?? 0) * 0.6);

const Mat: React.FC<{cor: string; opacidade?: number; brilho?: number}> = ({cor, opacidade, brilho}) => (
	<meshStandardMaterial
		color={cor}
		flatShading
		roughness={0.8}
		transparent={opacidade !== undefined}
		opacity={opacidade ?? 1}
		emissive={brilho ? cor : '#000000'}
		emissiveIntensity={brilho ?? 0}
	/>
);

// Cilindro entre dois pontos (braço, perna).
const Membro: React.FC<{a: V3; b: V3; r: number; cor: string}> = ({a, b, r, cor}) => {
	const va = new THREE.Vector3(...a);
	const vb = new THREE.Vector3(...b);
	const dir = vb.clone().sub(va);
	const len = Math.max(0.001, dir.length());
	const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
	const meio = va.add(vb).multiplyScalar(0.5);
	return (
		<mesh position={[meio.x, meio.y, meio.z]} quaternion={quat}>
			<cylinderGeometry args={[r, r * 0.9, len, 7]} />
			<Mat cor={cor} />
		</mesh>
	);
};

// Cabeça olhando para +z (raio ~0,75).
const Cabeca: React.FC<{expr: Expr; cabelo?: string}> = ({expr, cabelo = '#3b2a20'}) => {
	const boca = expr.boca ?? 0;
	const bravo = expr.bravo ?? 0;
	const olho = expr.olho ?? 1;
	const pele = corPele(expr);
	return (
		<group>
			<mesh scale={[0.92, 1, 0.9]}>
				<icosahedronGeometry args={[0.75, 1]} />
				<Mat cor={pele} />
			</mesh>
			<mesh position={[0, 0.1, -0.08]} rotation={[-0.45, 0, 0]} scale={[0.98, 0.92, 0.98]}>
				<sphereGeometry args={[0.78, 8, 5, 0, Math.PI * 2, 0, 1.3]} />
				<Mat cor={cabelo} />
			</mesh>
			{[-1, 1].map((l) => (
				<group key={l}>
					<mesh position={[l * 0.7, -0.02, 0]}>
						<icosahedronGeometry args={[0.15, 0]} />
						<Mat cor={pele} />
					</mesh>
					<mesh position={[l * 0.25, 0.06, 0.6]} scale={[1, olho, 1]}>
						<sphereGeometry args={[0.13, 8, 6]} />
						<Mat cor="#ffffff" />
					</mesh>
					<mesh position={[l * 0.25, 0.06, 0.71]} scale={[1, Math.min(1, olho), 1]}>
						<sphereGeometry args={[0.065, 6, 5]} />
						<Mat cor="#1b1b1f" />
					</mesh>
					<mesh position={[l * 0.26, 0.29 + 0.04 * (olho - 1) - 0.05 * bravo, 0.66]} rotation={[0, 0, l * bravo * 0.55]}>
						<boxGeometry args={[0.27, 0.065, 0.08]} />
						<Mat cor={cabelo} />
					</mesh>
				</group>
			))}
			<mesh position={[0, -0.1, 0.68]} rotation={[Math.PI / 2, 0, 0]}>
				<coneGeometry args={[0.09, 0.22, 5]} />
				<Mat cor={misturar(pele, '#c98a6a', 0.3)} />
			</mesh>
			<mesh position={[0, -0.36, 0.6]}>
				<boxGeometry args={[0.32 - boca * 0.08, 0.05 + boca * 0.22, 0.1]} />
				<Mat cor="#6b1f2a" />
			</mesh>
		</group>
	);
};

// Busto (cabeça em y=0, ombros em y≈-1,2). maos: posição das mãos (null = braços para baixo).
const Busto: React.FC<{expr: Expr; camisa: string; cabelo?: string; maoE?: V3; maoD?: V3; cotoveloE?: V3; cotoveloD?: V3}> = ({expr, camisa, cabelo, maoE, maoD, cotoveloE, cotoveloD}) => {
	const pele = corPele(expr);
	const braco = (l: 1 | -1, mao?: V3, cot?: V3) => {
		const ombro: V3 = [l * 0.95, -1.3, 0];
		const c: V3 = cot ?? [l * 1.15, -2.0, 0.15];
		const h: V3 = mao ?? [l * 1.1, -2.7, 0.35];
		return (
			<group key={l}>
				<Membro a={ombro} b={c} r={0.22} cor={camisa} />
				<Membro a={c} b={h} r={0.17} cor={pele} />
				<mesh position={h}>
					<icosahedronGeometry args={[0.19, 0]} />
					<Mat cor={pele} />
				</mesh>
			</group>
		);
	};
	return (
		<group>
			<Cabeca expr={expr} cabelo={cabelo} />
			<mesh position={[0, -0.85, 0]}>
				<cylinderGeometry args={[0.24, 0.28, 0.5, 7]} />
				<Mat cor={pele} />
			</mesh>
			<mesh position={[0, -1.95, 0]}>
				<cylinderGeometry args={[0.85, 1.1, 1.7, 8]} />
				<Mat cor={camisa} />
			</mesh>
			{braco(-1, maoE, cotoveloE)}
			{braco(1, maoD, cotoveloD)}
		</group>
	);
};

// Passageiro pequeno sentado (cabine em corte).
const Passageiro: React.FC<{camisa: string; cabelo: string}> = ({camisa, cabelo}) => (
	<group>
		<mesh position={[0, 0.05, 0]}>
			<boxGeometry args={[0.32, 0.5, 0.4]} />
			<Mat cor={camisa} />
		</mesh>
		<mesh position={[0.02, 0.48, 0]}>
			<icosahedronGeometry args={[0.18, 0]} />
			<Mat cor={PELE} />
		</mesh>
		<mesh position={[-0.03, 0.56, 0]}>
			<icosahedronGeometry args={[0.16, 0]} />
			<Mat cor={cabelo} />
		</mesh>
	</group>
);

// ---------------------------------------------------------------- 1. 11 mil metros (altímetro)
// dados: {mil}
const igCAltitude: Peca = ({cena}) => {
	const {frame, fim, q, d, mola} = useCena(cena);
	const m = useMateriais();
	const mil = q(d.mil);
	const cam = trilha(frame, [
		[0, [17, -3, 22]],
		[fim, [12, 3.5, 24]],
	]);
	const nuvY = interpolate(frame, [0, fim], [-1.5, -10], lim);
	const alt = Math.round(interpolate(frame, [0, mil + 16], [7000, 11000], {...lim, easing: Easing.out(Easing.cubic)}) / 100) * 100;
	const pulso = mola(mil, 260, 9);
	const pCard = mola(2);
	return (
		<AbsoluteFill>
			<Cena3D pos={cam} alvo={[0, 0.6, 0]} ceu={CEU_ALTO}>
				<group position={[0, Math.sin(frame / 14) * 0.15, 0]} rotation={[0.06, -0.2, 0.08]}>
					<Aviao m={m} pose={{trem: 0, giroTurbina: frame * 0.9}} />
				</group>
				<Nuvens m={m} y={nuvY} desloc={frame * 0.45} n={18} />
				<Nuvens m={m} y={nuvY - 5} desloc={frame * 0.45} n={14} semente={7} />
				<Nuvens m={m} y={nuvY + 7} desloc={frame * 0.6} n={8} semente={13} z={[-40, -15]} />
			</Cena3D>
			<Painel y={300} p={pCard}>
				<div style={{width: 92, height: 92, borderRadius: 46, background: COR.azul, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 50, fontWeight: 900}}>▲</div>
				<div>
					<Rotinho texto="ALTITUDE" />
					<div style={{fontWeight: 900, fontSize: 86, lineHeight: 1, transform: `scale(${1 + 0.12 * Math.sin(Math.min(1, pulso) * Math.PI)})`, transformOrigin: 'left center'}}>
						{milhar(alt)} m
					</div>
				</div>
			</Painel>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 2. quase −60 °C (termômetro e gelo)
// dados: {frio, negativos}
const Termometro: React.FC<{nivel: number; corLiquido: string; gelo: number}> = ({nivel, corLiquido, gelo}) => {
	const h = 0.15 + nivel * 4.1;
	return (
		<group>
			{/* placa */}
			<mesh position={[0, 0.35, -0.35]}>
				<boxGeometry args={[1.9, 6.6, 0.3]} />
				<Mat cor="#f5f7fa" />
			</mesh>
			{Array.from({length: 9}).map((_, i) => (
				<mesh key={i} position={[0.62, -1.9 + i * 0.5, -0.17]}>
					<boxGeometry args={[i % 2 ? 0.25 : 0.42, 0.07, 0.05]} />
					<Mat cor="#6c7480" />
				</mesh>
			))}
			{/* tubo de vidro */}
			<mesh position={[0, 0.25, 0]}>
				<cylinderGeometry args={[0.32, 0.32, 4.9, 12]} />
				<meshStandardMaterial color="#dff3ff" transparent opacity={0.45} roughness={0.2} flatShading />
			</mesh>
			<mesh position={[0, 2.7, 0]}>
				<sphereGeometry args={[0.32, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
				<meshStandardMaterial color="#dff3ff" transparent opacity={0.45} roughness={0.2} flatShading />
			</mesh>
			{/* líquido */}
			<mesh position={[0, -2.25 + h / 2, 0]}>
				<cylinderGeometry args={[0.19, 0.19, h, 10]} />
				<Mat cor={corLiquido} brilho={0.25} />
			</mesh>
			<mesh position={[0, -2.6, 0]}>
				<icosahedronGeometry args={[0.66, 1]} />
				<Mat cor={corLiquido} brilho={0.2} />
			</mesh>
			{/* gelo crescendo na placa e no tubo */}
			{Array.from({length: 14}).map((_, i) => {
				const s = Math.max(0, Math.min(1, gelo * 1.6 - i * 0.045)) * (0.25 + rnd(i, 5) * 0.3);
				const lado = i % 2 ? 1 : -1;
				const y = 3.4 - rnd(i, 6) * 5.6;
				return (
					<mesh key={i} position={[lado * (0.75 + rnd(i, 7) * 0.3), y, -0.1 + rnd(i, 8) * 0.2]} rotation={[rnd(i, 9) * 3, rnd(i, 10) * 3, 0]} scale={[s, s * 1.5, s]}>
						<octahedronGeometry args={[1, 0]} />
						<meshStandardMaterial color="#cdeeff" flatShading roughness={0.3} transparent opacity={0.92} />
					</mesh>
				);
			})}
			{/* pingentes de gelo no topo da placa */}
			{Array.from({length: 6}).map((_, i) => {
				const s = Math.max(0, Math.min(1, gelo * 1.8 - i * 0.08));
				return (
					<mesh key={i} position={[-0.75 + i * 0.3, 3.55 - 0.4 * s, -0.2]} rotation={[Math.PI, 0, 0]} scale={[1, s, 1]}>
						<coneGeometry args={[0.1, 0.8, 5]} />
						<meshStandardMaterial color="#cdeeff" flatShading roughness={0.3} />
					</mesh>
				);
			})}
		</group>
	);
};

const Neve: React.FC<{frame: number; n?: number; aparece: number}> = ({frame, n = 50, aparece}) => (
	<group>
		{Array.from({length: n}).map((_, i) => {
			const y = 7 - ((((frame * (0.04 + rnd(i, 1) * 0.04) + rnd(i, 2) * 14) % 14) + 14) % 14);
			const x = (rnd(i, 3) - 0.5) * 12 + Math.sin(frame / 20 + i) * 0.3;
			const z = (rnd(i, 4) - 0.5) * 8;
			const s = 0.07 + rnd(i, 5) * 0.07;
			return (
				<mesh key={i} position={[x, y, z]} rotation={[frame * 0.05 + i, i, 0]} scale={s * aparece}>
					<octahedronGeometry args={[1, 0]} />
					<meshBasicMaterial color="#ffffff" />
				</mesh>
			);
		})}
	</group>
);

const igCFrio: Peca = ({cena}) => {
	const {frame, fim, q, d, mola, vai} = useCena(cena);
	const m = useMateriais();
	const frio = q(d.frio);
	const neg = q(d.negativos);
	const cai = vai(frio + 2, neg + 6);
	const temp = Math.round(interpolate(cai, [0, 1], [15, -60]));
	const gelo = vai(neg - 4, neg + 20, Easing.out(Easing.cubic));
	const ang = interpolate(frame, [0, fim], [-0.45, 0.35]);
	const raio = interpolate(frame, [0, fim], [15.5, 14]);
	const cam: V3 = [Math.sin(ang) * raio, 1.2, Math.cos(ang) * raio];
	const entra = mola(0, 150, 13);
	const corLiq = misturar(COR.vermelho, '#3d8bff', cai);
	return (
		<AbsoluteFill>
			<Cena3D pos={cam} alvo={[0, 1.0, 0]} ceu={CEU_MUITO_ALTO}>
				<group position={[0, 0.8 - (1 - entra) * 6, 0]} rotation={[0, 0, 0.1 * Math.sin(frame / 25)]} scale={0.82}>
					<Termometro nivel={1 - cai * 0.88} corLiquido={corLiq} gelo={gelo} />
				</group>
				<group position={[interpolate(frame, [0, fim], [-24, 14]), -2.5, -22]} rotation={[0, 0, 0.04]}>
					<Aviao m={m} pose={{trem: 0, giroTurbina: frame}} />
				</group>
				<Nuvens m={m} y={-9} desloc={frame * 0.3} n={18} semente={3} z={[-35, 5]} />
				<Neve frame={frame} aparece={vai(frio, frio + 15)} />
			</Cena3D>
			<Painel y={300} p={mola(frio, 220)}>
				<div style={{fontSize: 60}}>🌡</div>
				<div style={{fontWeight: 900, fontSize: 92, lineHeight: 1, color: misturar('#e5484d', '#2f6fd6', cai)}}>
					{temp < 0 ? '−' : ''}
					{Math.abs(temp)} °C
				</div>
			</Painel>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 3. ar fino: não dá para respirar
// dados: {ar, fino, respirar}
const igCArFino: Peca = ({cena}) => {
	const {frame, fim, q, d, mola, vai} = useCena(cena);
	const m = useMateriais();
	const ar = q(d.ar);
	const fino = q(d.fino);
	const resp = q(d.respirar);
	const sufoco = vai(resp - 8, resp + 12);
	const cam = trilha(frame, [
		[0, [2.2, 0.7, 7.4]],
		[fim, [-1.2, 0.2, 6.0]],
	]);
	const treme = Math.sin(frame * 1.9) * 0.035 * sufoco;
	const boca = interpolate(sufoco, [0, 1], [0.05, 0.55]) + sufoco * 0.4 * Math.abs(Math.sin(frame / 4));
	const maos = vai(resp - 4, resp + 10);
	const maoD: V3 = [interpolate(maos, [0, 1], [1.1, 0.3]), interpolate(maos, [0, 1], [-2.7, -0.95]), interpolate(maos, [0, 1], [0.35, 0.45])];
	const maoE: V3 = [-maoD[0], maoD[1], maoD[2]];
	const cotD: V3 = [interpolate(maos, [0, 1], [1.15, 1.05]), interpolate(maos, [0, 1], [-2.0, -1.9]), interpolate(maos, [0, 1], [0.15, 0.75])];
	const cotE: V3 = [-cotD[0], cotD[1], cotD[2]];
	const oxi = interpolate(frame, [fino, fino + 25, resp, resp + 15], [1, 0.35, 0.35, 0.12], lim);
	return (
		<AbsoluteFill>
			<Cena3D pos={cam} alvo={[0, -0.45, 0]} ceu={CEU_MUITO_ALTO}>
				<group position={[treme, -0.1 + (1 - mola(0, 160, 14)) * -3, 0]}>
					<Busto expr={{boca, azul: sufoco, olho: 1 + sufoco * 0.35}} camisa={COR.vermelho} maoD={maoD} maoE={maoE} cotoveloD={cotD} cotoveloE={cotE} />
				</group>
				{/* moléculas de ar: aparecem no "ar" e quase todas fogem no "fino" */}
				{Array.from({length: 80}).map((_, i) => {
					const base: V3 = [(rnd(i, 1) - 0.5) * 7, (rnd(i, 2) - 0.5) * 7 - 0.3, (rnd(i, 3) - 0.5) * 5 - 0.8];
					if (Math.hypot(base[0], base[1] + 0.8, base[2]) < 1.5) base[0] += base[0] < 0 ? -1.4 : 1.4;
					const fica = i % 10 === 0;
					const foge = fica ? 0 : vai(fino + (i % 8), fino + 18 + (i % 8), Easing.in(Easing.quad));
					const dir = new THREE.Vector3(base[0], base[1] + 0.5, base[2]).normalize();
					const s = (0.07 + rnd(i, 4) * 0.06) * mola(ar - 4 + (i % 9), 200) * (1 - foge);
					if (s <= 0.002) return null;
					return (
						<mesh
							key={i}
							material={m.ar}
							position={[base[0] + dir.x * foge * 7 + Math.sin(frame / 18 + i) * 0.12, base[1] + dir.y * foge * 7 + Math.cos(frame / 22 + i) * 0.12, base[2] + dir.z * foge * 7]}
							scale={s}
						>
							<icosahedronGeometry args={[1, 0]} />
						</mesh>
					);
				})}
				<Nuvens m={m} y={-8} desloc={frame * 0.2} n={14} semente={5} z={[-30, -8]} />
			</Cena3D>
			<Painel y={300} p={mola(fino - 4, 220)}>
				<div>
					<Rotinho texto="OXIGÊNIO NO AR" />
					<div style={{marginTop: 8}}>
						<Barra v={oxi} cor={oxi < 0.3 ? COR.vermelho : '#3cb371'} largura={420} />
					</div>
				</div>
			</Painel>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 4. cabine em corte cheia de ar quente: PRESSURIZAÇÃO
// dados: {cabine, aquecido, pressao, nome}
const R_CAB = 2.2;
const L_CAB = 13;
const CAMISAS = [COR.vermelho, COR.azul, '#3cb371', COR.amarelo, '#8e5bd6', COR.laranja];
const CABELOS = ['#3b2a20', '#1f1f22', '#a0652f', '#e3c27a'];

const igCCabine: Peca = ({cena}) => {
	const {frame, fim, q, d, mola, vai} = useCena(cena);
	const m = useMateriais();
	const cab = q(d.cabine);
	const aq = q(d.aquecido);
	const pre = q(d.pressao);
	const nome = q(d.nome);
	const abre = vai(cab - 8, cab + 10);
	const enche = vai(aq - 4, aq + 40, Easing.out(Easing.quad));
	const pressao = mola(pre, 200, 10);
	const infla = 1 + 0.035 * Math.sin(Math.min(1, pressao) * Math.PI) + (frame > pre ? 0.012 * Math.sin((frame - pre) / 4) * Math.exp(-(frame - pre) / 30) : 0);
	const cam = trilha(frame, [
		[0, [10, 4.5, 14]],
		[cab + 12, [7.5, 3.2, 9.5]],
		[fim, [5.0, 2.4, 8.2]],
	]);
	const alvo = trilha(frame, [
		[0, [0, 0, 0]],
		[fim, [-1.5, -0.1, 0]],
	]);
	const corCasco = (opac?: number) => <meshStandardMaterial color="#f5f7fa" flatShading roughness={0.75} side={THREE.DoubleSide} transparent={opac !== undefined} opacity={opac ?? 1} />;
	const linhas = Array.from({length: 9}).map((_, i) => 4.6 - i * 1.15);
	return (
		<AbsoluteFill>
			<Cena3D pos={cam} alvo={alvo} ceu={CEU_ALTO}>
				<group scale={[1, infla, infla]}>
					{/* metade de trás do casco (vista por dentro) */}
					<mesh rotation={[0, 0, Math.PI / 2]}>
						<cylinderGeometry args={[R_CAB, R_CAB, L_CAB, 22, 1, true, Math.PI / 2, Math.PI]} />
						{corCasco()}
					</mesh>
					<mesh rotation={[0, 0, Math.PI / 2]} scale={[0.97, 1, 0.97]}>
						<cylinderGeometry args={[R_CAB, R_CAB, L_CAB, 22, 1, true, Math.PI / 2, Math.PI]} />
						<meshStandardMaterial color="#e8dfd0" flatShading side={THREE.BackSide} />
					</mesh>
					{/* faixa azul do lado de fora (borda do corte) */}
					<mesh position={[0, -0.9, 0.02]} rotation={[0, 0, 0]}>
						<boxGeometry args={[L_CAB, 0.12, 0.05]} />
						<Mat cor={COR.azul} />
					</mesh>
					{/* metade da frente: sobe e some no "cabine" */}
					{abre < 1 ? (
						<mesh rotation={[0, 0, Math.PI / 2]} position={[0, abre * 4, abre * 3]}>
							<cylinderGeometry args={[R_CAB, R_CAB, L_CAB, 22, 1, true, -Math.PI / 2, Math.PI]} />
							{corCasco(1 - abre)}
						</mesh>
					) : null}
					{/* nariz e cauda */}
					<mesh rotation={[0, 0, -Math.PI / 2]} position={[L_CAB / 2 + 1.4, 0, 0]}>
						<coneGeometry args={[R_CAB, 2.8, 22]} />
						<Mat cor="#f5f7fa" />
					</mesh>
					<mesh rotation={[0, 0, Math.PI / 2]} position={[-L_CAB / 2 - 2, 0.35, 0]} scale={[1, 1, 0.8]}>
						<coneGeometry args={[R_CAB, 4, 22]} />
						<Mat cor="#f5f7fa" />
					</mesh>
					<mesh position={[-L_CAB / 2 - 2.2, 2.9, -0.0]} rotation={[0, 0, 0.45]}>
						<boxGeometry args={[2.6, 3.6, 0.2]} />
						<Mat cor={COR.azul} />
					</mesh>
					{/* piso e bagageiro */}
					<mesh position={[0, -0.95, 0]}>
						<boxGeometry args={[L_CAB, 0.12, 4.1]} />
						<Mat cor="#5f6b7a" />
					</mesh>
					<mesh position={[0, -0.88, 0]}>
						<boxGeometry args={[L_CAB, 0.02, 0.7]} />
						<Mat cor={COR.vermelho} />
					</mesh>
					{/* janelas na parede do fundo */}
					{linhas.map((x) => (
						<mesh key={x} position={[x, 0.55, -R_CAB * 0.9]} rotation={[0.35, 0, 0]}>
							<boxGeometry args={[0.45, 0.6, 0.1]} />
							<Mat cor="#7ec8f2" brilho={0.3} />
						</mesh>
					))}
					{/* dutos de ar no teto */}
					{[-1, 1].map((l) => (
						<mesh key={l} position={[0, 1.55, l * 0.95 - 0.2]}>
							<boxGeometry args={[L_CAB - 0.6, 0.22, 0.35]} />
							<Mat cor="#c9d0d9" />
						</mesh>
					))}
					{/* fileiras de poltronas com passageiros */}
					{linhas.map((x, r) =>
						[-1.45, -0.85, 0.85, 1.45].map((z, k) => (
							<group key={`${r}-${k}`} position={[x, -0.9, z]}>
								<mesh position={[0, 0.3, 0]}>
									<boxGeometry args={[0.55, 0.18, 0.52]} />
									<Mat cor={COR.azul} />
								</mesh>
								<mesh position={[-0.28, 0.75, 0]} rotation={[0, 0, 0.12]}>
									<boxGeometry args={[0.14, 0.95, 0.52]} />
									<Mat cor={COR.azul} />
								</mesh>
								{(r * 4 + k) % 5 !== 3 ? (
									<group position={[0, 0.55, 0]}>
										<Passageiro camisa={CAMISAS[(r * 3 + k) % CAMISAS.length]} cabelo={CABELOS[(r + k * 2) % CABELOS.length]} />
									</group>
								) : null}
							</group>
						)),
					)}
					{/* ar quente saindo dos dutos e enchendo a cabine */}
					{Array.from({length: 90}).map((_, i) => {
						const vida = 50;
						const t0 = aq - 6 + (i % 30) * 1.3;
						const t = frame - t0;
						if (t < 0) return null;
						const p = (t % vida) / vida;
						const x = (rnd(i, 1) - 0.5) * (L_CAB - 1.5) + Math.sin(frame / 15 + i) * 0.2;
						const z0 = (i % 2 ? 1 : -1) * 0.95 - 0.2;
						const y = 1.35 - p * 2.1;
						const z = z0 + (rnd(i, 2) - 0.5) * 2.6 * p;
						const s = (0.06 + rnd(i, 3) * 0.06) * Math.sin(p * Math.PI) * 1.4;
						return (
							<mesh key={i} material={m.arQuente} position={[x, y, z]} scale={s}>
								<icosahedronGeometry args={[1, 0]} />
							</mesh>
						);
					})}
					{/* volume de ar quente */}
					<mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0]} scale={[0.95, 1, 0.95]}>
						<cylinderGeometry args={[R_CAB, R_CAB, L_CAB - 0.2, 22, 1, false, Math.PI / 2, Math.PI]} />
						<meshBasicMaterial color={COR.laranja} transparent opacity={0.16 * enche} depthWrite={false} />
					</mesh>
					{/* setas de pressão empurrando as paredes */}
					{frame >= pre - 2
						? Array.from({length: 10}).map((_, i) => {
								const th = Math.PI * (0.62 + (i % 5) * 0.19);
								const x = -4.5 + Math.floor(i / 5) * 6 + (i % 2) * 1.2;
								const r = 1.25 + 0.25 * Math.sin(Math.min(1, pressao) * Math.PI) + 0.08 * Math.sin(frame / 3 + i);
								const s = Math.min(1, pressao) * 0.9;
								return (
									<group key={i} position={[x, Math.cos(th - Math.PI / 2) * r * -1 + 0.2, Math.sin(th - Math.PI / 2) * -r]} rotation={[th - Math.PI, 0, 0]} scale={s}>
										<mesh material={m.arQuente} position={[0, 0.25, 0]}>
											<coneGeometry args={[0.22, 0.4, 6]} />
										</mesh>
										<mesh material={m.arQuente}>
											<cylinderGeometry args={[0.08, 0.08, 0.4, 6]} />
										</mesh>
									</group>
								);
						  })
						: null}
					{enche > 0 ? <pointLight position={[0, 0.8, 0.5]} intensity={8 * enche} distance={10} color="#ffb070" /> : null}
				</group>
				<Nuvens m={m} y={-8} desloc={frame * 0.3} n={16} semente={9} z={[-35, 5]} />
			</Cena3D>
			<Rotulo texto="PRESSURIZAÇÃO" y={330} p={mola(nome - 3, 220, 12)} />
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 5. descida: turbinas perdem força, flaps abrem
// dados: {descer, turbinas, perdem, flaps}
const Escape: React.FC<{m: Materiais; frame: number; forca: number}> = ({m, frame, forca}) => (
	<group>
		{[1, -1].map((l) =>
			Array.from({length: 12}).map((_, i) => {
				const p = (((frame * (0.02 + 0.05 * forca) + i / 12) % 1) + 1) % 1;
				const s = (1 - p) * (0.08 + 0.14 * forca);
				return (
					<mesh key={`${l}-${i}`} material={m.ar} position={[0.1 - p * (1.5 + 4 * forca), -0.87 + Math.sin(i * 2.1) * 0.12 * p, l * 2.3 + Math.cos(i * 1.7) * 0.12 * p]} scale={[s * 2.2, s, s]}>
						<icosahedronGeometry args={[1, 0]} />
					</mesh>
				);
			}),
		)}
	</group>
);

const igCDescida: Peca = ({cena}) => {
	const {frame, fim, q, d, mola, vai} = useCena(cena);
	const m = useMateriais();
	const tur = q(d.turbinas);
	const perde = q(d.perdem);
	const flp = q(d.flaps);
	const vel = (f: number) => interpolate(f, [perde, perde + 30], [0.9, 0.12], lim);
	let giro = 0;
	for (let f = 0; f < frame; f++) giro += vel(f);
	const forca = interpolate(frame, [perde, perde + 25], [1, 0.25], lim);
	const flaps = vai(flp, flp + 22, Easing.out(Easing.back(1.4)));
	const cam = trilha(frame, [
		[0, [13, 4, 19]],
		[tur - 8, [11, 2.5, 15]],
		[tur + 8, [5.6, -0.3, 6.6]],
		[flp - 14, [5.0, -0.6, 7.2]],
		[flp + 6, [-6.5, 4.2, 9.5]],
		[fim, [-7.5, 3.6, 10.5]],
	]);
	const alvo = trilha(frame, [
		[0, [0, 0, 0]],
		[tur - 8, [0.5, -0.3, 1]],
		[tur + 8, [0.6, -0.9, 2.3]],
		[flp - 14, [0.6, -0.9, 2.3]],
		[flp + 6, [-1.2, -0.5, 2.6]],
		[fim, [-1.2, -0.5, 2.6]],
	]);
	const desce = vai(0, 20);
	return (
		<AbsoluteFill>
			<Cena3D pos={cam} alvo={alvo} ceu={CEU_ALTO}>
				<group rotation={[0, 0, -0.07 * desce]} position={[0, Math.sin(frame / 16) * 0.08, 0]}>
					<Aviao m={m} pose={{trem: 0, giroTurbina: giro, flaps: flp - 2 <= frame ? flaps : undefined}} />
					<Escape m={m} frame={frame} forca={forca} />
				</group>
				<Nuvens m={m} y={interpolate(frame, [0, fim], [-9, -2])} desloc={frame * 0.4} n={18} semente={2} />
				<Nuvens m={m} y={interpolate(frame, [0, fim], [-1, 6])} desloc={frame * 0.4} n={10} semente={11} z={[-40, -12]} />
			</Cena3D>
			<Painel y={300} p={mola(tur - 3, 220) * (1 - vai(flp - 6, flp + 2))}>
				<div>
					<Rotinho texto="FORÇA DAS TURBINAS" />
					<div style={{display: 'flex', alignItems: 'center', gap: 18, marginTop: 8}}>
						<Barra v={forca} cor={forca > 0.5 ? '#3cb371' : COR.laranja} largura={380} />
						<div style={{fontWeight: 900, fontSize: 52, width: 130}}>{Math.round(forca * 100)}%</div>
					</div>
				</div>
			</Painel>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 6. spoilers levantam e freiam no ar
// dados: {placas, levantam, frear, nome}
const igCSpoilers: Peca = ({cena}) => {
	const {frame, fim, q, d, mola} = useCena(cena);
	const m = useMateriais();
	const lev = q(d.levantam);
	const frear = q(d.frear);
	const nome = q(d.nome);
	const spo = Math.min(1.08, mola(lev - 3, 160, 11));
	const cam = somar(
		trilha(frame, [
			[0, [-5.5, 6.5, 9.5]],
			[lev + 10, [-5.0, 5.6, 8.0]],
			[fim, [-6.8, 4.6, 7.0]],
		]),
		tremor(frame, frear, 0.12, 14),
	);
	const fluxo = interpolate(frame, [frear - 10, frear], [0, 1], lim);
	const fuga = (z: number) => -1.2 - 0.8 * (z / 5.6) + 0.45;
	return (
		<AbsoluteFill>
			<Cena3D pos={cam} alvo={[-0.9, -0.3, 2.3]} ceu={CEU_ALTO}>
				<group rotation={[0, 0, -0.07]}>
					<Aviao m={m} pose={{trem: 0, giroTurbina: frame * 0.15, flaps: 1, spoiler: spo}} />
					{/* fluxo de ar por cima da asa, desviado pelos spoilers */}
					{fluxo > 0
						? Array.from({length: 26}).map((_, i) => {
								const z = 0.7 + (i % 13) * 0.22;
								const y0 = -0.02 + rnd(i, 1) * 0.25;
								const x = 4 - ((((frame * 0.22 + rnd(i, 2) * 9) % 9) + 9) % 9);
								const xs = fuga(z);
								const sobe = x < xs ? Math.min(1.6, (xs - x) * 0.9) * spo : 0;
								const ang = x < xs ? Math.atan(0.9 * spo) : 0;
								return (
									<mesh key={i} material={m.ar} position={[x, y0 + sobe, z]} rotation={[0, 0, -ang]} scale={[1, 1, fluxo]}>
										<boxGeometry args={[0.55, 0.04, 0.05]} />
									</mesh>
								);
						  })
						: null}
				</group>
				<Nuvens m={m} y={interpolate(frame, [0, fim], [-6, 1])} desloc={frame * interpolate(frame, [frear, frear + 20], [0.4, 0.22], lim)} n={18} semente={4} />
			</Cena3D>
			<Rotulo texto="SPOILERS" y={330} p={mola(nome - 3, 220, 12)} />
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 7. as 400 toneladas tocam o chão
// dados: {peso, tocam}
const Fumaca: React.FC<{frame: number; de: number; posicoes: V3[]; velChao: number}> = ({frame, de, posicoes, velChao}) => {
	if (frame < de) return null;
	return (
		<group>
			{posicoes.map((p, k) =>
				Array.from({length: 7}).map((_, i) => {
					const t = frame - de - i * 1.5;
					if (t < 0 || t > 34) return null;
					const k01 = t / 34;
					const s = 0.25 + k01 * 1.1;
					return (
						<mesh key={`${k}-${i}`} position={[p[0] - t * velChao * 0.5 - i * 0.2, p[1] + k01 * 0.8, p[2] + (rnd(i, k) - 0.5) * 0.6]} scale={s}>
							<icosahedronGeometry args={[1, 0]} />
							<meshStandardMaterial color="#eceef1" flatShading transparent opacity={0.85 * (1 - k01)} depthWrite={false} />
						</mesh>
					);
				}),
			)}
		</group>
	);
};

// Compressão do amortecedor depois do toque (0..1, oscila e assenta em ~0,35).
const compressaoToque = (frame: number, toque: number) =>
	frame < toque ? 0 : interpolate(frame - toque, [0, 3, 9, 15, 22, 30], [0, 1, 0.2, 0.6, 0.3, 0.35], lim);

const igCToque: Peca = ({cena}) => {
	const {frame, fim, q, d, mola, vai} = useCena(cena);
	const m = useMateriais();
	const peso = q(d.peso);
	const toque = q(d.tocam);
	const trem = vai(1, 14, Easing.out(Easing.cubic));
	const c = compressaoToque(frame, toque);
	const yAr = interpolate(frame, [0, toque], [4.2, Y_PISTA], {...lim, easing: Easing.bezier(0.3, 0.1, 0.55, 1)});
	const y = frame < toque ? yAr : Y_PISTA - 0.25 * c;
	const nariz = frame < toque ? interpolate(frame, [0, toque], [0.02, 0.09], lim) : interpolate(frame, [toque, toque + 22], [0.09, 0], {...lim, easing: Easing.in(Easing.quad)});
	const velChao = interpolate(frame, [toque, fim], [1.1, 0.75], lim);
	let desloc = 0;
	for (let f = 0; f < frame; f++) desloc += f < toque ? 1.1 : interpolate(f, [toque, fim], [1.1, 0.75], lim);
	const cam = somar(
		trilha(frame, [
			[0, [13, 3.5, 13]],
			[toque, [10, 0.4, 10.5]],
			[fim, [8.5, 0.1, 11.5]],
		]),
		tremor(frame, toque, 0.35, 14),
	);
	const alvo = trilha(frame, [
		[0, [0, 2.4, 0]],
		[toque, [0.5, -0.2, 0]],
		[fim, [0, -0.3, 0]],
	]);
	const pPeso = mola(peso - 2, 220, 11);
	return (
		<AbsoluteFill>
			<Cena3D pos={cam} alvo={alvo}>
				<group position={[0, y, 0]} rotation={[0, 0, nariz]}>
					<Aviao m={m} pose={{trem, compressao: c, giroTurbina: frame * 0.3}} />
				</group>
				<Chao m={m} deslocamento={desloc} />
				<Fumaca
					frame={frame}
					de={toque}
					velChao={velChao}
					posicoes={[
						[-0.6, -1.4, 1.1],
						[-0.6, -1.4, -0.7],
					]}
				/>
			</Cena3D>
			<Painel y={300} p={pPeso}>
				<div style={{width: 100, height: 82, background: '#2b2f36', clipPath: 'polygon(22% 0, 78% 0, 100% 100%, 0 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 30, paddingTop: 10}}>t</div>
				<div style={{fontWeight: 900, fontSize: 86, lineHeight: 1}}>400 t</div>
			</Painel>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 8. rodas e amortecedor de óleo e gás
// dados: {rodas, amortecedores, oleo, gas, impacto}
const igCAmortecedor: Peca = ({cena}) => {
	const {frame, fim, q, d, mola, vai} = useCena(cena);
	const m = useMateriais();
	const amort = q(d.amortecedores);
	const oleo = q(d.oleo);
	const gas = q(d.gas);
	const seg = q(d.seguram);
	const imp = q(d.impacto);
	const corte = vai(amort - 4, amort + 10);
	const nOleo = vai(oleo - 3, oleo + 12, Easing.out(Easing.cubic));
	const nGas = vai(gas - 3, gas + 10, Easing.out(Easing.cubic));
	// batida: o casco desce (comprime o gás) e volta com mola
	const batida = frame < seg ? 0 : interpolate(frame - seg, [0, 6, 12, 18, 25, 34], [0, 1, 0.15, 0.55, 0.2, 0.25], lim);
	const s = -batida * 0.85;
	const desloc = frame * interpolate(frame, [0, fim], [0.55, 0.4]);
	const giroRoda = -desloc / 0.9;
	const cam = somar(
		trilha(frame, [
			[0, [2.6, -0.6, 6.0]],
			[amort + 8, [3.4, 1.0, 8.6]],
			[fim, [2.2, 1.3, 9.2]],
		]),
		tremor(frame, seg + 2, 0.18, 14),
	);
	const alvo = trilha(frame, [
		[0, [0, -0.6, 0]],
		[amort + 8, [0, 0.9, 0]],
		[fim, [0, 1.0, 0]],
	]);
	const topo = 3.2 + s;
	const baseCasco = 0.4 + s;
	const pistao = 1.2;
	const yOleoTopo = pistao + 0.85 * nOleo;
	const hGas = Math.max(0.02, topo - 0.05 - (pistao + 0.85));
	const pinta = (cor: string, op: number) => <meshStandardMaterial color={cor} flatShading roughness={0.5} transparent={op < 1} opacity={op} depthWrite={op >= 1} />;
	return (
		<AbsoluteFill>
			<Cena3D pos={cam} alvo={alvo} fov={42}>
				{/* barriga do avião em cima */}
				<group position={[0, s, 0]}>
					<mesh position={[0, 4.3, 0]}>
						<boxGeometry args={[9, 1.2, 4]} />
						<Mat cor="#f5f7fa" />
					</mesh>
					<mesh position={[0, 3.62, 0]}>
						<boxGeometry args={[9.02, 0.18, 4.02]} />
						<Mat cor={COR.azul} />
					</mesh>
					<mesh position={[0, 3.35, 0]}>
						<boxGeometry args={[1.1, 0.4, 1.1]} />
						<Mat cor={COR.cinzaEscuro} />
					</mesh>
				</group>
				{/* casco do amortecedor (fica transparente no "amortecedores") */}
				<mesh position={[0, (topo + baseCasco) / 2, 0]}>
					<cylinderGeometry args={[0.5, 0.5, topo - baseCasco, 16]} />
					{pinta('#9aa3ad', 1 - corte * 0.72)}
				</mesh>
				{/* gás (em cima) e óleo (embaixo) dentro do casco */}
				{nGas > 0 ? (
					<mesh position={[0, pistao + 0.85 + hGas / 2, 0]} scale={[nGas, 1, nGas]}>
						<cylinderGeometry args={[0.43, 0.43, hGas, 16]} />
						<meshStandardMaterial color="#8fe0ff" flatShading emissive="#8fe0ff" emissiveIntensity={0.25 + 0.4 * batida} />
					</mesh>
				) : null}
				{nGas > 0
					? Array.from({length: 10}).map((_, i) => (
							<mesh key={i} position={[(rnd(i, 1) - 0.5) * 0.6, pistao + 0.95 + (((rnd(i, 2) + frame * 0.01 * (1 + batida * 4)) % 1) * (hGas - 0.15)), 0.3 + rnd(i, 3) * 0.15]} scale={0.05 * nGas}>
								<icosahedronGeometry args={[1, 0]} />
								<meshBasicMaterial color="#ffffff" />
							</mesh>
					  ))
					: null}
				{nOleo > 0 ? (
					<mesh position={[0, (pistao + yOleoTopo) / 2, 0]} scale={[0.98, 1, 0.98]}>
						<cylinderGeometry args={[0.44, 0.44, Math.max(0.01, yOleoTopo - pistao), 16]} />
						<meshStandardMaterial color="#f2a516" flatShading emissive="#f2a516" emissiveIntensity={0.3} />
					</mesh>
				) : null}
				{/* pistão cromado que sobe da roda */}
				<mesh position={[0, (pistao + -0.7) / 2, 0]}>
					<cylinderGeometry args={[0.3, 0.3, pistao + 0.7, 14]} />
					<meshStandardMaterial color="#e6eaef" flatShading metalness={0.5} roughness={0.25} />
				</mesh>
				<mesh position={[0, pistao, 0]}>
					<cylinderGeometry args={[0.44, 0.44, 0.08, 16]} />
					<Mat cor={COR.cinzaEscuro} />
				</mesh>
				{/* eixo e rodas */}
				<mesh position={[0, -0.7, 0]} rotation={[Math.PI / 2, 0, 0]}>
					<cylinderGeometry args={[0.16, 0.16, 2.2, 8]} />
					<Mat cor={COR.cinzaEscuro} />
				</mesh>
				{[-1, 1].map((l) => (
					<group key={l} position={[0, -0.7, l * 0.85]} rotation={[0, 0, giroRoda]}>
						<mesh rotation={[Math.PI / 2, 0, 0]}>
							<cylinderGeometry args={[0.9, 0.9, 0.55, 14]} />
							<Mat cor={COR.preto} />
						</mesh>
						<mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, l * 0.06]}>
							<cylinderGeometry args={[0.48, 0.48, 0.56, 8]} />
							<Mat cor={COR.cinza} />
						</mesh>
						{[0, 1, 2].map((k) => (
							<mesh key={k} position={[0, 0, l * 0.3]} rotation={[0, 0, (k * Math.PI) / 3]}>
								<boxGeometry args={[0.85, 0.09, 0.03]} />
								<Mat cor={COR.cinzaEscuro} />
							</mesh>
						))}
					</group>
				))}
				{/* seta do impacto */}
				{frame >= seg - 4 && frame < seg + 26 ? (
					<group position={[-1.8, 3.6 - Math.min(1, (frame - seg + 4) / 10) * 1.2, 0]} scale={Math.min(1, mola(seg - 4, 260)) * (1 - Math.max(0, (frame - seg - 16) / 10))}>
						<mesh material={m.vermelho} position={[0, -0.45, 0]} rotation={[Math.PI, 0, 0]}>
							<coneGeometry args={[0.38, 0.6, 6]} />
						</mesh>
						<mesh material={m.vermelho} position={[0, 0.15, 0]}>
							<boxGeometry args={[0.25, 0.8, 0.25]} />
						</mesh>
					</group>
				) : null}
				<Chao m={m} deslocamento={desloc} />
			</Cena3D>
			<Chip texto="GÁS" x={650} y={560} p={mola(gas - 2, 220, 12)} cor="#8fe0ff" />
			<Chip texto="ÓLEO" x={650} y={760} p={mola(oleo - 2, 220, 12)} cor="#f2a516" />
			<Rotulo texto="AMORTECEDOR" y={330} p={mola(amort - 2, 220, 12) * (1 - vai(fim - 8, fim))} tam={46} />
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 9. TREM DE POUSO
// dados: {nome}
const igCTrem: Peca = ({cena}) => {
	const {frame, fim, q, d, mola} = useCena(cena);
	const m = useMateriais();
	const nome = q(d.nome);
	const cam = trilha(frame, [
		[0, [9.5, -0.2, 8.5]],
		[fim, [4.0, -0.6, 11.5]],
	]);
	const desloc = 60 + frame * interpolate(frame, [0, fim], [0.4, 0.15]);
	const anel = (de: number, pos: V3, i: number) => {
		const t = frame - de - i * 4;
		if (t < 0) return null;
		const k = (t % 24) / 24;
		return (
			<mesh key={`${pos[0]}-${pos[2]}-${i}`} position={pos} rotation={[-Math.PI / 2, 0, 0]} scale={0.6 + k * 1.4}>
				<torusGeometry args={[0.6, 0.06, 6, 24]} />
				<meshBasicMaterial color={COR.amarelo} transparent opacity={1 - k} />
			</mesh>
		);
	};
	const rodas: V3[] = [
		[3.4, -1.55, 0],
		[-0.6, -1.55, 0.9],
		[-0.6, -1.55, -0.9],
	];
	return (
		<AbsoluteFill>
			<Cena3D pos={cam} alvo={[0.6, -0.4, 0]}>
				<group position={[0, Y_PISTA - 0.25 * 0.35, 0]}>
					<Aviao m={m} pose={{trem: 1, compressao: 0.35 + 0.05 * Math.sin(frame / 3), giroTurbina: frame * 0.2}} />
				</group>
				{rodas.map((p) => [0, 1].map((i) => anel(nome - 4, p, i)))}
				<Chao m={m} deslocamento={desloc} />
			</Cena3D>
			<Rotulo texto="TREM DE POUSO" y={330} p={mola(nome - 3, 220, 12)} />
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 10. reclamar que o lanche era pequeno
// dados: {tudo, reclamar, lanche, pequeno}
const Lanche: React.FC = () => (
	<group>
		<mesh position={[0, -0.05, 0]}>
			<boxGeometry args={[0.26, 0.06, 0.2]} />
			<Mat cor="#e2a95b" />
		</mesh>
		<mesh position={[0, 0.0, 0]}>
			<boxGeometry args={[0.3, 0.03, 0.24]} />
			<Mat cor="#5cbf3a" />
		</mesh>
		<mesh position={[0, 0.03, 0]}>
			<boxGeometry args={[0.24, 0.03, 0.18]} />
			<Mat cor={COR.vermelho} />
		</mesh>
		<mesh position={[0, 0.08, 0]} scale={[1, 0.6, 1]}>
			<sphereGeometry args={[0.15, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
			<Mat cor="#e2a95b" />
		</mesh>
	</group>
);

const igCLanche: Peca = ({cena}) => {
	const {frame, fim, q, d, mola, vai} = useCena(cena);
	const m = useMateriais();
	const recl = q(d.reclamar);
	const lan = q(d.lanche);
	const peq = q(d.pequeno);
	const bravo = vai(recl - 6, recl + 6);
	const fala = frame >= recl && frame < fim - 6 ? Math.abs(Math.sin((frame - recl) / 2.2)) * 0.5 : 0.05;
	const sobe = mola(2, 150, 14);
	const mao: V3 = [interpolate(sobe, [0, 1], [1.1, 0.75]), interpolate(sobe, [0, 1], [-2.7, -0.55]), interpolate(sobe, [0, 1], [0.35, 1.25])];
	const cot: V3 = [1.35, -1.75, 0.75];
	const encolhe = 1 - 0.45 * mola(peq - 1, 240, 10);
	const pLanche = mola(lan - 2, 260, 9);
	const cam = trilha(frame, [
		[0, [-1.2, 0.2, 7.5]],
		[lan - 6, [-0.4, 0.0, 5.6]],
		[lan + 8, [0.9, -0.35, 3.2]],
		[fim, [0.95, -0.4, 3.0]],
	]);
	const alvo = trilha(frame, [
		[0, [0, -0.5, 0]],
		[lan - 6, [0.2, -0.35, 0.4]],
		[lan + 8, [0.6, -0.35, 1.1]],
		[fim, [0.62, -0.38, 1.15]],
	]);
	return (
		<AbsoluteFill>
			<Cena3D pos={cam} alvo={alvo} ceu={['#efe6d8', '#efe6d8']}>
				{/* parede da cabine com janela */}
				<mesh position={[0, 0, -2.4]}>
					<boxGeometry args={[14, 12, 0.2]} />
					<Mat cor="#e8dfd0" />
				</mesh>
				<group position={[-2.6, 0.5, -2.25]}>
					<mesh>
						<boxGeometry args={[1.5, 2.0, 0.1]} />
						<Mat cor="#cfc5b3" />
					</mesh>
					<mesh position={[0, 0, 0.06]}>
						<boxGeometry args={[1.2, 1.7, 0.05]} />
						<meshBasicMaterial color="#7ec8f2" />
					</mesh>
					<mesh position={[0, -0.55 + Math.sin(frame / 20) * 0.03, 0.1]}>
						<boxGeometry args={[1.2, 0.5, 0.02]} />
						<meshBasicMaterial color={COR.grama} />
					</mesh>
				</group>
				{/* poltrona */}
				<mesh position={[0, -0.6, -1.0]}>
					<boxGeometry args={[2.6, 4.4, 0.5]} />
					<Mat cor={COR.azul} />
				</mesh>
				<mesh position={[0, 1.1, -0.72]}>
					<boxGeometry args={[1.6, 0.9, 0.12]} />
					<Mat cor="#f5f7fa" />
				</mesh>
				{/* passageiro */}
				<group position={[0, Math.sin(frame / 12) * 0.02, 0]}>
					<Busto expr={{boca: fala, bravo, vermelho: bravo * 0.7}} camisa="#3cb371" maoD={mao} cotoveloD={cot} />
					{/* lanche minúsculo na ponta dos dedos */}
					<group position={[mao[0] - 0.05, mao[1] + 0.2, mao[2] + 0.05]} scale={(0.5 + 0.5 * pLanche) * encolhe} rotation={[0.3, -0.4, 0]}>
						<Lanche />
					</group>
					{/* bufadas de raiva saindo da cabeça */}
					{frame >= recl
						? Array.from({length: 6}).map((_, i) => {
								const t = (frame - recl + i * 5) % 30;
								const k = t / 30;
								const l = i % 2 ? 1 : -1;
								return (
									<mesh key={i} position={[l * (0.75 + k * 0.5), 0.6 + k * 1.2, 0]} scale={0.12 + k * 0.25}>
										<icosahedronGeometry args={[1, 0]} />
										<meshStandardMaterial color="#ffffff" flatShading transparent opacity={(1 - k) * 0.9 * bravo} depthWrite={false} />
									</mesh>
								);
						  })
						: null}
				</group>
				{/* bandeja */}
				<mesh position={[0, -2.25, 1.2]}>
					<boxGeometry args={[2.4, 0.08, 1.2]} />
					<Mat cor="#cfd5dc" />
				</mesh>
				<pointLight position={[2, 2, 4]} intensity={6} distance={12} color="#fff3e0" />
			</Cena3D>
			{frame >= recl ? (
				<div style={{position: 'absolute', top: 330, width: '100%', textAlign: 'center', transform: `scale(${0.6 + 0.4 * mola(recl, 260, 9)}) rotate(${Math.sin(frame / 2) * 4}deg)`, opacity: 1 - vai(fim - 6, fim)}}>
					<span style={{fontFamily: FONTE, fontWeight: 900, fontSize: 120, color: COR.vermelho, WebkitTextStroke: '10px #ffffff', paintOrder: 'stroke fill'}}>!!</span>
				</div>
			) : null}
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 11. cartão final: SEGUE O PERFIL
// dados: {em}
const igCFinal: Peca = ({cena}) => {
	const {frame, fim, mola} = useCena(cena);
	const m = useMateriais();
	const ang = interpolate(frame, [0, fim], [0.7, 1.0]);
	const cam: V3 = [Math.cos(ang) * 16, 2.5, Math.sin(ang) * 16];
	const p1 = mola(2, 200, 12);
	const p2 = mola(8, 200, 13);
	return (
		<AbsoluteFill>
			<Cena3D pos={cam} alvo={[0, 0.2, 0]}>
				<group position={[0, Y_PISTA - 0.08, 0]}>
					<Aviao m={m} pose={{trem: 1, compressao: 0.35, giroTurbina: frame * 0.1}} />
				</group>
				<Chao m={m} deslocamento={100} />
				<Nuvem m={m} position={[-8, 7, -14]} escala={2.4} />
				<Nuvem m={m} position={[9, 9, -18]} escala={3} />
			</Cena3D>
			<AbsoluteFill style={{background: 'rgba(10,25,50,0.25)'}} />
			<div style={{position: 'absolute', top: 560, width: '100%', textAlign: 'center', transform: `scale(${0.5 + 0.5 * p1})`, opacity: Math.min(1, p1 * 1.6)}}>
				<div
					style={{
						fontFamily: FONTE,
						fontWeight: 900,
						fontSize: 128,
						lineHeight: 1.02,
						color: COR.amarelo,
						WebkitTextStroke: '14px #1d1d1d',
						paintOrder: 'stroke fill',
						letterSpacing: '0.02em',
						textShadow: '0 12px 30px rgba(0,0,0,0.35)',
					}}
				>
					SEGUE O<br />
					PERFIL
				</div>
			</div>
			<div style={{position: 'absolute', top: 870, width: '100%', textAlign: 'center', opacity: Math.min(1, p2 * 1.5), transform: `translateY(${(1 - p2) * 30}px)`}}>
				<span style={{fontFamily: FONTE, fontWeight: 800, fontSize: 44, color: '#ffffff', WebkitTextStroke: '8px #1d1d1d', paintOrder: 'stroke fill', letterSpacing: '0.04em'}}>
					PRA VER COMO TUDO FUNCIONA
				</span>
			</div>
		</AbsoluteFill>
	);
};

export const pecasC: Pecas = {igCAltitude, igCFrio, igCArFino, igCCabine, igCDescida, igCSpoilers, igCToque, igCAmortecedor, igCTrem, igCLanche, igCFinal};

export const cenasC = (b: Busca): Cena[] => {
	const tA = b.tempos('Lá em cima, a 11mil metros,');
	const tF = b.tempos('fazquase60 graus negativos,');
	const tR = b.tempos('e o ar é tão fino que você não consegue respirar.');
	const tC = b.tempos('Então a cabine é cheia de ar aquecido e com pressão. Essa é a pressurização.');
	const tD = b.tempos('Pra descer, as turbinas perdem força, os flaps abrem de novo e placas levantam em cima da asa pra frear no ar. Esses são os spoilers.');
	const tP = b.tempos('E as 400toneladas tocam o chão em cima de rodas com amortecedores de óleo e gás, que seguram o impacto. Esse é o trem de pouso.');
	const tL = b.tempos('Tudo isso pra você descer e reclamar que o lanche era pequeno.');
	const fimFala = b.say('lanche era pequeno.').fim;
	const corte = {
		frio: tF[0] - 0.04,
		ar: tR[0] - 0.04,
		cabine: tC[0] - 0.05,
		descida: tD[0] - 0.05,
		spoilers: tD[11] - 0.04,
		toque: tP[0] - 0.05,
		rodas: tP[9] - 0.04,
		trem: tP[20] - 0.04,
		lanche: tL[0] - 0.04,
		final: fimFala + 0.15,
		fim: fimFala + 1.3,
	};
	const peca = (nome: string, de: number, ate: number, dados: Record<string, unknown>, sons: {em: number; som: Cena['som']; ganho: number}[]): Cena =>
		({
			tipo: 'peca',
			nome,
			modo: 'cheia',
			de,
			ate,
			dados,
			sons: sons.map((s) => ({em: s.em, som: s.som!, ganho: s.ganho})),
		}) as Cena;
	return [
		peca('igCAltitude', tA[0], corte.frio, {mil: tA[4], marcos: [tA[4]]}, [
			{em: tA[0], som: 'pro_whoosh', ganho: 0.6},
			{em: tA[4], som: 'pro_tick', ganho: 0.6},
		]),
		peca('igCFrio', corte.frio, corte.ar, {frio: tF[0], negativos: tF[2], marcos: [tF[0], tF[2]]}, [
			{em: corte.frio, som: 'pro_whoosh_curto', ganho: 0.55},
			{em: tF[2], som: 'pro_quebra', ganho: 0.45},
		]),
		peca('igCArFino', corte.ar, corte.cabine, {ar: tR[2], fino: tR[5], respirar: tR[10], marcos: [tR[2], tR[5], tR[10]]}, [
			{em: corte.ar, som: 'pro_whoosh_curto', ganho: 0.5},
			{em: tR[5], som: 'pro_swipe', ganho: 0.6},
		]),
		peca('igCCabine', corte.cabine, corte.descida, {cabine: tC[2], aquecido: tC[7], pressao: tC[10], nome: tC[14], marcos: [tC[2], tC[7], tC[10], tC[14]]}, [
			{em: corte.cabine, som: 'pro_whoosh', ganho: 0.6},
			{em: tC[7], som: 'pro_pulso', ganho: 0.5},
			{em: tC[14] - 0.1, som: 'pro_pop', ganho: 0.7},
		]),
		peca('igCDescida', corte.descida, corte.spoilers, {descer: tD[1], turbinas: tD[3], perdem: tD[4], flaps: tD[7], marcos: [tD[1], tD[3], tD[4], tD[7]]}, [
			{em: corte.descida, som: 'pro_whoosh', ganho: 0.6},
			{em: tD[3] - 0.25, som: 'pro_whoosh_curto', ganho: 0.5},
			{em: tD[7], som: 'pro_swipe', ganho: 0.6},
		]),
		peca('igCSpoilers', corte.spoilers, corte.toque, {placas: tD[12], levantam: tD[13], frear: tD[19], nome: tD[25], marcos: [tD[12], tD[13], tD[19], tD[25]]}, [
			{em: tD[13] - 0.1, som: 'pro_swipe', ganho: 0.6},
			{em: tD[19], som: 'pro_whoosh_curto', ganho: 0.5},
			{em: tD[25] - 0.1, som: 'pro_pop', ganho: 0.7},
		]),
		peca('igCToque', corte.toque, corte.rodas, {peso: tP[2], tocam: tP[3], marcos: [tP[2], tP[3]]}, [
			{em: corte.toque, som: 'pro_aviao', ganho: 0.5},
			{em: tP[3], som: 'pro_pouso', ganho: 0.8},
		]),
		peca('igCAmortecedor', corte.rodas, corte.trem, {rodas: tP[9], amortecedores: tP[11], oleo: tP[13], gas: tP[15], seguram: tP[17], impacto: tP[19], marcos: [tP[11], tP[13], tP[15], tP[17]]}, [
			{em: corte.rodas, som: 'pro_whoosh_curto', ganho: 0.5},
			{em: tP[13], som: 'pro_pop', ganho: 0.5},
			{em: tP[17], som: 'pro_pouso', ganho: 0.7},
		]),
		peca('igCTrem', corte.trem, corte.lanche, {nome: tP[23], marcos: [tP[23]]}, [
			{em: corte.trem, som: 'pro_whoosh', ganho: 0.55},
			{em: tP[23] - 0.1, som: 'pro_pop', ganho: 0.7},
		]),
		peca('igCLanche', corte.lanche, corte.final, {tudo: tL[0], reclamar: tL[6], lanche: tL[9], pequeno: tL[11], marcos: [tL[6], tL[9]]}, [
			{em: corte.lanche, som: 'pro_whoosh', ganho: 0.6},
			{em: tL[6], som: 'pro_tick', ganho: 0.6},
			{em: tL[9], som: 'pro_pop', ganho: 0.6},
		]),
		{...peca('igCFinal', corte.final, corte.fim, {marcos: [corte.final + 0.15]}, [{em: corte.final, som: 'pro_logo', ganho: 0.7}]), esconderLegenda: true} as Cena,
	];
};
