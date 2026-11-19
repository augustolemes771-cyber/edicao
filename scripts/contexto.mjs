// Contexto do painel para o Claude Code aberto direto na pasta (sem o chat do painel): preferências de edição, tema do vídeo,
// regras aprendidas do tema e pendências deixadas no painel (observações nas imagens e nos quadros).
// Uso: node scripts/contexto.mjs [projeto]
import {existsSync, readdirSync} from 'node:fs';
import path from 'node:path';
import {criarConfig, textoPrefs} from '../painel/config.mjs';
import {lerJson} from '../painel/comum.mjs';
import {criarPendencias, textoPendencias} from '../painel/pendencias.mjs';
import {textoCapacidade} from './capacidade.mjs';

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
linhas.push(textoCapacidade());
if (projeto) {
	const abertas = criarPendencias(estado).abertas(projeto);
	linhas.push(abertas.length ? `PENDÊNCIAS deixadas no painel (aplique antes de qualquer render e marque: node scripts/pendencias.mjs ${projeto} feito <id> ...):\n${textoPendencias(abertas)}` : '- Sem pendências abertas no painel.');
}
if (projeto) {
	const aj = lerJson(path.join(raiz, 'src/projetos/ajustes.json'), {})[projeto];
	if (aj) linhas.push(`- AJUSTES MANUAIS do usuário no painel (src/projetos/ajustes.json, valem por cima do edit.ts; respeite):\n${JSON.stringify(aj, null, 1).slice(0, 3000)}`);
}
if (projeto) {
	// Link do Drive anexado no painel: a pasta foi só listada. O usuário escolhe quais arquivos baixar (no painel ou pedindo aqui).
	const drive = lerJson(path.join(estado, 'drive', `${projeto}.json`), null);
	if (drive?.url && drive.lista?.length) {
		const nomes = drive.lista.slice(0, 60).map((a) => a.nome).join(', ');
		const como = `Para baixar: node scripts/baixar-drive.mjs "${drive.url}" public/projetos/${projeto} --so "parte do nome,outra parte" (ou --ids <id1,id2>; confira antes com ls public/projetos/${projeto} o que já está lá).`;
		if (drive.modo === 'ia') {
			linhas.push(`- DRIVE ANEXADO, MODO "SÓ O LINK" (${drive.lista.length} arquivos; nada foi baixado): o usuário passou só o link e espera que VOCÊ puxe o que for preciso, conforme o pedido dele e as regras aprendidas do tema (aprendizado.md). Arquivos: ${nomes}${drive.lista.length > 60 ? ', ...' : ''}. ${como} Baixe só o necessário para o que foi pedido, na ordem em que for usar; vídeo bruto pesado só quando for editá-lo; não precisa perguntar quais arquivos baixar, decida pelo pedido e pelas regras. Se o pedido citar um arquivo ou pasta, use o nome. Se a lista não bastar para decidir, baixe poucos arquivos pequenos, inspecione (ffprobe, transcrição) e então puxe o resto.`);
		} else {
			linhas.push(`- DRIVE ANEXADO (${drive.lista.length} arquivos, nada é baixado sem o usuário pedir): ${nomes}${drive.lista.length > 60 ? ', ...' : ''}. ${como} Nunca baixe a pasta inteira sem o usuário pedir.`);
		}
	}
}
linhas.push('- Os marcadores [[bloco:...]], [[amostra:...]] e [[studio:...]] só viram botões no chat do painel: aqui, diga em texto onde ver (arquivo em out/ ou "abra o vídeo no Studio / aba Prévias do painel").');
console.log(linhas.join('\n'));
