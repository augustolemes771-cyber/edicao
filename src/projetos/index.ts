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
import {p2Entre} from './2-entre/edit';
import {p2Entre2} from './2-entre-2/edit';
import {teste22} from './teste22/edit';
import {v0711Ad01} from './v0711-ad01/edit';
import {v0711Ad02} from './v0711-ad02/edit';
import {v0711Ad03} from './v0711-ad03/edit';
import {v0711Ad04} from './v0711-ad04/edit';
import {v0811Ad02} from './v0811-ad02/edit';
import {v0811Ad03} from './v0811-ad03/edit';
import {teste222} from './teste222/edit';
import {mc1011Ad02} from './mc-1011-ad02/edit';
import {mc1011Ad03} from './mc-1011-ad03/edit';
import {mc1011Ad04} from './mc-1011-ad04/edit';
import {mc0911Ad01} from './mc-0911-ad01/edit';
import {mc0911Ad02} from './mc-0911-ad02/edit';
import {mc0911Ad03} from './mc-0911-ad03/edit';
import {mc0911Ad04} from './mc-0911-ad04/edit';
import {mc0811Ad02} from './mc-0811-ad02/edit';
import {mc0811Ad03} from './mc-0811-ad03/edit';
import {mc0811Ad04} from './mc-0811-ad04/edit';
import {fe0711Ad1} from './fe-0711-ad1/edit';
import {fe1011Ad1} from './fe-1011-ad1/edit';
import {fe0711Ad2} from './fe-0711-ad2/edit';
import {fe1011Ad2} from './fe-1011-ad2/edit';
import {fe0711Ad3} from './fe-0711-ad3/edit';
import {fe0911Ad3} from './fe-0911-ad3/edit';
import {fe1011Ad3} from './fe-1011-ad3/edit';
import {fe0511Ad4} from './fe-0511-ad4/edit';
import {fe0711Ad4} from './fe-0711-ad4/edit';
import {fe1011Ad4} from './fe-1011-ad4/edit';
import {la0811Ad03} from './la-0811-ad03/edit';
import {la0911Ad02} from './la-0911-ad02/edit';
import {la1111Ad01} from './la-1111-ad01/edit';
import {p223} from './223/edit';
import {p2231} from './223-1/edit';
import {p8} from './8/edit';
import {p2233} from './223-3/edit';

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
	'2-entre': p2Entre,
	'2-entre-2': p2Entre2,
	'teste22': teste22,
	'v0711-ad01': v0711Ad01,
	'v0711-ad02': v0711Ad02,
	'v0711-ad03': v0711Ad03,
	'v0711-ad04': v0711Ad04,
	'v0811-ad02': v0811Ad02,
	'v0811-ad03': v0811Ad03,
	'teste222': teste222,
	'mc-1011-ad02': mc1011Ad02,
	'mc-1011-ad03': mc1011Ad03,
	'mc-1011-ad04': mc1011Ad04,
	'mc-0911-ad01': mc0911Ad01,
	'mc-0911-ad02': mc0911Ad02,
	'mc-0911-ad03': mc0911Ad03,
	'mc-0911-ad04': mc0911Ad04,
	'mc-0811-ad02': mc0811Ad02,
	'mc-0811-ad03': mc0811Ad03,
	'mc-0811-ad04': mc0811Ad04,
	'fe-0711-ad1': fe0711Ad1,
	'fe-1011-ad1': fe1011Ad1,
	'fe-0711-ad2': fe0711Ad2,
	'fe-1011-ad2': fe1011Ad2,
	'fe-0711-ad3': fe0711Ad3,
	'fe-0911-ad3': fe0911Ad3,
	'fe-1011-ad3': fe1011Ad3,
	'fe-0511-ad4': fe0511Ad4,
	'fe-0711-ad4': fe0711Ad4,
	'fe-1011-ad4': fe1011Ad4,
	'la-0811-ad03': la0811Ad03,
	'la-0911-ad02': la0911Ad02,
	'la-1111-ad01': la1111Ad01,
	'223': p223,
	'223-1': p2231,
	'8': p8,
	'223-3': p2233,
};
