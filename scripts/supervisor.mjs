// Mantém o painel de pé: reinicia sozinho se ele cair e quando ele (ou o assistente) pede reinício (POST /api/reiniciar, saída 75).
// Uso: node scripts/supervisor.mjs   (o "Painel - Instalar e Abrir.bat" e o abrir-painel.sh chamam isto)
import {spawn} from 'node:child_process';
import path from 'node:path';

const raiz = path.resolve(import.meta.dirname, '..');
let quedas = [];
const iniciar = () => {
	const p = spawn(process.execPath, ['painel/servidor.mjs'], {cwd: raiz, stdio: 'inherit', env: {...process.env, SUPERVISOR: '1'}});
	p.on('close', (codigo, sinal) => {
		if (sinal === 'SIGINT' || sinal === 'SIGTERM') process.exit(0);
		if (codigo === 0 || codigo === 1) process.exit(codigo ?? 0); // 0: fechado de propósito; 1: porta ocupada/painel já aberto
		if (codigo !== 75) {
			quedas = quedas.filter((t) => Date.now() - t < 60000).concat(Date.now());
			if (quedas.length > 5) {
				console.log('\nO painel caiu 5 vezes em 1 minuto: parei de reiniciar. Veja o erro acima.\n');
				process.exit(codigo ?? 1);
			}
		}
		console.log(codigo === 75 ? '\nReiniciando o painel...\n' : `\nO painel parou (código ${codigo}). Reiniciando em 2 s...\n`);
		setTimeout(iniciar, codigo === 75 ? 300 : 2000);
	});
};
iniciar();
