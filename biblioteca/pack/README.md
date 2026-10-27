# Pack de mídia

Material pronto para reutilizar nos vídeos (transições, SFX, overlays, fontes, LUTs, modelos 3D...), vindo do pack
do Google Drive.

- `arquivos/`: os arquivos em si, nas subpastas do pack. **Fora do git** (pesado); cada PC baixa o seu.
- `.painel/pack.json` (na raiz do projeto, **fora do git**, um por PC): `{"raiz": "C:\\caminho\\do\\Pack"}`, a pasta
  onde o pack já está neste PC (modos `--no-lugar` e `--pasta`). Quando existe, o painel procura os arquivos primeiro
  nela e depois em `arquivos/`. Para voltar a usar só `arquivos/`, apague esse arquivo.
- `catalogo.json`: a lista do que existe, **no git**. Cada item: `{nome, categoria, tipo, arquivo, tamanho, origem}`.
  `categoria` é a primeira subpasta do pack, `tipo` vem da extensão (`video`, `audio`, `imagem`, `fonte`, `lut`,
  `modelo3d`, `outro`), `arquivo` é o caminho relativo (com `/`) dentro da raiz do pack (`.painel/pack.json` ou `arquivos/`) e `origem` é o id do arquivo no Drive (ou o nome do
  .zip/pasta de onde veio).

O painel mostra o catálogo na Biblioteca (com `baixado` dizendo se o arquivo está neste PC) e serve os arquivos em
`/pack/<arquivo>` (da raiz de `.painel/pack.json`, se houver, senão de `arquivos/`).

## Importar

Pelo painel (tarefa "pack") ou pelo terminal, na raiz do projeto:

```
node scripts/importar-pack.mjs https://drive.google.com/drive/folders/<ID>
node scripts/importar-pack.mjs C:\Downloads\pack.zip
node scripts/importar-pack.mjs /caminho/da/pasta-do-pack
```

A pasta do Drive precisa estar como "Qualquer pessoa com o link". O script percorre as subpastas, baixa só o que ainda
não está aqui e atualiza o catálogo (pode rodar de novo com outro link: os itens se somam). Links do pack:

- https://drive.google.com/drive/folders/1mLjEmXiJJAJFAXYGT_eGy8eWApqMyKje
- https://drive.google.com/drive/folders/1szF-GDVu94ga66SlfOPb38Lf7zXNpGht

## Pack que já está numa pasta deste PC (sem copiar GBs)

```
node scripts/importar-pack.mjs "C:\caminho\do\Pack" --no-lugar
```

Cataloga os arquivos onde estão, grava a pasta em `.painel/pack.json` e o `catalogo.json` com caminhos relativos a ela.
Sem `--no-lugar`, uma pasta é **copiada** para `arquivos/`.

## Link do Drive + pasta local (recomendado para vários PCs)

```
node scripts/importar-pack.mjs https://drive.google.com/drive/folders/<ID> --pasta "D:\Pack"
```

Lista o Drive (o catálogo fica com os ids do Drive em `origem`), usa a pasta como raiz no lugar (grava
`.painel/pack.json`), reconhece o que já está lá pelo caminho relativo (e pelo tamanho, quando o catálogo já sabe) e
baixa só o que falta, direto nessa pasta. Se a pasta tiver o pack dentro de uma subpasta com o nome dele, o script
acha sozinho. Com o Google Drive para computador (ex.: `"G:\Meu Drive\Pack"`), nada precisa ser baixado.

## Sincronizar outro PC

Depois de puxar o git (que traz o `catalogo.json`):

```
node scripts/importar-pack.mjs --so-faltando
```

Baixa do Drive só o que está no catálogo e falta neste PC (direto na raiz de `.painel/pack.json`, se houver; senão em
`arquivos/`). Ou, para escolher a pasta: `<link> --pasta "D:\Pack"`. O que veio de .zip ou pasta local não tem como ser baixado
sozinho: importe o mesmo .zip de novo.
