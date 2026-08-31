const { test, expect } = require('@playwright/test');

test('janela de preparação informa o jogador e limpa a mensagem no lançamento', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  await expect(page.getByRole('status')).toHaveText('Prepare-se...');

  await page.evaluate(() => {
    while (window.__GAME_DEBUG__.getState().respawnGrace > 0) {
      window.__GAME_DEBUG__.step();
    }
  });

  await expect(page.getByRole('status')).toHaveText('');
});
