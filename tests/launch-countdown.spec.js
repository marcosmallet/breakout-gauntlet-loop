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

test('contagem ensina a mirar antes de o jogador escolher uma direção', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  await expect.poll(() => page.evaluate(() => window.__LAUNCH_COUNTDOWN_DEBUG__.getAimHintVisible()))
    .toBe(true);

  await page.evaluate(() => window.__GAME_DEBUG__.movePaddleTo(80));
  await expect.poll(() => page.evaluate(() => window.__LAUNCH_COUNTDOWN_DEBUG__.getAimDirection()))
    .toBe(-1);
  await expect.poll(() => page.evaluate(() => window.__LAUNCH_COUNTDOWN_DEBUG__.getAimHintVisible()))
    .toBe(false);
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

test('voltar a raquete ao centro remove a mira sem manter direção escolhida obsoleta', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  const result = await page.evaluate(async () => {
    const game = window.__GAME_DEBUG__;
    const initialVx = game.getState().ball.vx;
    const oppositeAimX = initialVx > 0 ? 80 : 610;

    game.movePaddleTo(oppositeAimX);
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    const aimed = {
      direction: window.__LAUNCH_COUNTDOWN_DEBUG__.getAimDirection(),
      vx: game.getState().ball.vx
    };

    const paddle = game.getState().paddle;
    game.movePaddleTo(400 - paddle.w / 2);
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    const neutral = {
      direction: window.__LAUNCH_COUNTDOWN_DEBUG__.getAimDirection(),
      vx: game.getState().ball.vx
    };

    return { initialVx, aimed, neutral };
  });

  expect(Math.sign(result.aimed.vx)).toBe(-Math.sign(result.initialVx));
  expect(result.aimed.direction).toBe(Math.sign(result.aimed.vx));
  expect(result.neutral.direction).toBe(0);
  expect(result.neutral.vx).toBe(result.initialVx);
});
