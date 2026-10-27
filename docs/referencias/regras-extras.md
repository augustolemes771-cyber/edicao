# Regras extras da skill editar-video

Seções movidas da skill para gastar menos limite. Leia só a do assunto.

## Regras do canal (horizontal)

- **Identidade:** preto `#030405`, branco e `#00A8A3`. O destaque em texto sobre preto é `#12d4cd` com halo
  `#00A8A3`; fonte Poppins. Fundo com grade curva e pontos em ~70% das telas cheias, verde-azulado com texto branco
  e destaque preto em ~20%, branco só pontual. Assinatura em toda seção: `estrela`, `passo`, `logo3d`.
- Glow só no elemento: nada de mancha de luz, vinheta ou degradê no fundo.
- **Curva de intensidade** (`t1` 30 s, `t2` 2:30):
  - 0 a 30 s: frenético, evento novo a cada 0,3 a 0,6 s, cobertura de 85% a 95%;
  - 30 s a 2:30: descida de ~85% para ~40%;
  - depois de 2:30: 20% a 35% animado, só onde a fala pede tela.
  Se ele pediu efeito em voz alta, a cena leva `pedidoFalado: true` e pode passar da faixa.
- **Impacto e som:** depois de `t2` o motor desliga punch, tremor, clarão e boom. O som `punch` nunca toca: antes de
  `t2` vira `swish`.
- **Câmera nunca pisca:** entre duas cenas cheias, emenda abaixo de 0,6 s ou câmera crua de 3 s ou mais. O motor
  emenda sozinho e avisa no `conferir`.
- **Número falado** entra junto com a fala, como ele fala, sem conferir se o número está certo e sem inventar número.
- **Tela do computador gravada:** use a cena `tela`, que põe o Mateus no balão do canto. Por cima, só `painel`
  (estreito, na lateral) ou `passo` pequeno em faixa vazia.
- **Margens:** a área segura já conta 80 px do topo, 100 px das laterais e o punch de 6%. Não posicionar texto fora
  dela.
- **Tela final:** `telaFinal: (b) => b.say('aqui no final').inicio`. Dali em diante, só `despedida`.
- **Voz intacta.** A trilha fica ~22 dB abaixo da voz (`npm run musica`).


## Texto atrás da pessoa e troca de fundo (23/10/2026)

- Recorte: `scripts/recortar.py <projeto>` (MediaPipe 0.10.14, Python 3.11; o modelo vem no pacote) gera
  `public/projetos/<projeto>/pessoa.webm` com alfa. No `edit.ts`: `recorte: 'pessoa.webm'`.
- Qualquer cena com `modo: 'atras'` fica entre o vídeo e a pessoa. `gigante` já nasce atrás; um `cenario` com
  `modo: 'atras'` troca o fundo do quarto por um cenário 3D (a legenda continua).
- Palavra gigante: no máximo duas linhas, `y` ~0,15 para a primeira linha sair por cima da cabeça e a segunda
  passar atrás do cabelo. Plano aberto (zoom 1) enquanto ela estiver na tela; com zoom fechado a cabeça cobre
  a palavra.
- Troca de fundo (`cenario` com `modo: 'atras'`) em vídeo caseiro com o recorte do MediaPipe ficou artificial
  (borda escura no cabelo, borrão na mão em movimento, objetos soltos). O usuário reprovou em 23/10/2026: não usar.
  Texto atrás da pessoa funciona; fundo trocado, não.
- Cor de destaque sobre a roupa: dourado e amarelo somem na blusa vermelha; usar `serif` branca.
- Estilo aprovado para textos grandes (23/10/2026): `gigante` com `linhas` (frase pequena branca + palavra grande)
  em neon com profundidade (`NeonProfundo`, Poppins Black, extrusão 3D), `paleta: 'dourado'`; o mesmo no
  `retrato` (`paleta`). Atrás da pessoa, o bloco vai na faixa de cima (`y: 0`, `tamanho` ~0,21): a frase pequena
  fica livre e só a base da palavra grande passa atrás do cabelo. Antes de animar um estilo novo, mandar a prova
  estática (`npx remotion still prova-texto`) para aprovação.
- Frase gigante de duas palavras numa linha só, acima da cabeça (`tamanho` ~0,15, `y` ~0,09), quando a segunda
  linha ficaria inteira atrás dela.
- Texto dos cenários monta inteiro em ~0,3 s no começo da cena. Não sincronizar letra por letra com a fala
  (pedido do usuário em 23/10/2026: ficava atrasado).

## Cenários 3D e estilo neon (23/10/2026)

- Catálogo em `docs/referencias/desmontagem-2.md`; modelos em `cenarios-exemplo` e `neon-exemplo`.
- `cenario` monta tipografia cinematográfica sem filmagem: `superficie` papel ou escuro, `fantasma` atrás,
  `objetos` 3D (`rei`, `moeda`, `notas`, `relogio`, `lampiao`) com sombra real, `luz` janela ou folhas,
  `pequeno`/`grande`/`abaixo` com `estiloTexto` editorial, ouro ou neutro. Objeto grande ao lado do texto pede
  `ladoTexto`.
- Posição dos objetos em tela: x de -1 a 1 e y de -1 a 1. Conferir em still que nenhum objeto cobre o texto
  depois da entrada.
- Transições entre cenários: `vazamento`, `iris`, `mergulho`, `listras`, `flash`, `chicote`, `foco`.
- O 3D precisa de WebGL (`Config.setChromiumOpenGlRenderer('angle')` já está no `remotion.config.ts`). Na nuvem,
  sem placa de vídeo, 16 s de cenário levaram 9,5 min em 720p: renderizar stills para revisar e só depois o vídeo.
- Fala para a câmera no estilo da ref. 2: `legenda: {estilo: 'neon'}` com `grande` nas palavras-chave e `riscar`
  na palavra negada, mais `anel`, `rec` e `alertas`.

## Depoimentos e cortes de conteúdo (22/10/2026)

- Estrutura que prende até o fim: gancho com o resultado → dor (antes) → virada (quem ajudou) → transformação →
  o que aprendeu (`checklist`) → resultado concreto → suporte → agradecimento → fechamento com o próximo passo.
  `barraProgresso: true` no topo.
- Cortes de conteúdo são numéricos, mas cada borda cai num silêncio medido no áudio (energia abaixo de -38 dB em
  janelas de 10 a 30 ms). O tempo de palavra do Whisper erra ~0,3 s: não cortar pela palavra.
- Depois de definir os cortes, juntar só o áudio dos trechos, transcrever de novo e ler as emendas. Em 22/10 isso
  pegou um "e de" que sobrou e um "valeu" que tinha sumido.
- Palavra cuja duração do Whisper invade um trecho mantido aparece como legenda fantasma: ajuste o fim dela na
  transcrição para o começo do silêncio.
- Zoom de emenda em `b.emendas[i]` (quadro exato do corte), nunca na palavra seguinte: senão o pulo aparece por 3 a
  5 quadros.
- Cor de destaque com contraste sobre a roupa (vermelho some em blusa vermelha).
- Na nuvem o modelo do whisper.cpp não baixa (huggingface bloqueado). Funciona o pacote npm `sts-whisper-small`
  (instalar com `--ignore-scripts` no rascunho) com `@huggingface/transformers` e `return_timestamps: 'word'`.

