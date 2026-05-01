# Implementation Roadmap

## Fase 1 - Fundacao leve

Objetivo: padronizar motion sem mudar a identidade atual.

Escopo:

- Motion tokens.
- Utility components isolados.
- Animated counters.
- Reveal components.
- Sidebar active indicator.
- Loading/empty states.

Validacao:

- Lint.
- Build.
- Browser desktop/mobile.
- Reduced motion.

Resultado esperado:

- UI mais fluida, sem redesenho completo.
- Padroes reutilizaveis prontos para uso gradual.

## Fase 2 - Motion funcional no produto

Objetivo: melhorar percepcao de resposta e hierarquia.

Escopo:

- GSAP para sequencias especificas.
- Lenis apenas em areas apropriadas.
- Microinteracoes premium nos cards.
- Transicoes entre views.
- Feedback de filtros e coleta.

Validacao:

- Nenhuma rota quebrada.
- Nenhuma animacao impedindo leitura.
- Sem scroll estranho em forms ou rails.

Resultado esperado:

- O app fica mais agradavel e profissional, sem parecer demo de efeitos.

## Fase 3 - 3D e estados ilustrados

Objetivo: usar 3D/Lottie onde eles explicam o produto.

Escopo:

- 3D decorativo leve.
- Spline ou R3F isolado.
- Radar visual interativo.
- Experimentos com Lottie/dotLottie.

Validacao:

- Dynamic import.
- Fallback estatico.
- Bundle audit.
- Teste mobile.
- Reduced motion.

Resultado esperado:

- O radar visual passa a ter sentido: fonte, sinal, evidencia, score e decisao.

## Fase 4 - Auditoria e poda

Objetivo: remover excesso antes de considerar pronto.

Escopo:

- Performance audit.
- Bundle audit.
- Accessibility audit.
- Remocao de exageros visuais.
- Revisao de contraste, densidade e foco.

Validacao:

- Lint.
- Build.
- Browser desktop/mobile.
- Console limpo.
- Rota principal e `/trends` operacionais.

Resultado esperado:

- Produto premium, rapido, legivel e sem firula.

## Ordem recomendada

1. Escolher uma unica area do app.
2. Definir o papel da animacao.
3. Implementar pequeno.
4. Testar no navegador.
5. Medir se ficou mais claro ou apenas mais bonito.
6. Podar o que nao ajudou.
