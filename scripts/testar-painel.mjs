// Teste rápido do painel: confere a sintaxe dos arquivos, sobe uma cópia na porta 4999 e chama as rotas principais.
//   npm run testar-painel
import {spawn, spawnSync} from 'node:child_process';
import {readdirSync} from 'node:fs';
import path from 'node:path';

const raiz = path.resolve(import.meta.dirname, '..');
let falhas = 0;
const ok = (nome, bom, detalhe = '') => {
	console.log(`${bom ? '✓' : '✗'} ${nome}${bom || !detalhe ? '' : ' — ' + detalhe}`);
	if (!bom) falhas++;
};
for (const dir of ['painel', 'scripts', 'painel/web']) {
	for (const f of readdirSync(path.join(raiz, dir)).filter((x) => /\.(mjs|js)$/.test(x))) {
		const r = spawnSync(process.execPath, ['--check', path.join(raiz, dir, f)], {encoding: 'utf8'});
		ok(`sintaxe ${dir}/${f}`, r.status === 0, r.stderr.trim().split('\n')[0]);
	}
}
const srv = spawn(process.execPath, ['painel/servidor.mjs'], {cwd: raiz, env: {...process.env, PORTA: '4999', SEM_NAVEGADOR: '1'}});
let saida = '';
srv.stdout.on('data', (d) => (saida += d));
srv.stderr.on('data', (d) => (saida += d));
const espera = async () => { for (let i = 0; i < 40 && !/#\w+/.test(saida); i++) await new Promise((r) => setTimeout(r, 250)); };
await espera();
const token = /#(\w+)/.exec(saida)?.[1];
ok('painel sobe na porta 4999', !!token, saida.slice(-200));
if (token) {
	const get = (rota) => fetch(`http://127.0.0.1:4999${rota}`, {headers: {'x-painel-token': token}}).catch((e) => ({ok: false, status: String(e)}));
	for (const rota of ['/', '/api/claude', '/api/tarefas']) {
		const r = await get(rota);
		ok(`GET ${rota}`, r.ok, `status ${r.status}`);
	}
}
srv.kill();
console.log(falhas ? `\n${falhas} falha(s).` : '\nTudo certo.');
process.exit(falhas ? 1 : 0);
