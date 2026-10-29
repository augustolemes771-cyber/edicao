// Peças genéricas do tema Lifestyle (props, para reaproveitar em outros vídeos):
// notificacoes: banners de notificação de celular que descem do topo com mola e empurram os anteriores.
// textoLife: tipografia elegante sem caixa (kicker em caixa alta, frase em Playfair itálico, sub), entra com fade + desfoque + subida.
// vitoria: resultado premium: louros dourados que crescem folha a folha em volta de um número gigante em ouro que gira como
// caça-níquel e pousa na batida com reflexo, raios de luz girando atrás e poeira dourada subindo.
import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {CenaNoPlano} from '../motor/plano';
import {playfair, poppins} from '../motor/tema';

type De<T extends CenaNoPlano['tipo']> = Extract<CenaNoPlano, {tipo: T}>;
const lim = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const suave = (x: number) => 1 - Math.pow(1 - x, 3);

const ALTURA = 132;
const PASSO = 150;
const MAX_PILHA = 4;

// Ícone quadrado arredondado com sacola de compras desenhada (sem logo oficial).
const IconeSacola: React.FC = () => (
	<div style={{width: 92, height: 92, borderRadius: 24, flexShrink: 0, background: 'linear-gradient(145deg,#ff4d6d 0%,#e11d48 55%,#9f1239 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.35)'}}>
		<svg width={56} height={56} viewBox="0 0 56 56" fill="none">
			<path d="M10 19h36l-3 29a4 4 0 0 1-4 3.5H17a4 4 0 0 1-4-3.5L10 19z" fill="#fff" />
			<path d="M20 24v-6a8 8 0 0 1 16 0v6" stroke="#fff" strokeWidth={4} strokeLinecap="round" fill="none" />
			<circle cx={21} cy={28} r={2.6} fill="#e11d48" />
			<circle cx={35} cy={28} r={2.6} fill="#e11d48" />
		</svg>
	</div>
);

export const Notificacoes: React.FC<{cena: De<'notificacoes'>}> = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const dur = cena.ate - cena.de;
	const y0 = cena.y ?? 260;
	const saida = interpolate(t, [dur - 0.2, dur], [1, 0], lim);
	// Mola de entrada de cada item (0 → 1, passa um pouco de 1 e assenta).
	const mola = (em: number) => spring({frame: frame - Math.round((em - cena.de) * fps), fps, config: {damping: 13, stiffness: 190, mass: 0.8}});
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: saida}}>
			{cena.itens.map((it, i) => {
				const tEm = it.em - cena.de;
				if (t < tEm) return null;
				const p = mola(it.em);
				// Cada item mais novo que já entrou empurra este para baixo, com a mesma mola.
				let empurrao = 0;
				let nivel = 0;
				for (let j = i + 1; j < cena.itens.length; j++) {
					if (t >= cena.itens[j].em - cena.de) {
						empurrao += mola(cena.itens[j].em) * PASSO;
						nivel++;
					}
				}
				// Acima de 4 na pilha o mais antigo some.
				const sumir = nivel >= MAX_PILHA ? 0 : 1;
				const idade = t - tEm;
				const tremor = Math.sin(idade * 62) * Math.exp(-idade * 9) * 9;
				const y = y0 + empurrao - (1 - p) * (ALTURA + y0 + 40);
				const esc = 1 - nivel * 0.02;
				const op = interpolate(idade, [0, 0.08], [0, 1], lim) * sumir * (1 - nivel * 0.12);
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: 80,
							top: y,
							width: 920,
							height: ALTURA,
							transform: `translateX(${tremor}px) scale(${esc})`,
							transformOrigin: '50% 0',
							opacity: op,
							boxSizing: 'border-box',
							padding: '0 26px',
							borderRadius: 28,
							display: 'flex',
							alignItems: 'center',
							gap: 24,
							background: 'linear-gradient(180deg, rgba(34,34,40,0.78) 0%, rgba(18,18,22,0.78) 100%)',
							backdropFilter: 'blur(22px)',
							boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.14), 0 18px 44px rgba(0,0,0,0.38)',
						}}
					>
						<IconeSacola />
						<div style={{flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6}}>
							<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
								<span style={{fontFamily: poppins, fontWeight: 700, fontSize: 32, color: '#fff', letterSpacing: '0.01em'}}>{it.titulo}</span>
								<span style={{fontFamily: poppins, fontWeight: 400, fontSize: 26, color: 'rgba(255,255,255,0.6)'}}>agora</span>
							</div>
							<span style={{fontFamily: poppins, fontWeight: 600, fontSize: 36, color: 'rgba(255,255,255,0.95)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{it.texto}</span>
						</div>
					</div>
				);
			})}
		</AbsoluteFill>
	);
};

export const TextoLife: React.FC<{cena: De<'textoLife'>}> = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const dur = cena.ate - cena.de;
	const ini = cena.em !== undefined ? cena.em - cena.de : 0;
	const s = interpolate(t, [dur - 0.25, dur], [1, 0], lim);
	const al = cena.alinhamento ?? 'centro';
	const tam = cena.principal.length <= 14 ? 132 : cena.principal.length <= 24 ? 116 : 100;
	// brilho: halo claro em volta das letras e sombra mais larga, para ler sobre imagem clara ou agitada.
	const sombra = cena.brilho
		? '0 0 18px rgba(255,244,222,0.55), 0 0 42px rgba(255,226,170,0.35), 0 4px 26px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.7)'
		: '0 4px 22px rgba(0,0,0,0.45), 0 1px 3px rgba(0,0,0,0.55)';
	// Cada linha entra um pouco depois da anterior: fade + desfoque 8→0 px + subida de 20 px em 0,4 s.
	const a = (atraso: number) => suave(interpolate(t, [ini + atraso, ini + atraso + 0.4], [0, 1], lim)) * s;
	const bloco = (v: number, filho: React.ReactNode) => (
		<div style={{opacity: v, filter: `blur(${(1 - v / Math.max(s, 0.001)) * 8}px)`, transform: `translateY(${(1 - v / Math.max(s, 0.001)) * 20}px)`}}>{filho}</div>
	);
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<div
				style={{
					position: 'absolute',
					left: 70,
					width: 940,
					top: cena.y ?? 680,
					transform: 'translateY(-50%)',
					textAlign: al === 'centro' ? 'center' : al === 'esquerda' ? 'left' : 'right',
					display: 'flex',
					flexDirection: 'column',
					gap: 18,
				}}
			>
				{cena.kicker
					? bloco(
							a(0),
							<span style={{fontFamily: poppins, fontWeight: 400, fontSize: 36, letterSpacing: '0.38em', marginRight: al === 'centro' ? '-0.38em' : 0, textTransform: 'uppercase', color: 'rgba(255,255,255,0.92)', textShadow: sombra}}>
								{cena.kicker}
							</span>,
						)
					: null}
				{bloco(
					a(cena.kicker ? 0.12 : 0),
					<span style={{fontFamily: playfair, fontStyle: 'italic', fontWeight: 700, fontSize: tam, lineHeight: 1.12, color: '#fff', textShadow: sombra, padding: '0 0.05em'}}>
						{cena.principal}
					</span>,
				)}
				{cena.sub
					? bloco(
							a(cena.kicker ? 0.3 : 0.2),
							<span style={{fontFamily: poppins, fontWeight: 600, fontSize: 44, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.9)', textShadow: sombra}}>{cena.sub}</span>,
						)
					: null}
			</div>
		</AbsoluteFill>
	);
};

const OURO = 'linear-gradient(180deg, #fff7dc 0%, #f8dc8a 28%, #dcaa42 52%, #a97420 72%, #f2d083 100%)';
// Pseudoaleatório fixo por índice: a poeira é a mesma em todo quadro e em todo render.
const acaso = (i: number) => {
	const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
	return x - Math.floor(x);
};

// Um ramo de louro do lado esquerdo (o direito é o espelho): caule em arco e folhas aos pares, de baixo para cima.
const Ramo: React.FC<{t: number; cx: number; cy: number; r: number}> = ({t, cx, cy, r}) => {
	const N = 10;
	const a0 = 104;
	const a1 = 236;
	const rad = (g: number) => (g * Math.PI) / 180;
	const ponto = (g: number) => [cx + r * Math.cos(rad(g)), cy + r * Math.sin(rad(g))];
	const [x0, y0] = ponto(a0);
	const [x1, y1] = ponto(a1);
	const caule = interpolate(t, [0, 0.45], [0, 1], lim);
	const comprimento = (r * Math.PI * (a1 - a0)) / 180;
	return (
		<g>
			<path d={`M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`} fill="none" stroke="url(#louroOuro)" strokeWidth={6} strokeLinecap="round" strokeDasharray={comprimento} strokeDashoffset={comprimento * (1 - caule)} />
			{Array.from({length: N}, (_, i) => {
				const g = a0 + ((a1 - a0) * (i + 0.6)) / N;
				const [x, y] = ponto(g);
				const tangente = g + 90;
				// Cada par nasce quando o caule passa por ele, com mola; folhas menores perto da ponta.
				const nasce = 0.04 + (i / N) * 0.42;
				const p = suave(interpolate(t, [nasce, nasce + 0.22], [0, 1], lim));
				const tam = 1 - (i / N) * 0.35;
				return [-38, 38].map((giro, k) => (
					<ellipse
						key={`${i}-${k}`}
						cx={30 * tam}
						cy={0}
						rx={30 * tam}
						ry={11 * tam}
						fill="url(#louroOuro)"
						transform={`translate(${x} ${y}) rotate(${tangente + giro}) scale(${p})`}
					/>
				));
			})}
			{/* folha da ponta, no sentido do caule */}
			<ellipse cx={26} cy={0} rx={26} ry={10} fill="url(#louroOuro)" transform={`translate(${x1} ${y1}) rotate(${a1 + 90}) scale(${suave(interpolate(t, [0.45, 0.65], [0, 1], lim))})`} />
		</g>
	);
};

export const Vitoria: React.FC<{cena: De<'vitoria'>}> = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const dur = cena.ate - cena.de;
	const pousa = (cena.pousa ?? cena.de + 1) - cena.de;
	const yc = cena.y ?? 620;
	const entra = suave(interpolate(t, [0, 0.3], [0, 1], lim));
	const sai = interpolate(t, [dur - 0.3, dur], [1, 0], lim);
	const vis = entra * sai;

	// Caça-níquel: o dígito final gira por uma volta inteira (0 a 9) e para nele no tempo "pousa", com desfoque de movimento.
	const alvo = Number(cena.numero);
	const passos = 10 + alvo;
	const pr = interpolate(t, [0.05, pousa], [0, 1], lim);
	const giro = (1 - Math.pow(1 - pr, 4)) * passos;
	const velocidade = pr < 1 ? 4 * Math.pow(1 - pr, 3) * passos : 0;
	const tamNum = 330;
	const altura = tamNum * 1.08;
	// Pousou: soco de escala que assenta e reflexo de luz passando pelo ouro.
	const depois = Math.max(0, t - pousa);
	const soco = t >= pousa ? 1 + 0.08 * Math.exp(-depois * 7) * Math.cos(depois * 18) : 1;
	const reflexo = interpolate(depois, [0, 0.55], [-60, 160], lim);
	const textoOuro: React.CSSProperties = {backgroundImage: OURO, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', WebkitTextFillColor: 'transparent'};
	const linha = (atraso: number) => suave(interpolate(t, [pousa + atraso, pousa + atraso + 0.35], [0, 1], lim));
	const sobe = (v: number) => ({opacity: v, transform: `translateY(${(1 - v) * 18}px)`, filter: `blur(${(1 - v) * 6}px)`});

	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: sai, filter: sai < 1 ? `blur(${(1 - sai) * 10}px)` : undefined}}>
			{/* escurece em volta e acende um sol dourado atrás do número */}
			<AbsoluteFill style={{opacity: entra, background: `radial-gradient(ellipse 70% 45% at 50% ${yc}px, rgba(0,0,0,0) 0%, rgba(8,5,0,0.55) 100%)`}} />
			<AbsoluteFill style={{opacity: entra * (0.75 + 0.25 * Math.sin(t * 5)), background: `radial-gradient(circle at 50% ${yc}px, rgba(255,214,120,0.55) 0%, rgba(255,180,60,0.18) 22%, rgba(0,0,0,0) 45%)`, mixBlendMode: 'screen'}} />
			<div
				style={{
					position: 'absolute',
					left: 540 - 900,
					top: yc - 900,
					width: 1800,
					height: 1800,
					opacity: entra * 0.5,
					transform: `rotate(${t * 14}deg)`,
					background: 'repeating-conic-gradient(from 0deg, rgba(255,222,150,0.32) 0deg 5deg, rgba(255,222,150,0) 5deg 18deg)',
					WebkitMaskImage: 'radial-gradient(circle, #000 0%, rgba(0,0,0,0.6) 25%, transparent 55%)',
					maskImage: 'radial-gradient(circle, #000 0%, rgba(0,0,0,0.6) 25%, transparent 55%)',
					mixBlendMode: 'screen',
				}}
			/>
			{/* poeira dourada subindo */}
			{Array.from({length: 46}, (_, i) => {
				const vida = 1.6 + acaso(i) * 1.4;
				const fase = ((t + acaso(i + 50) * vida) % vida) / vida;
				const x = 540 + (acaso(i + 100) - 0.5) * 900 + Math.sin(t * 2 + i) * 14;
				const y = yc + 420 - fase * 900;
				const tam = 3 + acaso(i + 150) * 6;
				const pisca = Math.sin(fase * Math.PI) * (0.5 + 0.5 * Math.sin(t * 9 + i * 3));
				return <div key={i} style={{position: 'absolute', left: x, top: y, width: tam, height: tam, borderRadius: '50%', background: '#ffe6a3', boxShadow: '0 0 10px 2px rgba(255,205,110,0.8)', opacity: pisca * vis}} />;
			})}
			{/* louros em volta do número */}
			<svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, opacity: entra, transform: `scale(${soco})`, transformOrigin: `540px ${yc}px`, filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.45)) drop-shadow(0 0 18px rgba(255,200,90,0.35))'}}>
				<defs>
					<linearGradient id="louroOuro" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="#fff3c8" />
						<stop offset="45%" stopColor="#e2b04a" />
						<stop offset="100%" stopColor="#9c6a1c" />
					</linearGradient>
				</defs>
				<Ramo t={t} cx={540} cy={yc + 10} r={270} />
				<g transform="translate(1080 0) scale(-1 1)">
					<Ramo t={t} cx={540} cy={yc + 10} r={270} />
				</g>
			</svg>
			{/* kicker acima do número */}
			<div style={{position: 'absolute', left: 0, width: 1080, top: yc - 300, textAlign: 'center', ...sobe(suave(interpolate(t, [0.1, 0.45], [0, 1], lim)) * sai)}}>
				<span style={{fontFamily: poppins, fontWeight: 500, fontSize: 38, letterSpacing: '0.42em', marginRight: '-0.42em', color: '#fff3d1', textShadow: '0 2px 14px rgba(0,0,0,0.6)'}}>{cena.kicker}</span>
			</div>
			{/* R$ pequeno + dígito gigante girando */}
			<div style={{position: 'absolute', left: 0, width: 1080, top: yc - altura / 2, height: altura, display: 'flex', justifyContent: 'center', alignItems: 'center', transform: `scale(${soco})`, filter: 'drop-shadow(0 8px 22px rgba(0,0,0,0.5)) drop-shadow(0 0 30px rgba(255,196,80,0.45))'}}>
				{cena.prefixo ? <span style={{fontFamily: playfair, fontStyle: 'italic', fontWeight: 700, fontSize: 110, alignSelf: 'flex-start', marginTop: 40, marginRight: 10, ...textoOuro}}>{cena.prefixo}</span> : null}
				<div style={{height: altura, overflow: 'hidden', position: 'relative'}}>
					<div style={{transform: `translateY(${-(giro % 10) * altura}px)`, filter: velocidade > 0.5 ? `blur(0px) url(#)` : undefined}}>
						{Array.from({length: 11}, (_, d) => (
							<div key={d} style={{height: altura, lineHeight: `${altura}px`, fontFamily: playfair, fontStyle: 'italic', fontWeight: 700, fontSize: tamNum, padding: '0 0.08em', ...textoOuro, filter: velocidade > 0.5 ? `blur(${Math.min(velocidade * 0.9, 9)}px)` : undefined}}>
								{d % 10}
							</div>
						))}
					</div>
					{/* reflexo passando pelo ouro depois que pousa */}
					{t >= pousa ? (
						<div style={{position: 'absolute', inset: 0, background: `linear-gradient(105deg, rgba(255,255,255,0) ${reflexo - 18}%, rgba(255,255,255,0.85) ${reflexo}%, rgba(255,255,255,0) ${reflexo + 18}%)`, mixBlendMode: 'overlay'}} />
					) : null}
				</div>
			</div>
			{/* palavra do valor, fio dourado e linha de baixo */}
			<div style={{position: 'absolute', left: 0, width: 1080, top: yc + altura / 2 + 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22}}>
				<div style={sobe(linha(0.02) * sai)}>
					<span style={{fontFamily: poppins, fontWeight: 700, fontSize: 70, letterSpacing: '0.3em', marginRight: '-0.3em', ...textoOuro, filter: 'drop-shadow(0 3px 10px rgba(0,0,0,0.55))'}}>{cena.palavra}</span>
				</div>
				<div style={{width: 520 * linha(0.12), height: 2, background: 'linear-gradient(90deg, rgba(240,200,110,0) 0%, #f3d27e 50%, rgba(240,200,110,0) 100%)'}} />
				{cena.sub ? (
					<div style={sobe(linha(0.22) * sai)}>
						<span style={{fontFamily: poppins, fontWeight: 400, fontSize: 36, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.94)', textShadow: '0 2px 14px rgba(0,0,0,0.7)'}}>{cena.sub}</span>
					</div>
				) : null}
			</div>
		</AbsoluteFill>
	);
};