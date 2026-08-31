const { test, expect } = require('@playwright/test');

test('carrega o jogo com o estado inicial esperado', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#game')).toBeVisible();

  const state = await page.evaluate(() => window.__GAME_DEBUG__.getState());
  expect(state.score).toBe(0);
  expect(state.lives).toBe(3);
  expect(state.bricksRemaining).toBe(50);
});

test('inicia uma partida', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  const state = await page.evaluate(() => window.__GAME_DEBUG__.getState());
  expect(state.running).toBe(true);
});

test('controle para a direita move a raquete', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();
  const before = await page.evaluate(() => window.__GAME_DEBUG__.getState().paddle.x);

  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(120);
  await page.keyboard.up('ArrowRight');

  const after = await page.evaluate(() => window.__GAME_DEBUG__.getState().paddle.x);
  expect(after).toBeGreaterThan(before);
});

test('rebatida central mantém movimento horizontal mínimo', async ({ page }) => {
  await page.goto('/');

  const velocity = await page.evaluate(() => {
    window.__GAME_DEBUG__.bounceBallOffPaddle(0);
    return window.__GAME_DEBUG__.getState().ball;
  });

  expect(Math.abs(velocity.vx)).toBeGreaterThanOrEqual(1.5);
  expect(velocity.vy).toBeLessThan(0);
});

test('arrastar no canvas move a raquete', async ({ page }) => {
  await page.goto('/');
  const canvas = page.locator('#game');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();

  const before = await page.evaluate(() => window.__GAME_DEBUG__.getState().paddle.x);
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.8);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.8);
  await page.mouse.up();

  const after = await page.evaluate(() => window.__GAME_DEBUG__.getState().paddle.x);
  expect(after).toBeGreaterThan(before);
});

test('raspada na borda da raquete rebate a bola', async ({ page }) => {
  await page.goto('/');

  const ballAfter = await page.evaluate(() => {
    const { paddle, ball } = window.__GAME_DEBUG__.getState();
    window.__GAME_DEBUG__.setBall({
      x: paddle.x - ball.r + 1,
      y: paddle.y - ball.r - 4,
      vx: 0,
      vy: 4
    });
    window.__GAME_DEBUG__.step();
    return window.__GAME_DEBUG__.getState().ball;
  });

  expect(ballAfter.vy).toBeLessThan(0);
  expect(Math.abs(ballAfter.vx)).toBeLessThanOrEqual(5);
});
