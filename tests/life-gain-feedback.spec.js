const { test, expect } = require('@playwright/test');

test('vida extra por concluir rodada recebe feedback visual próprio', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    game.start();
    game.step(45);
    game.clearBricksExcept(0);
    game.setBall({ x: 21.6, y: 69, vx: 4, vy: 0 });
    game.step();
  });

  await expect(page.locator('#lives')).toHaveText('4');
  await expect(page.getByRole('status')).toContainText('Vida extra.');
  await expect.poll(() => page.evaluate(() => window.__LIFE_GAIN_FEEDBACK_DEBUG__?.getFeedbackCount())).toBe(1);
  await expect(page.locator('#lives')).toHaveClass(/life-gain-pop/);
});
