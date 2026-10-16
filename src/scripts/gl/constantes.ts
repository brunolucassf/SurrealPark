export interface Luz {
  cor: string;
  posicao: [number, number];
  raio: number;
  intensidade: number;
}

export interface Humor {
  base: string;
  luz1: Luz;
  luz2: Luz;
  nevoa: number;
  isClaro?: boolean;
}

export const HUMORES: Record<string, Humor> = {
  datas: {
    base: '#131215',
    luz1: { cor: '#D6A24A', posicao: [0.85, -0.1], raio: 0.9, intensidade: 0.8 },
    luz2: { cor: '#5A3E36', posicao: [0.1, 1.0], raio: 0.7, intensidade: 0.6 },
    nevoa: 0.55,
  },
  ascensao: {
    base: '#131215',
    luz1: { cor: '#E6BD6E', posicao: [0.5, -0.2], raio: 1.0, intensidade: 0.6 },
    luz2: { cor: '#2A2230', posicao: [0.5, 1.1], raio: 0.8, intensidade: 0.5 },
    nevoa: 0.4,
  },
  palcos: {
    base: '#131215',
    luz1: { cor: '#D6A24A', posicao: [0.75, 0.5], raio: 0.8, intensidade: 0.7 },
    luz2: { cor: '#1A191C', posicao: [0.1, 0.1], raio: 0.6, intensidade: 0.3 },
    nevoa: 0.5,
  },
  noite: {
    base: '#0C0B0D',
    luz1: { cor: '#FFC27A', posicao: [0.5, 0.6], raio: 0.5, intensidade: 0.35 },
    luz2: { cor: '#9FB0C6', posicao: [0.9, 0.9], raio: 0.5, intensidade: 0.25 },
    nevoa: 0.2,
  },
  luar: {
    base: '#131215',
    luz1: { cor: '#9FB0C6', posicao: [0.8, 1.05], raio: 0.9, intensidade: 0.5 },
    luz2: { cor: '#B8862F', posicao: [0.1, -0.1], raio: 0.6, intensidade: 0.3 },
    nevoa: 0.5,
  },
  amanhecer: {
    base: '#F4EEE3',
    luz1: { cor: '#F0D49A', posicao: [0.5, -0.2], raio: 1.1, intensidade: 0.5 },
    luz2: { cor: '#E9C9B8', posicao: [0.9, 1.0], raio: 0.7, intensidade: 0.4 },
    nevoa: 0.35,
    isClaro: true,
  },
  loja: {
    base: '#131215',
    luz1: { cor: '#E6BD6E', posicao: [0.7, 0.6], raio: 0.7, intensidade: 0.6 },
    luz2: { cor: '#E58AE5', posicao: [0.1, 0.1], raio: 0.5, intensidade: 0.25 },
    nevoa: 0.45,
  },
};

export const FUNDO = {
  escalaDesktop: 0.5,
  escalaMobile: 0.35,
  degrausDoGovernador: [0.35, 0.25],
  limiteDoQuadroMs: 20,
  janelaDoGovernador: 60,
  teto: [0.22, 0.18, 0.15] as [number, number, number],
  piso: [0.88, 0.84, 0.78] as [number, number, number],
  misturaDaLuzDoPalco: 0.4,
};

export const HERO = {
  dprDesktop: 1.5,
  dprMobile: 1.25,
  resolucaoMaximaDaTrilha: 512,
  decaimento: 0.965,
  adveccao: 0.6,
  lerpDoPonteiro: 0.18,
  raioBase: 0.06,
  raioExtraMaximo: 0.08,
  raioMobile: 0.12,
  amplitudeOciosa: [0.32, 0.18] as [number, number],
};
