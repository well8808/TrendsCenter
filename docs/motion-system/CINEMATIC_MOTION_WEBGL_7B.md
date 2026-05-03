# Cinematic Motion + WebGL 7B

## Objetivo

A 7B lapida a base da 7A para deixar a experiencia mais clara e resiliente:

`Reel real -> Signal -> Opportunity Brief -> Pauta -> Draft no Studio`

Motion e WebGL continuam servindo a leitura do produto. Eles mostram continuidade, estado atual e proximo passo; nao viram enfeite isolado.

## O que mudou

- `DecisionFlowStepper` agora mostra progresso, etapa atual e estado por etapa.
- `FlowNarrativePanel` explica onde a oportunidade esta no fluxo e qual movimento vem depois.
- `/trends` conecta Biblioteca, Pauta de acao e Studio com narrativa mais clara.
- `/trends/[id]` ganhou leitura de sala de decisao com stepper + painel de proximo movimento.
- `/studio` e `/studio/[id]` mostram continuidade do Reel ate o roteiro.
- As cenas WebGL ganharam fallback para erro de renderer e `webglcontextlost`.

## WebGL

WebGL aparece somente onde agrega contexto visual:

- `/trends` desktop: um canvas no hero cinematico.
- Dashboard/Sala de Sinais: cena antiga continua isolada, com os mesmos limites.

WebGL nao deve aparecer em:

- `/login`.
- Mobile pequeno.
- `prefers-reduced-motion`.
- Paginas do Studio sem necessidade real.
- Estados sem dados reais suficientes para renderizar cena significativa.

## Fallbacks

O stage cinematografico renderiza fallback HTML/CSS quando:

- o cliente ainda nao hidratou;
- reduced motion esta ativo;
- viewport e mobile/baixo custo;
- nao ha Reels ou estagios reais suficientes;
- o renderer falha;
- o contexto WebGL e perdido.

O fallback preserva a narrativa visual sem canvas pesado e sem bloquear leitura.

## Performance budget

- Maximo de 1 canvas planejado em `/trends`.
- Canvas lazy via `next/dynamic`.
- DPR limitado pelo quality helper.
- Render loop reduzido e pausado fora da viewport.
- Sem postprocessing novo.
- Sem dependencia nova.
- Sem `preserveDrawingBuffer`.
- Sem transformar rotas server em client sem necessidade.

## Componentes client

- `CinematicSignalUniverseStage` e cenas WebGL.
- Primitives cinematograficas com Motion.
- `DecisionFlowStepper`.
- `FlowNarrativePanel`.
- Cards/botoes que precisam de hover, copy ou form feedback.

Dados continuam carregados por Server Components e passados para ilhas client pequenas.

## Checklist de QA

- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run db:status`
- `/login`: 0 canvas.
- `/trends` desktop: no maximo 1 canvas.
- `/trends` mobile 390x844: 0 canvas pesado.
- Reduced motion: 0 canvas.
- `/trends/[id]`: Opportunity Brief e Pauta pronta legiveis.
- `/studio`: drafts reais visiveis.
- `/studio/[id]`: editor mantem origem real e feedback.
- Reload nao duplica Signal, Decision ou Draft.
- Console/pageErrors sem erros reais.

## Fora de escopo

Nao foi alterado:

- Prisma schema, migrations ou banco estrutural.
- Bright Data, env vars, API keys ou auth.
- Pipeline de coleta, media, thumbnails, cache/proxy/CDN.
- Scoring, dedupe ou normalizacao principal.
- Dados fake, seeds ou mocks visuais.

## Riscos conhecidos

- Chromium headless pode emitir warnings de `ReadPixels` em WebGL; isso nao bloqueia se nao houver erro real do app.
- URLs do Instagram CDN continuam classificadas como `likely-expiring`; sem cache/proxy ate existir evidencia real de expiracao recorrente.
