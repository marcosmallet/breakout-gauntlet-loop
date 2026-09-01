const { test, expect } = require('@playwright/test');

test('atalhos de teclado existentes são expostos para tecnologias assistivas', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#game')).toHaveAttribute(
    'aria-keyshortcuts',
    'ArrowLeft ArrowRight A D Space'
  );
  await expect(page.locator('#pauseButton')).toHaveAttribute('aria-keyshortcuts', 'Space');
});
