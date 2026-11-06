// Render rápido do tf-ad03 só com ffmpeg (sem Remotion), adaptado de rapido-ad03.mjs: tela dividida (cima.mp4 em cima,
// criadora embaixo), cortes por respiro, punch-in alternado por frase, "pochete" mutado, B-roll do produto no trecho
// "vou te mostrar onde conseguir... TikTok Shop", seta laranja do CTA ao fim. Uso: node scripts/rapido-tf03.mjs
import {readFileSync, writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

const pasta = 'public/projetos/tf-ad03';
const ref = '../ad-03';
const P = JSON.parse(readFileSync('src/projetos/tf-ad03/transcricao.json', 'utf8')).words.filter((w) => w.type === 'word');
const DUR = 123.57;
const DEPOIS = 0.07, ANTES = 0.05;
const EXTRA = JSON.parse(process.env.CORTES ?? '[]'); // regravações: [[ini, fim], ...] em segundos do bruto
const cortes = [[0, Math.max(0, P[0].start - ANTES)], ...EXTRA];
for (let i = 1; i < P.length; i++) {
	const a = P[i - 1].end + DEPOIS, z = P[i].start - ANTES;
	if (z - a >= 0.04 && P[i].start - P[i - 1].end > 0.23) cortes.push([a, z]);
}
const FIM = Math.min(DUR, P[P.length - 1].end + 0.3);
cortes.push([FIM, DUR + 1]);
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
const vivos = P.filter((w) => mant.some(([a, z]) => w.start >= a - 0.01 && w.end <= z + 0.01));

// Frase de cada palavra (para alternar o zoom).
const fimFrase = [];
P.forEach((w) => { if (/[.!?]$/.test(w.text)) fimFrase.push(w.end); });
const frase = (s) => fimFrase.filter((e) => e < s - 0.01).length;

const ts = (s) => {
	const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = (s % 60).toFixed(2).padStart(5, '0');
	return `${h}:${String(m).padStart(2, '0')}:${x}`;
};
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
const limpa = (s) => s.replace(/[{}]/g, '').toUpperCase();
for (let i = 0; i < vivos.length; i += 3) {
	const g = vivos.slice(i, i + 3);
	const de = ed(g[0].start);
	const prox = vivos[i + 3];
	const ate = Math.min(prox ? ed(prox.start) : total, ed(g[g.length - 1].end) + 0.6);
	const txt = g.map((w) => (/poche/i.test(w.text) ? '***' : w.text)).join(' ');
	ass += `Dialogue: 0,${ts(de)},${ts(Math.max(ate, de + 0.15))},Tarja,,0,0,0,,{\pos(540,960)}${limpa(txt)}\n`;
}
const acha = (re, re2) => P.findIndex((w, k) => re.test(w.text) && (!re2 || re2.test(P[k + 1]?.text ?? '')));
const iMostrar = acha(/^mostrar/i, /^onde/i);
const iShop = P.findIndex((w, k) => k > iMostrar && /^shop/i.test(w.text));
// Começa o B-roll no "eu vou te" antes do "mostrar".
const iIni = Math.max(0, iMostrar - 3 >= 0 && /^eu$/i.test(P[iMostrar - 3].text) ? iMostrar - 3 : iMostrar);
const bIni = ed(P[iIni].start), bFim = ed(P[iShop].end) + 0.3;
const cta = bIni;
for (let s = cta, k = 0; s < total; s += 0.45, k++) {
	const y = k % 2 ? 1700 : 1680;
	ass += `Dialogue: 1,${ts(s)},${ts(Math.min(total, s + 0.45))},Seta,,0,0,0,,{\pos(150,${y})}▼\n`;
}
writeFileSync(`${pasta}/legenda.ass`, ass);

// Pochete: muta a palavra (tempo editado).
const poch = vivos.filter((w) => /poche/i.test(w.text)).map((w) => [ed(w.start) - 0.03, ed(w.end) + 0.03]);
const mute = poch.map(([a, z]) => `volume=enable='between(t,${a.toFixed(3)},${z.toFixed(3)})':volume=0`).join(',') || 'anull';

const partes = mant.map(([a, z], i) => {
	const zoom = frase(a + 0.06) % 2 ? 1.12 : 1.0;
	const zf = zoom > 1 ? `,scale=iw*${zoom}:ih*${zoom},crop=1080:960` : '';
	return `[0:v]trim=${a.toFixed(3)}:${z.toFixed(3)},setpts=PTS-STARTPTS,fps=30,crop=1080:960:0:300${zf},setsar=1[v${i}];[0:a]atrim=${a.toFixed(3)}:${z.toFixed(3)},asetpts=PTS-STARTPTS[a${i}];`;
}).join('');
const conc = mant.map((_, i) => `[v${i}][a${i}]`).join('') + `concat=n=${mant.length}:v=1:a=1[vb][ab];`;
const resto = `[1:v]fps=30,scale=1080:960,setsar=1,trim=0:${total.toFixed(2)},setpts=PTS-STARTPTS[top];` +
	`[2:v]scale=900:900:force_original_aspect_ratio=decrease,pad=1080:960:(ow-iw)/2:(oh-ih)/2:white,setsar=1[pr];` +
	`[top][pr]overlay=0:0:enable='between(t,${bIni.toFixed(2)},${bFim.toFixed(2)})'[topb];` +
	`[topb][vb]vstack[vs];[vs]subtitles=legenda.ass[vo];[ab]${mute}[ao]`;
writeFileSync(`${pasta}/filtro.txt`, partes + conc + resto);
console.log(`trechos ${mant.length}, duração ${total.toFixed(1)} s, B-roll ${bIni.toFixed(1)}–${bFim.toFixed(1)} s, pochete ${poch.length}x`);
const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', 'bruto.mov', '-stream_loop', '-1', '-i', `${ref}/cima-960.mp4`, '-loop', '1', '-i', `${ref}/produto.jpg`,
	'-/filter_complex', 'filtro.txt', '-map', '[vo]', '-map', '[ao]', '-t', total.toFixed(2), '-r', '30', '-c:v', 'h264_nvenc', '-preset', 'p4', '-b:v', '12M',
	'-c:a', 'aac', '-b:a', '192k', '../../../out/tf-ad03-final.mp4'], {cwd: pasta, stdio: 'inherit'});
process.exit(r.status ?? 1);
