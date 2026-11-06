// Render rápido do ad-03 só com ffmpeg (sem Remotion): cortes pela fala sobre split.mp4, legenda em tarja (ASS),
// B-roll do produto na metade de cima e seta laranja no CTA. Uso: node scripts/rapido-ad03.mjs
import {readFileSync, writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

const pasta = 'public/projetos/ad-03';
const P = JSON.parse(readFileSync('src/projetos/ad-03/transcricao.json', 'utf8')).words.filter((w) => w.type === 'word');
const DEPOIS = 0.07, ANTES = 0.05;
const cortes = [[0, Math.max(0, P[0].start - ANTES)], [52.06 - ANTES, 54.92 - ANTES], [70.36 - ANTES, 75.1 - ANTES]];
for (let i = 1; i < P.length; i++) {
	const a = P[i - 1].end + DEPOIS, z = P[i].start - ANTES;
	if (z - a >= 0.04 && P[i].start - P[i - 1].end > 0.23) cortes.push([a, z]);
}
const FIM = P[P.length - 1].end + 0.3;
cortes.push([FIM, 146.1]);
// Trechos mantidos (tempo original), em ordem, juntando cortes sobrepostos.
cortes.sort((x, y) => x[0] - y[0]);
const mant = [];
let t = 0;
for (const [a, z] of cortes) {
	if (a > t + 0.02) mant.push([t, a]);
	t = Math.max(t, z);
}
const ed = (s) => {
	let acc = 0;
	for (const [a, z] of mant) {
		if (s < a) return acc;
		if (s <= z) return acc + (s - a);
		acc += z - a;
	}
	return acc;
};
const total = mant.reduce((x, [a, z]) => x + z - a, 0);

// Legenda: 3 palavras por tela, caixa alta branca em tarja preta, no meio (emenda das metades).
const ts = (s) => {
	const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = (s % 60).toFixed(2).padStart(5, '0');
	return `${h}:${String(m).padStart(2, '0')}:${x}`;
};
const vivos = P.filter((w) => mant.some(([a, z]) => w.start >= a - 0.01 && w.end <= z + 0.01));
let ass = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Tarja,Arial,58,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,3,10,0,5,60,60,0,1
Style: Seta,Arial,190,&H00006AFF,&H00006AFF,&H00FFFFFF,&H00000000,-1,0,0,0,100,100,0,0,1,6,4,5,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
for (let i = 0; i < vivos.length; i += 3) {
	const g = vivos.slice(i, i + 3);
	const de = ed(g[0].start);
	const prox = vivos[i + 3];
	const ate = Math.min(prox ? ed(prox.start) : total, ed(g[g.length - 1].end) + 0.6);
	const txt = g.map((w) => w.text).join(' ').toUpperCase().replace(/[{}]/g, '');
	ass += `Dialogue: 0,${ts(de)},${ts(Math.max(ate, de + 0.15))},Tarja,,0,0,0,,{\\pos(540,960)}${txt}\n`;
}
const cta = ed(P.find((w, k) => /^E$/.test(w.text) && /claro/i.test(P[k + 1]?.text ?? '') && w.start > 115).start);
// Seta pulando (sobe e desce 20 px a cada 0,45 s) sobre o botão laranja, do CTA até o fim.
for (let s = cta, k = 0; s < total; s += 0.45, k++) {
	const y = k % 2 ? 1330 : 1310;
	ass += `Dialogue: 1,${ts(s)},${ts(Math.min(total, s + 0.45))},Seta,,0,0,0,,{\\pos(180,${y})}▼\n`;
}
writeFileSync(`${pasta}/legenda.ass`, ass);

// Filtro: corta e junta os trechos, aplica o produto em cima a partir do CTA e queima a legenda.
const partes = mant.map(([a, z], i) => `[0:v]trim=${a.toFixed(3)}:${z.toFixed(3)},setpts=PTS-STARTPTS[v${i}];[0:a]atrim=${a.toFixed(3)}:${z.toFixed(3)},asetpts=PTS-STARTPTS[a${i}];`).join('');
const conc = mant.map((_, i) => `[v${i}][a${i}]`).join('') + `concat=n=${mant.length}:v=1:a=1[vc][ac];`;
const prod = `[1:v]scale=960:960,pad=1080:960:60:0:white[pr];[vc][pr]overlay=0:0:enable='gte(t,${cta.toFixed(2)})'[vp];[vp]subtitles=legenda.ass[vo]`;
writeFileSync(`${pasta}/filtro.txt`, partes + conc + prod);
console.log(`trechos ${mant.length}, duração ${total.toFixed(1)} s, CTA em ${cta.toFixed(1)} s`);
const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', 'split.mp4', '-loop', '1', '-i', 'produto.jpg', '-/filter_complex', 'filtro.txt', '-map', '[vo]', '-map', '[ac]', '-t', total.toFixed(2), '-c:v', 'h264_nvenc', '-preset', 'p4', '-b:v', '12M', '-c:a', 'aac', '-b:a', '192k', '../../../out/ad-03-1080.mp4'], {cwd: pasta, stdio: 'inherit'});
process.exit(r.status ?? 1);
