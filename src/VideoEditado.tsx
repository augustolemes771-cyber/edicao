import React, {useMemo} from 'react';
import {
	AbsoluteFill,
	getRemotionEnvironment,
	interpolate,
	OffthreadVideo,
	Sequence,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {Audio, Video} from '@remotion/media';
import {dbParaGanho} from './motor/anim';
import {formatar, montar, type CenaNoPlano, type Edit, type EfeitoCamera, type Montagem} from './motor/plano';
import {cor, poppins} from './motor/tema';
import {CenaVisual} from './pecas/Cenas';
import {Legenda} from './pecas/Legenda';
import {projetos} from './projetos';

export type PropsVideo = {projeto: string; duracaoFonte: number};

const VOLUME_SFX = dbParaGanho(-12);

// Vídeo decupado, com os cortes das notas faladas aplicados.
const Base: React.FC<{edit: Edit; montagem: Montagem; pessoa?: boolean}> = ({edit, montagem, pessoa}) => {
	const {fps} = useVideoConfig();
	if (!edit.video) {
		return (
			<AbsoluteFill style={{backgroundColor: '#15181a', justifyContent: 'center', alignItems: 'center'}}>
				<div style={{fontFamily: poppins, fontSize: 40, color: '#4a5054', letterSpacing: 8}}>CÂMERA</div>
			</AbsoluteFill>
		);
	}
	let acumulado = 0;
	if (pessoa) {
		// Só a pessoa recortada (vídeo com alfa), e só onde há cena atrás dela: o PNG com alfa é lento.
		const atras = montagem.cenas.filter((c) => c.modo === 'atras');
		const pedacos: React.ReactNode[] = [];
		montagem.mantidos.forEach(([ini, fim], i) => {
			const inicioEd = acumulado;
			acumulado += fim - ini;
			for (const c of atras) {
				const a = Math.max(c.de, inicioEd);
				const b = Math.min(c.ate, acumulado);
				if (b - a < 1 / fps) continue;
				const from = Math.round(a * fps);
				pedacos.push(
					<Sequence key={`${i}-${c.de}`} from={from} durationInFrames={Math.round(b * fps) - from} layout="none">
						<OffthreadVideo
							src={staticFile(`${edit.pasta}/${edit.recorte}`)}
							trimBefore={Math.round((ini + (from / fps - inicioEd)) * fps)}
							transparent
							muted
							style={{width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0}}
						/>
					</Sequence>,
				);
			}
		});
		return <>{pedacos}</>;
	}
	return (
		<>
			{montagem.mantidos.map(([ini, fim], i) => {
				// Início e fim pelo tempo acumulado: trechos vizinhos se encostam sem quadro vazio.
				const from = Math.round(acumulado * fps);
				acumulado += fim - ini;
				const dur = Math.round(acumulado * fps) - from;
				return (
					<Sequence key={i} from={from} durationInFrames={dur} layout="none">
						<Video
							src={staticFile(`${edit.pasta}/${edit.video}`)}
							trimBefore={Math.round(ini * fps)}
							objectFit="cover"
						/>
					</Sequence>
				);
			})}
		</>
	);
};

// Durante uma gravação de tela, a câmera encolhe para o balão do canto.
// Zoom em corte seco ou suave, puxada de foco e desfoque atrás de uma foto (ref. 1, 2 e 3).
const useLente = (efeitos: EfeitoCamera[], fotos: CenaNoPlano[], t: number) => {
	let escala = 1;
	let x = 0.5;
	let y = 0.4;
	let anterior = 1;
	for (const e of efeitos) {
		if (e.tipo !== 'zoom' || e.em > t) continue;
		const p = e.suave ? Math.min(1, (t - e.em) / e.suave) : 1;
		const suavizado = p * p * (3 - 2 * p);
		escala = anterior + (e.escala - anterior) * suavizado;
		x = e.x ?? x;
		y = e.y ?? y;
		anterior = e.escala;
	}
	let desfoque = 0;
	for (const e of efeitos) {
		if (e.tipo !== 'foco') continue;
		const d = e.duracao ?? 0.45;
		if (t >= e.em && t < e.em + d) desfoque = Math.max(desfoque, 22 * (1 - (t - e.em) / d) ** 1.5);
	}
	let escurece = 0;
	for (const c of fotos) {
		const k = interpolate(t, [c.de, c.de + 0.2, c.ate - 0.2, c.ate], [0, 1, 1, 0], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		});
		const forte = c.tipo === 'topicos';
		desfoque = Math.max(desfoque, (forte ? 26 : 12) * k);
		escurece = Math.max(escurece, (forte ? 0.55 : 0.45) * k);
	}
	return {escala, x, y, desfoque, escurece};
};

const Camera: React.FC<{edit: Edit; montagem: Montagem; telas: CenaNoPlano[]; atras: React.ReactNode}> = ({
	edit,
	montagem,
	telas,
	atras,
}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const t = frame / fps;
	const lente = useLente(
		montagem.camera,
		montagem.cenas.filter(
			(c) => c.tipo === 'foto' || c.tipo === 'topicos' || (c.tipo === 'retrato' && c.variante !== 'lado'),
		),
		t,
	);
	let balao = 0;
	for (const c of telas) {
		balao = Math.max(
			balao,
			interpolate(t, [c.de, c.de + 0.35, c.ate - 0.35, c.ate], [0, 1, 1, 0], {
				extrapolateLeft: 'clamp',
				extrapolateRight: 'clamp',
			}),
		);
	}
	const lado = 330;
	const folga = 70;
	const caixa = {
		left: interpolate(balao, [0, 1], [0, width - folga - lado]),
		top: interpolate(balao, [0, 1], [0, height - folga - lado]),
		width: interpolate(balao, [0, 1], [width, lado]),
		height: interpolate(balao, [0, 1], [height, lado]),
		borderRadius: interpolate(balao, [0, 1], [0, lado / 2]),
	};
	return (
		<div
			style={{
				position: 'absolute',
				...caixa,
				overflow: 'hidden',
				boxShadow: balao > 0 ? `0 0 0 ${5 * balao}px ${cor.verde}, 0 0 ${30 * balao}px ${cor.halo}` : undefined,
			}}
		>
			<AbsoluteFill
				style={{
					transform: `scale(${lente.escala})`,
					transformOrigin: `${lente.x * 100}% ${lente.y * 100}%`,
					filter:
						lente.desfoque > 0.1 || lente.escurece > 0
							? `blur(${lente.desfoque}px) brightness(${1 - lente.escurece})`
							: undefined,
				}}
			>
				<Base edit={edit} montagem={montagem} />
				{/* Texto ou cenário atrás da pessoa: entre o vídeo e a pessoa recortada. */}
				{edit.recorte && atras}
				{edit.recorte && <Base edit={edit} montagem={montagem} pessoa />}
			</AbsoluteFill>
		</div>
	);
};

// Clarão (ref. 3) e chicote (ref. 1) em volta da troca de plano.
const useTransicoes = (efeitos: EfeitoCamera[]) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	let clarao = 0;
	let chicote = 0;
	let mergulhoEscala = 1;
	let mergulhoBlur = 0;
	let iris: {p: number; opacidade: number} | null = null;
	let vazamento: {p: number; local: number; cores: [string, string, string]} | null = null;
	let listras: {p: number; local: number} | null = null;
	for (const e of efeitos) {
		const local = frame - Math.round(e.em * fps);
		if (e.tipo === 'flash') {
			clarao = Math.max(
				clarao,
				interpolate(local, [-1, 0, 2, 4], [0, 0.95, 0.7, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
			);
		}
		if (e.tipo === 'chicote') {
			chicote = Math.max(
				chicote,
				interpolate(local, [-3, 0, 3], [0, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
			);
		}
		if (e.tipo === 'mergulho') {
			// Antes do corte: cresce e desfoca. Depois: entra desfocado e um pouco maior, e assenta.
			const antes = interpolate(local, [-10, 0], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
			const depois = interpolate(local, [0, 12], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
			if (local < 0 && antes > 0) {
				mergulhoEscala = Math.max(mergulhoEscala, 1 + antes * antes * 1.6);
				mergulhoBlur = Math.max(mergulhoBlur, antes * 22);
			} else if (local >= 0 && depois > 0) {
				mergulhoEscala = Math.max(mergulhoEscala, 1 + depois * 0.15);
				mergulhoBlur = Math.max(mergulhoBlur, depois * 18);
			}
		}
		if (e.tipo === 'iris') {
			const p = interpolate(local, [0, 28], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
			if (local >= 0 && p < 1) iris = {p, opacidade: interpolate(p, [0, 0.15, 0.8, 1], [0, 0.85, 0.6, 0])};
		}
		if (e.tipo === 'vazamento') {
			const p = interpolate(local, [-6, 0, 12], [0, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
			if (p > 0) vazamento = {p, local, cores: e.cores ?? ['#ffb36b', '#ff4f8b', '#8a5cff']};
		}
		if (e.tipo === 'listras') {
			const p = interpolate(local, [-2, 0, 2, 4], [0, 1, 0.8, 0], {
				extrapolateLeft: 'clamp',
				extrapolateRight: 'clamp',
			});
			if (p > 0) listras = {p, local};
		}
	}
	return {clarao, chicote, mergulhoEscala, mergulhoBlur, iris, vazamento, listras};
};

// Sobreposições das transições da desmontagem-2.
const Transicoes: React.FC<{t: ReturnType<typeof useTransicoes>}> = ({t}) => {
	const {width, height} = useVideoConfig();
	const lado = Math.max(width, height);
	return (
		<>
			{t.iris && (
				<AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', mixBlendMode: 'screen'}}>
					<div
						style={{
							width: lado * (0.08 + t.iris.p * 1.5),
							height: lado * (0.08 + t.iris.p * 1.5),
							borderRadius: '50%',
							border: `${lado * 0.035}px solid rgba(235,235,235,${t.iris.opacidade})`,
							filter: `blur(${lado * 0.012}px)`,
							flex: 'none',
						}}
					/>
				</AbsoluteFill>
			)}
			{t.vazamento && (
				<AbsoluteFill
					style={{
						mixBlendMode: 'screen',
						opacity: t.vazamento.p,
						background: `linear-gradient(${150 + t.vazamento.local * 3}deg, ${t.vazamento.cores[0]} 0%, ${t.vazamento.cores[1]} 45%, ${t.vazamento.cores[2]} 100%)`,
					}}
				>
					<AbsoluteFill style={{backgroundColor: '#fff8e8', opacity: Math.max(0, t.vazamento.p - 0.4) * 1.6}} />
				</AbsoluteFill>
			)}
			{t.listras && (
				<AbsoluteFill
					style={{
						opacity: t.listras.p,
						background: `repeating-linear-gradient(90deg, rgba(255,255,255,0.95) 0 ${width * 0.006}px, rgba(0,0,0,0.85) ${width * 0.006}px ${width * 0.014}px)`,
						backgroundPositionX: t.listras.local * width * 0.01,
						mixBlendMode: t.listras.local < 1 ? 'overlay' : 'normal',
					}}
				/>
			)}
		</>
	);
};

// Punch de 6%, tremor e clarão na entrada das cenas com impacto (só antes de t2).
const useImpacto = (cenas: CenaNoPlano[]) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	let escala = 1;
	let dx = 0;
	let dy = 0;
	let clarao = 0;
	for (const c of cenas) {
		if (!c.impactoAtivo) continue;
		const local = frame - Math.round(c.de * fps);
		if (local < 0 || local > 12) continue;
		escala += 0.06 * Math.exp(-local / 3.2);
		const forca = 14 * Math.exp(-local / 2.5);
		dx += Math.sin(local * 2.7) * forca;
		dy += Math.cos(local * 3.3) * forca * 0.6;
		clarao = Math.max(clarao, interpolate(local, [0, 4], [0.45, 0], {extrapolateRight: 'clamp'}));
	}
	return {escala, dx, dy, clarao};
};

const Sons: React.FC<{cenas: CenaNoPlano[]}> = ({cenas}) => {
	const {fps} = useVideoConfig();
	const eventos: {quadro: number; som: string; ganho?: number}[] = [];
	for (const c of cenas) {
		if (c.somFinal) eventos.push({quadro: Math.round(c.de * fps), som: c.somFinal});
		if (c.impactoAtivo) eventos.push({quadro: Math.round(c.de * fps), som: 'boom', ganho: 0.8});
		if (c.tipo === 'lista') {
			for (const item of c.itens) eventos.push({quadro: Math.round(item.em * fps), som: 'tick'});
		}
		if (c.tipo === 'alertas') {
			for (const item of c.itens) eventos.push({quadro: Math.round(item.em * fps), som: 'pop', ganho: 0.7});
		}
		if (c.tipo === 'checklist') {
			for (const item of c.itens) eventos.push({quadro: Math.round(item.em * fps), som: 'pop', ganho: 0.8});
		}
	}
	return (
		<>
			{eventos.map((e, i) => (
				<Sequence key={i} from={e.quadro} durationInFrames={fps * 3} layout="none">
					<Audio src={staticFile(`sfx/${e.som}.wav`)} volume={VOLUME_SFX * (e.ganho ?? 1)} />
				</Sequence>
			))}
		</>
	);
};

const BarraProgresso: React.FC<{cor: string}> = ({cor: corBarra}) => {
	const frame = useCurrentFrame();
	const {durationInFrames, height} = useVideoConfig();
	const altura = Math.round(height * 0.005);
	return (
		<AbsoluteFill style={{height: altura, top: 0, backgroundColor: 'rgba(255,255,255,0.18)'}}>
			<div
				style={{
					width: `${(frame / Math.max(1, durationInFrames - 1)) * 100}%`,
					height: '100%',
					backgroundColor: corBarra,
					boxShadow: `0 0 8px ${corBarra}`,
				}}
			/>
		</AbsoluteFill>
	);
};

// Só no Studio: lista os problemas do plano por cima do vídeo.
const Avisos: React.FC<{montagem: Montagem}> = ({montagem}) => {
	if (getRemotionEnvironment().isRendering || montagem.problemas.length === 0) return null;
	return (
		<div
			style={{
				position: 'absolute',
				top: 16,
				left: 16,
				maxWidth: 760,
				padding: '10px 14px',
				background: 'rgba(120,0,20,0.85)',
				color: '#fff',
				fontFamily: 'monospace',
				fontSize: 16,
				borderRadius: 8,
				lineHeight: 1.4,
			}}
		>
			{montagem.problemas.slice(0, 8).map((p, i) => (
				<div key={i}>
					{p.gravidade === 'erro' ? '✖' : '!'} {p.tempo !== undefined ? `${formatar(p.tempo)} ` : ''}
					{p.texto}
				</div>
			))}
			{montagem.problemas.length > 8 && <div>… e mais {montagem.problemas.length - 8} (npm run conferir)</div>}
		</div>
	);
};

export const VideoEditado: React.FC<PropsVideo> = ({projeto, duracaoFonte}) => {
	const {fps} = useVideoConfig();
	const edit = projetos[projeto];
	const montagem = useMemo(() => montar(edit, duracaoFonte), [edit, duracaoFonte]);
	const {escala, dx, dy, clarao} = useImpacto(montagem.cenas);
	const trans = useTransicoes(montagem.camera);
	const telas = montagem.cenas.filter((c) => c.tipo === 'tela');
	const cheias = montagem.cenas.filter((c) => c.modo === 'cheia' && c.tipo !== 'tela');
	const sobre = montagem.cenas.filter((c) => c.modo === 'sobre');
	const atras = montagem.cenas.filter((c) => c.modo === 'atras');

	const camada = (lista: CenaNoPlano[]) =>
		lista.map((c, i) => (
			<Sequence
				key={`${c.tipo}-${i}-${c.de}`}
				from={Math.round(c.de * fps)}
				durationInFrames={Math.max(1, Math.round((c.ate - c.de) * fps))}
				name={`${c.tipo} ${formatar(c.de)}`}
			>
				<CenaVisual cena={c} pasta={edit.pasta} />
			</Sequence>
		));

	return (
		<AbsoluteFill style={{backgroundColor: cor.preto}}>
			<svg width={0} height={0} style={{position: 'absolute'}}>
				<filter id="chicote" x="-20%" y="0" width="140%" height="100%">
					<feGaussianBlur stdDeviation={`${trans.chicote * 70} 0`} />
				</filter>
			</svg>
			<AbsoluteFill
				style={{
					transform: `translate(${dx + trans.chicote * 60}px, ${dy}px) scale(${escala * trans.mergulhoEscala})`,
					filter:
						[
							trans.chicote > 0.02 ? 'url(#chicote)' : '',
							trans.mergulhoBlur > 0.2 ? `blur(${trans.mergulhoBlur}px)` : '',
						]
							.filter(Boolean)
							.join(' ') || undefined,
				}}
			>
				{camada(telas)}
				<Camera edit={edit} montagem={montagem} telas={telas} atras={camada(atras)} />
				{camada(cheias)}
				{camada(sobre)}
				{edit.legenda && <Legenda paginas={montagem.legenda} cfg={edit.legenda} />}
			</AbsoluteFill>
			{clarao > 0 && <AbsoluteFill style={{backgroundColor: '#fff', opacity: clarao}} />}
			<Transicoes t={trans} />
			{trans.clarao > 0 && (
				<AbsoluteFill style={{backgroundColor: '#fff6de', opacity: trans.clarao, mixBlendMode: 'screen'}} />
			)}
			<Sons cenas={montagem.cenas} />
			{edit.musica && (
				<Audio
					src={staticFile(`${edit.pasta}/${edit.musica.arquivo}`)}
					volume={dbParaGanho(edit.musica.volumeDb ?? -22)}
					loop
				/>
			)}
			{edit.barraProgresso && (
				<BarraProgresso cor={typeof edit.barraProgresso === 'object' ? edit.barraProgresso.cor : '#ffd21f'} />
			)}
			<Avisos montagem={montagem} />
		</AbsoluteFill>
	);
};
