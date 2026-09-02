const { test, expect } = require('@playwright/test');

test('HUD mostra quantos blocos faltam na rodada', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#bricksRemaining')).toHaveText('50');

  await page.evaluate(() => {
    window.__GAME_DEBUG__.setBall({
      x: 21.6,
      y: 69,
      vx: 4,
      vy: 0
    });
    window.__GAME_DEBUG__.step();
  });

  await expect(page.locator('#bricksRemaining')).toHaveText('49');
});
