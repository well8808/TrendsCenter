# Cron setup

## Configuracao ativa

Arquivo fonte:

```json
{
  "crons": [
    {
      "path": "/api/internal/cron/dispatch",
      "schedule": "0 6 * * *"
    }
  ]
}
```

Cron ativo confirmado via Vercel CLI:

- Path: `/api/internal/cron/dispatch`
- Schedule: `0 6 * * *`
- Timezone: UTC
- Ambiente: Production

## Evidencia de execucao real

Execucao automatica confirmada em producao:

- Data local: 2026-04-25 03:54:06 BRT
- Data UTC aproximada: 2026-04-25 06:54:06 UTC
- Host: `tiktok-market-command-center-qo00s24cf.vercel.app`
- Metodo/rota: `GET /api/internal/cron/dispatch`
- Status: `200`
- Log estruturado: `route_completed`
- `requestId`: `dac84167-26cb-49fd-80fb-2a280a67ba40`
- `durationMs`: `2260`

O schedule e `0 6 * * *` em UTC. A execucao as 06:54 UTC fica dentro da tolerancia documentada pela Vercel para planos com precisao horaria.

## Rota

Implementacao:

- `src/app/api/internal/cron/dispatch/route.ts`

Metodos aceitos:

- `GET`
- `POST`

Comportamento:

- Valida `Authorization: Bearer <secret>`.
- Usa `INTERNAL_API_TOKEN` se existir.
- Caso contrario usa `CRON_SECRET`.
- Processa jobs pendentes via `dispatchDueJobs`.
- Processa outbox de auth via `processAuthOutbox`.
- Retorna envelope padrao `{ ok, data, meta }`.

## Seguranca

`CRON_SECRET` esta configurado na Vercel para:

- Production
- Development

`CRON_SECRET` nao foi encontrado em:

- Preview

Sem Authorization, producao respondeu corretamente:

- Status: `401 Unauthorized`
- Code: `UNAUTHORIZED`
- Header: `x-request-id`
- Log Vercel: `route_failed` com `requestId`

Busca de logs em producao:

- Encontrou a chamada manual 401 para `/api/internal/cron/dispatch`.
- Encontrou execucao 200 real para `/api/internal/cron/dispatch` em 2026-04-25.

## Operacao esperada na Vercel

A Vercel invoca cron por `GET` na URL de producao. Quando `CRON_SECRET` existe, a plataforma envia o valor automaticamente no header `Authorization` com prefixo `Bearer`.

O schedule atual e diario as 06:00 UTC. Isso e compativel com todos os planos, mas pode deixar ingestao em fila por muitas horas.

Para fila mais responsiva:

- Manter diario se o projeto estiver em Hobby.
- Usar `*/5 * * * *` ou `0 * * * *` apenas se o plano aceitar frequencia maior.
- Fazer novo deploy apos mudar `vercel.json`.

## Validacao segura

Comandos uteis:

```powershell
vercel crons ls --no-color
vercel env ls production --debug --no-color
vercel logs --environment production --query "/api/internal/cron/dispatch" --since 48h --no-color --no-follow --no-branch --limit 50 --expand
vercel logs --environment production --status-code 200 --since 48h --no-color --no-follow --no-branch --limit 50
curl.exe -i https://tiktok-market-command-center.vercel.app/api/internal/cron/dispatch
```

Nao rode chamada autorizada de producao apenas para smoke enquanto a rota nao tiver `dryRun`: qualquer chamada valida processa jobs e outbox reais.

Para validar execucao automatica sem disparar processamento manual, aguarde a proxima janela de schedule e consulte logs por path/status.

Referencias:

- Vercel Cron Jobs: https://vercel.com/docs/cron-jobs
- Managing Cron Jobs: https://vercel.com/docs/cron-jobs/manage-cron-jobs
- Usage and Pricing: https://vercel.com/docs/cron-jobs/usage-and-pricing
