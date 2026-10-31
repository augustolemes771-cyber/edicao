// Cenas do bloco B do gota-1: túnel escuro, estação gigante, gradeamento e tratamento biológico.
import React from 'react';
import {AbsoluteFill, interpolate, spring} from 'remotion';
import type {Busca} from '../../motor/palavras';
import type {Cena} from '../../motor/plano';
import type {CenaPeca, Pecas} from '../../pecas/peca';
import {CORES, Gota, lim, Palco, Rotulo, trilha, useMats, useQ} from './gota';

type V3 = [number, number, number];
const frac = (x: number) => x - Math.floor(x);
const rnd = (i: number, s = 1) => frac(Math.sin(i * 127.1 + s * 311.7) * 43758.5453);
const mt = (c: string) => <meshStandardMaterial color={c} flatShading roughness={0.8} />;

const useC = (cena: CenaPeca) => {
	const {frame, fps, q} = useQ(cena.de);
	const d = (cena.dados ?? {}) as Record<string, number>;
	const fim = Math.round((cena.ate - cena.de) * fps);
	const k = (n: string) => q(d[n]);
	const mola = (em: number) => spring({frame: frame - em, fps, config: {damping: 13, stiffness: 150}});
	return {frame, fps, fim, k, mola, t: frame / fps};
};

const Caixa: React.FC<{p: V3; s: V3; c: string; r?: V3}> = ({p, s, c, r}) => (
	<mesh position={p} scale={s} rotation={r}>
		<boxGeometry args={[1, 1, 1]} />
		{mt(c)}
	</mesh>
);
const Cil: React.FC<{p: V3; r: number; h: number; c: string; rot?: V3; seg?: number}> = ({p, r, h, c, rot, seg = 12}) => (
	<mesh position={p} rotation={rot}>
		<cylinderGeometry args={[r, r, h, seg]} />
		{mt(c)}
	</mesh>
);
const Arvore: React.FC<{p: V3; s?: number}> = ({p, s = 1}) => (
	<group position={p} scale={s}>
		<Cil p={[0, 0.5, 0]} r={0.12} h={1} c="#6b4a2b" seg={6} />
		<mesh position={[0, 1.6, 0]}>
			<coneGeometry args={[0.7, 1.8, 7]} />
			{mt('#4a9c45')}
		</mesh>
	</group>
);

const Tanque: React.FC<{p: V3; r?: number; agua?: string; bolhas?: number; t?: number}> = ({p, r = 3, agua = '#6f8f52', bolhas = 0, t = 0}) => (
	<group position={p}>
		<Cil p={[0, 0.6, 0]} r={r} h={1.2} c={CORES.concreto} seg={24} />
		<Cil p={[0, 1.15, 0]} r={r - 0.25} h={0.16} c={agua} seg={24} />
		{Array.from({length: 16}).map((_, i) => {
			const a = (i / 16) * Math.PI * 2;
			return <Caixa key={i} p={[Math.cos(a) * (r - 0.05), 1.55, Math.sin(a) * (r - 0.05)]} s={[0.07, 0.7, 0.07]} c="#e8c33a" />;
		})}
		{Array.from({length: bolhas}).map((_, i) => {
			const ph = frac(t * 0.6 + rnd(i));
			const a = rnd(i, 2) * 6.28;
			const rr = rnd(i, 3) * (r - 0.6);
			return (
				<mesh key={i} position={[Math.cos(a) * rr, 1.2 + ph * 1.0, Math.sin(a) * rr]} scale={0.12 + rnd(i, 4) * 0.12}>
					<icosahedronGeometry args={[1, 1]} />
					<meshStandardMaterial color="#e9fbff" transparent opacity={0.8 * (1 - ph)} flatShading />
				</mesh>
			);
		})}
	</group>
);

const Chao: React.FC = () => (
	<group>
		<Caixa p={[0, -0.3, 0]} s={[90, 0.6, 90]} c={CORES.grama} />
		{Array.from({length: 26}).map((_, i) => (
			<Arvore key={i} p={[(rnd(i) - 0.5) * 70, 0, -18 - rnd(i, 5) * 28]} s={0.9 + rnd(i, 6)} />
		))}
	</group>
);

const Predio: React.FC<{p: V3}> = ({p}) => (
	<group position={p}>
		<Caixa p={[0, 1.5, 0]} s={[6, 3, 4]} c={CORES.tijolo} />
		<Caixa p={[0, 3.15, 0]} s={[6.4, 0.3, 4.4]} c="#6d7783" />
		{[-2, -0.7, 0.7, 2].map((x) => (
			<Caixa key={x} p={[x, 1.7, 2.02]} s={[0.7, 0.8, 0.05]} c="#bfe6ff" />
		))}
		<Cil p={[2.2, 4.2, -1]} r={0.3} h={2.2} c="#8a8f98" />
	</group>
);

const Estacao: React.FC<{t: number}> = ({t}) => (
	<group>
		<Chao />
		<Caixa p={[0, 0.02, 4]} s={[44, 0.1, 22]} c="#aeb3b8" />
		{[-9, -3, 3, 9].map((x, i) => (
			<Tanque key={x} p={[x, 0, 0]} r={2.4} agua={i % 2 ? '#6f8f52' : '#7b7a4a'} bolhas={5} t={t + i} />
		))}
		{[-6, 6].map((x) => (
			<Tanque key={x} p={[x, 0, 8]} r={2.4} agua="#7b7a4a" t={t} />
		))}
		<Caixa p={[0, 1.2, 4.2]} s={[26, 0.2, 0.9]} c="#d9d4c8" />
		<Predio p={[-14, 0, 8]} />
		<Predio p={[15, 0, 9]} />
		{[-12, 12].map((x) => (
			<Cil key={x} p={[x, 1, 3]} r={0.9} h={2} c={CORES.cano} />
		))}
		<Cil p={[0, 0.5, 4.8]} r={0.3} h={30} c={CORES.cano} rot={[0, 0, Math.PI / 2]} />
	</group>
);

// 1. túnel escuro
const gBTunel: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fim} = useC(cena);
	const mats = useMats();
	const cam = trilha(frame, [[0, [0, 1.6, 8]], [fim, [0, 1.4, 4.6]]]);
	const claro = interpolate(frame, [fim * 0.5, fim], [0, 1], lim);
	return (
		<Palco camera={cam} alvo={[0, 1.4, 0]} fov={46} ceu={['#0b0f16', '#1b2330']}>
			{Array.from({length: 14}).map((_, i) => {
				const z = -((i * 3 + frame * 0.12) % 42) + 8;
				return (
					<group key={i} position={[0, 0, z]}>
						<Caixa p={[-3.2, 2, 0]} s={[0.5, 5, 0.6]} c="#2d3540" />
						<Caixa p={[3.2, 2, 0]} s={[0.5, 5, 0.6]} c="#2d3540" />
						<Caixa p={[0, 4.4, 0]} s={[7, 0.5, 0.6]} c="#2d3540" />
					</group>
				);
			})}
			<Caixa p={[0, -0.1, -10]} s={[7, 0.2, 60]} c="#3a3326" />
			<Caixa p={[0, 0.05, -10]} s={[2.4, 0.1, 60]} c="#5a4a2a" />
			<mesh position={[0, 2, -34]} scale={[16, 6, 1]}>
				<planeGeometry args={[1, 1]} />
				<meshBasicMaterial color="#d8eeff" transparent opacity={0.15 + claro * 0.6} />
			</mesh>
			<pointLight position={[0, 2.6, 2]} intensity={14} color="#9ccfff" />
			<Gota mats={mats} humor="assustada" suja={0.75} quadro={frame} position={[Math.sin(frame / 14) * 0.15, 1.1 + Math.sin(frame / 9) * 0.08, 0]} escala={0.9} />
		</Palco>
	);
};

// 2. vista aérea da estação gigante
const gBAerea: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fim, t, k, mola} = useC(cena);
	const mats = useMats();
	const cam = trilha(frame, [[0, [-18, 22, 34]], [fim, [10, 12, 22]]]);
	const qg = k('gigante');
	return (
		<Palco camera={cam} alvo={[0, 1, 4]} fov={42} ceu={['#5aa8e8', '#cdeaff']}>
			<Estacao t={t} />
			<Gota mats={mats} humor="assustada" suja={0.7} quadro={frame} position={[-15 + frame * 0.1, 3 + Math.sin(frame / 8) * 0.2, 14]} escala={1.1 + 0.5 * mola(qg)} />
		</Palco>
	);
};

// 3. gradeamento
const Grade: React.FC = () => (
	<group>
		<Caixa p={[0, 3.2, 0]} s={[8, 0.3, 0.5]} c={CORES.ferro} />
		<Caixa p={[0, 0.2, 0]} s={[8, 0.3, 0.5]} c={CORES.ferro} />
		{Array.from({length: 14}).map((_, i) => (
			<Caixa key={i} p={[-3.6 + i * 0.55, 1.7, 0]} s={[0.14, 3.1, 0.2]} c="#6c727c" />
		))}
	</group>
);
const gBGrade: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fim, k, mola} = useC(cena);
	const mats = useMats();
	const q = [k('plastico'), k('pano'), k('celular')];
	const cam = trilha(frame, [[0, [-5, 3.4, 9]], [fim, [3, 2.6, 7]]]);
	const queda = (qi: number, xi: number) => {
		const e = frame - (qi - 14);
		const p = Math.min(1, Math.max(0, e / 14));
		const quica = p >= 1 ? Math.abs(Math.sin((frame - qi) * 0.5)) * 0.2 * Math.exp(-(frame - qi) / 6) : 0;
		return [xi, 1.6 + (1 - p * p) * 6 + quica, 0.6] as V3;
	};
	const gx = interpolate(frame, [0, fim], [-9, -1], lim);
	return (
		<AbsoluteFill>
			<Palco camera={cam} alvo={[0, 1.8, 0]} fov={44} ceu={['#5aa8e8', '#cdeaff']}>
				<Caixa p={[0, -0.2, 0]} s={[40, 0.4, 14]} c="#aeb3b8" />
				<Caixa p={[0, 0.0, 0.3]} s={[40, 0.3, 3]} c="#3f8fd6" />
				<Caixa p={[-10, 1.6, -1]} s={[12, 3.5, 0.5]} c={CORES.concreto} />
				<Caixa p={[10, 1.6, -1]} s={[12, 3.5, 0.5]} c={CORES.concreto} />
				<Grade />
				<Caixa p={[0, 3.9, 2.5]} s={[22, 0.15, 0.15]} c="#e8c33a" />
				<Caixa p={[0, 3.4, 2.5]} s={[22, 0.15, 0.15]} c="#e8c33a" />
				<group position={queda(q[0], -1.8)} rotation={[0, 0, 0.5]}>
					<Cil p={[0, 0, 0]} r={0.35} h={1} c="#bfe9ff" />
					<Cil p={[0, 0.65, 0]} r={0.14} h={0.3} c="#bfe9ff" seg={8} />
					<Cil p={[0, 0.85, 0]} r={0.16} h={0.1} c="#e5484d" seg={8} />
				</group>
				<group position={queda(q[1], 0.3)} rotation={[0.2, 0, 0.3]}>
					<Caixa p={[0, 0, 0]} s={[1.3, 1.0, 0.1]} c="#e0587a" />
					<Caixa p={[0.2, -0.2, 0.06]} s={[0.7, 0.5, 0.05]} c="#f4a3b8" />
				</group>
				<group position={queda(q[2], 2.2)} rotation={[0, 0, -0.35]}>
					<Caixa p={[0, 0, 0]} s={[0.7, 1.3, 0.12]} c="#1d1f24" />
					<Caixa p={[0, 0, 0.07]} s={[0.58, 1.1, 0.02]} c="#4fb3ff" />
				</group>
				<Gota mats={mats} humor="enjoada" suja={0.8} quadro={frame} position={[gx, 1.5 + Math.sin(frame / 10) * 0.2, 1.2]} escala={0.75} />
			</Palco>
			<Rotulo texto="GRADEAMENTO" y={330} p={mola(k('rotulo'))} />
		</AbsoluteFill>
	);
};

// 4. tratamento biológico
const Bacteria: React.FC<{p: V3; t: number; i: number}> = ({p, t, i}) => {
	const abre = 0.5 + 0.5 * Math.sin(t * 6 + i);
	return (
		<group position={[p[0], p[1] + Math.sin(t * 2 + i) * 0.15, p[2]]} rotation={[0, Math.sin(t + i) * 0.5, 0]} scale={0.55}>
			<mesh>
				<icosahedronGeometry args={[1, 1]} />
				{mt(CORES.bacteria)}
			</mesh>
			{[-0.35, 0.35].map((x) => (
				<mesh key={x} position={[x, 0.35, 0.85]} scale={0.22}>
					<sphereGeometry args={[1, 8, 6]} />
					{mt('#ffffff')}
				</mesh>
			))}
			<mesh position={[0, -0.25, 0.9]} scale={[0.5, 0.15 + abre * 0.3, 0.2]}>
				<sphereGeometry args={[1, 8, 6]} />
				{mt('#3a1d1d')}
			</mesh>
		</group>
	);
};
const gBBio: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fim, t, k, mola} = useC(cena);
	const mats = useMats();
	const qb = k('bacterias');
	const qs = k('sujeira');
	const qr = k('rotulo');
	const cam = trilha(frame, [[0, [-3, 8, 12]], [qb, [0, 6, 9]], [fim, [3, 5, 8]]]);
	const suja = interpolate(frame, [qs, qs + 40], [0.8, 0.15], lim);
	const gx = interpolate(frame, [0, fim], [-3.5, 3.5], lim);
	return (
		<AbsoluteFill>
			<Palco camera={cam} alvo={[0, 1.2, 0]} fov={46} ceu={['#5aa8e8', '#cdeaff']}>
				<Chao />
				<Tanque p={[0, 0, 0]} r={5} agua="#7b8a4a" bolhas={28} t={t} />
				<Tanque p={[-9, 0, -2]} r={3} agua="#7b7a4a" bolhas={8} t={t + 3} />
				<Tanque p={[9, 0, -2]} r={3} agua="#7b7a4a" bolhas={8} t={t + 5} />
				<Caixa p={[0, 1.4, 6.2]} s={[16, 0.2, 1]} c="#d9d4c8" />
				<Predio p={[-16, 0, -10]} />
				{Array.from({length: 9}).map((_, i) => {
					const a = rnd(i, 7) * 6.28;
					const rr = 1 + rnd(i, 8) * 3;
					const sumiu = interpolate(frame, [qb + i * 4, qb + 40 + i * 5], [1, 0], lim);
					return (
						<mesh key={i} position={[Math.cos(a) * rr, 1.5, Math.sin(a) * rr]} scale={0.3 * sumiu} rotation={[t + i, t, 0]}>
							<dodecahedronGeometry args={[1, 0]} />
							{mt('#6b4a2b')}
						</mesh>
					);
				})}
				{Array.from({length: 8}).map((_, i) => {
					const a = rnd(i, 7) * 6.28 + Math.sin(t * 0.7 + i) * 0.2;
					const rr = 1.2 + rnd(i, 8) * 3;
					return (
						<group key={i} scale={Math.max(0.001, mola(qb + i * 2))}>
							<Bacteria p={[Math.cos(a) * rr, 1.7, Math.sin(a) * rr]} t={t} i={i} />
						</group>
					);
				})}
				<Gota mats={mats} humor={frame > qs + 30 ? 'aliviada' : 'enjoada'} suja={suja} quadro={frame} position={[gx, 2.1 + Math.sin(frame / 9) * 0.15, 3.6]} escala={0.8} />
			</Palco>
			<Rotulo texto="TRATAMENTO BIOLÓGICO" y={330} p={mola(qr)} tam={50} />
		</AbsoluteFill>
	);
};

export const pecasB: Pecas = {gBTunel, gBAerea, gBGrade, gBBio};

export const cenasB = (b: Busca): Cena[] => {
	const ini = b.say('Depois de quilômetros').inicio;
	const fimBloco = b.say('O que sobrou').inicio;
	const c1 = b.say('numa estação').inicio - 0.1;
	const c2 = b.at('Primeiro') - 0.05;
	const c3 = b.say('Depois você passa').inicio - 0.05;
	const t = {
		gigante: b.at('gigante'),
		plastico: b.at('plástico'),
		pano: b.at('pano'),
		celular: b.at('celular'),
		rotulo: b.at('gradeamento'),
		bacterias: b.at('bactérias'),
		sujeira: b.at('sujeira'),
		bio: b.at('biológico'),
	};
	const peca = (nome: string, de: number, ate: number, dados: Record<string, unknown>, sons: Cena['sons'] = []): Cena => ({tipo: 'peca', nome, modo: 'cheia', de, ate, dados, sons});
	return [
		peca('gBTunel', ini, c1, {marcos: [ini + 0.5]}, [{em: ini + 0.1, som: 'pro_whoosh', ganho: 0.5}]),
		peca('gBAerea', c1, c2, {gigante: t.gigante, marcos: [t.gigante]}, [{em: t.gigante, som: 'pro_pop', ganho: 0.6}]),
		peca('gBGrade', c2, c3, {plastico: t.plastico, pano: t.pano, celular: t.celular, rotulo: t.rotulo, marcos: [t.plastico, t.pano, t.celular, t.rotulo]}, [
			{em: t.plastico, som: 'tick', ganho: 0.7},
			{em: t.pano, som: 'pop', ganho: 0.6},
			{em: t.celular, som: 'impacto', ganho: 0.6},
			{em: t.rotulo, som: 'pro_pop', ganho: 0.7},
		]),
		peca('gBBio', c3, fimBloco, {bacterias: t.bacterias, sujeira: t.sujeira, rotulo: t.bio, marcos: [t.bacterias, t.sujeira, t.bio]}, [
			{em: t.bacterias, som: 'pro_whoosh_curto', ganho: 0.5},
			{em: t.sujeira, som: 'shimmer', ganho: 0.6},
			{em: t.bio, som: 'pro_pop', ganho: 0.7},
		]),
	];
};
