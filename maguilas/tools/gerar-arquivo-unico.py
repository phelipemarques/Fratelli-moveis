"""Maguila's — versão em arquivo único, só para visualizar.

Embute CSS, JavaScript, fontes e imagens no próprio HTML (data URI). O
resultado abre com dois cliques, sem servidor e sem as pastas ao lado.

Não é o arquivo de publicação: o site continua sendo o index.html com as
pastas. Este é maior e não tem cache separado por arquivo.

    python3 tools/gerar-arquivo-unico.py
"""
import base64
import mimetypes
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SAIDA = RAIZ / "maguilas-visualizacao.html"
TIPOS = {".webp": "image/webp", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".jpg": "image/jpeg"}


def uri(caminho: Path) -> str:
    tipo = TIPOS.get(caminho.suffix) or mimetypes.guess_type(caminho.name)[0] or "application/octet-stream"
    return f"data:{tipo};base64,{base64.b64encode(caminho.read_bytes()).decode('ascii')}"


def main() -> None:
    html = (RAIZ / "index.html").read_text(encoding="utf-8")

    css = (RAIZ / "assets/css/style.css").read_text(encoding="utf-8")
    css = re.sub(r'url\("\.\./(fonts|images)/([^"]+)"\)',
                 lambda m: f'url("{uri(RAIZ / "assets" / m.group(1) / m.group(2))}")', css)
    html = html.replace('<link rel="stylesheet" href="assets/css/style.css">', f"<style>\n{css}\n</style>")

    js = (RAIZ / "assets/js/main.js").read_text(encoding="utf-8")
    html = html.replace('<script src="assets/js/main.js" defer></script>', "")
    html = html.replace("</body>", f"<script>\n{js}\n</script>\n</body>")

    # pré-carregamentos apontam para arquivos que não vão junto
    html = re.sub(r'\s*<link rel="preload"[^>]*>', "", html)

    cache: dict[str, str] = {}
    def imagem(m: re.Match) -> str:
        nome = m.group(2)
        if nome not in cache:
            cache[nome] = uri(RAIZ / "assets/images" / nome)
        return f'{m.group(1)}="{cache[nome]}"'
    html = re.sub(r'(src|href)="assets/images/([^"]+)"', imagem, html)

    SAIDA.write_text(html, encoding="utf-8")
    print(f"{SAIDA.name}: {SAIDA.stat().st_size / 1024 / 1024:.2f} MB, {len(cache)} imagens embutidas")


if __name__ == "__main__":
    main()
