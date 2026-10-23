import React from 'react';
import {
	AbsoluteFill,
	Img,
	OffthreadVideo,
	interpolate,
	random,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {useEntradaEm} from '../motor/anim';
import type {CenaNoPlano, EstiloNome} from '../motor/plano';
import {anton, dmSerif, gloock, inter, playfair, poppins, spaceMono, unbounded} from '../motor/tema';
import {FundoGrid} from './FundoGrid';
import {DestaqueSuave, OURO_LUXO, TextoLuxo} from './Luxo';
import {NeonProfundo} from './NeonProfundo';

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
			{cena.video ? (
				<OffthreadVideo src={src} muted style={{...estilo, objectFit: 'cover'}} />
			) : (
				<Img src={src} style={estilo} />
			)}
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

// Pílula de alerta com ícone. vermelha: vidro vermelho, texto palavra por palavra (ref. 2).
// escura: vidro quase preto com texto branco inteiro e ícone num círculo vermelho; contrasta com roupa vermelha.
const Pilula: React.FC<{
	texto: string;
	em: number;
	inicio: number;
	icone: 'alerta' | 'x';
	largura: number;
	escura: boolean;
}> = ({texto, em, inicio, icone, largura, escura}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const p = useEntradaEm(em, inicio);
	const local = frame - Math.round((em - inicio) * fps);
	const palavras = texto.split(' ');
	const lado = largura * (escura ? 0.085 : 0.06);
	return (
		<div
			style={{
				width: largura,
				display: 'flex',
				alignItems: 'center',
				gap: largura * 0.04,
				padding: `${largura * (escura ? 0.032 : 0.028)}px ${largura * 0.045}px`,
				marginTop: largura * 0.03,
				borderRadius: largura * 0.035,
				background: escura
					? 'linear-gradient(180deg, rgba(22,22,26,0.92) 0%, rgba(8,8,10,0.9) 100%)'
					: 'linear-gradient(90deg, rgba(120,10,25,0.85) 0%, rgba(70,6,16,0.75) 100%)',
				border: escura ? '1px solid rgba(255,255,255,0.16)' : '1px solid rgba(255,90,110,0.35)',
				boxShadow: escura
					? '0 14px 34px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.1)'
					: '0 10px 30px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)',
				backdropFilter: 'blur(10px)',
				opacity: p,
				transform: escura
					? `translateX(${(1 - p) * -largura * 0.18}px) scale(${0.96 + 0.04 * p})`
					: `translateY(${(1 - p) * 30}px) scale(${0.94 + 0.06 * p})`,
			}}
		>
			{escura ? (
				<div
					style={{
						flex: 'none',
						width: lado,
						height: lado,
						borderRadius: '50%',
						background: '#ff3b4f',
						boxShadow: '0 0 16px rgba(255,59,79,0.6)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<svg viewBox="0 0 24 24" width="58%" height="58%">
						{icone === 'alerta' ? (
							<>
								<rect x="10.6" y="4" width="2.8" height="10" rx="1.4" fill="#fff" />
								<circle cx="12" cy="18.5" r="1.8" fill="#fff" />
							</>
						) : (
							<path d="M6 6L18 18M18 6L6 18" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" />
						)}
					</svg>
				</div>
			) : (
				<svg viewBox="0 0 24 24" width={lado} height={lado} style={{flex: 'none'}}>
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
			)}
			<div
				style={{
					fontFamily: inter,
					fontWeight: escura ? 700 : 600,
					fontSize: largura * (escura ? 0.056 : 0.05),
					color: '#fff',
					lineHeight: 1.2,
				}}
			>
				{escura
					? texto
					: palavras.map((w, i) => (
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
					escura={cena.variante === 'escura'}
				/>
			))}
		</AbsoluteFill>
	);
};

// Palavra gigante atrás da pessoa: entra crescendo do desfoque, letras em cascata rápida, e deriva devagar.
export const Gigante: React.FC<{cena: De<'gigante'>}> = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const duracao = (cena.ate - cena.de) * fps;
	const saida = interpolate(frame, [duracao - 6, duracao], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const linhas = cena.texto.split('\n');
	const maior = Math.max(...linhas.map((l) => l.length));
	const tamanho = width * (cena.tamanho ?? Math.min(0.34, 1.5 / Math.max(4, maior)));
	const estilo = cena.estilo ?? 'amarelo';
	const cores: Record<string, React.CSSProperties> = {
		amarelo: {color: AMARELO, textShadow: glowAmarelo(1.3)},
		neon: {color: '#d6ff3c', textShadow: '0 0 18px rgba(214,255,60,0.75), 0 0 50px rgba(170,230,0,0.45)'},
		branco: {color: '#ffffff', textShadow: '0 0 30px rgba(255,255,255,0.35)'},
		ouro: {
			background: 'linear-gradient(180deg, #fff1b8 0%, #e2b453 38%, #9c6b1c 62%, #f3d27a 100%)',
			WebkitBackgroundClip: 'text',
			backgroundClip: 'text',
			color: 'transparent',
			filter: 'drop-shadow(0 0 14px rgba(255,190,80,0.5))',
		},
	};
	const deriva = interpolate(frame, [0, duracao], [1.04, 1]);
	if (cena.linhas && cena.paleta === 'luxo') {
		// Luxo editorial: texto no topo, atrás da cabeça, com a luz do topo baixando para ele saltar.
		const pequeno = cena.linhas
			.filter((l) => !l.grande)
			.map((l) => l.texto)
			.join(' ');
		const grande = cena.linhas
			.filter((l) => l.grande)
			.map((l) => l.texto)
			.join(' ');
		const entra = interpolate(frame, [0, 8], [0, 1], {extrapolateRight: 'clamp'});
		return (
			<AbsoluteFill style={{opacity: saida}}>
				<DestaqueSuave y={0.1} altura={0.31} forca={entra} width={width} height={height} />
				<div
					style={{
						position: 'absolute',
						top: height * (cena.y ?? 0.012),
						left: 0,
						right: 0,
						transform: `scale(${deriva})`,
						transformOrigin: '50% 0%',
					}}
				>
					<TextoLuxo pequeno={pequeno || undefined} grande={grande} f={frame} fps={fps} largura={width} tamMax={0.2} />
				</div>
			</AbsoluteFill>
		);
	}
	if (cena.linhas) {
		const maiorGrande = Math.max(4, ...cena.linhas.filter((l) => l.grande).map((l) => l.texto.length));
		const tam = width * (cena.tamanho ?? Math.min(0.34, 1.45 / maiorGrande));
		const altura = cena.linhas.reduce((a, l) => a + (l.grande ? tam * 0.86 : tam * 0.36), 0);
		return (
			<AbsoluteFill style={{alignItems: 'center', opacity: saida}}>
				<div
					style={{
						position: 'absolute',
						top: Math.max((cena.y ?? 0.2) * height, height * 0.035 + altura / 2),
						transform: `translateY(-50%) scale(${deriva})`,
					}}
				>
					<NeonProfundo
						linhas={cena.linhas}
						paleta={cena.paleta === 'luxo' ? 'dourado' : (cena.paleta ?? 'dourado')}
						tamanho={tam}
						progresso={(i) =>
							interpolate(frame - i * 0.7, [0, 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
						}
					/>
				</div>
			</AbsoluteFill>
		);
	}
	if (estilo === 'serif' || estilo === 'limpo' || estilo === 'editorial') {
		const tam = width * (cena.tamanho ?? 0.13);
		return (
			<AbsoluteFill style={{alignItems: 'center', opacity: saida}}>
				<div
					style={{
						position: 'absolute',
						top: Math.max((cena.y ?? 0.3) * height, height * 0.035 + tam * 0.7),
						transform: `translateY(-50%) scale(${deriva})`,
						textAlign: 'center',
					}}
				>
					{linhas.map((l, i) => (
						<div key={i}>
							<NomeEstilizado texto={l} estilo={estilo} tamanho={tam} inicio={i * 4} />
						</div>
					))}
				</div>
			</AbsoluteFill>
		);
	}
	// Nunca passa da borda de cima: o centro desce o quanto for preciso.
	const alturaBloco = linhas.length * tamanho * 0.9;
	const centro = Math.max((cena.y ?? 0.3) * height, height * 0.035 + alturaBloco / 2);
	let k = 0;
	return (
		<AbsoluteFill style={{alignItems: 'center', opacity: saida}}>
			<div
				style={{
					position: 'absolute',
					top: centro,
					transform: `translateY(-50%) scale(${deriva})`,
					textAlign: 'center',
					fontFamily: anton,
					fontSize: tamanho,
					lineHeight: 0.9,
					textTransform: 'uppercase',
					letterSpacing: tamanho * 0.01,
					whiteSpace: 'nowrap',
				}}
			>
				{linhas.map((linha, li) => (
					<div key={li}>
						{[...linha].map((ch, ci) => {
							const p = interpolate(frame - k++ * 0.8, [0, 6], [0, 1], {
								extrapolateLeft: 'clamp',
								extrapolateRight: 'clamp',
							});
							return (
								<span
									key={ci}
									style={{
										display: 'inline-block',
										opacity: p,
										transform: `translateY(${(1 - p) * tamanho * 0.25}px) scale(${1 + (1 - p) * 0.3})`,
										filter: p < 1 ? `blur(${(1 - p) * 12}px)` : undefined,
										// Folga para o acento: o dourado só é pintado dentro da caixa da letra.
										paddingTop: '0.18em',
										marginTop: '-0.18em',
										...cores[estilo],
									}}
								>
									{ch === ' ' ? '\u00a0' : ch}
								</span>
							);
						})}
					</div>
				))}
			</div>
		</AbsoluteFill>
	);
};

// Foto recortada saindo de um aro dourado: raios de luz girando atrás, brilho passando no aro,
// a cabeça escapa por cima do círculo e o nome entra embaralhado embaixo.
export const Retrato: React.FC<{cena: De<'retrato'>; pasta: string}> = ({cena, pasta}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const lado = cena.variante === 'lado';
	const duracao = (cena.ate - cena.de) * fps;
	const r = width * (lado ? 0.15 : 0.33);
	const cx = width * (lado ? 0.79 : 0.5);
	const cy = height * (lado ? 0.19 : 0.4);
	const aro = spring({frame, fps, config: {damping: 13, stiffness: 150, mass: 0.7}});
	const sobe = spring({frame: frame - 3, fps, config: {damping: 15, stiffness: 120, mass: 0.8}});
	const saida = interpolate(frame, [duracao - 6, duracao], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const brilho = interpolate(frame, [6, 20], [-1, 2], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const foto = staticFile(`${pasta}/${cena.src}`);
	// A foto ocupa um quadrado maior que o aro, apoiada na base do círculo.
	const ladoFoto = r * 2.5;
	const fotoEstilo: React.CSSProperties = {
		position: 'absolute',
		left: cx - ladoFoto / 2,
		top: cy + r - ladoFoto + r * 0.32 + (1 - sobe) * r * 0.9,
		width: ladoFoto,
		height: ladoFoto,
		objectFit: 'contain',
		objectPosition: 'center bottom',
		transform: `rotate(${(1 - sobe) * -6}deg)`,
		filter: 'drop-shadow(0 12px 30px rgba(0,0,0,0.55))',
	};
	const nomeTam = width * (lado ? 0.08 : 0.13);
	return (
		<AbsoluteFill style={{opacity: saida}}>
			{/* Raios de luz girando atrás do aro. */}
			<div
				style={{
					position: 'absolute',
					left: cx - r * 2.2,
					top: cy - r * 2.2,
					width: r * 4.4,
					height: r * 4.4,
					borderRadius: '50%',
					background: 'repeating-conic-gradient(from 0deg, rgba(255,214,120,0.32) 0deg 7deg, transparent 7deg 22deg)',
					transform: `rotate(${frame * 0.6}deg) scale(${aro})`,
					filter: `blur(${r * 0.03}px)`,
					maskImage: 'radial-gradient(circle, black 30%, transparent 70%)',
					WebkitMaskImage: 'radial-gradient(circle, black 30%, transparent 70%)',
					mixBlendMode: 'screen',
				}}
			/>
			{/* Disco escuro com o aro dourado. */}
			<div
				style={{
					position: 'absolute',
					left: cx - r,
					top: cy - r,
					width: r * 2,
					height: r * 2,
					borderRadius: '50%',
					background: 'radial-gradient(circle at 50% 35%, #3a2c12 0%, #120d05 75%)',
					boxShadow: `0 0 0 ${r * 0.045}px #e2b453, 0 0 ${r * 0.25}px rgba(255,190,80,0.6), inset 0 0 ${r * 0.3}px rgba(0,0,0,0.8)`,
					transform: `scale(${aro})`,
					overflow: 'hidden',
				}}
			>
				<div
					style={{
						position: 'absolute',
						inset: 0,
						background: 'linear-gradient(105deg, transparent 35%, rgba(255,245,210,0.55) 50%, transparent 65%)',
						transform: `translateX(${brilho * 100}%)`,
					}}
				/>
			</div>
			{/* Dentro do círculo: corpo inteiro. Acima do centro: a cabeça escapa do aro. */}
			<Img
				src={foto}
				style={{
					...fotoEstilo,
					clipPath: `circle(${r * aro}px at 50% ${((cy - (fotoEstilo.top as number)) / ladoFoto) * 100}%)`,
				}}
			/>
			<Img
				src={foto}
				style={{
					...fotoEstilo,
					clipPath: `inset(0 ${((ladoFoto - r * 2) / 2 / ladoFoto) * 100}% ${(1 - (cy - (fotoEstilo.top as number)) / ladoFoto) * 100}% ${((ladoFoto - r * 2) / 2 / ladoFoto) * 100}%)`,
					opacity: aro,
				}}
			/>
			{/* Nome. */}
			<div
				style={{
					position: 'absolute',
					left: cx - width * 0.45,
					width: width * 0.9,
					top: cy + r * 1.08,
					textAlign: 'center',
				}}
			>
				{cena.pequeno && !cena.paleta && (
					<div
						style={{
							fontFamily: playfair,
							fontStyle: 'italic',
							fontWeight: 700,
							fontSize: nomeTam * 0.32,
							color: '#fff',
							textShadow: '0 2px 12px rgba(0,0,0,0.7)',
							...desfocarEntrada(
								interpolate(frame - 4, [0, 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
								8,
							),
						}}
					>
						{cena.pequeno}
					</div>
				)}
				{cena.paleta === 'luxo' ? (
					<TextoLuxo
						pequeno={cena.pequeno}
						grande={cena.nome}
						f={frame - 5}
						fps={fps}
						// No canto, o nome acompanha o tamanho do retrato pequeno.
						largura={cena.variante === 'lado' ? width * 0.4 : width}
						tamMax={0.2}
					/>
				) : cena.paleta ? (
					<NeonProfundo
						paleta={cena.paleta}
						tamanho={nomeTam * 1.05}
						linhas={[...(cena.pequeno ? [{texto: cena.pequeno}] : []), {texto: cena.nome, grande: true}]}
						progresso={(i) =>
							interpolate(frame - 5 - i * 0.7, [0, 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
						}
					/>
				) : cena.estiloNome ? (
					<NomeEstilizado texto={cena.nome} estilo={cena.estiloNome} tamanho={nomeTam * 0.85} inicio={6} />
				) : (
					<div style={{fontFamily: anton, fontSize: nomeTam, lineHeight: 1, letterSpacing: nomeTam * 0.04}}>
						{[...cena.nome.toUpperCase()].map((ch, i) => {
							const p = interpolate(frame - 6 - ((i * 7) % cena.nome.length), [0, 6], [0, 1], {
								extrapolateLeft: 'clamp',
								extrapolateRight: 'clamp',
							});
							return (
								<span
									key={i}
									style={{
										display: 'inline-block',
										paddingTop: '0.18em',
										marginTop: '-0.18em',
										background: 'linear-gradient(180deg, #fff1b8 0%, #e2b453 40%, #9c6b1c 62%, #f3d27a 100%)',
										WebkitBackgroundClip: 'text',
										backgroundClip: 'text',
										color: 'transparent',
										filter: `drop-shadow(0 0 12px rgba(255,190,80,0.55))${p < 1 ? ` blur(${(1 - p) * 10}px)` : ''}`,
										opacity: p,
										transform: `translateY(${(1 - p) * nomeTam * 0.3}px)`,
									}}
								>
									{ch}
								</span>
							);
						})}
					</div>
				)}
			</div>
		</AbsoluteFill>
	);
};

// Nome ou frase de destaque nos estilos serif, limpo e editorial; letras entram em cascata rápida.
export const NomeEstilizado: React.FC<{texto: string; estilo: EstiloNome; tamanho: number; inicio?: number}> = ({
	texto,
	estilo,
	tamanho,
	inicio = 0,
}) => {
	const frame = useCurrentFrame() - inicio;
	const fonte: React.CSSProperties =
		estilo === 'serif'
			? {fontFamily: playfair, fontStyle: 'italic', fontWeight: 800, letterSpacing: -tamanho * 0.01}
			: estilo === 'limpo'
				? {fontFamily: inter, fontWeight: 800, letterSpacing: -tamanho * 0.03}
				: {fontFamily: dmSerif, fontWeight: 400, letterSpacing: -tamanho * 0.01};
	const sombra =
		estilo === 'limpo' ? '0 4px 18px rgba(0,0,0,0.6)' : '0 0 26px rgba(255,255,255,0.3), 0 4px 20px rgba(0,0,0,0.55)';
	const fio = interpolate(frame, [4, 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const linhaDourada = (
		<div
			style={{
				height: Math.max(2, tamanho * 0.025),
				width: '100%',
				background: 'linear-gradient(90deg, transparent, #e2b453 20%, #f6d98a 50%, #e2b453 80%, transparent)',
				transform: `scaleX(${fio})`,
				boxShadow: '0 0 10px rgba(255,190,80,0.6)',
			}}
		/>
	);
	return (
		<div style={{display: 'inline-flex', flexDirection: 'column', alignItems: 'center'}}>
			{estilo === 'editorial' && <div style={{marginBottom: tamanho * 0.12, width: tamanho * 3}}>{linhaDourada}</div>}
			<div
				style={{position: 'relative', fontSize: tamanho, lineHeight: 1.05, whiteSpace: 'nowrap', zIndex: 0, ...fonte}}
			>
				{estilo === 'limpo' && (
					<div
						style={{
							position: 'absolute',
							left: '2%',
							right: '2%',
							bottom: '0.02em',
							height: '0.12em',
							borderRadius: '0.06em',
							background: AMARELO,
							boxShadow: glowAmarelo(0.5),
							transformOrigin: 'left center',
							transform: `scaleX(${fio})`,
							zIndex: -1,
						}}
					/>
				)}
				{[...texto].map((ch, i) => {
					const p = interpolate(frame - i * 0.9, [0, 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
					return (
						<span
							key={i}
							style={{
								display: 'inline-block',
								color: '#ffffff',
								textShadow: sombra,
								opacity: p,
								transform: `translateY(${(1 - p) * tamanho * 0.2}px)`,
								filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined,
							}}
						>
							{ch === ' ' ? '\u00a0' : ch}
						</span>
					);
				})}
			</div>
			{estilo === 'serif' && <div style={{marginTop: tamanho * 0.06, width: '70%'}}>{linhaDourada}</div>}
			{estilo === 'editorial' && <div style={{marginTop: tamanho * 0.14, width: tamanho * 3}}>{linhaDourada}</div>}
		</div>
	);
};

// Tópicos cinematográficos sobre o vídeo desfocado (o desfoque e o escurecimento vêm da câmera, em VideoEditado).
// Camadas: cor quente, feixes de luz na diagonal, bokeh dourado, grão, vinheta; texto sem caixa.
const OURO = 'linear-gradient(180deg, #fffbe0 0%, #ffe07a 35%, #ffc83a 70%, #f4ad22 100%)';

export const Topicos: React.FC<{cena: De<'topicos'>}> = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const duracao = (cena.ate - cena.de) * fps;
	const entra = interpolate(frame, [0, 10], [0, 1], {extrapolateRight: 'clamp'});
	const sai = interpolate(frame, [duracao - 8, duracao], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const tam = width * 0.085;
	const margemX = width * 0.09;
	const bokeh = Array.from({length: 22}, (_, i) => ({
		x: random(`bx${i}`) * width,
		y: random(`by${i}`) * height,
		r: width * (0.015 + random(`br${i}`) * 0.05),
		o: 0.12 + random(`bo${i}`) * 0.3,
		v: 0.2 + random(`bv${i}`) * 0.5,
	}));
	return (
		<AbsoluteFill style={{opacity: entra * sai}}>
			{/* Fundo em movimento: grid em perspectiva, horizonte aceso e sol quente (substitui o vídeo desfocado). */}
			<FundoGrid horizonte={0.74} />
			{/* Feixes de luz entrando na diagonal. */}
			<AbsoluteFill style={{mixBlendMode: 'screen', overflow: 'hidden'}}>
				{[0, 1, 2].map((i) => (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: width * (-0.2 + i * 0.22) + Math.sin((frame + i * 40) / 50) * 20,
							top: -height * 0.2,
							width: width * (0.12 + i * 0.05),
							height: height * 1.4,
							background:
								'linear-gradient(180deg, rgba(255,220,150,0.6) 0%, rgba(255,205,130,0.22) 55%, transparent 85%)',
							transform: 'rotate(-24deg)',
							filter: `blur(${width * 0.03}px)`,
						}}
					/>
				))}
			</AbsoluteFill>
			{/* Bokeh dourado subindo devagar. */}
			<AbsoluteFill style={{mixBlendMode: 'screen'}}>
				{bokeh.map((b, i) => (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: b.x - b.r,
							top: ((((b.y - frame * b.v) % height) + height) % height) - b.r,
							width: b.r * 2,
							height: b.r * 2,
							borderRadius: '50%',
							background:
								'radial-gradient(circle, rgba(255,215,140,0.9) 0%, rgba(255,190,90,0.35) 55%, transparent 72%)',
							opacity: b.o,
							filter: `blur(${b.r * 0.25}px)`,
						}}
					/>
				))}
			</AbsoluteFill>
			{/* Vinheta. */}
			<AbsoluteFill
				style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 45%, rgba(0,0,0,0.6) 100%)'}}
			/>
			{/* Texto. */}
			<AbsoluteFill
				style={{justifyContent: 'center', paddingLeft: margemX, paddingRight: margemX, paddingBottom: height * 0.2}}
			>
				{cena.titulo && (
					<div
						style={{
							fontFamily: unbounded,
							fontWeight: 300,
							fontSize: tam * 0.42,
							letterSpacing: tam * 0.16,
							textTransform: 'uppercase',
							color: 'rgba(255,240,210,0.85)',
							marginBottom: tam * 0.35,
							textShadow: '0 2px 14px rgba(0,0,0,0.6)',
						}}
					>
						{cena.titulo}
					</div>
				)}
				{cena.itens.map((item, i) => {
					const local = frame - Math.round((item.em - cena.de) * fps);
					const p = spring({frame: local, fps, config: {damping: 18, stiffness: 200, mass: 0.6}});
					const linha = interpolate(local, [4, 16], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
					const partes = item.texto.split(/(\*[^*]+\*)/).filter(Boolean);
					return (
						<div
							key={i}
							style={{
								marginBottom: tam * 0.32,
								opacity: p,
								transform: `translateY(${(1 - p) * tam * 0.5}px)`,
								filter: p < 0.98 ? `blur(${(1 - p) * 10}px)` : undefined,
							}}
						>
							<div style={{display: 'flex', alignItems: 'baseline', gap: tam * 0.3}}>
								<span
									style={{
										fontFamily: spaceMono,
										fontWeight: 400,
										fontSize: tam * 0.36,
										background: OURO_LUXO,
										WebkitBackgroundClip: 'text',
										backgroundClip: 'text',
										color: 'transparent',
										minWidth: tam * 0.62,
									}}
								>
									{String(i + 1).padStart(2, '0')}
								</span>
								<span
									style={{
										// Serifada Gloock (estilo luxo aprovado); a sombra vai no filtro para não vazar
										// pela palavra dourada recortada no degradê.
										fontFamily: gloock,
										fontWeight: 400,
										fontSize: tam * 1.02,
										lineHeight: 1.1,
										color: '#fff',
										filter: 'drop-shadow(0 4px 18px rgba(0,0,0,0.6))',
									}}
								>
									{partes.map((pt, j) =>
										pt.startsWith('*') ? (
											<span
												key={j}
												style={{
													background: OURO_LUXO,
													WebkitBackgroundClip: 'text',
													backgroundClip: 'text',
													color: 'transparent',
													padding: '0 0.02em 0.15em',
													filter: 'drop-shadow(0 0 14px rgba(255,190,60,0.45))',
												}}
											>
												{pt.slice(1, -1)}
											</span>
										) : (
											<span key={j}>{pt}</span>
										),
									)}
								</span>
							</div>
							<div
								style={{
									marginTop: tam * 0.22,
									marginLeft: tam * 0.92,
									height: Math.max(2, tam * 0.025),
									width: `${linha * 70}%`,
									background: 'linear-gradient(90deg, rgba(255,201,60,0.9), rgba(255,201,60,0))',
								}}
							/>
						</div>
					);
				})}
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
