// Preferências do painel em dois lugares:
// - biblioteca/preferencias.json: como editar (vai para o git, vale em qualquer PC);
// - .painel/config.json: coisas deste computador (pod, modelo do Claude, GPU), fora do git.
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';

export const PREFS_PADRAO = {
	formatoPadrao: 'vertical',
	resPrevia: 720,
	intensidade: 'normal',
	legendaPadrao: 'palavra',
	confirmarFinal: true,
	salvarSozinho: false,
	sempre: '',
};

export const CONFIG_PADRAO = {
	modelo: '',
	gpuStudio: true,
	gpuCodificador: true,
	navegadorRender: '',
	notificar: true,
	pod: {ativo: false, host: '', porta: 22, usuario: 'root', chave: '', pasta: '/workspace/edicao', gl: 'angle-egl'},
};

const ler = (f, padrao) => {
	try {
		return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : padrao;
	} catch {
		return padrao;
	}
};

export const criarConfig = (raiz, estado) => {
	const arqPrefs = path.join(raiz, 'biblioteca/preferencias.json');
	const arqConfig = path.join(estado, 'config.json');
	const prefs = () => ({...PREFS_PADRAO, ...ler(arqPrefs, {})});
	const config = () => {
		const c = ler(arqConfig, {});
		return {...CONFIG_PADRAO, ...c, pod: {...CONFIG_PADRAO.pod, ...(c.pod ?? {})}};
	};
	// Só aceita as chaves conhecidas, com o tipo da padrão: o arquivo nunca recebe lixo vindo da página.
	const limpar = (padrao, novo) => {
		const r = {};
		for (const [k, v] of Object.entries(padrao)) {
			const n = novo?.[k];
			if (n === undefined) continue;
			if (v && typeof v === 'object') r[k] = limpar(v, n);
			else if (typeof v === 'number') r[k] = Number(n) || v;
			else if (typeof v === 'boolean') r[k] = Boolean(n);
			else r[k] = String(n).slice(0, k === 'sempre' ? 4000 : 300);
		}
		return r;
	};
	const salvar = ({prefs: p, config: c}) => {
		if (p) {
			mkdirSync(path.dirname(arqPrefs), {recursive: true});
			writeFileSync(arqPrefs, JSON.stringify({...prefs(), ...limpar(PREFS_PADRAO, p)}, null, 1) + '\n');
		}
		if (c) {
			const atual = config();
			const novo = limpar(CONFIG_PADRAO, c);
			writeFileSync(arqConfig, JSON.stringify({...atual, ...novo, pod: {...atual.pod, ...(novo.pod ?? {})}}, null, 1));
		}
	};
	return {prefs, config, salvar};
};

// Texto das preferências para a instrução do Claude.
export const textoPrefs = (p) => {
	const intensidade = {calma: 'calma: poucos efeitos, só onde a fala pede', normal: 'normal: o ritmo das regras da skill', frenetica: 'frenética: evento novo a cada 0,3 a 0,6 s'}[p.intensidade] ?? p.intensidade;
	return `Preferências do usuário (valem para todo vídeo, salvo pedido contrário):
- Formato padrão de vídeo novo: ${p.formatoPadrao}. Prévia em ${p.resPrevia}p (npm run preview -- <projeto> --res ${p.resPrevia}).
- Intensidade da edição: ${intensidade}. Legenda padrão: ${p.legendaPadrao}.
- ${p.confirmarFinal ? 'Nunca rode o render final sem o usuário pedir.' : 'Pode rodar o render final quando a prévia for aprovada.'}${p.sempre ? `\n- Sempre: ${p.sempre}` : ''}`;
};
