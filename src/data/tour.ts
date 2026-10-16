import type { IdDaForma } from './formas';

export type TipoDaCena = 'aereo' | 'caminho' | 'palco' | 'jardim' | 'jet';
export type TipoDeParticula = 'nevoa-densa' | 'nevoa-rala' | 'vaga-lumes' | 'po-dourado' | 'fumaca' | 'bokeh' | 'po-feixe' | 'estrelas';
export type HumorDoTour = 'luar' | 'ouro' | 'ritual' | 'bells' | 'raw-room' | 'nomad' | 'church' | 'jet-set' | 'jardim';

export interface FotoDaCena {
  desktop: string;
  mobile: string;
}

export interface CenaDoTour {
  id: string;
  ancora: string | null;
  tipo: TipoDaCena;
  foto: FotoDaCena | null;
  profundidade: string | null;
  portal: IdDaForma | 'nuvem' | null;
  formaMobile: IdDaForma | null;
  foco?: [number, number];
  humor: HumorDoTour;
  particulas: { tipo: TipoDeParticula; n: number };
  vh: { desktop: number; mobile: number };
  copy: ChaveDeCopy;
  alt: string;
  isVarredura?: boolean;
  relevo?: number;
  isRenderizada: boolean;
}

export interface CenaParaOMotor {
  id: string;
  tipo: TipoDaCena;
  fotos: { url: string; largura: number }[];
  aspecto: number;
  profundidade: string | null;
  portal: CenaDoTour['portal'];
  foco: [number, number];
  cor: string;
  particulas: CenaDoTour['particulas'];
  isVarredura: boolean;
  relevo: number;
}

export type ChaveDeCopy = 'ceu' | 'historia' | 'manifesto' | 'ritual' | 'bells' | 'raw-room' | 'nomad' | 'church' | 'jet-set' | 'jardim';

const profundidadeDe = (id: string) => `/img/parque/${id}-depth.webp`;

export const CENAS_DO_TOUR: CenaDoTour[] = [
  {
    id: 'ceu',
    ancora: null,
    tipo: 'aereo',
    foto: { desktop: 'contato-skyline-aerea', mobile: 'contato-skyline-aerea-m' },
    profundidade: profundidadeDe('contato-skyline-aerea'),
    portal: null,
    formaMobile: null,
    foco: [0.36, 0.55],
    humor: 'luar',
    particulas: { tipo: 'nevoa-densa', n: 40 },
    vh: { desktop: 120, mobile: 120 },
    copy: 'ceu',
    alt: 'Vista aérea noturna do Surreal Park, com as lonas do Nomad acesas e o skyline de Balneário Camboriú no horizonte',
    isRenderizada: true,
  },
  {
    id: 'descida',
    ancora: 'historia',
    tipo: 'aereo',
    foto: { desktop: 'locacao-aerea-noturna', mobile: 'locacao-aerea-noturna-m' },
    profundidade: profundidadeDe('locacao-aerea-noturna'),
    portal: 'nuvem',
    formaMobile: 'f-olho',
    foco: [0.55, 0.52],
    humor: 'ouro',
    particulas: { tipo: 'nevoa-rala', n: 24 },
    vh: { desktop: 160, mobile: 170 },
    copy: 'historia',
    alt: 'O Surreal Park visto do alto à noite: estacionamento, galpão do Bells e as lonas do Nomad entre as árvores',
    isRenderizada: true,
  },
  {
    id: 'caminho',
    ancora: null,
    tipo: 'caminho',
    foto: { desktop: 'jardim-ebraim-0223', mobile: 'jardim-ebraim-0223-m' },
    profundidade: profundidadeDe('jardim-ebraim-0223'),
    portal: 'nuvem',
    formaMobile: 'f-olho',
    foco: [0.6, 0.53],
    humor: 'ouro',
    particulas: { tipo: 'vaga-lumes', n: 120 },
    vh: { desktop: 200, mobile: 170 },
    copy: 'manifesto',
    relevo: 0.4,
    alt: 'Caminho de pedra iluminado por postes-globo, entre palmeiras, levando às lonas acesas do parque',
    isRenderizada: true,
  },
  {
    id: 'ritual',
    ancora: 'ritual',
    tipo: 'palco',
    foto: { desktop: 'ritual-arco-dourado', mobile: 'ritual-arco-dourado-m' },
    profundidade: profundidadeDe('ritual-arco-dourado'),
    portal: 'f-ritual',
    formaMobile: 'f-ritual',
    foco: [0.47, 0.42],
    humor: 'ritual',
    particulas: { tipo: 'po-dourado', n: 350 },
    vh: { desktop: 150, mobile: 170 },
    copy: 'ritual',
    alt: 'Ritual: a estrutura em arco aberta sobre a pista cheia, com luz dourada vinda do palco',
    isRenderizada: true,
  },
  {
    id: 'bells',
    ancora: 'bells',
    tipo: 'palco',
    foto: { desktop: 'bells-sino-desktop', mobile: 'bells-sino-desktop-m' },
    profundidade: profundidadeDe('bells-sino-desktop'),
    portal: 'f-bells',
    formaMobile: 'f-bells',
    foco: [0.48, 0.56],
    humor: 'bells',
    particulas: { tipo: 'fumaca', n: 24 },
    vh: { desktop: 150, mobile: 170 },
    copy: 'bells',
    isVarredura: true,
    alt: 'Bells: o sino gigante suspenso sobre a pista, em luz azul e verde, com o público de braços erguidos',
    isRenderizada: true,
  },
  {
    id: 'raw-room',
    ancora: 'raw-room',
    tipo: 'palco',
    foto: { desktop: 'raw-room-recorte', mobile: 'raw-room-recorte-m' },
    profundidade: profundidadeDe('raw-room-recorte'),
    portal: 'f-raw-room',
    formaMobile: 'f-raw-room',
    foco: [0.54, 0.38],
    humor: 'raw-room',
    particulas: { tipo: 'bokeh', n: 80 },
    vh: { desktop: 150, mobile: 170 },
    copy: 'raw-room',
    alt: 'Raw Room: o letreiro RxR em lâmpadas sobre a pista, sob a cobertura de madeira em luz vermelha',
    isRenderizada: true,
  },
  {
    id: 'nomad',
    ancora: 'nomad',
    tipo: 'palco',
    foto: { desktop: 'nomad-diego-0733', mobile: 'nomad-diego-0733-m' },
    profundidade: profundidadeDe('nomad-diego-0733'),
    portal: 'f-nomad',
    formaMobile: 'f-nomad',
    foco: [0.53, 0.58],
    humor: 'nomad',
    particulas: { tipo: 'vaga-lumes', n: 150 },
    vh: { desktop: 150, mobile: 170 },
    copy: 'nomad',
    alt: 'Nomad: a lona de circo acesa por fios de lâmpadas sobre a pista cheia, à noite',
    isRenderizada: true,
  },
  {
    id: 'church',
    ancora: 'church',
    tipo: 'palco',
    foto: { desktop: 'church-2', mobile: 'church-ogiva' },
    profundidade: profundidadeDe('church-2'),
    portal: 'f-church',
    formaMobile: 'f-church',
    foco: [0.48, 0.66],
    humor: 'church',
    particulas: { tipo: 'po-feixe', n: 160 },
    vh: { desktop: 150, mobile: 170 },
    copy: 'church',
    alt: 'Church: a capela com a cruz em neon azul no alto da torre, sobre a pista coberta e o público',
    isRenderizada: true,
  },
  {
    id: 'jet-set',
    ancora: 'jet-set',
    tipo: 'jet',
    foto: null,
    profundidade: null,
    portal: 'f-jet-set',
    formaMobile: 'f-jet-set',
    foco: [0.5, 0.5],
    humor: 'jet-set',
    particulas: { tipo: 'estrelas', n: 300 },
    vh: { desktop: 150, mobile: 170 },
    copy: 'jet-set',
    alt: 'Jet Set: o traço de um Boeing 727 no céu noturno, com as janelas acendendo',
    isRenderizada: true,
  },
  {
    id: 'jardim',
    ancora: 'jardim',
    tipo: 'jardim',
    foto: { desktop: 'jardim-ebraim-2132', mobile: 'jardim-ebraim-2132-m' },
    profundidade: profundidadeDe('jardim-ebraim-2132'),
    portal: 'f-olho',
    formaMobile: 'f-olho',
    foco: [0.6, 0.5],
    humor: 'jardim',
    particulas: { tipo: 'vaga-lumes', n: 100 },
    vh: { desktop: 180, mobile: 170 },
    copy: 'jardim',
    alt: 'Jardim de Esculturas: escultura em silhueta no gramado, com as lonas acesas do Nomad e a lua ao fundo',
    isRenderizada: true,
  },
];

export const COR_DO_HUMOR: Record<HumorDoTour, string> = {
  luar: '#9FB0C6',
  ouro: '#D6A24A',
  ritual: '#F2694E',
  bells: '#6FD392',
  'raw-room': '#F0A050',
  nomad: '#F4B860',
  church: '#7FA6FF',
  'jet-set': '#C3CEDC',
  jardim: '#A9CF74',
};

export interface LinhaDeFicha {
  rotulo: string;
  valor: string;
}

export interface CopyDoPalco {
  tipo: 'palco';
  rotulo: string;
  nome: string;
  complemento: string;
  selo?: string;
  assinatura: string;
  corpo: string;
  ficha: LinhaDeFicha[];
  link?: { texto: string; href: string };
}

export interface CopyDoCeu {
  tipo: 'ceu';
  rotulo: string;
  titulo: string;
}

export interface CopyDaHistoria {
  tipo: 'historia';
  titulo: string;
  paragrafos: string[];
  numeros: LinhaDeFicha[];
}

export interface CopyDoManifesto {
  tipo: 'manifesto';
  tituloAcessivel: string;
  linhas: string[];
}

export type CopyDaCena = CopyDoCeu | CopyDaHistoria | CopyDoManifesto | CopyDoPalco;

export const COPY_DO_TOUR: Partial<Record<ChaveDeCopy, CopyDaCena>> = {
  ceu: {
    tipo: 'ceu',
    rotulo: 'O Parque',
    titulo: 'Surreal Park: música e arte no mesmo chão',
  },
  historia: {
    tipo: 'historia',
    titulo: 'Desde 26 de dezembro de 2021',
    paragrafos: [
      'O Surreal Park abriu em 26 de dezembro de 2021, em Camboriú, Santa Catarina. A ideia é de Renato Ratier, DJ e empresário com trajetória ligada ao D-Edge e ao Warung: um club ao ar livre onde a música eletrônica e a arte inspirada no surrealismo ocupam o mesmo terreno, com vista para a serra e para o skyline de Balneário Camboriú.',
      'São 135 mil m². É por essa medida que o Surreal se chama de maior club do mundo. Lá dentro: cinco palcos de arquiteturas que não se repetem, um jardim de esculturas, um bar de sucos, uma loja, redário e um sexto palco em construção, dentro de um Boeing 727.',
    ],
    numeros: [
      { rotulo: 'Área', valor: '135 mil m²' },
      { rotulo: 'Abertura', valor: '26.12.2021' },
    ],
  },
  manifesto: {
    tipo: 'manifesto',
    tituloAcessivel: 'Manifesto',
    linhas: [
      'Surreal quer dizer acima do real.',
      'Em Camboriú, a música eletrônica e a arte dividem 135 mil m² de chão.',
      'Um sino gigante dentro de um galpão. Uma capela que virou pista. Lonas de circo à beira do lago. Um Boeing 727 à espera do primeiro set.',
      'Nada disso é decoração. É a gramática do surrealismo: coisas reais, em lugares que não eram delas.',
      'Um sonho de olhos abertos.',
    ],
  },
  ritual: {
    tipo: 'palco',
    rotulo: '01 / 07 · Mainstage',
    nome: 'Ritual',
    complemento: ', o mainstage do Surreal Park',
    assinatura: 'Terra, Sol e Lua na mesma linha.',
    corpo: 'O palco principal recebe cerca de 12 mil pessoas diante de uma estrutura em arco, aberta como uma concha para a pista. A forma representa o alinhamento entre a Terra, o Sol e a Lua, a mesma geometria de um eclipse. É a maior pista do parque.',
    ficha: [
      { rotulo: 'Capacidade', valor: 'cerca de 12 mil pessoas' },
      { rotulo: 'Formato', valor: 'arco/concha' },
    ],
    link: { texto: 'Ver fotos do Ritual', href: '/galeria?amb=ritual' },
  },
  bells: {
    tipo: 'palco',
    rotulo: '02 / 07 · Techno',
    nome: 'Bells',
    complemento: ', o techno do Surreal Park',
    assinatura: 'Techno sob um sino gigante.',
    corpo: 'Um galpão de 2 mil m², entre o industrial e o rústico, guarda um sino gigante. A referência é o pub inglês e irlandês; o som é techno, e o espaço é desenhado por laser e fumaça.',
    ficha: [
      { rotulo: 'Área', valor: '2 mil m²' },
      { rotulo: 'Som', valor: 'techno' },
      { rotulo: 'Luz', valor: 'laser e fumaça' },
    ],
    link: { texto: 'Ver fotos do Bells', href: '/galeria?amb=bells' },
  },
  'raw-room': {
    tipo: 'palco',
    rotulo: '03 / 07 · House e minimal',
    nome: 'Raw Room',
    complemento: ', house e minimal no Surreal Park',
    assinatura: 'Feito do que seria descartado.',
    corpo: 'O Raw Room, ou RxR, segue o garbage design: estrutura erguida com material reciclado e um deck de madeira em torno da pista. É um palco intimista, pensado para house e minimal ouvidos de perto.',
    ficha: [
      { rotulo: 'Som', valor: 'house e minimal' },
      { rotulo: 'Construção', valor: 'material reciclado, deck de madeira' },
    ],
    link: { texto: 'Ver fotos do Raw Room', href: '/galeria?amb=raw-room' },
  },
  nomad: {
    tipo: 'palco',
    rotulo: '04 / 07 · Lonas de circo',
    nome: 'Nomad',
    complemento: ', o palco sob lonas do Surreal Park',
    assinatura: 'Um circo que parou à beira do lago.',
    corpo: 'Lonas de circo armadas junto ao lago, trailers vintage ao redor e a estética da cultura cigana. O Nomad tem cara de caravana que acabou de chegar e poderia partir amanhã. Não parte.',
    ficha: [
      { rotulo: 'Ambientação', valor: 'lonas de circo, trailers vintage' },
      { rotulo: 'Localização', valor: 'junto ao lago' },
    ],
    link: { texto: 'Ver fotos do Nomad', href: '/galeria?amb=nomad' },
  },
  church: {
    tipo: 'palco',
    rotulo: '05 / 07 · Capela',
    nome: 'Church',
    complemento: ', a capela do Surreal Park',
    assinatura: 'Uma capela convertida à pista.',
    corpo: 'Uma capela transformada em pista, entre o lago e o jardim de esculturas. O piso de madeira favorece a acústica, e o espaço é coberto, com bar e banheiros próprios.',
    ficha: [
      { rotulo: 'Espaço', valor: 'coberto' },
      { rotulo: 'Piso', valor: 'madeira' },
      { rotulo: 'Estrutura', valor: 'bar e banheiros próprios' },
    ],
    link: { texto: 'Ver fotos da Church', href: '/galeria?amb=church' },
  },
  'jet-set': {
    tipo: 'palco',
    rotulo: '06 / 07 · Boeing 727',
    nome: 'Jet Set',
    complemento: ', o palco em construção do Surreal Park',
    selo: 'Em construção',
    assinatura: 'Um Boeing 727 trocou de pista.',
    corpo: 'O sexto palco do Surreal está sendo montado dentro da fuselagem de um Boeing 727. A data de abertura ainda não foi anunciada. Quando abrir, aparece aqui e na programação.',
    ficha: [],
  },
  jardim: {
    tipo: 'palco',
    rotulo: '07 / 07 · Esculturas',
    nome: 'Jardim de Esculturas',
    complemento: 'do Surreal Park',
    assinatura: 'Olhos gigantes, um rinoceronte, uma vaca, um touro.',
    corpo: 'Entre os palcos, o jardim põe em prática a ideia mais antiga do surrealismo: objetos conhecidos, no tamanho ou no lugar que ninguém espera. O caminho de um palco a outro deixa de ser trajeto e vira parte da noite.',
    ficha: [],
  },
};

export const FECHO_DO_PARQUE = {
  tituloComData: 'A próxima noite já tem data.',
  tituloSemData: 'Novas datas em breve.',
  mesas: { texto: 'Mesas e camarotes', href: '/contato#mesas' },
};

export const CENAS_RENDERIZADAS = CENAS_DO_TOUR.filter((cena) => cena.isRenderizada);

export interface ItemDoIndice {
  rotulo: string;
  alvo: string;
}

export const INDICE_DO_PARQUE: ItemDoIndice[] = [
  { rotulo: 'História', alvo: 'historia' },
  { rotulo: 'Ritual', alvo: 'ritual' },
  { rotulo: 'Bells', alvo: 'bells' },
  { rotulo: 'Raw Room', alvo: 'raw-room' },
  { rotulo: 'Nomad', alvo: 'nomad' },
  { rotulo: 'Church', alvo: 'church' },
  { rotulo: 'Jet Set', alvo: 'jet-set' },
  { rotulo: 'Jardim', alvo: 'jardim' },
  { rotulo: 'Ranking', alvo: 'ranking' },
  { rotulo: 'Juistreet', alvo: 'juistreet' },
  { rotulo: 'Serviços', alvo: 'servicos' },
  { rotulo: 'Loja', alvo: 'loja' },
  { rotulo: 'Artistas', alvo: 'artistas' },
];
