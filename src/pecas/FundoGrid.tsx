import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';

// Fundo em movimento cinematográfico (pedido do usuário, 24/10/2026): preto e dourado, chão de grid em perspectiva
// que avança para a câmera e some no horizonte, parede de grid suave atrás, linha do horizonte acesa com reflexo
// de lente horizontal (anamórfico) e um sol de luz quente atrás dela. horizonte: altura de 0 a 1.
export const FundoGrid: React.FC<{horizonte?: number}> = ({horizonte = 0.8}) => {
	const f = useCurrentFrame();
	const {width, height} = useVideoConfig();
	const hy = height * horizonte;
	const celula = width * 0.14;
	const linhaOuro = 'rgba(255,196,96,0.55)';
	const pulsa = 0.85 + Math.sin(f / 18) * 0.15;
	return (
		<AbsoluteFill style={{backgroundColor: '#040302', overflow: 'hidden'}}>
			{/* Céu: escuro em cima, calor subindo do horizonte. */}
			<AbsoluteFill
				style={{
					background: `radial-gradient(ellipse 90% 45% at 50% ${horizonte * 100}%, rgba(150,90,20,0.55) 0%, rgba(60,32,6,0.5) 38%, rgba(10,6,2,0) 75%)`,
				}}
			/>
			{/* Parede de grid atrás, bem suave, que some para cima e para os lados. */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: 0,
					height: hy,
					backgroundImage: `linear-gradient(rgba(255,200,120,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(255,200,120,0.09) 1px, transparent 1px)`,
					backgroundSize: `${celula * 0.6}px ${celula * 0.6}px`,
					backgroundPosition: `50% ${hy}px`,
					WebkitMaskImage: 'radial-gradient(ellipse 70% 80% at 50% 100%, #000 0%, transparent 75%)',
					maskImage: 'radial-gradient(ellipse 70% 80% at 50% 100%, #000 0%, transparent 75%)',
				}}
			/>
			{/* Sol atrás do horizonte. */}
			<div
				style={{
					position: 'absolute',
					left: width * 0.5 - width * 0.42,
					top: hy - width * 0.42,
					width: width * 0.84,
					height: width * 0.84,
					borderRadius: '50%',
					background: 'radial-gradient(circle, rgba(255,220,150,0.55) 0%, rgba(255,170,60,0.22) 30%, transparent 65%)',
					opacity: pulsa,
				}}
			/>
			{/* Chão de grid em perspectiva, andando para a câmera: o plano gira pela base e a borda de cima vai para o
			fundo, com o ponto de fuga na linha do horizonte. */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: hy,
					bottom: 0,
					perspective: height * 0.25,
					perspectiveOrigin: '50% 0%',
					overflow: 'hidden',
				}}
			>
				<div
					style={{
						position: 'absolute',
						left: -width * 2,
						width: width * 5,
						bottom: 0,
						height: height * 3,
						transformOrigin: '50% 100%',
						transform: 'rotateX(82deg)',
						backgroundImage: `linear-gradient(${linhaOuro} 3px, transparent 3px), linear-gradient(90deg, ${linhaOuro} 3px, transparent 3px)`,
						backgroundSize: `${celula}px ${celula}px`,
						backgroundPosition: `50% ${(f * celula) / 22}px`,
						WebkitMaskImage: 'linear-gradient(0deg, #000 0%, #000 55%, transparent 100%)',
						maskImage: 'linear-gradient(0deg, #000 0%, #000 55%, transparent 100%)',
					}}
				/>
				{/* Reflexo quente no chão perto do horizonte. */}
				<AbsoluteFill
					style={{
						background: 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(255,170,60,0.35) 0%, transparent 70%)',
						mixBlendMode: 'screen',
					}}
				/>
				<AbsoluteFill style={{background: 'linear-gradient(180deg, transparent 30%, rgba(4,3,2,0.85) 100%)'}} />
			</div>
			{/* Linha do horizonte acesa e reflexo de lente horizontal. */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: hy - 1.5,
					height: 3,
					background:
						'linear-gradient(90deg, transparent 0%, rgba(255,214,140,0.9) 30%, #fff6dc 50%, rgba(255,214,140,0.9) 70%, transparent 100%)',
					boxShadow: '0 0 18px rgba(255,190,80,0.9), 0 0 60px rgba(255,170,60,0.6)',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					left: -width * 0.2,
					right: -width * 0.2,
					top: hy - height * 0.012,
					height: height * 0.024,
					borderRadius: '50%',
					background:
						'radial-gradient(ellipse at center, rgba(255,240,210,0.75) 0%, rgba(255,200,120,0.25) 40%, transparent 70%)',
					filter: `blur(${width * 0.006}px)`,
					opacity: pulsa,
					mixBlendMode: 'screen',
				}}
			/>
		</AbsoluteFill>
	);
};
