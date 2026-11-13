import React from 'react';
import {Composition} from 'remotion';
import {CTA_DURACAO, CtaLojaComentarios} from './pecas/CtaLojaComentarios';

export const RootCta: React.FC = () => (
	<Composition id="cta-loja" component={CtaLojaComentarios} width={1080} height={1920} fps={30} durationInFrames={CTA_DURACAO} />
);
