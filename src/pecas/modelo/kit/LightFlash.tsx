// Clarão de luz do kit do modelo: varredura branca quente de 8 quadros, pico 0,55 no segundo t.
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FPS, clamp} from '../fx3d';

export const FlashAt: React.FC<{t: number}> = ({t}) => {
	const now = useCurrentFrame() / FPS;
	const o = interpolate(now, [t - 2 / FPS, t, t + 6 / FPS], [0, 0.55, 0], clamp);
	if (o <= 0) return null;
	return <AbsoluteFill style={{opacity: o, background: 'radial-gradient(circle at 50% 40%, #FFF8EA 0%, #FFEFD2 60%, #F8E3B8 100%)', mixBlendMode: 'screen'}} />;
};
