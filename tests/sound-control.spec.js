const { test, expect } = require('@playwright/test');

test('controle de som silencia emissões e persiste a preferência', async ({ page }) => {
  await page.goto('/');

  const soundButton = page.locator('#soundButton');
  await expect(soundButton).toHaveText('Som: ligado');
  await expect(soundButton).toHaveAttribute('aria-pressed', 'false');

  await soundButton.click();
  await expect(soundButton).toHaveText('Som: desligado');
  await expect(soundButton).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => window.__IMPACT_SOUND_DEBUG__.isMuted())).toBe(true);

  const mutedCounts = await page.evaluate(async () => {
    const game = window.__GAME_DEBUG__;
    const sound = window.__IMPACT_SOUND_DEBUG__;
    game.start();
    game.step(45);
    const before = sound.getEmittedSoundCount();
    game.setBall({ x: 50, y: 45, vx: 0, vy: 5 });
    game.step();
    await Promise.resolve();
    return {
      before,
      after: sound.getEmittedSoundCount(),
      impacts: sound.getImpactCount()
    };
  });

  expect(mutedCounts.impacts).toBe(1);
  expect(mutedCounts.after).toBe(mutedCounts.before);

  await page.reload();
  await expect(page.locator('#soundButton')).toHaveText('Som: desligado');
  await expect(page.locator('#soundButton')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => window.__IMPACT_SOUND_DEBUG__.isMuted())).toBe(true);

  await page.locator('#soundButton').click();
  await expect(page.locator('#soundButton')).toHaveText('Som: ligado');
  await expect(page.locator('#soundButton')).toHaveAttribute('aria-pressed', 'false');

  const unmutedCounts = await page.evaluate(async () => {
    const game = window.__GAME_DEBUG__;
    const sound = window.__IMPACT_SOUND_DEBUG__;
    game.start();
    game.step(45);
    const before = sound.getEmittedSoundCount();
    game.setBall({ x: 50, y: 45, vx: 0, vy: 5 });
    game.step();
    await Promise.resolve();
    return { before, after: sound.getEmittedSoundCount() };
  });

  expect(unmutedCounts.after).toBeGreaterThan(unmutedCounts.before);
});
