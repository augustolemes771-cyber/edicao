// Peças do vanessa-0411-ad02 (Rejuvex, AD 02 de 04/11): caixinha de pergunta do TikTok no topo, seta para o botão
// laranja e card do produto. Chaves com sufixo Ad02.
import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {CenaPeca, Pecas} from '../../pecas/peca';
import {poppins} from '../../motor/tema';

const lim = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const CaixinhaAd02: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const d = (cena.dados ?? {}) as {pergunta?: string; autor?: string};
	const s = spring({frame, fps, config: {damping: 14, stiffness: 160}});
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<div
				style={{
					position: 'absolute',
					left: 80,
					top: 250,
					maxWidth: 600,
					background: '#fff',
					borderRadius: 22,
					padding: '22px 30px 26px 30px',
					boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
					transform: `scale(${0.6 + 0.4 * s})`,
					transformOrigin: 'left top',
					opacity: s,
					fontFamily: poppins,
				}}
			>
				<div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8}}>
					<div style={{width: 40, height: 40, borderRadius: 20, background: 'linear-gradient(135deg,#f6b0a0,#c2185b)'}} />
					<div style={{fontSize: 24, color: '#666', lineHeight: 1.2}}>
						Responder ao comentário de <b style={{color: '#444'}}>{d.autor ?? 'Camila'}</b>
					</div>
				</div>
				<div style={{fontSize: 42, fontWeight: 700, color: '#111', lineHeight: 1.18}}>{d.pergunta}</div>
				{/* rabinho do balão */}
				<div style={{position: 'absolute', left: 34, bottom: -16, width: 0, height: 0, borderLeft: '16px solid transparent', borderRight: '16px solid transparent', borderTop: '18px solid #fff'}} />
			</div>
		</AbsoluteFill>
	);
};

const SetaAd02: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const ent = spring({frame, fps, config: {damping: 12}});
	const pulo = Math.sin((frame / fps) * Math.PI * 3) * 18;
	const d = (cena.dados ?? {}) as {texto?: string};
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<div style={{position: 'absolute', left: 70, bottom: 330 + pulo, opacity: ent, transform: `scale(${ent})`, transformOrigin: 'center bottom', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: poppins}}>
				{d.texto ? (
					<div style={{background: '#FE5000', color: '#fff', fontWeight: 800, fontSize: 34, padding: '10px 22px', borderRadius: 14, marginBottom: 10, boxShadow: '0 6px 20px rgba(0,0,0,0.3)'}}>{d.texto}</div>
				) : null}
				<svg width="150" height="170" viewBox="0 0 100 115" style={{filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.35))'}}>
					<path d="M35 0 H65 V65 H92 L50 112 L8 65 H35 Z" fill="#FE5000" stroke="#fff" strokeWidth="5" strokeLinejoin="round" />
				</svg>
			</div>
		</AbsoluteFill>
	);
};

const ProdutoAd02: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const fim = Math.round((cena.ate - cena.de) * fps);
	const s = spring({frame, fps, config: {damping: 13}});
	const op = interpolate(frame, [fim - 6, fim], [1, 0], lim);
	const d = (cena.dados ?? {}) as {nome?: string; sub?: string; itens?: string[]};
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: op}}>
			<div style={{position: 'absolute', left: 140, right: 140, top: 230, transform: `translateY(${(1 - s) * -120}px) scale(${0.8 + 0.2 * s})`, opacity: s, background: 'linear-gradient(160deg,#fff 0%,#fde8ef 100%)', borderRadius: 34, padding: '34px 34px 30px', boxShadow: '0 14px 40px rgba(0,0,0,0.35)', textAlign: 'center', fontFamily: poppins}}>
				<div style={{width: 150, height: 210, margin: '0 auto 18px', borderRadius: 26, background: 'linear-gradient(180deg,#c2185b,#7b0f3a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 30, lineHeight: 1.05, boxShadow: 'inset 0 -12px 0 rgba(0,0,0,0.15)'}}>
					REJU
					<br />
					VEX
				</div>
				<div style={{fontSize: 60, fontWeight: 800, color: '#7b0f3a', lineHeight: 1}}>{d.nome ?? 'Rejuvex Ultra'}</div>
				{d.sub ? <div style={{fontSize: 30, color: '#333', marginTop: 10, fontWeight: 600}}>{d.sub}</div> : null}
				{d.itens ? (
					<div style={{display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 16}}>
						{d.itens.map((t) => (
							<span key={t} style={{background: '#7b0f3a', color: '#fff', borderRadius: 999, padding: '6px 16px', fontSize: 24, fontWeight: 600}}>
								{t}
							</span>
						))}
					</div>
				) : null}
			</div>
		</AbsoluteFill>
	);
};

export const pecas: Pecas = {caixinhaAd02: CaixinhaAd02, setaAd02: SetaAd02, produtoAd02: ProdutoAd02};
