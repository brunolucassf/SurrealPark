import { iniciarLightbox, type FotoDoLightbox } from './lightbox';
import { iniciarEfeitosDaGrade } from './efeitos';

const PARAMETRO_AMBIENTE = 'ambiente';
const FILTRO_TODOS = 'todos';

const raiz = document.querySelector<HTMLElement>('[data-galeria]');

function consultar<T extends HTMLElement>(seletor: string): T {
  const elemento = raiz?.querySelector<T>(seletor);
  if (!elemento) throw new Error(`Elemento ausente na galeria: ${seletor}`);
  return elemento;
}

function lerFotoDoQuadro(quadro: HTMLElement): FotoDoLightbox {
  const { grande = '', largura = '1', altura = '1', alt = '', legenda = '', fotografo } = quadro.dataset;
  return { src: grande, largura: Number(largura), altura: Number(altura), alt, legenda, fotografo: fotografo ?? null, miniatura: quadro.querySelector('img') };
}

function iniciarGaleria(): void {
  if (!raiz) return;
  const lote = Number(raiz.dataset.lote);
  const grade = consultar<HTMLOListElement>('[data-grade]');
  const status = consultar<HTMLElement>('[data-status]');
  const blocoMais = consultar<HTMLElement>('[data-mais]');
  const botaoMais = consultar<HTMLButtonElement>('[data-ver-mais]');
  const apoioMais = consultar<HTMLElement>('[data-apoio-mais]');
  const vazio = consultar<HTMLElement>('[data-vazio]');
  const botoesDeFiltro = [...raiz.querySelectorAll<HTMLButtonElement>('[data-filtro]')];
  const quadros = [...grade.querySelectorAll<HTMLElement>('[data-quadro]')];
  const efeitos = iniciarEfeitosDaGrade(grade);

  let filtroAtual = FILTRO_TODOS;
  let quantidadeVisivel = lote;

  const quadrosDoFiltro = (): HTMLElement[] => quadros.filter((quadro) => filtroAtual === FILTRO_TODOS || quadro.dataset.ambiente === filtroAtual);

  const lerFiltroDaUrl = (): string => {
    const valor = new URLSearchParams(location.search).get(PARAMETRO_AMBIENTE) ?? FILTRO_TODOS;
    return botoesDeFiltro.some((botao) => botao.dataset.filtro === valor) ? valor : FILTRO_TODOS;
  };

  const gravarFiltroNaUrl = (): void => {
    const url = new URL(location.href);
    if (filtroAtual === FILTRO_TODOS) url.searchParams.delete(PARAMETRO_AMBIENTE);
    else url.searchParams.set(PARAMETRO_AMBIENTE, filtroAtual);
    history.pushState(null, '', url);
  };

  const anunciar = (total: number): void => {
    const botao = botoesDeFiltro.find((item) => item.dataset.filtro === filtroAtual);
    status.textContent = filtroAtual === FILTRO_TODOS ? `Mostrando todas as ${total} fotos` : `${total} fotos em ${botao?.dataset.nome ?? ''}`;
  };

  const renderizar = (): void => {
    const doFiltro = quadrosDoFiltro();
    const visiveis = new Set(doFiltro.slice(0, quantidadeVisivel));
    quadros.forEach((quadro) => {
      quadro.hidden = !visiveis.has(quadro);
    });
    botoesDeFiltro.forEach((botao) => botao.setAttribute('aria-pressed', String(botao.dataset.filtro === filtroAtual)));
    blocoMais.hidden = doFiltro.length - visiveis.size <= 0;
    apoioMais.textContent = `${visiveis.size} de ${doFiltro.length}`;
    vazio.hidden = doFiltro.length > 0;
    anunciar(doFiltro.length);
    efeitos.observar([...visiveis]);
  };

  const selecionarFiltro = (chave: string, deveGravarNaUrl = true): void => {
    filtroAtual = chave;
    quantidadeVisivel = lote;
    efeitos.reiniciar();
    if (deveGravarNaUrl) gravarFiltroNaUrl();
    renderizar();
  };

  const mostrarMais = (): void => {
    const primeiroNovo = quadrosDoFiltro()[quantidadeVisivel];
    quantidadeVisivel += lote;
    renderizar();
    primeiroNovo?.querySelector<HTMLElement>('[data-abrir]')?.focus({ preventScroll: true });
  };

  raiz.querySelector('.filtros')?.addEventListener('click', (evento) => {
    const botao = (evento.target as HTMLElement).closest<HTMLButtonElement>('[data-filtro]');
    if (botao?.dataset.filtro && botao.dataset.filtro !== filtroAtual) selecionarFiltro(botao.dataset.filtro);
  });
  botaoMais.addEventListener('click', mostrarMais);
  consultar('[data-ver-todas]').addEventListener('click', () => selecionarFiltro(FILTRO_TODOS));

  grade.addEventListener('error', (evento) => {
    const quadro = (evento.target as HTMLElement).closest<HTMLElement>('[data-quadro]');
    if (!quadro) return;
    quadro.querySelector<HTMLElement>('[data-falha]')?.removeAttribute('hidden');
    quadro.dataset.falhou = 'true';
  }, true);

  const lightbox = iniciarLightbox(raiz, () => quadrosDoFiltro().map(lerFotoDoQuadro));

  grade.addEventListener('click', (evento) => {
    const alvo = evento.target as HTMLElement;
    const quadro = alvo.closest<HTMLElement>('[data-quadro]');
    if (!quadro) return;
    if (alvo.closest('[data-tentar-de-novo]')) {
      const figura = quadro.querySelector('picture');
      figura?.replaceWith(figura.cloneNode(true));
      quadro.querySelector('[data-falha]')?.setAttribute('hidden', '');
      delete quadro.dataset.falhou;
      return;
    }
    if (alvo.closest('[data-abrir]') && !quadro.dataset.falhou) lightbox.abrir(quadrosDoFiltro().indexOf(quadro));
  });

  window.addEventListener('popstate', () => selecionarFiltro(lerFiltroDaUrl(), false));

  filtroAtual = lerFiltroDaUrl();
  grade.dataset.pronto = 'true';
  renderizar();
}

iniciarGaleria();
