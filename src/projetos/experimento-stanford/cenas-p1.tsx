// Bloco 1 (abertura) do experimento-stanford, em cenas curtas — cada frase vira uma imagem distinta.
import React from 'react';
import type {CenaPeca, Pecas} from '../../pecas/peca';
import {Camera, COR, Fundo, GradePrimeiroPlano, Lua, Mapa, Numero, OmbroPrimeiroPlano, Personagem, Pilula, Porao, Predio, Vinheta, usePeca} from './ilustracao';

// 1a. "Cientistas pegaram vinte e quatro estudantes comuns": crowd pequena, contador 24 subindo.
export const stanfordP1a: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	const crowd = mola(0, 100, 15);
	const n = mola(10, 120, 13);
	const posicoes = [-260, -150, -40, 70, 180, 290];
	return (
		<Fundo noite>
			<Camera cena={cena} zoom={[1.15, 1.35]} x={[-40, 60]}>
				<Lua x={800} y={70} r={40} p={1} />
				{posicoes.map((x, i) => (
					<Personagem key={i} x={540 + x * Math.min(1, crowd)} y={1120} tom={i % 2 ? 'guarda' : 'prisioneiro'} escala={1.9} p={Math.min(1, crowd)} />
				))}
			</Camera>
			<OmbroPrimeiroPlano lado="esquerda" />
			<Vinheta forca={0.6} />
			<Numero valor="24" rotulo="ESTUDANTES COMUNS" p={n} top={160} />
		</Fundo>
	);
};

// 1b. "escolhidos por serem os mais estáveis psicologicamente do grupo": prancheta com check.
export const stanfordP1b: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	const p = mola(0, 110, 15);
	const check = mola(10, 140, 11);
	return (
		<Fundo noite>
			<Camera cena={cena} zoom={[1, 1.3]} y={[0, -40]}>
				<svg style={{position: 'absolute', left: '50%', top: 620, transform: `translate(-50%, ${(1 - p) * 40}px)`, opacity: p}} width={460} height={600} viewBox="0 0 200 260">
					<rect x={10} y={10} width={180} height={240} rx={10} fill={COR.branco} />
					<rect x={70} y={0} width={60} height={24} rx={6} fill={COR.predioEscuro} />
					{[60, 100, 140, 180].map((y) => (
						<line key={y} x1={30} y1={y} x2={170} y2={y} stroke="#c9c2ae" strokeWidth={4} />
					))}
					<g transform={`translate(145,52) scale(${Math.min(1, check)})`}>
						<circle r={22} fill="#3fae5c" />
						<path d="M-9 0 L-2 8 L11 -9" stroke={COR.branco} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
					</g>
				</svg>
			</Camera>
			<Vinheta forca={0.5} />
			<Pilula texto="PSICOLOGICAMENTE ESTÁVEIS" p={check} y={900} cor={COR.predioEscuro} />
		</Fundo>
	);
};

// 1c. "Metade virou guarda.": figura se veste de guarda.
export const stanfordP1c: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	const p = mola(0, 110, 14);
	return (
		<Fundo noite>
			<Camera cena={cena} zoom={[1.15, 1.4]} y={[0, -50]}>
				<Personagem x={540} y={1280} tom="guarda" escala={3.6} p={Math.min(1, p)} />
			</Camera>
			<Vinheta forca={0.55} />
			<Pilula texto="GUARDA" p={mola(10, 130, 12)} y={200} cor={COR.guarda} />
		</Fundo>
	);
};

// 1d. "Metade virou prisioneiro.": figura se veste de prisioneiro.
export const stanfordP1d: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	const p = mola(0, 110, 14);
	return (
		<Fundo noite>
			<Camera cena={cena} zoom={[1.15, 1.4]} x={[0, 40]} y={[0, -50]}>
				<Personagem x={540} y={1280} tom="prisioneiro" escala={3.6} p={Math.min(1, p)} />
			</Camera>
			<GradePrimeiroPlano lado="direita" />
			<Vinheta forca={0.55} />
			<Pilula texto="PRISIONEIRO" p={mola(10, 130, 12)} y={200} cor="#9c8a5e" />
		</Fundo>
	);
};

// 1e. "O lugar: o porão de um prédio da Universidade Stanford,": mapa → prédio.
export const stanfordP1e: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	const mapa = mola(0, 90, 16);
	const sai = mola(26, 80, 18);
	const predio = mola(22, 100, 15);
	return (
		<Fundo noite>
			{sai < 0.98 && <Mapa p={Math.max(0, mapa - sai)} rotulo="UNIVERSIDADE STANFORD" />}
			<Camera cena={cena} zoom={[1, 1.4]} y={[0, -80]}>
				<Predio p={Math.min(1, predio)} y={620} />
			</Camera>
			<Vinheta forca={0.45} />
		</Fundo>
	);
};

// 1f. "transformado numa prisão falsa.": desce pro porão, grades reveladas.
export const stanfordP1f: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	const desce = mola(0, 70, 18);
	return (
		<Fundo noite>
			<Camera cena={cena} zoom={[1.3, 1.55]} y={[-60, -180]}>
				<Porao p={Math.min(1, desce)} />
			</Camera>
			<GradePrimeiroPlano lado="baixo" />
			<Vinheta />
			<Pilula texto="PRISÃO FALSA" p={mola(14, 120, 12)} y={220} />
		</Fundo>
	);
};

export const pecasP1: Partial<Pecas> = {stanfordP1a, stanfordP1b, stanfordP1c, stanfordP1d, stanfordP1e, stanfordP1f};
