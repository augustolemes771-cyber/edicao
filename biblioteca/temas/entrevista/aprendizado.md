# Aprendizado: Entrevista

Regras aprendidas nos vídeos deste tema. O Claude lê isto antes de editar e acrescenta uma linha datada quando o usuário aprova ou corrige algo.

**Modelo aprovado:** `modelos/IMG_5157-v4b.md` (guia completo) e `referencia-IMG_5157-v4b/` (planos, componentes, cena 3D, sons). Leia o guia antes de editar qualquer entrevista.

- 2026-10-26 Legenda centralizada (y≈1260, abaixo do rosto), nunca no canto. Cartões e selos colados acima dela (y 1000–1200) ou acima da cabeça (y 215–450). Um texto por vez; nada em y<220, y>1500, x>960.
- 2026-10-26 Tempo de leitura ≥ 0,3 s por palavra. Se o cartão repete a fala, a legenda some enquanto ele está na tela (nunca legenda + cartão com a mesma frase).
- 2026-10-26 Selo VÍDEO × LIVE sem "ROUND": o par aparece, o lado que não é o tema some e o do tema sobe ao topo central. Só reaparece quando o tema muda.
- 2026-10-26 Frase com critérios + quantidade (mais vendidos, Black Friday, 5 vídeos por dia): chips dos critérios + 5 cards de vídeo que caem e recebem selinhos (FilterVideos). Não duplicar com clips antigos.
- 2026-10-26 3D só onde faz sentido: gancho do número, cena VS, cartão final e um efeito por ideia forte ligado à fala (ex.: contador GMV em ouro com a palavra GMV, cartões VÍDEO e LIVE pendurados nele). Proibido símbolo solto (moeda, coração, estrela, raio) em canto.
- 2026-10-26 Quando alguém enfatiza "live": template da live do TikTok Shop sobre o vídeo (~0,7 s), produto em destaque na posição do print real, sem coluna de ícones à direita; sai antes de a fala continuar.
- 2026-10-26 Som profissional (`assets/sfx_pro`): graves macios, whooshes, ticks. Sem sino, plim, moedinha ou shimmer. Mix 20 dB abaixo da voz, ≤ 1 som a cada ~2 s. O render do Remotion não tem os sons: rodar o master com `--sfx` (−14 LUFS).
- 2026-10-26 Câmera: ciclo aberto → médio → close a cada 1,4–3,5 s, punch-in na palavra forte, whip só na troca de falante, câmera desce quando há cartão no topo (auditar rostos com `faces.py audit`).
- 2026-10-26 Processo: fechar o roteiro antes, reaproveitar componentes, 3D novo por subagente Opus alto, stills de teste, um preview só com todos os ajustes em lote. Meta ~15 min e pouco limite, sem cortar qualidade.
