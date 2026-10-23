import React from 'react';
import {
	anton,
	barlowCondensada,
	caveat,
	gloock,
	inter,
	marcador,
	montserrat,
	pixel,
	playfair,
	poppins,
	yesteryear,
} from '../motor/tema';

// Estilos de texto copiados de posts de referência. Fontes, cores e medidas em docs/referencias/tipografia.md.
// Todos recebem `largura`: a largura do bloco em px, e o resto escala a partir dela.
export type EstiloTipografia = 'etiqueta' | 'bomba' | 'designer' | 'rasgado' | 'cassino';

// Ref. 1 ("DTM IMTIHONI"): contorno fino deslocado para cima e à esquerda, como impressão fora de registro.
const ForaDeRegistro: React.FC<{texto: string; tam: number; preenchimento: string; contorno: string}> = ({
	texto,
	tam,
	preenchimento,
	contorno,
}) => (
	<div style={{position: 'relative', lineHeight: 0.92}}>
		<div style={{color: preenchimento}}>{texto}</div>
		<div
			style={{
				position: 'absolute',
				left: -tam * 0.035,
				top: -tam * 0.035,
				color: 'transparent',
				WebkitTextStroke: `${Math.max(1, tam * 0.012)}px ${contorno}`,
			}}
		>
			{texto}
		</div>
	</div>
);

const papelQuadriculado = (passo: number, cor: string): React.CSSProperties => ({
	backgroundImage: `linear-gradient(${cor} 1px, transparent 1px), linear-gradient(90deg, ${cor} 1px, transparent 1px)`,
	backgroundSize: `${passo}px ${passo}px`,
});

// Ref. 1: cartão branco quadriculado inclinado, palavra de cima amarela e a de baixo grafite, Anton com contorno
// deslocado; cartão escuro ao lado com a data escrita à mão e um clipe amarelo prendendo os dois.
export const Etiqueta: React.FC<{cima: string; baixo: string; nota?: string[]; largura: number}> = ({
	cima,
	baixo,
	nota,
	largura,
}) => {
	const lado = largura * 0.6;
	const tamBaixo = (lado * 0.86) / Math.max(4, baixo.length * 0.5);
	return (
		<div style={{position: 'relative', width: largura, height: lado * 1.05}}>
			{nota && (
				<div
					style={{
						position: 'absolute',
						left: lado * 0.92,
						top: lado * 0.14,
						width: largura * 0.4,
						padding: `${lado * 0.07}px ${lado * 0.05}px`,
						borderRadius: lado * 0.05,
						transform: 'rotate(5deg)',
						backgroundColor: '#2b2b2d',
						...papelQuadriculado(lado * 0.07, 'rgba(255,255,255,0.06)'),
						boxShadow: `0 ${lado * 0.03}px ${lado * 0.08}px rgba(0,0,0,0.6)`,
						fontFamily: caveat,
						fontWeight: 600,
						fontSize: lado * 0.12,
						lineHeight: 1.05,
						color: '#f2f2f2',
						textAlign: 'center',
					}}
				>
					{nota.map((l) => (
						<div key={l}>{l}</div>
					))}
				</div>
			)}
			<div
				style={{
					position: 'absolute',
					width: lado,
					height: lado,
					top: lado * 0.03,
					transform: 'rotate(-5deg)',
					borderRadius: lado * 0.05,
					backgroundColor: '#f1f0ec',
					...papelQuadriculado(lado * 0.075, 'rgba(0,0,0,0.09)'),
					boxShadow: `0 ${lado * 0.04}px ${lado * 0.1}px rgba(0,0,0,0.65), inset 0 0 ${lado * 0.15}px rgba(0,0,0,0.12)`,
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center',
					fontFamily: anton,
					textTransform: 'uppercase',
				}}
			>
				<div style={{fontSize: lado * 0.3, marginBottom: lado * 0.02}}>
					<ForaDeRegistro texto={cima} tam={lado * 0.3} preenchimento="#f6b81a" contorno="#9a7a1c" />
				</div>
				<div style={{fontSize: tamBaixo}}>
					<ForaDeRegistro texto={baixo} tam={tamBaixo} preenchimento="#3b3b3d" contorno="#1d1d1f" />
				</div>
			</div>
			{/* Clipe: dois anéis arredondados, amarelo com luz em cima. */}
			<div
				style={{
					position: 'absolute',
					left: lado * 0.78,
					top: lado * 0.02,
					width: lado * 0.38,
					height: lado * 0.15,
					borderRadius: lado,
					border: `${lado * 0.035}px solid #f5b70f`,
					transform: 'rotate(-28deg)',
					boxShadow: `0 ${lado * 0.02}px ${lado * 0.03}px rgba(0,0,0,0.5), inset 0 ${lado * 0.008}px 0 #ffe27a`,
				}}
			/>
		</div>
	);
};

// Ref. 2 ("IT KIDS / GURUHLARIGA / QABUL BOSHLANDI"): etiqueta laranja com Montserrat Black itálica preta,
// palavra enorme Barlow Condensed Black itálica branca com brilho quente, apoio pequeno em duas linhas à direita.
export const Bomba: React.FC<{etiqueta: string; titulo: string; apoio?: string[]; largura: number}> = ({
	etiqueta,
	titulo,
	apoio,
	largura,
}) => {
	const tamTitulo = (largura * 1.02) / Math.max(5, titulo.length * 0.47);
	return (
		<div style={{width: largura, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
			<div
				style={{
					position: 'relative',
					zIndex: 1,
					padding: `${largura * 0.004}px ${largura * 0.05}px ${largura * 0.012}px`,
					borderRadius: largura * 0.025,
					background: 'linear-gradient(180deg, #ffc21a 0%, #ffa000 100%)',
					boxShadow: `0 0 ${largura * 0.06}px rgba(255,170,0,0.45), inset 0 ${largura * 0.004}px 0 #ffe08a`,
					fontFamily: montserrat,
					fontWeight: 900,
					fontStyle: 'italic',
					fontSize: largura * 0.13,
					letterSpacing: -largura * 0.003,
					color: '#141414',
					textTransform: 'uppercase',
					lineHeight: 1.05,
				}}
			>
				{etiqueta}
			</div>
			<div
				style={{
					marginTop: -tamTitulo * 0.12,
					fontFamily: barlowCondensada,
					fontWeight: 900,
					fontStyle: 'italic',
					fontSize: tamTitulo,
					lineHeight: 0.9,
					letterSpacing: -tamTitulo * 0.01,
					textTransform: 'uppercase',
					background: 'linear-gradient(180deg, #ffffff 0%, #f3ede2 60%, #d8d0c2 100%)',
					WebkitBackgroundClip: 'text',
					backgroundClip: 'text',
					color: 'transparent',
					filter: `drop-shadow(0 0 ${tamTitulo * 0.08}px rgba(255,230,190,0.55)) drop-shadow(0 0 ${tamTitulo * 0.25}px rgba(255,180,80,0.25))`,
				}}
			>
				{titulo}
			</div>
			{apoio && (
				<div
					style={{
						alignSelf: 'flex-end',
						marginRight: largura * 0.04,
						marginTop: largura * 0.01,
						fontFamily: montserrat,
						fontWeight: 800,
						fontStyle: 'italic',
						fontSize: largura * 0.058,
						lineHeight: 1,
						color: '#ffffff',
						textTransform: 'uppercase',
						textShadow: `0 0 ${largura * 0.02}px rgba(255,255,255,0.35)`,
					}}
				>
					{apoio.map((l) => (
						<div key={l}>{l}</div>
					))}
				</div>
			)}
		</div>
	);
};

// Ref. 3 ("É POR ISSO / que você precisa de um / Designer"): serifa de alto contraste (Gloock) desfocada no alto,
// atrás da pessoa; frase de ligação em Inter fina cinza + Inter semibold branca; palavra final enorme em Gloock.
export const Designer: React.FC<{
	titulo?: string;
	fina: string;
	forte: string;
	palavra: string;
	pilula?: string;
	largura: number;
}> = ({titulo, fina, forte, palavra, pilula, largura}) => {
	const tamPalavra = (largura * 1.05) / Math.max(4, palavra.length * 0.62);
	return (
		<div style={{width: largura, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
			{titulo && (
				<div
					style={{
						fontFamily: gloock,
						fontSize: largura * 0.14,
						lineHeight: 1,
						color: '#d9d6d0',
						textTransform: 'uppercase',
						filter: `blur(${largura * 0.003}px)`,
						opacity: 0.92,
						marginBottom: largura * 0.12,
					}}
				>
					{titulo}
				</div>
			)}
			<div
				style={{
					alignSelf: 'stretch',
					display: 'flex',
					alignItems: 'center',
					gap: largura * 0.02,
					fontFamily: inter,
					fontSize: largura * 0.058,
					letterSpacing: -largura * 0.002,
					whiteSpace: 'nowrap',
				}}
			>
				<span style={{fontWeight: 300, color: '#a9a9a9'}}>{fina}</span>
				<span style={{fontWeight: 600, color: '#ffffff'}}>{forte}</span>
				{pilula && (
					<span
						style={{
							marginLeft: 'auto',
							display: 'flex',
							alignItems: 'center',
							gap: largura * 0.03,
							padding: `${largura * 0.008}px ${largura * 0.012}px ${largura * 0.008}px ${largura * 0.03}px`,
							borderRadius: largura,
							backgroundColor: 'rgba(110,110,110,0.55)',
							fontFamily: poppins,
							fontWeight: 400,
							fontSize: largura * 0.018,
							letterSpacing: largura * 0.012,
							color: '#ffffff',
						}}
					>
						{pilula.toUpperCase()}
						<span
							style={{
								width: largura * 0.026,
								height: largura * 0.026,
								borderRadius: '50%',
								backgroundColor: '#fff',
								color: '#333',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontSize: largura * 0.018,
								letterSpacing: 0,
							}}
						>
							›
						</span>
					</span>
				)}
			</div>
			<div
				style={{
					fontFamily: gloock,
					fontSize: tamPalavra,
					lineHeight: 1.05,
					letterSpacing: -tamPalavra * 0.015,
					color: '#ffffff',
					textShadow: `0 ${tamPalavra * 0.03}px ${tamPalavra * 0.12}px rgba(0,0,0,0.6)`,
				}}
			>
				{palavra}
			</div>
		</div>
	);
};

// Ref. 4 ("SÓ VENDER / Não é o / SUFICIENTE"): pixel (Silkscreen) cinza em degradê, sans fina cinza, pílula escura
// com seta e a palavra final "recortada" com uma fonte diferente por letra, mais um traço de pincel com seta embaixo.
const RECORTE: React.CSSProperties[] = [
	{fontFamily: marcador, fontSize: '1.05em'},
	{fontFamily: gloock, fontSize: '0.95em'},
	{fontFamily: anton, fontSize: '0.9em', textTransform: 'uppercase'},
	{fontFamily: barlowCondensada, fontWeight: 900, fontStyle: 'italic', fontSize: '1.1em', textTransform: 'uppercase'},
	{fontFamily: poppins, fontWeight: 900, fontSize: '0.85em'},
	{fontFamily: pixel, fontWeight: 700, fontSize: '0.8em', textTransform: 'uppercase'},
	{fontFamily: playfair, fontWeight: 800, fontStyle: 'italic', fontSize: '1em'},
];
const ARCO_IRIS = 'linear-gradient(100deg, #ff4fa3 0%, #ffb340 30%, #6dffb0 55%, #4fb8ff 80%, #b36dff 100%)';

export const Rasgado: React.FC<{topo: string; meio: string; pilula?: string; fim: string; largura: number}> = ({
	topo,
	meio,
	pilula,
	fim,
	largura,
}) => {
	const tamTopo = (largura * 0.98) / Math.max(5, topo.length * 1.05);
	const tamFim = (largura * 1.05) / Math.max(5, fim.length * 0.62);
	const letrasFim = [...fim];
	return (
		<div style={{width: largura, display: 'flex', flexDirection: 'column', alignItems: 'stretch'}}>
			<div
				style={{
					fontFamily: pixel,
					fontWeight: 700,
					fontSize: tamTopo,
					lineHeight: 1,
					textAlign: 'center',
					textTransform: 'uppercase',
					background: 'linear-gradient(180deg, #a9a9ab 0%, #d7d7d9 55%, #9c9c9e 100%)',
					WebkitBackgroundClip: 'text',
					backgroundClip: 'text',
					color: 'transparent',
					WebkitTextStroke: `${Math.max(1, tamTopo * 0.02)}px #7d7d80`,
				}}
			>
				{topo}
			</div>
			<div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: largura * 0.01}}>
				{pilula ? (
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: largura * 0.03,
							padding: `${largura * 0.012}px ${largura * 0.012}px ${largura * 0.012}px ${largura * 0.04}px`,
							borderRadius: largura,
							background: 'linear-gradient(90deg, #3f3f42 0%, #5a5a5e 100%)',
							fontFamily: poppins,
							fontWeight: 400,
							fontSize: largura * 0.026,
							color: '#ffffff',
						}}
					>
						{pilula}
						<span
							style={{
								width: largura * 0.06,
								height: largura * 0.06,
								borderRadius: '50%',
								backgroundColor: '#e9e9e9',
								color: '#333',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontSize: largura * 0.035,
							}}
						>
							↗
						</span>
					</div>
				) : (
					<span />
				)}
				<div style={{fontFamily: poppins, fontWeight: 300, fontSize: largura * 0.11, lineHeight: 1, color: '#7a7a7c'}}>
					{meio}
				</div>
			</div>
			<div
				style={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'baseline',
					fontSize: tamFim,
					lineHeight: 1.05,
					color: '#454547',
				}}
			>
				{letrasFim.map((l, i) => {
					const arcoIris = i === Math.floor(letrasFim.length * 0.75);
					return (
						<span
							key={i}
							style={{
								...RECORTE[(i * 3) % RECORTE.length],
								...(arcoIris
									? {background: ARCO_IRIS, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}
									: {}),
								letterSpacing: -tamFim * 0.02,
							}}
						>
							{l}
						</span>
					);
				})}
			</div>
			{/* Traço de pincel cinza com uma seta fina saindo para a direita. */}
			<svg width={largura} height={largura * 0.08} viewBox="0 0 100 8" style={{marginTop: -largura * 0.01}}>
				<defs>
					<linearGradient id="traco-rasgado" x1="0" x2="1">
						<stop offset="0" stopColor="#8a8a8c" />
						<stop offset="0.55" stopColor="#c9c9cb" />
						<stop offset="0.75" stopColor="#d0d0d2" stopOpacity="0.4" />
						<stop offset="1" stopColor="#d0d0d2" stopOpacity="0" />
					</linearGradient>
				</defs>
				<path d="M1 3 Q 30 1.6 70 2.6 L 70 4.6 Q 30 4 1 5.2 Z" fill="url(#traco-rasgado)" />
				<path d="M68 6.2 Q 82 7.6 96 4.4" fill="none" stroke="#3a3a3c" strokeWidth="0.4" strokeLinecap="round" />
				<path d="M93.6 3.9 L 96 4.4 L 94.6 6.3" fill="none" stroke="#3a3a3c" strokeWidth="0.4" strokeLinecap="round" />
			</svg>
		</div>
	);
};

// Ref. 5 ("CHANCE / $500" + "Turn / Thousand"): serifa grossa condensada verde ao fundo e script branco desfocado
// por cima, com legenda pequena em caixa alta verde-clara.
export const Cassino: React.FC<{fundo: string[]; script: string[]; legenda?: string[]; largura: number}> = ({
	fundo,
	script,
	legenda,
	largura,
}) => {
	const maior = Math.max(...fundo.map((l) => l.length));
	const tamFundo = (largura * 1.1) / Math.max(3, maior * 0.62);
	return (
		<div style={{width: largura, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
			{legenda && (
				<div
					style={{
						fontFamily: montserrat,
						fontWeight: 500,
						fontSize: largura * 0.028,
						lineHeight: 1.35,
						letterSpacing: largura * 0.001,
						color: '#d7e6a6',
						textAlign: 'center',
						textTransform: 'uppercase',
						marginBottom: largura * 0.06,
					}}
				>
					{legenda.map((l) => (
						<div key={l}>{l}</div>
					))}
				</div>
			)}
			<div style={{position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
				{fundo.map((l, i) => (
					<div
						key={l}
						style={{
							fontFamily: playfair,
							fontWeight: 800,
							// Cada linha ocupa a largura toda, como no post ("$500" sai maior que "CHANCE").
							fontSize: Math.min(tamFundo * 1.5, (largura * 1.1) / Math.max(3, l.length * 0.62)),
							lineHeight: 1.05,
							marginTop: i ? -tamFundo * 0.22 : 0,
							letterSpacing: -tamFundo * 0.03,
							transform: 'scaleX(0.78)',
							textTransform: 'uppercase',
							background: 'linear-gradient(180deg, #a6d45a 0%, #7fb83a 55%, #5c8f24 100%)',
							WebkitBackgroundClip: 'text',
							backgroundClip: 'text',
							color: 'transparent',
						}}
					>
						{l}
					</div>
				))}
				<div
					style={{
						position: 'absolute',
						inset: 0,
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'space-around',
						alignItems: 'center',
						fontFamily: yesteryear,
						fontSize: tamFundo * 0.62,
						lineHeight: 1,
						color: '#ffffff',
						filter: `blur(${largura * 0.0025}px)`,
						textShadow: `0 0 ${tamFundo * 0.06}px rgba(255,255,255,0.8), 0 ${tamFundo * 0.04}px ${tamFundo * 0.1}px rgba(0,0,0,0.7)`,
					}}
				>
					{script.map((l, i) => (
						<div key={l} style={{transform: `translateX(${(i % 2 ? 1 : -1) * largura * 0.04}px)`}}>
							{l}
						</div>
					))}
				</div>
			</div>
		</div>
	);
};
