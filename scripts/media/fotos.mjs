import sharp from 'sharp';
import { mkdir, readFile, rm, stat, writeFile, access } from 'node:fs/promises';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ENTRADA = join(RAIZ, '_entrada');
const ASSETS = join(RAIZ, 'src', 'assets');
const FOTOS = join(ASSETS, 'fotos');
const MANIFESTO = join(ASSETS, 'manifest.json');
const ACERVO = join(RAIZ, '.equipe', 'acervo.json');
const LADO_MAXIMO = 2880;
const QUALIDADE_JPEG = 90;
const CORTE_ESQUERDA_DIEGO = 0.03;

const AMBIENTE_PASTA = {
  Ritual: 'ritual',
  Bells: 'bells',
  'RAW ROOM': 'raw-room',
  Nomade: 'nomad',
  Igreja: 'church',
  Varios: 'jardim',
  jUISTREET: 'juistreet',
  Loja: 'loja',
};

const AMBIENTE_ACERVO = {
  bells: 'bells',
  church: 'church',
  'crepusculo-celular': 'crepusculo',
  'jardim-paisagem': 'jardim',
  juistreet: 'juistreet',
  loja: 'loja',
  nomad: 'nomad',
  'raw-room': 'raw-room',
  ritual: 'ritual',
};

const ROTULO_AMBIENTE = {
  bells: 'Bells',
  church: 'Igreja',
  crepusculo: 'crepúsculo',
  jardim: 'jardim',
  juistreet: 'Juistreet',
  loja: 'Loja',
  nomad: 'Nomad',
  'raw-room': 'Raw Room',
  ritual: 'Ritual',
};

const CURADORIA = [
  ['Nomade/2026_04_03_Surreal_Diego_0758.jpg', 'nomad-home-hero', 'home-hero', 'Tendas listradas iluminadas ao entardecer, com público na pista e skyline ao fundo'],
  ['Ritual/059A0484.jpg', 'ritual-vermelho', 'home-hero-alternativa-4k', null],
  ['Ritual/2026_02_15_Carnaval_Surreal_Diego_0654.jpg', 'ritual-arco-dourado', 'home-mesas', 'Arco dourado com pista cheia'],
  ['Varios/ARTZ0420041050.jpg', 'locacao-aerea-noturna', 'home-locacao', 'Vista aérea noturna do Surreal Park com estacionamento'],
  ['Varios/Surreal-Park-Junho-2025-Ebraim-Martini-2148.jpg', 'rino-poster-provisorio', 'home-rino-poster', 'Rinoceronte de bronze do Surreal Park'],
  ['Varios/2026_04_03_Surreal_Diego_0788.jpg', 'parque-lua-no-lago', 'o-parque-topo', 'Lua sobre o lago ao pôr do sol'],
  ['Ritual/Surreal Park 2025 Ebraim Martini-2930.jpg', 'ritual-concha-interior', 'ritual-mascara-concha', 'Vista de dentro da concha para fora'],
  ['Ritual/059A0437.jpg', 'ritual-azul', 'ritual-2', 'Palco do Ritual em tons de azul'],
  ['Bells/059A0333.jpg', 'bells-sino', 'bells-sino', 'Sino do Bells em retrato'],
  ['Bells/SurrealPark05.40-05.jpg', 'bells-sino-desktop', 'bells-sino-desktop', 'Sino do Bells em paisagem'],
  ['Bells/Surreal Park 2026 Ebraim Martini-0385.jpg', 'bells-2', 'bells-2', null],
  ['Bells/eudig_ - surreal trota-167 (1) (1).jpg', 'bells-3', 'bells-3', null],
  ['RAW ROOM/ARTZ0419231944.jpg', 'raw-room-recorte', 'raw-room-recorte', null],
  ['RAW ROOM/ARTZ0419205402.jpg', 'raw-room-2', 'raw-room-2', null],
  ['RAW ROOM/ARTZ0419233418.jpg', 'raw-room-3', 'raw-room-3', null],
  ['Nomade/2026_09_06_PreviewHM_Surreal_Diego_0723.jpg', 'nomad-lona', 'nomad-lona', 'Lona do Nomad com listras'],
  ['Nomade/Surreal Park 2026 Ebraim Martini-1827.jpg', 'nomad-2', 'nomad-2', null],
  ['Nomade/ARTZ0420040937.jpg', 'nomad-3', 'nomad-3', null],
  ['Igreja/2026_09_06_PreviewHM_Surreal_Diego_0974.jpg', 'church-ogiva', 'church-ogiva', 'Fachada em ogiva da Igreja, em retrato'],
  ['Igreja/_VICTORCARVALHOPH_BOMASURREAL-7437.jpg', 'church-2', 'church-2', null],
  ['Igreja/_OXGNSTUDIO-19.jpg', 'church-3', 'church-3', null],
  ['Varios/2026_02_15_Carnaval_Surreal_Diego_0118.jpg', 'jardim-olho-gigante', 'jardim-olho', 'Olho gigante no jardim'],
  ['Varios/Surreal Park 2025 Ebraim Martini-2615.jpg', 'jardim-2', 'jardim-2', null],
  ['Varios/Surreal Park 2026 Ebraim Martini-0621.jpg', 'jardim-3', 'jardim-3', null],
  ['jUISTREET/_eudig_ - surreal trota-47.jpg', 'juistreet-1', 'juistreet', null],
  ['jUISTREET/_eudig_ - surreal trota-46.jpg', 'juistreet-2', 'juistreet-2', null],
  ['Varios/Surreal Park 2026 Ebraim Martini-0589.jpg', 'servicos-postes-globo', 'servicos', 'Postes-globo, bancos e lonas à noite'],
  ['Loja/2026_02_15_Carnaval_Surreal_Diego_0102.jpg', 'loja-1', 'loja', null],
  ['Loja/Surreal Park 2025 Ebraim Martini-0117.jpg', 'loja-2', 'loja-2', null],
  ['Ritual/2026_02_15_Carnaval_Surreal_Diego_0275.jpg', 'ritual-mesas-programacao', 'programacao-mesas', null],
  ['Varios/_ (1).jpg', 'contato-aurora', 'contato-topo', 'Aurora sobre o céu do parque'],
  ['Varios/ARTZ0420040821.jpg', 'contato-skyline-aerea', 'contato-como-chegar', 'Vista aérea com skyline ao fundo'],
  ['Varios/2026_04_03_Surreal_Diego_0810.jpg', 'galeria-varios-0810', 'galeria-amostra', null],
];

const SUBSTITUICOES_NOME = [
  [/^surreal-park-junho-2025-ebraim-martini-/, 'ebraim-'],
  [/^surreal-park-\d{4}-ebraim-martini-/, 'ebraim-'],
  [/^surreal-park-\d{4}-/, ''],
  [/^\d{4}-\d{2}-\d{2}-carnaval-surreal-diego-/, 'carnaval-diego-'],
  [/^\d{4}-\d{2}-\d{2}-previewhm-surreal-diego-/, 'diego-'],
  [/^\d{4}-\d{2}-\d{2}-surreal-diego-/, 'diego-'],
  [/^_?oxgnstudio-/, 'oxgn-'],
  [/^_?victorcarvalhoph-bomasurreal-/, 'victor-'],
  [/^eudig-surreal-trota-/, 'trota-'],
  [/^eudig-/, ''],
];

function kebab(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\.[a-z]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function slugAutomatico(caminho, ambiente) {
  let nucleo = kebab(basename(caminho));
  for (const [padrao, troca] of SUBSTITUICOES_NOME) {
    nucleo = nucleo.replace(padrao, troca);
  }
  if (!nucleo) return `${ambiente}-foto`;
  return nucleo.startsWith(ambiente) ? nucleo : `${ambiente}-${nucleo}`;
}

function deduplicarSlug(slug, usados) {
  let candidato = slug;
  let indice = 2;
  while (usados.has(candidato)) {
    candidato = `${slug}-${indice}`;
    indice += 1;
  }
  usados.add(candidato);
  return candidato;
}

function baseDeDuplicata(caminho, caminhosConhecidos) {
  const casa = caminho.match(/^(.*) \(\d+\)(\.[A-Za-z]+)$/);
  if (!casa) return null;
  const base = casa[1] + casa[2];
  return caminhosConhecidos.has(base) ? base : null;
}

function fotografoPorNome(caminho) {
  if (/diego/i.test(caminho)) return 'Diego Jarschel';
  if (/ebraim[ -]martini/i.test(caminho)) return 'Ebraim Martini';
  return null;
}

function ambientePorPasta(caminho) {
  const pasta = caminho.split('/')[0];
  return AMBIENTE_PASTA[pasta] ?? 'jardim';
}

async function existe(caminho) {
  try {
    await access(caminho);
    return true;
  } catch {
    return false;
  }
}

async function montarLista(acervo) {
  const conhecidos = new Set(acervo.map((item) => item.caminho));
  const porCaminho = new Map(acervo.map((item) => [item.caminho, item]));
  const curados = new Map(CURADORIA.map(([caminho, slug, slot, alt]) => [caminho, { slug, slot, alt }]));
  const candidatos = new Set([...curados.keys()]);
  for (const item of acervo) {
    if (item.baixaResolucao === false) candidatos.add(item.caminho);
  }
  const lista = [];
  for (const caminho of candidatos) {
    const curado = curados.get(caminho);
    if (!curado && baseDeDuplicata(caminho, conhecidos)) continue;
    if (!(await existe(join(ENTRADA, caminho)))) {
      console.warn(`AUSENTE: ${caminho}`);
      continue;
    }
    const item = porCaminho.get(caminho);
    const ambiente = item ? AMBIENTE_ACERVO[item.ambiente] ?? ambientePorPasta(caminho) : ambientePorPasta(caminho);
    lista.push({ caminho, ambiente, curado, fotografo: fotografoPorNome(caminho) });
  }
  return lista.sort((a, b) => a.caminho.localeCompare(b.caminho));
}

async function processarFoto(entrada, usados) {
  const { data, info } = await sharp(join(ENTRADA, entrada.caminho)).rotate().toBuffer({ resolveWithObject: true });
  const corte = entrada.fotografo === 'Diego Jarschel' ? Math.round(info.width * CORTE_ESQUERDA_DIEGO) : 0;
  const largura = info.width - corte;
  const altura = info.height;
  const recortada = await sharp(data)
    .extract({ left: corte, top: 0, width: largura, height: altura })
    .toBuffer();
  const escala = Math.min(1, LADO_MAXIMO / Math.max(largura, altura));
  const larguraFinal = Math.round(largura * escala);
  const alturaFinal = Math.round(altura * escala);
  const saida = await sharp(recortada)
    .resize({ width: larguraFinal, height: alturaFinal })
    .modulate({ saturation: 0.94 })
    .linear([0.94, 0.94, 0.94], [14, 13, 16])
    .composite([{
      input: { create: { width: larguraFinal, height: alturaFinal, channels: 4, background: { r: 230, g: 189, b: 110, alpha: 0.08 } } },
      blend: 'soft-light',
    }])
    .jpeg({ quality: QUALIDADE_JPEG, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });

  const ambiente = entrada.ambiente;
  const slug = entrada.curado?.slug ?? slugAutomatico(entrada.caminho, ambiente);
  const slugUnico = deduplicarSlug(slug, usados);
  const arquivoRelativo = `fotos/${ambiente}/${slugUnico}.jpg`;
  await mkdir(join(ASSETS, 'fotos', ambiente), { recursive: true });
  await writeFile(join(ASSETS, arquivoRelativo), saida.data);

  const alt = entrada.curado?.alt ?? `Foto do ambiente ${ROTULO_AMBIENTE[ambiente]} no Surreal Park (rascunho)`;
  return {
    manifesto: {
      id: slugUnico,
      arquivo: arquivoRelativo,
      ambiente,
      largura: saida.info.width,
      altura: saida.info.height,
      alt,
      slot: entrada.curado?.slot ?? null,
      fotografo: entrada.fotografo,
    },
    pesoOriginalBytes: (await stat(join(ENTRADA, entrada.caminho))).size,
    pesoSaidaBytes: saida.data.length,
  };
}

async function main() {
  const acervo = JSON.parse(await readFile(ACERVO, 'utf8'));
  const lista = await montarLista(acervo);
  await rm(FOTOS, { recursive: true, force: true });
  await mkdir(FOTOS, { recursive: true });
  const usados = new Set();
  const manifesto = [];
  let pesoOriginal = 0;
  let pesoSaida = 0;
  for (const entrada of lista) {
    const resultado = await processarFoto(entrada, usados).catch((erro) => {
      throw new Error(`${entrada.caminho}: ${erro.message}`);
    });
    manifesto.push(resultado.manifesto);
    pesoOriginal += resultado.pesoOriginalBytes;
    pesoSaida += resultado.pesoSaidaBytes;
  }
  await writeFile(MANIFESTO, JSON.stringify(manifesto, null, 2) + '\n');
  const mb = (bytes) => (bytes / 1048576).toFixed(1);
  console.log(`fotos: ${manifesto.length} · originais ${mb(pesoOriginal)} MB · saída ${mb(pesoSaida)} MB`);
  const presentes = new Set(lista.map((entrada) => entrada.caminho));
  for (const [caminho, , slot] of CURADORIA) {
    if (!presentes.has(caminho)) console.warn(`SEM FOTO PARA SLOT ${slot}: ${caminho}`);
  }
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
