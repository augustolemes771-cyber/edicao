import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Video} from '@remotion/media';
import {useEntradaEm} from '../motor/anim';
import type {CenaNoPlano} from '../motor/plano';
import {inter, playfair, poppins, unbounded} from '../motor/tema';

// Peças aprendidas nas referências. Detalhes e tempos em docs/referencias/desmontagem.md.
type De<T extends CenaNoPlano['tipo']> = Extract<CenaNoPlano, {tipo: T}>;

const AMARELO = '#ffd21f';
const glowAmarelo = (f = 1) => `0 0 ${10 * f}px rgba(255,200,0,0.85), 0 0 ${30 * f}px rgba(255,170,0,0.5)`;
const DOURADO = '#f4c95d';
const glowDourado = '0 0 10px rgba(255,196,77,0.75), 0 0 30px rgba(255,170,40,0.45)';

const desfocarEntrada = (p: number, px = 12): React.CSSProperties => ({
	opacity: p,
	filter: p < 1 ? `blur(${(1 - p) * px}px)` : undefined,
});

// Fundo escuro das cartelas da ref. 2: cinza quase preto, centro um pouco mais claro.
const FundoCartela: React.FC = () => (
	<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, #2a2a2a 0%, #141414 55%, #0b0b0b 100%)'}} />
);

// Ref. 2 ("SE" → "PERGUNTE"): troca seca de palavra na hora da fala, sem animação.
export const Cartao: React.FC<{cena: De<'cartao'>}> = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps, width} = useVideoConfig();
	const t = cena.de + frame / fps;
	let i = 0;
	cena.tempos.forEach((tp, j) => {
		if (t >= tp) i = j;
	});
	const cor = cena.cor ?? AMARELO;
	return (
		<AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
			<FundoCartela />
			<div
				style={{
					position: 'relative',
					fontFamily: unbounded,
					fontWeight: 800,
					fontSize: width * 0.085,
					letterSpacing: -1,
					textTransform: 'uppercase',
					color: cor,
					textShadow: glowAmarelo(1.2),
				}}
			>
				{cena.palavras[i]}
			</div>
		</AbsoluteFill>
	);
};

// Ref. 2 ("SÓ RAZÃO / ZERO EMOÇÃO"): letras acendem uma a uma, da esquerda para a direita.
const Letreiro: React.FC<{texto: string; inicio: number; passo: number; estilo: React.CSSProperties}> = ({
	texto,
	inicio,
	passo,
	estilo,
}) => {
	const frame = useCurrentFrame();
	return (
		<div style={{position: 'relative', ...estilo, whiteSpace: 'pre'}}>
			{[...texto].map((letra, i) => {
				const p = interpolate(frame - inicio - i * passo, [0, 6], [0, 1], {
					extrapolateLeft: 'clamp',
					extrapolateRight: 'clamp',
				});
				return (
					<span key={i} style={{display: 'inline-block', ...desfocarEntrada(p, 8)}}>
						{letra}
					</span>
				);
			})}
		</div>
	);
};

export const Letras: React.FC<{cena: De<'letras'>}> = ({cena}) => {
	const {fps, width} = useVideoConfig();
	const inicio2 = cena.em2 !== undefined ? Math.round((cena.em2 - cena.de) * fps) : 8 + cena.linha1.length * 2;
	return (
		<AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
			<FundoCartela />
			<Letreiro
				texto={cena.linha1}
				inicio={0}
				passo={2}
				estilo={{
					fontFamily: unbounded,
					fontWeight: 700,
					fontSize: width * 0.07,
					color: '#f2f2f2',
					letterSpacing: 1,
					textShadow: '0 0 14px rgba(255,255,255,0.45)',
				}}
			/>
			{cena.linha2 && (
				<Letreiro
					texto={cena.linha2}
					inicio={inicio2}
					passo={2}
					estilo={{
						fontFamily: unbounded,
						fontWeight: 800,
						fontSize: width * 0.04,
						color: AMARELO,
						marginTop: -width * 0.01,
						textShadow: glowAmarelo(0.6),
					}}
				/>
			)}
		</AbsoluteFill>
	);
};

// Ref. 1 e 2: linha pequena em cima, palavra grande em serifa itálica que acende com glow.
export const Kicker: React.FC<{cena: De<'kicker'>}> = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const pPeq = interpolate(frame, [0, 6], [0, 1], {extrapolateRight: 'clamp'});
	const inicioG = cena.emGrande !== undefined ? Math.round((cena.emGrande - cena.de) * fps) : 4;
	const pG = interpolate(frame - inicioG, [0, 7], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const acende = interpolate(frame - inicioG, [0, 12], [0.3, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const ouro = cena.estilo === 'ouro';
	const cor = ouro ? DOURADO : AMARELO;
	const base = Math.min(width, height);
	return (
		<AbsoluteFill style={{alignItems: 'center'}}>
			<div
				style={{
					position: 'absolute',
					top: width < height ? '58%' : '62%',
					textAlign: 'center',
					transform: 'translateY(-50%)',
				}}
			>
				{cena.pequeno && (
					<div
						style={{
							fontFamily: ouro ? playfair : poppins,
							fontWeight: ouro ? 700 : 500,
							fontSize: base * 0.04,
							color: '#fff',
							textShadow: '0 2px 10px rgba(0,0,0,0.6)',
							marginBottom: -base * 0.012,
							...desfocarEntrada(pPeq, 8),
						}}
					>
						{cena.pequeno}
					</div>
				)}
				<div
					style={{
						fontFamily: playfair,
						fontStyle: ouro ? 'normal' : 'italic',
						fontWeight: 800,
						fontSize: base * (ouro ? 0.085 : 0.11),
						textTransform: ouro ? 'uppercase' : undefined,
						letterSpacing: ouro ? 1 : -2,
						lineHeight: 1.05,
						color: cor,
						textShadow: ouro ? glowDourado : glowAmarelo(acende),
						transform: `scale(${1 + (1 - pG) * 0.08})`,
						...desfocarEntrada(pG * acende, 14),
					}}
				>
					{cena.grande}
				</div>
			</div>
		</AbsoluteFill>
	);
};

// Ref. 1 (mapa do Brasil): a imagem salta com sobra de mola; a câmera atrás desfoca (ver Camera).
export const Foto: React.FC<{cena: De<'foto'>; pasta: string}> = ({cena, pasta}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const p = spring({frame, fps, config: {damping: 10, stiffness: 170, mass: 0.7}});
	const lado = Math.min(width, height) * (cena.tamanho ?? 0.7);
	return (
		<AbsoluteFill
			style={{justifyContent: 'center', alignItems: 'center', paddingBottom: height > width ? height * 0.22 : 0}}
		>
			<Img
				src={staticFile(`${pasta}/${cena.src}`)}
				style={{
					maxWidth: lado,
					maxHeight: lado,
					transform: `scale(${p})`,
					filter: 'drop-shadow(0 0 18px rgba(255,220,120,0.45)) drop-shadow(0 12px 30px rgba(0,0,0,0.6))',
				}}
			/>
			{cena.legenda && (
				<div
					style={{
						fontFamily: playfair,
						fontWeight: 700,
						fontSize: Math.min(width, height) * 0.05,
						color: '#fff',
						marginTop: 24,
						textShadow: '0 2px 12px rgba(0,0,0,0.7)',
						opacity: interpolate(frame, [6, 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
					}}
				>
					{cena.legenda}
				</div>
			)}
		</AbsoluteFill>
	);
};

// Ref. 1: prints de comentários sobem do rodapé um por um, com o pé da imagem escurecido.
const CartaoComentario: React.FC<{autor: string; texto: string; em: number; inicio: number; largura: number}> = ({
	autor,
	texto,
	em,
	inicio,
	largura,
}) => {
	const p = useEntradaEm(em, inicio);
	return (
		<div
			style={{
				width: largura,
				padding: '16px 20px',
				borderRadius: 16,
				background: 'rgba(28,30,36,0.92)',
				border: '1px solid rgba(255,255,255,0.08)',
				boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
				fontFamily: inter,
				color: '#fff',
				marginTop: 14,
				opacity: p,
				transform: `translateY(${(1 - p) * 80}px)`,
			}}
		>
			<div style={{display: 'flex', alignItems: 'center', gap: 10, fontSize: largura * 0.035, fontWeight: 700}}>
				<div
					style={{
						width: largura * 0.06,
						height: largura * 0.06,
						borderRadius: '50%',
						background: 'linear-gradient(135deg,#f58529,#dd2a7b,#8134af)',
					}}
				/>
				{autor}
			</div>
			<div style={{fontSize: largura * 0.04, fontWeight: 600, lineHeight: 1.3, marginTop: 8, opacity: 0.92}}>
				{texto}
			</div>
		</div>
	);
};

export const Comentarios: React.FC<{cena: De<'comentarios'>}> = ({cena}) => {
	const {width, height} = useVideoConfig();
	const largura = Math.min(width * 0.78, 760);
	return (
		<AbsoluteFill>
			<AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(0,0,0,0) 45%, rgba(0,0,0,0.85) 100%)'}} />
			<AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: height * 0.08}}>
				{cena.itens.map((c, i) => (
					<CartaoComentario key={i} {...c} inicio={cena.de} largura={largura} />
				))}
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

// Ref. 1 ("E não é medicina"): cartão branco com ícone e legenda pequena em serifa.
export const Icone: React.FC<{cena: De<'icone'>; pasta: string}> = ({cena, pasta}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const p = spring({frame, fps, config: {damping: 14, stiffness: 160}});
	const lado = Math.min(width, height) * 0.42;
	return (
		<AbsoluteFill style={{backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center'}}>
			<Img
				src={staticFile(`${pasta}/${cena.src}`)}
				style={{maxWidth: lado, maxHeight: lado, transform: `scale(${0.85 + 0.15 * p})`}}
			/>
			{cena.legenda && (
				<div
					style={{
						fontFamily: playfair,
						fontWeight: 700,
						fontSize: Math.min(width, height) * 0.04,
						color: '#111',
						marginTop: 20,
					}}
				>
					{cena.legenda}
				</div>
			)}
		</AbsoluteFill>
	);
};

// Ref. 1: B-roll em tela cheia com zoom lento (Ken Burns).
export const Broll: React.FC<{cena: De<'broll'>; pasta: string}> = ({cena, pasta}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const duracao = (cena.ate - cena.de) * fps;
	const escala = interpolate(frame, [0, duracao], [1, cena.zoom ?? 1.12]);
	const src = staticFile(`${pasta}/${cena.src}`);
	const estilo: React.CSSProperties = {
		width: '100%',
		height: '100%',
		objectFit: 'cover',
		transform: `scale(${escala})`,
	};
	return (
		<AbsoluteFill style={{backgroundColor: '#000', overflow: 'hidden'}}>
			{cena.video ? <Video src={src} muted objectFit="cover" style={estilo} /> : <Img src={src} style={estilo} />}
		</AbsoluteFill>
	);
};

export const Preto: React.FC = () => <AbsoluteFill style={{backgroundColor: '#000'}} />;

// Itens com ✓ que entram um por um na hora da fala, empilhados no terço de baixo.
const ItemChecklist: React.FC<{texto: string; em: number; inicio: number; largura: number}> = ({
	texto,
	em,
	inicio,
	largura,
}) => {
	const p = useEntradaEm(em, inicio);
	const marca = useEntradaEm(em, inicio, 5);
	return (
		<div
			style={{
				width: largura,
				display: 'flex',
				alignItems: 'center',
				gap: largura * 0.04,
				padding: `${largura * 0.03}px ${largura * 0.045}px`,
				marginTop: largura * 0.025,
				borderRadius: largura * 0.04,
				background: 'rgba(10,12,14,0.72)',
				backdropFilter: 'blur(12px)',
				border: '1px solid rgba(255,255,255,0.14)',
				boxShadow: '0 12px 30px rgba(0,0,0,0.45)',
				opacity: p,
				transform: `translateX(${(1 - p) * -largura * 0.25}px)`,
			}}
		>
			<div
				style={{
					flex: 'none',
					width: largura * 0.085,
					height: largura * 0.085,
					borderRadius: '50%',
					background: '#22c55e',
					boxShadow: '0 0 16px rgba(34,197,94,0.7)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					transform: `scale(${marca})`,
				}}
			>
				<svg viewBox="0 0 24 24" width="62%" height="62%">
					<path
						d="M5 12.5l4.5 4.5L19 7.5"
						fill="none"
						stroke="#fff"
						strokeWidth={3.2}
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeDasharray={24}
						strokeDashoffset={24 * (1 - marca)}
					/>
				</svg>
			</div>
			<div style={{fontFamily: inter, fontWeight: 700, fontSize: largura * 0.06, color: '#fff', lineHeight: 1.15}}>
				{texto}
			</div>
		</div>
	);
};

export const Checklist: React.FC<{cena: De<'checklist'>}> = ({cena}) => {
	const frame = useCurrentFrame();
	const {width, height} = useVideoConfig();
	const largura = Math.min(width * 0.8, 820);
	const pTitulo = interpolate(frame, [0, 6], [0, 1], {extrapolateRight: 'clamp'});
	return (
		<AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: height * 0.12}}>
			{cena.titulo && (
				<div
					style={{
						width: largura,
						fontFamily: playfair,
						fontStyle: 'italic',
						fontWeight: 800,
						fontSize: largura * 0.075,
						color: '#ffffff',
						textShadow: '0 2px 14px rgba(0,0,0,0.7)',
						marginBottom: largura * 0.01,
						...desfocarEntrada(pTitulo, 10),
					}}
				>
					{cena.titulo}
				</div>
			)}
			{cena.itens.map((item, i) => (
				<ItemChecklist key={i} {...item} inicio={cena.de} largura={largura} />
			))}
		</AbsoluteFill>
	);
};

// Anel de luz fino em volta do rosto: entra grande e encolhe até o lugar (desmontagem-2, ref. 2).
export const Anel: React.FC<{cena: De<'anel'>}> = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const p = spring({frame, fps, config: {damping: 16, stiffness: 110}});
	const r = width * (cena.raio ?? 0.3) * (1.35 - 0.35 * p);
	return (
		<AbsoluteFill>
			<div
				style={{
					position: 'absolute',
					left: (cena.x ?? 0.5) * width - r,
					top: (cena.y ?? 0.3) * height - r,
					width: r * 2,
					height: r * 2,
					borderRadius: '50%',
					border: `${width * 0.004}px solid rgba(255,248,230,0.95)`,
					boxShadow: '0 0 14px rgba(255,236,190,0.8), inset 0 0 14px rgba(255,236,190,0.5)',
					opacity: Math.min(1, p * 1.5),
				}}
			/>
		</AbsoluteFill>
	);
};

// Visor de câmera com cantos e "● REC" (desmontagem-2, ref. 2).
export const Rec: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const p = interpolate(frame, [0, 6], [0, 1], {extrapolateRight: 'clamp'});
	const m = width * 0.05;
	const l = width * 0.07;
	const t = width * 0.004;
	const canto = (estilo: React.CSSProperties) => (
		<div
			style={{
				position: 'absolute',
				width: l,
				height: l,
				borderColor: 'rgba(255,255,255,0.9)',
				borderStyle: 'solid',
				borderWidth: 0,
				...estilo,
			}}
		/>
	);
	const pisca = Math.floor(frame / (fps * 0.5)) % 2 === 0;
	return (
		<AbsoluteFill style={{opacity: p}}>
			{canto({left: m, top: m * 2, borderLeftWidth: t, borderTopWidth: t})}
			{canto({right: m, top: m * 2, borderRightWidth: t, borderTopWidth: t})}
			{canto({left: m, bottom: m * 2, borderLeftWidth: t, borderBottomWidth: t})}
			{canto({right: m, bottom: m * 2, borderRightWidth: t, borderBottomWidth: t})}
			<div
				style={{
					position: 'absolute',
					left: m * 1.6,
					top: m * 2.5,
					display: 'flex',
					alignItems: 'center',
					gap: width * 0.012,
					fontFamily: inter,
					fontWeight: 700,
					fontSize: width * 0.028,
					color: '#fff',
					letterSpacing: 1,
				}}
			>
				<div
					style={{
						width: width * 0.018,
						height: width * 0.018,
						borderRadius: '50%',
						background: '#ff2d2d',
						opacity: pisca ? 1 : 0.25,
					}}
				/>
				REC
			</div>
			<div
				style={{
					position: 'absolute',
					right: m * 1.6,
					bottom: m * 2.5,
					color: '#fff',
					fontFamily: inter,
					fontSize: width * 0.03,
					opacity: 0.8,
				}}
			>
				+
			</div>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background: `radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(0,0,0,0.35) ${height > width ? 100 : 90}%)`,
				}}
			/>
		</AbsoluteFill>
	);
};

// Pílula vermelha de vidro com ícone; o texto entra palavra por palavra.
const Pilula: React.FC<{texto: string; em: number; inicio: number; icone: 'alerta' | 'x'; largura: number}> = ({
	texto,
	em,
	inicio,
	icone,
	largura,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const p = useEntradaEm(em, inicio);
	const local = frame - Math.round((em - inicio) * fps);
	const palavras = texto.split(' ');
	return (
		<div
			style={{
				width: largura,
				display: 'flex',
				alignItems: 'center',
				gap: largura * 0.04,
				padding: `${largura * 0.028}px ${largura * 0.05}px`,
				marginTop: largura * 0.03,
				borderRadius: largura * 0.03,
				background: 'linear-gradient(90deg, rgba(120,10,25,0.85) 0%, rgba(70,6,16,0.75) 100%)',
				border: '1px solid rgba(255,90,110,0.35)',
				boxShadow: '0 10px 30px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)',
				backdropFilter: 'blur(10px)',
				opacity: p,
				transform: `translateY(${(1 - p) * 30}px) scale(${0.94 + 0.06 * p})`,
			}}
		>
			<svg viewBox="0 0 24 24" width={largura * 0.06} height={largura * 0.06} style={{flex: 'none'}}>
				{icone === 'alerta' ? (
					<>
						<path d="M12 3L22 20H2Z" fill="#ff4d5e" />
						<rect x="11" y="9" width="2" height="6" fill="#fff" />
						<rect x="11" y="16.5" width="2" height="2" fill="#fff" />
					</>
				) : (
					<path d="M5 5L19 19M19 5L5 19" stroke="#f4f4f4" strokeWidth={3.4} strokeLinecap="round" />
				)}
			</svg>
			<div style={{fontFamily: inter, fontWeight: 600, fontSize: largura * 0.05, color: '#fff'}}>
				{palavras.map((w, i) => (
					<span
						key={i}
						style={{
							opacity: interpolate(local - 3 - i * 4, [0, 4], [0, 1], {
								extrapolateLeft: 'clamp',
								extrapolateRight: 'clamp',
							}),
						}}
					>
						{w}{' '}
					</span>
				))}
			</div>
		</div>
	);
};

export const Alertas: React.FC<{cena: De<'alertas'>}> = ({cena}) => {
	const {width, height} = useVideoConfig();
	const largura = Math.min(width * 0.72, 760);
	return (
		<AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', paddingTop: height * 0.18}}>
			{cena.itens.map((item, i) => (
				<Pilula
					key={i}
					texto={item.texto}
					em={item.em}
					inicio={cena.de}
					icone={item.icone ?? (i === 0 ? 'alerta' : 'x')}
					largura={largura}
				/>
			))}
		</AbsoluteFill>
	);
};
