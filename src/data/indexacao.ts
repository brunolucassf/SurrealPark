import { IS_DEMONSTRACAO } from './demonstracao';

const PAGINAS_INDEXAVEIS = new Set(['/', '/o-parque', '/programacao', '/galeria', '/contato', '/loja', '/privacidade']);
const PREFIXOS_INDEXAVEIS = ['/galeria/', '/loja/'];

export function normalizarCaminho(caminho: string): string {
  return caminho.replace(/\.html$/, '').replace(/\/index$/, '').replace(/\/$/, '') || '/';
}

export function isCaminhoIndexavel(caminho: string): boolean {
  if (IS_DEMONSTRACAO) return false;
  const normalizado = normalizarCaminho(caminho);
  return PAGINAS_INDEXAVEIS.has(normalizado) || PREFIXOS_INDEXAVEIS.some((prefixo) => normalizado.startsWith(prefixo));
}
