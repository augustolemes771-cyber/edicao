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
const instrucao = (projeto) => `Você está dentro do PAINEL DE EDIÇÃO do canal Mateus Dias. O usuário pede em texto e você edita.
Projeto atual: "${projeto || 'nenhum (crie um com npm run novo se o pedido for um vídeo novo)'}".
Siga .claude/skills/editar-video/SKILL.md e o CLAUDE.md. Antes de criar algo, procure na biblioteca (src/pecas, src/pecas/tres, src/projetos,
public/sfx, public/fontes, biblioteca/itens) e REUTILIZE. Se criar um elemento novo reaproveitável (peça, modelo 3D, template, efeito), coloque-o
em src/pecas (ou src/pecas/tres) com um comentário de 1 a 3 linhas no topo dizendo o que é, e registre um item em biblioteca/itens/<nome>.json
com {"nome","tipo","descricao","arquivo","exemplo"}. Responda em português, curto. Não faça render final sem o usuário aprovar; prévia pode.
O usuário não é programador: não mostre código, diga o que mudou e como ver (prévia ou Studio).`;

const rodando = new Map();
const chat = async (req, res) => {
	const {projeto, pedido} = await corpo(req);
	if (!nomeValido(projeto) || typeof pedido !== 'string' || !pedido.trim()) return json(res, {erro: 'Pedido inválido'}, 400);
	res.writeHead(200, {'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache', connection: 'keep-alive'});
	const enviar = (tipo, dados) => res.write(`data: ${JSON.stringify({tipo, ...dados})}\n\n`);
	const chave = projeto || '_geral';
	rodando.get(chave)?.kill();
	const args = ['-p', pedido, '--output-format', 'stream-json', '--verbose', '--permission-mode', 'acceptEdits', '--allowedTools', 'Bash,Read,Write,Edit,Glob,Grep', '--append-system-prompt', instrucao(projeto)];
	if (sessoes[chave]) args.push('--resume', sessoes[chave]);
	const proc = spawn('claude', args, {cwd: raiz, env: process.env, stdio: ['ignore', 'pipe', 'pipe']});
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
		enviar('erro', {texto: 'Claude Code não encontrado. Instale com: npm i -g @anthropic-ai/claude-code e rode "claude" uma vez para entrar na sua conta.'});
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
	studio = spawn('npx', ['remotion', 'studio', '--port=3000', '--no-open'], {cwd: raiz, stdio: 'ignore'});
	studio.on('close', () => (studio = null));
};
process.on('exit', () => studio?.kill());

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
			iniciarStudio();
			return json(res, {url: 'http://localhost:3000'});
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
	if (!process.env.SEM_NAVEGADOR) {
		const [cmd, ...a] = process.platform === 'darwin' ? ['open'] : process.platform === 'win32' ? ['cmd', '/c', 'start', ''] : ['xdg-open'];
		spawn(cmd, [...a, endereco], {stdio: 'ignore', detached: true}).on('error', () => {}).unref();
	}
});
