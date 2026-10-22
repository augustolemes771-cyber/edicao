import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {cor} from '../motor/tema';

// Grade fina curva com pontos nas interseções (assinatura do canal).
// Sem mancha de luz, vinheta ou degradê: o glow fica só nos elementos.
const COLS_H = 26;
const ROWS_H = 15;
const AMOSTRAS = 48;
const CURVATURA = 0.16;

const curvar = (u: number, v: number, w: number, h: number): [number, number] => {
	// u, v em -1..1. Distorção radial leve: a grade parece uma superfície curva.
	const r2 = u * u * 0.6 + v * v;
	const k = 1 + CURVATURA * r2;
	return [w / 2 + (u * k * w) / 2, h / 2 + (v * k * h) / 2];
};

export const Grade: React.FC<{sobreVerde?: boolean}> = ({sobreVerde}) => {
	const frame = useCurrentFrame();
	const {width: LARGURA, height: ALTURA} = useVideoConfig();
	// Na vertical a grade troca colunas por linhas para manter as células quadradas.
	const [COLUNAS, LINHAS] = LARGURA >= ALTURA ? [COLS_H, ROWS_H] : [ROWS_H, COLS_H];
	const {linhas, pontos} = useMemo(() => {
		const caminhos: string[] = [];
		const pts: {x: number; y: number; acesa: boolean}[] = [];
		const passoU = 2.3 / COLUNAS;
		const passoV = 2.3 / LINHAS;
		for (let i = 0; i <= COLUNAS; i++) {
			const u = -1.15 + i * passoU;
			let d = '';
			for (let s = 0; s <= AMOSTRAS; s++) {
				const [x, y] = curvar(u, -1.15 + (s / AMOSTRAS) * 2.3, LARGURA, ALTURA);
				d += `${s === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
			}
			caminhos.push(d);
		}
		for (let j = 0; j <= LINHAS; j++) {
			const v = -1.15 + j * passoV;
			let d = '';
			for (let s = 0; s <= AMOSTRAS; s++) {
				const [x, y] = curvar(-1.15 + (s / AMOSTRAS) * 2.3, v, LARGURA, ALTURA);
				d += `${s === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
			}
			caminhos.push(d);
		}
		for (let i = 0; i <= COLUNAS; i++) {
			for (let j = 0; j <= LINHAS; j++) {
				const [x, y] = curvar(-1.15 + i * passoU, -1.15 + j * passoV, LARGURA, ALTURA);
				// Alguns pontos acesos, em posição fixa (determinística).
				const acesa = (i * 7 + j * 13) % 23 === 0;
				pts.push({x, y, acesa});
			}
		}
		return {linhas: caminhos, pontos: pts};
	}, [LARGURA, ALTURA, COLUNAS, LINHAS]);

	// Respiração lenta da grade, sem piscar.
	const escala = interpolate(frame, [0, 300], [1, 1.035], {extrapolateRight: 'clamp'});
	const linhaCor = sobreVerde ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.07)';
	const pontoCor = sobreVerde ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.28)';

	return (
		<AbsoluteFill style={{transform: `scale(${escala})`}}>
			<svg width={LARGURA} height={ALTURA} viewBox={`0 0 ${LARGURA} ${ALTURA}`}>
				{linhas.map((d, i) => (
					<path key={i} d={d} fill="none" stroke={linhaCor} strokeWidth={1} />
				))}
				{pontos.map((p, i) => (
					<circle
						key={i}
						cx={p.x}
						cy={p.y}
						r={p.acesa ? 2.6 : 1.7}
						fill={p.acesa && !sobreVerde ? cor.destaque : pontoCor}
						style={p.acesa && !sobreVerde ? {filter: `drop-shadow(0 0 4px ${cor.halo})`} : undefined}
					/>
				))}
			</svg>
		</AbsoluteFill>
	);
};
