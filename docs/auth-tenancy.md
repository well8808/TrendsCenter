# Autenticacao e tenancy

Esta fase adiciona auth propria com sessao persistida no Postgres e isolamento obrigatorio por workspace.

## Arquitetura

- `User`: identidade com e-mail unico, senha com hash `scrypt` e status.
- `Workspace`: tenant operacional.
- `WorkspaceMember`: vinculo usuario/workspace com role (`OWNER`, `ADMIN`, `ANALYST`, `VIEWER`).
- `AuthSession`: token aleatorio salvo em cookie HTTP-only; no banco fica apenas hash SHA-256 do token.
- `proxy.ts`: bloqueia acesso sem cookie de sessao antes de chegar ao app.
- Server Components e Server Actions validam a sessao real no banco via `requireTenantContext`.

## Isolamento de dados

As entidades operacionais agora possuem `workspaceId` obrigatorio:

- `Signal`, `Evidence`, `Source`, `DecisionQueueItem`
- `JobRun`, `Connector`, `AuditEvent`
- `SourceSnapshot`, `SignalObservation`, `SignalScore`
- `IngestRequest`, `ImportBatch`, `IngestionStep`
- `ComplianceFlag`, `MediaAsset`, `MediaDerivative`

As queries da dashboard e das actions usam `workspaceId` em leitura, escrita, upsert e toggle de fila.

## Fluxo

- `/signup` cria usuario, workspace, membership `OWNER` e baseline de connectors do tenant.
- `/login` cria sessao HTTP-only.
- `/` exige sessao e carrega apenas dados do workspace ativo.
- `logoutAction` remove a sessao do banco e limpa o cookie.

## Fronteiras

- Sem provider externo nesta fase para evitar bloqueio por credenciais.
- Sem JWT manual exposto ao cliente.
- Sem leitura/escrita operacional sem tenant.
- Fallback continua vazio e isolado; nao carrega insight ficticio.
