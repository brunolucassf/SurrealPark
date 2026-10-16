import type { APIRoute } from 'astro';
import { IS_DEMONSTRACAO } from '@/data/demonstracao';

export const GET: APIRoute = ({ site }) => {
  const linhas = IS_DEMONSTRACAO
    ? ['User-agent: *', 'Disallow: /']
    : ['User-agent: *', 'Allow: /', '', `Sitemap: ${new URL('/sitemap-index.xml', site).href}`];
  return new Response(`${linhas.join('\n')}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
