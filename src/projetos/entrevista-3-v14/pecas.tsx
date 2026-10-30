// Peças (efeitos) exclusivas do entrevista-3-v14 (Rogério, investir em conhecimento), usadas no edit.ts com
// {tipo: 'peca', nome: '<chave>', dados: {...}}. Tempos em dados = segundos do vídeo editado; o quadro 0 da peça é cena.de.
// Posições em px de um quadro 1080x1920; no 3D (câmera fov 35 a 14,5) 1 unidade ≈ 210 px e a largura útil é ±2,57.
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

type Dados = {
	marcos?: number[];
	itens?: {texto: string; em: number; icone?: string; metal?: Metal}[];
	linhas?: {texto: string; em: number; metal?: Metal}[];
	texto?: string;
	rotulo?: string;
	valor?: number;
	prefixo?: string;
	sufixo?: string;
	topo?: {texto: string; em: number};
	passos?: {texto: string; em: number}[];
};

const lim = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const OURO = '#E8C27A';
const OURO_TEXTO = 'linear-gradient(180deg,#FFF1C9 0%,#F2D08A 40%,#E8C27A 65%,#C9974A 100%)';
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

const Pilula: React.FC<{texto: string; k: number; y: number; tamanho?: number; ouro?: boolean}> = ({texto, k, y, tamanho = 38, ouro}) => (
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

const Kicker: React.FC<{texto: string; k: number; y: number; tamanho?: number}> = ({texto, k, y, tamanho = 84}) => (
	<div style={{position: 'absolute', top: y, left: 40, right: 40, textAlign: 'center', opacity: k, transform: `translateY(${(1 - k) * 20}px)`, filter: `blur(${(1 - k) * 6}px)`}}>
		<span style={{fontFamily: playfair, fontStyle: 'italic', fontWeight: 800, fontSize: tamanho, lineHeight: 1.15, background: OURO_TEXTO, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', padding: '0 0.08em', filter: 'drop-shadow(0 6px 12px rgba(12,4,28,0.55))'}}>
			{texto}
		</span>
	</div>
);

const mola = (frame: number, ini: number, fps: number, damping = 12) => (frame < ini ? 0 : spring({frame: frame - ini, fps, config: {damping, stiffness: 140, mass: 0.8}}));

// 1. Gancho, pergunta: interrogação de ouro gigante girando na tela inteira e a pergunta em texto 3D.
const v14Pergunta: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, entra, sai, d, dur} = useCena(cena);
	const linhas = d.linhas ?? [];
	const p = mola(frame, 0, fps, 10);
	return (
		<AbsoluteFill style={{opacity: entra * sai}}>
			<FundoMotion />
			<AbsoluteFill style={{background: `radial-gradient(ellipse 50% 28% at 50% 56%, rgba(232,194,122,${0.28 + 0.06 * Math.sin(frame / 5)}) 0%, rgba(232,194,122,0) 70%)`}} />
			<Canvas>
				<Luzes quadro={frame} batidas={[0, ...linhas.map((l) => q(l.em))]} />
				<group position={[0, wy(1090), 0]} rotation={[0, frame * 0.07 + (1 - p) * 2, Math.sin(frame / 9) * 0.08]} scale={0.4 + 0.6 * p}>
					<Linha3D texto="?" metal="ouro" largura={1.5} y={0} quadro={frame} batida={0} profundidade={0.7} />
				</group>
				{linhas.map((l, i) => (
					<Linha3D key={i} texto={l.texto} metal={l.metal ?? (i ? 'ouro' : 'branco')} largura={Math.min(4.6, l.texto.length * 0.42)} y={wy(330 + i * 175)} quadro={frame} batida={q(l.em)} profundidade={0.34} />
				))}
			</Canvas>
			<div style={{position: 'absolute', bottom: 0, height: 4, left: 0, width: `${(frame / dur) * 100}%`, background: OURO, opacity: 0.6}} />
		</AbsoluteFill>
	);
};

// 2. Gancho, resposta: contador em ouro 3D que corre com ease-out até travar (com clarão) e moedas caindo dos lados.
const MOEDAS = Array.from({length: 14}, (_, i) => ({x: (i % 2 ? 1 : -1) * (1.55 + ((i * 37) % 9) / 10), atraso: i * 2.2, giro: 0.12 + ((i * 13) % 7) / 40}));
const v14Contador: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, entra, sai, d} = useCena(cena);
	const [ini = cena.de, trava = cena.de + 1.2, rot = trava] = d.marcos ?? [];
	const f0 = q(ini);
	const f1 = q(trava);
	const k = suave(interpolate(frame, [f0, f1], [0, 1], lim));
	const valor = d.valor ?? 50;
	const atual = frame >= f1 ? valor : Math.max(1, Math.round(k * valor));
	const texto = `${d.prefixo ?? 'R$ '}${atual}${d.sufixo ?? ' MIL'}`;
	const clarao = interpolate(frame, [f1, f1 + 2, f1 + 9], [0, 0.55, 0], lim);
	const r = mola(frame, q(rot), fps);
	const yNum = 330;
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: sai}}>
			<Topo k={entra} ate={640} />
			<AbsoluteFill style={{opacity: interpolate(frame, [f1, f1 + 5], [0, 1], lim) * (0.8 + 0.2 * Math.sin(frame / 6)), background: `radial-gradient(ellipse 48% 9% at 50% ${(yNum / 1920) * 100}%, rgba(255,214,140,0.55) 0%, rgba(150,90,220,0.18) 55%, rgba(0,0,0,0) 100%)`}} />
			<Canvas>
				<Luzes quadro={frame} batidas={[f0, f1]} />
				{MOEDAS.map((m, i) => {
					const l = frame - f0 - m.atraso;
					if (l < 0 || frame > f1 + 14) return null;
					const y = wy(-60) - l * 0.16;
					if (y < wy(620)) return null;
					return (
						<mesh key={i} position={[m.x, y, -1]} rotation={[Math.PI / 2 + l * m.giro, l * 0.1, 0]} material={[matOuro, matOuroEscuro, matOuroEscuro]}>
							<cylinderGeometry args={[0.24, 0.24, 0.05, 36]} />
						</mesh>
					);
				})}
				<group position={[0, wy(yNum), 0]} scale={1 + clarao * 0.25}>
					<Linha3D texto={texto} metal="ouro" largura={Math.min(4.7, texto.length * 0.5)} y={0} quadro={frame} batida={f0} profundidade={0.6} />
				</group>
			</Canvas>
			<AbsoluteFill style={{background: '#fff', opacity: clarao}} />
			{d.rotulo ? <Pilula texto={d.rotulo} k={r} y={yNum + 140} tamanho={36} /> : null}
		</AbsoluteFill>
	);
};

// 3. Floripa: pino de mapa em ouro 3D que cai e quica acima da cabeça; a etiqueta embaixo troca a cada informação.
const v14Pino: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, entra, sai, d} = useCena(cena);
	const itens = d.itens ?? [];
	const cai = mola(frame, 0, fps, 8);
	const atual = [...itens].reverse().find((it) => frame >= q(it.em));
	const iAtual = atual ? itens.indexOf(atual) : -1;
	const k = atual ? interpolate(frame, [q(atual.em), q(atual.em) + 6], [0, 1], lim) : 0;
	const yPino = 250;
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: sai}}>
			<Topo k={entra} ate={600} />
			<Canvas>
				<Luzes quadro={frame} batidas={[4]} />
				<group position={[0, wy(yPino) + (1 - cai) * 3, 0]} rotation={[0, frame * 0.05, 0]}>
					<mesh position={[0, 0.25, 0]} material={matOuro}>
						<sphereGeometry args={[0.42, 40, 40]} />
					</mesh>
					<mesh position={[0, -0.32, 0]} rotation={[Math.PI, 0, 0]} material={matOuro}>
						<coneGeometry args={[0.36, 0.85, 40]} />
					</mesh>
					<mesh position={[0, 0.25, 0.34]} material={matRoxo}>
						<sphereGeometry args={[0.16, 24, 24]} />
					</mesh>
				</group>
				<mesh position={[0, wy(yPino) - 0.8, -0.2]} rotation={[-Math.PI / 2.4, 0, 0]} scale={[1 + cai * 0.2, 1, 1]}>
					<circleGeometry args={[0.45, 40]} />
					<meshBasicMaterial color="#120826" transparent opacity={0.35 * cai} />
				</mesh>
			</Canvas>
			{atual ? <Pilula key={iAtual} texto={atual.texto} k={k} y={yPino + 170} ouro={iAtual === itens.length - 1} tamanho={40} /> : null}
		</AbsoluteFill>
	);
};

// 4. Degraus de investimento: escada 3D na meia tela de baixo; cada degrau sobe na hora do valor e o topo acende
// em ouro com o objetivo. Os rótulos ficam colados na frente de cada degrau.
const v14Degraus: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, entra, sai, d} = useCena(cena);
	const passos = d.passos ?? d.itens ?? [];
	const n = passos.length + (d.topo ? 1 : 0);
	const larg = 4.6 / n;
	const base = wy(1700);
	const altura = 0.55;
	const degraus = [...passos.map((p) => ({...p, topo: false})), ...(d.topo ? [{...d.topo, topo: true}] : [])];
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: sai}}>
			<VeuBaixo k={entra} />
			<Canvas>
				<Luzes quadro={frame} batidas={degraus.map((g) => q(g.em))} />
				<group rotation={[0.18, -0.32, 0]} position={[0, 0, 0]}>
					{degraus.map((g, i) => {
						const s = mola(frame, q(g.em), fps, 11);
						const h = altura * (i + 1);
						const x = -2.3 + larg * (i + 0.5);
						return (
							<mesh key={i} position={[x, base + (h * s) / 2, 0]} scale={[1, Math.max(0.001, s), 1]} material={g.topo ? matOuro : matRoxo}>
								<boxGeometry args={[larg * 0.96, h, 1.2]} />
							</mesh>
						);
					})}
				</group>
			</Canvas>
			{degraus.map((g, i) => {
				const s = mola(frame, q(g.em) + 3, fps);
				const h = altura * (i + 1);
				const xPx = 540 + (-2.3 + larg * (i + 0.5)) * K * 0.95;
				const yPx = 960 - (base + h) * K - 92;
				return (
					<div key={i} style={{position: 'absolute', left: xPx - 160, width: 320, top: yPx, textAlign: 'center', opacity: s, transform: `translateY(${(1 - s) * 20}px)`}}>
						<span style={{fontFamily: g.topo ? playfair : poppins, fontStyle: g.topo ? 'italic' : 'normal', fontWeight: 800, fontSize: g.topo ? 50 : 36, letterSpacing: g.topo ? 0 : '0.04em', ...(g.topo ? {background: OURO_TEXTO, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'} : {color: '#fff'}), textShadow: g.topo ? undefined : '0 4px 14px rgba(12,4,28,0.7)', whiteSpace: 'nowrap'}}>
							{g.texto}
						</span>
					</div>
				);
			})}
		</AbsoluteFill>
	);
};

// 5. Pergunta: interrogação de ouro girando acima da cabeça.
const v14Interroga: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, entra, sai} = useCena(cena);
	const p = mola(frame, 0, fps, 9);
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: sai}}>
			<Topo k={entra * 0.8} ate={520} />
			<Canvas>
				<Luzes quadro={frame} batidas={[2]} />
				<group position={[0, wy(300), 0]} rotation={[0, frame * 0.09, Math.sin(frame / 7) * 0.1]} scale={0.3 + 0.7 * p}>
					<Linha3D texto="?" metal="ouro" largura={0.9} y={0} quadro={frame} batida={0} profundidade={0.6} />
				</group>
			</Canvas>
		</AbsoluteFill>
	);
};

// 6. "Dar um passo": pegadas que sobem pela grade, a última bate grande, e as frases em texto 3D.
const Pegada: React.FC<{x: number; y: number; k: number; esq: boolean; escala?: number}> = ({x, y, k, esq, escala = 1}) => (
	<svg width={120 * escala} height={200 * escala} viewBox="0 0 120 200" style={{position: 'absolute', left: x - 60 * escala, top: y - 100 * escala, opacity: k, transform: `scale(${0.6 + 0.4 * k}) scaleX(${esq ? -1 : 1}) rotate(${esq ? -8 : 8}deg)`, filter: 'drop-shadow(0 6px 10px rgba(8,2,20,0.5))'}}>
		<defs>
			<linearGradient id="pegOuro" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stopColor="#FFF1C9" />
				<stop offset="0.6" stopColor="#E8C27A" />
				<stop offset="1" stopColor="#C9974A" />
			</linearGradient>
		</defs>
		<path d="M60 8 C92 8 104 44 100 78 C96 108 84 120 82 132 L38 132 C36 120 22 106 20 78 C16 42 28 8 60 8 Z" fill="url(#pegOuro)" />
		<path d="M40 146 L80 146 C84 168 76 192 60 192 C44 192 36 168 40 146 Z" fill="url(#pegOuro)" />
	</svg>
);
const v14Pegadas: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, entra, sai, d} = useCena(cena);
	const [passo = cena.de + 0.5] = d.marcos ?? [];
	const linhas = d.linhas ?? [];
	const fp = q(passo);
	const pegadas = Array.from({length: 5}, (_, i) => ({x: 540 + (i % 2 ? 70 : -70), y: 1640 - i * 150, ini: fp - (4 - i) * 5}));
	const bate = interpolate(frame, [fp, fp + 3, fp + 12], [0, 1, 0], lim);
	return (
		<AbsoluteFill style={{opacity: entra * sai}}>
			<FundoMotion />
			{pegadas.map((p, i) => (
				<Pegada key={i} x={p.x} y={p.y} k={interpolate(frame, [p.ini, p.ini + 4], [0, 1], lim) * (i === 4 ? 1 : 0.55)} esq={i % 2 === 0} escala={i === 4 ? 1.15 + bate * 0.3 : 0.85} />
			))}
			<Canvas>
				<Luzes quadro={frame} batidas={[fp, ...linhas.map((l) => q(l.em))]} />
				{linhas.map((l, i) => (
					<Linha3D key={i} texto={l.texto} metal={l.metal ?? (i % 2 ? 'ouro' : 'branco')} largura={Math.min(4.6, l.texto.length * 0.4)} y={wy(300 + i * 170)} quadro={frame} batida={q(l.em)} profundidade={0.34} />
				))}
			</Canvas>
		</AbsoluteFill>
	);
};

// 7. Ponto A → ponto B: dois pinos no mapa, a rota tracejada se desenha de A até B com um ponto andando e, no "Investe",
// o texto 3D bate no meio.
const v14Rota: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, entra, sai, d} = useCena(cena);
	const [emA = cena.de + 0.3, emB = cena.de + 1.2, emInveste = cena.de + 1.8] = d.marcos ?? [];
	const fa = q(emA);
	const fb = q(emB);
	const desenho = suave(interpolate(frame, [fa + 2, fb], [0, 1], lim));
	const A = {x: 230, y: 1450};
	const B = {x: 850, y: 760};
	const caminho = `M ${A.x} ${A.y} C ${A.x + 40} ${A.y - 380}, ${B.x - 420} ${B.y + 360}, ${B.x} ${B.y}`;
	const kA = mola(frame, fa, fps);
	const kB = mola(frame, fb, fps);
	const pin = (x: number, y: number, k: number, letra: string, ouro: boolean) => (
		<div style={{position: 'absolute', left: x - 70, top: y - 160, width: 140, height: 160, opacity: k, transform: `translateY(${(1 - k) * -60}px)`}}>
			<svg width={140} height={160} viewBox="0 0 140 160">
				<path d="M70 156 C70 156 12 92 12 58 C12 26 38 4 70 4 C102 4 128 26 128 58 C128 92 70 156 70 156 Z" fill={ouro ? '#E8C27A' : '#6b46c1'} stroke={ouro ? '#fff1c9' : '#b59cf2'} strokeWidth={4} />
				<text x={70} y={74} textAnchor="middle" fontFamily={poppins} fontWeight={900} fontSize={56} fill={ouro ? '#2a1352' : '#fff'}>
					{letra}
				</text>
			</svg>
		</div>
	);
	const comp = 1300;
	const t = desenho;
	// Ponto que anda na curva (Bézier cúbica).
	const bz = (a: number, b: number, c: number, e: number) => (1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t ** 2 * c + t ** 3 * e;
	const px = bz(A.x, A.x + 40, B.x - 420, B.x);
	const py = bz(A.y, A.y - 380, B.y + 360, B.y);
	return (
		<AbsoluteFill style={{opacity: entra * sai}}>
			<FundoMotion />
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
				<path d={caminho} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth={10} strokeDasharray="4 26" strokeLinecap="round" />
				<path d={caminho} fill="none" stroke="#E8C27A" strokeWidth={12} strokeLinecap="round" strokeDasharray={`${comp * desenho} ${comp}`} style={{filter: 'drop-shadow(0 0 12px rgba(232,194,122,0.7))'}} />
				{desenho > 0 && desenho < 1 ? <circle cx={px} cy={py} r={18} fill="#fff" style={{filter: 'drop-shadow(0 0 10px #fff)'}} /> : null}
			</svg>
			{pin(A.x, A.y, kA, 'A', false)}
			{pin(B.x, B.y, kB, 'B', true)}
			<div style={{position: 'absolute', left: A.x - 120, width: 240, top: A.y + 20, textAlign: 'center', opacity: kA, fontFamily: poppins, fontWeight: 800, fontSize: 30, letterSpacing: '0.12em', color: '#d9ccff'}}>ONDE VOCÊ ESTÁ</div>
			<div style={{position: 'absolute', left: B.x - 170, width: 300, top: B.y + 20, textAlign: 'center', opacity: kB, fontFamily: poppins, fontWeight: 800, fontSize: 30, letterSpacing: '0.12em', color: OURO}}>ONDE QUER CHEGAR</div>
			<Canvas>
				<Luzes quadro={frame} batidas={[q(emInveste)]} />
				<Linha3D texto="INVESTE." metal="ouro" largura={3.9} y={wy(330)} quadro={frame} batida={q(emInveste)} profundidade={0.5} />
			</Canvas>
		</AbsoluteFill>
	);
};

// 8. Onde investir: três placas de vidro com ícone que entram uma a uma acima da cabeça.
const Icone: React.FC<{tipo?: string}> = ({tipo}) => {
	const c = '#E8C27A';
	if (tipo === 'pessoas')
		return (
			<svg width={74} height={74} viewBox="0 0 74 74">
				<circle cx={26} cy={24} r={11} fill={c} />
				<circle cx={50} cy={24} r={11} fill={c} opacity={0.75} />
				<path d="M6 62 C8 44 18 38 26 38 C34 38 44 44 46 62 Z" fill={c} />
				<path d="M30 62 C32 44 42 38 50 38 C58 38 68 44 70 62 Z" fill={c} opacity={0.75} />
			</svg>
		);
	if (tipo === 'capelo')
		return (
			<svg width={74} height={74} viewBox="0 0 74 74">
				<path d="M37 12 L70 28 L37 44 L4 28 Z" fill={c} />
				<path d="M18 36 L18 52 C26 60 48 60 56 52 L56 36 L37 46 Z" fill={c} opacity={0.8} />
				<path d="M64 31 L64 54" stroke={c} strokeWidth={4} />
			</svg>
		);
	return (
		<svg width={74} height={74} viewBox="0 0 74 74">
			<path d="M8 16 C20 12 30 14 36 20 L36 62 C30 56 20 54 8 58 Z" fill={c} />
			<path d="M66 16 C54 12 44 14 38 20 L38 62 C44 56 54 54 66 58 Z" fill={c} opacity={0.75} />
		</svg>
	);
};
const v14Tres: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, entra, sai, d} = useCena(cena);
	const itens = d.itens ?? [];
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: sai}}>
			<Topo k={entra} ate={600} />
			<div style={{position: 'absolute', top: 230, left: 40, right: 40, display: 'flex', justifyContent: 'center', gap: 22}}>
				{itens.map((it, i) => {
					const k = mola(frame, q(it.em), fps, 11);
					return (
						<div key={i} style={{width: 300, height: 220, borderRadius: 34, background: 'linear-gradient(180deg, rgba(46,24,86,0.88), rgba(30,15,58,0.88))', boxShadow: `inset 0 0 0 2px rgba(232,194,122,${0.35 + 0.4 * k}), 0 16px 34px rgba(8,2,20,0.5)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, opacity: k, transform: `perspective(800px) rotateY(${(1 - k) * 70}deg) translateY(${(1 - k) * 30}px)`}}>
							<Icone tipo={it.icone} />
							<div style={{fontFamily: poppins, fontWeight: 800, fontSize: it.texto.length > 10 ? 27 : 32, letterSpacing: '0.05em', color: '#fff'}}>{it.texto}</div>
						</div>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};

// 9. Não errar: estrada vista de cima com buracos sinalizados; a linha-guia dourada (o direcionamento) se desenha
// desviando de todos e um ponto percorre o caminho.
const BURACOS = [
	{x: 400, y: 1380},
	{x: 690, y: 1060},
	{x: 380, y: 740},
];
const v14Caminho: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, entra, sai, d} = useCena(cena);
	const [emBuracos = cena.de + 0.2, emGuia = cena.de + 1.5] = d.marcos ?? [];
	const fg = q(emGuia);
	const guia = suave(interpolate(frame, [fg, fg + 40], [0, 1], lim));
	const caminho = 'M 540 1780 C 760 1560, 760 1460, 640 1300 S 380 1150, 470 980 S 700 800, 620 660 S 520 470, 540 380';
	const comp = 1900;
	return (
		<AbsoluteFill style={{opacity: entra * sai}}>
			<FundoMotion />
			{/* Estrada: faixa larga de vidro com a faixa central tracejada. */}
			<div style={{position: 'absolute', left: 260, width: 560, top: 300, bottom: 80, borderRadius: 60, background: 'linear-gradient(180deg, rgba(20,10,40,0.2), rgba(20,10,40,0.75) 30%, rgba(20,10,40,0.75))', boxShadow: 'inset 0 0 0 3px rgba(255,255,255,0.08)'}} />
			<div style={{position: 'absolute', left: 536, width: 8, top: 340, bottom: 120, backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.22) 50%, transparent 50%)', backgroundSize: '8px 60px', backgroundPosition: `0 ${(frame * 4) % 60}px`}} />
			{BURACOS.map((b, i) => {
				const k = mola(frame, q(emBuracos) + i * 5, fps, 10);
				return (
					<React.Fragment key={i}>
						<div style={{position: 'absolute', left: b.x - 95, top: b.y - 50, width: 190, height: 100, borderRadius: '50%', background: 'radial-gradient(ellipse at 50% 40%, #050208 0%, #0d0619 55%, rgba(60,36,110,0.9) 100%)', boxShadow: 'inset 0 10px 20px rgba(0,0,0,0.9)', transform: `scale(${k})`}} />
						<div style={{position: 'absolute', left: b.x + (b.x < 540 ? -200 : 110), top: b.y - 120, opacity: k, transform: `rotate(${(1 - k) * -30}deg)`}}>
							<svg width={90} height={90} viewBox="0 0 90 90">
								<path d="M45 6 L84 78 L6 78 Z" fill="#E8C27A" stroke="#2a1352" strokeWidth={5} strokeLinejoin="round" />
								<text x={45} y={68} textAnchor="middle" fontFamily={poppins} fontWeight={900} fontSize={44} fill="#2a1352">!</text>
							</svg>
						</div>
						<div style={{position: 'absolute', left: b.x + (b.x < 540 ? -260 : 60), width: 200, top: b.y - 20, textAlign: 'center', opacity: k * interpolate(guia, [0, 0.2], [1, 0.35], lim), fontFamily: poppins, fontWeight: 800, fontSize: 28, letterSpacing: '0.12em', color: '#d9ccff'}}>ERRO</div>
					</React.Fragment>
				);
			})}
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
				<path d={caminho} fill="none" stroke="#E8C27A" strokeWidth={14} strokeLinecap="round" strokeDasharray={`${comp * guia} ${comp}`} style={{filter: 'drop-shadow(0 0 14px rgba(232,194,122,0.8))'}} />
			</svg>
			<Pilula texto="DIRECIONAMENTO" k={interpolate(frame, [fg, fg + 8], [0, 1], lim)} y={200} ouro tamanho={44} />
		</AbsoluteFill>
	);
};

// 10. O mentor já errou antes: placa acima da cabeça; três "ERROS" são riscados um a um e a frase fica em ouro.
const v14Mentor: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, entra, sai, d} = useCena(cena);
	const [emRisca = cena.de + 0.3] = d.marcos ?? [];
	const fr = q(emRisca);
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: sai}}>
			<Topo k={entra} ate={600} />
			<Pilula texto="O MENTOR" k={mola(frame, 0, fps)} y={200} tamanho={34} />
			<div style={{position: 'absolute', top: 300, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 26}}>
				{[0, 1, 2].map((i) => {
					const k = mola(frame, 2 + i * 3, fps);
					const risco = interpolate(frame, [fr + i * 4, fr + i * 4 + 5], [0, 1], lim);
					return (
						<div key={i} style={{position: 'relative', opacity: k, transform: `translateY(${(1 - k) * 20}px)`, fontFamily: poppins, fontWeight: 900, fontSize: 46, letterSpacing: '0.06em', color: `rgba(255,255,255,${1 - risco * 0.55})`, padding: '6px 14px'}}>
							ERRO
							<div style={{position: 'absolute', left: 0, top: '50%', height: 8, width: `${risco * 100}%`, background: OURO, borderRadius: 4, transform: 'rotate(-8deg)', boxShadow: '0 0 12px rgba(232,194,122,0.8)'}} />
						</div>
					);
				})}
			</div>
			<Kicker texto="já errou antes" k={interpolate(frame, [fr + 10, fr + 18], [0, 1], lim)} y={380} tamanho={76} />
		</AbsoluteFill>
	);
};

// 11. Cabeça fervendo: termômetro de vidro à esquerda cujo líquido sobe e ferve (bolhas) na palavra; etiqueta no topo.
const v14Termometro: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, entra, sai, d} = useCena(cena);
	const [emFerve = cena.de + 0.5] = d.marcos ?? [];
	const ff = q(emFerve);
	const nivel = suave(interpolate(frame, [4, ff + 6], [0.15, 1], lim));
	const tremor = frame > ff ? Math.sin(frame * 2.3) * 3 : 0;
	const H = 520;
	const x = 110;
	const topo = 260;
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: sai}}>
			<Topo k={entra} ate={520} />
			<div style={{position: 'absolute', left: x - 34 + tremor, top: topo, width: 68, height: H, borderRadius: 34, background: 'rgba(255,255,255,0.14)', boxShadow: 'inset 0 0 0 3px rgba(255,255,255,0.45), 0 10px 30px rgba(8,2,20,0.5)', overflow: 'hidden'}}>
				<div style={{position: 'absolute', bottom: 0, left: 10, right: 10, height: `${nivel * 92}%`, borderRadius: 24, background: 'linear-gradient(0deg, #C9974A, #E8C27A 60%, #FFF1C9)', boxShadow: '0 0 18px rgba(232,194,122,0.8)'}} />
				{frame > ff
					? [0, 1, 2, 3].map((i) => {
							const l = ((frame - ff + i * 6) % 24) / 24;
							return <div key={i} style={{position: 'absolute', left: 18 + (i % 2) * 16, bottom: `${8 + l * 80}%`, width: 14, height: 14, borderRadius: 7, background: 'rgba(255,250,235,0.9)', opacity: 1 - l}} />;
						})
					: null}
			</div>
			<div style={{position: 'absolute', left: x - 56 + tremor, top: topo + H - 40, width: 112, height: 112, borderRadius: 56, background: 'radial-gradient(circle at 40% 35%, #FFF1C9, #E8C27A 50%, #9a6a1c)', boxShadow: '0 0 30px rgba(232,194,122,0.7)'}} />
			{[0.25, 0.5, 0.75].map((m) => (
				<div key={m} style={{position: 'absolute', left: x + 42, top: topo + H * (1 - m), width: 26, height: 4, background: 'rgba(255,255,255,0.6)'}} />
			))}
			<Pilula texto="CABEÇA FERVENDO" k={interpolate(frame, [ff, ff + 6], [0, 1], lim)} y={230} ouro tamanho={44} />
		</AbsoluteFill>
	);
};

// 12. Contato com pessoas: rede de avatares que se ligam por linhas douradas acima da cabeça; "muda vidas" em ouro.
const NOS = [
	{x: 170, y: 330},
	{x: 360, y: 230},
	{x: 540, y: 360},
	{x: 720, y: 230},
	{x: 910, y: 330},
];
const v14Rede: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, entra, sai, d} = useCena(cena);
	const [emContato = cena.de + 0.3, emVidas = cena.de + 2] = d.marcos ?? [];
	const fc = q(emContato);
	const fv = q(emVidas);
	const liga = suave(interpolate(frame, [fc, fc + 24], [0, 1], lim));
	const vidas = interpolate(frame, [fv, fv + 8], [0, 1], lim);
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: sai}}>
			<Topo k={entra} ate={640} />
			<svg width={1080} height={700} style={{position: 'absolute', left: 0, top: 0, opacity: 1 - vidas * 0.6}}>
				{NOS.slice(1).map((n, i) => {
					const a = NOS[i];
					const p = Math.min(1, Math.max(0, liga * NOS.length - i));
					return <line key={i} x1={a.x} y1={a.y} x2={a.x + (n.x - a.x) * p} y2={a.y + (n.y - a.y) * p} stroke="#E8C27A" strokeWidth={5} strokeLinecap="round" />;
				})}
				{NOS.map((n, i) => {
					const p = Math.min(1, Math.max(0, liga * NOS.length - i + 0.6));
					return p > 0 ? <line key={`c${i}`} x1={n.x} y1={n.y} x2={540} y2={360} stroke="rgba(232,194,122,0.35)" strokeWidth={3} strokeDasharray={`${p * 400} 400`} /> : null;
				})}
			</svg>
			{NOS.map((n, i) => {
				const k = mola(frame, i * 3, fps, 10);
				return (
					<div key={i} style={{position: 'absolute', left: n.x - 46, top: n.y - 46, width: 92, height: 92, borderRadius: 46, background: i === 2 ? 'linear-gradient(180deg,#F6DB9C,#D9A84E)' : 'linear-gradient(180deg,#5b34a8,#2e1856)', boxShadow: 'inset 0 0 0 3px rgba(232,194,122,0.8), 0 8px 20px rgba(8,2,20,0.5)', transform: `scale(${k})`, opacity: 1 - vidas * 0.6, overflow: 'hidden'}}>
						<svg width={92} height={92} viewBox="0 0 92 92">
							<circle cx={46} cy={36} r={16} fill={i === 2 ? '#2a1352' : 'rgba(255,255,255,0.85)'} />
							<path d="M16 92 C18 66 32 58 46 58 C60 58 74 66 76 92 Z" fill={i === 2 ? '#2a1352' : 'rgba(255,255,255,0.85)'} />
						</svg>
					</div>
				);
			})}
			<Kicker texto="muda vidas" k={vidas} y={250} tamanho={110} />
		</AbsoluteFill>
	);
};

// 13. Ambição renovada: bateria acima da cabeça que recarrega de 12% a 100% com raio, e a palavra RENOVADA no fim.
const v14Bateria: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, entra, sai, d} = useCena(cena);
	const [emCarga = cena.de + 0.2, emCheia = cena.de + 1.2] = d.marcos ?? [];
	const f0 = q(emCarga);
	const f1 = q(emCheia);
	const carga = interpolate(frame, [f0, f1], [0.12, 1], lim);
	const cheia = frame >= f1;
	const pulso = cheia ? 0.5 + 0.5 * Math.sin((frame - f1) / 3) : 0;
	const W = 420;
	const Hb = 170;
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: sai}}>
			<Topo k={entra} ate={620} />
			<Pilula texto="AMBIÇÃO" k={mola(frame, 0, fps)} y={190} tamanho={34} />
			<div style={{position: 'absolute', left: 540 - W / 2, top: 290, width: W, height: Hb, borderRadius: 30, boxShadow: `inset 0 0 0 6px rgba(255,255,255,0.85), 0 0 ${20 + pulso * 30}px rgba(232,194,122,${0.3 + pulso * 0.4})`, background: 'rgba(30,15,58,0.6)', transform: `scale(${mola(frame, 0, fps, 10)})`}}>
				<div style={{position: 'absolute', left: 16, top: 16, bottom: 16, width: `${carga * (W - 32)}px`, borderRadius: 18, background: carga < 0.3 ? 'linear-gradient(180deg,#8f7bb8,#5b4a86)' : 'linear-gradient(180deg,#FFF1C9,#E8C27A 55%,#C9974A)'}} />
				<svg width={90} height={120} viewBox="0 0 90 120" style={{position: 'absolute', left: W / 2 - 45, top: Hb / 2 - 60}}>
					<path d="M52 4 L14 66 L42 66 L34 116 L76 48 L48 48 Z" fill="#fff" stroke="#2a1352" strokeWidth={5} strokeLinejoin="round" />
				</svg>
				<div style={{position: 'absolute', right: -34, top: Hb / 2 - 34, width: 26, height: 68, borderRadius: 8, background: 'rgba(255,255,255,0.85)'}} />
			</div>
			<div style={{position: 'absolute', top: 480, left: 0, right: 0, textAlign: 'center', fontFamily: poppins, fontWeight: 900, fontSize: 44, color: '#fff', letterSpacing: '0.06em', opacity: cheia ? 0 : 1}}>{Math.round(carga * 100)}%</div>
			<Kicker texto="renovada" k={interpolate(frame, [f1, f1 + 7], [0, 1], lim)} y={455} tamanho={88} />
		</AbsoluteFill>
	);
};

// 14. Um ano: folha de calendário que vira os 12 meses depressa e trava em "1 ANO" em ouro.
const MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
const v14Calendario: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, entra, sai, d} = useCena(cena);
	const [emGira = cena.de + 0.2, emAno = cena.de + 1] = d.marcos ?? [];
	const f0 = q(emGira);
	const f1 = q(emAno);
	const i = Math.min(11, Math.max(0, Math.floor(interpolate(frame, [f0, f1], [0, 12], lim))));
	const virada = frame >= f0 && frame < f1 ? (interpolate(frame, [f0, f1], [0, 12], lim) % 1) : 0;
	const ano = frame >= f1;
	const k = mola(frame, 0, fps, 11);
	const ka = mola(frame, f1, fps, 9);
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: sai}}>
			<Topo k={entra} ate={640} />
			<div style={{position: 'absolute', left: 540 - 170, top: 200, width: 340, height: 330, borderRadius: 34, background: '#fff', boxShadow: '0 18px 40px rgba(8,2,20,0.55)', overflow: 'hidden', transform: `scale(${k}) rotate(${(1 - k) * -10}deg)`, perspective: 900}}>
				<div style={{height: 96, background: 'linear-gradient(180deg,#5b34a8,#2e1856)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 70}}>
					<div style={{width: 18, height: 18, borderRadius: 9, background: '#E8C27A'}} />
					<div style={{width: 18, height: 18, borderRadius: 9, background: '#E8C27A'}} />
				</div>
				<div style={{height: 234, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `rotateX(${virada * 80}deg)`, transformOrigin: '50% 0%'}}>
					{ano ? (
						<span style={{fontFamily: poppins, fontWeight: 900, fontSize: 96, background: OURO_TEXTO, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', transform: `scale(${0.6 + 0.4 * ka})`, display: 'inline-block', filter: 'drop-shadow(0 4px 0 #9a6a1c)'}}>1 ANO</span>
					) : (
						<span style={{fontFamily: poppins, fontWeight: 900, fontSize: 104, color: '#2a1352'}}>{MESES[i]}</span>
					)}
				</div>
			</div>
			<Pilula texto="NO TIKTOK SHOP" k={ka} y={560} tamanho={32} />
		</AbsoluteFill>
	);
};

// 15. Mentalidade expandida: esfera de luz presa numa caixa de vidro; ela cresce, a caixa se abre em quatro e voa, e
// quando tenta encolher bate e volta grande: "NÃO VOLTA / AO NORMAL" em texto 3D.
const v14Mente: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, entra, sai, d} = useCena(cena);
	const [emExpande = cena.de + 0.5, emTenta = cena.de + 2] = d.marcos ?? [];
	const linhas = d.linhas ?? [];
	const fe = q(emExpande);
	const ft = q(emTenta);
	const cresce = mola(frame, fe, fps, 9);
	const tenta = frame < ft ? 0 : Math.sin(Math.min(1, (frame - ft) / 14) * Math.PI) * 0.22;
	const raio = 0.75 + cresce * 1.05 - tenta;
	const abre = suave(interpolate(frame, [fe + 2, fe + 18], [0, 1], lim));
	const yC = wy(1130);
	const lado = 2.0;
	const paredes: {p: [number, number, number]; r: [number, number, number]; s: [number, number, number]; v: [number, number]}[] = [
		{p: [-lado / 2, yC, 0], r: [0, 0, 0], s: [0.06, lado, lado], v: [-1, 0.2]},
		{p: [lado / 2, yC, 0], r: [0, 0, 0], s: [0.06, lado, lado], v: [1, 0.2]},
		{p: [0, yC + lado / 2, 0], r: [0, 0, 0], s: [lado, 0.06, lado], v: [0, 1]},
		{p: [0, yC - lado / 2, 0], r: [0, 0, 0], s: [lado, 0.06, lado], v: [0, -1]},
	];
	return (
		<AbsoluteFill style={{opacity: entra * sai}}>
			<FundoMotion />
			<AbsoluteFill style={{background: `radial-gradient(circle at 50% ${(1130 / 1920) * 100}%, rgba(232,194,122,${0.15 + 0.3 * cresce}) 0%, rgba(150,90,220,0.12) ${25 + cresce * 15}%, rgba(0,0,0,0) 60%)`}} />
			<Canvas>
				<Luzes quadro={frame} batidas={[fe, ft, ...linhas.map((l) => q(l.em))]} />
				<pointLight position={[0, yC, 3]} intensity={20 + cresce * 40} distance={10} color="#ffd98a" />
				<mesh position={[0, yC, 0]} rotation={[frame * 0.02, frame * 0.03, 0]}>
					<icosahedronGeometry args={[raio, 6]} />
					<meshPhysicalMaterial color="#f2d08a" emissive="#b07a2a" emissiveIntensity={0.5 + cresce * 0.6} metalness={0.6} roughness={0.2} clearcoat={1} />
				</mesh>
				{paredes.map((w, i) => (
					<mesh key={i} position={[w.p[0] + w.v[0] * abre * 3.2, w.p[1] + w.v[1] * abre * 3.2, w.p[2] + abre * 2]} rotation={[abre * (i + 1) * 0.6, abre * (i % 2 ? 1 : -1) * 0.9, abre * 0.4]} material={matVidro}>
						<boxGeometry args={w.s} />
					</mesh>
				))}
				{linhas.map((l, i) => (
					<Linha3D key={i} texto={l.texto} metal={l.metal ?? (i ? 'branco' : 'ouro')} largura={Math.min(4.6, l.texto.length * 0.45)} y={wy(290 + i * 170)} quadro={frame} batida={q(l.em)} profundidade={0.4} />
				))}
			</Canvas>
		</AbsoluteFill>
	);
};

export const pecas: Pecas = {
	v14Pergunta,
	v14Contador,
	v14Pino,
	v14Degraus,
	v14Interroga,
	v14Pegadas,
	v14Rota,
	v14Tres,
	v14Caminho,
	v14Mentor,
	v14Termometro,
	v14Rede,
	v14Bateria,
	v14Calendario,
	v14Mente,
};
