// Peças do referencias-ig-1 (vídeo todo em motion: "como um avião de 400 toneladas fica no ar").
import React from 'react';
import type {CenaPeca, Pecas} from '../../pecas/peca';
import {Aviao, Chao, Nuvem, Palco, useMateriais, useQ} from './aviao';

// Cena de teste do modelo (vista 3/4).
const igTeste: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const m = useMateriais();
	const {frame} = useQ(cena.de);
	return (
		<Palco camera={[9, 4, 12]} alvo={[0, 0, 0]}>
			<Chao m={m} />
			<Nuvem m={m} position={[-10, 8, -20]} escala={2} />
			<group position={[0, 0.4, 0]}>
				<Aviao m={m} pose={{flaps: 0.6, aileron: 0.6, spoiler: 0.5, profundor: 0.5, trem: 1, giroTurbina: frame * 0.3}} />
			</group>
		</Palco>
	);
};

export const pecas: Pecas = {igTeste};
