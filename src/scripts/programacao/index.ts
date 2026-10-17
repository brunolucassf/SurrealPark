const LERP = 0.1;
const INCLINACAO_MAXIMA = 4;

function isInclinacaoPermitida(): boolean {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function iniciarPoster(): void {
  const poster = document.querySelector<HTMLElement>('[data-poster]');
  if (!poster || !isInclinacaoPermitida()) return;
  let alvoX = 0;
  let alvoY = 0;
  let atualX = 0;
  let atualY = 0;
  let quadro = 0;

  const animar = () => {
    atualX += (alvoX - atualX) * LERP;
    atualY += (alvoY - atualY) * LERP;
    poster.style.setProperty('--inclina-x', `${atualX.toFixed(3)}deg`);
    poster.style.setProperty('--inclina-y', `${atualY.toFixed(3)}deg`);
    const isParado = Math.abs(alvoX - atualX) < 0.01 && Math.abs(alvoY - atualY) < 0.01;
    quadro = isParado ? 0 : requestAnimationFrame(animar);
  };
  const pedirQuadro = () => { if (!quadro) quadro = requestAnimationFrame(animar); };

  poster.addEventListener('pointermove', (evento) => {
    if (evento.pointerType !== 'mouse') return;
    const caixa = poster.getBoundingClientRect();
    const x = (evento.clientX - caixa.left) / caixa.width;
    const y = (evento.clientY - caixa.top) / caixa.height;
    alvoY = (x - 0.5) * 2 * INCLINACAO_MAXIMA;
    alvoX = (0.5 - y) * 2 * INCLINACAO_MAXIMA;
    poster.style.setProperty('--reflexo-x', `${(x * 100).toFixed(1)}%`);
    poster.style.setProperty('--reflexo-y', `${(y * 100).toFixed(1)}%`);
    poster.dataset.ativo = '';
    pedirQuadro();
  });
  poster.addEventListener('pointerleave', () => {
    alvoX = 0;
    alvoY = 0;
    delete poster.dataset.ativo;
    pedirQuadro();
  });
}

export function iniciarFiltro(): void {
  const grupo = document.querySelector<HTMLElement>('[data-filtro]');
  if (!grupo) return;
  const botoes = grupo.querySelectorAll<HTMLButtonElement>('[data-mes]');
  const linhas = document.querySelectorAll<HTMLElement>('[data-mes-da-linha]');
  const aviso = document.querySelector<HTMLElement>('[data-filtro-aviso]');

  botoes.forEach((botao) => {
    botao.addEventListener('click', () => {
      const mes = botao.dataset.mes ?? 'todas';
      botoes.forEach((outro) => outro.setAttribute('aria-pressed', String(outro === botao)));
      let visiveis = 0;
      linhas.forEach((linha) => {
        const isVisivel = mes === 'todas' || linha.dataset.mesDaLinha === mes;
        linha.hidden = !isVisivel;
        if (isVisivel) visiveis += 1;
      });
      if (aviso) {
        aviso.textContent = mes === 'todas'
          ? `Mostrando todas as ${visiveis} datas`
          : `${visiveis} ${visiveis === 1 ? 'data' : 'datas'} em ${botao.dataset.mesPorExtenso}`;
      }
    });
  });
}

function iniciarCopiaDoNumero(): void {
  const aviso = document.querySelector<HTMLElement>('[data-copiar-aviso]');
  document.querySelectorAll<HTMLButtonElement>('[data-copiar]').forEach((botao) => {
    botao.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(botao.dataset.copiar ?? '');
        if (aviso) aviso.textContent = 'Número copiado.';
      } catch {
        window.location.href = `tel:${(botao.dataset.copiar ?? '').replace(/[^\d+]/g, '')}`;
      }
    });
  });
}

export function iniciarProgramacao(): void {
  iniciarPoster();
  iniciarFiltro();
  iniciarCopiaDoNumero();
}
