# Cinematic Motion + WebGL 7A

## Visao

A Fase 7A transforma a experiencia em um fluxo visual de produto:

`Reel detectado -> Signal -> Opportunity Brief -> Pauta criada -> Draft no Estudio`

A direcao e cinematografica, mas operacional. Motion existe para orientar leitura, decisao e continuidade entre Biblioteca Viral, Opportunity Brief e Estudio.

## Componentes criados

- `src/lib/trends/cinematic-flow.ts`: contrato puro para estagios do fluxo, resumo da biblioteca e estados de decisao.
- `CinematicPageShell`, `CinematicSection`, `CinematicReveal`, `CinematicCard`, `CinematicMetric`: primitives de motion com reduced motion embutido.
- `DecisionFlowStepper`: mostra o caminho real da oportunidade com estados complete/current/waiting.
- `CinematicSignalUniverseStage`: wrapper lazy com fallback HTML/CSS e bloqueio de WebGL em mobile/reduced motion.
- `CinematicSignalUniverseScene`: cena Three.js data-driven com Reels como laminas verticais e trilhas ate os estagios do fluxo.
- `StudioDraftMotionCard`: card de draft com microinteracao leve para o Estudio.

## Onde WebGL aparece

- `/trends`: hero da Biblioteca Viral, substituindo a antiga cena da biblioteca para manter no maximo um canvas na pagina.
- Dashboard/Sala de Sinais: a cena antiga continua isolada e foi ajustada para renderizar menos quando fora da viewport.

## Como os dados reais influenciam a cena

- Reels reais viram laminas 9:16.
- `trendScore` altera cor, brilho e escala.
- `views`, `growthViews`, `velocityScore` e evidencias influenciam intensidade e posicao pelas funcoes existentes de layout.
- `thumbnailUrl`/`media.posterUrl` entram como textura quando carregam; se falharem, a lamina usa poster editorial com dados reais.
- Decisao e draft alimentam os estagios Pauta e Studio.

## Reduced motion

- `prefers-reduced-motion` impede montagem do canvas.
- Conteudo nao fica invisivel esperando reveal.
- Stepper, cards e metricas aparecem sem deslocamento.
- Fallback HTML/CSS preserva o fluxo sem animacao pesada.

## Mobile

- Viewports abaixo de 760px nao montam WebGL pelo budget existente.
- O fallback mantem contexto visual e cards reais continuam sendo o foco.
- `/login` nao importa nem monta WebGL.

## Performance budget

- No maximo 1 canvas em `/trends`.
- Canvas lazy via `next/dynamic`.
- DPR limitado pelo quality helper existente.
- Render loop reduzido para ~24fps.
- Cena antiga e nova param quando fora da viewport.
- Sem postprocessing novo.
- Sem dependencia nova.
- Sem `preserveDrawingBuffer`.

## O que nao foi mexido

- Prisma schema, migrations, banco estrutural.
- Auth, env vars, API keys.
- Bright Data, pipeline de coleta, midia, thumbnails, cache/proxy/CDN.
- Scoring principal, dedupe e normalizacao principal.
- Dados fake, seeds ou mocks visuais.

## Proximos passos recomendados

- Validar em producao antes de qualquer deploy de 7A.
- Se o fluxo visual for aprovado, criar uma fase curta para polir copy dos CTAs do Studio.
- Nao adicionar cache/proxy de midia sem evidencia real de expiracao recorrente.
