# Instagram Reels Command Center

Command center premium para inteligencia de mercado em Instagram Reels, focado em Brasil com radar antecipado dos EUA.

## Fase atual

- Fase 0: repo, stack, design system e schema base.
- Fase 1: Command Center v1 com navegacao, motion base e estados premium.
- Fase 3B: ingestao manual/oficial rastreavel com Postgres/Prisma.

## Regras de dados

- Dados reais precisam de fonte, data, mercado, confianca e contagem de evidencias.
- Dados mock devem ser marcados como `DEMO/MOCK`.
- Nicho adulto so entra como analise segura de marketing 18+, nunca como conteudo explicito.
- Nenhum scraping clandestino, download de terceiros ou remocao de watermark.

## Dados reais

O caminho operacional para conectar conta profissional Instagram/Meta esta em `docs/real-data-connections.md`.

## Scripts

```bash
npm run dev
npm run build
npm run test
npm run prisma:generate
npm run db:status
```

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Motion for React
- TanStack Query
- Prisma + Postgres/Neon
