import type {Edit} from '../../motor/plano';
import scribe from './scribe.json';

// Projeto de demonstração: fala sintética, sem vídeo (a câmera aparece como quadro de espera).
// Serve de modelo para um projeto real: copie a pasta e troque transcrição, vídeo e cenas.
export const exemplo: Edit = {
	pasta: 'projetos/exemplo',
	duracao: 66,
	transcricao: scribe,
	// Curva encurtada só para a demo caber em 1 minuto. Num vídeo real, deixe o padrão (30 s e 2:30).
	curva: {t1: 25, t2: 45},
	// Nota falada para a IA: sai do vídeo.
	cortes: (o) => [[o.say('Abre nota').inicio - 0.15, o.say('Fecha nota').fim + 0.2]],
	telaFinal: (b) => b.say('Aqui no final').inicio,
	cenas: (b) => [
		{
			tipo: 'titulo',
			texto: 'Editei com o *Claude*',
			de: b.at('Eu'),
			ate: b.at('não'),
			tempos: [b.at('editei'), b.at('com'), b.at('o'), b.at('Claude')],
		},
		{tipo: 'numero', valor: '0', legenda: 'créditos pagos', de: b.at('não'), ate: b.at('São')},
		{tipo: 'numero', valor: '3', legenda: 'passos', de: b.at('São'), ate: b.at('Primeiro'), fundo: 'verde'},
		{tipo: 'passo', modo: 'cheia', rotulo: 'Passo 1', texto: 'Transcrição palavra por palavra', de: b.at('Primeiro'), ate: b.at('Depois')},
		{tipo: 'passo', modo: 'cheia', rotulo: 'Passo 2', texto: 'Cenas sincronizadas com a fala', de: b.at('Depois'), ate: b.say('E por último').inicio},
		{tipo: 'passo', modo: 'cheia', rotulo: 'Passo 3', texto: 'Render em 4K', de: b.say('E por último').inicio, ate: b.say('Em menos').inicio},
		{
			tipo: 'titulo',
			texto: 'Em menos de *10 minutos*',
			fundo: 'verde',
			de: b.say('Em menos').inicio,
			ate: b.at('Agora'),
			tempos: b.tempos('Em menos de 10 minutos'),
		},
		// Pedido falado na gravação: "IA, coloca uma estrela bem grande aqui".
		{tipo: 'estrela', modo: 'cheia', texto: 'Por *dentro*', de: b.at('Agora'), ate: b.at('Cada'), pedidoFalado: true},
		{
			tipo: 'lista',
			titulo: 'Cada cena *na hora certa*',
			de: b.at('Cada'),
			ate: b.at('adiantado') + 0.6,
			itens: [
				{texto: 'Entra na palavra falada', em: b.at('exatamente')},
				{texto: 'Nada aparece adiantado', em: b.at('nada')},
			],
		},
		{
			tipo: 'painel',
			titulo: 'Tela gravada',
			itens: ['Mateus no canto', 'Nada cobre o que importa'],
			de: b.at('mostro'),
			ate: b.at('importa') + 0.6,
		},
		{tipo: 'logo3d', texto: 'Link na *descrição*', de: b.at('link'), ate: b.at('Aqui')},
		{tipo: 'despedida', texto: 'Valeu! Até o próximo', de: b.at('Valeu'), ate: b.at('próximo') + 1.2},
	],
};
