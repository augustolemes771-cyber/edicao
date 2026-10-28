// Transcrição no servidor de GPU (pod): só o áudio 16 kHz mono (~3 MB por 100 s) sobe; o Whisper large-v3-turbo roda na placa
// (faster-whisper, float16) e a transcrição palavra por palavra volta em segundos. Usado por scripts/transcrever.mjs quando
// o pod está ativo nas Preferências; se falhar, o chamador transcreve neste PC.
import {readFileSync} from 'node:fs';
import {validarPod, sshRodar} from '../painel/pod.mjs';

// Roda no pod. Lê o WAV, imprime o progresso em stderr e uma última linha JSON com as palavras em stdout.
const PY = `
import json, sys
try:
    from faster_whisper import WhisperModel
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "faster-whisper"])
    from faster_whisper import WhisperModel
wav, lang, modelo = sys.argv[1], sys.argv[2], sys.argv[3]
try:
    m = WhisperModel(modelo, device="cuda", compute_type="float16")
except Exception as e:
    sys.stderr.write("GPU indisponivel (%s): usando a CPU\\n" % e)
    m = WhisperModel(modelo, device="cpu", compute_type="int8")
segs, info = m.transcribe(wav, language=lang or None, word_timestamps=True, vad_filter=False, condition_on_previous_text=False)
palavras = []
for s in segs:
    for w in (s.words or []):
        palavras.append({"text": w.word.strip(), "start": w.start, "end": w.end, "p": w.probability})
    sys.stderr.write("PCT %d\\n" % min(99, int(100 * s.end / max(info.duration, 0.1))))
print("JSON:" + json.dumps({"language": info.language, "words": palavras}))
`;

const q = (s) => `'${String(s).replace(/'/g, "'\\''")}'`;

export const transcreverNoPod = async ({podCfg, projeto, wav, aoProgresso, modelo = 'large-v3-turbo', idioma = 'pt'}) => {
	const pod = validarPod(podCfg);
	const remoto = `/tmp/edicao-${projeto}`;
	aoProgresso?.('enviando o áudio para o servidor', 2);
	const envio = await sshRodar(pod, `mkdir -p ${q(remoto)} && cat > ${q(`${remoto}/audio.wav`)} && cat > /dev/null`, {entrada: readFileSync(wav)});
	if (envio.codigo !== 0) throw new Error(`não consegui enviar o áudio: ${envio.erro.trim().slice(-200)}`);
	const envioPy = await sshRodar(pod, `cat > ${q(`${remoto}/transcrever.py`)}`, {entrada: PY});
	if (envioPy.codigo !== 0) throw new Error(`não consegui enviar o script: ${envioPy.erro.trim().slice(-200)}`);
	aoProgresso?.('transcrevendo na GPU do servidor', 5);
	let json = null;
	let erro = '';
	const r = await sshRodar(pod, `cd ${q(remoto)} && python3 transcrever.py audio.wav ${q(idioma)} ${q(modelo)} 2>&1`, {
		aoSaida: (l) => {
			if (l.startsWith('JSON:')) json = l.slice(5);
			else if (l.startsWith('PCT ')) aoProgresso?.('transcrevendo na GPU do servidor', Math.max(5, Number(l.slice(4))));
			else erro += l + '\n';
		},
	});
	if (r.codigo !== 0 || !json) throw new Error(`o servidor não transcreveu: ${erro.trim().slice(-300) || r.erro.trim().slice(-300)}`);
	const dados = JSON.parse(json);
	// Mesmo formato do whisper.cpp + toCaptions: texto com espaço na frente, menos a primeira palavra.
	const captions = dados.words
		.filter((w) => w.text)
		.map((w, i) => ({text: (i === 0 ? '' : ' ') + w.text, startMs: Math.round(w.start * 1000), endMs: Math.round(w.end * 1000), timestampMs: null, confidence: w.p}));
	void sshRodar(pod, `rm -rf ${q(remoto)}`).catch(() => {});
	return captions;
};
