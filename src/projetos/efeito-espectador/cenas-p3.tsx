// Parte 3 do efeito-espectador: a virada (a história era exagerada), a pesquisa que continua sólida e a pergunta
// final, que volta pro MESMO prédio do gancho com a câmera puxando pra trás.
import React from 'react';
import {interpolate} from 'remotion';
import type {CenaPeca, Pecas} from '../../pecas/peca';
import {COR, Fundo, Numero, Pilula, Vinheta, TextoGrande, lim, fonte, usePeca} from '../experimento-stanford/ilustracao';
import {CALCADA, CameraMundo, Grao, JANELAS, Jornal, Ondas, Pessoa, Rotulo, Rua, Sombra, Telefone, rnd} from './cenario';
import {FOCO} from './cenas-p1';

const PE = CALCADA + 70;
const dur = (cena: CenaPeca) => cena.ate - cena.de;
const ESCURA = JANELAS.find((j) => !j.acesa && j.pessoas > 0 && j.r <= 2) ?? JANELAS[3];
const GRITO = JANELAS.find((j) => j.acesa && j.pessoas > 0 && j.r === 4 && j.c <= 2) ?? JANELAS[21];
const LIGA = JANELAS.find((j) => j.acesa && j.pessoas > 0 && j.r === 3 && j.c >= 3) ?? JANELAS[18];

// 36. "Só que décadas depois,": calendário voando de 1964 pra frente, imagem rebobinando.
export const espDecadas: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, mola} = usePeca(cena);
	const ano = Math.round(interpolate(frame, [0, 30], [1964, 2007], lim));
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[540, 900, 1.0]} para={[540, 900, 1.15]}>
				<Rua olhar={0.6} apagar={0.4} />
				<rect x={-600} y={-600} width={2300} height={3200} fill="#000" opacity={0.5} />
				{Array.from({length: 8}).map((_, i) => {
					const f = interpolate(frame, [i * 3, i * 3 + 14], [0, 1], lim);
					return <rect key={i} x={380 + f * (rnd(i) - 0.5) * 900} y={760 - f * 500 + rnd(i + 3) * 60} width={320} height={380} rx={12} fill={COR.papel} opacity={f > 0 && f < 1 ? 1 - f : 0} transform={`rotate(${f * (rnd(i + 5) - 0.5) * 120} 540 950)`} />;
				})}
			</CameraMundo>
			<Vinheta forca={0.6} />
			<Numero valor={String(ano)} rotulo="DÉCADAS DEPOIS" p={mola(0, 140, 14)} top={170} />
			<Grao />
		</Fundo>
	);
};

// 37. "jornalistas voltaram ao caso original de Kitty Genovese": lupa passando pelo jornal antigo.
export const espJornalistas: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {t, mola} = usePeca(cena);
	const lx = 540 + Math.sin(t * 1.6) * 180;
	const ly = 700 + Math.cos(t * 1.2) * 120;
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[540, 860, 1.05]} para={[540, 820, 1.3]}>
				<svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1080} height={1920}>
					<rect x={-600} y={-600} width={2300} height={3200} fill="#141722" />
					<Jornal y={880} s={0.95} rot={3} manchete={'38 VIRAM.\nNINGUÉM\nAJUDOU.'} p={1} />
					<g opacity={Math.min(1, mola(4, 130, 14))}>
						<circle cx={lx} cy={ly} r={130} fill="#ffffff" opacity={0.12} stroke="#1d1f24" strokeWidth={22} />
						<rect x={lx + 85} y={ly + 85} width={40} height={180} rx={18} fill="#1d1f24" transform={`rotate(-45 ${lx + 105} ${ly + 105})`} />
					</g>
				</svg>
			</CameraMundo>
			<Vinheta forca={0.5} />
			<Pilula texto="JORNALISTAS" p={mola(8, 130, 13)} y={200} cor="#3c5a8a" />
			<Grao />
		</Fundo>
	);
};

// 38. "e descobriram que boa parte da história era exagerada.": carimbo EXAGERADO bate no jornal.
export const espExagerada: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {q, mola} = usePeca(cena);
	const bate = mola(Math.max(0, q(cena.de + dur(cena) * 0.55)), 260, 15);
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[540, 860, 1.2]} para={[540, 820, 1.35]} curva="rapida">
				<svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1080} height={1920}>
					<rect x={-600} y={-600} width={2300} height={3200} fill="#141722" />
					<Jornal y={880} s={0.95} rot={3} manchete={'38 VIRAM.\nNINGUÉM\nAJUDOU.'} carimbo={bate} p={1} />
				</svg>
			</CameraMundo>
			<Vinheta forca={0.5} />
			<Grao />
		</Fundo>
	);
};

// 39. "Muitos dos trinta e oito nunca viram o ataque de verdade,": de volta ao prédio; boa parte dos espectadores some.
export const espNuncaViram: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, mola} = usePeca(cena);
	const some = interpolate(frame, [8, 40], [0, 1], lim);
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[540, 800, 1.15]} para={[540, 820, 1.0]}>
				<Rua olhar={0.6} sumir={some} />
			</CameraMundo>
			<Vinheta forca={0.6} />
			<Numero valor="38" rotulo="NUNCA VIRAM DE VERDADE" p={mola(0, 140, 14)} top={130} cor={COR.vermelho} />
			<div style={{position: 'absolute', top: 175, left: 380, width: 320 * Math.min(1, mola(14, 160, 13)), height: 12, background: COR.vermelho, transform: 'rotate(-12deg)', borderRadius: 6}} />
			<Grao />
		</Fundo>
	);
};

// 40. "só ouviram sons distantes.": janela escura, alguém meio deitado, ondas fracas vindo de longe.
export const espSons: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[ESCURA.x, ESCURA.y + 40, 3.6]} para={[ESCURA.x - 40, ESCURA.y + 120, 2.6]}>
				<Rua olhar={0} olhos={0.6} />
				<Ondas x={ESCURA.x - 260} y={ESCURA.y + 420} p={0.45 * Math.min(1, mola(0, 120, 14))} cor={COR.branco} escala={0.8} lado={1} />
			</CameraMundo>
			<Vinheta forca={0.7} />
			<Pilula texto="SONS DISTANTES" p={mola(10, 130, 13)} y={200} cor="#2a3044" />
			<Grao />
		</Fundo>
	);
};

// 41. "Pelo menos um vizinho gritou da janela": a janela abre e o vizinho se debruça gritando.
export const espGritou: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	const abre = Math.min(1, mola(2, 130, 14));
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[GRITO.x, GRITO.y, 3.4]} para={[GRITO.x + 40, GRITO.y + 30, 2.8]} curva="rapida">
				<Rua olhar={0.9} grito={{janela: GRITO.i, p: abre}} destaque={GRITO.i} />
				<Ondas x={GRITO.x + 40} y={GRITO.y + 10} p={Math.min(1, mola(8, 160, 12))} cor={COR.dourado} escala={0.55} lado={1} />
			</CameraMundo>
			<Vinheta forca={0.6} />
			<Pilula texto="UM VIZINHO GRITOU" p={mola(10, 140, 12)} y={200} cor="#3fae5c" />
			<Grao />
		</Fundo>
	);
};

// 42. "e assustou o atacante.": a sombra foge pela rua.
export const espAssustou: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {t} = usePeca(cena);
	const x = interpolate(t, [0, dur(cena)], [420, 1300], lim);
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[460, PE - 260, 1.8]} para={[700, PE - 260, 1.6]}>
				<Rua olhar={1} grito={{janela: GRITO.i, p: 1}} />
				<Sombra x={x} y={PE + 6} s={1.55} anda={t * 16} />
				<Pessoa x={330} y={PE} s={1.25} corpo="#8e2f3a" pele={COR.peleClara} cabelo="longo" corCabelo="#1f1512" olhar={1} />
			</CameraMundo>
			<Vinheta forca={0.6} />
			<Grao />
		</Fundo>
	);
};

// 43. "Outro chamou a polícia,": outra janela, alguém ao telefone.
export const espPolicia: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[LIGA.x, LIGA.y, 3.6]} para={[LIGA.x, LIGA.y - 10, 3.0]}>
				<Rua olhar={-0.3} telefone={{janela: LIGA.i, p: Math.min(1, mola(2, 140, 14))}} destaque={LIGA.i} />
			</CameraMundo>
			<Vinheta forca={0.6} />
			<Pilula texto="OUTRO LIGOU" p={mola(8, 140, 12)} y={200} cor="#3c5a8a" />
			<Grao />
		</Fundo>
	);
};

// 44. "só que tarde.": rua vazia, só a luz da sirene chegando.
export const espTarde: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, mola} = usePeca(cena);
	const azul = Math.max(0, Math.sin(frame / 3));
	const verm = Math.max(0, Math.sin(frame / 3 + Math.PI));
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[540, 1300, 1.3]} para={[540, 1340, 1.15]}>
				<Rua olhar={1} apagar={0.5} />
			</CameraMundo>
			<div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 100% 85%, rgba(61,107,255,${0.5 * azul}) 0%, transparent 60%)`}} />
			<div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 0% 85%, rgba(232,84,92,${0.45 * verm}) 0%, transparent 60%)`}} />
			<Vinheta forca={0.6} />
			<Pilula texto="TARDE DEMAIS" p={mola(4, 140, 12)} y={200} />
			<Grao />
		</Fundo>
	);
};

// 45. "A pesquisa sobre o Efeito Espectador continua sólida,": um pilar de blocos se empilhando firme.
export const espSolida: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[540, 1000, 1.2]} para={[540, 960, 1.05]}>
				<svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1080} height={1920}>
					<rect x={-600} y={-600} width={2300} height={3200} fill="#121725" />
					<rect x={-600} y={1320} width={2300} height={1400} fill="#1b2030" />
					{Array.from({length: 6}).map((_, i) => {
						const p = Math.min(1, mola(i * 4, 170, 14));
						return <rect key={i} x={380} y={1320 - (i + 1) * 110 - (1 - p) * 600} width={320} height={100} rx={10} fill={i % 2 ? '#3c5a8a' : '#4b6a9a'} opacity={p} />;
					})}
				</svg>
			</CameraMundo>
			<Vinheta forca={0.5} />
			<Pilula texto="PESQUISA SÓLIDA" p={mola(10, 140, 12)} y={200} cor="#3fae5c" />
			<Grao />
		</Fundo>
	);
};

// 46. "comprovada em dezenas de outros experimentos.": grade de salinhas, cada uma ganhando seu check.
export const espDezenas: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame} = usePeca(cena);
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[540, 960, 1.6]} para={[540, 960, 0.95]}>
				<svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1080} height={1920}>
					<rect x={-1200} y={-1200} width={3500} height={4400} fill="#121725" />
					{Array.from({length: 48}).map((_, i) => {
						const c = i % 6;
						const r = Math.floor(i / 6);
						const x = 90 + c * 170;
						const y = 420 + r * 150;
						const ok = frame > 2 + rnd(i) * 40;
						return (
							<g key={i}>
								<rect x={x} y={y} width={140} height={120} rx={12} fill="#2b3550" />
								<circle cx={x + 50} cy={y + 70} r={14} fill="#11141c" />
								<circle cx={x + 90} cy={y + 70} r={14} fill="#11141c" />
								{ok && <circle cx={x + 120} cy={y + 18} r={20} fill="#3fae5c" />}
								{ok && <path d={`M${x + 110} ${y + 18} L${x + 117} ${y + 26} L${x + 130} ${y + 10}`} stroke={COR.branco} strokeWidth={5} fill="none" strokeLinecap="round" />}
							</g>
						);
					})}
				</svg>
			</CameraMundo>
			<Vinheta forca={0.5} />
			<Grao />
		</Fundo>
	);
};

// 47. "Mas a história que deu origem a tudo isso": o jornal antigo de novo, sépia, em zoom lento.
export const espHistoria: React.FC<{cena: CenaPeca}> = ({cena}) => (
	<Fundo noite>
		<CameraMundo cena={cena} de={[540, 700, 1.4]} para={[540, 760, 1.15]}>
			<svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1080} height={1920}>
				<rect x={-600} y={-600} width={2300} height={3200} fill="#141722" />
				<Jornal y={880} s={0.95} rot={-2} manchete={'38 VIRAM.\nNINGUÉM\nAJUDOU.'} p={1} />
			</svg>
		</CameraMundo>
		<div style={{position: 'absolute', inset: 0, background: 'rgba(90,60,25,0.25)', mixBlendMode: 'multiply'}} />
		<Vinheta forca={0.55} />
		<Grao />
	</Fundo>
);

// 48. "nunca foi exatamente a que contaram.": o jornal rasga ao meio.
export const espContaram: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[540, 860, 1.15]} para={[540, 880, 1.0]}>
				<svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1080} height={1920}>
					<rect x={-600} y={-600} width={2300} height={3200} fill="#141722" />
					<Jornal y={880} s={0.95} rot={-2} manchete={'38 VIRAM.\nNINGUÉM\nAJUDOU.'} rasga={Math.min(1.2, mola(6, 120, 12))} p={1} />
				</svg>
			</CameraMundo>
			<Vinheta forca={0.55} />
			<Grao />
		</Fundo>
	);
};

// 49. "A pergunta que fica não é só "por que ninguém ajudou".": a pergunta antiga, riscada.
export const espNaoSo: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola, q} = usePeca(cena);
	const risca = mola(Math.max(0, q(cena.de + dur(cena) * 0.6)), 160, 14);
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[540, 860, 1.15]} para={[540, 880, 1.25]}>
				<Rua olhar={0.6} apagar={0.6} />
			</CameraMundo>
			<div style={{position: 'absolute', inset: 0, background: 'rgba(5,7,12,0.6)'}} />
			<div style={{position: 'absolute', top: 260, width: '100%', textAlign: 'center', opacity: Math.min(1, mola(0, 130, 14) * 1.5)}}>
				<div style={{display: 'inline-block', position: 'relative', fontFamily: fonte, fontWeight: 800, fontSize: 64, color: COR.branco, lineHeight: 1.1}}>
					“POR QUE NINGUÉM
					<br />
					AJUDOU?”
					<div style={{position: 'absolute', left: -20, top: '50%', height: 12, width: `calc(${Math.min(1, risca) * 100}% + 40px)`, background: COR.vermelho, borderRadius: 6, transform: 'rotate(-4deg)'}} />
				</div>
			</div>
			<Grao />
		</Fundo>
	);
};

// 50. "É: quantas vezes você mesmo já olhou pro lado,": você na calçada, de costas pro prédio, olhando pro lado.
export const espVoce: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, mola} = usePeca(cena);
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[560, PE - 200, 3.0]} para={[560, PE - 220, 2.4]}>
				<Rua olhar={0.9} />
				<Pessoa x={560} y={PE} s={1.3} corpo="#3c5a8a" olhar={interpolate(frame, [10, 20], [0, -1], lim)} />
			</CameraMundo>
			<Vinheta forca={0.6} />
			<Pilula texto="VOCÊ" p={mola(4, 140, 12)} y={200} cor="#3c5a8a" />
			<Grao />
		</Fundo>
	);
};

// 51. "viu que tinha gente ali,": aparecem outras pessoas paradas na calçada.
export const espGenteAli: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	const outros = [
		[300, '#4a3a52'],
		[800, '#2b4a46'],
		[960, '#5a4636'],
	] as const;
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[560, PE - 220, 2.2]} para={[600, PE - 240, 1.7]}>
				<Rua olhar={0.9} />
				{outros.map(([x, cor], i) => (
					<Pessoa key={i} x={x} y={PE} s={1.25} corpo={cor} cabelo={i % 2 ? 'longo' : 'curto'} olhar={-0.3} p={Math.min(1, mola(i * 5, 140, 14))} />
				))}
				<Pessoa x={560} y={PE} s={1.3} corpo="#3c5a8a" olhar={-1} />
			</CameraMundo>
			<Vinheta forca={0.6} />
			<Grao />
		</Fundo>
	);
};

// 52. "e seguiu andando?": você segue andando e a câmera puxa pra trás até o prédio inteiro, cheio de gente
// olhando — a mesma imagem do gancho. Escurece no fim.
export const espSeguiu: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {t, frame, fps} = usePeca(cena);
	const total = dur(cena);
	const x = interpolate(t, [0, total], [560, 1000], lim);
	const fim = interpolate(frame, [Math.max(0, total * fps - 18), total * fps], [0, 1], lim);
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[600, PE - 240, 1.7]} para={[540, 760, 1.0]}>
				<Rua espectadores={1} olhar={0.7} olhos={1} />
				{[300, 800].map((px, i) => (
					<Pessoa key={i} x={px} y={PE} s={1.25} corpo={i ? '#2b4a46' : '#4a3a52'} olhar={-0.3} />
				))}
				<Pessoa x={x} y={PE} s={1.3} corpo="#3c5a8a" anda={t * 9} olhar={1} />
			</CameraMundo>
			<Vinheta forca={0.65} />
			<div style={{position: 'absolute', inset: 0, background: '#000', opacity: fim}} />
			<Grao />
		</Fundo>
	);
};

export const pecasP3: Partial<Pecas> = {
	espDecadas,
	espJornalistas,
	espExagerada,
	espNuncaViram,
	espSons,
	espGritou,
	espAssustou,
	espPolicia,
	espTarde,
	espSolida,
	espDezenas,
	espHistoria,
	espContaram,
	espNaoSo,
	espVoce,
	espGenteAli,
	espSeguiu,
};

// Evita aviso de import não usado (reservados pra ajustes).
void [FOCO, Rotulo, Telefone, TextoGrande];
