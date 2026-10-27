# Base para vídeos de entrevista — LEGACY (referência: IMG_5157 + IMG_5159, v4b, aprovado em 2026-10-26)

Aprovado pelo Augusto como modelo. Arquivos de referência: `edit/IMG_5157/plan5157_v4.json`, `sfx_v4.json`, `reels/src/Reel5157v4.tsx`, componentes `motion5157a–e.tsx`, `kit/SubsMare.tsx`, `blender/gmv.py`, `tools/make_sfx_pro.py`, saída `reels/out/IMG_5157-v4b-master.mp4`.

## Leitura (zona única)
- Legenda MARÉ centralizada (`zone {y:1260, side:"center"}`), logo abaixo do rosto. Nunca no canto.
- Cartões, chips e selos entram colados acima da legenda (y ≈ 1000–1200) ou, quando a cena pede, acima da cabeça (y 215–450). Um texto por vez.
- Tempo de leitura: ≥ 0,3 s por palavra; itens que seguem a fala rápida podem ficar menores, mas avisar o Augusto.
- Texto que repete a fala: a legenda some durante o cartão (`sub_hide` no plano). Nunca legenda + cartão com a mesma frase.
- Nada em y<220, y>1500 (exceto a live), x>960.

## Selo VÍDEO × LIVE (`TopicBadge`, motion5157c)
- Sem "ROUND". O par aparece com animação em y 1070; o lado que não é o tema some e o do tema sobe ao topo central (y 235) e fica até a próxima troca. Só aparece quando o tema muda.

## Listas e filtros
- Itens da fala entram um por vez, no mesmo lugar (`Checklist` center / `StackCard`), não empilhados.
- Quando uma frase tem critérios + quantidade (ex.: "mais vendidos", "Black Friday", "5 vídeos por dia"): `FilterVideos`: chips dos critérios e 5 cards de vídeo (fundo escuro, borda dourada, play branco) caem sobre eles e recebem selinhos dos chips (filtro). A legenda some nesse trecho. Não duplicar com clips antigos (`versus_fan`).

## 3D e motion: só onde faz sentido
- Proibido: símbolos soltos aleatórios (moedas, corações, estrelas, raios) em cantos. Foi reprovado.
- Permitido: gancho 3D do número (cem_mil), cena VS, cartão final, e UM efeito por ideia forte, ligado à fala.
- Exemplo aprovado: "vender muito através de vídeo/live" → contador GMV em ouro 3D (Blender `gmv.py`, 1080×300, clip em y 150): "GMV" pequeno + R$ + número 0→100 + MIL + seta de tendência, acima da cabeça; cartões VÍDEO e LIVE pendurados por conectores dourados (`GmvCards`, motion5157d), acendem quando ela diz cada palavra.
- Qualidade premium: cenas 3D novas em subagente Opus high (Blender local, ~3 min por 120 quadros).

## Template de live (`LiveTemplate`, motion5157e)
- Quando alguém enfatiza "live": UI de live do TikTok Shop sobre o vídeo (~0,7 s, sai antes da fala continuar): topo (host, Seguir, LIVE, espectadores), comentários, produto em destaque na posição do print real (y 1556–1750), barra inferior (sacola 17, "Tipo…", emoji, pessoas, compartilhar). Sem coluna de ícones à direita. Sem marca do TikTok.

## Som
- Kit `assets/sfx_pro/*.wav` (gerado por `tools/make_sfx_pro.py`): graves macios, whooshes de ar, ticks mecânicos, sem sino/"plim"/moedinha/shimmer. Mapa em `sfx_v4.json`; mix 20 dB abaixo da voz; master −14 LUFS via `master_audio.py --sfx`.
- O render do Remotion NÃO tem os efeitos: sempre rodar o master com `--sfx` para o preview.

## Processo (rápido e barato)
1. Transcrever, fechar roteiro em `edit/<id>/project.md`, plano de overlays em `plan<id>.json`.
2. Copiar `Reel5157v4.tsx` como base da composição nova, trocar o plano/textos/tempos; reaproveitar `motion5157a–e`.
3. Efeitos novos: um subagente por peça (Opus high para 3D/UI de destaque), em paralelo.
4. Stills de teste dos momentos novos → render (pod se ligar; senão local `--concurrency=8`, ~6 min) → master → preview. Um preview só.
