# Breakout — ChatGPT Gauntlet Loop Experiment

Um jogo Breakout em **HTML, CSS e JavaScript + Canvas 2D** usado para estudar evolução autônoma de produto por ciclos de crítica, implementação e validação.

## O experimento

O projeto começou com uma tarefa agendada do ChatGPT executada **de hora em hora**, sempre procurando uma única melhoria pequena.

Esse modelo melhorou rapidamente o baseline, mas o histórico mostrou diminishing returns. Depois de mais de 100 ciclos, o experimento evoluiu para **Meta-Critic orientado a valor**: cada execução pergunta primeiro se existe evidência suficiente para justificar um commit.

```text
ChatGPT Scheduled Task — hourly
             ↓
       BASELINE GATE
       CI / Playwright
             ↓
       EVIDENCE GATE
             ↓
        VALUE CASE
       ↙     ↓      ↘
    MICRO  DESIGN   NO-OP
      ↓      ↓        ↓
 Correctness Gate   preserve
      ↓      ↓       baseline
       VALUE JUDGE
             ↓
    commit only if valuable
```

Após **3 NO-OPs consecutivos**, o projeto entra em **SATURATED**. Nesse estado, o agente deixa de procurar micro-polimento repetitivo e só sai de NO-OP diante de regressão/bug real, nova evidência de jogador ou hipótese DESIGN claramente superior.

## Estado, evidência e memória

- [`GAUNTLET.md`](GAUNTLET.md): protocolo operacional e Value Gates.
- [`GAUNTLET_STATE.md`](GAUNTLET_STATE.md): memória condensada, mecânicas, decisões e estado de saturação.
- [`VALUE_BACKLOG.md`](VALUE_BACKLOG.md): problemas e hipóteses organizados por evidência; não é uma fila de features.
- Issue #1 — **Gauntlet Loop — Continuous Quality Backlog**: log histórico permanente das execuções.

A separação é intencional:

- **Issue #1** = log temporal.
- **GAUNTLET_STATE.md** = memória condensada.
- **VALUE_BACKLOG.md** = oportunidades/evidências.
- **Git history** = mudanças materiais.

## Estado inicial

O baseline original era intencionalmente básico:

- Canvas 2D
- bola
- raquete
- 50 blocos
- pontuação
- 3 vidas
- controles por teclado
- sem framework de jogo
- sem progressão ou camada audiovisual relevante

Esse baseline simples permite observar a evolução pelo histórico do Git.

## Validação automática

O repositório usa Playwright e GitHub Actions.

O jogo expõe uma interface de depuração:

```js
window.__GAME_DEBUG__
```

Ela permite testes determinísticos sem depender apenas de screenshots. No protocolo atual, deve permanecer principalmente interface de teste e não se tornar event bus/API de produção por conveniência.

A validação é separada em dois níveis:

1. **Correctness Gate** — prova que a mudança funciona e não introduz regressão.
2. **Value Judge** — decide se o ganho perceptível justifica a complexidade.

CI verde, sozinho, não torna um commit valioso.

## Evidência de jogador

O próximo salto de qualidade deve preferencialmente vir de:

```text
jogador → evidência → hipótese → mudança → teste → avaliação
```

O protocolo considera métricas como duração de sessão, rodada máxima, mortes por rodada, reinícios, abandono precoce, uso da mira proporcional e método de controle. Isso **não autoriza telemetria automática**: qualquer instrumentação deve ter caso de valor, privacidade e complexidade proporcionais.

## Rodando localmente

```bash
npm install
npx playwright install chromium
npm run serve
```

Abra `http://localhost:4173`.

Para executar os testes:

```bash
npm run test:e2e
```

## Hipótese original

> Um jogo pequeno e funcional pode atingir um nível de polimento significativamente maior quando uma IA executa ciclos frequentes de crítica, implementação e validação, desde que cada ciclo seja limitado, mensurável e reversível.

## Hipótese atual

> Depois que microincrementos entram em diminishing returns, um agente que exige evidência e Value Case antes de modificar o produto pode continuar aumentando qualidade sem confundir frequência de avaliação com frequência de commit.

## Stack

- HTML5
- CSS
- JavaScript
- Canvas 2D
- Playwright
- GitHub Actions
- ChatGPT Scheduled Tasks

## Frequência atual

**1 avaliação Meta-Critic por hora.**

A frequência aumenta o número de avaliações independentes. Ela não cria obrigação de mudança.

> Se não houver evidência suficiente para justificar valor real, não há commit.
