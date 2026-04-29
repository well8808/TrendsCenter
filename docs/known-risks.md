# Known risks

Riscos atuais que ainda importam para operacao e validacao.

## Worker/cron local

O submit de ingestao apenas enfileira o job. A evolucao para `RUNNING` e `SUCCEEDED` depende de `/api/internal/cron/dispatch` rodando com `CRON_SECRET` ou `INTERNAL_API_TOKEN`. Em ambiente sem cron, jobs ficam legitimamente em `QUEUED`.

## Fontes oficiais

As superficies oficiais estao modeladas, mas conectores reais de Instagram Graph API, Instagram Insights, Meta Business Suite e Meta Ad Library ainda dependem de credenciais/elegibilidade. Nao tratar dados manuais como coleta oficial.

## Banco compartilhado

Validacoes criam usuarios, workspaces, jobs e videos reais no Postgres configurado. Use e-mails sinteticos e titulos claramente de validacao para nao contaminar leitura operacional.

## Windows/Codex dev server

Neste ambiente, Turbopack pode falhar com panic/OOM ou `spawn EPERM`. Para validacao visual, `next dev --webpack --hostname 127.0.0.1 --port 3000` tem sido mais previsivel. Se o spawn for bloqueado pelo sandbox, repetir fora do sandbox com justificativa.

## Sem background automatico em dev

Polling do frontend observa a API, mas nao executa jobs. Para validar evolucao de status, rode o dispatcher interno ou uma rotina equivalente de worker.

## Escopo de compliance

O pipeline bloqueia termos obvios de menores/idade ambigua na ingestao de trends. Ele nao substitui revisao humana de payloads oficiais ou manuais antes de promover decisoes de mercado.
