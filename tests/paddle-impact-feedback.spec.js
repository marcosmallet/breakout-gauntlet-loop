const { test, expect } = require('@playwright/test');

test('rebatida na raquete gera feedback visual curto de contato', async ({ page }) => {
  await page.goto('/');

  const result = await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    game.start();
    game.step(45);

    const before = game.getState();
    game.setBall({
      x: before.paddle.x + before.paddle.w / 2,
      y: before.paddle.y - before.ball.r - 2,
      vx: 2,
      vy: 5
    });
    game.step();

    const onBounce = game.getState();
    game.step();
    const afterOneStep = game.getState();

    return { onBounce, afterOneStep };
  });

  expect(result.onBounce.ball.vy).toBeLessThan(0);
  expect(result.onBounce.paddleFlash).toBe(6);
  expect(result.afterOneStep.paddleFlash).toBeLessThan(result.onBounce.paddleFlash);
});
