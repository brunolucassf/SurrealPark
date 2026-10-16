export type TarefaDeCarga = 'fontes' | 'hero' | 'revelada' | 'gl';

interface JanelaComCarga extends Window {
  surrealCarga?: Set<TarefaDeCarga>;
}

function lerConjunto(): Set<TarefaDeCarga> {
  const janela = window as JanelaComCarga;
  janela.surrealCarga ??= new Set();
  return janela.surrealCarga;
}

export function marcarCarga(tarefa: TarefaDeCarga): void {
  lerConjunto().add(tarefa);
}

export function isCarregado(tarefa: TarefaDeCarga): boolean {
  return lerConjunto().has(tarefa);
}

export const EVENTO_DE_ABERTURA = 'surreal:abertura';

export interface DetalheDaAbertura {
  duracao: number;
}
