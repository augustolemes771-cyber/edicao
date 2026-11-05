import type {Edit, Som} from '../../motor/plano';
import transcricao from './transcricao.json';

// Vídeo 100% motion: "notícia com prova real" sobre o crescimento do TikTok Shop no Brasil, pra atrair
// gente que quer virar creator de live na agência M4. Estilo: fundo escuro, ticker de notícias, números
// gigantes em rosa com efeito sonoro, print de manchete real como evidência, gráfico ranqueado, moedas/
// cédulas 3D nos números de dinheiro, CTA fixo (ver ilustracao.tsx/cenas.tsx).
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
		const peca = (nome: string, de: number, ate: number, sons: {em: number; som: Som; ganho?: number}[] = []) => ({
			tipo: 'peca' as const,
			nome,
			modo: 'cheia' as const,
			de,
			ate,
			dados: {},
			sons,
		});
		const fimFala = b.say('assistindo quem vende').fim;
		return [
			peca('tkAbertura', b.at('Enquanto'), b.say('fazendo live no TikTok').fim, [{em: b.at('Enquanto'), som: 'pro_whoosh'}]),
			peca('tkChegada', b.say('O TikTok Shop chegou').inicio, b.say('maio de 2025').fim, [{em: b.say('O TikTok Shop chegou').inicio, som: 'pro_tick', ganho: 0.6}]),
			peca('tkFaturamento', b.say('Em um ano').inicio, b.say('dez mil por cento').fim, [
				{em: b.at('cinco'), som: 'rise', ganho: 0.8},
				{em: b.at('cinco'), som: 'boom', ganho: 0.7},
			]),
			peca('tkCuritiba', b.say('Só em Curitiba').inicio, b.say('dez milhões de reais em vendas').fim, [{em: b.say('Só em Curitiba').inicio, som: 'pro_swipe'}]),
			peca('tkCriadoraSozinha', b.say('Uma delas, sozinha').inicio, b.say('fazendo live', 2).fim, [{em: b.say('Uma delas, sozinha').inicio, som: 'shimmer', ganho: 0.7}]),
			peca('tk200Criadores', b.say('E não é só ela').inicio, b.say('dentro do TikTok Shop').fim, [{em: b.at('duzentos'), som: 'pro_pop', ganho: 0.8}]),
			peca('tkGraficoLives', b.say('O número de lives').inicio, b.say('cento e sessenta e uma vezes').fim, [
				{em: b.say('O número de lives').inicio, som: 'pro_whoosh_curto'},
				{em: b.at('cento'), som: 'subida', ganho: 0.7},
			]),
			peca('tkRecordeLive', b.say('Já teve live').inicio, b.say('numa noite só').fim, [{em: b.at('cem'), som: 'boom', ganho: 0.7}]),
			peca('tkGlobal', b.say('O TikTok Shop no mundo todo').inicio, b.say('esse ano').fim, [{em: b.say('O TikTok Shop no mundo todo').inicio, som: 'pro_swipe'}]),
			peca('tkPergunta', b.at('pergunta'), fimFala, [{em: b.at('pergunta'), som: 'glitch', ganho: 0.6}]),
			peca('tkCTAFinal', fimFala, fimFala + 3.5, [{em: fimFala, som: 'pro_pop', ganho: 0.8}]),
		];
	},
};
