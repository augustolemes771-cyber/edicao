// Coleta as EVIDÊNCIAS de um vídeo de referência para a IA analisar (o "porquê" de cada efeito é escrito depois, por ela).
// Uso: npm run analisar-referencia -- <video> [nome-da-analise]
// Saída em out/analise-<nome>/: ficha.json (duração, fps, resolução), cortes.json (trocas de plano), audio.json (volume a cada 50 ms,
// picos = candidatos a efeito sonoro, pausas), eventos.json (cortes + picos de som + picos de movimento, ordenados), folhas/*.jpg
// (folha de quadros por evento: 8 quadros de -0,3 s a +0,8 s) e visao-geral.jpg (1 quadro a cada ~2 s). Só precisa do ffmpeg.
import {execFileSync, spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, rmSync, writeFileSync} from 'node:fs';
import path from 'node:path';

const [arquivo, nomeArg] = process.argv.slice(2);
if (!arquivo || !existsSync(arquivo)) {
	console.error('Uso: npm run analisar-referencia -- <video> [nome]  (vídeo não encontrado)');
	process.exit(1);
}
const raiz = path.resolve(import.meta.dirname, '..');
const nome = (nomeArg ?? path.basename(arquivo, path.extname(arquivo))).replace(/[^\w.-]+/g, '-');
const saida = path.join(raiz, 'out', `analise-${nome}`);
rmSync(saida, {recursive: true, force: true});
mkdirSync(path.join(saida, 'folhas'), {recursive: true});
const ff = (args, opts = {}) => spawnSync('ffmpeg', ['-hide_banner', '-nostdin', ...args], {encoding: 'utf8', maxBuffer: 1 << 28, ...opts});
const r1 = (n) => Math.round(n * 10) / 10;
const r2 = (n) => Math.round(n * 100) / 100;

// 1. Ficha
const pr = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', arquivo], {encoding: 'utf8'}));
const v = pr.streams.find((s) => s.codec_type === 'video');
const [fn, fd] = String(v.avg_frame_rate).split('/').map(Number);
const dur = Number(pr.format.duration);
const ficha = {arquivo: path.basename(arquivo), duracao: r2(dur), fps: r2(fn / (fd || 1)), largura: v.width, altura: v.height, temAudio: pr.streams.some((s) => s.codec_type === 'audio')};
writeFileSync(path.join(saida, 'ficha.json'), JSON.stringify(ficha, null, 1));

// 2. Cortes de plano (mudança de cena) e energia de movimento
const sc = ff(['-i', arquivo, '-vf', "select='gt(scene,0.25)',showinfo", '-an', '-f', 'null', '-']);
const cortes = [...sc.stderr.matchAll(/pts_time:([\d.]+)/g)].map((m) => r2(Number(m[1])));
writeFileSync(path.join(saida, 'cortes.json'), JSON.stringify({cortes, trocasPorMinuto: r1((cortes.length / dur) * 60)}, null, 1));
const mov = ff(['-i', arquivo, '-vf', "fps=10,select='gt(scene,0.06)',showinfo", '-an', '-f', 'null', '-']);
const picosMov = [...mov.stderr.matchAll(/pts_time:([\d.]+)/g)].map((m) => r2(Number(m[1]))).filter((t) => !cortes.some((c) => Math.abs(c - t) < 0.2));

// 3. Áudio: RMS a cada 50 ms; saltos bruscos = efeito sonoro ou início de fala; pausas = trechos silenciosos
let audio = {rms: [], picos: [], pausas: []};
if (ficha.temAudio) {
	const pcm = spawnSync('ffmpeg', ['-hide_banner', '-nostdin', '-i', arquivo, '-vn', '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], {maxBuffer: 1 << 30});
	const buf = pcm.stdout;
	const n = Math.floor(buf.length / 2);
	const passo = 800; // 50 ms
	const db = [];
	for (let i = 0; i + passo <= n; i += passo) {
		let s = 0;
		for (let j = 0; j < passo; j++) {
			const x = buf.readInt16LE((i + j) * 2) / 32768;
			s += x * x;
		}
		db.push(Math.max(-90, 20 * Math.log10(Math.sqrt(s / passo) + 1e-9)));
	}
	for (let i = 4; i < db.length; i++) {
		const antes = Math.max(...db.slice(i - 4, i));
		if (db[i] - antes > 9 && db[i] > -35) audio.picos.push({t: r2(i * 0.05), db: r1(db[i]), salto: r1(db[i] - antes)});
	}
	let ini = null;
	db.forEach((d, i) => {
		if (d < -45 && ini === null) ini = i;
		if (d >= -45 && ini !== null) {
			if ((i - ini) * 0.05 >= 0.25) audio.pausas.push({de: r2(ini * 0.05), ate: r2(i * 0.05)});
			ini = null;
		}
	});
	audio.rms = db.filter((_, i) => i % 2 === 0).map(r1); // a cada 100 ms
	const lufs = ff(['-i', arquivo, '-af', 'ebur128=peak=true', '-f', 'null', '-']).stderr.match(/I:\s+(-?[\d.]+) LUFS/g);
	audio.lufs = lufs ? lufs[lufs.length - 1].replace(/\D*(-?[\d.]+).*/, '$1') : null;
}
writeFileSync(path.join(saida, 'audio.json'), JSON.stringify(audio));

// 4. Eventos candidatos, em ordem (cada um ganha uma folha de quadros)
const eventos = [
	...cortes.map((t) => ({t, tipo: 'corte'})),
	...audio.picos.map((p) => ({t: p.t, tipo: 'som', detalhe: `${p.db} dB (+${p.salto})`})),
	...picosMov.map((t) => ({t, tipo: 'movimento'})),
].sort((a, b) => a.t - b.t);
// junta eventos a menos de 0,4 s (um efeito costuma ter corte + som + movimento juntos)
const grupos = [];
for (const e of eventos) {
	const g = grupos[grupos.length - 1];
	if (g && e.t - g.t < 0.4) g.tipos.push(e.tipo + (e.detalhe ? ` ${e.detalhe}` : ''));
	else grupos.push({t: e.t, tipos: [e.tipo + (e.detalhe ? ` ${e.detalhe}` : '')]});
}
const limite = 60;
const escolhidos = grupos.length > limite ? grupos.filter((_, i) => i % Math.ceil(grupos.length / limite) === 0) : grupos;
escolhidos.forEach((g, i) => {
	const t0 = Math.max(0, g.t - 0.3);
	const arq = `folhas/ev${String(i + 1).padStart(2, '0')}-${r1(g.t)}s.jpg`;
	g.folha = arq;
	ff(['-ss', String(t0), '-t', '1.1', '-i', arquivo, '-vf', 'fps=8,scale=270:-1,tile=8x1', '-frames:v', '1', '-y', path.join(saida, arq)]);
});
writeFileSync(path.join(saida, 'eventos.json'), JSON.stringify({total: grupos.length, mostrados: escolhidos.length, eventos: escolhidos}, null, 1));

// 5. Visão geral: 1 quadro a cada ~2 s em folhas de 6x5
ff(['-i', arquivo, '-vf', 'fps=0.5,scale=216:-1,tile=6x5', '-y', path.join(saida, 'visao-geral-%02d.jpg')]);

console.log(`Evidências em ${path.relative(raiz, saida)}/`);
console.log(`${ficha.duracao} s, ${ficha.largura}x${ficha.altura}, ${ficha.fps} fps; ${cortes.length} cortes (${r1((cortes.length / dur) * 60)}/min); ${audio.picos.length} picos de som; ${grupos.length} eventos (${escolhidos.length} com folha).`);
console.log('Próximo passo: ler docs/referencias/analisar-referencia.md e escrever a análise do porquê.');
