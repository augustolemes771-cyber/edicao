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

export const Drama: React.FC<{cena: De<'drama'>}> = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const t = frame / fps;
	const dur = cena.ate - cena.de;
	const batida = (cena.em ?? cena.de + dur * 0.35) - cena.de;
	const apaga = (cena.apaga ?? cena.de + dur * 0.75) - cena.de;
	const x = cena.x ?? 0.7;
	const y = cena.y ?? 0.33;

	// Luz: cai devagar, pisca na batida e fica no foco; volta no fim.
	const fb = frame - Math.round(batida * fps);
	const pisca = fb >= 0 && fb < 7 ? [0.25, 1, 0.4, 1, 0.65, 1, 0.9][fb] : 1;
	const nivel = interpolate(t, [0, 0.5, batida - 0.05, batida + 0.25], [0, 0.55, 0.62, 0.92], lim);
	const volta = interpolate(t, [dur - 0.3, dur], [1, 0], lim);
	const escuro = nivel * volta * (fb >= 0 && fb < 7 ? pisca : 1);
	const raio = interpolate(t, [batida, batida + 0.6], [1.15, 1], lim);

	// Texto grande: bate de cima com desfoque e tremor.
	const pb = spring({frame: fb, fps, config: {damping: 11, stiffness: 170, mass: 0.9}});
	const tremor = fb >= 0 && fb < 10 ? Math.sin(fb * 2.9) * 12 * Math.exp(-fb / 3) : 0;
	const tamGrande = width * 0.12;
	const pPeq = spring({frame, fps, config: {damping: 18}});

	// Pílula LIVE: entra acesa, falha, perde a cor, é cortada e cai.
	const fa = frame - Math.round(apaga * fps);
	const falha = fa >= 0 && fa < 6 ? [0.2, 1, 0.1, 0.8, 0.2, 1][fa] : 1;
	const desligada = interpolate(fa, [5, 9], [0, 1], lim);
	const corte = interpolate(fa, [7, 12], [0, 1], lim);
	const queda = Math.max(0, fa - 12);
	const caiY = 0.5 * 2600 * (queda / fps) ** 2;
	const entraLive = spring({frame: frame - 4, fps, config: {damping: 14}});
	const pulso = 0.6 + 0.4 * Math.sin(frame * 0.5);
	const encerrada = interpolate(fa, [14, 22], [0, 1], lim);
	const tamLive = width * 0.06;
	const yLive = height * 0.58;

	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			{/* Vira frio e sem cor fora do foco */}
			{cena.tom === 'pb' ? (
				<AbsoluteFill style={{backdropFilter: `grayscale(${escuro}) contrast(${1 + 0.15 * escuro})`}} />
			) : (
				<AbsoluteFill
					style={{background: cena.tom === 'roxo' ? '#4b1a80' : '#2a3a78', mixBlendMode: 'color', opacity: 0.5 * escuro}}
				/>
			)}
			<AbsoluteFill
				style={{
					opacity: escuro,
					background: `radial-gradient(ellipse ${30 * raio}% ${19 * raio}% at ${x * 100}% ${y * 100}%, rgba(6,3,18,0) 0%, rgba(6,3,18,0.35) 55%, rgba(4,2,12,0.97) 100%)`,
				}}
			/>
			{/* Feixe de luz de cima até o rosto */}
			<AbsoluteFill
				style={{
					opacity: 0.22 * escuro,
					mixBlendMode: 'screen',
					background: 'linear-gradient(180deg, rgba(210,225,255,0.9) 0%, rgba(210,225,255,0.15) 100%)',
					clipPath: `polygon(${(x - 0.04) * 100}% 0%, ${(x + 0.04) * 100}% 0%, ${(x + 0.2) * 100}% ${(y + 0.06) * 100}%, ${(x - 0.2) * 100}% ${(y + 0.06) * 100}%)`,
					filter: 'blur(18px)',
				}}
			/>
			{/* Pequeno: entra com a cena */}
			{cena.pequeno && (
				<div
					style={{
						position: 'absolute',
						top: height * ((cena.yTexto ?? 0.165) - 0.06),
						width: '100%',
						textAlign: 'center',
						fontFamily: inter,
						fontWeight: 700,
						fontSize: width * 0.032,
						letterSpacing: width * 0.012,
						color: 'rgba(235,238,255,0.9)',
						textShadow: '0 2px 12px rgba(0,0,0,0.8)',
						opacity: pPeq * volta,
						transform: `translateY(${(1 - pPeq) * 20}px)`,
					}}
				>
					{cena.pequeno.toUpperCase()}
				</div>
			)}
			{/* Grande em ouro 3D */}
			{fb >= 0 && (
				<div
					style={{
						position: 'absolute',
						top: height * (cena.yTexto ?? 0.165),
						width: '100%',
						display: 'flex',
						justifyContent: 'center',
						perspective: 900,
						opacity: Math.min(1, pb * 2) * volta,
						filter: pb < 0.6 ? `blur(${(0.6 - pb) * 20}px)` : undefined,
					}}
				>
					<div
						style={{
							transform: `translate(${tremor}px, ${(1 - pb) * -120}px) scale(${1 + (1 - pb) * 1.2}) rotateX(16deg)`,
						}}
					>
						<Ouro3D texto={cena.grande} tamanho={tamGrande} />
					</div>
				</div>
			)}
			{/* LIVE que apaga, é cortada e cai */}
			<div
				style={{
					position: 'absolute',
					top: yLive,
					left: 0,
					width: '100%',
					display: 'flex',
					justifyContent: 'center',
					opacity: Math.min(1, entraLive) * (fa >= 0 && fa < 6 ? falha : 1) * interpolate(queda, [0, 14], [1, 0], lim),
					transform: `translateY(${caiY + (1 - entraLive) * 30}px) rotate(${queda * 1.4}deg) scale(${0.85 + 0.15 * entraLive})`,
				}}
			>
				<div style={{position: 'relative'}}>
					<PilulaLive texto="LIVE" tamanho={tamLive} desligada={desligada} pulso={pulso} />
					<div
						style={{
							position: 'absolute',
							left: '-12%',
							right: '-12%',
							top: '50%',
							height: tamLive * 0.12,
							background: 'linear-gradient(90deg, rgba(255,255,255,0), #fff 20%, #fff 80%, rgba(255,255,255,0))',
							boxShadow: `0 0 ${tamLive * 0.5}px rgba(255,255,255,0.9)`,
							transformOrigin: 'left center',
							transform: `rotate(-11deg) scaleX(${corte})`,
							opacity: corte > 0 ? 1 : 0,
						}}
					/>
				</div>
			</div>
			<div
				style={{
					position: 'absolute',
					top: yLive + tamLive * 0.3,
					width: '100%',
					textAlign: 'center',
					fontFamily: inter,
					fontWeight: 600,
					fontSize: width * 0.03,
					letterSpacing: width * 0.01,
					color: 'rgba(200,205,225,0.85)',
					opacity: encerrada * volta,
					transform: `translateY(${(1 - encerrada) * 10}px)`,
				}}
			>
				LIVE ENCERRADA
			</div>
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
