import tempfile
import shutil
import sys
import urllib.request
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

RAIZ = Path(__file__).resolve().parents[2]
FONTES = RAIZ / "public" / "fonts"
LICENCAS = FONTES / "licencas"
TEMPORARIOS = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(tempfile.gettempdir()) / "surreal-fontes"
REPOSITORIO = "https://raw.githubusercontent.com/google/fonts/main/ofl"

UNICODE_LATIN = (
    "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, "
    "U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD"
)
UNICODE_LATIN_EXT = (
    "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, "
    "U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF"
)

SUBSETS = {
    "latin": UNICODE_LATIN,
    "latin-ext": UNICODE_LATIN_EXT,
}

FAMILIAS = [
    {
        "pasta": "kalnia",
        "ttf": "Kalnia[wdth,wght].ttf",
        "base": "kalnia-var",
        "familia": "Kalnia",
        "peso": "100 700",
        "largura": "100% 125%",
    },
    {
        "pasta": "instrumentsans",
        "ttf": "InstrumentSans[wdth,wght].ttf",
        "base": "instrument-sans-var",
        "familia": "Instrument Sans",
        "peso": "400 700",
        "largura": "75% 100%",
    },
    {
        "pasta": "dmmono",
        "ttf": "DMMono-Regular.ttf",
        "base": "dm-mono-400",
        "familia": "DM Mono",
        "peso": "400",
        "largura": None,
    },
    {
        "pasta": "dmmono",
        "ttf": "DMMono-Medium.ttf",
        "base": "dm-mono-500",
        "familia": "DM Mono",
        "peso": "500",
        "largura": None,
    },
]


def baixar(url, destino):
    destino.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(url, timeout=120) as resposta:
        destino.write_bytes(resposta.read())
    return destino


def subsetar(ttf, unicodes, destino):
    opcoes = subset.Options()
    opcoes.flavor = "woff2"
    opcoes.layout_features = ["*"]
    opcoes.name_IDs = ["*"]
    opcoes.notdef_outline = True
    opcoes.hinting = False
    fonte = TTFont(str(ttf))
    subsetador = subset.Subsetter(opcoes)
    subsetador.populate(unicodes=subset.parse_unicodes(unicodes))
    subsetador.subset(fonte)
    fonte.flavor = "woff2"
    fonte.save(str(destino))
    return destino


def blocoFontFace(familia, arquivo, peso, largura, unicodeRange):
    linhas = [
        f'@font-face {{',
        f'  font-family: "{familia}";',
        f'  src: url(/fonts/{arquivo}) format("woff2");',
        f'  font-weight: {peso};',
    ]
    if largura:
        linhas.append(f"  font-stretch: {largura};")
    linhas.append("  font-display: swap;")
    linhas.append(f"  unicode-range: {unicodeRange};")
    linhas.append("}")
    return "\n".join(linhas)


def main():
    FONTES.mkdir(parents=True, exist_ok=True)
    LICENCAS.mkdir(parents=True, exist_ok=True)
    TEMPORARIOS.mkdir(parents=True, exist_ok=True)
    blocos = []
    baixadosLicenca = set()
    for familia in FAMILIAS:
        ttf = baixar(f"{REPOSITORIO}/{familia['pasta']}/{familia['ttf']}", TEMPORARIOS / familia["ttf"].replace("[", "_").replace("]", "").replace(",", "_"))
        for nomeSubset, unicodes in SUBSETS.items():
            arquivo = f"{familia['base']}-{nomeSubset}.woff2"
            subsetar(ttf, unicodes, FONTES / arquivo)
            blocos.append(blocoFontFace(familia["familia"], arquivo, familia["peso"], familia["largura"], unicodes))
        chaveLicenca = familia["pasta"]
        if chaveLicenca not in baixadosLicenca:
            baixar(f"{REPOSITORIO}/{familia['pasta']}/OFL.txt", LICENCAS / f"{chaveLicenca}-OFL.txt")
            baixadosLicenca.add(chaveLicenca)
    (FONTES / "fonts.css").write_text("\n\n".join(blocos) + "\n", encoding="utf-8")
    shutil.rmtree(TEMPORARIOS, ignore_errors=True)
    for arquivo in sorted(FONTES.glob("*.woff2")):
        print(f"{arquivo.name}\t{arquivo.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
