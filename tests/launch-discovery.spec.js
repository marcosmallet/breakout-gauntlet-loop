const { test, expect } = require('@playwright/test');

test('primeiro contato torna a mira de lançamento visível antes de jogar', async ({ page }) => {
  await page.goto('/');

  const launchInstructions = page.locator('#launchInstructions');
  await expect(launchInstructions).toBeVisible();
  await expect(launchInstructions).toHaveText(
    'Durante a contagem, mova a raquete para escolher a direção do lançamento.'
  );

  await page.getByRole('button', { name: 'Iniciar' }).click();
  await expect(page.getByRole('status')).toHaveText('Prepare-se...');
  expect((await page.evaluate(() => window.__GAME_DEBUG__.getState())).respawnGrace).toBeGreaterThan(0);
});
