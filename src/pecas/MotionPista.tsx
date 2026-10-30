// Motions do entrevista-pista (pedido do usuário, 30/10/2026):
// motion3d: meia tela. A metade de baixo vira o roxo do tema com grade em perspectiva andando e horizonte de ouro; em cima dela,
// um objeto 3D com movimento curto ligado à fala (ObjetosPista) e texto 3D sem anel e sem faíscas. O rosto fica livre em cima,
// como nas cartas 3D. Linha 0 = título no topo do painel; as outras ficam embaixo (com `troca`, todas embaixo, uma substitui a outra).
// aviao: avião 3D que cruza o céu acima da pessoa com rastro de condensação.
// Final3D: cartão final com a marca em texto 3D de verdade sobre grade em perspectiva (sem anel).
import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import type {CenaNoPlano} from '../motor/plano';
import {poppins} from '../motor/tema';
import {Plano} from './GradeAntesDepois';
import {CameraTremor, Linha3D, Luzes} from './tres/Texto3D';
import {
	Aviao,
	Balanca,
	CelularReal,
	ChipIa,
	Globo,
	MedalhaMais,
	Parede,
	PilhaMoedas,
	Pino,
	PlacaAlerta,
	Relogio24,
	Robo,
	Sinal,
} from './tres/ObjetosPista';

type De<T extends CenaNoPlano['tipo']> = Extract<CenaNoPlano, {tipo: T}>;
const lim = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const OURO = '#E8C27A';
const GL = {alpha: true, antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05};
const CAMERA = {fov: 35, position: [0, 0, 14.5] as [number, number, number], near: 0.1, far: 60};

// Posições no mundo (câmera fov 35 a 14,5: y = 0 no meio da tela, -4,57 na base).
const Y_TITULO = -0.62; // ~1090 px
const Y_OBJETO = -2.0; // ~1380 px
const Y_BAIXO = -3.55; // ~1705 px

const Objeto: React.FC<{cena: De<'motion3d'>; q: number; marcos: number[]}> = ({cena, q, marcos}) => {
	const {fps} = useVideoConfig();
	const t = q / fps;
	const m0 = marcos[0] ?? 8;
	const m1 = marcos[1] ?? m0 + 20;
	switch (cena.modelo) {
		case 'celularInternet': {
			const entra = interpolate(q, [0, 14], [0, 1], {...lim, easing: (x) => 1 - Math.pow(1 - x, 3)});
			const globo = interpolate(q, [m0 - 2, m0 + 10], [0, 1], {...lim, easing: (x) => 1 - Math.pow(1 - x, 3)});
			return (
				<group position={[0, Y_OBJETO, 0]}>
					<group position={[-1.2, -2.6 * (1 - entra), 0]} rotation={[0.08, -0.35 + (1 - entra) * 3 + Math.sin(t * 1.2) * 0.12, 0.04]} scale={0.6}>
						<CelularReal segundos={t} />
					</group>
					<group position={[-0.05, 0.65, 0.3]} scale={0.7}>
						<Sinal segundos={t} liga={globo} />
					</group>
					<group position={[1.3, -0.15 + Math.sin(t * 1.5) * 0.05, 0]} scale={0.82 * globo}>
						<Globo segundos={t} acende={interpolate(q, [m0, m0 + 30], [0, 1], lim)} />
					</group>
				</group>
			);
		}
		case 'positivoLive':
			return (
				<group position={[0, Y_OBJETO + 0.05, 0]} scale={0.82}>
					<MedalhaMais q={q} entra={2} />
				</group>
			);
		case 'positivoIa':
			return (
				<group position={[0, Y_OBJETO + 0.05, 0]} scale={0.78}>
					<ChipIa q={q} entra={0} />
				</group>
			);
		case 'negativoLive':
			return (
				<group position={[0, Y_OBJETO - 0.1, 0]} scale={0.7}>
					<PlacaAlerta q={q} entra={0} />
				</group>
			);
		case 'negativoIa':
			return (
				<group position={[0, Y_OBJETO + 0.25, 0]} scale={0.85}>
					<Balanca q={q} entra={0} pesa={m0} />
				</group>
			);
		case 'barreira':
			return (
				<group position={[0, Y_OBJETO, 0]}>
					<Parede q={q} quebra={m0} />
				</group>
			);
		case 'liberdade': {
			const globo = interpolate(q, [m1 - 3, m1 + 9], [0, 1], {...lim, easing: (x) => 1 - Math.pow(1 - x, 3)});
			return (
				<group position={[0, Y_OBJETO, 0]}>
					<group position={[-1.25, -0.85, 0]} scale={0.85}>
						<PilhaMoedas q={q} entra={m0} />
					</group>
					<group position={[1.25, -0.1, 0]} scale={0.72 * globo}>
						<Globo segundos={t} acende={interpolate(q, [m1, m1 + 24], [0, 1], lim)} />
						<Pino q={q} entra={m1 + 6} />
					</group>
				</group>
			);
		}
		case 'robos':
			return (
				<group position={[0, Y_OBJETO + 0.15, 0]}>
					<group position={[-1.6, -0.2, -0.4]} scale={0.8} rotation={[0, 0.35, 0]}>
						<Robo segundos={t} fase={1.3} />
					</group>
					<group position={[1.6, -0.2, -0.4]} scale={0.8} rotation={[0, -0.35, 0]}>
						<Robo segundos={t} fase={2.6} />
					</group>
					<group position={[0, 0, 0]} scale={1.05}>
						<Robo segundos={t} fase={0} />
					</group>
					<group position={[1.55, 1.2, 0.5]} scale={0.6}>
						<Relogio24 q={q} entra={m0} />
					</group>
				</group>
			);
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
	const horizonte = 0.85 + Math.sin(t * 2.6) * 0.15;
	const chip = cena.chip ? interpolate(frame, [3, 11], [0, 1], lim) : 0;
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: saida}}>
			{/* Painel roxo na metade de baixo, com a borda de cima esfumada sobre o vídeo. */}
			<AbsoluteFill
				style={{
					opacity: entrada,
					background: 'linear-gradient(180deg, rgba(20,9,40,0) 44%, rgba(30,15,58,0.86) 52%, rgba(24,11,48,0.97) 62%, #0d0620 100%)',
				}}
			/>
			<AbsoluteFill style={{opacity: entrada, transform: `translateY(${(1 - entrada) * 120}px)`}}>
				<AbsoluteFill style={{background: `radial-gradient(ellipse 70% 9% at 50% 57%, rgba(232,194,122,${0.3 * horizonte}) 0%, rgba(150,90,220,0.12) 50%, rgba(0,0,0,0) 80%)`}} />
				<div style={{position: 'absolute', top: height * 0.57 - 1, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent 8%, ${OURO} 50%, transparent 92%)`, opacity: 0.6 * horizonte}} />
				<AbsoluteFill style={{perspective: 900, perspectiveOrigin: '50% 57%', transform: `translateY(${-height * 0.07}px)`}}>
					<Plano desloca={t * 220} abre={1} />
				</AbsoluteFill>
				{/* Poeira de ouro lenta só no painel. */}
				{Array.from({length: 18}, (_, i) => {
					const x = random(`mx${i}`) * width;
					const y = height * 0.58 + ((random(`my${i}`) * height * 0.42 - t * (25 + 40 * random(`mv${i}`)) + height) % (height * 0.42));
					const s = 2 + 3 * random(`ms${i}`);
					return <div key={i} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: s, background: OURO, opacity: 0.15 + 0.35 * random(`mo${i}`), boxShadow: `0 0 ${s * 3}px ${OURO}`}} />;
				})}
			</AbsoluteFill>
			{cena.chip ? (
				<div style={{position: 'absolute', top: height * 0.505, width: '100%', display: 'flex', justifyContent: 'center', opacity: chip, transform: `translateY(${(1 - chip) * 16}px)`}}>
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
						const y = !cena.troca && i === 0 ? Y_TITULO : Y_BAIXO;
						const curta = l.texto.length <= 6;
						return (
							<Linha3D
								key={i}
								texto={l.texto}
								metal={l.metal ?? (i === 0 && !cena.troca ? 'branco' : 'ouro')}
								largura={curta ? 2.6 : Math.min(4.6, 0.36 * l.texto.length + 0.6)}
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
				<group scale={0.62} position={[0, 0, 0]}>
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
