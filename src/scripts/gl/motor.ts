export interface Programa {
  gl: WebGL2RenderingContext;
  programa: WebGLProgram;
  uniforms: Map<string, WebGLUniformLocation | null>;
  usar: () => void;
  uniform: (nome: string) => WebGLUniformLocation | null;
}

export interface AlvoDeRender {
  textura: WebGLTexture;
  framebuffer: WebGLFramebuffer;
  largura: number;
  altura: number;
}

export const VERTICE_TELA_CHEIA = `#version 300 es
in vec2 aPosicao;
out vec2 vUv;
void main() {
  vUv = aPosicao * 0.5 + 0.5;
  gl_Position = vec4(aPosicao, 0.0, 1.0);
}`;

export const RUIDO_GLSL = `
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float ruido(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x), mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm2(vec2 p) {
  return ruido(p) * 0.6667 + ruido(p * 2.03 + 17.1) * 0.3333;
}
float fbm3(vec2 p) {
  return ruido(p) * 0.5714 + ruido(p * 2.03 + 17.1) * 0.2857 + ruido(p * 4.01 + 3.7) * 0.1429;
}`;

export function criarContexto(canvas: HTMLCanvasElement, opcoes: WebGLContextAttributes): WebGL2RenderingContext | null {
  try {
    return canvas.getContext('webgl2', { antialias: false, depth: false, stencil: false, premultipliedAlpha: true, ...opcoes });
  } catch {
    return null;
  }
}

function compilarShader(gl: WebGL2RenderingContext, tipo: number, fonte: string): WebGLShader {
  const shader = gl.createShader(tipo);
  if (!shader) throw new Error('shader');
  gl.shaderSource(shader, fonte);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const mensagem = gl.getShaderInfoLog(shader) ?? 'falha ao compilar';
    gl.deleteShader(shader);
    throw new Error(mensagem);
  }
  return shader;
}

export function criarPrograma(gl: WebGL2RenderingContext, fragmento: string, vertice = VERTICE_TELA_CHEIA): Programa {
  const programa = gl.createProgram();
  if (!programa) throw new Error('programa');
  gl.attachShader(programa, compilarShader(gl, gl.VERTEX_SHADER, vertice));
  gl.attachShader(programa, compilarShader(gl, gl.FRAGMENT_SHADER, fragmento));
  gl.bindAttribLocation(programa, 0, 'aPosicao');
  gl.linkProgram(programa);
  if (!gl.getProgramParameter(programa, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(programa) ?? 'link');
  const uniforms = new Map<string, WebGLUniformLocation | null>();
  const uniform = (nome: string) => {
    if (!uniforms.has(nome)) uniforms.set(nome, gl.getUniformLocation(programa, nome));
    return uniforms.get(nome) ?? null;
  };
  return { gl, programa, uniforms, usar: () => gl.useProgram(programa), uniform };
}

export function criarTrianguloDeTela(gl: WebGL2RenderingContext): WebGLVertexArrayObject {
  const vao = gl.createVertexArray();
  const buffer = gl.createBuffer();
  if (!vao || !buffer) throw new Error('vao');
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  return vao;
}

export function desenharTela(gl: WebGL2RenderingContext, vao: WebGLVertexArrayObject): void {
  gl.bindVertexArray(vao);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

export function criarTextura(gl: WebGL2RenderingContext, fonte?: TexImageSource): WebGLTexture {
  const textura = gl.createTexture();
  if (!textura) throw new Error('textura');
  gl.bindTexture(gl.TEXTURE_2D, textura);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  if (fonte) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, fonte);
  else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
  return textura;
}

export function criarAlvo(gl: WebGL2RenderingContext, largura: number, altura: number): AlvoDeRender {
  const textura = gl.createTexture();
  const framebuffer = gl.createFramebuffer();
  if (!textura || !framebuffer) throw new Error('alvo');
  gl.bindTexture(gl.TEXTURE_2D, textura);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, largura, altura, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textura, 0);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { textura, framebuffer, largura, altura };
}

export function apagarAlvo(gl: WebGL2RenderingContext, alvo: AlvoDeRender): void {
  gl.deleteTexture(alvo.textura);
  gl.deleteFramebuffer(alvo.framebuffer);
}

export function converterHexEmRgb(hex: string): [number, number, number] {
  const valor = hex.trim().replace('#', '');
  const completo = valor.length === 3 ? valor.split('').map((caractere) => caractere + caractere).join('') : valor;
  const numero = parseInt(completo.slice(0, 6), 16);
  return [((numero >> 16) & 255) / 255, ((numero >> 8) & 255) / 255, (numero & 255) / 255];
}

export function lerCorDoToken(nome: string): [number, number, number] {
  return converterHexEmRgb(getComputedStyle(document.documentElement).getPropertyValue(nome) || '#000000');
}

export function lerBeatEmSegundos(): number {
  const bruto = getComputedStyle(document.documentElement).getPropertyValue('--beat').trim();
  const valor = parseFloat(bruto);
  if (!Number.isFinite(valor) || valor <= 0) return 0.484;
  return bruto.endsWith('ms') ? valor / 1000 : valor;
}

export function suportaWebGL2(): boolean {
  try {
    return Boolean(document.createElement('canvas').getContext('webgl2'));
  } catch {
    return false;
  }
}

interface NavegadorComDados extends Navigator {
  connection?: { saveData?: boolean };
  deviceMemory?: number;
}

export function isAparelhoLimitado(): boolean {
  const navegador = navigator as NavegadorComDados;
  const isEconomia = navegador.connection?.saveData === true || window.matchMedia('(prefers-reduced-data: reduce)').matches;
  const isPoucaMemoria = typeof navegador.deviceMemory === 'number' && navegador.deviceMemory < 4;
  return isEconomia || isPoucaMemoria;
}

export function prefereMenosMovimento(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
