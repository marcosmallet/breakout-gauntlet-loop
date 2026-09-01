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

test('pageshow não retoma enquanto a página ainda está sem foco', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  const states = await page.evaluate(() => {
    window.dispatchEvent(new Event('pagehide'));
    const hidden = window.__GAME_DEBUG__.getState();

    const originalHasFocus = document.hasFocus.bind(document);
    Object.defineProperty(document, 'hasFocus', {
      configurable: true,
      value: () => false
    });
    window.dispatchEvent(new Event('pageshow'));
    const unfocused = window.__GAME_DEBUG__.getState();

    Object.defineProperty(document, 'hasFocus', {
      configurable: true,
      value: () => true
    });
    window.dispatchEvent(new Event('pageshow'));
    const focused = window.__GAME_DEBUG__.getState();

    Object.defineProperty(document, 'hasFocus', {
      configurable: true,
      value: originalHasFocus
    });

    return { hidden, unfocused, focused };
  });

  expect(states.hidden.pausedByFocusLoss).toBe(true);
  expect(states.unfocused.pausedByFocusLoss).toBe(true);
  expect(states.focused.pausedByFocusLoss).toBe(false);
});
