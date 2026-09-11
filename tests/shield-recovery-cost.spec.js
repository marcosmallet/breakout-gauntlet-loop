const { test, expect } = require('@playwright/test');

async function drainGrace(page) {
  await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    while (game.getState().respawnGrace > 0) game.step();
  });
}

async function setHudState(page, round, lives) {
  await page.evaluate(({ round, lives }) => {
    document.getElementById('lives').textContent = String(lives);
    document.getElementById('round').textContent = String(round);
  }, { round, lives });
  await page.waitForTimeout(0);
}

async function unlockEliteChoice(page) {
  await setHudState(page, 2, 4);
  await setHudState(page, 3, 5);
  await setHudState(page, 4, 5);
  await setHudState(page, 5, 5);
  await setHudState(page, 6, 5);
}

async function triggerShieldSave(page) {
  return page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    const before = game.getState();
    game.spawnPowerDropForTest('shield', before.paddle.x + before.paddle.w / 2, before.paddle.y - 12);
    game.setBall({ x: 400, y: 300, vx: 0, vy: 0 });
    game.step();
    const armed = game.getState();
    game.setBall({ x: 40, y: 490, vx: 0, vy: 8 });
    game.step(2);
    return { before, armed, saved: game.getState() };
  });
}

test('Escudo preserva a vida, mas uma falha de raquete encerra o combo', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();
  await drainGrace(page);

  await page.evaluate(() => {
    window.__GAME_DEBUG__.setBall({ x: 400, y: 300, vx: 0, vy: 0 });
    document.getElementById('score').textContent = '10';
  });
  await expect.poll(() => page.evaluate(() => window.__COMBO_DEBUG__.getCombo())).toBe(1);

  const result = await triggerShieldSave(page);

  await expect.poll(() => page.evaluate(() => window.__COMBO_DEBUG__.getCombo())).toBe(0);
  expect(result.armed.shieldCharges).toBe(1);
  expect(result.saved.lives).toBe(result.before.lives);
  expect(result.saved.shieldCharges).toBe(0);
  expect(result.saved.ball.vy).toBeLessThan(0);
  await expect(page.locator('#gameStatus')).toHaveText('Escudo salvou a bola!');
});

test('Escudo encerra o streak Elite e exige novo domínio antes de requalificar', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();
  await drainGrace(page);
  await unlockEliteChoice(page);
  await page.locator('#eliteModeButton').click();
  await expect(page.locator('#roundMode')).toHaveText('Elite');

  const shield = await triggerShieldSave(page);
  expect(shield.armed.shieldCharges).toBe(1);
  expect(shield.saved.lives).toBe(shield.before.lives);
  expect(shield.saved.shieldCharges).toBe(0);
  await expect(page.locator('#gameStatus')).toHaveText('Escudo salvou a bola!');
  await expect(page.locator('#roundMode')).toHaveText('Normal');

  let state = await page.evaluate(() => window.__ELITE_ROUND_DEBUG__.getState());
  expect(state.masteryChoice).toBe(null);
  expect(state.active).toBe(false);
  expect(state.masteryBrokenThisRound).toBe(true);
  expect(state.minimumLivesThisRound).toBe(5);

  await setHudState(page, 7, 5);
  await expect(page.locator('#eliteChoice')).toBeHidden();
  await expect(page.locator('#roundMode')).toHaveText('Normal');
  state = await page.evaluate(() => window.__ELITE_ROUND_DEBUG__.getState());
  expect(state.awaitingChoice).toBe(false);
  expect(state.masteryBrokenThisRound).toBe(false);

  await setHudState(page, 8, 5);
  await expect(page.locator('#eliteChoice')).toBeVisible();
  await expect(page.locator('#roundMode')).toHaveText('Escolher');
});
