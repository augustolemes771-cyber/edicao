import {Vitrine} from './Vitrine';
import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Video} from '@remotion/media';
import {useCiclo, useEntradaEm} from '../motor/anim';
import type {CenaNoPlano, Fundo as TipoFundo, Posicao} from '../motor/plano';
import {brilho, cor, poppins, useMargem} from '../motor/tema';
import {Estrela} from './Estrela';
import {Grade} from './Grade';
import {Logo3D} from './Logo3D';
import {Passo} from './Passo';
import {Titulo} from './Titulo';
import {Cenario} from './Cenario';
import {
	Alertas,
	Anel,
	Broll,
	Cartao,
	Checklist,
	Comentarios,
	Foto,
	Gigante,
	Icone,
	Kicker,
	Letras,
	Preto,
	Rec,
	Retrato,
	Topicos,
} from './Referencias';

type Props = {cena: CenaNoPlano; pasta: string};

const tomDoFundo = (f: TipoFundo | undefined, modo: CenaNoPlano['modo']) =>
	modo === 'sobre' ? 'escuro' : f === 'verde' ? 'verde' : f === 'branco' ? 'branco' : 'escuro';

// Fundo das telas cheias: preto com grade, verde-azulado ou branco pontual.
const Fundo: React.FC<{fundo?: TipoFundo; cena: CenaNoPlano}> = ({fundo = 'grade', cena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const abre =
		cena.entra === 'corte' ? 1 : spring({frame, fps, config: {damping: 20, stiffness: 160}, durationInFrames: 10});
	const fundoCor = fundo === 'verde' ? cor.verde : fundo === 'branco' ? cor.branco : cor.preto;
	return (
		<AbsoluteFill
			style={{
				backgroundColor: fundoCor,
				clipPath: abre < 1 ? `circle(${abre * 120}% at 50% 50%)` : undefined,
			}}
		>
			{fundo !== 'branco' && <Grade sobreVerde={fundo === 'verde'} />}
		</AbsoluteFill>
	);
};

const alinhamento = (p: Posicao | undefined): React.CSSProperties => {
	switch (p) {
		case 'esquerda':
			return {justifyContent: 'center', alignItems: 'flex-start', paddingRight: '50%'};
		case 'direita':
			return {justifyContent: 'center', alignItems: 'flex-end', paddingLeft: '50%'};
		case 'topo':
			return {justifyContent: 'flex-start', alignItems: 'center'};
		case 'baixo':
			return {justifyContent: 'flex-end', alignItems: 'center'};
		default:
			return {justifyContent: 'center', alignItems: 'center'};
	}
};

// Área segura: margens da skill já contando o punch de 6%.
const Seguro: React.FC<{posicao?: Posicao; children: React.ReactNode; style?: React.CSSProperties}> = ({
	posicao,
	children,
	style,
}) => {
	const m = useMargem();
	return (
		<AbsoluteFill
			style={{
				padding: `${m.topo}px ${m.lado}px ${m.base}px`,
				display: 'flex',
				flexDirection: 'column',
				...alinhamento(posicao),
				...style,
			}}
		>
			{children}
		</AbsoluteFill>
	);
};

const Conteudo: React.FC<Props> = ({cena, pasta}) => {
	const {fps} = useVideoConfig();
	const margemCena = useMargem();
	const frame = useCurrentFrame();
	const tom = tomDoFundo('fundo' in cena ? cena.fundo : undefined, cena.modo);

	switch (cena.tipo) {
		case 'titulo': {
			const quadros = cena.tempos?.map((t) => Math.max(0, Math.round((t - cena.de) * fps)));
			const pSobre = spring({frame, fps, config: {damping: 18}});
			return (
				<Seguro posicao={cena.posicao}>
					{cena.sobretitulo && (
						<div
							style={{
								fontFamily: poppins,
								fontWeight: 600,
								fontSize: 34,
								letterSpacing: 6,
								textTransform: 'uppercase',
								color: tom === 'escuro' ? cor.destaque : tom === 'verde' ? cor.preto : cor.verde,
								textShadow: tom === 'escuro' ? brilho(cor.halo, 0.5) : undefined,
								marginBottom: 22,
								opacity: pSobre,
							}}
						>
							{cena.sobretitulo}
						</div>
					)}
					<Titulo
						texto={cena.texto}
						tamanho={cena.tamanho}
						fundo={tom}
						quadros={quadros}
						alinhar={cena.posicao === 'esquerda' ? 'left' : 'center'}
					/>
				</Seguro>
			);
		}
		case 'numero': {
			const p = spring({frame, fps, config: {damping: 11, stiffness: 180, mass: 0.7}});
			const pLeg = spring({frame: frame - 8, fps, config: {damping: 16}});
			const franja = interpolate(p, [0, 1], [16, 2.5]);
			const corNum = tom === 'verde' ? cor.branco : tom === 'branco' ? cor.preto : cor.branco;
			const camada = (c: string, dx: number) => (
				<span
					style={{
						position: 'absolute',
						inset: 0,
						color: c,
						transform: `translateX(${dx}px)`,
						mixBlendMode: 'screen',
						opacity: 0.85,
					}}
				>
					{cena.valor}
				</span>
			);
			return (
				<Seguro posicao={cena.posicao}>
					<div
						style={{
							position: 'relative',
							fontFamily: poppins,
							fontWeight: 800,
							fontSize: 300,
							lineHeight: 1,
							letterSpacing: -12,
							transform: `scale(${interpolate(p, [0, 1], [1.5, 1])})`,
							opacity: Math.min(1, p * 2),
						}}
					>
						{tom === 'escuro' && camada(cor.franjaVermelha, -franja)}
						{tom === 'escuro' && camada(cor.franjaAzul, franja)}
						<span
							style={{
								position: 'relative',
								color: corNum,
								textShadow: tom === 'escuro' ? `${brilho(cor.halo, 1.4)}, 0 0 4px #fff` : undefined,
							}}
						>
							{cena.valor}
						</span>
					</div>
					{cena.legenda && (
						<div
							style={{
								fontFamily: poppins,
								fontWeight: 600,
								fontSize: 54,
								marginTop: 20,
								color: tom === 'verde' ? cor.preto : tom === 'branco' ? cor.verde : cor.branco,
								opacity: pLeg,
								transform: `translateY(${(1 - pLeg) * 20}px)`,
								textAlign: 'center',
							}}
						>
							{cena.legenda}
						</div>
					)}
				</Seguro>
			);
		}
		case 'lista':
			return (
				<Seguro posicao="centro" style={{alignItems: 'flex-start', paddingLeft: 260}}>
					{cena.titulo && (
						<div style={{marginBottom: 40}}>
							<Titulo texto={cena.titulo} tamanho={78} fundo={tom} alinhar="left" />
						</div>
					)}
					{cena.itens.map((item, i) => (
						<ItemLista key={i} texto={item.texto} em={item.em} inicioCena={cena.de} tom={tom} />
					))}
				</Seguro>
			);
		case 'passo':
			return (
				<Seguro posicao={cena.posicao ?? (cena.modo === 'sobre' ? 'topo' : 'centro')}>
					<Passo rotulo={cena.rotulo} texto={cena.texto} escala={cena.modo === 'sobre' ? 0.8 : 1.15} />
				</Seguro>
			);
		case 'estrela':
			return (
				<Seguro posicao={cena.posicao ?? (cena.modo === 'sobre' ? 'direita' : 'centro')}>
					<Estrela tamanho={cena.modo === 'sobre' ? 150 : 260} />
					{cena.texto && (
						<div style={{marginTop: 10}}>
							<Titulo texto={cena.texto} tamanho={cena.modo === 'sobre' ? 64 : 96} fundo={tom} quadros={[6]} />
						</div>
					)}
				</Seguro>
			);
		case 'logo3d':
			return (
				<Seguro>
					<Logo3D />
					{cena.texto && (
						<div style={{marginTop: 30}}>
							<Titulo texto={cena.texto} tamanho={84} fundo={tom} quadros={[10]} />
						</div>
					)}
				</Seguro>
			);
		case 'painel':
			return <Painel titulo={cena.titulo} itens={cena.itens} lado={cena.lado ?? 'direita'} />;
		case 'tela':
			return (
				<AbsoluteFill style={{backgroundColor: cor.preto}}>
					<Video
						src={staticFile(`${pasta}/${cena.src}`)}
						trimBefore={Math.round((cena.inicioNaFonte ?? 0) * fps)}
						muted
						objectFit="contain"
					/>
				</AbsoluteFill>
			);
		case 'imagem': {
			const p = spring({frame, fps, config: {damping: 16}});
			return (
				<Seguro>
					<div
						style={{
							borderRadius: 26,
							overflow: 'hidden',
							border: `2px solid ${cor.verde}`,
							boxShadow: brilho(cor.halo, 0.9),
							maxWidth: 1300,
							maxHeight: 700,
							transform: `scale(${0.9 + 0.1 * p})`,
							opacity: p,
						}}
					>
						<Img
							src={staticFile(`${pasta}/${cena.src}`)}
							style={{display: 'block', maxWidth: 1300, maxHeight: 700, transform: `scale(${1 + frame / 2400})`}}
						/>
					</div>
					{cena.legenda && (
						<div style={{marginTop: 28}}>
							<Titulo texto={cena.legenda} tamanho={54} fundo={tom} quadros={[8]} />
						</div>
					)}
				</Seguro>
			);
		}
		case 'cartao':
			return <Cartao cena={cena} />;
		case 'letras':
			return <Letras cena={cena} />;
		case 'kicker':
			return <Kicker cena={cena} />;
		case 'foto':
			return <Foto cena={cena} pasta={pasta} />;
		case 'comentarios':
			return <Comentarios cena={cena} />;
		case 'icone':
			return <Icone cena={cena} pasta={pasta} />;
		case 'broll':
			return <Broll cena={cena} pasta={pasta} />;
		case 'preto':
			return <Preto />;
		case 'checklist':
			return <Checklist cena={cena} />;
		case 'cenario':
			return <Cenario cena={cena} />;
		case 'anel':
			return <Anel cena={cena} />;
		case 'rec':
			return <Rec />;
		case 'alertas':
			return <Alertas cena={cena} />;
		case 'gigante':
			return <Gigante cena={cena} />;
		case 'retrato':
			return <Retrato cena={cena} pasta={pasta} />;
		case 'topicos':
			return <Topicos cena={cena} />;
		case 'vitrine':
			return <Vitrine cena={cena} />;
		case 'despedida': {
			const p = spring({frame, fps, config: {damping: 18}});
			const m = margemCena;
			return (
				<AbsoluteFill
					style={{justifyContent: 'flex-end', alignItems: 'flex-start', padding: `${m.base}px ${m.lado}px`}}
				>
					<div
						style={{
							fontFamily: poppins,
							fontWeight: 600,
							fontSize: 34,
							color: cor.branco,
							padding: '12px 26px',
							borderRadius: 999,
							background: 'rgba(3,4,5,0.7)',
							border: `1.5px solid ${cor.verde}`,
							boxShadow: brilho(cor.halo, 0.4),
							opacity: p,
							transform: `translateY(${(1 - p) * 20}px)`,
						}}
					>
						{cena.texto}
					</div>
				</AbsoluteFill>
			);
		}
	}
};

const ItemLista: React.FC<{texto: string; em: number; inicioCena: number; tom: string}> = ({
	texto,
	em,
	inicioCena,
	tom,
}) => {
	const p = useEntradaEm(em, inicioCena);
	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: 26,
				marginBottom: 26,
				opacity: p,
				transform: `translateX(${(1 - p) * -60}px)`,
			}}
		>
			<div style={{width: 46, height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
				<svg width={46} height={46} viewBox="-23 -23 46 46" overflow="visible">
					<path
						d="M0,-20 Q3,-3 20,0 Q3,3 0,20 Q-3,3 -20,0 Q-3,-3 0,-20 Z"
						fill={tom === 'verde' ? cor.preto : cor.destaque}
						style={tom === 'escuro' ? {filter: `drop-shadow(0 0 6px ${cor.halo})`} : undefined}
					/>
				</svg>
			</div>
			<div
				style={{
					fontFamily: poppins,
					fontWeight: 600,
					fontSize: 58,
					color: tom === 'branco' ? cor.preto : cor.branco,
					textShadow: tom === 'escuro' ? '0 0 12px rgba(255,255,255,0.3)' : undefined,
				}}
			>
				{texto}
			</div>
		</div>
	);
};

// Painel lateral estreito, para não cobrir a tela do computador gravada.
const Painel: React.FC<{titulo: string; itens?: string[]; lado: 'esquerda' | 'direita'}> = ({titulo, itens, lado}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const p = spring({frame, fps, config: {damping: 18, stiffness: 170}});
	const m = useMargem();
	return (
		<AbsoluteFill
			style={{
				justifyContent: 'flex-start',
				alignItems: lado === 'direita' ? 'flex-end' : 'flex-start',
				padding: `${m.topo}px ${m.lado - 40}px`,
			}}
		>
			<div
				style={{
					width: 420,
					padding: '28px 30px',
					borderRadius: 22,
					background: 'rgba(3,4,5,0.78)',
					backdropFilter: 'blur(14px)',
					border: '1px solid rgba(255,255,255,0.12)',
					boxShadow: `0 0 0 1px ${cor.verde}55, 0 0 24px ${cor.halo}44`,
					fontFamily: poppins,
					color: cor.branco,
					transform: `translateX(${(1 - p) * (lado === 'direita' ? 480 : -480)}px)`,
				}}
			>
				<div
					style={{
						fontWeight: 700,
						fontSize: 34,
						color: cor.destaque,
						textShadow: brilho(cor.halo, 0.4),
						marginBottom: 14,
					}}
				>
					{titulo}
				</div>
				{itens?.map((item, i) => {
					const pi = spring({frame: frame - 8 - i * 5, fps, config: {damping: 18}});
					return (
						<div key={i} style={{fontSize: 28, fontWeight: 400, lineHeight: 1.35, marginTop: 8, opacity: pi}}>
							{item}
						</div>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};

export const CenaVisual: React.FC<Props> = ({cena, pasta}) => {
	const {saida} = useCiclo(cena);
	// Peças com fundo próprio não recebem a grade do canal.
	const fundoProprio = ['tela', 'cartao', 'letras', 'icone', 'broll', 'preto', 'cenario'].includes(cena.tipo);
	const cheia = cena.modo === 'cheia' && !fundoProprio;
	return (
		<AbsoluteFill
			style={{
				opacity: saida,
				transform: cena.sai === 'anima' ? `scale(${1 + (1 - saida) * 0.04})` : undefined,
			}}
		>
			{cheia && <Fundo fundo={'fundo' in cena ? cena.fundo : undefined} cena={cena} />}
			<Conteudo cena={cena} pasta={pasta} />
		</AbsoluteFill>
	);
};
