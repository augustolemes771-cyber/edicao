import type {Edit} from '../motor/plano';
import {exemplo} from './exemplo/edit';
import {reelsExemplo} from './reels-exemplo/edit';
import {depoimentoDanilow} from './depoimento-danilow/edit';
import {cenariosExemplo} from './cenarios-exemplo/edit';
import {neonExemplo} from './neon-exemplo/edit';
import {oficial1} from './oficial-1/edit';
import {primeiro} from './primeiro/edit';
import {segundoo} from './segundoo/edit';
import {depoimento} from './depoimento/edit';
import {depoimento2} from './depoimento-2/edit';
import {lifestyle1} from './lifestyle-1/edit';
import {entrevistaPista} from './entrevista-pista/edit';
import {entrevista3} from './entrevista-3/edit';
import {entrevista3V3} from './entrevista-3-v3/edit';
import {entrevista3V5} from './entrevista-3-v5/edit';
import {entrevista3V7} from './entrevista-3-v7/edit';
import {entrevista3V11} from './entrevista-3-v11/edit';
import {entrevista3V12} from './entrevista-3-v12/edit';
import {entrevista3V14} from './entrevista-3-v14/edit';

// Cada projeto novo entra aqui. O nome vira o id da composição no Studio e no render.
export const projetos: Record<string, Edit> = {
	exemplo,
	'reels-exemplo': reelsExemplo,
	'depoimento-danilow': depoimentoDanilow,
	'cenarios-exemplo': cenariosExemplo,
	'neon-exemplo': neonExemplo,
	'oficial-1': oficial1,
	'primeiro': primeiro,
	'segundoo': segundoo,
	depoimento,
	'depoimento-2': depoimento2,
	'lifestyle-1': lifestyle1,
	'entrevista-pista': entrevistaPista,
	'entrevista-3': entrevista3,
	'entrevista-3-v3': entrevista3V3,
	'entrevista-3-v5': entrevista3V5,
	'entrevista-3-v7': entrevista3V7,
	'entrevista-3-v11': entrevista3V11,
	'entrevista-3-v12': entrevista3V12,
	'entrevista-3-v14': entrevista3V14,
};
