// Peças exclusivas do depoimento-3-2 (cena tipo 'peca'; chaves com prefixo d32). Tempos em segundos do vídeo editado.
// Câmera 3D de referência: fov 35 a 14,5 de distância (meia altura ~4,57, meia largura ~2,57 unidades; y 0 = meio do quadro).
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
const GL = {alpha: true, antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05};
const CAMERA = {fov: 35, position: [0, 0, 14.5] as [number, number, number], near: 0.1, far: 60};
const yMundo = (px: number) => ((960 - px) / 960) * 14.5 * Math.tan((35 / 2) * (Math.PI / 180));

const useCena = (cena: CenaPeca) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const fim = Math.round((cena.ate - cena.de) * fps);
	const q = (s: unknown) => Math.round(Math.max(0, Number(s) - cena.de) * fps);
	const entrada = interpolate(frame, [0, 7], [0, 1], lim);
	const saida = interpolate(frame, [fim - 7, fim], [1, 0], lim);
	return {frame, fps, width, height, fim, q, entrada, saida, t: frame / fps};
};

const useMats = () =>
	useMemo(
		() => ({
			ouro: new THREE.MeshStandardMaterial({color: OURO, metalness: 1, roughness: 0.22}),
			ouroBrilho: new THREE.MeshStandardMaterial({color: '#ffe3a3', metalness: 0.9, roughness: 0.18, emissive: '#c99a3e', emissiveIntensity: 0.5}),
			roxo: new THREE.MeshPhysicalMaterial({color: '#2a1552', metalness: 0.3, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.15}),
			roxoClaro: new THREE.MeshPhysicalMaterial({color: '#5b34a8', metalness: 0.35, roughness: 0.3, clearcoat: 1}),
			prata: new THREE.MeshStandardMaterial({color: '#d6d8e2', metalness: 1, roughness: 0.22}),
			vidro: new THREE.MeshPhysicalMaterial({color: '#ffffff', metalness: 0, roughness: 0.05, transmission: 0.9, transparent: true, opacity: 0.25, clearcoat: 1}),
		}),
		[],
	);

const Kicker: React.FC<{texto: string; y: number; p: number; cor?: string}> = ({texto, y, p, cor = OURO}) => (
	<div style={{position: 'absolute', top: y, width: '100%', textAlign: 'center', opacity: p, transform: `translateY(${(1 - p) * 16}px)`}}>
		<span style={{fontFamily: poppins, fontWeight: 800, fontSize: 40, letterSpacing: '0.3em', marginRight: '-0.3em', color: cor, textShadow: '0 4px 18px rgba(10,4,24,0.8)'}}>{texto}</span>
	</div>
);

// ---------------------------------------------------------------- gancho: resposta de oração
// Feixes de luz dourada descem do alto sobre a cabeça dela, poeira de luz subindo; "RESPOSTA DE" e, no "oração", ORAÇÃO em ouro 3D.
// dados: {resposta: segundo do "resposta"; oracao: segundo do "oração"}.
const d32Luz: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {fim, frame, width, height, q, entrada, saida, t} = useCena(cena);
	const resp = q(cena.dados?.resposta);
	const ora = Math.max(resp + 6, q(cena.dados?.oracao));
	const desce = interpolate(frame, [0, 16], [0, 1], {...lim, easing: (x) => 1 - Math.pow(1 - x, 3)});
	const kick = interpolate(frame, [resp - 3, resp + 5], [0, 1], lim);
	const clarao = frame >= ora ? Math.exp(-(frame - ora) / 4) : 0;
	const feixes = [-0.32, -0.16, 0, 0.15, 0.3];
	const graos = useMemo(() => Array.from({length: 26}, (_, i) => ({x: ((i * 37) % 100) / 100, v: 0.4 + ((i * 53) % 10) / 14, f: (i * 17) % 60, s: 4 + (i % 4) * 2})), []);
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: saida}}>
			<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(30,15,58,0.85) 0%, rgba(30,15,58,0.45) 22%, rgba(30,15,58,0) 40%)', opacity: entrada}} />
			{/* feixes descendo do alto */}
			<AbsoluteFill style={{mixBlendMode: 'screen', clipPath: `inset(0 0 ${(1 - desce) * 100}% 0)`}}>
				{feixes.map((d, i) => (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: width / 2 - 70 + d * width,
							top: -200,
							width: 140 + (i % 2) * 60,
							height: height * 0.85,
							transformOrigin: '50% 0%',
							transform: `rotate(${-d * 22 + Math.sin(t * 1.3 + i) * 1.5}deg)`,
							background: 'linear-gradient(180deg, rgba(255,226,150,0.75) 0%, rgba(232,194,122,0.32) 45%, rgba(232,194,122,0) 100%)',
							filter: 'blur(18px)',
							opacity: (0.55 + 0.25 * Math.sin(t * 2.2 + i * 1.7)) * (1 + clarao),
						}}
					/>
				))}
			</AbsoluteFill>
			{/* poeira de luz */}
			{graos.map((g, i) => {
				const y = height * (0.75 - (((frame + g.f) * g.v * 6) % (height * 0.7)) / height);
				return <div key={i} style={{position: 'absolute', left: width * (0.18 + g.x * 0.64), top: y, width: g.s, height: g.s, borderRadius: g.s, background: '#ffe9b8', boxShadow: '0 0 12px #ffd27a', opacity: 0.8 * entrada}} />;
			})}
			<Kicker texto="VOCÊS SÃO RESPOSTA DE" y={215} p={kick} />
			<AbsoluteFill style={{filter: 'drop-shadow(0 18px 26px rgba(12,4,28,0.6))'}}>
				<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
					<Luzes quadro={frame} batidas={[ora]} />
					{frame >= ora ? (
						<group scale={1 + 0.1 * clarao}>
							<Linha3D ate={fim - 8} texto="ORAÇÃO" metal="ouro" largura={4.1} y={yMundo(390)} quadro={frame} batida={ora} profundidade={0.5} />
						</group>
					) : null}
				</ThreeCanvas>
			</AbsoluteFill>
			<AbsoluteFill style={{background: '#fff3d6', opacity: 0.35 * clarao}} />
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- nem um terço
// Tela cheia: dois tubos de vidro 3D. OUTRAS enche de prata só até 1/3; no "meninos", ESSES MENINOS enche de ouro até a boca.
// dados: {outras, terco, meninos, entregam} (segundos).
const d32Terco: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {fim, frame, fps, width, height, q, entrada, saida, t} = useCena(cena);
	const m = useMats();
	const outras = q(cena.dados?.outras);
	const terco = Math.max(outras + 6, q(cena.dados?.terco));
	const meninos = Math.max(terco + 6, q(cena.dados?.meninos));
	const entregam = Math.max(meninos + 8, q(cena.dados?.entregam));
	const H = 4.2;
	const nivelA = (1 / 3) * spring({frame: frame - terco + 4, fps, config: {damping: 16, stiffness: 110}}) + 0.08 * interpolate(frame, [outras, terco - 4], [0, 1], lim);
	const nivelB = interpolate(frame, [meninos, entregam], [0, 1], {...lim, easing: (x) => 1 - Math.pow(1 - x, 2.4)});
	const cheio = frame >= entregam ? Math.exp(-(frame - entregam) / 4) : 0;
	const tubo = (x: number, nivel: number, mat: THREE.Material, entra: number) => {
		const p = spring({frame: frame - entra, fps, config: {damping: 14, stiffness: 140}});
		const a = Math.max(0.02, H * Math.min(1, nivel));
		if (frame < entra) return null;
		return (
			<group position={[x, -1.2 - (1 - p) * 6, 0]} scale={0.85}>
				<mesh position={[0, H / 2, 0]} material={m.vidro}>
					<cylinderGeometry args={[0.72, 0.72, H, 40, 1, true]} />
				</mesh>
				<mesh position={[0, a / 2, 0]} material={mat}>
					<cylinderGeometry args={[0.66, 0.66, a, 40]} />
				</mesh>
				<mesh position={[0, -0.08, 0]} material={m.roxoClaro}>
					<cylinderGeometry args={[0.9, 0.9, 0.16, 40]} />
				</mesh>
				{[1 / 3, 2 / 3].map((f) => (
					<mesh key={f} position={[0, H * f, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.roxoClaro}>
						<torusGeometry args={[0.74, 0.025, 8, 40]} />
					</mesh>
				))}
			</group>
		);
	};
	const rot = (lado: number, texto: string, cor: string, entra: number) => (
		<div style={{position: 'absolute', top: 1580, left: lado < 0 ? 130 : 590, width: 360, textAlign: 'center', opacity: interpolate(frame, [entra, entra + 6], [0, 1], lim), fontFamily: poppins, fontWeight: 800, fontSize: 34, letterSpacing: '0.12em', color: cor}}>
			{texto}
		</div>
	);
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: Math.min(entrada, saida)}}>
			<FundoMotion />
			{rot(-1, 'OUTRAS MENTORIAS', '#d6d8e2', outras)}
			{rot(1, 'ESSES MENINOS', OURO, meninos)}
			<AbsoluteFill style={{filter: 'drop-shadow(0 22px 30px rgba(8,2,20,0.65))'}}>
				<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
					<Luzes quadro={frame} batidas={[terco, entregam]} />
					<group rotation={[0.12, Math.sin(t * 0.7) * 0.08, 0]} position={[0, -1.4, 0]}>
						{tubo(-1.25, nivelA, m.prata, outras)}
						<group scale={1 + 0.06 * cheio}>{tubo(1.25, nivelB, m.ouroBrilho, meninos)}</group>
					</group>
					{frame >= terco && frame < meninos ? <Linha3D ate={meninos - 9} texto="NEM 1/3" metal="branco" largura={3.8} y={yMundo(420)} quadro={frame} batida={terco} profundidade={0.4} /> : null}
					{frame >= meninos ? <Linha3D ate={fim - 8} texto="ENTREGAM" metal="ouro" largura={4} y={yMundo(420)} quadro={frame} batida={meninos} profundidade={0.45} /> : null}
				</ThreeCanvas>
			</AbsoluteFill>
			<AbsoluteFill style={{background: '#fff', opacity: 0.25 * cheio}} />
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- prosperidade dos mentorados
// Tela cheia: escada de ouro 3D e cinco mentorados (bonecos roxos) subindo degrau por degrau; PROSPERIDADE em ouro 3D
// e "DOS MENTORADOS" quando ela diz a palavra.
// dados: {prosperidade, mentorados} (segundos).
const Boneco: React.FC<{mat: THREE.Material; cabeca: THREE.Material}> = ({mat, cabeca}) => (
	<group>
		<mesh position={[0, 0.32, 0]} material={mat}>
			<capsuleGeometry args={[0.17, 0.32, 6, 16]} />
		</mesh>
		<mesh position={[0, 0.78, 0]} material={cabeca}>
			<sphereGeometry args={[0.16, 24, 16]} />
		</mesh>
	</group>
);
const d32Sobem: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {fim, frame, fps, width, height, q, entrada, saida, t} = useCena(cena);
	const m = useMats();
	const pros = q(cena.dados?.prosperidade);
	const ment = Math.max(pros + 6, q(cena.dados?.mentorados));
	const degraus = 5;
	const kick = interpolate(frame, [ment - 3, ment + 5], [0, 1], lim);
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: Math.min(entrada, saida)}}>
			<FundoMotion />
			<Kicker texto="DOS MENTORADOS" y={560} p={kick} />
			<AbsoluteFill style={{filter: 'drop-shadow(0 22px 30px rgba(8,2,20,0.65))'}}>
				<ThreeCanvas width={width} height={height} gl={GL} camera={CAMERA} style={{position: 'absolute', inset: 0}}>
					<Luzes quadro={frame} batidas={[pros, ment]} />
					<group position={[0, -2.6, 0]} rotation={[0.25, -0.5 + Math.sin(t * 0.6) * 0.05, 0]}>
						{Array.from({length: degraus}, (_, i) => {
							const p = spring({frame: frame - i * 2, fps, config: {damping: 15, stiffness: 140}});
							return (
								<mesh key={i} position={[(i - 2) * 0.8, (i * 0.5) / 2 + 0.12, 0]} scale={[1, Math.max(0.01, p), 1]} material={i === degraus - 1 ? m.ouroBrilho : i % 2 ? m.ouro : m.roxoClaro}>
									<boxGeometry args={[0.8, i * 0.5 + 0.24, 1.2]} />
								</mesh>
							);
						})}
						{Array.from({length: 5}, (_, k) => {
							// cada boneco sobe, um atrás do outro, até o degrau k (o primeiro vai ao topo)
							const alvo = degraus - 1 - k;
							const sobe = interpolate(frame, [6 + k * 4, ment + 10 + k * 3], [0, alvo], lim);
							const d = Math.floor(sobe);
							const f = sobe - d;
							const salto = Math.sin(f * Math.PI) * 0.35;
							const pos = d + f;
							return (
								<group key={k} position={[(pos - 2) * 0.8, pos * 0.5 + 0.24 + salto, 0.1 + (k % 2) * 0.25]}>
									<Boneco mat={k === 0 && frame > ment ? m.ouro : m.roxo} cabeca={m.prata} />
								</group>
							);
						})}
					</group>
					{frame >= pros ? <Linha3D ate={fim - 8} texto="PROSPERIDADE" metal="ouro" largura={4.6} y={yMundo(400)} quadro={frame} batida={pros} profundidade={0.4} intervalo={1} /> : null}
				</ThreeCanvas>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- totalmente leiga → dois caminhos
// Tela cheia desde o "totalmente leiga". No "tudo que eles me ensinaram": caminho reto em ouro, o ponto voa até a meta passando
// por 3 checks (os ensinamentos). No "demoraria muito tempo pra aprender": o caminho rápido apaga e um caminho longo, em zigue-zague,
// vai sendo traçado devagar, com um X em cada erro.
// dados: {leiga, tudo, chega, demoraria, aprender}
type Pt = [number, number];
const INICIO: Pt = [190, 1470];
const META: Pt = [870, 560];
const LONGO: Pt[] = [INICIO, [900, 1390], [300, 1290], [860, 1170], [230, 1040], [800, 930], [400, 820], [760, 720], META];
const ERROS = [2, 4, 6];
const comprimento = (pts: Pt[]) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
const pontoEm = (pts: Pt[], f: number): Pt => {
	let resto = Math.max(0, Math.min(1, f)) * comprimento(pts);
	for (let i = 1; i < pts.length; i++) {
		const [ax, ay] = pts[i - 1];
		const [bx, by] = pts[i];
		const l = Math.hypot(bx - ax, by - ay);
		if (resto <= l) return [ax + ((bx - ax) * resto) / l, ay + ((by - ay) * resto) / l];
		resto -= l;
	}
	return pts[pts.length - 1];
};
const caminho = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');

const d32Caminhos: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, fim, q, entrada, saida} = useCena(cena);
	const d = (cena.dados ?? {}) as Record<string, number>;
	const leiga = q(d.leiga);
	const tudo = q(d.tudo);
	const chega = Math.max(tudo + 8, q(d.chega));
	const demoraria = q(d.demoraria);
	const aprender = Math.min(fim - 10, q(d.aprender));
	const mola = (de: number, rigidez = 170) => spring({frame: frame - de, fps, config: {damping: 13, stiffness: rigidez}});
	const pTitulo = mola(0);
	const pLeiga = mola(leiga, 200);
	const sairTitulo = interpolate(frame, [tudo - 4, tudo + 4], [1, 0], lim);
	// caminho rápido
	const fRapido = interpolate(frame, [tudo, chega], [0, 1], {...lim, easing: (x) => 1 - Math.pow(1 - x, 3)});
	const apagaRapido = interpolate(frame, [demoraria, demoraria + 8], [1, 0.22], lim);
	const pontoR = pontoEm([INICIO, META], fRapido);
	const pMeta = frame >= chega ? mola(chega, 260) : 0;
	// caminho longo
	const fLongo = interpolate(frame, [demoraria + 2, aprender], [0, 1], lim);
	const LL = comprimento(LONGO);
	const pontoL = pontoEm(LONGO, fLongo);
	const LR = comprimento([INICIO, META]);
	const cheg = (k: number) => comprimento(LONGO.slice(0, k + 1)) / LL;
	const rotulo = frame < demoraria ? {texto: 'COM ELES · RÁPIDO', de: tudo} : {texto: 'SOZINHA · MUITO TEMPO', de: demoraria};
	return (
		<AbsoluteFill style={{opacity: Math.min(entrada, saida)}}>
			<FundoMotion />
			{/* título da dor */}
			{sairTitulo > 0 ? (
				<AbsoluteFill style={{opacity: sairTitulo}}>
					<Kicker texto="EU SOU" y={600} p={pTitulo} />
					<div style={{position: 'absolute', top: 680, width: '100%', textAlign: 'center', transform: `scale(${0.85 + 0.15 * pTitulo})`, opacity: pTitulo}}>
						<span style={{fontFamily: poppins, fontWeight: 900, fontSize: 120, color: '#fff', textShadow: '0 8px 30px rgba(8,3,20,0.7)'}}>TOTALMENTE</span>
					</div>
					{frame >= leiga ? (
						<div style={{position: 'absolute', top: 830, width: '100%', textAlign: 'center', transform: `scale(${0.6 + 0.4 * pLeiga}) rotate(${(1 - pLeiga) * -6}deg)`, opacity: Math.min(1, pLeiga * 1.5)}}>
							<span style={{fontFamily: 'Playfair Display, Georgia, serif', fontStyle: 'italic', fontWeight: 800, fontSize: 150, color: OURO, textShadow: '0 0 34px rgba(232,194,122,0.5)'}}>leiga</span>
						</div>
					) : null}
				</AbsoluteFill>
			) : null}
			{/* mapa dos caminhos */}
			{frame >= tudo - 4 ? (
				<AbsoluteFill style={{opacity: interpolate(frame, [tudo - 4, tudo + 4], [0, 1], lim)}}>
					<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
						<defs>
							<filter id="brilho32" x="-50%" y="-50%" width="200%" height="200%">
								<feGaussianBlur stdDeviation="8" result="b" />
								<feMerge>
									<feMergeNode in="b" />
									<feMergeNode in="SourceGraphic" />
								</feMerge>
							</filter>
						</defs>
						{/* rápido */}
						<g opacity={apagaRapido}>
							<path d={caminho([INICIO, META])} stroke={OURO} strokeWidth={16} strokeLinecap="round" fill="none" strokeDasharray={LR} strokeDashoffset={LR * (1 - fRapido)} filter="url(#brilho32)" />
							{[0.28, 0.52, 0.76].map((f) => {
								const [x, y] = pontoEm([INICIO, META], f);
								const p = fRapido >= f ? mola(tudo + Math.round((chega - tudo) * f), 280) : 0;
								return (
									<g key={f} transform={`translate(${x},${y}) scale(${p})`}>
										<circle r={34} fill="#2a1552" stroke={OURO} strokeWidth={6} />
										<path d="M-14,0 L-4,11 L15,-11" stroke={OURO} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
									</g>
								);
							})}
						</g>
						{/* longo, com erros */}
						{frame >= demoraria ? (
							<g>
								<path d={caminho(LONGO)} stroke="#bdb6cc" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" fill="none" strokeDasharray={`${LL}`} strokeDashoffset={LL * (1 - fLongo)} opacity={0.85} />
								{ERROS.map((k) => {
									const [x, y] = LONGO[k];
									const chegou = fLongo >= cheg(k);
									const p = chegou ? mola(demoraria + 2 + Math.round((aprender - demoraria - 2) * cheg(k)), 300) : 0;
									const tremor = chegou ? Math.sin(frame * 2.2) * 6 * Math.max(0, 1 - p) : 0;
									return (
										<g key={k} transform={`translate(${x + tremor},${y}) scale(${p})`}>
											<circle r={36} fill="#3a2350" stroke="#e9a0b4" strokeWidth={5} />
											<path d="M-13,-13 L13,13 M13,-13 L-13,13" stroke="#e9a0b4" strokeWidth={7} strokeLinecap="round" />
										</g>
									);
								})}
								<circle cx={pontoL[0]} cy={pontoL[1]} r={22} fill="#e9e6f2" stroke="#2a1552" strokeWidth={5} />
							</g>
						) : null}
						{/* início e meta */}
						<g transform={`translate(${INICIO[0]},${INICIO[1]})`}>
							<circle r={30} fill="#2a1552" stroke="#e9e6f2" strokeWidth={6} />
							<text y={78} textAnchor="middle" fontFamily={poppins} fontWeight={800} fontSize={34} fill="#e9e6f2" letterSpacing={4}>
								ZERO
							</text>
						</g>
						<g transform={`translate(${META[0]},${META[1]}) scale(${1 + 0.35 * pMeta * Math.max(0, 1 - (frame - chega) / 14)})`}>
							<circle r={46} fill={frame >= chega ? OURO : '#2a1552'} stroke={OURO} strokeWidth={7} filter={frame >= chega ? 'url(#brilho32)' : undefined} />
							<path d="M-10,22 L-10,-24 L18,-14 L-10,-4" stroke={frame >= chega ? '#2a1552' : OURO} strokeWidth={6} fill="none" strokeLinejoin="round" />
							<text y={-72} textAnchor="middle" fontFamily={poppins} fontWeight={800} fontSize={34} fill={OURO} letterSpacing={4}>
								RESULTADO
							</text>
						</g>
						{/* ponto do caminho rápido */}
						{frame < demoraria ? <circle cx={pontoR[0]} cy={pontoR[1]} r={24} fill="#fff1c9" filter="url(#brilho32)" /> : null}
					</svg>
					<Kicker key={rotulo.texto} texto={rotulo.texto} y={300} p={mola(rotulo.de, 200)} cor={rotulo.texto.startsWith('COM') ? OURO : '#e9e6f2'} />
				</AbsoluteFill>
			) : null}
		</AbsoluteFill>
	);
};

export const pecas: Pecas = {d32Luz, d32Terco, d32Sobem, d32Caminhos};
