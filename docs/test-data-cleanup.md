# Test data cleanup

Limpeza executada em 2026-04-25.

## Criterio usado

Foram considerados seguros para limpeza apenas registros com marcadores sinteticos explicitos:

- Usuarios com email iniciado por `enterprise-pass-`
- Usuarios com email iniciado por `e2e-`
- Usuarios com email iniciado por `debug-`
- Workspaces associados com slugs `enterprise-pass-*`, `e2e-workspace-*` ou `debug-*`

Nao foram removidos dados sem esses marcadores.

## Removido

- 8 usuarios sinteticos
- 8 workspaces sinteticos
- Sessoes desses usuarios
- Outbox desses workspaces
- Ingestion requests desses workspaces
- Job runs desses workspaces
- Import batches desses workspaces
- Sources desses workspaces
- Videos, snapshots e evidencias desses workspaces

Workspaces removidos:

- `enterprise-pass-1777096041224-5iclvpge`
- `e2e-workspace-1777093755028-9ison6sz`
- `e2e-workspace-1777093536282-ffjdmadu`
- `debug-1777093401289-ciuyoio5`
- `e2e-workspace-1777093122459-vnsohjux`
- `e2e-workspace-1777093013807-p1hmgmow`
- `e2e-workspace-1777092866659-lwcm0tl3`
- `e2e-workspace-1777092754366-tcz6nsy0`

## Verificacao pos-limpeza

Contagens confirmadas como zero:

- usuarios `enterprise-pass-*`, `e2e-*`, `debug-*`
- workspaces `enterprise-pass-*`, `e2e-workspace-*`, `debug-*`
- requests `Enterprise validation`
- videos `enterprise-*`/`Formato de tutorial curto`/`Formato de review rapido`
- jobs criados por usuarios sinteticos

Revalidacao em 2026-04-25 04:22 BRT manteve todas essas contagens em zero.

## Como repetir com seguranca

1. Fazer dry-run listando usuarios por prefixo.
2. Extrair os `workspaceId` via memberships.
3. Conferir contagens por workspace.
4. Deletar workspaces por ID em transacao.
5. Deletar usuarios por ID em transacao.
6. Recontar marcadores sinteticos e abortar se aparecer qualquer registro fora do criterio.
