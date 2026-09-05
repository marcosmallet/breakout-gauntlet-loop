# Value Backlog

Este arquivo organiza **problemas, evidências e hipóteses de valor** do Breakout Gauntlet Loop.

Ele não é uma lista de features. Uma ideia sem evidência permanece `candidate` e não autoriza implementação.

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
- `experiment` — DESIGN em andamento;
- `rejected` — hipótese testada/rejeitada ou custo superior ao ganho;
- `resolved` — problema resolvido e validado.

## Oportunidades atuais

### Profundidade e progressão após as primeiras rodadas

- **Problema:** pode existir diminishing novelty após o jogador dominar o loop básico.
- **Evidência:** nenhuma evidência externa de jogador ou métrica disponível atualmente.
- **Impacto esperado:** potencial aumento de retenção/replayability.
- **Jogadores afetados:** jogadores que alcançam rodadas intermediárias/avançadas.
- **Hipótese:** uma progressão adicional bem balanceada poderia manter decisões interessantes por mais tempo.
- **Métrica/comportamento esperado:** maior duração de sessão e maior proporção de sessões chegando a rodadas avançadas.
- **Risco:** alto risco de rebalanceamento e complexidade transversal.
- **Tamanho:** DESIGN.
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
- **Tamanho:** DESIGN se instrumentação for necessária.
- **Status:** `validated` quanto ao problema de falta de evidência; **não autoriza telemetria automaticamente**.

## Restrições / evidência histórica

### Pontuação diferenciada por fileira

- **Evidência:** tentativa anterior causou regressão transversal em score/combo/high score e múltiplos testes.
- **Status:** `rejected` como MICRO.
- Só reconsiderar como DESIGN com evidência nova, hipótese de economia de score e contratos completos.

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
