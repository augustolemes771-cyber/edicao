import React from 'react';
import {AbsoluteFill, interpolate, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import type {EstiloLegenda, Legenda as ConfigLegenda, PaginaLegenda} from '../motor/plano';
import {inter, playfair, poppins} from '../motor/tema';

// Legenda queimada palavra por palavra, aprendida nas três referências:
// cada palavra entra no início da fala com desfoque (10 px → 0), sobe 8 px e assenta;
// a tela inteira sai desfocando quando a próxima começa.
type Visual = {
	fonte: string;
	peso: number;
	tamanho: number;
	cor: string;
	sombra: string;
	corEnfase: string;
	sombraEnfase: string;
	entrelinha: number;
	largura: number;
	caixaAlta?: boolean;
};

const VISUAL: Record<EstiloLegenda, Visual> = {
	// Ref. 3: sans branca bem grossa, ênfase em serifa itálica e vermelho.
	palavra: {
		fonte: inter,
		peso: 800,
		tamanho: 0.062,
		cor: '#ffffff',
		sombra: '0 3px 10px rgba(0,0,0,0.55)',
		corEnfase: '#e3241b',
		sombraEnfase: '0 3px 10px rgba(0,0,0,0.5)',
		entrelinha: 0.92,
		largura: 0.62,
	},
	// Ref. 1: serifa branca, ênfase em itálico dourado com brilho.
	ouro: {
		fonte: playfair,
		peso: 700,
		tamanho: 0.05,
		cor: '#ffffff',
		sombra: '0 2px 12px rgba(0,0,0,0.6)',
		corEnfase: '#f4c95d',
		sombraEnfase: '0 0 10px rgba(255,196,77,0.75), 0 0 28px rgba(255,170,40,0.45)',
		entrelinha: 1.05,
		largura: 0.78,
	},
	// Ref. 2: sans pequena branca; ênfase amarela gigante com glow.
	impacto: {
		fonte: poppins,
		peso: 600,
		tamanho: 0.04,
		cor: '#ffffff',
		sombra: '0 2px 10px rgba(0,0,0,0.6)',
		corEnfase: '#ffd21f',
		sombraEnfase: '0 0 12px rgba(255,200,0,0.8), 0 0 36px rgba(255,170,0,0.5)',
		entrelinha: 1,
		largura: 0.8,
	},
};

const Palavra: React.FC<{
	p: PaginaLegenda['palavras'][number];
	inicioPagina: number;
	visual: Visual;
	estilo: EstiloLegenda;
	base: number;
}> = ({p, inicioPagina, visual, estilo, base}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const local = frame - Math.round((p.inicio - inicioPagina) * fps);
	const ent = interpolate(local, [0, 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const e = p.enfase;
	const serif = e === 'serif' || e === 'cor' || e === 'grande';
	const corEnf = p.cor ?? visual.corEnfase;
	const grande = e === 'grande';
	// Na ref. 2 a ênfase acende: dourado escuro → amarelo vivo em ~10 quadros.
	const acende = interpolate(local, [0, 10], [0.35, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

	let tamanho = base;
	if (serif) tamanho *= estilo === 'impacto' ? 1.9 : 1.15;
	if (grande) tamanho = base * (estilo === 'palavra' ? 1.5 : 1.9);

	const cor =
		e === 'cor' || grande || (estilo !== 'palavra' && serif) ? corEnf : e === 'caixa' ? '#ffffff' : visual.cor;
	const sombra = cor === corEnf && estilo !== 'palavra' ? visual.sombraEnfase : visual.sombra;

	const conteudo = (
		<span
			style={{
				position: 'relative',
				display: 'inline-block',
				fontFamily: serif && !(grande && estilo === 'palavra') ? playfair : visual.fonte,
				fontStyle: serif && !grande ? 'italic' : 'normal',
				fontWeight: serif ? 800 : visual.peso,
				fontSize: tamanho,
				textTransform: grande ? 'uppercase' : undefined,
				color: cor,
				textShadow: sombra,
				opacity: ent * (cor === corEnf && estilo === 'impacto' ? acende : 1),
				filter: ent < 1 ? `blur(${(1 - ent) * 10}px)` : undefined,
				transform: `translateY(${(1 - ent) * 8}px) scale(${1 + (1 - ent) * 0.06})`,
				padding: e === 'caixa' ? '0 0.12em' : undefined,
				zIndex: 1,
			}}
		>
			{e === 'caixa' && (
				<span
					style={{
						position: 'absolute',
						inset: '0.08em 0',
						background: p.cor ?? '#e3241b',
						zIndex: -1,
						transformOrigin: 'left center',
						transform: `scaleX(${interpolate(local, [2, 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})})`,
					}}
				/>
			)}
			{p.texto}
			{e === 'circulo' && <Circulo local={local} cor={p.cor ?? '#3ddc84'} />}
		</span>
	);
	return grande ? <div style={{width: '100%', textAlign: 'center', lineHeight: 1}}>{conteudo}</div> : conteudo;
};

// Elipse feita à mão que se desenha em volta da palavra (ref. 3, "tempo.").
const Circulo: React.FC<{local: number; cor: string}> = ({local, cor}) => {
	const desenho = interpolate(local, [3, 11], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const comprimento = 330;
	return (
		<svg
			viewBox="0 0 120 50"
			preserveAspectRatio="none"
			style={{
				position: 'absolute',
				left: '-0.32em',
				top: '-0.18em',
				width: 'calc(100% + 0.64em)',
				height: '1.45em',
				overflow: 'visible',
			}}
		>
			<path
				d="M8,28 C6,12 40,4 66,5 C96,6 116,14 114,27 C112,41 80,47 54,46 C26,45 6,38 10,24 C12,18 20,13 30,10"
				fill="none"
				stroke={cor}
				strokeWidth={3.2}
				strokeLinecap="round"
				strokeDasharray={comprimento}
				strokeDashoffset={comprimento * (1 - desenho)}
				pathLength={comprimento}
			/>
		</svg>
	);
};

const Pagina: React.FC<{pagina: PaginaLegenda; cfg: ConfigLegenda}> = ({pagina, cfg}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const visual = VISUAL[cfg.estilo];
	const curto = Math.min(width, height);
	const base = visual.tamanho * (width < height ? width : curto * 1.25);
	const duracao = Math.round((pagina.ate - pagina.de) * fps);
	const saida = interpolate(frame, [duracao - 4, duracao], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const altura = cfg.altura ?? (width < height ? 0.6 : 0.8);
	return (
		<AbsoluteFill style={{alignItems: 'center'}}>
			<div
				style={{
					position: 'absolute',
					top: `${altura * 100}%`,
					transform: 'translateY(-50%)',
					width: width * visual.largura,
					display: 'flex',
					flexWrap: 'wrap',
					justifyContent: 'center',
					alignItems: 'baseline',
					columnGap: base * 0.26,
					lineHeight: visual.entrelinha,
					textAlign: 'center',
					opacity: 1 - saida,
					filter: saida > 0 ? `blur(${saida * 10}px)` : undefined,
				}}
			>
				{pagina.palavras.map((p) => (
					<Palavra key={p.indice} p={p} inicioPagina={pagina.de} visual={visual} estilo={cfg.estilo} base={base} />
				))}
			</div>
		</AbsoluteFill>
	);
};

export const Legenda: React.FC<{paginas: PaginaLegenda[]; cfg: ConfigLegenda}> = ({paginas, cfg}) => {
	const {fps} = useVideoConfig();
	return (
		<>
			{paginas.map((pg) => (
				<Sequence
					key={pg.palavras[0].indice}
					from={Math.round(pg.de * fps)}
					durationInFrames={Math.max(1, Math.round((pg.ate - pg.de) * fps))}
					name={`legenda: ${pg.palavras.map((p) => p.texto).join(' ')}`}
					layout="none"
				>
					<Pagina pagina={pg} cfg={cfg} />
				</Sequence>
			))}
		</>
	);
};
