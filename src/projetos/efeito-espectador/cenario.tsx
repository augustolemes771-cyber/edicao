// Cenários do efeito-espectador, no mesmo sistema de ilustração 2D plana do experimento-stanford (paleta COR,
// personagens de cabeça redonda e corpo chapado). Tudo mora num "mundo" de 1080×1920 e a CameraMundo enquadra
// um ponto dele com zoom: o prédio é construído UMA vez e toda cena da rua só muda o enquadramento.
import React from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {CenaPeca} from '../../pecas/peca';
import {COR, fonte, lim} from '../experimento-stanford/ilustracao';

export const COR2 = {
	ceu1: '#070b16',
	ceu2: '#111a2e',
	tijolo: '#3a2f33',
	tijoloLinha: '#2e2529',
	tijoloClaro: '#4a3c3f',
	moldura: '#5c5052',
	janelaEscura: '#141b2b',
	acesa: '#f2c66e',
	acesaFundo: '#e0a94e',
	cortina: '#f7dfa4',
	silhueta: '#11141c',
	calcada: '#2f323a',
	calcadaLinha: '#262930',
	rua: '#1b1e25',
	faixa: '#3a3d44',
	poste: '#0f1115',
	luzPoste: '#ffe2a0',
	sangue: '#c9343d',
	sirene: '#3d6bff',
	parede: '#c9c3b4',
	paredeSombra: '#aaa496',
	piso: '#7b6f60',
	pisoLinha: '#6a5f52',
	fumaca: '#d9dde3',
};

// Gerador determinístico (mesma janela sempre acesa/apagada em todo quadro e em toda cena).
export const rnd = (s: number) => {
	const x = Math.sin(s * 127.1 + 311.7) * 43758.5453;
	return x - Math.floor(x);
};

// ---------- Câmera ----------
// Enquadra o ponto (x, y) do mundo no centro da tela com zoom z, indo de `de` para `para` com aceleração suave,
// e uma leve oscilação de câmera na mão — nunca fica parada.
export type Plano = [x: number, y: number, z: number];
export const CameraMundo: React.FC<{cena: CenaPeca; de: Plano; para?: Plano; curva?: 'suave' | 'rapida'; children: React.ReactNode}> = ({cena, de, para = de, curva = 'suave', children}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const dur = Math.max(1, Math.round((cena.ate - cena.de) * fps));
	const e = curva === 'rapida' ? Easing.out(Easing.cubic) : Easing.inOut(Easing.cubic);
	const p = interpolate(frame, [0, dur], [0, 1], {...lim, easing: e});
	const x = de[0] + (para[0] - de[0]) * p + Math.sin(frame / 23) * 3;
	const y = de[1] + (para[1] - de[1]) * p + Math.cos(frame / 29) * 3;
	const z = de[2] + (para[2] - de[2]) * p;
	return (
		<div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transformOrigin: '0 0', transform: `translate(${540 - x * z}px, ${960 - y * z}px) scale(${z})`}}>
			{children}
		</div>
	);
};

// Grão de filme leve (clima de suspense) + faixa escura atrás da legenda.
export const Grao: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<>
		{/* faixa escura atrás da legenda (ela fica a 80% da altura, por cima de janelas acesas) */}
		<div style={{position: 'absolute', left: 0, right: 0, top: 1300, height: 520, background: 'linear-gradient(180deg, transparent 0%, rgba(4,6,12,0.62) 40%, rgba(4,6,12,0.62) 70%, transparent 100%)', pointerEvents: 'none'}} />
		<svg style={{position: 'absolute', inset: 0, opacity: 0.09, mixBlendMode: 'overlay', pointerEvents: 'none'}} width={1080} height={1920}>
			<filter id={`grao${frame % 4}`}>
				<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={frame % 4} />
			</filter>
			<rect width={1080} height={1920} filter={`url(#grao${frame % 4})`} />
		</svg>
		</>
	);
};

// ---------- O prédio ----------
// Grade de janelas: 5 colunas × 6 andares. JANELAS[i] = centro da janela no mundo (alvo da câmera).
export const COLS = 5;
export const ANDARES = 6;
const JX0 = 150;
const JDX = 195;
const JY0 = 330;
const JDY = 190;
export const JW = 120;
export const JH = 150;
export const PREDIO = {x0: 50, x1: 1030, topo: 210, base: 1500};
export const CALCADA = 1500;
export const RUA = 1600;
export const JANELAS = Array.from({length: COLS * ANDARES}, (_, i) => {
	const c = i % COLS;
	const r = Math.floor(i / COLS);
	return {i, c, r, x: JX0 + c * JDX, y: JY0 + r * JDY, acesa: rnd(i + 3) < 0.68, pessoas: rnd(i + 11) < 0.82 ? (rnd(i + 19) < 0.25 ? 2 : 1) : 0};
});
// Ordem em que os espectadores aparecem na contagem (embaralhada, mas fixa).
export const ORDEM = [...JANELAS].sort((a, b) => rnd(a.i + 41) - rnd(b.i + 41)).map((j) => j.i);

// Silhueta de cabeça e ombros atrás do vidro. olhar: -1..1 (cabeça vira pro lado), baixo: olha pra rua.
export const Silhueta: React.FC<{x: number; y: number; s?: number; olhar?: number; cor?: string; olhos?: number; p?: number}> = ({x, y, s = 1, olhar = 0, cor = COR2.silhueta, olhos = 0, p = 1}) => {
	if (p <= 0.01) return null;
	return (
		<g transform={`translate(${x},${y + (1 - p) * 30 * s}) scale(${s})`} opacity={Math.min(1, p)}>
			<path d="M-46 70 C-46 30 -30 18 0 18 C30 18 46 30 46 70 Z" fill={cor} />
			<g transform={`translate(${olhar * 9},0) rotate(${olhar * 8} 0 0)`}>
				<circle cx={0} cy={-6} r={24} fill={cor} />
				{olhos > 0.01 && (
					<g opacity={olhos}>
						<circle cx={-8 + olhar * 6} cy={-2} r={2.6} fill={COR.branco} />
						<circle cx={8 + olhar * 6} cy={-2} r={2.6} fill={COR.branco} />
					</g>
				)}
			</g>
		</g>
	);
};

export type PredioProps = {
	// 0..1: quantos espectadores já apareceram (na ORDEM). 1 = todos.
	espectadores?: number;
	// olhar de todos (pra rua = 0.5 a 1, pro lado = -1..1)
	olhar?: number;
	// brilho dos olhos dos espectadores
	olhos?: number;
	// 0..1: fração das janelas que apagou (na ORDEM inversa)
	apagar?: number;
	// janela destacada (contorno vermelho pulsando)
	destaque?: number | null;
	// janela que abre e tem alguém debruçado gritando
	grito?: {janela: number; p: number} | null;
	// janela com alguém ao telefone
	telefone?: {janela: number; p: number} | null;
	// 0..1: cortinas fechando em todas as janelas
	fechar?: number;
	// espectadores que somem (os que "nunca viram"): 0..1
	sumir?: number;
};

const Janela: React.FC<{j: (typeof JANELAS)[number]; props: PredioProps; frame: number}> = ({j, props, frame}) => {
	const {espectadores = 1, olhar = 0.6, olhos = 0, apagar = 0, destaque = null, grito = null, telefone = null, fechar = 0, sumir = 0} = props;
	const pos = ORDEM.indexOf(j.i);
	const n = ORDEM.length;
	const apagada = pos >= n * (1 - apagar);
	const acesa = j.acesa && !apagada;
	// espectador desta janela entra quando a contagem passa por ela
	const entra = Math.max(0, Math.min(1, espectadores * n - pos));
	const some = rnd(j.i + 71) < 0.7 ? sumir : 0;
	const x0 = j.x - JW / 2;
	const y0 = j.y - JH / 2;
	const tremor = Math.sin(frame / 7 + j.i) * 0.25;
	const abre = grito && grito.janela === j.i ? grito.p : 0;
	const fone = telefone && telefone.janela === j.i ? telefone.p : 0;
	return (
		<g>
			<rect x={x0 - 12} y={y0 - 12} width={JW + 24} height={JH + 30} fill={COR2.moldura} />
			<rect x={x0} y={y0} width={JW} height={JH} fill={acesa ? COR2.acesa : COR2.janelaEscura} />
			{acesa && <rect x={x0} y={y0 + JH * 0.62} width={JW} height={JH * 0.38} fill={COR2.acesaFundo} opacity={0.55} />}
			<clipPath id={`vidro${j.i}`}>
				<rect x={x0} y={y0} width={JW} height={JH} />
			</clipPath>
			<g clipPath={`url(#vidro${j.i})`}>
				{j.pessoas > 0 &&
					Array.from({length: j.pessoas}).map((_, k) => (
						<Silhueta
							key={k}
							x={j.x + (j.pessoas === 2 ? (k ? 26 : -24) : 6) + abre * 0}
							y={y0 + JH * 0.55 + (k ? 8 : 0) - abre * 26}
							s={j.pessoas === 2 ? 0.78 : 0.92 + abre * 0.25}
							olhar={olhar + tremor * 0.2 + (k ? -0.3 : 0)}
							cor={acesa ? COR2.silhueta : '#2a3247'}
							olhos={acesa ? 0 : olhos}
							p={entra * (1 - some)}
						/>
					))}
				{/* cortina: faixa clara de um lado, fecha por cima do vidro */}
				<path
					d={`M${x0} ${y0} L${x0 + 26 + fechar * (JW - 26)} ${y0} C${x0 + 18 + fechar * (JW - 26)} ${y0 + 50} ${x0 + 34 + fechar * (JW - 26)} ${y0 + 100} ${x0 + 22 + fechar * (JW - 26)} ${y0 + JH} L${x0} ${y0 + JH} Z`}
					fill={acesa ? COR2.cortina : '#232c40'}
					opacity={0.92}
				/>
				{fone > 0.01 && (
					<g opacity={fone} transform={`translate(${j.x + 30},${y0 + 52})`}>
						<rect x={-6} y={-16} width={12} height={34} rx={5} fill={COR2.silhueta} />
						{[0, 1, 2].map((a) => (
							<path key={a} d={`M${14 + a * 9} -14 Q${22 + a * 9} 0 ${14 + a * 9} 14`} stroke={COR.vermelho} strokeWidth={3} fill="none" opacity={0.4 + 0.6 * Math.abs(Math.sin(frame / 5 + a))} />
						))}
					</g>
				)}
			</g>
			{/* folha da janela abrindo pra fora */}
			{abre > 0.01 && <rect x={x0 + JW} y={y0} width={14 + abre * 40} height={JH} fill={COR2.moldura} opacity={0.95} />}
			<line x1={j.x} y1={y0} x2={j.x} y2={y0 + JH} stroke={COR2.moldura} strokeWidth={7} opacity={abre > 0.5 ? 0 : 1} />
			<line x1={x0} y1={y0 + JH * 0.45} x2={x0 + JW} y2={y0 + JH * 0.45} stroke={COR2.moldura} strokeWidth={7} opacity={abre > 0.5 ? 0 : 1} />
			<rect x={x0 - 18} y={y0 + JH + 8} width={JW + 36} height={12} fill={COR2.tijoloClaro} />
			{destaque === j.i && (
				<rect x={x0 - 20} y={y0 - 20} width={JW + 40} height={JH + 48} fill="none" stroke={COR.vermelho} strokeWidth={6} opacity={0.6 + 0.4 * Math.sin(frame / 4)} rx={6} />
			)}
		</g>
	);
};

// Céu noturno com estrelas e lua.
export const Ceu: React.FC = () => (
	<g>
		<defs>
			<linearGradient id="ceuEsp" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stopColor={COR2.ceu1} />
				<stop offset="1" stopColor={COR2.ceu2} />
			</linearGradient>
		</defs>
		<rect x={-1200} y={-1200} width={3480} height={4400} fill="url(#ceuEsp)" />
		{Array.from({length: 40}).map((_, i) => (
			<circle key={i} cx={-300 + rnd(i) * 1700} cy={-200 + rnd(i + 99) * 380} r={1 + rnd(i + 7) * 1.6} fill={COR.branco} opacity={0.3 + rnd(i + 3) * 0.5} />
		))}
		<circle cx={880} cy={110} r={46} fill={COR.branco} opacity={0.92} />
		<circle cx={866} cy={98} r={8} fill="#00000014" />
		<circle cx={896} cy={124} r={11} fill="#00000014" />
	</g>
);

// Fachada completa: tijolo, cornija, 30 janelas, térreo com portaria e loja.
export const Fachada: React.FC<PredioProps> = (props) => {
	const frame = useCurrentFrame();
	const {x0, x1, topo, base} = PREDIO;
	return (
		<g>
			{/* prédios vizinhos ao fundo, escuros, pra rua continuar fora do quadro */}
			<rect x={-700} y={420} width={760} height={1100} fill="#1a1f2c" />
			<rect x={1020} y={360} width={800} height={1160} fill="#171c28" />
			{Array.from({length: 18}).map((_, i) => (
				<rect key={i} x={(i % 2 ? 1080 : -640) + (i % 3) * 170} y={460 + Math.floor(i / 6) * 260} width={70} height={100} fill={rnd(i + 200) < 0.3 ? '#c99e5a' : '#0f1320'} opacity={0.8} />
			))}
			<rect x={x0} y={topo} width={x1 - x0} height={base - topo} fill={COR2.tijolo} />
			{Array.from({length: Math.floor((base - topo) / 34)}).map((_, i) => (
				<line key={i} x1={x0} y1={topo + 34 * (i + 1)} x2={x1} y2={topo + 34 * (i + 1)} stroke={COR2.tijoloLinha} strokeWidth={3} />
			))}
			<rect x={x0 - 20} y={topo - 40} width={x1 - x0 + 40} height={50} fill={COR2.moldura} />
			<rect x={x0 - 10} y={topo + 10} width={x1 - x0 + 20} height={14} fill={COR2.tijoloLinha} />
			{JANELAS.map((j) => (
				<Janela key={j.i} j={j} props={props} frame={frame} />
			))}
			{/* térreo */}
			<rect x={x0} y={1420} width={x1 - x0} height={80} fill={COR2.tijoloClaro} />
			<rect x={460} y={1395} width={160} height={105} fill="#0c0f16" />
			<rect x={470} y={1405} width={140} height={95} fill="#3b2a20" />
			<circle cx={590} cy={1455} r={5} fill={COR.dourado} />
			<rect x={100} y={1430} width={300} height={60} fill="#151a26" />
			<rect x={680} y={1430} width={300} height={60} fill="#151a26" />
			<rect x={440} y={1380} width={200} height={14} fill={COR2.moldura} />
		</g>
	);
};

// Calçada, rua e poste com cone de luz.
export const Chao: React.FC<{poste?: number}> = ({poste = 1}) => {
	const frame = useCurrentFrame();
	const pisca = poste * (0.92 + 0.08 * Math.sin(frame / 3) * Math.sin(frame / 11));
	return (
		<g>
			<rect x={-1200} y={CALCADA} width={3480} height={RUA - CALCADA} fill={COR2.calcada} />
			{Array.from({length: 22}).map((_, i) => (
				<line key={i} x1={-1100 + i * 160} y1={CALCADA} x2={-1100 + i * 160} y2={RUA} stroke={COR2.calcadaLinha} strokeWidth={4} />
			))}
			<rect x={-1200} y={RUA} width={3480} height={30} fill="#40444c" />
			<rect x={-1200} y={RUA + 30} width={3480} height={1400} fill={COR2.rua} />
			{Array.from({length: 14}).map((_, i) => (
				<rect key={i} x={-1100 + i * 260} y={RUA + 210} width={140} height={14} fill={COR2.faixa} />
			))}
			{/* poste */}
			<polygon points={`300,1140 160,${RUA + 40} 440,${RUA + 40}`} fill={COR2.luzPoste} opacity={0.13 * pisca} />
			<ellipse cx={300} cy={RUA - 20} rx={170} ry={36} fill={COR2.luzPoste} opacity={0.2 * pisca} />
			<rect x={293} y={1120} width={14} height={RUA - 1120} fill={COR2.poste} />
			<path d="M300 1124 Q300 1100 330 1100 L360 1100" stroke={COR2.poste} strokeWidth={10} fill="none" />
			<rect x={340} y={1100} width={44} height={22} rx={6} fill={COR2.poste} />
			<ellipse cx={362} cy={1124} rx={18} ry={6} fill={COR2.luzPoste} opacity={pisca} />
		</g>
	);
};

// Rua completa: o mundo inteiro (céu, prédio, chão) + o que for passado como filhos (personagens).
export const Rua: React.FC<PredioProps & {poste?: number; children?: React.ReactNode}> = ({poste, children, ...props}) => (
	<svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1080} height={1920} viewBox="0 0 1080 1920">
		<Ceu />
		<Fachada {...props} />
		<Chao poste={poste} />
		{children}
	</svg>
);

// ---------- Personagens ----------
// Pessoa chapada no estilo do Stanford (cabeça redonda, corpo chapado), com cabelo/vestido opcionais.
// Pés em (x, y). olhar: -1..1 move os olhos e a cabeça; anda: fase da caminhada (0 = parado).
export const Pessoa: React.FC<{
	x: number;
	y: number;
	s?: number;
	corpo?: string;
	pele?: string;
	cabelo?: 'curto' | 'longo' | 'nenhum';
	corCabelo?: string;
	olhar?: number;
	braco?: number;
	anda?: number;
	vira?: boolean;
	jaleco?: boolean;
	p?: number;
	sombra?: boolean;
}> = ({x, y, s = 1, corpo = COR.guarda, pele = COR.pele, cabelo = 'curto', corCabelo = '#2a1d16', olhar = 0, braco = 0, anda = 0, vira = false, jaleco = false, p = 1, sombra = true}) => {
	if (p <= 0.01) return null;
	const passo = Math.sin(anda) * 10;
	const balanco = Math.abs(Math.sin(anda)) * 4;
	return (
		<g transform={`translate(${x},${y - balanco * s}) scale(${s * (vira ? -1 : 1)},${s})`} opacity={Math.min(1, p)}>
			{sombra && <ellipse cx={0} cy={0} rx={34} ry={7} fill="#000" opacity={0.3} />}
			<rect x={-20 + passo * 0.6} y={-26} width={17} height={26} rx={6} fill={jaleco ? '#3a3f4a' : corpo} />
			<rect x={3 - passo * 0.6} y={-26} width={17} height={26} rx={6} fill={jaleco ? '#3a3f4a' : corpo} />
			{cabelo === 'longo' && <path d="M-30 -132 Q-36 -84 -24 -70 L24 -70 Q36 -84 30 -132 Z" fill={corCabelo} />}
			<rect x={-34} y={-102} width={68} height={84} rx={16} fill={jaleco ? COR.branco : corpo} />
			{jaleco && <rect x={-5} y={-100} width={10} height={70} fill="#d8d4ca" />}
			<rect x={-46} y={-96} width={15} height={58} rx={7} fill={jaleco ? COR.branco : corpo} transform={`rotate(${-passo * 1.2} -38 -92)`} />
			<rect x={31} y={-96} width={15} height={58} rx={7} fill={jaleco ? COR.branco : corpo} transform={`rotate(${passo * 1.2 - braco * 150} 38 -92)`} />
			<g transform={`translate(${olhar * 4},0)`}>
				<circle cx={0} cy={-128} r={29} fill={pele} />
				{cabelo === 'curto' && <path d="M-29 -132 Q-28 -160 0 -160 Q28 -160 29 -132 Q14 -146 -29 -132 Z" fill={corCabelo} />}
				{cabelo === 'longo' && <path d="M-30 -128 Q-30 -162 0 -162 Q30 -162 30 -128 Q10 -150 -30 -128 Z" fill={corCabelo} />}
				<circle cx={-10 + olhar * 7} cy={-128} r={3.4} fill="#1a1a1a" />
				<circle cx={10 + olhar * 7} cy={-128} r={3.4} fill="#1a1a1a" />
			</g>
		</g>
	);
};

// Kitty: vestido vermelho escuro, cabelo escuro curto ondulado (de cabelo 'longo' pra ler como mulher de longe).
export const Kitty: React.FC<{x: number; y: number; s?: number; olhar?: number; braco?: number; anda?: number; vira?: boolean; p?: number}> = (props) => (
	<Pessoa {...props} corpo="#8e2f3a" pele={COR.peleClara} cabelo="longo" corCabelo="#1f1512" />
);

// Atacante: só uma sombra comprida, sem rosto (nada explícito).
export const Sombra: React.FC<{x: number; y: number; s?: number; anda?: number; p?: number; vira?: boolean}> = ({x, y, s = 1, anda = 0, p = 1, vira}) => (
	<Pessoa x={x} y={y} s={s} anda={anda} p={p} vira={vira} corpo="#07080c" pele="#07080c" cabelo="nenhum" corCabelo="#07080c" sombra={false} />
);

// ---------- Sala do experimento ----------
export const SALA = {parede: 1300, porta: {x: 820, y: 760, w: 180, h: 540}, grade: {x: 170, y: 520}};

// Cadeira simples de perfil-frontal.
export const Cadeira: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
	<g transform={`translate(${x},${y}) scale(${s})`}>
		<rect x={-40} y={-150} width={80} height={90} rx={8} fill="#4b5563" />
		<rect x={-46} y={-66} width={92} height={18} rx={6} fill="#374151" />
		<rect x={-40} y={-50} width={10} height={50} fill="#1f2937" />
		<rect x={30} y={-50} width={10} height={50} fill="#1f2937" />
	</g>
);

// Fumaça: bolhas borradas saindo da grade de ventilação e tomando a sala. p 0..1 = quanto já encheu.
export const Fumaca: React.FC<{p: number}> = ({p}) => {
	const frame = useCurrentFrame();
	if (p <= 0.01) return null;
	const {x, y} = SALA.grade;
	return (
		<g style={{filter: 'blur(14px)'}}>
			{Array.from({length: 26}).map((_, i) => {
				const vida = (frame / 90 + rnd(i)) % 1;
				const alcance = Math.min(1, p * 1.4) * (0.3 + rnd(i + 5) * 0.9);
				const cx = x + (rnd(i + 9) * 900) * alcance + Math.sin(frame / 20 + i) * 20;
				const cy = y + 20 + (rnd(i + 13) * 620) * alcance * (0.4 + vida * 0.6);
				const r = 50 + rnd(i + 2) * 90 * (0.4 + p);
				return <circle key={i} cx={cx} cy={cy} r={r} fill={COR2.fumaca} opacity={Math.min(0.5, 0.15 + p * 0.4) * (0.6 + 0.4 * Math.sin(vida * Math.PI))} />;
			})}
		</g>
	);
};

// Sala do experimento: parede, rodapé, porta à direita, grade de ventilação, alto-falante (interfone).
export const Sala: React.FC<{fumaca?: number; alarme?: number; falante?: number; luzPorta?: number; children?: React.ReactNode}> = ({fumaca = 0, alarme = 0, falante = 0, luzPorta = 0, children}) => {
	const frame = useCurrentFrame();
	const {porta, grade} = SALA;
	const ondas = falante > 0.01;
	return (
		<svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1080} height={1920} viewBox="0 0 1080 1920">
			<rect x={-800} y={-800} width={2680} height={2100} fill={COR2.parede} />
			{Array.from({length: 12}).map((_, i) => (
				<rect key={i} x={-760 + i * 240} y={-800} width={6} height={2100} fill={COR2.paredeSombra} opacity={0.4} />
			))}
			<rect x={-800} y={SALA.parede - 40} width={2680} height={40} fill="#8f897b" />
			<rect x={-800} y={SALA.parede} width={2680} height={1400} fill={COR2.piso} />
			{Array.from({length: 10}).map((_, i) => (
				<line key={i} x1={-800} y1={SALA.parede + 60 * (i + 1) * (1 + i * 0.25)} x2={1880} y2={SALA.parede + 60 * (i + 1) * (1 + i * 0.25)} stroke={COR2.pisoLinha} strokeWidth={4} />
			))}
			{/* porta */}
			<rect x={porta.x - 14} y={porta.y - 14} width={porta.w + 28} height={porta.h + 14} fill="#6b5b4a" />
			<rect x={porta.x} y={porta.y} width={porta.w} height={porta.h} fill={luzPorta > 0.01 ? '#f4e2b0' : '#8a6f55'} />
			{luzPorta > 0.01 && <rect x={porta.x} y={porta.y} width={porta.w * (1 - luzPorta * 0.7)} height={porta.h} fill="#8a6f55" />}
			<circle cx={porta.x + 24} cy={porta.y + porta.h / 2} r={9} fill={COR.dourado} />
			{/* grade de ventilação */}
			<rect x={grade.x - 70} y={grade.y - 40} width={140} height={80} rx={6} fill="#9a958a" />
			{[0, 1, 2, 3].map((i) => (
				<rect key={i} x={grade.x - 58} y={grade.y - 28 + i * 18} width={116} height={9} fill="#5d5a54" />
			))}
			{/* alto-falante / interfone */}
			<g transform="translate(540,470)">
				<rect x={-60} y={-60} width={120} height={120} rx={18} fill="#2f3542" transform={ondas ? `rotate(${Math.sin(frame / 1.5) * 3 * falante})` : undefined} />
				<circle cx={0} cy={0} r={38} fill="#1c212b" />
				{[0, 1, 2].map((r) => (
					<circle key={r} cx={0} cy={0} r={10 + r * 10} fill="none" stroke="#3b4252" strokeWidth={4} />
				))}
				{ondas &&
					[0, 1, 2].map((a) => (
						<g key={a} opacity={falante * (0.3 + 0.7 * Math.abs(Math.sin(frame / 4 + a)))}>
							<path d={`M${80 + a * 30} -40 Q${100 + a * 30} 0 ${80 + a * 30} 40`} stroke={COR.vermelho} strokeWidth={8} fill="none" strokeLinecap="round" />
							<path d={`M${-80 - a * 30} -40 Q${-100 - a * 30} 0 ${-80 - a * 30} 40`} stroke={COR.vermelho} strokeWidth={8} fill="none" strokeLinecap="round" />
						</g>
					))}
			</g>
			{/* luz de alarme */}
			{alarme > 0.01 && <rect x={-800} y={-800} width={2680} height={3500} fill={COR.vermelho} opacity={alarme * (0.08 + 0.12 * Math.max(0, Math.sin(frame / 3)))} />}
			{children}
			<Fumaca p={fumaca} />
		</svg>
	);
};

// ---------- Peças de apoio ----------
// Jornal dobrado com manchete (sépia), visto de cima. carimbo: "EXAGERADO" batendo por cima. rasga: 0..1 parte ao meio.
export const Jornal: React.FC<{x?: number; y?: number; s?: number; rot?: number; manchete: string; carimbo?: number; rasga?: number; p?: number}> = ({x = 540, y = 900, s = 1, rot = 0, manchete, carimbo = 0, rasga = 0, p = 1}) => {
	if (p <= 0.01) return null;
	const metade = (lado: -1 | 1) => (
		<g transform={`translate(${lado * rasga * 90},${rasga * 40 * (lado > 0 ? 1 : -0.4)}) rotate(${lado * rasga * 9})`}>
			<clipPath id={`metade${lado}`}>
				<path d={lado < 0 ? 'M-400 -520 L10 -520 L-20 -260 L25 -20 L-15 220 L15 520 L-400 520 Z' : 'M10 -520 L400 -520 L400 520 L15 520 L-15 220 L25 -20 L-20 -260 Z'} />
			</clipPath>
			<g clipPath={`url(#metade${lado})`}>
				<rect x={-360} y={-480} width={720} height={960} fill={COR.papel} />
				<rect x={-330} y={-450} width={660} height={60} fill="none" />
				<text x={0} y={-400} textAnchor="middle" fontFamily="Georgia, serif" fontWeight={700} fontSize={52} fill="#2a2420">
					THE DAILY NEWS
				</text>
				<rect x={-330} y={-375} width={660} height={5} fill="#2a2420" />
				<text x={-330} y={-345} fontFamily={fonte} fontSize={18} fill="#5a5048">
					NOVA YORK · MARÇO DE 1964
				</text>
				{manchete.split('\n').map((l, i) => (
					<text key={i} x={0} y={-250 + i * 92} textAnchor="middle" fontFamily={fonte} fontWeight={800} fontSize={80} fill="#1d1a17">
						{l}
					</text>
				))}
				<rect x={-330} y={-40} width={300} height={220} fill="#cbbd9f" />
				<Silhueta x={-180} y={70} s={1.6} cor="#8f8169" />
				{Array.from({length: 10}).map((_, i) => (
					<rect key={i} x={0} y={-36 + i * 24} width={330 - (i % 3) * 30} height={10} fill="#bdb29a" />
				))}
				{Array.from({length: 10}).map((_, i) => (
					<rect key={i} x={-330} y={210 + i * 24} width={660 - (i % 4) * 50} height={10} fill="#bdb29a" />
				))}
			</g>
		</g>
	);
	return (
		<g transform={`translate(${x},${y + (1 - p) * 120}) rotate(${rot + (1 - p) * 12}) scale(${s * (0.85 + 0.15 * p)})`} opacity={Math.min(1, p * 1.5)}>
			<rect x={-350} y={-465} width={720} height={960} fill="#000" opacity={0.35} transform="translate(18,22)" />
			{metade(-1)}
			{metade(1)}
			{carimbo > 0.01 && (
				<g transform={`translate(0,-60) rotate(-14) scale(${1 + (1 - Math.min(1, carimbo)) * 1.2})`} opacity={Math.min(1, carimbo * 2)}>
					<rect x={-300} y={-70} width={600} height={140} rx={14} fill="none" stroke={COR.vermelho} strokeWidth={14} />
					<text x={0} y={34} textAnchor="middle" fontFamily={fonte} fontWeight={800} fontSize={100} fill={COR.vermelho} letterSpacing={6}>
						EXAGERADO
					</text>
				</g>
			)}
		</g>
	);
};

// Ondas de som saindo de um ponto (grito, ruído distante).
export const Ondas: React.FC<{x: number; y: number; p: number; cor?: string; escala?: number; lado?: -1 | 1 | 0}> = ({x, y, p, cor = COR.branco, escala = 1, lado = 0}) => {
	const frame = useCurrentFrame();
	if (p <= 0.01) return null;
	return (
		<g transform={`translate(${x},${y}) scale(${escala})`} opacity={p}>
			{[0, 1, 2, 3].map((i) => {
				const f = ((frame / 24 + i / 4) % 1);
				const r = 20 + f * 160;
				const arco = lado === 0 ? `M${-r} 0 A${r} ${r} 0 1 1 ${r} 0` : `M0 ${-r * 0.7} Q${lado * r * 1.2} 0 0 ${r * 0.7}`;
				return <path key={i} d={lado === 0 ? `M0 ${-r} A${r} ${r} 0 1 1 -0.1 ${-r}` : arco} stroke={cor} strokeWidth={6} fill="none" opacity={1 - f} transform={lado === 0 ? undefined : `translate(${lado * f * 60},0)`} />;
			})}
		</g>
	);
};

// Cronômetro / relógio com ponteiro girando (mais seco que o do Stanford, cabe no mundo SVG).
export const Cronometro: React.FC<{x: number; y: number; r?: number; giro: number; p?: number; cor?: string}> = ({x, y, r = 150, giro, p = 1, cor = COR.vermelho}) => {
	if (p <= 0.01) return null;
	const arco = Math.min(359.9, ((giro % 360) + 360) % 360);
	const rad = ((arco - 90) * Math.PI) / 180;
	return (
		<g transform={`translate(${x},${y}) scale(${0.6 + 0.4 * Math.min(1, p)})`} opacity={Math.min(1, p * 1.5)}>
			<rect x={-22} y={-r - 44} width={44} height={30} rx={6} fill={COR.branco} />
			<circle r={r} fill={COR.branco} />
			<path d={`M0 0 L0 ${-r * 0.86} A${r * 0.86} ${r * 0.86} 0 ${arco > 180 ? 1 : 0} 1 ${Math.cos(rad) * r * 0.86} ${Math.sin(rad) * r * 0.86} Z`} fill={cor} opacity={0.25} />
			{Array.from({length: 12}).map((_, i) => (
				<rect key={i} x={-3} y={-r + 12} width={6} height={20} fill="#2a2f3a" transform={`rotate(${i * 30})`} />
			))}
			<rect x={-4} y={-r * 0.8} width={8} height={r * 0.8} rx={4} fill={cor} transform={`rotate(${giro})`} />
			<circle r={12} fill="#1a1d22" />
		</g>
	);
};

// Telefone de disco (anos 60).
export const Telefone: React.FC<{x: number; y: number; s?: number; toca?: number; p?: number}> = ({x, y, s = 1, toca = 0, p = 1}) => {
	const frame = useCurrentFrame();
	if (p <= 0.01) return null;
	const tremor = toca * Math.sin(frame * 1.7) * 4;
	return (
		<g transform={`translate(${x + tremor},${y}) scale(${s})`} opacity={Math.min(1, p * 1.5)}>
			<path d="M-130 60 L-100 -30 L100 -30 L130 60 Z" fill="#1d1f24" />
			<rect x={-150} y={-90} width={300} height={56} rx={28} fill="#26292f" transform={`rotate(${tremor * 0.6})`} />
			<circle cx={0} cy={18} r={56} fill="#e9e4d8" />
			{Array.from({length: 10}).map((_, i) => (
				<circle key={i} cx={Math.cos((i * 30 - 60) * (Math.PI / 180)) * 38} cy={18 + Math.sin((i * 30 - 60) * (Math.PI / 180)) * 38} r={7} fill="#26292f" />
			))}
			<circle cx={0} cy={18} r={14} fill="#26292f" />
		</g>
	);
};

// Balão de pensamento com texto curto.
export const Balao: React.FC<{x: number; y: number; texto: string; p: number; w?: number}> = ({x, y, texto, p, w = 520}) => {
	if (p <= 0.01) return null;
	return (
		<g transform={`translate(${x},${y}) scale(${0.5 + 0.5 * Math.min(1, p)})`} opacity={Math.min(1, p * 1.6)}>
			<circle cx={-w * 0.32} cy={150} r={16} fill={COR.branco} />
			<circle cx={-w * 0.24} cy={110} r={24} fill={COR.branco} />
			<rect x={-w / 2} y={-90} width={w} height={170} rx={85} fill={COR.branco} />
			<text x={0} y={18} textAnchor="middle" fontFamily={fonte} fontWeight={800} fontSize={44} fill="#1d2230">
				{texto}
			</text>
		</g>
	);
};

// Rótulo sobre o mundo (dentro da câmera): para setas e marcações.
export const Rotulo: React.FC<{x: number; y: number; texto: string; p: number; cor?: string; tam?: number}> = ({x, y, texto, p, cor = COR.vermelho, tam = 36}) => {
	if (p <= 0.01) return null;
	const w = texto.length * tam * 0.66 + 50;
	return (
		<g transform={`translate(${x},${y}) scale(${0.7 + 0.3 * Math.min(1, p)})`} opacity={Math.min(1, p * 1.5)}>
			<rect x={-w / 2} y={-tam} width={w} height={tam * 1.8} rx={tam * 0.9} fill={cor} />
			<text x={0} y={tam * 0.3} textAnchor="middle" fontFamily={fonte} fontWeight={800} fontSize={tam} fill={COR.branco}>
				{texto}
			</text>
		</g>
	);
};
