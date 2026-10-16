const ESPERA_MAXIMA_DO_LOADER_MS = 4000;
const PRAZO_DE_OCIOSIDADE_MS = 1500;
const RECUO_SEM_OCIOSIDADE_MS = 200;

function aguardarFimDoLoader(): Promise<void> {
  const raiz = document.documentElement;
  if (!raiz.classList.contains('tem-loader')) return Promise.resolve();
  return new Promise((resolver) => {
    const encerrar = () => {
      observador.disconnect();
      window.clearTimeout(limite);
      resolver();
    };
    const observador = new MutationObserver(() => {
      if (!raiz.classList.contains('tem-loader')) encerrar();
    });
    const limite = window.setTimeout(encerrar, ESPERA_MAXIMA_DO_LOADER_MS);
    observador.observe(raiz, { attributes: true, attributeFilter: ['class'] });
  });
}

function aguardarOciosidade(): Promise<void> {
  return new Promise((resolver) => {
    if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(() => resolver(), { timeout: PRAZO_DE_OCIOSIDADE_MS });
    else window.setTimeout(resolver, RECUO_SEM_OCIOSIDADE_MS);
  });
}

export async function aguardarLoaderEOciosidade(): Promise<void> {
  await aguardarFimDoLoader();
  await aguardarOciosidade();
}
