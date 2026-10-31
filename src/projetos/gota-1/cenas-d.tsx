// Cenas do bloco D do gota-1: estação de água (filtro de areia, cloro), tratamento, cozinha, torneira e cartão final.
import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring} from 'remotion';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import type {Busca} from '../../motor/palavras';
import type {Cena} from '../../motor/plano';
import type {CenaPeca, Peca, Pecas} from '../../pecas/peca';
import {poppins} from '../../motor/tema';
import {Gota, useMats, Palco, Rotulo, trilha, useQ, lim, type Mats} from './gota';

type V3 = [number, number, number];

const useCena = (cena: CenaPeca) => {
	const {frame, fps, q} = useQ(cena.de);
	const fim = Math.round((cena.ate - cena.de) * fps);
	const mola = (de: number, rigidez = 170, amortece = 14) => spring({frame: frame - de, fps, config: {damping: amortece, stiffness: rigidez}});
	const vai = (a: number, b: number, easing = Easing.inOut(Easing.cubic)) => interpolate(frame, [a, b], [0, 1], {...lim, easing});
	return {frame, fps, q, fim, mola, vai};
};

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
const Caixa: React.FC<{mat: THREE.Material; p: V3; s: V3; r?: V3}> = ({mat, p, s, r = [0, 0, 0]}) => (
	<mesh material={mat} position={p} scale={s} rotation={r}>
		<boxGeometry args={[1, 1, 1]} />
	</mesh>
);
const Cil: React.FC<{mat: THREE.Material; p: V3; r: number; h: number; r2?: number; rot?: V3; seg?: number}> = ({mat, p, r, h, r2, rot = [0, 0, 0], seg = 14}) => (
	<mesh material={mat} position={p} rotation={rot}>
		<cylinderGeometry args={[r2 ?? r, r, h, seg]} />
	</mesh>
);
const Esf: React.FC<{mat: THREE.Material; p: V3; r: number; s?: V3}> = ({mat, p, r, s = [1, 1, 1]}) => (
	<mesh material={mat} position={p} scale={s}>
		<icosahedronGeometry args={[r, 1]} />
	</mesh>
);
const rnd = (i: number, s = 0) => {
	const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
	return x - Math.floor(x);
};
const FONTE = poppins;
const CEU_EST: [string, string] = ['#8fd0f5', '#e4f5ff'];
const CEU_COZ: [string, string] = ['#f3e2c4', '#fbf1dc'];

const Chao: React.FC<{cor: string; y?: number; tam?: number}> = ({cor, y = -3.2, tam = 60}) => (
	<mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
		<planeGeometry args={[tam, tam]} />
		<meshStandardMaterial color={cor} flatShading />
	</mesh>
);

// ---------- 1. filtro de areia em corte
const gDFiltro: Peca = ({cena}) => {
	const {frame, fim, vai} = useCena(cena);
	const m = useMats();
	const vidro = React.useMemo(() => new THREE.MeshStandardMaterial({color: '#bfe6ff', transparent: true, opacity: 0.25, flatShading: true}), []);
	const cascalho = React.useMemo(() => new THREE.MeshStandardMaterial({color: '#8d8a82', flatShading: true}), []);
	const areiaFina = React.useMemo(() => new THREE.MeshStandardMaterial({color: '#f1dca6', flatShading: true}), []);
	const t = vai(8, fim - 20, Easing.inOut(Easing.quad));
	const y = 4.4 - t * 8.4;
	const suja = 0.9 * (1 - vai(fim * 0.25, fim * 0.75));
	const ang = interpolate(frame, [0, fim], [-0.5, 0.5]);
	const cam: V3 = [Math.sin(ang) * 15, 2 + Math.sin(frame / 40), Math.cos(ang) * 15];
	const camadas: [number, number, THREE.Material][] = [
		[-3.5, 1.2, cascalho],
		[-2.0, 1.8, m.areia],
		[0.2, 2.6, areiaFina],
		[2.0, 1.0, m.areia],
	];
	return (
		<AbsoluteFill>
			<Cena3D pos={cam} alvo={[0, 0.5, 0]} ceu={CEU_EST}>
				<Chao cor="#b6c9a4" y={-4.3} />
				<Caixa mat={m.concreto} p={[0, -4.1, 0]} s={[7, 0.4, 6]} />
				<Caixa mat={vidro} p={[0, 0.2, 0]} s={[5, 9, 3.6]} />
				{camadas.map(([cy, h, mat], i) => (
					<Caixa key={i} mat={mat} p={[0, cy - 0.1, 0]} s={[4.9, h - 0.05, 3.5]} />
				))}
				{Array.from({length: 26}).map((_, i) => (
					<Esf key={i} mat={i % 2 ? m.areia : cascalho} p={[(rnd(i) - 0.5) * 4.3, camadas[i % 4][0] + (rnd(i, 2) - 0.5) * 0.6, 1.76]} r={0.12 + rnd(i, 3) * 0.1} />
				))}
				<Cil mat={m.cano} p={[0, 5.2, 0]} r={0.35} h={2} />
				{Array.from({length: 7}).map((_, i) => {
					const yy = 4 - ((frame * 0.05 + i * 1.3) % 8);
					return <Esf key={i} mat={m.aguaSuja} p={[Math.sin(i * 2) * 1.5, yy, 0.6]} r={0.14} />;
				})}
				<Gota mats={m} humor={suja > 0.4 ? 'enjoada' : 'aliviada'} suja={suja} quadro={frame} escala={0.8} position={[0, y, 1.2]} rotation={[0, Math.sin(frame / 12) * 0.2, 0]} />
				{t > 0.97 ? Array.from({length: 8}).map((_, i) => <Esf key={i} mat={m.aguaLimpa} p={[Math.sin(i * 0.8) * 1.2, -3.6 + ((frame * 0.1 + i) % 1.2), 1.6]} r={0.1} />) : null}
			</Cena3D>
			<Rotulo texto="FILTRO DE AREIA" y={330} p={vai(4, 16)} />
		</AbsoluteFill>
	);
};

// ---------- 2. dosador de cloro mata micróbios
const gDCloro: Peca = ({cena}) => {
	const {frame, fim, vai, mola} = useCena(cena);
	const m = useMats();
	const ang = interpolate(frame, [0, fim], [0.5, -0.4]);
	const cam: V3 = [Math.sin(ang) * 12, 1.5, Math.cos(ang) * 12];
	return (
		<AbsoluteFill>
			<Cena3D pos={cam} alvo={[0, 0.5, 0]} ceu={CEU_EST}>
				<Chao cor="#b6c9a4" y={-3} />
				<Caixa mat={m.concreto} p={[0, -2.6, 0]} s={[12, 0.8, 5]} />
				<Caixa mat={m.aguaLimpa} p={[0, -1.3, 0]} s={[8, 1.8, 3]} />
				<Caixa mat={m.azulEscuro} p={[3.2, 2.2, -1]} s={[2.4, 3.6, 2]} />
				<Caixa mat={m.branco} p={[3.2, 3.4, 0.02]} s={[1.6, 0.8, 0.1]} />
				<Esf mat={m.vermelho} p={[2.6, 2.2, 0.1]} r={0.3} />
				<Cil mat={m.cano} p={[1.2, 3.8, -1]} r={0.18} h={4} rot={[0, 0, Math.PI / 2]} />
				<Cil mat={m.cano} p={[-0.8, 2.8, -1]} r={0.18} h={2} />
				{[0, 1, 2].map((i) => {
					const f = frame < 10 + i * 14 ? -1 : (frame - 10 - i * 14) % 42;
					if (f < 0 || f > 24) return null;
					return <Esf key={i} mat={m.cloro} p={[-0.8, 1.8 - f * 0.12, -1]} r={0.22} />;
				})}
				{Array.from({length: 7}).map((_, i) => {
					const morre = 24 + i * 5;
					const e = 1 - vai(morre, morre + 8);
					const x = -3.2 + i * 1.0;
					return e > 0 ? <Esf key={i} mat={m.bacteria} p={[x, -0.2 + Math.sin(frame / 7 + i) * 0.25, 0.8 + (i % 2) * 0.6]} r={0.38 * e} /> : null;
				})}
				<Gota mats={m} humor={frame > 40 ? 'aliviada' : 'assustada'} quadro={frame} escala={0.75} position={[0, 0.4 + Math.sin(frame / 10) * 0.12, 2.2]} rotation={[0, Math.sin(frame / 20) * 0.3, 0]} />
				{[0, 1, 2, 3].map((i) => (frame > 30 + i * 6 ? <Esf key={i} mat={m.cloro} p={[-2 + i * 1.4, 1 + ((frame * 0.04 + i) % 1.4), 1.8]} r={0.09 * mola(30 + i * 6)} /> : null))}
			</Cena3D>
			<Rotulo texto="CLORO" y={330} p={vai(4, 16)} />
		</AbsoluteFill>
	);
};

// ---------- 3. TRATAMENTO: caixa de água e cano
const gDTrat: Peca = ({cena}) => {
	const {frame, fim, vai} = useCena(cena);
	const m = useMats();
	const cam = trilha(frame, [
		[0, [-9, 3, 12]],
		[fim, [8, 5, 12]],
	]);
	const pos = trilha(frame, [
		[0, [-6, -1.7, 1.2]],
		[Math.round(fim * 0.35), [0, -1.7, 1.2]],
		[Math.round(fim * 0.55), [0, 2, 1.2]],
		[fim, [0, 6.6, 1.2]],
	]);
	return (
		<AbsoluteFill>
			<Cena3D pos={cam} alvo={[0, 2, 0]} ceu={CEU_EST}>
				<Chao cor="#9fcf86" y={-3} />
				<Cil mat={m.cano} p={[-3, -2, 0]} r={0.6} h={7} rot={[0, 0, Math.PI / 2]} />
				<Cil mat={m.cano} p={[0, 0.5, 0]} r={0.6} h={6} />
				{[-1.6, 1.6].map((x) => [-1.6, 1.6].map((z) => <Cil key={x + '' + z} mat={m.canoEscuro} p={[x, 4, z]} r={0.15} h={7} />))}
				<Cil mat={m.branco} p={[0, 8.2, 0]} r={3} h={3.2} seg={16} />
				<Cil mat={m.azulEscuro} p={[0, 6.4, 0]} r={3.1} h={0.3} seg={16} />
				<Cil mat={m.azulEscuro} p={[0, 9.9, 0]} r={2.2} r2={0.1} h={1.4} seg={16} />
				<Caixa mat={m.amarelo} p={[0, 8.2, 3.02]} s={[3, 0.9, 0.1]} />
				<Gota mats={m} humor="aliviada" quadro={frame} escala={0.55} position={pos} rotation={[0, Math.sin(frame / 12) * 0.3, 0]} />
			</Cena3D>
			<Rotulo texto="TRATAMENTO" y={330} p={vai(3, 16)} tam={70} />
		</AbsoluteFill>
	);
};

// ---------- cozinha (usada em 4 e 5)
const Cozinha: React.FC<{m: Mats; abre: number; fluxo?: number}> = ({m, abre, fluxo = 0}) => {
	const madeira = React.useMemo(() => new THREE.MeshStandardMaterial({color: '#c98a52', flatShading: true}), []);
	const bancada = React.useMemo(() => new THREE.MeshStandardMaterial({color: '#e8e4dc', flatShading: true}), []);
	const parede = React.useMemo(() => new THREE.MeshStandardMaterial({color: '#f7e6c0', flatShading: true}), []);
	const piso = React.useMemo(() => new THREE.MeshStandardMaterial({color: '#6fa3a8', flatShading: true}), []);
	const inox = React.useMemo(() => new THREE.MeshStandardMaterial({color: '#cfd6dd', metalness: 0.5, roughness: 0.3, flatShading: true}), []);
	return (
		<group>
			<Caixa mat={piso} p={[0, -3.1, 2]} s={[16, 0.2, 14]} />
			<Caixa mat={parede} p={[0, 2, -2.1]} s={[16, 10.2, 0.2]} />
			<Caixa mat={m.branco} p={[-4, 3.2, -1.95]} s={[3.6, 3.6, 0.15]} />
			<Caixa mat={m.aguaLimpa} p={[-4, 3.2, -1.85]} s={[3.2, 3.2, 0.1]} />
			<Caixa mat={m.branco} p={[-4, 3.2, -1.78]} s={[0.12, 3.2, 0.1]} />
			<Caixa mat={m.branco} p={[-4, 3.2, -1.78]} s={[3.2, 0.12, 0.1]} />
			<Caixa mat={madeira} p={[0, -1.6, -0.9]} s={[12, 2.9, 2.2]} />
			{[-5, -2.5, 0, 2.5, 5].map((x) => (
				<Caixa key={x} mat={m.canoEscuro} p={[x, -1.6, 0.22]} s={[0.1, 1.6, 0.06]} />
			))}
			<Caixa mat={bancada} p={[0, 0, -0.9]} s={[12.2, 0.3, 2.4]} />
			<Caixa mat={inox} p={[1.5, 0.17, -0.9]} s={[3, 0.1, 1.7]} />
			<Caixa mat={madeira} p={[3.5, 4.2, -1.4]} s={[5, 2.4, 1.2]} />
			<Caixa mat={m.canoEscuro} p={[3.5, 4.2, -0.78]} s={[0.07, 2, 0.06]} />
			<Cil mat={inox} p={[1.5, 1.0, -1.7]} r={0.2} h={2} />
			<Cil mat={inox} p={[1.5, 2.0, -1.2]} r={0.2} h={1.2} rot={[Math.PI / 2, 0, 0]} />
			<Cil mat={inox} p={[1.5, 1.85, -0.65]} r={0.22} h={0.3} />
			<Caixa mat={m.vermelho} p={[1.5, 2.1, -1.7]} s={[0.7 * (1 - abre * 0.6) + 0.2, 0.15, 0.2]} r={[0, abre * 1.2, 0]} />
			{fluxo > 0 ? <Caixa mat={m.aguaLimpa} p={[1.5, 0.8 - 0.1, -0.65]} s={[0.22, 2.1 * fluxo, 0.22]} /> : null}
			<Cil mat={m.aguaLimpa} p={[1.5, 0.42, -0.35]} r={0.55} r2={0.45} h={0.7} />
		</group>
	);
};

// ---------- 4. cozinha: torneira abre, gota cai no copo
const gDCozinha: Peca = ({cena}) => {
	const {frame, fim, vai, mola} = useCena(cena);
	const m = useMats();
	const abre = mola(Math.round(fim * 0.3), 140, 12);
	const cam = trilha(frame, [
		[0, [-8, 3, 12]],
		[fim, [3.5, 2.4, 9]],
	]);
	const cai = vai(Math.round(fim * 0.38), Math.round(fim * 0.62), Easing.in(Easing.quad));
	const y = frame < fim * 0.3 ? 2.0 : 1.6 - cai * 1.1;
	return (
		<AbsoluteFill>
			<Cena3D pos={cam} alvo={[1, 1, -0.5]} ceu={CEU_COZ}>
				<Cozinha m={m} abre={abre} fluxo={cai > 0.02 ? 0.6 : 0} />
				<Gota mats={m} humor="feliz" quadro={frame} escala={frame < fim * 0.3 ? 0.18 + 0.1 * vai(0, 10) : 0.3} position={[1.5, y, -0.65]} />
			</Cena3D>
			<Rotulo texto="DE NOVO NA TORNEIRA" y={330} p={vai(4, 16)} tam={50} />
		</AbsoluteFill>
	);
};

// ---------- 5. "Talvez a sua": a gota olha pra câmera no copo
const gDOlhar: Peca = ({cena}) => {
	const {frame, fim, vai} = useCena(cena);
	const m = useMats();
	const k = vai(0, fim - 6, Easing.inOut(Easing.cubic));
	const cam: V3 = [3.5 - k * 2, 2.4 - k * 0.7, 9 - k * 5.5];
	return (
		<AbsoluteFill>
			<Cena3D pos={cam} alvo={[1.5, 1.2, -0.4]} ceu={CEU_COZ} fov={40 - k * 6}>
				<Cozinha m={m} abre={1} fluxo={0} />
				<Gota mats={m} humor="feliz" quadro={frame} escala={0.5 + 0.08 * Math.sin(frame / 8)} position={[1.5, 0.95 + Math.sin(frame / 10) * 0.05, -0.3]} rotation={[0, interpolate(frame, [0, 14], [-0.8, 0], lim), 0]} />
			</Cena3D>
			<div style={{position: 'absolute', top: 330, width: '100%', textAlign: 'center', fontFamily: FONTE, fontWeight: 900, fontSize: 84, color: '#fff', WebkitTextStroke: '12px #1d1d1d', paintOrder: 'stroke fill', opacity: vai(6, 16)}}>
				TALVEZ A SUA
			</div>
		</AbsoluteFill>
	);
};

// ---------- 6. cartão final
const gDFinal: Peca = ({cena}) => {
	const {frame, mola} = useCena(cena);
	const m = useMats();
	const p1 = mola(2, 200, 12);
	const p2 = mola(8, 200, 13);
	const cam: V3 = [Math.sin(frame / 60) * 2, 1.5, 11];
	return (
		<AbsoluteFill>
			<Cena3D pos={cam} alvo={[0, 0.5, 0]} ceu={['#1d6fd1', '#8fd0f5']}>
				<Gota mats={m} humor="feliz" quadro={frame} escala={1.0} position={[0, -1.2 + Math.sin(frame / 12) * 0.15, 0]} rotation={[0, Math.sin(frame / 25) * 0.3, 0]} />
				{Array.from({length: 10}).map((_, i) => (
					<Esf key={i} mat={m.aguaLimpa} p={[(rnd(i) - 0.5) * 9, ((frame * 0.03 + rnd(i, 2) * 8) % 8) - 3, -2]} r={0.15 + rnd(i, 3) * 0.2} />
				))}
			</Cena3D>
			<div style={{position: 'absolute', top: 470, width: '100%', textAlign: 'center', transform: `scale(${0.5 + 0.5 * p1})`, opacity: Math.min(1, p1 * 1.6)}}>
				<div style={{fontFamily: FONTE, fontWeight: 900, fontSize: 128, lineHeight: 1.02, color: '#ffcf3a', WebkitTextStroke: '14px #1d1d1d', paintOrder: 'stroke fill', letterSpacing: '0.02em', textShadow: '0 12px 30px rgba(0,0,0,0.35)'}}>
					SEGUE O<br />
					PERFIL
				</div>
			</div>
			<div style={{position: 'absolute', top: 1180, width: '100%', textAlign: 'center', opacity: Math.min(1, p2 * 1.5), transform: `translateY(${(1 - p2) * 30}px)`}}>
				<span style={{fontFamily: FONTE, fontWeight: 800, fontSize: 44, color: '#ffffff', WebkitTextStroke: '8px #1d1d1d', paintOrder: 'stroke fill', letterSpacing: '0.04em'}}>PRA VER PRA ONDE A ÁGUA VAI</span>
			</div>
		</AbsoluteFill>
	);
};

export const pecasD: Pecas = {gDFiltro, gDCloro, gDTrat, gDCozinha, gDOlhar, gDFinal};

export const cenasD = (b: Busca): Cena[] => {
	const t0 = b.say('Na estação de água').inicio;
	const tCloro = b.say('e recebe um pouco de cloro').inicio;
	const tTrat = b.say('Esse é o tratamento').inicio;
	const tCoz = b.say('E daqui a alguns dias').inicio;
	const tTalvez = b.say('Talvez a sua').inicio;
	const fimFala = b.say('Talvez a sua').fim;
	const tFinal = fimFala + 0.35;
	const fim = fimFala + 2.3;
	const peca = (nome: string, de: number, ate: number, marcos: number[], sons: {em: number; som: Cena['som']; ganho: number}[], extra: object = {}): Cena =>
		({tipo: 'peca', nome, modo: 'cheia', de, ate, dados: {marcos}, sons: sons.map((s) => ({em: s.em, som: s.som!, ganho: s.ganho})), ...extra}) as Cena;
	return [
		peca('gDFiltro', t0, tCloro - 0.05, [t0 + 0.4, tCloro - 1.0], [
			{em: t0, som: 'pro_whoosh', ganho: 0.6},
			{em: t0 + 2.2, som: 'shimmer', ganho: 0.5},
		]),
		peca('gDCloro', tCloro - 0.05, tTrat - 0.05, [tCloro + 0.5, tCloro + 1.5], [
			{em: tCloro, som: 'pro_whoosh_curto', ganho: 0.55},
			{em: tCloro + 1.8, som: 'pro_pop', ganho: 0.6},
		]),
		peca('gDTrat', tTrat - 0.05, tCoz - 0.05, [tTrat + 0.3, tTrat + 0.7], [{em: tTrat, som: 'pro_pop', ganho: 0.7}]),
		peca('gDCozinha', tCoz - 0.05, tTalvez - 0.05, [tCoz + 0.5, tTalvez - 1.2], [
			{em: tCoz, som: 'pro_whoosh', ganho: 0.6},
			{em: tCoz + 1.7, som: 'pro_pop', ganho: 0.6},
		]),
		peca('gDOlhar', tTalvez - 0.05, tFinal, [tTalvez + 0.3], [{em: tTalvez, som: 'pro_pop', ganho: 0.7}]),
		peca('gDFinal', tFinal, fim, [tFinal + 0.2], [{em: tFinal, som: 'pro_logo', ganho: 0.7}], {esconderLegenda: true}),
	];
};
