# Autenticacao e tenancy

Esta fase adiciona auth propria com sessao persistida no Postgres e isolamento obrigatorio por workspace.

## Arquitetura

- `User`: identidade com e-mail unico, senha com hash `scrypt` e status.
- `Workspace`: tenant operacional.
- `WorkspaceMember`: vinculo usuario/workspace com role (`OWNER`, `ADMIN`, `MEMBER`).
- `AuthSession`: token aleatorio salvo em cookie HTTP-only; no banco fica apenas hash SHA-256 do token.
- `EmailVerificationToken`: token de verificacao de e-mail, com hash no banco, expiracao e uso unico.
- `PasswordResetToken`: token temporario de reset de senha, com hash no banco, expiracao e uso unico.
- `WorkspaceInvite`: convite por workspace, role alvo, status, expiracao e aceite auditado.
- `AuthEmailOutbox`: fila transacional para entregar links de auth por provider futuro.
- `AuthRateLimit` e `AuthEvent`: protecao contra abuso e trilha de auditoria de auth.
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

- `/signup` cria usuario pendente, workspace, membership `OWNER`, baseline de connectors e link de verificacao.
- `/verify-pending` permite reenviar verificacao com rate limiting.
- `/verify-email` consome token valido e ativa o usuario.
- `/login` cria sessao HTTP-only apenas para usuario ativo e verificado.
- `/forgot-password` sempre responde de forma neutra e so enfileira reset quando a conta existe e esta verificada.
- `/reset-password` troca a senha com token valido e invalida sessoes antigas.
- `/workspace` lista membros, convites pendentes e permite convites/roles conforme permissao.
- `/invite` aceita convite, cria ou vincula usuario e abre sessao no workspace correto.
- `/` exige sessao e carrega apenas dados do workspace ativo.
- `logoutAction` remove a sessao do banco e limpa o cookie.

## Autorizacao

- `OWNER`: leitura/escrita operacional, convite de admins/members, alteracao de roles e controles de ownership.
- `ADMIN`: leitura/escrita operacional e convite de members.
- `MEMBER`: leitura/escrita operacional dentro do tenant, sem convite ou gestao de roles.
- Server Actions sensiveis chamam `requirePermission`; a UI apenas reflete permissao, nao e a barreira principal.

## Fronteiras

- Sem provider externo de e-mail ainda para evitar bloqueio por credenciais; os e-mails ficam no outbox transacional.
- Sem JWT manual exposto ao cliente.
- Sem leitura/escrita operacional sem tenant.
- Fallback continua vazio e isolado; nao carrega insight ficticio.
