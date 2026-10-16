const SKEW_MAXIMO_EM_GRAUS = 1.5;
const GRAUS_POR_PIXEL_DE_VELOCIDADE = 0.05;
const SUAVIZACAO_DO_SKEW = 0.12;
const SKEW_DE_REPOUSO = 0.02;
const ATRASO_POR_LINHA_EM_MS = 110;
const TOLERANCIA_DE_LINHA_EM_PX = 8;

export interface EfeitosDaGrade {
  observar: (quadros: HTMLElement[]) => void;
}

const prefereMenosMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');

function agruparPorLinha(quadros: HTMLElement[]): HTMLElement[][] {
  const ordenados = [...quadros].sort((a, b) => a.offsetTop - b.offsetTop || a.offsetLeft - b.offsetLeft);
  return ordenados.reduce<HTMLElement[][]>((linhas, quadro) => {
    const ultima = linhas.at(-1);
    if (ultima && Math.abs((ultima[0]?.offsetTop ?? 0) - quadro.offsetTop) <= TOLERANCIA_DE_LINHA_EM_PX) ultima.push(quadro);
    else linhas.push([quadro]);
    return linhas;
  }, []);
}

function iniciarEntradaPorLinha(): EfeitosDaGrade {
  const observador = new IntersectionObserver((entradas) => {
    const aparecendo = entradas.filter((entrada) => entrada.isIntersecting).map((entrada) => entrada.target as HTMLElement);
    agruparPorLinha(aparecendo).forEach((linha, indice) => {
      linha.forEach((quadro) => {
        quadro.style.setProperty('--atraso', `${indice * ATRASO_POR_LINHA_EM_MS}ms`);
        quadro.dataset.entrou = 'true';
        observador.unobserve(quadro);
      });
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

  return {
    observar: (quadros) => {
      quadros.forEach((quadro) => {
        if (prefereMenosMovimento.matches) quadro.dataset.entrou = 'true';
        else if (!quadro.dataset.entrou) observador.observe(quadro);
      });
    },
  };
}

function iniciarCurvaPorVelocidade(grade: HTMLElement): void {
  const isPonteiroPreciso = window.matchMedia('(pointer: fine)');
  if (prefereMenosMovimento.matches || !isPonteiroPreciso.matches) return;

  let skewAtual = 0;
  let ultimoScroll = window.scrollY;
  let isAnimando = false;

  const quadro = (): void => {
    const velocidade = window.scrollY - ultimoScroll;
    ultimoScroll = window.scrollY;
    const alvo = Math.max(-SKEW_MAXIMO_EM_GRAUS, Math.min(SKEW_MAXIMO_EM_GRAUS, -velocidade * GRAUS_POR_PIXEL_DE_VELOCIDADE));
    skewAtual += (alvo - skewAtual) * SUAVIZACAO_DO_SKEW;
    const isEmRepouso = Math.abs(skewAtual) < SKEW_DE_REPOUSO && alvo === 0;
    grade.style.transform = isEmRepouso ? '' : `skewY(${skewAtual.toFixed(3)}deg)`;
    if (isEmRepouso) {
      isAnimando = false;
      skewAtual = 0;
      return;
    }
    requestAnimationFrame(quadro);
  };

  window.addEventListener('scroll', () => {
    if (isAnimando) return;
    isAnimando = true;
    ultimoScroll = window.scrollY;
    requestAnimationFrame(quadro);
  }, { passive: true });

  prefereMenosMovimento.addEventListener('change', () => {
    grade.style.transform = '';
  });
}

export function iniciarEfeitosDaGrade(grade: HTMLElement): EfeitosDaGrade {
  iniciarCurvaPorVelocidade(grade);
  return iniciarEntradaPorLinha();
}
