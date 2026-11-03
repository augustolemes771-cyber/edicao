import type {Edit} from '../../motor/plano';
import transcricao from './transcricao.json';

// Vídeo 100% motion: "O experimento que a ciência proibiu de repetir pra sempre" (Experimento da Prisão de
// Stanford, 1971). Narração com voz neural (scripts/narrar.py), sem filmagem nenhuma — só cenas `cenario`
// reaproveitando o catálogo de objetos 3D existente (rei, moeda, notas, relogio, lampiao, celular, caixa).
export const experimentoStanford: Edit = {
	pasta: 'projetos/experimento-stanford',
	video: 'video.mp4',
	formato: 'vertical',
	escalaFinal: 1,
	verificarCurva: false,
	regraCamera: false,
	legenda: {
		estilo: 'palavra',
		altura: 0.72,
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
			tipo: 'cenario',
			de: b.at('Cientistas'),
			ate: b.say('transformado numa prisão falsa').fim,
			fantasma: 'COMUM',
			pequeno: 'escolhidos por serem os mais estáveis do grupo',
			grande: '24',
			abaixo: 'metade virou guarda. metade, prisioneiro.',
			posTexto: 0.42,
			objetos: [
				{tipo: 'rei', x: -0.6, y: 0.55, escala: 0.85, entra: 'cai'},
				{tipo: 'rei', x: 0.6, y: -0.55, z: -0.3, escala: 0.95, entra: 'cai', atraso: 6, cor: '#6c7480'},
			],
		},
		// 2. O prazo original: duas semanas.
		{
			tipo: 'cenario',
			de: b.at('experimento'),
			ate: b.say('durar duas semanas').fim,
			pequeno: 'o experimento devia durar',
			grande: '2 SEMANAS',
			posTexto: 0.46,
			camera: {de: [0, 0, 8.4], ate: [0, 0, 7.4]},
			objetos: [{tipo: 'relogio', x: 0, y: -0.05, escala: 1.5, girar: 0.4}],
		},
		// 3. Escalada: rebelião, punições, crise no primeiro dia.
		{
			tipo: 'cenario',
			de: b.say('segundo dia').inicio,
			ate: b.say('sair no primeiro dia').fim,
			superficie: 'escuro',
			luz: 'nenhuma',
			fantasma: 'PUNIÇÃO',
			grande: 'REBELIÃO',
			abaixo: 'flexões. isolamento. humilhação.',
			posTexto: 0.44,
			tinta: '#e5484d',
			objetos: [
				{tipo: 'lampiao', x: -0.62, y: -0.15, escala: 1, giro: [0.1, 0.3, 0]},
				{tipo: 'lampiao', x: 0.6, y: 0.55, z: -0.5, escala: 0.6, atraso: 6, giro: [0.1, -0.3, 0]},
			],
		},
		// 4. O cientista perde o controle e interrompe tudo no sexto dia.
		{
			tipo: 'cenario',
			de: b.at('sexto'),
			ate: b.say('interrompeu tudo').fim,
			superficie: 'escuro',
			fantasma: 'CONTROLE',
			grande: 'DIA 6',
			abaixo: 'perdeu o controle da própria pesquisa',
			posTexto: 0.42,
			tinta: '#e5484d',
			objetos: [{tipo: 'relogio', x: 0, y: -0.1, escala: 1.4, girar: -0.5}],
		},
		// 5. Cinquenta anos como prova clássica de psicologia.
		{
			tipo: 'cenario',
			de: b.at('cinquenta'),
			ate: b.say('livro de psicologia do mundo').fim,
			superficie: 'papel',
			luz: 'janela',
			fantasma: 'MONSTRO',
			pequeno: 'virou prova de que qualquer pessoa',
			grande: 'pode virar um monstro',
			estiloTexto: 'editorial',
			posTexto: 0.42,
			objetos: [{tipo: 'rei', x: 0.62, y: -0.6, escala: 1.15, girar: 0.1}],
		},
		// 6. A virada: em 2018, documentos questionam a versão oficial.
		{
			tipo: 'cenario',
			de: b.say('Só que em').inicio,
			ate: b.say('parte interessada ao mesmo tempo').fim,
			superficie: 'escuro',
			luz: 'nenhuma',
			fantasma: 'FRAUDE?',
			grande: '2018',
			abaixo: 'documentos revelados mostraram outro lado',
			estiloTexto: 'neutro',
			posTexto: 0.42,
			objetos: [
				{tipo: 'notas', x: 0.6, y: -0.6, escala: 0.9, entra: 'desliza', giro: [Math.PI / 2.3, 0, -0.4]},
				{tipo: 'relogio', x: -0.62, y: 0.6, z: -0.4, escala: 0.6, atraso: 6},
			],
		},
		// 7. Fechamento: a pergunta que fica não é mais "você viraria um monstro?".
		{
			tipo: 'cenario',
			de: b.at('pergunta'),
			ate: b.say('isso é verdade').fim,
			superficie: 'escuro',
			luz: 'nenhuma',
			fantasma: 'VERDADE',
			grande: 'MONSTRO?',
			abaixo: 'ou será que a história é que não é verdade?',
			posTexto: 0.46,
			camera: {de: [0, 0, 8.6], ate: [0, 0, 6.6]},
			objetos: [{tipo: 'moeda', x: 0, y: 0.7, escala: 0.8, girar: 0.6, flutuar: true}],
		},
	],
};
