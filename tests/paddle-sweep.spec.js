const { test, expect } = require('@playwright/test');

test('raspada diagonal continua válida em frame normalizado longo', async ({ page }) => {
  await page.goto('/');

  const result = await page.evaluate(() => {
    const { paddle, ball } = window.__GAME_DEBUG__.getState();
    const paddleRight = paddle.x + paddle.w;

    window.__GAME_DEBUG__.setBall({
      x: paddleRight - 3,
      y: paddle.y - ball.r - 1,
      vx: 8.4,
      vy: 3.2
    });
    window.__GAME_DEBUG__.step(2);

    return {
      paddleRight,
      ball: window.__GAME_DEBUG__.getState().ball
    };
  });

  expect(result.ball.vy).toBeLessThan(0);
  expect(result.ball.y).toBeLessThan(562);
  expect(result.ball.x).toBeLessThanOrEqual(result.paddleRight + 8);
});
