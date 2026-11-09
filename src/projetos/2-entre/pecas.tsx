// Peças (efeitos) exclusivas do projeto 2-entre, usadas no edit.ts com {tipo: 'peca', nome: '<chave>', dados: {...}}.
// Tempos em dados = segundos do vídeo editado; o quadro 0 da peça é cena.de. Todas têm fallback se faltar dado.
// Posições em px de um quadro 1080x1920; no 3D (câmera fov 35 a 14,5) 1 unidade ≈ 210 px e a largura útil é ±2,57.
// Rostos em y 730–960: "sobre o vídeo" usa a faixa acima da cabeça (y 215–600) ou a meia tela de baixo (y 1000–1500).
// Regras do tema: nada de anel com partículas; todo motion de tela inteira usa FundoMotion (grade reta, cor do fundo).
import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import type {CenaPeca, Pecas} from '../../pecas/peca';
import {FundoMotion, GradeReta} from '../../pecas/FundoMotion';
import {Linha3D, Luzes} from '../../pecas/tres/Texto3D';
import type {Metal} from '../../pecas/tres/Texto3D';
import {playfair, poppins} from '../../motor/tema';

type Item = {texto: string; em: number; icone?: string; metal?: Metal};
type Dados = {
	marcos?: number[];
	itens?: Item[];
	linhas?: {texto: string; em: number; metal?: Metal}[];
};

const lim = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const OURO = '#E8C27A';
const OURO_TEXTO = 'linear-gradient(180deg,#FFF1C9 0%,#F2D08A 40%,#E8C27A 65%,#C9974A 100%)';
const VERMELHO = '#E5484D';
const GL = {alpha: true, antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05};
const CAMERA = {fov: 35, position: [0, 0, 14.5] as [number, number, number], near: 0.1, far: 60};
const K = 210;
const wx = (px: number) => (px - 540) / K;
const wy = (px: number) => (960 - px) / K;
const suave = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

const matOuro = new THREE.MeshPhysicalMaterial({color: '#e9b44c', metalness: 1, roughness: 0.22, clearcoat: 0.6, clearcoatRoughness: 0.15, envMapIntensity: 1.5});
const matOuroEscuro = new THREE.MeshPhysicalMaterial({color: '#9a6a1c', metalness: 1, roughness: 0.3, envMapIntensity: 1.2});
const matRoxo = new THREE.MeshPhysicalMaterial({color: '#5b34a8', metalness: 0.3, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 1});
const matVidro = new THREE.MeshPhysicalMaterial({color: '#cdb8ff', metalness: 0, roughness: 0.05, transmission: 0.6, transparent: true, opacity: 0.35, envMapIntensity: 1});
const matOuroDuplo = new THREE.MeshPhysicalMaterial({color: '#e9b44c', metalness: 1, roughness: 0.25, clearcoat: 0.5, clearcoatRoughness: 0.2, envMapIntensity: 1.4, side: THREE.DoubleSide});
const matRocha = new THREE.MeshPhysicalMaterial({color: '#6a5a8c', metalness: 0.1, roughness: 0.6, flatShading: true, envMapIntensity: 0.8});

// Caixa de cantos arredondados (extrusão de retângulo arredondado), para a mala.
const caixaRedonda = (w: number, h: number, d: number, r: number) => {
	const s = new THREE.Shape();
	const x = -w / 2;
	const y = -h / 2;
	s.moveTo(x + r, y);
	s.lineTo(x + w - r, y);
	s.quadraticCurveTo(x + w, y, x + w, y + r);
	s.lineTo(x + w, y + h - r);
	s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
	s.lineTo(x + r, y + h);
	s.quadraticCurveTo(x, y + h, x, y + h - r);
	s.lineTo(x, y + r);
	s.quadraticCurveTo(x, y, x + r, y);
	const g = new THREE.ExtrudeGeometry(s, {depth: d, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 3, curveSegments: 8});
	g.translate(0, 0, -d / 2);
	return g;
};
const geoMalaCorpo = caixaRedonda(1.9, 0.95, 0.8, 0.14);
const geoMalaTampa = caixaRedonda(1.9, 0.4, 0.8, 0.12);

// Tempo da cena: quadros, entrada, saída e o quadro de um instante do vídeo editado.
const useCena = (cena: CenaPeca) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const dur = Math.round((cena.ate - cena.de) * fps);
	const q = (t: number) => Math.round((t - cena.de) * fps);
	const entra = interpolate(frame, [0, 6], [0, 1], lim);
	const sai = interpolate(frame, [dur - 7, dur], [1, 0], lim);
	const d = (cena.dados ?? {}) as Dados;
	return {frame, fps, width, height, dur, q, entra, sai, d, t: frame / fps};
};

// Marco i (segundos do vídeo) ou, se faltar, cena.de + fallback.
const mc = (d: Dados, cena: CenaPeca, i: number, fb: number) => d.marcos?.[i] ?? cena.de + fb;
const itensOu = (d: Dados, cena: CenaPeca, padrao: string[], ini: number, passo: number): Item[] =>
	d.itens && d.itens.length ? d.itens : padrao.map((texto, i) => ({texto, em: cena.de + ini + i * passo}));
const indiceAtual = (itens: Item[], frame: number, q: (t: number) => number) => {
	let r = -1;
	itens.forEach((it, i) => {
		if (frame >= q(it.em)) r = i;
	});
	return r;
};

const Canvas: React.FC<{children: React.ReactNode; sombra?: boolean}> = ({children, sombra = true}) => {
	const {width, height} = useVideoConfig();
	return (
		<AbsoluteFill style={{filter: sombra ? 'drop-shadow(0 22px 30px rgba(12,4,28,0.6))' : undefined}}>
			<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
				{children}
			</ThreeCanvas>
		</AbsoluteFill>
	);
};

// Faixa escura no topo, para o que fica acima da cabeça ler bem sobre o céu.
const Topo: React.FC<{k: number; ate?: number}> = ({k, ate = 560}) => (
	<AbsoluteFill style={{opacity: k, background: `linear-gradient(180deg, rgba(30,15,58,0.85) 0%, rgba(30,15,58,0.55) ${(ate / 1920) * 70}%, rgba(30,15,58,0) ${(ate / 1920) * 100}%)`}} />
);

// Véu da meia tela de baixo (o vídeo continua aparecendo) com a grade reta.
const VeuBaixo: React.FC<{k: number}> = ({k}) => (
	<AbsoluteFill style={{opacity: k}}>
		<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(30,15,58,0) 44%, rgba(30,15,58,0.55) 53%, rgba(24,11,48,0.72) 100%)'}} />
		<GradeReta topo={0.5} />
	</AbsoluteFill>
);

const Pilula: React.FC<{texto: string; k: number; y: number; tamanho?: number; ouro?: boolean}> = ({texto, k, y, tamanho = 40, ouro}) => (
	<div style={{position: 'absolute', top: y, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: k, transform: `translateY(${(1 - k) * 18}px) scale(${0.94 + 0.06 * k})`}}>
		<div
			style={{
				background: ouro ? 'linear-gradient(180deg,#F6DB9C,#D9A84E)' : 'linear-gradient(180deg, rgba(46,24,86,0.86), rgba(30,15,58,0.86))',
				boxShadow: ouro ? '0 10px 30px rgba(12,4,28,0.45)' : 'inset 0 0 0 1.5px rgba(232,194,122,0.6), 0 10px 30px rgba(12,4,28,0.45)',
				borderRadius: 999,
				padding: `${tamanho * 0.36}px ${tamanho * 0.9}px`,
				fontFamily: poppins,
				fontWeight: 800,
				fontSize: tamanho,
				letterSpacing: '0.08em',
				color: ouro ? '#2a1352' : '#fff',
				whiteSpace: 'nowrap',
				maxWidth: 940,
			}}
		>
			{texto}
		</div>
	</div>
);

// Pílula centrada em x (para rótulos laterais).
const PilulaX: React.FC<{texto: string; k: number; x: number; y: number; tamanho?: number; ouro?: boolean}> = ({texto, k, x, y, tamanho = 40, ouro}) => (
	<div style={{position: 'absolute', top: y, left: x, transform: `translate(-50%, ${(1 - k) * 18}px) scale(${0.94 + 0.06 * k})`, opacity: k}}>
		<div
			style={{
				background: ouro ? 'linear-gradient(180deg,#F6DB9C,#D9A84E)' : 'linear-gradient(180deg, rgba(46,24,86,0.86), rgba(30,15,58,0.86))',
				boxShadow: ouro ? '0 10px 30px rgba(12,4,28,0.45)' : 'inset 0 0 0 1.5px rgba(232,194,122,0.6), 0 10px 30px rgba(12,4,28,0.45)',
				borderRadius: 999,
				padding: `${tamanho * 0.36}px ${tamanho * 0.9}px`,
				fontFamily: poppins,
				fontWeight: 800,
				fontSize: tamanho,
				letterSpacing: '0.08em',
				color: ouro ? '#2a1352' : '#fff',
				whiteSpace: 'nowrap',
			}}
		>
			{texto}
		</div>
	</div>
);

const Kicker: React.FC<{texto: string; k: number; y: number; tamanho?: number}> = ({texto, k, y, tamanho = 84}) => (
	<div style={{position: 'absolute', top: y, left: 40, right: 40, textAlign: 'center', opacity: k, transform: `translateY(${(1 - k) * 20}px)`, filter: `blur(${(1 - k) * 6}px)`}}>
		<span style={{fontFamily: playfair, fontStyle: 'italic', fontWeight: 800, fontSize: tamanho, lineHeight: 1.15, background: OURO_TEXTO, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', padding: '0 0.08em', filter: 'drop-shadow(0 6px 12px rgba(12,4,28,0.55))'}}>
			{texto}
		</span>
	</div>
);

const mola = (frame: number, ini: number, fps: number, damping = 12) => (frame < ini ? 0 : spring({frame: frame - ini, fps, config: {damping, stiffness: 140, mass: 0.8}}));

const easeOutBounce = (x: number) => {
	const n1 = 7.5625;
	const d1 = 2.75;
	if (x < 1 / d1) return n1 * x * x;
	if (x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + 0.75;
	if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375;
	return n1 * (x -= 2.625 / d1) * x + 0.984375;
};

// Avatar de vidro roxo com silhueta (usado na rede e no anel).
const Silhueta: React.FC<{tam: number; cor?: string}> = ({tam, cor = 'rgba(255,255,255,0.88)'}) => (
	<svg width={tam} height={tam} viewBox="0 0 92 92">
		<circle cx={46} cy={36} r={16} fill={cor} />
		<path d="M16 92 C18 66 32 58 46 58 C60 58 74 66 76 92 Z" fill={cor} />
	</svg>
);

// ---------------------------------------------------------------------------------------------------------------------
// 1. Gancho: card de reel girando em 3D, contador de visualizações até 7 milhões e "7 MILHÕES" em texto 3D.
const fmt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const e2Viral: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, entra, sai, d, dur} = useCena(cena);
	const f0 = q(mc(d, cena, 0, 0.3));
	const f1 = q(mc(d, cena, 1, 1.4));
	const f2 = Math.max(f1 + 8, Math.min(q(mc(d, cena, 2, 3.0)), dur - 14));
	const pEnt = mola(frame, 0, fps, 12);
	const pulso = interpolate(frame, [f1, f1 + 4, f1 + 12], [0, 1, 0], lim);
	const k = suave(interpolate(frame, [f1, f2], [0, 1], lim));
	const valor = frame >= f2 ? 7000000 : frame < f1 ? 0 : Math.round(k * 7000000);
	const clarao = interpolate(frame, [f2, f2 + 2, f2 + 9], [0, 0.45, 0], lim);
	const kChip = mola(frame, f0, fps, 11);
	const kCont = interpolate(frame, [f1, f1 + 6], [0, 1], lim);
	const fTexto = Math.min(f1 + 9, dur - 34);
	const progresso = interpolate(frame, [f0, dur - 10], [0.08, 0.92], lim);
	return (
		<AbsoluteFill style={{opacity: entra * sai}}>
			<FundoMotion />
			<AbsoluteFill style={{background: `radial-gradient(ellipse 55% 30% at 50% 42%, rgba(232,194,122,${0.16 + 0.2 * pulso}) 0%, rgba(232,194,122,0) 70%)`}} />
			<div style={{position: 'absolute', left: 540 - 210, top: 380, width: 420, height: 700, perspective: 1400}}>
				<div
					style={{
						width: 420,
						height: 700,
						borderRadius: 48,
						background: 'linear-gradient(165deg, rgba(70,38,128,0.92), rgba(24,11,48,0.96))',
						boxShadow: `inset 0 0 0 2.5px rgba(232,194,122,0.85), 0 30px 60px rgba(8,2,20,0.6), 0 0 ${24 + pulso * 40}px rgba(232,194,122,${0.15 + pulso * 0.4})`,
						opacity: pEnt,
						transform: `rotateY(${(1 - pEnt) * -48 - 5}deg) rotateX(${(1 - pEnt) * 12 + 2}deg) scale(${0.85 + 0.15 * pEnt + pulso * 0.05})`,
						position: 'relative',
						overflow: 'hidden',
					}}
				>
					<div style={{position: 'absolute', left: -60, top: 120, width: 300, height: 300, borderRadius: 150, background: 'radial-gradient(circle, rgba(150,100,230,0.45), rgba(150,100,230,0))'}} />
					<div style={{position: 'absolute', right: -70, bottom: 120, width: 320, height: 320, borderRadius: 160, background: 'radial-gradient(circle, rgba(232,194,122,0.25), rgba(232,194,122,0))'}} />
					<div style={{position: 'absolute', top: 28, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: kChip, transform: `translateY(${(1 - kChip) * -16}px)`}}>
						<div style={{padding: '10px 26px', borderRadius: 999, background: 'linear-gradient(180deg,#F6DB9C,#D9A84E)', fontFamily: poppins, fontWeight: 800, fontSize: 40, letterSpacing: '0.06em', color: '#2a1352', whiteSpace: 'nowrap'}}>1ª SEMANA</div>
					</div>
					<div style={{position: 'absolute', left: 210 - 60, top: 350 - 60, width: 120, height: 120, borderRadius: 60, background: 'rgba(255,255,255,0.95)', boxShadow: '0 10px 30px rgba(8,2,20,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
						<svg width={56} height={60} viewBox="0 0 56 60">
							<path d="M12 6 L50 30 L12 54 Z" fill="#2a1352" />
						</svg>
					</div>
					<div style={{position: 'absolute', left: 30, right: 30, bottom: 44, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.22)'}}>
						<div style={{width: `${progresso * 100}%`, height: '100%', borderRadius: 4, background: '#fff'}} />
					</div>
				</div>
			</div>
			<div style={{position: 'absolute', top: 1130, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 22, opacity: kCont, transform: `translateY(${(1 - kCont) * 18}px) scale(${1 + clarao * 0.12})`}}>
				<svg width={92} height={70} viewBox="0 0 64 48">
					<path d="M4 24 C14 6 50 6 60 24 C50 42 14 42 4 24 Z" fill="none" stroke={OURO} strokeWidth={5} strokeLinejoin="round" />
					<circle cx={32} cy={24} r={9} fill={OURO} />
				</svg>
				<span style={{fontFamily: poppins, fontWeight: 800, fontSize: 80, letterSpacing: '0.02em', background: OURO_TEXTO, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 6px 12px rgba(12,4,28,0.55))'}}>{fmt(valor)}</span>
			</div>
			<Canvas>
				<Luzes quadro={frame} batidas={[f0, f1, fTexto]} />
				<Linha3D ate={dur - 8} texto="7 MILHÕES" metal="ouro" largura={4.2} y={wy(1450)} quadro={frame} batida={fTexto} profundidade={0.5} />
			</Canvas>
			<AbsoluteFill style={{background: '#fff', opacity: clarao}} />
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------------------------------------------------------------
// 2. "Não quer aparecer": silhueta atrás de um celular e o ícone de câmera riscado em vermelho.
const e2SemRosto: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, entra, sai, d, dur} = useCena(cena);
	const fr = Math.max(6, Math.min(q(mc(d, cena, 0, 0.5)), dur - 18));
	const p = mola(frame, 0, fps, 11);
	const risco = suave(interpolate(frame, [fr, fr + 7], [0, 1], lim));
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: sai}}>
			<VeuBaixo k={entra} />
			<svg width={720} height={400} viewBox="0 0 720 400" style={{position: 'absolute', left: 180, top: 1010, opacity: p, transform: `translateY(${(1 - p) * 30}px) scale(${0.9 + 0.1 * p})`, filter: 'drop-shadow(0 14px 22px rgba(8,2,20,0.55))'}}>
				<defs>
					<linearGradient id="e2srVidro" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" stopColor="#7a4fd0" stopOpacity="0.85" />
						<stop offset="1" stopColor="#2e1856" stopOpacity="0.9" />
					</linearGradient>
					<linearGradient id="e2srOuro" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" stopColor="#FFF1C9" />
						<stop offset="0.6" stopColor="#E8C27A" />
						<stop offset="1" stopColor="#C9974A" />
					</linearGradient>
				</defs>
				<circle cx={210} cy={110} r={70} fill="url(#e2srVidro)" stroke={OURO} strokeWidth={4} />
				<path d="M60 400 C62 270 130 228 210 228 C290 228 358 270 360 400 Z" fill="url(#e2srVidro)" stroke={OURO} strokeWidth={4} />
				<rect x={290} y={40} width={170} height={340} rx={30} fill="rgba(20,10,40,0.92)" stroke="url(#e2srOuro)" strokeWidth={5} />
				<rect x={304} y={74} width={142} height={266} rx={14} fill="url(#e2srVidro)" />
				<rect x={350} y={52} width={50} height={8} rx={4} fill="rgba(255,255,255,0.4)" />
				<g>
					<rect x={520} y={130} width={150} height={110} rx={22} fill="rgba(255,255,255,0.14)" stroke="#fff" strokeWidth={5} />
					<rect x={560} y={112} width={70} height={26} rx={10} fill="#fff" />
					<circle cx={595} cy={185} r={34} fill="none" stroke="#fff" strokeWidth={6} />
					<circle cx={595} cy={185} r={13} fill={OURO} />
					<line x1={500} y1={100} x2={500 + 190 * risco} y2={100 + 160 * risco} stroke={VERMELHO} strokeWidth={16} strokeLinecap="round" opacity={risco > 0 ? 1 : 0} />
				</g>
			</svg>
			<Pilula texto="SEM APARECER" k={interpolate(frame, [fr, fr + 6], [0, 1], lim)} y={1405} ouro />
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------------------------------------------------------------
// 3. Nicho: batom → frasco conta-gotas → prateleira com produtos que caem, sempre no mesmo lugar.
const Batom: React.FC<{p: number; frame: number}> = ({p, frame}) => (
	<group scale={0.95 * p} rotation={[0.12, frame * 0.05, 0]}>
		<mesh position={[0, -0.45, 0]} material={matOuro}>
			<cylinderGeometry args={[0.3, 0.3, 0.7, 40]} />
		</mesh>
		<mesh position={[0, -0.07, 0]} material={matOuroEscuro}>
			<cylinderGeometry args={[0.315, 0.315, 0.09, 40]} />
		</mesh>
		<mesh position={[0, 0.3, 0]} material={matRoxo}>
			<cylinderGeometry args={[0.22, 0.22, 0.66, 40]} />
		</mesh>
		<mesh position={[0, 0.63, 0]} scale={[1, 0.8, 1]} material={matRoxo}>
			<sphereGeometry args={[0.22, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
		</mesh>
	</group>
);
const Frasco: React.FC<{p: number; frame: number}> = ({p, frame}) => (
	<group scale={1.05 * p} rotation={[0.1, frame * 0.05, 0]}>
		<mesh position={[0, -0.1, 0]} material={matVidro}>
			<cylinderGeometry args={[0.48, 0.48, 0.95, 40]} />
		</mesh>
		<mesh position={[0, -0.22, 0]} material={matRoxo}>
			<cylinderGeometry args={[0.4, 0.4, 0.55, 40]} />
		</mesh>
		<mesh position={[0, 0.45, 0]} material={matOuro}>
			<cylinderGeometry args={[0.22, 0.28, 0.16, 32]} />
		</mesh>
		<mesh position={[0, 0.62, 0]} material={matOuroEscuro}>
			<cylinderGeometry args={[0.2, 0.2, 0.18, 32]} />
		</mesh>
		<mesh position={[0, 0.9, 0]} scale={[1, 1.35, 1]} material={matRoxo}>
			<sphereGeometry args={[0.2, 32, 24]} />
		</mesh>
	</group>
);
const PRATELEIRA = [
	{x: -1.45, h: 0.55, r: 0.3, mat: matRoxo},
	{x: -0.72, h: 0.85, r: 0.2, mat: matVidro},
	{x: 0, h: 0.4, r: 0.36, mat: matRoxo},
	{x: 0.72, h: 0.8, r: 0.22, mat: matOuro},
	{x: 1.45, h: 0.6, r: 0.28, mat: matRoxo},
];
const Prateleira: React.FC<{frame: number; fps: number; f0: number}> = ({frame, fps, f0}) => {
	const pt = mola(frame, f0, fps, 12);
	return (
		<group rotation={[0.1, -0.15, 0]} scale={pt}>
			<mesh position={[0, -0.55, 0]} material={matOuroEscuro}>
				<boxGeometry args={[3.9, 0.1, 0.8]} />
			</mesh>
			{PRATELEIRA.map((it, i) => {
				const ini = f0 + 3 + i * 5;
				if (frame < ini) return null;
				const p = spring({frame: frame - ini, fps, config: {damping: 7, stiffness: 150, mass: 0.7}});
				return (
					<group key={i} position={[it.x, -0.5 + it.h / 2 + (1 - p) * 2.4, 0]}>
						<mesh material={it.mat}>
							<cylinderGeometry args={[it.r, it.r, it.h, 32]} />
						</mesh>
						<mesh position={[0, it.h / 2 + 0.06, 0]} material={matOuro}>
							<cylinderGeometry args={[it.r * 0.7, it.r * 0.85, 0.12, 32]} />
						</mesh>
					</group>
				);
			})}
		</group>
	);
};
const e2Nicho: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, entra, sai, d} = useCena(cena);
	const itens = itensOu(d, cena, ['BELEZA', 'SKINCARE', 'PRODUTOS EM CASA'], 0.2, 1.6);
	const i = indiceAtual(itens, frame, q);
	const it = itens[i];
	const f0 = it ? q(it.em) : 0;
	const p = mola(frame, f0, fps, 10);
	const k = interpolate(frame, [f0, f0 + 6], [0, 1], lim);
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: sai}}>
			<VeuBaixo k={entra} />
			<Canvas>
				<Luzes quadro={frame} batidas={itens.map((x) => q(x.em))} />
				<group position={[0, wy(1215), 0]}>
					{i === 0 ? <Batom p={p} frame={frame} /> : null}
					{i === 1 ? <Frasco p={p} frame={frame} /> : null}
					{i >= 2 ? <Prateleira frame={frame} fps={fps} f0={f0} /> : null}
				</group>
			</Canvas>
			{it ? <Pilula key={i} texto={it.texto} k={k} y={1405} ouro={i === itens.length - 1} /> : null}
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------------------------------------------------------------
// 4. TikTok + casa se encaixam com um selo ✓; depois "deu super certo".
const IconeCelular: React.FC = () => (
	<svg width={88} height={96} viewBox="0 0 88 96">
		<rect x={20} y={4} width={48} height={88} rx={10} fill="none" stroke={OURO} strokeWidth={6} />
		<rect x={30} y={14} width={28} height={56} rx={4} fill={OURO} opacity={0.35} />
		<circle cx={44} cy={80} r={4} fill={OURO} />
	</svg>
);
const IconeCasa: React.FC = () => (
	<svg width={96} height={96} viewBox="0 0 96 96">
		<path d="M10 46 L48 12 L86 46" fill="none" stroke={OURO} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
		<path d="M20 44 L20 84 L76 84 L76 44" fill={OURO} fillOpacity={0.3} stroke={OURO} strokeWidth={6} strokeLinejoin="round" />
		<rect x={40} y={58} width={16} height={26} rx={3} fill={OURO} />
	</svg>
);
const e2Match: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, entra, sai, d, dur} = useCena(cena);
	const fa = q(mc(d, cena, 0, 0.2));
	const fb = q(mc(d, cena, 1, 1.0));
	const fc = Math.min(q(mc(d, cena, 2, 2.4)), dur - 22);
	const fj = Math.min(fb + 6, fc - 18);
	const kA = mola(frame, fa, fps, 11);
	const kB = mola(frame, fb, fps, 11);
	const junta = suave(interpolate(frame, [fj, fj + 10], [0, 1], lim));
	const selo = mola(frame, Math.min(fj + 10, fc - 8), fps, 9);
	const some = 1 - interpolate(frame, [fc, fc + 6], [0, 1], lim);
	const kK = interpolate(frame, [fc + 2, fc + 10], [0, 1], lim);
	const yC = 1130;
	const card = (cx: number, rotulo: string, icone: React.ReactNode, k: number, lado: number) => (
		<div style={{position: 'absolute', left: cx - 190, top: yC, width: 380, height: 270, borderRadius: 40, background: 'linear-gradient(180deg, rgba(60,32,112,0.9), rgba(30,15,58,0.92))', boxShadow: 'inset 0 0 0 2.5px rgba(232,194,122,0.7), 0 18px 36px rgba(8,2,20,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, opacity: k * some, transform: `translateX(${(1 - k) * lado * 260}px) scale(${0.9 + 0.1 * k})`}}>
			{icone}
			<div style={{fontFamily: poppins, fontWeight: 800, fontSize: 42, letterSpacing: '0.06em', color: '#fff', whiteSpace: 'nowrap'}}>{rotulo}</div>
		</div>
	);
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: sai}}>
			<VeuBaixo k={entra} />
			{card(300 + junta * 90, 'NO TIKTOK', <IconeCelular />, kA, -1)}
			{card(780 - junta * 90, 'EM CASA', <IconeCasa />, kB, 1)}
			<div style={{position: 'absolute', left: 540 - 62, top: yC + 135 - 62, width: 124, height: 124, opacity: selo * some, transform: `scale(${selo})`}}>
				<svg width={124} height={124} viewBox="0 0 124 124" style={{filter: 'drop-shadow(0 8px 16px rgba(8,2,20,0.55))'}}>
					<defs>
						<linearGradient id="e2mSelo" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0" stopColor="#FFF1C9" />
							<stop offset="0.55" stopColor="#E8C27A" />
							<stop offset="1" stopColor="#C9974A" />
						</linearGradient>
					</defs>
					<circle cx={62} cy={62} r={58} fill="url(#e2mSelo)" stroke="#2a1352" strokeWidth={5} />
					<path d="M34 64 L54 84 L90 42" fill="none" stroke="#2a1352" strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" />
				</svg>
			</div>
			<Kicker texto="deu super certo" k={kK} y={yC + 70} tamanho={88} />
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------------------------------------------------------------
// 5. Dia: barra do dia com relógio; manhã grava, tarde edita, metade do dia vira da IA.
const Robo: React.FC<{tam: number}> = ({tam}) => (
	<svg width={tam} height={tam} viewBox="0 0 80 80">
		<line x1={40} y1={6} x2={40} y2={18} stroke={OURO} strokeWidth={4} strokeLinecap="round" />
		<circle cx={40} cy={6} r={5} fill={OURO} />
		<rect x={12} y={18} width={56} height={46} rx={14} fill="rgba(255,255,255,0.92)" />
		<rect x={4} y={32} width={8} height={18} rx={4} fill={OURO} />
		<rect x={68} y={32} width={8} height={18} rx={4} fill={OURO} />
		<circle cx={28} cy={38} r={7} fill="#5b34a8" />
		<circle cx={52} cy={38} r={7} fill="#5b34a8" />
		<rect x={26} y={52} width={28} height={5} rx={2.5} fill="#5b34a8" />
	</svg>
);
const e2Dia: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, entra, sai, d, dur} = useCena(cena);
	const itens = itensOu(d, cena, ['GRAVA DE MANHÃ', 'EDITA À TARDE', 'METADE COM IA'], 3.4, 3.0);
	const f0 = Math.max(0, q(mc(d, cena, 0, 0)));
	const fi = itens.map((it) => q(it.em));
	const rotulos = [{texto: 'TEMPO POR DIA?', fr: f0}, ...itens.map((it, i) => ({texto: it.texto, fr: fi[i]}))];
	let ia = -1;
	rotulos.forEach((r, i) => {
		if (frame >= r.fr) ia = i;
	});
	const kr = ia >= 0 ? interpolate(frame, [rotulos[ia].fr, rotulos[ia].fr + 6], [0, 1], lim) : 0;
	const kb = mola(frame, f0, fps, 12);
	const rot = suave(frame / Math.max(20, dur - 14));
	const kEsq = suave(interpolate(frame, [fi[0] ?? 9999, (fi[0] ?? 9999) + 14], [0, 1], lim));
	const kDir = suave(interpolate(frame, [fi[1] ?? 9999, (fi[1] ?? 9999) + 14], [0, 1], lim));
	const kIA = interpolate(frame, [fi[2] ?? 9999, (fi[2] ?? 9999) + 12], [0, 1], lim);
	const kRobo = mola(frame, fi[2] ?? 9999, fps, 10);
	const X0 = 250;
	const W = 760;
	const Y = 430;
	const H = 120;
	const cx = 150;
	const cy = 490;
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: sai}}>
			<Topo k={entra} ate={620} />
			{ia >= 0 ? <Pilula key={ia} texto={rotulos[ia].texto} k={kr} y={250} tamanho={46} ouro={ia === rotulos.length - 1} /> : null}
			<div style={{position: 'absolute', left: cx - 70, top: cy - 70, width: 140, height: 140, opacity: kb, transform: `scale(${kb})`}}>
				<svg width={140} height={140} viewBox="0 0 140 140" style={{filter: 'drop-shadow(0 8px 16px rgba(8,2,20,0.5))'}}>
					<circle cx={70} cy={70} r={66} fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.85)" strokeWidth={5} />
					{Array.from({length: 12}, (_, i) => (
						<line key={i} x1={70} y1={12} x2={70} y2={i % 3 === 0 ? 24 : 19} stroke={OURO} strokeWidth={i % 3 === 0 ? 4 : 2.5} transform={`rotate(${i * 30} 70 70)`} />
					))}
					<line x1={70} y1={70} x2={70} y2={30} stroke="#fff" strokeWidth={5} strokeLinecap="round" transform={`rotate(${rot * 540} 70 70)`} />
					<line x1={70} y1={70} x2={70} y2={44} stroke={OURO} strokeWidth={7} strokeLinecap="round" transform={`rotate(${rot * 45 + 90} 70 70)`} />
					<circle cx={70} cy={70} r={6} fill="#fff" />
				</svg>
			</div>
			<div style={{position: 'absolute', left: X0, top: Y, width: W, height: H, borderRadius: 44, overflow: 'hidden', background: 'rgba(255,255,255,0.14)', boxShadow: 'inset 0 0 0 3px rgba(255,255,255,0.45), 0 14px 34px rgba(8,2,20,0.5)', opacity: kb, transform: `scaleX(${0.7 + 0.3 * kb})`}}>
				<div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: kEsq * (W / 2), background: 'linear-gradient(180deg,#FFF1C9,#F2D08A)'}} />
				<div style={{position: 'absolute', left: W / 2, top: 0, bottom: 0, width: kDir * (W / 2), background: 'linear-gradient(180deg,#F6DB9C,#D9A84E)'}} />
				<div style={{position: 'absolute', left: W / 2, top: 0, bottom: 0, width: W / 2, opacity: kIA, background: 'linear-gradient(180deg,#7a4fd0,#3a1d73)', boxShadow: 'inset 0 0 0 3px rgba(232,194,122,0.8)'}} />
				<div style={{position: 'absolute', left: W / 2 - 1.5, top: 12, bottom: 12, width: 3, background: 'rgba(30,15,58,0.35)'}} />
				{kIA > 0 ? (
					<div style={{position: 'absolute', left: W / 2, width: W / 2, top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, opacity: kIA}}>
						<div style={{transform: `scale(${kRobo})`}}>
							<Robo tam={84} />
						</div>
						<span style={{fontFamily: poppins, fontWeight: 800, fontSize: 64, letterSpacing: '0.06em', color: '#fff'}}>IA</span>
					</div>
				) : null}
			</div>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------------------------------------------------------------
// 6. Riscos que ficam para trás: ônibus (riscado), chefe chato (riscado), casa 3D.
const Onibus: React.FC = () => (
	<svg width={420} height={260} viewBox="0 0 420 260">
		<defs>
			<linearGradient id="e2rOnibus" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stopColor="#7a4fd0" />
				<stop offset="1" stopColor="#3a1d73" />
			</linearGradient>
			<linearGradient id="e2rOuro" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stopColor="#FFF1C9" />
				<stop offset="1" stopColor="#C9974A" />
			</linearGradient>
		</defs>
		<g style={{filter: 'drop-shadow(0 12px 14px rgba(8,2,20,0.55))'}}>
			<rect x={10} y={30} width={400} height={170} rx={38} fill="url(#e2rOnibus)" stroke={OURO} strokeWidth={3} />
			<rect x={10} y={146} width={400} height={20} fill="url(#e2rOuro)" />
			{[0, 1, 2, 3].map((i) => (
				<rect key={i} x={36 + i * 88} y={58} width={70} height={60} rx={12} fill="rgba(205,184,255,0.6)" />
			))}
			<circle cx={92} cy={205} r={32} fill="#120826" stroke={OURO} strokeWidth={4} />
			<circle cx={92} cy={205} r={12} fill={OURO} />
			<circle cx={328} cy={205} r={32} fill="#120826" stroke={OURO} strokeWidth={4} />
			<circle cx={328} cy={205} r={12} fill={OURO} />
		</g>
	</svg>
);
const Balao: React.FC = () => (
	<svg width={420} height={260} viewBox="0 0 420 260">
		<g style={{filter: 'drop-shadow(0 12px 14px rgba(8,2,20,0.55))'}}>
			<path d="M40 20 H380 a34 34 0 0 1 34 34 V150 a34 34 0 0 1 -34 34 H220 L150 244 L168 184 H40 a34 34 0 0 1 -34 -34 V54 a34 34 0 0 1 34 -34 Z" fill="rgba(255,255,255,0.16)" stroke="#fff" strokeWidth={5} strokeLinejoin="round" />
			<path d="M70 70 L110 110 L150 70 L190 110 L230 70 L270 110 L310 70 L350 110" fill="none" stroke={OURO} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
			<path d="M70 140 H350" stroke="rgba(255,255,255,0.5)" strokeWidth={8} strokeLinecap="round" />
		</g>
	</svg>
);
const e2Riscos: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, entra, sai, d} = useCena(cena);
	const itens = itensOu(d, cena, ['BUSÃO', 'CHEFE CHATO', 'DA SUA CASA'], 0.2, 1.5);
	const i = indiceAtual(itens, frame, q);
	const it = itens[i];
	const f0 = it ? q(it.em) : 0;
	const p = mola(frame, f0, fps, 11);
	const k = interpolate(frame, [f0, f0 + 6], [0, 1], lim);
	const risco = suave(interpolate(frame, [f0 + 12, f0 + 19], [0, 1], lim));
	const ultimo = i >= 2;
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: sai}}>
			<VeuBaixo k={entra} />
			{i >= 0 && i <= 1 ? (
				<div style={{position: 'absolute', left: 540 - 210, top: 1085, width: 420, height: 260, opacity: p, transform: `scale(${0.8 + 0.2 * p}) translateY(${(1 - p) * 30}px)`}}>
					{i === 0 ? <Onibus /> : <Balao />}
					<svg width={420} height={260} viewBox="0 0 420 260" style={{position: 'absolute', inset: 0}}>
						<line x1={10} y1={20} x2={10 + 400 * risco} y2={20 + 220 * risco} stroke={VERMELHO} strokeWidth={18} strokeLinecap="round" opacity={risco > 0 ? 1 : 0} style={{filter: 'drop-shadow(0 4px 6px rgba(8,2,20,0.5))'}} />
					</svg>
				</div>
			) : null}
			{ultimo ? (
				<Canvas>
					<Luzes quadro={frame} batidas={[f0]} />
					<group position={[0, wy(1215), 0]} scale={1.15 * p} rotation={[0.28, frame * 0.04 - 0.4, 0]}>
						<mesh position={[0, -0.2, 0]} material={matRoxo}>
							<boxGeometry args={[1.5, 0.95, 1.1]} />
						</mesh>
						<mesh position={[0, 0.5, 0]} rotation={[0, Math.PI / 4, 0]} material={matOuro}>
							<coneGeometry args={[1.25, 0.75, 4]} />
						</mesh>
						<mesh position={[0, -0.45, 0.56]} material={matOuroEscuro}>
							<boxGeometry args={[0.32, 0.5, 0.05]} />
						</mesh>
						<mesh position={[0.45, -0.1, 0.56]} material={matVidro}>
							<boxGeometry args={[0.3, 0.3, 0.05]} />
						</mesh>
					</group>
				</Canvas>
			) : null}
			{it ? <Pilula key={i} texto={it.texto} k={k} y={1405} ouro={ultimo} /> : null}
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------------------------------------------------------------
// 7. Praia: sol 3D subindo atrás das ondas; relógio "MEU HORÁRIO" troca por "PRAIA".
const onda = (frame: number, base: number, amp: number, fase: number, vel: number) => {
	let s = `M 0 1920 L 0 ${base}`;
	for (let x = 0; x <= 1080; x += 30) s += ` L ${x} ${(base + Math.sin(x / 170 + frame * vel + fase) * amp).toFixed(1)}`;
	return `${s} L 1080 1920 Z`;
};
const e2Praia: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, entra, sai, d, dur} = useCena(cena);
	const itens = itensOu(d, cena, ['MEU HORÁRIO', 'PRAIA'], 0.3, 1.7);
	const f0 = q(itens[0].em);
	const f1 = Math.max(f0 + 14, q(itens[1].em));
	const sobe = suave(interpolate(frame, [0, 54], [0, 1], lim));
	const ySol = 1680 - 450 * sobe;
	const kRel = mola(frame, f0, fps, 11) * (1 - interpolate(frame, [f1 - 2, f1 + 5], [0, 1], lim));
	const giro = suave(interpolate(frame, [f0, f0 + 24], [0, 1], lim));
	return (
		<AbsoluteFill style={{opacity: entra * sai}}>
			<FundoMotion />
			<div style={{position: 'absolute', left: 540 - 520, top: ySol - 520, width: 1040, height: 1040, borderRadius: 520, background: 'radial-gradient(circle, rgba(255,214,140,0.5) 0%, rgba(232,194,122,0.2) 38%, rgba(232,194,122,0) 68%)'}} />
			<Canvas sombra={false}>
				<Luzes quadro={frame} batidas={[f0, f1]} />
				<mesh position={[0, wy(ySol), -0.5]}>
					<sphereGeometry args={[1.25, 64, 48]} />
					<meshPhysicalMaterial color="#ffd98a" emissive="#e8a73a" emissiveIntensity={0.9} metalness={0.2} roughness={0.3} clearcoat={0.6} />
				</mesh>
			</Canvas>
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
				<path d={onda(frame, 1480, 16, 0, 0.07)} fill="#3a1d73" opacity={0.95} />
				<path d={onda(frame, 1480, 16, 0, 0.07).replace(/ L 1080 1920 Z$/, '')} fill="none" stroke={OURO} strokeWidth={5} opacity={0.8} />
				<path d={onda(frame, 1560, 20, 2, -0.05)} fill="#5b34a8" opacity={0.96} />
				<path d={onda(frame, 1650, 24, 4, 0.04)} fill="#2e1856" />
			</svg>
			{kRel > 0 ? (
				<div style={{position: 'absolute', left: 540 - 100, top: 215, width: 200, height: 200, opacity: kRel, transform: `scale(${kRel})`}}>
					<svg width={200} height={200} viewBox="0 0 200 200" style={{filter: 'drop-shadow(0 12px 20px rgba(8,2,20,0.55))'}}>
						<circle cx={100} cy={100} r={92} fill="rgba(205,184,255,0.22)" stroke="rgba(255,255,255,0.9)" strokeWidth={6} />
						{Array.from({length: 12}, (_, i) => (
							<line key={i} x1={100} y1={16} x2={100} y2={i % 3 === 0 ? 34 : 27} stroke={OURO} strokeWidth={i % 3 === 0 ? 5 : 3} transform={`rotate(${i * 30} 100 100)`} />
						))}
						<line x1={100} y1={100} x2={100} y2={36} stroke="#fff" strokeWidth={6} strokeLinecap="round" transform={`rotate(${giro * 720} 100 100)`} />
						<line x1={100} y1={100} x2={100} y2={58} stroke={OURO} strokeWidth={9} strokeLinecap="round" transform={`rotate(${giro * 60 + 90} 100 100)`} />
						<circle cx={100} cy={100} r={8} fill="#fff" />
					</svg>
				</div>
			) : null}
			<Canvas>
				<Luzes quadro={frame} batidas={[f0, f1]} />
				{frame < f1 ? <Linha3D ate={f1 - 6} texto={itens[0].texto} metal="branco" largura={4.3} y={wy(590)} quadro={frame} batida={f0 + 6} profundidade={0.4} /> : null}
				{frame >= f1 ? <Linha3D ate={dur - 8} texto={itens[1].texto} metal="ouro" largura={3.6} y={wy(400)} quadro={frame} batida={f1} profundidade={0.55} /> : null}
			</Canvas>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------------------------------------------------------------
// 8. Panela 3D cai e quica na palavra "panela"; em "vender" chega a notificação de venda e ela gira.
const Panela: React.FC = () => (
	<group>
		<mesh material={matOuroDuplo}>
			<cylinderGeometry args={[0.72, 0.62, 0.8, 48, 1, true]} />
		</mesh>
		<mesh position={[0, -0.38, 0]} material={matOuroEscuro}>
			<cylinderGeometry args={[0.62, 0.62, 0.05, 48]} />
		</mesh>
		<mesh position={[0, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]} material={matOuro}>
			<torusGeometry args={[0.72, 0.045, 16, 48]} />
		</mesh>
		<mesh position={[1.25, 0.28, 0]} material={matOuroEscuro}>
			<boxGeometry args={[1.0, 0.1, 0.16]} />
		</mesh>
		<mesh position={[0.74, 0.28, 0]} material={matOuro}>
			<boxGeometry args={[0.12, 0.14, 0.2]} />
		</mesh>
	</group>
);
const e2Panela: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, entra, sai, d, dur} = useCena(cena);
	const fp = q(mc(d, cena, 0, 0.4));
	const fv = Math.min(q(mc(d, cena, 1, 2.8)), dur - 26);
	const l = frame - fp;
	const cai = l < 0 ? 1 : 1 - easeOutBounce(Math.min(1, l / 26));
	const vis = interpolate(l, [0, 3], [0, 1], lim);
	const gira = suave(interpolate(frame, [fv, fv + 26], [0, 1], lim));
	const kN = mola(frame, fv, fps, 11);
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: sai}}>
			<VeuBaixo k={entra} />
			<Canvas>
				<Luzes quadro={frame} batidas={[fp + 14, fv]} />
				<group position={[-0.25, wy(1335) + cai * 1.5, 0]} scale={1.35 * vis * (0.7 + 0.3 * vis)} rotation={[0.55, gira * Math.PI * 2 - 0.4, 0]}>
					<Panela />
				</group>
				<mesh position={[-0.25, wy(1335) - 0.62, -0.3]} rotation={[-Math.PI / 2.3, 0, 0]}>
					<circleGeometry args={[0.8, 40]} />
					<meshBasicMaterial color="#120826" transparent opacity={0.3 * vis * (1 - cai)} />
				</mesh>
			</Canvas>
			{kN > 0 ? (
				<div style={{position: 'absolute', left: 140, width: 800, top: 1020, height: 170, borderRadius: 40, background: 'linear-gradient(180deg, rgba(36,18,70,0.95), rgba(20,10,40,0.95))', boxShadow: 'inset 0 0 0 2px rgba(232,194,122,0.7), 0 18px 40px rgba(8,2,20,0.55)', display: 'flex', alignItems: 'center', gap: 28, padding: '0 36px', opacity: Math.min(1, kN), transform: `translateY(${(1 - kN) * -50}px)`}}>
					<div style={{width: 96, height: 96, borderRadius: 26, background: 'linear-gradient(180deg,#F6DB9C,#D9A84E)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
						<svg width={60} height={60} viewBox="0 0 60 60">
							<path d="M10 20 H50 L47 54 H13 Z" fill="#2a1352" />
							<path d="M20 24 V16 a10 10 0 0 1 20 0 V24" fill="none" stroke="#2a1352" strokeWidth={5} strokeLinecap="round" />
						</svg>
					</div>
					<div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
						<div style={{fontFamily: poppins, fontWeight: 800, fontSize: 48, color: '#fff', letterSpacing: '0.02em', whiteSpace: 'nowrap'}}>Nova venda!</div>
						<div style={{fontFamily: poppins, fontWeight: 800, fontSize: 40, color: OURO, whiteSpace: 'nowrap'}}>Panela · R$ 89,90</div>
					</div>
				</div>
			) : null}
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------------------------------------------------------------
// 9. Banner: a caixa do produto encolhe e some ("nem") e um banner de anúncio se desenrola ("banner").
const e2Banner: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, entra, sai, d, dur} = useCena(cena);
	const f0 = Math.max(10, q(mc(d, cena, 0, 0.7)));
	const f1 = Math.min(q(mc(d, cena, 1, 1.6)), dur - 22);
	const pCx = mola(frame, 0, fps, 10);
	const enc = suave(interpolate(frame, [f0, f0 + 9], [0, 1], lim));
	const escala = pCx * (1 - enc);
	const kB = suave(interpolate(frame, [f1, f1 + 14], [0, 1], lim));
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: sai}}>
			<VeuBaixo k={entra} />
			{frame < f0 + 10 ? (
				<Canvas>
					<Luzes quadro={frame} batidas={[3]} />
					<group position={[0, wy(1250), 0]} scale={1.15 * escala} rotation={[0.4, frame * 0.05 + enc * 3, 0]}>
						<mesh material={matOuro}>
							<boxGeometry args={[1.5, 1.1, 1.1]} />
						</mesh>
						<mesh material={matRoxo}>
							<boxGeometry args={[0.24, 1.12, 1.12]} />
						</mesh>
						<mesh material={matRoxo}>
							<boxGeometry args={[1.52, 0.24, 1.12]} />
						</mesh>
					</group>
				</Canvas>
			) : null}
			{kB > 0 ? (
				<div style={{position: 'absolute', left: 160, top: 1105, width: 760, height: 300, perspective: 1400}}>
					<div
						style={{
							width: 760,
							height: 300,
							borderRadius: 36,
							overflow: 'hidden',
							display: 'flex',
							background: 'linear-gradient(180deg, rgba(70,38,128,0.94), rgba(30,15,58,0.95))',
							boxShadow: 'inset 0 0 0 2.5px rgba(232,194,122,0.8), 0 22px 44px rgba(8,2,20,0.55)',
							transformOrigin: '50% 0%',
							transform: `rotateX(${(1 - kB) * -75}deg)`,
							clipPath: `inset(0 ${(1 - kB) * 50}% 0 ${(1 - kB) * 50}%)`,
							opacity: Math.min(1, kB * 2),
						}}
					>
						<div style={{width: 120, background: 'linear-gradient(180deg,#F6DB9C,#C9974A)'}} />
						<div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', gap: 22, paddingLeft: 48}}>
							<div style={{fontFamily: poppins, fontWeight: 900, fontSize: 92, letterSpacing: '0.04em', color: '#fff', lineHeight: 1}}>OFERTA</div>
							<div style={{padding: '12px 38px', borderRadius: 999, background: 'linear-gradient(180deg,#F6DB9C,#D9A84E)', fontFamily: poppins, fontWeight: 800, fontSize: 40, letterSpacing: '0.08em', color: '#2a1352'}}>COMPRAR</div>
						</div>
					</div>
				</div>
			) : null}
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------------------------------------------------------------
// 10. Balança dourada acima da cabeça: INVESTIR x EVOLUIR; em "evoluir" o lado EVOLUIR pesa e desce.
const e2Balanca: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, entra, sai, d, dur} = useCena(cena);
	const f0 = q(mc(d, cena, 0, 0.4));
	const f1 = Math.min(q(mc(d, cena, 1, 2.2)), dur - 24);
	const p0 = mola(frame, 0, fps, 11);
	const pe = mola(frame, f1, fps, 8);
	const kEnt = mola(frame, 0, fps, 10);
	const tilt = (frame >= f0 ? 0.12 : 0) * (1 - pe) + -0.22 * pe + Math.sin(frame / 9) * 0.015 * (1 - pe);
	const py = wy(405);
	const L = 1.45;
	const cy0 = wy(450);
	const ex = (lado: number) => lado * L * Math.cos(tilt);
	const ey = (lado: number) => py + lado * L * Math.sin(tilt);
	const corda = 0.45;
	const kl = mola(frame, f0, fps, 11);
	const kr = mola(frame, f0 + 3, fps, 11);
	const brilho = interpolate(frame, [f1, f1 + 8], [0, 1], lim);
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: sai}}>
			<Topo k={entra} ate={640} />
			<AbsoluteFill style={{opacity: brilho * 0.8, background: `radial-gradient(ellipse 30% 9% at 78% 24%, rgba(232,194,122,0.55) 0%, rgba(232,194,122,0) 100%)`}} />
			<Canvas>
				<Luzes quadro={frame} batidas={[f1]} />
				<group position={[0, cy0, 0]} scale={Math.max(0.001, kEnt)}>
					<group position={[0, -cy0, 0]}>
						<mesh position={[0, wy(590), 0]} material={matOuroEscuro}>
							<cylinderGeometry args={[0.6, 0.7, 0.1, 40]} />
						</mesh>
						<mesh position={[0, (wy(590) + py) / 2, 0]} material={matOuro}>
							<cylinderGeometry args={[0.07, 0.09, py - wy(590), 24]} />
						</mesh>
						<mesh position={[0, py, 0]} rotation={[0, 0, tilt]} material={matOuro}>
							<boxGeometry args={[L * 2, 0.09, 0.16]} />
						</mesh>
						<mesh position={[0, py, 0]} material={matOuro}>
							<sphereGeometry args={[0.14, 32, 24]} />
						</mesh>
						{[-1, 1].map((lado) => (
							<group key={lado}>
								<mesh position={[ex(lado), ey(lado) - corda / 2, 0]} material={matOuroEscuro}>
									<cylinderGeometry args={[0.018, 0.018, corda, 8]} />
								</mesh>
								<mesh position={[ex(lado), ey(lado) - corda - 0.03, 0]} material={matOuro}>
									<cylinderGeometry args={[0.5, 0.42, 0.07, 40]} />
								</mesh>
							</group>
						))}
						<mesh position={[ex(-1), ey(-1) - corda + 0.17, 0]} rotation={[0, frame * 0.02, 0]} scale={kl} material={matRoxo}>
							<boxGeometry args={[0.36, 0.36, 0.36]} />
						</mesh>
						<mesh position={[ex(1), ey(1) - corda + 0.08 + 0.12 * pe, 0]} scale={(0.16 + 0.17 * pe) * kr * 3} material={matOuro}>
							<sphereGeometry args={[1, 32, 24]} />
						</mesh>
					</group>
				</group>
			</Canvas>
			<PilulaX texto="INVESTIR" k={p0 > 0.01 ? kl : 0} x={236} y={232} />
			<PilulaX texto="EVOLUIR" k={kr} x={844} y={232} ouro={frame >= f1} />
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------------------------------------------------------------
// 11. Minerar: picareta bate duas vezes na rocha, ela racha e sai a caixa de produto dourada.
const FRAGMENTOS = Array.from({length: 7}, (_, i) => ({a: (i / 7) * Math.PI * 2 + 0.4, v: 1.0 + ((i * 37) % 5) / 6, s: 0.12 + ((i * 11) % 4) / 30}));
const e2Minerar: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, entra, sai, d, dur} = useCena(cena);
	const f0 = Math.max(8, q(mc(d, cena, 0, 0.7)));
	const f1 = Math.max(f0 + 16, Math.min(q(mc(d, cena, 1, 2.3)), dur - 24));
	const yR = wy(1290);
	const pEnt = mola(frame, 0, fps, 11);
	const h2 = f0 + 12;
	const ang = interpolate(frame, [f0 - 6, f0, f0 + 5, h2, h2 + 8], [-0.2, 0.9, 0.2, 0.9, -0.2], lim);
	const batida = Math.max(interpolate(frame, [f0, f0 + 2, f0 + 6], [0, 1, 0], lim), interpolate(frame, [h2, h2 + 2, h2 + 6], [0, 1, 0], lim));
	const rachou = suave(interpolate(frame, [h2 + 1, h2 + 8], [0, 1], lim));
	const abre = frame >= f1;
	const lf = frame - f1;
	const kRocha = abre ? Math.max(0, 1 - lf / 5) : 1;
	const kPick = pEnt * (abre ? Math.max(0, 1 - lf / 6) : 1);
	const pCx = mola(frame, f1, fps, 9);
	const kP = interpolate(frame, [f1 + 8, f1 + 14], [0, 1], lim);
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: sai}}>
			<VeuBaixo k={entra} />
			{abre ? <AbsoluteFill style={{opacity: Math.min(1, lf / 6) * 0.9, background: `radial-gradient(ellipse 36% 12% at 50% ${(1290 / 1920) * 100}%, rgba(255,214,140,0.6) 0%, rgba(232,194,122,0) 100%)`}} /> : null}
			<Canvas>
				<Luzes quadro={frame} batidas={[f0, h2, f1]} />
				{abre ? <pointLight position={[0, yR + 0.3, 2.5]} intensity={30 * Math.min(1, pCx)} distance={9} color="#ffd98a" /> : null}
				<mesh position={[batida * 0.04 * Math.sin(frame * 3), yR, 0]} scale={[1.15 * kRocha * pEnt, 0.8 * kRocha * pEnt, 0.9 * kRocha * pEnt]} rotation={[0.2, 0.3, 0]} material={matRocha}>
					<dodecahedronGeometry args={[1, 0]} />
				</mesh>
				<group position={[1.0, yR - 0.3, 0.5]} rotation={[0, 0, ang]} scale={Math.max(0.001, kPick)}>
					<mesh position={[0, 0.65, 0]} material={matOuroEscuro}>
						<cylinderGeometry args={[0.07, 0.07, 1.3, 16]} />
					</mesh>
					<mesh position={[0, 1.3, 0]} material={matOuro}>
						<boxGeometry args={[1.0, 0.16, 0.16]} />
					</mesh>
					<mesh position={[-0.55, 1.3, 0]} rotation={[0, 0, Math.PI / 2]} material={matOuro}>
						<coneGeometry args={[0.08, 0.2, 16]} />
					</mesh>
					<mesh position={[0.55, 1.3, 0]} rotation={[0, 0, -Math.PI / 2]} material={matOuro}>
						<coneGeometry args={[0.08, 0.2, 16]} />
					</mesh>
				</group>
				{abre
					? FRAGMENTOS.map((f, i) => {
							const t = lf / 30;
							const s = Math.max(0, 1 - lf / 22);
							return (
								<mesh key={i} position={[Math.cos(f.a) * f.v * t * 3, yR + Math.sin(f.a) * f.v * t * 3 - 3 * t * t, 0.5]} rotation={[lf * 0.2, lf * 0.15, 0]} scale={f.s * 3 * s} material={matRocha}>
									<dodecahedronGeometry args={[1, 0]} />
								</mesh>
							);
						})
					: null}
				{abre ? (
					<group position={[0, yR + 0.05 + Math.sin(frame / 8) * 0.03, 0.3]} scale={Math.max(0.001, pCx)} rotation={[0.3, frame * 0.05, 0]}>
						<mesh material={matOuro}>
							<boxGeometry args={[1.1, 0.85, 0.85]} />
						</mesh>
						<mesh position={[0, 0, 0]}>
							<boxGeometry args={[0.2, 0.87, 0.87]} />
							<meshPhysicalMaterial color="#fff1c9" emissive="#ffcf6a" emissiveIntensity={0.9} metalness={0.4} roughness={0.3} />
						</mesh>
					</group>
				) : null}
			</Canvas>
			{rachou > 0 && !abre ? (
				<svg width={600} height={300} viewBox="0 0 600 300" style={{position: 'absolute', left: 240, top: 1140}}>
					<path d="M300 20 L276 90 L316 130 L284 200 L310 270" fill="none" stroke="#FFD98A" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${rachou * 320} 320`} style={{filter: 'drop-shadow(0 0 10px #FFD98A)'}} />
					<path d="M316 130 L372 150 L400 200" fill="none" stroke="#FFD98A" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${rachou * 130} 130`} />
				</svg>
			) : null}
			<Pilula texto="PRODUTO CERTO" k={kP} y={1405} ouro />
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------------------------------------------------------------
// 12. Pesos: pessoa, copy e produto como colunas 3D; o produto sobe ao dobro e brilha.
const e2Pesos: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, entra, sai, d} = useCena(cena);
	const itens = itensOu(d, cena, ['PESSOA', 'COPY', 'PRODUTO'], 0.3, 1.3);
	const XS = [-1.4, 0, 1.4];
	const base = wy(1380);
	const alturas = [0.8, 0.8, 1.6];
	const brilho = itens[2] ? interpolate(frame, [q(itens[2].em) + 8, q(itens[2].em) + 16], [0, 1], lim) : 0;
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: sai}}>
			<VeuBaixo k={entra} />
			<AbsoluteFill style={{opacity: brilho * 0.8, background: `radial-gradient(ellipse 26% 14% at 80% 66%, rgba(232,194,122,0.5) 0%, rgba(232,194,122,0) 100%)`}} />
			<Canvas>
				<Luzes quadro={frame} batidas={itens.map((x) => q(x.em))} />
				<group rotation={[0.12, -0.2, 0]}>
					{itens.slice(0, 3).map((it, i) => {
						const s = mola(frame, q(it.em), fps, 10);
						const h = alturas[i];
						return (
							<mesh key={i} position={[XS[i], base + (h * s) / 2, 0]} scale={[1, Math.max(0.001, s), 1]}>
								<boxGeometry args={[0.95, h, 0.95]} />
								{i === 2 ? (
									<meshPhysicalMaterial color="#e9b44c" metalness={1} roughness={0.22} clearcoat={0.6} emissive="#c98a1c" emissiveIntensity={0.55 * brilho} envMapIntensity={1.5} />
								) : (
									<primitive object={matRoxo} attach="material" />
								)}
							</mesh>
						);
					})}
				</group>
			</Canvas>
			{itens.slice(0, 3).map((it, i) => {
				const k = mola(frame, q(it.em) + 3, fps);
				return (
					<div key={i} style={{position: 'absolute', left: 540 + XS[i] * K - 160, width: 320, top: 1415, textAlign: 'center', opacity: k, transform: `translateY(${(1 - k) * 18}px)`}}>
						<span style={{fontFamily: poppins, fontWeight: 800, fontSize: 42, letterSpacing: '0.05em', color: i === 2 ? OURO : '#fff', textShadow: '0 4px 14px rgba(12,4,28,0.7)', whiteSpace: 'nowrap'}}>{it.texto}</span>
					</div>
				);
			})}
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------------------------------------------------------------
// 13. Atalho: caminho longo e cheio de curvas x linha reta dourada de A até B; "ENCURTA / O TEMPO" em 3D.
const e2Atalho: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, entra, sai, d, dur} = useCena(cena);
	const f0 = q(mc(d, cena, 0, 0.2));
	const f1 = Math.min(q(mc(d, cena, 1, 1.6)), dur - 30);
	const linhas = d.linhas && d.linhas.length ? d.linhas : [{texto: 'ENCURTA', em: cena.de + f1 / fps}, {texto: 'O TEMPO', em: cena.de + f1 / fps + 0.4}];
	const A = {x: 200, y: 1560};
	const B = {x: 880, y: 860};
	const longo = 'M 200 1560 C 200 1380, 720 1430, 650 1290 S 160 1220, 270 1090 S 820 1130, 760 990 S 560 940, 880 860';
	const desenho = suave(interpolate(frame, [f0, f1 + 4], [0, 1], lim));
	const reta = suave(interpolate(frame, [f1, f1 + 14], [0, 1], lim));
	const anda = suave(interpolate(frame, [f1 + 4, f1 + 24], [0, 1], lim));
	const px = A.x + (B.x - A.x) * anda;
	const py = A.y + (B.y - A.y) * anda;
	const kA = mola(frame, 0, fps, 10);
	const kB = mola(frame, 2, fps, 10);
	const marca = (x: number, y: number, letra: string, k: number, ouro: boolean) => (
		<div style={{position: 'absolute', left: x - 50, top: y - 50, width: 100, height: 100, borderRadius: 50, background: ouro ? 'linear-gradient(180deg,#F6DB9C,#D9A84E)' : 'linear-gradient(180deg,#7a4fd0,#3a1d73)', boxShadow: `inset 0 0 0 4px ${ouro ? '#FFF1C9' : 'rgba(232,194,122,0.8)'}, 0 12px 24px rgba(8,2,20,0.55)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: poppins, fontWeight: 900, fontSize: 52, color: ouro ? '#2a1352' : '#fff', transform: `scale(${k})`, opacity: Math.min(1, k)}}>
			{letra}
		</div>
	);
	return (
		<AbsoluteFill style={{opacity: entra * sai}}>
			<FundoMotion />
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
				<defs>
					<mask id="e2aMask">
						<path d={longo} fill="none" stroke="#fff" strokeWidth={20} pathLength={1} strokeDasharray={`${desenho} 1`} />
					</mask>
				</defs>
				<path d={longo} fill="none" stroke="rgba(225,220,240,0.75)" strokeWidth={10} strokeLinecap="round" strokeDasharray="22 22" mask="url(#e2aMask)" opacity={1 - 0.45 * reta} />
				<line x1={A.x} y1={A.y} x2={A.x + (B.x - A.x) * reta} y2={A.y + (B.y - A.y) * reta} stroke={OURO} strokeWidth={16} strokeLinecap="round" opacity={reta > 0 ? 1 : 0} style={{filter: 'drop-shadow(0 0 14px rgba(232,194,122,0.9))'}} />
				{reta > 0 ? <circle cx={px} cy={py} r={20} fill="#fff" style={{filter: 'drop-shadow(0 0 12px #fff)'}} /> : null}
			</svg>
			{marca(A.x, A.y, 'A', kA, false)}
			{marca(B.x, B.y, 'B', kB, true)}
			<Canvas>
				<Luzes quadro={frame} batidas={linhas.map((l) => q(l.em))} />
				{linhas.slice(0, 2).map((l, i) => (
					<Linha3D ate={dur - 8} key={i} texto={l.texto} metal={l.metal ?? (i ? 'branco' : 'ouro')} largura={Math.min(4.4, l.texto.length * 0.45)} y={wy(300 + i * 175)} quadro={frame} batida={q(l.em)} profundidade={0.4} />
				))}
			</Canvas>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------------------------------------------------------------
// 14. Mala de viagem acima da cabeça: entra em "viagem", abre em "insight" e sobe uma lâmpada dourada.
const e2Mala: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, entra, sai, d, dur} = useCena(cena);
	const f0 = q(mc(d, cena, 0, 0.4));
	const f1 = Math.min(q(mc(d, cena, 1, 2.4)), dur - 26);
	const p = mola(frame, f0, fps, 10);
	const abre = mola(frame, f1, fps, 12);
	const lampada = mola(frame, f1 + 5, fps, 10);
	const kP = interpolate(frame, [f1, f1 + 6], [0, 1], lim);
	const cx = wx(330);
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: sai}}>
			<Topo k={entra} ate={620} />
			{frame >= f1 ? <AbsoluteFill style={{opacity: lampada * 0.8, background: `radial-gradient(ellipse 22% 9% at 30.5% 17%, rgba(255,214,140,0.6) 0%, rgba(232,194,122,0) 100%)`}} /> : null}
			<Canvas>
				<Luzes quadro={frame} batidas={[f0, f1]} />
				{frame >= f1 ? <pointLight position={[cx, wy(330), 3]} intensity={25 * lampada} distance={8} color="#ffd98a" /> : null}
				<group position={[cx + (1 - p) * -3, wy(485), 0]} scale={0.8 * Math.max(0.001, p)} rotation={[0.28, -0.4, 0]}>
					<mesh geometry={geoMalaCorpo} material={matRoxo} />
					{[-0.55, 0.55].map((x) => (
						<mesh key={x} position={[x, 0, 0.44]} material={matOuro}>
							<boxGeometry args={[0.13, 0.97, 0.03]} />
						</mesh>
					))}
					{[-1, 1].flatMap((sx) =>
						[-1, 1].map((sy) => (
							<mesh key={`${sx}${sy}`} position={[sx * 0.9, sy * 0.43, 0.37]} material={matOuro}>
								<boxGeometry args={[0.22, 0.22, 0.16]} />
							</mesh>
						)),
					)}
					<mesh position={[0, 0.2, 0.46]} material={matOuroEscuro}>
						<boxGeometry args={[0.3, 0.2, 0.05]} />
					</mesh>
					<group position={[0, 0.475, -0.4]} rotation={[-abre * 1.9, 0, 0]}>
						<mesh geometry={geoMalaTampa} material={matRoxo} position={[0, 0.2, 0.4]} />
						<mesh position={[0, 0.4, 0.4]} material={matOuro}>
							<torusGeometry args={[0.28, 0.035, 12, 32, Math.PI]} />
						</mesh>
						{[-0.55, 0.55].map((x) => (
							<mesh key={x} position={[x, 0.2, 0.44]} material={matOuro}>
								<boxGeometry args={[0.13, 0.42, 0.03]} />
							</mesh>
						))}
					</group>
					{lampada > 0 ? (
						<group position={[0, 0.4 + lampada * 1.05, 0]} scale={Math.max(0.001, lampada)}>
							<mesh position={[0, 0.2, 0]}>
								<sphereGeometry args={[0.32, 40, 32]} />
								<meshPhysicalMaterial color="#fff1c9" emissive="#ffcf6a" emissiveIntensity={1.3} metalness={0.1} roughness={0.12} clearcoat={1} />
							</mesh>
							<mesh position={[0, -0.12, 0]} material={matOuro}>
								<cylinderGeometry args={[0.15, 0.12, 0.2, 24]} />
							</mesh>
							<mesh position={[0, -0.28, 0]} material={matOuroEscuro}>
								<cylinderGeometry args={[0.1, 0.1, 0.1, 24]} />
							</mesh>
						</group>
					) : null}
				</group>
			</Canvas>
			<PilulaX texto="INSIGHT" k={kP} x={770} y={430} ouro />
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------------------------------------------------------------
// 15. Rede: 7 avatares em anel; as linhas os ligam, eles se aproximam (apoio) e uma esfera de luz passa de um a outro.
const N_AV = 7;
const e2Rede: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, entra, sai, d, dur} = useCena(cena);
	const itens = itensOu(d, cena, ['SE AJUDAM', 'SE APOIAM', 'CONHECIMENTO'], 0.4, 2.4);
	const fi = itens.map((it) => q(it.em));
	const liga = suave(interpolate(frame, [fi[0] ?? 0, (fi[0] ?? 0) + 30], [0, 1], lim));
	const perto = suave(interpolate(frame, [fi[1] ?? 9999, (fi[1] ?? 9999) + 18], [0, 1], lim));
	const f2 = fi[2] ?? 9999;
	const hop = Math.max(4, Math.min(9, Math.floor((dur - 14 - f2) / N_AV)));
	const R = 330 - 70 * perto;
	const cx = 540;
	const cy = 1090;
	const nos = Array.from({length: N_AV}, (_, i) => {
		const a = -Math.PI / 2 + (i / N_AV) * Math.PI * 2;
		return {x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R};
	});
	const arestas: [number, number][] = [];
	for (let i = 0; i < N_AV; i++) arestas.push([i, (i + 1) % N_AV]);
	for (let i = 0; i < N_AV; i++) arestas.push([i, (i + 2) % N_AV]);
	const s = Math.min(N_AV, Math.max(0, (frame - f2) / hop));
	const idx = Math.min(N_AV - 1, Math.floor(s));
	const pr = suave(s - idx);
	const a = nos[idx % N_AV];
	const b = nos[(idx + 1) % N_AV];
	const bx = a.x + (b.x - a.x) * (s >= N_AV ? 1 : pr);
	const by = a.y + (b.y - a.y) * (s >= N_AV ? 1 : pr);
	const kBola = interpolate(frame, [f2, f2 + 5], [0, 1], lim);
	// Texto 3D: um por vez, cada um até 6 quadros antes da troca.
	const iT = indiceAtual(itens, frame, q);
	return (
		<AbsoluteFill style={{opacity: entra * sai}}>
			<FundoMotion />
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
				{arestas.map(([i, j], n) => {
					const prog = Math.min(1, Math.max(0, liga * 1.6 - (n / arestas.length) * 0.6));
					const p1 = nos[i];
					const p2 = nos[j];
					return <line key={n} x1={p1.x} y1={p1.y} x2={p1.x + (p2.x - p1.x) * prog} y2={p1.y + (p2.y - p1.y) * prog} stroke={OURO} strokeWidth={n < N_AV ? 6 : 3.5} strokeLinecap="round" opacity={n < N_AV ? 0.95 : 0.45} />;
				})}
			</svg>
			{nos.map((n, i) => {
				const k = mola(frame, i * 3, fps, 10);
				const luz = interpolate(frame, [f2 + i * hop, f2 + i * hop + 4], [0, 1], lim);
				return (
					<div key={i} style={{position: 'absolute', left: n.x - 64, top: n.y - 64, width: 128, height: 128, borderRadius: 64, background: 'linear-gradient(180deg, rgba(122,79,208,0.9), rgba(46,24,86,0.92))', boxShadow: `inset 0 0 0 4px rgba(232,194,122,${0.7 + 0.3 * luz}), 0 10px 24px rgba(8,2,20,0.55), 0 0 ${30 * luz}px rgba(255,214,140,${0.8 * luz})`, transform: `scale(${k})`, opacity: Math.min(1, k), overflow: 'hidden', display: 'flex', alignItems: 'flex-end', justifyContent: 'center'}}>
						<Silhueta tam={128} />
					</div>
				);
			})}
			{kBola > 0 ? (
				<div style={{position: 'absolute', left: bx - 38, top: by - 38, width: 76, height: 76, borderRadius: 38, opacity: kBola, background: 'radial-gradient(circle at 40% 35%, #FFFBEA 0%, #FFD98A 45%, #E8A73A 100%)', boxShadow: '0 0 40px 14px rgba(255,214,140,0.65)'}} />
			) : null}
			<Canvas>
				<Luzes quadro={frame} batidas={fi} />
				{iT >= 0 ? (
					<Linha3D
						key={iT}
						ate={iT < itens.length - 1 ? fi[iT + 1] - 6 : dur - 8}
						texto={itens[iT].texto}
						metal={iT === 1 ? 'branco' : 'ouro'}
						largura={Math.min(4.4, itens[iT].texto.length * 0.45)}
						y={wy(340)}
						quadro={frame}
						batida={fi[iT]}
						profundidade={0.45}
					/>
				) : null}
			</Canvas>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------------------------------------------------------------
// 16. Mercado: disco dourado gira, se divide em 8 fatias ("ganhar") e cada fatia ganha um mini avatar ("mercado").
const FATIAS = 8;
const e2Mercado: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, entra, sai, d, dur} = useCena(cena);
	const f0 = q(mc(d, cena, 0, 0.8));
	const f1 = Math.max(f0 + 14, Math.min(q(mc(d, cena, 1, 2.2)), dur - 24));
	const pEnt = mola(frame, 0, fps, 11);
	const spin = 0.07 * Math.min(frame, f0 + 6) * (1 - suave((frame - f0) / 14) * 0.0);
	const afasta = suave(interpolate(frame, [f0, f0 + 12], [0, 1], lim));
	const larg = (Math.PI * 2) / FATIAS;
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: sai}}>
			<VeuBaixo k={entra} />
			<Canvas>
				<Luzes quadro={frame} batidas={[f0, f1]} />
				<group position={[0, wy(1205), 0]} scale={Math.max(0.001, pEnt)} rotation={[1.15, 0, 0]}>
					<group rotation={[0, spin, 0]}>
						{Array.from({length: FATIAS}, (_, i) => {
							const th = i * larg;
							const mid = th + larg / 2;
							const off = afasta * 0.2;
							const kAv = mola(frame, f1 + i * 2, fps, 9);
							return (
								<group key={i} position={[Math.sin(mid) * off, 0, Math.cos(mid) * off]}>
									<mesh material={i % 2 ? matOuro : matOuroEscuro}>
										<cylinderGeometry args={[0.88, 0.88, 0.18, 32, 1, false, th + 0.012, larg - 0.024]} />
									</mesh>
									{kAv > 0 ? (
										<group position={[Math.sin(mid) * 0.55, 0.1 + 0.14 * kAv, Math.cos(mid) * 0.55]} scale={Math.max(0.001, kAv)}>
											<mesh position={[0, 0.17, 0]} material={i % 2 ? matRoxo : matVidro}>
												<sphereGeometry args={[0.1, 20, 16]} />
											</mesh>
											<mesh position={[0, 0.03, 0]} material={i % 2 ? matRoxo : matVidro}>
												<coneGeometry args={[0.13, 0.2, 20]} />
											</mesh>
										</group>
									) : null}
								</group>
							);
						})}
					</group>
				</group>
			</Canvas>
			<Pilula texto="MERCADO PRA TODOS" k={interpolate(frame, [f1, f1 + 7], [0, 1], lim)} y={1405} ouro />
		</AbsoluteFill>
	);
};

export const pecas: Pecas = {
	e2Viral,
	e2SemRosto,
	e2Nicho,
	e2Match,
	e2Dia,
	e2Riscos,
	e2Praia,
	e2Panela,
	e2Banner,
	e2Balanca,
	e2Minerar,
	e2Pesos,
	e2Atalho,
	e2Mala,
	e2Rede,
	e2Mercado,
};
