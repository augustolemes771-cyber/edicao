// Cenas (peças) do experimento-stanford em ilustração 2D plana, no estilo da referência "Ponto Cego":
// mapa com pino, personagens chapados, lanterna revelando no escuro, cartela de título limpa.
import React from 'react';
import type {CenaPeca, Pecas} from '../../pecas/peca';
import {Cartela, COR, Fundo, Livro, Lua, Mapa, Numero, Personagem, Pilula, Porao, Predio, Relogio, TextoGrande, Foco, usePeca} from './ilustracao';

// 1. Abertura: mapa dos EUA → prédio de Stanford → porão falso com 24 estudantes.
export const stanfordAbertura: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	const mapa = mola(0, 90, 18);
	const mapaSai = mola(55, 70, 20);
	const predio = mola(50, 90, 16);
	const numero = mola(70, 110, 14);
	const figs = mola(85, 110, 16);
	return (
		<Fundo noite>
			<Lua x={340} y={70} r={46} p={1} />
			{mapaSai < 0.98 && <Mapa p={Math.max(0, mapa - mapaSai)} rotulo="ESTADOS UNIDOS · 1971" />}
			<Predio p={Math.max(0, predio - 0)} y={360} />
			<Porao p={Math.min(1, predio)} />
			<Numero valor="24" rotulo="ESTUDANTES COMUNS" p={numero} top={160} />
			<Personagem x={130} y={900} tom="prisioneiro" p={Math.min(1, figs)} escala={1.1} />
			<Personagem x={300} y={900} tom="guarda" vira p={Math.min(1, figs)} escala={1.1} />
		</Fundo>
	);
};

// 2. O prazo original: duas semanas (relógio).
export const stanfordPrazo: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {t, mola} = usePeca(cena);
	const r = mola(2, 90, 16);
	const n = mola(10, 110, 14);
	return (
		<Fundo noite>
			<Relogio p={r} y={520} girar={Math.min(40, t * 6)} />
			<Numero valor="2" rotulo="SEMANAS PREVISTAS" p={n} top={200} />
		</Fundo>
	);
};

// 3. Escalada: rebelião, punições — lanterna revela a cena no escuro.
export const stanfordEscalada: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola, q} = usePeca(cena);
	const d = cena.dados ?? {};
	const foco = mola(0, 60, 20);
	const braco = Math.min(1, mola(6, 70, 15));
	const p1 = mola(q(d.flexoes as number) - 2);
	const p2 = mola(q(d.isolamento as number) - 2);
	const p3 = mola(q(d.humilhacao as number) - 2);
	return (
		<Fundo noite>
			<Personagem x={240} y={920} tom="guarda" braco={braco} escala={1.3} />
			<Personagem x={150} y={960} tom="prisioneiro" vira escala={1.1} />
			<Foco x={195} y={880} r={260} p={foco} />
			{p1 > 0.01 && p1 < 1 && <Pilula texto="FLEXÕES" p={p1} y={220} />}
			{p2 > 0.01 && p2 < 1 && <Pilula texto="ISOLAMENTO" p={p2} y={220} />}
			{p3 > 0.01 && <Pilula texto="HUMILHAÇÃO" p={Math.min(1, p3)} y={220} />}
		</Fundo>
	);
};

// 4. Dia 6: o cientista interrompe tudo — o foco fecha até apagar.
export const stanfordInterrompido: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {fps, mola, sobe} = usePeca(cena);
	const duracaoFrames = Math.round((cena.ate - cena.de) * fps);
	const n = mola(0, 110, 14);
	const fecha = sobe(Math.round(duracaoFrames * 0.35), duracaoFrames - 12);
	const raio = Math.max(40, 420 - fecha * 380);
	return (
		<Fundo noite>
			<Numero valor="6" rotulo="DIA" p={n} cor={COR.vermelho} top={170} />
			<Porao p={1} />
			<Foco x={216} y={700} r={raio} p={1} />
		</Fundo>
	);
};

// 5. Cinquenta anos como prova clássica de psicologia (tom diurno/sépia, livro-texto).
export const stanfordClassico: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	const l = mola(2, 90, 16);
	const n = mola(10, 110, 14);
	return (
		<Fundo noite={false}>
			<Livro p={l} y={460} />
			<Numero valor="50" rotulo="ANOS DE LIVRO-TEXTO" p={n} top={190} cor="#8a5a2b" />
		</Fundo>
	);
};

// 6. A virada: em 2018, documentos questionam a versão oficial.
export const stanfordVirada: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	const n = mola(2, 100, 14);
	const alerta = mola(16, 140, 10);
	return (
		<Fundo noite>
			<Numero valor="2018" rotulo="DOCUMENTOS REVELADOS" p={n} top={190} cor={COR.vermelho} />
			{alerta > 0.01 && <Pilula texto="FRAUDE?" p={Math.min(1, alerta)} y={560} />}
		</Fundo>
	);
};

// 7. Fechamento: a pergunta não é mais "você viraria um monstro?" — e cartela final.
export const stanfordFechamento: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	const silhueta = mola(0, 70, 18);
	const texto = mola(28, 90, 15);
	const cartela = mola(58, 70, 16);
	return (
		<Fundo noite>
			<Lua x={340} y={90} r={50} p={1} />
			<Personagem x={216} y={980} tom="prisioneiro" escala={1.4} p={Math.min(1, silhueta)} />
			<Foco x={216} y={900} r={320} p={1} />
			{texto > 0.02 && texto < 0.95 && <TextoGrande texto="MONSTRO?" p={Math.min(1, texto)} />}
			{cartela > 0.01 && (
				<div style={{position: 'absolute', inset: 0, opacity: Math.min(1, cartela)}}>
					<Cartela p={1} titulo="O EXPERIMENTO" subtitulo="QUE A CIÊNCIA PROIBIU DE REPETIR" destaque="PRISÃO DE STANFORD" rodape="CALIFÓRNIA · 1971" />
				</div>
			)}
		</Fundo>
	);
};

export const pecas: Pecas = {
	stanfordAbertura,
	stanfordPrazo,
	stanfordEscalada,
	stanfordInterrompido,
	stanfordClassico,
	stanfordVirada,
	stanfordFechamento,
};
