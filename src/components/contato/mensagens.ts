import { CONTATOS, ENDERECO, criarLinkWhatsApp } from '@/data/site';

const MENSAGEM_LOCACAO = [
  'Olá, quero falar sobre locação de espaço no Surreal Park.',
  'Tipo de evento:',
  'Data prevista:',
  'Público estimado:',
  'Empresa ou nome:',
].join('\n');

const ASSUNTO_LOCACAO = 'Locação · [tipo de evento] · [data prevista]';
const ENDERECO_PARA_BUSCA = encodeURIComponent(`${ENDERECO.logradouro}, ${ENDERECO.bairro}, ${ENDERECO.cidade}-${ENDERECO.estado}, ${ENDERECO.cep}`);

export const LINK_WHATSAPP_LOCACAO = criarLinkWhatsApp(CONTATOS.whatsappLocacao, MENSAGEM_LOCACAO);
export const LINK_EMAIL_LOCACAO = `mailto:${CONTATOS.emailLocacao}?subject=${encodeURIComponent(ASSUNTO_LOCACAO)}&body=${encodeURIComponent(MENSAGEM_LOCACAO)}`;
export const LINK_GOOGLE_MAPS = `https://www.google.com/maps/search/?api=1&query=${ENDERECO_PARA_BUSCA}`;
export const LINK_WAZE = `https://waze.com/ul?q=${ENDERECO_PARA_BUSCA}&navigate=yes`;
export const LINK_INSTAGRAM_LOCACAO = 'https://www.instagram.com/surrealpark.locacao/';

export const TELEFONE_LOCACAO = '(47) 98468-0168';

export const TIPOS_DE_EVENTO = ['Casamentos', 'Congressos', 'Lançamentos', 'Feiras', 'Formaturas', 'Eventos automotivos', 'Shows'];

interface EspacoDeLocacao {
  rotulo: string;
  capacidade: number;
  descricao?: string;
}

export const ESPACOS_DE_LOCACAO: EspacoDeLocacao[] = [8000, 4000, 3000, 1500, 1000, 1000].map((capacidade, indice) => ({
  rotulo: `Espaço ${indice + 1}`,
  capacidade,
}));
