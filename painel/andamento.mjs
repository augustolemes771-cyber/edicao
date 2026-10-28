// Andamento do projeto: etapas calculadas pelo painel (sem Claude) e perguntas baratas.
// A pergunta roda em Haiku, esforço baixo, só leitura e em conversa separada da edição (não polui nem gasta o contexto dela).
import {existsSync, readdirSync, readFileSync, statSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {lerJson, matar} from './comum.mjs';

const quando = (ms) => new Date(ms).toLocaleString('pt-BR');

export const criarAndamento = ({raiz, estado, tarefas, historico, listarMidias, lerGrupos, midiasNaoUsadas, rodar, ehWin, atividade}) => {
	const arqPrompt = path.join(estado, 'andamento.txt');

	const maisRecente = (dir, re) => {
		if (!existsSync(dir)) return null;
		const fs = readdirSync(dir)
			.filter((f) => re.test(f))
			.map((f) => ({arquivo: f, quando: statSync(path.join(dir, f)).mtimeMs}))
			.sort((a, b) => b.quando - a.quando);
		return fs[0] ?? null;
	};

	const calcular = (proj) => {
		const tar = tarefas.listar().filter((t) => t.projeto === proj);
		const andando = (tipos) => tar.some((t) => tipos.includes(t.tipo) && ['fila', 'rodando'].includes(t.estado));
		const midias = listarMidias(proj, 'midias');
		const grupos = lerGrupos(proj);
		const naoUsadas = midiasNaoUsadas(proj);
		const trans = path.join(raiz, 'src/projetos', proj, 'transcricao.json');
		const transOk = existsSync(trans) && statSync(trans).size > 5;
		const roteiro = existsSync(path.join(raiz, 'docs', proj, 'transcript-lines.txt'));
		const edit = path.join(raiz, 'src/projetos', proj, 'edit.ts');
		const cenas = existsSync(edit) ? (readFileSync(edit, 'utf8').match(/tipo: '/g) ?? []).length : 0;
		const prev = lerJson(path.join(raiz, 'out/previas', proj, 'manifest.json'), null);
		const previaVideo = maisRecente(path.join(raiz, 'out'), new RegExp(`^${proj}-preview.*[.]mp4$`));
		const final = maisRecente(path.join(raiz, 'out'), new RegExp(`^${proj}-final[.]mp4$`));
		const st = (ok, rodando = false) => (rodando ? 'andando' : ok ? 'ok' : 'pendente');
		const etapas = [
			{id: 'midias', nome: 'Mídias', estado: st(midias.length > 0), detalhe: midias.length ? `${midias.length} arquivo(s)${grupos.length ? `, ${grupos.length} grupo(s)` : ''}${naoUsadas.length ? `; não usados na edição: ${naoUsadas.join(', ')}` : ''}` : 'nenhuma mídia ainda'},
			{id: 'transcricao', nome: 'Transcrição', estado: st(transOk, andando(['transcrever'])), detalhe: transOk ? 'pronta' : 'falta transcrever'},
			{id: 'roteiro', nome: 'Roteiro', estado: st(roteiro, andando(['roteiro'])), detalhe: roteiro ? 'gerado' : 'falta gerar'},
			{id: 'edicao', nome: 'Edição', estado: st(cenas > 0), detalhe: cenas ? `${cenas} cena(s)/efeito(s) no edit.ts, alterado em ${quando(statSync(edit).mtimeMs)}` : 'ainda vazia'},
			{id: 'imagens', nome: 'Imagens da edição', estado: st(Boolean(prev), andando(['previas'])), detalhe: prev ? `${prev.itens?.length ?? 0} imagens${existsSync(edit) && statSync(edit).mtimeMs > prev.geradoEm ? ' (desatualizadas)' : ''}` : 'não geradas'},
			{id: 'previa', nome: 'Prévia em vídeo', estado: st(Boolean(previaVideo), andando(['previa'])), detalhe: previaVideo ? `${previaVideo.arquivo}, ${quando(previaVideo.quando)}` : 'não gerada'},
			{id: 'final', nome: 'Vídeo final', estado: st(Boolean(final), andando(['final'])), detalhe: final ? `${final.arquivo}, ${quando(final.quando)}` : 'não gerado'},
		];
		const conversa = historico.ler(proj);
		const recentes = conversa
			.filter((m) => m.quem === 'eu' || m.quem === 'ia')
			.slice(-6)
			.map((m) => `${m.quem === 'eu' ? 'Usuário' : 'Claude'}: ${String(m.texto).slice(0, 300)}`);
		const tarefasRec = tar.slice(0, 5).map((t) => ({tipo: t.tipo, estado: t.estado, pct: t.pct, fase: t.fase, erro: t.erro, onde: t.onde}));
		return {etapas, tarefas: tarefasRec, recentes};
	};

	const texto = (proj, a) =>
		[
			`Projeto: ${proj}`,
			'Etapas:',
			...a.etapas.map((e) => `- ${e.nome}: ${e.estado} (${e.detalhe})`),
			'Tarefas recentes:',
			...(a.tarefas.length ? a.tarefas.map((t) => `- ${t.tipo}: ${t.estado}${t.pct != null ? ` ${Math.round(t.pct)}%` : ''}${t.onde ? ` (${t.onde})` : ''}${t.erro ? ` erro: ${String(t.erro).slice(0, 200)}` : ''}`) : ['- nenhuma']),
			'Últimas mensagens da conversa de edição:',
			...(a.recentes.length ? a.recentes : ['- nenhuma']),
		].join('\n');

	const agora = async (proj) => {
		const ativ = atividade ? await atividade(proj) : {chatRodando: false, processos: []};
		const acoes = historico.ler(proj).filter((m) => m.quem === 'acao').slice(-8).map((m) => `- ${new Date(m.t).toLocaleTimeString('pt-BR')}: ${String(m.texto).slice(0, 140)}`);
		return [`O Claude da conversa de edição está ${ativ.chatRodando ? 'TRABALHANDO agora' : 'parado (esperando você)'}.`, `Processos pesados rodando neste PC: ${ativ.processos.length ? ativ.processos.join(', ') : 'nenhum'}.`, 'Últimas ações dele (com a hora):', ...(acoes.length ? acoes : ['- nenhuma'])].join('\n');
	};

	const perguntar = async (proj, pergunta) => {
		const contexto = await agora(proj);
		return new Promise((ok, falha) => {
			writeFileSync(
				arqPrompt,
				`Você responde perguntas sobre o ANDAMENTO do projeto de vídeo "${proj}" no painel de edição. Responda em português, em 2 a 4 linhas, com base no resumo abaixo e, só se precisar, lendo arquivos do projeto (src/projetos/${proj}/, docs/${proj}/, out/). Somente leitura: nunca edite nada nem rode comandos. Se o usuário pedir uma mudança na edição, diga para pedir na conversa de edição.\n\n${texto(proj, calcular(proj))}\n\nAgora:\n${contexto}`,
			);
			const args = ['-p', '--output-format', 'json', '--model', 'haiku', '--effort', 'low', '--tools', 'Read,Grep,Glob', '--allowedTools', 'Read,Grep,Glob', '--strict-mcp-config', '--disable-slash-commands', '--setting-sources', 'project,local', '--no-session-persistence', '--append-system-prompt-file', ehWin ? `"${arqPrompt}"` : arqPrompt];
			const p = rodar('claude', args, {stdio: ['pipe', 'pipe', 'pipe']});
			let saida = '', erro = '';
			const limite = setTimeout(() => matar(p), 120000);
			p.stdin.on('error', () => {});
			p.stdin.end(pergunta);
			p.stdout.on('data', (d) => (saida += d));
			p.stderr.on('data', (d) => (erro += d));
			p.on('error', () => {
				clearTimeout(limite);
				falha(new Error('Claude Code não encontrado neste computador.'));
			});
			p.on('close', () => {
				clearTimeout(limite);
				try {
					const j = JSON.parse(saida.trim().split('\n').pop());
					if (j.is_error) return falha(new Error(String(j.result ?? 'Erro').slice(0, 300)));
					ok({resposta: String(j.result ?? '').trim()});
				} catch {
					falha(new Error(erro.trim().slice(-300) || 'Sem resposta do Claude.'));
				}
			});
		});
	};

	return {calcular, perguntar};
};
