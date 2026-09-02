const { test, expect } = require('@playwright/test');

test('última vida destaca visualmente a arena', async ({ page }) => {
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

    window.__LAST_LIFE_FEEDBACK_DEBUG__.sync();
  });

  expect((await page.evaluate(() => window.__GAME_DEBUG__.getState())).lives).toBe(1);
  await expect(page.locator('#game')).toHaveAttribute('data-last-life', 'true');
});

test('reiniciar remove o destaque de última vida', async ({ page }) => {
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

    window.__LAST_LIFE_FEEDBACK_DEBUG__.sync();
  });

  await expect(page.locator('#game')).toHaveAttribute('data-last-life', 'true');
  await page.getByRole('button', { name: 'Reiniciar' }).click();
  await expect(page.locator('#game')).not.toHaveAttribute('data-last-life', 'true');
});
