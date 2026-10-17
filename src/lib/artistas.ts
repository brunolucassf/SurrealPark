import { ARTISTAS_QUE_TOCARAM } from '@/data/artistas';
import type { ImagemPublica } from './painel';
import { isPainelConfigurado } from './painel';
import { buscarArtistas } from './painel-publico';

export interface ArtistaDeTela {
  nome: string;
  edicao: { data: string; slugDaGaleria?: string } | undefined;
  foto: ImagemPublica | undefined;
}

function listarArtistasLocais(): ArtistaDeTela[] {
  return ARTISTAS_QUE_TOCARAM.map((artista) => ({ nome: artista.nome, edicao: artista.edicao, foto: undefined }));
}

async function listarArtistasDoPainel(): Promise<ArtistaDeTela[] | null> {
  if (!isPainelConfigurado) return null;
  try {
    const artistas = await buscarArtistas();
    if (artistas.length === 0) return null;
    return artistas.map((artista) => ({ nome: artista.nome, edicao: undefined, foto: artista.foto ?? undefined }));
  } catch {
    return null;
  }
}

export async function listarArtistas(): Promise<ArtistaDeTela[]> {
  return (await listarArtistasDoPainel()) ?? listarArtistasLocais();
}
