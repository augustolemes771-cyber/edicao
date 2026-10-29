// Motion de tela cheia "antes × agora" (pedido do usuário, 28/10/2026, depoimento-2): fundo roxo do tema com chão e teto de
// grade em perspectiva que avançam para a câmera, horizonte dourado aceso e poeira de ouro subindo. Dois cartões de vidro
// sobem da grade, cada um na hora da sua palavra (ANTES à esquerda, AGORA à direita, levemente virados para o centro), com
// valor ou "?" em Playfair dourado; uma seta dourada se desenha de um para o outro quando o segundo chega. Na saída a câmera
// mergulha no cartão da direita (a resposta vem a seguir no vídeo). Faz o papel da legenda.
// titulo: linhas de texto 3D de verdade (letras extrudadas em ouro e branco metálico, mola, onda e faíscas) no topo,
// cada uma batendo no seu tempo (ex.: COMO ERA / SUA VIDA?).
import React from 'react';
import {AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {CenaNoPlano} from '../motor/plano';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {playfair, poppins} from '../motor/tema';
import {Faiscas, Linha3D, Luzes, Onda} from './tres/Texto3D';

type Cena = Extract<CenaNoPlano, {tipo: 'gradeAntesDepois'}>;
const lim = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const OURO = '#E8C27A';
const OURO_TEXTO = 'linear-gradient(180deg,#FFF1C9 0%,#F2D08A 40%,#E8C27A 65%,#C9974A 100%)';

// Plano de grade em perspectiva; teto = espelhado (também usado no presoClt e nas cartas). desloca: avanço das linhas em px.
export const Plano: React.FC<{teto?: boolean; desloca: number; abre: number}> = ({teto, desloca, abre}) => {
	const {width, height} = useVideoConfig();
	const cel = 120;
	return (
		<div
			style={{
				position: 'absolute',
				left: -width,
				width: width * 3,
				height: height * 1.2,
				top: teto ? -height * 1.2 + height * 0.36 : height * 0.64,
				transformOrigin: teto ? '50% 100%' : '50% 0%',
				transform: `rotateX(${(teto ? -1 : 1) * (90 - 18 * abre)}deg)`,
				backgroundImage: `linear-gradient(rgba(232,194,122,0.55) 2px, transparent 2px), linear-gradient(90deg, rgba(190,150,255,0.45) 2px, transparent 2px)`,
				backgroundSize: `${cel}px ${cel}px`,
				backgroundPosition: `50% ${teto ? -desloca : desloca}px`,
				WebkitMaskImage: `linear-gradient(${teto ? '0deg' : '180deg'}, rgba(0,0,0,0) 0%, #000 22%, #000 70%, rgba(0,0,0,0.2) 100%)`,
				maskImage: `linear-gradient(${teto ? '0deg' : '180deg'}, rgba(0,0,0,0) 0%, #000 22%, #000 70%, rgba(0,0,0,0.2) 100%)`,
				opacity: teto ? 0.45 : 0.9,
			}}
		/>
	);
};

const Cartao: React.FC<{lado: -1 | 1; rotulo: string; valor?: string; entra: number; destaque?: boolean}> = ({lado, rotulo, valor, entra, destaque}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const p = spring({frame: frame - entra, fps, config: {damping: 13, stiffness: 120, mass: 0.9}});
	const brilho = interpolate(frame - entra, [0, 6, 22], [0, 1, 0.25], lim);
	const respira = 1 + Math.sin((frame - entra) / 9) * 0.035;
	const texto = valor ?? '?';
	return (
		<div
			style={{
				position: 'absolute',
				left: 540 + lado * 228 - 200,
				top: 760,
				width: 400,
				height: 520,
				opacity: interpolate(frame - entra, [0, 5], [0, 1], lim),
				transform: `translateY(${(1 - p) * 420}px) translateZ(${(1 - p) * -300}px) rotateY(${-lado * 16}deg) rotateX(${(1 - p) * 40}deg)`,
				transformStyle: 'preserve-3d',
			}}
		>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					borderRadius: 34,
					background: destaque
						? 'linear-gradient(160deg, rgba(92,52,160,0.92) 0%, rgba(40,20,78,0.92) 100%)'
						: 'linear-gradient(160deg, rgba(58,34,100,0.86) 0%, rgba(26,13,52,0.9) 100%)',
					boxShadow: `inset 0 0 0 2.5px rgba(232,194,122,${0.45 + brilho * 0.55}), 0 40px 70px rgba(6,2,16,0.65), 0 0 ${60 * brilho}px rgba(232,194,122,${0.5 * brilho})`,
					overflow: 'hidden',
				}}
			>
				{/* Reflexo que atravessa o vidro na chegada. */}
				<div
					style={{
						position: 'absolute',
						top: -200,
						bottom: -200,
						width: 120,
						left: interpolate(frame - entra, [2, 20], [-200, 560], lim),
						transform: 'rotate(18deg)',
						background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,245,220,0.35) 50%, rgba(255,255,255,0) 100%)',
					}}
				/>
				{/* Mini grade dentro do cartão. */}
				<div
					style={{
						position: 'absolute',
						inset: 0,
						backgroundImage: 'linear-gradient(rgba(232,194,122,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(232,194,122,0.12) 1px, transparent 1px)',
						backgroundSize: '40px 40px',
					}}
				/>
			</div>
			<div style={{position: 'absolute', top: 54, width: '100%', textAlign: 'center'}}>
				<span style={{fontFamily: poppins, fontWeight: 900, fontSize: 64, letterSpacing: '0.12em', marginRight: '-0.12em', color: '#fff', textShadow: '0 6px 18px rgba(8,2,20,0.6)'}}>
					{rotulo}
				</span>
			</div>
			<div style={{position: 'absolute', top: 140, left: 70, right: 70, height: 3, background: `linear-gradient(90deg, transparent, ${OURO}, transparent)`, opacity: 0.8}} />
			<div style={{position: 'absolute', top: valor ? 230 : 170, width: '100%', textAlign: 'center', transform: `scale(${respira})`}}>
				<span
					style={{
						fontFamily: playfair,
						fontStyle: 'italic',
						fontWeight: 800,
						fontSize: valor ? 96 : 250,
						lineHeight: 1.1,
						padding: '0 0.08em',
						background: OURO_TEXTO,
						WebkitBackgroundClip: 'text',
						backgroundClip: 'text',
						color: 'transparent',
						filter: 'drop-shadow(0 10px 16px rgba(8,2,20,0.65))',
					}}
				>
					{texto}
				</span>
			</div>
		</div>
	);
};

// Câmera fov 35 a 14,5: meia altura visível ~4,57 unidades; px do quadro 1080x1920 → mundo.
const Titulo3D: React.FC<{linhas: {texto: string; em: number}[]; de: number}> = ({linhas, de}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const meia = 14.5 * Math.tan((35 / 2) * (Math.PI / 180));
	const yMundo = (px: number) => ((height / 2 - px) / (height / 2)) * meia;
	const batidas = linhas.map((l) => Math.round(Math.max(0, l.em - de) * fps));
	return (
		<AbsoluteFill style={{filter: 'drop-shadow(0 20px 26px rgba(8,2,20,0.7))'}}>
			<ThreeCanvas
				width={width}
				height={height}
				gl={{alpha: true, antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05}}
				camera={{fov: 35, position: [0, 0, 14.5], near: 0.1, far: 60}}
				style={{position: 'absolute', inset: 0}}
			>
				<Luzes quadro={frame} batidas={batidas} />
				{linhas.map((l, i) => {
					const y = yMundo(330 + i * 175);
					const ultima = i === linhas.length - 1;
					return (
						<React.Fragment key={i}>
							<Linha3D texto={l.texto} metal={ultima ? 'ouro' : 'branco'} largura={ultima ? 4.6 : 3.6} y={y} quadro={frame} batida={batidas[i]} profundidade={0.3} />
							<Onda quadro={frame} inicio={batidas[i]} y={y} cor="#ffd27a" tamanho={2.4} />
							<Faiscas quadro={frame} inicio={batidas[i]} y={y} cor="#ffd27a" largura={4} />
						</React.Fragment>
					);
				})}
			</ThreeCanvas>
		</AbsoluteFill>
	);
};

export const GradeAntesDepois: React.FC<{cena: Cena}> = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const t = frame / fps;
	const fim = Math.round((cena.ate - cena.de) * fps);
	const emA = Math.round(Math.max(0, cena.antes.em - cena.de) * fps);
	const emB = Math.round(Math.max(emA + 6, (cena.depois.em - cena.de) * fps));
	const abre = spring({frame, fps, config: {damping: 16, stiffness: 70}});
	const entrada = interpolate(frame, [0, 6], [0, 1], lim);
	// Saída: mergulho no cartão da direita.
	const mergulho = interpolate(frame, [fim - 9, fim], [0, 1], {...lim, easing: (x) => x * x});
	const seta = interpolate(frame, [emB + 4, emB + 16], [0, 1], lim);
	const horizonte = 0.85 + Math.sin(t * 2.6) * 0.15;
	return (
		<AbsoluteFill style={{opacity: entrada * (1 - mergulho * 0.9), overflow: 'hidden'}}>
			<AbsoluteFill
				style={{
					transform: `scale(${1 + mergulho * 2.2})`,
					transformOrigin: `${50 + 21}% 54%`,
					filter: mergulho > 0 ? `blur(${mergulho * 8}px)` : undefined,
				}}
			>
				<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, #3d1f74 0%, #1E0F3A 50%, #0b051c 100%)'}} />
				{/* Brilho do horizonte. */}
				<AbsoluteFill
					style={{
						background: `radial-gradient(ellipse 80% 12% at 50% 50%, rgba(232,194,122,${0.38 * horizonte}) 0%, rgba(150,90,220,0.18) 45%, rgba(0,0,0,0) 80%)`,
					}}
				/>
				<div style={{position: 'absolute', top: height * 0.5 - 1, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent 5%, ${OURO} 50%, transparent 95%)`, opacity: 0.75 * horizonte}} />
				<AbsoluteFill style={{perspective: 900, perspectiveOrigin: '50% 50%'}}>
					<Plano desloca={t * 260} abre={abre} />
					<Plano teto desloca={t * 260} abre={abre} />
				</AbsoluteFill>
				{/* Poeira de ouro subindo. */}
				{Array.from({length: 40}, (_, i) => {
					const x = random(`gx${i}`) * width;
					const y = (random(`gy${i}`) * height - t * (60 + 90 * random(`gv${i}`)) + height * 2) % height;
					const s = 2 + 4 * random(`gs${i}`);
					return <div key={i} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: s, background: OURO, opacity: 0.2 + 0.5 * random(`go${i}`), boxShadow: `0 0 ${s * 3}px ${OURO}`}} />;
				})}
				<AbsoluteFill style={{perspective: 1400, perspectiveOrigin: '50% 45%'}}>
					<Cartao lado={-1} rotulo={cena.antes.texto} valor={cena.antes.valor} entra={emA} />
					<Cartao lado={1} rotulo={cena.depois.texto} valor={cena.depois.valor} entra={emB} destaque />
				</AbsoluteFill>
				{cena.titulo?.length ? <Titulo3D linhas={cena.titulo} de={cena.de} /> : null}
				{/* Seta dourada do antes para o agora, acima dos cartões. */}
				<svg width={width} height={height} style={{position: 'absolute', inset: 0}}>
					<defs>
						<linearGradient id="setaAD" x1="0" y1="0" x2="1" y2="0">
							<stop offset="0" stopColor="#B9852F" />
							<stop offset="0.6" stopColor="#E8C27A" />
							<stop offset="1" stopColor="#FFF1C9" />
						</linearGradient>
					</defs>
					<path d="M 330 690 Q 540 560 750 690" fill="none" stroke="url(#setaAD)" strokeWidth={9} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - seta} />
					<path d="M 712 652 L 752 692 L 700 706" fill="none" stroke="#FFF1C9" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" opacity={interpolate(seta, [0.85, 1], [0, 1], lim)} />
				</svg>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
