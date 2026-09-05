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
  await expect(page.locator('#combo')).toHaveClass(/combo-window/);
  await expect.poll(() => page.evaluate(() => window.__COMBO_DEBUG__?.getCombo())).toBe(2);
  await expect.poll(() => page.evaluate(() => window.__COMBO_DEBUG__?.getFeedbackCount())).toBe(1);
  await expect.poll(() => page.evaluate(() => window.__COMBO_DEBUG__?.getScoreFeedbackCount())).toBe(2);
  await expect.poll(() => page.evaluate(() => window.__COMBO_DEBUG__?.getSoundFeedbackCount())).toBe(2);

  await page.evaluate(() => {
    window.__GAME_DEBUG__.setBall({ y: 540, vx: 0, vy: 4 });
    window.__GAME_DEBUG__.step();
  });

  await expect(page.locator('#lives')).toHaveText('2');
  await expect(page.locator('#combo')).toHaveText('x0');
  await expect(page.locator('#combo')).not.toHaveClass(/combo-window/);
});

test('combo deixa claro o teto x5 mesmo quando a sequência continua', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(async () => {
    const game = window.__GAME_DEBUG__;
    game.start();
    game.step(45);

    for (const x of [50, 120, 190, 260, 330, 400]) {
      game.setBall({ x, y: 45, vx: 0, vy: 5 });
      game.step();
      await Promise.resolve();
    }
  });

  await expect(page.locator('#score')).toHaveText('200');
  await expect(page.locator('#combo')).toHaveText('x5 MAX');
  await expect.poll(() => page.evaluate(() => window.__COMBO_DEBUG__?.getCombo())).toBe(6);
});


test('pausa congela a janela do combo e preserva o multiplicador ao retomar', async ({ page }) => {
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
  await expect(page.locator('#combo')).toHaveText('x1');

  await page.getByRole('button', { name: 'Pausar' }).click();
  const pausedBall = await page.evaluate(() => window.__GAME_DEBUG__.getState().ball);
  const combo = page.locator('#combo');

  await expect.poll(() => combo.evaluate((element) =>
    getComputedStyle(element, '::after').animationPlayState
  )).toBe('paused');

  const indicatorAtPause = await combo.evaluate((element) =>
    getComputedStyle(element, '::after').transform
  );

  await page.waitForTimeout(2100);

  await expect(combo).toHaveText('x1');
  const indicatorAfterWait = await combo.evaluate((element) =>
    getComputedStyle(element, '::after').transform
  );
  expect(indicatorAfterWait).toBe(indicatorAtPause);
  const stillPausedBall = await page.evaluate(() => window.__GAME_DEBUG__.getState().ball);
  expect(stillPausedBall.x).toBe(pausedBall.x);
  expect(stillPausedBall.y).toBe(pausedBall.y);

  await page.getByRole('button', { name: 'Retomar' }).click();
  await expect.poll(() => combo.evaluate((element) =>
    getComputedStyle(element, '::after').animationPlayState
  )).toBe('running');

  await page.evaluate(async () => {
    const game = window.__GAME_DEBUG__;
    game.setBall({ x: 120, y: 45, vx: 0, vy: 5 });
    game.step();
    await Promise.resolve();
  });

  await expect(page.locator('#score')).toHaveText('30');
  await expect(page.locator('#combo')).toHaveText('x2');
});
