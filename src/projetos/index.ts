import type {Edit} from '../motor/plano';
import {exemplo} from './exemplo/edit';

// Cada projeto novo entra aqui. O nome vira o id da composição no Studio e no render.
export const projetos: Record<string, Edit> = {
	exemplo,
};
