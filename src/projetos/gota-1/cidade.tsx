// Cidade-maquete do gota-1: UM cenário contínuo onde o caminho inteiro da gota existe, em posições fixas.
// Convenções do mundo: y para cima (chão em y = 0.3), +z é a frente (lado da câmera), +x é a direita.
// A maquete é um bloco de terra cortado (como o aterro da ref8): a face da FRENTE (z = 30) e a face da ESQUERDA (x = -24)
// são cortes que mostram o que está enterrado (cano da casa, esgoto, rede de água limpa). Todo prédio que tem processo
// dentro é aberto na frente (+z), como casa de boneca.
//
// Caminho (sentido horário visto de cima):
//   casa (frente-esquerda) → cano desce → esgoto sob a rua da frente (corte) → ETE na frente-direita
//   (gradeamento → tanque de aeração → decantador) → canal pela lateral direita → rio no fundo (corre da direita para
//   a esquerda) → captação (bomba) no fundo-esquerdo → ETA (filtro de areia → cloração) → caixa d'água (torre) →
//   rede enterrada pela face esquerda (corte) → cozinha da mesma casa (torneira).
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {mats as matsGota} from './gota';

export type V3 = [number, number, number];
type V2 = [number, number];

// ---------------------------------------------------------------- medidas do mundo
export const MUNDO = {
	XL: -24, // face esquerda (corte)
	XR: 24,
	ZF: 30, // face da frente (corte)
	ZB: -34,
	CHAO: 0.3, // topo da grama
	FUNDO: -9,
	PLACA: 1.4, // espessura das placas de corte
	RIO: {z0: -30, z1: -22, leito: -2.8, nivel: -1.0},
};
const {XL, XR, ZF, ZB, CHAO, FUNDO, PLACA} = MUNDO;
const RIO = MUNDO.RIO;
export const ESCALA_GOTA = 0.2;

// ---------------------------------------------------------------- materiais (uma vez só)
const std = (cor: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
	new THREE.MeshStandardMaterial({color: cor, flatShading: true, roughness: 0.8, metalness: 0.02, ...extra});
const transp = (cor: string, opacity: number, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
	std(cor, {transparent: true, opacity, depthWrite: false, roughness: 0.25, ...extra});
const criar = () => ({
	grama: std('#7ccf5b'),
	gramaEsc: std('#5fb347'),
	terra: std('#b9763f'),
	terraEsc: std('#7f4d29'),
	rocha: std('#64402a'),
	leito: std('#c9b27a'),
	asfalto: std('#545a64'),
	faixa: std('#f6f4ea'),
	calcada: std('#ddd7cb'),
	concreto: std('#d6cfc2'),
	concretoDuplo: std('#cfc8bb', {side: THREE.DoubleSide}),
	concretoEsc: std('#a69d90'),
	corteConcreto: std('#bdb5a7'),
	parede: std('#f4e4c4'),
	telhado: std('#d9653d'),
	telhadoEsc: std('#b44f2e'),
	janela: std('#3d6fa8', {roughness: 0.3}),
	branco: std('#f7f9fb'),
	preto: std('#25282d'),
	cinza: std('#9aa3ad'),
	ferro: std('#5d6570', {metalness: 0.3, roughness: 0.5}),
	amarelo: std('#ffcf3a'),
	laranja: std('#ff8a3d'),
	vermelho: std('#e5484d'),
	azul: std('#2f6fd6'),
	verde: std('#2fa36b'),
	madeira: std('#b07a45'),
	madeiraEsc: std('#7b5230'),
	cano: std('#a7b0ba', {side: THREE.DoubleSide}),
	canoInt: std('#6f7782', {side: THREE.DoubleSide}),
	canoBorda: std('#e3e7ec'),
	canoLimpo: std('#4f8fe0', {side: THREE.DoubleSide}),
	canoSujo: std('#8f7a55', {side: THREE.DoubleSide}),
	vidro: transp('#cfefff', 0.28, {side: THREE.DoubleSide}),
	esgoto: transp('#7a6233', 0.92),
	aguaSuja: transp('#8a7f45', 0.42),
	aguaMedia: transp('#6f9a7a', 0.38),
	aguaLimpa: transp('#4fc3f7', 0.55),
	aguaCorte: transp('#4fb6f0', 0.75),
	rio: transp('#3b9ee6', 0.88, {emissive: '#0d3f6a', emissiveIntensity: 0.15}),
	espuma: std('#eaf6ff'),
	areia: std('#ecd49a'),
	areiaEsc: std('#d2b676'),
	cascalho: std('#9c9a92'),
	lodo: std('#4a3119'),
	lodoClaro: std('#6b4a22'),
	turvo: transp('#7a5a2a', 0.5),
	sujeira: std('#6b5025'),
	bacteria: std('#8ddc4f', {flatShading: false, roughness: 0.5}),
	bacteriaEsc: std('#4f9a2a'),
	microbio: std('#b04fd6', {flatShading: false}),
	cloro: std('#d6f25a', {emissive: '#9fbf20', emissiveIntensity: 0.25}),
	bolha: transp('#ffffff', 0.7, {flatShading: false}),
	azulejo: std('#d7eef3'),
	azulejoCoz: std('#e9f3e2'),
	papelSala: std('#f7d9a8'),
	papelQuarto: std('#d8cdf2'),
	piso: std('#c99b6a'),
	pisoBanh: std('#b9d7df'),
	louca: std('#ffffff', {flatShading: false, roughness: 0.3}),
	loucaDupla: std('#ffffff', {flatShading: false, roughness: 0.3, side: THREE.DoubleSide}),
	instancia: std('#ffffff'),
	linhaSuja: new THREE.MeshBasicMaterial({color: '#e0892a', depthTest: false, transparent: true}),
	linhaLimpa: new THREE.MeshBasicMaterial({color: '#2fa8ff', depthTest: false, transparent: true}),
	linhaBorda: new THREE.MeshBasicMaterial({color: '#ffffff', depthTest: false, transparent: true}),
	brilho: new THREE.MeshBasicMaterial({color: '#fff6c0'}),
});
let _m: ReturnType<typeof criar> | null = null;
export const M = () => (_m ??= criar());
export type MatsCidade = ReturnType<typeof criar>;
type Mat = THREE.Material | THREE.Material[];

// ---------------------------------------------------------------- geometrias compartilhadas
export const GEO = {
	caixa: new THREE.BoxGeometry(1, 1, 1),
	cil: new THREE.CylinderGeometry(1, 1, 1, 18),
	cil8: new THREE.CylinderGeometry(1, 1, 1, 8),
	esf: new THREE.IcosahedronGeometry(1, 1),
	esfLisa: new THREE.SphereGeometry(1, 14, 10),
	pedra: new THREE.IcosahedronGeometry(1, 0),
	cone: new THREE.ConeGeometry(1, 1, 8),
	prisma: (() => {
		// prisma triangular (telhado de duas águas): base 1×1 em x/z, cumeeira ao longo de x, altura 1
		const sh = new THREE.Shape();
		sh.moveTo(-0.5, 0);
		sh.lineTo(0.5, 0);
		sh.lineTo(0, 1);
		sh.closePath();
		const g = new THREE.ExtrudeGeometry(sh, {depth: 1, bevelEnabled: false});
		g.translate(0, 0, -0.5);
		g.rotateY(Math.PI / 2);
		return g;
	})(),
	meioTubo: new THREE.CylinderGeometry(1, 1, 1, 22, 1, true, Math.PI / 2, Math.PI), // metade de trás (z < 0), eixo y
	meioCil: new THREE.CylinderGeometry(1, 1, 1, 26, 1, false, Math.PI / 2, Math.PI), // meio cilindro sólido (tampa em cima/baixo)
	meioCone: new THREE.ConeGeometry(1, 1, 26, 1, false, Math.PI / 2, Math.PI),
	meioConeAberto: new THREE.ConeGeometry(1, 1, 26, 1, true, Math.PI / 2, Math.PI),
	cilAberto: new THREE.CylinderGeometry(1, 0.8, 1, 20, 1, true),
	toro: new THREE.TorusGeometry(1, 0.1, 6, 24),
	meioToro: new THREE.TorusGeometry(1, 0.06, 6, 30, Math.PI),
	disco: new THREE.CircleGeometry(1, 20),
	// triângulo com a ponta para baixo em (0,0) e base em y = 1 (largura 2): corte de um cone
	triangulo: (() => {
		const sh = new THREE.Shape();
		sh.moveTo(0, 0);
		sh.lineTo(1, 1);
		sh.lineTo(-1, 1);
		sh.closePath();
		return new THREE.ShapeGeometry(sh);
	})(),
	plano: new THREE.PlaneGeometry(1, 1),
};

// ---------------------------------------------------------------- primitivas
const rnd = (i: number, s = 0) => {
	const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
	return x - Math.floor(x);
};
export {rnd};

// Caixa por cantos (mais fácil de casar medidas): de [x0,y0,z0] até [x1,y1,z1].
export const Bc: React.FC<{a: V3; b: V3; m: Mat; rot?: V3}> = ({a, b, m, rot}) => (
	<mesh
		geometry={GEO.caixa}
		material={m}
		position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]}
		scale={[Math.abs(b[0] - a[0]) || 0.001, Math.abs(b[1] - a[1]) || 0.001, Math.abs(b[2] - a[2]) || 0.001]}
		rotation={rot}
	/>
);
// Caixa por centro e tamanho.
export const Bx: React.FC<{p: V3; s: V3; m: Mat; r?: V3}> = ({p, s, m, r}) => <mesh geometry={GEO.caixa} material={m} position={p} scale={s} rotation={r} />;
// Cilindro vertical por centro, raio e altura.
export const Cy: React.FC<{p: V3; r: number; h: number; m: Mat; rot?: V3; g?: THREE.BufferGeometry}> = ({p, r, h, m, rot, g = GEO.cil}) => (
	<mesh geometry={g} material={m} position={p} scale={[r, h, r]} rotation={rot} />
);
export const Es: React.FC<{p: V3; r: number | V3; m: Mat; g?: THREE.BufferGeometry; rot?: V3}> = ({p, r, m, g = GEO.esf, rot}) => (
	<mesh geometry={g} material={m} position={p} scale={typeof r === 'number' ? [r, r, r] : r} rotation={rot} />
);

const _q = new THREE.Quaternion();
const _up = new THREE.Vector3(0, 1, 0);
// Cano fechado de A até B (qualquer direção).
export const Tubo: React.FC<{a: V3; b: V3; r: number; m: Mat}> = ({a, b, r, m}) => {
	const va = new THREE.Vector3(...a);
	const vb = new THREE.Vector3(...b);
	const d = vb.clone().sub(va);
	const len = d.length();
	_q.setFromUnitVectors(_up, d.clone().normalize());
	const e = new THREE.Euler().setFromQuaternion(_q);
	return <mesh geometry={GEO.cil} material={m} position={va.add(vb).multiplyScalar(0.5).toArray() as V3} scale={[r, len, r]} rotation={[e.x, e.y, e.z]} />;
};
// Cano com curva (cotovelos) passando por vários pontos.
export const Canos: React.FC<{pts: V3[]; r: number; m: Mat; juntas?: Mat}> = ({pts, r, m, juntas}) => (
	<group>
		{pts.slice(1).map((b, i) => (
			<Tubo key={i} a={pts[i]} b={b} r={r} m={m} />
		))}
		{pts.map((p, i) => (
			<Es key={'j' + i} p={p} r={r * (juntas ? 1.25 : 1.0)} m={juntas ?? m} g={GEO.esfLisa} />
		))}
	</group>
);

// Cano CORTADO ao meio no plano da face (só a metade de trás), com a borda da parede clara: dá para ver o que vai dentro.
// Segmento no plano XY em z = zc (aberto para +z). Se 'esq', o segmento é dado em (z, y) e o corte abre para −x, em x = zc.
export const TuboCorte: React.FC<{a: V2; b: V2; r: number; zc: number; m?: Mat; esq?: boolean; borda?: number}> = ({a, b, r, zc, m, esq, borda = 0.12}) => {
	const mt = M();
	const dx = b[0] - a[0];
	const dy = b[1] - a[1];
	const len = Math.hypot(dx, dy);
	const ang = Math.atan2(dy, dx) - Math.PI / 2;
	const c: V2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
	const corpo = (
		<group position={[c[0], c[1], 0]} rotation={[0, 0, ang]}>
			<mesh geometry={GEO.meioTubo} material={m ?? mt.canoInt} scale={[r, len, r]} />
			{[-1, 1].map((l) => (
				<mesh key={l} geometry={GEO.caixa} material={mt.canoBorda} position={[l * (r + borda / 2), 0, 0.01]} scale={[borda, len, 0.04]} />
			))}
		</group>
	);
	return esq ? (
		<group position={[zc, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
			{corpo}
		</group>
	) : (
		<group position={[0, 0, zc]}>{corpo}</group>
	);
};

// Líquido no fundo de um cano cortado que corre ao longo de x (segmento de círculo abaixo do nível).
const geoLiquido = (() => {
	const cache = new Map<string, THREE.BufferGeometry>();
	return (r: number, nivel: number, len: number) => {
		const k = `${r}|${nivel}|${len}`;
		let g = cache.get(k);
		if (!g) {
			const sh = new THREE.Shape();
			const psi0 = Math.asin(Math.max(-1, Math.min(1, nivel / r)));
			sh.moveTo(0, -r);
			for (let i = 0; i <= 16; i++) {
				const p = -Math.PI / 2 + ((psi0 + Math.PI / 2) * i) / 16;
				sh.lineTo(r * Math.cos(p), r * Math.sin(p));
			}
			sh.lineTo(0, nivel);
			sh.closePath();
			g = new THREE.ExtrudeGeometry(sh, {depth: len, bevelEnabled: false});
			g.rotateY(Math.PI / 2); // extrusão → +x, forma u → −z
			cache.set(k, g);
		}
		return g;
	};
})();

// Instâncias: muitos objetos iguais numa chamada de desenho só (árvores, casas, janelas, pedrinhas...).
export type ItemInst = {p: V3; s?: V3 | number; r?: V3; c?: string};
const _o = new THREE.Object3D();
const _c = new THREE.Color();
const aplicar = (im: THREE.InstancedMesh, itens: ItemInst[]) => {
	itens.forEach((it, i) => {
		_o.position.set(it.p[0], it.p[1], it.p[2]);
		const s = it.s ?? 1;
		if (typeof s === 'number') _o.scale.setScalar(s);
		else _o.scale.set(s[0], s[1], s[2]);
		const r = it.r ?? [0, 0, 0];
		_o.rotation.set(r[0], r[1], r[2]);
		_o.updateMatrix();
		im.setMatrixAt(i, _o.matrix);
		if (it.c) im.setColorAt(i, _c.set(it.c));
	});
	im.count = itens.length;
	im.instanceMatrix.needsUpdate = true;
	if (im.instanceColor) im.instanceColor.needsUpdate = true;
};
export const Inst: React.FC<{geo: THREE.BufferGeometry; m: THREE.Material; itens: ItemInst[]}> = ({geo, m, itens}) => {
	const obj = useMemo(() => {
		const im = new THREE.InstancedMesh(geo, m, Math.max(1, itens.length));
		im.frustumCulled = false;
		aplicar(im, itens);
		return im;
	}, [geo, m, itens]);
	return <primitive object={obj} />;
};
// Instâncias que mudam a cada quadro (bolhas, partículas): o objeto é criado uma vez e as matrizes são reescritas.
export const InstVivo: React.FC<{geo: THREE.BufferGeometry; m: THREE.Material; max: number; itens: ItemInst[]}> = ({geo, m, max, itens}) => {
	const obj = useMemo(() => {
		const im = new THREE.InstancedMesh(geo, m, max);
		im.frustumCulled = false;
		return im;
	}, [geo, m, max]);
	aplicar(obj, itens.slice(0, max));
	return <primitive object={obj} />;
};

// Placa de terra cortada: polígono (u, v) extrudado. Na frente: u = x, v = y, ocupa z ∈ [ZF − PLACA, ZF].
// Na esquerda: u = z, v = y, ocupa x ∈ [XL, XL + PLACA].
const geoPlaca = (pts: V2[]) => {
	const sh = new THREE.Shape(pts.map(([u, v]) => new THREE.Vector2(u, v)));
	return new THREE.ExtrudeGeometry(sh, {depth: PLACA, bevelEnabled: false});
};

// ---------------------------------------------------------------- o trajeto da gota
// Pontos por onde a gota passa (centro da gota), em ordem. Os que têm nome são os PONTOS do caminho.
const R0 = ESCALA_GOTA;
const ROTA: [string | null, number, number, number][] = [
	['vaso', -16.45, 4.78, 28.3],
	[null, -16.45, 4.35, 28.3],
	['canoCasa', -16.5, 3.6, 29.5],
	['canoFim', -16.5, -1.45, 29.5],
	[null, -13.6, -2.5, 29.5],
	['esgoto', -12.6, -4.15, 29.35],
	['meioEsgoto', 1.0, -4.15, 29.35],
	['poco', 6.6, -4.15, 29.35],
	[null, 7.2, -3.6, 29.35],
	[null, 7.2, 1.0, 29.35],
	['chegada', 7.6, 1.75, 28.6],
	[null, 8.5, 1.75, 28.3],
	['grade', 9.75, 1.75, 28.3],
	[null, 11.4, 1.75, 28.3],
	[null, 12.4, 1.9, 28.3],
	['aeracao', 13.4, 1.6, 28.4],
	[null, 15.0, 0.9, 28.6],
	[null, 16.6, 1.8, 28.4],
	['aeracaoFim', 17.7, 2.9, 28.4],
	[null, 19.6, 2.9, 28.9],
	['decantador', 20.4, 2.5, 29.0],
	['fundoDecantador', 21.4, 1.8, 29.0],
	[null, 22.6, 2.6, 29.0],
	['vertedor', 23.3, 3.15, 28.7],
	[null, 23.8, 3.1, 28.7],
	[null, 23.8, 1.0, 27.4],
	['canal', 22.9, 0.6, 26.4],
	[null, 22.9, 0.6, -20.5],
	['rio', 21.5, -0.85, -24.2],
	[null, 12, -0.85, -26.4],
	[null, 2, -0.85, -25.2],
	[null, -9, -0.85, -26.2],
	['captacao', -15.6, -0.9, -24.6],
	[null, -16.9, -0.6, -23.6],
	[null, -16.9, 1.2, -21.4],
	['bomba', -16.9, 1.2, -19.0],
	[null, -16.9, 1.2, -16.4],
	[null, -18.3, 4.0, -15.2],
	[null, -18.3, 3.4, -9.6],
	['filtro', -18.3, 2.85, -8.95],
	[null, -18.3, 1.7, -8.95],
	[null, -18.3, 0.5, -8.95],
	['filtroFundo', -16.0, 0.5, -8.95],
	[null, -14.2, 0.55, -9.1],
	['cloro', -13.6, 1.55, -9.6],
	[null, -12.0, 1.55, -9.7],
	[null, -11.0, 1.55, -9.6],
	['cloroFim', -11.0, 1.2, -8.4],
	[null, -11.0, 1.2, -1.0],
	[null, -20.5, 1.2, -1.0],
	['torre', -20.5, 1.2, 4.0],
	[null, -20.5, 10.6, 4.0],
	['caixa', -20.5, 12.0, 3.4],
	[null, -21.5, 10.5, 3.4],
	[null, -21.5, 9.5, 3.4],
	[null, -23.65, 9.5, 3.4],
	['rede', -23.65, 0.0, 3.4],
	[null, -23.65, -1.2, 3.4],
	[null, -23.65, -1.2, 29.7],
	['casaVolta', -20.8, -1.2, 29.7],
	[null, -20.8, 1.75, 29.62],
	[null, -20.8, 1.75, 29.35],
	[null, -20.8, 3.0, 29.35],
	[null, -20.8, 3.0, 28.95],
	['torneira', -20.8, 2.75, 28.78],
	['copo', -20.8, 2.25, 28.75],
];

// Polilinha com curvas arredondadas nos cantos e parâmetro por comprimento (velocidade constante em t).
const montarCurva = () => {
	const P = ROTA.map((p) => new THREE.Vector3(p[1], p[2], p[3]));
	const pts: THREE.Vector3[] = [];
	const marco: number[] = []; // índice em pts de cada ponto da ROTA
	for (let i = 0; i < P.length; i++) {
		if (i === 0 || i === P.length - 1) {
			marco.push(pts.length);
			pts.push(P[i].clone());
			continue;
		}
		const a = P[i - 1];
		const b = P[i];
		const c = P[i + 1];
		const r = Math.min(0.7, a.distanceTo(b) * 0.45, b.distanceTo(c) * 0.45);
		const p0 = b.clone().add(a.clone().sub(b).setLength(r));
		const p1 = b.clone().add(c.clone().sub(b).setLength(r));
		const base = pts.length;
		for (let k = 0; k <= 6; k++) {
			const t = k / 6;
			pts.push(
				p0
					.clone()
					.multiplyScalar((1 - t) * (1 - t))
					.add(b.clone().multiplyScalar(2 * t * (1 - t)))
					.add(p1.clone().multiplyScalar(t * t)),
			);
		}
		marco.push(base + 3);
	}
	const acum = [0];
	for (let i = 1; i < pts.length; i++) acum.push(acum[i - 1] + pts[i].distanceTo(pts[i - 1]));
	const total = acum[acum.length - 1];
	return {pts, acum, total, marcoT: marco.map((i) => acum[i] / total)};
};
const CURVA = montarCurva();

// Posição da gota em t ∈ [0, 1] (0 = no vaso, 1 = no copo da cozinha).
export const trajeto = (t: number): V3 => {
	const {pts, acum, total} = CURVA;
	const d = Math.max(0, Math.min(1, t)) * total;
	let lo = 0;
	let hi = acum.length - 1;
	while (hi - lo > 1) {
		const mid = (lo + hi) >> 1;
		if (acum[mid] <= d) lo = mid;
		else hi = mid;
	}
	const seg = acum[hi] - acum[lo] || 1;
	const f = (d - acum[lo]) / seg;
	const p = pts[lo].clone().lerp(pts[hi], f);
	return [p.x, p.y, p.z];
};
// Direção do movimento em t (vetor unitário).
export const direcao = (t: number): V3 => {
	const a = new THREE.Vector3(...trajeto(t - 0.002));
	const b = new THREE.Vector3(...trajeto(t + 0.002));
	const d = b.sub(a);
	if (d.lengthSq() < 1e-9) return [0, 0, 1];
	d.normalize();
	return [d.x, d.y, d.z];
};
export const COMPRIMENTO_TRAJETO = CURVA.total;

// Pontos com nome: posição e t no trajeto.
export type NomePonto =
	| 'vaso'
	| 'canoCasa'
	| 'canoFim'
	| 'meioEsgoto'
	| 'aeracaoFim'
	| 'fundoDecantador'
	| 'esgoto'
	| 'poco'
	| 'chegada'
	| 'grade'
	| 'aeracao'
	| 'decantador'
	| 'vertedor'
	| 'canal'
	| 'rio'
	| 'captacao'
	| 'bomba'
	| 'filtro'
	| 'filtroFundo'
	| 'cloro'
	| 'cloroFim'
	| 'torre'
	| 'caixa'
	| 'rede'
	| 'casaVolta'
	| 'torneira'
	| 'copo';
export const PONTOS = Object.fromEntries(
	ROTA.map((p, i) => [p[0], {pos: [p[1], p[2], p[3]] as V3, t: CURVA.marcoT[i]}] as const).filter(([n]) => n !== null),
) as Record<NomePonto, {pos: V3; t: number}>;
export const tDe = (n: NomePonto) => PONTOS[n].t;

// Onde fica cada lugar (para câmera e rótulos).
export const LUGARES = {
	casa: [-17.9, 3.6, 25.2] as V3,
	banheiro: [-15.7, 5.4, 26.8] as V3,
	cozinha: [-20.1, 2.0, 26.8] as V3,
	esgoto: [-3, -3.8, 29.5] as V3,
	ete: [16, 1.5, 25.5] as V3,
	grade: [10, 1.4, 28.2] as V3,
	aeracao: [15.2, 1.6, 26] as V3,
	decantador: [21, 2, 28.8] as V3,
	rio: [0, -1, -26] as V3,
	captacao: [-17, 0.8, -21] as V3,
	eta: [-15.5, 1.8, -11.5] as V3,
	filtro: [-18.5, 1.8, -10] as V3,
	cloracao: [-12.5, 1.5, -10] as V3,
	caixa: [-20.5, 12, 4] as V3,
};

// ---------------------------------------------------------------- terreno (bloco cortado)
// Furos da face da frente (desenhados como peças separadas em volta do caminho enterrado).
const PECAS_FRENTE: V2[][] = [
	// grande peça de baixo/direita com o caminho escavado por cima
	[
		[XL, -6.5],
		[XR, -6.5],
		[XR, CHAO],
		[8.0, CHAO],
		[8.0, -5.0],
		[-13.4, -5.0],
		[-13.4, -3.05],
		[-17.0, -1.95],
		[-17.0, CHAO],
		[-20.35, CHAO],
		[-20.35, -1.6],
		[XL, -1.6],
	],
	// canto esquerdo acima da rede de água limpa
	[
		[XL, -0.8],
		[-21.25, -0.8],
		[-21.25, CHAO],
		[XL, CHAO],
	],
	// ilhas entre o cano da casa, os poços de visita e o poço de chegada
	[
		[-16.0, CHAO],
		[-16.0, -1.0],
		[-13.4, -2.0],
		[-13.4, -2.75],
		[-6.75, -2.75],
		[-6.75, CHAO],
	],
	[
		[-5.25, CHAO],
		[-5.25, -2.75],
		[1.25, -2.75],
		[1.25, CHAO],
	],
	[
		[2.75, CHAO],
		[2.75, -2.75],
		[6.4, -2.75],
		[6.4, CHAO],
	],
];
const ZP = ZF - PLACA;
const PECAS_ESQ: V2[][] = [
	[
		[RIO.z1, -6.5],
		[ZP, -6.5],
		[ZP, -1.6],
		[3.0, -1.6],
		[3.0, CHAO],
		[RIO.z1, CHAO],
	],
	[
		[3.8, CHAO],
		[3.8, -0.8],
		[ZP, -0.8],
		[ZP, CHAO],
	],
];
// Pedrinhas nas faces cortadas (fora dos furos): densidade de detalhe como na ref8.
const dentroFuro = (x: number, y: number) =>
	(y > -5.3 && x > -13.8 && x < 8.4 && y < -2.4) ||
	(x > -17.4 && x < -12.8 && y > -3.4) ||
	(x > -7.1 && x < -4.9 && y > -3) ||
	(x > 0.9 && x < 3.1 && y > -3) ||
	(x > 6.0 && x < 8.4) ||
	(x < -20 && y > -2.0);
const PEDRAS_FRENTE: ItemInst[] = Array.from({length: 120})
	.map((_, i) => {
		const x = XL + 0.6 + rnd(i, 1) * (XR - XL - 1.2);
		const y = -6.2 + rnd(i, 2) * 6.0;
		return {x, y, i};
	})
	.filter(({x, y}) => !dentroFuro(x, y) && y < -0.4)
	.map(({x, y, i}) => ({p: [x, y, ZF + 0.02] as V3, s: [0.12 + rnd(i, 3) * 0.22, 0.08 + rnd(i, 4) * 0.12, 0.05] as V3, r: [0, 0, rnd(i, 5) * 3] as V3, c: ['#8d5a33', '#d39a62', '#6d4529', '#a8a29a'][i % 4]}));
const PEDRAS_ESQ: ItemInst[] = Array.from({length: 70})
	.map((_, i) => ({z: RIO.z1 + 0.6 + rnd(i, 7) * (ZP - RIO.z1 - 1), y: -6.2 + rnd(i, 8) * 5.6, i}))
	.filter(({z, y}) => !(z > 2.6 && y > -2.0))
	.map(({z, y, i}) => ({p: [XL - 0.02, y, z] as V3, s: [0.05, 0.08 + rnd(i, 4) * 0.12, 0.12 + rnd(i, 3) * 0.22] as V3, r: [rnd(i, 5) * 3, 0, 0] as V3, c: ['#8d5a33', '#d39a62', '#6d4529', '#a8a29a'][i % 4]}));

const Terreno: React.FC = () => {
	const mt = M();
	const placasF = useMemo(() => PECAS_FRENTE.map(geoPlaca), []);
	const placasE = useMemo(() => PECAS_ESQ.map(geoPlaca), []);
	const corpoMats = useMemo(() => [mt.terra, mt.terraEsc, mt.grama, mt.rocha, mt.terraEsc, mt.terra], [mt]);
	return (
		<group>
			{/* rocha embaixo de tudo */}
			<Bc a={[XL, FUNDO, ZB]} b={[XR, -6.5, ZF]} m={mt.rocha} />
			{/* corpo do bloco (atrás das placas de corte) */}
			<Bc a={[XL + PLACA, -6.5, RIO.z1]} b={[XR, CHAO, ZP]} m={corpoMats} />
			{placasF.map((g, i) => (
				<mesh key={'f' + i} geometry={g} material={[mt.terra, mt.terraEsc]} position={[0, 0, ZP]} />
			))}
			{placasE.map((g, i) => (
				<mesh key={'e' + i} geometry={g} material={[mt.terra, mt.terraEsc]} position={[XL + PLACA, 0, 0]} rotation={[0, -Math.PI / 2, 0]} />
			))}
			{/* faixas de solo (camadas) nas faces cortadas */}
			<Bc a={[XL, -6.5, ZF]} b={[XR, -5.6, ZF + 0.015]} m={mt.terraEsc} />
			<Bc a={[XL - 0.015, -6.5, RIO.z1]} b={[XL, -5.6, ZF]} m={mt.terraEsc} />
			<Bc a={[XL, -6.5, ZB - 0.015]} b={[XR, -5.6, ZB]} m={mt.terraEsc} />
			<Inst geo={GEO.esf} m={mt.instancia} itens={PEDRAS_FRENTE} />
			<Inst geo={GEO.esf} m={mt.instancia} itens={PEDRAS_ESQ} />
			{/* grama por cima das placas (o corte mostra a faixa verde no topo, como na ref5) */}
			<Bc a={[XL, CHAO, ZP]} b={[XR, CHAO + 0.04, ZF]} m={mt.grama} />
			<Bc a={[XL, CHAO, RIO.z1]} b={[XL + PLACA, CHAO + 0.04, ZP]} m={mt.grama} />
			{/* rio: leito, água e margem do fundo */}
			<Bc a={[XL, -6.5, RIO.z0]} b={[XR, RIO.leito, RIO.z1]} m={[mt.terra, mt.terra, mt.leito, mt.rocha, mt.terra, mt.terra]} />
			<Bc a={[XL, -6.5, ZB]} b={[XR, CHAO, RIO.z0]} m={[mt.terra, mt.terra, mt.grama, mt.rocha, mt.terraEsc, mt.terra]} />
			<Bc a={[XL, RIO.leito, RIO.z0 + 0.02]} b={[XR, RIO.nivel, RIO.z1 - 0.02]} m={mt.rio} />
			{/* pedras das margens */}
			<Inst
				geo={GEO.pedra}
				m={mt.instancia}
				itens={Array.from({length: 46}, (_, i) => ({
					p: [XL + 0.5 + (i % 23) * 2.08 + rnd(i, 1), RIO.nivel + 0.05, i < 23 ? RIO.z1 - 0.15 : RIO.z0 + 0.15] as V3,
					s: 0.25 + rnd(i, 2) * 0.25,
					r: [rnd(i, 3), rnd(i, 4), 0] as V3,
					c: ['#9c9a92', '#b4b0a6', '#86847c'][i % 3],
				}))}
			/>
		</group>
	);
};

// Ondinhas e folhas descendo o rio (da direita para a esquerda).
const RioVivo: React.FC<{q: number}> = ({q}) => {
	const mt = M();
	const itens: ItemInst[] = Array.from({length: 40}, (_, i) => {
		const x = XR - ((rnd(i, 1) * 48 + q * 0.12) % 48);
		return {p: [x, RIO.nivel + 0.02, RIO.z0 + 0.8 + rnd(i, 2) * 6.4] as V3, s: [0.9 + rnd(i, 3), 0.03, 0.12] as V3};
	});
	return <InstVivo geo={GEO.caixa} m={mt.espuma} max={40} itens={itens} />;
};

// ---------------------------------------------------------------- ruas e cidade
type Rua = {a: V2; b: V2}; // retângulo em (x, z)
const RUAS: Rua[] = [
	{a: [-13.2, 24.4], b: [6.4, ZF]}, // rua da frente (em cima do esgoto)
	{a: [XL + PLACA, 14.6], b: [XR, 17.6]}, // avenida
	{a: [-1.5, -21.6], b: [1.5, 24.4]}, // rua norte-sul (vai até a ponte)
	{a: [-9.4, -4.2], b: [21.6, -1.4]}, // rua do meio
];
const Ruas: React.FC = () => {
	const mt = M();
	const faixas: ItemInst[] = [];
	for (const r of RUAS) {
		const lx = r.b[0] - r.a[0];
		const lz = r.b[1] - r.a[1];
		const horiz = lx > lz;
		const n = Math.floor((horiz ? lx : lz) / 2.2);
		for (let i = 0; i < n; i++) {
			const f = (i + 0.5) / n;
			faixas.push(
				horiz
					? {p: [r.a[0] + f * lx, CHAO + 0.125, (r.a[1] + r.b[1]) / 2] as V3, s: [0.9, 0.01, 0.12] as V3}
					: {p: [(r.a[0] + r.b[0]) / 2, CHAO + 0.125, r.a[1] + f * lz] as V3, s: [0.12, 0.01, 0.9] as V3},
			);
		}
	}
	return (
		<group>
			{RUAS.map((r, i) => (
				<Bc key={i} a={[r.a[0], CHAO, r.a[1]]} b={[r.b[0], CHAO + 0.12, r.b[1]]} m={mt.asfalto} />
			))}
			<Inst geo={GEO.caixa} m={mt.faixa} itens={faixas} />
			{/* calçadas */}
			<Bc a={[-13.2, CHAO, 23.4]} b={[6.4, CHAO + 0.2, 24.4]} m={mt.calcada} />
			<Bc a={[XL + PLACA, CHAO, 17.6]} b={[-1.5, CHAO + 0.2, 18.4]} m={mt.calcada} />
			<Bc a={[1.5, CHAO, 17.6]} b={[XR, CHAO + 0.2, 18.4]} m={mt.calcada} />
			{/* ponte sobre o rio */}
			<Bc a={[-1.9, CHAO - 0.2, RIO.z0 - 0.5]} b={[1.9, CHAO + 0.12, RIO.z1 + 0.5]} m={mt.concreto} />
			<Bc a={[-1.5, CHAO + 0.12, RIO.z0 - 0.5]} b={[1.5, CHAO + 0.14, RIO.z1 + 0.5]} m={mt.asfalto} />
			{[-1.8, 1.8].map((x) => (
				<Bc key={x} a={[x - 0.1, CHAO + 0.12, RIO.z0 - 0.5]} b={[x + 0.1, CHAO + 0.7, RIO.z1 + 0.5]} m={mt.branco} />
			))}
			<Bc a={[-1.2, RIO.leito, -26.4]} b={[1.2, CHAO - 0.2, -25.6]} m={mt.concretoEsc} />
			<Bc a={[-1.5, CHAO, RIO.z0 - 4]} b={[1.5, CHAO + 0.12, RIO.z0 - 0.5]} m={mt.asfalto} />
		</group>
	);
};

// Prédios e casinhas do resto da cidade (instanciados). Cada item: centro x/z, largura, profundidade, altura, cor.
type Predio = [number, number, number, number, number, string, boolean?]; // x, z, larg, prof, alt, cor, telhado?
const PREDIOS: Predio[] = [
	// quarteirão central-esquerdo (casas)
	[-8, 12, 3.2, 3, 2.6, '#f2d6a2', true],
	[-4, 12, 3.2, 3, 2.6, '#cfe3f5', true],
	[-8, 7.6, 3.2, 3, 2.6, '#f7c6c0', true],
	[-4, 7.6, 3.2, 3, 2.6, '#e8eec4', true],
	[-8, 3.0, 3.2, 3, 2.6, '#d8e6d0', true],
	[-4, 3.0, 3.2, 3, 2.6, '#f2d6a2', true],
	[-14.5, 12.0, 3.2, 3, 2.6, '#cfe3f5', true],
	[-14.5, 8.0, 3.2, 3, 2.6, '#f7c6c0', true],
	// quarteirão central-direito (prédios)
	[5, 11.5, 4.5, 4, 4.4, '#e9e4da'],
	[11, 11.5, 4, 4, 5.8, '#c7d6e6'],
	[17, 11.5, 4.5, 4, 3.0, '#efd9b5'],
	[5, 4, 4.5, 4.5, 5.8, '#d7d0e8'],
	[11.5, 3.5, 4.5, 4, 3.0, '#f2c9a8'],
	[17.5, 4.5, 4, 5, 4.4, '#e3e6e9'],
	// acima da rua do meio (casas e prédios baixos)
	[5, -8, 4, 4, 4, '#f2d6a2'],
	[11, -7.5, 3.4, 3.2, 2.6, '#cfe3f5', true],
	[15.5, -7.5, 3.4, 3.2, 2.6, '#f7c6c0', true],
	[5, -15, 4, 4, 4.4, '#e8eec4'],
	[11, -13, 3.4, 3.2, 2.6, '#d8e6d0', true],
	[15.5, -13, 3.4, 3.2, 2.6, '#f2d6a2', true],
	[11, -18.5, 3.4, 3, 2.6, '#efd9b5', true],
	[15.5, -18.5, 3.4, 3, 2.6, '#cfe3f5', true],
	// margem do fundo
	[-12, -32.2, 3, 2.6, 2.4, '#f7c6c0', true],
	[8, -32.2, 3, 2.6, 2.4, '#cfe3f5', true],
	[14, -32.2, 3, 2.6, 2.4, '#f2d6a2', true],
];
const PREDIOS_SEM_REPETIR = PREDIOS;
const CORPOS: ItemInst[] = PREDIOS_SEM_REPETIR.map(([x, z, l, p, h, c]) => ({p: [x, CHAO + h / 2, z] as V3, s: [l, h, p] as V3, c}));
const TELHADOS: ItemInst[] = PREDIOS_SEM_REPETIR.filter((p) => p[6]).map(([x, z, l, p, h], i) => ({
	p: [x, CHAO + h, z] as V3,
	s: [l + 0.4, 1.3, p + 0.4] as V3,
	c: ['#d9653d', '#c9553a', '#e07a4a'][i % 3],
}));
const LAJES: ItemInst[] = PREDIOS_SEM_REPETIR.filter((p) => !p[6]).map(([x, z, l, p, h]) => ({p: [x, CHAO + h + 0.1, z] as V3, s: [l + 0.2, 0.2, p + 0.2] as V3, c: '#9aa3ad'}));
const JANELAS: ItemInst[] = PREDIOS_SEM_REPETIR.flatMap(([x, z, l, p, h, , tel], k) => {
	const out: ItemInst[] = [];
	const andares = tel ? 1 : Math.floor((h - 0.6) / 1.4);
	const cols = Math.max(1, Math.floor(l / 1.3));
	for (let a = 0; a < andares; a++)
		for (let c = 0; c < cols; c++) {
			const xx = x - l / 2 + (l / cols) * (c + 0.5);
			const yy = CHAO + 0.9 + a * 1.4 + (tel ? 0.3 : 0);
			if (tel && c === Math.floor(cols / 2) && cols > 1) {
				out.push({p: [xx, CHAO + 0.75, z + p / 2 + 0.02] as V3, s: [0.6, 1.3, 0.05] as V3, c: '#8a5a32'}); // porta
				continue;
			}
			out.push({p: [xx, yy, z + p / 2 + 0.02] as V3, s: [0.55, 0.65, 0.05] as V3, c: k % 2 ? '#3d6fa8' : '#4a7fb8'});
		}
	return out;
});

const Arvores: React.FC<{lista: V3[]}> = ({lista}) => {
	const mt = M();
	const troncos = useMemo(() => lista.map(([x, z, s]) => ({p: [x, CHAO + 0.5 * s, z] as V3, s: [0.15 * s, 1 * s, 0.15 * s] as V3, c: '#7b5230'})), [lista]);
	const copas = useMemo(
		() =>
			lista.map(([x, z, s], i) => ({
				p: [x, CHAO + 1.5 * s, z] as V3,
				s: [0.85 * s, (0.95 + rnd(i, 9) * 0.3) * s, 0.85 * s] as V3,
				r: [0, rnd(i, 4) * 3, 0] as V3,
				c: ['#5cb94a', '#6fc455', '#4fa83f', '#7fd15e'][i % 4],
			})),
		[lista],
	);
	return (
		<group>
			<Inst geo={GEO.cil8} m={mt.instancia} itens={troncos} />
			<Inst geo={GEO.pedra} m={mt.instancia} itens={copas} />
		</group>
	);
};
// [x, z, escala]
const ARVORES: V3[] = [
	// margem do fundo
	...Array.from({length: 18}, (_, i) => [XL + 1.5 + i * 2.6 + rnd(i, 1), -31.2 - rnd(i, 2) * 2.2, 0.8 + rnd(i, 3) * 0.6] as V3).filter(([x]) => Math.abs(x) > 2.4 && Math.abs(x - 8) > 2 && Math.abs(x - 14) > 2 && Math.abs(x + 12) > 2),
	// margem da frente do rio
	[-6, -20.6, 0.9],
	[-9, -20.2, 1.1],
	[3.6, -20.4, 0.8],
	[8, -20.8, 1.0],
	[19.5, -20.5, 1.0],
	// praça (quarteirão do meio esquerdo)
	[-7.5, -7, 1.2],
	[-4, -9.5, 1.0],
	[-7, -12.5, 1.3],
	[-3.5, -15, 1.1],
	[-6.5, -17.5, 0.9],
	[-3.5, -19, 1.0],
	// avenida e ruas
	[-11, 18.9, 0.9],
	[-6, 18.9, 0.9],
	[3, 18.9, 0.9],
	[8, 18.9, 0.9],
	[13, 19.2, 0.9],
	[19, 19.2, 0.9],
	[-10.5, 13.3, 0.8],
	[-12, -3, 0.9],
	[-22.2, 16.4, 0.9],
	[-22.4, 19.5, 1.0],
	[-11, 21.8, 0.8],
	[-8.5, 21.5, 1.0],
	[-5, 22, 0.8],
	[4.5, 21.8, 0.8],
	[20.5, -1.2, 0.8],
	[2.6, -1.0 - 3.3, 0.7],
	[-21.8, -5, 0.9],
	[-22.2, 9.8, 0.9],
	[-13, 4.5, 1.0],
	[-12.5, 0.2, 0.8],
];

const Carro: React.FC<{p: V3; cor: string; giro?: number}> = ({p, cor, giro = 0}) => {
	const mt = M();
	return (
		<group position={p} rotation={[0, giro, 0]}>
			<Bx p={[0, 0.42, 0]} s={[1.9, 0.5, 0.95]} m={useMemo(() => std(cor), [cor])} />
			<Bx p={[-0.1, 0.84, 0]} s={[1.0, 0.4, 0.85]} m={mt.janela} />
			{[-0.6, 0.6].flatMap((x) =>
				[-0.48, 0.48].map((z) => <Cy key={`${x}${z}`} p={[x, 0.2, z]} r={0.2} h={0.14} m={mt.preto} rot={[Math.PI / 2, 0, 0]} g={GEO.cil8} />),
			)}
			<Bx p={[0.96, 0.5, 0.3]} s={[0.03, 0.12, 0.2]} m={mt.amarelo} />
			<Bx p={[0.96, 0.5, -0.3]} s={[0.03, 0.12, 0.2]} m={mt.amarelo} />
		</group>
	);
};
const Poste: React.FC<{p: V3; giro?: number}> = ({p, giro = 0}) => {
	const mt = M();
	return (
		<group position={p} rotation={[0, giro, 0]}>
			<Cy p={[0, 1.4, 0]} r={0.06} h={2.8} m={mt.ferro} g={GEO.cil8} />
			<Bx p={[0.35, 2.78, 0]} s={[0.7, 0.07, 0.07]} m={mt.ferro} />
			<Bx p={[0.65, 2.7, 0]} s={[0.3, 0.12, 0.2]} m={mt.amarelo} />
		</group>
	);
};
// Cerca: postes e duas réguas ao longo de uma linha (x,z) → (x,z).
const Cerca: React.FC<{a: V2; b: V2}> = ({a, b}) => {
	const mt = M();
	const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
	const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
	const n = Math.max(2, Math.round(len / 1.2));
	const postes = useMemo(
		() => Array.from({length: n + 1}, (_, i) => ({p: [a[0] + ((b[0] - a[0]) * i) / n, CHAO + 0.45, a[1] + ((b[1] - a[1]) * i) / n] as V3, s: [0.07, 0.9, 0.07] as V3})),
		[a[0], a[1], b[0], b[1]],
	);
	return (
		<group>
			<Inst geo={GEO.caixa} m={mt.cinza} itens={postes} />
			{[0.45, 0.8].map((y) => (
				<Bx key={y} p={[(a[0] + b[0]) / 2, CHAO + y, (a[1] + b[1]) / 2]} s={[len, 0.04, 0.04]} r={[0, -ang, 0]} m={mt.cinza} />
			))}
		</group>
	);
};

// Parte fixa do bairro (não muda com o tempo: desenhada uma vez pelo React).
const BairroFixo = React.memo(() => {
	const mt = M();
	return (
		<group>
			<Ruas />
			<Inst geo={GEO.caixa} m={mt.instancia} itens={CORPOS} />
			<Inst geo={GEO.prisma} m={mt.instancia} itens={TELHADOS} />
			<Inst geo={GEO.caixa} m={mt.instancia} itens={LAJES} />
			<Inst geo={GEO.caixa} m={mt.instancia} itens={JANELAS} />
			<Arvores lista={ARVORES} />
			{/* praça */}
			<Bc a={[-9.2, CHAO, -21]} b={[-1.7, CHAO + 0.05, -4.4]} m={mt.gramaEsc} />
			<Bc a={[-6.2, CHAO, -14.0]} b={[-4.4, CHAO + 0.07, -10.6]} m={mt.calcada} />
			<Cy p={[-5.3, CHAO + 0.3, -12.3]} r={0.9} h={0.5} m={mt.concreto} />
			<Cy p={[-5.3, CHAO + 0.5, -12.3]} r={0.75} h={0.1} m={mt.aguaLimpa} />
			{/* postes */}
			{[-11, -3.5, 4.6].map((x) => (
				<Poste key={x} p={[x, CHAO + 0.2, 23.8]} giro={-Math.PI / 2} />
			))}
			{[-10, 4, 18].map((x) => (
				<Poste key={'a' + x} p={[x, CHAO + 0.2, 18.0]} giro={-Math.PI / 2} />
			))}
		</group>
	);
});
const Bairro: React.FC<{q: number}> = ({q}) => {
	const mt = M();
	const ida = ((q * 0.1) % 30) - 15;
	return (
		<group>
			<BairroFixo />
			{/* carros */}
			<Carro p={[-3 + ((q * 0.09) % 18) - 9, CHAO + 0.12, 27.2]} cor="#e5484d" />
			<Carro p={[3 - ((q * 0.07) % 18) + 3, CHAO + 0.12, 25.6]} cor="#ffcf3a" giro={Math.PI} />
			<Carro p={[ida, CHAO + 0.12, 15.4]} cor="#2f6fd6" />
			<Carro p={[-ida + 4, CHAO + 0.12, 16.8]} cor="#ffffff" giro={Math.PI} />
			<Carro p={[0.7, CHAO + 0.12, ((q * 0.08) % 36) - 20]} cor="#2fa36b" giro={-Math.PI / 2} />
			<Carro p={[12 - ((q * 0.06) % 20), CHAO + 0.12, -2.2]} cor="#ff8a3d" giro={Math.PI} />
			{/* nuvens */}
			{(
				[
					[-14, 18, -10, 2.2],
					[10, 21, -24, 2.8],
					[18, 16, 6, 1.8],
					[-4, 24, -38, 3.2],
				] as [number, number, number, number][]
			).map(([x, y, z, s], i) => (
				<group key={i} position={[x + Math.sin(q * 0.004 + i) * 2, y, z]} scale={s}>
					{(
						[
							[0, 0, 0, 1],
							[1, 0.15, 0.1, 0.8],
							[-1, 0.1, 0, 0.75],
							[0.35, 0.55, 0, 0.7],
						] as [number, number, number, number][]
					).map(([a, b, c, r], k) => (
						<Es key={k} p={[a, b, c]} r={r} m={mt.branco} g={GEO.pedra} />
					))}
				</group>
			))}
		</group>
	);
};

// ---------------------------------------------------------------- a casa (casa de boneca, aberta na frente)
// Térreo: cozinha (esquerda) e sala (direita). Em cima: quarto (esquerda) e banheiro (direita).
export const CASA = {x0: -22.6, x1: -13.2, z0: 20.6, z1: 29.85, piso: CHAO + 0.25, laje: 3.75, teto: 7.2, meio: -17.9};
export type EstadoCasa = {descarga?: number; redemoinho?: number; torneira?: number; botao?: number; q?: number};
export const Casa: React.FC<EstadoCasa> = ({descarga = 0, redemoinho = 0, torneira = 0, botao = 0, q = 0}) => {
	const mt = M();
	const {x0, x1, z0, z1, piso, laje, teto, meio} = CASA;
	const e = 0.25; // parede
	const andar2 = laje + 0.25;
	const xb = -16.45; // vaso
	const zb = 28.3;
	return (
		<group>
			{/* base e lajes (cortadas na frente: mostram a espessura) */}
			<Bc a={[x0, CHAO, z0]} b={[x1, piso, z1]} m={mt.corteConcreto} />
			<Bc a={[x0, piso, z0 + e]} b={[meio, piso + 0.02, z1]} m={mt.azulejoCoz} />
			<Bc a={[meio, piso, z0 + e]} b={[x1, piso + 0.02, z1]} m={mt.piso} />
			<Bc a={[x0, laje, z0]} b={[x1, andar2, z1]} m={mt.corteConcreto} />
			<Bc a={[meio, andar2, z0 + e]} b={[x1, andar2 + 0.02, z1]} m={mt.pisoBanh} />
			<Bc a={[x0, andar2, z0 + e]} b={[meio, andar2 + 0.02, z1]} m={mt.piso} />
			<Bc a={[x0 - 0.1, teto, z0 - 0.1]} b={[x1 + 0.1, teto + 0.25, z1]} m={mt.corteConcreto} />
			{/* paredes: fundo, laterais, divisória (com porta embaixo) */}
			<Bc a={[x0, piso, z0]} b={[x1, teto, z0 + e]} m={mt.parede} />
			<Bc a={[x0, piso, z0]} b={[x0 + e, teto, z1]} m={mt.parede} />
			<Bc a={[x1 - e, piso, z0]} b={[x1, teto, z1]} m={mt.parede} />
			<Bc a={[meio - 0.1, piso, z0]} b={[meio + 0.1, laje, 24.6]} m={mt.parede} />
			<Bc a={[meio - 0.1, 2.6, 24.6]} b={[meio + 0.1, laje, 26.2]} m={mt.parede} />
			<Bc a={[meio - 0.1, piso, 26.2]} b={[meio + 0.1, laje, z1]} m={mt.parede} />
			<Bc a={[meio - 0.1, andar2, z0]} b={[meio + 0.1, teto, z1]} m={mt.parede} />
			{/* revestimento interno de cada cômodo */}
			<Bc a={[x0 + e, piso, z0 + e]} b={[meio - 0.1, laje, z0 + e + 0.02]} m={mt.azulejoCoz} />
			<Bc a={[meio + 0.1, piso, z0 + e]} b={[x1 - e, laje, z0 + e + 0.02]} m={mt.papelSala} />
			<Bc a={[x0 + e, andar2, z0 + e]} b={[meio - 0.1, teto, z0 + e + 0.02]} m={mt.papelQuarto} />
			<Bc a={[meio + 0.1, andar2, z0 + e]} b={[x1 - e, teto, z0 + e + 0.02]} m={mt.azulejo} />
			{/* janelas no fundo */}
			{(
				[
					[-20.2, 2.4],
					[-15.5, 2.4],
					[-20.2, 5.9],
					[-14.4, 5.9],
				] as V2[]
			).map(([x, y], i) => (
				<group key={i}>
					<Bc a={[x - 0.8, y - 0.6, z0 + e + 0.02]} b={[x + 0.8, y + 0.6, z0 + e + 0.05]} m={mt.janela} />
					<Bc a={[x - 0.05, y - 0.6, z0 + e + 0.05]} b={[x + 0.05, y + 0.6, z0 + e + 0.08]} m={mt.branco} />
				</group>
			))}
			{/* telhado de duas águas (cortado na frente) */}
			{[-1, 1].map((l) => (
				<Bx key={l} p={[(x0 + x1) / 2 + l * 2.45, teto + 1.35, (z0 + z1) / 2 - 0.05]} s={[5.6, 0.3, z1 - z0 + 0.6]} r={[0, 0, -l * 0.5]} m={mt.telhado} />
			))}
			<mesh geometry={GEO.prisma} material={mt.telhadoEsc} position={[(x0 + x1) / 2, teto + 0.25, (z0 + z1) / 2 - 0.1]} scale={[z1 - z0 - 0.2, 2.35, x1 - x0 - 0.3]} rotation={[0, Math.PI / 2, 0]} />

			{/* BANHEIRO: vaso de lado (caixa encostada na divisória), pia, espelho, box */}
			<group>
				<Bc a={[xb - 1.3, andar2 + 0.75, zb - 0.55]} b={[xb - 0.8, andar2 + 1.9, zb + 0.55]} m={mt.louca} />
				{/* botão da descarga (afunda e brilha) */}
				<Cy p={[xb - 1.05, andar2 + 1.93 - botao * 0.05, zb]} r={0.13} h={0.08} m={botao > 0.1 ? mt.amarelo : mt.cinza} />
				<Cy p={[xb - 0.2, andar2 + 0.3, zb]} r={0.32} h={0.6} m={mt.louca} />
				{/* tampa aberta encostada na caixa */}
				<mesh geometry={GEO.cil} material={mt.louca} position={[xb - 0.62, andar2 + 1.35, zb]} rotation={[0, 0, -0.18]} scale={[0.08, 0.95, 0.5]} />
				<mesh geometry={GEO.cilAberto} material={mt.loucaDupla} position={[xb, andar2 + 0.65, zb]} scale={[0.6, 0.35, 0.5]} />
				<mesh geometry={GEO.disco} material={mt.louca} position={[xb, andar2 + 0.5, zb]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.48, 0.4, 1]} />
				{/* água do vaso: gira e baixa com a descarga */}
				<group position={[xb, andar2 + 0.72 - descarga * 0.12, zb]} rotation={[0, redemoinho * 12, 0]}>
					<mesh geometry={GEO.disco} material={mt.aguaCorte} rotation={[-Math.PI / 2, 0, 0]} scale={[0.5, 0.4, 1]} />
					{redemoinho > 0.02
						? Array.from({length: 3}, (_, i) => (
								<mesh key={i} geometry={GEO.meioToro} material={mt.espuma} rotation={[-Math.PI / 2, 0, (i * Math.PI * 2) / 3]} position={[0, 0.02, 0]} scale={[0.14 + i * 0.1, 0.14 + i * 0.1, 0.5]} />
							))
						: null}
				</group>
				<mesh geometry={GEO.toro} material={mt.louca} position={[xb, andar2 + 0.84, zb]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.6, 0.5, 0.8]} />
				{/* pia + espelho */}
				<Bc a={[-15.6, andar2, z0 + 0.3]} b={[-14.6, andar2 + 1.1, z0 + 1.0]} m={mt.branco} />
				<Bc a={[-15.7, andar2 + 1.1, z0 + 0.3]} b={[-14.5, andar2 + 1.22, z0 + 1.1]} m={mt.louca} />
				<Bc a={[-15.5, andar2 + 1.6, z0 + 0.28]} b={[-14.7, andar2 + 2.6, z0 + 0.32]} m={mt.aguaLimpa} />
				{/* box do chuveiro */}
				<Bc a={[x1 - 1.6, andar2 + 0.03, z0 + 2.2]} b={[x1 - e, andar2 + 0.08, z0 + 4.4]} m={mt.branco} />
				<Bc a={[x1 - 1.62, andar2, z0 + 2.2]} b={[x1 - 1.58, andar2 + 2.4, z0 + 4.4]} m={mt.vidro} />
				<Cy p={[x1 - 0.8, andar2 + 2.6, z0 + 3.3]} r={0.18} h={0.06} m={mt.cinza} />
				<Bc a={[x1 - 0.6, andar2 + 1.0, z1 - 1.9]} b={[x1 - e - 0.02, andar2 + 1.9, z1 - 1.2]} m={mt.vermelho} />
			</group>

			{/* QUARTO */}
			<Bc a={[-22.1, andar2, 23.4]} b={[-19.4, andar2 + 0.55, 27.2]} m={mt.madeira} />
			<Bc a={[-22.0, andar2 + 0.55, 23.5]} b={[-19.5, andar2 + 0.75, 27.1]} m={mt.branco} />
			<Bc a={[-21.8, andar2 + 0.75, 23.6]} b={[-20.6, andar2 + 0.95, 24.4]} m={mt.branco} />
			<Bc a={[-21.0, andar2 + 0.75, 24.8]} b={[-19.5, andar2 + 0.82, 27.1]} m={mt.azul} />
			<Bc a={[-19.2, andar2, z0 + 0.3]} b={[-18.1, andar2 + 2.5, z0 + 1.2]} m={mt.madeiraEsc} />

			{/* COZINHA: geladeira, fogão, bancada com a pia (aberta na frente: mostra o cano subindo) */}
			<Bc a={[x0 + 0.35, piso, z0 + 0.35]} b={[x0 + 1.45, piso + 2.6, z0 + 1.45]} m={mt.branco} />
			<Bc a={[x0 + 1.4, piso + 1.5, z0 + 1.42]} b={[x0 + 1.46, piso + 2.3, z0 + 1.48]} m={mt.cinza} />
			<Bc a={[-20.0, piso, z0 + 0.35]} b={[-19.0, piso + 1.2, z0 + 1.3]} m={mt.branco} />
			<Bc a={[-20.0, piso + 1.2, z0 + 0.35]} b={[-19.0, piso + 1.25, z0 + 1.3]} m={mt.preto} />
			<Bc a={[-22.2, piso, 27.9]} b={[-19.1, piso + 1.35, 28.05]} m={mt.madeira} />
			<Bc a={[-22.25, piso, 27.9]} b={[-22.05, piso + 1.35, 29.6]} m={mt.madeira} />
			<Bc a={[-19.25, piso, 27.9]} b={[-19.05, piso + 1.35, 29.6]} m={mt.madeira} />
			<Bc a={[-22.3, piso + 1.35, 27.85]} b={[-19.0, piso + 1.5, 29.65]} m={mt.calcada} />
			{/* cuba e torneira */}
			<Bc a={[-21.5, piso + 1.1, 28.3]} b={[-20.1, piso + 1.5, 29.3]} m={mt.cinza} />
			<Cy p={[-20.8, piso + 1.85, 29.35]} r={0.07} h={1.3} m={mt.cinza} />
			<Tubo a={[-20.8, piso + 2.45, 29.35]} b={[-20.8, piso + 2.45, 28.75]} r={0.07} m={mt.cinza} />
			<Cy p={[-20.8, piso + 2.38, 28.78]} r={0.09} h={0.12} m={mt.cinza} />
			<Bx p={[-20.8, piso + 2.62, 29.35]} s={[0.35, 0.08, 0.1]} r={[0, torneira * 1.2, 0]} m={mt.vermelho} />
			{/* copo */}
			<mesh geometry={GEO.cil} material={mt.vidro} position={[-20.8, piso + 1.7, 28.75]} scale={[0.22, 0.42, 0.22]} />
			<mesh geometry={GEO.cil} material={mt.aguaLimpa} position={[-20.8, piso + 1.53 + torneira * 0.08, 28.75]} scale={[0.2, 0.02 + torneira * 0.16, 0.2]} />
			{/* cano limpo que sobe dentro da bancada (cortado) */}
			<TuboCorte a={[-20.8, piso]} b={[-20.8, piso + 1.2]} r={0.16} zc={29.7} m={mt.canoLimpo} borda={0.05} />
			<Tubo a={[-20.8, piso + 1.2, 29.6]} b={[-20.8, piso + 1.2, 29.35]} r={0.1} m={mt.canoLimpo} />
			{/* mesa */}
			<Bc a={[-21.2, piso + 1.0, 24.0]} b={[-19.2, piso + 1.1, 25.6]} m={mt.madeira} />
			{[-21, -19.4].flatMap((x) => [24.2, 25.4].map((z) => <Bc key={`${x}${z}`} a={[x - 0.06, piso, z - 0.06]} b={[x + 0.06, piso + 1.0, z + 0.06]} m={mt.madeiraEsc} />))}

			{/* SALA: sofá, tapete, tv, planta */}
			<Bc a={[-16.8, piso, 21.0]} b={[-14.0, piso + 0.7, 22.0]} m={mt.vermelho} />
			<Bc a={[-16.8, piso, 20.9]} b={[-14.0, piso + 1.4, 21.3]} m={mt.vermelho} />
			<Bc a={[-16.6, piso + 0.01, 22.6]} b={[-14.2, piso + 0.04, 25.4]} m={mt.amarelo} />
			<Bc a={[-16.4, piso, 26.4]} b={[-14.4, piso + 0.6, 27.0]} m={mt.madeiraEsc} />
			<Bc a={[-16.2, piso + 0.6, 26.6]} b={[-14.6, piso + 1.6, 26.7]} m={mt.preto} />
			<Cy p={[-14.0, piso + 0.3, 28.6]} r={0.3} h={0.6} m={mt.telhadoEsc} />
			<Es p={[-14.0, piso + 1.0, 28.6]} r={0.5} m={mt.gramaEsc} g={GEO.pedra} />
			{/* cano do esgoto da casa: sai do vaso, desce pela frente da sala (cortado ao meio: a gota aparece dentro) */}
			<TuboCorte a={[xb, andar2 + 0.1]} b={[xb - 0.05, -1.45]} r={0.28} zc={29.62} m={mt.canoSujo} />
			<Tubo a={[xb, andar2 + 0.3, zb]} b={[xb, andar2 + 0.1, 29.35]} r={0.2} m={mt.cano} />
		</group>
	);
};

// ---------------------------------------------------------------- esgoto sob a rua da frente
export const ESGOTO = {y: -3.8, r: 1.0, zc: ZF - 0.08, x0: -13.4, x1: 7.6};
export const Esgoto: React.FC<{q?: number}> = () => {
	const mt = M();
	const {y, r, zc, x0, x1} = ESGOTO;
	return (
		<group>
			{/* ramal da casa até o coletor */}
			<TuboCorte a={[-16.5, -1.45]} b={[-13.0, -2.75]} r={0.28} zc={29.62} m={mt.canoSujo} />
			{/* coletor grande */}
			<TuboCorte a={[x0, y]} b={[x1, y]} r={r} zc={zc} m={mt.canoInt} borda={0.16} />
			<mesh geometry={geoLiquido(r * 0.97, -0.45, x1 - x0)} material={mt.esgoto} position={[x0, y, zc]} />
			{/* poços de visita: tampa na rua, escada até o coletor */}
			{[-6, 2].map((x) => (
				<group key={x}>
					<TuboCorte a={[x, y + r * 0.9]} b={[x, CHAO + 0.12]} r={0.6} zc={29.45} m={mt.concretoEsc} borda={0.1} />
					{Array.from({length: 6}, (_, i) => (
						<Bx key={i} p={[x, -2.5 + i * 0.45, 29.0]} s={[0.5, 0.05, 0.05]} m={mt.amarelo} />
					))}
					<Cy p={[x, CHAO + 0.14, 29.25]} r={0.6} h={0.06} m={mt.preto} />
				</group>
			))}
			{/* poço de chegada na estação: o esgoto sobe até a caixa de chegada */}
			<TuboCorte a={[7.2, y - r * 0.6]} b={[7.2, CHAO]} r={0.55} zc={29.45} m={mt.canoInt} borda={0.12} />
			<Bc a={[6.5, -3.85, 28.7]} b={[7.9, -4.85, 29.9]} m={mt.esgoto} />
		</group>
	);
};

// ---------------------------------------------------------------- ETE (estação de tratamento de esgoto)
// Peças de lixo que a grade segura.
const Garrafa: React.FC<{p: V3; r?: V3}> = ({p, r}) => {
	const mt = M();
	return (
		<group position={p} rotation={r}>
			<Cy p={[0, 0, 0]} r={0.12} h={0.4} m={mt.aguaLimpa} />
			<Cy p={[0, 0.27, 0]} r={0.05} h={0.14} m={mt.aguaLimpa} />
			<Cy p={[0, 0.36, 0]} r={0.06} h={0.05} m={mt.vermelho} />
		</group>
	);
};
const Celular: React.FC<{p: V3; r?: V3}> = ({p, r}) => {
	const mt = M();
	return (
		<group position={p} rotation={r}>
			<Bx p={[0, 0, 0]} s={[0.22, 0.4, 0.04]} m={mt.preto} />
			<Bx p={[0, 0.01, 0.022]} s={[0.18, 0.32, 0.01]} m={mt.janela} />
		</group>
	);
};
export type EstadoGrade = {q?: number; rastelo?: number; lixo?: number};
// Gradeamento: canal de concreto elevado (aberto na frente), barras inclinadas, lixo preso, rastelo que tira o lixo para a caçamba.
export const Gradeamento: React.FC<EstadoGrade> = ({rastelo = 0, lixo = 1}) => {
	const mt = M();
	const x0 = 8.0;
	const x1 = 12.0;
	const zA = 26.6;
	const fl = CHAO + 0.2;
	const nivel = 1.95;
	const barras = useMemo(() => Array.from({length: 7}, (_, i) => ({p: [9.75, 1.35, 27.15 + i * 0.42] as V3, s: [0.05, 2.3, 0.05] as V3, r: [0, 0, 0.45] as V3})), []);
	return (
		<group>
			{/* caixa de chegada (onde o esgoto sobe) */}
			<Bc a={[6.4, CHAO, 26.9]} b={[8.0, 2.5, 27.15]} m={mt.concreto} />
			<Bc a={[6.4, CHAO, 26.9]} b={[6.65, 2.5, ZF]} m={mt.concreto} />
			<Bc a={[6.65, CHAO, 27.15]} b={[8.0, nivel, ZF - 0.02]} m={mt.esgoto} />
			{/* canal */}
			<Bc a={[x0, CHAO, zA]} b={[x1 + 0.6, fl, ZF]} m={mt.corteConcreto} />
			<Bc a={[x0, fl, zA]} b={[x1 + 0.6, 2.5, zA + 0.3]} m={mt.concreto} />
			<Bc a={[x0, fl, zA + 0.3]} b={[x1 + 0.6, nivel, ZF - 0.02]} m={mt.aguaSuja} />
			{/* barras da grade (inclinadas) e a viga que as segura */}
			<Inst geo={GEO.caixa} m={mt.ferro} itens={barras} />
			{/* lixo preso do lado de cá da grade */}
			{lixo > 0 ? (
				<group scale={lixo}>
					<Garrafa p={[9.15, 1.75, 27.6]} r={[0.3, 0, 1.3]} />
					<Celular p={[9.05, 1.2, 29.3]} r={[0, 0.3, 0.45]} />
					<Bx p={[9.3, 1.5, 28.6]} s={[0.12, 0.5, 0.55]} r={[0.2, 0.3, 0.45]} m={mt.vermelho} />
					<Bx p={[8.9, 1.9, 29.0]} s={[0.4, 0.06, 0.35]} r={[0.4, 0.2, 0.1]} m={mt.amarelo} />
					<Es p={[9.0, 1.0, 28.0]} r={0.16} m={mt.preto} g={GEO.pedra} />
				</group>
			) : null}
			{/* rastelo mecânico: sobe pela grade com o lixo e despeja na caçamba atrás */}
			<group position={[9.75 + rastelo * 0.9, 1.0 + rastelo * 1.9, 0]}>
				<Bc a={[-0.15, -0.1, zA + 0.35]} b={[0.15, 0.1, ZF - 0.1]} m={mt.amarelo} />
				{rastelo > 0.05 && rastelo < 0.95 ? <Bx p={[-0.15, 0.15, 28.4]} s={[0.25, 0.25, 0.9]} m={mt.vermelho} /> : null}
			</group>
			<Bc a={[10.5, 2.5, zA - 0.3]} b={[10.9, 3.1, zA + 0.1]} m={mt.amarelo} />
			{/* caçamba com lixo atrás do canal */}
			<group position={[10.1, CHAO, 24.9]}>
				<Bc a={[-1.1, 0, -0.7]} b={[1.1, 1.0, 0.7]} m={mt.verde} />
				{Array.from({length: 7}, (_, i) => (
					<Es key={i} p={[-0.7 + (i % 4) * 0.45, 1.05, -0.3 + Math.floor(i / 4) * 0.5]} r={0.24} m={[mt.vermelho, mt.amarelo, mt.preto, mt.azul][i % 4]} g={GEO.pedra} />
				))}
			</group>
			{/* corrimão */}
			<Bc a={[x0, 2.5, zA - 0.05]} b={[x1 + 0.6, 2.56, zA + 0.05]} m={mt.amarelo} />
		</group>
	);
};

export type EstadoAeracao = {q?: number; limpeza?: number};
const BACTERIAS: V3[] = [
	[13.6, 1.0, 29.2],
	[14.4, 2.0, 28.8],
	[15.9, 0.9, 29.3],
	[16.9, 1.7, 28.9],
	[13.9, 2.1, 27.0],
	[15.2, 1.3, 26.2],
	[16.5, 2.2, 25.0],
	[14.2, 0.9, 24.6],
	[16.9, 0.9, 27.4],
	[13.5, 1.6, 23.2],
];
// Bactéria-personagem (cápsula verde com olhos e boca aberta).
const Bacteria: React.FC<{p: V3; q: number; i: number; come: number}> = ({p, q, i, come}) => {
	const mt = M();
	const mg = matsGota();
	const bob = Math.sin(q * 0.12 + i) * 0.08;
	const boca = 0.5 + 0.5 * Math.sin(q * 0.5 + i * 1.7) * come;
	return (
		<group position={[p[0], p[1] + bob, p[2]]} rotation={[0, 0, Math.sin(q * 0.05 + i) * 0.4]} scale={0.38}>
			<mesh geometry={GEO.esfLisa} material={mt.bacteria} scale={[1.2, 0.85, 0.85]} />
			{[-0.55, 0, 0.55].map((x) => (
				<mesh key={x} geometry={GEO.cil8} material={mt.bacteriaEsc} position={[x, -0.85, 0]} scale={[0.05, 0.4, 0.05]} rotation={[0, 0, Math.sin(q * 0.4 + x * 3) * 0.5]} />
			))}
			{[-0.28, 0.28].map((x) => (
				<group key={x} position={[x, 0.25, 0.72]}>
					<mesh geometry={GEO.esfLisa} material={mg.olho} scale={[0.2, 0.24, 0.1]} />
					<mesh geometry={GEO.esfLisa} material={mg.pupila} position={[0.03, -0.03, 0.07]} scale={[0.1, 0.12, 0.05]} />
				</group>
			))}
			<mesh geometry={GEO.esfLisa} material={mg.boca} position={[0, -0.22, 0.76]} scale={[0.26, 0.1 + 0.14 * boca, 0.08]} />
		</group>
	);
};
// Tanque de aeração: bolhas de ar sobem dos difusores; bactérias comem as manchas de sujeira (manchas somem com 'limpeza').
export const TanqueAeracao: React.FC<EstadoAeracao> = ({q = 0, limpeza = 0}) => {
	const mt = M();
	const x0 = 12.6;
	const x1 = 17.8;
	const z0 = 22.0;
	const nivel = 2.75;
	const fl = CHAO + 0.2;
	const bolhas: ItemInst[] = Array.from({length: 60}, (_, i) => {
		const ciclo = (q * 0.025 + rnd(i, 1)) % 1;
		return {p: [x0 + 0.5 + rnd(i, 2) * 4.2 + Math.sin(q * 0.2 + i) * 0.05, fl + 0.3 + ciclo * (nivel - fl - 0.35), z0 + 0.6 + rnd(i, 3) * 6.9] as V3, s: 0.05 + rnd(i, 4) * 0.06};
	});
	const sujeira: ItemInst[] = Array.from({length: 46}, (_, i) => {
		const vivo = rnd(i, 5) > limpeza;
		return {p: [x0 + 0.5 + rnd(i, 6) * 4.2, fl + 0.4 + rnd(i, 7) * 1.9, z0 + 0.6 + rnd(i, 8) * 7.0] as V3, s: vivo ? 0.06 + rnd(i, 9) * 0.07 : 0.0001};
	});
	const difusores = useMemo(() => Array.from({length: 14}, (_, i) => ({p: [x0 + 0.8 + (i % 7) * 0.65, fl + 0.12, i < 7 ? 25 : 28.4] as V3, s: [0.2, 0.05, 0.2] as V3})), []);
	return (
		<group>
			<Bc a={[x0, CHAO, z0]} b={[x1, fl, ZF]} m={mt.corteConcreto} />
			<Bc a={[x0, fl, z0]} b={[x1, 3.3, z0 + 0.25]} m={mt.concreto} />
			<Bc a={[x0, fl, z0]} b={[x0 + 0.25, 3.3, ZF]} m={mt.concreto} />
			<Bc a={[x1 - 0.25, fl, z0]} b={[x1, 3.3, ZF]} m={mt.concreto} />
			<Bc a={[x0 + 0.25, fl, z0 + 0.25]} b={[x1 - 0.25, nivel, ZF - 0.02]} m={limpeza > 0.5 ? mt.aguaMedia : mt.aguaSuja} />
			{/* difusores e cano de ar */}
			<Inst geo={GEO.cil} m={mt.cinza} itens={difusores} />
			<Tubo a={[x0 + 0.5, fl + 0.1, 25]} b={[x1 - 0.5, fl + 0.1, 25]} r={0.06} m={mt.azul} />
			<Tubo a={[x0 + 0.5, fl + 0.1, 28.4]} b={[x1 - 0.5, fl + 0.1, 28.4]} r={0.06} m={mt.azul} />
			<Canos pts={[[x0 + 0.5, fl + 0.1, 25], [x0 + 0.5, 3.6, 25], [x0 + 0.5, 3.6, 21.0], [x0 + 2.0, 3.6, 21.0], [x0 + 2.0, CHAO + 1.2, 21.0]]} r={0.1} m={mt.azul} />
			<InstVivo geo={GEO.esfLisa} m={mt.bolha} max={60} itens={bolhas} />
			<InstVivo geo={GEO.pedra} m={mt.sujeira} max={46} itens={sujeira} />
			{BACTERIAS.map((p, i) => (
				<Bacteria key={i} p={p} q={q} i={i} come={1 - limpeza * 0.6} />
			))}
			{/* espuma na superfície */}
			<Bc a={[x0 + 0.25, nivel, z0 + 0.25]} b={[x1 - 0.25, nivel + 0.04, ZF - 0.02]} m={mt.aguaLimpa} />
			{/* passarela com corrimão */}
			<Bc a={[x0, 3.3, 24.3]} b={[x1, 3.4, 25.3]} m={mt.ferro} />
			<Bc a={[x0, 3.9, 24.3]} b={[x1, 3.96, 24.36]} m={mt.amarelo} />
			<Bc a={[x0, 3.9, 25.24]} b={[x1, 3.96, 25.3]} m={mt.amarelo} />
			{/* soprador (casinha das máquinas de ar) */}
			<Bc a={[13.4, CHAO, 19.6]} b={[16.4, 2.0, 21.4]} m={mt.parede} />
			<Bc a={[13.2, 2.0, 19.4]} b={[16.6, 2.2, 21.6]} m={mt.cinza} />
			<Bc a={[14.4, CHAO, 21.38]} b={[15.2, 1.6, 21.42]} m={mt.azul} />
			{/* passagem para o decantador */}
			<Tubo a={[x1, 2.6, 28.4]} b={[19.4, 2.6, 28.4]} r={0.22} m={mt.vidro} />
		</group>
	);
};

export type EstadoDecantador = {q?: number; separa?: number};
// grumos de lodo no fundo do funil (fixos; o funil enche com 'separa')
const GRUMOS: ItemInst[] = Array.from({length: 26}, (_, i) => {
	const a = Math.PI * (1 + rnd(i, 1));
	const h = 0.15 + rnd(i, 2) * 0.55;
	const rr = (2.6 * h) / 0.8 * 0.8 * Math.sqrt(rnd(i, 3));
	return {p: [21.0 + Math.cos(a) * rr, MUNDO.CHAO + 0.1 + h, ZF - 0.02 + Math.sin(a) * rr * 0.9 - 0.05] as V3, s: [0.14 + rnd(i, 4) * 0.12, 0.08, 0.14 + rnd(i, 5) * 0.12] as V3, r: [0, rnd(i, 6) * 3, 0] as V3, c: ['#3e2914', '#5a3b1c', '#6b4a22'][i % 3]};
});
// Decantador circular cortado ao meio: a sujeira (lodo) afunda para o cone do fundo; a água limpa sai pela canaleta da borda.
export const Decantador: React.FC<EstadoDecantador> = ({q = 0, separa = 1}) => {
	const mt = M();
	const cx = 21.0;
	const cz = ZF - 0.02;
	const R = 2.6;
	const yb = CHAO + 0.9; // borda inferior da parede
	const topo = 3.5;
	const nivel = 3.15;
	const lodoH = 0.25 + 0.55 * separa;
	const caindo: ItemInst[] = Array.from({length: 40}, (_, i) => {
		const ciclo = (q * 0.012 + rnd(i, 1)) % 1;
		const ang = Math.PI * (1 + rnd(i, 2));
		const rr = 0.4 + rnd(i, 3) * (R - 0.7);
		const y = nivel - 0.3 - ciclo * (nivel - yb - 0.2);
		return {p: [cx + Math.cos(ang) * rr * (1 - ciclo * 0.4), y, cz + Math.sin(ang) * rr * 0.9 * (1 - ciclo * 0.4)] as V3, s: separa > 0.02 ? 0.07 : 0.0001};
	});
	return (
		<group>
			{/* pilares e parede (meio cilindro aberto na frente) */}
			{[-0.75, -0.25, 0.25, 0.75].map((f) => (
				<Bc key={f} a={[cx + Math.sin(f * Math.PI) * (R - 0.3) - 0.15, CHAO, cz - Math.cos(f * Math.PI) * (R - 0.3) - 0.15]} b={[cx + Math.sin(f * Math.PI) * (R - 0.3) + 0.15, yb, cz - Math.cos(f * Math.PI) * (R - 0.3) + 0.15]} m={mt.concretoEsc} />
			))}
			<mesh geometry={GEO.meioTubo} material={mt.concretoDuplo} position={[cx, (yb + topo) / 2, cz]} scale={[R, topo - yb, R]} />
			{/* bordas cortadas da parede */}
			{[-1, 1].map((l) => (
				<Bc key={l} a={[cx + l * R - 0.1, yb - 0.1, cz - 0.02]} b={[cx + l * (R + 0.18), topo, cz]} m={mt.corteConcreto} />
			))}
			{/* face cortada do lodo (triângulo) */}
			<mesh geometry={GEO.triangulo} material={mt.lodo} position={[cx, yb - 0.8, cz - 0.005]} scale={[R * (lodoH / 0.8) * 0.95, lodoH, 1]} />
			<mesh geometry={GEO.meioToro} material={mt.concretoEsc} position={[cx, topo, cz]} rotation={[-Math.PI / 2, 0, 0]} scale={[R + 0.06, R + 0.06, 2]} />
			{/* fundo em cone (funil, ponta em yb − 0.8) com o lodo acumulado */}
			<mesh geometry={GEO.meioConeAberto} material={mt.canoInt} position={[cx, yb - 0.4, cz]} rotation={[0, 0, Math.PI]} scale={[R, 0.8, R]} />
			<mesh geometry={GEO.meioCone} material={mt.lodo} position={[cx, yb - 0.8 + lodoH / 2, cz - 0.01]} rotation={[0, 0, Math.PI]} scale={[R * (lodoH / 0.8) * 0.95, lodoH, R * (lodoH / 0.8) * 0.95]} />
			{/* água: meio cilindro + face cortada */}
			<mesh geometry={GEO.meioCil} material={separa > 0.6 ? mt.aguaMedia : mt.aguaSuja} position={[cx, (yb + nivel) / 2, cz]} scale={[R - 0.05, nivel - yb, R - 0.05]} />
			<Bc a={[cx - R + 0.05, yb, cz - 0.01]} b={[cx + R - 0.05, nivel, cz]} m={separa > 0.6 ? mt.aguaMedia : mt.aguaSuja} />
			<InstVivo geo={GEO.pedra} m={mt.lodoClaro} max={40} itens={caindo} />
			{/* zona turva perto do fundo (a sujeira descendo) e grumos em cima do lodo */}
			{separa > 0.02 ? <Bc a={[cx - R + 0.1, yb, cz - 0.004]} b={[cx + R - 0.1, yb + 0.25 + 0.5 * (1 - separa), cz]} m={mt.turvo} /> : null}
			<InstVivo geo={GEO.pedra} m={mt.instancia} max={GRUMOS.length} itens={GRUMOS.filter((g) => g.p[1] - (CHAO + 0.1) < lodoH - 0.04)} />
			{/* poço central de entrada */}
			<mesh geometry={GEO.meioTubo} material={mt.cinza} position={[cx, 2.9, cz]} scale={[0.45, 1.2, 0.45]} />
			{/* canaleta (vertedor) na borda: a água limpa transborda por cima */}
			<mesh geometry={GEO.meioToro} material={mt.amarelo} position={[cx, nivel + 0.05, cz]} rotation={[-Math.PI / 2, 0, 0]} scale={[R - 0.3, R - 0.3, 2.5]} />
			{/* ponte raspadora */}
			<Bc a={[cx - 0.2, topo + 0.05, cz - R - 0.1]} b={[cx + 0.2, topo + 0.25, cz]} m={mt.ferro} />
			<Bc a={[cx - 0.05, topo + 0.25, cz - R]} b={[cx + 0.05, topo + 0.7, cz]} m={mt.amarelo} />
			{/* saída: cano que desce para o canal da lateral */}
			<Canos pts={[[23.3, 3.1, 28.7], [23.8, 3.1, 28.7], [23.8, 1.0, 27.4], [22.9, 0.7, 26.6]]} r={0.2} m={mt.vidro} juntas={mt.canoLimpo} />
		</group>
	);
};

// Canal de água tratada (aberto) pela lateral direita, da ETE até o rio, com uma pequena cachoeira no fim.
export const CanalEfluente: React.FC<{q?: number}> = ({q = 0}) => {
	const mt = M();
	const x0 = 22.3;
	const x1 = 23.5;
	const z0 = RIO.z1;
	const z1 = 26.8;
	const marcas: ItemInst[] = Array.from({length: 20}, (_, i) => ({p: [22.9, CHAO + 0.06, z1 - ((i * 2.5 + q * 0.12) % 48)] as V3, s: [0.5, 0.02, 0.25] as V3}));
	return (
		<group>
			<Bc a={[x0, CHAO - 0.6, z0]} b={[x0 + 0.15, CHAO + 0.2, z1]} m={mt.concreto} />
			<Bc a={[x1 - 0.15, CHAO - 0.6, z0]} b={[x1, CHAO + 0.2, z1]} m={mt.concreto} />
			<Bc a={[x0 + 0.15, CHAO - 0.6, z0]} b={[x1 - 0.15, CHAO + 0.03, z1]} m={mt.aguaLimpa} />
			<InstVivo geo={GEO.caixa} m={mt.espuma} max={20} itens={marcas.filter((m) => m.p[2] > z0)} />
			{/* bica no rio */}
			<Bc a={[x0, RIO.nivel, z0 - 0.4]} b={[x1, CHAO - 0.6, z0]} m={mt.concreto} />
			<Bc a={[x0 + 0.15, RIO.nivel, z0 - 0.75]} b={[x1 - 0.15, CHAO - 0.6, z0 - 0.4]} m={mt.aguaLimpa} />
			{/* placa da ETE */}
			<group position={[19.5, CHAO, 21.0]}>
				<Bx p={[-0.6, 0.7, 0]} s={[0.1, 1.4, 0.1]} m={mt.ferro} />
				<Bx p={[0.6, 0.7, 0]} s={[0.1, 1.4, 0.1]} m={mt.ferro} />
				<Bx p={[0, 1.5, 0]} s={[1.8, 0.7, 0.08]} m={mt.verde} />
			</group>
			{/* cerca da ETE */}
			<Cerca a={[6.2, 21.8]} b={[24, 21.8]} />
			<Cerca a={[6.2, 21.8]} b={[6.2, 26.6]} />
		</group>
	);
};

// ---------------------------------------------------------------- captação (bomba na beira do rio)
export const Captacao: React.FC<{q?: number; bomba?: number}> = ({q = 0, bomba = 0}) => {
	const mt = M();
	const x = -16.9;
	return (
		<group>
			{/* tomada d'água dentro do rio (grade) */}
			<Bc a={[x - 0.8, RIO.leito, -25.2]} b={[x + 0.8, CHAO + 0.6, -23.6]} m={mt.concreto} />
			<Bc a={[x - 0.6, RIO.leito + 0.3, -23.62]} b={[x + 0.6, RIO.nivel - 0.1, -23.55]} m={mt.ferro} />
			<Canos pts={[[x, -0.6, -23.6], [x, 1.2, -21.4], [x, 1.2, -19.6]]} r={0.25} m={mt.vidro} juntas={mt.canoLimpo} />
			{/* casa de bombas (aberta na frente) */}
			<Bc a={[-19.4, CHAO, -21.0]} b={[-14.4, CHAO + 0.15, -17.0]} m={mt.corteConcreto} />
			{/* cobertura aberta sobre a bomba (dá para ver de qualquer lado) */}
			{[-19.2, -14.6].map((xx) => <Bc key={xx} a={[xx - 0.1, CHAO, -20.9]} b={[xx + 0.1, 3.0, -20.7]} m={mt.ferro} />)}
			<Bc a={[-19.6, 3.0, -21.2]} b={[-14.2, 3.2, -16.8]} m={mt.azul} />
			{/* bomba: motor azul + caracol vermelho com rotor que gira */}
			<group position={[x, 1.2, -19.0]}>
				<Cy p={[0, 0, 0]} r={0.6} h={0.5} m={mt.vermelho} rot={[Math.PI / 2, 0, 0]} />
				<group rotation={[0, 0, bomba * q * 0.6]}>
					{[0, 1, 2, 3].map((i) => (
						<Bx key={i} p={[0, 0, 0.27]} s={[0.9, 0.12, 0.04]} r={[0, 0, (i * Math.PI) / 4]} m={mt.amarelo} />
					))}
				</group>
				<Cy p={[-1.0, 0, 0]} r={0.45} h={1.1} m={mt.azul} rot={[0, 0, Math.PI / 2]} />
				<Bx p={[-1.0, -0.6, 0]} s={[1.2, 0.3, 0.8]} m={mt.ferro} />
				<Bx p={[0, -0.75, 0]} s={[0.8, 0.3, 0.8]} m={mt.ferro} />
			</group>
			<Canos pts={[[x, 1.2, -18.5], [x, 1.2, -16.4], [-18.3, 4.0, -15.2]]} r={0.25} m={mt.vidro} juntas={mt.canoLimpo} />
		</group>
	);
};

// ---------------------------------------------------------------- ETA (estação de tratamento de água)
export type EstadoFiltro = {q?: number; retido?: number};
// Filtro de areia em corte: água em cima, areia, cascalho e o fundo com drenos. A sujeira fica presa no topo da areia.
export const FiltroAreia: React.FC<EstadoFiltro> = ({q = 0, retido = 0.5}) => {
	const mt = M();
	const x0 = -21.6;
	const x1 = -15.0;
	const z0 = -15.0;
	const z1 = -9.0;
	const y0 = CHAO;
	const camadas = {fundo: y0 + 0.5, cascalho: y0 + 1.0, areia: y0 + 2.1, agua: 3.4, topo: 3.8};
	const graos = useMemo<ItemInst[]>(
		() => [
			...Array.from({length: 70}, (_, i) => ({p: [x0 + 0.4 + rnd(i, 1) * (x1 - x0 - 0.8), camadas.fundo + 0.08 + rnd(i, 2) * 0.4, z1 + 0.01] as V3, s: [0.1 + rnd(i, 3) * 0.08, 0.08 + rnd(i, 4) * 0.06, 0.04] as V3, c: ['#8a8880', '#b5b2a8', '#6f6d66'][i % 3]})),
			...Array.from({length: 120}, (_, i) => ({p: [x0 + 0.3 + rnd(i, 5) * (x1 - x0 - 0.6), camadas.cascalho + 0.05 + rnd(i, 6) * 1.0, z1 + 0.01] as V3, s: [0.035, 0.035, 0.02] as V3, c: ['#c9a85e', '#f3dfaa', '#b8954e'][i % 3]})),
		],
		[],
	);
	const presos: ItemInst[] = Array.from({length: 50}, (_, i) => ({
		p: [x0 + 0.35 + rnd(i, 7) * (x1 - x0 - 0.7), camadas.areia - 0.05 - rnd(i, 8) * 0.25, z1 + 0.02 - (i % 2) * rnd(i, 9) * 5.5] as V3,
		s: rnd(i, 10) < retido ? 0.06 + rnd(i, 11) * 0.05 : 0.0001,
	}));
	// gotas descendo pela areia
	const descendo: ItemInst[] = Array.from({length: 24}, (_, i) => {
		const ciclo = (q * 0.02 + rnd(i, 12)) % 1;
		return {p: [x0 + 0.5 + rnd(i, 13) * (x1 - x0 - 1), camadas.agua - 0.2 - ciclo * (camadas.agua - camadas.fundo), z1 + 0.03] as V3, s: [0.05, 0.09, 0.02] as V3};
	});
	return (
		<group>
			<Bc a={[x0 - 0.3, y0, z0 - 0.3]} b={[x1 + 0.3, camadas.topo, z0]} m={mt.concreto} />
			<Bc a={[x0 - 0.3, y0, z0]} b={[x0, camadas.topo, z1]} m={mt.concreto} />
			<Bc a={[x1, y0, z0]} b={[x1 + 0.3, camadas.topo, z1]} m={mt.concreto} />
			<Bc a={[x0, y0 - 0.05, z0]} b={[x1, y0 + 0.05, z1]} m={mt.concretoEsc} />
			{/* fundo: vão com drenos (a água filtrada junta aqui e sai pelo cano) */}
			<Bc a={[x0, y0 + 0.05, z0]} b={[x1, camadas.fundo, z1]} m={mt.aguaLimpa} />
			{[-20.5, -19.0, -17.5, -16.0].map((x) => (
				<Bx key={x} p={[x, y0 + 0.2, (z0 + z1) / 2]} s={[0.12, 0.3, z1 - z0]} m={mt.concretoEsc} />
			))}
			<Tubo a={[x0 + 0.2, y0 + 0.25, -9.3]} b={[x1 + 0.6, y0 + 0.25, -9.3]} r={0.2} m={mt.vidro} />
			<Bc a={[x0, camadas.fundo, z0]} b={[x1, camadas.cascalho, z1]} m={mt.cascalho} />
			<Bc a={[x0, camadas.cascalho, z0]} b={[x1, camadas.areia, z1]} m={mt.areia} />
			<Bc a={[x0, camadas.areia - 0.12, z0]} b={[x1, camadas.areia, z1]} m={mt.areiaEsc} />
			<Bc a={[x0, camadas.areia, z0]} b={[x1, camadas.agua, z1]} m={mt.aguaMedia} />
			<Inst geo={GEO.esf} m={mt.instancia} itens={graos} />
			<InstVivo geo={GEO.pedra} m={mt.sujeira} max={50} itens={presos} />
			<InstVivo geo={GEO.esfLisa} m={mt.aguaCorte} max={24} itens={descendo} />
			{/* calha de entrada em cima */}
			<Bc a={[x0 + 2.4, camadas.agua + 0.3, z0 + 0.4]} b={[x0 + 3.3, camadas.topo + 0.2, z1 - 0.6]} m={mt.concreto} />
			{/* passarela */}
			<Bc a={[x0 - 0.3, camadas.topo, z0 - 1.2]} b={[x1 + 0.3, camadas.topo + 0.1, z0 - 0.3]} m={mt.ferro} />
		</group>
	);
};

export type EstadoCloro = {q?: number; dose?: number; mortos?: number};
// Cloração: cilindros de cloro, cano dosador pingando no tanque de contato; os micróbios (roxos) estouram.
export const Cloracao: React.FC<EstadoCloro> = ({q = 0, dose = 1, mortos = 0}) => {
	const mt = M();
	const x0 = -14.6;
	const x1 = -10.2;
	const z0 = -15.0;
	const z1 = -9.0;
	const fl = CHAO + 0.2;
	const nivel = 2.3;
	const gotas: ItemInst[] = Array.from({length: 6}, (_, i) => {
		const c = (q * 0.04 + i / 6) % 1;
		return {p: [-13.6, 3.3 - c * (3.3 - nivel), -9.7] as V3, s: dose > 0.05 ? [0.07, 0.11, 0.07] : 0.0001};
	});
	const microbios = Array.from({length: 9}, (_, i) => {
		const vivo = rnd(i, 3) > mortos;
		return {p: [x0 + 0.6 + rnd(i, 1) * (x1 - x0 - 1.2), fl + 0.4 + rnd(i, 2) * 1.4, z1 - 0.4 - rnd(i, 4) * 1.4] as V3, vivo, i};
	});
	return (
		<group>
			<Bc a={[x0, CHAO, z0]} b={[x1, fl, z1]} m={mt.corteConcreto} />
			<Bc a={[x0, fl, z0]} b={[x1, 2.6, z0 + 0.25]} m={mt.concreto} />
			<Bc a={[x0, fl, z0]} b={[x0 + 0.25, 2.6, z1]} m={mt.concreto} />
			<Bc a={[x1 - 0.25, fl, z0]} b={[x1, 2.6, z1]} m={mt.concreto} />
			{/* chicanas (paredes internas em zigue-zague) */}
			<Bc a={[-12.9, fl, z0 + 0.25]} b={[-12.7, 2.6, z1 - 1.6]} m={mt.concreto} />
			<Bc a={[-11.5, fl, z0 + 1.6]} b={[-11.3, 2.6, z1]} m={mt.concreto} />
			<Bc a={[x0 + 0.25, fl, z0 + 0.25]} b={[x1 - 0.25, nivel, z1 - 0.02]} m={mt.aguaLimpa} />
			{/* casinha do cloro com cilindros */}
			<Bc a={[-14.4, CHAO, -18.6]} b={[-10.6, 0.5, -15.6]} m={mt.concreto} />
			{[-13.6, -12.6, -11.6].map((x) => (
				<group key={x}>
					<Cy p={[x, 1.4, -17.1]} r={0.38} h={1.8} m={mt.cloro} />
					<Es p={[x, 2.3, -17.1]} r={0.38} m={mt.cloro} g={GEO.esfLisa} />
					<Cy p={[x, 2.75, -17.1]} r={0.08} h={0.2} m={mt.ferro} />
				</group>
			))}
			<Canos pts={[[-13.6, 2.9, -17.1], [-13.6, 3.3, -17.1], [-13.6, 3.3, -9.7]]} r={0.07} m={mt.amarelo} />
			<InstVivo geo={GEO.esfLisa} m={mt.cloro} max={6} itens={gotas} />
			{microbios.map(({p, vivo, i}) =>
				vivo ? (
					<group key={i} position={p} rotation={[q * 0.03 + i, q * 0.02, 0]} scale={0.16}>
						<mesh geometry={GEO.esfLisa} material={mt.microbio} />
						{[0, 1, 2, 3, 4, 5].map((k) => (
							<mesh key={k} geometry={GEO.cone} material={mt.microbio} position={[Math.cos(k) * 1.0, Math.sin(k * 1.7) * 1.0, Math.sin(k) * 0.6]} scale={[0.3, 0.6, 0.3]} rotation={[k, k * 2, 0]} />
						))}
					</group>
				) : (
					<group key={i} position={p} scale={0.12}>
						{[0, 1, 2, 3, 4].map((k) => (
							<mesh key={k} geometry={GEO.pedra} material={mt.cloro} position={[Math.cos(k * 1.25) * 1.4, Math.sin(k * 1.25) * 1.4, 0]} scale={0.35} />
						))}
					</group>
				),
			)}
			{/* saída para a caixa d'água */}
			<Canos pts={[[-11.0, 1.2, -9.0], [-11.0, 1.2, -1.0], [-20.5, 1.2, -1.0], [-20.5, 1.2, 4.0]]} r={0.22} m={mt.vidro} juntas={mt.canoLimpo} />
			{/* cerca da ETA */}
			<Cerca a={[-9.6, -7.0]} b={[-9.6, -20.0]} />
			{/* placa */}
			<group position={[-9.6, CHAO, -6.4]}>
				<Bx p={[-0.6, 0.7, 0]} s={[0.1, 1.4, 0.1]} m={mt.ferro} />
				<Bx p={[0.6, 0.7, 0]} s={[0.1, 1.4, 0.1]} m={mt.ferro} />
				<Bx p={[0, 1.5, 0]} s={[1.8, 0.7, 0.08]} m={mt.azul} />
			</group>
		</group>
	);
};

// ---------------------------------------------------------------- caixa d'água da cidade (torre) e rede até a casa
export const CaixaDagua: React.FC<{q?: number; nivel?: number}> = ({nivel = 0.75}) => {
	const mt = M();
	const cx = -20.5;
	const cz = 4.0;
	const y0 = 10.0;
	const R = 2.2;
	const H = 3.4;
	return (
		<group>
			{/* pés */}
			{[0, 1, 2, 3].map((i) => {
				const a = Math.PI / 4 + (i * Math.PI) / 2;
				return <Tubo key={i} a={[cx + Math.cos(a) * 2.2, CHAO, cz + Math.sin(a) * 2.2]} b={[cx + Math.cos(a) * 1.5, y0, cz + Math.sin(a) * 1.5]} r={0.16} m={mt.concretoEsc} />;
			})}
			{[3.5, 6.8].map((y) => (
				<mesh key={y} geometry={GEO.cil8} material={mt.concretoEsc} position={[cx, y, cz]} scale={[2.2 - (y / y0) * 0.7, 0.12, 2.2 - (y / y0) * 0.7]} />
			))}
			{/* tanque (aberto na frente: dá para ver o nível da água) */}
			<Cy p={[cx, y0 - 0.15, cz]} r={R + 0.1} h={0.3} m={mt.concreto} />
			<mesh geometry={GEO.meioTubo} material={mt.concretoDuplo} position={[cx, y0 + H / 2, cz]} scale={[R, H, R]} />
			<mesh geometry={GEO.meioCil} material={mt.aguaLimpa} position={[cx, y0 + (H * nivel) / 2, cz]} scale={[R - 0.05, H * nivel, R - 0.05]} />
			<Bc a={[cx - R + 0.05, y0, cz - 0.01]} b={[cx + R - 0.05, y0 + H * nivel, cz]} m={mt.aguaCorte} />
			<mesh geometry={GEO.meioCone} material={mt.azul} position={[cx, y0 + H + 0.6, cz]} scale={[R + 0.2, 1.2, R + 0.2]} />
			<mesh geometry={GEO.meioToro} material={mt.azul} position={[cx, y0 + H * 0.55, cz]} rotation={[-Math.PI / 2, 0, 0]} scale={[R + 0.05, R + 0.05, 2]} />
			{/* cano que sobe (vidro: a gota aparece) e cano que desce até a rede enterrada */}
			<Tubo a={[cx, 1.2, cz]} b={[cx, y0, cz]} r={0.24} m={mt.vidro} />
			<Canos pts={[[-21.5, y0 + 0.2, 3.4], [-21.5, 9.5, 3.4], [-23.65, 9.5, 3.4], [-23.65, CHAO, 3.4]]} r={0.22} m={mt.vidro} juntas={mt.canoLimpo} />
			{/* escada */}
			<Bc a={[cx + 1.9, CHAO, cz + 0.8]} b={[cx + 1.95, y0, cz + 0.85]} m={mt.ferro} />
			<Bc a={[cx + 1.9, CHAO, cz + 1.3]} b={[cx + 1.95, y0, cz + 1.35]} m={mt.ferro} />
		</group>
	);
};
// Rede de água limpa enterrada pela face esquerda (cortada) até a cozinha da casa.
export const RedeAgua: React.FC = () => {
	const mt = M();
	return (
		<group>
			<TuboCorte a={[3.4, CHAO]} b={[3.4, -1.2]} r={0.24} zc={XL + 0.25} esq m={mt.canoLimpo} borda={0.08} />
			<TuboCorte a={[3.4, -1.2]} b={[ZF - 0.3, -1.2]} r={0.24} zc={XL + 0.25} esq m={mt.canoLimpo} borda={0.08} />
			<TuboCorte a={[XL + 0.1, -1.2]} b={[-20.8, -1.2]} r={0.24} zc={ZF - 0.3} m={mt.canoLimpo} borda={0.08} />
			<TuboCorte a={[-20.8, -1.2]} b={[-20.8, CASA.piso]} r={0.24} zc={ZF - 0.3} m={mt.canoLimpo} borda={0.08} />
		</group>
	);
};

// ---------------------------------------------------------------- linha do trajeto (mapa) e fluxo
// Trajeto "de mapa": sobe o que está enterrado/dentro para a superfície, para a linha ficar legível de cima.
const pontosMapa = (de: number, ate: number, n: number) =>
	Array.from({length: n + 1}, (_, i) => {
		const p = trajeto(de + ((ate - de) * i) / n);
		return new THREE.Vector3(p[0], Math.max(p[1], CHAO) + 1.0, p[2] - (p[2] > ZF - 2 ? 0.8 : 0));
	});
const tuboMapa = (de: number, ate: number, r: number) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pontosMapa(de, ate, 260), false, 'centripetal'), 600, r, 8, false);
let _linhas: {suja: THREE.TubeGeometry; limpa: THREE.TubeGeometry; sujaB: THREE.TubeGeometry; limpaB: THREE.TubeGeometry} | null = null;
const linhas = () => {
	if (!_linhas) {
		const corte = PONTOS.rio.t;
		_linhas = {suja: tuboMapa(0, corte, 0.32), limpa: tuboMapa(corte, 1, 0.32), sujaB: tuboMapa(0, corte, 0.5), limpaB: tuboMapa(corte, 1, 0.5)};
	}
	return _linhas;
};
// Linha desenhável: p de 0 a 1 desenha o trajeto do começo ao fim (marrom até o rio, azul depois). Fica por cima de tudo.
export const LinhaTrajeto: React.FC<{p: number; opacidade?: number}> = ({p, opacidade = 1}) => {
	const mt = M();
	const L = linhas();
	const corte = PONTOS.rio.t;
	const ps = Math.max(0, Math.min(1, p / corte));
	const pl = Math.max(0, Math.min(1, (p - corte) / (1 - corte)));
	const desenhar = (g: THREE.TubeGeometry, f: number) => {
		const total = g.index ? g.index.count : 0;
		g.setDrawRange(0, Math.floor((total * f) / 6) * 6);
	};
	desenhar(L.suja, ps);
	desenhar(L.sujaB, ps);
	desenhar(L.limpa, pl);
	desenhar(L.limpaB, pl);
	mt.linhaSuja.opacity = opacidade;
	mt.linhaLimpa.opacity = opacidade;
	mt.linhaBorda.opacity = opacidade;
	const ponta = trajeto(Math.max(0.0001, p));
	return (
		<group>
			<mesh geometry={L.sujaB} material={mt.linhaBorda} renderOrder={20} />
			<mesh geometry={L.limpaB} material={mt.linhaBorda} renderOrder={20} />
			<mesh geometry={L.suja} material={mt.linhaSuja} renderOrder={21} />
			<mesh geometry={L.limpa} material={mt.linhaLimpa} renderOrder={21} />
			{p > 0.002 && p < 0.998 ? (
				<mesh geometry={GEO.esfLisa} material={p < corte ? mt.linhaSuja : mt.linhaLimpa} position={[ponta[0], Math.max(ponta[1], CHAO) + 1.0, ponta[2] - (ponta[2] > ZF - 2 ? 0.8 : 0)]} scale={0.75} renderOrder={22} />
			) : null}
		</group>
	);
};
// Partículas andando pelo trajeto entre t0 e t1 (mostram direção do fluxo): marrom antes do rio, azul depois.
export const Fluxo: React.FC<{t0: number; t1: number; q: number; n?: number; vel?: number}> = ({t0, t1, q, n = 60, vel = 1}) => {
	const mt = M();
	const L = COMPRIMENTO_TRAJETO * (t1 - t0);
	const corte = PONTOS.rio.t;
	const sujos: ItemInst[] = [];
	const limpos: ItemInst[] = [];
	for (let i = 0; i < n; i++) {
		const f = (i / n + (q * 0.03 * vel) / Math.max(1, L)) % 1;
		const t = t0 + f * (t1 - t0);
		const p = trajeto(t);
		const it = {p: [p[0] + (rnd(i, 1) - 0.5) * 0.15, p[1] + (rnd(i, 2) - 0.5) * 0.15, p[2] + (rnd(i, 3) - 0.5) * 0.15] as V3, s: 0.06 + rnd(i, 4) * 0.04};
		(t < corte ? sujos : limpos).push(it);
	}
	return (
		<group>
			<InstVivo geo={GEO.esfLisa} m={mt.sujeira} max={n} itens={sujos} />
			<InstVivo geo={GEO.esfLisa} m={mt.aguaCorte} max={n} itens={limpos} />
		</group>
	);
};

// ---------------------------------------------------------------- a cidade inteira
export type EstadoCidade = {
	q: number; // quadro (animações em laço)
	casa?: EstadoCasa;
	grade?: EstadoGrade;
	aeracao?: EstadoAeracao;
	decantador?: EstadoDecantador;
	bomba?: number;
	filtro?: EstadoFiltro;
	cloro?: EstadoCloro;
	caixa?: number;
};
export const Cidade: React.FC<EstadoCidade> = ({q, casa, grade, aeracao, decantador, bomba = 1, filtro, cloro, caixa}) => (
	<group>
		<TerrenoM />
		<RioVivo q={q} />
		<Bairro q={q} />
		<CasaM {...casa} />
		<EsgotoM />
		<GradeamentoM {...grade} />
		<TanqueAeracao q={q} {...aeracao} />
		<Decantador q={q} {...decantador} />
		<CanalEfluente q={q} />
		<Captacao q={q} bomba={bomba} />
		<FiltroAreia q={q} {...filtro} />
		<Cloracao q={q} {...cloro} />
		<CaixaDaguaM nivel={caixa} />
		<RedeAguaM />
	</group>
);
// Versões memorizadas (só redesenham quando o estado delas muda).
const TerrenoM = React.memo(Terreno);
const CasaM = React.memo(Casa);
const EsgotoM = React.memo(Esgoto);
const GradeamentoM = React.memo(Gradeamento);
const CaixaDaguaM = React.memo(CaixaDagua);
const RedeAguaM = React.memo(RedeAgua);
