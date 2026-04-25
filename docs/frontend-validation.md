# Frontend validation

Checklist rapido para validar a experiencia autenticada sem mascarar falhas com mock.

## Ambiente

- Subir o app em `http://127.0.0.1:3000`.
- No Windows/Codex, se `next dev` falhar com `spawn EPERM`, repetir fora do sandbox com justificativa clara.
- Preferir `next dev --webpack --hostname 127.0.0.1 --port 3000` quando Turbopack apresentar panic/OOM.
- Se for validar processamento de jobs, iniciar o servidor com `CRON_SECRET` ou `INTERNAL_API_TOKEN` efemero.

## Fluxo esperado

1. Abrir `/signup`, criar conta sintetica e workspace.
2. Usar `/verify-pending` e o botao `verificar agora` para ativar a conta localmente.
3. Entrar via `/login`.
4. Abrir `/trends`.
5. Enviar uma ingestao com `sourceTitle`, `market`, `sourceOrigin`, `sourceKind` e `payloadJson`.
6. Confirmar feedback de sucesso com `request`, `job` e `requestId`.
7. Confirmar que o feed de jobs mostra o job sem refresh manual.
8. Rodar o dispatcher interno local e confirmar que o status evolui para `ok`.
9. Recarregar `/trends` e confirmar que o video importado aparece nos resultados.
10. Abrir `/trends/<id-inexistente>` e confirmar a UX 404.
11. Abrir `http://localhost:3000/trends` sem cookie e confirmar redirect para `/login`.

## Payload minimo

```json
{
  "videos": [
    {
      "platformVideoId": "validation-local-001",
      "title": "Formato de review rapido com prova operacional",
      "postedAt": "2026-04-25T01:00:00.000Z",
      "collectedAt": "2026-04-25T05:00:00.000Z",
      "metrics": { "views": 184200, "likes": 12600, "comments": 840, "shares": 510, "saves": 390 },
      "creator": { "handle": "safe_ops_br", "displayName": "Safe Ops BR" },
      "sound": { "title": "Original safe review cue", "isCommerciallyUsable": true },
      "hashtags": ["reviewrapido", "trendbr", "criativos"],
      "evidence": {
        "title": "Lote manual de validacao enterprise",
        "note": "Amostra propria para validar persistencia, scoring e polling sem rede externa."
      }
    }
  ]
}
```

## Sinais de regressao

- Overlay de hydration mismatch no devtools.
- Submit aceito sem `requestId`.
- Job aceito mas feed nao atualiza.
- Status preso em `QUEUED` depois do dispatcher.
- Reload perde o item importado.
- 401 retorna pagina quebrada em vez de login.
