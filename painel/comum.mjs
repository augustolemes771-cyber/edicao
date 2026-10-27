// Funções pequenas usadas pelos módulos do painel: ler JSON, rodar processos lendo linha a linha e encerrar processos.
import {spawn} from 'node:child_process';
import {existsSync, readFileSync, readdirSync, statSync} from 'node:fs';
import path from 'node:path';

export const ehWin = process.platform === 'win32';

export const lerJson = (f, padrao) => {
	try {
		return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : padrao;
	} catch {
		return padrao;
	}
};

// Chama cb para cada linha não vazia (aceita \n, \r\n e \r de barras de progresso).
export const linhas = (stream, cb) => {
	let resto = '';
	stream.setEncoding('utf8');
	stream.on('data', (d) => {
		resto += d;
		const v = resto.split(/\r\n|\n|\r/);
		resto = v.pop();
		for (const l of v) if (l.trim()) cb(l);
	});
	stream.on('end', () => {
		if (resto.trim()) cb(resto);
		resto = '';
	});
};

// Fora do Windows o processo ganha um grupo próprio, para encerrar junto os filhos (Chrome do render, npm...).
export const iniciar = (cmd, args, opcoes = {}) => spawn(cmd, args, {detached: !ehWin, windowsHide: true, ...opcoes});

export const matar = (proc) => {
	if (!proc || proc.exitCode !== null || proc.signalCode !== null || !proc.pid) return;
	if (ehWin) {
		spawn('taskkill', ['/pid', String(proc.pid), '/T', '/F'], {stdio: 'ignore', windowsHide: true}).on('error', () => {});
		return;
	}
	try {
		process.kill(-proc.pid, 'SIGTERM');
	} catch {
		proc.kill('SIGTERM');
	}
};

// Roda um comando e resolve com o código de saída. Nada passa por shell, a não ser que opcoes.shell venha true.
export const executar = (cmd, args, {entrada, aoSaida, aoErro, aoProc, ...opcoes} = {}) =>
	new Promise((ok, falha) => {
		const pr = iniciar(cmd, args, {stdio: ['pipe', 'pipe', 'pipe'], ...opcoes});
		aoProc?.(pr);
		pr.on('error', falha);
		linhas(pr.stdout, aoSaida ?? (() => {}));
		linhas(pr.stderr, aoErro ?? (() => {}));
		pr.stdin.on('error', () => {});
		if (entrada && typeof entrada.pipe === 'function') entrada.pipe(pr.stdin);
		else pr.stdin.end(entrada ?? '');
		pr.on('close', (c, sinal) => ok(c ?? (sinal ? -1 : 0)));
	});

// Lista arquivos de uma pasta (recursivo), com caminho relativo em barras normais.
export const arquivosEm = (dir, pular = () => false, base = dir) => {
	if (!existsSync(dir)) return [];
	const r = [];
	for (const d of readdirSync(dir, {withFileTypes: true})) {
		const f = path.join(dir, d.name);
		const rel = path.relative(base, f).split(path.sep).join('/');
		if (pular(rel, d)) continue;
		if (d.isDirectory()) r.push(...arquivosEm(f, pular, base));
		else if (d.isFile()) {
			const s = statSync(f);
			r.push({rel, tamanho: s.size, mtime: Math.round(s.mtimeMs)});
		}
	}
	return r;
};

// Caminho preso dentro de uma pasta: devolve null se tentar sair dela.
export const dentro = (base, rel) => {
	const f = path.resolve(base, rel);
	return f.startsWith(path.resolve(base) + path.sep) ? f : null;
};
