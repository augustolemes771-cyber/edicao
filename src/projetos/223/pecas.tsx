// Peças próprias dos cortes do vídeo 223 (223-1 a 223-5), usadas com {tipo: 'peca', nome: '<chave>', dados: {...}}.
// Tempos em dados = segundos do vídeo editado; o quadro 0 da peça é cena.de. Todas têm valor padrão se faltar dado.
// Posições em px de um quadro 1080x1920. Rostos em y ≈ 520–700: o que fica sobre o vídeo usa a faixa acima da cabeça
// (y 215–470) ou a metade de baixo (y 1000–1500); legenda em y ≈ 1260 (some quando a peça repete a fala).
// Regras do tema: paleta roxo + ouro + vidro, sans pesada maiúscula e Playfair itálico dourado; motion de tela inteira com
// FundoMotion (grade reta); nada de símbolo solto em canto nem anel com partículas.
import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {CenaPeca, Pecas} from '../../pecas/peca';
import {FundoMotion, GradeReta} from '../../pecas/FundoMotion';
import {playfair, poppins} from '../../motor/tema';

type Item = {texto: string; em: number; sub?: string};
type Dados = {marcos?: number[]; itens?: Item[]; texto?: string; sub?: string};

const lim = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const OURO = '#E8C27A';
const OURO_TEXTO = 'linear-gradient(180deg,#FFF1C9 0%,#F2D08A 40%,#E8C27A 65%,#C9974A 100%)';
const ROXO = '#1E0F3A';
const VERMELHO = '#E5484D';
const VIDRO = 'linear-gradient(180deg, rgba(46,24,86,0.88), rgba(30,15,58,0.9))';
const BORDA = 'inset 0 0 0 2px rgba(232,194,122,0.65), 0 18px 40px rgba(8,2,20,0.5)';
const suave = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

const useCena = (cena: CenaPeca) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const dur = Math.round((cena.ate - cena.de) * fps);
	const q = (t: number) => Math.round((t - cena.de) * fps);
	const entra = interpolate(frame, [0, 6], [0, 1], lim);
	const sai = interpolate(frame, [dur - 7, dur], [1, 0], lim);
	const d = (cena.dados ?? {}) as Dados;
	return {frame, fps, dur, q, entra, sai, d};
};
const mola = (frame: number, f0: number, fps: number, amortece = 12) => spring({frame: frame - f0, fps, config: {damping: amortece, stiffness: 170, mass: 0.7}});
const mc = (d: Dados, cena: CenaPeca, i: number, fb: number) => d.marcos?.[i] ?? cena.de + fb;
const itensOu = (d: Dados, cena: CenaPeca, padrao: string[], passo: number): Item[] =>
	d.itens?.length ? d.itens : padrao.map((texto, i) => ({texto, em: cena.de + 0.3 + i * passo}));
const atual = (itens: Item[], frame: number, q: (t: number) => number) => itens.reduce((r, it, i) => (frame >= q(it.em) ? i : r), -1);

const Pilula: React.FC<{texto: string; k: number; y: number; tamanho?: number; ouro?: boolean; x?: number}> = ({texto, k, y, tamanho = 44, ouro, x}) => (
	<div
		style={{
			position: 'absolute',
			top: y,
			left: x ?? 0,
			right: x === undefined ? 0 : undefined,
			display: 'flex',
			justifyContent: 'center',
			opacity: Math.min(1, k * 1.5),
			transform: `${x === undefined ? '' : 'translateX(-50%) '}translateY(${(1 - k) * 22}px) scale(${0.9 + 0.1 * k})`,
		}}
	>
		<div
			style={{
				background: ouro ? 'linear-gradient(180deg,#F6DB9C,#D9A84E)' : VIDRO,
				boxShadow: ouro ? '0 12px 30px rgba(12,4,28,0.45)' : BORDA,
				borderRadius: 999,
				padding: `${tamanho * 0.34}px ${tamanho * 0.85}px`,
				fontFamily: poppins,
				fontWeight: 800,
				fontSize: tamanho,
				letterSpacing: '0.07em',
				color: ouro ? '#2a1352' : '#fff',
				whiteSpace: 'nowrap',
			}}
		>
			{texto}
		</div>
	</div>
);

// ---------------------------------------------------------------------------------------------------------------------
// 1. Visor de câmera sobre o vídeo (223-1, "pega o produto, filma, não aparece"): cantos do enquadramento, REC piscando,
//    cronômetro andando e o passo da fala (PEGA → FILMA → POSTA) numa pílula na metade de baixo. itens: os passos no tempo.
const p223Visor: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, entra, sai, d} = useCena(cena);
	const itens = itensOu(d, cena, ['PEGA O PRODUTO', 'FILMA', 'NÃO APARECE'], 0.9);
	const i = atual(itens, frame, q);
	const abre = suave(interpolate(frame, [0, 9], [0, 1], lim));
	const m = 70 + (1 - abre) * 120;
	const canto = (rot: number, pos: React.CSSProperties) => (
		<div style={{position: 'absolute', width: 120, height: 120, borderTop: `7px solid ${OURO}`, borderLeft: `7px solid ${OURO}`, borderTopLeftRadius: 26, transform: `rotate(${rot}deg)`, filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.45))', ...pos}} />
	);
	const seg = Math.floor(frame / fps);
	const rec = Math.floor(frame / (fps * 0.5)) % 2 === 0;
	return (
		<AbsoluteFill style={{opacity: sai * entra, pointerEvents: 'none'}}>
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 55%, rgba(12,4,28,0.55) 100%)'}} />
			{canto(0, {left: m, top: m + 140})}
			{canto(90, {right: m, top: m + 140})}
			{canto(270, {left: m, bottom: m + 260})}
			{canto(180, {right: m, bottom: m + 260})}
			{/* Mira de foco no centro do produto (altura das mãos). */}
			<div style={{position: 'absolute', left: 540 - 70, top: 1000 - 70, width: 140, height: 140, border: '3px solid rgba(255,255,255,0.75)', borderRadius: 18, transform: `scale(${1.5 - 0.5 * suave(interpolate(frame, [4, 16], [0, 1], lim))})`, opacity: 0.85}} />
			<div style={{position: 'absolute', top: 250, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 22, alignItems: 'center'}}>
				<div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '12px 26px', borderRadius: 999, background: 'rgba(12,4,28,0.62)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.25)'}}>
					<div style={{width: 26, height: 26, borderRadius: 13, background: VERMELHO, opacity: rec ? 1 : 0.25, boxShadow: rec ? '0 0 18px rgba(229,72,77,0.9)' : 'none'}} />
					<div style={{fontFamily: poppins, fontWeight: 800, fontSize: 38, color: '#fff', letterSpacing: '0.1em'}}>REC</div>
					<div style={{fontFamily: poppins, fontWeight: 600, fontSize: 38, color: 'rgba(255,255,255,0.85)', fontVariantNumeric: 'tabular-nums'}}>00:{String(seg).padStart(2, '0')}</div>
				</div>
			</div>
			{itens.map((it, k) => {
				if (k !== i) return null;
				const p = mola(frame, q(it.em), fps, 11);
				return <Pilula key={k} texto={it.texto} k={p} y={1090} tamanho={52} ouro={k === itens.length - 1} />;
			})}
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------------------------------------------------------------
// 2. Cupons (223-2, "cem milhões em cupons"): cupons dourados com picote caem do topo e se empilham em leque na metade de
//    baixo, sob um véu roxo; no marco 0 começa a chuva, no marco 1 a pílula "PRA COMPRAR EM LIVE".
const CUPONS = [
	{t: '- R$ 20', s: 'CUPOM'},
	{t: 'FRETE', s: 'GRÁTIS'},
	{t: '- 30%', s: 'CUPOM'},
	{t: '- R$ 50', s: 'CUPOM'},
	{t: '- 15%', s: 'CUPOM'},
];
const Cupom: React.FC<{t: string; s: string}> = ({t, s}) => (
	<div style={{width: 380, height: 170, borderRadius: 22, display: 'flex', overflow: 'hidden', boxShadow: '0 16px 34px rgba(8,2,20,0.55)'}}>
		<div style={{flex: 1, background: 'linear-gradient(180deg,#FBE3A6,#D9A84E)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
			<div style={{fontFamily: poppins, fontWeight: 900, fontSize: 64, color: ROXO, lineHeight: 1}}>{t}</div>
			<div style={{fontFamily: poppins, fontWeight: 700, fontSize: 26, letterSpacing: '0.2em', color: '#4a2a86', marginTop: 6}}>{s}</div>
		</div>
		<div style={{width: 0, borderLeft: '5px dashed rgba(30,15,58,0.55)'}} />
		<div style={{width: 92, background: 'linear-gradient(180deg,#5b34a8,#2e1856)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
			<div style={{fontFamily: poppins, fontWeight: 800, fontSize: 24, color: OURO, letterSpacing: '0.18em', transform: 'rotate(-90deg)', whiteSpace: 'nowrap'}}>LIVE</div>
		</div>
	</div>
);
const p223Cupons: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, entra, sai, d, dur} = useCena(cena);
	const f0 = q(mc(d, cena, 0, 0.2));
	const f1 = Math.min(q(mc(d, cena, 1, 1.4)), dur - 14);
	return (
		<AbsoluteFill style={{opacity: sai, pointerEvents: 'none'}}>
			<AbsoluteFill style={{opacity: entra, background: 'linear-gradient(180deg, rgba(30,15,58,0) 46%, rgba(30,15,58,0.6) 55%, rgba(24,11,48,0.8) 100%)'}} />
			<AbsoluteFill style={{opacity: entra}}>
				<GradeReta topo={0.52} />
			</AbsoluteFill>
			{CUPONS.map((c, i) => {
				const fi = f0 + i * 4;
				const p = mola(frame, fi, fps, 13);
				const giro = (i - 2) * 9;
				const y = interpolate(p, [0, 1], [-260, 1130 + Math.abs(i - 2) * 22]);
				const x = 540 + (i - 2) * 92;
				return frame >= fi ? (
					<div key={i} style={{position: 'absolute', left: x - 190, top: y, transform: `rotate(${giro * p + (1 - p) * 40}deg)`, zIndex: 10 - Math.abs(i - 2)}}>
						<Cupom t={c.t} s={c.s} />
					</div>
				) : null;
			})}
			<Pilula texto={d.texto ?? 'PRA COMPRAR EM LIVE'} k={mola(frame, f1, fps, 12)} y={1400} tamanho={44} />
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------------------------------------------------------------
// 3. Linha do tempo (223-2, "Shopee tem 7 anos... TikTok tem 1 ano e meio"): duas barras de vidro acima da cabeça que crescem
//    no tempo de cada fala; a do TikTok fica curta e ganha a pílula "NOVO". itens: [{texto, sub, em}] (SHOPEE, TIKTOK SHOP).
const p223Tempo: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, entra, sai, d} = useCena(cena);
	const itens = itensOu(d, cena, ['SHOPEE', 'TIKTOK SHOP'], 1.2);
	const anos = [7, 1.5];
	const subs = ['7 ANOS', '1 ANO E MEIO'];
	return (
		<AbsoluteFill style={{opacity: sai, pointerEvents: 'none'}}>
			<AbsoluteFill style={{opacity: entra, background: 'linear-gradient(180deg, rgba(30,15,58,0.86) 0%, rgba(30,15,58,0.55) 22%, rgba(30,15,58,0) 30%)'}} />
			{itens.slice(0, 2).map((it, i) => {
				const f = q(it.em);
				const p = mola(frame, f, fps, 14);
				const cresce = suave(interpolate(frame, [f, f + 16], [0, 1], lim));
				const largura = 90 + (anos[i] / 7) * 480 * cresce;
				const y = 200 + i * 132;
				return frame >= f - 1 ? (
					<div key={i} style={{position: 'absolute', left: 90, top: y, opacity: Math.min(1, p * 1.4), transform: `translateX(${(1 - p) * -40}px)`}}>
						<div style={{fontFamily: poppins, fontWeight: 800, fontSize: 30, letterSpacing: '0.16em', color: i === 0 ? 'rgba(255,255,255,0.8)' : OURO, marginBottom: 8}}>{it.texto}</div>
						<div style={{display: 'flex', alignItems: 'center', gap: 18}}>
							<div style={{width: largura, height: 54, borderRadius: 27, background: i === 0 ? 'linear-gradient(90deg, rgba(255,255,255,0.35), rgba(255,255,255,0.7))' : 'linear-gradient(90deg,#C9974A,#F6DB9C)', boxShadow: '0 10px 26px rgba(8,2,20,0.45)'}} />
							<div style={{fontFamily: playfair, fontStyle: 'italic', fontWeight: 700, fontSize: 42, color: i === 0 ? '#fff' : OURO, opacity: cresce, whiteSpace: 'nowrap'}}>{it.sub ?? subs[i]}</div>
						</div>
					</div>
				) : null;
			})}
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------------------------------------------------------------
// 4. Mosaico de lives (223-3, "mil e quinhentas lives ligadas simultaneamente"): tela inteira com 1.500 telinhas (30 x 50)
//    que acendem em onda do centro para fora, cada uma com o pontinho vermelho de AO VIVO; o contador sobe de 0 a 1.500
//    entre o marco 0 e o marco 1 e trava com um clarão suave; embaixo "LIVES AO MESMO TEMPO".
const COLS = 30;
const LINS = 50;
const p223Mosaico: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, entra, sai, d, dur} = useCena(cena);
	const f0 = q(mc(d, cena, 0, 0.2));
	const f1 = Math.min(Math.max(q(mc(d, cena, 1, 1.6)), f0 + 20), dur - 16);
	const prog = suave(interpolate(frame, [f0, f1], [0, 1], lim));
	const valor = Math.round(1500 * prog);
	const trava = interpolate(frame, [f1, f1 + 10], [1, 0], lim);
	const celW = 1080 / COLS;
	const celH = 1920 / LINS;
	const cel: React.ReactNode[] = [];
	for (let r = 0; r < LINS; r++) {
		for (let c = 0; c < COLS; c++) {
			const dx = (c + 0.5) / COLS - 0.5;
			const dy = ((r + 0.5) / LINS - 0.5) * 1.78;
			const dist = Math.sqrt(dx * dx + dy * dy) / 0.98;
			const aceso = prog >= dist ? 1 : 0;
			if (!aceso) continue;
			const tom = ((r * 7 + c * 13) % 5) / 5;
			cel.push(
				<div
					key={r * COLS + c}
					style={{
						position: 'absolute',
						left: c * celW + 2,
						top: r * celH + 2,
						width: celW - 4,
						height: celH - 4,
						borderRadius: 4,
						background: `linear-gradient(180deg, rgba(${120 + tom * 70},${60 + tom * 50},${200 - tom * 30},1), rgba(34,16,70,1))`, boxShadow: 'inset 0 0 0 1px rgba(232,194,122,0.25)',
					}}
				>
					<div style={{position: 'absolute', right: 3, top: 3, width: 6, height: 6, borderRadius: 3, background: VERMELHO, opacity: (r + c + Math.floor(frame / 6)) % 4 === 0 ? 0.35 : 1}} />
				</div>,
			);
		}
	}
	const pNum = mola(frame, f0, fps, 13);
	return (
		<AbsoluteFill style={{opacity: sai * entra}}>
			<FundoMotion />
			<AbsoluteFill>{cel}</AbsoluteFill>
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 46%, rgba(16,6,34,0.94) 0%, rgba(16,6,34,0.8) 26%, rgba(16,6,34,0) 52%)'}} />
			<AbsoluteFill style={{background: '#fff', opacity: 0.35 * trava * (frame >= f1 ? 1 : 0)}} />
			<div style={{position: 'absolute', top: 700, left: 0, right: 0, textAlign: 'center', transform: `scale(${0.7 + 0.3 * pNum})`, opacity: pNum}}>
				<div style={{display: 'inline-flex', alignItems: 'center', gap: 14, padding: '10px 26px', borderRadius: 999, background: VERMELHO, fontFamily: poppins, fontWeight: 800, fontSize: 36, color: '#fff', letterSpacing: '0.14em'}}>
					<div style={{width: 18, height: 18, borderRadius: 9, background: '#fff'}} />
					AO VIVO
				</div>
				<div style={{fontFamily: poppins, fontWeight: 900, fontSize: 250, lineHeight: 1.05, marginTop: 18, backgroundImage: OURO_TEXTO, WebkitBackgroundClip: 'text', color: 'transparent', fontVariantNumeric: 'tabular-nums', filter: 'drop-shadow(0 12px 30px rgba(0,0,0,0.6))'}}>
					{valor.toLocaleString('pt-BR')}
				</div>
				<div style={{fontFamily: playfair, fontStyle: 'italic', fontWeight: 700, fontSize: 70, color: '#fff', marginTop: 4}}>{d.texto ?? 'lives ao mesmo tempo'}</div>
			</div>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------------------------------------------------------------
// 5. Lata (223-4, "tem um cara vendendo bosta em lata"): lata metálica de verdade desenhada (corpo cilíndrico com reflexo,
//    tampa elíptica com anel de abrir, rótulo roxo e dourado) cai acima da cabeça e quica; no marco 0 entra a etiqueta
//    de preço e no marco 1 o carimbo VENDIDO bate. texto: rótulo da lata.
const p223Lata: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, sai, d, dur} = useCena(cena);
	const pCai = mola(frame, 0, fps, 9);
	const y = interpolate(pCai, [0, 1], [-420, 150]);
	const f0 = q(mc(d, cena, 0, 0.9));
	const f1 = Math.min(q(mc(d, cena, 1, 1.8)), dur - 14);
	const pPreco = mola(frame, f0, fps, 11);
	const pCarimbo = spring({frame: frame - f1, fps, config: {damping: 9, stiffness: 260, mass: 0.6}});
	const balanco = Math.sin(frame / 7) * 3 * (1 - Math.min(1, frame / 40)) + Math.sin(frame / 18) * 1.5;
	const W = 300;
	const H = 380;
	return (
		<AbsoluteFill style={{opacity: sai, pointerEvents: 'none'}}>
			<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(30,15,58,0.8) 0%, rgba(30,15,58,0.45) 22%, rgba(30,15,58,0) 30%)', opacity: Math.min(1, frame / 6)}} />
			<div style={{position: 'absolute', left: 540 - W / 2 - 120, top: y, width: W, height: H + 60, transform: `rotate(${balanco}deg)`, transformOrigin: '50% 100%', filter: 'drop-shadow(0 22px 30px rgba(0,0,0,0.55))'}}>
				{/* corpo */}
				<div style={{position: 'absolute', top: 30, left: 0, width: W, height: H, borderRadius: `${W / 2}px / 30px`, background: 'linear-gradient(90deg,#6f6f78 0%,#d9d9e2 18%,#f7f7fb 28%,#a9a9b4 48%,#7c7c86 70%,#c9c9d2 86%,#62626b 100%)'}} />
				{/* rótulo */}
				<div style={{position: 'absolute', top: 100, left: 0, width: W, height: 230, background: 'linear-gradient(90deg,#24113f 0%,#4b2a86 22%,#5b34a8 30%,#3a1f6b 55%,#24113f 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 4px 0 #E8C27A, inset 0 -4px 0 #E8C27A'}}>
					<div style={{fontFamily: poppins, fontWeight: 900, fontSize: 40, color: '#fff', letterSpacing: '0.12em', lineHeight: 1}}>{(d.texto ?? 'BOSTA').toUpperCase()}</div>
					<div style={{fontFamily: playfair, fontStyle: 'italic', fontWeight: 700, fontSize: 56, color: OURO, lineHeight: 1.1}}>em lata</div>
					<div style={{fontFamily: poppins, fontWeight: 600, fontSize: 18, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.3em', marginTop: 8}}>350 G</div>
				</div>
				{/* tampa */}
				<div style={{position: 'absolute', top: 0, left: 0, width: W, height: 62, borderRadius: '50%', background: 'radial-gradient(ellipse at 45% 40%, #fbfbff 0%, #c6c6d0 45%, #84848e 100%)', boxShadow: 'inset 0 -6px 0 #6a6a74'}}>
					<div style={{position: 'absolute', left: W / 2 - 46, top: 14, width: 92, height: 34, borderRadius: 17, border: '6px solid #9a9aa4'}} />
				</div>
			</div>
			{/* etiqueta de preço */}
			<div style={{position: 'absolute', left: 640, top: 190, opacity: Math.min(1, pPreco * 1.5), transform: `scale(${0.6 + 0.4 * pPreco}) rotate(${-8 + (1 - pPreco) * 30}deg)`}}>
				<div style={{padding: '18px 34px', borderRadius: 22, background: VIDRO, boxShadow: BORDA}}>
					<div style={{fontFamily: poppins, fontWeight: 700, fontSize: 26, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.18em'}}>TIKTOK SHOP</div>
					<div style={{fontFamily: poppins, fontWeight: 900, fontSize: 72, color: '#fff', lineHeight: 1.05}}>R$ 39,90</div>
				</div>
			</div>
			{/* carimbo */}
			{frame >= f1 ? (
				<div style={{position: 'absolute', left: 245, top: 380, transform: `rotate(-14deg) scale(${2.2 - 1.2 * pCarimbo})`, opacity: Math.min(1, pCarimbo * 2)}}>
					<div style={{padding: '10px 36px', border: `9px solid ${VERMELHO}`, borderRadius: 18, fontFamily: poppins, fontWeight: 900, fontSize: 64, color: VERMELHO, letterSpacing: '0.08em', background: 'rgba(255,255,255,0.85)'}}>VENDIDO</div>
				</div>
			) : null}
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------------------------------------------------------------
// 6. Relógio do dia (223-5, "uma ou duas horas disponível no seu dia"): mostrador de 24 h de vidro na metade de baixo; no
//    marco 0 um arco dourado preenche 2 h; no marco 1 o centro troca "2 H DO SEU DIA" por "R$ 500 A R$ 1 MIL / POR DIA".
const p223Relogio: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, entra, sai, d, dur} = useCena(cena);
	const f0 = q(mc(d, cena, 0, 0.3));
	// Sem o marco 1 o relógio só mostra as 2 h (a troca para o dinheiro fica para outra cena).
	const f1 = d.marcos && d.marcos.length > 1 ? Math.min(q(d.marcos[1]), dur - 16) : Infinity;
	const pEntra = mola(frame, 0, fps, 13);
	const arco = suave(interpolate(frame, [f0, f0 + 18], [0, 1], lim));
	const troca = Number.isFinite(f1) ? suave(interpolate(frame, [f1, f1 + 8], [0, 1], lim)) : 0;
	const R = 210;
	const C = 2 * Math.PI * R;
	const fracao = (2 / 24) * arco;
	const cx = 540;
	const cy = 1200;
	return (
		<AbsoluteFill style={{opacity: sai, pointerEvents: 'none'}}>
			<AbsoluteFill style={{opacity: entra, background: 'linear-gradient(180deg, rgba(30,15,58,0) 42%, rgba(30,15,58,0.62) 52%, rgba(24,11,48,0.82) 100%)'}} />
			<AbsoluteFill style={{opacity: entra}}>
				<GradeReta topo={0.5} />
			</AbsoluteFill>
			<div style={{position: 'absolute', left: cx - 260, top: cy - 260, width: 520, height: 520, transform: `scale(${0.7 + 0.3 * pEntra})`, opacity: pEntra}}>
				<div style={{position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle, rgba(70,38,128,0.92) 0%, rgba(30,15,58,0.95) 70%)', boxShadow: 'inset 0 0 0 3px rgba(232,194,122,0.6), 0 24px 50px rgba(8,2,20,0.6)'}} />
				<svg width={520} height={520} style={{position: 'absolute', inset: 0}}>
					{Array.from({length: 24}, (_, h) => {
						const a = (h / 24) * Math.PI * 2 - Math.PI / 2;
						const r1 = h % 6 === 0 ? 228 : 238;
						return <line key={h} x1={260 + Math.cos(a) * r1} y1={260 + Math.sin(a) * r1} x2={260 + Math.cos(a) * 248} y2={260 + Math.sin(a) * 248} stroke="rgba(255,255,255,0.55)" strokeWidth={h % 6 === 0 ? 5 : 3} strokeLinecap="round" />;
					})}
					<circle cx={260} cy={260} r={R} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={30} />
					<circle cx={260} cy={260} r={R} fill="none" stroke="url(#ouro223)" strokeWidth={30} strokeLinecap="round" strokeDasharray={`${C * fracao} ${C}`} transform="rotate(-90 260 260)" style={{filter: 'drop-shadow(0 0 12px rgba(232,194,122,0.7))'}} />
					<defs>
						<linearGradient id="ouro223" x1="0" y1="0" x2="1" y2="1">
							<stop offset="0" stopColor="#FFF1C9" />
							<stop offset="1" stopColor="#C9974A" />
						</linearGradient>
					</defs>
				</svg>
				<div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 1 - troca, transform: `scale(${1 - 0.15 * troca})`}}>
					<div style={{fontFamily: poppins, fontWeight: 900, fontSize: 130, lineHeight: 1, backgroundImage: OURO_TEXTO, WebkitBackgroundClip: 'text', color: 'transparent'}}>2 H</div>
					<div style={{fontFamily: playfair, fontStyle: 'italic', fontWeight: 700, fontSize: 46, color: '#fff'}}>do seu dia</div>
				</div>
				<div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: troca, transform: `scale(${0.85 + 0.15 * troca})`}}>
					<div style={{fontFamily: poppins, fontWeight: 700, fontSize: 30, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.18em'}}>NUMA LIVE</div>
					<div style={{fontFamily: poppins, fontWeight: 900, fontSize: 80, lineHeight: 1.05, backgroundImage: OURO_TEXTO, WebkitBackgroundClip: 'text', color: 'transparent', whiteSpace: 'nowrap'}}>R$ 500</div>
					<div style={{fontFamily: playfair, fontStyle: 'italic', fontWeight: 700, fontSize: 44, color: '#fff'}}>a R$ 1 mil por dia</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------------------------------------------------------------
// Fundo de meia tela (metade de baixo com véu roxo e grade), usado pelas peças que ficam na faixa da legenda.
const MeiaTela: React.FC<{k: number}> = ({k}) => (
	<>
		<AbsoluteFill style={{opacity: k, background: 'linear-gradient(180deg, rgba(30,15,58,0) 44%, rgba(30,15,58,0.62) 53%, rgba(24,11,48,0.82) 100%)'}} />
		<AbsoluteFill style={{opacity: k}}>
			<GradeReta topo={0.5} />
		</AbsoluteFill>
	</>
);
const Rotulo: React.FC<{texto: string; cor?: string; tamanho?: number}> = ({texto, cor = '#fff', tamanho = 34}) => (
	<div style={{fontFamily: poppins, fontWeight: 800, fontSize: tamanho, letterSpacing: '0.12em', color: cor, whiteSpace: 'nowrap'}}>{texto}</div>
);
const Avatar: React.FC<{tam: number; cor: string; brilho?: number}> = ({tam, cor, brilho = 0}) => (
	<svg width={tam} height={tam * 1.2} viewBox="0 0 50 60" style={{filter: brilho > 0 ? `drop-shadow(0 0 ${10 * brilho}px rgba(232,194,122,${0.9 * brilho}))` : undefined}}>
		<circle cx={25} cy={16} r={11} fill={cor} />
		<path d="M4 58 C4 38 14 31 25 31 C36 31 46 38 46 58 Z" fill={cor} />
	</svg>
);

// 7. Meio a meio (223-8, "15 homens, 15 mulheres: é 50, 50"): duas colunas de 15 bonecos que enchem uma de cada lado no tempo
//    de cada palavra (itens[0] e itens[1]) e, no marco 0, a pílula "50 / 50" sobe entre elas. Metade de baixo.
const p223MeioAMeio: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, entra, sai, d, dur} = useCena(cena);
	const itens = itensOu(d, cena, ['15 HOMENS', '15 MULHERES'], 0.8);
	const f2 = Math.min(q(mc(d, cena, 0, 1.8)), dur - 12);
	const lado = (i: number) => {
		const f = q(itens[i]?.em ?? cena.de + 0.3 + i * 0.8);
		const x0 = i === 0 ? 120 : 600;
		return (
			<div key={i} style={{position: 'absolute', left: x0, top: 1030, width: 360}}>
				<div style={{marginBottom: 14, opacity: suave(interpolate(frame, [f, f + 8], [0, 1], lim)), textAlign: 'center'}}>
					<Rotulo texto={itens[i]?.texto ?? ''} cor={i === 0 ? '#fff' : OURO} tamanho={36} />
				</div>
				<div style={{display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center'}}>
					{Array.from({length: 15}, (_, k) => {
						const p = mola(frame, f + k * 1.2, fps, 12);
						return (
							<div key={k} style={{transform: `scale(${p})`, opacity: Math.min(1, p * 1.5)}}>
								<Avatar tam={56} cor={i === 0 ? 'rgba(255,255,255,0.88)' : OURO} />
							</div>
						);
					})}
				</div>
			</div>
		);
	};
	const p50 = mola(frame, f2, fps, 10);
	return (
		<AbsoluteFill style={{opacity: sai, pointerEvents: 'none'}}>
			<MeiaTela k={entra} />
			{lado(0)}
			{lado(1)}
			<div style={{position: 'absolute', left: 538, top: 1040, width: 4, height: 360, background: 'linear-gradient(180deg, rgba(232,194,122,0), rgba(232,194,122,0.8), rgba(232,194,122,0))', opacity: entra}} />
			{frame >= f2 ? <Pilula texto={d.texto ?? '50 / 50'} k={p50} y={1440} tamanho={58} ouro /> : null}
		</AbsoluteFill>
	);
};

// 8. Espalhar (223-10, "o mesmo vídeo em outras plataformas"): um cartão de vídeo no centro da metade de baixo; no marco 0 ele
//    se copia em três que deslizam para os lados com as pílulas das plataformas (itens: rótulos no tempo da fala).
const CartaoVideo: React.FC = () => (
	<div style={{width: 200, height: 300, borderRadius: 26, background: 'linear-gradient(180deg,#4b2a86,#24113f)', boxShadow: BORDA, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
		<div style={{width: 0, height: 0, borderTop: '30px solid transparent', borderBottom: '30px solid transparent', borderLeft: `48px solid ${OURO}`, marginLeft: 10}} />
	</div>
);
const p223Espalha: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, entra, sai, d} = useCena(cena);
	const itens = itensOu(d, cena, ['TIKTOK', 'SHOPEE', '+ CANAIS'], 0.6);
	const f0 = q(mc(d, cena, 0, 0.6));
	const pEntra = mola(frame, 0, fps, 12);
	const abre = mola(frame, f0, fps, 13);
	const xs = [-320, 0, 320];
	return (
		<AbsoluteFill style={{opacity: sai, pointerEvents: 'none'}}>
			<MeiaTela k={entra} />
			{xs.map((dx, i) => {
				const x = 540 + dx * abre - 100;
				const fi = Math.max(q(itens[i]?.em ?? cena.de + 1), f0);
				const kR = mola(frame, fi, fps, 12);
				return (
					<div key={i} style={{position: 'absolute', left: x, top: 1060, opacity: i === 1 ? pEntra : Math.min(1, abre * 1.4), transform: `scale(${i === 1 ? 0.8 + 0.2 * pEntra : 0.85 + 0.15 * abre}) rotate(${dx * 0.02 * abre}deg)`}}>
						<CartaoVideo />
						<div style={{position: 'absolute', top: 318, left: 100, transform: `translateX(-50%) translateY(${(1 - kR) * 16}px)`, opacity: frame >= fi ? kR : 0}}>
							<div style={{padding: '10px 26px', borderRadius: 999, background: i === 1 ? 'linear-gradient(180deg,#F6DB9C,#D9A84E)' : VIDRO, boxShadow: BORDA}}>
								<Rotulo texto={itens[i]?.texto ?? ''} cor={i === 1 ? ROXO : '#fff'} tamanho={30} />
							</div>
						</div>
					</div>
				);
			})}
			<Pilula texto={d.texto ?? 'MESMO VÍDEO'} k={pEntra} y={950} tamanho={40} />
		</AbsoluteFill>
	);
};

// 9. Rótulo (223-13, "rerotulação: produto A vira produto B, mesma coisa"): pote de vidro com rótulo "A" acima da cabeça; no
//    marco 0 o rótulo vira (giro 3D) e aparece "B" em ouro; no marco 1 a pílula "MESMO PRODUTO" bate embaixo.
const p223Rotulo: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, sai, d, dur} = useCena(cena);
	const pEntra = mola(frame, 0, fps, 11);
	const f0 = q(mc(d, cena, 0, 1));
	const f1 = Math.min(q(mc(d, cena, 1, 2)), dur - 12);
	const giro = suave(interpolate(frame, [f0, f0 + 12], [0, 1], lim)) * 180;
	const ladoB = giro > 90;
	const flutua = Math.sin(frame / 14) * 6;
	return (
		<AbsoluteFill style={{opacity: sai, pointerEvents: 'none'}}>
			<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(30,15,58,0.8) 0%, rgba(30,15,58,0.45) 22%, rgba(30,15,58,0) 30%)', opacity: pEntra}} />
			<div style={{position: 'absolute', left: 410, top: 170 + flutua + (1 - pEntra) * -300, width: 260, height: 330, opacity: Math.min(1, pEntra * 1.5), filter: 'drop-shadow(0 20px 28px rgba(0,0,0,0.5))'}}>
				<div style={{position: 'absolute', left: 30, top: 0, width: 200, height: 54, borderRadius: 14, background: 'linear-gradient(90deg,#3a1f6b,#7a52c4 40%,#3a1f6b)'}} />
				<div style={{position: 'absolute', left: 0, top: 46, width: 260, height: 284, borderRadius: 40, background: 'linear-gradient(90deg, rgba(255,255,255,0.18), rgba(255,255,255,0.42) 25%, rgba(255,255,255,0.12) 60%, rgba(255,255,255,0.3))', boxShadow: 'inset 0 0 0 3px rgba(255,255,255,0.35)'}} />
				<div style={{position: 'absolute', left: 20, top: 120, width: 220, height: 150, perspective: 900}}>
					<div style={{width: '100%', height: '100%', transform: `rotateY(${giro}deg)`, transformStyle: 'preserve-3d', position: 'relative'}}>
						<div style={{position: 'absolute', inset: 0, backfaceVisibility: 'hidden', borderRadius: 14, background: 'linear-gradient(180deg,#f4f4f8,#c9c9d2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: ladoB ? 0 : 1}}>
							<Rotulo texto="PRODUTO" cor="#4a2a86" tamanho={22} />
							<div style={{fontFamily: poppins, fontWeight: 900, fontSize: 84, color: ROXO, lineHeight: 1}}>A</div>
						</div>
						<div style={{position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', borderRadius: 14, background: 'linear-gradient(180deg,#FBE3A6,#D9A84E)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: ladoB ? 1 : 0}}>
							<Rotulo texto="NOVO RÓTULO" cor={ROXO} tamanho={22} />
							<div style={{fontFamily: playfair, fontStyle: 'italic', fontWeight: 700, fontSize: 92, color: ROXO, lineHeight: 1}}>B</div>
						</div>
					</div>
				</div>
			</div>
			{frame >= f1 ? <Pilula texto={d.texto ?? 'MESMO PRODUTO'} k={mola(frame, f1, fps, 11)} y={540} tamanho={40} /> : null}
		</AbsoluteFill>
	);
};

// 10. Escala (223-15, "100 mil habitantes... 100 milhões de usuários"): tela inteira; no marco 0 um círculo pequeno com o número
//     menor; no marco 1 um círculo dourado gigante cresce e engole a tela com o número maior. itens[0..1]: {texto, sub}.
const p223Escala: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, entra, sai, d, dur} = useCena(cena);
	const f0 = q(mc(d, cena, 0, 0.2));
	const f1 = Math.min(q(mc(d, cena, 1, 1.6)), dur - 18);
	const pA = mola(frame, f0, fps, 12);
	const pB = suave(interpolate(frame, [f1, f1 + 16], [0, 1], lim));
	const rB = 40 + pB * 820;
	const textos = [d.itens?.[0]?.texto ?? '100 MIL', d.itens?.[0]?.sub ?? 'habitantes', d.itens?.[1]?.texto ?? '100 MILHÕES', d.itens?.[1]?.sub ?? 'de usuários'];
	return (
		<AbsoluteFill style={{opacity: sai * entra}}>
			<FundoMotion />
			{frame >= f1 ? (
				<div style={{position: 'absolute', left: 540 - rB, top: 960 - rB, width: rB * 2, height: rB * 2, borderRadius: '50%', background: 'radial-gradient(circle at 40% 35%, #F6DB9C 0%, #D9A84E 45%, #8f5f1c 100%)', boxShadow: '0 0 80px rgba(232,194,122,0.5)'}} />
			) : null}
			<div style={{position: 'absolute', left: 410, top: 830 - pB * 520, width: 260, height: 260, borderRadius: '50%', background: VIDRO, boxShadow: BORDA, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: `scale(${pA * (1 - 0.35 * pB)})`}}>
				<div style={{fontFamily: poppins, fontWeight: 900, fontSize: 60, color: '#fff', lineHeight: 1}}>{textos[0]}</div>
				<div style={{fontFamily: playfair, fontStyle: 'italic', fontWeight: 700, fontSize: 34, color: OURO}}>{textos[1]}</div>
			</div>
			<div style={{position: 'absolute', top: 880, left: 0, right: 0, textAlign: 'center', opacity: pB, transform: `scale(${0.8 + 0.2 * pB})`}}>
				<div style={{fontFamily: poppins, fontWeight: 900, fontSize: 120, color: ROXO, lineHeight: 1}}>{textos[2]}</div>
				<div style={{fontFamily: playfair, fontStyle: 'italic', fontWeight: 700, fontSize: 64, color: ROXO}}>{textos[3]}</div>
			</div>
		</AbsoluteFill>
	);
};

// 11. Algoritmo (223-9, "o TikTok sabe quem é o público daquele produto"): metade de baixo com 18 bonecos; o link do produto
//     entra no centro; no marco 0 saem linhas douradas até os 6 que já engajaram, que acendem em ouro; no marco 1 a pílula
//     "PÚBLICO CERTO" bate.
const PESSOAS = Array.from({length: 18}, (_, i) => ({x: 150 + (i % 6) * 140 + ((Math.floor(i / 6) % 2) * 50 - 25), y: 1050 + Math.floor(i / 6) * 150, alvo: [1, 4, 6, 9, 13, 16].includes(i)}));
const p223Algoritmo: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, entra, sai, d, dur} = useCena(cena);
	const f0 = q(mc(d, cena, 0, 0.8));
	const f1 = Math.min(q(mc(d, cena, 1, 1.8)), dur - 12);
	const pLink = mola(frame, 0, fps, 12);
	const linhas = suave(interpolate(frame, [f0, f0 + 14], [0, 1], lim));
	const cx = 540;
	const cy = 1210;
	return (
		<AbsoluteFill style={{opacity: sai, pointerEvents: 'none'}}>
			<MeiaTela k={entra} />
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
				{PESSOAS.filter((p) => p.alvo).map((p, i) => (
					<line key={i} x1={cx} y1={cy} x2={cx + (p.x + 28 - cx) * linhas} y2={cy + (p.y + 34 - cy) * linhas} stroke={OURO} strokeWidth={4} strokeLinecap="round" opacity={0.85} />
				))}
			</svg>
			{PESSOAS.map((p, i) => {
				const aceso = p.alvo ? suave(interpolate(frame, [f0 + 10, f0 + 16], [0, 1], lim)) : 0;
				return (
					<div key={i} style={{position: 'absolute', left: p.x, top: p.y, opacity: (0.45 + 0.55 * aceso) * entra, transform: `scale(${1 + 0.15 * aceso})`}}>
						<Avatar tam={56} cor={aceso > 0.5 ? OURO : 'rgba(255,255,255,0.6)'} brilho={aceso} />
					</div>
				);
			})}
			<div style={{position: 'absolute', left: cx, top: cy, transform: `translate(-50%, -50%) scale(${0.6 + 0.4 * pLink})`, opacity: pLink}}>
				<div style={{padding: '14px 30px', borderRadius: 999, background: 'linear-gradient(180deg,#F6DB9C,#D9A84E)', boxShadow: '0 12px 30px rgba(12,4,28,0.5)', display: 'flex', alignItems: 'center', gap: 12}}>
					<svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke={ROXO} strokeWidth={2.6} strokeLinecap="round">
						<path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1" />
						<path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />
					</svg>
					<Rotulo texto="LINK DO PRODUTO" cor={ROXO} tamanho={30} />
				</div>
			</div>
			{frame >= f1 ? <Pilula texto={d.texto ?? 'PÚBLICO CERTO'} k={mola(frame, f1, fps, 11)} y={1500} tamanho={42} /> : null}
		</AbsoluteFill>
	);
};

// 12. Apartamento (223-14, "apartamento de 40 m², quatro lives simultâneas"): planta baixa dourada acima da cabeça com 4
//     cômodos; no marco 0 aparece "40 m²" e, a partir do marco 1, cada cômodo acende com o selo AO VIVO, um a um.
const p223Apto: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps, q, sai, d, dur} = useCena(cena);
	const pEntra = mola(frame, 0, fps, 12);
	const f0 = q(mc(d, cena, 0, 0.5));
	const f1 = Math.min(q(mc(d, cena, 1, 1.4)), dur - 24);
	const W = 600;
	const H = 330;
	const y0 = 170;
	const comodos = [
		{x: 0, y: 0},
		{x: 300, y: 0},
		{x: 0, y: 165},
		{x: 300, y: 165},
	];
	return (
		<AbsoluteFill style={{opacity: sai, pointerEvents: 'none'}}>
			<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(30,15,58,0.88) 0%, rgba(30,15,58,0.6) 24%, rgba(30,15,58,0) 32%)', opacity: pEntra}} />
			<div style={{position: 'absolute', left: 540 - W / 2, top: y0, width: W, height: H, transform: `perspective(1200px) rotateX(${(1 - pEntra) * 50 + 18}deg) scale(${0.85 + 0.15 * pEntra})`, opacity: pEntra}}>
				{comodos.map((c, i) => {
					const fi = f1 + i * 5;
					const luz = suave(interpolate(frame, [fi, fi + 6], [0, 1], lim));
					return (
						<div key={i} style={{position: 'absolute', left: c.x, top: c.y, width: 300, height: 165, border: `5px solid ${OURO}`, background: `rgba(${46 + luz * 60},${24 + luz * 30},${86 + luz * 40},${0.6 + 0.3 * luz})`, boxShadow: luz > 0 ? `inset 0 0 40px rgba(232,194,122,${0.5 * luz})` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
							<div style={{opacity: luz, transform: `scale(${0.7 + 0.3 * luz})`, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 18px', borderRadius: 999, background: VERMELHO}}>
								<div style={{width: 14, height: 14, borderRadius: 7, background: '#fff'}} />
								<Rotulo texto="AO VIVO" tamanho={26} />
							</div>
						</div>
					);
				})}
			</div>
			<div style={{position: 'absolute', left: 0, right: 0, top: y0 + H + 40, textAlign: 'center', opacity: suave(interpolate(frame, [f0, f0 + 8], [0, 1], lim))}}>
				<span style={{fontFamily: poppins, fontWeight: 900, fontSize: 64, backgroundImage: OURO_TEXTO, WebkitBackgroundClip: 'text', color: 'transparent'}}>40 m²</span>
				<span style={{fontFamily: playfair, fontStyle: 'italic', fontWeight: 700, fontSize: 46, color: '#fff', marginLeft: 18}}>{d.texto ?? '4 lives ao mesmo tempo'}</span>
			</div>
		</AbsoluteFill>
	);
};

export const pecas: Pecas = {p223Visor, p223Cupons, p223Tempo, p223Mosaico, p223Lata, p223Relogio, p223MeioAMeio, p223Espalha, p223Rotulo, p223Escala, p223Algoritmo, p223Apto};
