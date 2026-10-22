import type {Edit} from '../motor/plano';
import {exemplo} from './exemplo/edit';
import {reelsExemplo} from './reels-exemplo/edit';
import {depoimentoDanilow} from './depoimento-danilow/edit';

// Cada projeto novo entra aqui. O nome vira o id da composição no Studio e no render.
export const projetos: Record<string, Edit> = {
	exemplo,
	'reels-exemplo': reelsExemplo,
	'depoimento-danilow': depoimentoDanilow,
};
