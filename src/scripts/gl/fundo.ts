import { FUNDO, HUMORES, type Humor } from './constantes';
import {
  RUIDO_GLSL,
  converterHexEmRgb,
  criarContexto,
  criarPrograma,
  criarTrianguloDeTela,
  desenharTela,
  isAparelhoLimitado,
  lerBeatEmSegundos,
  prefereMenosMovimento,
  suportaWebGL2,
} from './motor';

const FRAGMENTO = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 corFinal;
uniform vec2 uResolucao;
uniform float uTempo;
uniform float uRolagem;
uniform float uPulso;
uniform vec3 uBase;
uniform vec3 uLuz1Cor;
uniform vec2 uLuz1Pos;
uniform float uLuz1Raio;
uniform float uLuz1Int;
uniform vec3 uLuz2Cor;
uniform vec2 uLuz2Pos;
uniform float uLuz2Raio;
uniform float uLuz2Int;
uniform float uNevoa;
uniform float uClaro;
uniform vec3 uTeto;
uniform vec3 uPiso;
${RUIDO_GLSL}
float iluminar(vec2 uv, vec2 posicao, float raio, float aspecto) {
  vec2 d = (uv - posicao) * vec2(aspecto, 1.0);
  float distancia = length(d) / max(raio, 0.001);
  return exp(-distancia * distancia * 1.6);
}
void main() {
  float aspecto = uResolucao.x / uResolucao.y;
  vec2 uv = vUv;
  vec2 q = vec2(uv.x * aspecto, uv.y) * 1.6 + vec2(0.0, uRolagem * 0.35) + vec2(uTempo * 0.012, uTempo * 0.006);
  vec2 dobra = vec2(fbm2(q + uTempo * 0.02), fbm2(q + vec2(5.2, 1.3) - uTempo * 0.015));
  float nevoa = fbm2(q + dobra * 1.4);
  float l1 = iluminar(uv, uLuz1Pos, uLuz1Raio, aspecto) * uLuz1Int;
  float l2 = iluminar(uv, uLuz2Pos, uLuz2Raio, aspecto) * uLuz2Int;
  float modulacao = mix(1.0, 0.35 + nevoa * 1.3, uNevoa);
  vec2 direcao = normalize((uv - uLuz1Pos) * vec2(aspecto, 1.0) + 1e-4);
  float angulo = atan(direcao.y, direcao.x);
  float raios = pow(0.5 + 0.5 * sin(angulo * 9.0 + nevoa * 4.0 + uTempo * 0.05), 12.0) * 0.04 * nevoa * smoothstep(1.6, 0.1, length((uv - uLuz1Pos) * vec2(aspecto, 1.0)));
  vec3 luz = uLuz1Cor * (l1 * modulacao + raios + l1 * uPulso) + uLuz2Cor * l2 * modulacao;
  vec3 cor = mix(uBase + luz * 0.42, uBase - (vec3(1.0) - uLuz1Cor) * l1 * 0.06 - (vec3(1.0) - uLuz2Cor) * l2 * 0.05 + luz * 0.05, uClaro);
  cor += (hash12(gl_FragCoord.xy + uTempo) - 0.5) / 255.0;
  cor = mix(min(cor, uTeto), max(cor, uPiso), uClaro);
  corFinal = vec4(cor, 1.0);
}`;

interface EstadoDeHumor {
  base: [number, number, number];
  luz1Cor: [number, number, number];
  luz1Pos: [number, number];
  luz1Raio: number;
  luz1Int: number;
  luz2Cor: [number, number, number];
  luz2Pos: [number, number];
  luz2Raio: number;
  luz2Int: number;
  nevoa: number;
  claro: number;
}

function converterHumor(humor: Humor, corDoPalco?: string | null): EstadoDeHumor {
  let luz1Cor = converterHexEmRgb(humor.luz1.cor);
  if (corDoPalco) {
    const palco = converterHexEmRgb(corDoPalco);
    luz1Cor = luz1Cor.map((canal, indice) => canal * (1 - FUNDO.misturaDaLuzDoPalco) + (palco[indice] ?? 0) * FUNDO.misturaDaLuzDoPalco) as [number, number, number];
  }
  return {
    base: converterHexEmRgb(humor.base),
    luz1Cor,
    luz1Pos: humor.luz1.posicao,
    luz1Raio: humor.luz1.raio,
    luz1Int: humor.luz1.intensidade,
    luz2Cor: converterHexEmRgb(humor.luz2.cor),
    luz2Pos: humor.luz2.posicao,
    luz2Raio: humor.luz2.raio,
    luz2Int: humor.luz2.intensidade,
    nevoa: humor.nevoa,
    claro: humor.isClaro ? 1 : 0,
  };
}

function interpolarEstado(atual: EstadoDeHumor, alvo: EstadoDeHumor, fator: number): void {
  const misturar = (a: number, b: number) => a + (b - a) * fator;
  (['base', 'luz1Cor', 'luz2Cor'] as const).forEach((chave) => {
    atual[chave] = atual[chave].map((valor, indice) => misturar(valor, alvo[chave][indice] ?? valor)) as [number, number, number];
  });
  (['luz1Pos', 'luz2Pos'] as const).forEach((chave) => {
    atual[chave] = atual[chave].map((valor, indice) => misturar(valor, alvo[chave][indice] ?? valor)) as [number, number];
  });
  (['luz1Raio', 'luz1Int', 'luz2Raio', 'luz2Int', 'nevoa', 'claro'] as const).forEach((chave) => {
    atual[chave] = misturar(atual[chave], alvo[chave]);
  });
}

function aplicarFallbackCss(humor: Humor, corDoPalco?: string | null): void {
  const raiz = document.documentElement;
  raiz.style.setProperty('--humor-base', humor.base);
  raiz.style.setProperty('--humor-luz1', corDoPalco ?? humor.luz1.cor);
  raiz.style.setProperty('--humor-luz2', humor.luz2.cor);
}

export function iniciarFundoVivo(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-fundo-vivo]');
  const secoes = [...document.querySelectorAll<HTMLElement>('[data-humor]')];
  if (!canvas || secoes.length === 0) return;
  const raiz = document.documentElement;
  const isReduzido = prefereMenosMovimento();
  const isMobile = window.matchMedia('(max-width: 1023.98px)').matches;
  const beat = lerBeatEmSegundos();

  let humorAtual = secoes[0]?.dataset.humor ?? 'datas';
  let corDoPalco: string | null = null;
  const lerHumor = () => HUMORES[humorAtual] ?? HUMORES.datas!;

  const usarFallback = () => {
    raiz.classList.add('fundo-css');
    raiz.classList.remove('fundo-gl');
    aplicarFallbackCss(lerHumor(), corDoPalco);
  };

  const visiveis = new Set<HTMLElement>();
  let aoMudar: () => void = () => aplicarFallbackCss(lerHumor(), corDoPalco);

  const observadorDoCentro = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (!entrada.isIntersecting) return;
      humorAtual = (entrada.target as HTMLElement).dataset.humor ?? humorAtual;
      aoMudar();
    });
  }, { rootMargin: '-50% 0px -50% 0px' });
  const observadorDeVisibilidade = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      const secao = entrada.target as HTMLElement;
      if (entrada.isIntersecting) visiveis.add(secao);
      else visiveis.delete(secao);
    });
    retomar();
  });
  secoes.forEach((secao) => {
    observadorDoCentro.observe(secao);
    observadorDeVisibilidade.observe(secao);
  });
  window.addEventListener('surreal:luz-palco', (evento) => {
    corDoPalco = (evento as CustomEvent<string | null>).detail;
    aoMudar();
  });

  if (!suportaWebGL2() || isAparelhoLimitado()) {
    usarFallback();
    return;
  }
  const gl = criarContexto(canvas, { alpha: false, powerPreference: 'low-power' });
  if (!gl) {
    usarFallback();
    return;
  }

  let programa;
  try {
    programa = criarPrograma(gl, FRAGMENTO);
  } catch {
    usarFallback();
    return;
  }
  const vao = criarTrianguloDeTela(gl);
  raiz.classList.add('fundo-gl');

  const estado = converterHumor(lerHumor(), corDoPalco);
  let alvo = converterHumor(lerHumor(), corDoPalco);
  let escala = isMobile ? FUNDO.escalaMobile : FUNDO.escalaDesktop;
  let quadro = 0;
  let isPar = false;
  let anterior = 0;
  let isPausadoPorEstado = false;
  const intervalos: number[] = [];
  const inicio = performance.now();

  const ajustarTamanho = () => {
    const largura = Math.max(1, Math.round(window.innerWidth * escala));
    const altura = Math.max(1, Math.round(window.innerHeight * escala));
    if (canvas.width !== largura || canvas.height !== altura) {
      canvas.width = largura;
      canvas.height = altura;
    }
  };

  const desenhar = (segundos: number) => {
    ajustarTamanho();
    gl.viewport(0, 0, canvas.width, canvas.height);
    programa.usar();
    const fase = (segundos / beat) % 1;
    gl.uniform2f(programa.uniform('uResolucao'), canvas.width, canvas.height);
    gl.uniform1f(programa.uniform('uTempo'), isReduzido ? 0 : segundos);
    gl.uniform1f(programa.uniform('uRolagem'), isReduzido ? 0 : window.scrollY / window.innerHeight);
    gl.uniform1f(programa.uniform('uPulso'), isReduzido ? 0 : Math.pow(0.5 + 0.5 * Math.cos(2 * Math.PI * fase), 6) * 0.04);
    gl.uniform3fv(programa.uniform('uBase'), estado.base);
    gl.uniform3fv(programa.uniform('uLuz1Cor'), estado.luz1Cor);
    gl.uniform2fv(programa.uniform('uLuz1Pos'), estado.luz1Pos);
    gl.uniform1f(programa.uniform('uLuz1Raio'), estado.luz1Raio);
    gl.uniform1f(programa.uniform('uLuz1Int'), estado.luz1Int);
    gl.uniform3fv(programa.uniform('uLuz2Cor'), estado.luz2Cor);
    gl.uniform2fv(programa.uniform('uLuz2Pos'), estado.luz2Pos);
    gl.uniform1f(programa.uniform('uLuz2Raio'), estado.luz2Raio);
    gl.uniform1f(programa.uniform('uLuz2Int'), estado.luz2Int);
    gl.uniform1f(programa.uniform('uNevoa'), estado.nevoa);
    gl.uniform1f(programa.uniform('uClaro'), estado.claro);
    gl.uniform3fv(programa.uniform('uTeto'), FUNDO.teto);
    gl.uniform3fv(programa.uniform('uPiso'), FUNDO.piso);
    desenharTela(gl, vao);
    raiz.dataset.fundoPronto = 'true';
  };

  aoMudar = () => {
    alvo = converterHumor(lerHumor(), corDoPalco);
    aplicarFallbackCss(lerHumor(), corDoPalco);
    if (isReduzido) {
      interpolarEstado(estado, alvo, 1);
      desenhar(0);
    } else {
      retomar();
    }
  };

  const governar = (delta: number) => {
    intervalos.push(delta);
    if (intervalos.length < FUNDO.janelaDoGovernador) return;
    const media = intervalos.reduce((soma, valor) => soma + valor, 0) / intervalos.length;
    intervalos.length = 0;
    if (media <= FUNDO.limiteDoQuadroMs) return;
    const proximo = FUNDO.degrausDoGovernador.find((valor) => valor < escala);
    if (proximo === undefined) {
      cancelAnimationFrame(quadro);
      quadro = 0;
      isPausadoPorEstado = true;
      usarFallback();
      return;
    }
    escala = proximo;
  };

  const isAtivo = () =>
    !isPausadoPorEstado && !document.hidden && visiveis.size > 0 && raiz.dataset.menuAberto !== 'true' && raiz.dataset.lightboxAberto !== 'true';

  const laco = (agora: number) => {
    const delta = anterior ? agora - anterior : 16;
    anterior = agora;
    governar(delta);
    if (isPausadoPorEstado) return;
    isPar = !isPar;
    if (isPar) {
      interpolarEstado(estado, alvo, 1 - Math.exp(-(delta * 2) / 1000 / (beat * 0.6)));
      desenhar((agora - inicio) / 1000);
    }
    quadro = isAtivo() ? requestAnimationFrame(laco) : 0;
    if (!quadro) anterior = 0;
  };

  function retomar(): void {
    if (isReduzido) {
      interpolarEstado(estado, alvo, 1);
      desenhar(0);
      return;
    }
    if (!quadro && isAtivo()) quadro = requestAnimationFrame(laco);
  }

  document.addEventListener('visibilitychange', retomar);
  new MutationObserver(retomar).observe(raiz, { attributes: true, attributeFilter: ['data-menu-aberto', 'data-lightbox-aberto'] });
  window.addEventListener('resize', () => { if (isReduzido) desenhar(0); }, { passive: true });
  interpolarEstado(estado, alvo, 1);
  desenhar(0);
  retomar();
}
