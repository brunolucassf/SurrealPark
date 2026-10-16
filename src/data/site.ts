export const NOME_DO_SITE = 'Surreal Park';

export interface ItemDeNavegacao {
  rotulo: string;
  href: string;
}

export const NAVEGACAO: ItemDeNavegacao[] = [
  { rotulo: 'O Parque', href: '/o-parque' },
  { rotulo: 'Programação', href: '/programacao' },
  { rotulo: 'Galeria', href: '/galeria' },
  { rotulo: 'Contato', href: '/contato' },
  { rotulo: 'Loja', href: '/loja' },
];

export const ENDERECO = {
  logradouro: 'Av. João da Costa, 3051',
  bairro: 'Rio do Meio',
  cidade: 'Camboriú',
  estado: 'SC',
  cep: '88340-000',
  linha: 'Av. João da Costa, 3051, Rio do Meio, Camboriú-SC, 88340-000',
};

export const CONTATOS = {
  email: 'contato@surreal.art.br',
  telefoneMesas: '+55 47 8901-1563',
  whatsappMesas: '554789011563',
  whatsappLocacao: '5547984680168',
  emailLocacao: 'maitejanuario@surreal.art.br',
};

export interface RedeSocial {
  nome: 'Instagram' | 'YouTube' | 'TikTok';
  href: string;
}

export const REDES: RedeSocial[] = [
  { nome: 'Instagram', href: 'https://www.instagram.com/surreal.park/' },
  { nome: 'YouTube', href: 'https://www.youtube.com/channel/UCJ2sWMQuCfLnpa8D6lZ4HAg' },
  { nome: 'TikTok', href: 'https://www.tiktok.com/@surrealpark' },
];

export const RANKING_ATUAL = { posicao: 10, ano: 2026, rotulo: '#10 · DJ Mag Top 100 Clubs 2026' };

const MENSAGEM_MESAS = ['Olá, quero reservar mesa ou camarote no Surreal Park.', 'Data ou evento:', 'Número de pessoas:', 'Meu nome:'].join('\n');

export function criarLinkWhatsApp(numero: string, mensagem: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}

export const LINK_WHATSAPP_MESAS = criarLinkWhatsApp(CONTATOS.whatsappMesas, MENSAGEM_MESAS);

export const SUFIXO_NOVA_ABA = '(abre em nova aba)';

export const CREDITO_FONTE_DEV = { texto: 'Desenvolvido por Fonte Dev · Bruno Lucas', href: 'https://fontedev.com' };
