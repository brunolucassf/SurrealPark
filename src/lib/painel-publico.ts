import { enviarJson, lerJson, type ImagemPublica, type RespostaDeEnvio } from './painel';

export type Disponibilidade = 'disponivel' | 'ultimas_unidades' | 'esgotado';
export type CategoriaDeCookie = 'necessarios' | 'preferencias' | 'analiticos' | 'marketing';

export interface GaleriaPublica {
  slug: string;
  titulo: string;
  descricao: string;
  evento: { slug: string; nome: string; dataEvento: string } | null;
  capa: ImagemPublica | null;
  totalFotos: number;
  atualizadoEm: string;
}

export interface FotoPublica {
  id: string;
  imagem: ImagemPublica;
  miniatura: ImagemPublica;
  credito: string | null;
}

export interface ArtistaPublico {
  slug: string;
  nome: string;
  estilo: string | null;
  bio: string;
  foto: ImagemPublica | null;
  links: { rotulo: string; url: string }[];
  atualizadoEm: string;
}

export interface PrecoPublico {
  atualCentavos: number;
  deCentavos: number | null;
  percentualDesconto: number | null;
  promocaoAte: string | null;
}

export interface ProdutoPublico {
  slug: string;
  nome: string;
  categoria: string | null;
  preco: PrecoPublico;
  imagemPrincipal: ImagemPublica | null;
  disponibilidade: Disponibilidade;
  atualizadoEm: string;
}

export interface VariacaoPublica { corNome: string; corHex: string; tamanho: string; disponibilidade: Disponibilidade }
export interface ProdutoPublicoDetalhe extends ProdutoPublico {
  descricao: string;
  imagens: (ImagemPublica & { corNome: string | null })[];
  variacoes: VariacaoPublica[];
}

export interface ConfiguracaoDeLeads { versaoTexto: string; textoConsentimento: string; textoMarketing: string }

export interface CategoriaDeCookieConfigurada { chave: CategoriaDeCookie; rotulo: string; descricao: string; obrigatoria: boolean }
export interface ConfiguracaoDeCookies { versaoTexto: string; textoBanner: string; categorias: CategoriaDeCookieConfigurada[] }

interface Pagina<T> { itens: T[]; proximoCursor: string | null }

export const CATEGORIA_SEM_NOME = { id: 'outros', rotulo: 'Outros' };

export function normalizarCategoria(nome: string | null): { id: string; rotulo: string } {
  const rotulo = nome?.trim();
  if (!rotulo) return CATEGORIA_SEM_NOME;
  const id = rotulo.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return { id: id || CATEGORIA_SEM_NOME.id, rotulo };
}

const LIMITE_DE_PAGINAS = 20;
const LIMITE_POR_PAGINA = 100;

function isPagina<T>(valor: unknown): valor is Pagina<T> {
  return typeof valor === 'object' && valor !== null && Array.isArray((valor as Pagina<T>).itens);
}

function acrescentarParametros(caminho: string, parametros: Record<string, string>): string {
  const consulta = new URLSearchParams(parametros).toString();
  return consulta ? `${caminho}${caminho.includes('?') ? '&' : '?'}${consulta}` : caminho;
}

async function lerTodasAsPaginas<T>(caminho: string): Promise<T[]> {
  const itens: T[] = [];
  let cursor: string | null = null;
  for (let pagina = 0; pagina < LIMITE_DE_PAGINAS; pagina += 1) {
    const corpo = await lerJson(acrescentarParametros(caminho, { limite: String(LIMITE_POR_PAGINA), ...(cursor ? { cursor } : {}) }));
    if (!isPagina<T>(corpo)) throw new Error(`resposta de ${caminho} fora do contrato`);
    itens.push(...corpo.itens);
    cursor = corpo.proximoCursor;
    if (!cursor) break;
  }
  return itens;
}

function isObjetoComTexto(valor: unknown, chaves: string[]): boolean {
  return typeof valor === 'object' && valor !== null && chaves.every((chave) => typeof (valor as Record<string, unknown>)[chave] === 'string');
}

export function buscarGalerias(): Promise<GaleriaPublica[]> {
  return lerTodasAsPaginas<GaleriaPublica>('/galerias');
}

export async function buscarGaleria(slug: string): Promise<GaleriaPublica> {
  const corpo = await lerJson(`/galerias/${encodeURIComponent(slug)}`);
  if (!isObjetoComTexto(corpo, ['slug', 'titulo'])) throw new Error('resposta da galeria fora do contrato');
  return corpo as GaleriaPublica;
}

export function buscarFotosDaGaleria(slug: string): Promise<FotoPublica[]> {
  return lerTodasAsPaginas<FotoPublica>(`/galerias/${encodeURIComponent(slug)}/fotos`);
}

export function buscarArtistas(): Promise<ArtistaPublico[]> {
  return lerTodasAsPaginas<ArtistaPublico>('/artistas');
}

export function buscarProdutos(): Promise<ProdutoPublico[]> {
  return lerTodasAsPaginas<ProdutoPublico>('/loja/produtos');
}

export async function buscarProduto(slug: string): Promise<ProdutoPublicoDetalhe> {
  const corpo = await lerJson(`/loja/produtos/${encodeURIComponent(slug)}`);
  if (!isObjetoComTexto(corpo, ['slug', 'nome'])) throw new Error('resposta do produto fora do contrato');
  return corpo as ProdutoPublicoDetalhe;
}

export async function buscarConfiguracaoDeLeads(): Promise<ConfiguracaoDeLeads> {
  const corpo = await lerJson('/leads/configuracao');
  if (!isObjetoComTexto(corpo, ['versaoTexto', 'textoConsentimento', 'textoMarketing'])) throw new Error('configuração de leads fora do contrato');
  return corpo as ConfiguracaoDeLeads;
}

export async function buscarConfiguracaoDeCookies(): Promise<ConfiguracaoDeCookies> {
  const corpo = await lerJson('/cookies/configuracao');
  const configuracao = corpo as ConfiguracaoDeCookies;
  if (!isObjetoComTexto(corpo, ['versaoTexto', 'textoBanner']) || !Array.isArray(configuracao.categorias)) throw new Error('configuração de cookies fora do contrato');
  return configuracao;
}

export type TipoDeLead = 'contato' | 'locacao' | 'mesa';

export interface LeadParaEnvio {
  tipo: TipoDeLead;
  nome: string;
  email: string;
  telefone: string | null;
  mensagem: string;
  cpf?: string | null;
  cupomCodigo?: string | null;
  consentimento: { aceito: true; versaoTexto: string };
  marketing: boolean;
  origem: string;
  website: string;
  detalhes: Record<string, string | number>;
}

export interface PreferenciaDeCookies {
  visitanteId: string;
  categorias: Record<CategoriaDeCookie, boolean>;
  versaoTexto: string;
}

export function enviarLead(lead: LeadParaEnvio, chaveDeIdempotencia: string): Promise<RespostaDeEnvio> {
  return enviarJson('/leads', lead, { 'Idempotency-Key': chaveDeIdempotencia });
}

export function registrarPreferenciaDeCookies(preferencia: PreferenciaDeCookies): Promise<RespostaDeEnvio> {
  return enviarJson('/cookies', preferencia);
}
