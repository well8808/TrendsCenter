# AGENTS.md

Este repo constrói um app premium de inteligência de mercado TikTok focado em Brasil, com EUA como early-signal.

## Produto

- Não criar landing page genérica; a primeira tela deve ser um app operacional.
- O produto é um command center de decisão: sinais, fontes, confiança, riscos, watchlists e próximos passos.
- O foco principal é Brasil; EUA é usado como radar antecipado.
- Conteúdo adulto/sensual só pode ser tratado como análise segura de padrões de marketing, linguagem, estética, funil e formato.

## Dados

- Não inventar insights de produção.
- Todo insight deve ter `source`, `collected_at`, `market`, `confidence` e `evidence_count`.
- Dados demo/mock devem ser marcados visualmente na UI e no schema.
- Usar fontes oficiais primeiro: TikTok Creative Center, Ads Manager, TikTok One, Market Scope, API for Business, Display API, Commercial Music Library.
- Research API só deve ser usada se houver elegibilidade e aprovação.
- Não implementar scraping clandestino, bypass, download de mídia de terceiros ou remoção de watermark.

## Compliance

- Proibido: menores, idade ambígua, sexualização de jovens, pornografia, solicitação sexual, facilitação de serviços sexuais e conteúdo explícito.
- Não remover marcas d'água de terceiros.
- Upload/media pipeline só pode processar arquivos próprios ou licenciados.
- Remoção de metadados é permitida apenas para uploads próprios/licenciados e deve gerar relatório.
- Áudios comerciais devem priorizar Commercial Music Library ou licença comprovada.

## Arquitetura

- Preferir Next.js App Router, TypeScript, Tailwind, Motion, Postgres/Prisma e jobs separados para ingestão, normalização, scoring e auditoria.
- A Fase 3A usa SQLite local via Prisma (`file:./dev.db`) para persistencia verificavel no Windows/Codex; antes de producao, planejar migracao para Postgres mantendo o contrato de proveniencia.
- A Fase 3B adiciona ingestao manual/oficial rastreavel; jobs locais nao devem fazer rede externa nem scraping, e falhas de conector devem ficar visiveis como falhas.
- Manter scoring e proveniência testáveis fora da UI.
- Separar demo data de conectores reais.
- Componentes de app devem ser densos, escaneáveis, responsivos e acessíveis.

## UI

- A experiência inicial deve parecer um produto premium, não um wireframe.
- Priorizar design tokens, navegação principal, estados vazios, loading, erro e demo.
- Usar motion para hierarquia e feedback, não como decoração gratuita.
- Não usar textos que prometam dados reais quando a fonte é mock.

## Verificação

- Antes de concluir mudanças de implementação, rodar build/lint/test quando disponíveis.
- Para UI, validar visualmente em desktop e mobile sempre que houver servidor/browser disponível.
- Se uma validação não rodar, reportar exatamente o que foi e o que não foi verificado.

## Ambiente Windows/Codex

- Evitar `Start-Process` para subir dev server neste ambiente: o PowerShell pode falhar com conflito de chaves `Path`/`PATH` no ambiente herdado.
- Evitar `cmd /c start /B` com redirecionamento para dev server persistente; ele pode deixar um `cmd.exe` preso sem iniciar o Next de forma verificavel.
- Se `next dev` falhar com `spawn EPERM`, o problema e permissao de spawn no sandbox, nao necessariamente bug do app; repetir fora do sandbox com justificativa clara.
- Para validação local, preferir `npm run dev -- --hostname 127.0.0.1 --port 3000` em foreground ou um processo .NET controlado com PID registrado, porta checada e logs ignorados pelo Git.
- Com SQLite/Prisma 7 no Windows, garanta que o arquivo `dev.db` exista antes de `prisma migrate deploy`; use `npm run db:migrate`, que roda `prisma/ensure-sqlite.mjs` antes do deploy.
