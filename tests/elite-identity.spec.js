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

async function readEliteIdentity(page) {
  return page.evaluate(() => ({
    modeColor: getComputedStyle(document.getElementById('roundMode')).color,
    canvasBorder: getComputedStyle(document.getElementById('game')).borderColor,
    canvasShadow: getComputedStyle(document.getElementById('game')).boxShadow
  }));
}

test('Elite mantém identidade visual persistente e volta ao baseline ao perder domínio', async ({ page }) => {
  await page.goto('/');

  const normal = await readEliteIdentity(page);

  await unlockEliteChoice(page);
  await page.locator('#eliteModeButton').click();

  await expect(page.locator('#roundMode')).toHaveText('Elite');
  await expect(page.locator('#roundMode')).toHaveAttribute('data-elite', 'true');
  await expect(page.locator('#game')).toHaveAttribute('data-elite-round', 'true');

  const elite = await readEliteIdentity(page);

  expect(elite.modeColor).not.toBe(normal.modeColor);
  expect(elite.canvasBorder).not.toBe(normal.canvasBorder);
  expect(elite.canvasShadow).not.toBe(normal.canvasShadow);

  await page.evaluate(() => {
    document.getElementById('lives').textContent = '4';
  });
  await page.waitForTimeout(0);

  await expect(page.locator('#roundMode')).toHaveText('Normal');
  await expect(page.locator('#roundMode')).toHaveAttribute('data-elite', 'false');
  await expect(page.locator('#game')).toHaveAttribute('data-elite-round', 'false');

  // The canvas intentionally transitions its border/shadow for 240ms. Validate the
  // settled state rather than sampling an intermediate animation frame.
  await expect.poll(() => readEliteIdentity(page)).toEqual(normal);
});

test('identidade Elite não depende de animação sob reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await unlockEliteChoice(page);
  await page.locator('#eliteModeButton').click();

  await expect(page.locator('#roundMode')).toHaveText('Elite');
  const identity = await page.evaluate(() => ({
    modeColor: getComputedStyle(document.getElementById('roundMode')).color,
    canvasBorder: getComputedStyle(document.getElementById('game')).borderColor,
    transition: getComputedStyle(document.getElementById('game')).transitionDuration
  }));

  expect(identity.modeColor).toBe('rgb(253, 230, 138)');
  expect(identity.canvasBorder).toBe('rgba(250, 204, 21, 0.82)');
  expect(identity.transition).toBe('0s');
});
