import { HUMORES, type Humor } from '../gl/constantes';
import { isAparelhoLimitado, prefereMenosMovimento, suportaWebGL2 } from '../gl/motor';
import { criarMotorDoParque, type EstadoDaCena, type EstadoDoQuadro, type MotorDoParque } from '../gl/parque-motor';
import { TOUR } from './constantes';
import type { CenaParaOMotor } from '@/data/tour';
import type { IdDaForma } from '@/data/formas';

const CLASSE_GL = 'tour-gl';
const CLASSE_PRONTO = 'tour-gl-pronto';
const CONSULTA_DESKTOP = '(min-width: 1024px) and (pointer: fine)';

interface Medida {
  topo: number;
  altura: number;
}

const limitar = (valor: number, minimo = 0, maximo = 1) => Math.min(maximo, Math.max(minimo, valor));
const suavizar = (borda0: number, borda1: number, valor: number) => {
  const t = limitar((valor - borda0) / (borda1 - borda0));
  return t * t * (3 - 2 * t);
};
const easeOlho = (t: number) => (t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2);
const easeSaida = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));

function criarHumorDePalco(cor: string): Humor {
  return {
    base: '#131215',
    luz1: { cor, posicao: [0.8, 0.2], raio: 0.8, intensidade: 0.6 },
    luz2: { cor: '#B8862F', posicao: [0.1, 0.9], raio: 0.6, intensidade: 0.3 },
    nevoa: 0.5,
  };
}

function registrarHumoresDoTour(cenas: CenaParaOMotor[], humores: string[]): void {
  humores.forEach((humor, indice) => {
    if (HUMORES[humor]) return;
    HUMORES[humor] = criarHumorDePalco(cenas[indice]?.cor ?? '#D6A24A');
  });
}

function lerConfiguracao(): CenaParaOMotor[] {
  try {
    return JSON.parse(document.querySelector('[data-tour-config]')?.textContent ?? '[]') as CenaParaOMotor[];
  } catch {
    return [];
  }
}

function iniciarMapa(): void {
  const mapa = document.querySelector<HTMLElement>('[data-tour-mapa]');
  const trilho = mapa?.querySelector<HTMLElement>('[data-tour-mapa-trilho]');
  if (!mapa || !trilho) return;
  const itens = [...mapa.querySelectorAll<HTMLAnchorElement>('a[data-alvo]')]
    .map((link) => ({ link, alvo: document.getElementById(link.dataset.alvo ?? '') }))
    .filter((item): item is { link: HTMLAnchorElement; alvo: HTMLElement } => Boolean(item.alvo));
  let ativo: HTMLAnchorElement | null = null;
  let isAgendado = false;

  const atualizar = () => {
    isAgendado = false;
    const limite = window.innerHeight * 0.5;
    let atual: HTMLAnchorElement | null = null;
    itens.forEach(({ link, alvo }) => { if (alvo.getBoundingClientRect().top <= limite) atual = link; });
    if (atual === ativo) return;
    ativo?.removeAttribute('aria-current');
    ativo = atual;
    if (!ativo) return;
    const link: HTMLAnchorElement = ativo;
    link.setAttribute('aria-current', 'true');
    const centro = link.offsetLeft + link.offsetWidth / 2 - trilho.clientWidth / 2;
    if (trilho.scrollWidth > trilho.clientWidth) trilho.scrollTo({ left: centro, behavior: prefereMenosMovimento() ? 'auto' : 'smooth' });
  };

  window.addEventListener('scroll', () => {
    if (isAgendado) return;
    isAgendado = true;
    requestAnimationFrame(atualizar);
  }, { passive: true });
  atualizar();
}

function iniciarMascaraSemTimeline(secoes: HTMLElement[]): void {
  if (CSS.supports('animation-timeline: view()')) return;
  const raiz = document.documentElement;
  const visiveis = new Set<HTMLElement>();
  let isAgendado = false;

  const atualizar = () => {
    isAgendado = false;
    if (raiz.classList.contains(CLASSE_GL) || prefereMenosMovimento()) return;
    const altura = window.innerHeight;
    visiveis.forEach((secao) => {
      const topo = secao.getBoundingClientRect().top;
      const linear = limitar((altura * 0.5 - topo) / (altura * 0.78));
      const progresso = linear < 0.55 ? (linear / 0.55) * 0.11 : 0.11 + ((linear - 0.55) / 0.45) * 0.89;
      secao.style.setProperty('--p', progresso.toFixed(3));
    });
  };
  const agendar = () => {
    if (isAgendado) return;
    isAgendado = true;
    requestAnimationFrame(atualizar);
  };
  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      const secao = entrada.target as HTMLElement;
      if (entrada.isIntersecting) visiveis.add(secao);
      else visiveis.delete(secao);
    });
    agendar();
  });
  secoes.forEach((secao) => observador.observe(secao));
  window.addEventListener('scroll', agendar, { passive: true });
}

function isElegivelParaGl(): boolean {
  return window.matchMedia(CONSULTA_DESKTOP).matches && !prefereMenosMovimento() && suportaWebGL2() && !isAparelhoLimitado();
}

function criarTourGl(tour: HTMLElement, canvas: HTMLCanvasElement, secoes: HTMLElement[], cenas: CenaParaOMotor[], aoFalhar: () => void): (() => void) | null {
  const raiz = document.documentElement;
  let dpr = Math.min(window.devicePixelRatio || 1, TOUR.dprMaximo);
  const motor: MotorDoParque | null = criarMotorDoParque(canvas, cenas, dpr);
  if (!motor) return null;

  const linhasDoManifesto = secoes.map((secao) => [...secao.querySelectorAll<HTMLElement>('[data-linha]')]);
  const progressoDoPainel = secoes.map(() => -1);
  const passoDoManifesto = secoes.map(() => -1);
  let medidas: Medida[] = [];
  let alturaDaJanela = window.innerHeight;
  let quadro = 0;
  let isVisivel = true;
  let anterior = 0;
  const intervalos: number[] = [];
  const ponteiro: [number, number] = [0.5, 0.5];
  const alvoDoPonteiro: [number, number] = [0.5, 0.5];
  const inicio = performance.now();

  const medir = () => {
    const base = window.scrollY;
    alturaDaJanela = window.innerHeight;
    medidas = secoes.map((secao) => {
      const retangulo = secao.getBoundingClientRect();
      return { topo: retangulo.top + base, altura: retangulo.height };
    });
  };

  const tipoDoPortal = (cena: CenaParaOMotor | undefined): 0 | 1 | 2 => {
    if (!cena?.portal) return 0;
    return cena.portal === 'nuvem' ? 2 : 1;
  };

  const deslocamento = (de: number, para: number, t: number): [number, number] => {
    const [ax, ay] = motor.focoNaTela(de);
    const [bx, by] = motor.focoNaTela(para);
    return [(ax - bx) * (1 - t), (ay - by) * (1 - t)];
  };

  const holdDe = (indice: number, rolagem: number) => {
    const medida = medidas[indice];
    if (!medida) return 0;
    const local = rolagem - medida.topo;
    const inicioDoHold = indice > 0 ? (TOUR.entradaVh / 100) * alturaDaJanela : 0;
    const fimDoHold = indice === medidas.length - 1 ? medida.altura - alturaDaJanela : medida.altura;
    return limitar((local - inicioDoHold) / Math.max(1, fimDoHold - inicioDoHold));
  };

  const calcularEstado = (rolagem: number): EstadoDoQuadro => {
    const entrada = (TOUR.entradaVh / 100) * alturaDaJanela;
    const surgimento = (TOUR.surgimentoDoPortalVh / 100) * alturaDaJanela;
    let indice = 0;
    medidas.forEach((medida, posicao) => { if (rolagem >= medida.topo) indice = posicao; });
    const medida = medidas[indice] ?? { topo: 0, altura: alturaDaJanela };
    const local = rolagem - medida.topo;
    const isUltima = indice === medidas.length - 1;
    const voo = rolagem / alturaDaJanela;

    if (indice > 0 && local < entrada) {
      const t = limitar(local / entrada);
      const te = easeOlho(t);
      const origem = indice - 1;
      const cenaDestino = cenas[indice];
      const tipo = tipoDoPortal(cenaDestino);
      const a: EstadoDaCena = { indice: origem, z: TOUR.zMaximo, escala: 1 + (TOUR.contraZoom - 1) * te, luz: 1 - TOUR.escurecimentoDaSaida * te, vies: TOUR.viesDaSaida * te, desloc: [0, 0] };
      const b: EstadoDaCena = { indice, z: 0, escala: TOUR.contraZoom - (TOUR.contraZoom - 1) * te, luz: 1, vies: 0, desloc: deslocamento(origem, indice, te) };
      return {
        a,
        b,
        portal: {
          escala: TOUR.escalaDoPortal * TOUR.crescimentoDoPortal ** te,
          aro: tipo === 2 ? 0.85 * (1 - suavizar(0.35, 1, t)) : 1 - suavizar(0.6, 1, t),
          tipo,
          progresso: t,
          cobertura: suavizar(0.82, 1, t),
          forma: cenaDestino?.portal && cenaDestino.portal !== 'nuvem' ? (cenaDestino.portal as IdDaForma) : null,
        },
        nuvem: origem === 0 ? 0.12 * (1 - t) : 0,
        saida: 0,
        voo,
        particulas: t < 0.5 ? { indice: origem, alfa: 1 - t * 2 } : { indice, alfa: t * 2 - 1 },
      };
    }

    const h = holdDe(indice, rolagem);
    const a: EstadoDaCena = { indice, z: TOUR.zMaximo * h, escala: 1, luz: 1, vies: 0, desloc: [0, 0] };
    const nuvem = indice === 0 ? 0.15 + 0.7 * (1 - suavizar(0, 0.6, h)) : 0;
    const proxima = cenas[indice + 1];
    const inicioDoSurgimento = medida.altura - surgimento;
    if (!isUltima && proxima && local > inicioDoSurgimento) {
      const t = limitar((local - inicioDoSurgimento) / surgimento);
      const tipo = tipoDoPortal(proxima);
      return {
        a,
        b: { indice: indice + 1, z: 0, escala: TOUR.contraZoom, luz: 1, vies: 0, desloc: deslocamento(indice, indice + 1, 0) },
        portal: {
          escala: TOUR.escalaDoPortal * easeSaida(t),
          aro: tipo === 2 ? 0.85 * suavizar(0, 1, t) : 1,
          tipo,
          progresso: 0,
          cobertura: 0,
          forma: proxima.portal && proxima.portal !== 'nuvem' ? (proxima.portal as IdDaForma) : null,
        },
        nuvem,
        saida: 0,
        voo,
        particulas: { indice, alfa: 1 },
      };
    }
    const fimDoHold = isUltima ? medida.altura - alturaDaJanela : medida.altura;
    return {
      a,
      b: null,
      portal: { escala: 0, aro: 0, tipo: 0, progresso: 0, cobertura: 0, forma: null },
      nuvem,
      saida: isUltima ? suavizar(0, TOUR.saidaFinal, (local - fimDoHold) / alturaDaJanela) : 0,
      voo,
      particulas: { indice, alfa: 1 },
    };
  };

  const atualizarPaineis = (rolagem: number, indiceAtual: number) => {
    secoes.forEach((secao, indice) => {
      const isPerto = Math.abs(indice - indiceAtual) <= 1;
      const h = isPerto ? holdDe(indice, rolagem) : 0;
      const entradaDoPainel = indice === 0 ? 1 : suavizar(0, TOUR.painelEntra, h);
      const saidaDoPainel = 1 - suavizar(TOUR.painelSai, 1, h);
      const local = rolagem - (medidas[indice]?.topo ?? 0);
      const isAntesDaEntrada = indice > 0 && local < (TOUR.entradaVh / 100) * alturaDaJanela;
      const progresso = isPerto && !isAntesDaEntrada ? Math.round(Math.min(entradaDoPainel, saidaDoPainel) * 1000) / 1000 : 0;
      if (progresso !== progressoDoPainel[indice]) {
        progressoDoPainel[indice] = progresso;
        secao.style.setProperty('--p', String(progresso));
        secao.dataset.ativa = String(progresso > 0);
      }
      const linhas = linhasDoManifesto[indice];
      if (!linhas?.length) return;
      const passo = Math.min(linhas.length - 1, Math.floor(limitar((h - TOUR.manifestoInicio) / (TOUR.manifestoFim - TOUR.manifestoInicio)) * linhas.length));
      if (passo === passoDoManifesto[indice]) return;
      passoDoManifesto[indice] = passo;
      linhas.forEach((linha, posicao) => { linha.dataset.estado = posicao < passo ? 'anterior' : posicao === passo ? 'atual' : 'futura'; });
    });
  };

  let quadrosIgnorados = TOUR.aquecimentoDoGovernador;
  let janelasRuins = 0;
  const governar = (delta: number) => {
    if (quadrosIgnorados > 0) {
      quadrosIgnorados -= 1;
      return;
    }
    if (delta > 100) return;
    intervalos.push(delta);
    if (intervalos.length < TOUR.janelaDoGovernador) return;
    const media = intervalos.reduce((soma, valor) => soma + valor, 0) / intervalos.length;
    intervalos.length = 0;
    janelasRuins = media > TOUR.limiteDoQuadroMs ? janelasRuins + 1 : 0;
    if (janelasRuins < TOUR.janelasRuinsParaDescer) return;
    janelasRuins = 0;
    if (dpr > 1) {
      dpr = 1;
      motor.definirDpr(dpr);
      return;
    }
    aoFalhar();
  };

  let indiceDaUltimaCarga = -1;
  let isProntoAgendado = false;
  const laco = (agora: number) => {
    quadro = 0;
    const delta = anterior ? agora - anterior : 16;
    anterior = agora;
    governar(delta);
    if (!raiz.classList.contains(CLASSE_GL)) return;
    const rolagem = window.scrollY;
    ponteiro[0] += (alvoDoPonteiro[0] - ponteiro[0]) * TOUR.lerpDoPonteiro;
    ponteiro[1] += (alvoDoPonteiro[1] - ponteiro[1]) * TOUR.lerpDoPonteiro;
    const estado = calcularEstado(rolagem);
    const indiceAtual = estado.b && estado.portal.progresso > 0 ? estado.b.indice : estado.a.indice;
    if (indiceAtual !== indiceDaUltimaCarga) {
      indiceDaUltimaCarga = indiceAtual;
      const manter = [indiceAtual - 1, indiceAtual, indiceAtual + 1].filter((indice) => indice >= 0 && indice < cenas.length);
      motor.manterApenas(manter);
      motor.carregar(indiceAtual);
      quadrosIgnorados = Math.max(quadrosIgnorados, TOUR.janelaDoGovernador);
      intervalos.length = 0;
      const agendarVizinhas = () => { if (indiceDaUltimaCarga === indiceAtual) manter.forEach(motor.carregar); };
      if ('requestIdleCallback' in window) window.requestIdleCallback(agendarVizinhas, { timeout: 600 });
      else setTimeout(agendarVizinhas, 120);
    }
    motor.desenhar(estado, (agora - inicio) / 1000, ponteiro);
    atualizarPaineis(rolagem, indiceAtual);
    if (!isProntoAgendado && motor.isPronta(estado.a.indice)) {
      isProntoAgendado = true;
      window.setTimeout(() => { if (raiz.classList.contains(CLASSE_GL)) raiz.classList.add(CLASSE_PRONTO); }, 650);
    }
    if (isVisivel && !document.hidden) quadro = requestAnimationFrame(laco);
    else anterior = 0;
  };

  const retomar = () => {
    if (!quadro && isVisivel && !document.hidden) quadro = requestAnimationFrame(laco);
  };

  const aoMoverPonteiro = (evento: PointerEvent) => {
    alvoDoPonteiro[0] = evento.clientX / window.innerWidth;
    alvoDoPonteiro[1] = 1 - evento.clientY / window.innerHeight;
  };

  const observadorDeTamanho = new ResizeObserver(() => { medir(); retomar(); });
  observadorDeTamanho.observe(tour);
  const observadorDeVisibilidade = new IntersectionObserver(([registro]) => {
    isVisivel = Boolean(registro?.isIntersecting);
    if (isVisivel) {
      indiceDaUltimaCarga = -1;
      retomar();
    } else {
      motor.liberarTexturas();
    }
  });
  observadorDeVisibilidade.observe(tour);
  document.addEventListener('visibilitychange', retomar);
  window.addEventListener('pointermove', aoMoverPonteiro, { passive: true });
  medir();
  retomar();

  return () => {
    cancelAnimationFrame(quadro);
    quadro = 0;
    observadorDeTamanho.disconnect();
    observadorDeVisibilidade.disconnect();
    document.removeEventListener('visibilitychange', retomar);
    window.removeEventListener('pointermove', aoMoverPonteiro);
    motor.destruir();
    secoes.forEach((secao) => {
      secao.style.removeProperty('--p');
      delete secao.dataset.ativa;
    });
    linhasDoManifesto.flat().forEach((linha) => { delete linha.dataset.estado; });
  };
}

export function iniciarTourDoParque(): void {
  const tour = document.querySelector<HTMLElement>('[data-tour]');
  const canvas = tour?.querySelector<HTMLCanvasElement>('[data-tour-canvas]');
  if (!tour || !canvas) return;
  const raiz = document.documentElement;
  const secoes = [...tour.querySelectorAll<HTMLElement>('[data-cena]')];
  const cenas = lerConfiguracao();
  registrarHumoresDoTour(cenas, secoes.map((secao) => secao.dataset.humorDaCena ?? ''));
  iniciarMapa();
  iniciarMascaraSemTimeline(secoes);

  let encerrar: (() => void) | null = null;
  let isFalhou = false;

  const desligarGl = () => {
    encerrar?.();
    encerrar = null;
    raiz.classList.remove(CLASSE_GL, CLASSE_PRONTO);
  };

  const falhar = () => {
    isFalhou = true;
    desligarGl();
  };

  const avaliarModo = () => {
    const isElegivel = !isFalhou && cenas.length > 0 && isElegivelParaGl();
    if (!isElegivel) {
      desligarGl();
      return;
    }
    if (encerrar) return;
    raiz.classList.add(CLASSE_GL);
    encerrar = criarTourGl(tour, canvas, secoes, cenas, falhar);
    if (!encerrar) falhar();
  };

  canvas.addEventListener('webglcontextlost', (evento) => {
    evento.preventDefault();
    falhar();
  });
  window.matchMedia(CONSULTA_DESKTOP).addEventListener('change', avaliarModo);
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', avaliarModo);
  avaliarModo();
}
