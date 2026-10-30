// Motions do entrevista-pista (pedidos do usuário, 30/10/2026):
// motion3d: meia tela (pontos positivos/negativos, zero barreira, liberdade): véu roxo translúcido na metade de baixo, que deixa
// ver bem o vídeo, com grade reta (sem perspectiva), fina e de uma cor só no tom do motion; objeto 3D com movimento curto ligado
// à fala e texto 3D sem anel e sem faíscas. Com `cheia`, vira motion de tela inteira (celular com internet, as IAs).
// Linha 0 = título; as outras ficam embaixo (com `troca`, todas embaixo, uma substitui a outra).
// aviao: avião 3D que cruza o céu acima da pessoa com rastro de condensação.
// Final3D: cartão final com a marca em texto 3D de verdade sobre grade em perspectiva (sem anel).
import React from 'react';
import {AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import type {CenaNoPlano} from '../motor/plano';
import {poppins} from '../motor/tema';
import {Plano} from './GradeAntesDepois';
import {CameraTremor, Linha3D, Luzes} from './tres/Texto3D';
import {Aviao, Balanca, CelularReal, ChipIa, Globo, MedalhaMais, Parede, PilhaMoedas, Pino, PlacaAlerta, Relogio24, Robo, Sinal} from './tres/ObjetosPista';
import {CartaoVideo, Cracha, Holerite, PlacaZero, SolLua} from './tres/ObjetosIas';

type De<T extends CenaNoPlano['tipo']> = Extract<CenaNoPlano, {tipo: T}>;
const lim = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const OURO = '#E8C27A';
const COR_GRADE = 'rgba(176,136,245,0.26)';
const GL = {alpha: true, antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05};
const CAMERA = {fov: 35, position: [0, 0, 14.5] as [number, number, number], near: 0.1, far: 60};
const suave = (x: number) => 1 - Math.pow(1 - x, 3);

// Posições no mundo (câmera fov 35 a 14,5: y = 0 no meio da tela, ±4,57 nas bordas; nada abaixo de -2,6 ≈ 1500 px).
const MEIA = {titulo: -0.45, objeto: -1.6, baixo: -2.5, escala: 0.72};
const CHEIA = {titulo: 3.35, objeto: 0, baixo: -2.55, escala: 1};

// Grade reta, fina e de uma cor só, andando devagar para baixo. topo: onde começa (fração da altura).
const GradeReta: React.FC<{topo: number; desloca: number}> = ({topo, desloca}) => {
	const {height} = useVideoConfig();
	const mascara = `linear-gradient(180deg, rgba(0,0,0,0) 0%, #000 ${topo > 0 ? 10 : 18}%, #000 ${topo > 0 ? 100 : 82}%, rgba(0,0,0,${topo > 0 ? 1 : 0}) 100%)`;
	return (
		<div
			style={{
				position: 'absolute',
				left: 0,
				right: 0,
				top: height * topo,
				bottom: 0,
				backgroundImage: `linear-gradient(${COR_GRADE} 2px, transparent 2px), linear-gradient(90deg, ${COR_GRADE} 2px, transparent 2px)`,
				backgroundSize: '54px 54px',
				backgroundPosition: `center ${desloca}px`,
				WebkitMaskImage: mascara,
				maskImage: mascara,
			}}
		/>
	);
};

// Cena das IAs em tela cheia, acompanhando a fala: robôs filmando e os vídeos subindo para o feed → a "funcionária" ganha o
// crachá → holerite carimbado com R$ 0 → sol e lua girando com o relógio (24 horas) → placa "RECLAMAÇÕES 0" e o robô acena.
// marcos: [funcionária, salário, 24, reclama].
const CenaIas: React.FC<{q: number; marcos: number[]}> = ({q, marcos}) => {
	const {fps} = useVideoConfig();
	const t = q / fps;
	const [mF, mS, m24, mR] = [marcos[0] ?? 60, marcos[1] ?? 90, marcos[2] ?? 120, marcos[3] ?? 150];
	const fase = (m: number, damping = 16) => (q < m ? 0 : spring({frame: q - m, fps, config: {damping, stiffness: 110}}));
	const pF = fase(mF);
	const pS = fase(mS);
	const p24 = fase(m24);
	const pR = fase(mR);
	// Feed: 10 vídeos nascem dos celulares dos robôs e sobem em grade; somem para cima quando entra a funcionária.
	const colunas = [-1.7, -0.85, 0, 0.85, 1.7];
	const robosX = [-1.6, 0, 1.6];
	return (
		<group>
			<group position={[0, pF * 6, 0]}>
				{Array.from({length: 10}, (_, i) => {
					const r = i % 3;
					return (
						<CartaoVideo
							key={i}
							q={q}
							nasce={3 + i * 4}
							de={[robosX[r] + 0.3, -0.4]}
							para={[colunas[i % 5], i < 5 ? 2.55 : 1.35]}
							giro={(random(`cv${i}`) - 0.5) * 0.12}
							indice={i}
						/>
					);
				})}
			</group>
			<SolLua q={q} entra={m24 - 2} />
			{/* Robôs dos lados saem; o do meio vem para a frente e cresce. */}
			<group position={[-1.6 - pF * 2.6, -0.75, -0.4]} scale={0.8} rotation={[0, 0.35, 0]}>
				<Robo segundos={t} fase={1.3} />
			</group>
			<group position={[1.6 + pF * 2.6, -0.75, -0.4]} scale={0.8} rotation={[0, -0.35, 0]}>
				<Robo segundos={t} fase={2.6} />
			</group>
			<group position={[0, -0.55 + pF * 0.15, pF * 0.5]} scale={1.0 + pF * 0.25}>
				<Robo segundos={t} fase={0} aceno={pR} filma={pF < 0.5} />
				<group position={[0, -0.5, 0.42]} scale={0.5}>
					<Cracha q={q} entra={mF + 4} />
				</group>
			</group>
			{/* Holerite carimbado no "salário"; sai quando o relógio entra. */}
			<group position={[1.25 + p24 * 3, 1.85, 0.3]} scale={1.05}>
				<Holerite q={q} entra={mS - 2} carimba={mS + 8} />
			</group>
			<group position={[-1.25 - pR * 3, 1.95, 0.4]} scale={1.25}>
				<Relogio24 q={q} entra={m24} />
			</group>
			<group position={[0, 2.0, 0.6]} scale={0.95}>
				<PlacaZero q={q} entra={mR} />
			</group>
		</group>
	);
};

// Celular com internet em tela cheia: o celular entra girando, o sinal sai dele, o globo acende as conexões e pacotes de
// dados correm do celular para o globo. marcos: [internet].
const CenaCelular: React.FC<{q: number; marcos: number[]}> = ({q, marcos}) => {
	const {fps} = useVideoConfig();
	const t = q / fps;
	const m0 = marcos[0] ?? 30;
	const entra = interpolate(q, [0, 14], [0, 1], {...lim, easing: suave});
	const globo = interpolate(q, [m0 - 2, m0 + 10], [0, 1], {...lim, easing: suave});
	const de = new THREE.Vector3(-0.35, 1.45, 0.4);
	const ate = new THREE.Vector3(1.2, 1.85, 0.2);
	const meio = new THREE.Vector3(0.45, 2.7, 0.6);
	const curva = new THREE.QuadraticBezierCurve3(de, meio, ate);
	return (
		<group>
			<group position={[-0.55, -0.35 - 3.5 * (1 - entra), 0]} rotation={[0.06, -0.3 + (1 - entra) * 3 + Math.sin(t * 1.2) * 0.12, 0.05]} scale={1.15}>
				<CelularReal segundos={t} />
			</group>
			<group position={[0.35, 1.35, 0.4]} scale={0.95}>
				<Sinal segundos={t} liga={globo} />
			</group>
			<group position={[1.25, 1.9 + Math.sin(t * 1.5) * 0.05, -0.4]} scale={1.05 * globo}>
				<Globo segundos={t} acende={interpolate(q, [m0, m0 + 30], [0, 1], lim)} />
			</group>
			{globo > 0.5
				? Array.from({length: 7}, (_, i) => {
						const u = (((q - m0) / fps) * 0.9 + i / 7) % 1;
						const p = curva.getPoint(u);
						return (
							<mesh key={i} position={p}>
								<sphereGeometry args={[0.06, 12, 8]} />
								<meshBasicMaterial color="#ffd98a" toneMapped={false} transparent opacity={interpolate(u, [0, 0.1, 0.85, 1], [0, 1, 1, 0])} />
							</mesh>
						);
					})
				: null}
		</group>
	);
};

const Objeto: React.FC<{cena: De<'motion3d'>; q: number; marcos: number[]}> = ({cena, q, marcos}) => {
	const {fps} = useVideoConfig();
	const t = q / fps;
	const L = cena.cheia ? CHEIA : MEIA;
	const m0 = marcos[0] ?? 8;
	const m1 = marcos[1] ?? m0 + 20;
	const pos = (dy = 0): [number, number, number] => [0, L.objeto + dy * L.escala, 0];
	switch (cena.modelo) {
		case 'celularInternet':
			return <CenaCelular q={q} marcos={marcos} />;
		case 'robos':
			return <CenaIas q={q} marcos={marcos} />;
		case 'positivoLive':
			return (
				<group position={pos(0.05)} scale={0.82 * L.escala}>
					<MedalhaMais q={q} entra={2} />
				</group>
			);
		case 'positivoIa':
			return (
				<group position={pos(0.05)} scale={0.78 * L.escala}>
					<ChipIa q={q} entra={0} />
				</group>
			);
		case 'negativoLive':
			return (
				<group position={pos(-0.1)} scale={0.7 * L.escala}>
					<PlacaAlerta q={q} entra={0} />
				</group>
			);
		case 'negativoIa':
			return (
				<group position={pos(0.25)} scale={0.85 * L.escala}>
					<Balanca q={q} entra={0} pesa={m0} />
				</group>
			);
		case 'barreira':
			return (
				<group position={pos(0)} scale={0.85}>
					<Parede q={q} quebra={m0} />
				</group>
			);
		case 'liberdade': {
			const globo = interpolate(q, [m1 - 3, m1 + 9], [0, 1], {...lim, easing: suave});
			return (
				<group position={pos(0)}>
					<group position={[-1.2, -0.55, 0]} scale={0.62}>
						<PilhaMoedas q={q} entra={m0} />
					</group>
					<group position={[1.2, 0, 0]} scale={0.52 * globo}>
						<Globo segundos={t} acende={interpolate(q, [m1, m1 + 24], [0, 1], lim)} />
						<Pino q={q} entra={m1 + 6} />
					</group>
				</group>
			);
		}
		default:
			return null;
	}
};

export const Motion3D: React.FC<{cena: De<'motion3d'>}> = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const t = frame / fps;
	const fim = Math.round((cena.ate - cena.de) * fps);
	const q = (s: number) => Math.round(Math.max(0, s - cena.de) * fps);
	const entrada = interpolate(frame, [0, 7], [0, 1], lim);
	const saida = interpolate(frame, [fim - 7, fim], [1, 0], lim);
	const batidas = cena.linhas.map((l) => q(l.em));
	const marcos = (cena.marcos ?? []).map(q);
	const L = cena.cheia ? CHEIA : MEIA;
	const chip = cena.chip ? interpolate(frame, [3, 11], [0, 1], lim) : 0;
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: saida}}>
			{cena.cheia ? (
				<AbsoluteFill style={{opacity: entrada}}>
					<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, #3d1f74 0%, #1E0F3A 55%, #0b051c 100%)'}} />
					<GradeReta topo={0} desloca={t * 30} />
				</AbsoluteFill>
			) : (
				<AbsoluteFill style={{opacity: entrada}}>
					{/* Véu roxo translúcido: o vídeo continua bem visível atrás. */}
					<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(30,15,58,0) 45%, rgba(30,15,58,0.42) 54%, rgba(24,11,48,0.55) 100%)'}} />
					<GradeReta topo={0.5} desloca={t * 30} />
				</AbsoluteFill>
			)}
			{/* Poeira de ouro lenta. */}
			{Array.from({length: cena.cheia ? 30 : 14}, (_, i) => {
				const faixa = cena.cheia ? height : height * 0.45;
				const base = cena.cheia ? 0 : height * 0.55;
				const x = random(`mx${i}`) * width;
				const y = base + ((random(`my${i}`) * faixa - t * (25 + 40 * random(`mv${i}`)) + faixa * 2) % faixa);
				const s = 2 + 3 * random(`ms${i}`);
				return <div key={i} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: s, background: OURO, opacity: (0.15 + 0.35 * random(`mo${i}`)) * entrada, boxShadow: `0 0 ${s * 3}px ${OURO}`}} />;
			})}
			{cena.chip ? (
				<div style={{position: 'absolute', top: height * (cena.cheia ? 0.08 : 0.468), width: '100%', display: 'flex', justifyContent: 'center', opacity: chip, transform: `translateY(${(1 - chip) * 16}px)`}}>
					<div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '10px 28px', borderRadius: 999, background: 'rgba(30,15,58,0.82)', boxShadow: `inset 0 0 0 2px ${OURO}`, fontFamily: poppins, fontWeight: 800, fontSize: 32, letterSpacing: '0.2em', color: '#fff'}}>
						{cena.chip === 'LIVE' ? <span style={{width: 16, height: 16, borderRadius: 8, background: '#ff3b4d', boxShadow: '0 0 12px #ff3b4d', opacity: 0.6 + 0.4 * Math.sin(t * 8)}} /> : null}
						<span style={{marginRight: '-0.2em'}}>{cena.chip}</span>
					</div>
				</div>
			) : null}
			<AbsoluteFill style={{filter: 'drop-shadow(0 22px 30px rgba(8,2,20,0.65))', opacity: entrada}}>
				<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
					<Luzes quadro={frame} batidas={[...batidas, ...marcos]} />
					<Objeto cena={cena} q={frame} marcos={marcos} />
					{cena.linhas.map((l, i) => {
						if (cena.troca) {
							const proxima = batidas[i + 1] ?? Infinity;
							if (frame >= proxima) return null;
						}
						const y = !cena.troca && i === 0 ? L.titulo : L.baixo;
						const curta = l.texto.length <= 6;
						const largura = (curta ? 2.4 : Math.min(4.4, 0.34 * l.texto.length + 0.5)) * (cena.cheia ? 1 : 0.9);
						return (
							<Linha3D
								key={i}
								texto={l.texto}
								metal={l.metal ?? (i === 0 && !cena.troca ? 'branco' : 'ouro')}
								largura={largura}
								y={y}
								quadro={frame}
								batida={batidas[i]}
								profundidade={0.26}
							/>
						);
					})}
				</ThreeCanvas>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

// Avião que cruza o céu da esquerda para a direita, subindo de leve, com rastro que fica no céu e se desfaz.
export const AviaoCena: React.FC<{cena: De<'aviao'>}> = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const fim = Math.max(1, Math.round((cena.ate - cena.de) * fps));
	const meia = 14.5 * Math.tan((35 / 2) * (Math.PI / 180));
	const y0 = ((height / 2 - (cena.y ?? 300)) / (height / 2)) * meia;
	const pos = (f: number) => {
		const p = f / fim;
		return {x: -3.6 + 7.2 * p, y: y0 - 0.25 + 0.5 * p + Math.sin(p * Math.PI) * 0.12};
	};
	const agora = pos(frame);
	const rastro = Array.from({length: 24}, (_, i) => pos(frame - (i + 1) * 1.5)).filter((r) => r.x > -3.8);
	return (
		<AbsoluteFill style={{pointerEvents: 'none', filter: 'drop-shadow(0 8px 14px rgba(20,20,40,0.35))'}}>
			<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
				<Luzes quadro={frame} batidas={[]} />
				<group scale={0.62}>
					<Aviao x={agora.x / 0.62} y={agora.y / 0.62} inclina={-0.08} rastro={rastro.map((r) => ({x: r.x / 0.62 - 0.75, y: r.y / 0.62 - 0.02}))} />
				</group>
			</ThreeCanvas>
		</AbsoluteFill>
	);
};

// Cartão final: roxo do tema com chão e teto de grade andando, marca em texto 3D (ouro em cima, branco embaixo) e sub.
export const Final3D: React.FC<{cena: De<'final'>}> = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const t = frame / fps;
	const dur = Math.round((cena.ate - cena.de) * fps);
	const b1 = 4;
	const b2 = 12;
	const sub = interpolate(frame, [22, 34], [0, 1], lim);
	const entrada = interpolate(frame, [0, 6], [0, 1], lim);
	const horizonte = 0.85 + Math.sin(t * 2.6) * 0.15;
	return (
		<AbsoluteFill style={{opacity: entrada, overflow: 'hidden'}}>
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 46%, #3d1f74 0%, #1E0F3A 50%, #0b051c 100%)'}} />
			<AbsoluteFill style={{background: `radial-gradient(ellipse 80% 12% at 50% 50%, rgba(232,194,122,${0.35 * horizonte}) 0%, rgba(150,90,220,0.16) 45%, rgba(0,0,0,0) 80%)`}} />
			<AbsoluteFill style={{perspective: 900, perspectiveOrigin: '50% 50%'}}>
				<Plano desloca={t * 200} abre={1} />
				<Plano teto desloca={t * 200} abre={1} />
			</AbsoluteFill>
			<AbsoluteFill style={{filter: 'drop-shadow(0 26px 34px rgba(8,2,20,0.7))'}}>
				<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
					<CameraTremor quadro={frame} batidas={[]} z0={15.2} z1={13.6} duracao={dur} />
					<Luzes quadro={frame} batidas={[b1, b2]} />
					<Linha3D texto={cena.marca} metal="ouro" largura={cena.marca.length <= 4 ? 3.4 : 4.4} y={0.75} quadro={frame} batida={b1} profundidade={0.32} />
					{cena.linha2 ? <Linha3D texto={cena.linha2} metal="branco" largura={4.2} y={-0.55} quadro={frame} batida={b2} profundidade={0.28} /> : null}
				</ThreeCanvas>
			</AbsoluteFill>
			{cena.sub ? (
				<div style={{position: 'absolute', top: height * 0.6, width: '100%', textAlign: 'center', opacity: sub, transform: `translateY(${(1 - sub) * 16}px)`}}>
					<span style={{fontFamily: poppins, fontWeight: 700, fontSize: 36, letterSpacing: '0.3em', marginRight: '-0.3em', color: '#fff'}}>{cena.sub}</span>
				</div>
			) : null}
		</AbsoluteFill>
	);
};
