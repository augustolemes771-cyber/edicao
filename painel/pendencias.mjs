// Pendências de um vídeo: alterações que o usuário pediu enquanto o editor trabalhava (pelo assistente ou por uma nota numa
// imagem da prévia). O editor aplica todas antes do próximo render: o npm run bloco não renderiza com pendência aberta.
// Arquivo: .painel/pendencias/<projeto>.json. Também guarda o andamento do próximo bloco (.painel/pendencias/<projeto>-bloco.json).
import {randomBytes} from 'node:crypto';
import {mkdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {lerJson} from './comum.mjs';

const nomeOk = (p) => typeof p === 'string' && /^[a-z0-9-]+$/.test(p);

export const criarPendencias = (estado) => {
	const dir = path.join(estado, 'pendencias');
	const arq = (p) => path.join(dir, `${p}.json`);
	const ler = (p) => (nomeOk(p) ? lerJson(arq(p), []) : []);
	const gravar = (p, lista) => {
		mkdirSync(dir, {recursive: true});
		// Feitas só ficam as 20 últimas, para o painel mostrar o que já foi aplicado.
		const abertas = lista.filter((x) => !x.feito);
		const feitas = lista.filter((x) => x.feito).slice(-20);
		writeFileSync(arq(p), JSON.stringify([...feitas, ...abertas], null, 1));
	};
	return {
		listar: ler,
		abertas: (p) => ler(p).filter((x) => !x.feito),
		// texto: o que mudar; t: segundo do vídeo editado (opcional); cena e imagem: de onde veio a nota.
		adicionar: (p, {texto, t, cena, imagem, origem}) => {
			if (!nomeOk(p) || typeof texto !== 'string' || !texto.trim()) throw new Error('Pendência inválida');
			const item = {id: randomBytes(3).toString('hex'), texto: texto.trim().slice(0, 1500), origem: origem || 'painel', em: Date.now()};
			if (Number.isFinite(Number(t)) && t !== null && t !== '') item.t = Math.max(0, Number(Number(t).toFixed(2)));
			if (typeof cena === 'string' && cena) item.cena = cena.slice(0, 200);
			if (typeof imagem === 'string' && /^[\w./-]{1,300}$/.test(imagem) && !imagem.includes('..')) item.imagem = imagem;
			gravar(p, [...ler(p), item]);
			return item;
		},
		marcar: (p, ids, feito = true) => {
			const l = ler(p);
			let n = 0;
			for (const x of l) if (ids.includes(x.id) && Boolean(x.feito) !== feito) { x.feito = feito ? Date.now() : undefined; n++; }
			gravar(p, l);
			return n;
		},
		apagar: (p, id) => gravar(p, ler(p).filter((x) => x.id !== id)),
		// Andamento do próximo bloco (escrito pelo npm run bloco e pelo painel).
		bloco: (p) => (nomeOk(p) ? lerJson(path.join(dir, `${p}-bloco.json`), null) : null),
		gravarBloco: (p, dados) => {
			if (!nomeOk(p)) return;
			mkdirSync(dir, {recursive: true});
			writeFileSync(path.join(dir, `${p}-bloco.json`), JSON.stringify({...dados, em: Date.now()}));
		},
	};
};

const fmt = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
export const textoPendencias = (lista) =>
	lista.map((x) => `- [${x.id}]${x.t !== undefined ? ` em ${fmt(x.t)}` : ''}${x.cena ? ` (cena ${x.cena})` : ''}: ${x.texto}${x.imagem ? ` · imagem: ${x.imagem}` : ''}`).join('\n');
