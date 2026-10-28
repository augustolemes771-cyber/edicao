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
		const f = nome === 'tar' ? path.join(sis, 'tar.exe') : path.join(sis, 'OpenSSH', `${nome}.exe`);
		if (existsSync(f)) return f;
	}
	return nome;
};

export const validarPod = (pod = {}) => {
	const host = String(pod.host ?? '').trim();
	const usuario = String(pod.usuario ?? '').trim() || 'root';
	const porta = Number(pod.porta || 22);
	const pasta = String(pod.pasta ?? '').trim().replace(/\/+$/, '') || '/workspace/edicao';
	// 'swangle' (CPU) nunca é ponto de partida: o render-job só cai nele se os outros falharem.
	const gl = ['swangle', 'swiftshader'].includes(pod.gl) ? 'egl' : String(pod.gl || 'egl');
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
const q = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;

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
// O sshd do pod (exposto na internet) recusa conexões novas ao acaso quando há 10+ tentativas pendentes de robôs ("startups").
// Falha logo ao conectar (saída 255, sem nenhuma saída, em poucos segundos) = nem chegou a rodar: tenta de novo, até 4 vezes.
const caiuAoConectar = (r, t0) => r.codigo === 255 && !r.saida && Date.now() - t0 < 25000 && /closed|reset|refused|banner|kex|timed out|broken pipe/i.test(r.erro);
const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));
export const sshRodar = async (pod, comando, opcoes = {}) => {
	let r;
	for (let tent = 0; tent < 4; tent++) {
		const t0 = Date.now();
		r = await sshRodarUma(pod, comando, opcoes);
		if (opcoes.entrada || !caiuAoConectar(r, t0)) return r;
		await espera(1500 * (tent + 1));
	}
	return r;
};
const sshRodarUma = async (pod, comando, {entrada, aoSaida, aoProc} = {}) => {
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

// Envio para o pod por scp (SFTP, vários pedidos em voo). NÃO mandar pelo stdin do ssh: no Windows o ssh.exe lê o stdin
// em pedaços de poucos KB, um por ida e volta, e um upload de 400 Mbit/s virou 0,02 MB/s.
const scpArgs = (pod, local, remoto) => [
	'-P', String(pod.porta), '-q',
	'-o', 'BatchMode=yes',
	'-o', 'StrictHostKeyChecking=accept-new',
	'-o', 'ConnectTimeout=15',
	...(pod.chave ? ['-i', pod.chave, '-o', 'IdentitiesOnly=yes'] : []),
	'--', local, `${pod.usuario}@${pod.host}:${remoto}`,
];
// Um arquivo local para um caminho remoto SEM espaços. Caminho local absoluto: o scp do Windows entende "C:\..." como
// arquivo local (um "./nome" relativo ele não achou). Fora do Windows, nome com ":" vai como "./nome" na pasta dele.
export const scpPara = async (t, pod, local, remoto) => {
	for (let tent = 0; ; tent++) {
		const t0 = Date.now();
		try {
			return await scpUma(t, pod, local, remoto);
		} catch (e) {
			if (tent >= 3 || t?.cancelado || Date.now() - t0 > 25000 || !/closed|reset|refused|banner|kex|timed out|broken pipe/i.test(String(e.message))) throw e;
			await espera(1500 * (tent + 1));
		}
	}
};
const scpUma = (t, pod, local, remoto) =>
	new Promise((ok, falha) => {
		if (!existsSync(local)) return falha(new Error(`Arquivo para enviar ao pod não encontrado: ${local}`));
		const relativo = !ehWin && path.basename(local).includes(':');
		const pr = iniciar(exe('scp'), scpArgs(pod, relativo ? `./${path.basename(local)}` : local, remoto), {...(relativo ? {cwd: path.dirname(local)} : {}), stdio: ['ignore', 'ignore', 'pipe']});
		t?.procs?.add(pr);
		let erro = '';
		pr.stderr.on('data', (d) => (erro += d));
		pr.on('error', (e) => falha(e.code === 'ENOENT' ? new Error('scp não encontrado neste computador (vem com o OpenSSH do Windows 10+)') : e));
		pr.on('close', (c) => (c === 0 ? ok() : falha(new Error(t?.cancelado ? 'Cancelado' : `Envio para o pod falhou: ${erroSsh(c ?? -1, erro)}`))));
	});

// Vários arquivos: [{local, rel (relativo à pasta do pod), tamanho}]. Cada um vai para .envio/<n> (nome sem espaço), até 3
// ao mesmo tempo, e no fim um único ssh move tudo para o lugar.
export const enviarArquivos = async (t, pod, lista, aoPct) => {
	if (!lista.length) return;
	const envio = `${pod.pasta}/.envio`;
	const prep = await sshRodar(pod, `mkdir -p ${q(envio)}`, {aoProc: (p) => t.procs.add(p)});
	if (prep.codigo !== 0) throw new Error(erroSsh(prep.codigo, prep.erro));
	const total = lista.reduce((s, a) => s + (a.tamanho ?? 0), 0) || 1;
	let feito = 0;
	let proximo = 0;
	const trabalhador = async () => {
		while (proximo < lista.length) {
			const i = proximo++;
			if (t.cancelado) throw new Error('Cancelado');
			await scpPara(t, pod, lista[i].local, `${envio}/${i}.part`);
			feito += lista[i].tamanho ?? 0;
			aoPct(Math.min(100, (feito / total) * 100));
		}
	};
	// Barra contínua num arquivo grande: a cada 3 s, soma o que já chegou em .envio no pod.
	let medindo = false;
	const relogio = setInterval(async () => {
		if (medindo) return;
		medindo = true;
		const r = await sshRodar(pod, `du -cb ${q(envio)}/*.part 2>/dev/null | tail -1 | cut -f1`).catch(() => null);
		const chegou = Number(r?.saida?.trim());
		if (chegou > feito) aoPct(Math.min(99, (chegou / total) * 100));
		medindo = false;
	}, 3000);
	try {
		await Promise.all(Array.from({length: Math.min(3, lista.length)}, trabalhador));
	} finally {
		clearInterval(relogio);
	}
	for (let i = 0; i < lista.length; i += 80) {
		const cmd = lista
			.slice(i, i + 80)
			.map((a, k) => {
				const destino = `${pod.pasta}/${a.rel}`;
				return `mkdir -p ${q(path.posix.dirname(destino))} && mv -f ${q(`${envio}/${i + k}.part`)} ${q(destino)}`;
			})
			.join(' && ');
		const mv = await sshRodar(pod, cmd, {aoProc: (p) => t.procs.add(p)});
		if (mv.codigo !== 0) throw new Error(`Não consegui colocar os arquivos no lugar no pod: ${mv.erro.trim().slice(-300)}`);
	}
};

// Código do projeto: um tar local (rápido) enviado por scp e aberto no pod.
export const enviarCodigo = async (t, pod, raiz, estado, itens, aoPct, exclui = []) => {
	const arq = path.join(estado, 'envio-codigo.tar');
	const codTar = await executar(exe('tar'), ['-cf', arq, ...exclui.flatMap((x) => ['--exclude', x]), '--', ...itens], {cwd: raiz, env: {...process.env, COPYFILE_DISABLE: '1'}}).catch((e) => {
		throw e.code === 'ENOENT' ? new Error('tar não encontrado neste computador') : e;
	});
	if (codTar !== 0 || !existsSync(arq)) throw new Error(`tar falhou ao empacotar o código (código ${codTar})`);
	aoPct(30);
	const remoto = `${pod.pasta}/.envio/codigo.tar`;
	const prep = await sshRodar(pod, `mkdir -p ${q(`${pod.pasta}/.envio`)}`, {aoProc: (p) => t.procs.add(p)});
	if (prep.codigo !== 0) throw new Error(erroSsh(prep.codigo, prep.erro));
	await scpPara(t, pod, arq, remoto);
	aoPct(85);
	const ab = await sshRodar(pod, `tar -xf ${q(remoto)} -C ${q(pod.pasta)} --warning=no-unknown-keyword && rm -f ${q(remoto)}`, {aoProc: (p) => t.procs.add(p)});
	if (ab.codigo !== 0) throw new Error(`Não consegui abrir o código no pod: ${ab.erro.trim().slice(-300)}`);
	rmSync(arq, {force: true});
	aoPct(100);
};

const CODIGO = ['src', 'scripts', 'public/sfx', 'public/fontes', 'biblioteca', 'package.json', 'package-lock.json', 'remotion.config.ts', 'tsconfig.json'];
// Mede a velocidade de envio do PC para o pod: scp de 8 MB, descontando o tempo de abrir a conexão. Devolve MB/s.
export const medirEnvio = async (t, pod, estado) => {
	try {
		const arq = path.join(estado, 'teste-envio.bin');
		writeFileSync(arq, Buffer.alloc(8 * 1048576, 7));
		const t0 = Date.now();
		await sshRodar(pod, 'true', {aoProc: (p) => t.procs.add(p)});
		const conexao = (Date.now() - t0) / 1000;
		const t1 = Date.now();
		await scpPara(t, pod, arq, '/tmp/edicao-teste-envio.bin');
		const segundos = Math.max(0.15, (Date.now() - t1) / 1000 - conexao);
		rmSync(arq, {force: true});
		void sshRodar(pod, 'rm -f /tmp/edicao-teste-envio.bin').catch(() => {});
		return 8 / segundos;
	} catch {
		return null;
	}
};

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
	await enviarCodigo(t, pod, raiz, estado, itens, faixa(0, 4), FORA);
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
			const mbs = await medirEnvio(t, pod, estado);
			const minutos = mbs ? totalMidia / 1048576 / mbs / 60 : null;
			const limite = tipo === 'final' ? 20 : 3;
			if (minutos !== null && minutos > limite) {
				throw Object.assign(new Error(`Enviar ${Math.round(totalMidia / 1048576)} MB levaria cerca de ${Math.ceil(minutos)} min (${mbs.toFixed(2)} MB/s)`), {lento: true});
			}
		}
		if (mudou.length) {
			atualizar({fase: `enviando ${mudou.length} mídia(s) para o pod`});
			await enviarArquivos(
				t,
				pod,
				mudou.map((m) => ({local: path.join(raiz, relProj, m.rel), rel: `${relProj}/${m.rel}`, tamanho: m.tamanho})),
				faixa(4, 20),
			);
			parar();
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

	// Garante o limite de conexões do sshd do pod (pod novo ou reiniciado volta ao padrão de 10 e recusa conexões ao acaso).
	await sshRodar(pod, `grep -qE '^MaxStartups[[:space:]]+100' /etc/ssh/sshd_config 2>/dev/null || { [ "$(id -u)" = 0 ] && echo 'MaxStartups 100:30:300' >> /etc/ssh/sshd_config && pkill -HUP -x sshd; }; true`).catch(() => null);
	// 4. Render, lendo as mesmas linhas JSON do render local.
	atualizar({fase: 'renderizando no pod', pct: 23});
	const args = ['--projeto', q(projeto), '--tipo', tipo, '--res', String(res)];
	if (de !== undefined) args.push('--de', String(de));
	if (ate !== undefined) args.push('--ate', String(ate));
	let saidaRemota = null, erroRemoto = null, glQueFuncionou = null;
	const inicioPod = Number((await sshRodar(pod, 'date +%s').catch(() => ({saida: ''}))).saida.trim()) || 0;
	const r = await sshRodar(pod, `cd ${q(pod.pasta)} && GL=${q(pod.gl)} CONC=$(nproc) ${hw ? '' : 'HW=0 '}exec node scripts/render-job.mjs ${args.join(' ')}`, {
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
			if (ev.gl) glQueFuncionou = ev.gl;
			if (ev.erro) erroRemoto = ev.erro;
			if (ev.fim) saidaRemota = ev.saida;
		},
	});
	parar();
	// O modo de WebGL que funcionou no pod fica salvo: o próximo render já começa por ele.
	if (glQueFuncionou && GLS.includes(glQueFuncionou) && !['swangle', 'swiftshader'].includes(glQueFuncionou) && estado) {
		try {
			const arq = path.join(estado, 'config.json');
			const c = JSON.parse(readFileSync(arq, 'utf8'));
			writeFileSync(arq, JSON.stringify({...c, pod: {...(c.pod ?? {}), gl: glQueFuncionou}}, null, 1));
		} catch {}
	}
	if (erroRemoto) throw new Error(erroRemoto);
	// A conexão pode cair (ou o painel reiniciar) com o render ainda rodando ou já terminado no pod: sem a linha "fim", procura
	// o vídeo esperado e aceita se foi gravado depois do início deste render.
	if (!saidaRemota && inicioPod) {
		const sufixo = tipo !== 'final' && (de || ate) ? `-${de ?? 0}s-${ate ?? 'fim'}s` : '';
		const esperado = tipo === 'final' ? `out/${projeto}-final.mp4` : `out/${projeto}-preview${sufixo}.mp4`;
		const m = await sshRodar(pod, `stat -c '%Y %s' ${q(`${pod.pasta}/${esperado}`)}`).catch(() => null);
		const [mtime, tam] = (m?.saida ?? '').trim().split(' ').map(Number);
		const ocupado = await sshRodar(pod, `pgrep -f 'scripts/render-jo[b].mjs' >/dev/null && echo sim || echo nao`).catch(() => null);
		if (mtime >= inicioPod && tam > 0 && /nao/.test(ocupado?.saida ?? 'nao')) {
			atualizar({aviso: 'A conexão com o pod caiu, mas o vídeo já estava pronto: baixando.'});
			saidaRemota = esperado;
		}
	}
	// Com a conexão caída o ssh sai com 255 mesmo quando o vídeo foi recuperado acima: o que vale é ter a saída.
	if (!saidaRemota) throw new Error(r.codigo === 255 ? erroSsh(r.codigo, r.erro) : r.erro.trim().slice(-500) || `Render no pod terminou com código ${r.codigo}`);
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
