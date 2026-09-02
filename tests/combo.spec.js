const { test, expect } = require('@playwright/test');

test('acertos rápidos em sequência constroem combo, multiplicam pontos e perder vida o encerra', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(async () => {
    const game = window.__GAME_DEBUG__;
    game.start();
    game.step(45);
    game.setBall({ x: 50, y: 45, vx: 0, vy: 5 });
    game.step();
    await Promise.resolve();
    game.setBall({ x: 120, y: 45, vx: 0, vy: 5 });
    game.step();
  });

  await expect(page.locator('#score')).toHaveText('30');
  await expect(page.locator('#combo')).toHaveText('x2');
  await expect.poll(() => page.evaluate(() => window.__COMBO_DEBUG__?.getCombo())).toBe(2);
  await expect.poll(() => page.evaluate(() => window.__COMBO_DEBUG__?.getFeedbackCount())).toBe(1);
  await expect.poll(() => page.evaluate(() => window.__COMBO_DEBUG__?.getScoreFeedbackCount())).toBe(2);

  await page.evaluate(() => {
    window.__GAME_DEBUG__.setBall({ y: 540, vx: 0, vy: 4 });
    window.__GAME_DEBUG__.step();
  });

  await expect(page.locator('#lives')).toHaveText('2');
  await expect(page.locator('#combo')).toHaveText('x0');
});
