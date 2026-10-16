import { iniciarLoader } from './loader';
import { aguardarLoaderEOciosidade } from './ocioso';

const prefereMenosMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');
const LIMIAR_DE_TOPO = 80;
const LIMIAR_DE_ROLAGEM = 8;

function controlarCabecalho(): void {
  const cabecalho = document.querySelector<HTMLElement>('[data-cabecalho]');
  if (!cabecalho) return;
  let ultimaPosicao = window.scrollY;
  let isAgendado = false;

  const atualizar = () => {
    isAgendado = false;
    const posicao = window.scrollY;
    cabecalho.dataset.topo = String(posicao <= LIMIAR_DE_TOPO);
    const delta = posicao - ultimaPosicao;
    if (Math.abs(delta) < LIMIAR_DE_ROLAGEM) return;
    const isFocoDentro = cabecalho.contains(document.activeElement);
    const isMenuAberto = document.documentElement.dataset.menuAberto === 'true';
    const isFixo = document.documentElement.dataset.cabecalhoFixo === 'true';
    cabecalho.dataset.escondido = String(delta > 0 && posicao > LIMIAR_DE_TOPO && !isFocoDentro && !isMenuAberto && !isFixo);
    ultimaPosicao = posicao;
  };

  window.addEventListener('scroll', () => {
    if (isAgendado) return;
    isAgendado = true;
    requestAnimationFrame(atualizar);
  }, { passive: true });
  cabecalho.addEventListener('focusin', () => { cabecalho.dataset.escondido = 'false'; });
  atualizar();
}

function listarFocaveis(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')];
}

function controlarMenu(): void {
  const menu = document.querySelector<HTMLElement>('[data-menu]');
  const botaoAbrir = document.querySelector<HTMLButtonElement>('[data-menu-abrir]');
  const botaoFechar = menu?.querySelector<HTMLButtonElement>('[data-menu-fechar]');
  if (!menu || !botaoAbrir || !botaoFechar) return;

  const fechar = (isDevolverFoco = true) => {
    menu.dataset.aberto = 'false';
    botaoAbrir.setAttribute('aria-expanded', 'false');
    document.documentElement.dataset.menuAberto = 'false';
    document.documentElement.style.overflow = '';
    const esconder = () => { menu.hidden = true; };
    if (prefereMenosMovimento.matches) esconder();
    else menu.addEventListener('transitionend', esconder, { once: true });
    if (isDevolverFoco) botaoAbrir.focus();
  };

  const abrir = () => {
    menu.hidden = false;
    botaoAbrir.setAttribute('aria-expanded', 'true');
    document.documentElement.dataset.menuAberto = 'true';
    document.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      menu.dataset.aberto = 'true';
      botaoFechar.focus();
    });
  };

  botaoAbrir.addEventListener('click', abrir);
  botaoFechar.addEventListener('click', () => fechar());
  menu.addEventListener('click', (evento) => {
    if ((evento.target as HTMLElement).closest('a')) fechar(false);
  });
  menu.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') {
      fechar();
      return;
    }
    if (evento.key !== 'Tab') return;
    const focaveis = listarFocaveis(menu);
    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];
    if (!primeiro || !ultimo) return;
    if (evento.shiftKey && document.activeElement === primeiro) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault();
      primeiro.focus();
    }
  });
  window.matchMedia('(min-width: 1024px)').addEventListener('change', (consulta) => {
    if (consulta.matches && menu.dataset.aberto === 'true') fechar(false);
  });
}

function controlarBarraMobile(): void {
  const barra = document.querySelector<HTMLElement>('[data-barra-mobile]');
  const rodape = document.querySelector<HTMLElement>('[data-rodape]');
  if (!barra || !rodape) return;
  new IntersectionObserver(([entrada]) => {
    barra.dataset.oculta = String(Boolean(entrada?.isIntersecting));
  }).observe(rodape);
}

const AMENDOA = 'M0 50C22 6.7 78 6.7 100 50 78 93.3 22 93.3 0 50Z';

function emitirPulso(botao: HTMLElement): void {
  if (prefereMenosMovimento.matches) return;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'pulso');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');
  const duracaoDoBeat = 484;
  const animacoes = [0, 1, 2].map((indice) => {
    const caminho = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    caminho.setAttribute('d', AMENDOA);
    caminho.setAttribute('fill', 'none');
    caminho.setAttribute('stroke', 'currentColor');
    caminho.setAttribute('vector-effect', 'non-scaling-stroke');
    svg.append(caminho);
    return caminho.animate(
      [{ transform: 'scale(1)', opacity: 0.6 }, { transform: 'scale(2.4)', opacity: 0 }],
      { duration: duracaoDoBeat, delay: indice * (duracaoDoBeat / 8), easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'both' },
    );
  });
  botao.append(svg);
  Promise.all(animacoes.map((animacao) => animacao.finished)).then(() => svg.remove(), () => svg.remove());
}

function ativarPulsos(): void {
  document.addEventListener('pointerdown', (evento) => {
    const botao = (evento.target as HTMLElement).closest<HTMLElement>('[data-pulso]');
    if (botao) emitirPulso(botao);
  });
}

async function ativarRolagemSuave(): Promise<void> {
  const consulta = window.matchMedia('(pointer: fine) and (min-width: 1024px)');
  if (!consulta.matches || prefereMenosMovimento.matches) return;
  const [{ default: Lenis }, { gsap }, { ScrollTrigger }] = await Promise.all([import('lenis'), import('gsap'), import('gsap/ScrollTrigger')]);
  gsap.registerPlugin(ScrollTrigger);
  const lenis = new Lenis({ lerp: 0.1, anchors: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((tempo) => lenis.raf(tempo * 1000));
  gsap.ticker.lagSmoothing(0);
  new MutationObserver(() => {
    if (document.documentElement.dataset.menuAberto === 'true') lenis.stop();
    else lenis.start();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-menu-aberto'] });
  prefereMenosMovimento.addEventListener('change', () => lenis.destroy(), { once: true });
}

async function iniciarFundoQuandoOcioso(): Promise<void> {
  await aguardarLoaderEOciosidade();
  const { iniciarFundoVivo } = await import('./gl/fundo');
  iniciarFundoVivo();
}

iniciarLoader();
void iniciarFundoQuandoOcioso();
controlarCabecalho();
controlarMenu();
controlarBarraMobile();
ativarPulsos();
void ativarRolagemSuave();
