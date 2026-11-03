import type {Edit} from '../../motor/plano';
import transcricao from './transcricao.json';

// Vídeo 100% motion: "O experimento que a ciência proibiu de repetir pra sempre" (Experimento da Prisão de
// Stanford, 1971). Narração com voz neural (scripts/narrar.py), ilustração 2D plana (ilustracao.tsx +
// cenas.tsx/cenas-p1..p6.tsx) no estilo da referência enviada pelo usuário. Cada frase/detalhe falado tem
// sua própria cena curta (sem cena estática), com câmera (zoom/pan) simulando filme, não cartão parado.
export const experimentoStanford: Edit = {
	pasta: 'projetos/experimento-stanford',
	video: 'video.mp4',
	formato: 'vertical',
	escalaFinal: 1,
	verificarCurva: false,
	regraCamera: false,
	legenda: {
		estilo: 'palavra',
		altura: 0.8,
		enfase: ['rebelando.', 'humilhação.', 'interrompeu', 'monstro.', 'duros.', 'verdade?'].map((palavra) => ({
			palavra,
			estilo: 'cor' as const,
			cor: '#ffcf3a',
		})),
	},
	camera: () => [{tipo: 'foco', em: 0}],
	transcricao,
	cortes: [],
	cenas: (b) => {
		const peca = (nome: string, de: number, ate: number) => ({tipo: 'peca' as const, nome, modo: 'cheia' as const, de, ate, dados: {}});
		return [
			// --- Bloco 1: abertura ---
			peca('stanfordP1a', b.at('Cientistas'), b.say('vinte e quatro estudantes comuns').fim),
			peca('stanfordP1b', b.at('escolhidos'), b.say('mais estáveis psicologicamente do grupo').fim),
			peca('stanfordP1c', b.say('Metade virou guarda').inicio, b.say('Metade virou guarda').fim),
			peca('stanfordP1d', b.say('Metade virou prisioneiro').inicio, b.say('Metade virou prisioneiro').fim),
			peca('stanfordP1e', b.at('lugar'), b.say('Universidade Stanford').fim),
			peca('stanfordP1f', b.at('transformado'), b.say('prisão falsa').fim),
			// --- Prazo original ---
			peca('stanfordPrazo', b.at('experimento'), b.say('durar duas semanas').fim),
			// --- Bloco 2: escalada ---
			peca('stanfordP2a', b.say('segundo dia').inicio, b.say('se rebelando').fim),
			// isolamento e humilhação eram curtas demais (<1s): rouba das vizinhas pra dar tempo de ler.
			peca('stanfordP2b', b.say('Os guardas começaram').inicio, b.say('com flexões').fim - 0.5),
			peca('stanfordP2c', b.at('isolamento') - 0.5, b.at('humilhação') + 0.4),
			peca('stanfordP2d', b.at('humilhação') + 0.4, b.say('Ninguém tinha mandado').inicio + 0.9),
			peca('stanfordP2e', b.say('Ninguém tinha mandado').inicio + 0.9, b.say('mandado fazer isso').fim),
			peca('stanfordP2f', b.say('Um prisioneiro teve').inicio, b.say('sair no primeiro dia').fim),
			// --- Bloco 3: interrupção e clássico ---
			peca('stanfordP3a', b.say('No sexto dia').inicio, b.say('No sexto dia').fim),
			peca('stanfordP3b', b.say('o próprio cientista').inicio, b.say('diretor da prisão').fim),
			peca('stanfordP3c', b.at('percebeu'), b.say('própria pesquisa').fim),
			peca('stanfordP3d', b.at('interrompeu'), b.say('interrompeu tudo').fim),
			peca('stanfordP3e', b.at('cinquenta'), b.say('Por cinquenta anos').fim),
			peca('stanfordP3f', b.say('essa história').inicio, b.say('o uniforme certo').fim),
			peca('stanfordP3g', b.at('Está'), b.say('livro de psicologia do mundo').fim),
			// --- Bloco 5: a virada ---
			peca('stanfordP5a', b.say('Só que em').inicio, b.say('dois mil e dezoito').fim),
			peca('stanfordP5b', b.at('documentos'), b.say('mostraram outro lado').fim),
			peca('stanfordP5c', b.at('Ex'), b.say('instruídos a serem duros').fim),
			peca('stanfordP5d', b.say('Um dos surtos').inicio, b.say('só queria ir embora').fim),
			peca('stanfordP5e', b.say('O próprio cientista era').inicio, b.say('parte interessada ao mesmo tempo').fim),
			// --- Bloco 6: fechamento ---
			peca('stanfordP6a', b.at('pergunta'), b.say('não é mais').fim),
			peca('stanfordP6b', b.say('será que você').inicio, b.say('viraria um monstro').fim),
			peca('stanfordP6c', b.say('será que a história').inicio, b.say('isso é verdade').fim),
		];
	},
};
