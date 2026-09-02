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

test('combo crescente eleva o tom dos impactos', async ({ page }) => {
  await page.goto('/');

  const frequencies = await page.evaluate(async () => {
    const game = window.__GAME_DEBUG__;
    const sound = window.__IMPACT_SOUND_DEBUG__;
    game.start();
    game.step(45);

    game.setBall({ x: 50, y: 45, vx: 0, vy: 5 });
    game.step();
    await Promise.resolve();
    const first = sound.getLastImpactFrequency();

    game.setBall({ x: 120, y: 45, vx: 0, vy: 5 });
    game.step();
    await Promise.resolve();
    const second = sound.getLastImpactFrequency();

    return { first, second };
  });

  await expect(page.locator('#combo')).toHaveText('x2');
  expect(frequencies.first).toBe(420);
  expect(frequencies.second).toBe(475);
});

test('rebater na raquete dispara feedback sonoro próprio uma vez', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    game.start();
    game.step(45);
    game.setBall({ x: 400, y: 470, vx: 0, vy: 6 });
    game.step();
  });

  await expect.poll(() => page.evaluate(() => window.__IMPACT_SOUND_DEBUG__.getPaddleImpactCount())).toBe(1);
  expect(await page.evaluate(() => window.__GAME_DEBUG__.getState().ball.vy)).toBeLessThan(0);
});

test('perder vida dispara feedback sonoro próprio uma vez', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    game.start();
    game.step(45);
    game.setBall({ x: 400, y: 540, vx: 0, vy: 5 });
    game.step();
  });

  await expect(page.locator('#lives')).toHaveText('2');
  await expect.poll(() => page.evaluate(() => window.__IMPACT_SOUND_DEBUG__.getLifeLossCount())).toBe(1);
});

test('avançar de rodada dispara feedback sonoro próprio uma vez', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    game.start();
    game.step(45);
    game.clearBricksExcept(0);
    game.setBall({ x: 50, y: 45, vx: 0, vy: 5 });
    game.step();
  });

  await expect(page.locator('#round')).toHaveText('2');
  await expect.poll(() => page.evaluate(() => window.__IMPACT_SOUND_DEBUG__.getRoundAdvanceCount())).toBe(1);
});
