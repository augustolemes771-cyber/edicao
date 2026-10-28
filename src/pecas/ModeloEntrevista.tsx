// Cenas do modelo de entrevista aprovado (IMG_5157 v4b, tema Entrevista): as peças de src/pecas/modelo/ são cópias fiéis
// do modelo e leem o tempo da composição; aqui elas recebem os tempos da cena (relativos ao início dela).
// frase: frase grande palavra por palavra com uma ênfase em Playfair dourado, vídeo escurecido em roxo.
// siga: pílulas "SIGA <nome>" uma a uma. live: interface de live sobre o vídeo (~0,7 a 2 s). chips: um item por vez no
// mesmo lugar. comentario: caixa de comentário digitada. numero3d: número em ouro 3D acima da cabeça (gancho, resultado).
// selo: pílula dourada com chip roxo. final: cartão final roxo com anel dourado e a marca.
import React from 'react';
import {AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import type {CenaNoPlano} from '../motor/plano';
import {playfair, poppins} from '../motor/tema';
import {Checklist} from './modelo/motion5157a';
import {CommentBubble, FollowPills, FullPhrase} from './modelo/motion5157b';
import {LiveTemplate} from './modelo/motion5157e';
import {Faiscas, Linha3D, Luzes, Onda} from './tres/Texto3D';

type De<T extends CenaNoPlano['tipo']> = Extract<CenaNoPlano, {tipo: T}>;
const lim = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ROXO = '#1E0F3A';
const OURO = '#E8C27A';
const OURO_FILL = 'linear-gradient(180deg,#FFF3D2 0%,#F2D59A 45%,#E8C27A 70%,#D4A856 100%)';
const OURO_TEXTO = 'linear-gradient(180deg,#FFF1C9 0%,#F2D08A 40%,#E8C27A 65%,#C9974A 100%)';
const VIDRO: React.CSSProperties = {
	background: 'linear-gradient(180deg, rgba(46,24,86,0.74) 0%, rgba(30,15,58,0.72) 100%)',
	backdropFilter: 'blur(18px)',
};
const rel = (cena: {de: number}, t: number) => t - cena.de;

// dor: a frase treme, ganha vinheta vermelha que pulsa, aberração cromática e cortes de glitch (sofrimento e revolta).
const FraseDor: React.FC<{dur: number; children: React.ReactNode}> = ({dur, children}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const fim = Math.round(dur * fps);
	const entra = interpolate(frame, [0, 6], [0, 1], lim) * interpolate(frame, [fim - 6, fim], [1, 0], lim);
	const tremor = (random(`dx${frame}`) - 0.5) * 14 * entra;
	const tremorY = (random(`dy${frame}`) - 0.5) * 10 * entra;
	const pulso = Math.exp(-((frame % 20) / 20) * 5);
	const glitch = random(`g${Math.floor(frame / 3)}`) > 0.82 ? (random(`gx${frame}`) - 0.5) * 40 : 0;
	return (
		<AbsoluteFill>
			<AbsoluteFill style={{transform: `translate(${tremor + glitch}px, ${tremorY}px) scale(${1 + 0.03 * pulso})`, filter: `drop-shadow(${4 * entra}px 0 0 rgba(255,30,60,0.8)) drop-shadow(${-4 * entra}px 0 0 rgba(0,200,255,0.55))`}}>{children}</AbsoluteFill>
			<AbsoluteFill style={{opacity: entra, pointerEvents: 'none', background: `radial-gradient(ellipse at 50% 50%, rgba(120,0,20,0) 25%, rgba(140,0,25,${0.5 + 0.3 * pulso}) 80%, rgba(40,0,8,0.95) 100%)`, mixBlendMode: 'multiply'}} />
		</AbsoluteFill>
	);
};

export const Frase: React.FC<{cena: De<'frase'>}> = ({cena}) => {
	const fp = (
		<FullPhrase
			t0={0}
			end={cena.ate - cena.de}
			words={cena.palavras.map((p) => ({text: p.texto, t: Math.max(0, rel(cena, p.em)), accent: p.destaque}))}
			top={cena.topo ?? 760}
			bottom={cena.base ?? 1100}
		/>
	);
	return cena.dor ? <FraseDor dur={cena.ate - cena.de}>{fp}</FraseDor> : fp;
};

// Olho 3D: sai do contador de espectadores (canto superior direito), cresce e voa ao centro, com a legenda 3D embaixo.
const Olho3D: React.FC<{inicio: number; dur: number; legenda: string}> = ({inicio, dur, legenda}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const local = frame - Math.round(inicio * fps);
	if (local < 0) return null;
	const meia = 14.5 * Math.tan((35 / 2) * (Math.PI / 180));
	const meiaL = meia * (width / height);
	const p = spring({frame: local, fps, config: {damping: 13, stiffness: 90, mass: 0.9}});
	const x0 = (0.855 - 0.5) * 2 * meiaL;
	const y0 = (0.5 - 0.057) * 2 * meia;
	const x = x0 * (1 - p);
	const y = y0 + (0.9 - y0) * p;
	const esc = 0.22 + 1.1 * p;
	const fim = Math.round(dur * fps);
	const saida = interpolate(frame, [fim - 7, fim], [1, 0], lim);
	const olhar = Math.sin(local / fps * 2.2) * 0.25;
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: saida, filter: 'drop-shadow(0 22px 30px rgba(12,4,28,0.6))'}}>
			<ThreeCanvas width={width} height={height} gl={{alpha: true, antialias: true, preserveDrawingBuffer: true}} camera={{fov: 35, position: [0, 0, 14.5], near: 0.1, far: 60}} style={{position: 'absolute', inset: 0}}>
				<Luzes quadro={frame} batidas={[Math.round(inicio * fps)]} />
				<group position={[x, y, 0]} scale={esc} rotation={[0, olhar * (1 - p * 0.6) + (1 - p) * 1.2, 0]}>
					<mesh scale={[1.5, 1.5, 1.5]}>
						<sphereGeometry args={[1, 48, 48]} />
						<meshStandardMaterial color="#f7f3ea" roughness={0.25} metalness={0.05} />
					</mesh>
					<mesh position={[0, 0, 1.38]} scale={[1, 1, 0.45]}>
						<sphereGeometry args={[0.72, 40, 40]} />
						<meshStandardMaterial color="#E8C27A" roughness={0.2} metalness={0.9} />
					</mesh>
					<mesh position={[0, 0, 1.62]} scale={[1, 1, 0.4]}>
						<sphereGeometry args={[0.33, 32, 32]} />
						<meshStandardMaterial color="#120826" roughness={0.1} />
					</mesh>
				</group>
				<Linha3D texto={legenda} metal="branco" largura={4.6} y={-2.1} quadro={frame} batida={Math.round(inicio * fps) + 14} profundidade={0.22} />
			</ThreeCanvas>
		</AbsoluteFill>
	);
};

export const Siga: React.FC<{cena: De<'siga'>}> = ({cena}) => (
	<FollowPills items={cena.itens.map((i) => ({text: i.texto, t: Math.max(0, rel(cena, i.em))}))} end={cena.ate - cena.de} y={cena.y ?? 1040} x="center" />
);

// drama: a live vazia ganha vinheta roxa que fecha, pulso de batimento e um anel dourado que bate no contador de espectadores.
const LiveDrama: React.FC<{dur: number}> = ({dur}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const fim = Math.round(dur * fps);
	const entra = interpolate(frame, [0, 10], [0, 1], lim) * interpolate(frame, [fim - 8, fim], [1, 0], lim);
	const bate = (frame % 18) / 18;
	const pulso = Math.exp(-bate * 5);
	const anel = (frame % 24) / 24;
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: entra}}>
			<AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 55%, rgba(30,15,58,0) 30%, rgba(30,15,58,${0.55 + 0.15 * pulso}) 75%, rgba(12,4,28,0.9) 100%)`}} />
			<div style={{position: 'absolute', left: width * 0.855 - 90, top: height * 0.046 - 90, width: 180, height: 180, borderRadius: '50%', border: `4px solid rgba(232,194,122,${0.9 * (1 - anel)})`, transform: `scale(${0.4 + anel * 1.4})`}} />
		</AbsoluteFill>
	);
};

export const Live: React.FC<{cena: De<'live'>}> = ({cena}) => (
	<AbsoluteFill>
		{cena.drama ? <LiveDrama dur={cena.ate - cena.de} /> : null}
		{cena.olho3d !== undefined ? <Olho3D inicio={Math.max(0, rel(cena, cena.olho3d))} dur={cena.ate - cena.de} legenda="SÓ 1 ESPECTADOR" /> : null}
		<LiveTemplate
			from={0}
			to={cena.ate - cena.de}
			espectadores={cena.espectadores}
			comentarios={cena.comentarios?.map((c) => ({name: c.nome, text: c.texto}))}
			coracoes={cena.coracoes}
			host={cena.host}
			curtidas={cena.curtidas}
		/>
	</AbsoluteFill>
);

// Um item por vez, no mesmo lugar: cada chip sai quando o próximo entra.
export const Chips: React.FC<{cena: De<'chips'>}> = ({cena}) => {
	const dur = cena.ate - cena.de;
	const itens = [...cena.itens].sort((a, b) => a.em - b.em);
	return (
		<>
			{itens.map((it, i) => (
				<Checklist
					key={i}
					items={[{t: Math.max(0, rel(cena, it.em)), text: it.texto}]}
					end={i + 1 < itens.length ? rel(cena, itens[i + 1].em) : dur}
					side="center"
					y={cena.y ?? 1080}
					numbered={cena.numerado}
					firstNumber={i + 1}
				/>
			))}
		</>
	);
};

export const Comentario: React.FC<{cena: De<'comentario'>}> = ({cena}) => (
	<CommentBubble t0={0} end={cena.ate - cena.de} text={cena.texto} y={cena.y ?? 1080} />
);

// Pílula dourada grande (ex.: "MENOS DE 1 MÊS") com batida, e um chip roxo opcional embaixo.
export const Selo: React.FC<{cena: De<'selo'>}> = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const dur = cena.ate - cena.de;
	const s = interpolate(t, [0, 0.16, 0.34], [1.45, 0.95, 1], lim);
	const o = interpolate(t, [0, 0.08], [0, 1], lim) * interpolate(t, [dur - 0.2, dur], [1, 0], lim);
	const onda = interpolate(t, [0.04, 0.55], [0, 1], lim);
	const tChip = cena.emChip !== undefined ? rel(cena, cena.emChip) : 0.25;
	const c = interpolate(t, [tChip, tChip + 0.3], [0, 1], lim);
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<div style={{position: 'absolute', left: 0, top: cena.y ?? 1020, width: 1020, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, opacity: o}}>
				<div style={{position: 'relative', transform: `scale(${s})`}}>
					<div style={{position: 'absolute', inset: 0, borderRadius: 999, border: `3px solid ${OURO}`, opacity: (1 - onda) * 0.8 * (onda > 0 ? 1 : 0), transform: `scale(${1 + 0.28 * onda}, ${1 + 0.7 * onda})`}} />
					<div style={{fontFamily: poppins, fontWeight: 800, fontSize: 54, letterSpacing: '0.04em', color: ROXO, lineHeight: 1, padding: '22px 44px 21px', borderRadius: 999, background: OURO_FILL, whiteSpace: 'nowrap', boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.55), 0 16px 44px rgba(18,7,38,0.32)'}}>
						{cena.texto}
					</div>
				</div>
				{cena.chip && t >= tChip ? (
					<div style={{...VIDRO, opacity: c, transform: `translateY(${(1 - c) * 18}px)`, padding: '14px 30px', borderRadius: 999, fontFamily: poppins, fontWeight: 700, fontSize: 34, letterSpacing: '0.12em', color: '#fff', boxShadow: 'inset 0 0 0 1.5px rgba(232,194,122,0.5)'}}>
						{cena.chip}
					</div>
				) : null}
			</div>
		</AbsoluteFill>
	);
};

// Número em ouro 3D (three.js, letras extrudadas com bisel) acima da cabeça, com o rótulo pequeno em cima (ex.: GMV)
// e uma linha embaixo. O topo do vídeo escurece em roxo para o ouro ler sobre qualquer fundo.
export const Numero3D: React.FC<{cena: De<'numero3d'>}> = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const dur = cena.ate - cena.de;
	const fim = Math.round(dur * fps);
	const batida = Math.round(Math.max(0, rel(cena, cena.em ?? cena.de + 0.15)) * fps);
	const yPx = cena.y ?? 330;
	// Câmera do Texto3D: fov 35 a 14,5 de distância → meia altura visível de ~4,57 unidades.
	const meia = 14.5 * Math.tan((35 / 2) * (Math.PI / 180));
	const yMundo = ((height / 2 - yPx) / (height / 2)) * meia;
	const saida = interpolate(frame, [fim - 7, fim], [1, 0], lim);
	const sombra = interpolate(frame, [0, 8], [0, 1], lim) * saida;
	const rot = interpolate(frame, [batida + 2, batida + 10], [0, 1], lim);
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<AbsoluteFill style={{opacity: sombra, background: `linear-gradient(180deg, rgba(30,15,58,0.82) 0%, rgba(30,15,58,0.55) ${((yPx + 170) / height) * 100}%, rgba(30,15,58,0) ${((yPx + 380) / height) * 100}%)`}} />
			{cena.rotulo ? (
				<div style={{position: 'absolute', top: yPx - 175, width: '100%', textAlign: 'center', opacity: rot * saida, transform: `translateY(${(1 - rot) * 14}px)`}}>
					<span style={{fontFamily: poppins, fontWeight: 800, fontSize: 40, letterSpacing: '0.42em', marginRight: '-0.42em', background: OURO_TEXTO, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}}>
						{cena.rotulo}
					</span>
				</div>
			) : null}
			<AbsoluteFill style={{filter: 'drop-shadow(0 22px 30px rgba(12,4,28,0.6))', opacity: saida}}>
				<ThreeCanvas
					width={width}
					height={height}
					gl={{alpha: true, antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05}}
					camera={{fov: 35, position: [0, 0, 14.5], near: 0.1, far: 60}}
					style={{position: 'absolute', inset: 0}}
				>
					<Luzes quadro={frame} batidas={[batida]} />
					<Linha3D texto={cena.texto} metal="ouro" largura={cena.largura ?? 4.4} y={yMundo} quadro={frame} batida={batida} profundidade={0.26} />
					<Onda quadro={frame} inicio={batida} y={yMundo} cor="#ffd27a" tamanho={2.6} />
					<Faiscas quadro={frame} inicio={batida} y={yMundo} cor="#ffd27a" largura={4} />
				</ThreeCanvas>
			</AbsoluteFill>
			{cena.abaixo ? (
				<div style={{position: 'absolute', top: yPx + 150, width: '100%', display: 'flex', justifyContent: 'center', opacity: rot * saida}}>
					<div style={cena.nomeOuro ? {fontFamily: playfair, fontStyle: 'italic', fontWeight: 800, fontSize: 92, lineHeight: 1.2, padding: '0 0.08em', background: OURO_TEXTO, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 6px 10px rgba(12,4,28,0.6))', transform: `translateY(${(1 - rot) * 16}px)`} : {...VIDRO, padding: '14px 32px', borderRadius: 999, fontFamily: poppins, fontWeight: 700, fontSize: 34, letterSpacing: '0.1em', color: '#fff', boxShadow: 'inset 0 0 0 1.5px rgba(232,194,122,0.5)', transform: `translateY(${(1 - rot) * 16}px)`}}>
						{cena.abaixo}
					</div>
				</div>
			) : null}
		</AbsoluteFill>
	);
};

// Cartão final: fundo roxo-noite com partículas, anel dourado que se desenha e a marca em Playfair dourado.
export const Final: React.FC<{cena: De<'final'>}> = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const t = frame / fps;
	const anel = interpolate(t, [0.05, 0.9], [0, 1], {...lim});
	const marca = interpolate(t, [0.35, 0.8], [0, 1], lim);
	const sub = interpolate(t, [0.7, 1.1], [0, 1], lim);
	const R = 300;
	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 42%, #3a1d6e 0%, #1E0F3A 55%, #0d0620 100%)'}}>
			{Array.from({length: 46}, (_, i) => {
				const x = random(`fx${i}`) * width;
				const y0 = random(`fy${i}`) * height;
				const y = (y0 - t * (18 + 30 * random(`fv${i}`)) + height) % height;
				const s = 2 + 3 * random(`fs${i}`);
				return <div key={i} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: s, background: OURO, opacity: 0.25 + 0.5 * random(`fo${i}`), boxShadow: `0 0 ${s * 3}px ${OURO}`}} />;
			})}
			<svg width={width} height={height} style={{position: 'absolute', inset: 0}}>
				<defs>
					<linearGradient id="anelFinal" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0" stopColor="#FFF1C9" />
						<stop offset="0.5" stopColor="#E8C27A" />
						<stop offset="1" stopColor="#B9852F" />
					</linearGradient>
				</defs>
				<circle cx={width / 2} cy={height * 0.44} r={R} fill="none" stroke="url(#anelFinal)" strokeWidth={6} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - anel} transform={`rotate(-90 ${width / 2} ${height * 0.44})`} />
			</svg>
			<div style={{position: 'absolute', top: height * 0.44 - 90, width: '100%', textAlign: 'center', opacity: marca, transform: `scale(${0.92 + 0.08 * marca})`}}>
				<span style={{fontFamily: playfair, fontStyle: 'italic', fontWeight: 800, fontSize: cena.marca.length > 9 ? 110 : 140, lineHeight: 1.2, padding: '0 0.08em', background: OURO_TEXTO, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}}>
					{cena.marca}
				</span>
			</div>
			{cena.sub ? (
				<div style={{position: 'absolute', top: height * 0.44 + R + 70, width: '100%', textAlign: 'center', opacity: sub, transform: `translateY(${(1 - sub) * 16}px)`}}>
					<span style={{fontFamily: poppins, fontWeight: 700, fontSize: 38, letterSpacing: '0.3em', marginRight: '-0.3em', color: '#fff'}}>{cena.sub}</span>
				</div>
			) : null}
		</AbsoluteFill>
	);
};
