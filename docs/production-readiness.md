# Production readiness

Estado operacional auditado em 2026-04-25.

## Escopo do MVP atual

O MVP atual e um radar pessoal de videos, audios, tendencias e oportunidades. O fluxo critico e:

- autenticar usuario;
- navegar tendencias;
- registrar ingestao;
- executar jobs via cron;
- consultar feed/status operacional;
- manter logs, requestId e health suficientes para operacao basica.

Email transacional real via Resend nao faz parte do requisito obrigatorio deste MVP. Ele permanece como recurso futuro/opcional para cenarios como verificacao de email, reset de senha, convites ou alertas enviados por email.

## Estado confirmado

- Projeto Vercel linkado: `instagram-market-command-center`.
- Production URL: `https://instagram-market-command-center.vercel.app`.
- Deployment de producao inspecionado como `Ready`.
- `vercel.json` declara 1 cron real para `/api/internal/cron/dispatch`.
- Execucao real do cron em producao confirmada com status 200 em 2026-04-25.
- `CRON_SECRET` existe na Vercel para Production.
- `CRON_SECRET` existe na Vercel para Development.
- `CRON_SECRET` nao existe em Preview.
- Postgres/Neon esta configurado por variaveis `DATABASE_URL`/`POSTGRES_*`.
- Vercel Marketplace lista Neon como integracao ativa.
- Vercel team atual esta em plano `hobby`.
- Vercel Drains nao sao viaveis no plano atual; exigem Pro/Enterprise.
- Resend nao esta conectado como integracao Marketplace.
- `RESEND_API_KEY` nao existe em Production, Preview ou Development.
- `AUTH_EMAIL_FROM` nao existe em Production, Preview ou Development.
- A ausencia de Resend e um estado aceito para o MVP atual.
- Sem Resend, o app nao deve fingir envio: o outbox suprime o item e registra `outbox_item_suppressed`.
- Dados sinteticos de validacao continuam zerados.

## Estado por ambiente

Production:

- Banco: configurado.
- Cron: configurado e executou 200.
- Email real: opcional/futuro; desativado com seguranca.
- Observabilidade externa: fallback documentado; Drains bloqueados pelo plano Hobby.

Development:

- Banco: configurado.
- `CRON_SECRET`: configurado.
- Email real: opcional/futuro; so configurar se houver validacao local real de envio.

Preview:

- Banco: configurado.
- `CRON_SECRET`: ausente.
- Email real: ausente por padrao.
- Decisao: Preview nao precisa de `CRON_SECRET` enquanto nao for usado para testar endpoints internos/cron. Se Preview passar a testar cron/outbox, criar um secret separado, nao reutilizar Production.
- Decisao: Preview nao precisa de `RESEND_API_KEY`/`AUTH_EMAIL_FROM` para o uso atual. Se Preview passar a testar email real, usar remetente/conta separados.

## Secrets finais

Obrigatorios atuais:

- `DATABASE_URL` ou `POSTGRES_URL`/`POSTGRES_PRISMA_URL`
- `CRON_SECRET` em Production

Futuros/opcionais para email real:

- `RESEND_API_KEY` em Production
- `AUTH_EMAIL_FROM` em Production

Recomendados:

- `DATABASE_URL_UNPOOLED` ou `POSTGRES_URL_NON_POOLING`
- `INTERNAL_API_TOKEN`, apenas se quiser separar chamadas internas manuais do segredo do cron
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_APP_ENV`

## Comportamento esperado sem Resend

- Build nao depende de `RESEND_API_KEY`.
- Cron nao depende de `RESEND_API_KEY`.
- Ingestao, trends, jobs e polling nao dependem de email real.
- O codigo nao simula sucesso de envio.
- Quando o outbox encontra email sem provider configurado, o item e marcado como suprimido e o log estruturado `outbox_item_suppressed` e emitido com `reason`.
- Para o MVP atual, `outbox_item_suppressed` por provider ausente e informativo, nao incidente critico.
- Se algum fluxo futuro passar a depender de email real, Resend deve ser configurado antes de habilitar esse fluxo.

## Riscos restantes

- Email real nao esta pronto, mas nao e requisito do MVP atual.
- Observabilidade externa com alertas persistentes nao esta ativa sem upgrade Pro/Enterprise ou mecanismo externo equivalente.
- No plano Hobby, logs sao bons para investigacao recente, mas nao entregam alerta externo persistente de eventos operacionais.
- Cron diario e confiavel para baseline, mas pode ser lento para fila operacional.
- Nao ha worker dedicado separado; cron processa jobs e outbox.
- O endpoint de cron nao tem `dryRun`; chamada autorizada manual processa fila real.
- Conectores oficiais Instagram continuam pendentes de credenciais/elegibilidade.
- Build local ainda alerta sobre multiplos `package-lock.json` e root inferido pelo Next.

## Criterio para producao madura basica do MVP atual

O projeto entra em producao madura basica para o MVP atual quando todos forem verdade:

- Cron real 200 confirmado em producao.
- Health publico 200 com database ok.
- Banco Production configurado.
- Dados sinteticos de validacao limpos.
- Email real tratado como opcional/futuro, sem fake send e com logs claros quando desativado.
- Fallback operacional de observabilidade documentado para plano Hobby.
- Caminho de upgrade para Drains/vendor documentado.
- Alertas minimos definidos para cron, jobs, outbox e health.
- Riscos/segredos por ambiente documentados.
- Build continua ok.

Estado atual:

- Cron/health/banco: pronto.
- Email real: opcional/futuro; desativado com seguranca.
- Observabilidade externa: fallback documentado no plano Hobby; drain requer upgrade Pro/Enterprise ou mecanismo externo equivalente.

Veredito atual: producao madura basica para o MVP atual de radar pessoal. Ainda nao e producao enterprise completa, porque email real e observabilidade externa persistente continuam opcionais/pendentes.
