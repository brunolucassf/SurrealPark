export interface EdicaoDoArtista {
  data: string;
  slugDaGaleria?: string;
}

export type OrigemDoNome = 'fonte-publica' | 'indicado-pelo-cliente';

export interface ArtistaQueTocou {
  nome: string;
  origem: OrigemDoNome;
  edicao?: EdicaoDoArtista;
}

// Nenhum vínculo artista-edição foi confirmado: sem `edicao`, o card não vira link nem mostra data.
export const ARTISTAS_QUE_TOCARAM: ArtistaQueTocou[] = [
  { nome: 'Carl Cox', origem: 'fonte-publica' },
  { nome: 'Korolova', origem: 'indicado-pelo-cliente' },
  { nome: 'Black Coffee', origem: 'fonte-publica' },
  { nome: 'Anderson Noise', origem: 'fonte-publica' },
  { nome: 'Joseph Capriati', origem: 'fonte-publica' },
  { nome: 'Miss Monique', origem: 'indicado-pelo-cliente' },
  { nome: 'Seth Troxler', origem: 'fonte-publica' },
  { nome: 'Vermouth', origem: 'indicado-pelo-cliente' },
  { nome: 'Maceo Plex', origem: 'fonte-publica' },
  { nome: 'Gui Boratto', origem: 'fonte-publica' },
  { nome: 'Dixon', origem: 'fonte-publica' },
  { nome: 'Beltran', origem: 'indicado-pelo-cliente' },
  { nome: 'Pawsa', origem: 'fonte-publica' },
  { nome: 'Claudinho Brasil', origem: 'indicado-pelo-cliente' },
  { nome: 'Lee Burridge', origem: 'fonte-publica' },
  { nome: 'Rebolledo', origem: 'fonte-publica' },
  { nome: 'Hernan Cattaneo', origem: 'fonte-publica' },
  { nome: 'Fat Sync', origem: 'indicado-pelo-cliente' },
  { nome: 'Guy J', origem: 'fonte-publica' },
  { nome: 'Vegas', origem: 'indicado-pelo-cliente' },
  { nome: 'Ellen Allien', origem: 'fonte-publica' },
  { nome: 'Sébastien Léger', origem: 'fonte-publica' },
  { nome: 'Octave One', origem: 'fonte-publica' },
  { nome: 'Botanic Sound System', origem: 'indicado-pelo-cliente' },
  { nome: 'Ratier', origem: 'fonte-publica' },
];

export const IS_LISTA_PARCIAL = true;
