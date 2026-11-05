// Sistema visual do tiktokshop-1: estilo "notícia com prova real" (fundo escuro, número de impacto em
// rosa/magenta, print de manchete real como evidência, gráfico ranqueado, CTA fixo) — baseado na análise
// do Reel de referência (Google perdeu meio trilhão). Tudo em SVG/CSS via React, sem WebGL.
import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Objeto3D} from '../../pecas/tres/Objetos3D';
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

// Linha de gráfico (tipo bolsa de valores) desenhando sozinha no fundo, sobe e desce com leve tremor.
// Caprichado: preenchimento em gradiente sob a linha + brilho (glow) na linha + uma segunda linha
// mais fraca (tipo "média móvel") pra dar profundidade de gráfico financeiro de verdade.
const GraficoFundo: React.FC = () => {
	const frame = useCurrentFrame();
	const gerar = (fase: number, amplitude: number) =>
		Array.from({length: 24}).map((_, i) => {
			const baseY = 1500 - i * 28 + Math.sin(i * 1.3 + fase) * 60;
			const anim = Math.sin(frame * 0.015 + i * 0.5 + fase) * amplitude;
			return [i * 52 - 60, Math.max(820, baseY + anim)] as [number, number];
		});
	const pontos = gerar(0, 18);
	const pontos2 = gerar(1.4, 10);
	const linha = (pts: [number, number][]) => pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
	const d = linha(pontos);
	const d2 = linha(pontos2);
	const area = `${d} L${pontos[pontos.length - 1][0]},1920 L${pontos[0][0]},1920 Z`;
	return (
		<svg style={{position: 'absolute', inset: 0, opacity: 0.3}} width={1080} height={1920} viewBox="0 0 1080 1920" preserveAspectRatio="none">
			<defs>
				<linearGradient id="areaGrafico" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor={COR.rosa} stopOpacity={0.35} />
					<stop offset="100%" stopColor={COR.rosa} stopOpacity={0} />
				</linearGradient>
				<filter id="glowLinha" x="-50%" y="-50%" width="200%" height="200%">
					<feGaussianBlur stdDeviation="6" result="blur" />
					<feMerge>
						<feMergeNode in="blur" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
			</defs>
			<path d={area} fill="url(#areaGrafico)" />
			<path d={d2} fill="none" stroke={COR.verde} strokeWidth={2} opacity={0.5} />
			<path d={d} fill="none" stroke={COR.rosa} strokeWidth={4} filter="url(#glowLinha)" />
			{pontos.map(([x, y], i) => (
				<circle key={i} cx={x} cy={y} r={3} fill={COR.rosa} />
			))}
		</svg>
	);
};

// Ícones flutuando lentamente no fundo (setas de alta, cifrões) — reforça o tema financeiro/notícia
// sem virar "cenário": são só elementos de motion decorativo, bem sutis, nunca competem com o texto.
const IconesFlutuantes: React.FC = () => {
	const frame = useCurrentFrame();
	const itens = Array.from({length: 9}).map((_, i) => {
		const seed = i * 137.5;
		const x = (Math.sin(seed) * 0.5 + 0.5) * 1080;
		const velocidade = 0.25 + (i % 3) * 0.08;
		const y = ((1920 + 120 - ((frame * velocidade + seed * 4) % (1920 + 240))) % (1920 + 240)) - 120;
		const tipo = i % 3 === 0 ? 'seta' : i % 3 === 1 ? 'cifrao' : 'ponto';
		const escala = 0.7 + (i % 4) * 0.12;
		return {x, y, tipo, escala, key: i};
	});
	return (
		<svg style={{position: 'absolute', inset: 0, opacity: 0.16}} width={1080} height={1920}>
			{itens.map(({x, y, tipo, escala, key}) => (
				<g key={key} transform={`translate(${x},${y}) scale(${escala})`}>
					{tipo === 'seta' && <path d="M0,16 L12,-16 L24,16 L16,16 L12,2 L8,16 Z" fill={COR.verde} />}
					{tipo === 'cifrao' && (
						<text x={0} y={0} fontFamily={fonte} fontWeight={800} fontSize={30} fill={COR.rosa} textAnchor="middle">
							R$
						</text>
					)}
					{tipo === 'ponto' && <circle r={5} fill={COR.branco} />}
				</g>
			))}
		</svg>
	);
};

// Ticker de notícias (faixa rolando no topo, estilo canal de negócios/breaking news).
const TickerNoticias: React.FC = () => {
	const frame = useCurrentFrame();
	const texto =
		'TIKTOK SHOP ▲ R$ 5,3 BI EM VENDAS   •   +9.900% DE CRESCIMENTO   •   2,3 MILHÕES DE CRIADORES ATIVOS   •   +200 CRIADORES JÁ PASSARAM DE R$ 1 MI   •   ';
	const deslocamento = -((frame * 2.6) % 2600);
	return (
		<div style={{position: 'absolute', top: 0, left: 0, width: '100%', display: 'flex', alignItems: 'center', background: '#000000', borderBottom: `2px solid ${COR.rosa}`, padding: '10px 0'}}>
			<span
				style={{
					background: COR.rosa,
					color: COR.branco,
					fontFamily: fonte,
					fontWeight: 800,
					fontSize: 18,
					padding: '4px 12px',
					borderRadius: 4,
					marginLeft: 14,
					marginRight: 14,
					whiteSpace: 'nowrap',
					flexShrink: 0,
					position: 'relative',
					zIndex: 1,
				}}
			>
				AO VIVO
			</span>
			{/* área recortada depois da tag, pra rolagem nunca deslizar de volta por baixo dela */}
			<div style={{flex: 1, overflow: 'hidden'}}>
				<div style={{whiteSpace: 'nowrap', transform: `translateX(${deslocamento}px)`, fontFamily: fonte, fontWeight: 700, fontSize: 18, color: COR.branco, letterSpacing: '0.02em'}}>
					{texto}
					{texto}
				</div>
			</div>
		</div>
	);
};

// Pontinhos tipo "static"/ruído de transmissão, bem sutil, dão textura de telejornal.
const RuidoTransmissao: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<svg style={{position: 'absolute', inset: 0, opacity: 0.08, mixBlendMode: 'screen'}} width={1080} height={1920}>
			{Array.from({length: 40}).map((_, i) => {
				const x = (i * 97 + frame * 3) % 1080;
				const y = (i * 211 + frame * 1.7) % 1920;
				return <circle key={i} cx={x} cy={y} r={1.4} fill="#ffffff" />;
			})}
		</svg>
	);
};

export const Fundo: React.FC<{children?: React.ReactNode; ticker?: boolean}> = ({children, ticker = true}) => (
	<div style={{position: 'absolute', inset: 0, background: `linear-gradient(165deg, ${COR.fundo2} 0%, ${COR.fundo1} 70%)`, overflow: 'hidden'}}>
		<GraficoFundo />
		<IconesFlutuantes />
		<RuidoTransmissao />
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
		{ticker && <TickerNoticias />}
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
	const frame = useCurrentFrame();
	if (p <= 0.001) return null;
	// Anel de impacto: um círculo que pulsa devagar atrás do número, só depois do estouro acomodar (p perto de 1).
	const pulso = p > 0.9 ? (Math.sin(frame * 0.08) + 1) / 2 : 0;
	// p vem de uma mola (spring) com overshoot: usar p direto no scale dá o efeito de "estouro" (bounce).
	return (
		<div style={{position: 'absolute', top, width: '100%', textAlign: 'center', opacity: Math.min(1, p * 2.2), transform: `translateY(${Math.max(0, 1 - p) * 30}px) scale(${Math.max(0, p)})`}}>
			<div
				style={{
					position: 'absolute',
					left: '50%',
					top: tamanho * 0.5,
					width: tamanho * 2.4 + pulso * 40,
					height: tamanho * 2.4 + pulso * 40,
					transform: 'translate(-50%,-50%)',
					borderRadius: '50%',
					border: `2px solid ${cor}`,
					opacity: 0.18 - pulso * 0.12,
					pointerEvents: 'none',
				}}
			/>
			<div style={{position: 'relative', fontFamily: fonte, fontWeight: 800, fontSize: tamanho, lineHeight: 1, color: cor, textShadow: `0 0 50px ${cor}99, 0 0 100px ${cor}44`}}>{valor}</div>
			<div style={{marginTop: 14, fontFamily: fonte, fontWeight: 700, fontSize: 32, letterSpacing: '0.06em', color: COR.branco}}>{rotulo}</div>
		</div>
	);
};

// Rajada de partículas (confete/faíscas) saindo do centro — acompanha o estouro do número.
export const Particulas: React.FC<{p: number; cor?: string; y?: number}> = ({p, cor = COR.rosa, y = 300}) => {
	if (p <= 0.001 || p >= 1.4) return null;
	const n = 16;
	return (
		<svg style={{position: 'absolute', left: '50%', top: y, transform: 'translate(-50%,-50%)', opacity: Math.max(0, 1 - p * 0.8)}} width={700} height={700} viewBox="-350 -350 700 700">
			{Array.from({length: n}).map((_, i) => {
				const ang = (i / n) * Math.PI * 2;
				const dist = p * 260;
				const x = Math.cos(ang) * dist;
				const y2 = Math.sin(ang) * dist;
				const tam = 8 + (i % 3) * 4;
				return i % 2 === 0 ? (
					<circle key={i} cx={x} cy={y2} r={tam / 2} fill={i % 4 === 0 ? COR.branco : cor} />
				) : (
					<rect key={i} x={x - tam / 2} y={y2 - tam / 2} width={tam} height={tam} fill={cor} transform={`rotate(${p * 200} ${x} ${y2})`} />
				);
			})}
		</svg>
	);
};

// Flash branco/rosa rápido no início da cena — dá o "corte seco" de telejornal.
export const Flash: React.FC<{cena: CenaPeca; cor?: string}> = ({cena, cor = COR.rosa}) => {
	const {sobe} = usePeca(cena);
	const p = 1 - sobe(0, 10);
	if (p <= 0.001) return null;
	return <div style={{position: 'absolute', inset: 0, background: cor, opacity: p * 0.85, pointerEvents: 'none'}} />;
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
			{/* barra de navegador falsa (bolinhas de tráfego + url), pra parecer print real de verdade */}
			<div style={{display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#eef1f6', borderBottom: '1px solid #dde2ec'}}>
				<div style={{width: 10, height: 10, borderRadius: '50%', background: '#ff5f57'}} />
				<div style={{width: 10, height: 10, borderRadius: '50%', background: '#febc2e'}} />
				<div style={{width: 10, height: 10, borderRadius: '50%', background: '#28c840'}} />
				<div style={{marginLeft: 10, flex: 1, background: '#ffffff', border: '1px solid #dde2ec', borderRadius: 6, padding: '4px 10px', fontFamily: fonte, fontWeight: 600, fontSize: 13, color: '#8a93ab'}}>
					🔒 {fonteTexto.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com.br
				</div>
			</div>
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
									background: item.destaque ? `linear-gradient(90deg, ${COR.rosa}, ${COR.rosaClaro})` : `linear-gradient(90deg, ${COR.cinza}, #c3c8d8)`,
									borderRadius: 6,
									boxShadow: item.destaque ? `0 0 16px ${COR.rosa}66` : 'none',
								}}
							/>
						</div>
						<div style={{width: 58, flexShrink: 0, fontFamily: fonte, fontWeight: 800, fontSize: 16, color: item.destaque ? COR.rosa : COR.branco, opacity: Math.min(1, p * 1.8 - i * 0.12)}}>
							{item.valor}x
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

// Moeda/cédula 3D girando atrás do número — único elemento 3D do vídeo, só nas cenas de dinheiro
// (contido de propósito: WebGL na nuvem é lento sem placa de vídeo; usar em excesso travaria o render).
export const DinheiroGirando: React.FC<{tipo: 'moeda' | 'notas'; p: number; cena: CenaPeca}> = ({tipo, p, cena}) => {
	const frame = useCurrentFrame();
	const {width, height, fps} = useVideoConfig();
	const t = frame / 30;
	// Testado: no rasterizador por software (sem placa de vídeo na nuvem) o WebGL tem um custo alto e quase
	// FIXO por quadro (reduzir a resolução não ajudou — não é gargalo de pixel, é leitura do framebuffer/
	// sincronização), então a única alavanca real é limitar quantos quadros usam o canvas 3D: ele gira só
	// nos ~1,4s iniciais da cena (dá pra ver bem a moeda/cédula) e depois some, ficando só o número 2D.
	const localFrame = frame - cena.de * fps;
	const janelaMax = Math.round(1.4 * fps);
	if (p <= 0.01 || localFrame > janelaMax) return null;
	// Renderiza em metade da resolução (mesma proporção) e estica por CSS: custo extra que não dói mais
	// depois do corte de janela acima, mas segue ajudando um pouco.
	const resW = Math.round(width / 2);
	const resH = Math.round(height / 2);
	const saida = interpolate(localFrame, [janelaMax - 10, janelaMax], [1, 0], lim);
	return (
		<div style={{position: 'absolute', inset: 0, opacity: Math.min(1, p * 1.4) * saida}}>
			{/* antialias desligado: no software rasterizer isso também é um custo grande por quadro */}
			<ThreeCanvas
				width={resW}
				height={resH}
				gl={{alpha: true, antialias: false}}
				camera={{fov: 35, position: [0, 0, 8], near: 0.1, far: 50}}
				style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}
			>
				<ambientLight intensity={0.8} />
				<directionalLight position={[4, 6, 5]} intensity={1.6} />
				<directionalLight position={[-4, -2, -4]} intensity={0.4} />
				<group position={[0, -0.9, 0]} scale={Math.min(1, p) * 1.3} rotation={[0.1, t * 1.1, tipo === 'notas' ? Math.PI / 2.3 : 0]}>
					<Objeto3D tipo={tipo} segundos={t} simbolo={tipo === 'moeda' ? 'R$' : undefined} />
				</group>
			</ThreeCanvas>
		</div>
	);
};

export const pecasBase: Partial<Pecas> = {};
