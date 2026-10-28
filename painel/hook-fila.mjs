// Hook PostToolUse do Claude: entrega ao Claude, no próximo passo, as mensagens que o usuário mandou enquanto ele trabalhava (fila do painel).
import {existsSync, readFileSync, rmSync} from 'node:fs';

const arq = process.env.PAINEL_FILA;
if (arq && existsSync(arq)) {
	let msgs = [];
	try { msgs = JSON.parse(readFileSync(arq, 'utf8')); } catch {}
	try { rmSync(arq, {force: true}); } catch {}
	if (msgs.length) {
		const texto = `MENSAGEM DO USUÁRIO enviada enquanto você trabalhava (leia agora, ajuste o que está fazendo se precisar e responda a ela no fim):\n${msgs.map((m) => `- ${m}`).join('\n')}`;
		process.stdout.write(JSON.stringify({hookSpecificOutput: {hookEventName: 'PostToolUse', additionalContext: texto}}));
	}
}
