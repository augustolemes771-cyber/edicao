// Bloco 6 (fechamento) do experimento-stanford, em cenas curtas.
import React from 'react';
import type {CenaPeca, Pecas} from '../../pecas/peca';
import {Camera, Cartela, Foco, Fundo, Lua, Personagem, PoraoCompleto, TextoGrande, Vinheta, usePeca} from './ilustracao';

// 6a. "A pergunta que ficou não é mais:": ponto de interrogação gigante se formando.
export const stanfordP6a: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	const p = mola(0, 90, 15);
	return (
		<Fundo noite>
			<Lua x={800} y={90} r={44} p={1} />
			<TextoGrande texto="?" p={Math.min(1, p)} />
		</Fundo>
	);
};

// 6b. "será que você viraria um monstro?": silhueta no escuro, foco revelando.
export const stanfordP6b: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	const foco = mola(0, 80, 17);
	const texto = mola(8, 100, 14);
	return (
		<Fundo noite>
			<Camera cena={cena} zoom={[1.4, 1.75]} y={[0, -60]}>
				<PoraoCompleto escuro={0.6} />
				<Personagem x={540} y={1180} tom="prisioneiro" escala={3.4} />
			</Camera>
			<Foco x={540} y={900} r={Math.max(60, 420 - foco * 320)} p={1} />
			<Vinheta forca={0.7} />
			{texto > 0.05 && <TextoGrande texto="MONSTRO?" p={Math.min(1, texto)} />}
		</Fundo>
	);
};

// 6c. "será que a história toda que te contaram sobre isso é verdade?": vira "VERDADE?" e cartela final.
export const stanfordP6c: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	const texto = mola(0, 100, 14);
	const cartela = mola(26, 70, 16);
	return (
		<Fundo noite>
			{texto > 0.02 && texto < 0.95 && <TextoGrande texto="VERDADE?" p={Math.min(1, texto)} />}
			{cartela > 0.01 && (
				<div style={{position: 'absolute', inset: 0, opacity: Math.min(1, cartela)}}>
					<Cartela p={1} titulo="O EXPERIMENTO" subtitulo="QUE A CIÊNCIA PROIBIU DE REPETIR" destaque="PRISÃO DE STANFORD" rodape="CALIFÓRNIA · 1971" />
				</div>
			)}
		</Fundo>
	);
};

export const pecasP6: Partial<Pecas> = {stanfordP6a, stanfordP6b, stanfordP6c};
