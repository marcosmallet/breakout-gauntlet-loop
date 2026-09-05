# Value Backlog

Este arquivo organiza **problemas, evidências e hipóteses de valor** do Breakout Gauntlet Loop.

Ele não é uma lista de features. Uma ideia sem evidência permanece `candidate` e não autoriza implementação. Itens `candidate` podem orientar **Evidence Discovery**, mas investigação não implica implementação.

## Regras

Cada oportunidade deve responder, quando aplicável:

- **Problema**
- **Evidência**
- **Impacto esperado**
- **Jogadores afetados**
- **Hipótese**
- **Métrica/comportamento esperado**
- **Risco**
- **Tamanho**
- **Status**

Status permitidos:
- `candidate` — hipótese sem evidência suficiente;
- `validated` — evidência suficiente para formular Value Case;
- `strategic` — múltiplas evidências independentes convergem para um problema sistêmico que pode justificar investigação MACRO;
- `experiment` — DESIGN ou MACRO em andamento;
- `rejected` — hipótese testada/rejeitada ou custo superior ao ganho;
- `resolved` — problema resolvido e validado.

## Evidence Discovery

O agente deve usar este backlog como fonte de perguntas investigáveis, não como fila automática de trabalho.

Há duas lentes:
- **FOCAL** — uma área/pergunta local;
- **SYSTEMIC** — uma pergunta estratégica que pode atravessar 2–4 subsistemas causalmente relacionados.

Ao entrar em SATURATED, a próxima execução deve usar SYSTEMIC.

Regras:
- começar por **uma área/pergunta focal por execução**; expandir para outros subsistemas apenas quando houver caminho causal demonstrável ligado ao mesmo problema;
- preferir áreas não investigadas nas 3 execuções anteriores;
- tentar falsificar a hipótese, não confirmá-la;
- usar Playwright, `window.__GAME_DEBUG__`, inspeção de código e medições determinísticas antes de propor nova instrumentação;
- promover `candidate` para `validated` somente com evidência reproduzível ou mensurável;
- promover para `strategic` quando múltiplas evidências independentes convergirem para a mesma causa sistêmica **ou para o mesmo limite estrutural mensurável do baseline**;
- não alterar este arquivo por uma investigação que não mudou materialmente a evidência.

Perguntas iniciais úteis:
- A curva de velocidade + redução do paddle cria algum salto desproporcional entre rodadas?
- Há estados de lançamento/respawn em que a mira produz comportamento inesperado?
- Touch e teclado produzem capacidade de controle materialmente diferente?
- Existe estado de partida longa que acumula velocidade/dificuldade de forma injusta?
- Algum comportamento importante ao jogador está sem cobertura e possui risco causal concreto?

## Oportunidades atuais

### Plateau de progressão após a rodada 5

- **Problema:** a progressão mecânica de dificuldade estabilizava cedo demais em um jogo de rodadas contínuas.
- **Evidência:** paddle atingia 78px na rodada 5; velocidade inicial estabilizava em componentes 5/5; cap global 8.0 era alcançado após ~11 impactos, deixando ~39/50 blocos no teto e repetindo o mesmo padrão nas rodadas seguintes.
- **Impacto esperado:** maior sensação de progressão e desafio nas rodadas 6–10.
- **Jogadores afetados:** jogadores que ultrapassam as primeiras quatro rodadas.
- **Hipótese testada:** elevar o cap em +0,2/rodada da 6 à 10, com hard cap 9.0, mantendo rodadas 1–5 idênticas.
- **Validação:** PR #3; CI/Playwright `33959492400` **success**; testes cobrem cap da rodada 5, expansão na rodada 6, hard cap na 10 e edge-shot no cap tardio.
- **Risco controlado:** aumento máximo de 12,5% sobre o cap anterior, sem nova mecânica.
- **Tamanho:** DESIGN.
- **Status:** `resolved`.


### Profundidade e progressão após as primeiras rodadas

- **Problema:** pode existir diminishing novelty após o jogador dominar o loop básico.
- **Evidência:** nenhuma evidência externa de jogador ou métrica disponível atualmente.
- **Impacto esperado:** potencial aumento de retenção/replayability.
- **Jogadores afetados:** jogadores que alcançam rodadas intermediárias/avançadas.
- **Hipótese:** uma progressão adicional bem balanceada poderia manter decisões interessantes por mais tempo.
- **Métrica/comportamento esperado:** maior duração de sessão e maior proporção de sessões chegando a rodadas avançadas.
- **Risco:** alto risco de rebalanceamento e complexidade transversal.
- **Tamanho:** DESIGN ou MACRO se evidências futuras demonstrarem necessidade de mudanças coordenadas.
- **Status:** `candidate`.

### Ritmo e dificuldade por rodada

- **Problema:** não há evidência objetiva de que a curva atual esteja ideal.
- **Evidência:** apenas inferência de design; sem dados de mortes/rodada ou abandono.
- **Impacto esperado:** potencial melhora de flow.
- **Jogadores afetados:** todos, especialmente novos jogadores.
- **Hipótese:** dados reais de mortes e abandono podem revelar picos ou vales de dificuldade.
- **Métrica/comportamento esperado:** distribuição de mortes mais coerente e menos abandono precoce.
- **Risco:** médio/alto; altera balanceamento.
- **Tamanho:** DESIGN.
- **Status:** `candidate`.

### Evidência de jogador / métricas de gameplay

- **Problema:** o Meta-Critic observa majoritariamente código, testes e histórico e já atingiu saturação.
- **Evidência:** sequência de mais de 10 NO-OPs após a última mudança de produto e ausência de nova evidência externa.
- **Impacto esperado:** melhorar a qualidade das decisões futuras e reduzir especulação.
- **Jogadores afetados:** indiretamente todos.
- **Hipótese:** evidência externa sobre sessões, progressão e controles permitirá priorizar problemas reais em vez de inventar microfeatures.
- **Métrica/comportamento esperado:** surgimento de Value Cases baseados em comportamento real.
- **Risco:** analytics pode adicionar complexidade, privacidade e infraestrutura sem benefício proporcional.
- **Tamanho:** DESIGN se instrumentação focal for necessária; MACRO somente se o problema exigir solução sistêmica coesa.
- **Status:** `validated` quanto ao problema de falta de evidência; **não autoriza telemetria automaticamente**.

## Restrições / evidência histórica

### Pontuação diferenciada por fileira

- **Evidência:** tentativa anterior causou regressão transversal em score/combo/high score e múltiplos testes.
- **Status:** `rejected` como MICRO.
- Só reconsiderar como DESIGN ou como parte causalmente necessária de MACRO com evidência nova, hipótese de economia de score e contratos completos.

### Mira proporcional/contínua

- **Evidência:** DESIGN já implementado, testado e aprovado.
- **Status:** `resolved`.
- Não reabrir refinamento sem nova evidência forte.

### Mais feedback audiovisual

- **Evidência:** jogo já possui cobertura abundante de feedback.
- **Status:** `candidate` apenas diante de deficiência concreta futura.

### Lifecycle/focus/pointer/keyboard

- **Evidência:** área já possui cobertura extensa.
- **Status:** `candidate` apenas diante de regressão reproduzível.

### Refatoração de `window.__GAME_DEBUG__` / polling

- **Problema:** dívida arquitetural real.
- **Evidência:** módulos satélites consultam interface de debug/polling.
- **Impacto atual:** não bloqueia valor de produto.
- **Status:** `candidate`.
- Só promover se bloquear uma melhoria concreta; não usar como justificativa para refatoração estética.
