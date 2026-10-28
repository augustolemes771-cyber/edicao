// Peças do tema Entrevista: drama com a luz caindo num foco frio ("nunca mais"), pílula LIVE que acende,
// contador em ouro 3D acima da cabeça e pílula de vidro com nome (SIGA <nome>). Paleta: roxo profundo, ouro, vidro.
import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {CenaNoPlano} from '../motor/plano';
import {gloock, inter, playfair} from '../motor/tema';

type De<T extends CenaNoPlano['tipo']> = Extract<CenaNoPlano, {tipo: T}>;
const lim = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ROXO = '#2b0f4c';
const OURO = '#f4c95d';

// Texto em ouro com volume: camada de trás extrudada em degraus e frente com gradiente metálico.
export const Ouro3D: React.FC<{texto: string; tamanho: number; fonte?: string; italico?: boolean; profundidade?: number}> = ({
	texto,
	tamanho,
	fonte = gloock,
	italico,
	profundidade = 0.09,
}) => {
	const passos = 12;
	texto = texto.replace(/ /g, ' ');
	const d = tamanho * profundidade;
	const extrusao = Array.from({length: passos}, (_, i) => {
		const k = (i + 1) / passos;
		const tom = Math.round(120 - 70 * k);
		return `0 ${(d * k).toFixed(1)}px 0 rgb(${tom + 40},${tom},${Math.round(tom * 0.25)})`;
	}).join(', ');
	const base: React.CSSProperties = {
		fontFamily: fonte,
		fontSize: tamanho,
		fontStyle: italico ? 'italic' : 'normal',
		fontWeight: 800,
		lineHeight: 1,
		whiteSpace: 'nowrap',
		letterSpacing: -tamanho * 0.01,
	};
	return (
		<span style={{position: 'relative', display: 'inline-block'}}>
			<span
				style={{
					...base,
					color: '#7a5418',
					textShadow: `${extrusao}, 0 ${d * 1.6}px ${d * 2.2}px rgba(0,0,0,0.75)`,
				}}
			>
				{texto}
			</span>
			<span
				style={{
					...base,
					position: 'absolute',
					left: 0,
					top: 0,
					backgroundImage: 'linear-gradient(180deg, #fff6d6 0%, #f7d77e 30%, #d9a63c 55%, #fbe7a6 72%, #b98322 100%)',
					WebkitBackgroundClip: 'text',
					backgroundClip: 'text',
					color: 'transparent',
				}}
			>
				{texto}
			</span>
		</span>
	);
};

// Pílula vermelha "● LIVE" do TikTok. desligada de 0 a 1: perde a cor e o ponto apaga.
const PilulaLive: React.FC<{texto: string; tamanho: number; desligada?: number; pulso: number}> = ({
	texto,
	tamanho,
	desligada = 0,
	pulso,
}) => {
	const cinza = desligada;
	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: tamanho * 0.32,
				padding: `${tamanho * 0.28}px ${tamanho * 0.62}px`,
				borderRadius: tamanho,
				background: `linear-gradient(180deg, rgb(${255 - 160 * cinza},${45 + 25 * cinza},${85 - 10 * cinza}), rgb(${220 - 150 * cinza},${20 + 45 * cinza},${60 - 5 * cinza}))`,
				boxShadow: `0 0 ${tamanho * 0.9 * (1 - cinza)}px rgba(255,45,85,${0.75 * (1 - cinza)}), 0 ${tamanho * 0.2}px ${tamanho * 0.5}px rgba(0,0,0,0.45)`,
				border: `${tamanho * 0.05}px solid rgba(255,255,255,${0.35 - 0.2 * cinza})`,
			}}
		>
			<div
				style={{
					width: tamanho * 0.42,
					height: tamanho * 0.42,
					borderRadius: '50%',
					background: cinza > 0.5 ? '#5a5a66' : '#ffffff',
					boxShadow: cinza > 0.5 ? 'none' : `0 0 ${tamanho * 0.4 * pulso}px #fff`,
				}}
			/>
			<span
				style={{
					fontFamily: inter,
					fontWeight: 800,
					fontSize: tamanho,
					letterSpacing: tamanho * 0.08,
					color: `rgba(255,255,255,${1 - 0.45 * cinza})`,
					lineHeight: 1,
				}}
			>
				{texto}
			</span>
		</div>
	);
};

// Palavra em bloco 3D branco com borda dourada (referência "NUNCA MAIS UMA"): frente branca, lateral ouro extrudada.
const Branco3D: React.FC<{texto: string; tamanho: number}> = ({texto, tamanho}) => {
	const passos = 14;
	const d = tamanho * 0.07;
	const lateral = Array.from({length: passos}, (_, i) => {
		const k = (i + 1) / passos;
		return `${(d * k * 0.35).toFixed(1)}px ${(d * k).toFixed(1)}px 0 rgb(${Math.round(215 - 60 * k)},${Math.round(165 - 60 * k)},${Math.round(80 - 40 * k)})`;
	}).join(', ');
	return (
		<span
			style={{
				fontFamily: inter,
				fontWeight: 900,
				fontSize: tamanho,
				lineHeight: 1,
				letterSpacing: -tamanho * 0.02,
				color: '#fffdf6',
				textShadow: `${lateral}, 0 ${d * 2}px ${d * 3}px rgba(0,0,0,0.8)`,
			}}
		>
			{texto}
		</span>
	);
};

// Drama da referência: tudo quase preto, um feixe diagonal de luz do topo cai no rosto; "NUNCA MAIS" em ouro chato
// e a palavra do tema em branco 3D enorme sobre o corpo, que treme e despenca no fim.
export const Drama: React.FC<{cena: De<'drama'>}> = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const t = frame / fps;
	const dur = cena.ate - cena.de;
	const batida = (cena.em ?? cena.de + dur * 0.35) - cena.de;
	const apaga = (cena.apaga ?? cena.de + dur * 0.75) - cena.de;
	const x = cena.x ?? 0.7;
	const y = cena.y ?? 0.33;

	const fb = frame - Math.round(batida * fps);
	const pisca = fb >= 0 && fb < 7 ? [0.3, 1, 0.45, 1, 0.7, 1, 0.9][fb] : 1;
	const escuro = interpolate(t, [0, 0.45], [0, 1], lim) * interpolate(t, [dur - 0.3, dur], [1, 0], lim);
	const luz = escuro * pisca * interpolate(t, [0.2, 0.7], [0.4, 1], lim);

	const yL1 = height * 0.47;
	const pb = spring({frame: fb, fps, config: {damping: 12, stiffness: 190}});
	const tremor = fb >= 0 && fb < 10 ? Math.sin(fb * 2.9) * 10 * Math.exp(-fb / 3) : 0;

	const fa = frame - Math.round(apaga * fps);
	const pa = spring({frame: fa, fps, config: {damping: 10, stiffness: 170}});
	const trem2 = fa >= 0 && fa < 12 ? Math.sin(fa * 3.1) * 14 * Math.exp(-fa / 4) : 0;
	const queda = Math.max(0, frame - Math.round((cena.ate - cena.de - 0.45) * fps));
	const caiY = 0.5 * 2600 * (queda / fps) ** 2;
	const tam1 = width * 0.105;
	const tam2 = width * 0.27;
	const polig = `${(x - 0.02) * 100},0 ${(x + 0.32) * 100},0 ${(x + 0.26) * 100},70 ${(x - 0.4) * 100},70`;

	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<svg width={width} height={height} viewBox="0 0 100 100" preserveAspectRatio="none" style={{position: 'absolute', inset: 0, opacity: escuro}}>
				<defs>
					<filter id="borraLuz" x="-30%" y="-30%" width="160%" height="160%">
						<feGaussianBlur stdDeviation="2.4" />
					</filter>
					<mask id="furoLuz" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
						<rect width="100" height="100" fill="#fff" />
						<polygon points={polig} fill="#000" filter="url(#borraLuz)" opacity={0.92 * pisca} />
					</mask>
					<linearGradient id="feixe" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" stopColor="#e6ecff" stopOpacity="0.5" />
						<stop offset="0.6" stopColor="#cfd8f5" stopOpacity="0.16" />
						<stop offset="1" stopColor="#cfd8f5" stopOpacity="0" />
					</linearGradient>
				</defs>
				<rect width="100" height="100" fill="#04040a" opacity="0.96" mask="url(#furoLuz)" />
				<polygon points={polig} fill="url(#feixe)" opacity={luz} filter="url(#borraLuz)" style={{mixBlendMode: 'screen'}} />
			</svg>
			{/* poeira no feixe */}
			<AbsoluteFill
				style={{
					opacity: 0.35 * luz,
					mixBlendMode: 'screen',
					backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 0 1px, transparent 1.6px)',
					backgroundSize: '46px 61px',
					backgroundPosition: `${frame * 0.4}px ${-frame * 0.6}px`,
					clipPath: `polygon(${(x - 0.02) * 100}% 0, ${(x + 0.32) * 100}% 0, ${(x + 0.26) * 100}% 70%, ${(x - 0.4) * 100}% 70%)`,
				}}
			/>
			{fb >= 0 && (
				<div
					style={{
						position: 'absolute',
						top: yL1,
						width: '100%',
						textAlign: 'center',
						fontFamily: inter,
						fontWeight: 900,
						fontSize: tam1,
						letterSpacing: tam1 * 0.04,
						lineHeight: 1,
						color: '#c8913a',
						textShadow: '0 1px 0 #e5b35a, 0 3px 0 #8a5f1e, 0 5px 0 #6e4a14, 0 8px 12px rgba(0,0,0,0.8)',
						opacity: Math.min(1, pb * 2),
						transform: `translate(${tremor}px, ${caiY * 0.6 + (1 - pb) * -50}px) scale(${1 + (1 - pb) * 0.5})`,
					}}
				>
					{cena.grande}
				</div>
			)}
			{fa >= 0 && cena.pequeno && (
				<div
					style={{
						position: 'absolute',
						top: yL1 + tam1 * 0.95,
						width: '100%',
						display: 'flex',
						justifyContent: 'center',
						perspective: 900,
						opacity: Math.min(1, pa * 2),
						filter: pa < 0.6 ? `blur(${(0.6 - pa) * 18}px)` : undefined,
					}}
				>
					<div style={{transform: `translate(${trem2}px, ${caiY + (1 - pa) * -90}px) rotate(${queda * 1.2}deg) scale(${1 + (1 - pa) * 1.1}) rotateX(10deg)`}}>
						<Branco3D texto={cena.pequeno} tamanho={tam2} />
					</div>
				</div>
			)}
		</AbsoluteFill>
	);
};

export const AoVivo: React.FC<{cena: De<'aovivo'>}> = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const p = spring({frame, fps, config: {damping: 10, stiffness: 160}});
	const clarao = interpolate(frame, [0, 3, 16], [0, 0.55, 0], lim);
	const onda = interpolate(frame, [0, 18], [0, 1], lim);
	const tam = width * 0.06;
	const y = height * (cena.y ?? 0.58);
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<AbsoluteFill
				style={{
					mixBlendMode: 'screen',
					opacity: clarao,
					background: `radial-gradient(circle at 50% ${(cena.y ?? 0.58) * 100}%, rgba(255,214,140,1) 0%, rgba(255,150,60,0.4) 35%, rgba(0,0,0,0) 70%)`,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					left: width / 2 - width * 0.2 * (0.4 + onda),
					top: y + tam * 0.75 - width * 0.2 * (0.4 + onda),
					width: width * 0.4 * (0.4 + onda),
					height: width * 0.4 * (0.4 + onda),
					borderRadius: '50%',
					border: `${width * 0.004}px solid rgba(255,90,120,${0.8 * (1 - onda)})`,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					top: y,
					width: '100%',
					display: 'flex',
					justifyContent: 'center',
					transform: `scale(${0.6 + 0.4 * p})`,
					opacity: Math.min(1, p * 2),
				}}
			>
				<PilulaLive texto={cena.texto ?? 'LIVE'} tamanho={tam} pulso={0.6 + 0.4 * Math.sin(frame * 0.5)} />
			</div>
		</AbsoluteFill>
	);
};

export const Contador: React.FC<{cena: De<'contador'>}> = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const em = Math.round(((cena.em ?? cena.de) - cena.de) * fps);
	const p = spring({frame, fps, config: {damping: 15}});
	const conta = interpolate(frame, [em, em + Math.round(fps * 0.8)], [0, 1], lim);
	const valor = Math.round(cena.valor * (1 - (1 - conta) ** 3));
	const pouso = spring({frame: frame - em - Math.round(fps * 0.8), fps, config: {damping: 9, stiffness: 200}});
	const tam = width * 0.15;
	const seta = interpolate(frame, [em + fps * 0.6, em + fps * 1.1], [0, 1], lim);
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<AbsoluteFill
				style={{
					mixBlendMode: 'screen',
					opacity: 0.55 * p,
					background: `radial-gradient(ellipse 45% 12% at 50% ${((cena.yTexto ?? 0.15) + 0.05) * 100}%, rgba(255,200,90,0.55), rgba(0,0,0,0) 70%)`,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					top: height * (cena.yTexto ?? 0.15),
					width: '100%',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					opacity: Math.min(1, p * 1.5),
					transform: `translateY(${(1 - p) * 40}px)`,
					perspective: 900,
				}}
			>
				<div
					style={{
						fontFamily: inter,
						fontWeight: 800,
						fontSize: width * 0.042,
						letterSpacing: width * 0.02,
						color: OURO,
						textShadow: '0 2px 10px rgba(0,0,0,0.7)',
						marginBottom: width * 0.008,
					}}
				>
					{cena.rotulo}
				</div>
				<div
					style={{
						display: 'flex',
						alignItems: 'baseline',
						gap: width * 0.018,
						transform: `rotateX(14deg) scale(${1 + 0.08 * Math.sin(Math.min(1, pouso) * Math.PI)})`,
					}}
				>
					{cena.prefixo && <Ouro3D texto={cena.prefixo} tamanho={tam * 0.42} fonte={playfair} italico />}
					<Ouro3D texto={String(valor)} tamanho={tam} fonte={playfair} />
					{cena.sufixo && <Ouro3D texto={cena.sufixo} tamanho={tam * 0.42} fonte={playfair} />}
					<svg
						width={tam * 0.42}
						height={tam * 0.6}
						viewBox="0 0 40 60"
						style={{opacity: seta, transform: `translateY(${(1 - seta) * 20}px)`, overflow: 'visible'}}
					>
						<defs>
							<linearGradient id="setaOuro" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0" stopColor="#fff2c4" />
								<stop offset="1" stopColor="#c48a26" />
							</linearGradient>
						</defs>
						<path d="M20 0 L40 26 L28 26 L28 60 L12 60 L12 26 L0 26 Z" fill="url(#setaOuro)" stroke="#7a5418" strokeWidth={2} />
					</svg>
				</div>
			</div>
		</AbsoluteFill>
	);
};

export const Pilula: React.FC<{cena: De<'pilula'>}> = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const p = spring({frame, fps, config: {damping: 16, stiffness: 150}});
	const brilhoX = interpolate(frame, [6, 22], [-30, 130], lim);
	const tam = width * 0.05;
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<div
				style={{
					position: 'absolute',
					top: height * (cena.y ?? 0.57),
					width: '100%',
					display: 'flex',
					justifyContent: 'center',
					opacity: Math.min(1, p * 1.6),
					filter: p < 0.7 ? `blur(${(0.7 - p) * 14}px)` : undefined,
					transform: `translateY(${(1 - p) * 26}px) scale(${0.92 + 0.08 * p})`,
				}}
			>
				<div
					style={{
						position: 'relative',
						overflow: 'hidden',
						display: 'flex',
						alignItems: 'baseline',
						gap: tam * 0.4,
						padding: `${tam * 0.32}px ${tam * 0.7}px`,
						borderRadius: tam,
						background: 'rgba(36,14,64,0.86)',
						border: `${tam * 0.04}px solid rgba(244,201,93,0.65)`,
						boxShadow: '0 12px 34px rgba(10,2,24,0.5)',
					}}
				>
					<span style={{fontFamily: inter, fontWeight: 800, fontSize: tam * 0.62, letterSpacing: tam * 0.08, color: '#fff'}}>
						{cena.rotulo.toUpperCase()}
					</span>
					<span style={{fontFamily: playfair, fontWeight: 800, fontStyle: 'italic', fontSize: tam * 1.05, color: OURO, lineHeight: 1}}>
						{cena.nome}
					</span>
					<div
						style={{
							position: 'absolute',
							top: 0,
							bottom: 0,
							left: `${brilhoX}%`,
							width: '22%',
							background: 'linear-gradient(100deg, rgba(255,255,255,0), rgba(255,240,200,0.35), rgba(255,255,255,0))',
						}}
					/>
				</div>
			</div>
		</AbsoluteFill>
	);
};

export const coresEntrevista = {ROXO, OURO};
