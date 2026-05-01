# Library Decision Matrix

## Matriz rapida

| Necessidade | Biblioteca recomendada | Onde aplicar | Nao usar quando |
| --- | --- | --- | --- |
| Hover, tap, focus, pequenas entradas | CSS/Tailwind ou Motion | botoes, pills, cards, inputs | efeito e apenas cor ou borda simples |
| Entrada/saida de card, alerta, modal | Motion + AnimatePresence | alerts, drawers, detalhes, empty states | existe sequencia longa com varias etapas |
| Indicador ativo, tabs, reorder | Motion layout animations | sidebar, filtros, tabs, listas | layout muda em area muito grande e pesada |
| Timelines complexas | GSAP + useGSAP | hero/radar, score narrative, counters | estado simples ligado a props React |
| Scroll storytelling | GSAP ScrollTrigger | pagina de relatorio, secoes editoriais | dashboard com scroll interno denso |
| Smooth scroll | Lenis | pagina longa e controlada | forms, tabelas, rails sticky, modal |
| 3D real interativo | Three/R3F/Drei | radar visual, ambient object, fluxo de sinais | tela critica, lista repetida, mobile sem fallback |
| Efeitos de cena | postprocessing | bloom/vignette leve em cena isolada | UI inteira, cards, formularios |
| Cena pronta criada no Spline | @splinetool/react-spline | objeto premium isolado com URL real | sem URL real ou sem fallback |
| Loading/empty/success visual | lottie-react ou dotLottie | estados de coleta, fila, vazio, sucesso | loop decorativo em todo canto |
| Visibilidade no viewport | react-intersection-observer | revelar blocos, pausar loop fora da tela | se Motion `whileInView` ja resolver |

## Decisoes por biblioteca

### Motion

Melhor para:

- Microinteracoes.
- Cards.
- Layout transitions.
- Modais.
- Sidebar.
- Tabs.
- Animated presence.

Motivo:

E declarativo, conversa bem com React state e props, e tem boa ergonomia para componentes de interface.

### GSAP

Melhor para:

- Timelines complexas.
- Hero sequences.
- Scroll storytelling.
- Parallax avancado.
- Sequencias sincronizadas.

Motivo:

Controle fino de tempo, repeat, labels, easing, SVG/canvas e cleanup via `useGSAP`.

### Lenis

Melhor para:

- Smooth scroll global em experiencia editorial.
- Secoes narrativas especificas.

Motivo:

Normaliza scroll e pode melhorar sincronizacao com animacoes, mas deve ser opt-in.

### R3F/Drei/Three

Melhor para:

- 3D real interativo.
- Radar de sinais.
- Objetos 3D com sentido de produto.

Motivo:

Da controle total de cena, camera, materiais, render loop e performance.

### Spline

Melhor para:

- Cenas 3D prontas/exportadas.
- Prototipos visuais de marca.

Motivo:

Rapido para importar cenas feitas fora do codigo. Menos flexivel que R3F para logica de dados.

### Lottie/dotLottie

Melhor para:

- Empty states.
- Loaders.
- Ilustracoes leves.
- Feedback de sucesso/falha.

Motivo:

Bom custo visual quando a animacao e pequena e carregada sob demanda.

### CSS/Tailwind puro

Melhor para:

- Hover simples.
- Focus.
- Transition de cor/borda/sombra.
- Reduced motion fallback.

Motivo:

Menor custo de bundle e manutencao.

## Regra pratica

Comecar sempre pela solucao mais simples:

1. CSS se for estado simples.
2. Motion se for UI React.
3. GSAP se houver timeline.
4. R3F/Spline se a cena precisar ser 3D.
5. Lottie se for feedback ilustrado.
