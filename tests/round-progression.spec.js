const { test, expect } = require('@playwright/test');

test('limpar o tabuleiro inicia nova rodada, recompensa sobrevivência e concede vida extra', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  const state = await page.evaluate(() => {
    while (window.__GAME_DEBUG__.getState().respawnGrace > 0) {
      window.__GAME_DEBUG__.step();
    }

    window.__GAME_DEBUG__.clearBricksExcept(0);
    window.__GAME_DEBUG__.setBall({
      x: 21.6,
      y: 69,
      vx: 4,
      vy: 0
    });
    window.__GAME_DEBUG__.step();
    return window.__GAME_DEBUG__.getState();
  });

  expect(state.running).toBe(true);
  expect(state.round).toBe(2);
  expect(state.score).toBe(310);
  expect(state.lives).toBe(4);
  expect(state.bricksRemaining).toBe(50);
  expect(state.respawnGrace).toBe(45);
  expect(state.paddle.w).toBe(102);
  await expect(page.getByRole('status')).toHaveText('Rodada 2! Bônus +300. Vida extra.');
  await expect(page.locator('#game')).toHaveCSS('--round-accent-hue', '243');
  await expect(page.locator('html')).toHaveCSS('--round-accent-hue', '243');
  await expect.poll(() => page.evaluate(() => window.__ROUND_CLEAR_FEEDBACK_DEBUG__.getPulseCount())).toBe(1);
  await expect(page.locator('#game')).toHaveAttribute('data-round-clear-pulse', '1');
});

test('vidas extras de rodada respeitam o limite de cinco e o bônus usa as vidas preservadas', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  const state = await page.evaluate(() => {
    for (let clearedRounds = 0; clearedRounds < 3; clearedRounds += 1) {
      while (window.__GAME_DEBUG__.getState().respawnGrace > 0) {
        window.__GAME_DEBUG__.step();
      }
      window.__GAME_DEBUG__.clearBricksExcept(0);
      window.__GAME_DEBUG__.setBall({ x: 21.6, y: 69, vx: 4, vy: 0 });
      window.__GAME_DEBUG__.step();
    }
    return window.__GAME_DEBUG__.getState();
  });

  expect(state.round).toBe(4);
  expect(state.score).toBe(1230);
  expect(state.lives).toBe(5);
  expect(state.paddle.w).toBe(86);
  await expect(page.getByRole('status')).toHaveText('Rodada 4! Bônus +500.');
  await expect(page.locator('#game')).toHaveCSS('--round-accent-hue', '319');
  await expect(page.locator('html')).toHaveCSS('--round-accent-hue', '319');
});
