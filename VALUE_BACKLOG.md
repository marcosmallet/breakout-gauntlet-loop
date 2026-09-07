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

### Elite automático sem decisão explícita
- **Problema:** domínio sustentado em 5 vidas promovia automaticamente a rodada seguinte para Elite, convertendo mastery em dificuldade maior sem permitir ao jogador aceitar ou rejeitar o risco.
- **Evidência:** `elite-round.js` ativava Elite automaticamente em R6+; `difficulty.js` e `combo.js` mostravam consequências puramente paramétricas (+0,5 no teto de velocidade e janela 2,0→2,5 s); o histórico do próprio Macro Elite descrevia decisão/pressão e risco/recompensa como objetivo.
- **Impacto:** jogadores que chegam ao late game com domínio suficiente para manter 5 vidas.
- **Hipótese testada:** transformar a promoção automática em desbloqueio com escolha explícita Normal vs Elite cria agência real sem adicionar nova economia ou alterar os números já validados.
- **Baseline vs experimento:** baseline qualificado = 0 escolhas e Elite automático (R6 8,7 / 2,5 s); experimento = 1 decisão explícita, mantendo Normal em 8,2 / 2,0 s ou aceitando Elite em 8,7 / 2,5 s.
- **Validação:** PR #13; suíte ampliada para 86 testes; primeira tentativa teve um miss de um frame em teste preexistente de lifecycle e o rerun sem alteração passou; versão final da PR ficou verde.
- **Risco:** a decisão atravessa mastery, lifecycle, dificuldade, combo e HUD; mitigado por reutilizar o balanceamento Elite existente, pausar a transição durante a escolha e manter early game inalterado.
- **Tamanho:** MACRO.
- **Status:** `resolved`.

### Escolha Elite repetida durante domínio contínuo
- **Problema:** depois de transformar Elite em decisão explícita, o mesmo modal bloqueante era reaberto ao fim de toda rodada elegível perfeita, mesmo quando o jogador acabara de escolher sob os mesmos termos.
- **Evidência:** `elite-round.js` recalculava elegibilidade e chamava `openChoice()` em cada avanço de rodada com 5 vidas; a escolha pausa a transição até input; após R10 os caps Normal/Elite já estão estabilizados, tornando a repetição da mesma decisão ainda menos informativa.
- **Impacto:** jogadores de maior domínio, exatamente durante streaks longos em que o flow entre rodadas é mais valioso.
- **Hipótese testada:** tratar Normal/Elite como compromisso do streak de domínio preserva agência com menos interrupção e dá consequência temporal à escolha; perder uma vida encerra o compromisso e voltar a demonstrar domínio reabre a decisão.
- **Baseline vs experimento:** baseline = uma escolha bloqueante por rodada perfeita elegível; experimento = uma escolha bloqueante por streak perfeito, persistindo Normal ou Elite enquanto 5 vidas são mantidas e reabrindo somente após falha + novo domínio.
- **Validação:** PR #14; suíte ampliada de 86 para 89 testes, cobrindo persistência Elite, persistência Normal, quebra de streak e requalificação; Playwright **89/89**.
- **Risco:** o jogador pode esquecer a escolha em streaks longos; mitigado pelo HUD persistente `Modo: Normal/Elite` e por copy explícita no momento da decisão.
- **Tamanho:** DESIGN com lente SYSTEMIC.
- **Status:** `resolved`.

### Compressão do payoff de fim de rodada
- **Problema:** vitória, recompensa e preparação da rodada seguinte eram simultâneas, reduzindo a legibilidade do payoff.
- **Evidência:** no mesmo update do último bloco, o baseline concedia bônus/vida, incrementava rodada, recriava 50 blocos e ativava 45 steps de preparação; o pulso de vitória de 520 ms ocorria sobreposto ao countdown.
- **Impacto:** toda conclusão de rodada, especialmente para jogadores que alcançam várias rodadas consecutivas.
- **Hipótese testada:** separar um beat de vitória de 54 steps antes de reconstruir o tabuleiro torna o ciclo clear → reward → prepare mais legível sem mexer em score, vidas, velocidade ou física.
- **Baseline vs experimento:** baseline = `50 blocos + respawnGrace 45` imediatamente após clear; experimento = `0 blocos + roundTransition 54 + countdown 0`, seguido de `50 blocos + respawnGrace 45`.
- **Validação:** PR #12; após correção de contratos afetados, **84/84 Playwright**.
- **Risco:** pequena extensão do tempo entre rodadas; mitigada por duração curta (~0,9 s), pausa/lifecycle preservados e rollback simples.
- **Tamanho:** DESIGN.
- **Status:** `resolved`.

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

### Plateau de topologia após a rodada 10

- **Problema:** depois de R10, o espaço jogável entrava em estado estacionário: mesma parede 5×10/50 blocos enquanto paddle, velocidade inicial e caps Normal/Elite já estavam estabilizados.
- **Evidências:** `createBricks()` reconstruía a mesma parede em todas as rodadas; paddle e velocidade inicial já saturavam em R5; cap Normal estabilizava em R10 e Elite apenas deslocava esse cap em +0,5. Uma trajetória vertical pelo centro atingia a parede do baseline antes de acessar fileiras profundas.
- **Impacto esperado:** devolver novidade mecânica e uma decisão de rota legível ao late game sem criar nova economia, power-up ou escalada numérica.
- **Jogadores afetados:** jogadores que chegam a R11+.
- **Hipótese testada:** alternar a parede cheia com um corredor central em R11/R13/... muda a ordem de acesso aos blocos e torna a mira existente relevante para escolher uma rota, mantendo exatamente 50 blocos, score, vidas, combo e dificuldade.
- **Baseline vs experimento:** baseline R10+ = uma única topologia estacionária; experimento = R11/R13/... com corredor central e R12/R14/... com parede cheia, sempre 50 blocos. Em probe determinístico pelo centro, R10/R12 removem bloco antes da passagem; R11 mantém 50 blocos enquanto a bola alcança `y < 100`, provando rota qualitativamente distinta.
- **Risco:** duas topologias ainda são variedade limitada e o corredor pode alterar duração de rodada; mitigado por preservar quantidade/valor de blocos, alternar com a parede original e não tocar física/economia.
- **Tamanho:** DESIGN com lente SYSTEMIC.
- **Status:** `resolved` após Correctness Gate e Value Judge positivos.

### Identidade de fases e poderes especiais

- **Problema:** a variedade espacial ainda aparecia principalmente no late game e não existia uma camada de poderes coletáveis capaz de alterar recovery/decisão durante a rodada.
- **Evidência:** solicitação explícita do usuário para poderes especiais e nova distribuição em cada fase, somada ao histórico já validado de diminishing novelty/topologia como fonte de progressão qualitativa.
- **Impacto esperado:** maior identidade entre rodadas, adaptação espacial desde o início e momentos de risco/recompensa durante a limpeza dos blocos.
- **Jogadores afetados:** todos os jogadores, não apenas quem alcança R11+.
- **Hipótese testada:** alternar quatro formações com 50 blocos e adicionar W/S coletáveis cria variedade perceptível sem alterar economia, física, Elite ou combo.
- **Baseline vs experimento:** baseline = parede até R10 e alternância parede/canal em R11+ sem poderes; experimento = Muralha/Escalonada/Canal/Funil em ciclo desde R1 + um W e um S por rodada.
- **Validação:** PR #16; suíte ampliada para **97/97 Playwright**, cobrindo geometrias, lifecycle, blocos especiais, drop, coleta, expiração, escudo e reset por perda de vida.
- **Risco:** complexidade transversal e possibilidade de poderes dominantes; mitigado por apenas dois efeitos simples, determinísticos, temporários e sem mudança de score.
- **Tamanho:** MACRO.
- **Status:** `resolved`.

### Expansão do vocabulário de fases e poderes

- **Problema:** após a primeira expansão, o ciclo espacial repetia a cada quatro rodadas e o conjunto de poderes permanecia limitado a W/S.
- **Evidência:** solicitação explícita do usuário para adicionar novos poderes e novas formações; histórico interno recente também demonstrou periodicidade do late game após o ciclo de quatro layouts.
- **Impacto esperado:** mais novidade espacial e mais decisões momentâneas sem escalar números centrais.
- **Jogadores afetados:** todos; as novas formações entram em R5–R8 e P/G aparecem desde as primeiras rodadas alternadas.
- **Hipótese testada:** oito formações + W/S fixos + um terceiro power-up alternando P/G entregam variedade perceptível com complexidade controlada.
- **Baseline vs experimento:** baseline = 4 formações + 2 especiais por rodada (W/S); experimento = 8 formações + 3 especiais por rodada, preservando W/S e alternando P/G.
- **Contrato P:** 3 impactos em blocos sem ricochetear, consumidos por hit.
- **Contrato G:** raio da bola 8→12 por 480 steps ativos, sem alterar velocidade.
- **Validação:** PR #18; após corrigir 3 testes antigos acoplados à geometria fixa, CI `34070932282` passou com **102/102 Playwright**.
- **Risco:** maior densidade de conteúdo poderia dominar o loop; mitigado por adicionar somente um terceiro especial por rodada e alternar P/G, mantendo score, vidas, combo, Elite, caps e 50 blocos.
- **Tamanho:** MACRO.
- **Status:** `resolved`.

### Segunda expansão do vocabulário de fases e poderes

- **Problema:** o baseline de 8 formações reiniciava em R9 e o bônus alternado P/G não cobria diretamente controle de trajetória nem desaceleração temporária.
- **Evidência:** nova solicitação explícita do usuário para adicionar mais poderes e novas formações.
- **Impacto esperado:** maior variedade espacial e mais opções de recuperação/controle sem escalar score, vidas ou dificuldade nominal.
- **Jogadores afetados:** todos; C/T entram no mesmo slot de bônus e as novas formações aparecem em R9–R12.
- **Hipótese testada:** 12 formações + rotação P/G/C/T com W/S fixos entrega variedade adicional mantendo apenas 3 especiais por rodada.
- **Baseline vs experimento:** 8 → 12 formações; bônus P/G → P/G/C/T; 50 blocos e 3 especiais permanecem constantes.
- **Contrato C:** 4 rebatidas com steering máximo 7 em vez de 5, sem mudar a magnitude da velocidade.
- **Contrato T:** deslocamento da bola em fator 0,72 por 360 steps ativos, sem modificar vx/vy.
- **Validação inicial:** PR #19, CI `34074158704`, **105/105 Playwright**.
- **Risco:** C poderia trivializar mira e T reduzir pressão excessivamente; mitigado por duração limitada, rotação de um único bônus por rodada e preservação integral dos caps/score/combo.
- **Tamanho:** MACRO.
- **Status:** `resolved`.

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