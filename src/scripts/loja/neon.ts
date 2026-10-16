const INCLINACAO_MAXIMA_GRAUS = 6;
const SUAVIZACAO = 0.1;
const DURACAO_DA_PISCADA_MS = 242;
const MARGEM_DE_PARADA = 0.01;

export function iniciarNeonDaLoja(): void {
  const neon = document.querySelector<HTMLElement>('[data-neon]');
  const palco = neon?.querySelector<HTMLElement>('[data-neon-palco]');
  const olho = palco?.querySelector<SVGElement>('.neon__olho');
  if (!neon || !palco || !olho) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(pointer: fine)').matches) return;

  let alvoX = 0;
  let alvoY = 0;
  let atualX = 0;
  let atualY = 0;
  let quadro = 0;

  const desenhar = () => {
    atualX += (alvoX - atualX) * SUAVIZACAO;
    atualY += (alvoY - atualY) * SUAVIZACAO;
    palco.style.transform = `perspective(900px) rotateX(${atualY.toFixed(2)}deg) rotateY(${atualX.toFixed(2)}deg)`;
    const isEmRepouso = Math.abs(alvoX - atualX) < MARGEM_DE_PARADA && Math.abs(alvoY - atualY) < MARGEM_DE_PARADA;
    quadro = isEmRepouso ? 0 : requestAnimationFrame(desenhar);
  };

  const pedirQuadro = () => {
    if (!quadro) quadro = requestAnimationFrame(desenhar);
  };

  const mirar = (evento: PointerEvent) => {
    const caixa = neon.getBoundingClientRect();
    const deslocamentoX = (evento.clientX - (caixa.left + caixa.width / 2)) / (window.innerWidth / 2);
    const deslocamentoY = (evento.clientY - (caixa.top + caixa.height / 2)) / (window.innerHeight / 2);
    alvoX = Math.max(-1, Math.min(1, deslocamentoX)) * INCLINACAO_MAXIMA_GRAUS;
    alvoY = Math.max(-1, Math.min(1, deslocamentoY)) * -INCLINACAO_MAXIMA_GRAUS;
    pedirQuadro();
  };

  const relaxar = () => {
    alvoX = 0;
    alvoY = 0;
    pedirQuadro();
  };

  const piscar = () => {
    olho.animate(
      [{ transform: 'scaleY(1)' }, { transform: 'scaleY(0.08)', offset: 0.45 }, { transform: 'scaleY(1)' }],
      { duration: DURACAO_DA_PISCADA_MS, easing: 'cubic-bezier(0.83, 0, 0.17, 1)' },
    );
  };

  window.addEventListener('pointermove', mirar, { passive: true });
  document.documentElement.addEventListener('pointerleave', relaxar);
  neon.addEventListener('pointerenter', piscar);
}
