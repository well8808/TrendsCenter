# Motion Budget

Regras praticas para manter o Command Center rapido, claro e premium.

## Motion

- Permitido em: filtros, cards clicaveis, contadores, entrada/saida de estados, sidebar, modais e feedback de job.
- Duracao padrao: 180ms a 420ms.
- Delay maximo: 240ms em elementos isolados; listas devem usar stagger ate 55ms.
- Preferir `transform` e `opacity`.
- Evitar animar textos longos, tabelas densas, formularios em digitacao e erros importantes.

## GSAP

- Permitido apenas para sequencias reais: fonte -> sinal -> score -> decisao, SVG/canvas especifico ou timeline coordenada.
- Nao usar GSAP para contador simples, hover, card reveal ou stagger basico.
- GSAP deve ficar em componente client isolado e, sempre que possivel, fora do bundle inicial.
- Toda timeline precisa de cleanup e `prefers-reduced-motion`.

## 3D

- Permitido somente como apoio visual leve ao radar/sinal/mercado.
- Sempre usar carregamento dinamico, `ssr: false` e fallback estatico.
- Desligar ou trocar por fallback quando `prefers-reduced-motion` estiver ativo.
- Limitar pixel ratio, particulas, brilho e loops continuos.
- Nao usar 3D em formularios, tabelas, auth, erro critico ou tela vazia.

## Lottie

- Permitido em loading, empty state e feedback curto.
- Carregar dinamicamente.
- Nao usar loop infinito em estados que exigem leitura.
- Em reduced motion: `autoplay=false` e `loop=false`.

## Lenis

- Nao usar globalmente no app operacional.
- Permitido apenas em areas editoriais ou paginas longas que realmente ganhem com smooth scroll.
- Desligar em reduced motion.

## Nunca Animar

- Valores que mudam em tempo real rapido demais.
- Mensagens de erro a ponto de esconder o problema.
- Elementos nao clicaveis com hover que parecem acao.
- Listas grandes com stagger longo.
- Qualquer coisa que atrase decisao do usuario.

## Sinal Verde

Uma animacao fica se responder "sim" para pelo menos uma pergunta:

- Ajuda a entender o estado?
- Ajuda a priorizar um sinal?
- Ajuda a perceber feedback de uma acao?
- Ajuda a transicao ficar menos brusca?

Se a resposta for so "fica bonito", remover ou adiar.

## 3B QA findings

- Testado: `npm run lint`, `npm run build`, `npm run db:status`, `/login`, `/trends`, desktop 1440x900, mobile 390x844 e `prefers-reduced-motion`.
- Desktop: `/login` renderizou corretamente, sem canvas, sem errors e sem warnings. `/trends` redirecionou para `/login` por falta de sessao autenticada.
- Mobile: `/login` ficou legivel e sem quebra visual no viewport 390x844. `/trends` tambem redirecionou para `/login`.
- Reduced motion: validado em `/login` e no redirect de `/trends`; nenhum canvas foi montado e nada ficou preso aguardando animacao.
- Bundle/coverage leve: a tela inicial baixou 12 chunks JS; a busca nos chunks requisitados nao encontrou `three`, `gsap`, `@gsap/react`, `WebGLRenderer`, `lottie` ou `postprocessing`. O unico hit foi `keySplines` dentro de codigo base de SVG/React, nao a biblioteca Spline.
- Problemas encontrados: nenhum warning/error de console no escopo acessivel sem sessao.
- Correcoes feitas: nenhuma correcao visual adicional foi necessaria na 3B.
- Pendencias reais: dashboard autenticado, filtros, metricas, cards, job feed e radar 3D real ainda precisam de QA com uma sessao real disponivel; nao foi criada conta temporaria nem dado falso.
