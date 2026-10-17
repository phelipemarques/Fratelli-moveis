# Fotos originais

No máximo **3 fotografias**, todas **reais da GRO**. Nada de banco de imagens nem
imagem gerada por IA representando a empresa.

| Nome do arquivo | Onde entra | O que fotografar |
|---|---|---|
| `hero` | Painel verde à direita do topo | Equipe da GRO em treinamento ou avaliação em campo, com EPI. **Vertical 4:5**, mín. 1600 px de largura |
| `empresas` | Seção Empresas | A GRO dentro de uma empresa cliente (com autorização de imagem). Horizontal 16:9, mín. 2000 px |
| `sobre` | Seção Sobre, ao lado do "539" | Fachada com o totem ou a equipe na recepção. Horizontal, mín. 2000 px |

Depois rode, na pasta `gro-cascavel`:

```bash
python3 tools/importar-fotos.py
```

E insira a foto no ponto indicado pelo comentário de cada seção no `index.html`.
Os originais não vão para o Git.
