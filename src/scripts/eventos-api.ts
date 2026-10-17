import { NOME_DO_PALCO } from '@/data/palcos';
import { CONTATOS, SUFIXO_NOVA_ABA, criarLinkWhatsApp } from '@/data/site';
import { extrairPartesDaData, formatarDataCurta, formatarDataDoCard, formatarDataPorExtenso, formatarHora } from '@/lib/formato-evento';
import { buscarDestaquesDaHome, buscarEventosProximos, isPainelConfigurado, type EventoDeTela, type PlataformaDeTela } from '@/lib/painel';

const NOME_DA_PLATAFORMA: Record<PlataformaDeTela, string> = { ingresse: 'Ingresse', blueticket: 'Blueticket', outra: 'plataforma oficial' };
const LIMITE_DE_DATAS_DA_HOME = 4;
const ICONE_EXTERNO = '<svg class="btn__icone" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.5" d="M7 17 17 7M8 7h9v9" /></svg>';
const ICONE_PIRAMIDE = '<svg class="btn__seta" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path fill="currentColor" d="M10 5 1 0v10z" /></svg>';

type ReservaDeLentes = Record<string, string>;

let proximosEmAndamento: Promise<EventoDeTela[]> | undefined;

function lerProximosUmaVez(): Promise<EventoDeTela[]> {
  proximosEmAndamento ??= buscarEventosProximos();
  return proximosEmAndamento;
}

function escapar(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function aguardarOciosidade(): Promise<void> {
  return new Promise((resolver) => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(() => resolver(), { timeout: 2500 });
    else setTimeout(resolver, 600);
  });
}

function calcularAssinatura(eventos: EventoDeTela[]): string {
  return eventos.map((evento) => evento.assinatura).join('|');
}

function montarLinkDeMesas(evento: EventoDeTela): string {
  const mensagem = ['Olá, quero reservar mesa ou camarote no Surreal Park.', `Evento: ${evento.titulo} · ${formatarDataDoCard(evento.inicio)}`, 'Número de pessoas:', 'Meu nome:'].join('\n');
  return criarLinkWhatsApp(CONTATOS.whatsappMesas, mensagem);
}

function descreverCompra(evento: EventoDeTela): string {
  return `Comprar ingresso para ${evento.titulo}, ${formatarDataPorExtenso(evento.inicio)}, na ${NOME_DA_PLATAFORMA[evento.plataforma]} ${SUFIXO_NOVA_ABA}`;
}

function isLineUpVisivel(evento: EventoDeTela): boolean {
  return evento.artistas.length > 0 && !(evento.artistas.length === 1 && evento.artistas[0]?.nome === evento.titulo);
}

function montarArtistas(evento: EventoDeTela, classeBase: 'evento' | 'poster'): string {
  if (!isLineUpVisivel(evento)) return '';
  const destaques = evento.artistas.filter((artista) => artista.destaque).map((artista) => artista.nome).join(', ');
  const demais = evento.artistas.filter((artista) => !artista.destaque).map((artista) => artista.nome).join(', ');
  const trechoDemais = demais ? `<span class="${classeBase}__demais"> · com ${escapar(demais)}</span>` : '';
  return `<p class="${classeBase}__artistas"><span class="${classeBase}__destaques">${escapar(destaques)}</span>${trechoDemais}</p>`;
}

function montarLuzesDosPalcos(evento: EventoDeTela): string {
  return evento.palcos.map((palco) => `<li style="--luz: var(--luz-${palco})">${escapar(NOME_DO_PALCO[palco])}</li>`).join('');
}

function montarAcaoDaLinha(evento: EventoDeTela): string {
  if (evento.status === 'aberto' && evento.ingressoUrl) {
    const plataforma = NOME_DA_PLATAFORMA[evento.plataforma];
    return `<a class="btn btn--primario evento__cta" href="${escapar(evento.ingressoUrl)}" target="_blank" rel="noopener" data-pulso aria-label="${escapar(descreverCompra(evento))}">Comprar na ${plataforma}${ICONE_EXTERNO}</a><p class="t-mono-xs evento__apoio">Abre a ${plataforma} em nova aba</p>`;
  }
  if (evento.status === 'esgotado') {
    return `<span class="btn evento__cta evento__cta--off" aria-disabled="true">Ingressos esgotados</span><a class="link-texto t-body-s" href="${escapar(montarLinkDeMesas(evento))}" target="_blank" rel="noopener">Perguntar por mesas e camarotes<span class="sr-only"> (abre o WhatsApp)</span></a>`;
  }
  return '';
}

function montarSeloDaLinha(evento: EventoDeTela): string {
  if (evento.status === 'esgotado') return '<span class="t-mono-xs evento__selo">Esgotado</span>';
  if (evento.status === 'em_breve') return '<span class="t-mono-xs evento__selo evento__selo--breve">Ingressos em breve</span>';
  return '';
}

function escolherUrlDaLente(evento: EventoDeTela, reserva: ReservaDeLentes): string | undefined {
  const [primeiroPalco] = evento.palcos;
  return evento.flyerHover?.url ?? evento.flyer?.url ?? (primeiroPalco ? reserva[primeiroPalco] : undefined) ?? reserva.neutro;
}

function montarLinha(evento: EventoDeTela, nivelDoTitulo: 'h2' | 'h3', urlDaLente: string | undefined): string {
  const partes = extrairPartesDaData(evento.inicio);
  const dataCurta = formatarDataDoCard(evento.inicio);
  const palcos = evento.palcos.length > 0
    ? `<ul class="t-mono" role="list">${montarLuzesDosPalcos(evento)}</ul>`
    : '<p class="t-mono evento__palco-pendente">Palco a anunciar</p>';
  const atributoDaLente = urlDaLente ? ` data-lente="${escapar(urlDaLente)}"` : '';
  return `<article class="evento" data-status="${evento.status}" data-assinatura="${escapar(evento.assinatura)}"${atributoDaLente}>
    <p class="evento__data"><span class="t-mono-xs evento__semana">${partes.diaDaSemanaCurto} · ${partes.mesCurto}</span><span class="t-h2 evento__dia" aria-hidden="true">${String(partes.dia).padStart(2, '0')}</span><span class="sr-only">${escapar(dataCurta)}</span><span class="t-mono-xs evento__hora">${partes.ano} · ${formatarHora(evento.inicio)}</span></p>
    <div class="evento__corpo"><${nivelDoTitulo} class="t-h3 evento__titulo">${escapar(evento.titulo)}</${nivelDoTitulo}>${montarArtistas(evento, 'evento')}</div>
    <div class="evento__palcos">${palcos}${montarSeloDaLinha(evento)}</div>
    <div class="evento__acao">${montarAcaoDaLinha(evento)}</div>
  </article>`;
}

function montarAcaoDoPoster(evento: EventoDeTela): string {
  if (evento.status === 'aberto' && evento.ingressoUrl) {
    const plataforma = NOME_DA_PLATAFORMA[evento.plataforma];
    return `<a class="btn btn--primario poster__cta" href="${escapar(evento.ingressoUrl)}" target="_blank" rel="noopener" data-pulso aria-label="${escapar(descreverCompra(evento))}">Comprar na ${plataforma}${ICONE_EXTERNO}</a><p class="t-mono-xs poster__apoio">Abre a ${plataforma} em nova aba</p>`;
  }
  if (evento.status === 'esgotado') {
    return `<span class="t-mono-xs poster__selo">Esgotado</span><span class="btn poster__cta poster__cta--off" aria-disabled="true">Ingressos esgotados</span><a class="link-texto t-body-s" href="${escapar(montarLinkDeMesas(evento))}" target="_blank" rel="noopener">Perguntar por mesas e camarotes<span class="sr-only"> (abre o WhatsApp)</span></a>`;
  }
  return '<span class="t-mono-xs poster__selo poster__selo--breve">Ingressos em breve</span><a class="link-texto t-body-s" href="#mesas">Ver mesas e camarotes</a>';
}

function montarPoster(evento: EventoDeTela): string {
  const partes = extrairPartesDaData(evento.inicio);
  const palcos = evento.palcos.length > 0 ? `<ul class="t-mono poster__palcos" role="list">${montarLuzesDosPalcos(evento)}</ul>` : '';
  return `<article class="poster-cena" aria-labelledby="titulo-destaque" data-status="${evento.status}">
    <div class="poster" data-poster>
      <div class="poster__reflexo" aria-hidden="true"></div>
      <p class="t-mono-xs poster__rotulo">Próxima data</p>
      <p class="poster__data"><span class="poster__dia" aria-hidden="true">${String(partes.dia).padStart(2, '0')}</span><span class="sr-only">${escapar(formatarDataDoCard(evento.inicio))}</span><span class="t-mono poster__mes">${partes.mesCurto} · ${partes.diaDaSemanaCurto} · ${partes.ano}</span><span class="t-mono-xs poster__hora">abertura ${formatarHora(evento.inicio)}</span></p>
      <div class="poster__corpo"><h2 class="t-h2 titulo-peso poster__titulo" id="titulo-destaque">${escapar(evento.titulo)}</h2>${montarArtistas(evento, 'poster')}${palcos}</div>
      <div class="poster__acao">${montarAcaoDoPoster(evento)}</div>
    </div>
  </article>`;
}

function chaveDoMes(iso: string): string {
  const { ano, mes } = extrairPartesDaData(iso);
  return `${ano}-${String(mes + 1).padStart(2, '0')}`;
}

function montarFiltroDeMeses(eventos: EventoDeTela[]): string {
  const meses = new Map<string, { curto: string; porExtenso: string }>();
  eventos.forEach((evento) => {
    const chave = chaveDoMes(evento.inicio);
    if (!meses.has(chave)) meses.set(chave, { curto: extrairPartesDaData(evento.inicio).mesCurto, porExtenso: formatarDataPorExtenso(evento.inicio).split(' de ')[1] ?? '' });
  });
  const botoes = [...meses].map(([chave, mes]) => `<button class="filtro__botao" type="button" data-mes="${chave}" data-mes-por-extenso="${escapar(mes.porExtenso)}" aria-pressed="false">${mes.curto}</button>`).join('');
  return `<div class="filtro" role="group" aria-label="Filtrar por mês" data-filtro><button class="filtro__botao" type="button" data-mes="todas" aria-pressed="true">Todas</button>${botoes}</div>`;
}

function lerReservaDeLentes(secao: HTMLElement): ReservaDeLentes {
  try {
    return JSON.parse(secao.dataset.lentesDeReserva ?? '{}') as ReservaDeLentes;
  } catch {
    return {};
  }
}

function alternarVisibilidade(elemento: Element | null, isVisivel: boolean): void {
  if (elemento instanceof HTMLElement) elemento.hidden = !isVisivel;
}

function isSemNovidade(assinaturaAtual: string | undefined, eventos: EventoDeTela[], isDemonstracao: boolean): boolean {
  if (eventos.length === 0 && isDemonstracao) return true;
  return assinaturaAtual === calcularAssinatura(eventos);
}

async function hidratarDatasDaHome(): Promise<void> {
  const secao = document.querySelector<HTMLElement>('[data-datas]');
  const lista = secao?.querySelector<HTMLElement>('[data-datas-lista]');
  if (!secao || !lista) return;
  const eventos = (await lerProximosUmaVez()).slice(0, LIMITE_DE_DATAS_DA_HOME);
  if (isSemNovidade(secao.dataset.assinatura, eventos, secao.dataset.demo === 'true')) return;
  const reserva = lerReservaDeLentes(secao);
  lista.innerHTML = eventos.map((evento) => `<li>${montarLinha(evento, 'h3', escolherUrlDaLente(evento, reserva))}</li>`).join('');
  secao.dataset.assinatura = calcularAssinatura(eventos);
  alternarVisibilidade(lista, eventos.length > 0);
  alternarVisibilidade(secao.querySelector('[data-datas-vazio]'), eventos.length === 0);
}

function montarConteudoDoCta(evento: EventoDeTela | undefined): { href: string; rotulo: string; descricao: string | null; icone: string } {
  if (!evento || !evento.ingressoUrl) return { href: '/programacao#agenda', rotulo: 'Ver programação', descricao: null, icone: ICONE_PIRAMIDE };
  return {
    href: evento.ingressoUrl,
    rotulo: `Ingressos · ${evento.titulo} · ${formatarDataCurta(evento.inicio)}`,
    descricao: descreverCompra(evento),
    icone: ICONE_EXTERNO,
  };
}

function aplicarNoCta(cta: HTMLAnchorElement, evento: EventoDeTela | undefined): void {
  const { href, rotulo, descricao, icone } = montarConteudoDoCta(evento);
  cta.href = href;
  cta.innerHTML = `<span class="btn__texto">${escapar(rotulo)}</span>${icone}`;
  if (descricao) {
    cta.setAttribute('aria-label', descricao);
    cta.target = '_blank';
    cta.rel = 'noopener';
    cta.dataset.evento = evento?.chave ?? '';
  } else {
    cta.removeAttribute('aria-label');
    cta.removeAttribute('target');
    cta.removeAttribute('rel');
    delete cta.dataset.evento;
  }
}

async function escolherEventoDoDestaque(): Promise<EventoDeTela | undefined> {
  const destaques = await buscarDestaquesDaHome();
  const destaqueAberto = destaques.find((evento) => evento.status === 'aberto');
  if (destaqueAberto) return destaqueAberto;
  return (await lerProximosUmaVez()).find((evento) => evento.status === 'aberto');
}

async function hidratarDestaqueDaHome(): Promise<void> {
  const botoes = document.querySelectorAll<HTMLAnchorElement>('a.abertura__cta[data-pulso], a.menu__cta[data-pulso]');
  if (botoes.length === 0) return;
  const evento = await escolherEventoDoDestaque();
  botoes.forEach((botao) => {
    if (botao.dataset.evento !== (evento?.chave ?? undefined)) aplicarNoCta(botao, evento);
  });
}

export async function iniciarEventosDaHome(): Promise<void> {
  if (!isPainelConfigurado) return;
  await aguardarOciosidade();
  await Promise.allSettled([hidratarDatasDaHome(), hidratarDestaqueDaHome()]);
}

export interface GanchosDaProgramacao {
  aoRenderizarPoster: () => void;
  aoRenderizarFiltro: () => void;
}

function renderizarPoster(slot: HTMLElement, destaque: EventoDeTela | undefined, ganchos: GanchosDaProgramacao): void {
  slot.innerHTML = destaque ? montarPoster(destaque) : '';
  alternarVisibilidade(slot, Boolean(destaque));
  alternarVisibilidade(document.querySelector('[data-programacao-vazio]'), !destaque);
  if (destaque) ganchos.aoRenderizarPoster();
}

function renderizarAgenda(demais: EventoDeTela[], limiteDoFiltro: number, ganchos: GanchosDaProgramacao): void {
  const agenda = document.querySelector<HTMLElement>('[data-agenda]');
  const lista = document.querySelector<HTMLElement>('[data-agenda-lista]');
  const areaDoFiltro = document.querySelector<HTMLElement>('[data-filtro-area]');
  if (!agenda || !lista || !areaDoFiltro) return;
  lista.innerHTML = demais
    .map((evento) => `<li class="evento-linha" data-mes-da-linha="${chaveDoMes(evento.inicio)}">${montarLinha(evento, 'h3', undefined)}</li>`)
    .join('');
  areaDoFiltro.innerHTML = demais.length > limiteDoFiltro ? montarFiltroDeMeses(demais) : '';
  agenda.querySelector('[data-selo-exemplo]')?.remove();
  alternarVisibilidade(agenda, demais.length > 0);
  if (demais.length > limiteDoFiltro) ganchos.aoRenderizarFiltro();
}

export async function iniciarEventosDaProgramacao(ganchos: GanchosDaProgramacao): Promise<void> {
  if (!isPainelConfigurado) return;
  const slot = document.querySelector<HTMLElement>('[data-poster-slot]');
  if (!slot) return;
  await aguardarOciosidade();
  try {
    const eventos = await lerProximosUmaVez();
    if (isSemNovidade(slot.dataset.assinatura, eventos, slot.dataset.demo === 'true')) return;
    const [destaque, ...demais] = eventos;
    renderizarPoster(slot, destaque, ganchos);
    renderizarAgenda(demais, Number(slot.dataset.limiteFiltro ?? 6), ganchos);
    slot.dataset.assinatura = calcularAssinatura(eventos);
  } catch {
    slot.dataset.painel = 'indisponivel';
  }
}
