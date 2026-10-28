import type {Edit} from '../motor/plano';
import {exemplo} from './exemplo/edit';
import {reelsExemplo} from './reels-exemplo/edit';
import {depoimentoDanilow} from './depoimento-danilow/edit';
import {cenariosExemplo} from './cenarios-exemplo/edit';
import {neonExemplo} from './neon-exemplo/edit';
import {oficial1} from './oficial-1/edit';
import {primeiro} from './primeiro/edit';
import {segundoo} from './segundoo/edit';

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
};
