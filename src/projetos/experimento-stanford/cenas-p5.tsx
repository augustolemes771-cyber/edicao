// Bloco P5 do experimento-stanford: "Só que em 2018, documentos revelados mostraram outro lado..." até
// "...juiz e parte interessada ao mesmo tempo." Seis peças curtas, câmera sempre em movimento (zoom/pan),
// vinheta de lente e profundidade em primeiro plano — plano de filme, não cartão parado.
import React from 'react';
import type {CenaPeca, Pecas} from '../../pecas/peca';
import {Camera, COR, EscritorioCompleto, Fundo, GradePrimeiroPlano, Numero, OmbroPrimeiroPlano, Personagem, Pilula, Vinheta, fonte, usePeca} from './ilustracao';

const CX = 540; // centro horizontal da composição 1080x1920

// P5a: "em dois mil e dezoito" — o número 2018 bate na tela como uma virada (leve tremor de entrada), câmera avança.
export const stanfordP5a: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, mola} = usePeca(cena);
	const n = mola(0, 160, 11);
	const tremor = Math.max(0, 1 - frame / 10) * Math.sin(frame * 2.4) * 6;
	return (
		<Fundo noite>
			<Camera cena={cena} zoom={[1, 1.22]}>
				<EscritorioCompleto persiana={0.6} luz={false} />
				<div style={{position: 'absolute', inset: 0, background: COR.vermelho, opacity: 0.05 + 0.04 * Math.sin(frame * 0.4)}} />
				<div style={{transform: `translateX(${tremor}px)`}}>
					<Numero valor="2018" rotulo="A VERSÃO OFICIAL RACHA" p={n} cor={COR.vermelho} top={720} />
				</div>
			</Camera>
			<Vinheta forca={0.5} />
		</Fundo>
	);
};

// P5b: "documentos revelados mostraram outro lado" — pasta se abre em primeiro plano, câmera por cima do
// ombro de quem está lendo, como se o espectador estivesse ali.
export const stanfordP5b: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	const abre = mola(0, 120, 14); // 0 fechada -> 1 aberta
	const folhas = [0, 1, 2].map((i) => mola(6 + i * 4, 150, 12));
	const anguloFlapEsq = -abre * 55;
	const anguloFlapDir = abre * 55;
	return (
		<Fundo noite>
			<Camera cena={cena} zoom={[1.15, 1.5]} y={[40, -40]}>
				<EscritorioCompleto quadroCortica documentos={4} persiana={0.3} />
				<svg style={{position: 'absolute', left: CX - 280, top: 680}} width={560} height={540} viewBox="0 0 440 420">
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
			</Camera>
			<OmbroPrimeiroPlano lado="esquerda" />
			<Vinheta forca={0.6} />
			<Numero valor="" rotulo="O OUTRO LADO DA HISTÓRIA" p={mola(14, 110, 14)} top={520} cor={COR.vermelho} />
		</Fundo>
	);
};

// P5c: "guardas foram instruídos a serem duros" — plano fechado no guarda, câmera entrando, grade ao fundo.
export const stanfordP5c: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, mola} = usePeca(cena);
	const entra = mola(0, 130, 13);
	const balanco = Math.sin(frame * 0.25) * 4;
	return (
		<Fundo noite>
			<Camera cena={cena} zoom={[1.3, 1.6]} y={[0, -50]}>
				<EscritorioCompleto mesa={false} persiana={0.5} />
				<Personagem x={CX} y={1480} tom="guarda" escala={3.3} braco={0.25} />
				<div
					style={{
						position: 'absolute',
						left: CX - 220,
						top: 520 + (1 - entra) * 40 + balanco,
						opacity: Math.min(1, entra * 1.6),
						transform: `scale(${0.8 + entra * 0.35})`,
					}}
				>
					<svg width={440} height={200} viewBox="0 0 340 160">
						<rect x={0} y={0} width={340} height={120} rx={28} fill={COR.branco} />
						<polygon points="150,120 185,120 150,160" fill={COR.branco} />
						<text x={170} y={72} textAnchor="middle" fontFamily={fonte} fontWeight={800} fontSize={48} fill={COR.vermelho}>
							"SEJAM DUROS"
						</text>
					</svg>
				</div>
			</Camera>
			<GradePrimeiroPlano lado="baixo" />
			<Vinheta forca={0.65} />
		</Fundo>
	);
};

// P5d: "pode ter sido encenado" — máscara de teatro em close tapando o rosto do personagem, câmera avançando.
export const stanfordP5d: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	const sobe = mola(0, 140, 13);
	const vira = mola(18, 90, 16);
	return (
		<Fundo noite>
			<Camera cena={cena} zoom={[1.2, 1.5]} x={[0, -30]}>
				<EscritorioCompleto mesa={false} persiana={0.2} luz={false} />
				<Personagem x={CX} y={1420} tom="prisioneiro" escala={3.1} />
				<svg
					style={{position: 'absolute', left: CX - 170, top: 680 - sobe * 150, opacity: sobe, transform: `rotate(${vira * 16}deg)`}}
					width={340}
					height={340}
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
			</Camera>
			<Vinheta forca={0.6} />
		</Fundo>
	);
};

// P5e: "era juiz e parte interessada ao mesmo tempo" — balança desequilibrada, câmera por cima do ombro de
// quem observa a cena, dando a sensação de estar junto, testemunhando o conflito de interesse.
export const stanfordP5e: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, mola} = usePeca(cena);
	const sobe = mola(0, 130, 14);
	const desequilibrio = Math.min(1, mola(14, 90, 16)) * 22 + Math.sin(frame * 0.15) * 2;
	return (
		<Fundo noite>
			<Camera cena={cena} zoom={[1.1, 1.4]} x={[0, 30]}>
				<EscritorioCompleto quadroCortica={false} persiana={0.55} />
				<svg style={{position: 'absolute', left: CX - 260, top: 620 + (1 - sobe) * 60, opacity: sobe}} width={520} height={560} viewBox="0 0 400 420">
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
			</Camera>
			<OmbroPrimeiroPlano lado="direita" />
			<Vinheta forca={0.55} />
			<Numero valor="" rotulo="O MESMO HOMEM NOS DOIS LADOS" p={mola(20, 110, 14)} top={1240} cor={COR.vermelho} />
		</Fundo>
	);
};

// P5f: pílula "FRAUDE?" pulsando em close — fecha o bloco antes da pergunta final, câmera avançando até o limite.
export const stanfordP5f: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, mola} = usePeca(cena);
	const entra = mola(0, 150, 12);
	const pulso = 1 + Math.sin(frame * 0.3) * 0.06 * Math.min(1, entra);
	return (
		<Fundo noite>
			<Camera cena={cena} zoom={[1, 1.3]}>
				<EscritorioCompleto quadroCortica documentos={3} persiana={0.7} luz={false} />
				<div style={{transform: `scale(${pulso})`, transformOrigin: '50% 820px'}}>
					<Pilula texto="FRAUDE?" p={entra} y={780} cor={COR.vermelho} />
				</div>
			</Camera>
			<Vinheta forca={0.7} />
		</Fundo>
	);
};

export const pecasP5: Partial<Pecas> = {stanfordP5a, stanfordP5b, stanfordP5c, stanfordP5d, stanfordP5e, stanfordP5f};
