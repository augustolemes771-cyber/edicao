// Peças do gota-1 ("Você é uma gota de água"). Cada bloco de cenas no seu arquivo (cenas-a/b/c/d.tsx); base em gota.tsx.
import type {Pecas} from '../../pecas/peca';
import {pecasA} from './cenas-a';
import {pecasB} from './cenas-b';
import {pecasC} from './cenas-c';
import {pecasD} from './cenas-d';

export const pecas: Pecas = {...pecasA, ...pecasB, ...pecasC, ...pecasD};
