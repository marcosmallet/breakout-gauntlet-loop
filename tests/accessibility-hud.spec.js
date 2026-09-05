const { test, expect } = require('@playwright/test');

test('HUD evita anunciar cada mutação de score e preserva anúncio de vidas', async ({ page }) => {
  await page.goto('/');

  const hud = page.locator('.hud');
  await expect(hud).not.toHaveAttribute('aria-live', /.+/);
  await expect(hud).not.toHaveAttribute('aria-atomic', /.+/);

  const livesStatus = page.locator('#lives').locator('..');
  await expect(livesStatus).toHaveAttribute('aria-live', 'polite');
  await expect(livesStatus).toHaveAttribute('aria-atomic', 'true');
});
