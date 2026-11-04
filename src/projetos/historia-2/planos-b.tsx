// historia-2 · planos 3 e 4: a luz volta (farol), sala da lente com Anselmo que some, porta trancada por dentro,
// e a rua da vila com todos os relógios parando às 23:47.
import React from 'react';
import {AMBAR, Camada, H, L, PlanoProps, VERM, W, eio, entra, lerp, mao, pop, rnd, somaCam, vis, Txt} from './util';
import {Casa, CORES_CASA, Ceu, Chuva, Farol, Feixe, Fumaca, Igreja, Mar, Nevoa, Nuvens, Poeira, Raio, Relogio, relampago} from './cenario';
import {Pessoa} from './personagens';
import {Rot} from './planos-a';
import {poppins} from '../../motor/tema';

// ---------------------------------------------------------------- 3a · a luz volta: farol visto de baixo
export const PVolta: React.FC<PlanoProps> = ({s, T}) => {
	const a = T.quando;
	const k = L((s - a) / 1.0);
	const cam = somaCam({x: lerp(-30, 30, k), y: lerp(140, -80, eio(k)), z: 1.05 + 0.1 * k}, mao(s, 1.3));
	// acende piscando em "voltou"
	const luz = s < T.voltou ? (Math.sin(s * 70) > 0.3 ? 0.9 : 0.1) : 1;
	const raios = relampago(s, [a + 0.05]);
	return (
		<Rot r={cam.r ?? 0}>
			<Camada cam={cam} p={0.1}>
				<Ceu tipo="tempestade" clarao={raios} />
				<Nuvens s={s} y={300} cor="#0e202b" n={7} vel={40} luz="#bfe0ff" luzOp={raios} />
			</Camada>
			<Camada cam={cam} p={0.5}>
				<Farol x={600} y={1560} esc={1.55} luz={luz} clarao={raios} />
				<Feixe x={600} y={1560 - 575 * 1.55} ang={s * 2.6 + 0.4} comp={1500} larg={220} op={luz} />
				<circle cx={600} cy={1560 - 575 * 1.55} r={500} fill="url(#glowAmbar)" opacity={0.5 * luz} />
			</Camada>
			<Camada cam={cam} p={0.8}>
				<Chuva s={s} n={150} op={0.55} ang={0.25} />
			</Camada>
			<Camada cam={cam} p={1.3} filtro="bl1">
				<Casa x={160} y={1900} esc={1.6} cor={CORES_CASA[1]} s={s} i={7} />
				<Casa x={980} y={1960} esc={1.8} cor={CORES_CASA[3]} s={s} i={8} />
			</Camada>
			<Camada cam={cam} p={1.6}>
				<Chuva s={s} n={40} op={0.4} ang={0.25} esp={4} comp={90} sd={9} vel={2600} />
			</Camada>
		</Rot>
	);
};

// ---------------------------------------------------------------- lente de Fresnel
const Lente: React.FC<{x: number; y: number; esc: number; s: number; luz: number}> = ({x, y, esc, s, luz}) => {
	const gira = Math.sin(s * 0.9) * 0.5;
	return (
		<g transform={`translate(${x} ${y}) scale(${esc})`}>
			<circle r={420} fill="url(#glowAmbar)" opacity={0.55 * luz} />
			{/* armação de latão */}
			<rect x={-190} y={-300} width={380} height={600} rx={24} fill="#6e5426" />
			<rect x={-176} y={-286} width={352} height={572} rx={18} fill="#2b2a24" />
			{/* anéis prismáticos superiores e inferiores */}
			{Array.from({length: 7}).map((_, i) => {
				const yy = -276 + i * 26;
				return (
					<g key={i}>
						<rect x={-170} y={yy} width={340} height={20} rx={8} fill="#cfe7ea" opacity={0.28 + 0.12 * Math.sin(s * 3 + i + gira)} />
						<rect x={-170} y={yy} width={340} height={5} rx={2} fill="#fff" opacity={0.5} />
						<rect x={-170} y={-yy - 20} width={340} height={20} rx={8} fill="#cfe7ea" opacity={0.28 + 0.12 * Math.sin(s * 3 - i + gira)} />
						<rect x={-170} y={-yy - 6} width={340} height={5} rx={2} fill="#fff" opacity={0.4} />
					</g>
				);
			})}
			{/* "olho de boi" central com anéis concêntricos */}
			<circle r={100} fill="#f4e2b0" opacity={0.5 + 0.5 * luz} />
			{[90, 72, 54, 36, 18].map((r, i) => (
				<circle key={r} r={r} fill="none" stroke="#fff6dc" strokeWidth={5} opacity={0.4 + 0.1 * i} />
			))}
			<circle r={20} fill="#fff" opacity={0.85 * luz} />
			<circle r={140} fill="url(#glowBranco)" opacity={0.6 * luz} />
			{[-1, 1].map((d) => (
				<line key={d} x1={d * 176} y1={-286} x2={d * 176} y2={286} stroke="#8a6a30" strokeWidth={8} />
			))}
			<rect x={-176} y={-110} width={352} height={6} fill="#8a6a30" />
			<rect x={-176} y={104} width={352} height={6} fill="#8a6a30" />
			{/* reflexo móvel */}
			<rect x={-176 + ((s * 120) % 352)} y={-286} width={30} height={572} fill="#fff" opacity={0.12} />
		</g>
	);
};

// ---------------------------------------------------------------- 3b · sala da lente com Anselmo
export const PLente: React.FC<PlanoProps> = ({s, T}) => {
	const a = T.faroleiro;
	const k = L((s - a) / (T.sala - a));
	const cam = somaCam({x: lerp(-170, -110, eio(k)), y: lerp(110, 50, k), z: lerp(1.4, 1.55, eio(k))}, mao(s, 1));
	const some = L((s - T.sumido) / 0.55);
	const balanco = s > T.sumido ? Math.sin((s - T.sumido) * 5) * 16 * Math.exp(-(s - T.sumido) * 0.8) : Math.sin(s * 1.3) * 2;
	const raios = relampago(s, [a + 1.6]);
	const chama = 0.85 + 0.15 * Math.sin(s * 23) * Math.sin(s * 7);
	return (
		<Rot r={cam.r ?? 0}>
			<Camada cam={cam} p={0.3}>
				{/* vidros da lanterna com a noite e a chuva lá fora */}
				<rect x={-300} y={-300} width={W + 600} height={H + 600} fill="#08151d" />
				<Ceu tipo="tempestade" h={1100} clarao={raios} />
				<Mar s={s} y0={1000} linhas={8} />
				<Raio x={180} y={100} h={600} sd={12} op={raios > 0.3 ? raios : 0} />
			</Camada>
			<Camada cam={cam} p={0.55}>
				<Chuva s={s} n={90} op={0.45} ang={0.3} />
				{/* caixilhos da sala da lente */}
				{[-120, 260, 640, 1020].map((x) => (
					<rect key={x} x={x} y={-200} width={26} height={1500} fill="#1c2329" />
				))}
				<rect x={-300} y={170} width={W + 600} height={22} fill="#1c2329" />
				<rect x={-300} y={1120} width={W + 600} height={600} fill="#1a1e22" />
			</Camada>
			<Camada cam={cam} p={0.75}>
				<Lente x={720} y={760} esc={1.0} s={s} luz={1} />
				{/* feixe saindo da lente, girando */}
				<polygon points={`720,760 ${720 + Math.cos(s * 2) * 900},${560} ${720 + Math.cos(s * 2) * 900},${960}`} fill="url(#feixe)" opacity={0.25 * Math.abs(Math.cos(s * 2))} filter="url(#bl2)" />
			</Camada>
			<Camada cam={cam} p={1}>
				{/* chão de ferro e mesa */}
				<rect x={-300} y={1240} width={W + 600} height={500} fill="#20262b" />
				{/* Anselmo, de capa amarela, de lado escrevendo no diário */}
				<g opacity={1 - some}>
					<Pessoa quem="anselmo" x={330} y={1300} esc={1.18} t={s} pose="segurar" vira={0.55} ox={0.6} oy={0.8} expr="foco" rim={AMBAR} rimDx={5} sombra={0.4} />
				</g>
				{/* dissolve em partículas de luz */}
				{some > 0 && some < 1 &&
					Array.from({length: 60}).map((_, i) => {
						const px = 330 + (rnd(i, 5) - 0.5) * 140 + (rnd(i, 6) - 0.3) * 260 * some;
						const py = 1300 - rnd(i, 7) * 500 - some * 220 * rnd(i, 8);
						return <circle key={i} cx={px} cy={py} r={2 + rnd(i, 9) * 4} fill={i % 3 ? AMBAR : '#fff6dc'} opacity={(1 - some) * (0.6 + 0.4 * rnd(i, 10))} />;
					})}
				{/* cadeira (fica vazia) */}
				<g transform={`translate(${200} 1300)`}>
					<rect x={-60} y={-170} width={14} height={170} fill="#4a3424" />
					<rect x={-60} y={-90} width={120} height={14} fill="#5a4030" />
					<rect x={46} y={-90} width={14} height={90} fill="#4a3424" />
				</g>
				{/* mesa */}
				<rect x={-60} y={1090} width={620} height={26} fill="#6b4a2e" />
				<rect x={-60} y={1116} width={620} height={220} fill="#3e2a1c" />
				<rect x={-60} y={1116} width={620} height={220} fill="url(#somB)" />
				{/* diário aberto */}
				<g transform="translate(380 1080)">
					<path d="M-110,0 L0,-8 L110,0 L110,10 L-110,10 Z" fill="#2a1e14" />
					<path d="M-104,0 Q-50,-30 0,-10 L0,2 Q-50,-18 -104,6 Z" fill="#efe6cf" />
					<path d={`M104,0 Q50,-30 0,-10 L0,2 Q50,-18 104,6 Z`} fill="#e6dcc0" />
					{s > T.sumido && <path d={`M0,-10 Q${40 * Math.cos((s - T.sumido) * 6)},${-40 - 10 * Math.sin(s * 5)} ${90 * Math.cos((s - T.sumido) * 4)},-6`} fill="#f4ecd8" opacity={0.85} />}
					{[0, 1, 2].map((i) => (
						<line key={i} x1={-90} y1={-6 - i * 5} x2={-20} y2={-10 - i * 5} stroke="#3a3a5a" strokeWidth={1.4} opacity={0.6} />
					))}
				</g>
				{/* lampião balançando */}
				<g transform={`rotate(${balanco} 120 960)`}>
					<line x1={120} y1={900} x2={120} y2={960} stroke="#222" strokeWidth={3} />
					<rect x={92} y={960} width={56} height={14} fill="#3a2c1e" />
					<path d="M96,974 L144,974 L150,1050 L90,1050 Z" fill="#ffe3a0" opacity={0.3} />
					<ellipse cx={120} cy={1022} rx={9 * chama} ry={20 * chama} fill="#ffcf66" />
					<ellipse cx={120} cy={1028} rx={4} ry={10} fill="#fff6dc" />
					<rect x={86} y={1050} width={68} height={14} fill="#3a2c1e" />
					<circle cx={120} cy={1020} r={340} fill="url(#glowAmbar)" opacity={0.45 * chama} />
				</g>
			</Camada>
			<Camada cam={cam} p={1.5} filtro="bl2">
				<rect x={900} y={-200} width={70} height={2400} fill="#0b0f12" />
				<Poeira s={s} area={[-100, 300, 1200, 1100]} n={30} op={0.8} />
			</Camada>
		</Rot>
	);
};

// ---------------------------------------------------------------- 3c · porta da sala da lente, vista por dentro
export const PPorta: React.FC<PlanoProps> = ({s, T}) => {
	const a = T.sala;
	const k = L((s - a) / (T.todos - a));
	// começa aberta no corredor, empurra até o ferrolho em "trancada", e fecha na chave em "dentro"
	const kz = eio((s - (T.trancada - 0.5)) / 0.7);
	const kd = eio((s - (T.dentro - 0.2)) / 0.6);
	const cam = somaCam({x: lerp(0, 150, kz) - kd * 300, y: lerp(0, -170, kz) + kd * 260, z: lerp(1.0 + 0.06 * k, 1.75, kz) + kd * 0.2}, mao(s, 1.1));
	const fecha = eio((s - (T.trancada - 0.15)) / 0.3);
	const gira = eio((s - T.dentro) / 0.35);
	const treme = s > T.trancada && s < T.trancada + 0.25 ? Math.sin(s * 90) * 4 : 0;
	const varre = (s * 0.9) % 2;
	return (
		<Rot r={cam.r ?? 0}>
			<Camada cam={cam} p={1}>
				<rect x={-400} y={-300} width={W + 800} height={H + 600} fill="#1d1813" />
				{/* parede de pedra curva da torre */}
				{Array.from({length: 60}).map((_, i) => (
					<rect key={i} x={-400 + (i % 10) * 200 + (Math.floor(i / 10) % 2) * 100} y={-300 + Math.floor(i / 10) * 140} width={190} height={130} rx={10} fill="#2b241c" opacity={0.6 + rnd(i, 3) * 0.4} />
				))}
				{/* porta de madeira */}
				<g transform={`translate(${540 + treme} 960)`}>
					<rect x={-250} y={-520} width={500} height={1000} fill="#140f0a" />
					<rect x={-230} y={-500} width={460} height={980} fill="#5a3a22" />
					{[-150, -50, 50, 150].map((x) => (
						<line key={x} x1={x} y1={-500} x2={x} y2={480} stroke="#3e2816" strokeWidth={5} />
					))}
					<rect x={-230} y={-300} width={460} height={30} fill="#3e2816" />
					<rect x={-230} y={240} width={460} height={30} fill="#3e2816" />
					<rect x={-230} y={-500} width={460} height={980} fill="url(#somD)" />
					{/* ferrolho: corre da esquerda para dentro do batente */}
					<g transform="translate(120 -110)">
						<rect x={-80} y={-26} width={150} height={52} rx={6} fill="#3a3a3a" />
						<rect x={-60 + fecha * 90} y={-12} width={110} height={24} rx={6} fill="#a8a8a0" />
						<rect x={-60 + fecha * 90} y={-12} width={110} height={8} rx={4} fill="#e8e8e0" opacity={0.6} />
						<rect x={-20 + fecha * 90} y={-40 + fecha * 28} width={18} height={40} rx={6} fill="#a8a8a0" />
					</g>
					<rect x={228} y={-150} width={40} height={80} fill="#2a2a2a" />
					{/* fechadura com a chave do lado de dentro */}
					<g transform="translate(150 60)">
						<circle r={34} fill="#a88a3a" />
						<circle r={34} fill="url(#somD)" />
						<g transform={`rotate(${gira * 90})`}>
							<rect x={-5} y={-4} width={10} height={70} fill="#c9a548" />
							<circle cx={0} cy={80} r={22} fill="none" stroke="#c9a548" strokeWidth={9} />
							<rect x={4} y={-20} width={20} height={10} fill="#c9a548" />
						</g>
					</g>
				</g>
				{/* luz do farol varrendo a porta pela fresta */}
				<rect x={-200 + varre * 900} y={-300} width={160} height={H + 600} fill="#ffe3a0" opacity={0.12} filter="url(#bl3)" />
			</Camada>
			<Camada cam={cam} p={1.4} filtro="bl2">
				<Poeira s={s} area={[0, 200, 1080, 1300]} n={26} op={0.7} />
			</Camada>
			{/* etiqueta de selo policial pendurada que entra em "por dentro" */}
			<g opacity={entra(s, T.dentro + 0.1, 0.25)} transform={`translate(540 ${330 + Math.sin(s * 2) * 6}) rotate(${-3 + Math.sin(s * 1.6) * 2})`}>
				<rect x={-300} y={-60} width={600} height={110} rx={10} fill="#e8dcc0" />
				<rect x={-300} y={-60} width={600} height={110} rx={10} fill="none" stroke={VERM} strokeWidth={6} />
				<Txt x={0} y={20} size={66} fill={VERM} ls={4}>
					TRANCADA POR DENTRO
				</Txt>
			</g>
		</Rot>
	);
};

// ---------------------------------------------------------------- 4 · rua da vila: todos os relógios param às 23:47
const RelogioQueGira: React.FC<{x: number; y: number; r: number; s: number; t0: number; para: number; i: number}> = ({x, y, r, s, t0, para, i}) => {
	const parou = s >= para;
	const giro = parou ? 0 : (para - s) * (420 + i * 60);
	const minuto = parou ? 47 : (47 - giro / 6 + 600) % 60;
	const hora = parou ? 11 : 11 - Math.floor(giro / 360);
	const tremor = parou ? Math.max(0, 1 - (s - para) * 5) * Math.sin(s * 80) * 5 : 0;
	return (
		<g transform={`translate(${tremor} 0)`}>
			{parou && <circle cx={x} cy={y} r={r * 1.7} fill="url(#glowVerm)" opacity={0.6 * Math.max(0.3, 1 - (s - para) * 1.5)} />}
			<Relogio cx={x} cy={y} r={r * 1.25} hora={hora} minuto={minuto} numeros parado={parou ? 1 : 0} aro={parou ? '#7a1a14' : '#5a3a22'} />
		</g>
	);
};

export const PRelogios: React.FC<PlanoProps> = ({s, T}) => {
	const a = T.todos;
	const k = L((s - a) / (T.ninguem - a));
	const cam = somaCam({x: lerp(-260, 820, eio(k)), y: lerp(-80, -40, k), z: lerp(1.05, 0.98, k)}, mao(s, 1));
	const para = (i: number) => T.pararam + i * 0.12;
	const vermelho = L((s - T.pararam) / 0.3);
	return (
		<Rot r={cam.r ?? 0}>
			<Camada cam={cam} p={0.15}>
				<Ceu tipo="noite" />
				<Nuvens s={s} y={300} cor="#102836" n={7} vel={25} />
			</Camada>
			<Camada cam={cam} p={0.35}>
				<Farol x={1650} y={1000} esc={0.55} luz={1} />
				<Feixe x={1650} y={1000 - 575 * 0.55} ang={s * 2} comp={900} larg={90} />
			</Camada>
			<Camada cam={cam} p={1}>
				{/* igreja com relógio na torre */}
				<Igreja x={260} y={1250} esc={1.25} s={s} relogio={<RelogioQueGira x={0} y={0} r={46} s={s} t0={a} para={para(0)} i={0} />} />
				{/* bar com relógio na fachada */}
				<g>
					<Casa x={900} y={1250} esc={2.2} cor={CORES_CASA[2]} s={s} i={11} larg={220} alt={180} />
					<rect x={700} y={880} width={400} height={66} fill="#2a1e14" />
					<text x={900} y={928} textAnchor="middle" fontFamily={poppins} fontWeight={900} fontSize={44} fill="#f0d27a" letterSpacing={6}>
						BAR DO PORTO
					</text>
					<RelogioQueGira x={900} y={800} r={56} s={s} t0={a} para={para(1)} i={1} />
				</g>
				{/* mercearia com relógio pendurado */}
				<g>
					<Casa x={1480} y={1250} esc={2.0} cor={CORES_CASA[3]} s={s} i={12} larg={220} alt={180} />
					<line x1={1480} y1={760} x2={1480} y2={790} stroke="#222" strokeWidth={6} />
					<RelogioQueGira x={1480} y={850} r={60} s={s} t0={a} para={para(2)} i={2} />
					<text x={1480} y={1000} textAnchor="middle" fontFamily={poppins} fontWeight={900} fontSize={36} fill="#2a1e14" letterSpacing={4}>
						MERCEARIA
					</text>
				</g>
				{/* rua de paralelepípedo molhada */}
				<rect x={-500} y={1250} width={3000} height={700} fill="#14202a" />
				{Array.from({length: 40}).map((_, i) => (
					<ellipse key={i} cx={-400 + (i % 20) * 140 + (Math.floor(i / 20) % 2) * 70} cy={1290 + Math.floor(i / 20) * 50} rx={60} ry={14} fill="#1e2e3a" />
				))}
				{/* poste com lampião */}
				{[580, 1200].map((x, i) => (
					<g key={x}>
						<rect x={x - 6} y={760} width={12} height={490} fill="#1a1a1a" />
						<rect x={x - 20} y={730} width={40} height={40} fill="#ffe3a0" opacity={0.85} />
						<circle cx={x} cy={750} r={220} fill="url(#glowAmbar)" opacity={0.45 + 0.05 * Math.sin(s * 9 + i)} />
					</g>
				))}
			</Camada>
			<Camada cam={cam} p={1}>
				<Nevoa s={s} y={1180} op={0.2} vel={30} />
			</Camada>
			<Camada cam={cam} p={1.6} filtro="bl2">
				<rect x={300} y={-200} width={60} height={2400} fill="#06090c" />
				<rect x={1500} y={-200} width={60} height={2400} fill="#06090c" />
			</Camada>
			{/* letreiro 23:47 aceso em vermelho quando param */}
			<rect width={W} height={H} fill={VERM} opacity={0.12 * vermelho * (0.7 + 0.3 * Math.sin(s * 8))} />
			<g opacity={entra(s, T.mesma, 0.2)}>
				<Txt x={540} y={320} size={150} fill={VERM} glow={VERM} ls={6} sc={0.9 + 0.1 * pop(s, T.mesma, 0.3)}>
					23:47
				</Txt>
			</g>
		</Rot>
	);
};

export {Fumaca};
