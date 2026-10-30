// Peças (efeitos) exclusivas do entrevista-3-v5, usadas no edit.ts com {tipo: 'peca', nome: '<chave>', dados: {...}}.
// Prefixe as chaves com v5 (ex.: v5Gancho): o registro junta as peças de todos os projetos.
// Tempos em `dados` são segundos do vídeo editado; dentro da peça o quadro 0 é cena.de.
import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import type {CenaPeca, Pecas} from '../../pecas/peca';
import {FundoMotion, GradeReta} from '../../pecas/FundoMotion';
import {AviaoCena} from '../../pecas/MotionPista';
import {Linha3D, Luzes} from '../../pecas/tres/Texto3D';
import {playfair, poppins} from '../../motor/tema';

const lim = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const GL = {alpha: true, antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05};
const CAMERA = {fov: 35, position: [0, 0, 14.5] as [number, number, number], near: 0.1, far: 60};
const MEIA = 14.5 * Math.tan((35 / 2) * (Math.PI / 180));
// y em px (quadro 1080x1920) → y no mundo da câmera acima.
const yM = (px: number) => ((960 - px) / 960) * MEIA;
const OURO_TEXTO = 'linear-gradient(180deg,#FFF1C9 0%,#F2D08A 40%,#E8C27A 65%,#C9974A 100%)';
const VIDRO: React.CSSProperties = {
	background: 'linear-gradient(180deg, rgba(46,24,86,0.78) 0%, rgba(30,15,58,0.76) 100%)',
	backdropFilter: 'blur(18px)',
	boxShadow: 'inset 0 0 0 1.5px rgba(232,194,122,0.55), 0 14px 30px rgba(10,4,24,0.45)',
};

// Tempo da cena: quadro atual, conversor de segundos do vídeo editado para quadro da cena, saída suave.
const useCena = (cena: CenaPeca) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const fim = Math.round((cena.ate - cena.de) * fps);
	const q = (t: unknown) => Math.round(((typeof t === 'number' ? t : cena.de) - cena.de) * fps);
	const saida = interpolate(frame, [fim - 7, fim], [1, 0], lim);
	const entrada = interpolate(frame, [0, 6], [0, 1], lim);
	return {frame, fps, width, height, fim, q, saida, entrada, d: (cena.dados ?? {}) as Record<string, number>};
};

const ouroTexto = (tamanho: number): React.CSSProperties => ({
	fontFamily: poppins,
	fontWeight: 800,
	fontSize: tamanho,
	background: OURO_TEXTO,
	WebkitBackgroundClip: 'text',
	backgroundClip: 'text',
	color: 'transparent',
});

const Veu: React.FC<{k: number}> = ({k}) => (
	<AbsoluteFill style={{opacity: k}}>
		<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(30,15,58,0) 44%, rgba(30,15,58,0.5) 54%, rgba(22,10,46,0.66) 100%)'}} />
		<GradeReta topo={0.5} />
	</AbsoluteFill>
);

const ouroMat = {color: '#E8C27A', metalness: 0.9, roughness: 0.22};

// 1. Gancho: "2 anos de MVM, mais de 500 milhões faturados na comunidade". O contador sobe com ease-out enquanto um gráfico
// de barras de ouro cresce na metade de baixo; no "500" o valor vira texto 3D de verdade, as barras acendem e entra a pílula.
const Gancho: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, width, height, q, saida, entrada, d} = useCena(cena);
	const bAnos = q(d.anos);
	const b500 = q(d.quinhentos);
	const bCom = q(d.comunidade);
	const conta = interpolate(frame, [2, b500], [0, 1], lim);
	const valor = Math.round(500 * (1 - (1 - conta) ** 3));
	const contador = interpolate(frame, [b500 - 2, b500 + 3], [1, 0], lim);
	const anos = spring({frame: frame - bAnos, fps, config: {damping: 14}});
	const pilula = spring({frame: frame - bCom, fps, config: {damping: 15}});
	const acende = interpolate(frame, [b500, b500 + 4, b500 + 20], [0, 1, 0.35], lim);
	const giro = Math.sin(frame / 40) * 0.18;
	const barras = 11;
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: saida}}>
			<AbsoluteFill style={{opacity: entrada, background: 'linear-gradient(180deg, rgba(30,15,58,0.8) 0%, rgba(30,15,58,0.45) 26%, rgba(30,15,58,0) 36%)'}} />
			<Veu k={entrada} />
			<AbsoluteFill style={{opacity: acende, background: 'radial-gradient(ellipse 60% 14% at 50% 79%, rgba(255,214,140,0.5) 0%, rgba(0,0,0,0) 100%)'}} />
			<div style={{position: 'absolute', top: 205, width: '100%', textAlign: 'center', opacity: anos, transform: `translateY(${(1 - anos) * 16}px)`}}>
				<span style={{...ouroTexto(40), letterSpacing: '0.4em', marginRight: '-0.4em'}}>2 ANOS DE MVM</span>
			</div>
			<div style={{position: 'absolute', top: 300, width: '100%', textAlign: 'center', opacity: contador}}>
				<span style={{...ouroTexto(124), fontWeight: 900, fontVariantNumeric: 'tabular-nums'}}>R$ {valor} MI</span>
			</div>
			<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
				<Luzes quadro={frame} batidas={[b500]} />
				<Linha3D texto="R$ 500 MILHÕES" metal="ouro" largura={4.7} y={yM(370)} quadro={frame} batida={b500} profundidade={0.6} />
				<group position={[0, yM(1660), 0]} rotation={[0.25, giro, 0]}>
					{Array.from({length: barras}, (_, i) => {
						const alvo = 0.25 + 2.0 * (i / (barras - 1)) ** 1.7;
						const s = spring({frame: frame - 3 - i * 3, fps, config: {damping: 12, stiffness: 90}});
						const h = Math.max(0.01, alvo * s * (1 + acende * 0.06));
						return (
							<mesh key={i} position={[-2.1 + (4.2 * i) / (barras - 1), h / 2, 0]}>
								<boxGeometry args={[0.28, h, 0.28]} />
								<meshStandardMaterial {...ouroMat} emissive="#7a4a10" emissiveIntensity={0.25 + acende * 0.9} />
							</mesh>
						);
					})}
				</group>
			</ThreeCanvas>
			<div style={{position: 'absolute', top: 1120, width: '100%', display: 'flex', justifyContent: 'center', opacity: pilula, transform: `translateY(${(1 - pilula) * 24}px)`}}>
				<div style={{...VIDRO, padding: '16px 34px', borderRadius: 999, fontFamily: poppins, fontWeight: 700, fontSize: 36, letterSpacing: '0.1em', color: '#fff'}}>
					FATURADOS NA COMUNIDADE
				</div>
			</div>
		</AbsoluteFill>
	);
};

// 2. "é um top creator aqui do TikTok Shop": meia tela com pódio 3D, o bloco do 1º lugar sobe com um facho de luz e
// "TOP CREATOR" em ouro 3D pousa sobre ele; a pílula diz de onde.
const TopCreator: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, width, height, q, saida, entrada, d} = useCena(cena);
	const bTop = q(d.top);
	const bTk = q(d.tiktok);
	const sobe = (atraso: number) => spring({frame: frame - atraso, fps, config: {damping: 13, stiffness: 110}});
	const p1 = sobe(bTop - 4);
	const p2 = sobe(2);
	const p3 = sobe(5);
	const facho = interpolate(frame, [bTop - 2, bTop + 8], [0, 1], lim);
	const pil = spring({frame: frame - bTk, fps, config: {damping: 15}});
	const giro = Math.sin(frame / 45) * 0.22;
	const bloco = (x: number, h: number, k: number, ouro: boolean) => (
		<group position={[x, 0, 0]}>
			<mesh position={[0, (h * k) / 2, 0]}>
				<boxGeometry args={[1.05, Math.max(0.01, h * k), 0.9]} />
				<meshStandardMaterial color={ouro ? '#4a2a86' : '#2c1752'} metalness={0.6} roughness={0.3} />
			</mesh>
			<mesh position={[0, h * k + 0.03, 0]}>
				<boxGeometry args={[1.08, 0.06, 0.93]} />
				<meshStandardMaterial {...ouroMat} />
			</mesh>
		</group>
	);
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: saida}}>
			<Veu k={entrada} />
			<AbsoluteFill style={{opacity: facho * 0.8, background: 'linear-gradient(180deg, rgba(255,226,160,0) 50%, rgba(255,226,160,0.0) 52%, rgba(255,226,160,0.28) 70%, rgba(255,226,160,0) 88%)', clipPath: 'polygon(42% 52%, 58% 52%, 66% 88%, 34% 88%)'}} />
			<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
				<Luzes quadro={frame} batidas={[bTop]} />
				<pointLight position={[0, yM(1150), 3]} intensity={40 * facho} distance={8} color="#ffe2a0" />
				<group position={[0, yM(1700), 0]} rotation={[0.18, giro, 0]}>
					{bloco(-1.15, 0.7, p2, false)}
					{bloco(0, 1.25, p1, true)}
					{bloco(1.15, 0.45, p3, false)}
				</group>
				<Linha3D texto="TOP CREATOR" metal="ouro" largura={4.4} y={yM(1170)} quadro={frame} batida={bTop} profundidade={0.55} />
			</ThreeCanvas>
			<div style={{position: 'absolute', top: 1745, width: '100%', display: 'flex', justifyContent: 'center', opacity: pil, transform: `translateY(${(1 - pil) * 20}px)`}}>
				<div style={{...VIDRO, padding: '12px 30px', borderRadius: 999, fontFamily: poppins, fontWeight: 700, fontSize: 32, letterSpacing: '0.12em', color: '#fff'}}>
					RICARDO · TIKTOK SHOP
				</div>
			</div>
		</AbsoluteFill>
	);
};

// 3. "O que você leva de Floripa para o Rio de Janeiro?": o avião 3D cruza acima da cabeça entre dois pinos com os nomes,
// e a rota pontilhada se desenha atrás dele.
const Rota: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fim, saida, entrada} = useCena(cena);
	const p = frame / Math.max(1, fim);
	// O avião (AviaoCena) vai de x −3,6 a +3,6 no mundo; os pinos ficam em ±2,0 (px 120 e 960).
	const rota = interpolate(p, [0.22, 0.78], [0, 1], lim);
	const pinoA = interpolate(p, [0.05, 0.18], [0, 1], lim);
	const pinoB = interpolate(p, [0.7, 0.8], [0, 1], lim);
	const Y = 360;
	const caminho = `M 150 ${Y} Q 540 ${Y - 150} 930 ${Y}`;
	const Pino: React.FC<{x: number; k: number; nome: string; ouro?: boolean}> = ({x, k, nome, ouro}) => (
		<div style={{position: 'absolute', left: x - 160, top: Y - 66, width: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: k, transform: `translateY(${(1 - k) * -26}px) scale(${0.7 + 0.3 * k})`}}>
			<svg width={46} height={62} viewBox="0 0 46 62">
				<path d="M23 2 C11 2 3 11 3 22 C3 37 23 60 23 60 C23 60 43 37 43 22 C43 11 35 2 23 2 Z" fill={ouro ? '#E8C27A' : '#f4efff'} stroke="#1E0F3A" strokeWidth={3} />
				<circle cx={23} cy={22} r={7} fill="#1E0F3A" />
			</svg>
			<div style={{...VIDRO, marginTop: 10, padding: '8px 20px', borderRadius: 999, fontFamily: poppins, fontWeight: 800, fontSize: 28, letterSpacing: '0.1em', color: '#fff', whiteSpace: 'nowrap'}}>{nome}</div>
		</div>
	);
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: saida}}>
			<AbsoluteFill style={{opacity: entrada, background: 'linear-gradient(180deg, rgba(30,15,58,0.72) 0%, rgba(30,15,58,0.4) 22%, rgba(30,15,58,0) 32%)'}} />
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
				<path d={caminho} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={5} strokeDasharray="4 16" strokeLinecap="round" />
				<path d={caminho} fill="none" stroke="#E8C27A" strokeWidth={6} strokeDasharray="14 14" strokeLinecap="round" pathLength={1000} style={{strokeDasharray: `${rota * 1000} 1000`}} />
			</svg>
			<Pino x={150} k={pinoA} nome="FLORIPA" />
			<Pino x={930} k={pinoB} nome="RIO DE JANEIRO" ouro />
			<AviaoCena cena={{tipo: 'aviao', de: cena.de, ate: cena.ate, y: Y - 110}} />
		</AbsoluteFill>
	);
};

// 4. "a gente volta com energia renovada": bateria 3D de vidro que enche de ouro do "volta para casa" ao "renovada",
// com a porcentagem subindo e a palavra em Playfair dourado.
const Bateria: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, width, height, q, saida, entrada, d} = useCena(cena);
	const bEnchendo = q(d.enche);
	const bRen = q(d.renovada);
	const nivel = interpolate(frame, [bEnchendo, bRen + 6], [0.08, 1], {...lim, easing: (x) => 1 - (1 - x) ** 2});
	const cheio = interpolate(frame, [bRen + 4, bRen + 10], [0, 1], lim);
	const pal = spring({frame: frame - bRen, fps, config: {damping: 14}});
	const giro = Math.sin(frame / 30) * 0.25;
	const Y = yM(1130);
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: saida}}>
			<Veu k={entrada} />
			<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
				<Luzes quadro={frame} batidas={[bRen + 6]} />
				<group position={[0, Y, 0]} rotation={[0.2, giro, 0]}>
					<mesh>
						<boxGeometry args={[3.0, 1.3, 1.1]} />
						<meshPhysicalMaterial color="#cdb8ff" transparent opacity={0.22} roughness={0.05} metalness={0.1} />
					</mesh>
					<mesh position={[1.62, 0, 0]}>
						<boxGeometry args={[0.24, 0.55, 0.5]} />
						<meshStandardMaterial {...ouroMat} />
					</mesh>
					<mesh position={[-1.4 + (2.8 * nivel) / 2, 0, 0]}>
						<boxGeometry args={[2.8 * nivel, 1.1, 0.9]} />
						<meshStandardMaterial {...ouroMat} emissive="#a86a18" emissiveIntensity={0.3 + cheio * 0.8} />
					</mesh>
				</group>
			</ThreeCanvas>
			<div style={{position: 'absolute', top: 1320, width: '100%', textAlign: 'center'}}>
				<span style={{...ouroTexto(56), fontWeight: 900, fontVariantNumeric: 'tabular-nums'}}>{Math.round(nivel * 100)}%</span>
			</div>
			<div style={{position: 'absolute', top: 1410, width: '100%', textAlign: 'center', opacity: pal, transform: `translateY(${(1 - pal) * 18}px)`}}>
				<span style={{fontFamily: poppins, fontWeight: 900, fontSize: 64, color: '#fff', marginRight: 18}}>ENERGIA</span>
				<span style={{fontFamily: playfair, fontStyle: 'italic', fontWeight: 800, fontSize: 84, background: OURO_TEXTO, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', padding: '0 0.06em'}}>renovada</span>
			</div>
		</AbsoluteFill>
	);
};

// 5. "nunca enxerga isso como um gasto, nunca é supérfluo, isso aqui é um investimento, um networking, amizade, um ambiente":
// tela inteira. GASTO e SUPÉRFLUO entram em grafite, são riscados e desabam; INVESTIMENTO bate em ouro com clarão e os
// ganhos entram embaixo, um por um.
const Investimento: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, width, height, q, saida, entrada, d} = useCena(cena);
	const bG = q(d.gasto);
	const bS = q(d.superfluo);
	const bI = q(d.investimento);
	const ganhos = [
		{texto: 'NETWORKING', em: q(d.networking)},
		{texto: 'AMIZADE', em: q(d.amizade)},
		{texto: 'AMBIENTE', em: q(d.ambiente)},
	];
	const risco = (b: number) => interpolate(frame, [b + 8, b + 14], [0, 1], lim);
	const quedaG = bI - 10;
	const quedaS = bI - 6;
	const some = (b: number) => interpolate(frame, [b, b + 12], [1, 0], lim);
	const clarao = interpolate(frame, [bI, bI + 2, bI + 12], [0, 0.8, 0], lim);
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: entrada * saida}}>
			<FundoMotion />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse 70% 30% at 50% 50%, rgba(232,194,122,0.18) 0%, rgba(0,0,0,0) 70%)', opacity: interpolate(frame, [bI, bI + 10], [0, 1], lim)}} />
			<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
				<Luzes quadro={frame} batidas={[bI]} />
				<Linha3D texto="GASTO" metal="cinza" largura={3.0} y={yM(560)} quadro={frame} batida={bG} queda={quedaG} profundidade={0.5} />
				<Linha3D texto="SUPÉRFLUO" metal="cinza" largura={3.8} y={yM(800)} quadro={frame} batida={bS} queda={quedaS} profundidade={0.5} />
				<Linha3D texto="INVESTIMENTO" metal="ouro" largura={4.9} y={yM(900)} quadro={frame} batida={bI} profundidade={0.65} />
			</ThreeCanvas>
			{[
				{y: 560, b: bG, w: 560, queda: quedaG},
				{y: 800, b: bS, w: 700, queda: quedaS},
			].map((r, i) => (
				<div key={i} style={{position: 'absolute', left: 540 - r.w / 2, width: r.w * risco(r.b), top: r.y - 6, height: 12, borderRadius: 6, background: '#E8C27A', boxShadow: '0 0 18px rgba(232,194,122,0.7)', opacity: some(r.queda), transform: 'rotate(-4deg)'}} />
			))}
			<AbsoluteFill style={{background: '#fff4dc', opacity: clarao}} />
			<div style={{position: 'absolute', top: 1180, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22}}>
				{ganhos.map((g, i) => {
					const k = spring({frame: frame - g.em, fps, config: {damping: 14}});
					return (
						<div key={i} style={{...VIDRO, padding: '14px 38px', borderRadius: 999, fontFamily: poppins, fontWeight: 800, fontSize: 40, letterSpacing: '0.1em', color: '#fff', opacity: k, transform: `translateY(${(1 - k) * 30}px) scale(${0.9 + 0.1 * k})`}}>
							<span style={{color: '#E8C27A', marginRight: 14}}>+</span>
							{g.texto}
						</div>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};

// Cérebro: icosaedro com dobras (deslocamento por senos), lento e pesado.
const Cerebro: React.FC<{quadro: number; incha: number; apaga: number}> = ({quadro, incha, apaga}) => {
	const geo = useMemo(() => {
		const g = new THREE.IcosahedronGeometry(1, 5);
		const p = g.attributes.position as THREE.BufferAttribute;
		const v = new THREE.Vector3();
		for (let i = 0; i < p.count; i++) {
			v.fromBufferAttribute(p, i);
			const dobra = 0.07 * Math.sin(v.x * 9 + Math.sin(v.y * 7) * 2) * Math.cos(v.z * 8) + 0.04 * Math.sin(v.y * 15 + v.z * 5);
			const sulco = 1 - 0.12 * Math.exp(-(v.x * v.x) * 60) * (v.y > -0.3 ? 1 : 0);
			v.multiplyScalar((1 + dobra) * sulco);
			p.setXYZ(i, v.x * 1.25, v.y * 0.95, v.z * 1.05);
		}
		g.computeVertexNormals();
		return g;
	}, []);
	const t = quadro / 30;
	// Pesado: balança devagar e "afunda" no próprio peso.
	const larg = 1 + incha * 0.35 + Math.sin(t * 1.3) * 0.03;
	const alt = 1 + incha * 0.12 - Math.abs(Math.sin(t * 1.3)) * 0.04;
	return (
		<mesh geometry={geo} rotation={[0.35, Math.sin(t * 0.6) * 0.3 + 0.4, 0]} scale={[larg, alt, larg]}>
			<meshStandardMaterial color={apaga > 0.5 ? '#6f6880' : '#c79be0'} metalness={0.35} roughness={0.45} emissive="#3a1464" emissiveIntensity={0.25 * (1 - apaga)} />
		</mesh>
	);
};

// Engrenagem cinza que tenta girar e trava (falta de prática).
const Engrenagem: React.FC<{quadro: number; entra: number}> = ({quadro, entra}) => {
	const l = Math.max(0, quadro - entra);
	// Tenta girar, emperra, volta um pouco: nunca completa.
	const tenta = Math.sin(l / 6) * 0.12 + Math.min(l, 18) * 0.01;
	return (
		// Eixo do cilindro em Y: deitado de frente para a câmera e girando (tentando) em torno dele.
		<group rotation={[Math.PI / 2 - 0.35, 0, 0.2]}>
			<group rotation={[0, tenta, 0]}>
				<mesh>
					<cylinderGeometry args={[0.95, 0.95, 0.35, 48]} />
					<meshStandardMaterial color="#8d8a99" metalness={0.85} roughness={0.38} />
				</mesh>
				<mesh>
					<cylinderGeometry args={[0.3, 0.3, 0.4, 32]} />
					<meshStandardMaterial color="#1E0F3A" metalness={0.4} roughness={0.5} />
				</mesh>
				{Array.from({length: 12}, (_, i) => {
					const a = (i / 12) * Math.PI * 2;
					return (
						<mesh key={i} position={[Math.cos(a) * 1.05, 0, Math.sin(a) * 1.05]} rotation={[0, -a, 0]}>
							<boxGeometry args={[0.3, 0.35, 0.26]} />
							<meshStandardMaterial color="#8d8a99" metalness={0.85} roughness={0.38} />
						</mesh>
					);
				})}
			</group>
		</group>
	);
};

// 6. "se tornar um obeso intelectual e não praticar, não vai adiantar nada": tela inteira. Um cérebro gordo e lento incha
// enquanto a barra do raciocínio se arrasta; no "praticar" ele apaga e entra a engrenagem que emperra com "SEM PRÁTICA".
const Obeso: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, width, height, q, saida, entrada, d} = useCena(cena);
	const bO = q(d.obeso);
	const bI = q(d.intelectual);
	const bP = q(d.praticar);
	const bA = q(d.adiantar);
	const incha = interpolate(frame, [bO, bP], [0, 1], lim);
	const apaga = interpolate(frame, [bP, bP + 8], [0, 1], lim);
	const barra = interpolate(frame, [bO, bP], [0, 0.07], lim);
	const fase2 = spring({frame: frame - bP, fps, config: {damping: 15}});
	const nada = spring({frame: frame - bA, fps, config: {damping: 15}});
	// O título afunda devagar, pesado.
	const afunda = interpolate(frame, [bI + 10, bP], [0, 0.35], lim);
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: entrada * saida}}>
			<FundoMotion />
			<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
				<Luzes quadro={frame} batidas={[bI]} />
				<group position={[0, -afunda, 0]}>
					<Linha3D texto="OBESO" metal="branco" largura={3.0} y={yM(300)} quadro={frame} batida={bO} profundidade={0.6} />
					<Linha3D texto="INTELECTUAL" metal="ouro" largura={4.6} y={yM(470)} quadro={frame} batida={bI} profundidade={0.6} />
				</group>
				<group position={[0, yM(870), 0]} scale={1.35 * (1 - apaga * 0.25)}>
					<Cerebro quadro={frame} incha={incha} apaga={apaga} />
				</group>
				{frame >= bP ? (
					<group position={[0, yM(1330), 0]} scale={fase2}>
						<Engrenagem quadro={frame} entra={bP} />
					</group>
				) : null}
			</ThreeCanvas>
			<div style={{position: 'absolute', top: 1140, left: 190, width: 700, opacity: 1 - fase2}}>
				<div style={{fontFamily: poppins, fontWeight: 700, fontSize: 30, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.85)', marginBottom: 12}}>RACIOCÍNIO… {Math.round(barra * 100)}%</div>
				<div style={{height: 22, borderRadius: 11, background: 'rgba(255,255,255,0.12)', overflow: 'hidden', boxShadow: 'inset 0 0 0 1.5px rgba(232,194,122,0.4)'}}>
					<div style={{width: `${barra * 100}%`, height: '100%', background: 'linear-gradient(90deg,#C9974A,#F2D08A)'}} />
				</div>
			</div>
			<div style={{position: 'absolute', top: 1560, width: '100%', textAlign: 'center', opacity: fase2, transform: `translateY(${(1 - fase2) * 20}px)`}}>
				<span style={{fontFamily: poppins, fontWeight: 900, fontSize: 70, color: '#fff', letterSpacing: '0.02em'}}>SEM PRÁTICA</span>
			</div>
			<div style={{position: 'absolute', top: 1660, width: '100%', display: 'flex', justifyContent: 'center', opacity: nada, transform: `translateY(${(1 - nada) * 20}px)`}}>
				<div style={{...VIDRO, padding: '12px 30px', borderRadius: 999, fontFamily: poppins, fontWeight: 700, fontSize: 34, letterSpacing: '0.1em', color: '#fff'}}>NÃO ADIANTA NADA</div>
			</div>
		</AbsoluteFill>
	);
};

// 7. Resposta da Isabela: o ciclo do evento em 4 placas de vidro que viram (3D) uma a uma, ligadas por uma linha de ouro
// que corre entre elas: INSIGHT → OS MELHORES → APRENDE → APLICA.
const Ciclo: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, saida, entrada} = useCena(cena);
	const itens = ((cena.dados?.itens ?? []) as {texto: string; em: number}[]).map((i) => ({...i, b: q(i.em)}));
	const n = itens.length;
	const larg = 230;
	const gap = 20;
	const total = n * larg + (n - 1) * gap;
	const x0 = 540 - total / 2;
	const Y = 1110;
	const ultimo = itens.reduce((m, i, k) => (frame >= i.b ? k : m), -1);
	const linha = n > 1 ? interpolate(frame, [itens[0].b, itens[n - 1].b], [0, 1], lim) : 0;
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: saida}}>
			<Veu k={entrada} />
			<div style={{position: 'absolute', left: x0 + larg / 2, top: Y + 90, width: (total - larg) * linha, height: 6, borderRadius: 3, background: '#E8C27A', boxShadow: '0 0 14px rgba(232,194,122,0.7)'}} />
			{itens.map((it, k) => {
				const s = spring({frame: frame - it.b, fps, config: {damping: 13, stiffness: 120}});
				const ativo = k === ultimo;
				const tam = Math.min(38, Math.floor(190 / Math.max(1, it.texto.length * 0.62)));
				return (
					<div key={k} style={{position: 'absolute', left: x0 + k * (larg + gap), top: Y, width: larg, height: 180, perspective: 900}}>
						<div style={{width: '100%', height: '100%', borderRadius: 26, ...VIDRO, boxShadow: `inset 0 0 0 ${ativo ? 3 : 1.5}px rgba(232,194,122,${ativo ? 0.95 : 0.5}), 0 ${ativo ? 0 : 14}px ${ativo ? 36 : 30}px ${ativo ? 'rgba(232,194,122,0.45)' : 'rgba(10,4,24,0.45)'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: `rotateY(${(1 - s) * 90}deg) scale(${ativo ? 1.06 : 1})`, opacity: s > 0.02 ? 1 : 0}}>
							<div style={{...ouroTexto(34), fontWeight: 900}}>{k + 1}</div>
							<div style={{fontFamily: poppins, fontWeight: 800, fontSize: tam, color: '#fff', letterSpacing: '0.04em', textAlign: 'center', lineHeight: 1.1, marginTop: 8}}>{it.texto}</div>
						</div>
					</div>
				);
			})}
		</AbsoluteFill>
	);
};

export const pecas: Pecas = {
	v5Gancho: Gancho,
	v5TopCreator: TopCreator,
	v5Rota: Rota,
	v5Bateria: Bateria,
	v5Investimento: Investimento,
	v5Obeso: Obeso,
	v5Ciclo: Ciclo,
};
