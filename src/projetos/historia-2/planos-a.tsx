// historia-2 · planos 1 e 2: a ilha à noite (0–6 s) e a cozinha da vila na tempestade com o apagão (6–14,6 s).
import React from 'react';
import {AMBAR, Camada, H, L, PlanoProps, VERM, W, eio, entra, lerp, mao, pop, somaCam, vis, Txt} from './util';
import {Balsa, Barco, Capim, Casa, CORES_CASA, Ceu, Chuva, Digital, Estrelas, Farol, Feixe, Fumaca, Igreja, Lua, Mar, Nevoa, Nuvens, Pier, Placa, Raio, Relogio, Rochas, relampago} from './cenario';
import {poppins, spaceMono} from '../../motor/tema';

const Rot: React.FC<{r: number; children: React.ReactNode}> = ({r, children}) => <g transform={`rotate(${r} ${W / 2} ${H / 2})`}>{children}</g>;

// ---------------------------------------------------------------- 1 · plano geral da ilha
export const PIlha: React.FC<PlanoProps> = ({s, T}) => {
	const fim = T.ate;
	const k = L(s / fim);
	// travelling lateral + push-in; em "farol" a câmera vira para o farol
	const kf = eio((s - (T.farol - 0.3)) / 2.2);
	const cam = somaCam({x: lerp(-70, 40, k) + kf * 120, y: lerp(60, 0, k) - kf * 60, z: 1.22 + 0.1 * k + kf * 0.14}, mao(s, 0.8));
	const flash = relampago(s, [2.9, 5.3]) * 0.5;
	const lampX = 840;
	const lampY = 965 - 575 * 0.6;
	const xb = lerp(-380, 1250, (s - 1.4) / 5.4);
	return (
		<Rot r={cam.r ?? 0}>
			<Camada cam={cam} p={0.05}>
				<Ceu tipo="noite" clarao={flash} />
				<Estrelas s={s} n={70} h={760} />
				<Lua x={250} y={330} />
			</Camada>
			<Camada cam={cam} p={0.15}>
				<Nuvens s={s} y={300} cor="#0f2633" n={7} vel={10} luz="#9fc8e8" luzOp={flash} />
				<Nuvens s={s} y={620} cor="#123040" n={6} sd={4} vel={16} esc={0.8} op={0.8} />
				<Raio x={980} y={380} h={420} sd={3} op={flash > 0.25 ? flash : 0} />
			</Camada>
			<Camada cam={cam} p={0.3}>
				<Mar s={s} y0={990} refX={250} refOp={0.6} />
			</Camada>
			<Camada cam={cam} p={0.42}>
				<g transform="translate(640 960) scale(1.42) translate(-640 -960)">
				{/* ilha: morro, vila e o farol na ponta rochosa */}
				<path d="M-300,1000 Q-120,880 120,900 Q300,840 470,880 Q620,850 760,900 Q900,880 1000,960 L1200,1000 Z" fill="#081620" />
				<path d="M700,1000 Q760,930 830,940 Q900,930 960,990 Z" fill="#050d14" />
				<Igreja x={300} y={935} esc={0.36} s={s} />
				{[
					[40, 965, 0.42],
					[150, 948, 0.36],
					[420, 960, 0.4],
					[540, 975, 0.44],
					[640, 985, 0.38],
					[-60, 985, 0.4],
				].map(([x, y, e], i) => (
					<Casa key={i} x={x} y={y} esc={e} cor={CORES_CASA[i % CORES_CASA.length]} s={s} i={i} fumaca={i % 2 === 0} />
				))}
				<Farol x={840} y={965} esc={0.6} luz={1} />
				</g>
			</Camada>
			<Camada cam={cam} p={0.45}>
				<g transform="translate(640 960) scale(1.42) translate(-640 -960)">
					<Feixe x={lampX} y={lampY} ang={s * 1.9 + 0.6} comp={1100} larg={130} op={0.9} />
					<Nevoa s={s} y={930} op={0.2} />
				</g>
				<Gaivotas s={s} />
			</Camada>
			<Camada cam={cam} p={0.6}>
				<Balsa x={xb} y={1085} esc={0.5} s={s} />
				<Barco x={820} y={1160} esc={0.5} cor="#2f6e8a" s={s} i={2} luz={1} />
				<Barco x={140} y={1120} esc={0.38} cor="#d6b866" s={s} i={4} luz={1} />
				<Espuma s={s} y={1180} />
			</Camada>
			<Camada cam={cam} p={0.85}>
				<Pier x0={-200} x1={640} y={1255} esc={0.8} />
				<Espuma s={s} y={1290} esp={2} />
				<Barco x={720} y={1250} esc={0.75} cor="#c0543a" cor2="#efe6d0" s={s} i={1} nome="SANTA LUZIA" />
				<g transform="translate(70 1250)">
					<circle cx={0} cy={-150} r={90} fill="url(#glowAmbar)" opacity={0.7} />
					<rect x={-3} y={-150} width={6} height={150} fill="#2e221a" />
					<circle cx={0} cy={-152} r={8} fill="#ffe0a0" />
				</g>
				<Placa x={330} y={1175} esc={0.6} linhas={['ILHA DO', 'BOTO BRANCO']} luz={0.8} rot={-1.5} />
				{/* plaquinha pendurada que entra em "balsa por dia" */}
				<g transform={`translate(330 1205) rotate(${Math.sin(s * 3) * 4 * (1 - entra(s, T.balsa, 1.2))})`} opacity={entra(s, T.balsa - 0.1, 0.25)}>
					<line x1={-90} y1={-8} x2={-90} y2={8} stroke="#2a1e14" strokeWidth={3} />
					<line x1={90} y1={-8} x2={90} y2={8} stroke="#2a1e14" strokeWidth={3} />
					<rect x={-130} y={8} width={260} height={50} rx={4} fill="#e8dcc0" />
					<Txt x={0} y={44} size={30} fill="#5a2a22" font={poppins} weight={800} ls={2}>
						BALSA: 1 POR DIA
					</Txt>
				</g>
			</Camada>
			<Camada cam={cam} p={0.9}>
				<Nevoa s={s} y={1150} op={0.18} sd={3} vel={22} />
			</Camada>
			{/* primeiro plano desfocado: rochas e capim passando mais rápido */}
			<Camada cam={cam} p={1.8} filtro="bl2">
				<Rochas x={60} y={1950} esc={1.5} cor="#03080c" sd={2} n={4} />
				<Capim x={600} y={1960} s={s} n={46} larg={620} alt={480} cor="#04100d" />
				{/* poste de amarração com corda, bem perto da lente */}
				<rect x={-40} y={1040} width={70} height={1000} fill="#1a120c" />
				<path d={`M30,1160 Q260,${1240 + Math.sin(s * 1.5) * 20} 520,${1200 + Math.sin(s * 1.2) * 14}`} stroke="#2a1e14" strokeWidth={14} fill="none" />
			</Camada>
		</Rot>
	);
};

// Gaivotas batendo asas cruzando o céu.
const Gaivotas: React.FC<{s: number}> = ({s}) => (
	<g stroke="#cfe0ea" strokeWidth={3.5} fill="none" strokeLinecap="round" opacity={0.75}>
		{[0, 1, 2, 3].map((i) => {
			const x = ((s * (60 + i * 12) + i * 260) % 1500) - 200;
			const y = 520 + i * 60 + Math.sin(s * 1.3 + i) * 20;
			const asa = 8 + Math.sin(s * 9 + i * 2) * 8;
			return <path key={i} d={`M${x - 18},${y - asa} Q${x - 9},${y - 2} ${x},${y} Q${x + 9},${y - 2} ${x + 18},${y - asa}`} />;
		})}
	</g>
);
// Espuma das ondas quebrando (traços brancos que nascem e somem).
const Espuma: React.FC<{s: number; y: number; esp?: number}> = ({s, y, esp = 3}) => (
	<g stroke="#e6f2f6" strokeLinecap="round" strokeWidth={esp}>
		{Array.from({length: 14}).map((_, i) => {
			const f = ((s * 0.5 + i * 0.37) % 1 + 1) % 1;
			const x = ((i * 97) % 1200) - 60 + f * 40;
			return <line key={i} x1={x} y1={y + (i % 4) * 22} x2={x + 30 + f * 50} y2={y + (i % 4) * 22} opacity={Math.sin(f * Math.PI) * 0.55} />;
		})}
	</g>
);

// ---------------------------------------------------------------- 2 · cozinha da vila, 14/03/1987, tempestade e apagão
const Calendario: React.FC<{s: number; T: Record<string, number>}> = ({s, T}) => {
	const circ = L((s - T.catorze) / 0.45);
	const ano = entra(s, T.oitenta, 0.3);
	const vento = Math.sin(s * 2.4) * 2;
	return (
		<g transform={`translate(330 640) rotate(${vento})`}>
			<circle cx={0} cy={-210} r={6} fill="#2a2a2a" />
			<rect x={-150} y={-200} width={300} height={400} rx={4} fill="#efe8d6" />
			<rect x={-150} y={-200} width={300} height={400} rx={4} fill="url(#somB)" />
			<rect x={-150} y={-200} width={300} height={78} fill="#b5332b" />
			<text x={0} y={-150} textAnchor="middle" fontFamily={poppins} fontWeight={800} fontSize={34} fill="#fff" letterSpacing={4}>
				MARÇO
			</text>
			<text x={0} y={-129} textAnchor="middle" fontFamily={poppins} fontWeight={700} fontSize={18} fill="#fff" letterSpacing={6} opacity={0.6 + 0.4 * ano}>
				1987
			</text>
			{ano > 0 && <rect x={-40} y={-146} width={80} height={24} rx={6} fill="none" stroke="#ffe08a" strokeWidth={3} opacity={ano} />}
			{Array.from({length: 31}).map((_, i) => {
				const col = (i + 0) % 7;
				const lin = Math.floor((i + 0) / 7);
				const x = -125 + col * 41.5;
				const y = -90 + lin * 46;
				const dia = i + 1;
				return (
					<text key={i} x={x} y={y} textAnchor="middle" fontFamily={poppins} fontWeight={dia === 14 ? 900 : 600} fontSize={dia === 14 ? 28 : 22} fill={col === 0 ? '#b5332b' : '#2a2a2a'}>
						{dia}
					</text>
				);
			})}
			{/* 14 circulado à caneta */}
			<path
				d="M-62,-6 C-40,-14 -18,0 -22,18 C-26,34 -60,36 -78,24 C-96,10 -84,-12 -58,-14"
				transform="translate(46 -20)"
				fill="none"
				stroke={VERM}
				strokeWidth={4.5}
				strokeLinecap="round"
				strokeDasharray={200}
				strokeDashoffset={200 * (1 - circ)}
			/>
			<text x={110} y={186} textAnchor="end" fontFamily={poppins} fontWeight={600} fontSize={16} fill="#6a6a6a">
				Armazém do Porto
			</text>
		</g>
	);
};

export const PCozinha: React.FC<PlanoProps> = ({s, T}) => {
	const a = T.ate;
	// câmera: calendário → relógio (em "onze e quarenta e sete") → rádio-relógio (em "onze minutos")
	const k1 = eio((s - (T.relogio - 0.5)) / 0.9);
	const k2 = eio((s - (T.minutos - 0.55)) / 0.7);
	const drift = (s - a) * 14;
	const cam = somaCam(
		{
			x: lerp(lerp(-210, 230, k1) + drift, -45 + (s - T.minutos) * 10, k2),
			y: lerp(lerp(-320, -470, k1), 190, k2),
			z: lerp(lerp(1.45 + (s - a) * 0.03, 1.55, k1), 1.3 + L((s - T.minutos) / 2.2) * 0.45, k2),
		},
		mao(s, 1.2),
	);
	const apagou = s >= T.luzApaga;
	const voltando = s >= T.ate2 - 0.05;
	// lâmpada pisca antes de apagar
	let luz = apagou ? 0 : 1;
	if (s > T.luzApaga - 0.32 && s < T.luzApaga) luz = Math.sin(s * 95) > 0 ? 1 : 0.15;
	if (voltando) luz = 1;
	const raios = relampago(s, [6.9, 8.6, 11.75, 12.4, 12.95, 13.38, 13.9]);
	const ilum = Math.max(luz, raios * 0.85);
	// relógio: 23:46 que vira 23:47 em "sete"
	const min = s < T.sete ? 46 : 47;
	const tremeRel = s > T.sete && s < T.sete + 0.3 ? Math.sin(s * 80) * 3 : 0;
	// contagem 11:00 → 00:00
	const kc = L((s - T.minutos) / (T.ate2 - T.minutos - 0.15));
	const resto = Math.max(0, 660 * (1 - kc));
	const cont = `${String(Math.floor(resto / 60)).padStart(2, '0')}:${String(Math.floor(resto % 60)).padStart(2, '0')}`;
	const balanco = Math.sin(s * 1.7) * 6;
	return (
		<Rot r={cam.r ?? 0}>
			<Camada cam={cam} p={1}>
				{/* parede pintada + azulejos */}
				<rect x={-400} y={-200} width={W + 800} height={H + 400} fill="#2f5a55" />
				<rect x={-400} y={880} width={W + 800} height={700} fill="#d9d2bf" />
				{Array.from({length: 18}).map((_, i) => (
					<line key={i} x1={-400 + i * 100} y1={880} x2={-400 + i * 100} y2={1580} stroke="#a9a28e" strokeWidth={2} />
				))}
				{Array.from({length: 7}).map((_, i) => (
					<line key={i} x1={-400} y1={880 + i * 100} x2={W + 400} y2={880 + i * 100} stroke="#a9a28e" strokeWidth={2} />
				))}
				<rect x={-400} y={866} width={W + 800} height={18} fill="#6b4a2e" />
				{/* janela com a tempestade lá fora */}
				<g transform="translate(-260 220)">
					<rect x={-10} y={-10} width={380} height={560} fill="#4a3424" />
					<svg x={0} y={0} width={360} height={540} viewBox="0 0 360 540" overflow="hidden">
						<Ceu tipo="tempestade" h={540} clarao={raios} />
						<Nuvens s={s} y={120} cor="#0e202b" n={5} vel={30} esc={0.6} luz="#bfe0ff" luzOp={raios} />
						<Mar s={s} y0={380} h={540} linhas={8} />
						<Farol x={250} y={400} esc={0.32} luz={luz} />
						<Feixe x={250} y={400 - 575 * 0.32} ang={s * 2.2} comp={500} larg={60} op={luz} />
						<Raio x={90} y={0} h={330} sd={8} op={raios > 0.3 ? raios : 0} />
						<Chuva s={s} n={60} area={[0, 0, 360, 540]} op={0.6} comp={30} />
					</svg>
					{/* gotas escorrendo no vidro */}
					{Array.from({length: 14}).map((_, i) => {
						const y = ((s * (40 + (i % 5) * 18) + i * 77) % 560) - 10;
						return <circle key={i} cx={20 + ((i * 53) % 330)} cy={y} r={3 + (i % 3)} fill="#cfe6f0" opacity={0.35} />;
					})}
					<line x1={180} y1={0} x2={180} y2={540} stroke="#4a3424" strokeWidth={14} />
					<line x1={0} y1={270} x2={360} y2={270} stroke="#4a3424" strokeWidth={14} />
					{/* cortina ao vento */}
					<path d={`M-20,-20 L80,-20 Q${70 + balanco * 3},260 ${40 + balanco * 4},560 L-20,560 Z`} fill="#c7a46a" opacity={0.92} />
					<path d={`M-20,-20 L80,-20 Q${70 + balanco * 3},260 ${40 + balanco * 4},560 L-20,560 Z`} fill="url(#somD)" />
				</g>
				<Calendario s={s} T={T} />
				{/* relógio de parede */}
				<g transform={`translate(${770 + tremeRel} 490)`}>
					<rect x={-12} y={130} width={24} height={150} fill="#5a3a22" />
					<circle cx={0} cy={290 + 0} r={22} fill="#c9a548" transform={`rotate(${Math.sin(s * 3.6) * 14} 0 130)`} />
					<line x1={0} y1={140} x2={0} y2={270} stroke="#7a5a32" strokeWidth={3} transform={`rotate(${Math.sin(s * 3.6) * 14} 0 130)`} />
					<Relogio cx={0} cy={0} r={135} hora={11} minuto={min} numeros aro="#5a3a22" />
					<g opacity={entra(s, T.sete, 0.15) * vis(s, T.sete, T.luzApaga + 0.1, 0.1)}>
						<rect x={-70} y={170} width={140} height={46} rx={6} fill="#14181e" opacity={0.85} />
						<text x={0} y={205} textAnchor="middle" fontFamily={spaceMono} fontWeight={700} fontSize={36} fill={AMBAR}>
							23:47
						</text>
					</g>
				</g>
				{/* prateleira com panelas */}
				<rect x={560} y={770} width={420} height={14} fill="#5a3a22" />
				{[600, 690, 800, 900].map((x, i) => (
					<g key={i}>
						<rect x={x} y={710 - i * 6} width={60 + i * 6} height={60 + i * 6} rx={10} fill={['#b5332b', '#c9c1ad', '#6b8a9a', '#d8b04a'][i]} />
						<rect x={x} y={710 - i * 6} width={60 + i * 6} height={60 + i * 6} rx={10} fill="url(#somD)" />
					</g>
				))}
				{/* lâmpada pendurada que balança */}
				<g transform={`rotate(${balanco * 0.6} 380 -200)`}>
					<line x1={380} y1={-200} x2={380} y2={190} stroke="#222" strokeWidth={3} />
					<path d="M350,190 L410,190 L430,230 L330,230 Z" fill="#2c3a3a" />
					<circle cx={380} cy={246} r={18} fill={luz > 0.5 ? '#fff2c8' : '#3a3a3a'} />
					<circle cx={380} cy={246} r={260} fill="url(#glowAmbar)" opacity={0.5 * luz} />
				</g>
				{/* mesa com rádio-relógio, xícara e lamparina apagada */}
				<rect x={-200} y={1180} width={1400} height={40} fill="#6b4a2e" />
				<rect x={-200} y={1220} width={1400} height={400} fill="#4a3220" />
				<g transform="translate(540 1150)">
					<rect x={-190} y={-110} width={380} height={140} rx={18} fill="#2a2420" />
					<rect x={-190} y={-110} width={380} height={140} rx={18} fill="url(#somB)" />
					<rect x={-160} y={-90} width={230} height={96} rx={8} fill="#100606" />
					{Array.from({length: 6}).map((_, i) => (
						<line key={i} x1={95} y1={-80 + i * 16} x2={165} y2={-80 + i * 16} stroke="#4a403a" strokeWidth={5} strokeLinecap="round" />
					))}
					<Digital x={-45} y={-20} texto={s < T.minutos ? `23:${String(min).padStart(2, '0')}` : cont} size={74} op={s < T.luzApaga ? 0.85 : 1} />
				</g>
				<g transform="translate(180 1180)">
					<path d="M-30,0 L-24,-50 L24,-50 L30,0 Z" fill="#e8e2d2" />
					<path d="M24,-40 q22,4 18,22 q-4,10 -20,6" fill="none" stroke="#e8e2d2" strokeWidth={6} />
					{luz > 0.5 && <Fumaca x={0} y={-60} s={s} sd={2} cor="#e8e2d2" op={0.25} />}
				</g>
				<Chuva s={s} n={0} />
			</Camada>
			{/* escuridão do apagão: só o relâmpago ilumina */}
			<rect x={0} y={0} width={W} height={H} fill="#020a16" opacity={0.78 * (1 - ilum)} />
			{/* no escuro, a luz azul fria da janela e o vermelho do LED desenham a cozinha */}
			{apagou && !voltando && <rect x={0} y={0} width={W} height={H} fill="#1a3a5a" opacity={0.12 + raios * 0.2} />}
			{/* brilho do LED vermelho por cima da escuridão */}
			{apagou && !voltando && (
				<g opacity={vis(s, T.minutos - 0.1, T.ate2, 0.1)}>
					<circle cx={(495 - 540 - cam.x) * cam.z + 540} cy={(1110 - 960 - cam.y) * cam.z + 960} r={320} fill="url(#glowVerm)" opacity={0.35 + 0.1 * Math.sin(s * 9)} />
					<Digital x={(495 - 540 - cam.x) * cam.z + 540} y={(1130 - 960 - cam.y) * cam.z + 960} texto={s < T.minutos ? '23:47' : cont} size={74 * cam.z} />
					<Txt x={W / 2} y={H / 2 + 330} size={44} font={poppins} weight={800} fill="#ff8a80" ls={10} op={entra(s, T.minutos + 0.3, 0.2)}>
						SEM LUZ NA ILHA
					</Txt>
				</g>
			)}
			{raios > 0.05 && <rect width={W} height={H} fill="#bfe0ff" opacity={raios * 0.18} />}
			<g opacity={pop(s, 0, 0) * 0} />
		</Rot>
	);
};

export {Rot};
