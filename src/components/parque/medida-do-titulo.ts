const LARGURA_EM_EM_DA_KALNIA: Record<string, number> = {
  a: 0.616, b: 0.61, c: 0.588, d: 0.619, e: 0.589, f: 0.342, g: 0.562, h: 0.637, i: 0.276, j: 0.305, k: 0.52, l: 0.26, m: 0.997,
  n: 0.645, o: 0.586, p: 0.627, q: 0.608, r: 0.425, s: 0.511, t: 0.295, u: 0.627, v: 0.577, w: 0.873, x: 0.617, y: 0.577, z: 0.529,
  A: 0.717, B: 0.676, C: 0.711, D: 0.737, E: 0.659, F: 0.594, G: 0.725, H: 0.78, I: 0.315, J: 0.423, K: 0.671, L: 0.596, M: 0.91,
  N: 0.785, O: 0.737, P: 0.633, Q: 0.737, R: 0.668, S: 0.652, T: 0.696, U: 0.724, V: 0.7, W: 1.118, X: 0.7, Y: 0.639, Z: 0.658,
};
const LARGURA_PADRAO_EM_EM = 0.7;
const FOLGA_PARA_FONTE_RESERVA = 1.08;

function medirPalavraEmEm(palavra: string): number {
  return [...palavra.normalize('NFD').replace(/\p{Diacritic}/gu, '')]
    .reduce((soma, letra) => soma + (LARGURA_EM_EM_DA_KALNIA[letra] ?? LARGURA_PADRAO_EM_EM), 0);
}

export function medirMaiorPalavraEmEm(texto: string): number {
  const maior = Math.max(...texto.split(' ').map(medirPalavraEmEm));
  return Number((maior * FOLGA_PARA_FONTE_RESERVA).toFixed(3));
}
