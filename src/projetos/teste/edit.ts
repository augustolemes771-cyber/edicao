import type {EfeitoCamera, Edit} from '../../motor/plano';
import type {Busca, Trecho} from '../../motor/palavras';
import transcricao from './transcricao.json';

// Teste (tema edicao-simples): publi do Fit Hair, fala direta para a câmera. Foco do tema: velocidade.
// Headline traduzida da referência ("grow your hair to your butt by thanksgiving") + Rapunzel no topo o vídeo todo;
// legenda "caixa" (caixa alta branca com contorno preto, caixa vermelha na palavra falada), câmera frenética.
const P = {x: 0.5, y: 0.34};
// Fonte 464x832: zoom no máximo 1,24.
const ESCALAS = [1.08, 1.16, 1.22, 1.1, 1.18, 1.03];

// Cortes pela fala (Scribe, palavra por palavra): todo respiro entre palavras com mais de 0,16 s sai, deixando 0,07 s depois
// do fim da palavra (cauda da consoante) e 0,05 s antes da próxima (ataque). Abertura e fim mudos saem também.
const PALAVRAS = (transcricao as {words: {text: string; start: number; end: number; type: string}[]}).words.filter(
	(w) => w.type === 'word',
);
const DEPOIS = 0.07;
const ANTES = 0.05;
const CORTES: Trecho[] = [[0, Math.max(0, PALAVRAS[0].start - ANTES)]];
for (let i = 1; i < PALAVRAS.length; i++) {
	const a = PALAVRAS[i - 1].end + DEPOIS;
	const z = PALAVRAS[i].start - ANTES;
	if (z - a >= 0.04 && PALAVRAS[i].start - PALAVRAS[i - 1].end > 0.23) CORTES.push([a, z]);
}
CORTES.push([PALAVRAS[PALAVRAS.length - 1].end + 0.25, 117.0]);

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
	// Sem `silencios`: o eco da sala esconde as pausas no medidor e o encaixe desfazia os cortes pela fala.
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
