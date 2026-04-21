# Persistencia de producao

O deploy atual da Vercel pode exibir `fallback demo/mock` porque a Fase 3B usa SQLite local (`file:./dev.db`) com Prisma. Esse banco e adequado para validacao local no Windows/Codex, mas nao deve ser tratado como persistencia de producao em runtime serverless.

## Diagnostico

- O App Router chama `getCommandCenterData()` a cada request.
- `getPrisma()` usa `DATABASE_URL` ou `file:./dev.db` como default.
- Em producao, a Vercel nao tem o `dev.db` local seedado como banco persistente compartilhado.
- Quando o Prisma/adapter nao consegue abrir ou consultar esse arquivo, o app retorna o fallback seguro com fixtures `demo/mock`.

## Caminho recomendado

1. Provisionar Postgres pelo Vercel Marketplace, como Neon, Supabase ou Prisma Postgres.
2. Criar uma migration planejada de SQLite para Postgres, mantendo os modelos de provenance, ingestion e scoring.
3. Trocar a configuracao Prisma/adapter para Postgres em uma fase propria, usando as variaveis injetadas pela integracao escolhida.
4. Rodar `prisma migrate deploy` e seed controlado no banco de producao/staging.
5. Manter fallback demo/mock como degradacao segura quando o banco estiver indisponivel.

Nao conectar scraping ou fontes externas nessa transicao. A mudanca e apenas de persistencia publicada.
