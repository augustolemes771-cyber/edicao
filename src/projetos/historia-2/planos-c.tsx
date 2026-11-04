// historia-2 · planos 5 e 6a/b: praça de manhã (ninguém lembra), delegacia (caso fechado), contorno de giz sem corpo,
// Lia chegando na balsa ao amanhecer (quase 40 anos depois) e a casa da família com a placa VENDE-SE.
import React from 'react';
import {AMBAR, Camada, H, L, PlanoProps, VERM, W, eio, entra, lerp, mao, pop, somaCam, vis, Txt} from './util';
import {Balsa, Barco, Capim, Casa, CORES_CASA, Ceu, Farol, Fumaca, Igreja, Mar, Nevoa, Nuvens, Pier, Placa, Poeira, Relogio} from './cenario';
import {Pessoa, fala} from './personagens';
import {Rot} from './planos-a';
import {poppins, spaceMono} from '../../motor/tema';

// Carimbo que bate na mesa (do código anterior).
export const Carimbo: React.FC<{s: number; t0: number; fim: number; x: number; y: number; rot: number; texto: string; sub?: string; cor?: string; size?: number}> = ({s, t0, fim, x, y, rot, texto, sub, cor = VERM, size = 100}) => {
	const k = L((s - t0) / 0.22);
	const sc = lerp(2.4, 1, eio(k));
	const largura = texto.length * size * 0.5 + 70;
	return (
		<g opacity={vis(s, t0, fim, 0.1) * Math.min(1, k * 3)} transform={`translate(${x} ${y}) rotate(${rot}) scale(${sc})`}>
			<rect x={-largura / 2} y={-size * 0.95} width={largura} height={size * 1.4 + (sub ? size * 0.5 : 0)} rx={10} fill="none" stroke={cor} strokeWidth={9} />
			<rect x={-largura / 2 + 12} y={-size * 0.95 + 12} width={largura - 24} height={size * 1.4 + (sub ? size * 0.5 : 0) - 24} rx={6} fill="none" stroke={cor} strokeWidth={3} />
			<Txt x={0} y={0} size={size} fill={cor} ls={5}>
				{texto}
			</Txt>
			{sub && (
				<Txt x={0} y={size * 0.55} size={size * 0.38} fill={cor} font={poppins} weight={800} ls={8}>
					{sub}
				</Txt>
			)}
		</g>
	);
};

// ---------------------------------------------------------------- 5a · praça de manhã cinzenta: ninguém lembra
export const PPraca: React.FC<PlanoProps> = ({s, T}) => {
	const a = T.ninguem;
	const k = L((s - a) / (T.delegadoO - a));
	const cam = somaCam({x: lerp(-90, 90, eio(k)), y: lerp(-40, -90, k), z: lerp(1.0, 1.12, k)}, mao(s, 0.9));
	const gente: [Parameters<typeof Pessoa>[0]['quem'], number, number, number][] = [
		['pescador', 200, 1250, 0.5],
		['senhora', 420, 1270, -0.4],
		['crianca', 610, 1280, 0.3],
		['padre', 830, 1255, -0.5],
	];
	return (
		<Rot r={cam.r ?? 0}>
			<Camada cam={cam} p={0.1}>
				<Ceu tipo="manha" />
				<Nuvens s={s} y={300} cor="#a3adb0" n={8} vel={10} op={0.8} />
			</Camada>
			<Camada cam={cam} p={0.35}>
				<Mar s={s} y0={900} cor1="#5c7378" cor2="#3c5156" brilho="#dfe8e8" />
				<Farol x={980} y={920} esc={0.45} luz={0} />
			</Camada>
			<Camada cam={cam} p={0.6}>
				<Igreja x={540} y={1080} esc={0.9} s={s} noite={false} relogio={<Relogio cx={0} cy={0} r={38} hora={11} minuto={47} numeros aro="#7a1a14" />} />
				{[60, 240, 860, 1040].map((x, i) => (
					<Casa key={x} x={x} y={1080} esc={1.1} cor={CORES_CASA[(i + 2) % 7]} s={s} i={i + 20} noite={false} acesa={0} fumaca={i === 1} />
				))}
				<Nevoa s={s} y={1050} op={0.35} cor="#d4dcdc" vel={12} />
			</Camada>
			<Camada cam={cam} p={1}>
				<rect x={-400} y={1080} width={W + 800} height={900} fill="#8d8a7e" />
				<rect x={-400} y={1080} width={W + 800} height={900} fill="url(#somB)" />
				{gente.map(([quem, x, y, vira], i) => (
					<g key={quem}>
						<Pessoa quem={quem} x={x} y={y} esc={0.95} t={s + i} vira={vira} ox={Math.sin(s * 0.8 + i * 2) * 0.8} oy={-0.6} expr={i === 3 ? 'cansado' : 'confuso'} pose={i === 1 ? 'bracos' : 'parado'} sd={i} />
						{/* "?" sutil sobre cada um, entrando em sequência */}
						<Txt x={x + 30} y={y - 470 * 0.95 * (quem === 'crianca' ? 0.65 : 1) - 10 + Math.sin(s * 2 + i) * 8} size={70} fill="#f3efe4" font={poppins} weight={800} op={0.75 * entra(s, a + 0.25 + i * 0.22, 0.25)}>
							?
						</Txt>
					</g>
				))}
			</Camada>
			<Camada cam={cam} p={1.6} filtro="bl2">
				<Capim x={-80} y={1940} s={s} n={30} larg={400} alt={260} cor="#3a4038" />
				<Capim x={760} y={1940} s={s} n={30} larg={400} alt={260} cor="#3a4038" sd={4} />
			</Camada>
			<rect width={W} height={H} fill="#9aa4a6" opacity={0.12} />
		</Rot>
	);
};

// ---------------------------------------------------------------- 5b · delegacia: Cássio fecha o caso
export const PDelegacia: React.FC<PlanoProps> = ({s, T}) => {
	const a = T.delegadoO;
	const kz = eio((s - (T.afog - 0.45)) / 0.55);
	const k = L((s - a) / (T.sem - a));
	const cam = somaCam({x: lerp(lerp(-40, 40, k), 0, kz), y: lerp(lerp(-120, -60, k), 210, kz), z: lerp(1.05 + 0.08 * k, 1.7, kz)}, mao(s, 1));
	const helice = s * 400;
	const dia = s < T.dia ? 14 : 15;
	const flip = s > T.dia - 0.1 && s < T.dia + 0.15 ? Math.abs(Math.cos(((s - T.dia + 0.1) / 0.25) * Math.PI)) : 1;
	const batida = s > T.afog && s < T.afog + 0.18 ? Math.sin(s * 90) * 5 : 0;
	const mao2 = s < T.afog ? lerp(-380, -40, eio((s - (T.afog - 0.35)) / 0.35)) : lerp(-40, -420, eio((s - T.afog - 0.1) / 0.4));
	return (
		<Rot r={cam.r ?? 0}>
			<Camada cam={cam} p={0.6}>
				<rect x={-400} y={-300} width={W + 800} height={H + 600} fill="#5f6b5e" />
				{/* janela com persiana e luz cinza da manhã */}
				<rect x={600} y={300} width={420} height={460} fill="#b8c0bf" />
				{Array.from({length: 14}).map((_, i) => (
					<rect key={i} x={600} y={300 + i * 33} width={420} height={18} fill="#7a7a6c" />
				))}
				<polygon points="600,760 1020,760 1200,1300 420,1300" fill="#e8ecea" opacity={0.08} />
				{/* quadro de avisos e brasão */}
				<rect x={90} y={360} width={360} height={260} fill="#8a6a48" />
				{[0, 1, 2].map((i) => (
					<rect key={i} x={110 + i * 112} y={385 + (i % 2) * 30} width={92} height={120} fill="#efe8d6" transform={`rotate(${(i - 1) * 4} ${156 + i * 112} 445)`} />
				))}
				<text x={270} y={590} textAnchor="middle" fontFamily={poppins} fontWeight={800} fontSize={26} fill="#efe8d6" letterSpacing={4}>
					DELEGACIA
				</text>
			</Camada>
			<Camada cam={cam} p={0.8}>
				{/* ventilador de teto girando */}
				<line x1={540} y1={-200} x2={540} y2={130} stroke="#222" strokeWidth={6} />
				<g transform="translate(540 140) scale(1 0.22)">
					{[0, 120, 240].map((r) => (
						<rect key={r} x={-12} y={0} width={24} height={260} rx={12} fill="#3a3028" transform={`rotate(${helice + r})`} />
					))}
				</g>
				<circle cx={540} cy={140} r={18} fill="#2a2a2a" />
				{/* Cássio, 1987: bigode, quepe, barriga, cansado */}
				<Pessoa quem="cassio" x={540} y={1300} esc={1.3} t={s} pose="parado" vira={-0.15} ox={0.2} oy={0.9} expr="cansado" fala={fala(s, T.delegado, T.dia)} rim="#e8ecea" rimDx={-5} />
			</Camada>
			<Camada cam={cam} p={1}>
				{/* mesa com o processo */}
				<polygon points="-200,1060 1280,1060 1400,1240 -320,1240" fill="#6b4a2e" />
				<rect x={-320} y={1240} width={1720} height={600} fill="#3e2a1c" />
				<g transform={`translate(${540 + batida} 1150) rotate(-3)`}>
					<rect x={-260} y={-90} width={520} height={190} fill="#d9c79a" />
					<rect x={-240} y={-80} width={480} height={175} fill="#f2ecdc" />
					<text x={-220} y={-45} fontFamily={spaceMono} fontWeight={700} fontSize={22} fill="#2a2a2a">
						PROCESSO Nº 087/87
					</text>
					<text x={-220} y={-15} fontFamily={spaceMono} fontSize={18} fill="#4a4a4a">
						DESAPARECIMENTO: ANSELMO R.
					</text>
					{[15, 35, 55, 75].map((y) => (
						<line key={y} x1={-220} y1={y} x2={200 - (y % 3) * 40} y2={y} stroke="#9a9a9a" strokeWidth={3} />
					))}
					<Carimbo s={s} t0={T.afog} fim={T.sem + 0.5} x={30} y={40} rot={-8} texto="CASO FECHADO" sub="AFOGAMENTO" size={54} />
				</g>
				{/* calendário de mesa: 14 → 15 (fechou em um dia) */}
				<g transform="translate(150 1080)">
					<rect x={-70} y={-100} width={140} height={110} rx={6} fill="#efe8d6" transform={`scale(1 ${flip})`} />
					<rect x={-70} y={-100} width={140} height={28} fill="#b5332b" />
					<text x={0} y={-80} textAnchor="middle" fontFamily={poppins} fontWeight={800} fontSize={18} fill="#fff">
						MAR 1987
					</text>
					<text x={0} y={-12} textAnchor="middle" fontFamily={poppins} fontWeight={900} fontSize={62} fill="#2a2a2a" opacity={flip}>
						{dia}
					</text>
				</g>
				{/* xícara de café fumegando */}
				<g transform="translate(920 1100)">
					<path d="M-34,0 L-28,-56 L28,-56 L34,0 Z" fill="#e8e2d2" />
					<Fumaca x={0} y={-70} s={s} sd={4} cor="#e8e2d2" op={0.3} />
				</g>
				{/* mão de Cássio com o carimbo */}
				<g transform={`translate(560 ${1100 + mao2})`}>
					<rect x={-40} y={-120} width={80} height={110} rx={10} fill="#4a3220" />
					<rect x={-60} y={-14} width={120} height={22} rx={4} fill="#2a2a2a" />
					<rect x={-26} y={-260} width={52} height={150} rx={20} fill="#8d5d3e" />
				</g>
			</Camada>
		</Rot>
	);
};

// ---------------------------------------------------------------- 5c · píer: contorno de giz sem corpo
export const PGiz: React.FC<PlanoProps> = ({s, T}) => {
	const a = T.sem;
	const k = L((s - a) / (T.quase - a));
	const cam = somaCam({x: lerp(-60, 60, k), y: lerp(-120, 40, eio(k)), z: lerp(1.15, 1.3, k)}, mao(s, 0.9));
	const desenha = L((s - (T.corpo - 0.3)) / 0.6);
	const onda = Math.sin(s * 1.4);
	return (
		<Rot r={cam.r ?? 0}>
			<Camada cam={cam} p={0.3}>
				<Ceu tipo="manha" h={700} />
				<Mar s={s} y0={560} cor1="#5c7378" cor2="#3c5156" brilho="#dfe8e8" />
				<Farol x={860} y={600} esc={0.38} luz={0} />
			</Camada>
			<Camada cam={cam} p={1}>
				{/* areia molhada com a espuma indo e vindo */}
				<rect x={-400} y={760} width={W + 800} height={1400} fill="#b9ab8c" />
				<path d={`M-400,${800 + onda * 30} Q200,${760 + onda * 40} 540,${790 + onda * 20} T1480,${780 + onda * 30} L1480,700 L-400,700 Z`} fill="#6f878a" />
				<path d={`M-400,${800 + onda * 30} Q200,${760 + onda * 40} 540,${790 + onda * 20} T1480,${780 + onda * 30}`} fill="none" stroke="#f2f2ec" strokeWidth={10} opacity={0.7} />
				{/* pilares do píer */}
				{[120, 300].map((x) => (
					<rect key={x} x={x} y={500} width={34} height={500} fill="#3a2a1e" />
				))}
				<rect x={0} y={480} width={420} height={40} fill="#5a4232" />
				{/* contorno de giz vazio */}
				<g transform="translate(560 1060) rotate(-12)">
					<path
						d="M0,-230 a50,50 0 1 1 0.1,0 M-30,-140 L-120,-60 L-150,40 M30,-140 L130,-80 L170,10 M-34,-140 L-40,60 L-80,240 M34,-140 L40,60 L90,240 M-40,60 L40,60"
						fill="none"
						stroke="#fbfbf6"
						strokeWidth={10}
						strokeLinecap="round"
						strokeDasharray={1600}
						strokeDashoffset={1600 * (1 - desenha)}
						opacity={0.9}
					/>
				</g>
				{/* fita de isolamento balançando */}
				<path d={`M-100,880 Q540,${900 + Math.sin(s * 2) * 20} 1180,860`} stroke="#e8c21a" strokeWidth={22} fill="none" />
				<path d={`M-100,880 Q540,${900 + Math.sin(s * 2) * 20} 1180,860`} stroke="#1a1a1a" strokeWidth={22} fill="none" strokeDasharray="30 60" opacity={0.8} />
				{/* pegadas que não vão a lugar nenhum */}
				{[0, 1, 2, 3].map((i) => (
					<ellipse key={i} cx={260 + i * 60} cy={1240 - i * 30} rx={14} ry={24} fill="#8f8266" opacity={0.6} />
				))}
			</Camada>
			<g opacity={entra(s, T.corpo + 0.15, 0.25)}>
				<Txt x={540} y={360} size={120} fill="#fbfbf6" ls={10} stroke="#3a3328" sw={6} sc={0.9 + 0.1 * pop(s, T.corpo + 0.15, 0.3)}>
					SEM CORPO
				</Txt>
			</g>
		</Rot>
	);
};

// ---------------------------------------------------------------- 6a · quase 40 anos depois: Lia chega de balsa ao amanhecer
export const PChegada: React.FC<PlanoProps> = ({s, T}) => {
	const a = T.quase;
	const k = L((s - a) / (T.volta - a));
	const cam = somaCam({x: lerp(-120, 80, eio(k)), y: lerp(-60, -10, k), z: lerp(1.0, 1.15, k)}, mao(s, 0.8));
	const ano = Math.round(lerp(1987, 2026, eio((s - a - 0.1) / 1.1)));
	const xLia = lerp(330, 640, L((s - (T.neta - 0.6)) / 1.6));
	return (
		<Rot r={cam.r ?? 0}>
			<Camada cam={cam} p={0.08}>
				<Ceu tipo="amanhecer" />
				<circle cx={760} cy={880} r={90} fill="#ffd4a0" opacity={0.9} />
				<circle cx={760} cy={880} r={400} fill="url(#glowAmbar)" opacity={0.6} />
			</Camada>
			<Camada cam={cam} p={0.15}>
				<Nuvens s={s} y={420} cor="#c7768a" n={6} vel={14} op={0.7} />
			</Camada>
			<Camada cam={cam} p={0.3}>
				<Mar s={s} y0={900} cor1="#6a5a7a" cor2="#2a3550" brilho="#ffd4a0" refX={760} refOp={0.8} />
				{/* a mesma ilha, agora de dia */}
				<path d="M-300,910 Q-100,820 140,840 Q320,800 520,850 L620,910 Z" fill="#3a3448" />
				<Farol x={60} y={880} esc={0.42} luz={0} />
			</Camada>
			<Camada cam={cam} p={0.6}>
				<Balsa x={900} y={1080} esc={0.7} s={s} luz={0.2} />
			</Camada>
			<Camada cam={cam} p={1}>
				<Pier x0={-300} x1={820} y={1180} esc={1.2} cor="#6a4e3a" />
				<Placa x={140} y={1100} esc={0.42} linhas={['ILHA DO', 'BOTO BRANCO']} velha={1} rot={-4} luz={0} />
				{/* Lia: jaqueta, mochila, cabelo ondulado curto, andando no píer */}
				<Pessoa quem="lia" x={xLia} y={1172} esc={0.88} t={s} pose={s > T.neta - 0.6 && s < T.volta ? 'andar' : 'parado'} ritmo={1.7} vira={0.55} ox={0.6} expr="serio" rim="#ffc79a" rimDx={5} dir={1} />
			</Camada>
			<Camada cam={cam} p={1.5} filtro="bl2">
				<rect x={-200} y={-200} width={80} height={2400} fill="#1e1828" />
				<Capim x={760} y={1950} s={s} n={30} larg={420} alt={300} cor="#241c2a" />
			</Camada>
			{/* letreiro de data de cinema */}
			<g opacity={vis(s, a + 0.05, T.volta + 0.3, 0.2)}>
				<Txt x={540} y={330} size={150} font={spaceMono} weight={700} fill="#fff2e0" ls={8} glow="#ff9a6a">
					{String(ano)}
				</Txt>
				<Txt x={540} y={400} size={40} font={poppins} weight={700} fill="#ffe0c8" ls={12} op={entra(s, T.anos, 0.25)}>
					QUASE 40 ANOS DEPOIS
				</Txt>
			</g>
		</Rot>
	);
};

// ---------------------------------------------------------------- 6b · a casa da família com a placa VENDE-SE
export const PCasa: React.FC<PlanoProps> = ({s, T}) => {
	const a = T.volta;
	const k = L((s - a) / (T.eAcha - a));
	const cam = somaCam({x: lerp(-40, 30, k), y: lerp(-80, -120, k), z: lerp(1.0, 1.12, eio(k))}, mao(s, 0.8));
	const placa = pop(s, T.vender, 0.4);
	return (
		<Rot r={cam.r ?? 0}>
			<Camada cam={cam} p={0.1}>
				<Ceu tipo="amanhecer" />
				<Nuvens s={s} y={300} cor="#c7768a" n={6} vel={14} op={0.6} />
			</Camada>
			<Camada cam={cam} p={1}>
				{/* casa azul desbotada da família */}
				<Casa x={540} y={1180} esc={3.2} cor={CORES_CASA[0]} s={s} i={30} noite={false} acesa={0} porta="#4d6a4a" />
				{/* trepadeira e reboco caído */}
				{Array.from({length: 16}).map((_, i) => (
					<circle key={i} cx={330 + (i % 4) * 22 + Math.sin(i) * 10} cy={830 + Math.floor(i / 4) * 40} r={18} fill="#4d6a3a" opacity={0.9} />
				))}
				<rect x={650} y={1000} width={90} height={50} fill="#d9d2c2" opacity={0.5} />
				<rect x={-400} y={1180} width={W + 800} height={800} fill="#7a6a52" />
				{/* placa VENDE-SE fincada no quintal */}
				<g transform={`translate(830 1260) rotate(${(1 - placa) * 12 + Math.sin(s * 2) * 1.5}) scale(${0.6 + 0.4 * placa})`} opacity={L(placa * 2)}>
					<rect x={-8} y={-260} width={16} height={260} fill="#5a4232" />
					<rect x={-150} y={-330} width={300} height={130} rx={6} fill="#f2ecdc" />
					<rect x={-150} y={-330} width={300} height={130} rx={6} fill="none" stroke={VERM} strokeWidth={8} />
					<text x={0} y={-262} textAnchor="middle" fontFamily="Anton" fontSize={64} fill={VERM} letterSpacing={4}>
						VENDE-SE
					</text>
					<text x={0} y={-220} textAnchor="middle" fontFamily={poppins} fontWeight={700} fontSize={20} fill="#3a3a3a">
						tratar no local
					</text>
				</g>
				{/* Lia de costas olhando a casa */}
				<Pessoa quem="lia" x={360} y={1290} esc={1.05} t={s} costas pose="parado" rim="#ffc79a" rimDx={-4} />
			</Camada>
			<Camada cam={cam} p={1.5} filtro="bl2">
				<Capim x={-100} y={1960} s={s} n={36} larg={600} alt={360} cor="#2c3020" />
			</Camada>
		</Rot>
	);
};

export {AMBAR, H, Barco};
