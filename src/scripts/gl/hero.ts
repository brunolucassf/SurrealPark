import { HERO } from './constantes';
import {
  RUIDO_GLSL,
  apagarAlvo,
  criarAlvo,
  criarContexto,
  criarPrograma,
  criarTextura,
  criarTrianguloDeTela,
  desenharTela,
  lerBeatEmSegundos,
  type AlvoDeRender,
} from './motor';

const FRAGMENTO_DA_TRILHA = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 corFinal;
uniform sampler2D uAnterior;
uniform vec2 uPonteiro;
uniform vec2 uVelocidade;
uniform float uRaio;
uniform float uForca;
uniform float uDecaimento;
uniform float uDt;
uniform vec2 uProporcao;
void main() {
  vec2 uv = vUv;
  float anterior = texture(uAnterior, uv - uVelocidade * ${HERO.adveccao.toFixed(2)} * uDt).r * uDecaimento;
  vec2 d = (uv - uPonteiro) * uProporcao;
  float pincel = exp(-dot(d, d) / max(uRaio * uRaio, 1e-5)) * uForca;
  corFinal = vec4(clamp(max(anterior, pincel) + pincel * 0.15, 0.0, 1.0), 0.0, 0.0, 1.0);
}`;

const FRAGMENTO_DA_COMPOSICAO = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 corFinal;
uniform sampler2D uRealidade;
uniform sampler2D uRevelada;
uniform sampler2D uTrilha;
uniform vec2 uResolucao;
uniform float uAspectoDaRealidade;
uniform float uAspectoDaRevelada;
uniform vec2 uFoco;
uniform float uTempo;
uniform float uBeat;
uniform float uRespiro;
uniform vec2 uParalaxe;
uniform vec2 uTexelDaTrilha;
uniform vec3 uAro;
${RUIDO_GLSL}
vec2 cobrir(vec2 uvTela, float aspectoDaImagem, vec2 foco) {
  float aspectoDaTela = uResolucao.x / uResolucao.y;
  vec2 escala = aspectoDaTela > aspectoDaImagem ? vec2(1.0, aspectoDaImagem / aspectoDaTela) : vec2(aspectoDaTela / aspectoDaImagem, 1.0);
  return (1.0 - escala) * foco + uvTela * escala;
}
vec3 realcar(vec3 cor) {
  float luma = dot(cor, vec3(0.299, 0.587, 0.114));
  vec3 saturada = mix(vec3(luma), cor, 1.18);
  return clamp((saturada - 0.5) * 1.1 + 0.5 + 0.04, 0.0, 1.0) * 1.08;
}
float brilhoDasLampadas(vec2 uv) {
  vec2 celula = floor(uv * vec2(48.0, 32.0));
  float batida = uTempo / max(uBeat * 1.5, 0.001);
  float a = hash12(celula + floor(batida));
  float b = hash12(celula + floor(batida) + 1.0);
  return mix(a, b, smoothstep(0.0, 1.0, fract(batida))) - 0.5;
}
void main() {
  vec2 uvTela = vec2(vUv.x, 1.0 - vUv.y);
  vec2 uv = (uvTela - 0.5) / uRespiro + 0.5;
  uv += uParalaxe * uvTela.y;
  float ceu = smoothstep(0.36, 0.0, uvTela.y);
  uv.x += sin(uvTela.y * 46.0 + uTempo * 1.7) * 0.0008 * ceu;
  float trilha = texture(uTrilha, vUv).r;
  float gx = texture(uTrilha, vUv + vec2(uTexelDaTrilha.x, 0.0)).r - texture(uTrilha, vUv - vec2(uTexelDaTrilha.x, 0.0)).r;
  float gy = texture(uTrilha, vUv + vec2(0.0, uTexelDaTrilha.y)).r - texture(uTrilha, vUv - vec2(0.0, uTexelDaTrilha.y)).r;
  vec2 gradiente = vec2(gx, -gy);
  float borda = fbm2(uvTela * 3.0 * vec2(uResolucao.x / uResolucao.y, 1.0) + uTempo * 0.05);
  float mistura = smoothstep(0.35, 0.65, trilha + (borda - 0.5) * 0.35);
  float banda = smoothstep(0.16, 0.0, abs(mistura - 0.5)) * step(0.02, trilha);
  vec2 uvImagem = cobrir(uv, uAspectoDaRealidade, uFoco);
  vec2 uvRevelada = cobrir(uv + gradiente * 0.015, uAspectoDaRevelada, vec2(0.5, 0.55));
  vec3 realidade = texture(uRealidade, uvImagem).rgb;
  vec3 revelada = realcar(vec3(
    texture(uRevelada, uvRevelada + vec2(0.002, 0.0) * banda).r,
    texture(uRevelada, uvRevelada).g,
    texture(uRevelada, uvRevelada - vec2(0.002, 0.0) * banda).b
  ));
  float lumaDaRealidade = dot(realidade, vec3(0.299, 0.587, 0.114));
  realidade *= 1.0 + 0.1 * brilhoDasLampadas(uvImagem + 3.1) * smoothstep(0.75, 0.92, lumaDaRealidade);
  vec3 cor = mix(realidade, revelada, mistura) + uAro * 0.35 * banda;
  corFinal = vec4(cor, 1.0);
}`;

export interface HeroLiquido {
  ensinarGesto: () => void;
  definirAtivo: (isAtivo: boolean) => void;
}

interface OpcoesDoHero {
  secao: HTMLElement;
  canvas: HTMLCanvasElement;
  imagem: HTMLImageElement;
  urlsDaRevelada: string[];
  aoCarregar: (tarefa: 'revelada' | 'gl') => void;
}

async function carregarBitmap(urls: string[]): Promise<ImageBitmap> {
  for (const url of urls) {
    try {
      const resposta = await fetch(url);
      if (!resposta.ok) continue;
      return await createImageBitmap(await resposta.blob());
    } catch {
      continue;
    }
  }
  throw new Error('revelada indisponível');
}

function lerFoco(imagem: HTMLImageElement): [number, number] {
  const partes = getComputedStyle(imagem).objectPosition.split(' ');
  const converter = (valor: string | undefined) => (valor?.endsWith('%') ? parseFloat(valor) / 100 : 0.5);
  return [converter(partes[0]), converter(partes[1])];
}

export async function criarHeroLiquido({ secao, canvas, imagem, urlsDaRevelada, aoCarregar }: OpcoesDoHero): Promise<HeroLiquido | null> {
  const isToque = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 1024;
  const gl = criarContexto(canvas, { alpha: true, powerPreference: 'high-performance' });
  if (!gl) return null;

  const trilhaPrograma = criarPrograma(gl, FRAGMENTO_DA_TRILHA);
  const composicao = criarPrograma(gl, FRAGMENTO_DA_COMPOSICAO);
  const vao = criarTrianguloDeTela(gl);

  await imagem.decode().catch(() => undefined);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  const texturaDaRealidade = criarTextura(gl, imagem);
  const aspectoDaRealidade = imagem.naturalWidth / imagem.naturalHeight;
  const bitmapDaRevelada = await carregarBitmap(urlsDaRevelada);
  const texturaDaRevelada = criarTextura(gl, bitmapDaRevelada);
  const aspectoDaRevelada = bitmapDaRevelada.width / bitmapDaRevelada.height;
  bitmapDaRevelada.close();
  aoCarregar('revelada');

  const beat = lerBeatEmSegundos();
  const dprMaximo = isToque ? HERO.dprMobile : HERO.dprDesktop;
  let alvos: [AlvoDeRender, AlvoDeRender] | null = null;
  let foco = lerFoco(imagem);
  const aro = [230 / 255, 189 / 255, 110 / 255];

  const ajustar = () => {
    const caixa = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, dprMaximo);
    const largura = Math.max(1, Math.round(caixa.width * dpr));
    const altura = Math.max(1, Math.round(caixa.height * dpr));
    if (canvas.width !== largura || canvas.height !== altura) {
      canvas.width = largura;
      canvas.height = altura;
    }
    const escalaDaTrilha = Math.min(1, HERO.resolucaoMaximaDaTrilha / Math.max(largura / 4, altura / 4));
    const larguraDaTrilha = Math.max(8, Math.round((largura / 4) * escalaDaTrilha));
    const alturaDaTrilha = Math.max(8, Math.round((altura / 4) * escalaDaTrilha));
    if (!alvos || alvos[0].largura !== larguraDaTrilha || alvos[0].altura !== alturaDaTrilha) {
      if (alvos) alvos.forEach((alvo) => apagarAlvo(gl, alvo));
      alvos = [criarAlvo(gl, larguraDaTrilha, alturaDaTrilha), criarAlvo(gl, larguraDaTrilha, alturaDaTrilha)];
    }
    foco = lerFoco(imagem);
  };
  ajustar();
  new ResizeObserver(ajustar).observe(canvas);

  const ponteiro = { x: 0.5, y: 0.55, alvoX: 0.5, alvoY: 0.55, velX: 0, velY: 0, ultimoMovimento: -1e9, isDentro: false };
  const virtual = { peso: 0, inclinacaoX: 0, inclinacaoY: 0 };
  const passagem = { inicio: -1 };
  const paralaxe = { x: 0, y: 0 };
  const estado = { isAtivo: true, isVisivel: true, quadro: 0, anterior: 0, inicio: performance.now() };

  const atualizarAlvo = (clienteX: number, clienteY: number) => {
    const caixa = canvas.getBoundingClientRect();
    ponteiro.alvoX = (clienteX - caixa.left) / caixa.width;
    ponteiro.alvoY = (clienteY - caixa.top) / caixa.height;
    ponteiro.ultimoMovimento = performance.now();
  };
  secao.addEventListener('pointermove', (evento) => {
    if (evento.pointerType === 'touch') return;
    atualizarAlvo(evento.clientX, evento.clientY);
    ponteiro.isDentro = true;
  }, { passive: true });
  secao.addEventListener('pointerleave', () => { ponteiro.isDentro = false; }, { passive: true });
  secao.addEventListener('touchmove', (evento) => {
    const toque = evento.touches[0];
    if (!toque) return;
    atualizarAlvo(toque.clientX, toque.clientY);
    ponteiro.isDentro = true;
  }, { passive: true });
  secao.addEventListener('touchend', () => { ponteiro.isDentro = false; }, { passive: true });

  const DeviceOrientation = (window as unknown as { DeviceOrientationEvent?: { requestPermission?: unknown } }).DeviceOrientationEvent;
  if (isToque && DeviceOrientation && typeof DeviceOrientation.requestPermission !== 'function') {
    window.addEventListener('deviceorientation', (evento) => {
      virtual.inclinacaoX = Math.max(-1, Math.min(1, (evento.gamma ?? 0) / 30)) * 0.15;
      virtual.inclinacaoY = Math.max(-1, Math.min(1, ((evento.beta ?? 45) - 45) / 30)) * 0.15;
    }, { passive: true });
  }

  const calcularPonteiro = (segundos: number, agora: number) => {
    const ocioso = (agora - ponteiro.ultimoMovimento) / 1000 > beat * 4;
    const isVirtual = isToque ? ocioso || !ponteiro.isDentro : ocioso;
    virtual.peso += ((isVirtual ? 1 : 0) - virtual.peso) * 0.04;
    const [ax, ay] = HERO.amplitudeOciosa;
    const virtualX = 0.5 + ax * Math.sin((2 * Math.PI * segundos) / (beat * 8)) + virtual.inclinacaoX;
    const virtualY = 0.55 + ay * Math.sin((2 * Math.PI * segundos) / (beat * 12)) + virtual.inclinacaoY;
    let alvoX = ponteiro.alvoX * (1 - virtual.peso) + virtualX * virtual.peso;
    let alvoY = ponteiro.alvoY * (1 - virtual.peso) + virtualY * virtual.peso;
    if (passagem.inicio >= 0) {
      const progresso = (agora - passagem.inicio) / 1000 / (beat * 2);
      if (progresso >= 1) passagem.inicio = -1;
      else {
        const suave = progresso * progresso * (3 - 2 * progresso);
        alvoX = 0.08 + suave * 0.84;
        alvoY = 0.58 - Math.sin(progresso * Math.PI) * 0.08;
      }
    }
    return { alvoX, alvoY };
  };

  const desenhar = (agora: number) => {
    if (!alvos) return;
    const segundos = (agora - estado.inicio) / 1000;
    const dt = Math.min((agora - (estado.anterior || agora)) / 1000, 0.05) || 1 / 60;
    estado.anterior = agora;
    const { alvoX, alvoY } = calcularPonteiro(segundos, agora);
    const anteriorX = ponteiro.x;
    const anteriorY = ponteiro.y;
    ponteiro.x += (alvoX - ponteiro.x) * HERO.lerpDoPonteiro;
    ponteiro.y += (alvoY - ponteiro.y) * HERO.lerpDoPonteiro;
    ponteiro.velX = (ponteiro.x - anteriorX) / dt;
    ponteiro.velY = (ponteiro.y - anteriorY) / dt;
    const menorLado = Math.min(canvas.width, canvas.height);
    const proporcao: [number, number] = [canvas.width / menorLado, canvas.height / menorLado];
    const velocidade = Math.hypot(ponteiro.velX * proporcao[0], ponteiro.velY * proporcao[1]);
    const raio = isToque ? HERO.raioMobile : HERO.raioBase + Math.min(velocidade * 0.5, HERO.raioExtraMaximo);

    const [leitura, escrita] = alvos;
    gl.bindFramebuffer(gl.FRAMEBUFFER, escrita.framebuffer);
    gl.viewport(0, 0, escrita.largura, escrita.altura);
    trilhaPrograma.usar();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, leitura.textura);
    gl.uniform1i(trilhaPrograma.uniform('uAnterior'), 0);
    gl.uniform2f(trilhaPrograma.uniform('uPonteiro'), ponteiro.x, 1 - ponteiro.y);
    gl.uniform2f(trilhaPrograma.uniform('uVelocidade'), ponteiro.velX, -ponteiro.velY);
    gl.uniform1f(trilhaPrograma.uniform('uRaio'), raio);
    gl.uniform1f(trilhaPrograma.uniform('uForca'), 0.9);
    gl.uniform1f(trilhaPrograma.uniform('uDecaimento'), Math.pow(HERO.decaimento, dt * 60));
    gl.uniform1f(trilhaPrograma.uniform('uDt'), dt);
    gl.uniform2fv(trilhaPrograma.uniform('uProporcao'), proporcao);
    desenharTela(gl, vao);
    alvos = [escrita, leitura];

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    composicao.usar();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texturaDaRealidade);
    gl.uniform1i(composicao.uniform('uRealidade'), 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texturaDaRevelada);
    gl.uniform1i(composicao.uniform('uRevelada'), 1);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, escrita.textura);
    gl.uniform1i(composicao.uniform('uTrilha'), 2);
    paralaxe.x += ((ponteiro.isDentro ? ponteiro.x - 0.5 : 0) * 0.012 - paralaxe.x) * 0.06;
    paralaxe.y += ((ponteiro.isDentro ? ponteiro.y - 0.5 : 0) * 0.012 - paralaxe.y) * 0.06;
    gl.uniform2f(composicao.uniform('uResolucao'), canvas.width, canvas.height);
    gl.uniform1f(composicao.uniform('uAspectoDaRealidade'), aspectoDaRealidade);
    gl.uniform1f(composicao.uniform('uAspectoDaRevelada'), aspectoDaRevelada);
    gl.uniform2fv(composicao.uniform('uFoco'), foco);
    gl.uniform1f(composicao.uniform('uTempo'), segundos);
    gl.uniform1f(composicao.uniform('uBeat'), beat);
    gl.uniform1f(composicao.uniform('uRespiro'), 1.02 + 0.02 * Math.sin((2 * Math.PI * segundos) / (beat * 16)));
    gl.uniform2f(composicao.uniform('uParalaxe'), paralaxe.x, paralaxe.y);
    gl.uniform2f(composicao.uniform('uTexelDaTrilha'), 1 / escrita.largura, 1 / escrita.altura);
    gl.uniform3fv(composicao.uniform('uAro'), aro);
    desenharTela(gl, vao);
  };

  const laco = (agora: number) => {
    desenhar(agora);
    estado.quadro = estado.isAtivo && estado.isVisivel && !document.hidden ? requestAnimationFrame(laco) : 0;
    if (!estado.quadro) estado.anterior = 0;
  };
  const retomar = () => {
    if (!estado.quadro && estado.isAtivo && estado.isVisivel && !document.hidden) estado.quadro = requestAnimationFrame(laco);
  };

  new IntersectionObserver(([entrada]) => {
    estado.isVisivel = Boolean(entrada?.isIntersecting);
    retomar();
  }).observe(canvas);
  document.addEventListener('visibilitychange', retomar);

  desenhar(performance.now());
  gl.finish();
  aoCarregar('gl');
  canvas.dataset.pronto = 'true';
  retomar();

  return {
    ensinarGesto: () => { passagem.inicio = performance.now(); },
    definirAtivo: (isAtivo) => {
      estado.isAtivo = isAtivo;
      retomar();
    },
  };
}
