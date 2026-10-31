// Storyboard/animatic do gota-1: UMA câmera contínua viajando pela cidade-maquete (cidade.tsx), a gota andando pelo
// trajeto e o estado de cada processo, tudo por chaves de tempo (segundos do vídeo, tempos da narração).
// Os planos (PLANOS) só dão nome aos trechos, títulos e pílulas; câmera e gota seguem uma linha do tempo única, sem corte.
import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import type {Busca} from '../../motor/palavras';
import type {Cena} from '../../motor/plano';
import type {CenaPeca, Pecas} from '../../pecas/peca';
import {poppins} from '../../motor/tema';
import {Gota, type Humor} from './gota';
import {Cidade, ESCALA_GOTA, Fluxo, LinhaTrajeto, LUGARES, tDe, trajeto, type EstadoCidade, type V3} from './cidade';

// ---------------------------------------------------------------- interpolação suave sem passar do ponto
// Hermite monotônico (Fritsch–Carlson): passa por todas as chaves, sem tranco e sem ultrapassar (chaves iguais = parado).
const hermite = (ks: [number, number][], s: number): number => {
	const n = ks.length;
	if (n === 0) return 0;
	if (s <= ks[0][0]) return ks[0][1];
	if (s >= ks[n - 1][0]) return ks[n - 1][1];
	let i = 0;
	while (i < n - 2 && s > ks[i + 1][0]) i++;
	const d = (k: number) => (ks[k + 1][1] - ks[k][1]) / (ks[k + 1][0] - ks[k][0]);
	const tang = (k: number) => {
		if (k === 0) return 0;
		if (k === n - 1) return 0;
		const a = d(k - 1);
		const b = d(k);
		if (a * b <= 0) return 0;
		return (2 * a * b) / (a + b); // média harmônica: não ultrapassa
	};
	const h = ks[i + 1][0] - ks[i][0];
	const u = (s - ks[i][0]) / h;
	const m0 = tang(i) * h;
	const m1 = tang(i + 1) * h;
	const u2 = u * u;
	const u3 = u2 * u;
	return (2 * u3 - 3 * u2 + 1) * ks[i][1] + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * ks[i + 1][1] + (u3 - u2) * m1;
};
const hermite3 = (ks: [number, V3][], s: number): V3 => [0, 1, 2].map((c) => hermite(ks.map(([t, v]) => [t, v[c]]), s)) as V3;
const degrau = <T,>(ks: [number, T][], s: number): T => {
	let v = ks[0][1];
	for (const [t, x] of ks) if (s >= t) v = x;
	return v;
};
const rampa = (s: number, a: number, b: number) => Math.max(0, Math.min(1, (s - a) / (b - a)));

// ---------------------------------------------------------------- câmera (linha do tempo única)
// segundo, posição, alvo, fov e 'g' = posição e alvo relativos à gota (a câmera acompanha a gota nesse trecho).
type ChaveCam = [number, V3, V3, number] | [number, V3, V3, number, 'g'];
const MAPA_POS: V3 = [0, 118, 96];
const MAPA_ALVO: V3 = [0, -6, 1];
export const CAMERA: ChaveCam[] = [
	[0.0, MAPA_POS, MAPA_ALVO, 42],
	[1.3, [-2, 108, 90], [-1, -6, 2], 42],
	// mergulho até o banheiro
	[2.6, [-15.0, 8.4, 44.0], [-16.2, 4.3, 28.4], 40],
	[4.6, [-15.6, 6.0, 37.0], [-16.3, 4.3, 28.4], 40],
	// desce junto com o cano até o esgoto embaixo da rua (câmera presa na gota)
	[6.2, [0.8, 1.6, 10.5], [0, -0.6, 0], 42, 'g'],
	[8.3, [0.8, 1.6, 10.5], [0, -0.6, 0], 42, 'g'],
	[9.6, [1.6, 2.0, 11.5], [1.0, 0.5, 0], 50, 'g'],
	[12.6, [1.6, 2.0, 11.5], [1.0, 0.5, 0], 50, 'g'],
	// "quilômetros no escuro": anda pelo coletor e sobe para ver a estação
	[14.6, [1.2, 1.6, 9.0], [0.8, 0.8, 0], 48, 'g'],
	[16.6, [2.0, 12.0, 38.0], [15.0, 1.0, 26.0], 50],
	// gradeamento (de frente-esquerda: as barras aparecem como um pente)
	[18.2, [6.0, 4.4, 31.8], [9.8, 1.5, 28.3], 44],
	[23.6, [6.4, 4.6, 32.4], [10.0, 1.6, 28.2], 44],
	// tanque de aeração
	[25.2, [15.0, 5.4, 37.0], [15.2, 1.5, 27.6], 42],
	[31.6, [15.3, 4.8, 35.8], [15.2, 1.5, 27.6], 42],
	// decantador
	[33.0, [20.6, 3.4, 38.0], [21.0, 1.9, 28.6], 42],
	[40.2, [21.0, 3.8, 37.2], [21.2, 2.2, 28.6], 42],
	// sobe, segue o canal até o rio e desce o rio até a captação
	[42.0, [32, 18, 26], [22.6, 0.4, 2], 46],
	[44.0, [8, 20, -6], [-6, -1, -25], 46],
	[45.6, [-11.5, 6.5, -10.5], [-16.6, 0.8, -21], 42],
	[48.0, [-14.0, 4.6, -12.2], [-16.9, 1.3, -19.6], 40],
	// filtro de areia e cloração
	[49.4, [-18.3, 5.4, 0.8], [-18.3, 2.0, -10.5], 42],
	[51.0, [-17.8, 4.2, -1.0], [-18.0, 1.5, -10.0], 42],
	[52.2, [-12.4, 4.8, -1.4], [-12.5, 1.5, -11.0], 42],
	[55.4, [-12.6, 4.4, -2.4], [-12.5, 1.5, -11.0], 42],
	// caixa d'água, rede pela face esquerda, cozinha
	[56.8, [-10.5, 14, 15], [-20.5, 10.4, 3.6], 44],
	[57.9, [-36, 3.0, 36], [-22.5, -0.2, 22], 44],
	[58.8, [-19.6, 3.6, 33.8], [-20.7, 2.4, 28.8], 40],
	[60.2, [-19.4, 3.8, 34.4], [-20.7, 2.4, 28.8], 40],
	// volta para o mapa: é a mesma casa
	[62.8, MAPA_POS, MAPA_ALVO, 42],
];
const somar = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const camEm = (s: number) => {
	const g = gotaEm(s);
	const abs = CAMERA.map((c) => (c[4] === 'g' ? ([c[0], somar(g, c[1]), somar(g, c[2]), c[3]] as const) : c));
	const pos = hermite3(abs.map((c) => [c[0], c[1]]), s);
	const alvo = hermite3(abs.map((c) => [c[0], c[2]]), s);
	const fov = hermite(CAMERA.map((c) => [c[0], c[3]]), s);
	return {pos, alvo, fov};
};
const gotaEm = (s: number): V3 => trajeto(hermite(GOTA_T, s));

// ---------------------------------------------------------------- a gota
const GOTA_T: [number, number][] = [
	[0, tDe('vaso')],
	[4.4, tDe('vaso')],
	[5.6, tDe('canoCasa')],
	[8.4, tDe('canoFim')],
	[9.0, tDe('esgoto')],
	[12.8, (tDe('esgoto') + tDe('meioEsgoto')) / 2],
	[15.4, tDe('poco')],
	[16.8, tDe('chegada')],
	[18.4, tDe('grade') - 0.001],
	[22.6, tDe('grade') + 0.0005],
	[24.2, (tDe('grade') + tDe('aeracao')) / 2],
	[25.4, tDe('aeracao')],
	[31.6, tDe('aeracaoFim')],
	[33.2, tDe('decantador')],
	[35.6, tDe('fundoDecantador')],
	[37.6, tDe('vertedor')],
	[40.6, tDe('vertedor') + 0.001],
	[41.9, tDe('rio')],
	[44.2, tDe('captacao')],
	[45.3, tDe('bomba')],
	[48.3, tDe('bomba') + 0.001],
	[49.4, tDe('filtro')],
	[50.8, tDe('filtroFundo')],
	[51.7, tDe('cloro')],
	[55.6, tDe('cloroFim')],
	[56.6, tDe('caixa')],
	[57.4, tDe('rede')],
	[58.0, tDe('casaVolta')],
	[58.6, tDe('torneira')],
	[59.1, tDe('copo')],
];
const GOTA_ESCALA: [number, number][] = [
	[0, ESCALA_GOTA],
	[8.2, ESCALA_GOTA],
	[9.2, 0.3],
	[16.0, 0.3],
	[17.0, ESCALA_GOTA],
	[40.8, ESCALA_GOTA],
	[42.0, 0.7],
	[44.4, 0.7],
	[45.6, ESCALA_GOTA],
	[56.0, ESCALA_GOTA],
	[56.8, 0.45],
	[57.4, 0.45],
	[58.0, ESCALA_GOTA],
];
const HUMOR: [number, Humor][] = [
	[0, 'feliz'],
	[3.4, 'assustada'],
	[9.4, 'enjoada'],
	[17.4, 'assustada'],
	[23.0, 'enjoada'],
	[29.0, 'feliz'],
	[36.4, 'aliviada'],
	[44.0, 'assustada'],
	[48.4, 'feliz'],
	[52.4, 'aliviada'],
	[56.0, 'feliz'],
];
const SUJA: [number, number][] = [
	[0, 0],
	[5.2, 0],
	[8.8, 1],
	[27.4, 1],
	[30.4, 0.55],
	[36.0, 0.3],
	[45.0, 0.2],
	[50.6, 0.05],
	[52.4, 0],
];

// Estado dos processos em cada segundo.
const estadoEm = (s: number, q: number): EstadoCidade => ({
	q,
	casa: {botao: rampa(s, 3.25, 3.4) * (1 - rampa(s, 4.2, 4.4)), descarga: rampa(s, 3.4, 4.6), redemoinho: rampa(s, 3.4, 5.6) * (s - 3.4), torneira: rampa(s, 58.1, 58.6)},
	grade: {rastelo: rampa(s, 21.6, 23.6), lixo: 1 - rampa(s, 23.4, 23.7)},
	aeracao: {limpeza: rampa(s, 27.3, 30.2)},
	decantador: {separa: rampa(s, 32.4, 35.0)},
	bomba: 1,
	filtro: {retido: 0.25 + 0.75 * rampa(s, 49.6, 51.0)},
	cloro: {dose: 1, mortos: rampa(s, 52.3, 53.3)},
	caixa: 0.75,
});

// ---------------------------------------------------------------- planos (para o storyboard e para os rótulos)
type Pilula = {texto: string; de: number; ate: number; ponto: V3 | 'gota' | 'gota+rua'; cor?: string};
export type Plano = {n: number; nome: string; de: number; ate: number; chave: number; titulo?: {texto: string; de: number}; pilulas?: Pilula[]};
const MAPA_PILULAS = (de: number, ate: number): Pilula[] => [
	{texto: 'CASA', de, ate, ponto: [-17.9, 9.5, 25], cor: '#e5484d'},
	{texto: 'ESGOTO', de: de + 0.15, ate, ponto: [-3, 1, 27], cor: '#a8712f'},
	{texto: 'ESTAÇÃO DE ESGOTO', de: de + 0.3, ate, ponto: [16, 5, 25], cor: '#a8712f'},
	{texto: 'RIO', de: de + 0.45, ate, ponto: [8, 0, -26], cor: '#2f8fe0'},
	{texto: 'CAPTAÇÃO', de: de + 0.6, ate, ponto: [-15, 3.5, -22], cor: '#2f8fe0'},
	{texto: 'ESTAÇÃO DE ÁGUA', de: de + 0.75, ate, ponto: [-12, 5, -9], cor: '#2f8fe0'},
	{texto: "CAIXA D'ÁGUA", de: de + 0.9, ate, ponto: [-19, 10, 8], cor: '#2f8fe0'},
];
export const PLANOS: Plano[] = [
	{n: 1, nome: 'Mapa: o caminho inteiro', de: 0, ate: 2.3, chave: 1.25, pilulas: MAPA_PILULAS(0.25, 2.1)},
	{n: 2, nome: 'Descarga', de: 2.3, ate: 5.0, chave: 3.9, pilulas: [{texto: 'VOCÊ', de: 2.5, ate: 4.9, ponto: 'gota', cor: '#2f8fe0'}]},
	{
		n: 3,
		nome: 'Cano da casa → esgoto sob a rua',
		de: 5.0,
		ate: 12.7,
		chave: 10.6,
		titulo: {texto: 'ESGOTO', de: 11.5},
		pilulas: [
			{texto: 'CANO DA CASA', de: 5.6, ate: 8.4, ponto: [-16.5, 2.4, 29.5], cor: '#a8712f'},
			{texto: 'RUA', de: 9.6, ate: 11.4, ponto: 'gota+rua', cor: '#555'},
		],
	},
	{n: 4, nome: 'Quilômetros no escuro → chega na estação', de: 12.8, ate: 16.8, chave: 16.3, titulo: {texto: 'ESTAÇÃO DE TRATAMENTO\nDE ESGOTO', de: 15.1}},
	{
		n: 5,
		nome: 'Gradeamento',
		de: 16.9,
		ate: 24.2,
		chave: 21.4,
		titulo: {texto: 'GRADEAMENTO', de: 22.7},
		pilulas: [
			{texto: 'GRADE DE FERRO', de: 17.5, ate: 19.6, ponto: [10.3, 2.7, 28.2], cor: '#5d6570'},
			{texto: 'PLÁSTICO', de: 19.8, ate: 22.4, ponto: [9.0, 2.2, 27.6], cor: '#e5484d'},
			{texto: 'PANO', de: 20.5, ate: 22.4, ponto: [8.6, 1.5, 28.6], cor: '#e5484d'},
			{texto: 'CELULAR', de: 21.2, ate: 22.4, ponto: [9.0, 0.9, 29.4], cor: '#e5484d'},
		],
	},
	{
		n: 6,
		nome: 'Tratamento biológico',
		de: 24.3,
		ate: 32.1,
		chave: 28.0,
		titulo: {texto: 'TRATAMENTO BIOLÓGICO', de: 30.2},
		pilulas: [
			{texto: 'BACTÉRIAS', de: 26.0, ate: 29.8, ponto: [14.6, 2.4, 28.2], cor: '#4f9a2a'},
			{texto: 'AR', de: 25.0, ate: 27.0, ponto: [16.8, 0.6, 28.4], cor: '#2f8fe0'},
		],
	},
	{
		n: 7,
		nome: 'Decantação',
		de: 32.2,
		ate: 40.5,
		chave: 36.8,
		titulo: {texto: 'DECANTAÇÃO', de: 39.1},
		pilulas: [
			{texto: 'LODO', de: 33.6, ate: 36.0, ponto: [21.0, 0.8, 29.4], cor: '#5e4627'},
			{texto: 'ÁGUA MAIS LIMPA', de: 36.6, ate: 38.9, ponto: [22.2, 3.6, 28.8], cor: '#2f8fe0'},
		],
	},
	{
		n: 8,
		nome: 'Rio → captação (bomba)',
		de: 40.6,
		ate: 48.1,
		chave: 43.2,
		titulo: {texto: 'CAPTAÇÃO', de: 46.8},
		pilulas: [
			{texto: 'RIO', de: 41.9, ate: 43.8, ponto: 'gota', cor: '#2f8fe0'},
			{texto: 'BOMBA', de: 45.0, ate: 46.6, ponto: [-16.9, 2.3, -19], cor: '#e5484d'},
		],
	},
	{
		n: 9,
		nome: 'Estação de água: filtro de areia → cloro',
		de: 48.2,
		ate: 55.6,
		chave: 50.3,
		titulo: {texto: 'TRATAMENTO', de: 54.3},
		pilulas: [
			{texto: 'AREIA', de: 50.2, ate: 51.4, ponto: [-20.2, 1.8, -9], cor: '#c9a85e'},
			{texto: 'CASCALHO', de: 50.4, ate: 51.4, ponto: [-16.4, 0.95, -9], cor: '#8a8880'},
			{texto: 'CLORO', de: 51.6, ate: 53.6, ponto: [-13.6, 3.6, -11], cor: '#9fbf20'},
			{texto: 'MICRÓBIOS', de: 52.2, ate: 53.6, ponto: [-11.6, 2.4, -9.6], cor: '#b04fd6'},
		],
	},
	{
		n: 10,
		nome: "Caixa d'água → torneira → mapa",
		de: 55.7,
		ate: 62.8,
		chave: 58.9,
		pilulas: [
			{texto: "CAIXA D'ÁGUA", de: 55.9, ate: 57.2, ponto: [-20.5, 15.4, 3.4], cor: '#2f8fe0'},
			{texto: 'TORNEIRA', de: 58.2, ate: 59.6, ponto: [-20.8, 3.5, 28.8], cor: '#2f8fe0'},
			...MAPA_PILULAS(61.4, 62.8),
		],
	},
];
// Progresso da linha do trajeto (mapa) e sua opacidade.
const LINHA: [number, number][] = [
	[0, 0],
	[0.15, 0],
	[1.9, 1],
];
const linhaOpac = (s: number) => (s < 3 ? 1 - rampa(s, 2.0, 2.5) : rampa(s, 60.4, 61.2));
const linhaP = (s: number) => (s < 3 ? hermite(LINHA, s) : hermite([[60.4, 0], [61.9, 1]], s));

// ---------------------------------------------------------------- 3D
const Cam: React.FC<{pos: V3; alvo: V3; fov: number}> = ({pos, alvo, fov}) => {
	const camera = useThree((st) => st.camera) as THREE.PerspectiveCamera;
	camera.position.set(pos[0], pos[1], pos[2]);
	camera.fov = fov;
	camera.near = 0.1;
	camera.far = 600;
	camera.updateProjectionMatrix();
	camera.lookAt(alvo[0], alvo[1], alvo[2]);
	return null;
};
const _cam = new THREE.PerspectiveCamera();
const projetar = (p: V3, pos: V3, alvo: V3, fov: number, w: number, h: number): [number, number, boolean] => {
	_cam.fov = fov;
	_cam.aspect = w / h;
	_cam.near = 0.1;
	_cam.far = 600;
	_cam.position.set(pos[0], pos[1], pos[2]);
	_cam.lookAt(alvo[0], alvo[1], alvo[2]);
	_cam.updateProjectionMatrix();
	_cam.updateMatrixWorld();
	const v = new THREE.Vector3(...p).project(_cam);
	return [((v.x + 1) / 2) * w, ((1 - v.y) / 2) * h, v.z < 1];
};

const Titulo: React.FC<{texto: string; p: number}> = ({texto, p}) => (
	<div style={{position: 'absolute', top: 210, width: '100%', textAlign: 'center', opacity: Math.min(1, p * 2), transform: `translateY(${(1 - Math.min(1, p)) * 24}px) scale(${0.85 + 0.15 * Math.min(1, p)})`}}>
		{texto.split('\n').map((l) => (
			<div
				key={l}
				style={{fontFamily: poppins, fontWeight: 900, fontSize: 70, lineHeight: 1.08, color: '#ffd23f', WebkitTextStroke: '12px #1d1d1d', paintOrder: 'stroke fill', letterSpacing: '0.02em', textShadow: '0 8px 18px rgba(0,0,0,0.35)'}}
			>
				{l}
			</div>
		))}
	</div>
);
const PilulaTela: React.FC<{texto: string; x: number; y: number; p: number; cor: string}> = ({texto, x, y, p, cor}) => (
	<div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -100%) scale(${0.6 + 0.4 * Math.min(1, p)})`, transformOrigin: '50% 100%', opacity: Math.min(1, p * 2)}}>
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: 12,
				padding: '10px 24px 10px 18px',
				background: '#ffffff',
				border: '5px solid #1d1d1d',
				borderRadius: 40,
				fontFamily: poppins,
				fontWeight: 800,
				fontSize: 36,
				color: '#1d1d1d',
				whiteSpace: 'nowrap',
				boxShadow: '0 8px 18px rgba(0,0,0,0.25)',
			}}
		>
			<span style={{width: 18, height: 18, borderRadius: 9, background: cor, display: 'inline-block'}} />
			{texto}
		</div>
		<div style={{width: 0, height: 0, margin: '0 auto', borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderTop: '16px solid #1d1d1d'}} />
	</div>
);

// Mostra o mundo no segundo s (usado pela peça e, se quiser, por outras cenas).
export const MundoNoTempo: React.FC<{s: number; q: number}> = ({s, q}) => {
	const {width, height} = useVideoConfig();
	const {pos, alvo, fov} = camEm(s);
	const g = gotaEm(s);
	const escala = hermite(GOTA_ESCALA, s);
	const giro = Math.atan2(pos[0] - g[0], pos[2] - g[2]);
	const estado = estadoEm(s, q);
	const lp = linhaP(s);
	const lo = linhaOpac(s);
	const plano = PLANOS.find((p) => s >= p.de && s < p.ate + 0.1) ?? PLANOS[PLANOS.length - 1];
	// a gota "flutua" levemente; no mapa ela some (fica minúscula)
	const bob = Math.sin(q * 0.15) * 0.03 * escala * 5;
	const mostraGota = s > 1.9 && s < 60.6;
	const pilulas = useMemo(() => PLANOS.flatMap((p) => p.pilulas ?? []), []);
	const ceu: [string, string] = ['#4f9fe6', '#dff0fb'];
	return (
		<AbsoluteFill style={{background: `linear-gradient(180deg, ${ceu[0]} 0%, ${ceu[1]} 62%, #f2f5f7 100%)`}}>
			<ThreeCanvas width={width} height={height} gl={{alpha: true, antialias: true, preserveDrawingBuffer: true}} camera={{fov, position: pos, near: 0.1, far: 600}} style={{position: 'absolute', inset: 0}}>
				<Cam pos={pos} alvo={alvo} fov={fov} />
				<ambientLight intensity={0.95} />
				<hemisphereLight args={['#dff2ff', '#7a5a3a', 0.45]} />
				<directionalLight position={[18, 40, 30]} intensity={1.55} />
				<directionalLight position={[-30, 12, 20]} intensity={0.45} />
				<Cidade {...estado} />
				<Fluxo t0={0.004} t1={0.996} q={q} n={420} vel={2.2} />
				{lo > 0.01 ? <LinhaTrajeto p={lp} opacidade={lo} /> : null}
				{mostraGota ? (
					<Gota humor={degrau(HUMOR, s)} suja={hermite(SUJA, s)} quadro={q} escala={escala} position={[g[0], g[1] + bob, g[2]]} rotation={[0, giro, 0]} />
				) : null}
			</ThreeCanvas>
			{pilulas
				.filter((p) => s >= p.de && s <= p.ate)
				.map((p, i) => {
					const ponto: V3 = p.ponto === 'gota' ? [g[0], g[1] + escala * 2.4, g[2]] : p.ponto === 'gota+rua' ? [g[0] + 0.5, 1.0, 27.5] : p.ponto;
					const [x, y, vis] = projetar(ponto, pos, alvo, fov, width, height);
					const e = Math.min(rampa(s, p.de, p.de + 0.3), 1 - rampa(s, p.ate - 0.2, p.ate));
					if (!vis) return null;
					const meia = (p.texto.length * 25 + 80) / 2 + 16;
					return <PilulaTela key={i} texto={p.texto} x={Math.max(meia, Math.min(width - meia, x))} y={y} p={e} cor={p.cor ?? '#2f8fe0'} />;
				})}
			{plano.titulo && s >= plano.titulo.de ? <Titulo texto={plano.titulo.texto} p={rampa(s, plano.titulo.de, plano.titulo.de + 0.35) * (1 - rampa(s, plano.ate - 0.15, plano.ate + 0.1))} /> : null}
		</AbsoluteFill>
	);
};

export const gotaStoryboard: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const s = cena.de + frame / fps;
	return <MundoNoTempo s={s} q={Math.round(s * fps)} />;
};

export const pecasStoryboard: Pecas = {gotaStoryboard};

export const cenasStoryboard = (b: Busca): Cena[] => {
	const fim = b.say('Talvez a sua').fim + 2.3;
	return [{tipo: 'peca', nome: 'gotaStoryboard', modo: 'cheia', de: 0, ate: fim, dados: {}} as Cena];
};

// Lugares úteis (reexporta para quem for animar os planos finais).
export {LUGARES};
