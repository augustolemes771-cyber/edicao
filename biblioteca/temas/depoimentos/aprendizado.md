# Aprendizado: Depoimentos

Regras aprendidas nos vídeos deste tema. O Claude lê isto antes de editar e acrescenta uma linha datada quando o usuário aprova ou corrige algo.

- Estrutura que prende até o fim: gancho com o resultado → dor (antes) → virada (quem ajudou) → transformação → o que aprendeu (`checklist`) → resultado concreto → suporte → agradecimento → fechamento com o próximo passo. `barraProgresso: true` no topo.
- Cortes de conteúdo numéricos, com cada borda num silêncio medido no áudio (energia abaixo de -38 dB). O tempo de palavra do Whisper erra ~0,3 s: não cortar pela palavra.
- Depois dos cortes, juntar só o áudio dos trechos, transcrever de novo e ler as emendas.
- Zoom de emenda em `b.emendas[i]` (quadro exato do corte), nunca na palavra seguinte.
- Cor de destaque com contraste sobre a roupa (vermelho some em blusa vermelha; dourado e amarelo somem em blusa vermelha: usar `serif` branca).
- Texto atrás da pessoa funciona (`gigante`, `modo: 'atras'`); troca de fundo com recorte NÃO (reprovado em 23/10/2026).
- Estilo aprovado para textos grandes (23/10/2026): `gigante` com `linhas` em neon com profundidade, `paleta: 'dourado'`; tópicos em pílulas (escolha do usuário).
