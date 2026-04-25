# Resend production readiness

Estado auditado em 2026-04-25.

## Escopo atual

Email real via Resend nao e requisito do MVP atual. O produto agora deve ser tratado como um radar pessoal de videos, audios, tendencias e oportunidades; o caminho critico nao depende de envio transacional.

Resend permanece como recurso futuro/opcional. Nao habilite, nao simule e nao declare envio real sem credenciais, dominio verificado e evidencia operacional.

## Estado atual

- O codigo de envio existe em `src/lib/services/email-delivery-service.ts`.
- O outbox chama `https://api.resend.com/emails` via `fetch` quando as envs existem.
- Sem provider configurado, `deliverEmail` falha com `reason: "missing_env"`.
- Sem provider configurado, o outbox marca o item como suprimido e emite `outbox_item_suppressed`.
- Esse comportamento e intencional para o MVP atual: falha visivel, sem fake send e sem quebrar cron/build.
- Vercel Marketplace lista apenas Neon neste projeto.
- `RESEND_API_KEY` nao existe em Production, Preview ou Development.
- `AUTH_EMAIL_FROM` nao existe em Production, Preview ou Development.
- Nao ha evidencia local de dominio/subdominio verificado no Resend.
- Envio real nao foi executado, porque faltam credenciais e dominio/remetente verificado.

## Env names finais

Se email real entrar no escopo, o codigo espera exatamente:

- `RESEND_API_KEY`
- `AUTH_EMAIL_FROM`

Production deve ter as duas antes de qualquer validacao de envio real.

Development deve ter as duas apenas se for validar envio local com `vercel env pull`.

Preview nao deve receber envio real por padrao. So configure `RESEND_API_KEY` e `AUTH_EMAIL_FROM` em Preview se houver decisao explicita de testar email real em previews e usando remetente/conta separados.

## Comportamento seguro sem Resend

- `npm run build` nao depende de `RESEND_API_KEY`.
- O cron `/api/internal/cron/dispatch` nao depende de `RESEND_API_KEY`.
- Ingestao, trends, jobs e polling continuam funcionando sem email real.
- O sistema nao finge envio: ausencia de provider gera falha operacional suprimida.
- O log esperado quando houver item de email sem provider e `outbox_item_suppressed`.
- Para o MVP atual, `outbox_item_suppressed` por provider ausente deve ser tratado como informativo/esperado.
- Se um fluxo futuro passar a exigir email real, configure Resend antes de habilitar esse fluxo.

## Setup futuro recomendado

Para este app, o uso futuro mais provavel e transacional/auth: verificacao de email, reset de senha, convites ou alertas por email. O dominio recomendado e um subdominio dedicado:

```text
auth.seudominio.com
```

Remetente recomendado:

```text
TikTok Market Command Center <no-reply@auth.seudominio.com>
```

Evite usar o dominio raiz e evite misturar email transacional com marketing. Se no futuro houver alertas operacionais independentes, use outro subdominio, por exemplo `alerts.seudominio.com`.

## DNS esperado para ativacao futura

Copie os valores exatos gerados pelo Resend. Nao invente valores DNS.

Minimo para verificar dominio:

- SPF: registro que autoriza envio pelo provider.
- DKIM: registro de chave publica para assinatura/autenticidade.
- Return-path/bounces: MX/registro indicado pelo Resend quando a tela do dominio pedir.

DMARC recomendado depois de SPF/DKIM verdes:

```text
Name: _dmarc.auth.seudominio.com
Type: TXT
Value: v=DMARC1; p=none; rua=mailto:dmarc@seudominio.com;
```

Comece com `p=none`, observe relatorios, depois evolua para `quarantine`/`reject` quando tiver confianca. O endereco `rua` precisa existir ou apontar para uma caixa/servico capaz de receber relatorios.

Return-path:

- O Resend usa return-path para bounces/complaints.
- Use o default gerado pelo Resend, geralmente sob `send`.
- Se customizar, prefira algo como `bounces.auth.seudominio.com`.
- Nao avance enquanto SPF/DKIM/return-path nao estiverem verdes no painel do Resend.

## Checklist futuro de configuracao opcional

1. Criar ou conectar conta Resend.
2. Adicionar dominio/subdominio `auth.seudominio.com` em https://resend.com/domains.
3. Criar no DNS todos os registros gerados pelo Resend.
4. Aguardar status verificado no Resend.
5. Adicionar DMARC em modo `p=none`.
6. Criar API key de envio no Resend.
7. Configurar envs em Production com os nomes exatos esperados pelo codigo:

```powershell
vercel env add RESEND_API_KEY production
vercel env add AUTH_EMAIL_FROM production
```

8. Opcional para validacao local:

```powershell
vercel env add RESEND_API_KEY development
vercel env add AUTH_EMAIL_FROM development
vercel env pull .env.local --yes
```

9. Validar com uma conta sintetica real.
10. Conferir logs/outbox:
    - `outbox_item_sent`
    - `outbox_item_retry_scheduled`
    - `outbox_item_dead_lettered`
    - `outbox_item_suppressed`

11. Confirmar que a mensagem chegou ao destinatario.
12. Confirmar no Resend Dashboard que o evento foi aceito/entregue ou, no minimo, aceito pelo provider.

## Criterio futuro para declarar email pronto

So marque email como pronto quando todos forem verdade:

- `RESEND_API_KEY` existe em Production.
- `AUTH_EMAIL_FROM` existe em Production.
- O dominio do `AUTH_EMAIL_FROM` esta verificado no Resend.
- SPF e DKIM estao verificados.
- Return-path/bounces esta configurado quando exigido pelo Resend.
- DMARC existe, pelo menos em `p=none`.
- Um envio transacional sintetico chegou ao destinatario.
- O outbox registrou `outbox_item_sent` com `provider: resend`.

Antes disso, email real deve permanecer documentado como futuro/opcional e desativado com seguranca.

## Referencias

- Resend Domains: https://resend.com/docs/dashboard/domains/introduction
- Resend DMARC: https://resend.com/docs/dashboard/domains/dmarc
- Resend + Vercel Marketplace: https://vercel.com/marketplace/resend
