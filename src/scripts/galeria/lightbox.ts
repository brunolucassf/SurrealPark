export interface FotoDoLightbox {
  src: string;
  largura: number;
  altura: number;
  alt: string;
  legenda: string;
  fotografo: string | null;
  miniatura: HTMLImageElement | null;
}

export interface Lightbox {
  abrir: (indice: number) => void;
}

const DURACAO_DA_TROCA_EM_MS = 200;
const DURACAO_DO_FLIP_EM_MS = 520;
const DURACAO_DO_FADE_EM_MS = 220;
const JANELA_DE_INERCIA_EM_MS = 220;
const ARRASTO_MINIMO_EM_PX = 56;
const FRACAO_DE_LARGURA_PARA_TROCAR = 0.22;
const EASE_SAIDA = 'cubic-bezier(0.16, 1, 0.3, 1)';
const EASE_UI = 'cubic-bezier(0.2, 0, 0, 1)';

interface AmostraDeArrasto {
  x: number;
  tempo: number;
}

function consultar<T extends HTMLElement>(raiz: ParentNode, seletor: string): T {
  const elemento = raiz.querySelector<T>(seletor);
  if (!elemento) throw new Error(`Elemento ausente no lightbox: ${seletor}`);
  return elemento;
}

function calcularCaixaAjustada(proporcao: number, area: DOMRect): DOMRect {
  const largura = Math.min(area.width, area.height * proporcao);
  const altura = largura / proporcao;
  return new DOMRect(area.left + (area.width - largura) / 2, area.top + (area.height - altura) / 2, largura, altura);
}

function isVisivelNaTela(elemento: HTMLElement): boolean {
  const caixa = elemento.getBoundingClientRect();
  return caixa.width > 0 && caixa.bottom > 0 && caixa.top < window.innerHeight && caixa.right > 0 && caixa.left < window.innerWidth;
}

export function iniciarLightbox(raiz: HTMLElement, obterFotos: () => FotoDoLightbox[]): Lightbox {
  const dialogo = consultar<HTMLDialogElement>(raiz, '[data-lightbox]');
  const palco = consultar<HTMLElement>(dialogo, '[data-palco]');
  const imagem = consultar<HTMLImageElement>(dialogo, '[data-imagem]');
  const contador = consultar<HTMLElement>(dialogo, '[data-contador]');
  const legenda = consultar<HTMLElement>(dialogo, '[data-legenda]');
  const credito = consultar<HTMLElement>(dialogo, '[data-credito]');
  const prefereMenosMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');

  let fotos: FotoDoLightbox[] = [];
  let indice = 0;
  let elementoDeOrigem: HTMLElement | null = null;
  let isTrocando = false;
  let isFechando = false;

  const animar = (alvo: HTMLElement, quadros: Keyframe[], duracao: number, easing = EASE_SAIDA): Promise<void> => {
    if (prefereMenosMovimento.matches) return Promise.resolve();
    return alvo.animate(quadros, { duration: duracao, easing, fill: 'both' }).finished.then(() => undefined, () => undefined);
  };

  const limparAnimacoes = (): void => imagem.getAnimations().forEach((animacao) => animacao.cancel());

  const preCarregar = (alvo: FotoDoLightbox | undefined): void => {
    if (alvo) new Image().src = alvo.src;
  };

  const preencher = (foto: FotoDoLightbox, textoDaMiniatura?: string): void => {
    imagem.alt = foto.alt;
    imagem.width = foto.largura;
    imagem.height = foto.altura;
    palco.style.setProperty('--proporcao', String(foto.largura / foto.altura));
    imagem.src = textoDaMiniatura ?? foto.src;
    contador.textContent = `${indice + 1} / ${fotos.length}`;
    legenda.textContent = foto.legenda;
    credito.hidden = !foto.fotografo;
    credito.textContent = foto.fotografo ? `Foto: ${foto.fotografo}` : '';
  };

  const trocarParaFotoCompleta = (foto: FotoDoLightbox): void => {
    const pronta = new Image();
    pronta.src = foto.src;
    pronta.decode().then(() => {
      if (fotos[indice] === foto) imagem.src = foto.src;
    }, () => {
      if (fotos[indice] === foto) imagem.src = foto.src;
    });
  };

  const calcularFlip = (miniatura: HTMLElement, foto: FotoDoLightbox): { transformacao: string; recorte: string } => {
    const destino = calcularCaixaAjustada(foto.largura / foto.altura, palco.getBoundingClientRect());
    const origem = miniatura.getBoundingClientRect();
    const escala = Math.max(origem.width / destino.width, origem.height / destino.height);
    const deslocamentoX = origem.left + origem.width / 2 - (destino.left + destino.width / 2);
    const deslocamentoY = origem.top + origem.height / 2 - (destino.top + destino.height / 2);
    const recorteX = Math.max(0, (destino.width - origem.width / escala) / 2);
    const recorteY = Math.max(0, (destino.height - origem.height / escala) / 2);
    return {
      transformacao: `translate(${deslocamentoX}px, ${deslocamentoY}px) scale(${escala})`,
      recorte: `inset(${recorteY}px ${recorteX}px ${recorteY}px ${recorteX}px)`,
    };
  };

  const abrir = (indiceInicial: number): void => {
    fotos = obterFotos();
    indice = indiceInicial;
    const foto = fotos[indice];
    if (!foto) return;
    elementoDeOrigem = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.documentElement.style.overflow = 'hidden';
    dialogo.showModal();
    preencher(foto, foto.miniatura?.currentSrc || undefined);
    trocarParaFotoCompleta(foto);
    preCarregar(fotos[(indice + 1) % fotos.length]);
    preCarregar(fotos[(indice - 1 + fotos.length) % fotos.length]);
    if (foto.miniatura && isVisivelNaTela(foto.miniatura)) {
      const { transformacao, recorte } = calcularFlip(foto.miniatura, foto);
      void animar(imagem, [
        { transform: transformacao, clipPath: recorte },
        { transform: 'none', clipPath: 'inset(0px 0px 0px 0px)' },
      ], DURACAO_DO_FLIP_EM_MS).then(limparAnimacoes);
    } else {
      void animar(imagem, [{ opacity: 0 }, { opacity: 1 }], DURACAO_DO_FADE_EM_MS).then(limparAnimacoes);
    }
  };

  const finalizarFechamento = (): void => {
    dialogo.close();
    document.documentElement.style.overflow = '';
    limparAnimacoes();
    isFechando = false;
    const origem = fotos[indice]?.miniatura?.closest<HTMLElement>('[data-abrir]') ?? elementoDeOrigem;
    origem?.focus({ preventScroll: true });
  };

  const fechar = async (): Promise<void> => {
    if (isFechando || !dialogo.open) return;
    isFechando = true;
    const foto = fotos[indice];
    if (foto?.miniatura && isVisivelNaTela(foto.miniatura)) {
      const { transformacao, recorte } = calcularFlip(foto.miniatura, foto);
      await animar(imagem, [
        { transform: 'none', clipPath: 'inset(0px 0px 0px 0px)' },
        { transform: transformacao, clipPath: recorte },
      ], DURACAO_DO_FLIP_EM_MS * 0.8, EASE_UI);
    } else {
      await animar(imagem, [{ opacity: 1 }, { opacity: 0 }], DURACAO_DO_FADE_EM_MS, EASE_UI);
    }
    finalizarFechamento();
  };

  const trocar = async (passo: number, deslocamentoInicial = 0): Promise<void> => {
    if (isTrocando || isFechando || fotos.length < 2) return;
    isTrocando = true;
    const sentido = Math.sign(passo);
    const saida = -sentido * Math.max(palco.clientWidth * 0.25, 80);
    await animar(imagem, [
      { transform: `translateX(${deslocamentoInicial}px)`, opacity: 1 - Math.min(Math.abs(deslocamentoInicial) / palco.clientWidth, 0.6) },
      { transform: `translateX(${saida}px)`, opacity: 0 },
    ], DURACAO_DA_TROCA_EM_MS, EASE_UI);
    indice = (indice + passo + fotos.length) % fotos.length;
    const foto = fotos[indice];
    if (foto) {
      preencher(foto);
      preCarregar(fotos[(indice + sentido + fotos.length) % fotos.length]);
    }
    await animar(imagem, [
      { transform: `translateX(${-saida}px)`, opacity: 0 },
      { transform: 'translateX(0)', opacity: 1 },
    ], DURACAO_DO_FLIP_EM_MS * 0.7);
    limparAnimacoes();
    isTrocando = false;
  };

  const voltarAoCentro = (deslocamento: number): void => {
    void animar(imagem, [{ transform: `translateX(${deslocamento}px)` }, { transform: 'translateX(0)' }], DURACAO_DO_FLIP_EM_MS * 0.7).then(() => {
      limparAnimacoes();
      imagem.style.transform = '';
      imagem.style.opacity = '';
    });
  };

  let amostras: AmostraDeArrasto[] = [];
  let inicioDoArrasto: { x: number; y: number } | null = null;
  let isArrastando = false;

  palco.addEventListener('pointerdown', (evento) => {
    if (evento.pointerType === 'mouse' || isTrocando || isFechando) return;
    inicioDoArrasto = { x: evento.clientX, y: evento.clientY };
    amostras = [{ x: evento.clientX, tempo: evento.timeStamp }];
    isArrastando = false;
  });

  palco.addEventListener('pointermove', (evento) => {
    if (!inicioDoArrasto) return;
    const deslocamento = evento.clientX - inicioDoArrasto.x;
    if (!isArrastando && Math.abs(deslocamento) > 8 && Math.abs(deslocamento) > Math.abs(evento.clientY - inicioDoArrasto.y)) {
      isArrastando = true;
      palco.setPointerCapture(evento.pointerId);
    }
    if (!isArrastando) return;
    amostras.push({ x: evento.clientX, tempo: evento.timeStamp });
    amostras = amostras.filter((amostra) => evento.timeStamp - amostra.tempo <= 120);
    imagem.style.transform = `translateX(${deslocamento}px)`;
    imagem.style.opacity = String(1 - Math.min(Math.abs(deslocamento) / palco.clientWidth, 0.6));
  });

  const encerrarArrasto = (evento: PointerEvent): void => {
    if (!inicioDoArrasto) return;
    const deslocamento = evento.clientX - inicioDoArrasto.x;
    const wasArrastando = isArrastando;
    inicioDoArrasto = null;
    isArrastando = false;
    if (!wasArrastando) return;
    const primeira = amostras[0];
    const velocidade = primeira && evento.timeStamp > primeira.tempo ? (evento.clientX - primeira.x) / (evento.timeStamp - primeira.tempo) : 0;
    const projetado = deslocamento + velocidade * JANELA_DE_INERCIA_EM_MS;
    const limite = Math.max(ARRASTO_MINIMO_EM_PX, palco.clientWidth * FRACAO_DE_LARGURA_PARA_TROCAR);
    imagem.style.transform = '';
    imagem.style.opacity = '';
    if (Math.abs(projetado) >= limite) void trocar(projetado < 0 ? 1 : -1, deslocamento);
    else voltarAoCentro(deslocamento);
  };

  palco.addEventListener('pointerup', encerrarArrasto);
  palco.addEventListener('pointercancel', encerrarArrasto);

  palco.addEventListener('click', (evento) => {
    if (evento.target === palco) void fechar();
  });

  dialogo.addEventListener('cancel', (evento) => {
    evento.preventDefault();
    void fechar();
  });

  dialogo.addEventListener('keydown', (evento) => {
    if (evento.key === 'ArrowRight') void trocar(1);
    else if (evento.key === 'ArrowLeft') void trocar(-1);
  });

  consultar(dialogo, '[data-fechar]').addEventListener('click', () => void fechar());
  consultar(dialogo, '[data-anterior]').addEventListener('click', () => void trocar(-1));
  consultar(dialogo, '[data-proxima]').addEventListener('click', () => void trocar(1));

  return { abrir };
}
