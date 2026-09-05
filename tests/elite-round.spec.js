const { test, expect } = require('@playwright/test');

async function setHudState(page, round, lives) {
  await page.evaluate(({ round, lives }) => {
    document.getElementById('lives').textContent = String(lives);
    document.getElementById('round').textContent = String(round);
  }, { round, lives });
  await page.waitForTimeout(0);
}

test('domínio tardio no teto de vidas ativa risco e recompensa elite', async ({ page }) => {
  await page.goto('/');

  expect(await page.evaluate(() => window.GameDifficulty.maxBallSpeedForRound(6))).toBeCloseTo(8.2, 8);
  expect(await page.evaluate(() => window.__COMBO_DEBUG__.getWindowMs())).toBe(2000);
  await expect(page.locator('#roundMode')).toHaveText('Normal');

  await setHudState(page, 2, 4);
  await setHudState(page, 3, 5);
  await setHudState(page, 4, 5);
  await setHudState(page, 5, 5);
  await setHudState(page, 6, 5);

  await expect(page.locator('#roundMode')).toHaveText('Elite');
  expect(await page.evaluate(() => window.GameDifficulty.maxBallSpeedForRound(6))).toBeCloseTo(8.7, 8);
  expect(await page.evaluate(() => window.__COMBO_DEBUG__.getWindowMs())).toBe(2500);
});

test('perder vida remove o modo elite na rodada seguinte mesmo recuperando a vida', async ({ page }) => {
  await page.goto('/');

  await setHudState(page, 2, 4);
  await setHudState(page, 3, 5);
  await setHudState(page, 4, 5);
  await setHudState(page, 5, 5);
  await setHudState(page, 6, 5);
  await expect(page.locator('#roundMode')).toHaveText('Elite');

  await page.evaluate(() => {
    document.getElementById('lives').textContent = '4';
  });
  await page.waitForTimeout(0);
  await setHudState(page, 7, 5);

  await expect(page.locator('#roundMode')).toHaveText('Normal');
  expect(await page.evaluate(() => window.GameDifficulty.maxBallSpeedForRound(7))).toBeCloseTo(8.4, 8);
  expect(await page.evaluate(() => window.__COMBO_DEBUG__.getWindowMs())).toBe(2000);
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
