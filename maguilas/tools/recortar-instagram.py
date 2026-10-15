"""Recorta posts do Maguila's a partir das capturas de tela do perfil no Instagram.

PROVISÓRIO. As capturas têm cerca de 281 x 375 px por post; as imagens saem no
tamanho nativo, sem ampliação. Quando os arquivos originais chegarem, eles
substituem estes recortes (ver README, "Trocar as fotos").

Uso:
    python3 tools/recortar-instagram.py <pasta-com-1.webp..4.webp>
"""
import sys
from pathlib import Path

from PIL import Image

# Grade de cada captura: colunas (x0, x1) e linhas (y0, y1), medidas pelos
# vãos de 1 px entre os posts.
GRADES = {
    "1": ([(21, 302), (303, 584), (585, 865), (866, 1147), (1148, 1429)], [(29, 403), (404, 779)]),
    "2": ([(149, 430), (431, 712), (713, 994), (995, 1275), (1276, 1557)], [(434, 809)]),
    "3": ([(38, 319), (320, 601), (602, 882), (883, 1164), (1165, 1446)], [(185, 560), (561, 914)]),
    "4": ([(42, 323), (324, 605), (606, 886), (887, 1168), (1169, 1450)], [(0, 367), (368, 743)]),
}

# nome de saída: (captura, linha, coluna, recorte interno opcional)
# O recorte interno tira texto ou o ícone de vídeo do Instagram das fotos limpas.
POSTS = {
    # fotos sem arte gráfica (abertura; as cubas vão para o cardápio)
    "foto-buffet-vitrine": ("4", 1, 3, (0, 38, 280, 367)),
    "foto-sobremesa-copos": ("2", 1, 3, (0, 36, 280, 375)),
    "foto-buffet-cubas": ("1", 2, 2, (0, 78, 281, 262)),
    "foto-marmita": ("2", 1, 5, (10, 100, 243, 372)),
    # só a foto do produto, sem a arte do post (cardápio)
    "foto-salgados-vitrine": ("3", 1, 2, (132, 50, 281, 300)),
    "foto-bife-acebolado": ("4", 2, 1, (0, 112, 258, 305)),
    "foto-lanche": ("1", 1, 1, (95, 150, 281, 350)),
    "foto-porcao-peixe-camarao": ("4", 1, 2, (0, 130, 281, 305)),
    "foto-pudim": ("1", 1, 5, (0, 182, 281, 374)),
    # momentos do dia
    "post-cafe-cachorro-quente": ("4", 2, 3, None),
    "post-almoco-prato-feito": ("4", 2, 2, None),
    "post-tarde-empadao": ("4", 2, 5, None),
    "post-jantar-pratos": ("3", 1, 5, None),
    # buffet
    "post-buffet-almoco": ("3", 1, 3, None),
    "post-buffet-frango": ("3", 2, 4, None),
    # galeria
    "post-coxinha-costela": ("3", 1, 1, None),
    "post-docinhos": ("1", 2, 1, None),
    "post-cupcake": ("2", 1, 4, None),
    "post-shawarma": ("3", 2, 3, None),
    "post-empadas": ("1", 1, 2, None),
    "post-copos-felicidade": ("4", 1, 1, None),
}

def main(origem: Path, destino: Path) -> None:
    destino.mkdir(parents=True, exist_ok=True)
    capturas = {n: Image.open(origem / f"{n}.webp").convert("RGB") for n in GRADES}
    for nome, (n, linha, coluna, interno) in POSTS.items():
        cols, linhas = GRADES[n]
        x0, x1 = cols[coluna - 1]
        y0, y1 = linhas[linha - 1]
        img = capturas[n].crop((x0, y0, x1, y1))
        if interno:
            img = img.crop(interno)
        img.save(destino / f"{nome}.webp", "WEBP", quality=88, method=6)
        print(f"{nome}.webp  {img.width}x{img.height}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(Path(sys.argv[1]), Path(__file__).resolve().parent.parent / "assets" / "images")
