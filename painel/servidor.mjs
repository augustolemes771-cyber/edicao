// Painel de edição: servidor local sem dependências. Uso: npm run painel
// Recebe o pedido em texto, chama o Claude Code (a conta que estiver logada neste computador) dentro do projeto e
// mostra a biblioteca, as prévias e o Remotion Studio. A biblioteca e os projetos vivem no git: qualquer PC igual.
//
// Segurança: o painel executa o Claude Code com acesso ao projeto, então só aceita conexões de 127.0.0.1, exige um
// token aleatório (gerado a cada início e impresso no terminal) e recusa Host/Origin que não sejam o próprio painel.
// Assim nenhum site aberto no navegador consegue mandar pedidos para ele.
import {createServer} from 'node:http';
import {spawn, execFile, execFileSync} from 'node:child_process';
import {randomBytes, timingSafeEqual} from 'node:crypto';
import {createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync} from 'node:fs';
import {pipeline} from 'node:stream/promises';
import path from 'node:path';
import {criarConfig, escolherModelo, textoPrefs} from './config.mjs';
import {dentro, lerJson, matar} from './comum.mjs';
import {fluxo} from './fluxo.mjs';
import {criarHistorico} from './historico.mjs';
import {criarAndamento} from './andamento.mjs';
import {criarApagar} from './apagar.mjs';
import {testarPod} from './pod.mjs';
import {criarTarefas} from './tarefas.mjs';
import {criarPendencias, textoPendencias} from './pendencias.mjs';

const raiz = path.resolve(import.meta.dirname, '..');
const porta = Number(process.env.PORTA ?? 4000);
const estado = path.join(raiz, '.painel');
mkdirSync(estado, {recursive: true});
// O token fica guardado neste PC (.painel/token, fora do git): se o painel já estiver aberto e o atalho for clicado de
// novo, a segunda cópia só abre o navegador no painel que já está rodando.
const arqToken = path.join(estado, 'token');
const token = (() => {
	try {
		const t = readFileSync(arqToken, 'utf8').trim();
		if (/^[a-f0-9]{48}$/.test(t)) return t;
	} catch {}
	const t = randomBytes(24).toString('hex');
	writeFileSync(arqToken, t);
	return t;
})();
const arqSessoes = path.join(estado, 'sessoes.json');
const ler = (f, padrao) => {
	try {
		return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : padrao;
	} catch {
		return padrao;
	}
};
const sessoes = ler(arqSessoes, {});
const cfg = criarConfig(raiz, estado);
const historico = criarHistorico(estado);

const json = (res, dados, codigo = 200) => {
	res.writeHead(codigo, {'content-type': 'application/json; charset=utf-8'});
	res.end(JSON.stringify(dados));
};
const corpo = (req) =>
	new Promise((ok, falha) => {
		let t = '';
		req.on('data', (c) => {
			t += c;
			if (t.length > 2e6) req.destroy();
		});
		req.on('end', () => {
			try {
				ok(t ? JSON.parse(t) : {});
			} catch {
				falha(Object.assign(new Error('Corpo da requisição inválido'), {codigo: 400}));
			}
		});
	});
// No Windows, npm/claude/npx são .cmd e só rodam por shell. Por isso nada digitado pelo usuário vai nos argumentos:
// o pedido vai pela entrada padrão e a instrução do painel por arquivo.
const ehWin = process.platform === 'win32';
const rodar = (cmd, args, opcoes = {}) => spawn(cmd, args, {cwd: raiz, env: process.env, shell: ehWin, ...opcoes});
const testar = (cmd, args) =>
	new Promise((ok) => {
		const pr = rodar(cmd, args, {stdio: 'ignore'});
		pr.on('error', () => ok(false));
		pr.on('close', (c) => ok(c === 0));
	});
// O npm instala o claude numa pasta que pode não estar no PATH deste processo.
try {
	const prefixo = execFileSync(ehWin ? 'npm.cmd' : 'npm', ['prefix', '-g'], {encoding: 'utf8', shell: ehWin}).trim();
	process.env.PATH += path.delimiter + (ehWin ? prefixo : path.join(prefixo, 'bin'));
} catch {}
const git = (...args) => execFileSync('git', args, {cwd: raiz, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']});
// Ao fechar, o git roda num grupo separado (e escondido) para o Ctrl+C / fechar a janela não matarem o envio no meio.
let gitSeparado = false;
const gitAsync = (...args) =>
	new Promise((ok, falha) => execFile('git', args, {cwd: raiz, encoding: 'utf8', ...(gitSeparado ? {detached: true, windowsHide: true} : {})}, (e, saida, erro) => (e ? falha(Object.assign(e, {stderr: erro})) : ok(saida))));
// Salvar no git (botão "Salvar" e o salvamento automático depois de cada pedido).
// Um salvamento por vez; se já há um rodando, quem chega espera o mesmo.
let salvando = null;
const salvarGit = (mensagem) => {
	salvando ??= (async () => {
		// Sem identidade do git neste PC o commit falha ("Please tell me who you are"): define uma só neste repositório.
		if (!(await gitAsync('config', 'user.email').catch(() => '')).trim()) await gitAsync('config', 'user.email', 'painel@edicao.local');
		if (!(await gitAsync('config', 'user.name').catch(() => '')).trim()) await gitAsync('config', 'user.name', 'Painel de Edição');
		await gitAsync('add', '-A');
		if ((await gitAsync('status', '--porcelain')).trim()) await gitAsync('commit', '-m', String(mensagem || 'Edição pelo painel').slice(0, 200));
		else {
			// Nada novo, mas pode ter ficado algo salvo neste PC sem enviar (ex.: a janela fechou no meio do envio).
			const pendentes = Number((await gitAsync('rev-list', '--count', '@{u}..HEAD').catch(() => '0')).trim()) || 0;
			if (!pendentes) return 'Nada novo para salvar.';
		}
		return (await gitAsync('push').catch((e) => `Salvo neste PC, mas o envio falhou: ${String(e.stderr || e.message).slice(-300)}`)) || 'Salvo e enviado.';
	})().finally(() => (salvando = null));
	return salvando;
};
// Salvamento automático ao fechar o painel (preferência "Salvar na nuvem ao fechar o painel", ligada por padrão).
const salvarAoFechar = (limiteMs) => {
	// SEM_SALVAR=1: cópias de teste (testar-painel, agentes) não fazem commit/push do que estiver na pasta ao serem encerradas.
	if (!cfg.prefs().salvarAoFechar || process.env.SEM_SALVAR) return Promise.resolve();
	const salvar = salvarGit('Salvamento automático ao fechar o painel')
		.then((s) => console.log(`Nuvem: ${String(s).trim().split('\n').at(-1) || 'ok'}`))
		.catch((e) => console.log(`Nuvem: não consegui salvar (${String(e.stderr || e.message).trim().slice(-200)})`));
	return limiteMs ? Promise.race([salvar, new Promise((ok) => setTimeout(ok, limiteMs))]) : salvar;
};
const nomeValido = (n) => !n || /^[a-z0-9-]+$/.test(n);

// ---------- Biblioteca ----------
const comentario = (arq) => {
	const linhas = readFileSync(arq, 'utf8').split('\n');
	return linhas.filter((l) => l.startsWith('//')).slice(0, 3).map((l) => l.replace(/^\/\/\s?/, '')).join(' ').trim();
};
const biblioteca = () => {
	const pecas = readdirSync(path.join(raiz, 'src/pecas'))
		.filter((f) => f.endsWith('.tsx'))
		.map((f) => ({nome: f.replace('.tsx', ''), arquivo: `src/pecas/${f}`, descricao: comentario(path.join(raiz, 'src/pecas', f))}));
	const obj3d = path.join(raiz, 'src/pecas/tres/Objetos3D.tsx');
	const modelos3d = existsSync(obj3d)
		? [...readFileSync(obj3d, 'utf8').matchAll(/export const (\w+)/g)].map((m) => ({nome: m[1], arquivo: 'src/pecas/tres/Objetos3D.tsx'}))
		: [];
	const blender = existsSync(path.join(raiz, 'scripts/blender'))
		? readdirSync(path.join(raiz, 'scripts/blender')).filter((f) => f.endsWith('.py')).map((f) => ({nome: f.replace('.py', ''), arquivo: `scripts/blender/${f}`}))
		: [];
	const templates = readdirSync(path.join(raiz, 'src/projetos'), {withFileTypes: true})
		.filter((d) => d.isDirectory())
		.map((d) => {
			const edit = path.join(raiz, 'src/projetos', d.name, 'edit.ts');
			const vertical = existsSync(edit) && /formato:\s*'vertical'/.test(readFileSync(edit, 'utf8'));
			return {nome: d.name, formato: vertical ? 'vertical' : 'horizontal', arquivo: `src/projetos/${d.name}/edit.ts`};
		});
	const sfx = existsSync(path.join(raiz, 'public/sfx')) ? readdirSync(path.join(raiz, 'public/sfx')).filter((f) => f.endsWith('.wav')).map((f) => f.replace('.wav', '')) : [];
	const fontes = {};
	for (const f of readdirSync(path.join(raiz, 'public/fontes')).filter((f) => f.endsWith('.woff2') && !f.includes('-ext-'))) {
		const m = /^(.+)-latin-(\d+)-(normal|italic)\.woff2$/.exec(f);
		if (m) (fontes[m[1]] ??= []).push({arquivo: f, peso: Number(m[2]), estilo: m[3]});
	}
	const referencias = existsSync(path.join(raiz, 'docs/referencias')) ? readdirSync(path.join(raiz, 'docs/referencias')).filter((f) => f.endsWith('.md')) : [];
	const dirItens = path.join(raiz, 'biblioteca/itens');
	const salvos = existsSync(dirItens) ? readdirSync(dirItens).filter((f) => f.endsWith('.json')).map((f) => ler(path.join(dirItens, f), {})) : [];
	return {pecas, modelos3d, blender, templates, sfx, fontes, referencias, salvos, pack: pack()};
};

// ---------- Pack de efeitos ----------
// Catálogo em biblioteca/pack/catalogo.json (git). Os arquivos ficam em biblioteca/pack/arquivos ou, se o pack foi
// catalogado no lugar, na pasta gravada em .painel/pack.json ({raiz}), que é deste PC.
const raizesPack = () => {
	const r = lerJson(path.join(estado, 'pack.json'), {})?.raiz;
	const local = typeof r === 'string' && path.isAbsolute(r) && existsSync(r) ? [path.resolve(r)] : [];
	// Pastas de pack vinculadas ao Drive (scripts/drive.mjs config), também deste PC.
	const drive = (lerJson(path.join(estado, 'drive.json'), {})?.packs ?? []).filter((p) => typeof p === 'string' && path.isAbsolute(p) && existsSync(p)).map((p) => path.resolve(p));
	return [...local, ...drive, path.join(raiz, 'biblioteca/pack/arquivos')];
};
// Primeiro na pasta de .painel/pack.json, depois em biblioteca/pack/arquivos; sempre preso dentro da pasta.
const acharPack = (rel, raizes = raizesPack()) => {
	for (const base of raizes) {
		const f = dentro(base, rel);
		if (f && existsSync(f) && statSync(f).isFile()) return f;
	}
	return null;
};
const pack = () => {
	const cat = lerJson(path.join(raiz, 'biblioteca/pack/catalogo.json'), []);
	const itens = Array.isArray(cat) ? cat : Array.isArray(cat?.itens) ? cat.itens : [];
	const raizes = raizesPack();
	return itens.filter((i) => i && typeof i.arquivo === 'string').map((i) => ({...i, baixado: Boolean(acharPack(i.arquivo, raizes))}));
};

// ---------- Mídias e referências de cada vídeo ----------
// Mídias: public/projetos/<projeto>/ (o que o vídeo usa). Referências: public/projetos/<projeto>/referencias/ (arquivos) e
// src/projetos/<projeto>/referencias.md (links e observações, que vão para o git). Os arquivos de mídia não vão para o git.
const EXTENSOES = /\.(mp4|mov|m4v|webm|mkv|mp3|wav|m4a|aac|png|jpe?g|webp|gif|svg|pdf|txt|md|json|srt)$/i;
const projetoOk = (n) => typeof n === 'string' && /^[a-z0-9-]+$/.test(n) && existsSync(path.join(raiz, 'src/projetos', n));
const pastaMidia = (proj, tipo) => path.join(raiz, 'public/projetos', proj, tipo === 'referencias' ? 'referencias' : '');
const nomeArquivo = (n) => path.basename(String(n ?? '')).replace(/[^\w.\- ()]/g, '_').slice(0, 120);
const listarMidias = (proj, tipo) => {
	const dir = pastaMidia(proj, tipo);
	if (!existsSync(dir)) return [];
	return readdirSync(dir, {withFileTypes: true})
		.filter((d) => d.isFile() && EXTENSOES.test(d.name))
		.map((d) => ({nome: d.name, tamanho: statSync(path.join(dir, d.name)).size}))
		.sort((a, b) => a.nome.localeCompare(b.nome));
};
// Grupos de mídia: arquivos que o usuário juntou para virar UM vídeo. modo "todos" = usar todos na ordem; "ia" = a IA escolhe o que usar.
// Fica em src/projetos/<projeto>/grupos-midia.json (vai para o git, sem os arquivos).
const arqGrupos = (proj) => path.join(raiz, 'src/projetos', proj, 'grupos-midia.json');
const lerGrupos = (proj) => {
	const existentes = new Set(listarMidias(proj, 'midias').map((m) => m.nome));
	const g = lerJson(arqGrupos(proj), {grupos: []})?.grupos;
	return (Array.isArray(g) ? g : [])
		.map((x) => ({nome: String(x?.nome ?? '').slice(0, 60), modo: x?.modo === 'ia' ? 'ia' : 'todos', ordem: x?.ordem === 'ia' ? 'ia' : 'minha', arquivos: (Array.isArray(x?.arquivos) ? x.arquivos : []).map(String).filter((a) => existentes.has(a))}))
		.filter((x) => x.arquivos.length >= 2);
};
const textoGrupos = (proj) =>
	lerGrupos(proj)
		.map((g, i) => `- Vídeo único${g.nome ? ` "${g.nome}"` : ` ${i + 1}`}: ${g.arquivos.join(', ')}. ${g.modo === 'todos' ? 'USE TODOS estes arquivos' : 'A IA escolhe: use só os arquivos e trechos necessários para cumprir o pedido e descarte o resto'}${g.ordem === 'ia' ? '; a ORDEM é a IA quem define (a da lista é só a de seleção: reordene para o melhor roteiro e ritmo)' : '; mantenha ESTA ORDEM'}.`)
		.join('\n');
// Arquivos de grupos "usar todos" que o edit.ts não menciona (a edição não usou esse material).
const midiasNaoUsadas = (proj) => {
	if (!projetoOk(proj)) return [];
	const edit = path.join(raiz, 'src/projetos', proj, 'edit.ts');
	const codigo = existsSync(edit) ? readFileSync(edit, 'utf8').toLowerCase() : '';
	const obrig = [...new Set(lerGrupos(proj).filter((g) => g.modo === 'todos').flatMap((g) => g.arquivos))];
	return obrig.filter((a) => !codigo.includes(a.toLowerCase()) && !codigo.includes(a.toLowerCase().replace(/[.][^.]+$/, '')));
};
const arqNotas = (proj) => path.join(raiz, 'src/projetos', proj, 'referencias.md');
const resumoMidias = (proj) => {
	if (!projetoOk(proj)) return '';
	const lista = (t) => listarMidias(proj, t).map((m) => m.nome).join(', ') || '(nenhuma)';
	const notas = existsSync(arqNotas(proj)) ? readFileSync(arqNotas(proj), 'utf8').trim() : '';
	return `
Mídias do vídeo (public/projetos/${proj}/): ${lista('midias')}.
Referências (public/projetos/${proj}/referencias/): ${lista('referencias')}.${textoGrupos(proj) ? `\nGrupos de mídia que o usuário definiu (cada grupo é UM vídeo montado com aqueles arquivos; as mídias fora de grupos são material solto):\n${textoGrupos(proj)}` : ''}
${notas ? `Links e observações do usuário sobre as referências:\n${notas}\n` : ''}Use as mídias listadas como material do vídeo (se o vídeo principal não se chamar video.mp4, ajuste "video" em edit.ts). As referências mostram o estilo que o
usuário quer: olhe as imagens e extraia quadros dos vídeos com ffmpeg para ver, e copie o jeito de editar (ritmo, tipografia, efeitos), sem copiar o conteúdo.`;
};

// ---------- Tarefas (prévia, final, transcrever, link, pack, pod...) ----------
const tarefas = criarTarefas({raiz, estado, cfg, projetoOk, pastaMidia, temaOk: (id) => temaOk(id), pastaModelos: (id) => pastaModelos(id)});

// ---------- Projetos novos, prompts e pastas ----------
const arqPrompts = path.join(raiz, 'biblioteca/prompts.json');
const criarProjeto = ({nome, tema, formato}) => {
	const id = slug(nome ?? '');
	if (!id || id.length > 60) throw Object.assign(new Error('Nome do projeto inválido'), {codigo: 400});
	if (existsSync(path.join(raiz, 'src/projetos', id))) throw Object.assign(new Error('Já existe um projeto com esse nome'), {codigo: 400});
	const vertical = (formato ?? cfg.prefs().formatoPadrao) === 'vertical';
	execFileSync(process.execPath, [path.join(raiz, 'scripts/novo.mjs'), id, ...(vertical ? ['--vertical'] : [])], {cwd: raiz, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']});
	const idTema = nomeValido(tema) && tema && existsSync(path.join(dirTemas, tema, 'tema.json')) ? tema : 'aleatorios';
	const arqTema = path.join(dirTemas, idTema, 'tema.json');
	const t = ler(arqTema, {nome: idTema, descricao: '', projetos: []});
	t.projetos = [...new Set([...(t.projetos ?? []), id])];
	mkdirSync(path.dirname(arqTema), {recursive: true});
	writeFileSync(arqTema, JSON.stringify(t, null, 1));
	return {nome: id, tema: idTema, formato: vertical ? 'vertical' : 'horizontal'};
};
const abrirPasta = (dir) => {
	mkdirSync(dir, {recursive: true});
	const [cmd, ...a] = ehWin ? ['explorer.exe'] : process.platform === 'darwin' ? ['open'] : ['xdg-open'];
	spawn(cmd, [...a, dir], {stdio: 'ignore', detached: true}).on('error', () => {}).unref();
};

// ---------- Temas ----------
const dirTemas = path.join(raiz, 'biblioteca/temas');
// Vídeos modelo de cada tema: o vídeo fica só neste PC (biblioteca/temas/<tema>/modelos/, fora do git) e a análise
// que o Claude escreve (<nome>.md, ao lado) vai para o git e serve de base de estilo e roteiro para o tema.
const VIDEO = /\.(mp4|mov|m4v|webm|mkv)$/i;
const temaOk = (id) => typeof id === 'string' && /^[a-z0-9-]+$/.test(id) && existsSync(path.join(dirTemas, id, 'tema.json'));
const pastaModelos = (id) => path.join(dirTemas, id, 'modelos');
const listarModelos = (id) => {
	const dir = pastaModelos(id);
	if (!existsSync(dir)) return [];
	const arqs = readdirSync(dir);
	const videos = arqs.filter((f) => VIDEO.test(f));
	// Análises cujo vídeo não está neste PC também aparecem (vieram de outro computador pelo git).
	const soAnalise = arqs.filter((f) => f.endsWith('.md') && !videos.some((v) => v.replace(VIDEO, '') === f.slice(0, -3)));
	return [
		...videos.map((f) => ({nome: f, tamanho: statSync(path.join(dir, f)).size, video: true, analise: arqs.includes(f.replace(VIDEO, '.md')) ? `biblioteca/temas/${id}/modelos/${f.replace(VIDEO, '.md')}` : null})),
		...soAnalise.map((f) => ({nome: f.slice(0, -3), tamanho: 0, video: false, analise: `biblioteca/temas/${id}/modelos/${f}`})),
	].sort((a, b) => a.nome.localeCompare(b.nome));
};
const temas = () => {
	const formatos = Object.fromEntries(biblioteca().templates.map((t) => [t.nome, t.formato]));
	const lista = existsSync(dirTemas)
		? readdirSync(dirTemas, {withFileTypes: true}).filter((d) => d.isDirectory() && existsSync(path.join(dirTemas, d.name, 'tema.json'))).map((d) => {
				const t = ler(path.join(dirTemas, d.name, 'tema.json'), {});
				const ap = path.join(dirTemas, d.name, 'aprendizado.md');
				const regras = existsSync(ap) ? readFileSync(ap, 'utf8').split('\n').filter((l) => l.startsWith('- ')).length : 0;
				return {id: d.name, nome: t.nome ?? d.name, descricao: t.descricao ?? '', regras, modelos: listarModelos(d.name).length, projetos: (t.projetos ?? []).filter((n) => n in formatos).map((n) => ({nome: n, formato: formatos[n]}))};
			})
		: [];
	const usados = new Set(lista.flatMap((t) => t.projetos.map((p) => p.nome)));
	const semTema = Object.keys(formatos).filter((n) => !usados.has(n)).map((n) => ({nome: n, formato: formatos[n]}));
	return {temas: lista, semTema};
};
const slug = (n) => String(n).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const projetos = () => {
	const dir = path.join(raiz, 'src/projetos');
	const saidas = existsSync(path.join(raiz, 'out')) ? readdirSync(path.join(raiz, 'out')).filter((f) => f.endsWith('.mp4')) : [];
	return readdirSync(dir, {withFileTypes: true})
		.filter((d) => d.isDirectory())
		.map((d) => ({
			nome: d.name,
			videos: saidas
				.filter((f) => f.startsWith(d.name))
				.map((f) => ({arquivo: f, data: statSync(path.join(raiz, 'out', f)).mtimeMs}))
				.sort((a, b) => b.data - a.data),
		}));
};

// ---------- Google Drive para computador (vínculo das pastas, sem importar) ----------
// scripts/drive.mjs faz o trabalho; o vínculo fica em .painel/drive.json (deste PC). "Puxar" roda em segundo plano.
const driveJob = {rodando: false, fase: '', resultado: null, erro: ''};
const rodarDrive = (args) =>
	new Promise((ok, falha) => {
		const p = spawn(process.execPath, [path.join(raiz, 'scripts/drive.mjs'), ...args], {cwd: raiz, stdio: ['ignore', 'pipe', 'pipe']});
		let o = '', e = '';
		p.stdout.on('data', (d) => (o += d));
		p.stderr.on('data', (d) => (e += d));
		p.on('error', falha);
		p.on('close', (c) => {
			const linha = (c === 0 ? o : e || o).trim().split('\n').pop() ?? '';
			let j = null;
			try { j = JSON.parse(linha); } catch {}
			if (c === 0) ok(j ?? {}); else falha(new Error(j?.erro ?? (linha || `drive.mjs saiu com ${c}`)));
		});
	});
const statusDrive = async () => ({...(await rodarDrive(['detectar'])), vinculo: lerJson(path.join(estado, 'drive.json'), null), job: driveJob});
const puxarDrive = () => {
	if (driveJob.rodando) return;
	Object.assign(driveJob, {rodando: true, fase: 'copiando vídeos, projetos e modelos', resultado: null, erro: ''});
	rodarDrive(['puxar'])
		.then((r) => Object.assign(driveJob, {resultado: r}))
		.catch((e) => (driveJob.erro = e.message))
		.finally(() => (driveJob.rodando = false));
};

// ---------- Chat com o Claude Code ----------
const instrucao = (projeto, tema, primeira, assistente = false) => {
	const t = tema || 'aleatorios';
	if (assistente) return instrucaoAssistente(projeto, t);
	return `PAINEL DE EDIÇÃO do canal Mateus Dias. O usuário pede em texto e você edita. Projeto: "${projeto || 'nenhum (npm run novo se for vídeo novo)'}". Tema: "${t}".${primeira ? resumoMidias(projeto) : projetoOk(projeto) && textoGrupos(projeto) ? `\nGrupos de mídia (cada grupo é UM vídeo montado com aqueles arquivos):\n${textoGrupos(projeto)}` : ''}
ECONOMIA DE LIMITE (prioridade máxima, sem baixar a qualidade da edição):
- Responda em português, em no máximo 3 linhas; nada de narrar o que vai fazer nem repetir o que já disse. Sem código para o usuário: diga o que mudou e como ver (prévia ou Studio).
- Nunca releia arquivo já lido nesta conversa. Arquivo grande (transcrição, edit.ts, JSON): Grep ou Read com offset/limit, nunca inteiro sem necessidade. Junte comandos independentes numa só chamada.
- Não use subagentes. Não gere stills, prévias nem conferências que o pedido não exige (o npm run bloco do fluxo por blocos é exigido); rode a conferência (npm run conferir) uma vez, antes da prévia.
- Vídeo vertical (Reels/Shorts/TikTok): use também a skill .claude/skills/it-reelsmaker (corte por áudio, câmera virtual, legenda por palavra, recorte, rostos, master −14 LUFS, checklist). O SKILL.md dela é GRANDE: nunca leia inteiro. Veja os títulos com Grep "^## " e leia só a seção do passo atual (offset/limit); scripts em .claude/skills/it-reelsmaker/scripts (use references/scripts.md só para achar o comando certo). A composição continua nas peças do painel.
- Vídeo novo ou sem transcrição: NÃO explore com ls/ffprobe/cat soltos. Rode 'npm run preparar -- <projeto>' (mídia + transcrição + roteiro numa só chamada) e escreva o edit.ts pelo guia docs/referencias/edit-ts-guia.md (API das âncoras e tipos de cena); não leia src/motor/plano.ts inteiro nem vários edit.ts de exemplo.
${ehWin ? '- Python: este PC já TEM Python, e o comando é python (NUNCA python3: no Windows é um atalho falso da Loja e dá erro de Python não encontrado). Não instale Python nem use winget; para editar arquivos use a ferramenta Edit, não scripts em Python.' + String.fromCharCode(10) : ''}- Reutilize antes de criar: procure em src/pecas, src/pecas/tres, src/projetos, public/sfx, public/fontes e biblioteca/itens (Grep por nome). Elemento novo reaproveitável: em src/pecas (ou src/pecas/tres) com comentário de 1 a 3 linhas no topo e item em biblioteca/itens/<nome>.json {"nome","tipo","descricao","arquivo","exemplo"}.
${primeira ? `- Primeiro pedido desta conversa: leia .claude/skills/editar-video/SKILL.md, CLAUDE.md, biblioteca/temas/${t}/prompt-base.md (se existir: o objetivo do tema, vale mais que o resto) e biblioteca/temas/${t}/aprendizado.md (regras já aprendidas; siga-as). Só se for criar um vídeo novo ou refazer o estilo, leia também biblioteca/temas/${t}/modelos/*.md e use os projetos de tema.json como base; em ajuste pontual, NÃO leia os modelos. Projeto novo entra em "projetos" do tema.json. Tema inexistente: crie a pasta com tema.json e aprendizado.md.` : '- Esta conversa já tem as regras da skill e do tema carregadas; não releia.'}
- Quando o usuário aprovar, reprovar ou corrigir algo, acrescente em biblioteca/temas/${t}/aprendizado.md uma linha "- AAAA-MM-DD (projeto): lição" (só o que vale para os próximos vídeos do tema; o que vale para todos vai na skill).
- Não faça render final sem o usuário aprovar; prévia pode. O painel tem botões de prévia e render final com barra de progresso (PC ou pod): ao terminar uma edição, sugira gerar a prévia por ele.
${textoPendenciasEditor(projeto)}
${textoPrefs(cfg.prefs())}`;
};
// Pendências: pedidos que o usuário deixou (assistente ou nota numa imagem da prévia) enquanto você trabalhava.
const textoPendenciasEditor = (projeto) => {
	if (!projetoOk(projeto)) return '';
	const abertas = pendencias.abertas(projeto);
	return `- PENDÊNCIAS DO USUÁRIO: antes de QUALQUER render (bloco, prévia ou final) rode \`node scripts/pendencias.mjs ${projeto}\`, aplique cada uma no edit.ts e marque com \`node scripts/pendencias.mjs ${projeto} feito <id> ...\` (o npm run bloco sai com código 2 e lista as que faltam). Diga em 1 linha o que aplicou.${abertas.length ? `\n  Abertas agora:\n${textoPendencias(abertas)}` : ''}`;
};
// Assistente: roda ao mesmo tempo que o editor, sem parar a etapa dele. Responde e faz o que não mexe no vídeo em andamento;
// alteração no vídeo em andamento vira pendência, que o editor aplica antes do próximo render.
const instrucaoAssistente = (projeto, t) => `ASSISTENTE DO PAINEL de edição do canal Mateus Dias. Outro agente (o EDITOR) está trabalhando agora${projeto ? ` no vídeo "${projeto}"` : ''} (escrevendo cenas, renderizando blocos). Você atende o usuário em paralelo, SEM atrapalhar o editor.
- Responda em português, em no máximo 3 linhas, sem código para o usuário.
- NUNCA edite ${projeto ? `src/projetos/${projeto}/ (edit.ts, transcrição) ` : 'o projeto em andamento '}nem rode render, bloco, prévia, preparar ou transcrever: isso é do editor e quebraria a etapa dele.
${projeto ? `- Pedido de mudança NESTE vídeo (cena, texto, efeito, corte, legenda, ritmo): anote como pendência, uma por assunto, com o segundo se o usuário disser:
  node scripts/pendencias.mjs ${projeto} add "o que mudar, claro e completo" [--t segundos]
  e diga "Anotado: o editor aplica antes do próximo render". Abertas agora: ${pendencias.abertas(projeto).length}.` : ''}
- O resto você pode fazer direto: tirar dúvidas (leia arquivos à vontade), criar ou ajustar peças NOVAS em src/pecas (arquivo novo; não mude peça que o vídeo em andamento usa), itens em biblioteca/itens, aprendizado em biblioteca/temas/${t}/aprendizado.md, preferências, outros projetos.
- Se o pedido exigir parar o editor (ex.: "refaça o roteiro todo agora"), não faça: diga que vai como pendência ou que ele pode usar "Intervir".`;
const pendencias = criarPendencias(estado);

const LIMITE_TURNOS = 12;
// Processos pesados rodando agora (para mostrar "ffmpeg rodando" em vez de silêncio durante comandos longos).
const PESADOS = ['ffmpeg', 'ffprobe', 'main', 'whisper', 'blender', 'chrome-headless-shell', 'yt-dlp'];
let cachePesados = {em: 0, nomes: []};
const processosPesados = () =>
	new Promise((ok) => {
		if (Date.now() - cachePesados.em < 8000) return ok(cachePesados.nomes);
		const fim = (txt) => {
			const nomes = [...new Set(txt.split(/\r?\n/).map((l) => l.replace(/^"?([^",]+?)(\.exe)?"?[ ,].*$/, '$1').trim().toLowerCase()).filter((n) => PESADOS.includes(n)))];
			cachePesados = {em: Date.now(), nomes: nomes.map((n) => (n === 'main' ? 'whisper (transcrição)' : n))};
			ok(cachePesados.nomes);
		};
		const [cmd, a] = ehWin ? ['tasklist', ['/FO', 'CSV', '/NH']] : ['ps', ['-A', '-o', 'comm=']];
		execFile(cmd, a, {encoding: 'utf8', windowsHide: true, timeout: 5000}, (e, saida) => (e ? ok([]) : fim(saida)));
	});
const arqPendente = path.join(estado, 'chat-pendente.json');
const andamento = criarAndamento({raiz, estado, tarefas, historico, listarMidias, lerGrupos, midiasNaoUsadas, rodar, ehWin, atividade: async (proj) => ({chatRodando: rodando.has(proj || '_geral'), processos: await processosPesados()})});
const rodando = new Map();
const apagarProjeto = criarApagar({raiz, estado, dirTemas, projetoOk, tarefas, rodando, sessoes, gravarSessoes: () => writeFileSync(arqSessoes, JSON.stringify(sessoes))});
const arqFila = (chave) => path.join(estado, `fila-${chave}.json`);
const enfileirar = async (req, res) => {
	const {projeto, pedido} = await corpo(req);
	const chave = projeto || '_geral';
	if (!nomeValido(projeto) || typeof pedido !== 'string' || !pedido.trim()) return json(res, {erro: 'Pedido inválido'}, 400);
	if (!rodando.has(chave)) return json(res, {erro: 'O Claude não está trabalhando agora'}, 409);
	writeFileSync(arqFila(chave), JSON.stringify([...lerJson(arqFila(chave), []), pedido.trim()]));
	historico.anotar(chave, 'eu', pedido);
	return json(res, {ok: true});
};
const chat = async (req, res) => {
	const {projeto, pedido, tema, papel} = await corpo(req);
	if (!nomeValido(projeto) || !nomeValido(tema) || typeof pedido !== 'string' || !pedido.trim()) return json(res, {erro: 'Pedido inválido'}, 400);
	const assistente = papel === 'assistente';
	res.writeHead(200, {'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache', connection: 'keep-alive'});
	let falhou = false;
	let teveBloco = false;
	const enviar = (tipo, dados) => {
		if (tipo === 'texto' && dados.texto.includes('[[bloco:')) teveBloco = true;
		if (tipo === 'texto') historico.anotar(chaveHist, 'ia', assistente ? `Assistente: ${dados.texto}` : dados.texto);
		if (tipo === 'acao') historico.anotar(chaveHist, 'acao', assistente ? `Assistente · ${dados.acao}` : dados.acao);
		if (tipo === 'erro') {
			falhou = true;
			historico.anotar(chaveHist, 'erro', dados.texto);
		}
		if (tipo === 'fim') {
			if (dados.erro) falhou = true;
			historico.custo(chaveHist, dados.custo);
		}
		if (!res.writableEnded) res.write(`data: ${JSON.stringify({tipo, ...dados})}\n\n`);
	};
	// O assistente tem processo e conversa próprios (chave ~assist): não para o editor; o histórico na tela é o mesmo.
	const chaveHist = projeto || '_geral';
	const chave = chaveHist + (assistente ? '~assist' : '');
	matar(rodando.get(chave));
	historico.anotar(chaveHist, 'eu', pedido);
	if (!assistente) writeFileSync(arqPendente, JSON.stringify({chave, projeto, tema, pedido, em: Date.now()}));
	// Próximo bloco para aprovar: o editor começou a escrever (o npm run bloco atualiza daí em diante).
	const aprovado = !assistente && projetoOk(projeto) && /Bloco (\d+) aprovado|Ajuste no bloco (\d+)/i.exec(pedido);
	if (aprovado) {
		const b = pendencias.bloco(projeto);
		const n = aprovado[1] ? Number(aprovado[1]) + 1 : Number(aprovado[2]);
		if (!b?.total || n <= b.total) pendencias.gravarBloco(projeto, {n, total: b?.total ?? null, etapa: 'escrevendo', pct: 5, etapas: [{nome: aprovado[1] ? 'Montando as cenas do bloco' : 'Aplicando o ajuste', estado: 'rodando', pct: null}, ...['Análise de qualidade', 'Render do trecho', 'Folha de quadros', 'Conferência do áudio'].map((nome) => ({nome, estado: 'fila', pct: null}))]});
	}
	const arqInstrucao = path.join(estado, assistente ? 'instrucao-assistente.txt' : 'instrucao.txt');
	const primeira = !sessoes[chave] || (sessoes[chave + '#n'] ?? 0) >= LIMITE_TURNOS;
	writeFileSync(arqInstrucao, instrucao(projeto, tema, primeira, assistente));
	// Só as ferramentas necessárias, sem MCP, sem plugins/skills da conta e sem seções dinâmicas: menos tokens por pedido.
	const args = ['-p', '--output-format', 'stream-json', '--verbose', '--permission-mode', 'acceptEdits', '--tools', 'Bash,Read,Write,Edit,Glob,Grep', '--allowedTools', 'Bash,Read,Write,Edit,Glob,Grep', '--strict-mcp-config', '--disable-slash-commands', '--setting-sources', 'project,local', '--exclude-dynamic-system-prompt-sections', '--append-system-prompt-file', `"${arqInstrucao}"`];
	// Conversa muito longa custa mais a cada pedido: depois de LIMITE_TURNOS recomeça limpa (o estado está nos arquivos do projeto).
	if (!primeira && /^[\w-]+$/.test(sessoes[chave])) args.push('--resume', sessoes[chave]);
	else sessoes[chave + '#n'] = 0;
	sessoes[chave + '#n'] = (sessoes[chave + '#n'] ?? 0) + 1;
	const c = cfg.config();
	let modelo = c.modelo;
	let esforco = c.esforco;
	if (modelo === 'auto') {
		// Automático: modelo e esforço pelo tipo do pedido, e subagentes liberados para dividir as etapas.
		const e = escolherModelo(pedido, {projetoNovo: !projeto && !assistente});
		({modelo, esforco} = e);
		// Assistente: rápido; anotar pendência e tirar dúvida não precisam do modelo mais caro.
		if (assistente && modelo === 'opus') ({modelo, esforco} = {modelo: 'sonnet', esforco: 'low'});
		enviar('acao', {acao: `Modelo automático: ${modelo} · esforço ${{low: 'baixo', medium: 'médio', high: 'alto'}[esforco]} (${e.motivo})`});
	}
	if (modelo && /^[a-z0-9][\w.-]{0,60}$/i.test(modelo)) args.push('--model', modelo);
	if (['low', 'medium', 'high'].includes(esforco)) args.push('--effort', esforco);
	// Mensagens enviadas durante o trabalho: o hook entrega ao Claude no próximo passo (sem interromper).
	try { rmSync(arqFila(chave), {force: true}); } catch {}
	const arqHooks = path.join(estado, 'hooks.json');
	writeFileSync(arqHooks, JSON.stringify({hooks: {PostToolUse: [{hooks: [{type: 'command', command: `node "${path.join(import.meta.dirname, 'hook-fila.mjs').replace(/\\/g, '/')}"`}]}]}}));
	args.push('--settings', `"${arqHooks}"`);
	const proc = rodar('claude', ehWin ? args : args.map((a) => a.replace(/^"|"$/g, '')), {stdio: ['pipe', 'pipe', 'pipe'], env: {...process.env, PAINEL_FILA: arqFila(chave), BASH_DEFAULT_TIMEOUT_MS: '1800000', BASH_MAX_TIMEOUT_MS: '3600000'}});
	proc.stdin.on('error', () => {});
	proc.stdin.end(pedido);
	rodando.set(chave, proc);
	const batida = setInterval(async () => {
		if (res.writableEnded) return;
		enviar('batida', {processos: await processosPesados()});
	}, 10000);
	proc.on('close', () => clearInterval(batida));
	let resto = '';
	proc.stdout.on('data', (d) => {
		resto += d;
		const linhas = resto.split('\n');
		resto = linhas.pop();
		for (const l of linhas) {
			if (!l.trim()) continue;
			let ev;
			try { ev = JSON.parse(l); } catch { continue; }
			if (ev.session_id && ev.type === 'system') {
				sessoes[chave] = ev.session_id;
				writeFileSync(arqSessoes, JSON.stringify(sessoes));
			}
			if (ev.type === 'assistant') {
				for (const b of ev.message?.content ?? []) {
					if (b.type === 'text') enviar('texto', {texto: b.text});
					if (b.type === 'tool_use') {
						const alvo = b.input?.command ? `: ${String(b.input.command).slice(0, 90)}` : b.input?.file_path ? `: ${String(b.input.file_path).replace(raiz + '/', '')}` : '';
						enviar('acao', {acao: `${b.name}${alvo}`});
					}
				}
			}
			if (ev.type === 'result') enviar('fim', {erro: ev.is_error, custo: ev.total_cost_usd});
		}
	});
	let erro = '';
	proc.stderr.on('data', (d) => (erro += d));
	proc.on('error', () => {
		enviar('erro', {texto: 'Claude Code não encontrado. Use o botão "Instalar automaticamente" no topo da conversa.'});
		res.end();
	});
	proc.on('close', async (codigo, sinal) => {
		// Morto por sinal (Parar, substituído, OOM) vem com código null: não é sucesso.
		const c = codigo ?? (sinal ? 1 : 0);
		if (proc.parado) parado = true;
		// Substituído por um pedido novo na mesma conversa: o estado (pendente, bloco, fila) já é do processo novo.
		if (rodando.get(chave) !== proc) return res.end();
		rodando.delete(chave);
		// Sessão que não existe mais neste PC (--resume falha sempre com código 1): o próximo pedido começa limpa.
		if (c && /No conversation found/i.test(erro)) {
			delete sessoes[chave];
			writeFileSync(arqSessoes, JSON.stringify(sessoes));
		}
		if (!assistente) try { rmSync(arqPendente, {force: true}); } catch {}
		// Bloco mostrado ao usuário: o próximo para aprovar está pronto.
		if (!assistente && projetoOk(projeto)) {
			const b = pendencias.bloco(projeto);
			if (b && teveBloco) pendencias.gravarBloco(projeto, {...b, etapa: 'pronto', pct: 100, etapas: (b.etapas ?? []).map((e) => ({...e, estado: 'ok', pct: 100}))});
			else if (b && !['pronto', 'erro'].includes(b.etapa)) pendencias.gravarBloco(projeto, {...b, etapa: c || parado ? 'parado' : 'esperando'});
		}
		if (!c && !parado) {
			const sobra = lerJson(arqFila(chave), []);
			try { rmSync(arqFila(chave), {force: true}); } catch {}
			if (sobra.length) enviar('sobrou', {pedido: sobra.join('\n')});
		}
		if (c && !parado) enviar('erro', {texto: erro.trim().slice(-400) || (codigo === null ? `Interrompido (${sinal})` : `Terminou com código ${c}`)});
		// Salvar sozinho: commit e push depois de cada pedido que terminou sem erro.
		if (!c && !falhou && !parado && cfg.prefs().salvarSozinho && !process.env.SEM_SALVAR) {
			try {
				const saida = await salvarGit(`Painel${projeto ? ` (${projeto})` : ''}: ${pedido.trim().split('\n')[0].slice(0, 120)}`);
				enviar('acao', {acao: `Salvo no git: ${saida.trim().split('\n').at(-1) || 'ok'}`});
			} catch (e) {
				enviar('erro', {texto: `Não consegui salvar no git: ${String(e.stderr || e.message).slice(-300)}`});
			}
		}
		// Conferência: grupos "usar todos" cujo material não entrou na edição. O painel pede para refazer.
		if (!c && !falhou && !parado && projeto) {
			const faltam = midiasNaoUsadas(projeto);
			if (faltam.length) enviar('faltam', {arquivos: faltam});
		}
		// Imagens de como a edição está ficando: se o edit.ts mudou depois das últimas, gera de novo (não gasta limite do Claude).
		if (!c && !falhou && !parado && projeto && projetoOk(projeto)) {
			try {
				const m = lerJson(path.join(raiz, 'out/previas', projeto, 'manifest.json'), null);
				const edit = path.join(raiz, 'src/projetos', projeto, 'edit.ts');
				if (existsSync(edit) && (!m || statSync(edit).mtimeMs > m.geradoEm)) {
					tarefas.criar('previas', projeto, {});
					enviar('acao', {acao: 'Gerando imagens da edição na aba Prévias'});
				}
			} catch {}
		}
		res.end();
	});
	let parado = false;
	res.on('close', () => {
		if (proc.exitCode === null) {
			parado = true;
			matar(proc);
		}
	});
};

// ---------- Remotion Studio ----------
let studio = null;
const iniciarStudio = () => {
	if (studio) return;
	studio = rodar('npx', ['remotion', 'studio', '--port=3000', '--no-open'], {stdio: 'ignore'});
	studio.on('close', () => (studio = null));
};
process.on('exit', () => {
	studio?.kill();
	for (const pr of rodando.values()) matar(pr);
	tarefas.encerrarTudo();
	historico.gravarTudo();
});
// Ctrl+C e fechar a janela passam pelo 'exit' acima (encerra renders e grava o histórico).
// Antes de sair, salva na nuvem. No Windows, fechar a janela dá só alguns segundos: o commit (rápido) fica feito e,
// se o envio não terminar a tempo, ele vai na próxima vez que o painel abrir.
let fechando = false;
for (const s of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(s, async () => {
	if (fechando) return process.exit(0);
	fechando = true;
	gitSeparado = true;
	if (cfg.prefs().salvarAoFechar) console.log('\nSalvando na nuvem antes de fechar...');
	await salvarAoFechar(s === 'SIGHUP' ? 8000 : 30000);
	process.exit(0);
});

// O Studio roda no navegador, então abre num Chrome/Edge próprio (perfil separado em .painel/chrome) com a GPU forçada:
// rasterização e composição na placa de vídeo, ignorando a lista de bloqueio, e ANGLE no Direct3D/Metal. Sem isso o
// navegador pode cair no desenho por CPU. Se não achar Chrome ou Edge, abre o navegador padrão.
const acharNavegador = () => {
	const pf = [process.env.ProgramFiles, process.env['ProgramFiles(x86)'], process.env.LOCALAPPDATA].filter(Boolean);
	const candidatos = ehWin
		? pf.flatMap((b) => [`${b}\\Google\\Chrome\\Application\\chrome.exe`, `${b}\\Microsoft\\Edge\\Application\\msedge.exe`])
		: process.platform === 'darwin'
			? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge']
			: ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/microsoft-edge'];
	return candidatos.find((c) => existsSync(c));
};
const abrirNoNavegador = (endereco, gpu = false) => {
	const exe = gpu ? acharNavegador() : null;
	if (exe) {
		const flags = ['--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--enable-zero-copy', '--disable-software-rasterizer', '--no-first-run', `--user-data-dir=${path.join(estado, 'chrome')}`];
		if (ehWin) flags.push('--use-angle=d3d11');
		else if (process.platform === 'darwin') flags.push('--use-angle=metal');
		spawn(exe, [...flags, endereco], {stdio: 'ignore', detached: true}).on('error', () => {}).unref();
		return;
	}
	const [cmd, ...a] = process.platform === 'darwin' ? ['open'] : ehWin ? ['cmd', '/c', 'start', ''] : ['xdg-open'];
	spawn(cmd, [...a, endereco], {stdio: 'ignore', detached: true}).on('error', () => {}).unref();
};
const esperarPorta = async (porta, ms = 40000) => {
	const {connect} = await import('node:net');
	const fim = Date.now() + ms;
	while (Date.now() < fim) {
		if (await new Promise((ok) => { const c = connect(porta, '127.0.0.1'); c.on('connect', () => { c.destroy(); ok(true); }); c.on('error', () => ok(false)); })) return true;
		await new Promise((r) => setTimeout(r, 400));
	}
	return false;
};

// ---------- HTTP ----------
const tipos = {'.wav': 'audio/wav', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.mkv': 'video/x-matroska', '.ogg': 'audio/ogg', '.flac': 'audio/flac', '.aac': 'audio/aac', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm', '.m4v': 'video/mp4', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.pdf': 'application/pdf'};
const arquivo = (req, res, f) => {
	if (!existsSync(f) || !statSync(f).isFile()) {
		res.writeHead(404);
		return res.end();
	}
	const tam = statSync(f).size;
	const tipo = tipos[path.extname(f).toLowerCase()] ?? 'application/octet-stream';
	const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range ?? '');
	if (m) {
		const ini = m[1] ? Number(m[1]) : 0;
		const fim = m[2] ? Math.min(Number(m[2]), tam - 1) : tam - 1;
		if (ini > fim) {
			res.writeHead(416, {'content-range': `bytes */${tam}`});
			return res.end();
		}
		res.writeHead(206, {'content-type': tipo, 'content-range': `bytes ${ini}-${fim}/${tam}`, 'accept-ranges': 'bytes', 'content-length': fim - ini + 1});
		return createReadStream(f, {start: ini, end: fim}).pipe(res);
	}
	res.writeHead(200, {'content-type': tipo, 'content-length': tam, 'accept-ranges': 'bytes'});
	createReadStream(f).pipe(res);
};

let ultimoPedido = 0;
const hostsOk = new Set([`localhost:${porta}`, `127.0.0.1:${porta}`]);
const tokenOk = (t) => {
	const a = Buffer.from(String(t ?? ''));
	const b = Buffer.from(token);
	return a.length === b.length && timingSafeEqual(a, b);
};

createServer(async (req, res) => {
	// Bloqueia DNS rebinding e páginas de outros sites.
	if (!hostsOk.has(req.headers.host ?? '')) { res.writeHead(403); return res.end(); }
	// Origin que não é URL ("null" de iframe/arquivo local) fazia new URL lançar fora do try e derrubava o painel.
	if (req.headers.origin && !hostsOk.has(URL.canParse(req.headers.origin) ? new URL(req.headers.origin).host : '')) { res.writeHead(403); return res.end(); }

	const url = new URL(req.url, 'http://x');
	const p = url.pathname;
	try {
		if (!['/api/', '/out/', '/previas/', '/sfx/', '/fontes/', '/midia/', '/pack/', '/tema-modelo/'].some((x) => p.startsWith(x))) {
			const rel = p === '/' ? 'index.html' : p.slice(1);
			const base = path.join(import.meta.dirname, 'web');
			const f = dentro(base, rel);
			if (!f) { res.writeHead(403); return res.end(); }
			return arquivo(req, res, f);
		}
		const t = req.headers['x-painel-token'] ?? url.searchParams.get('t');
		if (!tokenOk(t)) return json(res, {erro: 'Token inválido. Abra o endereço impresso no terminal.'}, 401);
		if (p === '/api/fechou' && req.method === 'POST') {
			// A aba do painel fechou. Espera um pouco: se a página voltar (recarregar, outra aba aberta), não salva.
			const quando = Date.now();
			ultimoPedido = quando;
			setTimeout(() => { if (ultimoPedido === quando && !rodando.size) salvarAoFechar(); }, 10000);
			res.writeHead(204);
			return res.end();
		}
		ultimoPedido = Date.now();

		if (p === '/api/biblioteca') return json(res, biblioteca());
		if (p === '/api/projetos/apagar' && req.method === 'POST') {
			const {nome} = await corpo(req);
			try { return json(res, apagarProjeto(String(nome ?? ''))); } catch (e) { return json(res, {erro: e.message}, e.codigo ?? 500); }
		}
		if (p === '/api/projetos' && req.method === 'POST') return json(res, criarProjeto(await corpo(req)));
		if (p === '/api/projetos') return json(res, projetos());
		if (p === '/api/config' && req.method === 'POST') {
			cfg.salvar(await corpo(req));
			return json(res, {prefs: cfg.prefs(), config: cfg.config()});
		}
		if (p === '/api/config') return json(res, {prefs: cfg.prefs(), config: cfg.config()});
		if (p === '/api/tarefas' && req.method === 'POST') {
			const {tipo, projeto, opcoes} = await corpo(req);
			try {
				return json(res, {id: tarefas.criar(tipo, projeto, opcoes ?? {})});
			} catch (e) {
				return json(res, {erro: e.message}, 400);
			}
		}
		if (p === '/api/tarefas') return json(res, tarefas.listar());
		if (p === '/api/tarefas/cancelar' && req.method === 'POST') {
			const {id} = await corpo(req);
			return tarefas.cancelar(String(id ?? '')) ? json(res, {ok: true}) : json(res, {erro: 'Tarefa não encontrada ou já terminada'}, 400);
		}
		if (p === '/api/drive' && req.method === 'GET') {
			try { return json(res, await statusDrive()); } catch (e) { return json(res, {erro: e.message}, 500); }
		}
		if (p === '/api/drive/vincular' && req.method === 'POST') {
			try {
				const r = await rodarDrive(['vincular']);
				return json(res, {...r, ...(await statusDrive())});
			} catch (e) { return json(res, {erro: e.message}, 400); }
		}
		if (p === '/api/drive/puxar' && req.method === 'POST') {
			if (!lerJson(path.join(estado, 'drive.json'), null)) return json(res, {erro: 'Vincule o Drive primeiro.'}, 400);
			puxarDrive();
			return json(res, {ok: true});
		}
		if (p === '/api/pod/testar' && req.method === 'POST') {
			try {
				return json(res, await testarPod(cfg.config().pod));
			} catch (e) {
				return json(res, {ok: false, texto: e.message});
			}
		}
		if (p === '/api/fluxo') {
			const proj = url.searchParams.get('projeto');
			if (proj && !nomeValido(proj)) return json(res, {erro: 'Projeto inválido'}, 400);
			return json(res, fluxo({raiz, projeto: proj, projetoOk, tarefas}));
		}
		if (p === '/api/historico') {
			const proj = url.searchParams.get('projeto') || '';
			if (!nomeValido(proj)) return json(res, {erro: 'Projeto inválido'}, 400);
			return json(res, historico.ler(proj || '_geral'));
		}
		if (p === '/api/prompts' && req.method === 'POST') {
			const lista = await corpo(req);
			if (!Array.isArray(lista) || lista.length > 200) return json(res, {erro: 'Lista de atalhos inválida'}, 400);
			const limpos = lista
				.filter((x) => x && typeof x.titulo === 'string' && typeof x.texto === 'string' && x.titulo.trim() && x.texto.trim())
				.map((x) => ({titulo: x.titulo.trim().slice(0, 80), texto: x.texto.trim().slice(0, 6000)}));
			writeFileSync(arqPrompts, JSON.stringify(limpos, null, 1) + '\n');
			return json(res, limpos);
		}
		if (p === '/api/prompts') return json(res, lerJson(arqPrompts, []));
		if (p === '/api/abrir-pasta' && req.method === 'POST') {
			const {projeto, onde} = await corpo(req);
			if (onde !== 'saida' && !projetoOk(projeto)) return json(res, {erro: 'Projeto inválido'}, 400);
			const dir = {midias: () => pastaMidia(projeto, 'midias'), referencias: () => pastaMidia(projeto, 'referencias'), saida: () => path.join(raiz, 'out'), projeto: () => path.join(raiz, 'src/projetos', projeto)}[onde];
			if (!dir) return json(res, {erro: 'Pasta inválida'}, 400);
			abrirPasta(dir());
			return json(res, {ok: true});
		}
		if (p === '/api/tema-modelos') {
			const tema = url.searchParams.get('tema');
			if (!temaOk(tema)) return json(res, {erro: 'Tema inválido'}, 400);
			return json(res, listarModelos(tema));
		}
		if (p === '/api/tema-modelo' && req.method === 'POST') {
			// Vídeo modelo do tema: corpo = arquivo cru, como nas mídias.
			const tema = url.searchParams.get('tema'), nome = nomeArquivo(url.searchParams.get('nome'));
			if (!temaOk(tema) || !VIDEO.test(nome)) return json(res, {erro: 'Envie um vídeo (mp4, mov, m4v, webm ou mkv)'}, 400);
			const dir = pastaModelos(tema);
			mkdirSync(dir, {recursive: true});
			const tmp = path.join(dir, `.${nome}.parte`);
			try {
				await pipeline(req, createWriteStream(tmp));
				renameSync(tmp, path.join(dir, nome));
			} catch (e) {
				rmSync(tmp, {force: true});
				throw e;
			}
			return json(res, {ok: true, nome});
		}
		if (p === '/api/tema-modelo/apagar' && req.method === 'POST') {
			const {tema, nome} = await corpo(req);
			if (!temaOk(tema)) return json(res, {erro: 'Tema inválido'}, 400);
			const n = nomeArquivo(nome);
			const base = n.replace(VIDEO, '').replace(/\.md$/, '');
			for (const f of [n, `${base}.md`]) if (f) rmSync(path.join(pastaModelos(tema), f), {force: true});
			return json(res, {ok: true});
		}
		if (p === '/api/midias') {
			const proj = url.searchParams.get('projeto');
			if (!projetoOk(proj)) return json(res, {erro: 'Projeto inválido'}, 400);
			return json(res, {midias: listarMidias(proj, 'midias'), referencias: listarMidias(proj, 'referencias'), notas: existsSync(arqNotas(proj)) ? readFileSync(arqNotas(proj), 'utf8') : '', grupos: lerGrupos(proj), naoUsadas: midiasNaoUsadas(proj)});
		}
		if (p === '/api/midias/grupos' && req.method === 'POST') {
			const {projeto, grupos} = await corpo(req);
			if (!projetoOk(projeto)) return json(res, {erro: 'Projeto inválido'}, 400);
			if (!Array.isArray(grupos) || grupos.length > 20) return json(res, {erro: 'Grupos inválidos'}, 400);
			writeFileSync(arqGrupos(projeto), JSON.stringify({grupos}, null, 1) + '\n');
			return json(res, {grupos: lerGrupos(projeto)});
		}
		if (p === '/api/chat/pendente') {
			if (req.method === 'POST') { try { rmSync(arqPendente, {force: true}); } catch {} return json(res, {ok: true}); }
			return json(res, lerJson(arqPendente, null));
		}
		if (p === '/api/andamento') {
			const proj = url.searchParams.get('projeto');
			if (!projetoOk(proj)) return json(res, {etapas: [], tarefas: [], recentes: [], gasto: 0});
			return json(res, andamento.calcular(proj));
		}
		if (p === '/api/perguntar' && req.method === 'POST') {
			const {projeto, pergunta} = await corpo(req);
			if (!projetoOk(projeto) || typeof pergunta !== 'string' || !pergunta.trim()) return json(res, {erro: 'Escolha um vídeo e escreva a pergunta'}, 400);
			try { return json(res, await andamento.perguntar(projeto, pergunta.trim().slice(0, 1500))); } catch (e) { return json(res, {erro: e.message}, 500); }
		}
		if (p === '/api/midia' && req.method === 'POST') {
			// Corpo = o arquivo cru, gravado direto no disco (vídeos grandes não passam pela memória).
			const proj = url.searchParams.get('projeto'), tipo = url.searchParams.get('tipo'), nome = nomeArquivo(url.searchParams.get('nome'));
			if (!projetoOk(proj) || !['midias', 'referencias'].includes(tipo) || !EXTENSOES.test(nome)) return json(res, {erro: 'Arquivo ou projeto inválido (tipos aceitos: vídeo, áudio, imagem, pdf, texto)'}, 400);
			const dir = pastaMidia(proj, tipo);
			mkdirSync(dir, {recursive: true});
			const tmp = path.join(dir, `.${nome}.parte`);
			try {
				await pipeline(req, createWriteStream(tmp));
				renameSync(tmp, path.join(dir, nome));
			} catch (e) {
				rmSync(tmp, {force: true});
				throw e;
			}
			return json(res, {ok: true, nome});
		}
		if (p === '/api/midia/apagar' && req.method === 'POST') {
			const {projeto, tipo, nome} = await corpo(req);
			if (!projetoOk(projeto) || !['midias', 'referencias'].includes(tipo)) return json(res, {erro: 'Inválido'}, 400);
			rmSync(path.join(pastaMidia(projeto, tipo), nomeArquivo(nome)), {force: true});
			return json(res, {ok: true});
		}
		if (p === '/api/notas' && req.method === 'POST') {
			const {projeto, texto} = await corpo(req);
			if (!projetoOk(projeto)) return json(res, {erro: 'Projeto inválido'}, 400);
			writeFileSync(arqNotas(projeto), String(texto ?? '').slice(0, 20000));
			return json(res, {ok: true});
		}
		if (p === '/api/temas' && req.method === 'GET') return json(res, temas());
		if (p === '/api/temas' && req.method === 'POST') {
			const {nome, descricao} = await corpo(req);
			const id = slug(nome ?? '');
			if (!id || existsSync(path.join(dirTemas, id))) return json(res, {erro: id ? 'Esse tema já existe' : 'Nome inválido'}, 400);
			mkdirSync(path.join(dirTemas, id), {recursive: true});
			writeFileSync(path.join(dirTemas, id, 'tema.json'), JSON.stringify({nome: String(nome).trim().slice(0, 60), descricao: String(descricao ?? '').slice(0, 300), projetos: []}, null, 1));
			writeFileSync(path.join(dirTemas, id, 'aprendizado.md'), `# Aprendizado: ${String(nome).trim()}\n\nRegras aprendidas nos vídeos deste tema. O Claude lê isto antes de editar e acrescenta uma linha datada quando o usuário aprova ou corrige algo.\n\n`);
			return json(res, {id});
		}
		if (p === '/api/claude') {
			const instalado = await testar('claude', ['--version']);
			if (!instalado) return json(res, {instalado, logado: false});
			// Lê o status para mostrar qual conta está conectada (o e-mail, se o Claude informar).
			const st = await new Promise((fim) => {
				let saida = '';
				const pr = rodar('claude', ['auth', 'status'], {stdio: ['ignore', 'pipe', 'pipe']});
				pr.stdout.on('data', (d) => (saida += d));
				pr.stderr.on('data', (d) => (saida += d));
				pr.on('error', () => fim({c: 1, saida}));
				pr.on('close', (c) => fim({c, saida}));
			});
			const email = st.saida.match(/[\w.+-]+@[\w-]+(\.[\w-]+)+/)?.[0] ?? null;
			return json(res, {instalado, logado: st.c === 0, email: st.c === 0 ? email : null});
		}
		if (p === '/api/claude/trocar' && req.method === 'POST') {
			// Sai da conta atual e abre o login no navegador para entrar com outra.
			await testar('claude', ['auth', 'logout']);
			rodar('claude', ['auth', 'login'], {stdio: 'ignore', detached: true}).on('error', () => {}).unref();
			return json(res, {ok: true});
		}
		if (p === '/api/claude/instalar' && req.method === 'POST') {
			const ok = await new Promise((fim) => {
				const pr = rodar('npm', ['i', '-g', '@anthropic-ai/claude-code'], {stdio: 'ignore'});
				pr.on('error', () => fim(false));
				pr.on('close', (c) => fim(c === 0));
			});
			return json(res, {ok, instalado: ok && (await testar('claude', ['--version']))});
		}
		if (p === '/api/claude/entrar' && req.method === 'POST') {
			// Abre o login no navegador; o painel confere o status até terminar.
			rodar('claude', ['auth', 'login'], {stdio: 'ignore', detached: true}).on('error', () => {}).unref();
			return json(res, {ok: true});
		}
		if (p === '/api/codigo') {
			// Só arquivos de texto da biblioteca, para o botão "ver".
			const rel = path.normalize(url.searchParams.get('f') ?? '');
			const ok = /^(src[\\/]pecas|src[\\/]projetos|scripts[\\/]blender|docs[\\/]referencias|biblioteca)[\\/]/.test(rel) && /\.(tsx?|py|md|json)$/.test(rel) && !rel.includes('..');
			if (!ok || !existsSync(path.join(raiz, rel))) return json(res, {erro: 'Arquivo não permitido'}, 400);
			return json(res, {texto: readFileSync(path.join(raiz, rel), 'utf8')});
		}
		if (p === '/api/chat' && req.method === 'POST') return chat(req, res);
		if (p === '/api/chat/fila' && req.method === 'POST') return enfileirar(req, res);
		if (p === '/api/pendencias') {
			const proj = url.searchParams.get('projeto') ?? '';
			if (!projetoOk(proj)) return json(res, {lista: [], bloco: null});
			return json(res, {lista: pendencias.listar(proj), bloco: pendencias.bloco(proj), editor: rodando.has(proj), assistente: rodando.has(proj + '~assist')});
		}
		if (p.startsWith('/api/pendencias/') && req.method === 'POST') {
			const b = await corpo(req);
			if (!projetoOk(b.projeto)) return json(res, {erro: 'Projeto inválido'}, 400);
			try {
				if (p === '/api/pendencias/nova') return json(res, pendencias.adicionar(b.projeto, {texto: b.texto, t: b.t, cena: b.cena, imagem: b.imagem, origem: 'nota'}));
				if (p === '/api/pendencias/apagar') return json(res, {ok: pendencias.apagar(b.projeto, String(b.id ?? '')) ?? true});
				if (p === '/api/pendencias/feito') return json(res, {n: pendencias.marcar(b.projeto, [String(b.id ?? '')], b.feito !== false)});
			} catch (e) { return json(res, {erro: e.message}, 400); }
			return json(res, {erro: 'Rota desconhecida'}, 404);
		}
		if (p === '/api/parar' && req.method === 'POST') {
			const {projeto} = await corpo(req);
			const pr = rodando.get(projeto || '_geral');
			if (pr) pr.parado = true;
			matar(pr);
			return json(res, {ok: true});
		}
		if (p === '/api/novo-chat' && req.method === 'POST') {
			const {projeto} = await corpo(req);
			if (!nomeValido(projeto)) return json(res, {erro: 'Projeto inválido'}, 400);
			delete sessoes[projeto || '_geral'];
			writeFileSync(arqSessoes, JSON.stringify(sessoes));
			historico.limpar(projeto || '_geral');
			return json(res, {ok: true});
		}
		if (p === '/api/studio' && req.method === 'POST') {
			const {rota} = await corpo(req);
			iniciarStudio();
			const pronto = await esperarPorta(3000);
			if (pronto) abrirNoNavegador(`http://localhost:3000/${/^[\w-]*$/.test(rota ?? '') ? (rota ?? '') : ''}`, true);
			return json(res, {ok: pronto});
		}
		if (p === '/api/reiniciar' && req.method === 'POST') {
			// Baixa a versão nova, reabre o arquivo de iniciar deste PC (que confere as dependências e abre o painel) e encerra este processo.
			// O pull acontece antes, para o .bat não ser reescrito enquanto roda.
			let saida = '';
			try { saida = git('pull', '--rebase', '--autostash'); } catch (e) { saida = String(e.stderr || e.message).slice(-300); }
			const [cmd, ...a] = ehWin ? ['cmd', '/c', 'start', '', 'Painel - Instalar e Abrir.bat'] : process.platform === 'darwin' ? ['open', 'Abrir Painel.command'] : ['bash', 'scripts/abrir-painel.sh'];
			spawn(cmd, a, {cwd: raiz, stdio: 'ignore', detached: true}).on('error', () => {}).unref();
			json(res, {ok: true, saida});
			setTimeout(() => process.exit(0), 700);
			return;
		}
		if (p === '/api/reiniciar-rapido' && req.method === 'POST') {
			// Só funciona sob o supervisor (scripts/supervisor.mjs), que religa o painel com a saída 75.
			if (!process.env.SUPERVISOR) return json(res, {erro: 'Abra o painel pelo "Painel - Instalar e Abrir.bat" (com supervisor) para reiniciar por aqui.'}, 400);
			json(res, {ok: true});
			setTimeout(() => process.exit(75), 300);
			return;
		}
		if (p === '/api/sync/atualizar' && req.method === 'POST') return json(res, {saida: git('pull', '--rebase', '--autostash')});
		if (p === '/api/sync/salvar' && req.method === 'POST') {
			const {mensagem} = await corpo(req);
			return json(res, {saida: await salvarGit(mensagem)});
		}
		if (p.startsWith('/previas/')) {
			const [, , proj, nomeArq] = p.split('/');
			if (!projetoOk(proj) || !/^[\w-]+\.(jpg|json)$/.test(nomeArq ?? '')) { res.writeHead(404); return res.end(); }
			return arquivo(req, res, path.join(raiz, 'out/previas', proj, nomeArq));
		}
		if (p === '/api/previas') {
			const proj = new URL(req.url, 'http://x').searchParams.get('projeto');
			if (!projetoOk(proj)) return json(res, {itens: []});
			const m = lerJson(path.join(raiz, 'out/previas', proj, 'manifest.json'), null);
			const edit = path.join(raiz, 'src/projetos', proj, 'edit.ts');
			return json(res, {...(m ?? {itens: []}), desatualizada: Boolean(m) && existsSync(edit) && statSync(edit).mtimeMs > m.geradoEm});
		}
		if (p.startsWith('/out/')) return arquivo(req, res, path.join(raiz, 'out', path.basename(p)));
		if (p.startsWith('/midia/')) {
			const [, , proj, tipo, ...resto] = p.split('/');
			if (!projetoOk(proj) || !['midias', 'referencias'].includes(tipo)) { res.writeHead(404); return res.end(); }
			return arquivo(req, res, path.join(pastaMidia(proj, tipo), nomeArquivo(decodeURIComponent(resto.join('/')))));
		}
		if (p.startsWith('/tema-modelo/')) {
			const [, , tema, ...resto] = p.split('/');
			if (!temaOk(tema)) { res.writeHead(404); return res.end(); }
			return arquivo(req, res, path.join(pastaModelos(tema), nomeArquivo(decodeURIComponent(resto.join('/')))));
		}
		if (p.startsWith('/sfx/')) return arquivo(req, res, path.join(raiz, 'public/sfx', path.basename(p)));
		if (p.startsWith('/fontes/')) return arquivo(req, res, path.join(raiz, 'public/fontes', path.basename(p)));
		if (p.startsWith('/pack/')) {
			let rel;
			try { rel = decodeURIComponent(p.slice('/pack/'.length)); } catch { rel = ''; }
			const f = rel && !rel.includes('\0') ? acharPack(rel) : null;
			if (!f) { res.writeHead(404); return res.end(); }
			return arquivo(req, res, f);
		}
		res.writeHead(404);
		res.end();
	} catch (e) {
		const msg = String(e.stderr || e.message || e);
		if (!res.headersSent) json(res, {erro: msg.slice(-600)}, e?.codigo ?? 500);
		else res.end();
	}
})
	.on('error', async (e) => {
		if (e.code !== 'EADDRINUSE') throw e;
		// Porta ocupada: se for este painel já aberto, só abre o navegador nele.
		const endereco = `http://localhost:${porta}/#${token}`;
		const r = await fetch(`http://127.0.0.1:${porta}/api/claude`, {headers: {'x-painel-token': token}}).catch(() => null);
		if (r?.ok) {
			console.log(`\nO painel já está aberto em outra janela. Abri no navegador: ${endereco}\n`);
			if (!process.env.SEM_NAVEGADOR) abrirNoNavegador(endereco);
			process.exit(0);
		}
		console.log(r
			? `\nJá existe um painel antigo aberto na porta ${porta}. Feche a outra janela preta do painel (ou reinicie o PC) e abra de novo.\n`
			: `\nA porta ${porta} está ocupada por outro programa. Feche esse programa ou reinicie o PC e abra o painel de novo.\n`);
		process.exit(1);
	})
	.listen(porta, '127.0.0.1', () => {
	const endereco = `http://localhost:${porta}/#${token}`;
	console.log(`\nPainel de edição pronto: ${endereco}\n(não feche esta janela enquanto estiver editando)\n`);
	// Ao abrir, nenhum render está rodando: apaga as sobras do Remotion no temporário do sistema (cópias de vídeo que enchiam o disco).
	setTimeout(async () => {
		const {readdir, rm, stat} = await import('node:fs/promises');
		const {tmpdir} = await import('node:os');
		const tamanho = async (f) => {
			const s = await stat(f).catch(() => null);
			if (!s) return 0;
			if (!s.isDirectory()) return s.size;
			let t = 0;
			for (const n of await readdir(f).catch(() => [])) t += await tamanho(path.join(f, n));
			return t;
		};
		let liberado = 0;
		for (const nome of await readdir(tmpdir()).catch(() => [])) {
			if (!/^(remotion-|react-motion-render)/.test(nome)) continue;
			const f = path.join(tmpdir(), nome);
			const b = await tamanho(f);
			await rm(f, {recursive: true, force: true}).then(() => (liberado += b)).catch(() => {});
		}
		if (liberado > 50 * 1048576) console.log(`Espaço liberado: ${(liberado / 1073741824).toFixed(1)} GB de arquivos temporários de renders antigos.`);
	}, 2000);
	if (!process.env.SEM_NAVEGADOR) abrirNoNavegador(endereco);
	// Se da última vez a janela fechou antes de terminar o envio, envia agora.
	if (cfg.prefs().salvarAoFechar) gitAsync('rev-list', '--count', '@{u}..HEAD').then((n) => { if (Number(n.trim()) > 0) salvarAoFechar(); }).catch(() => {});
});
