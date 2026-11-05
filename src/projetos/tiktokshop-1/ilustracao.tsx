// Sistema visual do tiktokshop-1: estilo "notícia com prova real" (fundo escuro, número de impacto em
// rosa/magenta, print de manchete real como evidência, gráfico ranqueado, CTA fixo) — baseado na análise
// do Reel de referência (Google perdeu meio trilhão). Tudo em SVG/CSS via React, sem WebGL.
import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {CenaPeca, Pecas} from '../../pecas/peca';

export const lim = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const fonte = 'Poppins, Montserrat, sans-serif';

export const COR = {
	fundo1: '#0a0d18',
	fundo2: '#141a2e',
	rosa: '#ff2d6f',
	rosaClaro: '#ff6b9d',
	branco: '#f5f6fa',
	cinza: '#9aa0b4',
	verde: '#3ddc84',
	cartaoFundo: '#ffffff',
	cartaoTexto: '#1a1d2b',
};

export const usePeca = (cena: CenaPeca) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const q = (s: unknown) => Math.round(Math.max(0, Number(s) - cena.de) * fps);
	const mola = (em: number, rigidez = 140, amort = 16) => spring({frame: frame - em, fps, config: {damping: amort, stiffness: rigidez}});
	const sobe = (a: number, b: number) => interpolate(frame, [a, b], [0, 1], lim);
	return {frame, fps, t, q, mola, sobe};
};

export const Camera: React.FC<{cena: CenaPeca; zoom?: [number, number]; x?: [number, number]; y?: [number, number]; children: React.ReactNode}> = ({
	cena,
	zoom = [1, 1.12],
	x = [0, 0],
	y = [0, 0],
	children,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const dur = Math.max(1, Math.round((cena.ate - cena.de) * fps));
	const p = interpolate(frame, [0, dur], [0, 1], lim);
	const s = zoom[0] + (zoom[1] - zoom[0]) * p;
	const tx = x[0] + (x[1] - x[0]) * p;
	const ty = y[0] + (y[1] - y[0]) * p;
	return <div style={{position: 'absolute', inset: 0, transform: `scale(${s}) translate(${tx}px, ${ty}px)`, transformOrigin: '50% 50%'}}>{children}</div>;
};

export const Vinheta: React.FC<{forca?: number}> = ({forca = 0.45}) => (
	<div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 45%, transparent 40%, rgba(0,0,0,${forca}) 100%)`, pointerEvents: 'none'}} />
);

export const Fundo: React.FC<{children?: React.ReactNode}> = ({children}) => (
	<div style={{position: 'absolute', inset: 0, background: `linear-gradient(165deg, ${COR.fundo2} 0%, ${COR.fundo1} 70%)`, overflow: 'hidden'}}>
		{/* grade sutil de pontos, textura de fundo de "dashboard" */}
		<div
			style={{
				position: 'absolute',
				inset: 0,
				backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)`,
				backgroundSize: '46px 46px',
				opacity: 0.6,
			}}
		/>
		{children}
	</div>
);

// Número de impacto gigante + rótulo (ex.: "R$ 5,3 BI" / "EM VENDAS").
export const Numero: React.FC<{valor: string; rotulo: string; p: number; cor?: string; top?: number; tamanho?: number}> = ({
	valor,
	rotulo,
	p,
	cor = COR.rosa,
	top = 220,
	tamanho = 150,
}) => {
	if (p <= 0.001) return null;
	return (
		<div style={{position: 'absolute', top, width: '100%', textAlign: 'center', opacity: Math.min(1, p * 1.6), transform: `translateY(${(1 - p) * 30}px) scale(${0.8 + 0.2 * p})`}}>
			<div style={{fontFamily: fonte, fontWeight: 800, fontSize: tamanho, lineHeight: 1, color: cor, textShadow: `0 0 40px ${cor}55`}}>{valor}</div>
			<div style={{marginTop: 14, fontFamily: fonte, fontWeight: 700, fontSize: 32, letterSpacing: '0.06em', color: COR.branco}}>{rotulo}</div>
		</div>
	);
};

// Texto grande central (frase de impacto, sem número).
export const TextoGrande: React.FC<{texto: string; p: number; cor?: string; tamanho?: number}> = ({texto, p, cor = COR.branco, tamanho = 68}) => (
	<div
		style={{
			position: 'absolute',
			inset: 0,
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			opacity: Math.min(1, p * 1.6),
			transform: `scale(${0.85 + 0.15 * p})`,
			textAlign: 'center',
			padding: '0 56px',
		}}
	>
		<div style={{fontFamily: fonte, fontWeight: 800, fontSize: tamanho, color: cor, lineHeight: 1.15}}>{texto}</div>
	</div>
);

// Cartão de data (calendário), ex.: "QUINTA-FEIRA".
export const CartaoData: React.FC<{texto: string; p: number; y?: number}> = ({texto, p, y = 300}) => (
	<div
		style={{
			position: 'absolute',
			left: '50%',
			top: y,
			transform: `translate(-50%, ${(1 - p) * 30}px) scale(${0.85 + 0.15 * p})`,
			opacity: Math.min(1, p * 1.5),
			width: 220,
			borderRadius: 18,
			overflow: 'hidden',
			boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
		}}
	>
		<div style={{background: COR.rosa, color: COR.branco, fontFamily: fonte, fontWeight: 800, fontSize: 22, letterSpacing: '0.08em', textAlign: 'center', padding: '10px 0'}}>{texto}</div>
		<div style={{background: COR.cartaoFundo, height: 130}} />
	</div>
);

// Cartão de "evidência" — print de manchete real (mockup de navegador/app), pra dar credibilidade.
export const CartaoNoticia: React.FC<{
	categoria: string;
	titulo: string;
	fonteTexto: string;
	destaque?: string;
	p: number;
	y?: number;
	largura?: number;
}> = ({categoria, titulo, fonteTexto, destaque, p, y = 420, largura = 620}) => {
	if (p <= 0.001) return null;
	const partes = destaque ? titulo.split(destaque) : [titulo];
	return (
		<div
			style={{
				position: 'absolute',
				left: '50%',
				top: y,
				transform: `translate(-50%, ${(1 - p) * 40}px) scale(${0.85 + 0.15 * p})`,
				opacity: Math.min(1, p * 1.5),
				width: largura,
				borderRadius: 16,
				overflow: 'hidden',
				background: COR.cartaoFundo,
				boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
			}}
		>
			<div style={{padding: '14px 24px 6px', fontFamily: fonte, fontWeight: 700, fontSize: 18, color: '#5a6b8c'}}>{categoria}</div>
			<div style={{padding: '0 24px 18px', fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 30, color: COR.cartaoTexto, lineHeight: 1.25}}>
				{destaque
					? partes.map((parte, i) => (
							<React.Fragment key={i}>
								{parte}
								{i < partes.length - 1 && <span style={{background: COR.rosaClaro, color: COR.cartaoTexto}}>{destaque}</span>}
							</React.Fragment>
					  ))
					: titulo}
			</div>
			<div style={{padding: '0 24px 16px', fontFamily: fonte, fontWeight: 600, fontSize: 15, color: '#8a93ab'}}>{fonteTexto}</div>
		</div>
	);
};

// Gráfico de barras ranqueado, com uma barra em destaque (ex.: ranking de criadores/lives).
export const GraficoRanking: React.FC<{
	titulo: string;
	itens: {rotulo: string; valor: number; destaque?: boolean}[];
	p: number;
	y?: number;
}> = ({titulo, itens, p, y = 420}) => {
	if (p <= 0.001) return null;
	const max = Math.max(...itens.map((i) => i.valor));
	return (
		<div style={{position: 'absolute', left: '50%', top: y, transform: `translate(-50%, ${(1 - p) * 30}px)`, opacity: Math.min(1, p * 1.5), width: 640}}>
			<div style={{fontFamily: fonte, fontWeight: 700, fontSize: 20, color: COR.cinza, marginBottom: 14, textAlign: 'center'}}>{titulo}</div>
			{itens.map((item, i) => {
				const largura = Math.max(6, (item.valor / max) * 100 * Math.min(1, p * 1.8 - i * 0.12));
				return (
					<div key={i} style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10}}>
						<div style={{width: 140, minWidth: 0, flexShrink: 0, fontFamily: fonte, fontWeight: 700, fontSize: 15, color: COR.branco, textAlign: 'right', lineHeight: 1.2}}>{item.rotulo}</div>
						<div style={{flex: 1, height: 28, background: 'rgba(255,255,255,0.08)', borderRadius: 6, overflow: 'hidden'}}>
							<div
								style={{
									width: `${Math.max(0, Math.min(100, largura))}%`,
									height: '100%',
									background: item.destaque ? COR.rosa : COR.cinza,
									borderRadius: 6,
								}}
							/>
						</div>
					</div>
				);
			})}
		</div>
	);
};

// CTA fixo (pílula no rodapé) — chamada pra virar creator.
export const CTAFixo: React.FC<{texto: string; p: number}> = ({texto, p}) => {
	if (p <= 0.001) return null;
	return (
		<div style={{position: 'absolute', bottom: 90, width: '100%', textAlign: 'center', opacity: Math.min(1, p * 1.6), transform: `translateY(${(1 - p) * 20}px)`}}>
			<span
				style={{
					display: 'inline-block',
					padding: '16px 36px',
					borderRadius: 50,
					background: COR.rosa,
					color: COR.branco,
					fontFamily: fonte,
					fontWeight: 800,
					fontSize: 26,
					letterSpacing: '0.02em',
					boxShadow: '0 16px 40px rgba(255,45,111,0.4)',
				}}
			>
				{texto}
			</span>
		</div>
	);
};

export const pecasBase: Partial<Pecas> = {};
