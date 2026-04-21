# Fase 3B: ingestao manual/oficial rastreavel

Esta fase adiciona uma base operacional para registrar sinais e evidencias de forma auditavel, sem scraping e sem conectores externos automaticos.

## Fluxo suportado

- `SourceConnector`: superficie aprovada ou pendente, com origem `MANUAL`, `OFFICIAL` ou `DEMO`.
- `IngestRequest`: pedido de entrada criado pela UI ou seed.
- `ImportBatch`: lote idempotente que agrupa request, fonte, snapshot, job, sinal e evidencias.
- `IngestionStep`: status por etapa (`RECEIVE`, `VALIDATE`, `NORMALIZE`, `DEDUPE`, `PERSIST`, `SCORE`, `AUDIT`).
- `JobRun`: execucao local ligada ao batch e ao request.

## Limites de seguranca

- Nenhum job faz rede externa nesta fase.
- Falhas de conector oficial ficam registradas como falhas; nao viram insight.
- Dedupe usa chaves estaveis para evitar duplicar signal/evidence em submissao repetida.
- Dados `DEMO` continuam marcados como demo/mock; dados `MANUAL` dependem de entrada do operador.

## Banco

O runtime atual usa SQLite local via Prisma e adapter `@prisma/adapter-better-sqlite3`. A troca futura para Postgres deve ficar concentrada na configuracao Prisma/adapter e em nova migration de producao; os servicos de ingestao usam Prisma e nao SQL especifico de SQLite.
