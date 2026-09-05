# Gauntlet State

Este arquivo é a memória operacional condensada do experimento. Ele não é um log de execução.

## Estado atual

- Fase: **Value-Driven Meta-Critic / SATURATED**
- HEAD de gameplay atual: `9ed5465d60889c971a0327d3fb9cc120eb2a428b` — mira proporcional no lançamento
- Baseline de protocolo anterior: `789385d6eb60bf77acb82620c6586c0617c0dc00`
- Último ciclo do protocolo anterior: **Cycle 114**
- Histórico de saturação: Cycles 105–114 tiveram **10 NO-OPs deliberados consecutivos**
- Execuções após o DESIGN de mira proporcional: a issue #1 registra **11 NO-OPs consecutivos** antes da adoção formal do Value Gate
- Escopo preservado: HTML, CSS, JavaScript e Canvas 2D, sem game framework
- Regra operacional vigente: **commit exige evidência + Value Case + Correctness Gate + Value Judge**

O projeto permanece SATURATED. A frequência horária serve para reavaliar evidências, não para procurar atividade.

## Evidências abertas

### Confirmadas

#### Falta de evidência externa limita a próxima decisão de produto
- A sequência prolongada de NO-OPs após a mira proporcional indica diminishing returns da análise baseada apenas em código, testes e histórico.
- Problema validado: o próximo ganho relevante tende a depender de evidência nova de jogador, métrica, bug/regressão ou hipótese DESIGN diferenciada.
- Isso **não autoriza telemetria automaticamente**. Instrumentação só deve ocorrer como DESIGN com caso de valor, privacidade e complexidade proporcionais.

### Hipóteses ainda sem evidência suficiente

- Profundidade/progressão adicional após as primeiras rodadas.
- Ajustes na curva de dificuldade/ritmo.
- Mudanças adicionais de replayability.
- Novas camadas audiovisuais.
- Novos edge cases de lifecycle.
- Refatoração de `window.__GAME_DEBUG__`/polling sem bloqueio concreto de produto.

Essas hipóteses permanecem candidatas, não tarefas.

## Mecânicas e qualidade já existentes

### Core e física
- Breakout em Canvas 2D com 50 blocos por rodada.
- Colisão de paredes, blocos e paddle com correções de borda/superfície.
- Movimento normalizado por frame time.
- Velocidade da bola cresce com impactos em blocos e progressão de rodada.
- Paddle reduz de largura ao longo das rodadas.
- Edge shots recompensam rebatidas nas extremidades.
- Última vida recebe assistência de velocidade discreta.

### Progressão e replayability
- Rodadas contínuas.
- Score, combo com multiplicador limitado e high score persistente.
- Bônus de sobrevivência ao concluir rodada.
- Vida extra ao concluir rodada, limitada a 5.
- Indicador de blocos restantes.
- Feedback especial nos últimos blocos da rodada.

### Controles e UX
- Teclado: setas e A/D.
- Pointer/touch drag para o paddle.
- Pausa manual e automática por perda de foco/visibilidade.
- Countdown de lançamento/respawn.
- Durante o countdown, o jogador controla proporcionalmente o ângulo de lançamento pela distância do paddle ao centro.
- A mira preserva velocidade total, é simétrica e possui guia visual coerente com o vetor real.
- Estado neutro restaura corretamente o vetor de lançamento original.

### Game feel e audiovisual
- Flash de impacto em blocos e paddle.
- Micro-shake de impacto.
- Trilha da bola responsiva à velocidade.
- Sons procedurais para eventos principais.
- Feedback visual para combo, score, vidas, round clear, high score e game over.
- Identidade visual varia por rodada.

### Mobile, acessibilidade e lifecycle
- Touch targets adequados.
- Canvas e controles com metadados de acessibilidade.
- `aria-live`, atalhos e estados de pausa.
- Cobertura de blur/focus, visibilitychange, pagehide/pageshow e restart input.
- Layout adaptado para mobile/landscape.

## Validação

A validação agora tem dois níveis.

### Correctness Gate
- GitHub Actions + Playwright são o gate objetivo.
- A suíte cobre core gameplay, colisões, progressão, score/combo, feedback audiovisual, lançamento, lifecycle, mobile/keyboard e estados de rodada.
- Uma mudança não pode ser integrada se criar regressão relevante ou não estiver suficientemente validada.

### Value Judge
Mesmo com CI verde, a mudança só deve permanecer se:
- resolver problema ligado a evidência;
- produzir ganho perceptível;
- justificar complexidade e dívida;
- não possuir alternativa claramente mais simples;
- merecer existir mesmo sob um limite hipotético de **um commit por semana**.

## Dívida arquitetural observada

O crescimento incremental criou módulos satélites que consultam o estado por `window.__GAME_DEBUG__` e/ou `requestAnimationFrame`.

`window.__GAME_DEBUG__` deve permanecer principalmente interface de testes. Não expandi-lo como event bus/API de produção por conveniência.

Não refatorar por estética. Se a dívida bloquear uma melhoria de produto relevante, tratá-la como DESIGN com objetivo e critérios de aceite explícitos.

## Experimentos DESIGN aceitos

### Mira proporcional no lançamento
- Hipótese: transformar escolha binária esquerda/direita em ângulo proporcional aumenta agência e replayability sem alterar a física durante a rodada.
- Branch: `design/20260904-proportional-launch-aim`.
- PR: #2.
- Commits experimentais: `7606985` e `3903a4e`.
- Merge aceito na `main`: `9ed5465d60889c971a0327d3fb9cc120eb2a428b`.
- Playwright no PR: **73 passed / 0 failed**.
- CI pós-merge: **success**.
- Resultado: aprovado pelo JUDGE.

## Experimentos rejeitados ou restritos

### Pontuação diferenciada por fileira
Tentada no Cycle 90 com valores `30/25/20/15/10`.

Resultado:
- 10 testes E2E falharam;
- regra atravessou combo, high score, feedback e contratos de score;
- revertida integralmente no Cycle 91.

Conclusão: não reintroduzir como MICRO. Só reconsiderar como DESIGN com evidência nova, hipótese explícita, atualização completa dos contratos e validação da economia de score.

### Mira proporcional/contínua
Já foi tratada corretamente como DESIGN e aceita. Não continuar refinando como MICRO sem nova evidência forte de jogador ou regressão concreta.

### Mais feedback audiovisual
O jogo já possui feedback abundante. Exigir deficiência concreta antes de adicionar efeitos.

### Lifecycle/focus
Área já possui cobertura extensa. Só priorizar diante de regressão observável.

## Novo protocolo orientado a valor

Toda execução deve seguir:

1. **Baseline Gate** — CI/Playwright e regressões.
2. **Evidence Gate** — existe problema real sustentado por evidência?
3. **Value Case** — benefício, comportamento esperado, alternativa simples, risco e complexidade.
4. **MICRO / DESIGN / NO-OP**.
5. **Correctness Gate**.
6. **Value Judge**.
7. Commit somente se a mudança material merece existir.

## Memória persistente

- `GAUNTLET_STATE.md`: memória condensada e decisões vigentes.
- `VALUE_BACKLOG.md`: problemas/hipóteses orientados por evidência.
- Issue #1: log histórico completo e permanente.
- `GAUNTLET.md`: protocolo operacional.
- `README.md`: visão do experimento.

NO-OPs saturados sem mudança material são registrados somente na issue #1.
