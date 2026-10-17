import { isPainelConfigurado, lerJson } from './painel';

export interface ScriptsDeConfiguracao {
  metaPixelId: string | null;
  gtmContainerId: string | null;
  capiAtivo: boolean;
  ga4MeasurementId: string | null;
  modoDemo: boolean;
}

export interface ConfigPublica {
  ambiente: 'demo' | 'production' | string;
  demo: boolean;
  scripts: ScriptsDeConfiguracao;
}

const TEMPO_DE_CACHE_EM_MS = 30_000;

const VAZIO: ConfigPublica = {
  ambiente: 'demo',
  demo: true,
  scripts: { metaPixelId: null, gtmContainerId: null, capiAtivo: false, ga4MeasurementId: null, modoDemo: true },
};

let cache: { valor: ConfigPublica; obtidoEm: number } | null = null;

function isStringOuNulo(valor: unknown): valor is string | null {
  return valor === null || typeof valor === 'string';
}

function isBooleano(valor: unknown): valor is boolean {
  return typeof valor === 'boolean';
}

function isConfigPublica(valor: unknown): valor is ConfigPublica {
  if (typeof valor !== 'object' || valor === null) return false;
  const candidato = valor as ConfigPublica;
  return typeof candidato.ambiente === 'string'
    && isBooleano(candidato.demo)
    && typeof candidato.scripts === 'object' && candidato.scripts !== null
    && isStringOuNulo(candidato.scripts.metaPixelId)
    && isStringOuNulo(candidato.scripts.gtmContainerId)
    && isBooleano(candidato.scripts.capiAtivo)
    && isStringOuNulo(candidato.scripts.ga4MeasurementId)
    && isBooleano(candidato.scripts.modoDemo);
}

export async function carregarConfigPublica(isForcado = false): Promise<ConfigPublica> {
  if (!isPainelConfigurado) return VAZIO;
  const agora = Date.now();
  if (!isForcado && cache && agora - cache.obtidoEm < TEMPO_DE_CACHE_EM_MS) return cache.valor;
  try {
    const corpo = await lerJson('/config');
    if (!isConfigPublica(corpo)) return VAZIO;
    cache = { valor: corpo, obtidoEm: agora };
    return corpo;
  } catch {
    return VAZIO;
  }
}

export function invalidarCacheDeConfigPublica(): void {
  cache = null;
}
