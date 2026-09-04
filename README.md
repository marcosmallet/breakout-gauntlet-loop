# Breakout — ChatGPT Gauntlet Loop Experiment

Um jogo Breakout em **HTML, CSS e JavaScript + Canvas 2D** usado para estudar evolução autônoma de produto por ciclos de crítica, implementação e validação.

## O experimento

O projeto começou com uma tarefa agendada do ChatGPT executada **de hora em hora**, sempre procurando uma única melhoria pequena.

Esse modelo melhorou rapidamente o baseline, mas o histórico mostrou diminishing returns: depois de mais de 100 ciclos, as oportunidades pequenas passaram a ser raras e vários ciclos corretamente terminaram em no-op.

O experimento agora entrou na fase **Meta-Critic**.

```text
ChatGPT Scheduled Task — every 12h
             ↓
          CI gate
             ↓
        META-CRITIC
       ↙     ↓      ↘
    MICRO  DESIGN   NO-OP
      ↓      ↓        ↓
  1 small  branch   preserve
  change   experiment baseline
      ↓      ↓
 Playwright / CI
       ↓
      JUDGE
       ↓
 update GAUNTLET_STATE.md + issue #1
```

Após **3 no-ops consecutivos**, o projeto entra em estado **SATURATED**: o agente deixa de procurar micro-polimento repetitivo e faz uma análise de produto mais ampla. Melhorias de médio porte passam a ser tratadas como **Design Experiments em branch**, com hipótese e critérios de aceite, em vez de serem artificialmente quebradas em microcommits.

## Estado e memória

- [`GAUNTLET.md`](GAUNTLET.md): protocolo operacional.
- [`GAUNTLET_STATE.md`](GAUNTLET_STATE.md): estado condensado, mecânicas existentes, decisões e experimentos rejeitados.
- Issue #1 — **Gauntlet Loop — Continuous Quality Backlog**: memória histórica completa dos ciclos.

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

Ela permite testes determinísticos sem depender apenas de screenshots. No protocolo atual, deve ser tratada principalmente como interface de teste e não como event bus de produção.

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

## Hipótese da fase Meta-Critic

> Depois que microincrementos entram em diminishing returns, um agente que sabe alternar entre MICRO, DESIGN e NO-OP pode continuar aumentando qualidade com melhor relação ganho/complexidade do que um loop que tenta produzir uma alteração em toda execução.

## Stack

- HTML5
- CSS
- JavaScript
- Canvas 2D
- Playwright
- GitHub Actions
- ChatGPT Scheduled Tasks

## Frequência atual

**1 execução Meta-Critic a cada 12 horas.**
