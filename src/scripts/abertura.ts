import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { CustomEase } from 'gsap/CustomEase';
import { EVENTO_DE_ABERTURA, marcarCarga, type DetalheDaAbertura } from './carga';
import { isAparelhoLimitado, lerBeatEmSegundos, prefereMenosMovimento, suportaWebGL2 } from './gl/motor';
import type { HeroLiquido } from './gl/hero';

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
CustomEase.create('olho', '0.83,0,0.17,1');

const ESCALAS_DE_ENTRADA = [2.2, 1.9, 1.6];
const ROTACOES_DE_ENTRADA = [-6, 4, -2];
const ESCALAS_CONCENTRICAS = [1, 1.08, 1.16];
const DESLOCAMENTOS_DO_SIMBOLO = [-24, 0, 24];
const ESPESSURA_DO_SIMBOLO = 12;
const UNIDADES_DO_VIEWBOX = 240;
const LARGURA_DO_SIMBOLO = 215;
const VELOCIDADE_DO_ECO = 800;

interface Elementos {
  secao: HTMLElement;
  midia: HTMLElement;
  foto: HTMLImageElement | null;
  canvas: HTMLCanvasElement | null;
  veu: HTMLElement | null;
  scrim: HTMLElement | null;
  titulo: HTMLElement;
  frase: HTMLElement;
  drop: HTMLElement | null;
  revelaveis: HTMLElement[];
  arcos: SVGSVGElement | null;
  ecos: SVGSVGElement[];
}

function coletarElementos(): Elementos | null {
  const secao = document.querySelector<HTMLElement>('[data-abertura]');
  const midia = secao?.querySelector<HTMLElement>('[data-abertura-midia]');
  const titulo = secao?.querySelector<HTMLElement>('.abertura__titulo');
  const frase = secao?.querySelector<HTMLElement>('[data-abertura-frase]');
  if (!secao || !midia || !titulo || !frase) return null;
  return {
    secao,
    midia,
    foto: midia.querySelector<HTMLImageElement>('[data-abertura-foto]'),
    canvas: midia.querySelector<HTMLCanvasElement>('[data-hero-liquido]'),
    veu: midia.querySelector<HTMLElement>('[data-abertura-veu]'),
    scrim: secao.querySelector<HTMLElement>('.abertura__scrim'),
    titulo,
    frase,
    drop: frase.querySelector<HTMLElement>('[data-abertura-drop]'),
    revelaveis: [...secao.querySelectorAll<HTMLElement>('[data-abertura-revela]')],
    arcos: secao.querySelector<SVGSVGElement>('[data-olho-arcos]'),
    ecos: [...secao.querySelectorAll<SVGSVGElement>('[data-olho-eco]')],
  };
}

function definirMascara(midia: HTMLElement, largura: number, altura: number): void {
  const tamanho = `${largura}px ${altura}px`;
  midia.style.setProperty('-webkit-mask-size', tamanho);
  midia.style.setProperty('mask-size', tamanho);
}

function ligarMascara(midia: HTMLElement, isLigada: boolean): void {
  const valor = isLigada ? 'var(--mascara-olho)' : 'none';
  midia.style.setProperty('-webkit-mask-image', valor);
  midia.style.setProperty('mask-image', valor);
}

function medirMascaraAberta(): { largura: number; altura: number } {
  const maior = Math.max(window.innerWidth, window.innerHeight);
  return { largura: maior * 4.2, altura: maior * 2.1 };
}

function aguardarOciosidade(): Promise<void> {
  return new Promise((resolver) => {
    const agendar = () => {
      if ('requestIdleCallback' in window) window.requestIdleCallback(() => resolver(), { timeout: 2500 });
      else setTimeout(resolver, 1200);
    };
    if (document.readyState === 'complete') agendar();
    else window.addEventListener('load', agendar, { once: true });
  });
}

async function iniciarHeroLiquido(elementos: Elementos): Promise<HeroLiquido | null> {
  const { canvas, foto, secao } = elementos;
  const concluirCarga = () => {
    marcarCarga('revelada');
    marcarCarga('gl');
  };
  if (!canvas || !foto || prefereMenosMovimento() || isAparelhoLimitado() || !suportaWebGL2()) {
    concluirCarga();
    return null;
  }
  await aguardarOciosidade();
  const isMobile = window.matchMedia(canvas.dataset.midiaMobile ?? '(max-width: 767px)').matches;
  const urls = ((isMobile ? canvas.dataset.reveladaMobile : canvas.dataset.reveladaDesktop) ?? '').split('|').filter(Boolean);
  try {
    const { criarHeroLiquido } = await import('./gl/hero');
    const hero = await criarHeroLiquido({ secao, canvas, imagem: foto, urlsDaRevelada: urls, aoCarregar: marcarCarga });
    if (!hero) concluirCarga();
    return hero;
  } catch {
    concluirCarga();
    return null;
  }
}

function revelarAposLoader(elementos: Elementos, aoTerminar: () => void): void {
  const { frase, drop, revelaveis } = elementos;
  const beat = lerBeatEmSegundos();
  let isRevelado = false;

  const revelar = (atraso: number) => {
    if (isRevelado) return;
    isRevelado = true;
    const divisao = SplitText.create(frase, { type: 'lines,words', mask: 'lines', aria: 'none' });
    divisao.lines.forEach((linha) => { (linha as HTMLElement).style.whiteSpace = 'nowrap'; });
    gsap.set(divisao.words, { yPercent: 110 });
    if (drop) gsap.set(drop, { fontWeight: 200 });
    gsap.set(revelaveis, { opacity: 0, y: 16 });
    gsap.timeline({
      delay: atraso,
      onComplete: () => {
        if (drop) drop.style.removeProperty('font-weight');
        divisao.revert();
        gsap.set(revelaveis, { clearProps: 'opacity,transform' });
        aoTerminar();
      },
    })
      .to(divisao.words, { yPercent: 0, duration: beat, ease: 'expo.out', stagger: beat / 8 }, 0)
      .to(drop, { fontWeight: 650, duration: beat, ease: 'power2.inOut' }, beat * 0.6)
      .to(revelaveis, { opacity: 1, y: 0, duration: beat, ease: 'expo.out', stagger: beat / 16 }, beat / 4);
  };

  window.addEventListener(EVENTO_DE_ABERTURA, (evento) => revelar(((evento as CustomEvent<DetalheDaAbertura>).detail?.duracao ?? beat * 2) / 4), { once: true });
  window.setTimeout(() => {
    if (!isRevelado) {
      isRevelado = true;
      aoTerminar();
    }
  }, 3200);
}

function prepararAneis(arcos: SVGSVGElement): { aneis: SVGGElement[]; tracos: SVGPathElement[]; pupila: SVGPolygonElement | null } {
  const aneis = [...arcos.querySelectorAll<SVGGElement>('.abertura__anel')];
  const tracos = aneis.map((anel) => anel.querySelector('path')).filter((traco): traco is SVGPathElement => Boolean(traco));
  const pupila = arcos.querySelector<SVGPolygonElement>('.abertura__pupila');
  return { aneis, tracos, pupila };
}

function definirAneisNaEntrada(aneis: SVGGElement[], tracos: SVGPathElement[], espessura: number): void {
  aneis.forEach((anel, indice) => {
    gsap.set(anel, { transformOrigin: '50% 50%', scale: ESCALAS_DE_ENTRADA[indice] ?? 1, rotation: ROTACOES_DE_ENTRADA[indice] ?? 0, y: 0, opacity: 0 });
  });
  tracos.forEach((traco, indice) => {
    gsap.set(traco, { strokeDasharray: 1, strokeDashoffset: 1, attr: { 'stroke-width': espessura / (ESCALAS_DE_ENTRADA[indice] ?? 1) } });
  });
}

function convergirAneis(linha: gsap.core.Timeline, aneis: SVGGElement[], tracos: SVGPathElement[], espessura: () => number, inicio: number, duracao: number): void {
  aneis.forEach((anel, indice) => {
    linha.to(anel, { scale: ESCALAS_CONCENTRICAS[indice] ?? 1, rotation: 0, opacity: 1, duration: duracao, ease: 'power2.out' }, inicio);
  });
  tracos.forEach((traco, indice) => {
    linha.to(traco, { strokeDashoffset: 0, attr: { 'stroke-width': () => espessura() / (ESCALAS_CONCENTRICAS[indice] ?? 1) }, duration: duracao, ease: 'power2.inOut' }, inicio);
  });
}

function empilharAneis(linha: gsap.core.Timeline, aneis: SVGGElement[], tracos: SVGPathElement[], espessura: () => number, pupila: SVGPolygonElement | null, inicio: number, duracao: number): void {
  aneis.forEach((anel, indice) => {
    linha.to(anel, { scale: 1, y: DESLOCAMENTOS_DO_SIMBOLO[indice] ?? 0, duration: duracao, ease: 'olho' }, inicio);
  });
  linha.to(tracos, { attr: { 'stroke-width': espessura }, duration: duracao, ease: 'olho' }, inicio);
  if (pupila) linha.fromTo(pupila, { transformOrigin: '50% 50%', y: -34, opacity: 0 }, { y: 0, opacity: 1, duration: duracao * 0.6, ease: 'back.out(1.6)' }, inicio + duracao * 0.4);
}

function sincronizarEcos(arcos: SVGSVGElement, ecos: SVGSVGElement[], gatilho: () => ScrollTrigger | undefined): () => void {
  if (ecos.length === 0) return () => undefined;
  const historico: string[] = [];
  const opacidades = ecos.map(() => 0);
  const ALVOS = [0.25, 0.12];
  const ATRASOS = [2, 4];
  const atualizar = () => {
    if (!gatilho()?.isActive) {
      historico.length = 0;
      ecos.forEach((eco) => { eco.style.opacity = '0'; });
      return;
    }
    historico.unshift(arcos.innerHTML + '§' + arcos.style.transform + '§' + arcos.style.opacity);
    historico.length = Math.min(historico.length, 5);
    const velocidade = Math.abs(gatilho()?.getVelocity() ?? 0);
    ecos.forEach((eco, indice) => {
      const alvo = velocidade > VELOCIDADE_DO_ECO ? (ALVOS[indice] ?? 0) : 0;
      opacidades[indice] = (opacidades[indice] ?? 0) + (alvo - (opacidades[indice] ?? 0)) * 0.12;
      const registro = historico[ATRASOS[indice] ?? 2];
      if (!registro || (opacidades[indice] ?? 0) < 0.005) {
        eco.style.opacity = '0';
        return;
      }
      const [conteudo, transformacao, opacidade] = registro.split('§');
      eco.innerHTML = conteudo ?? '';
      eco.style.transform = transformacao ?? '';
      eco.style.opacity = String((opacidades[indice] ?? 0) * Number(opacidade || 1));
    });
  };
  gsap.ticker.add(atualizar);
  return () => {
    gsap.ticker.remove(atualizar);
    ecos.forEach((eco) => { eco.style.opacity = '0'; });
  };
}

function ativarOlhoDeArcos(elementos: Elementos, hero: () => HeroLiquido | null): void {
  const { secao, midia, veu, scrim, titulo, revelaveis, arcos, ecos } = elementos;
  if (!arcos) return;
  const { aneis, tracos, pupila } = prepararAneis(arcos);
  const raiz = document.documentElement;
  const simboloDoCabecalho = document.querySelector<SVGSVGElement>('.cabecalho .cabecalho__simbolo');
  const midias = gsap.matchMedia();

  midias.add('(min-width: 1024px)', () => {
    if (!raiz.classList.contains('pin-ok')) return;
    const medida = { unidade: 1 };
    const mascara = { largura: 0, altura: 0 };
    const medir = () => {
      gsap.set(arcos, { clearProps: 'transform' });
      medida.unidade = arcos.getBoundingClientRect().width / UNIDADES_DO_VIEWBOX;
    };
    medir();
    const espessuraFina = () => 1.5 / medida.unidade;
    const alvoDoCabecalho = () => {
      const caixa = simboloDoCabecalho?.getBoundingClientRect();
      if (!caixa) return { x: 0, y: 0, escala: 0.1 };
      const centroX = caixa.left + ((250 - 142) / LARGURA_DO_SIMBOLO) * caixa.width;
      const centroY = caixa.top + ((97.3 - 15) / 164) * caixa.height;
      return {
        x: centroX - window.innerWidth / 2,
        y: centroY - window.innerHeight / 2,
        escala: caixa.width / LARGURA_DO_SIMBOLO / medida.unidade,
      };
    };

    definirAneisNaEntrada(aneis, tracos, espessuraFina());
    gsap.set(arcos, { opacity: 1 });
    if (pupila) gsap.set(pupila, { opacity: 0 });

    const linha = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: secao,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.6,
        invalidateOnRefresh: true,
        onRefreshInit: medir,
        onToggle: (gatilho) => { raiz.dataset.cabecalhoFixo = String(gatilho.isActive); },
        onUpdate: (gatilho) => {
          ligarMascara(midia, gatilho.progress > 0.001);
          hero()?.definirAtivo(gatilho.progress < 0.86);
        },
      },
    });

    linha
      .to([titulo, ...revelaveis], { opacity: 0, y: -48, duration: 0.2, stagger: 0.015, ease: 'power1.in' }, 0)
      .to(scrim, { opacity: 0, duration: 0.25 }, 0.1)
      .fromTo(mascara, { largura: () => medirMascaraAberta().largura, altura: () => medirMascaraAberta().altura }, {
        largura: () => window.innerWidth * 0.34,
        altura: () => window.innerWidth * 0.17,
        duration: 0.35,
        ease: 'power2.inOut',
        onUpdate: () => definirMascara(midia, mascara.largura, mascara.altura),
      }, 0)
      .to(mascara, {
        largura: () => 135 * medida.unidade,
        altura: () => 41 * medida.unidade,
        duration: 0.25,
        ease: 'olho',
        onUpdate: () => definirMascara(midia, mascara.largura, mascara.altura),
      }, 0.45)
      .to(veu, { opacity: 0.6, duration: 0.25 }, 0.45)
      .to(midia, { opacity: 0, duration: 0.15 }, 0.7);
    if (simboloDoCabecalho) linha.fromTo(simboloDoCabecalho, { opacity: 1 }, { opacity: 0, duration: 0.06, immediateRender: false }, 0.02);
    convergirAneis(linha, aneis, tracos, espessuraFina, 0.1, 0.35);
    empilharAneis(linha, aneis, tracos, espessuraFina, pupila, 0.45, 0.25);
    linha
      .to(arcos, {
        x: () => alvoDoCabecalho().x,
        y: () => alvoDoCabecalho().y,
        scale: () => alvoDoCabecalho().escala,
        duration: 0.3,
        ease: 'power2.inOut',
      }, 0.7)
      .to(tracos, { attr: { 'stroke-width': ESPESSURA_DO_SIMBOLO }, duration: 0.3, ease: 'power2.inOut' }, 0.7)
      .to(arcos, { opacity: 0, duration: 0.03 }, 0.97);
    if (simboloDoCabecalho) linha.to(simboloDoCabecalho, { opacity: 1, duration: 0.03 }, 0.97);

    const pararEcos = sincronizarEcos(arcos, ecos, () => linha.scrollTrigger);
    return () => {
      pararEcos();
      ligarMascara(midia, false);
      raiz.dataset.cabecalhoFixo = 'false';
      gsap.set([midia, veu, scrim, arcos, simboloDoCabecalho, titulo, ...revelaveis].filter(Boolean), { clearProps: 'all' });
    };
  });

  midias.add('(max-width: 1023.98px)', () => {
    const espessura = () => 1.5 / (arcos.getBoundingClientRect().width / UNIDADES_DO_VIEWBOX || 1);
    definirAneisNaEntrada(aneis, tracos, espessura());
    gsap.set(arcos, { opacity: 1 });
    if (pupila) gsap.set(pupila, { opacity: 0 });
    const linha = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: secao, start: 'top top', end: () => `+=${window.innerHeight * 0.6}`, scrub: true },
    });
    convergirAneis(linha, aneis, tracos, espessura, 0, 0.6);
    empilharAneis(linha, aneis, tracos, espessura, pupila, 0.6, 0.4);
    return () => gsap.set(arcos, { clearProps: 'all' });
  });
}

export function iniciarAbertura(): void {
  const elementos = coletarElementos();
  if (!elementos) return;
  const raiz = document.documentElement;
  if (prefereMenosMovimento()) {
    raiz.classList.remove('pin-ok');
    marcarCarga('revelada');
    marcarCarga('gl');
    return;
  }

  let hero: HeroLiquido | null = null;
  const promessaDoHero = iniciarHeroLiquido(elementos).then((resultado) => { hero = resultado; return resultado; });
  const ensinar = () => { void promessaDoHero.then((resultado) => resultado?.ensinarGesto()); };

  if (raiz.classList.contains('tem-loader')) {
    revelarAposLoader(elementos, () => {
      ensinar();
      ativarOlhoDeArcos(elementos, () => hero);
      ScrollTrigger.refresh();
    });
    return;
  }
  ativarOlhoDeArcos(elementos, () => hero);
}

