// historia-2 · "O Apagão de Corvo Branco" (Ilha do Boto Branco), parte 1. Mistério 100% em motion 2.5D (SVG, sem WebGL).
// Este arquivo só orquestra: âncoras T na narração, troca de planos (cortes com clarão/escurecimento), acabamento de
// filme e sons. Cenário em cenario.tsx, personagens em personagens.tsx, planos em planos-a..d.tsx.
// Tela vertical 1080x1920; a faixa y 1330–1520 é da legenda (menos no CTA final, onde ela some).
import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import type {Busca} from '../../motor/palavras';
import type {Cena, Som} from '../../motor/plano';
import type {CenaPeca} from '../../pecas/peca';
import {D, Defs, H, L, Palavra, PlanoProps, W} from './util';
import {Faixas, Grao, Vinheta} from './cenario';
import {PCozinha, PIlha} from './planos-a';
import {PLente, PPorta, PRelogios, PVolta} from './planos-b';
import {PCasa, PChegada, PDelegacia, PGiz, PPraca} from './planos-c';
import {PCta, PGaveta, PPlay, PVoz} from './planos-d';

type Plano = {de: (T: D) => number; C: React.FC<PlanoProps>; corte: 'flash' | 'escuro' | 'nada'};
// Ordem do vídeo; cada plano vai do seu "de" até o "de" do próximo.
const PLANOS: Plano[] = [
	{de: () => 0, C: PIlha, corte: 'nada'},
	{de: (T) => T.ate, C: PCozinha, corte: 'escuro'},
	{de: (T) => T.quando, C: PVolta, corte: 'flash'},
	{de: (T) => T.faroleiro - 0.05, C: PLente, corte: 'escuro'},
	{de: (T) => T.sala - 0.1, C: PPorta, corte: 'escuro'},
	{de: (T) => T.todos - 0.12, C: PRelogios, corte: 'flash'},
	{de: (T) => T.ninguem - 0.05, C: PPraca, corte: 'escuro'},
	{de: (T) => T.delegadoO - 0.05, C: PDelegacia, corte: 'flash'},
	{de: (T) => T.sem - 0.08, C: PGiz, corte: 'escuro'},
	{de: (T) => T.quase - 0.05, C: PChegada, corte: 'flash'},
	{de: (T) => T.volta - 0.05, C: PCasa, corte: 'escuro'},
	{de: (T) => T.eAcha - 0.05, C: PGaveta, corte: 'escuro'},
	{de: (T) => T.ela - 0.05, C: PPlay, corte: 'escuro'},
	{de: (T) => T.eAVoz - 0.05, C: PVoz, corte: 'flash'},
	{de: (T) => T.deQuem - 0.05, C: PCta, corte: 'flash'},
];

const Mundo: React.FC<{s: number; frame: number; cena: CenaPeca}> = ({s, frame, cena}) => {
	const dados = (cena.dados ?? {}) as Record<string, unknown>;
	const T = dados.T as D;
	let i = 0;
	for (let j = 0; j < PLANOS.length; j++) if (s >= PLANOS[j].de(T)) i = j;
	const P = PLANOS[i];
	const t0 = P.de(T);
	const d = s - t0;
	// transição de entrada: clarão branco ou mergulho no preto (curto, ligado à fala)
	const flash = P.corte === 'flash' ? L(1 - d / 0.16) * 0.85 : 0;
	const escuro = P.corte === 'escuro' ? L(1 - d / 0.14) : 0;
	// e o fim do plano anterior escurece um pouco antes do corte
	const prox = PLANOS[i + 1];
	const saida = prox && prox.corte === 'escuro' ? L(1 - (prox.de(T) - s) / 0.08) : 0;
	return (
		<svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{display: 'block'}}>
			<Defs />
			<P.C s={s} T={T} frame={frame} dados={dados} />
			<Vinheta />
			<Grao frame={frame} />
			<Faixas k={0.6} />
			<rect width={W} height={H} fill="#fff" opacity={flash} />
			<rect width={W} height={H} fill="#000" opacity={Math.max(escuro, saida)} />
		</svg>
	);
};

export const misterioCorvo: React.FC<{cena: CenaPeca}> = ({cena}) => {
	const frame = useCurrentFrame();
	const {fps, width} = useVideoConfig();
	const s = cena.de + frame / fps;
	const k = width / W;
	return (
		<div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: '#000'}}>
			<div style={{width: W, height: H, transform: `scale(${k})`, transformOrigin: '0 0'}}>
				<Mundo s={s} frame={Math.round(s * fps)} cena={cena} />
			</div>
		</div>
	);
};

// ---------------------------------------------------------------- cenas (âncoras na narração)
export const cenasMisterio = (b: Busca, duracao: number): Cena[] => {
	const T: D = {
		ilha: b.at('Ilha'),
		balsa: b.at('balsa'),
		farol: b.at('farol'),
		ate: b.at('Até'),
		catorze: b.at('catorze'),
		oitenta: b.at('oitenta'),
		relogio: b.at('onze'),
		sete: b.at('sete', 2),
		luzApaga: b.at('apagou', 2),
		minutos: b.at('minutos'),
		quando: b.at('Quando'),
		ate2: b.at('Quando'),
		voltou: b.at('voltou'),
		faroleiro: b.at('faroleiro'),
		sumido: b.at('sumido'),
		sala: b.say('A sala').inicio,
		trancada: b.at('trancada'),
		dentro: b.at('dentro'),
		todos: b.say('E todos').inicio,
		pararam: b.at('pararam'),
		mesma: b.at('mesma'),
		ninguem: b.at('Ninguém'),
		delegadoO: b.say('O delegado').inicio,
		delegado: b.at('delegado'),
		dia: b.at('dia', 2),
		afog: b.at('afogamento'),
		sem: b.at('sem'),
		corpo: b.at('corpo'),
		quase: b.at('Quase'),
		anos: b.at('anos'),
		neta: b.at('neta'),
		volta: b.at('volta'),
		vender: b.at('vender'),
		eAcha: b.say('e acha').inicio,
		acha: b.at('acha'),
		fita: b.at('fita'),
		ela: b.at('Ela'),
		play: b.at('play'),
		eAVoz: b.say('E a voz').inicio,
		confie: b.at('confie'),
		quem: b.say('Quem não lembra').inicio,
		eAoFundo: b.say('E ao fundo').inicio,
		mulher: b.at('mulher'),
		fimVoz: b.say('já chega').fim + 0.25,
		deQuem: b.say('De quem').inicio,
		essa: b.at('essa'),
		porQue: b.say('Por que quem lembra').inicio,
		suspeito: b.at('suspeito'),
		comenta: b.at('Comenta'),
		teoria: b.at('teoria'),
		mais: b.at('mais'),
	};
	const pal = (f: string): Palavra[] => {
		const ts = b.tempos(f);
		return f.split(/\s+/).map((txt, i) => ({txt: txt.toUpperCase(), t: ts[i]}));
	};
	const dados = {
		T,
		q1: pal('não confie em quem lembra daquela noite'),
		q2: pal('Quem não lembra, ao menos, é inocente'),
		q3: pal('Anselmo, já chega'),
	};
	// Coração no escuro: de "minutos" até a luz voltar, a cada ~1,1 s.
	const coracoes: [number, Som, number][] = [];
	for (let t = T.minutos + 0.9; t < T.quando - 0.3; t += 1.1) coracoes.push([t, 'coracao', 0.6]);
	const sons: [number, Som, number][] = [
		[T.ilha, 'vento', 0.6],
		[T.ilha, 'sting', 0.55],
		[T.balsa, 'pro_whoosh_curto', 0.5],
		[T.catorze, 'tictac', 0.55],
		[T.relogio, 'tictac', 0.6],
		[T.sete, 'coracao', 0.5],
		[T.luzApaga, 'apagao', 0.85],
		[T.luzApaga, 'trovao', 0.75],
		[T.minutos, 'coracao', 0.65],
		...coracoes,
		[T.quando, 'subida', 0.6],
		[T.quando, 'trovao', 0.5],
		[T.sumido, 'sting', 0.65],
		[T.sumido, 'rangido', 0.5],
		[T.trancada, 'tranca', 0.9],
		[T.dentro, 'rangido', 0.55],
		[T.todos, 'tictac', 0.6],
		[T.pararam, 'pro_pouso', 0.7],
		[T.ninguem, 'vento', 0.6],
		[T.delegado, 'pro_pop', 0.5],
		[T.afog, 'carimbo', 0.9],
		[T.corpo, 'sting', 0.5],
		[T.neta, 'pro_whoosh_curto', 0.5],
		[T.vender, 'rangido', 0.6],
		[T.fita, 'pro_pop', 0.65],
		[T.play, 'fita', 0.9],
		[T.mulher, 'glitch', 0.65],
		[T.mulher, 'sting', 0.6],
		[T.mulher + 0.3, 'coracao', 0.6],
		[b.at('Anselmo', 2), 'pro_pulso', 0.65],
		[T.deQuem, 'sting', 0.6],
		[T.comenta, 'pro_pop', 0.6],
		[T.comenta + 0.55, 'pro_pop', 0.55],
		[T.comenta + 1.1, 'pro_pop', 0.55],
		[T.mais, 'subida', 0.55],
		[b.say('parte dois').fim - 0.2, 'pro_logo', 0.6],
	];
	const sonsOk = sons.map(([em, som, ganho]) => ({em, som, ganho}));
	// duas cenas da mesma peça (contínua): a 2ª esconde a legenda no CTA final
	return [
		{tipo: 'peca', nome: 'misterioCorvo', modo: 'cheia', de: 0, ate: T.deQuem - 0.01, dados, sons: sonsOk.filter((x) => x.em < T.deQuem)} as Cena,
		{tipo: 'peca', nome: 'misterioCorvo', modo: 'cheia', de: T.deQuem - 0.01, ate: duracao, dados, esconderLegenda: true, sons: sonsOk.filter((x) => x.em >= T.deQuem)} as Cena,
	];
};
