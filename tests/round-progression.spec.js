const { test, expect } = require('@playwright/test');

test('limpar o tabuleiro inicia nova rodada preservando progresso', async ({ page }) => {
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
  expect(state.lives).toBe(3);
  expect(state.bricksRemaining).toBe(50);
  expect(state.respawnGrace).toBe(45);
  await expect(page.getByRole('status')).toHaveText('Rodada 2!');
});
