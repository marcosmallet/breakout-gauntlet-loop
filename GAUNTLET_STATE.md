# Gauntlet State

Este arquivo resume o estado operacional e de produto do experimento para que cada execução não precise reconstruir contexto a partir de todo o histórico da issue #1.

## Estado atual

- Fase: **Meta-Critic / SATURATED**
- HEAD de gameplay atual: `9ed5465d60889c971a0327d3fb9cc120eb2a428b` — mira proporcional no lançamento
- Último ciclo do protocolo anterior: **Cycle 114**
- Histórico de saturação: Cycles 105–114 tiveram **10 no-ops deliberados consecutivos**
- Contador atual de no-ops: **3**
- Validação do baseline atual: GitHub Actions run `33926371567` do HEAD `1252a521331969fd5a5f1ef6aa33af5e23dd2599` concluído em **success**; job Playwright `101195676053` e etapa `npm run test:e2e` também em **success**
- Escopo preservado: HTML, CSS, JavaScript e Canvas 2D, sem game framework

O projeto atingiu SATURATED após a sequência de no-ops dos Cycles 105–114, saiu desse estado ao aprovar o DESIGN de mira proporcional e agora retorna a **SATURATED** após **3 NO-OPs consecutivos** desde essa integração. A partir daqui, MICRO exige bug/regressão real, nova evidência de jogador ou oportunidade independente de ganho perceptível claramente alto; mudanças de maior impacto devem ser consideradas como DESIGN com hipótese explícita.

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
- A suíte cobre core gameplay, colisões, progressão, score/combo, feedback audiovisual, lançamento, lifecycle, mobile/keyboard e estados de rodada.
- `window.__GAME_DEBUG__` existe principalmente para inspeção/testes. Evitar expandi-lo como event bus de produção sem uma decisão arquitetural explícita.

## Dívida arquitetural observada

O crescimento incremental criou vários módulos satélites de feedback que consultam o estado do jogo por `window.__GAME_DEBUG__` e/ou `requestAnimationFrame`.

Isso foi eficiente para mudanças pequenas, porém novas mudanças transversais podem aumentar acoplamento implícito, polling, dependência de ordem de scripts, duplicação de feedback e custo de validação.

Não refatorar apenas por estética. Se essa dívida bloquear uma melhoria de produto relevante, tratá-la como **Design Experiment** em branch, com objetivo e critérios de aceite explícitos.

## Experimentos DESIGN aceitos

### Mira proporcional no lançamento
- Hipótese: transformar a escolha binária esquerda/direita em ângulo proporcional aumenta agência e replayability sem alterar a física durante a rodada.
- Branch: `design/20260904-proportional-launch-aim`.
- PR: #2.
- Commits experimentais: `7606985` (implementação) e `3903a4e` (testes).
- Merge aceito na `main`: `9ed5465d60889c971a0327d3fb9cc120eb2a428b`.
- Playwright no PR: **73 passed / 0 failed**.
- CI pós-merge na `main`: **success**.
- GitHub Pages pós-merge: **success**.
- Resultado: aprovado pelo JUDGE; ganho de agência perceptível com complexidade localizada em `launch-countdown.js` e testes.
- Efeito no estado: contador de no-ops zerado; SATURATED deixou de ser o estado operacional atual.

## Experimentos rejeitados ou restritos

### Pontuação diferenciada por fileira
Tentada no Cycle 90 com valores `30/25/20/15/10`.

Resultado:
- 10 testes E2E falharam;
- a regra atravessou combo, high score, feedback e contratos de score;
- revertida integralmente no Cycle 91.

Conclusão: não reintroduzir como MICRO. Só reconsiderar como DESIGN de balanceamento, com hipótese explícita, atualização completa dos contratos e validação da economia de score.

### Mira proporcional/contínua
A hipótese foi posteriormente tratada corretamente como DESIGN e aceita. Não reabrir ou continuar refinando a mecânica como MICRO sem nova evidência forte de jogador ou regressão concreta.

### Mais camadas de feedback audiovisual
O jogo já possui feedback abundante. Exigir deficiência perceptível concreta antes de adicionar novos efeitos para evitar ruído e redundância.

### Novos edge cases de lifecycle/focus
A área já tem cobertura extensa. Só priorizar diante de regressão observável ou falha reproduzível.

## Últimas avaliações Meta-Critic

### NO-OP #1 após o DESIGN de mira proporcional
- Gate: `main` em `0fb59f0e58bb98d42b85e95ef7541dd1419410b5` com GitHub Actions CI e Playwright em **success**.
- Decisão: **NO-OP**.
- Motivo: não houve bug/regressão, nova evidência de jogador ou oportunidade MICRO independente de ganho perceptível claramente alto; iniciar outro DESIGN imediatamente após a mira proporcional também não tinha evidência suficiente.
- Alternativas descartadas: reabrir mira recém-polida; pontuação por fileira; novas camadas audiovisuais; novos edge cases de lifecycle; expansão arquitetural de `window.__GAME_DEBUG__`.
- JUDGE: preservar o baseline saudável supera adicionar complexidade de retorno marginal baixo.
- Efeito: contador de no-ops passou para **1**.

### NO-OP #2 após o DESIGN de mira proporcional
- Gate: `main` em `26abb861d86e7484ee014b99e20a355da55068ec`; GitHub Actions run `33921674789` concluído em **success**, job `playwright` `101181168113` concluído em **success** e etapa `npm run test:e2e` em **success**.
- Decisão: **NO-OP**.
- Análise ampla: como jogador, o loop já oferece agência no lançamento, progressão contínua, combo, edge shots, assistência discreta e feedback abundante; como game designer, candidatas de maior impacto restantes implicam balanceamento/progressão e deixam de ser MICRO; como engenheiro, não há regressão que justifique ampliar lifecycle, feedback ou `window.__GAME_DEBUG__`.
- Alternativas consideradas: nova regra de progressão/recompensa (potencial DESIGN, mas sem hipótese/evidência nova suficiente); pontuação diferenciada por fileira (somente DESIGN, histórico regressivo); refinamento adicional da mira proporcional (recém-polida, sem nova evidência); audiovisual/lifecycle (retorno marginal baixo); refatoração do debug/polling (dívida real, mas sem bloqueio de produto).
- JUDGE: **PASS para NO-OP**. Preservar o baseline oferece melhor relação ganho/risco do que iniciar uma mudança sem evidência clara.
- Efeito: contador de no-ops passa para **2**; ainda não SATURATED.
- Próxima execução: procurar primeiro regressão ou nova evidência de jogador; se nenhuma oportunidade superar claramente custo/risco e ocorrer um terceiro NO-OP consecutivo, marcar o projeto como **SATURATED**.

### NO-OP #3 após o DESIGN de mira proporcional
- Gate: `main` em `1252a521331969fd5a5f1ef6aa33af5e23dd2599`; GitHub Actions run `33926371567` concluído em **success**, job `playwright` `101195676053` concluído em **success** e etapa `npm run test:e2e` em **success**.
- Decisão: **NO-OP**.
- Análise ampla: como jogador, não há lacuna concreta nova depois da recente melhoria de agência no lançamento; como game designer, os ganhos restantes mais promissores estão em profundidade/progressão/replayability e exigiriam hipótese e balanceamento, portanto seriam DESIGN; como engenheiro, o baseline está verde e a dívida de `window.__GAME_DEBUG__`/polling não bloqueia uma oportunidade de produto atual.
- Alternativas consideradas: um sistema novo de progressão/recompensa (DESIGN potencial, mas sem hipótese suficientemente superior ao baseline nesta execução); revisitar pontuação diferenciada por fileira (somente DESIGN e com evidência histórica negativa); novo refinamento da mira proporcional (recém-integrada, sem evidência nova); feedback audiovisual ou lifecycle (sem deficiência concreta); refatoração arquitetural (sem bloqueio de produto e sem ganho direto ao jogador).
- Motivo de maior ganho marginal: preservar um baseline amplo e verde é superior a introduzir uma mecânica ou refatoração sem evidência de retorno perceptível suficiente.
- JUDGE: **PASS para NO-OP**. Nenhuma alternativa supera claramente custo, risco e complexidade.
- Efeito: contador de no-ops passa para **3** e o projeto retorna a **SATURATED**.
- Próxima execução: em SATURATED, elevar o limiar para MICRO; priorizar apenas regressão/bug real, nova evidência de jogador ou oportunidade independente de ganho claramente alto. Avaliar DESIGN somente quando houver hipótese de produto de médio porte claramente superior e critérios de aceite defensáveis.

## Protocolo de decisão

### 1. Gate
Sempre verificar HEAD da `main`, CI do HEAD, Playwright e regressões recentes. CI pendente: registrar e encerrar. Regressão causada pelo HEAD: corrigir exclusivamente a regressão.

### 2. Meta-Critic
Com baseline saudável, classificar a melhor oportunidade como:
- **MICRO** — uma única melhoria pequena, independente, segura, reversível e claramente perceptível.
- **DESIGN** — melhoria de médio porte que exige balanceamento, mudança transversal, hipótese de produto ou múltiplos arquivos/testes coordenados.
- **NO-OP** — nenhuma oportunidade com retorno marginal suficiente.

### 3. Regra de saturação
Após **3 no-ops consecutivos**, entrar em **SATURATED**: não procurar microefeitos apenas para gerar atividade; só sair com bug/regressão real, nova evidência de jogador ou hipótese DESIGN claramente superior.

### 4. MICRO
Implementar exatamente uma melhoria, validar, julgar e integrar diretamente na `main` somente se verde/coerente. Uma mudança aprovada zera o contador de no-ops.

### 5. DESIGN
Formular hipótese, benefício, riscos e critérios de aceite; criar `design/<data>-<slug>` a partir da `main` verde; implementar coesamente; atualizar Playwright; validar; julgar; integrar somente se aprovado e suficientemente validado.

## Frequência

O Meta-Critic deve rodar **de hora em hora**. Frequência alta aumenta o número de avaliações independentes, não a obrigação de alterar o produto.

## Memória persistente

- `GAUNTLET_STATE.md`: estado condensado e decisões vigentes.
- Issue #1: log histórico completo e permanente.
- `GAUNTLET.md`: protocolo operacional.
- `README.md`: visão do experimento.
