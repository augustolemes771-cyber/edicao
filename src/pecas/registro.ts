// Registro das peças próprias dos projetos (cena tipo 'peca'). Projeto novo com pecas.tsx: importe e espalhe aqui.
import type {Pecas} from './peca';
import {pecas as e3v3} from '../projetos/entrevista-3-v3/pecas';
import {pecas as e3v5} from '../projetos/entrevista-3-v5/pecas';
import {pecas as e3v7} from '../projetos/entrevista-3-v7/pecas';
import {pecas as e3v11} from '../projetos/entrevista-3-v11/pecas';
import {pecas as e3v12} from '../projetos/entrevista-3-v12/pecas';
import {pecas as e3v14} from '../projetos/entrevista-3-v14/pecas';
import {pecas as gota1} from '../projetos/gota-1/pecas';
import {pecas as hist2} from '../projetos/historia-2/pecas';
import {pecas as rig1} from '../projetos/referencias-ig-1/pecas';
import {pecas as d31} from '../projetos/depoimento-3-1/pecas';
import {pecas as d32} from '../projetos/depoimento-3-2/pecas';

import {pecas as d33} from '../projetos/depoimento-3-3/pecas';
import {pecas as d34} from '../projetos/depoimento-3-4/pecas';
import {pecas as d41} from '../projetos/depoimento-4-1/pecas';
import {pecas as d42} from '../projetos/depoimento-4-2/pecas';
import {pecas as d43} from '../projetos/depoimento-4-3/pecas';
import {pecas as expStanford} from '../projetos/experimento-stanford/pecas';
import {pecas as efEspectador} from '../projetos/efeito-espectador/pecas';
import {pecas as teste} from '../projetos/teste/pecas';
import {pecas as ad03} from '../projetos/ad-03/pecas';
export const PECAS: Pecas = {...teste, ...ad03, ...e3v3, ...e3v5, ...e3v7, ...e3v11, ...e3v12, ...e3v14, ...d33, ...d34, ...d32, ...d31, ...rig1, ...gota1, ...hist2, ...d41, ...d42, ...d43, ...expStanford, ...efEspectador};
