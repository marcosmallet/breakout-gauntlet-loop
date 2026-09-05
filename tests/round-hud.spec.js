const { test, expect } = require('@playwright/test');

test('HUD mantém a rodada atual visível durante a celebração e preparação', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Rodada:', { exact: false })).toContainText('1');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    while (game.getState().respawnGrace > 0) game.step();

    game.clearBricksExcept(0);
    game.setBall({ x: 21.6, y: 69, vx: 4, vy: 0 });
    game.step();
  });

  await expect(page.locator('#round')).toHaveText('2');
  await expect(page.getByRole('status')).toContainText('Rodada 1 concluída!');
  await expect.poll(() => page.evaluate(() => window.__ROUND_CLEAR_FEEDBACK_DEBUG__.getPulseCount())).toBe(1);

  await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    while (game.getState().roundTransition > 0) game.step();
  });

  await expect(page.locator('#round')).toHaveText('2');
  await expect(page.getByRole('status')).toHaveText('Prepare-se...');
});
