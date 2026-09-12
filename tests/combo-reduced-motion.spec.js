const { test, expect } = require('@playwright/test');

test('reduced motion troca a barra animada por segundos discretos e congela em pausa', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  await page.evaluate(async () => {
    const game = window.__GAME_DEBUG__;
    game.start();
    game.step(45);
    game.setBall({ x: 400, y: 300, vx: 0, vy: 0 });
    document.getElementById('score').textContent = '10';
    await Promise.resolve();
  });

  const combo = page.locator('#combo');
  await expect(combo).toHaveText('x1 · 2s');
  await expect.poll(() => combo.evaluate((element) =>
    getComputedStyle(element, '::after').animationName
  )).toBe('none');

  await page.waitForTimeout(1100);
  await expect(combo).toHaveText('x1 · 1s');

  await page.getByRole('button', { name: 'Pausar' }).click();
  const pausedText = await combo.textContent();
  await page.waitForTimeout(1200);
  await expect(combo).toHaveText(pausedText);

  await page.getByRole('button', { name: 'Retomar' }).click();
  await expect(combo).toHaveText('x1 · 1s');
  await page.waitForTimeout(1100);
  await expect(combo).toHaveText('x0');
});
