import { isPainelConfigurado } from '@/lib/painel';
import { buscarConfiguracaoDeLeads, enviarLead, type ConfiguracaoDeLeads, type LeadParaEnvio, type TipoDeLead } from '@/lib/painel-publico';

const PADRAO_DE_TELEFONE = /^\+?[0-9 ()-]{8,20}$/;
const PADRAO_DE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TAMANHO_MINIMO_DA_MENSAGEM = 5;
const TAMANHO_MINIMO_DO_NOME = 2;
const SEGUNDOS_POR_MINUTO = 60;

const CAMPOS_DE_DETALHE: Record<TipoDeLead, { nome: string; isNumero: boolean }[]> = {
  mesa: [{ nome: 'pessoas', isNumero: true }],
  locacao: [{ nome: 'tipoEvento', isNumero: false }, { nome: 'dataPretendida', isNumero: false }, { nome: 'pessoas', isNumero: true }],
  contato: [{ nome: 'assunto', isNumero: false }],
};

const MENSAGEM_DE_FALHA = 'Não foi possível enviar agora. Tente de novo em instantes ou fale pelo WhatsApp ou pelo e-mail.';

let configuracaoEmAndamento: Promise<ConfiguracaoDeLeads> | undefined;

function carregarConfiguracao(isForcado = false): Promise<ConfiguracaoDeLeads> {
  if (isForcado || !configuracaoEmAndamento) {
    configuracaoEmAndamento = buscarConfiguracaoDeLeads();
    configuracaoEmAndamento.catch(() => { configuracaoEmAndamento = undefined; });
  }
  return configuracaoEmAndamento;
}

function lerCampo(formulario: HTMLFormElement, nome: string): HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null {
  return formulario.elements.namedItem(nome) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
}

function lerTexto(formulario: HTMLFormElement, nome: string): string {
  return lerCampo(formulario, nome)?.value.trim() ?? '';
}

function lerMarcacao(formulario: HTMLFormElement, nome: string): boolean {
  return (lerCampo(formulario, nome) as HTMLInputElement | null)?.checked ?? false;
}

function lerDetalhes(formulario: HTMLFormElement, tipo: TipoDeLead): Record<string, string | number> {
  const detalhes: Record<string, string | number> = {};
  CAMPOS_DE_DETALHE[tipo].forEach(({ nome, isNumero }) => {
    const valor = lerTexto(formulario, nome);
    if (!valor) return;
    detalhes[nome] = isNumero ? Number(valor) : valor;
  });
  return detalhes;
}

function limparErros(formulario: HTMLFormElement): void {
  formulario.querySelectorAll<HTMLElement>('[data-erro]').forEach((erro) => {
    erro.hidden = true;
    erro.textContent = '';
  });
  formulario.querySelectorAll('[aria-invalid]').forEach((campo) => {
    campo.removeAttribute('aria-invalid');
    campo.removeAttribute('aria-describedby');
  });
}

function marcarErro(formulario: HTMLFormElement, nomeDoCampo: string, mensagem: string): HTMLElement | null {
  const campo = lerCampo(formulario, nomeDoCampo);
  const erro = campo ? document.getElementById(`${campo.id}-erro`) : null;
  if (!campo || !erro) return null;
  erro.textContent = mensagem;
  erro.hidden = false;
  campo.setAttribute('aria-invalid', 'true');
  campo.setAttribute('aria-describedby', erro.id);
  return campo;
}

function validar(formulario: HTMLFormElement, tipo: TipoDeLead): HTMLElement[] {
  const invalidos: (HTMLElement | null)[] = [];
  if (lerTexto(formulario, 'nome').length < TAMANHO_MINIMO_DO_NOME) invalidos.push(marcarErro(formulario, 'nome', 'Informe seu nome.'));
  if (!PADRAO_DE_EMAIL.test(lerTexto(formulario, 'email'))) invalidos.push(marcarErro(formulario, 'email', 'Informe um e-mail válido, como nome@email.com.'));
  const telefone = lerTexto(formulario, 'telefone');
  if (telefone && !PADRAO_DE_TELEFONE.test(telefone)) invalidos.push(marcarErro(formulario, 'telefone', 'Use só números, espaços, parênteses e hífen. Ex.: (47) 99999-9999.'));
  CAMPOS_DE_DETALHE[tipo].filter((campo) => campo.isNumero).forEach(({ nome }) => {
    const campo = lerCampo(formulario, nome) as HTMLInputElement | null;
    if (campo?.value && !campo.checkValidity()) invalidos.push(marcarErro(formulario, nome, `Informe um número entre ${campo.min} e ${campo.max}.`));
  });
  if (lerTexto(formulario, 'mensagem').length < TAMANHO_MINIMO_DA_MENSAGEM) invalidos.push(marcarErro(formulario, 'mensagem', 'Escreva uma mensagem com pelo menos 5 caracteres.'));
  if (!lerMarcacao(formulario, 'consentimento')) invalidos.push(marcarErro(formulario, 'consentimento', 'Para enviar, marque a autorização de contato.'));
  return invalidos.filter((campo): campo is HTMLElement => campo !== null);
}

function anunciar(status: HTMLElement, mensagem: string, isErro: boolean): void {
  status.textContent = mensagem;
  status.dataset.estado = isErro ? 'erro' : 'info';
}

function aplicarConfiguracao(formulario: HTMLFormElement, configuracao: ConfiguracaoDeLeads): void {
  const textoConsentimento = formulario.querySelector<HTMLElement>('[data-texto-consentimento]');
  const blocoMarketing = formulario.querySelector<HTMLElement>('[data-bloco-marketing]');
  const textoMarketing = formulario.querySelector<HTMLElement>('[data-texto-marketing]');
  if (textoConsentimento) textoConsentimento.textContent = configuracao.textoConsentimento;
  if (textoMarketing) textoMarketing.textContent = configuracao.textoMarketing;
  if (blocoMarketing) blocoMarketing.hidden = configuracao.textoMarketing.trim() === '';
  formulario.dataset.versaoTexto = configuracao.versaoTexto;
  formulario.querySelector<HTMLButtonElement>('[data-enviar]')?.removeAttribute('disabled');
}

function mostrarConfiguracaoIndisponivel(formulario: HTMLFormElement): void {
  const status = formulario.querySelector<HTMLElement>('[data-lead-status]');
  const texto = formulario.querySelector<HTMLElement>('[data-texto-consentimento]');
  if (texto) texto.textContent = 'Texto de consentimento indisponível no momento.';
  if (status) anunciar(status, 'O formulário está indisponível agora. Fale pelo WhatsApp ou pelo e-mail.', true);
}

async function prepararFormulario(formulario: HTMLFormElement): Promise<void> {
  try {
    aplicarConfiguracao(formulario, await carregarConfiguracao());
  } catch {
    mostrarConfiguracaoIndisponivel(formulario);
  }
}

function montarLead(formulario: HTMLFormElement, tipo: TipoDeLead): LeadParaEnvio {
  return {
    tipo,
    nome: lerTexto(formulario, 'nome'),
    email: lerTexto(formulario, 'email'),
    telefone: lerTexto(formulario, 'telefone') || null,
    mensagem: lerTexto(formulario, 'mensagem'),
    consentimento: { aceito: true, versaoTexto: formulario.dataset.versaoTexto ?? '' },
    marketing: lerMarcacao(formulario, 'marketing'),
    origem: formulario.dataset.origem ?? tipo,
    website: lerTexto(formulario, 'website'),
    detalhes: lerDetalhes(formulario, tipo),
  };
}

function lerCodigoDeErro(corpo: unknown): string {
  return typeof corpo === 'object' && corpo !== null && typeof (corpo as { codigo?: unknown }).codigo === 'string' ? (corpo as { codigo: string }).codigo : '';
}

function descreverEspera(segundos: number | null): string {
  if (!segundos) return 'Muitas tentativas. Aguarde um pouco e tente de novo.';
  const minutos = Math.ceil(segundos / SEGUNDOS_POR_MINUTO);
  return `Muitas tentativas. Tente de novo em cerca de ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}.`;
}

async function tratarTextoDesatualizado(formulario: HTMLFormElement, status: HTMLElement): Promise<void> {
  try {
    aplicarConfiguracao(formulario, await carregarConfiguracao(true));
    const consentimento = lerCampo(formulario, 'consentimento') as HTMLInputElement | null;
    if (consentimento) consentimento.checked = false;
    anunciar(status, 'O texto de consentimento foi atualizado. Leia e marque a autorização de novo para enviar.', true);
    consentimento?.focus();
  } catch {
    anunciar(status, MENSAGEM_DE_FALHA, true);
  }
}

async function tratarFalhaDoEnvio(formulario: HTMLFormElement, status: HTMLElement, resposta: Awaited<ReturnType<typeof enviarLead>>): Promise<void> {
  const codigo = lerCodigoDeErro(resposta.corpo);
  if (codigo === 'texto_desatualizado') return tratarTextoDesatualizado(formulario, status);
  if (resposta.status === 429) return anunciar(status, descreverEspera(resposta.esperarSegundos), true);
  if (resposta.status === 422) return anunciar(status, 'Algum dado não foi aceito. Confira os campos e tente de novo.', true);
  anunciar(status, MENSAGEM_DE_FALHA, true);
}

function mostrarSucesso(detalhes: HTMLElement, formulario: HTMLFormElement): void {
  const sucesso = detalhes.querySelector<HTMLElement>('[data-lead-sucesso]');
  formulario.reset();
  formulario.hidden = true;
  if (!sucesso) return;
  sucesso.hidden = false;
  sucesso.focus();
}

function ligarEnvio(detalhes: HTMLElement, formulario: HTMLFormElement): void {
  const tipo = (formulario.dataset.tipo ?? 'contato') as TipoDeLead;
  const status = formulario.querySelector<HTMLElement>('[data-lead-status]');
  const botao = formulario.querySelector<HTMLButtonElement>('[data-enviar]');
  if (!status || !botao) return;

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (formulario.getAttribute('aria-busy') === 'true') return;
    limparErros(formulario);
    anunciar(status, '', false);
    const invalidos = validar(formulario, tipo);
    if (invalidos.length > 0) {
      anunciar(status, invalidos.length === 1 ? 'Há 1 campo para corrigir.' : `Há ${invalidos.length} campos para corrigir.`, true);
      invalidos[0]?.focus();
      return;
    }
    formulario.setAttribute('aria-busy', 'true');
    botao.disabled = true;
    anunciar(status, 'Enviando…', false);
    try {
      const resposta = await enviarLead(montarLead(formulario, tipo), crypto.randomUUID());
      if (resposta.ok) mostrarSucesso(detalhes, formulario);
      else await tratarFalhaDoEnvio(formulario, status, resposta);
    } catch {
      anunciar(status, MENSAGEM_DE_FALHA, true);
    } finally {
      formulario.removeAttribute('aria-busy');
      botao.disabled = !formulario.dataset.versaoTexto;
    }
  });
}

export function iniciarFormulariosDeLead(): void {
  if (!isPainelConfigurado) return;
  document.querySelectorAll<HTMLElement>('[data-lead-detalhes]').forEach((detalhes) => {
    const formulario = detalhes.querySelector<HTMLFormElement>('[data-lead-form]');
    if (!formulario) return;
    ligarEnvio(detalhes, formulario);
    detalhes.addEventListener('toggle', () => {
      if (detalhes instanceof HTMLDetailsElement && detalhes.open && !formulario.dataset.versaoTexto) void prepararFormulario(formulario);
    });
  });
}
