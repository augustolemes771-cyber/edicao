// Tarefas do painel com progresso: prévia, render final (no PC ou no pod), transcrever, roteiro, conferir, baixar vídeo
// de um link (yt-dlp), importar pack e preparar o pod. Renders rodam um por vez (fila); as outras rodam na hora.
// As últimas 30 ficam em .painel/tarefas.json.
import {spawnSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {chmodSync, createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {ehWin, executar, lerJson, matar} from './comum.mjs';
import {pararNoPod, prepararPod, renderNoPod, validarPod} from './pod.mjs';

export const TIPOS = ['previa', 'final', 'transcrever', 'roteiro', 'conferir', 'previas', 'link', 'pack', 'preparar-pod'];
const RENDERS = ['previa', 'final'];
const PUBLICOS = ['id', 'tipo', 'projeto', 'estado', 'fase', 'pct', 'eta', 'onde', 'saida', 'aviso', 'erro', 'log', 'inicio', 'fim', 'opcoes', 'retomada'];

// URL de link: http(s), sem espaço, sem começar com '-' (não vira opção do yt-dlp).
export const urlOk = (u) => {
	if (typeof u !== 'string' || u.length > 2000 || u.startsWith('-') || /\s/.test(u)) return false;
	try {
		return ['http:', 'https:'].includes(new URL(u).protocol);
	} catch {
		return false;
	}
};

export const criarTarefas = ({raiz, estado, cfg, projetoOk, pastaMidia, temaOk, pastaModelos}) => {
	const arq = path.join(estado, 'tarefas.json');
	// Tarefa que estava na fila ou rodando quando o painel fechou volta sozinha (mais abaixo, depois de criar()),
	// mantendo a porcentagem que já tinha. As sem opções gravadas (versão antiga) viram erro.
	const salvas = lerJson(arq, []);
	const interrompidas = salvas.filter((t) => ['fila', 'rodando'].includes(t.estado) && t.opcoes && t.tipo !== 'preparar-pod').reverse();
	const lista = salvas
		.filter((t) => !interrompidas.includes(t))
		.map((t) => (['fila', 'rodando'].includes(t.estado) ? {...t, estado: 'erro', erro: 'O painel foi fechado durante a tarefa.', fim: t.fim ?? Date.now()} : t));
	const internos = new Map();
	let salvarDepois = null;
	const salvar = (agora = false) => {
		const gravar = () => {
			salvarDepois = null;
			try {
				writeFileSync(arq, JSON.stringify(lista.slice(0, 30).map(publico)));
			} catch {}
		};
		if (agora) {
			clearTimeout(salvarDepois);
			return gravar();
		}
		salvarDepois ??= setTimeout(gravar, 1500);
	};
	const publico = (t) => Object.fromEntries(PUBLICOS.map((k) => [k, t[k] ?? null]));

	const atualizador = (t) => (o) => {
		if (o.log !== undefined) {
			t.log.push(String(o.log).slice(0, 400));
			if (t.log.length > 40) t.log.splice(0, t.log.length - 40);
		}
		// Na mesma fase a barra só anda para frente (o progresso do Remotion às vezes oscila).
		const mesmaFase = o.fase === undefined || o.fase === t.fase;
		if (o.fase !== undefined) t.fase = o.fase;
		if (o.pct !== undefined) {
			const pct = o.pct === null ? null : Math.max(0, Math.min(100, Math.round(o.pct * 10) / 10));
			// Tarefa retomada depois de reiniciar: a barra não volta atrás; fica no % anterior até o trabalho passar dele.
			const piso = t.retomada?.pct ?? 0;
			if (t.retomada && pct !== null && pct > piso) t.retomada = null;
			const final = t.retomada && pct !== null ? Math.max(pct, piso) : pct;
			if (!(mesmaFase && final !== null && t.pct !== null && final < t.pct)) t.pct = final;
		}
		if (o.eta !== undefined) t.eta = o.eta;
		if (o.aviso !== undefined) t.aviso = t.aviso ? `${t.aviso}\n${o.aviso}` : o.aviso;
		salvar();
	};

	// Roda um processo e lê as linhas JSON do render-job.mjs (também usado pelo importador de pack).
	const linhaJson = (t, at) => (l) => {
		let ev;
		try {
			ev = JSON.parse(l);
		} catch {
			return at({log: l});
		}
		if (ev.fase) at({fase: ev.fase, pct: ev.pct ?? null, eta: ev.eta ?? null});
		if (ev.texto) at({log: ev.texto});
		if (ev.aviso) at({aviso: ev.aviso});
		if (ev.erro) t.erroProc = ev.erro;
		if (ev.fim) t.saida = ev.saida ?? null;
	};
	const rodarProc = async (t, cmd, args, opcoes = {}) => {
		const at = atualizador(t);
		let ultimasErro = [];
		const codigo = await executar(cmd, args, {
			cwd: raiz,
			aoProc: (p) => t.procs.add(p),
			aoSaida: opcoes.aoSaida ?? ((l) => at({log: l})),
			aoErro: (l) => {
				ultimasErro = [...ultimasErro, l].slice(-8);
				at({log: l});
			},
			...opcoes,
		});
		if (t.cancelado) throw new Error('Cancelado');
		if (t.erroProc) throw new Error(t.erroProc);
		if (codigo !== 0) throw new Error(ultimasErro.join('\n').slice(-600) || `Terminou com código ${codigo}`);
	};

	// ---------- Cada tipo ----------
	const temFfmpeg = () => spawnSync('ffmpeg', ['-version'], {stdio: 'ignore'}).status === 0;

	const render = async (t) => {
		const c = cfg.config();
		const {res, de, ate} = t.opcoes;
		const hw = c.gpuCodificador !== false;
		if (t.onde === 'pod') {
			try {
				t.saida = await renderNoPod({t, raiz, estado, podCfg: c.pod, projeto: t.projeto, tipo: t.tipo, res, de, ate, hw, atualizar: atualizador(t)});
				return;
			} catch (e) {
				// Envio lento demais: em vez de esperar horas, renderiza neste PC.
				if (!e?.lento) throw e;
				t.onde = 'pc';
				atualizador(t)({aviso: `${e.message}. Renderizando neste PC (o pod só compensa com mídia menor ou já enviada).`, fase: 'renderizando neste PC', pct: 0});
			}
		}
		const args = [path.join(raiz, 'scripts/render-job.mjs'), '--projeto', t.projeto, '--tipo', t.tipo, '--res', String(res)];
		if (de !== undefined) args.push('--de', String(de));
		if (ate !== undefined) args.push('--ate', String(ate));
		const env = {...process.env};
		if (c.navegadorRender) env.BROWSER = c.navegadorRender;
		if (!hw) env.HW = '0';
		await rodarProc(t, process.execPath, args, {env, aoSaida: linhaJson(t, atualizador(t))});
		if (!t.saida) throw new Error('O render terminou sem gerar o vídeo');
	};

	// tsx carregado pelo próprio node: não precisa de npx nem de shell no Windows.
	const script = async (t) => {
		atualizador(t)({fase: {transcrever: 'transcrevendo', roteiro: 'gerando o roteiro', conferir: 'conferindo', previas: 'gerando imagens da edição'}[t.tipo], pct: null});
		const args = t.tipo === 'transcrever' ? [path.join(raiz, 'scripts/transcrever.mjs'), t.projeto] : ['--import', 'tsx', path.join(raiz, `scripts/${t.tipo}.ts`), t.projeto];
		await rodarProc(t, process.execPath, args, t.tipo === 'transcrever' ? {aoSaida: linhaJson(t, atualizador(t))} : {});
		if (t.tipo === 'roteiro') t.saida = `docs/${t.projeto}/transcript-lines.txt`;
		if (t.tipo === 'previas') t.saida = `out/previas/${t.projeto}/manifest.json`;
		if (t.tipo === 'transcrever') t.saida = `src/projetos/${t.projeto}/transcricao.json`;
	};

	// yt-dlp: do PATH ou baixado do GitHub oficial para .painel/bin na primeira vez.
	const ytdlp = async (t) => {
		if (spawnSync('yt-dlp', ['--version'], {stdio: 'ignore'}).status === 0) return 'yt-dlp';
		const nome = ehWin ? 'yt-dlp.exe' : process.platform === 'darwin' ? 'yt-dlp_macos' : 'yt-dlp_linux';
		const local = path.join(estado, 'bin', ehWin ? 'yt-dlp.exe' : 'yt-dlp');
		if (existsSync(local)) return local;
		mkdirSync(path.dirname(local), {recursive: true});
		const at = atualizador(t);
		at({fase: 'baixando o yt-dlp (só na primeira vez)', pct: 0});
		const r = await fetch(`https://github.com/yt-dlp/yt-dlp/releases/latest/download/${nome}`, {signal: t.abortar.signal});
		if (!r.ok) throw new Error(`Não consegui baixar o yt-dlp (HTTP ${r.status})`);
		const total = Number(r.headers.get('content-length')) || 0;
		let recebidos = 0;
		const parte = `${local}.parte`;
		try {
			await pipeline(
				Readable.fromWeb(r.body),
				async function* (fonte) {
					for await (const c of fonte) {
						recebidos += c.length;
						if (total) at({pct: (recebidos / total) * 100});
						yield c;
					}
				},
				createWriteStream(parte),
			);
		} catch (e) {
			rmSync(parte, {force: true});
			throw e;
		}
		chmodSync(parte, 0o755);
		renameSync(parte, local);
		return local;
	};

	const link = async (t) => {
		const {url, destino, tema} = t.opcoes;
		const exe = await ytdlp(t);
		const dir = destino === 'tema' ? pastaModelos(tema) : pastaMidia(t.projeto, destino);
		mkdirSync(dir, {recursive: true});
		const at = atualizador(t);
		const ffmpeg = temFfmpeg();
		let partes = ffmpeg ? 2 : 1;
		let parte = 0;
		// O caminho final vai para um arquivo (--print deixaria o yt-dlp quieto e sem as linhas de Destination).
		const arqSaida = path.join(estado, `yt-dlp-${t.id}.txt`);
		at({fase: 'baixando o vídeo', pct: 0, eta: null});
		const args = [
			'--newline', '--progress', '--no-playlist', '--restrict-filenames', '--no-mtime', '--no-part',
			'--print-to-file', 'after_move:filepath', arqSaida.replaceAll('%', '%%'),
			'-P', dir, '-o', '%(title).60B-%(id)s.%(ext)s',
			...(ffmpeg ? ['-f', 'bv*[height<=1080]+ba/b', '--merge-output-format', 'mp4'] : ['-f', 'b[ext=mp4]/b']),
			'--', url,
		];
		const lerSaida = () => {
			const f = existsSync(arqSaida) ? readFileSync(arqSaida, 'utf8').trim().split(/\r?\n/).at(-1) : null;
			rmSync(arqSaida, {force: true});
			return f;
		};
		await rodarProc(t, exe, args, {
			aoSaida: (l) => {
				if (/^\[download\] Destination:/.test(l)) parte++;
				const fmt = /Downloading \d+ format\(s\): (\S+)/.exec(l);
				if (fmt) partes = fmt[1].includes('+') ? 2 : 1;
				const m = /^\[download\]\s+([\d.]+)%(?:.*?ETA\s+(\d+):(\d+)(?::(\d+))?)?/.exec(l);
				if (m) {
					const p = Number(m[1]);
					const eta = m[2] ? (m[4] ? Number(m[2]) * 3600 + Number(m[3]) * 60 + Number(m[4]) : Number(m[2]) * 60 + Number(m[3])) : null;
					// Vídeo e áudio separados: a primeira parte vai até 85%, a segunda até 97%.
					const pct = partes === 1 ? p * 0.97 : parte <= 1 ? p * 0.85 : 85 + p * 0.12;
					return at({fase: partes === 2 && parte >= 2 ? 'baixando o áudio' : 'baixando o vídeo', pct, eta});
				}
				if (/^\[Merger\]/.test(l)) return at({fase: 'juntando vídeo e áudio', pct: 98, eta: null});
				at({log: l});
			},
		}).catch((e) => {
			lerSaida();
			throw e;
		});
		const arquivo = lerSaida();
		if (!arquivo || !existsSync(arquivo)) throw new Error('O yt-dlp terminou sem salvar o vídeo');
		t.saida = path.relative(raiz, arquivo).split(path.sep).join('/');
		if (!ffmpeg) at({aviso: 'ffmpeg não encontrado: baixei o melhor arquivo único (pode vir com qualidade menor).'});
	};

	const pack = async (t) => {
		const f = path.join(raiz, 'scripts/importar-pack.mjs');
		if (!existsSync(f)) throw new Error('O importador de pack ainda não está instalado (scripts/importar-pack.mjs).');
		atualizador(t)({fase: 'importando o pack', pct: 0});
		const {url, noLugar, pasta, soFaltando} = t.opcoes;
		const args = [f, ...(url ? [url] : []), ...(noLugar ? ['--no-lugar'] : []), ...(pasta ? ['--pasta', pasta] : []), ...(soFaltando ? ['--so-faltando'] : [])];
		await rodarProc(t, process.execPath, args, {aoSaida: linhaJson(t, atualizador(t))});
	};

	const executores = {
		previa: render,
		final: render,
		transcrever: script,
		roteiro: script,
		conferir: script,
		previas: script,
		link,
		pack,
		'preparar-pod': (t) => prepararPod({t, raiz, podCfg: cfg.config().pod, atualizar: atualizador(t)}),
	};

	// ---------- Fila ----------
	const rodarTarefa = async (t) => {
		t.estado = 'rodando';
		t.inicio = Date.now();
		salvar(true);
		try {
			await executores[t.tipo](t);
			if (t.cancelado) throw new Error('Cancelado');
			t.estado = 'ok';
			t.pct = 100;
			t.fase = 'pronto';
		} catch (e) {
			t.estado = t.cancelado ? 'cancelado' : 'erro';
			if (!t.cancelado) t.erro = String(e?.message ?? e).slice(-1200);
		}
		t.eta = null;
		t.fim = Date.now();
		t.procs.clear();
		salvar(true);
		if (RENDERS.includes(t.tipo)) proximo();
	};
	let renderAtual = null;
	const proximo = () => {
		renderAtual = null;
		const t = [...lista].reverse().find((x) => x.estado === 'fila' && RENDERS.includes(x.tipo));
		if (!t) return;
		renderAtual = t;
		rodarTarefa(t);
	};

	// Valida as opções e cria a tarefa. Lança Error com mensagem em português se algo estiver errado.
	const criar = (tipo, projeto, opcoes = {}) => {
		if (!TIPOS.includes(tipo)) throw new Error('Tipo de tarefa inválido');
		// Link para um vídeo modelo de tema não precisa de projeto.
		const precisaProjeto = !['pack', 'preparar-pod'].includes(tipo) && !(tipo === 'link' && opcoes.destino === 'tema');
		if (precisaProjeto && !projetoOk(projeto)) throw new Error('Escolha um projeto válido');
		const o = {};
		if (RENDERS.includes(tipo)) {
			const res = Number(opcoes.res ?? cfg.prefs().resPrevia);
			if (![540, 720, 1080].includes(res)) throw new Error('Resolução: 540, 720 ou 1080');
			o.res = res;
			for (const k of ['de', 'ate']) {
				if (opcoes[k] === undefined || opcoes[k] === null || opcoes[k] === '') continue;
				const n = Number(opcoes[k]);
				if (!Number.isFinite(n) || n < 0 || n > 36000) throw new Error('Trecho inválido (de / até em segundos)');
				o[k] = Math.round(n * 1000) / 1000;
			}
			if (o.de !== undefined && o.ate !== undefined && o.ate <= o.de) throw new Error('O fim do trecho precisa vir depois do começo');
		}
		if (tipo === 'link') {
			if (!urlOk(opcoes.url)) throw new Error('Link inválido (use um endereço http ou https)');
			o.url = opcoes.url;
			o.destino = ['midias', 'tema'].includes(opcoes.destino) ? opcoes.destino : 'referencias';
			if (o.destino === 'tema') {
				if (!temaOk(opcoes.tema)) throw new Error('Tema inválido');
				o.tema = opcoes.tema;
			}
		}
		if (tipo === 'pack') {
			// Caminhos deste PC: completos, existentes e sem começar com '-'. Vão como argumentos do node, sem shell.
			const caminho = (c, pasta) => {
				const v = String(c ?? '').trim();
				return v && !v.startsWith('-') && path.isAbsolute(v) && existsSync(v) && (pasta === undefined || statSync(v).isDirectory() === pasta) ? path.resolve(v) : null;
			};
			o.soFaltando = Boolean(opcoes.soFaltando);
			if (opcoes.noLugar) {
				o.url = caminho(opcoes.caminho, true);
				if (!o.url) throw new Error('Pasta do pack inválida (caminho completo de uma pasta deste PC)');
				o.noLugar = true;
			} else if (opcoes.url) {
				const u = String(opcoes.url).trim();
				o.url = urlOk(u) ? u : caminho(u, /\.zip$/i.test(u) ? false : true);
				if (!o.url) throw new Error('Informe o link do Google Drive, o caminho completo de um .zip ou de uma pasta');
				if (opcoes.pasta) {
					if (!urlOk(u)) throw new Error('A pasta de destino só vale junto com o link do Drive');
					o.pasta = caminho(opcoes.pasta, true);
					if (!o.pasta) throw new Error('Pasta do pack inválida (caminho completo de uma pasta deste PC)');
				}
			} else if (!o.soFaltando) throw new Error('Informe o link do Google Drive, um .zip ou uma pasta');
		}
		if (tipo === 'preparar-pod' || (RENDERS.includes(tipo) && (opcoes.pod ?? cfg.config().pod.ativo))) {
			// Valida já, para o erro aparecer na hora (host, usuário, pasta, chave).
			validarPod(cfg.config().pod);
		}
		const t = {
			id: Date.now().toString(36) + randomBytes(3).toString('hex'),
			tipo,
			projeto: precisaProjeto ? projeto : projetoOk(projeto) ? projeto : null,
			opcoes: o,
			estado: 'fila',
			fase: 'na fila',
			pct: tipo === 'roteiro' || tipo === 'conferir' || tipo === 'previas' ? null : 0,
			eta: null,
			onde: tipo === 'preparar-pod' || (RENDERS.includes(tipo) && (opcoes.pod ?? cfg.config().pod.ativo)) ? 'pod' : 'pc',
			saida: null,
			aviso: null,
			erro: null,
			log: [],
			inicio: null,
			fim: null,
		};
		Object.defineProperties(t, {procs: {value: new Set()}, abortar: {value: new AbortController()}, cancelado: {value: false, writable: true}, erroProc: {value: null, writable: true}});
		lista.unshift(t);
		if (lista.length > 30) {
			// Nunca descarta tarefa em andamento.
			for (let i = lista.length - 1; i >= 0 && lista.length > 30; i--) if (!['fila', 'rodando'].includes(lista[i].estado)) lista.splice(i, 1);
		}
		internos.set(t.id, t);
		if (!RENDERS.includes(tipo)) rodarTarefa(t);
		else if (!renderAtual) proximo();
		salvar(true);
		return t.id;
	};

	const cancelar = (id) => {
		const t = lista.find((x) => x.id === id);
		if (!t) return false;
		if (t.estado === 'fila') {
			t.estado = 'cancelado';
			t.fim = Date.now();
			salvar(true);
			return true;
		}
		if (t.estado !== 'rodando' || !t.procs) return false;
		t.cancelado = true;
		t.abortar.abort();
		for (const p of t.procs) matar(p);
		if (t.onde === 'pod' && RENDERS.includes(t.tipo)) pararNoPod(cfg.config().pod);
		return true;
	};

	const encerrarTudo = () => {
		for (const t of lista) if (t.procs) for (const p of t.procs) matar(p);
		salvar(true);
	};

	// Retoma o que estava em andamento (ordem original). O trabalho já feito (pacote, mídias enviadas ao pod) é reaproveitado
	// pelas próprias etapas; o resto recomeça, mas a barra continua do % em que parou.
	for (const t of interrompidas) {
		try {
			const id = criar(t.tipo, t.projeto, t.opcoes);
			const nova = internos.get(id);
			if (nova && t.pct) {
				nova.retomada = {pct: t.pct, fase: t.fase};
				nova.pct = t.pct;
				nova.aviso = `Retomada depois de reiniciar o painel (estava em ${Math.round(t.pct)}%).`;
			}
		} catch (e) {
			lista.push({...t, estado: 'erro', erro: `Não consegui retomar: ${e.message}`, fim: Date.now()});
		}
	}
	salvar(true);

	return {
		criar,
		cancelar,
		encerrarTudo,
		listar: () => lista.map(publico),
		ultima: (tipo, projeto) => lista.find((t) => t.tipo === tipo && t.projeto === projeto && ['ok', 'erro'].includes(t.estado)) ?? null,
	};
};
