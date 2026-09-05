# Gauntlet Loop — Value-Driven Meta-Critic Protocol

Este projeto começou como um experimento de melhoria incremental de um Breakout simples por uma tarefa agendada do ChatGPT executada de hora em hora.

Após mais de 100 ciclos, o experimento entrou na fase **Meta-Critic**. A frequência operacional continua **de hora em hora**, mas a execução não existe para produzir mudanças: ela existe para decidir se há **evidência suficiente de valor** para justificar uma mudança.

Consulte também:
- [`GAUNTLET_STATE.md`](GAUNTLET_STATE.md): memória condensada, decisões vigentes, mecânicas existentes e evidências.
- [`VALUE_BACKLOG.md`](VALUE_BACKLOG.md): problemas, hipóteses e oportunidades organizados por evidência.
- Issue #1: log histórico permanente das execuções.

## Princípio central

**Todo commit deve representar ganho real de produto, correção real de regressão ou evolução material do protocolo.**

A finalidade de uma execução não é produzir commit. A pergunta principal é:

> Existe evidência suficiente para justificar um resultado de produto no qual eu investiria a principal janela de desenvolvimento da semana?

Não criar commits para:
- registrar execução;
- incrementar contador;
- trocar SHA/CI de baseline semanticamente idêntico;
- repetir análise;
- documentar NO-OP;
- demonstrar atividade.

A issue #1 é o **log de execução**.  
`GAUNTLET_STATE.md` é **memória condensada**.  
`VALUE_BACKLOG.md` é **fila de problemas e hipóteses orientada por evidência**.  
O histórico Git é reservado a **mudanças materiais**.

## GATE 1 — Saúde do baseline

Toda execução começa por:

1. Ler a branch `main`, `README.md`, `GAUNTLET.md`, `GAUNTLET_STATE.md`, `VALUE_BACKLOG.md` e a issue #1.
2. Ler comentários recentes/relevantes da issue #1.
3. Verificar GitHub Actions/CI e Playwright do HEAD.
4. Se CI estiver pendente, não alterar código: registrar a pendência e encerrar.
5. Se houver regressão causada pelo HEAD, corrigir exclusivamente essa regressão.
6. Se houver falha preexistente, flaky ou de infraestrutura, registrar a evidência e não inventar sucesso.

Somente prosseguir à Evidence Discovery com baseline saudável.

## ETAPA 2 — Evidence Discovery autônoma

Com baseline saudável, **não espere passivamente por evidência externa**. Antes do Evidence Gate, comece por uma área focal do produto por execução.

O objetivo desta etapa é **descobrir evidência**, não inventar uma melhoria.

A área focal é o ponto de partida, não uma barreira artificial. Se a investigação encontrar evidência de que o mesmo problema possui causas ou consequências em outros subsistemas, a análise pode se expandir para essas áreas relacionadas. A expansão precisa seguir um **caminho causal demonstrável** e continuar servindo a um único problema/hipótese.

Exemplo permitido: `progressão → velocidade → paddle → duração das rodadas → dificuldade percebida`.

Exemplo proibido: `progressão → acessibilidade → áudio → mobile` apenas porque todas as áreas poderiam ser melhoradas.

### Rotação de investigação

Escolha preferencialmente a área focal relevante menos investigada nos comentários recentes da issue #1. Evite repetir a mesma área focal nas 3 execuções anteriores, salvo se uma descoberta exigir confirmação. Se houver expansão causal, registre quais subsistemas adicionais foram examinados e por quê.

Áreas de investigação:

1. **core/física/game feel** — colisões, velocidade, estados impossíveis, edge shots, previsibilidade;
2. **progressão/dificuldade/ritmo** — evolução entre rodadas, largura do paddle, velocidade, duração e picos de dificuldade;
3. **controles/mobile** — teclado, touch/pointer, responsividade, landscape e diferenças entre métodos;
4. **acessibilidade/first-run UX** — entendimento inicial, estados anunciados, instruções e recuperação;
5. **lifecycle/performance** — somente procurando falha reproduzível, degradação ou custo observável;
6. **replayability/decisões** — existência de escolhas significativas e repetição mensurável do loop;
7. **arquitetura/test blind spots** — somente quando houver risco concreto de comportamento do jogador não coberto.

### Como investigar

Use os recursos já existentes antes de criar infraestrutura nova:

- ler implementação e testes relevantes;
- usar Playwright para reproduzir cenários;
- usar `window.__GAME_DEBUG__` apenas como interface de inspeção/teste;
- executar simulações determinísticas ou medições locais quando possível;
- comparar rodadas, estados, velocidades, dimensões e transições;
- procurar divergência entre comportamento documentado, testado e realmente implementado.

Pode criar código/scripts **temporários de investigação** apenas no ambiente de execução quando a ferramenta permitir, mas não commitar artefatos exploratórios. Se uma descoberta virar mudança aprovada, somente os testes/arquivos necessários ao comportamento final entram no Git.

### Qualidade mínima da evidência descoberta

Prioridade de evidência:

1. bug/regressão reproduzível;
2. comportamento mensurável que prejudica jogador ou contradiz hipótese existente;
3. discrepância verificável entre estados/rodadas/controles;
4. blind spot de teste associado a risco de produto concreto;
5. observação estática com caminho causal claro até impacto no jogador.

Não promover:
- preferência estética;
- sensação não reproduzida;
- hipótese sem medição;
- possibilidade abstrata;
- “seria legal ter”.

Se a investigação não encontrar evidência suficiente, prosseguir para NO-OP. Uma investigação sem descoberta **é uma execução válida**.

### Registro da investigação

O comentário da issue #1 deve registrar:
- área investigada;
- método;
- cenários/medições executados;
- evidência encontrada ou ausência dela;
- se a área deve ser evitada nas próximas 3 execuções por não ter produzido sinal.

A issue registra a rotação. Não atualizar `GAUNTLET_STATE.md` ou `VALUE_BACKLOG.md` apenas para registrar que uma área foi investigada sem descoberta material.

## GATE 2 — Evidência de valor

Antes de propor qualquer mudança, identificar **qual problema real** justificaria o commit.

Uma mudança só pode prosseguir quando houver pelo menos uma fonte defensável de evidência:

1. bug ou regressão reproduzível;
2. comportamento observado de jogador;
3. métrica de uso/gameplay indicando deficiência;
4. feedback explícito de jogador;
5. problema claro de acessibilidade/mobile;
6. oportunidade independente cujo ganho perceptível seja claramente alto e demonstrável;
7. dívida técnica que esteja bloqueando uma melhoria concreta de produto.

Não são evidência suficiente por si só:
- preferência estética;
- possibilidade abstrata de melhoria;
- desejo de variar o gameplay;
- “poderia ser mais polido” sem deficiência concreta;
- dívida técnica sem impacto atual;
- frequência alta de execução;
- existência de uma ideia interessante.

Se nenhuma evidência suficiente existir, o modo obrigatório é **NO-OP**.

## ETAPA 2.5 — Strategic Synthesis

Antes de escolher o modo, verifique se as evidências desta execução e das execuções recentes apontam para um problema maior que não pode ser resolvido adequadamente por uma alteração isolada.

Considere:
- padrões recorrentes encontrados em execuções anteriores;
- múltiplos sintomas com a mesma causa;
- itens do `VALUE_BACKLOG.md` que passaram a ter evidência conjunta;
- limitações arquiteturais que estejam bloqueando evolução concreta;
- progressão, ritmo ou replayability que exijam alterações coordenadas;
- discrepâncias entre mecânicas que isoladamente parecem corretas, mas juntas produzem experiência ruim.

Strategic Synthesis **não autoriza MACRO por ambição**. Ela serve para impedir que um problema sistêmico seja artificialmente reduzido até caber em um MICRO.

## GATE 3 — Value Case

Antes de codificar qualquer MICRO, DESIGN ou MACRO, responder:

- Qual é o problema real?
- Qual é a evidência?
- Quem percebe o problema?
- Qual comportamento do jogador deve mudar?
- Qual benefício esperado?
- Como o benefício será observado ou testado?
- Existe solução mais simples?
- Qual complexidade e risco serão adicionados?
- Por que este resultado merece consumir investimento de desenvolvimento agora?

Se as respostas não formarem um caso convincente, escolher **NO-OP**.

## Meta-Critic

Com baseline saudável e evidência suficiente, avaliar como jogador, game designer e engenheiro e escolher exatamente um modo: **MICRO, DESIGN, MACRO ou NO-OP**.

### MICRO

Use quando houver um problema pequeno e isolado cuja solução mínima seja:
- pequena;
- independente;
- segura;
- reversível;
- claramente perceptível ao jogador;
- ligada diretamente à evidência;
- testável sem rebalanceamento amplo.

Em estado SATURATED, MICRO exige bug/regressão real, nova evidência de jogador ou oportunidade independente de ganho claramente alto.

Fluxo:

`EVIDÊNCIA → CRITIC → IMPLEMENTER → Correctness Gate → Value Judge → main`

Implementar exatamente um comportamento de produto coerente, sem refatorações não relacionadas ou dependências novas salvo necessidade excepcional. Atualizar/adicionar Playwright quando aplicável.

### DESIGN

Use quando evidência forte apontar para uma melhoria relevante que exija:
- hipótese de produto;
- balanceamento;
- mudança transversal;
- vários contratos/testes coordenados;
- progressão, ritmo ou replayability;
- exploração que não cabe honestamente em uma microalteração.

Antes de codificar, definir:
- hipótese;
- evidência;
- benefício esperado;
- riscos;
- critérios de aceite;
- critérios de rejeição.

Criar uma branch `design/<YYYYMMDD>-<slug>` a partir da `main` verde.

Implementar um único experimento coeso. Não fragmentar DESIGN em microciclos artificiais. Atualizar Playwright e validar toda a superfície relevante.

Somente integrar na `main` se o Value Judge aprovar e a validação for suficiente.

### MACRO

Use quando a evidência apontar para um **problema ou oportunidade sistêmica** cujo valor não possa ser obtido honestamente por MICRO ou DESIGN isolado.

MACRO exige pelo menos uma destas condições:
1. problema comprovado atravessando múltiplos subsistemas;
2. conjunto de evidências acumuladas em várias execuções apontando para a mesma causa;
3. limitação estrutural bloqueando melhorias concretas;
4. oportunidade de produto de alto impacto envolvendo progressão, ritmo, replayability ou arquitetura de gameplay;
5. necessidade de várias mudanças coordenadas para produzir o benefício perceptível completo.

Não use MACRO para agrupar melhorias independentes.

Antes de implementar, produzir um **Macro Value Case** contendo:
- problema estratégico;
- evidências acumuladas;
- jogadores afetados;
- estado atual mensurado;
- estado desejado;
- hipótese central;
- subsistemas envolvidos;
- mudanças necessárias;
- mudanças explicitamente fora do escopo;
- critérios comportamentais/métricas de aceite;
- critérios de rejeição;
- riscos de regressão;
- estratégia de rollback;
- complexidade estimada;
- razão pela qual fragmentar a solução reduziria o valor.

Criar branch `macro/<YYYYMMDD>-<slug>` a partir da `main` verde.

Um MACRO pode conter múltiplos commits coesos na branch. Cada commit deve representar uma etapa material da mesma solução; commits administrativos continuam proibidos.

A atomicidade do MACRO é:

> **um problema / uma hipótese / um resultado de produto**

e não:

> um arquivo / uma feature pequena / um commit.

#### Macro Correctness Gate
Antes da integração:
- CI completo verde;
- Playwright completo verde;
- testes novos para contratos modificados;
- cenários de regressão relevantes;
- comparação explícita baseline vs experimento;
- validação dos subsistemas afetados;
- ausência de regressões relevantes fora do objetivo.

#### Macro Value Judge
Além do Value Judge geral, responder:
1. O problema sistêmico foi demonstrado?
2. Todas as mudanças contribuem para a mesma hipótese?
3. O conjunto produz mais valor que alterações isoladas?
4. Existe versão significativamente menor que entrega quase o mesmo benefício?
5. A complexidade é proporcional ao ganho?
6. O resultado melhora ou piora a capacidade de evolução futura?
7. Eu investiria a principal janela de desenvolvimento da semana neste resultado?
8. Eu preferiria manter o conjunto completo ou voltar ao baseline?

Se a resposta global não for claramente positiva, não integrar.

### NO-OP

Escolher NO-OP quando:
- não houver evidência suficiente;
- nenhuma hipótese superar claramente o baseline;
- a melhoria depender principalmente de gosto ou especulação;
- o ganho for marginal;
- a área já estiver suficientemente polida;
- custo, risco ou validação superarem o benefício provável.

NO-OP é resultado válido e desejável.

Em NO-OP:
- não alterar arquivos;
- não criar branch;
- não criar commit;
- registrar somente na issue #1.

## Regra de saturação

Após **3 NO-OPs consecutivos**, entrar em **SATURATED**.

Em SATURATED:
- parar de procurar micro-polimento apenas para gerar atividade;
- elevar o limiar de evidência;
- MICRO só diante de bug/regressão real, evidência nova de jogador ou ganho independente claramente alto;
- DESIGN só com hipótese claramente diferenciada e critérios defensáveis;
- MACRO só com evidência sistêmica, hipótese única, ganho elevado e escopo causalmente coeso;
- novos NO-OPs não atualizam `GAUNTLET_STATE.md` apenas para incrementar contador ou SHA.

O contador é zerado quando uma mudança aprovada de produto é integrada.

## VALUE_BACKLOG.md

O backlog não é uma fila de features. É uma fila de **problemas e hipóteses**.

Cada item deve conter, quando aplicável:
- problema;
- evidência;
- impacto esperado;
- jogadores afetados;
- hipótese;
- métrica/comportamento esperado;
- risco;
- tamanho;
- status: `candidate`, `validated`, `strategic`, `experiment`, `rejected`, `resolved`.

`strategic` significa que múltiplas evidências independentes apontam para o mesmo problema sistêmico. Um item `strategic` pode originar investigação MACRO, mas **não autoriza implementação automaticamente**.

Um item `candidate` sem evidência suficiente **não autoriza implementação**.

Quando evidência nova surgir, atualizar o backlog somente se isso alterar materialmente a decisão.

## Validação em dois níveis

### Correctness Gate

Prova que a mudança funciona tecnicamente:
- CI;
- Playwright;
- ausência de regressão relevante;
- contratos e estados afetados validados;
- falhas preexistentes diferenciadas de regressões novas.

Passar o Correctness Gate **não significa** que a mudança merece ser mantida.

### Value Gate / Value Judge

Prova que a mudança vale a complexidade adicionada:

1. O jogador percebe a diferença?
2. A mudança resolve o problema que originou a hipótese?
3. Existe evidência suficiente de que o problema importava?
4. O ganho é maior que a complexidade adicionada?
5. A implementação evita dívida desnecessária?
6. Os testes validam comportamento relevante, não apenas implementação?
7. Uma solução menor produziria resultado equivalente?
8. Eu investiria a principal janela de desenvolvimento da semana neste resultado?

Se a resposta global não for claramente positiva, reverter/rejeitar e não integrar na `main`.

## Evidência externa de jogador

O próximo salto de qualidade deve preferencialmente vir de informação externa ao próprio loop:

`jogador → evidência → hipótese → mudança → teste → avaliação`

Métricas candidatas, quando houver mecanismo apropriado de coleta:
- duração de sessão;
- rodada máxima atingida;
- mortes por rodada;
- reinícios;
- abandono antes da primeira rodada;
- uso da mira proporcional;
- teclado vs pointer/touch;
- mortes logo após lançamento;
- sessões que chegam às rodadas 3, 5 e 10.

**Não adicionar telemetria invasiva ou infraestrutura de analytics apenas para gerar dados.** Instrumentação deve ser tratada como DESIGN quando houver forma proporcional, privacidade adequada e utilidade clara.

## Prioridades

Salvo regressão, bug grave ou problema crítico de acessibilidade/mobile:

1. game feel quando houver lacuna concreta;
2. profundidade, progressão, ritmo e replayability;
3. controles e UX/mobile;
4. acessibilidade;
5. robustez técnica/lifecycle.

O histórico já contém muito feedback audiovisual e muitos edge cases de lifecycle. Não repetir essas áreas sem evidência de necessidade.

## Restrições vigentes

- Preservar HTML/CSS/JavaScript + Canvas 2D.
- Não adicionar dependências sem justificativa excepcional.
- Não deixar `main` deliberadamente quebrada.
- Não fazer refatorações não relacionadas ou puramente estéticas.
- `window.__GAME_DEBUG__` é principalmente interface de testes; não expandi-la como event bus/API de produção por conveniência.
- Pontuação diferenciada por fileira não volta como MICRO; só pode ser reconsiderada como DESIGN ou como parte causalmente necessária de MACRO com evidência, hipótese e contratos completos.
- Mira proporcional/contínua não recebe refinamentos adicionais sem nova evidência forte.
- Novas camadas audiovisuais e novos edge cases de lifecycle exigem deficiência concreta.

## Registro final na issue #1

Ao fim de cada execução, comentar:
- execução Meta-Critic;
- modo: MICRO, DESIGN, MACRO ou NO-OP;
- HEAD;
- estado do CI/Playwright;
- evidência encontrada;
- problema;
- alternativas consideradas;
- Value Case;
- hipótese;
- solução/experimento;
- arquivos alterados;
- branch e SHA quando aplicável;
- validações;
- decisão do Value Judge;
- ganho esperado ao jogador;
- complexidade adicionada;
- motivo pelo qual o commit merece existir;
- contador de NO-OPs;
- se houve mudança material que justifique atualizar `GAUNTLET_STATE.md` ou `VALUE_BACKLOG.md`.

A issue #1 permanece aberta permanentemente.

## Regra de não fragmentação

Não divida artificialmente uma solução coerente apenas para obedecer à ideia de “uma melhoria pequena por execução”.

Se A só produz valor junto com B, B exige atualização de C e C precisa de testes D, então A+B+C+D podem constituir uma única intervenção DESIGN ou MACRO quando servem à mesma hipótese.

Também não faça o inverso: não agrupe problemas independentes para tornar a execução artificialmente maior.

A regra de atomicidade é:

> **um problema / uma hipótese / um resultado de produto**

A escala da solução deve ser consequência da escala do problema encontrado.

## Frequência

O Meta-Critic roda **de hora em hora**.

Frequência mede quantas vezes o projeto é avaliado e investigado.  
Ela **não determina quantas vezes o projeto deve mudar**. Cada execução saudável deve começar por uma investigação focal, podendo expandir causalmente quando necessário, e pode legitimamente terminar em NO-OP.

Se não houver evidência suficiente para justificar valor real, **não fazer commit**.
