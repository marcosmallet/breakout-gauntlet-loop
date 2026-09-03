const { test, expect } = require('@playwright/test');

async function scoreSingleBrick(page, index, ballY) {
  await page.goto('/');
  return page.evaluate(({ indexToKeep, y }) => {
    window.__GAME_DEBUG__.clearBricksExcept(indexToKeep);
    window.__GAME_DEBUG__.setBall({ x: 65, y, vx: 0, vy: -4 });
    window.__GAME_DEBUG__.step();
    return window.__GAME_DEBUG__.getState().score;
  }, { indexToKeep: index, y: ballY });
}

test('fileiras superiores valem mais pontos que as inferiores', async ({ page }) => {
  const topRowScore = await scoreSingleBrick(page, 0, 90);
  const bottomRowScore = await scoreSingleBrick(page, 40, 210);

  expect(topRowScore).toBe(30);
  expect(bottomRowScore).toBe(10);
  expect(topRowScore).toBeGreaterThan(bottomRowScore);
});
