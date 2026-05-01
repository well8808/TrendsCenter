# Motion Learning Plan

## Resumo da auditoria

Projeto auditado: Instagram Reels Command Center.

O app usa Next.js App Router, React em modo strict, TypeScript strict, Tailwind CSS v4 via `@tailwindcss/postcss`, Prisma/Neon, React Query e componentes de produto em `src/components`.

A primeira tela operacional esta em `src/app/page.tsx` e renderiza `CommandCenter` com dados carregados do tenant e da persistencia real. A rota de biblioteca/radar de Reels esta em `src/app/trends/page.tsx`, com grid principal, assistente de busca, importacao por provider, formulario de ingestao e feed de jobs.

Nao existe `tailwind.config.*` no root; o projeto usa Tailwind v4 com tokens e classes em `src/app/globals.css`. Tambem nao existe `components.json` nem pasta `src/components/ui`, entao nao ha shadcn/ui instalado formalmente neste momento, apesar de o design ja seguir componentes proprios reutilizaveis.

## Package manager detectado

Lockfile encontrado: `package-lock.json`.

Package manager correto: npm.

Comando usado:

```bash
npm install motion gsap @gsap/react lenis three @types/three @react-three/fiber @react-three/drei @react-three/postprocessing @splinetool/react-spline lottie-react
```

## Versoes principais

- React: 19.2.5
- React DOM: 19.2.5
- Next.js: 16.2.4
- TypeScript: 6.0.3

## Bibliotecas instaladas/preparadas

- `motion` 12.38.0
- `gsap` 3.15.0
- `@gsap/react` 2.1.2
- `lenis` 1.3.23
- `three` 0.184.0
- `@types/three` 0.184.0
- `@react-three/fiber` 9.6.1
- `@react-three/drei` 10.7.7
- `@react-three/postprocessing` 3.0.4
- `@splinetool/react-spline` 4.1.0
- `lottie-react` 2.4.1

Nao foi usado `--force` nem `--legacy-peer-deps`. A instalacao concluiu sem conflito de peer dependency.

## Estado visual atual

O produto atual ja tem uma base premium escura, focada em command center:

- Sidebar/nav e shell operacional no `CommandCenter`.
- Hero/radar visual e cards de resumo.
- Cards de sinais priorizados com score, fonte, risco e evidencia.
- Laboratorio de ingestao manual com formularios e historico.
- Rota `/trends` com biblioteca viral, filtros, stats, grid de videos e rail lateral.
- Estados de erro/loading em formularios, importacao e feed de jobs.
- Tokens visuais centralizados em `src/app/globals.css`.

As areas mais genericas ainda parecem ser:

- Empty states e loading states, que poderiam ganhar feedback visual mais memoravel.
- Formularios densos, especialmente ingestao e importacao, que podem receber progressao visual.
- Rail lateral da rota `/trends`, que e funcional, mas pode ganhar hierarquia e ritmos melhores.
- Transicoes entre filtros/listas, que ainda podem parecer bruscas quando os dados mudam.

## Mapa de uso por biblioteca

### motion

Usar para microinteracoes e estado de interface:

- Hover/focus/tap de botoes, cards, filtros, segmentos e pills.
- Layout animations em filtros, tabs, listas e cards salvos.
- Entradas leves de cards e rail lateral.
- `AnimatePresence` para alertas, erros, loading e empty states.
- Expansao/colapso de detalhes em `TrendCard`, `TrendVideoGrid`, `JobRunsFeed` e formularios.

Evitar usar Motion para animacoes longas e cinematicas globais; esse papel deve ficar com GSAP quando existir uma timeline real.

### gsap + @gsap/react

Usar quando houver narrativa ou sequencia:

- Timelines de entrada do command center.
- Contadores, leitura de score e progressao de coleta.
- Scroll reveal em blocos densos, sempre com `prefers-reduced-motion`.
- Parallax sutil de background ou cenas de radar.
- Sequencias que expliquem o fluxo: sinal encontrado, evidencia conectada, score calculado, acao recomendada.

Evitar GSAP em interacoes simples de botao/card, porque Motion ja cobre melhor esse tipo de UI React.

### lenis

Usar apenas se a experiencia tiver uma pagina longa com narrativa ou secoes continuas.

Bons candidatos:

- Uma futura pagina operacional de radar com secoes longas.
- Uma experiencia de review/relatorio, se houver scroll editorial.

Nao usar em:

- Areas com panels internos e scroll proprio.
- Rail sticky com `overflow-y-auto`.
- Tabelas/listas densas que precisam responder de forma direta.
- Mobile se causar atraso de input ou conflito com formularios.

### three + @react-three/fiber + @react-three/drei

Usar para cenas 3D leves e com sentido de produto:

- Radar de mercado BR/US.
- Fluxo visual de sinais: captura, evidencia, score, decisao.
- Objetos abstratos de Reels/sinais/fontes orbitando um nucleo.
- Indicadores premium em hero operacional, sem cobrir a informacao.

`drei` deve entrar para utilidades prontas: cameras, helpers, bounds, text/Html se necessario e controles controlados. Cenas precisam ser carregadas de forma lazy/dynamic para proteger o bundle inicial.

### @react-three/postprocessing

Usar com muita moderacao:

- Bloom sutil em pontos de sinal.
- Vignette leve em cena isolada.
- Depth of field apenas se nao prejudicar leitura.

Evitar efeitos pesados em dashboard denso. Performance e legibilidade vencem efeito visual.

### @splinetool/react-spline

Preparar para uma cena Spline futura, sem URL falsa.

Uso recomendado:

- Criar um wrapper client-only com import dinamico quando houver uma URL real do Spline.
- Mostrar fallback estatico/loading enquanto a cena carrega.
- Nao bloquear render principal do dashboard por causa de Spline.

### lottie-react

Usar para feedback visual pequeno e claro:

- Loading de coleta de Reels.
- Empty state quando nao ha fontes, sinais ou jobs.
- Sucesso/falha de importacao.
- Passos de progresso em ingestao.

Nao usar Lottie como decoracao repetida em cards; melhor reservar para momentos de estado.

## Riscos de performance

- Three/Spline podem aumentar o bundle e custo de GPU se forem importados direto em telas principais.
- Postprocessing pode custar caro em notebooks e mobile.
- Lenis pode conflitar com scroll interno, sticky sidebars e formularios.
- Muitas animacoes simultaneas em listas podem causar layout/repaint excessivo.
- `preserveDrawingBuffer` em WebGL aumenta custo e deve ser usado somente quando necessario.
- Motion/GSAP juntos precisam de divisao clara: Motion para UI, GSAP para timeline/narrativa.
- Sempre respeitar `prefers-reduced-motion`.

## Arquivos provaveis da proxima fase

Possiveis arquivos de produto, se a fase de implementacao for autorizada:

- `src/components/command-center.tsx`
- `src/components/trend-card.tsx`
- `src/components/trend-video-grid.tsx`
- `src/components/trend-stats-deck.tsx`
- `src/components/ingestion-lab.tsx`
- `src/components/ingestion-request-form.tsx`
- `src/components/provider-reels-import-form.tsx`
- `src/components/reels-search-assistant.tsx`
- `src/components/job-runs-feed.tsx`
- `src/components/reels-radar-scene-3d.tsx`
- `src/components/providers.tsx`, somente se Lenis ou providers globais forem realmente necessarios.
- `src/app/globals.css`, somente para tokens/classes de suporte.

## O que nao fazer na proxima fase

- Nao transformar o app em landing page.
- Nao colocar 3D por decoracao sem explicar dado, fluxo ou decisao.
- Nao animar tudo ao mesmo tempo.
- Nao criar promessas de dados reais quando a fonte for demo/manual.
- Nao mexer em banco, auth, rotas, API ou env vars para uma mudanca visual.
- Nao usar Lenis globalmente sem testar scroll interno.
- Nao importar Spline/Three no server component.
- Nao bloquear o dashboard esperando cena 3D carregar.
- Nao esconder erro de conector com visual bonito.

## Checklist para implementacao futura

- Definir o papel narrativo da animacao antes de codar.
- Escolher 1 tela principal para evoluir primeiro.
- Mapear hierarquia: o que deve chamar atencao, o que deve ficar quieto.
- Criar fallback para reduced motion.
- Carregar 3D/Spline com dynamic import.
- Testar desktop e mobile.
- Medir bundle e observar console.
- Rodar lint, build e test.
- Validar se a interface continua operacional e escaneavel.

## Proximo passo recomendado

Implementar uma fase pequena e objetiva: "Radar visual com sentido".

Escopo sugerido:

- Melhorar apenas a area principal do radar/hero.
- Usar Motion para entrada e estado.
- Usar GSAP para uma timeline curta que conte o fluxo BR/US.
- Usar React Three Fiber somente se a cena 3D representar coleta, evidencia e decisao.
- Adicionar loading/progresso em coleta sem inventar dados.

Essa fase deve terminar com browser test em desktop e mobile antes de qualquer deploy.
