// Realismo para os efeitos 3D (08/11/2026, pedido do usuário: "objetos mais realistas sem aumentar muito o tempo").
// - Luz de estúdio real (HDRI do Poly Haven, public/hdri/estudio.hdr) no lugar do RoomEnvironment genérico: o metal reflete
//   softboxes de verdade. Carregada uma vez por página (cache do módulo), com delayRender para o quadro esperar.
// - Modelos 3D prontos (GLTF CC0 do Poly Haven em public/modelos3d/<id>/<id>.gltf) com useModelo/Modelo: centralizados e
//   no tamanho pedido (maior lado = tamanho, em unidades do mundo).
// - Textura procedural de microrrugosidade (roughness + bump) para tirar o "liso perfeito" do metal gerado por código.
// - SombraContato: sombra suave no chão debaixo do objeto (para de parecer que flutua).
import React, {useEffect, useMemo, useState} from 'react';
import {useThree} from '@react-three/fiber';
import {continueRender, delayRender, staticFile} from 'remotion';
import * as THREE from 'three';
import {RGBELoader} from 'three/examples/jsm/loaders/RGBELoader.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';

// ── Luz de estúdio ────────────────────────────────────────────────────────────────────────────────────────────────
let hdr: THREE.DataTexture | null = null;
let hdrPromessa: Promise<THREE.DataTexture | null> | null = null;
const carregarHdr = () => {
	if (!hdrPromessa) {
		hdrPromessa = new RGBELoader()
			.loadAsync(staticFile('hdri/estudio.hdr'))
			.then((t) => {
				t.mapping = THREE.EquirectangularReflectionMapping;
				hdr = t;
				return t;
			})
			.catch(() => null);
	}
	return hdrPromessa;
};

// Põe o HDRI como reflexo da cena (o fundo continua transparente). Sem o arquivo, cai no RoomEnvironment de antes.
export const AmbienteEstudio: React.FC<{intensidade?: number}> = ({intensidade = 1}) => {
	const {gl, scene} = useThree();
	const [tex, setTex] = useState<THREE.DataTexture | null>(hdr);
	useEffect(() => {
		if (tex) return;
		const h = delayRender('HDRI de estúdio');
		carregarHdr().then((t) => {
			setTex(t);
			continueRender(h);
		});
	}, [tex]);
	useMemo(() => {
		const pmrem = new THREE.PMREMGenerator(gl);
		scene.environment = tex ? pmrem.fromEquirectangular(tex).texture : pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
		scene.environmentIntensity = intensidade;
		// Leve giro do HDRI para os softboxes baterem de cima e da esquerda, como a luz principal das peças.
		scene.environmentRotation = new THREE.Euler(0, -0.6, 0);
		pmrem.dispose();
	}, [gl, scene, tex, intensidade]);
	return null;
};

// ── Microrrugosidade ──────────────────────────────────────────────────────────────────────────────────────────────
let rugosa: THREE.DataTexture | null = null;
// Ruído suave (soma de 3 oitavas de valor interpolado) em 256x256, repetível. roughnessMap usa o canal G; bumpMap, o R.
export const texturaRugosa = () => {
	if (rugosa) return rugosa;
	const N = 256;
	const dados = new Uint8Array(N * N * 4);
	const grade = (s: number) => {
		const g = Array.from({length: s * s}, (_, i) => {
			const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
			return x - Math.floor(x);
		});
		return (u: number, v: number) => {
			const x = (u * s) % s, y = (v * s) % s;
			const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
			const a = g[y0 * s + x0], b = g[y0 * s + ((x0 + 1) % s)], c = g[((y0 + 1) % s) * s + x0], d = g[((y0 + 1) % s) * s + ((x0 + 1) % s)];
			const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
			return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
		};
	};
	const oitavas = [grade(8), grade(32), grade(128)];
	for (let y = 0; y < N; y++) {
		for (let x = 0; x < N; x++) {
			const u = x / N, v = y / N;
			const n = oitavas[0](u, v) * 0.5 + oitavas[1](u, v) * 0.3 + oitavas[2](u, v) * 0.2;
			const i = (y * N + x) * 4;
			dados[i] = Math.round(n * 255); // bump
			dados[i + 1] = Math.round((0.72 + 0.28 * n) * 255); // multiplica a rugosidade de 72% a 100%
			dados[i + 2] = 255;
			dados[i + 3] = 255;
		}
	}
	rugosa = new THREE.DataTexture(dados, N, N, THREE.RGBAFormat);
	rugosa.wrapS = rugosa.wrapT = THREE.RepeatWrapping;
	rugosa.repeat.set(3, 3);
	rugosa.needsUpdate = true;
	return rugosa;
};

// Aplica a microrrugosidade num material físico (metal de código). bump bem baixo: só quebra o reflexo, não aparece como textura.
export const comRugosidade = <T extends THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial>(m: T, bump = 0.6): T => {
	const t = texturaRugosa();
	m.roughnessMap = t;
	m.bumpMap = t;
	m.bumpScale = bump;
	m.needsUpdate = true;
	return m;
};

// ── Modelos GLTF ──────────────────────────────────────────────────────────────────────────────────────────────────
const cacheModelos = new Map<string, Promise<THREE.Group>>();
const prontos = new Map<string, THREE.Group>();
const carregarModelo = (id: string) => {
	let p = cacheModelos.get(id);
	if (!p) {
		p = new GLTFLoader().loadAsync(staticFile(`modelos3d/${id}/${id}.gltf`)).then((g) => {
			const raiz = g.scene;
			// Centraliza na origem e normaliza o maior lado para 1.
			const caixa = new THREE.Box3().setFromObject(raiz);
			const tam = caixa.getSize(new THREE.Vector3());
			const centro = caixa.getCenter(new THREE.Vector3());
			const grupo = new THREE.Group();
			raiz.position.sub(centro);
			grupo.add(raiz);
			grupo.scale.setScalar(1 / Math.max(tam.x, tam.y, tam.z));
			raiz.traverse((o) => {
				const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
				if (m && 'envMapIntensity' in m) m.envMapIntensity = 1.2;
			});
			prontos.set(id, grupo);
			return grupo;
		});
		cacheModelos.set(id, p);
	}
	return p;
};

// Devolve um clone do modelo (cada uso pode ter cor/posição própria) ou null enquanto carrega (o render espera).
export const useModelo = (id: string, ajustar?: (g: THREE.Group) => void) => {
	const [base, setBase] = useState<THREE.Group | null>(prontos.get(id) ?? null);
	useEffect(() => {
		if (base) return;
		const h = delayRender(`modelo 3D ${id}`);
		carregarModelo(id)
			.then((g) => setBase(g))
			.catch((e) => console.error(`Não carreguei o modelo ${id}`, e))
			.finally(() => continueRender(h));
	}, [id, base]);
	return useMemo(() => {
		if (!base) return null;
		const c = base.clone(true);
		ajustar?.(c);
		return c;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [base]);
};

// Modelo pronto no lugar pedido. tamanho = maior lado em unidades do mundo (1 unidade ≈ 210 px no plano do texto).
export const Modelo: React.FC<{
	id: string;
	tamanho?: number;
	position?: [number, number, number];
	rotation?: [number, number, number];
	scale?: number;
	ajustar?: (g: THREE.Group) => void;
}> = ({id, tamanho = 1, position, rotation, scale = 1, ajustar}) => {
	const obj = useModelo(id, ajustar);
	if (!obj) return null;
	return (
		<group position={position} rotation={rotation} scale={tamanho * scale}>
			<primitive object={obj} />
		</group>
	);
};

// Pinta todos os materiais de um modelo (ex.: mala no roxo do tema), mantendo as texturas de rugosidade/relevo.
export const pintar = (cor: string, metal?: number, rug?: number) => (g: THREE.Group) => {
	g.traverse((o) => {
		const mesh = o as THREE.Mesh;
		if (!mesh.isMesh) return;
		const m = (mesh.material as THREE.MeshStandardMaterial).clone();
		m.map = null;
		m.color = new THREE.Color(cor);
		if (metal !== undefined) m.metalness = metal;
		if (rug !== undefined) m.roughness = rug;
		mesh.material = m;
	});
};

// ── Sombra de contato ─────────────────────────────────────────────────────────────────────────────────────────────
let texSombra: THREE.CanvasTexture | null = null;
const sombraTex = () => {
	if (texSombra) return texSombra;
	const c = document.createElement('canvas');
	c.width = c.height = 128;
	const g = c.getContext('2d')!;
	const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
	r.addColorStop(0, 'rgba(8,3,20,0.85)');
	r.addColorStop(0.45, 'rgba(8,3,20,0.4)');
	r.addColorStop(1, 'rgba(8,3,20,0)');
	g.fillStyle = r;
	g.fillRect(0, 0, 128, 128);
	texSombra = new THREE.CanvasTexture(c);
	return texSombra;
};

// Elipse escura e macia no "chão" (plano deitado). opacidade cai quando o objeto sobe (altura em unidades acima do chão).
export const SombraContato: React.FC<{x?: number; y: number; z?: number; largura?: number; altura?: number; opacidade?: number}> = ({
	x = 0,
	y,
	z = 0,
	largura = 1.4,
	altura = 0,
	opacidade = 0.75,
}) => {
	const k = Math.max(0, 1 - altura / 2.5);
	return (
		<mesh position={[x, y, z]} rotation={[-Math.PI / 2.3, 0, 0]} scale={[largura * (1 + (1 - k) * 0.4), largura * 0.55 * (1 + (1 - k) * 0.4), 1]} renderOrder={-1}>
			<planeGeometry args={[1, 1]} />
			<meshBasicMaterial map={sombraTex()} transparent opacity={opacidade * k} depthWrite={false} />
		</mesh>
	);
};

// Brilho dos realces (bloom leve) e sombra macia para as camadas 3D sobre o vídeo, em CSS: não perde a transparência
// do canvas (o bloom de pós-processamento do three apaga o brilho fora do objeto quando o fundo é transparente).
export const FILTRO_3D = 'drop-shadow(0 0 10px rgba(255,214,150,0.28)) drop-shadow(0 22px 30px rgba(12,4,28,0.55)) contrast(1.04) saturate(1.05)';
