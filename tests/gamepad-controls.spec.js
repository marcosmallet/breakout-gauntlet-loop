const { test, expect } = require('@playwright/test');

async function installGamepad(page) {
  await page.addInitScript(() => {
    const buttons = Array.from({ length: 16 }, () => ({ pressed: false, value: 0 }));
    window.__TEST_GAMEPAD__ = {
      connected: true,
      axes: [0, 0, 0, 0],
      buttons
    };
    Object.defineProperty(navigator, 'getGamepads', {
      configurable: true,
      value: () => [window.__TEST_GAMEPAD__]
    });
  });
}

test('gamepad inicia a partida e move a raquete pelo eixo horizontal', async ({ page }) => {
  await installGamepad(page);
  await page.goto('/');

  await page.evaluate(() => { window.__TEST_GAMEPAD__.buttons[0].pressed = true; });
  await expect.poll(async () => page.evaluate(() => window.__GAME_DEBUG__.getState().running)).toBe(true);
  await page.evaluate(() => { window.__TEST_GAMEPAD__.buttons[0].pressed = false; });

  const before = await page.evaluate(() => window.__GAME_DEBUG__.getState().paddle.x);
  await page.evaluate(() => { window.__TEST_GAMEPAD__.axes[0] = 0.9; });
  await page.waitForTimeout(120);
  await page.evaluate(() => { window.__TEST_GAMEPAD__.axes[0] = 0; });

  const after = await page.evaluate(() => window.__GAME_DEBUG__.getState().paddle.x);
  expect(after).toBeGreaterThan(before);
  await expect(page.locator('#gamepadInstructions')).toContainText('gamepad');
});

test('botão Start pausa uma vez por pressão e novo toque retoma', async ({ page }) => {
  await installGamepad(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  await page.evaluate(() => { window.__TEST_GAMEPAD__.buttons[9].pressed = true; });
  await expect.poll(async () => page.evaluate(() => window.__GAME_DEBUG__.getState().pausedByPlayer)).toBe(true);

  await page.waitForTimeout(100);
  expect(await page.evaluate(() => window.__GAME_DEBUG__.getState().pausedByPlayer)).toBe(true);

  await page.evaluate(() => { window.__TEST_GAMEPAD__.buttons[9].pressed = false; });
  await page.waitForTimeout(50);
  await page.evaluate(() => { window.__TEST_GAMEPAD__.buttons[9].pressed = true; });
  await expect.poll(async () => page.evaluate(() => window.__GAME_DEBUG__.getState().pausedByPlayer)).toBe(false);
});
