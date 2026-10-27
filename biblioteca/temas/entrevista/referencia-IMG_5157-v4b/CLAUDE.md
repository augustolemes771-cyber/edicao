# legacy-reel

Edição de Reels com a skill it-reelsmaker. Para economizar limite:

- Decisões (plano de corte, estrutura, textos, cenas, briefing) ficam na sessão principal.
- Comandos mecânicos e demorados (transcrição, cut.py, export, render, stills, patch, master) → subagente `reel-runner`.
- 3D/motion: criar ou mudar cena (Blender `blender/*.py`, componentes Remotion) é decisão de design → sessão principal, partindo das cenas existentes e do `blender/lib.py`. Renders de teste e finais do Blender → `reel-runner`.
- Conferências (dry-run, validate, faces audit, LUFS, duração) → subagente `reel-checker`.
- Um vídeo por sessão. Não abrir imagens/frames sem necessidade; preferir que o Augusto confira o preview.
- Qualidade máxima sempre: economizar tokens nunca significa cortar inserts, cenas ou etapas de checagem.
- Sem After Effects (decisão de 2026-10-25): o vídeo final sai só do Remotion. Não gerar `Reel*Base`, `.jsx` nem rodar `tools/ae_jsx.py`, a menos que o Augusto peça.
- Roteiro fechado primeiro: depois da transcrição, montar de uma vez em `edit/<id>/project.md` o plano completo (cortes, câmera, legendas, textos, 3D, motion, SFX, cartão final). Daí em diante, só processar; não reabrir decisões sem pedido.
- Reaproveitar antes de criar: partir de componentes Remotion, cenas do Blender e `sfx` existentes, ajustando-os; criar do zero só o que o roteiro exige de novo.
- Ler o mínimo: transcrições, JSONs e `.tsx` grandes com Grep ou trechos (offset/limit), nunca inteiros sem necessidade. Subagentes devolvem só resumo e erros.
- Modo rápido e econômico (pedido do Augusto, 2026-10-26: menos limite e menos tempo por vídeo, sem perda visível de qualidade):
  - Biblioteca primeiro: cada vídeo é montado com os componentes Remotion, cenas do Blender, estilo de legenda e `sfx` já existentes, trocando só textos, cores e timings via props. Cena 3D ou componente novo só quando o roteiro realmente não cabe em nada da biblioteca; aí ele entra genérico (com props) para ser reaproveitado nos próximos.
  - Sessão principal em Sonnet; Opus só para decidir roteiro/gancho quando o vídeo for difícil.
  - Pouco subagente: cada um começa do zero e custa caro. Juntar tudo que é mecânico numa única chamada do `reel-runner` (ex.: corte + export + render de uma vez) e uma única conferência do `reel-checker` antes do preview e outra depois do master.
  - Criação nova (raro): um só subagente `general-purpose` com `model: "sonnet"` e briefing completo para todas as peças novas juntas; `opus` só se o resultado não ficar bom.
  - Renders de teste do Blender só para cena nova; cena da biblioteca vai direto ao render final.
  - Um preview só: Augusto manda todos os ajustes numa mensagem e aplico tudo com `patch_render.py`.
- Duas GPUs ao mesmo tempo: RunPod 5090 para os renders pesados (Blender Cycles, render final do Remotion); PC local (RTX 3050) em paralelo para transcrição, rembg, stills e testes rápidos do Blender (Eevee ou poucos samples). Não deixar nenhuma das duas ociosa esperando a outra.
- Ajustes do preview: pedir ao Augusto todos os ajustes numa mensagem só e aplicar em lote antes de re-renderizar (de preferência com `patch_render.py`).

## Render na nuvem (RunPod, RTX 5090 + Ryzen 9 9950X)
- Remotion: `bash tools/pod_render.sh <Composição> edit/<id> reels/out/<nome>.mp4` — liga o pod se preciso, sincroniza `reels/src`, props e `reels/public/<id>/` (só o que mudou), renderiza com 16 núcleos e traz o MP4. Depois do render final: `bash tools/pod_render.sh stop` (cobra $1,19/h ligado).
- Blender no pod: `/workspace/tools/blender/blender` (4.5 LTS; o 4.2 de casa não suporta a 5090). Node em `/workspace/tools/node/bin`, projeto em `/workspace/reels`.
- Controle do pod: `C:\Users\Administrator\tools\runpodctl.exe pod list|start|stop loah6wjpzlijt6` (a chave de API já está configurada no PC).
- Master, capa, auditoria e o resto do pipeline continuam no PC.

## Base para vídeos de entrevista (2026-10-26)
O IMG_5157 (v4b) é o modelo aprovado. Antes de editar uma entrevista, ler `brands/legacy/base-entrevista.md`: legenda centralizada, textos acima dela, um por vez, selo vídeo × live só na mudança, 3D só com sentido (sem símbolos soltos), template de live, kit de sons `assets/sfx_pro` e master com `--sfx`.
