import { PALCOS, type IdDoPalco } from '@/data/palcos';

export interface ImagemPublica { url: string; alt: string; largura: number; altura: number }

export interface EventoPublico {
  slug: string;
  nome: string;
  descricao: string;
  dataEvento: string;
  inicioEm: string;
  fimEm: string;
  precoCentavos: number | null;
  gratuito: boolean;
  urlIngresso: string | null;
  djs: { nome: string; ordem: number; horario: string | null }[];
  palcos: { nome: string }[];
  flyer: ImagemPublica | null;
  flyerHover: ImagemPublica | null;
  atualizadoEm: string;
}

export type StatusDeTela = 'aberto' | 'esgotado' | 'em_breve' | 'encerrado';
export type PlataformaDeTela = 'ingresse' | 'blueticket' | 'outra';

export interface EventoDeTela {
  chave: string;
  assinatura: string;
  titulo: string;
  inicio: string;
  fim: string;
  artistas: { nome: string; destaque: boolean }[];
  palcos: IdDoPalco[];
  ingressoUrl: string | undefined;
  plataforma: PlataformaDeTela;
  status: StatusDeTela;
  flyer: ImagemPublica | undefined;
  flyerHover: ImagemPublica | undefined;
}

interface PaginaPublica { itens: EventoPublico[]; proximoCursor: string | null }

const TEMPO_LIMITE_EM_MS = 6000;
const LIMITE_DE_PAGINAS = 10;
const BASE_DA_API = (import.meta.env.PUBLIC_PAINEL_API_URL ?? '').trim().replace(/\/+$/, '');

export class ErroDoPainel extends Error {
  constructor(readonly status: number) {
    super(`painel respondeu ${status}`);
  }
}

export const isPainelConfigurado = BASE_DA_API !== '';

function isPaginaPublica(valor: unknown): valor is PaginaPublica {
  return typeof valor === 'object' && valor !== null && Array.isArray((valor as PaginaPublica).itens);
}

export async function lerJson(caminho: string): Promise<unknown> {
  const controle = new AbortController();
  const temporizador = setTimeout(() => controle.abort(), TEMPO_LIMITE_EM_MS);
  try {
    const resposta = await fetch(`${BASE_DA_API}/public/v1${caminho}`, { signal: controle.signal, credentials: 'omit', headers: { Accept: 'application/json' } });
    if (!resposta.ok) throw new ErroDoPainel(resposta.status);
    return await resposta.json();
  } finally {
    clearTimeout(temporizador);
  }
}

export interface RespostaDeEnvio { ok: boolean; status: number; corpo: unknown; esperarSegundos: number | null }

export async function enviarJson(caminho: string, corpo: unknown, cabecalhos: Record<string, string> = {}): Promise<RespostaDeEnvio> {
  const controle = new AbortController();
  const temporizador = setTimeout(() => controle.abort(), TEMPO_LIMITE_EM_MS);
  try {
    const resposta = await fetch(`${BASE_DA_API}/public/v1${caminho}`, {
      method: 'POST',
      signal: controle.signal,
      credentials: 'omit',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...cabecalhos },
      body: JSON.stringify(corpo),
    });
    const corpoDaResposta: unknown = await resposta.json().catch(() => null);
    const espera = Number(resposta.headers.get('Retry-After'));
    return { ok: resposta.ok, status: resposta.status, corpo: corpoDaResposta, esperarSegundos: Number.isFinite(espera) && espera > 0 ? espera : null };
  } finally {
    clearTimeout(temporizador);
  }
}

async function lerEventos(periodo: 'proximos' | 'passados'): Promise<EventoPublico[]> {
  const eventos: EventoPublico[] = [];
  let cursor: string | null = null;
  for (let pagina = 0; pagina < LIMITE_DE_PAGINAS; pagina += 1) {
    const sufixoDoCursor: string = cursor ? `&cursor=${encodeURIComponent(cursor)}` : '';
    const corpo = await lerJson(`/eventos?periodo=${periodo}${sufixoDoCursor}`);
    if (!isPaginaPublica(corpo)) throw new Error('resposta de eventos fora do contrato');
    eventos.push(...corpo.itens);
    cursor = corpo.proximoCursor;
    if (!cursor) break;
  }
  return eventos;
}

export async function buscarEventosProximos(): Promise<EventoDeTela[]> {
  return (await lerEventos('proximos')).map(converterEventoPublico);
}

export async function buscarEventosPassados(): Promise<EventoDeTela[]> {
  return (await lerEventos('passados')).map(converterEventoPublico);
}

export async function buscarDestaquesDaHome(): Promise<EventoDeTela[]> {
  const corpo = await lerJson('/home');
  const destaques = (corpo as { destaques?: unknown }).destaques;
  if (!Array.isArray(destaques)) throw new Error('resposta da home fora do contrato');
  return (destaques as EventoPublico[]).map(converterEventoPublico);
}

function normalizarNomeDoPalco(nome: string): string {
  return nome.trim().toLowerCase().replace(/\s+/g, '-');
}

function converterPalcos(palcos: EventoPublico['palcos']): IdDoPalco[] {
  return palcos.map((palco) => normalizarNomeDoPalco(palco.nome)).filter((id): id is IdDoPalco => (PALCOS as readonly string[]).includes(id));
}

function inferirPlataforma(url: string | undefined): PlataformaDeTela {
  if (!url) return 'outra';
  const { hostname } = new URL(url);
  if (hostname.includes('ingresse')) return 'ingresse';
  if (hostname.includes('blueticket')) return 'blueticket';
  return 'outra';
}

function isUrlSegura(url: string | null): url is string {
  return url !== null && url.startsWith('https://');
}

function derivarStatusDoPublico(evento: EventoPublico, ingressoUrl: string | undefined): StatusDeTela {
  if (Date.parse(evento.fimEm) < Date.now()) return 'encerrado';
  return ingressoUrl ? 'aberto' : 'em_breve';
}

export function converterEventoPublico(evento: EventoPublico): EventoDeTela {
  const ingressoUrl = isUrlSegura(evento.urlIngresso) ? evento.urlIngresso : undefined;
  const djs = [...evento.djs].sort((a, b) => a.ordem - b.ordem);
  return {
    chave: evento.slug,
    assinatura: `${evento.slug}@${evento.atualizadoEm}`,
    titulo: evento.nome,
    inicio: evento.inicioEm,
    fim: evento.fimEm,
    artistas: djs.map((dj, indice) => ({ nome: dj.nome, destaque: indice === 0 })),
    palcos: converterPalcos(evento.palcos),
    ingressoUrl,
    plataforma: inferirPlataforma(ingressoUrl),
    status: derivarStatusDoPublico(evento, ingressoUrl),
    flyer: evento.flyer ?? undefined,
    flyerHover: evento.flyerHover ?? undefined,
  };
}
