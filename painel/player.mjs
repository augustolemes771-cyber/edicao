// Compila o player do painel (painel/player/entrada.tsx) com esbuild e recompila sozinho quando qualquer arquivo importado
// muda (edit.ts, peças, motor). versao() muda a cada compilação: o painel recarrega o player mantendo o quadro.
import path from 'node:path';

export const criarPlayer = async ({raiz, estado}) => {
	const saida = path.join(estado, 'player');
	let versao = 0, erro = null, ctx = null;
	try {
		const esbuild = await import('esbuild');
		ctx = await esbuild.context({
			entryPoints: [path.join(raiz, 'painel/player/entrada.tsx')],
			bundle: true,
			outfile: path.join(saida, 'player.js'),
			format: 'iife',
			platform: 'browser',
			target: 'es2020',
			jsx: 'automatic',
			loader: {'.json': 'json', '.png': 'file', '.jpg': 'file', '.svg': 'file', '.woff2': 'file', '.ttf': 'file'},
			define: {'process.env.NODE_ENV': '"production"'},
			// staticFile() tem que apontar para os arquivos públicos servidos pelo painel desde o primeiro módulo.
			banner: {js: 'window.remotion_staticBase="/public";'},
			minify: true,
			sourcemap: false,
			logLevel: 'silent',
			plugins: [{name: 'versao', setup: (b) => b.onEnd((r) => {
				erro = r.errors.length ? r.errors.map((e) => `${e.location?.file ?? ''}:${e.location?.line ?? ''} ${e.text}`).join('\n').slice(0, 2000) : null;
				if (!erro) versao = Date.now();
			})}],
		});
		await ctx.rebuild().catch(() => {});
		await ctx.watch();
	} catch (e) {
		erro = `Player indisponível: ${e.message}`;
	}
	return {
		pasta: saida,
		estado: () => ({versao, erro}),
		parar: () => ctx?.dispose().catch(() => {}),
	};
};
