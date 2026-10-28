// Análise de qualidade do plano de um projeto (ou de um trecho dele), para o fluxo por blocos do painel.
// Uso: npm run qualidade -- <projeto> [--de SEG] [--ate SEG]   (tempos do vídeo editado)
// Confere o que deixa um vídeo amador: textos ao mesmo tempo, texto repetindo a legenda, leitura curta, trecho parado ou
// poluído, zoom acima do que a resolução aguenta, corte no meio da fala, efeito repetido, início sem gancho e texto fora
// da área segura. Sai com 1 se houver erro (✗); avisos (⚠) não bloqueiam.
import {execFileSync} from 'node:child_process';
import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {montar, type CenaNoPlano} from '../src/motor/plano';
import {projetos} from '../src/projetos';

const args = process.argv.slice(2);
const nome = args.find((a, i) => !a.startsWith('--') && !(args[i - 1] ?? '').startsWith('--'));
const num = (k: string) => {
	const i = args.indexOf(`--${k}`);
	return i >= 0 ? Number(args[i + 1]) : undefined;
};
const edit = nome ? projetos[nome] : undefined;
if (!edit) {
	console.error(`Uso: npm run qualidade -- <projeto> [--de SEG] [--ate SEG]. Projetos: ${Object.keys(projetos).join(', ')}`);
	process.exit(1);
}

// Duração e largura do vídeo de origem.
let duracaoFonte = edit.duracao ?? 60;
let larguraFonte = 0;
const arqVideo = edit.video ? path.join('public', edit.pasta, edit.video) : '';
if (arqVideo && existsSync(arqVideo)) {
	const j = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:format=duration', '-of', 'json', arqVideo]).toString());
	duracaoFonte = Number(j.format?.duration ?? duracaoFonte);
	larguraFonte = Math.min(j.streams?.[0]?.width ?? 0, j.streams?.[0]?.height ?? 0);
}
const m = montar(edit, duracaoFonte);
const de = num('de') ?? 0;
const ate = num('ate') ?? m.duracaoEditada;
const dentro = (t: number) => t >= de - 0.01 && t <= ate + 0.01;
const cruza = (a: number, b: number) => b > de && a < ate;
const fmt = (t: number) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;

const erros: string[] = [];
const avisos: string[] = [];
const oks: string[] = [];

m.problemas.forEach((p) => (p.gravidade === 'erro' ? erros : avisos).push(p.texto));

// Texto que cada cena põe na tela (para leitura, repetição com a legenda e "um texto por vez").
const textoDa = (c: CenaNoPlano): string => {
	const x = c as Record<string, unknown>;
	const partes: string[] = [];
	for (const k of ['texto', 'grande', 'pequeno', 'abaixo', 'rotulo', 'nome', 'titulo', 'linha1', 'linha2', 'valor', 'legenda', 'chip', 'marca']) {
		if (typeof x[k] === 'string' || typeof x[k] === 'number') partes.push(String(x[k]));
	}
	for (const k of ['palavras', 'itens']) {
		const v = x[k];
		if (Array.isArray(v)) v.forEach((i) => partes.push(typeof i === 'string' ? i : String((i as {texto?: string}).texto ?? '')));
	}
	return partes.join(' ').trim();
};
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 2);
const cenas = m.cenas.filter((c) => cruza(c.de, c.ate));
const comTexto = cenas.filter((c) => textoDa(c) && c.tipo !== 'final');

// 1. Um texto por vez.
for (let i = 0; i < comTexto.length; i++) {
	for (let j = i + 1; j < comTexto.length; j++) {
		const a = comTexto[i];
		const b = comTexto[j];
		const sobre = Math.min(a.ate, b.ate) - Math.max(a.de, b.de);
		if (sobre > 0.15) avisos.push(`${fmt(Math.max(a.de, b.de))}: dois textos ao mesmo tempo (${a.tipo} e ${b.tipo}, ${sobre.toFixed(1)} s): polui; um por vez`);
	}
}

// 2. Texto da cena repetindo a legenda visível.
for (const c of comTexto) {
	const palavrasCena = new Set(norm(textoDa(c)));
	const fala = m.legenda.filter((p) => p.de < c.ate && p.ate > c.de).flatMap((p) => p.palavras.map((w) => w.texto)).join(' ');
	const repetidas = norm(fala).filter((w) => palavrasCena.has(w));
	if (repetidas.length >= 2) avisos.push(`${fmt(c.de)}: ${c.tipo} repete a legenda ("${[...new Set(repetidas)].slice(0, 3).join(' ')}"); use esconderLegenda: true`);
}

// 3. Tempo de leitura (≥ 0,3 s por palavra, mínimo 0,6 s).
for (const c of comTexto) {
	// Número de destaque (numero3d) se lê de relance: conta só o texto principal.
	const lido = c.tipo === 'numero3d' ? String((c as {texto?: string}).texto ?? '') : textoDa(c);
	const n = lido.split(/\s+/).filter(Boolean).length;
	const precisa = Math.max(0.6, 0.3 * n);
	if (c.ate - c.de < precisa - 0.05) avisos.push(`${fmt(c.de)}: ${c.tipo} fica ${(c.ate - c.de).toFixed(1)} s para ${n} palavra(s): pouco para ler (≥ ${precisa.toFixed(1)} s)`);
}

// 4. Ritmo: eventos (cena, câmera, corte) a cada ~2 s; mais de 3 no mesmo segundo polui.
const eventos = [...cenas.map((c) => c.de), ...m.camera.map((e) => e.em), ...m.mantidos.slice(1).map((_, i) => m.mantidos.slice(0, i + 1).reduce((s, [a, b]) => s + b - a, 0))]
	.filter(dentro)
	.sort((a, b) => a - b)
	// Corte, zoom e chicote no mesmo instante são um evento só para quem assiste.
	.filter((t, i, v) => i === 0 || t - v[i - 1] > 0.1);
const pontos = [de, ...eventos, ate];
for (let i = 1; i < pontos.length; i++) {
	if (pontos[i] - pontos[i - 1] > 3.2) avisos.push(`${fmt(pontos[i - 1])}–${fmt(pontos[i])}: ${(pontos[i] - pontos[i - 1]).toFixed(1)} s sem nada novo: parado (um evento a cada ~2 s)`);
}
for (const t of eventos) {
	const juntos = eventos.filter((e) => e >= t && e < t + 1).length;
	if (juntos > 4) {
		avisos.push(`${fmt(t)}: ${juntos} eventos no mesmo segundo: poluído`);
		break;
	}
}
if (de < 0.5 && !eventos.some((t) => t < 1.5)) erros.push('Início sem gancho: nada acontece no primeiro 1,5 s');

// 5. Zoom acima do que a resolução aguenta.
const limite = larguraFonte >= 2000 ? 1.7 : larguraFonte >= 1400 ? 1.5 : 1.35;
for (const e of m.camera) {
	if (e.tipo === 'zoom' && dentro(e.em) && e.escala > limite + 0.001) avisos.push(`${fmt(e.em)}: zoom ${e.escala} acima de ${limite} para vídeo de ${larguraFonte || '?'} px: vai borrar`);
}
if (larguraFonte && larguraFonte < 1080) avisos.push(`Vídeo de origem com ${larguraFonte} px no lado menor: prepare com npm run preparar-video para manter a resolução`);

// 6. Cortes no silêncio medido.
const sil = edit.silencios ?? [];
if (edit.trechos || edit.cortes) {
	if (!sil.length) avisos.push('Pausas do áudio ainda não medidas (npm run silencios): os cortes estão pelo tempo do Whisper');
	else {
		const naPausa = (t: number) => sil.some(([a, b]) => t >= a - 0.04 && t <= b + 0.04);
		let acum = 0;
		for (const [a, b] of m.mantidos) {
			const ini = acum;
			acum += b - a;
			if (!cruza(ini, acum)) continue;
			if (a > 0.05 && !naPausa(a)) avisos.push(`${fmt(ini)}: corte começa no meio da fala (${a.toFixed(2)} s da origem)`);
			if (!naPausa(b) && b < duracaoFonte - 0.05) avisos.push(`${fmt(acum)}: corte termina no meio da fala (${b.toFixed(2)} s da origem)`);
		}
	}
}

// 7. Repetição: o mesmo tipo de efeito 3 vezes seguidas cansa; variedade conta como novidade.
const tipos = cenas.map((c) => c.tipo);
for (let i = 2; i < tipos.length; i++) {
	if (tipos[i] === tipos[i - 1] && tipos[i] === tipos[i - 2]) {
		avisos.push(`${fmt(cenas[i].de)}: ${tipos[i]} três vezes seguidas: varie o efeito`);
		break;
	}
}

// 8. Área segura (posições em px num quadro 1080x1920).
for (const c of cenas) {
	const y = (c as {y?: number}).y;
	if (typeof y === 'number' && y > 1 && (y < 200 || y > 1550)) avisos.push(`${fmt(c.de)}: ${c.tipo} em y=${y}px, fora da área segura (200–1550)`);
}

// 9. Duração de Reels/Shorts.
if (edit.formato === 'vertical' && de < 0.5 && ate >= m.duracaoEditada - 0.5 && m.duracaoEditada > 60) avisos.push(`Vídeo com ${m.duracaoEditada.toFixed(0)} s: Reels/Shorts rendem mais até 59 s`);

const variedade = new Set(tipos).size;
oks.push(`${cenas.length} cena(s) de ${variedade} tipo(s), ${eventos.length} evento(s) em ${(ate - de).toFixed(1)} s (${(eventos.length / Math.max(1, ate - de)).toFixed(2)}/s)`);

console.log(`Qualidade de ${nome} (${fmt(de)}–${fmt(ate)})`);
oks.forEach((t) => console.log(`✓ ${t}`));
erros.forEach((t) => console.log(`✗ ${t}`));
avisos.forEach((t) => console.log(`⚠ ${t}`));
console.log(erros.length || avisos.length ? `Resumo: ${erros.length} erro(s), ${avisos.length} aviso(s)` : 'Resumo: tudo certo');
process.exit(erros.length ? 1 : 0);
