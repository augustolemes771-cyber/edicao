// Peças (efeitos) exclusivas do depoimento-3-4, usadas no edit.ts com {tipo: 'peca', nome: 'd34...', dados: {...}}.
// Todas de tela inteira (modo 'cheia'): fundo roxo do tema com a grade reta (FundoMotion), objetos em ouro/roxo, um texto por vez.
// dados: tempos em segundos do vídeo editado (a cena começa em cena.de). Câmera 3D: fov 35 a 14,5 de distância.
import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import type {CenaPeca, Pecas} from '../../pecas/peca';
import {FundoMotion} from '../../pecas/FundoMotion';
import {Linha3D, Luzes} from '../../pecas/tres/Texto3D';
import {poppins} from '../../motor/tema';

const lim = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const OURO = '#E8C27A';
const ROXO = '#2a1552';
const GL = {alpha: true, antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05};
const CAMERA = {fov: 35, position: [0, 0, 14.5] as [number, number, number], near: 0.1, far: 60};
// px do quadro 1080x1920 → y do mundo 3D.
const yMundo = (px: number) => ((960 - px) / 960) * 14.5 * Math.tan((35 / 2) * (Math.PI / 180));

const useCena = (cena: CenaPeca) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const fim = Math.round((cena.ate - cena.de) * fps);
	const q = (s: unknown) => Math.round(Math.max(0, Number(s) - cena.de) * fps);
	const entrada = interpolate(frame, [0, 6], [0, 1], lim);
	const saida = interpolate(frame, [fim - 6, fim], [1, 0], lim);
	const mola = (de: number, rigidez = 160) => spring({frame: frame - de, fps, config: {damping: 13, stiffness: rigidez}});
	return {frame, fps, width, height, fim, q, entrada, saida, mola, t: frame / fps, d: (cena.dados ?? {}) as Record<string, unknown>};
};

const useMats = () =>
	useMemo(
		() => ({
			ouro: new THREE.MeshStandardMaterial({color: OURO, metalness: 1, roughness: 0.22}),
			ouroBrilho: new THREE.MeshStandardMaterial({color: '#ffe3a3', metalness: 0.9, roughness: 0.18, emissive: '#c99a3e', emissiveIntensity: 0.7}),
			roxo: new THREE.MeshPhysicalMaterial({color: ROXO, metalness: 0.3, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.15}),
			roxoClaro: new THREE.MeshPhysicalMaterial({color: '#5b34a8', metalness: 0.35, roughness: 0.3, clearcoat: 1}),
			prata: new THREE.MeshStandardMaterial({color: '#d6d8e2', metalness: 1, roughness: 0.22}),
			pedra: new THREE.MeshStandardMaterial({color: '#3a2b55', metalness: 0.1, roughness: 0.85, flatShading: true}),
			madeira: new THREE.MeshStandardMaterial({color: '#8a5a32', metalness: 0.05, roughness: 0.7}),
			preto: new THREE.MeshStandardMaterial({color: '#120a22', metalness: 0.4, roughness: 0.3}),
		}),
		[],
	);

// Rótulo pequeno (kicker) em ouro, espaçado.
const Kicker: React.FC<{texto: string; y: number; p: number}> = ({texto, y, p}) => (
	<div style={{position: 'absolute', top: y, width: '100%', textAlign: 'center', opacity: p, transform: `translateY(${(1 - p) * 14}px)`}}>
		<span style={{fontFamily: poppins, fontWeight: 800, fontSize: 40, letterSpacing: '0.3em', marginRight: '-0.3em', color: OURO}}>{texto}</span>
	</div>
);

// Título em sans pesada branca com a palavra de destaque em serifa itálica dourada.
const Titulo: React.FC<{texto: string; destaque?: string; y: number; p: number; tam?: number}> = ({texto, destaque, y, p, tam = 92}) => (
	<div style={{position: 'absolute', top: y, width: '100%', textAlign: 'center', opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - p) * 30}px) scale(${0.85 + 0.15 * p})`}}>
		<span style={{fontFamily: poppins, fontWeight: 900, fontSize: tam, color: '#fff', textShadow: '0 8px 30px rgba(8,3,20,0.7)'}}>{texto}</span>
		{destaque ? (
			<span style={{fontFamily: 'Playfair Display, Georgia, serif', fontStyle: 'italic', fontWeight: 800, fontSize: tam * 1.05, color: OURO, marginLeft: 22, textShadow: '0 0 28px rgba(232,194,122,0.45)'}}>{destaque}</span>
		) : null}
	</div>
);

const Canvas: React.FC<{children: React.ReactNode; width: number; height: number}> = ({children, width, height}) => (
	<AbsoluteFill style={{filter: 'drop-shadow(0 22px 30px rgba(12,4,28,0.6))'}}>
		<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
			{children}
		</ThreeCanvas>
	</AbsoluteFill>
);

// Card de perfil (estilo app): avatar, @, seguidores/vendas. `seguidores` é o texto do número.
const CardPerfil: React.FC<{seguidores: string; vendas: string; cor?: string; selo?: React.ReactNode; tremor?: number}> = ({seguidores, vendas, cor = '#fff', selo, tremor = 0}) => (
	<div style={{position: 'relative', width: 760, padding: '46px 40px 50px', borderRadius: 44, background: 'linear-gradient(180deg, rgba(58,32,108,0.92), rgba(30,15,58,0.94))', boxShadow: `inset 0 0 0 3px rgba(232,194,122,0.55), 0 30px 80px rgba(5,2,15,0.6)`, transform: `translateX(${tremor}px)`}}>
		<div style={{display: 'flex', alignItems: 'center', gap: 30}}>
			<div style={{width: 150, height: 150, borderRadius: 75, background: 'radial-gradient(circle at 50% 38%, #d9c9f2 0 26%, transparent 27%), radial-gradient(ellipse at 50% 100%, #d9c9f2 0 42%, transparent 43%), #5b34a8', boxShadow: `0 0 0 5px ${OURO}`}} />
			<div style={{fontFamily: poppins, color: '#fff'}}>
				<div style={{fontWeight: 800, fontSize: 48}}>@minhaloja</div>
				<div style={{fontWeight: 600, fontSize: 30, opacity: 0.6}}>TikTok Shop</div>
			</div>
		</div>
		<div style={{display: 'flex', justifyContent: 'space-around', marginTop: 44, fontFamily: poppins, color: '#fff', textAlign: 'center'}}>
			<div>
				<div style={{fontWeight: 900, fontSize: 92, color: cor, lineHeight: 1}}>{seguidores}</div>
				<div style={{fontWeight: 600, fontSize: 30, opacity: 0.65}}>seguidores</div>
			</div>
			<div>
				<div style={{fontWeight: 900, fontSize: 92, color: cor, lineHeight: 1}}>{vendas}</div>
				<div style={{fontWeight: 600, fontSize: 30, opacity: 0.65}}>vendas</div>
			</div>
		</div>
		{selo}
	</div>
);

// ---------------------------------------------------------------- 1. gancho: FLOPADO riscado → 100% PRODUTO
// dados: {flopado, risco, cem, produto}
const d34Flopado: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fim, q, entrada, saida, mola, width, height, d} = useCena(cena);
	const selo = q(d.flopado);
	const risco = q(d.risco);
	const cem = q(d.cem);
	const produto = q(d.produto);
	const pCard = mola(0, 190);
	const pSelo = mola(selo, 260);
	const risca = interpolate(frame, [risco, risco + 5], [0, 1], lim);
	const sai = interpolate(frame, [cem - 6, cem], [0, 1], lim);
	const tremor = frame >= risco && frame < risco + 8 ? Math.sin(frame * 3) * 14 * (1 - (frame - risco) / 8) : 0;
	return (
		<AbsoluteFill style={{opacity: saida}}>
			<AbsoluteFill style={{opacity: entrada}}>
				<FundoMotion />
			</AbsoluteFill>
			{sai < 1 ? (
				<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: 1 - sai, transform: `translateY(${-sai * 120}px) scale(${(0.7 + 0.3 * pCard) * (1 - 0.2 * sai)})`}}>
					<CardPerfil
						seguidores="0"
						vendas="0"
						cor="#bdb6cc"
						tremor={tremor}
						selo={
							frame >= selo ? (
								<div style={{position: 'absolute', left: '50%', top: '50%', transform: `translate(-50%,-50%) rotate(-12deg) scale(${1.5 - 0.5 * pSelo})`, opacity: Math.min(1, pSelo * 2)}}>
									<div style={{position: 'relative', padding: '10px 40px', border: '10px solid #e9e6f2', borderRadius: 22, fontFamily: poppins, fontWeight: 900, fontSize: 128, color: '#e9e6f2', letterSpacing: '0.06em', background: 'rgba(30,15,58,0.82)'}}>
										FLOPADO
										<div style={{position: 'absolute', left: -30, top: '50%', height: 20, width: `${risca * 112}%`, background: `linear-gradient(90deg, #fff1c9, ${OURO})`, borderRadius: 10, transform: 'rotate(-8deg)', boxShadow: '0 0 30px rgba(232,194,122,0.8)'}} />
									</div>
								</div>
							) : null
						}
					/>
				</AbsoluteFill>
			) : null}
			{frame >= cem ? (
				<Canvas width={width} height={height}>
					<Luzes quadro={frame} batidas={[cem, produto]} />
					<pointLight position={[0, yMundo(820), -3]} intensity={30} distance={9} color="#ffcf7a" />
					<Linha3D texto="100%" metal="ouro" largura={4.2} y={yMundo(820)} quadro={frame} batida={cem} profundidade={0.6} ate={fim - 8} />
					{frame >= produto ? <Linha3D texto="PRODUTO" metal="branco" largura={4.4} y={yMundo(1150)} quadro={frame} batida={produto} profundidade={0.4} intervalo={1} ate={fim - 8} /> : null}
				</Canvas>
			) : null}
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 2. mineração: a picareta bate na pedra, que racha e revela o produto brilhando
const Picareta: React.FC<{m: ReturnType<typeof useMats>}> = ({m}) => (
	<group>
		<mesh material={m.madeira} position={[0, -1.1, 0]}>
			<cylinderGeometry args={[0.09, 0.11, 2.6, 16]} />
		</mesh>
		<mesh material={m.prata} rotation={[0, 0, Math.PI / 2]}>
			<torusGeometry args={[1.05, 0.13, 12, 40, Math.PI * 0.9]} />
		</mesh>
	</group>
);

// dados: {golpes: [s, s], acha}
const d34Mineracao: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fim, q, entrada, saida, mola, width, height, t, d} = useCena(cena);
	const m = useMats();
	const golpes = ((d.golpes as number[]) ?? []).map(q);
	const acha = q(d.acha);
	// Picareta: sobe e desce batendo em cada golpe.
	let ang = 0.9;
	for (const g of golpes) {
		const l = frame - g;
		if (l > -7 && l <= 0) ang = interpolate(l, [-7, -3, 0], [0.9, 1.5, -0.35]);
		else if (l > 0 && l < 8) ang = interpolate(l, [0, 8], [-0.35, 0.9]);
	}
	const bate = golpes.some((g) => frame >= g && frame < g + 5) ? Math.sin(frame * 5) * 0.12 : 0;
	const abre = mola(acha, 120);
	const sobe = frame >= acha ? abre : 0;
	const pTexto = mola(golpes[golpes.length - 1] ?? acha, 170);
	const picSai = interpolate(frame, [acha, acha + 8], [0, 1], lim);
	return (
		<AbsoluteFill style={{opacity: saida}}>
			<AbsoluteFill style={{opacity: entrada}}>
				<FundoMotion />
			</AbsoluteFill>
			<AbsoluteFill style={{opacity: sobe, background: `radial-gradient(ellipse 40% 22% at 50% 44%, rgba(255,214,140,0.45), rgba(150,90,220,0.1) 60%, transparent 100%)`}} />
			<Canvas width={width} height={height}>
				<Luzes quadro={frame} batidas={[...golpes, acha]} />
				<pointLight position={[0, yMundo(860), 2]} intensity={sobe * 45} distance={10} color="#ffcf7a" />
				{/* pedra em duas metades que se abrem */}
				<group position={[bate, yMundo(1000), 0]} scale={mola(0, 150)}>
					<mesh material={m.pedra} position={[-0.05 - sobe * 1.6, 0, 0]} rotation={[0.3, 0.4, sobe * 0.5]}>
						<dodecahedronGeometry args={[1.5, 0]} />
					</mesh>
					<mesh material={m.pedra} position={[0.05 + sobe * 1.6, -0.1, 0.1]} rotation={[0.7, -0.5, -sobe * 0.5]}>
						<dodecahedronGeometry args={[1.35, 0]} />
					</mesh>
				</group>
				{/* produto brilhando (caixa de ouro com fita) */}
				{frame >= acha ? (
					<group position={[0, yMundo(1000) + sobe * 1.8, 0.6]} scale={0.3 + 0.9 * sobe} rotation={[0.35, t * 1.6, 0]}>
						<mesh material={m.ouroBrilho}>
							<boxGeometry args={[1.5, 1.5, 1.5]} />
						</mesh>
						<mesh material={m.roxoClaro}>
							<boxGeometry args={[1.56, 0.26, 1.56]} />
						</mesh>
						<mesh material={m.roxoClaro}>
							<boxGeometry args={[0.26, 1.56, 1.56]} />
						</mesh>
					</group>
				) : null}
				{picSai < 1 ? (
					<group position={[1.6 + picSai * 4, yMundo(820), 1]} rotation={[0, 0, ang]} scale={1.1}>
						<group position={[0, 1.1, 0]}>
							<Picareta m={m} />
						</group>
					</group>
				) : null}
				{golpes.length ? <Linha3D texto="MINERAÇÃO" metal="ouro" largura={4.2} y={yMundo(250)} quadro={frame} batida={golpes[golpes.length - 1]} profundidade={0.4} intervalo={1} ate={fim - 8} /> : null}
			</Canvas>
			<Kicker texto="ACHAR O PRODUTO" y={1460} p={frame >= acha ? pTexto * mola(acha, 170) : 0} />
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 3. perfil zerado: 0 seguidores, selo INICIANTE, e o número começa a subir
// dados: {zerado, iniciante, sobe}
const d34Perfil: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fim, q, entrada, saida, mola, d} = useCena(cena);
	const zerado = q(d.zerado);
	const iniciante = q(d.iniciante);
	const sobe = q(d.sobe);
	const k = interpolate(frame, [sobe, Math.max(sobe + 10, fim - 10)], [0, 1], lim);
	const valor = Math.round(1240 * (1 - Math.pow(1 - k, 2.4)));
	const seguidores = valor >= 1000 ? `${(valor / 1000).toFixed(1).replace('.', ',')} mil` : String(valor);
	const vendas = String(Math.round(86 * (1 - Math.pow(1 - k, 2.4))));
	let pulso = 1;
	for (const pq of [zerado, ...((d.pulsos as number[]) ?? []).map(q)]) if (frame >= pq && frame < pq + 10) pulso = 1 + 0.08 * Math.sin(((frame - pq) / 10) * Math.PI);
	const pIni = mola(iniciante, 230);
	const pTit = mola(zerado, 180);
	const titSai = interpolate(frame, [sobe - 5, sobe], [1, 0], lim);
	const subindo = frame >= sobe;
	return (
		<AbsoluteFill style={{opacity: saida}}>
			<AbsoluteFill style={{opacity: entrada}}>
				<FundoMotion />
			</AbsoluteFill>
			{subindo ? <Kicker texto="↑ COMEÇANDO A SUBIR" y={420} p={mola(sobe, 180)} /> : <Titulo texto="PERFIL" destaque="zerado" y={380} p={pTit * titSai} />}
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', transform: `scale(${(0.75 + 0.25 * mola(0, 200)) * pulso})`}}>
				<CardPerfil
					seguidores={subindo ? seguidores : '0'}
					vendas={subindo ? vendas : '0'}
					cor={subindo ? OURO : '#bdb6cc'}
					selo={
						frame >= iniciante ? (
							<div style={{position: 'absolute', right: -24, top: -34, transform: `rotate(8deg) scale(${1.8 - 0.8 * pIni})`, opacity: Math.min(1, pIni * 2), padding: '12px 30px', borderRadius: 999, background: `linear-gradient(180deg, #f6dca6, ${OURO})`, fontFamily: poppins, fontWeight: 900, fontSize: 40, letterSpacing: '0.12em', color: ROXO, boxShadow: '0 10px 30px rgba(5,2,15,0.5)'}}>
								INICIANTE
							</div>
						) : null
					}
				/>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 4. pega pela mão: mão de ouro guia a mão dela pelo caminho até a estrela
const Mao: React.FC<{cor: string; escala: number; rot: number}> = ({cor, escala, rot}) => (
	<svg width={220 * escala} height={260 * escala} viewBox="0 0 220 260" style={{transform: `rotate(${rot}deg)`, overflow: 'visible'}}>
		<g fill={cor} stroke="rgba(30,15,58,0.55)" strokeWidth={5}>
			<rect x={52} y={110} width={120} height={130} rx={46} />
			<rect x={56} y={30} width={28} height={110} rx={14} />
			<rect x={88} y={12} width={28} height={120} rx={14} />
			<rect x={120} y={20} width={28} height={112} rx={14} />
			<rect x={150} y={46} width={26} height={96} rx={13} />
			<rect x={4} y={120} width={30} height={92} rx={15} transform="rotate(-38 19 166)" />
		</g>
	</svg>
);

// dados: {pega, mao}
const d34Mao: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fim, q, entrada, saida, mola, d} = useCena(cena);
	const pega = q(d.pega);
	const mao = q(d.mao);
	const anda = interpolate(frame, [mao, fim - 8], [0, 1], lim);
	const e = 1 - Math.pow(1 - anda, 2);
	// caminho: curva de baixo à esquerda até a estrela no alto à direita
	const ponto = (u: number) => ({x: 200 + 640 * u, y: 1480 - 760 * u + Math.sin(u * Math.PI) * -160});
	const pos = ponto(e);
	const pMao = mola(0, 200);
	const pegou = mola(mao, 220);
	const passos = 9;
	return (
		<AbsoluteFill style={{opacity: saida}}>
			<AbsoluteFill style={{opacity: entrada}}>
				<FundoMotion />
			</AbsoluteFill>
			<Titulo texto="PEGA PELA" destaque="mão" y={250} p={mola(pega, 180)} />
			{/* pegadas do caminho acendendo */}
			{Array.from({length: passos}, (_, i) => {
				const u = i / (passos - 1);
				const p = ponto(u);
				const aceso = e >= u - 0.02;
				return <div key={i} style={{position: 'absolute', left: p.x - 14, top: p.y - 14, width: 28, height: 28, borderRadius: 14, background: aceso ? OURO : 'rgba(255,255,255,0.18)', boxShadow: aceso ? '0 0 22px rgba(232,194,122,0.9)' : 'none'}} />;
			})}
			{/* estrela da meta */}
			<div style={{position: 'absolute', left: ponto(1).x - 90, top: ponto(1).y - 200, fontSize: 170, color: OURO, textShadow: `0 0 ${20 + 40 * e}px rgba(232,194,122,${0.4 + 0.6 * e})`, transform: `scale(${0.8 + 0.4 * e}) rotate(${frame * 2}deg)`}}>★</div>
			{/* mão dela (branca) e a mão de ouro que a pega e guia */}
			<div style={{position: 'absolute', left: pos.x - 110, top: pos.y - 60, transform: `scale(${0.6 + 0.4 * pMao})`, opacity: pMao}}>
				<Mao cor="#efe9fb" escala={0.85} rot={-20} />
			</div>
			<div style={{position: 'absolute', left: pos.x - 10 + (1 - pegou) * 420, top: pos.y - 150 - (1 - pegou) * 300, opacity: Math.min(1, pegou * 2)}}>
				<Mao cor={OURO} escala={1} rot={160} />
			</div>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 5. suporte individual × grupo: balões de conversa
// dados: {individual, grupo, individual2, duvidas}
const Balao: React.FC<{texto: string; ouro?: boolean; lado?: 'e' | 'd'; p: number; tam?: number}> = ({texto, ouro, lado = 'e', p, tam = 40}) => (
	<div style={{alignSelf: lado === 'e' ? 'flex-start' : 'flex-end', opacity: Math.min(1, p * 1.6), transform: `translateY(${(1 - p) * 40}px) scale(${0.7 + 0.3 * p})`, transformOrigin: lado === 'e' ? 'left bottom' : 'right bottom', padding: '22px 34px', borderRadius: 36, borderBottomLeftRadius: lado === 'e' ? 8 : 36, borderBottomRightRadius: lado === 'd' ? 8 : 36, background: ouro ? `linear-gradient(180deg, #f6dca6, ${OURO})` : 'rgba(255,255,255,0.14)', color: ouro ? ROXO : 'rgba(255,255,255,0.75)', fontFamily: poppins, fontWeight: ouro ? 800 : 600, fontSize: tam, boxShadow: ouro ? '0 0 40px rgba(232,194,122,0.45)' : 'none', maxWidth: 760}}>
		{texto}
	</div>
);

const d34Suporte: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, q, entrada, saida, mola, d} = useCena(cena);
	const individual = q(d.individual);
	const grupo = q(d.grupo);
	const individual2 = q(d.individual2);
	const duvidas = q(d.duvidas);
	const tirar = q(d.tirar);
	const fase = frame < grupo ? 0 : frame < individual2 ? 1 : 2;
	const titulos = [
		{t: 'SUPORTE', dz: 'individual', de: individual},
		{t: 'TEM', dz: 'grupo', de: grupo},
		{t: 'SÓ PRA', dz: 'você', de: individual2},
	];
	const tit = titulos[fase];
	const grupoMsgs = ['alguém sabe?', 'kkkk', 'bom dia!!', 'eu também', 'qual produto?', 'ajuda aqui'];
	const dim = fase === 2 ? 0.25 : 1;
	return (
		<AbsoluteFill style={{opacity: saida}}>
			<AbsoluteFill style={{opacity: entrada}}>
				<FundoMotion />
			</AbsoluteFill>
			<Titulo texto={tit.t} destaque={tit.dz} y={250} tam={80} p={fase === 0 ? mola(0, 200) : mola(tit.de, 200)} />
			{/* tela de conversa */}
			<div style={{position: 'absolute', left: 120, right: 120, top: 520, bottom: 330, borderRadius: 50, background: 'rgba(20,9,42,0.6)', boxShadow: 'inset 0 0 0 3px rgba(232,194,122,0.4)', padding: 40, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 22, overflow: 'hidden'}}>
				{fase === 0 ? (
					<>
						<Balao texto="Oi! Me conta seu produto" ouro p={mola(3, 200)} />
						<Balao texto="vamos juntas 1 a 1" ouro p={mola(individual, 200)} />
					</>
				) : (
					<>
						<div style={{display: 'flex', flexDirection: 'column', gap: 18, opacity: dim}}>
							{grupoMsgs.map((m, i) => (
								<Balao key={m} texto={m} lado={i % 2 ? 'd' : 'e'} tam={34} p={mola(grupo + i * 2, 260)} />
							))}
						</div>
						{fase === 2 ? (
							<div style={{position: 'absolute', left: 40, right: 40, bottom: 40, display: 'flex', flexDirection: 'column', gap: 22}}>
								<Balao texto="Aqui é só você e eu" ouro tam={44} p={mola(individual2, 200)} />
								{frame >= tirar ? <Balao texto="como escolho o produto?" lado="d" tam={40} p={mola(tirar, 220)} /> : null}
								{frame >= duvidas ? <Balao texto="Te mostro passo a passo ✓" ouro tam={44} p={mola(duvidas, 220)} /> : null}
							</div>
						) : null}
					</>
				)}
			</div>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 6. produto campeão: pódio 3D e troféu de ouro que pousa no 1º lugar
const Trofeu: React.FC<{m: ReturnType<typeof useMats>}> = ({m}) => {
	const perfil = useMemo(() => {
		const pts: THREE.Vector2[] = [];
		for (let i = 0; i <= 12; i++) {
			const u = i / 12;
			pts.push(new THREE.Vector2(0.15 + 0.85 * Math.sin(u * Math.PI * 0.5) ** 0.7, u * 1.4));
		}
		return pts;
	}, []);
	return (
		<group>
			<mesh material={m.ouro} position={[0, 0.5, 0]}>
				<latheGeometry args={[perfil, 40]} />
			</mesh>
			{[-1, 1].map((l) => (
				<mesh key={l} material={m.ouro} position={[l * 0.95, 1.35, 0]} rotation={[0, 0, l * 0.2]}>
					<torusGeometry args={[0.32, 0.07, 10, 30]} />
				</mesh>
			))}
			<mesh material={m.ouro} position={[0, 0.25, 0]}>
				<cylinderGeometry args={[0.12, 0.18, 0.5, 20]} />
			</mesh>
			<mesh material={m.roxo} position={[0, -0.05, 0]}>
				<boxGeometry args={[0.9, 0.3, 0.9]} />
			</mesh>
		</group>
	);
};

// dados: {pousa, campeao}
const d34Campeao: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fim, q, entrada, saida, mola, width, height, t, d} = useCena(cena);
	const m = useMats();
	const pousa = q(d.pousa);
	const campeao = q(d.campeao);
	const queda = frame < pousa ? interpolate(frame, [0, pousa], [0, 1], lim) : 1;
	const yTrofeu = yMundo(820) + (1 - queda * queda) * 7;
	const quica = frame >= pousa ? Math.exp(-(frame - pousa) / 5) * Math.abs(Math.sin((frame - pousa) * 0.6)) * 0.35 : 0;
	const pPodio = mola(0, 150);
	return (
		<AbsoluteFill style={{opacity: saida}}>
			<AbsoluteFill style={{opacity: entrada}}>
				<FundoMotion />
			</AbsoluteFill>
			<AbsoluteFill style={{opacity: frame >= pousa ? 1 : 0, background: `radial-gradient(ellipse 35% 25% at 50% 40%, rgba(255,214,140,${0.2 + 0.4 * Math.exp(-(frame - pousa) / 6)}), transparent 100%)`}} />
			<Canvas width={width} height={height}>
				<Luzes quadro={frame} batidas={[pousa, campeao]} />
				<pointLight position={[0, yMundo(700), 3]} intensity={frame >= pousa ? 40 : 0} distance={10} color="#ffcf7a" />
				<group position={[0, yMundo(1180) - (1 - pPodio) * 4, 0]} rotation={[0.18, Math.sin(t * 0.8) * 0.18, 0]}>
					{[
						[-1.9, 1.3],
						[0, 2],
						[1.9, 0.9],
					].map(([x, h], i) => (
						<group key={i} position={[x, h / 2, 0]}>
							<mesh material={i === 1 ? m.roxoClaro : m.roxo}>
								<boxGeometry args={[1.8, h, 1.6]} />
							</mesh>
							<mesh material={m.ouro} position={[0, h / 2 + 0.03, 0]}>
								<boxGeometry args={[1.84, 0.06, 1.64]} />
							</mesh>
						</group>
					))}
				</group>
				<group position={[0, yTrofeu + quica, 0.2]} rotation={[0.1, t * 1.4, 0]} scale={1.25}>
					<Trofeu m={m} />
				</group>
				{frame >= campeao ? <Linha3D texto="CAMPEÃO" metal="ouro" largura={4.0} y={yMundo(1330)} quadro={frame} batida={campeao} profundidade={0.45} intervalo={1} ate={fim - 8} /> : null}
			</Canvas>
			<Kicker texto="PRODUTO" y={frame >= campeao ? 190 : 330} p={mola(4, 170)} />
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 7. sem segredo, sem milagre → constância, dedicação, produto certo
const Cofre: React.FC<{m: ReturnType<typeof useMats>; t: number}> = ({m, t}) => (
	<group>
		<mesh material={m.roxoClaro}>
			<boxGeometry args={[2.6, 2.6, 2]} />
		</mesh>
		<mesh material={m.prata} position={[0, 0, 1.02]} rotation={[Math.PI / 2, t * 3, 0]}>
			<cylinderGeometry args={[0.6, 0.6, 0.18, 32]} />
		</mesh>
		<mesh material={m.ouro} position={[0.85, 0, 1.05]}>
			<boxGeometry args={[0.16, 0.9, 0.16]} />
		</mesh>
	</group>
);

const Varinha: React.FC<{m: ReturnType<typeof useMats>}> = ({m}) => (
	<group rotation={[0, 0, -0.6]}>
		<mesh material={m.preto}>
			<cylinderGeometry args={[0.1, 0.1, 3.2, 16]} />
		</mesh>
		<mesh material={m.prata} position={[0, 1.5, 0]}>
			<cylinderGeometry args={[0.11, 0.11, 0.35, 16]} />
		</mesh>
		<mesh material={m.ouroBrilho} position={[0, 2, 0]} rotation={[0, 0, Math.PI / 4]}>
			<octahedronGeometry args={[0.45, 0]} />
		</mesh>
	</group>
);

// Risco de ouro em 3D (barra que cresce na diagonal).
const Risco: React.FC<{m: ReturnType<typeof useMats>; k: number; y: number}> = ({m, k, y}) => (
	<mesh material={m.ouroBrilho} position={[0, y, 1.8]} rotation={[0, 0, -0.55]} scale={[Math.max(0.001, k), 1, 1]}>
		<boxGeometry args={[4.4, 0.24, 0.24]} />
	</mesh>
);

// dados: {segredo, milagre, constancia, dedicacao, certo}
const d34SemSegredo: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fim, q, entrada, saida, mola, width, height, t, d} = useCena(cena);
	const m = useMats();
	const segredo = q(d.segredo);
	const milagre = q(d.milagre);
	const blocos = [q(d.constancia), q(d.dedicacao), q(d.certo)];
	const nomes = ['CONSTÂNCIA', 'DEDICAÇÃO', 'PRODUTO CERTO'];
	const fase = frame < milagre ? 0 : frame < blocos[0] ? 1 : 2;
	const k = (de: number) => interpolate(frame, [de + 4, de + 10], [0, 1], lim);
	const y0 = yMundo(1150);
	const ativo = blocos.filter((b) => frame >= b).length - 1;
	const yObj = yMundo(900);
	return (
		<AbsoluteFill style={{opacity: saida}}>
			<AbsoluteFill style={{opacity: entrada}}>
				<FundoMotion />
			</AbsoluteFill>
			{fase === 0 ? <Kicker texto="NÃO EXISTE SEGREDO" y={380} p={mola(0, 180)} /> : null}
			{fase === 1 ? <Kicker texto="NÃO EXISTE MILAGRE" y={380} p={mola(milagre, 180)} /> : null}
			<Canvas width={width} height={height}>
				<Luzes quadro={frame} batidas={[segredo, milagre, ...blocos]} />
				{fase === 0 ? (
					<group position={[0, yObj, 0]} scale={mola(0, 170)} rotation={[0.25, 0.5 + Math.sin(t * 1.5) * 0.15, 0]}>
						<Cofre m={m} t={t} />
					</group>
				) : null}
				{fase === 0 ? <Risco m={m} k={k(segredo)} y={yObj} /> : null}
				{fase === 1 ? (
					<group position={[0, yObj, 0]} scale={mola(milagre, 190)} rotation={[0.2, Math.sin(t * 2) * 0.4, 0]}>
						<Varinha m={m} />
					</group>
				) : null}
				{fase === 1 ? <Risco m={m} k={k(milagre)} y={yObj} /> : null}
				{fase === 2
					? blocos.map((b, i) => {
							if (frame < b) return null;
							const p = mola(b, 150);
							const alvo = y0 + i * 1.25;
							return (
								<group key={i} position={[0, alvo + (1 - p) * 6, 0]} rotation={[0.25, -0.35 + Math.sin(t * 1.3) * 0.08, 0]}>
									<mesh material={i === 2 ? m.ouro : m.roxoClaro}>
										<boxGeometry args={[3.4 - i * 0.5, 1.1, 1.6]} />
									</mesh>
								</group>
							);
						})
					: null}
				{fase === 2 && ativo >= 0 ? (
					<Linha3D key={ativo} texto={nomes[ativo]} metal={ativo === 2 ? 'ouro' : 'branco'} largura={ativo === 2 ? 4.4 : 4.1} y={yMundo(400)} quadro={frame} batida={blocos[ativo]} profundidade={0.4} intervalo={1} ate={Math.min(fim - 8, (blocos[ativo + 1] ?? fim) - 2)} />
				) : null}
			</Canvas>
		</AbsoluteFill>
	);
};


// ---------------------------------------------------------------- nichos de lado: cartões de outros nichos são varridos para o lado e o propósito fica no centro
// dados: {nichos, lado, vim, proposito}
const NICHOS = ['MODA', 'CASA', 'ELETRÔNICOS'];
const d34Nichos: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fim, q, entrada, saida, mola, width, height, d} = useCena(cena);
	const nichos = q(d.nichos);
	const lado = q(d.lado);
	const vim = q(d.vim);
	const proposito = q(d.proposito);
	const varre = interpolate(frame, [lado, lado + 9], [0, 1], {...lim, easing: (x) => x * x});
	const pAlvo = mola(vim, 170);
	const pulso = frame >= proposito ? 1 + 0.06 * Math.sin((frame - proposito) / 3) * Math.max(0, 1 - (frame - proposito) / 20) : 1;
	return (
		<AbsoluteFill style={{opacity: saida}}>
			<AbsoluteFill style={{opacity: entrada}}>
				<FundoMotion />
			</AbsoluteFill>
			{varre < 1
				? NICHOS.map((n, i) => {
						const p = mola(nichos + i * 4, 200);
						const x = (i - 1) * 300 - varre * (1500 + i * 120);
						const rot = (i - 1) * 9 - varre * 35;
						return (
							<div key={n} style={{position: 'absolute', left: width / 2 - 140 + x, top: 700 + Math.abs(i - 1) * 40, width: 280, height: 360, borderRadius: 28, background: 'rgba(233,230,242,0.10)', border: '3px solid rgba(233,230,242,0.35)', boxShadow: '0 20px 40px rgba(8,3,20,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22, opacity: Math.min(1, p * 1.5) * (1 - varre * 0.6), transform: `rotate(${rot}deg) scale(${0.6 + 0.4 * p})`}}>
								<div style={{width: 120, height: 120, borderRadius: 24, background: 'rgba(189,182,204,0.25)'}} />
								<span style={{fontFamily: poppins, fontWeight: 900, fontSize: n.length > 6 ? 34 : 46, color: '#bdb6cc', letterSpacing: '0.04em'}}>{n}</span>
							</div>
						);
					})
				: null}
			{frame < lado ? <Kicker texto="OUTROS NICHOS" y={520} p={mola(nichos, 170)} /> : null}
			{frame >= vim ? (
				<div style={{position: 'absolute', left: width / 2, top: 860, transform: `translate(-50%,-50%) scale(${pAlvo * pulso})`}}>
					{[300, 210, 120].map((r, i) => (
						<div key={r} style={{position: 'absolute', left: -r / 2, top: -r / 2, width: r, height: r, borderRadius: '50%', border: `${i === 2 ? 0 : 14}px solid ${i === 1 ? '#fff1c9' : OURO}`, background: i === 2 ? OURO : 'transparent', boxShadow: '0 0 40px rgba(232,194,122,0.55)'}} />
					))}
				</div>
			) : null}
			{frame >= vim && frame < proposito ? <Kicker texto="FOCO NO" y={1080} p={mola(vim + 4, 170)} /> : null}
			{frame >= proposito ? (
				<Canvas width={width} height={height}>
					<Luzes quadro={frame} batidas={[proposito]} />
					<Linha3D texto="PROPÓSITO" metal="ouro" largura={4.1} y={yMundo(1160)} quadro={frame} batida={proposito} profundidade={0.45} ate={fim - 8} />
				</Canvas>
			) : null}
		</AbsoluteFill>
	);
};

export const pecas: Pecas = {d34Nichos, d34Flopado, d34Mineracao, d34Perfil, d34Mao, d34Suporte, d34Campeao, d34SemSegredo};
