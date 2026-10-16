import { ativarInclinacao, habilitarEstadoAtivoNoToque, podeAnimar } from '@/scripts/loja/inclinacao';

const DURACAO_DA_TROCA_MS = 242;

function mostrarVista(palco: HTMLElement, vista: string): void {
  const vistas = [...palco.querySelectorAll<HTMLElement>('[data-vista]')];
  const proxima = vistas.find((elemento) => elemento.dataset.vista === vista);
  if (!proxima || !proxima.hidden) return;
  vistas.forEach((elemento) => { elemento.hidden = elemento !== proxima; });
  palco.querySelectorAll<HTMLButtonElement>('[data-mostrar-vista]').forEach((botao) => {
    botao.setAttribute('aria-pressed', String(botao.dataset.mostrarVista === vista));
  });
  if (podeAnimar()) {
    proxima.animate(
      [{ opacity: 0, transform: 'scale(.97)' }, { opacity: 1, transform: 'none' }],
      { duration: DURACAO_DA_TROCA_MS * 2, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    );
  }
}

function aplicarCor(ficha: HTMLElement, palco: HTMLElement, botao: HTMLButtonElement): void {
  const { corNome = '', corBase = '', corEstampa = '' } = botao.dataset;
  palco.style.setProperty('--cor-produto', corBase);
  palco.style.setProperty('--cor-estampa', corEstampa);
  palco.querySelector<HTMLElement>('.ficha__vitrine')?.style.setProperty('--cor-vitrine', corBase);
  ficha.querySelectorAll<HTMLButtonElement>('[data-cor-nome]').forEach((outro) => {
    outro.setAttribute('aria-pressed', String(outro === botao));
  });
  const corAtual = ficha.querySelector<HTMLElement>('[data-cor-atual]');
  if (corAtual) corAtual.textContent = corNome;
  palco.querySelectorAll<SVGElement>('svg[role="img"]').forEach((ilustracao) => {
    const rotulo = ilustracao.getAttribute('aria-label') ?? '';
    ilustracao.setAttribute('aria-label', rotulo.replace(/cor [^,]+$/, `cor ${corNome.toLowerCase()}`));
  });
}

export function iniciarFichaDoProduto(): void {
  const ficha = document.querySelector<HTMLElement>('[data-ficha]');
  const palco = ficha?.querySelector<HTMLElement>('[data-ficha-palco]');
  if (!ficha || !palco) return;

  palco.querySelectorAll<HTMLButtonElement>('[data-mostrar-vista]').forEach((botao) => {
    botao.addEventListener('click', () => mostrarVista(palco, botao.dataset.mostrarVista ?? 'frente'));
  });

  ficha.querySelectorAll<HTMLButtonElement>('[data-cor-nome]').forEach((botao) => {
    botao.addEventListener('click', () => aplicarCor(ficha, palco, botao));
  });

  ativarInclinacao(palco, '[data-inclinavel]', 4);
  const relacionados = document.querySelector<HTMLElement>('[data-relacionados]');
  if (!relacionados) return;
  ativarInclinacao(relacionados, '[data-inclinavel]');
  habilitarEstadoAtivoNoToque(relacionados);
}
