const { test, expect } = require('@playwright/test');

test('bola já abaixo do topo da raquete não ganha rebatida fantasma', async ({ page }) => {
  await page.goto('/');

  const result = await page.evaluate(() => {
    const { paddle, ball } = window.__GAME_DEBUG__.getState();
    window.__GAME_DEBUG__.setBall({
      x: paddle.x + paddle.w / 2,
      y: paddle.y + ball.r,
      vx: 1,
      vy: 2
    });
    window.__GAME_DEBUG__.step();
    return window.__GAME_DEBUG__.getState().ball;
  });

  expect(result.vy).toBeGreaterThan(0);
});
