# Entrevista 3: continuar no outro PC

São 4 vídeos separados (tema Entrevista), um projeto cada:

| Projeto | Fonte | Situação em 30/10 17h30 |
|---|---|---|
| `entrevista-3-v3` | 3.MOV | edit.ts pronto (53,7 s, qualidade 0 erro), falta conferir no Studio e renderizar |
| `entrevista-3-v5` | 5.MOV | ver `transcricao.json`: se tiver só `[]`, transcrever; depois escrever o edit.ts |
| `entrevista-3-v7` | 7.MOV | idem |
| `entrevista-3-v11` | 11.MOV + 11.1.MOV (um vídeo só, o 11.1 continua o 11) | idem |

## 1. Preparar o PC

1. Projeto atualizado: `git fetch` e `git checkout claude/upbeat-pascal-lv0g2w` e `git pull` (ou clonar
   `https://github.com/augustolemes771-cyber/edicao.git` nessa branch). Depois `npm install`.
2. Copiar os 5 .MOV do Google Drive (`My Drive/edicao-entrevista-3/MOV/`) para `public/projetos/entrevista-3/`.
3. Precisa de ffmpeg (com libplacebo/NVENC se tiver placa NVIDIA; sem ela, use `SEM_GPU=1`) e Node.

## 2. Converter os vídeos (Git Bash, na raiz do projeto)

```
bash scripts/converter-entrevista-3.sh            # os 4 (3, 5, 7, 11)
SEM_GPU=1 bash scripts/converter-entrevista-3.sh  # sem placa NVIDIA (mais lento)
```

Gera `public/projetos/entrevista-3-v<n>/video.mp4` em 1440x2560, 30 qps, SDR.

## 3. Terminar os que faltam (Claude Code)

Peça ao Claude: "continue o entrevista-3 seguindo docs/entrevista-3/CONTINUAR.md". Para cada projeto sem edit:

1. Transcrição (se vazia): `npm run transcrever -- entrevista-3-v<n>`.
2. Pausas: `npm run silencios -- entrevista-3-v<n>`.
3. Ler `node scripts/linhas.mjs entrevista-3-v<n>`, corrigir nomes (o Whisper escreve "Dani Low" para Danilow) e
   escrever o edit.ts tomando `entrevista-3-v3/edit.ts` como base: gancho com o resultado (número 3D), apresentação,
   pergunta, resposta com uma ideia visual por trecho, síntese, CTA (dúvida nos comentários + siga), cartão final;
   no máximo 59 s.
4. `npx tsc --noEmit` e `npx tsx scripts/qualidade.ts entrevista-3-v<n>` até 0 erro.

O zoom do v3 foi feito sem medir o rosto (centro, até 1,3x): conferir no Studio (`npm run studio`) e ajustar `P` no
edit.ts se o rosto não estiver no centro.

## 4. Render final de cada um

```
npm run render -- entrevista-3-v3
```

Para sair mais rápido em 1080x1920: `ESCALA_FINAL=1 npm run render -- entrevista-3-v3` (Git Bash). Teste rápido antes:
`npm run preview -- entrevista-3-v3 --de 0 --ate 3`. Se der "No frame found at position", ver
`biblioteca/temas/entrevista/aprendizado.md` (30/10, entrevista-pista).
