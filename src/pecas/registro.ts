// Registro das peças próprias dos projetos (cena tipo 'peca'). Projeto novo com pecas.tsx: importe e espalhe aqui.
import type {Pecas} from './peca';
import {pecas as e3v3} from '../projetos/entrevista-3-v3/pecas';
import {pecas as e3v5} from '../projetos/entrevista-3-v5/pecas';
import {pecas as e3v7} from '../projetos/entrevista-3-v7/pecas';
import {pecas as e3v11} from '../projetos/entrevista-3-v11/pecas';
import {pecas as e3v12} from '../projetos/entrevista-3-v12/pecas';
import {pecas as e3v14} from '../projetos/entrevista-3-v14/pecas';

export const PECAS: Pecas = {...e3v3, ...e3v5, ...e3v7, ...e3v11, ...e3v12, ...e3v14};
