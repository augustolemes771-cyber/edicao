# Guia rápido do edit.ts (leia isto em vez de explorar o motor)

Arquivo: `src/projetos/<nome>/edit.ts`, tipo `Edit` (`src/motor/plano.ts`). Criado por `npm run novo -- <nome> --vertical`; mídia em `public/projetos/<nome>/`.
Tempos sempre por âncora de fala (`b.*`), nunca digitados à mão. `b` = `Busca`:

| Chamada | Devolve |
|---|---|
| `b.at('palavra', n?)` | início (s) da n-ésima ocorrência da palavra |
| `b.say('frase falada', n?)` | `{inicio, fim}` da frase |
| `b.tempos('frase', n?)` | tempo de cada palavra (para entradas palavra por palavra) |
| `b.atsW(i)` | palavra pelo índice de `docs/<nome>/transcript-words.txt` |
| `b.emendas[i]` | instante exato de um corte (zoom de emenda) |

## Esqueleto vertical
```ts
export const nome: Edit = {
  pasta: 'projetos/<nome>', video: 'video.mp4', formato: 'vertical',
  verificarCurva: false, regraCamera: false,
  legenda: {estilo: 'palavra' /* 'ouro' | 'impacto' | 'neon' */, enfase: []},
  transcricao,                       // import transcricao from './transcricao.json'
  cortes: [],                        // [[ini, fim]] no tempo ORIGINAL: (o) => [[o.say('abre').inicio - 0.15, o.say('fecha').fim + 0.2]]
  camera: (b) => [{tipo: 'zoom', em: b.at('palavra'), escala: 1.25}],
  cenas: (b) => [{tipo: 'cartao', de: b.at('x'), ate: b.at('y'), palavras: ['A','B'], tempos: b.tempos('A B')}],
};
```
Toda cena tem `de`, `ate`, e opcionais `modo` ('cheia' | 'sobre' | 'atras'), `som`, `impacto`.

## Câmera (`camera`): `zoom {em, escala, suave?, x?, y?}`, `foco {em, duracao?}`, `flash {em}`, `chicote {em}`, `mergulho`, `iris`, `vazamento`, `listras` (todos `{em}`).

## Cenas (`tipo`)
`titulo` (texto com *destaque*), `numero`, `lista`/`checklist` (itens `{texto, em}`), `passo`, `estrela`, `logo3d`, `painel`, `tela`, `imagem`, `foto`, `icone`, `broll`, `preto`, `despedida`,
`cartao` (palavras + tempos), `letras` (linha1/linha2), `kicker` (pequeno/grande), `comentarios`, `cenario` (3D), `gigante`, `retrato`, `topicos`, `xadrez`, `vitrine`, `anel`, `rec`, `alertas`.
Detalhes de campos: `grep -n "tipo: 'NOME'" -A8 src/motor/plano.ts` (só a cena que for usar).

## Fluxo curto
`npm run preparar -- <nome>` (mídia + transcrição + roteiro de uma vez) → escrever `edit.ts` → `npm run conferir -- <nome>` → `npm run preview -- <nome>`.
Exemplos prontos: `src/projetos/reels-exemplo/edit.ts` (vertical) e `depoimento-danilow/edit.ts`. Não leia o `plano.ts` inteiro.
