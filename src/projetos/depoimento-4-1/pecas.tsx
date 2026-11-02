// Peças (efeitos) exclusivas do depoimento-4-1, usadas no edit.ts com {tipo: 'peca', nome: '<chave>', dados: {...}}.
// Chaves com prefixo d41 (já registrado em src/pecas/registro.ts). Tempos em `dados` = segundos do vídeo editado.
// Paleta roxo + ouro (contraste com a camisa listrada preta e branca dela). Rosto entre y≈680 e y≈1110 (px de 1080x1920).
import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import type {CenaPeca, Pecas} from '../../pecas/peca';
import {FundoMotion} from '../../pecas/FundoMotion';
import {CameraTremor, Linha3D, Luzes} from '../../pecas/tres/Texto3D';
import {playfair, poppins} from '../../motor/tema';

const lim = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const OURO = '#E8C27A';
const ROXO = '#1E0F3A';
const GL = {alpha: true, antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05};
const CAMERA = {fov: 35, position: [0, 0, 14.5] as [number, number, number], near: 0.1, far: 60};
const yMundo = (px: number) => ((960 - px) / 960) * 14.5 * Math.tan((35 / 2) * (Math.PI / 180));
const VIDRO: React.CSSProperties = {
	background: 'linear-gradient(160deg, rgba(91,52,168,0.92), rgba(36,18,72,0.92))',
	boxShadow: 'inset 0 0 0 2px rgba(232,194,122,0.55), 0 24px 50px rgba(0,0,0,0.45)',
	borderRadius: 28,
};

const useCena = (cena: CenaPeca) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const fim = Math.round((cena.ate - cena.de) * fps);
	const q = (s: unknown) => Math.round(Math.max(0, Number(s) - cena.de) * fps);
	const op = interpolate(frame, [0, 6, fim - 7, fim], [0, 1, 1, 0], lim);
	return {frame, fps, width, height, fim, q, op};
};
const mola = (frame: number, fps: number, de: number, rigidez = 140) => spring({frame: frame - de, fps, config: {damping: 14, stiffness: rigidez}});
const tremor = (frame: number, de: number, forca = 10, dur = 8) => (frame >= de && frame < de + dur ? Math.sin(frame * 2.9) * forca * (1 - (frame - de) / dur) : 0);

const Rotulo: React.FC<{texto: string; y: number; p: number; cor?: string; tamanho?: number}> = ({texto, y, p, cor = '#fff', tamanho = 40}) => (
	<div style={{position: 'absolute', top: y, width: '100%', textAlign: 'center', opacity: p, transform: `translateY(${(1 - p) * 20}px)`, fontFamily: poppins, fontWeight: 800, fontSize: tamanho, letterSpacing: '0.16em', color: cor}}>
		{texto}
	</div>
);

// ---------------------------------------------------------------- 1. resultados × expectativa
// "os resultados não estavam acontecendo como eu esperava": a linha ESPERADO (ouro tracejado) sobe; a REAL (cinza) se arrasta
// rente ao chão; no "esperava" a distância entre as duas acende com uma chave e a ponta da REAL treme.
const d41Expectativa: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, width, height, q, op} = useCena(cena);
	const d = cena.dados as {emEsperado: number; emReal: number; emGap: number};
	const esp = q(d.emEsperado);
	const real = q(d.emReal);
	const gap = q(d.emGap);
	const x0 = 150;
	const x1 = 920;
	const yB = 1300;
	const pEsp = interpolate(frame, [esp, esp + 14], [0, 1], {...lim, easing: Easing.out(Easing.cubic)});
	const pReal = interpolate(frame, [real, Math.max(real + 10, gap)], [0, 1], {...lim, easing: Easing.out(Easing.quad)});
	const pGap = interpolate(frame, [gap, gap + 8], [0, 1], lim);
	const yEsp = (u: number) => yB - 560 * Math.pow(u, 1.3);
	const yReal = (u: number) => yB - 70 * u - Math.sin(u * 14) * 10 * u;
	const ptsEsp: string[] = [];
	const ptsReal: string[] = [];
	for (let i = 0; i <= 40; i++) {
		const u = i / 40;
		if (u <= pEsp) ptsEsp.push(`${x0 + (x1 - x0) * u},${yEsp(u)}`);
		if (u <= pReal) ptsReal.push(`${x0 + (x1 - x0) * u},${yReal(u)}`);
	}
	const tr = tremor(frame, gap, 8, 10);
	const yTopo = yEsp(1);
	const yFim = yReal(1);
	return (
		<AbsoluteFill style={{opacity: op}}>
			<FundoMotion />
			<Rotulo texto="RESULTADOS" y={520} p={interpolate(frame, [0, 7], [0, 1], lim)} cor="rgba(255,255,255,0.8)" tamanho={44} />
			<svg width={width} height={height} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
				<line x1={x0} y1={640} x2={x0} y2={yB} stroke="rgba(255,255,255,0.3)" strokeWidth={4} />
				<line x1={x0} y1={yB} x2={x1 + 30} y2={yB} stroke="rgba(255,255,255,0.3)" strokeWidth={4} />
				{ptsEsp.length > 1 && <polyline points={ptsEsp.join(' ')} fill="none" stroke={OURO} strokeWidth={10} strokeDasharray="26 18" strokeLinecap="round" />}
				{ptsReal.length > 1 && <polyline points={ptsReal.join(' ')} fill="none" stroke="#c9ccd8" strokeWidth={12} strokeLinecap="round" transform={`translate(${tr} 0)`} />}
				{pReal > 0.02 && <circle cx={x0 + (x1 - x0) * pReal + tr} cy={yReal(pReal)} r={17} fill="#fff" />}
				{pEsp > 0.98 && <circle cx={x1} cy={yTopo} r={17} fill={OURO} />}
				{/* chave da distância */}
				<g opacity={pGap}>
					<line x1={x1 + 50} y1={yTopo} x2={x1 + 50} y2={yTopo + (yFim - yTopo) * pGap} stroke={OURO} strokeWidth={6} />
					<line x1={x1 + 30} y1={yTopo} x2={x1 + 70} y2={yTopo} stroke={OURO} strokeWidth={6} />
					<line x1={x1 + 30} y1={yFim} x2={x1 + 70} y2={yFim} stroke={OURO} strokeWidth={6} opacity={pGap > 0.95 ? 1 : 0} />
				</g>
			</svg>
			{/* rótulos das linhas */}
			<div style={{position: 'absolute', left: 560, top: yEsp(0.62) - 110, fontFamily: poppins, fontWeight: 800, fontSize: 38, letterSpacing: '0.12em', color: OURO, opacity: interpolate(frame, [esp + 8, esp + 14], [0, 1], lim)}}>
				ESPERADO
			</div>
			<div style={{position: 'absolute', left: 560, top: yB + 30, fontFamily: poppins, fontWeight: 800, fontSize: 38, letterSpacing: '0.12em', color: '#d6d8e2', opacity: interpolate(frame, [real + 4, real + 10], [0, 1], lim)}}>
				REAL
			</div>
			{/* no "esperava": a distância vira o assunto */}
			<div
				style={{
					position: 'absolute',
					top: 1460,
					width: '100%',
					textAlign: 'center',
					fontFamily: playfair,
					fontStyle: 'italic',
					fontWeight: 800,
					fontSize: 96,
					color: OURO,
					opacity: pGap,
					transform: `scale(${1.3 - 0.3 * pGap})`,
					textShadow: '0 0 30px rgba(232,194,122,0.45)',
				}}
			>
				como eu esperava
			</div>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 2. a equipe me acolheu
// Sobre o vídeo: dois arcos de luz dourada sobem pelos lados dela e se fecham no alto como um abraço no "acolheu", com uma
// luz quente; no topo, EQUIPE MARAVILHOSA e depois "me acolheu" em serifa dourada (um texto por vez).
const d41Acolhe: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, width, height, q, op} = useCena(cena);
	const d = cena.dados as {emEquipe: number; emAcolheu: number};
	const equipe = q(d.emEquipe);
	const acolheu = q(d.emAcolheu);
	const desenha = interpolate(frame, [Math.max(0, equipe - 4), acolheu + 3], [0, 1], {...lim, easing: Easing.inOut(Easing.cubic)});
	const fecha = interpolate(frame, [acolheu, acolheu + 10], [0, 1], lim);
	const calor = interpolate(frame, [acolheu - 2, acolheu + 6], [0, 1], lim);
	const pEquipe = interpolate(frame, [equipe, equipe + 6], [0, 1], lim) * (1 - interpolate(frame, [acolheu - 3, acolheu], [0, 1], lim));
	const pAcolheu = interpolate(frame, [acolheu, acolheu + 6], [0, 1], lim);
	// elipse em volta dela: centro (540, 1150), raios 450 × 760; cada arco sai de baixo e sobe até o alto
	const cx = 540;
	const cy = 1150;
	const rx = 450;
	const ry = 760;
	const arco = (lado: 1 | -1) => {
		const pts: string[] = [];
		for (let i = 0; i <= 50; i++) {
			const a = Math.PI / 2 + (lado * Math.PI * i) / 50; // de baixo (π/2) até o alto
			pts.push(`${cx + rx * Math.cos(a)},${cy + ry * Math.sin(a)}`);
		}
		return `M ${pts.join(' L ')}`;
	};
	return (
		<AbsoluteFill style={{opacity: op}}>
			{/* topo escurece para o ouro ler */}
			<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(20,8,40,0.88) 0%, rgba(20,8,40,0.62) 18%, rgba(20,8,40,0) 32%)'}} />
			{/* luz quente do abraço */}
			<AbsoluteFill style={{background: `radial-gradient(ellipse 60% 45% at 50% 52%, rgba(255,214,140,${0.22 * calor}) 0%, rgba(255,190,90,${0.1 * calor}) 50%, rgba(0,0,0,0) 75%)`, mixBlendMode: 'screen'}} />
			<svg width={width} height={height} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
				<defs>
					<filter id="d41brilho" x="-20%" y="-20%" width="140%" height="140%">
						<feGaussianBlur stdDeviation="10" result="b" />
						<feMerge>
							<feMergeNode in="b" />
							<feMergeNode in="SourceGraphic" />
						</feMerge>
					</filter>
				</defs>
				{([1, -1] as const).map((lado) => (
					<path
						key={lado}
						d={arco(lado)}
						fill="none"
						stroke={OURO}
						strokeWidth={9 + 5 * fecha}
						strokeLinecap="round"
						pathLength={1}
						strokeDasharray={1}
						strokeDashoffset={1 - desenha}
						filter="url(#d41brilho)"
						opacity={0.95}
					/>
				))}
				{/* onde os braços se encontram */}
				<circle cx={cx} cy={cy - ry} r={14 + 30 * fecha} fill="#fff6dc" opacity={fecha * (1 - 0.6 * fecha) + 0.3 * fecha} filter="url(#d41brilho)" />
			</svg>
			<Rotulo texto="EQUIPE MARAVILHOSA" y={210} p={pEquipe} tamanho={46} />
			<div
				style={{
					position: 'absolute',
					top: 170,
					width: '100%',
					textAlign: 'center',
					fontFamily: playfair,
					fontStyle: 'italic',
					fontWeight: 800,
					fontSize: 130,
					color: OURO,
					opacity: pAcolheu,
					transform: `scale(${1.25 - 0.25 * pAcolheu})`,
					textShadow: '0 0 34px rgba(232,194,122,0.55), 0 6px 18px rgba(0,0,0,0.5)',
				}}
			>
				me acolheu
			</div>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 3. produto + vitrine não basta → + técnica correta
// A conta monta na hora da fala: PRODUTO, + VITRINE e "= ?" apagado com o carimbo NÃO BASTA; na "técnica correta" o "?" dá
// lugar a + TÉCNICA CORRETA em ouro, com tremor.
const d41Formula: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, op} = useCena(cena);
	const d = cena.dados as {emNaoBasta: number; emProduto: number; emVitrine: number; emTecnica: number};
	const produto = q(d.emProduto);
	const vitrine = q(d.emVitrine);
	const tecnica = q(d.emTecnica);
	const naoBasta = Math.max(q(d.emNaoBasta), 0);
	const pNao = interpolate(frame, [naoBasta, naoBasta + 6], [0, 1], lim) * (1 - interpolate(frame, [tecnica - 4, tecnica], [0, 1], lim));
	const pProd = mola(frame, fps, produto, 170);
	const pVit = mola(frame, fps, vitrine, 170);
	const pInt = frame >= vitrine + 8 ? mola(frame, fps, vitrine + 8, 200) * (1 - interpolate(frame, [tecnica - 3, tecnica], [0, 1], lim)) : 0;
	const pTec = mola(frame, fps, tecnica, 230);
	const tr = tremor(frame, tecnica, 12, 9);
	const Cartao: React.FC<{texto: string; y: number; p: number; ouro?: boolean}> = ({texto, y, p, ouro}) => (
		<div
			style={{
				position: 'absolute',
				left: 160,
				width: 760,
				top: y,
				height: 150,
				...VIDRO,
				...(ouro ? {background: 'linear-gradient(160deg, #f3d999, #c9973f)', boxShadow: '0 0 50px rgba(232,194,122,0.55), 0 24px 50px rgba(0,0,0,0.45)'} : {}),
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				fontFamily: poppins,
				fontWeight: 900,
				fontSize: ouro ? 62 : 64,
				letterSpacing: '0.06em',
				color: ouro ? ROXO : '#fff',
				opacity: Math.min(1, p * 1.4),
				transform: `translate(${ouro ? tr : 0}px, ${(1 - p) * 120}px) scale(${0.85 + 0.15 * p})`,
			}}
		>
			{texto}
		</div>
	);
	const Sinal: React.FC<{s: string; y: number; p: number}> = ({s, y, p}) => (
		<div style={{position: 'absolute', top: y, width: '100%', textAlign: 'center', fontFamily: poppins, fontWeight: 900, fontSize: 90, color: OURO, opacity: p, lineHeight: 1}}>{s}</div>
	);
	return (
		<AbsoluteFill style={{opacity: op}}>
			<FundoMotion />
			<Cartao texto="PRODUTO" y={540} p={pProd} />
			<Sinal s="+" y={712} p={pVit} />
			<Cartao texto="VITRINE" y={820} p={pVit} />
			{/* resultado parcial: "= ?" com o carimbo */}
			<div style={{position: 'absolute', top: 1040, width: '100%', textAlign: 'center', opacity: pInt, fontFamily: poppins, fontWeight: 900, fontSize: 120, color: 'rgba(255,255,255,0.45)'}}>= ?</div>
			<div
				style={{
					position: 'absolute',
					left: 290,
					top: 1260,
					width: 500,
					padding: '14px 0',
					textAlign: 'center',
					border: `7px solid ${OURO}`,
					borderRadius: 18,
					color: OURO,
					fontFamily: poppins,
					fontWeight: 900,
					fontSize: 70,
					letterSpacing: '0.06em',
					transform: `rotate(-8deg) scale(${1.6 - 0.6 * pNao})`,
					opacity: pNao,
					background: 'rgba(30,15,58,0.6)',
				}}
			>
				NÃO BASTA
			</div>
			<Sinal s="+" y={992} p={pTec} />
			<Cartao texto="TÉCNICA CORRETA" y={1100} p={pTec} ouro />
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 4. timidez a vida toda → superação
// Muro de tijolos de vidro cinza sobe tijolo a tijolo ("a vida toda") e ganha o carimbo TIMIDEZ; na "superação" uma luz
// dourada atravessa o meio, os tijolos voam para fora e SUPERAÇÃO bate em ouro 3D.
const d41Barreira: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, width, height, fim, q, op} = useCena(cena);
	const d = cena.dados as {emVida: number; emTimidez: number; emQuebra: number};
	const vida = q(d.emVida);
	const timidez = q(d.emTimidez);
	const quebra = q(d.emQuebra);
	const LINHAS = 6;
	const COLS = 4;
	const W = 210;
	const H = 92;
	const x0 = 540 - (COLS * W) / 2;
	const yBase = 1420;
	const pTim = mola(frame, fps, timidez, 220) * (frame >= quebra ? 0 : 1);
	const voo = interpolate(frame, [quebra, quebra + 16], [0, 1], {...lim, easing: Easing.out(Easing.cubic)});
	const luz = interpolate(frame, [quebra - 2, quebra + 3, quebra + 14], [0, 1, 0.55], lim);
	const tijolos: React.ReactNode[] = [];
	for (let r = 0; r < LINHAS; r++) {
		const desloc = r % 2 ? W / 2 : 0;
		for (let c = -1; c <= COLS; c++) {
			const x = x0 + c * W + desloc;
			if (x + W < x0 - 2 || x > x0 + COLS * W + 2) continue;
			const i = r * (COLS + 2) + c + 1;
			const chega = vida + i * 0.9;
			const p = mola(frame, fps, chega, 220);
			const xl = Math.max(x, x0);
			const xr = Math.min(x + W, x0 + COLS * W);
			const meio = (xl + xr) / 2 - 540;
			const y = yBase - (r + 1) * H;
			const dirX = meio / 300 + (i % 3) * 0.2 - 0.2;
			const dirY = (y - 1150) / 300 - 0.6;
			tijolos.push(
				<div
					key={`${r}-${c}`}
					style={{
						position: 'absolute',
						left: xl + 4,
						top: y + 4,
						width: xr - xl - 8,
						height: H - 8,
						borderRadius: 10,
						background: 'linear-gradient(160deg, rgba(120,116,138,0.95), rgba(58,52,70,0.95))',
						boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.18), 0 10px 20px rgba(0,0,0,0.35)',
						opacity: Math.min(1, p * 1.5) * (1 - voo),
						transform: `translate(${dirX * 700 * voo}px, ${(1 - p) * -260 + dirY * 600 * voo}px) rotate(${(i % 2 ? 1 : -1) * 70 * voo}deg)`,
					}}
				/>,
			);
		}
	}
	return (
		<AbsoluteFill style={{opacity: op}}>
			<FundoMotion />
			<Rotulo texto="A VIDA TODA" y={1480} p={interpolate(frame, [vida, vida + 6], [0, 1], lim) * (frame >= quebra ? 0 : 1)} cor="rgba(255,255,255,0.7)" />
			{tijolos}
			<div
				style={{
					position: 'absolute',
					top: 1040,
					width: '100%',
					textAlign: 'center',
					fontFamily: poppins,
					fontWeight: 900,
					fontSize: 130,
					letterSpacing: '0.08em',
					color: '#e9e6f2',
					opacity: pTim,
					transform: `rotate(-6deg) scale(${1.5 - 0.5 * pTim})`,
					textShadow: '0 8px 24px rgba(0,0,0,0.6)',
				}}
			>
				TIMIDEZ
			</div>
			{/* luz que atravessa */}
			<AbsoluteFill style={{background: `radial-gradient(ellipse 40% 30% at 50% 60%, rgba(255,240,200,${luz}) 0%, rgba(232,194,122,${0.6 * luz}) 40%, rgba(0,0,0,0) 75%)`}} />
			<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
				<CameraTremor quadro={frame} batidas={[quebra]} z0={14.5} z1={13.9} duracao={fim} />
				<Luzes quadro={frame} batidas={[quebra]} />
				{frame >= quebra - 1 && <Linha3D ate={fim - 8} texto="SUPERAÇÃO" metal="ouro" largura={4.4} y={yMundo(560)} quadro={frame} batida={quebra} profundidade={0.5} intervalo={1} />}
			</ThreeCanvas>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 5. pegam na nossa mão, passo a passo
// Escada de vidro roxo; ela (ponto branco) e o mentor (ponto dourado) ficam de mãos dadas (linha de luz) no "pegam na nossa
// mão" e sobem um degrau em cada "passo". No alto: PEGAM NA NOSSA MÃO e depois PASSO A PASSO.
const d41Passos: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, width, height, q, op} = useCena(cena);
	const d = cena.dados as {emMao: number; emPassoTexto: number; passos: number[]};
	const mao = q(d.emMao);
	const passoTexto = q(d.emPassoTexto);
	const passos = d.passos.map(q);
	const DEG = 4;
	const LARG = 200;
	const ALT = 150;
	const xD = (i: number) => 140 + i * LARG;
	const yD = (i: number) => 1560 - (i + 1) * ALT;
	// degrau atual (contínuo): cada passo sobe um
	let nivel = 0;
	passos.forEach((t) => {
		nivel += interpolate(frame, [t, t + 9], [0, 1], {...lim, easing: Easing.inOut(Easing.cubic)});
	});
	const pos = (n: number, dx: number) => {
		const i = Math.floor(Math.min(n, DEG - 1));
		const f = Math.min(n, DEG - 1) - i;
		const xa = xD(i) + LARG / 2 + dx;
		const ya = yD(i);
		const xb = xD(Math.min(i + 1, DEG - 1)) + LARG / 2 + dx;
		const yb = yD(Math.min(i + 1, DEG - 1));
		return {x: xa + (xb - xa) * f, y: ya + (yb - ya) * f - Math.sin(f * Math.PI) * 60};
	};
	const ela = pos(nivel, -38);
	const mentor = pos(Math.min(nivel + 0.0, DEG - 1), 38);
	const liga = interpolate(frame, [mao, mao + 8], [0, 1], lim);
	const pMao = interpolate(frame, [mao, mao + 6], [0, 1], lim) * (1 - interpolate(frame, [passoTexto - 3, passoTexto], [0, 1], lim));
	const pPasso = mola(frame, fps, passoTexto, 200);
	return (
		<AbsoluteFill style={{opacity: op}}>
			<FundoMotion />
			{Array.from({length: DEG}).map((_, i) => {
				const p = mola(frame, fps, i * 2, 170);
				const aceso = nivel >= i - 0.05 && frame >= mao;
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: xD(i) + 6,
							top: yD(i),
							width: LARG - 12,
							height: 1700 - yD(i),
							borderRadius: '18px 18px 0 0',
							background: aceso ? 'linear-gradient(180deg, rgba(232,194,122,0.55), rgba(60,34,110,0.85) 30%)' : 'linear-gradient(180deg, rgba(110,80,180,0.75), rgba(36,18,72,0.9) 40%)',
							boxShadow: `inset 0 3px 0 ${aceso ? OURO : 'rgba(255,255,255,0.35)'}, 0 20px 40px rgba(0,0,0,0.35)`,
							opacity: p,
							transform: `translateY(${(1 - p) * 200}px)`,
						}}
					>
						<div style={{marginTop: 34, textAlign: 'center', fontFamily: poppins, fontWeight: 800, fontSize: 30, letterSpacing: '0.1em', color: aceso ? OURO : 'rgba(255,255,255,0.5)'}}>
							PASSO {i + 1}
						</div>
					</div>
				);
			})}
			<svg width={width} height={height} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
				<defs>
					<radialGradient id="d41luzP">
						<stop offset="0%" stopColor="#fff6dc" />
						<stop offset="50%" stopColor={OURO} />
						<stop offset="100%" stopColor="rgba(232,194,122,0)" />
					</radialGradient>
				</defs>
				{/* mãos dadas */}
				<line x1={ela.x} y1={ela.y - 60} x2={ela.x + (mentor.x - ela.x) * liga} y2={ela.y - 60 + (mentor.y - ela.y) * liga} stroke={OURO} strokeWidth={10} strokeLinecap="round" />
				<circle cx={(ela.x + mentor.x) / 2} cy={ela.y - 60} r={60} fill="url(#d41luzP)" opacity={liga * 0.8} />
				{/* ela (branco) e o mentor (ouro): cabeça + corpo */}
				<circle cx={ela.x} cy={ela.y - 105} r={26} fill="#fff" />
				<rect x={ela.x - 22} y={ela.y - 76} width={44} height={70} rx={20} fill="#fff" />
				<circle cx={mentor.x} cy={mentor.y - 115} r={28} fill={OURO} />
				<rect x={mentor.x - 24} y={mentor.y - 84} width={48} height={78} rx={22} fill={OURO} />
			</svg>
			<Rotulo texto="PEGAM NA NOSSA MÃO" y={420} p={pMao} tamanho={52} />
			<div
				style={{
					position: 'absolute',
					top: 380,
					width: '100%',
					textAlign: 'center',
					fontFamily: playfair,
					fontStyle: 'italic',
					fontWeight: 800,
					fontSize: 130,
					color: OURO,
					opacity: frame >= passoTexto ? Math.min(1, pPasso * 1.4) : 0,
					transform: `scale(${1.3 - 0.3 * pPasso})`,
					textShadow: '0 0 30px rgba(232,194,122,0.45)',
				}}
			>
				passo a passo
			</div>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 6. não estamos sozinhas
// Ela é o ponto branco no centro; no "nós" a turma acende em volta (pontos dourados em dois anéis) e se liga a ela e entre
// si; NÃO ESTAMOS (prata 3D) e SOZINHAS (ouro 3D) batem em cima.
const d41Juntas: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, width, height, fim, q, op} = useCena(cena);
	const d = cena.dados as {emNos: number; emNao: number; emSozinhas: number};
	const nos = q(d.emNos);
	const nao = q(d.emNao);
	const soz = q(d.emSozinhas);
	const cx = 540;
	const cy = 1240;
	const pontos = Array.from({length: 16}).map((_, i) => {
		const anel = i < 6 ? 0 : 1;
		const n = anel ? 10 : 6;
		const k = anel ? i - 6 : i;
		const a = (k / n) * Math.PI * 2 + (anel ? 0.3 : 0) + frame * 0.004 * (anel ? -1 : 1);
		const r = anel ? 330 : 180;
		return {x: cx + Math.cos(a) * r * 1.05, y: cy + Math.sin(a) * r * 0.82, t: nos + i * 1.1, anel};
	});
	const pulso = 1 + 0.12 * Math.max(0, 1 - Math.max(0, frame - soz) / 10) * (frame >= soz ? 1 : 0);
	return (
		<AbsoluteFill style={{opacity: op}}>
			<FundoMotion />
			<svg width={width} height={height} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
				<defs>
					<radialGradient id="d41halo">
						<stop offset="0%" stopColor="rgba(255,246,220,0.9)" />
						<stop offset="100%" stopColor="rgba(232,194,122,0)" />
					</radialGradient>
				</defs>
				{pontos.map((p, i) => {
					const v = interpolate(frame, [p.t, p.t + 6], [0, 1], lim);
					const viz = pontos[(i + 1) % pontos.length];
					const mesmoAnel = viz.anel === p.anel;
					return (
						<g key={i}>
							<line x1={cx} y1={cy} x2={cx + (p.x - cx) * v} y2={cy + (p.y - cy) * v} stroke="rgba(232,194,122,0.45)" strokeWidth={3} />
							{mesmoAnel && <line x1={p.x} y1={p.y} x2={viz.x} y2={viz.y} stroke="rgba(232,194,122,0.3)" strokeWidth={2} opacity={interpolate(frame, [viz.t + 4, viz.t + 10], [0, 1], lim)} />}
							<circle cx={p.x} cy={p.y} r={34 * v} fill="url(#d41halo)" opacity={0.6} />
							<circle cx={p.x} cy={p.y} r={(p.anel ? 13 : 16) * v} fill={OURO} />
						</g>
					);
				})}
				<circle cx={cx} cy={cy} r={90 * pulso} fill="url(#d41halo)" />
				<circle cx={cx} cy={cy} r={26 * pulso} fill="#fff" />
			</svg>
			<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
				<CameraTremor quadro={frame} batidas={[soz]} z0={14.5} z1={13.9} duracao={fim} />
				<Luzes quadro={frame} batidas={[nao, soz]} />
				<Linha3D ate={Math.min(fim - 8, soz - 2)} texto="NÃO ESTAMOS" metal="branco" largura={4.2} y={yMundo(420)} quadro={frame} batida={nao} profundidade={0.4} intervalo={1} />
				{frame >= soz - 1 && <Linha3D ate={fim - 8} texto="SOZINHAS" metal="ouro" largura={4.2} y={yMundo(620)} quadro={frame} batida={soz} profundidade={0.5} />}
			</ThreeCanvas>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 7. enxergar possibilidades
// Sobre o vídeo: a tela começa embaçada e escura ("antes eu não enxergava"); no "enxergar" uma lente abre do centro e limpa
// a imagem; no "possibilidades" caminhos dourados saem do alto da cabeça dela para os lados e para cima, com nós de luz.
// Sem texto próprio: a legenda (com "possibilidades" em destaque) continua.
const d41Enxergar: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, width, height, q, op} = useCena(cena);
	const d = cena.dados as {emEnxergar: number; emPossib: number};
	const enx = q(d.emEnxergar);
	const pos = q(d.emPossib);
	const abre = interpolate(frame, [enx, enx + 20], [0, 1], {...lim, easing: Easing.inOut(Easing.quad)});
	const raio = 30 + 1300 * abre;
	const mascara = `radial-gradient(circle at 50% 46%, transparent ${raio}px, black ${raio + 140}px)`;
	const origem = {x: 540, y: 660};
	const destinos = [
		{x: 90, y: 560},
		{x: 220, y: 420},
		{x: 860, y: 420},
		{x: 990, y: 560},
		{x: 70, y: 820},
		{x: 1010, y: 820},
		{x: 330, y: 480},
		{x: 750, y: 480},
	];
	return (
		<AbsoluteFill style={{opacity: op}}>
			{/* névoa: desfoque + escuro, aberta pela lente */}
			<AbsoluteFill
				style={{
					backdropFilter: 'blur(22px) saturate(0.4) brightness(0.7)',
					WebkitBackdropFilter: 'blur(22px) saturate(0.4) brightness(0.7)',
					background: 'rgba(30,15,58,0.35)',
					maskImage: mascara,
					WebkitMaskImage: mascara,
					opacity: abre >= 0.999 ? 0 : 1,
				}}
			/>
			{/* aro da lente */}
			<svg width={width} height={height} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
				<circle cx={540} cy={883} r={raio + 40} fill="none" stroke={OURO} strokeWidth={6} opacity={abre > 0 && abre < 0.95 ? 0.8 * (1 - abre) : 0} />
				{destinos.map((dst, i) => {
					const t0 = pos + i * 1.2;
					const v = interpolate(frame, [t0, t0 + 9], [0, 1], {...lim, easing: Easing.out(Easing.cubic)});
					const mx = (origem.x + dst.x) / 2 + (dst.x > 540 ? 1 : -1) * 40;
					const my = Math.min(origem.y, dst.y) - 60;
					return (
						<g key={i} opacity={v > 0 ? 1 : 0}>
							<path d={`M ${origem.x} ${origem.y} Q ${mx} ${my} ${dst.x} ${dst.y}`} fill="none" stroke={OURO} strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - v} opacity={0.9} />
							<circle cx={dst.x} cy={dst.y} r={16 * v} fill="#fff6dc" />
							<circle cx={dst.x} cy={dst.y} r={34 * v} fill="none" stroke={OURO} strokeWidth={3} opacity={0.7} />
						</g>
					);
				})}
			</svg>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 8. caminhada imensa pela frente
// Estrada em perspectiva até o horizonte, faixas correndo para a câmera, marco VOCÊ ESTÁ AQUI embaixo; CAMINHADA (prata 3D)
// e IMENSA (ouro 3D) no céu; no "imensa" a estrada se alonga (o horizonte sobe) e a velocidade aumenta.
const d41Estrada: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, width, height, fim, q, op} = useCena(cena);
	const d = cena.dados as {emCaminhada: number; emImensa: number; emFrente: number};
	const cam = q(d.emCaminhada);
	const ime = q(d.emImensa);
	const alonga = interpolate(frame, [ime, ime + 14], [0, 1], {...lim, easing: Easing.inOut(Easing.cubic)});
	const hz = 900 - 80 * alonga; // horizonte
	const fase = frame * (0.035 + 0.05 * alonga);
	const N = 12;
	const faixas = Array.from({length: N}).map((_, i) => {
		const u = ((i + fase) % N) / N; // 0 = horizonte, 1 = perto
		const y = hz + (1920 - hz) * Math.pow(u, 2.2);
		const y2 = hz + (1920 - hz) * Math.pow(Math.min(1, u + 0.035), 2.2);
		const w = 4 + 34 * Math.pow(u, 2.2);
		return {y, y2, w};
	});
	const pAqui = interpolate(frame, [4, 12], [0, 1], lim);
	return (
		<AbsoluteFill style={{opacity: op}}>
			<FundoMotion fundo="linear-gradient(180deg, #0b051c 0%, #2a1458 45%, #5b3192 62%, #1E0F3A 100%)" />
			<svg width={width} height={height} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
				<defs>
					<linearGradient id="d41estrada" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="#2a1552" />
						<stop offset="100%" stopColor="#120828" />
					</linearGradient>
					<radialGradient id="d41sol" cx="50%" cy="50%" r="50%">
						<stop offset="0%" stopColor="rgba(255,236,190,0.95)" />
						<stop offset="100%" stopColor="rgba(232,194,122,0)" />
					</radialGradient>
				</defs>
				{/* brilho no horizonte */}
				<ellipse cx={540} cy={hz} rx={420} ry={110} fill="url(#d41sol)" opacity={0.7} />
				{/* estrada */}
				<polygon points={`${530},${hz} ${550},${hz} ${1080 + 260},1920 ${-260},1920`} fill="url(#d41estrada)" />
				<line x1={530} y1={hz} x2={-260} y2={1920} stroke={OURO} strokeWidth={7} />
				<line x1={550} y1={hz} x2={1340} y2={1920} stroke={OURO} strokeWidth={7} />
				{faixas.map((f, i) => (
					<polygon key={i} points={`${540 - f.w / 2},${f.y} ${540 + f.w / 2},${f.y} ${540 + f.w / 2 + 3},${f.y2} ${540 - f.w / 2 - 3},${f.y2}`} fill="#fff6dc" opacity={0.85} />
				))}
			</svg>
			{/* você está aqui */}
			<div style={{position: 'absolute', left: 0, width: '100%', top: 1580, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: pAqui, transform: `translateY(${(1 - pAqui) * 40}px)`}}>
				<div style={{width: 46, height: 46, borderRadius: 23, background: '#fff', boxShadow: '0 0 30px rgba(255,255,255,0.8)'}} />
				<div style={{marginTop: 18, padding: '10px 28px', borderRadius: 999, background: 'rgba(30,15,58,0.85)', boxShadow: `inset 0 0 0 2px ${OURO}`, fontFamily: poppins, fontWeight: 800, fontSize: 32, letterSpacing: '0.14em', color: '#fff'}}>
					VOCÊ ESTÁ AQUI
				</div>
			</div>
			<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
				<CameraTremor quadro={frame} batidas={[ime]} z0={14.5} z1={14.0} duracao={fim} />
				<Luzes quadro={frame} batidas={[cam, ime]} />
				<Linha3D ate={fim - 8} texto="CAMINHADA" metal="branco" largura={4.3} y={yMundo(360)} quadro={frame} batida={cam} profundidade={0.45} intervalo={1} />
				{frame >= ime - 1 && <Linha3D ate={fim - 8} texto="IMENSA" metal="ouro" largura={3.6} y={yMundo(560)} quadro={frame} batida={ime} profundidade={0.5} />}
			</ThreeCanvas>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 9. mais confiante, mais motivada
// Sobre o vídeo, no topo (acima do rosto): cartão de vidro com dois medidores; CONFIANÇA enche até o fim no "confiante" e
// MOTIVAÇÃO no "motivada", cada um com um brilho que corre; no "continuar" uma seta dourada avança.
const d41Medidor: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, op} = useCena(cena);
	const d = cena.dados as {emConfiante: number; emMotivada: number; emContinuar: number};
	const conf = q(d.emConfiante);
	const mot = q(d.emMotivada);
	const cont = q(d.emContinuar);
	const pCard = mola(frame, fps, 0, 190);
	const Barra: React.FC<{rotulo: string; t: number; top: number}> = ({rotulo, t, top}) => {
		const enche = interpolate(frame, [t, t + 14], [0.3, 1], {...lim, easing: Easing.out(Easing.cubic)});
		const ativo = frame >= t;
		const brilho = interpolate(frame, [t + 6, t + 22], [-0.2, 1.2], lim);
		return (
			<div style={{position: 'absolute', left: 50, right: 50, top}}>
				<div style={{display: 'flex', justifyContent: 'space-between', fontFamily: poppins, fontWeight: 800, fontSize: 34, letterSpacing: '0.14em', color: ativo ? OURO : 'rgba(255,255,255,0.55)', marginBottom: 12}}>
					<span>{rotulo}</span>
					<span style={{fontVariantNumeric: 'tabular-nums'}}>{Math.round((ativo ? enche : 0.3) * 100)}%</span>
				</div>
				<div style={{position: 'relative', height: 44, borderRadius: 22, background: 'rgba(255,255,255,0.1)', boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.22)', overflow: 'hidden'}}>
					<div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(ativo ? enche : 0.3) * 100}%`, borderRadius: 22, background: ativo ? 'linear-gradient(90deg, #b8862f, #f3d999)' : 'linear-gradient(90deg, #6d6880, #9a96aa)'}} />
					<div style={{position: 'absolute', top: 0, bottom: 0, left: `${brilho * 100}%`, width: 90, background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.7), rgba(255,255,255,0))', opacity: ativo ? 1 : 0}} />
				</div>
			</div>
		);
	};
	const seta = mola(frame, fps, cont, 180);
	return (
		<AbsoluteFill style={{opacity: op}}>
			<div
				style={{
					position: 'absolute',
					left: 120,
					right: 120,
					top: 170,
					height: 380,
					borderRadius: 34,
					background: 'rgba(30,15,58,0.86)',
					border: '3px solid rgba(232,194,122,0.6)',
					boxShadow: '0 18px 40px rgba(8,3,20,0.55)',
					transform: `translateY(${(1 - pCard) * -60}px) scale(${0.92 + 0.08 * pCard})`,
					opacity: Math.min(1, pCard * 1.4),
				}}
			>
				<Barra rotulo="CONFIANÇA" t={conf} top={50} />
				<Barra rotulo="MOTIVAÇÃO" t={mot} top={180} />
				<div style={{position: 'absolute', left: 0, right: 0, bottom: 26, textAlign: 'center', fontFamily: poppins, fontWeight: 900, fontSize: 34, letterSpacing: '0.18em', color: OURO, opacity: frame >= cont ? seta : 0, transform: `translateX(${(1 - seta) * -80}px)`}}>
					PRA CONTINUAR →
				</div>
			</div>
		</AbsoluteFill>
	);
};

export const pecas: Pecas = {d41Expectativa, d41Acolhe, d41Formula, d41Barreira, d41Passos, d41Juntas, d41Enxergar, d41Estrada, d41Medidor};
