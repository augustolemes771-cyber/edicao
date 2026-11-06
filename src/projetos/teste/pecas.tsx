// Peças do teste: headline traduzida + imagem da Rapunzel (referência do TikTok "grow your hair to your butt by thanksgiving").
// Layout da referência: texto branco centralizado no topo (~17% da altura), em duas linhas; a imagem fica logo abaixo da
// primeira linha, à direita do centro (de 58% a 86% da largura), com a segunda linha encostando na borda esquerda dela.
import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Pecas} from '../../pecas/peca';
import {inter} from '../../motor/tema';

const lim = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const Headline: Pecas[string] = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const d = (cena.dados ?? {}) as {linhas?: string[]; img?: string};
	const ent = spring({frame, fps, config: {damping: 14, stiffness: 160}});
	const img = spring({frame: frame - 5, fps, config: {damping: 12, stiffness: 150}});
	const fs = width * 0.045;
	const topo = height * 0.17;
	const fim = Math.round((cena.ate - cena.de) * fps);
	const saida = interpolate(frame, [fim - 8, fim], [1, 0], lim);
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: saida}}>
			<Img
				src={staticFile(d.img ?? '')}
				style={{
					position: 'absolute',
					left: width * 0.58,
					top: topo + fs * 1.25,
					width: width * 0.28,
					opacity: interpolate(img, [0, 0.3], [0, 1], lim),
					transform: `scale(${0.6 + 0.4 * img})`,
					transformOrigin: 'top left',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					top: topo,
					left: 0,
					right: 0,
					textAlign: 'center',
					fontFamily: inter,
					fontWeight: 700,
					fontSize: fs,
					lineHeight: 1.25,
					color: '#fff',
					textShadow: '0 1px 4px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,0.8)',
					opacity: ent,
				}}
			>
				{(d.linhas ?? []).map((l, i) => (
					<div key={i}>{l}</div>
				))}
			</div>
		</AbsoluteFill>
	);
};

export const pecas: Pecas = {testeHeadline: Headline};
