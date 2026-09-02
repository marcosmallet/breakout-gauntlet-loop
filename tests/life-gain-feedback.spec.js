const { test, expect } = require('@playwright/test');

test('vida extra por concluir rodada recebe feedback visual próprio', async ({ page }) => {
  await page.goto('/');

  const feedback = await page.evaluate(async () => {
    const game = window.__GAME_DEBUG__;
    game.start();
    game.step(45);
    game.clearBricksExcept(0);
    game.setBall({ x: 21.6, y: 69, vx: 4, vy: 0 });
    game.step();
    await Promise.resolve();

    return {
      count: window.__LIFE_GAIN_FEEDBACK_DEBUG__?.getFeedbackCount(),
      classApplied: document.getElementById('lives').classList.contains('life-gain-pop')
    };
  });

  expect(feedback).toEqual({ count: 1, classApplied: true });
  await expect(page.locator('#lives')).toHaveText('4');
  await expect(page.getByRole('status')).toContainText('Vida extra.');
});
