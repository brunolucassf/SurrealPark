import { registrarPreferenciaDeCookies, type CategoriaDeCookie } from './painel-publico';

export type CategoriasDeCookie = Record<CategoriaDeCookie, boolean>;

export interface ConsentimentoSalvo {
  visitanteId: string;
  versaoTexto: string;
  categorias: CategoriasDeCookie;
  decididoEm: string;
  isSincronizado: boolean;
}

export const EVENTO_DE_CONSENTIMENTO = 'surreal:consentimento';

const CHAVE_DE_ARMAZENAMENTO = 'surreal:consentimento';
const BYTES_DO_IDENTIFICADOR = 24;

export const SEM_CONSENTIMENTO: CategoriasDeCookie = { necessarios: true, preferencias: false, analiticos: false, marketing: false };

function isConsentimentoSalvo(valor: unknown): valor is ConsentimentoSalvo {
  const candidato = valor as ConsentimentoSalvo | null;
  return typeof candidato === 'object' && candidato !== null
    && typeof candidato.visitanteId === 'string'
    && typeof candidato.versaoTexto === 'string'
    && typeof candidato.categorias === 'object' && candidato.categorias !== null;
}

export function lerConsentimento(): ConsentimentoSalvo | null {
  try {
    const bruto = window.localStorage.getItem(CHAVE_DE_ARMAZENAMENTO);
    const valor: unknown = bruto ? JSON.parse(bruto) : null;
    return isConsentimentoSalvo(valor) ? valor : null;
  } catch {
    return null;
  }
}

function gravarConsentimento(consentimento: ConsentimentoSalvo): void {
  try {
    window.localStorage.setItem(CHAVE_DE_ARMAZENAMENTO, JSON.stringify(consentimento));
  } catch {
    return;
  }
}

function gerarIdentificadorDoVisitante(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(BYTES_DO_IDENTIFICADOR));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function podeUsarCategoria(categoria: CategoriaDeCookie): boolean {
  if (categoria === 'necessarios') return true;
  return lerConsentimento()?.categorias[categoria] === true;
}

export function anunciarConsentimento(categorias: CategoriasDeCookie): void {
  document.dispatchEvent(new CustomEvent(EVENTO_DE_CONSENTIMENTO, { detail: categorias }));
}

export async function sincronizarConsentimento(consentimento: ConsentimentoSalvo): Promise<void> {
  try {
    const resposta = await registrarPreferenciaDeCookies({
      visitanteId: consentimento.visitanteId,
      categorias: { ...consentimento.categorias, necessarios: true },
      versaoTexto: consentimento.versaoTexto,
    });
    if (resposta.ok) gravarConsentimento({ ...consentimento, isSincronizado: true });
  } catch {
    return;
  }
}

export async function salvarDecisao(categorias: CategoriasDeCookie, versaoTexto: string): Promise<void> {
  const consentimento: ConsentimentoSalvo = {
    visitanteId: lerConsentimento()?.visitanteId ?? gerarIdentificadorDoVisitante(),
    versaoTexto,
    categorias: { ...categorias, necessarios: true },
    decididoEm: new Date().toISOString(),
    isSincronizado: false,
  };
  gravarConsentimento(consentimento);
  anunciarConsentimento(consentimento.categorias);
  await sincronizarConsentimento(consentimento);
}
