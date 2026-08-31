# Breakout — ChatGPT Gauntlet Loop Experiment

Um jogo Breakout simples em **HTML, CSS e JavaScript**, criado como ponto de partida para um experimento de evolução autônoma por meio de um **Gauntlet Loop**.

## O experimento

A proposta deste repositório é observar como um jogo deliberadamente simples pode evoluir por pequenas melhorias sucessivas realizadas por uma **tarefa agendada do ChatGPT executada de hora em hora**.

A cada ciclo, o ChatGPT deve analisar o estado atual do jogo, identificar o problema ou oportunidade de maior impacto, implementar somente uma melhoria, validar a alteração e usar o resultado como ponto de partida para o próximo ciclo.

```text
ChatGPT Scheduled Task — hourly
        ↓
      CRITIC
        ↓
choose 1 improvement
        ↓
   IMPLEMENTER
        ↓
      commit
        ↓
 GitHub Actions
        ↓
   Playwright
        ↓
      JUDGE
   ↙         ↘
 PASS        FAIL
  ↓            ↓
next cycle   fix regression
```

O objetivo não é construir o melhor Breakout possível em uma única execução. O objetivo é medir quanto de qualidade pode emergir de **muitos ciclos pequenos, objetivos e verificáveis**.

## Estado inicial

A versão inicial é intencionalmente básica:

- Canvas 2D
- bola
- raquete
- 50 blocos
- pontuação
- 3 vidas
- controles por teclado (`←`, `→`, `A`, `D`)
- sem framework de jogo
- sem sistema complexo de partículas, áudio, power-ups ou progressão

Esse baseline simples torna a evolução do Gauntlet observável ao longo do histórico de commits.

## Validação automática

O repositório inclui Playwright e GitHub Actions. O jogo também expõe uma interface mínima de depuração em:

```js
window.__GAME_DEBUG__
```

Isso permite que os testes inspecionem estado do jogo sem depender apenas de screenshots.

## Rodando localmente

```bash
npm install
npx playwright install chromium
npm run serve
```

Abra `http://localhost:4173`.

Para os testes:

```bash
npm run test:e2e
```

## Princípios do Gauntlet

Consulte [`GAUNTLET.md`](GAUNTLET.md) para as regras do ciclo autônomo.

## Hipótese

> Um jogo pequeno e funcional pode atingir um nível de polimento significativamente maior quando uma IA executa ciclos frequentes de crítica, implementação e validação, desde que cada ciclo seja limitado, mensurável e reversível.

## Stack

- HTML5
- CSS
- JavaScript
- Canvas 2D
- Playwright
- GitHub Actions
- ChatGPT Scheduled Tasks

## Frequência do experimento

**1 ciclo por hora.**
