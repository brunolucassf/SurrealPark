import { pipeline, env, RawImage } from '@huggingface/transformers';
import sharp from 'sharp';
import { mkdir, readFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const MANIFESTO = join(RAIZ, 'src', 'assets', 'manifest.json');
const SAIDA = join(RAIZ, 'public', 'img', 'parque');
const CACHE = process.env.MEDIA_CACHE ?? 'C:/Users/FONTED~1/AppData/Local/Temp/claude/d--Projetos-FD-Surreal-V2/6452ec26-8edd-43ad-8479-7c0521d54ffb/scratchpad/cache-media/modelos';
const MODELO = 'onnx-community/depth-Anything-V2-Small-ONNX';
const LADO = 512;
const RAIO_DILATACAO = 5;
const SIGMA_BLUR = 3;
const LIMITE_BYTES = 25 * 1024;
const CENAS = [
  'contato-skyline-aerea',
  'locacao-aerea-noturna',
  'jardim-ebraim-0223',
  'ritual-arco-dourado',
  'bells-sino-desktop',
  'raw-room-recorte',
  'nomad-diego-0733',
  'church-2',
  'jardim-ebraim-2132',
  'jet-lateral',
  'parque-lua-no-lago',
  'jardim-olho-gigante',
];
const CENAS_PEDIDAS = process.argv.slice(2).length ? process.argv.slice(2) : CENAS;

env.cacheDir = CACHE;

function maximo1d(buf, w, h, raio, horizontal) {
  const out = new Uint8Array(buf.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let m = 0;
      for (let k = -raio; k <= raio; k++) {
        const xx = horizontal ? x + k : x;
        const yy = horizontal ? y : y + k;
        if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
        const v = buf[yy * w + xx];
        if (v > m) m = v;
      }
      out[y * w + x] = m;
    }
  }
  return out;
}

async function gerar(depth, id) {
  const gray = await sharp(Buffer.from(depth.data), { raw: { width: depth.width, height: depth.height, channels: 1 } })
    .resize(LADO, LADO, { fit: 'inside' })
    .grayscale()
    .normalise()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = gray.info;
  const dilatado = maximo1d(maximo1d(gray.data, w, h, RAIO_DILATACAO, true), w, h, RAIO_DILATACAO, false);
  let qualidade = 70;
  let saida;
  do {
    saida = await sharp(Buffer.from(dilatado), { raw: { width: w, height: h, channels: 1 } })
      .blur(SIGMA_BLUR)
      .webp({ quality: qualidade, effort: 6 })
      .toBuffer();
    qualidade -= 5;
  } while (saida.length > LIMITE_BYTES && qualidade >= 20);
  const destino = join(SAIDA, `${id}-depth.webp`);
  await sharp(saida).toFile(destino);
  const meta = await sharp(destino).metadata();
  return { id, bytes: saida.length, largura: meta.width, altura: meta.height, qualidade: qualidade + 5 };
}

async function main() {
  await mkdir(SAIDA, { recursive: true });
  await mkdir(CACHE, { recursive: true });
  const manifesto = JSON.parse(await readFile(MANIFESTO, 'utf8'));
  const porId = new Map(manifesto.map((e) => [e.id, e]));
  const detector = await pipeline('depth-estimation', MODELO, { dtype: 'fp32' });
  const resultados = [];
  for (const id of CENAS_PEDIDAS) {
    const entrada = porId.get(id);
    if (!entrada) throw new Error(`id ausente no manifest: ${id}`);
    const caminho = join(RAIZ, 'src', 'assets', entrada.arquivo);
    const imagem = await RawImage.read(caminho);
    const saida = await detector(imagem);
    const depth = saida.depth;
    const info = await gerar(depth, id);
    resultados.push(info);
    console.log(JSON.stringify(info));
  }
  const tamanhos = await Promise.all(CENAS_PEDIDAS.map((id) => stat(join(SAIDA, `${id}-depth.webp`))));
  console.log('total bytes', tamanhos.reduce((s, t) => s + t.size, 0));
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
