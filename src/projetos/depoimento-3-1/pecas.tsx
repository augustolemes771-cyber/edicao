// Peças (efeitos) exclusivas do depoimento-3-1, usadas no edit.ts com {tipo: 'peca', nome: '<chave>', dados: {...}}.
// Chaves com prefixo d31 (o registro em src/pecas/registro.ts junta as peças de todos os projetos).
// Tempos em `dados` = segundos do vídeo editado. Tela inteira com a grade do FundoMotion, paleta roxo + ouro.
import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import type {CenaPeca, Pecas} from '../../pecas/peca';
import {FundoMotion} from '../../pecas/FundoMotion';
import {CameraTremor, Linha3D, Luzes} from '../../pecas/tres/Texto3D';
import {poppins} from '../../motor/tema';

const lim = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const OURO = '#E8C27A';
const GL = {alpha: true, antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05};
const CAMERA = {fov: 35, position: [0, 0, 14.5] as [number, number, number], near: 0.1, far: 60};
const yMundo = (px: number) => ((960 - px) / 960) * 14.5 * Math.tan((35 / 2) * (Math.PI / 180));

const useCena = (cena: CenaPeca) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const fim = Math.round((cena.ate - cena.de) * fps);
	const q = (s: unknown) => Math.round(Math.max(0, Number(s) - cena.de) * fps);
	const op = interpolate(frame, [0, 6, fim - 7, fim], [0, 1, 1, 0], lim);
	return {frame, fps, width, height, fim, q, op};
};

// Mola de 0 a 1 a partir de um quadro.
const mola = (frame: number, fps: number, de: number, rigidez = 140) => spring({frame: frame - de, fps, config: {damping: 14, stiffness: rigidez}});

const Rotulo: React.FC<{texto: string; y: number; p: number; cor?: string}> = ({texto, y, p, cor = '#fff'}) => (
	<div style={{position: 'absolute', top: y, width: '100%', textAlign: 'center', opacity: p, transform: `translateY(${(1 - p) * 20}px)`, fontFamily: poppins, fontWeight: 800, fontSize: 40, letterSpacing: '0.16em', color: cor}}>
		{texto}
	</div>
);

// ---------------------------------------------------------------- 1. nunca teve resultado
// "nunca tinha tido resultado": gráfico de 3 anos com a linha reta no zero, passando por ANO 1, 2 e 3; no "resultado" o
// R$ 0 cai em prata 3D em cima.
const d31Zero: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, width, height, fim, q, op} = useCena(cena);
	const d = cena.dados as {emZero: number};
	const zero = q(d.emZero);
	const traco = interpolate(frame, [2, Math.max(8, zero)], [0, 1], {...lim, easing: Easing.out(Easing.cubic)});
	const x0 = 150;
	const x1 = 930;
	const yZ = 1180;
	const xa = x0 + (x1 - x0) * traco;
	return (
		<AbsoluteFill style={{opacity: op}}>
			<FundoMotion />
			<svg width={width} height={height} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
				{/* eixos */}
				<line x1={x0} y1={760} x2={x0} y2={yZ} stroke="rgba(255,255,255,0.35)" strokeWidth={4} />
				<line x1={x0} y1={yZ} x2={x1} y2={yZ} stroke="rgba(255,255,255,0.35)" strokeWidth={4} />
				{[0.25, 0.5, 0.75].map((f) => (
					<line key={f} x1={x0} y1={yZ - 420 * f} x2={x1} y2={yZ - 420 * f} stroke="rgba(255,255,255,0.08)" strokeWidth={2} strokeDasharray="10 12" />
				))}
				{/* linha reta no zero */}
				<line x1={x0} y1={yZ} x2={xa} y2={yZ} stroke="#c9ccd8" strokeWidth={12} strokeLinecap="round" />
				<circle cx={xa} cy={yZ} r={18} fill="#ffffff" opacity={traco > 0.02 ? 1 : 0} />
				{[1, 2, 3].map((ano, i) => {
					const x = x0 + ((x1 - x0) * (i + 0.8)) / 3.2;
					const v = interpolate(xa, [x - 40, x], [0, 1], lim);
					return (
						<g key={ano} opacity={v}>
							<line x1={x} y1={yZ - 14} x2={x} y2={yZ + 14} stroke={OURO} strokeWidth={5} />
							<text x={x} y={yZ + 74} textAnchor="middle" fontFamily={poppins} fontWeight={800} fontSize={40} letterSpacing={4} fill="#fff">
								ANO {ano}
							</text>
						</g>
					);
				})}
			</svg>
			<Rotulo texto="RESULTADO" y={820} p={interpolate(frame, [2, 9], [0, 1], lim)} cor="rgba(255,255,255,0.75)" />
			<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
				<CameraTremor quadro={frame} batidas={[zero]} z0={14.5} z1={13.9} duracao={fim} />
				<Luzes quadro={frame} batidas={[zero]} />
				<Linha3D ate={fim - 8} texto="R$ 0" metal="branco" largura={3.2} y={yMundo(470)} quadro={frame} batida={zero} profundidade={0.5} />
			</ThreeCanvas>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 2. mentorias que não entregavam a metade
// Três cartões de mentoria caem em leque (com o preço $$$ carimbado no "valores"); no "não entregavam" eles sobem e uma
// barra ENTREGA enche e trava na METADE (50%) no "metade".
const d31Metade: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, width, height, fim, q, op} = useCena(cena);
	const d = cena.dados as {emCartas: number; emValores: number; emEntrega: number; emMetade: number};
	const cartas = q(d.emCartas);
	const valores = q(d.emValores);
	const entrega = q(d.emEntrega);
	const metade = q(d.emMetade);
	const sobe = interpolate(frame, [entrega, entrega + 8], [0, 1], {...lim, easing: Easing.inOut(Easing.cubic)});
	const barraP = mola(frame, fps, entrega, 180);
	const enche = interpolate(frame, [entrega + 2, metade], [0, 0.5], {...lim, easing: Easing.out(Easing.quad)});
	const trava = mola(frame, fps, metade, 220);
	const tremor = frame >= metade && frame < metade + 8 ? Math.sin(frame * 3) * 6 * (1 - (frame - metade) / 8) : 0;
	return (
		<AbsoluteFill style={{opacity: op}}>
			<FundoMotion />
			{/* cartões de mentoria */}
			{[-1, 0, 1].map((k, i) => {
				const p = mola(frame, fps, cartas + i * 4, 160);
				const selo = mola(frame, fps, valores + i * 3, 200);
				const x = 540 + k * 250;
				const y = interpolate(sobe, [0, 1], [760, 470]) + (1 - p) * -700;
				const esc = interpolate(sobe, [0, 1], [1, 0.72]);
				return (
					<div
						key={k}
						style={{
							position: 'absolute',
							left: x - 140,
							top: y,
							width: 280,
							height: 380,
							borderRadius: 28,
							transform: `rotate(${k * 9 * p}deg) scale(${esc})`,
							background: 'linear-gradient(160deg, rgba(91,52,168,0.95), rgba(36,18,72,0.95))',
							boxShadow: `inset 0 0 0 3px ${OURO}, 0 24px 50px rgba(0,0,0,0.45)`,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
							gap: 18,
							opacity: p,
						}}
					>
						<div style={{fontFamily: poppins, fontWeight: 800, fontSize: 30, letterSpacing: '0.12em', color: '#fff'}}>MENTORIA</div>
						<div style={{width: 120, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.25)'}} />
						<div style={{width: 160, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.18)'}} />
						<div
							style={{
								marginTop: 16,
								padding: '8px 22px',
								borderRadius: 14,
								background: OURO,
								color: '#1E0F3A',
								fontFamily: poppins,
								fontWeight: 900,
								fontSize: 48,
								opacity: selo,
								transform: `scale(${1.8 - 0.8 * selo}) rotate(-8deg)`,
							}}
						>
							$$$
						</div>
					</div>
				);
			})}
			{/* barra de entrega */}
			<div style={{position: 'absolute', left: 140, top: 1020, width: 800, opacity: barraP, transform: `translate(${tremor}px, ${(1 - barraP) * 40}px)`}}>
				<div style={{fontFamily: poppins, fontWeight: 800, fontSize: 38, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.8)', marginBottom: 18}}>ENTREGA</div>
				<div style={{position: 'relative', height: 70, borderRadius: 35, background: 'rgba(255,255,255,0.1)', boxShadow: 'inset 0 0 0 3px rgba(255,255,255,0.25)', overflow: 'hidden'}}>
					<div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${enche * 100}%`, borderRadius: 35, background: 'linear-gradient(90deg, #8d90a0, #d6d8e2)'}} />
					<div style={{position: 'absolute', left: '50%', top: -10, bottom: -10, width: 5, background: OURO, opacity: trava}} />
				</div>
				<div style={{display: 'flex', justifyContent: 'center', marginTop: 26}}>
					<div style={{fontFamily: poppins, fontWeight: 900, fontSize: 92, color: OURO, opacity: trava, transform: `scale(${1.6 - 0.6 * trava})`, textShadow: '0 0 30px rgba(232,194,122,0.5)'}}>
						{Math.round(enche * 100)}%
					</div>
				</div>
			</div>
			<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
				<Luzes quadro={frame} batidas={[metade]} />
				<Linha3D ate={fim - 8} texto="A METADE" metal="cinza" largura={3.8} y={yMundo(1440)} quadro={frame} batida={metade} profundidade={0.45} />
			</ThreeCanvas>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 3. pediu demissão da CLT
// Carteira de trabalho (CLT) em vidro roxo entra girando; no "demissão" o carimbo DEMISSÃO bate em ouro com tremor;
// no "CLT" a carteira é jogada para fora pela direita.
const d31Demissao: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, fim, q, op} = useCena(cena);
	const d = cena.dados as {emCarimbo: number; emSai: number};
	const carimbo = q(d.emCarimbo);
	const sai = q(d.emSai);
	const entra = mola(frame, fps, 0, 150);
	const bate = mola(frame, fps, carimbo, 260);
	const voa = interpolate(frame, [sai, Math.min(fim - 6, sai + 10)], [0, 1], {...lim, easing: Easing.in(Easing.cubic)});
	const tremor = frame >= carimbo && frame < carimbo + 9 ? Math.sin(frame * 2.7) * 14 * (1 - (frame - carimbo) / 9) : 0;
	return (
		<AbsoluteFill style={{opacity: op}}>
			<FundoMotion />
			<div
				style={{
					position: 'absolute',
					left: 240,
					top: 560,
					width: 600,
					height: 800,
					borderRadius: 36,
					transform: `translate(${tremor + voa * 900}px, ${(1 - entra) * 300}px) rotate(${(1 - entra) * -18 + voa * 35}deg) scale(${0.85 + 0.15 * entra})`,
					opacity: entra,
					background: 'linear-gradient(165deg, #3a2470 0%, #22124a 100%)',
					boxShadow: `inset 0 0 0 4px ${OURO}, 0 40px 80px rgba(0,0,0,0.5)`,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					paddingTop: 70,
					gap: 26,
				}}
			>
				<div style={{fontFamily: poppins, fontWeight: 700, fontSize: 30, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.75)'}}>CARTEIRA DE TRABALHO</div>
				<div style={{fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontWeight: 800, fontSize: 170, color: OURO, lineHeight: 1}}>CLT</div>
				{[300, 380, 260, 340].map((w, i) => (
					<div key={i} style={{width: w, height: 14, borderRadius: 7, background: 'rgba(255,255,255,0.16)'}} />
				))}
				<div
					style={{
						position: 'absolute',
						top: 470,
						padding: '14px 34px',
						border: `8px solid ${OURO}`,
						borderRadius: 18,
						color: OURO,
						fontFamily: poppins,
						fontWeight: 900,
						fontSize: 84,
						letterSpacing: '0.06em',
						transform: `rotate(-14deg) scale(${2.4 - 1.4 * bate})`,
						opacity: frame >= carimbo ? Math.min(1, bate * 1.4) : 0,
						background: 'rgba(30,15,58,0.55)',
						boxShadow: '0 0 40px rgba(232,194,122,0.45)',
					}}
				>
					DEMISSÃO
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 4. fora da curva
// Curva normal em ouro com a turma (pontos) embaixo dela; no "fora" um ponto de luz salta para fora da curva, no alto à
// direita, e FORA DA CURVA bate em ouro 3D.
const d31Curva: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, width, height, fim, q, op} = useCena(cena);
	const d = cena.dados as {emFora: number; emCurva: number};
	const fora = q(d.emFora);
	const curva = q(d.emCurva);
	const desenha = interpolate(frame, [0, Math.max(6, fora)], [0, 1], {...lim, easing: Easing.out(Easing.cubic)});
	const salto = mola(frame, fps, fora, 120);
	const pts: string[] = [];
	for (let i = 0; i <= 60; i++) {
		const x = 120 + (840 * i) / 60;
		const u = (i / 60 - 0.5) * 5;
		pts.push(`${x},${1380 - 420 * Math.exp(-u * u / 2)}`);
	}
	const caminho = `M ${pts.join(' L ')}`;
	// ponto de luz: sai do topo da curva e pousa em cima à direita
	const px = interpolate(salto, [0, 1], [540, 880]);
	const py = interpolate(salto, [0, 1], [960, 760]) - Math.sin(salto * Math.PI) * 140;
	return (
		<AbsoluteFill style={{opacity: op}}>
			<FundoMotion />
			<svg width={width} height={height} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
				<defs>
					<radialGradient id="d31luz">
						<stop offset="0%" stopColor="#fff6dc" />
						<stop offset="45%" stopColor={OURO} />
						<stop offset="100%" stopColor="rgba(232,194,122,0)" />
					</radialGradient>
				</defs>
				<line x1={100} y1={1380} x2={980} y2={1380} stroke="rgba(255,255,255,0.3)" strokeWidth={4} />
				<path d={caminho} fill="none" stroke={OURO} strokeWidth={9} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - desenha} />
				{Array.from({length: 26}).map((_, i) => {
					const u = ((i * 37) % 26) / 25 - 0.5;
					const x = 540 + u * 600;
					const alto = 400 * Math.exp(-(u * 5) * (u * 5) / 2);
					const y = 1360 - ((i * 53) % 100) / 100 * alto * 0.85;
					return <circle key={i} cx={x} cy={y} r={11} fill="rgba(255,255,255,0.55)" opacity={interpolate(frame, [2 + i * 0.4, 6 + i * 0.4], [0, 1], lim)} />;
				})}
				<circle cx={px} cy={py} r={90} fill="url(#d31luz)" opacity={frame >= fora ? 1 : 0} />
				<circle cx={px} cy={py} r={22} fill="#fff" opacity={frame >= fora ? 1 : 0} />
			</svg>
			<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
				<CameraTremor quadro={frame} batidas={[curva]} z0={14.5} z1={13.9} duracao={fim} />
				<Luzes quadro={frame} batidas={[fora, curva]} />
				<Linha3D ate={Math.min(fim - 8, curva - 4)} texto="FORA" metal="branco" largura={2.6} y={yMundo(420)} quadro={frame} batida={fora} profundidade={0.45} />
				<Linha3D ate={fim - 8} texto="DA CURVA" metal="ouro" largura={4.2} y={yMundo(580)} quadro={frame} batida={curva} profundidade={0.5} />
			</ThreeCanvas>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- teste de hoje: GMV e itens vendidos legíveis
// O print do celular dela não dá para ler na fonte baixa: cartão de vidro no topo (acima do rosto) com o GMV contando até
// R$ 1.286 e o chip "12 itens vendidos". Sobre o vídeo (não é tela cheia).
// dados: {conta, trava, itens}
const d31Gmv: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, fim, q, op} = useCena(cena);
	const d = (cena.dados ?? {}) as Record<string, number>;
	const conta = q(d.conta);
	const trava = Math.max(conta + 10, q(d.trava));
	const itens = q(d.itens);
	const pCard = mola(frame, fps, 0, 190);
	const f = interpolate(frame, [conta, trava], [0, 1], {...lim, easing: Easing.out(Easing.cubic)});
	const valor = Math.round(1286 * f);
	const travou = frame >= trava;
	const pulso = travou ? 1 + 0.12 * Math.max(0, 1 - (frame - trava) / 8) : 1;
	const pItens = frame >= itens ? mola(frame, fps, itens, 240) : 0;
	return (
		<AbsoluteFill style={{opacity: op}}>
			<div style={{position: 'absolute', left: 140, right: 140, top: 200, padding: '22px 0 26px', borderRadius: 34, background: 'rgba(30,15,58,0.82)', border: `3px solid ${travou ? OURO : 'rgba(233,230,242,0.35)'}`, boxShadow: travou ? '0 0 40px rgba(232,194,122,0.45)' : '0 18px 40px rgba(8,3,20,0.55)', textAlign: 'center', transform: `translateY(${(1 - pCard) * -60}px) scale(${0.9 + 0.1 * pCard})`, opacity: Math.min(1, pCard * 1.4)}}>
				<div style={{fontFamily: poppins, fontWeight: 800, fontSize: 32, letterSpacing: '0.24em', marginRight: '-0.24em', color: '#e9e6f2'}}>GMV · TESTE DE HOJE</div>
				<div style={{fontFamily: poppins, fontWeight: 900, fontSize: 112, lineHeight: 1.1, color: OURO, transform: `scale(${pulso})`, textShadow: '0 0 30px rgba(232,194,122,0.45)', fontVariantNumeric: 'tabular-nums'}}>
					R$ {valor.toLocaleString('pt-BR')}
				</div>
				<div style={{display: 'inline-block', marginTop: 6, padding: '8px 26px', borderRadius: 40, background: OURO, color: '#2a1552', fontFamily: poppins, fontWeight: 900, fontSize: 38, opacity: pItens, transform: `scale(${0.6 + 0.4 * pItens})`}}>
					12 itens vendidos
				</div>
			</div>
		</AbsoluteFill>
	);
};

export const pecas: Pecas = {d31Zero, d31Metade, d31Demissao, d31Curva, d31Gmv};
