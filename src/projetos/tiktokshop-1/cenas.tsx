// Cenas do tiktokshop-1: notícia com motions, estilo "prova real" (print de manchete + gráfico + CTA),
// com flash de corte, partículas no estouro dos números e dinheiro 3D nas cenas de valor.
import React from 'react';
import type {CenaPeca, Pecas} from '../../pecas/peca';
import {
	Camera,
	CartaoData,
	CartaoNoticia,
	COR,
	CTAFixo,
	DinheiroGirando,
	Flash,
	Fundo,
	GraficoRanking,
	Numero,
	Particulas,
	TextoGrande,
	usePeca,
	Vinheta,
} from './ilustracao';

// 1. "Enquanto você rolava o feed agora, tem gente comum faturando milhões fazendo live no TikTok."
export const tkAbertura: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	const p = mola(0, 90, 15);
	return (
		<Fundo>
			<Camera cena={cena} zoom={[1, 1.15]}>
				<TextoGrande texto="tem gente comum faturando MILHÕES fazendo live no TikTok" p={Math.min(1, p)} tamanho={56} />
			</Camera>
			<Vinheta />
			<Flash cena={cena} />
		</Fundo>
	);
};

// 2. "O TikTok Shop chegou no Brasil em maio de 2025."
export const tkChegada: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	const p = mola(0, 100, 14);
	return (
		<Fundo>
			<Camera cena={cena} zoom={[1, 1.18]}>
				<CartaoData texto="MAIO DE 2025" p={Math.min(1, p)} y={420} />
			</Camera>
			<Vinheta />
			<TextoGrande texto="o TikTok Shop chegou no Brasil" p={Math.min(1, p)} tamanho={44} />
			<Flash cena={cena} />
		</Fundo>
	);
};

// 3. "Em um ano, já faturou cinco bilhões e trezentos milhões de reais. Quase dez mil por cento."
export const tkFaturamento: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	const n = mola(0, 90, 11);
	const n2 = mola(14, 120, 13);
	return (
		<Fundo>
			<DinheiroGirando tipo="moeda" p={Math.min(1, n)} cena={cena} />
			<Camera cena={cena} zoom={[1, 1.2]}>
				<Numero valor="R$ 5,3 BI" rotulo="EM 1 ANO NO BRASIL" p={n} top={300} />
			</Camera>
			<Particulas p={n} />
			<Vinheta />
			<div style={{opacity: Math.min(1, n2)}}>
				<CTAFixo texto="+9.900% de crescimento" p={Math.min(1, n2)} />
			</div>
			<Flash cena={cena} />
		</Fundo>
	);
};

// 4/5. Curitiba: R$10 milhões + uma criadora com R$1,7 milhão.
export const tkCuritiba: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	const p = mola(0, 100, 15);
	return (
		<Fundo>
			<Camera cena={cena} zoom={[1, 1.15]} x={[0, -20]}>
				<CartaoNoticia
					categoria="ECONOMIA · REDES SOCIAIS"
					titulo="Criadoras de Curitiba somam mais de R$ 10 milhões em vendas no TikTok Shop"
					destaque="R$ 10 milhões"
					fonteTexto="Bem Paraná"
					p={Math.min(1, p)}
					y={380}
				/>
			</Camera>
			<Vinheta />
			<Flash cena={cena} />
		</Fundo>
	);
};

export const tkCriadoraSozinha: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	const n = mola(0, 90, 11);
	return (
		<Fundo>
			<DinheiroGirando tipo="notas" p={Math.min(1, n)} cena={cena} />
			<Camera cena={cena} zoom={[1, 1.2]}>
				<Numero valor="R$ 1,7 MI" rotulo="SÓ UMA CRIADORA, SOZINHA" p={n} top={300} />
			</Camera>
			<Particulas p={n} />
			<Vinheta />
			<Flash cena={cena} />
		</Fundo>
	);
};

// 6. "Mais de 200 criadores no Brasil já ultrapassaram 1 milhão de reais."
export const tk200Criadores: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	const n = mola(0, 90, 11);
	return (
		<Fundo>
			<Camera cena={cena} zoom={[1, 1.18]}>
				<Numero valor="+200" rotulo="CRIADORES JÁ PASSARAM DE R$ 1 MILHÃO" p={n} top={300} tamanho={130} />
			</Camera>
			<Particulas p={n} cor={COR.verde} />
			<Vinheta />
			<Flash cena={cena} />
		</Fundo>
	);
};

// 7. Lives x20, faturamento em live x161, recorde R$100 mil numa noite.
export const tkGraficoLives: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	const p = mola(0, 100, 15);
	return (
		<Fundo>
			<Camera cena={cena} zoom={[1, 1.12]}>
				<GraficoRanking
					titulo="CRESCIMENTO DAS LIVES (MAI/25 → MAI/26)"
					itens={[
						{rotulo: 'Nº de lives/dia', valor: 20, destaque: false},
						{rotulo: 'Faturamento/dia', valor: 161, destaque: true},
					]}
					p={Math.min(1, p)}
					y={420}
				/>
			</Camera>
			<Vinheta />
			<Flash cena={cena} />
		</Fundo>
	);
};

export const tkRecordeLive: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	const n = mola(0, 90, 11);
	return (
		<Fundo>
			<DinheiroGirando tipo="moeda" p={Math.min(1, n)} cena={cena} />
			<Camera cena={cena} zoom={[1, 1.2]}>
				<Numero valor="R$ 100 MIL" rotulo="VENDIDOS NUMA ÚNICA LIVE" p={n} top={300} />
			</Camera>
			<Particulas p={n} />
			<Vinheta />
			<Flash cena={cena} />
		</Fundo>
	);
};

// 8. "TikTok Shop no mundo todo está a caminho de bater 100 bilhões de dólares esse ano."
export const tkGlobal: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	const p = mola(0, 100, 15);
	return (
		<Fundo>
			<Camera cena={cena} zoom={[1, 1.15]}>
				<CartaoNoticia
					categoria="BUSINESS"
					titulo="TikTok Shop is on track to hit $100 billion of gross merchandise value in 2026"
					destaque="$100 billion"
					fonteTexto="Tubefilter"
					p={Math.min(1, p)}
					y={400}
				/>
			</Camera>
			<Vinheta />
			<Flash cena={cena} />
		</Fundo>
	);
};

// 9. "A pergunta não é mais se isso vai crescer. É: você vai vender, ou só vai assistir quem vende?"
export const tkPergunta: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	const p = mola(0, 90, 15);
	return (
		<Fundo>
			<Camera cena={cena} zoom={[1, 1.1]}>
				<TextoGrande texto="você vai estar VENDENDO, ou só assistindo quem vende?" p={Math.min(1, p)} tamanho={54} cor={COR.rosa} />
			</Camera>
			<Vinheta />
			<Flash cena={cena} cor="#ffffff" />
		</Fundo>
	);
};

// 10. Fechamento: CTA fixo da M4.
export const tkCTAFinal: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const {mola} = usePeca(cena);
	const p = mola(0, 100, 14);
	const p2 = mola(14, 110, 13);
	return (
		<Fundo>
			<Camera cena={cena} zoom={[1, 1.08]}>
				<TextoGrande texto="VEM SER CREATOR" p={Math.min(1, p)} tamanho={70} />
			</Camera>
			<Particulas p={p} cor={COR.rosa} y={820} />
			<Vinheta />
			<CTAFixo texto="Comenta 'LIVE' e vem pra M4" p={Math.min(1, p2)} />
			<Flash cena={cena} />
		</Fundo>
	);
};

export const pecas: Pecas = {
	tkAbertura,
	tkChegada,
	tkFaturamento,
	tkCuritiba,
	tkCriadoraSozinha,
	tk200Criadores,
	tkGraficoLives,
	tkRecordeLive,
	tkGlobal,
	tkPergunta,
	tkCTAFinal,
};
