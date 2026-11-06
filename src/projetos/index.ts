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
import {depoimento31} from './depoimento-3-1/edit';
import {depoimento32} from './depoimento-3-2/edit';
import {depoimento33} from './depoimento-3-3/edit';
import {depoimento34} from './depoimento-3-4/edit';
import {referenciasIg1} from './referencias-ig-1/edit';
import {gota1} from './gota-1/edit';
import {depoimento41} from './depoimento-4-1/edit';
import {depoimento42} from './depoimento-4-2/edit';
import {depoimento43} from './depoimento-4-3/edit';
import {historia2} from './historia-2/edit';
import {tiktokShopLives} from './tiktok-shop-lives/edit';
import {experimentoStanford} from './experimento-stanford/edit';
import {efeitoEspectador} from './efeito-espectador/edit';
import {teste} from './teste/edit';
import {ad03} from './ad-03/edit';
import {testeFelipao} from './teste-felipao/edit';

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
	'depoimento-3-1': depoimento31,
	'depoimento-3-2': depoimento32,
	'depoimento-3-3': depoimento33,
	'depoimento-3-4': depoimento34,
	'referencias-ig-1': referenciasIg1,
	'gota-1': gota1,
	'depoimento-4-1': depoimento41,
	'depoimento-4-2': depoimento42,
	'depoimento-4-3': depoimento43,
	'historia-2': historia2,
	'tiktok-shop-lives': tiktokShopLives,
	'experimento-stanford': experimentoStanford,
	'efeito-espectador': efeitoEspectador,
	'teste': teste,
	'ad-03': ad03,
	'teste-felipao': testeFelipao,
};
