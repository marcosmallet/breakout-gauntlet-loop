const { test, expect } = require('@playwright/test');

test('fim de jogo resume a run e aplica feedback visual exatamente uma vez', async ({ page }) => {
  await page.goto('/');

  const finalState = await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    game.start();
    game.step(45);

    for (let remainingLives = 2; remainingLives >= 0; remainingLives -= 1) {
      game.setBall({ x: 400, y: 540, vx: 0, vy: 5 });
      game.step();
      if (remainingLives > 0) game.step(45);
    }

    return game.getState();
  });

  await expect(page.locator('#gameStatus')).toHaveText(
    `Fim de jogo. ${finalState.score} pontos • Rodada ${finalState.round}.`
  );
  await expect(page.locator('#game')).toHaveClass(/game-over-feedback/);
  await expect.poll(() => page.evaluate(() => window.__GAME_OVER_FEEDBACK_DEBUG__.getTriggerCount())).toBe(1);
});

test('reiniciar remove o estado visual e o resumo da run anterior', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    game.start();
    game.step(45);

    for (let remainingLives = 2; remainingLives >= 0; remainingLives -= 1) {
      game.setBall({ x: 400, y: 540, vx: 0, vy: 5 });
      game.step();
      if (remainingLives > 0) game.step(45);
    }

    game.start();
  });

  await expect(page.locator('#game')).not.toHaveClass(/game-over-feedback/);
  await expect(page.locator('#lives')).toHaveText('3');
  await expect(page.locator('#gameStatus')).toHaveText('Prepare-se...');
});
