import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { CustomEase } from 'gsap/CustomEase';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { FORMAS_DA_PREVIA } from '@/data/formas';
import { lerBeatEmSegundos } from './gl/motor';

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase, MorphSVGPlugin);
CustomEase.create('olho', '0.83,0,0.17,1');

const prefereMenosMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isPonteiroFino = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1024px)').matches;

const BEAT = lerBeatEmSegundos();

function revelarAoEntrar(): void {
  document.querySelectorAll<HTMLElement>('[data-revela-titulo]').forEach((titulo) => {
    const divisao = SplitText.create(titulo, { type: 'lines,words', mask: 'lines', aria: 'auto' });
    gsap.set(divisao.words, { yPercent: 110 });
    ScrollTrigger.create({
      trigger: titulo,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.to(divisao.words, {
          yPercent: 0,
          duration: BEAT,
          ease: 'expo.out',
          stagger: BEAT / 8,
          onComplete: () => divisao.revert(),
        });
      },
    });
  });

  document.querySelectorAll<HTMLElement>('[data-revela]').forEach((elemento) => {
    gsap.set(elemento, { opacity: 0, y: 12 });
    ScrollTrigger.create({
      trigger: elemento,
      start: 'top 90%',
      once: true,
      onEnter: () => gsap.to(elemento, { opacity: 1, y: 0, duration: BEAT, ease: 'expo.out', clearProps: 'transform' }),
    });
  });
}

function seguirComLente(): void {
  const lente = document.querySelector<HTMLElement>('[data-lente-flutuante]');
  const imagem = lente?.querySelector('img');
  const lista = document.querySelector<HTMLElement>('[data-datas]');
  if (!lente || !imagem || !lista) return;
  const alvo = { x: 0, y: 0 };
  const atual = { x: 0, y: 0 };
  let quadro = 0;

  const animar = () => {
    atual.x += (alvo.x - atual.x) * 0.12;
    atual.y += (alvo.y - atual.y) * 0.12;
    lente.style.transform = `translate3d(${atual.x}px, ${atual.y}px, 0)`;
    quadro = Math.abs(alvo.x - atual.x) + Math.abs(alvo.y - atual.y) > 0.5 ? requestAnimationFrame(animar) : 0;
  };

  lista.addEventListener('pointermove', (evento) => {
    const linha = (evento.target as HTMLElement).closest<HTMLElement>('[data-lente]');
    const url = linha?.dataset.lente;
    if (!url) {
      lente.dataset.visivel = 'false';
      return;
    }
    if (lente.dataset.visivel !== 'true') {
      atual.x = evento.clientX + 140;
      atual.y = evento.clientY;
    }
    if (imagem.getAttribute('src') !== url) imagem.setAttribute('src', url);
    alvo.x = evento.clientX + 140;
    alvo.y = evento.clientY;
    lente.dataset.visivel = 'true';
    if (!quadro) quadro = requestAnimationFrame(animar);
  });
  lista.addEventListener('pointerleave', () => { lente.dataset.visivel = 'false'; });
}

function animarAscensao(): void {
  const secao = document.querySelector<HTMLElement>('[data-ascensao]');
  const trilho = secao?.querySelector<HTMLElement>('[data-ascensao-trilho]');
  const grafico = secao?.querySelector<HTMLElement>('[data-ascensao-grafico]');
  const cena = secao?.querySelector<HTMLElement>('[data-ascensao-cena]');
  const ganho = secao?.querySelector<HTMLElement>('[data-ascensao-ganho]');
  const fonte = secao?.querySelector<HTMLElement>('[data-ascensao-fonte]');
  const posicoes = secao?.querySelector<HTMLElement>('.ascensao__posicoes') ?? null;
  if (!secao || !trilho || !grafico || !cena || !ganho) return;

  const guias = [...secao.querySelectorAll<HTMLElement>('[data-ascensao-guia]')];
  const colunas = [...secao.querySelectorAll<HTMLElement>('[data-coluna]')];
  const arcos = [...secao.querySelectorAll<SVGPathElement>('[data-coluna-arcos] path')];
  const valorFinal = Number(ganho.textContent?.replace(/\D/g, '') || 0);
  const partes = colunas.map((coluna) => ({
    barra: coluna.querySelector<HTMLElement>('[data-coluna-barra]'),
    reflexo: coluna.querySelector<HTMLElement>('[data-coluna-reflexo]'),
    rank: coluna.querySelector<HTMLElement>('[data-coluna-rank]'),
    topo: coluna.querySelector<HTMLElement>('.coluna__topo'),
    variacao: coluna.querySelector<HTMLElement>('[data-coluna-variacao]'),
    nota: coluna.querySelector<HTMLElement>('.coluna__nota'),
    ano: coluna.querySelector<HTMLElement>('.coluna__ano'),
  }));

  const escreverRank = (elemento: HTMLElement | null, valor: number) => {
    if (elemento) elemento.textContent = `#${Math.round(valor)}`;
  };
  const escreverGanho = (valor: number) => {
    ganho.textContent = `+${Math.round(valor)}`;
    ganho.style.fontWeight = String(Math.round(200 + (450 * valor) / Math.max(valorFinal, 1)));
  };

  const montarLinha = (duracaoDaColuna: number, intervalo: number, inicioDasColunas: number) => {
    const linha = gsap.timeline({ defaults: { ease: 'none' } });
    linha.fromTo(guias, { scaleX: 0 }, { scaleX: 1, duration: inicioDasColunas, stagger: inicioDasColunas / 10, ease: 'power2.out' }, 0);
    linha.fromTo(partes.map((parte) => parte.ano), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: inicioDasColunas, stagger: inicioDasColunas / 10 }, 0);
    partes.forEach((parte, indice) => {
      const inicio = inicioDasColunas + indice * intervalo;
      const alvo = Number(parte.rank?.dataset.colunaRank ?? 100);
      const contador = { valor: 100 };
      linha.fromTo([parte.barra, parte.reflexo], { scaleY: 0 }, { scaleY: 1, duration: duracaoDaColuna, ease: 'power2.out' }, inicio);
      linha.fromTo(parte.topo, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: duracaoDaColuna * 0.6, ease: 'power2.out' }, inicio);
      linha.fromTo(contador, { valor: 100 }, { valor: alvo, duration: duracaoDaColuna, ease: 'power2.out', onUpdate: () => escreverRank(parte.rank, contador.valor) }, inicio);
      if (parte.variacao) linha.fromTo(parte.variacao, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: duracaoDaColuna * 0.4 }, inicio + duracaoDaColuna);
      if (parte.nota) linha.fromTo(parte.nota, { opacity: 0 }, { opacity: 1, duration: duracaoDaColuna * 0.4 }, inicio + duracaoDaColuna);
    });
    const fimDasColunas = inicioDasColunas + (partes.length - 1) * intervalo + duracaoDaColuna;
    const contadorDoGanho = { valor: 0 };
    linha.fromTo([ganho, posicoes], { opacity: 0 }, { opacity: 1, duration: duracaoDaColuna * 0.3 }, fimDasColunas);
    linha.fromTo(contadorDoGanho, { valor: 0 }, { valor: valorFinal, duration: duracaoDaColuna, ease: 'power2.out', onUpdate: () => escreverGanho(contadorDoGanho.valor) }, fimDasColunas);
    linha.fromTo(arcos, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: duracaoDaColuna, stagger: duracaoDaColuna / 8, ease: 'power2.inOut' }, fimDasColunas);
    if (fonte) linha.fromTo(fonte, { opacity: 0 }, { opacity: 1, duration: duracaoDaColuna * 0.5 }, fimDasColunas);
    return linha;
  };

  const restaurar = () => {
    partes.forEach((parte) => escreverRank(parte.rank, Number(parte.rank?.dataset.colunaRank ?? 0)));
    escreverGanho(valorFinal);
    gsap.set([...guias, ...partes.flatMap((parte) => [parte.barra, parte.reflexo, parte.topo, parte.variacao, parte.nota, parte.ano]), ...arcos, fonte, cena, ganho, posicoes].filter(Boolean), { clearProps: 'all' });
    ganho.style.removeProperty('font-weight');
  };

  const midias = gsap.matchMedia();
  midias.add('(min-width: 1024px)', () => {
    if (!document.documentElement.classList.contains('pin-ok')) return;
    const linha = montarLinha(0.12, 0.14, 0.15);
    const fechamentos = partes.map((_, indice) => 0.15 + indice * 0.14 + 0.12);
    const gatilho = ScrollTrigger.create({
      trigger: trilho,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
      animation: linha,
      snap: { snapTo: [0, ...fechamentos, 1], duration: { min: 0.2, max: 0.6 }, ease: 'power2.inOut' },
    });
    const inclinacao = { alvo: 0, atual: 0 };
    let quadro = 0;
    const animarInclinacao = () => {
      inclinacao.atual += (inclinacao.alvo - inclinacao.atual) * 0.08;
      grafico.style.transform = `rotateX(8deg) rotateY(${inclinacao.atual.toFixed(2)}deg)`;
      quadro = Math.abs(inclinacao.alvo - inclinacao.atual) > 0.01 ? requestAnimationFrame(animarInclinacao) : 0;
    };
    grafico.style.transform = 'rotateX(8deg)';
    const mover = (evento: PointerEvent) => {
      if (!isPonteiroFino) return;
      inclinacao.alvo = ((evento.clientX / window.innerWidth) * 2 - 1) * 4;
      if (!quadro) quadro = requestAnimationFrame(animarInclinacao);
    };
    secao.addEventListener('pointermove', mover);
    return () => {
      secao.removeEventListener('pointermove', mover);
      cancelAnimationFrame(quadro);
      gatilho.kill();
      linha.kill();
      grafico.style.removeProperty('transform');
      restaurar();
    };
  });

  midias.add('(max-width: 1023.98px)', () => {
    const linha = montarLinha(BEAT, BEAT / 2, BEAT).pause();
    const gatilho = ScrollTrigger.create({ trigger: grafico, start: 'top 80%', once: true, onEnter: () => { linha.play(); } });
    return () => {
      gatilho.kill();
      linha.kill();
      restaurar();
    };
  });
}

function lerCorDaLuz(id: string): string | null {
  const valor = getComputedStyle(document.documentElement).getPropertyValue(`--luz-${id}`).trim();
  return valor || null;
}

function animarCartaz(): void {
  const secao = document.querySelector<HTMLElement>('[data-cartaz]');
  const previa = secao?.querySelector<HTMLElement>('[data-cartaz-previa]');
  const lista = secao?.querySelector<HTMLElement>('[data-cartaz-lista]');
  if (!secao || !previa || !lista) return;
  const links = [...secao.querySelectorAll<HTMLAnchorElement>('[data-cartaz-palco]')];
  const avisarFundo = (id: string | null) => window.dispatchEvent(new CustomEvent('surreal:luz-palco', { detail: id && id !== 'jet-set' ? lerCorDaLuz(id) : null }));
  links.forEach((link) => {
    link.addEventListener('pointerenter', () => avisarFundo(link.dataset.cartazPalco ?? null));
    link.addEventListener('focus', () => avisarFundo(link.dataset.cartazPalco ?? null));
  });
  lista.addEventListener('pointerleave', () => avisarFundo(null));
  if (!isPonteiroFino) return;

  const quadros = new Map([...previa.querySelectorAll<HTMLElement>('[data-cartaz-quadro]')].map((quadro) => [quadro.dataset.cartazQuadro, quadro]));
  const mascara = document.querySelector<SVGPathElement>('[data-cartaz-mascara]');
  const inclinacao = previa.querySelector<HTMLElement>('[data-cartaz-inclinacao]');
  const lampadas = [...previa.querySelectorAll<SVGCircleElement>('[data-cartaz-lampadas] circle')];
  const corpoDoAviao = previa.querySelector<SVGGElement>('[data-cartaz-aviao-corpo]');
  const tracosDoAviao = corpoDoAviao ? [...corpoDoAviao.querySelectorAll<SVGPathElement>('path')] : [];
  const janelas = corpoDoAviao ? [...corpoDoAviao.querySelectorAll<SVGCircleElement>('[data-janela]')] : [];
  let ativo = '';
  let morfose: gsap.core.Tween | null = null;
  let lampadasAcesas: gsap.core.Tween | null = null;
  let taxiamento: gsap.core.Timeline | null = null;

  const acenderLampadas = () => {
    lampadasAcesas?.kill();
    gsap.set(lampadas, { opacity: 0 });
    lampadasAcesas = gsap.to(lampadas, {
      opacity: 1,
      duration: BEAT / 4,
      ease: 'power1.out',
      delay: (indice) => Number(lampadas[indice]?.dataset.ordem ?? 0) * (BEAT / 8) * 0.5,
    });
  };

  const decolarAviao = () => {
    if (!corpoDoAviao) return;
    taxiamento?.kill();
    taxiamento = gsap.timeline()
      .fromTo(tracosDoAviao, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: BEAT * 2, ease: 'expo.out', stagger: BEAT / 16 }, 0)
      .fromTo(janelas, { fill: '#2B292F' }, { fill: '#E6BD6E', duration: BEAT / 4, stagger: BEAT / 16 }, BEAT / 2)
      .fromTo(corpoDoAviao, { xPercent: -4, rotation: -1.5, transformOrigin: '50% 50%' }, { xPercent: 0, rotation: 0, duration: BEAT * 2, ease: 'expo.out' }, 0);
  };

  const ativar = (id: string | undefined) => {
    if (!id || id === ativo) return;
    ativo = id;
    if (id === 'jet-set') {
      previa.dataset.modo = 'aviao';
      decolarAviao();
      return;
    }
    previa.dataset.modo = 'forma';
    quadros.forEach((elemento, chave) => { elemento.dataset.ativo = String(chave === id); });
    previa.style.setProperty('--luz-ativa', `var(--luz-${id})`);
    const destino = FORMAS_DA_PREVIA[id];
    if (mascara && destino) {
      morfose?.kill();
      morfose = prefereMenosMovimento
        ? gsap.set(mascara, { attr: { d: destino } })
        : gsap.to(mascara, { morphSVG: { shape: destino, shapeIndex: 'auto' }, duration: BEAT * 2, ease: 'olho' });
    }
    if (id === 'raw-room') acenderLampadas();
    else gsap.to(lampadas, { opacity: 0, duration: BEAT / 4 });
  };

  let alvoY = 0;
  let atualY = 0;
  const giro = { x: 0, y: 0, alvoX: 0, alvoY: 0, ultimoX: 0, ultimoY: 0, tempo: 0 };
  let quadro = 0;
  const animar = () => {
    atualY += (alvoY - atualY) * 0.08;
    giro.x += (giro.alvoX - giro.x) * 0.1;
    giro.y += (giro.alvoY - giro.y) * 0.1;
    giro.alvoX *= 0.9;
    giro.alvoY *= 0.9;
    previa.style.transform = `translate3d(0, ${atualY.toFixed(1)}px, 0)`;
    if (inclinacao) inclinacao.style.transform = `rotateX(${giro.x.toFixed(2)}deg) rotateY(${giro.y.toFixed(2)}deg)`;
    const isParado = Math.abs(alvoY - atualY) < 0.5 && Math.abs(giro.x) < 0.02 && Math.abs(giro.y) < 0.02 && Math.abs(giro.alvoX) < 0.02 && Math.abs(giro.alvoY) < 0.02;
    quadro = isParado ? 0 : requestAnimationFrame(animar);
  };
  const acordar = () => { if (!quadro && !prefereMenosMovimento) quadro = requestAnimationFrame(animar); };
  const posicionar = (centroY: number) => {
    const caixaDaLista = lista.getBoundingClientRect();
    const alturaDaPrevia = previa.getBoundingClientRect().height;
    alvoY = Math.min(Math.max(centroY - caixaDaLista.top - alturaDaPrevia / 2, 0), Math.max(caixaDaLista.height - alturaDaPrevia, 0));
    acordar();
  };

  lista.addEventListener('pointermove', (evento) => {
    const agora = performance.now();
    const dt = Math.max(agora - giro.tempo, 8) / 1000;
    const velocidadeX = (evento.clientX - giro.ultimoX) / dt;
    const velocidadeY = (evento.clientY - giro.ultimoY) / dt;
    if (giro.tempo) {
      giro.alvoY = Math.max(-8, Math.min(8, velocidadeX / 120));
      giro.alvoX = Math.max(-5, Math.min(5, -velocidadeY / 160));
    }
    giro.ultimoX = evento.clientX;
    giro.ultimoY = evento.clientY;
    giro.tempo = agora;
    acordar();
  });

  ativar('ritual');
  links.forEach((link) => {
    const mostrar = () => {
      ativar(link.dataset.cartazPalco);
      const caixa = link.getBoundingClientRect();
      posicionar(caixa.top + caixa.height / 2);
    };
    link.addEventListener('pointerenter', mostrar);
    link.addEventListener('focus', mostrar);
  });
}

function deslizarAmostra(): void {
  const tira = document.querySelector<HTMLElement>('[data-amostra-tira]');
  const secao = document.querySelector<HTMLElement>('[data-amostra]');
  if (!tira || !secao) return;
  gsap.matchMedia().add('(min-width: 1024px)', () => {
    gsap.fromTo(tira, { xPercent: 2 }, { xPercent: -4, ease: 'none', scrollTrigger: { trigger: secao, start: 'top bottom', end: 'bottom top', scrub: 0.6 } });
  });
}

function ativarCopiaDeNumero(): void {
  const toast = document.querySelector<HTMLElement>('[data-toast]');
  let temporizador = 0;
  document.querySelectorAll<HTMLButtonElement>('[data-copiar]').forEach((botao) => {
    botao.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(botao.dataset.copiar ?? '');
        if (!toast) return;
        toast.textContent = 'Número copiado.';
        toast.dataset.visivel = 'true';
        window.clearTimeout(temporizador);
        temporizador = window.setTimeout(() => { toast.dataset.visivel = 'false'; }, 3000);
      } catch {
        window.location.href = `tel:${(botao.dataset.copiar ?? '').replace(/[^\d+]/g, '')}`;
      }
    });
  });
}

export function iniciarHome(): void {
  ativarCopiaDeNumero();
  if (prefereMenosMovimento) return;
  revelarAoEntrar();
  seguirComLente();
  animarAscensao();
  animarCartaz();
  deslizarAmostra();
}
