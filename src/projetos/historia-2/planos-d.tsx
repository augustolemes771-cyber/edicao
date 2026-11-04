// historia-2 · planos 6c/d, 7 e 8: a gaveta com a fita, o play, a voz do avô (Lia reage), a voz de mulher (glitch rosa)
// e o CTA com Lia na janela olhando o farol.
import React from 'react';
import {AMBAR, BRANCO, Camada, H, L, Palavra, PlanoProps, ROSA, VERM, W, eb, eio, entra, eo, lerp, mao, pop, rnd, somaCam, vis, Txt} from './util';
import {Ceu, Chuva, Farol, Feixe, Mar, Nuvens, Poeira} from './cenario';
import {Busto, Mao, Pessoa} from './personagens';
import {Rot} from './planos-a';
import {poppins, spaceMono} from '../../motor/tema';

// Palavras que entram uma a uma no tempo da fala (do código anterior).
const Frase: React.FC<{s: number; palavras: Palavra[]; y: number; porLinha: number; size: number; cores?: Record<string, string>; fim: number; lh?: number; fill?: string}> = ({s, palavras, y, porLinha, size, cores = {}, fim, lh = 1.12, fill = BRANCO}) => {
	const linhas: Palavra[][] = [];
	palavras.forEach((p, i) => {
		if (i % porLinha === 0) linhas.push([]);
		linhas[linhas.length - 1].push(p);
	});
	const sai = L((fim - s) / 0.2);
	return (
		<g opacity={sai}>
			{linhas.map((ln, li) => {
				const larg = ln.map((p) => p.txt.length * size * 0.5 + size * 0.3);
				const total = larg.reduce((a, b) => a + b, 0);
				let x = W / 2 - total / 2;
				return (
					<g key={li}>
						{ln.map((p, wi) => {
							const w = larg[wi];
							const cx = x + w / 2;
							x += w;
							const k = pop(s, p.t, 0.3);
							const chave = p.txt.replace(/[^\p{L}]/gu, '').toLowerCase();
							return (
								<Txt key={wi} x={cx} y={y + li * size * lh + (1 - k) * 22} size={size} fill={cores[chave] ?? fill} op={s >= p.t ? L(k * 1.6) : 0} sc={0.75 + 0.25 * k} glow={cores[chave] ?? '#000'} stroke="#05080c" sw={5}>
									{p.txt}
								</Txt>
							);
						})}
					</g>
				);
			})}
		</g>
	);
};

// ---------------------------------------------------------------- fita e toca-fitas
export const Fita: React.FC<{x: number; y: number; esc: number; rot?: number; giro?: number}> = ({x, y, esc, rot = 0, giro = 0}) => (
	<g transform={`translate(${x} ${y}) rotate(${rot}) scale(${esc})`}>
		<rect x={-160} y={-100} width={320} height={200} rx={14} fill="#1e2228" />
		<rect x={-140} y={-84} width={280} height={120} rx={8} fill="#e8dcc0" />
		<rect x={-140} y={-84} width={280} height={30} rx={8} fill="#b5332b" />
		<text x={0} y={-62} textAnchor="middle" fontFamily={poppins} fontWeight={800} fontSize={20} fill="#fff" letterSpacing={3}>
			ANSELMO · 14/03/87
		</text>
		<rect x={-80} y={-40} width={160} height={52} rx={26} fill="#2a2420" />
		{[-1, 1].map((d) => (
			<g key={d} transform={`translate(${d * 50} -14) rotate(${giro * d})`}>
				<circle r={20} fill="#efe6cf" />
				{[0, 60, 120, 180, 240, 300].map((r) => (
					<line key={r} x1={0} y1={0} x2={Math.cos((r * Math.PI) / 180) * 16} y2={Math.sin((r * Math.PI) / 180) * 16} stroke="#2a2420" strokeWidth={4} />
				))}
			</g>
		))}
		<polygon points="-100,100 100,100 80,56 -80,56" fill="#14171c" />
		<rect x={-160} y={-100} width={320} height={200} rx={14} fill="url(#brilhoT)" />
	</g>
);

export const TocaFitas: React.FC<{x: number; y: number; esc: number; s: number; play: number; giro: number; mulher?: number; aperta?: number}> = ({x, y, esc, s, play, giro, mulher = 0, aperta = 0}) => {
	const vu = play > 0 ? 0.3 + 0.7 * Math.abs(Math.sin(s * 11) * Math.cos(s * 4.3)) : 0;
	return (
		<g transform={`translate(${x} ${y}) scale(${esc})`}>
			<ellipse cx={0} cy={170} rx={360} ry={30} fill="#000" opacity={0.5} />
			<rect x={-340} y={-160} width={680} height={330} rx={26} fill="#2b2a2e" />
			<rect x={-340} y={-160} width={680} height={330} rx={26} fill="url(#somB)" />
			<rect x={-340} y={-160} width={680} height={330} rx={26} fill="url(#brilhoT)" />
			{/* alto-falante */}
			<circle cx={200} cy={0} r={120} fill="#17161a" />
			{Array.from({length: 7}).map((_, i) => (
				<circle key={i} cx={200} cy={0} r={18 + i * 15} fill="none" stroke="#3a383e" strokeWidth={4} />
			))}
			<circle cx={200} cy={0} r={34 + vu * 6} fill="#26252a" />
			{play > 0 && <circle cx={200} cy={0} r={150} fill={mulher > 0 ? 'url(#glowRosa)' : 'url(#glowAmbar)'} opacity={0.35 * vu} />}
			{/* janela da fita */}
			<rect x={-310} y={-130} width={420} height={190} rx={10} fill="#0e0d10" />
			<Fita x={-100} y={-38} esc={0.6} giro={giro} />
			{/* VU */}
			<rect x={-300} y={78} width={160} height={20} rx={4} fill="#111" />
			<rect x={-298} y={80} width={156 * vu} height={16} rx={3} fill={mulher > 0 ? ROSA : AMBAR} />
			{/* teclas */}
			{['◀◀', '▶', '▶▶', '■'].map((t, i) => {
				const ePlay = i === 1;
				const dy = ePlay ? 10 * aperta + (play > 0 ? 8 : 0) : 0;
				return (
					<g key={t} transform={`translate(${-110 + i * 72} ${118 + dy})`}>
						<rect x={-30} y={-18} width={60} height={42} rx={6} fill={ePlay && play > 0 ? AMBAR : '#c9c4b8'} />
						<rect x={-30} y={-18} width={60} height={42} rx={6} fill="url(#somB)" />
						<text x={0} y={12} textAnchor="middle" fontFamily={poppins} fontWeight={900} fontSize={22} fill="#2a2420">
							{t}
						</text>
					</g>
				);
			})}
			<text x={-300} y={-140} fontFamily={spaceMono} fontWeight={700} fontSize={16} fill="#8a8680" letterSpacing={3}>
				SEMP · STEREO
			</text>
		</g>
	);
};

// Ondas de som saindo do aparelho (anéis que se expandem).
const Ondas: React.FC<{s: number; x: number; y: number; cor: string; op: number; n?: number}> = ({s, x, y, cor, op, n = 4}) => (
	<g opacity={op}>
		{Array.from({length: n}).map((_, i) => {
			const f = ((s * 0.9 + i / n) % 1 + 1) % 1;
			return <circle key={i} cx={x} cy={y} r={60 + f * 520} fill="none" stroke={cor} strokeWidth={6 - f * 4} opacity={(1 - f) * 0.6} />;
		})}
	</g>
);

const Barras: React.FC<{s: number; y: number; mulher: number; op: number}> = ({s, y, mulher, op}) => (
	<g opacity={op} transform={`translate(0 ${y})`}>
		{Array.from({length: 30}).map((_, i) => {
			const x = 160 + i * 26;
			const v = 0.25 + 0.75 * Math.abs(Math.sin(s * 9 + i * 0.8) * Math.cos(s * 5.3 + i * 0.37)) * (0.5 + 0.5 * rnd(i, Math.floor(s * 12)));
			const h = 10 + v * 90;
			const rosa = mulher > 0 && i % 3 === 1;
			return <rect key={i} x={x} y={-h / 2} width={13} height={h} rx={6.5} fill={rosa ? ROSA : AMBAR} opacity={0.9} />;
		})}
	</g>
);

// Quarto da casa da família: parede com papel antigo, janela com o mar, móveis cobertos.
const Quarto: React.FC<{s: number; luzRosa?: number}> = ({s, luzRosa = 0}) => (
	<g>
		<rect x={-400} y={-300} width={W + 800} height={H + 600} fill="#3a3a34" />
		{Array.from({length: 14}).map((_, i) => (
			<rect key={i} x={-400 + i * 140} y={-300} width={60} height={H + 600} fill="#44443c" opacity={0.6} />
		))}
		<rect x={-400} y={1150} width={W + 800} height={800} fill="#2a2018" />
		{/* janela com a manhã lá fora e o feixe de luz com poeira */}
		<rect x={640} y={200} width={360} height={480} fill="#9aa9b0" />
		<rect x={640} y={200} width={360} height={480} fill="#ffe3c0" opacity={0.25} />
		<line x1={820} y1={200} x2={820} y2={680} stroke="#4a3a2a" strokeWidth={14} />
		<line x1={640} y1={440} x2={1000} y2={440} stroke="#4a3a2a" strokeWidth={14} />
		<polygon points="640,680 1000,680 760,1400 200,1400" fill="#ffe3c0" opacity={0.1} />
		{/* móvel coberto por lençol */}
		<path d="M-120,1150 Q-140,820 60,800 Q260,790 300,860 Q330,1000 320,1150 Z" fill="#cfc8b8" />
		<path d="M-120,1150 Q-140,820 60,800 Q260,790 300,860 Q330,1000 320,1150 Z" fill="url(#somD)" />
		<path d="M40,820 Q60,960 30,1150 M180,820 Q200,980 170,1150" stroke="#a9a290" strokeWidth={4} fill="none" />
		<Poeira s={s} area={[200, 600, 800, 800]} n={34} op={0.8} />
		{luzRosa > 0 && <rect x={-400} y={-300} width={W + 800} height={H + 600} fill={ROSA} opacity={luzRosa * 0.25} />}
	</g>
);

// ---------------------------------------------------------------- 6c · a gaveta e a fita cassete
export const PGaveta: React.FC<PlanoProps> = ({s, T}) => {
	const a = T.eAcha;
	const k = L((s - a) / (T.ela - a));
	const kz = eio((s - (T.fita - 0.2)) / 0.6);
	const cam = somaCam({x: lerp(-60, 0, k), y: lerp(60, -60, kz), z: lerp(1.05, 1.3, kz) + 0.05 * k}, mao(s, 1));
	const abre = eo((s - (T.acha - 0.1)) / 0.4);
	const sobe = eb((s - (T.fita - 0.05)) / 0.6);
	return (
		<Rot r={cam.r ?? 0}>
			<Camada cam={cam} p={0.5} filtro="bl1">
				<Quarto s={s} />
			</Camada>
			<Camada cam={cam} p={1}>
				{/* cômoda antiga */}
				<rect x={140} y={780} width={800} height={560} rx={10} fill="#5a3a22" />
				<rect x={140} y={760} width={800} height={30} rx={6} fill="#6b4a2e" />
				<rect x={140} y={780} width={800} height={560} rx={10} fill="url(#somD)" />
				{[1110, 1240].map((y) => (
					<g key={y}>
						<rect x={180} y={y - 100} width={720} height={110} rx={6} fill="#4a2e1a" />
						<circle cx={540} cy={y - 45} r={12} fill="#c9a548" />
					</g>
				))}
				{/* gaveta de cima que abre (vem para a câmera) */}
				<g transform={`translate(540 ${880 + abre * 70}) scale(${1 + abre * 0.12})`}>
					<rect x={-370} y={-60} width={740} height={60 + abre * 90} fill="#2a1a10" />
					<rect x={-360} y={-56} width={720} height={40 + abre * 80} fill="#1a100a" />
					{/* papéis e cartas antigas dentro */}
					{abre > 0.3 && [-220, -60, 120].map((x, i) => <rect key={x} x={x} y={-40} width={140} height={40 + abre * 40} fill="#d9cfb2" transform={`rotate(${(i - 1) * 6} ${x} 0)`} opacity={0.8} />)}
					<rect x={-370} y={abre * 90} width={740} height={110} rx={6} fill="#6b4a2e" />
					<circle cx={0} cy={abre * 90 + 55} r={14} fill="#c9a548" />
				</g>
				{/* a fita sobe na mão de Lia */}
				<g opacity={L(sobe * 3)}>
					<Fita x={540} y={lerp(1000, 640, sobe)} esc={1.15} rot={lerp(10, -5, sobe) + Math.sin(s * 1.8) * 1.5} />
					<Mao x={430} y={lerp(1110, 750, sobe)} esc={1.2} rot={-20} />
					<Mao x={660} y={lerp(1110, 750, sobe)} esc={1.2} rot={18} />
				</g>
			</Camada>
			<Camada cam={cam} p={1.5} filtro="bl2">
				<Poeira s={s} area={[0, 300, 1080, 1000]} n={22} op={0.9} sd={4} />
			</Camada>
		</Rot>
	);
};

// ---------------------------------------------------------------- 6d · ela aperta o play
export const PPlay: React.FC<PlanoProps> = ({s, T}) => {
	const a = T.ela;
	const k = L((s - a) / (T.eAVoz - a));
	const cam = somaCam({x: lerp(-40, 60, k), y: lerp(-30, 40, k), z: lerp(1.1, 1.35, eio(k))}, mao(s, 0.9));
	const desce = eio((s - (T.play - 0.45)) / 0.45);
	const aperta = s > T.play ? L(1 - (s - T.play) / 0.25) : 0;
	const play = s >= T.play ? 1 : 0;
	const giro = play ? (s - T.play) * 260 : 0;
	return (
		<Rot r={cam.r ?? 0}>
			<Camada cam={cam} p={0.5} filtro="bl2">
				<Quarto s={s} />
				<Busto quem="lia" x={300} y={520} esc={2.6} t={s} vira={0.4} ox={0.6} oy={1} expr="foco" />
			</Camada>
			<Camada cam={cam} p={1}>
				<rect x={-400} y={1130} width={W + 800} height={800} fill="#4a3220" />
				<rect x={-400} y={1120} width={W + 800} height={20} fill="#6b4a2e" />
				<TocaFitas x={540} y={960} esc={1.2} s={s} play={play} giro={giro} aperta={aperta} />
				{/* indicador de Lia descendo sobre a tecla PLAY */}
				<Mao x={540 - 110 * 1.2 + 72 * 1.2} y={lerp(540, 1080, desce) + aperta * 10} esc={1.5} rot={172} aponta />
				{play > 0 && <circle cx={540 - 38 * 1.2} cy={1104} r={40 + (s - T.play) * 260} fill="none" stroke={AMBAR} strokeWidth={6} opacity={L(1 - (s - T.play) * 2.5)} />}
			</Camada>
		</Rot>
	);
};

// ---------------------------------------------------------------- 7 · a voz do avô e a voz de mulher
export const PVoz: React.FC<PlanoProps> = ({s, T, frame, dados}) => {
	const q1 = dados.q1 as Palavra[];
	const q2 = dados.q2 as Palavra[];
	const q3 = dados.q3 as Palavra[];
	const mulher = L((s - T.mulher) / 0.2);
	const giro = (s - T.play) * 260 * (1 - 0.7 * mulher * Math.abs(Math.sin(s * 9)));
	const seg = s < T.quem - 0.05 ? 1 : s < T.eAoFundo ? 2 : 3;
	const ini = seg === 1 ? T.eAVoz : seg === 2 ? T.quem - 0.05 : T.eAoFundo;
	const fim = seg === 1 ? T.quem : seg === 2 ? T.eAoFundo : T.deQuem;
	const k = L((s - ini) / (fim - ini));
	const glitch = mulher > 0 && rnd(frame, 41) > 0.55 ? (rnd(frame, 42) - 0.5) * 40 : 0;
	const cam = somaCam({x: seg === 2 ? lerp(-50, 50, k) : lerp(30, -30, k), y: lerp(10, -30, k), z: (seg === 3 ? lerp(1.0, 1.18, eio(k)) : lerp(1.0, 1.12, k)) + mulher * 0.05 * Math.sin(s * 30)}, mao(s, 1 + mulher * 2));
	const expr = mulher > 0.5 ? 'congelado' : s > T.confie ? 'tensa' : 'medo';
	return (
		<Rot r={cam.r ?? 0}>
			<g transform={`translate(${glitch} 0)`}>
				<Camada cam={cam} p={0.4} filtro={seg === 3 ? 'bl2' : 'bl1'}>
					<Quarto s={s} luzRosa={mulher} />
				</Camada>
				{seg === 1 && (
					<g>
						<Camada cam={cam} p={0.8}>
							<circle cx={300} cy={1100} r={600} fill="url(#glowAmbar)" opacity={0.35 + 0.05 * Math.sin(s * 9)} />
							<Busto quem="lia" x={540} y={820} esc={3.4} t={s} vira={-0.25} ox={-0.4} oy={0.9} expr={expr} rim={AMBAR} />
						</Camada>
						<Camada cam={cam} p={1.3}>
							<TocaFitas x={540} y={1180} esc={0.75} s={s} play={1} giro={giro} />
							<Ondas s={s} x={540 + 150} y={1180} cor={AMBAR} op={0.6} />
						</Camada>
					</g>
				)}
				{seg === 2 && (
					<Camada cam={cam} p={1}>
						<rect x={-400} y={1090} width={W + 800} height={800} fill="#4a3220" />
						<Ondas s={s} x={540 + 240} y={880} cor={AMBAR} op={0.7} n={5} />
						<TocaFitas x={540} y={880} esc={1.35} s={s} play={1} giro={giro} />
						<Barras s={s} y={1190} mulher={0} op={0.9} />
					</Camada>
				)}
				{seg === 3 && (
					<g>
						<Camada cam={cam} p={0.9}>
							<circle cx={540} cy={1200} r={700} fill={mulher > 0 ? 'url(#glowRosa)' : 'url(#glowAmbar)'} opacity={0.4} />
							{/* glitch: cópias deslocadas em ciano e rosa */}
							{mulher > 0 && (
								<g opacity={0.5}>
									<g transform={`translate(${-14 - glitch * 0.3} 0)`}>
										<Busto quem="lia" x={540} y={900} esc={4.6} t={s} vira={0.1} expr="congelado" rim="#4ae0ff" resp={0} />
									</g>
								</g>
							)}
							<Busto quem="lia" x={540} y={900} esc={4.6} t={s} vira={mulher > 0 ? 0 : 0.15} ox={mulher > 0 ? 0 : 0.5} oy={mulher > 0 ? 0 : 0.6} expr={expr} rim={mulher > 0 ? ROSA : AMBAR} resp={mulher > 0 ? 0 : 1} />
						</Camada>
						<Camada cam={cam} p={1.3}>
							<Barras s={s} y={1270} mulher={mulher} op={0.9} />
						</Camada>
					</g>
				)}
			</g>
			{/* faixas de glitch horizontais */}
			{mulher > 0 &&
				Array.from({length: 5}).map((_, i) =>
					rnd(frame + i, 43) > 0.6 ? <rect key={i} x={0} y={rnd(frame + i, 44) * 1300} width={W} height={8 + rnd(frame + i, 45) * 30} fill={i % 2 ? ROSA : '#4ae0ff'} opacity={0.25} /> : null,
				)}
			{mulher > 0 && <rect width={W} height={H} fill={ROSA} opacity={0.1 + 0.06 * Math.sin(s * 14)} />}
			{/* falas da fita: legenda de cinema, palavra a palavra */}
			<g opacity={vis(s, T.eAVoz, T.mulher - 0.2, 0.2)}>
				<rect x={330} y={150} width={420} height={52} rx={26} fill="#05080c" opacity={0.6} />
				<circle cx={370} cy={176} r={9} fill={VERM} opacity={0.6 + 0.4 * Math.sin(s * 6)} />
				<Txt x={560} y={190} size={30} fill="#e8dcc0" font={poppins} weight={800} ls={6}>
					FITA · VOZ DO AVÔ
				</Txt>
			</g>
			<Frase s={s} palavras={q1} y={330} porLinha={3} size={84} cores={{lembra: AMBAR, confie: VERM}} fim={T.quem - 0.08} />
			<Frase s={s} palavras={q2} y={330} porLinha={3} size={84} cores={{inocente: '#5be0a0', lembra: AMBAR}} fim={T.mulher - 0.35} />
			<g opacity={vis(s, T.mulher, T.deQuem, 0.1)} transform={`translate(540 200) scale(${0.7 + 0.3 * pop(s, T.mulher, 0.3)})`}>
				<rect x={-250} y={-44} width={500} height={70} rx={35} fill={ROSA} />
				<Txt x={0} y={4} size={40} fill="#fff" font={poppins} weight={800} ls={5}>
					VOZ DE MULHER
				</Txt>
			</g>
			<Frase s={s} palavras={q3} y={370} porLinha={2} size={110} fill={ROSA} cores={{chega: ROSA, anselmo: ROSA}} fim={T.deQuem} />
		</Rot>
	);
};

// ---------------------------------------------------------------- 8 · CTA: Lia na janela, perguntas e comentários
export const PCta: React.FC<PlanoProps> = ({s, T}) => {
	const a = T.deQuem;
	const k = L((s - a) / 9.3);
	const cam = somaCam({x: lerp(-40, 40, k), y: lerp(30, -30, k), z: lerp(1.0, 1.1, k)}, mao(s, 0.8));
	const q1 = vis(s, a, T.porQue - 0.05, 0.12);
	const q2 = vis(s, T.porQue, T.comenta - 0.05, 0.12);
	const parte2 = pop(s, T.mais, 0.45);
	const fundoBlur = s > T.comenta - 0.2;
	const bolhas = [
		{t: T.comenta, y: 640, nome: '@mari.teorias', txt: 'o delegado sabe de tudo', cor: '#e45b87', likes: 218},
		{t: T.comenta + 0.55, y: 810, nome: '@joao_suspeito', txt: 'e se a fita foi gravada depois?', cor: '#4aa3df', likes: 342},
		{t: T.comenta + 1.1, y: 980, nome: '@lu.detetive', txt: 'a voz é da avó da Lia?!', cor: '#7bd389', likes: 97},
	];
	return (
		<Rot r={cam.r ?? 0}>
			<g opacity={fundoBlur ? 0.75 : 1}>
				<Camada cam={cam} p={0.2} filtro={fundoBlur ? 'bl2' : undefined}>
					<Ceu tipo="noite" />
					<Nuvens s={s} y={400} cor="#0f2633" n={6} vel={14} />
					<Mar s={s} y0={1000} refX={760} refOp={0.4} />
					<Farol x={760} y={1020} esc={0.6} luz={1} />
					<Feixe x={760} y={1020 - 575 * 0.6} ang={s * 1.9} comp={1300} larg={140} />
					<Chuva s={s} n={50} op={0.3} />
				</Camada>
				<Camada cam={cam} p={0.7} filtro={fundoBlur ? 'bl2' : undefined}>
					{/* moldura da janela da casa */}
					<rect x={-400} y={-300} width={W + 800} height={180 + 300} fill="#1a1612" />
					<rect x={-400} y={1700} width={W + 800} height={600} fill="#1a1612" />
					<rect x={-400} y={-300} width={300} height={H + 600} fill="#1a1612" />
					<rect x={1180} y={-300} width={300} height={H + 600} fill="#1a1612" />
					<line x1={540} y1={180} x2={540} y2={1700} stroke="#2a221a" strokeWidth={18} />
					<line x1={-100} y1={900} x2={1180} y2={900} stroke="#2a221a" strokeWidth={18} />
					{/* reflexo da voz: onda rosa no vidro */}
					<g opacity={q1}>
						<polyline
							points={Array.from({length: 60})
								.map((_, i) => `${80 + i * 16},${760 + Math.sin(i * 0.7 + s * 8) * 60 * Math.sin((i / 59) * Math.PI) * (0.6 + 0.4 * Math.sin(s * 5))}`)
								.join(' ')}
							fill="none"
							stroke={ROSA}
							strokeWidth={8}
							strokeLinecap="round"
							style={{filter: `drop-shadow(0 0 16px ${ROSA})`}}
						/>
					</g>
					{/* "quem lembra é suspeito": silhuetas refletidas no vidro, uma a uma */}
					<g opacity={q2 * 0.9}>
						{(['pescador', 'padre', 'cassio', 'pescador'] as const).map((q, i) => (
							<g key={i} opacity={entra(s, T.porQue + 0.25 + i * 0.25, 0.2)}>
								<Pessoa quem={q} x={170 + i * 245} y={1260} esc={1.2} t={s + i} sombra={0} silhueta="#07121a" sd={i + 3} rim="#4a7a90" rimDx={4} />
								<Txt x={170 + i * 245} y={1260 - 470 * 1.2 + 70 + Math.sin(s * 2 + i) * 8} size={120} fill={AMBAR} op={0.95}>
									?
								</Txt>
							</g>
						))}
					</g>
				</Camada>
				<Camada cam={cam} p={1}>
					<Busto quem="lia" x={540} y={1440} esc={2.45} t={s} vira={0} ox={0} oy={0} expr={s < T.comenta ? 'tensa' : 'serio'} rim="#9fd0e0" />
				</Camada>
			</g>
			{/* perguntas */}
			<Txt x={540} y={270} size={118} ls={3} op={q1} sc={0.8 + 0.2 * pop(s, a, 0.35)} glow={ROSA} stroke="#05080c" sw={6}>
				DE QUEM É
			</Txt>
			<Txt x={540} y={400} size={150} fill={ROSA} op={q1} sc={0.8 + 0.2 * pop(s, T.essa, 0.35)} glow={ROSA} stroke="#05080c" sw={6}>
				ESSA VOZ?
			</Txt>
			<Txt x={540} y={270} size={80} ls={3} op={q2} sc={0.8 + 0.2 * pop(s, T.porQue, 0.35)} stroke="#05080c" sw={6}>
				POR QUE QUEM LEMBRA
			</Txt>
			<Txt x={540} y={400} size={150} fill={AMBAR} op={q2} sc={0.8 + 0.2 * pop(s, T.suspeito, 0.35)} glow={AMBAR} stroke="#05080c" sw={6}>
				É SUSPEITO?
			</Txt>
			{/* comentários subindo */}
			{bolhas.map((b, i) => {
				const kk = pop(s, b.t, 0.4);
				const likes = Math.round(b.likes * eo((s - b.t) / 1.6));
				const sobe = Math.max(0, s - b.t) * 6;
				return (
					<g key={i} transform={`translate(0 ${b.y + (1 - kk) * 90 - sobe})`} opacity={L(kk * 2) * (s >= b.t ? 1 : 0)}>
						<rect x={70} y={-70} width={940} height={150} rx={40} fill="#16222e" opacity={0.94} stroke="#2a3d50" strokeWidth={3} />
						<circle cx={150} cy={5} r={44} fill={b.cor} />
						<Txt x={150} y={22} size={46} fill="#fff" font={poppins} weight={800} ls={0}>
							{b.nome.charAt(1).toUpperCase()}
						</Txt>
						<Txt x={220} y={-14} size={32} fill="#9fc1d1" font={poppins} weight={700} anchor="start" ls={0}>
							{b.nome}
						</Txt>
						<Txt x={220} y={40} size={36} fill={BRANCO} font={poppins} weight={600} anchor="start" ls={0}>
							{b.txt}
						</Txt>
						<g transform="translate(940 5)">
							<path d="M0,10 C-30,-14 -22,-34 -8,-34 C-2,-34 0,-28 0,-26 C0,-28 2,-34 8,-34 C22,-34 30,-14 0,10 Z" fill={VERM} transform={`scale(${1 + 0.15 * Math.sin(s * 8 + i)})`} />
							<Txt x={0} y={52} size={26} fill={BRANCO} font={poppins} weight={700} ls={0}>
								{likes}
							</Txt>
						</g>
					</g>
				);
			})}
			<g opacity={entra(s, T.teoria, 0.2)} transform={`translate(0 ${Math.sin(s * 4) * 6})`}>
				<rect x={110} y={1110} width={860} height={104} rx={52} fill={BRANCO} />
				<Txt x={540} y={1182} size={58} fill="#14181e" font={poppins} weight={900} ls={3}>
					COMENTE SUA TEORIA ↓
				</Txt>
			</g>
			{/* parte 2 entra no lugar das perguntas */}
			<g transform={`translate(540 ${330}) scale(${0.6 + 0.4 * parte2})`} opacity={L(parte2 * 2)}>
				<rect x={-440} y={-190} width={880} height={330} rx={46} fill="#101c28" stroke={AMBAR} strokeWidth={6} />
				<Txt x={0} y={-100} size={52} fill="#9fc1d1" font={poppins} weight={800} ls={4}>
					AS MAIS VOTADAS VIRAM A
				</Txt>
				<Txt x={0} y={60} size={170} fill={AMBAR} glow={AMBAR} sc={1 + 0.04 * Math.sin(s * 7)}>
					PARTE 2
				</Txt>
			</g>
			{s > T.mais && <rect x={0} y={0} width={W} height={490} fill="#000" opacity={0} />}
			<g opacity={0}>
				<Chuva s={s} n={0} />
			</g>
		</Rot>
	);
};

export {H, eio};
