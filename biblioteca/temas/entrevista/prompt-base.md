# Prompt base: Entrevista

Objetivo: uma edição que libere dopamina em quem assiste. Siga isto em todo vídeo do tema, antes de qualquer outra regra.

- **Densidade:** efeitos frequentes, motion graphics, animações e elementos 3D. Quanto mais coisas acontecendo ao mesmo tempo, mais prende:
  empilhe camadas (zoom de câmera + chip/cartão + elemento 3D + partículas/luz) nos momentos fortes, sempre ligadas ao que é dito.
  Evento novo a cada ~2 s; começo ainda mais denso.
- **Som junto, sem poluir:** cada evento forte tem um efeito sonoro curto (pop, swish, tick, whoosh leve). Mix ~20 dB abaixo da voz,
  no máximo 1 som a cada ~2 s, sem grave/drone/sino. Voz a −14 LUFS.
- **Leitura pelo rosto:** quem olha para o rosto deve entender tudo ao redor sem desviar o olhar. Por isso: elementos ao redor do rosto
  (faixa y 215–450 acima da cabeça e y 1000–1200 abaixo, legenda no meio y≈1260), nunca sobre o rosto, nada nas bordas (y<220, y>1500, x>960),
  um texto por vez, texto curto (≤ 4 palavras por cartão, ≥ 0,3 s por palavra), alto contraste (branco/ouro sobre fundo escurecido),
  fonte grande e pesada, movimento curto que termina em repouso legível. A legenda nunca repete o cartão na tela.
- **Camadas de fundo vs. de leitura:** o que se move muito (partículas, luz, 3D) fica periférico ou atrás; o que se lê (legenda, chip) fica quieto perto do rosto.
- **Duração e ritmo da fala:** o vídeo final tem NO MÁXIMO 59 s (meta 50–58 s; confira `duracaoEditada` antes de cada prévia). Corte todas as pausas
  e respirações longas nas bordas medidas no silêncio (deixe ~0,1–0,2 s), tire repetições e enrolação, e só se ainda passar acelere a fala de leve
  (até 1,08x, sem mudar o tom). Primeiro cortar, depois acelerar; cortar conteúdo fraco vale mais que acelerar.
- Receitas de efeito por emoção e o que ele reprova: `docs/estilo-do-usuario.md`. Peças: `src/pecas/efeitos/README.md`.

Conflito entre "mais coisas" e "fácil de ver": a legibilidade vence; aumente a densidade com camadas periféricas, não com mais texto.
