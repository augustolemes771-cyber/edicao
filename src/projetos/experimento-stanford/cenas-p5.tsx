// Bloco P5 do experimento-stanford: "Só que em 2018, documentos revelados mostraram outro lado..." até
// "...juiz e parte interessada ao mesmo tempo." Seis peças curtas, cada uma com movimento desde o quadro 0.
import React from 'react';
import type {CenaPeca, Pecas} from '../../pecas/peca';
import {COR, Fundo, Numero, Personagem, Pilula, fonte, usePeca} from './ilustracao';

const CX = 540; // centro horizontal da composição 1080x1920

// P5a: "em dois mil e dezoito" — o número 2018 bate na tela como uma virada (leve tremor de entrada).
export const stanfordP5a: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, mola} = usePeca(cena);
	const n = mola(0, 160, 11);
	const tremor = Math.max(0, 1 - frame / 10) * Math.sin(frame * 2.4) * 6;
	return (
		<Fundo noite>
			<div style={{position: 'absolute', inset: 0, background: COR.vermelho, opacity: 0.05 + 0.04 * Math.sin(frame * 0.4)}} />
			<div style={{transform: `translateX(${tremor}px)`}}>
				<Numero valor="2018" rotulo="A VERSÃO OFICIAL RACHA" p={n} cor={COR.vermelho} top={720} />
			</div>
		</Fundo>
	);
};

// P5b: "documentos revelados mostraram outro lado" — uma pasta se abre e as folhas saltam pra fora.
export const stanfordP5b: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	const abre = mola(0, 120, 14); // 0 fechada -> 1 aberta
	const folhas = [0, 1, 2].map((i) => mola(6 + i * 4, 150, 12));
	const anguloFlapEsq = -abre * 55;
	const anguloFlapDir = abre * 55;
	return (
		<Fundo noite>
			<svg style={{position: 'absolute', left: CX - 220, top: 760}} width={440} height={420} viewBox="0 0 440 420">
				{folhas.map((f, i) => (
					<rect
						key={i}
						x={150 + i * 10}
						y={210 - f * (170 + i * 26)}
						width={140}
						height={180}
						rx={6}
						fill={COR.branco}
						opacity={Math.min(1, f * 1.4)}
						transform={`rotate(${(i - 1) * 8 * f} ${220} ${300})`}
					/>
				))}
				<polygon points="40,210 220,170 400,210 400,360 40,360" fill="#8a5a2b" />
				<polygon points="40,210 220,170 220,230 40,250" fill="#6b4420" transform={`rotate(${anguloFlapEsq} 40 210)`} />
				<polygon points="400,210 220,170 220,230 400,250" fill="#6b4420" transform={`rotate(${anguloFlapDir} 400 210)`} />
			</svg>
			<Numero valor="" rotulo="O OUTRO LADO DA HISTÓRIA" p={mola(14, 110, 14)} top={610} cor={COR.vermelho} />
		</Fundo>
	);
};

// P5c: "guardas foram instruídos a serem duros" — balão de fala com a palavra DUROS sobre um guarda.
export const stanfordP5c: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, mola} = usePeca(cena);
	const entra = mola(0, 130, 13);
	const balanco = Math.sin(frame * 0.25) * 4;
	return (
		<Fundo noite>
			<Personagem x={CX} y={1300} tom="guarda" escala={2.1} braco={0.25} />
			<div
				style={{
					position: 'absolute',
					left: CX - 170,
					top: 560 + (1 - entra) * 40 + balanco,
					opacity: Math.min(1, entra * 1.6),
					transform: `scale(${0.7 + entra * 0.3})`,
				}}
			>
				<svg width={340} height={160} viewBox="0 0 340 160">
					<rect x={0} y={0} width={340} height={120} rx={28} fill={COR.branco} />
					<polygon points="150,120 185,120 150,160" fill={COR.branco} />
					<text x={170} y={72} textAnchor="middle" fontFamily={fonte} fontWeight={800} fontSize={48} fill={COR.vermelho}>
						"SEJAM DUROS"
					</text>
				</svg>
			</div>
		</Fundo>
	);
};

// P5d: "pode ter sido encenado" — máscara de teatro (metade sorrindo, metade séria) tapando o rosto do personagem.
export const stanfordP5d: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	const sobe = mola(0, 140, 13);
	const vira = mola(18, 90, 16);
	return (
		<Fundo noite>
			<Personagem x={CX} y={1260} tom="prisioneiro" escala={2.2} />
			<svg
				style={{position: 'absolute', left: CX - 120, top: 780 - sobe * 140, opacity: sobe, transform: `rotate(${vira * 16}deg)`}}
				width={240}
				height={240}
				viewBox="0 0 240 240"
			>
				<path d="M120 20 A100 100 0 0 1 220 120 L120 120 Z" fill={COR.branco} />
				<path d="M120 20 A100 100 0 0 0 20 120 L120 120 Z" fill="#cfc8b8" />
				<path d="M20 120 A100 100 0 0 0 120 220 L120 120 Z" fill={COR.vermelho} opacity={0.85} />
				<path d="M220 120 A100 100 0 0 1 120 220 L120 120 Z" fill="#9aa0ab" />
				<circle cx={80} cy={95} r={9} fill="#1a1a1a" />
				<circle cx={160} cy={95} r={9} fill="#1a1a1a" />
				<path d="M75 150 Q120 180 165 150" stroke="#1a1a1a" strokeWidth={6} fill="none" />
			</svg>
		</Fundo>
	);
};

// P5e: "era juiz e parte interessada ao mesmo tempo" — balança desequilibrada (conflito de interesse).
export const stanfordP5e: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, mola} = usePeca(cena);
	const sobe = mola(0, 130, 14);
	const desequilibrio = Math.min(1, mola(14, 90, 16)) * 22 + Math.sin(frame * 0.15) * 2;
	return (
		<Fundo noite>
			<svg style={{position: 'absolute', left: CX - 200, top: 700 + (1 - sobe) * 60, opacity: sobe}} width={400} height={420} viewBox="0 0 400 420">
				<rect x={190} y={40} width={20} height={300} fill={COR.predio} />
				<polygon points="160,340 240,340 220,380 180,380" fill={COR.predioEscuro} />
				<g transform={`rotate(${desequilibrio} 200 60)`}>
					<rect x={40} y={54} width={320} height={10} fill={COR.predio} />
					<line x1={60} y1={60} x2={60} y2={160} stroke={COR.predio} strokeWidth={4} />
					<ellipse cx={60} cy={176} rx={56} ry={16} fill={COR.vermelho} />
					<text x={60} y={182} textAnchor="middle" fontFamily={fonte} fontWeight={800} fontSize={22} fill={COR.branco}>
						JUIZ
					</text>
					<line x1={340} y1={60} x2={340} y2={130} stroke={COR.predio} strokeWidth={4} />
					<ellipse cx={340} cy={146} rx={56} ry={16} fill="#9aa0ab" />
					<text x={340} y={152} textAnchor="middle" fontFamily={fonte} fontWeight={800} fontSize={18} fill="#1a1a1a">
						INTERESSADO
					</text>
				</g>
			</svg>
			<Numero valor="" rotulo="O MESMO HOMEM NOS DOIS LADOS" p={mola(20, 110, 14)} top={1180} cor={COR.vermelho} />
		</Fundo>
	);
};

// P5f: pílula "FRAUDE?" pulsando — fecha o bloco antes da pergunta final.
export const stanfordP5f: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, mola} = usePeca(cena);
	const entra = mola(0, 150, 12);
	const pulso = 1 + Math.sin(frame * 0.3) * 0.06 * Math.min(1, entra);
	return (
		<Fundo noite>
			<div style={{transform: `scale(${pulso})`, transformOrigin: '50% 820px'}}>
				<Pilula texto="FRAUDE?" p={entra} y={780} cor={COR.vermelho} />
			</div>
		</Fundo>
	);
};

export const pecasP5: Partial<Pecas> = {stanfordP5a, stanfordP5b, stanfordP5c, stanfordP5d, stanfordP5e, stanfordP5f};
