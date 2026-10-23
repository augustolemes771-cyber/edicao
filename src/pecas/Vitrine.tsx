import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {CenaNoPlano} from '../motor/plano';
import {gloock, spaceMono, unbounded} from '../motor/tema';

// Vitrine de produto (análise das referências de design, out/2026): foto de estúdio real sobre preto, que se
// funde ao fundo pelas bordas, com a palavra-chave na serifada Gloock dourada, frase fina espaçada em cima,
// microtextos técnicos em mono e grão de filme. Substitui os cenários 3D de formas geradas por código.
type De<T extends CenaNoPlano['tipo']> = Extract<CenaNoPlano, {tipo: T}>;

const OURO = 'linear-gradient(180deg, #fff6d0 0%, #ffd873 40%, #e9a92a 75%, #b97812 100%)';

const Grao: React.FC = () => (
	<AbsoluteFill style={{mixBlendMode: 'overlay', opacity: 0.3, pointerEvents: 'none'}}>
		<svg width="100%" height="100%">
			<filter id="grao-vitrine">
				<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
			</filter>
			<rect width="100%" height="100%" filter="url(#grao-vitrine)" />
		</svg>
	</AbsoluteFill>
);

export const Vitrine: React.FC<{cena: De<'vitrine'>}> = ({cena}) => {
	const f = useCurrentFrame();
	const {fps, width, height, durationInFrames} = useVideoConfig();
	const entra = spring({frame: f, fps, config: {damping: 200}, durationInFrames: 18});
	// Aproximação lenta e contínua na foto (respiro de câmera).
	const empurra = interpolate(f, [0, durationInFrames], [1.06, 1], {extrapolateRight: 'clamp'});
	const alturaFoto = height * (cena.alturaFoto ?? 0.58);
	const centroFoto = height * (cena.yFoto ?? 0.64);
	const grande = cena.grande;
	const tam = Math.min(width * 0.25, (width * 0.84) / (grande.length * 0.52));
	const linha = spring({frame: f - 10, fps, config: {damping: 200}, durationInFrames: 20});
	const micro: React.CSSProperties = {
		fontFamily: spaceMono,
		fontSize: width * 0.02,
		color: 'rgba(255,255,255,0.55)',
		letterSpacing: width * 0.002,
		opacity: interpolate(f, [14, 24], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
	};
	const mascara = 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.35) 14%, #000 40%, #000 80%, transparent 100%)';
	return (
		<AbsoluteFill style={{backgroundColor: '#050505', overflow: 'hidden'}}>
			<div
				style={{
					position: 'absolute',
					left: '50%',
					top: centroFoto,
					height: alturaFoto,
					transform: `translate(-50%, -50%) scale(${empurra * (1.08 - 0.08 * entra)})`,
					opacity: entra,
					filter: `blur(${(1 - entra) * 14}px)`,
					WebkitMaskImage: mascara,
					maskImage: mascara,
				}}
			>
				<Img src={staticFile(cena.imagem)} style={{height: '100%', width: 'auto', display: 'block'}} />
			</div>
			{/* Brilho quente difuso atrás do texto, como nas outras falas. */}
			<div
				style={{
					position: 'absolute',
					left: '-30%',
					right: '-30%',
					top: height * 0.02,
					height: height * 0.36,
					background:
						'radial-gradient(ellipse at center, rgba(255,180,60,0.22) 0%, rgba(255,160,40,0.08) 40%, transparent 72%)',
					mixBlendMode: 'screen',
				}}
			/>
			<div style={{position: 'absolute', top: height * 0.045, left: width * 0.07, ...micro}}>
				[ {cena.indice ?? '01'} ]
			</div>
			<div style={{position: 'absolute', top: height * 0.045, right: width * 0.07, ...micro}}>
				{cena.rotulo ?? 'MENTORIA DANILOW'}
			</div>
			<div
				style={{
					position: 'absolute',
					top: height * (cena.yTexto ?? 0.1),
					left: 0,
					right: 0,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
				}}
			>
				{cena.pequeno && (
					<div
						style={{
							fontFamily: unbounded,
							fontWeight: 300,
							fontSize: width * 0.042,
							letterSpacing: width * 0.042 * 0.35,
							textTransform: 'uppercase',
							color: 'rgba(255,255,255,0.9)',
							opacity: entra,
							transform: `translateY(${(1 - entra) * 20}px)`,
						}}
					>
						{cena.pequeno}
					</div>
				)}
				<div style={{fontFamily: gloock, fontSize: tam, lineHeight: 1, whiteSpace: 'nowrap', marginTop: width * 0.005}}>
					{[...grande].map((ch, i) => {
						const e = spring({frame: f - 4 - i * 1.2, fps, config: {damping: 200}, durationInFrames: 16});
						return (
							<span
								key={i}
								style={{
									display: 'inline-block',
									opacity: e,
									transform: `translateY(${(1 - e) * tam * 0.25}px)`,
									filter: `blur(${(1 - e) * 10}px) drop-shadow(0 ${tam * 0.02}px ${tam * 0.02}px rgba(0,0,0,0.6)) drop-shadow(0 0 ${tam * 0.12}px rgba(255,190,60,0.35))`,
									background: OURO,
									WebkitBackgroundClip: 'text',
									backgroundClip: 'text',
									color: 'transparent',
									padding: '0 0.02em',
								}}
							>
								{ch === ' ' ? ' ' : ch}
							</span>
						);
					})}
				</div>
				{/* Fio dourado que se desenha a partir do centro. */}
				<div
					style={{
						marginTop: width * 0.02,
						width: width * 0.5 * linha,
						height: 2,
						background: 'linear-gradient(90deg, transparent, rgba(255,214,120,0.9), transparent)',
					}}
				/>
			</div>
			{cena.abaixo && (
				<div
					style={{
						position: 'absolute',
						bottom: height * 0.06,
						left: 0,
						right: 0,
						textAlign: 'center',
						...micro,
						fontSize: width * 0.024,
					}}
				>
					{cena.abaixo}
				</div>
			)}
			<Grao />
		</AbsoluteFill>
	);
};
