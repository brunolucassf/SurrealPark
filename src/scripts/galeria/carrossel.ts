const LIMITE_VISIVEL_MAXIMO = 2.6;
const SUAVIZACAO = 0.14;
const TOLERANCIA_DE_REPOUSO = 0.0005;
const LIMIAR_DE_ARRASTO_EM_PX = 6;
const JANELA_DE_VELOCIDADE_EM_MS = 100;
const INERCIA_EM_MS = 160;
const PAUSA_DA_RODA_EM_MS = 140;
const FATOR_DE_PIXELS_POR_PASSO = 1.15;
const ATRASO_DO_ANUNCIO_EM_MS = 450;
const JANELA_DO_CLIQUE_FANTASMA_EM_MS = 80;
const PIXELS_POR_LINHA_DA_RODA = 16;
const PARAMETROS_DE_AMBIENTE = ['amb', 'ambiente'];

interface AmostraDeArrasto {
  x: number;
  tempo: number;
}

interface InicioDoArrasto {
  x: number;
  y: number;
  alvo: number;
}

type EventoDeRodaDoLenis = WheelEvent & { lenisStopPropagation?: boolean };

const prefereMenosMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');

function consultar<T extends HTMLElement>(raiz: ParentNode, seletor: string): T {
  const elemento = raiz.querySelector<T>(seletor);
  if (!elemento) throw new Error(`Elemento ausente no carrossel: ${seletor}`);
  return elemento;
}

function iniciarCarrossel(raiz: HTMLElement): void {
  const palco = raiz.querySelector<HTMLElement>('[data-palco]');
  if (!palco) return;
  const paineis = [...palco.querySelectorAll<HTMLElement>('[data-painel]')];
  const links = paineis.map((painel) => consultar<HTMLAnchorElement>(painel, '[data-link]'));
  const total = paineis.length;
  if (total === 0) return;

  const textoDoDestaque = consultar<HTMLElement>(raiz, '[data-destaque-texto]');
  const posicaoDoDestaque = consultar<HTMLElement>(raiz, '[data-destaque-posicao]');
  const tituloDoDestaque = consultar<HTMLElement>(raiz, '[data-destaque-titulo]');
  const metaDoDestaque = consultar<HTMLElement>(raiz, '[data-destaque-meta]');
  const linkDoDestaque = consultar<HTMLAnchorElement>(raiz, '[data-destaque-link]');
  const nomeNoLink = consultar<HTMLElement>(raiz, '[data-destaque-nome]');
  const anuncio = consultar<HTMLElement>(raiz, '[data-anuncio]');
  const limiteVisivel = Math.min(LIMITE_VISIVEL_MAXIMO, total / 2 - 0.4);

  let posicao = 0;
  let alvo = 0;
  let indiceExibido = -1;
  let quadroPendente = 0;
  let temporizadorDaRoda = 0;
  let temporizadorDoAnuncio = 0;
  let inicioDoArrasto: InicioDoArrasto | null = null;
  let amostras: AmostraDeArrasto[] = [];
  let isArrastando = false;
  let deveIgnorarClique = false;

  const modulo = (valor: number): number => ((valor % total) + total) % total;
  const calcularDistancia = (indice: number, referencia: number): number => modulo(indice - referencia + total / 2) - total / 2;
  const lerIndiceAtual = (): number => modulo(Math.round(alvo));
  const medirPixelsPorPasso = (): number => (paineis[0]?.offsetWidth ?? 240) * FATOR_DE_PIXELS_POR_PASSO;

  const aplicarPosicao = (): void => {
    const indiceAtual = lerIndiceAtual();
    paineis.forEach((painel, indice) => {
      const distancia = calcularDistancia(indice, posicao);
      painel.style.setProperty('--d', distancia.toFixed(4));
      painel.style.setProperty('--dist', Math.abs(distancia).toFixed(4));
      painel.toggleAttribute('data-oculto', Math.abs(distancia) > limiteVisivel && indice !== indiceAtual);
    });
  };

  const animarTrocaDoDestaque = (): void => {
    if (prefereMenosMovimento.matches) return;
    textoDoDestaque.animate(
      [{ opacity: 0, transform: 'translateY(0.4em)' }, { opacity: 1, transform: 'none' }],
      { duration: 360, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    );
  };

  const anunciar = (texto: string): void => {
    window.clearTimeout(temporizadorDoAnuncio);
    temporizadorDoAnuncio = window.setTimeout(() => {
      anuncio.textContent = texto;
    }, ATRASO_DO_ANUNCIO_EM_MS);
  };

  const atualizarCentro = (): void => {
    const indice = lerIndiceAtual();
    if (indice === indiceExibido) return;
    const isPrimeiraVez = indiceExibido === -1;
    indiceExibido = indice;
    paineis.forEach((painel, posicaoDoPainel) => painel.toggleAttribute('data-centro', posicaoDoPainel === indice));
    links.forEach((link, posicaoDoLink) => {
      link.tabIndex = posicaoDoLink === indice ? 0 : -1;
    });
    const painel = paineis[indice];
    const link = links[indice];
    if (!painel || !link) return;
    const { titulo = '', meta = '', posicao: rotuloDaPosicao = '' } = painel.dataset;
    posicaoDoDestaque.textContent = rotuloDaPosicao;
    tituloDoDestaque.textContent = titulo;
    metaDoDestaque.textContent = meta;
    linkDoDestaque.href = link.href;
    nomeNoLink.textContent = ` de ${titulo}`;
    if (isPrimeiraVez) return;
    animarTrocaDoDestaque();
    anunciar(`Evento ${indice + 1} de ${total}: ${titulo}. ${meta}`);
  };

  const avancarQuadro = (): void => {
    const diferenca = alvo - posicao;
    posicao = prefereMenosMovimento.matches || Math.abs(diferenca) < TOLERANCIA_DE_REPOUSO ? alvo : posicao + diferenca * SUAVIZACAO;
    aplicarPosicao();
    quadroPendente = posicao === alvo && !isArrastando ? 0 : requestAnimationFrame(avancarQuadro);
  };

  const animar = (): void => {
    if (!quadroPendente) quadroPendente = requestAnimationFrame(avancarQuadro);
  };

  const definirAlvo = (novoAlvo: number): void => {
    alvo = novoAlvo;
    atualizarCentro();
    aplicarPosicao();
    animar();
  };

  const irParaIndice = (indice: number): void => {
    const base = Math.round(alvo);
    definirAlvo(base + calcularDistancia(modulo(indice), base));
  };

  const focarCentro = (): void => links[lerIndiceAtual()]?.focus({ preventScroll: true });

  const lerIndicePelaUrl = (): number => {
    const parametros = new URLSearchParams(location.search);
    const ambiente = PARAMETROS_DE_AMBIENTE.map((nome) => parametros.get(nome)).find(Boolean);
    if (!ambiente) return 0;
    const indice = paineis.findIndex((painel) => (painel.dataset.ambientes ?? '').split(' ').includes(ambiente));
    return Math.max(indice, 0);
  };

  palco.addEventListener('keydown', (evento) => {
    const passos: Record<string, () => void> = {
      ArrowRight: () => irParaIndice(lerIndiceAtual() + 1),
      ArrowLeft: () => irParaIndice(lerIndiceAtual() - 1),
      Home: () => irParaIndice(0),
      End: () => irParaIndice(total - 1),
    };
    const acao = passos[evento.key];
    if (!acao) return;
    evento.preventDefault();
    acao();
    focarCentro();
  });

  palco.addEventListener('click', (evento) => {
    if (deveIgnorarClique) {
      evento.preventDefault();
      evento.stopPropagation();
      deveIgnorarClique = false;
      return;
    }
    const link = (evento.target as HTMLElement).closest<HTMLAnchorElement>('[data-link]');
    if (!link || evento.metaKey || evento.ctrlKey || evento.shiftKey) return;
    const indice = links.indexOf(link);
    if (indice === lerIndiceAtual()) return;
    evento.preventDefault();
    irParaIndice(indice);
  }, true);

  palco.addEventListener('dragstart', (evento) => evento.preventDefault());

  palco.addEventListener('pointerdown', (evento) => {
    if (evento.button !== 0) return;
    deveIgnorarClique = false;
    inicioDoArrasto = { x: evento.clientX, y: evento.clientY, alvo };
    amostras = [{ x: evento.clientX, tempo: evento.timeStamp }];
  });

  palco.addEventListener('pointermove', (evento) => {
    if (!inicioDoArrasto) return;
    const deslocamentoX = evento.clientX - inicioDoArrasto.x;
    const deslocamentoY = evento.clientY - inicioDoArrasto.y;
    if (!isArrastando) {
      if (Math.abs(deslocamentoY) > LIMIAR_DE_ARRASTO_EM_PX && Math.abs(deslocamentoY) > Math.abs(deslocamentoX)) {
        inicioDoArrasto = null;
        return;
      }
      if (Math.abs(deslocamentoX) <= LIMIAR_DE_ARRASTO_EM_PX) return;
      isArrastando = true;
      palco.setPointerCapture(evento.pointerId);
      palco.dataset.arrastando = 'true';
    }
    amostras.push({ x: evento.clientX, tempo: evento.timeStamp });
    amostras = amostras.filter((amostra) => evento.timeStamp - amostra.tempo <= JANELA_DE_VELOCIDADE_EM_MS);
    definirAlvo(inicioDoArrasto.alvo - deslocamentoX / medirPixelsPorPasso());
  });

  const encerrarArrasto = (evento: PointerEvent): void => {
    const wasArrastando = isArrastando;
    inicioDoArrasto = null;
    isArrastando = false;
    delete palco.dataset.arrastando;
    if (!wasArrastando) return;
    deveIgnorarClique = evento.type === 'pointerup';
    window.setTimeout(() => {
      deveIgnorarClique = false;
    }, JANELA_DO_CLIQUE_FANTASMA_EM_MS);
    const primeira = amostras[0];
    const velocidade = primeira && evento.timeStamp > primeira.tempo ? (evento.clientX - primeira.x) / (evento.timeStamp - primeira.tempo) : 0;
    definirAlvo(Math.round(alvo - (velocidade * INERCIA_EM_MS) / medirPixelsPorPasso()));
  };

  palco.addEventListener('pointerup', encerrarArrasto);
  palco.addEventListener('pointercancel', encerrarArrasto);

  palco.addEventListener('wheel', (evento: EventoDeRodaDoLenis) => {
    const escala = evento.deltaMode === WheelEvent.DOM_DELTA_LINE ? PIXELS_POR_LINHA_DA_RODA : 1;
    const isHorizontal = Math.abs(evento.deltaX) > Math.abs(evento.deltaY);
    const delta = (isHorizontal ? evento.deltaX : evento.shiftKey ? evento.deltaY : 0) * escala;
    if (!delta) return;
    evento.preventDefault();
    evento.lenisStopPropagation = true;
    definirAlvo(alvo + delta / medirPixelsPorPasso());
    window.clearTimeout(temporizadorDaRoda);
    temporizadorDaRoda = window.setTimeout(() => definirAlvo(Math.round(alvo)), PAUSA_DA_RODA_EM_MS);
  }, { passive: false });

  raiz.querySelector('[data-anterior]')?.addEventListener('click', () => irParaIndice(lerIndiceAtual() - 1));
  raiz.querySelector('[data-proximo]')?.addEventListener('click', () => irParaIndice(lerIndiceAtual() + 1));

  const indiceInicial = lerIndicePelaUrl();
  alvo = indiceInicial;
  posicao = indiceInicial;
  atualizarCentro();
  aplicarPosicao();
  raiz.dataset.interativo = 'true';
}

const raizDoCarrossel = document.querySelector<HTMLElement>('[data-carrossel]');
if (raizDoCarrossel) iniciarCarrossel(raizDoCarrossel);
