import React from 'react';
import {AbsoluteFill, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {CenaNoPlano} from '../motor/plano';
import {gloock, unbounded} from '../motor/tema';

// Xadrez em impacto (referência do usuário, 23/10/2026). As peças vêm de uma render do Blender com fundo
// transparente (scripts/blender/xadrez.py): a rainha vermelha cai e lança os peões no ar com física real.
// Aqui ficam, atrás da render: o fundo escuro com brasa vermelha, um grid suave, fumaça, poeira e o texto,
// para a coroa da rainha passar na frente das letras.
type Cena = Extract<CenaNoPlano, {tipo: 'xadrez'}>;

const QUEDA = 9; // quadro do impacto na render do xadrez (o quadro 1 da render é o 0 da cena)

// Cores da cena: vermelho no xadrez, dourado na caixa (o dourado aprovado no resto do vídeo).
const TONS = {
	vermelho: {
		brasa: ['210,52,22', '110,18,10', '28,6,6'],
		grid: '255,140,110',
		fumaca: ['255,110,70', '150,40,25'],
		texto: 'linear-gradient(180deg, #ffffff 0%, #ece6e2 38%, #b9aaa6 58%, #a3221c 82%, #5a0b08 100%)',
		brilho: '255,50,30',
		pequeno: 'rgba(255,235,230,0.88)',
		clarao: '255,90,60',
		poeira: '255,190,160',
	},
	dourado: {
		brasa: ['225,150,50', '110,70,15', '26,18,6'],
		grid: '255,210,140',
		fumaca: ['255,190,100', '150,100,30'],
		texto: 'linear-gradient(180deg, #fff6d0 0%, #ffd873 40%, #e9a92a 75%, #b97812 100%)',
		brilho: '255,190,60',
		pequeno: 'rgba(255,245,225,0.9)',
		clarao: '255,200,120',
		poeira: '255,225,170',
	},
};

const Grao: React.FC = () => (
	<AbsoluteFill style={{mixBlendMode: 'overlay', opacity: 0.28, pointerEvents: 'none'}}>
		<svg width="100%" height="100%">
			<filter id="grao-xadrez">
				<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
			</filter>
			<rect width="100%" height="100%" filter="url(#grao-xadrez)" />
		</svg>
	</AbsoluteFill>
);

// Texto com a fala: a frase pequena entra no começo, a palavra grande quando ela é dita.
const Texto: React.FC<{cena: Cena; f: number}> = ({cena, f}) => {
	const {fps, width, height} = useVideoConfig();
	// O texto se monta inteiro logo no começo da frase (pedido do usuário): não espera cada palavra ser dita.
	const emGrande = Math.round((cena.emGrande ?? 0.15) * fps);
	const pq = spring({frame: f, fps, config: {damping: 200}, durationInFrames: 8});
	const tam = Math.min(width * 0.24, (width * 0.86) / (cena.grande.length * 0.52));
	const T = TONS[cena.tom ?? 'vermelho'];
	return (
		<>
			{/* Texto atrás da rainha, na luz vermelha da cena. */}
			<div
				style={{
					position: 'absolute',
					top: height * (cena.yTexto ?? 0.205),
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
							color: T.pequeno,
							textShadow: `0 0 18px rgba(${T.brilho},0.45)`,
							opacity: pq,
							transform: `translateY(${(1 - pq) * 20}px)`,
						}}
					>
						{cena.pequeno}
					</div>
				)}
				<div style={{fontFamily: gloock, fontSize: tam, lineHeight: 1, whiteSpace: 'nowrap', marginTop: width * 0.01}}>
					{[...cena.grande].map((ch, i) => {
						const e = spring({frame: f - emGrande - i * 0.7, fps, config: {damping: 200}, durationInFrames: 10});
						return (
							<span
								key={i}
								style={{
									display: 'inline-block',
									opacity: e,
									transform: `translateY(${(1 - e) * tam * 0.2}px) scale(${1 + (1 - e) * 0.15})`,
									// Prata com o reflexo vermelho embaixo, como os peões na contraluz.
									background: T.texto,
									WebkitBackgroundClip: 'text',
									backgroundClip: 'text',
									color: 'transparent',
									filter: `blur(${(1 - e) * 10}px) drop-shadow(0 0 ${tam * 0.1}px rgba(${T.brilho},0.45))`,
									// Folga embaixo: o recorte do degradê no texto cortava a perna do g.
									padding: '0 0.02em 0.18em',
								}}
							>
								{ch === ' ' ? ' ' : ch}
							</span>
						);
					})}
				</div>
			</div>
		</>
	);
};

export const Xadrez: React.FC<{cena: Cena}> = ({cena}) => {
	const f = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const quadros = cena.quadros ?? 46;
	const n = Math.min(quadros, f + 1);
	const src = staticFile(`${cena.pasta}/q_${String(n).padStart(4, '0')}.${cena.video ? 'webp' : 'png'}`);
	const T = TONS[cena.tom ?? 'vermelho'];
	const impacto = cena.quadroImpacto ?? QUEDA;
	const clarao = f >= impacto ? Math.exp(-(f - impacto) * 0.28) : 0;
	const respira = interpolate(f, [0, 60], [1, 1.035]);

	const celula = width * 0.075;
	if (cena.video) {
		const quadro = String(n).padStart(4, '0');
		const cheio: React.CSSProperties = {
			position: 'absolute',
			inset: 0,
			width: '100%',
			height: '100%',
			objectFit: 'cover',
		};
		return (
			<AbsoluteFill style={{backgroundColor: '#050306'}}>
				<Img src={staticFile(`${cena.pasta}/f_${quadro}.jpg`)} style={cheio} />
				<Texto cena={cena} f={f} />
				<Img src={src} style={cheio} />
			</AbsoluteFill>
		);
	}
	return (
		<AbsoluteFill style={{backgroundColor: '#050306', overflow: 'hidden'}}>
			<AbsoluteFill style={{transform: `scale(${respira})`}}>
				{/* Fundo: escuro em cima, brasa vermelha no horizonte atrás da rainha; pulsa no impacto. */}
				<AbsoluteFill
					style={{
						background: `radial-gradient(ellipse 80% 34% at 50% ${(cena.yLuz ?? 0.62) * 100}%, rgba(${T.brasa[0]},${0.62 + clarao * 0.3}) 0%, rgba(${T.brasa[1]},0.7) 34%, rgba(${T.brasa[2]},0.95) 68%, #050306 100%)`,
					}}
				/>
				{/* Grid suave na parede do fundo, que some para as bordas. */}
				<AbsoluteFill
					style={{
						backgroundImage: `linear-gradient(rgba(${T.grid},0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(${T.grid},0.16) 1px, transparent 1px)`,
						backgroundSize: `${celula}px ${celula}px`,
						backgroundPosition: `50% ${-f * 0.4}px`,
						WebkitMaskImage:
							'radial-gradient(ellipse 70% 45% at 50% 55%, #000 0%, rgba(0,0,0,0.5) 45%, transparent 80%)',
						maskImage: 'radial-gradient(ellipse 70% 45% at 50% 55%, #000 0%, rgba(0,0,0,0.5) 45%, transparent 80%)',
					}}
				/>
				{/* Fumaça: nuvens desfocadas e quentes subindo devagar do impacto. */}
				{Array.from({length: 7}, (_, i) => {
					const x = 0.15 + random(`fx${i}`) * 0.7;
					const sobe = Math.max(0, f - impacto) * (0.6 + random(`fv${i}`) * 0.8);
					const op = f < impacto ? 0.15 : 0.15 + 0.3 * Math.min(1, (f - impacto) / 8);
					const r = width * (0.25 + random(`fr${i}`) * 0.25);
					return (
						<div
							key={i}
							style={{
								position: 'absolute',
								left: x * width - r,
								top: height * (0.5 + random(`fy${i}`) * 0.12) - r - sobe * 3,
								width: r * 2,
								height: r * 1.2,
								borderRadius: '50%',
								background: `radial-gradient(ellipse at center, rgba(${T.fumaca[0]},0.5) 0%, rgba(${T.fumaca[1]},0.25) 45%, transparent 70%)`,
								filter: `blur(${width * 0.03}px)`,
								opacity: op,
							}}
						/>
					);
				})}
				{cena.feixe && (
					// O desfoque fica num invólucro por fora do recorte: assim as bordas do feixe saem macias.
					<div
						style={{
							position: 'absolute',
							inset: 0,
							filter: `blur(${width * 0.035}px)`,
							mixBlendMode: 'screen',
							opacity: interpolate(f, [cena.feixe.abre, cena.feixe.abre + 10], [0, 1], {
								extrapolateLeft: 'clamp',
								extrapolateRight: 'clamp',
							}),
						}}
					>
						<div
							style={{
								position: 'absolute',
								left: width * (cena.feixe.x - 0.3),
								width: width * 0.6,
								top: 0,
								height: height * cena.feixe.y,
								background: `linear-gradient(0deg, rgba(${T.clarao},0.9) 0%, rgba(${T.clarao},0.35) 45%, transparent 100%)`,
								clipPath: 'polygon(30% 100%, 70% 100%, 100% 0%, 0% 0%)',
							}}
						/>
					</div>
				)}
				<Texto cena={cena} f={f} />
				{/* Poeira fina no ar, acesa pela contraluz. */}
				{Array.from({length: 40}, (_, i) => {
					const x = random(`px${i}`) * width;
					const y = height * (0.25 + random(`py${i}`) * 0.5) - f * (0.5 + random(`pv${i}`) * 1.5);
					const s = 1.5 + random(`ps${i}`) * 3;
					return (
						<div
							key={i}
							style={{
								position: 'absolute',
								left: x,
								top: y,
								width: s,
								height: s,
								borderRadius: '50%',
								background: `rgba(${T.poeira},0.8)`,
								opacity: 0.25 + random(`po${i}`) * 0.5,
								filter: 'blur(0.6px)',
							}}
						/>
					);
				})}
				<Img src={src} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover'}} />
			</AbsoluteFill>
			{/* Clarão do impacto e vinheta. */}
			<AbsoluteFill style={{background: `rgba(${T.clarao},${clarao * 0.22})`, mixBlendMode: 'screen'}} />
			<AbsoluteFill
				style={{background: 'radial-gradient(ellipse 80% 65% at 50% 50%, transparent 45%, rgba(0,0,0,0.7) 100%)'}}
			/>
			<Grao />
		</AbsoluteFill>
	);
};
