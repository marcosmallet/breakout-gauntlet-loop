const { test, expect } = require('@playwright/test');

test('respawn grace exposes a clear 3-2-1 launch countdown', async ({ page }) => {
  await page.goto('/');

  expect(await page.evaluate(() => window.__LAUNCH_COUNTDOWN_DEBUG__.countdownForGrace(45))).toBe(3);
  expect(await page.evaluate(() => window.__LAUNCH_COUNTDOWN_DEBUG__.countdownForGrace(30))).toBe(2);
  expect(await page.evaluate(() => window.__LAUNCH_COUNTDOWN_DEBUG__.countdownForGrace(15))).toBe(1);
  expect(await page.evaluate(() => window.__LAUNCH_COUNTDOWN_DEBUG__.countdownForGrace(0))).toBe(0);

  await page.getByRole('button', { name: 'Iniciar' }).click();
  await expect.poll(() => page.evaluate(() => window.__LAUNCH_COUNTDOWN_DEBUG__.getCountdown()))
    .toBeGreaterThan(0);
});

test('posição da raquete durante a contagem escolhe o lado do lançamento', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  await page.evaluate(() => window.__GAME_DEBUG__.movePaddleTo(80));
  await expect.poll(() => page.evaluate(() => window.__LAUNCH_COUNTDOWN_DEBUG__.getAimDirection()))
    .toBe(-1);
  await expect.poll(() => page.evaluate(() => window.__GAME_DEBUG__.getState().ball.vx))
    .toBeLessThan(0);

  await page.evaluate(() => window.__GAME_DEBUG__.movePaddleTo(610));
  await expect.poll(() => page.evaluate(() => window.__LAUNCH_COUNTDOWN_DEBUG__.getAimDirection()))
    .toBe(1);
  await expect.poll(() => page.evaluate(() => window.__GAME_DEBUG__.getState().ball.vx))
    .toBeGreaterThan(0);
});
