# Decisões

## ADR-001 · Stack do site (2026-10-15)

**Contexto.** Site institucional público de 6 páginas, sem login, banco ou pagamento. Prioridades: impacto visual máximo (direção "Eclipse"), LCP < 2,5 s no celular, transições de página nativas entre documentos (View Transitions cross-document), um único momento 3D, agenda em dados estruturados prontos para CMS e i18n PT-BR com EN preparado. Mantido por uma pessoa (Bruno).

**Matriz (peso 1-3, nota 1-5)**

| Critério | Peso | Astro 7 | Next.js 16 | Vite + HTML puro |
|---|---|---|---|---|
| Adequação (MPA de conteúdo, View Transitions entre documentos) | 3 | 5 | 3 | 4 |
| Performance padrão (zero JS por padrão, ilhas) | 3 | 5 | 3 | 5 |
| Produtividade (componentes, content collections, i18n, imagens) | 2 | 5 | 4 | 2 |
| Ecossistema e mercado | 2 | 4 | 5 | 3 |
| Operação e custo (estático, qualquer CDN) | 2 | 5 | 4 | 5 |
| Caminho para e-commerce da Loja | 1 | 4 | 5 | 2 |
| **Total** | | **63** | **51** | **49** |

**Decisão.** Astro 7 em saída estática; TypeScript estrito; CSS próprio com custom properties a partir de docs/DESIGN-SYSTEM.md (sem framework de CSS); GSAP 3.15 (ScrollTrigger, SplitText, MorphSVG, Flip, CustomEase); Lenis apenas em desktop com ponteiro fino; Three.js carregado sob demanda só para o rinoceronte; `astro:assets` + sharp para AVIF/WebP responsivos; content collections para eventos e galeria; @astrojs/sitemap.

**Descartadas.** Next.js 16: o roteamento cliente anula o View Transitions cross-document que a direção usa e envia mais JS por padrão. HTML puro com Vite: perde componentes, coleções tipadas e pipeline de imagem.

**Consequências.** Hospedagem estática (Vercel, Netlify, Cloudflare Pages ou Hostinger). A Loja futura entra como ilha ou integração headless (por exemplo, Shopify Storefront) sem trocar a stack. Node 22+ exigido.

**Fontes.** npm registry consultado em 2026-10-15 (astro 7.4.0, gsap 3.15.0, three 0.186.1, lenis 1.3.27, sharp 0.35.5, next 16.4.2); astro.build/blog/whats-new-april-2026.
