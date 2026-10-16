import { IS_DEMONSTRACAO } from './demonstracao';
import { CONTATOS, criarLinkWhatsApp } from '@/data/site';

export type CategoriaDaLoja = 'roupas' | 'acessorios' | 'calcados' | 'copos-e-mimos';

export type FormaDoProduto =
  | 'camiseta'
  | 'camiseta-baby'
  | 'camiseta-oversized'
  | 'jaqueta'
  | 'moletom'
  | 'saia'
  | 'short'
  | 'legging'
  | 'bone'
  | 'bucket'
  | 'oculos'
  | 'tenis'
  | 'copo'
  | 'copo-termico'
  | 'chaveiro'
  | 'adesivos';

export type VistaDoProduto = 'frente' | 'costas' | 'detalhe';

export interface CorDoProduto {
  nome: string;
  base: string;
  estampa: string;
}

export interface ImagemDoProduto {
  vista: VistaDoProduto;
  rotulo: string;
  arquivo?: string;
}

export interface Produto {
  id: string;
  slug: string;
  nome: string;
  tipo: string;
  categoria: CategoriaDaLoja;
  forma: FormaDoProduto;
  precoEmCentavos: number;
  descricao: string;
  tamanhos: string[];
  cores: [CorDoProduto, ...CorDoProduto[]];
  imagens: ImagemDoProduto[];
  isDestaque: boolean;
  isExemplo: boolean;
}

export interface CategoriaComRotulo {
  id: CategoriaDaLoja;
  rotulo: string;
}

export const CATEGORIAS_DA_LOJA: CategoriaComRotulo[] = [
  { id: 'roupas', rotulo: 'Roupas' },
  { id: 'acessorios', rotulo: 'Acessórios' },
  { id: 'calcados', rotulo: 'Calçados' },
  { id: 'copos-e-mimos', rotulo: 'Copos e mimos' },
];

export const isLojaAtiva = true;

const GRAFITE: CorDoProduto = { nome: 'Grafite', base: '#232127', estampa: '#E6BD6E' };
const PRETO: CorDoProduto = { nome: 'Preto', base: '#141316', estampa: '#C3CEDC' };
const OFF_WHITE: CorDoProduto = { nome: 'Off-white', base: '#ECE5D8', estampa: '#1A191C' };
const PRATA: CorDoProduto = { nome: 'Prata', base: '#BFC6D0', estampa: '#1A191C' };
const AREIA: CorDoProduto = { nome: 'Areia', base: '#C9B994', estampa: '#1A191C' };
const DOURADO: CorDoProduto = { nome: 'Dourado', base: '#B8862F', estampa: '#131215' };
const VERDE_BELLS: CorDoProduto = { nome: 'Verde Bells', base: '#2C4A37', estampa: '#6FD392' };

const VISTAS_DE_VESTUARIO: ImagemDoProduto[] = [
  { vista: 'frente', rotulo: 'Frente' },
  { vista: 'costas', rotulo: 'Costas' },
  { vista: 'detalhe', rotulo: 'Detalhe' },
];

const VISTAS_DE_OBJETO: ImagemDoProduto[] = [
  { vista: 'frente', rotulo: 'Frente' },
  { vista: 'detalhe', rotulo: 'Detalhe' },
];

const TAMANHOS_ADULTO = ['P', 'M', 'G', 'GG'];
const TAMANHOS_FEMININOS = ['PP', 'P', 'M', 'G'];
const TAMANHO_UNICO = ['Único'];

// Catálogo de validação de layout: nomes, preços e estoque são fictícios até os donos enviarem o catálogo real.
const CATALOGO: Produto[] = [
  {
    id: 'p01', slug: 'camiseta-olho-eclipse', nome: 'Camiseta Olho Eclipse', tipo: 'Camiseta', categoria: 'roupas', forma: 'camiseta',
    precoEmCentavos: 14900, tamanhos: [...TAMANHOS_ADULTO, 'XGG'], cores: [GRAFITE, OFF_WHITE], imagens: VISTAS_DE_VESTUARIO,
    descricao: 'Malha de algodão penteado, gola canelada e o olho da marca no peito. Nas costas, o logo completo em silk dourado.',
    isDestaque: true, isExemplo: true,
  },
  {
    id: 'p02', slug: 'jaqueta-ritual', nome: 'Jaqueta Ritual', tipo: 'Jaqueta corta-vento', categoria: 'roupas', forma: 'jaqueta',
    precoEmCentavos: 59000, tamanhos: TAMANHOS_ADULTO, cores: [GRAFITE, PRATA], imagens: VISTAS_DE_VESTUARIO,
    descricao: 'Corta-vento com forro leve, zíper de metal e punhos de ribana. O símbolo bordado no peito e o logo completo, grande, nas costas.',
    isDestaque: true, isExemplo: true,
  },
  {
    id: 'p03', slug: 'bone-piramide', nome: 'Boné Pirâmide', tipo: 'Boné', categoria: 'acessorios', forma: 'bone',
    precoEmCentavos: 12900, tamanhos: TAMANHO_UNICO, cores: [PRETO, OFF_WHITE], imagens: VISTAS_DE_OBJETO,
    descricao: 'Seis gomos, aba curva e fecho regulável de metal. O símbolo bordado em fio dourado na frente.',
    isDestaque: false, isExemplo: true,
  },
  {
    id: 'p04', slug: 'camiseta-arcos', nome: 'Camiseta Arcos', tipo: 'Camiseta oversized', categoria: 'roupas', forma: 'camiseta-oversized',
    precoEmCentavos: 16900, tamanhos: TAMANHOS_ADULTO, cores: [OFF_WHITE, PRETO], imagens: VISTAS_DE_VESTUARIO,
    descricao: 'Modelagem ampla, ombro caído e o logo completo em estampa grande na frente.',
    isDestaque: false, isExemplo: true,
  },
  {
    id: 'p05', slug: 'copo-bells', nome: 'Copo Bells', tipo: 'Copo', categoria: 'copos-e-mimos', forma: 'copo',
    precoEmCentavos: 3900, tamanhos: [], cores: [VERDE_BELLS, PRETO], imagens: VISTAS_DE_OBJETO,
    descricao: 'Copo reutilizável de 550 ml com o símbolo impresso. Volta para casa com você depois da festa.',
    isDestaque: false, isExemplo: true,
  },
  {
    id: 'p06', slug: 'baby-tee-piramide', nome: 'Baby tee Pirâmide', tipo: 'Camiseta feminina', categoria: 'roupas', forma: 'camiseta-baby',
    precoEmCentavos: 11900, tamanhos: TAMANHOS_FEMININOS, cores: [PRATA, GRAFITE], imagens: VISTAS_DE_VESTUARIO,
    descricao: 'Corte justo e curto, malha com elastano. O olho da marca em estampa pequena, no centro do peito.',
    isDestaque: false, isExemplo: true,
  },
  {
    id: 'p07', slug: 'tenis-church', nome: 'Tênis Church', tipo: 'Tênis', categoria: 'calcados', forma: 'tenis',
    precoEmCentavos: 69000, tamanhos: ['36', '37', '38', '39', '40', '41', '42', '43', '44'], cores: [OFF_WHITE, GRAFITE], imagens: VISTAS_DE_OBJETO,
    descricao: 'Cano baixo em couro, solado de borracha costurado e o símbolo da marca na lateral.',
    isDestaque: true, isExemplo: true,
  },
  {
    id: 'p08', slug: 'blusao-raw-room', nome: 'Blusão Raw Room', tipo: 'Moletom com capuz', categoria: 'roupas', forma: 'moletom',
    precoEmCentavos: 34900, tamanhos: TAMANHOS_ADULTO, cores: [GRAFITE, AREIA], imagens: VISTAS_DE_VESTUARIO,
    descricao: 'Moletom flanelado com capuz e bolso canguru. O símbolo em relevo no peito.',
    isDestaque: false, isExemplo: true,
  },
  {
    id: 'p09', slug: 'oculos-eclipse', nome: 'Óculos Eclipse', tipo: 'Óculos de sol', categoria: 'acessorios', forma: 'oculos',
    precoEmCentavos: 24900, tamanhos: [], cores: [DOURADO, PRATA], imagens: VISTAS_DE_OBJETO,
    descricao: 'Armação de metal e lentes escuras. O símbolo gravado na haste.',
    isDestaque: false, isExemplo: true,
  },
  {
    id: 'p10', slug: 'saia-lua-no-lago', nome: 'Saia Lua no Lago', tipo: 'Saia midi', categoria: 'roupas', forma: 'saia',
    precoEmCentavos: 18900, tamanhos: TAMANHOS_FEMININOS, cores: [PRETO, DOURADO], imagens: VISTAS_DE_OBJETO,
    descricao: 'Saia midi evasê de cós alto, com o símbolo bordado perto da barra.',
    isDestaque: false, isExemplo: true,
  },
  {
    id: 'p11', slug: 'chaveiro-olho', nome: 'Chaveiro Olho', tipo: 'Chaveiro', categoria: 'copos-e-mimos', forma: 'chaveiro',
    precoEmCentavos: 3500, tamanhos: [], cores: [DOURADO, PRATA], imagens: VISTAS_DE_OBJETO,
    descricao: 'Chaveiro de metal em forma de amêndoa, com os três arcos e a pirâmide em relevo.',
    isDestaque: false, isExemplo: true,
  },
  {
    id: 'p12', slug: 'short-bells', nome: 'Short Bells', tipo: 'Short', categoria: 'roupas', forma: 'short',
    precoEmCentavos: 13900, tamanhos: TAMANHOS_FEMININOS, cores: [VERDE_BELLS, GRAFITE], imagens: VISTAS_DE_OBJETO,
    descricao: 'Short de moletom leve, cós com cordão e o olho bordado na perna.',
    isDestaque: false, isExemplo: true,
  },
  {
    id: 'p13', slug: 'bucket-nomad', nome: 'Bucket Nomad', tipo: 'Chapéu bucket', categoria: 'acessorios', forma: 'bucket',
    precoEmCentavos: 14900, tamanhos: TAMANHO_UNICO, cores: [AREIA, PRETO], imagens: VISTAS_DE_OBJETO,
    descricao: 'Chapéu de sarja com aba larga e ilhoses laterais. O símbolo bordado na frente.',
    isDestaque: false, isExemplo: true,
  },
  {
    id: 'p14', slug: 'legging-arcos', nome: 'Legging Arcos', tipo: 'Legging', categoria: 'roupas', forma: 'legging',
    precoEmCentavos: 16900, tamanhos: TAMANHOS_FEMININOS, cores: [PRETO, GRAFITE], imagens: VISTAS_DE_OBJETO,
    descricao: 'Cintura alta, tecido com compressão leve e o símbolo em silk na coxa.',
    isDestaque: false, isExemplo: true,
  },
  {
    id: 'p15', slug: 'copo-termico-jet-set', nome: 'Copo térmico Jet Set', tipo: 'Copo térmico', categoria: 'copos-e-mimos', forma: 'copo-termico',
    precoEmCentavos: 12900, tamanhos: [], cores: [PRATA, PRETO], imagens: VISTAS_DE_OBJETO,
    descricao: 'Aço inox com parede dupla e tampa com bocal. O símbolo gravado a laser.',
    isDestaque: false, isExemplo: true,
  },
  {
    id: 'p16', slug: 'adesivos-arcos', nome: 'Adesivos Arcos', tipo: 'Cartela de adesivos', categoria: 'copos-e-mimos', forma: 'adesivos',
    precoEmCentavos: 2500, tamanhos: [], cores: [OFF_WHITE], imagens: [{ vista: 'frente', rotulo: 'Frente' }],
    descricao: 'Cartela com adesivos de vinil: o olho, os arcos, a pirâmide e o nome Surreal.',
    isDestaque: false, isExemplo: true,
  },
];

export const PRODUTOS: Produto[] = IS_DEMONSTRACAO ? CATALOGO : CATALOGO.filter((produto) => !produto.isExemplo);

export function formatarPreco(precoEmCentavos: number): string {
  return (precoEmCentavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function buscarRotuloDaCategoria(categoria: CategoriaDaLoja): string {
  return CATEGORIAS_DA_LOJA.find((item) => item.id === categoria)?.rotulo ?? '';
}

export function contarProdutosPorCategoria(categoria: CategoriaDaLoja): number {
  return PRODUTOS.filter((produto) => produto.categoria === categoria).length;
}

export function buscarProdutosRelacionados(produto: Produto, quantidade = 4): Produto[] {
  const mesmaCategoria = PRODUTOS.filter((item) => item.categoria === produto.categoria && item.id !== produto.id);
  const outros = PRODUTOS.filter((item) => item.categoria !== produto.categoria);
  return [...mesmaCategoria, ...outros].slice(0, quantidade);
}

export function criarLinkWhatsAppDoProduto(produto: Produto): string {
  const mensagem = [
    `Olá, quero saber sobre ${produto.nome} da Surreal Store.`,
    'Está disponível na loja do parque?',
    'Cor:',
    produto.tamanhos.length > 0 ? 'Tamanho:' : '',
  ].filter(Boolean).join('\n');
  return criarLinkWhatsApp(CONTATOS.whatsappMesas, mensagem);
}
