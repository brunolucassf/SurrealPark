import { ativarInclinacao, podeAnimar } from '@/scripts/loja/inclinacao';

type Ordem = 'destaques' | 'menor-preco' | 'maior-preco';

const DURACAO_DA_TROCA_MS = 484;
const DURACAO_DA_ENTRADA_MS = 968;
const PASSO_DO_ESCALONAMENTO_MS = 70;
const ESCALONAMENTO_MAXIMO_MS = 420;
const CURVA_OLHO = 'cubic-bezier(0.83, 0, 0.17, 1)';
const CURVA_SAIDA = 'cubic-bezier(0.16, 1, 0.3, 1)';

function lerNumero(elemento: HTMLElement, chave: string): number {
  return Number(elemento.dataset[chave] ?? 0);
}

function compararPor(ordem: Ordem) {
  return (a: HTMLElement, b: HTMLElement) => {
    if (ordem === 'menor-preco') return lerNumero(a, 'preco') - lerNumero(b, 'preco');
    if (ordem === 'maior-preco') return lerNumero(b, 'preco') - lerNumero(a, 'preco');
    return lerNumero(a, 'ordem') - lerNumero(b, 'ordem');
  };
}

function descreverResultado(quantidade: number, rotuloDaCategoria: string): string {
  const produtos = quantidade === 1 ? '1 produto' : `${quantidade} produtos`;
  return rotuloDaCategoria ? `${produtos} em ${rotuloDaCategoria}` : produtos;
}

function revelarAoEntrar(catalogo: HTMLElement, cartoes: HTMLElement[]): void {
  if (!catalogo.classList.contains('catalogo--anima')) return;
  if (!('IntersectionObserver' in window)) {
    catalogo.classList.remove('catalogo--anima');
    return;
  }
  const observador = new IntersectionObserver((entradas) => {
    const visiveis = entradas.filter((entrada) => entrada.isIntersecting).map((entrada) => entrada.target as HTMLElement);
    visiveis.forEach((cartao, indice) => {
      observador.unobserve(cartao);
      cartao.classList.add('is-revelado');
      cartao.animate(
        [
          { clipPath: 'inset(100% 0 0 0)', transform: 'translateY(28px)', opacity: 0 },
          { clipPath: 'inset(0 0 0 0)', transform: 'none', opacity: 1 },
        ],
        { duration: DURACAO_DA_ENTRADA_MS, delay: Math.min(indice * PASSO_DO_ESCALONAMENTO_MS, ESCALONAMENTO_MAXIMO_MS), easing: CURVA_SAIDA, fill: 'backwards' },
      );
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  cartoes.forEach((cartao) => observador.observe(cartao));
}

function animarTroca(visiveis: HTMLElement[], posicoesAnteriores: Map<HTMLElement, DOMRect>): void {
  let novos = 0;
  visiveis.forEach((cartao) => {
    cartao.classList.add('is-revelado');
    const anterior = posicoesAnteriores.get(cartao);
    if (anterior) {
      const atual = cartao.getBoundingClientRect();
      const deslocamentoX = anterior.left - atual.left;
      const deslocamentoY = anterior.top - atual.top;
      if (Math.abs(deslocamentoX) < 1 && Math.abs(deslocamentoY) < 1) return;
      cartao.animate(
        [{ transform: `translate(${deslocamentoX}px, ${deslocamentoY}px)` }, { transform: 'none' }],
        { duration: DURACAO_DA_TROCA_MS, easing: CURVA_OLHO },
      );
      return;
    }
    cartao.animate(
      [{ opacity: 0, transform: 'translateY(16px) scale(.97)' }, { opacity: 1, transform: 'none' }],
      { duration: DURACAO_DA_TROCA_MS, delay: Math.min(novos++ * 40, 240), easing: CURVA_SAIDA, fill: 'backwards' },
    );
  });
}

export function iniciarCatalogo(): void {
  const catalogo = document.querySelector<HTMLElement>('[data-catalogo]');
  const grade = catalogo?.querySelector<HTMLElement>('[data-catalogo-grade]');
  if (!catalogo || !grade) return;
  catalogo.dataset.pronto = '1';

  const filtros = [...catalogo.querySelectorAll<HTMLButtonElement>('[data-filtro]')];
  const seletorDeOrdem = catalogo.querySelector<HTMLSelectElement>('[data-catalogo-ordem]');
  const status = catalogo.querySelector<HTMLElement>('[data-catalogo-status]');
  const vazio = catalogo.querySelector<HTMLElement>('[data-catalogo-vazio]');
  const cartoes = [...grade.querySelectorAll<HTMLElement>('[data-produto]')];
  const categoriasValidas = new Set(filtros.map((botao) => botao.dataset.filtro));

  let categoriaAtual = 'todos';
  let ordemAtual: Ordem = 'destaques';

  const aplicar = (isAnimado: boolean) => {
    const posicoesAnteriores = new Map(cartoes.filter((cartao) => !cartao.hidden).map((cartao) => [cartao, cartao.getBoundingClientRect()]));
    const ordenados = [...cartoes].sort(compararPor(ordemAtual));
    grade.append(...ordenados);
    ordenados.forEach((cartao) => {
      cartao.hidden = categoriaAtual !== 'todos' && cartao.dataset.categoria !== categoriaAtual;
    });
    const visiveis = ordenados.filter((cartao) => !cartao.hidden);
    filtros.forEach((botao) => botao.setAttribute('aria-pressed', String(botao.dataset.filtro === categoriaAtual)));
    if (vazio) vazio.hidden = visiveis.length > 0;
    const botaoAtivo = filtros.find((botao) => botao.dataset.filtro === categoriaAtual);
    const rotulo = categoriaAtual === 'todos' ? '' : botaoAtivo?.firstChild?.textContent?.trim() ?? '';
    if (status && isAnimado) status.textContent = descreverResultado(visiveis.length, rotulo);
    if (isAnimado && podeAnimar()) animarTroca(visiveis, posicoesAnteriores);
  };

  const registrarNaUrl = () => {
    const url = new URL(window.location.href);
    if (categoriaAtual === 'todos') url.searchParams.delete('categoria');
    else url.searchParams.set('categoria', categoriaAtual);
    history.replaceState(history.state, '', url);
  };

  filtros.forEach((botao) => {
    botao.addEventListener('click', () => {
      const proxima = botao.dataset.filtro ?? 'todos';
      if (proxima === categoriaAtual) return;
      categoriaAtual = proxima;
      registrarNaUrl();
      aplicar(true);
    });
  });

  seletorDeOrdem?.addEventListener('change', () => {
    ordemAtual = seletorDeOrdem.value as Ordem;
    aplicar(true);
  });

  const categoriaDaUrl = new URL(window.location.href).searchParams.get('categoria');
  if (categoriaDaUrl && categoriasValidas.has(categoriaDaUrl)) {
    categoriaAtual = categoriaDaUrl;
    aplicar(false);
  }

  revelarAoEntrar(catalogo, cartoes);
  ativarInclinacao(grade, '[data-inclinavel]');
}
