// Preferências do painel em dois lugares:
// - biblioteca/preferencias.json: como editar (vai para o git, vale em qualquer PC);
// - .painel/config.json: coisas deste computador (pod, modelo do Claude, GPU), fora do git.
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';

export const PREFS_PADRAO = {
	formatoPadrao: 'vertical',
	resPrevia: 720,
	intensidade: 'normal',
	legendaPadrao: 'palavra',
	confirmarFinal: true,
	amostras: false,
	blocos: true,
	segBloco: 10,
	participar: true,
	salvarSozinho: false,
	salvarAoFechar: true,
	sempre: '',
};

export const CONFIG_PADRAO = {
	modelo: 'auto',
	esforco: 'low',
	gpuStudio: true,
	gpuCodificador: true,
	navegadorRender: '',
	notificar: true,
	pod: {ativo: false, host: '', porta: 22, usuario: 'root', chave: '', pasta: '/workspace/edicao', gl: 'angle-egl'},
};

const ler = (f, padrao) => {
	try {
		return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : padrao;
	} catch {
		return padrao;
	}
};

export const criarConfig = (raiz, estado) => {
	const arqPrefs = path.join(raiz, 'biblioteca/preferencias.json');
	const arqConfig = path.join(estado, 'config.json');
	const prefs = () => ({...PREFS_PADRAO, ...ler(arqPrefs, {})});
	const config = () => {
		const c = ler(arqConfig, {});
		return {...CONFIG_PADRAO, ...c, pod: {...CONFIG_PADRAO.pod, ...(c.pod ?? {})}};
	};
	// Só aceita as chaves conhecidas, com o tipo da padrão: o arquivo nunca recebe lixo vindo da página.
	const limpar = (padrao, novo) => {
		const r = {};
		for (const [k, v] of Object.entries(padrao)) {
			const n = novo?.[k];
			if (n === undefined) continue;
			if (v && typeof v === 'object') r[k] = limpar(v, n);
			else if (typeof v === 'number') r[k] = Number(n) || v;
			else if (typeof v === 'boolean') r[k] = Boolean(n);
			else r[k] = String(n).slice(0, k === 'sempre' ? 4000 : 300);
		}
		return r;
	};
	const salvar = ({prefs: p, config: c}) => {
		if (p) {
			mkdirSync(path.dirname(arqPrefs), {recursive: true});
			writeFileSync(arqPrefs, JSON.stringify({...prefs(), ...limpar(PREFS_PADRAO, p)}, null, 1) + '\n');
		}
		if (c) {
			const atual = config();
			const novo = limpar(CONFIG_PADRAO, c);
			writeFileSync(arqConfig, JSON.stringify({...atual, ...novo, pod: {...atual.pod, ...(novo.pod ?? {})}}, null, 1));
		}
	};
	return {prefs, config, salvar};
};

// Texto das preferências para a instrução do Claude.
// 'auto' = a IA decide pelo conteúdo e pelo tema e diz em uma linha o que escolheu.
const IA_DECIDE = 'a IA decide: escolha o que combina com o conteúdo, o tema e as referências, e diga em uma linha o que escolheu';
export const textoPrefs = (p) => {
	const intensidade = p.intensidade === 'auto' ? IA_DECIDE : ({calma: 'calma: poucos efeitos, só onde a fala pede', normal: 'normal: o ritmo das regras da skill', frenetica: 'frenética: evento novo a cada 0,3 a 0,6 s'}[p.intensidade] ?? p.intensidade);
	const formato = p.formatoPadrao === 'auto' ? `${IA_DECIDE} (vertical para Reels/Shorts/TikTok, horizontal para YouTube)` : p.formatoPadrao;
	const legenda = p.legendaPadrao === 'auto' ? IA_DECIDE : p.legendaPadrao;
	const amostras = p.amostras
		? `- AMOSTRAS LIGADAS: em cada decisão de estilo que mude o resultado (abertura/gancho, tipografia, paleta, legenda, efeito principal, transições), ANTES de aplicar,
  gere 2 ou 3 opções como imagens estáticas do mesmo momento (ex.: npx remotion still <projeto> out/amostra-<projeto>-a.jpg --frame=<quadro> --scale=0.5,
  uma variação por vez no edit.ts) e mostre cada uma numa linha própria exatamente assim: [[amostra:A|out/amostra-<projeto>-a.jpg|descrição curta da opção]].
  Depois PARE e espere o usuário escolher. Volte o edit.ts para a opção escolhida.`
		: '- Amostras desligadas: decida sozinho e siga até a prévia, sem parar para perguntar o que dá para decidir (a não ser o plano do modo participativo, se estiver ligado).';
	const seg = [6, 10, 15].includes(Number(p.segBloco)) ? Number(p.segBloco) : 10;
	const blocos = p.blocos !== false
		? `
- FLUXO POR BLOCOS (ligado; o foco é volume com qualidade, sem parar): o vídeo é feito em blocos de ~${seg} s, cada um aprovado antes do próximo.
  (1) Bloco 1: escreva no edit.ts o roteiro inteiro (trechos/cortes, legenda) mas só as cenas e a câmera até o fim do bloco 1. Rode
  \`npm run bloco -- <projeto> 1 --seg ${seg} --res ${p.resPrevia}\`. (2) Ele já faz a análise de qualidade (⚠/✗), renderiza só o trecho e
  gera a folha de quadros: LEIA a folha (Read na imagem out/<projeto>-bloco-N-folha.jpg) e confira: texto sobre o rosto, texto cortado na
  borda, leitura difícil, efeito fora do tempo da fala, tela poluída, trecho parado, efeito sem sentido. Se houver erro (✗), aviso (⚠) que
  dá para resolver ou defeito na folha, corrija e rode o bloco de novo (no máximo 1 vez). (3) Responda em até 3 linhas com o que o bloco
  tem e copie EXATAMENTE a linha [[bloco:...]] que o comando imprimiu; PARE e espere. (4) "Bloco N aprovado": faça só o bloco N+1, sem
  mexer nos aprovados. "Ajuste no bloco N": corrija só ele e rode o bloco N de novo. Depois do último: gere a prévia completa.
  Este comando é exigido pelo fluxo (vale mais que a regra de não gerar prévias).
  SE ALGO FALHAR (comando, render, pod), NÃO PARE NEM PERGUNTE: leia o erro, descubra a causa, corrija ou contorne (outro comando, outro caminho,
  ajustar o script) e tente de novo, até 3 tentativas diferentes. Só reporte ao usuário o que não conseguiu resolver, em 2 linhas.
  RODE O \`npm run bloco\` SEMPRE EM PRIMEIRO PLANO (Bash normal, timeout 1800000), NUNCA em segundo plano: quando sua resposta termina
  a sessão fecha e mata o render (o pod "cai"). Espere ele acabar na mesma resposta. Não use nohup, setsid, start nem & (no Windows não existem ou não funcionam). Nunca use SEM_POD por conta própria; se a saída
  disser "O RENDER NO POD FALHOU", copie o erro para o usuário em 1 linha.
- CRIATIVIDADE COM SENTIDO (em todo bloco): pelo menos UMA ideia visual nova tirada do que é dito naquele trecho (live vazia → interface
  de live com 1 espectador; número → número 3D; lista → chips um por vez; virada → frase grande; nome → pílula; pergunta → plano aberto).
  Não repita o efeito principal do bloco anterior. Se nenhuma peça servir, crie uma nova em src/pecas com acabamento de produção (mola,
  tipografia e paleta do tema, sombra suave; nada de clip-art, fonte gótica ou símbolo solto) e registre em biblioteca/itens.
  Sem poluir: um texto por vez, um evento a cada ~2 s, todo efeito ligado a uma palavra ou ideia falada, legenda no meio.`
		: '';
	const participar = p.participar !== false
		? `
- MODO PARTICIPATIVO (o usuário quer acompanhar e decidir junto; vale mais que o limite de 3 linhas): (1) ANTES de editar um vídeo, mande o PLANO em até 8 linhas (gancho, estrutura, 3 a 6 cenas e efeitos principais, 3D se houver, o que descartou) e PARE esperando a aprovação ou as mudanças; não escreva o edit.ts antes. (2) Depois de aprovado, escreva UMA linha de status ao fim de cada etapa (ex.: "Transcrição pronta: 106 s, 378 palavras"). (3) Ao terminar, resuma em 3 linhas o que fez, diga onde ver (aba Prévias) e pergunte o que quer mudar. Em ajuste pequeno que o usuário pediu, pule o plano e aplique direto.`
		: '';
	return `Preferências do usuário (valem para todo vídeo, salvo pedido contrário):
- Formato de vídeo novo: ${formato}. Prévia em ${p.resPrevia}p (npm run preview -- <projeto> --res ${p.resPrevia}).
- Intensidade da edição: ${intensidade}.
- Legenda: ${legenda}.
${amostras}${blocos}${participar}
- ${p.confirmarFinal ? 'Nunca rode o render final sem o usuário pedir.' : 'Pode rodar o render final quando a prévia for aprovada.'}${p.sempre ? `\n- Sempre: ${p.sempre}` : ''}`;
};

// Modelo automático: escolhe modelo e esforço pelo tipo do pedido. Pedidos criativos ou de análise vão para o mais capaz;
// perguntas curtas e comandos simples, para o mais rápido. Dentro do pedido, o Claude ainda pode usar subagentes por etapa.
export const escolherModelo = (pedido, {projetoNovo = false} = {}) => {
	const t = String(pedido).toLowerCase();
	// Opus só para decidir estilo/roteiro (análise de referência, vídeo ou projeto novo); criação de peça, 3D e refazer vão no Sonnet.
	const decisao = /analis|refer[eê]ncia|copiar? (o )?estilo|recri|modelo do tema|roteiro|projeto novo|v[ií]deo novo/.test(t);
	if (decisao || projetoNovo) return {modelo: 'opus', esforco: 'medium', motivo: 'decisão de estilo ou roteiro'};
	const criacao = /do zero|cria(r)? (uma )?(pe[cç]a|cena|efeito|anima|template|tema)|3d|blender|redesenh|refaz/.test(t) || t.length > 500;
	if (criacao) return {modelo: 'sonnet', esforco: 'medium', motivo: 'criação de peça ou cena'};
	const leve = t.length < 160 && (/\?\s*$/.test(t) || /^(gera|gerar|faz|fazer|roda|rodar) (a )?pr[eé]via|^(status|o que falta|quanto falta|lista|mostra|renomeia|troca|muda|tira|coloca)/.test(t));
	if (leve) return {modelo: 'haiku', esforco: 'low', motivo: 'pergunta ou ajuste simples'};
	return {modelo: 'sonnet', esforco: 'low', motivo: 'ajuste de edição'};
};
