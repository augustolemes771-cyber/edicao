# Analisar um vídeo de referência (modelo) e replicar o ESTILO, não o vídeo

Objetivo: entender POR QUE cada efeito existe (o que na fala o disparou, que emoção ou função ele cumpre, por que ESTE elemento e não outro, por que
naquele instante) e transformar isso em uma gramática que gera edições novas com a mesma qualidade e sensação. Nunca copiar efeito por efeito.

## 1. Coletar evidências
`npm run analisar-referencia -- <video> <nome>` → `out/analise-<nome>/` (ficha, cortes, áudio, eventos, folhas de quadros, visão geral).
Leia `eventos.json` e olhe as folhas (Read nas imagens `folhas/ev*.jpg` e `visao-geral-*.jpg`). Transcrição com tempos: crie um projeto de apoio
(`npm run novo -- ref-<nome>`), `npm run transcrever -- ref-<nome> <video>` e `npm run roteiro -- ref-<nome>`. Cruze cada evento com a palavra falada nele.
Onde a folha não bastar, extraia mais quadros do trecho com ffmpeg (`-ss <t> -t 1 -vf fps=15`). Não afirme o que não viu: marque "(inferido)".

## 2. Escrever a análise
Salve em `biblioteca/temas/<tema>/modelos/<nome>.md` com estas seções:

1. **Ficha e arco:** duração, formato, ritmo (cortes/min, eventos/s), arco emocional em fases (gancho → dor → virada → ...), com o tempo de cada fase.
2. **Linha do tempo de efeitos.** Uma linha por efeito: `t | o que é (peça, cor, posição, 2D/3D) | gatilho na fala (palavra exata e atraso em ms entre a palavra e o início do efeito) | função (chamar atenção, provar, dar peso, aliviar, explicar) | POR QUE este efeito e não outro | como entra e sai (duração, curva, mola) | camadas simultâneas | som que o acompanha | onde fica na tela (zona de leitura)`.
3. **Por que os elementos 3D:** para cada 3D, qual ideia da fala ele materializa, por que 3D e não 2D, por que naquele ponto (e por que não em outros).
4. **Quando NÃO usou efeito:** os respiros, os planos limpos. Entender onde ele para é metade do estilo.
5. **Auditoria de qualidade (nota 0–5 em cada, com evidência de tempo):** legibilidade (leio olhando o rosto?), sincronia (efeito dentro de ±100 ms da palavra?), acabamento (entrada e saída suaves, sem cortes bruscos, tipografia, sombra, alinhamento), coerência (uma família visual: paleta, fontes, formas), densidade (camadas por segundo sem poluir), som (nível, frequência, combina com o efeito), resolução e nitidez. Liste também defeitos que NÃO devem ser replicados.
6. **Gramática do estilo (o que se transfere):** regras no formato `QUANDO <gatilho na fala/estrutura> → FAZER <efeito de função X> COM <parâmetros: atraso, duração, curva, zona, camadas, som> PORQUE <razão>`. Inclua números: eventos/s por fase, atraso típico, duração de entrada e de permanência, máximo de elementos ao mesmo tempo, intensidade por emoção.
7. **O que é específico deste vídeo (não copiar):** nomes, marcas, objetos, cores ligadas ao tema do vídeo, piadas, imagens do assunto.

## 3. Destilar
Do item 6, acrescente no máximo 5 linhas datadas em `biblioteca/temas/<tema>/aprendizado.md` e, se mudar o padrão do tema, ajuste `prompt-base.md`.
Receitas gerais (valem para qualquer tema) vão para `docs/estilo-do-usuario.md`. Peça que o modelo tem e o motor não tem: criar em `src/pecas/` com acabamento igual.

## 4. Replicar em outro vídeo
1. Leia a análise do modelo, a transcrição e o roteiro do vídeo novo.
2. Marque o arco do vídeo novo e, em cada fala, a FUNÇÃO (gancho, dor, número, virada, prova, CTA...), não a imagem do modelo.
3. Escreva o plano de equivalências: `fala nova | função | efeito escolhido | regra da gramática | por que combina com ESTA fala`. Se o assunto pede um elemento que o modelo não tem (outro objeto 3D, outra metáfora), invente-o tirado do que é dito, com a mesma qualidade e as mesmas regras de tempo, zona e som.
4. Edite pelo plano. Confira as métricas contra o modelo: eventos/s por fase, atraso efeito×palavra, camadas simultâneas, zona de leitura, nível de som. Depois audite com a mesma tabela de qualidade (item 5) e corrija o que ficar abaixo do modelo.
5. Nunca reaproveite o mesmo objeto/efeito do modelo só porque ele funcionou lá: pergunte "qual é a ideia desta fala?" e materialize ESSA.
