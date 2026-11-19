// Terminal embutido: roda o Claude Code (o mesmo `claude` do cmd) num pseudo-terminal e o mostra no painel por WebSocket.
// Uma sessão por vídeo. Ela continua viva se a página recarregar: ao reconectar, a tela anterior é reenviada.
// A conexão passa pelas mesmas travas do resto do painel (Host, Origin e token), porque quem conversa com este
// terminal executa comandos neste computador.
import * as pty from '@lydell/node-pty';
import {WebSocketServer} from 'ws';

const ehWin = process.platform === 'win32';
const LIMITE_TELA = 300_000; // caracteres guardados para reenviar ao reconectar

export const criarTerminal = ({raiz, nomeValido, hostsOk, tokenOk, cookieOk}) => {
	/** @type {Map<string, {proc: import('@lydell/node-pty').IPty, tela: string, clientes: Set<import('ws').WebSocket>}>} */
	const sessoes = new Map();
	const wss = new WebSocketServer({noServer: true, maxPayload: 2 * 1024 * 1024});

	// Só texto fixo e o nome do vídeo ([a-z0-9-]) vão para a linha de comando.
	const inicio = (projeto) =>
		`Vamos editar o video ${projeto}. Rode node scripts/contexto.mjs ${projeto}, leia o que ele imprime e espere o meu pedido; responda so: pronto.`;

	const abrir = (projeto, cols, rows) => {
		const [cmd, args] = ehWin ? ['cmd.exe', ['/c', 'claude', inicio(projeto)]] : ['claude', [inicio(projeto)]];
		const proc = pty.spawn(cmd, args, {
			name: 'xterm-256color',
			cols,
			rows,
			cwd: raiz,
			env: {...process.env, TERM: 'xterm-256color', COLORTERM: 'truecolor', BASH_DEFAULT_TIMEOUT_MS: '1800000', BASH_MAX_TIMEOUT_MS: '3600000'},
		});
		const s = {proc, tela: '', clientes: new Set()};
		const enviar = (o) => {
			const txt = JSON.stringify(o);
			for (const c of s.clientes) if (c.readyState === 1) c.send(txt);
		};
		proc.onData((d) => {
			s.tela = (s.tela + d).slice(-LIMITE_TELA);
			enviar({t: 'o', d});
		});
		proc.onExit(({exitCode}) => {
			if (sessoes.get(projeto) === s) sessoes.delete(projeto);
			enviar({t: 'x', codigo: exitCode});
		});
		sessoes.set(projeto, s);
		return s;
	};

	const limitar = (n, min, max, padrao) => (Number.isFinite(n) ? Math.max(min, Math.min(max, Math.floor(n))) : padrao);

	// Chamado pelo servidor HTTP no evento 'upgrade'.
	const aoUpgrade = (req, socket, head) => {
		const recusar = (codigo) => {
			socket.write(`HTTP/1.1 ${codigo}\r\nConnection: close\r\n\r\n`);
			socket.destroy();
		};
		const url = new URL(req.url, 'http://x');
		if (url.pathname !== '/api/terminal') return recusar('404 Not Found');
		// Mesmas travas do HTTP: Host e Origin do próprio painel e o token (cookie ou ?t=).
		if (!hostsOk.has(req.headers.host ?? '')) return recusar('403 Forbidden');
		const origem = req.headers.origin;
		if (origem && !hostsOk.has(URL.canParse(origem) ? new URL(origem).host : '')) return recusar('403 Forbidden');
		if (!cookieOk(req) && !tokenOk(url.searchParams.get('t'))) return recusar('401 Unauthorized');
		const projeto = url.searchParams.get('projeto');
		if (!nomeValido(projeto) || !projeto) return recusar('400 Bad Request');
		const cols = limitar(Number(url.searchParams.get('cols')), 20, 500, 100);
		const rows = limitar(Number(url.searchParams.get('rows')), 5, 200, 30);

		wss.handleUpgrade(req, socket, head, (ws) => {
			let s = sessoes.get(projeto);
			try {
				if (!s) s = abrir(projeto, cols, rows);
			} catch (e) {
				ws.send(JSON.stringify({t: 'e', msg: `Não consegui abrir o Claude Code: ${e.message}`}));
				return ws.close();
			}
			s.clientes.add(ws);
			// Reconectou: reenvia o que já estava na tela e ajusta o tamanho para esta janela.
			if (s.tela) ws.send(JSON.stringify({t: 'o', d: s.tela}));
			try { s.proc.resize(cols, rows); } catch {}
			ws.on('message', (dados) => {
				let m;
				try { m = JSON.parse(dados.toString()); } catch { return; }
				if (m.t === 'i' && typeof m.d === 'string') s.proc.write(m.d);
				else if (m.t === 'r') {
					try { s.proc.resize(limitar(m.cols, 20, 500, 100), limitar(m.rows, 5, 200, 30)); } catch {}
				}
			});
			ws.on('close', () => s.clientes.delete(ws));
		});
	};

	const encerrar = (projeto) => {
		const s = sessoes.get(projeto);
		if (!s) return false;
		sessoes.delete(projeto);
		for (const c of s.clientes) c.close();
		try { s.proc.kill(); } catch {}
		return true;
	};
	const encerrarTodos = () => [...sessoes.keys()].forEach(encerrar);
	process.on('exit', encerrarTodos);

	return {aoUpgrade, encerrar, ativo: (projeto) => sessoes.has(projeto)};
};
