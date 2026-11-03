// Parte 1 do efeito-espectador: gancho (38 pessoas) e o caso Kitty Genovese. Tudo no MESMO prédio (cenario.tsx),
// só mudando o enquadramento da CameraMundo.
import React from 'react';
import {interpolate} from 'remotion';
import type {CenaPeca, Pecas} from '../../pecas/peca';
import {COR, Fundo, Livro, Numero, Pilula, TextoGrande, Vinheta, Camera, lim, fonte, usePeca} from '../experimento-stanford/ilustracao';
import {CALCADA, CameraMundo, Cronometro, Grao, JANELAS, Jornal, Kitty, ORDEM, Ondas, Pessoa, Rotulo, Rua, Silhueta, Sombra} from './cenario';

const PE = CALCADA + 70; // linha dos pés na calçada
// Janelas que a história usa (escolhidas entre as que têm gente).
export const FOCO = JANELAS.find((j) => j.acesa && j.pessoas === 1 && j.r === 2) ?? JANELAS[12];
export const VIZINHAS = JANELAS.filter((j) => j.acesa && j.pessoas > 0 && Math.abs(j.r - FOCO.r) <= 1).slice(0, 5);
const dur = (cena: CenaPeca) => cena.ate - cena.de;

// 1. "Trinta e oito pessoas.": plano geral do prédio, silencioso; cada espectador acende na janela e a contagem sobe.
export const espGancho: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, fps} = usePeca(cena);
	const conta = interpolate(frame, [6, Math.max(8, dur(cena) * fps - 6)], [0, 1], {...lim});
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[540, 760, 1.02]} para={[540, 780, 1.1]}>
				<Rua espectadores={conta} olhar={0.5} />
			</CameraMundo>
			<Vinheta forca={0.7} />
			<Numero valor={String(Math.round(conta * 38))} rotulo="PESSOAS" p={Math.min(1, frame / 6)} top={120} cor={COR.vermelho} />
			<Grao />
		</Fundo>
	);
};

// 2. "Essa é a quantidade de vizinhos": câmera corre a fachada de janela em janela, rostos virando pra rua.
export const espVizinhos: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, mola} = usePeca(cena);
	const a = VIZINHAS[0];
	const b = VIZINHAS[VIZINHAS.length - 1];
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[a.x - 60, a.y - 140, 2.2]} para={[b.x + 60, b.y + 120, 2.0]}>
				<Rua olhar={interpolate(frame, [0, 30], [-0.6, 0.8], lim)} />
			</CameraMundo>
			<Vinheta forca={0.6} />
			<Pilula texto="VIZINHOS" p={mola(6, 120, 13)} y={200} cor={COR.vermelho} />
			<Grao />
		</Fundo>
	);
};

// 3. "segundo os jornais,": jornal cai girando na frente do prédio.
export const espJornais: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[540, 900, 1.1]} para={[540, 920, 1.25]}>
				<Rua olhar={0.7} />
				<rect x={-500} y={-500} width={2100} height={2900} fill="#000" opacity={0.55} />
				<Jornal y={880} s={0.95} rot={-6} manchete={'38 VIRAM.\nNINGUÉM\nAJUDOU.'} p={mola(0, 120, 14)} />
			</CameraMundo>
			<Vinheta forca={0.5} />
			<Grao />
		</Fundo>
	);
};

// 4. "viram ou ouviram": close extremo numa janela; o espectador, imóvel, com o som subindo da rua.
export const espViram: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {q, mola} = usePeca(cena);
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[FOCO.x, FOCO.y, 4.2]} para={[FOCO.x, FOCO.y + 10, 5]}>
				<Rua olhar={0.9} />
				<Ondas x={FOCO.x - 70} y={FOCO.y + 60} p={mola(q(cena.de + dur(cena) * 0.45), 120, 14)} escala={0.35} lado={1} />
			</CameraMundo>
			<Vinheta forca={0.75} />
			<Grao />
		</Fundo>
	);
};

// 5. "uma mulher sendo assassinada embaixo da própria janela": câmera desce da janela até a calçada; a sombra chega.
export const espAssassinada: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {t, mola} = usePeca(cena);
	const sombraX = interpolate(t, [0, dur(cena)], [-120, 280], lim);
	const flash = mola(Math.round(dur(cena) * 30 * 0.7), 200, 12);
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[FOCO.x, FOCO.y, 2.6]} para={[380, PE - 200, 1.9]}>
				<Rua olhar={1} />
				<Kitty x={400} y={PE} s={1.35} olhar={-1} vira />
				<Sombra x={sombraX} y={PE + 6} s={1.55} anda={t * 9} />
			</CameraMundo>
			<div style={{position: 'absolute', inset: 0, background: COR.vermelho, opacity: (1 - Math.min(1, flash)) * 0.0 + Math.max(0, Math.sin(flash * Math.PI)) * 0.35}} />
			<Vinheta forca={0.7} />
			<Grao />
		</Fundo>
	);
};

// 6. "e não fizeram nada.": volta pras janelas; uma a uma, as cortinas fecham e as luzes apagam.
export const espNada: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, mola} = usePeca(cena);
	const f = interpolate(frame, [4, 40], [0, 1], lim);
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[540, 800, 1.5]} para={[540, 780, 1.2]}>
				<Rua olhar={0.8} fechar={f * 0.8} apagar={f * 0.55} />
			</CameraMundo>
			<Vinheta forca={0.7} />
			<Pilula texto="NADA" p={mola(10, 140, 12)} y={190} cor={COR.vermelho} />
			<Grao />
		</Fundo>
	);
};

// 7. "Isso criou uma das teorias mais estudadas da psicologia:": livro de psicologia abrindo, páginas virando.
export const espTeoria: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola, frame} = usePeca(cena);
	const livro = mola(0, 110, 14);
	return (
		<Fundo noite>
			<Camera cena={cena} zoom={[1.4, 1.8]} y={[20, -10]}>
				<Livro p={livro} y={760} />
				{[0, 1, 2].map((i) => {
					const vira = interpolate(frame, [10 + i * 9, 20 + i * 9], [0, 1], lim);
					return <div key={i} style={{position: 'absolute', left: 540, top: 770, width: 118, height: 130, background: '#ece6d6', transformOrigin: '0 50%', transform: `rotateY(${180 * vira}deg)`, opacity: livro * (vira > 0.01 && vira < 0.99 ? 1 : 0)}} />;
				})}
			</Camera>
			<Vinheta forca={0.55} />
			<Pilula texto="PSICOLOGIA" p={mola(14, 120, 13)} y={220} cor="#3c5a8a" />
			<Grao />
		</Fundo>
	);
};

// 8. "o Efeito Espectador.": título sobre o prédio, todos os olhos acesos no escuro.
export const espTitulo: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	const p = mola(0, 130, 15);
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[540, 900, 1.0]} para={[540, 900, 1.12]}>
				<Rua apagar={1} olhos={1} olhar={0.6} poste={0.6} />
			</CameraMundo>
			<div style={{position: 'absolute', inset: 0, background: 'rgba(5,7,12,0.55)'}} />
			<div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', opacity: Math.min(1, p * 1.5), transform: `scale(${0.86 + 0.14 * p})`}}>
				<div style={{fontFamily: fonte, fontWeight: 600, fontSize: 30, letterSpacing: '0.3em', color: '#9aa0ab'}}>A TEORIA DO</div>
				<div style={{fontFamily: fonte, fontWeight: 800, fontSize: 112, lineHeight: 1.02, color: COR.branco, textShadow: '0 10px 30px rgba(0,0,0,0.6)'}}>
					EFEITO
					<br />
					<span style={{color: COR.vermelho}}>ESPECTADOR</span>
				</div>
			</div>
			<Grao />
		</Fundo>
	);
};

// 9. "Em mil novecentos e sessenta e quatro,": rua deserta, 1964 entrando como data de filme.
export const espAno: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, mola} = usePeca(cena);
	const ano = Math.round(interpolate(frame, [0, 22], [2024, 1964], {...lim}));
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[540, 1300, 1.6]} para={[480, 1250, 1.35]}>
				<Rua olhar={0.6} />
			</CameraMundo>
			<div style={{position: 'absolute', inset: 0, background: 'rgba(60,40,20,0.28)', mixBlendMode: 'multiply'}} />
			<Vinheta forca={0.65} />
			<Numero valor={String(ano)} rotulo="NOVA YORK" p={mola(0, 140, 14)} top={170} />
			<Grao />
		</Fundo>
	);
};

// 10. "essa mulher, Kitty Genovese,": retrato da Kitty, nome entrando.
export const espKitty: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola, t} = usePeca(cena);
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[400, PE - 190, 3.2]} para={[400, PE - 170, 2.7]}>
				<Rua olhar={0.8} />
				<Kitty x={400} y={PE} s={1.35} olhar={Math.sin(t * 2) * 0.3} />
			</CameraMundo>
			<Vinheta forca={0.6} />
			<Pilula texto="KITTY GENOVESE" p={mola(6, 130, 13)} y={200} cor="#8e2f3a" />
			<Grao />
		</Fundo>
	);
};

// 11. "foi atacada a poucos metros do prédio onde morava,": plano aberto, seta medindo a distância até a porta.
export const espMetros: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola, frame} = usePeca(cena);
	const seta = interpolate(frame, [8, 26], [0, 1], lim);
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[520, 1330, 1.7]} para={[520, 1320, 1.45]}>
				<Rua olhar={1} />
				<Kitty x={300} y={PE} s={1.2} olhar={1} />
				<line x1={350} y1={PE - 40} x2={350 + 160 * seta} y2={PE - 40} stroke={COR.vermelho} strokeWidth={6} strokeDasharray="14 10" />
				{seta > 0.95 && <polygon points={`${510},${PE - 52} ${530},${PE - 40} ${510},${PE - 28}`} fill={COR.vermelho} />}
				<Rotulo x={430} y={PE - 110} texto="POUCOS METROS" p={mola(18, 140, 13)} tam={30} />
			</CameraMundo>
			<Vinheta forca={0.6} />
			<Grao />
		</Fundo>
	);
};

// 12. "em Nova York.": câmera sobe pro céu, silhueta de arranha-céus ao fundo.
export const espNovaYork: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola, frame} = usePeca(cena);
	const sobe = mola(0, 70, 18);
	const torres = [
		[60, 520, 120],
		[200, 380, 100],
		[320, 600, 140],
		[480, 300, 90],
		[590, 480, 150],
		[760, 350, 110],
		[880, 560, 140],
	];
	return (
		<Fundo noite>
			<Camera cena={cena} zoom={[1.15, 1.3]} y={[30, -20]}>
				<svg style={{position: 'absolute', left: 0, top: 0}} width={1080} height={1920}>
					{torres.map(([x, h, w], i) => (
						<g key={i} transform={`translate(0,${(1 - sobe) * (200 + i * 40)})`}>
							<rect x={x} y={1300 - h} width={w} height={h + 700} fill={i % 2 ? '#1a2133' : '#141a29'} />
							{Array.from({length: 18}).map((_, k) => (
								<rect key={k} x={x + 14 + (k % 3) * (w / 3.4)} y={1320 - h + Math.floor(k / 3) * 46} width={14} height={20} fill="#f2c66e" opacity={((k * 7 + i * 3 + Math.floor(frame / 20)) % 5 === 0) ? 0.85 : 0.12} />
							))}
						</g>
					))}
					<rect x={0} y={1300} width={1080} height={700} fill="#0b0f19" />
				</svg>
			</Camera>
			<Vinheta forca={0.6} />
			<Pilula texto="NOVA YORK" p={mola(8, 130, 13)} y={210} cor="#3c5a8a" />
			<Grao />
		</Fundo>
	);
};

// 13. "O ataque durou mais de trinta minutos,": cronômetro girando rápido sobre a rua escura.
export const espTrintaMin: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola, frame} = usePeca(cena);
	const giro = interpolate(frame, [0, 60], [0, 200], lim);
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[400, 1300, 1.5]} para={[420, 1320, 1.7]}>
				<Rua olhar={1} poste={0.8} />
				<rect x={-500} y={-500} width={2100} height={2900} fill="#000" opacity={0.45} />
				<Cronometro x={420} y={1220} r={150} giro={giro} p={mola(0, 140, 14)} />
			</CameraMundo>
			<Vinheta forca={0.6} />
			<Numero valor="30+" rotulo="MINUTOS" p={mola(6, 130, 13)} top={180} cor={COR.vermelho} />
			<Grao />
		</Fundo>
	);
};

// 14. "em pelo menos dois ataques separados.": duas marcas vermelhas numa linha do tempo, a sombra voltando.
export const espDoisAtaques: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola, t, q} = usePeca(cena);
	const a1 = mola(4, 160, 12);
	const a2 = mola(q(cena.de + dur(cena) * 0.5), 160, 12);
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[460, PE - 250, 1.9]} para={[540, PE - 240, 1.75]}>
				<Rua olhar={1} />
				<Kitty x={560} y={PE} s={1.25} olhar={-1} />
				<Sombra x={interpolate(t, [0, dur(cena)], [160, 420], lim)} y={PE + 6} s={1.5} anda={t * 8} />
				<line x1={260} y1={1200} x2={820} y2={1200} stroke={COR.branco} strokeWidth={5} opacity={0.6} />
				<circle cx={380} cy={1200} r={22 * Math.min(1, a1)} fill={COR.vermelho} />
				<circle cx={700} cy={1200} r={22 * Math.min(1, a2)} fill={COR.vermelho} />
				<Rotulo x={380} y={1130} texto="1º" p={a1} tam={30} />
				<Rotulo x={700} y={1130} texto="2º" p={a2} tam={30} />
			</CameraMundo>
			<Vinheta forca={0.6} />
			<Pilula texto="DOIS ATAQUES" p={mola(8, 130, 13)} y={210} cor={COR.vermelho} />
			<Grao />
		</Fundo>
	);
};

// 15. "A notícia chocou o país": jornais empilhando, um por cima do outro.
export const espNoticia: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[540, 900, 0.9]} para={[540, 880, 1.05]}>
				<rect x={-600} y={-600} width={2300} height={3200} fill="#141722" />
				{[0, 1, 2, 3].map((i) => (
					<Jornal key={i} x={500 + (i % 2 ? 60 : -40) + i * 10} y={880 + i * 14} s={0.92} rot={[-12, 8, -4, 3][i]} manchete={['CRIME\nEM QUEENS', '38\nTESTEMUNHAS', 'POR QUE\nNINGUÉM\nLIGOU?', '38 VIRAM.\nNINGUÉM\nAJUDOU.'][i]} p={mola(i * 7, 150, 14)} />
				))}
			</CameraMundo>
			<Vinheta forca={0.5} />
			<Grao />
		</Fundo>
	);
};

// 16. "e deu origem a uma pergunta que a psicologia carrega até hoje:": interrogação gigante desenhada sobre o prédio.
export const espPergunta: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame, mola} = usePeca(cena);
	const traco = interpolate(frame, [4, 34], [0, 1], lim);
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={[540, 900, 1.25]} para={[540, 880, 1.05]}>
				<Rua olhar={0.6} apagar={0.3} />
			</CameraMundo>
			<div style={{position: 'absolute', inset: 0, background: 'rgba(5,7,12,0.5)'}} />
			<svg style={{position: 'absolute', left: 290, top: 470}} width={500} height={760} viewBox="0 0 500 760">
				<path d="M90 200 C90 60 410 60 410 210 C410 330 250 330 250 470 L250 520" stroke={COR.vermelho} strokeWidth={70} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - traco} />
				<circle cx={250} cy={650} r={44 * Math.min(1, mola(30, 160, 12))} fill={COR.vermelho} />
			</svg>
			<Grao />
		</Fundo>
	);
};

// 17/18. "por que, quanto mais gente vê um crime, / menos gente ajuda?": balança — sobe quem vê, cai quem ajuda.
const Gangorra: React.FC<{cena: CenaPeca; ve: number; ajuda: number; fase: 've' | 'ajuda'}> = ({cena, ve, ajuda, fase}) => {
	const {frame} = usePeca(cena);
	const nVe = Math.round(2 + ve * 10);
	return (
		<Fundo noite>
			<CameraMundo cena={cena} de={fase === 've' ? [540, 1000, 1.05] : [540, 1000, 1.12]} para={fase === 've' ? [540, 980, 1.12] : [540, 1000, 1.2]}>
				<svg style={{position: 'absolute', left: 0, top: 0}} width={1080} height={1920}>
					<rect x={-600} y={-600} width={2300} height={3200} fill="#121725" />
					{/* quem vê: fileira de silhuetas crescendo */}
					{Array.from({length: nVe}).map((_, i) => (
						<Silhueta key={i} x={120 + (i % 6) * 64} y={1080 - Math.floor(i / 6) * 90} s={0.8} cor="#2b3550" olhos={1} olhar={Math.sin(frame / 15 + i) * 0.3} p={1} />
					))}
					<rect x={90} y={1180} width={400} height={18} rx={9} fill="#2b3550" />
					<text x={290} y={1250} textAnchor="middle" fontFamily={fonte} fontWeight={800} fontSize={40} fill={COR.branco}>
						QUEM VÊ
					</text>
					{/* quem ajuda: barra caindo */}
					<rect x={640} y={1180 - 520 * ajuda} width={300} height={520 * ajuda} rx={14} fill="#3fae5c" />
					<rect x={590} y={1180} width={400} height={18} rx={9} fill="#2b3550" />
					<text x={790} y={1250} textAnchor="middle" fontFamily={fonte} fontWeight={800} fontSize={40} fill={COR.branco}>
						QUEM AJUDA
					</text>
					<text x={290} y={560} textAnchor="middle" fontFamily={fonte} fontWeight={800} fontSize={120} fill={COR.dourado} opacity={fase === 've' ? 1 : 0.4}>
						↑
					</text>
					<text x={790} y={560} textAnchor="middle" fontFamily={fonte} fontWeight={800} fontSize={120} fill={COR.vermelho} opacity={fase === 'ajuda' ? 1 : 0.15}>
						↓
					</text>
				</svg>
			</CameraMundo>
			<Vinheta forca={0.5} />
			<Grao />
		</Fundo>
	);
};
export const espMaisGente: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {frame} = usePeca(cena);
	return <Gangorra cena={cena} fase="ve" ve={interpolate(frame, [0, 40], [0, 1], lim)} ajuda={1 - interpolate(frame, [0, 40], [0, 0.25], lim)} />;
};
export const espMenosAjuda: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	return <Gangorra cena={cena} fase="ajuda" ve={1} ajuda={0.75 - 0.6 * Math.min(1.05, mola(2, 120, 11))} />;
};

export const pecasP1: Partial<Pecas> = {
	espGancho,
	espVizinhos,
	espJornais,
	espViram,
	espAssassinada,
	espNada,
	espTeoria,
	espTitulo,
	espAno,
	espKitty,
	espMetros,
	espNovaYork,
	espTrintaMin,
	espDoisAtaques,
	espNoticia,
	espPergunta,
	espMaisGente,
	espMenosAjuda,
};

// Usado em cenas de outras partes que mostram uma pessoa de rua comum.
export {Pessoa, PE, TextoGrande};
