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


test('distância da raquete controla o ângulo de lançamento sem alterar a velocidade total', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  const result = await page.evaluate(async () => {
    const game = window.__GAME_DEBUG__;
    const initial = game.getState().ball;
    const initialSpeed = Math.hypot(initial.vx, initial.vy);

    game.movePaddleTo(180);
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    const moderate = {
      ...game.getState().ball,
      strength: window.__LAUNCH_COUNTDOWN_DEBUG__.getAimStrength()
    };

    game.movePaddleTo(0);
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    const strong = {
      ...game.getState().ball,
      strength: window.__LAUNCH_COUNTDOWN_DEBUG__.getAimStrength()
    };

    return {
      initialSpeed,
      moderate,
      strong
    };
  });

  expect(result.moderate.vx).toBeLessThan(0);
  expect(result.strong.vx).toBeLessThan(0);
  expect(result.strong.strength).toBeGreaterThan(result.moderate.strength);
  expect(Math.abs(result.strong.vx)).toBeGreaterThan(Math.abs(result.moderate.vx));
  expect(Math.abs(result.strong.vy)).toBeLessThan(Math.abs(result.moderate.vy));
  expect(Math.hypot(result.moderate.vx, result.moderate.vy)).toBeCloseTo(result.initialSpeed, 5);
  expect(Math.hypot(result.strong.vx, result.strong.vy)).toBeCloseTo(result.initialSpeed, 5);
});

test('mira proporcional é simétrica entre esquerda e direita', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  const result = await page.evaluate(async () => {
    const game = window.__GAME_DEBUG__;

    game.movePaddleTo(0);
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    const left = {
      ...game.getState().ball,
      strength: window.__LAUNCH_COUNTDOWN_DEBUG__.getAimStrength()
    };

    const paddle = game.getState().paddle;
    game.movePaddleTo(800 - paddle.w);
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    const right = {
      ...game.getState().ball,
      strength: window.__LAUNCH_COUNTDOWN_DEBUG__.getAimStrength()
    };

    return { left, right };
  });

  expect(result.left.vx).toBeLessThan(0);
  expect(result.right.vx).toBeGreaterThan(0);
  expect(result.left.strength).toBeCloseTo(result.right.strength, 5);
  expect(Math.abs(result.left.vx)).toBeCloseTo(Math.abs(result.right.vx), 5);
  expect(result.left.vy).toBeCloseTo(result.right.vy, 5);
});
