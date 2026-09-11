const { test, expect } = require('@playwright/test');

test('reiniciar limpa entradas ativas antes da nova rodada', async ({ page }) => {
  await page.goto('/');

  const positions = await page.evaluate(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    window.__GAME_DEBUG__.step();
    const moved = window.__GAME_DEBUG__.getState().paddle.x;

    window.__GAME_DEBUG__.start();
    const afterRestart = window.__GAME_DEBUG__.getState().paddle.x;
    window.__GAME_DEBUG__.step();
    const afterStep = window.__GAME_DEBUG__.getState().paddle.x;

    return { moved, afterRestart, afterStep };
  });

  expect(positions.moved).toBeGreaterThan(0);
  expect(positions.afterStep).toBe(positions.afterRestart);
});

test('reiniciar durante respawn tardio restaura a velocidade de lançamento da rodada 1', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  await page.evaluate(() => window.__GAME_DEBUG__.step(60));
  await page.waitForTimeout(40);

  await page.evaluate(() => {
    window.__GAME_DEBUG__.setRoundForTest(8);
    const state = window.__GAME_DEBUG__.getState();
    window.__GAME_DEBUG__.setBall({
      x: state.ball.x,
      y: 540,
      vx: 0,
      vy: 6
    });
    window.__GAME_DEBUG__.step();
  });

  await expect.poll(async () => page.evaluate(() => {
    const state = window.__GAME_DEBUG__.getState();
    return state.respawnGrace > 0 ? Math.hypot(state.ball.vx, state.ball.vy) : 0;
  })).toBeGreaterThan(7);

  await page.getByRole('button', { name: 'Reiniciar' }).click();

  await expect.poll(async () => page.evaluate(() => {
    const state = window.__GAME_DEBUG__.getState();
    return {
      round: state.round,
      grace: state.respawnGrace,
      speed: Math.hypot(state.ball.vx, state.ball.vy)
    };
  })).toEqual(expect.objectContaining({
    round: 1
  }));

  const restarted = await page.evaluate(() => {
    const state = window.__GAME_DEBUG__.getState();
    return {
      grace: state.respawnGrace,
      speed: Math.hypot(state.ball.vx, state.ball.vy)
    };
  });

  expect(restarted.grace).toBeGreaterThan(0);
  expect(restarted.speed).toBeCloseTo(Math.hypot(4, 4), 5);
});
