const { test, expect } = require('@playwright/test');

test('fileiras superiores valem mais pontos que as inferiores', async ({ page }) => {
  await page.goto('/');

  const scores = await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;

    game.start();
    game.step(45);
    game.setBall({ x: 50, y: 45, vx: 0, vy: 5 });
    game.step();
    const topRow = game.getState().score;

    game.start();
    game.step(45);
    game.setBall({ x: 50, y: 165, vx: 0, vy: 5 });
    game.step();
    const bottomRow = game.getState().score;

    return { topRow, bottomRow };
  });

  expect(scores.topRow).toBe(50);
  expect(scores.bottomRow).toBe(10);
  expect(scores.topRow).toBeGreaterThan(scores.bottomRow);
});
