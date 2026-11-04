import type {Edit} from '../../motor/plano';
import type {Trecho} from '../../motor/palavras';
import transcricao from './transcricao.json';

// AD 03 - Melão de São Caetano (PDF "Roteiros - Letícia"). Tela dividida como a ref. Sil Skin Care: em cima o vídeo do melão
// (ssstik.io_1793670658500.mp4 em loop), embaixo a criadora; legenda no meio em tarja preta. "Pochete" mutado (pedido do PDF).
// Base pronta do ffmpeg: split.mp4 (melão em cima, criadora embaixo, pochete mutado).
const PALAVRAS = (transcricao as {words: {text: string; start: number; end: number; type: string}[]}).words.filter(
	(w) => w.type === 'word',
);
const DEPOIS = 0.07;
const ANTES = 0.05;
const CORTES: Trecho[] = [
	[0, Math.max(0, PALAVRAS[0].start - ANTES)],
	// Regravações: "Outro detalhe," (fica a segunda) e "Agora, se você prefere continuar sofrend--".
	[52.06 - ANTES, 54.92 - ANTES],
	[70.36 - ANTES, 75.1 - ANTES],
];
for (let i = 1; i < PALAVRAS.length; i++) {
	const a = PALAVRAS[i - 1].end + DEPOIS;
	const z = PALAVRAS[i].start - ANTES;
	if (z - a >= 0.04 && PALAVRAS[i].start - PALAVRAS[i - 1].end > 0.23) CORTES.push([a, z]);
}
CORTES.push([PALAVRAS[PALAVRAS.length - 1].end + 0.3, 146.1]);

export const ad03: Edit = {
	pasta: 'projetos/ad-03',
	video: 'split.mp4',
	formato: 'vertical',
	escalaFinal: 1,
	verificarCurva: false,
	regraCamera: false,
	legenda: {estilo: 'tarja', palavrasPorTela: 3, altura: 0.5, esconderEm: []},
	camera: () => [],
	transcricao,
	cortes: CORTES,
	// Seta para o botão laranja do CTA ("E claro que eu vou te mostrar onde conseguir") até o fim.
	cenas: (b) => [{tipo: 'peca', nome: 'ad03Seta', de: b.say('E claro que eu vou te mostrar').inicio, ate: b.palavras[b.palavras.length - 1].fim + 0.3}],
};
