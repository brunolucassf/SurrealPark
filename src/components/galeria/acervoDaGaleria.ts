import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import manifesto from '@/assets/manifest.json';
import { buscarImagemPorArquivo } from '@/lib/fotos';
import { lerEventosDaGaleria, type EventoDaGaleria } from '@/data/eventosDaGaleria';
import { IS_DEMONSTRACAO } from '@/data/demonstracao';
import { isPainelConfigurado, type ImagemPublica } from '@/lib/painel';
import { buscarFotosDaGaleria, buscarGalerias, type FotoPublica, type GaleriaPublica } from '@/lib/painel-publico';

export interface FotoRemota { imagem: ImagemPublica; miniatura: ImagemPublica }

export interface FotoDaGaleria {
  id: string;
  arquivo: string;
  ambiente: string;
  nomeDoAmbiente: string;
  alt: string;
  legenda: string;
  fotografo: string | null;
  imagem: ImageMetadata | null;
  remota: FotoRemota | null;
  isPaisagem: boolean;
  grande: { src: string; largura: number; altura: number };
}

export interface EventoResolvido extends EventoDaGaleria {
  dataPorExtenso: string;
  dataCurta: string;
  nomesDosAmbientes: string[];
  capaResolvida: { id: string; arquivo: string; imagem: ImageMetadata } | null;
  capaRemota: ImagemPublica | null;
  fotosRemotas: FotoPublica[];
  isDoPainel: boolean;
  totalDeFotos: number;
}

interface EntradaDoAcervo {
  id: string;
  arquivo: string;
  ambiente: string;
  alt: string;
  fotografo: string | null;
}

const NOMES_DOS_AMBIENTES: Record<string, string> = {
  ritual: 'Ritual',
  bells: 'Bells',
  'raw-room': 'Raw Room',
  nomad: 'Nomad',
  church: 'Church',
  jardim: 'Jardim',
  crepusculo: 'Jardim',
  juistreet: 'Juistreet',
  loja: 'Loja',
};

const LARGURA_DO_LIGHTBOX = 1680;
const PROPORCAO_PAISAGEM = 1.15;
const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MESES_POR_EXTENSO = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

const acervo = manifesto as EntradaDoAcervo[];

function buscarEntrada(id: string): EntradaDoAcervo | undefined {
  return acervo.find((entrada) => entrada.id === id);
}

function nomearAmbiente(chave: string): string {
  return NOMES_DOS_AMBIENTES[chave] ?? chave;
}

function formatarData(dataIso: string): { curta: string; porExtenso: string } {
  const [ano = '', mes = '1', dia = '1'] = dataIso.split('-');
  const indiceDoMes = Number(mes) - 1;
  return {
    curta: `${Number(dia)} ${MESES_CURTOS[indiceDoMes]} ${ano}`,
    porExtenso: `${Number(dia)} de ${MESES_POR_EXTENSO[indiceDoMes]} de ${ano}`,
  };
}

function contarFotosDisponiveis(ids: string[]): number {
  return ids.filter((id) => {
    const entrada = buscarEntrada(id);
    return entrada && buscarImagemPorArquivo(entrada.arquivo);
  }).length;
}

function resolverCapa(id: string): EventoResolvido['capaResolvida'] {
  const entrada = buscarEntrada(id);
  const imagem = entrada ? buscarImagemPorArquivo(entrada.arquivo) : undefined;
  return entrada && imagem ? { id: entrada.id, arquivo: entrada.arquivo, imagem } : null;
}

function resolverEventoLocal(evento: EventoDaGaleria): EventoResolvido {
  const { curta, porExtenso } = formatarData(evento.data);
  return {
    ...evento,
    dataCurta: curta,
    dataPorExtenso: porExtenso,
    nomesDosAmbientes: [...new Set(evento.ambientes.map(nomearAmbiente))],
    capaResolvida: resolverCapa(evento.capa),
    capaRemota: null,
    fotosRemotas: [],
    isDoPainel: false,
    totalDeFotos: contarFotosDisponiveis(evento.fotos),
  };
}

async function resolverEventoDoPainel(galeria: GaleriaPublica): Promise<EventoResolvido> {
  const fotosRemotas = await buscarFotosDaGaleria(galeria.slug);
  const data = galeria.evento?.dataEvento ?? galeria.atualizadoEm.slice(0, 10);
  const { curta, porExtenso } = formatarData(data);
  return {
    slug: galeria.slug,
    titulo: galeria.titulo,
    data,
    ambientes: [],
    capa: '',
    fotos: [],
    isExemplo: false,
    dataCurta: curta,
    dataPorExtenso: porExtenso,
    nomesDosAmbientes: [],
    capaResolvida: null,
    capaRemota: galeria.capa ?? fotosRemotas[0]?.imagem ?? null,
    fotosRemotas,
    isDoPainel: true,
    totalDeFotos: fotosRemotas.length,
  };
}

async function carregarEventosDoPainel(): Promise<EventoResolvido[] | null> {
  if (!isPainelConfigurado) return null;
  try {
    const galerias = await buscarGalerias();
    if (galerias.length === 0 && IS_DEMONSTRACAO) return null;
    const eventos = await Promise.all(galerias.map(resolverEventoDoPainel));
    return eventos.filter((evento) => evento.totalDeFotos > 0).sort((a, b) => b.data.localeCompare(a.data));
  } catch {
    return null;
  }
}

let eventosResolvidosEmCache: Promise<EventoResolvido[]> | undefined;

async function resolverEventos(): Promise<EventoResolvido[]> {
  const doPainel = await carregarEventosDoPainel();
  if (doPainel) return doPainel;
  return (await lerEventosDaGaleria()).map(resolverEventoLocal);
}

export function carregarEventosResolvidos(): Promise<EventoResolvido[]> {
  eventosResolvidosEmCache ??= resolverEventos();
  return eventosResolvidosEmCache;
}

function converterFotoRemota(foto: FotoPublica, indice: number, total: number, evento: EventoResolvido): FotoDaGaleria {
  const alt = foto.imagem.alt || `${evento.titulo}: foto ${indice + 1} de ${total}`;
  return {
    id: foto.id,
    arquivo: '',
    ambiente: '',
    nomeDoAmbiente: '',
    alt,
    legenda: alt,
    fotografo: foto.credito,
    imagem: null,
    remota: { imagem: foto.imagem, miniatura: foto.miniatura },
    isPaisagem: foto.imagem.largura / foto.imagem.altura > PROPORCAO_PAISAGEM,
    grande: { src: foto.imagem.url, largura: foto.imagem.largura, altura: foto.imagem.altura },
  };
}

export async function carregarFotosDoEvento(evento: EventoResolvido): Promise<FotoDaGaleria[]> {
  if (evento.isDoPainel) return evento.fotosRemotas.map((foto, indice) => converterFotoRemota(foto, indice, evento.fotosRemotas.length, evento));
  const disponiveis = evento.fotos
    .map(buscarEntrada)
    .filter((entrada): entrada is EntradaDoAcervo => Boolean(entrada))
    .flatMap((entrada) => {
      const imagem = buscarImagemPorArquivo(entrada.arquivo);
      return imagem ? [{ entrada, imagem }] : [];
    });
  const totalDisponivel = contarFotosDisponiveis(evento.fotos);

  const fotos = await Promise.all(
    disponiveis.map(async ({ entrada, imagem }, indice): Promise<FotoDaGaleria> => {
      const ordem = indice + 1;
      const nomeDoAmbiente = nomearAmbiente(entrada.ambiente);
      const isAltRascunho = /rascunho/i.test(entrada.alt);
      const grande = await getImage({ src: imagem, width: Math.min(LARGURA_DO_LIGHTBOX, imagem.width), format: 'avif', quality: 60 });
      return {
        id: entrada.id,
        arquivo: entrada.arquivo,
        ambiente: entrada.ambiente,
        nomeDoAmbiente,
        alt: isAltRascunho ? `${evento.titulo}, ${nomeDoAmbiente}: foto ${ordem} de ${totalDisponivel}` : entrada.alt,
        legenda: isAltRascunho ? nomeDoAmbiente : `${nomeDoAmbiente}: ${entrada.alt}`,
        fotografo: entrada.fotografo,
        imagem,
        remota: null,
        isPaisagem: imagem.width / imagem.height > PROPORCAO_PAISAGEM,
        grande: { src: grande.src, largura: Number(grande.attributes.width), altura: Number(grande.attributes.height) },
      };
    }),
  );
  return fotos;
}
