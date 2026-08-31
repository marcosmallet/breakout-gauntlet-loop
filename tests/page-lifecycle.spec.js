const { test, expect } = require('@playwright/test');

test('pagehide pausa a simulação e pageshow permite retomar', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  const states = await page.evaluate(() => {
    while (window.__GAME_DEBUG__.getState().respawnGrace > 0) {
      window.__GAME_DEBUG__.step();
    }

    window.__GAME_DEBUG__.setBall({ x: 400, y: 300, vx: 4, vy: 0 });
    const beforeHide = window.__GAME_DEBUG__.getState();

    window.dispatchEvent(new PageTransitionEvent('pagehide'));
    window.__GAME_DEBUG__.step();
    const whileHidden = window.__GAME_DEBUG__.getState();

    window.dispatchEvent(new PageTransitionEvent('pageshow'));
    window.__GAME_DEBUG__.step();
    const afterShow = window.__GAME_DEBUG__.getState();

    return { beforeHide, whileHidden, afterShow };
  });

  expect(states.whileHidden.pausedByFocusLoss).toBe(true);
  expect(states.whileHidden.ball.x).toBe(states.beforeHide.ball.x);
  expect(states.afterShow.pausedByFocusLoss).toBe(false);
  expect(states.afterShow.ball.x).toBeGreaterThan(states.whileHidden.ball.x);
});
