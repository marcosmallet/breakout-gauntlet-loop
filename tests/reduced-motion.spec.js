const { test, expect } = require('@playwright/test');

test('prefers-reduced-motion desativa o pulso programático de score', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
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
  await expect.poll(() => page.evaluate(() => window.__COMBO_DEBUG__?.getScoreFeedbackCount())).toBe(0);
  await expect(page.locator('#score')).toHaveJSProperty('textContent', '10');
});

test('prefers-reduced-motion mantém recorde sem animação de escala', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => localStorage.setItem('breakoutHighScore', '300'));
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    while (game.getState().respawnGrace > 0) game.step();
    game.clearBricksExcept(0);
    game.setBall({ x: 21.6, y: 69, vx: 4, vy: 0 });
    game.step();
  });

  await expect(page.locator('#score')).toHaveText('310');
  await expect(page.locator('#highScore')).toHaveText('310');
  await expect.poll(() => page.evaluate(() => window.__HIGH_SCORE_DEBUG__.getCelebrationCount())).toBe(0);
});

test('prefers-reduced-motion remove movimento decorativo do overlay e preserva countdown', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  const initialOverlay = await page.evaluate(() => {
    window.__BALL_TRAIL_DEBUG__.refresh();
    return {
      trailLength: window.__BALL_TRAIL_DEBUG__.getTrailLength(),
      scorePopup: window.__BALL_TRAIL_DEBUG__.getScorePopup(),
      countdown: window.__BALL_TRAIL_DEBUG__.getCountdownValue()
    };
  });

  expect(initialOverlay.trailLength).toBe(0);
  expect(initialOverlay.scorePopup).toBeNull();
  expect(initialOverlay.countdown).toBe(3);

  const afterHit = await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    while (game.getState().respawnGrace > 0) game.step();
    game.setBall({ x: 50, y: 45, vx: 0, vy: 5 });
    game.step();
    window.__BALL_TRAIL_DEBUG__.refresh();
    return {
      score: game.getState().score,
      trailLength: window.__BALL_TRAIL_DEBUG__.getTrailLength(),
      scorePopup: window.__BALL_TRAIL_DEBUG__.getScorePopup()
    };
  });

  expect(afterHit.score).toBe(10);
  expect(afterHit.trailLength).toBe(0);
  expect(afterHit.scorePopup).toBeNull();
});
