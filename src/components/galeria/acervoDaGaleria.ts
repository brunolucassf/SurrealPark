import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import manifesto from '@/assets/manifest.json';
import { buscarImagemPorArquivo } from '@/lib/fotos';

export interface AmbienteDaGaleria {
  chave: string;
  nome: string;
}

export interface FotoDaGaleria {
  id: string;
  arquivo: string;
  ambiente: string;
  nomeDoAmbiente: string;
  alt: string;
  legenda: string;
  fotografo: string | null;
  imagem: ImageMetadata;
  isPaisagem: boolean;
  grande: { src: string; largura: number; altura: number };
}

export const AMBIENTES: AmbienteDaGaleria[] = [
  { chave: 'ritual', nome: 'Ritual' },
  { chave: 'bells', nome: 'Bells' },
  { chave: 'raw-room', nome: 'Raw Room' },
  { chave: 'nomad', nome: 'Nomad' },
  { chave: 'church', nome: 'Church' },
  { chave: 'jardim', nome: 'Jardim' },
  { chave: 'juistreet', nome: 'Juistreet' },
  { chave: 'loja', nome: 'Loja' },
];

const IDS_FORA_DA_GALERIA = /^(contato|parque|locacao|servicos|rino)-|-m$/;
const AMBIENTE_AGRUPADO: Record<string, string> = { crepusculo: 'jardim' };
const LARGURA_DO_LIGHTBOX = 1680;
const PROPORCAO_PAISAGEM = 1.15;

interface EntradaDoAcervo {
  id: string;
  arquivo: string;
  ambiente: string;
  alt: string;
  fotografo: string | null;
}

function intercalarPorAmbiente<T extends { ambiente: string }>(fotos: T[]): T[] {
  const totais = new Map<string, number>();
  fotos.forEach((foto) => totais.set(foto.ambiente, (totais.get(foto.ambiente) ?? 0) + 1));
  const vistos = new Map<string, number>();
  return fotos
    .map((foto) => {
      const posicao = vistos.get(foto.ambiente) ?? 0;
      vistos.set(foto.ambiente, posicao + 1);
      return { foto, ordem: (posicao + 0.5) / (totais.get(foto.ambiente) ?? 1) };
    })
    .sort((a, b) => a.ordem - b.ordem)
    .map(({ foto }) => foto);
}

export async function carregarFotosDaGaleria(): Promise<FotoDaGaleria[]> {
  const entradas = (manifesto as EntradaDoAcervo[]).filter((entrada) => !IDS_FORA_DA_GALERIA.test(entrada.id));
  const agrupadas = entradas.map((entrada) => ({ ...entrada, ambiente: AMBIENTE_AGRUPADO[entrada.ambiente] ?? entrada.ambiente }));
  const posicaoNoAmbiente = new Map<string, number>();
  const totalNoAmbiente = new Map<string, number>();
  agrupadas.forEach((entrada) => totalNoAmbiente.set(entrada.ambiente, (totalNoAmbiente.get(entrada.ambiente) ?? 0) + 1));

  const fotos = await Promise.all(
    intercalarPorAmbiente(agrupadas).map(async (entrada): Promise<FotoDaGaleria | null> => {
      const imagem = buscarImagemPorArquivo(entrada.arquivo);
      const ambiente = AMBIENTES.find((item) => item.chave === entrada.ambiente);
      if (!imagem || !ambiente) return null;
      const ordem = (posicaoNoAmbiente.get(entrada.ambiente) ?? 0) + 1;
      posicaoNoAmbiente.set(entrada.ambiente, ordem);
      const isAltRascunho = /rascunho/i.test(entrada.alt);
      const grande = await getImage({ src: imagem, width: Math.min(LARGURA_DO_LIGHTBOX, imagem.width), format: 'avif', quality: 60 });
      return {
        id: entrada.id,
        arquivo: entrada.arquivo,
        ambiente: entrada.ambiente,
        nomeDoAmbiente: ambiente.nome,
        alt: isAltRascunho ? `${ambiente.nome}, foto ${ordem} de ${totalNoAmbiente.get(entrada.ambiente)}` : entrada.alt,
        legenda: isAltRascunho ? ambiente.nome : `${ambiente.nome}: ${entrada.alt}`,
        fotografo: entrada.fotografo,
        imagem,
        isPaisagem: imagem.width / imagem.height > PROPORCAO_PAISAGEM,
        grande: { src: grande.src, largura: Number(grande.attributes.width), altura: Number(grande.attributes.height) },
      };
    }),
  );
  return fotos.filter((foto): foto is FotoDaGaleria => foto !== null);
}
