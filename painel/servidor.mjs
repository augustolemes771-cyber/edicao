// Painel de edição: servidor local sem dependências. Uso: npm run painel
// Recebe o pedido em texto, chama o Claude Code (a conta que estiver logada neste computador) dentro do projeto e
// mostra a biblioteca, as prévias e o Remotion Studio. A biblioteca e os projetos vivem no git: qualquer PC igual.
//
// Segurança: o painel executa o Claude Code com acesso ao projeto, então só aceita conexões de 127.0.0.1, exige um
// token aleatório (gerado a cada início e impresso no terminal) e recusa Host/Origin que não sejam o próprio painel.
// Assim nenhum site aberto no navegador consegue mandar pedidos para ele.
import {createServer} from 'node:http';
import {spawn, execFileSync} from 'node:child_process';
import {randomBytes, timingSafeEqual} from 'node:crypto';
import {createReadStream, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync} from 'node:fs';
import path from 'node:path';

const raiz = path.resolve(import.meta.dirname, '..');
const porta = Number(process.env.PORTA ?? 4000);
const token = randomBytes(24).toString('hex');
const estado = path.join(raiz, '.painel');
mkdirSync(estado, {recursive: true});
const arqSessoes = path.join(estado, 'sessoes.json');
const ler = (f, padrao) => (existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : padrao);
const sessoes = ler(arqSessoes, {});

const json = (res, dados, codigo = 200) => {
	res.writeHead(codigo, {'content-type': 'application/json; charset=utf-8'});
	res.end(JSON.stringify(dados));
};
const corpo = (req) =>
	new Promise((ok) => {
		let t = '';
		req.on('data', (c) => (t += c));
		req.on('end', () => ok(t ? JSON.parse(t) : {}));
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
	return {pecas, modelos3d, blender, templates, sfx, fontes, referencias, salvos};
};

// ---------- Temas ----------
const dirTemas = path.join(raiz, 'biblioteca/temas');
const temas = () => {
	const formatos = Object.fromEntries(biblioteca().templates.map((t) => [t.nome, t.formato]));
	const lista = existsSync(dirTemas)
		? readdirSync(dirTemas, {withFileTypes: true}).filter((d) => d.isDirectory() && existsSync(path.join(dirTemas, d.name, 'tema.json'))).map((d) => {
				const t = ler(path.join(dirTemas, d.name, 'tema.json'), {});
				const ap = path.join(dirTemas, d.name, 'aprendizado.md');
				const regras = existsSync(ap) ? readFileSync(ap, 'utf8').split('\n').filter((l) => l.startsWith('- ')).length : 0;
				return {id: d.name, nome: t.nome ?? d.name, descricao: t.descricao ?? '', regras, projetos: (t.projetos ?? []).filter((n) => n in formatos).map((n) => ({nome: n, formato: formatos[n]}))};
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
const instrucao = (projeto, tema) => `Você está dentro do PAINEL DE EDIÇÃO do canal Mateus Dias. O usuário pede em texto e você edita.
Projeto atual: "${projeto || 'nenhum (crie um com npm run novo se o pedido for um vídeo novo)'}".
Tema do vídeo: "${tema || 'aleatorios'}". ANTES de editar, leia biblioteca/temas/${tema || 'aleatorios'}/tema.json e aprendizado.md: são as regras aprendidas nos
vídeos anteriores deste tema; siga-as e use os projetos listados em tema.json como base. Se criar um projeto novo, acrescente o nome dele em "projetos" do tema.json.
Ao terminar uma edição, ou quando o usuário aprovar, reprovar ou corrigir algo, acrescente em aprendizado.md uma linha "- AAAA-MM-DD (projeto): lição" só com o que vale
para os próximos vídeos deste tema (o que vale para todos os temas vai em .claude/skills/editar-video/SKILL.md). Se o tema não existir, crie a pasta com tema.json e aprendizado.md.
Siga .claude/skills/editar-video/SKILL.md e o CLAUDE.md. Antes de criar algo, procure na biblioteca (src/pecas, src/pecas/tres, src/projetos,
public/sfx, public/fontes, biblioteca/itens) e REUTILIZE. Se criar um elemento novo reaproveitável (peça, modelo 3D, template, efeito), coloque-o
em src/pecas (ou src/pecas/tres) com um comentário de 1 a 3 linhas no topo dizendo o que é, e registre um item em biblioteca/itens/<nome>.json
com {"nome","tipo","descricao","arquivo","exemplo"}. Responda em português, curto. Não faça render final sem o usuário aprovar; prévia pode.
O usuário não é programador: não mostre código, diga o que mudou e como ver (prévia ou Studio).`;

const rodando = new Map();
const chat = async (req, res) => {
	const {projeto, pedido, tema} = await corpo(req);
	if (!nomeValido(projeto) || !nomeValido(tema) || typeof pedido !== 'string' || !pedido.trim()) return json(res, {erro: 'Pedido inválido'}, 400);
	res.writeHead(200, {'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache', connection: 'keep-alive'});
	const enviar = (tipo, dados) => res.write(`data: ${JSON.stringify({tipo, ...dados})}\n\n`);
	const chave = projeto || '_geral';
	rodando.get(chave)?.kill();
	const arqInstrucao = path.join(estado, 'instrucao.txt');
	writeFileSync(arqInstrucao, instrucao(projeto, tema));
	const args = ['-p', '--output-format', 'stream-json', '--verbose', '--permission-mode', 'acceptEdits', '--allowedTools', 'Bash,Read,Write,Edit,Glob,Grep', '--append-system-prompt-file', `"${arqInstrucao}"`];
	if (sessoes[chave] && /^[\w-]+$/.test(sessoes[chave])) args.push('--resume', sessoes[chave]);
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
	proc.on('close', (c) => {
		if (rodando.get(chave) === proc) rodando.delete(chave);
		if (c) enviar('erro', {texto: erro.trim().slice(-400) || `Terminou com código ${c}`});
		res.end();
	});
	res.on('close', () => proc.kill());
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
const tipos = {'.wav': 'audio/wav', '.woff2': 'font/woff2', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.mp4': 'video/mp4'};
const arquivo = (req, res, f) => {
	if (!existsSync(f) || !statSync(f).isFile()) {
		res.writeHead(404);
		return res.end();
	}
	const tam = statSync(f).size;
	const tipo = tipos[path.extname(f)] ?? 'application/octet-stream';
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
		if (!['/api/', '/out/', '/sfx/', '/fontes/'].some((x) => p.startsWith(x))) {
			const rel = p === '/' ? 'index.html' : p.slice(1);
			const base = path.join(import.meta.dirname, 'web');
			const f = path.join(base, rel);
			if (!f.startsWith(base)) { res.writeHead(403); return res.end(); }
			return arquivo(req, res, f);
		}
		const t = req.headers['x-painel-token'] ?? url.searchParams.get('t');
		if (!tokenOk(t)) return json(res, {erro: 'Token inválido. Abra o endereço impresso no terminal.'}, 401);

		if (p === '/api/biblioteca') return json(res, biblioteca());
		if (p === '/api/projetos') return json(res, projetos());
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
			return json(res, {instalado, logado: instalado && (await testar('claude', ['auth', 'status']))});
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
			delete sessoes[projeto || '_geral'];
			writeFileSync(arqSessoes, JSON.stringify(sessoes));
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
			git('add', '-A');
			if (!git('status', '--porcelain').trim()) return json(res, {saida: 'Nada novo para salvar.'});
			git('commit', '-m', String(mensagem || 'Edição pelo painel').slice(0, 200));
			return json(res, {saida: git('push')});
		}
		if (p.startsWith('/out/')) return arquivo(req, res, path.join(raiz, 'out', path.basename(p)));
		if (p.startsWith('/sfx/')) return arquivo(req, res, path.join(raiz, 'public/sfx', path.basename(p)));
		if (p.startsWith('/fontes/')) return arquivo(req, res, path.join(raiz, 'public/fontes', path.basename(p)));
		res.writeHead(404);
		res.end();
	} catch (e) {
		const msg = String(e.stderr || e.message || e);
		if (!res.headersSent) json(res, {erro: msg.slice(-600)}, 500);
		else res.end();
	}
}).listen(porta, '127.0.0.1', () => {
	const endereco = `http://localhost:${porta}/#${token}`;
	console.log(`\nPainel de edição pronto: ${endereco}\n(não feche esta janela enquanto estiver editando)\n`);
	if (!process.env.SEM_NAVEGADOR) abrirNoNavegador(endereco);
});
