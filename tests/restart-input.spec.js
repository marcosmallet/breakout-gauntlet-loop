const { test, expect } = require('@playwright/test');

test('reiniciar limpa entradas ativas antes da nova rodada', async ({ page }) => {
  await page.goto('/');

  const positions = await page.evaluate(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    window.__GAME_DEBUG__.step();
    const moved = window.__GAME_DEBUG__.getState().paddle.x;

    window.__GAME_DEBUG__.start();
    const afterRestart = window.__GAME_DEBUG__.getState().paddle.x;
    window.__GAME_DEBUG__.step();
    const afterStep = window.__GAME_DEBUG__.getState().paddle.x;

    return { moved, afterRestart, afterStep };
  });

  expect(positions.moved).toBeGreaterThan(0);
  expect(positions.afterStep).toBe(positions.afterRestart);
});
