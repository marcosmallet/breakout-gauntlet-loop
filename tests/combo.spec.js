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

test('elite libera teto x6 e hit de 60 pontos continua o combo', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(async () => {
    const game = window.__GAME_DEBUG__;
    window.GameDifficulty.setEliteRoundActive(true);

    for (const x of [50, 120, 190, 260, 330, 400]) {
      game.setBall({ x, y: 45, vx: 0, vy: 5 });
      game.step();
      await Promise.resolve();
    }
  });

  await expect(page.locator('#score')).toHaveText('210');
  await expect(page.locator('#combo')).toHaveText('x6 MAX');
  await expect.poll(() => page.evaluate(() => window.__COMBO_DEBUG__?.getCombo())).toBe(6);
  expect(await page.evaluate(() => window.__COMBO_DEBUG__.getMaxMultiplier())).toBe(6);
  expect(await page.evaluate(() => window.__COMBO_DEBUG__.getMaxBrickScoreDelta())).toBe(60);
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

test('indicador visual acompanha a janela ampliada de combo no Elite', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(async () => {
    window.GameDifficulty.setEliteRoundActive(true);
    document.getElementById('score').textContent = '10';
    await Promise.resolve();
  });

  const combo = page.locator('#combo');
  await expect(combo).toHaveText('x1');
  await expect.poll(() => page.evaluate(() => window.__COMBO_DEBUG__?.getWindowMs())).toBe(2500);
  await expect.poll(() => combo.evaluate((element) =>
    getComputedStyle(element, '::after').animationDuration
  )).toBe('2.5s');
});

test('tempo lento desacelera também o relógio do combo sem alterar sua janela de gameplay', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(async () => {
    const game = window.__GAME_DEBUG__;
    game.start();
    game.step(45);
    document.getElementById('score').textContent = '10';
    await Promise.resolve();

    const { paddle } = game.getState();
    game.spawnPowerDropForTest('slow', paddle.x + paddle.w / 2, paddle.y);
    game.step();
    game.setBall({ x: 400, y: 300, vx: 0, vy: 0 });
    await Promise.resolve();
  });

  await expect(page.locator('#powerStatus')).toContainText('Tempo lento');
  await expect(page.locator('#combo')).toHaveText('x1');
  await expect.poll(() => page.evaluate(() => window.__COMBO_DEBUG__?.getWindowMs())).toBe(2000);
  await expect.poll(() => page.evaluate(() => Math.round(window.__COMBO_DEBUG__?.getEffectiveWindowMs()))).toBe(2778);

  await page.waitForTimeout(2100);
  await expect(page.locator('#combo')).toHaveText('x1');

  await page.waitForTimeout(800);
  await expect(page.locator('#combo')).toHaveText('x0');
});

test('último acerto preserva feedback antes de bônus grande no mesmo turno', async ({ page }) => {
  await page.goto('/');

  const feedback = await page.evaluate(async () => {
    const score = document.getElementById('score');
    const beforeScoreFeedback = window.__COMBO_DEBUG__.getScoreFeedbackCount();
    const beforeSoundFeedback = window.__COMBO_DEBUG__.getSoundFeedbackCount();

    score.textContent = '10';
    score.textContent = '310';
    await Promise.resolve();

    return {
      combo: window.__COMBO_DEBUG__.getCombo(),
      scoreFeedbackDelta: window.__COMBO_DEBUG__.getScoreFeedbackCount() - beforeScoreFeedback,
      soundFeedbackDelta: window.__COMBO_DEBUG__.getSoundFeedbackCount() - beforeSoundFeedback
    };
  });

  expect(feedback.combo).toBe(0);
  expect(feedback.scoreFeedbackDelta).toBe(1);
  expect(feedback.soundFeedbackDelta).toBe(1);
});