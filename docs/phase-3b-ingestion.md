# Ingestao rastreavel

A ingestao atual e manual/oficial registrada e persistida no Postgres. Ela nao executa scraping nem coleta externa fragil.

## Entidades principais

- `Connector`: superficie aprovada ou pendente.
- `Source`: fonte registrada com mercado, origem, confianca e gap.
- `Signal`: sinal persistido para ranking e decisao.
- `Evidence`: prova vinculada a signal/source/snapshot/job.
- `DecisionQueueItem`: fila de decisao acionada pelo botao salvar.
- `JobRun`: execucao rastreavel do fluxo manual.
- `AuditEvent`: lineage legivel para criacao, evidencia, fonte, job e fila.

## Fluxos

- Criar sinal manual com evidencia inicial.
- Anexar evidencia a sinal existente.
- Salvar/remover sinal da fila de decisao.
- Listar lineage recente via batches, steps, jobs e audit events.

## Compliance

- Sem menores ou idade ambigua.
- Sem conteudo explicito como asset de demo.
- Sem remocao de watermark de terceiros.
- Upload/media pipeline permanece restrito a arquivos proprios ou licenciados.
