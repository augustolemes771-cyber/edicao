import React from 'react';
import {CalculateMetadataFunction, Composition, staticFile} from 'remotion';
import {ALL_FORMATS, Input, UrlSource} from 'mediabunny';
import {montar} from './motor/plano';
import {ALTURA, FPS, LARGURA} from './motor/tema';
import {projetos} from './projetos';
import {VideoEditado, type PropsVideo} from './VideoEditado';

const duracaoDoVideo = async (src: string) => {
	const input = new Input({formats: ALL_FORMATS, source: new UrlSource(src)});
	return input.computeDuration();
};

// Duração final = vídeo decupado menos os cortes das notas faladas.
const calcular: CalculateMetadataFunction<PropsVideo> = async ({props}) => {
	const edit = projetos[props.projeto];
	if (!edit) throw new Error(`Projeto "${props.projeto}" não está em src/projetos/index.ts`);
	const duracaoFonte = edit.video
		? await duracaoDoVideo(staticFile(`${edit.pasta}/${edit.video}`))
		: (edit.duracao ?? 10);
	const {duracaoEditada} = montar(edit, duracaoFonte);
	const vertical = edit.formato === 'vertical';
	return {
		durationInFrames: Math.max(1, Math.round(duracaoEditada * FPS)),
		width: vertical ? ALTURA : LARGURA,
		height: vertical ? LARGURA : ALTURA,
		props: {...props, duracaoFonte},
	};
};

export const Root: React.FC = () => (
	<>
		{Object.keys(projetos).map((nome) => (
			<Composition
				key={nome}
				id={nome}
				component={VideoEditado}
				width={LARGURA}
				height={ALTURA}
				fps={FPS}
				durationInFrames={FPS}
				defaultProps={{projeto: nome, duracaoFonte: 0}}
				calculateMetadata={calcular}
			/>
		))}
	</>
);
