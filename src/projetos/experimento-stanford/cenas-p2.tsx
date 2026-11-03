// Bloco P2 do experimento-stanford: escalada da rebelião e das punições, em cenas curtas (1.5–4s) que
// ilustram cada detalhe falado, sem quadro parado — tudo já em movimento desde o frame 0. Câmera dentro
// da cena (zoom/pan contínuo + primeiro plano) pra parecer plano de filme, não cartão/ícone flutuando.
import React from 'react';
import type {CenaPeca, Pecas} from '../../pecas/peca';
import {Camera, COR, Foco, Fundo, GradePrimeiroPlano, OmbroPrimeiroPlano, Personagem, Pilula, PoraoCompleto, Vinheta, fonte, usePeca} from './ilustracao';

// P2a — "os prisioneiros já estavam se rebelando": câmera atrás da grade (em primeiro plano) olhando
// pros dois prisioneiros empurrando e gritando — ponto de vista de quem está do lado de fora da cela.
export const stanfordP2a: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {t, mola} = usePeca(cena);
	const entra = mola(0, 160, 14);
	const treme = Math.sin(t * 22) * 4 * Math.min(1, entra);
	const braco = 0.5 + Math.sin(t * 9) * 0.5;
	return (
		<Fundo noite>
			<Camera cena={cena} zoom={[1.1, 1.4]} y={[40, -60]}>
				<div style={{position: 'absolute', inset: 0, transform: `translateX(${treme}px)`}}>
					<PoraoCompleto escuro={0.25} balanco={1.4} piscar />
					<Personagem x={330} y={1260} tom="prisioneiro" braco={braco} escala={2.3} p={entra} />
					<Personagem x={790} y={1260} tom="prisioneiro" vira braco={Math.max(0, 1 - braco)} escala={2.3} p={entra} />
					{/* bocas abertas (grito), acento local sem mexer na peça compartilhada */}
					<svg style={{position: 'absolute', left: 250, top: 980, opacity: entra}} width={64} height={48} viewBox="0 0 40 30">
						<ellipse cx={20} cy={15} rx={11} ry={13} fill="#3a1414" />
					</svg>
				</div>
			</Camera>
			<GradePrimeiroPlano lado="baixo" p={Math.min(1, entra)} />
			<Vinheta forca={0.6} />
			<Pilula texto="REBELIÃO" p={Math.min(1, mola(4, 120, 16))} y={220} />
		</Fundo>
	);
};

// P2b — "começaram a punir com flexões": câmera por cima do ombro de outro guarda, olhando o guarda
// apontar pro prisioneiro flexionando no chão — plano fechado, não cena centralizada no vazio.
export const stanfordP2b: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {t, mola} = usePeca(cena);
	const entra = mola(0, 150, 15);
	const flex = 0.5 + Math.sin(t * 7) * 0.5; // sobe e desce, flexão contínua
	return (
		<Fundo noite>
			<Camera cena={cena} zoom={[1.15, 1.42]} x={[0, -40]}>
				<PoraoCompleto escuro={0.15} />
				<Personagem x={800} y={1480} tom="guarda" braco={Math.min(1, entra)} escala={2.6} p={entra} />
				{/* prisioneiro em flexão: pose própria (deitado), desenhada localmente, bem maior/mais perto */}
				<svg style={{position: 'absolute', left: 120, top: 1500 + flex * 20, opacity: entra, transform: `scale(${1.7 * entra})`}} width={220} height={90} viewBox="0 0 220 90">
					<ellipse cx={110} cy={82} rx={95} ry={7} fill="#000" opacity={0.25} />
					<rect x={30} y={30} width={150} height={34} rx={14} fill={COR.prisioneiro} />
					<circle cx={190} cy={47} r={22} fill={COR.pele} />
					<rect x={6} y={38 - flex * 18} width={14} height={40} rx={6} fill={COR.prisioneiro} transform={`rotate(${-20 + flex * 15} 13 58)`} />
					<rect x={18} y={66} width={12} height={22} rx={5} fill={COR.prisioneiro} />
					<rect x={46} y={66} width={12} height={22} rx={5} fill={COR.prisioneiro} />
				</svg>
			</Camera>
			<OmbroPrimeiroPlano lado="esquerda" p={Math.min(1, entra)} />
			<Vinheta forca={0.6} />
			<Pilula texto="FLEXÕES" p={Math.min(1, mola(6, 130, 15))} y={220} />
		</Fundo>
	);
};

// P2c — "isolamento": câmera empurrando pra dentro, através da grade em primeiro plano, até o
// prisioneiro sozinho encolhido no fundo da cela estreita — sensação de espiar de fora pra dentro.
export const stanfordP2c: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {t, mola} = usePeca(cena);
	const entra = mola(0, 150, 15);
	const raio = 150 + Math.sin(t * 3) * 10;
	return (
		<Fundo noite>
			<Camera cena={cena} zoom={[1.15, 1.65]} y={[20, -40]}>
				<PoraoCompleto escuro={0.5} placa={null} />
				<svg style={{position: 'absolute', left: 780, top: 820}} width={300} height={400} viewBox="0 0 300 400" opacity={0.9}>
					{[0, 1, 2, 3, 4].map((i) => (
						<rect key={i} x={20 + i * 54} y={0} width={10} height={400} fill="#0a0b0d" />
					))}
				</svg>
				<Personagem x={540} y={1300} tom="prisioneiro" escala={2.2} p={entra} braco={Math.sin(t * 2) * 0.2 + 0.2} />
				<Foco x={540} y={1200} r={raio} p={Math.min(1, entra * 1.3)} />
			</Camera>
			<GradePrimeiroPlano lado="baixo" p={Math.min(1, entra * 1.2)} />
			<Vinheta forca={0.75} />
			<Pilula texto="ISOLAMENTO" p={Math.min(1, mola(4, 120, 16))} y={220} />
		</Fundo>
	);
};

// P2d — "humilhação": câmera por cima do ombro do guarda, olhando de cima pro prisioneiro encolhido —
// o espectador fica no lugar de quem humilha, não de fora olhando os dois pequenos.
export const stanfordP2d: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {t, mola} = usePeca(cena);
	const entra = mola(0, 150, 15);
	const riso = 1 + Math.sin(t * 10) * 0.04;
	return (
		<Fundo noite>
			<Camera cena={cena} zoom={[1.2, 1.5]} x={[0, 30]} y={[0, -30]}>
				<PoraoCompleto escuro={0.4} />
				<div style={{position: 'absolute', left: 300, top: 1280, transform: `scale(${1.3 * entra})`, transformOrigin: 'bottom center'}}>
					<Personagem x={55} y={160} tom="prisioneiro" escala={1.6} p={1} />
				</div>
				<div style={{transform: `scale(${riso})`, transformOrigin: '780px 1480px'}}>
					<Personagem x={780} y={1480} tom="guarda" vira braco={Math.min(1, entra)} escala={2.8} p={entra} />
				</div>
			</Camera>
			<OmbroPrimeiroPlano lado="direita" p={Math.min(1, entra)} />
			<Vinheta forca={0.6} />
			<Pilula texto="HUMILHAÇÃO" p={Math.min(1, mola(5, 120, 15))} y={220} />
		</Fundo>
	);
};

// P2e — "ninguém tinha mandado fazer isso": câmera avançando devagar pelo corredor vazio até a cadeira
// do supervisor sem ninguém nela — plano de "ninguém está vendo isso", não ícone centralizado.
export const stanfordP2e: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	const entra = mola(0, 110, 16);
	return (
		<Fundo noite>
			<Camera cena={cena} zoom={[1, 1.5]} y={[-10, -220]}>
				<PoraoCompleto escuro={0.15} placa={null} />
				<svg style={{position: 'absolute', left: 470, top: 1560, opacity: entra, transform: `scale(1.8)`, transformOrigin: 'bottom center'}} width={140} height={160} viewBox="0 0 140 160">
					<rect x={20} y={70} width={90} height={12} fill={COR.predioEscuro} />
					<rect x={20} y={10} width={12} height={160} fill={COR.predioEscuro} />
					<rect x={98} y={70} width={12} height={90} fill={COR.predioEscuro} />
					<rect x={20} y={150} width={12} height={10} fill={COR.predioEscuro} />
					<rect x={98} y={150} width={12} height={10} fill={COR.predioEscuro} />
				</svg>
			</Camera>
			<Vinheta forca={0.45} />
			<div
				style={{
					position: 'absolute',
					bottom: 420,
					width: '100%',
					textAlign: 'center',
					opacity: Math.min(1, mola(8, 110, 16)),
					fontFamily: fonte,
					fontWeight: 700,
					fontSize: 34,
					color: '#9aa0ab',
					letterSpacing: '0.04em',
				}}
			>
				SEM SUPERVISÃO
			</div>
		</Fundo>
	);
};

// P2f — "precisou sair no primeiro dia": câmera acompanha os dois saindo de cena, como um travelling
// lateral seguindo a ação, não um corte estático.
export const stanfordP2f: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {t, mola} = usePeca(cena);
	const entra = mola(0, 140, 15);
	const sai = interpolate2(t, cena);
	return (
		<Fundo noite>
			<Camera cena={cena} zoom={[1.15, 1.35]} x={[sai * -60, sai * 40]}>
				<PoraoCompleto escuro={0.2} />
				<div style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', transform: `translateX(${sai * 90}px)`}}>
					<Personagem x={430} y={1380} tom="prisioneiro" escala={2.4} braco={0.3} p={entra} />
					<Personagem x={700} y={1340} tom="guarda" vira escala={2.1} braco={0.15} p={entra} />
					{/* mãos na cabeça: arco simples sobre a cabeça do prisioneiro */}
					<svg style={{position: 'absolute', left: 300, top: 1030, opacity: entra, transform: 'scale(1.8)'}} width={100} height={60} viewBox="0 0 100 60">
						<path d="M10 55 Q50 -5 90 55" fill="none" stroke={COR.prisioneiro} strokeWidth={12} strokeLinecap="round" />
					</svg>
				</div>
			</Camera>
			<Vinheta forca={0.5} />
		</Fundo>
	);
};

function interpolate2(t: number, cena: CenaPeca) {
	const dur = Math.max(0.1, cena.ate - cena.de);
	return Math.min(1, Math.max(0, (t - dur * 0.5) / (dur * 0.5)));
}

export const pecasP2: Partial<Pecas> = {stanfordP2a, stanfordP2b, stanfordP2c, stanfordP2d, stanfordP2e, stanfordP2f};
