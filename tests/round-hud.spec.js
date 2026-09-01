const { test, expect } = require('@playwright/test');

test('HUD mantém a rodada atual visível durante a progressão', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Rodada:', { exact: false })).toContainText('1');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  await page.evaluate(() => {
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
  });

  await expect(page.locator('#round')).toHaveText('2');
  await expect(page.getByRole('status')).toHaveText('Rodada 2!');
});
