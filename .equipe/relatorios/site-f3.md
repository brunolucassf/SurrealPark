# Site Surreal Park — Fase 3

## Mudanças

### Injeção de Pixel/GTM/GA4
- `src/lib/config-publica.ts`: fetcher de `GET /public/v1/config` com cache 30s em memória, validação de contrato, fallback seguro.
- `src/components/ConfigPublicaScript.astro`: injeta scripts no head do layout. Em build estático, o `carregarConfigPublica()` resolve no build quando a API está acessível. Em runtime, o client-side faz `fetch('/public/v1/config')` e injeta Meta Pixel (`fbq('init')` + `fbq('track', 'PageView')`), GTM (`dataLayer` + `<noscript>` com iframe) e GA4 (`gtag('config')`). Se `modoDemo=true`, nenhum script de tracking é injetado.
- `src/layouts/Base.astro`: inclui `ConfigPublicaScript` no head e `BannerDemo` no body.

### Banner de modo demonstração
- `src/components/BannerDemo.astro`: pill fixo no rodapé "Site em modo demonstração · cookies não são enviados para terceiros". `role="status"`, `aria-live="polite"`, dismissível por sessão via `sessionStorage` (chave `surreal:demo-banner-fechado`). Renderiza só quando `isPainelConfigurado && config.scripts.modoDemo`.

### Validador de cupom
- `src/components/CupomValidador.astro`: input + botão "Validar" + resposta com `aria-live="polite"`. Recebe `idPrefixo` para conviver com os três formulários de contato.
- `src/scripts/contato/cupom.ts`: lógica com debounce 300ms no input, fetch a `GET /public/v1/cupons/:codigo/validar?visitanteCpf=...` quando o CPF tem 11 dígitos, mensagens em pt-BR para os motivos (`nao_encontrado`, `pausado`, `expirado`, `esgotado`, `inativo`), formatação `R$ X,XX` ou `N% off` no sucesso. Também aplica máscara de CPF (`000.000.000-00`).
- `src/components/contato/FormularioDeLead.astro`: campo CPF opcional (com máscara) ao lado de e-mail/telefone, e o `CupomValidador` aparece nos tipos `mesa` e `contato` (não em `locação`, conforme pacote).
- `src/scripts/contato/leads.ts`: envia `cpf` (só dígitos) e `cupomCodigo` (UPPERCASE) no `LeadParaEnvio`.
- `src/lib/painel-publico.ts`: `LeadParaEnvio` ganha `cpf` e `cupomCodigo` opcionais.
- `src/pages/contato.astro`: chama `iniciarValidadoresDeCupom()` no carregamento e em `toggle` de `<details>`.

### Ajuste no banner de cookies (F2)
- `src/components/lgpd/bannerDeCookies.ts`: puxa `modoDemo` de `/public/v1/config` e adiciona o adendo "Modo demonstração — cookies de terceiros desativados." no texto do diálogo quando aplicável.

### Página `/privacidade`
- `src/pages/privacidade.astro`: parágrafo novo em "Cookies e armazenamento": "Quando ativo o modo demonstração, cookies não são enviados para terceiros (Meta, Google). Veja 'Preferências de cookies' no rodapé."

## Capturas
- `.equipe/relatorios/capturas-f3-home-demo-final/` — home em demo (banner visível, sem scripts de tracking).
- `.equipe/relatorios/capturas-f3-home-prod-final/` — home em produção (sem banner, scripts Meta/GTM/GA4 injetados no HTML).
- `.equipe/relatorios/capturas-f3-contato-demo/` — contato em demo (sem cupom).
- `.equipe/relatorios/capturas-f3-contato-prod/` — contato em produção (formulários com cupom).
- `.equipe/relatorios/capturas-f3-contato-cupom.png` e `-cupom-768.png` — formulários abertos em produção, campo CPF e cupom presentes.
- `.equipe/relatorios/capturas-f3-contato-cupom-validado-foco.png` — após clicar "Validar" com `SURREAL10`: "Cupom OK · 15% off" em verde.
- `.equipe/relatorios/capturas-f3-privacidade-prod/` — `/privacidade` com o parágrafo novo.

Verificações automatizadas via `node .claude/scripts/viewport-capturas.mjs` (larguras 360/768/1440/1920): `overflow_horizontal: false` em todas as páginas e larguras. Erros de console são apenas tentativas de carregar `fbevents.js`/`gtm.js`/`gtag.js` (esperado em ambiente local, sem internet para esses hosts).

## Verificações
- `npm run check` (astro check): 0 erros, 0 avisos.
- `npm run build`: completo em ~2s, 30 páginas, sitemap vazio (esperado em demo).
- Build com `PUBLIC_PAINEL_API_URL` apontando para mock local embeda o config e injeta scripts quando `modoDemo: false`.

## Pendências / PRÓXIMO
- O backend F3 (pacote 049) ainda não está commitado; a aplicação de cupom atômica no `POST /public/v1/leads` precisa do backend rodando. Site envia `cupomCodigo` e `cpf` prontos para o backend consumir quando estiver no ar.
- Validar visualmente o banner demo no ambiente real (com `PUBLIC_PAINEL_API_URL` apontando para o painel e `settings.demo_mode = true`).
- Confirmar com o backend o nome do campo de CPF (pacote 049 menciona `cpf` na entrada de lead; o site envia como `cpf` no `LeadParaEnvio`).
- Próximo pacote: aguardar pacote 052 ou QA final.
