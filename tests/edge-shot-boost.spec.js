const { test, expect } = require('@playwright/test');

test('rebatida perto da borda da raquete recebe pequeno boost de velocidade e feedback audiovisual', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  const initialSpeed = await page.evaluate(() => {
    while (window.__GAME_DEBUG__.getState().respawnGrace > 0) {
      window.__GAME_DEBUG__.step();
    }

    const state = window.__GAME_DEBUG__.getState();
    const x = state.paddle.x + state.paddle.w * 0.9;
    window.__GAME_DEBUG__.setBall({
      x,
      y: state.paddle.y - state.ball.r - 1,
      vx: 2,
      vy: 4
    });
    window.__GAME_DEBUG__.step();
    return Math.hypot(2, 4);
  });

  await page.waitForFunction(() => (
    window.__EDGE_SHOT_BOOST_DEBUG__.getBoostCount() === 1
    && window.__EDGE_SHOT_BOOST_DEBUG__.getSoundFeedbackCount() === 1
    && document.getElementById('game').classList.contains('edge-shot-boost')
  ));

  const result = await page.evaluate(() => {
    const state = window.__GAME_DEBUG__.getState();
    return {
      speed: Math.hypot(state.ball.vx, state.ball.vy),
      vy: state.ball.vy,
      boosts: window.__EDGE_SHOT_BOOST_DEBUG__.getBoostCount(),
      soundFeedback: window.__EDGE_SHOT_BOOST_DEBUG__.getSoundFeedbackCount(),
      scale: window.__EDGE_SHOT_BOOST_DEBUG__.speedScale,
      feedbackActive: document.getElementById('game').classList.contains('edge-shot-boost')
    };
  });

  expect(result.vy).toBeLessThan(0);
  expect(result.boosts).toBe(1);
  expect(result.soundFeedback).toBe(1);
  expect(result.feedbackActive).toBe(true);
  expect(result.speed).toBeCloseTo(initialSpeed * result.scale, 4);
});

test('rebatida central preserva a velocidade normal e não mostra feedback de boost', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  const initialSpeed = await page.evaluate(() => {
    while (window.__GAME_DEBUG__.getState().respawnGrace > 0) {
      window.__GAME_DEBUG__.step();
    }

    const state = window.__GAME_DEBUG__.getState();
    window.__GAME_DEBUG__.setBall({
      x: state.paddle.x + state.paddle.w / 2,
      y: state.paddle.y - state.ball.r - 1,
      vx: 2,
      vy: 4
    });
    window.__GAME_DEBUG__.step();
    return Math.hypot(2, 4);
  });

  await page.waitForTimeout(50);

  const result = await page.evaluate(() => {
    const state = window.__GAME_DEBUG__.getState();
    return {
      speed: Math.hypot(state.ball.vx, state.ball.vy),
      boosts: window.__EDGE_SHOT_BOOST_DEBUG__.getBoostCount(),
      soundFeedback: window.__EDGE_SHOT_BOOST_DEBUG__.getSoundFeedbackCount(),
      feedbackActive: document.getElementById('game').classList.contains('edge-shot-boost')
    };
  });

  expect(result.boosts).toBe(0);
  expect(result.soundFeedback).toBe(0);
  expect(result.feedbackActive).toBe(false);
  expect(result.speed).toBeCloseTo(initialSpeed, 4);
});

test('edge shot respeita o teto expandido de velocidade na rodada 6', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    const drainReadyState = () => {
      while (game.getState().roundTransition > 0) game.step();
      while (game.getState().respawnGrace > 0) game.step();
    };
    const clearCurrentRound = () => {
      drainReadyState();
      game.clearBricksExcept(0);
      game.setBall({ x: 21.6, y: 69, vx: 4, vy: 0 });
      game.step();
    };

    while (game.getState().round < 6) clearCurrentRound();
    drainReadyState();

    const state = game.getState();
    game.setBall({
      x: state.paddle.x + state.paddle.w * 0.9,
      y: state.paddle.y - state.ball.r - 1,
      vx: 4.86,
      vy: 6.48
    });
    game.step();
  });

  await page.waitForFunction(() => (
    window.__EDGE_SHOT_BOOST_DEBUG__.getBoostCount() === 1
  ));

  const result = await page.evaluate(() => {
    const state = window.__GAME_DEBUG__.getState();
    return {
      round: state.round,
      speed: Math.hypot(state.ball.vx, state.ball.vy),
      boosts: window.__EDGE_SHOT_BOOST_DEBUG__.getBoostCount()
    };
  });

  expect(result.round).toBe(6);
  expect(result.boosts).toBe(1);
  expect(result.speed).toBeCloseTo(8.2, 5);
});

