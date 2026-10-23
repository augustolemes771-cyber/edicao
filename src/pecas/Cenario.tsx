import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import type {CenaNoPlano} from '../motor/plano';
import {anton, dmSerif, gotica, inter, playfair, poppins} from '../motor/tema';
import {Objeto3D} from './tres/Objetos3D';

// Cenário 2,5D/3D das referências da segunda leva (docs/referencias/desmontagem-2.md):
// fundo de papel ou escuro, palavra fantasma atrás, objetos 3D com sombra no fundo,
// tipografia revelada, luz de janela ou de folhas por cima e detalhes (faíscas, cometa, poeira).
type Cena = Extract<CenaNoPlano, {tipo: 'cenario'}>;

const FOV = 35;
const DIST = 8;

// Tons dos fundos.
const FUNDO = {
	papel: {base: '#ebe9e1', tinta: '#2c2c2c', fantasma: 'rgba(40,40,40,0.13)', detalhe: '#3a3a3a'},
	escuro: {base: '#0c0b0d', tinta: '#f1efe9', fantasma: 'rgba(255,255,255,0.06)', detalhe: '#f1efe9'},
} as const;

// Ambiente de estúdio para os metais refletirem (sem arquivo HDR externo).
const Ambiente: React.FC = () => {
	const {gl, scene} = useThree();
	useMemo(() => {
		const pmrem = new THREE.PMREMGenerator(gl);
		scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
	}, [gl, scene]);
	return null;
};

// Câmera em travelling: posição de/até ao longo da cena, sempre olhando para o centro.
const Camera: React.FC<{de: [number, number, number]; ate: [number, number, number]; p: number}> = ({de, ate, p}) => {
	const {camera} = useThree();
	const e = p * p * (3 - 2 * p);
	camera.position.set(de[0] + (ate[0] - de[0]) * e, de[1] + (ate[1] - de[1]) * e, de[2] + (ate[2] - de[2]) * e);
	camera.lookAt(0, 0, 0);
	return null;
};

const Objetos: React.FC<{cena: Cena; meiaL: number; meiaA: number}> = ({cena, meiaL, meiaA}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	return (
		<>
			{(cena.objetos ?? []).map((o, i) => {
				const p = spring({frame: frame - (o.atraso ?? i * 4), fps, config: {damping: 15, stiffness: 90, mass: 1}});
				const deitado = o.tipo === 'notas';
				const base: [number, number, number] = o.giro ?? (deitado ? [Math.PI / 2.4, 0, 0.5] : [0, 0, 0]);
				const giro = (o.girar ?? 0) * t;
				const bob = o.flutuar === false ? 0 : Math.sin(t * 1.3 + i) * 0.06;
				let x = o.x * meiaL;
				let y = o.y * meiaA;
				if (o.entra === 'desliza') {
					x += (1 - p) * -meiaL * 1.4;
					y += (1 - p) * -meiaA * 0.6;
				} else if (o.entra !== 'nenhum') {
					y += (1 - p) * meiaA * 1.3;
				}
				return (
					<group
						key={i}
						position={[x, y + bob, o.z ?? 0]}
						rotation={[base[0] + Math.sin(t * 0.7 + i) * 0.04, base[1] + giro, base[2] + Math.sin(t * 0.5 + i) * 0.03]}
						scale={o.escala ?? 1}
					>
						<Objeto3D tipo={o.tipo} segundos={t * 40} simbolo={o.simbolo} cor={o.cor} />
					</group>
				);
			})}
		</>
	);
};

// Luz de janela: faixas diagonais desfocadas que andam devagar (multiplica por cima de tudo).
const LuzJanela: React.FC<{escuro: boolean}> = ({escuro}) => {
	const frame = useCurrentFrame();
	const {width, height} = useVideoConfig();
	const passo = Math.max(width, height) * 0.32;
	const deslize = (frame * 0.6) % passo;
	return (
		<AbsoluteFill style={{mixBlendMode: escuro ? 'screen' : 'multiply', overflow: 'hidden'}}>
			<div
				style={{
					position: 'absolute',
					inset: '-40%',
					transform: `rotate(-38deg) translateX(${deslize}px)`,
					background: escuro
						? `repeating-linear-gradient(90deg, rgba(255,240,220,0.08) 0 ${passo * 0.45}px, transparent ${passo * 0.45}px ${passo}px)`
						: `repeating-linear-gradient(90deg, rgba(60,55,50,0.28) 0 ${passo * 0.42}px, transparent ${passo * 0.42}px ${passo}px)`,
					filter: `blur(${passo * 0.09}px)`,
				}}
			/>
		</AbsoluteFill>
	);
};

// Sombra de galhos com folhas (ref. 3), desenhada e desfocada, balançando de leve.
const LuzFolhas: React.FC = () => {
	const frame = useCurrentFrame();
	const {width, height} = useVideoConfig();
	const galhos = useMemo(() => {
		const saida: string[] = [];
		for (let g = 0; g < 3; g++) {
			const x0 = g === 1 ? width * 1.05 : g === 0 ? width * 0.3 : width * 0.15;
			const y0 = g === 2 ? height * 1.02 : -height * 0.02;
			const dir = g === 2 ? -1 : 1;
			let d = `M${x0},${y0} `;
			const folhas: string[] = [];
			for (let k = 1; k <= 9; k++) {
				const x = x0 - k * width * 0.07 * (g === 1 ? 1 : -0.6);
				const y = y0 + dir * k * height * 0.022 + Math.sin(k) * 12;
				d += `L${x.toFixed(0)},${y.toFixed(0)} `;
				for (const lado of [-1, 1]) {
					const fx = x + lado * 26 * random(`f${g}${k}${lado}`);
					const fy = y + lado * 30;
					const ang = lado * 40 + random(`a${g}${k}${lado}`) * 50;
					folhas.push(
						`<ellipse cx="${fx}" cy="${fy}" rx="${16 + 10 * random(`r${g}${k}`)}" ry="7" transform="rotate(${ang} ${fx} ${fy})"/>`,
					);
				}
			}
			saida.push(
				`<path d="${d}" stroke="#2b2b2b" stroke-width="4" fill="none"/><g fill="#2b2b2b">${folhas.join('')}</g>`,
			);
		}
		return saida.join('');
	}, [width, height]);
	const balanco = Math.sin(frame / 40) * 1.2;
	return (
		<AbsoluteFill
			style={{mixBlendMode: 'multiply', opacity: 0.55, filter: 'blur(2.5px)', transform: `rotate(${balanco}deg)`}}
		>
			<svg width={width} height={height} dangerouslySetInnerHTML={{__html: galhos}} />
		</AbsoluteFill>
	);
};

// Grão de papel e de filme (feTurbulence muda a cada 2 quadros).
const Grao: React.FC<{escuro: boolean}> = ({escuro}) => {
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill style={{opacity: escuro ? 0.18 : 0.22, mixBlendMode: escuro ? 'screen' : 'multiply'}}>
			<svg width="100%" height="100%">
				<filter id="grao">
					<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={Math.floor(frame / 2)} />
					<feColorMatrix type="saturate" values="0" />
				</filter>
				<rect width="100%" height="100%" filter="url(#grao)" />
			</svg>
		</AbsoluteFill>
	);
};

// Faíscas ✦✦✦, cometa vertical, arcos finos e poeira.
const Detalhes: React.FC<{cor: string}> = ({cor}) => {
	const frame = useCurrentFrame();
	const {width, height} = useVideoConfig();
	const estrela = (x: number, y: number, r: number, k: string) => (
		<path
			key={k}
			d={`M${x},${y - r} Q${x + r * 0.12},${y - r * 0.12} ${x + r},${y} Q${x + r * 0.12},${y + r * 0.12} ${x},${y + r} Q${x - r * 0.12},${y + r * 0.12} ${x - r},${y} Q${x - r * 0.12},${y - r * 0.12} ${x},${y - r}Z`}
			fill={cor}
		/>
	);
	const arco = interpolate(frame, [0, 40], [0, 1], {extrapolateRight: 'clamp'});
	const cometaY = height * 0.55 + Math.sin(frame / 30) * 10;
	return (
		<AbsoluteFill>
			<svg width={width} height={height}>
				{[0, 1, 2].map((i) => estrela(width * 0.78 + i * 26, height * 0.06, 9, `e${i}`))}
				<line
					x1={width * 0.9}
					y1={cometaY - height * 0.16}
					x2={width * 0.9}
					y2={cometaY + height * 0.02}
					stroke={cor}
					strokeWidth={1.6}
					opacity={0.9}
				/>
				{estrela(width * 0.9, cometaY - height * 0.16, 12, 'cometa')}
				<circle
					cx={width * 0.72}
					cy={height * 0.72}
					r={width * 0.18}
					fill="none"
					stroke={cor}
					strokeWidth={1.4}
					opacity={0.55}
					strokeDasharray={2 * Math.PI * width * 0.18}
					strokeDashoffset={2 * Math.PI * width * 0.18 * (1 - arco)}
				/>
				<line
					x1={-10}
					y1={height * 0.2}
					x2={width * 0.6 * arco}
					y2={height * 0.05}
					stroke={cor}
					strokeWidth={1.2}
					opacity={0.45}
				/>
				{Array.from({length: 40}, (_, i) => {
					const x = random(`px${i}`) * width;
					const y = (((random(`py${i}`) * height - frame * (0.4 + random(`pv${i}`))) % height) + height) % height;
					return (
						<circle
							key={i}
							cx={x}
							cy={y}
							r={1 + random(`pr${i}`) * 1.6}
							fill={cor}
							opacity={0.15 + random(`po${i}`) * 0.35}
						/>
					);
				})}
			</svg>
		</AbsoluteFill>
	);
};

// Revelação do texto: letra a letra com desfoque (ref. 1), embaralhada (ref. 4) ou palavra a palavra (ref. 3).
const Revela: React.FC<{
	texto: string;
	inicio: number;
	modo: 'letras' | 'embaralhado' | 'palavras';
	estilo: React.CSSProperties;
}> = ({texto, inicio, modo, estilo}) => {
	const frame = useCurrentFrame();
	const partes = modo === 'palavras' ? texto.split(/(\s+)/) : [...texto];
	const ordem = useMemo(() => {
		const idx = partes.map((_, i) => i);
		if (modo === 'embaralhado') idx.sort((a, b) => random(`o${texto}${a}`) - random(`o${texto}${b}`));
		const pos: number[] = [];
		idx.forEach((orig, k) => (pos[orig] = k));
		return pos;
	}, [texto, modo]);
	const passo = modo === 'palavras' ? 5 : 2;
	return (
		<div style={{...estilo, whiteSpace: 'pre'}}>
			{partes.map((ch, i) => {
				const p = interpolate(frame - inicio - ordem[i] * passo, [0, 6], [0, 1], {
					extrapolateLeft: 'clamp',
					extrapolateRight: 'clamp',
				});
				return (
					<span
						key={i}
						style={{display: 'inline-block', opacity: p, filter: p < 1 ? `blur(${(1 - p) * 9}px)` : undefined}}
					>
						{ch}
					</span>
				);
			})}
		</div>
	);
};

const Tipografia: React.FC<{cena: Cena; cor: string}> = ({cena, cor}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const base = Math.min(width, height);
	const estilo = cena.estiloTexto ?? 'editorial';
	const modo = cena.revelar ?? (estilo === 'ouro' ? 'embaralhado' : estilo === 'neutro' ? 'palavras' : 'letras');
	const inicioG = cena.emGrande !== undefined ? Math.round((cena.emGrande - cena.de) * fps) : 6;
	const pPeq = interpolate(frame, [0, 8], [0, 1], {extrapolateRight: 'clamp'});
	// Deriva lenta do bloco de texto (ref. 1).
	const deriva = interpolate(frame, [0, 200], [1, 1.05]);
	const ouro: React.CSSProperties = {
		background: 'linear-gradient(180deg, #fff1b8 0%, #e2b453 38%, #9c6b1c 62%, #f3d27a 100%)',
		WebkitBackgroundClip: 'text',
		backgroundClip: 'text',
		color: 'transparent',
		filter: 'drop-shadow(0 0 10px rgba(255,190,80,0.45))',
	};
	const grande: React.CSSProperties =
		estilo === 'ouro'
			? {fontFamily: gotica, fontSize: base * 0.2, lineHeight: 1, ...ouro}
			: estilo === 'neutro'
				? {fontFamily: inter, fontWeight: 800, fontSize: base * 0.11, color: cor, opacity: 0.85}
				: {fontFamily: poppins, fontWeight: 700, fontSize: base * 0.12, color: cor, letterSpacing: -1, lineHeight: 1};
	const pequeno: React.CSSProperties =
		estilo === 'ouro'
			? {fontFamily: playfair, fontWeight: 700, fontSize: base * 0.045, color: '#f3efe6'}
			: estilo === 'neutro'
				? {fontFamily: inter, fontWeight: 600, fontSize: base * 0.05, color: cor, opacity: 0.75}
				: {fontFamily: dmSerif, fontSize: base * 0.055, color: cor};
	return (
		<AbsoluteFill
			style={{
				alignItems: cena.ladoTexto === 'direita' ? 'flex-end' : cena.ladoTexto === 'esquerda' ? 'flex-start' : 'center',
				padding: `0 ${width * 0.08}px`,
			}}
		>
			<div
				style={{
					position: 'absolute',
					top: `${(cena.posTexto ?? 0.32) * 100}%`,
					transform: `translateY(-50%) scale(${deriva})`,
					textAlign: cena.ladoTexto === 'direita' ? 'right' : cena.ladoTexto === 'esquerda' ? 'left' : 'center',
					display: 'flex',
					flexDirection: 'column',
					alignItems:
						cena.ladoTexto === 'direita' ? 'flex-end' : cena.ladoTexto === 'esquerda' ? 'flex-start' : 'center',
					transformOrigin:
						cena.ladoTexto === 'direita' ? 'right center' : cena.ladoTexto === 'esquerda' ? 'left center' : 'center',
				}}
			>
				{cena.pequeno && (
					<div
						style={{
							...pequeno,
							opacity: pPeq * ((pequeno.opacity as number) ?? 1),
							filter: pPeq < 1 ? `blur(${(1 - pPeq) * 8}px)` : undefined,
						}}
					>
						{cena.pequeno}
					</div>
				)}
				{cena.grande && <Revela texto={cena.grande} inicio={inicioG} modo={modo} estilo={grande} />}
				{cena.abaixo && (
					<Revela
						texto={cena.abaixo}
						inicio={inicioG + cena.grande!.length * 2 + 4}
						modo="palavras"
						estilo={{...pequeno, fontSize: (pequeno.fontSize as number) * 0.9}}
					/>
				)}
			</div>
		</AbsoluteFill>
	);
};

export const Cenario: React.FC<{cena: Cena}> = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const fundo = FUNDO[cena.superficie ?? 'papel'];
	const escuro = cena.superficie === 'escuro';
	const duracao = (cena.ate - cena.de) * fps;
	const p = Math.min(1, frame / Math.max(1, duracao));
	const meiaA = DIST * Math.tan(((FOV / 2) * Math.PI) / 180);
	const meiaL = meiaA * (width / height);
	const camDe = cena.camera?.de ?? [0.3, 0.2, DIST * 1.04];
	const camAte = cena.camera?.ate ?? [-0.2, -0.1, DIST * 0.94];
	const fantasmaX = interpolate(frame, [0, duracao], [0, -width * 0.08]);
	const tinta = cena.tinta
		? interpolate(frame, [duracao - 12, duracao], [0, 0.55], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
		: 0;
	return (
		<AbsoluteFill style={{backgroundColor: fundo.base, overflow: 'hidden'}}>
			{escuro && (
				<AbsoluteFill
					style={{background: 'radial-gradient(ellipse at 50% 35%, rgba(255,255,255,0.07), transparent 65%)'}}
				/>
			)}
			{cena.fantasma && (
				<AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
					<div
						style={{
							fontFamily: anton,
							fontSize: height * 0.2,
							lineHeight: 0.9,
							color: fundo.fantasma,
							whiteSpace: 'nowrap',
							textTransform: 'uppercase',
							transform: `translate(${fantasmaX}px, ${-(cena.posTexto ?? 0.32) * 0}px)`,
							position: 'absolute',
							top: `${(cena.posTexto ?? 0.32) * 100 - 9}%`,
						}}
					>
						{cena.fantasma}
					</div>
				</AbsoluteFill>
			)}
			{cena.objetos && cena.objetos.length > 0 && (
				<ThreeCanvas
					width={width}
					height={height}
					shadows="variance"
					gl={{alpha: true, antialias: true, preserveDrawingBuffer: true}}
					camera={{fov: FOV, position: camDe, near: 0.1, far: 100}}
					style={{position: 'absolute', inset: 0}}
				>
					<Ambiente />
					<Camera de={camDe} ate={camAte} p={p} />
					<ambientLight intensity={escuro ? 0.25 : 0.6} />
					<directionalLight
						position={[-5, 7, 9]}
						intensity={escuro ? 1.6 : 2.4}
						castShadow
						shadow-mapSize-width={2048}
						shadow-mapSize-height={2048}
						shadow-radius={14}
						shadow-blurSamples={20}
						shadow-camera-left={-8}
						shadow-camera-right={8}
						shadow-camera-top={8}
						shadow-camera-bottom={-8}
					/>
					{escuro && <directionalLight position={[6, 3, 4]} intensity={0.8} color="#ffd59a" />}
					<mesh position={[0, 0, -1.4]} receiveShadow>
						<planeGeometry args={[40, 40]} />
						<shadowMaterial opacity={escuro ? 0.6 : 0.32} />
					</mesh>
					<Objetos cena={cena} meiaL={meiaL} meiaA={meiaA} />
				</ThreeCanvas>
			)}
			{(cena.luz ?? 'janela') === 'janela' && <LuzJanela escuro={escuro} />}
			{cena.luz === 'folhas' && <LuzFolhas />}
			<Grao escuro={escuro} />
			{cena.detalhes !== false && <Detalhes cor={fundo.detalhe} />}
			<Tipografia cena={cena} cor={fundo.tinta} />
			{tinta > 0 && <AbsoluteFill style={{backgroundColor: cena.tinta, opacity: tinta, mixBlendMode: 'soft-light'}} />}
		</AbsoluteFill>
	);
};
