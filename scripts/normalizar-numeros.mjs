// Troca numerais que o Whisper escreve (14, 87, 11h47, 40, 2) pelas palavras por extenso do roteiro e devolve "a" engolido,
// repartindo o tempo da palavra original. Uso: node scripts/normalizar-numeros.mjs <projeto>
import {readFileSync, writeFileSync} from 'node:fs';
const f = `src/projetos/${process.argv[2]}/transcricao.json`;
const t = JSON.parse(readFileSync(f, 'utf8'));
const sub = {'14': ['catorze'], '87,': ['oitenta', 'e', 'sete,'], '87': ['oitenta', 'e', 'sete'], '11h47,': ['onze', 'e', 'quarenta', 'e', 'sete,'], '11h47': ['onze', 'e', 'quarenta', 'e', 'sete'], '40': ['quarenta'], '2.': ['dois.'], '2': ['dois']};
const out = [];
for (let i = 0; i < t.length; i++) {
	const p = t[i];
	const k = p.text.trim();
	if (sub[k]) {
		const ws = sub[k];
		const tot = ws.reduce((a, w) => a + w.length, 0);
		let c = p.startMs;
		ws.forEach((w, j) => {
			const d = Math.round(((p.endMs - p.startMs) * w.length) / tot);
			out.push({...p, text: ' ' + w, startMs: c, endMs: j === ws.length - 1 ? p.endMs : c + d});
			c += d;
		});
		continue;
	}
	if (k === 'sua' && t[i - 1]?.text.trim() === 'Comenta') {
		const cut = p.startMs + Math.max(30, Math.round((p.endMs - p.startMs) * 0.25));
		out.push({...p, text: ' a', endMs: cut}, {...p, startMs: cut});
		continue;
	}
	out.push(p);
}
writeFileSync(f, JSON.stringify(out, null, 1));
console.log(`${out.length} palavras`);
