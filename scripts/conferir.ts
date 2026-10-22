// Confere o plano de um projeto antes do render.
// Uso: npm run conferir -- <projeto>
import {execFileSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {faixaAlvo} from '../src/motor/curva';
import {cobertura, formatar, montar} from '../src/motor/plano';
import {projetos} from '../src/projetos';

const nome = process.argv[2] ?? 'exemplo';
const edit = projetos[nome];
if (!edit) {
	console.error(`Projeto "${nome}" não está em src/projetos/index.ts. Existentes: ${Object.keys(projetos).join(', ')}`);
	process.exit(1);
}

let duracaoFonte = edit.duracao ?? 0;
if (edit.video) {
	const arquivo = path.join('public', edit.pasta, edit.video);
	if (!existsSync(arquivo)) {
		console.error(`Vídeo não encontrado: ${arquivo}`);
		process.exit(1);
	}
	duracaoFonte = Number(
		execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', arquivo]).toString(),
	);
}

const m = montar(edit, duracaoFonte);
const linha = (s = '') => console.log(s);

if (m.legenda.length) linha(`Legenda: ${m.legenda.length} telas, estilo ${edit.legenda?.estilo}`);
linha(
	`Projeto ${nome}: fonte ${formatar(duracaoFonte)}, editado ${formatar(m.duracaoEditada)}, ${m.cenas.length} cenas`,
);
if (m.cortes.length) {
	linha(`Cortes (tempo original): ${m.cortes.map(([a, b]) => `${formatar(a)}–${formatar(b)}`).join(', ')}`);
}
linha();
linha('Cenas:');
for (const c of m.cenas) {
	const extras = [
		c.modo,
		c.entra === 'corte' ? 'emenda' : '',
		c.impactoAtivo ? 'impacto' : '',
		c.somFinal ?? 'sem som',
		c.pedidoFalado ? 'pedido falado' : '',
	]
		.filter(Boolean)
		.join(' · ');
	linha(`  ${formatar(c.de)}–${formatar(c.ate)}  ${c.tipo.padEnd(9)} ${extras}`);
}

// Curva de intensidade por janela de 10 s (exceto a tela final).
linha();
linha(
	edit.verificarCurva === false ? 'Curva: checagem desligada neste projeto.' : 'Curva (cobertura por janela de 10 s):',
);
const fimCurva = m.telaFinal ?? m.duracaoEditada;
const fora: string[] = [];
for (let t = 0; edit.verificarCurva !== false && t < fimCurva; t += 10) {
	const ate = Math.min(t + 10, fimCurva);
	if (ate - t < 3) break;
	const valor = cobertura(m.cenas, t, ate);
	const [min, max] = faixaAlvo(t + (ate - t) / 2, m.curva);
	const pedido = m.cenas.some((c) => c.pedidoFalado && c.de < ate && c.ate > t);
	const ok = (valor >= min - 0.05 && valor <= max + 0.05) || (pedido && valor > max);
	const barra = '█'.repeat(Math.round(valor * 20)).padEnd(20, '·');
	linha(
		`  ${formatar(t)}  ${barra} ${(valor * 100).toFixed(0).padStart(3)}%  alvo ${(min * 100).toFixed(0)}–${(max * 100).toFixed(0)}%  ${ok ? 'ok' : 'FORA'}`,
	);
	if (!ok) fora.push(formatar(t));
}

// Distribuição de fundos das telas cheias (skill: ~70% grade, ~20% verde).
const cheias = m.cenas.filter((c) => c.modo === 'cheia' && c.tipo !== 'tela');
const tempoFundo: Record<string, number> = {};
for (const c of cheias) {
	const f = ('fundo' in c && c.fundo) || 'grade';
	tempoFundo[f] = (tempoFundo[f] ?? 0) + (c.ate - c.de);
}
const totalCheia = Object.values(tempoFundo).reduce((a, b) => a + b, 0) || 1;
linha();
linha(
	`Fundos das telas cheias: ${Object.entries(tempoFundo)
		.map(([f, s]) => `${f} ${((s / totalCheia) * 100).toFixed(0)}%`)
		.join(', ')}  (alvo: grade ~70%, verde ~20%, branco pontual)`,
);

const impactoDepois = m.cenas.filter((c) => c.impactoAtivo && c.de >= m.curva.t2).length;
const erros = m.problemas.filter((p) => p.gravidade === 'erro');
const avisos = m.problemas.filter((p) => p.gravidade === 'aviso');
linha();
for (const p of m.problemas)
	linha(
		`${p.gravidade === 'erro' ? 'ERRO ' : 'aviso'} ${p.tempo !== undefined ? formatar(p.tempo) + ' ' : ''}${p.texto}`,
	);
linha();
linha(
	`Resumo: ${erros.length} erro(s), ${avisos.length} aviso(s), ${fora.length} janela(s) fora da curva, ${impactoDepois} impacto(s) depois de t2.`,
);
process.exit(erros.length > 0 || impactoDepois > 0 ? 1 : 0);
