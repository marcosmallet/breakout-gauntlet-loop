const { test, expect } = require('@playwright/test');

test('rodadas posteriores começam com velocidade de bola progressivamente maior', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  const state = await page.evaluate(() => {
    while (window.__GAME_DEBUG__.getState().respawnGrace > 0) {
      window.__GAME_DEBUG__.step();
    }

    const firstRound = window.__GAME_DEBUG__.getState();

    window.__GAME_DEBUG__.clearBricksExcept(0);
    window.__GAME_DEBUG__.setBall({ x: 21.6, y: 69, vx: 4, vy: 0 });
    window.__GAME_DEBUG__.step();

    const secondRound = window.__GAME_DEBUG__.getState();
    return {
      firstSpeed: Math.hypot(firstRound.ball.vx, firstRound.ball.vy),
      secondSpeed: Math.hypot(secondRound.ball.vx, secondRound.ball.vy),
      round: secondRound.round,
      respawnGrace: secondRound.respawnGrace
    };
  });

  expect(state.round).toBe(2);
  expect(state.respawnGrace).toBeGreaterThan(0);
  expect(state.secondSpeed).toBeGreaterThan(state.firstSpeed);
  expect(state.secondSpeed).toBeCloseTo(Math.hypot(4.25, 4.25), 5);
});
