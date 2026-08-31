const { test, expect } = require('@playwright/test');

test('carrega o jogo com o estado inicial esperado', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#game')).toBeVisible();

  const state = await page.evaluate(() => window.__GAME_DEBUG__.getState());
  expect(state.score).toBe(0);
  expect(state.lives).toBe(3);
  expect(state.bricksRemaining).toBe(50);
});

test('inicia uma partida', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  const state = await page.evaluate(() => window.__GAME_DEBUG__.getState());
  expect(state.running).toBe(true);
});

test('controle para a direita move a raquete', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();
  const before = await page.evaluate(() => window.__GAME_DEBUG__.getState().paddle.x);

  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(120);
  await page.keyboard.up('ArrowRight');

  const after = await page.evaluate(() => window.__GAME_DEBUG__.getState().paddle.x);
  expect(after).toBeGreaterThan(before);
});
