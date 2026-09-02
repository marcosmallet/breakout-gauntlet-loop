const { test, expect } = require('@playwright/test');

test('limpar o tabuleiro inicia nova rodada e recompensa com vida extra', async ({ page }) => {
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
  expect(state.score).toBe(10);
  expect(state.lives).toBe(4);
  expect(state.bricksRemaining).toBe(50);
  expect(state.respawnGrace).toBe(45);
  await expect(page.getByRole('status')).toHaveText('Rodada 2! Vida extra.');
});

test('vidas extras de rodada respeitam o limite de cinco', async ({ page }) => {
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
  expect(state.lives).toBe(5);
  await expect(page.getByRole('status')).toHaveText('Rodada 4!');
});
