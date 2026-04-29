# AGENTS.md

Este repo constroi um app premium de inteligencia de mercado Instagram Reels, com foco principal em Brasil e EUA como radar antecipado.

## Produto

- Nao criar landing page generica; a primeira tela deve ser um app operacional.
- O produto e um command center de decisao: Reels, sinais, fontes, confianca, riscos, watchlists e proximos passos.
- O foco principal e Brasil; EUA e usado como early-signal.
- O nicho adulto 18+ so pode ser tratado como analise segura de marketing, linguagem, estetica, funil, formato e padroes criativos.
- Nunca sexualizar idade ambigua; qualquer mencao adulta precisa assumir 18+ explicito e seguro.

## Dados

- Nao inventar insights de producao.
- Todo insight deve ter `source`, `collected_at`, `market`, `confidence` e `evidence_count`.
- Dados demo/mock devem ser marcados visualmente na UI e no schema.
- Usar fontes oficiais primeiro: Instagram Reels, Instagram Professional Dashboard/Insights, Instagram Graph API, Meta Business Suite, Meta Ad Library e fontes owned/licenciadas.
- Nao implementar scraping clandestino, bypass, download de midia de terceiros ou remocao de watermark.

## Compliance

- Proibido: menores, idade ambigua, sexualizacao de jovens, pornografia, solicitacao sexual, facilitacao de servicos sexuais e conteudo explicito.
- Nao remover marcas d'agua de terceiros.
- Upload/media pipeline so pode processar arquivos proprios ou licenciados.
- Remocao de metadados e permitida apenas para uploads proprios/licenciados e deve gerar relatorio.
- Audios comerciais precisam de direito/licenca comprovada.

## Arquitetura

- Preferir Next.js App Router, TypeScript, Tailwind, Motion, Postgres/Prisma e jobs separados para ingestao, normalizacao, scoring e auditoria.
- Manter scoring e proveniencia testaveis fora da UI.
- Separar demo data de conectores reais.
- Jobs locais nao devem fazer rede externa nem scraping; falhas de conector devem ficar visiveis como falhas.
- Componentes de app devem ser densos, escaneaveis, responsivos e acessiveis.

## UI

- A experiencia inicial deve parecer um produto premium, nao um wireframe.
- Priorizar design tokens, navegacao principal, estados vazios, loading, erro e demo.
- Usar motion para hierarquia e feedback, nao como decoracao gratuita.
- Nao usar textos que prometam dados reais quando a fonte e mock.

## Verificacao

- Antes de concluir mudancas de implementacao, rodar build/lint/test quando disponiveis.
- Para UI, validar visualmente em desktop e mobile sempre que houver servidor/browser disponivel.
- Se uma validacao nao rodar, reportar exatamente o que foi e o que nao foi verificado.

## Ambiente Windows/Codex

- Evitar `Start-Process` para subir dev server neste ambiente.
- Evitar `cmd /c start /B` com redirecionamento para dev server persistente.
- Se `next dev` falhar com `spawn EPERM`, o problema e permissao de spawn no sandbox, nao necessariamente bug do app; repetir fora do sandbox com justificativa clara.
- Para validacao local, preferir `npm run dev -- --hostname 127.0.0.1 --port 3000` em foreground ou um processo controlado com PID registrado, porta checada e logs ignorados pelo Git.
