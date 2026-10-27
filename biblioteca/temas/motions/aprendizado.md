# Aprendizado: Motions

Regras aprendidas nos vídeos deste tema. O Claude lê isto antes de editar e acrescenta uma linha datada quando o usuário aprova ou corrige algo.

- Catálogo em `docs/referencias/desmontagem-2.md`. `cenario` monta tipografia cinematográfica sem filmagem (papel ou escuro, objetos 3D com sombra, palavra fantasma, luz de janela ou folhas).
- Posição dos objetos em tela: x e y de -1 a 1. Conferir em still que nenhum objeto cobre o texto.
- Texto dos cenários monta inteiro em ~0,3 s no começo da cena; não sincronizar letra por letra com a fala.
- O 3D precisa de WebGL; na nuvem, renderizar stills para revisar e só depois o vídeo.
- Antes de animar um estilo novo de texto, mandar a prova estática (`npx remotion still prova-texto`) para aprovação.
