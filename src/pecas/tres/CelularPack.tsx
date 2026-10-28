// Celular do pack (biblioteca/pack, ex.: '3D models/Phones/iphone.obj'): o modelo OBJ é lido de public/pack/<arquivo>
// (o painel serve do pack deste PC; o render liga o arquivo na public do empacotamento). O modelo é centrado, deitado em pé
// (maior medida no Y, menor no Z), escalado para a altura do Celular de código (3,05) e ganha a tela de live na frente.
// Sem o arquivo (outro PC, nuvem), cai no Celular de código.
import React, {useEffect, useMemo, useState} from 'react';
import {useThree} from '@react-three/fiber';
import {continueRender, delayRender, staticFile} from 'remotion';
import * as THREE from 'three';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader.js';
import {Celular, useTelaLive} from './Objetos3D';

const ALTURA = 3.05;
const cache = new Map<string, Promise<THREE.Group | null>>();
const carregar = (arquivo: string) => {
	if (!cache.has(arquivo)) {
		const url = staticFile(`pack/${arquivo}`);
		cache.set(
			arquivo,
			fetch(url)
				.then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
				.then((txt) => {
					// Arquivo ausente pode voltar como página HTML com 200: sem malha, vale como sem modelo.
					const g = new OBJLoader().parse(txt);
					let malhas = 0;
					g.traverse((o) => {
						if ((o as THREE.Mesh).isMesh) malhas++;
					});
					return malhas ? g : null;
				})
				.catch(() => null),
		);
	}
	return cache.get(arquivo)!;
};

type Pronto = {objeto: THREE.Group; largura: number; profundidade: number};

// Mede o modelo e gira para ficar em pé de frente para a câmera.
const preparar = (g: THREE.Group): Pronto => {
	const caixa = new THREE.Box3().setFromObject(g);
	const t = caixa.getSize(new THREE.Vector3());
	const eixos = (['x', 'y', 'z'] as const).slice().sort((a, b) => t[b] - t[a]);
	const pivo = new THREE.Group();
	const centro = caixa.getCenter(new THREE.Vector3());
	g.position.sub(centro);
	pivo.add(g);
	// Maior medida → Y, do meio → X, menor → Z (matriz de permutação; se espelhar, inverte o Z).
	const col = {x: 0, y: 1, z: 2};
	const linha = (eixo: 'x' | 'y' | 'z', sinal = 1) => [0, 1, 2].map((c) => (c === col[eixo] ? sinal : 0)) as [number, number, number];
	const lx = linha(eixos[1]);
	const ly = linha(eixos[0]);
	const det = new THREE.Matrix3().set(...lx, ...ly, ...linha(eixos[2])).determinant();
	const lz = linha(eixos[2], det < 0 ? -1 : 1);
	pivo.quaternion.setFromRotationMatrix(new THREE.Matrix4().set(...lx, 0, ...ly, 0, ...lz, 0, 0, 0, 0, 1));
	const k = ALTURA / t[eixos[0]];
	pivo.scale.setScalar(k);
	const raiz = new THREE.Group();
	raiz.add(pivo);
	return {objeto: raiz, largura: t[eixos[1]] * k, profundidade: t[eixos[2]] * k};
};

export const CelularPack: React.FC<{arquivo: string; segundos: number}> = ({arquivo, segundos}) => {
	const [pronto, setPronto] = useState<Pronto | null | undefined>(undefined);
	const [espera] = useState(() => delayRender(`Modelo do pack: ${arquivo}`));
	// No render o ThreeCanvas só desenha quando o quadro muda: depois de trocar o modelo, desenha de novo na mão.
	const {advance} = useThree();
	useEffect(() => {
		let vivo = true;
		carregar(arquivo).then((g) => {
			if (vivo) setPronto(g ? preparar(g.clone()) : null);
		});
		return () => {
			vivo = false;
		};
	}, [arquivo]);
	// Libera o quadro só depois de o modelo (ou o celular de código) estar montado e desenhado.
	useEffect(() => {
		if (pronto === undefined) return;
		requestAnimationFrame(() => {
			advance(performance.now());
			continueRender(espera);
		});
	}, [pronto, espera, advance]);
	const metal = useMemo(
		() => new THREE.MeshPhysicalMaterial({color: '#16171a', metalness: 0.7, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.1}),
		[],
	);
	useEffect(() => {
		pronto?.objeto.traverse((o) => {
			if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).material = metal;
		});
	}, [pronto, metal]);
	const tela = useTelaLive(segundos);
	if (pronto === undefined) return null;
	if (pronto === null) return <Celular segundos={segundos} />;
	return (
		<group>
			<primitive object={pronto.objeto} />
			<mesh position={[0, 0, pronto.profundidade / 2 + 0.006]} material={tela}>
				<planeGeometry args={[pronto.largura * 0.9, ALTURA * 0.94]} />
			</mesh>
		</group>
	);
};
