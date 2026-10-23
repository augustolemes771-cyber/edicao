import React from 'react';
import {AbsoluteFill, spring} from 'remotion';
import {gloock, unbounded} from '../motor/tema';

// Estilo "luxo editorial" (aprovado em 23/10/2026, docs: prova-fontes): frase fina em Unbounded maiúscula e espaçada,
// palavra grande na serifada Gloock em degradê dourado com sombra e brilho; letras entram em cascata com desfoque.
export const OURO_LUXO = 'linear-gradient(180deg, #fff6d0 0%, #ffd873 40%, #e9a92a 75%, #b97812 100%)';

// Largura estimada na Gloock: maiúsculas ocupam mais que minúsculas.
export const larguraGloock = (s: string) =>
	[...s].reduce((t, ch) => t + (ch === ' ' ? 0.3 : ch !== ch.toLowerCase() ? 0.7 : 0.52), 0);

export const TextoLuxo: React.FC<{
	pequeno?: string;
	grande: string;
	f: number;
	fps: number;
	largura: number;
	tamMax?: number;
	ocupa?: number;
}> = ({pequeno, grande, f, fps, largura, tamMax = 0.25, ocupa = 0.86}) => {
	const tam = Math.min(largura * tamMax, (largura * ocupa) / larguraGloock(grande));
	const pq = spring({frame: f, fps, config: {damping: 200}, durationInFrames: 8});
	return (
		<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
			{pequeno && (
				<div
					style={{
						fontFamily: unbounded,
						fontWeight: 300,
						fontSize: largura * 0.043,
						letterSpacing: largura * 0.043 * 0.35,
						textTransform: 'uppercase',
						color: 'rgba(255,255,255,0.92)',
						textShadow: '0 2px 14px rgba(0,0,0,0.7)',
						opacity: pq,
						transform: `translateY(${(1 - pq) * 20}px)`,
						whiteSpace: 'nowrap',
					}}
				>
					{pequeno}
				</div>
			)}
			<div
				style={{fontFamily: gloock, fontSize: tam, lineHeight: 0.95, whiteSpace: 'nowrap', marginTop: largura * 0.006}}
			>
				{[...grande].map((ch, i) => {
					const e = spring({frame: f - 3 - i * 0.7, fps, config: {damping: 200}, durationInFrames: 10});
					return (
						<span
							key={i}
							style={{
								display: 'inline-block',
								opacity: e,
								transform: `translateY(${(1 - e) * tam * 0.2}px) scale(${1 + (1 - e) * 0.15})`,
								background: OURO_LUXO,
								WebkitBackgroundClip: 'text',
								backgroundClip: 'text',
								color: 'transparent',
								filter: `blur(${(1 - e) * 10}px) drop-shadow(0 ${tam * 0.02}px ${tam * 0.02}px rgba(0,0,0,0.6)) drop-shadow(0 0 ${tam * 0.12}px rgba(255,190,60,0.35))`,
								// Folga embaixo: o recorte do degradê cortava as pernas de g, p e q.
								padding: '0 0.02em 0.18em',
							}}
						>
							{ch === ' ' ? ' ' : ch}
						</span>
					);
				})}
			</div>
		</div>
	);
};

// Destaque pela luz, atrás do texto: o topo do quadro escurece e desfoca num degradê longo, sem borda, com um brilho
// dourado difuso atrás das letras. y e altura em fração da altura do quadro.
export const DestaqueSuave: React.FC<{y: number; altura: number; forca: number; width: number; height: number}> = ({
	y,
	altura,
	forca,
	width,
	height,
}) => {
	const fim = (y + altura * 0.8) * height;
	return (
		<AbsoluteFill style={{opacity: forca}}>
			{/* Degradê escuro direto (o backdrop-filter não age dentro das camadas do vídeo). */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: 0,
					height: fim,
					background:
						'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.45) 30%, rgba(0,0,0,0.2) 60%, transparent 100%)',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					left: '-30%',
					right: '-30%',
					top: (y - altura * 0.6) * height,
					height: altura * 1.2 * height,
					background:
						'radial-gradient(ellipse at center, rgba(255,180,60,0.3) 0%, rgba(255,160,40,0.12) 35%, rgba(255,150,30,0.04) 55%, transparent 75%)',
					mixBlendMode: 'screen',
				}}
			/>
		</AbsoluteFill>
	);
};
