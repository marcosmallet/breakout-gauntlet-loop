const { test, expect } = require('@playwright/test');

test('Espaço preserva a ativação nativa dos botões do jogo', async ({ page }) => {
  await page.goto('/');

  const startButton = page.getByRole('button', { name: 'Iniciar' });
  await startButton.focus();
  await page.keyboard.press('Space');

  let state = await page.evaluate(() => window.__GAME_DEBUG__.getState());
  expect(state.running).toBe(true);

  const pauseButton = page.getByRole('button', { name: 'Pausar' });
  await pauseButton.focus();
  await page.keyboard.press('Space');

  state = await page.evaluate(() => window.__GAME_DEBUG__.getState());
  expect(state.pausedByPlayer).toBe(true);
  await expect(page.getByRole('button', { name: 'Retomar' })).toHaveAttribute('aria-pressed', 'true');

  await page.keyboard.press('Space');
  state = await page.evaluate(() => window.__GAME_DEBUG__.getState());
  expect(state.pausedByPlayer).toBe(false);
  await expect(page.getByRole('button', { name: 'Pausar' })).toHaveAttribute('aria-pressed', 'false');
});
