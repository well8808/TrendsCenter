# Codex Rules For Motion Work

Estas regras devem guiar futuras tarefas de motion/3D neste repo.

## Produto

- Nunca transformar o app em landing page.
- Nunca adicionar dados falsos.
- Nunca prometer insight real se a fonte nao for real.
- Nunca esconder erro de conector com visual bonito.
- Sempre preservar autenticacao, banco e logica existente.
- Sempre manter a primeira tela como app operacional.

## Motion

- Nunca usar animacao que prejudique leitura.
- Sempre preferir transform e opacity para performance.
- Sempre respeitar `prefers-reduced-motion`.
- Sempre usar motion para hierarquia e feedback, nao decoracao gratuita.
- Sempre limitar loops infinitos.
- Sempre documentar onde cada biblioteca foi usada.

## 3D

- Nunca usar 3D em telas criticas sem fallback.
- Sempre usar dynamic import para cenas pesadas.
- Sempre limitar DPR e custo de render.
- Sempre pausar ou simplificar quando fora do viewport, se a cena for pesada.
- Nunca colocar Three/Spline no bundle inicial sem necessidade.

## Componentes

- Sempre manter componentes reutilizaveis.
- Sempre criar client components apenas quando necessario.
- Sempre manter props genericas e sem dependencia de dados reais.
- Nunca importar utilitarios experimentais automaticamente em paginas de producao.

## UX

- Sempre priorizar hierarquia, legibilidade e calma visual.
- Sempre testar desktop e mobile quando houver mudanca visual.
- Nunca usar Lenis em forms, modais, tabelas ou rails internos sem justificativa.
- Nunca animar todos os cards/listas ao mesmo tempo se isso atrasar a leitura.

## Validacao

- Sempre rodar lint/build apos mudancas.
- Se build falhar, explicar erro, causa provavel, arquivo envolvido e correcao minima.
- Se nao testar no browser, declarar isso claramente.
