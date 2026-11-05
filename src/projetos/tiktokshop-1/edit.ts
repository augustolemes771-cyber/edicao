import type {Edit} from '../../motor/plano';
import transcricao from './transcricao.json';

// Vídeo 100% motion: "notícia com prova real" sobre o crescimento do TikTok Shop no Brasil, pra atrair
// gente que quer virar creator de live na agência M4. Estilo: fundo escuro, números gigantes em rosa,
// print de manchete real como evidência, gráfico ranqueado, CTA fixo (ver ilustracao.tsx/cenas.tsx).
export const tiktokshop1: Edit = {
	pasta: 'projetos/tiktokshop-1',
	video: 'video.mp4',
	formato: 'vertical',
	escalaFinal: 1,
	verificarCurva: false,
	regraCamera: false,
	legenda: {
		estilo: 'palavra',
		altura: 0.78,
		enfase: ['milhões', 'bilhões', 'milhão', 'vendendo,', 'vende?'].map((palavra) => ({
			palavra,
			estilo: 'cor' as const,
			cor: '#ff2d6f',
		})),
	},
	camera: () => [{tipo: 'foco', em: 0}],
	transcricao,
	cortes: [],
	cenas: (b) => {
		const peca = (nome: string, de: number, ate: number) => ({tipo: 'peca' as const, nome, modo: 'cheia' as const, de, ate, dados: {}});
		const fimFala = b.say('assistindo quem vende').fim;
		return [
			peca('tkAbertura', b.at('Enquanto'), b.say('fazendo live no TikTok').fim),
			peca('tkChegada', b.say('O TikTok Shop chegou').inicio, b.say('maio de 2025').fim),
			peca('tkFaturamento', b.say('Em um ano').inicio, b.say('dez mil por cento').fim),
			peca('tkCuritiba', b.say('Só em Curitiba').inicio, b.say('dez milhões de reais em vendas').fim),
			peca('tkCriadoraSozinha', b.say('Uma delas, sozinha').inicio, b.say('fazendo live', 2).fim),
			peca('tk200Criadores', b.say('E não é só ela').inicio, b.say('dentro do TikTok Shop').fim),
			peca('tkGraficoLives', b.say('O número de lives').inicio, b.say('cento e sessenta e uma vezes').fim),
			peca('tkRecordeLive', b.say('Já teve live').inicio, b.say('numa noite só').fim),
			peca('tkGlobal', b.say('O TikTok Shop no mundo todo').inicio, b.say('esse ano').fim),
			peca('tkPergunta', b.at('pergunta'), fimFala),
			peca('tkCTAFinal', fimFala, fimFala + 3.5),
		];
	},
};
