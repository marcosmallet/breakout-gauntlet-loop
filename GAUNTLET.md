# Gauntlet Loop — Meta-Critic Protocol

Este projeto começou como um experimento de melhoria incremental de um Breakout simples por uma tarefa agendada do ChatGPT executada de hora em hora.

Após mais de 100 ciclos, o experimento entrou em uma nova fase: **Meta-Critic**. A frequência operacional volta a ser **de hora em hora** e o objetivo deixa de ser produzir um microincremento sempre que possível; passa a ser escolher o modo de trabalho com melhor retorno marginal.

Consulte também [`GAUNTLET_STATE.md`](GAUNTLET_STATE.md), que contém o estado condensado, decisões vigentes, mecânicas existentes e experimentos rejeitados/revertidos.

## Objetivo

Observar até onde um jogo Breakout propositalmente simples pode evoluir por crítica, implementação e validação autônomas sem confundir atividade com ganho real de qualidade.

## Gate obrigatório

Toda execução começa por:

1. Ler a branch `main`, `README.md`, este arquivo, `GAUNTLET_STATE.md` e a issue #1.
2. Ler comentários recentes/relevantes da issue #1.
3. Verificar GitHub Actions/CI e Playwright do HEAD.
4. Se o CI estiver pendente, não alterar código: registrar a pendência e encerrar.
5. Se o CI falhar por causa da alteração mais recente, corrigir exclusivamente essa regressão antes de qualquer outra iniciativa.

## Meta-Critic

Com o baseline saudável, avaliar o produto amplamente como jogador, game designer e engenheiro. Não procurar apenas o próximo patch local.

Classificar a melhor oportunidade em exatamente uma destas categorias:

### MICRO
Use quando existir uma melhoria que seja simultaneamente:
- pequena;
- independente;
- segura;
- reversível;
- claramente perceptível ao jogador;
- testável sem rebalanceamento amplo.

Nesse caso, executar o Micro Gauntlet:
CRITIC → IMPLEMENTER → Playwright/CI → JUDGE → commit em `main` se aprovado.

### DESIGN
Use quando o ganho potencial for relevante, mas exigir:
- balanceamento;
- mudança transversal;
- hipótese de produto;
- alteração coordenada de vários contratos/testes;
- ou exploração que não cabe honestamente em uma única microalteração.

Nesse caso:
1. Definir hipótese, benefício esperado, riscos e critérios de aceite.
2. Criar uma branch `design/<data>-<slug>` a partir da `main` verde.
3. Implementar o experimento de forma coesa na branch.
4. Atualizar/adicionar testes Playwright e validar o conjunto relevante.
5. Atuar como JUDGE.
6. Se a hipótese for aprovada e a branch estiver suficientemente validada, integrar na `main`.
7. Se a hipótese falhar ou o custo superar o benefício, não integrar; registrar o descarte como evidência.

Uma execução DESIGN continua sendo **um único experimento**, embora possa exigir vários arquivos ou commits coordenados na branch.

### NO-OP
Use quando nenhuma oportunidade superar claramente o custo/risco.

Não criar código, efeitos, edge cases ou refatorações apenas para produzir atividade. Registrar a conclusão e preservar o baseline.

## Regra dos três no-ops

Após **3 no-ops consecutivos**:

- entrar em estado **SATURATED**;
- parar de procurar micro-polimento repetitivo;
- executar uma análise ampla de produto no próximo Meta-Critic;
- só voltar a MICRO diante de bug/regressão real, evidência nova de jogador ou oportunidade independente de ganho claramente alto;
- considerar DESIGN quando a próxima melhoria valiosa for grande demais para um microincremento.

O contador é zerado quando uma mudança aprovada é integrada à `main`.

## Prioridades

Salvo regressão, bug grave ou problema crítico de acessibilidade/mobile:

1. game feel e feedback audiovisual **quando houver lacuna concreta**;
2. profundidade, progressão, ritmo e replayability;
3. controles e UX/mobile;
4. acessibilidade;
5. robustez técnica/lifecycle.

O histórico já contém muito feedback audiovisual e muitos edge cases de lifecycle. Não repetir essas áreas sem evidência de necessidade.

## JUDGE

Antes de manter qualquer mudança, responder:

- o jogador percebe a melhoria?
- o ganho é maior que a complexidade adicionada?
- a mudança cria ou agrava acoplamento?
- a hipótese original foi realmente atendida?
- os testes validam o comportamento relevante?
- existe alternativa mais simples?

Se a resposta global for negativa, reverter/descartar.

## Regras gerais

- Preservar HTML/CSS/JavaScript + Canvas 2D.
- Não adicionar dependências sem justificativa excepcional.
- Não deixar `main` deliberadamente quebrada.
- Não fazer refatorações não relacionadas.
- Usar Playwright/GitHub Actions como evidência objetiva.
- Não reintroduzir uma ideia revertida como MICRO sem considerar a evidência da reversão.
- `window.__GAME_DEBUG__` é principalmente uma interface de testes; não expandi-la como arquitetura de produção por conveniência.

## Registro

Ao fim de cada execução, comentar na issue #1:

- modo escolhido: MICRO, DESIGN ou NO-OP;
- estado do gate/CI;
- alternativas consideradas;
- motivo da decisão;
- hipótese/problema;
- solução ou experimento;
- arquivos/branch/commits quando aplicável;
- validações;
- decisão do JUDGE;
- contador de no-ops;
- atualização necessária em `GAUNTLET_STATE.md`.

## Frequência e agressividade

O Meta-Critic roda **de hora em hora**. Essa frequência aumenta a quantidade de avaliações independentes, mas não autoriza mudanças mais agressivas. Em estado SATURATED, várias execuções consecutivas podem terminar legitimamente em NO-OP. Frequência alta e propensão a commit são controles separados.

A issue #1 deve permanecer aberta como memória histórica do experimento.
