// Peças (efeitos) exclusivas do depoimento-4-3, usadas no edit.ts com {tipo: 'peca', nome: '<chave>', dados: {...}}.
// Chaves com prefixo d43 (já registrado em src/pecas/registro.ts).
// Tempos em `dados` = segundos do vídeo editado. Paleta roxo + ouro do tema; tudo em placa de vidro escura no alto da tela
// (o teto do carro), acima do rosto: a camiseta é vermelha, então nada de texto dourado solto sobre ela.
import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import type {CenaPeca, Pecas} from '../../pecas/peca';
import {FundoMotion} from '../../pecas/FundoMotion';
import {CameraTremor, Faiscas, Linha3D, Luzes} from '../../pecas/tres/Texto3D';
import {playfair, poppins} from '../../motor/tema';

const lim = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const OURO = '#E8C27A';
const ROXO = '#1E0F3A';
const PRATA = '#c9ccd8';
const VIDRO = 'rgba(30,15,58,0.86)';
const GL = {alpha: true, antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05};
const CAMERA = {fov: 35, position: [0, 0, 14.5] as [number, number, number], near: 0.1, far: 60};
const yMundo = (px: number) => ((960 - px) / 960) * 14.5 * Math.tan((35 / 2) * (Math.PI / 180));

const useCena = (cena: CenaPeca) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const fim = Math.round((cena.ate - cena.de) * fps);
	const q = (s: unknown) => (typeof s === 'number' ? Math.round(Math.max(0, s - cena.de) * fps) : 9999);
	const op = interpolate(frame, [0, 5, fim - 6, fim], [0, 1, 1, 0], lim);
	return {frame, fps, width, height, fim, q, op};
};
const mola = (frame: number, fps: number, de: number, rigidez = 150) => spring({frame: frame - de, fps, config: {damping: 14, stiffness: rigidez}});
const D = (cena: CenaPeca) => (cena.dados ?? {}) as Record<string, unknown>;

// Placa de vidro escura no alto (acima da cabeça).
const Placa: React.FC<{top: number; altura: number; p: number; children: React.ReactNode; borda?: string; x?: number}> = ({top, altura, p, children, borda, x = 0}) => (
	<div
		style={{
			position: 'absolute',
			left: 90,
			right: 90,
			top,
			height: altura,
			borderRadius: 40,
			background: VIDRO,
			border: `3px solid ${borda ?? 'rgba(233,230,242,0.28)'}`,
			boxShadow: '0 24px 60px rgba(8,3,20,0.55)',
			transform: `translate(${x}px, ${(1 - p) * -50}px) scale(${0.92 + 0.08 * p})`,
			opacity: Math.min(1, p * 1.5),
			overflow: 'hidden',
		}}
	>
		{children}
	</div>
);
const Kicker: React.FC<{texto: string; p: number; top?: number; cor?: string}> = ({texto, p, top = 34, cor = '#e9e6f2'}) => (
	<div style={{position: 'absolute', top, width: '100%', textAlign: 'center', fontFamily: poppins, fontWeight: 800, fontSize: 34, letterSpacing: '0.22em', color: cor, opacity: p, transform: `translateY(${(1 - p) * 14}px)`}}>
		{texto}
	</div>
);

// ---------------------------------------------------------------- 1. gancho: 9 mil → mais de 30 mil de GMV em um dia
// Duas barras horizontais: ANTES (prata) enche até 9 MIL no "9 mil"; AGORA (ouro) cresce devagar no "consegui" e dispara
// até 30 MIL no "30 mil", quando "+30 MIL" cai em ouro 3D por cima, com faíscas e tremor.
// dados: {emMelhor, em9, emAgora, em30}
const d43Gmv: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, width, height, fim, q, op} = useCena(cena);
	const d = D(cena);
	const melhor = q(d.emMelhor);
	const nove = q(d.em9);
	const agora = q(d.emAgora);
	const trinta = q(d.em30);
	const pPlaca = mola(frame, fps, 0, 170);
	const prata = interpolate(frame, [Math.max(2, nove - 10), nove + 2], [0, 1], {...lim, easing: Easing.out(Easing.cubic)});
	const lento = interpolate(frame, [agora, trinta], [0, 0.26], lim);
	const dispara = interpolate(frame, [trinta, trinta + 9], [0, 1], {...lim, easing: Easing.out(Easing.back(1.4))});
	const ouro = Math.max(lento, 0.26 + 0.74 * dispara);
	const L = 560; // largura total da barra cheia (30 mil)
	const valor9 = Math.round(9 * prata);
	const valorOuro = frame < trinta ? Math.round(30 * lento * (frame >= agora ? 1 : 0)) : Math.round(9 + 21 * Math.min(1, dispara));
	const kick = frame < trinta - 2 ? mola(frame, fps, melhor, 200) : interpolate(frame, [trinta - 2, trinta + 3], [1, 0], lim);
	const tremor = frame >= trinta && frame < trinta + 10 ? Math.sin(frame * 2.9) * 10 * (1 - (frame - trinta) / 10) : 0;
	const Barra = ({y, f, cor, rotulo, valor, pv}: {y: number; f: number; cor: string; rotulo: string; valor: string; pv: number}) => (
		<div style={{position: 'absolute', left: 40, top: y, width: 820, opacity: pv}}>
			<div style={{fontFamily: poppins, fontWeight: 800, fontSize: 28, letterSpacing: '0.2em', color: 'rgba(233,230,242,0.8)', marginBottom: 10}}>{rotulo}</div>
			<div style={{position: 'relative', height: 64}}>
				<div style={{position: 'absolute', left: 0, top: 0, height: 64, width: Math.max(64, L * f), borderRadius: 32, background: cor, boxShadow: cor === OURO ? '0 0 40px rgba(232,194,122,0.55)' : 'none'}} />
				<div style={{position: 'absolute', left: Math.max(64, L * f) + 18, top: 4, fontFamily: poppins, fontWeight: 900, fontSize: 48, color: cor === OURO ? OURO : '#fff', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums'}}>{valor}</div>
			</div>
		</div>
	);
	return (
		<AbsoluteFill style={{opacity: op, transform: `translateX(${tremor}px)`}}>
			<Placa top={190} altura={430} p={pPlaca} borda={frame >= trinta ? OURO : undefined}>
				<Kicker texto="MEU MELHOR DIA · GMV" p={kick} />
				<Barra y={170} f={0.3 * prata} cor={PRATA} rotulo="ANTES" valor={`R$ ${valor9} MIL`} pv={interpolate(frame, [Math.max(1, nove - 12), nove - 4], [0, 1], lim)} />
				<Barra y={290} f={ouro} cor={OURO} rotulo="AGORA" valor={`R$ ${valorOuro} MIL`} pv={interpolate(frame, [agora - 2, agora + 4], [0, 1], lim)} />
			</Placa>
			<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
				<CameraTremor quadro={frame} batidas={[trinta]} z0={14.5} z1={13.9} duracao={fim} />
				<Luzes quadro={frame} batidas={[trinta]} />
				{frame >= trinta - 1 ? <Linha3D ate={fim - 6} texto="+30 MIL" metal="ouro" largura={3.4} y={yMundo(300)} quadro={frame} batida={trinta} profundidade={0.5} /> : null}
				<Faiscas quadro={frame} inicio={trinta} y={yMundo(300)} cor={OURO} n={36} largura={5} />
			</ThreeCanvas>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 2. linha do tempo da jornada (março → setembro)
// Linha com os meses de MAR a OUT; o cursor de luz corre até o mês falado e finca um pino com o rótulo. No segundo uso
// (setembro), MAR já está marcado e o trecho MAR→SET enche em ouro.
// dados: {mes: 'MAR' | 'SET', em, emRotulo, rotulo, rotuloMar}
const MESES = ['MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT'];
const d43Linha: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, op} = useCena(cena);
	const d = D(cena);
	const alvo = Math.max(0, MESES.indexOf(String(d.mes ?? 'MAR')));
	const em = q(d.em);
	const emRot = q(d.emRotulo ?? d.em);
	const x0 = 150;
	const x1 = 930;
	const xm = (i: number) => x0 + ((x1 - x0) * i) / (MESES.length - 1);
	const deMar = alvo > 0;
	const corre = interpolate(frame, [deMar ? 2 : 0, Math.max(deMar ? 4 : 2, em)], [0, 1], {...lim, easing: Easing.inOut(Easing.cubic)});
	const xc = deMar ? xm(0) + (xm(alvo) - xm(0)) * corre : xm(0) - 120 + 120 * corre;
	const pino = mola(frame, fps, em, 220);
	const rot = mola(frame, fps, emRot, 200);
	const pPlaca = mola(frame, fps, 0, 170);
	const y = 300;
	return (
		<AbsoluteFill style={{opacity: op}}>
			<Placa top={190} altura={330} p={pPlaca}>
				<Kicker texto="MINHA JORNADA NO TIKTOK SHOP" p={pPlaca} top={30} />
			</Placa>
			<svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
				<line x1={x0} y1={y + 40} x2={x1} y2={y + 40} stroke="rgba(255,255,255,0.25)" strokeWidth={8} strokeLinecap="round" opacity={pPlaca} />
				{deMar ? <line x1={xm(0)} y1={y + 40} x2={xc} y2={y + 40} stroke={OURO} strokeWidth={10} strokeLinecap="round" /> : null}
				{MESES.map((m, i) => {
					const aceso = (i === 0 && (deMar || frame >= em)) || (i === alvo && frame >= em);
					return (
						<g key={m} opacity={pPlaca}>
							<circle cx={xm(i)} cy={y + 40} r={aceso ? 16 : 9} fill={aceso ? OURO : 'rgba(255,255,255,0.5)'} />
							<text x={xm(i)} y={y + 110} textAnchor="middle" fontFamily={poppins} fontWeight={800} fontSize={30} fill={aceso ? OURO : 'rgba(233,230,242,0.6)'} letterSpacing={2}>
								{m}
							</text>
						</g>
					);
				})}
				{/* cursor de luz */}
				<circle cx={xc} cy={y + 40} r={26} fill="rgba(255,240,200,0.35)" opacity={frame < em + 4 ? pPlaca : 0} />
				{/* pino no mês falado */}
				<g transform={`translate(${xm(alvo)}, ${y + 40 - 70 * pino}) scale(${pino})`} opacity={frame >= em ? 1 : 0}>
					<path d="M0,0 C-26,-30 -30,-64 0,-74 C30,-64 26,-30 0,0 Z" fill={OURO} />
					<circle cx={0} cy={-48} r={11} fill={ROXO} />
				</g>
				{deMar ? (
					<text x={xm(0)} y={y - 10} textAnchor="middle" fontFamily={poppins} fontWeight={800} fontSize={26} fill="rgba(233,230,242,0.75)" letterSpacing={2} opacity={pPlaca}>
						{String(d.rotuloMar ?? 'COMEÇO')}
					</text>
				) : null}
			</svg>
			<div
				style={{
					position: 'absolute',
					top: y + 150,
					left: xm(alvo) - 220,
					width: 440,
					textAlign: 'center',
					opacity: frame >= emRot ? rot : 0,
					transform: `translateY(${(1 - rot) * 16}px)`,
				}}
			>
				<span style={{display: 'inline-block', padding: '8px 26px', borderRadius: 30, background: OURO, color: ROXO, fontFamily: poppins, fontWeight: 900, fontSize: 34, letterSpacing: '0.08em'}}>{String(d.rotulo ?? '')}</span>
			</div>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 3. live gravada
// Tela de live (vidro) com a pílula vermelha AO VIVO; no "gravada" a pílula vira GRAVADA (cinza, com seta de repetição) e a
// barra de reprodução volta para o começo em ciclos: é o mesmo vídeo passando de novo.
// dados: {emLive, emGravada}
const d43LiveGravada: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, op} = useCena(cena);
	const d = D(cena);
	const live = q(d.emLive);
	const grav = q(d.emGravada);
	const p = mola(frame, fps, 0, 170);
	const vira = mola(frame, fps, grav, 220);
	const gravada = frame >= grav;
	const ciclo = 22;
	const prog = gravada ? ((frame - grav) % ciclo) / ciclo : interpolate(frame, [0, Math.max(10, grav)], [0, 0.7], lim);
	const giro = gravada ? (frame - grav) * 14 : 0;
	const pLive = mola(frame, fps, live, 200);
	return (
		<AbsoluteFill style={{opacity: op}}>
			<Placa top={190} altura={400} p={p} borda={gravada ? 'rgba(201,204,216,0.6)' : 'rgba(255,60,90,0.6)'}>
				{/* "vídeo" da live: silhueta de produto e vendedor */}
				<div style={{position: 'absolute', left: 60, top: 110, width: 780, height: 170, borderRadius: 24, background: 'linear-gradient(120deg, rgba(91,52,168,0.7), rgba(36,18,72,0.7))'}}>
					<div style={{position: 'absolute', left: 60, top: 30, width: 110, height: 110, borderRadius: 55, background: 'rgba(233,230,242,0.25)'}} />
					<div style={{position: 'absolute', left: 210, top: 44, width: 300, height: 22, borderRadius: 11, background: 'rgba(233,230,242,0.3)'}} />
					<div style={{position: 'absolute', left: 210, top: 86, width: 220, height: 22, borderRadius: 11, background: 'rgba(233,230,242,0.2)'}} />
					{/* seta de repetição */}
					<svg width={120} height={120} viewBox="-60 -60 120 120" style={{position: 'absolute', right: 40, top: 25, opacity: vira * (gravada ? 1 : 0)}}>
						<g transform={`rotate(${giro})`}>
							<path d="M 0 -40 A 40 40 0 1 1 -38 -12" fill="none" stroke={OURO} strokeWidth={10} strokeLinecap="round" />
							<path d="M -52 -22 L -36 -2 L -22 -26 Z" fill={OURO} />
						</g>
					</svg>
				</div>
				{/* pílula AO VIVO → GRAVADA */}
				<div style={{position: 'absolute', left: 60, top: 36, display: 'flex', alignItems: 'center', gap: 14, padding: '8px 24px', borderRadius: 30, background: gravada ? '#5d5f6e' : '#ff2d55', transform: `scale(${(gravada ? 0.85 + 0.15 * vira : 0.6 + 0.4 * pLive)})`, transformOrigin: 'left center', opacity: Math.min(1, pLive * 1.5)}}>
					<div style={{width: 18, height: 18, borderRadius: 9, background: '#fff', opacity: gravada ? 0.6 : 0.6 + 0.4 * Math.sin(frame / 3)}} />
					<div style={{fontFamily: poppins, fontWeight: 900, fontSize: 36, letterSpacing: '0.12em', color: '#fff'}}>{gravada ? 'GRAVADA' : 'AO VIVO'}</div>
				</div>
				{/* barra de reprodução */}
				<div style={{position: 'absolute', left: 60, right: 60, top: 320, height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.18)'}}>
					<div style={{width: `${prog * 100}%`, height: 12, borderRadius: 6, background: gravada ? OURO : '#ff2d55'}} />
				</div>
			</Placa>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 4. o TikTok sempre muda / quem não acompanha fica defasado
// Uma esteira de cartões de atualização (ALGORITMO, FORMATO, REGRAS...) passa sem parar, com o ícone de atualizar girando.
// No "defasado" o cartão VOCÊ fica parado, perde a cor e leva o carimbo DEFASADO, enquanto a esteira segue.
// dados: {emMuda, emDefasado}
const ITENS = ['ALGORITMO', 'FORMATOS', 'REGRAS', 'TENDÊNCIAS', 'ANÚNCIOS', 'LIVES'];
const d43Mudando: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, op} = useCena(cena);
	const d = D(cena);
	const muda = q(d.emMuda);
	const def = q(d.emDefasado);
	const p = mola(frame, fps, 0, 170);
	const velocidade = 15; // px por quadro
	const desloc = Math.max(0, frame - Math.min(muda, 6)) * velocidade;
	const defasou = frame >= def;
	const cinza = interpolate(frame, [def, def + 8], [0, 1], lim);
	const carimbo = mola(frame, fps, def + 3, 260);
	const tremor = frame >= def + 3 && frame < def + 12 ? Math.sin(frame * 3) * 8 * (1 - (frame - def - 3) / 9) : 0;
	// o cartão VOCÊ anda junto com a esteira até o "defasado" e então para (a esteira segue)
	const xVoce = 150;
	return (
		<AbsoluteFill style={{opacity: op}}>
			<Placa top={190} altura={400} p={p}>
				<div style={{position: 'absolute', top: 30, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, opacity: p}}>
					<svg width={44} height={44} viewBox="-22 -22 44 44">
						<g transform={`rotate(${frame * 12})`}>
							<path d="M 0 -16 A 16 16 0 1 1 -15 -5" fill="none" stroke={OURO} strokeWidth={5} strokeLinecap="round" />
							<path d="M -21 -9 L -15 1 L -8 -10 Z" fill={OURO} />
						</g>
					</svg>
					<div style={{fontFamily: poppins, fontWeight: 800, fontSize: 32, letterSpacing: '0.2em', color: '#e9e6f2'}}>{defasou ? 'O TIKTOK SEGUE' : 'O TIKTOK MUDA SEMPRE'}</div>
				</div>
				{/* esteira */}
				<div style={{position: 'absolute', left: 0, top: 120, width: 4000, height: 140, transform: `translateX(${-(desloc % 300)}px)`}}>
					{Array.from({length: 12}).map((_, i) => {
						const k = (i + Math.floor(desloc / 300)) % ITENS.length;
						return (
							<div key={i} style={{position: 'absolute', left: i * 300, top: 0, width: 270, height: 130, borderRadius: 22, background: 'linear-gradient(160deg, rgba(91,52,168,0.95), rgba(36,18,72,0.95))', boxShadow: `inset 0 0 0 3px ${OURO}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6}}>
								<div style={{fontFamily: poppins, fontWeight: 700, fontSize: 20, letterSpacing: '0.2em', color: OURO}}>NOVO</div>
								<div style={{fontFamily: poppins, fontWeight: 900, fontSize: 30, color: '#fff'}}>{ITENS[k]}</div>
							</div>
						);
					})}
				</div>
				{/* VOCÊ fica parado */}
				<div
					style={{
						position: 'absolute',
						left: xVoce,
						top: 290,
						width: 600,
						height: 80,
						borderRadius: 40,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						gap: 18,
						background: `rgba(${Math.round(232 - 140 * cinza)},${Math.round(194 - 100 * cinza)},${Math.round(122 - 20 * cinza)},${0.95 - 0.3 * cinza})`,
						transform: `translateX(${tremor}px)`,
						opacity: interpolate(frame, [muda, muda + 6], [0, 1], lim),
					}}
				>
					<div style={{fontFamily: poppins, fontWeight: 900, fontSize: 36, color: defasou ? '#d6d6dc' : ROXO, letterSpacing: '0.1em'}}>VOCÊ: VERSÃO ANTIGA</div>
				</div>
			</Placa>
			{/* carimbo */}
			<div
				style={{
					position: 'absolute',
					top: 320,
					width: '100%',
					textAlign: 'center',
					opacity: defasou ? Math.min(1, carimbo * 1.3) : 0,
					transform: `rotate(-8deg) scale(${2.2 - 1.2 * carimbo})`,
				}}
			>
				<span style={{display: 'inline-block', padding: '8px 34px', border: '7px solid #e5484d', borderRadius: 16, color: '#ff6b6f', background: 'rgba(30,15,58,0.85)', fontFamily: poppins, fontWeight: 900, fontSize: 76, letterSpacing: '0.08em', textShadow: '3px 0 rgba(0,255,255,0.35), -3px 0 rgba(255,0,60,0.5)'}}>DEFASADO</span>
			</div>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 5. escada: sem a base × completa para qualquer nível
// Mentoria vaga = escada que começa no alto, com os degraus de baixo faltando (pontilhados) e você no chão com "?".
// No "base" os degraus que faltam piscam em vermelho: SEM BASE. Com `completa`, a escada inteira acende em ouro, degrau a
// degrau, com uma pessoa em cada nível: QUALQUER NÍVEL.
// dados: {completa?, emEscada, emPerdido, emBase, emNivel}
const d43Escada: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, op} = useCena(cena);
	const d = D(cena);
	const completa = Boolean(d.completa);
	const esc = q(d.emEscada ?? cena.de);
	const perd = q(d.emPerdido);
	const base = q(d.emBase);
	const nivel = q(d.emNivel);
	const p = mola(frame, fps, 0, 170);
	const N = 5;
	const w = 150;
	const h = 62;
	const x0 = 160;
	const yChao = 560;
	const faltam = completa ? 0 : 2;
	const pisca = frame >= base ? 0.55 + 0.45 * Math.sin((frame - base) / 2.2) : 0;
	const pBase = mola(frame, fps, base, 220);
	const pNivel = mola(frame, fps, nivel, 200);
	const pPerd = mola(frame, fps, perd, 200);
	return (
		<AbsoluteFill style={{opacity: op}}>
			<Placa top={190} altura={420} p={p} borda={completa && frame >= nivel ? OURO : undefined}>{null}</Placa>
			<svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
				<line x1={130} y1={yChao} x2={950} y2={yChao} stroke="rgba(255,255,255,0.3)" strokeWidth={4} opacity={p} />
				{Array.from({length: N}).map((_, i) => {
					const x = x0 + i * w;
					const y = yChao - (i + 1) * h;
					const falta = i < faltam;
					const entra = completa ? mola(frame, fps, esc + i * 3, 220) : mola(frame, fps, esc + (N - i) * 2, 200);
					const aceso = completa && frame >= esc + i * 3;
					return (
						<g key={i} opacity={entra}>
							<rect
								x={x}
								y={y}
								width={w}
								height={(i + 1) * h}
								fill={falta ? 'none' : aceso ? OURO : 'rgba(155,120,220,0.85)'}
								stroke={falta ? (frame >= base ? `rgba(255,90,95,${pisca})` : 'rgba(255,255,255,0.4)') : 'rgba(255,255,255,0.15)'}
								strokeWidth={falta ? 5 : 2}
								strokeDasharray={falta ? '14 12' : undefined}
								rx={6}
							/>
							{completa ? (
								<g opacity={pNivel} transform={`translate(${x + w / 2}, ${y - 8 - 6 * Math.sin((frame + i * 5) / 6)})`}>
									<circle cx={0} cy={-46} r={15} fill="#fff" />
									<path d="M -22 0 Q -22 -30 0 -30 Q 22 -30 22 0 Z" fill="#fff" />
								</g>
							) : null}
						</g>
					);
				})}
				{!completa ? (
					<g opacity={pPerd} transform={`translate(${x0 + 40}, ${yChao})`}>
						<circle cx={0} cy={-56} r={17} fill="#fff" />
						<path d="M -25 0 Q -25 -36 0 -36 Q 25 -36 25 0 Z" fill="#fff" />
						<text x={44} y={-70 - 8 * Math.abs(Math.sin(frame / 5))} fontFamily={poppins} fontWeight={900} fontSize={60} fill={OURO}>
							?
						</text>
					</g>
				) : null}
				{!completa ? (
					<text x={x0 + w * N - 10} y={yChao - N * h - 26} textAnchor="end" fontFamily={poppins} fontWeight={800} fontSize={28} letterSpacing={3} fill="rgba(233,230,242,0.8)" opacity={mola(frame, fps, esc + 4, 200)}>
						MENTORIA PARA QUEM JÁ SABE
					</text>
				) : null}
			</svg>
			{!completa ? (
				<div style={{position: 'absolute', left: x0 - 30, top: yChao - 170, width: 2 * w + 60, textAlign: 'center', opacity: frame >= base ? pBase : 0, transform: `scale(${1.6 - 0.6 * pBase}) rotate(-6deg)`}}>
					<span style={{display: 'inline-block', padding: '6px 22px', borderRadius: 14, background: '#e5484d', color: '#fff', fontFamily: poppins, fontWeight: 900, fontSize: 40, letterSpacing: '0.06em'}}>SEM BASE</span>
				</div>
			) : (
				<div style={{position: 'absolute', top: 222, width: '100%', textAlign: 'center', opacity: pNivel, transform: `translateY(${(1 - pNivel) * 16}px)`}}>
					<span style={{fontFamily: playfair, fontStyle: 'italic', fontWeight: 800, fontSize: 64, color: OURO}}>qualquer nível</span>
				</div>
			)}
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 6. muito mais do que o prometido: velocímetro
// Mostrador em arco com a marca PROMETIDO; o ponteiro vai até ela no "entregue" e, no "muito mais", passa direto para o fim
// da escala em ouro (com tremor no batente) e acende ENTREGUE: MUITO MAIS.
// dados: {emEntregue, emMais}
const d43Velocimetro: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, op} = useCena(cena);
	const d = D(cena);
	const ent = q(d.emEntregue);
	const mais = q(d.emMais);
	const p = mola(frame, fps, 0, 170);
	const MARCA = 0.55;
	const ate = interpolate(frame, [ent, Math.max(ent + 6, mais - 2)], [0, MARCA], {...lim, easing: Easing.out(Easing.cubic)});
	const passa = mola(frame, fps, mais, 120);
	const v = frame < mais ? ate : MARCA + (1.04 - MARCA) * passa;
	const cx = 540;
	const cy = 560;
	const r = 300;
	const ang = (f: number) => Math.PI + Math.PI * f; // 0 → esquerda, 1 → direita
	const pt = (f: number, rr: number) => [cx + rr * Math.cos(ang(f)), cy + rr * Math.sin(ang(f))];
	const arco = (a: number, b: number, rr: number) => {
		const [x1, y1] = pt(a, rr);
		const [x2, y2] = pt(b, rr);
		return `M ${x1} ${y1} A ${rr} ${rr} 0 0 1 ${x2} ${y2}`;
	};
	const [px, py] = pt(Math.min(1.04, v), r - 40);
	const [mx1, my1] = pt(MARCA, r - 60);
	const [mx2, my2] = pt(MARCA, r + 24);
	const [lx, ly] = pt(MARCA, r + 62);
	const pMais = frame >= mais ? passa : 0;
	const batente = frame >= mais + 6 && frame < mais + 14 ? Math.sin(frame * 3) * 4 : 0;
	return (
		<AbsoluteFill style={{opacity: op}}>
			<Placa top={190} altura={430} p={p} borda={frame >= mais ? OURO : undefined}>{null}</Placa>
			<svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, transform: `translateX(${batente}px)`}}>
				<path d={arco(0, 1, r)} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={34} strokeLinecap="round" opacity={p} />
				<path d={arco(0, Math.min(MARCA, v), r)} fill="none" stroke={PRATA} strokeWidth={34} strokeLinecap="round" opacity={v > 0.01 ? 1 : 0} />
				{v > MARCA ? <path d={arco(MARCA, Math.min(1, v), r)} fill="none" stroke={OURO} strokeWidth={34} strokeLinecap="round" style={{filter: 'drop-shadow(0 0 14px rgba(232,194,122,0.8))'}} /> : null}
				<line x1={mx1} y1={my1} x2={mx2} y2={my2} stroke="#fff" strokeWidth={6} opacity={p} />
				<text x={lx} y={ly} textAnchor="middle" fontFamily={poppins} fontWeight={800} fontSize={26} letterSpacing={3} fill="#fff" opacity={p}>
					PROMETIDO
				</text>
				<line x1={cx} y1={cy} x2={px} y2={py} stroke={frame >= mais ? OURO : '#fff'} strokeWidth={12} strokeLinecap="round" opacity={p} />
				<circle cx={cx} cy={cy} r={24} fill={frame >= mais ? OURO : '#fff'} opacity={p} />
			</svg>
			<div style={{position: 'absolute', top: 400, width: '100%', textAlign: 'center', opacity: pMais, transform: `scale(${0.7 + 0.3 * pMais})`}}>
				<div style={{fontFamily: poppins, fontWeight: 800, fontSize: 28, letterSpacing: '0.24em', color: '#e9e6f2'}}>ENTREGUE</div>
				<div style={{fontFamily: playfair, fontStyle: 'italic', fontWeight: 800, fontSize: 72, color: OURO, lineHeight: 1}}>muito mais</div>
			</div>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 7. abraçada: a turma inteira dentro de um abraço
// Sete pessoas de tamanhos diferentes (níveis diferentes); no "abraçada" dois braços de luz dourada saem dos lados e se fecham
// em volta de todas, e a palavra entra em serifa.
// dados: {emPessoas, emAbraco}
const d43Abraco: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, op} = useCena(cena);
	const d = D(cena);
	const pess = q(d.emPessoas ?? cena.de);
	const abr = q(d.emAbraco);
	const p = mola(frame, fps, 0, 170);
	const fecha = interpolate(frame, [abr, abr + 12], [0, 1], {...lim, easing: Easing.out(Easing.cubic)});
	const pTexto = mola(frame, fps, abr + 4, 200);
	const alturas = [0.8, 1, 0.7, 1.15, 0.85, 1.05, 0.75];
	const cx = 540;
	const cy = 440;
	const rx = 400;
	const ry = 150;
	// arco elíptico de cada lado, crescendo do lado de baixo até o topo
	const meiaElipse = (lado: 1 | -1) => {
		const pts: string[] = [];
		const n = 40;
		for (let i = 0; i <= n * fecha; i++) {
			const t = Math.PI / 2 + (lado * Math.PI * i) / n; // começa embaixo
			pts.push(`${cx + rx * Math.cos(t)},${cy + ry * Math.sin(t)}`);
		}
		return pts.length > 1 ? `M ${pts.join(' L ')}` : '';
	};
	return (
		<AbsoluteFill style={{opacity: op}}>
			<Placa top={190} altura={430} p={p} borda={frame >= abr + 10 ? OURO : undefined}>{null}</Placa>
			<svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
				{alturas.map((a, i) => {
					const x = cx + (i - 3) * 100;
					const e = mola(frame, fps, pess + i * 2, 200);
					const y = cy + 70;
					return (
						<g key={i} opacity={e} transform={`translate(${x}, ${y + (1 - e) * 40}) scale(${a})`}>
							<circle cx={0} cy={-88} r={24} fill={frame >= abr + 8 ? '#fff6dc' : '#e9e6f2'} />
							<path d="M -38 0 Q -38 -56 0 -56 Q 38 -56 38 0 Z" fill={frame >= abr + 8 ? '#fff6dc' : '#e9e6f2'} />
						</g>
					);
				})}
				<path d={meiaElipse(1)} fill="none" stroke={OURO} strokeWidth={14} strokeLinecap="round" style={{filter: 'drop-shadow(0 0 12px rgba(232,194,122,0.85))'}} />
				<path d={meiaElipse(-1)} fill="none" stroke={OURO} strokeWidth={14} strokeLinecap="round" style={{filter: 'drop-shadow(0 0 12px rgba(232,194,122,0.85))'}} />
			</svg>
			<div style={{position: 'absolute', top: 222, width: '100%', textAlign: 'center', opacity: frame >= abr ? pTexto : 0, transform: `translateY(${(1 - pTexto) * 16}px)`}}>
				<span style={{fontFamily: playfair, fontStyle: 'italic', fontWeight: 800, fontSize: 70, color: OURO}}>abraçada</span>
			</div>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 8. suporte: grupo só seu + chamar no privado
// Placa de chat: no "suporte" acende SUPORTE; no "grupo" abre o GRUPO SÓ SEU com mensagens dos mentores chegando; no
// "privado" troca para a conversa privada (cadeado) com resposta na hora.
// dados: {emSuporte, emGrupo, emMsg, emPrivado, emResposta}
const Bolha: React.FC<{nome: string; texto: string; p: number; direita?: boolean}> = ({nome, texto, p, direita}) => (
	<div style={{alignSelf: direita ? 'flex-end' : 'flex-start', maxWidth: 640, opacity: p, transform: `translateY(${(1 - p) * 24}px) scale(${0.9 + 0.1 * p})`, transformOrigin: direita ? 'right bottom' : 'left bottom'}}>
		{nome ? <div style={{fontFamily: poppins, fontWeight: 800, fontSize: 22, color: OURO, margin: '0 0 4px 18px'}}>{nome}</div> : null}
		<div style={{padding: '14px 24px', borderRadius: 26, background: direita ? OURO : 'rgba(233,230,242,0.14)', color: direita ? ROXO : '#fff', fontFamily: poppins, fontWeight: 700, fontSize: 32}}>{texto}</div>
	</div>
);
const d43Chat: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, op} = useCena(cena);
	const d = D(cena);
	const sup = q(d.emSuporte);
	const grupo = q(d.emGrupo);
	const msg = q(d.emMsg);
	const priv = q(d.emPrivado);
	const resp = q(d.emResposta);
	const p = mola(frame, fps, 0, 170);
	const noPriv = frame >= priv;
	const troca = mola(frame, fps, priv, 200);
	const pSup = mola(frame, fps, sup, 220);
	const pGrupo = mola(frame, fps, grupo, 200);
	return (
		<AbsoluteFill style={{opacity: op}}>
			<Placa top={190} altura={430} p={p} borda={noPriv ? OURO : undefined}>
				{/* cabeçalho */}
				<div style={{position: 'absolute', left: 36, right: 36, top: 26, height: 70, display: 'flex', alignItems: 'center', gap: 18}}>
					<div style={{padding: '6px 20px', borderRadius: 24, background: OURO, color: ROXO, fontFamily: poppins, fontWeight: 900, fontSize: 28, letterSpacing: '0.12em', opacity: pSup, transform: `scale(${0.7 + 0.3 * pSup})`}}>SUPORTE</div>
					<div style={{fontFamily: poppins, fontWeight: 800, fontSize: 32, color: '#fff', opacity: frame >= grupo ? pGrupo : 0}}>
						{noPriv ? 'PRIVADO · MATHEUS' : 'GRUPO SÓ SEU · 4 membros'}
					</div>
				</div>
				<div style={{position: 'absolute', left: 36, right: 36, top: 100, height: 2, background: 'rgba(255,255,255,0.15)', opacity: pGrupo}} />
				{/* conversa do grupo */}
				<div style={{position: 'absolute', left: 36, right: 36, top: 120, display: 'flex', flexDirection: 'column', gap: 14, opacity: 1 - troca, transform: `translateX(${-troca * 120}px)`}}>
					<Bolha nome="Danilow" texto="Vi sua live de ontem!" p={frame >= grupo + 4 ? mola(frame, fps, grupo + 4, 220) : 0} />
					<Bolha nome="Felipe" texto="Bora ajustar o roteiro?" p={frame >= msg ? mola(frame, fps, msg, 220) : 0} />
				</div>
				{/* conversa privada */}
				<div style={{position: 'absolute', left: 36, right: 36, top: 120, display: 'flex', flexDirection: 'column', gap: 14, opacity: noPriv ? troca : 0, transform: `translateX(${(1 - troca) * 120}px)`}}>
					<Bolha nome="" texto="Matheus, posso te chamar?" p={noPriv ? mola(frame, fps, priv + 2, 220) : 0} direita />
					<Bolha nome="Matheus" texto="Claro! Manda aí" p={frame >= resp ? mola(frame, fps, resp, 220) : 0} />
				</div>
			</Placa>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 9. destravei: cadeado abrindo
// Cadeado dourado grande; no "destravei" a haste salta e gira (abre) com clarão; no "monte de coisa" saem voando os
// cartões do que destravou.
// dados: {emAbre, emCoisas}
const COISAS = ['ROTEIRO', 'OFERTA', 'ROTINA', 'ESCALA'];
const d43Cadeado: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, op} = useCena(cena);
	const d = D(cena);
	const abre = q(d.emAbre);
	const coisas = q(d.emCoisas);
	const p = mola(frame, fps, 0, 170);
	const a = mola(frame, fps, abre, 180);
	const aberto = frame >= abre;
	const clarao = interpolate(frame, [abre, abre + 3, abre + 12], [0, 0.8, 0], lim);
	const treme = !aberto ? Math.sin(frame * 2.2) * 3 : 0;
	const cx = 540;
	const cy = 420;
	return (
		<AbsoluteFill style={{opacity: op}}>
			<Placa top={190} altura={430} p={p} borda={aberto ? OURO : undefined}>{null}</Placa>
			<svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
				<defs>
					<radialGradient id="d43luz">
						<stop offset="0%" stopColor="rgba(255,246,220,1)" />
						<stop offset="100%" stopColor="rgba(232,194,122,0)" />
					</radialGradient>
					<linearGradient id="d43ouro" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="#f6dca2" />
						<stop offset="55%" stopColor={OURO} />
						<stop offset="100%" stopColor="#a8823e" />
					</linearGradient>
				</defs>
				<circle cx={cx} cy={cy} r={260} fill="url(#d43luz)" opacity={clarao} />
				<g transform={`translate(${cx + treme}, ${cy}) scale(${0.85 + 0.15 * p})`} opacity={p}>
					{/* haste: sobe e gira em torno da perna direita */}
					<g transform={`translate(${45}, ${-40 - 60 * a}) rotate(${-38 * a}) translate(${-45}, ${40})`}>
						<path d="M -45 -40 L -45 -95 A 45 45 0 0 1 45 -95 L 45 -40" fill="none" stroke={PRATA} strokeWidth={26} strokeLinecap="round" />
					</g>
					<rect x={-110} y={-50} width={220} height={190} rx={34} fill="url(#d43ouro)" />
					<circle cx={0} cy={30} r={22} fill={ROXO} />
					<rect x={-8} y={36} width={16} height={50} rx={6} fill={ROXO} />
				</g>
			</svg>
			{COISAS.map((t, i) => {
				const e = mola(frame, fps, coisas + i * 3, 160);
				const lado = i % 2 === 0 ? -1 : 1;
				const x = cx + lado * (140 + 120 * (i > 1 ? 1 : 0)) * e;
				const y = cy - 40 - (i > 1 ? 70 : -60) * e;
				return (
					<div key={t} style={{position: 'absolute', left: x - 110, top: y - 30, width: 220, textAlign: 'center', opacity: frame >= coisas + i * 3 ? Math.min(1, e * 1.4) : 0, transform: `scale(${0.4 + 0.6 * e}) rotate(${lado * 6 * e}deg)`}}>
						<span style={{display: 'inline-block', padding: '8px 20px', borderRadius: 18, background: 'rgba(30,15,58,0.95)', border: `3px solid ${OURO}`, color: '#fff', fontFamily: poppins, fontWeight: 900, fontSize: 28, letterSpacing: '0.06em'}}>{t}</span>
					</div>
				);
			})}
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 10. 1º de outubro: o melhor dia
// Folha de calendário de OUTUBRO; no "1º" o dia 1 ganha círculo dourado desenhado à mão e salta; no "melhor dia" entra o selo
// MELHOR DIA com +30 MIL de GMV.
// dados: {emDia, emMelhor}
const d43Calendario: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, op} = useCena(cena);
	const d = D(cena);
	const dia = q(d.emDia);
	const melhor = q(d.emMelhor);
	const p = mola(frame, fps, 0, 160);
	const circ = interpolate(frame, [dia, dia + 10], [0, 1], {...lim, easing: Easing.out(Easing.cubic)});
	const salta = mola(frame, fps, dia, 260);
	const pSelo = mola(frame, fps, melhor, 200);
	const cel = 92;
	const gx = 540 - (cel * 7) / 2;
	const gy = 330;
	// outubro de 2026 começa numa quinta-feira (índice 4, domingo = 0)
	const ini = 4;
	return (
		<AbsoluteFill style={{opacity: op}}>
			<div style={{position: 'absolute', left: 170, right: 170, top: 190, height: 440, borderRadius: 30, background: '#f6eee0', boxShadow: '0 30px 70px rgba(8,3,20,0.6)', overflow: 'hidden', transform: `perspective(1400px) rotateX(${(1 - p) * 70}deg)`, transformOrigin: 'top center', opacity: Math.min(1, p * 1.5)}}>
				<div style={{height: 96, background: ROXO, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: poppins, fontWeight: 900, fontSize: 46, letterSpacing: '0.2em'}}>OUTUBRO</div>
			</div>
			<svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, opacity: p > 0.6 ? 1 : 0}}>
				{['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((l, i) => (
					<text key={i} x={gx + cel * i + cel / 2} y={gy + 22} textAnchor="middle" fontFamily={poppins} fontWeight={800} fontSize={24} fill="#8a7ca8">
						{l}
					</text>
				))}
				{Array.from({length: 17}).map((_, k) => {
					const n = k + 1;
					const pos = ini + k;
					const col = pos % 7;
					const lin = Math.floor(pos / 7);
					const x = gx + cel * col + cel / 2;
					const y = gy + 76 + lin * 66;
					const um = n === 1;
					return (
						<g key={n} transform={um ? `translate(${x}, ${y - 12}) scale(${1 + 0.35 * salta}) translate(${-x}, ${-(y - 12)})` : undefined}>
							<text x={x} y={y} textAnchor="middle" fontFamily={poppins} fontWeight={um ? 900 : 600} fontSize={um ? 40 : 32} fill={um ? ROXO : '#4b3d66'} opacity={um ? 1 : 0.55}>
								{n}
							</text>
							{um ? (
								<path
									d={`M ${x + 34} ${y - 30} C ${x + 40} ${y + 20}, ${x - 40} ${y + 26}, ${x - 38} ${y - 14} C ${x - 36} ${y - 52}, ${x + 30} ${y - 58}, ${x + 40} ${y - 22}`}
									fill="none"
									stroke="#c99a2e"
									strokeWidth={7}
									strokeLinecap="round"
									pathLength={1}
									strokeDasharray={1}
									strokeDashoffset={1 - circ}
								/>
							) : null}
						</g>
					);
				})}
			</svg>
			<div style={{position: 'absolute', top: 560, width: '100%', textAlign: 'center', opacity: frame >= melhor ? pSelo : 0, transform: `scale(${1.5 - 0.5 * pSelo}) rotate(-4deg)`}}>
				<span style={{display: 'inline-block', padding: '10px 30px', borderRadius: 20, background: ROXO, border: `4px solid ${OURO}`, color: OURO, fontFamily: poppins, fontWeight: 900, fontSize: 46, letterSpacing: '0.06em', boxShadow: '0 0 40px rgba(232,194,122,0.5)'}}>
					MELHOR DIA · +30 MIL
				</span>
			</div>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 11. grupo leve × gente se exibindo
// Dois lados: AQUI (balões de conversa dourados subindo, leves) e o "outro tipo de grupo" (peso de ferro PESADO caindo e dois
// pódios brigando para ser mais alto). No "pesado" o peso cai; no "mais que o outro" os pódios crescem um contra o outro e
// tudo daquele lado leva um X.
// dados: {emLeve, emPesado, emDisputa, emX}
const d43Leve: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, op} = useCena(cena);
	const d = D(cena);
	const leve = q(d.emLeve);
	const pesado = q(d.emPesado);
	const disputa = q(d.emDisputa);
	const x = q(d.emX);
	const p = mola(frame, fps, 0, 170);
	const pDir = mola(frame, fps, pesado - 4, 180);
	const cai = interpolate(frame, [pesado, pesado + 7], [0, 1], {...lim, easing: Easing.in(Easing.quad)});
	const bate = frame >= pesado + 7 && frame < pesado + 14 ? Math.sin(frame * 3) * 6 : 0;
	const dA = interpolate(frame, [disputa, disputa + 8, disputa + 14, disputa + 22], [0, 1, 0.7, 1.25], lim);
	const dB = interpolate(frame, [disputa + 3, disputa + 11, disputa + 18, disputa + 26], [0, 0.8, 1.2, 0.9], lim);
	const pX = mola(frame, fps, x, 240);
	const xEsq = 300;
	const xDir = 780;
	return (
		<AbsoluteFill style={{opacity: op}}>
			<Placa top={190} altura={430} p={p}>{null}</Placa>
			<div style={{position: 'absolute', left: 120, top: 220, width: 360, textAlign: 'center', fontFamily: poppins, fontWeight: 900, fontSize: 32, letterSpacing: '0.16em', color: OURO, opacity: p}}>NESTE GRUPO</div>
			<div style={{position: 'absolute', left: 600, top: 220, width: 360, textAlign: 'center', fontFamily: poppins, fontWeight: 900, fontSize: 32, letterSpacing: '0.16em', color: 'rgba(233,230,242,0.7)', opacity: pDir}}>EM OUTROS</div>
			<div style={{position: 'absolute', left: 540, top: 270, width: 3, height: 320, background: 'rgba(255,255,255,0.2)', opacity: pDir}} />
			<svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
				{/* balões leves subindo */}
				{Array.from({length: 5}).map((_, i) => {
					const t0 = leve + i * 5 - 6;
					const vida = Math.max(0, frame - t0);
					const y = 600 - ((vida * 5) % 320);
					const xx = xEsq + Math.sin((frame + i * 20) / 10) * 30 + (i - 2) * 50;
					const a = frame >= t0 ? interpolate(y, [280, 330, 560, 600], [0, 1, 1, 0], lim) : 0;
					return (
						<g key={i} opacity={a} transform={`translate(${xx}, ${y})`}>
							<rect x={-46} y={-30} width={92} height={56} rx={24} fill={i % 2 ? OURO : '#fff6dc'} />
							<path d="M -18 24 L -26 42 L -4 26 Z" fill={i % 2 ? OURO : '#fff6dc'} />
							<circle cx={-18} cy={-2} r={6} fill={ROXO} />
							<circle cx={0} cy={-2} r={6} fill={ROXO} />
							<circle cx={18} cy={-2} r={6} fill={ROXO} />
						</g>
					);
				})}
				{/* peso pesado */}
				<g opacity={frame >= pesado - 2 ? 1 : 0} transform={`translate(${xDir + bate}, ${interpolate(cai, [0, 1], [180, 470])})`}>
					<path d="M -90 60 L -64 -30 L 64 -30 L 90 60 Z" fill="#5d5f6e" />
					<path d="M -30 -30 A 30 30 0 0 1 30 -30" fill="none" stroke="#5d5f6e" strokeWidth={14} />
					<text x={0} y={36} textAnchor="middle" fontFamily={poppins} fontWeight={900} fontSize={30} fill="#e9e6f2">
						PESADO
					</text>
				</g>
				{/* pódios disputando */}
				<rect x={xDir - 150} y={560 - 130 * dA} width={70} height={130 * dA} rx={8} fill="rgba(201,204,216,0.7)" />
				<rect x={xDir + 80} y={560 - 130 * dB} width={70} height={130 * dB} rx={8} fill="rgba(201,204,216,0.7)" />
				{/* X */}
				<g opacity={frame >= x ? pX : 0} transform={`translate(${xDir}, 420) scale(${1.6 - 0.6 * pX})`}>
					<path d="M -120 -120 L 120 120 M 120 -120 L -120 120" stroke="#e5484d" strokeWidth={24} strokeLinecap="round" />
				</g>
			</svg>
			<div style={{position: 'absolute', left: 120, top: 280, width: 360, textAlign: 'center', fontFamily: playfair, fontStyle: 'italic', fontWeight: 800, fontSize: 58, color: '#fff', opacity: mola(frame, fps, leve, 200)}}>leve</div>
		</AbsoluteFill>
	);
};

export const pecas: Pecas = {d43Gmv, d43Linha, d43LiveGravada, d43Mudando, d43Escada, d43Velocimetro, d43Abraco, d43Chat, d43Cadeado, d43Calendario, d43Leve};
