// Transcreve vários projetos em paralelo sem estourar a memória do PC.
// Uso: node scripts/fila-transcricao.mjs <projeto> [<projeto> ...] [--paralelo 2] [--limite 0.9] [--porjob 3]
//   Cada projeto usa public/projetos/<p>/bruto.mov (ou video.mp4).
//   Só inicia uma transcrição nova se, somando a estimativa dela (--porjob GB, padrão 3), o uso de memória do PC continuar
//   abaixo do limite (padrão 90%). Enquanto não couber, espera. Se a memória passar do limite durante a execução, não inicia
//   mais nada até baixar (as que já rodam continuam).
import {spawn} from 'node:child_process';
import {existsSync, mkdirSync, openSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const opc = (n, p) => (args.includes(n) ? Number(args[args.indexOf(n) + 1]) : p);
const paralelo = opc('--paralelo', 2);
const limite = opc('--limite', 0.9);
const porJob = opc('--porjob', 3) * 1024 ** 3;
const fila = args.filter((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
const raiz = path.resolve(import.meta.dirname, '..');
mkdirSync(path.join(raiz, 'out'), {recursive: true});
const total = os.totalmem();
const usoPct = () => 1 - os.freemem() / total;
// O whisper leva alguns segundos para carregar o modelo: medir só a memória atual deixava a segunda começar antes da primeira
// ocupar a dela (as duas juntas estouraram). Por isso cada job em andamento reserva porJob desde o início, sobre a memória
// medida com a fila parada (base).
let base = total - os.freemem();
const cabe = () => (base + (rodando + 1) * porJob) / total <= limite && (total - os.freemem() + porJob) / total <= limite;
const gb = (b) => (b / 1024 ** 3).toFixed(1);

let rodando = 0, falhas = 0;
const iniciar = (p) => {
	const pasta = path.join(raiz, 'public', 'projetos', p);
	const arq = ['bruto.mov', 'video.mp4'].map((x) => path.join(pasta, x)).find(existsSync);
	if (!arq) { console.log(`${p}: sem vídeo em ${pasta}`); falhas++; return; }
	rodando++;
	const log = openSync(path.join(raiz, 'out', `transc-${p}.log`), 'w');
	const env = {...process.env, ELEVENLABS_API_KEY: ''};
	const t0 = Date.now();
	console.log(`${p}: começou (memória em ${(usoPct() * 100).toFixed(0)}%)`);
	const c = spawn(process.execPath, [path.join(raiz, 'scripts', 'transcrever.mjs'), p, arq], {cwd: raiz, env, stdio: ['ignore', log, log], windowsHide: true});
	c.on('exit', (code) => {
		rodando--;
		if (code !== 0) falhas++;
		console.log(`${p}: ${code === 0 ? 'ok' : `ERRO (código ${code}, ver out/transc-${p}.log)`} em ${Math.round((Date.now() - t0) / 1000)} s`);
	});
};

let pico = 0, avisou = false;
await new Promise((fim) => {
	const tique = () => {
		pico = Math.max(pico, usoPct());
		if (rodando === 0) base = total - os.freemem();
		if (usoPct() > limite && !avisou) { console.log(`Memória em ${(usoPct() * 100).toFixed(0)}% (acima de ${limite * 100}%): segurando a fila.`); avisou = true; }
		if (usoPct() <= limite) avisou = false;
		while (fila.length && rodando < paralelo && cabe()) iniciar(fila.shift());
		if (!fila.length && rodando === 0) return fim();
		setTimeout(tique, 2000);
	};
	tique();
});
console.log(`Fim: ${falhas} falha(s). Pico de memória do PC: ${(pico * 100).toFixed(0)}% (${gb(pico * total)} de ${gb(total)} GB).`);
process.exit(falhas ? 1 : 0);
