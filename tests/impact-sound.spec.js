const { test, expect } = require('@playwright/test');

test('destruir bloco dispara feedback sonoro uma vez', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    game.start();
    game.step(45);
    game.setBall({ x: 50, y: 45, vx: 0, vy: 5 });
    game.step();
  });

  await expect(page.locator('#score')).toHaveText('10');
  await expect.poll(() => page.evaluate(() => window.__IMPACT_SOUND_DEBUG__.getImpactCount())).toBe(1);
});
