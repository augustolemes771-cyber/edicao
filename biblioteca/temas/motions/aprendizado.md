# Aprendizado: Motions

Regras aprendidas nos vídeos deste tema. O Claude lê isto antes de editar e acrescenta uma linha datada quando o usuário aprova ou corrige algo.

- Catálogo em `docs/referencias/desmontagem-2.md`. `cenario` monta tipografia cinematográfica sem filmagem (papel ou escuro, objetos 3D com sombra, palavra fantasma, luz de janela ou folhas).
- Posição dos objetos em tela: x e y de -1 a 1. Conferir em still que nenhum objeto cobre o texto.
- Texto dos cenários monta inteiro em ~0,3 s no começo da cena; não sincronizar letra por letra com a fala.
- O 3D precisa de WebGL; na nuvem, renderizar stills para revisar e só depois o vídeo.
- Antes de animar um estilo novo de texto, mandar a prova estática (`npx remotion still prova-texto`) para aprovação.
- 2026-10-31 (referencias-ig-1): vídeo explicativo 100% motion no estilo das referências do Instagram (3D low-poly + narração "Se você… então… Esse é o X"): narração grátis com voz neural (`scripts/narrar.py`, edge-tts, pt-BR-AntonioNeural +12%) que dá o tempo EXATO de cada palavra (sem Whisper); o vídeo-base é fundo liso + narração e cada cena é peça de tela cheia. Avião/cenário low-poly comum em `src/projetos/referencias-ig-1/aviao.tsx`. Não clonar a voz do narrador das referências (pessoa real).
- 2026-10-31 (referencias-ig-1): PADRÃO do usuário para vídeo inteiramente em motion: base nova (modelo 3D principal, estilo) em Opus esforço médio, uma vez; cenas sobre a base em Sonnet médio; cenas simples (cartão final, textos) em Sonnet baixo; ajustes pós-revisão em Sonnet médio. Instrução detalhada por cena + conferência por quadros. Opus alto só quando o usuário avisar que precisa de qualidade máxima.
- 2026-10-31 (gota-1): REPROVADO ("muitos bugs, cenário não mostra o caminho real pela cidade, cena inicial da casa confusa, travamentos, não demonstra cada processo"). Causas: 4 agentes Sonnet com prazo de 15 min, cada um inventando o próprio cenário (sem mapa comum), poucas cenas vistas em imagem, cortes secos entre blocos. Para vídeo de jornada: UM cenário contínuo (mapa da cidade com o caminho inteiro) construído antes, câmera viajando nele; storyboard aprovado antes; cada processo mostrado com causa → efeito claro; todas as cenas conferidas em quadro; sem prazo apertado quando a pessoa pede qualidade.
