const ITENS_POR_SEGUNDO = 0.3;
const RESPOSTA_DA_VELOCIDADE = 0.06;
const VELOCIDADE_DE_REPOUSO = 0.0005;
const LIMIAR_DE_ARRASTO_EM_PX = 6;
const JANELA_DO_CLIQUE_FANTASMA_EM_MS = 80;
const PASSO_MAXIMO_EM_S = 0.1;

type Sentido = 'esquerda' | 'direita';

interface Fileira {
  elemento: HTMLElement;
  trilho: HTMLElement;
  sequencia: HTMLElement;
  sentido: Sentido;
  totalDeItens: number;
  passo: number;
  periodo: number;
  largura: number;
  fase: number;
}

interface Arrasto {
  fileira: Fileira;
  x: number;
  y: number;
  avancoInicial: number;
  pointerId: number;
  isAtivo: boolean;
}

const prefereMenosMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');

function montarFileira(elemento: HTMLElement): Fileira | null {
  const trilho = elemento.querySelector<HTMLElement>('[data-trilho]');
  const sequencia = elemento.querySelector<HTMLElement>('[data-sequencia]');
  if (!trilho || !sequencia || sequencia.children.length === 0) return null;
  return {
    elemento,
    trilho,
    sequencia,
    sentido: elemento.dataset.sentido === 'direita' ? 'direita' : 'esquerda',
    totalDeItens: sequencia.children.length,
    passo: 0,
    periodo: 0,
    largura: 0,
    fase: 0,
  };
}

function removerCopias(fileira: Fileira): void {
  fileira.trilho.querySelectorAll('[data-copia]').forEach((copia) => copia.remove());
}

function criarCopia(fileira: Fileira): HTMLElement {
  const copia = fileira.sequencia.cloneNode(true) as HTMLElement;
  copia.removeAttribute('data-sequencia');
  copia.removeAttribute('aria-label');
  copia.setAttribute('aria-hidden', 'true');
  copia.dataset.copia = '';
  copia.querySelectorAll<HTMLAnchorElement>('a').forEach((link) => {
    link.tabIndex = -1;
  });
  return copia;
}

function medirFileira(fileira: Fileira): void {
  const [primeiro, segundo] = [...fileira.sequencia.children] as HTMLElement[];
  if (!primeiro) return;
  fileira.passo = segundo ? segundo.offsetLeft - primeiro.offsetLeft : primeiro.offsetWidth;
  fileira.periodo = fileira.passo * fileira.totalDeItens;
  fileira.largura = fileira.elemento.clientWidth;
  const copiasNecessarias = Math.ceil(fileira.largura / Math.max(fileira.periodo, 1));
  const copiasAtuais = fileira.trilho.querySelectorAll('[data-copia]').length;
  for (let indice = copiasAtuais; indice < copiasNecessarias; indice += 1) fileira.trilho.append(criarCopia(fileira));
}

function calcularFases(fileiras: Fileira[]): void {
  fileiras.reduce((fase, fileira) => {
    fileira.fase = fase;
    return fase + fileira.largura / Math.max(fileira.passo, 1) + 1;
  }, 0);
}

function calcularDeslocamento(fileira: Fileira, avanco: number): number {
  const { sentido, largura, passo, periodo, fase, totalDeItens } = fileira;
  const bruto = sentido === 'esquerda' ? largura - (avanco - fase) * passo : (avanco - fase - totalDeItens) * passo;
  return (((bruto % periodo) + periodo) % periodo) - periodo;
}

function iniciarFila(raiz: HTMLElement): void {
  const area = raiz.querySelector<HTMLElement>('[data-fileiras]');
  const botaoDePausa = raiz.querySelector<HTMLButtonElement>('[data-pausar]');
  if (!area) return;
  const fileiras = [...area.querySelectorAll<HTMLElement>('[data-fileira]')]
    .map(montarFileira)
    .filter((fileira): fileira is Fileira => fileira !== null);
  const fileiraAcessivel = fileiras[0];
  if (!fileiraAcessivel) return;

  let avanco = 0;
  let velocidade = 0;
  let ultimoTempo = 0;
  let quadroPendente = 0;
  let isAtivo = false;
  let isPausadoPeloUsuario = false;
  let isSobAPonteira = false;
  let isComFoco = false;
  let isVisivel = false;
  let arrasto: Arrasto | null = null;
  let deveIgnorarClique = false;

  const deveAvancar = (): boolean => !isPausadoPeloUsuario && !isSobAPonteira && !isComFoco && !arrasto?.isAtivo;

  const aplicarPosicao = (): void => {
    fileiras.forEach((fileira) => {
      if (isComFoco && fileira === fileiraAcessivel) return;
      fileira.trilho.style.transform = `translate3d(${calcularDeslocamento(fileira, avanco).toFixed(2)}px, 0, 0)`;
    });
  };

  const avancarQuadro = (tempo: number): void => {
    const intervalo = ultimoTempo ? Math.min((tempo - ultimoTempo) / 1000, PASSO_MAXIMO_EM_S) : 0;
    ultimoTempo = tempo;
    const velocidadeAlvo = deveAvancar() ? ITENS_POR_SEGUNDO : 0;
    velocidade += (velocidadeAlvo - velocidade) * (1 - Math.pow(1 - RESPOSTA_DA_VELOCIDADE, intervalo * 60));
    avanco += velocidade * intervalo;
    aplicarPosicao();
    const isParado = velocidadeAlvo === 0 && velocidade < VELOCIDADE_DE_REPOUSO;
    if (isParado || !isVisivel || !isAtivo) {
      velocidade = isParado ? 0 : velocidade;
      quadroPendente = 0;
      ultimoTempo = 0;
      return;
    }
    quadroPendente = requestAnimationFrame(avancarQuadro);
  };

  const retomar = (): void => {
    if (!isAtivo || !isVisivel || quadroPendente) return;
    if (!deveAvancar() && velocidade === 0) return;
    quadroPendente = requestAnimationFrame(avancarQuadro);
  };

  const medirTudo = (): void => {
    fileiras.forEach(medirFileira);
    calcularFases(fileiras);
    aplicarPosicao();
  };

  const sairDoModoDeFoco = (): void => {
    isComFoco = false;
    delete raiz.dataset.foco;
    fileiraAcessivel.elemento.scrollLeft = 0;
    aplicarPosicao();
    retomar();
  };

  area.addEventListener('focusin', (evento) => {
    const alvo = evento.target as HTMLElement;
    if (!isAtivo || !fileiraAcessivel.elemento.contains(alvo) || !alvo.matches(':focus-visible')) return;
    isComFoco = true;
    raiz.dataset.foco = '';
    fileiraAcessivel.trilho.style.transform = '';
  });

  area.addEventListener('focusout', (evento) => {
    if (!isComFoco || fileiraAcessivel.elemento.contains(evento.relatedTarget as Node | null)) return;
    sairDoModoDeFoco();
  });

  area.addEventListener('pointerenter', (evento) => {
    if (evento.pointerType !== 'mouse') return;
    isSobAPonteira = true;
  });

  area.addEventListener('pointerleave', (evento) => {
    if (evento.pointerType !== 'mouse') return;
    isSobAPonteira = false;
    retomar();
  });

  area.addEventListener('dragstart', (evento) => evento.preventDefault());

  area.addEventListener('pointerdown', (evento) => {
    if (!isAtivo || isComFoco || evento.button !== 0) return;
    const elemento = (evento.target as HTMLElement).closest<HTMLElement>('[data-fileira]');
    const fileira = fileiras.find((item) => item.elemento === elemento);
    if (!fileira) return;
    deveIgnorarClique = false;
    arrasto = { fileira, x: evento.clientX, y: evento.clientY, avancoInicial: avanco, pointerId: evento.pointerId, isAtivo: false };
  });

  area.addEventListener('pointermove', (evento) => {
    if (!arrasto || evento.pointerId !== arrasto.pointerId) return;
    const deslocamentoX = evento.clientX - arrasto.x;
    const deslocamentoY = evento.clientY - arrasto.y;
    if (!arrasto.isAtivo) {
      if (Math.abs(deslocamentoY) > LIMIAR_DE_ARRASTO_EM_PX && Math.abs(deslocamentoY) > Math.abs(deslocamentoX)) {
        arrasto = null;
        return;
      }
      if (Math.abs(deslocamentoX) <= LIMIAR_DE_ARRASTO_EM_PX) return;
      arrasto.isAtivo = true;
      area.setPointerCapture(evento.pointerId);
      raiz.dataset.arrastando = '';
    }
    const sinal = arrasto.fileira.sentido === 'esquerda' ? -1 : 1;
    avanco = arrasto.avancoInicial + (sinal * deslocamentoX) / Math.max(arrasto.fileira.passo, 1);
    aplicarPosicao();
  });

  const encerrarArrasto = (evento: PointerEvent): void => {
    if (!arrasto || evento.pointerId !== arrasto.pointerId) return;
    const wasAtivo = arrasto.isAtivo;
    arrasto = null;
    delete raiz.dataset.arrastando;
    if (!wasAtivo) return;
    if (area.hasPointerCapture(evento.pointerId)) area.releasePointerCapture(evento.pointerId);
    deveIgnorarClique = evento.type === 'pointerup';
    window.setTimeout(() => {
      deveIgnorarClique = false;
    }, JANELA_DO_CLIQUE_FANTASMA_EM_MS);
    if (evento.pointerType !== 'mouse') isSobAPonteira = false;
    retomar();
  };

  area.addEventListener('pointerup', encerrarArrasto);
  area.addEventListener('pointercancel', encerrarArrasto);

  area.addEventListener('click', (evento) => {
    if (!deveIgnorarClique) return;
    evento.preventDefault();
    evento.stopPropagation();
    deveIgnorarClique = false;
  }, true);

  botaoDePausa?.addEventListener('click', () => {
    isPausadoPeloUsuario = !isPausadoPeloUsuario;
    botaoDePausa.setAttribute('aria-pressed', String(isPausadoPeloUsuario));
    retomar();
  });

  new IntersectionObserver(([registro]) => {
    isVisivel = Boolean(registro?.isIntersecting);
    retomar();
  }).observe(area);

  new ResizeObserver(() => {
    if (isAtivo) medirTudo();
  }).observe(area);

  const ativar = (): void => {
    isAtivo = true;
    raiz.setAttribute('data-movimento', '');
    if (botaoDePausa) botaoDePausa.hidden = false;
    medirTudo();
    retomar();
  };

  const desativar = (): void => {
    isAtivo = false;
    cancelAnimationFrame(quadroPendente);
    quadroPendente = 0;
    velocidade = 0;
    raiz.removeAttribute('data-movimento');
    delete raiz.dataset.foco;
    if (botaoDePausa) botaoDePausa.hidden = true;
    fileiras.forEach((fileira) => {
      removerCopias(fileira);
      fileira.trilho.style.transform = '';
    });
  };

  prefereMenosMovimento.addEventListener('change', () => (prefereMenosMovimento.matches ? desativar() : ativar()));
  if (prefereMenosMovimento.matches) desativar();
  else ativar();
}

export function iniciarFilaDeArtistas(): void {
  document.querySelectorAll<HTMLElement>('[data-artistas]').forEach(iniciarFila);
}
