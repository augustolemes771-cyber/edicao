// Peças (efeitos) exclusivas do entrevista-3-v7, usadas no edit.ts com {tipo: 'peca', nome: '<chave>', dados: {...}}.
// Prefixe as chaves com v7 (ex.: v7Gancho): o registro junta as peças de todos os projetos.
// v7ZeroBarreira e v7CelularInternet também servem ao v11 (mesmo contrato de dados; tempos em segundos do vídeo editado).
// Câmera 3D de referência: fov 35 a 14,5 de distância (meia altura ~4,57, meia largura ~2,57 unidades; y 0 = meio do quadro).
import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import type {CenaPeca, Pecas} from '../../pecas/peca';
import {FundoMotion, GradeReta} from '../../pecas/FundoMotion';
import {CameraTremor, Linha3D, Luzes} from '../../pecas/tres/Texto3D';
import {CelularReal, Globo, Parede, Relogio24, Sinal} from '../../pecas/tres/ObjetosPista';
import {poppins} from '../../motor/tema';

const lim = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const OURO = '#E8C27A';
const GL = {alpha: true, antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05};
const CAMERA = {fov: 35, position: [0, 0, 14.5] as [number, number, number], near: 0.1, far: 60};
// px do quadro 1080x1920 → y do mundo 3D.
const yMundo = (px: number) => ((960 - px) / 960) * 14.5 * Math.tan((35 / 2) * (Math.PI / 180));

// Tempos da cena: quadro local de um segundo do vídeo editado, entrada e saída suaves.
const useCena = (cena: CenaPeca) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const fim = Math.round((cena.ate - cena.de) * fps);
	const q = (s: unknown) => Math.round(Math.max(0, Number(s) - cena.de) * fps);
	const entrada = interpolate(frame, [0, 7], [0, 1], lim);
	const saida = interpolate(frame, [fim - 7, fim], [1, 0], lim);
	return {frame, fps, width, height, fim, q, entrada, saida, t: frame / fps};
};

const useMats = () =>
	useMemo(
		() => ({
			ouro: new THREE.MeshStandardMaterial({color: OURO, metalness: 1, roughness: 0.22}),
			ouroBrilho: new THREE.MeshStandardMaterial({color: '#ffe3a3', metalness: 0.9, roughness: 0.18, emissive: '#c99a3e', emissiveIntensity: 0.5}),
			roxo: new THREE.MeshPhysicalMaterial({color: '#2a1552', metalness: 0.3, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.15}),
			roxoClaro: new THREE.MeshPhysicalMaterial({color: '#5b34a8', metalness: 0.35, roughness: 0.3, clearcoat: 1}),
			prata: new THREE.MeshStandardMaterial({color: '#d6d8e2', metalness: 1, roughness: 0.22}),
			branco: new THREE.MeshPhysicalMaterial({color: '#f1edf7', metalness: 0.1, roughness: 0.28, clearcoat: 1}),
			pelo: new THREE.MeshStandardMaterial({color: '#9a93a8', metalness: 0.1, roughness: 0.75}),
			rosa: new THREE.MeshStandardMaterial({color: '#e8a3b4', metalness: 0, roughness: 0.6}),
			preto: new THREE.MeshStandardMaterial({color: '#0a0710', metalness: 0.3, roughness: 0.2}),
		}),
		[],
	);

// Véu roxo no topo (texto sobre o céu) ou na metade de baixo (meia tela), como nas peças do tema.
const VeuTopo: React.FC<{op: number; ate?: number}> = ({op, ate = 640}) => (
	<AbsoluteFill style={{opacity: op, background: `linear-gradient(180deg, rgba(30,15,58,0.84) 0%, rgba(30,15,58,0.55) ${(ate / 1920) * 60}%, rgba(30,15,58,0) ${(ate / 1920) * 100}%)`}} />
);
const VeuBaixo: React.FC<{op: number}> = ({op}) => (
	<AbsoluteFill style={{opacity: op}}>
		<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(30,15,58,0) 45%, rgba(30,15,58,0.5) 54%, rgba(24,11,48,0.66) 100%)'}} />
		<GradeReta topo={0.5} />
	</AbsoluteFill>
);

const Pilula: React.FC<{texto: string; y: number; p: number; live?: boolean; t: number}> = ({texto, y, p, live, t}) => (
	<div style={{position: 'absolute', top: y, width: '100%', display: 'flex', justifyContent: 'center', opacity: p, transform: `translateY(${(1 - p) * 18}px) scale(${0.92 + 0.08 * p})`}}>
		<div style={{display: 'flex', alignItems: 'center', gap: 16, padding: '12px 34px', borderRadius: 999, background: 'linear-gradient(180deg, rgba(46,24,86,0.86), rgba(30,15,58,0.86))', boxShadow: `inset 0 0 0 2px ${OURO}, 0 0 26px rgba(232,194,122,0.35)`, fontFamily: poppins, fontWeight: 800, fontSize: 38, letterSpacing: '0.14em', color: '#fff'}}>
			{live ? <span style={{width: 18, height: 18, borderRadius: 9, background: '#ff3b4d', boxShadow: '0 0 14px #ff3b4d', opacity: 0.55 + 0.45 * Math.sin(t * 9)}} /> : null}
			<span style={{marginRight: '-0.14em'}}>{texto}</span>
		</div>
	</div>
);

// ---------------------------------------------------------------- gancho

// Halter de academia em 3D: barra de prata, anilhas roxas com aro de ouro.
const Halter: React.FC = () => {
	const m = useMats();
	return (
		<group rotation={[0, 0, Math.PI / 2]}>
			<mesh material={m.prata}>
				<cylinderGeometry args={[0.07, 0.07, 2.5, 20]} />
			</mesh>
			{[-1, 1].map((lado) => (
				<group key={lado}>
					{[0.72, 0.92].map((y, i) => (
						<group key={i} position={[0, lado * y, 0]}>
							<mesh material={m.roxo}>
								<cylinderGeometry args={[i ? 0.42 : 0.56, i ? 0.42 : 0.56, 0.17, 40]} />
							</mesh>
							<mesh material={m.ouro} rotation={[Math.PI / 2, 0, 0]}>
								<torusGeometry args={[i ? 0.42 : 0.56, 0.03, 10, 40]} />
							</mesh>
						</group>
					))}
					<mesh position={[0, lado * 1.12, 0]} material={m.ouro}>
						<cylinderGeometry args={[0.12, 0.12, 0.1, 20]} />
					</mesh>
				</group>
			))}
		</group>
	);
};

// Gancho: "EX-PROFISSIONAL DE EDUCAÇÃO FÍSICA" com um halter de ouro girando acima da cabeça; no "8" o halter sobe e some,
// e o faturamento conta de R$ 1 a R$ 8 MILHÕES em ouro 3D (saltos que desaceleram), trava com clarão e ganha "SÓ FAZENDO LIVE".
// dados: {conta: segundo em que começa a contar; trava: segundo em que trava em 8; live: segundo do "live"}.
const v7Gancho: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, width, height, q, entrada, saida, t} = useCena(cena);
	const d = cena.dados ?? {};
	const conta = q(d.conta);
	const trava = Math.max(conta + 12, q(d.trava));
	const live = q(d.live);
	const k = interpolate(frame, [conta, trava], [0, 1], lim);
	const valor = Math.max(1, Math.round(8 * (1 - Math.pow(1 - k, 2.6))));
	const texto = valor === 1 ? 'R$ 1 MILHÃO' : `R$ ${valor} MILHÕES`;
	// Quadro em que o valor atual apareceu (para o salto de cada número).
	let desde = conta;
	for (let f = frame; f > conta; f--) {
		const kk = interpolate(f - 1, [conta, trava], [0, 1], lim);
		if (Math.max(1, Math.round(8 * (1 - Math.pow(1 - kk, 2.6)))) !== valor) {
			desde = f;
			break;
		}
	}
	const salto = 1 + 0.1 * Math.exp(-(frame - desde) / 2.5);
	const halterIn = spring({frame, fps, config: {damping: 12, stiffness: 120}});
	const halterSai = interpolate(frame, [conta - 6, conta + 4], [0, 1], lim);
	const clarao = frame >= trava ? Math.exp(-(frame - trava) / 3) : 0;
	const pLive = spring({frame: frame - live, fps, config: {damping: 14, stiffness: 150}});
	const kicker = interpolate(frame, [2, 10], [0, 1], lim) * (1 - halterSai);
	const giro = frame - trava;
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: saida}}>
			<VeuTopo op={entrada} />
			<AbsoluteFill style={{opacity: frame >= conta ? 0.9 : 0, background: `radial-gradient(ellipse 50% 9% at 50% ${(330 / 1920) * 100}%, rgba(255,214,140,${0.25 + 0.45 * clarao}) 0%, rgba(150,90,220,0.18) 55%, rgba(0,0,0,0) 100%)`}} />
			<div style={{position: 'absolute', top: 226, width: '100%', textAlign: 'center', opacity: kicker, transform: `translateY(${(1 - kicker) * 12}px)`}}>
				<span style={{fontFamily: poppins, fontWeight: 800, fontSize: 32, letterSpacing: '0.3em', marginRight: '-0.3em', color: OURO}}>EX-PROFISSIONAL DE EDUCAÇÃO FÍSICA</span>
			</div>
			<AbsoluteFill style={{filter: 'drop-shadow(0 22px 30px rgba(12,4,28,0.6))'}}>
				<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
					<Luzes quadro={frame} batidas={[0, trava]} />
					<pointLight position={[0, yMundo(330), -3]} intensity={frame >= conta ? 30 : 0} distance={9} color="#ffcf7a" />
					{halterSai < 1 ? (
						<group position={[0, yMundo(400) + halterSai * 3 + Math.sin(t * 5) * 0.12, 0]} scale={halterIn * (1 - halterSai * 0.7)} rotation={[0.35 + Math.sin(t * 2) * 0.15, t * 2.4, 0.1]}>
							<Halter />
						</group>
					) : null}
					{frame >= conta ? (
						<group key={texto} position={[0, yMundo(330), 0]} scale={salto} rotation={[0, giro > 0 ? Math.sin((giro / fps) * 1.7) * 0.18 : 0, 0]}>
							<Linha3D texto={texto} metal="ouro" largura={valor === 1 ? 4.1 : 4.6} y={0} quadro={frame} batida={desde === conta ? conta : -60} profundidade={0.6} />
						</group>
					) : null}
				</ThreeCanvas>
			</AbsoluteFill>
			<AbsoluteFill style={{background: '#fff', opacity: 0.42 * clarao}} />
			<Pilula texto="SÓ FAZENDO LIVE" y={430} p={frame >= live ? pLive : 0} live t={t} />
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- zero barreira (também no v11)

// Tela inteira: "ZERO BARREIRA / DE ENTRADA" em 3D, muro de tijolos que se monta e explode no `quebra`, câmera treme.
// dados: {quebra: segundo editado em que a barreira quebra}.
const v7ZeroBarreira: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, width, height, fim, q, entrada, saida, t} = useCena(cena);
	// O muro leva ~0,6 s para se montar: quebra nunca antes disso.
	const quebra = Math.max(18, q(cena.dados?.quebra));
	const luz = frame >= quebra ? Math.exp(-(frame - quebra) / 5) : 0;
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: entrada * saida}}>
			<FundoMotion />
			<AbsoluteFill style={{background: `radial-gradient(ellipse 60% 22% at 50% 52%, rgba(255,214,140,${0.08 + 0.5 * luz}) 0%, rgba(0,0,0,0) 100%)`}} />
			<AbsoluteFill style={{filter: 'drop-shadow(0 22px 30px rgba(8,2,20,0.65))'}}>
				<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
					<CameraTremor quadro={frame} batidas={[quebra]} z0={14.5} z1={13.9} duracao={fim} />
					<Luzes quadro={frame} batidas={[2, quebra]} />
					<Linha3D texto="ZERO BARREIRA" metal="branco" largura={4.6} y={yMundo(400)} quadro={frame} batida={2} profundidade={0.4} />
					<Linha3D texto="DE ENTRADA" metal="ouro" largura={3.1} y={yMundo(560)} quadro={frame} batida={9} profundidade={0.36} />
					<group position={[0, yMundo(1080), 0]} scale={1.05} rotation={[0.12, Math.sin(t * 1.3) * 0.12, 0]}>
						<Parede q={frame} quebra={quebra} />
					</group>
				</ThreeCanvas>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- celular e internet (também no v11)

// Tela inteira: celular 3D que sobe girando no `celular` ("UM CELULAR") e, no `internet`, o globo de ouro acende ao lado
// com o sinal saindo do celular ("+ INTERNET").
// dados: {celular: segundo editado; internet: segundo editado}.
const v7CelularInternet: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, width, height, fim, q, entrada, saida, t} = useCena(cena);
	const cel = q(cena.dados?.celular);
	const net = Math.max(cel + 6, q(cena.dados?.internet));
	const pc = spring({frame: frame - cel, fps, config: {damping: 13, stiffness: 110}});
	const pn = spring({frame: frame - net, fps, config: {damping: 12, stiffness: 120}});
	const acende = interpolate(frame, [net, net + 24], [0, 1], lim);
	const pos = net > cel ? interpolate(pn, [0, 1], [0, -0.55]) : 0;
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: entrada * saida}}>
			<FundoMotion />
			<AbsoluteFill style={{background: `radial-gradient(ellipse 55% 30% at 50% 50%, rgba(232,194,122,${0.1 + 0.18 * acende}) 0%, rgba(0,0,0,0) 100%)`}} />
			<AbsoluteFill style={{filter: 'drop-shadow(0 26px 34px rgba(8,2,20,0.7))'}}>
				<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
					<CameraTremor quadro={frame} batidas={[]} z0={14.8} z1={13.8} duracao={fim} />
					<Luzes quadro={frame} batidas={[cel, net]} />
					{frame >= cel ? <Linha3D texto="UM CELULAR" metal="branco" largura={4.2} y={yMundo(330)} quadro={frame} batida={cel} profundidade={0.4} /> : null}
					{frame >= net ? <Linha3D texto="+ INTERNET" metal="ouro" largura={4.2} y={yMundo(1450)} quadro={frame} batida={net} profundidade={0.4} /> : null}
					<group position={[pos, yMundo(960) + (1 - pc) * -7, 0]} rotation={[0.08, (1 - pc) * Math.PI * 2 + Math.sin(t * 1.4) * 0.25, (1 - pc) * 0.4]} scale={0.95}>
						<CelularReal segundos={t} />
					</group>
					{frame >= net ? (
						<>
							<group position={[1.55, yMundo(720), 0.3]} scale={0.62 * pn}>
								<Globo segundos={t} acende={acende} />
							</group>
							<group position={[0.55 + pos, yMundo(700), 0.4]} scale={0.9}>
								<Sinal segundos={t} liga={acende} />
							</group>
						</>
					) : null}
				</ThreeCanvas>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- corrida dos ratos

// Rato de pelúcia cinza correndo (corpo, cabeça, orelhas rosadas, rabo e patas que alternam).
const Rato: React.FC<{t: number}> = ({t}) => {
	const m = useMats();
	const passo = t * 20;
	const rabo = useMemo(() => {
		const c = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.5, 0, 0), new THREE.Vector3(-0.85, 0.12, 0), new THREE.Vector3(-1.15, 0.02, 0), new THREE.Vector3(-1.35, 0.2, 0)]);
		return new THREE.TubeGeometry(c, 24, 0.03, 6, false);
	}, []);
	return (
		<group position={[0, Math.abs(Math.sin(passo)) * 0.08, 0]} rotation={[0, 0, Math.sin(passo) * 0.05]}>
			<mesh material={m.pelo} scale={[0.58, 0.32, 0.32]}>
				<sphereGeometry args={[1, 28, 20]} />
			</mesh>
			<mesh material={m.pelo} position={[0.55, 0.1, 0]} scale={[0.3, 0.24, 0.24]}>
				<sphereGeometry args={[1, 24, 16]} />
			</mesh>
			<mesh material={m.rosa} position={[0.84, 0.08, 0]}>
				<sphereGeometry args={[0.05, 12, 8]} />
			</mesh>
			{[-1, 1].map((z) => (
				<group key={z}>
					<mesh material={m.rosa} position={[0.47, 0.34, z * 0.14]} rotation={[0, 0, 0.2]}>
						<cylinderGeometry args={[0.12, 0.12, 0.03, 20]} />
					</mesh>
					<mesh material={m.preto} position={[0.72, 0.18, z * 0.12]}>
						<sphereGeometry args={[0.035, 10, 8]} />
					</mesh>
				</group>
			))}
			<mesh geometry={rabo} material={m.rosa} />
			{[
				[0.32, 0.17, 0],
				[0.32, -0.17, Math.PI],
				[-0.3, 0.17, Math.PI],
				[-0.3, -0.17, 0],
			].map(([x, z, fase], i) => (
				<mesh key={i} material={m.rosa} position={[x + Math.sin(passo + fase) * 0.1, -0.3, z]} rotation={[0, 0, Math.sin(passo + fase) * 0.6]}>
					<cylinderGeometry args={[0.04, 0.04, 0.2, 8]} />
				</mesh>
			))}
		</group>
	);
};

// Tela inteira: rato correndo dentro de uma roda de prata que gira cada vez mais rápido, sem sair do lugar, com
// "CORRIDA / DOS RATOS" em 3D. dados: {corrida: segundo do "corrida"; ratos: segundo do "ratos"}.
const v7CorridaRatos: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, width, height, fim, q, entrada, saida, t} = useCena(cena);
	const m = useMats();
	const c1 = q(cena.dados?.corrida);
	const c2 = Math.max(c1 + 5, q(cena.dados?.ratos));
	const p = spring({frame, fps, config: {damping: 14, stiffness: 110}});
	const giro = t * 3 + t * t * 2.2;
	const raio = 1.75;
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: entrada * saida}}>
			<FundoMotion />
			<AbsoluteFill style={{filter: 'drop-shadow(0 26px 34px rgba(8,2,20,0.7))'}}>
				<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
					<CameraTremor quadro={frame} batidas={[]} z0={14.8} z1={13.6} duracao={fim} />
					<Luzes quadro={frame} batidas={[c1, c2]} />
					{frame >= c1 ? <Linha3D texto="CORRIDA" metal="branco" largura={3.6} y={yMundo(330)} quadro={frame} batida={c1} profundidade={0.4} /> : null}
					{frame >= c2 ? <Linha3D texto="DOS RATOS" metal="ouro" largura={3.9} y={yMundo(500)} quadro={frame} batida={c2} profundidade={0.4} /> : null}
					<group position={[0, yMundo(1130), 0]} scale={p} rotation={[0.18, -0.45 + Math.sin(t * 0.9) * 0.08, 0]}>
						{/* Roda: dois aros, travessas que giram, eixo e suporte. */}
						<group rotation={[0, 0, -giro]}>
							{[-0.4, 0.4].map((z) => (
								<mesh key={z} position={[0, 0, z]} material={m.prata}>
									<torusGeometry args={[raio, 0.05, 12, 72]} />
								</mesh>
							))}
							{Array.from({length: 24}, (_, i) => {
								const a = (i / 24) * Math.PI * 2;
								return (
									<mesh key={i} position={[Math.cos(a) * raio, Math.sin(a) * raio, 0]} rotation={[Math.PI / 2, 0, 0]} material={i % 6 ? m.prata : m.ouro}>
										<cylinderGeometry args={[0.022, 0.022, 0.8, 6]} />
									</mesh>
								);
							})}
							{Array.from({length: 6}, (_, i) => (
								<mesh key={`r${i}`} position={[0, 0, -0.4]} rotation={[0, 0, (i / 6) * Math.PI * 2]} material={m.prata}>
									<boxGeometry args={[raio * 2, 0.035, 0.035]} />
								</mesh>
							))}
						</group>
						<mesh position={[0, 0, -0.45]} rotation={[Math.PI / 2, 0, 0]} material={m.ouro}>
							<cylinderGeometry args={[0.12, 0.12, 0.2, 20]} />
						</mesh>
						<mesh position={[0, -raio * 0.55, -0.55]} rotation={[0, 0, 0]} material={m.roxoClaro}>
							<boxGeometry args={[0.16, raio * 1.1, 0.1]} />
						</mesh>
						<mesh position={[0, -raio - 0.2, -0.55]} material={m.roxo}>
							<boxGeometry args={[2.6, 0.16, 1.2]} />
						</mesh>
						<group position={[0, -raio + 0.4, 0]} scale={0.75}>
							<Rato t={t} />
						</group>
					</group>
				</ThreeCanvas>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- suplemento

// Pote de suplemento 3D: corpo roxo, faixa de ouro e tampa branca.
const Pote: React.FC = () => {
	const m = useMats();
	return (
		<group>
			<mesh material={m.roxo}>
				<cylinderGeometry args={[0.55, 0.52, 1.15, 48]} />
			</mesh>
			<mesh material={m.ouroBrilho}>
				<cylinderGeometry args={[0.562, 0.552, 0.42, 48]} />
			</mesh>
			<mesh position={[0, 0.66, 0]} material={m.branco}>
				<cylinderGeometry args={[0.58, 0.58, 0.2, 48]} />
			</mesh>
			{Array.from({length: 24}, (_, i) => (
				<mesh key={i} position={[Math.cos((i / 24) * Math.PI * 2) * 0.585, 0.66, Math.sin((i / 24) * Math.PI * 2) * 0.585]} material={m.branco}>
					<boxGeometry args={[0.03, 0.16, 0.03]} />
				</mesh>
			))}
		</group>
	);
};

// Meia tela: pote de suplemento girando sobre a grade; a cada ideia ele pula e o texto 3D troca no mesmo lugar.
// dados: {linhas: {texto, em}[]}.
const v7Suplemento: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, width, height, q, entrada, saida, t} = useCena(cena);
	const linhas = ((cena.dados?.linhas ?? []) as {texto: string; em: number}[]).map((l) => ({...l, f: q(l.em)}));
	const p = spring({frame, fps, config: {damping: 13, stiffness: 120}});
	let pulo = 0;
	for (const l of linhas) if (frame >= l.f) pulo = Math.max(pulo, Math.sin(Math.min(1, (frame - l.f) / 9) * Math.PI) * (frame - l.f < 9 ? 1 : 0));
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: saida}}>
			<VeuBaixo op={entrada} />
			<AbsoluteFill style={{filter: 'drop-shadow(0 22px 30px rgba(8,2,20,0.65))'}}>
				<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
					<Luzes quadro={frame} batidas={linhas.map((l) => l.f)} />
					<group position={[0, yMundo(1340) + (1 - p) * -3 + pulo * 0.45, 0]} rotation={[0.25, t * 1.1, pulo * 0.25]} scale={1.05}>
						<Pote />
					</group>
					{linhas.map((l, i) => {
						const proxima = linhas[i + 1]?.f ?? Infinity;
						if (frame < l.f || frame >= proxima) return null;
						return <Linha3D key={i} texto={l.texto} metal={i % 2 ? 'branco' : 'ouro'} largura={Math.min(4.6, 0.36 * l.texto.length + 0.6)} y={yMundo(1070)} quadro={frame} batida={l.f} profundidade={0.36} />;
					})}
				</ThreeCanvas>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- recorde

// Meia tela: cinco barras 3D sobem mês a mês (a última em ouro, bem mais alta) e o valor conta junto até "R$ 1,4 MI".
// dados: {sobe: segundo em que as barras começam; trava: segundo em que o valor trava}.
const v7Recorde: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, width, height, q, entrada, saida, t} = useCena(cena);
	const m = useMats();
	const sobe = q(cena.dados?.sobe);
	const trava = Math.max(sobe + 15, q(cena.dados?.trava));
	const alturas = [0.45, 0.7, 0.6, 0.95, 1.75];
	const k = interpolate(frame, [sobe, trava], [0, 1], lim);
	const valor = (1.4 * (1 - Math.pow(1 - k, 2.4))).toFixed(1).replace('.', ',');
	const travou = frame >= trava;
	const clarao = travou ? Math.exp(-(frame - trava) / 3) : 0;
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: saida}}>
			<VeuBaixo op={entrada} />
			<AbsoluteFill style={{filter: 'drop-shadow(0 22px 30px rgba(8,2,20,0.65))'}}>
				<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
					<Luzes quadro={frame} batidas={[sobe, trava]} />
					<group position={[0, yMundo(1470), 0]} rotation={[0.2, -0.35 + Math.sin(t * 0.8) * 0.06, 0]}>
						{alturas.map((h, i) => {
							const pi = spring({frame: frame - sobe - i * 4, fps, config: {damping: 14, stiffness: 120}});
							const a = Math.max(0.02, h * pi);
							return (
								<mesh key={i} position={[(i - 2) * 0.78, a / 2, 0]} material={i === 4 ? m.ouroBrilho : i % 2 ? m.prata : m.roxoClaro}>
									<boxGeometry args={[0.5, a, 0.5]} />
								</mesh>
							);
						})}
						<mesh position={[0, -0.04, 0]} material={m.roxo}>
							<boxGeometry args={[4.2, 0.08, 0.9]} />
						</mesh>
					</group>
					{frame >= sobe ? (
						<group key={valor} position={[0, yMundo(1050), 0]} scale={1 + 0.12 * clarao}>
							<Linha3D texto={`R$ ${valor} MI`} metal={travou ? 'ouro' : 'branco'} largura={3.9} y={0} quadro={frame} batida={-60} profundidade={0.45} />
						</group>
					) : null}
				</ThreeCanvas>
			</AbsoluteFill>
			<AbsoluteFill style={{background: '#fff', opacity: 0.3 * clarao}} />
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 8 horas → 24 horas

// Relógio de ouro acima da cabeça com os ponteiros voando; embaixo, "8 HORAS?" em prata e, no "24", "24 HORAS" em ouro.
// dados: {oito: segundo do "8 horas"; vinte4: segundo do "24"}.
const v7Relogio: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, width, height, q, entrada, saida, t} = useCena(cena);
	const oito = q(cena.dados?.oito);
	const v24 = Math.max(oito + 8, q(cena.dados?.vinte4));
	const virou = frame >= v24;
	const kicker = interpolate(frame, [v24 - 6, v24 + 2], [0, 1], lim);
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: saida}}>
			<VeuTopo op={entrada} ate={560} />
			<AbsoluteFill style={{opacity: entrada, background: 'linear-gradient(180deg, rgba(30,15,58,0) 48%, rgba(30,15,58,0.5) 56%, rgba(30,15,58,0) 66%)'}} />
			<div style={{position: 'absolute', top: 1170, width: '100%', textAlign: 'center', opacity: kicker}}>
				<span style={{fontFamily: poppins, fontWeight: 800, fontSize: 34, letterSpacing: '0.34em', marginRight: '-0.34em', color: OURO}}>EU PASSO ATÉ</span>
			</div>
			<AbsoluteFill style={{filter: 'drop-shadow(0 22px 30px rgba(12,4,28,0.6))'}}>
				<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
					<Luzes quadro={frame} batidas={[oito, v24]} />
					<group position={[0, yMundo(330), 0]} scale={virou ? 1.75 + 0.15 * Math.exp(-(frame - v24) / 4) : 1.6}>
						<Relogio24 q={virou ? frame + Math.round(t * 40) : frame} entra={oito} />
					</group>
					{frame >= oito && !virou ? <Linha3D texto="8 HORAS?" metal="branco" largura={3.6} y={yMundo(1070)} quadro={frame} batida={oito} profundidade={0.38} /> : null}
					{virou ? <Linha3D texto="24 HORAS" metal="ouro" largura={3.9} y={yMundo(1070)} quadro={frame} batida={v24} profundidade={0.5} /> : null}
				</ThreeCanvas>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

export const pecas: Pecas = {v7Gancho, v7ZeroBarreira, v7CelularInternet, v7CorridaRatos, v7Suplemento, v7Recorde, v7Relogio};
