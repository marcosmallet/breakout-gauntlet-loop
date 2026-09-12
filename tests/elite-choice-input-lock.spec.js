const { test, expect } = require('@playwright/test');

async function setHudState(page, round, lives) {
  await page.evaluate(({ round, lives }) => {
    document.getElementById('lives').textContent = String(lives);
    document.getElementById('round').textContent = String(round);
  }, { round, lives });
  await page.waitForTimeout(0);
}

async function openEliteChoice(page) {
  await page.evaluate(() => window.__GAME_DEBUG__.start());
  await setHudState(page, 2, 4);
  await setHudState(page, 3, 5);
  await setHudState(page, 4, 5);
  await setHudState(page, 5, 5);
  await setHudState(page, 6, 5);
}

test('atalho Space respeita o lock de pausa enquanto a escolha Elite está aberta', async ({ page }) => {
  await page.goto('/');
  await openEliteChoice(page);

  const pause = page.locator('#pauseButton');
  await expect(page.locator('#eliteChoice')).toBeVisible();
  await expect(pause).toBeDisabled();
  await expect(pause).toHaveAttribute('aria-pressed', 'true');

  await page.evaluate(() => document.activeElement?.blur());
  await page.keyboard.press('Space');

  await expect(page.locator('#eliteChoice')).toBeVisible();
  await expect(pause).toBeDisabled();
  await expect(pause).toHaveAttribute('aria-pressed', 'true');

  await page.locator('#standardModeButton').click();
  await expect(page.locator('#eliteChoice')).toBeHidden();
  await expect(pause).toBeEnabled();
  await expect(pause).toHaveAttribute('aria-pressed', 'false');
});
