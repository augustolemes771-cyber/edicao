# gota-1: storyboard ("Você é uma gota de água")

Folha com os quadros: `docs/gota-1/storyboard.jpg` (quadros soltos: `plano-N.jpg`). Os quadros são do animatic
`gotaStoryboard` (`src/projetos/gota-1/storyboard.tsx`), que já roda a fala inteira com câmera contínua.

## O cenário (cidade.tsx)
Uma cidade-maquete só, em bloco de terra cortado (como o aterro da ref8). A **face da frente** e a **face da esquerda**
são cortes: mostram o que está enterrado. Prédios com processo dentro são abertos na frente (casa de boneca).
O caminho é um anel em sentido horário, visto de cima:

```
   fundo:      RIO  ←←←←←←←←←←←←←←←←←←←←←←←←←  (sai da ETE)
               ↓ captação (bomba)                     ↑
   esquerda:   ETA (filtro → cloro)                   ↑ canal pela lateral direita
               ↓ caixa d'água (torre)                 ↑
               ↓ rede enterrada (corte esquerdo)      ↑
   frente:     CASA → cano → esgoto sob a rua (corte) → ETE (grade → aeração → decantador)
```

Sujo (marrom/laranja) da casa até o rio; limpo (azul) do rio até a torneira. Bolinhas andando pelo trajeto
inteiro mostram o sentido do fluxo. Câmera e gota seguem UMA linha do tempo com interpolação Hermite monotônica
(passa pelas chaves sem tranco e sem ultrapassar); nos trechos de perseguição a câmera é presa na gota.

## Planos

| # | Tempo | Fala | Câmera | Processo demonstrado (causa → efeito) | Transição para o próximo | Rótulo |
|---|---|---|---|---|---|---|
| 1 | 0,0–2,3 | "Você é uma gota de água." | Vista de cima da maquete inteira, de frente. | A linha do trajeto se desenha do vaso até a torneira (laranja até o rio, azul depois): o espectador vê o caminho todo antes de começar. | Mergulho contínuo da vista aérea até o banheiro da casa (a linha some). | Pílulas: CASA, ESGOTO, ESTAÇÃO DE ESGOTO, RIO, CAPTAÇÃO, ESTAÇÃO DE ÁGUA, CAIXA D'ÁGUA |
| 2 | 2,3–5,0 | "E alguém acabou de dar descarga em você." | Casa em corte: banheiro em cima (vaso, pia, box), sala embaixo; empurra devagar para o vaso. | Botão da descarga afunda e acende (3,3 s) → água do vaso gira em redemoinho e baixa → gota assusta e é puxada. | A câmera desce junto com a gota pelo cano. | Pílula "VOCÊ" na gota |
| 3 | 5,0–12,7 | "Você desce pelo cano da casa… tubo enorme embaixo da rua. Esse é o esgoto." | Presa na gota: desce pelo cano (cortado ao meio) na frente da sala, atravessa o piso, entra no corte da terra, ramal inclinado, cai no coletor; abre (fov 50) para mostrar a rua com carros em cima e o coletor embaixo. | Cano da casa → ramal → coletor grande (tubo 4× maior que a gota, esgoto marrom no fundo). Poços de visita com escada ligam a rua ao tubo. | Segue pelo coletor para a direita. | Pílulas CANO DA CASA, RUA; título ESGOTO (11,5 s) |
| 4 | 12,8–16,8 | "Depois de quilômetros no escuro, você chega numa estação gigante." | Corre pelo coletor (passam poços de visita) e sobe pelo poço de chegada até uma vista alta da ETE de frente-esquerda. | Fluxo marrom no tubo; o esgoto sobe na caixa de chegada; aparecem os três equipamentos em fila (grade, tanque, decantador). | Desce para o canal da grade. | Título ESTAÇÃO DE TRATAMENTO DE ESGOTO (15,1 s) |
| 5 | 16,9–24,2 | "Grades de ferro seguram o lixo grande: plástico, pano, até celular. Esse é o gradeamento." | De frente-esquerda do canal: as barras inclinadas aparecem como um pente. | Garrafa, pano e celular presos do lado de cá das barras; a gota passa entre elas (assustada). O rastelo amarelo sobe a grade e leva o lixo para a caçamba (21,6–23,6 s). | Trilha para a direita até o tanque. | Pílulas GRADE DE FERRO, PLÁSTICO, PANO, CELULAR (na palavra); título GRADEAMENTO |
| 6 | 24,3–32,1 | "Tanques cheios de bactérias famintas que comem a sujeira… Esse é o tratamento biológico." | Tanque de aeração em corte, de frente. | Ar sobe dos difusores em bolhas → bactérias (verdes, com boca abrindo) comem as manchas marrons, que somem (27,3–30,2 s); a água passa de marrom para verde-claro e a gota fica menos suja. | Gota sai pelo cano de vidro; câmera trilha para a direita. | Pílulas AR, BACTÉRIAS; título TRATAMENTO BIOLÓGICO |
| 7 | 32,2–40,5 | "O que sobrou de sujeira afunda… Você, mais limpa, sai por cima. Essa é a decantação." | Decantador circular cortado ao meio, de frente. | Partículas descem devagar e o lodo cresce no funil do fundo (32,4–35 s) → a gota sobe e transborda pela canaleta amarela (37,6 s). | Sobe alto e segue o canal pela lateral direita até o rio. | Pílulas LODO, ÁGUA MAIS LIMPA; título DECANTAÇÃO |
| 8 | 40,6–48,1 | "Aí você é devolvida pro rio… puxada de novo por uma bomba. Essa é a captação." | Atrás da gota olhando rio abaixo (o rio atravessa a tela de baixo para cima; gota ampliada para ler de longe); passa sob a ponte; termina baixo, de frente-esquerda, na bomba. | Água do canal cai no rio → corrente leva a gota → tomada d'água com grade → cano → bomba (rotor girando) puxa para cima. | A câmera vira para a ETA ao lado. | Pílulas RIO, BOMBA; título CAPTAÇÃO |
| 9 | 48,2–55,6 | "Na estação de água, você é filtrada na areia e recebe um pouco de cloro… Esse é o tratamento." | Filtro em corte de frente (camadas na vertical: água, areia, cascalho, fundo) → trilha à direita para o tanque de contato. | Gotas descem pela areia; a sujeira fica presa no topo da areia (cresce 49,6–51 s); a gota sai limpa pelo fundo. Cloro pinga do cano amarelo → micróbios roxos estouram (52,3–53,3 s). | Câmera presa na gota sobe junto pela torre. | Pílulas AREIA, CASCALHO, CLORO, MICRÓBIOS; título TRATAMENTO |
| 10 | 55,7–62,8 | "E daqui a alguns dias você sai de novo pela torneira de alguém. Talvez a sua." | Sobe pela torre (cano de vidro) até a caixa d'água aberta; desce e corre pela rede no corte esquerdo da maquete; entra na cozinha; close na torneira e no copo; volta para o mapa. | Caixa d'água → rede enterrada → cano sobe na bancada → gota sai da torneira para o copo (58,6 s). "Talvez a sua": a câmera recua até a vista do plano 1 e a linha se desenha de novo — é a MESMA casa do começo. | Fim (mesmo enquadramento da abertura). | Pílulas CAIXA D'ÁGUA, TORNEIRA; no fim as pílulas do mapa |

Quadros na folha: 1, 2, 3 (cano da casa), 3b (coletor sob a rua), 4, 5, 6, 7, 8 (rio), 8b (bomba), 9 (filtro),
9b (cloro), 10 (torneira), 10b (mapa final).

## Para animar de verdade (próximos passos)
- O animatic já tem tempos, câmera e estados. Falta polir: empurrões de câmera nos momentos-chave, sons
  (whoosh nas viagens, pop nas pílulas, descarga, borbulhas, bomba), e o gesto da gota em cada processo.
- Rótulos de processo seguem a ref8 (título amarelo no topo); pílulas brancas com ponto seguem ref1/ref2.
