// Painel de edição: servidor local sem dependências. Uso: npm run painel
// Recebe o pedido em texto, chama o Claude Code (a conta que estiver logada neste computador) dentro do projeto e
// mostra a biblioteca, as prévias e o Remotion Studio. A biblioteca e os projetos vivem no git: qualquer PC igual.
//
// Segurança: o painel executa o Claude Code com acesso ao projeto, então só aceita conexões de 127.0.0.1, exige um
// token aleatório (gerado a cada início e impresso no terminal) e recusa Host/Origin que não sejam o próprio painel.
// Assim nenhum site aberto no navegador consegue mandar pedidos para ele.
import {createServer} from 'node:http';
import {spawn, execFile, execFileSync} from 'node:child_process';
import {randomBytes, timingSafeEqual} from 'node:crypto';
import {createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync} from 'node:fs';
import {pipeline} from 'node:stream/promises';
import path from 'node:path';
import {criarConfig, escolherModelo, textoPrefs} from './config.mjs';
import {dentro, lerJson} from './comum.mjs';
import {fluxo} from './fluxo.mjs';
import {criarHistorico} from './historico.mjs';
import {testarPod} from './pod.mjs';
import {criarTarefas} from './tarefas.mjs';

const raiz = path.resolve(import.meta.dirname, '..');
const porta = Number(process.env.PORTA ?? 4000);
const token = randomBytes(24).toString('hex');
const estado = path.join(raiz, '.painel');
mkdirSync(estado, {recursive: true});
const arqSessoes = path.join(estado, 'sessoes.json');
const ler = (f, padrao) => (existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : padrao);
const sessoes = ler(arqSessoes, {});
const cfg = criarConfig(raiz, estado);
const historico = criarHistorico(estado);

const json = (res, dados, codigo = 200) => {
	res.writeHead(codigo, {'content-type': 'application/json; charset=utf-8'});
	res.end(JSON.stringify(dados));
};
const corpo = (req) =>
	new Promise((ok, falha) => {
		let t = '';
		req.on('data', (c) => {
			t += c;
			if (t.length > 2e6) req.destroy();
		});
		req.on('end', () => {
			try {
				ok(t ? JSON.parse(t) : {});
			} catch {
				falha(Object.assign(new Error('Corpo da requisição inválido'), {codigo: 400}));
			}
		});
	});
// No Windows, npm/claude/npx são .cmd e só rodam por shell. Por isso nada digitado pelo usuário vai nos argumentos:
// o pedido vai pela entrada padrão e a instrução do painel por arquivo.
const ehWin = process.platform === 'win32';
const rodar = (cmd, args, opcoes = {}) => spawn(cmd, args, {cwd: raiz, env: process.env, shell: ehWin, ...opcoes});
const testar = (cmd, args) =>
	new Promise((ok) => {
		const pr = rodar(cmd, args, {stdio: 'ignore'});
		pr.on('error', () => ok(false));
		pr.on('close', (c) => ok(c === 0));
	});
// O npm instala o claude numa pasta que pode não estar no PATH deste processo.
try {
	const prefixo = execFileSync(ehWin ? 'npm.cmd' : 'npm', ['prefix', '-g'], {encoding: 'utf8', shell: ehWin}).trim();
	process.env.PATH += path.delimiter + (ehWin ? prefixo : path.join(prefixo, 'bin'));
} catch {}
const git = (...args) => execFileSync('git', args, {cwd: raiz, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']});
// Ao fechar, o git roda num grupo separado (e escondido) para o Ctrl+C / fechar a janela não matarem o envio no meio.
let gitSeparado = false;
const gitAsync = (...args) =>
	new Promise((ok, falha) => execFile('git', args, {cwd: raiz, encoding: 'utf8', ...(gitSeparado ? {detached: true, windowsHide: true} : {})}, (e, saida, erro) => (e ? falha(Object.assign(e, {stderr: erro})) : ok(saida))));
// Salvar no git (botão "Salvar" e o salvamento automático depois de cada pedido).
// Um salvamento por vez; se já há um rodando, quem chega espera o mesmo.
let salvando = null;
const salvarGit = (mensagem) => {
	salvando ??= (async () => {
		await gitAsync('add', '-A');
		if ((await gitAsync('status', '--porcelain')).trim()) await gitAsync('commit', '-m', String(mensagem || 'Edição pelo painel').slice(0, 200));
		else {
			// Nada novo, mas pode ter ficado algo salvo neste PC sem enviar (ex.: a janela fechou no meio do envio).
			const pendentes = Number((await gitAsync('rev-list', '--count', '@{u}..HEAD').catch(() => '0')).trim()) || 0;
			if (!pendentes) return 'Nada novo para salvar.';
		}
		return (await gitAsync('push').catch((e) => `Salvo neste PC, mas o envio falhou: ${String(e.stderr || e.message).slice(-300)}`)) || 'Salvo e enviado.';
	})().finally(() => (salvando = null));
	return salvando;
};
// Salvamento automático ao fechar o painel (preferência "Salvar na nuvem ao fechar o painel", ligada por padrão).
const salvarAoFechar = (limiteMs) => {
	if (!cfg.prefs().salvarAoFechar) return Promise.resolve();
	const salvar = salvarGit('Salvamento automático ao fechar o painel')
		.then((s) => console.log(`Nuvem: ${String(s).trim().split('\n').at(-1) || 'ok'}`))
		.catch((e) => console.log(`Nuvem: não consegui salvar (${String(e.stderr || e.message).trim().slice(-200)})`));
	return limiteMs ? Promise.race([salvar, new Promise((ok) => setTimeout(ok, limiteMs))]) : salvar;
};
const nomeValido = (n) => !n || /^[a-z0-9-]+$/.test(n);

// ---------- Biblioteca ----------
const comentario = (arq) => {
	const linhas = readFileSync(arq, 'utf8').split('\n');
	return linhas.filter((l) => l.startsWith('//')).slice(0, 3).map((l) => l.replace(/^\/\/\s?/, '')).join(' ').trim();
};
const biblioteca = () => {
	const pecas = readdirSync(path.join(raiz, 'src/pecas'))
		.filter((f) => f.endsWith('.tsx'))
		.map((f) => ({nome: f.replace('.tsx', ''), arquivo: `src/pecas/${f}`, descricao: comentario(path.join(raiz, 'src/pecas', f))}));
	const obj3d = path.join(raiz, 'src/pecas/tres/Objetos3D.tsx');
	const modelos3d = existsSync(obj3d)
		? [...readFileSync(obj3d, 'utf8').matchAll(/export const (\w+)/g)].map((m) => ({nome: m[1], arquivo: 'src/pecas/tres/Objetos3D.tsx'}))
		: [];
	const blender = existsSync(path.join(raiz, 'scripts/blender'))
		? readdirSync(path.join(raiz, 'scripts/blender')).filter((f) => f.endsWith('.py')).map((f) => ({nome: f.replace('.py', ''), arquivo: `scripts/blender/${f}`}))
		: [];
	const templates = readdirSync(path.join(raiz, 'src/projetos'), {withFileTypes: true})
		.filter((d) => d.isDirectory())
		.map((d) => {
			const edit = path.join(raiz, 'src/projetos', d.name, 'edit.ts');
			const vertical = existsSync(edit) && /formato:\s*'vertical'/.test(readFileSync(edit, 'utf8'));
			return {nome: d.name, formato: vertical ? 'vertical' : 'horizontal', arquivo: `src/projetos/${d.name}/edit.ts`};
		});
	const sfx = existsSync(path.join(raiz, 'public/sfx')) ? readdirSync(path.join(raiz, 'public/sfx')).filter((f) => f.endsWith('.wav')).map((f) => f.replace('.wav', '')) : [];
	const fontes = {};
	for (const f of readdirSync(path.join(raiz, 'public/fontes')).filter((f) => f.endsWith('.woff2') && !f.includes('-ext-'))) {
		const m = /^(.+)-latin-(\d+)-(normal|italic)\.woff2$/.exec(f);
		if (m) (fontes[m[1]] ??= []).push({arquivo: f, peso: Number(m[2]), estilo: m[3]});
	}
	const referencias = existsSync(path.join(raiz, 'docs/referencias')) ? readdirSync(path.join(raiz, 'docs/referencias')).filter((f) => f.endsWith('.md')) : [];
	const dirItens = path.join(raiz, 'biblioteca/itens');
	const salvos = existsSync(dirItens) ? readdirSync(dirItens).filter((f) => f.endsWith('.json')).map((f) => ler(path.join(dirItens, f), {})) : [];
	return {pecas, modelos3d, blender, templates, sfx, fontes, referencias, salvos, pack: pack()};
};

// ---------- Pack de efeitos ----------
// Catálogo em biblioteca/pack/catalogo.json (git). Os arquivos ficam em biblioteca/pack/arquivos ou, se o pack foi
// catalogado no lugar, na pasta gravada em .painel/pack.json ({raiz}), que é deste PC.
const raizesPack = () => {
	const r = lerJson(path.join(estado, 'pack.json'), {})?.raiz;
	const local = typeof r === 'string' && path.isAbsolute(r) && existsSync(r) ? [path.resolve(r)] : [];
	return [...local, path.join(raiz, 'biblioteca/pack/arquivos')];
};
// Primeiro na pasta de .painel/pack.json, depois em biblioteca/pack/arquivos; sempre preso dentro da pasta.
const acharPack = (rel, raizes = raizesPack()) => {
	for (const base of raizes) {
		const f = dentro(base, rel);
		if (f && existsSync(f) && statSync(f).isFile()) return f;
	}
	return null;
};
const pack = () => {
	const cat = lerJson(path.join(raiz, 'biblioteca/pack/catalogo.json'), []);
	const itens = Array.isArray(cat) ? cat : Array.isArray(cat?.itens) ? cat.itens : [];
	const raizes = raizesPack();
	return itens.filter((i) => i && typeof i.arquivo === 'string').map((i) => ({...i, baixado: Boolean(acharPack(i.arquivo, raizes))}));
};

// ---------- Mídias e referências de cada vídeo ----------
// Mídias: public/projetos/<projeto>/ (o que o vídeo usa). Referências: public/projetos/<projeto>/referencias/ (arquivos) e
// src/projetos/<projeto>/referencias.md (links e observações, que vão para o git). Os arquivos de mídia não vão para o git.
const EXTENSOES = /\.(mp4|mov|m4v|webm|mkv|mp3|wav|m4a|aac|png|jpe?g|webp|gif|svg|pdf|txt|md|json|srt)$/i;
const projetoOk = (n) => typeof n === 'string' && /^[a-z0-9-]+$/.test(n) && existsSync(path.join(raiz, 'src/projetos', n));
const pastaMidia = (proj, tipo) => path.join(raiz, 'public/projetos', proj, tipo === 'referencias' ? 'referencias' : '');
const nomeArquivo = (n) => path.basename(String(n ?? '')).replace(/[^\w.\- ()]/g, '_').slice(0, 120);
const listarMidias = (proj, tipo) => {
	const dir = pastaMidia(proj, tipo);
	if (!existsSync(dir)) return [];
	return readdirSync(dir, {withFileTypes: true})
		.filter((d) => d.isFile() && EXTENSOES.test(d.name))
		.map((d) => ({nome: d.name, tamanho: statSync(path.join(dir, d.name)).size}))
		.sort((a, b) => a.nome.localeCompare(b.nome));
};
const arqNotas = (proj) => path.join(raiz, 'src/projetos', proj, 'referencias.md');
const resumoMidias = (proj) => {
	if (!projetoOk(proj)) return '';
	const lista = (t) => listarMidias(proj, t).map((m) => m.nome).join(', ') || '(nenhuma)';
	const notas = existsSync(arqNotas(proj)) ? readFileSync(arqNotas(proj), 'utf8').trim() : '';
	return `
Mídias do vídeo (public/projetos/${proj}/): ${lista('midias')}.
Referências (public/projetos/${proj}/referencias/): ${lista('referencias')}.
${notas ? `Links e observações do usuário sobre as referências:\n${notas}\n` : ''}Use as mídias listadas como material do vídeo (se o vídeo principal não se chamar video.mp4, ajuste "video" em edit.ts). As referências mostram o estilo que o
usuário quer: olhe as imagens e extraia quadros dos vídeos com ffmpeg para ver, e copie o jeito de editar (ritmo, tipografia, efeitos), sem copiar o conteúdo.`;
};

// ---------- Tarefas (prévia, final, transcrever, link, pack, pod...) ----------
const tarefas = criarTarefas({raiz, estado, cfg, projetoOk, pastaMidia, temaOk: (id) => temaOk(id), pastaModelos: (id) => pastaModelos(id)});

// ---------- Projetos novos, prompts e pastas ----------
const arqPrompts = path.join(raiz, 'biblioteca/prompts.json');
const criarProjeto = ({nome, tema, formato}) => {
	const id = slug(nome ?? '');
	if (!id || id.length > 60) throw Object.assign(new Error('Nome do projeto inválido'), {codigo: 400});
	if (existsSync(path.join(raiz, 'src/projetos', id))) throw Object.assign(new Error('Já existe um projeto com esse nome'), {codigo: 400});
	const vertical = (formato ?? cfg.prefs().formatoPadrao) === 'vertical';
	execFileSync(process.execPath, [path.join(raiz, 'scripts/novo.mjs'), id, ...(vertical ? ['--vertical'] : [])], {cwd: raiz, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']});
	const idTema = nomeValido(tema) && tema && existsSync(path.join(dirTemas, tema, 'tema.json')) ? tema : 'aleatorios';
	const arqTema = path.join(dirTemas, idTema, 'tema.json');
	const t = ler(arqTema, {nome: idTema, descricao: '', projetos: []});
	t.projetos = [...new Set([...(t.projetos ?? []), id])];
	mkdirSync(path.dirname(arqTema), {recursive: true});
	writeFileSync(arqTema, JSON.stringify(t, null, 1));
	return {nome: id, tema: idTema, formato: vertical ? 'vertical' : 'horizontal'};
};
const abrirPasta = (dir) => {
	mkdirSync(dir, {recursive: true});
	const [cmd, ...a] = ehWin ? ['explorer.exe'] : process.platform === 'darwin' ? ['open'] : ['xdg-open'];
	spawn(cmd, [...a, dir], {stdio: 'ignore', detached: true}).on('error', () => {}).unref();
};

// ---------- Temas ----------
const dirTemas = path.join(raiz, 'biblioteca/temas');
// Vídeos modelo de cada tema: o vídeo fica só neste PC (biblioteca/temas/<tema>/modelos/, fora do git) e a análise
// que o Claude escreve (<nome>.md, ao lado) vai para o git e serve de base de estilo e roteiro para o tema.
const VIDEO = /\.(mp4|mov|m4v|webm|mkv)$/i;
const temaOk = (id) => typeof id === 'string' && /^[a-z0-9-]+$/.test(id) && existsSync(path.join(dirTemas, id, 'tema.json'));
const pastaModelos = (id) => path.join(dirTemas, id, 'modelos');
const listarModelos = (id) => {
	const dir = pastaModelos(id);
	if (!existsSync(dir)) return [];
	const arqs = readdirSync(dir);
	const videos = arqs.filter((f) => VIDEO.test(f));
	// Análises cujo vídeo não está neste PC também aparecem (vieram de outro computador pelo git).
	const soAnalise = arqs.filter((f) => f.endsWith('.md') && !videos.some((v) => v.replace(VIDEO, '') === f.slice(0, -3)));
	return [
		...videos.map((f) => ({nome: f, tamanho: statSync(path.join(dir, f)).size, video: true, analise: arqs.includes(f.replace(VIDEO, '.md')) ? `biblioteca/temas/${id}/modelos/${f.replace(VIDEO, '.md')}` : null})),
		...soAnalise.map((f) => ({nome: f.slice(0, -3), tamanho: 0, video: false, analise: `biblioteca/temas/${id}/modelos/${f}`})),
	].sort((a, b) => a.nome.localeCompare(b.nome));
};
const temas = () => {
	const formatos = Object.fromEntries(biblioteca().templates.map((t) => [t.nome, t.formato]));
	const lista = existsSync(dirTemas)
		? readdirSync(dirTemas, {withFileTypes: true}).filter((d) => d.isDirectory() && existsSync(path.join(dirTemas, d.name, 'tema.json'))).map((d) => {
				const t = ler(path.join(dirTemas, d.name, 'tema.json'), {});
				const ap = path.join(dirTemas, d.name, 'aprendizado.md');
				const regras = existsSync(ap) ? readFileSync(ap, 'utf8').split('\n').filter((l) => l.startsWith('- ')).length : 0;
				return {id: d.name, nome: t.nome ?? d.name, descricao: t.descricao ?? '', regras, modelos: listarModelos(d.name).length, projetos: (t.projetos ?? []).filter((n) => n in formatos).map((n) => ({nome: n, formato: formatos[n]}))};
			})
		: [];
	const usados = new Set(lista.flatMap((t) => t.projetos.map((p) => p.nome)));
	const semTema = Object.keys(formatos).filter((n) => !usados.has(n)).map((n) => ({nome: n, formato: formatos[n]}));
	return {temas: lista, semTema};
};
const slug = (n) => String(n).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const projetos = () => {
	const dir = path.join(raiz, 'src/projetos');
	const saidas = existsSync(path.join(raiz, 'out')) ? readdirSync(path.join(raiz, 'out')).filter((f) => f.endsWith('.mp4')) : [];
	return readdirSync(dir, {withFileTypes: true})
		.filter((d) => d.isDirectory())
		.map((d) => ({
			nome: d.name,
			videos: saidas
				.filter((f) => f.startsWith(d.name))
				.map((f) => ({arquivo: f, data: statSync(path.join(raiz, 'out', f)).mtimeMs}))
				.sort((a, b) => b.data - a.data),
		}));
};

// ---------- Chat com o Claude Code ----------
const instrucao = (projeto, tema, primeira) => {
	const t = tema || 'aleatorios';
	return `PAINEL DE EDIÇÃO do canal Mateus Dias. O usuário pede em texto e você edita. Projeto: "${projeto || 'nenhum (npm run novo se for vídeo novo)'}". Tema: "${t}".${primeira ? resumoMidias(projeto) : ''}
ECONOMIA DE LIMITE (prioridade máxima, sem baixar a qualidade da edição):
- Responda em português, em no máximo 3 linhas; nada de narrar o que vai fazer nem repetir o que já disse. Sem código para o usuário: diga o que mudou e como ver (prévia ou Studio).
- Nunca releia arquivo já lido nesta conversa. Arquivo grande (transcrição, edit.ts, JSON): Grep ou Read com offset/limit, nunca inteiro sem necessidade. Junte comandos independentes numa só chamada.
- Não use subagentes. Não gere stills, prévias nem conferências que o pedido não exige; rode a conferência (npm run conferir) uma vez, antes da prévia.
- Vídeo vertical (Reels/Shorts/TikTok): use também a skill .claude/skills/it-reelsmaker (corte por áudio, câmera virtual, legenda por palavra, recorte, rostos, master −14 LUFS, checklist). O SKILL.md dela é GRANDE: nunca leia inteiro. Veja os títulos com Grep "^## " e leia só a seção do passo atual (offset/limit); scripts em .claude/skills/it-reelsmaker/scripts (use references/scripts.md só para achar o comando certo). A composição continua nas peças do painel.
- Reutilize antes de criar: procure em src/pecas, src/pecas/tres, src/projetos, public/sfx, public/fontes e biblioteca/itens (Grep por nome). Elemento novo reaproveitável: em src/pecas (ou src/pecas/tres) com comentário de 1 a 3 linhas no topo e item em biblioteca/itens/<nome>.json {"nome","tipo","descricao","arquivo","exemplo"}.
${primeira ? `- Primeiro pedido desta conversa: leia .claude/skills/editar-video/SKILL.md, CLAUDE.md e biblioteca/temas/${t}/aprendizado.md (regras já aprendidas; siga-as). Só se for criar um vídeo novo ou refazer o estilo, leia também biblioteca/temas/${t}/modelos/*.md e use os projetos de tema.json como base; em ajuste pontual, NÃO leia os modelos. Projeto novo entra em "projetos" do tema.json. Tema inexistente: crie a pasta com tema.json e aprendizado.md.` : '- Esta conversa já tem as regras da skill e do tema carregadas; não releia.'}
- Quando o usuário aprovar, reprovar ou corrigir algo, acrescente em biblioteca/temas/${t}/aprendizado.md uma linha "- AAAA-MM-DD (projeto): lição" (só o que vale para os próximos vídeos do tema; o que vale para todos vai na skill).
- Não faça render final sem o usuário aprovar; prévia pode. O painel tem botões de prévia e render final com barra de progresso (PC ou pod): ao terminar uma edição, sugira gerar a prévia por ele.
${textoPrefs(cfg.prefs())}`;
};

const LIMITE_TURNOS = 12;
const rodando = new Map();
const chat = async (req, res) => {
	const {projeto, pedido, tema} = await corpo(req);
	if (!nomeValido(projeto) || !nomeValido(tema) || typeof pedido !== 'string' || !pedido.trim()) return json(res, {erro: 'Pedido inválido'}, 400);
	res.writeHead(200, {'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache', connection: 'keep-alive'});
	let falhou = false;
	const enviar = (tipo, dados) => {
		if (tipo === 'texto') historico.anotar(chave, 'ia', dados.texto);
		if (tipo === 'acao') historico.anotar(chave, 'acao', dados.acao);
		if (tipo === 'erro') {
			falhou = true;
			historico.anotar(chave, 'erro', dados.texto);
		}
		if (tipo === 'fim') {
			if (dados.erro) falhou = true;
			historico.custo(chave, dados.custo);
		}
		if (!res.writableEnded) res.write(`data: ${JSON.stringify({tipo, ...dados})}\n\n`);
	};
	const chave = projeto || '_geral';
	rodando.get(chave)?.kill();
	historico.anotar(chave, 'eu', pedido);
	const arqInstrucao = path.join(estado, 'instrucao.txt');
	const primeira = !sessoes[chave] || (sessoes[chave + '#n'] ?? 0) >= LIMITE_TURNOS;
	writeFileSync(arqInstrucao, instrucao(projeto, tema, primeira));
	// Só as ferramentas necessárias, sem MCP, sem plugins/skills da conta e sem seções dinâmicas: menos tokens por pedido.
	const args = ['-p', '--output-format', 'stream-json', '--verbose', '--permission-mode', 'acceptEdits', '--tools', 'Bash,Read,Write,Edit,Glob,Grep', '--allowedTools', 'Bash,Read,Write,Edit,Glob,Grep', '--strict-mcp-config', '--disable-slash-commands', '--setting-sources', 'project,local', '--exclude-dynamic-system-prompt-sections', '--append-system-prompt-file', `"${arqInstrucao}"`];
	// Conversa muito longa custa mais a cada pedido: depois de LIMITE_TURNOS recomeça limpa (o estado está nos arquivos do projeto).
	if (!primeira && /^[\w-]+$/.test(sessoes[chave])) args.push('--resume', sessoes[chave]);
	else sessoes[chave + '#n'] = 0;
	sessoes[chave + '#n'] = (sessoes[chave + '#n'] ?? 0) + 1;
	const c = cfg.config();
	let modelo = c.modelo;
	let esforco = c.esforco;
	if (modelo === 'auto') {
		// Automático: modelo e esforço pelo tipo do pedido, e subagentes liberados para dividir as etapas.
		const e = escolherModelo(pedido, {projetoNovo: !projeto});
		({modelo, esforco} = e);
		enviar('acao', {acao: `Modelo automático: ${modelo} · esforço ${{low: 'baixo', medium: 'médio', high: 'alto'}[esforco]} (${e.motivo})`});
	}
	if (modelo && /^[a-z0-9][\w.-]{0,60}$/i.test(modelo)) args.push('--model', modelo);
	if (['low', 'medium', 'high'].includes(esforco)) args.push('--effort', esforco);
	const proc = rodar('claude', ehWin ? args : args.map((a) => a.replace(/^"|"$/g, '')), {stdio: ['pipe', 'pipe', 'pipe']});
	proc.stdin.on('error', () => {});
	proc.stdin.end(pedido);
	rodando.set(chave, proc);
	let resto = '';
	proc.stdout.on('data', (d) => {
		resto += d;
		const linhas = resto.split('\n');
		resto = linhas.pop();
		for (const l of linhas) {
			if (!l.trim()) continue;
			let ev;
			try { ev = JSON.parse(l); } catch { continue; }
			if (ev.session_id && ev.type === 'system') {
				sessoes[chave] = ev.session_id;
				writeFileSync(arqSessoes, JSON.stringify(sessoes));
			}
			if (ev.type === 'assistant') {
				for (const b of ev.message?.content ?? []) {
					if (b.type === 'text') enviar('texto', {texto: b.text});
					if (b.type === 'tool_use') {
						const alvo = b.input?.command ? `: ${String(b.input.command).slice(0, 90)}` : b.input?.file_path ? `: ${String(b.input.file_path).replace(raiz + '/', '')}` : '';
						enviar('acao', {acao: `${b.name}${alvo}`});
					}
				}
			}
			if (ev.type === 'result') enviar('fim', {erro: ev.is_error, custo: ev.total_cost_usd});
		}
	});
	let erro = '';
	proc.stderr.on('data', (d) => (erro += d));
	proc.on('error', () => {
		enviar('erro', {texto: 'Claude Code não encontrado. Use o botão "Instalar automaticamente" no topo da conversa.'});
		res.end();
	});
	proc.on('close', async (c) => {
		if (rodando.get(chave) === proc) rodando.delete(chave);
		if (c) enviar('erro', {texto: erro.trim().slice(-400) || `Terminou com código ${c}`});
		// Salvar sozinho: commit e push depois de cada pedido que terminou sem erro.
		if (!c && !falhou && !parado && cfg.prefs().salvarSozinho) {
			try {
				const saida = await salvarGit(`Painel${projeto ? ` (${projeto})` : ''}: ${pedido.trim().split('\n')[0].slice(0, 120)}`);
				enviar('acao', {acao: `Salvo no git: ${saida.trim().split('\n').at(-1) || 'ok'}`});
			} catch (e) {
				enviar('erro', {texto: `Não consegui salvar no git: ${String(e.stderr || e.message).slice(-300)}`});
			}
		}
		res.end();
	});
	let parado = false;
	res.on('close', () => {
		if (proc.exitCode === null) {
			parado = true;
			proc.kill();
		}
	});
};

// ---------- Remotion Studio ----------
let studio = null;
const iniciarStudio = () => {
	if (studio) return;
	studio = rodar('npx', ['remotion', 'studio', '--port=3000', '--no-open'], {stdio: 'ignore'});
	studio.on('close', () => (studio = null));
};
process.on('exit', () => {
	studio?.kill();
	for (const pr of rodando.values()) pr.kill();
	tarefas.encerrarTudo();
	historico.gravarTudo();
});
// Ctrl+C e fechar a janela passam pelo 'exit' acima (encerra renders e grava o histórico).
// Antes de sair, salva na nuvem. No Windows, fechar a janela dá só alguns segundos: o commit (rápido) fica feito e,
// se o envio não terminar a tempo, ele vai na próxima vez que o painel abrir.
let fechando = false;
for (const s of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(s, async () => {
	if (fechando) return process.exit(0);
	fechando = true;
	gitSeparado = true;
	if (cfg.prefs().salvarAoFechar) console.log('\nSalvando na nuvem antes de fechar...');
	await salvarAoFechar(s === 'SIGHUP' ? 8000 : 30000);
	process.exit(0);
});

// O Studio roda no navegador, então abre num Chrome/Edge próprio (perfil separado em .painel/chrome) com a GPU forçada:
// rasterização e composição na placa de vídeo, ignorando a lista de bloqueio, e ANGLE no Direct3D/Metal. Sem isso o
// navegador pode cair no desenho por CPU. Se não achar Chrome ou Edge, abre o navegador padrão.
const acharNavegador = () => {
	const pf = [process.env.ProgramFiles, process.env['ProgramFiles(x86)'], process.env.LOCALAPPDATA].filter(Boolean);
	const candidatos = ehWin
		? pf.flatMap((b) => [`${b}\\Google\\Chrome\\Application\\chrome.exe`, `${b}\\Microsoft\\Edge\\Application\\msedge.exe`])
		: process.platform === 'darwin'
			? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge']
			: ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/microsoft-edge'];
	return candidatos.find((c) => existsSync(c));
};
const abrirNoNavegador = (endereco, gpu = false) => {
	const exe = gpu ? acharNavegador() : null;
	if (exe) {
		const flags = ['--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--enable-zero-copy', '--disable-software-rasterizer', '--no-first-run', `--user-data-dir=${path.join(estado, 'chrome')}`];
		if (ehWin) flags.push('--use-angle=d3d11');
		else if (process.platform === 'darwin') flags.push('--use-angle=metal');
		spawn(exe, [...flags, endereco], {stdio: 'ignore', detached: true}).on('error', () => {}).unref();
		return;
	}
	const [cmd, ...a] = process.platform === 'darwin' ? ['open'] : ehWin ? ['cmd', '/c', 'start', ''] : ['xdg-open'];
	spawn(cmd, [...a, endereco], {stdio: 'ignore', detached: true}).on('error', () => {}).unref();
};
const esperarPorta = async (porta, ms = 40000) => {
	const {connect} = await import('node:net');
	const fim = Date.now() + ms;
	while (Date.now() < fim) {
		if (await new Promise((ok) => { const c = connect(porta, '127.0.0.1'); c.on('connect', () => { c.destroy(); ok(true); }); c.on('error', () => ok(false)); })) return true;
		await new Promise((r) => setTimeout(r, 400));
	}
	return false;
};

// ---------- HTTP ----------
const tipos = {'.wav': 'audio/wav', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.mkv': 'video/x-matroska', '.ogg': 'audio/ogg', '.flac': 'audio/flac', '.aac': 'audio/aac', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm', '.m4v': 'video/mp4', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.pdf': 'application/pdf'};
const arquivo = (req, res, f) => {
	if (!existsSync(f) || !statSync(f).isFile()) {
		res.writeHead(404);
		return res.end();
	}
	const tam = statSync(f).size;
	const tipo = tipos[path.extname(f).toLowerCase()] ?? 'application/octet-stream';
	const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range ?? '');
	if (m) {
		const ini = m[1] ? Number(m[1]) : 0;
		const fim = m[2] ? Number(m[2]) : tam - 1;
		res.writeHead(206, {'content-type': tipo, 'content-range': `bytes ${ini}-${fim}/${tam}`, 'accept-ranges': 'bytes', 'content-length': fim - ini + 1});
		return createReadStream(f, {start: ini, end: fim}).pipe(res);
	}
	res.writeHead(200, {'content-type': tipo, 'content-length': tam, 'accept-ranges': 'bytes'});
	createReadStream(f).pipe(res);
};

let ultimoPedido = 0;
const hostsOk = new Set([`localhost:${porta}`, `127.0.0.1:${porta}`]);
const tokenOk = (t) => {
	const a = Buffer.from(String(t ?? ''));
	const b = Buffer.from(token);
	return a.length === b.length && timingSafeEqual(a, b);
};

createServer(async (req, res) => {
	// Bloqueia DNS rebinding e páginas de outros sites.
	if (!hostsOk.has(req.headers.host ?? '')) { res.writeHead(403); return res.end(); }
	if (req.headers.origin && !hostsOk.has(new URL(req.headers.origin).host)) { res.writeHead(403); return res.end(); }

	const url = new URL(req.url, 'http://x');
	const p = url.pathname;
	try {
		if (!['/api/', '/out/', '/sfx/', '/fontes/', '/midia/', '/pack/', '/tema-modelo/'].some((x) => p.startsWith(x))) {
			const rel = p === '/' ? 'index.html' : p.slice(1);
			const base = path.join(import.meta.dirname, 'web');
			const f = path.join(base, rel);
			if (!f.startsWith(base)) { res.writeHead(403); return res.end(); }
			return arquivo(req, res, f);
		}
		const t = req.headers['x-painel-token'] ?? url.searchParams.get('t');
		if (!tokenOk(t)) return json(res, {erro: 'Token inválido. Abra o endereço impresso no terminal.'}, 401);
		if (p === '/api/fechou' && req.method === 'POST') {
			// A aba do painel fechou. Espera um pouco: se a página voltar (recarregar, outra aba aberta), não salva.
			const quando = Date.now();
			ultimoPedido = quando;
			setTimeout(() => { if (ultimoPedido === quando && !rodando.size) salvarAoFechar(); }, 10000);
			res.writeHead(204);
			return res.end();
		}
		ultimoPedido = Date.now();

		if (p === '/api/biblioteca') return json(res, biblioteca());
		if (p === '/api/projetos' && req.method === 'POST') return json(res, criarProjeto(await corpo(req)));
		if (p === '/api/projetos') return json(res, projetos());
		if (p === '/api/config' && req.method === 'POST') {
			cfg.salvar(await corpo(req));
			return json(res, {prefs: cfg.prefs(), config: cfg.config()});
		}
		if (p === '/api/config') return json(res, {prefs: cfg.prefs(), config: cfg.config()});
		if (p === '/api/tarefas' && req.method === 'POST') {
			const {tipo, projeto, opcoes} = await corpo(req);
			try {
				return json(res, {id: tarefas.criar(tipo, projeto, opcoes ?? {})});
			} catch (e) {
				return json(res, {erro: e.message}, 400);
			}
		}
		if (p === '/api/tarefas') return json(res, tarefas.listar());
		if (p === '/api/tarefas/cancelar' && req.method === 'POST') {
			const {id} = await corpo(req);
			return tarefas.cancelar(String(id ?? '')) ? json(res, {ok: true}) : json(res, {erro: 'Tarefa não encontrada ou já terminada'}, 400);
		}
		if (p === '/api/pod/testar' && req.method === 'POST') {
			try {
				return json(res, await testarPod(cfg.config().pod));
			} catch (e) {
				return json(res, {ok: false, texto: e.message});
			}
		}
		if (p === '/api/fluxo') {
			const proj = url.searchParams.get('projeto');
			if (proj && !nomeValido(proj)) return json(res, {erro: 'Projeto inválido'}, 400);
			return json(res, fluxo({raiz, projeto: proj, projetoOk, tarefas}));
		}
		if (p === '/api/historico') {
			const proj = url.searchParams.get('projeto') || '';
			if (!nomeValido(proj)) return json(res, {erro: 'Projeto inválido'}, 400);
			return json(res, historico.ler(proj || '_geral'));
		}
		if (p === '/api/prompts' && req.method === 'POST') {
			const lista = await corpo(req);
			if (!Array.isArray(lista) || lista.length > 200) return json(res, {erro: 'Lista de atalhos inválida'}, 400);
			const limpos = lista
				.filter((x) => x && typeof x.titulo === 'string' && typeof x.texto === 'string' && x.titulo.trim() && x.texto.trim())
				.map((x) => ({titulo: x.titulo.trim().slice(0, 80), texto: x.texto.trim().slice(0, 6000)}));
			writeFileSync(arqPrompts, JSON.stringify(limpos, null, 1) + '\n');
			return json(res, limpos);
		}
		if (p === '/api/prompts') return json(res, lerJson(arqPrompts, []));
		if (p === '/api/abrir-pasta' && req.method === 'POST') {
			const {projeto, onde} = await corpo(req);
			if (onde !== 'saida' && !projetoOk(projeto)) return json(res, {erro: 'Projeto inválido'}, 400);
			const dir = {midias: () => pastaMidia(projeto, 'midias'), referencias: () => pastaMidia(projeto, 'referencias'), saida: () => path.join(raiz, 'out'), projeto: () => path.join(raiz, 'src/projetos', projeto)}[onde];
			if (!dir) return json(res, {erro: 'Pasta inválida'}, 400);
			abrirPasta(dir());
			return json(res, {ok: true});
		}
		if (p === '/api/tema-modelos') {
			const tema = url.searchParams.get('tema');
			if (!temaOk(tema)) return json(res, {erro: 'Tema inválido'}, 400);
			return json(res, listarModelos(tema));
		}
		if (p === '/api/tema-modelo' && req.method === 'POST') {
			// Vídeo modelo do tema: corpo = arquivo cru, como nas mídias.
			const tema = url.searchParams.get('tema'), nome = nomeArquivo(url.searchParams.get('nome'));
			if (!temaOk(tema) || !VIDEO.test(nome)) return json(res, {erro: 'Envie um vídeo (mp4, mov, m4v, webm ou mkv)'}, 400);
			const dir = pastaModelos(tema);
			mkdirSync(dir, {recursive: true});
			const tmp = path.join(dir, `.${nome}.parte`);
			try {
				await pipeline(req, createWriteStream(tmp));
				renameSync(tmp, path.join(dir, nome));
			} catch (e) {
				rmSync(tmp, {force: true});
				throw e;
			}
			return json(res, {ok: true, nome});
		}
		if (p === '/api/tema-modelo/apagar' && req.method === 'POST') {
			const {tema, nome} = await corpo(req);
			if (!temaOk(tema)) return json(res, {erro: 'Tema inválido'}, 400);
			const n = nomeArquivo(nome);
			const base = n.replace(VIDEO, '').replace(/\.md$/, '');
			for (const f of [n, `${base}.md`]) if (f) rmSync(path.join(pastaModelos(tema), f), {force: true});
			return json(res, {ok: true});
		}
		if (p === '/api/midias') {
			const proj = url.searchParams.get('projeto');
			if (!projetoOk(proj)) return json(res, {erro: 'Projeto inválido'}, 400);
			return json(res, {midias: listarMidias(proj, 'midias'), referencias: listarMidias(proj, 'referencias'), notas: existsSync(arqNotas(proj)) ? readFileSync(arqNotas(proj), 'utf8') : ''});
		}
		if (p === '/api/midia' && req.method === 'POST') {
			// Corpo = o arquivo cru, gravado direto no disco (vídeos grandes não passam pela memória).
			const proj = url.searchParams.get('projeto'), tipo = url.searchParams.get('tipo'), nome = nomeArquivo(url.searchParams.get('nome'));
			if (!projetoOk(proj) || !['midias', 'referencias'].includes(tipo) || !EXTENSOES.test(nome)) return json(res, {erro: 'Arquivo ou projeto inválido (tipos aceitos: vídeo, áudio, imagem, pdf, texto)'}, 400);
			const dir = pastaMidia(proj, tipo);
			mkdirSync(dir, {recursive: true});
			const tmp = path.join(dir, `.${nome}.parte`);
			try {
				await pipeline(req, createWriteStream(tmp));
				renameSync(tmp, path.join(dir, nome));
			} catch (e) {
				rmSync(tmp, {force: true});
				throw e;
			}
			return json(res, {ok: true, nome});
		}
		if (p === '/api/midia/apagar' && req.method === 'POST') {
			const {projeto, tipo, nome} = await corpo(req);
			if (!projetoOk(projeto) || !['midias', 'referencias'].includes(tipo)) return json(res, {erro: 'Inválido'}, 400);
			rmSync(path.join(pastaMidia(projeto, tipo), nomeArquivo(nome)), {force: true});
			return json(res, {ok: true});
		}
		if (p === '/api/notas' && req.method === 'POST') {
			const {projeto, texto} = await corpo(req);
			if (!projetoOk(projeto)) return json(res, {erro: 'Projeto inválido'}, 400);
			writeFileSync(arqNotas(projeto), String(texto ?? '').slice(0, 20000));
			return json(res, {ok: true});
		}
		if (p === '/api/temas' && req.method === 'GET') return json(res, temas());
		if (p === '/api/temas' && req.method === 'POST') {
			const {nome, descricao} = await corpo(req);
			const id = slug(nome ?? '');
			if (!id || existsSync(path.join(dirTemas, id))) return json(res, {erro: id ? 'Esse tema já existe' : 'Nome inválido'}, 400);
			mkdirSync(path.join(dirTemas, id), {recursive: true});
			writeFileSync(path.join(dirTemas, id, 'tema.json'), JSON.stringify({nome: String(nome).trim().slice(0, 60), descricao: String(descricao ?? '').slice(0, 300), projetos: []}, null, 1));
			writeFileSync(path.join(dirTemas, id, 'aprendizado.md'), `# Aprendizado: ${String(nome).trim()}\n\nRegras aprendidas nos vídeos deste tema. O Claude lê isto antes de editar e acrescenta uma linha datada quando o usuário aprova ou corrige algo.\n\n`);
			return json(res, {id});
		}
		if (p === '/api/claude') {
			const instalado = await testar('claude', ['--version']);
			if (!instalado) return json(res, {instalado, logado: false});
			// Lê o status para mostrar qual conta está conectada (o e-mail, se o Claude informar).
			const st = await new Promise((fim) => {
				let saida = '';
				const pr = rodar('claude', ['auth', 'status'], {stdio: ['ignore', 'pipe', 'pipe']});
				pr.stdout.on('data', (d) => (saida += d));
				pr.stderr.on('data', (d) => (saida += d));
				pr.on('error', () => fim({c: 1, saida}));
				pr.on('close', (c) => fim({c, saida}));
			});
			const email = st.saida.match(/[\w.+-]+@[\w-]+(\.[\w-]+)+/)?.[0] ?? null;
			return json(res, {instalado, logado: st.c === 0, email: st.c === 0 ? email : null});
		}
		if (p === '/api/claude/trocar' && req.method === 'POST') {
			// Sai da conta atual e abre o login no navegador para entrar com outra.
			await testar('claude', ['auth', 'logout']);
			rodar('claude', ['auth', 'login'], {stdio: 'ignore', detached: true}).on('error', () => {}).unref();
			return json(res, {ok: true});
		}
		if (p === '/api/claude/instalar' && req.method === 'POST') {
			const ok = await new Promise((fim) => {
				const pr = rodar('npm', ['i', '-g', '@anthropic-ai/claude-code'], {stdio: 'ignore'});
				pr.on('error', () => fim(false));
				pr.on('close', (c) => fim(c === 0));
			});
			return json(res, {ok, instalado: ok && (await testar('claude', ['--version']))});
		}
		if (p === '/api/claude/entrar' && req.method === 'POST') {
			// Abre o login no navegador; o painel confere o status até terminar.
			rodar('claude', ['auth', 'login'], {stdio: 'ignore', detached: true}).on('error', () => {}).unref();
			return json(res, {ok: true});
		}
		if (p === '/api/codigo') {
			// Só arquivos de texto da biblioteca, para o botão "ver".
			const rel = path.normalize(url.searchParams.get('f') ?? '');
			const ok = /^(src[\\/]pecas|src[\\/]projetos|scripts[\\/]blender|docs[\\/]referencias|biblioteca)[\\/]/.test(rel) && /\.(tsx?|py|md|json)$/.test(rel) && !rel.includes('..');
			if (!ok || !existsSync(path.join(raiz, rel))) return json(res, {erro: 'Arquivo não permitido'}, 400);
			return json(res, {texto: readFileSync(path.join(raiz, rel), 'utf8')});
		}
		if (p === '/api/chat' && req.method === 'POST') return chat(req, res);
		if (p === '/api/parar' && req.method === 'POST') {
			const {projeto} = await corpo(req);
			rodando.get(projeto || '_geral')?.kill();
			return json(res, {ok: true});
		}
		if (p === '/api/novo-chat' && req.method === 'POST') {
			const {projeto} = await corpo(req);
			if (!nomeValido(projeto)) return json(res, {erro: 'Projeto inválido'}, 400);
			delete sessoes[projeto || '_geral'];
			writeFileSync(arqSessoes, JSON.stringify(sessoes));
			historico.limpar(projeto || '_geral');
			return json(res, {ok: true});
		}
		if (p === '/api/studio' && req.method === 'POST') {
			const {rota} = await corpo(req);
			iniciarStudio();
			const pronto = await esperarPorta(3000);
			if (pronto) abrirNoNavegador(`http://localhost:3000/${/^[\w-]*$/.test(rota ?? '') ? (rota ?? '') : ''}`, true);
			return json(res, {ok: pronto});
		}
		if (p === '/api/reiniciar' && req.method === 'POST') {
			// Baixa a versão nova, reabre o arquivo de iniciar deste PC (que confere as dependências e abre o painel) e encerra este processo.
			// O pull acontece antes, para o .bat não ser reescrito enquanto roda.
			let saida = '';
			try { saida = git('pull', '--rebase', '--autostash'); } catch (e) { saida = String(e.stderr || e.message).slice(-300); }
			const [cmd, ...a] = ehWin ? ['cmd', '/c', 'start', '', 'Painel - Instalar e Abrir.bat'] : process.platform === 'darwin' ? ['open', 'Abrir Painel.command'] : ['bash', 'scripts/abrir-painel.sh'];
			spawn(cmd, a, {cwd: raiz, stdio: 'ignore', detached: true}).on('error', () => {}).unref();
			json(res, {ok: true, saida});
			setTimeout(() => process.exit(0), 700);
			return;
		}
		if (p === '/api/sync/atualizar' && req.method === 'POST') return json(res, {saida: git('pull', '--rebase', '--autostash')});
		if (p === '/api/sync/salvar' && req.method === 'POST') {
			const {mensagem} = await corpo(req);
			return json(res, {saida: await salvarGit(mensagem)});
		}
		if (p.startsWith('/out/')) return arquivo(req, res, path.join(raiz, 'out', path.basename(p)));
		if (p.startsWith('/midia/')) {
			const [, , proj, tipo, ...resto] = p.split('/');
			if (!projetoOk(proj) || !['midias', 'referencias'].includes(tipo)) { res.writeHead(404); return res.end(); }
			return arquivo(req, res, path.join(pastaMidia(proj, tipo), nomeArquivo(decodeURIComponent(resto.join('/')))));
		}
		if (p.startsWith('/tema-modelo/')) {
			const [, , tema, ...resto] = p.split('/');
			if (!temaOk(tema)) { res.writeHead(404); return res.end(); }
			return arquivo(req, res, path.join(pastaModelos(tema), nomeArquivo(decodeURIComponent(resto.join('/')))));
		}
		if (p.startsWith('/sfx/')) return arquivo(req, res, path.join(raiz, 'public/sfx', path.basename(p)));
		if (p.startsWith('/fontes/')) return arquivo(req, res, path.join(raiz, 'public/fontes', path.basename(p)));
		if (p.startsWith('/pack/')) {
			let rel;
			try { rel = decodeURIComponent(p.slice('/pack/'.length)); } catch { rel = ''; }
			const f = rel && !rel.includes('\0') ? acharPack(rel) : null;
			if (!f) { res.writeHead(404); return res.end(); }
			return arquivo(req, res, f);
		}
		res.writeHead(404);
		res.end();
	} catch (e) {
		const msg = String(e.stderr || e.message || e);
		if (!res.headersSent) json(res, {erro: msg.slice(-600)}, e?.codigo ?? 500);
		else res.end();
	}
}).listen(porta, '127.0.0.1', () => {
	const endereco = `http://localhost:${porta}/#${token}`;
	console.log(`\nPainel de edição pronto: ${endereco}\n(não feche esta janela enquanto estiver editando)\n`);
	if (!process.env.SEM_NAVEGADOR) abrirNoNavegador(endereco);
	// Se da última vez a janela fechou antes de terminar o envio, envia agora.
	if (cfg.prefs().salvarAoFechar) gitAsync('rev-list', '--count', '@{u}..HEAD').then((n) => { if (Number(n.trim()) > 0) salvarAoFechar(); }).catch(() => {});
});
