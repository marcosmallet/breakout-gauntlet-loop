const { test, expect } = require('@playwright/test');

test('HUD mostra quantos blocos faltam na rodada', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#bricksRemaining')).toHaveText('50');

  await page.evaluate(() => {
    window.__GAME_DEBUG__.setBall({
      x: 21.6,
      y: 69,
      vx: 4,
      vy: 0
    });
    window.__GAME_DEBUG__.step();
  });

  await expect(page.locator('#bricksRemaining')).toHaveText('49');
});

test('HUD destaca a reta final quando restam até cinco blocos', async ({ page }) => {
  await page.goto('/');

  const remaining = page.locator('#bricksRemaining');
  await expect(remaining).toHaveAttribute('data-final-stretch', 'false');

  await page.evaluate(() => {
    window.__GAME_DEBUG__.clearBricksExcept(0);
    document.getElementById('score').textContent = '1';
  });

  await expect(remaining).toHaveText('1');
  await expect(remaining).toHaveAttribute('data-final-stretch', 'true');

  await page.getByRole('button', { name: 'Iniciar' }).click();
  await expect(remaining).toHaveText('50');
  await expect(remaining).toHaveAttribute('data-final-stretch', 'false');
});
