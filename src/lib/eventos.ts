import { getCollection, type CollectionEntry } from 'astro:content';

export type Evento = CollectionEntry<'eventos'>;
export type StatusDoEvento = Evento['data']['status'];

const FUSO = 'America/Sao_Paulo';

const NOME_DA_PLATAFORMA = { ingresse: 'Ingresse', blueticket: 'Blueticket', outra: 'plataforma oficial' } as const;

const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MESES_POR_EXTENSO = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

interface PartesDaData { diaDaSemana: number; dia: number; mes: number; ano: number; hora: number; minuto: number }

function extrairPartes(iso: string): PartesDaData {
  const formatador = new Intl.DateTimeFormat('en-US', {
    timeZone: FUSO, weekday: 'short', day: 'numeric', month: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
  });
  const partes = Object.fromEntries(formatador.formatToParts(new Date(iso)).map((parte) => [parte.type, parte.value]));
  const semana = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(partes.weekday ?? '');
  return { diaDaSemana: semana, dia: Number(partes.day), mes: Number(partes.month) - 1, ano: Number(partes.year), hora: Number(partes.hour), minuto: Number(partes.minute) };
}

export function extrairPartesDaData(iso: string): PartesDaData & { diaDaSemanaCurto: string; mesCurto: string } {
  const partes = extrairPartes(iso);
  return { ...partes, diaDaSemanaCurto: DIAS[partes.diaDaSemana] ?? '', mesCurto: MESES[partes.mes] ?? '' };
}

export function formatarDataDoCard(iso: string): string {
  const { diaDaSemana, dia, mes, ano } = extrairPartes(iso);
  return `${DIAS[diaDaSemana]} · ${dia} ${MESES[mes]} ${ano}`;
}

export function formatarDataCurta(iso: string): string {
  const { dia, mes } = extrairPartes(iso);
  return `${dia} ${MESES[mes]}`;
}

export function formatarDataPorExtenso(iso: string): string {
  const { dia, mes } = extrairPartes(iso);
  return `${dia} de ${MESES_POR_EXTENSO[mes]}`;
}

export function formatarHora(iso: string): string {
  const { hora, minuto } = extrairPartes(iso);
  return minuto ? `${hora}h${String(minuto).padStart(2, '0')}` : `${hora}h`;
}

export function nomearPlataforma(evento: Evento): string {
  return NOME_DA_PLATAFORMA[evento.data.plataforma ?? 'outra'];
}

export function derivarStatus(evento: Evento, agora = new Date()): StatusDoEvento {
  const fim = new Date(evento.data.data_fim ?? evento.data.data_inicio);
  return fim < agora ? 'encerrado' : evento.data.status;
}

export function isIngressoAberto(evento: Evento): boolean {
  return derivarStatus(evento) === 'aberto' && Boolean(evento.data.ingresso_url);
}

export async function listarProximosEventos(): Promise<Evento[]> {
  const eventos = await getCollection('eventos');
  return eventos
    .filter((evento) => derivarStatus(evento) !== 'encerrado')
    .sort((a, b) => Date.parse(a.data.data_inicio) - Date.parse(b.data.data_inicio));
}

export async function buscarProximoEventoAberto(): Promise<Evento | undefined> {
  const eventos = await listarProximosEventos();
  return eventos.find(isIngressoAberto);
}
