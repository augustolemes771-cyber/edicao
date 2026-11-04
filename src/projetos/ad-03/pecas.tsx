// Peças do ad-03: o vídeo do melão na metade de cima, em loop contínuo no tempo EDITADO (fora dos cortes da fala,
// senão cada corte de respiro fazia o melão pular e parecia travado).
import React from 'react';
import {AbsoluteFill, Loop, OffthreadVideo, staticFile, useVideoConfig} from 'remotion';
import type {Pecas} from '../../pecas/peca';

const DURACAO_CIMA = 22.1; // s de cima-960.mp4

const Cima: Pecas[string] = () => {
	const {fps, width, height} = useVideoConfig();
	return (
		<AbsoluteFill>
			<div style={{position: 'absolute', top: 0, left: 0, width, height: height / 2, overflow: 'hidden', background: '#000'}}>
				<Loop durationInFrames={Math.round(DURACAO_CIMA * fps)}>
					<OffthreadVideo src={staticFile('projetos/ad-03/cima-960.mp4')} muted style={{width, height: height / 2, objectFit: 'cover'}} />
				</Loop>
			</div>
		</AbsoluteFill>
	);
};

export const pecas: Pecas = {ad03Cima: Cima};
