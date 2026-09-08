const { test, expect } = require('@playwright/test');

test('round clear separa celebração da contagem de lançamento e antecipa a próxima decisão', async ({ page }) => {
  await page.addInitScript(() => {
    window.__ROUND_TRANSITION_TEXT__ = [];
    const originalFillText = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function fillTextWithCapture(text, ...args) {
      window.__ROUND_TRANSITION_TEXT__.push(String(text));
      return originalFillText.call(this, text, ...args);
    };
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  const afterClear = await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    while (game.getState().respawnGrace > 0) game.step();
    window.__ROUND_TRANSITION_TEXT__ = [];
    game.clearBricksExcept(0);
    game.setBall({ x: 21.6, y: 69, vx: 4, vy: 0 });
    game.step();
    return game.getState();
  });

  expect(afterClear.roundTransition).toBe(54);
  expect(afterClear.respawnGrace).toBe(0);
  expect(afterClear.bricksRemaining).toBe(0);
  await expect(page.getByRole('status')).toHaveText(
    'Rodada 1 concluída! Bônus +300. Vida extra. Próxima: Escalonada • Bola gigante (G).'
  );
  await expect.poll(() => page.evaluate(() => window.__LAUNCH_COUNTDOWN_DEBUG__.getCountdown())).toBe(0);

  const previewText = await page.evaluate(() => window.__ROUND_TRANSITION_TEXT__);
  expect(previewText).toContain('W');
  expect(previewText).toContain('S');
  expect(previewText).toContain('G');
  expect(previewText).toContain('PRÓXIMA 2: Escalonada • Bola gigante (G)');

  const transitionBoundary = await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    const remaining = game.getState().roundTransition;
    game.step(Math.max(0, remaining - 1));
    const beforePreparation = game.getState();
    game.step();
    const prepared = game.getState();
    return { beforePreparation, prepared };
  });

  expect(transitionBoundary.beforePreparation.roundTransition).toBe(1);
  expect(transitionBoundary.beforePreparation.bricksRemaining).toBe(0);
  expect(transitionBoundary.beforePreparation.respawnGrace).toBe(0);

  expect(transitionBoundary.prepared.roundTransition).toBe(0);
  expect(transitionBoundary.prepared.bricksRemaining).toBe(50);
  expect(transitionBoundary.prepared.respawnGrace).toBe(45);
  await expect(page.getByRole('status')).toHaveText('Prepare-se...');
  await expect.poll(() => page.evaluate(() => window.__LAUNCH_COUNTDOWN_DEBUG__.getCountdown())).toBe(3);
});

test('pausa congela a janela de vitória e restaura sua mensagem ao retomar', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    while (game.getState().respawnGrace > 0) game.step();
    game.clearBricksExcept(0);
    game.setBall({ x: 21.6, y: 69, vx: 4, vy: 0 });
    game.step();
  });

  await page.getByRole('button', { name: 'Pausar' }).click();
  const pausedTransition = await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    const before = game.getState().roundTransition;
    game.step(20);
    return { before, after: game.getState().roundTransition };
  });

  expect(pausedTransition.after).toBe(pausedTransition.before);
  await expect(page.getByRole('status')).toHaveText('Pausado.');

  await page.getByRole('button', { name: 'Retomar' }).click();
  await expect(page.getByRole('status')).toHaveText(
    'Rodada 1 concluída! Bônus +300. Vida extra. Próxima: Escalonada • Bola gigante (G).'
  );

  const resumedTransition = await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    const before = game.getState().roundTransition;
    game.step();
    return { before, after: game.getState().roundTransition };
  });
  expect(resumedTransition.after).toBeLessThan(resumedTransition.before);
});
