const { test, expect } = require('@playwright/test');

test('ocultar e restaurar a página pausa e retoma automaticamente', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  const states = await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    const hidden = window.__GAME_DEBUG__.getState();

    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
    const visible = window.__GAME_DEBUG__.getState();

    return { hidden, visible };
  });

  expect(states.hidden.pausedByFocusLoss).toBe(true);
  expect(states.visible.pausedByFocusLoss).toBe(false);
});
