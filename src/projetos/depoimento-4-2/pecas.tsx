// Peças (efeitos) exclusivas do depoimento-4-2, usadas no edit.ts com {tipo: 'peca', nome: '<chave>', dados: {...}}.
// Chaves com prefixo d42 (já registrado em src/pecas/registro.ts). Tempos em `dados` = segundos do vídeo editado.
// Paleta do tema: roxo profundo + ouro + vidro. Peças "sobre" o vídeo ficam no topo (a pessoa está do meio para baixo,
// de camiseta branca: nada de texto branco solto sobre a roupa).
import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import type {CenaPeca, Pecas} from '../../pecas/peca';
import {FundoMotion} from '../../pecas/FundoMotion';
import {CameraTremor, Linha3D, Luzes} from '../../pecas/tres/Texto3D';
import {poppins} from '../../motor/tema';

const lim = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const OURO = '#E8C27A';
const OURO_TEXTO = 'linear-gradient(180deg,#FFF1C9 0%,#F2D08A 40%,#E8C27A 65%,#C9974A 100%)';
const ROXO = '#1E0F3A';
const VERDE = '#5BE39B';
const VERMELHO = '#FF5A6E';
const VIDRO: React.CSSProperties = {
	background: 'linear-gradient(180deg, rgba(46,24,86,0.86) 0%, rgba(30,15,58,0.84) 100%)',
	boxShadow: 'inset 0 0 0 2px rgba(232,194,122,0.45), 0 22px 50px rgba(8,3,20,0.5)',
	backdropFilter: 'blur(18px)',
};
const GL = {alpha: true, antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05};
const CAMERA = {fov: 35, position: [0, 0, 14.5] as [number, number, number], near: 0.1, far: 60};
// px da tela (1080x1920) → y do mundo 3D no plano do texto.
const yMundo = (px: number) => ((960 - px) / 960) * 14.5 * Math.tan((35 / 2) * (Math.PI / 180));

const useCena = (cena: CenaPeca) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const fim = Math.round((cena.ate - cena.de) * fps);
	const q = (s: unknown) => Math.round(Math.max(0, Number(s) - cena.de) * fps);
	const op = interpolate(frame, [0, 5, fim - 6, fim], [0, 1, 1, 0], lim);
	return {frame, fps, width, height, fim, q, op};
};
const mola = (frame: number, fps: number, de: number, rigidez = 160) => (frame < de ? 0 : spring({frame: frame - de, fps, config: {damping: 14, stiffness: rigidez}}));
// Pulso curto (1 → 1+f → 1) na batida.
const pulso = (frame: number, de: number, f = 0.14) => (frame >= de ? 1 + f * Math.max(0, 1 - (frame - de) / 8) : 1);

// Véu roxo no topo do vídeo: o que entra em cima lê sobre a parede clara.
const VeuTopo: React.FC<{ate: number}> = ({ate}) => (
	<AbsoluteFill style={{background: `linear-gradient(180deg, rgba(30,15,58,0.86) 0%, rgba(30,15,58,0.62) ${(ate / 1920) * 100 * 0.75}%, rgba(30,15,58,0) ${(ate / 1920) * 100}%)`}} />
);

const Rotulo: React.FC<{texto: string; y: number; p: number; cor?: string; tamanho?: number}> = ({texto, y, p, cor, tamanho = 38}) => (
	<div style={{position: 'absolute', top: y, width: '100%', textAlign: 'center', opacity: p, transform: `translateY(${(1 - p) * 18}px)`}}>
		<span style={{fontFamily: poppins, fontWeight: 800, fontSize: tamanho, letterSpacing: '0.3em', marginRight: '-0.3em', ...(cor ? {color: cor} : {background: OURO_TEXTO, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'})}}>
			{texto}
		</span>
	</div>
);

const Pilula: React.FC<{texto: string; y: number; p: number; ouro?: boolean; tamanho?: number}> = ({texto, y, p, ouro, tamanho = 40}) => (
	<div style={{position: 'absolute', top: y, width: '100%', display: 'flex', justifyContent: 'center', opacity: Math.min(1, p * 1.4)}}>
		<div
			style={{
				...(ouro ? {background: OURO_TEXTO, color: ROXO, boxShadow: '0 14px 36px rgba(8,3,20,0.45)'} : {...VIDRO, color: '#fff'}),
				padding: '14px 34px',
				borderRadius: 999,
				fontFamily: poppins,
				fontWeight: 800,
				fontSize: tamanho,
				letterSpacing: '0.08em',
				transform: `scale(${0.7 + 0.3 * p})`,
				whiteSpace: 'nowrap',
			}}
		>
			{texto}
		</div>
	</div>
);

// ---------------------------------------------------------------- 1. gancho: o mês até quase meio milhão
// Gráfico do mês: a linha de GMV sobe do DIA 1 ao DIA 30 (chip do dia corre na ponta) e para logo abaixo da meta tracejada
// de R$ 500 MIL ("quase"). Texto 3D: 30 DIAS (prata) no "30" e MEIO MILHÃO (ouro) no "meio milhão"; DE GMV no "GMV".
// dados: {em30, emQuase, emMeio, emGmv}
const d42Mes: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, width, height, fim, q, op} = useCena(cena);
	const d = cena.dados as {em30: number; emQuase: number; emMeio: number; emGmv: number};
	const t30 = q(d.em30);
	const quase = q(d.emQuase);
	const meio = q(d.emMeio);
	const gmv = q(d.emGmv);
	const prog = interpolate(frame, [1, Math.max(6, meio)], [0, 1], {...lim, easing: Easing.inOut(Easing.quad)});
	const x0 = 130;
	const x1 = 950;
	const yB = 1500;
	const yMeta = 980;
	const alto = yB - yMeta;
	const ponto = (f: number) => [x0 + (x1 - x0) * f, yB - alto * 0.93 * Math.pow(f, 1.9)] as const;
	const pts: string[] = [];
	for (let i = 0; i <= 60; i++) {
		const f = (i / 60) * prog;
		const [x, y] = ponto(f);
		pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
	}
	const [px, py] = ponto(prog);
	const dia = Math.max(1, Math.round(prog * 30));
	const acende = interpolate(frame, [meio, meio + 6], [0, 1], lim);
	return (
		<AbsoluteFill style={{opacity: op}}>
			<FundoMotion />
			<svg width={width} height={height} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
				<defs>
					<linearGradient id="d42area" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" stopColor="rgba(232,194,122,0.45)" />
						<stop offset="1" stopColor="rgba(232,194,122,0)" />
					</linearGradient>
				</defs>
				<line x1={x0} y1={yB} x2={x1} y2={yB} stroke="rgba(255,255,255,0.35)" strokeWidth={4} />
				<line x1={x0} y1={yMeta} x2={x1} y2={yMeta} stroke={OURO} strokeOpacity={0.55 + 0.45 * acende} strokeWidth={4} strokeDasharray="18 14" />
				<text x={x0} y={yMeta - 22} textAnchor="start" fontFamily={poppins} fontWeight={800} fontSize={34} letterSpacing={3} fill={OURO}>
					R$ 500 MIL
				</text>
				<polygon points={`${x0},${yB} ${pts.join(' ')} ${px.toFixed(1)},${yB}`} fill="url(#d42area)" />
				<polyline points={pts.join(' ')} fill="none" stroke={OURO} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" style={{filter: `drop-shadow(0 0 ${8 + 14 * acende}px rgba(232,194,122,0.7))`}} />
				<circle cx={px} cy={py} r={16 + 6 * acende} fill="#fff6dc" />
				<text x={x0} y={yB + 60} fontFamily={poppins} fontWeight={700} fontSize={32} fill="rgba(255,255,255,0.7)">
					DIA 1
				</text>
				<text x={x1} y={yB + 60} textAnchor="end" fontFamily={poppins} fontWeight={700} fontSize={32} fill="rgba(255,255,255,0.7)">
					DIA 30
				</text>
			</svg>
			{/* chip do dia correndo na ponta da linha */}
			<div style={{position: 'absolute', left: Math.min(x1 - 90, Math.max(x0 - 20, px - 85)), top: py - 112, width: 170, textAlign: 'center', ...VIDRO, borderRadius: 999, padding: '10px 0', fontFamily: poppins, fontWeight: 800, fontSize: 34, color: '#fff', fontVariantNumeric: 'tabular-nums'}}>
				DIA {dia}
			</div>
			<Rotulo texto="QUASE" y={300} p={mola(frame, fps, quase, 200)} />
			<Pilula texto="DE GMV" y={640} p={mola(frame, fps, gmv, 220)} ouro />
			<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
				<CameraTremor quadro={frame} batidas={[meio]} z0={14.5} z1={14} duracao={fim} />
				<Luzes quadro={frame} batidas={[t30, meio]} />
				{frame < meio ? <Linha3D ate={meio - 2} texto="30 DIAS" metal="branco" largura={3.4} y={yMundo(470)} quadro={frame} batida={t30} profundidade={0.5} /> : null}
				<Linha3D ate={fim - 6} texto="MEIO MILHÃO" metal="ouro" largura={4.4} y={yMundo(470)} quadro={frame} batida={meio} profundidade={0.55} />
			</ThreeCanvas>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 2. 5 mil em uma hora
// Relógio de 1 hora no topo: o anel dourado gira de 0 a 60 min enquanto o GMV conta até R$ 5.000; no "hora" o anel fecha,
// bate e a pílula EM 1 HORA entra. dados: {emConta, emHora}
const d42Hora: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, op} = useCena(cena);
	const d = cena.dados as {emConta: number; emHora: number};
	const conta = q(d.emConta);
	const hora = Math.max(conta + 8, q(d.emHora));
	const pCard = mola(frame, fps, 0, 190);
	const f = interpolate(frame, [conta, hora], [0, 1], {...lim, easing: Easing.out(Easing.cubic)});
	const giro = interpolate(frame, [0, hora], [0, 1], {...lim, easing: Easing.inOut(Easing.quad)});
	const valor = Math.round(5000 * f);
	const R = 150;
	const C = 2 * Math.PI * R;
	const fechou = frame >= hora;
	return (
		<AbsoluteFill style={{opacity: op}}>
			<VeuTopo ate={820} />
			<div style={{position: 'absolute', left: 540 - 210, top: 150, width: 420, height: 420, transform: `scale(${(0.8 + 0.2 * pCard) * pulso(frame, hora, 0.08)})`, opacity: Math.min(1, pCard * 1.5)}}>
				<svg width={420} height={420} viewBox="0 0 420 420" style={{position: 'absolute', inset: 0}}>
					<circle cx={210} cy={210} r={R + 26} fill="rgba(30,15,58,0.88)" stroke="rgba(232,194,122,0.35)" strokeWidth={3} />
					{Array.from({length: 12}).map((_, i) => {
						const a = (i / 12) * Math.PI * 2;
						return <line key={i} x1={210 + Math.sin(a) * (R - 18)} y1={210 - Math.cos(a) * (R - 18)} x2={210 + Math.sin(a) * (R - 4)} y2={210 - Math.cos(a) * (R - 4)} stroke="rgba(255,255,255,0.45)" strokeWidth={i % 3 ? 3 : 6} />;
					})}
					<circle cx={210} cy={210} r={R + 10} fill="none" stroke={OURO} strokeWidth={14} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - giro)} transform="rotate(-90 210 210)" style={{filter: `drop-shadow(0 0 ${fechou ? 16 : 6}px rgba(232,194,122,0.8))`}} />
					<line x1={210} y1={210} x2={210 + Math.sin(giro * Math.PI * 2) * (R - 30)} y2={210 - Math.cos(giro * Math.PI * 2) * (R - 30)} stroke="#fff" strokeWidth={6} strokeLinecap="round" />
					<circle cx={210} cy={210} r={9} fill={OURO} />
				</svg>
				<div style={{position: 'absolute', top: 236, width: '100%', textAlign: 'center', fontFamily: poppins, fontWeight: 900, fontSize: 62, color: OURO, textShadow: '0 0 22px rgba(232,194,122,0.5)', fontVariantNumeric: 'tabular-nums'}}>
					R$ {valor.toLocaleString('pt-BR')}
				</div>
				<div style={{position: 'absolute', top: 124, width: '100%', textAlign: 'center', fontFamily: poppins, fontWeight: 800, fontSize: 28, letterSpacing: '0.2em', marginLeft: '0.1em', color: 'rgba(255,255,255,0.8)'}}>
					{Math.round(giro * 60)} MIN
				</div>
			</div>
			<Rotulo texto="GMV · 1ª LIVE" y={92} p={pCard} tamanho={32} />
			<Pilula texto="EM 1 HORA" y={600} p={mola(frame, fps, hora, 220)} ouro />
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 3. mais de 900 pessoas na live
// Pílula AO VIVO com o olho e o contador de espectadores subindo de 37 a 900 (e passando: "mais de"); rostinhos entram
// na sala; no "900" o +900 bate em ouro 3D; no "nunca tinha" o chip vira PRIMEIRA VEZ e o 900 pulsa de novo.
// dados: {emSobe, em900, emNunca, em900b}
const d42Espectadores: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, width, height, fim, q, op} = useCena(cena);
	const d = cena.dados as {emSobe: number; em900: number; emNunca: number; em900b: number};
	const sobe = q(d.emSobe);
	const n900 = Math.max(sobe + 6, q(d.em900));
	const nunca = q(d.emNunca);
	const n900b = q(d.em900b);
	const subida = interpolate(frame, [sobe, n900], [0, 1], {...lim, easing: Easing.in(Easing.quad)});
	const depois = Math.max(0, frame - n900);
	const conta = frame < n900 ? Math.round(37 + 863 * subida) : 900 + Math.floor(depois * 0.9);
	const pPil = mola(frame, fps, 0, 200);
	const p2 = mola(frame, fps, nunca, 220);
	return (
		<AbsoluteFill style={{opacity: op}}>
			<VeuTopo ate={860} />
			{/* pílula AO VIVO + olho + contador */}
			<div style={{position: 'absolute', top: 130, width: '100%', display: 'flex', justifyContent: 'center', opacity: Math.min(1, pPil * 1.4), transform: `scale(${(0.8 + 0.2 * pPil) * pulso(frame, n900, 0.1) * pulso(frame, n900b, 0.08)})`}}>
				<div style={{display: 'flex', alignItems: 'center', gap: 18, ...VIDRO, borderRadius: 999, padding: '12px 30px 12px 14px'}}>
					<div style={{background: '#FF2D55', color: '#fff', fontFamily: poppins, fontWeight: 900, fontSize: 30, letterSpacing: '0.08em', padding: '8px 18px', borderRadius: 999}}>AO VIVO</div>
					<svg width={52} height={34} viewBox="0 0 52 34">
						<path d="M2 17 C 12 2, 40 2, 50 17 C 40 32, 12 32, 2 17 Z" fill="none" stroke="#fff" strokeWidth={4} />
						<circle cx={26} cy={17} r={8} fill={OURO} />
					</svg>
					<div style={{fontFamily: poppins, fontWeight: 900, fontSize: 52, color: frame >= n900 ? OURO : '#fff', fontVariantNumeric: 'tabular-nums', minWidth: 120}}>{conta}</div>
				</div>
			</div>
			{/* rostinhos entrando na sala */}
			{Array.from({length: 16}).map((_, i) => {
				const ent = sobe + i * Math.max(1, (n900 - sobe) / 16);
				const p = mola(frame, fps, ent, 220);
				const x = 150 + ((i * 197) % 780);
				const y = 300 + ((i * 89) % 140);
				const cores = ['#8a5cf6', '#f2a65a', '#5bc0eb', '#ef6f9a', '#9be564'];
				return (
					<div key={i} style={{position: 'absolute', left: x, top: y - (1 - p) * 60, width: 44, height: 44, borderRadius: 44, background: cores[i % cores.length], boxShadow: '0 0 0 3px rgba(255,255,255,0.85)', opacity: p * interpolate(frame, [n900 - 2, n900 + 4], [1, 0], lim)}} />
				);
			})}
			<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
				<CameraTremor quadro={frame} batidas={[n900, n900b]} z0={14.5} z1={14.1} duracao={fim} />
				<Luzes quadro={frame} batidas={[n900, n900b]} />
				<Linha3D ate={fim - 6} texto="+900" metal="ouro" largura={2.9} y={yMundo(400)} quadro={frame} batida={n900} profundidade={0.6} />
			</ThreeCanvas>
			{frame < nunca ? <Pilula texto="PESSOAS NA LIVE" y={570} p={mola(frame, fps, n900 + 3, 220)} /> : <Pilula texto="PRIMEIRA VEZ" y={570} p={p2} ouro />}
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 4. 15 dias de mentoria
// Folhinha de calendário no topo: as páginas viram do 1 ao 15 e o 15 pousa em ouro; DIAS DE MENTORIA embaixo.
// dados: {em15, emMentoria}
const d42Dias: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, op} = useCena(cena);
	const d = cena.dados as {em15: number; emMentoria: number};
	const t15 = Math.max(8, q(d.em15));
	const pCard = mola(frame, fps, 0, 180);
	const f = interpolate(frame, [2, t15], [0, 1], {...lim, easing: Easing.in(Easing.quad)});
	const dia = Math.max(1, Math.min(15, 1 + Math.floor(f * 14.999)));
	const virando = frame < t15 ? (f * 14.999) % 1 : 1;
	const pousou = frame >= t15;
	return (
		<AbsoluteFill style={{opacity: op}}>
			<VeuTopo ate={800} />
			<div style={{position: 'absolute', left: 540 - 170, top: 120, width: 340, height: 380, transform: `scale(${(0.75 + 0.25 * pCard) * pulso(frame, t15, 0.12)})`, opacity: Math.min(1, pCard * 1.5), perspective: 900}}>
				<div style={{position: 'absolute', inset: 0, borderRadius: 30, background: 'linear-gradient(180deg,#fbf7ef,#e9e1d2)', boxShadow: `0 26px 60px rgba(8,3,20,0.55)${pousou ? ', 0 0 0 5px ' + OURO : ''}`, overflow: 'hidden'}}>
					<div style={{height: 96, background: 'linear-gradient(180deg,#3d1f74,#1E0F3A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: poppins, fontWeight: 800, fontSize: 32, letterSpacing: '0.2em', marginRight: '-0.2em', color: OURO}}>MENTORIA</div>
					<div style={{position: 'absolute', top: 96, bottom: 0, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: poppins, fontWeight: 900, fontSize: 200, lineHeight: 1, color: pousou ? '#b8862f' : ROXO, fontVariantNumeric: 'tabular-nums'}}>{dia}</div>
					{/* página que vira */}
					{!pousou ? (
						<div style={{position: 'absolute', top: 96, left: 0, right: 0, bottom: 0, background: 'linear-gradient(180deg,#fffdf8,#efe8da)', transformOrigin: 'top center', transform: `rotateX(${virando * 100}deg)`, opacity: 1 - virando, boxShadow: '0 -6px 18px rgba(0,0,0,0.15)'}} />
					) : null}
				</div>
				{[90, 250].map((x) => (
					<div key={x} style={{position: 'absolute', left: x - 10, top: -16, width: 20, height: 44, borderRadius: 10, background: OURO, boxShadow: '0 4px 10px rgba(0,0,0,0.4)'}} />
				))}
			</div>
			<Pilula texto="DIAS DE MENTORIA" y={540} p={mola(frame, fps, q(d.emMentoria), 220)} />
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 5. 1 dia × 2 dias
// Duas colunas: ELES (prata, 1 bloco de dia) e EU (ouro, 2 blocos). A barra deles sobe no "Eles fizeram", a dela sobe em dois
// degraus (dia 1, dia 2) no "eu fiz em dois dias" e chega quase na mesma altura; no "quase o mesmo" entra o ≈ em ouro 3D.
// dados: {emEles, emEu, emDois, emQuase}
const d42Comparacao: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, width, height, fim, q, op} = useCena(cena);
	const d = cena.dados as {emEles: number; emEu: number; emDois: number; emQuase: number};
	const eles = q(d.emEles);
	const eu = q(d.emEu);
	const dois = q(d.emDois);
	const quase = q(d.emQuase);
	const H = 640;
	const yB = 1460;
	const hEles = H * interpolate(frame, [eles, eles + 12], [0, 1], {...lim, easing: Easing.out(Easing.cubic)});
	const hEu1 = H * 0.49 * interpolate(frame, [eu, eu + 10], [0, 1], {...lim, easing: Easing.out(Easing.cubic)});
	const hEu2 = H * 0.47 * interpolate(frame, [dois, dois + 10], [0, 1], {...lim, easing: Easing.out(Easing.cubic)});
	const coluna = (x: number, titulo: string, sub: string, pT: number, cor: string) => (
		<>
			<div style={{position: 'absolute', left: x - 160, top: yB + 30, width: 320, textAlign: 'center', opacity: pT, fontFamily: poppins, fontWeight: 900, fontSize: 58, letterSpacing: '0.06em', color: cor}}>{titulo}</div>
			<div style={{position: 'absolute', left: x - 160, top: yB + 106, width: 320, textAlign: 'center', opacity: pT, fontFamily: poppins, fontWeight: 700, fontSize: 36, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.78)'}}>{sub}</div>
		</>
	);
	const bloco = (x: number, y: number, h: number, fundo: string, rotulo: string) =>
		h > 2 ? (
			<div style={{position: 'absolute', left: x - 130, top: y - h, width: 260, height: h, borderRadius: 18, background: fundo, boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.5), 0 16px 40px rgba(8,3,20,0.45)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflow: 'hidden'}}>
				<div style={{marginTop: 18, fontFamily: poppins, fontWeight: 800, fontSize: 32, letterSpacing: '0.12em', color: 'rgba(30,15,58,0.85)'}}>{rotulo}</div>
			</div>
		) : null;
	const pQ = mola(frame, fps, quase, 200);
	return (
		<AbsoluteFill style={{opacity: op}}>
			<FundoMotion />
			<div style={{position: 'absolute', left: 120, right: 120, top: yB, height: 4, background: 'rgba(255,255,255,0.35)'}} />
			{bloco(320, yB, hEles, 'linear-gradient(180deg,#f4f5fa,#b9bccb)', '1 DIA')}
			{bloco(760, yB, hEu1, OURO_TEXTO, 'DIA 1')}
			{bloco(760, yB - hEu1 - (hEu2 > 2 ? 8 : 0), hEu2, OURO_TEXTO, 'DIA 2')}
			{coluna(320, 'ELES', '1 DIA', mola(frame, fps, eles, 200), '#e9ebf3')}
			{coluna(760, 'EU', '2 DIAS', mola(frame, fps, eu, 200), OURO)}
			{/* valores no topo das barras */}
			<div style={{position: 'absolute', left: 320 - 160, top: yB - hEles - 92, width: 320, textAlign: 'center', opacity: interpolate(frame, [eles + 8, eles + 14], [0, 1], lim), fontFamily: poppins, fontWeight: 900, fontSize: 50, color: '#fff'}}>240 MIL</div>
			<div style={{position: 'absolute', left: 760 - 190, top: yB - hEu1 - hEu2 - 100, width: 380, textAlign: 'center', opacity: pQ, transform: `scale(${0.7 + 0.3 * pQ})`, fontFamily: poppins, fontWeight: 900, fontSize: 50, color: OURO}}>QUASE 240 MIL</div>
			<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
				<CameraTremor quadro={frame} batidas={[quase]} z0={14.5} z1={14.1} duracao={fim} />
				<Luzes quadro={frame} batidas={[quase]} />
				<Linha3D ate={fim - 6} texto="≈" metal="ouro" largura={1.5} y={yMundo(470)} quadro={frame} batida={quase} profundidade={0.6} />
			</ThreeCanvas>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 6. acabou o estoque
// Cartão ESTOQUE no topo: a barra esvazia enquanto as vendas saem; no "muito mais" entra ERA PRA SER MUITO MAIS embaixo;
// no "produtor disse" ela dá lugar à mensagem do produtor; no "Acabou" a barra zera e o carimbo ESGOTADO bate; no "para de
// vender" a mensagem troca por PARA DE VENDER. dados: {emMais, emProdutor, emAcabou, emPara}
const d42Estoque: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, op} = useCena(cena);
	const d = cena.dados as {emMais: number; emProdutor: number; emAcabou: number; emPara: number};
	const mais = q(d.emMais);
	const prod = q(d.emProdutor);
	const acabou = Math.max(prod + 4, q(d.emAcabou));
	const para = q(d.emPara);
	const pCard = mola(frame, fps, 0, 190);
	const nivel = interpolate(frame, [0, acabou], [1, 0], {...lim, easing: Easing.in(Easing.quad)});
	const unidades = Math.round(1200 * nivel);
	const carimbo = mola(frame, fps, acabou, 260);
	const tremor = frame >= acabou && frame < acabou + 9 ? Math.sin(frame * 2.7) * 10 * (1 - (frame - acabou) / 9) : 0;
	const msg = frame < para ? 'Acabou, não tem mais.' : 'Para de vender!';
	const pMsg = frame < para ? mola(frame, fps, prod, 200) : mola(frame, fps, para, 220);
	return (
		<AbsoluteFill style={{opacity: op}}>
			<VeuTopo ate={860} />
			<div style={{position: 'absolute', left: 130, right: 130, top: 120, padding: '26px 34px 30px', borderRadius: 32, ...VIDRO, transform: `translate(${tremor}px, ${(1 - pCard) * -50}px)`, opacity: Math.min(1, pCard * 1.4)}}>
				<div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
					<div style={{display: 'flex', alignItems: 'center', gap: 16}}>
						<svg width={54} height={54} viewBox="0 0 54 54">
							<path d="M27 4 L49 15 L49 39 L27 50 L5 39 L5 15 Z" fill="rgba(232,194,122,0.25)" stroke={OURO} strokeWidth={3.5} strokeLinejoin="round" />
							<path d="M5 15 L27 26 L49 15 M27 26 L27 50" fill="none" stroke={OURO} strokeWidth={3.5} strokeLinejoin="round" />
						</svg>
						<div style={{fontFamily: poppins, fontWeight: 800, fontSize: 36, letterSpacing: '0.18em', color: '#fff'}}>ESTOQUE</div>
					</div>
					<div style={{fontFamily: poppins, fontWeight: 900, fontSize: 44, color: nivel < 0.02 ? VERMELHO : OURO, fontVariantNumeric: 'tabular-nums'}}>{unidades} un.</div>
				</div>
				<div style={{position: 'relative', marginTop: 20, height: 46, borderRadius: 23, background: 'rgba(255,255,255,0.1)', boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.25)', overflow: 'hidden'}}>
					<div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${nivel * 100}%`, borderRadius: 23, background: nivel > 0.3 ? OURO_TEXTO : 'linear-gradient(90deg,#ff5a6e,#ff9a6e)'}} />
				</div>
				{frame >= acabou ? (
					<div style={{position: 'absolute', left: 0, right: 0, top: 52, display: 'flex', justifyContent: 'center'}}>
						<div style={{padding: '10px 30px', border: `7px solid ${VERMELHO}`, borderRadius: 16, color: VERMELHO, fontFamily: poppins, fontWeight: 900, fontSize: 70, letterSpacing: '0.06em', background: 'rgba(30,15,58,0.85)', transform: `rotate(-9deg) scale(${2.2 - 1.2 * carimbo})`, opacity: Math.min(1, carimbo * 1.5), boxShadow: '0 0 30px rgba(255,90,110,0.45)'}}>
							ESGOTADO
						</div>
					</div>
				) : null}
			</div>
			{frame >= mais && frame < prod ? <Pilula texto="ERA PRA SER MUITO MAIS" y={440} p={mola(frame, fps, mais, 220)} ouro tamanho={42} /> : null}
			{/* mensagem do produtor */}
			{frame >= prod ? (
				<div style={{position: 'absolute', left: 130, top: 400, display: 'flex', alignItems: 'flex-end', gap: 14, opacity: Math.min(1, pMsg * 1.4), transform: `translateY(${(1 - pMsg) * 30}px) scale(${0.85 + 0.15 * pMsg})`, transformOrigin: 'left bottom'}}>
					<div style={{width: 64, height: 64, borderRadius: 64, background: 'linear-gradient(160deg,#5b34a8,#24124a)', boxShadow: `inset 0 0 0 3px ${OURO}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: poppins, fontWeight: 900, fontSize: 30, color: OURO}}>P</div>
					<div style={{background: '#fffdf8', borderRadius: '28px 28px 28px 6px', padding: '16px 28px 18px', boxShadow: '0 16px 40px rgba(8,3,20,0.45)'}}>
						<div style={{fontFamily: poppins, fontWeight: 800, fontSize: 26, letterSpacing: '0.1em', color: '#7a5bb8'}}>PRODUTOR</div>
						<div style={{fontFamily: poppins, fontWeight: 800, fontSize: 46, color: ROXO}}>{msg}</div>
					</div>
				</div>
			) : null}
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 7. operação de live aberta
// Painel BASTIDORES DA LIVE no topo, primeiro trancado sob vidro fosco com cadeado; no "aberta" o cadeado abre, o fosco sai e
// aparecem os números da operação; no "nada" entra SEM SEGREDO; no "fazendo" as linhas acendem uma a uma.
// dados: {emAberta, emNada, emFazendo}
const d42Aberta: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, op} = useCena(cena);
	const d = cena.dados as {emAberta: number; emNada: number; emFazendo: number};
	const aberta = q(d.emAberta);
	const nada = q(d.emNada);
	const fazendo = q(d.emFazendo);
	const pCard = mola(frame, fps, 0, 190);
	const abre = interpolate(frame, [aberta, aberta + 8], [0, 1], {...lim, easing: Easing.out(Easing.cubic)});
	const fosco = 1 - interpolate(frame, [aberta + 2, aberta + 12], [0, 1], lim);
	const linhas = [
		{k: 'ESPECTADORES', v: '1.240'},
		{k: 'CLIQUES NO PRODUTO', v: '18%'},
		{k: 'CONVERSÃO', v: '6,2%'},
		{k: 'GMV / HORA', v: 'R$ 4.980'},
	];
	return (
		<AbsoluteFill style={{opacity: op}}>
			<VeuTopo ate={900} />
			<div style={{position: 'absolute', left: 120, right: 120, top: 110, padding: '24px 34px 26px', borderRadius: 32, ...VIDRO, transform: `translateY(${(1 - pCard) * -50}px)`, opacity: Math.min(1, pCard * 1.4)}}>
				<div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14}}>
					<div style={{fontFamily: poppins, fontWeight: 800, fontSize: 32, letterSpacing: '0.16em', color: OURO}}>BASTIDORES DA LIVE</div>
					<div style={{fontFamily: poppins, fontWeight: 800, fontSize: 26, letterSpacing: '0.1em', color: abre > 0.5 ? VERDE : 'rgba(255,255,255,0.6)'}}>{abre > 0.5 ? '● ABERTO' : '● FECHADO'}</div>
				</div>
				{linhas.map((l, i) => {
					const acende = mola(frame, fps, fazendo + i * 5, 220);
					return (
						<div key={l.k} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', marginTop: 8, borderRadius: 16, background: `rgba(232,194,122,${0.06 + 0.2 * acende})`, boxShadow: acende > 0.5 ? `inset 0 0 0 2px ${OURO}` : 'none', filter: `blur(${fosco * 14}px)`}}>
							<div style={{fontFamily: poppins, fontWeight: 700, fontSize: 32, color: '#fff'}}>{l.k}</div>
							<div style={{fontFamily: poppins, fontWeight: 900, fontSize: 38, color: OURO, fontVariantNumeric: 'tabular-nums'}}>{l.v}</div>
						</div>
					);
				})}
				{/* cadeado */}
				<div style={{position: 'absolute', left: '50%', top: 150, marginLeft: -60, width: 120, height: 150, opacity: 1 - interpolate(frame, [aberta + 8, aberta + 16], [0, 1], lim), transform: `scale(${1 + 0.15 * abre})`}}>
					<svg width={120} height={150} viewBox="0 0 120 150">
						<path d={`M30 ${70 - 26 * abre} V45 a30 30 0 0 1 60 0 V70`} fill="none" stroke={OURO} strokeWidth={12} strokeLinecap="round" transform={`translate(${abre * 0}, ${-abre * 22})`} />
						<rect x={14} y={66} width={92} height={78} rx={16} fill={OURO} />
						<circle cx={60} cy={100} r={10} fill={ROXO} />
						<rect x={56} y={104} width={8} height={20} rx={4} fill={ROXO} />
					</svg>
				</div>
			</div>
			<Pilula texto="SEM SEGREDO" y={640} p={mola(frame, fps, nada, 220)} ouro />
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 8. por que deu certo / por que não deu
// Dois cartões de métrica: no 1º "por que" o gráfico sobe com ✓ verde (DEU CERTO); no "não tá" o 2º cai com ✗ (NÃO DEU).
// dados: {emCerto, emErrado}
const d42CertoErrado: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, op} = useCena(cena);
	const d = cena.dados as {emCerto: number; emErrado: number};
	const certo = q(d.emCerto);
	const errado = q(d.emErrado);
	const cartao = (y: number, de: number, ok: boolean) => {
		const p = mola(frame, fps, de, 180);
		const traco = interpolate(frame, [de + 2, de + 14], [0, 1], {...lim, easing: Easing.out(Easing.cubic)});
		const pts = ok ? [0, 0.2, 0.15, 0.45, 0.4, 0.75, 0.95] : [0.9, 0.7, 0.78, 0.45, 0.5, 0.25, 0.08];
		const caminho = pts.map((v, i) => `${i === 0 ? 'M' : 'L'} ${40 + (i / (pts.length - 1)) * 420} ${190 - v * 150}`).join(' ');
		const cor = ok ? VERDE : VERMELHO;
		const selo = mola(frame, fps, de + 10, 240);
		return (
			<div style={{position: 'absolute', left: 120, right: 120, top: y, height: 300, borderRadius: 34, ...VIDRO, opacity: Math.min(1, p * 1.4), transform: `translateX(${(1 - p) * (ok ? -200 : 200)}px)`}}>
				<svg width={500} height={240} viewBox="0 0 500 240" style={{position: 'absolute', left: 20, top: 40}}>
					<path d={caminho} fill="none" stroke={cor} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - traco} style={{filter: `drop-shadow(0 0 10px ${cor})`}} />
				</svg>
				<div style={{position: 'absolute', right: 40, top: 54, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12}}>
					<div style={{width: 120, height: 120, borderRadius: 120, background: cor, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${selo})`, boxShadow: `0 0 34px ${cor}`}}>
						<svg width={70} height={70} viewBox="0 0 70 70">
							{ok ? <path d="M14 37 L29 52 L57 20" fill="none" stroke={ROXO} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" /> : <path d="M18 18 L52 52 M52 18 L18 52" stroke={ROXO} strokeWidth={10} strokeLinecap="round" />}
						</svg>
					</div>
					<div style={{fontFamily: poppins, fontWeight: 900, fontSize: 34, letterSpacing: '0.08em', color: cor, opacity: selo}}>{ok ? 'DEU CERTO' : 'NÃO DEU'}</div>
				</div>
			</div>
		);
	};
	return (
		<AbsoluteFill style={{opacity: op}}>
			<FundoMotion />
			<Rotulo texto="POR QUÊ?" y={420} p={mola(frame, fps, 0, 200)} tamanho={56} />
			{cartao(560, certo, true)}
			{cartao(920, errado, false)}
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 9. como analisar: o funil
// COMO ANALISAR em ouro 3D no topo; um funil de 4 camadas acende camada por camada na palavra: PRODUTO, PRODUTOR, LIVE,
// FUNIL DE COMPRA; no "cliente" um carrinho cai pela boca do funil.
// dados: {emComo, emProduto, emProdutor, emLive, emFunil, emCliente}
const d42Funil: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, width, height, fim, q, op} = useCena(cena);
	const d = cena.dados as {emComo: number; emProduto: number; emProdutor: number; emLive: number; emFunil: number; emCliente: number};
	const como = q(d.emComo);
	const camadas = [
		{t: 'PRODUTO', em: q(d.emProduto)},
		{t: 'PRODUTOR', em: q(d.emProdutor)},
		{t: 'LIVE', em: q(d.emLive)},
		{t: 'FUNIL DE COMPRA', em: q(d.emFunil)},
	];
	const cliente = q(d.emCliente);
	const y0 = 760;
	const hC = 150;
	const cai = interpolate(frame, [cliente, cliente + 14], [0, 1], {...lim, easing: Easing.in(Easing.quad)});
	return (
		<AbsoluteFill style={{opacity: op}}>
			<FundoMotion />
			<svg width={width} height={height} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
				{camadas.map((c, i) => {
					const topo = y0 + i * (hC + 14);
					const larg0 = 880 - i * 170;
					const larg1 = 880 - (i + 1) * 170;
					const p = mola(frame, fps, c.em, 220);
					const ativo = frame >= c.em;
					const atual = ativo && (i === camadas.length - 1 || frame < camadas[i + 1].em);
					return (
						<g key={c.t} opacity={0.35 + 0.65 * Math.min(1, p)}>
							<polygon
								points={`${540 - larg0 / 2},${topo} ${540 + larg0 / 2},${topo} ${540 + larg1 / 2},${topo + hC} ${540 - larg1 / 2},${topo + hC}`}
								fill={ativo ? (atual ? 'url(#d42ouro)' : 'rgba(232,194,122,0.35)') : 'rgba(255,255,255,0.07)'}
								stroke={ativo ? OURO : 'rgba(255,255,255,0.25)'}
								strokeWidth={4}
								style={{filter: atual ? 'drop-shadow(0 0 22px rgba(232,194,122,0.6))' : undefined}}
							/>
							<text x={540} y={topo + hC / 2 + 16} textAnchor="middle" fontFamily={poppins} fontWeight={900} fontSize={i === 3 ? 34 : 46} letterSpacing={2} fill={atual ? ROXO : '#fff'} opacity={ativo ? 1 : 0.35} transform={`translate(540 ${topo + hC / 2}) scale(${0.8 + 0.2 * Math.min(1.1, p)}) translate(-540 ${-(topo + hC / 2)})`}>
								{c.t}
							</text>
						</g>
					);
				})}
				<defs>
					<linearGradient id="d42ouro" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" stopColor="#FFF1C9" />
						<stop offset="0.5" stopColor="#E8C27A" />
						<stop offset="1" stopColor="#C9974A" />
					</linearGradient>
				</defs>
			</svg>
			{/* carrinho do cliente saindo pela boca do funil */}
			{frame >= cliente ? (
				<div style={{position: 'absolute', left: 540 - 60, top: y0 + 4 * (hC + 14) - 40 + cai * 120, width: 120, height: 100, opacity: interpolate(frame, [cliente, cliente + 4], [0, 1], lim)}}>
					<svg width={120} height={100} viewBox="0 0 120 100">
						<path d="M6 12 H24 L36 66 H96 L108 28 H30" fill="none" stroke={OURO} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
						<circle cx={44} cy={84} r={9} fill={OURO} />
						<circle cx={88} cy={84} r={9} fill={OURO} />
					</svg>
				</div>
			) : null}
			<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
				<Luzes quadro={frame} batidas={[como]} />
				<Linha3D ate={Math.min(fim - 6, como + 30)} texto="COMO ANALISAR" metal="ouro" largura={4.4} y={yMundo(470)} quadro={frame} batida={como} profundidade={0.45} />
			</ThreeCanvas>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 10. não sabia analisar as métricas
// Etiquetas de métricas soltas e embaçadas com "?" girando no topo ("não sabia"); no "analisar" elas se alinham numa grade
// limpa e uma lupa passa; no "métricas" o título MÉTRICAS pousa em ouro.
// dados: {emAnalisar, emMetricas}
const d42Analise: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, op} = useCena(cena);
	const d = cena.dados as {emAnalisar: number; emMetricas: number};
	const analisar = q(d.emAnalisar);
	const metricas = q(d.emMetricas);
	const ordem = interpolate(frame, [analisar, analisar + 14], [0, 1], {...lim, easing: Easing.inOut(Easing.cubic)});
	const tags = ['CTR', 'RETENÇÃO', 'CONVERSÃO', 'TICKET MÉDIO', 'GMV / HORA', 'CLIQUES'];
	const lupa = interpolate(frame, [analisar + 6, analisar + 30], [0, 1], lim);
	const pM = mola(frame, fps, metricas, 200);
	return (
		<AbsoluteFill style={{opacity: op}}>
			<VeuTopo ate={900} />
			{tags.map((t, i) => {
				const ent = mola(frame, fps, i * 3, 180);
				const caosX = 140 + ((i * 263) % 640) + Math.sin(frame / 9 + i) * 26;
				const caosY = 170 + ((i * 137) % 380) + Math.cos(frame / 11 + i * 2) * 20;
				const col = i % 2;
				const lin = Math.floor(i / 2);
				const ordX = col ? 560 : 140;
				const ordY = 200 + lin * 112;
				const x = caosX + (ordX - caosX) * ordem;
				const y = caosY + (ordY - caosY) * ordem;
				const rot = (1 - ordem) * ((i % 3) - 1) * 14;
				return (
					<div key={t} style={{position: 'absolute', left: x, top: y, width: 380, height: 88, borderRadius: 22, ...VIDRO, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 26px', boxSizing: 'border-box', opacity: Math.min(1, ent * 1.4), transform: `rotate(${rot}deg) scale(${0.8 + 0.2 * ent})`, filter: `blur(${(1 - ordem) * 3}px)`}}>
						<span style={{fontFamily: poppins, fontWeight: 800, fontSize: 32, color: '#fff'}}>{t}</span>
						<span style={{fontFamily: poppins, fontWeight: 900, fontSize: 38, color: ordem > 0.6 ? VERDE : 'rgba(255,255,255,0.55)'}}>{ordem > 0.6 ? '✓' : '?'}</span>
					</div>
				);
			})}
			{/* lupa */}
			{lupa > 0 && lupa < 1 ? (
				<svg width={160} height={160} viewBox="0 0 160 160" style={{position: 'absolute', left: 120 + lupa * 760, top: 230 + Math.sin(lupa * Math.PI) * 120}}>
					<circle cx={64} cy={64} r={46} fill="rgba(255,255,255,0.12)" stroke={OURO} strokeWidth={10} />
					<path d="M98 98 L144 144" stroke={OURO} strokeWidth={16} strokeLinecap="round" />
				</svg>
			) : null}
			<Pilula texto="AS MÉTRICAS" y={560} p={pM} ouro tamanho={48} />
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 11. comunidade respondendo a dúvida
// Chat da comunidade no topo: a dúvida dela sobe, os meninos e a comunidade respondem (uma bolha nova empurra as antigas),
// e no "conseguir fazer" chega o DEU CERTO com ✓. dados: {itens: [{de, texto, em, eu?}], emOk}
type Msg = {de: string; texto: string; em: number; eu?: boolean};
const d42Comunidade: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, op} = useCena(cena);
	const d = cena.dados as {itens: Msg[]; emOk: number};
	const itens = d.itens.map((m) => ({...m, f: q(m.em)}));
	const ok = q(d.emOk);
	const ALT = 150;
	const visiveis = itens.filter((m) => frame >= m.f);
	const pCard = mola(frame, fps, 0, 190);
	// a pilha sobe com mola a cada mensagem nova
	let deslocamento = 0;
	visiveis.forEach((m, i) => {
		if (i >= 3) deslocamento += ALT * mola(frame, fps, m.f, 200);
	});
	const pOk = mola(frame, fps, ok, 220);
	return (
		<AbsoluteFill style={{opacity: op}}>
			<VeuTopo ate={900} />
			<div style={{position: 'absolute', left: 90, right: 90, top: 100, height: 600, borderRadius: 36, ...VIDRO, overflow: 'hidden', opacity: Math.min(1, pCard * 1.4), transform: `translateY(${(1 - pCard) * -40}px)`}}>
				<div style={{height: 84, display: 'flex', alignItems: 'center', gap: 16, padding: '0 28px', borderBottom: '2px solid rgba(232,194,122,0.3)'}}>
					<div style={{width: 46, height: 46, borderRadius: 46, background: OURO_TEXTO}} />
					<div style={{fontFamily: poppins, fontWeight: 800, fontSize: 32, color: '#fff'}}>Comunidade da mentoria</div>
				</div>
				<div style={{position: 'absolute', left: 0, right: 0, top: 100, transform: `translateY(${-deslocamento}px)`}}>
					{visiveis.map((m, i) => {
						const p = mola(frame, fps, m.f, 210);
						return (
							<div key={i} style={{position: 'absolute', top: i * ALT, left: m.eu ? undefined : 24, right: m.eu ? 24 : undefined, maxWidth: 760, opacity: Math.min(1, p * 1.5), transform: `translateY(${(1 - p) * 40}px) scale(${0.85 + 0.15 * p})`, transformOrigin: m.eu ? 'right bottom' : 'left bottom'}}>
								<div style={{background: m.eu ? OURO_TEXTO : '#fffdf8', borderRadius: m.eu ? '26px 26px 6px 26px' : '26px 26px 26px 6px', padding: '12px 24px 14px', boxShadow: '0 10px 26px rgba(8,3,20,0.35)'}}>
									<div style={{fontFamily: poppins, fontWeight: 800, fontSize: 24, letterSpacing: '0.08em', color: m.eu ? '#5a3a10' : '#7a5bb8'}}>{m.de.toUpperCase()}</div>
									<div style={{fontFamily: poppins, fontWeight: 700, fontSize: 36, lineHeight: 1.2, color: ROXO}}>{m.texto}</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>
			<div style={{position: 'absolute', top: 730, width: '100%', display: 'flex', justifyContent: 'center', opacity: Math.min(1, pOk * 1.4)}}>
				<div style={{display: 'flex', alignItems: 'center', gap: 16, padding: '14px 34px', borderRadius: 999, background: VERDE, color: ROXO, fontFamily: poppins, fontWeight: 900, fontSize: 44, letterSpacing: '0.06em', transform: `scale(${0.6 + 0.4 * pOk})`, boxShadow: '0 0 34px rgba(91,227,155,0.55)'}}>
					<svg width={44} height={44} viewBox="0 0 70 70">
						<path d="M14 37 L29 52 L57 20" fill="none" stroke={ROXO} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
					</svg>
					DEU CERTO
				</div>
			</div>
		</AbsoluteFill>
	);
};


export const pecas: Pecas = {d42Mes, d42Hora, d42Espectadores, d42Dias, d42Comparacao, d42Estoque, d42Aberta, d42CertoErrado, d42Funil, d42Analise, d42Comunidade};
