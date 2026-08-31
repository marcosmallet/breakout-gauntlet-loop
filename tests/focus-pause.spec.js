const { test, expect } = require('@playwright/test');

test('perder foco pausa a partida e voltar retoma do mesmo estado', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  const states = await page.evaluate(() => {
    while (window.__GAME_DEBUG__.getState().respawnGrace > 0) {
      window.__GAME_DEBUG__.step();
    }

    window.__GAME_DEBUG__.setBall({ x: 400, y: 300, vx: 4, vy: 2 });
    window.dispatchEvent(new Event('blur'));
    const paused = window.__GAME_DEBUG__.getState();

    window.__GAME_DEBUG__.step(2);
    const whilePaused = window.__GAME_DEBUG__.getState();

    window.dispatchEvent(new Event('focus'));
    window.__GAME_DEBUG__.step();
    const resumed = window.__GAME_DEBUG__.getState();

    return { paused, whilePaused, resumed };
  });

  expect(states.paused.pausedByFocusLoss).toBe(true);
  expect(states.whilePaused.ball.x).toBe(states.paused.ball.x);
  expect(states.whilePaused.ball.y).toBe(states.paused.ball.y);
  expect(states.resumed.pausedByFocusLoss).toBe(false);
  expect(states.resumed.ball.x).toBeGreaterThan(states.whilePaused.ball.x);

  await expect(page.getByRole('status')).toHaveText('');
});