// Apagar um vídeo (projeto): tudo vai para .painel/lixeira/<nome>-<data>/ e dá para recuperar movendo de volta.
// Sai também do src/projetos/index.ts, da lista de projetos dos temas, do histórico de conversa e das sessões do Claude.
import {existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {lerJson, matar} from './comum.mjs';

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const criarApagar = ({raiz, estado, dirTemas, projetoOk, tarefas, rodando, sessoes, gravarSessoes}) => (nome) => {
	if (!projetoOk(nome)) throw Object.assign(new Error('Projeto inválido'), {codigo: 400});
	if (tarefas.listar().some((t) => t.projeto === nome && ['fila', 'rodando'].includes(t.estado))) {
		throw Object.assign(new Error('Tem uma tarefa rodando neste vídeo. Cancele na aba Render e tente de novo.'), {codigo: 400});
	}
	matar(rodando.get(nome));
	const lixo = path.join(estado, 'lixeira', `${nome}-${new Date().toISOString().replace(/[:.]/g, '-')}`);
	mkdirSync(lixo, {recursive: true});
	const mover = (de, para) => {
		if (!existsSync(de)) return;
		mkdirSync(path.dirname(path.join(lixo, para)), {recursive: true});
		renameSync(de, path.join(lixo, para));
	};
	mover(path.join(raiz, 'src/projetos', nome), `src/${nome}`);
	mover(path.join(raiz, 'public/projetos', nome), `public/${nome}`);
	mover(path.join(raiz, 'docs', nome), `docs/${nome}`);
	mover(path.join(raiz, 'out/previas', nome), `previas/${nome}`);
	const out = path.join(raiz, 'out');
	if (existsSync(out)) for (const f of readdirSync(out)) if (f.startsWith(`${nome}-`) && f.endsWith('.mp4')) mover(path.join(out, f), `out/${f}`);
	mover(path.join(estado, 'chats', `${nome}.json`), 'chat.json');

	// index.ts: tira o import e a linha do registro.
	const idx = path.join(raiz, 'src/projetos/index.ts');
	if (existsSync(idx)) {
		const texto = readFileSync(idx, 'utf8');
		const fim = texto.includes('\r\n') ? '\r\n' : '\n';
		const linhas = texto.split(/\r?\n/);
		const imp = linhas.find((l) => l.includes(`from './${nome}/edit'`));
		const variavel = imp ? /import\s*\{\s*(\w+)\s*\}/.exec(imp)?.[1] : null;
		const registro = variavel ? new RegExp(`^\\s*(?:['"]?${esc(nome)}['"]?\\s*:\\s*)?${variavel},?\\s*$`) : null;
		writeFileSync(idx, linhas.filter((l) => l !== imp && !(registro && registro.test(l))).join(fim));
	}

	// Temas: sai da lista de projetos.
	if (existsSync(dirTemas)) {
		for (const t of readdirSync(dirTemas)) {
			const arq = path.join(dirTemas, t, 'tema.json');
			const j = existsSync(arq) ? lerJson(arq, null) : null;
			if (j?.projetos?.includes(nome)) writeFileSync(arq, JSON.stringify({...j, projetos: j.projetos.filter((x) => x !== nome)}, null, 1));
		}
	}
	delete sessoes[nome];
	delete sessoes[`${nome}#n`];
	gravarSessoes();
	return {nome, lixeira: path.relative(raiz, lixo).split(path.sep).join('/')};
};
