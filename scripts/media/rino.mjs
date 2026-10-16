import { mkdir, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NodeIO } from '@gltf-transform/core';
import { EXTMeshoptCompression, EXTTextureWebP, KHRMeshQuantization } from '@gltf-transform/extensions';
import { dedup, meshopt, prune, quantize, simplify, textureCompress, weld } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ORIGEM = join(RAIZ, '_entrada', 'trellis2_0b0ed8ddb710422993e4311e015faf97.glb');
const DESTINO = join(RAIZ, 'public', 'models', 'rino.glb');
const LIMITE_BYTES = 600 * 1024;
const RAZAO_SIMPLIFICACAO = 0.83;
const LADO_TEXTURA = 1024;
const QUALIDADE_WEBP = 80;
const MATIZ_BRONZE = 28;
const SATURACAO_BRONZE = 0.45;
const SATURACAO_CINZA_MAXIMA = 0.12;
const FAIXA_BRONZE = [15, 40];

function rgbParaHsl(r, g, b) {
  const maximo = Math.max(r, g, b);
  const minimo = Math.min(r, g, b);
  const luminancia = (maximo + minimo) / 2;
  const delta = maximo - minimo;
  if (delta === 0) return { matiz: 0, saturacao: 0, luminancia };
  const saturacao = delta / (1 - Math.abs(2 * luminancia - 1));
  let matiz;
  if (maximo === r) matiz = ((g - b) / delta) % 6;
  else if (maximo === g) matiz = (b - r) / delta + 2;
  else matiz = (r - g) / delta + 4;
  return { matiz: (((matiz * 60) % 360) + 360) % 360, saturacao, luminancia };
}

function hslParaRgb(matiz, saturacao, luminancia) {
  const crominancia = (1 - Math.abs(2 * luminancia - 1)) * saturacao;
  const intermediario = crominancia * (1 - Math.abs(((matiz / 60) % 2) - 1));
  const ajuste = luminancia - crominancia / 2;
  const setor = Math.floor(matiz / 60) % 6;
  const [r, g, b] = [
    [crominancia, intermediario, 0],
    [intermediario, crominancia, 0],
    [0, crominancia, intermediario],
    [0, intermediario, crominancia],
    [intermediario, 0, crominancia],
    [crominancia, 0, intermediario],
  ][setor];
  return [r + ajuste, g + ajuste, b + ajuste].map((canal) => Math.round(canal * 255));
}

function corrigirIlhasCinzas(pixels, canais) {
  for (let indice = 0; indice < pixels.length; indice += canais) {
    const { matiz, saturacao, luminancia } = rgbParaHsl(pixels[indice] / 255, pixels[indice + 1] / 255, pixels[indice + 2] / 255);
    const eCinza = saturacao < SATURACAO_CINZA_MAXIMA;
    const foraDoBronze = matiz < FAIXA_BRONZE[0] || matiz > FAIXA_BRONZE[1];
    if (!eCinza || !foraDoBronze) continue;
    const [r, g, b] = hslParaRgb(MATIZ_BRONZE, SATURACAO_BRONZE, luminancia);
    pixels[indice] = r;
    pixels[indice + 1] = g;
    pixels[indice + 2] = b;
  }
  return pixels;
}

async function corrigirTextureBase(textura) {
  const imagem = sharp(Buffer.from(textura.getImage())).toColourspace("srgb");
  const { data, info } = await imagem.raw().toBuffer({ resolveWithObject: true });
  const corrigida = corrigirIlhasCinzas(new Uint8ClampedArray(data), info.channels);
  const buffer = await sharp(Buffer.from(corrigida.buffer), {
    raw: { width: info.width, height: info.height, channels: info.channels },
  }).toColourspace('srgb').png().toBuffer();
  textura.setImage(buffer).setMimeType('image/png');
}

async function main() {
  await MeshoptEncoder.ready;
  await MeshoptSimplifier.ready;
  const io = new NodeIO()
    .registerExtensions([EXTMeshoptCompression, EXTTextureWebP, KHRMeshQuantization])
    .registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
  const documento = await io.read(ORIGEM);
  const raiz = documento.getRoot();
  const texturaBase = raiz.listMaterials().map((material) => material.getBaseColorTexture()).find(Boolean);
  if (texturaBase) await corrigirTextureBase(texturaBase);
  await documento.transform(
    weld(),
    simplify({ simplifier: MeshoptSimplifier, ratio: RAZAO_SIMPLIFICACAO, error: 0.001, lockBorder: true }),
    textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [LADO_TEXTURA, LADO_TEXTURA], quality: QUALIDADE_WEBP }),
    prune(),
    dedup(),
    quantize(),
    meshopt({ encoder: MeshoptEncoder, level: 'high' }),
  );
  await mkdir(dirname(DESTINO), { recursive: true });
  await io.write(DESTINO, documento);
  const { size } = await stat(DESTINO);
  const origemTamanho = (await stat(ORIGEM)).size;
  console.log(`rino.glb: ${(origemTamanho / 1024).toFixed(0)} KB -> ${(size / 1024).toFixed(0)} KB`);
  if (size > LIMITE_BYTES) {
    throw new Error(`rino.glb acima de 600 KB (${(size / 1024).toFixed(0)} KB)`);
  }
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
