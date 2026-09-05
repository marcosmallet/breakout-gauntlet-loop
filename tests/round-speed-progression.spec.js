const { test, expect } = require('@playwright/test');

test('rodadas posteriores começam com velocidade de bola progressivamente maior', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  const state = await page.evaluate(() => {
    while (window.__GAME_DEBUG__.getState().respawnGrace > 0) {
      window.__GAME_DEBUG__.step();
    }

    const firstRound = window.__GAME_DEBUG__.getState();

    window.__GAME_DEBUG__.clearBricksExcept(0);
    window.__GAME_DEBUG__.setBall({ x: 21.6, y: 69, vx: 4, vy: 0 });
    window.__GAME_DEBUG__.step();
    window.__GAME_DEBUG__.chooseRoundContract('standard');

    const secondRound = window.__GAME_DEBUG__.getState();
    return {
      firstSpeed: Math.hypot(firstRound.ball.vx, firstRound.ball.vy),
      secondSpeed: Math.hypot(secondRound.ball.vx, secondRound.ball.vy),
      round: secondRound.round,
      respawnGrace: secondRound.respawnGrace
    };
  });

  expect(state.round).toBe(2);
  expect(state.respawnGrace).toBeGreaterThan(0);
  expect(state.secondSpeed).toBeGreaterThan(state.firstSpeed);
  expect(state.secondSpeed).toBeCloseTo(Math.hypot(4.25, 4.25), 5);
});

test('progressão tardia continua elevando o teto de velocidade após a rodada 5', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  const result = await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    const drainGrace = () => {
      while (game.getState().respawnGrace > 0) game.step();
    };
    const clearCurrentRound = () => {
      drainGrace();
      game.clearBricksExcept(0);
      game.setBall({ x: 21.6, y: 69, vx: 4, vy: 0 });
      game.step();
      if (game.getState().awaitingRoundChoice) game.chooseRoundContract('standard');
    };

    while (game.getState().round < 5) clearCurrentRound();

    drainGrace();
    game.setBall({ x: 21.6, y: 69, vx: 8, vy: 0 });
    game.step();
    const round5 = {
      round: game.getState().round,
      speed: Math.hypot(game.getState().ball.vx, game.getState().ball.vy)
    };

    game.clearBricksExcept(0);
    game.setBall({ x: 21.6, y: 69, vx: 4, vy: 0 });
    game.step();
    if (game.getState().awaitingRoundChoice) game.chooseRoundContract('standard');

    drainGrace();
    game.setBall({ x: 21.6, y: 69, vx: 8, vy: 0 });
    game.step();
    const round6 = {
      round: game.getState().round,
      speed: Math.hypot(game.getState().ball.vx, game.getState().ball.vy)
    };

    while (game.getState().round < 10) clearCurrentRound();

    drainGrace();
    game.setBall({ x: 21.6, y: 69, vx: 8.95, vy: 0 });
    game.step();
    const round10 = {
      round: game.getState().round,
      speed: Math.hypot(game.getState().ball.vx, game.getState().ball.vy)
    };

    return { round5, round6, round10 };
  });

  expect(result.round5.round).toBe(5);
  expect(result.round5.speed).toBeCloseTo(8, 5);

  expect(result.round6.round).toBe(6);
  expect(result.round6.speed).toBeGreaterThan(8);
  expect(result.round6.speed).toBeCloseTo(8 * 1.012, 5);
  expect(result.round6.speed).toBeLessThanOrEqual(8.2);

  expect(result.round10.round).toBe(10);
  expect(result.round10.speed).toBeCloseTo(9, 5);
});

