// Bloco P2 do experimento-stanford: escalada da rebelião e das punições, em cenas curtas (1.5–4s) que
// ilustram cada detalhe falado, sem quadro parado — tudo já em movimento desde o frame 0.
import React from 'react';
import type {CenaPeca, Pecas} from '../../pecas/peca';
import {COR, Foco, Fundo, Personagem, Pilula, Porao, fonte, usePeca} from './ilustracao';

// P2a — "os prisioneiros já estavam se rebelando": empurram a grade, gritam, a cena treme.
export const stanfordP2a: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {t, mola} = usePeca(cena);
	const entra = mola(0, 160, 14);
	const treme = Math.sin(t * 22) * 4 * Math.min(1, entra);
	const braco = 0.5 + Math.sin(t * 9) * 0.5;
	return (
		<Fundo noite>
			<div style={{position: 'absolute', inset: 0, transform: `translateX(${treme}px)`}}>
				<Porao p={1} />
				<Personagem x={330} y={1180} tom="prisioneiro" braco={braco} escala={1.5} p={entra} />
				<Personagem x={760} y={1180} tom="prisioneiro" vira braco={Math.max(0, 1 - braco)} escala={1.5} p={entra} />
				{/* bocas abertas (grito), acento local sem mexer na peça compartilhada */}
				<svg style={{position: 'absolute', left: 300, top: 1070, opacity: entra}} width={40} height={30} viewBox="0 0 40 30">
					<ellipse cx={20} cy={15} rx={11} ry={13} fill="#3a1414" />
				</svg>
			</div>
			<Pilula texto="REBELIÃO" p={Math.min(1, mola(4, 120, 16))} y={300} />
		</Fundo>
	);
};

// P2b — "começaram a punir com flexões": guarda aponta, prisioneiro flexiona no chão.
export const stanfordP2b: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {t, mola} = usePeca(cena);
	const entra = mola(0, 150, 15);
	const flex = 0.5 + Math.sin(t * 7) * 0.5; // sobe e desce, flexão contínua
	return (
		<Fundo noite>
			<Porao p={1} />
			<Personagem x={740} y={1120} tom="guarda" braco={Math.min(1, entra)} escala={1.4} p={entra} />
			{/* prisioneiro em flexão: pose própria (deitado), desenhada localmente */}
			<svg style={{position: 'absolute', left: 260, top: 1280 + flex * 14, opacity: entra, transform: `scale(${entra})`}} width={220} height={90} viewBox="0 0 220 90">
				<ellipse cx={110} cy={82} rx={95} ry={7} fill="#000" opacity={0.25} />
				<rect x={30} y={30} width={150} height={34} rx={14} fill={COR.prisioneiro} />
				<circle cx={190} cy={47} r={22} fill={COR.pele} />
				<rect x={6} y={38 - flex * 18} width={14} height={40} rx={6} fill={COR.prisioneiro} transform={`rotate(${-20 + flex * 15} 13 58)`} />
				<rect x={18} y={66} width={12} height={22} rx={5} fill={COR.prisioneiro} />
				<rect x={46} y={66} width={12} height={22} rx={5} fill={COR.prisioneiro} />
			</svg>
			<Pilula texto="FLEXÕES" p={Math.min(1, mola(6, 130, 15))} y={300} />
		</Fundo>
	);
};

// P2c — "isolamento": um prisioneiro sozinho numa cela estreita, foco bem fechado.
export const stanfordP2c: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {t, mola} = usePeca(cena);
	const entra = mola(0, 150, 15);
	const raio = 120 + Math.sin(t * 3) * 10;
	return (
		<Fundo noite>
			<svg style={{position: 'absolute', left: 390, top: 820}} width={300} height={400} viewBox="0 0 300 400" opacity={0.9}>
				{[0, 1, 2, 3, 4].map((i) => (
					<rect key={i} x={20 + i * 54} y={0} width={10} height={400} fill="#0a0b0d" />
				))}
			</svg>
			<Personagem x={540} y={1240} tom="prisioneiro" escala={1.3} p={entra} braco={Math.sin(t * 2) * 0.2 + 0.2} />
			<Foco x={540} y={1180} r={raio} p={Math.min(1, entra * 1.3)} />
			<Pilula texto="ISOLAMENTO" p={Math.min(1, mola(4, 120, 16))} y={300} />
		</Fundo>
	);
};

// P2d — "humilhação": guarda em pose de zombaria sobre o prisioneiro encolhido.
export const stanfordP2d: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {t, mola} = usePeca(cena);
	const entra = mola(0, 150, 15);
	const riso = 1 + Math.sin(t * 10) * 0.04;
	return (
		<Fundo noite>
			<Porao p={1} />
			<div style={{position: 'absolute', left: 300, top: 1000, transform: `scale(${0.55 * entra}, ${0.4 * entra})`, transformOrigin: 'bottom center'}}>
				<Personagem x={55} y={160} tom="prisioneiro" escala={1} p={1} />
			</div>
			<div style={{transform: `scale(${riso})`, transformOrigin: '660px 1180px'}}>
				<Personagem x={660} y={1120} tom="guarda" vira braco={Math.min(1, entra)} escala={1.6} p={entra} />
			</div>
			<Pilula texto="HUMILHAÇÃO" p={Math.min(1, mola(5, 120, 15))} y={300} />
		</Fundo>
	);
};

// P2e — "ninguém tinha mandado fazer isso": corredor vazio, cadeira do supervisor sem ninguém.
export const stanfordP2e: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {t, mola} = usePeca(cena);
	const entra = mola(0, 110, 16);
	const zoom = 1 + t * 0.015;
	return (
		<Fundo noite>
			<div style={{transform: `scale(${zoom})`, transformOrigin: '50% 60%'}}>
				<Porao p={1} />
				<svg style={{position: 'absolute', left: 470, top: 1240, opacity: entra}} width={140} height={160} viewBox="0 0 140 160">
					<rect x={20} y={70} width={90} height={12} fill={COR.predioEscuro} />
					<rect x={20} y={10} width={12} height={160} fill={COR.predioEscuro} />
					<rect x={98} y={70} width={12} height={90} fill={COR.predioEscuro} />
					<rect x={20} y={150} width={12} height={10} fill={COR.predioEscuro} />
					<rect x={98} y={150} width={12} height={10} fill={COR.predioEscuro} />
				</svg>
			</div>
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

// P2f — "precisou sair no primeiro dia": um prisioneiro é amparado, mãos na cabeça, levado pra fora.
export const stanfordP2f: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {t, mola} = usePeca(cena);
	const entra = mola(0, 140, 15);
	const sai = interpolate2(t, cena);
	return (
		<Fundo noite>
			<Porao p={1} />
			<div style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', transform: `translateX(${sai * 90}px)`}}>
				<Personagem x={430} y={1200} tom="prisioneiro" escala={1.4} braco={0.3} p={entra} />
				<Personagem x={590} y={1180} tom="guarda" vira escala={1.3} braco={0.15} p={entra} />
				{/* mãos na cabeça: arco simples sobre a cabeça do prisioneiro */}
				<svg style={{position: 'absolute', left: 390, top: 1020, opacity: entra}} width={100} height={60} viewBox="0 0 100 60">
					<path d="M10 55 Q50 -5 90 55" fill="none" stroke={COR.prisioneiro} strokeWidth={12} strokeLinecap="round" />
				</svg>
			</div>
		</Fundo>
	);
};

function interpolate2(t: number, cena: CenaPeca) {
	const dur = Math.max(0.1, cena.ate - cena.de);
	return Math.min(1, Math.max(0, (t - dur * 0.5) / (dur * 0.5)));
}

export const pecasP2: Partial<Pecas> = {stanfordP2a, stanfordP2b, stanfordP2c, stanfordP2d, stanfordP2e, stanfordP2f};
