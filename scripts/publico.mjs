// Empacotamento rápido para os scripts de still/prévia: o bundle é feito com a public VAZIA e, depois, recebe só sons, fontes e as
// mídias do projeto pedido, como hard links (instantâneo, não ocupa espaço). O bundle() comum copiava a public inteira (~9 GB,
// vídeos de todos os projetos) para o temporário a cada execução. Mesma regra do scripts/render-job.mjs.
//   const {serveUrl, limpar} = await empacotarLeve(raiz, projeto);  ...  limpar();
import {copyFileSync, existsSync, linkSync, mkdirSync, readdirSync, rmSync, statSync} from 'node:fs';
import path from 'node:path';
import {bundle} from '@remotion/bundler';

export const ligarPublico = (raiz, projeto, destino) => {
	const origem = path.join(raiz, 'public');
	const ligar = (rel) => {
		const de = path.join(origem, rel);
		if (!existsSync(de)) return;
		if (statSync(de).isDirectory()) {
			for (const nome of readdirSync(de)) {
				if (nome === 'referencias' || nome.endsWith('.parte')) continue;
				if (rel === 'projetos' && nome !== projeto) continue;
				ligar(path.join(rel, nome));
			}
			return;
		}
		const para = path.join(destino, rel);
		mkdirSync(path.dirname(para), {recursive: true});
		try {
			linkSync(de, para);
		} catch {
			copyFileSync(de, para);
		}
	};
	for (const nome of readdirSync(origem)) ligar(nome);
};

export const empacotarLeve = async (raiz, projeto) => {
	const vazia = path.join(raiz, '.painel', 'publico-vazio');
	mkdirSync(vazia, {recursive: true});
	const serveUrl = path.join(raiz, '.painel', `bundle-still-${process.pid}-${Date.now()}`);
	await bundle({entryPoint: path.join(raiz, 'src/index.ts'), publicDir: vazia, outDir: serveUrl});
	ligarPublico(raiz, projeto, path.join(serveUrl, 'public'));
	const limpar = () => rmSync(serveUrl, {recursive: true, force: true});
	process.on('exit', limpar);
	return {serveUrl, limpar};
};
