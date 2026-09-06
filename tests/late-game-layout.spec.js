const { test, expect } = require('@playwright/test');

test('late game alterna parede e corredor sem alterar quantidade de blocos', async ({ page }) => {
  await page.goto('/');

  const layouts = await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    game.start();

    return [1, 10, 11, 12, 13].map((round) => {
      game.setRoundForTest(round);
      const state = game.getState();
      return {
        round,
        layout: state.brickLayout,
        bricksRemaining: state.bricksRemaining
      };
    });
  });

  expect(layouts).toEqual([
    { round: 1, layout: 'wall', bricksRemaining: 50 },
    { round: 10, layout: 'wall', bricksRemaining: 50 },
    { round: 11, layout: 'channel', bricksRemaining: 50 },
    { round: 12, layout: 'wall', bricksRemaining: 50 },
    { round: 13, layout: 'channel', bricksRemaining: 50 }
  ]);
});

test('corredor de R11 muda a rota acessível em relação à parede de R10/R12', async ({ page }) => {
  await page.goto('/');

  const probes = await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    const canvas = document.getElementById('game');
    game.start();

    function probe(round) {
      game.setRoundForTest(round);
      game.setBall({ x: canvas.width / 2, y: 240, vx: 0, vy: -5 });
      const before = game.getState().bricksRemaining;
      for (let step = 0; step < 35; step += 1) game.step();
      const after = game.getState();
      return {
        round,
        layout: after.brickLayout,
        before,
        after: after.bricksRemaining,
        ballY: after.ball.y
      };
    }

    return [probe(10), probe(11), probe(12)];
  });

  expect(probes[0].layout).toBe('wall');
  expect(probes[0].after).toBeLessThan(probes[0].before);

  expect(probes[1].layout).toBe('channel');
  expect(probes[1].after).toBe(probes[1].before);
  expect(probes[1].ballY).toBeLessThan(100);

  expect(probes[2].layout).toBe('wall');
  expect(probes[2].after).toBeLessThan(probes[2].before);
});

test('transição R10 para R11 materializa o corredor no lifecycle real', async ({ page }) => {
  await page.goto('/');

  const transition = await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    game.start();
    game.setRoundForTest(10);
    game.clearBricksExcept(0);
    game.setBall({ x: 21.6, y: 69, vx: 4, vy: 0 });
    game.step();
    const afterClear = game.getState();
    game.step(afterClear.roundTransition);
    const prepared = game.getState();
    return { afterClear, prepared };
  });

  expect(transition.afterClear.round).toBe(11);
  expect(transition.afterClear.roundTransition).toBe(54);
  expect(transition.afterClear.bricksRemaining).toBe(0);

  expect(transition.prepared.round).toBe(11);
  expect(transition.prepared.roundTransition).toBe(0);
  expect(transition.prepared.brickLayout).toBe('channel');
  expect(transition.prepared.bricksRemaining).toBe(50);
  expect(transition.prepared.respawnGrace).toBe(45);
});
