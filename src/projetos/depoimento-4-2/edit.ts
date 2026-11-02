import type {EfeitoCamera, Edit} from '../../motor/plano';
import type {Busca, Trecho} from '../../motor/palavras';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

const TRECHOS: Trecho[] = [
	[41.86, 43.95],
	[0.0, 3.24],
	[17.19, 24.82],
	[8.38, 15.1],
	[29.99, 37.1],
	[46.34, 58.27],
	[60.2, 67.08],
	[71.8, 80.56],
	[88.3, 91.4],
];

export const depoimento42: Edit = {
	pasta: 'projetos/depoimento-4-2',
	video: 'video.mp4',
	formato: 'vertical',
	verificarCurva: false,
	regraCamera: false,
	barraProgresso: true,
	extraFim: 2.4,
	silencios: silencios as Trecho[],
	transcricao,
	trechos: () => {
		const cortado: Trecho[] = [];
		for (const [a, z] of TRECHOS) {
			let ini = a;
			for (const [s0, s1] of silencios as Trecho[]) {
				if (s0 <= ini + 0.1 || s1 >= z - 0.1 || s1 - s0 < 0.15) continue;
				cortado.push([ini, s0 + 0.04]);
				ini = s1 - 0.04;
			}
			cortado.push([ini, z]);
		}
		return cortado;
	},
	legenda: {estilo: 'mare', altura: 0.656, palavrasPorTela: 4, enfase: []},
	camera: () => [{tipo: 'foco', em: 0}],
	cenas: () => [],
};
