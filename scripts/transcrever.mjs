// Transcreve o vídeo palavra por palavra e salva em src/projetos/<projeto>/transcricao.json.
// Uso: npm run transcrever -- <projeto> [arquivo]   (arquivo padrão: o "video" do edit.ts, em public/)
//
// Com ELEVENLABS_API_KEY no ambiente usa o ElevenLabs Scribe (o mesmo da skill original).
// Sem a chave, usa o whisper.cpp local: grátis, roda no seu computador, baixa o modelo uma vez.
import {execFileSync, spawnSync} from 'node:child_process';
import {createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [projeto, arquivoArg] = process.argv.slice(2);
if (!projeto) {
	console.error('Uso: npm run transcrever -- <projeto> [arquivo de vídeo]');
	process.exit(1);
}
const raiz = path.resolve(import.meta.dirname, '..');
const pastaProjeto = path.join(raiz, 'src', 'projetos', projeto);
if (!existsSync(pastaProjeto)) {
	console.error(`Não achei ${pastaProjeto}. Crie com: npm run novo -- ${projeto}`);
	process.exit(1);
}
const arquivo = arquivoArg ?? path.join(raiz, 'public', 'projetos', projeto, 'video.mp4');
if (!existsSync(arquivo)) {
	console.error(`Vídeo não encontrado: ${arquivo}`);
	process.exit(1);
}

const cache = path.join(os.homedir(), '.cache', 'edicao');

// whisper.cpp com CUDA para Windows (versão oficial, já traz as DLLs da CUDA; ~440 MB, baixado uma vez para ~/.cache/edicao).
// Só com placa NVIDIA (nvidia-smi responde). SEM_GPU=1 desliga. Devolve a pasta (com build/bin/whisper-cli.exe) ou null.
const VERSAO_CUDA = '1.7.6';
const URL_CUDA = `https://github.com/ggml-org/whisper.cpp/releases/download/v${VERSAO_CUDA}/whisper-cublas-12.4.0-bin-x64.zip`;
const whisperCuda = async () => {
	if (process.platform !== 'win32' || process.env.SEM_GPU) return null;
	const pasta = path.join(cache, `whisper-cuda-${VERSAO_CUDA}`);
	const exe = path.join(pasta, 'build', 'bin', 'whisper-cli.exe');
	if (existsSync(path.join(pasta, 'falhou.txt'))) return null;
	if (existsSync(exe)) return pasta;
	if (spawnSync('nvidia-smi', ['-L'], {windowsHide: true}).status !== 0) return null;
	try {
		mkdirSync(path.join(pasta, 'build'), {recursive: true});
		const zip = path.join(pasta, 'whisper-cuda.zip.parte');
		const r = await fetch(URL_CUDA);
		if (!r.ok || !r.body) throw new Error(`download ${r.status}`);
		const total = Number(r.headers.get('content-length')) || 443e6;
		let recebido = 0, ultimo = -1;
		const arq = createWriteStream(zip);
		for await (const pedaco of r.body) {
			recebido += pedaco.length;
			if (!arq.write(pedaco)) await new Promise((ok) => arq.once('drain', ok));
			const pct = Math.floor((recebido / total) * 100);
			if (pct !== ultimo) { ultimo = pct; console.log(JSON.stringify({fase: `baixando o whisper para a placa NVIDIA (${Math.round(total / 1e6)} MB, só da primeira vez)`, pct})); }
		}
		await new Promise((ok, falha) => arq.end((e) => (e ? falha(e) : ok())));
		console.log(JSON.stringify({fase: 'instalando o whisper para a placa NVIDIA', pct: null}));
		// tar do Windows 10+ abre zip; se não abrir, PowerShell.
		const destino = path.join(pasta, 'build');
		if (spawnSync('tar', ['-xf', zip, '-C', destino], {windowsHide: true}).status !== 0) {
			execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', `Expand-Archive -Force -LiteralPath '${zip.replace(/'/g, "''")}' -DestinationPath '${destino.replace(/'/g, "''")}'`], {windowsHide: true});
		}
		renameSync(path.join(destino, 'Release'), path.join(destino, 'bin'));
		rmSync(zip, {force: true});
		return existsSync(exe) ? pasta : null;
	} catch (e) {
		console.log(JSON.stringify({aviso: `Não instalei o whisper da placa NVIDIA (${String(e?.message ?? e).slice(0, 160)}): transcrevendo na CPU.`}));
		rmSync(pasta, {recursive: true, force: true});
		return null;
	}
};
mkdirSync(cache, {recursive: true});
const saida = path.join(pastaProjeto, 'transcricao.json');

// Trava: duas transcrições do mesmo projeto ao mesmo tempo se atrapalham (cada uma fica ~2x mais lenta).
const trava = path.join(cache, `${projeto}.transcrevendo`);
if (existsSync(trava)) {
	const pid = Number(readFileSync(trava, 'utf8'));
	let viva = false;
	try { process.kill(pid, 0); viva = pid !== process.pid; } catch {}
	if (viva) {
		console.error(`Já existe uma transcrição de "${projeto}" rodando (processo ${pid}). Espere ela terminar em vez de iniciar outra.`);
		process.exit(1);
	}
}
writeFileSync(trava, String(process.pid));
const soltarTrava = () => { try { rmSync(trava, {force: true}); } catch {} };
process.on('exit', soltarTrava);
process.on('SIGINT', () => process.exit(1));
process.on('SIGTERM', () => process.exit(1));

if (process.env.ELEVENLABS_API_KEY) {
	const audio = path.join(cache, `${projeto}.mp3`);
	execFileSync('ffmpeg', [
		'-hide_banner',
		'-loglevel',
		'error',
		'-y',
		'-i',
		arquivo,
		'-vn',
		'-ac',
		'1',
		'-b:a',
		'96k',
		audio,
	]);
	console.log('Enviando para o ElevenLabs Scribe…');
	const form = new FormData();
	form.append('file', new Blob([readFileSync(audio)]), 'audio.mp3');
	form.append('model_id', 'scribe_v2');
	form.append('timestamps_granularity', 'word');
	form.append('language_code', 'por');
	form.append('tag_audio_events', 'false');
	const resposta = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
		method: 'POST',
		headers: {'xi-api-key': process.env.ELEVENLABS_API_KEY},
		body: form,
	});
	if (!resposta.ok) {
		console.error(`Scribe respondeu ${resposta.status}: ${await resposta.text()}`);
		process.exit(1);
	}
	writeFileSync(saida, JSON.stringify(await resposta.json(), null, 1));
} else {
	// 1º tenta o servidor de GPU (pod ativo nas Preferências): ~segundos em vez de minutos. Se falhar, transcreve neste PC.
	let feito = false;
	let podCfg = null;
	try { podCfg = JSON.parse(readFileSync(path.join(raiz, '.painel/config.json'), 'utf8')).pod; } catch {}
	if (podCfg?.ativo && podCfg.host && !process.env.SEM_POD) {
		try {
			const wavPod = path.join(cache, `${projeto}.wav`);
			execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', arquivo, '-vn', '-ar', '16000', '-ac', '1', wavPod]);
			const {transcreverNoPod} = await import('./transcrever-pod.mjs');
			const captions = await transcreverNoPod({
				podCfg,
				projeto,
				wav: wavPod,
				aoProgresso: (fase, pct) => console.log(JSON.stringify({fase, pct})),
			});
			if (!captions.length) throw new Error('transcrição vazia');
			writeFileSync(saida, JSON.stringify(captions, null, 1));
			console.log(JSON.stringify({fase: 'transcrição pronta (GPU do servidor)', pct: 100}));
			feito = true;
		} catch (e) {
			console.log(JSON.stringify({aviso: `Servidor de GPU indisponível (${String(e.message).slice(0, 200)}). Transcrevendo neste PC.`}));
		}
	}
	if (!feito) {
	const {downloadWhisperModel, installWhisperCpp, toCaptions, transcribe} =
		await import('@remotion/install-whisper-cpp');
	const versao = '1.5.5';
	const modelo = process.env.WHISPER_MODELO ?? 'large-v3-turbo';
	const pastaWhisper = path.join(cache, 'whisper.cpp');
	console.log(`Sem ELEVENLABS_API_KEY: usando whisper.cpp local (modelo ${modelo}).`);
	// A versão da CPU fica instalada sempre (é pequena): é a reserva se a da placa falhar e a pasta onde fica o modelo.
	await installWhisperCpp({to: pastaWhisper, version: versao});
	await downloadWhisperModel({folder: pastaWhisper, model: modelo});
	const wav = path.join(cache, `${projeto}.wav`);
	execFileSync('ffmpeg', [
		'-hide_banner',
		'-loglevel',
		'error',
		'-y',
		'-i',
		arquivo,
		'-vn',
		'-ar',
		'16000',
		'-ac',
		'1',
		wav,
	]);
	const opcoes = {
		inputPath: wav,
		model: modelo,
		modelFolder: pastaWhisper,
		tokenLevelTimestamps: false,
		// O whisper.cpp usa 4 núcleos se ninguém disser o contrário: usa quase todos (deixa 2 livres para o Windows).
		additionalArgs: ['-t', String(Math.max(4, os.cpus().length - 2))],
		onProgress: (p) => console.log(JSON.stringify({fase: 'transcrevendo', pct: Math.round(p * 100)})),
		language: 'pt',
		splitOnWord: true,
	};
	let resultado = null;
	// Windows com placa NVIDIA: whisper.cpp com CUDA (a RTX transcreve em segundos). Se der erro, volta para a CPU.
	const pastaCuda = await whisperCuda();
	if (pastaCuda) {
		try {
			console.log(JSON.stringify({fase: 'transcrevendo na placa de vídeo (NVIDIA)', pct: 0}));
			const r = await transcribe({...opcoes, whisperPath: pastaCuda, whisperCppVersion: VERSAO_CUDA, onProgress: (p) => console.log(JSON.stringify({fase: 'transcrevendo na placa de vídeo (NVIDIA)', pct: Math.round(p * 100)}))});
			// Confere a saída aqui dentro: se o formato não servir, também volta para a CPU.
			if (!toCaptions({whisperCppOutput: r}).captions.length) throw new Error('transcrição vazia');
			resultado = r;
		} catch (e) {
			writeFileSync(path.join(pastaCuda, 'falhou.txt'), String(e?.message ?? e).slice(0, 2000));
			console.log(JSON.stringify({aviso: `A transcrição na placa NVIDIA falhou (${String(e?.message ?? e).slice(0, 160)}). Usando a CPU; atualize o driver da NVIDIA e apague ${path.join(pastaCuda, 'falhou.txt')} para tentar de novo.`}));
		}
	}
	if (!resultado) {
		resultado = await transcribe({...opcoes, whisperPath: pastaWhisper, whisperCppVersion: versao});
	}
	const {captions} = toCaptions({whisperCppOutput: resultado});
	writeFileSync(saida, JSON.stringify(captions, null, 1));
	}
}
console.log(`Transcrição salva em ${path.relative(raiz, saida)}. Próximo passo: npm run roteiro -- ${projeto}`);
