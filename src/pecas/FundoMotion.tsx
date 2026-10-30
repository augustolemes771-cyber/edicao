// Grade padrão dos motions de tela inteira (pedido do usuário, 30/10/2026, entrevista-3): reta, sem perspectiva nem
// inclinação, no tom do próprio fundo (branco bem transparente por cima dele) e com espaçamento médio. Anda devagar para
// baixo para dar vida. Use em TODO motion de tela inteira; FundoMotion já traz o fundo roxo do tema com a grade.
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';

export const CELULA_GRADE = 96;

export const GradeReta: React.FC<{topo?: number; cor?: string; velocidade?: number}> = ({topo = 0, cor = 'rgba(255,255,255,0.075)', velocidade = 18}) => {
	const frame = useCurrentFrame();
	const {fps, height} = useVideoConfig();
	// Some só nas pontas, para a grade não terminar numa linha dura.
	const mascara = `linear-gradient(180deg, rgba(0,0,0,${topo > 0 ? 0 : 0.35}) 0%, #000 12%, #000 88%, rgba(0,0,0,0.35) 100%)`;
	return (
		<div
			style={{
				position: 'absolute',
				left: 0,
				right: 0,
				top: height * topo,
				bottom: 0,
				backgroundImage: `linear-gradient(${cor} 2px, transparent 2px), linear-gradient(90deg, ${cor} 2px, transparent 2px)`,
				backgroundSize: `${CELULA_GRADE}px ${CELULA_GRADE}px`,
				backgroundPosition: `center ${((frame / fps) * velocidade) % CELULA_GRADE}px`,
				WebkitMaskImage: mascara,
				maskImage: mascara,
				pointerEvents: 'none',
			}}
		/>
	);
};

// Fundo roxo do tema (ou outra cor em `fundo`) com a grade reta por cima.
export const FundoMotion: React.FC<{fundo?: string; cor?: string}> = ({fundo = 'radial-gradient(ellipse at 50% 45%, #3d1f74 0%, #1E0F3A 55%, #0b051c 100%)', cor}) => (
	<AbsoluteFill style={{background: fundo}}>
		<GradeReta cor={cor} />
	</AbsoluteFill>
);
