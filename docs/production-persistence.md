# Persistencia de producao

O app agora usa Postgres gerenciado via Neon no Vercel Marketplace. `DATABASE_URL` e `DATABASE_URL_UNPOOLED` sao injetadas pelo Vercel e tambem foram puxadas para `.env.local` para validacao local.

## Runtime

- Prisma usa `provider = "postgresql"`.
- O runtime Next.js instancia `PrismaClient` com `@prisma/adapter-neon`.
- `DATABASE_URL` e usada pelo app/server actions.
- `DATABASE_URL_UNPOOLED` ou `POSTGRES_URL_NON_POOLING` e usada pelo Prisma CLI em `prisma.config.ts` para migrations.

## Fluxo de dados

- A dashboard le `Signal`, `Evidence`, `Source`, `DecisionQueueItem`, `JobRun`, `Connector` e `AuditEvent` do Postgres.
- O seed de producao registra apenas baseline operacional: connectors, fonte manual, job e auditoria.
- O seed nao cria tendencias ficticias.
- Se o banco falhar, o fallback e isolado e vazio; nenhum insight mock e misturado no fluxo principal.

## Comandos

```bash
npm run prisma:generate
npm run db:migrate
npm run db:seed
npm run build
```

## Fronteiras

- Sem scraping.
- Sem dados falsos mascarados como reais.
- Sem SQLite como persistencia de producao.
- Entradas `DEMO` continuam existindo no schema apenas para isolamento/legado, mas a UI operacional bloqueia origem demo em criacao manual.
