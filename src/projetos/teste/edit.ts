import type {EfeitoCamera, Edit} from '../../motor/plano';
import type {Busca, Trecho} from '../../motor/palavras';
import silencios from './silencios.json';
import transcricao from './transcricao.json';

// Teste (tema edicao-simples): publi do Fit Hair, fala direta para a câmera. Foco do tema: velocidade.
// Headline traduzida da referência ("grow your hair to your butt by thanksgiving") + Rapunzel no topo o vídeo todo;
// legenda "caixa" (caixa alta branca com contorno preto, caixa vermelha na palavra falada), câmera frenética.
const P = {x: 0.5, y: 0.34};
// Fonte 464x832: zoom no máximo 1,24.
const ESCALAS = [1.08, 1.16, 1.22, 1.1, 1.18, 1.03];

// Pausas maiores que ~0,25 s saem (no tempo original), mais a abertura e o fim mudos.
const CORTES: Trecho[] = (silencios as Trecho[])
	.filter(([a, z]) => z - a >= 0.25 || a === 0 || z >= 116.9)
	.map(([a, z]) => (a === 0 ? [0, z - 0.08] : z >= 116.9 ? [a + 0.15, z] : [a + 0.06, z - 0.06]) as Trecho);

const punches = (b: Busca): EfeitoCamera[] => {
	const lista: EfeitoCamera[] = [{tipo: 'foco', em: 0}];
	let ultimo = -9;
	let i = 0;
	for (const p of b.palavras) {
		if (p.inicio - ultimo < 0.45) continue;
		lista.push({tipo: 'zoom', em: p.inicio, escala: ESCALAS[i++ % ESCALAS.length], ...P});
		ultimo = p.inicio;
	}
	return lista;
};

export const teste: Edit = {
	pasta: 'projetos/teste',
	video: 'video.mp4',
	formato: 'vertical',
	escalaFinal: 0.5,
	verificarCurva: false,
	regraCamera: false,
	legenda: {
		estilo: 'caixa',
		palavrasPorTela: 2,
		altura: 0.66,
		esconderEm: [],
	},
	camera: punches,
	transcricao,
	silencios: silencios as Trecho[],
	cortes: CORTES,
	cenas: (b) => [
		{
			tipo: 'peca',
			nome: 'testeHeadline',
			de: 0,
			// Neste estilo a headline fica só os 5 primeiros segundos.
			ate: 5,
			dados: {
				linhas: ['deixe seu cabelo crescer até o bumbum', 'até o fim do ano 🎄'],
				img: 'projetos/teste/rapunzel.jpeg',
			},
		},
	],
};
