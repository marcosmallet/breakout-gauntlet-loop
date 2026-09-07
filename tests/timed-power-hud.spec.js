const { test, expect } = require('@playwright/test');

async function drainGrace(page) {
  await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    while (game.getState().respawnGrace > 0) game.step();
  });
}

async function collectPower(page, type) {
  await page.evaluate((powerType) => {
    const game = window.__GAME_DEBUG__;
    const state = game.getState();
    game.spawnPowerDropForTest(
      powerType,
      state.paddle.x + state.paddle.w / 2,
      state.paddle.y - 12
    );
    game.setBall({ x: 400, y: 300, vx: 0, vy: 0 });
    game.step();
  }, type);
}

test('HUD expõe e decrementa a duração restante dos poderes temporizados', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();
  await drainGrace(page);

  await collectPower(page, 'wide');
  await expect(page.locator('#powerStatus')).toContainText('Raquete larga 10s');

  await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    game.setBall({ x: 400, y: 300, vx: 0, vy: 0 });
    game.step(60);
  });
  await expect(page.locator('#powerStatus')).toContainText('Raquete larga 9s');

  await collectPower(page, 'giant');
  await collectPower(page, 'slow');
  await expect(page.locator('#powerStatus')).toContainText('Bola gigante 8s');
  await expect(page.locator('#powerStatus')).toContainText('Tempo lento 6s');
});

test('contador temporizado congela em pausa e desaparece exatamente na expiração', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();
  await drainGrace(page);
  await collectPower(page, 'slow');

  const beforePause = await page.locator('#powerStatus').textContent();
  await page.getByRole('button', { name: 'Pausar' }).click();
  await page.evaluate(() => window.__GAME_DEBUG__.step(180));
  await expect(page.locator('#powerStatus')).toHaveText(beforePause);

  await page.getByRole('button', { name: 'Retomar' }).click();
  await expect(page.locator('#gameStatus')).toHaveText('');

  await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    game.setBall({ x: 400, y: 300, vx: 0, vy: 0 });
    game.step(game.getState().slowBallSteps);
  });

  await expect(page.locator('#powerStatus')).toHaveText('—');
  // Pause/resume superseded the original collection message, so expiry must not
  // resurrect stale status feedback. The dedicated expiry suite covers the case
  // where the collection message is still current.
  await expect(page.locator('#gameStatus')).toHaveText('');
});

test('múltiplos contadores temporizados continuam legíveis no HUD mobile', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();
  await drainGrace(page);

  await collectPower(page, 'wide');
  await collectPower(page, 'giant');
  await collectPower(page, 'slow');

  const powerStatus = page.locator('#powerStatus');
  await expect(powerStatus).toContainText('Raquete larga');
  await expect(powerStatus).toContainText('Bola gigante');
  await expect(powerStatus).toContainText('Tempo lento');

  const box = await powerStatus.boundingBox();
  expect(box).not.toBeNull();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(360);
});
