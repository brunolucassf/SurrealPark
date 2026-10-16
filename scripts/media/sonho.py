import argparse
import os
import numpy as np
import cv2
from PIL import Image

ORIGEM = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "src", "assets", "fotos", "nomad")
PARES = {
    "desktop": ("nomad-realidade-desktop.jpg", "nomad-sonho-desktop.jpg"),
    "mobile": ("nomad-realidade-mobile.jpg", "nomad-sonho-mobile.jpg"),
}
COR_TOPO = np.array([0x0E, 0x14, 0x30], np.float32) / 255.0
COR_BASE = np.array([0x1B, 0x23, 0x50], np.float32) / 255.0
OURO = np.array([0xE6, 0xBD, 0x6E], np.float32) / 255.0


def carregar(caminho):
    return np.asarray(Image.open(caminho).convert("RGB"), np.float32) / 255.0


def luminancia(img):
    return 0.2126 * img[..., 0] + 0.7152 * img[..., 1] + 0.0722 * img[..., 2]


def suave(mapa, sigma):
    return cv2.GaussianBlur(mapa, (0, 0), sigma)


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a + 1e-6), 0, 1)
    return t * t * (3 - 2 * t)


def zona_tenda(altura, largura):
    yy = np.arange(altura, dtype=np.float32)[:, None] * np.ones((1, largura), np.float32)
    xx = np.ones((altura, 1), np.float32) * np.arange(largura, dtype=np.float32)[None, :]
    return ((yy > 0.27 * altura) & (xx >= 0.08 * largura) & (xx <= 0.96 * largura)).astype(np.float32)


def tenda_mascara(img, lum, zona):
    cor = (img[..., 0] > 0.42) & (img[..., 0] > img[..., 1] * 1.3) & (img[..., 0] > img[..., 2] * 1.6) & (lum < 0.55)
    return cor.astype(np.float32) * zona


def peso_ceu(img, lum):
    ls = suave(lum, 6.0)
    altura, largura = lum.shape
    yy = np.linspace(0, 1, altura, dtype=np.float32)[:, None] * np.ones((1, largura), np.float32)
    w = smoothstep(0.30, 0.52, ls)
    w *= 1 - smoothstep(0.40, 0.50, yy)
    w *= 1 - suave(tenda_mascara(img, lum, zona_tenda(altura, largura)), 2.0)
    w = np.clip(w, 0, 1).astype(np.float32)
    dilatado = cv2.dilate(w, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (17, 17)))
    w = np.clip(suave(np.maximum(w, dilatado), 4.0), 0, 1).astype(np.float32)
    return w, yy, ls


def ruido_realidade(img, w):
    residuo = img - suave(img, 1.6)
    mascara = (w > 0.95) & (suave(luminancia(img), 6) < 0.8)
    dados = luminancia(residuo)[mascara]
    if dados.size < 1000:
        dados = luminancia(residuo).ravel()
    return float(1.4826 * np.median(np.abs(dados - np.median(dados))))


def sonho(img, depuracao=None, semente=7):
    altura, largura = img.shape[:2]
    rng = np.random.default_rng(semente)
    lum = luminancia(img)
    w, yy, ls = peso_ceu(img, lum)
    y_abs = np.arange(altura, dtype=np.float32)[:, None] * np.ones((1, largura), np.float32)

    media_linha = w.mean(axis=1)
    linhas_ceu = np.where(media_linha > 0.5)[0]
    horizonte = int(linhas_ceu.max()) if linhas_ceu.size else int(altura * 0.3)

    serra = np.argmax(w < 0.5, axis=0).astype(np.float32)[None, :]
    distancia = y_abs - serra
    faixa = np.clip(1 - distancia / 12.0, 0, 1) * (distancia >= 0)

    zona = zona_tenda(altura, largura)
    fora = 1 - zona
    grade_ceu = img * (2.0 ** -1.5) * np.array([0.82, 0.93, 1.12], np.float32)[None, None, :]
    grade_ceu = np.power(np.clip(grade_ceu, 0, 1), 1.12)
    grade_lona = img * (2.0 ** -1.5)
    grade = grade_ceu * fora[..., None] + grade_lona * zona[..., None]
    grade = grade * (1 - 0.25 * faixa[..., None])

    fator = np.clip(yy / 0.45, 0, 1)
    cor_ceu = COR_TOPO[None, None, :] * (1 - fator[..., None]) + COR_BASE[None, None, :] * fator[..., None]
    sky_n = np.clip((ls - 0.30) / 0.45, 0, 1)
    cor_ceu = cor_ceu * (0.75 + 0.35 * sky_n[..., None])
    cor_ceu = cor_ceu + (fator ** 6)[..., None] * OURO[None, None, :] * 0.03

    saida = grade * (1 - w[..., None]) + cor_ceu * w[..., None]

    tenda = suave(tenda_mascara(img, lum, zona), 3.0) * (1 - w)
    saida = saida * (1 - 0.8 * tenda[..., None]) + np.clip(img * 1.25, 0, 1) * 0.8 * tenda[..., None]

    zona_bloom = (y_abs > horizonte + 40).astype(np.float32) * fora
    quente_sat = np.clip((img[..., 0] - img[..., 2]) / (img[..., 0] + 1e-6) - 0.45, 0, 1) * 2.0
    quente = np.clip((lum - 0.55) / 0.3, 0, 1) * np.clip(quente_sat, 0, 1) * (1 - smoothstep(0.1, 0.3, w)) * zona_bloom
    quente = suave(quente.astype(np.float32), 1.0)
    saida = saida * (1 - quente[..., None]) + np.clip(img * 1.12, 0, 1) * quente[..., None]
    fonte = img * quente[..., None]
    bloom = np.zeros_like(img)
    for sigma, peso in [(6, 0.45), (18, 0.35), (48, 0.25)]:
        bloom += suave(fonte, sigma) * peso
    bloom = np.clip(bloom * 1.3, 0, 1) * OURO[None, None, :] * (1 - smoothstep(0.1, 0.3, w))[..., None] * zona_bloom[..., None]
    saida = 1 - (1 - saida) * (1 - bloom)

    pode_estrela = ((w > 0.95) & (y_abs < horizonte - 40) & (fora > 0.5)).astype(np.float32)
    pequenas = (rng.random((altura, largura)) < 0.00006).astype(np.float32) * pode_estrela
    brilho_p = np.clip(suave(pequenas, 0.6) * 2.2, 0, 1) * rng.uniform(0.3, 0.6)
    grandes = (rng.random((altura, largura)) < 0.000008).astype(np.float32) * pode_estrela
    brilho_g = np.clip(suave(grandes, 1.4) * 12.0, 0, 1) * rng.uniform(0.35, 0.5)
    estrelas = np.clip(brilho_p + brilho_g, 0, 1) * (w ** 4) * pode_estrela
    saida = 1 - (1 - saida) * (1 - estrelas[..., None] * np.array([0.92, 0.95, 1.0], np.float32)[None, None, :])

    sigma = ruido_realidade(img, w)
    ruido = rng.standard_normal((altura, largura)).astype(np.float32)[..., None] * sigma
    saida = np.clip(saida + ruido, 0, 1)

    if depuracao:
        os.makedirs(depuracao, exist_ok=True)
        cv2.imwrite(os.path.join(depuracao, "peso-ceu.png"), (w * 255).astype(np.uint8))
        print("horizonte", horizonte, "sigma ruido", round(sigma, 5))
    return saida


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--depuracao", default=None)
    args = parser.parse_args()
    for chave, (entrada, saida) in PARES.items():
        origem = os.path.join(ORIGEM, entrada)
        destino = os.path.join(ORIGEM, saida)
        img = carregar(origem)
        resultado = sonho(img, args.depuracao if chave == "desktop" else None)
        Image.fromarray((resultado * 255 + 0.5).astype(np.uint8)).save(destino, quality=88, optimize=True, progressive=True)
        print(chave, img.shape[1], "x", img.shape[0], os.path.getsize(destino) // 1024, "KB")


if __name__ == "__main__":
    main()
