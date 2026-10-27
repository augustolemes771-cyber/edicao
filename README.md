# Edição de vídeo com Remotion

Motor de edição do canal Mateus Dias (@ddiasmatt) em [Remotion](https://www.remotion.dev): você escreve as cenas
em TypeScript, sincronizadas pela palavra falada, e renderiza em 4K no seu computador. Não há crédito nem custo
por vídeo.

Três frentes:

- **Horizontal (YouTube)**, com a identidade do canal: preto, branco e verde-azulado `#00A8A3`, grade curva com
  pontos, estrela de 4 pontas com glow e aberração cromática, moldura tracejada "Passo 1", título branco com glow
  e franja RGB. Também segue a curva de intensidade da skill.
- **Vertical (Reels, Shorts, TikTok)**, com os efeitos aprendidos nas referências: legenda palavra por palavra,
  ênfases, cartelas, zoom, foco, clarão, chicote, comentários e B-roll. Veja
  [docs/referencias/desmontagem.md](docs/referencias/desmontagem.md).
- **Cenários 3D cinematográficos** sem filmagem: objetos 3D de verdade (peça de xadrez, moedas, notas, relógio,
  lampião) sobre papel ou fundo escuro, com sombra real, luz de janela, palavra fantasma e tipografia revelada,
  além da legenda neon e das transições de luz. Veja
  [docs/referencias/desmontagem-2.md](docs/referencias/desmontagem-2.md).

## Painel de edição (qualquer PC, qualquer conta do Claude)

**Primeira vez em um PC:** instale o [Node.js](https://nodejs.org) e o Git, baixe esta pasta (`git clone https://github.com/augustolemes771-cyber/edicao.git`)
e dê **dois cliques em `Abrir Painel.command`** (Mac) ou **`Abrir Painel.bat`** (Windows). Ele instala o resto, pede o login da
sua conta do Claude e abre o painel no navegador. **Nas próximas vezes:** os mesmos dois cliques.

No painel: biblioteca (templates, peças, 3D, sons, fontes) à esquerda, conversa no centro, prévias à direita. Você pede,
o Claude edita e cria elementos novos, que ficam na biblioteca. **⬆ Salvar na nuvem** envia tudo ao GitHub e **⬇ Atualizar**
traz em outro computador. Vídeos brutos (`*.mp4`) não vão para o git: copie-os para `public/projetos/<nome>/`.
O painel só aceita conexões do próprio computador e exige o código do endereço (o navegador já abre com ele).

## Instalar (uma vez)

No Mac:

```bash
brew install node ffmpeg
git clone https://github.com/augustolemes771-cyber/edicao.git
cd edicao
npm install
```

## Ver os exemplos

```bash
npm run studio
```

O Remotion Studio abre no navegador com dois projetos de exemplo: `exemplo` (horizontal, identidade do canal) e
`reels-exemplo` (vertical, efeitos das referências). Eles não têm vídeo: a câmera aparece como um quadro cinza
escrito CÂMERA. Problemas no plano (âncora que não existe, vão de câmera) aparecem em vermelho no canto.

## Editar um vídeo

```bash
npm run novo -- meu-video              # ou: npm run novo -- meu-video --vertical
# copie o vídeo decupado para public/projetos/meu-video/video.mp4
npm run transcrever -- meu-video       # transcrição palavra por palavra
npm run roteiro -- meu-video           # docs/meu-video/: frases, palavras, notas faladas
# escreva as cenas em src/projetos/meu-video/edit.ts (ou peça para o Claude)
npm run conferir -- meu-video          # âncoras, curva, vãos de câmera, impactos
npm run preview -- meu-video           # prévia 720p em out/ (--de 50 --ate 58 só o trecho; --res 540 mais rápido)
npm run render -- meu-video            # final em 4K, 50 Mbps, -14 LUFS, em out/
```

**Transcrição grátis:** sem configurar nada, o `transcrever` usa o whisper.cpp no seu computador. Na primeira vez
ele baixa o programa e o modelo (~1,6 GB). Se você tiver uma chave do ElevenLabs, rode
`ELEVENLABS_API_KEY=... npm run transcrever -- meu-video` para usar o Scribe, que é mais preciso.

**Texto atrás da pessoa e troca de fundo:** rode `scripts/recortar.py <projeto>` (instruções no topo do arquivo)
e use cenas com `modo: 'atras'`, como a `gigante`.

**Trilha:** `npm run musica -- meu-video trilha.mp3` normaliza a música. No `edit.ts`, coloque
`musica: {arquivo: 'musica.m4a'}`. Ela toca ~22 dB abaixo da voz.

## Como uma cena é escrita

```ts
cenas: (b) => [
  // b.at('palavra') = início da palavra falada; b.say('frase') = início e fim da frase
  {tipo: 'titulo', texto: 'Editei com o *Claude*', de: b.at('editei'), ate: b.at('não')},
  {tipo: 'numero', valor: '3', legenda: 'passos', de: b.at('três'), ate: b.at('Primeiro'), fundo: 'verde'},
],
```

Tipos de cena, do canal: `titulo`, `numero`, `lista`, `passo`, `estrela`, `logo3d`, `painel`, `tela`, `imagem`,
`despedida`. Das referências: `cartao`, `letras`, `kicker`, `foto`, `comentarios`, `icone`, `broll`, `preto`,
`checklist`, `cenario`, `anel`, `rec`, `alertas`.
Os campos de cada tipo estão em [src/motor/plano.ts](src/motor/plano.ts).

## Pastas

| Pasta | O que tem |
|---|---|
| `src/motor/` | identidade (`tema.ts`), sincronia por palavra e cortes (`palavras.ts`), plano e regras (`plano.ts`), curva |
| `src/pecas/` | peças visuais: grade, estrela, moldura, título, legenda, cartelas das referências |
| `src/projetos/` | um `edit.ts` e a transcrição por vídeo |
| `public/projetos/` | vídeo, imagens e trilha de cada projeto (o vídeo não vai para o GitHub) |
| `public/sfx/` | efeitos sonoros (gerados com `npm run sfx`; troque pelos seus mantendo os nomes) |
| `public/fontes/` | Poppins, Playfair Display, Unbounded, Inter, Anton, DM Serif Display e UnifrakturMaguntia, todas com licença OFL |
| `docs/referencias/` | desmontagem dos vídeos de referência |

## Licença do Remotion

O Remotion é grátis para pessoas físicas e para empresas com até 3 funcionários. Acima disso, a empresa precisa da
licença deles: [remotion.pro/license](https://www.remotion.pro/license).
