import { test, expect } from '@playwright/test';

test('perder uma vida dispara feedback visual de falha', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  await page.evaluate(() => {
    window.__GAME_DEBUG__.setBall({ y: 540, vx: 0, vy: 4 });
    window.__GAME_DEBUG__.step();
  });

  await expect.poll(() => page.evaluate(() => window.__GAME_DEBUG__.getState().lives)).toBe(2);
  await expect.poll(() => page.evaluate(() => window.__LIFE_LOSS_FEEDBACK_DEBUG__?.pulseCount)).toBe(1);
  await expect(page.locator('#game')).toHaveClass(/life-loss-pulse/);
});
