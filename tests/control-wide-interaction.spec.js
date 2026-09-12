const { test, expect } = require('@playwright/test');

function bounceAtOffset(game, offset) {
  const state = game.getState();
  const paddleCenter = state.paddle.x + state.paddle.w / 2;
  game.setBall({
    x: paddleCenter + offset,
    y: state.paddle.y - state.ball.r - 2,
    vx: 0,
    vy: 8
  });
  game.step();
  return game.getState();
}

test('C preserva autoridade direcional quando W amplia a raquete no late game', async ({ page }) => {
  await page.goto('/');

  const result = await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    game.start();
    game.setRoundForTest(7);

    const baseline = bounceAtOffset(game, 30);

    const beforePower = game.getState();
    const catchX = beforePower.paddle.x + beforePower.paddle.w / 2;
    game.spawnPowerDropForTest('wide', catchX, beforePower.paddle.y - 12);
    game.spawnPowerDropForTest('control', catchX, beforePower.paddle.y - 12);
    game.setBall({ x: 400, y: 300, vx: 0, vy: 0 });
    game.step();
    const powered = game.getState();

    const controlled = bounceAtOffset(game, 30);

    return {
      baselineVx: baseline.ball.vx,
      baseWidth: beforePower.paddle.w,
      poweredWidth: powered.paddle.w,
      controlHitsBeforeBounce: powered.controlHits,
      controlledVx: controlled.ball.vx,
      controlHitsAfterBounce: controlled.controlHits,
      controlledSpeed: Math.hypot(controlled.ball.vx, controlled.ball.vy)
    };

    function bounceAtOffset(gameApi, offset) {
      const state = gameApi.getState();
      const paddleCenter = state.paddle.x + state.paddle.w / 2;
      gameApi.setBall({
        x: paddleCenter + offset,
        y: state.paddle.y - state.ball.r - 2,
        vx: 0,
        vy: 8
      });
      gameApi.step();
      return gameApi.getState();
    }
  });

  expect(result.baseWidth).toBe(78);
  expect(result.poweredWidth).toBe(112);
  expect(result.controlHitsBeforeBounce).toBe(4);
  expect(result.controlHitsAfterBounce).toBe(3);
  expect(result.baselineVx).toBeCloseTo(30 / 39 * 5, 4);
  expect(result.controlledVx).toBeCloseTo(30 / 39 * 7, 4);
  expect(result.controlledVx).toBeGreaterThan(result.baselineVx);
  expect(result.controlledSpeed).toBeCloseTo(8, 5);
});

test('C mantém o mesmo contrato de borda do steering para Edge Shot quando W está ativo', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  const baseline = await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    game.setRoundForTest(7);
    const state = game.getState();
    const catchX = state.paddle.x + state.paddle.w / 2;

    game.spawnPowerDropForTest('wide', catchX, state.paddle.y - 12);
    game.spawnPowerDropForTest('control', catchX, state.paddle.y - 12);
    game.setBall({ x: 400, y: 300, vx: 0, vy: 0 });
    game.step();

    const powered = game.getState();
    const paddleCenter = powered.paddle.x + powered.paddle.w / 2;
    game.setBall({
      x: paddleCenter + 30,
      y: powered.paddle.y - powered.ball.r - 2,
      vx: 0,
      vy: 6
    });
    game.step();

    return {
      paddleWidth: powered.paddle.w,
      controlHitsBeforeBounce: powered.controlHits,
      steeringNormalizedOffset: 30 / ((powered.paddle.w - 34) / 2),
      physicalNormalizedOffset: 30 / (powered.paddle.w / 2)
    };
  });

  expect(baseline.paddleWidth).toBe(112);
  expect(baseline.controlHitsBeforeBounce).toBe(4);
  expect(baseline.steeringNormalizedOffset).toBeGreaterThanOrEqual(0.72);
  expect(baseline.physicalNormalizedOffset).toBeLessThan(0.72);

  await page.waitForFunction(() => window.__EDGE_SHOT_BOOST_DEBUG__.getBoostCount() === 1);

  const result = await page.evaluate(() => {
    const state = window.__GAME_DEBUG__.getState();
    return {
      boosts: window.__EDGE_SHOT_BOOST_DEBUG__.getBoostCount(),
      controlHits: state.controlHits,
      speed: Math.hypot(state.ball.vx, state.ball.vy),
      cap: window.GameDifficulty.maxBallSpeedForRound(state.round)
    };
  });

  expect(result.boosts).toBe(1);
  expect(result.controlHits).toBe(3);
  expect(result.speed).toBeCloseTo(6 * 1.06, 4);
  expect(result.speed).toBeLessThanOrEqual(result.cap);
});
