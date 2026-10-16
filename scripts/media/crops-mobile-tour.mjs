import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ASSETS = join(RAIZ, 'src', 'assets');
const MANIFESTO = join(ASSETS, 'manifest.json');
const LARGURA = 1200;
const ALTURA = 1500;
const CENAS = [
  { id: 'contato-skyline-aerea', foco: 0.5 },
  { id: 'locacao-aerea-noturna', foco: 0.5 },
  { id: 'jardim-ebraim-0223', foco: 0.5 },
  { id: 'ritual-arco-dourado', foco: 0.5 },
  { id: 'bells-sino-desktop', foco: 0.5 },
  { id: 'raw-room-recorte', foco: 0.5 },
  { id: 'nomad-diego-0733', foco: 0.66 },
  { id: 'church-2', foco: 0.5 },
  { id: 'jardim-ebraim-2132', foco: 0.5 },
];

async function recortar(origem, destino, foco) {
  const meta = await sharp(origem).metadata();
  const { width: W, height: H } = meta;
  let cw = W;
  let ch = H;
  if (W / H > 0.8) cw = Math.round(H * 0.8);
  else ch = Math.round(W / 0.8);
  const cx = Math.min(Math.max(Math.round(foco * W - cw / 2), 0), W - cw);
  const cy = Math.round((H - ch) / 2);
  await sharp(origem)
    .extract({ left: cx, top: cy, width: cw, height: ch })
    .resize(LARGURA, ALTURA, { fit: 'fill', kernel: 'lanczos3' })
    .jpeg({ quality: 86, mozjpeg: true, progressive: true })
    .toFile(destino);
  return { cw, ch, W, H, cx, cy };
}

async function main() {
  const manifesto = JSON.parse(await readFile(MANIFESTO, 'utf8'));
  const porId = new Map(manifesto.map((e) => [e.id, e]));
  for (const { id, foco } of CENAS) {
    const base = porId.get(id);
    if (!base) throw new Error(`id ausente: ${id}`);
    const idMobile = `${id}-m`;
    const arquivoMobile = base.arquivo.replace(/\.jpg$/, '-m.jpg');
    const info = await recortar(join(ASSETS, base.arquivo), join(ASSETS, arquivoMobile), foco);
    const entradaMobile = {
      id: idMobile,
      arquivo: arquivoMobile,
      ambiente: base.ambiente,
      largura: LARGURA,
      altura: ALTURA,
      alt: base.alt,
      slot: null,
      fotografo: base.fotografo,
    };
    const indice = manifesto.findIndex((e) => e.id === idMobile);
    if (indice >= 0) manifesto[indice] = entradaMobile;
    else manifesto.splice(manifesto.findIndex((e) => e.id === id) + 1, 0, entradaMobile);
    base.mobile = idMobile;
    porId.set(idMobile, entradaMobile);
    console.log(JSON.stringify({ id, origem: `${info.W}x${info.H}`, recorte: `${info.cw}x${info.ch}@${info.cx},${info.cy}` }));
  }
  await writeFile(MANIFESTO, JSON.stringify(manifesto, null, 2) + '\n', 'utf8');
  console.log('manifest atualizado');
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
