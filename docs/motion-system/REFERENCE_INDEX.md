# Reference Index

Este indice registra o que deve guiar a fase futura de motion/3D do Instagram Reels Command Center.

## Motion libraries

### Motion

Links estudados:

- https://motion.dev/
- https://motion.dev/docs
- https://motion.dev/docs/react
- https://motion.dev/docs/scroll
- https://motion.dev/docs/animate-presence
- https://motion.dev/docs/layout-animations
- https://motion.dev/docs/gestures

Quando usar:

- Microinteracoes de cards, botoes, filtros, tabs, badges e modais.
- Entrada e saida de elementos com `AnimatePresence`.
- Layout animations para indicador ativo, reorder, expand/collapse e transicoes de lista.
- Gestos simples: hover, tap, focus e drag controlado.

Quando nao usar:

- Timelines longas com varias fases narrativas.
- Scroll storytelling complexo.
- Cenas 3D ou canvas.
- Animacoes que poderiam ser CSS simples, como cor de hover ou focus ring basico.

### GSAP

Links estudados:

- https://gsap.com/docs/v3/
- https://gsap.com/resources/React/
- https://gsap.com/docs/v3/Plugins/ScrollTrigger/
- https://github.com/greensock/gsap-skills

Quando usar:

- Timelines com sequencia clara: captura, validacao, score, decisao.
- Contadores e indicadores numericos que precisam de controle fino.
- ScrollTrigger em blocos editoriais ou storytelling.
- SVG/canvas/parallax quando Motion ficaria verboso.

Quando nao usar:

- Hover simples de botao.
- Variantes simples de card.
- Estado visual ligado diretamente a props React, onde Motion e mais natural.
- Animacao sem cleanup com `useGSAP`.

### Lenis

Links estudados:

- https://lenis.dev/
- https://github.com/darkroomengineering/lenis
- https://github.com/darkroomengineering/lenis/tree/main/packages/react

Quando usar:

- Experiencias editoriais longas.
- Uma view de relatorio ou apresentacao onde scroll fluido ajuda leitura.
- Integracao com GSAP ScrollTrigger, se houver storytelling real.

Quando nao usar:

- Rail lateral com `overflow-y-auto`.
- Tabelas, forms, modais, dropdowns ou listas densas.
- Fluxos onde o usuario precisa de resposta imediata do scroll.
- Mobile sem teste visual e de input.

## 3D/WebGL

### Three.js, React Three Fiber e Drei

Links estudados:

- https://threejs.org/docs/
- https://r3f.docs.pmnd.rs/
- https://r3f.docs.pmnd.rs/llms.txt
- https://r3f.docs.pmnd.rs/llms-full.txt
- https://drei.docs.pmnd.rs/
- https://github.com/pmndrs/drei
- https://docs.pmnd.rs/

Quando usar:

- Radar visual de mercado BR/US.
- Objeto 3D abstrato para explicar fluxo de sinais.
- Experiencias premium isoladas, com fallback e import dinamico.
- Elementos com significado: fonte, evidencia, crescimento, risco e decisao.

Quando nao usar:

- Tabelas, formularios e telas criticas.
- Cards repetidos.
- Mobile sem fallback.
- Qualquer lugar onde o 3D competiria com dados.

### Postprocessing, postprocessing e maath

Quando usar:

- Bloom leve em pontos de sinal.
- Vignette sutil em uma cena isolada.
- Interpolacoes suaves e math helpers em cenas R3F.

Quando nao usar:

- Como filtro visual global.
- Em dashboards densos com muitas listas.
- Em loop pesado sem pausa/reduced motion.

### Spline

Links estudados:

- https://spline.design/
- https://docs.spline.design/
- https://docs.spline.design/exporting-your-scene/web/exporting-as-code
- https://github.com/splinetool/react-spline

Quando usar:

- Cena pronta criada no Spline, com URL real.
- Prototipos visuais premium que seriam lentos de recriar em R3F.
- Objetos de marca/ambiente isolados.

Quando nao usar:

- Sem URL real.
- Como dependencia do carregamento principal.
- Em areas onde precisamos controlar cada mesh/material via codigo.

### Lottie e dotLottie

Links estudados:

- https://lottiefiles.com/
- https://github.com/LottieFiles/dotlottie-web
- https://github.com/Gamote/lottie-react

Quando usar:

- Empty states.
- Loading states.
- Confirmacao de sucesso/falha.
- Pequenos feedbacks de coleta, importacao e fila.

Quando nao usar:

- Como decoracao de fundo.
- Em todo card.
- Em loops infinitos sem necessidade.

## UI component libraries

### shadcn/ui blocks

Link estudado:

- https://ui.shadcn.com/blocks

Uso recomendado:

- Referencia de composicao de dashboard, sidebar, header, charts, data tables e layout.
- Nao copiar blocos inteiros sem adaptar a identidade do produto.

### Magic UI

Links estudados:

- https://magicui.design/
- https://magicui.design/docs
- https://magicui.design/docs/tailwind-v4

Uso recomendado:

- Referencia para componentes animados com React, TypeScript, Tailwind e Motion.
- Usar ideias pequenas, nao transformar o app em showcase de efeitos.

### React Bits

Link estudado:

- https://reactbits.dev/

Uso recomendado:

- Inspiracao para microinteracoes e componentes copy-paste.
- Bom para explorar padroes, mas cada efeito precisa provar utilidade no dashboard.

### Aceternity UI

Link estudado:

- https://ui.aceternity.com/

Uso recomendado:

- Referencia visual de efeitos premium.
- Usar com cuidado porque muitos exemplos sao mais landing page do que app operacional.

## Visual inspiration

### Vercel Geist

Links estudados:

- https://vercel.com/geist/introduction
- https://vercel.com/geist/colors
- https://vercel.com/geist/materials
- https://vercel.com/font

Aprendizado:

- Sistema visual consistente, alto contraste, grid forte, controles claros e componentes calmos.
- Bom norte para dashboard tecnico/profissional.

### Linear

Links estudados:

- https://linear.app/
- https://linear.app/now/behind-the-latest-design-refresh
- https://linear.app/now/how-we-redesigned-the-linear-ui

Aprendizado:

- Interface calma, previsivel e refinada.
- A UI melhora quando remove ruido, nao quando adiciona efeitos.
- Motion deve deixar o produto mais compreensivel.

### Raycast

Link estudado:

- https://raycast.com/

Aprendizado:

- Velocidade, ergonomia, teclado e sensacao de ferramenta profissional.
- Microinteracoes devem apoiar produtividade.

### Mercury

Link estudado:

- https://mercury.com/

Aprendizado:

- Premium limpo, confiavel e editorial sem parecer generico.
- Espacamento e hierarquia importam mais que brilho.

### Clerk

Link estudado:

- https://clerk.com/

Aprendizado:

- Developer product moderno com visual polido, componentes claros e estados bem resolvidos.
- Bom exemplo de interface tecnica que ainda parece humana.

## Regra central

Neste projeto, motion e 3D so entram quando melhoram uma destas quatro coisas:

- Entendimento.
- Priorizacao.
- Feedback.
- Confianca.

Se a animacao nao fizer uma dessas quatro coisas, ela nao deve entrar.
