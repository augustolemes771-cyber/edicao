import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {CenaNoPlano} from '../motor/plano';
import {gloock, spaceMono, unbounded} from '../motor/tema';
import {larguraGloock} from './Luxo';

// Tópicos em papel rasgado (referência "SÓ VENDER / Não é o suficiente", 24/10/2026): uma folha branca com textura
// cobre a tela e um rasgo no topo mostra o rosto dela por baixo, com fibras e sombra na borda e um reflexo de
// prisma; os tópicos ficam impressos no papel em tipografia editorial escura e se acumulam com a fala.
type Cena = Extract<CenaNoPlano, {tipo: 'topicos'}>;

export const TopicosPapel: React.FC<{cena: Cena}> = ({cena}) => {
	const f = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const duracao = (cena.ate - cena.de) * fps;
	// A folha sobe e cobre a tela no começo; no fim, desce.
	const sobe = spring({frame: f, fps, config: {damping: 20, stiffness: 120, mass: 0.8}});
	const desce = spring({frame: f - (duracao - 9), fps, config: {damping: 200}, durationInFrames: 9});
	const y = (1 - sobe) * height + desce * height;
	// Janela rasgada: retângulo do topo com a borda deformada por ruído.
	const jx = width * 0.07;
	const jy = height * 0.045;
	const jw = width * 0.86;
	const jh = height * 0.4;
	const id = `papel-${cena.de.toFixed(2)}`;
	const inicios = cena.itens.map((it) => Math.round((it.em - cena.de) * fps));
	const tamG = width * 0.13;
	return (
		<AbsoluteFill style={{transform: `translateY(${y}px)`}}>
			<svg width={width} height={height} style={{position: 'absolute', inset: 0}}>
				<defs>
					<filter id={`${id}-rasgo`} x="-10%" y="-10%" width="120%" height="120%">
						<feTurbulence type="fractalNoise" baseFrequency="0.035 0.06" numOctaves="4" seed="7" />
						<feDisplacementMap in="SourceGraphic" scale={width * 0.045} />
					</filter>
					<filter id={`${id}-fibra`} x="-10%" y="-10%" width="120%" height="120%">
						<feTurbulence type="fractalNoise" baseFrequency="0.035 0.06" numOctaves="4" seed="7" />
						<feDisplacementMap in="SourceGraphic" scale={width * 0.062} />
					</filter>
					<filter id={`${id}-textura`}>
						<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="3" />
						<feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.33  0 0 0 0 0.3  0 0 0 0.16 0" />
					</filter>
					<filter id={`${id}-sombra`} x="-10%" y="-10%" width="120%" height="120%">
						<feDropShadow
							dx="0"
							dy={height * 0.006}
							stdDeviation={width * 0.012}
							floodColor="#000"
							floodOpacity="0.55"
						/>
					</filter>
					{/* Papel = tela inteira menos o buraco rasgado. */}
					<mask id={`${id}-buraco`}>
						<rect width={width} height={height} fill="#fff" />
						<rect x={jx} y={jy} width={jw} height={jh} rx={width * 0.02} fill="#000" filter={`url(#${id}-rasgo)`} />
					</mask>
					{/* Fibras: faixa branca irregular entre o rasgo de fora e o de dentro. */}
					<mask id={`${id}-borda`}>
						<rect x={jx} y={jy} width={jw} height={jh} rx={width * 0.02} fill="#fff" filter={`url(#${id}-rasgo)`} />
						<rect
							x={jx + width * 0.012}
							y={jy + width * 0.012}
							width={jw - width * 0.024}
							height={jh - width * 0.024}
							rx={width * 0.02}
							fill="#000"
							filter={`url(#${id}-fibra)`}
						/>
					</mask>
				</defs>
				{/* Sombra que o papel joga para dentro do buraco. */}
				<g filter={`url(#${id}-sombra)`}>
					<rect width={width} height={height} fill="#f3f1ec" mask={`url(#${id}-buraco)`} />
				</g>
				<rect width={width} height={height} fill="#ffffff" mask={`url(#${id}-borda)`} opacity={0.95} />
				<rect width={width} height={height} filter={`url(#${id}-textura)`} mask={`url(#${id}-buraco)`} />
			</svg>
			{/* Luz da folha: mais clara em cima à esquerda, sombra suave embaixo. */}
			<AbsoluteFill
				style={{
					background:
						'linear-gradient(160deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 45%, rgba(60,50,40,0.12) 100%)',
					mixBlendMode: 'multiply',
					pointerEvents: 'none',
				}}
			/>
			{/* Reflexo de prisma atravessando a borda do rasgo. */}
			<div
				style={{
					position: 'absolute',
					left: width * 0.42,
					top: jy + jh * 0.93,
					width: width * 0.62,
					height: height * 0.035,
					background:
						'linear-gradient(90deg, rgba(255,0,80,0) 0%, rgba(255,60,60,0.55) 18%, rgba(255,190,40,0.55) 34%, rgba(80,230,120,0.5) 50%, rgba(60,150,255,0.5) 66%, rgba(170,80,255,0.45) 82%, rgba(170,80,255,0) 100%)',
					transform: `rotate(-12deg) translateX(${interpolate(f, [0, duracao], [-width * 0.05, width * 0.08])}px)`,
					filter: `blur(${width * 0.01}px)`,
					mixBlendMode: 'screen',
					opacity: 0.7,
				}}
			/>
			{/* Texto impresso no papel. */}
			<div style={{position: 'absolute', left: width * 0.08, right: width * 0.06, top: jy + jh + height * 0.045}}>
				<div
					style={{
						fontFamily: unbounded,
						fontWeight: 300,
						fontSize: width * 0.034,
						letterSpacing: width * 0.034 * 0.3,
						textTransform: 'uppercase',
						color: '#6b6660',
						marginBottom: height * 0.012,
					}}
				>
					{cena.titulo ?? 'Hoje a gente'} →
				</div>
				{cena.itens.map((it, i) => {
					const p = spring({frame: f - inicios[i], fps, config: {damping: 200}, durationInFrames: 9});
					const forte = (it.texto.match(/\*([^*]+)\*/) ?? [, it.texto])[1] as string;
					const partes = it.texto.split(/(\*[^*]+\*)/).filter(Boolean);
					// A palavra forte diminui quando a linha não cabe (ex.: "acompanhamento diário").
					const fino = it.texto.replace(/\*[^*]+\*/, '').trim();
					const disponivel = width * 0.78 - fino.length * width * 0.038 * 0.78;
					const tam = Math.min(tamG, disponivel / (larguraGloock(forte) * 1.12));
					return (
						<div
							key={i}
							style={{
								display: 'flex',
								alignItems: 'baseline',
								gap: width * 0.025,
								borderTop: '1px solid rgba(40,35,30,0.18)',
								padding: `${height * 0.014}px 0`,
								// Entra como impressão: a linha se revela da esquerda para a direita.
								clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`,
							}}
						>
							<span style={{fontFamily: spaceMono, fontSize: width * 0.026, color: '#9a948c', minWidth: width * 0.06}}>
								{String(i + 1).padStart(2, '0')}
							</span>
							<span style={{whiteSpace: 'nowrap'}}>
								{partes.map((pt, j) =>
									pt.startsWith('*') ? (
										<span key={j} style={{fontFamily: gloock, fontSize: tam, lineHeight: 1.05, color: '#15130f'}}>
											{forte}
										</span>
									) : (
										<span
											key={j}
											style={{
												fontFamily: unbounded,
												fontWeight: 300,
												fontSize: width * 0.038,
												color: '#5e5953',
												margin: `0 ${width * 0.012}px`,
											}}
										>
											{pt.trim()}
										</span>
									),
								)}
							</span>
						</div>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};
