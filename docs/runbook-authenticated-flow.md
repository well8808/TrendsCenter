# Runbook authenticated flow

Runbook curto para reproduzir o fluxo real de operador.

## Preparar servidor

```powershell
$env:CRON_SECRET="local-validation-secret"
$env:NEXT_PUBLIC_APP_URL="http://127.0.0.1:3000"
npm run dev -- --webpack --hostname 127.0.0.1 --port 3000
```

Se `npm run dev` ficar bloqueado pelo sandbox, rode o mesmo comando fora do sandbox com aprovacao explicita.

## Criar sessao real

1. Abrir `http://127.0.0.1:3000/signup`.
2. Criar conta de validacao com e-mail sintetico.
3. Em `/verify-pending`, clicar `verificar agora`.
4. Entrar em `/login` com a mesma conta.
5. Confirmar que `/` mostra o workspace criado e que `/trends` abre sem redirect.

## Ingestao e job

1. Em `/trends`, preencher `Fonte / lote` e `payloadJson`.
2. Clicar `indexar`.
3. Confirmar card de sucesso:
   - `request`
   - `job`
   - `requestId`
4. Confirmar que a fila operacional atualiza automaticamente.
5. Processar jobs:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "http://127.0.0.1:3000/api/internal/cron/dispatch" `
  -Headers @{ Authorization = "Bearer local-validation-secret" } `
  -ContentType "application/json" `
  -Body '{"limit":50,"outboxLimit":5}'
```

Resultado esperado: envelope `{ ok: true, data: { jobs: ... }, meta: { requestId, timestamp } }`.

## Encerramento

- Recarregar `/trends`.
- Confirmar que o item importado aparece na lista.
- Abrir `/trends/not-a-real-trend` e confirmar painel 404.
- Abrir `http://localhost:3000/trends` em host sem cookie para confirmar redirect para login.
- Rodar `npm run lint`, `npx tsc --noEmit`, `npm run build` e `npm run test` quando aplicavel.
