// Peças (efeitos) exclusivas do depoimento-3-3 (Felipe), usadas no edit.ts com {tipo: 'peca', nome: '<chave>', dados: {...}}.
// Prefixo d33. Tempos em `dados` = segundos do vídeo editado; o quadro 0 da peça é cena.de. Posições em px de 1080x1920.
// Câmera 3D: fov 35 a 14,5 (meia altura ~4,57, meia largura ~2,57 unidades). Toda peça de tela inteira usa FundoMotion.
import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import type {CenaPeca, Pecas} from '../../pecas/peca';
import {FundoMotion} from '../../pecas/FundoMotion';
import {CameraTremor, Linha3D, Luzes} from '../../pecas/tres/Texto3D';
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
	const entrada = interpolate(frame, [0, 6], [0, 1], lim);
	const saida = interpolate(frame, [fim - 7, fim], [1, 0], lim);
	return {frame, fps, width, height, fim, q, entrada, saida, t: frame / fps};
};

const VIDRO: React.CSSProperties = {
	background: 'linear-gradient(180deg, rgba(46,24,86,0.9), rgba(30,15,58,0.9))',
	boxShadow: `inset 0 0 0 2px ${OURO}, 0 0 26px rgba(232,194,122,0.35)`,
	borderRadius: 999,
	fontFamily: poppins,
	color: '#fff',
};

// ---------------------------------------------------------------- 3, 4, 5 vídeos por dia e nenhuma venda

// Tela inteira: cartões de vídeo (play) caem e empilham em leque, um por número falado; o título 3D conta "3 / 4 / 5 VÍDEOS"
// e embaixo o painel de vendas fica travado em 0 (no `nada` ele treme e acende em vermelho).
// dados: {marcos: [3, 4, 5] (segundos editados), nada: segundo editado}.
const d33Videos: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, width, height, fim, q, entrada, saida} = useCena(cena);
	const marcos = ((cena.dados?.marcos as number[]) ?? []).map(q);
	const nada = q(cena.dados?.nada);
	const atual = marcos.filter((m) => frame >= m).length;
	const n = 2 + Math.max(1, atual);
	const batida = marcos[Math.max(0, atual - 1)] ?? 0;
	// Um cartão por vídeo gravado: 3 no primeiro número, depois +1 a cada número.
	const cartoes = [0, 0, 0, 1, 2].map((m, i) => ({chega: marcos[m] + (m === 0 ? i * 3 : 0), i}));
	const treme = frame >= nada ? Math.sin((frame - nada) * 2.1) * 10 * Math.exp(-(frame - nada) / 9) : 0;
	const vermelho = interpolate(frame, [nada, nada + 4], [0, 1], lim);
	const painel = spring({frame: frame - 4, fps, config: {damping: 14}});
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: entrada * saida}}>
			<FundoMotion />
			<AbsoluteFill style={{filter: 'drop-shadow(0 22px 30px rgba(8,2,20,0.65))'}}>
				<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
					<Luzes quadro={frame} batidas={marcos} />
					<Linha3D key={n} ate={fim - 8} texto={`${n} VÍDEOS`} metal={n === 5 ? 'ouro' : 'branco'} largura={3.6} y={yMundo(330)} quadro={frame} batida={batida} profundidade={0.45} />
				</ThreeCanvas>
			</AbsoluteFill>
			<div style={{position: 'absolute', top: 470, left: 0, width: '100%', height: 760, perspective: 1400}}>
				{cartoes.map(({chega, i}) => {
					const p = spring({frame: frame - chega, fps, config: {damping: 12, stiffness: 120}});
					if (frame < chega) return null;
					const ang = (i - 2) * 11;
					return (
						<div
							key={i}
							style={{
								position: 'absolute',
								left: 540 - 150 + (i - 2) * 92,
								top: 60 + Math.abs(i - 2) * 26,
								width: 300,
								height: 530,
								borderRadius: 34,
								background: 'linear-gradient(160deg, #5b34a8 0%, #2a1552 70%)',
								boxShadow: `inset 0 0 0 3px ${OURO}, 0 26px 40px rgba(8,2,20,0.6)`,
								transform: `translateY(${(1 - p) * -900}px) rotateZ(${ang * p}deg) rotateX(${(1 - p) * 50}deg)`,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<div style={{width: 0, height: 0, borderTop: '46px solid transparent', borderBottom: '46px solid transparent', borderLeft: `78px solid ${OURO}`, marginLeft: 18, filter: 'drop-shadow(0 0 16px rgba(232,194,122,0.6))'}} />
							<div style={{position: 'absolute', bottom: 30, left: 28, right: 28, height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.25)'}}>
								<div style={{width: `${40 + i * 12}%`, height: '100%', borderRadius: 5, background: OURO}} />
							</div>
						</div>
					);
				})}
			</div>
			<div style={{position: 'absolute', top: 1330, width: '100%', display: 'flex', justifyContent: 'center', opacity: painel, transform: `translateX(${treme}px) scale(${0.9 + 0.1 * painel})`}}>
				<div style={{...VIDRO, display: 'flex', alignItems: 'center', gap: 26, padding: '22px 46px', boxShadow: `inset 0 0 0 2px ${vermelho > 0 ? '#ff4d5e' : OURO}, 0 0 ${26 + 30 * vermelho}px rgba(255,77,94,${0.15 + 0.45 * vermelho})`}}>
					<span style={{fontWeight: 700, fontSize: 40, letterSpacing: '0.14em'}}>VENDAS</span>
					<span style={{fontWeight: 900, fontSize: 92, lineHeight: 1, color: vermelho > 0 ? '#ff6b78' : '#fff'}}>0</span>
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- cartão de crédito parcelado

// Tela inteira: cartão de crédito roxo e ouro gira e entra; no `parcelei` ele se fatia em parcelas que se afastam
// (cada fatia com "1x", "2x"...) e, no `loucura`, treme e "FIZ LOUCURA" bate em ouro 3D. Antes, "SEM DINHEIRO" em prata.
// dados: {sem: segundo editado, parcelei: segundo editado, loucura: segundo editado}.
const FATIAS = 6;
const d33Cartao: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, width, height, fim, q, entrada, saida, t} = useCena(cena);
	const sem = q(cena.dados?.sem);
	const parc = q(cena.dados?.parcelei);
	const louca = q(cena.dados?.loucura);
	const pe = spring({frame, fps, config: {damping: 13, stiffness: 100}});
	const abre = spring({frame: frame - parc, fps, config: {damping: 11, stiffness: 110}});
	const treme = frame >= louca ? Math.sin((frame - louca) * 2.3) * 12 * Math.exp(-(frame - louca) / 10) : 0;
	const W = 760;
	const H = 480;
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: entrada * saida}}>
			<FundoMotion />
			<AbsoluteFill style={{filter: 'drop-shadow(0 22px 30px rgba(8,2,20,0.65))'}}>
				<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
					<CameraTremor quadro={frame} batidas={[louca]} z0={14.5} z1={14.1} duracao={fim} />
					<Luzes quadro={frame} batidas={[sem, parc, louca]} />
					{frame < parc ? <Linha3D ate={parc - 3} texto="SEM DINHEIRO" metal="branco" largura={4.4} y={yMundo(340)} quadro={frame} batida={sem} profundidade={0.4} /> : null}
					{frame >= parc && frame < louca ? <Linha3D ate={louca - 3} texto="PARCELEI" metal="branco" largura={3.8} y={yMundo(340)} quadro={frame} batida={parc} profundidade={0.4} /> : null}
					{frame >= louca ? <Linha3D ate={fim - 8} texto="FIZ LOUCURA" metal="ouro" largura={4.4} y={yMundo(340)} quadro={frame} batida={louca} profundidade={0.45} /> : null}
				</ThreeCanvas>
			</AbsoluteFill>
			<div style={{position: 'absolute', top: 760, left: 540 - W / 2, width: W, height: H, perspective: 1600}}>
			<div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `translateX(${treme}px) rotateY(${(1 - pe) * 160 + Math.sin(t * 1.5) * 6}deg) rotateX(${8 + (1 - pe) * 30}deg) scale(${0.6 + 0.4 * pe})`}}>
				{Array.from({length: FATIAS}, (_, i) => {
					const w = W / FATIAS;
					const desloca = (i - (FATIAS - 1) / 2) * 34 * abre;
					const cai = Math.sin(i * 1.7) * 26 * abre;
					return (
						<div
							key={i}
							style={{
								position: 'absolute',
								left: i * w,
								top: 0,
								width: w,
								height: H,
								overflow: 'hidden',
								transform: `translate(${desloca}px, ${cai}px)`,
							}}
						>
							<div
								style={{
									position: 'absolute',
									left: -i * w,
									width: W,
									height: H,
									borderRadius: 34,
									background: 'linear-gradient(135deg, #6a3fc0 0%, #2a1552 55%, #1a0c36 100%)',
									boxShadow: `inset 0 0 0 3px ${OURO}`,
								}}
							>
								<div style={{position: 'absolute', left: 60, top: 150, width: 110, height: 84, borderRadius: 14, background: 'linear-gradient(135deg, #ffe3a3, #b98a3a)'}} />
								<div style={{position: 'absolute', left: 60, top: 300, fontFamily: poppins, fontWeight: 700, fontSize: 42, letterSpacing: '0.08em', whiteSpace: 'nowrap', color: '#fff'}}>•••• •••• •••• 4821</div>
								<div style={{position: 'absolute', left: 60, top: 390, fontFamily: poppins, fontWeight: 600, fontSize: 30, letterSpacing: '0.2em', color: OURO}}>FELIPE</div>
								<div style={{position: 'absolute', right: 56, top: 52, fontFamily: poppins, fontWeight: 900, fontSize: 40, fontStyle: 'italic', color: OURO}}>CRÉDITO</div>
							</div>
							{abre > 0.05 ? (
								<div style={{position: 'absolute', bottom: 18, width: '100%', textAlign: 'center', opacity: abre, fontFamily: poppins, fontWeight: 900, fontSize: 34, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.6)'}}>{i + 1}x</div>
							) : null}
						</div>
					);
				})}
			</div>
			</div>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- baú do ouro

// Tela inteira: baú roxo com aros de ouro; no `abre` a tampa gira para trás, sai luz dourada e barras/moedas de ouro saltam.
// Texto 3D: "NÃO ESCONDEM" (prata) e, no `ouro`, "O OURO" (ouro).
// dados: {abre: segundo editado, ouro: segundo editado}.
const MOEDAS = Array.from({length: 12}, (_, i) => ({x: ((i * 37) % 11) / 5.5 - 1, vy: 0.22 + ((i * 13) % 7) / 40, atraso: (i % 4) * 2, giro: 0.1 + (i % 5) / 25}));
const d33Bau: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, width, height, fim, q, entrada, saida, t} = useCena(cena);
	const abre = Math.max(8, q(cena.dados?.abre));
	const ouro = Math.max(abre + 4, q(cena.dados?.ouro));
	const pe = spring({frame, fps, config: {damping: 14, stiffness: 110}});
	const tampa = spring({frame: frame - abre, fps, config: {damping: 10, stiffness: 120}});
	const luz = interpolate(frame, [abre, abre + 8], [0, 1], lim);
	const m = useMemo(
		() => ({
			ouro: new THREE.MeshStandardMaterial({color: OURO, metalness: 1, roughness: 0.22}),
			brilho: new THREE.MeshStandardMaterial({color: '#ffe3a3', metalness: 0.9, roughness: 0.15, emissive: '#c99a3e', emissiveIntensity: 0.7}),
			roxo: new THREE.MeshPhysicalMaterial({color: '#3a1d6e', metalness: 0.3, roughness: 0.35, clearcoat: 1}),
		}),
		[],
	);
	const yBau = yMundo(1180);
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: entrada * saida}}>
			<FundoMotion />
			<AbsoluteFill style={{opacity: luz, background: `radial-gradient(ellipse 40% 28% at 50% 56%, rgba(255,214,140,0.55) 0%, rgba(150,90,220,0.15) 60%, rgba(0,0,0,0) 100%)`}} />
			<AbsoluteFill style={{filter: 'drop-shadow(0 22px 30px rgba(8,2,20,0.65))'}}>
				<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
					<CameraTremor quadro={frame} batidas={[abre]} z0={14.6} z1={13.9} duracao={fim} />
					<Luzes quadro={frame} batidas={[2, abre, ouro]} />
					<pointLight position={[0, yBau + 0.6, 1.5]} intensity={60 * luz} distance={7} color="#ffcf7a" />
					<Linha3D ate={fim - 8} texto="NÃO ESCONDEM" metal="branco" largura={4.4} y={yMundo(330)} quadro={frame} batida={2} profundidade={0.4} />
					{frame >= ouro ? <Linha3D ate={fim - 8} texto="O OURO" metal="ouro" largura={3.4} y={yMundo(520)} quadro={frame} batida={ouro} profundidade={0.5} /> : null}
					<group position={[0, yBau - (1 - pe) * 6, 0]} rotation={[0.35, -0.45 + Math.sin(t * 1.2) * 0.12, 0]} scale={1.05}>
						{/* corpo */}
						<mesh material={m.roxo}>
							<boxGeometry args={[2.6, 1.3, 1.5]} />
						</mesh>
						{[-1.05, 1.05].map((x) => (
							<mesh key={x} position={[x, 0, 0]} material={m.ouro}>
								<boxGeometry args={[0.16, 1.34, 1.54]} />
							</mesh>
						))}
						<mesh position={[0, 0.66, 0]} material={m.ouro}>
							<boxGeometry args={[2.64, 0.1, 1.54]} />
						</mesh>
						<mesh position={[0, 0.3, 0.77]} material={m.brilho}>
							<boxGeometry args={[0.32, 0.4, 0.06]} />
						</mesh>
						{/* ouro dentro */}
						<mesh position={[0, 0.6, 0]} material={m.brilho} scale={[1, luz, 1]}>
							<boxGeometry args={[2.3, 0.22, 1.25]} />
						</mesh>
						{/* tampa com dobradiça atrás */}
						<group position={[0, 0.7, -0.75]} rotation={[-tampa * 1.9, 0, 0]}>
							<mesh position={[0, 0.28, 0.75]} material={m.roxo}>
								<boxGeometry args={[2.6, 0.5, 1.5]} />
							</mesh>
							<mesh position={[0, 0.28, 0.75]} material={m.ouro}>
								<boxGeometry args={[0.2, 0.54, 1.54]} />
							</mesh>
						</group>
						{/* moedas saltando */}
						{MOEDAS.map((c, i) => {
							const l = frame - abre - c.atraso;
							if (l < 0) return null;
							const y = 0.7 + l * c.vy * 0.9 - l * l * 0.006;
							if (y < -0.5) return null;
							return (
								<mesh key={i} position={[c.x * (0.6 + l * 0.02), y, 0.1 * (i % 3)]} rotation={[l * c.giro, l * 0.08, 0]} material={m.ouro}>
									<cylinderGeometry args={[0.2, 0.2, 0.05, 28]} />
								</mesh>
							);
						})}
					</group>
				</ThreeCanvas>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

export const pecas: Pecas = {d33Videos, d33Cartao, d33Bau};
