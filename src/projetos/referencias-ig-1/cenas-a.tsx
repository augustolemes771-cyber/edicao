// Cenas do bloco A do referencias-ig-1 (peças + a lista de cenas que entram no edit.ts).
// Do "avião de 400 toneladas que não sai do chão" até "Essa é a tração": peso, asas, perfil da asa, sustentação e turbinas.
// Câmera própria (PalcoA) que anda a cada quadro; avião local (AviaoA) = fuselagem do aviao.tsx + asas que crescem e
// turbinas que penduram. dados: tempos em segundos do vídeo (a cena começa em cena.de).
import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import type {Busca} from '../../motor/palavras';
import type {Cena} from '../../motor/plano';
import type {CenaPeca, Pecas} from '../../pecas/peca';
import {Aviao, Chao, COR, lim, Nuvem, Rotulo, trilha, Turbina, useMateriais, useQ, type Materiais} from './aviao';

type V3 = [number, number, number];
const frac = (x: number) => x - Math.floor(x);
// pseudo-aleatório estável por índice
const rnd = (i: number, s = 1) => frac(Math.sin(i * 127.1 + s * 311.7) * 43758.5453);
const CEU_AR: [string, string] = ['#4f9fe0', '#bfe6ff'];

// ---------------------------------------------------------------- utilidades
const useCena = (cena: CenaPeca) => {
	const {frame, fps, q} = useQ(cena.de);
	const d = (cena.dados ?? {}) as Record<string, number>;
	const fim = Math.round((cena.ate - cena.de) * fps);
	const k = (nome: string) => q(d[nome]);
	const mola = (em: number, rigidez = 150, amort = 13) => spring({frame: frame - em, fps, config: {damping: amort, stiffness: rigidez}});
	const ease = (a: number, b: number) => interpolate(frame, [a, b], [0, 1], {...lim, easing: Easing.inOut(Easing.cubic)});
	return {frame, fps, q, k, d, fim, mola, ease, t: frame / fps};
};

// Tremor de câmera que morre depois do impacto (em quadros).
const tremor = (frame: number, em: number, amp: number, dur = 10) => {
	const x = frame - em;
	if (x < 0 || x > dur * 3) return 0;
	return amp * Math.exp(-x / dur) * Math.sin(x * 2.3);
};

// Distância percorrida com velocidade que muda (para pista e partículas não darem saltos).
const percorrido = (frame: number, vel: (f: number) => number) => {
	let s = 0;
	for (let f = 0; f < frame; f++) s += vel(f);
	return s;
};

const Camera: React.FC<{pos: V3; alvo: V3; fov: number}> = ({pos, alvo, fov}) => {
	const {camera} = useThree();
	const c = camera as THREE.PerspectiveCamera;
	c.position.set(pos[0], pos[1], pos[2]);
	c.fov = fov;
	c.lookAt(alvo[0], alvo[1], alvo[2]);
	c.updateProjectionMatrix();
	return null;
};

const PalcoA: React.FC<{children: React.ReactNode; camera: V3; alvo: V3; fov?: number; ceu?: [string, string]; sobre?: React.ReactNode; neblina?: number}> = ({
	children,
	camera,
	alvo,
	fov = 40,
	ceu = [COR.ceu1, COR.ceu2],
	sobre,
	neblina = 150,
}) => {
	const {width, height} = useVideoConfig();
	return (
		<AbsoluteFill style={{background: `linear-gradient(180deg, ${ceu[0]} 0%, ${ceu[1]} 72%)`}}>
			<ThreeCanvas width={width} height={height} gl={{alpha: true, antialias: true, preserveDrawingBuffer: true}} camera={{fov, position: camera, near: 0.1, far: 600}} style={{position: 'absolute', inset: 0}}>
				<Camera pos={camera} alvo={alvo} fov={fov} />
				<fog attach="fog" args={[ceu[1], neblina * 0.35, neblina]} />
				<ambientLight intensity={0.75} />
				<directionalLight position={[8, 14, 6]} intensity={1.6} />
				<directionalLight position={[-6, 4, -8]} intensity={0.45} />
				{children}
			</ThreeCanvas>
			{sobre}
		</AbsoluteFill>
	);
};

const useMatsA = () =>
	useMemo(
		() => ({
			asa: new THREE.MeshStandardMaterial({color: COR.cinza, flatShading: true, roughness: 0.75, metalness: 0.05}),
			ar: new THREE.MeshBasicMaterial({color: '#ffffff', transparent: true, opacity: 0.9}),
			arAzul: new THREE.MeshBasicMaterial({color: '#e9f8ff', transparent: true, opacity: 0.95}),
			quente: new THREE.MeshBasicMaterial({color: COR.laranja, transparent: true, opacity: 0.9}),
			quenteClaro: new THREE.MeshBasicMaterial({color: '#ffd29a', transparent: true, opacity: 0.9}),
			fumaca: new THREE.MeshStandardMaterial({color: '#c9ced6', flatShading: true, roughness: 1}),
			poeira: new THREE.MeshStandardMaterial({color: '#e8dcc4', flatShading: true, roughness: 1}),
			setaAzul: new THREE.MeshStandardMaterial({color: '#1f7fe0', flatShading: true, roughness: 0.6}),
			setaAmarela: new THREE.MeshStandardMaterial({color: COR.amarelo, flatShading: true, roughness: 0.6, emissive: '#7a5a00', emissiveIntensity: 0.25}),
			setaVermelha: new THREE.MeshStandardMaterial({color: COR.vermelho, flatShading: true, roughness: 0.6}),
			perfil: new THREE.MeshStandardMaterial({color: '#dfe4ea', flatShading: true, roughness: 0.7}),
			perfilFace: new THREE.MeshStandardMaterial({color: '#9aa6b5', flatShading: true, roughness: 0.7}),
			traco: new THREE.MeshBasicMaterial({color: COR.amarelo}),
			tracejado: new THREE.MeshBasicMaterial({color: '#ffffff'}),
		}),
		[],
	);
type MatsA = ReturnType<typeof useMatsA>;

// ---------------------------------------------------------------- avião local
// Asa de um lado: mesma planta do aviao.tsx, mas cresce sem amassar a turbina, que fica fora da escala e pode surgir de baixo.
const AsaA: React.FC<{lado: 1 | -1; m: Materiais; mat: THREE.Material; env: number; turbina: number; giro: number; mTurbina?: Materiais}> = ({lado, m, mat, env, turbina, giro, mTurbina}) => {
	const s = Math.max(0.001, env);
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
	const ang = Math.atan2(0.8, 5.6);
	const painel = (z0: number, z1: number) => ({z: (z0 + z1) / 2, x: (fuga(z0) + fuga(z1)) / 2, larg: z1 - z0});
	const F = painel(0.9, 3.4);
	const A = painel(3.7, 5.3);
	return (
		<>
			<group scale={[1, 1, s * lado]} position={[0, -0.25, 0]}>
				<mesh geometry={geo} material={mat} position={[0, 0.08, 0]} />
				{[F, A].map((p, i) => (
					<group key={i} position={[p.x, 0, p.z]} rotation={[0, -ang, 0]}>
						<mesh material={m.cinzaEscuro} position={[-0.3, -0.02, 0]}>
							<boxGeometry args={[0.6, 0.09, p.larg]} />
						</mesh>
					</group>
				))}
			</group>
			{turbina > 0.001 ? (
				<group position={[0, -(1 - Math.min(1, turbina)) * 2.6, 0]}>
					<Turbina m={mTurbina ?? m} pose={{giroTurbina: giro}} position={[0.9, -0.87, 2.3 * lado * Math.min(1, s)]} escala={Math.max(0.001, turbina)} />
				</group>
			) : null}
		</>
	);
};

// Avião completo do bloco A: fuselagem/cauda/trem do aviao.tsx + asas locais.
const AviaoA: React.FC<{
	m: Materiais;
	mats: MatsA;
	asas?: number;
	realce?: number;
	turbinas?: [number, number];
	giro?: number;
	compressao?: number;
	trem?: number;
	mTurbina?: Materiais;
}> = ({m, mats, asas = 1, realce = 0, turbinas = [0, 0], giro = 0, compressao = 0, trem = 1, mTurbina}) => {
	mats.asa.color.set(COR.cinza).lerp(new THREE.Color(COR.amarelo), Math.max(0, Math.min(1, realce)));
	return (
		<group>
			<Aviao m={m} pose={{semAsas: true, compressao, trem}} />
			{asas > 0.001 ? (
				<>
					<AsaA lado={1} m={m} mat={mats.asa} env={asas} turbina={turbinas[1]} giro={giro} mTurbina={mTurbina} />
					<AsaA lado={-1} m={m} mat={mats.asa} env={asas} turbina={turbinas[0]} giro={giro} mTurbina={mTurbina} />
				</>
			) : null}
		</group>
	);
};

// ---------------------------------------------------------------- efeitos 3D
const EIXO_Y = new THREE.Vector3(0, 1, 0);
const EIXO_X = new THREE.Vector3(1, 0, 0);

// Seta 3D (haste + ponta) saindo de `de` na direção `dir`; p de 0 a 1 faz ela crescer.
const Seta: React.FC<{de: V3; dir: V3; comp: number; raio?: number; mat: THREE.Material; p?: number}> = ({de, dir, comp, raio = 0.18, mat, p = 1}) => {
	if (p <= 0.001) return null;
	const q = new THREE.Quaternion().setFromUnitVectors(EIXO_Y, new THREE.Vector3(...dir).normalize());
	const L = comp * p;
	const ponta = Math.min(raio * 3.2, L * 0.6);
	const haste = Math.max(0.001, L - ponta);
	return (
		<group position={de} quaternion={q}>
			<mesh material={mat} position={[0, haste / 2, 0]}>
				<cylinderGeometry args={[raio * p, raio * p, haste, 10]} />
			</mesh>
			<mesh material={mat} position={[0, haste + ponta / 2, 0]}>
				<coneGeometry args={[raio * 2.3 * Math.min(1, p * 1.4), ponta, 10]} />
			</mesh>
		</group>
	);
};

// Riscos de ar andando por um caminho: caminho(i, u) dá a posição (u de 0 a 1); avanço = distância já andada (em voltas).
const Fluxo: React.FC<{n: number; avanco: number; caminho: (i: number, u: number) => V3; comp: number; esp?: number; mat: THREE.Material | ((i: number) => THREE.Material); p?: number}> = ({
	n,
	avanco,
	caminho,
	comp,
	esp = 0.05,
	mat,
	p = 1,
}) => {
	if (p <= 0.001) return null;
	return (
		<group>
			{Array.from({length: n}).map((_, i) => {
				const u = frac(i * 0.618034 + rnd(i, 3) * 0.3 + avanco);
				const a = caminho(i, u);
				const b = caminho(i, Math.min(1, u + 0.01));
				const v = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
				if (v.lengthSq() < 1e-9) v.set(-1, 0, 0);
				v.normalize();
				const q = new THREE.Quaternion().setFromUnitVectors(EIXO_X, v);
				const borda = Math.min(1, Math.sin(Math.PI * u) * 2.2);
				const L = Math.max(0.001, comp * borda * p);
				return (
					<mesh key={i} material={typeof mat === 'function' ? mat(i) : mat} position={[a[0] - (v.x * L) / 2, a[1] - (v.y * L) / 2, a[2] - (v.z * L) / 2]} quaternion={q}>
						<boxGeometry args={[L, esp * Math.min(1, p * 2), esp * Math.min(1, p * 2)]} />
					</mesh>
				);
			})}
		</group>
	);
};

// Nuvem de poeira que abre do ponto de impacto (p de 0 a 1).
const Poeira: React.FC<{p: number; origem: V3; mat: THREE.Material; n?: number; raio?: number}> = ({p, origem, mat, n = 9, raio = 1.6}) => {
	if (p <= 0 || p >= 1) return null;
	const r = raio * (1 - Math.pow(1 - p, 3));
	return (
		<group position={origem}>
			{Array.from({length: n}).map((_, i) => {
				const a = (i / n) * Math.PI * 2 + rnd(i) * 0.5;
				const s = (0.28 + 0.22 * rnd(i, 2)) * Math.sin(Math.PI * Math.min(1, p * 1.15));
				return (
					<mesh key={i} material={mat} position={[Math.cos(a) * r, 0.15 + p * 0.5 * rnd(i, 4), Math.sin(a) * r]} scale={Math.max(0.001, s)}>
						<icosahedronGeometry args={[1, 0]} />
					</mesh>
				);
			})}
		</group>
	);
};

// Fumaça contínua saindo de um ponto (t em segundos desde que começou).
const Fumaca: React.FC<{t: number; origem: V3; dir: V3; mat: THREE.Material; n?: number; alcance?: number; tam?: number}> = ({t, origem, dir, mat, n = 10, alcance = 4, tam = 0.5}) => {
	if (t <= 0) return null;
	return (
		<group position={origem}>
			{Array.from({length: n}).map((_, i) => {
				const idade = frac(i / n + t * 0.9);
				if (idade > t * 0.9) return null;
				const s = tam * (0.3 + idade) * Math.sin(Math.PI * Math.min(1, idade * 1.05));
				return (
					<mesh
						key={i}
						material={mat}
						position={[dir[0] * idade * alcance, dir[1] * idade * alcance + idade * idade * 0.8, dir[2] * idade * alcance + (rnd(i) - 0.5) * idade]}
						rotation={[i, i * 2, 0]}
						scale={Math.max(0.001, s)}
					>
						<icosahedronGeometry args={[1, 0]} />
					</mesh>
				);
			})}
		</group>
	);
};

// Nuvens passando (andam para −X com o avanço).
const Nuvens: React.FC<{m: Materiais; avanco: number; y?: number; espalhar?: number}> = ({m, avanco, y = 0, espalhar = 1}) => (
	<group>
		{Array.from({length: 9}).map((_, i) => {
			const x = 60 - frac(rnd(i, 7) + avanco / 120) * 120;
			const z = (rnd(i, 8) - 0.6) * 40 * espalhar;
			const yy = y + (rnd(i, 9) - 0.5) * 14 * espalhar;
			return <Nuvem key={i} m={m} position={[x, yy, z]} escala={1.6 + rnd(i, 5) * 1.8} />;
		})}
	</group>
);

// ---------------------------------------------------------------- perfil da asa (aerofólio)
const CORDA = 4.4;
const VAO = 2.6;
const pontosPerfil = (n = 48) => {
	const mC = 0.065;
	const pC = 0.4;
	const tE = 0.15;
	const cima: [number, number][] = [];
	const baixo: [number, number][] = [];
	for (let k = 0; k <= n; k++) {
		const xc = (1 - Math.cos((Math.PI * k) / n)) / 2;
		const yc = xc < pC ? (mC / (pC * pC)) * (2 * pC * xc - xc * xc) : (mC / ((1 - pC) * (1 - pC))) * (1 - 2 * pC + 2 * pC * xc - xc * xc);
		const yt = 5 * tE * (0.2969 * Math.sqrt(xc) - 0.126 * xc - 0.3516 * xc * xc + 0.2843 * xc ** 3 - 0.1036 * xc ** 4);
		cima.push([CORDA * (0.5 - xc), CORDA * (yc + yt) - 0.15]);
		baixo.push([CORDA * (0.5 - xc), CORDA * (yc - yt) - 0.15]);
	}
	return {cima, baixo};
};

const Perfil: React.FC<{mats: MatsA; traco: number; inclina: number; escala: number}> = ({mats, traco, inclina, escala}) => {
	const {geo, tubo, segs} = useMemo(() => {
		const {cima, baixo} = pontosPerfil();
		const sh = new THREE.Shape();
		sh.moveTo(cima[0][0], cima[0][1]);
		cima.forEach(([x, y]) => sh.lineTo(x, y));
		[...baixo].reverse().forEach(([x, y]) => sh.lineTo(x, y));
		sh.closePath();
		const g = new THREE.ExtrudeGeometry(sh, {depth: VAO, bevelEnabled: false, curveSegments: 4});
		g.translate(0, 0, -VAO / 2);
		const curva = new THREE.CatmullRomCurve3(cima.map(([x, y]) => new THREE.Vector3(x, y + 0.03, VAO / 2 + 0.03)));
		const s = 96;
		const t = new THREE.TubeGeometry(curva, s, 0.075, 6, false);
		return {geo: g, tubo: t, segs: s};
	}, []);
	tubo.setDrawRange(0, Math.floor(Math.max(0, Math.min(1, traco)) * segs) * 6 * 6);
	// gira em torno do bordo de ataque (frente, +X)
	const xa = CORDA / 2;
	return (
		<group scale={Math.max(0.001, escala)}>
			<group position={[xa, 0, 0]} rotation={[0, 0, inclina]}>
				<group position={[-xa, 0, 0]}>
					<mesh geometry={geo} material={[mats.perfilFace, mats.perfil]} />
					{traco > 0.001 ? <mesh geometry={tubo} material={mats.traco} /> : null}
				</group>
			</group>
		</group>
	);
};

// ---------------------------------------------------------------- textos HTML
const fonte = 'Montserrat, Poppins, sans-serif';

const Contador: React.FC<{valor: number; p: number; tremer: number}> = ({valor, p, tremer}) => {
	if (p <= 0.001) return null;
	return (
		<div style={{position: 'absolute', top: 250, width: '100%', textAlign: 'center', opacity: Math.min(1, p * 1.6), transform: `translate(${tremer * 30}px, ${(1 - p) * 40}px) scale(${0.7 + 0.3 * p})`}}>
			<div style={{fontFamily: fonte, fontWeight: 900, fontSize: 190, lineHeight: 1, color: '#fff', textShadow: '0 10px 0 #1d3557, 0 18px 30px rgba(0,0,0,0.35)'}}>{Math.round(valor)}</div>
			<span style={{display: 'inline-block', marginTop: 26, padding: '10px 30px', borderRadius: 40, background: '#1d3557', color: '#fff', fontFamily: fonte, fontWeight: 900, fontSize: 50, letterSpacing: '0.08em'}}>TONELADAS</span>
		</div>
	);
};

const Carimbo: React.FC<{p: number}> = ({p}) => {
	if (p <= 0.001) return null;
	return (
		<div style={{position: 'absolute', top: 300, width: '100%', display: 'flex', justifyContent: 'center', opacity: Math.min(1, p * 2)}}>
			<svg width={200} height={200} viewBox="0 0 200 200" style={{transform: `scale(${0.4 + 0.6 * p}) rotate(${(1 - p) * -40}deg)`, filter: 'drop-shadow(0 12px 18px rgba(0,0,0,0.3))'}}>
				<circle cx={100} cy={100} r={92} fill={COR.vermelho} stroke="#fff" strokeWidth={10} />
				<path d="M62 62 L138 138 M138 62 L62 138" stroke="#fff" strokeWidth={22} strokeLinecap="round" />
			</svg>
		</div>
	);
};

// Velocímetro (sem número): ponteiro de 0 a 1.
const Velocimetro: React.FC<{v: number; p: number}> = ({v, p}) => {
	if (p <= 0.001) return null;
	const ang = -120 + 240 * Math.max(0, Math.min(1, v));
	const arco = (a0: number, a1: number, r: number) => {
		const pt = (a: number) => [150 + r * Math.sin((a * Math.PI) / 180), 160 - r * Math.cos((a * Math.PI) / 180)];
		const [x0, y0] = pt(a0);
		const [x1, y1] = pt(a1);
		return `M${x0} ${y0} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
	};
	return (
		<div style={{position: 'absolute', top: 250, width: '100%', display: 'flex', justifyContent: 'center', opacity: Math.min(1, p * 1.6), transform: `scale(${0.7 + 0.3 * p})`}}>
			<svg width={330} height={260} viewBox="0 0 300 240" style={{filter: 'drop-shadow(0 12px 20px rgba(0,0,0,0.3))'}}>
				<circle cx={150} cy={160} r={140} fill="#1d3557" />
				<path d={arco(-120, 40, 112)} stroke="#ffffff" strokeWidth={22} fill="none" strokeLinecap="round" />
				<path d={arco(40, 120, 112)} stroke={COR.vermelho} strokeWidth={22} fill="none" strokeLinecap="round" />
				<g transform={`rotate(${ang} 150 160)`}>
					<path d="M143 160 L150 62 L157 160 Z" fill={COR.amarelo} />
				</g>
				<circle cx={150} cy={160} r={16} fill={COR.amarelo} />
			</svg>
		</div>
	);
};

// ---------------------------------------------------------------- 1. peso: avião de 400 toneladas paira, pesa e desce na pista
// fase 1: paira e o contador sobe até 400 (afunda com o peso); fase 2: câmera baixa, ele cai na pista e levanta poeira.
const CenaPeso: React.FC<{cena: CenaPeca; fase: 1 | 2}> = ({cena, fase}) => {
	const {frame, fps, k, fim, mola} = useCena(cena);
	const m = useMateriais();
	const mats = useMatsA();
	const qT = fase === 1 ? k('toneladas') : -999;
	const qP = fase === 2 ? k('pista') : 99999;
	const conta = interpolate(frame, [qT, qT + 0.8 * fps], [0, 400], {...lim, easing: Easing.out(Easing.cubic)});
	const peso = fase === 1 ? conta / 400 : 1;
	const queda = interpolate(frame, [qP - 9, qP], [0, 1], {...lim, easing: Easing.in(Easing.quad)});
	const imp = frame - qP;
	const pousou = imp >= 0;
	const comp = pousou ? Math.min(1, 0.6 + 0.5 * Math.exp(-imp / 6) * Math.cos(imp * 0.8)) : 0;
	const alto = (3.6 - 1.2 * peso + Math.sin(frame / 8) * 0.12) * (1 - queda);
	const y = pousou ? -0.25 * comp : alto;
	const tr = tremor(frame, qP, 0.35, 6);
	const cam =
		fase === 1
			? trilha(frame, [
					[0, [17, 10, 26]],
					[fim, [21, 8.5, 21]],
				])
			: trilha(frame, [
					[0, [15, 2.2, 7]],
					[fim, [13.5, 1.8, 8.5]],
				]);
	const entrada = fase === 1 ? mola(0, 120, 14) : 1;
	return (
		<PalcoA
			camera={[cam[0] + tr * 0.5, cam[1] + tr, cam[2]]}
			alvo={fase === 1 ? [0.4, 1.6, 0] : [0, 0.6, 0]}
			fov={40}
			sobre={fase === 1 ? <Contador valor={conta} p={mola(qT - 3, 160, 12)} tremer={0} /> : null}
		>
			<Chao m={m} />
			<group position={[0, y, 0]} scale={0.6 + 0.4 * entrada} rotation={[pousou ? 0 : Math.sin(frame / 10) * 0.03, 0, 0]}>
				<AviaoA m={m} mats={mats} asas={0} compressao={comp} />
			</group>
			<Poeira p={imp / (0.9 * fps)} origem={[-0.6, -1.55, 0]} mat={mats.poeira} raio={2.6} n={11} />
			<Poeira p={imp / (0.8 * fps)} origem={[3.4, -1.55, 0]} mat={mats.poeira} raio={1.6} n={7} />
		</PalcoA>
	);
};
const igAPeso: React.FC<{cena: CenaPeca}> = ({cena}) => <CenaPeso cena={cena} fase={1} />;
const igAPista: React.FC<{cena: CenaPeca}> = ({cena}) => <CenaPeso cena={cena} fase={2} />;

// ---------------------------------------------------------------- 2. não sai do chão: corre na pista e o nariz não sobe
const igAChao: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, k, fim, mola} = useCena(cena);
	const m = useMateriais();
	const mats = useMatsA();
	const qS = k('sai');
	const qC = k('chao');
	const vel = (f: number) => (6 + 14 * (f / fps)) / fps;
	const desl = percorrido(frame, vel);
	// tenta levantar o nariz e bate de volta
	const nariz = interpolate(frame, [qS - 2, qS + 5, qC], [0, 0.075, 0], {...lim, easing: Easing.inOut(Easing.quad)});
	const imp = frame - qC;
	const comp = imp >= 0 ? 0.35 + 0.45 * Math.exp(-imp / 5) * Math.cos(imp * 0.9) : 0.35;
	const vib = Math.sin(frame * 2.7) * 0.015;
	const tr = tremor(frame, qC, 0.22, 6);
	const cam = trilha(frame, [
		[0, [15, 2.6, 8.5]],
		[fim, [12.5, 1.6, 6.5]],
	]);
	return (
		<PalcoA camera={[cam[0], cam[1] + tr, cam[2] + tr * 0.4]} alvo={[0, 0.1, 0]} fov={40} sobre={<Carimbo p={mola(qC, 190, 11)} />}>
			<Chao m={m} deslocamento={desl} />
			<group position={[-0.6, -1.0 - 0.25 * comp + vib, 0]} rotation={[0, 0, nariz]}>
				<group position={[0.6, 1.0, 0]}>
					<AviaoA m={m} mats={mats} asas={0} compressao={comp} />
				</group>
			</group>
			<Fluxo
				n={16}
				avanco={desl / 16}
				comp={1.6}
				esp={0.05}
				mat={mats.ar}
				caminho={(i, u) => [9 - 20 * u, -0.6 + rnd(i, 1) * 2.4, (rnd(i, 2) - 0.5) * 5]}
			/>
			<Poeira p={imp / (0.8 * fps)} origem={[3.4, -1.55, 0]} mat={mats.poeira} raio={1.8} n={8} />
		</PalcoA>
	);
};

// ---------------------------------------------------------------- 3. só o motor: turbina faz força, fumaça, e a seta do peso esmaga
const igAMotor: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, k, fim, mola} = useCena(cena);
	const m = useMateriais();
	const mats = useMatsA();
	const qM = k('motor');
	const qL = k('levanta');
	const qP = k('peso');
	const liga = mola(qM, 170, 12);
	const giro = percorrido(frame, (f) => Math.min(0.9, Math.max(0, f - qM) * 0.035));
	const forca = interpolate(frame, [qM, qM + 12], [0, 1], lim);
	const nariz = interpolate(frame, [qL - 2, qL + 7, qL + 14, qL + 20], [0, 0.05, -0.008, 0], lim);
	const pS = mola(qP, 210, 15);
	const imp = frame - qP;
	const comp = imp >= 0 ? Math.min(1, 0.85 + 0.3 * Math.exp(-imp / 5) * Math.cos(imp)) : 0.3 * forca;
	const vib = Math.sin(frame * 3.1) * 0.025 * forca;
	const tr = tremor(frame, qP, 0.3, 6);
	const cam = trilha(frame, [
		[0, [-14.5, 3.2, 7.5]],
		[fim, [-12.5, 2.4, 9.5]],
	]);
	const tz = 0.95;
	const traseira: V3 = [0.6 - 0.75 * tz, -1.02, 0];
	return (
		<PalcoA camera={[cam[0], cam[1] + tr, cam[2]]} alvo={[0, 0.5, 0]} fov={40}>
			<Chao m={m} />
			<group position={[-0.6, -1.0 - 0.25 * comp + vib, 0]} rotation={[0, 0, nariz]}>
				<group position={[0.6, 1.0, 0]}>
					<AviaoA m={m} mats={mats} asas={0} compressao={comp} />
					<group position={[0, -(1 - Math.min(1, liga)) * 1.2, 0]}>
						<Turbina m={m} pose={{giroTurbina: giro}} position={[0.6, -1.02, 0]} escala={Math.max(0.001, liga * tz)} />
					</group>
				</group>
			</group>
			<Fluxo n={14} avanco={(frame - qM) / 9} comp={1.4} esp={0.09} mat={(i) => (i % 2 ? mats.quente : mats.quenteClaro)} p={forca} caminho={(i, u) => [traseira[0] - 7 * u, traseira[1] + (rnd(i) - 0.5) * 0.5 * (0.4 + u), (rnd(i, 2) - 0.5) * 0.5 * (0.4 + u)]} />
			<Fumaca t={(frame - qM - 4) / fps} origem={[traseira[0] - 1, -1.2, 0]} dir={[-1, 0.15, 0]} mat={mats.fumaca} alcance={5} tam={0.7} n={12} />
			<Seta de={[0.4, 5.2 + (1 - pS) * 8, 0]} dir={[0, -1, 0]} comp={3.6} raio={0.32} mat={mats.setaVermelha} p={Math.min(1, pS * 1.2)} />
			<Poeira p={imp / (0.8 * fps)} origem={[-0.6, -1.55, 0]} mat={mats.poeira} raio={2.2} n={9} />
		</PalcoA>
	);
};

// ---------------------------------------------------------------- 4. duas asas enormes crescem do corpo
const igAAsas: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, k, fim, mola} = useCena(cena);
	const m = useMateriais();
	const mats = useMatsA();
	const qD = k('duas');
	const qA = k('asas');
	const qE = k('enormes');
	const qL = k('lados');
	const toco = 0.14 * mola(qD, 200, 12);
	const cresce = mola(qA, 70, 9);
	const pulso = interpolate(frame, [qE - 2, qE + 5, qE + 16], [0, 0.16, 0], {...lim, easing: Easing.inOut(Easing.quad)});
	const asas = toco + (1 - 0.14) * cresce + pulso;
	const realce = interpolate(frame, [qD, qD + 4, qL + 6, qL + 20], [0, 1, 1, 0], lim);
	const cam = trilha(frame, [
		[0, [14, 17, 14]],
		[qL - 4, [10, 15, 17]],
		[fim, [19, 9, 9]],
	]);
	return (
		<PalcoA camera={cam} alvo={[0, -0.6, 0]} fov={40}>
			<Chao m={m} />
			<AviaoA m={m} mats={mats} asas={asas} realce={realce} />
		</PalcoA>
	);
};

// ---------------------------------------------------------------- 5 e 6. perfil da asa: curvado em cima, depois inclinado
const CenaPerfil: React.FC<{cena: CenaPeca; fase: 1 | 2}> = ({cena, fase}) => {
	const {frame, fps, k, fim, mola} = useCena(cena);
	const m = useMateriais();
	const mats = useMatsA();
	const traco = fase === 1 ? interpolate(frame, [k('curvadas'), k('curvadas') + 0.6 * fps], [0, 1], {...lim, easing: Easing.inOut(Easing.cubic)}) : 1;
	const qI = fase === 2 ? k('inclinadas') : 0;
	const qC = fase === 2 ? k('cima') : 0;
	const inclina = fase === 2 ? 0.2 * mola(qI, 90, 11) + 0.04 * Math.sin(Math.max(0, frame - qC) / 3) * Math.exp(-Math.max(0, frame - qC) / 8) * (frame > qC ? 1 : 0) : 0;
	const entra = fase === 1 ? mola(0, 140, 13) : 1;
	const arco = fase === 2 ? mola(qI + 4, 120, 14) : 0;
	const cam = fase === 1
		? trilha(frame, [
				[0, [4.5, 3.2, 12.5]],
				[fim, [1.6, 1.6, 11.5]],
			])
		: trilha(frame, [
				[0, [-1.8, 0.9, 12.2]],
				[fim, [1.2, 2.2, 12.6]],
			]);
	const xa = CORDA / 2;
	return (
		<PalcoA camera={cam} alvo={[0, -0.2, 0]} fov={40} ceu={CEU_AR} neblina={90}>
			<Nuvens m={m} avanco={frame / 2} y={-2} espalhar={0.8} />
			<group position={[0, 0, 0]}>
				<Perfil mats={mats} traco={traco} inclina={inclina} escala={entra} />
				{fase === 2 ? (
					<group position={[xa, -0.15 + 0.15 * 0, VAO / 2 + 0.05]}>
						{/* linha de referência (horizontal) tracejada */}
						{Array.from({length: 11}).map((_, i) => (
							<mesh key={i} material={mats.tracejado} position={[-0.25 - i * 0.5, 0, 0]}>
								<boxGeometry args={[0.28, 0.05, 0.05]} />
							</mesh>
						))}
						{/* arco do ângulo */}
						{arco > 0.01 ? (
							<mesh material={mats.traco} rotation={[0, 0, Math.PI]}>
								<torusGeometry args={[3.6, 0.06, 6, 30, Math.max(0.01, inclina * Math.min(1, arco))]} />
							</mesh>
						) : null}
					</group>
				) : null}
			</group>
		</PalcoA>
	);
};
const igAPerfil: React.FC<{cena: CenaPeca}> = ({cena}) => <CenaPerfil cena={cena} fase={1} />;
const igAInclina: React.FC<{cena: CenaPeca}> = ({cena}) => <CenaPerfil cena={cena} fase={2} />;

// Caminho de um risco de ar passando pela asa na posição de envergadura z (cima ou embaixo) e descendo atrás dela.
const caminhoAsa = (z: number, cima: boolean, desvio: number, queda: number) => (u: number): V3 => {
	const x = 7 - 15 * u;
	const ba = 1.2 - 2.1 * (z / 5.6);
	const bf = -1.2 - 0.8 * (z / 5.6);
	const base = cima ? 0.18 + desvio : -0.62 - desvio;
	let y = base;
	if (x < ba && x > bf) y += (cima ? 0.22 : 0.05) * Math.sin((Math.PI * (ba - x)) / (ba - bf));
	if (x <= bf) y -= (bf - x) * queda;
	if (x > ba) y -= (x - ba) * queda * 0.15;
	return [x, Math.max(-1.45, y), z];
};

// ---------------------------------------------------------------- 7. a asa empurra o ar pra baixo
const igAEmpurra: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, k, fim, mola} = useCena(cena);
	const m = useMateriais();
	const mats = useMatsA();
	const qC = k('corre');
	const qE = k('empurra');
	const qB = k('baixo');
	const vel = (f: number) => (f < qC ? 5 : 5 + Math.min(15, (f - qC) * 0.6)) / fps;
	const desl = percorrido(frame, vel);
	const ar = mola(qE - 4, 120, 14);
	const queda = interpolate(frame, [qE, qB + 6], [0.15, 0.55], lim);
	const pB = mola(qB, 160, 12);
	const cam = trilha(frame, [
		[0, [3.5, 2.6, 15]],
		[fim, [0.5, 1.4, 13.5]],
	]);
	return (
		<PalcoA camera={cam} alvo={[-0.8, -0.3, 2.6]} fov={40}>
			<Chao m={m} deslocamento={desl} />
			<group position={[0, Math.sin(frame * 2.5) * 0.01, 0]}>
				<AviaoA m={m} mats={mats} asas={1} compressao={0.3} />
			</group>
			<Fluxo
				n={30}
				avanco={desl / 9}
				comp={1.1}
				esp={0.06}
				mat={mats.arAzul}
				p={ar}
				caminho={(i, u) => caminhoAsa(1.2 + (i % 5) * 0.85, i % 2 === 0, (rnd(i) - 0.2) * 0.35, queda)(u)}
			/>
			<Seta de={[-3.2, 0.4, 3.0]} dir={[-0.25, -1, 0]} comp={1.75} raio={0.2} mat={mats.setaAzul} p={pB} />
		</PalcoA>
	);
};

// ---------------------------------------------------------------- 8. o ar empurra o avião pra cima (sai do chão)
const igASobe: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, k, fim, mola} = useCena(cena);
	const m = useMateriais();
	const mats = useMatsA();
	const qA = k('ar');
	const qC = k('cima');
	const desl = percorrido(frame, () => 20 / fps);
	const sobe = interpolate(frame, [qC - 4, fim - 8], [0, 1], {...lim, easing: Easing.inOut(Easing.quad)});
	const y = 3.4 * sobe;
	const nariz = 0.1 * Math.min(1, sobe * 3) * (1 - 0.4 * sobe);
	const pA = mola(qA, 140, 12);
	const grande = mola(qC, 120, 10);
	const cam = trilha(frame, [
		[0, [14, 0.6, 9]],
		[fim, [13, 2.6, 10]],
	]);
	return (
		<PalcoA camera={cam} alvo={[0, -0.1 + y * 0.85, 0]} fov={40}>
			<Chao m={m} deslocamento={desl} />
			<group position={[0, y, 0]} rotation={[0, 0, nariz]}>
				<AviaoA m={m} mats={mats} compressao={0.3 * (1 - sobe)} />
				{[1, -1].map((l) => (
					<Seta key={l} de={[-0.4, -1.55 - grande * 0.5, l * 3.0]} dir={[0, 1, 0]} comp={1.1 + grande * 0.6} raio={0.17 + grande * 0.05} mat={mats.setaAmarela} p={pA} />
				))}
			</group>
			<Fluxo
				n={20}
				avanco={desl / 10}
				comp={1.0}
				esp={0.06}
				mat={mats.arAzul}
				p={pA}
				caminho={(i, u) => {
					const [x, yy, z] = caminhoAsa(1.2 + (i % 5) * 0.85, i % 2 === 0, (rnd(i) - 0.2) * 0.35, 0.45)(u);
					return [x, yy + y, z * (i % 4 < 2 ? 1 : -1)];
				}}
			/>
		</PalcoA>
	);
};

// ---------------------------------------------------------------- 9. essa é a sustentação
const igASustentacao: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, k, fim, mola} = useCena(cena);
	const m = useMateriais();
	const mats = useMatsA();
	const qS = k('sustentacao');
	const pulso = 0.5 + 0.5 * Math.sin(frame / 4);
	const pA = mola(0, 150, 12);
	const cam = trilha(frame, [
		[0, [12, 3.5, 12]],
		[fim, [7, 6, 15]],
	]);
	const bob = Math.sin(frame / 12) * 0.25;
	return (
		<PalcoA camera={cam} alvo={[0, 0.6, 0]} fov={40} ceu={CEU_AR} neblina={140} sobre={<Rotulo texto="SUSTENTAÇÃO" y={330} p={mola(qS - 3, 170, 12)} tam={64} />}>
			<group position={[0, -40, 0]}>
				<Chao m={m} pista={false} deslocamento={frame * 0.6} />
			</group>
			<Nuvens m={m} avanco={frame * 0.9} y={-3} />
			<group position={[0, bob, 0]} rotation={[0.04 * Math.sin(frame / 15), 0, 0.03]}>
				<AviaoA m={m} mats={mats} trem={0} realce={0.25 * pulso * (frame > qS ? 1 : 0.4)} />
				{[1, -1].map((l) => (
					<Seta key={l} de={[-0.6, 0.2, l * 3.1]} dir={[0, 1, 0]} comp={2.1 + 0.35 * pulso} raio={0.22} mat={mats.setaAmarela} p={pA} />
				))}
			</group>
		</PalcoA>
	);
};

// ---------------------------------------------------------------- 10. o ar tem que passar muito rápido pela asa
const igAVento: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, k, fim, mola} = useCena(cena);
	const m = useMateriais();
	const mats = useMatsA();
	const qA = k('ar');
	const qM = k('muito');
	const qR = k('rapido');
	const rapidez = (f: number) => interpolate(f, [0, qA, qM, qR + 6], [0.15, 0.25, 0.5, 1], {...lim, easing: Easing.inOut(Easing.quad)});
	const avanco = percorrido(frame, (f) => (0.15 + rapidez(f) * 1.6) / fps);
	const r = rapidez(frame);
	const tr = r > 0.9 ? Math.sin(frame * 3.3) * 0.04 : 0;
	const cam = trilha(frame, [
		[0, [6.5, 3.4, 10.5]],
		[fim, [4.5, 2.2, 9.5]],
	]);
	return (
		<PalcoA camera={[cam[0], cam[1] + tr, cam[2]]} alvo={[-0.6, -0.4, 3.2]} fov={40} ceu={CEU_AR} neblina={140} sobre={<Velocimetro v={r} p={mola(qA - 4, 150, 13)} />}>
			<Nuvens m={m} avanco={avanco * 60} y={-6} />
			<group position={[0, Math.sin(frame / 12) * 0.1, 0]}>
				<AviaoA m={m} mats={mats} trem={0} />
			</group>
			<Fluxo
				n={34}
				avanco={avanco}
				comp={0.5 + 2.6 * r}
				esp={0.06}
				mat={mats.ar}
				caminho={(i, u) => caminhoAsa(0.9 + (i % 7) * 0.68, i % 2 === 0, (rnd(i) - 0.2) * 0.4, 0.12)(u)}
			/>
		</PalcoA>
	);
};

// ---------------------------------------------------------------- 11. turbinas penduradas embaixo da asa
const igAPendura: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, k, fim, mola} = useCena(cena);
	const m = useMateriais();
	const mats = useMatsA();
	const q1 = k('turbina1');
	const q2 = k('turbina2');
	const qT = k('turbinas');
	const p1 = mola(q1, 150, 11);
	const p2 = mola(q2, 150, 11);
	const flash = interpolate(frame, [qT - 1, qT + 3, qT + 12], [0, 1, 0], lim);
	const mT = useMemo(() => ({...m, branco: m.amarelo}), [m]);
	const cam = trilha(frame, [
		[0, [11, -4.5, 9]],
		[fim, [12.5, -3.2, 5.5]],
	]);
	return (
		<PalcoA camera={cam} alvo={[0, -0.6, 0]} fov={40} ceu={CEU_AR} neblina={140}>
			<Nuvens m={m} avanco={frame * 0.9} y={-8} />
			<group position={[0, Math.sin(frame / 12) * 0.1, 0]}>
				<AviaoA m={m} mats={mats} trem={0} turbinas={[p1, p2]} giro={frame * 0.4} mTurbina={flash > 0.35 ? mT : m} />
			</group>
		</PalcoA>
	);
};

// ---------------------------------------------------------------- 12. a turbina suga pela frente e cospe pra trás
const igATurbina: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, k, fim, mola} = useCena(cena);
	const m = useMateriais();
	const mats = useMatsA();
	const qS = k('sugam');
	const qC = k('cospem');
	const qF = k('forca');
	const E = 2.5;
	const entra = mola(0, 140, 13);
	const pS = mola(qS - 2, 120, 14);
	const pC = mola(qC, 150, 12);
	const forte = interpolate(frame, [qF - 2, qF + 8], [0, 1], {...lim, easing: Easing.out(Easing.quad)});
	const giro = percorrido(frame, () => 0.45 + 0.25 * forte);
	const vIn = percorrido(frame, () => (0.6 + 0.4 * forte) / fps);
	const vOut = percorrido(frame, () => (0.9 + 0.9 * forte) / fps);
	const tr = tremor(frame, qF, 0.18, 10) + forte * Math.sin(frame * 3.1) * 0.03;
	const cam = trilha(frame, [
		[0, [7.5, 1.4, 6.5]],
		[qC - 2, [5.5, 1.0, 8.5]],
		[fim, [0.5, 1.2, 10.5]],
	]);
	const alvo = trilha(frame, [
		[0, [1.0, 0, 0]],
		[qC - 2, [0.2, 0, 0]],
		[fim, [-1.6, 0, 0]],
	]);
	const boca = 0.74 * E;
	const fundo = -0.75 * E;
	return (
		<PalcoA camera={[cam[0], cam[1] + tr, cam[2]]} alvo={alvo} fov={40} ceu={CEU_AR} neblina={140}>
			<Nuvens m={m} avanco={frame * 1.5} y={-6} />
			<group scale={entra}>
				{/* pedaço da asa em cima da turbina */}
				<mesh material={m.cinza} position={[-0.2, 0.65 * E + 0.18, 0]}>
					<boxGeometry args={[4.6, 0.32, 7]} />
				</mesh>
				<Turbina m={m} pose={{giroTurbina: giro}} position={[0, 0, 0]} escala={E} />
			</group>
			{/* ar entrando pela frente (afunila para a boca) */}
			<Fluxo
				n={26}
				avanco={vIn}
				comp={0.9}
				esp={0.07}
				mat={mats.arAzul}
				p={pS}
				caminho={(i, u) => {
					const a = rnd(i, 1) * Math.PI * 2;
					const r0 = 1.4 + rnd(i, 2) * 2.2;
					const r1 = 0.25 + rnd(i, 3) * 0.6;
					const r = r0 + (r1 - r0) * Math.pow(u, 0.8);
					return [boca + 7 - 7.6 * u, r * Math.cos(a), r * Math.sin(a)];
				}}
			/>
			{/* jato quente saindo por trás */}
			<Fluxo
				n={30}
				avanco={vOut}
				comp={1.4 + 1.6 * forte}
				esp={0.1 + 0.04 * forte}
				mat={(i) => (i % 3 === 0 ? mats.quenteClaro : mats.quente)}
				p={pC}
				caminho={(i, u) => {
					const a = rnd(i, 4) * Math.PI * 2;
					const r = (0.15 + rnd(i, 5) * 0.55) * (1 + u * 0.8);
					return [fundo - 10 * u, r * Math.cos(a), r * Math.sin(a)];
				}}
			/>
		</PalcoA>
	);
};

// ---------------------------------------------------------------- 13. essa é a tração
const igATracao: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, k, fim, mola} = useCena(cena);
	const m = useMateriais();
	const mats = useMatsA();
	const qE = k('essa');
	const qT = k('tracao');
	const vel = (f: number) => (14 + f * 0.35) / fps;
	const desl = percorrido(frame, vel);
	const pS = mola(qE, 130, 12);
	const cam = trilha(frame, [
		[0, [-9, 5.5, 13]],
		[fim, [-5, 4, 14.5]],
	]);
	return (
		<PalcoA camera={cam} alvo={[0.8, 0.2, 0]} fov={40} sobre={<Rotulo texto="TRAÇÃO" y={330} p={mola(qT - 3, 170, 12)} tam={64} />}>
			<Chao m={m} deslocamento={desl} />
			<group position={[0, -0.08 + Math.sin(frame * 2.6) * 0.012, 0]}>
				<AviaoA m={m} mats={mats} turbinas={[1, 1]} giro={frame * 0.7} compressao={0.3} />
			</group>
			{[1, -1].map((l) => (
				<group key={l}>
					<Fluxo
						n={14}
						avanco={frame / 7 + l * 0.3}
						comp={1.8}
						esp={0.09}
						mat={(i) => (i % 3 === 0 ? mats.quenteClaro : mats.quente)}
						caminho={(i, u) => {
							const a = rnd(i, 4 + l) * Math.PI * 2;
							const r = (0.1 + rnd(i, 5 + l) * 0.25) * (1 + u);
							return [0.15 - 8 * u, -0.87 + r * Math.cos(a), l * 2.3 + r * Math.sin(a)];
						}}
					/>
				</group>
			))}
			<Seta de={[1.2, 2.0, 0]} dir={[1, 0, 0]} comp={3.6} raio={0.3} mat={mats.setaAmarela} p={pS} />
		</PalcoA>
	);
};

export const pecasA: Pecas = {igAPeso, igAPista, igAChao, igAMotor, igAAsas, igAPerfil, igAInclina, igAEmpurra, igASobe, igASustentacao, igAVento, igAPendura, igATurbina, igATracao};

// ---------------------------------------------------------------- lista de cenas do bloco A
export const cenasA = (b: Busca): Cena[] => {
	const fimBloco = b.say('Só que na decolagem').inicio;
	const c = {
		pesa: b.at('colocar') - 0.08,
		peso: b.at('não') - 0.05,
		chao: b.at('Só') - 0.05,
		motor: b.at('Então') - 0.1,
		asas: b.say('dos lados').fim + 0.3,
		perfil: b.at('ficam') - 0.05,
		inclina: b.at('Quando') - 0.06,
		empurra: b.say('e o ar empurra').inicio - 0.05,
		sobe: b.at('Essa') - 0.1,
		sustentacao: b.at('Mas') - 0.08,
		vento: b.say('Então você pendura').inicio - 0.5,
		pendura: b.at('sugam') - 0.05,
		turbina: b.say('Essa é a tração').inicio - 0.1,
	};
	const t = {
		toneladas: b.at('400toneladas'),
		pista: b.at('pista'),
		sai: b.at('sai'),
		chao: b.at('chão'),
		motor: b.at('motor'),
		levanta: b.at('levanta'),
		peso: b.at('peso'),
		duas: b.at('duas'),
		asas: b.at('asas'),
		enormes: b.at('enormes'),
		lados: b.at('lados'),
		curvadas: b.at('curvadas'),
		cima1: b.at('cima'),
		inclinadas: b.at('inclinadas'),
		cima2: b.at('cima', 2),
		corre: b.at('corre'),
		empurra: b.at('empurra'),
		baixo: b.at('baixo'),
		ar2: b.say('o ar empurra o avião').inicio,
		cima3: b.at('cima', 3),
		sustentacao: b.at('sustentação'),
		ar3: b.say('o ar tem que').inicio,
		muito: b.at('muito'),
		rapido: b.at('rápido'),
		turbina1: b.at('pendura') + 0.15,
		turbina2: b.at('embaixo') + 0.15,
		turbinas: b.at('turbinas'),
		sugam: b.at('sugam'),
		cospem: b.at('cospem'),
		forca: b.at('força'),
		essa: b.say('Essa é a tração').inicio,
		tracao: b.at('tração'),
	};
	const peca = (nome: string, de: number, ate: number, dados: Record<string, unknown>, sons: Cena['sons'] = []): Cena => ({tipo: 'peca', nome, modo: 'cheia', de, ate, dados, sons});
	return [
		// 1. "um avião de 400 toneladas": a fuselagem paira e o contador sobe até 400 (ela afunda com o peso)
		peca('igAPeso', 0, c.pesa, {toneladas: t.toneladas, marcos: [t.toneladas]}, [
			{em: 0, som: 'pro_whoosh', ganho: 0.6},
			{em: t.toneladas, som: 'pro_pop', ganho: 0.6},
		]),
		// 1b. "colocar numa pista": câmera baixa, ela cai na pista e levanta poeira
		peca('igAPista', c.pesa, c.peso, {pista: t.pista, marcos: [t.pista]}, [{em: t.pista, som: 'boom', ganho: 0.55}]),
		// 2. "não sai do chão": corre, o nariz tenta subir e bate de volta; X vermelho
		peca('igAChao', c.peso, c.chao, {sai: t.sai, chao: t.chao, marcos: [t.sai, t.chao]}, [{em: t.chao, som: 'pro_pouso', ganho: 0.7}]),
		// 3. "Só o motor não levanta esse peso": turbina liga embaixo, fumaça, e a seta vermelha do peso esmaga
		peca('igAMotor', c.chao, c.motor, {motor: t.motor, levanta: t.levanta, peso: t.peso, marcos: [t.motor, t.levanta, t.peso]}, [
			{em: t.motor, som: 'pro_aviao', ganho: 0.5},
			{em: t.peso, som: 'pro_pouso', ganho: 0.6},
		]),
		// 4. "duas asas enormes dos lados": asas crescem do corpo (amarelas) e a câmera abre
		peca('igAAsas', c.motor, c.asas, {duas: t.duas, asas: t.asas, enormes: t.enormes, lados: t.lados, marcos: [t.duas, t.asas, t.enormes, t.lados]}, [
			{em: t.asas, som: 'pro_whoosh', ganho: 0.7},
		]),
		// 5. "curvadas em cima": perfil da asa, traço amarelo no dorso curvo
		peca('igAPerfil', c.asas, c.perfil, {curvadas: t.curvadas, cima: t.cima1, marcos: [t.curvadas]}, [{em: t.curvadas, som: 'pro_swipe', ganho: 0.55}]),
		// 6. "um pouco inclinadas pra cima": o perfil levanta o nariz; linha de referência e arco do ângulo
		peca('igAInclina', c.perfil, c.inclina, {inclinadas: t.inclinadas, cima: t.cima2, marcos: [t.inclinadas, t.cima2]}, [
			{em: t.inclinadas, som: 'pro_whoosh_curto', ganho: 0.55},
		]),
		// 7. "a asa empurra o ar pra baixo": riscos de ar passam pela asa e descem; seta azul pra baixo
		peca('igAEmpurra', c.inclina, c.empurra, {corre: t.corre, empurra: t.empurra, baixo: t.baixo, marcos: [t.corre, t.empurra, t.baixo]}, [
			{em: t.empurra, som: 'pro_whoosh', ganho: 0.5},
		]),
		// 8. "o ar empurra o avião pra cima": setas amarelas sob as asas e o avião sai do chão
		peca('igASobe', c.empurra, c.sobe, {ar: t.ar2, cima: t.cima3, marcos: [t.ar2, t.cima3]}, [{em: t.ar2, som: 'rise', ganho: 0.5}]),
		// 9. "Essa é a sustentação": voando entre nuvens, setas de sustentação pulsando, rótulo amarelo
		peca('igASustentacao', c.sobe, c.sustentacao, {sustentacao: t.sustentacao, marcos: [t.sustentacao]}, [{em: t.sustentacao, som: 'pro_pop', ganho: 0.7}]),
		// 10. "muito rápido pela asa": riscos de vento acelerando sobre a asa e velocímetro indo ao vermelho
		peca('igAVento', c.sustentacao, c.vento, {ar: t.ar3, muito: t.muito, rapido: t.rapido, marcos: [t.ar3, t.muito, t.rapido]}, [
			{em: t.muito, som: 'pro_whoosh', ganho: 0.6},
		]),
		// 11. "pendura embaixo dela turbinas": as duas turbinas sobem e encaixam sob as asas, piscam amarelo
		peca('igAPendura', c.vento, c.pendura, {turbina1: t.turbina1, turbina2: t.turbina2, turbinas: t.turbinas, marcos: [t.turbina1, t.turbina2]}, [
			{em: t.turbina1, som: 'pro_pop', ganho: 0.6},
		]),
		// 12. "sugam o ar pela frente e cospem pra trás com força": turbina em close, ar azul entra, jato laranja sai
		peca('igATurbina', c.pendura, c.turbina, {sugam: t.sugam, cospem: t.cospem, forca: t.forca, marcos: [t.sugam, t.cospem, t.forca]}, [
			{em: t.sugam, som: 'pro_whoosh_curto', ganho: 0.5},
			{em: t.cospem, som: 'pro_aviao', ganho: 0.55},
		]),
		// 13. "Essa é a tração": avião acelerando na pista com os jatos, seta amarela pra frente, rótulo
		peca('igATracao', c.turbina, fimBloco, {essa: t.essa, tracao: t.tracao, marcos: [t.essa, t.tracao]}, [{em: t.tracao, som: 'pro_pop', ganho: 0.7}]),
	];
};
