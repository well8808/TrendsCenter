# CLAUDE.md — TikTok Market Intelligence

> Lê isso antes de tocar em qualquer arquivo. Este é o briefing completo do produto.

---

## O que é este produto

**Nome interno:** TikTok Market Command Center
**Propósito:** Plataforma de inteligência de mercado para identificar trends do TikTok antes de explodirem no Brasil. Monitora sinais do mercado americano (10%) que migram para o BR (90%), com foco no nicho hot.

O usuário deste produto é um **profissional de marketing/conteúdo** que toma decisões rápidas com base em sinais de tendência. Ele não tem tempo pra erro. Cada sessão é uma missão de coleta de inteligência.

**O produto deve se sentir como:** uma sala de guerra de inteligência, não um dashboard SaaS genérico.

---

## Stack — não alterar a estrutura base

```
Framework:    Next.js 14 — App Router exclusivamente
Language:     TypeScript strict — sem any, sem shortcuts
Database:     Neon (Postgres serverless) via Prisma ORM
Auth:         Sistema próprio com sessão por tenant — NÃO substituir
Styling:      Tailwind CSS v4 — sem styled-components, sem CSS modules
Animation:    motion/react (Framer Motion) — já instalado, USE
Icons:        lucide-react — já instalado, não adicionar outras libs
State:        Server Components + Server Actions — evitar useState quando possível
Deploy:       Vercel
```

---

## Sistema de Design — a lei

### Paleta de cores (CSS variables já definidas — use sempre estas)

```css
/* Backgrounds */
--background:       #070706    /* fundo base — quase preto, não preto puro */
--surface:          #10100d    /* cards e painéis */
--surface-elevated: #171714    /* elementos elevados */
--surface-soft:     #1f1e19    /* hover states */

/* Texto */
--foreground:       #efe9dc    /* texto principal — quente, não branco frio */
--muted:            #b2aa9a    /* texto secundário */
--muted-strong:     #ded4c1    /* texto de suporte importante */

/* Cores de sinal — identidade do produto */
--acid:    #c7ff5d   /* ALTA PRIORIDADE — trends quentes, score alto */
--aqua:    #40e0d0   /* INFORMAÇÃO — links, foco, navegação */
--coral:   #ff6f61   /* ALERTA — risco alto, bloqueado */
--gold:    #f3c969   /* ATENÇÃO — prioridade média, próximo teste */
--violet:  #a98cff   /* ESPECIAL — revival signals, US→BR */

/* Sistema */
--line:        rgba(239,233,220,0.15)   /* bordas sutis */
--line-strong: rgba(239,233,220,0.26)   /* bordas destacadas */
--danger:  #ff4d4d
--success: #79e884
```

### Regra das cores de sinal
Cada cor tem semântica definida pelo tipo de trend. **Nunca usar aleatoriamente:**
- `--acid` → score ≥ 78 / prioridade "now" / aceleração confirmada
- `--aqua` → navegação, foco, informação neutra, US signals
- `--gold` → score 52–77 / prioridade "next" / atenção moderada
- `--coral` → risco alto / bloqueado / erro
- `--violet` → sinais de revival / US→BR transfer

### Tipografia

```css
/* Sans — UI principal */
font-family: "Segoe UI", "Inter", "SF Pro Display", -apple-system, sans-serif;

/* Mono — números, scores, métricas, dados */
font-family: "Cascadia Code", "SFMono-Regular", Consolas, monospace;
```

**Hierarquia:**
- Headings principais: `text-4xl md:text-6xl font-semibold leading-[1.02]`
- Subheadings: `text-2xl md:text-3xl font-semibold`
- Eyebrow (labels acima de títulos): classe `.eyebrow` — `text-[0.68rem] font-bold tracking-[0.18em] uppercase text-[color:var(--muted)]`
- Métricas numéricas: sempre classe `.metric-number` — fonte mono, `font-variant-numeric: tabular-nums`
- Body: `text-sm leading-6` ou `text-base leading-6`

### Componentes base (classes já existentes — use sempre)

```
.app-panel          → painel principal (blur + borda + sombra)
.app-card           → card estático
.app-card-interactive → card com hover animado (translateY -1px)
.app-hero           → seção hero com radial gradients
.app-control        → inputs e selects
.app-pill           → badges e tags
.premium-grid       → grid de fundo sutil
.noise-overlay      → overlay de textura (sempre no topo do <main>)
.scrollbar-soft     → scrollbar estilizada
.eyebrow            → label uppercase pequeno acima de títulos
.metric-number      → números com fonte mono
```

---

## Tipos de dados — estrutura central

```typescript
SignalType:     AUDIO | FORMAT | HASHTAG | CREATOR | REVIVAL | US_TO_BR
TrendStage:     emerging | accelerating | proving | revival | monitor
SignalPriority: now | next | watch | hold
RiskLevel:      low | medium | high
ConfidenceBand: low | medium | high
Market:         BR | US
DataOrigin:     OFFICIAL | OWNED | MANUAL | DEMO
```

**Score system:**
- Score ≥ 78 → acid (verde limão) — "quente agora"
- Score 52–77 → gold — "próximo ciclo"
- Score < 52 → aqua — "monitorar"

---

## Filosofia de animação — a parte mais importante

Este produto **vive de dados em movimento**. Trends sobem, aceleram, mudam de status. A UI deve **respirar essa energia**.

### Princípios

1. **Dados que chegam devem aparecer, não aparecer simplesmente**
   - Cards de trend: `opacity 0→1` com `translateY 12px→0`, staggered por índice
   - Nunca aparece tudo ao mesmo tempo

2. **Scores e métricas são personagens**
   - Números não aparecem prontos — eles contam do valor anterior para o atual
   - Use `motion.div` com `animate` para números críticos

3. **A hierarquia é reforçada pelo tempo**
   - O que aparece primeiro é mais importante
   - Header → stats → filtros → cards — nessa ordem, com delay crescente

4. **Estado vazio nunca é silencioso**
   - Empty states têm animação sutil de "respiração" (scale 1→1.02→1, loop)
   - Mensagem muda conforme o contexto (sem resultados × sem dados ainda × carregando)

5. **Hover é informação**
   - Cards interativos revelam ações secundárias no hover
   - Use `opacity-0 group-hover:opacity-100` com transition suave

### Configuração padrão de motion

```typescript
// Easing premium — use sempre este
const ease = [0.22, 1, 0.36, 1] // cubic-bezier

// Durations
const fast   = 0.16  // 160ms — micro-interações
const medium = 0.26  // 260ms — transições de estado
const slow   = 0.44  // 440ms — entradas de página

// Variantes de entrada para listas (stagger)
const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.055, delayChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.32, ease } }
}

// Score bar — sempre animada
<motion.div
  initial={{ width: 0 }}
  animate={{ width: `${score}%` }}
  transition={{ duration: 0.8, ease, delay: 0.2 }}
/>
```

### Animações específicas por componente

**TrendCard:**
```
entrada:    opacity 0→1, y 12→0, duration 0.32s, ease premium
hover:      translateY -2px, border-color +opacity, duration 0.16s
score bar:  width 0→valor%, duration 0.8s com delay por índice
status pill: aparece 0.1s depois do card
```

**Hero section:**
```
headline:    opacity 0→1, y 20→0, duration 0.5s
metric tiles: stagger 0.08s entre cada um, y 8→0
badge pills: escala 0.88→1 com fade, delay 0.15s após headline
```

**Filtros e search:**
```
resultado count: crossfade quando muda (AnimatePresence)
cards ao filtrar: AnimatePresence com layout animation
```

**Score number (crítico):**
```tsx
// Sempre usar counter animation nos scores
// Conta de 0 até o valor em ~0.6s com ease-out
```

**Signal pulse (para trends "now"):**
```css
/* Ring pulsante no indicador de prioridade NOW */
@keyframes signal-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.4; transform: scale(1.6); }
}
```

---

## Regras de arquitetura — não quebrar

### Server vs Client
```
Server Component (padrão):
  - Todas as pages (page.tsx)
  - Componentes que só lêem dados
  - Nada de useState, useEffect

"use client" (apenas quando necessário):
  - Animações com motion/react
  - Interações de UI (hover, toggle, accordion)
  - Formulários com estado local
```

### Server Actions
- Toda mutation vai em `actions.ts` — nunca inline no componente
- Sempre revalidate após mutação: `revalidatePath("/trends")`
- Pattern: `redirect` com searchParam para feedback (`?status=ok` ou `?error=msg`)

### Banco de dados
- Sempre usar `context.tenantId` para isolar dados por workspace
- Soft delete em todos os registros — nunca `DELETE` físico
- Valores monetários em centavos (`amountCents Int`) — nunca float

### Segurança
- `requireTenantContext()` em toda page protegida — sempre primeira linha
- Nunca expor dados de um tenant para outro
- Rate limiting nas actions de auth

---

## UX — como o produto deve se comportar

### Feedback imediato
- Toda action dá feedback visual em < 200ms (otimista quando possível)
- Erros aparecem no mesmo contexto da ação, não em toast flutuante
- Loading states com skeleton, não spinner genérico

### Linguagem do produto
- Português BR nos labels voltados ao usuário
- Termos técnicos de TikTok permanecem em inglês (trend, signal, hashtag, creator)
- Tom: direto, confiante, sem floreio — como um analista sênior falaria

### Prioridade visual de uma TrendCard
Nesta ordem de destaque:
1. Score (número grande, colorido)
2. Título do trend
3. Priority badge (now/next/watch)
4. Stage + status
5. Risk level
6. Evidências e fonte

### Estados que precisam existir em toda lista
- `loading` → skeleton com shimmer animado
- `empty` → mensagem específica + ação sugerida
- `error` → mensagem + botão de retry
- `filtered-empty` → "Nenhum resultado para X" + botão limpar filtros

---

## O que NÃO fazer — lista rígida

**UI:**
- ❌ Fundo branco ou claro em qualquer tela principal
- ❌ Glassmorphism decorativo (blur sem propósito)
- ❌ Bordas grossas coloridas em cards (border-left: 4px — proibido)
- ❌ Box shadows genéricas em botões
- ❌ Gradientes de cor saturada (tipo roxo→azul clichê)
- ❌ Ícones sem label em ações críticas
- ❌ Modal para confirmações simples — use inline ou toast
- ❌ Texto todo em maiúsculas exceto `.eyebrow`
- ❌ Mais de 3 cores de ênfase na mesma tela

**Código:**
- ❌ `console.log` em produção
- ❌ `any` no TypeScript
- ❌ Hardcode de IDs, tokens ou valores de negócio
- ❌ Chamar banco direto em Client Component
- ❌ Ignorar o sistema de tenant — toda query filtra por tenantId

**Animações:**
- ❌ Bounce ou elastic easing — soa barato
- ❌ Animar `width`, `height`, `padding` diretamente — usar transform
- ❌ Animações em loop constante em elementos de conteúdo
- ❌ Transition > 600ms em interações de UI
- ❌ Tudo aparecendo ao mesmo tempo (sem stagger)

---

## Estrutura de pastas — o que vai onde

```
src/
├── app/
│   ├── (auth)/          → shell de autenticação
│   ├── login/           → página de login
│   ├── signup/          → página de cadastro
│   ├── trends/          → CORE — listagem e busca de trends
│   │   ├── [id]/        → detalhe de uma trend
│   │   └── actions.ts   → server actions de trends
│   ├── workspace/       → configurações do workspace
│   ├── globals.css      → sistema de design (não tocar na paleta)
│   └── layout.tsx       → root layout
├── components/
│   ├── auth/            → componentes de auth
│   ├── command-center.tsx  → componente principal do hub
│   ├── trend-card.tsx   → card de trend (componente mais crítico)
│   ├── ingestion-lab.tsx   → lab de ingestão de dados
│   ├── mini-trend-line.tsx → sparkline minimalista
│   ├── source-pill.tsx  → badge de fonte de dado
│   └── state-panels.tsx → painéis de estado (loading/empty/error)
└── lib/
    ├── auth/            → sistema de autenticação completo
    ├── trends/          → lógica de trends (ingestion, scoring, search)
    ├── ingestion/       → pipeline de ingestão de dados
    ├── persistence/     → camada de persistência
    ├── scoring.ts       → algoritmo de score
    ├── signal-analysis.ts → análise de sinais
    ├── types.ts         → TODOS os tipos — fonte da verdade
    └── db.ts            → cliente Prisma
```

---

## Referências de produto (para se inspirar, não copiar)

- **Raycast** — command center com identidade fortíssima, hierarquia perfeita
- **Resend** — dark UI com tipografia e espaçamento impecáveis
- **Turso** — identidade de marca em cada detalhe, não parece SaaS genérico
- **Linear** — velocidade e feedback instant — o padrão de produto premium
- **Liveblocks** — motion sofisticado e progressivo

**Anti-referências (o que este produto NÃO deve parecer):**
- Dashboard AdminLTE / qualquer template Bootstrap
- SaaS genérico com sidebar azul e cards brancos
- Qualquer coisa que pareça "feito por IA" no primeiro olhar

---

## Comando de desenvolvimento

```bash
npm run dev        # inicia em localhost:3000
npm run build      # build de produção (roda prisma generate antes)
npm run test       # testes unitários (vitest)
npm run db:migrate # aplica migrations pendentes
```

**Variáveis de ambiente necessárias:**
Ver `.env.example` — nunca commitar `.env.local`

---

*Este arquivo é o contrato do produto. Toda decisão de código e design deve ser consistente com o que está aqui.*
