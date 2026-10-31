// Base compartilhada do gota-1 ("Você é uma gota de água"): a gota-personagem 3D e reexporta o palco/câmera/rótulo do
// referencias-ig-1 (Palco, trilha, Rotulo, useQ, lim). Estilo: low-poly limpo, cores chapadas, cenários detalhados.
import React, {useMemo} from 'react';
import * as THREE from 'three';
export {Palco, trilha, Rotulo, useQ, lim, COR, Nuvem} from '../referencias-ig-1/aviao';

export const CORES = {
	agua: '#4fb3ff',
	aguaSuja: '#8a7a4a',
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
export const useMats = () =>
	useMemo(
		() => ({
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
		}),
		[],
	);
export type Mats = ReturnType<typeof useMats>;

// Gota-personagem: corpo em gota (esfera + cone), olhos grandes, boca. humor: 'feliz' | 'assustada' | 'enjoada' | 'aliviada'.
// suja: 0..1 mistura a cor para marrom. pisca: quadro (para piscar).
export const Gota: React.FC<{mats: Mats; humor?: 'feliz' | 'assustada' | 'enjoada' | 'aliviada'; suja?: number; quadro?: number; escala?: number; position?: [number, number, number]; rotation?: [number, number, number]}> = ({
	mats,
	humor = 'feliz',
	suja = 0,
	quadro = 0,
	escala = 1,
	position = [0, 0, 0],
	rotation = [0, 0, 0],
}) => {
	const corpo = useMemo(() => {
		const c = new THREE.Color(CORES.agua).lerp(new THREE.Color(CORES.aguaSuja), Math.max(0, Math.min(1, suja)));
		return new THREE.MeshStandardMaterial({color: c, flatShading: true, roughness: 0.25, emissive: c.clone().multiplyScalar(0.25)});
	}, [suja]);
	const piscando = quadro % 90 > 84;
	const olhoY = humor === 'assustada' ? 1.35 : 1.0;
	const boca = humor === 'assustada' ? 'o' : humor === 'enjoada' ? 'onda' : 'sorriso';
	return (
		<group position={position} rotation={rotation} scale={escala}>
			<mesh material={corpo}>
				<icosahedronGeometry args={[1, 2]} />
			</mesh>
			<mesh material={corpo} position={[0, 1.15, 0]}>
				<coneGeometry args={[0.72, 1.4, 16]} />
			</mesh>
			{/* brilho */}
			<mesh material={mats.branco} position={[-0.45, 0.55, 0.78]}>
				<sphereGeometry args={[0.12, 8, 6]} />
			</mesh>
			{/* olhos */}
			{[-0.32, 0.32].map((x) => (
				<group key={x} position={[x, 0.25, 0.86]}>
					<mesh material={mats.branco} scale={[1, piscando ? 0.12 : olhoY, 0.5]}>
						<sphereGeometry args={[0.22, 12, 10]} />
					</mesh>
					{!piscando ? (
						<mesh material={mats.preto} position={[0, 0, 0.1]} scale={[1, olhoY, 0.6]}>
							<sphereGeometry args={[0.11, 10, 8]} />
						</mesh>
					) : null}
				</group>
			))}
			{/* boca */}
			{boca === 'o' ? (
				<mesh material={mats.preto} position={[0, -0.25, 0.92]} scale={[1, 1.3, 0.4]}>
					<sphereGeometry args={[0.12, 10, 8]} />
				</mesh>
			) : (
				<mesh material={mats.preto} position={[0, boca === 'onda' ? -0.22 : -0.2, 0.9]} rotation={[0, 0, boca === 'onda' ? 0.3 : 0]}>
					<torusGeometry args={[0.16, 0.035, 6, 12, boca === 'onda' ? Math.PI * 0.6 : Math.PI]} />
				</mesh>
			)}
		</group>
	);
};
