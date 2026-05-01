# Visual Direction

## Norte visual

O Instagram Reels Command Center deve parecer uma ferramenta usada por profissionais para tomar decisoes, nao uma landing page gerada para impressionar.

A direcao visual futura:

- Premium dark UI.
- Influencia Vercel e Linear.
- Social, moderna e limpa.
- Interface operacional real.
- Alta densidade de informacao, mas com calma visual.
- Movimento funcional, usado para guiar atencao.

## Principios

### 1. Produto antes de espetaculo

A primeira tela deve continuar sendo o app. Nada de hero generico, promessa vaga ou narrativa de marketing substituindo a experiencia operacional.

### 2. Motion com intencao

Cada animacao precisa responder uma pergunta:

- O que mudou?
- O que merece atencao?
- Qual decisao vem agora?
- O sistema esta trabalhando?

Se a animacao nao responde isso, ela provavelmente nao deve existir.

### 3. 3D com significado

3D deve representar algo do produto:

- radar;
- fluxo BR/US;
- coleta;
- evidencia;
- score;
- decisao.

3D abstrato sem funcao vira ruido.

### 4. Calma visual

Evitar:

- excesso de gradiente;
- cards demais competindo;
- glow pesado;
- blur caro;
- loop infinito em varias regioes;
- animacao em todo hover;
- textos grandes demais em superficies densas.

Preferir:

- contraste claro;
- espacamento consistente;
- bordas sutis;
- sombras discretas;
- profundidade em camadas;
- uma cor principal de acao;
- feedback objetivo.

### 5. Social sem parecer feed generico

O produto analisa Reels, mas nao precisa copiar o Instagram. A linguagem deve sugerir:

- creator;
- som;
- formato;
- sinal;
- tendencia;
- evidencia;
- timing.

Mas a organizacao deve continuar sendo de command center.

## Direcao de motion

### Movimento base

- Entradas curtas: 180ms a 420ms.
- Easing principal: cubic-bezier(0.22, 1, 0.36, 1).
- Usar transform e opacity como primeira escolha.
- Stagger pequeno em listas.
- Evitar delays longos.

### Estados que merecem movimento

- Item ficou ativo.
- Filtro mudou.
- Card entrou/saiu.
- Score foi atualizado.
- Job entrou em fila.
- Coleta esta em andamento.
- Erro precisa ser percebido.
- Empty state precisa orientar o proximo passo.

### Estados que devem ficar quietos

- Leitura de texto longo.
- Formularios densos.
- Listas grandes.
- Sidebar quando o usuario esta navegando rapido.
- Qualquer area com erro critico ou compliance.

## Direcao 3D

Usar 3D como camada especial, nao como default.

Bons usos:

- Radar principal.
- Mapa de fluxo de sinal.
- Objeto ambientado no topo, leve e nao invasivo.

Maus usos:

- 3D em cada card.
- 3D em formulario.
- Cena grande atras de texto importante.
- WebGL em pagina inteira sem fallback.

## Direcao de componentes

Padrao ideal:

- Componentes pequenos.
- Props claras.
- Reduced motion embutido.
- Nada importado automaticamente em paginas.
- Dynamic import para 3D/Spline.
- Sem dependencia de dados reais.

## Resultado desejado

Quando a fase visual for implementada, a UI deve passar esta sensacao:

> "Isso e uma central de inteligencia de Reels que entende prioridade, risco e timing."

Nao:

> "Isso e uma demo bonita de efeitos."
