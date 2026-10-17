import { getCollection, type CollectionEntry } from 'astro:content';
import { IS_DEMONSTRACAO } from '@/data/demonstracao';
import { buscarEventosPassados, buscarEventosProximos, isPainelConfigurado, type EventoDeTela, type ImagemPublica } from './painel';

export {
  extrairPartesDaData,
  formatarDataCurta,
  formatarDataDoCard,
  formatarDataPorExtenso,
  formatarHora,
} from './formato-evento';

export type Evento = CollectionEntry<'eventos'> & { assinatura?: string; flyer?: ImagemPublica; flyerHover?: ImagemPublica };
export type StatusDoEvento = Evento['data']['status'];

const NOME_DA_PLATAFORMA = { ingresse: 'Ingresse', blueticket: 'Blueticket', outra: 'plataforma oficial' } as const;

export function nomearPlataforma(evento: Evento): string {
  return NOME_DA_PLATAFORMA[evento.data.plataforma ?? 'outra'];
}

export function derivarStatus(evento: Evento, agora = new Date()): StatusDoEvento {
  const fim = new Date(evento.data.data_fim ?? evento.data.data_inicio);
  return fim < agora ? 'encerrado' : evento.data.status;
}

export function isIngressoAberto(evento: Evento): boolean {
  return derivarStatus(evento) === 'aberto' && !evento.data.exemplo && Boolean(evento.data.ingresso_url);
}

function converterParaEvento(evento: EventoDeTela): Evento {
  const data: Evento['data'] = {
    titulo: evento.titulo,
    data_inicio: evento.inicio,
    data_fim: evento.fim,
    artistas: evento.artistas,
    palcos: evento.palcos,
    plataforma: evento.plataforma,
    ingresso_url: evento.ingressoUrl,
    status: evento.status,
    exemplo: false,
  };
  return { id: evento.chave, collection: 'eventos', data, assinatura: evento.assinatura, flyer: evento.flyer, flyerHover: evento.flyerHover } as unknown as Evento;
}

async function carregarEventosDoPainel(): Promise<Evento[] | null> {
  if (!isPainelConfigurado) return null;
  try {
    const [proximos, passados] = await Promise.all([buscarEventosProximos(), buscarEventosPassados()]);
    const eventos = [...proximos, ...passados].map(converterParaEvento);
    return eventos.length === 0 && IS_DEMONSTRACAO ? null : eventos;
  } catch {
    return null;
  }
}

let eventosDoPainelEmCache: Promise<Evento[] | null> | undefined;

export async function listarEventos(): Promise<Evento[]> {
  eventosDoPainelEmCache ??= carregarEventosDoPainel();
  const doPainel = await eventosDoPainelEmCache;
  if (doPainel) return doPainel;
  const eventos = await getCollection('eventos');
  return IS_DEMONSTRACAO ? eventos : eventos.filter((evento) => !evento.data.exemplo);
}

export async function listarProximosEventos(): Promise<Evento[]> {
  const eventos = await listarEventos();
  return eventos
    .filter((evento) => derivarStatus(evento) !== 'encerrado')
    .sort((a, b) => Date.parse(a.data.data_inicio) - Date.parse(b.data.data_inicio));
}

export async function buscarProximoEventoAberto(): Promise<Evento | undefined> {
  const eventos = await listarProximosEventos();
  return eventos.find(isIngressoAberto);
}
