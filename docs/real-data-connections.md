# Conexao de Dados Reais Instagram/Meta

Este app esta pronto para trabalhar com dados reais sem simular token, insight ou trend. O caminho seguro e oficial tem tres frentes:

1. Conta profissional propria ou autorizada via Instagram API with Instagram Login.
2. Fontes oficiais/manualizadas com proveniencia, usando Reels, Professional Dashboard, Meta Business Suite e Meta Ad Library.
3. Provedor licenciado de dados, caso voce contrate uma API comercial com direito de uso e sem scraping clandestino.

## O que o app ja faz

- Mantem Postgres/Prisma como banco real.
- Provisiona fontes Instagram/Meta por workspace.
- Mostra estado operacional em `/sources`.
- Implementa inicio e callback OAuth em `/api/connectors/instagram/start` e `/api/connectors/instagram/callback`.
- Criptografa tokens no servidor com `OAUTH_TOKEN_ENCRYPTION_KEY`.
- Nao inventa conta conectada quando credenciais/permissoes nao existem.

## O que voce precisa ter na Meta

1. Uma conta Instagram Professional, Business ou Creator, com idade publica/posicionamento inequivocamente 18+ quando o nicho for adulto.
2. Uma conta no Meta for Developers.
3. Um app Meta com o produto Instagram/API setup with Instagram Login.
4. Redirect URI cadastrado exatamente assim:

```txt
https://SEU_DOMINIO/api/connectors/instagram/callback
```

5. Permissoes minimas para leitura analitica:

```txt
instagram_business_basic
instagram_business_manage_insights
```

Use apenas permissoes adicionais se a operacao exigir. Para este produto, nao comece pedindo publicacao, comentarios ou mensagens.

## Variaveis de ambiente

Configure em Production, Preview e Development conforme o ambiente que voce for usar:

```txt
INSTAGRAM_CLIENT_ID=APP_ID_DA_META
INSTAGRAM_CLIENT_SECRET=APP_SECRET_DA_META
INSTAGRAM_REDIRECT_URI=https://SEU_DOMINIO/api/connectors/instagram/callback
INSTAGRAM_SCOPES=instagram_business_basic,instagram_business_manage_insights
OAUTH_TOKEN_ENCRYPTION_KEY=uma_string_aleatoria_com_32_ou_mais_caracteres
```

No Vercel, use:

```bash
vercel env add INSTAGRAM_CLIENT_ID production
vercel env add INSTAGRAM_CLIENT_SECRET production
vercel env add INSTAGRAM_REDIRECT_URI production
vercel env add INSTAGRAM_SCOPES production
vercel env add OAUTH_TOKEN_ENCRYPTION_KEY production
```

Depois rode novo deploy e abra `/sources`. Quando todas as variaveis estiverem corretas, o card de Instagram deve sair de pendente para preparado e mostrar o botao de conexao.

## Coleta automatica por provedor licenciado

Para receber Reels publicos em escala sem depender de entrada manual, o app agora tem uma integracao com Bright Data no painel `/trends`. Ela usa a API de Instagram Reels do provedor para buscar metadados e metricas e depois grava no mesmo pipeline de proveniencia do radar.

O que a integracao faz:

- aceita perfis do Instagram e coleta Reels recentes por perfil;
- aceita links diretos de Reels quando voce quer controlar exatamente o que entra;
- salva URL, caption, criador, hashtags, metricas, lote, evidencia e horario de coleta;
- nao baixa midia, nao remove marca d'agua e nao reprocessa arquivos de terceiros;
- bloqueia termos de menores/idade ambigua no safe mode da ingestao.

Configure no Vercel:

```bash
vercel env add BRIGHT_DATA_API_KEY production
vercel env add BRIGHT_DATA_REELS_DATASET_ID production
```

`BRIGHT_DATA_REELS_DATASET_ID` e opcional. O default do app e o dataset de Instagram Reels usado pela API da Bright Data.

Depois do deploy:

1. Abra `/trends`.
2. No card `Coletar de fonte licenciada`, escolha `Perfis` ou `Links`.
3. Informe mercado `BR` ou `US`.
4. Cole URLs de perfis ou Reels.
5. Clique em `coletar Reels`.
6. Confirme os novos itens no grid e em `Atualizacoes do radar`.

### Automacao recorrente

O deploy tambem inclui uma rota cron opt-in em:

```txt
/api/internal/cron/reels/provider-import
```

Ela so executa coleta externa quando `REELS_AUTOMATION_ENABLED=true`. Sem essa variavel, a rota responde como ignorada e nao chama o provedor.

Variaveis:

```txt
BRIGHT_DATA_API_KEY=...
BRIGHT_DATA_REELS_DATASET_ID=gd_lyclm20il4r5helnj
REELS_AUTOMATION_ENABLED=true
REELS_AUTOMATION_WORKSPACE_SLUG=default-command-center
REELS_AUTOMATION_PROFILE_URLS=https://www.instagram.com/perfil1/,https://www.instagram.com/perfil2/
REELS_AUTOMATION_MARKET=BR
REELS_AUTOMATION_MAX_PER_PROFILE=10
REELS_AUTOMATION_SOURCE_TITLE=Bright Data Reels - automacao
```

No Vercel, adicione essas variaveis em Production e faca novo deploy. O cron de Vercel chama a rota em producao com o segredo interno; se voce rodar manualmente, envie `Authorization: Bearer <CRON_SECRET>` ou `Authorization: Bearer <INTERNAL_API_TOKEN>`.

## Como conectar

1. Rode migrations e seed:

```bash
npm run db:migrate
npm run db:seed
```

2. Suba/deploye o app com as env vars acima.
3. Entre com um usuario ativo do workspace.
4. Abra `/sources`.
5. Clique em `Conectar Instagram`.
6. Autorize a conta profissional no fluxo oficial da Instagram/Meta.
7. Ao voltar para `/sources`, confirme estado `Conectado`.

## Limites importantes

- Nao existe, no app, coleta clandestina de Reels publicos, download de midia de terceiros ou remocao de watermark.
- OAuth oficial entrega dados da conta profissional autorizada e seus insights permitidos, nao um feed irrestrito de todos os Reels virais do Instagram.
- Meta Ad Library pode ser usada como fonte oficial/manual e, quando a API estiver aprovada para seu caso, como fonte programatica dentro dos limites da Meta.
- Para nicho adulto, registre apenas padroes de marketing: gancho, linguagem, estetica, funil, formato, risco e evidencia. Nao registre pornografia, solicitacao sexual, menores ou idade ambigua.

## Checklist de evidencia

Todo insight real que entrar no app precisa manter:

- `source`
- `collected_at`
- `market`
- `confidence`
- `evidence_count`
- origem `OFFICIAL`, `OWNED` ou `MANUAL`

Se a fonte for manual, anote a URL oficial consultada, horario da coleta e quem validou.

## Links oficiais uteis

- Instagram Platform: https://developers.facebook.com/docs/instagram-platform/
- Instagram API with Instagram Login: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/
- Instagram Insights: https://developers.facebook.com/docs/instagram-platform/insights/
- Meta Ad Library: https://www.facebook.com/ads/library/
- Ad Library API reference: https://developers.facebook.com/docs/marketing-api/reference/ads_archive/
- Bright Data Instagram Reels by URL: https://docs.brightdata.com/api-reference/scrapers/social-media-apis/instagram/reels/collect-by-url
- Bright Data Collect All Reels: https://docs.brightdata.com/api-reference/scrapers/social-media-apis/instagram/reels/collect-all-reels
