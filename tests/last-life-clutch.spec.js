const { test, expect } = require('@playwright/test');

test('última vida ativa um pequeno clutch slowdown', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  await page.evaluate(() => {
    while (window.__GAME_DEBUG__.getState().respawnGrace > 0) {
      window.__GAME_DEBUG__.step();
    }

    for (let loss = 0; loss < 2; loss += 1) {
      window.__GAME_DEBUG__.setBall({ y: 540, vy: 4 });
      window.__GAME_DEBUG__.step();
      if (loss === 0) {
        while (window.__GAME_DEBUG__.getState().respawnGrace > 0) {
          window.__GAME_DEBUG__.step();
        }
      }
    }
  });

  await page.waitForFunction(() => window.__LAST_LIFE_CLUTCH_DEBUG__.isApplied());

  const state = await page.evaluate(() => window.__GAME_DEBUG__.getState());
  const speed = Math.hypot(state.ball.vx, state.ball.vy);
  expect(state.lives).toBe(1);
  expect(speed).toBeCloseTo(Math.hypot(4, 4) * 0.88, 5);
});

test('reiniciar remove o clutch slowdown', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  await page.evaluate(() => {
    while (window.__GAME_DEBUG__.getState().respawnGrace > 0) {
      window.__GAME_DEBUG__.step();
    }

    for (let loss = 0; loss < 2; loss += 1) {
      window.__GAME_DEBUG__.setBall({ y: 540, vy: 4 });
      window.__GAME_DEBUG__.step();
      if (loss === 0) {
        while (window.__GAME_DEBUG__.getState().respawnGrace > 0) {
          window.__GAME_DEBUG__.step();
        }
      }
    }
  });

  await page.waitForFunction(() => window.__LAST_LIFE_CLUTCH_DEBUG__.isApplied());
  await page.getByRole('button', { name: 'Reiniciar' }).click();

  const state = await page.evaluate(() => window.__GAME_DEBUG__.getState());
  expect(state.lives).toBe(3);
  expect(Math.hypot(state.ball.vx, state.ball.vy)).toBeCloseTo(Math.hypot(4, 4), 5);
  expect(await page.evaluate(() => window.__LAST_LIFE_CLUTCH_DEBUG__.isApplied())).toBe(false);
});
