// Cena isolada do experimento-stanford que não faz parte de nenhum bloco (cenas-p1..p6): o prazo
// original do experimento. O resto das cenas vive nos blocos cenas-p1.tsx a cenas-p6.tsx.
import React from 'react';
import type {CenaPeca, Pecas} from '../../pecas/peca';
import {Fundo, Numero, Relogio, usePeca} from './ilustracao';

// "O experimento devia durar duas semanas.": relógio.
export const stanfordPrazo: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {t, mola} = usePeca(cena);
	const r = mola(2, 90, 16);
	const n = mola(10, 110, 14);
	return (
		<Fundo noite>
			<Relogio p={r} y={520} girar={Math.min(40, t * 6)} />
			<Numero valor="2" rotulo="SEMANAS PREVISTAS" p={n} top={200} />
		</Fundo>
	);
};

export const pecas: Pecas = {stanfordPrazo};
