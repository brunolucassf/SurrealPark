import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, sep } from 'node:path';

const DIST = 'dist';
const isDemonstracao = /IS_DEMONSTRACAO\s*=\s*true/.test(readFileSync('src/data/demonstracao.ts', 'utf8'));

const listarHtml = (pasta) =>
  readdirSync(pasta, { withFileTypes: true }).flatMap((item) => {
    const caminho = join(pasta, item.name);
    if (item.isDirectory()) return listarHtml(caminho);
    return item.name.endsWith('.html') ? [caminho] : [];
  });

const paginas = listarHtml(DIST).map((arquivo) => ({ arquivo, html: readFileSync(arquivo, 'utf8') }));
const urlsDoSitemap = readdirSync(DIST)
  .filter((nome) => /^sitemap.*\.xml$/.test(nome))
  .flatMap((nome) => [...readFileSync(join(DIST, nome), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]))
  .filter((url) => !/sitemap.*\.xml$/.test(url));

const erros = [];
const isNoindex = (html) => /<meta name="robots" content="noindex/.test(html);

if (isDemonstracao) {
  for (const { arquivo, html } of paginas) if (!isNoindex(html)) erros.push(`sem noindex em demonstração: ${arquivo}`);
  if (urlsDoSitemap.length > 0) erros.push(`sitemap com ${urlsDoSitemap.length} URL(s) em demonstração`);
  const robots = existsSync(join(DIST, 'robots.txt')) ? readFileSync(join(DIST, 'robots.txt'), 'utf8') : '';
  if (!/Disallow:\s*\/\s*$/m.test(robots)) erros.push('robots.txt sem Disallow: / em demonstração');
} else {
  for (const { arquivo, html } of paginas) {
    if (html.includes('selo-exemplo')) erros.push(`selo de exemplo em produção: ${arquivo}`);
  }
  for (const url of urlsDoSitemap) {
    const caminho = new URL(url).pathname.replace(/\/$/, '') || '/index';
    const pagina = paginas.find(({ arquivo }) => arquivo.replaceAll(sep, '/') === `${DIST}${caminho}.html`);
    if (!pagina) erros.push(`URL do sitemap sem página: ${url}`);
    else if (isNoindex(pagina.html)) erros.push(`URL noindex no sitemap: ${url}`);
  }
}

if (erros.length > 0) {
  console.error(erros.join('\n'));
  process.exit(1);
}
console.log(`indexação ok (${isDemonstracao ? 'demonstração' : 'produção'}, ${paginas.length} páginas, ${urlsDoSitemap.length} URLs no sitemap)`);
