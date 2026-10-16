import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';
import manifesto from '@/assets/manifest.json';
import { buscarImagemPorArquivo } from '@/lib/fotos';
import { CENAS_RENDERIZADAS, COR_DO_HUMOR, type CenaDoTour, type CenaParaOMotor } from '@/data/tour';
import { FORMAS, type IdDaForma } from '@/data/formas';

const QUALIDADE_AVIF = 55;
const QUALIDADE_WEBP = 65;
const LARGURAS_DESKTOP = [1200, 1680, 2400];
const LARGURAS_MOBILE = [480, 828, 1200];
const LARGURAS_DO_APOIO = [480, 700, 960];
const FRACAO_MAIS_DISTANTE = 0.05;

interface EntradaDoManifesto {
  id: string;
  arquivo: string;
  largura: number;
  altura: number;
  alt: string;
  mobile?: string;
}

export interface FonteDaFoto {
  avif: string;
  webp: string;
  src: string;
  largura: number;
  altura: number;
}

export interface ApoioPreparado {
  fonte: FonteDaFoto;
  alt: string;
  legenda: string;
}

export interface CenaPreparada {
  cena: CenaDoTour;
  indice: number;
  isUltima: boolean;
  desktop: FonteDaFoto | null;
  mobile: FonteDaFoto | null;
  mascaraMobile: string | null;
  foco: [number, number];
  apoio: ApoioPreparado | null;
}

const entradas = manifesto as EntradaDoManifesto[];

function buscarEntrada(id: string): EntradaDoManifesto | undefined {
  return entradas.find((entrada) => entrada.id === id);
}

async function gerarFonte(imagem: ImageMetadata, larguras: number[]): Promise<FonteDaFoto> {
  const widths = larguras.filter((largura) => largura <= imagem.width);
  if (widths.length === 0) widths.push(imagem.width);
  const [avif, webp] = await Promise.all([
    getImage({ src: imagem, format: 'avif', widths, quality: QUALIDADE_AVIF }),
    getImage({ src: imagem, format: 'webp', widths, quality: QUALIDADE_WEBP }),
  ]);
  return { avif: avif.srcSet.attribute, webp: webp.srcSet.attribute, src: webp.src, largura: imagem.width, altura: imagem.height };
}

async function carregarFoto(id: string, larguras: number[]): Promise<FonteDaFoto | null> {
  const entrada = buscarEntrada(id);
  const imagem = entrada ? buscarImagemPorArquivo(entrada.arquivo) : undefined;
  return imagem ? gerarFonte(imagem, larguras) : null;
}

async function calcularFocoPeloDepth(caminhoPublico: string): Promise<[number, number]> {
  try {
    const { default: sharp } = await import('sharp');
    const { data, info } = await sharp(`public${caminhoPublico}`).greyscale().raw().toBuffer({ resolveWithObject: true });
    const valores = Uint8Array.from(data);
    const limite = [...valores].sort((a, b) => a - b)[Math.floor(valores.length * FRACAO_MAIS_DISTANTE)] ?? 0;
    let somaX = 0;
    let somaY = 0;
    let quantidade = 0;
    valores.forEach((valor, indice) => {
      if (valor > limite) return;
      somaX += indice % info.width;
      somaY += Math.floor(indice / info.width);
      quantidade += 1;
    });
    if (!quantidade) return [0.5, 0.5];
    return [+(somaX / quantidade / info.width).toFixed(3), +(1 - somaY / quantidade / info.height).toFixed(3)];
  } catch {
    return [0.5, 0.5];
  }
}

async function carregarApoio(cena: CenaDoTour): Promise<ApoioPreparado | null> {
  if (!cena.apoio) return null;
  const entrada = buscarEntrada(cena.apoio.foto);
  const fonte = await carregarFoto(cena.apoio.foto, LARGURAS_DO_APOIO);
  return entrada && fonte ? { fonte, alt: entrada.alt, legenda: cena.apoio.legenda } : null;
}

function proporcaoDaFormaMobile(forma: IdDaForma): [number, number] {
  if (forma === 'f-olho') return [2, 1];
  if (forma === 'f-raw-room') return [1, 1];
  return [4, 5];
}

function lerSrcset(srcset: string): { url: string; largura: number }[] {
  return srcset.split(',').map((item) => {
    const [url = '', descritor = ''] = item.trim().split(/\s+/);
    return { url, largura: parseInt(descritor, 10) || 0 };
  }).filter((item) => item.url && item.largura);
}

export function gerarMascaraSvg(forma: IdDaForma): string {
  const [largura, altura] = proporcaoDaFormaMobile(forma);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1' width='${largura * 100}' height='${altura * 100}' preserveAspectRatio='none'><path d='${FORMAS[forma]}'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg).replace(/'/g, '%27')}")`;
}

export async function prepararTour(): Promise<{ cenas: CenaPreparada[]; motor: CenaParaOMotor[] }> {
  const cenas = await Promise.all(CENAS_RENDERIZADAS.map(async (cena, indice): Promise<CenaPreparada> => {
    const entradaDesktop = cena.foto ? buscarEntrada(cena.foto.desktop) : undefined;
    const idMobile = cena.foto ? (buscarEntrada(cena.foto.mobile) ? cena.foto.mobile : entradaDesktop?.mobile ?? cena.foto.desktop) : null;
    const [desktop, mobile, apoio] = await Promise.all([
      cena.foto ? carregarFoto(cena.foto.desktop, LARGURAS_DESKTOP) : Promise.resolve(null),
      idMobile ? carregarFoto(idMobile, LARGURAS_MOBILE) : Promise.resolve(null),
      carregarApoio(cena),
    ]);
    const foco = cena.foco ?? (cena.profundidade ? await calcularFocoPeloDepth(cena.profundidade) : [0.5, 0.5]);
    return {
      cena,
      indice,
      isUltima: indice === CENAS_RENDERIZADAS.length - 1,
      desktop,
      mobile,
      mascaraMobile: cena.formaMobile ? gerarMascaraSvg(cena.formaMobile) : null,
      foco,
      apoio,
    };
  }));

  const motor = cenas.map(({ cena, desktop, foco }): CenaParaOMotor => ({
    id: cena.id,
    tipo: cena.tipo,
    fotos: desktop ? lerSrcset(desktop.avif) : [],
    aspecto: desktop ? desktop.largura / desktop.altura : 16 / 9,
    profundidade: cena.profundidade,
    portal: cena.portal,
    foco,
    cor: COR_DO_HUMOR[cena.humor],
    particulas: cena.particulas,
    isVarredura: Boolean(cena.isVarredura),
    relevo: cena.relevo ?? 1,
  }));

  return { cenas, motor };
}
