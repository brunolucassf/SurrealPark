import { IS_DEMONSTRACAO } from '@/data/demonstracao';
import { ErroDoPainel, isPainelConfigurado } from '@/lib/painel';
import { buscarProduto, buscarProdutos, normalizarCategoria, type ProdutoPublico } from '@/lib/painel-publico';

export const EVENTO_DE_CATALOGO_ATUALIZADO = 'catalogo-atualizado';

const ROTULO_DE_DISPONIBILIDADE: Record<string, string> = { esgotado: 'Esgotado', ultimas_unidades: 'Últimas unidades' };
const FORMATADOR_DE_PRECO = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const FORMATADOR_DE_MOEDA = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function escapar(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function montarPreco(produto: ProdutoPublico): string {
  const atual = `<span class="preco produto__preco"><span class="preco__moeda">R$</span>&nbsp;${FORMATADOR_DE_PRECO.format(produto.preco.atualCentavos / 100)}</span>`;
  if (produto.preco.deCentavos === null) return atual;
  const anterior = `<s class="produto__preco-de"><span class="sr-only">Preço anterior </span>${FORMATADOR_DE_MOEDA.format(produto.preco.deCentavos / 100)}</s>`;
  const desconto = produto.preco.percentualDesconto !== null ? `<span class="produto__promocao t-mono-xs">-${produto.preco.percentualDesconto}%</span>` : '';
  return `${atual}${anterior}${desconto}`;
}

function montarAvisoDeDisponibilidade(produto: ProdutoPublico): string {
  const rotulo = ROTULO_DE_DISPONIBILIDADE[produto.disponibilidade];
  return rotulo ? `<span class="produto__disponibilidade t-mono-xs" data-disponibilidade-aviso>${rotulo}</span>` : '';
}

function montarFoto(produto: ProdutoPublico): string {
  const foto = produto.imagemPrincipal;
  if (!foto) return '';
  return `<picture class="produto__foto-moldura"><img class="produto__foto" src="${escapar(foto.url)}" alt="${escapar(foto.alt)}" width="${foto.largura}" height="${foto.altura}" loading="lazy" decoding="async"></picture>`;
}

function montarCartao(produto: ProdutoPublico, ordem: number): HTMLLIElement {
  const categoria = normalizarCategoria(produto.categoria);
  const cartao = document.createElement('li');
  cartao.className = 'produto is-revelado';
  cartao.setAttribute('data-produto', '');
  cartao.dataset.categoria = categoria.id;
  cartao.dataset.categoriaRotulo = categoria.rotulo;
  cartao.dataset.preco = String(produto.preco.atualCentavos);
  cartao.dataset.ordem = String(ordem);
  cartao.dataset.slug = produto.slug;
  cartao.dataset.disponibilidade = produto.disponibilidade;
  cartao.innerHTML = `<a class="produto__link" href="/loja/${encodeURIComponent(produto.slug)}" data-inclinavel>
    <div class="produto__vitrine" style="--cor-vitrine:var(--ink-800)">${montarFoto(produto)}<span class="produto__brilho" aria-hidden="true"></span>${montarAvisoDeDisponibilidade(produto)}</div>
    <div class="produto__info"><h3 class="produto__nome">${escapar(produto.nome)}</h3><span class="produto__rodape"><span class="produto__preco-bloco" data-preco-bloco>${montarPreco(produto)}</span></span></div>
    <span class="produto__neon" aria-hidden="true"><span class="produto__neon-faixa"></span></span>
  </a>`;
  return cartao;
}

function atualizarCartao(cartao: HTMLElement, produto: ProdutoPublico): void {
  cartao.dataset.preco = String(produto.preco.atualCentavos);
  cartao.dataset.disponibilidade = produto.disponibilidade;
  const bloco = cartao.querySelector('[data-preco-bloco]');
  if (bloco) bloco.innerHTML = montarPreco(produto);
  cartao.querySelector('[data-disponibilidade-aviso]')?.remove();
  cartao.querySelector('.produto__vitrine')?.insertAdjacentHTML('beforeend', montarAvisoDeDisponibilidade(produto));
}

function contarPorCategoria(cartoes: HTMLElement[]): Map<string, { rotulo: string; total: number }> {
  const contagens = new Map<string, { rotulo: string; total: number }>();
  cartoes.forEach((cartao) => {
    const id = cartao.dataset.categoria ?? '';
    const atual = contagens.get(id) ?? { rotulo: cartao.dataset.categoriaRotulo ?? id, total: 0 };
    atual.total += 1;
    contagens.set(id, atual);
  });
  return contagens;
}

function criarFiltro(id: string, rotulo: string, total: number): HTMLButtonElement {
  const botao = document.createElement('button');
  botao.className = 'chip';
  botao.type = 'button';
  botao.dataset.filtro = id;
  botao.setAttribute('aria-pressed', 'false');
  botao.innerHTML = `${escapar(rotulo)} <span class="chip__contagem">${total}</span>`;
  return botao;
}

function atualizarFiltros(catalogo: HTMLElement, cartoes: HTMLElement[]): void {
  const area = catalogo.querySelector<HTMLElement>('[data-catalogo-filtros]');
  if (!area) return;
  const contagens = contarPorCategoria(cartoes);
  area.querySelectorAll<HTMLButtonElement>('[data-filtro]').forEach((botao) => {
    const id = botao.dataset.filtro ?? 'todos';
    const total = id === 'todos' ? cartoes.length : contagens.get(id)?.total ?? 0;
    const contagem = botao.querySelector('.chip__contagem');
    if (contagem) contagem.textContent = String(total);
    botao.hidden = id !== 'todos' && total === 0;
    contagens.delete(id);
  });
  contagens.forEach(({ rotulo, total }, id) => area.append(criarFiltro(id, rotulo, total)));
}

function reconciliarCartoes(grade: HTMLElement, produtos: ProdutoPublico[]): void {
  const porSlug = new Map(produtos.map((produto) => [produto.slug, produto]));
  const existentes = [...grade.querySelectorAll<HTMLElement>('[data-produto]')];
  existentes.forEach((cartao) => {
    const produto = porSlug.get(cartao.dataset.slug ?? '');
    if (!produto) {
      cartao.dataset.ausente = '';
      return;
    }
    delete cartao.dataset.ausente;
    atualizarCartao(cartao, produto);
  });
  const slugsExistentes = new Set(existentes.map((cartao) => cartao.dataset.slug));
  produtos
    .filter((produto) => !slugsExistentes.has(produto.slug))
    .forEach((produto, indice) => grade.append(montarCartao(produto, existentes.length + indice)));
}

export async function sincronizarCatalogoComOPainel(): Promise<void> {
  const catalogo = document.querySelector<HTMLElement>('[data-catalogo]');
  const grade = catalogo?.querySelector<HTMLElement>('[data-catalogo-grade]');
  if (!isPainelConfigurado || !catalogo || !grade) return;
  try {
    const produtos = await buscarProdutos();
    if (produtos.length === 0 && IS_DEMONSTRACAO) return;
    reconciliarCartoes(grade, produtos);
    atualizarFiltros(catalogo, [...grade.querySelectorAll<HTMLElement>('[data-produto]:not([data-ausente])')]);
    catalogo.dispatchEvent(new CustomEvent(EVENTO_DE_CATALOGO_ATUALIZADO));
  } catch {
    catalogo.dataset.painel = 'indisponivel';
  }
}

function montarPrecoDaFicha(produto: ProdutoPublico): string {
  const atual = `<span class="preco ficha__preco"><span class="preco__moeda">R$</span>&nbsp;${FORMATADOR_DE_PRECO.format(produto.preco.atualCentavos / 100)}</span>`;
  if (produto.preco.deCentavos === null) return atual;
  const anterior = `<s class="ficha__preco-de"><span class="sr-only">Preço anterior </span>${FORMATADOR_DE_MOEDA.format(produto.preco.deCentavos / 100)}</s>`;
  const desconto = produto.preco.percentualDesconto !== null ? `<span class="produto__promocao t-mono-xs">-${produto.preco.percentualDesconto}%</span>` : '';
  return `${atual}${anterior}${desconto}`;
}

function avisarIndisponibilidadeDoProduto(ficha: HTMLElement): void {
  const aviso = document.createElement('p');
  aviso.className = 't-body ficha__aviso-disponibilidade';
  aviso.setAttribute('role', 'status');
  aviso.dataset.esgotado = '';
  aviso.textContent = 'Este produto não está mais disponível no site.';
  ficha.querySelector('.ficha__acoes')?.replaceWith(aviso);
}

export async function sincronizarFichaComOPainel(): Promise<void> {
  const ficha = document.querySelector<HTMLElement>('[data-ficha]');
  if (!isPainelConfigurado || !ficha?.dataset.slug) return;
  try {
    const produto = await buscarProduto(ficha.dataset.slug);
    const preco = ficha.querySelector('[data-ficha-preco]');
    if (preco) preco.innerHTML = montarPrecoDaFicha(produto);
  } catch (erro) {
    if (erro instanceof ErroDoPainel && erro.status === 404) avisarIndisponibilidadeDoProduto(ficha);
  }
}
