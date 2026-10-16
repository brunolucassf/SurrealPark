const INCLINACAO_MAXIMA_GRAUS = 6;

export function podeAnimar(): boolean {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function habilitarEstadoAtivoNoToque(raiz: HTMLElement): void {
  // O Safari do iOS só aplica :active quando há um ouvinte de toque no ancestral.
  raiz.addEventListener('touchstart', () => {}, { passive: true });
}

export function ativarInclinacao(raiz: HTMLElement, seletor: string, grausMaximos = INCLINACAO_MAXIMA_GRAUS): void {
  if (!podeAnimar() || !window.matchMedia('(pointer: fine)').matches) return;

  let quadro = 0;
  let ultimoEvento: PointerEvent | null = null;

  const inclinar = () => {
    quadro = 0;
    const alvo = (ultimoEvento?.target as Element | null)?.closest<HTMLElement>(seletor);
    if (!alvo || !ultimoEvento) return;
    const caixa = alvo.getBoundingClientRect();
    const proporcaoX = (ultimoEvento.clientX - caixa.left) / caixa.width;
    const proporcaoY = (ultimoEvento.clientY - caixa.top) / caixa.height;
    alvo.style.setProperty('--incl-y', `${((proporcaoX - 0.5) * 2 * grausMaximos).toFixed(2)}deg`);
    alvo.style.setProperty('--incl-x', `${((0.5 - proporcaoY) * 2 * grausMaximos).toFixed(2)}deg`);
    alvo.style.setProperty('--brilho-x', `${(proporcaoX * 100).toFixed(1)}%`);
    alvo.style.setProperty('--brilho-y', `${(proporcaoY * 100).toFixed(1)}%`);
    alvo.classList.add('is-inclinado');
  };

  raiz.addEventListener('pointermove', (evento) => {
    if (evento.pointerType !== 'mouse' && evento.pointerType !== 'pen') return;
    ultimoEvento = evento;
    if (!quadro) quadro = requestAnimationFrame(inclinar);
  }, { passive: true });

  raiz.addEventListener('pointerout', (evento) => {
    const origem = (evento.target as Element).closest<HTMLElement>(seletor);
    if (!origem || origem.contains(evento.relatedTarget as Node | null)) return;
    origem.style.removeProperty('--incl-x');
    origem.style.removeProperty('--incl-y');
    origem.classList.remove('is-inclinado');
  });
}
