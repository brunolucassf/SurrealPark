export const FORMAS = {
  'f-olho': 'M0,.5 C.22,.06 .78,.06 1,.5 C.78,.94 .22,.94 0,.5Z',
  'f-ritual': 'M0,1 L0,.52 C0,.2 .22,.02 .5,.02 C.78,.02 1,.2 1,.52 L1,1Z',
  'f-bells': 'M.5,0 C.36,0 .27,.06 .26,.18 C.24,.44 .2,.66 .04,.8 C.01,.83 .01,.88 .05,.9 L.95,.9 C.99,.88 .99,.83 .96,.8 C.8,.66 .76,.44 .74,.18 C.73,.06 .64,0 .5,0Z M.4,.95 C.4,1 .6,1 .6,.95 C.6,.91 .4,.91 .4,.95Z',
  'f-raw-room': 'M0,0 L.2,0 L.5,.3 L.8,0 L1,0 L1,.2 L.7,.5 L1,.8 L1,1 L.8,1 L.5,.7 L.2,1 L0,1 L0,.8 L.3,.5 L0,.2Z',
  'f-nomad': 'M0,1 L0,.42 C.08,.4 .16,.34 .2,.22 C.24,.34 .3,.38 .36,.38 C.42,.34 .46,.2 .5,0 C.54,.2 .58,.34 .64,.38 C.7,.38 .76,.34 .8,.22 C.84,.34 .92,.4 1,.42 L1,1Z',
  'f-church': 'M0,1 L0,.45 C.02,.25 .3,.1 .5,0 C.7,.1 .98,.25 1,.45 L1,1Z',
  'f-jet-set': 'M.5,0 C.78,0 1,.12 1,.3 L1,.7 C1,.88 .78,1 .5,1 C.22,1 0,.88 0,.7 L0,.3 C0,.12 .22,0 .5,0Z',
} as const;

export type IdDaForma = keyof typeof FORMAS;

export function ajustarQuadradoEmRetrato(caminho: string, proporcao = 0.8): string {
  const margem = (1 - proporcao) / 2;
  return caminho.replace(/(-?\d*\.?\d+),(-?\d*\.?\d+)/g, (_, x: string, y: string) => `${x},${+(margem + Number(y) * proporcao).toFixed(4)}`);
}

export const FORMAS_DA_PREVIA: Record<string, string> = {
  ritual: FORMAS['f-ritual'],
  bells: FORMAS['f-bells'],
  'raw-room': ajustarQuadradoEmRetrato(FORMAS['f-raw-room']),
  nomad: FORMAS['f-nomad'],
  church: FORMAS['f-church'],
};

const PASSOS_DAS_LAMPADAS = [0.06, 0.15, 0.24, 0.33, 0.42, 0.5, 0.58, 0.67, 0.76, 0.85, 0.94];

export const LAMPADAS_DO_X = PASSOS_DAS_LAMPADAS.flatMap((passo) => (passo === 0.5 ? [[passo, passo]] : [[passo, passo], [passo, 1 - passo]]))
  .map(([x = 0, y = 0]) => ({ x, y, ordem: Math.round(Math.abs(x - 0.5) / 0.09) }));

type Caixa = readonly [x: number, y: number, largura: number, altura: number];

export function normalizarCaminho(caminho: string, [x0, y0, largura, altura]: Caixa): string {
  return caminho.replace(/(-?\d*\.?\d+),(-?\d*\.?\d+)/g, (_, x: string, y: string) => `${+((Number(x) - x0) / largura).toFixed(4)},${+((Number(y) - y0) / altura).toFixed(4)}`);
}

export const CAIXA_DO_AVIAO: Caixa = [8, 2, 474, 102];

export const AVIAO_727 = {
  viewBox: '0 0 480 120',
  tracos: [
    'M12,80 C14,70 26,62 48,58 L360,54 C372,52 382,46 392,40 L428,8 L452,8 L444,46 C456,52 466,58 474,64 L470,70 C440,80 400,90 360,94 L52,96 C30,96 14,90 12,80 Z',
    'M412,10 L474,4 L478,10 L428,16 Z',
    'M330,62 L384,60 C392,60 396,64 396,68 C396,72 392,76 384,76 L330,76 C326,76 324,72 324,69 C324,66 326,62 330,62 Z',
    'M160,90 L280,88 L240,102 L190,102 Z',
    'M28,66 L46,61 L47,67 L32,70 Z',
    'M60,62 L70,62 L70,86 L60,86 Z',
  ],
  janelas: Array.from({ length: 24 }, (_, indice) => 78 + indice * 9.6),
};

export const RECORTE_DO_AVIAO = AVIAO_727.tracos.slice(0, 4).map((traco) => normalizarCaminho(traco, CAIXA_DO_AVIAO));
