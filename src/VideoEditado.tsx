import React, {useMemo} from 'react';
import {
	AbsoluteFill,
	getRemotionEnvironment,
	interpolate,
	Sequence,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {Audio, Video} from '@remotion/media';
import {dbParaGanho} from './motor/anim';
import {formatar, montar, type CenaNoPlano, type Edit, type Montagem} from './motor/plano';
import {cor, poppins} from './motor/tema';
import {CenaVisual} from './pecas/Cenas';
import {projetos} from './projetos';

export type PropsVideo = {projeto: string; duracaoFonte: number};

const VOLUME_SFX = dbParaGanho(-12);

// Vídeo decupado, com os cortes das notas faladas aplicados.
const Base: React.FC<{edit: Edit; montagem: Montagem}> = ({edit, montagem}) => {
	const {fps} = useVideoConfig();
	if (!edit.video) {
		return (
			<AbsoluteFill style={{backgroundColor: '#15181a', justifyContent: 'center', alignItems: 'center'}}>
				<div style={{fontFamily: poppins, fontSize: 40, color: '#4a5054', letterSpacing: 8}}>CÂMERA</div>
			</AbsoluteFill>
		);
	}
	let acumulado = 0;
	return (
		<>
			{montagem.mantidos.map(([ini, fim], i) => {
				const from = Math.round(acumulado * fps);
				const dur = Math.round(fim * fps) - Math.round(ini * fps);
				acumulado += fim - ini;
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
const Camera: React.FC<{edit: Edit; montagem: Montagem; telas: CenaNoPlano[]}> = ({edit, montagem, telas}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const t = frame / fps;
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
			<Base edit={edit} montagem={montagem} />
		</div>
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
	const telas = montagem.cenas.filter((c) => c.tipo === 'tela');
	const cheias = montagem.cenas.filter((c) => c.modo === 'cheia' && c.tipo !== 'tela');
	const sobre = montagem.cenas.filter((c) => c.modo === 'sobre');

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
			<AbsoluteFill style={{transform: `translate(${dx}px, ${dy}px) scale(${escala})`}}>
				{camada(telas)}
				<Camera edit={edit} montagem={montagem} telas={telas} />
				{camada(cheias)}
				{camada(sobre)}
			</AbsoluteFill>
			{clarao > 0 && <AbsoluteFill style={{backgroundColor: '#fff', opacity: clarao}} />}
			<Sons cenas={montagem.cenas} />
			{edit.musica && (
				<Audio
					src={staticFile(`${edit.pasta}/${edit.musica.arquivo}`)}
					volume={dbParaGanho(edit.musica.volumeDb ?? -22)}
					loop
				/>
			)}
			<Avisos montagem={montagem} />
		</AbsoluteFill>
	);
};
