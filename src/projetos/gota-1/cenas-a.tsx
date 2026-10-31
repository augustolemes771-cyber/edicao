// Cenas do bloco A do gota-1: gota no vaso, descarga, cano descendo pela casa em corte, tubo do esgoto.
import React from 'react';
import {AbsoluteFill, interpolate, spring} from 'remotion';
import type {Busca} from '../../motor/palavras';
import type {Cena} from '../../motor/plano';
import type {CenaPeca, Pecas} from '../../pecas/peca';
import {Gota, useMats, Palco, trilha, Rotulo, useQ, lim, type Mats} from './gota';

type V3 = [number, number, number];
type Mat = Mats[keyof Mats];
const Cx: React.FC<{p: V3; s: V3; m: Mat}> = ({p, s, m}) => (
	<mesh position={p} scale={s} material={m}>
		<boxGeometry args={[1, 1, 1]} />
	</mesh>
);

// Mundo único: banheiro no andar de cima (y 0..5), sala embaixo (y -6..0), rua em y -6.5, esgoto em y -13.
const Mundo: React.FC<{m: Mats; t: number; agua: number}> = ({m, t, agua}) => {
	const carroX = ((t * 5 + 14) % 40) - 20;
	return (
		<group>
			<Cx p={[0, 0, -1.6]} s={[16, 12.5, 0.3]} m={m.areia} />
			<Cx p={[0, -6, 0]} s={[16, 0.5, 3.4]} m={m.concreto} />
			<Cx p={[0, 0, 0]} s={[16, 0.4, 3.4]} m={m.concreto} />
			<Cx p={[0, 6.3, 0]} s={[17, 0.6, 3.6]} m={m.tijolo} />
			<Cx p={[-8.2, 0.2, 0]} s={[0.4, 13, 3.4]} m={m.tijolo} />
			<Cx p={[8.2, 0.2, 0]} s={[0.4, 13, 3.4]} m={m.tijolo} />
			{/* banheiro */}
			<Cx p={[-2, 0.8, 0]} s={[1.6, 1.2, 1.6]} m={m.branco} />
			<Cx p={[-2, 2.1, -0.9]} s={[1.6, 1.6, 0.6]} m={m.branco} />
			<Cx p={[-2, 3, -0.9]} s={[1.8, 0.2, 0.7]} m={m.cano} />
			<mesh position={[-2, 1.45, 0.05]} material={m.agua}>
				<cylinderGeometry args={[0.65, 0.55, 0.1, 10]} />
			</mesh>
			<Cx p={[-6, 0.9, -0.2]} s={[1.6, 1.4, 1.2]} m={m.branco} />
			<Cx p={[-6, 2.4, -1.3]} s={[1.5, 1.6, 0.1]} m={m.aguaLimpa} />
			<Cx p={[3.2, 0.7, 0.2]} s={[3.6, 1, 1.6]} m={m.branco} />
			<Cx p={[3.2, 1.05, 0.2]} s={[3.2, 0.3, 1.3]} m={m.aguaLimpa} />
			<Cx p={[6.5, 3.2, -1.4]} s={[1.4, 1.4, 0.1]} m={m.amarelo} />
			<Cx p={[0.5, 2.6, -1.4]} s={[1, 1.2, 0.1]} m={m.azulEscuro} />
			{/* sala */}
			<Cx p={[-3, -4.9, -0.4]} s={[4, 1.2, 1.6]} m={m.vermelho} />
			<Cx p={[-3, -4.2, -1.2]} s={[4, 1.6, 0.4]} m={m.vermelho} />
			<Cx p={[4, -4.9, -1.2]} s={[3, 0.9, 0.8]} m={m.preto} />
			<Cx p={[4, -3.6, -1.2]} s={[2.2, 1.4, 0.2]} m={m.azulEscuro} />
			<Cx p={[0.5, -5.2, 0.6]} s={[1.6, 0.5, 1]} m={m.amarelo} />
			<Cx p={[-6.2, -3.8, -1]} s={[0.15, 2.4, 0.15]} m={m.ferro} />
			<mesh position={[-6.2, -2.4, -1]} material={m.amarelo}>
				<coneGeometry args={[0.6, 0.8, 8]} />
			</mesh>
			{/* cano */}
			<Cx p={[-2, 0.1, -0.1]} s={[0.5, 0.4, 0.5]} m={m.cano} />
			<Cx p={[1.2, -0.3, -0.1]} s={[6.4, 0.5, 0.5]} m={m.cano} />
			<Cx p={[4, -7.4, -0.1]} s={[0.55, 14.6, 0.55]} m={m.cano} />
			{[-1.5, -4, -6.5, -9, -11.5].map((y) => (
				<Cx key={y} p={[4, y, -0.1]} s={[0.8, 0.25, 0.8]} m={m.canoEscuro} />
			))}
			{/* rua, calçada, postes, carro */}
			<Cx p={[0, -6.9, 3.5]} s={[60, 0.5, 9]} m={m.ferro} />
			<Cx p={[0, -6.62, 3.5]} s={[60, 0.05, 0.25]} m={m.amarelo} />
			<Cx p={[0, -6.55, -3.2]} s={[60, 0.6, 3.4]} m={m.concreto} />
			{[-12, -4, 6, 14].map((x) => (
				<group key={x} position={[x, -6.3, -3.4]}>
					<Cx p={[0, 2, 0]} s={[0.2, 4.4, 0.2]} m={m.ferro} />
					<Cx p={[0.5, 4.2, 0]} s={[1.2, 0.2, 0.3]} m={m.ferro} />
					<Cx p={[1, 4, 0]} s={[0.4, 0.3, 0.4]} m={m.amarelo} />
				</group>
			))}
			<group position={[carroX, -6.1, 4]}>
				<Cx p={[0, 0.5, 0]} s={[3.2, 0.9, 1.5]} m={m.vermelho} />
				<Cx p={[0, 1.2, 0]} s={[1.8, 0.7, 1.4]} m={m.aguaLimpa} />
				{[-1, 1].map((x) => (
					<mesh key={x} position={[x, 0, 0.8]} rotation={[Math.PI / 2, 0, 0]} material={m.preto}>
						<cylinderGeometry args={[0.4, 0.4, 0.2, 8]} />
					</mesh>
				))}
			</group>
			{/* terra em camadas + pedras */}
			<Cx p={[0, -8.2, -0.5]} s={[60, 2, 8]} m={m.terra} />
			<Cx p={[0, -9.7, -0.5]} s={[60, 1.4, 8]} m={m.terraEscura} />
			<Cx p={[0, -17.8, -0.5]} s={[60, 5.4, 8]} m={m.terra} />
			{[
				[-9, -8.4],
				[10, -9.5],
				[-3, -15.5],
				[12, -16],
				[-13, -17],
			].map(([x, y], i) => (
				<mesh key={i} position={[x, y, 3.4]} material={m.cano} scale={[1, 0.7, 1]}>
					<icosahedronGeometry args={[0.8 + (i % 2) * 0.3, 0]} />
				</mesh>
			))}
			{/* tubo do esgoto */}
			<mesh position={[0, -13, -0.5]} rotation={[0, 0, Math.PI / 2]} material={m.canoEscuro}>
				<cylinderGeometry args={[4, 4, 60, 12, 1, true, Math.PI / 2, Math.PI]} />
			</mesh>
			<Cx p={[0, -14.2 + agua, 0]} s={[60, 1.2, 5.6]} m={m.aguaSuja} />
			{[-18, -10, 10, 18].map((x) => (
				<Cx key={x} p={[x, -13, -0.3]} s={[0.4, 8, 7]} m={m.cano} />
			))}
		</group>
	);
};

const Boias: React.FC<{m: Mats; t: number}> = ({m, t}) => (
	<group>
		{[0, 1, 2, 3, 4, 5].map((i) => {
			const x = ((((i * 7.3 - t * 2.2) % 22) + 22) % 22) - 11;
			return (
				<group key={i} position={[x, -13.5 + Math.sin(t * 2 + i) * 0.12, 0.4 + (i % 3) * 0.7]} rotation={[0, t * 0.5 + i, Math.sin(t * 2 + i) * 0.2]}>
					{i % 3 === 0 ? (
						<Cx p={[0, 0, 0]} s={[0.9, 0.12, 0.7]} m={m.branco} />
					) : i % 3 === 1 ? (
						<Cx p={[0, 0.2, 0]} s={[0.5, 0.5, 0.5]} m={m.terraEscura} />
					) : (
						<mesh material={m.bacteria}>
							<icosahedronGeometry args={[0.35, 0]} />
						</mesh>
					)}
				</group>
			);
		})}
	</group>
);

const Cena3D: React.FC<{cena: CenaPeca; fase: 1 | 2 | 3 | 4}> = ({cena, fase}) => {
	const {frame, fps, q} = useQ(cena.de);
	const d = (cena.dados ?? {}) as Record<string, number>;
	const m = useMats();
	const fim = Math.round((cena.ate - cena.de) * fps);
	const t = cena.de + frame / fps;
	const k = (n: string) => q(d[n]);
	const pop = (n: string) => spring({frame: frame - k(n), fps, config: {damping: 11, stiffness: 170}});
	let cam: V3, alvo: V3, gp: V3;
	let rot: V3 = [0, 0, 0];
	let humor: 'feliz' | 'assustada' | 'enjoada' = 'feliz';
	let suja = 0;
	let esc = 0.6;
	let agua = 0;
	if (fase === 1) {
		cam = trilha(frame, [[0, [-2, 3.5, 17]], [fim, [-2, 2.5, 8.5]]]);
		alvo = [-2, 1.6, 0];
		gp = [-2, 2.1 + Math.sin(frame / 7) * 0.12, 0.1];
		rot = [0, Math.sin(frame / 12) * 0.3, Math.sin(frame / 9) * 0.1];
		esc = 0.45 + 0.1 * pop('gota');
	} else if (fase === 2) {
		const f = k('descarga');
		cam = trilha(frame, [[0, [-2, 3, 9]], [f, [-1.5, 2.4, 6.5]], [Math.max(f + 1, fim), [1.5, 1, 10]]]);
		alvo = trilha(frame, [[0, [-2, 1.6, 0]], [fim, [1, 0, 0]]]);
		const gira = Math.max(0, frame - f);
		const r = interpolate(gira, [0, 20], [0.5, 0.08], lim);
		const a = gira * 0.5;
		const y = interpolate(gira, [0, 22, 30], [2.1, 1.4, 0.1], lim);
		const p1 = trilha(frame, [[f + 28, [-2, 0.1, 0.1]], [f + 38, [-1.3, -0.3, 0.1]], [Math.max(f + 39, fim), [3.6, -0.3, 0.1]]]);
		gp = frame < f ? [-2, 2.1 + Math.sin(frame / 7) * 0.1, 0.1] : frame < f + 28 ? [-2 + Math.cos(a) * r, y, 0.1 + Math.sin(a) * r] : p1;
		rot = [0, 0, frame < f ? 0 : frame * 0.6];
		humor = frame < f ? 'feliz' : 'assustada';
		esc = frame < f + 28 ? 0.5 : 0.35;
	} else if (fase === 3) {
		const s = fim - 8;
		cam = trilha(frame, [[0, [4, 0, 11]], [s * 0.4, [2, -5, 14]], [s, [4, -11, 12]]]);
		alvo = trilha(frame, [[0, [3.5, -0.8, 0]], [s * 0.4, [3.5, -4.5, 0]], [s, [3.5, -12, 0]]]);
		gp = trilha(frame, [[0, [3.6, -0.3, 0.1]], [10, [4, -1.5, 1.2]], [s, [4, -12.2, 1.2]]]);
		rot = [0, 0, frame * 0.15];
		humor = 'assustada';
		suja = interpolate(frame, [0, s], [0.3, 0.7], lim);
		esc = 0.4;
	} else {
		cam = trilha(frame, [[0, [4, -9, 15]], [fim, [-1, -12, 13]]]);
		alvo = trilha(frame, [[0, [4, -12, 0]], [fim, [-2, -13.2, 0]]]);
		const gy = frame < 14 ? interpolate(frame, [0, 14], [-9, -12.8], lim) : -12.8 + Math.sin(frame / 8) * 0.15;
		gp = [interpolate(frame, [0, fim], [4, -2], lim) + Math.sin(frame / 20) * 0.2, gy, 0.8];
		rot = [0, 0, Math.sin(frame / 10) * 0.2];
		humor = 'enjoada';
		suja = 0.9;
		esc = 0.45;
		agua = Math.sin(frame / 12) * 0.05;
	}
	return (
		<AbsoluteFill>
			<Palco camera={cam} alvo={alvo} fov={42} ceu={fase >= 3 ? ['#2a3140', '#3a4558'] : ['#8fd0ff', '#d9f1ff']}>
				<Mundo m={m} t={t} agua={agua} />
				{fase === 4 ? <Boias m={m} t={t} /> : null}
				<Gota mats={m} humor={humor} suja={suja} quadro={frame} escala={esc} position={gp} rotation={rot} />
			</Palco>
			{fase === 1 ? <Rotulo texto="VOCÊ" y={360} p={pop('gota')} /> : null}
			{fase === 2 ? <Rotulo texto="DESCARGA!" y={360} p={pop('descarga')} /> : null}
			{fase === 3 ? <Rotulo texto="CANO DA CASA" y={360} p={pop('desce')} /> : null}
			{fase === 4 ? <Rotulo texto="ESGOTO" y={360} p={pop('esgoto')} /> : null}
		</AbsoluteFill>
	);
};

const gA1: React.FC<{cena: CenaPeca}> = ({cena}) => <Cena3D cena={cena} fase={1} />;
const gA2: React.FC<{cena: CenaPeca}> = ({cena}) => <Cena3D cena={cena} fase={2} />;
const gA3: React.FC<{cena: CenaPeca}> = ({cena}) => <Cena3D cena={cena} fase={3} />;
const gA4: React.FC<{cena: CenaPeca}> = ({cena}) => <Cena3D cena={cena} fase={4} />;

export const pecasA: Pecas = {gA1, gA2, gA3, gA4};

export const cenasA = (b: Busca): Cena[] => {
	const fim = b.say('Depois de quilômetros').inicio;
	const c2 = b.say('E alguém').inicio - 0.1;
	const c3 = b.say('Você desce').inicio - 0.1;
	const c4 = b.say('num tubo').inicio - 0.2;
	const peca = (nome: string, de: number, ate: number, dados: Record<string, unknown>, sons: Cena['sons'] = []): Cena => ({tipo: 'peca', nome, modo: 'cheia', de, ate, dados, sons});
	const gota = b.say('uma gota').inicio;
	const desc = b.at('descarga');
	const desce = b.say('Você desce').inicio;
	const esg = b.say('Esse é o esgoto').inicio;
	return [
		peca('gA1', 0, c2, {gota, marcos: [gota]}, [{em: gota, som: 'pro_pop', ganho: 0.6}]),
		peca('gA2', c2, c3, {descarga: desc, marcos: [desc]}, [{em: desc, som: 'pro_whoosh', ganho: 0.7}]),
		peca('gA3', c3, c4, {desce: desce + 0.3, marcos: [desce + 0.3]}, [{em: desce, som: 'pro_swipe', ganho: 0.6}]),
		peca('gA4', c4, fim, {esgoto: esg, marcos: [esg]}, [
			{em: c4, som: 'pro_whoosh_curto', ganho: 0.5},
			{em: esg, som: 'pro_pop', ganho: 0.7},
		]),
	];
};
