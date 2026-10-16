import { EVENTO_DE_ABERTURA, isCarregado, marcarCarga, type DetalheDaAbertura, type TarefaDeCarga } from './carga';
import { CURVA_DE_SAIDA, CURVA_DO_DROP, CURVA_DO_OLHO } from './curvas';
import { lerBeatEmSegundos } from './gl/motor';

const CHAVE_DA_SESSAO = 'surreal:abertura';
const DESLOCAMENTOS = [-24, 0, 24];
const MEIA_LARGURA = 101;
const MEIA_ALTURA = 51.5;
const MAXIMO_DE_ECOS = 3;

type Fase = 'carga' | 'drop' | 'abertura' | 'fim';

function desenharAmendoa(centroY: number, alca: number, meiaLargura = MEIA_LARGURA): string {
  const controleX = meiaLargura * 0.564;
  return `M${-meiaLargura} ${centroY}C${-controleX} ${centroY - alca} ${controleX} ${centroY - alca} ${meiaLargura} ${centroY}C${controleX} ${centroY + alca} ${-controleX} ${centroY + alca} ${-meiaLargura} ${centroY}Z`;
}

function limitar(valor: number, minimo = 0, maximo = 1): number {
  return Math.min(Math.max(valor, minimo), maximo);
}

export function iniciarLoader(): void {
  const raiz = document.documentElement;
  const loader = document.querySelector<HTMLElement>('[data-loader]');
  if (!loader || !raiz.classList.contains('tem-loader')) return;
  const arcos = [...loader.querySelectorAll<SVGPathElement>('[data-loader-arco]')];
  const ecos = loader.querySelector<SVGGElement>('[data-loader-ecos]');
  const piramide = loader.querySelector<SVGPolygonElement>('[data-loader-piramide]');
  const simbolo = loader.querySelector<SVGSVGElement>('[data-loader-simbolo]');
  const contador = loader.querySelector<HTMLElement>('[data-loader-contador]');
  if (arcos.length !== 3 || !ecos || !piramide || !simbolo || !contador) return;

  try {
    sessionStorage.setItem(CHAVE_DA_SESSAO, '1');
  } catch {
    raiz.classList.remove('tem-loader');
    return;
  }
  loader.style.animation = 'none';

  const beat = lerBeatEmSegundos();
  const pesos = new Map<TarefaDeCarga, number>([['fontes', 0.15]]);
  if (document.querySelector('[data-carga-hero]')) pesos.set('hero', 0.85);
  const pesoTotal = [...pesos.values()].reduce((soma, peso) => soma + peso, 0);

  Promise.all([
    document.fonts.load('200 1em Kalnia'),
    document.fonts.load('650 1em Kalnia'),
    document.fonts.load('400 1em "Instrument Sans"'),
  ]).finally(() => marcarCarga('fontes'));
  const imagemDoHero = document.querySelector<HTMLImageElement>('[data-carga-hero]');
  if (imagemDoHero) imagemDoHero.decode().catch(() => undefined).finally(() => marcarCarga('hero'));

  const inicio = 0;
  const inicioDoDesenho = performance.now();
  let fase: Fase = 'carga';
  let inicioDaFase = inicio;
  let velocidade = 1;
  let valor = 0;
  let valorNoForcar = 0;
  let ultimoEco = 0;
  const ecosAtivos: { elemento: SVGPathElement; nascimento: number }[] = [];

  const lerProgressoReal = () => {
    let concluido = 0;
    pesos.forEach((peso, tarefa) => { if (isCarregado(tarefa)) concluido += peso; });
    return concluido / pesoTotal;
  };

  const mudarFase = (proxima: Fase, agora: number) => {
    fase = proxima;
    inicioDaFase = agora;
    if (proxima === 'abertura') {
      loader.style.pointerEvents = 'none';
      const detalhe: DetalheDaAbertura = { duracao: beat * 2 * velocidade };
      window.dispatchEvent(new CustomEvent(EVENTO_DE_ABERTURA, { detail: detalhe }));
    }
  };

  const pular = () => {
    if (fase !== 'carga') return;
    velocidade = 0.25;
    valor = 100;
    valorNoForcar = 100;
    mudarFase('abertura', performance.now());
  };
  const atalhos: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'wheel', 'touchmove'];
  atalhos.forEach((tipo) => window.addEventListener(tipo, pular, { passive: true }));

  const desenharArcos = (segundos: number, amplitude: number, fusao: number, desenho: number[]) => {
    arcos.forEach((arco, indice) => {
      const onda = 1 + amplitude * Math.sin((2 * Math.PI * segundos) / (beat * 2) + (indice * 2 * Math.PI) / 3);
      arco.setAttribute('d', desenharAmendoa((DESLOCAMENTOS[indice] ?? 0) * fusao, (MEIA_ALTURA / 0.75) * onda));
      arco.style.strokeDasharray = '1';
      arco.style.strokeDashoffset = String(1 - (desenho[indice] ?? 1));
    });
  };

  const emitirEco = (agora: number, alca: number) => {
    if (ecosAtivos.length >= MAXIMO_DE_ECOS) return;
    const elemento = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    elemento.setAttribute('d', desenharAmendoa(DESLOCAMENTOS[0] ?? 0, alca));
    ecos.append(elemento);
    ecosAtivos.push({ elemento, nascimento: agora });
  };

  const atualizarEcos = (agora: number) => {
    for (let indice = ecosAtivos.length - 1; indice >= 0; indice -= 1) {
      const eco = ecosAtivos[indice];
      if (!eco) continue;
      const progresso = (agora - eco.nascimento) / 1000 / beat;
      if (progresso >= 1) {
        eco.elemento.remove();
        ecosAtivos.splice(indice, 1);
        continue;
      }
      eco.elemento.setAttribute('transform', `translate(0 ${DESLOCAMENTOS[0]}) scale(${1 + 0.45 * CURVA_DE_SAIDA(progresso)}) translate(0 ${-(DESLOCAMENTOS[0] ?? 0)})`);
      eco.elemento.style.opacity = String(0.35 * (1 - progresso));
    }
  };

  const escreverContador = () => {
    const inteiro = Math.round(valor);
    contador.textContent = String(inteiro).padStart(3, '0');
    contador.style.fontWeight = String(Math.round(200 + 4.5 * inteiro));
  };

  const finalizar = () => {
    atalhos.forEach((tipo) => window.removeEventListener(tipo, pular));
    raiz.classList.remove('tem-loader');
    loader.remove();
  };

  const laco = (agora: number) => {
    const segundos = (agora - inicio) / 1000;
    const naFase = (agora - inicioDaFase) / 1000;
    const real = lerProgressoReal();
    const desenho = arcos.map((_, indice) => CURVA_DE_SAIDA(limitar(((agora - inicioDoDesenho) / 1000 - (indice * beat) / 8) / beat)));

    if (fase === 'carga') {
      const alvo = real * 100;
      const passo = Math.min((alvo - valor) * 0.15, 12);
      valor = Math.max(valor, Math.min(100, valor + Math.max(passo, alvo > valor ? 0.4 : 0)));
      if ((segundos >= beat * 2 && valor >= 99.5) || segundos >= beat * 3.5) {
        valorNoForcar = valor;
        mudarFase('drop', agora);
      }
      if (agora - ultimoEco >= beat * 1000 && segundos > beat) {
        ultimoEco = agora;
        emitirEco(agora, (MEIA_ALTURA / 0.75) * (1 + 0.1 + 0.12 * real));
      }
      desenharArcos(segundos, 0.1 + 0.12 * real, 1, desenho);
    } else if (fase === 'drop') {
      const duracao = (beat / 2) * velocidade;
      const progresso = limitar(naFase / duracao);
      valor = valorNoForcar + (100 - valorNoForcar) * CURVA_DE_SAIDA(limitar(progresso * 2));
      const suave = CURVA_DO_OLHO(progresso);
      desenharArcos(segundos, 0.22 * (1 - suave), 1 - suave, [1, 1, 1]);
      const saida = CURVA_DE_SAIDA(limitar(naFase / (duracao / 2)));
      contador.style.transform = `translateY(${-16 * saida}px)`;
      contador.parentElement?.style.setProperty('opacity', String(1 - saida));
      const queda = CURVA_DO_DROP(progresso);
      piramide.style.opacity = String(limitar(progresso * 2));
      piramide.setAttribute('transform', `translate(0 ${-40 * (1 - queda)})`);
      if (progresso >= 1) mudarFase('abertura', agora);
    } else if (fase === 'abertura') {
      const duracao = beat * 2 * velocidade;
      const progresso = limitar(naFase / duracao);
      const suave = CURVA_DO_OLHO(progresso);
      const vmin = Math.min(window.innerWidth, window.innerHeight) / 100;
      const vmax = Math.max(window.innerWidth, window.innerHeight) / 100;
      const largura = 22 * vmin + (420 * vmax - 22 * vmin) * suave;
      const altura = 11 * vmin + (210 * vmax - 11 * vmin) * suave;
      loader.style.setProperty('--furo', `${largura}px ${altura}px`);
      simbolo.style.transform = `scale(${1 + 0.6 * suave})`;
      simbolo.style.opacity = String(1 - limitar(progresso * 1.4));
      loader.querySelectorAll<HTMLElement>('.loader__local, .loader__carga').forEach((elemento) => { elemento.style.opacity = String(1 - limitar(progresso * 3)); });
      if (progresso >= 1) {
        fase = 'fim';
        finalizar();
        return;
      }
    }
    atualizarEcos(agora);
    escreverContador();
    requestAnimationFrame(laco);
  };

  if (performance.now() / 1000 >= beat * 3.5) {
    velocidade = 0.5;
    valor = 100;
    valorNoForcar = 100;
    mudarFase('drop', performance.now());
  }
  escreverContador();
  requestAnimationFrame(laco);
}
