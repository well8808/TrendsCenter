# Phase 1 Applied

Data: 2026-05-01

## Escopo aplicado

Fase 1 aplicada de forma controlada no dashboard principal.

Arquivos de produto alterados:

- `src/components/command-center.tsx`
- `src/components/motion-system/AnimatedNumber.tsx`

## O que entrou

### Sidebar active indicator

O indicador ativo da sidebar continua usando Motion `layoutId`, agora com `prefers-reduced-motion` explicito.

Aplicacao:

- `SidebarNavGroup`
- `layoutId="sidebar-active"`
- hover indicator desligado quando o usuario prefere movimento reduzido
- `aria-current="page"` no item ativo

Objetivo:

- deixar navegacao ativa mais clara;
- evitar motion desnecessario para usuarios sensiveis a movimento.

### AnimatedNumber em metricas reais

`AnimatedNumber` passou a ser usado nas metricas principais do dashboard.

Aplicacao:

- metric tiles principais em `MetricTile`
- contador de sinais filtrados

Objetivo:

- dar feedback de atualizacao em numeros reais ja existentes;
- nao criar nenhum dado novo;
- manter motion curto e discreto.

### MotionCard em metric tiles

`MotionCard` passou a envolver os cards principais de metrica.

Aplicacao:

- `MetricTile`

Objetivo:

- padronizar hover/lift leve;
- respeitar `prefers-reduced-motion`;
- manter a superficie operacional sem redesign.

### Empty state com reduced motion

`EmptyState` agora desliga deslocamentos quando `prefers-reduced-motion` esta ativo.

Aplicacao:

- estado vazio;
- estado filtrado;
- estado de erro.

Objetivo:

- manter feedback visual sem prejudicar acessibilidade.

### Filter/list transition controlada

A lista de sinais ganhou wrapper Motion leve com `layout="position"` e `AnimatePresence initial={false}`.

Aplicacao:

- lista de `filteredSignals`

Objetivo:

- reduzir brusquidao quando filtros mudam;
- evitar animacao inicial agressiva;
- manter cards e dados existentes.

## O que nao entrou

- Nenhum redesign completo.
- Nenhuma landing page.
- Nenhum dado ficticio.
- Nenhuma mudanca em banco, auth, Prisma, API, env vars ou regras de negocio.
- Nenhum 3D novo.
- Nenhum Lenis global.
- Nenhum Spline/R3F importado no bundle inicial por esta fase.

## Bibliotecas usadas nesta fase

- Motion: sidebar, metric cards, empty states e transicao leve de lista.
- Componentes internos: `AnimatedNumber` e `MotionCard`.

GSAP, 3D, Lenis e Lottie continuam disponiveis, mas nao foram ampliados nesta fase.
