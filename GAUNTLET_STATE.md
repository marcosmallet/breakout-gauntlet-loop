# Gauntlet State

Este arquivo resume o estado operacional e de produto do experimento para que cada execução não precise reconstruir contexto a partir de todo o histórico da issue #1.

## Estado atual

- Fase: **Meta-Critic / saturação de microincrementos**
- Último commit de gameplay validado antes da migração de protocolo: `4ff2e6f1aa0192b2fec674b3808e585fd8060547`
- Último ciclo do protocolo horário anterior: **Cycle 114**
- Cycles 105–114: **10 no-ops deliberados consecutivos**
- CI/Playwright do último baseline de gameplay: **verde**
- Escopo preservado: HTML, CSS, JavaScript e Canvas 2D, sem game framework

O histórico recente mostrou diminishing returns claros. A partir deste estado, três no-ops consecutivos são um sinal de saturação e bloqueiam novos microincrementos cosméticos ou técnicos sem evidência nova.

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
- Durante o countdown o jogador pode escolher a direção inicial esquerda/direita movendo o paddle.
- Guia visual de trajetória e dica contextual "Mova para mirar".
- Estado neutro restaura corretamente a direção de lançamento original.

### Game feel e audiovisual
- Flash de impacto em blocos e paddle.
- Micro-shake de impacto.
- Trilha da bola responsiva à velocidade.
- Sons procedurais para blocos, paddle, paredes, edge shots, perda de vida, avanço de rodada e game over.
- Feedback visual para combo, score, perda/ganho de vida, última vida, round clear, high score e game over.
- Identidade/ambiente visual varia por rodada.

### Mobile, acessibilidade e lifecycle
- Touch targets adequados.
- Canvas e controles com metadados de acessibilidade.
- `aria-live`, atalhos e estados de pausa.
- Cobertura de blur/focus, visibilitychange, pagehide/pageshow e restart input.
- Layout adaptado para mobile/landscape.

## Validação

- GitHub Actions + Playwright são o gate objetivo.
- A suíte atual cobre core gameplay, colisões, progressão, score/combo, feedback audiovisual, lançamento, lifecycle, mobile/keyboard e estados de rodada.
- `window.__GAME_DEBUG__` existe principalmente para inspeção/testes. Evitar expandi-lo como event bus de produção sem uma decisão arquitetural explícita.

## Dívida arquitetural observada

O crescimento incremental criou vários módulos satélites de feedback que consultam o estado do jogo por `window.__GAME_DEBUG__` e/ou `requestAnimationFrame`.

Isso foi eficiente para mudanças pequenas, porém novas mudanças transversais podem aumentar:
- acoplamento implícito;
- polling;
- dependência de ordem de scripts;
- duplicação de feedback;
- custo de validação.

Não refatorar apenas por estética. Se essa dívida bloquear uma melhoria de produto relevante, tratá-la como **Design Experiment** em branch, com objetivo e critérios de aceite explícitos.

## Experimentos rejeitados ou revertidos

### Pontuação diferenciada por fileira
Tentada no Cycle 90 com valores `30/25/20/15/10`.

Resultado:
- 10 testes E2E falharam;
- a regra atravessou combo, high score, feedback e contratos de score;
- revertida integralmente no Cycle 91.

Conclusão: não reintroduzir como microincremento. Só reconsiderar como experimento de balanceamento de médio porte, com atualização completa dos contratos e validação da economia de score.

### Mira proporcional/contínua
Tem potencial perceptível, mas amplia física/controle de uma mecânica recém-estabilizada. Não executar como microincremento sem hipótese de produto e critérios claros.

### Mais camadas de feedback audiovisual
O jogo já possui feedback abundante. Exigir deficiência perceptível concreta antes de adicionar novos efeitos para evitar ruído e redundância.

### Novos edge cases de lifecycle/focus
A área já tem cobertura extensa. Só priorizar diante de regressão observável ou falha reproduzível.

## Protocolo de decisão

### 1. Gate
Sempre verificar primeiro:
- HEAD da `main`;
- CI do HEAD;
- Playwright;
- regressões recentes.

CI pendente: registrar e encerrar.
Regressão causada pelo HEAD: corrigir exclusivamente a regressão.

### 2. Meta-Critic
Com baseline saudável, classificar a melhor oportunidade como:

- **MICRO** — uma única melhoria pequena, independente, segura, reversível e claramente perceptível.
- **DESIGN** — melhoria de médio porte que exige balanceamento, mudança transversal, hipótese de produto ou múltiplos arquivos/testes coordenados.
- **NO-OP** — nenhuma oportunidade com retorno marginal suficiente.

### 3. Regra de saturação
Após **3 no-ops consecutivos**, entrar em **SATURATED**:
- não procurar novos microefeitos apenas para gerar atividade;
- executar análise ampla de produto;
- só sair de SATURATED com bug/regressão real, nova evidência de jogador ou uma hipótese DESIGN claramente superior.

O estado atual já está em SATURATED porque Cycles 105–114 foram no-op.

### 4. MICRO
Quando houver oportunidade MICRO:
- implementar exatamente uma melhoria;
- validar;
- JUDGE;
- commit direto na `main` somente se verde/coerente;
- registrar a decisão na issue #1;
- zerar o contador de no-ops.

### 5. DESIGN
Quando houver oportunidade DESIGN:
1. Formular hipótese, benefício ao jogador, riscos e critérios de aceite.
2. Criar branch `design/<data>-<slug>` a partir da `main` verde.
3. Implementar o experimento de forma coesa na branch; não fragmentar artificialmente em microciclos.
4. Atualizar/adicionar Playwright e executar toda validação relevante.
5. JUDGE comparar ganho perceptível versus complexidade, regressões e dívida.
6. Se aprovado e CI verde, integrar na `main`; se reprovado, descartar/manter a branch apenas como evidência, sem contaminar `main`.
7. Registrar resultado e decisão na issue #1 e atualizar este arquivo.

## Frequência

O Meta-Critic deve rodar **a cada 12 horas**, em vez de de hora em hora.

O objetivo agora é maximizar ganho marginal por execução, não quantidade de ciclos ou commits.

## Memória persistente

- `GAUNTLET_STATE.md`: estado condensado e decisões vigentes.
- Issue #1: log histórico completo e permanente.
- `GAUNTLET.md`: protocolo operacional.
- `README.md`: visão do experimento.
