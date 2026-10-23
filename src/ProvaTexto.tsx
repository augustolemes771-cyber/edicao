import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {NeonProfundo, type PaletaNeon} from './pecas/NeonProfundo';

// Prova estática de texto para aprovação antes de animar: em cima, sobre fundo escuro; embaixo, sobre um
// quadro do vídeo (na frente dela, sem recorte).
export type PropsProva = {paleta: PaletaNeon; quadro?: string};

export const ProvaTexto: React.FC<PropsProva> = ({paleta, quadro}) => (
	<AbsoluteFill style={{backgroundColor: '#0d0d0f'}}>
		<AbsoluteFill style={{height: '50%', justifyContent: 'center', alignItems: 'center'}}>
			<NeonProfundo paleta={paleta} tamanho={250} linhas={[{texto: 'mentoria do'}, {texto: 'Danilow', grande: true}]} />
		</AbsoluteFill>
		<AbsoluteFill style={{top: '50%', height: '50%', overflow: 'hidden'}}>
			{quadro && <Img src={staticFile(quadro)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />}
			<AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: 70}}>
				<NeonProfundo paleta={paleta} tamanho={230} linhas={[{texto: 'o próximo'}, {texto: 'nível', grande: true}]} />
			</AbsoluteFill>
		</AbsoluteFill>
	</AbsoluteFill>
);
