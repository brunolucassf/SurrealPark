export const PALCOS = ['ritual', 'bells', 'raw-room', 'nomad', 'church'] as const;

export type IdDoPalco = (typeof PALCOS)[number];

export const NOME_DO_PALCO: Record<IdDoPalco, string> = {
  ritual: 'Ritual',
  bells: 'Bells',
  'raw-room': 'Raw Room',
  nomad: 'Nomad',
  church: 'Church',
};

export interface Palco {
  id: IdDoPalco;
  nome: string;
  som?: string;
  linha: string;
  slotDaFoto: string;
  altDaFoto: string;
  forma: string;
}

export const PALCOS_EM_CARTAZ: Palco[] = [
  {
    id: 'ritual',
    nome: 'Ritual',
    som: 'Mainstage',
    linha: 'Um arco aberto para cerca de 12 mil pessoas.',
    slotDaFoto: 'ritual-mascara-concha',
    altDaFoto: 'Ritual: a pista cheia vista de dentro da concha do palco, com a serra ao fundo',
    forma: 'f-ritual',
  },
  {
    id: 'bells',
    nome: 'Bells',
    som: 'Techno',
    linha: 'Galpão, laser, fumaça e um sino gigante.',
    slotDaFoto: 'bells-sino',
    altDaFoto: 'Bells: o sino gigante suspenso sobre a pista, em luz rosa e azul',
    forma: 'f-bells',
  },
  {
    id: 'raw-room',
    nome: 'Raw Room',
    som: 'House e minimal',
    linha: 'Madeira, material reciclado e pista intimista.',
    slotDaFoto: 'raw-room-recorte',
    altDaFoto: 'Raw Room: o letreiro RxR em lâmpadas sobre a pista, sob luz vermelha',
    forma: 'f-raw-room',
  },
  {
    id: 'nomad',
    nome: 'Nomad',
    linha: 'Lonas de circo e trailers vintage à beira do lago.',
    slotDaFoto: 'nomad-lona',
    altDaFoto: 'Nomad: lonas de circo acesas por fios de lâmpadas sobre o público, à noite',
    forma: 'f-nomad',
  },
  {
    id: 'church',
    nome: 'Church',
    linha: 'Uma capela convertida, com piso de madeira.',
    slotDaFoto: 'church-ogiva',
    altDaFoto: 'Church: a fachada da capela em luz azul, vista da pista',
    forma: 'f-church',
  },
];

export const PALCO_POR_ID = Object.fromEntries(PALCOS_EM_CARTAZ.map((palco) => [palco.id, palco])) as Record<IdDoPalco, Palco>;
