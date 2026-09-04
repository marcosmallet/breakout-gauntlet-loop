# Gauntlet State

Este arquivo resume o estado operacional e de produto do experimento para que cada execução não precise reconstruir contexto a partir de todo o histórico da issue #1.

## Estado atual

- Fase: **Meta-Critic / ativo após DESIGN aceito**
- HEAD de gameplay atual: `9ed5465d60889c971a0327d3fb9cc120eb2a428b` — mira proporcional no lançamento
- Último ciclo do protocolo anterior: **Cycle 114**
- Histórico de saturação: Cycles 105–114 tiveram **10 no-ops deliberados consecutivos**
- Contador atual de no-ops: **1**
- Validação do DESIGN aceito: **73/73 Playwright passando**, CI da `main` verde
- Escopo preservado: HTML, CSS, JavaScript e Canvas 2D, sem game framework

O projeto atingiu SATURATED após a sequência de no-ops, mas saiu desse estado operacional ao encontrar e aprovar um experimento DESIGN com ganho perceptível. A regra de três no-ops continua ativa e poderá colocar o projeto novamente em SATURATED. A primeira avaliação após esse DESIGN foi um NO-OP deliberado: nenhuma nova oportunidade superou o custo/risco imediatamente após a integração.

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
- Durante o countdown, o jogador controla **proporcionalmente o ângulo de lançamento** pela distância do paddle ao centro.
- Quanto mais distante do centro, mais aberto é o ângulo, preservando a velocidade total da bola.
- A mira é simétrica entre esquerda/direita e o guia visual acompanha o vetor real escolhido.
- Guia visual de trajetória e dica contextual "Mova para mirar".
- Estado neutro restaura corretamente o vetor de lançamento aleatório original.

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

## Experimentos DESIGN aceitos

### Mira proporcional no lançamento
Executada na primeira avaliação Meta-Critic após a migração do protocolo.

- Hipótese: transformar a escolha binária esquerda/direita em ângulo proporcional aumenta agência e replayability sem alterar a física durante a rodada.
- Branch: `design/20260904-proportional-launch-aim`.
- PR: #2.
- Commits experimentais: `7606985` (implementação) e `3903a4e` (testes).
- Merge aceito na `main`: `9ed5465d60889c971a0327d3fb9cc120eb2a428b`.
- Playwright no PR: **73 passed / 0 failed**.
- CI pós-merge na `main`: **success**.
- GitHub Pages pós-merge: **success**.
- Resultado: aprovado pelo JUDGE; o ganho de agência é perceptível e a complexidade ficou localizada em `launch-countdown.js` e seus testes.
- Efeito no estado: contador de no-ops zerado; SATURATED deixou de ser o estado operacional atual.

## Experimentos rejeitados ou revertidos

### Pontuação diferenciada por fileira
Tentada no Cycle 90 com valores `30/25/20/15/10`.

Resultado:
- 10 testes E2E falharam;
- a regra atravessou combo, high score, feedback e contratos de score;
- revertida integralmente no Cycle 91.

Conclusão: não reintroduzir como microincremento. Só reconsiderar como experimento de balanceamento de médio porte, com atualização completa dos contratos e validação da economia de score.

### Mais camadas de feedback audiovisual
O jogo já possui feedback abundante. Exigir deficiência perceptível concreta antes de adicionar novos efeitos para evitar ruído e redundância.

### Novos edge cases de lifecycle/focus
A área já tem cobertura extensa. Só priorizar diante de regressão observável ou falha reproduzível.

## Última avaliação Meta-Critic

### NO-OP após o DESIGN de mira proporcional
- Gate: `main` em `0fb59f0e58bb98d42b85e95ef7541dd1419410b5` com GitHub Actions CI concluído em **success** e job Playwright concluído em **success**.
- Decisão: **NO-OP**.
- Motivo: não houve bug/regressão, nova evidência de jogador ou oportunidade MICRO independente com ganho perceptível claramente alto; iniciar outro DESIGN imediatamente após a mira proporcional também não tem evidência suficiente para justificar custo e risco.
- Alternativas descartadas: reabrir mira recém-polida; pontuação por fileira; novas camadas audiovisuais; novos edge cases de lifecycle; expansão arquitetural de `window.__GAME_DEBUG__`.
- JUDGE: preservar o baseline saudável supera adicionar complexidade de retorno marginal baixo.
- Efeito no estado: contador de no-ops passa para **1**; projeto ainda não está SATURATED.

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

A sequência dos Cycles 105–114 levou o projeto a SATURATED. O DESIGN de mira proporcional foi aceito e zerou o contador; o estado atual não está SATURATED.

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

O Meta-Critic deve rodar **de hora em hora**.

A frequência alta aumenta o número de avaliações independentes, não a obrigação de alterar o produto. Em SATURATED, o resultado esperado pode continuar sendo NO-OP por muitas execuções. O objetivo é maximizar ganho marginal por commit, mantendo alta frequência de avaliação.

## Memória persistente

- `GAUNTLET_STATE.md`: estado condensado e decisões vigentes.
- Issue #1: log histórico completo e permanente.
- `GAUNTLET.md`: protocolo operacional.
- `README.md`: visão do experimento.
