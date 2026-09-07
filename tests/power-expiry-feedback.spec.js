const { test, expect } = require('@playwright/test');

async function drainGrace(page) {
  await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    while (game.getState().respawnGrace > 0) game.step();
  });
}

const scenarios = [
  {
    type: 'wide',
    field: 'widePaddleSteps',
    label: 'Raquete larga',
    collectedMessage: 'Poder coletado: Raquete larga!',
    expiredMessage: 'Raquete larga terminou.'
  },
  {
    type: 'giant',
    field: 'giantBallSteps',
    label: 'Bola gigante',
    collectedMessage: 'Poder coletado: Bola gigante!',
    expiredMessage: 'Bola gigante terminou.'
  },
  {
    type: 'slow',
    field: 'slowBallSteps',
    label: 'Tempo lento',
    collectedMessage: 'Poder coletado: Tempo lento!',
    expiredMessage: 'Tempo lento terminou.'
  }
];

for (const scenario of scenarios) {
  test(`${scenario.label} substitui feedback de coleta quando expira`, async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Iniciar' }).click();
    await drainGrace(page);

    await page.evaluate(({ type }) => {
      const game = window.__GAME_DEBUG__;
      const state = game.getState();
      game.spawnPowerDropForTest(type, state.paddle.x + state.paddle.w / 2, state.paddle.y - 12);
      game.setBall({ x: 400, y: 300, vx: 0, vy: 0 });
      game.step();
    }, scenario);

    await expect(page.locator('#powerStatus')).toContainText(scenario.label);
    await expect(page.locator('#gameStatus')).toHaveText(scenario.collectedMessage);

    const expiredState = await page.evaluate(({ field }) => {
      const game = window.__GAME_DEBUG__;
      const remaining = game.getState()[field];
      game.setBall({ x: 400, y: 300, vx: 0, vy: 0 });
      game.step(remaining);
      return game.getState();
    }, scenario);

    expect(expiredState[scenario.field]).toBe(0);
    await expect(page.locator('#powerStatus')).not.toContainText(scenario.label);
    await expect(page.locator('#gameStatus')).toHaveText(scenario.expiredMessage);
  });
}
