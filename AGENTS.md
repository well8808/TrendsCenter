# AGENTS.md

Este repo constroi um app premium de inteligencia de mercado Instagram Reels, com foco principal em Brasil e EUA como radar antecipado.

## Produto

- Nao criar landing page generica; a primeira tela deve ser um app operacional.
- O produto e um command center de decisao: Reels, sinais, fontes, confianca, riscos, watchlists e proximos passos.
- O foco principal e Brasil; EUA e usado como early-signal.
- O nicho adulto 18+ so pode ser tratado como analise segura de marketing, linguagem, estetica, funil, formato e padroes criativos.
- Nunca sexualizar idade ambigua; qualquer mencao adulta precisa assumir 18+ explicito e seguro.

## Dados

- Nao inventar insights de producao.
- Todo insight deve ter source, collected_at, market, confidence e evidence_count.
- Dados demo/mock devem ser marcados visualmente na UI e no schema.
- Usar fontes oficiais primeiro: Instagram Reels, Instagram Professional Dashboard, Instagram Graph API, Meta Business Suite, Meta Ad Library e fontes owned/licenciadas.
- Nao implementar scraping clandestino, bypass, download de midia de terceiros ou remocao de watermark.

## Compliance

- Proibido: menores, idade ambigua, sexualizacao de jovens, pornografia, solicitacao sexual, facilitacao de servicos sexuais e conteudo explicito.
- Nao remover marcas d'agua de terceiros.
- Upload/media pipeline so pode processar arquivos proprios ou licenciados.
- Audios comerciais precisam de direito/licenca comprovada.

## Arquitetura

- Next.js 14 App Router, TypeScript strict, Tailwind CSS v4, motion/react, Postgres/Prisma.
- Stack de animacao autorizado: motion/react (principal), gsap + @gsap/react, three.js + @react-three/fiber + drei, lottie-react, lenis, @splinetool/react-spline.
- Manter scoring e proveniencia testaveis fora da UI.
- Separar demo data de conectores reais.
- Jobs locais nao devem fazer rede externa nem scraping; falhas de conector devem ficar visiveis como falhas.
- Componentes de app devem ser densos, escanaveis e acessiveis.

## Plataforma

- Produto usado exclusivamente em desktop (PC). Nao otimizar para mobile.
- Largura minima: 1280px. Breakpoints relevantes: lg: (1024px) e xl: (1280px).
- Sidebar e right rail sao hidden lg:block — intencional, nao implementar fallback mobile.

## UI

- A experiencia inicial deve parecer um produto premium, nao um wireframe.
- Priorizar design tokens, navegacao principal, estados vazios, loading, erro e demo.
- Usar motion para hierarquia e feedback, nao como decoracao gratuita.
- Nao usar textos que prometam dados reais quando a fonte e mock.

## Linguagem da UI

- Labels devem ser diretos e claros. Sem jargao tecnico nos textos voltados ao usuario.
- Preferir: "Sinais" nao "Sala de Sinais criativos".
- Preferir: "filtros ativos" nao "recorte ativo".
- Preferir: "em destaque" nao "foco do recorte".
- Evitar nas mensagens de usuario: "radar", "recorte", "persistidos", "workspace".
- Mensagens de erro: claras e acionaveis, sem referencias a conceitos internos do sistema.

## Animacoes — regra atual

- Animacoes SOMENTE quando comunicam estado ou hierarquia.
- PROIBIDO: loops infinitos em elementos decorativos de fundo (auras CSS, linhas, setas sem proposito).
- PERMITIDO: entrada staggered de cards, counter ao entrar em viewport, barra de score, live-dot de status, signal-now-pulse.
- .trend-energy-aura e .trend-energy-line devem ser ESTATICOS (sem animation: no CSS).
- Nao usar animate={{ x: [0, N, 0] }} com repeat: Infinity em elementos decorativos.

## Verificacao

- Antes de concluir mudancas, rodar npm run build para confirmar zero erros TypeScript.
- Para UI, validar visualmente em desktop (1280px+).
- Se uma validacao nao rodar, reportar exatamente o que foi e o que nao foi verificado.

## Ambiente Windows/Codex

- Evitar Start-Process para subir dev server neste ambiente.
- Se next dev falhar com spawn EPERM, o problema e permissao de spawn no sandbox, nao bug do app.
- Para validacao local, preferir npm run dev -- --hostname 127.0.0.1 --port 3000.

## Plataforma

- Produto usado exclusivamente em desktop (PC). Não otimizar para mobile.
- Breakpoints relevantes: `lg:` (1024px) e `xl:` (1280px). Sidebar e right rail são `hidden lg:block` — intencional.

## Linguagem da UI

- Labels devem ser diretos e claros. Evitar jargão técnico nos textos voltados ao usuário.
- Preferir: "Sinais" em vez de "Sala de Sinais criativos"; "filtros ativos" em vez de "recorte ativo"; "em destaque" em vez de "foco do recorte".
- Evitar nas mensagens de usuário: "radar", "recorte", "persistidos", "workspace".
- Mensagens de erro: claras e acionáveis. Sem referência a conceitos internos do sistema.

## Animações — regra atual

- Animações SOMENTE quando comunicam estado ou hierarquia.
- **Proibido**: loops infinitos em elementos decorativos de fundo.
- **Permitido**: entrada staggered de cards, counter ao entrar em viewport, barra de score, live-dot, signal-now-pulse.
- `.trend-energy-aura` e `.trend-energy-line` devem ser estáticos (sem `animation:`).
