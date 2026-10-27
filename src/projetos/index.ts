import type {Edit} from '../motor/plano';
import {exemplo} from './exemplo/edit';
import {reelsExemplo} from './reels-exemplo/edit';
import {depoimentoDanilow} from './depoimento-danilow/edit';
import {cenariosExemplo} from './cenarios-exemplo/edit';
import {neonExemplo} from './neon-exemplo/edit';
import {p2710} from './27-10/edit';

// Cada projeto novo entra aqui. O nome vira o id da composição no Studio e no render.
export const projetos: Record<string, Edit> = {
	exemplo,
	'reels-exemplo': reelsExemplo,
	'depoimento-danilow': depoimentoDanilow,
	'cenarios-exemplo': cenariosExemplo,
	'neon-exemplo': neonExemplo,
	'27-10': p2710,
};
