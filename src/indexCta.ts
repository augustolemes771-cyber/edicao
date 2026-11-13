// Entrada isolada para o CTA de fim dos vídeos de UGC (não mexe no Root dos projetos).
// Render: npx remotion render src/indexCta.ts cta-loja out/cta-loja.mp4
import {registerRoot} from 'remotion';
import {RootCta} from './RootCta';

registerRoot(RootCta);
