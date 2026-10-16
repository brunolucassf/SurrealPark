import { isAparelhoLimitado, suportaWebGL2 } from './gl/motor';
import type { CenaDoRino } from './rino-cena';

interface OpcoesDoRinoceronte {
  secao?: HTMLElement | null;
  isAutomatico?: boolean;
  isArcosOrbitais?: boolean;
  isDescartavel?: boolean;
}

const MARGEM_DE_CARGA = '600px 0px';

export function prepararRinoceronte({ secao: secaoInformada, isAutomatico: isAutomaticoPermitido = true, isArcosOrbitais = false, isDescartavel = false }: OpcoesDoRinoceronte = {}): void {
  const secao = secaoInformada ?? document.querySelector<HTMLElement>('[data-rino]');
  const alvo = secao?.querySelector<HTMLElement>('[data-rino-canvas]');
  const botao = secao?.querySelector<HTMLButtonElement>('[data-rino-alternar]');
  const dica = secao?.querySelector<HTMLElement>('[data-rino-dica]');
  const status = secao?.querySelector<HTMLElement>('[data-rino-status]');
  const lanterna = secao?.querySelector<HTMLElement>('[data-rino-lanterna]');
  if (!secao || !alvo || !botao || !dica || !status || !suportaWebGL2()) return;

  const prefereMenosMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isAutomatico = isAutomaticoPermitido && !prefereMenosMovimento && !isAparelhoLimitado();
  let cena: CenaDoRino | null = null;
  let carregamento: Promise<CenaDoRino | null> | null = null;

  const mostrarModo = (modo: '3d' | 'imagem') => {
    secao.dataset.modo = modo;
    botao.textContent = modo === '3d' ? 'Ver imagem' : 'Ver em 3D';
    dica.hidden = modo !== '3d';
    cena?.definirAtiva(modo === '3d');
  };

  const carregar = () => {
    carregamento ??= (async () => {
      status.textContent = 'Carregando escultura';
      try {
        const { criarCenaDoRino } = await import('./rino-cena');
        cena = await criarCenaDoRino({ alvo, secao, lanterna, isGiroAutomatico: !prefereMenosMovimento, isArcosOrbitais });
        if (isArcosOrbitais) secao.dataset.arcos = '3d';
        status.textContent = '';
        return cena;
      } catch {
        status.textContent = '';
        botao.hidden = true;
        dica.hidden = true;
        mostrarModo('imagem');
        return null;
      }
    })();
    return carregamento;
  };

  const descartar = () => {
    if (!cena) return;
    mostrarModo('imagem');
    cena.destruir();
    cena = null;
    carregamento = null;
    delete secao.dataset.arcos;
  };

  botao.hidden = false;
  botao.addEventListener('click', async () => {
    if (secao.dataset.modo === '3d') {
      mostrarModo('imagem');
      return;
    }
    const resultado = await carregar();
    if (resultado) mostrarModo('3d');
  });

  if (!isAutomatico && !isDescartavel) return;
  new IntersectionObserver((entradas, observador) => {
    const isPerto = entradas.some((entrada) => entrada.isIntersecting);
    if (!isPerto) {
      if (isDescartavel) descartar();
      return;
    }
    if (!isAutomatico) return;
    if (!isDescartavel) observador.disconnect();
    void carregar().then((resultado) => {
      if (resultado && resultado === cena) mostrarModo('3d');
    });
  }, { rootMargin: MARGEM_DE_CARGA }).observe(secao);
}
