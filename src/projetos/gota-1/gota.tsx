// Base compartilhada do gota-1 ("Você é uma gota de água"): a gota-personagem 3D e reexporta o palco/câmera/rótulo do
// referencias-ig-1 (Palco, trilha, Rotulo, useQ, lim). Estilo: low-poly limpo, cores chapadas, cenários detalhados.
import React, {useMemo} from 'react';
import * as THREE from 'three';
export {Palco, trilha, Rotulo, useQ, lim, COR, Nuvem} from '../referencias-ig-1/aviao';

export const CORES = {
	agua: '#3fb0ff',
	aguaSuja: '#8a7440',
	aguaLimpa: '#7fd6ff',
	cano: '#9aa3ad',
	canoEscuro: '#5f6872',
	concreto: '#c9c3b8',
	terra: '#8b6a45',
	terraEscura: '#5e452c',
	grama: '#7cc457',
	ferro: '#4a4f57',
	bacteria: '#9be15d',
	areia: '#e8cf8f',
	cloro: '#d7f5ff',
	tijolo: '#c8674a',
};

const m = (cor: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({color: cor, flatShading: true, roughness: 0.7, ...extra});
const criarMats = () => ({
	agua: m(CORES.agua, {roughness: 0.25, metalness: 0.05, emissive: '#1a5f99', emissiveIntensity: 0.15}),
	aguaSuja: m(CORES.aguaSuja, {roughness: 0.5}),
	aguaLimpa: m(CORES.aguaLimpa, {roughness: 0.2, transparent: true, opacity: 0.85}),
	cano: m(CORES.cano),
	canoEscuro: m(CORES.canoEscuro),
	concreto: m(CORES.concreto),
	terra: m(CORES.terra),
	terraEscura: m(CORES.terraEscura),
	grama: m(CORES.grama),
	ferro: m(CORES.ferro, {metalness: 0.4, roughness: 0.5}),
	bacteria: m(CORES.bacteria),
	areia: m(CORES.areia),
	tijolo: m(CORES.tijolo),
	branco: m('#f5f7fa'),
	preto: m('#1d1f24'),
	amarelo: m('#ffcf3a'),
	vermelho: m('#e5484d'),
	azulEscuro: m('#2f4f7f'),
	cloro: m(CORES.cloro, {emissive: '#9fe8ff', emissiveIntensity: 0.3}),
	// rosto da gota (sem flat shading: olhos e boca lisos)
	olho: new THREE.MeshStandardMaterial({color: '#ffffff', roughness: 0.3}),
	pupila: new THREE.MeshStandardMaterial({color: '#1b2233', roughness: 0.25}),
	brilho: new THREE.MeshBasicMaterial({color: '#ffffff'}),
	boca: new THREE.MeshStandardMaterial({color: '#3a1f2b', roughness: 0.5}),
	lingua: new THREE.MeshStandardMaterial({color: '#ff7a8a', roughness: 0.5}),
	bochecha: new THREE.MeshBasicMaterial({color: '#ff8fb0', transparent: true, opacity: 0.55}),
	sobrancelha: new THREE.MeshStandardMaterial({color: '#1d4f7a', roughness: 0.6}),
});
// Materiais criados uma vez só (compartilhados por todas as cenas: menos trabalho por quadro).
let _mats: ReturnType<typeof criarMats> | null = null;
export const mats = () => (_mats ??= criarMats());
export const useMats = () => mats();
export type Mats = ReturnType<typeof criarMats>;

// Corpo em gota de verdade (curva de lágrima girada): base redonda (raio 1, centro em y 0) e ponta em y ≈ 1.9.
const geoCorpo = (() => {
	const pts: THREE.Vector2[] = [];
	const n = 40;
	for (let i = 0; i <= n; i++) {
		const t = (i / n) * Math.PI; // 0 = ponta, PI = base
		const r = Math.sin(t) * Math.pow(Math.sin(t / 2), 1.6);
		pts.push(new THREE.Vector2(Math.max(0.0001, r * 1.32), Math.cos(t) * 1.45 + 0.45));
	}
	pts.reverse();
	const g = new THREE.LatheGeometry(pts, 36);
	g.computeVertexNormals();
	return g;
})();
const geoEsf = new THREE.SphereGeometry(1, 20, 14);
const geoCapsula = new THREE.CapsuleGeometry(0.05, 0.22, 4, 8);
const geoTorus = (arco: number) => new THREE.TorusGeometry(0.17, 0.045, 8, 20, arco);
const geoSorriso = geoTorus(Math.PI);
const geoOnda = geoTorus(Math.PI * 0.55);

export type Humor = 'feliz' | 'assustada' | 'enjoada' | 'aliviada' | 'tonta';

// Gota-personagem: corpo liso e brilhante, olhos grandes com brilho, sobrancelhas que mudam com o humor, bochechas.
// suja: 0..1 mistura a cor para marrom (e põe manchas). quadro: pisca de vez em quando.
export const Gota: React.FC<{
	mats?: Mats;
	humor?: Humor;
	suja?: number;
	quadro?: number;
	escala?: number;
	position?: [number, number, number];
	rotation?: [number, number, number];
	estica?: number; // >0 estica na vertical (caindo), <0 achata (impacto)
}> = ({humor = 'feliz', suja = 0, quadro = 0, escala = 1, position = [0, 0, 0], rotation = [0, 0, 0], estica = 0}) => {
	const mt = mats();
	const s = Math.max(0, Math.min(1, suja));
	const corpo = useMemo(() => {
		const c = new THREE.Color(CORES.agua).lerp(new THREE.Color(CORES.aguaSuja), s);
		return new THREE.MeshStandardMaterial({color: c, roughness: 0.12, metalness: 0.05, emissive: c.clone().multiplyScalar(0.28)});
	}, [Math.round(s * 20)]);
	const mancha = useMemo(() => new THREE.MeshStandardMaterial({color: '#5c4423', roughness: 0.8, transparent: true, opacity: Math.min(1, s * 1.4)}), [Math.round(s * 20)]);
	const piscando = quadro % 96 > 90;
	const abertos = humor === 'assustada' ? 1.25 : humor === 'tonta' ? 0.55 : 1;
	// sobrancelha: ângulo (positivo = ponta de dentro para cima = preocupada) e altura
	const sob = {feliz: [0.1, 0.5], assustada: [0.45, 0.62], enjoada: [-0.35, 0.48], aliviada: [0.05, 0.52], tonta: [0.3, 0.5]}[humor];
	const sy = 1 + estica * 0.35;
	const sxz = 1 - estica * 0.15;
	return (
		<group position={position} rotation={rotation} scale={escala}>
			<group scale={[sxz, sy, sxz]}>
				<mesh geometry={geoCorpo} material={corpo} />
				{/* brilho grande (reflexo de janela) */}
				<mesh geometry={geoEsf} material={mt.brilho} position={[-0.52, 0.62, 0.62]} scale={[0.1, 0.2, 0.06]} rotation={[0, 0, 0.5]} />
				<mesh geometry={geoEsf} material={mt.brilho} position={[-0.6, 0.3, 0.72]} scale={[0.05, 0.05, 0.04]} />
				{s > 0.05
					? [
							[0.55, -0.35, 0.72, 0.16],
							[-0.3, -0.62, 0.7, 0.12],
							[0.15, 0.85, 0.55, 0.1],
							[-0.75, 0.0, 0.55, 0.11],
						].map(([x, y, z, r], i) => <mesh key={i} geometry={geoEsf} material={mancha} position={[x, y, z]} scale={[r, r, r * 0.4]} />)
					: null}
			</group>
			{/* rosto */}
			{[-1, 1].map((l) => (
				<group key={l} position={[l * 0.3, 0.12, 0.86]}>
					<mesh geometry={geoEsf} material={mt.olho} scale={[0.2, piscando ? 0.03 : 0.26 * abertos, 0.1]} />
					{!piscando ? (
						<>
							<mesh geometry={geoEsf} material={mt.pupila} position={[l * -0.02, -0.03, 0.08]} scale={[0.12, 0.15 * Math.min(1.1, abertos), 0.05]} />
							<mesh geometry={geoEsf} material={mt.brilho} position={[l * -0.02 - 0.04, 0.04, 0.13]} scale={[0.04, 0.045, 0.02]} />
						</>
					) : null}
					<mesh geometry={geoCapsula} material={mt.sobrancelha} position={[0, sob[1] - 0.12 + (humor === 'assustada' ? 0.06 : 0), 0.02]} rotation={[0, 0, Math.PI / 2 + l * -sob[0]]} />
					<mesh geometry={geoEsf} material={mt.bochecha} position={[l * 0.14, -0.27, 0.0]} scale={[0.12, 0.07, 0.04]} />
				</group>
			))}
			{/* boca */}
			{humor === 'assustada' ? (
				<group position={[0, -0.33, 0.93]}>
					<mesh geometry={geoEsf} material={mt.boca} scale={[0.12, 0.16, 0.05]} />
					<mesh geometry={geoEsf} material={mt.lingua} position={[0, -0.07, 0.02]} scale={[0.07, 0.05, 0.03]} />
				</group>
			) : humor === 'enjoada' || humor === 'tonta' ? (
				<mesh geometry={geoOnda} material={mt.boca} position={[0.05, -0.28, 0.92]} rotation={[0, 0, Math.PI + 0.5]} />
			) : (
				<group position={[0, -0.22, 0.91]} rotation={[0, 0, Math.PI]}>
					<mesh geometry={geoSorriso} material={mt.boca} scale={humor === 'aliviada' ? [1.1, 1.2, 1] : [1, 1, 1]} />
				</group>
			)}
		</group>
	);
};
