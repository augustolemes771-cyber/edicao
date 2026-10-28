// Transcreve o vídeo palavra por palavra e salva em src/projetos/<projeto>/transcricao.json.
// Uso: npm run transcrever -- <projeto> [arquivo]   (arquivo padrão: o "video" do edit.ts, em public/)
//
// Com ELEVENLABS_API_KEY no ambiente usa o ElevenLabs Scribe (o mesmo da skill original).
// Sem a chave, usa o whisper.cpp local: grátis, roda no seu computador, baixa o modelo uma vez.
import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
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
		language: 'pt',
		splitOnWord: true,
	});
	const {captions} = toCaptions({whisperCppOutput: resultado});
	writeFileSync(saida, JSON.stringify(captions, null, 1));
}
console.log(`Transcrição salva em ${path.relative(raiz, saida)}. Próximo passo: npm run roteiro -- ${projeto}`);
