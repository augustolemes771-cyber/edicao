// Parte 2 do efeito-espectador: o experimento de laboratório (sala sozinho × sala em grupo, fumaça) e o mecanismo
// (olhar pro lado, difusão da responsabilidade).
import React from 'react';
import {interpolate} from 'remotion';
import type {CenaPeca, Pecas} from '../../pecas/peca';
import {COR, Fundo, Pilula, Numero, Vinheta, lim, fonte, usePeca} from '../experimento-stanford/ilustracao';
import {
	Balao,
	Cadeira,
	CameraMundo,
	Cronometro,
	Grao,
	Pessoa,
	Rotulo,
	SALA,
	Sala,
	Silhueta,
	Telefone,
	rnd,
} from './cenario';

const dur = (cena: CenaPeca) => cena.ate - cena.de;
const CHAO = SALA.parede + 120; // pés de quem está sentado
const ASSENTOS = [180, 340, 500, 660];

// Voluntário sentado (cadeira + pessoa na frente dela).
const Sentado: React.FC<{
	x: number;
	voluntario?: boolean;
	olhar?: number;
	levanta?: number;
	anda?: number;
	p?: number;
}> = ({x, voluntario, olhar = 0, levanta = 0, anda = 0, p = 1}) => (
	<g opacity={p}>
		<Cadeira x={x} y={CHAO} s={1.1} />
		<Pessoa
			x={x + levanta * 260}
			y={CHAO - 30 * (1 - levanta)}
			s={1.15}
			corpo={voluntario ? '#3c5a8a' : '#2a3044'}
			pele={voluntario ? COR.pele : '#2a3044'}
			corCabelo={voluntario ? '#2a1d16' : '#2a3044'}
			olhar={olhar}
			anda={anda}
			braco={levanta * 0.4}
		/>
	</g>
);

// 19. "Dois psicólogos decidiram testar isso.": dois cientistas de jaleco com prancheta.
export const espPsicologos: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola, t} = usePeca(cena);
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[540, 1150, 1.9]} para={[540, 1120, 1.6]}>
				<Sala>
					<Pessoa x={400} y={CHAO} s={1.6} jaleco olhar={0.6 + Math.sin(t * 3) * 0.2} p={mola(0, 120, 14)} />
					<Pessoa
						x={680}
						y={CHAO}
						s={1.6}
						jaleco
						corCabelo="#5a4a3a"
						olhar={-0.6}
						braco={0.35 * mola(14, 120, 12)}
						p={mola(5, 120, 14)}
					/>
				</Sala>
			</CameraMundo>
			<Vinheta forca={0.45} />
			<Numero valor="2" rotulo="PSICÓLOGOS" p={mola(8, 130, 13)} top={170} />
			<Grao />
		</Fundo>
	);
};

// 20. "Eles montaram salas com voluntários": as cadeiras entram, o voluntário senta.
export const espSalas: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[540, 1000, 1.0]} para={[460, 1100, 1.3]}>
				<Sala>
					{ASSENTOS.map((x, i) => (
						<g key={x} transform={`translate(0,${(1 - Math.min(1, mola(i * 4, 150, 14))) * 400})`}>
							<Cadeira x={x} y={CHAO} s={1.1} />
						</g>
					))}
					<Sentado x={340} voluntario p={mola(18, 130, 14)} />
				</Sala>
			</CameraMundo>
			<Vinheta forca={0.45} />
			<Pilula texto="VOLUNTÁRIOS" p={mola(10, 130, 13)} y={200} cor="#3c5a8a" />
			<Grao />
		</Fundo>
	);
};

// 21. "e simularam emergências falsas:": luz de alarme pulsando na sala.
export const espEmergencia: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[460, 1100, 1.3]} para={[480, 1080, 1.45]}>
				<Sala alarme={mola(2, 140, 14)}>
					<Sentado x={340} voluntario olhar={0.8} />
				</Sala>
			</CameraMundo>
			<Vinheta forca={0.5} />
			<Pilula texto="EMERGÊNCIA FALSA" p={mola(6, 140, 12)} y={200} />
			<Grao />
		</Fundo>
	);
};

// 22. "alguém fingindo uma crise,": o interfone da sala treme, gritos pelo alto-falante.
export const espCrise: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[540, 520, 2.6]} para={[540, 500, 3.0]} curva="rapida">
				<Sala falante={mola(0, 150, 12)} alarme={0.4} />
			</CameraMundo>
			<Vinheta forca={0.6} />
			<Pilula texto="SOCORRO…" p={mola(10, 140, 12)} y={260} />
			<Grao />
		</Fundo>
	);
};

// 23. "um quarto enchendo de fumaça.": fumaça entrando pela grade de ventilação.
export const espFumaca: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps} = usePeca(cena);
	const f = interpolate(frame, [0, dur(cena) * fps], [0.05, 0.6], lim);
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[SALA.grade.x + 80, SALA.grade.y + 160, 2.0]} para={[460, 900, 1.2]}>
				<Sala fumaca={f}>
					<Sentado x={340} voluntario olhar={-0.8} />
				</Sala>
			</CameraMundo>
			<Vinheta forca={0.5} />
			<Grao />
		</Fundo>
	);
};

// 24. "Quando a pessoa estava sozinha,": a mesma sala, só o voluntário, fumaça já no ar.
export const espSozinha: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola, t} = usePeca(cena);
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[340, 1100, 2.0]} para={[380, 1060, 1.6]}>
				<Sala fumaca={0.6}>
					{ASSENTOS.filter((x) => x !== 340).map((x) => (
						<Cadeira key={x} x={x} y={CHAO} s={1.1} />
					))}
					<Sentado x={340} voluntario olhar={Math.sin(t * 4) * 0.9} />
				</Sala>
			</CameraMundo>
			<Vinheta forca={0.55} />
			<Pilula texto="SOZINHA" p={mola(4, 140, 12)} y={200} cor="#3c5a8a" />
			<Grao />
		</Fundo>
	);
};

// 25. "ajudava quase sempre.": levanta, vai até a porta e abre — check verde.
export const espAjudava: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola, t, frame} = usePeca(cena);
	const lev = interpolate(frame, [4, 34], [0, 1], lim);
	const abre = mola(30, 120, 14);
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[460, 1060, 1.5]} para={[700, 1040, 1.5]}>
				<Sala fumaca={0.6} luzPorta={abre}>
					<Sentado x={340} voluntario levanta={lev * 1.6} anda={lev < 1 ? t * 9 : 0} olhar={1} />
					<g transform={`translate(910,620) scale(${Math.min(1, mola(34, 160, 12))})`}>
						<circle r={60} fill="#3fae5c" />
						<path
							d="M-26 0 L-6 22 L30 -24"
							stroke={COR.branco}
							strokeWidth={14}
							fill="none"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</g>
				</Sala>
			</CameraMundo>
			<Vinheta forca={0.5} />
			<Pilula texto="QUASE SEMPRE AJUDA" p={mola(12, 130, 13)} y={200} cor="#3fae5c" />
			<Grao />
		</Fundo>
	);
};

// 26. "Quando pensava que outras pessoas também estavam vendo,": cadeiras se enchem de silhuetas paradas.
export const espOutras: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola, t} = usePeca(cena);
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[420, 1100, 1.7]} para={[440, 1000, 1.05]}>
				<Sala fumaca={0.6}>
					{ASSENTOS.map((x, i) =>
						x === 340 ? (
							<Sentado key={x} x={x} voluntario olhar={Math.sin(t * 3) * 0.8} />
						) : (
							<Sentado key={x} x={x} olhar={0} p={Math.min(1, mola(4 + i * 6, 140, 14))} />
						),
					)}
				</Sala>
			</CameraMundo>
			<Vinheta forca={0.5} />
			<Pilula texto="EM GRUPO" p={mola(16, 130, 13)} y={200} cor="#2a3044" />
			<Grao />
		</Fundo>
	);
};

// 27. "a chance de ajudar caía pela metade.": barras sozinho × em grupo, a do grupo despenca pra metade.
export const espMetade: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	const a = Math.min(1, mola(0, 130, 15));
	const cai = mola(14, 110, 10);
	const grupo = a * (1 - 0.5 * cai);
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[540, 980, 1.1]} para={[600, 1000, 1.25]}>
				<svg style={{position: 'absolute', left: 0, top: 0}} width={1080} height={1920}>
					<rect x={-600} y={-600} width={2300} height={3200} fill="#121725" />
					<rect x={220} y={1240 - 600 * a} width={240} height={600 * a} rx={16} fill="#3fae5c" />
					<rect x={620} y={1240 - 600 * grupo} width={240} height={600 * grupo} rx={16} fill={COR.vermelho} />
					<line
						x1={580}
						y1={940}
						x2={900}
						y2={940}
						stroke={COR.branco}
						strokeWidth={4}
						strokeDasharray="12 10"
						opacity={cai}
					/>
					<rect x={160} y={1240} width={760} height={10} fill="#2b3550" />
					<text
						x={340}
						y={1310}
						textAnchor="middle"
						fontFamily={fonte}
						fontWeight={800}
						fontSize={40}
						fill={COR.branco}
					>
						SOZINHO
					</text>
					<text
						x={740}
						y={1310}
						textAnchor="middle"
						fontFamily={fonte}
						fontWeight={800}
						fontSize={40}
						fill={COR.branco}
					>
						EM GRUPO
					</text>
				</svg>
			</CameraMundo>
			<Vinheta forca={0.45} />
			<Pilula texto="CAI PELA METADE" p={mola(18, 140, 12)} y={200} />
			<Grao />
		</Fundo>
	);
};

// Fileira de pessoas na rua (mecanismo): cada uma olha pro lado em sequência.
const Fila: React.FC<{olhar: (i: number) => number; n?: number; y?: number; brilho?: (i: number) => number}> = ({
	olhar,
	n = 5,
	y = 1260,
	brilho,
}) => (
	<svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1080} height={1920}>
		<rect x={-600} y={-600} width={2300} height={3200} fill="#121725" />
		<rect x={-600} y={y} width={2300} height={1400} fill="#1b2030" />
		{Array.from({length: n}).map((_, i) => {
			const x = 540 + (i - (n - 1) / 2) * 190;
			return (
				<g key={i}>
					{brilho && brilho(i) > 0.01 && (
						<circle cx={x} cy={y - 260} r={34 * brilho(i)} fill={COR.dourado} opacity={0.95} />
					)}
					<Pessoa
						x={x}
						y={y}
						s={1.5}
						corpo={i === Math.floor(n / 2) ? '#3c5a8a' : ['#4a3a52', '#2b4a46', '#5a4636', '#3a4256', '#4d3434'][i % 5]}
						olhar={olhar(i)}
						cabelo={i % 2 ? 'longo' : 'curto'}
					/>
				</g>
			);
		})}
	</svg>
);

// 28. "Cada pessoa olha pro lado,": olhares passando de um a outro.
export const espOlhaLado: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame} = usePeca(cena);
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[540, 1080, 1.6]} para={[540, 1060, 1.3]}>
				<Fila olhar={(i) => interpolate(frame, [i * 5, i * 5 + 6], [0, i % 2 ? -1 : 1], lim)} />
			</CameraMundo>
			<Vinheta forca={0.55} />
			<Grao />
		</Fundo>
	);
};

// 29. "vê que ninguém mais está se movendo,": todos congelados, imagem dessatura e treme.
export const espNinguemMove: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	return (
		<Fundo noite>
			<div style={{position: 'absolute', inset: 0, filter: 'grayscale(0.8)'}}>
				<CameraMundo cena={cena} de={[540, 1080, 1.3]} para={[540, 1090, 1.42]}>
					<Fila olhar={(i) => (i % 2 ? -1 : 1)} />
				</CameraMundo>
			</div>
			<Vinheta forca={0.6} />
			<Pilula texto="NINGUÉM SE MOVE" p={mola(6, 140, 12)} y={200} />
			<Grao />
		</Fundo>
	);
};

// 30. "e conclui, em segundos,": cronômetro correndo na cabeça do do meio.
export const espSegundos: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, mola} = usePeca(cena);
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[540, 960, 1.8]} para={[540, 940, 2.1]}>
				<Fila olhar={() => 0} />
				<svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1080} height={1920}>
					<Cronometro x={540} y={760} r={110} giro={frame * 18} p={mola(0, 160, 13)} cor={COR.dourado} />
				</svg>
			</CameraMundo>
			<Vinheta forca={0.55} />
			<Grao />
		</Fundo>
	);
};

// 31. "que talvez não seja tão grave assim.": balão de pensamento.
export const espNaoGrave: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[600, 980, 1.7]} para={[580, 1000, 1.45]}>
				<Fila olhar={() => 0.2} />
				<svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1080} height={1920}>
					<Balao x={700} y={820} texto="NÃO DEVE SER GRAVE…" p={mola(2, 140, 13)} w={620} />
				</svg>
			</CameraMundo>
			<Vinheta forca={0.5} />
			<Grao />
		</Fundo>
	);
};

// 32. "Ou que alguém já deve ter ligado.": telefone tocando sozinho, ninguém atende.
export const espJaLigou: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[540, 900, 1.6]} para={[540, 880, 1.9]}>
				<Fila olhar={(i) => (i % 2 ? 0.6 : -0.6)} />
				<svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1080} height={1920}>
					<Balao x={540} y={760} texto="" p={mola(0, 140, 13)} w={420} />
					<Telefone x={540} y={760} s={0.8} toca={1} p={mola(4, 150, 13)} />
				</svg>
			</CameraMundo>
			<Vinheta forca={0.5} />
			<Pilula texto="ALGUÉM JÁ LIGOU?" p={mola(10, 130, 13)} y={200} cor="#3c5a8a" />
			<Grao />
		</Fundo>
	);
};

// 33. "Quanto mais testemunhas,": a multidão vai crescendo pros lados.
export const espTestemunhas: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame} = usePeca(cena);
	const n = Math.round(interpolate(frame, [0, 24], [5, 13], lim));
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[540, 1000, 1.3]} para={[540, 960, 0.75]}>
				<svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1080} height={1920}>
					<rect x={-1200} y={-1200} width={3500} height={4400} fill="#121725" />
					{Array.from({length: n * 2}).map((_, i) => {
						const fila = i % 2;
						const k = Math.floor(i / 2);
						return (
							<Silhueta
								key={i}
								x={540 + (k - (n - 1) / 2) * 120 + fila * 60}
								y={1150 + fila * 120}
								s={1.4 + fila * 0.2}
								cor={fila ? '#20283c' : '#2b3550'}
								olhos={1}
								olhar={Math.sin(frame / 12 + i) * 0.4}
							/>
						);
					})}
				</svg>
			</CameraMundo>
			<Vinheta forca={0.55} />
			<Numero valor={String(n * 2)} rotulo="TESTEMUNHAS" p={1} top={170} />
			<Grao />
		</Fundo>
	);
};

// 34/35. "mais essa responsabilidade se espalha, / e menos ela pesa em cada uma.": a esfera dourada se parte
// em pedaços que voam pra cada cabeça e ficam pequenos.
const Responsabilidade: React.FC<{cena: CenaPeca; espalha: number; pesa: number}> = ({cena, espalha, pesa}) => {
	const {frame} = usePeca(cena);
	const n = 5;
	const y = 1260;
	return (
		<>
			<Fila n={n} y={y} olhar={() => 0} />
			<svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1080} height={1920}>
				{Array.from({length: n}).map((_, i) => {
					const tx = 540 + (i - (n - 1) / 2) * 190;
					const x = 540 + (tx - 540) * espalha;
					const yy = 640 + (y - 290 - 640) * espalha + Math.sin(frame / 8 + i) * 4;
					const r = (110 / Math.sqrt(1 + 4 * espalha)) * (1 - 0.55 * pesa) * (espalha < 0.02 ? 1 : 1);
					return (
						<circle key={i} cx={x} cy={yy} r={espalha < 0.02 && i > 0 ? 0 : r} fill={COR.dourado} opacity={0.95} />
					);
				})}
			</svg>
		</>
	);
};
export const espEspalha: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[540, 900, 1.25]} para={[540, 980, 1.05]}>
				<Responsabilidade cena={cena} espalha={Math.min(1, mola(8, 90, 13))} pesa={0} />
			</CameraMundo>
			<Vinheta forca={0.5} />
			<Pilula texto="RESPONSABILIDADE" p={mola(0, 140, 12)} y={200} cor="#b8892a" />
			<Grao />
		</Fundo>
	);
};
export const espPesa: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[540, 1000, 1.05]} para={[540, 1020, 1.7]}>
				<Responsabilidade cena={cena} espalha={1} pesa={Math.min(1, mola(2, 110, 14))} />
			</CameraMundo>
			<Vinheta forca={0.55} />
			<Grao />
		</Fundo>
	);
};

// Usa rnd/Rotulo/dur em outras partes; reexporta pra não duplicar.
export {rnd, Rotulo, dur};

export const pecasP2: Partial<Pecas> = {
	espPsicologos,
	espSalas,
	espEmergencia,
	espCrise,
	espFumaca,
	espSozinha,
	espAjudava,
	espOutras,
	espMetade,
	espOlhaLado,
	espNinguemMove,
	espSegundos,
	espNaoGrave,
	espJaLigou,
	espTestemunhas,
	espEspalha,
	espPesa,
};
