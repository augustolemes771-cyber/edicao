// Efeitos de impacto reutilizáveis (tema dor/revolta/choque). Todos usam só o quadro atual da cena (useCurrentFrame),
// então basta montar dentro de uma <Sequence> ou cena. Props simples, valores em quadros/pixels de 1080x1920.
import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';

const lim = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// 0→1 na entrada e 1→0 na saída da cena (dur em segundos; 0 = sem saída).
export const useEnvelope = (dur: number, rampa = 6) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const fim = Math.round(dur * fps);
	const entra = interpolate(frame, [0, rampa], [0, 1], lim);
	return dur > 0 ? entra * interpolate(frame, [fim - rampa, fim], [1, 0], lim) : entra;
};

// Aberração cromática: franjas vermelha e ciano deslocadas nos lados do conteúdo. px = deslocamento.
export const AberracaoCromatica: React.FC<{px?: number; children: React.ReactNode}> = ({px = 4, children}) => (
	<AbsoluteFill style={{filter: `drop-shadow(${px}px 0 0 rgba(255,30,60,0.8)) drop-shadow(${-px}px 0 0 rgba(0,200,255,0.55))`}}>{children}</AbsoluteFill>
);

// Tremida: o conteúdo sacode a cada quadro; glitch = chance (0-1) de um salto lateral brusco; pulso = batida que cresce o conteúdo.
export const Tremida: React.FC<{forca?: number; glitch?: number; pulso?: boolean; semente?: string; children: React.ReactNode}> = ({
	forca = 1,
	glitch = 0.18,
	pulso = true,
	semente = 't',
	children,
}) => {
	const frame = useCurrentFrame();
	const dx = (random(`${semente}dx${frame}`) - 0.5) * 14 * forca;
	const dy = (random(`${semente}dy${frame}`) - 0.5) * 10 * forca;
	const salto = random(`${semente}g${Math.floor(frame / 3)}`) > 1 - glitch ? (random(`${semente}gx${frame}`) - 0.5) * 40 * forca : 0;
	const bate = pulso ? Math.exp(-((frame % 20) / 20) * 5) : 0;
	return <AbsoluteFill style={{transform: `translate(${dx + salto}px, ${dy}px) scale(${1 + 0.03 * bate * forca})`}}>{children}</AbsoluteFill>;
};

// Vinheta que pulsa como batimento (bpm). cor = 'r,g,b'. Fica em cima do conteúdo (multiply).
export const VinhetaPulsante: React.FC<{cor?: string; bpm?: number; forca?: number; dur?: number}> = ({cor = '140,0,25', bpm = 90, forca = 1, dur = 0}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const env = useEnvelope(dur);
	const periodo = (60 / bpm) * fps;
	const pulso = Math.exp(-((frame % periodo) / periodo) * 5);
	const a = Math.min(1, (0.5 + 0.3 * pulso) * forca);
	return (
		<AbsoluteFill
			style={{opacity: env, pointerEvents: 'none', mixBlendMode: 'multiply', background: `radial-gradient(ellipse at 50% 50%, rgba(${cor},0) 25%, rgba(${cor},${a}) 80%, rgba(20,0,5,0.95) 100%)`}}
		/>
	);
};

// Fatias de glitch: faixas horizontais coloridas que piscam e saltam. n = faixas; chance = frequência dos cortes.
export const CortesGlitch: React.FC<{n?: number; chance?: number}> = ({n = 5, chance = 0.25}) => {
	const frame = useCurrentFrame();
	const {width, height} = useVideoConfig();
	const f = Math.floor(frame / 2);
	if (random(`cg${f}`) > chance) return null;
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			{Array.from({length: n}, (_, i) => {
				const y = random(`cy${f}${i}`) * height;
				const h = 6 + random(`ch${f}${i}`) * 50;
				const x = (random(`cx${f}${i}`) - 0.5) * 120;
				const cor = random(`cc${f}${i}`) > 0.5 ? 'rgba(255,30,60,0.35)' : 'rgba(0,200,255,0.3)';
				return <div key={i} style={{position: 'absolute', left: x, top: y, width, height: h, background: cor, mixBlendMode: 'screen'}} />;
			})}
		</AbsoluteFill>
	);
};

// Pacote pronto "dor/revolta": tremida + aberração + vinheta + cortes de glitch sobre o conteúdo. dur em segundos.
export const ImpactoDor: React.FC<{dur: number; forca?: number; children: React.ReactNode}> = ({dur, forca = 1, children}) => {
	const env = useEnvelope(dur);
	return (
		<AbsoluteFill>
			<Tremida forca={forca * env}>
				<AberracaoCromatica px={4 * env}>{children}</AberracaoCromatica>
			</Tremida>
			<VinhetaPulsante dur={dur} forca={forca} />
			<div style={{opacity: env}}>
				<CortesGlitch />
			</div>
		</AbsoluteFill>
	);
};
