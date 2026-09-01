const { test, expect } = require('@playwright/test');

test('destruir bloco gera micro impacto visual no campo', async ({ page }) => {
  await page.goto('/');
  await page.addStyleTag({ content: 'canvas.impact-shake { animation-duration: 10s !important; }' });

  await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    game.start();
    game.step(45);
    game.setBall({ x: 50, y: 45, vx: 0, vy: 5 });
    game.step();
  });

  await expect(page.locator('#score')).toHaveText('50');
  await expect(page.locator('#game')).toHaveClass(/impact-shake/);
});
