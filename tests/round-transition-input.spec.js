const { test, expect } = require('@playwright/test');

async function clearRoundIntoTransition(page) {
  await page.getByRole('button', { name: 'Iniciar' }).click();

  await page.evaluate(() => {
    while (window.__GAME_DEBUG__.getState().respawnGrace > 0) {
      window.__GAME_DEBUG__.step();
    }

    window.__GAME_DEBUG__.clearBricksExcept(0);
    const [brick] = window.__GAME_DEBUG__.getBricks();
    const { ball } = window.__GAME_DEBUG__.getState();
    window.__GAME_DEBUG__.setBall({
      x: brick.x + brick.w / 2,
      y: brick.y + brick.h + ball.r + 1,
      vx: 0,
      vy: -4
    });
    window.__GAME_DEBUG__.step();
  });

  const state = await page.evaluate(() => window.__GAME_DEBUG__.getState());
  expect(state.roundTransition).toBeGreaterThan(0);
}

test('pointer não move a raquete durante o beat de transição entre rodadas', async ({ page }) => {
  await page.goto('/');
  await clearRoundIntoTransition(page);

  const canvas = page.locator('#game');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();

  const before = await page.evaluate(() => window.__GAME_DEBUG__.getState().paddle.x);

  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.8);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.8);
  await page.mouse.up();

  const duringTransition = await page.evaluate(() => window.__GAME_DEBUG__.getState());
  expect(duringTransition.roundTransition).toBeGreaterThan(0);
  expect(duringTransition.paddle.x).toBe(before);
});

test('pointer volta a reposicionar a raquete no respawn grace após a transição', async ({ page }) => {
  await page.goto('/');
  await clearRoundIntoTransition(page);

  await page.evaluate(() => {
    while (window.__GAME_DEBUG__.getState().roundTransition > 0) {
      window.__GAME_DEBUG__.step();
    }
  });

  const beforeGrace = await page.evaluate(() => window.__GAME_DEBUG__.getState());
  expect(beforeGrace.respawnGrace).toBeGreaterThan(0);

  const canvas = page.locator('#game');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();

  await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.8);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.85, box.y + box.height * 0.8);
  await page.mouse.up();

  const afterGracePointer = await page.evaluate(() => window.__GAME_DEBUG__.getState());
  expect(afterGracePointer.paddle.x).toBeGreaterThan(beforeGrace.paddle.x);
});
