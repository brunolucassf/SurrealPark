const DEBOUNCE_EM_MS = 300;
const SELETOR_DE_FORMULARIO = '[data-lead-form]';
const SELETOR_DE_INPUT = '[data-cupom-input]';
const SELETOR_DE_BOTAO = '[data-cupom-validar]';
const SELETOR_DE_RESPOSTA = '[data-cupom-resposta]';
const SELETOR_DE_CPF = 'input[name="cpf"]';

interface RespostaDaValidacao {
  valido: boolean;
  motivo?: string;
  descontoCentavos?: number;
  percentual?: number;
  codigo?: string;
  nome?: string;
}

const MENSAGENS: Record<string, string> = {
  nao_encontrado: 'Cupom não encontrado. Confira o código.',
  pausado: 'Este cupom está pausado.',
  expirado: 'Este cupom já expirou.',
  esgotado: 'Este cupom já atingiu o limite de uso.',
  inativo: 'Este cupom não está ativo.',
};

function formatarCentavos(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function descrever(resposta: RespostaDaValidacao): string {
  if (!resposta.valido) return MENSAGENS[resposta.motivo ?? ''] ?? 'Cupom inválido.';
  if (typeof resposta.percentual === 'number') return `Cupom OK · ${resposta.percentual}% off`;
  if (typeof resposta.descontoCentavos === 'number') return `Cupom OK · ${formatarCentavos(resposta.descontoCentavos)} off`;
  return 'Cupom OK.';
}

function aplicarEstado(elemento: HTMLElement, texto: string, valido: boolean): void {
  elemento.textContent = texto;
  elemento.dataset.estado = valido ? 'ok' : 'erro';
}

function limpar(elemento: HTMLElement): void {
  elemento.textContent = '';
  delete elemento.dataset.estado;
}

async function validar(formulario: HTMLFormElement, codigo: string): Promise<void> {
  const resposta = formulario.querySelector<HTMLElement>(SELETOR_DE_RESPOSTA);
  const input = formulario.querySelector<HTMLInputElement>(SELETOR_DE_INPUT);
  if (!resposta || !input) return;
  const normalizado = codigo.trim().toUpperCase();
  if (normalizado === '') { limpar(resposta); return; }
  input.value = normalizado;
  const cpf = (formulario.querySelector<HTMLInputElement>(SELETOR_DE_CPF)?.value ?? '').replace(/\D+/g, '');
  const url = new URL(`/api/publico/v1/cupons/${encodeURIComponent(normalizado)}/validar`, window.location.origin);
  if (cpf.length === 11) url.searchParams.set('visitanteCpf', cpf);
  try {
    const respostaHttp = await fetch(url, { credentials: 'omit', headers: { Accept: 'application/json' } });
    if (!respostaHttp.ok) { aplicarEstado(resposta, 'Não foi possível validar agora.', false); return; }
    const corpo = (await respostaHttp.json()) as RespostaDaValidacao;
    aplicarEstado(resposta, descrever(corpo), Boolean(corpo.valido));
  } catch {
    aplicarEstado(resposta, 'Não foi possível validar agora.', false);
  }
}

function iniciar(formulario: HTMLFormElement): void {
  if (formulario.dataset.cupomIniciado === 'sim') return;
  const input = formulario.querySelector<HTMLInputElement>(SELETOR_DE_INPUT);
  const botao = formulario.querySelector<HTMLButtonElement>(SELETOR_DE_BOTAO);
  if (!input || !botao) return;
  formulario.dataset.cupomIniciado = 'sim';
  let cron: ReturnType<typeof setTimeout> | null = null;
  input.addEventListener('input', () => {
    if (cron) clearTimeout(cron);
    cron = setTimeout(() => void validar(formulario, input.value), DEBOUNCE_EM_MS);
  });
  botao.addEventListener('click', () => void validar(formulario, input.value));
}

function ligarMascaraDeCpf(formulario: HTMLFormElement): void {
  const cpf = formulario.querySelector<HTMLInputElement>('input[name="cpf"]');
  if (!cpf || cpf.dataset.mascaraLigada === 'sim') return;
  cpf.dataset.mascaraLigada = 'sim';
  cpf.addEventListener('input', () => {
    const digitos = cpf.value.replace(/\D+/g, '').slice(0, 11);
    let formatado = digitos;
    if (digitos.length > 3) formatado = `${digitos.slice(0, 3)}.${digitos.slice(3)}`;
    if (digitos.length > 6) formatado = `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}`;
    if (digitos.length > 9) formatado = `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9, 11)}`;
    cpf.value = formatado;
  });
}

export function iniciarValidadoresDeCupom(): void {
  document.querySelectorAll<HTMLFormElement>(SELETOR_DE_FORMULARIO).forEach((formulario) => {
    if (formulario.querySelector(SELETOR_DE_INPUT)) iniciar(formulario);
    if (formulario.querySelector(SELETOR_DE_CPF)) ligarMascaraDeCpf(formulario);
  });
}
