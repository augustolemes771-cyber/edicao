// Hook PostToolUse do Claude: entrega ao Claude, no próximo passo, as mensagens que o usuário mandou enquanto ele trabalhava (fila do painel).
import {existsSync, readFileSync, renameSync, rmSync} from 'node:fs';

const arq = process.env.PAINEL_FILA;
if (arq && existsSync(arq)) {
	// Renomeia antes de ler: mensagem que o painel gravar agora vai para um arquivo novo, em vez de sumir no rmSync.
	const lendo = `${arq}.${process.pid}`;
	let msgs = [];
	try {
		renameSync(arq, lendo);
		msgs = JSON.parse(readFileSync(lendo, 'utf8'));
	} catch {}
	try { rmSync(lendo, {force: true}); } catch {}
	if (msgs.length) {
		const texto = `MENSAGEM DO USUÁRIO enviada enquanto você trabalhava (leia agora, ajuste o que está fazendo se precisar e responda a ela no fim):\n${msgs.map((m) => `- ${m}`).join('\n')}`;
		process.stdout.write(JSON.stringify({hookSpecificOutput: {hookEventName: 'PostToolUse', additionalContext: texto}}));
	}
}
