# Desmontagem das referências, segunda leva

Quatro vídeos verticais (720x1280) enviados em 23/10/2026 e desmontados quadro a quadro, com detecção de corte e
folhas de 10 a 20 quadros por segundo nos trechos com efeito. Os vídeos não estão no repositório: são de terceiros
e servem só de estudo.

| Ref. | Duração | Estilo |
|---|---|---|
| 1 | 0:17, 60 fps | tipografia motivacional sobre papel com objetos realistas, luz de janela e palavra fantasma; uma cena escura no meio |
| 2 | 0:17, 30 fps | fala para a câmera, legenda neon verde-limão, risco, anel no rosto, visor REC, pílulas de alerta, glitch |
| 3 | 0:05, 30 fps | papel claro, maços de notas deslizando, lampião aceso e sombra de folhas, texto cinza palavra a palavra |
| 4 | 0:06, 30 fps | fundo preto, palavra gótica dourada, nota e moedas flutuando, foco que viaja pelo texto |

Na referência, os "cenários 3D" são objetos fotorrealistas recortados, com sombra suave no fundo, câmera
se movendo devagar e luz cruzando por cima. **No motor eles são 3D de verdade**: modelados em three.js
(peça de xadrez, moeda, maço de notas, relógio de bolso, lampião), com material físico, reflexo de estúdio e
sombra real projetada no fundo. A câmera faz travelling. Não depende de imagem nenhuma.

## Cenário (peça `cenario`)

Camadas, de trás para a frente:

| Camada | Onde | Como funciona | No motor |
|---|---|---|---|
| Fundo de papel | 1, 3 | bege claro (#ebe9e1) com grão fino | `superficie: 'papel'` |
| Fundo escuro | 1 (7 a 12 s), 4 | quase preto, com um clarão suave no alto | `superficie: 'escuro'` |
| Palavra fantasma | 1 ("MOTIVATION", "DISCIPLINE", "GET UP") | palavra gigante condensada, cinza a ~13%, atrás do objeto, andando devagar para o lado. O objeto cobre parte dela | `fantasma` |
| Objetos 3D | 1 (relógio, rei de xadrez), 3 (notas, lampião), 4 (nota, moedas) | objeto realista com sombra suave para baixo e à direita, flutuando de leve. Entram caindo ou deslizando na diagonal | `objetos: [{tipo, x, y, escala, girar, entra}]` |
| Travelling | 1, 3, 4 | aproximação lenta contínua (~5% na cena) | `camera: {de, ate}` |
| Luz de janela | 1 | faixas diagonais desfocadas de sombra que atravessam tudo, inclusive o objeto | `luz: 'janela'` |
| Sombra de folhas | 3 | silhueta de galhos desfocada, balançando de leve | `luz: 'folhas'` |
| Detalhes | 1, 3, 4 | ✦✦✦ no canto, cometa vertical fino, arcos e linhas de 1 px que se desenham, poeira subindo | `detalhes` (ligado por padrão) |
| Banho de cor | 1 (5,3 s) | a cena esquenta para laranja nos últimos quadros, antes da troca | `tinta: '#ff9a3c'` |

## Tipografia revelada

| Efeito | Onde | Como funciona | No motor |
|---|---|---|---|
| Letra a letra | 1 | linha pequena em serifa editorial ("You don't need") e a palavra grande em sans grossa cinza-escura. Cada letra nova entra desfocada e clara, ~2 quadros por letra, e o bloco cresce ~5% devagar | `estiloTexto: 'editorial'`, `revelar: 'letras'` |
| Fora de ordem | 4 ("Decisions") | as letras da palavra gótica dourada aparecem embaralhadas até completar | `estiloTexto: 'ouro'`, `revelar: 'embaralhado'` |
| Palavra a palavra | 3 | sans cinza: cada palavra aparece por fade; o número entra grande e grosso | `estiloTexto: 'neutro'`, `revelar: 'palavras'` |
| Dourado metálico | 4 | gradiente dourado dentro da letra, com brilho suave em volta | estilo `ouro` |
| Três andares | 1 | pequeno / grande / pequeno ("Motivation / fades / the moment life gets hard") | `pequeno`, `grande`, `abaixo` |

## Transições

| Efeito | Onde | Como funciona | No motor |
|---|---|---|---|
| Vazamento de luz | 1 (6,9 s) | estouro branco-creme e um degradê laranja → magenta → roxo que some revelando a cena escura | `camera: vazamento` |
| Anel de íris | 1 (8,6 s) | anel grosso e desfocado de luz que nasce no centro e se abre até passar da tela | `camera: iris` |
| Mergulho | 1 (11,95 s), 4 (1,6 a 2,5 s) | o quadro cresce rápido e desfoca, como se a câmera atravessasse o texto. A cena seguinte entra desfocada e assenta | `camera: mergulho` |
| Listras de glitch | 2 (4,4 s) | listras verticais pretas e brancas, com estouro de luz, por 3 a 4 quadros | `camera: listras` |
| Corte seco com foco | 1 (2,1 s) | troca seca, e a cena nova abre desfocada | `camera: foco` |

## Fala para a câmera (ref. 2)

| Efeito | Onde | Como funciona | No motor |
|---|---|---|---|
| Legenda neon | todo | palavras pequenas brancas empilhadas e a palavra-chave grande em verde-limão (#d6ff3c) com brilho. Cada palavra entra por fade | `legenda: {estilo: 'neon'}` com `enfase` `grande` |
| Risco | 3,5 s ("Content") | linha vermelha levemente inclinada atravessa a palavra da esquerda para a direita | ênfase `riscar` |
| Anel no rosto | 6,2 s | anel fino de luz creme em volta da cabeça, que entra maior e encolhe | cena `anel` |
| Visor REC | 8,8 a 15 s | cantos de enquadramento, "● REC" piscando, pé da tela escurecido | cena `rec` |
| Alertas | 10,2 s | pílulas vermelhas de vidro com ícone de alerta ou ✕; o texto entra palavra a palavra | cena `alertas` |

## Ainda não reproduzido

- **Texto atrás da pessoa** (ref. 2, 5,6 s: "content" atrás do boné) e o mesmo efeito com a modelo do chapéu
  (ref. 1). Pedem a máscara da pessoa quadro a quadro, como na primeira leva.
- **Objetos que não estão na biblioteca** (girassol, pessoa de chapéu, figura de capuz): são fotos recortadas. O
  motor aceita PNG pela cena `foto`; dá para criar mais objetos 3D por código quando o vídeo pedir.
- **Som:** não dá para ouvir aqui.
