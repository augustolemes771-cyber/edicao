# Efeitos reutilizáveis

Receitas emoção → efeito: `docs/estilo-do-usuario.md`. Todos usam o quadro da cena atual.

- `Impacto.tsx`: `ImpactoDor` (pacote dor/revolta), `Tremida`, `AberracaoCromatica`, `VinhetaPulsante`, `CortesGlitch`, `useEnvelope`.
  Ex.: `<ImpactoDor dur={2.4}>{conteudo}</ImpactoDor>`; só vinheta: `<VinhetaPulsante cor="140,0,25" bpm={90} dur={3} />`.
- `Voo3D.tsx`: `ObjetoVoaAoCentro` (qualquer objeto three.js sai de `origem` e voa ao centro, `legenda` 3D opcional) e `OlhoDourado`.
  Ex.: `<ObjetoVoaAoCentro dur={3} legenda="SÓ 1 ESPECTADOR"><OlhoDourado/></ObjetoVoaAoCentro>`.
- `Texto3DImpacto.tsx`: texto 3D metálico com queda, onda, faíscas e tremor. Ex.: `<Texto3DImpacto texto="NUNCA MAIS" dur={2} metal="branco" />`.

Nas cenas do plano: `frase` com `dor: true`, `live` com `drama`/`olho3d` já usam estes componentes.
