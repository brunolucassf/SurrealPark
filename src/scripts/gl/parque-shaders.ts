import { RUIDO_GLSL } from './motor';

export const FRAGMENTO_DA_CENA = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 corFinal;

uniform vec2 uRes;
uniform float uTempo;
uniform float uVoo;
uniform vec2 uPonteiro;
uniform sampler2D uFotoA;
uniform sampler2D uProfA;
uniform sampler2D uFotoB;
uniform sampler2D uProfB;
uniform sampler2D uMascara;
uniform vec4 uCenaA;
uniform vec4 uCenaB;
uniform vec2 uFocoA;
uniform vec2 uFocoB;
uniform vec2 uFocoTelaA;
uniform vec2 uDeslocB;
uniform vec3 uCorA;
uniform vec3 uCorB;
uniform vec4 uEstadoA;
uniform vec4 uEstadoB;
uniform vec4 uPortal;
uniform float uNuvem;
uniform float uCobertura;
uniform float uSaida;
${RUIDO_GLSL}

float aspectoDaTela() { return uRes.x / uRes.y; }

vec2 cobrir(vec2 uv, float aspectoDaImagem) {
  float aspecto = aspectoDaTela();
  vec2 p = uv - 0.5;
  if (aspectoDaImagem > aspecto) p.x *= aspecto / aspectoDaImagem;
  else p.y *= aspectoDaImagem / aspecto;
  return p + 0.5;
}

vec3 amostrarCena(sampler2D foto, sampler2D prof, vec2 uv, vec4 cena, vec2 foco, vec3 corDoHumor, vec4 estado) {
  vec2 p = cobrir(uv, cena.x);
  p = foco + (p - foco) / cena.z;
  float d = textureLod(prof, vec2(p.x, 1.0 - p.y), 3.5).r;
  p = foco + (p - foco) / (1.0 + cena.y * (0.4 + 1.2 * estado.z * d));
  p += (uPonteiro - 0.5) * vec2(0.012, 0.008) * (d - 0.35);
  vec2 uvImagem = vec2(p.x, 1.0 - p.y);
  vec3 cor = texture(foto, uvImagem, cena.w).rgb;
  cor += textureLod(foto, uvImagem, 5.0).rgb * 0.25;
  float nevoa = fbm2(p * vec2(cena.x, 1.0) * 2.6 + vec2(uTempo * 0.018, -uTempo * 0.011 - uVoo * 0.2));
  cor = mix(cor, corDoHumor * 0.55, clamp((1.0 - d) * nevoa * estado.y * 1.6, 0.0, estado.y));
  float faixa = fract(uTempo / 3.87) * 2.0 - 0.5;
  cor += vec3(0.30, 0.86, 0.50) * estado.w * 0.15 * smoothstep(0.12, 0.0, abs(uv.x - faixa)) * (0.4 + 0.6 * d);
  return cor * estado.x;
}

float mascaraDaForma(vec2 uv, float escala, float vies) {
  vec2 q = (uv - uFocoTelaA) * vec2(aspectoDaTela(), 1.0) / max(escala, 1e-4) + 0.5;
  if (q.x < 0.0 || q.y < 0.0 || q.x > 1.0 || q.y > 1.0) return 0.0;
  return texture(uMascara, vec2(q.x, 1.0 - q.y), vies).r;
}

float mascaraDaNuvem(vec2 uv, float progresso) {
  vec2 a = (uv - uFocoTelaA) * vec2(aspectoDaTela(), 1.0);
  float n = fbm3(uv * vec2(aspectoDaTela(), 1.0) * 2.2 + vec2(0.0, uTempo * 0.03 + progresso * 1.5));
  return smoothstep(-0.08, 0.08, progresso * 2.9 - 0.45 - length(a) - (n - 0.5) * 0.9);
}

void main() {
  vec2 uv = vUv;
  vec3 cor = amostrarCena(uFotoA, uProfA, uv, uCenaA, uFocoA, uCorA, uEstadoA);
  float tipo = uPortal.z;
  if (tipo > 0.5) {
    float m = 0.0;
    float aro = 0.0;
    float nevoeiro = 0.0;
    vec3 corDoNevoeiro = vec3(0.0);
    if (tipo < 1.5) {
      m = mascaraDaForma(uv, uPortal.x, 0.5);
      float borda = mascaraDaForma(uv, uPortal.x, 2.5);
      aro = 4.0 * borda * (1.0 - borda) * uPortal.y;
    } else {
      m = mascaraDaNuvem(uv, uPortal.w);
      vec2 q = uv * vec2(aspectoDaTela(), 1.0);
      float n = fbm3(q * 1.5 + vec2(uTempo * 0.02, -uPortal.w * 2.4 - uVoo * 0.5));
      float detalhe = fbm2(q * 4.0 + vec2(-uTempo * 0.03, -uPortal.w * 3.5));
      nevoeiro = smoothstep(0.34, 0.72, n * 0.85 + detalhe * 0.25) * uPortal.y;
      corDoNevoeiro = mix(uCorA, vec3(0.78, 0.82, 0.88), 0.55) * (0.18 + 0.34 * detalhe);
    }
    m = max(m, uCobertura);
    if (m > 0.001) {
      vec3 corB = amostrarCena(uFotoB, uProfB, uv - uDeslocB, uCenaB, uFocoB, uCorB, uEstadoB);
      cor = mix(cor, corB, m);
    }
    cor += vec3(0.902, 0.741, 0.431) * 0.55 * aro;
    cor = mix(cor, corDoNevoeiro, nevoeiro);
  }
  if (uNuvem > 0.001) {
    vec2 q = uv * vec2(aspectoDaTela(), 1.0);
    float nuvem = fbm3(q * 0.9 + vec2(uTempo * 0.012, -uVoo * 1.4 - uTempo * 0.02));
    float detalhe = fbm2(q * 3.1 + vec2(-uTempo * 0.03, -uVoo * 2.2));
    float densa = smoothstep(0.42, 0.82, nuvem * 0.8 + detalhe * 0.3 + uNuvem * 0.25 - 0.1);
    vec3 corDaNuvem = mix(uCorA, vec3(0.78, 0.82, 0.88), 0.55) * (0.26 + 0.22 * detalhe);
    cor = mix(cor, corDaNuvem, densa * uNuvem);
  }
  float vinheta = smoothstep(0.45, 1.25, length((uv - 0.5) * vec2(aspectoDaTela(), 1.0)));
  cor *= 1.0 - vinheta * 0.35;
  cor *= 1.0 - uSaida * 0.6;
  float alfa = mix(1.0, smoothstep(0.0, 0.55, uv.y), uSaida);
  corFinal = vec4(cor * alfa, alfa);
}`;

export const VERTICE_DAS_PARTICULAS = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTempo;
uniform float uVoo;
uniform int uTipo;
uniform float uAlfa;
uniform float uDpr;
uniform float uTamanhoMaximo;
uniform sampler2D uProf;
uniform vec4 uCena;
uniform vec2 uFoco;
out float vAlfa;
out vec3 vCor;

float hash(float n) { return fract(sin(n) * 43758.5453123); }

vec2 imagemDaTela(vec2 uv, vec4 cena, vec2 foco) {
  float aspecto = uRes.x / uRes.y;
  vec2 p = uv - 0.5;
  if (cena.x > aspecto) p.x *= aspecto / cena.x;
  else p.y *= cena.x / aspecto;
  p += 0.5;
  return foco + (p - foco) / cena.z;
}

void main() {
  float i = float(gl_VertexID);
  float a = hash(i * 1.137 + 0.11);
  float b = hash(i * 2.713 + 0.37);
  float c = hash(i * 3.971 + 0.73);
  float e = hash(i * 5.311 + 0.97);
  float t = uTempo;
  vec2 pos = vec2(a, b);
  float tamanho = 3.0;
  float alfa = 1.0;
  float pesoDaProfundidade = 1.0;
  vec3 cor = vec3(1.0);
  if (uTipo == 1) {
    pos = vec2(a * 1.4 - 0.2, b * 1.4 - 0.2);
    pos.y = fract(pos.y - t * 0.006 * (1.0 + c) - uVoo * 0.45 * (0.6 + c)) * 1.4 - 0.2;
    tamanho = 260.0 + 380.0 * c;
    alfa = 0.10 * (0.4 + c);
    cor = vec3(0.74, 0.78, 0.86);
    pesoDaProfundidade = 0.0;
  } else if (uTipo == 2) {
    pos = vec2(a * 1.4 - 0.2, b * 1.2 - 0.1);
    pos.x += sin(t * 0.05 + e * 6.28) * 0.04 - uVoo * 0.05 * (c - 0.5);
    tamanho = 220.0 + 300.0 * c;
    alfa = 0.06 * (0.4 + c);
    cor = vec3(0.86, 0.72, 0.48);
    pesoDaProfundidade = 0.0;
  } else if (uTipo == 3) {
    pos.y *= 0.62;
    pos += vec2(sin(t * 0.31 * (0.5 + c) + e * 6.28), cos(t * 0.23 * (0.5 + e) + c * 6.28)) * 0.018;
    alfa = pow(0.5 + 0.5 * sin(t * (0.5 + c * 0.9) + e * 6.28), 3.0);
    tamanho = 2.5 + 3.5 * c;
    cor = vec3(0.86, 0.96, 0.48);
  } else if (uTipo == 4) {
    pos.y = fract(b + t * (0.012 + 0.03 * c));
    pos.x += sin(t * 0.45 + e * 6.28) * 0.012;
    alfa = 0.6 * smoothstep(0.0, 0.15, pos.y) * smoothstep(1.0, 0.7, pos.y);
    tamanho = 1.5 + 2.5 * c;
    cor = vec3(0.98, 0.80, 0.46);
  } else if (uTipo == 5) {
    pos = vec2(fract(a + t * 0.004 * (c - 0.5)) * 1.3 - 0.15, 0.1 + b * 0.55 + sin(t * 0.05 + e * 6.0) * 0.02);
    tamanho = 280.0 + 300.0 * c;
    alfa = 0.05;
    cor = vec3(0.55, 0.64, 0.80);
    pesoDaProfundidade = 0.0;
  } else if (uTipo == 6) {
    pos += vec2(sin(t * 0.09 + e * 6.28), cos(t * 0.07 + c * 6.28)) * 0.015;
    tamanho = 16.0 + 42.0 * c;
    alfa = 0.10 + 0.10 * e;
    cor = vec3(1.0, 0.64, 0.32);
  }
  vec2 uvImagem = imagemDaTela(pos, uCena, uFoco);
  float d = texture(uProf, vec2(uvImagem.x, 1.0 - uvImagem.y)).r;
  tamanho *= mix(1.0, 0.45 + 1.1 * d, pesoDaProfundidade);
  vec2 borda = smoothstep(vec2(-0.2), vec2(0.04), pos) * smoothstep(vec2(1.2), vec2(0.96), pos);
  gl_Position = vec4(pos * 2.0 - 1.0, 0.0, 1.0);
  gl_PointSize = min(tamanho * uDpr, uTamanhoMaximo);
  vAlfa = alfa * uAlfa * borda.x * borda.y;
  vCor = cor;
}`;

export const FRAGMENTO_DAS_PARTICULAS = `#version 300 es
precision highp float;
in float vAlfa;
in vec3 vCor;
out vec4 corFinal;
void main() {
  float r = length(gl_PointCoord * 2.0 - 1.0);
  float m = smoothstep(1.0, 0.0, r);
  m *= m;
  corFinal = vec4(vCor * m * vAlfa, 0.0);
}`;

export const TIPO_DE_PARTICULA: Record<string, number> = {
  'nevoa-densa': 1,
  'nevoa-rala': 2,
  'vaga-lumes': 3,
  'po-dourado': 4,
  fumaca: 5,
  bokeh: 6,
};
