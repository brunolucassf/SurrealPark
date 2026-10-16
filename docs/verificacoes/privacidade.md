# Auditoria de privacidade e compliance: Surreal Park V2

Data: 2026-10-16. Engenharia de privacidade e conformidade de conteúdo, **não é parecer jurídico**. Todo item marcado "requer validação" ou "revisar com advogado" depende de revisão profissional antes de publicar.

## 1. Inventário real (grep em src/ e public/)

| Item | Achado | Dado pessoal? |
|---|---|---|
| Formulários, login, API, banco | Nenhum | Não |
| Cookies (document.cookie) | Nenhum | Não |
| localStorage | Nenhum | Não |
| sessionStorage | `surreal:abertura` = "1" (Base.astro l.38, scripts/loader.ts l.34). Só evita repetir a animação de abertura | Não (funcional) |
| Fontes | Locais, em /fonts (fonts.css só com url(/fonts/...)). Sem Google Fonts | Não |
| iframes, mapas embutidos, vídeos embutidos | Nenhum. Google Maps e Waze são só links (contato/mensagens.ts) | Não |
| fetch/XHR | Só hero.ts e parque-motor.ts, carregando texturas/imagens (confirmar que as URLs são do próprio domínio; nada indica terceiros) | Não |
| Analytics, pixels, tags | Nenhum hoje | Não |
| JSON-LD (schema.org) | Só dados do negócio, sem pessoas | Não |
| Links de saída | wa.me (mesas 554789011563, locação 5547984680168, com mensagem pré-escrita), mailto (contato@surreal.art.br, maitejanuario@surreal.art.br com assunto e corpo pré-preenchidos), Ingresse, Blueticket (hoje URLs genéricas das home), Instagram (2 contas), YouTube, TikTok, Google Maps, Waze, djmag.com | Só depois do clique, no terceiro |
| Hospedagem/CDN | Não identificado no código. Logs de acesso (IP) existem no provedor | Sim (IP): pendência |
| Dados de pessoas expostos | Nomes de contato: telefone/e-mail comercial de "Maitê Januário" (e-mail maitejanuario@surreal.art.br), nome de Renato Ratier em texto institucional e como artista | Dado de pessoa natural: requer validação de que há autorização |

Conclusão: o site hoje trata praticamente nenhum dado pessoal. Não há necessidade de banner de cookies hoje.

## 2. Base legal por finalidade (proposta, requer validação jurídica)

| Finalidade | Base proposta | Observação |
|---|---|---|
| Servir o site e segurança (logs) | Legítimo interesse (art. 7º, IX) | Registrar prazo de logs do provedor |
| Responder WhatsApp/e-mail de mesas e locação | Procedimentos preliminares a contrato a pedido do titular (art. 7º, V) | Alternativa: legítimo interesse. Advogado decide |
| Venda de ingressos | Ingresse/Blueticket como controladores próprios | Não há operação do Surreal no site |
| Analytics/GA4/Meta Pixel (futuro) | Consentimento (art. 7º, I) | Ver especificação na seção 5 |
| Dados sensíveis | Nenhum tratado | Orientar a não enviá-los em mensagens |

## 3. Cookies e armazenamento

Uma só entrada: sessionStorage `surreal:abertura` (essencial/funcional, sem identificador, vida = aba). Nenhum cookie próprio ou de terceiro. Quem aplica, ao adicionar GA4/Meta Pixel, deve atualizar a seção "Cookies" de src/pages/privacidade.astro e a tabela de finalidades.

## 4. Política publicada

Criada em `src/pages/privacidade.astro` (rota /privacidade, que o rodapé já linka, resolvendo o 404). Seções: quem somos, dados, finalidades e bases, cookies, terceiros, direitos (LGPD art. 18), retenção, crianças e adolescentes (18+), alterações, contato. Em produção não aparece "[A CONFIRMAR PELO CLIENTE]": o marcador só renderiza com `import.meta.env.DEV`, e os campos razão social, CNPJ e encarregado ficam ocultos até receberem valor (constantes `razaoSocial`, `cnpj`, `encarregado` no frontmatter).

### Pendências do cliente (bloqueiam publicar a política como definitiva)
1. Razão social e CNPJ do controlador.
2. Encarregado (DPO) ou canal designado; a LGPD exige divulgar identidade e contato do encarregado (requer validação do prazo/obrigatoriedade para o porte).
3. Provedor de hospedagem/CDN e prazo de guarda de logs.
4. Prazo de retenção das conversas de WhatsApp e e-mail de reservas.
5. Quem atende o canal contato@surreal.art.br e SLA para pedidos de titular.
6. Revisão da política por advogado.

## 5. Especificação do consentimento (implementar só ao entrar GA4/GTM/Meta Pixel)

Gatilho: o banner só entra no mesmo PR que adiciona qualquer tag não essencial. Sem tag, sem banner.

**Categorias**
- Essenciais (sempre ativas, sem consentimento): sessionStorage de abertura e a própria preferência de consentimento.
- Estatísticas: GA4.
- Marketing: Meta Pixel (e qualquer remarketing).
GTM é contêiner: tratar como a categoria mais restrita que ele carregar; preferir não carregar GTM antes da escolha.

**Regras**
1. Bloqueio prévio: nenhum script, pixel, iframe ou requisição a domínio de terceiro não essencial antes do "aceitar". Carregar por injeção dinâmica após o evento de consentimento. Consent Mode do Google em `denied` por padrão se GTM/GA4 for pré-carregado (requer validação de que a configuração não envia pings sem cookie).
2. Recusar tão fácil quanto aceitar: dois botões no primeiro nível, mesmo tamanho, peso e contraste: "Aceitar tudo" e "Recusar tudo", mais "Escolher" (categorias com toggles desligados). Sem dark pattern, sem pré-marcado, sem fechar no X contando como aceite (X = recusar).
3. Texto sugerido (revisar com advogado): "Usamos cookies de medição e marketing só se você deixar. Sem eles o site funciona igual. Saiba mais na Política de Privacidade. [Recusar tudo] [Escolher] [Aceitar tudo]".
4. Registro da escolha: cookie/localStorage próprio `surreal:consentimento` = `{versao, estatisticas, marketing, data}` (sem ID de pessoa), validade 6 meses (requer validação) e nova pergunta se a `versao` da política mudar. Para prova, bastam versão e data no navegador, já que não há conta de usuário; um log no servidor exigiria base e retenção próprias.
5. Reabertura: link "Preferências de cookies" no rodapé, junto a "Privacidade" (Rodape.astro), sempre visível, abrindo o mesmo painel; revogação apaga/para as tags e remove cookies já criados (`_ga*`, `_fbp`).
6. Eventos (CustomEvent no window): `surreal:consentimento-pronto` (leitura inicial) e `surreal:consentimento-alterado` com `detail: {estatisticas, marketing}`. Carregadores de tag escutam esses eventos.
7. Acessibilidade: diálogo não modal ou modal com foco preso e Esc, `role="dialog"` com rótulo, alvos de 44 px, não cobrir a barra mobile (BarraMobile) nem causar CLS: posicionado em fixed, fora do fluxo. `prefers-reduced-motion` respeitado.
8. Eventos enviados às ferramentas: só page_view, cliques em ingressos/WhatsApp (sem texto da mensagem). Nada de dado sensível, e-mail ou telefone em parâmetros. Meta Pixel sem Advanced Matching.
9. Atualizar a política antes do release (ferramenta, finalidade, prazo dos cookies, transferência internacional: GA4 e Meta processam fora do Brasil, requer validação do texto).

## 6. Revisão de textos sensíveis

| # | Achado (arquivo) | Risco | Proposta | Status |
|---|---|---|---|---|
| 1 | "maior club do mundo" (data/tour.ts l.309: "É por essa medida que o Surreal se chama de maior club do mundo") | Alegação comparativa/superlativa de publicidade (CDC, CONAR: comprovação exigida) | Pedir ao cliente a fonte da medição de 135 mil m² e a comparação. Sem comprovação: "um dos maiores clubs a céu aberto do mundo" ou apenas "135 mil m²". Manter a atribuição ao próprio cliente ("se chama") ajuda, mas não substitui prova | Requer validação |
| 2 | Ranking "#10 DJ Mag Top 100 Clubs 2026", "79º em 2022", "Cinco edições" (site.ts, RankingDoParque, index meta) | Número de terceiro precisa ser fiel; uso de marca DJ Mag | Conferir na lista oficial (link já citado como fonte) antes de publicar; evitar aparência de selo oficial da DJ Mag; checar se há política de uso da marca | Requer validação |
| 3 | 18+ só informativo (Rodape, Regras, programação, meta description) | Aviso presente e claro. Controle real é na portaria | Manter. Não vender como "verificação". Sugerir cliente confirmar a regra de portaria (documento oficial com foto) e que o texto vale para qualquer comprador de ingresso | OK, informativo |
| 4 | Bebidas alcoólicas (CONAR, Anexo A, código de autorregulamentação) | Hoje o site fala de "bar de sucos" (tour.ts l.309) e não promove bebida alcoólica. Se entrarem posts, mesas com "garrafa", open bar, patrocinadores de bebida ou fotos com marcas, aplicam-se regras: público adulto, sem incentivar consumo excessivo, sem associar a sucesso/direção, aviso "beba com moderação" | Regra para o copy: nenhuma menção a bebida alcoólica sem passar por esta revisão. Se vier, incluir o aviso de moderação e público 18+. Quem confirma o texto exato do aviso: o cliente/jurídico. Não citei número de artigo por não poder confirmar | Requer validação (preventivo) |
| 5 | Fotos de público (galeria, hero, tour, GaleriaAmostra: dezenas de fotos de eventos) | Direito de imagem (Constituição, Código Civil) e dado pessoal (LGPD). Pessoas identificáveis em fotos de festa, inclusive em situação íntima, podem pedir retirada | Pedir ao cliente: (a) cláusula/termo de uso de imagem nos ingressos e/ou aviso de captação na portaria ("evento com registro de imagens"); (b) contrato dos fotógrafos com cessão de uso das imagens ao parque; (c) canal de retirada: contato@surreal.art.br, resposta em prazo definido, e remoção rápida; (d) evitar close em rosto reconhecível e fotos constrangedoras; (e) nenhum menor | Pendência do cliente |
| 6 | Crédito de fotógrafos (Diego Jarschel, Ebraim Martini) | Autoria é direito moral (Lei de Direitos Autorais exige crédito); hoje aparece no lightbox ("Foto: ...") e em GaleriaAmostra e RetireNoParque, mas **o tour e as fotos da home (palcos) não creditam** | Aplicar crédito consistente onde a foto de autor conhecido aparece (tour.ts usa jardim-ebraim-0223 e nomad-diego-0733 sem legenda de crédito). Opcional: página de créditos. Confirmar contrato de cessão de ambos | Correção sugerida ao Maestro |
| 7 | Marcas de terceiros e artistas (Ratier, D-Edge, Warung em tour.ts l.308; DJ Mag; Boeing 727; Ingresse/Blueticket) | Menção descritiva é tolerável; uso de logos ou sugestão de parceria exige autorização | Manter só nome em texto, sem logos. D-Edge/Warung: confirmar com Renato Ratier que a biografia está correta e autorizada. Nome e imagem de artistas em line-up: confirmar autorização dos artistas/agências antes de divulgar; Boeing 727 é objeto, sem marca na comunicação | Requer validação |
| 8 | Eventos com `"exemplo": true` (content/eventos: Old Is Cool, Ágape, Reveillon, Boma) com datas e ingresso_url genéricos (home da Ingresse/Blueticket) | Publicar data/evento/link de compra inventado enganaria o consumidor (CDC), e viola a regra 9 do projeto | Antes de publicar: substituir por eventos reais com link de compra do evento, ou ocultar tudo que for `exemplo`. Bloqueia release | Alta severidade |
| 9 | Render de projeto do Jet Set / Boeing 727 | Já rotulado como "Render de projeto" | Manter o rótulo em todo uso; sem prazo de abertura (já há "data ainda não foi anunciada") | OK |
| 10 | Dados de contato de Maitê Januário (e-mail e WhatsApp de locação) | Dado de funcionária exposto publicamente | Confirmar que ela autorizou; preferir canal genérico da empresa | Requer validação |
| 11 | Mensagem pré-escrita pede "Meu nome:" nos links wa.me (site.ts) | Mínimo de dados: ok, é o usuário quem envia | Manter; a política já informa | OK |
| 12 | Capacidade "cerca de 12 mil pessoas" (tour.ts l.333) e capacidades em Locação | Afirmações de lotação podem conflitar com alvará/AVCB | Cliente confirmar números com a documentação | Requer validação |

## 7. Pendências e riscos para o Maestro

- Severidade alta: eventos de exemplo publicados (item 8); política sem dados do controlador e sem revisão jurídica (seção 4).
- Média: crédito de fotógrafos inconsistente (6), "maior club do mundo" (1), direito de imagem (5).
- Baixa: link do rodapé "Privacidade" agora resolve; adicionar `rel` e sitemap se houver lista manual de rotas (não verifiquei o sitemap).
- `npx astro check` NÃO foi executado: o subagente não tinha ferramenta de shell. Rodar antes de commitar.
- Quando entrar analytics: voltar ao agente de Privacidade para implementar/auditar o banner conforme a seção 5.
