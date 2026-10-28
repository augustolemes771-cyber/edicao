// Contexto do painel para o Claude Code aberto direto na pasta (sem o chat do painel): preferências de edição, tema do vídeo,
// regras aprendidas do tema e pendências deixadas no painel (observações nas imagens e nos quadros).
// Uso: node scripts/contexto.mjs [projeto]
import {existsSync, readdirSync} from 'node:fs';
import path from 'node:path';
import {criarConfig, textoPrefs} from '../painel/config.mjs';
import {lerJson} from '../painel/comum.mjs';
import {criarPendencias, textoPendencias} from '../painel/pendencias.mjs';

const raiz = path.resolve(import.meta.dirname, '..');
const estado = path.join(raiz, '.painel');
const projeto = process.argv[2];
const dirTemas = path.join(raiz, 'biblioteca/temas');
const temas = existsSync(dirTemas) ? readdirSync(dirTemas).filter((t) => existsSync(path.join(dirTemas, t, 'tema.json'))) : [];
const tema = (projeto && temas.find((t) => (lerJson(path.join(dirTemas, t, 'tema.json'), {}).projetos ?? []).includes(projeto))) || 'aleatorios';
const linhas = [`Contexto do painel${projeto ? ` para "${projeto}"` : ''} (o usuário faz os pedidos aqui no Claude Code; o painel serve para ver o resultado e deixar observações).`];
linhas.push(`- Tema: ${tema}. Siga as regras de biblioteca/temas/${tema}/aprendizado.md e registre lá as lições novas ("- AAAA-MM-DD (projeto): lição").`);
if (projeto && !existsSync(path.join(raiz, 'src/projetos', projeto))) linhas.push(`- O projeto "${projeto}" ainda não existe: crie com npm run novo e coloque-o em "projetos" de biblioteca/temas/${tema}/tema.json.`);
linhas.push(textoPrefs(criarConfig(raiz, estado).prefs()));
if (projeto) {
	const abertas = criarPendencias(estado).abertas(projeto);
	linhas.push(abertas.length ? `PENDÊNCIAS deixadas no painel (aplique antes de qualquer render e marque: node scripts/pendencias.mjs ${projeto} feito <id> ...):\n${textoPendencias(abertas)}` : '- Sem pendências abertas no painel.');
}
if (projeto) {
	const aj = lerJson(path.join(raiz, 'src/projetos/ajustes.json'), {})[projeto];
	if (aj) linhas.push(`- AJUSTES MANUAIS do usuário no painel (src/projetos/ajustes.json, valem por cima do edit.ts; respeite):\n${JSON.stringify(aj, null, 1).slice(0, 3000)}`);
}
linhas.push('- Os marcadores [[bloco:...]], [[amostra:...]] e [[studio:...]] só viram botões no chat do painel: aqui, diga em texto onde ver (arquivo em out/ ou "abra o vídeo no Studio / aba Prévias do painel").');
console.log(linhas.join('\n'));
