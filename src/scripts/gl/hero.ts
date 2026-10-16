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

const QUANTIDADE_DE_TRACOS = HERO.ambiente.quantidade + 1;

const FRAGMENTO_DA_TRILHA = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 corFinal;
uniform sampler2D uAnterior;
uniform vec4 uTracos[${QUANTIDADE_DE_TRACOS}];
uniform vec2 uFormasDosTracos[${QUANTIDADE_DE_TRACOS}];
uniform vec2 uVelocidade;
uniform float uDecaimento;
uniform float uSubtracao;
uniform float uDt;
uniform vec2 uProporcao;
${RUIDO_GLSL}
void main() {
  vec4 anterior = texture(uAnterior, vUv - uVelocidade * ${HERO.adveccao.toFixed(2)} * uDt);
  float valorAnterior = max(anterior.r * uDecaimento - uSubtracao, 0.0);
  vec2 p = vUv * uProporcao;
  float maiorPincel = 0.0;
  vec2 eixoDoPincel = vec2(0.0);
  for (int i = 0; i < ${QUANTIDADE_DE_TRACOS}; i++) {
    vec2 forma = uFormasDosTracos[i];
    if (forma.y <= 0.001) continue;
    vec2 a = uTracos[i].xy * uProporcao;
    vec2 b = uTracos[i].zw * uProporcao;
    vec2 trecho = b - a;
    float comprimento = length(trecho);
    vec2 direcao = comprimento > 1e-5 ? trecho / comprimento : vec2(1.0, 0.0);
    vec2 normal = vec2(-direcao.y, direcao.x);
    float h = comprimento > 1e-5 ? clamp(dot(p - a, trecho) / (comprimento * comprimento), 0.0, 1.0) : 1.0;
    vec2 delta = p - (a + trecho * h);
    float longitudinal = dot(p, direcao);
    float transversal = dot(p, normal);
    float fibras = ruido(vec2(longitudinal * 5.0, transversal * 95.0));
    float rasgo = ruido(vec2(longitudinal * 14.0, transversal * 14.0));
    float largura = forma.x * (0.62 + 0.55 * fibras + 0.2 * rasgo);
    float pincel = exp(-dot(delta, delta) / max(largura * largura, 1e-6)) * forma.y * (0.8 + 0.2 * fibras);
    if (pincel > maiorPincel) {
      maiorPincel = pincel;
      eixoDoPincel = vec2(direcao.x * direcao.x - direcao.y * direcao.y, 2.0 * direcao.x * direcao.y);
    }
  }
  float valor = clamp(max(valorAnterior, maiorPincel), 0.0, 1.0);
  vec2 eixo = mix(anterior.gb * 2.0 - 1.0, eixoDoPincel, smoothstep(0.0, 0.35, maiorPincel));
  corFinal = vec4(valor, eixo * 0.5 + 0.5, 1.0);
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
uniform float uLuz;
uniform vec2 uParalaxe;
uniform vec2 uTexelDaTrilha;
uniform vec3 uAro;
${RUIDO_GLSL}
vec2 cobrir(vec2 uvTela, float aspectoDaImagem, vec2 foco) {
  float aspectoDaTela = uResolucao.x / uResolucao.y;
  vec2 escala = aspectoDaTela > aspectoDaImagem ? vec2(1.0, aspectoDaImagem / aspectoDaTela) : vec2(aspectoDaTela / aspectoDaImagem, 1.0);
  return (1.0 - escala) * foco + uvTela * escala;
}
vec3 tratarSonho(vec3 cor, vec2 uvTela) {
  float luma = dot(cor, vec3(0.2126, 0.7152, 0.0722));
  float pico = max(max(cor.r, cor.g), cor.b);
  float tom = smoothstep(0.14, 0.95, 1.0 - exp(-mix(luma, pico, 0.2) * 3.1));
  vec3 grafite = vec3(0.04, 0.036, 0.044);
  vec3 ouro = vec3(0.86, 0.63, 0.30);
  vec3 osso = vec3(0.99, 0.96, 0.9);
  vec3 dourado = mix(mix(grafite, ouro, smoothstep(0.22, 0.78, tom)), osso, smoothstep(0.66, 1.0, tom));
  vec3 prata = mix(grafite, osso, tom * tom);
  vec2 centro = uvTela - 0.5;
  return mix(prata, dourado, 0.72) * (1.0 - 0.6 * dot(centro, centro));
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
  float aspecto = uResolucao.x / uResolucao.y;
  vec2 uv = (uvTela - 0.5) / uRespiro + 0.5;
  uv += uParalaxe * uvTela.y;
  float ceu = smoothstep(0.36, 0.0, uvTela.y);
  uv.x += sin(uvTela.y * 46.0 + uTempo * 1.7) * 0.0008 * ceu;
  vec4 trilha = texture(uTrilha, vUv);
  float gx = texture(uTrilha, vUv + vec2(uTexelDaTrilha.x, 0.0)).r - texture(uTrilha, vUv - vec2(uTexelDaTrilha.x, 0.0)).r;
  float gy = texture(uTrilha, vUv + vec2(0.0, uTexelDaTrilha.y)).r - texture(uTrilha, vUv - vec2(0.0, uTexelDaTrilha.y)).r;
  vec2 gradiente = vec2(gx, -gy);
  vec2 q = uvTela * vec2(aspecto, 1.0);
  float valor = trilha.r;
  vec2 eixo = trilha.gb * 2.0 - 1.0;
  float angulo = -0.5 * atan(eixo.y, eixo.x + 1e-5);
  vec2 direcao = vec2(cos(angulo), sin(angulo));
  vec2 local = vec2(dot(q, direcao), dot(q, vec2(-direcao.y, direcao.x)));
  float organica = fbm2(q * 3.0 + uTempo * 0.05);
  float riscos = ruido(vec2(local.x * 2.4, local.y * 30.0));
  float borda = mix(organica, riscos * 0.6 + organica * 0.4, smoothstep(0.15, 0.6, length(eixo)));
  float campo = valor + (borda - 0.5) * 0.45;
  float mistura = smoothstep(0.4, 0.5, campo);
  float banda = smoothstep(0.07, 0.0, abs(campo - 0.4)) * step(0.02, valor);
  vec2 uvImagem = cobrir(uv, uAspectoDaRealidade, uFoco);
  vec2 uvRevelada = cobrir(uv + gradiente * 0.012, uAspectoDaRevelada, vec2(0.5, 0.55));
  vec3 realidade = texture(uRealidade, uvImagem).rgb;
  vec3 revelada = vec3(0.0);
  if (mistura > 0.001) {
    vec2 texelDaRevelada = 1.5 / vec2(textureSize(uRevelada, 0));
    vec3 centroDaRevelada = texture(uRevelada, uvRevelada).rgb;
    vec3 vizinhanca = (texture(uRevelada, uvRevelada + vec2(texelDaRevelada.x, 0.0)).rgb + texture(uRevelada, uvRevelada - vec2(texelDaRevelada.x, 0.0)).rgb
      + texture(uRevelada, uvRevelada + vec2(0.0, texelDaRevelada.y)).rgb + texture(uRevelada, uvRevelada - vec2(0.0, texelDaRevelada.y)).rgb) * 0.25;
    revelada = tratarSonho(max(centroDaRevelada + (centroDaRevelada - vizinhanca) * 1.4, 0.0), uvTela);
  }
  float lumaDaRealidade = dot(realidade, vec3(0.299, 0.587, 0.114));
  realidade *= 1.0 + 0.1 * brilhoDasLampadas(uvImagem + 3.1) * smoothstep(0.75, 0.92, lumaDaRealidade);
  vec3 cor = mix(realidade, revelada, mistura) * uLuz + uAro * 0.32 * banda * (1.0 - 0.6 * lumaDaRealidade);
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

interface TracoAmbiente {
  inicio: number;
  duracao: number;
  origemX: number;
  origemY: number;
  angulo: number;
  curva: number;
  comprimento: number;
  raio: number;
  anteriorX: number;
  anteriorY: number;
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

function sortearEntre([minimo, maximo]: [number, number]): number {
  return minimo + Math.random() * (maximo - minimo);
}

function criarAlvoDaTrilha(gl: WebGL2RenderingContext, largura: number, altura: number, isMeiaPrecisao: boolean): AlvoDeRender & { isMeiaPrecisao: boolean } {
  if (!isMeiaPrecisao) return { ...criarAlvo(gl, largura, altura), isMeiaPrecisao: false };
  const textura = gl.createTexture();
  const framebuffer = gl.createFramebuffer();
  if (!textura || !framebuffer) return { ...criarAlvo(gl, largura, altura), isMeiaPrecisao: false };
  gl.bindTexture(gl.TEXTURE_2D, textura);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, largura, altura, 0, gl.RGBA, gl.HALF_FLOAT, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textura, 0);
  const isCompleto = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  if (isCompleto) return { textura, framebuffer, largura, altura, isMeiaPrecisao: true };
  gl.deleteTexture(textura);
  gl.deleteFramebuffer(framebuffer);
  return { ...criarAlvo(gl, largura, altura), isMeiaPrecisao: false };
}

function limparTrilha(gl: WebGL2RenderingContext, alvo: AlvoDeRender): void {
  gl.bindFramebuffer(gl.FRAMEBUFFER, alvo.framebuffer);
  gl.clearColor(0, 0.5, 0.5, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function criarTracosAmbientes(isToque: boolean, beat: number) {
  const { quantidade, duracaoEmBeats, intervaloEmBeats, comprimento, raio, forcaMaxima, zonaDesktop, zonaMobile } = HERO.ambiente;
  const zona = isToque ? zonaMobile : zonaDesktop;

  const sortear = (inicio: number, vizinhos: TracoAmbiente[]): TracoAmbiente => {
    let origemX = sortearEntre(zona.x);
    let origemY = sortearEntre(zona.y);
    for (let tentativa = 0; tentativa < 6 && vizinhos.some((outro) => Math.hypot(outro.origemX - origemX, outro.origemY - origemY) < 0.25); tentativa++) {
      origemX = sortearEntre(zona.x);
      origemY = sortearEntre(zona.y);
    }
    const isParaEsquerda = origemX > (zona.x[0] + zona.x[1]) / 2;
    return {
      inicio,
      duracao: sortearEntre(duracaoEmBeats) * beat,
      origemX,
      origemY,
      angulo: (Math.random() - 0.5) * 0.9 + (isParaEsquerda ? Math.PI : 0),
      curva: (Math.random() - 0.5) * 1.2,
      comprimento: sortearEntre(comprimento),
      raio: sortearEntre(raio),
      anteriorX: origemX,
      anteriorY: origemY,
    };
  };

  const tracos: TracoAmbiente[] = [];
  for (let indice = 0; indice < quantidade; indice++) {
    tracos.push(sortear(beat * (1.5 + indice * 4.5), tracos));
  }

  const posicionar = (traco: TracoAmbiente, progresso: number, aspecto: number): [number, number] => {
    const suave = progresso * progresso * (3 - 2 * progresso);
    const angulo = traco.angulo + traco.curva * (suave - 0.5);
    const distancia = traco.comprimento * suave;
    return [traco.origemX + (Math.cos(angulo) * distancia) / aspecto, traco.origemY + Math.sin(angulo) * distancia];
  };

  const escrever = (segundos: number, aspecto: number, segmentos: Float32Array, formas: Float32Array) => {
    tracos.forEach((traco, indice) => {
      const deslocamento = indice + 1;
      const progresso = (segundos - traco.inicio) / traco.duracao;
      if (progresso >= 1) {
        tracos[indice] = sortear(segundos + sortearEntre(intervaloEmBeats) * beat, tracos.filter((_, outro) => outro !== indice));
      }
      const atual = tracos[indice]!;
      if (progresso < 0 || progresso >= 1) {
        formas.set([0, 0], deslocamento * 2);
        return;
      }
      const [x, y] = posicionar(atual, progresso, aspecto);
      segmentos.set([atual.anteriorX, 1 - atual.anteriorY, x, 1 - y], deslocamento * 4);
      formas.set([atual.raio, Math.pow(Math.sin(Math.PI * progresso), 0.6) * forcaMaxima], deslocamento * 2);
      atual.anteriorX = x;
      atual.anteriorY = y;
    });
  };

  return { escrever };
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
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  const aspectoDaRevelada = bitmapDaRevelada.width / bitmapDaRevelada.height;
  bitmapDaRevelada.close();
  aoCarregar('revelada');

  const beat = lerBeatEmSegundos();
  const dprMaximo = isToque ? HERO.dprMobile : HERO.dprDesktop;
  let alvos: [AlvoDeRender, AlvoDeRender] | null = null;
  let isTrilhaDeMeiaPrecisao = Boolean(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'));
  let foco = lerFoco(imagem);
  const aro = [230 / 255, 189 / 255, 110 / 255];
  const tracosAmbientes = criarTracosAmbientes(isToque, beat);
  const segmentos = new Float32Array(QUANTIDADE_DE_TRACOS * 4);
  const formasDosTracos = new Float32Array(QUANTIDADE_DE_TRACOS * 2);

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
      const primeiro = criarAlvoDaTrilha(gl, larguraDaTrilha, alturaDaTrilha, isTrilhaDeMeiaPrecisao);
      const segundo = criarAlvoDaTrilha(gl, larguraDaTrilha, alturaDaTrilha, primeiro.isMeiaPrecisao);
      isTrilhaDeMeiaPrecisao = primeiro.isMeiaPrecisao && segundo.isMeiaPrecisao;
      alvos = [primeiro, segundo];
      alvos.forEach((alvo) => limparTrilha(gl, alvo));
    }
    foco = lerFoco(imagem);
  };
  ajustar();
  new ResizeObserver(ajustar).observe(canvas);

  const ponteiro = { x: 0.5, y: 0.5, alvoX: 0.5, alvoY: 0.5, velX: 0, velY: 0, isDentro: false, isSaltando: true };
  const inclinacao = { x: 0, y: 0 };
  const passagem = { inicio: -1 };
  const paralaxe = { x: 0, y: 0 };
  const estado = { isAtivo: true, isVisivel: true, quadro: 0, anterior: 0, inicio: performance.now() };

  const entrar = (clienteX: number, clienteY: number) => {
    const caixa = canvas.getBoundingClientRect();
    ponteiro.alvoX = (clienteX - caixa.left) / caixa.width;
    ponteiro.alvoY = (clienteY - caixa.top) / caixa.height;
    if (!ponteiro.isDentro) ponteiro.isSaltando = true;
    ponteiro.isDentro = true;
  };
  const sair = () => { ponteiro.isDentro = false; };

  secao.addEventListener('pointermove', (evento) => {
    if (evento.pointerType !== 'touch') entrar(evento.clientX, evento.clientY);
  }, { passive: true });
  secao.addEventListener('pointerleave', sair, { passive: true });
  const seguirToque = (evento: TouchEvent) => {
    const toque = evento.touches[0];
    if (toque) entrar(toque.clientX, toque.clientY);
  };
  secao.addEventListener('touchstart', (evento) => {
    sair();
    seguirToque(evento);
  }, { passive: true });
  secao.addEventListener('touchmove', seguirToque, { passive: true });
  secao.addEventListener('touchend', sair, { passive: true });
  secao.addEventListener('touchcancel', sair, { passive: true });

  const DeviceOrientation = (window as unknown as { DeviceOrientationEvent?: { requestPermission?: unknown } }).DeviceOrientationEvent;
  if (isToque && DeviceOrientation && typeof DeviceOrientation.requestPermission !== 'function') {
    window.addEventListener('deviceorientation', (evento) => {
      inclinacao.x = Math.max(-1, Math.min(1, (evento.gamma ?? 0) / 30)) * 0.5;
      inclinacao.y = Math.max(-1, Math.min(1, ((evento.beta ?? 45) - 45) / 30)) * 0.5;
    }, { passive: true });
  }

  const calcularAlvo = (agora: number): { alvoX: number; alvoY: number; isRiscando: boolean } => {
    if (passagem.inicio >= 0) {
      const progresso = (agora - passagem.inicio) / 1000 / (beat * 2);
      if (progresso < 1) {
        const suave = progresso * progresso * (3 - 2 * progresso);
        return { alvoX: 0.08 + suave * 0.84, alvoY: 0.5 - Math.sin(progresso * Math.PI) * 0.1, isRiscando: true };
      }
      passagem.inicio = -1;
      ponteiro.isSaltando = true;
    }
    return { alvoX: ponteiro.alvoX, alvoY: ponteiro.alvoY, isRiscando: ponteiro.isDentro };
  };

  const desenhar = (agora: number) => {
    if (!alvos) return;
    const segundos = (agora - estado.inicio) / 1000;
    const dt = Math.min((agora - (estado.anterior || agora)) / 1000, 0.05) || 1 / 60;
    estado.anterior = agora;
    const { alvoX, alvoY, isRiscando } = calcularAlvo(agora);
    if (ponteiro.isSaltando) {
      ponteiro.x = alvoX;
      ponteiro.y = alvoY;
      ponteiro.isSaltando = false;
    }
    const anteriorX = ponteiro.x;
    const anteriorY = ponteiro.y;
    const suavizacao = 1 - Math.pow(1 - HERO.lerpDoPonteiro, dt * 60);
    ponteiro.x += (alvoX - ponteiro.x) * suavizacao;
    ponteiro.y += (alvoY - ponteiro.y) * suavizacao;
    ponteiro.velX = (ponteiro.x - anteriorX) / dt;
    ponteiro.velY = (ponteiro.y - anteriorY) / dt;
    const menorLado = Math.min(canvas.width, canvas.height);
    const proporcao: [number, number] = [canvas.width / menorLado, canvas.height / menorLado];
    const velocidade = Math.hypot(ponteiro.velX * proporcao[0], ponteiro.velY * proporcao[1]);
    const raio = (isToque ? HERO.raioMobile : HERO.raioBase) + Math.min(velocidade * 0.014, HERO.raioExtraMaximo);
    const forcaPelaVelocidade = Math.min(1, Math.max(0, (velocidade - HERO.velocidadeMinima) / HERO.velocidadeDeForcaPlena));
    const forca = isRiscando ? Math.sqrt(forcaPelaVelocidade) * 0.95 : 0;
    const aspecto = canvas.width / canvas.height;
    segmentos.set([anteriorX, 1 - anteriorY, ponteiro.x, 1 - ponteiro.y], 0);
    formasDosTracos.set([raio, forca], 0);
    tracosAmbientes.escrever(segundos, aspecto, segmentos, formasDosTracos);

    const [leitura, escrita] = alvos;
    gl.bindFramebuffer(gl.FRAMEBUFFER, escrita.framebuffer);
    gl.viewport(0, 0, escrita.largura, escrita.altura);
    trilhaPrograma.usar();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, leitura.textura);
    gl.uniform1i(trilhaPrograma.uniform('uAnterior'), 0);
    gl.uniform4fv(trilhaPrograma.uniform('uTracos'), segmentos);
    gl.uniform2fv(trilhaPrograma.uniform('uFormasDosTracos'), formasDosTracos);
    gl.uniform2f(trilhaPrograma.uniform('uVelocidade'), isRiscando ? ponteiro.velX : 0, isRiscando ? -ponteiro.velY : 0);
    gl.uniform1f(trilhaPrograma.uniform('uDecaimento'), Math.pow(HERO.decaimento, dt * 60));
    gl.uniform1f(trilhaPrograma.uniform('uSubtracao'), isTrilhaDeMeiaPrecisao ? 0.002 * dt * 60 : Math.max(0.003 * dt * 60, 0.0021));
    gl.uniform1f(trilhaPrograma.uniform('uDt'), dt);
    gl.uniform2fv(trilhaPrograma.uniform('uProporcao'), proporcao);
    desenharTela(gl, vao);
    alvos = [escrita, leitura];

    const desvioX = ponteiro.isDentro && !isToque ? ponteiro.x - 0.5 : inclinacao.x;
    const desvioY = ponteiro.isDentro && !isToque ? ponteiro.y - 0.5 : inclinacao.y;
    paralaxe.x += (desvioX * 0.012 - paralaxe.x) * 0.06;
    paralaxe.y += (desvioY * 0.012 - paralaxe.y) * 0.06;

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
    gl.uniform2f(composicao.uniform('uResolucao'), canvas.width, canvas.height);
    gl.uniform1f(composicao.uniform('uAspectoDaRealidade'), aspectoDaRealidade);
    gl.uniform1f(composicao.uniform('uAspectoDaRevelada'), aspectoDaRevelada);
    gl.uniform2fv(composicao.uniform('uFoco'), foco);
    gl.uniform1f(composicao.uniform('uTempo'), segundos);
    gl.uniform1f(composicao.uniform('uBeat'), beat);
    gl.uniform1f(composicao.uniform('uRespiro'), 1.02 + 0.02 * Math.sin((2 * Math.PI * segundos) / (beat * 16)));
    gl.uniform1f(composicao.uniform('uLuz'), 1.02 + 0.03 * Math.sin((2 * Math.PI * segundos) / (beat * 12)));
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
    ensinarGesto: () => {
      passagem.inicio = performance.now();
      ponteiro.isSaltando = true;
    },
    definirAtivo: (isAtivo) => {
      estado.isAtivo = isAtivo;
      retomar();
    },
  };
}
