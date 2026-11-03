import type {Edit} from '../../motor/plano';
import transcricao from './transcricao.json';

// Vídeo 100% motion: "O experimento que a ciência proibiu de repetir pra sempre" (Experimento da Prisão de
// Stanford, 1971). Narração com voz neural (scripts/narrar.py), ilustração 2D plana (src/projetos/experimento-stanford/
// ilustracao.tsx + cenas.tsx) no estilo da referência enviada pelo usuário (personagens chapados, mapa com pino,
// lanterna revelando no escuro, cartela de título limpa) — não usa o 3D/cenario genérico do catálogo.
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
	cenas: (b) => [
		// 1. Abertura: 24 estudantes comuns, divididos em dois grupos.
		{
			tipo: 'peca',
			nome: 'stanfordAbertura',
			modo: 'cheia',
			de: b.at('Cientistas'),
			ate: b.say('transformado numa prisão falsa').fim,
			dados: {},
		},
		// 2. O prazo original: duas semanas.
		{
			tipo: 'peca',
			nome: 'stanfordPrazo',
			modo: 'cheia',
			de: b.at('experimento'),
			ate: b.say('durar duas semanas').fim,
			dados: {},
		},
		// 3. Escalada: rebelião, punições, crise no primeiro dia.
		{
			tipo: 'peca',
			nome: 'stanfordEscalada',
			modo: 'cheia',
			de: b.say('segundo dia').inicio,
			ate: b.say('sair no primeiro dia').fim,
			dados: {
				flexoes: b.at('flexões'),
				isolamento: b.at('isolamento'),
				humilhacao: b.at('humilhação'),
			},
		},
		// 4. O cientista perde o controle e interrompe tudo no sexto dia.
		{
			tipo: 'peca',
			nome: 'stanfordInterrompido',
			modo: 'cheia',
			de: b.at('sexto'),
			ate: b.say('interrompeu tudo').fim,
			dados: {},
		},
		// 5. Cinquenta anos como prova clássica de psicologia.
		{
			tipo: 'peca',
			nome: 'stanfordClassico',
			modo: 'cheia',
			de: b.at('cinquenta'),
			ate: b.say('livro de psicologia do mundo').fim,
			dados: {},
		},
		// 6. A virada: em 2018, documentos questionam a versão oficial.
		{
			tipo: 'peca',
			nome: 'stanfordVirada',
			modo: 'cheia',
			de: b.say('Só que em').inicio,
			ate: b.say('parte interessada ao mesmo tempo').fim,
			dados: {},
		},
		// 7. Fechamento: a pergunta que fica não é mais "você viraria um monstro?".
		{
			tipo: 'peca',
			nome: 'stanfordFechamento',
			modo: 'cheia',
			de: b.at('pergunta'),
			ate: b.say('isso é verdade').fim,
			dados: {},
		},
	],
};
