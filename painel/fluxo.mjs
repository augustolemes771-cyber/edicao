// Etapas de um vídeo, com "feito" detectado pelos arquivos do projeto e a ação que leva à próxima.
import {existsSync, readFileSync, readdirSync, statSync} from 'node:fs';
import path from 'node:path';
import {lerJson} from './comum.mjs';

const VIDEO = /\.(mp4|mov|m4v|webm|mkv|mp3|wav|m4a|aac)$/i;

const transcricaoFeita = (dir) => {
	for (const f of ['transcricao.json', 'scribe.json']) {
		const d = lerJson(path.join(dir, f), null);
		if (Array.isArray(d) ? d.length : d && (d.words?.length || d.text)) return f;
	}
	return null;
};

export const fluxo = ({raiz, projeto, projetoOk, tarefas}) => {
	const ok = projetoOk(projeto);
	const dirSrc = path.join(raiz, 'src/projetos', projeto ?? '');
	const dirMidia = path.join(raiz, 'public/projetos', projeto ?? '');
	const edit = path.join(dirSrc, 'edit.ts');
	const textoEdit = ok && existsSync(edit) ? readFileSync(edit, 'utf8') : '';
	const midias = ok && existsSync(dirMidia) ? readdirSync(dirMidia).filter((f) => VIDEO.test(f)) : [];
	// Projetos sem filmagem (motion) usam "duracao" no lugar do vídeo.
	const semVideo = /^\s*duracao:/m.test(textoEdit) && !/^\s*video:/m.test(textoEdit);
	const transc = ok ? transcricaoFeita(dirSrc) : null;
	const roteiro = path.join(raiz, 'docs', projeto ?? '', 'transcript-lines.txt');
	const vazias = /cenas:\s*\(\w*\)\s*=>\s*\[\s*\]/.test(textoEdit);
	const nCenas = vazias ? 0 : (textoEdit.match(/\btipo:\s*'/g) ?? []).length;
	const saidas = existsSync(path.join(raiz, 'out')) ? readdirSync(path.join(raiz, 'out')) : [];
	const previas = saidas.filter((f) => f.startsWith(`${projeto}-preview`) && f.endsWith('.mp4'));
	const final = saidas.includes(`${projeto}-final.mp4`);
	// O conferir vale se passou depois da última mudança no edit.ts.
	const conf = ok ? tarefas.ultima('conferir', projeto) : null;
	const confOk = conf?.estado === 'ok' && existsSync(edit) && conf.fim >= statSync(edit).mtimeMs;

	return {
		etapas: [
			{id: 'projeto', nome: 'Projeto', feito: ok, detalhe: ok ? `src/projetos/${projeto}` : 'Crie um projeto', acao: {tipo: 'chat', valor: 'Crie um projeto novo para este vídeo.'}},
			{id: 'midia', nome: 'Mídia', feito: midias.length > 0 || semVideo, detalhe: midias.length ? midias.join(', ') : semVideo ? 'Vídeo sem filmagem' : 'Envie o vídeo decupado', acao: {tipo: 'chat', valor: 'Confira as mídias que enviei e diga se falta algo para começar a edição.'}},
			{id: 'transcricao', nome: 'Transcrição', feito: Boolean(transc), detalhe: transc ? `src/projetos/${projeto}/${transc}` : 'Ainda não transcrito', acao: {tipo: 'tarefa', valor: 'transcrever'}},
			{id: 'roteiro', nome: 'Roteiro', feito: ok && existsSync(roteiro), detalhe: ok && existsSync(roteiro) ? `docs/${projeto}/transcript-lines.txt` : 'Gere as frases com tempo', acao: {tipo: 'tarefa', valor: 'roteiro'}},
			{id: 'cenas', nome: 'Cenas', feito: nCenas > 0, detalhe: nCenas ? `${nCenas} cena(s) e efeito(s) no edit.ts` : 'Nenhuma cena escrita', acao: {tipo: 'chat', valor: 'Leia o roteiro inteiro, corte as pausas e as notas faladas e escreva as cenas seguindo as regras do tema e as minhas preferências.'}},
			{id: 'conferir', nome: 'Conferir', feito: confOk, detalhe: conf ? (confOk ? 'Sem erros na última conferência' : conf.estado === 'erro' ? 'A última conferência achou erros' : 'O edit.ts mudou depois da conferência') : 'Ainda não conferido', acao: {tipo: 'tarefa', valor: 'conferir'}},
			{id: 'previa', nome: 'Prévia', feito: previas.length > 0, detalhe: previas.length ? previas.join(', ') : 'Gere uma prévia leve', acao: {tipo: 'tarefa', valor: 'previa'}},
			{id: 'final', nome: 'Final', feito: final, detalhe: final ? `out/${projeto}-final.mp4` : 'Render em 4K com -14 LUFS', acao: {tipo: 'tarefa', valor: 'final'}},
		],
	};
};
