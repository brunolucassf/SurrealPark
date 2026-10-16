import { createServer } from 'node:http';
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import sharp from 'sharp';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const HERO = join(RAIZ, 'src', 'assets', 'fotos', 'nomad', 'nomad-home-hero.jpg');
const SIMBOLO = join(RAIZ, '_entrada', 'marca', 'surreal-simbolo.svg');
const SAIDA = join(RAIZ, 'public', 'og', 'compartilhamento-1200x630.jpg');
const NAVEGADOR = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const LARGURA = 1200;
const ALTURA = 630;

const MIME = { '.css': 'text/css', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' };

function montarPagina(simboloSvg) {
  return `<!doctype html>
<html><head><meta charset="utf-8">
<link rel="stylesheet" href="/fonts/fonts.css">
<style>
  html, body { margin: 0; width: ${LARGURA}px; height: ${ALTURA}px; overflow: hidden; background: #0C0B0D; }
  .quadro { position: relative; width: ${LARGURA}px; height: ${ALTURA}px; background: url(/hero.jpg) center / cover no-repeat; }
  .scrim { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(12,11,13,.94) 0%, rgba(12,11,13,.6) 44%, rgba(12,11,13,0) 74%); }
  .conteudo { position: absolute; left: 72px; top: 0; bottom: 0; display: flex; flex-direction: column; justify-content: center; gap: 18px; }
  .simbolo { width: 96px; height: auto; color: #D6A24A; }
  .simbolo svg { display: block; width: 100%; height: auto; }
  .numero { font-family: "Kalnia", Georgia, serif; font-weight: 600; font-size: 230px; line-height: .9; color: #D6A24A; margin: 0; }
  .legenda { font-family: "DM Mono", ui-monospace, monospace; font-weight: 500; font-size: 28px; letter-spacing: .04em; text-transform: uppercase; color: #F4EFE6; margin: 0; }
</style></head>
<body>
<div class="quadro">
  <div class="scrim"></div>
  <div class="conteudo">
    <div class="simbolo">${simboloSvg}</div>
    <p class="numero">#10</p>
    <p class="legenda">DJ Mag Top 100 Clubs 2026</p>
  </div>
</div>
</body></html>`;
}

async function iniciarServidor(pagina) {
  const servidor = createServer(async (requisicao, resposta) => {
    const caminho = decodeURIComponent(new URL(requisicao.url, 'http://localhost').pathname);
    try {
      if (caminho === '/') {
        resposta.writeHead(200, { 'Content-Type': 'text/html' });
        resposta.end(pagina);
        return;
      }
      const arquivo = caminho === '/hero.jpg' ? HERO : join(RAIZ, 'public', caminho);
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
  const simboloSvg = (await readFile(SIMBOLO, 'utf8')).replace(/<svg /, '<svg style="width:100%;height:auto" ');
  const servidor = await iniciarServidor(montarPagina(simboloSvg));
  const navegador = await puppeteer.launch({
    executablePath: NAVEGADOR,
    headless: true,
    args: ['--font-render-hinting=none'],
  });
  try {
    const pagina = await navegador.newPage();
    await pagina.setViewport({ width: LARGURA, height: ALTURA, deviceScaleFactor: 1 });
    await pagina.goto(`http://127.0.0.1:${servidor.address().port}/`, { waitUntil: 'networkidle0' });
    await pagina.evaluate(() => document.fonts.ready);
    const png = await pagina.screenshot({ type: 'png', clip: { x: 0, y: 0, width: LARGURA, height: ALTURA } });
    await mkdir(dirname(SAIDA), { recursive: true });
    await sharp(png).jpeg({ quality: 88, mozjpeg: true }).toFile(SAIDA);
  } finally {
    await navegador.close();
    servidor.close();
  }
  console.log(`compartilhamento-1200x630.jpg gerado (${LARGURA}x${ALTURA})`);
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
