import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ENTRADA = join(RAIZ, '_entrada');
const ASSETS = join(RAIZ, 'src', 'assets');
const MANIFESTO = join(ASSETS, 'manifest.json');
const QUALIDADE_JPEG = 90;
const PROPORCAO_MOBILE = 4 / 5;

const ALT_JET = 'Render conceitual do Jet Set, imagem de projeto: a fuselagem prateada de um Boeing 727 sobre o gramado, com plateia em degraus e mirante sobre a asa';

const REGISTROS = [
  { id: 'jet-lateral', arquivo: 'fotos/jet-set/jet-lateral.jpg', ambiente: 'jet-set', alt: ALT_JET, slot: 'jet-set-render', fotografo: null, isRender: true },
  { id: 'jet-lateral-b', arquivo: 'fotos/jet-set/jet-lateral-b.jpg', ambiente: 'jet-set', alt: ALT_JET, slot: null, fotografo: null, isRender: true },
  { id: 'jet-aerea', arquivo: 'fotos/jet-set/jet-aerea.jpg', ambiente: 'jet-set', alt: 'Render conceitual do Jet Set visto do alto, imagem de projeto: o Boeing 727 prateado sobre a plateia em degraus, cercado de jardim', slot: 'jet-set-render-aereo', fotografo: null, isRender: true },
];

const CORTES_MOBILE = [
  { origem: 'jet-lateral', id: 'jet-lateral-m', centroX: 0.42 },
  { origem: 'jardim-olho-gigante', id: 'jardim-olho-gigante-m', centroX: 0.39 },
  { origem: 'parque-lua-no-lago', id: 'parque-lua-no-lago-m', centroX: 0.5 },
];

const TRATADAS = [
  {
    origem: 'Varios/ARTZ0420071110.jpg',
    id: 'jardim-olho-azul',
    arquivo: 'fotos/jardim/jardim-olho-azul.jpg',
    alt: 'Olho gigante de íris azul deitado no gramado do Jardim de Esculturas, à sombra de uma árvore',
    slot: 'jardim-olho-azul',
  },
];

const ALTS_ATUALIZADOS = {
  'jardim-olho-gigante': 'Olho gigante de réptil, em laranja, num disco sobre o gramado à noite, com um prédio em luz roxa ao fundo',
  'jardim-3': 'Escultura de vaca malhada deitada no gramado à noite, com uma palmeira saindo das costas e as luzes do parque ao fundo',
  'jardim-ebraim-2983': 'Escultura de vaca malhada deitada na encosta gramada do Jardim de Esculturas, de dia',
  'parque-lua-no-lago': 'Ao pôr do sol, uma lua luminosa surge entre as árvores à beira do lago, que reflete o céu laranja, com a serra ao fundo',
  'jardim-5': 'Esfera luminosa como uma lua cheia junto à água do lago, na névoa do fim de tarde, com a serra e os prédios de Balneário Camboriú ao fundo',
};

async function tratar(origem) {
  const { data, info } = await sharp(join(ENTRADA, origem)).rotate().toBuffer({ resolveWithObject: true });
  return sharp(data)
    .modulate({ saturation: 0.94 })
    .linear([0.94, 0.94, 0.94], [14, 13, 16])
    .composite([{ input: { create: { width: info.width, height: info.height, channels: 4, background: { r: 230, g: 189, b: 110, alpha: 0.08 } } }, blend: 'soft-light' }])
    .jpeg({ quality: QUALIDADE_JPEG, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });
}

async function cortarMobile(entrada, id, centroX) {
  const caminho = join(ASSETS, entrada.arquivo);
  const { width, height } = await sharp(caminho).metadata();
  const largura = Math.round(height * PROPORCAO_MOBILE);
  const esquerda = Math.max(0, Math.min(width - largura, Math.round(width * centroX - largura / 2)));
  const arquivo = entrada.arquivo.replace(/\.jpg$/, '-m.jpg');
  const saida = await sharp(caminho)
    .extract({ left: esquerda, top: 0, width: largura, height })
    .resize({ width: Math.min(largura, 1200) })
    .jpeg({ quality: QUALIDADE_JPEG, mozjpeg: true })
    .toFile(join(ASSETS, arquivo));
  return { ...entrada, id, arquivo, largura: saida.width, altura: saida.height, alt: entrada.alt, slot: null };
}

function inserir(manifesto, registro) {
  const indice = manifesto.findIndex((item) => item.id === registro.id);
  if (indice === -1) manifesto.push(registro);
  else manifesto[indice] = { ...manifesto[indice], ...registro };
}

async function main() {
  const manifesto = JSON.parse(await readFile(MANIFESTO, 'utf8'));

  for (const registro of REGISTROS) {
    const { width, height } = await sharp(join(ASSETS, registro.arquivo)).metadata();
    inserir(manifesto, { ...registro, largura: width, altura: height });
  }

  for (const tratada of TRATADAS) {
    const { data, info } = await tratar(tratada.origem);
    await writeFile(join(ASSETS, tratada.arquivo), data);
    inserir(manifesto, { id: tratada.id, arquivo: tratada.arquivo, ambiente: 'jardim', largura: info.width, altura: info.height, alt: tratada.alt, slot: tratada.slot, fotografo: null });
  }

  for (const [id, alt] of Object.entries(ALTS_ATUALIZADOS)) {
    const entrada = manifesto.find((item) => item.id === id);
    if (entrada) entrada.alt = alt;
    else console.warn(`AUSENTE: ${id}`);
  }

  for (const corte of CORTES_MOBILE) {
    const entrada = manifesto.find((item) => item.id === corte.origem);
    if (!entrada) throw new Error(`id ausente: ${corte.origem}`);
    inserir(manifesto, await cortarMobile(entrada, corte.id, corte.centroX));
  }

  await writeFile(MANIFESTO, JSON.stringify(manifesto, null, 2) + '\n');
  console.log('manifest atualizado:', manifesto.length, 'entradas');
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
