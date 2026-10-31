// Cenas do bloco C do gota-1: decantação (tanque em corte), rio e captação.
import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import type {Busca} from '../../motor/palavras';
import type {Cena} from '../../motor/plano';
import type {CenaPeca, Pecas} from '../../pecas/peca';
import {Gota, Rotulo, lim, useMats, useQ} from './gota';

type V3 = [number, number, number];
const frac = (x: number) => x - Math.floor(x);
const rnd = (i: number, s = 1) => frac(Math.sin(i * 127.1 + s * 311.7) * 43758.5453);
const mix = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const ease = Easing.inOut(Easing.cubic);

const Camera: React.FC<{pos: V3; alvo: V3; fov: number}> = ({pos, alvo, fov}) => {
	const {camera} = useThree();
	const c = camera as THREE.PerspectiveCamera;
	c.position.set(pos[0], pos[1], pos[2]);
	c.fov = fov;
	c.lookAt(alvo[0], alvo[1], alvo[2]);
	c.updateProjectionMatrix();
	return null;
};
const PalcoC: React.FC<{children: React.ReactNode; pos: V3; alvo: V3; fov?: number; sobre?: React.ReactNode}> = ({children, pos, alvo, fov = 40, sobre}) => {
	const {width, height} = useVideoConfig();
	return (
		<AbsoluteFill style={{background: 'linear-gradient(180deg, #5fb0ee 0%, #cdeeff 75%)'}}>
			<ThreeCanvas width={width} height={height} gl={{alpha: true, antialias: true, preserveDrawingBuffer: true}} camera={{fov, position: pos, near: 0.1, far: 600}} style={{position: 'absolute', inset: 0}}>
				<Camera pos={pos} alvo={alvo} fov={fov} />
				<fog attach="fog" args={['#cdeeff', 60, 170]} />
				<ambientLight intensity={0.8} />
				<directionalLight position={[8, 14, 10]} intensity={1.6} />
				<directionalLight position={[-6, 4, -8]} intensity={0.45} />
				{children}
			</ThreeCanvas>
			{sobre}
		</AbsoluteFill>
	);
};

const useX = () => {
	const base = useMats();
	return useMemo(() => {
		const f = (c: string, o: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({color: c, flatShading: true, roughness: 0.8, ...o});
		return {
			...base,
			vidro: f('#8fd3ff', {transparent: true, opacity: 0.4, roughness: 0.2}),
			turva: f('#a58b55', {transparent: true, opacity: 0.38}),
			lodo: f('#6b4a2a'),
			mancha: f('#7a5a33'),
			parede: f('#d9d3c7', {side: THREE.DoubleSide}),
			rio: f('#3f9fe6', {roughness: 0.3, emissive: '#1a5f99', emissiveIntensity: 0.2}),
			arvore: f('#4aa04a'),
			arvore2: f('#5cb85c'),
			tronco: f('#7a5636'),
			pedra: f('#8d949c'),
			peixe: f('#ff8a3d'),
			espuma: f('#ffffff', {transparent: true, opacity: 0.8}),
			telhado: f('#8a3d2e'),
			succao: f('#bfeaff', {transparent: true, opacity: 0.8, emissive: '#9fe8ff', emissiveIntensity: 0.4}),
			tubo: f('#aab4be', {transparent: true, opacity: 0.35, roughness: 0.2}),
		};
	}, [base]);
};
type X = ReturnType<typeof useX>;

const R = 3;
const H = 3.4;
// ------------------------------------------------------------ tanque decantador em corte
const Tanque: React.FC<{m: X; lodo: number; frame: number}> = ({m, lodo, frame}) => (
	<group>
		<mesh material={m.concreto} position={[0, -0.3, 0]}>
			<cylinderGeometry args={[R + 0.5, R + 0.6, 0.6, 28]} />
		</mesh>
		<mesh material={m.parede} position={[0, H / 2, 0]}>
			<cylinderGeometry args={[R, R, H, 28, 1, true, Math.PI * 0.3, Math.PI * 1.4]} />
		</mesh>
		{/* água em camadas: limpa em cima, turva no meio, lodo no fundo */}
		<mesh material={m.vidro} position={[0, H * 0.45, 0]}>
			<cylinderGeometry args={[R - 0.05, R - 0.05, H * 0.9, 28]} />
		</mesh>
		<mesh material={m.turva} position={[0, 0.9, 0]}>
			<cylinderGeometry args={[R - 0.06, R - 0.06, 1.6, 28]} />
		</mesh>
		<mesh material={m.lodo} position={[0, 0.05 + lodo / 2, 0]}>
			<cylinderGeometry args={[R - 0.07, R - 0.07, 0.1 + lodo, 28]} />
		</mesh>
		{/* ponte com braço raspador */}
		<group rotation={[0, frame * 0.02, 0]}>
			<mesh material={m.ferro} position={[0, H + 0.25, 0]}>
				<boxGeometry args={[R * 2 + 0.6, 0.18, 0.5]} />
			</mesh>
			<mesh material={m.amarelo} position={[0, H + 0.6, 0]}>
				<cylinderGeometry args={[0.35, 0.35, 0.4, 10]} />
			</mesh>
		</group>
		{/* entrada e calha de saída */}
		<mesh material={m.cano} position={[-R - 1.5, 2.3, 0]} rotation={[0, 0, Math.PI / 2]}>
			<cylinderGeometry args={[0.45, 0.45, 3, 12]} />
		</mesh>
		<mesh material={m.concreto} position={[R + 0.3, H - 0.15, 0]}>
			<boxGeometry args={[1.3, 0.35, 1.6]} />
		</mesh>
		<mesh material={m.cano} position={[R + 7.8, 2.3, 0]} rotation={[0, 0, Math.PI / 2]}>
			<cylinderGeometry args={[0.45, 0.45, 12, 12]} />
		</mesh>
	</group>
);

const Particulas: React.FC<{m: X; n: number; frame: number; fps: number; topo: number; fundo: number; inicio: number}> = ({m, n, frame, fps, topo, fundo, inicio}) => (
	<>
		{Array.from({length: n}, (_, i) => {
			const t0 = inicio + rnd(i, 3) * 2.4 * fps;
			const v = ((0.55 + rnd(i, 4) * 0.7) / fps) * 1.6;
			const y = topo - Math.max(0, frame - t0) * v;
			if (frame < t0 || y <= fundo) return null;
			const a = rnd(i, 5) * 6.28;
			const r = Math.sqrt(rnd(i, 6)) * (R - 0.5);
			return (
				<mesh key={i} material={m.mancha} position={[Math.cos(a) * r, y, Math.sin(a) * r * 0.9]} rotation={[frame * 0.05 + i, i, 0]} scale={0.1 + rnd(i, 7) * 0.12}>
					<icosahedronGeometry args={[1, 0]} />
				</mesh>
			);
		})}
	</>
);

const Chao: React.FC<{m: X}> = ({m}) => (
	<mesh material={m.grama} position={[0, -0.65, 0]}>
		<boxGeometry args={[400, 0.1, 400]} />
	</mesh>
);

// ------------------------------------------------------------ rio, margens, ponte, peixes, captação
const XF = 126;
const Arvore: React.FC<{m: X; position: V3; s: number}> = ({m, position, s}) => (
	<group position={position} scale={s}>
		<mesh material={m.tronco} position={[0, 0.6, 0]}>
			<cylinderGeometry args={[0.18, 0.25, 1.2, 6]} />
		</mesh>
		<mesh material={m.arvore} position={[0, 1.9, 0]}>
			<coneGeometry args={[1.0, 1.9, 7]} />
		</mesh>
		<mesh material={m.arvore2} position={[0, 2.9, 0]}>
			<coneGeometry args={[0.7, 1.5, 7]} />
		</mesh>
	</group>
);
const Rio: React.FC<{m: X; frame: number; peixes: {x: number; f0: number; z: number}[]}> = ({m, frame, peixes}) => {
	const itens = useMemo(
		() => ({
			arv: Array.from({length: 46}, (_, i) => ({x: 3 + i * 2.7 + rnd(i) * 1.5, z: (i % 2 ? 1 : -1) * (i % 5 === 0 ? 5.2 + rnd(i, 2) : 6.5 + rnd(i, 2) * 9), s: 0.8 + rnd(i, 3) * 0.7})),
			ped: Array.from({length: 40}, (_, i) => ({x: 2 + i * 3.1 + rnd(i, 4) * 2, z: (i % 2 ? 1 : -1) * (2.3 + rnd(i, 5) * 0.8), s: 0.25 + rnd(i, 6) * 0.45})),
			esp: Array.from({length: 50}, (_, i) => ({x: i * 2.6 + rnd(i, 8) * 2, z: (rnd(i, 9) - 0.5) * 4.6, c: 0.8 + rnd(i, 10) * 1.4})),
		}),
		[],
	);
	return (
		<group>
			<mesh material={m.rio} position={[XF / 2 + 8, -0.35, 0]}>
				<boxGeometry args={[XF + 20, 0.7, 6]} />
			</mesh>
			{[1, -1].map((l) => (
				<group key={l}>
					<mesh material={m.terra} position={[XF / 2 + 8, -0.1, l * 3.3]}>
						<boxGeometry args={[XF + 20, 1.2, 0.8]} />
					</mesh>
					<mesh material={m.grama} position={[XF / 2 + 8, 0.52, l * 10]}>
						<boxGeometry args={[XF + 20, 0.1, 13]} />
					</mesh>
					<mesh material={m.areia} position={[XF / 2 + 8, 0.5, l * 3.6]}>
						<boxGeometry args={[XF + 20, 0.12, 0.7]} />
					</mesh>
				</group>
			))}
			{itens.esp.map((e, i) => (
				<mesh key={i} material={m.espuma} position={[e.x, 0.03, e.z]}>
					<boxGeometry args={[e.c, 0.02, 0.07]} />
				</mesh>
			))}
			{itens.ped.map((p, i) => (
				<mesh key={i} material={m.pedra} position={[p.x, p.s * 0.3, p.z]} rotation={[i, i * 2, 0]} scale={[p.s * 1.3, p.s, p.s]}>
					<icosahedronGeometry args={[1, 0]} />
				</mesh>
			))}
			{itens.arv.map((a, i) => (
				<Arvore key={i} m={m} position={[a.x, 0.55, a.z]} s={a.s} />
			))}
			{/* ponte */}
			<group position={[62, 0, 0]}>
				<mesh material={m.concreto} position={[0, 3.2, 0]}>
					<boxGeometry args={[3.2, 0.5, 15]} />
				</mesh>
				<mesh material={m.preto} position={[0, 3.5, 0]}>
					<boxGeometry args={[2.6, 0.06, 15]} />
				</mesh>
				{[1, -1].map((l) => (
					<mesh key={l} material={m.concreto} position={[0, 1.4, l * 3.6]}>
						<boxGeometry args={[2.4, 3.2, 1.0]} />
					</mesh>
				))}
			</group>
			{/* casa de bombas */}
			<group position={[XF + 18, 0, 0]}>
				<mesh material={m.tijolo} position={[0, 2.2, 0]}>
					<boxGeometry args={[9, 4.4, 9]} />
				</mesh>
				<mesh material={m.telhado} position={[0, 5.2, 0]} rotation={[0, Math.PI / 4, 0]}>
					<coneGeometry args={[7.5, 2.4, 4]} />
				</mesh>
				{[-2.5, 2.5].map((z) => (
					<mesh key={z} material={m.cano} position={[-1, 6.5, z]}>
						<cylinderGeometry args={[0.35, 0.35, 3, 10]} />
					</mesh>
				))}
			</group>
			{/* captação: muro, grade e tubo */}
			<mesh material={m.concreto} position={[XF + 1.2, 1.2, 0]}>
				<boxGeometry args={[2.4, 4.4, 7.4]} />
			</mesh>
			<mesh material={m.tubo} position={[XF + 8, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
				<cylinderGeometry args={[1.15, 1.15, 16, 14]} />
			</mesh>
			<mesh material={m.canoEscuro} position={[XF - 0.1, 0.5, 0]} rotation={[0, Math.PI / 2, 0]}>
				<torusGeometry args={[1.25, 0.18, 6, 16]} />
			</mesh>
			{[-0.9, -0.45, 0, 0.45, 0.9].map((z) => (
				<mesh key={z} material={m.ferro} position={[XF - 0.3, 0.5, z]}>
					<boxGeometry args={[0.1, 2.3, 0.1]} />
				</mesh>
			))}
			{peixes.map((p, i) => {
				const u = (frame - p.f0) / 26;
				if (u < 0 || u > 1) return null;
				const y = 2.4 * Math.sin(Math.PI * u);
				const ang = Math.atan2(2.4 * Math.PI * Math.cos(Math.PI * u), 5);
				return (
					<group key={i} position={[p.x + u * 5, y, p.z]} rotation={[0, 0, ang]}>
						<mesh material={m.peixe} scale={[1.1, 0.45, 0.35]}>
							<icosahedronGeometry args={[0.6, 0]} />
						</mesh>
						<mesh material={m.peixe} position={[-0.75, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
							<coneGeometry args={[0.3, 0.5, 4]} />
						</mesh>
						<mesh material={m.preto} position={[0.35, 0.1, 0.17]}>
							<sphereGeometry args={[0.07, 6, 6]} />
						</mesh>
					</group>
				);
			})}
		</group>
	);
};

const dd = (cena: CenaPeca) => (cena.dados ?? {}) as Record<string, number>;

// ------------------------------------------------------------ 1. sujeira afunda
const gCAfunda: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q} = useQ(cena.de);
	const m = useX();
	const fim = Math.round((cena.ate - cena.de) * fps);
	const lodo = interpolate(frame, [fps * 0.6, fim - 4], [0.02, 0.9], {...lim, easing: Easing.out(Easing.quad)});
	const cam = mix([0, 6.5, 21], [5.5, 5, 18], frame / fim);
	return (
		<PalcoC pos={cam} alvo={[0, 1.6, 0]}>
			<Chao m={m} />
			<Tanque m={m} lodo={lodo} frame={frame} />
			<Particulas m={m} n={44} frame={frame} fps={fps} topo={3.1} fundo={0.1 + lodo} inicio={q(dd(cena).afunda) - 8} />
			<Gota mats={m} humor="enjoada" suja={0.3 - 0.1 * (frame / fim)} quadro={frame} escala={0.7} position={[0, 1.9 + 0.12 * Math.sin(frame / 9), 0.3]} rotation={[0, 0.3 * Math.sin(frame / 20), 0]} />
		</PalcoC>
	);
};

// ------------------------------------------------------------ 2. sai por cima, decantação
const gCDecanta: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q} = useQ(cena.de);
	const m = useX();
	const d = dd(cena);
	const fim = Math.round((cena.ate - cena.de) * fps);
	const qSai = q(d.sai);
	const qDec = q(d.dec);
	const sobe = interpolate(frame, [0, qSai + 8], [0, 1], {...lim, easing: ease});
	const pCalha = interpolate(frame, [qSai + 8, qDec], [0, 1], {...lim, easing: ease});
	const pCano = interpolate(frame, [qDec, fim - 3], [0, 1], {...lim, easing: Easing.in(Easing.quad)});
	let pos: V3 = [0, 1.0 + 2.2 * sobe, 0.3 * (1 - sobe)];
	if (pCalha > 0) pos = [(R + 0.3) * pCalha, 3.2 + 0.4 * Math.sin(Math.PI * pCalha) + 0.3 * pCalha, 0];
	if (pCano > 0) pos = [R + 0.3 + pCano * 12.5, 2.3, 0];
	const suja = 0.15 * (1 - sobe);
	const cam = pCano > 0 ? mix([4, 5, 19], [14, 5, 15], pCano) : mix([2, 5.5, 20], [4, 5, 19], Math.min(1, frame / Math.max(1, qDec)));
	const alvo: V3 = pCano > 0 ? mix([R, 2.2, 0], [pos[0], 1.5, 0], pCano) : [pos[0] * 0.5, 1.8, 0];
	return (
		<PalcoC pos={cam} alvo={alvo} sobre={<Rotulo texto="DECANTAÇÃO" y={330} p={interpolate(frame, [qDec - 3, qDec + 8], [0, 1], lim)} tam={64} />}>
			<Chao m={m} />
			<Tanque m={m} lodo={0.9} frame={frame + 100} />
			<mesh material={m.rio} position={[40, -0.35, 0]}>
				<boxGeometry args={[50, 0.7, 6]} />
			</mesh>
			<Particulas m={m} n={10} frame={frame} fps={fps} topo={3.1} fundo={1.0} inicio={0} />
			<Gota mats={m} humor="aliviada" suja={suja} quadro={frame} escala={0.62} position={pos} rotation={[0, pCano > 0 ? Math.PI / 2 : 0.3 * Math.sin(frame / 15), 0]} />
		</PalcoC>
	);
};

// ------------------------------------------------------------ 3. rio
const xRio = (f: number, fim: number) => interpolate(f, [0, fim], [4, 118], {...lim, easing: Easing.bezier(0.3, 0.1, 0.7, 1)});
const gCRio: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps} = useQ(cena.de);
	const m = useX();
	const fim = Math.round((cena.ate - cena.de) * fps);
	const gx = xRio(frame, fim);
	const peixes = useMemo(() => {
		return [30, 50, 80, 100].map((fx, i) => {
			let f0 = 0;
			for (let f = 0; f < fim; f++) {
				if (xRio(f, fim) >= fx - 9) {
					f0 = f;
					break;
				}
			}
			return {x: fx, f0, z: (i % 2 ? 1 : -1) * 1.4};
		});
	}, [fim]);
	const gz = 0.9 * Math.sin(frame / 22);
	return (
		<PalcoC pos={[gx + 5, 3.4 + 0.4 * Math.sin(frame / 40), 8.6]} alvo={[gx + 3, 0.9, 0]}>
			<Chao m={m} />
			<Rio m={m} frame={frame} peixes={peixes} />
			{Array.from({length: 7}, (_, i) => (
				<mesh key={i} material={m.espuma} position={[gx - 1 - i * 0.55, 0.15 + 0.12 * Math.sin(frame / 3 + i), gz + 0.5 * Math.sin(i * 2)]} scale={0.14}>
					<icosahedronGeometry args={[1, 0]} />
				</mesh>
			))}
			<Gota mats={m} humor="feliz" suja={0} quadro={frame} escala={0.62} position={[gx, 0.8 + 0.12 * Math.sin(frame / 6), gz]} rotation={[0, Math.PI / 2 + 0.15 * Math.sin(frame / 10), 0]} />
		</PalcoC>
	);
};

// ------------------------------------------------------------ 4. captação
const gCCaptacao: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q} = useQ(cena.de);
	const m = useX();
	const fim = Math.round((cena.ate - cena.de) * fps);
	const x = frame < 40 ? interpolate(frame, [0, 14, 40], [118, 121, XF - 0.8], {...lim, easing: Easing.in(Easing.quad)}) : interpolate(frame, [40, fim - 4], [XF - 0.8, XF + 12], {...lim, easing: Easing.out(Easing.quad)});
	const qc = q(dd(cena).capt);
	const gz = frame < 40 ? 0.5 * Math.sin(frame / 8) * (1 - frame / 40) : 0;
	const camX = Math.min(x + 5, XF + 2 + (frame / fim) * 8);
	return (
		<PalcoC pos={[camX, 3.4, 8.6]} alvo={[Math.min(x + 2, XF + 8), 0.7, 0]} sobre={<Rotulo texto="CAPTAÇÃO" y={330} p={interpolate(frame, [qc - 3, qc + 8], [0, 1], lim)} tam={64} />}>
			<Chao m={m} />
			<Rio m={m} frame={frame} peixes={[]} />
			{Array.from({length: 9}, (_, i) => {
				const u = frac(frame * 0.045 + i / 9);
				return (
					<mesh key={i} material={m.succao} position={[XF - 9 + u * 9.5, 0.5 + (rnd(i, 2) - 0.5) * 2.4 * (1 - u), (rnd(i, 3) - 0.5) * 4.4 * (1 - u)]} rotation={[0, 0, -Math.PI / 2]} scale={[0.6, 0.6 + u, 0.6]}>
						<coneGeometry args={[0.2, 0.7, 5]} />
					</mesh>
				);
			})}
			<Gota mats={m} humor={frame > 20 ? 'assustada' : 'feliz'} suja={0} quadro={frame} escala={0.62} position={[x, 0.7 + (frame < 40 ? 0.1 * Math.sin(frame / 5) : 0), gz]} rotation={[0, Math.PI / 2, 0]} />
		</PalcoC>
	);
};

export const pecasC: Pecas = {gCAfunda, gCDecanta, gCRio, gCCaptacao};

export const cenasC = (b: Busca): Cena[] => {
	const ini = b.say('O que sobrou').inicio;
	const fimBloco = b.say('Na estação de água').inicio;
	const c1 = b.say('Você, mais limpa').inicio - 0.1;
	const c2 = b.say('Aí você é devolvida').inicio - 0.08;
	const c3 = b.say('Essa é a captação').inicio - 0.1;
	const t = {
		afunda: b.say('afunda').inicio,
		fundo: b.say('no fundo do tanque').inicio,
		sai: b.say('sai por cima').inicio,
		dec: b.say('a decantação').inicio + 0.1,
		rio: b.say('devolvida pro rio').inicio,
		km: b.say('quilômetros').inicio,
		bomba: b.say('por uma bomba').inicio,
		capt: b.say('a captação').inicio + 0.1,
	};
	const peca = (nomeP: string, de: number, ate: number, dados: Record<string, unknown>, sons: Cena['sons'] = []): Cena => ({tipo: 'peca', nome: nomeP, modo: 'cheia', de, ate, dados, sons});
	return [
		peca('gCAfunda', ini, c1, {afunda: t.afunda, marcos: [t.afunda, t.fundo]}, [{em: t.afunda, som: 'shimmer', ganho: 0.55}]),
		peca('gCDecanta', c1, c2, {sai: t.sai, dec: t.dec, marcos: [t.sai, t.dec]}, [
			{em: t.sai, som: 'pro_swipe', ganho: 0.55},
			{em: t.dec, som: 'pro_pop', ganho: 0.7},
		]),
		peca('gCRio', c2, c3, {marcos: [t.rio, t.km, t.bomba]}, [
			{em: c2 + 0.05, som: 'pro_whoosh', ganho: 0.6},
			{em: t.km, som: 'pro_whoosh_curto', ganho: 0.5},
			{em: t.bomba, som: 'rise', ganho: 0.5},
		]),
		peca('gCCaptacao', c3, fimBloco, {capt: t.capt, marcos: [t.capt]}, [{em: t.capt, som: 'pro_pop', ganho: 0.7}]),
	];
};
