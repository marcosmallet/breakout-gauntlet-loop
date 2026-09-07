# Gauntlet State

Este arquivo é a memória operacional condensada do experimento. Ele não é um log de execução.

## Estado atual

- Fase: **Value-Driven Meta-Critic / ACTIVE**
- Baseline de gameplay atual: **mira proporcional + progressão tardia de velocidade + doze formações rotativas por rodada + power-ups coletáveis W/S com bônus rotativo P/G/C/T + beat de vitória + Elite opcional por domínio**
- Baseline de protocolo anterior: `789385d6eb60bf77acb82620c6586c0617c0dc00`
- Último ciclo do protocolo anterior: **Cycle 114**
- Histórico de saturação: Cycles 105–114 tiveram **10 NO-OPs deliberados consecutivos**
- Histórico recente: **13 NO-OPs consecutivos** após a mira proporcional, encerrados por Evidence Discovery que identificou plateau mensurável de progressão após a rodada 5
- Escopo preservado: HTML, CSS, JavaScript e Canvas 2D, sem game framework
- Regra operacional vigente: **Baseline Gate + FOCAL/SYSTEMIC Evidence Discovery + Strategic Synthesis + Evidence Gate + Value Case + Correctness Gate + Value Judge**
- Modos permitidos: **MICRO / DESIGN / MACRO / NO-OP**
- Atomicidade vigente: **um problema / uma hipótese / um resultado de produto**; a escala da solução acompanha a escala da evidência
- Regra de saturação estratégica: ao entrar em SATURATED, a próxima execução saudável usa **SYSTEMIC Discovery**; enquanto saturado, ao menos 1 em cada 3 execuções saudáveis deve ser sistêmica
- Regra de experimentação: DESIGN/MACRO podem iniciar com evidência interna forte e falsificável; integração continua exigindo ganho comprovado

O projeto saiu de SATURATED quando um DESIGN orientado por evidência foi aprovado. A frequência horária serve para começar por uma área focal do produto, podendo expandir causalmente quando necessário, sem criar obrigação de mudança nem preferência artificial por escopo pequeno.

## Evidências abertas

### Confirmadas

#### Falta de evidência externa limita a próxima decisão de produto
- A sequência prolongada de NO-OPs após a mira proporcional indica diminishing returns da análise baseada apenas em código, testes e histórico.
- Problema validado: o próximo ganho relevante tende a depender de evidência nova de jogador, métrica, bug/regressão, hipótese DESIGN diferenciada ou síntese estratégica de evidências que revele problema sistêmico.
- Isso **não autoriza telemetria automaticamente**. Instrumentação deve ocorrer como DESIGN ou MACRO somente quando a escala do problema justificar, sempre com caso de valor, privacidade e complexidade proporcionais.

### Hipóteses ainda sem evidência suficiente

- Expansão futura além das doze formações e dos seis poderes W/S/P/G/C/T já validados, somente com nova evidência.
- Ajustes na curva de dificuldade/ritmo.
- Mudanças adicionais de replayability além da escolha Elite já integrada.
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
- A partir da rodada 6, domínio sustentado em 5 vidas pode desbloquear uma escolha explícita entre permanecer no modo Normal ou aceitar o risco/recompensa Elite.
- Elite preserva o balanceamento já validado: +0,5 no teto de velocidade e janela de combo de 2,0 s para 2,5 s.
- Toda rodada possui identidade espacial em ciclo de doze formações: **Muralha → Escalonada → Canal → Funil → Diamante → Ondas → Fortaleza → Fogo cruzado → Chevron → Coroa → Escadaria → Portais**, sempre com 50 blocos e a mesma economia.
- Cada rodada contém exatamente três blocos especiais determinísticos: **W** libera Raquete larga (+34 px por até 600 steps ativos), **S** libera um Escudo de uma carga e o terceiro gira entre **P** (Perfuração: 3 impactos atravessam blocos sem ricochetear), **G** (Bola gigante: raio 8→12 por 480 steps ativos), **C** (Controle: 4 rebatidas com maior autoridade direcional, preservando a velocidade) e **T** (Tempo lento: deslocamento efetivo da bola em 72% por 360 steps ativos, sem alterar vx/vy).
- Os poderes caem como cápsulas coletáveis; pausas, victory beat e respawn grace congelam seu tempo/movimento, e perder uma vida limpa poderes e drops pendentes.

### Controles e UX
- Teclado: setas e A/D.
- Pointer/touch drag para o paddle.
- Pausa manual e automática por perda de foco/visibilidade.
- Countdown de lançamento/respawn.
- Durante o countdown, o jogador controla proporcionalmente o ângulo de lançamento pela distância do paddle ao centro.
- A mira preserva velocidade total, é simétrica e possui guia visual coerente com o vetor real.
- Estado neutro restaura corretamente o vetor de lançamento original.
- Quando Elite é desbloqueado, a transição de rodada fica suspensa até uma escolha explícita, evitando decisão sob gameplay concorrente.

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
- Escolha Elite possui foco explícito, botões acionáveis por teclado/touch e layout responsivo.

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
- merecer receber a **principal janela de desenvolvimento da semana**, independentemente de exigir um ou vários commits internos em branch.

## Dívida arquitetural observada

O crescimento incremental criou módulos satélites que consultam o estado por `window.__GAME_DEBUG__` e/ou `requestAnimationFrame`.

`window.__GAME_DEBUG__` deve permanecer principalmente interface de testes. Não expandi-lo como event bus/API de produção por conveniência.

Não refatorar por estética. Se a dívida bloquear uma melhoria de produto relevante, tratá-la como DESIGN ou MACRO conforme a escala causal do problema, sempre com objetivo e critérios de aceite explícitos.

## Experimentos MACRO aceitos

### Expansão C/T + ciclo de 12 formações
- **Evidência externa:** nova solicitação explícita do usuário para adicionar mais poderes e novas formações após o baseline W/S/P/G + 8 layouts.
- **Problema de produto:** a expansão anterior melhorou variedade, mas ainda repetia o ciclo espacial em R9 e o terceiro bônus cobria apenas penetração/área; faltavam poderes voltados a controle fino e ritmo.
- **Hipótese:** adicionar quatro geometrias novas e dois poderes de função distinta, mantendo exatamente três blocos especiais por rodada, amplia replayability sem inflar a economia ou o volume de drops.
- **Contrato de formações:** ciclo de 12 — **Muralha / Escalonada / Canal / Funil / Diamante / Ondas / Fortaleza / Fogo cruzado / Chevron / Coroa / Escadaria / Portais**; R13 reinicia em Muralha; todas preservam 50 blocos.
- **Contrato de bônus:** W/S permanecem em toda rodada; o terceiro especial gira deterministicamente **P → G → C → T**.
- **C — Controle:** 4 rebatidas usam limite de steering 7 em vez de 5, preservando a magnitude da velocidade.
- **T — Tempo lento:** por 360 steps ativos, o deslocamento da bola usa fator 0,72, mantendo vx/vy e os caps de dificuldade intactos.
- **UX/lifecycle:** C destaca a raquete, T destaca a bola; HUD e instrução acessível descrevem ambos; perder vida limpa C/T; pause/victory beat/respawn continuam congelando a duração dos poderes.
- **Branch/PR:** `macro/20260906-control-tempo-formations`, PR #19.
- **Correctness Gate inicial:** GitHub Actions `34074158704` passou com **105/105 Playwright**.
- **Value Judge:** positivo — C cria agência angular e T cria recovery temporal, enquanto Chevron/Coroa/Escadaria/Portais estendem o ciclo espacial sem alterar score, vidas, combo, Elite ou 50 blocos.
- **Efeito estratégico:** o baseline de variedade passa a ser 12 formações + W/S/P/G/C/T; futuras expansões exigem nova evidência e não devem aumentar densidade de power-ups por padrão.

### Expansão de formações + poderes P/G
- **Evidência externa:** solicitação explícita do usuário em 2026-09-06 para adicionar novos poderes e novas formações, após o histórico recente também identificar periodicidade estrutural do ciclo de quatro layouts no late game.
- **Problema de produto:** o pacote anterior já havia validado variedade espacial e power-ups, mas o ciclo Muralha/Escalonada/Canal/Funil voltava a repetir após quatro rodadas e W/S cobriam apenas recovery/controle de paddle.
- **Hipótese:** dobrar o vocabulário espacial para oito formações e adicionar dois poderes mecanicamente distintos, mantendo a densidade em três blocos especiais por rodada, aumenta novidade e decisões sem inflar score, vidas, combo, velocidade ou quantidade de blocos.
- **Contrato de formações:** **Muralha / Escalonada / Canal / Funil / Diamante / Ondas / Fortaleza / Fogo cruzado**, sempre com 50 blocos; o ciclo reinicia na R9.
- **Contrato de poderes:** W e S continuam em toda rodada; um terceiro bloco alterna deterministicamente P/G. **P** concede 3 impactos perfurantes sem bounce; **G** amplia o raio da bola de 8 para 12 por 480 steps ativos sem alterar magnitude de velocidade.
- **Lifecycle/UX:** pause, victory beat e respawn continuam congelando timers/drops; perder vida limpa todos os poderes; HUD, cores, letras e instrução acessível distinguem W/S/P/G sem depender apenas de cor.
- **Branch/PR:** `macro/20260906-expanded-powers-formations`, PR #18.
- **Correctness Gate:** primeira execução revelou 3 contratos antigos acoplados à posição fixa do bloco inicial; os testes foram tornados layout-agnostic. Segundo run, GitHub Actions `34070932282`, passou com **102/102 Playwright**.
- **Value Judge:** positivo — o jogador percebe novas rotas e dois estados de bola sem release notes; o pacote preserva a economia validada e evita duplicar quatro power-ups em toda rodada ao alternar P/G.
- **Efeito estratégico:** a nova base de variedade é 8 formações + W/S/P/G. Expansões futuras precisam novamente de evidência nova e devem adicionar decisões qualitativas, não apenas mais itens.

### Identidade de fases + poderes coletáveis
- **Evidência externa:** solicitação explícita do usuário para adicionar poderes especiais e nova distribuição de blocos em cada fase.
- **Problema de produto:** a identidade de rodada ainda dependia majoritariamente de parâmetros e de apenas duas topologias tardias; faltava uma camada de surpresa/recovery que mudasse decisões durante a própria rodada.
- **Hipótese:** quatro geometrias rotativas + dois power-ups coletáveis de função clara aumentam adaptação espacial, replayability e recovery sem alterar score, vidas, combo, caps Normal/Elite ou a física central.
- **Contrato de formações:** ciclo **Muralha / Escalonada / Canal / Funil** desde R1; 50 blocos em todas as formações.
- **Contrato de poderes:** exatamente um bloco **W** e um **S** por rodada; W amplia temporariamente o paddle; S cria escudo de uma defesa; ambos exigem coleta da cápsula.
- **Lifecycle:** poderes congelam durante pausa, victory beat e preparação; morte remove poderes.
- **UX/acessibilidade:** HUD mostra Formação e Poder; Canvas referencia instrução acessível que explica W/S; blocos e drops têm diferenciação visual e letras, não dependem apenas de cor.
- **PR:** #16.
- **Correctness Gate:** suíte ampliada para **97/97 Playwright** no experimento após atualização do contrato acessível afetado.
- **Value Judge:** positivo — o jogador percebe a mudança sem release notes, as formações alteram rotas e os poderes introduzem escolhas momentâneas/recovery sem criar economia paralela ou RNG instável.
- **Efeito estratégico:** futuras expansões de conteúdo devem preferir novos contratos que mudem decisão/rota/risco de forma testável; não adicionar poderes ou layouts apenas por quantidade.

### Elite como escolha deliberada de domínio
- **Evidence Discovery:** SYSTEMIC — mastery/lives + lifecycle + dificuldade + combo/recompensa + HUD/UX.
- **Problema estratégico:** o contrato Elite anterior convertia domínio sustentado automaticamente em dificuldade maior; apesar da intenção histórica de risco/recompensa e decisão, o jogador tinha **zero escolhas** para aceitar ou rejeitar esse risco.
- **Evidências independentes:** `elite-round.js` ativava Elite automaticamente após domínio; `difficulty.js` e `combo.js` mostravam que o estado alterava apenas parâmetros (+0,5 no cap e 2,0→2,5 s de combo); o registro histórico do Macro Elite descrevia decisão/pressão como objetivo, criando discrepância falsificável entre hipótese e produto.
- **Hipótese:** domínio perfeito deve **desbloquear** Elite, não impô-lo; uma decisão explícita Normal vs Elite transforma mastery em agência sem inventar nova economia.
- **Contrato integrado:** em R6+, domínio sustentado em 5 vidas abre escolha; antes da escolha o jogo permanece no baseline Normal; “Continuar Normal” preserva cap/janela baseline; “Aceitar Elite” aplica exatamente o risco/recompensa já existente; a transição fica pausada enquanto a escolha está aberta.
- **Baseline vs experimento:** baseline qualificado = 0 decisões e Elite automático (R6 cap 8,7; combo 2,5 s); experimento = 1 decisão explícita, com Normal R6 8,2/2,0 s ou Elite 8,7/2,5 s.
- **PR:** #13.
- **Correctness Gate:** suíte ampliada de 84 para 86 testes; uma primeira tentativa apresentou diferença de um frame em teste preexistente de `respawnGrace` (44 vs 45), fora dos contratos alterados; rerun sem mudança de código passou, e a versão final da PR passou integralmente.
- **Value Judge:** aprovado — a mudança é perceptível sem release notes, cria agência real usando os mesmos números já validados e o pacote menor (somente UI ou toggle) não entregaria uma escolha causalmente íntegra.
- **Efeito estratégico:** Elite passa a ser contrato de **mastery → agência → risco/recompensa**, não promoção automática; futuras evoluções de late game devem preservar a opcionalidade e provar valor antes de adicionar novas camadas.

## Experimentos DESIGN aceitos

### Topologia alternada no late game
- **Evidence Discovery:** SYSTEMIC — progressão/ritmo + espaço jogável + mira/replayability + lifecycle de rodada.
- **Problema:** após R10, o baseline mantinha a mesma parede 5×10 enquanto paddle, velocidade inicial e caps Normal/Elite já estavam estabilizados, formando um estado mecanicamente estacionário.
- **Evidências independentes:** `createBricks()` recriava a mesma parede de 50 blocos em toda rodada; progressão de paddle/start speed já saturava em R5 e o cap Normal em R10; um probe vertical determinístico pelo centro colidia com a parede antes de alcançar fileiras profundas.
- **Hipótese:** alternar parede e corredor central em R11+ cria mudança qualitativa de rota que reutiliza a mira proporcional existente, sem inventar nova economia nem continuar inflando números.
- **Contrato:** R1–R10 permanecem com parede cheia; R11/R13/... usam corredor central; R12/R14/... retornam à parede cheia; todas as rodadas preservam exatamente 50 blocos, score, vidas, combo e dificuldade.
- **Baseline vs experimento:** no baseline, a mesma rota central encontra bloco em R10+; no experimento, o mesmo probe em R11 atravessa o corredor com 50 blocos ainda vivos e alcança `y < 100`, enquanto R10/R12 continuam forçando contato.
- **Correctness Gate:** suíte ampliada com contratos de sequência topológica, rota acessível e transição real R10→R11, além da regressão completa.
- **Value Judge:** aprovado — a mudança é visível e mecanicamente perceptível, altera o espaço de decisão em vez de apenas aparência/números e é substancialmente menor que adicionar power-ups, objetivo ou nova economia.
- **Efeito estratégico:** após saturar pressão numérica, futuras evoluções tardias devem preferir diferenciação qualitativa do espaço/decisão somente quando houver evidência; não continuar escalando velocidade por padrão.

### Beat de vitória entre rodadas
- **Evidence Discovery:** SYSTEMIC — lifecycle/flow + feedback + progressão.
- **Problema:** o último bloco, a recompensa, a reconstrução dos 50 blocos e o countdown da próxima rodada aconteciam no mesmo update, comprimindo vitória e nova tensão no mesmo intervalo.
- **Evidências independentes:** `game.js` reconstruía a rodada imediatamente; o pulso de round clear dura 520 ms; o countdown já começava nos mesmos 45 steps (~750 ms); o contrato Playwright anterior confirmava `bricksRemaining=50` e `respawnGrace=45` imediatamente após o clear.
- **Hipótese:** um estado curto e explícito de vitória antes da preparação cria payoff perceptível sem alterar economia, física ou dificuldade.
- **Branch:** `design/20260905-round-clear-victory-beat`.
- **PR:** #12.
- **Contrato:** 54 steps (~0,9 s) de `roundTransition`, tabuleiro limpo, recompensa/rodada concluída visíveis e countdown iniciado somente depois.
- **Correctness Gate:** primeira execução encontrou 3 falhas de contrato/teste; após correção dos testes afetados, CI/Playwright passou com **84/84**.
- **Value Judge:** aprovado — mudança perceptível, escopo coeso e versão menor (somente texto/pulso) não separaria os estados de produto.
- **Efeito estratégico:** round clear passa a ser um estado de lifecycle próprio; futuras melhorias de ritmo devem preservar a separação vitória → preparação.

### Progressão tardia de velocidade
- **Evidence Discovery:** progressão/dificuldade/ritmo.
- **Evidência:** a partir da rodada 5, paddle e velocidade inicial deixavam de evoluir; a bola chegava ao teto após ~11 dos 50 blocos, deixando cerca de 39 blocos por rodada no mesmo cap.
- **Hipótese:** ampliar suavemente o teto de velocidade da rodada 6 à 10 restaura progressão perceptível sem adicionar nova mecânica nem alterar o onboarding.
- **Branch:** `design/20260905-late-round-speed-curve`.
- **PR:** #3.
- **Commit experimental:** `1fd3aef9e90bcb7db626e8602d4d39c8c8f225ce`.
- **Curva:** rodadas 1–5 preservam cap 8.0; rodadas 6–10 aumentam +0,2/rodada até hard cap 9.0.
- **Integração técnica:** `difficulty.js` centraliza o cap compartilhado por colisões com blocos e edge shots.
- **Validação na PR:** GitHub Actions/Playwright run `33959492400` em **success**, incluindo `npm run test:e2e`.
- **JUDGE:** aprovado; ganho mensurável, aumento máximo limitado a 12,5%, sem nova mecânica/dependência e com rodadas 1–5 inalteradas.
- **Efeito no estado:** contador de NO-OPs zerado; projeto volta a **ACTIVE**.

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

Conclusão: não reintroduzir como MICRO. Só reconsiderar como DESIGN ou como parte causalmente necessária de MACRO com evidência nova, hipótese explícita, atualização completa dos contratos e validação da economia de score.

### Mira proporcional/contínua
Já foi tratada corretamente como DESIGN e aceita. Não continuar refinando como MICRO sem nova evidência forte de jogador ou regressão concreta.

### Mais feedback audiovisual
O jogo já possui feedback abundante. Exigir deficiência concreta antes de adicionar efeitos.

### Lifecycle/focus
Área já possui cobertura extensa. Só priorizar diante de regressão observável.

## Novo protocolo orientado a valor

Toda execução deve seguir:

1. **Baseline Gate** — CI/Playwright e regressões.
2. **Evidence Discovery** — começar por uma área focal relevante, preferindo a menos examinada recentemente, e expandir somente por caminho causal demonstrável.
3. **Evidence Gate** — a investigação encontrou problema real reproduzível/mensurável?
3.5. **Strategic Synthesis** — verificar se evidências acumuladas apontam para problema sistêmico que não deve ser fragmentado.
4. **Value Case** — benefício, comportamento esperado, alternativa simples, risco e complexidade.
5. **MICRO / DESIGN / MACRO / NO-OP**.
6. **Correctness Gate**.
7. **Value Judge**.
8. Commit somente se a mudança material merece existir.

### Política de descoberta
- A rotação detalhada de áreas e as regras de expansão causal/MACRO ficam em `GAUNTLET.md`.
- Issue #1 registra qual área foi investigada e como.
- Ausência de descoberta não altera memória condensada.
- Não adicionar telemetria apenas para alimentar o loop; primeiro explorar testes, simulações e inspeção local já disponíveis.

## Memória persistente

- `GAUNTLET_STATE.md`: memória condensada e decisões vigentes.
- `VALUE_BACKLOG.md`: problemas/hipóteses orientados por evidência.
- Issue #1: log histórico completo e permanente.
- `GAUNTLET.md`: protocolo operacional.
- `README.md`: visão do experimento.

NO-OPs saturados sem mudança material são registrados somente na issue #1.