const { test, expect } = require('@playwright/test');

async function drainGrace(page) {
  await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    while (game.getState().respawnGrace > 0) game.step();
  });
}

async function collectTimedPower(page, type) {
  await page.evaluate(({ type }) => {
    const game = window.__GAME_DEBUG__;
    const state = game.getState();
    game.spawnPowerDropForTest(type, state.paddle.x + state.paddle.w / 2, state.paddle.y - 12);
    game.setBall({ x: 400, y: 300, vx: 0, vy: 0 });
    game.step();
  }, { type });
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
    await collectTimedPower(page, scenario.type);

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

test('power temporário ainda anuncia expiração depois de pausar e retomar', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();
  await drainGrace(page);
  await collectTimedPower(page, 'slow');

  await expect(page.locator('#gameStatus')).toHaveText('Poder coletado: Tempo lento!');

  await page.getByRole('button', { name: 'Pausar' }).click();
  await expect(page.locator('#gameStatus')).toHaveText('Pausado.');
  await page.getByRole('button', { name: 'Retomar' }).click();
  await expect(page.locator('#gameStatus')).toHaveText('');

  const expiredState = await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    const remaining = game.getState().slowBallSteps;
    game.setBall({ x: 400, y: 300, vx: 0, vy: 0 });
    game.step(remaining);
    return game.getState();
  });

  expect(expiredState.slowBallSteps).toBe(0);
  await expect(page.locator('#powerStatus')).not.toContainText('Tempo lento');
  await expect(page.locator('#gameStatus')).toHaveText('Tempo lento terminou.');
});

test('limpeza de power por perda de vida preserva o status de respawn', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();
  await drainGrace(page);
  await collectTimedPower(page, 'wide');

  await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    game.setBall({ x: 400, y: 540, vx: 0, vy: 4 });
    game.step();
  });

  await expect(page.locator('#powerStatus')).not.toContainText('Raquete larga');
  await expect(page.locator('#gameStatus')).toHaveText('Prepare-se...');
});
