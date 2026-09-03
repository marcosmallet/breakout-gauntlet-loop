const { test, expect } = require('@playwright/test');

test('rebatida perto da borda da raquete recebe pequeno boost de velocidade', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  const initialSpeed = await page.evaluate(() => {
    while (window.__GAME_DEBUG__.getState().respawnGrace > 0) {
      window.__GAME_DEBUG__.step();
    }

    const state = window.__GAME_DEBUG__.getState();
    const x = state.paddle.x + state.paddle.w * 0.9;
    window.__GAME_DEBUG__.setBall({
      x,
      y: state.paddle.y - state.ball.r - 1,
      vx: 2,
      vy: 4
    });
    window.__GAME_DEBUG__.step();
    return Math.hypot(2, 4);
  });

  await page.waitForFunction(() => window.__EDGE_SHOT_BOOST_DEBUG__.getBoostCount() === 1);

  const result = await page.evaluate(() => {
    const state = window.__GAME_DEBUG__.getState();
    return {
      speed: Math.hypot(state.ball.vx, state.ball.vy),
      vy: state.ball.vy,
      boosts: window.__EDGE_SHOT_BOOST_DEBUG__.getBoostCount(),
      scale: window.__EDGE_SHOT_BOOST_DEBUG__.speedScale
    };
  });

  expect(result.vy).toBeLessThan(0);
  expect(result.boosts).toBe(1);
  expect(result.speed).toBeCloseTo(initialSpeed * result.scale, 4);
});

test('rebatida central preserva a velocidade normal', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  const initialSpeed = await page.evaluate(() => {
    while (window.__GAME_DEBUG__.getState().respawnGrace > 0) {
      window.__GAME_DEBUG__.step();
    }

    const state = window.__GAME_DEBUG__.getState();
    window.__GAME_DEBUG__.setBall({
      x: state.paddle.x + state.paddle.w / 2,
      y: state.paddle.y - state.ball.r - 1,
      vx: 2,
      vy: 4
    });
    window.__GAME_DEBUG__.step();
    return Math.hypot(2, 4);
  });

  await page.waitForTimeout(50);

  const result = await page.evaluate(() => {
    const state = window.__GAME_DEBUG__.getState();
    return {
      speed: Math.hypot(state.ball.vx, state.ball.vy),
      boosts: window.__EDGE_SHOT_BOOST_DEBUG__.getBoostCount()
    };
  });

  expect(result.boosts).toBe(0);
  expect(result.speed).toBeCloseTo(initialSpeed, 4);
});
