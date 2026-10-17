import { CATEGORIAS_DA_LOJA, PRODUTOS, isLojaAtiva, type CorDoProduto, type FormaDoProduto, type ImagemDoProduto, type Produto } from '@/data/loja';
import { CONTATOS, criarLinkWhatsApp } from '@/data/site';
import { IS_DEMONSTRACAO } from '@/data/demonstracao';
import { isPainelConfigurado, type ImagemPublica } from './painel';
import { CATEGORIA_SEM_NOME, buscarProduto, buscarProdutos, normalizarCategoria, type Disponibilidade, type ProdutoPublicoDetalhe } from './painel-publico';

export interface FotoDeProduto extends ImagemPublica { corNome: string | null }

export interface ProdutoDeTela {
  id: string;
  slug: string;
  nome: string;
  tipo: string;
  categoria: string;
  categoriaRotulo: string;
  forma: FormaDoProduto | null;
  precoEmCentavos: number;
  precoDeEmCentavos: number | null;
  percentualDesconto: number | null;
  disponibilidade: Disponibilidade;
  descricao: string;
  tamanhos: string[];
  cores: CorDoProduto[];
  imagens: ImagemDoProduto[];
  fotos: FotoDeProduto[];
  isDestaque: boolean;
  isExemplo: boolean;
}

export interface CategoriaDeTela { id: string; rotulo: string; total: number }

export { isLojaAtiva };

const COR_DA_ESTAMPA_DO_PAINEL = '#E6BD6E';

function converterProdutoLocal(produto: Produto): ProdutoDeTela {
  const categoria = CATEGORIAS_DA_LOJA.find((item) => item.id === produto.categoria);
  return {
    ...produto,
    categoria: produto.categoria,
    categoriaRotulo: categoria?.rotulo ?? CATEGORIA_SEM_NOME.rotulo,
    forma: produto.forma,
    precoDeEmCentavos: null,
    percentualDesconto: null,
    disponibilidade: 'disponivel',
    fotos: [],
  };
}

function listarCoresUnicas(detalhe: ProdutoPublicoDetalhe): CorDoProduto[] {
  const cores = new Map<string, CorDoProduto>();
  detalhe.variacoes.forEach((variacao) => {
    if (!cores.has(variacao.corNome)) cores.set(variacao.corNome, { nome: variacao.corNome, base: variacao.corHex, estampa: COR_DA_ESTAMPA_DO_PAINEL });
  });
  return [...cores.values()];
}

function listarTamanhosUnicos(detalhe: ProdutoPublicoDetalhe): string[] {
  return [...new Set(detalhe.variacoes.map((variacao) => variacao.tamanho).filter((tamanho) => tamanho.trim() !== ''))];
}

function converterProdutoDoPainel(detalhe: ProdutoPublicoDetalhe): ProdutoDeTela {
  const categoria = normalizarCategoria(detalhe.categoria);
  const fotos: FotoDeProduto[] = detalhe.imagens.length > 0
    ? detalhe.imagens
    : detalhe.imagemPrincipal ? [{ ...detalhe.imagemPrincipal, corNome: null }] : [];
  return {
    id: detalhe.slug,
    slug: detalhe.slug,
    nome: detalhe.nome,
    tipo: categoria.rotulo,
    categoria: categoria.id,
    categoriaRotulo: categoria.rotulo,
    forma: null,
    precoEmCentavos: detalhe.preco.atualCentavos,
    precoDeEmCentavos: detalhe.preco.deCentavos,
    percentualDesconto: detalhe.preco.percentualDesconto,
    disponibilidade: detalhe.disponibilidade,
    descricao: detalhe.descricao,
    tamanhos: listarTamanhosUnicos(detalhe),
    cores: listarCoresUnicas(detalhe),
    imagens: [],
    fotos,
    isDestaque: false,
    isExemplo: false,
  };
}

async function carregarProdutosDoPainel(): Promise<ProdutoDeTela[] | null> {
  if (!isPainelConfigurado) return null;
  try {
    const resumos = await buscarProdutos();
    if (resumos.length === 0 && IS_DEMONSTRACAO) return null;
    const detalhes = await Promise.all(resumos.map((resumo) => buscarProduto(resumo.slug)));
    return detalhes.map(converterProdutoDoPainel);
  } catch {
    return null;
  }
}

let produtosEmCache: Promise<ProdutoDeTela[]> | undefined;

async function resolverProdutos(): Promise<ProdutoDeTela[]> {
  return (await carregarProdutosDoPainel()) ?? PRODUTOS.map(converterProdutoLocal);
}

export function listarProdutos(): Promise<ProdutoDeTela[]> {
  produtosEmCache ??= resolverProdutos();
  return produtosEmCache;
}

export function listarCategorias(produtos: ProdutoDeTela[]): CategoriaDeTela[] {
  const categorias = new Map<string, CategoriaDeTela>();
  produtos.forEach((produto) => {
    const existente = categorias.get(produto.categoria);
    if (existente) existente.total += 1;
    else categorias.set(produto.categoria, { id: produto.categoria, rotulo: produto.categoriaRotulo, total: 1 });
  });
  const posicaoConhecida = (id: string) => {
    const indice = CATEGORIAS_DA_LOJA.findIndex((categoria) => categoria.id === id);
    return indice === -1 ? CATEGORIAS_DA_LOJA.length : indice;
  };
  return [...categorias.values()].sort((a, b) => posicaoConhecida(a.id) - posicaoConhecida(b.id));
}

export function buscarProdutosRelacionados(produto: ProdutoDeTela, produtos: ProdutoDeTela[], quantidade = 4): ProdutoDeTela[] {
  const mesmaCategoria = produtos.filter((item) => item.categoria === produto.categoria && item.id !== produto.id);
  const outros = produtos.filter((item) => item.categoria !== produto.categoria);
  return [...mesmaCategoria, ...outros].slice(0, quantidade);
}

export function criarLinkWhatsAppDoProduto(produto: ProdutoDeTela): string {
  const mensagem = [
    `Olá, quero saber sobre ${produto.nome} da Surreal Store.`,
    'Está disponível na loja do parque?',
    'Cor:',
    produto.tamanhos.length > 0 ? 'Tamanho:' : '',
  ].filter(Boolean).join('\n');
  return criarLinkWhatsApp(CONTATOS.whatsappMesas, mensagem);
}

export function descreverDisponibilidade(disponibilidade: Disponibilidade): string | null {
  if (disponibilidade === 'esgotado') return 'Esgotado';
  if (disponibilidade === 'ultimas_unidades') return 'Últimas unidades';
  return null;
}
