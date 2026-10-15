"""Monta maguilas-v5-producao.zip: só o que vai para a hospedagem estática.

Inclui o site (index.html, 404.html, assets/, robots.txt, sitemap.xml), a
configuração da Vercel (vercel.json, .vercelignore) e três documentos para
quem for publicar (README.md, PENDENCIAS.md, PUBLICACAO.md). Fica de fora:
tools/, docs/, as capturas de origem e a prévia em arquivo único.

Antes de fechar o ZIP, confere se todo arquivo citado no HTML e no CSS existe.

    python3 tools/gerar-zip.py
"""
import re
import sys
import zipfile
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SAIDA = RAIZ / "maguilas-v5-producao.zip"
ARQUIVOS = ["index.html", "404.html", "robots.txt", "sitemap.xml", "vercel.json", ".vercelignore",
            "README.md", "RELATORIO-V5.md", "PENDENCIAS.md", "PUBLICACAO.md", "FOTOGRAFIA.md",
            "PERFORMANCE.md", "QA.md", "DIRECAO.md"]  # os .md ficam fora do deploy (.vercelignore)


def referencias() -> set[Path]:
    """Caminhos locais citados em index.html, 404.html e style.css."""
    achados = set()
    for nome in ("index.html", "404.html"):
        texto = (RAIZ / nome).read_text(encoding="utf-8")
        for ref in re.findall(r'(?:src|href)="(/?assets/[^"#?]+)"', texto):
            achados.add(RAIZ / ref.lstrip("/"))
        for lista in re.findall(r'srcset="([^"]+)"', texto):
            for item in lista.split(","):
                achados.add(RAIZ / item.strip().split(" ")[0])
    css = (RAIZ / "assets/css/style.css").read_text(encoding="utf-8")
    for ref in re.findall(r'url\("\.\./([^"]+)"\)', css):
        achados.add(RAIZ / "assets" / ref)
    return achados


def main() -> None:
    faltando = [str(p.relative_to(RAIZ)) for p in referencias() if not p.exists()]
    if faltando:
        sys.exit("Arquivos citados e ausentes: " + ", ".join(sorted(faltando)))
    conteudo = [RAIZ / n for n in ARQUIVOS] + sorted(p for p in (RAIZ / "assets").rglob("*") if p.is_file())
    with zipfile.ZipFile(SAIDA, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for p in conteudo:
            z.write(p, Path("maguilas-v5") / p.relative_to(RAIZ))
    print(f"{SAIDA.name}: {len(conteudo)} arquivos, {SAIDA.stat().st_size / 1024:.0f} KB; "
          f"{len(referencias())} referências conferidas, nenhuma ausente")


if __name__ == "__main__":
    main()
