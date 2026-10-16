export type Curva = (t: number) => number;

export function criarCurva(x1: number, y1: number, x2: number, y2: number): Curva {
  const coordenada = (t: number, a: number, b: number) => 3 * a * t * (1 - t) ** 2 + 3 * b * t ** 2 * (1 - t) + t ** 3;
  const derivada = (t: number, a: number, b: number) => 3 * a * (1 - t) ** 2 + 6 * (b - a) * t * (1 - t) + 3 * (1 - b) * t ** 2;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let iteracao = 0; iteracao < 6; iteracao += 1) {
      const inclinacao = derivada(t, x1, x2);
      if (Math.abs(inclinacao) < 1e-6) break;
      t -= (coordenada(t, x1, x2) - x) / inclinacao;
    }
    return coordenada(Math.min(Math.max(t, 0), 1), y1, y2);
  };
}

export const CURVA_DO_OLHO = criarCurva(0.83, 0, 0.17, 1);
export const CURVA_DE_SAIDA = criarCurva(0.16, 1, 0.3, 1);
export const CURVA_DE_ENTRADA = criarCurva(0.7, 0, 0.84, 0);
export const CURVA_DO_DROP = criarCurva(0.34, 1.56, 0.64, 1);
