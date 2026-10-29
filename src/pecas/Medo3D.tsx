// pessoa: silhueta presa no medo embaixo do texto (pedido do usuário: "uma pessoa presa no medo").
// "Medo" sem glitch (pedido do usuário, 28/10/2026, depoimento-2: gostou do tempo e do texto, não do glitch): o vídeo escurece
// em roxo e uma vinheta vai fechando devagar em volta do texto (o medo aperta); cada linha bate em texto 3D de verdade no seu
// tempo (primeira em branco metálico, a última em ouro), com onda e faíscas, e o bloco recua um pouco enquanto a vinheta fecha,
// como quem dá um passo para trás. Esconde a legenda.
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import type {CenaNoPlano} from '../motor/plano';
import {Faiscas, Linha3D, Luzes, Onda} from './tres/Texto3D';

type Cena = Extract<CenaNoPlano, {tipo: 'medo3d'}>;

// Silhueta de pessoa de cabeça baixa (caixa 200x420, pés em y 420).
const CORPO =
	'M 70 104 Q 100 92 130 104 L 150 122 Q 161 138 158 200 L 152 272 Q 149 282 143 277 L 140 206 L 136 242 L 134 410 Q 132 420 120 420 L 108 420 L 104 292 L 96 292 L 92 420 L 80 420 Q 68 420 66 410 L 64 242 L 60 206 L 57 277 Q 51 282 48 272 L 42 200 Q 39 138 50 122 Z';

// Pessoa presa no medo: luz quente de cima, poça escura no chão, tentáculos de sombra que sobem e se enrolam nas pernas e na
// cintura, a sombra na parede que cresce até ficar enorme, e a pessoa que tenta dar um passo e é puxada de volta.
const PessoaPresa: React.FC<{fim: number}> = ({fim}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const cx = 540;
	const chao = 1400;
	const esc = 1.05;
	const cresce = interpolate(frame, [4, fim * 0.75], [0, 1], {...lim, easing: (x) => 1 - (1 - x) * (1 - x)});
	const sombra = interpolate(frame, [0, fim], [1.1, 2.5], {...lim, easing: (x) => x * x * (3 - 2 * x)});
	// Tenta andar (inclina para a frente) e é puxada de volta.
	const tenta = Math.max(0, Math.sin(Math.min(1, frame / (fim * 0.8)) * Math.PI * 2)) * 5 * (1 - cresce * 0.4);
	const tremor = Math.sin(frame * 1.7) * 1.2 * cresce;
	const corpo = (opac: number, filtro?: string) => (
		<g transform={`translate(${cx - 100 * esc} ${chao - 420 * esc}) scale(${esc}) rotate(${tenta + tremor * 0.3} 100 420)`} opacity={opac} style={filtro ? {filter: filtro} : undefined}>
			<circle cx={106} cy={58} r={34} fill="url(#medoPele)" stroke="rgba(232,194,122,0.75)" strokeWidth={2.4} />
			<path d={CORPO} fill="url(#medoPele)" stroke="rgba(232,194,122,0.75)" strokeWidth={2.4} strokeLinejoin="round" />
		</g>
	);
	const tentaculos = Array.from({length: 9}, (_, k) => {
		const lado = k % 2 ? 1 : -1;
		const base = cx + (k - 4) * 62;
		const alvoY = chao - (70 + (k % 3) * 95) * esc;
		const alvoX = cx + lado * (34 + (k % 3) * 14);
		const ond = Math.sin(t * 3 + k) * 26;
		return `M ${base} ${chao + 20} C ${base + ond} ${chao - 120}, ${alvoX - lado * 120 + ond} ${alvoY + 60}, ${alvoX + lado * 10} ${alvoY} S ${alvoX - lado * 70} ${alvoY - 40}, ${alvoX - lado * 40} ${alvoY - 70}`;
	});
	return (
		<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
			<defs>
				<linearGradient id="medoPele" x1="0" y1="0" x2="1" y2="0">
					<stop offset="0" stopColor="#07030f" />
					<stop offset="0.7" stopColor="#140a2a" />
					<stop offset="1" stopColor="#3a2a1a" />
				</linearGradient>
				<radialGradient id="medoLuz" cx="0.5" cy="0" r="1">
					<stop offset="0" stopColor="rgba(255,214,150,0.38)" />
					<stop offset="0.6" stopColor="rgba(232,194,122,0.08)" />
					<stop offset="1" stopColor="rgba(232,194,122,0)" />
				</radialGradient>
				<radialGradient id="medoPoca" cx="0.5" cy="0.5" r="0.5">
					<stop offset="0" stopColor="rgba(2,0,6,0.95)" />
					<stop offset="1" stopColor="rgba(2,0,6,0)" />
				</radialGradient>
			</defs>
			{/* Sombra gigante na parede: o medo maior que a pessoa. */}
			<g transform={`translate(${cx} ${chao - 30}) scale(${sombra}) translate(${-cx} ${-(chao - 30)})`}>
				<g transform={`translate(${cx - 100 * esc + 30} ${chao - 30 - 420 * esc}) scale(${esc})`} opacity={0.5} style={{filter: 'blur(5px)'}}>
					<circle cx={106} cy={58} r={34} fill="#030108" />
					<path d={CORPO} fill="#030108" />
				</g>
			</g>
			{/* Cone de luz quente de cima. */}
			<path d={`M ${cx - 70} 560 L ${cx + 70} 560 L ${cx + 300} ${chao + 40} L ${cx - 300} ${chao + 40} Z`} fill="url(#medoLuz)" opacity={0.9} />
			<ellipse cx={cx} cy={chao + 8} rx={150 + 160 * cresce} ry={26 + 22 * cresce} fill="url(#medoPoca)" />
			{corpo(1)}
			{/* Tentáculos: corpo escuro grosso + fio violeta que dá o contorno. */}
			{tentaculos.map((d, k) => {
				const atraso = (k % 4) * 0.08;
				const g = interpolate(cresce, [atraso, Math.min(1, atraso + 0.75)], [0, 1], lim);
				return (
					<g key={k}>
						<path d={d} fill="none" stroke="#05020c" strokeWidth={22 - (k % 3) * 4} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - g} />
						<path d={d} fill="none" stroke="rgba(170,120,255,0.55)" strokeWidth={2.5} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - g} />
					</g>
				);
			})}
		</svg>
	);
};
const lim = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const Medo3D: React.FC<{cena: Cena}> = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const fim = Math.round((cena.ate - cena.de) * fps);
	const fundo = interpolate(frame, [0, 5, fim - 5, fim], [0, 1, 1, 0], lim);
	// Vinheta: abre larga e fecha até ~55% ao longo da cena.
	const fecha = interpolate(frame, [0, fim], [0, 1], {...lim, easing: (x) => 1 - (1 - x) * (1 - x)});
	const raio = 95 - 40 * fecha;
	const recua = 1 - 0.07 * fecha;
	const meia = 14.5 * Math.tan((35 / 2) * (Math.PI / 180));
	const yMundo = (px: number) => ((height / 2 - px) / (height / 2)) * meia;
	const batidas = cena.linhas.map((l) => Math.round(Math.max(0, l.em - cena.de) * fps));
	const topo = cena.y ?? 860 - ((cena.linhas.length - 1) * 190) / 2;
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: fundo}}>
			<AbsoluteFill style={{background: cena.pessoa ? 'radial-gradient(ellipse at 50% 55%, rgba(40,20,78,0.96) 0%, rgba(14,6,30,0.98) 70%)' : 'rgba(24,11,48,0.78)'}} />
			{cena.pessoa ? <PessoaPresa fim={fim} /> : null}
			<AbsoluteFill style={{background: `radial-gradient(ellipse ${raio}% ${raio * 0.7}% at 50% ${cena.pessoa ? 52 : (topo / height) * 100 + 4}%, rgba(10,4,24,0) ${cena.pessoa ? 50 : 35}%, rgba(6,2,16,0.97) 100%)`}} />
			<AbsoluteFill style={{transform: `scale(${recua})`, filter: 'drop-shadow(0 20px 26px rgba(4,1,12,0.75))'}}>
				<ThreeCanvas
					width={width}
					height={height}
					gl={{alpha: true, antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05}}
					camera={{fov: 35, position: [0, 0, 14.5], near: 0.1, far: 60}}
					style={{position: 'absolute', inset: 0}}
				>
					<Luzes quadro={frame} batidas={batidas} />
					{cena.linhas.map((l, i) => {
						const y = yMundo(topo + i * 190);
						const ultima = i === cena.linhas.length - 1;
						return (
							<React.Fragment key={i}>
								<Linha3D texto={l.texto} metal={l.metal ?? (ultima ? 'ouro' : 'branco')} largura={l.largura ?? (l.texto.length <= 5 ? 3.4 : 4.6)} y={y} quadro={frame} batida={batidas[i]} profundidade={0.32} />
								<Onda quadro={frame} inicio={batidas[i]} y={y} cor={ultima ? '#ffd27a' : '#d9d2ff'} tamanho={2.4} />
								<Faiscas quadro={frame} inicio={batidas[i]} y={y} cor={ultima ? '#ffd27a' : '#e6e0ff'} largura={4} />
							</React.Fragment>
						);
					})}
				</ThreeCanvas>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
