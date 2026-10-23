import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {barlowCond, fraunces, gloock, spaceMono, unbounded} from './motor/tema';

// Prova estática de combinações de fontes (uma por imagem) sobre um quadro do vídeo, para aprovação.
export type PropsProvaFontes = {opcao: 1 | 2 | 3; quadro?: string};

const OURO = 'linear-gradient(180deg, #fff6d0 0%, #ffd873 40%, #e9a92a 75%, #b97812 100%)';
const ouro = (tam: number): React.CSSProperties => ({
	background: OURO,
	WebkitBackgroundClip: 'text',
	backgroundClip: 'text',
	color: 'transparent',
	filter: `drop-shadow(0 ${tam * 0.02}px ${tam * 0.02}px rgba(0,0,0,0.6)) drop-shadow(0 0 ${tam * 0.12}px rgba(255,190,60,0.35))`,
	padding: '0 0.08em',
});
const fino = (familia: string, tam: number, espaco = 0.3): React.CSSProperties => ({
	fontFamily: familia,
	fontWeight: 300,
	fontSize: tam,
	letterSpacing: tam * espaco,
	color: 'rgba(255,255,255,0.88)',
	textTransform: 'uppercase',
	textShadow: '0 2px 12px rgba(0,0,0,0.7)',
});
const micro: React.CSSProperties = {
	fontFamily: spaceMono,
	fontSize: 22,
	color: 'rgba(255,255,255,0.55)',
	letterSpacing: 2,
};

// Grão de filme por cima de tudo.
const Grao: React.FC = () => (
	<AbsoluteFill style={{mixBlendMode: 'overlay', opacity: 0.35}}>
		<svg width="100%" height="100%">
			<filter id="g">
				<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
			</filter>
			<rect width="100%" height="100%" filter="url(#g)" />
		</svg>
	</AbsoluteFill>
);

const Bloco: React.FC<{top: number; children: React.ReactNode}> = ({top, children}) => (
	<div
		style={{
			position: 'absolute',
			top,
			left: 0,
			right: 0,
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
		}}
	>
		{children}
	</div>
);

const Opcao1 = () => (
	<>
		<Bloco top={110}>
			<div style={fino(unbounded, 46, 0.35)}>a melhor</div>
			<div style={{fontFamily: gloock, fontSize: 250, lineHeight: 1, marginTop: 6, ...ouro(250)}}>decisão</div>
			<div style={{...micro, marginTop: 14}}>— DEPOIMENTO · MENTORIA DANILOW —</div>
		</Bloco>
		<Bloco top={1420}>
			<div style={fino(unbounded, 46, 0.35)}>é</div>
			<div style={{fontFamily: gloock, fontSize: 270, lineHeight: 1, ...ouro(270)}}>surreal</div>
		</Bloco>
	</>
);

const Opcao2 = () => (
	<>
		<Bloco top={100}>
			<div style={fino(barlowCond, 64, 0.4)}>a melhor</div>
			<div
				style={{
					fontFamily: barlowCond,
					fontWeight: 900,
					fontStyle: 'italic',
					fontSize: 300,
					lineHeight: 0.85,
					textTransform: 'uppercase',
					letterSpacing: -4,
					...ouro(300),
				}}
			>
				decisão
			</div>
			<div style={{...micro, marginTop: 18}}>[ 01 ] RESULTADO REAL</div>
		</Bloco>
		<Bloco top={1400}>
			<div style={fino(barlowCond, 64, 0.4)}>é</div>
			<div
				style={{
					fontFamily: barlowCond,
					fontWeight: 900,
					fontStyle: 'italic',
					fontSize: 320,
					lineHeight: 0.85,
					textTransform: 'uppercase',
					letterSpacing: -4,
					...ouro(320),
				}}
			>
				surreal
			</div>
		</Bloco>
	</>
);

// Serifada itálica de display com uma cópia desfocada atrás (profundidade de campo).
const Fraunces: React.FC<{texto: string; tam: number}> = ({texto, tam}) => (
	<div
		style={{
			position: 'relative',
			fontFamily: fraunces,
			fontWeight: 900,
			fontStyle: 'italic',
			fontSize: tam,
			lineHeight: 1,
		}}
	>
		<div
			style={{
				position: 'absolute',
				inset: 0,
				filter: 'blur(14px)',
				opacity: 0.55,
				transform: 'scale(1.12)',
				...ouro(tam),
			}}
		>
			{texto}
		</div>
		<div style={{position: 'relative', ...ouro(tam)}}>{texto}</div>
	</div>
);

const Opcao3 = () => (
	<>
		<Bloco top={120}>
			<div style={{display: 'flex', alignItems: 'baseline', gap: 22}}>
				<span style={{fontFamily: spaceMono, fontSize: 40, color: 'rgba(255,255,255,0.75)', letterSpacing: 4}}>
					a melhor
				</span>
				<span style={{width: 120, height: 2, background: 'rgba(255,214,120,0.8)'}} />
			</div>
			<Fraunces texto="decisão" tam={240} />
			<div style={{...micro, alignSelf: 'flex-end', marginRight: 110}}>(2025)</div>
		</Bloco>
		<Bloco top={1420}>
			<span style={{fontFamily: spaceMono, fontSize: 40, color: 'rgba(255,255,255,0.75)', letterSpacing: 4}}>é</span>
			<Fraunces texto="surreal" tam={260} />
		</Bloco>
	</>
);

export const ProvaFontes: React.FC<PropsProvaFontes> = ({opcao, quadro}) => (
	<AbsoluteFill style={{backgroundColor: '#0d0d0f'}}>
		{quadro && <Img src={staticFile(quadro)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />}
		<AbsoluteFill
			style={{
				background:
					'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 32%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.65) 100%)',
			}}
		/>
		{opcao === 1 ? <Opcao1 /> : opcao === 2 ? <Opcao2 /> : <Opcao3 />}
		<Grao />
	</AbsoluteFill>
);
