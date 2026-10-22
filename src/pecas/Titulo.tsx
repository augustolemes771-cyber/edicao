import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {brilho, cor, poppins} from '../motor/tema';

// Divide "texto com *destaque*" em palavras marcadas.
export const tokens = (texto: string) => {
	const saida: {palavra: string; destaque: boolean}[] = [];
	let destaque = false;
	for (const parte of texto.split(/(\*)/)) {
		if (parte === '*') {
			destaque = !destaque;
			continue;
		}
		for (const palavra of parte.split(/\s+/).filter(Boolean)) saida.push({palavra, destaque});
	}
	return saida;
};

// Título branco com glow e franja RGB. Sobre o verde, o destaque sai em preto;
// sobre o branco (uso pontual), texto preto e destaque verde.
export const Titulo: React.FC<{
	texto: string;
	tamanho?: number;
	fundo?: 'escuro' | 'verde' | 'branco';
	// Quadro local de entrada de cada palavra; sem isso, entram em cascata.
	quadros?: number[];
	alinhar?: 'center' | 'left';
}> = ({texto, tamanho = 112, fundo = 'escuro', quadros, alinhar = 'center'}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const lista = tokens(texto);
	const sobreVerde = fundo !== 'escuro';
	const corBase = fundo === 'branco' ? cor.preto : cor.branco;
	const corDestaque = fundo === 'branco' ? cor.verde : fundo === 'verde' ? cor.preto : cor.destaque;

	return (
		<div
			style={{
				fontFamily: poppins,
				fontWeight: 800,
				fontSize: tamanho,
				lineHeight: 1.08,
				letterSpacing: -tamanho * 0.025,
				textAlign: alinhar,
				display: 'flex',
				flexWrap: 'wrap',
				justifyContent: alinhar === 'center' ? 'center' : 'flex-start',
				columnGap: tamanho * 0.26,
			}}
		>
			{lista.map(({palavra, destaque}, i) => {
				const inicio = quadros?.[i] ?? i * 2;
				const p = spring({frame: frame - inicio, fps, config: {damping: 14, stiffness: 200, mass: 0.55}});
				const franja = interpolate(p, [0, 1], [9, sobreVerde ? 0 : 1.8]);
				const corTexto = destaque ? corDestaque : corBase;
				const sombra = sobreVerde
					? destaque || fundo === 'branco'
						? 'none'
						: '0 0 18px rgba(255,255,255,0.35)'
					: destaque
						? brilho(cor.halo, 1.1)
						: '0 0 10px rgba(255,255,255,0.55), 0 0 32px rgba(255,255,255,0.22)';
				const estiloCamada: React.CSSProperties = {position: 'absolute', inset: 0, mixBlendMode: 'screen'};
				return (
					<span
						key={i}
						style={{
							position: 'relative',
							display: 'inline-block',
							opacity: p,
							transform: `translateY(${(1 - p) * tamanho * 0.45}px) scale(${0.85 + 0.15 * p})`,
							filter: p < 0.98 ? `blur(${(1 - p) * 8}px)` : undefined,
						}}
					>
						{!sobreVerde && (
							<>
								<span
									style={{
										...estiloCamada,
										color: cor.franjaVermelha,
										transform: `translateX(${-franja}px)`,
										opacity: 0.8,
									}}
								>
									{palavra}
								</span>
								<span
									style={{...estiloCamada, color: cor.franjaAzul, transform: `translateX(${franja}px)`, opacity: 0.8}}
								>
									{palavra}
								</span>
							</>
						)}
						<span style={{position: 'relative', color: corTexto, textShadow: sombra}}>{palavra}</span>
					</span>
				);
			})}
		</div>
	);
};
