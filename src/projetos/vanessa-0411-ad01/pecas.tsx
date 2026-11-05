// Peças do vanessa-0411-ad01: tela dividida com foto em cima (abertura) e seta para o botão laranja.
import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Pecas} from '../../pecas/peca';

const PASTA = 'projetos/vanessa-0411-ad01/';

// Metade de cima com a foto (troca seca em cada item), a criadora continua visível embaixo.
const TelaDivididaAd01: Pecas[string] = ({cena}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const itens = (cena.dados?.itens ?? []) as {src: string; em: number}[];
	const t = f / fps + cena.de;
	let atual = 0;
	itens.forEach((it, i) => {
		if (t >= it.em) atual = i;
	});
	const it = itens[atual];
	const inicio = Math.max(0, (it.em - cena.de) * fps);
	const s = spring({frame: f - inicio, fps, config: {damping: 14, stiffness: 180}});
	const entrada = spring({frame: f, fps, config: {damping: 20}});
	return (
		<AbsoluteFill>
			<div
				style={{
					position: 'absolute',
					left: 0,
					top: 0,
					width: '100%',
					height: '46%',
					background: '#fff',
					overflow: 'hidden',
					transform: `translateY(${interpolate(entrada, [0, 1], [-100, 0])}%)`,
					borderBottom: '6px solid #fff',
					boxShadow: '0 10px 40px rgba(0,0,0,.35)',
				}}
			>
				<Img
					src={staticFile(PASTA + it.src)}
					style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${interpolate(s, [0, 1], [1.18, 1])})`}}
				/>
			</div>
		</AbsoluteFill>
	);
};

// Foto do produto pulando no terço de cima (B-roll quando não há tomada do produto).
const ProdutoAd01: Pecas[string] = ({cena}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const s = spring({frame: f, fps, config: {damping: 12, stiffness: 160}});
	const fl = Math.sin(f / 10) * 8;
	return (
		<AbsoluteFill>
			<div
				style={{
					position: 'absolute',
					left: '50%',
					top: '7%',
					width: 520,
					height: 520,
					marginLeft: -260,
					borderRadius: 40,
					overflow: 'hidden',
					background: '#fff',
					boxShadow: '0 20px 60px rgba(0,0,0,.45)',
					transform: `translateY(${fl}px) scale(${s})`,
				}}
			>
				<Img src={staticFile(PASTA + String(cena.dados?.src ?? 'produto.jpg'))} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
			</div>
		</AbsoluteFill>
	);
};

// Seta laranja pulsando para o botão do TikTok Shop (canto de baixo, à esquerda), até o fim.
const SetaLaranjaAd01: Pecas[string] = () => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const s = spring({frame: f, fps, config: {damping: 10}});
	const pulo = Math.abs(Math.sin(f / 6)) * 34;
	return (
		<AbsoluteFill>
			<div style={{position: 'absolute', left: 150, top: 1380 + pulo, transform: `scale(${s}) rotate(-20deg)`, transformOrigin: 'center'}}>
				<svg width="200" height="260" viewBox="0 0 100 130">
					<path d="M35 0 H65 V80 H92 L50 128 L8 80 H35 Z" fill="#ff6a00" stroke="#fff" strokeWidth="5" strokeLinejoin="round" />
				</svg>
			</div>
		</AbsoluteFill>
	);
};

export const pecas: Pecas = {TelaDivididaAd01, ProdutoAd01, SetaLaranjaAd01};
