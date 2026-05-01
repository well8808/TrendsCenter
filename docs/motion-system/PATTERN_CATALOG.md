# Pattern Catalog

Catalogo de padroes para implementar depois. Nenhum padrao deve entrar sem teste visual e sem criterio de utilidade.

## Animated active sidebar pill

Objetivo: mostrar com clareza onde o usuario esta.

Biblioteca recomendada: Motion layout animations.

Onde usar: sidebar principal do command center.

Risco de exagero: indicador grande ou brilhante demais competir com os dados.

Performance: usar `layoutId`, transform/opacity e evitar blur animado.

## Smooth page transition

Objetivo: suavizar troca entre views sem esconder carregamento real.

Biblioteca recomendada: Motion + AnimatePresence.

Onde usar: transicoes leves entre areas do app.

Risco de exagero: deixar navegacao mais lenta.

Performance: animar wrapper pequeno, nao a pagina inteira com blur/filter.

## Animated metric cards

Objetivo: indicar atualizacao de metricas e prioridade.

Biblioteca recomendada: Motion ou GSAP para contadores.

Onde usar: cards de stats e score.

Risco de exagero: todos os numeros animando o tempo todo.

Performance: animar somente quando valor muda ou entra no viewport.

## Animated counters

Objetivo: reforcar variacao numerica.

Biblioteca recomendada: GSAP ou Motion `animate`.

Onde usar: score, evidence_count, reels encontrados, jobs.

Risco de exagero: numero parecer jogo/cassino.

Performance: pausar com reduced motion e evitar loop.

## Hover lift cards

Objetivo: dar sensacao de superfice clicavel.

Biblioteca recomendada: CSS/Tailwind ou Motion.

Onde usar: cards selecionaveis e previews.

Risco de exagero: card pular demais e cansar.

Performance: `transform: translateY`, sombra discreta.

## Command palette motion

Objetivo: fazer busca/acesso rapido parecer profissional.

Biblioteca recomendada: Motion + AnimatePresence.

Onde usar: futura command palette ou busca global.

Risco de exagero: modal parecer landing overlay.

Performance: animar overlay e panel; nao animar cada linha em listas grandes.

## Empty state with Lottie

Objetivo: orientar sem parecer tela quebrada.

Biblioteca recomendada: Lottie/dotLottie.

Onde usar: sem fontes, sem sinais, sem jobs, sem resultados de busca.

Risco de exagero: lottie decorativo demais ou infantil.

Performance: carregar sob demanda e desligar autoplay em reduced motion.

## Radar/Trend pulse visualization

Objetivo: mostrar que um sinal esta sendo monitorado ou priorizado.

Biblioteca recomendada: Motion, GSAP ou R3F se for 3D.

Onde usar: radar principal, score hot, job running.

Risco de exagero: varios pulsos simultaneos causarem ruido.

Performance: limitar a poucos elementos e respeitar reduced motion.

## 3D ambient background object

Objetivo: elevar a percepcao premium sem atrapalhar leitura.

Biblioteca recomendada: R3F/Drei ou Spline.

Onde usar: hero operacional, area de radar.

Risco de exagero: virar wallpaper pesado.

Performance: dynamic import, dpr limitado, fallback estatico, pausar fora do viewport.

## Floating glass panel

Objetivo: dar profundidade em panels importantes.

Biblioteca recomendada: CSS/Tailwind + Motion leve.

Onde usar: painel de detalhes, assistente, importador.

Risco de exagero: blur e transparencia reduzirem legibilidade.

Performance: blur estatico, sem animar filter.

## Scroll reveal sections

Objetivo: organizar leitura em secoes longas.

Biblioteca recomendada: Motion `whileInView`, react-intersection-observer ou GSAP ScrollTrigger.

Onde usar: relatorios, docs internas, futuras views editoriais.

Risco de exagero: dashboard parecer lento.

Performance: once, threshold simples, sem stagger longo.

## Staggered list entrance

Objetivo: facilitar leitura de listas recem-carregadas.

Biblioteca recomendada: Motion.

Onde usar: resultados de busca, fontes, historico recente.

Risco de exagero: atrasar acesso a item importante.

Performance: stagger curto e maximo visual por bloco.

## Magnetic CTA button

Objetivo: dar polish em acao principal.

Biblioteca recomendada: Motion.

Onde usar: CTA primario de coleta/importacao, com muita moderacao.

Risco de exagero: interacao parecer brinquedo.

Performance: usar motion values e spring, desativar em reduced motion.

## Loading skeleton premium

Objetivo: comunicar espera com calma.

Biblioteca recomendada: CSS/Tailwind + Motion opcional.

Onde usar: cards, rail, listas e feed de jobs.

Risco de exagero: shimmer forte demais.

Performance: CSS simples, sem blur animado.

## Data cards with subtle depth

Objetivo: separar camadas de informacao.

Biblioteca recomendada: CSS/Tailwind + Motion hover.

Onde usar: trend cards, metric cards, source cards.

Risco de exagero: todos os cards competirem.

Performance: sombras discretas e transicoes curtas.

## Trend heat pulse

Objetivo: indicar prioridade temporal de um sinal.

Biblioteca recomendada: Motion ou CSS keyframes.

Onde usar: apenas sinais hot/agora.

Risco de exagero: tudo parecer urgente.

Performance: limitar a poucos pontos e pausar em reduced motion.

## Social media preview card motion

Objetivo: dar contexto de Reel/creator sem abrir o Instagram.

Biblioteca recomendada: Motion.

Onde usar: cards de video na biblioteca `/trends`.

Risco de exagero: preview roubar atencao do score e evidencia.

Performance: animar poster/meta, nao autoplay de video externo.
