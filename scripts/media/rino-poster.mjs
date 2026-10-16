import { createServer } from 'node:http';
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import sharp from 'sharp';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const MODELO = join(RAIZ, 'public', 'models', 'rino.glb');
const POSTER = join(RAIZ, 'public', 'models', 'rino-poster.webp');
const NAVEGADOR = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const LADO = 1200;
const FUNDO = '#0C0B0D';

const MIME = { '.js': 'text/javascript', '.glb': 'model/gltf-binary', '.html': 'text/html' };

const PAGINA = `<!doctype html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;background:${FUNDO}">
<script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const LADO = ${LADO};
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(LADO, LADO);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const cena = new THREE.Scene();
cena.background = new THREE.Color('${FUNDO}');

const ambiente = new THREE.Scene();
const materialEmissivoOuro = new THREE.MeshBasicMaterial({ color: new THREE.Color('#FFC27A').multiplyScalar(3) });
const materialEmissivoPrata = new THREE.MeshBasicMaterial({ color: new THREE.Color('#DDE3EE').multiplyScalar(2) });
[[-3, 2, -2, materialEmissivoOuro], [3, 1, -2, materialEmissivoOuro], [0, 3, 3, materialEmissivoOuro], [1, -2, 3, materialEmissivoPrata]]
  .forEach(([x, y, z, material]) => {
    const esfera = new THREE.Mesh(new THREE.SphereGeometry(1.2, 24, 16), material);
    esfera.position.set(x, y, z);
    ambiente.add(esfera);
  });
const pmrem = new THREE.PMREMGenerator(renderer);
cena.environment = pmrem.fromScene(ambiente, 0.04).texture;

const luzChave = new THREE.PointLight(new THREE.Color('#FFC27A'), 30, 0, 2);
luzChave.position.set(-2.4, 2.2, 2.6);
const luzContorno = new THREE.DirectionalLight(new THREE.Color('#8FA3D6'), 0.6);
luzContorno.position.set(2.5, 1, -3);
cena.add(luzChave, luzContorno, new THREE.AmbientLight(0xffffff, 0.04));

const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 100);

const carregador = new GLTFLoader();
carregador.setMeshoptDecoder(MeshoptDecoder);
carregador.load('/models/rino.glb', (gltf) => {
  const modelo = gltf.scene;
  modelo.traverse((objeto) => {
    if (!objeto.isMesh) return;
    const original = objeto.material;
    objeto.material = new THREE.MeshPhysicalMaterial({
      map: original.map,
      color: new THREE.Color().lerpColors(new THREE.Color('#FFFFFF'), new THREE.Color('#C8955A'), 0.3),
      metalness: 0.85,
      roughness: 0.7,
      roughnessMap: original.roughnessMap,
      clearcoat: 0.2,
      clearcoatRoughness: 0.4,
      envMapIntensity: 0.6,
    });
  });
  const caixa = new THREE.Box3().setFromObject(modelo);
  const centro = caixa.getCenter(new THREE.Vector3());
  const raio = caixa.getBoundingSphere(new THREE.Sphere()).radius;
  modelo.position.sub(centro);
  cena.add(modelo);
  const distancia = (raio / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2))) * 0.8;
  camera.position.set(0, 0, distancia);
  camera.lookAt(0, 0, 0);
  camera.aspect = 1;
  camera.updateProjectionMatrix();
  renderer.render(cena, camera);
  window.__pronto = renderer.domElement.toDataURL('image/png');
}, undefined, (erro) => {
  window.__erro = String(erro);
});
</script>
</body></html>`;

async function iniciarServidor() {
  const servidor = createServer(async (requisicao, resposta) => {
    const caminho = decodeURIComponent(new URL(requisicao.url, 'http://localhost').pathname);
    if (caminho === '/') {
      resposta.writeHead(200, { 'Content-Type': 'text/html' });
      resposta.end(PAGINA);
      return;
    }
    const arquivo = caminho.startsWith('/models/')
      ? join(RAIZ, 'public', caminho)
      : join(RAIZ, 'node_modules', caminho);
    try {
      const conteudo = await readFile(arquivo);
      resposta.writeHead(200, { 'Content-Type': MIME[extname(arquivo)] ?? 'application/octet-stream' });
      resposta.end(conteudo);
    } catch {
      resposta.writeHead(404);
      resposta.end();
    }
  });
  await new Promise((resolver) => servidor.listen(0, '127.0.0.1', resolver));
  return servidor;
}

async function main() {
  const servidor = await iniciarServidor();
  const porta = servidor.address().port;
  const navegador = await puppeteer.launch({
    executablePath: NAVEGADOR,
    headless: true,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  try {
    const pagina = await navegador.newPage();
    await pagina.setViewport({ width: LADO, height: LADO, deviceScaleFactor: 1 });
    await pagina.goto(`http://127.0.0.1:${porta}/`);
    await pagina.waitForFunction(() => window.__pronto || window.__erro, { timeout: 180000 });
    const erro = await pagina.evaluate(() => window.__erro);
    if (erro) throw new Error(erro);
    const dataUrl = await pagina.evaluate(() => window.__pronto);
    const png = Buffer.from(dataUrl.split(',')[1], 'base64');
    await mkdir(dirname(POSTER), { recursive: true });
    await sharp(png).resize(LADO, LADO).webp({ quality: 85 }).toFile(POSTER);
  } finally {
    await navegador.close();
    servidor.close();
  }
  console.log(`rino-poster.webp gerado (${LADO}x${LADO})`);
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
