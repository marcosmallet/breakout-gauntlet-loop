const { test, expect } = require('@playwright/test');

function drainReadyState(game) {
  while (game.getState().roundTransition > 0) game.step();
  while (game.getState().respawnGrace > 0) game.step();
}

test('limpar o tabuleiro cria uma janela de vitória antes de preparar a nova rodada', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  const result = await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    while (game.getState().respawnGrace > 0) game.step();

    game.clearBricksExcept(0);
    game.setBall({ x: 21.6, y: 69, vx: 4, vy: 0 });
    game.step();

    const afterClear = game.getState();
    const statusAfterClear = document.getElementById('gameStatus').textContent;

    while (game.getState().roundTransition > 0) game.step();

    return {
      afterClear,
      prepared: game.getState(),
      statusAfterClear,
      statusPrepared: document.getElementById('gameStatus').textContent
    };
  });

  expect(result.afterClear.running).toBe(true);
  expect(result.afterClear.round).toBe(2);
  expect(result.afterClear.score).toBe(310);
  expect(result.afterClear.lives).toBe(4);
  expect(result.afterClear.bricksRemaining).toBe(0);
  expect(result.afterClear.respawnGrace).toBe(0);
  expect(result.afterClear.roundTransition).toBe(54);
  expect(result.afterClear.paddle.w).toBe(102);
  expect(result.statusAfterClear).toBe('Rodada 1 concluída! Bônus +300. Vida extra.');

  expect(result.prepared.roundTransition).toBe(0);
  expect(result.prepared.bricksRemaining).toBe(50);
  expect(result.prepared.respawnGrace).toBe(45);
  expect(result.statusPrepared).toBe('Prepare-se...');

  await expect(page.locator('#game')).toHaveCSS('--round-accent-hue', '243');
  await expect(page.locator('html')).toHaveCSS('--round-accent-hue', '243');
  await expect.poll(() => page.evaluate(() => window.__ROUND_CLEAR_FEEDBACK_DEBUG__.getPulseCount())).toBe(1);
  await expect(page.locator('#game')).toHaveAttribute('data-round-clear-pulse', '1');
});

test('vidas extras de rodada respeitam o limite de cinco e o bônus usa as vidas preservadas', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  const result = await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    const drainReadyState = () => {
      while (game.getState().roundTransition > 0) game.step();
      while (game.getState().respawnGrace > 0) game.step();
    };

    let lastStatus = '';
    for (let clearedRounds = 0; clearedRounds < 3; clearedRounds += 1) {
      drainReadyState();
      game.clearBricksExcept(0);
      game.setBall({ x: 21.6, y: 69, vx: 4, vy: 0 });
      game.step();
      lastStatus = document.getElementById('gameStatus').textContent;
    }

    return { state: game.getState(), lastStatus };
  });

  expect(result.state.round).toBe(4);
  expect(result.state.score).toBe(1230);
  expect(result.state.lives).toBe(5);
  expect(result.state.paddle.w).toBe(86);
  expect(result.state.bricksRemaining).toBe(0);
  expect(result.state.roundTransition).toBe(54);
  expect(result.lastStatus).toBe('Rodada 3 concluída! Bônus +500.');
  await expect(page.locator('#game')).toHaveCSS('--round-accent-hue', '319');
  await expect(page.locator('html')).toHaveCSS('--round-accent-hue', '319');
});
