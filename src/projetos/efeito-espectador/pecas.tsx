// Peças do efeito-espectador (vídeo todo em motion, ilustração 2D plana do experimento-stanford).
// O prédio de janelas e a sala do experimento vivem em cenario.tsx; cada parte do roteiro tem seu arquivo.
import type {Pecas} from '../../pecas/peca';
import {pecasP1} from './cenas-p1';
import {pecasP2} from './cenas-p2';
import {pecasP3} from './cenas-p3';

export const pecas: Pecas = {...pecasP1, ...pecasP2, ...pecasP3} as Pecas;
