const { test, expect } = require('@playwright/test');

test('recorde acompanha a pontuação e persiste entre partidas', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    while (game.getState().respawnGrace > 0) game.step();
    game.clearBricksExcept(0);
    game.setBall({ x: 21.6, y: 69, vx: 4, vy: 0 });
    game.step();
  });

  await expect(page.locator('#score')).toHaveText('310');
  await expect(page.locator('#highScore')).toHaveText('310');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('breakoutHighScore'))).toBe('310');

  await page.reload();
  await expect(page.locator('#score')).toHaveText('0');
  await expect(page.locator('#highScore')).toHaveText('310');
});
