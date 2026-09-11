const { test, expect } = require('@playwright/test');

test('janela de preparação inicial informa o jogador e limpa a mensagem no lançamento', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  await expect(page.getByRole('status')).toHaveText('Prepare-se...');
  expect((await page.evaluate(() => window.__GAME_DEBUG__.getState())).respawnStatus).toBe('Prepare-se...');

  await page.evaluate(() => {
    while (window.__GAME_DEBUG__.getState().respawnGrace > 0) {
      window.__GAME_DEBUG__.step();
    }
  });

  await expect(page.getByRole('status')).toHaveText('');
  expect((await page.evaluate(() => window.__GAME_DEBUG__.getState())).respawnStatus).toBe('');
});

test('perda de vida continua usando preparação genérica, sem briefing de nova rodada', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  const afterLoss = await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    while (game.getState().respawnGrace > 0) game.step();
    game.setBall({ y: 540, vy: 4 });
    game.step();
    return game.getState();
  });

  expect(afterLoss.lives).toBe(2);
  expect(afterLoss.respawnGrace).toBe(45);
  expect(afterLoss.respawnStatus).toBe('Prepare-se...');
  await expect(page.getByRole('status')).toHaveText('Prepare-se...');
});
