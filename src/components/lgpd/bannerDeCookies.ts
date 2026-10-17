import { isPainelConfigurado } from '@/lib/painel';
import { buscarConfiguracaoDeCookies, type CategoriaDeCookieConfigurada, type ConfiguracaoDeCookies } from '@/lib/painel-publico';
import { SEM_CONSENTIMENTO, anunciarConsentimento, lerConsentimento, salvarDecisao, sincronizarConsentimento, type CategoriasDeCookie } from '@/lib/consentimento';
import './bannerDeCookies.css';

const SELETOR_DE_ABERTURA = '[data-abrir-preferencias-cookies]';
const LINK_DA_POLITICA = '/privacidade#cookies';

let configuracao: ConfiguracaoDeCookies | undefined;
let banner: HTMLElement | null = null;
let elementoDeOrigem: HTMLElement | null = null;

function criar<K extends keyof HTMLElementTagNameMap>(tag: K, classe: string, texto?: string): HTMLElementTagNameMap[K] {
  const elemento = document.createElement(tag);
  elemento.className = classe;
  if (texto) elemento.textContent = texto;
  return elemento;
}

function criarBotao(classe: string, texto: string, aoClicar: () => void): HTMLButtonElement {
  const botao = criar('button', classe, texto);
  botao.type = 'button';
  botao.addEventListener('click', aoClicar);
  return botao;
}

function listarOpcionais(categorias: CategoriaDeCookieConfigurada[]): CategoriaDeCookieConfigurada[] {
  return categorias.filter((categoria) => !categoria.obrigatoria);
}

function montarLinhaDeCategoria(categoria: CategoriaDeCookieConfigurada, isMarcada: boolean): HTMLElement {
  const linha = criar('div', 'cookies__categoria');
  const entrada = criar('input', 'cookies__marcacao');
  entrada.type = 'checkbox';
  entrada.id = `cookies-${categoria.chave}`;
  entrada.name = categoria.chave;
  entrada.checked = categoria.obrigatoria || isMarcada;
  entrada.disabled = categoria.obrigatoria;
  const texto = criar('div', 'cookies__categoria-texto');
  const rotulo = criar('label', 't-label cookies__categoria-rotulo', categoria.rotulo);
  rotulo.htmlFor = entrada.id;
  texto.append(rotulo, criar('p', 't-body-s cookies__categoria-descricao', categoria.descricao));
  if (categoria.obrigatoria) texto.append(criar('p', 't-mono-xs cookies__sempre-ativos', 'Sempre ativos'));
  linha.append(entrada, texto);
  return linha;
}

function lerEscolhas(painel: HTMLElement, categorias: CategoriaDeCookieConfigurada[]): CategoriasDeCookie {
  const escolhas: CategoriasDeCookie = { ...SEM_CONSENTIMENTO };
  listarOpcionais(categorias).forEach((categoria) => {
    escolhas[categoria.chave] = painel.querySelector<HTMLInputElement>(`input[name="${categoria.chave}"]`)?.checked ?? false;
  });
  return escolhas;
}

function todasAceitas(categorias: CategoriaDeCookieConfigurada[]): CategoriasDeCookie {
  const escolhas: CategoriasDeCookie = { ...SEM_CONSENTIMENTO };
  listarOpcionais(categorias).forEach((categoria) => { escolhas[categoria.chave] = true; });
  return escolhas;
}

function fechar(): void {
  banner?.remove();
  banner = null;
  const origem = elementoDeOrigem;
  elementoDeOrigem = null;
  if (origem?.isConnected) origem.focus();
}

async function decidir(escolhas: CategoriasDeCookie, versaoTexto: string): Promise<void> {
  fechar();
  await salvarDecisao(escolhas, versaoTexto);
}

function montarBanner(dados: ConfiguracaoDeCookies): HTMLElement {
  const salvo = lerConsentimento();
  const raiz = criar('section', 'cookies');
  raiz.setAttribute('role', 'dialog');
  raiz.setAttribute('aria-modal', 'false');
  raiz.setAttribute('aria-labelledby', 'cookies-titulo');
  raiz.setAttribute('aria-describedby', 'cookies-texto');

  const titulo = criar('h2', 't-h4 cookies__titulo', 'Cookies e privacidade');
  titulo.id = 'cookies-titulo';
  titulo.tabIndex = -1;
  const texto = criar('p', 't-body-s cookies__texto', dados.textoBanner);
  texto.id = 'cookies-texto';
  const politica = criar('a', 'link-texto t-body-s', 'Política de privacidade');
  politica.href = LINK_DA_POLITICA;

  const painel = criar('div', 'cookies__painel');
  painel.id = 'cookies-painel';
  painel.hidden = true;
  dados.categorias.forEach((categoria) => painel.append(montarLinhaDeCategoria(categoria, salvo?.categorias[categoria.chave] === true)));
  painel.append(criarBotao('btn btn--secundario cookies__salvar', 'Salvar minhas escolhas', () => void decidir(lerEscolhas(painel, dados.categorias), dados.versaoTexto)));

  const personalizar = criarBotao('cookies__personalizar link-texto t-body-s', 'Personalizar', () => {
    painel.hidden = !painel.hidden;
    personalizar.setAttribute('aria-expanded', String(!painel.hidden));
    personalizar.textContent = painel.hidden ? 'Personalizar' : 'Ocultar opções';
  });
  personalizar.setAttribute('aria-expanded', 'false');
  personalizar.setAttribute('aria-controls', painel.id);

  const acoes = criar('div', 'cookies__acoes');
  acoes.append(
    criarBotao('btn btn--primario', 'Aceitar todos', () => void decidir(todasAceitas(dados.categorias), dados.versaoTexto)),
    criarBotao('btn btn--secundario', 'Recusar opcionais', () => void decidir({ ...SEM_CONSENTIMENTO }, dados.versaoTexto)),
    personalizar,
  );

  raiz.append(titulo, texto, politica, acoes, painel);
  return raiz;
}

function exibir(dados: ConfiguracaoDeCookies, isComFoco: boolean): void {
  if (banner) return;
  banner = montarBanner(dados);
  document.body.append(banner);
  if (isComFoco) banner.querySelector<HTMLElement>('#cookies-titulo')?.focus();
}

async function carregarConfiguracao(): Promise<ConfiguracaoDeCookies | null> {
  if (configuracao) return configuracao;
  try {
    configuracao = await buscarConfiguracaoDeCookies();
    return configuracao;
  } catch {
    return null;
  }
}

async function reabrirPreferencias(origem: HTMLElement): Promise<void> {
  const dados = await carregarConfiguracao();
  if (!dados) return;
  elementoDeOrigem = origem;
  exibir(dados, true);
}

function ouvirPedidoDeReabertura(): void {
  document.addEventListener('click', (evento) => {
    const alvo = (evento.target as Element | null)?.closest<HTMLElement>(SELETOR_DE_ABERTURA);
    if (!alvo) return;
    evento.preventDefault();
    void reabrirPreferencias(alvo);
  });
}

export async function iniciarBannerDeCookies(): Promise<void> {
  if (!isPainelConfigurado) return;
  ouvirPedidoDeReabertura();
  const dados = await carregarConfiguracao();
  if (!dados) return;
  const salvo = lerConsentimento();
  if (salvo && salvo.versaoTexto === dados.versaoTexto) {
    anunciarConsentimento(salvo.categorias);
    if (!salvo.isSincronizado) void sincronizarConsentimento(salvo);
    return;
  }
  exibir(dados, false);
}
