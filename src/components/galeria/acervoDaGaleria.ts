import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import manifesto from '@/assets/manifest.json';
import { buscarImagemPorArquivo } from '@/lib/fotos';
import { lerEventosDaGaleria, type EventoDaGaleria } from '@/data/eventosDaGaleria';

export interface FotoDaGaleria {
  id: string;
  arquivo: string;
  ambiente: string;
  nomeDoAmbiente: string;
  alt: string;
  legenda: string;
  fotografo: string | null;
  imagem: ImageMetadata;
  isPaisagem: boolean;
  grande: { src: string; largura: number; altura: number };
}

export interface EventoResolvido extends EventoDaGaleria {
  dataPorExtenso: string;
  dataCurta: string;
  nomesDosAmbientes: string[];
  capaResolvida: { id: string; arquivo: string; imagem: ImageMetadata } | null;
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

export async function carregarEventosResolvidos(): Promise<EventoResolvido[]> {
  const eventos = await lerEventosDaGaleria();
  return eventos.map((evento) => {
    const { curta, porExtenso } = formatarData(evento.data);
    return {
      ...evento,
      dataCurta: curta,
      dataPorExtenso: porExtenso,
      nomesDosAmbientes: [...new Set(evento.ambientes.map(nomearAmbiente))],
      capaResolvida: resolverCapa(evento.capa),
      totalDeFotos: contarFotosDisponiveis(evento.fotos),
    };
  });
}

export async function carregarFotosDoEvento(evento: EventoDaGaleria): Promise<FotoDaGaleria[]> {
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
        isPaisagem: imagem.width / imagem.height > PROPORCAO_PAISAGEM,
        grande: { src: grande.src, largura: Number(grande.attributes.width), altura: Number(grande.attributes.height) },
      };
    }),
  );
  return fotos;
}
