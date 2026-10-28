import React, {useMemo} from 'react';
import {random} from 'remotion';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// Objetos 3D modelados por código para os cenários (docs/referencias/desmontagem-2.md).
// Nenhum depende de arquivo externo: geometria por perfil girado (lathe) e texturas desenhadas em canvas.

export type TipoObjeto3D = 'rei' | 'moeda' | 'notas' | 'relogio' | 'lampiao' | 'celular' | 'caixa';

const textura = (largura: number, altura: number, desenhar: (c: CanvasRenderingContext2D) => void) => {
	const canvas = document.createElement('canvas');
	canvas.width = largura;
	canvas.height = altura;
	desenhar(canvas.getContext('2d')!);
	const t = new THREE.CanvasTexture(canvas);
	t.colorSpace = THREE.SRGBColorSpace;
	t.anisotropy = 8;
	return t;
};

const perfil = (pontos: [number, number][]) => pontos.map(([r, y]) => new THREE.Vector2(r, y));

// Rei de xadrez em madeira envernizada (ref. 1, "GET UP").
export const Rei: React.FC = () => {
	const geo = useMemo(
		() =>
			new THREE.LatheGeometry(
				perfil([
					[0, 0],
					[0.62, 0],
					[0.64, 0.06],
					[0.6, 0.14],
					[0.5, 0.2],
					[0.52, 0.27],
					[0.42, 0.33],
					[0.33, 0.42],
					[0.27, 0.7],
					[0.22, 1.05],
					[0.2, 1.3],
					[0.33, 1.36],
					[0.34, 1.42],
					[0.22, 1.48],
					[0.26, 1.56],
					[0.36, 1.78],
					[0.38, 1.86],
					[0.24, 1.92],
					[0.12, 1.95],
					[0, 1.96],
				]),
				96,
			),
		[],
	);
	const madeira = useMemo(
		() =>
			new THREE.MeshPhysicalMaterial({
				color: '#6b3418',
				roughness: 0.32,
				clearcoat: 1,
				clearcoatRoughness: 0.12,
				sheen: 0.3,
			}),
		[],
	);
	return (
		<group>
			<mesh geometry={geo} material={madeira} castShadow receiveShadow />
			<mesh position={[0, 2.12, 0]} material={madeira} castShadow>
				<boxGeometry args={[0.1, 0.34, 0.1]} />
			</mesh>
			<mesh position={[0, 2.16, 0]} material={madeira} castShadow>
				<boxGeometry args={[0.28, 0.09, 0.1]} />
			</mesh>
		</group>
	);
};

// Moeda dourada com relevo desenhado (ref. 4).
export const Moeda: React.FC<{simbolo?: string}> = ({simbolo = '$'}) => {
	const face = useMemo(
		() =>
			textura(512, 512, (c) => {
				const g = c.createRadialGradient(256, 256, 40, 256, 256, 256);
				g.addColorStop(0, '#f6d77a');
				g.addColorStop(1, '#b8860b');
				c.fillStyle = g;
				c.fillRect(0, 0, 512, 512);
				c.strokeStyle = '#8a6410';
				c.lineWidth = 14;
				c.beginPath();
				c.arc(256, 256, 214, 0, Math.PI * 2);
				c.stroke();
				for (let i = 0; i < 90; i++) {
					const a = (i / 90) * Math.PI * 2;
					c.fillStyle = '#9a7015';
					c.fillRect(256 + Math.cos(a) * 232 - 3, 256 + Math.sin(a) * 232 - 3, 6, 6);
				}
				c.fillStyle = '#7a560c';
				c.font = 'bold 260px serif';
				c.textAlign = 'center';
				c.textBaseline = 'middle';
				c.fillText(simbolo, 256, 270);
			}),
		[simbolo],
	);
	const ouro = useMemo(() => new THREE.MeshStandardMaterial({color: '#d9a93c', metalness: 1, roughness: 0.28}), []);
	const frente = useMemo(
		() => new THREE.MeshStandardMaterial({map: face, bumpMap: face, bumpScale: 2, metalness: 0.95, roughness: 0.3}),
		[face],
	);
	// Ordem dos materiais do cilindro: lateral, topo, base.
	return (
		<mesh rotation={[Math.PI / 2, 0, 0]} material={[ouro, frente, frente]} castShadow receiveShadow>
			<cylinderGeometry args={[0.6, 0.6, 0.09, 96]} />
		</mesh>
	);
};

// Maço de notas com cinta de papel (ref. 3, "1 MILLION").
export const Notas: React.FC = () => {
	const nota = useMemo(
		() =>
			textura(1024, 440, (c) => {
				c.fillStyle = '#cfd6c4';
				c.fillRect(0, 0, 1024, 440);
				c.strokeStyle = '#5d6f55';
				c.lineWidth = 10;
				c.strokeRect(22, 22, 980, 396);
				c.lineWidth = 2;
				for (let i = 0; i < 26; i++) c.strokeRect(40 + i * 1.5, 40 + i * 1.5, 944 - i * 3, 360 - i * 3);
				c.fillStyle = '#9fae95';
				c.beginPath();
				c.ellipse(512, 220, 120, 150, 0, 0, Math.PI * 2);
				c.fill();
				c.fillStyle = '#4b5d45';
				c.font = 'bold 120px serif';
				c.fillText('100', 70, 150);
				c.fillText('100', 760, 400);
				c.font = 'bold 36px serif';
				c.textAlign = 'center';
				c.fillText('THE UNITED STATES OF AMERICA', 512, 80);
				c.beginPath();
				c.arc(250, 260, 60, 0, Math.PI * 2);
				c.strokeStyle = '#4b5d45';
				c.lineWidth = 6;
				c.stroke();
			}),
		[],
	);
	const borda = useMemo(
		() =>
			textura(512, 64, (c) => {
				for (let y = 0; y < 64; y += 2) {
					c.fillStyle = y % 4 === 0 ? '#e9ece2' : '#b8c1ad';
					c.fillRect(0, y, 512, 2);
				}
			}),
		[],
	);
	const mats = useMemo(() => {
		const lado = new THREE.MeshStandardMaterial({map: borda, roughness: 0.9});
		const topo = new THREE.MeshStandardMaterial({map: nota, roughness: 0.75});
		// Ordem do box: +x, -x, +y (topo), -y, +z, -z.
		return [lado, lado, topo, lado, lado, lado];
	}, [nota, borda]);
	const cinta = useMemo(() => new THREE.MeshStandardMaterial({color: '#f4f1e8', roughness: 0.85}), []);
	return (
		<group>
			<mesh material={mats} castShadow receiveShadow>
				<boxGeometry args={[2.34, 0.42, 1]} />
			</mesh>
			<mesh position={[-0.35, 0, 0]} material={cinta} castShadow>
				<boxGeometry args={[0.42, 0.44, 1.02]} />
			</mesh>
		</group>
	);
};

// Relógio de bolso com ponteiros andando (ref. 1, "You need discipline").
export const Relogio: React.FC<{segundos: number}> = ({segundos}) => {
	const mostrador = useMemo(
		() =>
			textura(512, 512, (c) => {
				c.fillStyle = '#f7f3ea';
				c.fillRect(0, 0, 512, 512);
				c.fillStyle = '#1d1d1d';
				c.textAlign = 'center';
				c.textBaseline = 'middle';
				c.font = '46px serif';
				const romanos = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
				romanos.forEach((r, i) => {
					const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
					c.fillText(r, 256 + Math.cos(a) * 190, 256 + Math.sin(a) * 190);
				});
				for (let i = 0; i < 60; i++) {
					const a = (i / 60) * Math.PI * 2;
					c.fillRect(256 + Math.cos(a) * 236 - 2, 256 + Math.sin(a) * 236 - 2, 4, i % 5 === 0 ? 10 : 4);
				}
			}),
		[],
	);
	const caixa = useMemo(() => new THREE.MeshStandardMaterial({color: '#7a4a2a', metalness: 0.9, roughness: 0.35}), []);
	const face = useMemo(() => new THREE.MeshStandardMaterial({map: mostrador, roughness: 0.5}), [mostrador]);
	const vidro = useMemo(
		() =>
			new THREE.MeshPhysicalMaterial({
				color: '#ffffff',
				transparent: true,
				opacity: 0.12,
				roughness: 0.02,
				clearcoat: 1,
			}),
		[],
	);
	const preto = useMemo(() => new THREE.MeshStandardMaterial({color: '#111', roughness: 0.4}), []);
	const aMin = -(segundos / 60) * Math.PI * 2;
	const aHora = aMin / 12;
	return (
		<group>
			<mesh material={caixa} castShadow receiveShadow>
				<torusGeometry args={[1, 0.12, 32, 128]} />
			</mesh>
			<mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.04]} material={[caixa, face, caixa]} receiveShadow>
				<cylinderGeometry args={[1, 1, 0.12, 96]} />
			</mesh>
			<mesh position={[0, 0, 0.07]} rotation={[0, 0, aHora]} material={preto}>
				<boxGeometry args={[0.05, 0.9, 0.02]} />
			</mesh>
			<mesh position={[0, 0, 0.08]} rotation={[0, 0, aMin]} material={preto}>
				<boxGeometry args={[0.03, 1.5, 0.02]} />
			</mesh>
			<mesh position={[0, 0, 0.09]} rotation={[Math.PI / 2, 0, 0]} material={vidro}>
				<cylinderGeometry args={[0.98, 0.98, 0.02, 96]} />
			</mesh>
			<mesh position={[0, 1.18, 0]} material={caixa} castShadow>
				<cylinderGeometry args={[0.1, 0.1, 0.22, 32]} />
			</mesh>
			<mesh position={[0, 1.44, 0]} material={caixa} castShadow>
				<torusGeometry args={[0.2, 0.04, 16, 64]} />
			</mesh>
		</group>
	);
};

// Lampião com vidro aceso (ref. 3, "True Value Always SHINE").
export const Lampiao: React.FC<{cor?: string}> = ({cor = '#b6ff3a'}) => {
	const metal = useMemo(() => new THREE.MeshStandardMaterial({color: '#2a2b2c', metalness: 0.8, roughness: 0.45}), []);
	const vidro = useMemo(
		() =>
			new THREE.MeshPhysicalMaterial({
				color: cor,
				emissive: cor,
				emissiveIntensity: 0.9,
				transparent: true,
				opacity: 0.85,
				roughness: 0.1,
				clearcoat: 1,
			}),
		[cor],
	);
	const globo = useMemo(
		() =>
			new THREE.LatheGeometry(
				perfil([
					[0.3, 0],
					[0.55, 0.25],
					[0.62, 0.6],
					[0.55, 0.95],
					[0.32, 1.15],
				]),
				64,
			),
		[],
	);
	const base = useMemo(
		() =>
			new THREE.LatheGeometry(
				perfil([
					[0, -0.45],
					[0.75, -0.45],
					[0.8, -0.3],
					[0.6, -0.05],
					[0.3, 0],
				]),
				64,
			),
		[],
	);
	const topo = useMemo(
		() =>
			new THREE.LatheGeometry(
				perfil([
					[0.32, 1.15],
					[0.7, 1.3],
					[0.72, 1.4],
					[0.4, 1.6],
					[0.12, 1.7],
					[0, 1.72],
				]),
				64,
			),
		[],
	);
	return (
		<group>
			<mesh geometry={base} material={metal} castShadow receiveShadow />
			<mesh geometry={globo} material={vidro} />
			<mesh geometry={topo} material={metal} castShadow />
			{Array.from({length: 6}, (_, i) => {
				const a = (i / 6) * Math.PI * 2;
				return (
					<mesh key={i} position={[Math.cos(a) * 0.66, 0.58, Math.sin(a) * 0.66]} material={metal} castShadow>
						<cylinderGeometry args={[0.025, 0.025, 1.3, 8]} />
					</mesh>
				);
			})}
			<mesh position={[0, 1.7, 0]} material={metal} castShadow>
				<torusGeometry args={[0.45, 0.03, 12, 48, Math.PI]} />
			</mesh>
			<pointLight position={[0, 0.55, 0]} color={cor} intensity={6} distance={6} />
		</group>
	);
};

// Tela de live (textura redesenhada a cada 1/10 s), usada pelo Celular de código e pelo modelo do pack (CelularPack).
export const useTelaLive = (segundos: number) => {
	// A tela é redesenhada a cada quadro inteiro de 1/10 s: os corações sobem.
	const passo = Math.floor(segundos * 10);
	const tela = useMemo(
		() =>
			textura(540, 1100, (c) => {
				const g = c.createLinearGradient(0, 0, 0, 1100);
				g.addColorStop(0, '#2b1c30');
				g.addColorStop(0.55, '#5b2a3a');
				g.addColorStop(1, '#1a1420');
				c.fillStyle = g;
				c.fillRect(0, 0, 540, 1100);
				// Pessoa da live (silhueta).
				c.fillStyle = 'rgba(255,214,190,0.85)';
				c.beginPath();
				c.ellipse(270, 400, 95, 115, 0, 0, Math.PI * 2);
				c.fill();
				c.fillStyle = '#c3263a';
				c.beginPath();
				c.ellipse(270, 700, 190, 170, 0, Math.PI, 0);
				c.fill();
				c.fillRect(80, 700, 380, 140);
				// Selo AO VIVO e contador.
				c.fillStyle = '#fe2c55';
				c.beginPath();
				c.roundRect(28, 60, 150, 52, 12);
				c.fill();
				c.fillStyle = '#fff';
				c.font = 'bold 30px sans-serif';
				c.fillText('AO VIVO', 44, 96);
				c.fillStyle = 'rgba(0,0,0,0.45)';
				c.beginPath();
				c.roundRect(190, 60, 180, 52, 12);
				c.fill();
				c.fillStyle = '#fff';
				c.fillText(`${(1.2 + (passo % 40) / 100).toFixed(2).replace('.', ',')} mil`, 204, 96);
				// Produto em destaque com preço e botão de compra.
				c.fillStyle = 'rgba(255,255,255,0.94)';
				c.beginPath();
				c.roundRect(28, 880, 484, 170, 22);
				c.fill();
				c.fillStyle = '#f2c14e';
				c.fillRect(48, 900, 130, 130);
				c.fillStyle = '#111';
				c.font = 'bold 34px sans-serif';
				c.fillText('Produto top', 196, 945);
				c.fillStyle = '#fe2c55';
				c.font = 'bold 40px sans-serif';
				c.fillText('R$ 49,90', 196, 1000);
				c.fillStyle = '#fe2c55';
				c.beginPath();
				c.roundRect(366, 960, 132, 56, 14);
				c.fill();
				c.fillStyle = '#fff';
				c.font = 'bold 28px sans-serif';
				c.fillText('Comprar', 378, 997);
				// Corações subindo pela direita.
				for (let i = 0; i < 7; i++) {
					const y = 840 - (((passo * 9 + i * 120) % 700) as number);
					const x = 450 + Math.sin(i * 2 + passo / 6) * 30;
					c.fillStyle = ['#fe2c55', '#ff8fab', '#ffd166'][i % 3];
					c.globalAlpha = Math.min(1, (y - 140) / 300);
					c.beginPath();
					c.moveTo(x, y + 14);
					c.bezierCurveTo(x - 30, y - 10, x - 14, y - 34, x, y - 16);
					c.bezierCurveTo(x + 14, y - 34, x + 30, y - 10, x, y + 14);
					c.fill();
					c.globalAlpha = 1;
				}
			}),
		[passo],
	);
	return useMemo(() => new THREE.MeshBasicMaterial({map: tela, toneMapped: false}), [tela]);
};

// Celular com a tela de uma live: selo AO VIVO, contador, produto em destaque e corações subindo.
export const Celular: React.FC<{segundos: number}> = ({segundos}) => {
	const corpo = useMemo(() => new RoundedBoxGeometry(1.5, 3.05, 0.16, 6, 0.2), []);
	const metal = useMemo(
		() => new THREE.MeshPhysicalMaterial({color: '#16171a', metalness: 0.6, roughness: 0.25, clearcoat: 1}),
		[],
	);
	const telaMat = useTelaLive(segundos);
	return (
		<group>
			<mesh geometry={corpo} material={metal} castShadow receiveShadow />
			<mesh position={[0, 0, 0.082]} material={telaMat}>
				<planeGeometry args={[1.38, 2.92]} />
			</mesh>
			<mesh position={[0, 1.36, 0.085]} rotation={[0, 0, Math.PI / 2]}>
				<capsuleGeometry args={[0.05, 0.22, 4, 12]} />
				<meshStandardMaterial color="#050505" />
			</mesh>
		</group>
	);
};

// Caixa de produto de papelão com fita e etiqueta (ref.: "escolher o produto certo").
export const Caixa: React.FC = () => {
	const geo = useMemo(() => new RoundedBoxGeometry(1.6, 1.15, 1.2, 4, 0.05), []);
	const etiqueta = useMemo(
		() =>
			textura(512, 512, (c) => {
				c.fillStyle = '#c99a62';
				c.fillRect(0, 0, 512, 512);
				for (let i = 0; i < 400; i++) {
					c.fillStyle = `rgba(90,60,30,${0.05 + 0.05 * random(`c${i}`)})`;
					c.fillRect(random(`x${i}`) * 512, random(`y${i}`) * 512, 2, 2);
				}
				c.fillStyle = '#d8b07a';
				c.fillRect(226, 0, 60, 512);
				c.fillStyle = '#ffffff';
				c.beginPath();
				c.roundRect(60, 300, 170, 140, 10);
				c.fill();
				c.strokeStyle = '#111';
				c.lineWidth = 6;
				for (let k = 0; k < 9; k++) {
					c.beginPath();
					c.moveTo(78 + k * 16, 320);
					c.lineTo(78 + k * 16, 380);
					c.stroke();
				}
				c.fillStyle = '#22c55e';
				c.beginPath();
				c.arc(380, 130, 62, 0, Math.PI * 2);
				c.fill();
				c.strokeStyle = '#fff';
				c.lineWidth = 16;
				c.lineCap = 'round';
				c.beginPath();
				c.moveTo(350, 132);
				c.lineTo(372, 154);
				c.lineTo(412, 108);
				c.stroke();
			}),
		[],
	);
	const papelao = useMemo(() => new THREE.MeshStandardMaterial({map: etiqueta, roughness: 0.85}), [etiqueta]);
	const fita = useMemo(() => new THREE.MeshStandardMaterial({color: '#d9b27c', roughness: 0.4, metalness: 0.05}), []);
	return (
		<group>
			<mesh geometry={geo} material={papelao} castShadow receiveShadow />
			<mesh position={[0, 0.585, 0]} material={fita} castShadow>
				<boxGeometry args={[0.34, 0.012, 1.22]} />
			</mesh>
		</group>
	);
};

export const Objeto3D: React.FC<{tipo: TipoObjeto3D; segundos: number; simbolo?: string; cor?: string}> = ({
	tipo,
	segundos,
	simbolo,
	cor,
}) => {
	switch (tipo) {
		case 'rei':
			return <Rei />;
		case 'moeda':
			return <Moeda simbolo={simbolo} />;
		case 'notas':
			return <Notas />;
		case 'relogio':
			return <Relogio segundos={segundos} />;
		case 'lampiao':
			return <Lampiao cor={cor} />;
		case 'celular':
			return <Celular segundos={segundos / 40} />;
		case 'caixa':
			return <Caixa />;
	}
};
