# Tipografia dos posts de referência

Cinco posts estáticos enviados em 23/10/2026. As fontes originais são comerciais ou não identificáveis com certeza;
no motor cada uma foi trocada pela equivalente gratuita mais próxima, embutida em `public/fontes` (OFL, e
Permanent Marker em Apache 2.0). Peças em `src/pecas/Tipografia.tsx`; prova estática:
`npx remotion still prova-tipografia saida.png --props='{"estilo":"bomba"}'`.

| Estilo | Post | Texto | Fonte no motor | Como fica |
|---|---|---|---|---|
| `etiqueta` | "DTM IMTIHONI" | palavra de cima | Anton, #f6b81a | contorno fino (#9a7a1c) deslocado para cima e à esquerda, como impressão fora de registro |
| | | palavra de baixo | Anton, #3b3b3d | mesmo contorno deslocado, mais escuro |
| | | data | Caveat 600, branco | escrita à mão num cartão grafite quadriculado, inclinado 5° |
| | | suporte | — | cartão branco quadriculado inclinado -5°, cantos arredondados, sombra forte; clipe amarelo |
| `bomba` | "IT KIDS GURUHLARIGA" | etiqueta | Montserrat Black itálica, preto | pílula em degradê #ffc21a → #ffa000 com brilho laranja |
| | | título | Barlow Condensed Black itálica | branco → creme, brilho quente em volta; a etiqueta encosta por cima |
| | | apoio | Montserrat ExtraBold itálica, branco | duas linhas pequenas alinhadas à direita, embaixo do título |
| `designer` | "É POR ISSO... Designer" | título | Gloock, #d9d6d0 | caixa alta, desfocado, atrás da pessoa |
| | | ligação | Inter 300 #a9a9a9 + Inter 600 branco | "que você" fino e cinza, "precisa de um" forte |
| | | palavra | Gloock, branco | enorme, sombra escura suave; pílula "ARRASTE" espaçada ao lado |
| `rasgado` | "SÓ VENDER Não é o SUFICIENTE" | topo | Silkscreen Bold | pixel, degradê cinza com contorno #7d7d80 |
| | | meio | Poppins 300, #7a7a7c | sans fina, à direita da pílula escura com seta ↗ |
| | | fim | uma fonte por letra (Permanent Marker, Gloock, Anton, Barlow, Poppins, Silkscreen, Playfair) | letras "recortadas", grafite #454547, uma letra com reflexo arco-íris; traço de pincel com seta embaixo |
| `cassino` | "CHANCE $500 Turn Thousand" | fundo | Playfair Display 800, comprimida (scaleX 0,78) | caixa alta, degradê verde #a6d45a → #5c8f24, cada linha ocupa a largura toda |
| | | script | Yesteryear, branco | por cima do verde, levemente desfocado, com brilho branco |
| | | legenda | Montserrat 500, #d7e6a6 | caixa alta pequena, acima |

Sem equivalente gratuito fiel: o "Designer" original tem um "r" com floreio; o "SUFICIENTE" usa letras desenhadas
à mão. As trocas mantêm proporção, peso e contraste.
