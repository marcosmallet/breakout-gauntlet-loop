const { test, expect } = require('@playwright/test');

test('prefers-reduced-motion desativa o pulso programático de score', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  await page.evaluate(async () => {
    const game = window.__GAME_DEBUG__;
    game.start();
    game.step(45);
    game.setBall({ x: 50, y: 45, vx: 0, vy: 5 });
    game.step();
    await Promise.resolve();
  });

  await expect(page.locator('#score')).toHaveText('10');
  await expect.poll(() => page.evaluate(() => window.__COMBO_DEBUG__?.getScoreFeedbackCount())).toBe(0);
  await expect(page.locator('#score')).toHaveJSProperty('textContent', '10');
});
