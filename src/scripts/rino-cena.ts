import {
  ACESFilmicToneMapping,
  AmbientLight,
  Box3,
  Color,
  DirectionalLight,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PMREMGenerator,
  PointLight,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  Vector3,
  WebGLRenderer,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

export interface CenaDoRino {
  definirAtiva: (isAtiva: boolean) => void;
  destruir: () => void;
}

interface OpcoesDaCena {
  alvo: HTMLElement;
  secao: HTMLElement;
  lanterna: HTMLElement | null | undefined;
  isGiroAutomatico: boolean;
  isArcosOrbitais?: boolean;
}

const URL_DO_MODELO = '/models/rino.glb';
const ALTURA_DO_MODELO = 2;
const GIRO_OCIOSO = 0.12;
const AMORTECIMENTO = 0.92;
const DURACAO_DO_ACENDER = 0.968;
const ARCOS: { cor: string; raio: number; inclinacao: number; velocidade: number }[] = [
  { cor: '#D6A24A', raio: 1.55, inclinacao: 1.15, velocidade: 0.35 },
  { cor: '#C3CEDC', raio: 1.8, inclinacao: -0.75, velocidade: -0.25 },
  { cor: '#6B6A70', raio: 2.05, inclinacao: 0.3, velocidade: 0.18 },
];

function criarArcosOrbitais(): Group {
  const grupo = new Group();
  for (const { cor, raio, inclinacao, velocidade } of ARCOS) {
    const material = new MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.85 });
    const arco = new Mesh(new TorusGeometry(raio, 0.012, 8, 160, Math.PI * 1.3), material);
    arco.rotation.x = inclinacao;
    arco.userData.velocidade = velocidade;
    grupo.add(arco);
  }
  return grupo;
}

function criarAmbiente(renderizador: WebGLRenderer): Scene['environment'] {
  const cenaDoAmbiente = new Scene();
  cenaDoAmbiente.background = new Color('#0C0B0D');
  const esfera = new SphereGeometry(1, 24, 16);
  const luzes: [string, number, [number, number, number]][] = [
    ['#E6BD6E', 6, [4, 3, 3]],
    ['#D6A24A', 4, [-4, 2, 2]],
    ['#F0D49A', 3, [0, 5, -3]],
    ['#C3CEDC', 3, [3, 1, -5]],
  ];
  for (const [cor, forca, posicao] of luzes) {
    const material = new MeshBasicMaterial({ color: new Color(cor).multiplyScalar(forca) });
    const malha = new Mesh(esfera, material);
    malha.position.set(...posicao);
    cenaDoAmbiente.add(malha);
  }
  const gerador = new PMREMGenerator(renderizador);
  const textura = gerador.fromScene(cenaDoAmbiente, 0.04).texture;
  gerador.dispose();
  return textura;
}

function aplicarBronze(raiz: Group): void {
  const corDoBronze = new Color('#FFFFFF').lerp(new Color('#C8955A'), 0.3);
  raiz.traverse((objeto) => {
    if (!(objeto instanceof Mesh) || !(objeto.material instanceof MeshStandardMaterial)) return;
    const original = objeto.material;
    objeto.material = new MeshPhysicalMaterial({
      map: original.map,
      roughnessMap: original.roughnessMap,
      color: corDoBronze,
      metalness: 0.85,
      roughness: 0.62,
      clearcoat: 0.2,
      clearcoatRoughness: 0.4,
      envMapIntensity: 0.6,
    });
    original.dispose();
  });
}

function calcularAcendimento(segundos: number): number {
  if (segundos >= DURACAO_DO_ACENDER) return 1;
  const base = segundos / DURACAO_DO_ACENDER;
  const isQueda = (segundos > 0.3 && segundos < 0.36) || (segundos > 0.55 && segundos < 0.61);
  return isQueda ? base * 0.2 : base;
}

export async function criarCenaDoRino({ alvo, secao, lanterna, isGiroAutomatico, isArcosOrbitais = false }: OpcoesDaCena): Promise<CenaDoRino> {
  const isToque = window.matchMedia('(pointer: coarse)').matches;
  const renderizador = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderizador.setPixelRatio(Math.min(window.devicePixelRatio, isToque ? 1.25 : 1.5));
  renderizador.toneMapping = ACESFilmicToneMapping;
  renderizador.toneMappingExposure = 1;
  renderizador.outputColorSpace = SRGBColorSpace;
  renderizador.setClearColor(0x000000, 0);

  const cena = new Scene();
  cena.environment = criarAmbiente(renderizador);
  const camera = new PerspectiveCamera(30, 1, 0.1, 50);

  const carregador = new GLTFLoader();
  carregador.setMeshoptDecoder(MeshoptDecoder);
  const gltf = await carregador.loadAsync(URL_DO_MODELO);
  const modelo = gltf.scene;
  aplicarBronze(modelo);

  const caixa = new Box3().setFromObject(modelo);
  const tamanho = caixa.getSize(new Vector3());
  const centro = caixa.getCenter(new Vector3());
  const escala = ALTURA_DO_MODELO / tamanho.y;
  modelo.scale.setScalar(escala);
  modelo.position.copy(centro.multiplyScalar(-escala));
  const pivo = new Group();
  pivo.add(modelo);
  cena.add(pivo);
  const arcos = isArcosOrbitais ? criarArcosOrbitais() : null;
  if (arcos) cena.add(arcos);

  const distancia = (ALTURA_DO_MODELO / 2 / Math.tan((15 * Math.PI) / 180)) * 1.18;
  camera.position.set(0, 0.15, distancia);
  camera.lookAt(0, 0, 0);

  const luzPrincipal = new PointLight('#FFC27A', 0, 0, 2);
  luzPrincipal.position.set(1.4, 1.2, 2.6);
  const contraluz = new DirectionalLight('#8FA3D6', 0.6);
  contraluz.position.set(2.5, 2, -3);
  cena.add(luzPrincipal, contraluz, new AmbientLight('#FFFFFF', 0.04));
  const INTENSIDADE_DA_PRINCIPAL = 42;

  alvo.append(renderizador.domElement);
  const ajustarTamanho = () => {
    const { width: largura, height: altura } = alvo.getBoundingClientRect();
    if (!largura || !altura) return;
    renderizador.setSize(largura, altura, false);
    camera.aspect = largura / altura;
    camera.updateProjectionMatrix();
  };
  ajustarTamanho();
  const observadorDeTamanho = new ResizeObserver(ajustarTamanho);
  observadorDeTamanho.observe(alvo);

  const alvoDaLuz = new Vector3(1.4, 1.2, 2.6);
  const estado = { velocidade: 0, isArrastando: false, ultimoX: 0, angulo: 0, inicio: 0, isAtiva: false, isVisivel: true, quadro: 0, anterior: 0 };

  const moverLuz = (evento: PointerEvent) => {
    if (isToque) return;
    const caixaDaSecao = secao.getBoundingClientRect();
    const nx = ((evento.clientX - caixaDaSecao.left) / caixaDaSecao.width) * 2 - 1;
    const ny = ((evento.clientY - caixaDaSecao.top) / caixaDaSecao.height) * 2 - 1;
    alvoDaLuz.set(nx * 3, -ny * 2 + 0.6, 2.6);
    if (lanterna) lanterna.style.transform = `translate(${nx * 12}vmin, ${ny * 10}vmin)`;
  };
  secao.addEventListener('pointermove', moverLuz, { passive: true });

  const canvas = renderizador.domElement;
  canvas.addEventListener('pointerdown', (evento) => {
    estado.isArrastando = true;
    estado.ultimoX = evento.clientX;
    estado.velocidade = 0;
    canvas.setPointerCapture(evento.pointerId);
  });
  canvas.addEventListener('pointermove', (evento) => {
    if (!estado.isArrastando) return;
    const delta = evento.clientX - estado.ultimoX;
    estado.ultimoX = evento.clientX;
    estado.velocidade = delta * 0.006;
    pivo.rotation.y += estado.velocidade;
  });
  const soltar = () => { estado.isArrastando = false; };
  canvas.addEventListener('pointerup', soltar);
  canvas.addEventListener('pointercancel', soltar);

  const renderizarQuadro = (agora: number) => {
    const segundos = (agora - estado.inicio) / 1000;
    const delta = Math.min((agora - (estado.anterior || agora)) / 1000, 0.05);
    estado.anterior = agora;
    if (!estado.isArrastando) {
      estado.velocidade *= AMORTECIMENTO;
      pivo.rotation.y += estado.velocidade + (isGiroAutomatico ? GIRO_OCIOSO * delta : 0);
    }
    if (arcos) for (const arco of arcos.children) arco.rotation.z += (arco.userData.velocidade as number) * delta;
    if (isToque) {
      estado.angulo += delta * 0.4;
      alvoDaLuz.set(Math.sin(estado.angulo) * 2.6, 1.1, Math.cos(estado.angulo) * 1.2 + 2.2);
    }
    luzPrincipal.position.lerp(alvoDaLuz, 0.08);
    luzPrincipal.intensity = INTENSIDADE_DA_PRINCIPAL * (isGiroAutomatico ? calcularAcendimento(segundos) : 1);
    renderizador.render(cena, camera);
  };

  const laco = (agora: number) => {
    renderizarQuadro(agora);
    estado.quadro = estado.isAtiva && estado.isVisivel && !document.hidden ? requestAnimationFrame(laco) : 0;
  };
  const retomar = () => {
    if (!estado.quadro && estado.isAtiva && estado.isVisivel && !document.hidden) {
      estado.anterior = 0;
      estado.quadro = requestAnimationFrame(laco);
    }
  };

  const observadorDeVisao = new IntersectionObserver(([entrada]) => {
    estado.isVisivel = Boolean(entrada?.isIntersecting);
    retomar();
  });
  observadorDeVisao.observe(secao);
  document.addEventListener('visibilitychange', retomar);

  estado.inicio = performance.now();
  renderizarQuadro(estado.inicio);

  return {
    definirAtiva: (isAtiva) => {
      estado.isAtiva = isAtiva;
      if (isAtiva && !estado.inicio) estado.inicio = performance.now();
      retomar();
    },
    destruir: () => {
      estado.isAtiva = false;
      cancelAnimationFrame(estado.quadro);
      observadorDeTamanho.disconnect();
      observadorDeVisao.disconnect();
      document.removeEventListener('visibilitychange', retomar);
      secao.removeEventListener('pointermove', moverLuz);
      cena.traverse((objeto) => {
        if (!(objeto instanceof Mesh)) return;
        objeto.geometry.dispose();
        for (const material of [objeto.material].flat()) material.dispose();
      });
      renderizador.dispose();
      canvas.remove();
    },
  };
}
