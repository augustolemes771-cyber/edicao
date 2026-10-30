// Tipo das peças próprias de cada projeto (cena tipo 'peca'). Uma peça recebe a cena inteira: tempos em segundos do vídeo
// editado (cena.de é o quadro 0 dela, como em todas as cenas) e cena.dados com o que o edit.ts passou.
import type React from 'react';
import type {CenaNoPlano} from '../motor/plano';

export type CenaPeca = Extract<CenaNoPlano, {tipo: 'peca'}>;
export type Peca = React.FC<{cena: CenaPeca}>;
export type Pecas = Record<string, Peca>;
