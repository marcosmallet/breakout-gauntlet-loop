# Gauntlet Loop

Este projeto é um experimento de melhoria incremental de um jogo simples usando uma tarefa agendada do ChatGPT executada **de hora em hora**.

## Objetivo

Observar até onde um jogo Breakout propositalmente simples pode evoluir por ciclos sucessivos de crítica, implementação e validação.

## Ciclo de cada execução

1. Ler o estado atual da branch `main`.
2. Verificar o resultado mais recente do CI.
3. Analisar o jogo como jogador, game designer e engenheiro.
4. Identificar a melhoria de maior impacto que seja pequena e segura.
5. Implementar **exatamente uma** melhoria.
6. Atualizar ou adicionar testes quando aplicável.
7. Validar com Playwright/GitHub Actions.
8. Registrar o que mudou e o que deve ser considerado nos próximos ciclos.

## Regras

- Uma melhoria por execução.
- Priorizar bugs, gameplay e game feel antes de novas funcionalidades.
- Evitar reescritas arquiteturais sem necessidade.
- Não adicionar dependências sem justificativa forte.
- Não deixar a `main` deliberadamente quebrada.
- Se o CI falhar por causa da última mudança, a próxima execução deve priorizar a regressão.
- Preservar o escopo: HTML, CSS e JavaScript, com Canvas 2D.

## Papel do Playwright

O Playwright fornece evidências objetivas de regressões funcionais. O jogo expõe `window.__GAME_DEBUG__` para permitir inspeção controlada do estado durante os testes.
