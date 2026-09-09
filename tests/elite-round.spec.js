const { test, expect } = require('@playwright/test');

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

test('domínio tardio desbloqueia escolha explícita entre normal e elite', async ({ page }) => {
  await page.goto('/');

  expect(await page.evaluate(() => window.GameDifficulty.maxBallSpeedForRound(6))).toBeCloseTo(8.2, 8);
  expect(await page.evaluate(() => window.__COMBO_DEBUG__.getWindowMs())).toBe(2000);
  await expect(page.locator('#roundMode')).toHaveText('Normal');
  await expect(page.locator('#eliteChoice')).toBeHidden();

  await unlockEliteChoice(page);

  await expect(page.locator('#roundMode')).toHaveText('Escolher');
  await expect(page.locator('#eliteChoice')).toBeVisible();
  await expect(page.locator('#eliteChoice')).toContainText('teto x6');
  expect(await page.evaluate(() => window.__ELITE_ROUND_DEBUG__.getState().awaitingChoice)).toBe(true);
  expect(await page.evaluate(() => window.GameDifficulty.maxBallSpeedForRound(6))).toBeCloseTo(8.2, 8);
  expect(await page.evaluate(() => window.__COMBO_DEBUG__.getWindowMs())).toBe(2000);
});

test('escolha Elite preserva o briefing da próxima rodada no próprio contexto decisório', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.__GAME_DEBUG__.start());
  await setHudState(page, 2, 4);
  await setHudState(page, 3, 5);
  await setHudState(page, 4, 5);
  await setHudState(page, 5, 5);

  await page.evaluate(() => {
    window.__GAME_DEBUG__.setRoundForTest(6);
    document.getElementById('gameStatus').textContent =
      'Rodada 5 concluída! Bônus +500. Próxima: Ondas • Perfuração (P).';
  });
  await page.waitForTimeout(0);

  const context = page.locator('#eliteNextRoundContext');
  await expect(page.locator('#eliteChoice')).toBeVisible();
  await expect(context).toBeVisible();
  await expect(context).toHaveText('Próxima rodada: Ondas • Perfuração (P).');
  await expect(page.locator('#standardModeButton')).toBeFocused();
  await expect(page.locator('#standardModeButton')).toHaveAttribute(
    'aria-describedby',
    'eliteChoiceDescription eliteNextRoundContext'
  );
  await expect(page.getByRole('status')).toHaveText('Pausado.');
  expect(await page.evaluate(() => window.__ELITE_ROUND_DEBUG__.getState().pausedForChoice)).toBe(true);

  await page.locator('#eliteModeButton').click();
  await expect(context).toBeHidden();
});

test('aceitar elite aplica risco de velocidade e recompensa de combo', async ({ page }) => {
  await page.goto('/');
  await unlockEliteChoice(page);

  await page.locator('#eliteModeButton').click();

  await expect(page.locator('#eliteChoice')).toBeHidden();
  await expect(page.locator('#roundMode')).toHaveText('Elite');
  expect(await page.evaluate(() => window.GameDifficulty.maxBallSpeedForRound(6))).toBeCloseTo(8.7, 8);
  expect(await page.evaluate(() => window.__COMBO_DEBUG__.getWindowMs())).toBe(2500);
  expect(await page.evaluate(() => window.__COMBO_DEBUG__.getMaxMultiplier())).toBe(6);
});

test('aceitar elite mantém o modo durante um streak perfeito sem repetir a escolha', async ({ page }) => {
  await page.goto('/');
  await unlockEliteChoice(page);
  await page.locator('#eliteModeButton').click();

  await setHudState(page, 7, 5);

  await expect(page.locator('#eliteChoice')).toBeHidden();
  await expect(page.locator('#roundMode')).toHaveText('Elite');
  const state = await page.evaluate(() => window.__ELITE_ROUND_DEBUG__.getState());
  expect(state.awaitingChoice).toBe(false);
  expect(state.masteryChoice).toBe('elite');
  expect(state.active).toBe(true);
  expect(await page.evaluate(() => window.GameDifficulty.maxBallSpeedForRound(7))).toBeCloseTo(8.9, 8);
  expect(await page.evaluate(() => window.__COMBO_DEBUG__.getWindowMs())).toBe(2500);
});

test('manter normal preserva o modo durante um streak perfeito sem repetir a escolha', async ({ page }) => {
  await page.goto('/');
  await unlockEliteChoice(page);
  await page.locator('#standardModeButton').click();

  await setHudState(page, 7, 5);

  await expect(page.locator('#eliteChoice')).toBeHidden();
  await expect(page.locator('#roundMode')).toHaveText('Normal');
  const state = await page.evaluate(() => window.__ELITE_ROUND_DEBUG__.getState());
  expect(state.awaitingChoice).toBe(false);
  expect(state.masteryChoice).toBe('standard');
  expect(state.active).toBe(false);
  expect(await page.evaluate(() => window.GameDifficulty.maxBallSpeedForRound(7))).toBeCloseTo(8.4, 8);
  expect(await page.evaluate(() => window.__COMBO_DEBUG__.getWindowMs())).toBe(2000);
});

test('continuar normal preserva o baseline mesmo após desbloquear elite', async ({ page }) => {
  await page.goto('/');
  await unlockEliteChoice(page);

  await page.locator('#standardModeButton').click();

  await expect(page.locator('#eliteChoice')).toBeHidden();
  await expect(page.locator('#roundMode')).toHaveText('Normal');
  expect(await page.evaluate(() => window.GameDifficulty.maxBallSpeedForRound(6))).toBeCloseTo(8.2, 8);
  expect(await page.evaluate(() => window.__COMBO_DEBUG__.getWindowMs())).toBe(2000);
});

test('perder vida encerra elite imediatamente no mesmo round', async ({ page }) => {
  await page.goto('/');
  await unlockEliteChoice(page);
  await page.locator('#eliteModeButton').click();
  await expect(page.locator('#roundMode')).toHaveText('Elite');

  await page.evaluate(() => {
    document.getElementById('lives').textContent = '4';
  });
  await page.waitForTimeout(0);

  await expect(page.locator('#roundMode')).toHaveText('Normal');
  const state = await page.evaluate(() => window.__ELITE_ROUND_DEBUG__.getState());
  expect(state.masteryChoice).toBe(null);
  expect(state.active).toBe(false);
  expect(state.awaitingChoice).toBe(false);
  expect(await page.evaluate(() => window.GameDifficulty.maxBallSpeedForRound(6))).toBeCloseTo(8.2, 8);
  expect(await page.evaluate(() => window.__COMBO_DEBUG__.getWindowMs())).toBe(2000);
  expect(await page.evaluate(() => window.__COMBO_DEBUG__.getMaxMultiplier())).toBe(5);
});

test('perder vida encerra o streak elite e remove a elegibilidade na rodada seguinte mesmo recuperando a vida', async ({ page }) => {
  await page.goto('/');
  await unlockEliteChoice(page);
  await page.locator('#eliteModeButton').click();
  await expect(page.locator('#roundMode')).toHaveText('Elite');

  await page.evaluate(() => {
    document.getElementById('lives').textContent = '4';
  });
  await page.waitForTimeout(0);
  await setHudState(page, 7, 5);

  await expect(page.locator('#eliteChoice')).toBeHidden();
  await expect(page.locator('#roundMode')).toHaveText('Normal');
  const state = await page.evaluate(() => window.__ELITE_ROUND_DEBUG__.getState());
  expect(state.masteryChoice).toBe(null);
  expect(state.active).toBe(false);
  expect(await page.evaluate(() => window.GameDifficulty.maxBallSpeedForRound(7))).toBeCloseTo(8.4, 8);
  expect(await page.evaluate(() => window.__COMBO_DEBUG__.getWindowMs())).toBe(2000);
});

test('novo streak perfeito após uma falha volta a oferecer a escolha', async ({ page }) => {
  await page.goto('/');
  await unlockEliteChoice(page);
  await page.locator('#eliteModeButton').click();

  await page.evaluate(() => {
    document.getElementById('lives').textContent = '4';
  });
  await page.waitForTimeout(0);
  await setHudState(page, 7, 5);
  await setHudState(page, 8, 5);

  await expect(page.locator('#eliteChoice')).toBeVisible();
  await expect(page.locator('#roundMode')).toHaveText('Escolher');
  const state = await page.evaluate(() => window.__ELITE_ROUND_DEBUG__.getState());
  expect(state.awaitingChoice).toBe(true);
  expect(state.masteryChoice).toBe(null);
});

test('bônus grande de fim de rodada não é tratado como acerto de combo', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    document.getElementById('score').textContent = '10';
  });
  await page.waitForTimeout(0);
  expect(await page.evaluate(() => window.__COMBO_DEBUG__.getCombo())).toBe(1);

  await page.evaluate(() => {
    document.getElementById('score').textContent = '510';
  });
  await page.waitForTimeout(0);
  expect(await page.evaluate(() => window.__COMBO_DEBUG__.getCombo())).toBe(0);
});