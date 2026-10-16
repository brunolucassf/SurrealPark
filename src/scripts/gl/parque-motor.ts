import { converterHexEmRgb, criarContexto, criarPrograma, criarTrianguloDeTela, desenharTela, type Programa } from './motor';
import { FRAGMENTO_DA_CENA, FRAGMENTO_DAS_PARTICULAS, TIPO_DE_PARTICULA, VERTICE_DAS_PARTICULAS } from './parque-shaders';
import { FORMAS, type IdDaForma } from '@/data/formas';
import type { CenaParaOMotor } from '@/data/tour';

export interface EstadoDaCena {
  indice: number;
  z: number;
  escala: number;
  luz: number;
  vies: number;
  desloc: [number, number];
}

export interface EstadoDoQuadro {
  a: EstadoDaCena;
  b: EstadoDaCena | null;
  portal: { escala: number; aro: number; tipo: 0 | 1 | 2; progresso: number; cobertura: number; forma: IdDaForma | null };
  nuvem: number;
  saida: number;
  voo: number;
  particulas: { indice: number; alfa: number };
}

export interface MotorDoParque {
  desenhar: (estado: EstadoDoQuadro, segundos: number, ponteiro: [number, number]) => void;
  manterApenas: (indices: number[]) => void;
  carregar: (indice: number) => void;
  liberarTexturas: () => void;
  definirDpr: (dpr: number) => void;
  focoNaTela: (indice: number) => [number, number];
  destruir: () => void;
  isPronta: (indice: number) => boolean;
}

interface TexturasDaCena {
  foto: WebGLTexture | null;
  prof: WebGLTexture | null;
  carga: number;
  isCarregando: boolean;
  isCancelada: boolean;
}

const LADO_DA_MASCARA = 1024;
const MARGEM_DA_MASCARA = 0.1;
const FATOR_DE_RESOLUCAO = 1.1;
const DURACAO_DA_CARGA_S = 0.6;
const MAXIMO_DE_MASCARAS = 2;
const NEVOA_POR_TIPO: Record<CenaParaOMotor['tipo'], number> = { aereo: 0.22, caminho: 0.16, palco: 0.12, lago: 0.2, jardim: 0.14, jet: 0.1 };

function proporcaoDaForma(forma: IdDaForma): [number, number] {
  if (forma === 'f-olho') return [2, 1];
  if (forma === 'f-raw-room') return [1, 1];
  if (forma === 'f-ritual' || forma === 'f-nomad') return [5, 4];
  return [4, 5];
}

function rasterizarForma(forma: IdDaForma): HTMLCanvasElement | OffscreenCanvas {
  const tela = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(LADO_DA_MASCARA, LADO_DA_MASCARA) : Object.assign(document.createElement('canvas'), { width: LADO_DA_MASCARA, height: LADO_DA_MASCARA });
  const contexto = tela.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
  if (!contexto) return tela;
  const [largura, altura] = proporcaoDaForma(forma);
  const util = LADO_DA_MASCARA * (1 - MARGEM_DA_MASCARA * 2);
  const escala = util / Math.max(largura, altura);
  const w = largura * escala;
  const h = altura * escala;
  contexto.fillStyle = '#000';
  contexto.fillRect(0, 0, LADO_DA_MASCARA, LADO_DA_MASCARA);
  contexto.setTransform(w, 0, 0, h, (LADO_DA_MASCARA - w) / 2, (LADO_DA_MASCARA - h) / 2);
  contexto.fillStyle = '#fff';
  contexto.fill(new Path2D(FORMAS[forma]));
  return tela;
}

async function baixarBitmap(url: string, sinal: AbortSignal): Promise<ImageBitmap> {
  const resposta = await fetch(url, { signal: sinal });
  if (!resposta.ok) throw new Error(String(resposta.status));
  return createImageBitmap(await resposta.blob());
}

function escolherFoto(cena: CenaParaOMotor, dpr: number): string | null {
  if (cena.fotos.length === 0) return null;
  const alvo = window.innerWidth * dpr * FATOR_DE_RESOLUCAO;
  const ordenadas = [...cena.fotos].sort((x, y) => x.largura - y.largura);
  return (ordenadas.find((foto) => foto.largura >= alvo) ?? ordenadas[ordenadas.length - 1])?.url ?? null;
}

export function criarMotorDoParque(canvas: HTMLCanvasElement, cenas: CenaParaOMotor[], dprInicial: number): MotorDoParque | null {
  const gl = criarContexto(canvas, { alpha: true, powerPreference: 'high-performance' });
  if (!gl) return null;
  let programaDaCena: Programa;
  let programaDasParticulas: Programa;
  try {
    programaDaCena = criarPrograma(gl, FRAGMENTO_DA_CENA);
    programaDasParticulas = criarPrograma(gl, FRAGMENTO_DAS_PARTICULAS, VERTICE_DAS_PARTICULAS);
  } catch {
    return null;
  }
  const triangulo = criarTrianguloDeTela(gl);
  const vaoVazio = gl.createVertexArray();
  const tamanhoMaximoDoPonto = (gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) as Float32Array)[1] ?? 64;
  let dpr = dprInicial;
  let ultimoTempo = 0;
  const controlador = new AbortController();

  const criarTexturaVazia = (dados: Uint8Array, altura: number, formato: 'r' | 'rgba') => {
    const textura = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textura);
    if (formato === 'r') gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, 1, altura, 0, gl.RED, gl.UNSIGNED_BYTE, dados);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, altura, 0, gl.RGBA, gl.UNSIGNED_BYTE, dados);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return textura;
  };
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  const texturaPreta = criarTexturaVazia(new Uint8Array([12, 11, 13, 255]), 1, 'rgba');
  const gradienteDeProfundidade = criarTexturaVazia(Uint8Array.from({ length: 256 }, (_, indice) => indice), 256, 'r');
  const mascaraVazia = criarTexturaVazia(new Uint8Array([0]), 1, 'r');

  const texturas = new Map<number, TexturasDaCena>();
  const mascaras = new Map<IdDaForma, WebGLTexture>();

  const enviarTextura = (fonte: TexImageSource, isFoto: boolean): WebGLTexture | null => {
    const textura = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textura);
    if (isFoto) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, fonte);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, gl.RED, gl.UNSIGNED_BYTE, fonte);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return textura;
  };

  const carregarCena = (indice: number) => {
    const cena = cenas[indice];
    if (!cena || texturas.has(indice)) return;
    const registro: TexturasDaCena = { foto: null, prof: null, carga: 0, isCarregando: true, isCancelada: false };
    texturas.set(indice, registro);
    const url = escolherFoto(cena, dpr);
    const tarefas = [
      url ? baixarBitmap(url, controlador.signal) : Promise.reject(new Error('sem foto')),
      cena.profundidade ? baixarBitmap(cena.profundidade, controlador.signal) : Promise.reject(new Error('sem profundidade')),
    ] as const;
    void Promise.allSettled(tarefas).then(([foto, prof]) => {
      registro.isCarregando = false;
      if (registro.isCancelada || gl.isContextLost()) {
        if (foto.status === 'fulfilled') foto.value.close();
        if (prof.status === 'fulfilled') prof.value.close();
        return;
      }
      if (foto.status === 'fulfilled') {
        registro.foto = enviarTextura(foto.value, true);
        foto.value.close();
      }
      if (prof.status === 'fulfilled') {
        registro.prof = enviarTextura(prof.value, false);
        prof.value.close();
      }
    });
  };

  const apagarCena = (indice: number) => {
    const registro = texturas.get(indice);
    if (!registro) return;
    registro.isCancelada = true;
    if (registro.foto) gl.deleteTexture(registro.foto);
    if (registro.prof) gl.deleteTexture(registro.prof);
    texturas.delete(indice);
  };

  const obterMascara = (forma: IdDaForma): WebGLTexture | null => {
    const existente = mascaras.get(forma);
    if (existente) return existente;
    if (mascaras.size >= MAXIMO_DE_MASCARAS) {
      const [primeira] = mascaras.keys();
      if (primeira) {
        gl.deleteTexture(mascaras.get(primeira) ?? null);
        mascaras.delete(primeira);
      }
    }
    const textura = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textura);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, gl.RED, gl.UNSIGNED_BYTE, rasterizarForma(forma));
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (textura) mascaras.set(forma, textura);
    return textura;
  };

  const ajustarTamanho = () => {
    const largura = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const altura = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== largura || canvas.height !== altura) {
      canvas.width = largura;
      canvas.height = altura;
    }
  };

  const focoNaTela = (indice: number): [number, number] => {
    const cena = cenas[indice];
    if (!cena) return [0.5, 0.5];
    const aspectoDaTela = canvas.clientWidth / Math.max(1, canvas.clientHeight);
    let x = cena.foco[0] - 0.5;
    let y = cena.foco[1] - 0.5;
    if (cena.aspecto > aspectoDaTela) x /= aspectoDaTela / cena.aspecto;
    else y /= cena.aspecto / aspectoDaTela;
    return [x + 0.5, y + 0.5];
  };

  const ligarTexturas = (unidade: number, textura: WebGLTexture | null, nome: string, programa: Programa) => {
    gl.activeTexture(gl.TEXTURE0 + unidade);
    gl.bindTexture(gl.TEXTURE_2D, textura);
    gl.uniform1i(programa.uniform(nome), unidade);
  };

  const enviarCena = (sufixo: 'A' | 'B', estado: EstadoDaCena, unidadeFoto: number, unidadeProf: number) => {
    const cena = cenas[estado.indice];
    const registro = texturas.get(estado.indice);
    const programa = programaDaCena;
    ligarTexturas(unidadeFoto, registro?.foto ?? texturaPreta, `uFoto${sufixo}`, programa);
    ligarTexturas(unidadeProf, registro?.prof ?? gradienteDeProfundidade, `uProf${sufixo}`, programa);
    gl.uniform4f(programa.uniform(`uCena${sufixo}`), cena?.aspecto ?? 1.5, estado.z, estado.escala, estado.vies);
    gl.uniform2fv(programa.uniform(`uFoco${sufixo}`), cena?.foco ?? [0.5, 0.5]);
    gl.uniform3fv(programa.uniform(`uCor${sufixo}`), converterHexEmRgb(cena?.cor ?? '#D6A24A'));
    const carga = registro?.foto ? registro.carga : 0;
    gl.uniform4f(programa.uniform(`uEstado${sufixo}`), estado.luz * carga, cena ? NEVOA_POR_TIPO[cena.tipo] : 0.15, cena?.relevo ?? 1, cena?.isVarredura ? 1 : 0);
  };

  const desenhar = (estado: EstadoDoQuadro, segundos: number, ponteiro: [number, number]) => {
    if (gl.isContextLost()) return;
    const delta = ultimoTempo ? Math.min(0.1, segundos - ultimoTempo) : 0;
    ultimoTempo = segundos;
    texturas.forEach((registro) => {
      if (registro.foto && registro.carga < 1) registro.carga = Math.min(1, registro.carga + delta / DURACAO_DA_CARGA_S);
    });
    ajustarTamanho();
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.disable(gl.BLEND);
    programaDaCena.usar();
    gl.uniform2f(programaDaCena.uniform('uRes'), canvas.width, canvas.height);
    gl.uniform1f(programaDaCena.uniform('uTempo'), segundos);
    gl.uniform1f(programaDaCena.uniform('uVoo'), estado.voo);
    gl.uniform2fv(programaDaCena.uniform('uPonteiro'), ponteiro);
    enviarCena('A', estado.a, 0, 1);
    enviarCena('B', estado.b ?? estado.a, 2, 3);
    gl.uniform2fv(programaDaCena.uniform('uFocoTelaA'), focoNaTela(estado.a.indice));
    gl.uniform2fv(programaDaCena.uniform('uDeslocB'), estado.b?.desloc ?? [0, 0]);
    const mascara = estado.portal.tipo === 1 && estado.portal.forma ? obterMascara(estado.portal.forma) : mascaraVazia;
    ligarTexturas(4, mascara, 'uMascara', programaDaCena);
    gl.uniform4f(programaDaCena.uniform('uPortal'), estado.portal.escala, estado.portal.aro, estado.b ? estado.portal.tipo : 0, estado.portal.progresso);
    gl.uniform1f(programaDaCena.uniform('uCobertura'), estado.portal.cobertura);
    gl.uniform1f(programaDaCena.uniform('uNuvem'), estado.nuvem);
    gl.uniform1f(programaDaCena.uniform('uSaida'), estado.saida);
    desenharTela(gl, triangulo);

    const cenaDasParticulas = cenas[estado.particulas.indice];
    const tipo = cenaDasParticulas ? TIPO_DE_PARTICULA[cenaDasParticulas.particulas.tipo] ?? 0 : 0;
    const registro = texturas.get(estado.particulas.indice);
    const alfa = estado.particulas.alfa * (registro?.carga ?? 0) * (1 - estado.saida);
    if (!cenaDasParticulas || !tipo || alfa < 0.01) return;
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ZERO, gl.ONE);
    programaDasParticulas.usar();
    const estadoDaCena = estado.particulas.indice === estado.a.indice ? estado.a : estado.b ?? estado.a;
    gl.uniform2f(programaDasParticulas.uniform('uRes'), canvas.width, canvas.height);
    gl.uniform1f(programaDasParticulas.uniform('uTempo'), segundos);
    gl.uniform1f(programaDasParticulas.uniform('uVoo'), estado.voo);
    gl.uniform1i(programaDasParticulas.uniform('uTipo'), tipo);
    gl.uniform1f(programaDasParticulas.uniform('uAlfa'), alfa);
    gl.uniform1f(programaDasParticulas.uniform('uDpr'), dpr);
    gl.uniform1f(programaDasParticulas.uniform('uTamanhoMaximo'), tamanhoMaximoDoPonto);
    gl.uniform4f(programaDasParticulas.uniform('uCena'), cenaDasParticulas.aspecto, estadoDaCena.z, estadoDaCena.escala, 0);
    gl.uniform2fv(programaDasParticulas.uniform('uFoco'), cenaDasParticulas.foco);
    ligarTexturas(0, registro?.prof ?? gradienteDeProfundidade, 'uProf', programaDasParticulas);
    gl.bindVertexArray(vaoVazio);
    gl.drawArrays(gl.POINTS, 0, cenaDasParticulas.particulas.n);
  };

  return {
    desenhar,
    manterApenas: (indices) => {
      [...texturas.keys()].forEach((indice) => { if (!indices.includes(indice)) apagarCena(indice); });
    },
    carregar: carregarCena,
    liberarTexturas: () => {
      [...texturas.keys()].forEach(apagarCena);
      mascaras.forEach((textura) => gl.deleteTexture(textura));
      mascaras.clear();
    },
    definirDpr: (valor) => { dpr = valor; },
    focoNaTela,
    isPronta: (indice) => Boolean(texturas.get(indice)?.foto),
    destruir: () => {
      controlador.abort();
      [...texturas.keys()].forEach(apagarCena);
      mascaras.forEach((textura) => gl.deleteTexture(textura));
      mascaras.clear();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
