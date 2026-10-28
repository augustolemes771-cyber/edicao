// Windows com duas placas (integrada + NVIDIA/AMD): marca os programas do render e do Studio como "Alto desempenho" nas
// Configurações de Gráficos do Windows (HKCU\Software\Microsoft\DirectX\UserGpuPreferences, só deste usuário; dá para desfazer
// em Configurações › Sistema › Tela › Elementos gráficos). Sem isso o Chrome do Remotion desenha os quadros na integrada.
// Uso: node scripts/gpu-forte.mjs   (o render-job também chama sozinho; vale a partir do próximo render, sem reabrir o painel)
import {spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, readdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const CHAVE = 'HKCU\\Software\\Microsoft\\DirectX\\UserGpuPreferences';
const NOMES = new Set(['chrome-headless-shell.exe', 'headless_shell.exe', 'chrome.exe']);

// Executáveis do Chrome que o Remotion baixou (node_modules/.remotion/...), procurando até 5 pastas abaixo.
const acharExes = (dir, nivel = 0, achados = []) => {
	if (nivel > 5 || !existsSync(dir)) return achados;
	let itens = [];
	try { itens = readdirSync(dir, {withFileTypes: true}); } catch { return achados; }
	for (const i of itens) {
		const p = path.join(dir, i.name);
		if (i.isDirectory()) acharExes(p, nivel + 1, achados);
		else if (NOMES.has(i.name.toLowerCase())) achados.push(p);
	}
	return achados;
};

export const preferirGpuForte = (raiz) => {
	if (process.platform !== 'win32') return {ok: false, motivo: 'só no Windows'};
	const pf = [process.env.ProgramFiles, process.env['ProgramFiles(x86)'], process.env.LOCALAPPDATA].filter(Boolean);
	const exes = [
		process.execPath,
		process.env.BROWSER,
		...acharExes(path.join(raiz, 'node_modules', '.remotion')),
		...pf.flatMap((b) => [`${b}\\Google\\Chrome\\Application\\chrome.exe`, `${b}\\Microsoft\\Edge\\Application\\msedge.exe`]),
	].filter((e) => e && existsSync(e));
	const marcados = [];
	for (const exe of [...new Set(exes)]) {
		const q = spawnSync('reg', ['query', CHAVE, '/v', exe], {encoding: 'utf8', windowsHide: true});
		if (q.status === 0 && /GpuPreference=2;/.test(q.stdout)) continue;
		const r = spawnSync('reg', ['add', CHAVE, '/v', exe, '/t', 'REG_SZ', '/d', 'GpuPreference=2;', '/f'], {encoding: 'utf8', windowsHide: true});
		if (r.status === 0) marcados.push(exe);
	}
	try {
		mkdirSync(path.join(raiz, '.painel'), {recursive: true});
		writeFileSync(path.join(raiz, '.painel', 'gpu-forte.json'), JSON.stringify({em: Date.now(), exes}, null, 1));
	} catch {}
	return {ok: true, exes, marcados};
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const r = preferirGpuForte(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'));
	if (!r.ok) console.log(`Nada a fazer (${r.motivo}).`);
	else {
		console.log(r.marcados.length ? `Marcados como "Alto desempenho" (placa dedicada):\n${r.marcados.map((e) => `- ${e}`).join('\n')}` : 'Tudo já estava em "Alto desempenho".');
		console.log('Vale a partir do próximo render. O Studio, se estiver aberto, passa a usar a placa dedicada quando for aberto de novo.');
	}
}
