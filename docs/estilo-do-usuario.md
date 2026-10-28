# Livro de estilo do usuário (Mateus Dias)

Destilado do histórico de pedidos, das reprovações e dos aprovados (temas Entrevista, Depoimentos, Motions, Aleatórios).
O editor lê este arquivo no começo de todo vídeo. Regras novas entram aqui com data.

## Em uma frase
Cinematográfico com sentido: cada efeito nasce do que é dito, tem acabamento de produção e aparece em cima da palavra certa.
Qualidade e volume juntos: o vídeo sai em blocos de ~10 s, sem parar, sem poluir.

## Ritmo
- Início chamativo: gancho com o resultado (número + prazo) nos primeiros ~3 s.
- Um evento visual a cada ~2 s (zoom de emenda, chip, cartão, troca de falante). Mais denso no começo; CTA pode ficar parado.
- Cortes rápidos, zoom em cada emenda (≤ 1,35 sobre fonte 1080); chicote só na troca de falante; flash só em 2 viradas.
- Legenda palavra por palavra no meio da tela (y≈1260), palavra falada muda de cor. Um texto por vez. Legenda some se o cartão repete a fala.
- Roteiro em ordem de história: gancho → apresentação → dor → pergunta → virada → lição → crédito → CTA → cartão final. Dor antes do sucesso.

## Paleta e tipografia
- Entrevista: roxo profundo `#1E0F3A` + ouro `#E8C27A` + vidro claro. Sans pesada maiúscula (Montserrat/Poppins) e ênfase em serifa itálica dourada (Playfair).
- Dor/revolta: vermelho profundo + ciano só como aberração cromática. Nada de neon fora dos temas que pedem.
- Canal horizontal: preto, branco e `#00A8A3`.
- Cor de destaque com contraste sobre a roupa da pessoa.

## Emoção/tema → efeito (receitas)
| O que é dito | Efeito | Peça |
|---|---|---|
| Dor, sofrimento, revolta ("nunca mais", "chorei", "frustrava") | Frase grande estática, palavra por palavra, tremida + glitch + aberração vermelha/ciano + vinheta vermelha pulsante. Sem zoom de câmera. Som grave só aqui. | `frase` com `dor: true` / `ImpactoDor` |
| Solidão, vazio, ninguém assistindo | Live vazia, vinheta roxa que fecha, anel dourado no contador; o olho do contador vira olho 3D dourado/branco que voa ao centro com legenda 3D ("SÓ 1 ESPECTADOR") | `live` com `drama`/`olho3d` / `ObjetoVoaAoCentro` |
| Número, dinheiro, resultado | Número 3D em ouro com mola por letra, onda e faíscas; som curto e claro (pop/swish/tick), nunca grave | `numero3d` / `Texto3DImpacto` |
| Prazo ("1 ano", "menos de 1 mês") | Selo grande no centro, um por vez | `selo` |
| Lista/critérios | Chips um por vez; quantidade vira cards que caem | `chips` |
| Virada, "é outra coisa" | Frase grande com palavra-chave em serifa dourada + clarão branco (só 2 por vídeo) | `frase` |
| Nome de pessoa/marca | Pílula com o nome | `selo`/`siga` |
| Pergunta | Plano aberto, sem efeito pesado | câmera |
| Conquista, celebração | Faíscas douradas, texto 3D ouro | `Texto3DImpacto` |
| CTA | Só no fim e falado: "SIGA <nome>" um por vez + caixa de comentário digitando | `siga`, `comentario`, `final` |

## Quando usar 3D (three.js)
Só onde faz sentido: gancho do número, cena VS, cartão final e UM efeito por ideia forte ligada à fala (contador, olho, texto de impacto).
Texto 3D = letras extrudadas de verdade (`Texto3DImpacto`/`Linha3D`), nunca CSS com text-shadow. Objeto precisa ter origem e destino
(sai de algo que existe na tela e voa ao centro). Na nuvem o 3D precisa de WebGL: conferir por still.

## Intensidade
Dor: máxima por 1 a 3 s, depois alívio. Resto: média. Evento forte (3D, clarão, grave) no máximo 1 por bloco de 10 s.

## O que ele NÃO gosta (reprovado)
- Símbolo solto (moeda, coração, estrela, raio) em canto; celular 3D genérico; fonte gótica; clip-art.
- Estilos misturados no mesmo vídeo (famílias de pílula/kicker diferentes).
- Iluminação dramática genérica (vinheta fria azul, só escurecer, tinta roxa): pedir imagem de referência antes.
- Som grave/drone em número/gancho ("macabro"); sino, plim, moedinha, shimmer. Som 20 dB abaixo da voz, ≤ 1 a cada ~2 s.
- Vídeo borrado: nunca reduzir para 1080 nem dar zoom > 1,35 sobre 1080.
- Cortar pela palavra do Whisper (erra ~0,3 s): sempre no silêncio medido. Palavras duplicadas por trechos sobrepostos.
- Sucesso contado antes da dor; efeito sem ligação com a fala; tela poluída; legenda no canto.
- Troca de fundo com recorte (reprovada).

## Antes de criar peça nova
Procure em `src/pecas/efeitos/` e `src/pecas/` primeiro. Se nada servir, crie a peça nova com mola, sombra suave e paleta do tema, e registre em `biblioteca/itens`.
