// As peças do modelo carregavam Montserrat e Playfair do Google Fonts; aqui usam as fontes locais (public/fontes):
// Poppins (sans geométrica pesada, aceita pelo modelo) e Playfair Display itálico.
import {playfair, poppins} from '../../motor/tema';

export const loadMontserrat = (..._: unknown[]) => ({fontFamily: poppins});
export const loadPlayfair = (..._: unknown[]) => ({fontFamily: playfair});
