import type { ImageMetadata } from 'astro';

export interface FotoDoAcervo {
  id: string;
  arquivo: string;
  ambiente: string;
  largura: number;
  altura: number;
  alt: string;
  slot: string | null;
  fotografo: string | null;
  imagem: ImageMetadata;
}

type EntradaDoManifesto = Omit<FotoDoAcervo, 'imagem'>;

const arquivosDeImagem = import.meta.glob<{ default: ImageMetadata }>('/src/assets/fotos/**/*.{jpg,jpeg,png,webp,avif}', { eager: true });
const manifestos = import.meta.glob<{ default: EntradaDoManifesto[] }>('/src/assets/manifest.json', { eager: true });
const manifesto: EntradaDoManifesto[] = Object.values(manifestos)[0]?.default ?? [];

function localizarImagem(arquivo: string): ImageMetadata | undefined {
  return arquivosDeImagem[`/src/assets/${arquivo.replace(/^\/?(src\/assets\/)?/, '')}`]?.default;
}

export function buscarImagemPorArquivo(arquivo: string): ImageMetadata | undefined {
  return localizarImagem(arquivo);
}

export function buscarFotoPorSlot(slot: string, reserva?: { arquivo: string; alt: string; ambiente: string }): FotoDoAcervo | undefined {
  const entrada = manifesto.find((item) => item.slot === slot);
  if (entrada) {
    const imagem = localizarImagem(entrada.arquivo);
    if (imagem) return { ...entrada, imagem };
  }
  if (!reserva) return undefined;
  const imagem = localizarImagem(reserva.arquivo);
  if (!imagem) return undefined;
  return { id: slot, arquivo: reserva.arquivo, ambiente: reserva.ambiente, largura: imagem.width, altura: imagem.height, alt: reserva.alt, slot, fotografo: null, imagem };
}

export const LARGURAS_RESPONSIVAS = [480, 828, 1200, 1680, 2400, 3200];

export function filtrarLarguras(larguraOriginal: number): number[] {
  const larguras = LARGURAS_RESPONSIVAS.filter((largura) => largura <= larguraOriginal);
  return larguras.includes(larguraOriginal) || larguras.length === LARGURAS_RESPONSIVAS.length ? larguras : [...larguras, larguraOriginal];
}
