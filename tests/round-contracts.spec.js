const { test, expect } = require('@playwright/test');

async function clearRound(page) {
  await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    while (game.getState().respawnGrace > 0) game.step();
    game.clearBricksExcept(0);
    game.setBall({ x: 21.6, y: 69, vx: 4, vy: 0 });
    game.step();
  });
}

test('fim de rodada exige escolha explícita antes de iniciar a próxima', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  await clearRound(page);

  const state = await page.evaluate(() => window.__GAME_DEBUG__.getState());
  expect(state.round).toBe(2);
  expect(state.awaitingRoundChoice).toBe(true);
  expect(state.respawnGrace).toBe(0);
  expect(state.paddle.w).toBe(102);
  expect(state.roundContract).toBe('pending');

  await expect(page.locator('#roundContract')).toHaveText('Escolher');
  await expect(page.locator('#roundChoice')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Padrão' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Risco +50%' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pausar' })).toBeDisabled();
  await expect(page.getByRole('status')).toContainText('Escolha um contrato.');
});

test('contrato Padrão preserva exatamente a progressão base da próxima rodada', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  await clearRound(page);
  await page.getByRole('button', { name: 'Padrão' }).click();

  const state = await page.evaluate(() => window.__GAME_DEBUG__.getState());
  expect(state.round).toBe(2);
  expect(state.roundContract).toBe('standard');
  expect(state.awaitingRoundChoice).toBe(false);
  expect(state.paddle.w).toBe(102);
  expect(state.respawnGrace).toBe(45);

  await expect(page.locator('#roundContract')).toHaveText('Padrão');
  await expect(page.locator('#roundChoice')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Pausar' })).toBeEnabled();
});

test('contrato Risco troca controle por +50% de pontos por bloco e pode ser revisto na rodada seguinte', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  await clearRound(page);
  await page.getByRole('button', { name: 'Risco +50%' }).click();

  const riskStart = await page.evaluate(() => window.__GAME_DEBUG__.getState());
  expect(riskStart.round).toBe(2);
  expect(riskStart.roundContract).toBe('risk');
  expect(riskStart.paddle.w).toBe(90);
  expect(riskStart.respawnGrace).toBe(45);
  await expect(page.locator('#roundContract')).toHaveText('Risco +50%');

  const scoring = await page.evaluate(async () => {
    const game = window.__GAME_DEBUG__;

    while (game.getState().respawnGrace > 0) game.step();

    // Perder uma vida zera qualquer combo carregado da transição de rodada,
    // isolando o valor-base do contrato de risco.
    game.setBall({ x: 400, y: 540, vx: 0, vy: 5 });
    game.step();
    await Promise.resolve();
    while (game.getState().respawnGrace > 0) game.step();

    const before = game.getState().score;
    game.setBall({ x: 50, y: 45, vx: 0, vy: 5 });
    game.step();
    const after = game.getState().score;

    return { before, after, lives: game.getState().lives };
  });

  expect(scoring.lives).toBe(3);
  expect(scoring.after - scoring.before).toBe(15);

  await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    game.clearBricksExcept(0);
    game.setBall({ x: 21.6, y: 69, vx: 4, vy: 0 });
    game.step();
  });

  await expect(page.locator('#round')).toHaveText('3');
  await expect(page.locator('#roundContract')).toHaveText('Escolher');
  await page.getByRole('button', { name: 'Padrão' }).click();

  const nextRound = await page.evaluate(() => window.__GAME_DEBUG__.getState());
  expect(nextRound.round).toBe(3);
  expect(nextRound.roundContract).toBe('standard');
  expect(nextRound.paddle.w).toBe(94);
});
