// Um bloco do fluxo por blocos do painel: escolhe o trecho n do vídeo editado (terminando no fim de uma frase), confere a
// qualidade do plano nesse trecho, renderiza só ele, monta uma folha de quadros (2 por segundo) para a revisão visual e
// mede o áudio (pausa morta, estouro).
// Uso: npm run bloco -- <projeto> <n> [--seg 10] [--res 720]
// Saídas: out/<projeto>-bloco-<n>.mp4, out/<projeto>-bloco-<n>-folha.jpg e o resumo no terminal (com a linha do painel).
import {execFileSync, spawn, spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {montar} from '../src/motor/plano';
import {projetos} from '../src/projetos';

const raiz = path.resolve(import.meta.dirname, '..');
process.chdir(raiz);
const args = process.argv.slice(2);
const soltos = args.filter((a, i) => !a.startsWith('--') && !(args[i - 1] ?? '').startsWith('--'));
const [nome, nTxt] = soltos;
const op = (k: string, padrao: number) => {
	const i = args.indexOf(`--${k}`);
	return i >= 0 ? Number(args[i + 1]) : padrao;
};
const edit = nome ? projetos[nome] : undefined;
const n = Number(nTxt);
if (!edit || !Number.isInteger(n) || n < 1) {
	console.error('Uso: npm run bloco -- <projeto> <número do bloco, 1 = começo> [--seg 10] [--res 720]');
	process.exit(1);
}
const seg = Math.min(30, Math.max(4, op('seg', 10)));
const res = [540, 720, 1080].includes(op('res', 720)) ? op('res', 720) : 720;

let duracaoFonte = edit.duracao ?? 60;
const arqVideo = edit.video ? path.join('public', edit.pasta, edit.video) : '';
if (arqVideo && existsSync(arqVideo)) {
	duracaoFonte = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', arqVideo]).toString());
}
const m = montar(edit, duracaoFonte);
const total = m.duracaoEditada;

// Fronteiras dos blocos: a cada ~seg segundos, no fim de frase (tela de legenda) mais perto entre 70% e 150% do alvo.
const fins = [...new Set([...m.legenda.map((p) => p.ate), total])].sort((a, b) => a - b);
const fronteiras = [0];
while (fronteiras.at(-1)! < total - 0.5) {
	const ini = fronteiras.at(-1)!;
	const alvo = ini + seg;
	const candidatos = fins.filter((f) => f >= ini + seg * 0.7 && f <= ini + seg * 1.5);
	let fim = candidatos.length ? candidatos.reduce((a, b) => (Math.abs(b - alvo) < Math.abs(a - alvo) ? b : a)) : Math.min(total, alvo);
	if (total - fim < seg * 0.5) fim = total; // sobra curta vai junto com o último bloco
	fronteiras.push(fim);
}
const blocos = fronteiras.length - 1;
if (n > blocos) {
	console.log(`O vídeo tem ${blocos} bloco(s) de ~${seg} s; o bloco ${n} não existe. Todos aprovados: gere a prévia completa.`);
	process.exit(0);
}
// Andamento do bloco para o painel (fila de tarefas e "% do próximo bloco"): etapas com a porcentagem de cada uma.
const modPend = '../painel/pendencias.mjs';
const {criarPendencias, textoPendencias} = await import(modPend);
const pend = criarPendencias(path.join(raiz, '.painel'));
const ETAPAS = [['qualidade', 'Análise de qualidade'], ['render', 'Render do trecho'], ['quadros', 'Folha de quadros'], ['audio', 'Conferência do áudio']] as const;
const PESO: Record<string, [number, number]> = {qualidade: [10, 15], render: [15, 85], quadros: [85, 92], audio: [92, 95]};
const estadoEtapas: Record<string, {estado: string; pct: number | null}> = Object.fromEntries(ETAPAS.map(([k]) => [k, {estado: 'fila', pct: null}]));
let ultimaGravacao = 0;
const andar = (etapa: string, pct: number | null, extra: Record<string, unknown> = {}, forcar = false) => {
	for (const [k] of ETAPAS) {
		if (k === etapa) estadoEtapas[k] = {estado: pct !== null && pct >= 100 ? 'ok' : 'rodando', pct};
		else if (ETAPAS.findIndex(([x]) => x === k) < ETAPAS.findIndex(([x]) => x === etapa)) estadoEtapas[k] = {estado: 'ok', pct: 100};
	}
	if (!forcar && Date.now() - ultimaGravacao < 700) return;
	ultimaGravacao = Date.now();
	const [a, b] = PESO[etapa] ?? [95, 95];
	pend.gravarBloco(nome!, {n, total: blocos, de: fronteiras[n - 1], ate: fronteiras[n], etapa, pct: Math.round(a + ((b - a) * (pct ?? 0)) / 100), etapas: ETAPAS.map(([k, rot]) => ({nome: rot, ...estadoEtapas[k]})), ...extra});
};
const falhar = (msg: string) => {
	pend.gravarBloco(nome!, {n, total: blocos, etapa: 'erro', pct: 0, erro: msg.slice(0, 300), etapas: ETAPAS.map(([k, rot]) => ({nome: rot, ...estadoEtapas[k]}))});
	console.log(msg);
	process.exit(1);
};

// Pendências do usuário (notas nas imagens da prévia, pedidos pelo assistente): aplicar antes de renderizar.
const abertas = pend.abertas(nome!);
if (abertas.length && !args.includes('--sem-pendencias')) {
	console.log(`PARE: há ${abertas.length} pendência(s) do usuário para aplicar ANTES de renderizar este bloco:\n${textoPendencias(abertas)}`);
	console.log(`Aplique no edit.ts (as que caem em blocos já aprovados também valem: o usuário pediu), marque com\n  node scripts/pendencias.mjs ${nome} feito <id> ...\ne rode o bloco de novo. Diga ao usuário, em 1 linha, o que aplicou.`);
	pend.gravarBloco(nome!, {n, total: blocos, etapa: 'pendencias', pct: 8, etapas: [{nome: `Aplicando ${abertas.length} pendência(s)`, estado: 'rodando', pct: null}, ...ETAPAS.map(([, rot]) => ({nome: rot, estado: 'fila', pct: null}))]});
	process.exit(2);
}

const de = Number(fronteiras[n - 1].toFixed(2));
const ate = Number(fronteiras[n].toFixed(2));
const fmt = (t: number) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;
console.log(`Bloco ${n} de ${blocos}: ${fmt(de)}–${fmt(ate)} (${(ate - de).toFixed(1)} s)`);

// 0. Pausas do áudio (para os cortes caírem no silêncio), se o projeto usa silencios.json e ainda não mediu.
const arqSil = path.join('src/projetos', nome!, 'silencios.json');
if (arqVideo && existsSync(arqVideo) && existsSync(arqSil) && (readFileSync(arqSil, 'utf8').trim().length < 5 || statSync(arqSil).mtimeMs < statSync(arqVideo).mtimeMs)) {
	spawnSync(process.execPath, ['scripts/silencios.mjs', nome!], {encoding: 'utf8'});
}

// 1. Qualidade do plano no trecho (processo novo: lê o silencios.json recém-medido).
andar('qualidade', 0, {}, true);
const q = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/qualidade.ts', nome!, '--de', String(de), '--ate', String(ate)], {encoding: 'utf8'});
const linhasQ = `${q.stdout ?? ''}`.trim().split('\n').slice(1);
console.log(linhasQ.join('\n'));
if (q.status !== 0) falhar('Corrija os erros (✗) antes de renderizar o bloco.');
andar('render', 0, {}, true);

// 2. Render só do trecho: no pod quando ele está ligado (Preferências › Pod ou o interruptor da aba Render), senão aqui.
mkdirSync('out', {recursive: true});
let saidaPod: string | null = null;
let podCfg: {ativo?: boolean; host?: string} | null = null;
try {
	podCfg = JSON.parse(readFileSync('.painel/config.json', 'utf8')).pod ?? null;
} catch {}
if (podCfg?.ativo && podCfg.host && !process.env.SEM_POD) {
	try {
		// Caminho em variável: o painel é JavaScript sem tipos.
		const modPod = '../painel/pod.mjs';
		const {renderNoPod} = await import(modPod);
		console.log(`Renderizando o bloco no pod (${podCfg.host})...`);
		saidaPod = await renderNoPod({
			t: {cancelado: false, procs: new Set()},
			raiz,
			estado: path.join(raiz, '.painel'),
			podCfg,
			projeto: nome!,
			tipo: 'previa',
			res,
			de,
			ate,
			hw: true,
			atualizar: () => {},
		});
	} catch (e) {
		console.log(`⚠ Pod indisponível (${String((e as Error).message).slice(0, 200)}): renderizando neste PC.`);
	}
}
// Render neste PC lendo o progresso (linhas JSON do render-job) para a barra do painel.
const renderLocal = () =>
	new Promise<{status: number | null; stdout: string; stderr: string}>((ok) => {
		const pr = spawn(process.execPath, ['scripts/render-job.mjs', '--projeto', nome!, '--tipo', 'previa', '--res', String(res), '--de', String(de), '--ate', String(ate)], {env: process.env});
		let stdout = '', stderr = '', resto = '';
		pr.stdout.on('data', (d) => {
			stdout += d;
			resto += d;
			const ls = resto.split('\n');
			resto = ls.pop() ?? '';
			for (const l of ls) {
				try {
					const ev = JSON.parse(l);
					if (ev.fase) andar('render', typeof ev.pct === 'number' ? ev.pct : null, {fase: ev.fase});
				} catch {}
			}
		});
		pr.stderr.on('data', (d) => (stderr += d));
		pr.on('close', (status) => ok({status, stdout, stderr}));
	});
const r = saidaPod ? {status: 0, stdout: JSON.stringify({fim: true, saida: saidaPod}), stderr: ''} : await renderLocal();
const eventos = `${r.stdout ?? ''}`.split('\n').filter(Boolean).map((l) => {
	try {
		return JSON.parse(l);
	} catch {
		return {};
	}
});
const erroRender = eventos.find((e) => e.erro)?.erro;
const saidaRender = eventos.find((e) => e.fim)?.saida;
if (r.status !== 0 || !saidaRender) falhar(`Render do bloco falhou: ${String(erroRender ?? r.stderr ?? '').slice(-400)}`);
const video = `out/${nome}-bloco-${n}.mp4`;
renameSync(saidaRender!, video);

// 3. Folha de quadros para a revisão visual (2 por segundo, 6 por linha).
andar('quadros', 0, {}, true);
const folha = `out/${nome}-bloco-${n}-folha.jpg`;
const quadros = Math.ceil((ate - de) * 2);
// Mapa da folha para o painel: clicar num quadro anota uma pendência naquele segundo.
writeFileSync(`out/${nome}-bloco-${n}.json`, JSON.stringify({projeto: nome, n, total: blocos, de, ate, fps: 2, colunas: 6, linhas: Math.ceil(quadros / 6), quadros}));
spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', video, '-vf', `fps=2,scale=240:-2,drawtext=text='%{pts\\:hms}':x=6:y=6:fontsize=16:fontcolor=white:box=1:boxcolor=black@0.5,tile=6x${Math.ceil(quadros / 6)}`, '-frames:v', '1', '-q:v', '4', folha]);
if (!existsSync(folha)) spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', video, '-vf', `fps=2,scale=240:-2,tile=6x${Math.ceil(quadros / 6)}`, '-frames:v', '1', '-q:v', '4', folha]);

// 4. Áudio: pausa morta (> 0,6 s em silêncio) e estouro.
andar('audio', 0, {}, true);
const a = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', video, '-af', 'silencedetect=noise=-38dB:d=0.6,volumedetect', '-f', 'null', '-'], {encoding: 'utf8'}).stderr ?? '';
const pausas = [...a.matchAll(/silence_start: ([\d.]+)[\s\S]*?silence_duration: ([\d.]+)/g)].map((x) => [Number(x[1]), Number(x[2])]);
// Cartão final sem fala não é pausa morta.
const finalDe = m.cenas.find((c) => c.tipo === 'final')?.de ?? Infinity;
pausas.filter(([t]) => de + t < finalDe - 0.3).forEach(([t, d]) => console.log(`⚠ ${fmt(de + t)}: ${d.toFixed(1)} s de silêncio: pausa morta (encaixe o corte na pausa)`));
const pico = Number(/max_volume: (-?[\d.]+) dB/.exec(a)?.[1] ?? -99);
if (pico > -0.5) console.log(`⚠ Áudio estourando (pico ${pico} dB)`);

andar('audio', 100, {etapa: 'revisao', video, folha}, true);
const efeitos = m.cenas.filter((c) => c.ate > de && c.de < ate).map((c) => c.tipo);
console.log(`Vídeo: ${video}\nFolha de quadros (olhe antes de mostrar): ${folha}`);
console.log(`Linha para o painel: [[bloco:${n}/${blocos}|${video}|${efeitos.join(', ') || 'só câmera e legenda'}|${linhasQ.at(-1)?.replace('Resumo: ', '') ?? ''}]]`);
