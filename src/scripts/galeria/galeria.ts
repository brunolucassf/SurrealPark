import { iniciarLightbox, type FotoDoLightbox } from './lightbox';
import { iniciarEfeitosDaGrade } from './efeitos';

function lerFotoDoQuadro(quadro: HTMLElement): FotoDoLightbox {
  const { grande = '', largura = '1', altura = '1', alt = '', legenda = '', fotografo } = quadro.dataset;
  return { src: grande, largura: Number(largura), altura: Number(altura), alt, legenda, fotografo: fotografo ?? null, miniatura: quadro.querySelector('img') };
}

function recarregarQuadro(quadro: HTMLElement): void {
  const figura = quadro.querySelector('picture');
  figura?.replaceWith(figura.cloneNode(true));
  quadro.querySelector('[data-falha]')?.setAttribute('hidden', '');
  delete quadro.dataset.falhou;
}

function iniciarGaleria(): void {
  const raiz = document.querySelector<HTMLElement>('[data-galeria]');
  const grade = raiz?.querySelector<HTMLElement>('[data-grade]');
  if (!raiz || !grade) return;

  const quadros = [...grade.querySelectorAll<HTMLElement>('[data-quadro]')];
  const efeitos = iniciarEfeitosDaGrade(grade);
  const lightbox = iniciarLightbox(raiz, () => quadros.map(lerFotoDoQuadro));

  grade.addEventListener('error', (evento) => {
    const quadro = (evento.target as HTMLElement).closest<HTMLElement>('[data-quadro]');
    if (!quadro) return;
    quadro.querySelector<HTMLElement>('[data-falha]')?.removeAttribute('hidden');
    quadro.dataset.falhou = 'true';
  }, true);

  grade.addEventListener('click', (evento) => {
    const alvo = evento.target as HTMLElement;
    const quadro = alvo.closest<HTMLElement>('[data-quadro]');
    if (!quadro) return;
    if (alvo.closest('[data-tentar-de-novo]')) recarregarQuadro(quadro);
    else if (alvo.closest('[data-abrir]') && !quadro.dataset.falhou) lightbox.abrir(quadros.indexOf(quadro));
  });

  grade.dataset.pronto = 'true';
  efeitos.observar(quadros);
}

iniciarGaleria();
