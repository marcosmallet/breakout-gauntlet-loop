const { test, expect } = require('@playwright/test');

async function measureKeyboardStep(page, round, elite) {
  return page.evaluate(({ round, elite }) => {
    window.GameDifficulty.setEliteRoundActive(elite);
    window.__GAME_DEBUG__.setRoundForTest(round);
    window.__GAME_DEBUG__.movePaddleTo(300);

    const before = window.__GAME_DEBUG__.getState().paddle.x;
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true
    }));
    window.__GAME_DEBUG__.step();
    document.dispatchEvent(new KeyboardEvent('keyup', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true
    }));

    const state = window.__GAME_DEBUG__.getState();
    return {
      delta: state.paddle.x - before,
      paddleSpeed: state.paddle.speed,
      ballCap: window.GameDifficulty.maxBallSpeedForRound(round)
    };
  }, { round, elite });
}

test('teclado preserva R1 e acompanha o teto de velocidade no late game', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  const early = await measureKeyboardStep(page, 1, false);
  const lateNormal = await measureKeyboardStep(page, 10, false);
  const lateElite = await measureKeyboardStep(page, 10, true);

  await page.evaluate(() => window.GameDifficulty.setEliteRoundActive(false));

  expect(early.ballCap).toBe(8);
  expect(early.paddleSpeed).toBe(8);
  expect(early.delta).toBeCloseTo(8, 6);

  expect(lateNormal.ballCap).toBe(9);
  expect(lateNormal.paddleSpeed).toBe(9);
  expect(lateNormal.delta).toBeCloseTo(9, 6);

  expect(lateElite.ballCap).toBe(9.5);
  expect(lateElite.paddleSpeed).toBe(9.5);
  expect(lateElite.delta).toBeCloseTo(9.5, 6);
});
