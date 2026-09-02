const { test, expect } = require('@playwright/test');

test('rastro acompanha o movimento da bola sem afetar a simulação', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  const result = await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    const trail = window.__BALL_TRAIL_DEBUG__;

    game.step(60);
    trail.refresh();
    const before = game.getState().ball;

    for (let index = 0; index < 6; index += 1) {
      game.step();
      trail.refresh();
    }

    const after = game.getState().ball;
    return {
      before,
      after,
      trailLength: trail.getTrailLength(),
      maxTrailPoints: trail.getMaxTrailPoints()
    };
  });

  expect(result.after.x).not.toBe(result.before.x);
  expect(result.after.y).not.toBe(result.before.y);
  expect(result.trailLength).toBeGreaterThan(1);
  expect(result.trailLength).toBeLessThanOrEqual(result.maxTrailPoints);
  expect(result.maxTrailPoints).toBe(4);
});
