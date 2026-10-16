export interface Produto {
  id: string;
  nome: string;
  precoEmCentavos: number;
  isEsgotado: boolean;
  href: string;
}

export const isLojaAtiva = false;

export const PRODUTOS: Produto[] = [];

export function formatarPreco(precoEmCentavos: number): string {
  return (precoEmCentavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
