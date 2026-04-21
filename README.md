# TikTok Market Command Center

Command center premium para inteligencia de mercado TikTok com foco em Brasil e radar antecipado dos EUA.

## Fase atual

- Fase 0: repo, stack, design system e schema base.
- Fase 1: Command Center v1 com navegacao, motion base e estados premium.

## Regras de dados

- Dados reais precisam de fonte, data, mercado, confianca e contagem de evidencias.
- Dados mock devem ser marcados como `DEMO/MOCK`.
- Nenhum scraping clandestino, download de terceiros ou remocao de watermark.

## Scripts

```bash
npm run dev
npm run build
npm run test
npm run prisma:generate
```

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Motion for React
- TanStack Query
- Prisma schema preparado para Postgres
