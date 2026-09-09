const { test, expect } = require('@playwright/test');

test('primeira rodada recebe contexto tático antes do primeiro lançamento', async ({ page }) => {
  await page.goto('/');

  const briefing = page.locator('#firstRoundBriefing');
  await expect(briefing).toBeVisible();
  await expect(briefing).toContainText('RODADA 1');
  await expect(briefing).toContainText('Muralha');
  await expect(briefing).toContainText('Perfuração (P)');
  await expect(briefing).toContainText('Use a contagem para mirar uma rota');
  await expect(briefing).toContainText('W e S também estão no tabuleiro');

  const state = await page.evaluate(() => window.__GAME_DEBUG__.getState());
  expect(state.round).toBe(1);
  expect(state.brickLayoutLabel).toBe('Muralha');
  expect(state.bricksRemaining).toBe(50);

  const powers = await page.evaluate(() => window.__GAME_DEBUG__.getBricks()
    .filter((brick) => brick.powerType)
    .map((brick) => brick.powerType));
  expect(powers).toEqual(expect.arrayContaining(['wide', 'shield', 'pierce']));

  await page.getByRole('button', { name: 'Iniciar' }).click();
  await expect(briefing).toBeHidden();

  const afterStart = await page.evaluate(() => window.__GAME_DEBUG__.getState());
  expect(afterStart.running).toBe(true);
  expect(afterStart.respawnGrace).toBeGreaterThan(0);
});
