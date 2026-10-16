# QA Surreal Park V2 (rodada 1, 2026-10-16)

Base: preview http://localhost:4322 (dist), 29 páginas. Scripts do pacote (build, audit, astro check, Lighthouse) aceitos como entregues.

Cobertura própria: varredura de links em dist/ (29 HTML), âncoras (mesmo página e entre páginas), Playwright em 10 rotas x 6 larguras (360, 390, 768, 1440, 1920, 3840: status, overflow, console, requisições falhas), filtro e deep link da Loja, Tab no Home, viewport-capturas em /, /contato, /loja, capturas manuais (.equipe/relatorios/capturas/qa-*.png).

## Achados

| Sev. | Achado | Evidência | Correção sugerida | Dono |
|---|---|---|---|---|
| Bloqueante (para publicar) | Eventos FICTÍCIOS aparecem como fato no build de produção. Os selos "exemplo" só renderizam com `import.meta.env.DEV`. Na produção: Old Is Cool 28/11 (Ratier, Ingresse), Ágape 13/12 (Blueticket), Réveillon 31/12, Boma 16/01; 6 eventos da Galeria com datas e contagem de fotos; 16 produtos da Loja com preços. A Loja nem tem selo na página. | `src/components/eventos/EventoLinha.astro:43`, `PosterDestaque.astro:46`, `CartaoDeProduto.astro:32`, `CarrosselDeEventos.astro:67,79`; `dist/programacao.html` sem a palavra "exemplo"; captura qa-prog-360.png mostra "Comprar na Ingresse" para Old Is Cool | Antes de qualquer "pode publicar": trocar por dados reais ou remover/ocultar os exemplos (flag de build `PUBLIC_MODO_DEMO`, não `DEV`). Para a demo a Bruno/donos, manter selos visíveis no build. | frontend + Maestro (decisão de Bruno) |
| Alto | CTA principal do Home e do cabeçalho ("Ingressos · Old Is Cool · 28 NOV") aponta para evento fictício e para a home genérica `https://www.ingresse.com/` (idem Blueticket). Aparece no hero mobile e em /programacao. | captura qa-home-360.png; `src/content/eventos/2026-11-28-old-is-cool.json` (`ingresso_url` genérico, `exemplo: true`) | Hernan Cattaneo é o único evento real e não tem link. Obter URL real de ingresso; até lá, CTA para /programacao sem nome de evento falso. | frontend + dados com cliente |
| Alto | `/privacidade` retorna 404 e está linkado em todas as 29 páginas, rodapé (conhecido, já com correção planejada). | `src/components/layout/Rodape.astro:55`; Playwright: 404 | Criar a página (privacy). Confirmar que entra no sitemap e não no 404. | privacy + frontend |
| Médio | Canonical e og:url erradas: Home sai `https://surreal.art.br/index` (deveria `/`); 404 tem canonical `/404` e sem `noindex`. Sem `robots.txt` em dist/public. | `dist/index.html`, `dist/404.html`; `src/layouts/Base.astro:41`; `ls public` | Normalizar urlCanonica (remover `index`), `noindex` no 404, adicionar robots.txt com sitemap. | seo + frontend |
| Médio | Sitemap indexa as 6 páginas de evento da Galeria e as 16 de produto da Loja, todos de exemplo. | `dist/sitemap-0.xml` | Excluir do sitemap (ou noindex) enquanto forem exemplo. | seo |
| Médio | Overflow horizontal de 2 px na Home em 390 px (scrollWidth 392 > 390): `.datas__veu`, `.datas__onda`, `.aviao__foto`. Em 360 não ocorre. | Playwright, 390 `/` | `overflow-x: clip` no contêiner da seção Datas/Avião ou limitar a largura dos véus. | frontend |
| Médio | Meta description da Loja afirma "compre na Surreal Store" e o catálogo mostra preços (R$ 149,00 etc.) fictícios; o site declara que não vende on-line, mas a mensagem do WhatsApp inclui produto e preço fictícios. | `dist/loja.html` description; links wa.me da Loja | Cobrir junto ao bloqueante: sem preços/produtos reais, sem preço na mensagem ou com selo. | copywriter + frontend |
| Baixo | Contato em 1920 px: coluna de texto da seção de Mesas fica com vazio grande (~600 px) ao lado da foto alta. | qa-contato-1920.png | Alinhar verticalmente ao centro ou limitar a altura da foto. | frontend |
| Baixo | `INDICE_DO_PARQUE` lista 15 itens, mas só 11 renderizam no mapa (historia, juistreet, servicos, loja, artistas sem uso). Dado morto. | `src/data/tour.ts:435-451` vs `dist/o-parque.html` (11 `mapa__item`) | Remover itens sem cena ou implementá-los. | frontend |
| Baixo | Aviso de performance WebGL ("GPU stall due to ReadPixels") no console da Home; só warning, sem erro. Lighthouse: performance 76 a 88 mobile, TBT 370-710 ms, acima da meta de 200 ms de INP a validar. | Playwright 360 `/`; `.equipe/relatorios/lh-*.json` | Mitigar o readPixels do hero se estiver em loop; revisar TBT. | frontend (perf) |

## Passou (sem achado)

- Links: 0 internos quebrados (exceto /privacidade); todos os `target=_blank` com `rel="noopener"`; âncoras #mesas, #locacao, #geral, #como-chegar, #regras, #lago, #esculturas, #jardim, #ranking, #produtos, #agenda e #ritual/#bells/#raw-room/#nomad/#church/#jet-set/#historia todas existem.
- WhatsApp: mesas wa.me/554789011563, locação wa.me/5547984680168 (mensagens com texto codificado), loja wa.me/554789011563; mailto contato@surreal.art.br e maitejanuario@surreal.art.br (com subject e body); tel +554789011563; Maps, Waze, Ingresse, Blueticket, DJ Mag, Instagram, YouTube, TikTok presentes. Não testei a abertura real dos destinos externos.
- Loja: filtro por categoria (16 -> 8 em Roupas), URL `?categoria=roupas` atualizada, deep link `?categoria=calcados` mostra 1 item.
- Responsivo: sem overflow em 360, 768, 1440, 1920 e 3840 em todas as 10 rotas testadas (exceto 390 na Home); sem erro de console nem requisição falha (a não ser o 404 esperado em /nao-existe e /privacidade).
- 404 customizado responde com status 404 e h1 único; lang pt-BR; 1 h1 por página; rodapé "Desenvolvido por Fonte Dev · Bruno Lucas" com link fontedev.com em todas as páginas.
- Teclado: primeiro Tab é "Pular para o conteúdo"; sequência pelo menu, CTAs e links sem perda de foco visível (14 tabs testados na Home). Imagens sem alt são decorativas (alt vazio) e todas têm width/height.
- Reduced-motion: 15 módulos com checagem; Contato e Loja renderizam completos sem erro. Não testei o tour de O Parque em reduce nesta rodada.
- Visual: hero Home, carrossel da Galeria (curvo, setas, "Ver as fotos"), cards da Loja e Contato claro sem quebra visível nas capturas olhadas. Capturas full-page mostram o loader e itens ainda não revelados (artefato de captura, não bug).

## Não verificado

Lightbox e galeria interna, tour de O Parque em mobile/reduce, contraste do tema claro do Contato (já pendente no estado), medição de CLS em campo, textos de alt (rascunho conhecido), ortografia completa de todas as páginas.

## Decisão

PRECISA AJUSTE para publicação: bloqueante é o dado fictício exposto como fato em produção, mais CTA com link genérico e /privacidade 404. Para a demo (Pausa 3), o produto está sólido: 0 erros de console, links e âncoras íntegros, sem overflow relevante. Segunda rodada só para regressão.
