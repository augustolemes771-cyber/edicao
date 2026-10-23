import React from 'react';
import {poppins} from '../motor/tema';

// Texto neon com profundidade (desmontagem-2, ref. 2, "You know / content / matters"):
// palavra principal gigante em Poppins Black com face em degradê neon, extrusão 3D na mesma cor escurecida,
// brilho em volta e leve perspectiva; as palavras pequenas brancas ficam coladas em cima e embaixo.
export type PaletaNeon = 'lima' | 'tiktok' | 'dourado';

export const PALETAS: Record<PaletaNeon, {topo: string; base: string; fundo: string; brilho: string}> = {
	lima: {topo: '#f2ff8a', base: '#b8f000', fundo: '#3d5a00', brilho: 'rgba(200,255,40,0.55)'},
	tiktok: {topo: '#b8fffb', base: '#25f4ee', fundo: '#c4123c', brilho: 'rgba(37,244,238,0.55)'},
	dourado: {topo: '#fff3b0', base: '#ffc93c', fundo: '#7a4a00', brilho: 'rgba(255,200,60,0.55)'},
};

export type LinhaNeon = {texto: string; grande?: boolean};

const extrusao = (cor: string, passos: number, tamanho: number) => {
	const sombras: string[] = [];
	for (let i = 1; i <= passos; i++) {
		const d = (i * tamanho) / 140;
		sombras.push(`${d * 0.6}px ${d}px 0 ${cor}`);
	}
	sombras.push(`${(passos * tamanho) / 220}px ${(passos * tamanho) / 120}px ${tamanho * 0.12}px rgba(0,0,0,0.55)`);
	return sombras.join(', ');
};

export const NeonProfundo: React.FC<{
	linhas: LinhaNeon[];
	paleta?: PaletaNeon;
	tamanho: number;
	// Progresso de entrada de cada letra (0 a 1); sem isso, o texto aparece pronto (prova estática).
	progresso?: (indiceLetra: number) => number;
}> = ({linhas, paleta = 'lima', tamanho, progresso}) => {
	const p = PALETAS[paleta];
	let k = 0;
	return (
		<div style={{perspective: tamanho * 12, textAlign: 'center'}}>
			<div style={{transform: 'rotateX(12deg) rotateY(-6deg)', transformStyle: 'preserve-3d'}}>
				{linhas.map((l, li) => {
					const tam = l.grande ? tamanho : tamanho * 0.36;
					return (
						<div
							key={li}
							style={{
								fontFamily: poppins,
								fontWeight: l.grande ? 900 : 800,
								fontSize: tam,
								lineHeight: l.grande ? 0.86 : 1,
								letterSpacing: -tam * (l.grande ? 0.045 : 0.03),
								marginTop: l.grande ? -tam * 0.06 : 0,
								whiteSpace: 'nowrap',
							}}
						>
							{[...l.texto].map((ch, ci) => {
								const e = progresso ? progresso(k++) : 1;
								const letra = ch === ' ' ? ' ' : ch;
								const base: React.CSSProperties = {
									display: 'inline-block',
									opacity: e,
									transform: `translateY(${(1 - e) * tam * 0.35}px) scale(${1 + (1 - e) * 0.25})`,
									filter: e < 1 ? `blur(${(1 - e) * 10}px)` : undefined,
								};
								if (!l.grande) {
									return (
										<span
											key={ci}
											style={{...base, color: '#ffffff', textShadow: extrusao('rgba(0,0,0,0.35)', 6, tam)}}
										>
											{letra}
										</span>
									);
								}
								return (
									<span key={ci} style={{...base, position: 'relative'}}>
										{/* Extrusão: a mesma letra empilhada para baixo e à direita na cor escura. */}
										<span style={{color: p.fundo, textShadow: extrusao(p.fundo, 14, tam)}}>{letra}</span>
										{/* Face: degradê neon com brilho. */}
										<span
											style={{
												position: 'absolute',
												left: 0,
												top: 0,
												background: `linear-gradient(180deg, ${p.topo} 0%, ${p.base} 62%, ${p.base} 100%)`,
												WebkitBackgroundClip: 'text',
												backgroundClip: 'text',
												color: 'transparent',
												filter: `drop-shadow(0 0 ${tam * 0.05}px ${p.brilho}) drop-shadow(0 0 ${tam * 0.16}px ${p.brilho})`,
											}}
										>
											{letra}
										</span>
									</span>
								);
							})}
						</div>
					);
				})}
			</div>
		</div>
	);
};
