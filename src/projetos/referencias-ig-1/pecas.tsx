// Peças do referencias-ig-1 (vídeo todo em motion: "como um avião de 400 toneladas fica no ar").
// Cada bloco de cenas fica no seu arquivo (cenas-a/b/c.tsx); o avião e o cenário comuns ficam em aviao.tsx.
import type {Pecas} from '../../pecas/peca';
import {pecasA} from './cenas-a';
import {pecasB} from './cenas-b';
import {pecasC} from './cenas-c';

export const pecas: Pecas = {...pecasA, ...pecasB, ...pecasC};
