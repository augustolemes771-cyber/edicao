// Objetos 3D do motion de meia tela (entrevista-pista, 30/10/2026), modelados em código na paleta do tema (roxo, ouro,
// branco metálico). Cada um recebe o quadro da cena e os marcos (quadros) das ações ligadas à fala.
// Câmera de referência: fov 35 a 14,5 de distância (meia altura ~4,57, meia largura ~2,57 unidades num quadro 9:16).
import React, {useMemo} from 'react';
import {interpolate, random, spring, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {useTelaLive} from './Objetos3D';

const lim = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const OURO = '#E8C27A';

// Materiais compartilhados (o ambiente de estúdio vem do <Luzes/> do Texto3D).
const useMats = () =>
	useMemo(
		() => ({
			ouro: new THREE.MeshStandardMaterial({color: OURO, metalness: 1, roughness: 0.22}),
			ouroBrilho: new THREE.MeshStandardMaterial({color: '#ffe3a3', metalness: 0.9, roughness: 0.18, emissive: '#c99a3e', emissiveIntensity: 0.55}),
			roxo: new THREE.MeshPhysicalMaterial({color: '#2a1552', metalness: 0.3, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.15}),
			roxoEscuro: new THREE.MeshPhysicalMaterial({color: '#140a2b', metalness: 0.4, roughness: 0.3, clearcoat: 1}),
			titanio: new THREE.MeshPhysicalMaterial({color: '#d9d3e6', metalness: 1, roughness: 0.26, clearcoat: 0.6}),
			vidroPreto: new THREE.MeshPhysicalMaterial({color: '#040406', metalness: 0.2, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.02}),
			branco: new THREE.MeshPhysicalMaterial({color: '#f1edf7', metalness: 0.1, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.08}),
			prata: new THREE.MeshStandardMaterial({color: '#cfd2dc', metalness: 1, roughness: 0.25}),
		}),
		[],
	);

const retanguloRedondo = (l: number, a: number, r: number) => {
	const s = new THREE.Shape();
	const x = -l / 2;
	const y = -a / 2;
	s.moveTo(x + r, y);
	s.lineTo(x + l - r, y);
	s.quadraticCurveTo(x + l, y, x + l, y + r);
	s.lineTo(x + l, y + a - r);
	s.quadraticCurveTo(x + l, y + a, x + l - r, y + a);
	s.lineTo(x + r, y + a);
	s.quadraticCurveTo(x, y + a, x, y + a - r);
	s.lineTo(x, y + r);
	s.quadraticCurveTo(x, y, x + r, y);
	return s;
};

// Sinal de "+" (ou "−") extrudado com chanfro.
const useSinal = (mais: boolean, tam = 1, prof = 0.18) =>
	useMemo(() => {
		const b = tam * 0.28;
		const s = mais
			? (() => {
					const f = new THREE.Shape();
					const h = tam / 2;
					const m = b / 2;
					f.moveTo(-m, h);
					f.lineTo(m, h);
					f.lineTo(m, m);
					f.lineTo(h, m);
					f.lineTo(h, -m);
					f.lineTo(m, -m);
					f.lineTo(m, -h);
					f.lineTo(-m, -h);
					f.lineTo(-m, -m);
					f.lineTo(-h, -m);
					f.lineTo(-h, m);
					f.lineTo(-m, m);
					f.closePath();
					return f;
				})()
			: retanguloRedondo(tam, b, b * 0.2);
		const g = new THREE.ExtrudeGeometry(s, {depth: prof, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelSegments: 4, curveSegments: 6});
		g.center();
		return g;
	}, [mais, tam, prof]);

// ---------------------------------------------------------------- celular e internet

// Celular realista: corpo de titânio com cantos redondos, vidro preto com reflexo, tela de live, ilha, botões e câmeras atrás.
export const CelularReal: React.FC<{segundos: number}> = ({segundos}) => {
	const m = useMats();
	const corpo = useMemo(() => new RoundedBoxGeometry(1.5, 3.05, 0.17, 8, 0.22), []);
	const vidro = useMemo(() => new THREE.ShapeGeometry(retanguloRedondo(1.44, 2.99, 0.2), 8), []);
	const tela = useMemo(() => {
		const g = new THREE.ShapeGeometry(retanguloRedondo(1.36, 2.9, 0.17), 8);
		// UV de 0 a 1 para a textura da live ocupar a tela.
		const pos = g.attributes.position;
		const uv = new Float32Array(pos.count * 2);
		for (let i = 0; i < pos.count; i++) {
			uv[i * 2] = pos.getX(i) / 1.36 + 0.5;
			uv[i * 2 + 1] = pos.getY(i) / 2.9 + 0.5;
		}
		g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
		return g;
	}, []);
	const modulo = useMemo(() => new RoundedBoxGeometry(0.62, 0.62, 0.06, 4, 0.12), []);
	const telaMat = useTelaLive(segundos);
	// Reflexo de estúdio que corre no vidro.
	const reflexo = ((segundos * 0.45) % 1.6) - 0.3;
	return (
		<group>
			<mesh geometry={corpo} material={m.titanio} />
			<mesh geometry={vidro} material={m.vidroPreto} position={[0, 0, 0.0865]} />
			<mesh geometry={tela} material={telaMat} position={[0, 0, 0.088]} />
			<mesh position={[0, 1.3, 0.0895]} rotation={[0, 0, Math.PI / 2]}>
				<capsuleGeometry args={[0.055, 0.24, 4, 12]} />
				<meshStandardMaterial color="#020203" roughness={0.2} />
			</mesh>
			{/* Botões laterais */}
			<mesh position={[0.765, 0.6, 0]} material={m.titanio}>
				<boxGeometry args={[0.04, 0.42, 0.07]} />
			</mesh>
			<mesh position={[-0.765, 0.75, 0]} material={m.titanio}>
				<boxGeometry args={[0.04, 0.22, 0.07]} />
			</mesh>
			<mesh position={[-0.765, 0.4, 0]} material={m.titanio}>
				<boxGeometry args={[0.04, 0.3, 0.07]} />
			</mesh>
			{/* Módulo de câmeras atrás */}
			<group position={[-0.36, 1.06, -0.1]}>
				<mesh geometry={modulo} material={m.titanio} />
				{[
					[-0.14, 0.14],
					[0.14, 0.14],
					[-0.14, -0.14],
				].map(([x, y], i) => (
					<group key={i} position={[x, y, -0.05]} rotation={[Math.PI / 2, 0, 0]}>
						<mesh material={m.vidroPreto}>
							<cylinderGeometry args={[0.105, 0.11, 0.06, 32]} />
						</mesh>
						<mesh position={[0, -0.032, 0]} material={m.prata}>
							<torusGeometry args={[0.105, 0.012, 8, 32]} />
						</mesh>
					</group>
				))}
			</group>
		</group>
	);
};

// Globo da internet: esfera de vidro roxo com meridianos e paralelos de ouro, nós acesos e arcos de dados que se desenham.
// acende: 0 → 1 (os arcos aparecem em sequência).
export const Globo: React.FC<{segundos: number; raio?: number; acende?: number}> = ({segundos, raio = 1, acende = 1}) => {
	const m = useMats();
	const arcos = useMemo(() => {
		const ponto = (lat: number, lon: number, r: number) =>
			new THREE.Vector3(r * Math.cos(lat) * Math.sin(lon), r * Math.sin(lat), r * Math.cos(lat) * Math.cos(lon));
		return Array.from({length: 7}, (_, i) => {
			const a = ponto((random(`la${i}`) - 0.5) * 2.2, random(`lo${i}`) * Math.PI * 2, raio);
			const b = ponto((random(`lb${i}`) - 0.5) * 2.2, random(`ln${i}`) * Math.PI * 2, raio);
			const meio = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(raio * 1.45);
			const curva = new THREE.QuadraticBezierCurve3(a, meio, b);
			return {geo: new THREE.TubeGeometry(curva, 40, raio * 0.016, 6, false), a, b};
		});
	}, [raio]);
	const brilhoMat = useMemo(() => new THREE.MeshBasicMaterial({color: '#ffd98a', toneMapped: false}), []);
	return (
		<group rotation={[0.35, segundos * 0.55, 0.15]}>
			<mesh material={m.roxo}>
				<sphereGeometry args={[raio * 0.985, 48, 32]} />
			</mesh>
			{[-60, -30, 0, 30, 60].map((lat) => (
				<mesh key={`p${lat}`} position={[0, raio * Math.sin((lat * Math.PI) / 180), 0]} rotation={[Math.PI / 2, 0, 0]} material={m.ouro}>
					<torusGeometry args={[raio * Math.cos((lat * Math.PI) / 180), raio * 0.012, 6, 64]} />
				</mesh>
			))}
			{[0, 30, 60, 90, 120, 150].map((lon) => (
				<mesh key={`m${lon}`} rotation={[0, (lon * Math.PI) / 180, 0]} material={m.ouro}>
					<torusGeometry args={[raio, raio * 0.012, 6, 64]} />
				</mesh>
			))}
			{arcos.map((arco, i) => {
				const p = interpolate(acende * 7 - i, [0, 1], [0, 1], lim);
				if (p <= 0) return null;
				arco.geo.setDrawRange(0, Math.floor(arco.geo.index!.count * p));
				return (
					<group key={i}>
						<mesh geometry={arco.geo} material={brilhoMat} />
						<mesh position={arco.a} material={brilhoMat}>
							<sphereGeometry args={[raio * 0.045, 12, 8]} />
						</mesh>
						{p >= 1 ? (
							<mesh position={arco.b} material={brilhoMat}>
								<sphereGeometry args={[raio * 0.045, 12, 8]} />
							</mesh>
						) : null}
					</group>
				);
			})}
		</group>
	);
};

// Ondas de sinal (arcos de ouro) que pulsam em sequência; aponta para +x.
export const Sinal: React.FC<{segundos: number; liga: number}> = ({segundos, liga}) => (
	<group rotation={[0, 0, -Math.PI / 4]}>
		{[0.35, 0.6, 0.85].map((r, i) => {
			const fase = (segundos * 1.6 - i * 0.22) % 1;
			const op = liga * interpolate(fase, [0, 0.15, 0.7, 1], [0.25, 1, 0.5, 0.25], lim);
			return (
				<mesh key={i} rotation={[0, 0, -Math.PI / 4]}>
					<torusGeometry args={[r, 0.045, 8, 32, Math.PI / 2]} />
					<meshStandardMaterial color={OURO} metalness={0.8} roughness={0.25} emissive="#c99a3e" emissiveIntensity={op} transparent opacity={0.35 + 0.65 * op} />
				</mesh>
			);
		})}
	</group>
);

// ---------------------------------------------------------------- pontos positivos e negativos

// Medalha de "+": salta da grade girando como moeda jogada, cai, balança e gira devagar (pontos positivos da live).
export const MedalhaMais: React.FC<{q: number; entra: number}> = ({q, entra}) => {
	const {fps} = useVideoConfig();
	const m = useMats();
	const mais = useSinal(true, 0.95, 0.16);
	const t = (q - entra) / fps;
	if (t < 0) return null;
	// Salto: sobe e cai em 0,55 s girando 2 voltas; depois balança amortecida e gira lento.
	const voo = Math.min(1, t / 0.55);
	const y = t < 0.55 ? -1.6 + Math.sin(voo * Math.PI) * 1.6 + voo * 1.6 : Math.sin((t - 0.55) * 9) * 0.06 * Math.exp(-(t - 0.55) * 4);
	const giroX = t < 0.55 ? (1 - voo) * Math.PI * 4 : Math.sin((t - 0.55) * 11) * 0.25 * Math.exp(-(t - 0.55) * 5);
	return (
		<group position={[0, y, 0]} rotation={[giroX, Math.sin(t * 1.4) * 0.45, 0]}>
			<mesh rotation={[Math.PI / 2, 0, 0]} material={m.roxo}>
				<cylinderGeometry args={[1.05, 1.05, 0.2, 72]} />
			</mesh>
			<mesh material={m.ouro}>
				<torusGeometry args={[1.05, 0.08, 16, 72]} />
			</mesh>
			<mesh material={m.ouro}>
				<torusGeometry args={[0.86, 0.025, 8, 72]} />
			</mesh>
			<mesh geometry={mais} material={m.ouroBrilho} position={[0, 0, 0.14]} />
			<mesh geometry={mais} material={m.ouroBrilho} position={[0, 0, -0.14]} />
		</group>
	);
};

// Chip de IA: sobe da grade, trilhas de ouro acendem do chip para fora e o "+" no topo pulsa (pontos positivos da IA).
export const ChipIa: React.FC<{q: number; entra: number}> = ({q, entra}) => {
	const {fps} = useVideoConfig();
	const m = useMats();
	const mais = useSinal(true, 0.62, 0.12);
	const base = useMemo(() => new RoundedBoxGeometry(1.7, 1.7, 0.24, 4, 0.08), []);
	const topo = useMemo(() => new RoundedBoxGeometry(1.15, 1.15, 0.08, 4, 0.06), []);
	const pinos = [-0.6, -0.36, -0.12, 0.12, 0.36, 0.6];
	const trilhas = useMemo(
		() =>
			Array.from({length: 12}, (_, i) => ({lado: i % 4, k: [-0.36, 0.12, 0.6][Math.floor(i / 4)], comp: 0.5 + random(`tr${i}`) * 0.6})),
		[],
	);
	const l = q - entra;
	if (l < 0) return null;
	const p = spring({frame: l, fps, config: {damping: 14, stiffness: 110}});
	const t = l / fps;
	return (
		<group position={[0, -1.4 * (1 - p), 0]} rotation={[-0.55 + 0.1 * Math.sin(t * 1.3), (1 - p) * 1.4 + Math.sin(t * 0.9) * 0.25, 0]}>
			<mesh geometry={base} material={m.roxoEscuro} />
			<mesh geometry={topo} material={m.ouro} position={[0, 0, 0.15]} />
			<mesh geometry={mais} material={m.ouroBrilho} position={[0, 0, 0.26]} scale={1 + 0.08 * Math.sin(t * 6)} />
			{pinos.flatMap((k, i) => [
				<mesh key={`a${i}`} position={[k, 0.95, 0]} material={m.ouro}>
					<boxGeometry args={[0.1, 0.22, 0.06]} />
				</mesh>,
				<mesh key={`b${i}`} position={[k, -0.95, 0]} material={m.ouro}>
					<boxGeometry args={[0.1, 0.22, 0.06]} />
				</mesh>,
				<mesh key={`c${i}`} position={[0.95, k, 0]} material={m.ouro}>
					<boxGeometry args={[0.22, 0.1, 0.06]} />
				</mesh>,
				<mesh key={`d${i}`} position={[-0.95, k, 0]} material={m.ouro}>
					<boxGeometry args={[0.22, 0.1, 0.06]} />
				</mesh>,
			])}
			{trilhas.map((tr, i) => {
				const acende = interpolate(t, [0.35 + i * 0.06, 0.6 + i * 0.06], [0, 1], lim);
				const ang = (tr.lado * Math.PI) / 2;
				const dist = 1.06 + (tr.comp * acende) / 2;
				return (
					<mesh key={i} rotation={[0, 0, ang]} position={[Math.cos(ang) * dist - Math.sin(ang) * tr.k, Math.sin(ang) * dist + Math.cos(ang) * tr.k, -0.02]}>
						<boxGeometry args={[Math.max(0.001, tr.comp * acende), 0.035, 0.02]} />
						<meshBasicMaterial color="#ffd98a" toneMapped={false} />
					</mesh>
				);
			})}
		</group>
	);
};

// Placa de alerta (triângulo de ouro com "!") que desce pendurada e balança como placa (pontos negativos da live).
export const PlacaAlerta: React.FC<{q: number; entra: number}> = ({q, entra}) => {
	const {fps} = useVideoConfig();
	const m = useMats();
	const tri = useMemo(() => {
		const s = new THREE.Shape();
		const r = 1.25;
		const pts = [0, 1, 2].map((i) => new THREE.Vector2(Math.cos(Math.PI / 2 + (i * 2 * Math.PI) / 3) * r, Math.sin(Math.PI / 2 + (i * 2 * Math.PI) / 3) * r));
		s.moveTo(pts[0].x, pts[0].y);
		s.lineTo(pts[1].x, pts[1].y);
		s.lineTo(pts[2].x, pts[2].y);
		s.closePath();
		const g = new THREE.ExtrudeGeometry(s, {depth: 0.18, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.08, bevelSegments: 5});
		g.center();
		return g;
	}, []);
	const l = q - entra;
	if (l < 0) return null;
	const t = l / fps;
	const desce = spring({frame: l, fps, config: {damping: 11, stiffness: 120}});
	const balanco = Math.sin(t * 6.5) * 0.45 * Math.exp(-t * 1.6) + Math.sin(t * 1.7) * 0.04;
	return (
		// Pivô acima da placa: o balanço é de placa pendurada.
		<group position={[0, 1.6 + (1 - desce) * 3, 0]} rotation={[0, Math.sin(t * 0.8) * 0.2, balanco]}>
			{[-0.55, 0.55].map((x) => (
				<mesh key={x} position={[x * 0.55, -0.35, 0]} rotation={[0, 0, x > 0 ? 0.42 : -0.42]} material={m.ouro}>
					<cylinderGeometry args={[0.025, 0.025, 0.8, 8]} />
				</mesh>
			))}
			<group position={[0, -1.6, 0]}>
				<mesh geometry={tri} material={m.ouro} />
				<mesh geometry={tri} material={m.roxoEscuro} scale={[0.78, 0.78, 1.15]} position={[0, -0.08, 0]} />
				<mesh position={[0, 0.02, 0.2]} material={m.ouroBrilho}>
					<capsuleGeometry args={[0.09, 0.42, 6, 16]} />
				</mesh>
				<mesh position={[0, -0.5, 0.2]} material={m.ouroBrilho}>
					<sphereGeometry args={[0.1, 20, 14]} />
				</mesh>
			</group>
		</group>
	);
};

// Balança de ouro: entra vazia e o prato do "−" pesa e desce (pontos negativos da IA).
export const Balanca: React.FC<{q: number; entra: number; pesa: number}> = ({q, entra, pesa}) => {
	const {fps} = useVideoConfig();
	const m = useMats();
	const menos = useSinal(false, 0.5, 0.1);
	const mais = useSinal(true, 0.5, 0.1);
	const l = q - entra;
	if (l < 0) return null;
	const t = l / fps;
	const p = spring({frame: l, fps, config: {damping: 14, stiffness: 100}});
	const inclina = spring({frame: q - pesa, fps, config: {damping: 7, stiffness: 90}}) * 0.32 + Math.sin(t * 2) * 0.02;
	const prato = (lado: -1 | 1, sinal: THREE.BufferGeometry) => {
		const ang = -inclina;
		const x = lado * 1.35 * Math.cos(ang);
		const y = 0.9 + lado * 1.35 * Math.sin(ang);
		return (
			<group position={[x, y, 0]}>
				<mesh position={[0, -0.45, 0]} material={m.ouro}>
					<cylinderGeometry args={[0.012, 0.012, 0.9, 6]} />
				</mesh>
				<mesh position={[0, -0.92, 0]} material={m.ouro}>
					<cylinderGeometry args={[0.55, 0.42, 0.08, 40]} />
				</mesh>
				<mesh geometry={sinal} material={lado === -1 ? m.prata : m.ouroBrilho} position={[0, -0.6, 0.1]} />
			</group>
		);
	};
	return (
		<group position={[0, -0.9 - (1 - p) * 2, 0]} rotation={[0.08, (1 - p) * -1.2 + Math.sin(t * 0.7) * 0.18, 0]} scale={0.95}>
			<mesh position={[0, -0.75, 0]} material={m.roxoEscuro}>
				<cylinderGeometry args={[0.7, 0.85, 0.18, 48]} />
			</mesh>
			<mesh position={[0, 0.1, 0]} material={m.ouro}>
				<cylinderGeometry args={[0.06, 0.09, 1.7, 16]} />
			</mesh>
			<mesh position={[0, 0.98, 0]} material={m.ouroBrilho}>
				<sphereGeometry args={[0.13, 20, 14]} />
			</mesh>
			<mesh position={[0, 0.9, 0]} rotation={[0, 0, -inclina]} material={m.ouro}>
				<boxGeometry args={[2.8, 0.07, 0.07]} />
			</mesh>
			{prato(-1, menos)}
			{prato(1, mais)}
		</group>
	);
};

// ---------------------------------------------------------------- zero barreira

// Parede de tijolos roxos com rejunte de ouro: monta na entrada e explode para fora no marco `quebra`.
export const Parede: React.FC<{q: number; quebra: number}> = ({q, quebra}) => {
	const {fps} = useVideoConfig();
	const tijolo = useMemo(() => new RoundedBoxGeometry(0.6, 0.3, 0.32, 2, 0.03), []);
	const mats = useMemo(
		() =>
			Array.from({length: 4}, (_, i) =>
				new THREE.MeshStandardMaterial({color: new THREE.Color().setHSL(0.73, 0.32 - i * 0.04, 0.2 + i * 0.035), metalness: 0.15, roughness: 0.7}),
			),
		[],
	);
	const rejunte = useMemo(() => new THREE.MeshStandardMaterial({color: OURO, metalness: 1, roughness: 0.3, emissive: '#7a5a20', emissiveIntensity: 0.4}), []);
	const linhas = 5;
	const colunas = 7;
	const tijolos = useMemo(() => {
		const lista: {x: number; y: number; i: number}[] = [];
		for (let r = 0; r < linhas; r++) {
			const desloca = r % 2 ? 0.31 : 0;
			for (let c = 0; c < colunas; c++) {
				const x = (c - (colunas - 1) / 2) * 0.62 + desloca - 0.155;
				if (Math.abs(x) > 2.25) continue;
				lista.push({x, y: (r - (linhas - 1) / 2) * 0.32, i: lista.length});
			}
		}
		return lista;
	}, []);
	const tq = (q - quebra) / fps;
	return (
		<group>
			{/* Rejunte: placa de ouro atrás dos tijolos (some quando quebra). */}
			{tq < 0 ? (
				<mesh position={[0, 0, -0.08]} material={rejunte}>
					<boxGeometry args={[4.5, 1.62, 0.1]} />
				</mesh>
			) : null}
			{tijolos.map((b) => {
				// Montagem: cada tijolo cai no lugar, de baixo para cima.
				const monta = spring({frame: q - Math.floor(b.y * 6 + 6 + random(`m${b.i}`) * 4), fps, config: {damping: 13, stiffness: 160}});
				let x = b.x;
				let y = b.y + (1 - monta) * 3;
				let z = 0;
				let rx = 0;
				let ry = 0;
				let rz = 0;
				if (tq > 0) {
					// Explosão a partir do centro, para a câmera, com gravidade e giro.
					const dx = b.x;
					const dy = b.y + 0.2;
					const d = Math.hypot(dx, dy) + 0.3;
					const forca = 3.2 / d + random(`f${b.i}`) * 1.2;
					x += (dx / d) * forca * tq * 1.6;
					y += ((dy / d) * forca * 1.2 + 2) * tq - 0.5 * 9 * tq * tq;
					z += (2.5 + random(`z${b.i}`) * 3) * tq * 2.2;
					rx = tq * (random(`rx${b.i}`) - 0.5) * 14;
					ry = tq * (random(`ry${b.i}`) - 0.5) * 14;
					rz = tq * (random(`rz${b.i}`) - 0.5) * 10;
				}
				return <mesh key={b.i} geometry={tijolo} material={mats[b.i % 4]} position={[x, y, z]} rotation={[rx, ry, rz]} />;
			})}
		</group>
	);
};

// ---------------------------------------------------------------- liberdade

// Pilha de moedas de ouro que cresce moeda a moeda (liberdade financeira).
export const PilhaMoedas: React.FC<{q: number; entra: number; n?: number}> = ({q, entra, n = 9}) => {
	const {fps} = useVideoConfig();
	const m = useMats();
	return (
		<group>
			{Array.from({length: n}, (_, i) => {
				const l = q - entra - i * 2;
				if (l < 0) return null;
				const p = spring({frame: l, fps, config: {damping: 12, stiffness: 170}});
				const torto = (random(`pm${i}`) - 0.5) * 0.08;
				return (
					<group key={i} position={[torto, i * 0.15 + (1 - p) * 2.2, 0]} rotation={[0.25, 0, 0]}>
						<mesh material={m.ouro}>
							<cylinderGeometry args={[0.55, 0.55, 0.13, 48]} />
						</mesh>
						<mesh position={[0, 0.066, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.ouroBrilho}>
							<torusGeometry args={[0.42, 0.018, 6, 40]} />
						</mesh>
					</group>
				);
			})}
		</group>
	);
};

// Pino de mapa de ouro que cai sobre o globo (liberdade geográfica).
export const Pino: React.FC<{q: number; entra: number}> = ({q, entra}) => {
	const {fps} = useVideoConfig();
	const m = useMats();
	const l = q - entra;
	if (l < 0) return null;
	const p = spring({frame: l, fps, config: {damping: 9, stiffness: 140}});
	return (
		<group position={[0, 1.05 + (1 - p) * 2.4, 0]}>
			<mesh position={[0, 0.48, 0]} material={m.ouroBrilho}>
				<sphereGeometry args={[0.26, 28, 20]} />
			</mesh>
			<mesh position={[0, 0.16, 0]} rotation={[Math.PI, 0, 0]} material={m.ouro}>
				<coneGeometry args={[0.2, 0.5, 28]} />
			</mesh>
			<mesh position={[0, 0.48, 0.2]} material={m.roxoEscuro}>
				<sphereGeometry args={[0.09, 16, 12]} />
			</mesh>
		</group>
	);
};

// ---------------------------------------------------------------- robôs

// Robô de vidro branco com visor roxo e olhos de ouro, filmando com um celular na mão (REC piscando).
// aceno: 0 → 1 levanta o braço esquerdo acenando; filma: false esconde o celular.
export const Robo: React.FC<{segundos: number; fase: number; aceno?: number; filma?: boolean}> = ({segundos, fase, aceno = 0, filma = true}) => {
	const m = useMats();
	const cabeca = useMemo(() => new RoundedBoxGeometry(0.8, 0.62, 0.62, 5, 0.18), []);
	const visor = useMemo(() => new RoundedBoxGeometry(0.66, 0.34, 0.1, 4, 0.1), []);
	const tronco = useMemo(() => new RoundedBoxGeometry(0.72, 0.8, 0.5, 5, 0.2), []);
	const fone = useMemo(() => new RoundedBoxGeometry(0.26, 0.48, 0.04, 3, 0.05), []);
	const t = segundos + fase;
	const pisca = Math.sin(t * 9) > -0.2 ? 1 : 0;
	const olho = Math.sin(t * 2.3) > 0.96 ? 0.15 : 1;
	return (
		<group position={[0, Math.sin(t * 3) * 0.04, 0]} rotation={[0, Math.sin(t * 1.1) * 0.15, 0]}>
			<mesh geometry={tronco} material={m.branco} position={[0, -0.55, 0]} />
			<mesh position={[0, -0.45, 0.26]} material={m.ouroBrilho}>
				<circleGeometry args={[0.1, 24]} />
			</mesh>
			<group position={[0, 0.25, 0]} rotation={[Math.sin(t * 1.7) * 0.08, 0, Math.sin(t * 1.3) * 0.06]}>
				<mesh geometry={cabeca} material={m.branco} />
				<mesh geometry={visor} material={m.vidroPreto} position={[0, 0.02, 0.3]} />
				{[-0.15, 0.15].map((x) => (
					<mesh key={x} position={[x, 0.02, 0.36]} scale={[1, olho, 1]}>
						<capsuleGeometry args={[0.04, 0.06, 4, 10]} />
						<meshBasicMaterial color="#ffd98a" toneMapped={false} />
					</mesh>
				))}
				<mesh position={[0, 0.42, 0]} material={m.prata}>
					<cylinderGeometry args={[0.02, 0.02, 0.24, 8]} />
				</mesh>
				<mesh position={[0, 0.56, 0]} material={m.ouroBrilho}>
					<sphereGeometry args={[0.06, 14, 10]} />
				</mesh>
			</group>
			{/* Braço direito segura o celular filmando para a frente. */}
			<group visible={filma} position={[0.42, -0.35, 0.1]} rotation={[-1.1 + Math.sin(t * 2.2) * 0.08, 0, 0.25]}>
				<mesh position={[0, 0.25, 0]} material={m.branco}>
					<capsuleGeometry args={[0.08, 0.36, 6, 12]} />
				</mesh>
				<group position={[-0.08, 0.6, 0.02]} rotation={[1.1, 0, -0.25]}>
					<mesh geometry={fone} material={m.vidroPreto} />
					<mesh position={[0.07, 0.17, 0.025]}>
						<sphereGeometry args={[0.03, 10, 8]} />
						<meshBasicMaterial color={pisca ? '#ff3b4d' : '#3a0d14'} toneMapped={false} />
					</mesh>
				</group>
			</group>
			<mesh position={[-0.42 - 0.12 * aceno, -0.6 + 0.45 * aceno, 0]} rotation={[0, 0, -0.2 + Math.sin(t * 1.9) * 0.1 - aceno * (2.4 + Math.sin(t * 9) * 0.25)]} material={m.branco}>
				<capsuleGeometry args={[0.08, 0.36, 6, 12]} />
			</mesh>
		</group>
	);
};

// Relógio de ouro com os ponteiros voando (24 horas por dia).
export const Relogio24: React.FC<{q: number; entra: number}> = ({q, entra}) => {
	const {fps} = useVideoConfig();
	const m = useMats();
	const l = q - entra;
	if (l < 0) return null;
	const p = spring({frame: l, fps, config: {damping: 12, stiffness: 140}});
	const t = l / fps;
	return (
		<group scale={p} rotation={[0.1, Math.sin(t * 1.2) * 0.3, 0]}>
			<mesh rotation={[Math.PI / 2, 0, 0]} material={m.roxoEscuro}>
				<cylinderGeometry args={[0.62, 0.62, 0.12, 48]} />
			</mesh>
			<mesh material={m.ouro}>
				<torusGeometry args={[0.62, 0.07, 14, 48]} />
			</mesh>
			{Array.from({length: 12}, (_, i) => (
				<mesh key={i} position={[Math.sin((i * Math.PI) / 6) * 0.48, Math.cos((i * Math.PI) / 6) * 0.48, 0.07]} material={m.ouro}>
					<boxGeometry args={[0.04, 0.1, 0.02]} />
				</mesh>
			))}
			<group rotation={[0, 0, -t * 2.2]} position={[0, 0, 0.09]}>
				<mesh position={[0, 0.16, 0]} material={m.ouroBrilho}>
					<boxGeometry args={[0.06, 0.32, 0.02]} />
				</mesh>
			</group>
			<group rotation={[0, 0, -t * 26]} position={[0, 0, 0.1]}>
				<mesh position={[0, 0.22, 0]} material={m.branco}>
					<boxGeometry args={[0.035, 0.44, 0.02]} />
				</mesh>
			</group>
			<mesh position={[0, 0, 0.12]} material={m.ouroBrilho}>
				<sphereGeometry args={[0.05, 12, 8]} />
			</mesh>
		</group>
	);
};

// ---------------------------------------------------------------- avião

// Avião de linha em branco metálico, com motores e rastro de condensação atrás (o rastro fica parado no céu).
export const Aviao: React.FC<{x: number; y: number; inclina: number; rastro: {x: number; y: number}[]}> = ({x, y, inclina, rastro}) => {
	const m = useMats();
	const asa = useMemo(() => {
		const s = new THREE.Shape();
		s.moveTo(0, 0);
		s.lineTo(-0.35, -1.0);
		s.lineTo(-0.52, -1.0);
		s.lineTo(-0.3, 0);
		s.closePath();
		const g = new THREE.ExtrudeGeometry(s, {depth: 0.03, bevelEnabled: false});
		g.rotateX(Math.PI / 2);
		return g;
	}, []);
	return (
		<group>
			{rastro.map((r, i) => (
				<mesh key={i} position={[r.x, r.y, -0.05]}>
					<sphereGeometry args={[0.05 + i * 0.004, 8, 6]} />
					<meshBasicMaterial color="#ffffff" transparent opacity={Math.max(0, 0.55 - i * 0.02)} depthWrite={false} />
				</mesh>
			))}
			<group position={[x, y, 0]} rotation={[0.25 + inclina, 0.35, 0]}>
				<group rotation={[0, 0, -Math.PI / 2]}>
					<mesh material={m.branco}>
						<capsuleGeometry args={[0.11, 1.2, 8, 20]} />
					</mesh>
					<mesh position={[0, 0.62, 0.03]} material={m.vidroPreto}>
						<sphereGeometry args={[0.06, 12, 8]} />
					</mesh>
				</group>
				{/* asas e cauda */}
				<mesh geometry={asa} material={m.branco} position={[0.05, 0, 0]} />
				<mesh geometry={asa} material={m.branco} position={[0.05, 0, 0]} scale={[1, 1, -1]} />
				<mesh geometry={asa} material={m.branco} position={[-0.58, 0, 0]} scale={[0.4, 1, 0.4]} />
				<mesh geometry={asa} material={m.branco} position={[-0.58, 0, 0]} scale={[0.4, 1, -0.4]} />
				<mesh position={[-0.62, 0.17, 0]} rotation={[0, 0, -0.5]} material={m.roxo}>
					<boxGeometry args={[0.28, 0.24, 0.03]} />
				</mesh>
				{[-0.42, 0.42].map((z) => (
					<mesh key={z} position={[0.0, -0.08, z]} rotation={[0, 0, Math.PI / 2]} material={m.prata}>
						<cylinderGeometry args={[0.06, 0.07, 0.24, 16]} />
					</mesh>
				))}
			</group>
		</group>
	);
};
