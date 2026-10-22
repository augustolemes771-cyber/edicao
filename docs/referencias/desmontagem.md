# Desmontagem das referências

Três vídeos verticais (720x1280) enviados em 22/10/2026, desmontados quadro a quadro
(detecção de corte, folhas de 2 a 13 quadros por segundo nos trechos com efeito).
Os vídeos não estão no repositório: são de terceiros e servem só de estudo.

| Ref. | Duração | Quadros | Estilo |
|---|---|---|---|
| 1 | 1:45 | 30 fps | professor na mesa, legenda em serifa com dourado, muitos B-rolls e troca de fundo |
| 2 | 0:15 | 24 fps | entrevista, legenda pequena e ênfase gigante amarela, cartelas escuras |
| 3 | 0:20 | 30 fps | fala direto para a câmera, legenda grossa palavra por palavra com ênfases |

Cada efeito abaixo diz onde aparece, como funciona e qual peça do motor o reproduz.

## Legenda

| Efeito | Onde | Como funciona | No motor |
|---|---|---|---|
| Palavra por palavra com desfoque | 1, 2, 3 | cada palavra entra no início da fala: desfoque ~10 px → 0, opacidade 0 → 1 e sobe ~8 px em 5 a 6 quadros. As palavras da mesma tela ficam empilhadas, com entrelinha apertada (~0,9) | `legenda` no `edit.ts` |
| Saída por desfoque | 1, 3 | quando a próxima tela começa, a anterior desfoca e some em ~4 quadros | automático |
| Tela de legenda | 3 | 1 a 4 palavras; quebra na pontuação e nas pausas | `palavrasPorTela` |
| Ênfase em serifa itálica | 1, 2, 3 | uma palavra da frase troca de fonte: sans grossa → serifa itálica (ref. 3 "Não", "tempo") | `estilo: 'serif'` |
| Ênfase colorida | 3 (vermelho), 1 (dourado) | serifa itálica na cor de destaque ("desculpa", "trancar", "loucura") | `estilo: 'cor'` |
| Caixa atrás da palavra | 3 | retângulo vermelho atrás da palavra branca, abre da esquerda para a direita em ~6 quadros ("Não") | `estilo: 'caixa'` |
| Elipse feita à mão | 3 | traço verde fino desenha uma elipse irregular em volta da palavra em ~8 quadros ("tempo.") | `estilo: 'circulo'` |
| Palavra grande | 1, 2 | a palavra-chave vira caixa alta e dobra de tamanho, sozinha na linha ("DECISÃO", "OS SEUS PAIS", "EMOÇÃO") | `estilo: 'grande'` |
| Ênfase que acende | 2 | a palavra grande entra em dourado escuro e acende para amarelo vivo com glow em ~10 quadros ("Do controle") | estilo `impacto` |
| Dois andares | 1, 2 | linha pequena em sans em cima, palavra grande em serifa embaixo, encostadas ("EU / Controlo isso", "É a faculdade que / OS SEUS PAIS") | cena `kicker` |
| Posição | todas | centro da legenda a ~60% da altura, na altura do peito, nunca no rosto | `altura` |

Estilos prontos: `palavra` (ref. 3), `ouro` (ref. 1) e `impacto` (ref. 2).

## Cartelas

| Efeito | Onde | Como funciona | No motor |
|---|---|---|---|
| Palavra única em tela escura | 2 (1,6 s; 6,0 s) | corte seco para um fundo cinza quase preto, com o centro um pouco mais claro. Uma palavra em sans larga e grossa, amarela com glow. A palavra troca seco na hora da fala ("SE" → "PERGUNTE"), sem animação | cena `cartao` |
| Letra por letra | 2 (9,0 s) | "SÓ RAZÃO" acende letra a letra da esquerda para a direita (~2 quadros por letra, cada uma desfocada → nítida). A segunda linha, menor e dourada, faz o mesmo depois | cena `letras` |
| Respiro em preto | 2 (2,9 s) | ~1 s de preto puro entre duas falas, para dar peso | cena `preto` |
| Cartão branco com ícone | 1 (34,8 s) | tela branca, ícone simples no centro e legenda pequena em serifa ("E não é medicina,") | cena `icone` |

## Câmera

| Efeito | Onde | Como funciona | No motor |
|---|---|---|---|
| Puxada de foco | 2 (início e volta das cartelas) | o vídeo entra muito desfocado e fica nítido em ~0,4 s | `camera: foco` |
| Zoom em corte seco | 1, 3 | troca entre plano aberto e fechado (~1,3x) no começo da frase. Disfarça os cortes da decupagem | `camera: zoom` |
| Zoom lento | 1 | aproximação contínua enquanto conta a história | `zoom` com `suave` |
| Clarão | 3 (11,15 s) | 2 a 3 quadros de luz estourada creme na troca de assunto, junto com um corte | `camera: flash` |
| Chicote | 1 (46 s; 1:35) | 1 a 2 quadros de borrão horizontal forte na troca de plano | `camera: chicote` |
| Desfoque atrás da imagem | 1 (10,5 s) | quando uma imagem salta na frente, a câmera desfoca e escurece | automático na cena `foto` |

## Sobreposições e B-roll

| Efeito | Onde | Como funciona | No motor |
|---|---|---|---|
| Imagem que salta | 1 (mapa do Brasil) | a imagem recortada cresce de 0 com sobra de mola e glow suave em volta | cena `foto` |
| Comentários subindo | 1 (14 a 16 s) | prints de comentários sobem do rodapé um por um, sobre um escurecimento no pé da tela. Ao mesmo tempo a câmera abre o plano | cena `comentarios` |
| B-roll em tela cheia | 1 (46 a 74 s) | imagens cinematográficas em tela cheia com zoom lento. A legenda continua por cima | cena `broll` |
| Arroba no fim | 1 (1:40) | o @ do criador em serifa abaixo da legenda | cena `kicker` ou `despedida` |

## Ainda não reproduzido

- **Troca do fundo atrás da pessoa** (ref. 1, 0 a 4 s e 24 s): a pessoa é recortada e o fundo do estúdio vira a foto
  da faculdade. **Palavra gigante atrás da pessoa** (ref. 1, 45,6 s, "EXCLUSIVA" desfocada atrás dele) usa o mesmo
  recorte. Os dois pedem uma máscara da pessoa quadro a quadro. Dá para gerar de graça no computador com o
  Robust Video Matting ou o rembg e depois usar no Remotion. É o próximo passo se você quiser esses efeitos.
- **As imagens de B-roll** da ref. 1 parecem geradas por IA. O motor só monta. As imagens vêm de banco gratuito
  (Pexels, Unsplash), de uma IA ou de prints seus.
- **Som:** não dá para ouvir aqui. Os efeitos sonoros do motor (`public/sfx/`) são genéricos e gerados com ffmpeg.
  Troque pelos seus mantendo os nomes.
