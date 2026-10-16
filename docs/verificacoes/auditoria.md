# Auditoria consolidada · 2026-10-16
Fontes: qa.md, seo.md, seguranca.md, privacidade.md, lh-*.json, npm-audit.txt. Scripts: build 29 páginas OK · astro check 0 erros · npm audit 0 · Lighthouse mobile (a11y/SEO/best-practices 100; perf 76-88).

| # | Sev. | Achado | Evidência | Dono | Correção |
|---|------|--------|-----------|------|----------|
| 1 | Bloqueante (publicar) | Exemplos fictícios aparecem como fato em produção (eventos, galeria, produtos); selo só em dev | EventoLinha:43, PosterDestaque:46, CartaoDeProduto:32, CarrosselDeEventos:67,79 | Frontend | Flag IS_DEMONSTRACAO: selos visíveis + noindex enquanto true; ao virar false, exemplos somem |
| 2 | Alto | CTA do hero/cabeçalho aponta para evento fictício/links genéricos | QA | Frontend | CTAs levam a /programacao; link externo só se evento real com ingresso_url |
| 3 | Alto | /privacidade 404 | QA/SEO | Privacy | FEITO (src/pages/privacidade.astro); rebuild |
| 4 | Alto | canonical/og:url da Home = /index; 404 = /404 sem noindex; sem robots.txt | Base.astro:29 | SEO/Frontend | corrigir, criar robots.txt |
| 5 | Alto | Sitemap lista /galeria/[slug] e /loja/* de exemplo; /loja indexável | SEO | SEO/Frontend | indexacao.ts + sitemap filter + prop indexar |
| 6 | Alto | alt da galeria "foto 14 de 14" (ordem lida após await) | acervoDaGaleria.ts:103-118 | Frontend | corrigir |
| 7 | Médio | LCP 2,9-3,2 s e TBT 370-710 ms (loader, shader do fundo no load, GSAP da Home, tour) | seo.md | Frontend | fundo WebGL em idle, GSAP dinâmico, tour só na viewport, loader curto na Home e só 1ª visita |
| 8 | Médio | 2 px de overflow horizontal na Home 390 px (.datas__veu, .aviao__foto) | QA | Frontend | corrigir |
| 9 | Médio | WhatsApp e meta description da Loja citam compra/preço fictício; texto /o-parque#loja ("a caminho") incoerente | QA/Loja | Frontend | reescrever |
| 10 | Médio | Fotos do tour sem crédito (Ebraim Martini, Diego Jarschel) | privacidade.md | Frontend | crédito discreto |
| 11 | Médio | ingresso_url aceita javascript: | content.config.ts:18 | Frontend | restringir a https |
| 12 | Médio | remover `en` de i18n.locales (sem versão EN); OG alt e twitter:* faltando | seo.md | SEO | corrigir |
| 13 | Baixo | 4 itens de INDICE_DO_PARQUE sem cena; vazio em Contato 1920; warning WebGL ReadPixels | QA | Frontend | corrigir se barato |
| 14 | Cliente | "maior club do mundo" (tour.ts:309), ranking DJ Mag, 12 mil pessoas, dados de Maitê/Ratier, razão social/CNPJ/encarregado, direito de imagem, nomes dos espaços, catálogo real, eventos reais, foto do touro | privacidade.md | Bruno/cliente | lista de pendências |
| 15 | Deploy | Cabeçalhos de segurança (CSP em Report-Only primeiro), MultiViews/rewrite (build.format file), PUBLIC_SITE_URL real, reconfirmar licença GSAP | seguranca.md | DevOps | só com "pode publicar" |
| 16 | Não verificado | lightbox, tour mobile/reduced-motion, contraste do tema claro do Contato, ortografia completa | qa.md | QA | 2ª rodada curta de regressão |

Segurança: sem achado crítico/alto. Segredos: nenhum.
