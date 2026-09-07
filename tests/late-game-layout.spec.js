const { test, expect } = require('@playwright/test');

test('oito formações alternam identidade geométrica mantendo 50 blocos', async ({ page }) => {
  await page.goto('/');

  const rounds = await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    game.start();

    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12].map((round) => {
      game.setRoundForTest(round);
      const state = game.getState();
      const bricks = game.getBricks();
      return {
        round,
        layout: state.brickLayout,
        label: state.brickLayoutLabel,
        bricksRemaining: state.bricksRemaining,
        signature: bricks.map((brick) => [
          Math.round(brick.x),
          Math.round(brick.y),
          Math.round(brick.w)
        ]).join('|')
      };
    });
  });

  expect(rounds.map(({ round, layout, label, bricksRemaining }) => ({ round, layout, label, bricksRemaining }))).toEqual([
    { round: 1, layout: 'wall', label: 'Muralha', bricksRemaining: 50 },
    { round: 2, layout: 'stagger', label: 'Escalonada', bricksRemaining: 50 },
    { round: 3, layout: 'channel', label: 'Canal', bricksRemaining: 50 },
    { round: 4, layout: 'funnel', label: 'Funil', bricksRemaining: 50 },
    { round: 5, layout: 'diamond', label: 'Diamante', bricksRemaining: 50 },
    { round: 6, layout: 'waves', label: 'Ondas', bricksRemaining: 50 },
    { round: 7, layout: 'fortress', label: 'Fortaleza', bricksRemaining: 50 },
    { round: 8, layout: 'crossfire', label: 'Fogo cruzado', bricksRemaining: 50 },
    { round: 9, layout: 'wall', label: 'Muralha', bricksRemaining: 50 },
    { round: 11, layout: 'channel', label: 'Canal', bricksRemaining: 50 },
    { round: 12, layout: 'funnel', label: 'Funil', bricksRemaining: 50 }
  ]);

  expect(new Set(rounds.slice(0, 8).map((item) => item.signature)).size).toBe(8);
});

test('canal oferece uma rota central que muralha e funil não oferecem', async ({ page }) => {
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

    return [probe(1), probe(3), probe(4)];
  });

  expect(probes[0].layout).toBe('wall');
  expect(probes[0].after).toBeLessThan(probes[0].before);

  expect(probes[1].layout).toBe('channel');
  expect(probes[1].after).toBe(probes[1].before);
  expect(probes[1].ballY).toBeLessThan(100);

  expect(probes[2].layout).toBe('funnel');
  expect(probes[2].after).toBeLessThan(probes[2].before);
});

test('lifecycle materializa a formação da nova rodada somente após o victory beat', async ({ page }) => {
  await page.goto('/');

  const transition = await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    game.start();
    game.setRoundForTest(2);
    game.clearBricksExcept(0);
    game.setBall({ x: 21.6, y: 69, vx: 4, vy: 0 });
    game.step();
    const afterClear = game.getState();
    game.step(afterClear.roundTransition);
    const prepared = game.getState();
    return { afterClear, prepared };
  });

  expect(transition.afterClear.round).toBe(3);
  expect(transition.afterClear.roundTransition).toBe(54);
  expect(transition.afterClear.bricksRemaining).toBe(0);
  expect(transition.prepared.brickLayout).toBe('channel');
  expect(transition.prepared.bricksRemaining).toBe(50);
  expect(transition.prepared.respawnGrace).toBe(45);
});
