const { test, expect } = require('@playwright/test');

test('acerto em bloco gera feedback visual curto de impacto', async ({ page }) => {
  await page.goto('/');

  const result = await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    game.start();
    game.step(45);
    game.setBall({ x: 50, y: 45, vx: 0, vy: 5 });
    game.step();

    const onHit = game.getState();
    game.step();
    const afterOneStep = game.getState();

    return { onHit, afterOneStep };
  });

  expect(result.onHit.bricksRemaining).toBe(49);
  expect(result.onHit.impactFlash).not.toBeNull();
  expect(result.onHit.impactFlash.life).toBe(8);
  expect(result.afterOneStep.impactFlash.life).toBeLessThan(result.onHit.impactFlash.life);
});