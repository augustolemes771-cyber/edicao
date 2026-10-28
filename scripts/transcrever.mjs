// Transcreve o vídeo palavra por palavra e salva em src/projetos/<projeto>/transcricao.json.
// Uso: npm run transcrever -- <projeto> [arquivo]   (arquivo padrão: o "video" do edit.ts, em public/)
//
// Com ELEVENLABS_API_KEY no ambiente usa o ElevenLabs Scribe (o mesmo da skill original).
// Sem a chave, usa o whisper.cpp local: grátis, roda no seu computador, baixa o modelo uma vez.
import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
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
	const resultado = await transcribe({
		inputPath: wav,
		whisperPath: pastaWhisper,
		whisperCppVersion: versao,
		model: modelo,
		tokenLevelTimestamps: false,
		// O whisper.cpp usa 4 núcleos se ninguém disser o contrário: usa quase todos (deixa 2 livres para o Windows).
		additionalArgs: ['-t', String(Math.max(4, os.cpus().length - 2))],
		onProgress: (p) => console.log(JSON.stringify({fase: 'transcrevendo', pct: Math.round(p * 100)})),
		language: 'pt',
		splitOnWord: true,
	});
	const {captions} = toCaptions({whisperCppOutput: resultado});
	writeFileSync(saida, JSON.stringify(captions, null, 1));
	}
}
console.log(`Transcrição salva em ${path.relative(raiz, saida)}. Próximo passo: npm run roteiro -- ${projeto}`);
