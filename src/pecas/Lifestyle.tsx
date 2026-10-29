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
	const sombra = '0 4px 22px rgba(0,0,0,0.45), 0 1px 3px rgba(0,0,0,0.55)';
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
