# Relatório SEO técnico, performance e tracking · Surreal Park V2

Data: 2026-10-16. Escopo: dist/ (29 páginas), src/, Lighthouse mobile em .equipe/relatorios/lh-*.json. Nada foi editado.
Nota: src/pages/privacidade.astro existe mas dist/ é anterior a ela (sem privacidade.html); o rodapé já linka /privacidade (Rodape.astro:55). Rebuild obrigatório antes de qualquer verificação final.

## Tabela de achados

| Sev. | Achado | Evidência | Correção | Dono |
|---|---|---|---|---|
| Alta | Canonical da home sai como `https://surreal.art.br/index` (e og:url idem). Duplica a raiz. | src/layouts/Base.astro:29 (`replace(/\/$/,'') \|\| '/'` não trata `/index`); dist/index.html | Normalizar: `caminho.replace(/\/index$/,'') \|\| '/'` antes de `new URL`. Canonical da home deve ser `https://surreal.art.br/`. | SEO (Base.astro, head) |
| Alta | Sem robots.txt. | public/ (ausente) | Criar public/robots.txt: `User-agent: *`, `Allow: /`, `Sitemap: https://<dominio>/sitemap-index.xml`. Domínio vem do mesmo `PUBLIC_SITE_URL`; gerar via endpoint `src/pages/robots.txt.ts` para não divergir. | SEO |
| Alta | Galeria: 6 eventos 100% `isExemplo: true` (títulos, datas "27 de dezembro de 2025" etc. não confirmados) estão indexáveis, no sitemap, com title/description afirmando fatos. | src/data/eventosDaGaleria.ts (6x `isExemplo: true`); dist/galeria/*.html sem robots; dist/sitemap-0.xml | noindex nas 6 páginas `/galeria/[slug]` e em `/galeria` enquanto todos forem exemplo; ver "Automação" abaixo. | SEO + Maestro (flag) |
| Alta | `/loja/*` (16 produtos de exemplo) tem noindex (OK) mas continua no sitemap; `/loja` (listagem com nomes/preços fictícios) está indexável. Sinais contraditórios ao Google. | src/pages/loja/[slug].astro:58 (noindex); dist/sitemap-0.xml; src/pages/loja.astro:10 (`isCatalogoReal` só controla JSON-LD, não o robots) | Excluir do sitemap e aplicar noindex em `/loja` enquanto `!isCatalogoReal`. Product JSON-LD já é omitido para exemplo (loja/[slug].astro:37, correto) e OfferCatalog idem (loja.astro:12). Manter. | SEO |
| Alta | Alt de fotos da galeria sai como "Evento, Ambiente: foto 14 de 14" em TODAS as fotos (bug de contador). | src/components/galeria/acervoDaGaleria.ts:103-118: `ordem += 1` roda síncrono dentro do `map` async; ao ler na linha 118 `ordem` já é o total. dist/galeria/all-night-long.html | Capturar `const posicao = ordem` logo após o incremento (ou usar o índice do map) e usar `posicao` no alt. Mesmo assim o texto é rascunho: trocar por alt descritivo (ver alts). | Frontend (acervoDaGaleria.ts) |
| Média | Sitemap lista 16 `/loja/*` + 6 `/galeria/*` de exemplo; sem lastmod/priority; 404 e (futuramente) privacidade entram sem critério. | astro.config.mjs:10 `sitemap()` sem opções | `sitemap({ filter })` excluindo exemplos (ver Automação). Pode-se acrescentar `lastmod` por build. | SEO (astro.config.mjs) |
| Média | JSON-LD só na home (Organization, WebSite, NightClub+EventVenue; correto, sem Product/Event). Falta: BreadcrumbList nas internas, Event na Programação, geo/openingHours no local (pendentes do cliente), `@id` do NightClub e `location` ligado. | src/pages/index.astro:19-45; demais páginas sem `application/ld+json` | (1) BreadcrumbList em /o-parque, /programacao, /galeria, /contato, /loja. (2) Programação: Event gerado de `src/content/eventos` somente com `exemplo:false` e `status != encerrado`; `offers` só se houver `ingresso_url`, sem preço inventado; `eventStatus` coerente. Os 5 eventos atuais estão `exemplo:false`: confirmar com Bruno que são reais antes de emitir. (3) Event/Product/ImageGallery de exemplo nunca. (4) `logo` aponta para favicon.svg; Google prefere PNG/JPG >=112px: usar logo raster. | SEO (+ Maestro confirma eventos reais) |
| Média | 404 indexável e com canonical `/404`. Em hospedagem estática o 404.html é servido com status 404, mas melhor garantir. | dist/404.html; Base.astro:41 | Prop `indexar={false}` no Base para 404: `noindex` e sem canonical. Remover 404 do sitemap (já não está). | SEO |
| Média | OG/Twitter: falta `og:image:alt`, `og:image:type`, `twitter:title/description/image` (X cai no OG, mas explicitar é barato). Uma única imagem OG (94 KB, 1200x630) para todas as páginas. | Base.astro:49-58 | Adicionar `og:image:alt` e `twitter:*`; prop `imagemDeCompartilhamento` por página (palco por página; evento usa pôster quando houver). Conferir no depurador do Facebook/LinkedIn após publicar. | SEO |
| Média | `PUBLIC_SITE_URL` é placeholder: canonical, og:url, sitemap e JSON-LD saem com `surreal.art.br`. Se o domínio final for outro, tudo fica apontando errado. | astro.config.mjs:4 | Definir domínio real no build de produção; criar `.env.example` com `PUBLIC_SITE_URL`; checar `dist` após o build (grep do host). Decisão do cliente: www ou apex e redirect da outra. | Maestro/cliente |
| Média | hreflang: i18n `pt-BR/en` configurado, mas não existe nenhuma página EN. Sitemap/`<html lang>` fixos em pt-BR. | astro.config.mjs:17-21; Base.astro:34 | Não emitir hreflang agora (correto, nenhum emitido). Remover `en` de `locales` até haver tradução real, para o sitemap não gerar alternates vazios no futuro. Ao lançar /en: hreflang pt-BR, en, x-default recíprocos + canonical por idioma. | SEO |
| Baixa | Títulos e descriptions únicos e dentro do limite (títulos 40-52 car.; descriptions 110-155). Um H1 por página em todas. Hierarquia h1>h2>h3 sem saltos (home, o-parque com tour, galeria, contato, loja, programação). | grep em dist/*.html | Nenhuma. Observação: a loja tem 16 `h3` de produto antes dos demais `h2`; ok. | - |
| Baixa | Alts: 0 `<img>` sem atributo; vazios (`alt=""`) são decorativos: miniaturas 88px da home (cartaz__miniatura-img), painéis do carrossel da galeria (`painel__imagem`, 6) e 1 em contato (ritual-mesas-programacao). Home/o-parque/loja têm alts descritivos reais. Os alts de rascunho do manifest só afetam /galeria/[slug] (15 fotos/evento, ver bug acima). | dist/index.html, dist/galeria.html, dist/contato.html; src/components/galeria/acervoDaGaleria.ts:111 | Prioridade de redação: (1) fotos de /galeria/[slug] (hoje inúteis); (2) foto de mesas em /contato (vazia mas é conteúdo: dar alt); (3) painéis do carrossel só se o link já não tiver nome acessível equivalente. Redigir pelo copywriter, a partir do que a foto mostra. | Copy + Frontend |
| Baixa | Âncoras novas: `#geral` (contato), `#lago` e `#esculturas` (o-parque) existem no HTML e todos os links de página (`#...`) resolvem. Links `/o-parque#...`, `/contato#...`, `/programacao#agenda` resolvem. Único link quebrado no dist: `/privacidade` (página ainda não buildada, ver nota). | grep de ids/hrefs em dist | Rebuild e rechecar. Garantir que o menu/rodapé linkem as âncoras novas com texto descritivo. | Maestro |
| Baixa | Segurança/SEO de links externos: todos os `target=_blank` têm `rel=noopener`. Fonte de dados do DJ Mag citada com link. | dist/index.html | Nenhuma. | - |
| Baixa | Ícones: só favicon.svg + apple-touch-icon (180). Sem `manifest`/favicon.ico/PNG 192/512. | Base.astro:43-44 | Adicionar `favicon.ico` (ou PNG 48) para Google/legados; manifest opcional. | SEO/Design |

## Performance (Lighthouse mobile, throttling padrão)

Causa do LCP da home (3,2 s): o elemento LCP não é imagem. É o `<span class="abertura__frase">` dentro do H1 (breakdown: TTFB 7 ms, render delay 368 ms; imagem hero já tem preload AVIF com `fetchpriority=high` em index.astro:56-61). O que atrasa é o loader de primeira visita (tela cheia, `html.tem-loader`, failsafe CSS de 3 s em Loader.astro:32, contador que espera `fontes` + `decode()` do hero em loader.ts:44-52) cobrindo a página; o Lighthouse sempre é primeira visita e sem `sessionStorage`. Visitante recorrente na mesma sessão pula o loader. Em o-parque (2,9 s), loja (2,4 s) e galeria (3,0 s) o loader também roda.

Causa do TBT: um único bundle (`Base.astro_astro_type_script_index_0_lang`: 1,9-2,7 s de boot, scripting 0,6-1,8 s) executa no load: loader + fundo WebGL (compilação de shader síncrona) + header/menu. Na galeria há long task de 762 ms em 1,37 s (loja 421 ms, home 181 ms). Na home, ScrollTrigger (510 ms de long task a 2,6 s, 1,1 s de scripting) e GSAP/CustomEase carregam no mesmo momento. Em o-parque, `motor.js` (WebGL do tour, 562 ms de long task) roda no load.

Correções propostas (baratas):

1. Adiar o fundo WebGL: em src/scripts/global.ts:154-160, trocar `iniciarFundoVivo()` por execução após o loader terminar e em idle (`requestIdleCallback(..., { timeout: 1500 })`, fallback `setTimeout`). A compilação do shader em src/scripts/gl/fundo.ts:~173 (`criarPrograma`) sai do caminho crítico. Esperado: maior parte dos 710 ms de TBT da galeria e 370 ms da loja. O fallback CSS (`fundo-css`) já existe para cobrir o intervalo.
2. Não bloquear o LCP com o loader: Loader.astro:32 e loader.ts. Opções: (a) reduzir o failsafe de 3 s para ~1,5 s e iniciar o fade assim que fonte+hero decodificarem, sem esperar a coreografia do contador; (b) só mostrar o loader na home (hoje roda em qualquer primeira página, inclusive galeria/loja/o-parque, onde o ganho é nulo); (c) manter o H1 pintado por baixo (já é) e garantir que o loader não seja o último a sair. Mexe em direção criativa: decisão do Maestro/Design; SEO só aponta o custo (LCP 3,2 s contra meta 2,5 s).
3. Carregar GSAP/ScrollTrigger/SplitText da home em idle após o primeiro paint: src/scripts/home.ts:1-4 viram `import()` dinâmico dentro de `iniciarHome` (e chamar `iniciarHome` depois do loader, em index.astro:~61). Já existe o padrão em home.ts:20 (MorphSVG). Reduz o long task de 510 ms.
4. Tour do parque: `motor.js` (src/scripts/gl/motor.ts, importado por Tour) deveria iniciar só quando a seção do tour entrar na viewport (IntersectionObserver com rootMargin ~600px) em vez de no load; idem `rino-cena` (já dinâmico em rino-controle.ts:38, ok).
5. Lenis só desktop com ponteiro fino já está gated (global.ts:~139); manter. Marcar `<link rel="modulepreload">` não é necessário. Sobre fontes: 3 preloads (Kalnia 47 KB, Instrument Sans 75 KB, numerais 2,4 KB; total ~125 KB) com fallbacks ajustados (`size-adjust`) e `font-display: swap`: sem ação; o stylesheet `/fonts/fonts.css` é render-blocking e extra requisição: embutir seu conteúdo inline no `<head>` (3 KB) tira um round-trip.

Peso: transferência por página 208-395 KiB (ok). `dist/_astro` pesa 129 MB só por gerar todos os srcsets; o que o usuário baixa é a variante escolhida. Maiores fontes: rino-poster-provisorio.jpg 1,0 MB (provisório; não está em HTML inicial, mas trocar por AVIF), vários jardim-ebraim-*.jpg 0,8-1,0 MB e rino-cena.js 641 KB + rino.glb 528 KB (carregados sob demanda, ok). Conferir que a cadeia final servida é AVIF/WebP e não o JPG de fallback (as tags `<img>` mostram `.jpg` no src com srcset; verificar se há `<picture>` com AVIF ou se o JPG é o único formato: se for, converter para AVIF/WebP via `format` do getImage).

Nota sobre as métricas: o Lighthouse mede com CPU 4x e WebGL em software; os valores reais em aparelho médio tendem a ser menores, mas o TBT por shader compile é real em celular de entrada.

## Automação de noindex + sitemap para exemplos

Fonte única de verdade: um módulo `src/data/indexacao.ts` que exporta `caminhosIndexaveis`/`isIndexavel(caminho)`, derivado de `PRODUTOS` (todos `!isExemplo` para `/loja` e `/loja/[slug]`) e de `eventosDaGaleria` (idem para `/galeria`). Usos:
- Base.astro: nova prop `indexar` (default `true`); quando `false` emite `<meta name="robots" content="noindex,follow">` e nenhum canonical é necessário. loja/[slug].astro:58 e galeria/[slug].astro passam `indexar={!x.isExemplo}`; loja.astro passa `indexar={isCatalogoReal}`; galeria.astro `indexar={eventos.some(e => !e.isExemplo)}`; 404 `indexar={false}`.
- astro.config.mjs: `sitemap({ filter: (url) => isIndexavel(new URL(url).pathname) })` (config TS aceita import de .ts).
- Efeito: quando o cliente trocar `isExemplo` por `false` (ou o produto real entrar), a página volta a ser indexável e entra no sitemap no mesmo build, sem editar 3 lugares. Adicionar um check no build (script que falha se uma URL do sitemap tiver `noindex`).

## Tracking (plano; nada implementado)

Princípio: nenhuma tag (GA4, GTM, Meta Pixel) dispara antes do aceite. Pré-requisito: banner e categorias do privacy-compliance, registro da escolha e reabertura (rodapé "Privacidade"/"Preferências"). Hoje dist/ tem zero `gtag/googletagmanager/fbq` (correto).
- Arquitetura: GTM único (Consent Mode v2 com `default: denied`), carregado só após consentimento de "estatística"/"marketing" via script condicional; sem consentimento, nada além de eventos locais sem identificador. Meta Pixel como tag dentro do GTM, só com categoria "marketing"; não enviar PII.
- Gatilho único: delegação de clique em `data-evento-track` (a ser adicionado por Frontend nos CTAs) que faz `dataLayer.push` somente se `consentimento.estatistica`.

| Evento | Gatilho (elemento) | Parâmetros | GA4 | Meta |
|---|---|---|---|---|
| `clique_ingresso` | CtaIngresso.astro (href = `ingresso_url`; já tem `data-evento`) | evento_id, evento_nome, plataforma (ingresse/blueticket), pagina, posicao | evento customizado (ou `begin_checkout` sem valor) | `InitiateCheckout` (sem value) |
| `clique_whatsapp_mesas` | LINK_WHATSAPP_MESAS em Mesas.astro, MesasLocacao.astro, BarraMobile.astro, Rodape.astro:33, programacao.astro:107, EventoLinha/PosterDestaque | origem (home, contato, programacao, barra_mobile, rodape, evento_id) | `generate_lead` (lead_type=mesas) | `Contact` |
| `clique_whatsapp_locacao` | link com `CONTATOS.whatsappLocacao` / `emailLocacao` na seção #locacao | origem, tipo_evento se houver | `generate_lead` (lead_type=locacao) | `Lead` |
| `clique_email`, `clique_telefone`, `clique_mapa` | mailto/tel/como chegar | origem | evento customizado | não enviar |
| `clique_rede_social` | REDES (Instagram/YouTube/TikTok) | rede | customizado | não enviar |
| `clique_produto_whatsapp` | loja/[slug] (só quando loja real) | produto_slug | `generate_lead` | `Contact` |

- Dedup Meta: se houver CAPI, usar `event_id` igual no Pixel e no servidor. Sem CAPI agora.
- UTM: `utm_source`/`utm_medium`/`utm_campaign` documentados; links de bio do Instagram com UTM.
- Performance: GTM async após idle e após consentimento; medir LCP/INP antes e depois.
- Verificação pós-publicação: Tag Assistant, Meta Pixel Helper, DebugView do GA4, Search Console (enviar sitemap-index.xml, inspecionar a home e uma página de galeria).
- Cliques em links externos abrem em nova aba (`target=_blank`): usar `navigator.sendBeacon`/push síncrono antes da navegação; não depender de callback.

## Pendências do cliente que afetam SEO
Domínio final e www/apex; lat/long e link do Maps; horário de funcionamento; confirmação de que os 5 eventos em src/content/eventos são reais (hoje `exemplo:false`); fotos reais da galeria com datas e crédito; Google Business Profile (categoria Casa noturna + Local para eventos, mesmo NAP); logo raster.

## Ordem sugerida
1. Base.astro (canonical da home, prop `indexar`, OG/Twitter) + indexacao.ts + sitemap filter + robots.txt (todos SEO).
2. acervoDaGaleria.ts:118 (bug do alt) e alts reais (Frontend/Copy).
3. Itens 1 e 3 de performance (idle do fundo e do GSAP); decisão criativa do loader (item 2) com o Maestro.
4. JSON-LD de BreadcrumbList e Event (após confirmação dos eventos).
5. Tracking só depois do banner de consentimento.
