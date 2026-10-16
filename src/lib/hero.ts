import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';
import { buscarFotoPorSlot, buscarImagemPorArquivo, filtrarLarguras } from './fotos';

export const MIDIA_MOBILE_DO_HERO = '(max-width: 767px)';
export const TAMANHOS_DESKTOP_DO_HERO = '(max-aspect-ratio: 3/2) 146vh, 100vw';
const QUALIDADE = 55;
const QUALIDADE_DA_REVELADA_DESKTOP = 62;
const QUALIDADE_DA_REVELADA_MOBILE = 55;

export interface VersaoDoHero {
  avif: string;
  webp: string;
  src: string;
  largura: number;
  altura: number;
}

export interface HeroPreparado {
  alt: string;
  desktop: VersaoDoHero;
  mobile: VersaoDoHero | null;
  reveladaDesktop: string[];
  reveladaMobile: string[];
}

async function gerarVersao(imagem: ImageMetadata, sizes: string, larguraMaxima: number): Promise<VersaoDoHero> {
  const widths = filtrarLarguras(imagem.width).filter((largura) => largura <= larguraMaxima);
  const [avif, webp] = await Promise.all([
    getImage({ src: imagem, format: 'avif', widths, sizes, quality: QUALIDADE }),
    getImage({ src: imagem, format: 'webp', widths, sizes, quality: QUALIDADE + 10 }),
  ]);
  return { avif: avif.srcSet.attribute, webp: webp.srcSet.attribute, src: webp.src, largura: imagem.width, altura: imagem.height };
}

async function gerarUrlsDaRevelada(imagem: ImageMetadata, largura: number, qualidade: number): Promise<string[]> {
  const limite = Math.min(largura, imagem.width);
  const [avif, webp] = await Promise.all([
    getImage({ src: imagem, format: 'avif', width: limite, quality: qualidade }),
    getImage({ src: imagem, format: 'webp', width: limite, quality: qualidade + 10 }),
  ]);
  return [avif.src, webp.src];
}

export async function prepararHero(): Promise<HeroPreparado | null> {
  const realidadeDesktop = buscarImagemPorArquivo('fotos/nomad/nomad-realidade-desktop.jpg');
  const realidadeMobile = buscarImagemPorArquivo('fotos/nomad/nomad-realidade-mobile.jpg');
  const capa = buscarFotoPorSlot('home-hero');
  const ritual = buscarImagemPorArquivo('fotos/ritual/ritual-azul.jpg');
  const imagemDesktop = realidadeDesktop ?? capa?.imagem;
  if (!imagemDesktop || !ritual) return null;

  return {
    alt: 'Nomad: lonas de circo ao pôr do sol, com o público na pista e o skyline de Balneário Camboriú ao fundo',
    desktop: await gerarVersao(imagemDesktop, TAMANHOS_DESKTOP_DO_HERO, 3200),
    mobile: realidadeMobile ? await gerarVersao(realidadeMobile, '100vw', 1200) : null,
    reveladaDesktop: await gerarUrlsDaRevelada(ritual, 2400, QUALIDADE_DA_REVELADA_DESKTOP),
    reveladaMobile: await gerarUrlsDaRevelada(ritual, 1200, QUALIDADE_DA_REVELADA_MOBILE),
  };
}
