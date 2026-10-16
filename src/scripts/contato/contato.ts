const prefereMenosMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const DURACAO_DA_CONTAGEM_MS = 968;
const MARGEM_DE_ENTRADA = '0px 0px -15% 0px';

function aoEntrarUmaVez(alvo: Element, aoEntrar: () => void): void {
  const observador = new IntersectionObserver(([entrada]) => {
    if (!entrada?.isIntersecting) return;
    observador.disconnect();
    aoEntrar();
  }, { rootMargin: MARGEM_DE_ENTRADA });
  observador.observe(alvo);
}

function contarAte(elemento: HTMLElement, valorFinal: number): void {
  const inicio = performance.now();
  const passo = (agora: number) => {
    const progresso = Math.min((agora - inicio) / DURACAO_DA_CONTAGEM_MS, 1);
    const suavizado = 1 - Math.pow(1 - progresso, 3);
    elemento.textContent = Math.round(valorFinal * suavizado).toLocaleString('pt-BR');
    if (progresso < 1) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}

function animarCapacidades(): void {
  const lista = document.querySelector<HTMLElement>('[data-capacidades]');
  if (!lista) return;
  lista.dataset.estado = 'aguardando';
  lista.querySelectorAll<HTMLElement>('[data-contar]').forEach((numero) => { numero.textContent = '0'; });
  aoEntrarUmaVez(lista, () => {
    lista.dataset.estado = 'pronta';
    lista.querySelectorAll<HTMLElement>('[data-contar]').forEach((numero) => contarAte(numero, Number(numero.dataset.contar)));
  });
}

function soltarMarcadorNoParque(): void {
  const aerea = document.querySelector<HTMLElement>('[data-aerea]');
  if (!aerea) return;
  aerea.dataset.estado = 'aguardando';
  aoEntrarUmaVez(aerea, () => {
    requestAnimationFrame(() => { aerea.dataset.estado = 'caiu'; });
  });
}

function pulsarBotaoAoEntrar(): void {
  document.querySelectorAll<HTMLElement>('[data-pulso-ao-entrar]').forEach((botao) => {
    aoEntrarUmaVez(botao, () => botao.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
  });
}

export function iniciarContato(): void {
  if (prefereMenosMovimento) return;
  animarCapacidades();
  soltarMarcadorNoParque();
  pulsarBotaoAoEntrar();
}
