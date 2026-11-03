// Peças do experimento-stanford (vídeo todo em motion, ilustração 2D plana estilo "Ponto Cego").
// Dividido em blocos curtos: cada bloco cobre um trecho do roteiro, com uma peça por frase/detalhe.
import type {Pecas} from '../../pecas/peca';
import {pecas as base} from './cenas';
import {pecasP1} from './cenas-p1';
import {pecasP2} from './cenas-p2';
import {pecasP3} from './cenas-p3';
import {pecasP5} from './cenas-p5';
import {pecasP6} from './cenas-p6';

export const pecas: Pecas = {...base, ...pecasP1, ...pecasP2, ...pecasP3, ...pecasP5, ...pecasP6} as Pecas;
