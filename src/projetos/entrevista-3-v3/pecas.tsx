// Peças (efeitos) exclusivas do entrevista-3-v3, usadas no edit.ts com {tipo: 'peca', nome: '<chave>', dados: {...}}.
// Prefixe as chaves com v3 (ex.: v3Gancho): o registro junta as peças de todos os projetos.
// v3Gancho: "R$ 100 MIL" em ouro 3D que conta do zero com ease-out e trava com clarão; o celular 3D da live sobe na frase
// "com o celular", a pilha de moedas cai na trava e a linha dourada troca no ritmo da fala (de casa → com o celular → fazendo live).
// v3Rota: pinos 3D de FLORIANÓPOLIS e GOIÂNIA acima da cabeça e o avião fazendo o arco de um ao outro, deixando a trilha.
// v3Caverna: motion de tela inteira (fundo roxo com a grade reta): a caverna de pedra com a casa acesa e o celular da live
// dentro; no fim a caverna se abre ao meio e entra a luz (saindo do modo caverna).
import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import type {CenaPeca, Pecas} from '../../pecas/peca';
import {FundoMotion} from '../../pecas/FundoMotion';
import {Linha3D, Luzes} from '../../pecas/tres/Texto3D';
import {Aviao, CelularReal, PilhaMoedas} from '../../pecas/tres/ObjetosPista';
import {playfair, poppins} from '../../motor/tema';

const lim = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const GL = {alpha: true, antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05};
const CAMERA = {fov: 35, position: [0, 0, 14.5] as [number, number, number], near: 0.1, far: 60};
const OURO_TEXTO = 'linear-gradient(180deg,#FFF1C9 0%,#F2D08A 40%,#E8C27A 65%,#C9974A 100%)';
// Câmera fov 35 a 14,5: meia altura visível 4,57 unidades (960 px), meia largura 2,57 (540 px).
const yMundo = (px: number) => ((960 - px) / 960) * 4.57;
const num = (c: CenaPeca, k: string) => Number((c.dados ?? {})[k] ?? c.de);
const quadroDe = (c: CenaPeca, k: string, fps: number) => Math.round((num(c, k) - c.de) * fps);

// ---------------------------------------------------------------------------------------------------------------- gancho

const V3Gancho: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const fim = Math.round((cena.ate - cena.de) * fps);
	const trava = quadroDe(cena, 'trava', fps);
	const celular = quadroDe(cena, 'celular', fps);
	const casa = quadroDe(cena, 'casa', fps);
	const live = quadroDe(cena, 'live', fps);
	const p = Math.min(1, frame / Math.max(1, trava));
	const valor = frame >= trava ? 100 : Math.max(1, Math.round(100 * (1 - (1 - p) ** 3)));
	const texto = `R$ ${valor} MIL`;
	const depois = Math.max(0, frame - trava);
	const soco = frame >= trava ? 1 + 0.16 * Math.exp(-depois / 4) : 1;
	const clarao = frame >= trava ? 0.6 * Math.exp(-depois / 3) : 0;
	const saida = interpolate(frame, [fim - 6, fim], [1, 0], lim);
	const entrada = interpolate(frame, [0, 6], [0, 1], lim);
	const giro = Math.sin((frame / fps) * 1.5) * 0.16;
	// Celular: sobe de baixo da tela e para sobre o peito, balançando devagar.
	const pc = spring({frame: frame - celular, fps, config: {damping: 13, stiffness: 110}});
	const yCel = frame < celular ? -9 : -9 + (yMundo(1470) + 9) * pc;
	const pulsoLive = frame >= live ? 1 + 0.06 * Math.sin(((frame - live) / fps) * Math.PI * 4) : 1;
	const linha = frame >= live ? 'fazendo live' : frame >= celular ? 'com o celular' : frame >= casa ? 'de casa' : '';
	const trocou = frame >= live ? live : frame >= celular ? celular : casa;
	const kLinha = interpolate(frame - trocou, [0, 6], [0, 1], lim);
	const kAoVivo = interpolate(frame - live, [0, 5], [0, 1], lim);
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: saida}}>
			<AbsoluteFill style={{opacity: entrada, background: 'linear-gradient(180deg, rgba(30,15,58,0.86) 0%, rgba(30,15,58,0.5) 26%, rgba(30,15,58,0) 36%)'}} />
			<AbsoluteFill style={{opacity: entrada * (frame >= celular ? 1 : 0), background: 'linear-gradient(0deg, rgba(30,15,58,0.7) 0%, rgba(30,15,58,0.35) 22%, rgba(30,15,58,0) 34%)'}} />
			<AbsoluteFill style={{background: `radial-gradient(ellipse 50% 10% at 50% 17%, rgba(255,214,140,${0.5 * Math.min(1, depois / 4) * (0.85 + 0.15 * Math.sin(frame / 6))}) 0%, rgba(150,90,220,0.18) 55%, rgba(0,0,0,0) 100%)`, opacity: frame >= trava ? 1 : 0}} />
			<AbsoluteFill style={{filter: 'drop-shadow(0 22px 30px rgba(12,4,28,0.6))'}}>
				<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
					<Luzes quadro={frame} batidas={[trava]} />
					<pointLight position={[Math.sin(frame / 9) * 4, yMundo(330) + 0.5, 3.5]} intensity={frame >= trava ? 40 : 18} distance={10} color="#fff6e0" />
					<pointLight position={[0, yMundo(1470), 3]} intensity={frame >= live ? 22 : 0} distance={6} color="#ff3355" />
					<group position={[0, yMundo(330), 0]} rotation={[0.04, giro, 0]} scale={soco}>
						<Linha3D texto={texto} metal="ouro" largura={0.44 * texto.length} y={0} quadro={frame} batida={0} profundidade={0.62} />
					</group>
					<group position={[0.05, yCel, 0]} rotation={[0.12, -0.35 + Math.sin((frame / fps) * 1.3) * 0.25, 0.05]} scale={0.5 * pulsoLive}>
						<CelularReal segundos={frame / fps} />
					</group>
					<group position={[-1.75, yMundo(1700), 0.4]} scale={0.5}>
						<PilhaMoedas q={frame} entra={trava} n={8} />
					</group>
					<group position={[1.8, yMundo(1720), 0.4]} scale={0.42}>
						<PilhaMoedas q={frame} entra={trava + 6} n={6} />
					</group>
				</ThreeCanvas>
			</AbsoluteFill>
			{linha ? (
				<div style={{position: 'absolute', top: 440, width: '100%', textAlign: 'center', opacity: kLinha, transform: `translateY(${(1 - kLinha) * 14}px)`}}>
					<span style={{fontFamily: playfair, fontStyle: 'italic', fontWeight: 800, fontSize: 84, padding: '0 0.08em', background: OURO_TEXTO, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 6px 10px rgba(12,4,28,0.6)) drop-shadow(0 0 16px rgba(255,210,130,0.4))'}}>
						{linha}
					</span>
				</div>
			) : null}
			{frame >= live ? (
				<div style={{position: 'absolute', top: 1160, width: '100%', display: 'flex', justifyContent: 'center', opacity: kAoVivo}}>
					<div style={{display: 'flex', alignItems: 'center', gap: 12, padding: '10px 26px', borderRadius: 999, background: 'linear-gradient(180deg,#ff3b5c,#d7193a)', boxShadow: '0 0 30px rgba(255,59,92,0.55)', transform: `scale(${0.8 + 0.2 * kAoVivo})`}}>
						<div style={{width: 16, height: 16, borderRadius: 8, background: '#fff', opacity: 0.6 + 0.4 * Math.sin(frame / 3)}} />
						<span style={{fontFamily: poppins, fontWeight: 800, fontSize: 34, letterSpacing: '0.14em', color: '#fff'}}>AO VIVO</span>
					</div>
				</div>
			) : null}
			<AbsoluteFill style={{background: '#fff8e6', opacity: clarao}} />
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------------------------------------------------------- rota

const PinoRota: React.FC<{x: number; base: number; entra: number; brilha?: number}> = ({x, base, entra, brilha = 0}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const l = frame - entra;
	if (l < 0) return null;
	const p = spring({frame: l, fps, config: {damping: 10, stiffness: 150}});
	const pulo = brilha > 0 && frame >= brilha ? Math.exp(-(frame - brilha) / 5) * Math.abs(Math.sin(((frame - brilha) / fps) * 14)) * 0.18 : 0;
	return (
		<group position={[x, base + (1 - p) * 2 + pulo, 0]} scale={0.5}>
			<mesh position={[0, 0.62, 0]}>
				<sphereGeometry args={[0.3, 32, 24]} />
				<meshStandardMaterial color="#ffe3a3" metalness={0.9} roughness={0.18} emissive="#c99a3e" emissiveIntensity={brilha > 0 && frame >= brilha ? 0.9 : 0.45} />
			</mesh>
			<mesh position={[0, 0.2, 0]} rotation={[Math.PI, 0, 0]}>
				<coneGeometry args={[0.23, 0.62, 32]} />
				<meshStandardMaterial color="#E8C27A" metalness={1} roughness={0.22} />
			</mesh>
			<mesh position={[0, 0.62, 0.24]}>
				<sphereGeometry args={[0.11, 16, 12]} />
				<meshPhysicalMaterial color="#140a2b" metalness={0.4} roughness={0.3} clearcoat={1} />
			</mesh>
		</group>
	);
};

const V3Rota: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const fim = Math.round((cena.ate - cena.de) * fps);
	const voa = quadroDe(cena, 'voa', fps);
	const chega = Math.max(voa + 12, quadroDe(cena, 'chega', fps));
	const saida = interpolate(frame, [fim - 6, fim], [1, 0], lim);
	const A = new THREE.Vector2(-1.3, 3.18);
	const B = new THREE.Vector2(1.45, 3.18);
	const C = new THREE.Vector2(0.07, 3.78);
	const curva = (u: number) => {
		const a = (1 - u) ** 2, b = 2 * (1 - u) * u, c = u ** 2;
		return {x: a * A.x + b * C.x + c * B.x, y: a * A.y + b * C.y + c * B.y};
	};
	const pr = interpolate(frame, [voa, chega], [0, 1], lim);
	const u = pr < 0.5 ? 2 * pr * pr : 1 - (-2 * pr + 2) ** 2 / 2;
	const agora = curva(u);
	const adiante = curva(Math.min(1, u + 0.02));
	const angulo = Math.atan2(adiante.y - agora.y, adiante.x - agora.x);
	const pontos = useMemo(() => Array.from({length: 34}, (_, i) => i / 33), []);
	const entrada = interpolate(frame, [0, 6], [0, 1], lim);
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: saida}}>
			<AbsoluteFill style={{opacity: entrada, background: 'linear-gradient(180deg, rgba(30,15,58,0.78) 0%, rgba(30,15,58,0.45) 19%, rgba(30,15,58,0) 27%)'}} />
			<AbsoluteFill style={{filter: 'drop-shadow(0 10px 16px rgba(12,4,28,0.55))'}}>
				<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
					<Luzes quadro={frame} batidas={[0, chega]} />
					<PinoRota x={A.x} base={2.62} entra={0} />
					<PinoRota x={B.x} base={2.62} entra={4} brilha={chega} />
					<group position={[-1.3, 2.36, 0]}>
						<Linha3D texto="FLORIANÓPOLIS" metal="branco" largura={2.25} y={0} quadro={frame} batida={2} profundidade={0.4} />
					</group>
					<group position={[1.45, 2.36, 0]}>
						<Linha3D texto="GOIÂNIA" metal="ouro" largura={1.45} y={0} quadro={frame} batida={6} profundidade={0.4} />
					</group>
					{frame >= voa
						? pontos
								.filter((s) => s <= u && Math.round(s * 33) % 2 === 0)
								.map((s, i) => {
									const q = curva(s);
									return (
										<mesh key={i} position={[q.x, q.y, -0.1]}>
											<sphereGeometry args={[0.028, 10, 8]} />
											<meshBasicMaterial color="#ffe2a0" transparent opacity={0.9} depthWrite={false} />
										</mesh>
									);
								})
						: null}
					{frame >= voa && pr < 1 ? (
						<group position={[agora.x, agora.y, 0.3]} rotation={[0, 0, angulo]} scale={0.34}>
							<Aviao x={0} y={0} inclina={-0.1} rastro={[]} />
						</group>
					) : null}
				</ThreeCanvas>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------------------------------------------------------- caverna

// Meia caverna (lado -1 esquerdo, 1 direito): arco de pedra extrudado entre a elipse de fora e a de dentro.
const useMeiaCaverna = (lado: -1 | 1) =>
	useMemo(() => {
		const s = new THREE.Shape();
		const [rx, ry, ix, iy] = [2.35, 2.7, 1.55, 1.95];
		const n = 24;
		const pontos: [number, number][] = [];
		for (let i = 0; i <= n; i++) {
			const a = (Math.PI / 2) * (i / n);
			pontos.push([lado * Math.cos(a) * rx, Math.sin(a) * ry]);
		}
		s.moveTo(lado * rx, 0);
		pontos.forEach(([x, y]) => s.lineTo(x, y));
		for (let i = n; i >= 0; i--) {
			const a = (Math.PI / 2) * (i / n);
			s.lineTo(lado * Math.cos(a) * ix, Math.sin(a) * iy);
		}
		s.closePath();
		const g = new THREE.ExtrudeGeometry(s, {depth: 0.9, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.1, bevelSegments: 3, curveSegments: 6});
		g.translate(0, 0, -0.45);
		return g;
	}, [lado]);

// Altura da elipse de dentro do arco (onde as estalactites penduram).
const tetoDentro = (x: number) => 1.95 * Math.sqrt(Math.max(0, 1 - (x / 1.55) ** 2));

const V3Caverna: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const fim = Math.round((cena.ate - cena.de) * fps);
	const sair = quadroDe(cena, 'sair', fps);
	const caverna = quadroDe(cena, 'caverna', fps);
	const casa = quadroDe(cena, 'casa', fps);
	const live = quadroDe(cena, 'live', fps);
	const abre = quadroDe(cena, 'abre', fps);
	const esq = useMeiaCaverna(-1);
	const dir = useMeiaCaverna(1);
	const pedra = useMemo(() => new THREE.MeshStandardMaterial({color: '#3a2d4f', roughness: 0.92, metalness: 0.05, flatShading: true}), []);
	const pedraEscura = useMemo(() => new THREE.MeshStandardMaterial({color: '#241a36', roughness: 0.95, metalness: 0.02, flatShading: true}), []);
	const entrada = interpolate(frame, [0, 6], [0, 1], lim);
	const saida = interpolate(frame, [fim - 5, fim], [1, 0], lim);
	const pCav = spring({frame: frame - Math.max(0, sair), fps, config: {damping: 14, stiffness: 90}});
	const pCasa = spring({frame: frame - casa, fps, config: {damping: 10, stiffness: 140}});
	const pLive = spring({frame: frame - live, fps, config: {damping: 10, stiffness: 160}});
	const pAbre = interpolate(frame, [abre, abre + 12], [0, 1], {...lim, easing: (x) => 1 - (1 - x) ** 3});
	const luz = interpolate(frame, [abre, abre + 10], [0, 1], lim);
	const push = interpolate(frame, [0, fim], [0, 1], lim);
	const yBase = -2.35;
	const estalactites = useMemo(() => [-1.15, -0.7, -0.25, 0.3, 0.8, 1.2].map((x, i) => ({x, h: 0.28 + ((i * 37) % 5) * 0.06})), []);
	return (
		<AbsoluteFill style={{opacity: entrada * saida, overflow: 'hidden'}}>
			<FundoMotion />
			{/* Luz de fora entrando quando a caverna abre. */}
			<AbsoluteFill style={{opacity: luz, background: 'radial-gradient(ellipse 38% 30% at 50% 64%, rgba(255,240,200,0.95) 0%, rgba(255,214,140,0.55) 40%, rgba(232,194,122,0) 100%)'}} />
			<AbsoluteFill style={{filter: 'drop-shadow(0 26px 34px rgba(8,2,20,0.7))'}}>
				<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
					<Luzes quadro={frame} batidas={[sair, caverna]} />
					<pointLight position={[-0.4, yBase + 1, 1.2]} intensity={frame >= casa ? 14 * pCasa : 0} distance={4} color="#ffc56b" />
					<pointLight position={[0.9, yBase + 0.9, 1.2]} intensity={frame >= live ? 10 : 0} distance={3} color="#ff3355" />
					<pointLight position={[0, yBase + 1, -1.5]} intensity={45 * luz} distance={12} color="#fff1c9" />
					<group position={[0, 3.25, 0]}>
						<Linha3D texto="SAIR DO" metal="branco" largura={2.6} y={0} quadro={frame} batida={sair} profundidade={0.5} />
					</group>
					<group position={[0, 2.25, 0]}>
						<Linha3D texto="MODO CAVERNA" metal="ouro" largura={4.6} y={0} quadro={frame} batida={caverna} profundidade={0.55} />
					</group>
					<group position={[0, -0.25 - push * 0.15, 0]} scale={(0.85 + 0.15 * pCav) * (1 + push * 0.05)} rotation={[0.12, Math.sin((frame / fps) * 0.9) * 0.12, 0]}>
						{/* Caverna: duas metades de pedra que se afastam quando ela sai. */}
						<group>
							<group position={[-pAbre * 2.6, yBase, 0]} rotation={[0, pAbre * 0.5, 0]}>
								<mesh geometry={esq} material={pedra} />
								{estalactites.filter((e) => e.x < 0).map((e, i) => (
									<mesh key={i} position={[e.x, tetoDentro(e.x) - e.h / 2 + 0.04, 0.1]} rotation={[Math.PI, 0, 0]} material={pedraEscura}>
										<coneGeometry args={[0.09, e.h, 6]} />
									</mesh>
								))}
							</group>
							<group position={[pAbre * 2.6, yBase, 0]} rotation={[0, -pAbre * 0.5, 0]}>
								<mesh geometry={dir} material={pedra} />
								{estalactites.filter((e) => e.x > 0).map((e, i) => (
									<mesh key={i} position={[e.x, tetoDentro(e.x) - e.h / 2 + 0.04, 0.1]} rotation={[Math.PI, 0, 0]} material={pedraEscura}>
										<coneGeometry args={[0.09, e.h, 6]} />
									</mesh>
								))}
							</group>
						</group>
						{/* Chão de pedra. */}
						<mesh position={[0, yBase - 0.08, 0]} material={pedraEscura}>
							<boxGeometry args={[5.4, 0.16, 1.6]} />
						</mesh>
						{[-2.1, -1.7, 1.75, 2.15].map((x, i) => (
							<mesh key={i} position={[x - Math.sign(x) * pAbre * 2.4, yBase + 0.15, 0.55]} material={pedra} rotation={[i, i * 2, 0]}>
								<dodecahedronGeometry args={[0.22 + (i % 2) * 0.08, 0]} />
							</mesh>
						))}
						{/* Casa acesa dentro da caverna. */}
						{frame >= casa ? (
							<group position={[-0.45, yBase + 0.42, 0]} scale={pCasa * 0.95}>
								<mesh>
									<boxGeometry args={[1.05, 0.82, 0.8]} />
									<meshPhysicalMaterial color="#efe7f7" roughness={0.4} clearcoat={0.6} />
								</mesh>
								<mesh position={[0, 0.66, 0]} rotation={[0, Math.PI / 4, 0]}>
									<coneGeometry args={[0.86, 0.52, 4]} />
									<meshStandardMaterial color="#5b2aa0" roughness={0.5} metalness={0.2} />
								</mesh>
								<mesh position={[-0.22, 0.06, 0.41]}>
									<planeGeometry args={[0.3, 0.3]} />
									<meshStandardMaterial color="#ffd27a" emissive="#ffb648" emissiveIntensity={1.6} />
								</mesh>
								<mesh position={[0.25, -0.13, 0.41]}>
									<planeGeometry args={[0.26, 0.56]} />
									<meshStandardMaterial color="#2a1552" roughness={0.5} />
								</mesh>
							</group>
						) : null}
						{/* Celular da live no tripé, com a luz vermelha de AO VIVO. */}
						{frame >= live ? (
							<group position={[0.85, yBase + 0.05, 0.25]} scale={pLive}>
								{[-0.16, 0, 0.16].map((x, i) => (
									<mesh key={i} position={[x * 0.9, 0.36, (i - 1) * 0.08]} rotation={[0, 0, -x * 1.1]}>
										<cylinderGeometry args={[0.018, 0.018, 0.75, 8]} />
										<meshStandardMaterial color="#cfd2dc" metalness={1} roughness={0.3} />
									</mesh>
								))}
								<group position={[0, 1.08, 0]} rotation={[0, -0.35, 0]} scale={0.26}>
									<CelularReal segundos={frame / fps} />
								</group>
								<mesh position={[0, 1.58, 0.06]}>
									<sphereGeometry args={[0.06, 12, 10]} />
									<meshStandardMaterial color="#ff3355" emissive="#ff1f45" emissiveIntensity={1 + Math.sin(frame / 3)} />
								</mesh>
							</group>
						) : null}
					</group>
				</ThreeCanvas>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

export const pecas: Pecas = {
	v3Gancho: V3Gancho,
	v3Rota: V3Rota,
	v3Caverna: V3Caverna,
};
