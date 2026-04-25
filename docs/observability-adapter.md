# Observability adapter

Estado auditado em 2026-04-25.

## Baseline atual

O app ja emite logs estruturados em JSON para stdout/stderr via `src/lib/http/logger.ts`.

Campos estaveis:

- `level`
- `message`
- `timestamp`
- `requestId`
- `route`
- `method`
- `scope`
- `workspaceId`
- `userId`
- `jobId`
- `outboxId`
- `durationMs`
- `status`
- `error`

Eventos ja emitidos:

- `route_completed`
- `route_failed`
- `request_error_captured`
- `job_succeeded`
- `job_retry_scheduled`
- `job_dead_lettered`
- `job_execution_failed`
- `outbox_item_sent`
- `outbox_item_suppressed`
- `outbox_item_dead_lettered`
- `outbox_item_retry_scheduled`

`/api/health` expoe snapshot simples de metricas em memoria para smoke operacional.

## Adapter recomendado

Plano detectado na Vercel:

```text
team: chinasutener-3725s-projects
billing.plan: hobby
```

Drains estao disponiveis apenas em Pro/Enterprise. Portanto, neste ambiente atual, Vercel Drains nao sao viaveis sem upgrade.

Quando houver upgrade para Pro, nao instale SDK de vendor agora. O caminho mais simples e profissional e:

```text
Vercel Runtime Logs -> Vercel Drain JSON/NDJSON -> vendor de logs/alertas
```

Vendor recomendado para comecar do zero: Axiom ou Datadog.

- Axiom: simples para logs JSON, queries e alertas.
- Datadog: melhor se ja houver stack de observabilidade/APM.

O adapter e o drain da Vercel, nao codigo novo no app.

## Fallback realista no plano atual

Sem Drains, nao ha alerta persistente confiavel para eventos de log como `job_dead_lettered` e `outbox_item_retry_scheduled` sem adicionar backend novo. O melhor fallback leve e honesto:

1. Criar monitor HTTP externo para `/api/health` a cada 5 minutos.
2. Criar rotina operacional diaria para consultar logs apos a janela do cron.
3. Usar Vercel Runtime Logs/Dashboard para incidentes recentes.
4. Manter os eventos JSON atuais como contrato de observabilidade pronto para drain.

Comandos de rotina:

```powershell
vercel logs --environment production --query "/api/internal/cron/dispatch" --since 48h --no-color --no-follow --no-branch --expand
vercel logs --environment production --level error --since 1h --no-color --no-follow --no-branch --expand
curl.exe -sS https://tiktok-market-command-center.vercel.app/api/health
```

Limite honesto: esse fallback melhora visibilidade, mas nao substitui alertas externos de logs.

## Como plugar apos upgrade Pro

1. Criar conta/projeto no vendor escolhido.
2. Criar endpoint/token de ingestao para logs.
3. Abrir Vercel Dashboard do time.
4. Ir em Settings -> Log Drains/Drains.
5. Criar drain para Production.
6. Selecionar Logs em JSON ou NDJSON.
7. Apontar para o endpoint do vendor.
8. Se usar endpoint proprio, validar `x-vercel-signature`.
9. Gerar uma chamada a `/api/health`.
10. Confirmar que logs com `message: route_completed` aparecem no vendor.

## Alertas minimos

Cron:

- Alerta se nao houver `message=route_completed`, `route=/api/internal/cron/dispatch`, `status=200` em 26h.
- Alerta imediato para `message=route_failed`, `route=/api/internal/cron/dispatch`.

Jobs:

- Alerta para `message=job_dead_lettered`.
- Alerta para `message=job_execution_failed`.
- Aviso/agregado para `message=job_retry_scheduled` acima do baseline.

Outbox/email:

- Alerta para `message=outbox_item_dead_lettered`.
- Aviso para `message=outbox_item_retry_scheduled`.
- Para o MVP atual, `message=outbox_item_suppressed` com provider ausente e informativo/esperado enquanto email real estiver desativado.
- Aviso para `message=outbox_item_suppressed` somente se o motivo nao for provider ausente, se o volume crescer fora do esperado ou se email real tiver sido habilitado.
- Contador de `message=outbox_item_sent` somente apos Resend estar configurado.

Health:

- Check externo `GET https://tiktok-market-command-center.vercel.app/api/health` a cada 5 minutos.
- Alertar se status HTTP != 200.
- Alertar se `data.status != "ok"`.
- Alertar se `data.database != "ok"`.
- Alertar se latencia ficar acima do baseline.

API geral:

- Alerta para `level=error`.
- Alerta para `status >= 500`.
- Dashboard por `route`, `status`, `durationMs`, `requestId`.

## Consultas de referencia

Adapte ao vendor:

```text
message:"route_failed" AND route:"/api/internal/cron/dispatch"
message:"route_completed" AND route:"/api/internal/cron/dispatch" AND status:200
message:"job_dead_lettered" OR message:"job_execution_failed"
message:"outbox_item_dead_lettered" OR message:"outbox_item_retry_scheduled"
level:"error"
status:>=500
```

## Endpoint proprio de drain

Se for criar endpoint proprio, ele deve:

- Aceitar `POST`.
- Responder `200 OK`.
- Validar `x-vercel-signature` usando o segredo do Drain.
- Usar corpo bruto para verificar assinatura.
- Rejeitar assinatura invalida com `403`.

Nao coloque esse endpoint dentro deste app ate existir um destino claro. Para producao basica, o caminho preferido e Vercel Drain direto para o vendor.

## Client-side

O app ja tem `src/lib/observability/client-telemetry.ts`, com `registerClientErrorReporter`.

Quando escolher vendor:

- Sentry: registrar reporter que chama `captureException`/`captureMessage`.
- Datadog RUM: registrar reporter que chama `datadogRum.addError`.
- Outro destino: transformar `ClientErrorReport` para o contrato do provider.

Nao instalar SDK client-side antes de escolher provider e politica de privacidade.

## Verificacao operacional

Comandos uteis:

```powershell
vercel logs --environment production --level error --since 1h --no-color --no-follow --no-branch --expand
vercel logs --environment production --query "/api/internal/cron/dispatch" --since 48h --no-color --no-follow --no-branch --expand
curl.exe -sS https://tiktok-market-command-center.vercel.app/api/health
```

## Criterio para declarar observabilidade minima pronta

- Time Vercel em Pro/Enterprise ou outro mecanismo externo equivalente.
- Drain ativo para Production.
- Logs chegam no vendor.
- Alerta de cron sem sucesso em 26h.
- Alerta de `route_failed` no cron.
- Alerta de `job_dead_lettered`/`job_execution_failed`.
- Alerta de outbox dead-letter/retry.
- Tratamento de `outbox_item_suppressed` alinhado ao estado do email: informativo quando Resend estiver desligado no MVP atual; alerta quando email real for habilitado.
- Health check externo ativo.

## Referencias

- Vercel Drains: https://vercel.com/docs/drains/using-drains
- Vercel Drains Security: https://vercel.com/docs/drains/security
- Vercel Log Drains Reference: https://vercel.com/docs/concepts/observability/log-drains-overview/log-drains-reference
- Vercel Plans: https://vercel.com/docs/plans
