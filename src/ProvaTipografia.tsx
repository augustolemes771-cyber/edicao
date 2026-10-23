import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Bomba, Cassino, Designer, Etiqueta, Rasgado, type EstiloTipografia} from './pecas/Tipografia';

// Prova estática dos estilos de texto tirados dos posts (docs/referencias/tipografia.md), cada um sobre um fundo
// parecido com o do post original.
export type PropsProvaTipografia = {estilo: EstiloTipografia};

const grade = (cor: string, passo: number): React.CSSProperties => ({
	backgroundImage: `linear-gradient(${cor} 1px, transparent 1px), linear-gradient(90deg, ${cor} 1px, transparent 1px)`,
	backgroundSize: `${passo}px ${passo}px`,
});

const FUNDOS: Record<EstiloTipografia, React.CSSProperties> = {
	etiqueta: {backgroundColor: '#121212', ...grade('rgba(255,255,255,0.05)', 54)},
	bomba: {
		background:
			'radial-gradient(ellipse at 50% 40%, rgba(70,60,45,0.55) 0%, transparent 60%), #1c1a17',
	},
	designer: {background: 'radial-gradient(ellipse at 50% 35%, #3a2e26 0%, #1a1512 55%, #0b0908 100%)'},
	rasgado: {background: 'radial-gradient(ellipse at 50% 40%, #fbfbfa 0%, #ececea 100%)'},
	cassino: {background: 'radial-gradient(ellipse at 50% 55%, #1d211b 0%, #0a0b0a 70%)'},
};

export const ProvaTipografia: React.FC<PropsProvaTipografia> = ({estilo}) => (
	<AbsoluteFill style={{...FUNDOS[estilo], justifyContent: 'center', alignItems: 'center'}}>
		{estilo === 'etiqueta' && <Etiqueta cima="DTM" baixo="Imtihoni" nota={['29-30-aprel', '13:30']} largura={900} />}
		{estilo === 'bomba' && <Bomba etiqueta="IT Kids" titulo="Guruhlariga" apoio={['Qabul', 'boshlandi']} largura={760} />}
		{estilo === 'designer' && (
			<Designer titulo="É por isso" fina="que você" forte="precisa de um" palavra="Designer" pilula="arraste" largura={880} />
		)}
		{estilo === 'rasgado' && (
			<Rasgado topo="Só vender" meio="Não é o" pilula="Tem que conquistar" fim="Suficiente" largura={880} />
		)}
		{estilo === 'cassino' && (
			<Cassino
				fundo={['Chance', '$500']}
				script={['Turn', 'Thousand']}
				legenda={['Collection built for high stakes thinkers']}
				largura={760}
			/>
		)}
	</AbsoluteFill>
);
