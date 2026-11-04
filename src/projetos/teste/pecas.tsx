// Peças do teste: headline traduzida + imagem da Rapunzel no topo (referência do TikTok "grow your hair to your butt by thanksgiving").
import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Pecas} from '../../pecas/peca';
import {inter} from '../../motor/tema';

const lim = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const Headline: Pecas[string] = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps, width} = useVideoConfig();
	const d = (cena.dados ?? {}) as {linhas?: string[]; img?: string};
	const ent = spring({frame, fps, config: {damping: 14, stiffness: 160}});
	const img = spring({frame: frame - 6, fps, config: {damping: 11, stiffness: 140}});
	// Balanço leve contínuo para a imagem não ficar parada.
	const balanco = Math.sin(frame / 18) * 2.5;
	const fs = width * 0.052;
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<div
				style={{
					position: 'absolute',
					top: width * 0.1,
					left: width * 0.06,
					right: width * 0.06,
					display: 'flex',
					alignItems: 'center',
					gap: width * 0.04,
				}}
			>
				<div
					style={{
						flex: 1,
						fontFamily: inter,
						fontWeight: 800,
						fontSize: fs,
						lineHeight: 1.15,
						color: '#fff',
						textShadow: '0 2px 6px rgba(0,0,0,0.85), 0 0 2px rgba(0,0,0,0.9)',
						opacity: ent,
						transform: `translateY(${(1 - ent) * -30}px)`,
					}}
				>
					{(d.linhas ?? []).map((l, i) => (
						<div key={i}>{l}</div>
					))}
				</div>
				<Img
					src={staticFile(d.img ?? '')}
					style={{
						width: width * 0.3,
						borderRadius: width * 0.02,
						boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
						opacity: interpolate(img, [0, 0.3], [0, 1], lim),
						transform: `scale(${0.4 + 0.6 * img}) rotate(${(1 - img) * 12 + balanco}deg)`,
					}}
				/>
			</div>
		</AbsoluteFill>
	);
};

export const pecas: Pecas = {testeHeadline: Headline};
