// Vínculo com o Google Drive para computador (a unidade G: ou similar), sem importar nada.
//   node scripts/drive.mjs config "<pasta de salvar>" ["<pasta de pack>" ...]   grava .painel/drive.json (deste PC)
//   node scripts/drive.mjs status                                               mostra o que está vinculado
//   node scripts/drive.mjs salvar [arquivo]                                     copia vídeos, mídias e modelos para o Drive (só o que mudou)
//   node scripts/drive.mjs puxar                                                traz do Drive o que falta neste PC e cataloga os packs
//   node scripts/drive.mjs detectar                                             acha o Drive para computador e as pastas "edição" e "InfynityPack"
//   node scripts/drive.mjs vincular [--salvar <pasta>] [--pack <pasta>]...       grava o vínculo (sem argumentos, usa o que detectar achar)
//   node scripts/drive.mjs catalogar                                            cataloga os arquivos das pastas de pack (só acrescenta)
// A pasta de salvar guarda <pasta>/painel/{videos,projetos,modelos}. Cada pasta de pack é uma raiz extra de arquivos do pack.
import {copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

const raiz = path.resolve(import.meta.dirname, '..');
const arq = path.join(raiz, '.painel/drive.json');
const ler = () => {
	try {
		return JSON.parse(readFileSync(arq, 'utf8'));
	} catch {
		return {};
	}
};
const [cmd = 'status', ...resto] = process.argv.slice(2);
const CATALOGO = path.join(raiz, 'biblioteca/pack/catalogo.json');
const cfg = ler();
const ehWin = process.platform === 'win32';

const robo = (de, para) => {
	if (!existsSync(de) || !statSync(de).isDirectory()) return;
	mkdirSync(para, {recursive: true});
	if (ehWin) {
		try {
			// /XO: não sobrescreve o que é mais novo no destino. Códigos 0-7 = sucesso.
			// Saída descartada: com muitos erros por arquivo ela passava do buffer e a falha era engolida.
			execFileSync('robocopy', [de, para, '/E', '/XO', '/R:1', '/W:1', '/NFL', '/NDL', '/NJH', '/NJS', '/NP'], {stdio: 'ignore', windowsHide: true});
		} catch (e) {
			// Sem status = nem rodou (robocopy não encontrado) ou foi morto: também é falha.
			if (typeof e.status !== 'number' || e.status >= 8) throw new Error(`robocopy falhou (${e.status ?? e.code ?? e.signal}) copiando ${de}`);
		}
	} else execFileSync('rsync', ['-a', '-u', de + '/', para + '/']);
};
const copiar = (de, para) => {
	mkdirSync(path.dirname(para), {recursive: true});
	if (!existsSync(para) || statSync(para).mtimeMs < statSync(de).mtimeMs) copyFileSync(de, para);
};
const pastaSalvar = () => {
	if (!cfg.salvar) throw new Error('Drive não configurado: node scripts/drive.mjs config "<pasta>"');
	if (!existsSync(cfg.salvar)) throw new Error(`A pasta ${cfg.salvar} não existe: o Drive para computador está aberto e logado?`);
	return path.join(cfg.salvar, 'painel');
};
// Pastas de projeto com mídia (public/projetos/<nome>) e vídeos de modelo dos temas (ficam fora do git).
const modelosLocais = () => {
	const d = path.join(raiz, 'biblioteca/temas');
	return existsSync(d) ? readdirSync(d).map((t) => [path.join(d, t, 'modelos'), t]).filter(([p]) => existsSync(p)) : [];
};

// Raízes do Drive para computador: G:\My Drive (Windows) ou ~/Library/CloudStorage/GoogleDrive-*/My Drive (Mac).
const NOMES_RAIZ = ['My Drive', 'Meu Drive'];
const raizesDrive = () => {
	const r = [];
	if (ehWin) {
		for (let c = 67; c <= 90; c++) for (const n of NOMES_RAIZ) { const d = `${String.fromCharCode(c)}:/${n}`; if (existsSync(d)) r.push(d); }
	} else {
		const cs = path.join(os.homedir(), 'Library/CloudStorage');
		if (existsSync(cs)) for (const g of readdirSync(cs).filter((x) => x.startsWith('GoogleDrive'))) for (const n of NOMES_RAIZ) { const d = path.join(cs, g, n); if (existsSync(d)) r.push(d); }
	}
	return r;
};
const achar = (re) => {
	for (const rd of raizesDrive()) {
		const nome = readdirSync(rd, {withFileTypes: true}).find((d) => (d.isDirectory() || d.isSymbolicLink()) && re.test(d.name));
		if (nome) return path.join(rd, nome.name);
	}
	return null;
};
// Pastas compartilhadas que viraram atalho no Drive ficam em <unidade>/.shortcut-targets-by-id/<id>/<nome>.
const acharAtalho = (re) => {
	for (const rd of raizesDrive()) {
		const base = path.join(path.dirname(rd), '.shortcut-targets-by-id');
		if (!existsSync(base)) continue;
		for (const id of readdirSync(base)) {
			try {
				const f = readdirSync(path.join(base, id), {withFileTypes: true}).find((d) => d.isDirectory() && re.test(d.name));
				if (f) return path.join(base, id, f.name);
			} catch {}
		}
	}
	return null;
};
const detectar = () => ({raizes: raizesDrive(), edicao: achar(/^edi[cç][aã]o$/i), infynity: achar(/infynity/i) ?? acharAtalho(/infynity/i)});

// Cataloga (só acrescenta) os arquivos das pastas de pack; caminhos relativos à pasta, como o painel resolve.
const TIPOS = {video: 'mp4 mov webm mkv avi m4v', audio: 'wav mp3 aac m4a ogg flac aif aiff', imagem: 'png jpg jpeg gif webp svg tif tiff bmp psd exr', fonte: 'ttf otf woff woff2', lut: 'cube 3dl', modelo3d: 'glb gltf fbx obj blend usdz stl'};
const tipoDe = (n) => { const e = path.extname(n).slice(1).toLowerCase(); return Object.keys(TIPOS).find((t) => TIPOS[t].split(' ').includes(e)) ?? 'outro'; };
const varrer = (dir, base, saida = []) => {
	for (const d of readdirSync(dir, {withFileTypes: true})) {
		if (/^(desktop\.ini|\.DS_Store|Thumbs\.db|.*\.(lnk|gdoc|gsheet|gslides|gform|gdraw|gsite|gjam))$/i.test(d.name) || (dir === base && d.name === 'painel')) continue;
		const abs = path.join(dir, d.name);
		// Pastas de software, plugins, projetos e templates de outros programas não são mídia para o painel (e são enormes).
		if (d.isDirectory() && /^(softwares?|plugins?.*|scripts? ?extensions?|project files|templates? after effects|pack after effects|pack premiere|node_modules|__MACOSX)$/i.test(d.name)) continue;
		if (d.isDirectory()) {
			try { varrer(abs, base, saida); } catch {}
		}
		else saida.push(abs);
	}
	return saida;
};
const PASTAS_INFYNITY = /^(video pack|sound effects( \(1\))?|songs|3d models|pack anime fx)$/i;
const catalogar = () => {
	const cat = (() => { try { const c = JSON.parse(readFileSync(CATALOGO, 'utf8')); return Array.isArray(c) ? c : []; } catch { return []; } })();
	const tem = new Set(cat.map((e) => e.arquivo));
	let novos = 0;
	for (const base of cfg.packs ?? []) {
		if (!existsSync(base)) continue;
		// InfynityPack é enorme (plugins, programas, projetos): só as pastas de mídia entram.
		const so = /infynity/i.test(base) ? PASTAS_INFYNITY : null;
		const arquivos = so
			? readdirSync(base, {withFileTypes: true}).filter((d) => d.isDirectory() && so.test(d.name)).flatMap((d) => { try { return varrer(path.join(base, d.name), base); } catch { return []; } })
			: varrer(base, base);
		for (const abs of arquivos) {
			const arquivo = path.relative(base, abs).split(path.sep).join('/');
			if (tem.has(arquivo) || tipoDe(arquivo) === 'outro') continue;
			tem.add(arquivo);
			novos++;
			const sub = arquivo.includes('/') ? arquivo.split('/')[0] : 'Geral';
			cat.push({nome: path.basename(arquivo, path.extname(arquivo)), categoria: sub, tipo: tipoDe(arquivo), arquivo, tamanho: statSync(abs).size, origem: path.basename(base)});
		}
	}
	if (novos) writeFileSync(CATALOGO, JSON.stringify(cat, null, '\t') + '\n');
	return novos;
};

try {
	if (cmd === 'detectar') {
		console.log(JSON.stringify(detectar()));
	} else if (cmd === 'vincular') {
		const d = detectar();
		const pegar = (f) => resto.map((a, i) => (a === f ? resto[i + 1] : null)).filter(Boolean);
		const salvar = pegar('--salvar')[0] ?? d.edicao;
		const packs = pegar('--pack').length ? pegar('--pack') : [d.edicao, d.infynity].filter(Boolean);
		if (!salvar) throw new Error('Não achei a pasta "edição" no Drive para computador. Ele está instalado e logado?');
		mkdirSync(path.dirname(arq), {recursive: true});
		const novo = {salvar, packs: [...new Set(packs)]};
		writeFileSync(arq, JSON.stringify(novo, null, '\t') + '\n');
		console.log(JSON.stringify({ok: true, ...novo, infynityFalta: !d.infynity && !pegar('--pack').length}));
	} else if (cmd === 'catalogar') {
		console.log(JSON.stringify({ok: true, novos: catalogar()}));
	} else if (cmd === 'config') {
		const [salvar, ...packs] = resto;
		if (!salvar || !existsSync(salvar)) throw new Error('Informe uma pasta existente do Drive');
		for (const p of packs) if (!existsSync(p)) throw new Error(`Pasta de pack não encontrada: ${p}`);
		mkdirSync(path.dirname(arq), {recursive: true});
		writeFileSync(arq, JSON.stringify({salvar, packs}, null, '\t') + '\n');
		console.log(JSON.stringify({ok: true, salvar, packs}));
	} else if (cmd === 'status') {
		const ok = (p) => Boolean(p) && existsSync(p);
		console.log(JSON.stringify({salvar: cfg.salvar ?? null, salvarOk: ok(cfg.salvar), packs: (cfg.packs ?? []).map((p) => ({pasta: p, ok: ok(p)}))}, null, 1));
	} else if (cmd === 'salvar') {
		const dest = pastaSalvar();
		if (resto[0]) {
			const f = path.resolve(raiz, resto[0]);
			if (!existsSync(f)) throw new Error(`Arquivo não encontrado: ${resto[0]}`);
			copiar(f, path.join(dest, 'videos', path.basename(f)));
		} else {
			robo(path.join(raiz, 'out'), path.join(dest, 'videos'));
			robo(path.join(raiz, 'public/projetos'), path.join(dest, 'projetos'));
			for (const [p, t] of modelosLocais()) robo(p, path.join(dest, 'modelos', t));
		}
		console.log(JSON.stringify({ok: true, destino: dest}));
	} else if (cmd === 'puxar') {
		const dest = pastaSalvar();
		robo(path.join(dest, 'videos'), path.join(raiz, 'out'));
		robo(path.join(dest, 'projetos'), path.join(raiz, 'public/projetos'));
		const dm = path.join(dest, 'modelos');
		if (existsSync(dm)) for (const t of readdirSync(dm, {withFileTypes: true}).filter((d) => d.isDirectory()).map((d) => d.name)) robo(path.join(dm, t), path.join(raiz, 'biblioteca/temas', t, 'modelos'));
		let novos = 0, aviso;
		try { novos = catalogar(); } catch (e) { aviso = 'Catálogo do pack incompleto: ' + e.message; }
		console.log(JSON.stringify({ok: true, origem: dest, novos, aviso}));
	} else throw new Error('Comandos: config, status, salvar, puxar');
} catch (e) {
	console.error(JSON.stringify({erro: e.message}));
	process.exit(1);
}
