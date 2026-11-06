// Quantos agentes (subagentes do Claude Code) este PC aguenta ao mesmo tempo, medido na hora: memória livre e núcleos.
// Os agentes rodam na nuvem; o que pesa aqui é o que cada um roda no PC. Medido em 05/11/2026 (i5-11400F, 16 GB, RTX 3050):
// o passo mais pesado de um agente é o still com empacotamento novo (~0,85 GB a mais, pico de ~20% da CPU); tsc e
// qualidade.ts pesam menos. Por agente: 1 GB e 2 threads. Reserva fixa de 2,5 GB para Studio, navegador e painel.
// Uso: node scripts/capacidade.mjs   (o contexto.mjs já imprime a linha)
import os from 'node:os';
import {pathToFileURL} from 'node:url';

export const POR_AGENTE_GB = 1;
export const RESERVA_GB = 2.5;

export const capacidade = () => {
	const livreGB = os.freemem() / 2 ** 30;
	const threads = os.cpus().length;
	const porMemoria = Math.floor((livreGB - RESERVA_GB) / POR_AGENTE_GB);
	const porCpu = Math.floor(threads / 2);
	const max = Math.max(1, Math.min(porMemoria, porCpu));
	return {max, livreGB: +livreGB.toFixed(1), totalGB: +(os.totalmem() / 2 ** 30).toFixed(1), threads, limite: porMemoria <= porCpu ? 'memória' : 'CPU'};
};

export const textoCapacidade = () => {
	const c = capacidade();
	return `- AGENTES EM PARALELO: este PC aguenta ${c.max} agente(s) ao mesmo tempo agora (${c.livreGB} de ${c.totalGB} GB livres, ${c.threads} threads; limite: ${c.limite}).
  Use o máximo: divida o trabalho em ${c.max} partes independentes (ex.: trechos/cenas do vídeo, peças novas, análise de referência) e
  dispare os ${c.max} agentes NUMA SÓ mensagem. Modelos: Sonnet nas cenas/peças (esforço baixo nas simples, médio nas elaboradas), Opus médio
  só para base nova de estilo. Regras para não se atrapalharem: cada agente escreve só nos próprios arquivos (ex.: src/projetos/<projeto>/
  cenas-<n>.tsx ou peça nova em src/pecas) e devolve as cenas como texto; só você (o principal) mexe no edit.ts, no index.ts e no registro.
  Still de agente sempre com saída própria (npm run still -- <projeto> --quadro N --saida out/still-<projeto>-<agente>.jpg). Render de
  prévia/final: um por vez, só pelo principal. Antes de juntar, rode de novo \`node scripts/capacidade.mjs\` se for disparar outra leva.`;
};

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) console.log(textoCapacidade());
