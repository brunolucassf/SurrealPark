# Design System · Surreal Park V2 ("Eclipse")
Fonte da verdade visual. Direção e momentos em `.equipe/briefs/direcao.md`. Valores aqui são finais: implementar como estão (CSS custom properties em `:root`). Mudança só via art-director.

---

## 1. Cor

### 1.1 Tokens
```css
:root {
  /* Terra · grafite (fundo escuro é o padrão) */
  --ink-950: #0C0B0D;  /* fundo de mídia, lightbox, barra mobile, rino */
  --ink-900: #131215;  /* fundo de página */
  --ink-850: #1A191C;  /* superfície elevada (hover de linha, card de produto) */
  --ink-800: #222025;  /* superfície 2, botão desativado */
  --ink-750: #2B292F;  /* superfície 3 (raro) */
  --ink-600: #4A4650;  /* linha decorativa / divisória (não essencial) */
  --line-strong: #807A84; /* borda essencial de controle (chip, input) — 4.48:1 no ink-900 */

  /* Osso · texto */
  --bone-50:  #F2ECE2; /* texto principal */
  --bone-300: #CFC7BA; /* texto secundário */
  --ash-400:  #9C968E; /* texto terciário / metadado (mín. no ink-750) */
  --ash-500:  #7F7A73; /* só texto ≥ 24px ou decorativo */

  /* Sol · ouro (luz e ação) */
  --gold-200: #F0D49A; /* filamento: hover de botão, foco */
  --gold-300: #E6BD6E; /* ação primária, destaque de texto */
  --gold-400: #D6A24A; /* símbolo, numerais, linhas acesas */
  --gold-500: #B8862F; /* linha/ícone ouro discreto */
  --gold-700: #7C5418; /* ouro sobre fundo claro (texto) */
  --gold-800: #5E3F10; /* ouro sobre fundo claro (texto pequeno) */

  /* Lua · luar */
  --moon-200: #C3CEDC; /* Jet Set, disco da lua, dados frios */
  --moon-300: #9FB0C6;

  /* Luz de cada palco — só detalhes (número do índice, filete, glow da máscara) */
  --luz-ritual:   #F2694E;
  --luz-bells:    #6FD392;
  --luz-raw-room: #F0A050;
  --luz-nomad:    #F4B860;
  --luz-church:   #7FA6FF;
  --luz-jet-set:  #C3CEDC;
  --luz-jardim:   #A9CF74;
  --luz-juistreet:#E58AE5;

  /* Estados */
  --alert-300: #FF8A7A; /* erro em fundo escuro */
  --ok-300:    #8FD6A0; /* sucesso em fundo escuro */

  /* Amanhecer (Contato e faixas claras) */
  --dawn-50:  #F4EEE3; /* fundo */
  --dawn-100: #EBE3D5; /* superfície */
  --dawn-200: #DED3C1; /* linha decorativa */
  --dawn-line:#7A7166; /* borda essencial em dawn-50 (4.15:1) */
  --alert-700:#A3261A;
  --ok-700:   #1F6B36;

  /* Papéis semânticos (tema escuro) */
  --bg: var(--ink-900);
  --surface: var(--ink-850);
  --text: var(--bone-50);
  --text-2: var(--bone-300);
  --text-3: var(--ash-400);
  --accent: var(--gold-300);
  --accent-text: var(--gold-300);
  --on-accent: var(--ink-900);
  --border: var(--line-strong);
  --divider: var(--ink-600);
  --focus: var(--gold-200);
}

/* Contato inteiro e faixas claras */
[data-luz="amanhecer"] {
  --bg: var(--dawn-50);
  --surface: var(--dawn-100);
  --text: var(--ink-900);
  --text-2: #3A373D;
  --text-3: #4F4B53;
  --accent: var(--ink-900);
  --accent-text: var(--gold-700);
  --on-accent: var(--dawn-50);
  --border: var(--dawn-line);
  --divider: var(--dawn-200);
  --focus: var(--ink-900);
  color-scheme: light;
}
:root { color-scheme: dark; }
body { background: var(--bg); color: var(--text); }
```
Sem tema alternado pelo usuário: o site é escuro por decisão, e o amanhecer é parte da narrativa. `prefers-color-scheme` não muda nada.

### 1.2 Contrastes medidos (WCAG 2.x)
| Texto / UI | Fundo | Razão | Uso permitido |
|---|---|---|---|
| bone-50 | ink-900 / 850 / 800 / 750 | 15.89 / 14.90 / 13.73 / 12.23 | qualquer texto |
| bone-300 | ink-900 / 800 | 11.14 / 9.63 | qualquer texto |
| ash-400 | ink-900 / 850 / 800 / 750 | 6.37 / 5.97 / 5.51 / 4.91 | qualquer texto |
| ash-500 | ink-900 / 800 | 4.39 / 3.79 | **só ≥ 24px** ou decorativo |
| gold-300 | ink-900 / 950 | 10.55 / 11.10 | texto, ícone |
| gold-400 | ink-900 / 800 | 8.11 / 7.01 | texto, numerais |
| gold-500 | ink-900 / 800 | 5.77 / 4.99 | texto, linhas |
| ink-900 sobre gold-300 (botão) | — | 10.55 | botão primário |
| ink-900 sobre gold-200 (hover) | — | 12.97 | botão hover |
| moon-200 | ink-900 | 11.72 | texto |
| luz-* (todas) | ink-900 / 800 | ≥ 6.14 / ≥ 5.31 | texto pequeno ok; uso só decorativo/rótulo |
| alert-300 / ok-300 | ink-900 | 8.15 / 10.93 | mensagens |
| line-strong (borda) | ink-900 / 850 / 800 | 4.48 / 4.20 / 3.87 | borda essencial (≥ 3:1) |
| ink-600 (divisória) | ink-900 | 2.03 | **só decorativo** |
| ink-900 | dawn-50 / 100 / 200 | 16.16 / 14.65 / 12.62 | qualquer texto |
| #3A373D / #4F4B53 | dawn-50 | 10.14 / 7.38 | texto 2 / 3 |
| gold-700 / gold-800 | dawn-50 | 5.79 / 8.29 | texto ouro no claro |
| dawn-line | dawn-50 / 100 | 4.15 / 3.76 | borda essencial |
| alert-700 / ok-700 | dawn-50 | 6.38 / 5.66 | mensagens |
| bone-50 sobre scrim ≥ 0,55 em céu laranja #F9AD2E | — | 5.82 | texto no hero |
| bone-50 sobre scrim ≥ 0,70 em branco puro | — | 6.34 | pior caso de foto |

### 1.3 Scrims (texto sobre foto)
```css
:root {
  --scrim-bottom: linear-gradient(to top, rgb(12 11 13 / .90) 0%, rgb(12 11 13 / .70) 35%, rgb(12 11 13 / 0) 75%);
  --scrim-left:   linear-gradient(to right, rgb(12 11 13 / .85) 0%, rgb(12 11 13 / .55) 45%, rgb(12 11 13 / 0) 80%);
  --scrim-full:   rgb(12 11 13 / .55);
}
```
Regra: o texto fica onde o scrim tem ≥ 0,70 (ou ≥ 0,55 se `luminanciaMedia` < 0,35 no acervo). Nunca texto sobre céu claro sem scrim.

---

## 2. Tipografia

### 2.1 Famílias (auto-hospedar woff2 latin + latin-ext; `font-display: swap`; preload só Kalnia e Instrument Sans)
```css
@font-face { font-family: "Kalnia"; src: url(/fonts/kalnia-var.woff2) format("woff2"); font-weight: 100 700; font-stretch: 100% 125%; font-display: swap; }
@font-face { font-family: "Instrument Sans"; src: url(/fonts/instrument-sans-var.woff2) format("woff2"); font-weight: 400 700; font-stretch: 75% 100%; font-display: swap; }
@font-face { font-family: "DM Mono"; src: url(/fonts/dm-mono-400.woff2) format("woff2"); font-weight: 400; font-display: swap; }
@font-face { font-family: "DM Mono"; src: url(/fonts/dm-mono-500.woff2) format("woff2"); font-weight: 500; font-display: swap; }
:root {
  --font-display: "Kalnia", "Georgia", serif;
  --font-text: "Instrument Sans", system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: "DM Mono", ui-monospace, "SFMono-Regular", Menlo, monospace;
}
```
Numerais: os dígitos da Kalnia têm caudas decorativas (o 2, o 7) e ilegíveis em tamanho de dado; ela não oferece lnum nem alternativas. `--font-display` começa por "Kalnia Numerais" (Playfair Display, lining, subset 0-9, 2,4 KB, `unicode-range: U+0030-0039`, `public/fonts/playfair-numerais.woff2`), então só os dígitos mudam de família e o resto do texto segue em Kalnia.
Licença: todas SIL OFL 1.1 (Google Fonts). Baixar de fonts.google.com/github google/fonts. Peso latin: Kalnia 47 KB, Instrument Sans 57 KB, DM Mono 15+15 KB. Fallbacks com `size-adjust`/`ascent-override` gerados (ex.: fontaine/capsize) para CLS 0.

### 2.2 Escala fluida (360 → 1920; acima disso cresce pelo root scale, §5)
```css
:root {
  --fs-mono-xs: clamp(0.6875rem, 0.6731rem + 0.0641vw, 0.75rem);   /* 11 → 12 */
  --fs-label:   clamp(0.75rem, 0.7356rem + 0.0641vw, 0.8125rem);    /* 12 → 13 */
  --fs-body-s:  clamp(0.875rem, 0.8606rem + 0.0641vw, 0.9375rem);   /* 14 → 15 */
  --fs-body:    clamp(1rem, 0.9712rem + 0.1282vw, 1.125rem);        /* 16 → 18 */
  --fs-lead:    clamp(1.125rem, 1.0673rem + 0.2564vw, 1.375rem);    /* 18 → 22 */
  --fs-h4:      clamp(1.25rem, 1.1635rem + 0.3846vw, 1.625rem);     /* 20 → 26 */
  --fs-h3:      clamp(1.5rem, 1.3269rem + 0.7692vw, 2.25rem);       /* 24 → 36 */
  --fs-h2:      clamp(2rem, 1.5385rem + 2.0513vw, 4rem);            /* 32 → 64 */
  --fs-h1:      clamp(2.75rem, 1.6538rem + 4.8718vw, 7.5rem);       /* 44 → 120 */
  --fs-hero:    clamp(2.75rem, 0.9615rem + 7.9487vw, 10.5rem);      /* 44 → 168 */
  --fs-display: clamp(3.5rem, 1.4231rem + 9.2308vw, 12.5rem);       /* 56 → 200 */
  --fs-giga:    clamp(6rem, 2.1923rem + 16.9231vw, 22.5rem);        /* 96 → 360 */
  --fs-btn:     clamp(0.9375rem, 0.9231rem + 0.0641vw, 1rem);       /* 15 → 16 */
}
```

### 2.3 Estilos (classes utilitárias de referência)
| Estilo | Família | Tamanho | Peso / largura | Altura de linha | Tracking | Caixa |
|---|---|---|---|---|---|---|
| `.t-hero` | Kalnia | --fs-hero | 200 / 100 (palavra-drop: 650) | 0.95 | -0.02em | normal |
| `.t-display` | Kalnia | --fs-display | 300 / 125 (≥1024), 300 / 100 (<1024) | 0.92 | -0.015em | normal |
| `.t-giga` | Kalnia | --fs-giga | 600 / 100 | 0.85 | -0.03em | numerais `font-variant-numeric: lining-nums tabular-nums` |
| `.t-h1` | Kalnia | --fs-h1 | 250 / 100 | 1.0 | -0.02em | normal |
| `.t-h2` | Kalnia | --fs-h2 | 300 / 100 | 1.05 | -0.01em | normal |
| `.t-h3` | Kalnia | --fs-h3 | 400 / 100 | 1.1 | 0 | normal |
| `.t-h4` | Instrument Sans | --fs-h4 | 600 / 100 | 1.2 | -0.005em | normal |
| `.t-lead` | Instrument Sans | --fs-lead | 400 / 100 | 1.45 | 0 | normal |
| `.t-body` | Instrument Sans | --fs-body | 400 / 100 | 1.6 | 0 | normal |
| `.t-body-s` | Instrument Sans | --fs-body-s | 400 / 100 | 1.5 | 0.005em | normal |
| `.t-label` | Instrument Sans | --fs-label | 600 / 75 | 1.2 | 0.08em | MAIÚSCULAS |
| `.t-btn` | Instrument Sans | --fs-btn | 600 / 75 | 1 | 0.06em | MAIÚSCULAS |
| `.t-mono` | DM Mono | --fs-body-s | 400 | 1.4 | 0.02em | normal |
| `.t-mono-xs` | DM Mono | --fs-mono-xs | 500 | 1.3 | 0.1em | MAIÚSCULAS |

Regras: medida de leitura máx. **68ch** (`.t-body`), 40ch (`.t-lead`). Kalnia nunca abaixo de 24 px. Ênfase no display = salto de peso (200→650) e/ou `color: var(--accent-text)`, nunca itálico (Kalnia não tem). Diacríticos: `.t-hero`/`.t-display` com `padding-block-start: 0.08em` para Ó/Á não cortarem em máscaras de linha. `font-variation-settings` só via `font-weight`/`font-stretch`. `text-wrap: balance` em títulos, `pretty` em parágrafos.

---

## 3. Espaço, grade, raios, sombras

```css
:root {
  --sp-1: 0.25rem; --sp-2: 0.5rem; --sp-3: 0.75rem; --sp-4: 1rem; --sp-5: 1.5rem;
  --sp-6: 2rem; --sp-7: 3rem; --sp-8: 4rem; --sp-9: 6rem; --sp-10: 8rem; --sp-11: 11rem;
  --s-section: clamp(4rem, 2.3846rem + 7.1795vw, 11rem);  /* entre seções: 64 → 176 */
  --s-block:   clamp(2.5rem, 1.6923rem + 3.5897vw, 6rem); /* entre blocos: 40 → 96 */

  --r-0: 0; --r-1: 2px; --r-2: 4px; --r-pill: 999px;

  --glow-ouro-s: 0 0 0 1px rgb(230 189 110 / .35), 0 0 16px rgb(230 189 110 / .25);
  --glow-ouro-l: 0 0 60px 10px rgb(214 162 74 / .18);
  --sombra-overlay: 0 24px 80px rgb(0 0 0 / .6);
  --borda-1: 1px solid var(--divider);
}
```
- **Raios:** mídia e superfícies com `--r-1` (canto vivo editorial); inputs `--r-2`; botões e chips `--r-pill`. Proibido 8–16 px em cards.
- **Sombras:** no escuro não há drop shadow; elevação = glow ouro (foco/hover de ação) ou `--sombra-overlay` (menu, lightbox). No amanhecer: `0 1px 0 var(--dawn-200)`.

### Grade
| Faixa (min-width) | Colunas | Margem | Gutter | Container máx. |
|---|---|---|---|---|
| 360 (base) | 4 | 16px | 16px | — |
| 414 | 4 | 20px | 16px | — |
| 768 | 8 | 32px | 20px | — |
| 1024 | 12 | 40px | 24px | — |
| 1440 | 12 | 56px | 24px | 1680px |
| 1920 | 12 | 72px | 32px | 1680px |
| 2560 | 12 | 96px | 40px | 2240px |
| 3840 | 12 | 128px | 56px | 3200px |
Mídia full-bleed ignora o container. Texto nunca passa de 68ch, mesmo em 4K: o espaço extra vai para colunas (galeria, cartaz de palcos, artistas) e para a escala, não para linhas mais longas.

---

## 4. Movimento

### 4.1 Tempo (124 BPM: beat = 60/124 s)
```css
:root {
  --beat: 484ms;
  --dur-1-8: 60ms;    /* stagger padrão */
  --dur-1-4: 121ms;   /* hover, press */
  --dur-1-2: 242ms;   /* UI: menus, chips, header */
  --dur-1:   484ms;   /* reveals, troca de numeral */
  --dur-2:   968ms;   /* máscaras, morph de forma */
  --dur-4:   1935ms;  /* compasso: intro inteira */
  --dur-page: 600ms;  /* transição de página */

  --ease-olho:    cubic-bezier(0.83, 0, 0.17, 1);   /* abrir/fechar máscara (in-out forte) */
  --ease-saida:   cubic-bezier(0.16, 1, 0.3, 1);    /* entrada de elementos (expo out) */
  --ease-entrada: cubic-bezier(0.7, 0, 0.84, 0);    /* saída de elementos (expo in) */
  --ease-ui:      cubic-bezier(0.2, 0, 0, 1);       /* hover/estado */
  --ease-drop:    cubic-bezier(0.34, 1.56, 0.64, 1);/* pirâmide, pulso (leve overshoot), uso raro */
}
```
GSAP: `CustomEase.create("olho","0.83,0,0.17,1")`, `"saida"` = `"expo.out"`, `"entrada"` = `"expo.in"`, `"drop"` = `"back.out(1.6)"`. Durações em JS leem `--beat` (assim a camada de áudio opcional pode trocar o BPM pelo da faixa licenciada).

### 4.2 Linguagem
- Só `transform`, `opacity`, `clip-path`/`mask-size` (nas máscaras), `stroke-dashoffset` e eixo `wght`. Nunca animar `width/height/top/left`, `filter: blur` de tela inteira ou `box-shadow` em loop.
- **Reveal de texto:** linha mascarada (`overflow: clip`), palavra `yPercent 110 → 0`, `--dur-1`, `--ease-saida`, stagger `--dur-1-8`. Só em títulos (h1–h2, display). Corpo de texto: fade + `y 12px`, `--dur-1-2`.
- **Reveal de mídia:** `clip-path: inset(100% 0 0 0) → inset(0)`, `--dur-1`, `--ease-olho`, imagem interna `scale 1.08 → 1`.
- **Gatilho:** IntersectionObserver ou ScrollTrigger `start: "top 85%"`, uma vez (`once`). Nada reanima ao subir.
- **Pin/scrub:** só ≥1024 px e só nos momentos M1 (saída), M2 e M3, mais o manifesto de O Parque. Mobile nunca prende a rolagem.
- **Lenis:** só `(pointer: fine) and (min-width: 1024px)`, `lerp: 0.1`, integrado ao ticker do GSAP. Desligado em touch, em reduced-motion e quando o lightbox/menu está aberto.
- **Loops infinitos proibidos**, exceto grão (desktop) e rotação ociosa do rino (só visível). Nada pisca mais de 3 vezes por segundo.
- Intensidade por contexto: momentos 4/5; corpo 3/5; Programação, filtros, formulários e cards de ingresso 1/5 (só feedback de estado, `--dur-1-4`).

### 4.3 Reduced motion (`prefers-reduced-motion: reduce`)
| Elemento | Comportamento |
|---|---|
| Intro M1 | não roda; estado final no primeiro frame |
| Reveals de texto/mídia | desligados (conteúdo visível) |
| Pin, scrub, parallax, Lenis | desligados; layout de mobile (sem sticky) em qualquer largura |
| M2 ascensão | gráfico e #10 no estado final |
| M3 morph | formas estáticas por palco, sem crossfade |
| M4 rino | pôster estático; 3D só com clique em "Ver em 3D", sem giro automático nem flicker |
| Transição de página | nenhuma |
| Grão | estático |
| Pulso de três arcos, lente, curva de luz, indicador sol→lua | desligados |
| Hover/foco | mantidos (cor/borda instantâneas, sem escala) |
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
}
```
JS: `matchMedia('(prefers-reduced-motion: reduce)')` decide se GSAP/Lenis/Three inicializam; ouvir `change`.

---

## 5. Breakpoints e escala de raiz
```css
/* mobile-first: base = 360 */
@custom-media --sm  (min-width: 414px);
@custom-media --md  (min-width: 768px);
@custom-media --lg  (min-width: 1024px);
@custom-media --xl  (min-width: 1440px);
@custom-media --2xl (min-width: 1920px);
@custom-media --3xl (min-width: 2560px);
@custom-media --4k  (min-width: 3840px);
html { font-size: 100%; }
@media (min-width: 2560px) { html { font-size: 112.5%; } }
@media (min-width: 3840px) { html { font-size: 150%; } }
```
(Se o pipeline não suportar `@custom-media`, usar os valores literais.) Testar em 360, 414, 768, 1024, 1440, 1920, 2560 e 3840, sem rolagem horizontal em nenhum.

---

## 6. Z-index
```css
:root {
  --z-base: 0; --z-raised: 1; --z-luz: 2;          /* camadas de curva de luz */
  --z-sticky: 10;                                   /* índice de chips, palcos sticky */
  --z-header: 50; --z-bottombar: 60; --z-lente: 70;
  --z-menu: 80; --z-lightbox: 90; --z-toast: 95;
  --z-intro: 100; --z-skip: 110;
}
```

---

## 7. Formas (máscaras SVG, `clipPathUnits="objectBoundingBox"`)
```html
<svg width="0" height="0" aria-hidden="true" style="position:absolute">
  <clipPath id="f-olho"     clipPathUnits="objectBoundingBox"><path d="M0,.5 C.22,.06 .78,.06 1,.5 C.78,.94 .22,.94 0,.5Z"/></clipPath>
  <clipPath id="f-ritual"   clipPathUnits="objectBoundingBox"><path d="M0,1 L0,.52 C0,.2 .22,.02 .5,.02 C.78,.02 1,.2 1,.52 L1,1Z"/></clipPath>
  <clipPath id="f-bells"    clipPathUnits="objectBoundingBox"><path d="M.5,0 C.36,0 .27,.06 .26,.18 C.24,.44 .2,.66 .04,.8 C.01,.83 .01,.88 .05,.9 L.95,.9 C.99,.88 .99,.83 .96,.8 C.8,.66 .76,.44 .74,.18 C.73,.06 .64,0 .5,0Z M.4,.95 C.4,1 .6,1 .6,.95 C.6,.91 .4,.91 .4,.95Z"/></clipPath>
  <clipPath id="f-raw-room" clipPathUnits="objectBoundingBox"><path d="M.02,.04 L.31,0 L.33,.03 L.64,.01 L.98,.05 L.96,.31 L1,.34 L.97,.62 L.99,.97 L.7,.95 L.67,1 L.36,.97 L.03,.99 L.05,.7 L0,.66 L.03,.35Z"/></clipPath>
  <clipPath id="f-nomad"    clipPathUnits="objectBoundingBox"><path d="M0,1 L0,.42 C.08,.4 .16,.34 .2,.22 C.24,.34 .3,.38 .36,.38 C.42,.34 .46,.2 .5,0 C.54,.2 .58,.34 .64,.38 C.7,.38 .76,.34 .8,.22 C.84,.34 .92,.4 1,.42 L1,1Z"/></clipPath>
  <clipPath id="f-church"   clipPathUnits="objectBoundingBox"><path d="M0,1 L0,.45 C.02,.25 .3,.1 .5,0 C.7,.1 .98,.25 1,.45 L1,1Z"/></clipPath>
  <clipPath id="f-jet-set"  clipPathUnits="objectBoundingBox"><path d="M.5,0 C.78,0 1,.12 1,.3 L1,.7 C1,.88 .78,1 .5,1 C.22,1 0,.88 0,.7 L0,.3 C0,.12 .22,0 .5,0Z"/></clipPath>
</svg>
```
- Proporções: olho 2:1; ritual 5:4 (desktop) e 4:5 (mobile); bells, church, jet-set 4:5; raw-room e nomad 5:4 (desktop) e 4:5 (mobile).
- Máscara animável (M1, transição de página): mesma amêndoa como `mask-image: url(/img/olho.svg)` com `mask-repeat: no-repeat; mask-position: center`, animando `mask-size`. Sem suporte a mask: fade.
- **Símbolo e wordmark:** `_entrada/marca/surreal-simbolo.svg` e `surreal-wordmark.svg` (fill currentColor), inline. Símbolo em `--gold-400`; wordmark em `--bone-50` (header) ou `--gold-400` (rodapé). Área de respiro mínima = altura da pirâmide. Tamanho mínimo: símbolo 24 px de altura, wordmark 72 px de largura. Nunca deformar, contornar, aplicar gradiente nem sombra; nunca recriar o wordmark com fonte.
- Para animar os arcos (stroke-draw), o frontend gera uma versão em traço (3 paths de amêndoa com `stroke-width` equivalente) a partir do símbolo; a versão preenchida continua sendo a oficial em repouso.

---

## 8. Foto e mídia

### 8.1 Receita de grading (build, sharp; igual para todos os fotógrafos)
```js
sharp(src).rotate()
  .extract(cropSeHouverMarcaDagua)                 // Diego Jarschel: cortar 3% à esquerda nas full-bleed
  .modulate({ saturation: 0.94 })
  .linear([0.94, 0.94, 0.94], [14, 13, 16])        // preto vira grafite (#0E0D10): sombra funde com o fundo
  .composite([{ input: { create: { width: W, height: H, channels: 4, background: { r: 230, g: 189, b: 110, alpha: 0.08 } } }, blend: "soft-light" }])
  .resize({ width: w, withoutEnlargement: true })
  .avif({ quality: 50, effort: 6 })                // + WebP q72 como fallback
```
- Larguras de srcset: 480, 828, 1200, 1680, 2400, 3200 (nunca acima do original). `sizes` real por slot.
- Orçamentos: hero mobile ≤ 180 KB, hero desktop ≤ 450 KB, miniatura de galeria ≤ 40 KB, lightbox ≤ 350 KB, página inicial total (sem 3D) ≤ 1,2 MB no mobile.
- Sempre `width`/`height` declarados ou `aspect-ratio`. `loading="lazy"` e `decoding="async"` fora da primeira dobra; o hero com `fetchpriority="high"` e preload.
- **LQIP:** 16 px de largura, duotone (sombras `#131215`, luzes `#D6A24A`), borrado em CSS, inline base64 (≤ 600 B). Fundo do slot = `corDominante` do acervo até carregar.
- **Grão:** `/img/grao.png` 128×128 (ruído monocromático, ≤ 8 KB), em `body::after` fixo, `opacity: .05`, `pointer-events: none`, `z-index: var(--z-luz)`. No hero desktop, uma camada extra com `animation: grao 0.33s steps(4) infinite` (deslocar `background-position`). Reduced-motion: estático.
- **Duotone** (`filter` não; gerar no build): só LQIP, fundo do bloco Mesas da Programação (25 %), Jet Set e texturas.
- Crédito: "Foto: [nome]" em `.t-mono-xs` na legenda/lightbox.

### 8.2 3D (rinoceronte)
Arquivo final `/3d/rino.glb` ≤ 600 KB (meshopt + texturas 1024² WebP/KTX2), pôster `/3d/rino-poster.avif` 1200 w. Material, luz e regras de carga em direcao.md M4. Canvas com `aria-hidden="true"`; controle acessível = botões "Ver imagem"/"Ver em 3D" e o texto alternativo do pôster.

---

## 9. Componentes-base

### 9.1 Botão
| Variante | Fundo | Texto | Borda | Hover (`--dur-1-4`, `--ease-ui`) | Ativo |
|---|---|---|---|---|---|
| Primário (escuro) | gold-300 | ink-900 `.t-btn` | — | fundo gold-200 + `--glow-ouro-s` | `scale(.98)` + pulso de três arcos |
| Secundário (escuro) | transparente | bone-50 | 1px `rgb(242 236 226 / .4)` | borda gold-300, texto gold-200 | `scale(.98)` |
| Texto | — | bone-50 | sublinhado 1px gold-500, `text-underline-offset: .25em` | sublinhado gold-300 2px | — |
| Primário (amanhecer) | ink-900 | dawn-50 | — | fundo gold-700 | `scale(.98)` |
| Secundário (amanhecer) | transparente | ink-900 | 1px ink-900 | fundo ink-900 / 6 % | — |
| Desativado | ink-800 | ash-400 | 1px line-strong | nenhum | `cursor: not-allowed`; texto explícito ("Ingressos esgotados") |
- Altura 48 px (<1024) / 52 px (≥1024); `padding-inline: 24px / 28px`; raio pill; gap ícone 10 px. CTAs principais no mobile são full-width.
- Ícone de avançar = pirâmide (triângulo de 10 px girado 90°), que anda 3 px no hover. Externo = "↗" + texto acessível "(abre em nova aba)". WhatsApp: glifo oficial monocromático à esquerda; **sem verde** (o rótulo nomeia o canal).
- Foco (todos): `outline: 2px solid var(--focus); outline-offset: 3px;` + `box-shadow: 0 0 0 6px var(--bg)` para separar de fotos.

### 9.2 Link
Inline em corpo: cor `--text`, sublinhado 1px `--gold-500` (amanhecer: `--gold-700`), offset .2em; hover sublinhado 2px `--accent-text`. Links de navegação/rodapé: sem sublinhado em repouso; hover desenha sublinhado `scaleX 0→1` da esquerda (`--dur-1-2`). Visitado = igual.

### 9.3 Card de evento (linha de tracklist)
- Estrutura: `<article>` com um único link principal (o CTA de ingresso) e o restante como texto. Sem links aninhados.
- Grid ≥1024: `grid-template-columns: 9rem 1fr 14rem auto;` (data | título+artistas | palcos+status | CTA), `padding-block: var(--sp-6)`, divisória `--borda-1` em cima. <1024: empilhado (data em linha mono + dia; título; artistas; palcos; status; CTA full-width).
- Data: dia da semana + mês em `.t-mono-xs` (ash-400); dia do mês em Kalnia `.t-h2` tabular (gold-400). Título: `.t-h3` bone-50. Artistas em destaque: `.t-lead` bone-50; demais: bone-300. Palcos: `.t-mono` ash-400 separados por " · ", com o ponto na `--luz-[palco]`.
- Status: selo `.t-mono-xs` com borda 1px (Esgotado: line-strong + texto bone-300; Em breve: gold-500 + texto gold-300). Nunca só cor.
- Hover (desktop, pointer fine): fundo `--ink-850` (`--dur-1-4`) e pôster 4:5 de 220 px em `clip-path: url(#f-olho)` seguindo o ponteiro (lerp .12, `--z-lente`), escondido em reduced-motion. Mobile: sem pôster na lista (pôster só no destaque).
- Destaque ("Próxima data"): pôster 4:5 sem máscara + dia em `.t-giga`.
- Esqueleto: blocos ink-850 com a altura final (sem shimmer animado; opacity .6 estática).

### 9.4 Chip de filtro
- `<button aria-pressed>` altura 44 px, `padding-inline: 18px`, raio pill, borda 1px line-strong, texto `.t-label` bone-50 + contagem `.t-mono-xs` ash-400 após 8 px.
- Hover: borda bone-50. Pressionado: fundo gold-300, texto ink-900, contagem ink-900/70 %. Foco: padrão. Transição `--dur-1-4`.
- Barra: rolagem horizontal no mobile (`scroll-snap-type: x proximity`, máscara de fade 24 px nas bordas), sticky abaixo do header (`top: 64px` / `80px`), fundo `--bg`, com `--borda-1` embaixo ao ficar sticky.
- Chips de índice (O Parque) usam o mesmo componente como `<a>`, com `aria-current="true"` no ativo (filete de 2 px gold-300 embaixo em vez de fundo).

### 9.5 Nav (header)
- Altura 64 px (<1024) / 80 px (≥1024). Posição fixa, `--z-header`. Transparente sobre hero e fundo `--ink-900` + `--borda-1` após 80 px. Some (`translateY(-100%)`) ao rolar para baixo > 8 px e volta ao subir (`--dur-1-2`, `--ease-ui`). Nunca some com menu ou foco dentro dele.
- Esquerda: símbolo (32 px de altura) + wordmark (96 px de largura; oculto <414). Centro (≥1024): O Parque · Programação · Galeria · Contato · Loja em `.t-label`, gap 32 px, item atual com pirâmide de 6 px embaixo. Direita: botão Som (só com faixa: três arcos de 20 px + "Som") e CTA primário "Ingressos" (52 px).
- <1024: símbolo + wordmark | botão "Menu" (`.t-label`, 44×44 mín.).
- **Menu mobile:** painel tela cheia `--ink-950`, `--z-menu`. Abre como pálpebra: `clip-path: inset(50% 0 50% 0) → inset(0)` (`--dur-1-2`, `--ease-olho`). Topo: CTA primário full-width com evento. Itens em Kalnia `.t-h1` com índice `.t-mono-xs` ("01"), alvo ≥ 56 px, stagger `--dur-1-8`. Fim: redes em `.t-label`. Focus trap, Esc, rolagem do body travada, foco volta ao botão.

### 9.6 Barra inferior mobile (<1024)
- `position: fixed; bottom: 0;` altura `56px + env(safe-area-inset-bottom)`, fundo `--ink-950` (sólido, sem blur), borda superior 1px `rgb(230 189 110 / .3)`, `--z-bottombar`.
- Dois botões lado a lado (gap 8 px, padding 8 px, cada um com altura 40 px visual e alvo 48 px): **Ingressos** (primário) e **Mesas** (secundário com glifo WhatsApp).
- Oculta na Programação e quando o rodapé entra na viewport (`translateY(100%)`, `--dur-1-2`). O `<main>` recebe `padding-bottom: calc(56px + env(safe-area-inset-bottom) + var(--sp-4))`.

### 9.7 Lightbox
- `role="dialog" aria-modal="true"`, `--z-lightbox`, fundo `--ink-950` com radial da `corDominante` da foto a 12 % no centro.
- Imagem `object-fit: contain` até `calc(100svh - 120px)`; topo: contador `.t-mono` ("12 / 143") à esquerda e "Fechar" (44 px, X de 1,5 px) à direita; base: legenda `.t-body-s` ("Bells: …") + crédito `.t-mono-xs`.
- Anterior/próximo: botões 56 px nas laterais (desktop), com pirâmide como seta; mobile: swipe horizontal (limiar 50 px) + botões na base.
- Abrir: FLIP da miniatura (GSAP Flip, `--dur-1`, `--ease-olho`); fechar: inverso. Reduced-motion: fade `--dur-1-4`. Carregando: miniatura borrada ampliada por baixo. Pré-carrega as vizinhas. Teclado: ←/→/Esc; focus trap; foco volta à miniatura.

### 9.8 Outros
- **Ficha (palco/obra):** `<dl>` em duas colunas, `dt` `.t-mono-xs` ash-400, `dd` `.t-mono` bone-50, divisória `--borda-1` por linha.
- **Tabela de locação (amanhecer):** sem bordas verticais; linhas 1px `--divider`; capacidade em Kalnia `.t-h2` tabular à esquerda, nome `.t-h4`, nota `.t-body-s`.
- **Input (se houver formulário):** altura 52 px, fundo `--surface`, borda 1px `--border`, raio `--r-2`, label `.t-label` acima, erro em `--alert-*` com texto e ícone (pirâmide invertida), foco = anel padrão.
- **Toast** ("Número copiado."): base centralizada, acima da barra mobile, ink-800 + texto bone-50, `role="status"`, some em 3 s.
- **Selo de ranking:** `.t-mono-xs` "#10 · DJ MAG TOP 100 CLUBS 2026", borda 1px gold-500, raio pill, `padding: 6px 12px`.

---

## 10. Ícones
Grade de 24 px, traço de 1,5 px, `currentColor`, cantos vivos. Conjunto próprio: pirâmide (avançar/voltar/abrir), pirâmide invertida (local/erro), amêndoa (ver/galeria), três arcos (som), X (fechar), menu (duas linhas de larguras 18/12 px), ↗ (externo). Glifos de marca de terceiros (WhatsApp, Instagram, YouTube, TikTok) monocromáticos, oficiais, sem círculo de fundo. Proibido ícone dentro de círculo colorido.

---

## 11. Checklist de implementação
- [ ] Tokens §1–§6 em um único `tokens.css` importado primeiro.
- [ ] Fontes auto-hospedadas com fallback ajustado (CLS 0).
- [ ] Contraste: nenhum texto abaixo dos pares da §1.2.
- [ ] Momentos M1–M4 com fallback de reduced-motion, sem JS e mobile testados.
- [ ] Alvos ≥ 44 px (CTAs 48+), foco visível em foto, fundo escuro e amanhecer.
- [ ] 360 / 414 / 768 / 1024 / 1440 / 1920 / 2560 / 3840 sem rolagem horizontal.
- [ ] LCP < 2,5 s em 4G simulado; JS inicial ≤ 90 KB gz (GSAP core + ScrollTrigger + SplitText + Lenis); three.js só sob demanda.

---

## 12. V2 imersiva (pacote 008; "§10 V2" do pedido, numerada 12 porque §10 já é Ícones)
Especificação de comportamento em `.equipe/briefs/direcao-v2.md` (A–H). Aqui ficam só os valores.

### 12.1 Tokens CSS novos
```css
:root {
  --z-fundo-gl: 0;                 /* canvas fixo do fundo vivo; <main> e header acima (main: position:relative; z-index:1) */
  --loader-simbolo: 22vmin;        /* símbolo do loader = tamanho da amêndoa de partida da abertura */
  --loader-min: calc(var(--beat) * 2);    /* 968 ms: o loader nunca some antes disso */
  --loader-max: calc(var(--beat) * 3.5);  /* 1694 ms: teto de carga; depois força 100 */
  --portal-aro: rgb(230 189 110 / .55);   /* aro do portal e da borda líquida (gold-300) */
  --scrim-right: linear-gradient(to left, rgb(12 11 13 / .85) 0%, rgb(12 11 13 / .55) 45%, rgb(12 11 13 / 0) 80%);
  /* fallback CSS do fundo vivo (cores registradas com @property <color>, transição 2 beats) */
  --humor-base: #131215; --humor-luz1: #D6A24A; --humor-luz2: #5A3E36;
}
@property --humor-luz1 { syntax: "<color>"; inherits: true; initial-value: #D6A24A; }
@property --humor-luz2 { syntax: "<color>"; inherits: true; initial-value: #5A3E36; }
```

### 12.2 Constantes JS (`src/scripts/gl/constantes.ts`; durações sempre derivadas de `--beat`)
| Grupo | Constante | Valor |
|---|---|---|
| Motor | contexto | WebGL2, `antialias:false`; fundo `alpha:false, powerPreference:'low-power'`; hero/tour `alpha:true` |
| Motor | DPR máx. | hero e tour 1,5 (mobile 1,25); o fundo ignora o DPR |
| Fundo | escala do buffer | 0,5 desktop · 0,35 mobile · governador: 0,35 → 0,25 → CSS |
| Fundo | fps | 30 (1 rAF em 2) · governador: média de 60 quadros > 20 ms desce um degrau |
| Fundo | pulso BPM | `pow(.5+.5*cos(2π·fase), 6) * 0.04` |
| Fundo | névoa | fbm de 2 oitavas, 1 warp, deriva `uScroll*0.35`, escala de ruído 1,6 |
| Fundo | teto (escuro) | `min(cor, vec3(.22,.18,.15))`: bone 11:1, ash-400 4,55:1 no pior ponto |
| Fundo | piso (amanhecer) | `max(cor, vec3(.88,.84,.78))`: L ≥ 0,686; gold-700 ≥ 4,5:1 |
| Loader | pesos de carga | fontes .15 · decode do hero .45 · sonho .25 · GL .15 |
| Loader | onda | `alça × (1 + a·sin(2π·t/(2b) + i·2π/3))`, `a = .10 + .12·p` · eco: scale 1→1,45, opacity .35→0, 1 b, máx. 3 |
| Loader | contador | Kalnia `--fs-display`, tabular, `wght = 200 + 4.5·valor` · lerp 0,15/quadro, salto máx. 12 |
| Hero | trilha | FBO RGBA8 a 1/4 da resolução (máx. 512) · decay `.965^(dt·60)` · advecção `vel·0.6` · ponteiro lerp .18 |
| Hero | pincel | raio `.06 + min(vel·.5, .08)` × menor lado (mobile .12 fixo) |
| Hero | borda | `smoothstep(.35,.65, trilha + (fbm(uv·3+t·.05)−.5)·.35)` · refração .015 · aro .35 · aberração ±.002 |
| Hero | vida | escala 1↔1,04 em 16 b · lâmpadas ±5 % (luma > .8, período ≥ 1 b) · calor .0008 no terço superior · parallax .012·(1−uv.y) |
| Hero | ocioso | 4 b sem ponteiro → Lissajous x 8 b, y 12 b, amplitude (.32, .18) |
| Olho (C) | pin | 120vh, scrub .6 · fases 0–.35 / .10–.45 / .45–.70 / .70–1 · eco com \|v\| > 800 px/s |
| Olho (C) | anéis | entrada scale 2,2/1,9/1,6, rot −6°/+4°/−2° → concêntricos 1/1,08/1,16 → empilhados −14,6 %/0/+14,6 % |
| Trajetória | pin | 220vh, scrub .5, snap nos 5 fechamentos (`duration {min:.2,max:.6}`, `power2.inOut`) |
| Tour | profundidade | `uvz = foco + (uv−foco)/(1 + z·(.4 + 1.2·d))`, z 0→.30 · parallax `(p−.5)·(.012,.008)·(d−.35)` · bloom `textureLod(…,5)·.25` |
| Tour | portal | escala 0→.14 (fim do hold) → `.14·64^t` (35vh) · contra-zoom 1,35→1 · cena que sai: scale 1,35, −40 % de luz, mip bias 2 |
| Tour | memória | máx. 3 cenas na GPU (anterior, atual, próxima) · a próxima é baixada ao entrar na atual |
| Tour | partículas | 1 draw `POINTS`, aditivo; quantidade por cena em direcao-v2 §G; tamanho pela profundidade |
| Rino | arcos orbitais | TubeGeometry r .012 na curva da amêndoa, emissivo gold-400 .8, 0,08 rad/s, planos 18°/−12°/30° |

### 12.3 Humores do fundo vivo (`data-humor`; uv com origem embaixo à esquerda)
| Humor | Onde | base | luz1 (cor · pos · raio · int) | luz2 (cor · pos · raio · int) | névoa |
|---|---|---|---|---|---|
| `datas` | Home Próximas Datas, Programação | #131215 | gold-400 · (.85,−.10) · .9 · .8 | #5A3E36 · (.10,1.0) · .7 · .6 | .55 |
| `ascensao` | Home Trajetória, O Parque #ranking | #131215 | gold-300 · (.5,−.2) · 1.0 · .6→1.0 pelo progresso | #2A2230 · (.5,1.1) · .8 · .5 | .40 |
| `palcos` | Home Palcos | #131215 | mix(gold-400, --luz-[palco em hover], .4) · (.75,.5) · .8 · .7 | ink-850 · (.1,.1) · .6 · .3 | .50 |
| `noite` | Rino (Home e O Parque) | #0C0B0D | #FFC27A · (.5,.6) · .5 · .35 | moon-300 · (.9,.9) · .5 · .25 | .20 |
| `luar` | Galeria, Home amostra | #131215 | moon-300 · (.8,1.05) · .9 · .5 | gold-500 · (.1,−.1) · .6 · .3 | .50 |
| `amanhecer` | Contato (fundo claro; usa o piso) | #F4EEE3 | gold-200 · (.5,−.2) · 1.1 · .5 | #E9C9B8 · (.9,1.0) · .7 · .4 | .35 |
| `loja` | Loja | #131215 | gold-300 · (.7,.6) · .7 · .6 | --luz-juistreet · (.1,.1) · .5 · .25 | .45 |
| `[palco]` | O Parque pós-tour, painéis | #131215 | --luz-[palco] · (.8,.2) · .8 · .6 | gold-500 · (.1,.9) · .6 · .3 | .50 |
| `jet-set` | Tour Jet Set | #0C0B0D | moon-200 · (.5,1.1) · 1.0 · .5 | gold-500 · (.5,−.2) · .6 · .2 | .60 |

Seções com foto de fundo opaca (hero, Mesas/Locação, rodapé) não declaram humor; o rodapé mantém o gradiente CSS de aurora.

### 12.4 Loader (estrutura)
`<div class="loader" aria-hidden="true">`, inserido pelo layout e visível só com `html.tem-loader`, com: SVG SimboloTraco (3 paths + pirâmide), `.loader__local` (.t-mono-xs), `.loader__rotulo` (.t-mono-xs "carregando") e `.loader__contador` (Kalnia). Máscara do furo:
```css
.loader { position: fixed; inset: 0; background: var(--ink-950); z-index: var(--z-intro);
  -webkit-mask: linear-gradient(#000 0 0), url(/img/olho.svg) center / var(--furo, 0 0) no-repeat;
  -webkit-mask-composite: xor; mask-composite: exclude;
  animation: loader-failsafe 1ms 3s forwards; }            /* o JS remove a animação ao assumir */
html:not(.tem-loader) .loader { display: none; }
@keyframes loader-failsafe { to { opacity: 0; visibility: hidden; } }
```
Leitor de tela: o loader é `aria-hidden`; o conteúdo da página está no DOM e acessível desde o 1º byte.

### 12.5 Tour de O Parque (estrutura)
```html
<div class="tour" data-tour>
  <div class="tour__palco"><canvas aria-hidden="true"></canvas></div>  <!-- sticky 100vh; só ≥1024 + WebGL2 -->
  <div class="tour__cenas">                                             <!-- margin-top: -100vh -->
    <section class="cena" id="ritual" data-cena="ritual" style="--vh:150; --vh-m:170">
      <span class="cena__ancora"></span>                                <!-- marcador no início do hold -->
      <picture class="cena__foto">…</picture>                           <!-- base mobile / sem JS; oculto quando o GL pinta -->
      <div class="cena__painel">rótulo · h2 · assinatura · corpo · ficha · link</div>
    </section> …
  </div>
</div>
```
Base/mobile: `.cena { height: calc(var(--vh-m) * 1svh) }`; `.cena__foto { position: sticky; top: 0; height: 100svh; mask: url(/img/formas/[palco].svg) center / 18% no-repeat; animation: portal linear both; animation-timeline: view(); animation-range: entry 0% cover 40%; }` com `@keyframes portal { to { mask-size: 600%; } }` e a imagem interna em `scale 1.3 → 1` no mesmo timeline. Sem suporte a `animation-timeline`: ScrollTrigger scrub nas mesmas propriedades. Os SVGs `/img/formas/*.svg` saem dos mesmos paths da §7 e §12.6 (viewBox 0 0 1 1, no aspecto da forma).

### 12.6 Formas novas e alteradas
**Alterada:** `f-raw-room` (era o recorte irregular) agora é a cruz do RxR, com proporção **1:1** em todos os tamanhos:
```html
<clipPath id="f-raw-room" clipPathUnits="objectBoundingBox"><path d="M0,0 L.2,0 L.5,.3 L.8,0 L1,0 L1,.2 L.7,.5 L1,.8 L1,1 L.8,1 L.5,.7 L.2,1 L0,1 L0,.8 L.3,.5 L0,.2Z"/></clipPath>
```
Lâmpadas (overlay SVG, viewBox 0 0 1 1): `t ∈ {.06,.15,.24,.33,.42,.5,.58,.67,.76,.85,.94}`, centros `(t,t)` e `(t,1−t)` sem duplicar (.5,.5) = 21 lâmpadas, r .012, preenchimento radial gold-200 → gold-400 → transparente (r .03). Ordem de acendimento: `|t − .5|` crescente.

**Nova:** traço do Boeing 727 (Jet Set). `viewBox="0 0 480 120"`, `fill:none; stroke: var(--moon-200); stroke-width:1; vector-effect: non-scaling-stroke; stroke-linejoin: round`, cada path com `pathLength="1"`:
```html
<path d="M12,80 C14,70 26,62 48,58 L360,54 C372,52 382,46 392,40 L428,8 L452,8 L444,46 C456,52 466,58 474,64 L470,70 C440,80 400,90 360,94 L52,96 C30,96 14,90 12,80 Z"/> <!-- fuselagem + deriva -->
<path d="M412,10 L474,4 L478,10 L428,16 Z"/>  <!-- estabilizador em T -->
<path d="M330,62 L384,60 C392,60 396,64 396,68 C396,72 392,76 384,76 L330,76 C326,76 324,72 324,69 C324,66 326,62 330,62 Z"/> <!-- motor -->
<path d="M160,90 L280,88 L240,102 L190,102 Z"/> <!-- asa -->
<path d="M28,66 L46,61 L47,67 L32,70 Z"/>       <!-- cabine -->
<path d="M60,62 L70,62 L70,86 L60,86 Z"/>       <!-- porta -->
<!-- janelas: 24 círculos r 2.2, cx = 78 + i·9.6 (i 0–23), cy 70; apagadas ink-700, acesas gold-300 -->
```
**727 em three (tour, cena Jet Set):** unidades estilizadas, eixo x = comprimento. Fuselagem `CylinderGeometry(.9,.9,11,24,1,true)` + nariz em meia-esfera com scale x 2,2 em x −5,5 + cone de cauda `ConeGeometry(.9,3,24,1,true)` em x 7, y +.25. Asas: `ExtrudeGeometry` (corda 3 na raiz e 1 na ponta, envergadura 8, enflechamento 3,5, espessura .12) em y −.55, espelhadas. Deriva: `ExtrudeGeometry` (base x 5,2→7,6 em y .8, topo x 8,3→9,2 em y 4,0, espessura .15) com estabilizador em T no topo (3,6 por lado). Motores: `CylinderGeometry(.42,.42,2.2,16)` em (6, .35, ±1.25) + central em (6.4, 1.1, 0). Material: `MeshBasicMaterial(ink-950)` + `LineSegments(EdgesGeometry(geo, 25))` em moon-200, opacity .8. Janelas: `Points`, 28 por lado em y .25, x de −4,2 a 4,6, `size 6, sizeAttenuation:false`, atributo `aceso` 0→1 (ink-700 → gold-300).

### 12.7 Registro de alterações em tokens e regras existentes
| Onde | Antes | Agora | Motivo |
|---|---|---|---|
| §4.2 loops | proibidos, exceto grão e rino | + exceções: fundo vivo, vida do hero, ponteiro virtual mobile e arcos orbitais; todos pausam fora da viewport ou com aba oculta | feedback 5, 7, 10 |
| §4.3 reduced-motion | tabela v1 | + loader: não existe · hero: só a foto realidade · fundo vivo: 1 quadro estático por humor · olho/arcos (C): nada · tour: versão mobile estática · colunas: estado final | acessibilidade |
| §7 `f-raw-room` | recorte irregular 5:4/4:5 | cruz X 1:1 (§12.6) | feedback 1 |
| direcao.md §3 curva de luz | 2 camadas CSS sol/lua | substituídas pelo fundo vivo; as camadas viram o fallback CSS | feedback 7 |
| M1 abertura | 0–0,72 s arcos + pirâmide; halo seguindo o ponteiro | arcos e pirâmide passam ao loader; o halo sai (substituído pela revelação líquida) | feedback 4, 5 |
| M1 saída | máscara volta à amêndoa de 30vw, pin 100vh | sequência dos arcos (C), pin 120vh | feedback 6 |
| M2 | polyline + pirâmide, pin 300vh | Colunas de luz em `<ol>`, pin 220vh | feedback 8 |
| §8.1 orçamento | página inicial mobile ≤ 1,2 MB | ≤ 1,35 MB (+ sonho do hero) · O Parque inicial ≤ 1,5 MB, cenas progressivas | feedback 5, 9 |
| §11 JS inicial | ≤ 90 KB gz | ≤ 105 KB gz (+ motor GL ~6, hero ~3, fundo ~3, loader ~2) | feedback 4, 5, 7 |
| §6 z-index | sem camada de canvas | `--z-fundo-gl: 0`; main `z-index: 1` | feedback 7 |
