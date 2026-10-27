// Conversa de cada projeto salva neste PC (.painel/chats/<projeto|_geral>.json), para reabrir o painel e continuar vendo.
import {mkdirSync, rmSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {lerJson} from './comum.mjs';

const LIMITE = 600;

export const criarHistorico = (estado) => {
	const dir = path.join(estado, 'chats');
	mkdirSync(dir, {recursive: true});
	const arq = (chave) => path.join(dir, `${/^[a-z0-9-]+$/.test(chave ?? '') ? chave : '_geral'}.json`);
	const cache = new Map();
	const pendentes = new Map();
	const ler = (chave) => {
		if (!cache.has(chave)) cache.set(chave, lerJson(arq(chave), []));
		return cache.get(chave);
	};
	const gravar = (chave) => {
		pendentes.delete(chave);
		try {
			writeFileSync(arq(chave), JSON.stringify(ler(chave).slice(-LIMITE)));
		} catch {}
	};
	const agendar = (chave) => {
		if (!pendentes.has(chave)) pendentes.set(chave, setTimeout(() => gravar(chave), 800));
	};
	return {
		ler: (chave) => ler(chave || '_geral'),
		// quem: 'eu' | 'ia' | 'acao' | 'erro'
		anotar: (chave, quem, texto, extra = {}) => {
			const c = chave || '_geral';
			const v = ler(c);
			v.push({quem, texto: String(texto ?? '').slice(0, 20000), t: Date.now(), ...extra});
			if (v.length > LIMITE) v.splice(0, v.length - LIMITE);
			agendar(c);
		},
		// Custo do pedido vai na última fala da IA (ou numa linha de ação, se a IA não escreveu nada).
		custo: (chave, custo) => {
			const c = chave || '_geral';
			const v = ler(c);
			const ultima = v.at(-1);
			if (ultima && ultima.quem === 'ia') ultima.custo = custo;
			else v.push({quem: 'acao', texto: 'Pedido concluído', t: Date.now(), custo});
			agendar(c);
		},
		limpar: (chave) => {
			const c = chave || '_geral';
			clearTimeout(pendentes.get(c));
			pendentes.delete(c);
			cache.set(c, []);
			rmSync(arq(c), {force: true});
		},
		gravarTudo: () => {
			for (const [c, h] of pendentes) {
				clearTimeout(h);
				gravar(c);
			}
		},
	};
};
