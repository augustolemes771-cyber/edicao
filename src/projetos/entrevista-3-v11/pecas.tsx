// Peças (efeitos) exclusivas do entrevista-3-v11, usadas no edit.ts com {tipo: 'peca', nome: '<chave>', dados: {...}}.
// Prefixe as chaves com v11 (ex.: v11Gancho): o registro junta as peças de todos os projetos.
// v11Gancho: a perda no trade. Painel de gráfico de trade acima da cabeça: a linha despenca em vermelho, o contador desce até
//   -R$ 160 MIL e trava com tremor, notas 3D caem e se apagam; em "hoje" a linha vira ouro e sobe, e o painel troca para
//   TIKTOK SHOP com o chip LIVE acendendo.
// v11Codigo: meia tela do "código pro iniciante": teclado de cofre em perspectiva sobre véu roxo com grade reta; as teclas
//   acendem no ritmo da fala, o visor enche de pontos, o cadeado abre em "iniciante" e o visor fica dourado.
// v11Celular: celular 3D que sobe ao lado do convidado em "pegar um celular", girando para mostrar a tela da live.
import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import type {Pecas} from '../../pecas/peca';
import {GradeReta} from '../../pecas/FundoMotion';
import {Linha3D, Luzes} from '../../pecas/tres/Texto3D';
import {Notas} from '../../pecas/tres/Objetos3D';
import {CelularReal} from '../../pecas/tres/ObjetosPista';
import {playfair, poppins} from '../../motor/tema';

const lim = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const GL = {alpha: true, antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05};
const CAMERA = {fov: 35, position: [0, 0, 14.5] as [number, number, number], near: 0.1, far: 60};
const OURO = '#E8C27A';
const OURO_TEXTO = 'linear-gradient(180deg,#FFF1C9 0%,#F2D08A 40%,#E8C27A 65%,#C9974A 100%)';
const VERMELHO = '#ff3b4e';
const num = (v: unknown, padrao = 0) => (typeof v === 'number' ? v : padrao);
// px (quadro 1080x1920) → unidade do mundo na câmera acima (meia altura visível ~4,57).
const MEIA = 14.5 * Math.tan((35 / 2) * (Math.PI / 180));
const yMundo = (px: number) => ((960 - px) / 960) * MEIA;
const xMundo = (px: number) => ((px - 540) / 960) * MEIA;

// Série de preços fixa (sem aleatório por quadro): sobe um pouco e despenca.
const QUEDA = [0.18, 0.22, 0.16, 0.26, 0.2, 0.3, 0.27, 0.42, 0.38, 0.55, 0.5, 0.68, 0.64, 0.8, 0.86, 0.93];
const SUBIDA = [0.93, 0.88, 0.9, 0.78, 0.8, 0.66, 0.7, 0.54, 0.58, 0.42, 0.45, 0.3, 0.26, 0.16, 0.12, 0.06];

const V11Gancho: React.FC<{cena: {de: number; ate: number; dados?: Record<string, unknown>}}> = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const d = cena.dados ?? {};
	const t = frame / fps;
	const rel = (x: number) => x - cena.de;
	const tNum = rel(num(d.numero, cena.de + 0.6));
	const tVirada = rel(num(d.virada, cena.de + 2.3));
	const tLive = rel(num(d.live, cena.de + 4));
	const dur = cena.ate - cena.de;
	const entra = interpolate(t, [0, 0.25], [0, 1], lim);
	const sai = interpolate(t, [dur - 0.25, dur], [1, 0], lim);
	// Contador com ease-out: saltos grandes que desaceleram e travam logo depois de ele dizer "160".
	const trava = tNum + 0.35;
	const pc = interpolate(t, [0.1, trava], [0, 1], lim);
	const valor = Math.round(160 * (1 - (1 - pc) ** 3));
	const travou = t >= trava;
	const tremor = travou ? Math.exp(-(t - trava) * 9) * Math.sin((t - trava) * 70) * 10 : 0;
	const virou = interpolate(t, [tVirada, tVirada + 0.35], [0, 1], lim);
	// Desenho da linha: a queda até travar; depois da virada, a subida em ouro.
	const desenhaQueda = interpolate(t, [0.1, trava], [0, 1], lim);
	const desenhaSubida = interpolate(t, [tVirada + 0.1, tVirada + 1.1], [0, 1], lim);
	const chip = spring({frame: frame - Math.round(tLive * fps), fps, config: {damping: 12, stiffness: 160}});
	const W = 900;
	const H = 300;
	const pontos = (serie: number[]) => serie.map((v, i) => `${(i / (serie.length - 1)) * W},${v * H}`).join(' ');
	const comp = 2.2 * W;
	const clarao = travou ? Math.exp(-(t - trava) * 8) : 0;
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: entra * sai}}>
			{/* Faixa escura no topo: vermelho na perda, roxo do tema depois da virada. */}
			<AbsoluteFill style={{background: `linear-gradient(180deg, rgba(${Math.round(70 - 40 * virou)},${Math.round(8 + 7 * virou)},${Math.round(22 + 36 * virou)},0.9) 0%, rgba(30,15,58,0.55) 36%, rgba(30,15,58,0) 52%)`}} />
			<AbsoluteFill style={{background: `rgba(255,59,78,${0.28 * clarao})`}} />
			<div style={{position: 'absolute', left: (width - W) / 2 - 30, top: 150, width: W + 60, transform: `translateX(${tremor}px)`}}>
				{/* Cabeçalho do painel: ativo e variação. */}
				<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: poppins, fontWeight: 800, letterSpacing: '0.18em', fontSize: 30, color: '#fff', padding: '0 30px', height: 54}}>
					<span style={{opacity: 1 - virou}}>TRADE</span>
					<span style={{position: 'absolute', left: 30, opacity: virou, background: OURO_TEXTO, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}}>HOJE · TIKTOK SHOP</span>
					<span style={{color: virou > 0.5 ? OURO : VERMELHO, opacity: travou || virou > 0 ? 1 : 0.6}}>{virou > 0.5 ? '▲ AO VIVO' : `▼ ${Math.round(87 * pc)}%`}</span>
				</div>
				<svg width={W + 60} height={H + 40} style={{display: 'block'}}>
					<defs>
						<linearGradient id="v11Queda" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0" stopColor={VERMELHO} stopOpacity={0.35} />
							<stop offset="1" stopColor={VERMELHO} stopOpacity={0} />
						</linearGradient>
					</defs>
					<g transform="translate(30,20)">
						{[0, 1, 2, 3].map((i) => (
							<line key={i} x1={0} x2={W} y1={(i * H) / 3} y2={(i * H) / 3} stroke="rgba(255,255,255,0.12)" strokeWidth={2} />
						))}
						{/* Velas da queda (vermelhas), entram junto com a linha. */}
						{QUEDA.map((v, i) => {
							const x = (i / (QUEDA.length - 1)) * W;
							const vis = desenhaQueda * QUEDA.length > i ? 1 - virou * 0.75 : 0;
							const alto = 26 + ((i * 37) % 30);
							return <rect key={i} x={x - 9} y={v * H - alto / 2} width={18} height={alto} rx={3} fill={VERMELHO} opacity={0.55 * vis} />;
						})}
						<polygon points={`0,${H} ${pontos(QUEDA)} ${W},${H}`} fill="url(#v11Queda)" opacity={desenhaQueda * (1 - virou)} />
						<polyline points={pontos(QUEDA)} fill="none" stroke={VERMELHO} strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={comp} strokeDashoffset={comp * (1 - desenhaQueda)} opacity={1 - virou * 0.8} style={{filter: `drop-shadow(0 0 ${10 + 20 * clarao}px rgba(255,59,78,0.8))`}} />
						<polyline points={pontos(SUBIDA)} fill="none" stroke={OURO} strokeWidth={9} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={comp} strokeDashoffset={comp * (1 - desenhaSubida)} style={{filter: 'drop-shadow(0 0 16px rgba(232,194,122,0.85))'}} />
					</g>
				</svg>
			</div>
			{/* Contador da perda: desce rápido e trava; some na virada. */}
			<div style={{position: 'absolute', top: 360, width: '100%', textAlign: 'center', opacity: 1 - virou, transform: `translateX(${tremor * 1.4}px) scale(${1 + 0.12 * clarao})`}}>
				<span style={{fontFamily: poppins, fontWeight: 900, fontSize: 132, letterSpacing: '-0.02em', color: '#fff', textShadow: `0 0 ${24 + 40 * clarao}px rgba(255,59,78,0.95), 0 10px 30px rgba(20,0,8,0.7)`, WebkitTextStroke: `3px ${VERMELHO}`}}>
					-R$ {valor} MIL
				</span>
			</div>
			<div style={{position: 'absolute', top: 540, width: '100%', textAlign: 'center', opacity: interpolate(t, [trava, trava + 0.2], [0, 1], lim) * (1 - virou)}}>
				<span style={{fontFamily: playfair, fontStyle: 'italic', fontWeight: 800, fontSize: 64, color: '#ffd9dd', textShadow: '0 4px 16px rgba(20,0,8,0.8)'}}>perdidos no trade</span>
			</div>
			{/* Chip LIVE que acende quando ele diz "live". */}
			<div style={{position: 'absolute', top: 400, width: '100%', display: 'flex', justifyContent: 'center', opacity: virou}}>
				<div style={{transform: `scale(${0.6 + 0.4 * chip})`, opacity: chip, display: 'flex', alignItems: 'center', gap: 16, padding: '16px 34px', borderRadius: 999, background: 'linear-gradient(180deg, rgba(46,24,86,0.85), rgba(30,15,58,0.85))', boxShadow: `inset 0 0 0 2px rgba(232,194,122,0.8), 0 0 40px rgba(232,194,122,${0.45 * chip})`}}>
					<span style={{width: 22, height: 22, borderRadius: 11, background: VERMELHO, boxShadow: `0 0 ${12 + 8 * Math.sin(t * 8)}px ${VERMELHO}`}} />
					<span style={{fontFamily: poppins, fontWeight: 900, fontSize: 54, letterSpacing: '0.12em', color: '#fff'}}>LIVE</span>
				</div>
			</div>
			{/* Notas 3D que caem girando e se apagam depois de travar. */}
			<AbsoluteFill style={{opacity: interpolate(t, [trava, trava + 0.15, tVirada - 0.1, tVirada + 0.2], [0, 1, 1, 0], lim)}}>
				<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
					<ambientLight intensity={0.9} />
					<directionalLight position={[-4, 6, 10]} intensity={2.2} />
					{[-3.2, -1.1, 1.3, 3.3].map((x, i) => {
						const l = Math.max(0, t - trava - i * 0.07);
						return (
							<group key={i} position={[x, yMundo(520) - l * l * 4.5 - l * 1.2, 1]} rotation={[0.6 + l * (2 + i), l * (1.5 - i * 0.6), 0.3 * (i - 1.5) + l]} scale={0.55}>
								<Notas />
							</group>
						);
					})}
				</ThreeCanvas>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

const TECLAS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', ''];
const ORDEM = [4, 0, 7, 2, 10, 5];

const V11Codigo: React.FC<{cena: {de: number; ate: number; dados?: Record<string, unknown>}}> = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const d = cena.dados ?? {};
	const t = frame / fps;
	const rel = (x: number) => x - cena.de;
	const tCodigo = rel(num(d.codigo, cena.de + 0.3));
	const tAbre = rel(num(d.iniciante, cena.de + 1.8));
	const dur = cena.ate - cena.de;
	const entra = spring({frame, fps, config: {damping: 16, stiffness: 120}});
	const sai = interpolate(t, [dur - 0.25, dur], [1, 0], lim);
	// Teclas apertadas entre "código" e "iniciante", uma a cada intervalo igual.
	const passo = Math.max(0.12, (tAbre - tCodigo) / ORDEM.length);
	const apertadas = Math.max(0, Math.min(ORDEM.length, Math.floor((t - tCodigo) / passo) + 1));
	const abre = spring({frame: frame - Math.round(tAbre * fps), fps, config: {damping: 11, stiffness: 140}});
	const ouro = interpolate(t, [tAbre, tAbre + 0.25], [0, 1], lim);
	const texto = interpolate(t, [tAbre + 0.1, tAbre + 0.4], [0, 1], lim);
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: sai}}>
			<AbsoluteFill style={{opacity: entra, background: 'linear-gradient(180deg, rgba(30,15,58,0) 44%, rgba(30,15,58,0.5) 52%, rgba(24,11,48,0.66) 100%)'}} />
			<AbsoluteFill style={{opacity: entra}}>
				<GradeReta topo={0.5} />
			</AbsoluteFill>
			{/* Título: O CÓDIGO pro iniciante */}
			<div style={{position: 'absolute', top: 1000, width: '100%', textAlign: 'center', opacity: entra}}>
				<span style={{fontFamily: poppins, fontWeight: 900, fontSize: 70, letterSpacing: '0.06em', color: '#fff', textShadow: '0 6px 20px rgba(12,4,28,0.6)'}}>O CÓDIGO</span>
			</div>
			<div style={{position: 'absolute', top: 1085, width: '100%', textAlign: 'center', opacity: texto, transform: `translateY(${(1 - texto) * 20}px)`}}>
				<span style={{fontFamily: playfair, fontStyle: 'italic', fontWeight: 800, fontSize: 76, background: OURO_TEXTO, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 0 16px rgba(232,194,122,0.45))'}}>pro iniciante</span>
			</div>
			{/* Teclado de cofre em perspectiva. */}
			<div style={{position: 'absolute', left: 0, right: 0, top: 1210, display: 'flex', justifyContent: 'center', perspective: 1100}}>
				<div style={{transform: `rotateX(${24 - 6 * entra}deg) translateY(${(1 - entra) * 160}px)`, transformStyle: 'preserve-3d', width: 640, padding: 30, borderRadius: 40, background: 'linear-gradient(170deg, #2e1a55 0%, #170b31 100%)', boxShadow: `inset 0 0 0 2px rgba(232,194,122,${0.35 + 0.5 * ouro}), 0 40px 70px rgba(6,2,16,0.7), 0 0 ${60 * ouro}px rgba(232,194,122,0.4)`}}>
					{/* Visor: pontos do código e o cadeado. */}
					<div style={{height: 92, borderRadius: 22, marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, background: ouro > 0.5 ? 'linear-gradient(180deg,#3a2a10,#221606)' : '#0c0618', boxShadow: `inset 0 0 0 2px ${ouro > 0.5 ? OURO : 'rgba(255,255,255,0.12)'}`}}>
						<svg width={44} height={56} viewBox="0 0 44 56">
							<path d={`M10 ${24 - 10 * abre} V16 a12 12 0 0 1 24 0 V24`} fill="none" stroke={ouro > 0.5 ? OURO : '#cfc6e6'} strokeWidth={5} strokeLinecap="round" transform={`rotate(${-28 * abre} 34 24)`} />
							<rect x={4} y={24} width={36} height={28} rx={6} fill={ouro > 0.5 ? OURO : '#cfc6e6'} />
						</svg>
						{ORDEM.map((_, i) => (
							<span key={i} style={{width: 22, height: 22, borderRadius: 11, background: i < apertadas ? (ouro > 0.5 ? OURO : '#fff') : 'rgba(255,255,255,0.15)', boxShadow: i < apertadas ? `0 0 12px ${ouro > 0.5 ? OURO : 'rgba(255,255,255,0.7)'}` : 'none'}} />
						))}
					</div>
					<div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16}}>
						{TECLAS.map((k, i) => {
							const vez = ORDEM.indexOf(i);
							const tAperta = tCodigo + vez * passo;
							const aceso = vez >= 0 && t >= tAperta ? Math.exp(-(t - tAperta) * 5) : 0;
							return (
								<div key={i} style={{height: 92, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: k ? 1 : 0, fontFamily: poppins, fontWeight: 800, fontSize: 44, color: aceso > 0.3 ? '#1E0F3A' : '#fff', background: aceso > 0.05 ? `rgba(232,194,122,${0.25 + 0.75 * aceso})` : 'rgba(255,255,255,0.07)', boxShadow: `inset 0 -6px 0 rgba(0,0,0,0.35), 0 0 ${30 * aceso}px rgba(232,194,122,0.8)`, transform: `translateY(${aceso * 5}px)`}}>
									{k}
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};

const V11Celular: React.FC<{cena: {de: number; ate: number; dados?: Record<string, unknown>}}> = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const t = frame / fps;
	const dur = cena.ate - cena.de;
	const sobe = spring({frame, fps, config: {damping: 13, stiffness: 110, mass: 0.9}});
	const sai = interpolate(t, [dur - 0.2, dur], [1, 0], lim);
	const x = num(cena.dados?.x, 790);
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: sai}}>
			<AbsoluteFill style={{background: `radial-gradient(ellipse 26% 18% at ${(x / width) * 100}% 47%, rgba(232,194,122,${0.32 * sobe}) 0%, rgba(150,90,220,${0.18 * sobe}) 50%, rgba(0,0,0,0) 100%)`}} />
			<AbsoluteFill style={{filter: 'drop-shadow(0 24px 30px rgba(8,2,20,0.65))'}}>
				<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
					<Luzes quadro={frame} batidas={[4]} />
					<group position={[xMundo(x), yMundo(900) - (1 - sobe) * 6, 1.5]} rotation={[0.12, -0.9 + 0.9 * sobe + Math.sin(t * 1.8) * 0.18, -0.12 + 0.06 * Math.sin(t * 1.3)]} scale={0.95}>
						<CelularReal segundos={t} />
					</group>
				</ThreeCanvas>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

// Título 3D curto acima da cabeça, em ouro, para frases de virada (ex.: "SEMPRE DEU CERTO").
const V11Titulo: React.FC<{cena: {de: number; ate: number; dados?: Record<string, unknown>}}> = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const dur = Math.round((cena.ate - cena.de) * fps);
	const texto = String(cena.dados?.texto ?? '');
	const sai = interpolate(frame, [dur - 6, dur], [1, 0], lim);
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: sai}}>
			<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(30,15,58,0.8) 0%, rgba(30,15,58,0.4) 26%, rgba(30,15,58,0) 40%)', opacity: interpolate(frame, [0, 6], [0, 1], lim)}} />
			<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
				<Luzes quadro={frame} batidas={[2]} />
				<Linha3D texto={texto} metal="ouro" largura={Math.min(5.2, texto.length * 0.36)} y={yMundo(330)} quadro={frame} batida={2} profundidade={0.5} />
			</ThreeCanvas>
		</AbsoluteFill>
	);
};

export const pecas: Pecas = {
	v11Gancho: V11Gancho,
	v11Codigo: V11Codigo,
	v11Celular: V11Celular,
	v11Titulo: V11Titulo,
};
