import { ErroDoPainel, isPainelConfigurado } from '@/lib/painel';
import { buscarGaleria } from '@/lib/painel-publico';

const STATUS_DE_AUSENTE = 404;

function esconder(elemento: HTMLElement | null): void {
  if (!elemento) return;
  elemento.hidden = true;
  elemento.style.display = 'none';
}

function mostrarIndisponivel(aviso: HTMLElement): void {
  esconder(document.querySelector<HTMLElement>('[data-galeria]'));
  esconder(document.querySelector<HTMLElement>('.outros-eventos'));
  aviso.hidden = false;
}

export async function vigiarDisponibilidadeDaGaleria(): Promise<void> {
  const aviso = document.querySelector<HTMLElement>('[data-galeria-indisponivel]');
  if (!isPainelConfigurado || !aviso?.dataset.galeriaSlug) return;
  try {
    await buscarGaleria(aviso.dataset.galeriaSlug);
  } catch (erro) {
    if (erro instanceof ErroDoPainel && erro.status === STATUS_DE_AUSENTE) mostrarIndisponivel(aviso);
  }
}
