// Render no pod (RunPod ou qualquer Linux com SSH). Usa o ssh e o tar do sistema (Windows 10+, Mac e Linux já têm).
// Segurança: nada passa por shell local; no comando remoto só entram valores validados por regex, entre aspas simples.
// Passos: enviar o código, enviar só as mídias do projeto que mudaram, npm ci se faltar, render com as mesmas linhas
// JSON do scripts/render-job.mjs e baixar o resultado para out/.
import {spawn} from 'node:child_process';
import {createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync} from 'node:fs';
import os from 'node:os';
import {finished} from 'node:stream/promises';
import path from 'node:path';
import {arquivosEm, ehWin, executar, iniciar, lerJson} from './comum.mjs';

export const GLS = ['angle', 'angle-egl', 'egl', 'swangle', 'swiftshader', 'vulkan'];

// No Windows, prefere o ssh/tar do próprio sistema (o tar do Git Bash entende "C:" como outro computador).
const exe = (nome) => {
	if (ehWin) {
		const sis = path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32');
		const f = nome === 'ssh' ? path.join(sis, 'OpenSSH', 'ssh.exe') : path.join(sis, 'tar.exe');
		if (existsSync(f)) return f;
	}
	return nome;
};

export const validarPod = (pod = {}) => {
	const host = String(pod.host ?? '').trim();
	const usuario = String(pod.usuario ?? '').trim() || 'root';
	const porta = Number(pod.porta || 22);
	const pasta = String(pod.pasta ?? '').trim().replace(/\/+$/, '') || '/workspace/edicao';
	const gl = String(pod.gl || 'angle-egl');
	let chave = String(pod.chave ?? '').trim();
	if (!host) throw new Error('Preencha o endereço do pod nas configurações (o IP do "SSH over exposed TCP" do RunPod).');
	if (!/^[A-Za-z0-9][A-Za-z0-9.-]{0,252}$/.test(host)) throw new Error('Endereço do pod inválido. Use só o IP ou o nome, ex.: 194.68.245.12');
	if (!/^[A-Za-z_][A-Za-z0-9_.-]{0,63}$/.test(usuario)) throw new Error('Usuário do pod inválido (ex.: root)');
	if (!Number.isInteger(porta) || porta < 1 || porta > 65535) throw new Error('Porta do pod inválida');
	if (!/^\/[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*$/.test(pasta) || pasta.split('/').includes('..')) throw new Error('Pasta do pod inválida (ex.: /workspace/edicao)');
	if (!GLS.includes(gl)) throw new Error(`Modo de WebGL do pod inválido (use ${GLS.join(', ')})`);
	// Se o comando SSH inteiro foi colado no campo da chave, usa só o caminho depois de -i (ou a chave padrão do PC).
	if (/^ssh\s/.test(chave)) chave = /-i\s+("[^"]+"|\S+)/.exec(chave)?.[1]?.replace(/"/g, '') ?? '';
	if (chave) {
		if (chave.startsWith('~')) chave = path.join(os.homedir(), chave.slice(1));
		chave = path.resolve(chave);
		if (!existsSync(chave) || !statSync(chave).isFile()) throw new Error(`Chave SSH não encontrada: ${chave}`);
	}
	return {host, usuario, porta, pasta, gl, chave};
};

const sshArgs = (pod, comando) => [
	'-p', String(pod.porta),
	'-o', 'BatchMode=yes',
	'-o', 'StrictHostKeyChecking=accept-new',
	'-o', 'ConnectTimeout=15',
	'-o', 'ServerAliveInterval=20',
	...(pod.chave ? ['-i', pod.chave, '-o', 'IdentitiesOnly=yes'] : []),
	'--',
	`${pod.usuario}@${pod.host}`,
	comando,
];
const q = (s) => `'${s}'`;

// Explica os erros comuns do ssh em português.
const erroSsh = (codigo, stderr) => {
	const t = stderr.trim().split('\n').slice(-4).join('\n');
	if (/Permission denied/i.test(t)) return `O pod recusou a chave SSH. Confira o usuário e a chave nas configurações.\n${t}`;
	if (/Could not resolve|Name or service not known|nodename nor servname/i.test(t)) return `Endereço do pod não encontrado.\n${t}`;
	if (/timed out|Connection refused|No route/i.test(t)) return `Não conectou no pod (ligado? IP e porta do "SSH over exposed TCP"?).\n${t}`;
	return t || `ssh terminou com código ${codigo}`;
};
const semSsh = (e) => (e?.code === 'ENOENT' ? new Error('ssh não encontrado neste computador. No Windows: Configurações > Aplicativos > Recursos opcionais > Cliente OpenSSH.') : e);

// Comando remoto simples: devolve {codigo, saida, erro}.
export const sshRodar = async (pod, comando, {entrada, aoSaida, aoProc} = {}) => {
	let saida = '', erro = '';
	try {
		const codigo = await executar(exe('ssh'), sshArgs(pod, comando), {
			entrada,
			aoProc,
			aoSaida: (l) => {
				saida += l + '\n';
				aoSaida?.(l);
			},
			aoErro: (l) => (erro += l + '\n'),
		});
		return {codigo, saida, erro};
	} catch (e) {
		throw semSsh(e);
	}
};

export const testarPod = async (podCfg) => {
	const pod = validarPod(podCfg);
	const cmd = `echo "Conectado: $(hostname)"; ` +
		`(nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader 2>/dev/null | sed 's/^/GPU: /') || echo 'GPU: nenhuma placa NVIDIA'; ` +
		`echo "Node: $(node -v 2>/dev/null || echo 'não instalado (use Preparar pod)')"; ` +
		`echo "ffmpeg: $(ffmpeg -version 2>/dev/null | head -1 | cut -d' ' -f3 || true)"; ` +
		`[ -d ${q(pod.pasta)}/node_modules ] && echo 'Projeto: já enviado' || echo 'Projeto: ainda não enviado'`;
	const r = await sshRodar(pod, cmd);
	if (r.codigo !== 0 && !r.saida) return {ok: false, texto: erroSsh(r.codigo, r.erro)};
	return {ok: true, texto: r.saida.replace(/ffmpeg: \n/, 'ffmpeg: não instalado (use Preparar pod)\n').trim()};
};

// Envia arquivos locais (caminhos relativos à raiz) por tar | ssh, contando os bytes para o progresso.
const enviarTar = (t, pod, raiz, itens, total, aoPct, exclui = []) =>
	new Promise((ok, falha) => {
		const tar = iniciar(exe('tar'), ['-cf', '-', ...exclui.flatMap((x) => ['--exclude', x]), '--', ...itens], {cwd: raiz, env: {...process.env, COPYFILE_DISABLE: '1'}, stdio: ['ignore', 'pipe', 'pipe']});
		const ssh = iniciar(exe('ssh'), sshArgs(pod, `mkdir -p ${q(pod.pasta)} && tar -xf - -C ${q(pod.pasta)} --warning=no-unknown-keyword`), {stdio: ['pipe', 'ignore', 'pipe']});
		t.procs.add(tar);
		t.procs.add(ssh);
		let enviados = 0, erroTar = '', erroSshTxt = '', fechados = 0, codTar = 0, codSsh = 0;
		tar.stdout.on('data', (c) => {
			enviados += c.length;
			aoPct(Math.min(100, (enviados / Math.max(1, total)) * 100));
		});
		tar.stdout.pipe(ssh.stdin);
		ssh.stdin.on('error', () => {});
		tar.stderr.on('data', (d) => (erroTar += d));
		ssh.stderr.on('data', (d) => (erroSshTxt += d));
		tar.on('error', (e) => falha(e.code === 'ENOENT' ? new Error('tar não encontrado neste computador') : e));
		ssh.on('error', (e) => falha(semSsh(e)));
		const fechou = () => {
			if (++fechados < 2) return;
			if (codSsh !== 0) return falha(new Error(erroSsh(codSsh, erroSshTxt)));
			if (codTar !== 0) return falha(new Error(`tar falhou: ${erroTar.trim().slice(-300)}`));
			ok();
		};
		tar.on('close', (c) => {
			codTar = c ?? -1;
			fechou();
		});
		ssh.on('close', (c) => {
			codSsh = c ?? -1;
			fechou();
		});
	});

const CODIGO = ['src', 'scripts', 'public/sfx', 'public/fontes', 'biblioteca', 'package.json', 'package-lock.json', 'remotion.config.ts', 'tsconfig.json'];
// Mede a velocidade de envio do PC para o pod (4 MB), para decidir se vale enviar mídia grande. Devolve MB/s.
const medirEnvio = (t, pod) =>
	new Promise((ok) => {
		const ssh = iniciar(exe('ssh'), sshArgs(pod, 'cat > /dev/null'), {stdio: ['pipe', 'ignore', 'ignore']});
		t.procs.add(ssh);
		const bytes = 4 * 1024 * 1024;
		const ini = Date.now();
		ssh.stdin.on('error', () => {});
		ssh.stdin.end(Buffer.alloc(bytes, 7));
		ssh.on('close', () => ok(bytes / 1048576 / Math.max(0.2, (Date.now() - ini) / 1000)));
		ssh.on('error', () => ok(null));
	});

const FORA = ['biblioteca/pack/arquivos'];

export const renderNoPod = async ({t, raiz, estado, podCfg, projeto, tipo, res, de, ate, hw, atualizar}) => {
	const pod = validarPod(podCfg);
	const parar = () => {
		if (t.cancelado) throw new Error('Cancelado');
	};
	// Faixas da barra: código 0-4, mídias 4-20, dependências 20-23, render 23-95, download 95-100.
	const faixa = (a, b) => (pct) => atualizar({pct: a + (pct / 100) * (b - a)});

	// 1. Código.
	atualizar({fase: 'enviando o código para o pod', pct: 0});
	const itens = CODIGO.filter((f) => existsSync(path.join(raiz, f)));
	const total = itens.reduce((s, f) => s + (statSync(path.join(raiz, f)).isDirectory() ? arquivosEm(path.join(raiz, f), (rel) => f === 'biblioteca' && rel.startsWith('pack/arquivos')).reduce((a, x) => a + x.tamanho, 0) : statSync(path.join(raiz, f)).size), 0);
	await enviarTar(t, pod, raiz, itens, total, faixa(0, 4), FORA);
	parar();

	// 2. Mídias do projeto: só as que faltam no pod, têm outro tamanho lá ou mudaram aqui desde o último envio.
	atualizar({fase: 'conferindo as mídias no pod', pct: 4});
	const relProj = `public/projetos/${projeto}`;
	const locais = arquivosEm(path.join(raiz, relProj), (rel, d) => (d.isDirectory() && rel === 'referencias') || rel.endsWith('.parte'));
	if (locais.length) {
		const lista = await sshRodar(pod, `find ${q(`${pod.pasta}/${relProj}`)} -type f -printf '%s\\t%P\\n' 2>/dev/null; true`, {aoProc: (p) => t.procs.add(p)});
		if (lista.codigo !== 0) throw new Error(erroSsh(lista.codigo, lista.erro));
		const remotos = Object.fromEntries(lista.saida.split('\n').filter(Boolean).map((l) => l.split('\t')).map(([s, n]) => [n, Number(s)]));
		const arqManifesto = path.join(estado, 'pod-manifesto.json');
		const manifestos = lerJson(arqManifesto, {});
		const chave = `${pod.usuario}@${pod.host}:${pod.porta}${pod.pasta}`;
		const anterior = manifestos[chave]?.[projeto] ?? {};
		const mudou = locais.filter((m) => remotos[m.rel] !== m.tamanho || anterior[m.rel] !== `${m.tamanho}:${m.mtime}`);
		const totalMidia = mudou.reduce((s, m) => s + m.tamanho, 0);
		if (mudou.length && totalMidia > 30 * 1048576) {
			// Upload de casa costuma ser lento: se enviar levaria mais que o limite, avisa para renderizar neste PC.
			atualizar({fase: 'medindo a velocidade de envio', pct: 4});
			const mbs = await medirEnvio(t, pod);
			const minutos = mbs ? totalMidia / 1048576 / mbs / 60 : null;
			const limite = tipo === 'final' ? 20 : 3;
			if (minutos !== null && minutos > limite) {
				throw Object.assign(new Error(`Enviar ${Math.round(totalMidia / 1048576)} MB levaria cerca de ${Math.ceil(minutos)} min (${mbs.toFixed(2)} MB/s)`), {lento: true});
			}
		}
		if (mudou.length) {
			atualizar({fase: `enviando ${mudou.length} mídia(s) para o pod`});
			// Em lotes, para não estourar o limite da linha de comando do Windows.
			let feitos = 0;
			for (let i = 0; i < mudou.length; i += 100) {
				const lote = mudou.slice(i, i + 100);
				const tamLote = lote.reduce((s, m) => s + m.tamanho, 0);
				const base = feitos;
				await enviarTar(t, pod, raiz, lote.map((m) => `${relProj}/${m.rel}`), tamLote, (p) => faixa(4, 20)(((base + (p / 100) * tamLote) / Math.max(1, totalMidia)) * 100));
				feitos += tamLote;
				parar();
			}
		}
		manifestos[chave] = {...manifestos[chave], [projeto]: Object.fromEntries(locais.map((m) => [m.rel, `${m.tamanho}:${m.mtime}`]))};
		writeFileSync(arqManifesto, JSON.stringify(manifestos));
	}
	parar();

	// 3. Dependências: npm ci quando falta node_modules ou o package-lock mudou.
	atualizar({fase: 'instalando dependências no pod', pct: 20});
	const dep = await sshRodar(
		pod,
		`cd ${q(pod.pasta)} && { command -v node >/dev/null || { echo 'Node não está instalado no pod. Use "Preparar pod" nas configurações.' >&2; exit 3; }; } && ` +
			`{ cmp -s package-lock.json node_modules/.painel-lock || { npm ci --no-audit --no-fund --loglevel=error && cp package-lock.json node_modules/.painel-lock; }; }`,
		{aoProc: (p) => t.procs.add(p), aoSaida: (l) => atualizar({log: l})},
	);
	if (dep.codigo !== 0) throw new Error(dep.codigo === 255 ? erroSsh(dep.codigo, dep.erro) : `npm ci falhou no pod:\n${dep.erro.trim().slice(-500)}`);
	parar();

	// 4. Render, lendo as mesmas linhas JSON do render local.
	atualizar({fase: 'renderizando no pod', pct: 23});
	const args = ['--projeto', q(projeto), '--tipo', tipo, '--res', String(res)];
	if (de !== undefined) args.push('--de', String(de));
	if (ate !== undefined) args.push('--ate', String(ate));
	let saidaRemota = null, erroRemoto = null;
	const r = await sshRodar(pod, `cd ${q(pod.pasta)} && GL=${q(pod.gl)} ${hw ? '' : 'HW=0 '}exec node scripts/render-job.mjs ${args.join(' ')}`, {
		aoProc: (p) => t.procs.add(p),
		aoSaida: (l) => {
			let ev;
			try {
				ev = JSON.parse(l);
			} catch {
				return atualizar({log: l});
			}
			if (ev.fase) atualizar({fase: `${ev.fase} no pod`, pct: 23 + ((ev.pct ?? 0) / 100) * 72, eta: ev.eta ?? null});
			if (ev.aviso) atualizar({aviso: ev.aviso});
			if (ev.erro) erroRemoto = ev.erro;
			if (ev.fim) saidaRemota = ev.saida;
		},
	});
	parar();
	if (erroRemoto) throw new Error(erroRemoto);
	if (r.codigo !== 0 || !saidaRemota) throw new Error(r.codigo === 255 ? erroSsh(r.codigo, r.erro) : r.erro.trim().slice(-500) || `Render no pod terminou com código ${r.codigo}`);
	if (!/^out\/[\w.-]+\.mp4$/.test(saidaRemota)) throw new Error('Saída inesperada do render no pod');

	// 5. Baixar o vídeo para out/.
	atualizar({fase: 'baixando o vídeo do pod', pct: 95, eta: null});
	const remoto = `${pod.pasta}/${saidaRemota}`;
	const st = await sshRodar(pod, `stat -c %s ${q(remoto)}`);
	const tamanho = Number(st.saida.trim());
	if (st.codigo !== 0 || !tamanho) throw new Error(`Não achei o vídeo no pod: ${st.erro.trim()}`);
	mkdirSync(path.join(raiz, 'out'), {recursive: true});
	const destino = path.join(raiz, saidaRemota);
	const parte = `${destino}.parte`;
	await new Promise((ok, falha) => {
		const ssh = spawn(exe('ssh'), sshArgs(pod, `cat ${q(remoto)}`), {stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true, detached: !ehWin});
		t.procs.add(ssh);
		const arq = createWriteStream(parte);
		let recebidos = 0, erro = '';
		ssh.stdout.on('data', (c) => {
			recebidos += c.length;
			faixa(95, 100)((recebidos / tamanho) * 100);
		});
		ssh.stdout.pipe(arq);
		ssh.stderr.on('data', (d) => (erro += d));
		ssh.on('error', (e) => falha(semSsh(e)));
		// Espera o ssh fechar e o arquivo terminar de gravar (o pipe fecha o arquivo sozinho).
		const gravado = finished(arq).catch(() => {});
		ssh.on('close', async (c) => {
			await gravado;
			c === 0 && recebidos === tamanho ? ok() : falha(new Error(t.cancelado ? 'Cancelado' : `Download do vídeo falhou: ${erroSsh(c, erro)}`));
		});
	}).catch((e) => {
		rmSync(parte, {force: true});
		throw e;
	});
	renameSync(parte, destino);
	return saidaRemota;
};

// Ao cancelar: além de fechar o ssh, encerra o render que ficou rodando no pod.
export const pararNoPod = (podCfg) => {
	try {
		const pod = validarPod(podCfg);
		spawn(exe('ssh'), sshArgs(pod, `pkill -f 'scripts/render-jo[b].mjs'; pkill -f 'chrome-headless-shel[l]'; true`), {stdio: 'ignore', windowsHide: true}).on('error', () => {});
	} catch {}
};

// Prepara o pod (Node 22, ffmpeg, bibliotecas do Chrome). O script vai pela entrada do ssh (bash -s).
export const prepararPod = async ({t, raiz, podCfg, atualizar}) => {
	const pod = validarPod(podCfg);
	atualizar({fase: 'conectando no pod', pct: 0});
	const script = readFileSync(path.join(raiz, 'scripts/preparar-pod.sh'), 'utf8').replace(/\r/g, '');
	const r = await sshRodar(pod, 'bash -s', {
		entrada: script,
		aoProc: (p) => t.procs.add(p),
		aoSaida: (l) => {
			const m = /^##PCT (\d+) (.*)$/.exec(l);
			if (m) atualizar({fase: m[2], pct: Number(m[1])});
			else atualizar({log: l});
		},
	});
	if (r.codigo !== 0) throw new Error(r.codigo === 255 ? erroSsh(r.codigo, r.erro) : `A preparação do pod falhou:\n${r.erro.trim().slice(-500)}`);
};
