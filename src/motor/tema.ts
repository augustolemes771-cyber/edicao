import {loadFont} from '@remotion/fonts';
import {staticFile, useVideoConfig} from 'remotion';

// Identidade do canal Mateus Dias, aprovada em 06/10/2026.
export const cor = {
	preto: '#030405',
	branco: '#ffffff',
	verde: '#00A8A3',
	// Destaque em texto sobre preto: núcleo claro com halo verde-azulado.
	destaque: '#12d4cd',
	halo: '#00A8A3',
	// Franja da aberração cromática.
	franjaVermelha: '#ff3355',
	franjaAzul: '#33c9ff',
} as const;

// Fontes embutidas em public/fontes (todas OFL): o render não depende de internet.
export const poppins = 'Poppins';
export const playfair = 'Playfair Display';
export const unbounded = 'Unbounded';
export const inter = 'Inter';
const LATIN =
	'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';
const LATIN_EXT =
	'U+0100-02AF, U+0304, U+0308, U+0329, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF';
const carregar = (
	familia: string,
	arquivo: string,
	pesos: string[],
	estilos: ('normal' | 'italic')[],
	soLatin = false,
) => {
	const subconjuntos = soLatin
		? ([['latin', LATIN]] as const)
		: ([
				['latin', LATIN],
				['latin-ext', LATIN_EXT],
			] as const);
	for (const peso of pesos) {
		for (const estilo of estilos) {
			for (const [subconjunto, faixa] of subconjuntos) {
				loadFont({
					family: familia,
					url: staticFile(`fontes/${arquivo}-${subconjunto}-${peso}-${estilo}.woff2`),
					weight: peso,
					style: estilo,
					unicodeRange: faixa,
				});
			}
		}
	}
};
carregar(poppins, 'poppins', ['400', '600', '700', '800', '900'], ['normal']);
carregar(playfair, 'playfair-display', ['700', '800'], ['normal', 'italic']);
carregar(unbounded, 'unbounded', ['700', '800'], ['normal']);
carregar(inter, 'inter', ['600', '700', '800'], ['normal']);
// Estilos aprendidos na segunda leva de referências (docs/referencias/desmontagem-2.md).
export const gotica = 'UnifrakturMaguntia';
export const anton = 'Anton';
export const dmSerif = 'DM Serif Display';
carregar(gotica, 'unifrakturmaguntia', ['400'], ['normal'], true);
carregar(anton, 'anton', ['400'], ['normal']);
carregar(dmSerif, 'dm-serif-display', ['400'], ['normal', 'italic']);

// Quadro de desenho. O render final sai em 4K com --scale=2.
export const LARGURA = 1920;
export const ALTURA = 1080;
export const FPS = 30;

// Margens mínimas da skill (80 px do topo, 100 px das laterais) somadas
// ao que o punch de 6% empurra para fora a partir do centro.
export const margem = {
	topo: 80 + Math.ceil((ALTURA * 0.06) / 2),
	base: 80 + Math.ceil((ALTURA * 0.06) / 2),
	lado: 100 + Math.ceil((LARGURA * 0.06) / 2),
} as const;

// Mesma regra para qualquer formato (horizontal ou vertical).
export const useMargem = () => {
	const {width, height} = useVideoConfig();
	return {
		topo: 80 + Math.ceil((height * 0.06) / 2),
		base: 80 + Math.ceil((height * 0.06) / 2),
		lado: 100 + Math.ceil((width * 0.06) / 2),
	};
};

export const brilho = (c: string, forca = 1) =>
	`0 0 ${8 * forca}px ${c}, 0 0 ${22 * forca}px ${c}, 0 0 ${48 * forca}px ${c}88`;
