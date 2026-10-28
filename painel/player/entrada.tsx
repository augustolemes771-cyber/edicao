// Player do painel: a mesma composição do Studio (VideoEditado), tocando dentro do painel num iframe.
// Conversa com a página do painel por postMessage: recebe play/pause/seek e manda o quadro atual e a montagem (para a linha do tempo).
// Compilado pelo servidor do painel com esbuild (painel/player.mjs), que recompila sozinho quando a edição muda.
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Player, type PlayerRef} from '@remotion/player';
import {staticFile} from 'remotion';
import {ALL_FORMATS, Input, UrlSource} from 'mediabunny';
import {montar} from '../../src/motor/plano';
import {ALTURA, FPS, LARGURA} from '../../src/motor/tema';
import {projetos} from '../../src/projetos';
import {VideoEditado} from '../../src/VideoEditado';

const params = new URLSearchParams(location.search);
const projeto = params.get('projeto') ?? '';
const quadroInicial = Number(new URLSearchParams(location.hash.slice(1)).get('quadro') ?? 0) || 0;
const avisar = (dados: Record<string, unknown>) => parent.postMessage({dePlayer: true, ...dados}, location.origin);

const textoDe = (c: Record<string, unknown>) => {
	for (const k of ['texto', 'titulo', 'grande', 'linha1', 'valor', 'rotulo', 'nome', 'host']) if (typeof c[k] === 'string') return String(c[k]).replace(/\*/g, '');
	return '';
};

const App: React.FC = () => {
	const edit = projetos[projeto];
	const [fonte, setFonte] = useState<number | null>(edit && !edit.video ? (edit.duracao ?? 10) : null);
	const [erro, setErro] = useState('');
	const ref = useRef<PlayerRef>(null);
	useEffect(() => {
		if (!edit?.video) return;
		const input = new Input({formats: ALL_FORMATS, source: new UrlSource(staticFile(`${edit.pasta}/${edit.video}`))});
		input.computeDuration().then(setFonte).catch((e) => setErro(`Não abri o vídeo ${edit.video}: ${e.message}`));
	}, [edit]);
	const m = useMemo(() => (edit && fonte !== null ? montar(edit, fonte) : null), [edit, fonte]);
	const vertical = edit?.formato === 'vertical';
	const largura = vertical ? ALTURA : LARGURA;
	const altura = vertical ? LARGURA : ALTURA;
	const duracao = m ? Math.max(1, Math.round(m.duracaoEditada * FPS)) : 1;

	// Montagem resumida para a linha do tempo.
	useEffect(() => {
		if (!m || !edit) return;
		let t = 0;
		const trechos = m.mantidos.map(([ini, fim]) => {
			const de = t;
			t += fim - ini;
			return {de, ate: t, fonteDe: ini, fonteAte: fim};
		});
		const sons: {t: number; som: string}[] = [];
		for (const c of m.cenas) {
			if (c.somFinal) sons.push({t: c.de, som: String(c.somFinal)});
			for (const s of (c as {sons?: {em: number; som: string}[]}).sons ?? []) sons.push({t: c.de + s.em, som: s.som});
		}
		avisar({
			tipo: 'meta',
			fps: FPS,
			duracao: m.duracaoEditada,
			quadros: duracao,
			largura,
			altura,
			trechos,
			cenas: m.cenas.map((c) => ({tipo: c.tipo, de: c.de, ate: c.ate, modo: c.modo, texto: textoDe(c as unknown as Record<string, unknown>).slice(0, 80)})),
			legenda: m.legenda.map((p) => ({de: p.de, ate: p.ate, texto: p.palavras.map((w) => w.texto).join(' ').trim()})),
			camera: m.camera.map((c) => ({tipo: c.tipo, em: c.em})),
			sons,
			musica: edit.musica?.arquivo ?? null,
			problemas: m.problemas,
		});
	}, [m, edit, duracao, largura, altura]);

	useEffect(() => {
		const p = ref.current;
		if (!p) return;
		if (quadroInicial) p.seekTo(Math.min(quadroInicial, duracao - 1));
		const aoQuadro = (e: {detail: {frame: number}}) => avisar({tipo: 'quadro', quadro: e.detail.frame});
		const aoTocar = () => avisar({tipo: 'tocando', tocando: true});
		const aoPausar = () => avisar({tipo: 'tocando', tocando: false});
		p.addEventListener('frameupdate', aoQuadro);
		p.addEventListener('play', aoTocar);
		p.addEventListener('pause', aoPausar);
		const aoMsg = (e: MessageEvent) => {
			if (e.origin !== location.origin || !e.data?.paraPlayer) return;
			const d = e.data;
			if (d.cmd === 'play') p.play();
			if (d.cmd === 'pause') p.pause();
			if (d.cmd === 'alternar') p.toggle();
			if (d.cmd === 'ir') p.seekTo(Math.max(0, Math.min(duracao - 1, Math.round(d.quadro))));
			if (d.cmd === 'mudo') (d.mudo ? p.mute() : p.unmute());
			if (d.cmd === 'volume') p.setVolume(Number(d.volume));
		};
		addEventListener('message', aoMsg);
		return () => {
			p.removeEventListener('frameupdate', aoQuadro);
			p.removeEventListener('play', aoTocar);
			p.removeEventListener('pause', aoPausar);
			removeEventListener('message', aoMsg);
		};
	}, [m, duracao]);

	// Espaço: tocar/pausar mesmo com o foco dentro do player.
	useEffect(() => {
		const tecla = (e: KeyboardEvent) => avisar({tipo: 'tecla', key: e.key, shift: e.shiftKey});
		addEventListener('keydown', tecla);
		return () => removeEventListener('keydown', tecla);
	}, []);

	if (!edit) return <div className="msg">Vídeo “{projeto}” ainda não está em src/projetos/index.ts.</div>;
	if (erro) return <div className="msg">{erro}</div>;
	if (!m) return <div className="msg">Abrindo o vídeo...</div>;
	return (
		<Player
			ref={ref}
			component={VideoEditado}
			inputProps={{projeto, duracaoFonte: fonte ?? 0}}
			durationInFrames={duracao}
			compositionWidth={largura}
			compositionHeight={altura}
			fps={FPS}
			style={{width: '100%', height: '100%'}}
			acknowledgeRemotionLicense
			clickToPlay
			doubleClickToFullscreen
			spaceKeyToPlayOrPause={false}
			numberOfSharedAudioTags={8}
		/>
	);
};

createRoot(document.getElementById('raiz')!).render(<App />);
